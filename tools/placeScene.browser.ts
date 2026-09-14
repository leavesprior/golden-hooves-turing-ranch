import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type Locator, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { DEFAULT_KARMA_STATE } from '../src/lib/karmaStorage'
import { placeSceneFor, WEST_POINT_MAP_EMBED } from '../src/lib/placeSceneAssets'

// Usage: node --import tsx tools/placeScene.browser.ts [base URL] [evidence label] [case-name regex]
// Historical defect capture only: BOBR_ALLOW_EXPLORER_BASELINE=1 with a label
// starting with "baseline". All ordinary runs require persisted XP and journal.
// Fresh browser contexts and published peek URLs only; fixture saves establish
// prior state, never presence, QR access, earned trail completion, or rewards.
const base = process.argv[2] ?? 'http://127.0.0.1:3352'
const label = process.argv[3] ?? 'development'
const allowBaselineFindings = process.env.BOBR_ALLOW_EXPLORER_BASELINE === '1'
if (allowBaselineFindings && !label.startsWith('baseline')) {
  throw new Error('BOBR_ALLOW_EXPLORER_BASELINE is only permitted for an explicitly named baseline capture')
}
const output = `artifacts/place-scene/browser-${label}`
const explorerKey = 'gold_country_explorer_progress'
const fixtures: Record<string, string> = {
  [explorerKey]: JSON.stringify({ totalXP: 7, level: 1, visitedAttractions: [], visitedTowns: ['angels_camp'], unlockedSecrets: [], badges: [], challenges: [], favoriteAttractions: [], streakDays: 1, lastPlayDate: new Date().toISOString().split('T')[0], mysteries: [], historicalDepthScore: 0, historicalDepthLevel: 'Newcomer', journalEntries: [] }),
  golden_frog_local_save: JSON.stringify({ savedAt: '2026-09-01T00:00:00.000Z', state: { ...DEFAULT_STATE, phase: 'traveling', day: 40, distance: 451, food: 270, oxen: 2, wagonLeader: 'Mae Cedar', party: [{ id: 'mae', name: 'Mae Cedar', role: 'leader', health: 83, isSick: false }] } }),
  bobr_ranch_state: JSON.stringify({ unlocked: false, livestock: { pigs: 2 }, feedStock: 17, products: { Eggs: 7 }, gameDay: 70, ownedParcels: ['pine_bench'], soilMetrics: { pine_bench: { quality: 71 } } }),
  bobr_ot_character: JSON.stringify({ name: 'Mae Cedar', level: 2, experience: 17, traits: ['patient'] }),
  oregon_trail_karma_wallet: JSON.stringify({ balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } }),
  bobr_unified_karma: JSON.stringify(DEFAULT_KARMA_STATE),
  bobr_cross_game_progression: JSON.stringify(DEFAULT_CROSS_GAME_STATE),
}
const keys = Object.keys(fixtures)
type Write = { key: string; raw: string | null }
type Snapshot = { values: Record<string, string | null>; writes: Write[] }
type Scenario = { place: 'west_point' | 'bobr_ranch' | 'volcano'; phone?: boolean; blocked?: 'map' | 'photo' }
const scenarios: Scenario[] = [
  { place: 'west_point' }, { place: 'west_point', phone: true },
  { place: 'bobr_ranch' }, { place: 'bobr_ranch', phone: true },
  { place: 'west_point', phone: true, blocked: 'map' },
  { place: 'bobr_ranch', phone: true, blocked: 'photo' },
  { place: 'volcano' },
]
const results: object[] = []
const baselineFindings: object[] = []
let failedCases = 0

