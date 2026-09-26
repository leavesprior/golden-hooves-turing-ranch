import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { DEFAULT_KARMA_STATE } from '../src/lib/karmaStorage'

// Usage: node --import tsx tools/explorerPersistence.browser.ts [base URL] [label] [case regex]
// Published peek URLs and actual controls only. Prior saves are disposable
// fixtures; no QR/GPS bypass, public hooks, or earned trail/farm claim.
const base = process.argv[2] ?? 'http://127.0.0.1:3354'
const label = process.argv[3] ?? 'development'
const output = `artifacts/explorer-progress-save/browser-${label}`
const key = 'gold_country_explorer_progress'
const priorEntry = { id: 'prior-note', timestamp: 1788220800000, type: 'note', townId: 'angels_camp', title: 'Prior saved note', content: 'Disposable browser fixture: retain this player note.' }
const prior = {
  totalXP: 43, level: 1, visitedAttractions: ['ac_creek_camp'], visitedTowns: ['angels_camp'],
  unlockedSecrets: [], badges: [{ id: 'first_visit', name: 'First Steps', icon: '👣', description: 'Visit your first attraction', rarity: 'common', unlockedAt: 1788220800000 }],
  challenges: [], favoriteAttractions: ['ac_creek_camp'], lastVisitedTown: 'angels_camp',
  streakDays: 3, lastPlayDate: new Date().toISOString().split('T')[0], mysteries: [],
  historicalDepthScore: 3, historicalDepthLevel: 'Newcomer', journalEntries: [priorEntry],
}
const fixtures: Record<string, string> = {
  [key]: JSON.stringify(prior),
  golden_frog_local_save: JSON.stringify({ savedAt: '2026-09-01T00:00:00.000Z', state: { ...DEFAULT_STATE, phase: 'traveling', day: 40, distance: 451, food: 270, oxen: 2, wagonLeader: 'Mae Cedar', party: [{ id: 'mae', name: 'Mae Cedar', role: 'leader', health: 83, isSick: false }] } }),
  bobr_ranch_state: JSON.stringify({ unlocked: false, livestock: { pigs: 2 }, feedStock: 17, products: { Eggs: 7 }, gameDay: 70, ownedParcels: ['pine_bench'], soilMetrics: { pine_bench: { quality: 71 } } }),
  bobr_ot_character: JSON.stringify({ name: 'Mae Cedar', level: 2, experience: 17, traits: ['patient'] }),
  oregon_trail_karma_wallet: JSON.stringify({ balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } }),
  bobr_unified_karma: JSON.stringify(DEFAULT_KARMA_STATE),
  bobr_cross_game_progression: JSON.stringify(DEFAULT_CROSS_GAME_STATE),
}
const keys = Object.keys(fixtures)
type Event = { kind: string; at: number; document: number; key?: string; raw?: string | null; target?: string }
type Snapshot = { values: Record<string, string | null>; events: Event[] }
type Mode = 'debounced-cross-town' | 'rapid-leave-phone390' | 'rapid-reload' | 'rapid-cross-town'
const modes: Mode[] = ['debounced-cross-town', 'rapid-leave-phone390', 'rapid-reload', 'rapid-cross-town']
const results: Record<string, unknown>[] = []

async function instrument(page: Page) {
  await page.addInitScript({ content: `(() => {
    if (window.top !== window) return;
    const fixtures = ${JSON.stringify(fixtures)};
    const keys = ${JSON.stringify(keys)};
    const storage = window.localStorage;
    const session = window.sessionStorage;
    const nativeGet = Storage.prototype.getItem;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;
    if (!nativeGet.call(storage, 'explorer-browser-seeded')) {
      for (const [key, raw] of Object.entries(fixtures)) nativeSet.call(storage, key, raw);
      nativeSet.call(storage, 'explorer-browser-seeded', 'yes');
    }
    const events = JSON.parse(nativeGet.call(session, 'explorer-browser-events') || '[]');
    const documentId = performance.timeOrigin;
    const record = event => {
      events.push({ at: Date.now(), document: documentId, ...event });
      nativeSet.call(session, 'explorer-browser-events', JSON.stringify(events));
    };
    window.__explorerPersistenceProbe = { snapshot: () => ({ values: Object.fromEntries(keys.map(key => [key, nativeGet.call(storage, key)])), events: events.slice() }) };
    Storage.prototype.setItem = function(key, raw) {
      if (this === storage && keys.includes(String(key))) record({ kind: 'set', key: String(key), raw: String(raw) });
      return nativeSet.call(this, key, raw);
    };
    Storage.prototype.removeItem = function(key) {
      if (this === storage && keys.includes(String(key))) record({ kind: 'remove', key: String(key), raw: null });
      return nativeRemove.call(this, key);
    };
    Storage.prototype.clear = function() {
      if (this === storage) for (const key of keys) record({ kind: 'clear', key, raw: null });
      return nativeClear.call(this);
    };
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('button, a') : null;
      if (target) record({ kind: 'click', target: target.getAttribute('data-testid') || target.textContent.trim() });
    }, true);
    window.addEventListener('pagehide', () => record({ kind: 'pagehide' }));
    record({ kind: 'document-start' });
  })();` })
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate('window.__explorerPersistenceProbe.snapshot()')
}

