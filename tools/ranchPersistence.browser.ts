import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { LIVESTOCK_TYPES } from '../src/app/oregon-trail/data/ranchConfig'
import type { RanchState } from '../src/app/oregon-trail/ranchContext'

// Usage: node --import tsx tools/ranchPersistence.browser.ts [base URL] [evidence label]
// Fresh contexts only. Fixtures are prior saved campaigns, not earned-completion
// claims. The Storage recorder runs before application scripts, including React.
const base = process.argv[2] ?? 'http://127.0.0.1:3350'
const label = process.argv[3] ?? 'development'
const output = `artifacts/ranch-save-startup/${label}`
const ranchKey = 'bobr_ranch_state'
const saveKey = 'golden_frog_local_save'
const walletKey = 'oregon_trail_karma_wallet'
const characterKey = 'bobr_ot_character'
const name = 'Mae Cedar'
const legacy = {
  unlocked: true, location: 'West Point', fenceTier: 1,
  livestock: { pigs: 2, chickens: 3 }, livestockHealth: { pigs: 81 },
  feedStock: '17', products: { Eggs: 7, Milk: 2 }, gameDay: 70, lastProcessedDay: 69,
  ownedParcels: ['pine_bench'], soilMetrics: { pine_bench: { quality: 71 } },
}
const character = {
  name, background: 'pinkerton_veteran',
  stats: { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 },
  traits: [], level: 1, experience: 7, experienceToNextLevel: 100,
  pendingStatPoints: 0, levelUpPending: false,
  investigationProficiency: { witnessInterrogation: 3, crimeSceneAnalysis: 2, suspectIdentification: 1 },
}
const wallet = { balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } }
type Mode = 'legacy' | 'empty' | 'malformed' | 'read-throws'
type Write = { kind: 'set' | 'remove' | 'clear'; raw: string | null }
type Snapshot = { events: Write[]; reads: number; readErrors: number; raw: string | null; character: string | null; wallet: string | null }
const results: object[] = []

async function instrument(page: Page, mode: Mode) {
  const state = {
    ...DEFAULT_STATE, phase: 'town', day: 200, daysOnTrail: 30,
    distance: 102, totalMilesTraveled: 102, currentLandmark: 'Independence, Missouri',
    wagonLeader: name, party: [{ id: 'mae', name, role: 'leader', health: 100, isSick: false }],
    food: 300, ammunition: 100, medicine: 10, spareParts: 5, oxen: 3,
  }
  const fixtures = {
    [saveKey]: JSON.stringify({ savedAt: new Date().toISOString(), state }),
    [characterKey]: JSON.stringify(character), [walletKey]: JSON.stringify(wallet),
    bobr_cross_game_progression: JSON.stringify({ ...DEFAULT_CROSS_GAME_STATE, milestones: mode === 'legacy' ? [{ id: 'reached_west_point', source: 'prospectors_tale', timestamp: '2026-09-01T00:00:00.000Z' }] : [] }),
    'golden-hooves-audio-settings': JSON.stringify({ isMuted: true }),
    bobr_gft_age_mode: 'adult',
  }
  const initialRaw = mode === 'empty' ? null : mode === 'malformed' ? '{"livestock":{"pigs":2},broken-json' : JSON.stringify(legacy)
  // Raw source avoids transpiler helpers leaking into the browser init script.
  // The fixture seed uses native storage before interception and is not an app write.
  await page.addInitScript({ content: `(() => {
    const key = ${JSON.stringify(ranchKey)};
    const fixtures = ${JSON.stringify(fixtures)};
    const initialRaw = ${JSON.stringify(initialRaw)};
    const throws = ${JSON.stringify(mode === 'read-throws')};
    const storage = window.localStorage;
    const nativeGet = Storage.prototype.getItem;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;
    if (nativeGet.call(storage, 'ranch-browser-fixture-seeded') === null) {
      for (const [k, value] of Object.entries(fixtures)) nativeSet.call(storage, k, value);
      if (initialRaw !== null) nativeSet.call(storage, key, initialRaw);
      nativeSet.call(storage, 'ranch-browser-fixture-seeded', 'yes');
    }
    const probe = { events: [], reads: 0, readErrors: 0,
      snapshot: () => ({ events: probe.events.slice(), reads: probe.reads, readErrors: probe.readErrors,
        raw: nativeGet.call(storage, key), character: nativeGet.call(storage, ${JSON.stringify(characterKey)}),
        wallet: nativeGet.call(storage, ${JSON.stringify(walletKey)}) }) };
    Object.defineProperty(window, '__ranchPersistenceProbe', { value: probe });
    Storage.prototype.getItem = function(k) {
      if (this === storage && String(k) === key) {
        probe.reads++;
        if (throws) { probe.readErrors++; throw new DOMException('Fixture denied ranch storage read', 'SecurityError'); }
      }
      return nativeGet.call(this, k);
    };
    Storage.prototype.setItem = function(k, value) {
      if (this === storage && String(k) === key) probe.events.push({ kind: 'set', raw: String(value) });
      return nativeSet.call(this, k, value);
    };
    Storage.prototype.removeItem = function(k) {
      if (this === storage && String(k) === key) probe.events.push({ kind: 'remove', raw: null });
      return nativeRemove.call(this, k);
    };
    Storage.prototype.clear = function() {
      if (this === storage) probe.events.push({ kind: 'clear', raw: null });
      return nativeClear.call(this);
    };
  })();` })
  return initialRaw
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate('window.__ranchPersistenceProbe.snapshot()')
}

