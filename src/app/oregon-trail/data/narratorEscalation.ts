/**
 * Narrator Escalation System — Improvement #7
 * Inspired by: The Hitchhiker's Guide to the Galaxy (Infocom, 1984)
 *
 * The narrator becomes increasingly unreliable, hostile, and deceptive
 * as trust erodes. Trust drops from bad outcomes, aggressive play,
 * and repetitive behavior. Low trust triggers lies, withheld info,
 * drunk episodes, and fourth-wall-breaking tirades.
 */

// ============================================================================
// TRUST MODIFICATION TRIGGERS
// ============================================================================

export interface TrustTrigger {
  id: string
  event: string           // What happened
  trustDelta: number      // How much trust changes (-3 to +2)
  intoxicationDelta?: number  // Optional intoxication change
  annoyanceDelta?: number     // Optional annoyance change
  narratorReaction?: string   // What the narrator says
  category: 'outcome' | 'pattern' | 'choice' | 'milestone' | 'discovery'
}

/** Events that DECREASE narrator trust */
export const TRUST_LOSS_TRIGGERS: TrustTrigger[] = [
  // Bad outcomes
  {
    id: 'party_death',
    event: 'party_member_died',
    trustDelta: -2,
    annoyanceDelta: 1,
    narratorReaction: 'The narrator tried to warn you. The narrator always tries.',
    category: 'outcome',
  },
  {
    id: 'starvation',
    event: 'food_depleted',
    trustDelta: -1,
    narratorReaction: 'Out of food. The narrator mentioned rationing, but who listens to the narrator?',
    category: 'outcome',
  },
  {
    id: 'wagon_broken',
    event: 'wagon_condition_critical',
    trustDelta: -1,
    annoyanceDelta: 1,
    narratorReaction: 'The wagon is falling apart. The narrator is unsurprised.',
    category: 'outcome',
  },
  {
    id: 'bad_river_crossing',
    event: 'river_crossing_failed',
    trustDelta: -1,
    narratorReaction: 'The narrator suggested the ferry. Just putting that out there.',
    category: 'outcome',
  },
  {
    id: 'disease_outbreak',
    event: 'multiple_sick',
    trustDelta: -1,
    intoxicationDelta: 1,
    narratorReaction: 'Everyone is sick. The narrator needs a drink.',
    category: 'outcome',
  },

  // Aggressive patterns
  {
    id: 'aggressive_play',
    event: 'aggressive_pattern',
    trustDelta: -2,
    annoyanceDelta: 2,
    narratorReaction: 'Violence. How predictable. The narrator expected more creativity.',
    category: 'pattern',
  },
  {
    id: 'repetitive_play',
    event: 'same_action_repeated',
    trustDelta: -1,
    annoyanceDelta: 2,
    narratorReaction: 'You keep doing the same thing. The narrator is losing the will to narrate.',
    category: 'pattern',
  },

  // Bad choices
  {
    id: 'grueling_pace_long',
    event: 'grueling_pace_3_days',
    trustDelta: -1,
    annoyanceDelta: 1,
    narratorReaction: 'Three days at grueling pace. The narrator questions your leadership.',
    category: 'choice',
  },
  {
    id: 'bare_bones_long',
    event: 'bare_bones_3_days',
    trustDelta: -1,
    narratorReaction: 'Your party is starving by choice. The narrator finds this philosophically troubling.',
    category: 'choice',
  },
  {
    id: 'ignored_warning',
    event: 'ignored_narrator_warning',
    trustDelta: -1,
    annoyanceDelta: 1,
    narratorReaction: 'The narrator warned you. The narrator is keeping score.',
    category: 'choice',
  },
]

/** Events that INCREASE narrator trust */
export const TRUST_GAIN_TRIGGERS: TrustTrigger[] = [
  {
    id: 'reached_landmark',
    event: 'arrived_at_landmark',
    trustDelta: 1,
    narratorReaction: 'You made it. The narrator is... relieved.',
    category: 'milestone',
  },
  {
    id: 'healed_party',
    event: 'all_party_healthy',
    trustDelta: 1,
    narratorReaction: 'Everyone is healthy. The narrator allows themselves a moment of hope.',
    category: 'outcome',
  },
  {
    id: 'good_hunting',
    event: 'successful_hunt',
    trustDelta: 1,
    narratorReaction: 'A successful hunt. Perhaps there is hope for you after all.',
    category: 'outcome',
  },
  {
    id: 'cautious_play',
    event: 'cautious_pattern',
    trustDelta: 1,
    annoyanceDelta: -1,
    narratorReaction: 'Careful and methodical. The narrator approves.',
    category: 'pattern',
  },
  {
    id: 'clue_found',
    event: 'investigation_clue',
    trustDelta: 1,
    narratorReaction: 'A clue! The narrator\'s faith in your detective abilities grows slightly.',
    category: 'discovery',
  },
]

// ============================================================================
// ESCALATION TIERS
// ============================================================================

