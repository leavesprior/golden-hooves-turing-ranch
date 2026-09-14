import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { gameReducer } from '../src/app/oregon-trail/state/reducer'
import { BASE_STATS, withBackgroundBonuses, type CharacterBackground, type StatName } from '../src/app/oregon-trail/characterContext'
import type { OregonTrailState } from '../src/app/oregon-trail/state/types'

// Labeled local QA fixtures establish prior campaign resources, not earned unlocks.
// Creation uses real controls; zero-oxen events use actual Continue on the trail.
// The app has no testing hook: storage failures and repeat clicks live only here.
const base = process.argv[2] ?? 'http://127.0.0.1:3362'
const label = process.argv[3] ?? 'development'
const group = process.argv[4] ?? 'all'
const output = `artifacts/live-saddle-teamster/${label}`
const saveKey = 'golden_frog_local_save', walletKey = 'oregon_trail_karma_wallet'
const results: object[] = []
const sourceFiles = [
  'src/app/oregon-trail/oregonTrailContext.tsx', 'src/app/oregon-trail/state/actions.ts',
  'src/app/oregon-trail/state/reducer.ts', 'src/app/oregon-trail/state/types.ts',
  'src/app/oregon-trail/state/saddleSnapshot.ts', 'src/app/oregon-trail/state/teamsterHire.ts',
  'src/app/oregon-trail/state/travelEngine.ts', 'src/app/oregon-trail/phases/EventScreen.tsx',
  'src/app/oregon-trail/phases/SaveLoadIntegration.tsx', 'src/app/oregon-trail/phases/CharacterCreationScreen.tsx',
  'src/app/oregon-trail/data/riverCrossings.ts', 'src/app/oregon-trail/components/CharacterSheet.tsx',
  'src/app/oregon-trail/karmaWalletContext.tsx', 'src/lib/goldCountryFare.ts', 'tools/liveSaddleTeamster.browser.ts',
]
async function hashes() {
  return Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex') ])))
}
function campaign(): OregonTrailState {
  return { ...DEFAULT_STATE, phase: 'traveling', day: 10, daysOnTrail: 9, distance: 10, totalMilesTraveled: 10,
    milesUntilNextLandmark: 92, nextLandmark: 'Kansas River Crossing', currentLandmark: 'Independence, Missouri',
    wagonLeader: 'Mae Cedar', party: [{ id: 'mae', name: 'Mae Cedar', role: 'leader', health: 85, isSick: false }],
    food: 500, ammunition: 100, medicine: 10, spareParts: 6, clothing: 6, oxen: 4, morale: 85,
    wagonCondition: 100, weather: 'rain', rations: 'bare_bones', pace: 'grueling',
    inventory: ['fixture-keepsake'], completedQuests: ['fixture-prior-quest'] }
}
async function seed(context: BrowserContext, state: OregonTrailState, neutral = 100, priorCompletedCampaign = false) {
  await context.addInitScript({ content: `(() => {
    const saveKey=${JSON.stringify(saveKey)},walletKey=${JSON.stringify(walletKey)};
    const storage=localStorage,get=Storage.prototype.getItem,set=Storage.prototype.setItem;
    if(!get.call(storage,'saddle-teamster-fixture')) {
      set.call(storage,saveKey,${JSON.stringify(JSON.stringify({ savedAt: new Date().toISOString(), state }))});
      set.call(storage,walletKey,${JSON.stringify(JSON.stringify({ balance: { neutral, good: 12, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 }, fixtureDonor: 'preserved' }))});
      set.call(storage,'golden-hooves-audio-settings','{"isMuted":true}');
      set.call(storage,'bobr_gft_age_mode','adult');set.call(storage,'saddle-teamster-fixture','yes');
      if(${JSON.stringify(priorCompletedCampaign)})set.call(storage,'bobr_cross_game_progression',JSON.stringify({milestones:[{id:'trail_victory',gameId:'prospectors_tale',achievedAt:'2026-09-01T00:00:00.000Z',metadata:{fixture:'prior completed campaign; this QA does not earn it'}}]}));
    }
    const probe={mode:sessionStorage.getItem('teamster-failure')||'none',events:[]};
    Object.defineProperty(window,'__teamsterProbe',{value:probe});
    Storage.prototype.setItem=function(key,value){
      if(this===storage && [saveKey,walletKey].includes(String(key))) {
        const parsed=JSON.parse(String(value)),old=JSON.parse(get.call(storage,walletKey)||'{}');
        const failed=key===saveKey && (probe.mode==='plan'&&!!parsed.state?.teamsterHire || probe.mode==='completion'&&parsed.state?.phase==='traveling'&&parsed.state?.oxen===2)
          || key===walletKey&&probe.mode==='wallet'&&(parsed.travelFareReceipts?.length||0)>(old.travelFareReceipts?.length||0);
        probe.events.push({key:String(key),failed,state:parsed.state,balance:parsed.balance,receipts:parsed.travelFareReceipts});
        if(failed)throw new DOMException('QA injected local storage failure','QuotaExceededError');
      }
      return set.call(this,key,value);
    };
  })()` })
}
async function resume(page: Page, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
  else await page.goto(`${base}/oregon-trail`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout: 60000 })
  await page.getByTestId('title-play').waitFor({ state: 'detached', timeout: 60000 })
  await page.evaluate(() => { Math.random = () => 0.99 }) // gameplay only, after hydration; no page-owned RNG change
}
async function snapshot(page: Page) {
  return page.evaluate(({ saveKey, walletKey }) => ({
    state: JSON.parse(localStorage.getItem(saveKey)!).state as OregonTrailState,
    wallet: JSON.parse(localStorage.getItem(walletKey)!),
    character: JSON.parse(localStorage.getItem('bobr_ot_character') ?? 'null'),
    probe: (window as unknown as { __teamsterProbe: { mode: string; events: Array<{ key: string; failed: boolean; state?: OregonTrailState; balance?: { neutral: number }; receipts?: unknown[] }> } }).__teamsterProbe,
  }), { saveKey, walletKey })
}
async function waitPhase(page: Page, phase: string, day?: number) {
  await page.waitForFunction(({ saveKey, phase, day }) => {
    const state = JSON.parse(localStorage.getItem(saveKey) ?? '{}').state
    return state?.phase === phase && (day === undefined || state.day === day)
  }, { saveKey, phase, day }, { timeout: 15000 })
}
async function arm(page: Page, mode: string) {
  await page.evaluate(mode => {
    (window as unknown as { __teamsterProbe: { mode: string } }).__teamsterProbe.mode = mode
    sessionStorage.setItem('teamster-failure', mode)
  }, mode)
}
async function creation(page: Page, stat: StatName, role: CharacterBackground, mobile: boolean) {
  const choice = page.getByTestId(`saddle-background-${role}`)
  if (mobile) await choice.tap()
  else { await choice.focus(); await page.keyboard.press('Enter') }
  for (let point = 0; point < 12; point++) await page.getByTestId(`saddle-plus-${stat}`).click()
  const expected = withBackgroundBonuses({ ...BASE_STATS, [stat]: 17 }, role)
  assert.equal(await page.getByTestId(`saddle-plus-${stat}`).evaluate(button => Number(button.previousElementSibling?.textContent)), expected[stat], 'display includes exact capped background bonus')
  await page.getByTestId('saddle-begin').click()
  await page.getByTestId('town-continue').click()
  await page.getByTestId('continue-trail').waitFor()
  await waitPhase(page, 'traveling')
  const before = await snapshot(page)
  assert.deepEqual(before.character.stats, expected, 'real creation saved exact character bonuses')
  assert.deepEqual(before.state.saddle, expected, 'same UI-created block reaches live travel snapshot')
  const random = Math.random
  let modeled: OregonTrailState, fallback: OregonTrailState
  try {
    Math.random = () => 0.99
    modeled = gameReducer(before.state, { type: 'TRAVEL' })
    fallback = gameReducer({ ...before.state, saddle: undefined }, { type: 'TRAVEL' })
  } finally { Math.random = random }
  await page.getByTestId('continue-trail').click()
  await waitPhase(page, modeled.phase, modeled.day)
  const after = await snapshot(page)
  for (const field of ['distance', 'day', 'wagonCondition', 'food'] as const) assert.equal(after.state[field], modeled[field], 'actual travel '+field)
  assert.deepEqual(after.state.party, modeled.party)
  if (stat === 'Luck') assert.ok(after.state.distance > fallback.distance, 'UI-created Luck changes actual rainy miles')
  if (stat === 'Expertise') assert.ok(after.state.wagonCondition > fallback.wagonCondition, 'UI-created Expertise changes actual wagon wear')
  if (stat === 'Durability') assert.ok(after.state.party[0].health > fallback.party[0].health, 'UI-created Durability changes actual strained travel health')
  await resume(page, true)
  assert.deepEqual((await snapshot(page)).state.saddle, expected)
  assert.deepEqual((await snapshot(page)).character, before.character)
  return { stat, role, expected, before: before.state, after: after.state, baselineWithoutSnapshot: fallback, actualUiAndTravel: true }
}
async function teamster(page: Page, mode: string, mobile: boolean) {
  await page.getByTestId('continue-trail').click()
  await page.getByTestId('event-choice-hire_teamster').waitFor()
  await waitPhase(page, 'event')
  const before = await snapshot(page)
  assert.equal(before.state.oxen, 0)
  assert.equal(before.state.distance, 10, 'zero oxen actually stop the wagon')
  await arm(page, mode === 'farm' ? 'completion' : mode)
  const hire = page.getByTestId('event-choice-hire_teamster')
  if (mode === 'double') await hire.evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click() })
  else if (mobile) await hire.tap()
  else { await hire.focus(); await page.keyboard.press('Enter') }
  let failure: Awaited<ReturnType<typeof snapshot>> | undefined
  if (['funds','plan','wallet','completion','farm'].includes(mode)) {
    await page.getByTestId('teamster-feedback').waitFor()
    failure = await snapshot(page)
    assert.equal(failure.state.oxen, 0)
    assert.equal(failure.state.day, before.state.day)
    assert.equal(failure.state.food, before.state.food)
    assert.equal(failure.wallet.balance.neutral, ['completion','farm'].includes(mode) ? 80 : before.wallet.balance.neutral)
    if (mode === 'plan') assert.equal(failure.state.teamsterHire, undefined)
    else assert.ok(failure.state.teamsterHire)
    const oldOrder = failure.state.teamsterHire?.id
    await page.screenshot({ path: `${output}/${mobile ? 'phone' : 'desktop'}-${mode}-failure.png`, fullPage: true })
    if (mode === 'farm') {
      await page.getByRole('button', { name: '🏡 My Farm', exact: true }).click()
      await page.getByRole('button', { name: 'Back to Trail', exact: true }).waitFor()
      await waitPhase(page, 'ranch_management')
      assert.equal((await snapshot(page)).state.teamsterHire?.id, oldOrder)
      await resume(page, true)
      await page.getByRole('button', { name: 'Back to Trail', exact: true }).waitFor()
      assert.equal((await snapshot(page)).state.teamsterHire?.id, oldOrder, 'farm reload retains exact paid pending order')
      await page.screenshot({ path: `${output}/${mobile ? 'phone' : 'desktop'}-farm-reloaded.png`, fullPage: true })
      await page.getByRole('button', { name: 'Back to Trail', exact: true }).click()
    } else await resume(page, true)
    await page.getByTestId('event-choice-hire_teamster').waitFor()
    if (mode === 'completion' || mode === 'farm') {
      assert.match(await page.getByTestId('teamster-feedback').innerText(), /payment is recorded/)
      assert.equal(await page.getByTestId('event-choice-abandon_wagon').isDisabled(), true)
    }
    if (mode === 'funds') {
      await page.getByTestId('event-choice-walk_to_town').click()
      await waitPhase(page, 'traveling', before.state.day + 1)
      const walked = await snapshot(page)
      assert.equal(walked.wallet.balance.neutral, 15)
      assert.equal(walked.state.oxen, 0)
      assert.equal(walked.state.teamsterHire, undefined)
      assert.ok(walked.state.distance > before.state.distance)
      return { mode, before, failure, walked, unpaidWalkAvailable: true }
    }
    await arm(page, 'none')
    await page.getByTestId('event-choice-hire_teamster').click()
    await waitPhase(page, 'traveling', before.state.day + 2)
    const receipt = (await snapshot(page)).wallet.travelFareReceipts[0]
    if (oldOrder) assert.equal(receipt.tripId, oldOrder, 'reload retries the exact previously saved order')
  } else await waitPhase(page, 'traveling', before.state.day + 2)
  const after = await snapshot(page)
  assert.equal(after.state.oxen, 2)
  assert.equal(after.state.day, before.state.day + 2)
  assert.equal(after.state.food, before.state.food)
  assert.equal(after.wallet.balance.neutral, 80)
  assert.equal(after.wallet.travelFareReceipts.length, 1)
  assert.equal(after.wallet.travelFareReceipts[0].amount, 20)
  assert.equal(after.wallet.fixtureDonor, 'preserved')
  assert.equal(after.state.teamsterHire, undefined)
  assert.deepEqual(after.state.completedQuests, before.state.completedQuests)
  assert.deepEqual(after.state.inventory, before.state.inventory)
  assert.deepEqual(after.state.party, before.state.party)
  const writes = after.probe.events.filter(event => !event.failed)
  if (!failure) {
    const planned = writes.findIndex(event => !!event.state?.teamsterHire)
    const paid = writes.findIndex(event => event.key === walletKey && event.receipts?.length === 1)
    const completed = writes.findIndex(event => event.state?.oxen === 2)
    assert.ok(planned >= 0 && paid > planned && completed > paid, 'observed actual write order: saved order, atomic payment, saved yoke')
  }
  await resume(page, true)
  const reloaded = await snapshot(page)
  assert.equal(reloaded.wallet.balance.neutral, 80)
  assert.equal(reloaded.state.oxen, 2)
  assert.equal(reloaded.state.day, after.state.day)
  return { mode, before, failure, after, reloaded, debitBeforeYoke: true }
}
async function main() {
  await mkdir(output, { recursive: true })
  const startHashes = await hashes()
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] })
  try {
    for (const mobile of [false,true]) for (const scenario of ['Luck','Expertise','Durability','double','funds','plan','wallet','completion','farm']) {
      if (group !== 'all' && group !== scenario) continue
      console.log('BEGIN', mobile ? 'phone' : 'desktop', scenario)
      const context = await browser.newContext({ viewport: mobile ? { width:390,height:844 } : { width:1280,height:960 }, isMobile:mobile, hasTouch:mobile, serviceWorkers:'block' })
      const state = campaign()
      const isCreation = ['Luck','Expertise','Durability'].includes(scenario)
      if (isCreation) state.phase = 'character_creation'
      else state.oxen = 0
      await seed(context, state, scenario === 'funds' ? 15 : 100, scenario === 'farm')
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('**/api/karma/**', route => route.fulfill({ status:503,body:'{"error":"local QA fixture"}' }))
      let evidence: unknown
      try {
        await resume(page)
        evidence = isCreation ? await creation(page, scenario as StatName, scenario === 'Luck' ? 'gambler' : scenario === 'Expertise' ? 'frontier_scout' : 'doctor', mobile) : await teamster(page,scenario,mobile)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow')
        const milestones = await page.evaluate(() => JSON.parse(localStorage.getItem('bobr_cross_game_progression') ?? '{}').milestones ?? [])
        assert.ok(!milestones.some((milestone: { id:string }) => milestone.id === 'reached_west_point'), 'no earned farm completion invented')
        assert.equal(milestones.some((milestone: { id:string }) => milestone.id === 'trail_victory'), scenario === 'farm', 'only the labeled prior-completion farm fixture has victory access')
        assert.deepEqual(errors, [])
        await page.screenshot({ path:`${output}/${mobile ? 'phone' : 'desktop'}-${scenario}-complete.png`,fullPage:true })
        results.push({ scenario,mobile,ok:true,errors,evidence })
        console.log('PASS', mobile ? 'phone' : 'desktop', scenario)
      } catch (error) {
        await page.screenshot({ path:`${output}/${mobile ? 'phone' : 'desktop'}-${scenario}-ERROR.png`,fullPage:true }).catch(() => {})
        results.push({ scenario,mobile,ok:false,error:String(error),errors,evidence })
        throw error
      } finally { await context.close() }
    }
    assert.deepEqual(await hashes(),startHashes,'product and harness frozen through browser run')
  } finally {
    await writeFile(`${output}/results.json`,JSON.stringify({base,label,browser:browser.version(),at:new Date().toISOString(),sourceHashes:startHashes,endHashes:await hashes(),results},null,2)+'\n')
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode=1 })
