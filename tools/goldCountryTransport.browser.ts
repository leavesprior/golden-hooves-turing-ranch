import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { quoteGoldCountryTransport } from '../src/lib/goldCountryTransport'
import type { OregonTrailState } from '../src/app/oregon-trail/state/types'

// Disposable prior-campaign fixtures, then real UI departures/arrivals/reloads.
// Historical years are fixture history, not a claim this test played twenty years.
// Storage failures are injected only by this harness; the app has no debug hook.
const base = process.argv[2] ?? 'http://127.0.0.1:3360'
const label = process.argv[3] ?? 'development'
const group = process.argv[4] ?? 'all'
const output = `artifacts/year-gated-transport/${label}`
const saveKey = 'golden_frog_local_save'
const walletKey = 'oregon_trail_karma_wallet'
const results: object[] = []
const stats = { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 }

function campaign(goldCountryDay = 991): OregonTrailState {
  return { ...DEFAULT_STATE, phase: 'gold_country_location', day: 91, daysOnTrail: 90, distance: 2000,
    currentGoldCountryLocation: 'volcano', goldCountryDay, goldCountryMinute: 0,
    currentLandmark: 'West Point', wagonLeader: 'Mae Cedar',
    party: [{ id: 'mae', name: 'Mae Cedar', role: 'leader', health: 83, isSick: false }],
    food: 300, ammunition: 100, medicine: 10, spareParts: 5, oxen: 3,
    inventory: ['towel'], searchedAreas: ['saved-search'], completedQuests: ['saved-quest'],
    discoveredGoldLocations: ['bobr_cabin', 'volcano', 'jackson', 'murphys', 'mokelumne_hill'] }
}

async function seed(context: BrowserContext, state: OregonTrailState, neutral: number | null = 400) {
  const fixtures = {
    [saveKey]: { savedAt: new Date().toISOString(), state },
    ...(neutral === null ? {} : { [walletKey]: { balance: { good: 12, neutral, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 }, futureMetadata: { retained: true } } }),
    bobr_ot_character: { name: 'Mae Cedar', background: 'pinkerton_veteran', stats, traits: [], level: 1, experience: 7, experienceToNextLevel: 100, pendingStatPoints: 0, levelUpPending: false, investigationProficiency: { witnessInterrogation: 3, crimeSceneAnalysis: 2, suspectIdentification: 1 } },
    'golden-hooves-audio-settings': { isMuted: true },
  }
  await context.addInitScript({ content: `(() => {
    const fixtures = ${JSON.stringify(fixtures)};
    const saveKey = ${JSON.stringify(saveKey)}, walletKey = ${JSON.stringify(walletKey)};
    const storage = localStorage, nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    if (!nativeGet.call(storage, 'transport-fixture-seeded')) {
      for (const [key,value] of Object.entries(fixtures)) nativeSet.call(storage,key,JSON.stringify(value));
      nativeSet.call(storage,'bobr_gft_age_mode','adult');
      nativeSet.call(storage,'transport-fixture-seeded','yes');
    }
    const probe = { mode: sessionStorage.getItem('transport-fixture-failure') || 'none', events: [] };
    Object.defineProperty(window,'__transportProbe',{value:probe});
    Storage.prototype.setItem = function(key,value) {
      if (this === storage && [saveKey,walletKey].includes(String(key))) {
        const parsed=JSON.parse(String(value)), trip=parsed.state?.goldCountryTrip;
        const failed = key===saveKey && ((probe.mode==='plan' && trip?.status==='planned') || (probe.mode==='paid' && trip?.status==='paid' && trip.quote.fare>0) || (probe.mode==='arrival' && trip?.status==='arrived'))
          || key===walletKey && probe.mode==='fare' && (parsed.travelFareReceipts?.length ?? 0) > (JSON.parse(nativeGet.call(storage,walletKey)||'{}').travelFareReceipts?.length ?? 0);
        probe.events.push({key:String(key),failed,state:parsed.state,balance:parsed.balance,receipts:parsed.travelFareReceipts});
        if(failed) throw new DOMException('Fixture quota failure','QuotaExceededError');
      }
      return nativeSet.call(this,key,value);
    };
  })()` })
}