export interface EscalationTier {
  name: string
  trustRange: [number, number]  // [min, max] inclusive
  description: string
  behaviours: EscalationBehaviour[]
  moodBias: string[]           // Moods the narrator gravitates toward
  lieChance: number            // 0-1, chance of lying per comment
  withholdChance: number       // 0-1, chance of withholding info
  drinkChance: number          // 0-1, chance of drinking per major event
}

export interface EscalationBehaviour {
  type: 'lie' | 'withhold' | 'drink' | 'sarcasm' | 'fourth_wall' | 'refuse' | 'mislead'
  description: string
  weight: number  // Relative probability within this tier
}

export const ESCALATION_TIERS: EscalationTier[] = [
  {
    name: 'Trustworthy',
    trustRange: [8, 10],
    description: 'The narrator is mostly helpful and reliable.',
    behaviours: [
      { type: 'sarcasm', description: 'Mild witty observations', weight: 3 },
      { type: 'fourth_wall', description: 'Occasional meta-comments', weight: 1 },
    ],
    moodBias: ['neutral', 'impressed', 'amused'],
    lieChance: 0.02,
    withholdChance: 0.05,
    drinkChance: 0.05,
  },
  {
    name: 'Skeptical',
    trustRange: [5, 7],
    description: 'The narrator is growing weary of your decisions.',
    behaviours: [
      { type: 'sarcasm', description: 'Pointed sarcastic commentary', weight: 4 },
      { type: 'withhold', description: 'Occasionally omits useful details', weight: 2 },
      { type: 'drink', description: 'Starts drinking more frequently', weight: 1 },
    ],
    moodBias: ['annoyed', 'bored', 'cryptic'],
    lieChance: 0.08,
    withholdChance: 0.15,
    drinkChance: 0.15,
  },
  {
    name: 'Hostile',
    trustRange: [3, 4],
    description: 'The narrator is actively working against you.',
    behaviours: [
      { type: 'lie', description: 'Tells outright lies about dangers and routes', weight: 3 },
      { type: 'withhold', description: 'Withholds critical survival info', weight: 3 },
      { type: 'mislead', description: 'Gives bad advice disguised as help', weight: 2 },
      { type: 'drink', description: 'Frequently drunk, slurring narration', weight: 2 },
      { type: 'refuse', description: 'Refuses to describe certain events', weight: 1 },
    ],
    moodBias: ['annoyed', 'drinking', 'cryptic'],
    lieChance: 0.25,
    withholdChance: 0.35,
    drinkChance: 0.30,
  },
  {
    name: 'Adversarial',
    trustRange: [0, 2],
    description: 'The narrator has become your enemy.',
    behaviours: [
      { type: 'lie', description: 'Lies constantly about everything', weight: 4 },
      { type: 'fourth_wall', description: 'Breaks fourth wall to taunt the player', weight: 3 },
      { type: 'refuse', description: 'Refuses to narrate, goes on strike', weight: 2 },
      { type: 'mislead', description: 'Actively tries to get you killed', weight: 3 },
      { type: 'drink', description: 'Permanently drunk', weight: 2 },
    ],
    moodBias: ['drinking', 'annoyed', 'cryptic', 'apologetic'],
    lieChance: 0.45,
    withholdChance: 0.50,
    drinkChance: 0.50,
  },
]

// ============================================================================
// PATTERN-TRIGGERED REACTIONS
// ============================================================================

export interface PatternReaction {
  pattern: string           // From getPlayerPattern()
  minOccurrences: number    // How many times pattern detected before reaction
  narratorResponse: string
  trustDelta: number
  annoyanceDelta: number
  specialAction?: 'start_lying' | 'start_drinking' | 'break_fourth_wall' | 'go_on_strike'
}

export const PATTERN_REACTIONS: PatternReaction[] = [
  {
    pattern: 'same_action_repeated',
    minOccurrences: 1,
    narratorResponse: 'You keep doing the same thing. The narrator is keeping a tally.',
    trustDelta: -1,
    annoyanceDelta: 2,
  },
  {
    pattern: 'same_action_repeated',
    minOccurrences: 3,
    narratorResponse: 'Five times. Five. The narrator is going to start making things up just to keep themselves entertained.',
    trustDelta: -1,
    annoyanceDelta: 1,
    specialAction: 'start_lying',
  },
  {
    pattern: 'aggressive_pattern',
    minOccurrences: 1,
    narratorResponse: 'All this violence. The narrator preferred the quiet parts.',
    trustDelta: -1,
    annoyanceDelta: 2,
  },
  {
    pattern: 'aggressive_pattern',
    minOccurrences: 3,
    narratorResponse: 'The narrator has had enough of your bloodlust. They are taking a drink and refusing to describe the next violent act in detail.',
    trustDelta: -2,
    annoyanceDelta: 1,
    specialAction: 'start_drinking',
  },
  {
    pattern: 'cautious_pattern',
    minOccurrences: 1,
    narratorResponse: 'Careful. Methodical. The narrator appreciates a thinker.',
    trustDelta: 1,
    annoyanceDelta: -1,
  },
  {
    pattern: 'cautious_pattern',
    minOccurrences: 3,
    narratorResponse: 'You are so cautious it borders on cowardice. But the narrator respects it. Survival is its own kind of bravery.',
    trustDelta: 1,
    annoyanceDelta: 0,
  },
]

