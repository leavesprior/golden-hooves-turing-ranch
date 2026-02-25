/**
 * NPC Memory & Relationship System — Improvement #5
 * Inspired by: Neverwinter Nights (BioWare, 2002)
 *
 * NPCs remember past interactions, develop opinions, and gate
 * dialogue/rewards behind relationship levels. Each NPC tracks
 * a "disposition" (0-100) that changes based on player choices,
 * gift-giving, quest completion, and dialogue tone.
 */

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export type DispositionLevel = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'trusted' | 'devoted'

export interface RelationshipMemory {
  event: string               // What happened
  delta: number               // How it changed disposition
  timestamp: number           // When it happened (game day)
  description: string         // Human-readable
}

export interface NPCRelationship {
  npcId: string
  disposition: number         // 0-100, starts at 50 for most NPCs
  level: DispositionLevel
  memories: RelationshipMemory[]
  giftsGiven: string[]        // Item IDs given as gifts
  questsCompletedFor: string[] // Quest IDs done for this NPC
  timesHelped: number
  timesAntagonized: number
  lastInteraction: number     // Game day
  personalOpinion: string     // Generated opinion text based on history
}

// ============================================================================
// DISPOSITION THRESHOLDS
// ============================================================================

export const DISPOSITION_LEVELS: { level: DispositionLevel; min: number; max: number; description: string }[] = [
  { level: 'hostile', min: 0, max: 15, description: 'This person wants nothing to do with you. Or worse.' },
  { level: 'unfriendly', min: 16, max: 35, description: 'They tolerate your presence. Barely.' },
  { level: 'neutral', min: 36, max: 55, description: 'Indifferent. You are just another face on the trail.' },
  { level: 'friendly', min: 56, max: 75, description: 'They greet you warmly and offer fair deals.' },
  { level: 'trusted', min: 76, max: 90, description: 'They confide secrets and go out of their way to help.' },
  { level: 'devoted', min: 91, max: 100, description: 'A true ally. They would risk their life for you.' },
]

/**
 * Get disposition level from numeric value
 */
export function getDispositionLevel(disposition: number): DispositionLevel {
  const clamped = Math.max(0, Math.min(100, disposition))
  const level = DISPOSITION_LEVELS.find(l => clamped >= l.min && clamped <= l.max)
  return level?.level || 'neutral'
}

/**
 * Get disposition level description
 */
export function getDispositionDescription(disposition: number): string {
  const clamped = Math.max(0, Math.min(100, disposition))
  const level = DISPOSITION_LEVELS.find(l => clamped >= l.min && clamped <= l.max)
  return level?.description || 'Unknown.'
}

// ============================================================================
// DISPOSITION MODIFIERS
// ============================================================================

export interface DispositionModifier {
  id: string
  event: string
  delta: number
  description: string
  category: 'dialogue' | 'gift' | 'quest' | 'action' | 'reputation'
}