async function resume(page: Page, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded' })
  else await page.goto(`${base}/oregon-trail`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout: 60000 })
  await page.getByTestId('title-play').waitFor({ state: 'detached' })
  await page.waitForTimeout(2200)
}

function donorValues(record: Snapshot) {
  const savedWallet = JSON.parse(record.wallet ?? 'null')
  assert.ok(savedWallet)
  delete savedWallet.lastUpdated // Ordinary save/remount metadata, not a wallet value.
  return { character: JSON.parse(record.character ?? 'null'), wallet: savedWallet }
}

function protectedLegacy(state: RanchState, feeds: number[]) {
  assert.equal(state.unlocked, true)
  assert.equal(state.location, legacy.location)
  assert.equal(state.fenceTier, legacy.fenceTier)
  assert.equal(state.livestock.pigs, 2)
  assert.equal(state.livestock.chickens, 3)
  assert.equal(state.livestockHealth.pigs, 81)
  for (const type of Object.keys(LIVESTOCK_TYPES) as Array<keyof RanchState['livestock']>) {
    assert.equal(typeof state.livestock[type], 'number', `${type} count receives its legacy default`)
    assert.ok(Number.isFinite(state.livestock[type]))
    assert.equal(typeof state.livestockHealth[type], 'number')
    assert.ok(Number.isFinite(state.livestockHealth[type]))
  }
  assert.ok(feeds.includes(state.feedStock), `feed must stay in ${feeds}, saw ${state.feedStock}`)
  assert.deepEqual(state.products, legacy.products)
  assert.deepEqual(state.ownedParcels, legacy.ownedParcels)
  assert.deepEqual(state.soilMetrics, legacy.soilMetrics)
  assert.equal(state.gameDay, 70)
  assert.equal(state.lastProcessedDay, 69)
  assert.deepEqual(state.cropPlots, [])
  assert.deepEqual(state.parcelAssignments, {})
}

function verifyWrites(record: Snapshot, mode: Mode, initialRaw: string | null, feeds = [17]) {
  assert.ok(record.reads > 0, 'the mounted provider attempted a storage read')
  if (mode === 'malformed' || mode === 'read-throws') {
    assert.deepEqual(record.events, [], 'failed load cannot write, remove, or clear the unread save')
    assert.equal(record.raw, initialRaw, 'raw existing save survives failed load byte for byte')
    if (mode === 'read-throws') assert.ok(record.readErrors > 0, 'read-failure injection was observed')
    return
  }
  assert.ok(record.events.length > 0, 'observe actual provider persistence, not a vacuous zero-write pass')
  for (const event of record.events) {
    assert.equal(event.kind, 'set', 'startup never removes a farm save')
    assert.ok(event.raw)
    const value = JSON.parse(event.raw)
    if (mode === 'legacy') protectedLegacy(value, feeds)
    else {
      assert.equal(value.unlocked, false, 'a new farm remains locked')
      assert.equal(value.feedStock, 0)
      assert.equal(value.gameDay, 1)
      assert.ok(Object.values(value.livestock).every(count => count === 0))
      assert.deepEqual(value.products, {})
      assert.deepEqual(value.ownedParcels, [])
    }
  }
  assert.ok(record.raw)
  if (mode === 'legacy') protectedLegacy(JSON.parse(record.raw), feeds)
  else assert.equal(JSON.parse(record.raw).unlocked, false)
}

