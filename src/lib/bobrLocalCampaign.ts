export const LOCAL_CAMPAIGN_KEY = 'bobr_local_campaign_v1'
export const LOCAL_CAMPAIGN_VERSION = 2

export type PlayerRole = 'sleuth' | 'doctor' | 'priest' | 'miner'
export type AgeMode = 'under18' | 'adult'
export type PlayerPresentation = 'woman' | 'man' | 'nonbinary' | 'self_described'
export type TravelMode = 'foot' | 'horse' | 'wagon' | 'stage'
export type CampaignChapter =
  | 'setup'
  | 'escape'
  | 'trail'
  | 'arrival'
  | 'travel'
  | 'peril'
  | 'volcano'
  | 'resolved'
  | 'future'

export type PerilId = 'washout' | 'lame_horse' | 'fare_dispute' | 'road_agents'
export type SuspectId = 'miner' | 'stagehand' | 'vane_method'

export interface PerilOption {
  id: 'a' | 'b'
  label: string
  detail: string
  supplies: number
  minutes: number
  leads: number
}

export interface PerilEvent {
  id: PerilId
  title: string
  detail: string
  options: [PerilOption, PerilOption]
}

export interface VolcanoProgress {
  evidence: VolcanoChoiceId[]
  accusation: null | {
    suspect: SuspectId
    strength: number
    correct: boolean
    beforeCurtain: boolean
  }
  amendsMade: boolean
  perilId: PerilId | null
  perilResolvedWith: 'a' | 'b' | null
}

export interface PlayerProfile {
  name: string
  role: PlayerRole
  ageMode: AgeMode
  presentation: PlayerPresentation
  party: PlayerRole[]
}

export interface CasebookEntry {
  id: string
  category: 'vane' | 'town' | 'relationship' | 'economy' | 'future'
  title: string
  detail: string
  chapter: CampaignChapter
}

export interface CampaignLogEntry {
  id: string
  at: number
  chapter: CampaignChapter
  text: string
}

export interface LocalCampaignState {
  version: number
  sessionId: string
  seed: number
  chapter: CampaignChapter
  player: PlayerProfile
  day: number
  minuteOfDay: number
  resources: {
    supplies: number
    neutral: number
    goodKarma: number
    badKarma: number
    leads: number
  }
  world: {
    season: 'autumn'
    weather: 'clear' | 'rain'
    roadCondition: number
    tradeSafety: number
    nativeTrust: number
    volcanoTrust: number
  }
  flags: Record<string, boolean>
  volcano: VolcanoProgress
  casebook: CasebookEntry[]
  log: CampaignLogEntry[]
}

export interface JourneyImport {
  timeChaseComplete: boolean
  trailComplete: boolean
  reachedGoldCountry: boolean
  tradeSafetyDelta: number
  routeTrustDelta: number
  evidence: string[]
  sourceEventCount: number
}

export type CampaignAction =
  | { type: 'START'; profile: Omit<PlayerProfile, 'party'> }
  | { type: 'IMPORT_JOURNEY'; journey: JourneyImport }
  | { type: 'ESCAPE_CHOICE'; choice: 'trace_tare' | 'warn_post' | 'cut_off' }
  | { type: 'TRAIL_CHOICE'; choice: 'stop_thieves' | 'fair_trade' | 'rush' }
  | { type: 'ENTER_GOLD_COUNTRY' }
  | { type: 'TRAVEL'; mode: TravelMode }
  | { type: 'PERIL_CHOICE'; option: 'a' | 'b' }
  | { type: 'VOLCANO_CHOICE'; choice: VolcanoChoiceId }
  | { type: 'ACCUSE'; suspect: SuspectId }
  | { type: 'MAKE_AMENDS' }
  | { type: 'REVEAL_FUTURE' }
  | { type: 'REPLACE'; state: LocalCampaignState }

export type VolcanoChoiceId =
  | 'inspect_trapdoor'
  | 'treat_understudy'
  | 'protect_witness'
  | 'test_assay_ticket'
  | 'help_stage_manager'

export interface VolcanoChoice {
  id: VolcanoChoiceId
  label: string
  approach: string
  availableTo: PlayerRole | 'all'
  risk: 'low' | 'medium' | 'high'
}

export interface MarketQuote {
  id: string
  label: string
  category: 'food' | 'health' | 'livestock' | 'materials' | 'mining' | 'logistics'
  base: number
  price: number
  previousPrice: number
  trend: 'up' | 'down' | 'steady'
  supply: number
  demand: number
  reason: string
}

export const ROLE_LABELS: Record<PlayerRole, string> = {
  sleuth: 'Clockwork Sleuth',
  doctor: 'Frontier Doctor',
  priest: 'Traveling Priest',
  miner: 'Veteran Miner',
}

