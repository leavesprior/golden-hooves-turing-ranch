/**
 * Twain Cross-Mode Narrator Integration
 *
 * Reads from CrossGameStorage.getEventLog() and generates Twain-voice
 * commentary that references events from OTHER game modes. The narrator
 * feels like he has been watching the player across all games — sardonic,
 * Western, literary, dry wit, occasional em-dashes.
 */

import { CrossGameStorage, type WorldEvent, type GameId, type WorldEventAction } from './crossGameProgression'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Display names Twain uses when referencing other game modes */
const GAME_NAMES: Record<GameId, string> = {
  prospectors_tale: 'the Trail',
  rpg_adventure: 'Gold Country',
  gold_country_explorer: 'the Explorer\'s map',
  prologue: 'the ancient world',
  ranch_treasure_hunt: 'the ranch grounds',
  mystery_game: 'the investigation',
  location_hunt: 'the location hunt',
  clue_game: 'Cynthia\'s quest',
  karma_marketplace: 'the marketplace',
}

/** Probability of returning a cross-reference (avoid spam) */
const CROSS_REFERENCE_CHANCE = 0.30

/** Probability that getEscalatedComment will inject a cross-game line */
const ESCALATION_CROSS_CHANCE = 0.15

// ============================================================================
// TYPES
// ============================================================================

export interface TwainCrossReference {
  text: string
  sourceEvent: WorldEvent
  relevance: 'direct' | 'thematic' | 'sardonic'
}

// ============================================================================
// EVENT REACTION TEMPLATES
// ============================================================================

/**
 * Immediate Twain reactions keyed by WorldEventAction.
 * Each action has 2-3 variants. Templates may reference {name}, {location},
 * {detail}, and {karmaDelta} which are filled from event.impact.
 */
