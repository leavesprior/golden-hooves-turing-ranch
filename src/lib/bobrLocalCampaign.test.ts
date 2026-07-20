import assert from 'node:assert/strict'
import {
  campaignReducer,
  createLocalCampaign,
  formatCampaignTime,
  getAvailableVolcanoChoices,
  getMarketQuotes,
  getSaloonOffer,
  isBeforeCurtain,
  isBoundedNpcResponse,
  normalizeLocalCampaign,
  selectPeril,
  type LocalCampaignState,
  type PlayerRole,
  type TravelMode,
} from './bobrLocalCampaign'

function start(role: PlayerRole = 'sleuth'): LocalCampaignState {
  return campaignReducer(createLocalCampaign(1849), {
    type: 'START',
    profile: { name: 'Ada Lovelace', role, ageMode: 'adult', presentation: 'woman' },
  })
}

function reachTrail(role: PlayerRole = 'sleuth'): LocalCampaignState {
  return campaignReducer(start(role), { type: 'ESCAPE_CHOICE', choice: 'trace_tare' })
}

function reachTravel(trailChoice: 'stop_thieves' | 'fair_trade' | 'rush', role: PlayerRole = 'sleuth'): LocalCampaignState {
  let state = campaignReducer(reachTrail(role), { type: 'TRAIL_CHOICE', choice: trailChoice })
  state = campaignReducer(state, { type: 'ENTER_GOLD_COUNTRY' })
  return state
}

function reachVolcano(trailChoice: 'stop_thieves' | 'fair_trade' | 'rush', role: PlayerRole, mode: TravelMode = 'horse'): LocalCampaignState {
  let state = campaignReducer(reachTravel(trailChoice, role), { type: 'TRAVEL', mode })
  // Deterministic peril on some seed/mode combinations: resolve it so the helper always lands in Volcano.
  if (state.chapter === 'peril') state = campaignReducer(state, { type: 'PERIL_CHOICE', option: 'a' })
  return state
}

{
  const initial = createLocalCampaign(1849)
  assert.equal(initial.chapter, 'setup')
  assert.equal(initial.world.weather, 'clear')
  assert.equal(formatCampaignTime(initial), 'Day 1, 8:00 AM')
}

{
  const state = start()
  assert.equal(state.player.name, 'Ada Lovelace', 'full player names must not be truncated at spaces')
  assert.deepEqual(state.player.party, ['sleuth', 'doctor', 'miner'])
  assert.equal(state.chapter, 'escape')
}

{
  const started = start()
  const imported = campaignReducer(started, {
    type: 'IMPORT_JOURNEY',
    journey: {
      timeChaseComplete: true,
      trailComplete: true,
      reachedGoldCountry: true,
      tradeSafetyDelta: 16,
      routeTrustDelta: 7,
      evidence: ['Tare: shaved brass', 'The party survived the trail.'],
      sourceEventCount: 3,
    },
  })
  assert.equal(imported.chapter, 'arrival')
  assert.equal(imported.resources.goodKarma, 0, 'import must not copy or mint karma')
  assert.equal(imported.resources.neutral, started.resources.neutral, 'import must not copy currency')
  assert.equal(imported.world.tradeSafety, started.world.tradeSafety + 16)
  assert.equal(imported.world.nativeTrust, started.world.nativeTrust + 7)
  assert.equal(imported.flags.imported_production_journey, true)
  assert.ok(imported.casebook.some((entry) => entry.id === 'production-time-chase'))
  assert.ok(imported.casebook.some((entry) => entry.id === 'production-trail'))
  assert.ok(imported.casebook.some((entry) => entry.id === 'production-evidence'))
  assert.match(imported.log.at(-1)?.text || '', /no balances or rewards/)
}

{
  const childOffer = getSaloonOffer('under18')
  assert.equal(childOffer.drink, 'Cold sarsaparilla')
  assert.match(childOffer.vice, /absent/)
  const adultOffer = getSaloonOffer('adult')
  assert.match(adultOffer.drink, /whisky/)
}