export const ROLE_MARKS: Record<PlayerRole, string> = {
  sleuth: 'SPY',
  doctor: 'DOC',
  priest: 'PRI',
  miner: 'MIN',
}

export const TRAVEL_MODES: Record<TravelMode, { label: string; minutes: number; supplies: number; note: string }> = {
  foot: { label: 'On foot', minutes: 310, supplies: 2, note: 'Slow, observant, and exposed to more trail events.' },
  horse: { label: 'Horse', minutes: 165, supplies: 3, note: 'Fast across the grade; feed and fatigue matter.' },
  wagon: { label: 'Wagon', minutes: 260, supplies: 1, note: 'Carries goods but pays every road and weather penalty.' },
  stage: { label: 'Stage', minutes: 125, supplies: 0, note: 'Fast on the route, if the schedule and fare cooperate.' },
}

export const VOLCANO_CHOICES: VolcanoChoice[] = [
  { id: 'inspect_trapdoor', label: 'Inspect the trapdoor and muddy boot marks', approach: 'Observation reveals how the actor left without crossing the lobby.', availableTo: 'sleuth', risk: 'low' },
  { id: 'treat_understudy', label: 'Treat the frightened understudy before questioning her', approach: 'Care earns a clear memory and a relationship that lasts.', availableTo: 'doctor', risk: 'low' },
  { id: 'protect_witness', label: 'Promise the witness confidence and safe lodging', approach: 'Trust reveals who threatened the company after rehearsal.', availableTo: 'priest', risk: 'low' },
  { id: 'test_assay_ticket', label: 'Test the assay ticket against real mill practice', approach: 'The paper is honest; the ore weight written on it is not.', availableTo: 'miner', risk: 'low' },
  { id: 'help_stage_manager', label: 'Help reset the stage and question the company', approach: 'Slower, but any party can earn the theatre crew\'s cooperation.', availableTo: 'all', risk: 'medium' },
]

/** The evening performance. Resolving the case before the crowd arrives preserves the theatre's night. */
export const CURTAIN_MINUTE = 19 * 60
export const INVESTIGATION_MINUTES = 45
export const FREE_INVESTIGATIONS = 2

export function isBeforeCurtain(state: Pick<LocalCampaignState, 'day' | 'minuteOfDay'>): boolean {
  return state.day === 1 && state.minuteOfDay < CURTAIN_MINUTE
}

export interface Suspect {
  id: SuspectId
  label: string
  theory: string
  risk: 'low' | 'medium' | 'high'
}

export const SUSPECTS: Suspect[] = [
  { id: 'miner', label: 'The miner in the front row', theory: 'The visible stranger with ore dust on his boots. Fast if right — and exactly the decoy a forger would seat there.', risk: 'high' },
  { id: 'stagehand', label: 'The indebted stagehand', theory: 'Someone inside planted the ticket. He had the access — but did he have the choice?', risk: 'medium' },
  { id: 'vane_method', label: 'No person here — the presence itself is forged', theory: 'Name the method: a real mill form, an impossible wet-ore weight, a route staged in the wrong order. Vane was never in this room.', risk: 'low' },
]

export const PERIL_EVENTS: Record<PerilId, PerilEvent> = {
  washout: {
    id: 'washout',
    title: 'The grade is washed out',
    detail: 'Rain took the road below Mokelumne Hill. The wagon cannot pass loaded, and the light is already leaning west.',
    options: [
      { id: 'a', label: 'Unload and winch it across', detail: 'Hard, wet work that spends supplies but keeps the schedule honest.', supplies: 2, minutes: 40, leads: 0 },
      { id: 'b', label: 'Take the ridge detour', detail: 'Slower — but the high trail passes a camp where someone remembers a stranger with brass weights.', supplies: 0, minutes: 90, leads: 1 },
    ],
  },
  lame_horse: {
    id: 'lame_horse',
    title: 'The horse pulls up lame',
    detail: 'A stone bruise on the off fore. It is not cruel to go on — it is impossible.',
    options: [
      { id: 'a', label: 'Poultice and rest an hour', detail: 'Costs daylight and a little feed; the horse finishes the road sound.', supplies: 1, minutes: 60, leads: 0 },
      { id: 'b', label: 'Trade down at the way station', detail: 'Swap for a slower mule and keep moving; the trader talks about the road ahead.', supplies: 0, minutes: 35, leads: 1 },
    ],
  },
  fare_dispute: {
    id: 'fare_dispute',
    title: 'The stage driver doubles the fare',
    detail: 'Half the seats are freight now — road risk has a price, and today you are the one paying it.',
    options: [
      { id: 'a', label: 'Pay the new fare', detail: 'Expensive but immediate; the driver keeps the schedule.', supplies: 2, minutes: 0, leads: 0 },
      { id: 'b', label: 'Ride the freight bench and help at stops', detail: 'Work your passage; the teamsters trade road gossip worth hearing.', supplies: 0, minutes: 55, leads: 1 },
    ],
  },
  road_agents: {
    id: 'road_agents',
    title: 'Road agents watch the narrows',
    detail: 'The danger left unresolved on the trail has ridden ahead of you. Two men wait where the road pinches.',
    options: [
      { id: 'a', label: 'Share supplies and pass as travelers', detail: 'A toll paid in goods, not blood. Nobody is proud of it; everybody is alive.', supplies: 2, minutes: 15, leads: 0 },
      { id: 'b', label: 'Wait for the freight wagons and pass together', detail: 'Numbers make peace. The teamsters remember who waited with them.', supplies: 0, minutes: 75, leads: 1 },
    ],
  },
}

