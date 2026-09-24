import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { chromium, type BrowserContext, type Locator, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { BACKGROUND_BONUSES, type CharacterBackground, type StatName } from '../src/app/oregon-trail/characterContext'
import type { OregonTrailState } from '../src/app/oregon-trail/state/types'

// Disposable local-save fixtures, then real browser controls. No completion
// milestone, farm unlock, app hooks, live profile, or gameplay RNG override.
// Usage: node --import tsx tools/playerPortraits.browser.ts [base URL] [label] [case regex]
const base = process.argv[2] ?? 'http://127.0.0.1:3358'
const label = process.argv[3] ?? 'development'
assert.ok(/^http:\/\/127\.0\.0\.1:335[89]$/.test(base), 'only isolated portrait QA ports')
assert.ok(/^[a-z0-9-]+$/i.test(label))
const filter = new RegExp(process.argv[4] ?? '')
const output = 'artifacts/player-portraits/browser-' + label
const key = 'golden_frog_local_save'
const characterKey = 'bobr_ot_character'
const name = 'Mae Cedar'
const stats: Record<StatName, number> = { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 }
const roles = Object.keys(BACKGROUND_BONUSES) as CharacterBackground[]
const results: Record<string, unknown>[] = []
const desktop = { width: 1280, height: 960 }
const phone = { width: 390, height: 844 }

function campaign(phase: OregonTrailState['phase'], companionLast = false): OregonTrailState {
  return {
    ...DEFAULT_STATE, phase, wagonLeader: name, day: 120, daysOnTrail: 18,
    distance: phase === 'character_creation' ? 0 : 102, totalMilesTraveled: phase === 'character_creation' ? 0 : 102,
    currentLandmark: phase === 'character_creation' ? 'Independence, Missouri' : 'Kansas River Crossing',
    nextLandmark: 'Fort Kearny', milesUntilNextLandmark: 202,
    party: companionLast ? [
      { id: 'mae', name, role: 'leader', health: 0, isSick: false },
      { id: 'tess', name: 'Tess Alder', role: 'companion', health: 10, isSick: false },
    ] : [{ id: 'mae', name, role: 'leader', health: phase === 'river' ? 10 : 100, isSick: false }],
    food: 300, ammunition: 100, medicine: 10, spareParts: 5, oxen: 3, clothing: 3,
    wagonCondition: 100, morale: 80, weather: 'fair',
  }
}

function character(background: CharacterBackground) {
  return { name, background, stats: { ...stats }, traits: ['eagle_eye'], level: 2, experience: 17, experienceToNextLevel: 100, pendingStatPoints: 0, levelUpPending: false, investigationProficiency: { witnessInterrogation: 3, crimeSceneAnalysis: 2, suspectIdentification: 1 } }
}

async function seed(context: BrowserContext, state: OregonTrailState, background?: CharacterBackground) {
  const fixtures: Record<string, unknown> = {
    [key]: { savedAt: '2026-09-13T00:00:00.000Z', state },
    oregon_trail_karma_wallet: { balance: { neutral: 400, good: 12, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } },
    bobr_cross_game_progression: DEFAULT_CROSS_GAME_STATE,
    bobr_town_visits: { 'Fort Kearny': 2 },
    'golden-hooves-audio-settings': { isMuted: true },
  }
  if (background) fixtures[characterKey] = character(background)
  await context.addInitScript(fixtures => {
    if (window.top !== window || localStorage.getItem('portrait-qa-seeded')) return
    for (const [key, value] of Object.entries(fixtures)) localStorage.setItem(key, JSON.stringify(value))
    localStorage.setItem('bobr_gft_age_mode', 'adult')
    localStorage.setItem('portrait-qa-seeded', 'disposable fixture, no earned progression')
  }, fixtures)
}

async function resume(page: Page) {
  await page.goto(base + '/oregon-trail', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout: 90000 })
  await page.getByTestId('title-play').waitFor({ state: 'detached' })
}

async function readCharacter(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), characterKey)
}