async function seed(page: Page) {
  await page.addInitScript({ content: `(() => {
    if (window.top !== window) return;
    const fixtures = ${JSON.stringify(fixtures)};
    const keys = ${JSON.stringify(keys)};
    const nativeGet = Storage.prototype.getItem;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;
    const storage = window.localStorage;
    if (!nativeGet.call(storage, 'place-scene-browser-seeded')) {
      for (const [key, raw] of Object.entries(fixtures)) nativeSet.call(storage, key, raw);
      nativeSet.call(storage, 'place-scene-browser-seeded', 'yes');
    }
    const writes = [];
    window.__placeSceneProbe = { snapshot: () => ({ writes: writes.slice(), values: Object.fromEntries(keys.map(key => [key, nativeGet.call(storage, key)])) }) };
    Storage.prototype.setItem = function(key, raw) {
      if (this === storage && keys.includes(String(key))) writes.push({ key: String(key), raw: String(raw) });
      return nativeSet.call(this, key, raw);
    };
    Storage.prototype.removeItem = function(key) {
      if (this === storage && keys.includes(String(key))) writes.push({ key: String(key), raw: null });
      return nativeRemove.call(this, key);
    };
    Storage.prototype.clear = function() {
      if (this === storage) for (const key of keys) writes.push({ key, raw: null });
      return nativeClear.call(this);
    };
  })();` })
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate('window.__placeSceneProbe.snapshot()')
}

function stable(raw: string | null) {
  const value = JSON.parse(raw ?? 'null')
  // Provider persistence timestamps do not represent gameplay or wallet value.
  if (value && typeof value === 'object') {
    delete value.lastSyncTimestamp
    delete value.lastUpdated
  }
  return value
}

function sameValues(before: Snapshot, after: Snapshot, note: string) {
  for (const key of keys) assert.deepEqual(stable(after.values[key]), stable(before.values[key]), `${note}: ${key}`)
  for (const write of after.writes.slice(before.writes.length)) {
    assert.deepEqual(stable(write.raw), stable(before.values[write.key]), `${note}: no transient state change in ${write.key}`)
  }
}

function donorsPreserved(record: Snapshot) {
  for (const key of ['golden_frog_local_save', 'bobr_ranch_state', 'bobr_ot_character', 'oregon_trail_karma_wallet']) {
    assert.deepEqual(stable(record.values[key]), stable(fixtures[key]), `donor ${key} preserved`)
  }
  const cross = stable(record.values.bobr_cross_game_progression)
  assert.ok(!cross.milestones.some((item: { id: string }) => item.id === 'reached_west_point'), 'peek/view does not complete the Golden Frog Trail')
}

async function imageLoaded(page: Page, locator: Locator) {
  await locator.waitFor({ state: 'visible' })
  const selector = await locator.getAttribute('data-testid')
  const query = selector ? `[data-testid="${selector}"]` : '[data-testid="place-scene-historical"] img'
  await page.waitForFunction(query => {
    const image = document.querySelector(query)
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  }, query)
}

async function layout(page: Page) {
  const value = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }))
  assert.ok(value.documentWidth <= value.width + 1 && value.bodyWidth <= value.width + 1, `no horizontal overflow: ${JSON.stringify(value)}`)
  for (const id of ['place-scene-1849', 'place-scene-today', 'place-scene-painting']) {
    const control = page.getByTestId(id)
    if (await control.isVisible()) {
      const box = await control.boundingBox()
      assert.ok(box && box.height >= 44, `${id} has a 44px touch target`)
      assert.ok(box.x >= -1 && box.x + box.width <= value.width + 1)
    }
  }
  return value
}

