import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { HEALTH_MESSAGES } from '../src/app/oregon-trail/data/eventMessages'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import type { OregonTrailState } from '../src/app/oregon-trail/state/types'

// Disposable saved-campaign fixtures; every ending/crossing is resolved by a
// normal player action. No app hooks, remote Chrome profile, or live user save.
// Usage: node --import tsx tools/passingRiverArt.browser.ts [all|river|passing|companion|regression] [base URL]
const base = process.env.BOBR_BASE_URL ?? process.argv[3] ?? 'http://127.0.0.1:3342'
const group = process.argv[2] ?? 'all'
const output = process.env.BOBR_EVIDENCE ?? `artifacts/passing-river-art/browser${group === 'all' ? '' : `-${group}`}`
const saveKey = 'golden_frog_local_save'
const donorKeys = ['bobr_ot_character', 'oregon_trail_karma_wallet', 'bobr_ranch_state', 'bobr_town_visits', 'bobr_town_visit_last']
const name = 'Mae Cedar'
const stats = { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 }
const results: object[] = []
const viewports = [{ label: 'desktop', width: 1280, height: 960 }, { label: 'phone390', width: 390, height: 844 }]
type Scenario = { label: string; kind: 'town' | 'bridge' | 'river'; method?: 'ford' | 'caulk'; river?: string; random?: number; art: string; blocked?: boolean; companionLast?: boolean; aftermath?: boolean }
const scenarios: Scenario[] = [
  { label: 'town-third-drink', kind: 'town', art: 'grave-town' },
  { label: 'bridge-wrong-name', kind: 'bridge', art: 'grave-trail' },
  { label: 'caulk-drift', kind: 'river', method: 'caulk', river: 'Kansas River Crossing', random: 0.2, art: 'drifting' },
  { label: 'ford-low-mud', kind: 'river', method: 'ford', river: 'Humboldt River', random: 0.2, art: 'mud' },
  { label: 'ford-critical-rocks', kind: 'river', method: 'ford', river: 'Kansas River Crossing', random: 0.01, art: 'rocks' },
  { label: 'ford-normal-drift', kind: 'river', method: 'ford', river: 'Kansas River Crossing', random: 0.2, art: 'drifting' },
  { label: 'bridge-last-companion', kind: 'bridge', art: 'grave-trail', companionLast: true },
  { label: 'caulk-capsize-aftermath', kind: 'river', method: 'caulk', river: 'Kansas River Crossing', random: 0.01, art: 'drifting', aftermath: true },
]

function campaign(scenario: Scenario): OregonTrailState {
  return {
    ...DEFAULT_STATE, phase: scenario.kind === 'town' ? 'town' : 'river',
    day: 200, daysOnTrail: 30, distance: 102, totalMilesTraveled: 102,
    currentLandmark: scenario.kind === 'town' ? 'Independence, Missouri' : scenario.river ?? 'Kansas River Crossing',
    nextLandmark: 'Fort Kearny', milesUntilNextLandmark: 100, wagonLeader: name,
    party: scenario.companionLast ? [
      { id: 'mae-cedar', name, role: 'leader', health: 0, isSick: false },
      { id: 'tess-alder', name: 'Tess Alder', role: 'companion', health: 10, isSick: false },
    ] : [{ id: 'mae-cedar', name, role: 'leader', health: scenario.kind === 'bridge' ? 10 : 100, isSick: false }],
    food: 300, ammunition: 100, medicine: 10, spareParts: 5, oxen: 3, clothing: 3,
    wagonCondition: 100, morale: 80, weather: 'fair', inventory: ['pan_galactic_gargle_blaster'],
    gargleBlasterShots: scenario.kind === 'town' ? 2 : 0,
    hangoverUntilDay: scenario.kind === 'town' ? 204 : 0,
  }
}