{
  const stopState = reachTravel('stop_thieves')
  const rushState = reachTravel('rush')
  const stopFlour = getMarketQuotes(stopState).find((quote) => quote.id === 'flour')!
  const rushFlour = getMarketQuotes(rushState).find((quote) => quote.id === 'flour')!
  assert.ok(stopFlour.price < rushFlour.price, 'protecting trade must lower downstream freight prices')
  assert.equal(stopState.resources.goodKarma, 2)
  assert.equal(stopState.world.tradeSafety, 78)
}

{
  const state = reachTravel('stop_thieves')
  const first = getMarketQuotes(state, 100, 0)
  const next = getMarketQuotes(state, 101, 0)
  const goodLedger = getMarketQuotes(state, 100, 1)
  const badLedger = getMarketQuotes(state, 100, -1)
  assert.equal(first.length, 8, 'the exchange must cover more than four finite shop items')
  assert.notDeepEqual(first.map((quote) => quote.price), next.map((quote) => quote.price), 'market pulse must reprice commodities')
  assert.ok(first.every((quote) => quote.supply >= 5 && quote.supply <= 95 && quote.demand >= 5 && quote.demand <= 95))
  assert.ok(goodLedger.find((quote) => quote.id === 'medicine')!.price <= badLedger.find((quote) => quote.id === 'medicine')!.price)
}

{
  const tradeState = reachTravel('fair_trade')
  assert.equal(tradeState.world.nativeTrust, 78)
  assert.equal(tradeState.resources.goodKarma, 2)
  assert.ok(tradeState.casebook.some((entry) => entry.id === 'trail-consequence'))
}

{
  const horse = reachVolcano('stop_thieves', 'sleuth', 'horse')
  const foot = reachVolcano('stop_thieves', 'sleuth', 'foot')
  assert.equal(horse.chapter, 'volcano')
  assert.ok(horse.minuteOfDay < foot.minuteOfDay, 'horse travel must take less time than walking')
  assert.ok(horse.casebook.some((entry) => entry.id === 'volcano-arrival'))
}

{
  const choices = getAvailableVolcanoChoices('doctor')
  assert.ok(choices.some((choice) => choice.id === 'treat_understudy'))
  assert.ok(!choices.some((choice) => choice.id === 'test_assay_ticket'))
  assert.ok(choices.some((choice) => choice.id === 'help_stage_manager'))
}

