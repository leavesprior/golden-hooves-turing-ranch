/**
 * Cross-Game Progression Dashboard
 *
 * Aggregates state from all 3 games into a unified view.
 * Used by the /hub page and cross-game notification system.
 *
 * Data flows:
 *   Oregon Trail → CrossGameStorage.syncKarmaToPool()
 *   Adventure    → CrossGameStorage.recordMilestone()
 *   Explorer     → CrossGameStorage.addHistoricalDepth()
 *   All games    → CrossGameStorage.visitSpiritualSite()
 */

import { CrossGameStorage, type CrossGameState, type SharedKarmaPool, type SpiritualAwareness, type SpiritualBuff } from './crossGameProgression'

// ============================================================================
// TYPES
// ============================================================================

export interface GameSummary {
  gameId: string
  gameName: string
  emoji: string
  isStarted: boolean
  karma: { good: number; neutral: number; bad: number }
  milestones: string[]
  lastPlayed?: string
}

export interface DashboardState {
  games: GameSummary[]
  sharedKarma: SharedKarmaPool
  spiritualAwareness: SpiritualAwareness
  historicalDepth: number
  totalMilestones: number
  recentTransfers: Array<{ game: string; type: string; amount: number; reason: string; timestamp: string }>
  crossGameBuffs: SpiritualBuff[]
}

export interface AchievementSummary {
  id: string
  title: string
  description: string
  earned: boolean
  game: string
  emoji: string
}

// ============================================================================
// CROSS-GAME ACHIEVEMENTS
// ============================================================================

export const CROSS_GAME_ACHIEVEMENTS: AchievementSummary[] = [
  {
    id: 'first_karma_sync',
    title: 'Connected Worlds',
    description: 'Earned karma that synced across games for the first time',
    earned: false,
    game: 'any',
    emoji: '🔗',
  },
  {
    id: 'all_games_started',
    title: 'Triple Threat',
    description: 'Started all three Gold Country games',
    earned: false,
    game: 'all',
    emoji: '🎮',
  },
  {
    id: 'spiritual_level_1',
    title: 'Awakened',
    description: 'Visited your first spiritual site and began the path of awareness',
    earned: false,
    game: 'explorer',
    emoji: '🌿',
  },
  {
    id: 'spiritual_level_3',
    title: 'Deep Listener',
    description: 'Achieved maximum spiritual awareness by visiting sacred sites',
    earned: false,
    game: 'explorer',
    emoji: '🪶',
  },
  {
    id: 'historian_50',
    title: 'Living History',
    description: 'Accumulated 50+ historical depth points across your explorations',
    earned: false,
    game: 'explorer',
    emoji: '📜',
  },
  {
    id: 'karma_pool_100',
    title: 'Generous Spirit',
    description: 'Total good karma earned across all games exceeds 100',
    earned: false,
    game: 'all',
    emoji: '🍪',
  },
  {
    id: 'twain_encountered',
    title: 'Literary Meeting',
    description: 'Met Mark Twain in any game',
    earned: false,
    game: 'any',
    emoji: '📝',
  },
  {
    id: 'black_bart_captured',
    title: 'Justice Served',
    description: 'Captured Black Bart through investigation',
    earned: false,
    game: 'trail',
    emoji: '🎩',
  },
  {
    id: 'ranch_mastery_max',
    title: 'Ranch Legend',
    description: 'Achieved the highest ranch mastery tier',
    earned: false,
    game: 'trail',
    emoji: '🐎',
  },
  {
    id: 'all_mysteries_solved',
    title: 'Master Detective',
    description: 'Solved every mystery across all games',
    earned: false,
    game: 'all',
    emoji: '🔍',
  },
]

// ============================================================================
// DASHBOARD BUILDER
// ============================================================================

/**
 * Build the complete dashboard state from CrossGameStorage.
 */
export function buildDashboardState(): DashboardState {
  const state = CrossGameStorage.load()

  if (!state) {
    return {
      games: getDefaultGameSummaries(),
      sharedKarma: { good: 0, neutral: 0, bad: 0, totalEarned: 0, lastSource: null, lastSyncTimestamp: '' },
      spiritualAwareness: { sitesVisited: [], level: 0, buffs: [] },
      historicalDepth: 0,
      totalMilestones: 0,
      recentTransfers: [],
      crossGameBuffs: [],
    }
  }

  const games: GameSummary[] = [
    buildGameSummary('prospectors_tale', "A Prospector's Tale", '🤠', state),
    buildGameSummary('gold_country_adventure', 'Gold Country Adventure', '⚔️', state),
    buildGameSummary('gold_country_explorer', 'Gold Country Explorer', '🗺️', state),
  ]

  const recentTransfers = (state.karmaTransfers || [])
    .slice(-10)
    .reverse()
    .map(t => ({
      game: t.fromGame,
      type: t.karmaType,
      amount: t.amount,
      reason: t.reason,
      timestamp: t.timestamp,
    }))

  const spiritualAwareness = state.spiritualAwareness || { sitesVisited: [], level: 0, buffs: [] }

  return {
    games,
    sharedKarma: state.karmaPool || { good: 0, neutral: 0, bad: 0, totalEarned: 0 },
    spiritualAwareness,
    historicalDepth: state.historicalDepth || 0,
    totalMilestones: state.milestones?.length || 0,
    recentTransfers,
    crossGameBuffs: spiritualAwareness.buffs || [],
  }
}

