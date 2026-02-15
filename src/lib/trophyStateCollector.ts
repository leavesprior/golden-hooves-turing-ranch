/**
 * Trophy State Collector
 *
 * Reads from 5 localStorage keys and assembles TrophyCheckState
 * for the trophy engine to evaluate.
 */

import type { TrophyCheckState } from './trophyDefinitions'

const ADVENTURE_KEY = 'bobr_adventure_state'
const CROSS_GAME_KEY = 'bobr_cross_game_progression'
const KARMA_KEY = 'bobr_unified_karma'
const KARMA_WALLET_KEY = 'oregon_trail_karma_wallet'
const REPUTATION_KEY = 'bobr_reputation_state'

function safeJsonParse<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Collect trophy-check state from all localStorage sources.
 * Returns null if no game data exists at all (player hasn't started).
 */
export function collectTrophyState(): TrophyCheckState | null {
  // Adventure state
  const adventure = safeJsonParse<{
    chapter?: number
    level?: number
    xp?: number
    discoveredLocations?: string[]
    confrontationsWon?: number
    playerName?: string
    gameFlags?: Record<string, boolean>
  }>(ADVENTURE_KEY)

  // Cross-game progression
  const crossGame = safeJsonParse<{
    milestones?: Array<{ id: string }>
    timeEchoes?: Record<string, boolean>
    bounties?: Array<{ status: string }>
    characterQualities?: Record<string, number>
  }>(CROSS_GAME_KEY)

  // Unified karma
  const karma = safeJsonParse<{
    alignment?: { lawfulChaotic: number; goodEvil: number }
    casesCompletedWithoutHints?: number
  }>(KARMA_KEY)

  // Oregon Trail karma wallet (has good/neutral/bad balances)
  const karmaWallet = safeJsonParse<{
    balance?: { good: number; neutral: number; bad: number }
    alignment?: { lawfulChaotic: number; goodEvil: number }
  }>(KARMA_WALLET_KEY)

  // Reputation state
  const reputation = safeJsonParse<{
    reputations?: Record<string, number>
  }>(REPUTATION_KEY)

  // If no adventure data at all, player hasn't started
  if (!adventure && !crossGame) return null

  const chapter = adventure?.chapter ?? 0
  const level = adventure?.level ?? 1
  const xp = adventure?.xp ?? 0

  // Determine RPG ending from game flags or cross-game milestones
  let rpgEnding: string | null = null
  if (adventure?.gameFlags?.['ending_legend']) rpgEnding = 'legend'
  else if (adventure?.gameFlags?.['ending_ghost']) rpgEnding = 'ghost'
  else if (adventure?.gameFlags?.['ending_prospector']) rpgEnding = 'prospector'

  // Count time echoes discovered
  const timeEchoes = crossGame?.timeEchoes
    ? Object.values(crossGame.timeEchoes).filter(Boolean).length
    : 0

  // Count milestones
  const milestonesCount = crossGame?.milestones?.length ?? 0

  // Count completed bounties
  const completedBounties = crossGame?.bounties
    ? crossGame.bounties.filter(b => b.status === 'completed').length
    : 0

  // Karma alignment (prefer unified karma, fall back to wallet)
  const lawfulChaotic = karma?.alignment?.lawfulChaotic ?? karmaWallet?.alignment?.lawfulChaotic ?? 0
  const goodEvil = karma?.alignment?.goodEvil ?? karmaWallet?.alignment?.goodEvil ?? 0

  // Cases without hints
  const casesWithoutHints = karma?.casesCompletedWithoutHints ?? 0

  // Faction reputation
  const reps = reputation?.reputations ?? {}
  const pinkertonRep = reps.pinkerton ?? 0
  const settlersRep = reps.settlers ?? 0
  const nativesRep = reps.natives ?? 0
  const outlawsRep = reps.outlaws ?? 0

  // S.A.D.D.L.E. stats - derive from character qualities if available
  // The adventure play page stores SADDLE in rpgContext (not directly in localStorage),
  // but crossGameProgression stores characterQualities (0-100 scale)
  const qualities = crossGame?.characterQualities ?? {}
  const toSaddle = (val: number | undefined) => Math.round(((val ?? 50) / 100) * 20)
  const saddle = {
    Shrewdness: toSaddle(qualities.investigation),
    Agility: toSaddle(qualities.combat),
    Durability: toSaddle(qualities.resilience),
    Diplomacy: toSaddle(qualities.social),
    Luck: toSaddle(qualities.fortune),
    Expertise: toSaddle(qualities.survival),
  }

  return {
    chapter,
    level,
    xp,
    locationsDiscovered: adventure?.discoveredLocations?.length ?? 0,
    confrontationsWon: adventure?.confrontationsWon ?? 0,
    rpgEnding,
    lawfulChaotic,
    goodEvil,
    pinkertonRep,
    settlersRep,
    nativesRep,
    outlawsRep,
    timeEchoes,
    milestonesCount,
    completedBounties,
    casesWithoutHints,
    saddle,
  }
}

/**
 * Get the player's display name and a stable ID for Notion dedup.
 */
export function getPlayerIdentifier(): { name: string; id: string } {
  const adventure = safeJsonParse<{ playerName?: string }>(ADVENTURE_KEY)
  const name = adventure?.playerName || 'Anonymous Prospector'

  // Generate a stable ID from the player name + a fingerprint from game state
  let id = localStorage.getItem('bobr_player_id')
  if (!id) {
    id = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('bobr_player_id', id)
  }

  return { name, id }
}