const EVENT_REACTIONS: Partial<Record<WorldEventAction, string[]>> = {
  greedy_hoarding: [
    'The narrator notes you have taken to hoarding like a squirrel in November. Only squirrels have the excuse of winter.',
    'Avarice is merely economy run mad — and you, friend, have been sprinting.',
    'The narrator observes you collecting possessions the way some men collect regrets — compulsively and without clear purpose.',
  ],
  generous_sharing: [
    'Generosity in the wilderness is either saintly or foolish. The narrator has not yet determined which applies here.',
    'You gave away what you had. The narrator would call it noble if nobility paid for supper.',
    'The narrator tips his hat. Charity is a fine habit — provided one can afford it, which you increasingly cannot.',
  ],
  party_member_died: [
    'And so {name} passes from this narrative. The narrator will miss them. You, apparently, will not.',
    'The narrator records another departure. {name} has gone to that country from which no traveler returns — unlike this trail, from which no traveler returns intact.',
    '{name} is gone. The narrator had half a chapter planned for them. Wasted ink.',
  ],
  party_member_saved: [
    '{name} lives, against considerable odds and the narrator\'s expectations.',
    'The narrator concedes that saving {name} was the right call. Do not let it go to your head.',
  ],
  survived_trail: [
    'You survived. The narrator is as surprised as anyone, and more surprised than most.',
    'Against the advice of probability and the narrator\'s private wager, you have endured.',
  ],
  completed_chapter: [
    'Another chapter concluded. The narrator turns the page with the weariness of a man who has read too many.',
    'Chapter complete. The narrator would applaud, but his hands are occupied with the pen.',
  ],
  discovery_made: [
    'A discovery! The narrator observes that discovery is merely organized curiosity. And occasionally, blind luck.',
    'You have found something. The narrator knew it was there, of course, but it seemed rude to mention.',
    'Discovery — that agreeable sensation of stumbling upon what was already obvious to the narrator.',
  ],
  confrontation_won: [
    'Victory, such as it is. The narrator has seen less violent quilting bees.',
    'You won. The narrator suggests not examining too closely how.',
    'The confrontation ends in your favor — a phrase which here means "everyone else fared worse."',
  ],
  confrontation_fled: [
    'Discretion is the better part of valor. The narrator is being diplomatic about your retreat.',
    'You ran. The narrator does not judge. The narrator merely records, with raised eyebrow.',
  ],
  confrontation_lost: [
    'The narrator regrets to inform you that you have been thoroughly defeated. Condolences.',
    'You lost. The narrator would offer comfort, but comfort is in short supply out here.',
  ],
  mystery_solved: [
    'You have solved it. The narrator knew all along, of course, but it seemed rude to mention.',
    'The mystery unravels. The narrator observes that truth, once found, is considerably less interesting than the search for it.',
    'Case closed. The narrator awards you full marks for detection and partial marks for the property damage.',
  ],
  ally_recruited: [
    'You have made a friend. The narrator recommends counting your possessions nightly.',
    'An ally joins your cause. The narrator gives it three days before the first disagreement.',
    'A new companion. The narrator observes that the word "companion" shares a root with "bread" — meaning someone you break bread with. Or who breaks you.',
  ],
  ranch_visited: [
    'Back of Beyond Ranch. The narrator has opinions about the name, none of them printable.',
    'You have arrived at the ranch. The narrator notes the air smells of hay, history, and questionable decisions.',
  ],
  landmark_reached: [
    'A landmark. The narrator has been here before — in his imagination, which is considerably more comfortable.',
    'You have reached {location}. The narrator marks the occasion with appropriate solemnity, which is to say, very little.',
  ],
  item_acquired: [
    'You have acquired {detail}. The narrator wonders where you plan to put it.',
    'Another acquisition. Your pack grows heavier; your judgment, lighter.',
  ],
  npc_befriended: [
    'You have charmed another soul. The narrator admires the efficiency with which you collect people.',
    'A friendship forged in the furnace of mutual necessity. The West\'s most reliable adhesive.',
  ],
  npc_angered: [
    'You have made an enemy. The narrator suggests sleeping with one eye open — the traditional number.',
    'Another burned bridge. The narrator is running out of bridges to narrate.',
  ],
  karma_milestone: [
    'Your karma tips the scales. The narrator observes that the universe is keeping score, even if you are not.',
    'A karmic reckoning. The narrator has seen ledgers balanced with less ceremony.',
  ],
  bounty_completed: [
    'Bounty collected. The narrator notes that justice and profit rarely ride the same horse — but today they managed.',
    'The bounty is done. The narrator records it with the satisfaction of a man closing a long chapter.',
  ],
  time_echo_found: [
    'An echo from across the centuries. The narrator shivers, and not from the cold.',
    'Time, the narrator observes, is not a river but a canyon — and you have just heard its echo.',
  ],
  spiritual_site_visited: [
    'You stand on sacred ground. The narrator falls, briefly, silent.',
    'The earth here remembers what men have forgotten. The narrator recommends listening.',
  ],
  treasure_found: [
    'Treasure! The narrator reminds you that the love of money is the root of all evil. The money itself, however, is quite useful.',
    'You have found treasure. The narrator had a map all along but felt it would spoil the story.',
  ],
  shop_purchase: [
    'Commerce. The narrator observes that a fool and his money are soon parted — but you got supplies, so perhaps not entirely foolish.',
  ],
  camp_rested: [
    'Rest. The narrator could use some himself, but narrators do not get shore leave.',
  ],
  skill_unlocked: [
    'A new skill acquired. The narrator notes that education is what survives when what has been learned has been forgotten.',
  ],
  prologue_act_completed: [
    'An ancient act concludes. The narrator has been narrating since before there were narrators, and this ranks among the more interesting.',
  ],
  custom: [
    'Something happened. The narrator declines to elaborate further.',
  ],
}

// ============================================================================
// CROSS-REFERENCE TEMPLATES
// ============================================================================

/**
 * Templates for cross-game references. {gameName} is the source game display
 * name, {detail} is from the event label or impact, {name} is a survivor name
 * if present.
 */
