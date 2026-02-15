/**
 * BOBR Trophy Engine
 *
 * Defines trophy conditions computed from aggregated game state.
 * Each trophy has a rarity tier, condition check, and display metadata.
 */

export type TrophyRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface TrophyCheckState {
  // Adventure progress
  chapter: number
  level: number
  xp: number
  locationsDiscovered: number
  confrontationsWon: number
  // RPG ending
  rpgEnding: string | null
  // Karma alignment (-100 to +100)
  lawfulChaotic: number
  goodEvil: number
  // Faction reputation (-100 to +100)
  pinkertonRep: number
  settlersRep: number
  nativesRep: number
  outlawsRep: number
  // Cross-game
  timeEchoes: number
  milestonesCount: number
  completedBounties: number
  // Karma wallet
  casesWithoutHints: number
  // S.A.D.D.L.E. stats (0-20)
  saddle: {
    Shrewdness: number
    Agility: number
    Durability: number
    Diplomacy: number
    Luck: number
    Expertise: number
  }
}

export interface TrophyDefinition {
  id: string
  name: string
  description: string
  icon: string
  rarity: TrophyRarity
  check: (state: TrophyCheckState) => boolean
}

export const RARITY_COLORS: Record<TrophyRarity, string> = {
  common: '#9CA3AF',     // gray
  uncommon: '#22C55E',   // green
  rare: '#3B82F6',       // blue
  epic: '#A855F7',       // purple
  legendary: '#EAB308',  // gold
}