async function seed(context: BrowserContext, state: OregonTrailState) {
  const fixtures = {
    [saveKey]: { savedAt: new Date().toISOString(), state },
    bobr_ot_character: { name, background: 'pinkerton_veteran', stats, traits: [], level: 1, experience: 7, experienceToNextLevel: 100, pendingStatPoints: 0, levelUpPending: false, investigationProficiency: { witnessInterrogation: 3, crimeSceneAnalysis: 2, suspectIdentification: 1 } },
    oregon_trail_karma_wallet: { balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } },
    bobr_ranch_state: { unlocked: true, livestock: { pigs: 2, chickens: 3 }, fenceTier: 1, feedStock: 12, products: { Eggs: 3 }, gameDay: 70, cropPlots: [], ownedParcels: ['orchard'], soilMetrics: { meadow: { quality: 71 } } },
    bobr_town_visits: { 'Independence, Missouri': 4, 'West Point': 2 },
    // Prior-campaign milestone exposes the existing deeper-town Character verb.
    // It is fixture history, not a claim that this test earned trail completion.
    bobr_cross_game_progression: { ...DEFAULT_CROSS_GAME_STATE, milestones: [{ id: 'reached_west_point', source: 'prospectors_tale', timestamp: '2026-09-01T00:00:00.000Z' }] },
    prospectors_tale_chapter_progress: { chapter: 'journey_west', currentLocationId: 'independence', discoveredLocations: ['independence'], visitedLocations: ['independence'], visitCounts: { independence: 4 }, totalTravelTime: 0, encountersTriggered: [], easterEggsFound: ['pan_galactic_gargle_blaster'], outlawsCaptured: [], choicesMade: [] },
    'golden-hooves-audio-settings': { isMuted: true },
  }
  await context.addInitScript(fixtures => {
    for (const [key, value] of Object.entries(fixtures)) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value))
    }
    if (localStorage.getItem('bobr_town_visit_last') === null) localStorage.setItem('bobr_town_visit_last', 'Independence, Missouri@200')
    localStorage.setItem('bobr_gft_age_mode', 'adult')
  }, fixtures)
}

async function resume(page: Page) {
  await page.goto(`${base}/oregon-trail`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout: 60000 })
  await page.getByTestId('title-play').waitFor({ state: 'detached', timeout: 30000 })
}

async function saved(page: Page): Promise<OregonTrailState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, saveKey)
}

async function waitSaved(page: Page, phase: string) {
  await page.waitForFunction(({ key, phase }) => JSON.parse(localStorage.getItem(key) ?? '{}').state?.phase === phase, { key: saveKey, phase }, { timeout: 12000 })
  return saved(page)
}

async function donors(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => {
    let value = localStorage.getItem(key)
    // The wallet stamps Date.now() on ordinary mount/save. Compare every wallet
    // value while excluding that write timestamp; other stores stay byte-exact.
    if (key === 'oregon_trail_karma_wallet' && value) {
      const wallet = JSON.parse(value)
      delete wallet.lastUpdated
      value = JSON.stringify(wallet)
    }
    return [key, value]
  })), donorKeys)
}