/**
 * Deterministic peril selection — same seed, mode, weather, and trail history
 * always produce the same event (or none). Rushing past the trail trouble
 * guarantees the danger reappears ahead of you.
 */
export function selectPeril(state: LocalCampaignState, mode: TravelMode): PerilEvent | null {
  if (state.flags.rush) return PERIL_EVENTS.road_agents
  if (state.world.weather === 'rain' && mode === 'wagon') return PERIL_EVENTS.washout
  const roll = (state.seed * 7 + { foot: 0, horse: 1, wagon: 2, stage: 3 }[mode] * 13) % 10
  if (roll >= 4) return null
  if (mode === 'horse') return PERIL_EVENTS.lame_horse
  if (mode === 'stage') return PERIL_EVENTS.fare_dispute
  return PERIL_EVENTS.washout
}

function defaultProfile(): PlayerProfile {
  return {
    name: 'Traveler',
    role: 'sleuth',
    ageMode: 'adult',
    presentation: 'self_described',
    party: ['sleuth', 'doctor', 'miner'],
  }
}

function partyFor(role: PlayerRole): PlayerRole[] {
  const companions: Record<PlayerRole, PlayerRole[]> = {
    sleuth: ['sleuth', 'doctor', 'miner'],
    doctor: ['doctor', 'sleuth', 'priest'],
    priest: ['priest', 'doctor', 'miner'],
    miner: ['miner', 'sleuth', 'doctor'],
  }
  return companions[role]
}

function logEntry(chapter: CampaignChapter, text: string, index: number): CampaignLogEntry {
  return { id: chapter + '-' + index, at: index, chapter, text }
}

export function createLocalCampaign(seed = 1849): LocalCampaignState {
  return {
    version: LOCAL_CAMPAIGN_VERSION,
    sessionId: 'local-' + seed,
    seed,
    chapter: 'setup',
    player: defaultProfile(),
    day: 1,
    minuteOfDay: 8 * 60,
    resources: { supplies: 12, neutral: 28, goodKarma: 0, badKarma: 0, leads: 4 },
    world: {
      season: 'autumn',
      weather: seed % 3 === 0 ? 'rain' : 'clear',
      roadCondition: seed % 3 === 0 ? 62 : 82,
      tradeSafety: 45,
      nativeTrust: 40,
      volcanoTrust: 30,
    },
    flags: {},
    volcano: { evidence: [], accusation: null, amendsMade: false, perilId: null, perilResolvedWith: null },
    casebook: [],
    log: [logEntry('setup', 'A new local campaign was prepared for playtesting.', 0)],
  }
}

function withLog(state: LocalCampaignState, text: string): LocalCampaignState {
  const nextIndex = state.log.length
  return {
    ...state,
    log: [...state.log, logEntry(state.chapter, text, nextIndex)].slice(-80),
  }
}

function addCasebook(state: LocalCampaignState, entry: CasebookEntry): LocalCampaignState {
  if (state.casebook.some((item) => item.id === entry.id)) return state
  return { ...state, casebook: [...state.casebook, entry] }
}

function advanceTime(state: LocalCampaignState, minutes: number): Pick<LocalCampaignState, 'day' | 'minuteOfDay'> {
  const total = state.minuteOfDay + minutes
  return {
    day: state.day + Math.floor(total / 1440),
    minuteOfDay: total % 1440,
  }
}

