import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { DEFAULT_KARMA_STATE } from '../src/lib/karmaStorage'

// node --import tsx tools/localMenuBackend.browser.ts [base] [label] [case regex]
// The server uses explicitly enabled disposable local flags/secret. This harness
// never knows the signing secret. Worker checks are read-only; no payroll data,
// grant values or answers are written to artifacts. Completed saves are fixtures
// of prior progress, not claims of newly earning Golden Frog Trail completion.
const base = process.argv[2] ?? 'http://127.0.0.1:3368'
const label = process.argv[3] ?? 'development'
const output = `artifacts/local-menu-backend/browser-${label}`
const cookieName = 'bobr_local_bridge'
const results: Record<string, unknown>[] = []
const protectedPaths = ['/worker', '/worker/danna', '/api/worker/entries', '/neoma/neoma-slides.pdf']

function fixtures(complete: boolean): Record<string, string> {
  return {
    golden_frog_local_save: JSON.stringify({ savedAt: '2026-09-01T00:00:00Z', state: { ...DEFAULT_STATE, phase: complete ? 'gold_country_arrival' : 'traveling', distance: complete ? 2000 : 451, day: 40, food: 270, oxen: 2, wagonLeader: 'Mae Cedar', party: [{ id: 'mae', name: 'Mae Cedar', health: 83, isSick: false }] } }),
    bobr_ot_character: JSON.stringify({ name: 'Mae Cedar', level: 2, experience: 17, traits: ['patient'] }),
    bobr_ranch_state: JSON.stringify({ unlocked: complete, livestock: { pigs: 2 }, feedStock: 17, products: { Eggs: 7 }, gameDay: 70, ownedParcels: ['pine_bench'], soilMetrics: { pine_bench: { quality: 71 } } }),
    oregon_trail_settlement: JSON.stringify({ propertyTier: 0, buildings: [], buildingsInProgress: [], wagon: null, horses: 2, saddle: null, rifle: null, miningClaims: 1, farmAcres: 7, goldMined: 17, daysInSettlement: 8, reputation: 3, businessTier: 0, businessInProgress: null, businessDailyIncome: 0, hasLeftSettlement: false, isSettlementComplete: false, finalEnding: null }),
    oregon_trail_karma_wallet: JSON.stringify({ balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } }),
    bobr_unified_karma: JSON.stringify(DEFAULT_KARMA_STATE),
    bobr_cross_game_progression: JSON.stringify(DEFAULT_CROSS_GAME_STATE),
  }
}

async function seed(page: Page, complete = false) {
  const data = fixtures(complete)
  await page.addInitScript({ content: `(() => {
    if (window.top !== window) return;
    const data = ${JSON.stringify(data)}, keys = Object.keys(data);
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    if (!get.call(localStorage, 'local-menu-browser-seeded')) {
      for (const [key, value] of Object.entries(data)) set.call(localStorage, key, value);
      set.call(localStorage, 'local-menu-browser-seeded', 'yes');
    }
    const writes = [];
    window.__localMenuProbe = () => ({ values: Object.fromEntries(keys.map(key => [key, get.call(localStorage, key)])), writes });
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && keys.includes(String(key))) writes.push({ key: String(key), value: String(value) });
      return set.call(this, key, value);
    };
  })();` })
}

function stable(raw: string | null) {
  const parsed = JSON.parse(raw ?? 'null')
  if (parsed && typeof parsed === 'object') { delete parsed.lastUpdated; delete parsed.lastSyncTimestamp }
  return parsed
}

async function donors(page: Page, complete = false) {
  const record = await page.evaluate('window.__localMenuProbe()') as { values: Record<string, string | null>; writes: { key: string; value: string }[] }
  const expected = fixtures(complete)
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(stable(record.values[key]), stable(value), `preserve ${key}`)
  for (const write of record.writes) assert.deepEqual(stable(write.value), stable(expected[write.key]), `no transient donor mutation in ${write.key}`)
  return { keys: Object.keys(record.values), writes: record.writes.length, preserved: true }
}

async function layout(page: Page) {
  const bounds = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }))
  assert.ok(bounds.documentWidth <= bounds.width + 1 && bounds.bodyWidth <= bounds.width + 1, 'no page horizontal overflow')
  return bounds
}