const CROSS_TEMPLATES: Record<string, { texts: string[]; relevance: TwainCrossReference['relevance'] }> = {
  greedy_hoarding: {
    texts: [
      'The narrator recalls your hoarding habits over on {gameName}. Some things, it seems, travel well.',
      'I see the collector is at it again. Your acquisitive nature was well-documented on {gameName}, where you famously hoarded {detail}.',
    ],
    relevance: 'direct',
  },
  generous_sharing: {
    texts: [
      'The narrator remembers your generosity on {gameName}. It was either touching or naive — the jury is still out.',
    ],
    relevance: 'thematic',
  },
  party_member_died: {
    texts: [
      'The narrator still remembers {name} from {gameName}. A good soul. Alas.',
      '{name}, lost on {gameName}. The narrator carries their memory so you don\'t have to.',
    ],
    relevance: 'direct',
  },
  mystery_solved: {
    texts: [
      'The narrator hears you fancy yourself a detective over on {gameName}. Let us see if that investigative spirit survives present circumstances.',
      'A sleuth, are we? Your reputation from {gameName} precedes you — along with its property damage.',
    ],
    relevance: 'thematic',
  },
  confrontation_won: {
    texts: [
      'Word of your victory on {gameName} has traveled far. The narrator suggests you earned it. Mostly.',
      'The narrator recalls your fighting spirit on {gameName}. Let us hope it serves you equally well here.',
    ],
    relevance: 'sardonic',
  },
  confrontation_lost: {
    texts: [
      'The narrator recalls a less triumphant chapter on {gameName}. Growth, however, is a process.',
    ],
    relevance: 'sardonic',
  },
  ally_recruited: {
    texts: [
      'You collected companions on {gameName} the way some men collect hats — enthusiastically and without clear purpose.',
    ],
    relevance: 'thematic',
  },
  discovery_made: {
    texts: [
      'Your discovery on {gameName} suggests a natural talent for finding things. The narrator hopes it extends beyond trouble.',
    ],
    relevance: 'thematic',
  },
  survived_trail: {
    texts: [
      'I see you survived {gameName} with your faculties mostly intact. Word travels fast in these parts.',
      'The narrator notes your survival on {gameName}. Persistence or luck — the narrator declines to specify.',
    ],
    relevance: 'direct',
  },
  ranch_visited: {
    texts: [
      'The ranch, again. The narrator sees you are drawn back like a moth to a particularly rustic flame.',
    ],
    relevance: 'sardonic',
  },
  spiritual_site_visited: {
    texts: [
      'The narrator recalls your reverence at the sacred sites on {gameName}. It was — unexpectedly — genuine.',
    ],
    relevance: 'thematic',
  },
  treasure_found: {
    texts: [
      'The narrator hears you found treasure on {gameName}. The narrator hopes you spent it wisely. The narrator doubts it.',
    ],
    relevance: 'sardonic',
  },
}

// ============================================================================
// KARMA COMMENTARY
// ============================================================================

const KARMA_GOOD_COMMENTS: string[] = [
  'The narrator observes your karma shines like a freshly minted coin. Suspiciously so.',
  'A paragon of virtue, or at least a dedicated impersonator of one. The narrator reserves judgment.',
  'Your goodness is well-documented. The narrator finds it faintly exhausting.',
]

const KARMA_BAD_COMMENTS: string[] = [
  'The narrator notes your karma reads like a wanted poster. Several, in fact.',
  'Your moral ledger is the sort of thing that makes accountants weep. The narrator is darkly amused.',
  'Villainy, they say, is its own reward. The narrator observes you have been handsomely compensated.',
]

const KARMA_NEUTRAL_COMMENTS: string[] = [
  'You are a person of perfect ambiguity. The narrator cannot decide whether to admire or pity that.',
  'Your karma is so balanced it could serve as a spirit level. The narrator finds this deeply unsettling.',
]

// ============================================================================
// LEGACY WELCOME TEMPLATES
// ============================================================================