/** Standard disposition changes from interactions */
export const DISPOSITION_MODIFIERS: DispositionModifier[] = [
  // Dialogue choices
  { id: 'polite_greeting', event: 'dialogue_polite', delta: 3, description: 'Spoke respectfully', category: 'dialogue' },
  { id: 'rude_greeting', event: 'dialogue_rude', delta: -5, description: 'Was rude or dismissive', category: 'dialogue' },
  { id: 'insightful_response', event: 'dialogue_insightful', delta: 5, description: 'Said something thoughtful', category: 'dialogue' },
  { id: 'threatening', event: 'dialogue_threaten', delta: -10, description: 'Made threats', category: 'dialogue' },
  { id: 'flattery', event: 'dialogue_flatter', delta: 2, description: 'Flattered them', category: 'dialogue' },
  { id: 'honest_answer', event: 'dialogue_honest', delta: 4, description: 'Was honest when it mattered', category: 'dialogue' },
  { id: 'lied', event: 'dialogue_lie', delta: -8, description: 'Was caught lying', category: 'dialogue' },

  // Gifts
  { id: 'gift_food', event: 'gift_food', delta: 5, description: 'Shared food', category: 'gift' },
  { id: 'gift_medicine', event: 'gift_medicine', delta: 8, description: 'Gave medicine to sick NPC', category: 'gift' },
  { id: 'gift_ammo', event: 'gift_ammunition', delta: 4, description: 'Shared ammunition', category: 'gift' },
  { id: 'gift_money', event: 'gift_karma', delta: 6, description: 'Gave karma currency', category: 'gift' },

  // Quests
  { id: 'quest_completed', event: 'quest_for_npc', delta: 15, description: 'Completed their quest', category: 'quest' },
  { id: 'quest_failed', event: 'quest_failed_npc', delta: -10, description: 'Failed their quest', category: 'quest' },
  { id: 'quest_refused', event: 'quest_refused', delta: -3, description: 'Refused to help', category: 'quest' },

  // Actions
  { id: 'helped_in_combat', event: 'helped_combat', delta: 10, description: 'Fought alongside them', category: 'action' },
  { id: 'stole_from', event: 'stole', delta: -20, description: 'Caught stealing', category: 'action' },
  { id: 'saved_life', event: 'saved_life', delta: 25, description: 'Saved their life', category: 'action' },
  { id: 'attacked', event: 'attacked_npc', delta: -30, description: 'Attacked them', category: 'action' },
  { id: 'trade_fair', event: 'fair_trade', delta: 2, description: 'Fair trade deal', category: 'action' },
  { id: 'trade_swindle', event: 'swindle', delta: -8, description: 'Tried to swindle them', category: 'action' },

  // Reputation (from faction standing, carried across NPCs in same location)
  { id: 'good_reputation', event: 'good_reputation_bonus', delta: 5, description: 'Your reputation precedes you (positively)', category: 'reputation' },
  { id: 'bad_reputation', event: 'bad_reputation_penalty', delta: -5, description: 'Your reputation precedes you (negatively)', category: 'reputation' },
]

// ============================================================================
// RELATIONSHIP-GATED CONTENT
// ============================================================================

export interface RelationshipGate {
  minDisposition: DispositionLevel
  type: 'dialogue' | 'shop_discount' | 'secret_info' | 'quest' | 'gift' | 'shortcut'
  description: string
}

/** What becomes available at each relationship level */
export const RELATIONSHIP_GATES: Record<DispositionLevel, string[]> = {
  hostile: [
    'NPC refuses to talk',
    'Shop prices doubled',
    'May attack or call authorities',
  ],
  unfriendly: [
    'Short, unhelpful responses',
    'Shop prices +25%',
    'Will not share any information',
  ],
  neutral: [
    'Standard dialogue options',
    'Normal shop prices',
    'Basic information shared',
  ],
  friendly: [
    'Bonus dialogue branches unlock',
    'Shop prices -10%',
    'Shares rumors and tips',
    'May offer small gifts',
  ],
  trusted: [
    'Secret dialogue options unlock',
    'Shop prices -25%',
    'Reveals hidden information and clues',
    'Offers quest opportunities',
    'Shares personal stories',
  ],
  devoted: [
    'All dialogue options available',
    'Best possible prices',
    'Reveals critical secrets',
    'Offers to join party temporarily',
    'Gives rare items as gifts',
  ],
}

// ============================================================================
// GREETING VARIANTS BY RELATIONSHIP
// ============================================================================

export const RELATIONSHIP_GREETINGS: Record<DispositionLevel, string[]> = {
  hostile: [
    'You again? Get out before I make you.',
    '*reaches for weapon* Not another step.',
    'The nerve. Coming back here after what you\'ve done.',
  ],
  unfriendly: [
    '*cold stare* What do you want?',
    'Make it quick. I\'m busy.',
    'I remember you. Can\'t say I\'m pleased.',
  ],
  neutral: [
    'Howdy, stranger.',
    'What brings you by?',
    'Can I help you with something?',
  ],
  friendly: [
    'Well, look who it is! Good to see you again.',
    'Friend! Come in, come in.',
    'I was hoping you\'d stop by.',
  ],
  trusted: [
    'My friend! I\'ve been saving something for you.',
    'Thank goodness you\'re here. I need your advice.',
    'You\'re a sight for sore eyes. Sit down, let me pour you something.',
  ],
  devoted: [
    'There they are! The best person on this whole trail.',
    'I\'d follow you to the ends of the earth. Well, we\'re already here, aren\'t we?',
    'Whatever you need. You know I\'m with you.',
  ],
}