export function campaignReducer(state: LocalCampaignState, action: CampaignAction): LocalCampaignState {
  if (action.type === 'REPLACE') return normalizeLocalCampaign(action.state)

  if (action.type === 'START') {
    if (state.chapter !== 'setup') return state
    const name = action.profile.name.trim().slice(0, 32) || 'Traveler'
    const next: LocalCampaignState = {
      ...state,
      chapter: 'escape',
      player: { ...action.profile, name, party: partyFor(action.profile.role) },
    }
    return withLog(next, name + ' entered the chase after Cyrus Vane.')
  }

  if (action.type === 'IMPORT_JOURNEY') {
    if (state.chapter !== 'escape') return state
    const journey = action.journey
    const chapter: CampaignChapter = journey.reachedGoldCountry || journey.trailComplete
      ? 'arrival'
      : journey.timeChaseComplete
        ? 'trail'
        : 'escape'
    let next: LocalCampaignState = {
      ...state,
      chapter,
      flags: {
        ...state.flags,
        imported_production_journey: true,
        imported_time_chase: journey.timeChaseComplete,
        imported_trail: journey.trailComplete,
        imported_gold_country: journey.reachedGoldCountry,
      },
      resources: {
        ...state.resources,
        leads: state.resources.leads + Math.min(3, journey.evidence.length),
      },
      world: {
        ...state.world,
        tradeSafety: Math.max(0, Math.min(100, state.world.tradeSafety + journey.tradeSafetyDelta)),
        nativeTrust: Math.max(0, Math.min(100, state.world.nativeTrust + journey.routeTrustDelta)),
      },
    }

    if (journey.timeChaseComplete) {
      next = addCasebook(next, {
        id: 'production-time-chase',
        category: 'vane',
        title: 'The warrant crossed into this journey',
        chapter: 'escape',
        detail: 'The production ledger confirms that Cyrus Vane was cornered outside time. His recorded tells remain evidence, not a replayed reward.',
      })
    }
    if (journey.trailComplete || journey.reachedGoldCountry) {
      next = addCasebook(next, {
        id: 'production-trail',
        category: 'economy',
        title: 'Consequences carried west',
        chapter: 'trail',
        detail: 'The production trail reached Gold Country. Road safety, local trust, and surviving evidence now shape this case without copying currency or issuing new karma.',
      })
    }
    if (journey.evidence.length > 0) {
      next = addCasebook(next, {
        id: 'production-evidence',
        category: 'future',
        title: 'Prior journey evidence',
        chapter: chapter === 'arrival' ? 'arrival' : 'escape',
        detail: journey.evidence.join(' | '),
      })
    }
    return withLog(next, 'Imported a read-only production journey with ' + journey.sourceEventCount + ' ledger events; no balances or rewards were copied.')
  }

  if (action.type === 'ESCAPE_CHOICE') {
    if (state.chapter !== 'escape') return state
    let next: LocalCampaignState = { ...state, chapter: 'trail', flags: { ...state.flags, [action.choice]: true } }
    if (action.choice === 'trace_tare') next = { ...next, resources: { ...next.resources, leads: next.resources.leads + 1 } }
    if (action.choice === 'warn_post') next = { ...next, world: { ...next.world, tradeSafety: next.world.tradeSafety + 5 } }
    if (action.choice === 'cut_off') next = { ...next, resources: { ...next.resources, supplies: next.resources.supplies - 1 } }
    next = addCasebook(next, {
      id: 'vane-tare-mark', category: 'vane', title: 'The brass tare mark', chapter: 'escape',
      detail: 'Vane leaves the same shaved-weight mark in every era. His disguises change; the forgery of presence does not.',
    })
    return withLog(next, 'Vane escaped into 1849; the party carried one readable tell onto the trail.')
  }

  if (action.type === 'TRAIL_CHOICE') {
    if (state.chapter !== 'trail') return state
    let next: LocalCampaignState = { ...state, chapter: 'arrival', flags: { ...state.flags, [action.choice]: true } }
    let detail = ''
    if (action.choice === 'stop_thieves') {
      next = { ...next, world: { ...next.world, tradeSafety: 78 }, resources: { ...next.resources, supplies: next.resources.supplies - 2, goodKarma: next.resources.goodKarma + 2 } }
      detail = 'The party stopped a theft without taking the recovered freight. The next town receives its flour and medicine.'
    }
    if (action.choice === 'fair_trade') {
      next = { ...next, world: { ...next.world, nativeTrust: 78, tradeSafety: 60 }, resources: { ...next.resources, neutral: next.resources.neutral - 4, goodKarma: next.resources.goodKarma + 2 } }
      detail = 'The party negotiated a fair exchange and safe passage. Local traders now share route knowledge instead of avoiding the road.'
    }
    if (action.choice === 'rush') {
      next = { ...next, world: { ...next.world, tradeSafety: 30 }, resources: { ...next.resources, supplies: next.resources.supplies + 1 } }
      detail = 'The party kept its supplies but left the road unresolved. Freight risk and suspicion follow them west.'
    }
    next = addCasebook(next, { id: 'trail-consequence', category: 'economy', title: 'The road remembers', chapter: 'trail', detail })
    return withLog(next, detail)
  }

  if (action.type === 'ENTER_GOLD_COUNTRY') {
    if (state.chapter !== 'arrival') return state
    const next = { ...state, chapter: 'travel' as const }
    return withLog(next, 'Gold Country opened as Level 2. Volcano reported a missing actor and a false assay ticket.')
  }

  if (action.type === 'TRAVEL') {
    if (state.chapter !== 'travel') return state
    const mode = TRAVEL_MODES[action.mode]
    const weatherPenalty = state.world.weather === 'rain' ? 45 : 0
    const roadPenalty = action.mode === 'wagon' ? Math.max(0, 80 - state.world.roadCondition) : 0
    // Fair passage earned on the trail pays forward: shared route knowledge shortens the road.
    const routeKnowledge = state.flags.fair_trade ? 0.85 : 1
    const totalMinutes = Math.round((mode.minutes + weatherPenalty + roadPenalty) * routeKnowledge)
    const elapsed = advanceTime(state, totalMinutes)
    const fare = action.mode === 'stage' ? 5 : 0
    const peril = selectPeril(state, action.mode)
    let next: LocalCampaignState = {
      ...state,
      ...elapsed,
      chapter: peril ? 'peril' : 'volcano',
      flags: { ...state.flags, ['traveled_' + action.mode]: true },
      volcano: { ...state.volcano, perilId: peril ? peril.id : null },
      resources: {
        ...state.resources,
        supplies: Math.max(0, state.resources.supplies - mode.supplies),
        neutral: Math.max(0, state.resources.neutral - fare),
      },
    }
    if (peril) {
      return withLog(next, 'On the road to Volcano: ' + peril.title.toLowerCase() + '. The party must choose how to meet it.')
    }
    next = addCasebook(next, {
      id: 'volcano-arrival', category: 'town', title: 'Volcano: the curtain will not rise', chapter: 'travel',
      detail: 'The theatre\'s lead actor vanished after finding a false assay ticket beneath the stage. The evening crowd is already arriving.',
    })
    return withLog(next, 'The party reached Volcano by ' + mode.label.toLowerCase() + ' after ' + totalMinutes + ' minutes.')
  }

  if (action.type === 'PERIL_CHOICE') {
    if (state.chapter !== 'peril' || !state.volcano.perilId) return state
    const event = PERIL_EVENTS[state.volcano.perilId]
    const option = event.options.find((item) => item.id === action.option)
    if (!option) return state
    // Peril is survivable by design: an empty larder costs extra time, never the campaign.
    const shortfall = Math.max(0, option.supplies - state.resources.supplies)
    const elapsed = advanceTime(state, option.minutes + shortfall * 30)
    let next: LocalCampaignState = {
      ...state,
      ...elapsed,
      chapter: 'volcano',
      volcano: { ...state.volcano, perilResolvedWith: option.id },
      flags: { ...state.flags, ['peril_' + event.id]: true },
      resources: {
        ...state.resources,
        supplies: Math.max(0, state.resources.supplies - option.supplies),
        leads: state.resources.leads + option.leads,
      },
    }
    next = addCasebook(next, {
      id: 'peril-' + event.id, category: 'town', title: event.title, chapter: 'peril',
      detail: option.detail + (option.leads > 0 ? ' The road itself offered up a lead.' : ''),
    })
    next = addCasebook(next, {
      id: 'volcano-arrival', category: 'town', title: 'Volcano: the curtain will not rise', chapter: 'travel',
      detail: 'The theatre\'s lead actor vanished after finding a false assay ticket beneath the stage. The evening crowd is already arriving.',
    })
    return withLog(next, 'The party met the road\'s trouble: ' + option.label.toLowerCase() + '.')
  }

  if (action.type === 'VOLCANO_CHOICE') {
    if (state.chapter !== 'volcano') return state
    const choice = VOLCANO_CHOICES.find((item) => item.id === action.choice)
    if (!choice || (choice.availableTo !== 'all' && !state.player.party.includes(choice.availableTo))) return state
    if (state.volcano.evidence.includes(action.choice)) return state
    // The first investigations are free; pressing further spends a lead.
    const leadCost = state.volcano.evidence.length >= FREE_INVESTIGATIONS ? 1 : 0
    if (leadCost > state.resources.leads) return state
    const clueByChoice: Record<VolcanoChoiceId, string> = {
      inspect_trapdoor: 'The trapdoor mud contains theatre sawdust over mine tailings: someone staged the actor\'s route in the wrong order.',
      treat_understudy: 'Once calm, the understudy remembers Vane asking whether the hotel ledger could prove he slept in town.',
      protect_witness: state.flags.rush
        ? 'The witness is skittish — road danger followed the party into town — but under promise of lodging he names the threat made after rehearsal.'
        : 'Under confidence, the stagehand admits Vane threatened to expose a debt unless the forged ticket was planted.',
      test_assay_ticket: 'The ticket uses a real mill form but records an impossible wet-ore weight. The paper is honest; the presence is forged.',
      help_stage_manager: state.flags.stop_thieves
        ? 'The crew already knows the party protected their freight on the trail. They talk freely: a fresh nail through an old floorboard, and the hidden ticket below it.'
        : 'Resetting the stage exposes a fresh nail through an old floorboard and the hidden assay ticket below it.',
    }
    const elapsed = advanceTime(state, INVESTIGATION_MINUTES)
    let next: LocalCampaignState = {
      ...state,
      ...elapsed,
      flags: { ...state.flags, [action.choice]: true },
      volcano: { ...state.volcano, evidence: [...state.volcano.evidence, action.choice] },
      resources: { ...state.resources, leads: state.resources.leads - leadCost },
    }
    next = addCasebook(next, {
      id: 'evidence-' + action.choice, category: 'vane', title: choice.label, chapter: 'volcano',
      detail: clueByChoice[action.choice],
    })
    return withLog(next, clueByChoice[action.choice])
  }

  if (action.type === 'ACCUSE') {
    if (state.chapter !== 'volcano') return state
    if (state.volcano.evidence.length === 0) return state
    if (state.flags['cleared_' + action.suspect]) return state
    const beforeCurtain = isBeforeCurtain(state)

    if (action.suspect !== 'vane_method') {
      // Carmen rule: a wrong guess costs time and standing — never the trail.
      const isMiner = action.suspect === 'miner'
      const elapsed = advanceTime(state, 30)
      let next: LocalCampaignState = {
        ...state,
        ...elapsed,
        flags: { ...state.flags, ['cleared_' + action.suspect]: true, wrong_accusation: true },
        resources: {
          ...state.resources,
          badKarma: state.resources.badKarma + (isMiner ? 2 : 1),
          leads: state.resources.leads + (isMiner ? 0 : 1),
        },
        world: { ...state.world, volcanoTrust: Math.max(0, state.world.volcanoTrust - (isMiner ? 12 : 6)) },
      }
      next = addCasebook(next, {
        id: 'accusation-' + action.suspect, category: 'relationship', chapter: 'volcano',
        title: isMiner ? 'The miner was the visible decoy' : 'The stagehand was coerced, not the forger',
        detail: isMiner
          ? 'The accusation lands on an innocent stranger before the whole town. The case stays open; the harm is now part of it.'
          : 'He planted the ticket under threat of a debt exposed. Accusing him publicly names Vane\'s coercion — and shames a trapped man. The real forgery is still unnamed.',
      })
      return withLog(next, isMiner
        ? 'The miner stood accused before the curtain — and was innocent. Volcano remembers.'
        : 'The stagehand confessed to planting the ticket under threat. The method behind it is still unnamed.')
    }

    const strength = state.volcano.evidence.length
    const strong = strength >= 2
    // Kindness witnessed comes back; harm unamended drags. Both directions are mechanical, not decorative.
    const unamendedDrag = state.volcano.amendsMade ? 0 : state.resources.badKarma * 3
    const trustGain = Math.max(6, 16 + 6 * Math.min(strength, 3) + (beforeCurtain ? 4 : 0) - unamendedDrag)
    let next: LocalCampaignState = {
      ...state,
      chapter: 'resolved',
      flags: { ...state.flags, volcano_case_resolved: true },
      volcano: { ...state.volcano, accusation: { suspect: action.suspect, strength, correct: true, beforeCurtain } },
      resources: { ...state.resources, goodKarma: state.resources.goodKarma + (strong ? 3 : 1) },
      world: { ...state.world, volcanoTrust: Math.min(100, state.world.volcanoTrust + trustGain) },
    }
    next = addCasebook(next, {
      id: 'volcano-proof', category: 'town', title: 'The false assay beneath the stage', chapter: 'volcano',
      detail: strong
        ? 'The party names the method — a real form, an impossible weight, a staged route — and every gathered piece of evidence holds it up in public. Vane was never in the room.'
        : 'The party names the forgery correctly, but with thin evidence. Volcano believes them — barely — and the record shows how close doubt came to winning.',
    })
    next = addCasebook(next, {
      id: 'volcano-relationship', category: 'relationship', chapter: 'volcano',
      title: state.flags.wrong_accusation ? 'Trust rebuilt on the record' : 'The theatre remembers the help',
      detail: state.flags.wrong_accusation
        ? 'The town saw the party accuse wrongly, and saw what they did about it afterward. Both are in the ledger.'
        : 'The old actor and hotel keeper now recognize the party as people who help before they demand answers.',
    })
    return withLog(next, (beforeCurtain
      ? 'The case closed before the curtain rose; the evening performance went on. '
      : 'The case closed after dark; the crowd had already gone home. ')
      + (strong ? 'The proof was gathered, public, and complete.' : 'The proof was correct but thin.'))
  }

  if (action.type === 'MAKE_AMENDS') {
    if (state.chapter !== 'volcano' && state.chapter !== 'resolved') return state
    if (!state.flags.wrong_accusation || state.volcano.amendsMade) return state
    const elapsed = advanceTime(state, 60)
    let next: LocalCampaignState = {
      ...state,
      ...elapsed,
      volcano: { ...state.volcano, amendsMade: true },
      flags: { ...state.flags, amends_made: true },
      resources: { ...state.resources, supplies: Math.max(0, state.resources.supplies - 2) },
      world: { ...state.world, volcanoTrust: Math.min(100, state.world.volcanoTrust + 8) },
    }
    next = addCasebook(next, {
      id: 'volcano-amends', category: 'relationship', title: 'Amends made in public', chapter: state.chapter,
      detail: 'The party stood in front of the same crowd that heard the accusation, named the mistake, and spent an hour and their own supplies putting it right. The bad mark stays on the ledger; so does this.',
    })
    return withLog(next, 'Amends were made where the harm was done. The record keeps both.')
  }

  if (action.type === 'REVEAL_FUTURE') {
    if (state.chapter !== 'resolved') return state
    let next: LocalCampaignState = { ...state, chapter: 'future', flags: { ...state.flags, future_witness_revealed: true } }
    next = addCasebook(next, {
      id: 'future-witness', category: 'future', title: 'A future player reads this visit', chapter: 'future',
      detail: 'The next guest finds a verified trace: someone protected the road, helped Volcano, and left the local story more trustworthy than they found it.',
    })
    return withLog(next, 'The party\'s present became a future witness instead of a claim nobody honestly lived.')
  }

  return state
}