const LEGACY_WELCOME_TEMPLATES: string[] = [
  'I see you survived {gameName} with {eventCount} tales worth telling. Word travels fast in Gold Country.',
  'The narrator notes your adventures on {gameName} — {eventCount} incidents, each more improbable than the last. Welcome back.',
  'Ah, a returning traveler from {gameName}. The narrator has been following your exploits — all {eventCount} of them — with professional interest.',
  'The narrator recognizes you from {gameName}. {eventCount} events, and you lived to tell the tale. The narrator almost didn\'t.',
]

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get a Twain-voice cross-reference to events from OTHER game modes.
 * Returns null ~70% of the time (don't spam), or if no cross-game events exist.
 */
export function getTwainCrossReference(
  currentMode: GameId,
  context?: string
): TwainCrossReference | null {
  // Roll for chance — 30% of calls produce a reference
  if (Math.random() > CROSS_REFERENCE_CHANCE) return null

  const events = CrossGameStorage.getEventLog()
  const otherEvents = events.filter(e => e.mode !== currentMode)

  if (otherEvents.length === 0) return null

  // Pick the most relevant event: prefer recent events with matching context
  let picked: WorldEvent
  if (context) {
    const contextLower = context.toLowerCase()
    const contextual = otherEvents.filter(e =>
      e.label.toLowerCase().includes(contextLower) ||
      e.action.includes(contextLower) ||
      (e.impact?.detail && e.impact.detail.toLowerCase().includes(contextLower))
    )
    picked = contextual.length > 0
      ? contextual[contextual.length - 1]
      : otherEvents[Math.floor(Math.random() * otherEvents.length)]
  } else {
    // Bias toward recent events: pick from last third
    const recentSlice = otherEvents.slice(-Math.max(1, Math.ceil(otherEvents.length / 3)))
    picked = recentSlice[Math.floor(Math.random() * recentSlice.length)]
  }

  const templates = CROSS_TEMPLATES[picked.action]
  if (!templates) return null

  const template = templates.texts[Math.floor(Math.random() * templates.texts.length)]
  const text = fillTemplate(template, picked)

  return {
    text,
    sourceEvent: picked,
    relevance: templates.relevance,
  }
}

/**
 * Called on game mode enter (first load). Returns a welcome-back line
 * referencing significant events from other modes. Returns null if
 * no cross-game events exist yet.
 */
export function getTwainLegacyComment(currentMode: GameId): string | null {
  const events = CrossGameStorage.getEventLog()
  const otherEvents = events.filter(e => e.mode !== currentMode)

  if (otherEvents.length === 0) return null

  // Find the mode with the most events (the player's "other life")
  const modeCounts: Partial<Record<GameId, number>> = {}
  for (const e of otherEvents) {
    modeCounts[e.mode] = (modeCounts[e.mode] || 0) + 1
  }

  let topMode: GameId = otherEvents[0].mode
  let topCount = 0
  for (const [mode, count] of Object.entries(modeCounts)) {
    if (count! > topCount) {
      topMode = mode as GameId
      topCount = count!
    }
  }

  const gameName = GAME_NAMES[topMode] || topMode
  const template = LEGACY_WELCOME_TEMPLATES[Math.floor(Math.random() * LEGACY_WELCOME_TEMPLATES.length)]

  return template
    .replace(/\{gameName\}/g, gameName)
    .replace(/\{eventCount\}/g, String(topCount))
}

/**
 * Returns a karma-based Twain comment, or null if karma pool is empty.
 */
export function getTwainKarmaComment(): string | null {
  const karma = CrossGameStorage.loadSharedKarma()
  const total = karma.good + karma.bad + karma.neutral

  if (total === 0) return null

  const goodRatio = karma.good / Math.max(1, total)
  const badRatio = karma.bad / Math.max(1, total)

  if (goodRatio > 0.65) {
    return KARMA_GOOD_COMMENTS[Math.floor(Math.random() * KARMA_GOOD_COMMENTS.length)]
  }
  if (badRatio > 0.65) {
    return KARMA_BAD_COMMENTS[Math.floor(Math.random() * KARMA_BAD_COMMENTS.length)]
  }
  return KARMA_NEUTRAL_COMMENTS[Math.floor(Math.random() * KARMA_NEUTRAL_COMMENTS.length)]
}

/**
 * Given a just-logged WorldEvent, returns an immediate Twain narrator
 * reaction. Covers all WorldEventAction types with 2-3 variants each.
 * Returns null for unknown actions.
 */
export function getTwainEventReaction(event: WorldEvent): string | null {
  const templates = EVENT_REACTIONS[event.action]
  if (!templates || templates.length === 0) return null

  const template = templates[Math.floor(Math.random() * templates.length)]
  return fillTemplate(template, event)
}

/**
 * Convenience: get the escalation-injection cross reference.
 * Used by narratorContext to splice cross-game lines into escalation flow.
 * Returns null (1 - ESCALATION_CROSS_CHANCE) of the time.
 */
export function getTwainEscalationCrossRef(currentMode: GameId): string | null {
  if (Math.random() > ESCALATION_CROSS_CHANCE) return null

  const ref = getTwainCrossReference(currentMode)
  return ref?.text ?? null
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Fill a template string with data from a WorldEvent.
 * Supported placeholders: {name}, {location}, {detail}, {karmaDelta}, {gameName}
 */
function fillTemplate(template: string, event: WorldEvent): string {
  const name = event.impact?.survivorName || 'a companion'
  const location = event.impact?.locationId || 'parts unknown'
  const detail = event.impact?.detail || event.label
  const karmaDelta = event.impact?.karmaDelta != null ? String(event.impact.karmaDelta) : '0'
  const gameName = GAME_NAMES[event.mode] || event.mode

  return template
    .replace(/\{name\}/g, name)
    .replace(/\{location\}/g, location)
    .replace(/\{detail\}/g, detail)
    .replace(/\{karmaDelta\}/g, karmaDelta)
    .replace(/\{gameName\}/g, gameName)
}