function parsed(record: Snapshot, storageKey = key) {
  return JSON.parse(record.values[storageKey] ?? 'null')
}

function donorValues(record: Snapshot) {
  for (const donor of ['golden_frog_local_save', 'bobr_ranch_state', 'bobr_ot_character', 'oregon_trail_karma_wallet']) {
    const actual = parsed(record, donor)
    if (actual && typeof actual === 'object') delete actual.lastUpdated
    assert.deepEqual(actual, JSON.parse(fixtures[donor]), `unrelated save preserved: ${donor}`)
  }
  assert.ok(!parsed(record, 'bobr_cross_game_progression').milestones.some((milestone: { id: string }) => milestone.id === 'reached_west_point'), 'Explorer interaction does not earn trail completion')
}

function progress(record: Snapshot, attractions: string[]) {
  const saved = parsed(record)
  assert.equal(saved.totalXP, prior.totalXP + 15 * attractions.length, 'actual visits persist their exact existing XP')
  assert.deepEqual(saved.visitedAttractions, [...prior.visitedAttractions, ...attractions], 'each visited attraction persists exactly once')
  assert.deepEqual(saved.favoriteAttractions, prior.favoriteAttractions, 'prior favorite survives unrelated progress writes')
  assert.deepEqual(saved.badges, prior.badges, 'prior badge remains intact')
  assert.equal(saved.historicalDepthScore, prior.historicalDepthScore + attractions.length)
  assert.equal(saved.streakDays, prior.streakDays)
  assert.deepEqual(saved.journalEntries[0], priorEntry)
  assert.equal(saved.journalEntries.length, prior.journalEntries.length + attractions.length, 'one journal entry per actual first visit')
  const expected: Record<string, { town: string; title: string }> = {
    wp_trail_camp: { town: 'west_point', title: 'West Point Road' },
    vol_canvas_flat: { town: 'volcano', title: 'Canvas saloon' },
  }
  for (const attraction of attractions) {
    const entries = saved.journalEntries.filter((entry: { id: string }) => entry.id.startsWith(`attraction_${attraction}_`))
    assert.equal(entries.length, 1, `${attraction} has one persisted journal entry`)
    assert.equal(entries[0].type, 'attraction')
    assert.equal(entries[0].townId, expected[attraction].town)
    assert.equal(entries[0].title, expected[attraction].title)
    assert.ok(entries[0].content.length > 20)
  }
  assert.ok(saved.visitedTowns.includes('angels_camp'))
  assert.ok(saved.visitedTowns.includes('west_point'))
  donorValues(record)
  return saved
}