async function look(page: Page, scenario: Scenario, id: string) {
  const open = page.getByTestId('place-picture-open')
  await open.click({ position: { x: 12, y: 12 } })
  const dialog = page.getByTestId('place-picture-front')
  await dialog.waitFor({ state: 'visible' })
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()!
  assert.ok(box)
  assert.ok(Math.abs(box.x) < 1 && Math.abs(box.y) < 1 && Math.abs(box.width - viewport.width) < 1 && Math.abs(box.height - viewport.height) < 1, `Look covers viewport, not scene container: ${JSON.stringify(box)}`)
  const img = page.getByTestId('place-picture-front-img')
  await imageLoaded(page, img)
  const dimensions = await img.evaluate(element => {
    const picture = element as HTMLImageElement
    const rect = picture.getBoundingClientRect()
    return { naturalWidth: picture.naturalWidth, naturalHeight: picture.naturalHeight, width: rect.width, height: rect.height, imageRendering: getComputedStyle(picture).imageRendering }
  })
  if (scenario.place === 'bobr_ranch') {
    assert.equal(dimensions.naturalWidth, 320)
    assert.equal(dimensions.naturalHeight, 180)
    assert.ok(dimensions.width > 320 && dimensions.height > 180, 'oak art enlarges beyond its source dimensions')
    assert.ok(Math.abs(dimensions.width / dimensions.height - 16 / 9) < 0.01)
    assert.equal(dimensions.imageRendering, 'pixelated')
  }
  await page.screenshot({ path: `${output}/${id}-look.png` })
  await page.getByTestId('place-picture-close').click()
  await dialog.waitFor({ state: 'detached' })
  await open.click({ position: { x: 12, y: 12 } })
  await dialog.waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
  return { dialog: box, image: dimensions }
}