export const RARITY_LABELS: Record<TrophyRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  // Chapter progression
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Begin your journey on the trail.',
    icon: '\uD83E\uDDB6',
    rarity: 'common',
    check: (s) => s.chapter >= 1,
  },
  {
    id: 'into_wilderness',
    name: 'Into the Wilderness',
    description: 'Venture beyond the safety of town.',
    icon: '\uD83C\uDF32',
    rarity: 'common',
    check: (s) => s.chapter >= 2,
  },
  {
    id: 'heart_gold_country',
    name: 'Heart of Gold Country',
    description: 'Reach the heart of the California gold fields.',
    icon: '\u2764\uFE0F',
    rarity: 'uncommon',
    check: (s) => s.chapter >= 3,
  },
  {
    id: 'the_reckoning',
    name: 'The Reckoning',
    description: 'Face the consequences of your choices.',
    icon: '\u2696\uFE0F',
    rarity: 'uncommon',
    check: (s) => s.chapter >= 4,
  },
  {
    id: 'journeys_end',
    name: "Journey's End",
    description: 'Complete the full adventure.',
    icon: '\uD83C\uDFC1',
    rarity: 'rare',
    check: (s) => s.chapter >= 5,
  },
  // Endings
  {
    id: 'gold_rush_legend',
    name: 'Gold Rush Legend',
    description: 'Achieve the legendary ending.',
    icon: '\uD83D\uDC51',
    rarity: 'legendary',
    check: (s) => s.rpgEnding === 'legend',
  },
  {
    id: 'ghost_of_trail',
    name: 'Ghost of the Trail',
    description: 'Become a whispered story around the campfire.',
    icon: '\uD83D\uDC7B',
    rarity: 'epic',
    check: (s) => s.rpgEnding === 'ghost',
  },
  // Level progression
  {
    id: 'seasoned_prospector',
    name: 'Seasoned Prospector',
    description: 'Reach level 5 through experience.',
    icon: '\u26CF\uFE0F',
    rarity: 'uncommon',
    check: (s) => s.level >= 5,
  },
  {
    id: 'master_frontier',
    name: 'Master of the Frontier',
    description: 'Reach level 10 \u2014 a true frontier veteran.',
    icon: '\uD83C\uDF1F',
    rarity: 'rare',
    check: (s) => s.level >= 10,
  },
  // Karma alignment
  {
    id: 'karma_saint',
    name: 'Karma Saint',
    description: 'Walk the path of pure good (goodEvil \u2264 -66).',
    icon: '\uD83D\uDE07',
    rarity: 'rare',
    check: (s) => s.goodEvil <= -66,
  },
  {
    id: 'wanted_dead_alive',
    name: 'Wanted Dead or Alive',
    description: 'Embrace the dark side (goodEvil \u2265 66).',
    icon: '\uD83D\uDE08',
    rarity: 'rare',
    check: (s) => s.goodEvil >= 66,
  },
  {
    id: 'upstanding_citizen',
    name: 'Upstanding Citizen',
    description: 'A paragon of law and order (lawfulChaotic \u2264 -66).',
    icon: '\uD83D\uDCDC',
    rarity: 'uncommon',
    check: (s) => s.lawfulChaotic <= -66,
  },
  {
    id: 'wild_card',
    name: 'Wild Card',
    description: 'Rules are for other people (lawfulChaotic \u2265 66).',
    icon: '\uD83C\uDCCF',
    rarity: 'uncommon',
    check: (s) => s.lawfulChaotic >= 66,
  },
  // Faction reputation
  {
    id: 'pinkertons_finest',
    name: "Pinkerton's Finest",
    description: 'Earn the highest respect of the Pinkerton Agency.',
    icon: '\u2B50',
    rarity: 'rare',
    check: (s) => s.pinkertonRep >= 75,
  },
  {
    id: 'friend_of_tribes',
    name: 'Friend of the Tribes',
    description: 'Earn deep trust with the Native peoples.',
    icon: '\uD83E\uDEB6',
    rarity: 'rare',
    check: (s) => s.nativesRep >= 75,
  },
  {
    id: 'settlers_champion',
    name: "Settler's Champion",
    description: 'Become the hero of frontier settlers.',
    icon: '\uD83C\uDFE0',
    rarity: 'rare',
    check: (s) => s.settlersRep >= 75,
  },
  {
    id: 'king_of_outlaws',
    name: 'King of Outlaws',
    description: 'Rule the outlaw network with an iron fist.',
    icon: '\uD83D\uDCA3',
    rarity: 'epic',
    check: (s) => s.outlawsRep >= 75,
  },
  // Time echoes
  {
    id: 'time_traveler',
    name: 'Time Traveler',
    description: 'Discover 5 or more time echoes across the ages.',
    icon: '\u231B',
    rarity: 'epic',
    check: (s) => s.timeEchoes >= 5,
  },
  {
    id: 'echo_hunter',
    name: 'Echo Hunter',
    description: 'Uncover 3 time echoes linking past and present.',
    icon: '\uD83D\uDD0D',
    rarity: 'rare',
    check: (s) => s.timeEchoes >= 3,
  },
  // S.A.D.D.L.E. mastery
  {
    id: 'saddle_master',
    name: 'S.A.D.D.L.E. Master',
    description: 'Achieve 15+ in all six S.A.D.D.L.E. stats.',
    icon: '\uD83C\uDFC6',
    rarity: 'epic',
    check: (s) => {
      const stats = s.saddle
      return stats.Shrewdness >= 15 && stats.Agility >= 15 &&
        stats.Durability >= 15 && stats.Diplomacy >= 15 &&
        stats.Luck >= 15 && stats.Expertise >= 15
    },
  },
  // Bounty & detective
  {
    id: 'bounty_hunter',
    name: 'Bounty Hunter',
    description: 'Complete 3 bounties across the frontier.',
    icon: '\uD83D\uDCB0',
    rarity: 'uncommon',
    check: (s) => s.completedBounties >= 3,
  },
  {
    id: 'pure_detective',
    name: 'Pure Detective',
    description: 'Solve 3 cases without using a single hint.',
    icon: '\uD83D\uDD75\uFE0F',
    rarity: 'rare',
    check: (s) => s.casesWithoutHints >= 3,
  },
]

/**
 * Compute which trophies are earned given the current game state.
 */
export function computeTrophies(state: TrophyCheckState): { earned: TrophyDefinition[]; total: number } {
  const earned = TROPHY_DEFINITIONS.filter(t => t.check(state))
  return { earned, total: TROPHY_DEFINITIONS.length }
}

/**
 * Compute a composite score from game state.
 * Weights: XP (1x) + chapter bonus (200/ch) + trophy bonus (100/trophy) +
 *          reputation bonus (top faction * 2) + time echo bonus (150/echo) + level bonus (50/lvl)
 */
export function computeCompositeScore(state: TrophyCheckState): number {
  const { earned } = computeTrophies(state)

  const xpScore = state.xp
  const chapterBonus = state.chapter * 200
  const trophyBonus = earned.length * 100
  const levelBonus = state.level * 50
  const echoBonus = state.timeEchoes * 150

  const topFactionRep = Math.max(
    state.pinkertonRep, state.settlersRep, state.nativesRep, state.outlawsRep, 0
  )
  const repBonus = topFactionRep * 2

  return Math.round(xpScore + chapterBonus + trophyBonus + levelBonus + echoBonus + repBonus)
}