// --- Deduction: investigations gather evidence, cost time, and never resolve the case by themselves.
{
  const doctor = reachVolcano('fair_trade', 'doctor')
  const investigated = campaignReducer(doctor, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  assert.equal(investigated.chapter, 'volcano', 'investigating must not resolve the case')
  assert.deepEqual(investigated.volcano.evidence, ['treat_understudy'])
  assert.equal(investigated.minuteOfDay, doctor.minuteOfDay + 45, 'each investigation costs 45 minutes')
  assert.ok(investigated.casebook.some((entry) => entry.id === 'evidence-treat_understudy'))
  const repeated = campaignReducer(investigated, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  assert.equal(repeated, investigated, 'an investigation can only be taken once')
}

// --- Party knowledge: companions make their approaches available; outsiders stay locked.
{
  const doctor = reachVolcano('rush', 'doctor')
  const invalid = campaignReducer(doctor, { type: 'VOLCANO_CHOICE', choice: 'test_assay_ticket' })
  assert.equal(invalid, doctor, 'no party member holds the miner\'s knowledge — locked')
  const companion = campaignReducer(doctor, { type: 'VOLCANO_CHOICE', choice: 'inspect_trapdoor' })
  assert.notEqual(companion, doctor, 'the sleuth companion\'s approach is available to the doctor\'s party')
}

// --- Accusation gating and the Carmen rule: wrong guesses cost time and standing, never the trail.
{
  const doctor = reachVolcano('fair_trade', 'doctor')
  assert.equal(campaignReducer(doctor, { type: 'ACCUSE', suspect: 'miner' }), doctor, 'accusing with zero evidence must be blocked')
  let state = campaignReducer(doctor, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  const beforeWrong = state
  state = campaignReducer(state, { type: 'ACCUSE', suspect: 'miner' })
  assert.equal(state.chapter, 'volcano', 'a wrong accusation keeps the case open')
  assert.equal(state.resources.badKarma, 2)
  assert.equal(state.world.volcanoTrust, Math.max(0, beforeWrong.world.volcanoTrust - 12))
  assert.equal(state.minuteOfDay, beforeWrong.minuteOfDay + 30, 'a wrong accusation costs half an hour')
  assert.equal(campaignReducer(state, { type: 'ACCUSE', suspect: 'miner' }), state, 'a cleared suspect cannot be re-accused')
  // The trail continues: the correct accusation still resolves the case afterward.
  state = campaignReducer(state, { type: 'ACCUSE', suspect: 'vane_method' })
  assert.equal(state.chapter, 'resolved')
  assert.equal(state.volcano.accusation?.correct, true)
}

// --- Evidence strength decides the verdict's weight.
{
  let thin = reachVolcano('fair_trade', 'doctor')
  thin = campaignReducer(thin, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  const thinBefore = thin.world.volcanoTrust
  thin = campaignReducer(thin, { type: 'ACCUSE', suspect: 'vane_method' })
  assert.equal(thin.resources.goodKarma - 2, 1, 'a thin correct case earns 1 karma beyond the trail\'s 2')

  let strong = reachVolcano('fair_trade', 'doctor')
  strong = campaignReducer(strong, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  strong = campaignReducer(strong, { type: 'VOLCANO_CHOICE', choice: 'help_stage_manager' })
  const strongBefore = strong.world.volcanoTrust
  strong = campaignReducer(strong, { type: 'ACCUSE', suspect: 'vane_method' })
  assert.equal(strong.resources.goodKarma - 2, 3, 'a complete case earns full karma')
  assert.ok(
    strong.world.volcanoTrust - strongBefore > thin.world.volcanoTrust - thinBefore,
    'more evidence must earn more trust',
  )
}

// --- Amends: bad marks stay visible AND repairable, and unamended harm drags on the welcome.
{
  let wronged = reachVolcano('stop_thieves', 'sleuth')
  wronged = campaignReducer(wronged, { type: 'VOLCANO_CHOICE', choice: 'inspect_trapdoor' })
  wronged = campaignReducer(wronged, { type: 'ACCUSE', suspect: 'miner' })
  assert.equal(campaignReducer(wronged, { type: 'MAKE_AMENDS' }).volcano.amendsMade, true)

  const amended = campaignReducer(wronged, { type: 'MAKE_AMENDS' })
  assert.equal(amended.world.volcanoTrust, wronged.world.volcanoTrust + 8)
  assert.equal(amended.resources.badKarma, wronged.resources.badKarma, 'amends repair trust; the bad mark stays on the ledger')
  assert.equal(campaignReducer(amended, { type: 'MAKE_AMENDS' }), amended, 'amends can only be made once')

  const resolvedUnamended = campaignReducer(wronged, { type: 'ACCUSE', suspect: 'vane_method' })
  const resolvedAmended = campaignReducer(amended, { type: 'ACCUSE', suspect: 'vane_method' })
  assert.ok(
    resolvedAmended.world.volcanoTrust > resolvedUnamended.world.volcanoTrust,
    'unamended harm must mechanically reduce the town\'s final welcome — karma reads back both ways',
  )
}

// --- Peril: deterministic, survivable, with counterplay that can even help.
{
  const state = reachTravel('stop_thieves')
  assert.equal(selectPeril(state, 'horse'), null, 'seed 1849 horse travel is clear')
  const footPeril = selectPeril(state, 'foot')
  assert.ok(footPeril, 'seed 1849 foot travel meets trouble deterministically')
  const rushed = reachTravel('rush')
  assert.equal(selectPeril(rushed, 'horse')?.id, 'road_agents', 'rushing past trail trouble guarantees it reappears ahead')

  let onFoot = campaignReducer(state, { type: 'TRAVEL', mode: 'foot' })
  assert.equal(onFoot.chapter, 'peril')
  const beforeLeads = onFoot.resources.leads
  onFoot = campaignReducer(onFoot, { type: 'PERIL_CHOICE', option: 'b' })
  assert.equal(onFoot.chapter, 'volcano', 'peril always resolves into arrival — survivable by design')
  assert.equal(onFoot.resources.leads, beforeLeads + 1, 'the slower road offers up a lead')
  assert.ok(onFoot.casebook.some((entry) => entry.id === 'volcano-arrival'))
}

// --- Peril survivability floor: an empty larder costs time, never the campaign.
{
  let broke = campaignReducer(reachTravel('stop_thieves'), { type: 'TRAVEL', mode: 'foot' })
  broke = { ...broke, resources: { ...broke.resources, supplies: 0 } }
  const after = campaignReducer(broke, { type: 'PERIL_CHOICE', option: 'a' })
  assert.equal(after.chapter, 'volcano')
  assert.equal(after.resources.supplies, 0, 'supplies never go negative')
  assert.ok(after.minuteOfDay > broke.minuteOfDay, 'the shortfall is paid in time instead')
}

// --- Trail echoes are structural: fair passage shortens the road; protected freight opens the crew.
{
  const fair = campaignReducer(reachTravel('fair_trade'), { type: 'TRAVEL', mode: 'horse' })
  const plain = campaignReducer(reachTravel('stop_thieves'), { type: 'TRAVEL', mode: 'horse' })
  assert.ok(
    (fair.minuteOfDay - 8 * 60) < (plain.minuteOfDay - 8 * 60),
    'shared route knowledge from fair trade must shorten travel',
  )
  const helped = getAvailableVolcanoChoices('doctor', { stop_thieves: true }).find((choice) => choice.id === 'help_stage_manager')
  assert.equal(helped?.risk, 'low', 'protected freight makes the crew cooperative')
  const cold = getAvailableVolcanoChoices('doctor', {}).find((choice) => choice.id === 'help_stage_manager')
  assert.equal(cold?.risk, 'medium')
}

// --- The curtain: a real deadline, checked by arithmetic, not prose.
{
  assert.equal(isBeforeCurtain({ day: 1, minuteOfDay: 18 * 60 + 59 }), true)
  assert.equal(isBeforeCurtain({ day: 1, minuteOfDay: 19 * 60 }), false)
  assert.equal(isBeforeCurtain({ day: 2, minuteOfDay: 9 * 60 }), false)
  let quick = reachVolcano('fair_trade', 'doctor')
  quick = campaignReducer(quick, { type: 'VOLCANO_CHOICE', choice: 'treat_understudy' })
  quick = campaignReducer(quick, { type: 'ACCUSE', suspect: 'vane_method' })
  assert.equal(quick.volcano.accusation?.beforeCurtain, true, 'a brisk horse arrival and one investigation beat the curtain')
}

// --- Old saves reset cleanly across the version bump; malformed volcano state normalizes.
{
  const fresh = createLocalCampaign(1849)
  const legacy = { ...fresh, version: 1 } as LocalCampaignState
  assert.equal(normalizeLocalCampaign(legacy).chapter, 'setup', 'v1 saves reset to a fresh campaign')
  const mangled = normalizeLocalCampaign({ ...fresh, volcano: undefined as unknown as LocalCampaignState['volcano'] })
  assert.deepEqual(mangled.volcano.evidence, [])
  assert.equal(mangled.volcano.accusation, null)
}

// --- Full path to the future witness through the deduction flow.
{
  let state = reachVolcano('stop_thieves', 'miner')
  state = campaignReducer(state, { type: 'VOLCANO_CHOICE', choice: 'test_assay_ticket' })
  state = campaignReducer(state, { type: 'VOLCANO_CHOICE', choice: 'help_stage_manager' })
  state = campaignReducer(state, { type: 'ACCUSE', suspect: 'vane_method' })
  state = campaignReducer(state, { type: 'REVEAL_FUTURE' })
  assert.equal(state.chapter, 'future')
  assert.ok(state.casebook.some((entry) => entry.id === 'future-witness'))
  assert.ok(state.log.length >= 7)
}

{
  assert.equal(isBoundedNpcResponse('The form is honest, but the wet-ore weight is impossible.'), true)
  assert.equal(isBoundedNpcResponse('The form says 500 pounds and the ticket says 300.'), false, 'invented numbers must be rejected')
  assert.equal(isBoundedNpcResponse('You gain 3 karma and unlock a reward.'), false, 'the model must never grant state or rewards')
}

console.log('bobrLocalCampaign tests passed')