async function waitPhase(page: Page, phase: string) {
  await page.waitForFunction(({ key, phase }) => JSON.parse(localStorage.getItem(key) ?? '{}').state?.phase === phase, { key, phase }, { timeout: 15000 })
}

async function imageEvidence(portrait: Locator, background: CharacterBackground) {
  await portrait.waitFor({ state: 'visible' })
  assert.equal(await portrait.getAttribute('data-background'), background)
  const img = portrait.locator('img')
  await img.waitFor()
  await img.evaluate(async (element: HTMLImageElement) => { await element.decode() })
  const seen = await img.evaluate((element: HTMLImageElement) => ({
    path: new URL(element.src).pathname, width: element.naturalWidth, height: element.naturalHeight,
    rendering: getComputedStyle(element).imageRendering, alt: element.alt,
  }))
  assert.equal(seen.path, '/sprites/player-backgrounds/' + background + '.png')
  assert.deepEqual([seen.width, seen.height], [96, 128])
  assert.equal(seen.rendering, 'pixelated')
  assert.ok(seen.alt.includes('portrait'))
  return seen
}

async function noOverflow(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal page overflow')
}

async function noEarnedCompletion(page: Page) {
  const milestones = await page.evaluate(() => JSON.parse(localStorage.getItem('bobr_cross_game_progression') ?? '{}').milestones ?? [])
  assert.ok(!milestones.some((m: { id: string }) => m.id === 'reached_west_point'), 'portrait QA does not earn completion')
}

async function openSheet(page: Page) {
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await page.getByRole('button', { name: 'Close character sheet', exact: true }).waitFor()
}

async function createAndReload(page: Page, background: CharacterBackground, mobile: boolean, blocked = false) {
  await page.getByTestId('saddle-background-' + background).waitFor()
  const inspected = []
  // The mobile case visits all seven choices; desktop cases complete each role individually.
  for (const role of mobile ? roles : [background]) {
    const choice = page.getByTestId('saddle-background-' + role)
    if (mobile) await choice.tap()
    else { await choice.focus(); await page.keyboard.press(role === 'frontier_scout' ? 'Space' : 'Enter') }
    assert.equal(await choice.getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('[data-testid^="saddle-background-"][aria-pressed="true"]').count(), 1)
    const box = await choice.boundingBox()
    assert.ok(box && box.height >= 44 && box.width >= 44)
    if (blocked && role === background) await choice.getByTestId('player-portrait-fallback').waitFor()
    else inspected.push(await imageEvidence(choice.getByTestId('player-portrait'), role))
    for (const stat of Object.keys(stats) as StatName[]) {
      const actual = await page.getByTestId('saddle-plus-' + stat).evaluate(button => Number(button.previousElementSibling?.textContent))
      assert.equal(actual, 5 + (BACKGROUND_BONUSES[role][stat] ?? 0), role + ' UI bonus for ' + stat)
    }
  }
  const choice = page.getByTestId('saddle-background-' + background)
  if (mobile) await choice.tap()
  else { await choice.focus(); await page.keyboard.press('Enter') }
  await noOverflow(page)
  await page.screenshot({ path: output + '/' + activeLabel + '-creation.png', fullPage: true })
  await page.getByTestId('saddle-standard').click()
  const expected = Object.fromEntries(Object.keys(stats).map(stat => [stat, 7 + (BACKGROUND_BONUSES[background][stat as StatName] ?? 0)]))
  await page.getByTestId('saddle-begin').click()
  await page.getByTestId('town-continue').waitFor()
  const created = await readCharacter(page)
  assert.equal(created.name, name)
  assert.equal(created.background, background)
  assert.deepEqual(created.stats, expected, 'created character retains exact on-screen allocation and bonuses')
  await page.getByTestId('town-continue').click()
  await page.getByTestId('continue-trail').waitFor()
  await openSheet(page)
  const portrait = page.getByTestId('sheet-player-portrait')
  if (blocked) await portrait.getByTestId('player-portrait-fallback').waitFor()
  else await imageEvidence(portrait, background)
  assert.ok((await portrait.locator('..').innerText()).includes(name))
  await noOverflow(page)
  await page.screenshot({ path: output + '/' + activeLabel + '-sheet.png', fullPage: true })
  await page.getByRole('button', { name: 'Close character sheet', exact: true }).click()
  await waitPhase(page, 'traveling')
  await resume(page)
  await openSheet(page)
  if (blocked) {
    const fallback = page.getByTestId('sheet-player-portrait').getByTestId('player-portrait-fallback')
    await fallback.waitFor()
    assert.ok((await fallback.getAttribute('aria-label'))?.includes(name))
    assert.equal(await fallback.innerText(), '⚕')
  } else await imageEvidence(page.getByTestId('sheet-player-portrait'), background)
  assert.deepEqual(await readCharacter(page), created, 'full saved character survives real reload unchanged')
  await noEarnedCompletion(page)
  if (blocked) {
    await page.unroute('**/sprites/player-backgrounds/doctor.png')
    await resume(page)
    await openSheet(page)
    await imageEvidence(page.getByTestId('sheet-player-portrait'), background)
    assert.equal(await page.getByTestId('player-portrait-fallback').count(), 0, 'asset recovery after reload restores the player face')
    assert.deepEqual(await readCharacter(page), created)
    await page.screenshot({ path: output + '/' + activeLabel + '-recovered.png', fullPage: true })
  }
  return { inspected, created, sheetAfterReload: true, input: mobile ? 'touch' : 'keyboard Enter/Space', blocked, recoveredAfterUnblock: blocked }
}