function buildGameSummary(gameId: string, gameName: string, emoji: string, state: CrossGameState): GameSummary {
  const gameMilestones = (state.milestones || [])
    .filter(m => m.source === gameId)
    .map(m => m.id)

  const gameTransfers = (state.karmaTransfers || [])
    .filter(t => t.fromGame === gameId)

  const karma = {
    good: gameTransfers.filter(t => t.karmaType === 'good').reduce((sum, t) => sum + t.amount, 0),
    neutral: gameTransfers.filter(t => t.karmaType === 'neutral').reduce((sum, t) => sum + t.amount, 0),
    bad: gameTransfers.filter(t => t.karmaType === 'bad').reduce((sum, t) => sum + t.amount, 0),
  }

  const lastTransfer = gameTransfers.length > 0
    ? gameTransfers.reduce((latest, t) => t.timestamp > latest ? t.timestamp : latest, gameTransfers[0].timestamp)
    : undefined

  return {
    gameId,
    gameName,
    emoji,
    isStarted: gameMilestones.length > 0 || gameTransfers.length > 0,
    karma,
    milestones: gameMilestones,
    lastPlayed: lastTransfer,
  }
}

function getDefaultGameSummaries(): GameSummary[] {
  return [
    { gameId: 'prospectors_tale', gameName: "A Prospector's Tale", emoji: '🤠', isStarted: false, karma: { good: 0, neutral: 0, bad: 0 }, milestones: [] },
    { gameId: 'gold_country_adventure', gameName: 'Gold Country Adventure', emoji: '⚔️', isStarted: false, karma: { good: 0, neutral: 0, bad: 0 }, milestones: [] },
    { gameId: 'gold_country_explorer', gameName: 'Gold Country Explorer', emoji: '🗺️', isStarted: false, karma: { good: 0, neutral: 0, bad: 0 }, milestones: [] },
  ]
}

/**
 * Check which cross-game achievements have been earned.
 */
export function checkCrossGameAchievements(state: DashboardState): AchievementSummary[] {
  return CROSS_GAME_ACHIEVEMENTS.map(achievement => {
    let earned = false

    switch (achievement.id) {
      case 'first_karma_sync':
        earned = state.recentTransfers.length > 0
        break
      case 'all_games_started':
        earned = state.games.every(g => g.isStarted)
        break
      case 'spiritual_level_1':
        earned = state.spiritualAwareness.level >= 1
        break
      case 'spiritual_level_3':
        earned = state.spiritualAwareness.level >= 3
        break
      case 'historian_50':
        earned = state.historicalDepth >= 50
        break
      case 'karma_pool_100':
        earned = state.sharedKarma.good >= 100
        break
      case 'twain_encountered':
        earned = state.games.some(g => g.milestones.includes('twain_encountered'))
        break
      case 'black_bart_captured':
        earned = state.games.some(g => g.milestones.includes('black_bart_captured'))
        break
      case 'ranch_mastery_max':
        earned = state.games.some(g => g.milestones.includes('ranch_mastery_max'))
        break
      case 'all_mysteries_solved':
        earned = state.games.some(g => g.milestones.includes('all_mysteries_solved'))
        break
    }

    return { ...achievement, earned }
  })
}

/**
 * Get a formatted text summary of cross-game progress.
 * Useful for the narrator's cross-game awareness.
 */
export function getCrossGameNarratorSummary(state: DashboardState): string {
  const gamesStarted = state.games.filter(g => g.isStarted).length
  if (gamesStarted === 0) return ''

  const parts: string[] = []

  if (gamesStarted >= 2) {
    parts.push(`a traveler who has explored ${gamesStarted} corners of Gold Country`)
  }

  if (state.sharedKarma.good >= 50) {
    parts.push('known for their generosity')
  } else if (state.sharedKarma.bad >= 30) {
    parts.push('with a reputation that precedes them')
  }

  if (state.spiritualAwareness.level >= 2) {
    parts.push('who walks with spiritual awareness')
  }

  if (state.historicalDepth >= 25) {
    parts.push('a student of history')
  }

  if (parts.length === 0) return ''
  return `The narrator recognizes you as ${parts.join(', ')}.`
}