async function run() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  try {
    for (const scenario of scenarios) {
      const id = `${scenario.place}-${scenario.phone ? 'phone390' : 'desktop'}${scenario.blocked ? `-blocked-${scenario.blocked}` : ''}`
      if (process.argv[4] && !new RegExp(process.argv[4]).test(id)) continue
      const context = await browser.newContext({ viewport: scenario.phone ? { width: 390, height: 844 } : { width: 1365, height: 960 }, isMobile: Boolean(scenario.phone), hasTouch: Boolean(scenario.phone), serviceWorkers: 'block', ignoreHTTPSErrors: process.env.BOBR_BROWSER_LOCAL_TLS === '1' })
      const page = await context.newPage()
      page.setDefaultTimeout(30000)
      const errors: string[] = []
      const consoleErrors: string[] = []
      const blocked: string[] = []
      const mapRequests: string[] = []
      const rewardRequests: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      page.on('request', request => {
        if (request.url().startsWith('https://www.google.com/maps/embed')) mapRequests.push(request.url())
        if (/\/api\/(?:issue-bobr|record-bobr|karma\/event)/.test(request.url())) rewardRequests.push(request.url())
      })
      await page.route('**/api/karma/**', route => route.fulfill({ status: 503, body: '{"error":"local browser fixture"}', contentType: 'application/json' }))
      if (scenario.blocked === 'map') await page.route('https://www.google.com/maps/embed**', route => { blocked.push(route.request().url()); return route.abort('failed') })
      if (scenario.blocked === 'photo') await page.route('**/cabin-photos/cabin-2.jpg', route => { blocked.push(route.request().url()); return route.abort('failed') })
      await seed(page)
      const evidence: Record<string, unknown> = { id, scenario, base, browser: browser.version() }
      try {
        const documentResponse = await page.goto(`${base}/explore?town=${scenario.place}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
        if (process.env.BOBR_BROWSER_PUBLIC_CSP === '1') {
          const policy = documentResponse?.headers()['content-security-policy'] ?? ''
          assert.match(policy, /frame-src https:\/\/www\.google\.com\/maps\/embed;/)
          assert.match(policy, /frame-ancestors 'none'/, 'exercise public middleware, not the localhost exception')
          await writeFile(`${output}/${id}-response-csp.txt`, policy)
        }
        const town = page.getByTestId('explore-town-face')
        await town.waitFor({ state: 'visible', timeout: 120000 })
        assert.equal(await town.getAttribute('data-town'), scenario.place)
        await page.waitForTimeout(2200)
        const before = await snapshot(page)
        evidence.before = before
        donorsPreserved(before)
        assert.equal(stable(before.values[explorerKey]).totalXP, 7)
        assert.ok(stable(before.values[explorerKey]).visitedTowns.includes('angels_camp'))
        assert.ok(stable(before.values[explorerKey]).visitedTowns.includes(scenario.place))
        if (scenario.place === 'volcano') {
          assert.equal(await page.getByTestId('place-scene').count(), 0, 'unsupported town retains original scene without era overlay')
          await page.getByTestId('explore-spot-vol_canvas_flat').click()
          const interior = page.getByTestId('explore-canvas-interior')
          await interior.waitFor({ state: 'visible' })
          const text = await interior.innerText()
          assert.ok(text.split('\n').length >= 10 && /[#│─+]/.test(text), 'actual authored ASCII room remains readable')
          const box = await interior.boundingBox()
          assert.ok(box && box.height > 100 && box.width > 300)
          evidence.interior = { box, text }
          await layout(page)
          await page.screenshot({ path: `${output}/${id}-ascii.png` })
        } else {
          const scene = placeSceneFor(scenario.place)!
          const panel = page.getByTestId('place-scene')
          assert.equal(await panel.getAttribute('data-place'), scenario.place)
          assert.equal(await panel.getAttribute('data-lat'), scenario.place === 'west_point' ? '38.3965' : '38.3947')
          assert.equal(await panel.getAttribute('data-lng'), '-120.5269')
          assert.equal(await panel.getAttribute('data-era'), '1849')
          assert.equal(await page.getByTestId('place-scene-1849').getAttribute('aria-pressed'), 'true')
          const historical = page.getByTestId('place-scene-historical')
          const historicalImg = historical.locator('img').first()
          await imageLoaded(page, historicalImg)
          assert.equal(await historicalImg.getAttribute('src'), scene.historical.src)
          assert.equal(await historicalImg.getAttribute('alt'), scene.historical.alt)
          assert.ok((await panel.innerText()).includes(scene.historical.notes))
          const historicalBox = await historical.boundingBox()
          assert.ok(historicalBox && historicalBox.width >= 300 && historicalBox.height >= 165, 'historical view remains useful on phone')
          evidence.historicalBox = historicalBox
          evidence.layout = await layout(page)
          await page.screenshot({ path: `${output}/${id}-1849.png` })
          await page.getByTestId('place-scene-today').click()
          assert.equal(await panel.getAttribute('data-era'), 'today')
          assert.equal(await page.getByTestId('place-scene-today').getAttribute('aria-pressed'), 'true')
          assert.equal(await page.getByTestId('place-scene-1849').getAttribute('aria-pressed'), 'false')
          assert.equal(await historical.isVisible(), false, 'historical art and hotspots are hidden in Today')
          const mapLink = page.getByRole('link', { name: 'Open in Google Maps', exact: true })
          const href = await mapLink.getAttribute('href')
          assert.ok(href)
          assert.equal(new URL(href).searchParams.get('query'), `${scene.town.lat},${scene.town.lng}`)
          assert.equal(await mapLink.getAttribute('target'), '_blank')
          assert.match(await mapLink.getAttribute('rel') ?? '', /noopener/)
          if (scenario.place === 'west_point') {
            const map = page.getByTestId('place-scene-map')
            await map.waitFor({ state: 'visible' })
            assert.equal(await map.getAttribute('src'), WEST_POINT_MAP_EMBED)
            assert.equal(await map.getAttribute('title'), 'West Point today — Google Maps')
            const box = await map.boundingBox()
            assert.ok(box && box.width >= 350 && box.height >= 200)
            evidence.map = { box, src: await map.getAttribute('src'), link: href }
            if (scenario.blocked !== 'map') {
              const frame = await (await map.elementHandle())!.contentFrame()
              assert.ok(frame, 'the actual Google embed has a browser frame')
              const copyright = frame.getByText(/Map data ©\d{4}/).first()
              const terms = frame.locator('a').filter({ hasText: /^Terms$/ }).first()
              await copyright.waitFor({ state: 'visible', timeout: 45000 })
              await terms.waitFor({ state: 'visible', timeout: 45000 })
              const attribution = []
              for (const [name, locator] of [['copyright', copyright], ['terms', terms]] as const) {
                const bounds = await locator.boundingBox()
                assert.ok(bounds && bounds.width > 0 && bounds.height > 0)
                assert.ok(bounds.x >= box.x - 1 && bounds.y >= box.y - 1 && bounds.x + bounds.width <= box.x + box.width + 1 && bounds.y + bounds.height <= box.y + box.height + 1, `${name} remains inside the actual iframe viewport`)
                const front = await page.evaluate(point => document.elementFromPoint(point.x, point.y)?.getAttribute('data-testid'), { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
                assert.equal(front, 'place-scene-map', `the application does not cover Google's ${name}`)
                attribution.push({ name, text: await locator.innerText(), bounds })
              }
              const googleImages = await frame.locator('img').evaluateAll(elements => elements.map(element => element as HTMLImageElement).filter(image => /google/i.test(image.alt) || /google.*(?:logo|gray)|logo.*google/i.test(image.src)).map(image => {
                const rect = image.getBoundingClientRect()
                return { alt: image.alt, src: image.src.startsWith('data:') ? `inline image (${image.src.split(',')[0]})` : image.src, complete: image.complete, naturalWidth: image.naturalWidth, width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 && getComputedStyle(image).visibility !== 'hidden' }
              }))
              for (const logo of googleImages.filter(image => image.visible)) assert.ok(logo.complete && logo.naturalWidth > 0, 'visible Google logo is loaded')
              evidence.mapAttribution = { frameUrl: frame.url(), attribution, googleImages }
            }
            assert.ok(mapRequests.length > 0, 'actual iframe navigation requested')
          } else {
            const photo = page.getByTestId('place-scene-photo')
            if (scenario.blocked === 'photo') {
              await page.getByTestId('place-scene-fallback').waitFor({ state: 'visible' })
              assert.match(await page.getByTestId('place-scene-fallback').innerText(), /could not load/)
            } else {
              await imageLoaded(page, photo)
              assert.equal(await photo.getAttribute('src'), '/cabin-photos/cabin-2.jpg')
              assert.match(await photo.getAttribute('alt') ?? '', /present-day ranch house/)
              evidence.photo = await photo.boundingBox()
            }
            await page.screenshot({ path: `${output}/${id}-today-photo.png` })
            await page.getByTestId('place-scene-painting').click()
            await imageLoaded(page, photo)
            assert.equal(scene.modern.kind, 'property_photo')
            if (scene.modern.kind === 'property_photo') assert.equal(await photo.getAttribute('src'), scene.modern.painting)
            assert.match(await panel.innerText(), /Today · Ranch painting/)
            await layout(page)
            await page.screenshot({ path: `${output}/${id}-today-painting.png` })
            await page.getByTestId('place-scene-painting').click()
            if (scenario.blocked === 'photo') await page.getByTestId('place-scene-fallback').waitFor({ state: 'visible' })
            else await imageLoaded(page, photo)
          }
          await layout(page)
          await page.screenshot({ path: `${output}/${id}-today.png` })
          if (scenario.blocked) assert.ok(blocked.length > 0, 'failure injection exercised an actual asset request')
          await page.getByTestId('place-scene-1849').click()
          assert.equal(await historical.isVisible(), true)
          await page.waitForTimeout(1200)
          const afterViews = await snapshot(page)
          sameValues(before, afterViews, 'era/painting controls are presentation only')
          evidence.afterViews = afterViews
          const attraction = scenario.place === 'west_point' ? 'wp_trail_camp' : 'bobr_campfire'
          const spot = page.getByTestId(`explore-spot-${attraction}`)
          const attractionName = await spot.getAttribute('title')
          assert.ok(attractionName)
          await spot.click()
          const heading = page.getByRole('heading', { name: attractionName, exact: true })
          await heading.waitFor({ state: 'visible' })
          await page.waitForTimeout(1500)
          const afterAttraction = await snapshot(page)
          evidence.afterAttraction = afterAttraction
          // This checks the real existing visit path, independently of era state.
          const savedVisit = stable(afterAttraction.values[explorerKey])
          const entries = savedVisit.journalEntries.filter((entry: { id: string }) => entry.id.startsWith(`attraction_${attraction}_`))
          evidence.attractionPersisted = savedVisit.totalXP === 22
            && savedVisit.visitedAttractions.filter((visited: string) => visited === attraction).length === 1
            && entries.length === 1
          if (!evidence.attractionPersisted) {
            const finding = { id, finding: 'An actual first attraction visit must persist XP 7→22, one visited-attraction record, and one journal entry.', savedVisit }
            evidence.persistenceFailure = finding
            if (allowBaselineFindings) baselineFindings.push(finding)
            else assert.fail(finding.finding)
          }
          assert.equal(stable(afterAttraction.values.bobr_unified_karma).history.length, stable(afterViews.values.bobr_unified_karma).history.length + 1, 'real first visit executes the existing action exactly once')
          await page.getByTestId('place-scene-today').click()
          assert.equal(await heading.isVisible(), true, 'selected detail survives era toggle')
          await page.getByTestId('explore-town-verbs').getByRole('button', { name: new RegExp(attractionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click()
          assert.equal(await panel.getAttribute('data-era'), '1849', 'existing bottom verb returns to historical action')
          await page.waitForTimeout(1500)
          const afterRepeat = await snapshot(page)
          sameValues(afterAttraction, afterRepeat, 'repeat visit after view toggle does not duplicate progress')
          donorsPreserved(afterRepeat)
          evidence.afterRepeat = afterRepeat
          evidence.look = await look(page, scenario, id)
          sameValues(afterRepeat, await snapshot(page), 'Look is presentation only')
        }
        assert.deepEqual(errors, [], 'no uncaught application errors')
        assert.ok(!consoleErrors.some(error => /hydration|hydrating|Cannot update a component/.test(error)), 'no hydration or render-update errors')
        assert.deepEqual(rewardRequests, [], 'local view/attraction does not request remote settlement')
        await page.getByRole('button', { name: 'Leave town', exact: true }).click()
        await page.waitForURL('**/hub', { timeout: 60000, waitUntil: 'domcontentloaded' })
        evidence.leaveUrl = page.url()
        evidence.status = 'passed'
        evidence.errors = errors
        evidence.consoleErrors = consoleErrors
        evidence.blocked = blocked
        evidence.mapRequests = mapRequests
        await writeFile(`${output}/${id}.json`, JSON.stringify(evidence, null, 2))
        results.push(evidence)
        console.log(`PASS ${id}`)
      } catch (error) {
        evidence.status = 'failed'
        evidence.error = error instanceof Error ? error.stack : String(error)
        evidence.errors = errors
        evidence.consoleErrors = consoleErrors
        evidence.snapshot = await snapshot(page).catch(() => null)
        await page.screenshot({ path: `${output}/${id}-failure.png` }).catch(() => {})
        await writeFile(`${output}/${id}-failure.json`, JSON.stringify(evidence, null, 2))
        failedCases++
        results.push(evidence)
        console.error(`FAIL ${id}: ${error instanceof Error ? error.message : String(error)}`)
      } finally { await context.close() }
    }
    assert.ok(results.length > 0, 'the selected case filter must exercise a real scenario')
    await writeFile(`${output}/results.json`, JSON.stringify({ status: failedCases ? 'failed' : baselineFindings.length ? 'passed_with_baseline_findings' : 'passed', base, label, filter: process.argv[4] ?? null, allowBaselineFindings, cases: results.length, failedCases, baselineFindings, results }, null, 2))
    if (failedCases) process.exitCode = 1
  } finally { await browser.close() }
}

run().catch(error => { console.error(error); process.exitCode = 1 })