async function openTown(page: Page, town: string, navigate = true) {
  if (navigate) await page.goto(`${base}/explore?town=${town}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  const face = page.getByTestId('explore-town-face')
  await face.waitFor({ state: 'visible', timeout: 120000 })
  assert.equal(await face.getAttribute('data-town'), town)
  await page.waitForTimeout(1400)
}

async function packRoad(page: Page) {
  await page.getByTestId('explore-spot-wp_trail_camp').click()
  await page.getByRole('heading', { name: 'West Point Road', exact: true }).waitFor({ state: 'visible' })
}

async function nextTown(page: Page) {
  const next = page.getByTestId('explore-interest-next').locator('a')
  assert.equal(await next.getAttribute('href'), '/explore?town=volcano')
  await next.click()
  await page.waitForURL('**/explore?town=volcano', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await openTown(page, 'volcano', false)
}

function rapidEvidence(record: Snapshot) {
  const action = record.events.find(event => event.kind === 'click' && event.target === 'explore-spot-wp_trail_camp')
  assert.ok(action, 'observe a real pack-road click')
  const leaving = record.events.find(event => event.kind === 'pagehide' && event.document === action.document && event.at >= action.at)
  assert.ok(leaving, 'observe actual pagehide from navigation or reload')
  const milliseconds = leaving.at - action.at
  assert.ok(milliseconds < 1000, `navigation exercised the interval before the one-second debounce (${milliseconds}ms)`)
  const latestBeforeLeave = record.events.filter(event => event.kind === 'set' && event.key === key && event.document === action.document && event.at <= leaving.at + 20).at(-1)
  return { milliseconds, action, leaving, latestBeforeLeave }
}

async function run() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  try {
    for (const mode of modes) {
      if (process.argv[4] && !new RegExp(process.argv[4]).test(mode)) continue
      const phone = mode.includes('phone390')
      const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1365, height: 960 }, isMobile: phone, hasTouch: phone, serviceWorkers: 'block' })
      const page = await context.newPage()
      page.setDefaultTimeout(30000)
      const errors: string[] = []
      const consoleErrors: string[] = []
      const rewardRequests: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      page.on('request', request => { if (/\/api\/(?:issue-bobr|record-bobr|karma\/event)/.test(request.url())) rewardRequests.push(request.url()) })
      await page.route('**/api/karma/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"local browser fixture"}' }))
      await instrument(page)
      const evidence: Record<string, unknown> = { mode, base, label, browser: browser.version() }
      try {
        await openTown(page, 'west_point')
        const initial = await snapshot(page)
        evidence.initial = initial
        progress(initial, [])
        await packRoad(page)
        if (mode === 'debounced-cross-town') {
          await page.waitForTimeout(1600)
          const first = await snapshot(page)
          evidence.first = first
          progress(first, ['wp_trail_camp'])
          await packRoad(page)
          await page.waitForTimeout(1300)
          const repeated = await snapshot(page)
          evidence.repeated = repeated
          assert.deepEqual(parsed(repeated), parsed(first), 'repeat visit does not duplicate XP, journal, or other progress')
          assert.deepEqual(parsed(repeated, 'bobr_unified_karma').history, parsed(first, 'bobr_unified_karma').history, 'repeat visit does not duplicate local Karma action')
          await nextTown(page)
          const crossTown = await snapshot(page)
          evidence.crossTown = crossTown
          progress(crossTown, ['wp_trail_camp'])
          assert.ok(parsed(crossTown).visitedTowns.includes('volcano'), 'actual hard navigation keeps both town visits')
          await page.getByTestId('explore-spot-vol_canvas_flat').click()
          await page.getByTestId('explore-canvas-interior').waitFor({ state: 'visible' })
          await page.waitForTimeout(1600)
          const second = await snapshot(page)
          evidence.second = second
          progress(second, ['wp_trail_camp', 'vol_canvas_flat'])
          await page.screenshot({ path: `${output}/${mode}-second-town.png` })
          await page.reload({ waitUntil: 'domcontentloaded' })
          await openTown(page, 'volcano', false)
          const reloaded = await snapshot(page)
          evidence.reloaded = reloaded
          progress(reloaded, ['wp_trail_camp', 'vol_canvas_flat'])
          await page.goBack({ waitUntil: 'domcontentloaded' })
          await openTown(page, 'west_point', false)
          const returned = await snapshot(page)
          evidence.returned = returned
          progress(returned, ['wp_trail_camp', 'vol_canvas_flat'])
          assert.ok(parsed(returned).visitedTowns.includes('volcano'))
        } else {
          if (mode === 'rapid-leave-phone390') {
            await page.getByRole('button', { name: 'Leave town', exact: true }).click()
            await page.waitForURL('**/hub', { waitUntil: 'domcontentloaded', timeout: 120000 })
            await openTown(page, 'west_point')
          } else if (mode === 'rapid-reload') {
            await page.reload({ waitUntil: 'domcontentloaded' })
            await openTown(page, 'west_point', false)
          } else await nextTown(page)
          const returned = await snapshot(page)
          evidence.returned = returned
          evidence.rapid = rapidEvidence(returned)
          progress(returned, ['wp_trail_camp'])
          if (mode === 'rapid-cross-town') assert.ok(parsed(returned).visitedTowns.includes('volcano'))
          await page.reload({ waitUntil: 'domcontentloaded' })
          await openTown(page, mode === 'rapid-cross-town' ? 'volcano' : 'west_point', false)
          const reloaded = await snapshot(page)
          evidence.reloaded = reloaded
          progress(reloaded, ['wp_trail_camp'])
        }
        assert.deepEqual(errors, [], 'no uncaught application errors')
        assert.ok(!consoleErrors.some(error => /hydration|hydrating|Cannot update a component/.test(error)), 'no hydration or render-update errors')
        assert.deepEqual(rewardRequests, [], 'no remote settlement calls')
        await page.screenshot({ path: `${output}/${mode}-complete.png` })
        evidence.status = 'passed'
        console.log(`PASS ${mode}`)
      } catch (error) {
        evidence.status = 'failed'
        evidence.error = error instanceof Error ? error.stack : String(error)
        evidence.failureSnapshot = await snapshot(page).catch(() => null)
        await page.screenshot({ path: `${output}/${mode}-failure.png` }).catch(() => {})
        console.error(`FAIL ${mode}: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        evidence.errors = errors
        evidence.consoleErrors = consoleErrors
        evidence.rewardRequests = rewardRequests
        await writeFile(`${output}/${mode}.json`, JSON.stringify(evidence, null, 2))
        results.push(evidence)
        await context.close()
      }
    }
    assert.ok(results.length > 0, 'at least one selected scenario ran')
    const failedCases = results.filter(result => result.status === 'failed').length
    await writeFile(`${output}/results.json`, JSON.stringify({ status: failedCases ? 'failed' : 'passed', base, label, cases: results.length, failedCases, excludedUi: { favorites: 'Favorite control is in TownDrawer, but drawerOpen has no setter to true in the shipped Explore route. Seeded favorites are preserved; add/remove needs provider tests.', reset: 'resetProgress has no shipped UI caller; reset needs provider tests.' }, results }, null, 2))
    if (failedCases) process.exitCode = 1
  } finally { await browser.close() }
}

run().catch(error => { console.error(error); process.exitCode = 1 })