async function openHub(page: Page) {
  await page.goto(`${base}/hub`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.getByTestId('hub-play-trail').waitFor({ state: 'visible' })
  await page.waitForTimeout(600)
  const book = new URL((await page.getByRole('link', { name: 'Book', exact: true }).getAttribute('href'))!)
  assert.equal(book.origin, 'https://airbnb.com')
  assert.equal(book.pathname, '/h/backofbeyondranch')
  assert.equal(await page.getByTestId('hub-play-trail').getAttribute('href'), '/oregon-trail')
  assert.equal(await page.locator('a[href^="/dm-table"],a[href^="/worker"],a[href$="neoma-slides.pdf"]').count(), 0, 'no backend links on farm/hub')
}

async function denied(context: BrowserContext, host?: string) {
  const statuses = []
  for (const path of protectedPaths) {
    const response = await context.request.get(`${base}${path}`, { headers: host ? { host } : undefined })
    assert.equal(response.status(), 404, `${path} denies direct access${host ? ` for ${host}` : ''}`)
    statuses.push({ path, status: response.status() })
  }
  return statuses
}

async function main() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  try {
    for (const mode of ['fresh', 'completed', 'qr', 'backend'] as const) for (const phone of [false, true]) {
      if (mode === 'qr' && !phone) continue
      const id = `${mode}-${phone ? 'phone390' : 'desktop'}`
      if (process.argv[4] && !new RegExp(process.argv[4]).test(id)) continue
      const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1365, height: 960 }, hasTouch: phone, isMobile: phone, serviceWorkers: 'block' })
      const page = await context.newPage()
      page.setDefaultTimeout(30000)
      const errors: string[] = [], consoleErrors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      // No external model dependency in a route/menu test. Read-only NPC request.
      await page.route('**/api/neoma/chat', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"reply":"The local mountain listens.","response":"The local mountain listens."}' }))
      await seed(page, mode === 'completed')
      const evidence: Record<string, unknown> = { id, base, label, priorCompletionFixture: mode === 'completed', browser: browser.version() }
      try {
        if (mode === 'fresh' || mode === 'completed') {
          await openHub(page)
          assert.equal(await page.getByTestId('hub-more').count(), mode === 'completed' ? 1 : 0)
          assert.equal(await page.getByTestId('hub-walk-map').count(), 0, 'trail progress does not manufacture QR access')
          if (mode === 'completed') {
            await page.getByTestId('hub-more').locator('summary').click()
            for (const href of ['/adventure/play', '/prologue', '/adventure/where-in-time', '/investigations', '/playtest', '/karma-market', '/game']) {
              assert.equal(await page.getByTestId('hub-more').locator(`a[href="${href}"]`).count(), 1, `preserved mode ${href}`)
            }
            assert.equal(await page.getByTestId('hub-more').getByText('Ranch treasure hunt', { exact: true }).count(), 1)
            assert.equal(await page.getByTestId('hub-more').getByText('Mystery for guests', { exact: true }).count(), 1)
          }
          evidence.layout = await layout(page)
          evidence.donors = await donors(page, mode === 'completed')
          await page.screenshot({ path: `${output}/${id}.png`, fullPage: true })
          await page.reload({ waitUntil: 'domcontentloaded' })
          await page.getByTestId('hub-play-trail').waitFor({ state: 'visible' })
          await page.waitForTimeout(600)
          assert.equal(await page.getByTestId('hub-more').count(), mode === 'completed' ? 1 : 0)
          await donors(page, mode === 'completed')
          if (mode === 'fresh') {
            await page.getByTestId('hub-play-trail').click()
            await page.waitForURL('**/oregon-trail', { waitUntil: 'domcontentloaded' })
            await page.getByRole('button', { name: /Continue/i }).first().waitFor({ state: 'visible' })
            assert.equal(await page.getByRole('button', { name: /My Farm/ }).count(), 0)
          }
        } else if (mode === 'qr') {
          await page.goto(`${base}/explore?qr=ranch-house`, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.waitForTimeout(1500)
          assert.ok((await context.cookies()).some(cookie => cookie.name === 'bobr_explore_qr' && cookie.value === 'ranch-house'), 'actual QR entry persists its existing cookie')
          await openHub(page)
          await page.getByTestId('hub-more').locator('summary').click()
          assert.equal(await page.getByTestId('hub-walk-map').isVisible(), true)
          assert.equal(await page.getByTestId('hub-more').locator('a[href="/karma-market"]').count(), 0, 'QR is not trail victory')
          evidence.donors = await donors(page)
          await page.screenshot({ path: `${output}/${id}.png`, fullPage: true })
          await page.getByTestId('hub-walk-map').click()
          await page.waitForURL('**/explore', { waitUntil: 'domcontentloaded' })
          evidence.layout = await layout(page)
        } else {
          evidence.beforeGrant = await denied(context)
          for (const host of ['backofbeyondranch.farm', 'localhost.evil']) {
            assert.equal((await context.request.get(`${base}/dm-table`, { headers: { host } })).status(), 404)
            await denied(context, host)
          }
          const rejected = await context.request.post(`${base}/api/local-backend/bridge`, { headers: { origin: 'https://evil.example' }, data: { answers: ['42', 'towel', "don't panic", 'african or european'] } })
          assert.equal(rejected.status(), 403)
          assert.equal((await context.cookies()).some(cookie => cookie.name === cookieName), false)
          await page.goto(`${base}/dm-table`, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.getByTestId('bridge-keeper-approach').click()
          await page.getByPlaceholder('Speak your answer...').fill('a wrong answer')
          await page.getByRole('button', { name: 'Answer', exact: true }).click()
          await page.getByTestId('bridge-keeper-fail').click()
          await page.waitForURL('**/hub', { waitUntil: 'domcontentloaded' })
          assert.equal((await context.cookies()).some(cookie => cookie.name === cookieName), false)
          await page.goto(`${base}/dm-table`, { waitUntil: 'domcontentloaded' })
          assert.equal(await page.getByTestId('local-backend-links').count(), 0)
          await page.getByTestId('bridge-keeper-approach').click()
          for (const answer of ['42', 'my towel', "don't panic", phone ? 'European?' : 'African?']) {
            await page.getByPlaceholder('Speak your answer...').fill(answer)
            await page.getByRole('button', { name: 'Answer', exact: true }).click()
          }
          assert.equal(await page.getByTestId('local-backend-links').count(), 0)
          const grantResponse = page.waitForResponse(response => response.url().endsWith('/api/local-backend/bridge') && response.request().method() === 'POST')
          await page.getByTestId('bridge-keeper-cross').click()
          assert.equal((await grantResponse).status(), 200, 'actual Keeper transcript accepted on the server')
          await page.getByRole('button', { name: /I know where my towel is/ }).click()
          await page.getByTestId('local-backend-links').waitFor({ state: 'visible' })
          const grantCookie = (await context.cookies()).find(cookie => cookie.name === cookieName)!
          assert.ok(grantCookie)
          assert.equal(grantCookie.httpOnly, true)
          assert.equal(grantCookie.sameSite, 'Strict')
          assert.ok(grantCookie.expires * 1000 > Date.now() && grantCookie.expires * 1000 <= Date.now() + 260000)
          assert.equal(await page.evaluate(name => document.cookie.includes(name), cookieName), false, 'script cannot read the grant')
          evidence.cookieAttributes = { httpOnly: grantCookie.httpOnly, sameSite: grantCookie.sameSite, secure: grantCookie.secure, secondsRemaining: Math.round(grantCookie.expires - Date.now() / 1000) }
          for (const id of ['local-backend-slides', 'local-backend-worker', 'local-backend-danna']) {
            const box = await page.getByTestId(id).boundingBox()
            assert.ok(box && box.height >= 44, `${id} has a touch target`)
          }
          evidence.layout = await layout(page)
          evidence.donors = await donors(page)
          await page.screenshot({ path: `${output}/${id}-granted.png`, fullPage: true })
          const pdf = await context.request.get(`${base}/neoma/neoma-slides.pdf`)
          assert.equal(pdf.status(), 200)
          assert.match(pdf.headers()['content-type'], /application\/pdf/)
          assert.match(pdf.headers()['cache-control'], /no-store/)
          await page.getByTestId('local-backend-worker').click()
          await page.getByText('Mike Fisher — Work Hours', { exact: true }).waitFor({ state: 'visible' })
          assert.equal((await context.request.get(`${base}/api/worker/entries`)).status(), 200)
          assert.equal((await context.request.get(`${base}/worker/danna`)).status(), 200)
          evidence.workerReadOnly = true
          await context.addCookies([{ ...grantCookie, value: 'forged' }])
          evidence.forgedGrant = await denied(context)
          await context.addCookies([grantCookie])
          evidence.publicHostWithRealGrant = await denied(context, 'backofbeyondranch.farm')
          await donors(page)
        }
        assert.deepEqual(errors, [], 'no uncaught application errors')
        assert.ok(!consoleErrors.some(error => /hydration|hydrating|Cannot update a component/.test(error)), 'no hydration failures')
        evidence.status = 'passed'
        console.log(`PASS ${id}`)
      } catch (error) {
        evidence.status = 'failed'
        evidence.error = error instanceof Error ? error.stack : String(error)
        await page.screenshot({ path: `${output}/${id}-failure.png`, fullPage: true }).catch(() => {})
        console.error(`FAIL ${id}: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        evidence.errors = errors
        // Expected deliberately denied HTTP responses may emit browser console errors.
        evidence.consoleErrors = consoleErrors
        await writeFile(`${output}/${id}.json`, JSON.stringify(evidence, null, 2))
        results.push(evidence)
        await context.close()
      }
    }
    assert.ok(results.length)
    const failedCases = results.filter(result => result.status === 'failed').length
    await writeFile(`${output}/results.json`, JSON.stringify({ status: failedCases ? 'failed' : 'passed', base, label, cases: results.length, failedCases, results }, null, 2))
    if (failedCases) process.exitCode = 1
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