// ============================================================================
// OPINION GENERATION
// ============================================================================

/**
 * Generate a personal opinion text based on relationship history
 */
export function generateOpinion(relationship: NPCRelationship): string {
  const { disposition, timesHelped, timesAntagonized, memories } = relationship
  const level = getDispositionLevel(disposition)

  if (memories.length === 0) return 'Has no opinion yet.'

  const recentMemories = memories.slice(-3)
  const recentPositive = recentMemories.filter(m => m.delta > 0).length
  const recentNegative = recentMemories.filter(m => m.delta < 0).length

  const parts: string[] = []

  // Overall stance
  if (level === 'hostile' || level === 'unfriendly') {
    parts.push(timesAntagonized > 3 ? 'Deeply distrusts you.' : 'Wary of your intentions.')
  } else if (level === 'friendly') {
    parts.push(timesHelped > 2 ? 'Considers you a friend.' : 'Warming up to you.')
  } else if (level === 'trusted' || level === 'devoted') {
    parts.push('Loyal and committed to your cause.')
  }

  // Recent trend
  if (recentPositive > recentNegative) {
    parts.push('Recent interactions have been positive.')
  } else if (recentNegative > recentPositive) {
    parts.push('Recent interactions have soured things.')
  }

  // Special notes
  if (relationship.giftsGiven.length > 0) {
    parts.push(`Remembers ${relationship.giftsGiven.length} gift(s) you gave.`)
  }
  if (relationship.questsCompletedFor.length > 0) {
    parts.push(`Grateful for ${relationship.questsCompletedFor.length} task(s) you completed.`)
  }

  return parts.join(' ')
}

// ============================================================================
// SHOP PRICE MULTIPLIER
// ============================================================================

/**
 * Get shop price multiplier based on disposition
 */
export function getShopPriceMultiplier(disposition: number): number {
  const level = getDispositionLevel(disposition)
  switch (level) {
    case 'hostile': return 2.0
    case 'unfriendly': return 1.25
    case 'neutral': return 1.0
    case 'friendly': return 0.9
    case 'trusted': return 0.75
    case 'devoted': return 0.65
  }
}

/**
 * Get a random greeting based on disposition level
 */
export function getRelationshipGreeting(disposition: number): string {
  const level = getDispositionLevel(disposition)
  const greetings = RELATIONSHIP_GREETINGS[level]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

/**
 * Create a new default relationship for an NPC
 */
export function createRelationship(npcId: string, startingDisposition: number = 50): NPCRelationship {
  return {
    npcId,
    disposition: startingDisposition,
    level: getDispositionLevel(startingDisposition),
    memories: [],
    giftsGiven: [],
    questsCompletedFor: [],
    timesHelped: 0,
    timesAntagonized: 0,
    lastInteraction: 0,
    personalOpinion: 'Has no opinion yet.',
  }
}

/**
 * Apply a disposition modifier and return the updated relationship
 */
export function applyDispositionChange(
  relationship: NPCRelationship,
  modifierId: string,
  gameDay: number,
): NPCRelationship {
  const modifier = DISPOSITION_MODIFIERS.find(m => m.id === modifierId)
  if (!modifier) return relationship

  const newDisposition = Math.max(0, Math.min(100, relationship.disposition + modifier.delta))
  const memory: RelationshipMemory = {
    event: modifier.event,
    delta: modifier.delta,
    timestamp: gameDay,
    description: modifier.description,
  }

  const updated: NPCRelationship = {
    ...relationship,
    disposition: newDisposition,
    level: getDispositionLevel(newDisposition),
    memories: [...relationship.memories.slice(-19), memory],
    timesHelped: modifier.delta > 0 ? relationship.timesHelped + 1 : relationship.timesHelped,
    timesAntagonized: modifier.delta < 0 ? relationship.timesAntagonized + 1 : relationship.timesAntagonized,
    lastInteraction: gameDay,
  }

  updated.personalOpinion = generateOpinion(updated)
  return updated
}