export function getAvailableVolcanoChoices(role: PlayerRole, flags: Record<string, boolean> = {}, party?: PlayerRole[]): VolcanoChoice[] {
  // Companions keep other kinds of knowledge visible: a party member's approach is available, not just the lead's.
  const members = party ?? partyFor(role)
  return VOLCANO_CHOICES
    .filter((choice) => choice.availableTo === 'all' || members.includes(choice.availableTo))
    .map((choice) => (choice.id === 'help_stage_manager' && flags.stop_thieves
      ? { ...choice, risk: 'low' as const, approach: 'The crew remembers their freight arriving safely. Cooperation comes easy to the party that protected it.' }
      : choice))
}

export function getSaloonOffer(ageMode: AgeMode): { drink: string; vice: string; hostRole: string } {
  if (ageMode === 'under18') {
    return {
      drink: 'Cold sarsaparilla',
      vice: 'The card table becomes an observation puzzle; harsh language and adult propositions are absent.',
      hostRole: 'The house mistress is a guarded community informant who protects workers and knows who entered by the back stair.',
    }
  }
  return {
    drink: 'Beer, whisky, or sarsaparilla',
    vice: 'Gambling stakes, rougher language, and exploitation may appear with player controls and historical context.',
    hostRole: 'The house mistress manages safety, debts, introductions, and information without being reduced to scenery.',
  }
}