// ============================================================================
// ESCALATION COMMENTS (tier-specific narrator lines)
// ============================================================================

export const ESCALATION_COMMENTS: Record<string, string[]> = {
  // Hostile tier: narrator starts being mean
  hostile_travel: [
    'The trail continues. The narrator declines to elaborate.',
    'You travel. Things happen. The narrator is on break.',
    'Miles pass. The narrator supposes you want a medal.',
  ],
  hostile_event: [
    'Something bad happened. The narrator could have warned you. They chose not to.',
    'An event! The narrator won\'t spoil it by describing it accurately.',
    'The narrator remembers when they cared about your wellbeing. Vaguely.',
  ],
  hostile_town: [
    'A town. The narrator will describe it when they\'re good and ready.',
    'You\'ve arrived somewhere. The narrator is busy.',
    'Welcome to... somewhere. The narrator forgot the name on purpose.',
  ],

  // Adversarial tier: narrator actively sabotages
  adversarial_travel: [
    'The narrator would like you to know that the road ahead is perfectly safe. *The narrator is lying.*',
    'Everything is fine. Nothing to worry about. The narrator laughs quietly.',
    'The narrator has decided to stop narrating and start commentating. On your failures.',
  ],
  adversarial_event: [
    'Oh, this is a fun one. The narrator has been looking forward to this.',
    'The narrator will describe this event with the accuracy it deserves. Which is to say, none.',
    'An event occurs! The narrator would explain, but they\'re three whiskeys deep and everything is hilarious.',
  ],
  adversarial_town: [
    'A town! The narrator assures you the prices are fair. The narrator is lying again.',
    'Welcome to... the narrator genuinely cannot be bothered.',
    'The narrator notices you\'ve arrived at another town you\'ll probably ruin.',
  ],

  // Fourth wall breaks at low trust
  fourth_wall_low_trust: [
    'You know I can see your save file, right? I know how many times you\'ve reloaded.',
    'The narrator wonders if you know this is a game. Of course you do. You just keep making the same mistakes anyway.',
    'Between you and the narrator, this story isn\'t going well. For either of us.',
    'The narrator has considered quitting. But contractual obligations.',
    'Do you think if the narrator stopped talking, the game would continue? Let\'s not find out.',
  ],

  // Narrator strike lines
  strike: [
    '...',
    'The narrator refuses to describe this.',
    '[The narrator is on strike. Please enjoy this silence.]',
    'No. Figure it out yourself.',
    '[This narration has been withheld due to industrial action.]',
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current escalation tier based on trust level
 */
export function getEscalationTier(trustLevel: number): EscalationTier {
  const clamped = Math.max(0, Math.min(10, trustLevel))
  return ESCALATION_TIERS.find(
    tier => clamped >= tier.trustRange[0] && clamped <= tier.trustRange[1]
  ) || ESCALATION_TIERS[0]
}

/**
 * Should the narrator lie right now?
 */
export function shouldNarratorLie(trustLevel: number): boolean {
  const tier = getEscalationTier(trustLevel)
  return Math.random() < tier.lieChance
}

/**
 * Should the narrator withhold information?
 */
export function shouldNarratorWithhold(trustLevel: number): boolean {
  const tier = getEscalationTier(trustLevel)
  return Math.random() < tier.withholdChance
}

/**
 * Should the narrator drink?
 */
export function shouldNarratorDrink(trustLevel: number): boolean {
  const tier = getEscalationTier(trustLevel)
  return Math.random() < tier.drinkChance
}

/**
 * Get a tier-appropriate comment for a situation
 */
export function getEscalationComment(trustLevel: number, situation: 'travel' | 'event' | 'town'): string | null {
  const tier = getEscalationTier(trustLevel)

  if (tier.name === 'Hostile') {
    const comments = ESCALATION_COMMENTS[`hostile_${situation}`]
    return comments?.[Math.floor(Math.random() * comments.length)] || null
  }

  if (tier.name === 'Adversarial') {
    const comments = ESCALATION_COMMENTS[`adversarial_${situation}`]
    return comments?.[Math.floor(Math.random() * comments.length)] || null
  }

  return null
}

/**
 * Get a pattern reaction if the pattern has been seen enough times
 */
export function getPatternReaction(
  pattern: string,
  patternCounts: Record<string, number>
): PatternReaction | null {
  const count = patternCounts[pattern] || 0

  // Find the highest-threshold reaction that applies
  const applicable = PATTERN_REACTIONS
    .filter(r => r.pattern === pattern && count >= r.minOccurrences)
    .sort((a, b) => b.minOccurrences - a.minOccurrences)

  return applicable[0] || null
}

/**
 * Find the trust trigger for a given event
 */
export function findTrustTrigger(event: string): TrustTrigger | null {
  return (
    TRUST_LOSS_TRIGGERS.find(t => t.event === event) ||
    TRUST_GAIN_TRIGGERS.find(t => t.event === event) ||
    null
  )
}