async function checkPicture(page: Page, scenario: Scenario) {
  const figure = page.getByTestId('trail-outcome-picture')
  await figure.waitFor()
  assert.equal(await figure.getAttribute('data-art'), scenario.art)
  if (scenario.blocked) {
    await page.getByTestId('trail-art-fallback').waitFor()
  } else {
    const img = figure.locator('img')
    await img.waitFor()
    await img.evaluate((element: HTMLImageElement) => {
      if (element.complete && element.naturalWidth > 0) return
      return new Promise<void>((resolve, reject) => {
        element.addEventListener('load', () => resolve(), { once: true })
        element.addEventListener('error', () => reject(new Error(`Missing outcome art: ${element.src}`)), { once: true })
      })
    })
    const pixels = await img.evaluate((element: HTMLImageElement) => ({ width: element.naturalWidth, height: element.naturalHeight, rendering: getComputedStyle(element).imageRendering, alt: element.alt }))
    assert.deepEqual([pixels.width, pixels.height], [320, 180], 'authored art keeps its 320 x 180 pixel grid')
    assert.equal(pixels.rendering, 'pixelated')
    assert.ok(pixels.alt.length > 0, 'scene art has an accessible description')
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal page overflow')
}

async function passing(page: Page, scenario: Scenario, before: Awaited<ReturnType<typeof donors>>) {
  if (scenario.kind === 'town') {
    await page.getByRole('button', { name: /Character/ }).click()
    await page.getByRole('button', { name: /^🎒(?: Luggage)?$/ }).click()
    await page.getByText('Pan Galactic Gargle Blaster (Approximation)', { exact: true }).click()
    await page.getByRole('button', { name: 'Use Item', exact: true }).click()
  } else {
    await page.getByTestId('approach-ancient-bridge').click()
    await page.getByTestId('bridge-keeper-approach').click()
    await page.getByPlaceholder('Speak your answer...').fill('Someone Entirely Else')
    await page.getByRole('button', { name: 'Answer', exact: true }).click()
    await page.getByTestId('bridge-keeper-fail').click()
  }
  await page.getByTestId('passing-screen').waitFor()
  await checkPicture(page, scenario)
  const ended = await waitSaved(page, 'game_over')
  const cause = await page.getByTestId('passing-cause').innerText()
  assert.equal(ended.message, cause, 'memorial uses the actual resolved event cause')
  assert.match(cause, scenario.kind === 'town' ? /third Pan Galactic Gargle Blaster|died of enthusiasm/i : /bridge|gorge|answer/i)
  assert.equal(await page.getByTestId('passing-marker').getAttribute('data-kind'), scenario.kind === 'town' ? 'town' : 'river')
  assert.equal(await page.getByTestId('passing-name').innerText(), scenario.companionLast ? 'Tess Alder' : name)
  assert.ok(HEALTH_MESSAGES.death.includes(await page.getByTestId('passing-epitaph').innerText()), 'epitaph comes from the authored death pool')
  assert.doesNotMatch(await page.getByTestId('passing-screen').innerText(), /game over/i)
  assert.deepEqual(await donors(page), before, 'resolved ending preserves donor saves')
  return { ended, cause }
}

async function continueAsHeir(page: Page, before: Awaited<ReturnType<typeof donors>>, heirScreenshot?: string) {
  await page.getByTestId('passing-lay-to-rest').click()
  await page.getByRole('heading', { name: 'The Name Goes On' }).waitFor()
  assert.equal(await page.getByTestId('passing-heir').innerText(), "Continue as Cedar's heir", 'the existing wagon-leader family owns the heir')
  if (heirScreenshot) await page.screenshot({ path: heirScreenshot, fullPage: true })
  await page.getByTestId('passing-heir').click()
  await page.getByTestId('title-play').waitFor()
  assert.equal(await page.getByTestId('passing-screen').count(), 0)
  assert.deepEqual(await donors(page), before)
  // Advance the existing title/intro controls until normal autosave can record
  // the reset wagon (title and intro intentionally are not autosaved).
  await page.getByTestId('title-play').click()
  await page.getByRole('button', { name: 'Skip', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const reset = await waitSaved(page, 'menu')
  for (const key of ['party', 'food', 'ammunition', 'distance', 'day', 'wagonLeader'] as const) assert.deepEqual(reset[key], DEFAULT_STATE[key], `${key} resets with the wagon`)
  assert.equal(reset.passing, undefined)
  assert.deepEqual(await donors(page), before)
  await resume(page)
  assert.equal((await saved(page)).phase, 'menu')
  assert.deepEqual(await donors(page), before, 'donor saves survive a fresh page after heir reset')
}

async function crossing(page: Page, scenario: Scenario) {
  await page.getByRole('button', { name: 'Examine Crossing Options', exact: true }).click()
  await page.getByRole('button', { name: scenario.method === 'ford' ? /Ford the River/ : /Caulk & Float/ }).click()
  // Hold random only after hydration; this controls the existing d20 resolver.
  // It never selects a resulting phase or dispatches a state action.
  await page.evaluate(`Math.random = () => ${scenario.random}`)
  await page.getByRole('button', { name: 'Attempt Crossing', exact: true }).click()
  await page.getByTestId('river-outcome').waitFor({ timeout: 15000 })
  await checkPicture(page, scenario)
  const text = await page.getByTestId('river-outcome').innerText()
  assert.match(text, scenario.aftermath ? /The wagon capsizes/ : scenario.method === 'caulk' ? /Water gets into the wagon/ : scenario.art === 'rocks' ? /Disaster strikes/ : /crossing went poorly/)
  if (scenario.aftermath) assert.match(await page.getByTestId('trail-outcome-picture').innerText(), /After the capsize:/, 'upright wagon art is explicitly the capsize aftermath')
  assert.equal(await page.getByTestId('passing-screen').count(), 0, 'nonfatal loss remains a crossing outcome')
  assert.doesNotMatch(text, /here lies|lay them to rest|game over/i)
  assert.equal((await saved(page)).phase, 'river', 'effects wait for the normal Continue action')
  return text
}

async function main() {
  assert.ok(['all', 'river', 'passing', 'companion', 'regression'].includes(group), 'optional group is all, river, passing, companion, or regression')
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  let activePage: Page | undefined
  let activeLabel = ''
  try {
    for (const viewport of viewports) {
      const cases = viewport.label === 'phone390' ? [...scenarios, { ...scenarios[0], label: 'town-blocked-art', blocked: true }, { ...scenarios[2], label: 'caulk-blocked-art', blocked: true }] : scenarios
      for (const scenario of cases) {
        if ((scenario.companionLast || scenario.aftermath) && viewport.label !== 'desktop') continue
        if (group === 'river' && scenario.kind !== 'river') continue
        if (group === 'passing' && scenario.kind === 'river') continue
        if (group === 'companion' && !scenario.companionLast) continue
        if (group === 'regression' && !scenario.companionLast && !scenario.aftermath) continue
        activeLabel = `${viewport.label}-${scenario.label}`
        console.log('BEGIN', activeLabel)
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, serviceWorkers: 'block' })
        await seed(context, campaign(scenario))
        const page = await context.newPage()
        activePage = page
        const errors: string[] = [], hydration: string[] = [], blockedArt: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('console', message => { if (/hydration failed|cannot update a component|didn't match/i.test(message.text())) hydration.push(message.text()) })
        await page.route('**/api/karma/**', route => route.fulfill({ status: 503, body: '{}' }))
        await page.route('**/api/town-npc**', route => route.fulfill({ status: 503, body: '{}' }))
        if (scenario.blocked) await page.route(/\/(?:trail-outcomes|passing-river|outcome-art)\//, route => { blockedArt.push(route.request().url()); return route.abort() })
        await resume(page)
        await page.waitForTimeout(2200)
        const before = await donors(page)
        assert.ok(donorKeys.every(key => before[key] !== null), 'each donor store is present before the action')
        assert.equal(JSON.parse(before.bobr_ot_character!).name, name)
        assert.equal(JSON.parse(before.oregon_trail_karma_wallet!).balance.neutral, 400)
        if (scenario.kind !== 'river') assert.equal(JSON.parse(before.bobr_ranch_state!).livestock.pigs, 2)
        let evidence: object
        if (scenario.kind === 'river') {
          const outcomeText = await crossing(page, scenario)
          await page.screenshot({ path: `${output}/${activeLabel}.png`, fullPage: true })
          await page.getByTestId('river-continue').click()
          await page.getByTestId('continue-trail').waitFor()
          const after = await waitSaved(page, 'traveling')
          assert.equal(after.riversCrossed, 1)
          assert.ok(after.party.every(member => member.health > 0))
          assert.ok(after.food < 300 && after.wagonCondition < 100, 'the existing loss resolver applies its costs')
          if (scenario.aftermath) assert.match(after.message ?? '', /After the capsize:/, 'saved outcome retains the aftermath context')
          evidence = { outcomeText, phaseAfterContinue: after.phase, food: after.food, wagonCondition: after.wagonCondition, health: after.party.map(member => member.health) }
        } else {
          const { ended, cause } = await passing(page, scenario, before)
          await page.screenshot({ path: `${output}/${activeLabel}.png`, fullPage: true })
          // Reload the actual terminal save to verify persistent source provenance.
          await resume(page)
          await checkPicture(page, scenario)
          assert.equal(await page.getByTestId('passing-cause').innerText(), cause)
          assert.equal(await page.getByTestId('passing-marker').getAttribute('data-kind'), scenario.kind === 'town' ? 'town' : 'river')
          const heirScreenshot = scenario.companionLast ? `${output}/${activeLabel}-heir.png` : undefined
          await continueAsHeir(page, before, heirScreenshot)
          evidence = { cause, passing: ended.passing, heirOwner: name, heirScreenshot, heirResetAndReload: true, donorKeysPreserved: donorKeys, ignoredMetadata: ['wallet.lastUpdated'] }
        }
        if (scenario.blocked) assert.ok(blockedArt.length > 0, 'fallback was tested with actual blocked asset requests')
        assert.deepEqual(errors, [], 'no browser runtime exceptions')
        assert.deepEqual(hydration, [], 'no hydration or render update regressions')
        results.push({ label: activeLabel, viewport, art: scenario.art, actualPlayerAction: true, blockedArt, screenshot: `${output}/${activeLabel}.png`, ...evidence })
        await writeFile(`${output}/results.json`, JSON.stringify({ status: 'running', scenarios: results }, null, 2))
        await context.close()
        activePage = undefined
        console.log('PASS', activeLabel)
      }
    }
    await writeFile(`${output}/results.json`, JSON.stringify({ status: 'passed', group, base, browser: browser.version(), scope: 'Seeded local campaigns; actual player actions; no full unseeded trail claim.', scenarios: results }, null, 2))
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: `${output}/failure.png`, fullPage: true })
      await writeFile(`${output}/failure.txt`, `${activeLabel}\n${String(error)}\n\n${await activePage.locator('body').innerText()}`)
      await writeFile(`${output}/failure-storage.json`, JSON.stringify({ state: await saved(activePage), donors: await donors(activePage) }, null, 2))
    }
    await writeFile(`${output}/results.json`, JSON.stringify({ status: 'failed', failedScenario: activeLabel, error: String(error), scenarios: results }, null, 2))
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