export function getMarketQuotes(state: LocalCampaignState, marketTick = 0, karmaLedgerBias = 0): MarketQuote[] {
  const weather = state.world.weather === 'rain' ? 0.12 : 0
  const safety = (50 - state.world.tradeSafety) / 200
  const trust = (50 - state.world.nativeTrust) / 250
  const ledger = Math.max(-1, Math.min(1, karmaLedgerBias))
  const definitions = [
    { id: 'flour', label: 'Flour', category: 'food' as const, base: 8, weather: 1, safety: 1, trust: 1, volatility: 0.08, karma: 0.05 },
    { id: 'medicine', label: 'Medicine', category: 'health' as const, base: 18, weather: 1.5, safety: 1.2, trust: 0.3, volatility: 0.12, karma: 0.08 },
    { id: 'feed', label: 'Feed', category: 'livestock' as const, base: 6, weather: 0.5, safety: 0.4, trust: 1, volatility: 0.1, karma: 0.04 },
    { id: 'tools', label: 'Tools', category: 'materials' as const, base: 14, weather: 0.25, safety: 0.7, trust: 0.2, volatility: 0.14, karma: 0.03 },
    { id: 'lumber', label: 'Lumber', category: 'materials' as const, base: 12, weather: 0.8, safety: 0.8, trust: 0.15, volatility: 0.16, karma: 0.03 },
    { id: 'ore', label: 'Assay ore', category: 'mining' as const, base: 22, weather: 0.1, safety: 0.5, trust: 0.1, volatility: 0.22, karma: 0.01 },
    { id: 'cloth', label: 'Cloth', category: 'materials' as const, base: 10, weather: 0.35, safety: 0.9, trust: 0.3, volatility: 0.11, karma: 0.04 },
    { id: 'freight', label: 'Freight space', category: 'logistics' as const, base: 16, weather: 1.2, safety: 1.4, trust: 0.6, volatility: 0.18, karma: 0.06 },
  ]

  const quoteAt = (item: typeof definitions[number], index: number, tick: number) => {
    const pulse = Math.sin((state.seed + tick * 17 + index * 31) * 0.173) * item.volatility
    const factor = Math.max(0.62,
      1 +
      weather * item.weather +
      safety * item.safety +
      trust * item.trust +
      pulse -
      ledger * item.karma,
    )
    return Math.max(1, Math.round(item.base * factor))
  }

  return definitions.map((item, index) => {
    const price = quoteAt(item, index, marketTick)
    const previousPrice = quoteAt(item, index, marketTick - 1)
    const trend = price > previousPrice ? 'up' as const : price < previousPrice ? 'down' as const : 'steady' as const
    const supply = Math.max(5, Math.min(95, Math.round(65 + state.world.tradeSafety * 0.25 - weather * 80 + Math.sin((marketTick + index) * 0.7) * 12)))
    const demand = Math.max(5, Math.min(95, Math.round(45 + weather * 90 + (100 - state.world.roadCondition) * 0.2 + Math.cos((marketTick + index * 2) * 0.55) * 14)))
    const reason = state.flags.stop_thieves
      ? 'Recovered freight and a safer road lowered the risk premium.'
      : state.flags.fair_trade
        ? 'Fair passage and shared route knowledge improved supply.'
        : state.flags.rush
          ? 'Unresolved road danger raised freight risk.'
          : ledger > 0.2
            ? 'Verified helpful actions are improving trust and lowering exchange friction.'
            : ledger < -0.2
              ? 'Poor ledger history is increasing deposits, escorts, and risk premiums.'
              : 'Weather, supply, demand, and route reports are repricing this commodity.'
    return { id: item.id, label: item.label, category: item.category, base: item.base, price, previousPrice, trend, supply, demand, reason }
  })
}