async function resume(page: Page, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
  else await page.goto(`${base}/oregon-trail`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout: 60000 })
  await page.getByTestId('title-play').waitFor({ state: 'detached', timeout: 60000 })
  // Limit the deterministic fixture roll to gameplay, after React hydration.
  await page.evaluate(() => { Math.random = () => 0.99 })
}
async function snapshot(page: Page) {
  return page.evaluate(({saveKey,walletKey}) => ({
    state: JSON.parse(localStorage.getItem(saveKey)!).state as OregonTrailState,
    wallet: JSON.parse(localStorage.getItem(walletKey)!),
    probe: (window as unknown as { __transportProbe: { mode: string; events: unknown[] } }).__transportProbe,
  }), { saveKey, walletKey })
}
async function arm(page: Page, mode: string) {
  await page.evaluate(mode => {
    (window as unknown as { __transportProbe: { mode: string } }).__transportProbe.mode = mode
    sessionStorage.setItem('transport-fixture-failure', mode)
  }, mode)
}
async function choose(page: Page, destination: string, mode: 'wagon' | 'stage' | 'rail') {
  await page.locator('#gold-country-road-destination').selectOption(destination)
  const button = page.getByTestId(`transport-mode-${mode}`)
  assert.equal(await button.isEnabled(), true)
  await button.click()
}
async function arrival(page: Page, destination: string) {
  await page.waitForFunction(({ key, destination }) => {
    const state = JSON.parse(localStorage.getItem(key) ?? '{}').state
    return state?.phase === 'gold_country_location' && state.currentGoldCountryLocation === destination && state.goldCountryTrip?.status === 'arrived'
  }, { key: saveKey, destination }, { timeout: 30000 })
  await page.getByTestId('transport-arrival-summary').waitFor({ timeout: 30000 })
  return snapshot(page)
}