async function bridgeAndPassing(page: Page, background: CharacterBackground, companionLast: boolean, mobile: boolean) {
  await page.getByTestId('approach-ancient-bridge').click()
  const seen = await imageEvidence(page.getByTestId('bridge-player-portrait'), background)
  assert.ok(seen.alt.includes(name))
  const dialog = page.getByRole('heading', { name: 'The Bridge of Death', exact: true }).locator('../..')
  const scrolling = await dialog.evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight, overflow: getComputedStyle(element).overflowY }))
  assert.equal(scrolling.overflow, 'auto')
  let scrolledPixels = 0
  if (mobile) {
    assert.ok(scrolling.scroll > scrolling.client, 'short phone exercises real dialog overflow')
    await dialog.hover()
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(250)
    scrolledPixels = await dialog.evaluate(element => element.scrollTop)
    assert.ok(scrolledPixels > 0, 'the dialog actually scrolls to its controls')
  }
  await noOverflow(page)
  await page.screenshot({ path: output + '/' + activeLabel + '-bridge.png', fullPage: true })
  const approach = page.getByTestId('bridge-keeper-approach')
  if (mobile) await approach.tap()
  else await approach.click()
  await page.getByPlaceholder('Speak your answer...').fill('Someone Entirely Else')
  await page.getByRole('button', { name: 'Answer', exact: true }).click()
  await page.getByTestId('bridge-keeper-fail').scrollIntoViewIfNeeded()
  const acceptBox = await page.getByTestId('bridge-keeper-fail').boundingBox()
  assert.ok(acceptBox && acceptBox.y >= 0 && acceptBox.y + acceptBox.height <= page.viewportSize()!.height, 'mobile failure control can be scrolled into the viewport')
  const before = await readCharacter(page)
  await page.getByTestId('bridge-keeper-fail').click()
  await page.getByTestId('passing-screen').waitFor()
  await waitPhase(page, 'game_over')
  assert.equal(await page.getByTestId('passing-name').innerText(), companionLast ? 'Tess Alder' : name)
  if (companionLast) {
    assert.equal(await page.getByTestId('passing-memorial-portrait').count(), 0)
    await imageEvidence(page.getByTestId('passing-family-portrait').getByTestId('player-portrait'), background)
    assert.match(await page.getByTestId('passing-family-portrait').innerText(), /Family portrait · Mae Cedar/)
    assert.equal(await page.getByTestId('passing-marker').locator('img[src*="player-backgrounds"]').count(), 0, 'player is never pictured inside companion memorial')
  } else await imageEvidence(page.getByTestId('passing-memorial-portrait'), background)
  assert.deepEqual(await readCharacter(page), before)
  await noOverflow(page)
  await page.screenshot({ path: output + '/' + activeLabel + '-passing.png', fullPage: true })
  const cause = await page.getByTestId('passing-cause').innerText()
  await resume(page)
  assert.equal(await page.getByTestId('passing-cause').innerText(), cause)
  if (companionLast) assert.equal(await page.getByTestId('passing-memorial-portrait').count(), 0)
  else await imageEvidence(page.getByTestId('passing-memorial-portrait'), background)
  await page.getByTestId('passing-lay-to-rest').click()
  await imageEvidence(page.getByTestId('passing-family-portrait').getByTestId('player-portrait'), background)
  assert.equal(await page.getByTestId('passing-heir').innerText(), "Continue as Cedar's heir")
  await page.screenshot({ path: output + '/' + activeLabel + '-heir.png', fullPage: true })
  await page.getByTestId('passing-heir').click()
  // 2026-09-23: the heir continues the run on the trail (CONTINUE_AS_HEIR), not the title.
  await page.getByTestId('passing-screen').waitFor({ state: 'detached' })
  assert.deepEqual(await readCharacter(page), before, 'the heir preserves the existing donor character')
  await noEarnedCompletion(page)
  return { bridge: seen, scrolling, scrolledPixels, cause, companionLast, actualWrongAnswerResolvedDeath: true, preservedHeirOwner: name }
}