export function formatCampaignTime(state: LocalCampaignState): string {
  const hours = Math.floor(state.minuteOfDay / 60)
  const minutes = state.minuteOfDay % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return 'Day ' + state.day + ', ' + displayHour + ':' + String(minutes).padStart(2, '0') + ' ' + suffix
}

export function isBoundedNpcResponse(response: unknown): response is string {
  if (typeof response !== 'string') return false
  const text = response.trim()
  if (text.length < 8 || text.length > 600) return false
  if (/\d/.test(text)) return false
  if (/\b(karma|reward|quest complete|inventory|experience points?|price|discount|minted?|verified visit|casebook added)\b/i.test(text)) return false
  if (/\b(I (?:give|grant|award|unlock)|you (?:gain|receive|earn|unlock))\b/i.test(text)) return false
  return true
}

export function normalizeLocalCampaign(candidate: LocalCampaignState): LocalCampaignState {
  if (!candidate || candidate.version !== LOCAL_CAMPAIGN_VERSION) return createLocalCampaign()
  const safe = createLocalCampaign(Number.isFinite(candidate.seed) ? candidate.seed : 1849)
  return {
    ...safe,
    ...candidate,
    player: { ...safe.player, ...candidate.player, party: Array.isArray(candidate.player?.party) ? candidate.player.party : safe.player.party },
    resources: { ...safe.resources, ...candidate.resources },
    world: { ...safe.world, ...candidate.world },
    flags: candidate.flags && typeof candidate.flags === 'object' ? candidate.flags : {},
    volcano: {
      ...safe.volcano,
      ...(candidate.volcano && typeof candidate.volcano === 'object' ? candidate.volcano : {}),
      evidence: Array.isArray(candidate.volcano?.evidence) ? candidate.volcano.evidence.slice(0, VOLCANO_CHOICES.length) : [],
    },
    casebook: Array.isArray(candidate.casebook) ? candidate.casebook.slice(0, 100) : [],
    log: Array.isArray(candidate.log) ? candidate.log.slice(-80) : safe.log,
  }
}

export function loadLocalCampaign(): LocalCampaignState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_CAMPAIGN_KEY)
    return raw ? normalizeLocalCampaign(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveLocalCampaign(state: LocalCampaignState): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LOCAL_CAMPAIGN_KEY, JSON.stringify(state)) } catch { /* local play continues without persistence */ }
}