async function main() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] })
  try {
    for (const viewport of [{ label: 'desktop', width: 1280, height: 960 }, { label: 'phone390', width: 390, height: 844 }]) {
      for (const scenario of ['stage-boundary-reload','rail-gateways','no-funds','plan','fare','paid','arrival','on-foot','absent-wallet','luck-delay']) {
        if (group !== 'all' && group !== scenario) continue
        console.log('BEGIN', viewport.label, scenario)
        const context = await browser.newContext({ viewport, serviceWorkers: 'block' })
        const state = campaign(scenario === 'stage-boundary-reload' ? 990 : scenario === 'rail-gateways' ? 7111 : 991)
        if (scenario === 'on-foot') state.oxen = 0
        if (scenario === 'absent-wallet') {
          const quote = quoteGoldCountryTransport({fromId:'volcano',toId:'murphys',mode:'stage',clock:state,luck:5,roll:0.99})
          assert.equal(quote.ok,true)
          state.phase='gold_country_travel'; state.travelingToLocation='murphys'
          state.goldCountryTrip={version:1,id:'absent-wallet-trip',status:'planned',departureClock:{day:state.day,goldCountryDay:state.goldCountryDay,goldCountryMinute:0},quote:quote.quote,roadEncounterId:null}
        }
        await seed(context, state, scenario === 'no-funds' ? 0 : scenario === 'absent-wallet' ? null : 400)
        const page = await context.newPage()
        const errors: string[] = []
        const events: unknown[] = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('console', message => { if (message.text().includes('[Continue]')) console.log(message.text()) })
        await context.route('**/api/karma/balance**', route => route.fulfill({ json: { ok: true, balance: { good: 0, neutral: 0, bad: 0 } } }))
        await context.route('**/api/karma/event', route => { events.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true } }) })
        await context.route('**/api/neoma/**', route => route.fulfill({ status: 503, json: { ok: false } }))
        await context.route(/https:\/\/(www\.google|maps\.google|www\.googletagmanager|fonts\.google)/, route => route.abort())
        let before: Awaited<ReturnType<typeof snapshot>> | undefined
        let after: Awaited<ReturnType<typeof snapshot>> | undefined
        try {
          await resume(page)
          await page.getByTestId('gold-country-calendar').waitFor()
          before = await snapshot(page)
          if (scenario === 'absent-wallet') {
            // The page's existing empty-storage initialization creates the
            // normal400 wallet, then this already-planned ticket pays once.
            after=await arrival(page,'murphys')
            assert.equal(after.state.goldCountryTrip?.id,'absent-wallet-trip')
            assert.equal(after.wallet.walletMode,'new')
            assert.equal(after.wallet.balance.neutral,390)
            assert.equal(after.wallet.travelFareReceipts.length,1)
            await resume(page,true)
            const reloaded=await snapshot(page)
            assert.equal(reloaded.wallet.balance.neutral,390)
            assert.equal(reloaded.state.goldCountryMinute,720)
          } else if (scenario === 'luck-delay') {
            await page.evaluate(() => { Math.random=()=>0 })
            await choose(page,'murphys','stage')
            await page.getByTestId('saved-transport-ticket').waitFor()
            const paid=await snapshot(page)
            assert.equal(paid.state.goldCountryTrip?.quote.event,'wreck')
            assert.equal(paid.state.goldCountryTrip?.quote.durationMinutes,840)
            assert.match(await page.getByTestId('transport-luck-outcome').innerText(),/wheel breaks/)
            await resume(page,true)
            after=await arrival(page,'murphys')
            assert.deepEqual(after.state.goldCountryTrip?.quote,paid.state.goldCountryTrip?.quote)
            assert.equal(after.state.goldCountryMinute,840)
            assert.equal(after.wallet.balance.neutral,390)
          } else if (scenario === 'on-foot') {
            await page.locator('#gold-country-road-destination').selectOption('murphys')
            assert.match(await page.getByTestId('transport-mode-wagon').innerText(),/^On foot/)
            await page.getByTestId('transport-mode-wagon').click()
            await page.getByTestId('saved-transport-ticket').waitFor()
            assert.match(await page.getByTestId('saved-transport-ticket').innerText(),/On foot/i)
            assert.doesNotMatch(await page.getByTestId('saved-transport-ticket').innerText(),/your wagon/i)
            after=await arrival(page,'murphys')
            assert.equal(after.state.oxen,0)
            assert.equal(after.state.goldCountryDay,state.goldCountryDay+1)
            assert.equal(after.wallet.balance.neutral,400)
          } else if (scenario === 'stage-boundary-reload') {
            await page.locator('#gold-country-road-destination').selectOption('murphys')
            assert.equal(await page.getByTestId('transport-mode-stage').isDisabled(), true)
            assert.equal(await page.getByTestId('transport-mode-rail').isDisabled(), true)
            assert.match(await page.getByTestId('gold-country-calendar').innerText(), /Year 1851/)
            await page.screenshot({ path: `${output}/${viewport.label}-1851.png`, fullPage: false })
            await page.getByTestId('transport-mode-wagon').click()
            const first = await arrival(page, 'murphys')
            assert.equal(first.state.goldCountryDay, 991)
            assert.equal(first.wallet.balance.neutral, 400)
            assert.match(await page.getByTestId('gold-country-calendar').innerText(), /Year 1852/)
            await choose(page, 'volcano', 'stage')
            await page.getByTestId('saved-transport-ticket').waitFor()
            const paid = await snapshot(page)
            assert.equal(paid.wallet.balance.neutral, 390)
            assert.equal(paid.state.goldCountryTrip?.status, 'paid')
            await resume(page, true)
            const resumed = await snapshot(page)
            assert.equal(resumed.state.goldCountryTrip?.id, paid.state.goldCountryTrip?.id)
            assert.deepEqual(resumed.state.goldCountryTrip?.quote, paid.state.goldCountryTrip?.quote)
            assert.equal(resumed.wallet.balance.neutral, 390)
            after = await arrival(page, 'volcano')
            assert.equal(after.state.goldCountryMinute, 720)
            assert.equal(after.wallet.travelFareReceipts.length, 1)
          } else if (scenario === 'rail-gateways') {
            await choose(page, 'sacramento_gateway', 'stage')
            const gateway = await arrival(page, 'sacramento_gateway')
            assert.equal(gateway.wallet.balance.neutral, 386)
            await page.getByTestId('transport-gateway').waitFor()
            await choose(page, 'roseville_gateway', 'rail')
            after = await arrival(page, 'roseville_gateway')
            assert.equal(after.wallet.balance.neutral, 378)
            assert.equal(after.state.goldCountryMinute, 810)
            assert.equal(after.state.goldCountryTrip?.quote.durationMinutes, 90)
            assert.match(await page.getByTestId('transport-arrival-summary').innerText(), /1h 30m/)
          } else if (scenario === 'no-funds') {
            await page.locator('#gold-country-road-destination').selectOption('murphys')
            assert.equal(await page.getByTestId('transport-mode-stage').isDisabled(), true)
            assert.equal(await page.getByTestId('transport-mode-wagon').isEnabled(), true)
            after = await snapshot(page)
            assert.equal(after.state.goldCountryTrip, undefined)
            assert.equal(after.wallet.travelFareReceipts, undefined)
          } else {
            await arm(page, scenario)
            await choose(page, 'murphys', 'stage')
            if (scenario === 'plan') {
              await page.getByRole('alert').filter({ hasText: 'journey could not be saved' }).waitFor()
              after = await snapshot(page)
              assert.equal(after.state.phase, 'gold_country_location')
              assert.equal(after.state.goldCountryTrip, undefined)
              assert.equal(after.wallet.balance.neutral, 400)
            } else if (scenario === 'fare') {
              await page.getByTestId('transport-payment-pending').waitFor()
              await page.getByRole('button', { name: 'Retry saved ticket' }).waitFor()
              const failed = await snapshot(page)
              assert.equal(failed.state.goldCountryTrip?.status, 'planned')
              assert.equal(failed.wallet.balance.neutral, 400)
              assert.equal(failed.wallet.travelFareReceipts, undefined)
              await arm(page, 'none')
              await page.getByRole('button', { name: 'Retry saved ticket' }).click()
              after = await arrival(page, 'murphys')
              assert.equal(after.wallet.balance.neutral, 390)
            } else if (scenario === 'paid') {
              await page.getByTestId('transport-payment-pending').waitFor()
              await page.getByRole('button', { name: 'Retry saved ticket' }).waitFor()
              const failed = await snapshot(page)
              assert.equal(failed.state.goldCountryTrip?.status, 'planned')
              assert.equal(failed.wallet.balance.neutral, 390)
              assert.equal(failed.wallet.travelFareReceipts.length, 1)
              await page.getByRole('button', {name:'Turn back',exact:true}).click()
              await page.getByRole('alert').filter({hasText:'already been paid'}).waitFor()
              assert.equal((await snapshot(page)).state.goldCountryTrip?.status,'planned')
              await resume(page, true)
              await page.getByRole('button', { name: 'Retry saved ticket' }).waitFor()
              assert.equal((await snapshot(page)).wallet.balance.neutral, 390)
              await arm(page, 'none')
              await page.getByRole('button', { name: 'Retry saved ticket' }).click()
              after = await arrival(page, 'murphys')
              assert.equal(after.state.goldCountryTrip?.id, failed.state.goldCountryTrip?.id)
              assert.equal(after.wallet.balance.neutral, 390)
              assert.equal(after.wallet.travelFareReceipts.length, 1)
              assert.equal(events.length, 1, 'receipt replay does not resubmit the existing server sync')
            } else {
              await page.getByRole('button', { name: 'Retry arrival' }).waitFor({ timeout: 30000 })
              const failed = await snapshot(page)
              assert.equal(failed.state.goldCountryTrip?.status, 'paid')
              assert.equal(failed.state.goldCountryMinute, 0)
              assert.equal(failed.wallet.balance.neutral, 390)
              await resume(page, true)
              await page.getByRole('button', { name: 'Retry arrival' }).waitFor({ timeout: 30000 })
              await arm(page, 'none')
              await page.getByRole('button', { name: 'Retry arrival' }).click()
              after = await arrival(page, 'murphys')
              assert.equal(after.state.goldCountryMinute, 720)
              assert.equal(after.wallet.balance.neutral, 390)
              await resume(page, true)
              assert.equal((await snapshot(page)).state.goldCountryMinute, 720)
            }
          }
          assert.deepEqual(after!.state.inventory, state.inventory)
          assert.deepEqual(after!.state.completedQuests, state.completedQuests)
          assert.deepEqual(after!.state.party, state.party)
          if (scenario !== 'absent-wallet') {
            assert.equal(after!.wallet.balance.good, 12)
            assert.equal(after!.wallet.balance.bad, 2)
            assert.equal(after!.wallet.futureMetadata.retained, true)
          }
          assert.equal(errors.length, 0, errors.join('\n'))
          await page.screenshot({ path: `${output}/${viewport.label}-${scenario}.png`, fullPage: false })
          results.push({ viewport: viewport.label, scenario, ok: true, before, after, serverSubmissions: events.length, pageErrors: errors })
          console.log(`PASS ${viewport.label} ${scenario}`)
        } catch (error) {
          await page.screenshot({ path: `${output}/${viewport.label}-${scenario}-failure.png`, fullPage: false }).catch(() => {})
          results.push({ viewport: viewport.label, scenario, ok: false, error: String(error), before, after: await snapshot(page).catch(() => null), pageErrors: errors })
          throw error
        } finally {
          await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
          await context.close()
        }
      }
    }
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