const sourcePaths = [
  'src/app/oregon-trail/data/playerPortraits.ts', 'src/app/oregon-trail/data/passingPlayerPortrait.ts',
  'src/app/oregon-trail/components/PlayerPortrait.tsx', 'src/app/oregon-trail/components/CharacterSheet.tsx',
  'src/app/oregon-trail/components/BridgeKeeper.tsx', 'src/app/oregon-trail/components/RiverCrossing.tsx',
  'src/app/oregon-trail/phases/CharacterCreationScreen.tsx', 'src/app/oregon-trail/phases/GameOverScreen.tsx',
  'src/app/oregon-trail/characterContext.tsx', 'src/app/oregon-trail/state/passing.ts',
  'src/app/oregon-trail/state/reducer.ts', 'src/app/globals.css', 'tools/playerPortraits.browser.ts',
  ...roles.map(role => 'public/sprites/player-backgrounds/' + role + '.png'),
]
async function sourceHashes() {
  return Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])))
}
let activePage: Page | undefined
let activeLabel = ''
async function main() {
  await mkdir(output, { recursive: true })
  const beforeSources = await sourceHashes()
  const git = { head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), status: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }) }
  await writeFile(output + '/source-start.json', JSON.stringify({ capturedAt: new Date().toISOString(), git, hashes: beforeSources }, null, 2))
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const scenarios = [
    ...roles.map(background => ({ id: 'desktop-create-' + background, mode: 'create', background, mobile: false })),
    { id: 'phone390-create-all-roles', mode: 'create', background: 'pinkerton_veteran' as const, mobile: true },
    { id: 'desktop-bridge-player', mode: 'bridge', background: 'army_officer' as const, mobile: false },
    { id: 'phone390-bridge-player', mode: 'bridge', background: 'gambler' as const, mobile: true },
    { id: 'desktop-bridge-companion', mode: 'companion', background: 'preacher' as const, mobile: false },
    { id: 'phone390-old-passing-save', mode: 'old', background: 'outlaw_reformed' as const, mobile: true },
    { id: 'desktop-duplicate-passing-name', mode: 'duplicate', background: 'frontier_scout' as const, mobile: false },
    { id: 'phone390-missing-doctor-art', mode: 'missing', background: 'doctor' as const, mobile: true },
  ].filter(scenario => filter.test(scenario.id))
  assert.ok(scenarios.length > 0)
  try {
    for (const scenario of scenarios) {
      activeLabel = scenario.id
      console.log('BEGIN', activeLabel)
      const context = await browser.newContext({ viewport: scenario.mobile ? phone : desktop, isMobile: scenario.mobile, hasTouch: scenario.mobile, serviceWorkers: 'block' })
      const creation = ['create', 'missing'].includes(scenario.mode)
      const terminal = ['old', 'duplicate'].includes(scenario.mode)
      const state = campaign(creation ? 'character_creation' : terminal ? 'game_over' : 'river', scenario.mode === 'companion')
      if (terminal) {
        state.party[0].health = 0
        if (scenario.mode === 'duplicate') {
          state.party.push({ id: 'same-name-companion', name, health: 0, isSick: false, role: 'companion' })
          state.passing = { kind: 'river', place: 'Kansas River Crossing', cause: 'Disposable saved fixture with an ambiguous name.', fallenName: name }
        }
      }
      await seed(context, state, creation ? undefined : scenario.background)
      const page = await context.newPage()
      activePage = page
      const errors: string[] = [], hydration: string[] = [], blocked: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (/hydration failed|cannot update a component|didn't match/i.test(message.text())) hydration.push(message.text()) })
      await page.route('**/api/karma/**', route => route.fulfill({ status: 503, body: '{}' }))
      await page.route('**/api/town-npc**', route => route.fulfill({ status: 503, body: '{}' }))
      if (scenario.mode === 'missing') await page.route('**/sprites/player-backgrounds/doctor.png', route => { blocked.push(route.request().url()); return route.abort() })
      await resume(page)
      if (scenario.mobile && scenario.mode === 'bridge') await page.setViewportSize({ width: 390, height: 568 })
      let evidence: object
      if (creation) evidence = await createAndReload(page, scenario.background, scenario.mobile, scenario.mode === 'missing')
      else if (!terminal) evidence = await bridgeAndPassing(page, scenario.background, scenario.mode === 'companion', scenario.mobile)
      else {
        await page.getByTestId('passing-screen').waitFor()
        assert.equal(await page.getByTestId('passing-memorial-portrait').count(), 0)
        await imageEvidence(page.getByTestId('passing-family-portrait').getByTestId('player-portrait'), scenario.background)
        assert.match(await page.getByTestId('passing-family-portrait').innerText(), /Family portrait · Mae Cedar/)
        assert.equal(await page.getByTestId('passing-marker').locator('img[src*="player-backgrounds"]').count(), 0)
        await noOverflow(page)
        await page.screenshot({ path: output + '/' + activeLabel + '.png', fullPage: true })
        await noEarnedCompletion(page)
        evidence = { loadedTerminalFixture: true, ambiguity: scenario.mode, familyPortraitSeparateFromMarker: true }
      }
      if (scenario.mode === 'missing') assert.ok(blocked.length > 0)
      assert.deepEqual(errors, [], 'no browser runtime errors')
      assert.deepEqual(hydration, [], 'no hydration/render-update errors')
      results.push({ id: scenario.id, status: 'passed', viewport: page.viewportSize(), errors, hydration, blocked, ...evidence })
      await writeFile(output + '/results.json', JSON.stringify({ status: 'running', label, base, scenarios: results }, null, 2))
      await context.close()
      activePage = undefined
      console.log('PASS', activeLabel)
    }
    const afterSources = await sourceHashes()
    await writeFile(output + '/source-end.json', JSON.stringify({ capturedAt: new Date().toISOString(), hashes: afterSources }, null, 2))
    assert.deepEqual(afterSources, beforeSources, 'exact tested source/asset hashes remain frozen during browser QA')
    const screenshots = (await readdir(output)).filter(path => path.endsWith('.png'))
    await writeFile(output + '/results.json', JSON.stringify({ status: 'passed', label, base, browser: browser.version(), git, scope: 'Fresh disposable local-save fixtures; actual creation/selection/save/reload and Bridge wrong-answer actions. Explicit legacy/duplicate terminal fixtures. No full unseeded campaign or earned completion claim.', screenshots, scenarios: results }, null, 2))
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: output + '/failure.png', fullPage: true })
      await writeFile(output + '/failure.txt', activeLabel + '\n' + String(error) + '\n\n' + await activePage.locator('body').innerText())
    }
    await writeFile(output + '/results.json', JSON.stringify({ status: 'failed', label, base, failedScenario: activeLabel, error: String(error), scenarios: results }, null, 2))
    throw error
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