async function buyHay(page: Page) {
  await page.getByRole('button', { name: '🏡 My Farm', exact: true }).click()
  await page.getByRole('button', { name: 'Back to Trail', exact: true }).waitFor()
  await page.getByRole('button', { name: /^💰\s*Market$/ }).click()
  await page.getByRole('button', { name: '10', exact: true }).click()
  await page.getByRole('button', { name: /^Hay Basic feed/ }).click()
  await page.waitForFunction(`JSON.parse(window.__ranchPersistenceProbe.snapshot().raw).feedStock === 27`)
  await page.getByText('Current stock: 27 units', { exact: true }).waitFor()
  await page.screenshot({ path: `${output}/legacy-desktop-purchased-hay.png`, fullPage: true })
  await page.getByRole('button', { name: 'Back to Trail', exact: true }).click()
  await page.waitForFunction(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}) || '{}').state?.phase === 'town'`, undefined, { timeout: 12000 })
}

async function main() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  let activePage: Page | undefined
  let activeScenario = ''
  try {
    const cases: { mode: Mode; viewport: 'desktop' | 'phone390'; mutate?: boolean }[] = [
      { mode: 'legacy', viewport: 'desktop', mutate: true },
      { mode: 'legacy', viewport: 'phone390' },
      { mode: 'empty', viewport: 'desktop' },
      { mode: 'malformed', viewport: 'desktop' },
      { mode: 'read-throws', viewport: 'desktop' },
    ]
    for (const scenario of cases) {
      activeScenario = `${scenario.mode}-${scenario.viewport}`
      console.log('BEGIN', activeScenario)
      const context = await browser.newContext({ viewport: scenario.viewport === 'desktop' ? { width: 1280, height: 960 } : { width: 390, height: 844 }, serviceWorkers: 'block' })
      const page = await context.newPage()
      activePage = page
      const errors: string[] = [], hydration: string[] = [], expectedLoadErrors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => {
        if (/hydration failed|cannot update a component|didn't match/i.test(message.text())) hydration.push(message.text())
        if (/RanchContext.*Failed to load/i.test(message.text())) expectedLoadErrors.push(message.text())
      })
      await page.route('**/api/karma/**', route => route.fulfill({ status: 503, body: '{}' }))
      await page.route('**/api/town-npc**', route => route.fulfill({ status: 503, body: '{}' }))
      const initialRaw = await instrument(page, scenario.mode)
      await resume(page)
      const startup = await snapshot(page)
      verifyWrites(startup, scenario.mode, initialRaw)
      assert.deepEqual(donorValues(startup), { character, wallet })
      if (scenario.mode !== 'legacy') assert.equal(await page.getByRole('button', { name: '🏡 My Farm', exact: true }).count(), 0)
      await page.screenshot({ path: `${output}/${activeScenario}-startup.png`, fullPage: true })
      await resume(page, true)
      const reloaded = await snapshot(page)
      verifyWrites(reloaded, scenario.mode, initialRaw)
      assert.deepEqual(donorValues(reloaded), donorValues(startup))
      assert.equal(reloaded.raw, startup.raw, 'reload preserves the normalized saved ranch')
      const observations: Record<string, Snapshot> = { startup, reloaded }
      if (scenario.mutate) {
        await buyHay(page)
        const purchased = await snapshot(page)
        verifyWrites(purchased, scenario.mode, initialRaw, [17, 27])
        assert.equal(JSON.parse(purchased.raw!).feedStock, 27)
        assert.ok(JSON.parse(purchased.raw!).eventLog.some((event: { event: string }) => event.event === 'Bought 10 Hay'))
        const expectedWallet = { ...wallet, balance: { ...wallet.balance, neutral: 395 } }
        assert.deepEqual(donorValues(purchased), { character, wallet: expectedWallet })
        await resume(page, true)
        const purchaseReloaded = await snapshot(page)
        verifyWrites(purchaseReloaded, scenario.mode, initialRaw, [27])
        assert.equal(purchaseReloaded.raw, purchased.raw)
        assert.deepEqual(donorValues(purchaseReloaded), donorValues(purchased))
        observations.purchased = purchased
        observations.purchaseReloaded = purchaseReloaded
      }
      assert.deepEqual(errors, [], 'no browser runtime exceptions')
      assert.deepEqual(hydration, [], 'no hydration regressions')
      const result = { scenario: activeScenario, base, writes: Object.fromEntries(Object.entries(observations).map(([stage, record]) => [stage, record.events.length])), observations, expectedLoadErrors, actualHayPurchase: !!scenario.mutate, purchaseUnits: scenario.mutate ? 10 : undefined, paid: scenario.mutate ? 5 : undefined }
      results.push(result)
      await writeFile(`${output}/${activeScenario}.json`, JSON.stringify(result, null, 2))
      await writeFile(`${output}/results.json`, JSON.stringify({ status: 'running', base, scenarios: results }, null, 2))
      await context.close()
      activePage = undefined
      console.log('PASS', activeScenario)
    }
    await writeFile(`${output}/results.json`, JSON.stringify({ status: 'passed', base, browser: browser.version(), scope: 'Disposable prior-save fixtures; every ranch write inspected from before application startup; no fresh trail-completion claim.', scenarios: results }, null, 2))
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: `${output}/failure.png`, fullPage: true })
      await writeFile(`${output}/failure.json`, JSON.stringify({ scenario: activeScenario, error: String(error), observation: await snapshot(activePage), text: await activePage.locator('body').innerText() }, null, 2))
    }
    await writeFile(`${output}/results.json`, JSON.stringify({ status: 'failed', base, failedScenario: activeScenario, error: String(error), scenarios: results }, null, 2))
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
