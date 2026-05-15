'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  CrossGameStorage,
  CrossGameState,
  GameId,
  MilestoneId,
  TimeEchoId,
  CharacterQualities,
  GameUnlockConfig,
  SharedBounty,
  CROSS_GAME_STORAGE_KEY,
  DEFAULT_CROSS_GAME_STATE,
  GAME_UNLOCK_CONFIGS,
  isGameUnlocked,
  qualitiesFromSaddle,
  type FactionId,
  type ReputationSnapshot,
  type TimeEcho,
} from './crossGameProgression'
import { isTopDownBetaRoute } from './topDownBetaRoute'

// Re-export types for convenience
export {
  type CrossGameState,
  type GameId,
  type MilestoneId,
  type TimeEchoId,
  type CharacterQualities,
  type GameUnlockConfig,
  type SharedBounty,
  type FactionId,
  type ReputationSnapshot,
  type TimeEcho,
  isGameUnlocked,
  qualitiesFromSaddle,
  GAME_UNLOCK_CONFIGS,
}

// Toast for game unlocks
export interface UnlockToast {
  id: string
  gameId: GameId
  gameName: string
  message: string
  timestamp: number
}

interface CrossGameContextValue {
  // State
  state: CrossGameState
  isInitialized: boolean
  unlockToasts: UnlockToast[]

  // Unlock checks
  isUnlocked: (gameId: GameId) => boolean
  getUnlockConfig: (gameId: GameId) => GameUnlockConfig | undefined

  // Milestones
  recordMilestone: (milestoneId: MilestoneId, source: GameId, metadata?: Record<string, unknown>) => void
  hasMilestone: (milestoneId: MilestoneId) => boolean

  // Character bridge
  updateQualities: (qualities: CharacterQualities) => void
  updateQualitiesFromSaddle: (stats: {
    Shrewdness: number; Agility: number; Durability: number
    Diplomacy: number; Luck: number; Expertise: number
  }) => void

  // Time echoes
  discoverTimeEcho: (echoId: TimeEchoId) => void
  getTimeEchoesForGame: (gameId: GameId) => TimeEcho[]
  isEchoDiscovered: (echoId: TimeEchoId) => boolean

  // Reputation sync
  syncReputation: (reputations: Record<FactionId, number>) => void
  getPersistedReputation: () => ReputationSnapshot | null

  // Bounties
  addBounty: (bounty: Omit<SharedBounty, 'issuedTimestamp' | 'status'>) => void
  completeBounty: (bountyId: string, completedInGame: GameId) => void
  getActiveBounties: () => SharedBounty[]

  // Toast management
  dismissUnlockToast: (id: string) => void

  // Reset
  resetProgression: () => void
}

const CrossGameContext = createContext<CrossGameContextValue | null>(null)

export function useCrossGame(): CrossGameContextValue {
  const context = useContext(CrossGameContext)
  if (!context) {
    throw new Error('useCrossGame must be used within a CrossGameProgressionProvider')
  }
  return context
}

interface CrossGameProgressionProviderProps {
  children: ReactNode
}

export function CrossGameProgressionProvider({ children }: CrossGameProgressionProviderProps) {
  const [state, setState] = useState<CrossGameState>(DEFAULT_CROSS_GAME_STATE)
  const [unlockToasts, setUnlockToasts] = useState<UnlockToast[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const loaded = isTopDownBetaRoute()
      ? CrossGameStorage.load() ?? { ...DEFAULT_CROSS_GAME_STATE }
      : CrossGameStorage.init()
    setState(loaded)
    setIsInitialized(true)
  }, [])

  // Cross-tab sync via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CROSS_GAME_STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue) as CrossGameState
          setState(newState)
        } catch (err) {
          console.error('Failed to parse cross-game sync:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Auto-dismiss unlock toasts after 6 seconds
  useEffect(() => {
    if (unlockToasts.length === 0) return

    const timer = setTimeout(() => {
      setUnlockToasts(prev => prev.slice(1))
    }, 6000)

    return () => clearTimeout(timer)
  }, [unlockToasts])

  // Create unlock toast
  const createUnlockToast = useCallback((config: GameUnlockConfig) => {
    const toast: UnlockToast = {
      id: `unlock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      gameId: config.gameId,
      gameName: config.name,
      message: config.unlockMessage,
      timestamp: Date.now(),
    }
    setUnlockToasts(prev => [...prev, toast])
  }, [])

  // Check if a game is unlocked
  const isUnlocked = useCallback((gameId: GameId): boolean => {
    return isGameUnlocked(gameId, state.milestones)
  }, [state.milestones])

  // Get unlock config for a game
  const getUnlockConfig = useCallback((gameId: GameId): GameUnlockConfig | undefined => {
    return GAME_UNLOCK_CONFIGS.find(c => c.gameId === gameId)
  }, [])

  // Record a milestone (with unlock detection)
  const recordMilestone = useCallback((
    milestoneId: MilestoneId,
    source: GameId,
    metadata?: Record<string, unknown>
  ) => {
    const previousMilestones = [...state.milestones]
    const newState = CrossGameStorage.recordMilestone(milestoneId, source, metadata)
    setState(newState)

    // Check for newly unlocked games
    const newlyUnlocked = CrossGameStorage.getNewlyUnlockedGames(
      previousMilestones,
      newState.milestones
    )
    newlyUnlocked.forEach(config => {
      if (config.unlockMessage) {
        createUnlockToast(config)
      }
    })
  }, [state.milestones, createUnlockToast])

  // Check if a milestone has been reached
  const hasMilestone = useCallback((milestoneId: MilestoneId): boolean => {
    return state.milestones.some(m => m.id === milestoneId)
  }, [state.milestones])

  // Update character qualities
  const updateQualities = useCallback((qualities: CharacterQualities) => {
    const newState = CrossGameStorage.updateQualities(qualities)
    setState(newState)
  }, [])

  // Update qualities from S.A.D.D.L.E. stats
  const updateQualitiesFromSaddle = useCallback((stats: {
    Shrewdness: number; Agility: number; Durability: number
    Diplomacy: number; Luck: number; Expertise: number
  }) => {
    const qualities = qualitiesFromSaddle(stats)
    const newState = CrossGameStorage.updateQualities(qualities)
    setState(newState)
  }, [])

  // Discover a time echo
  const discoverTimeEcho = useCallback((echoId: TimeEchoId) => {
    const newState = CrossGameStorage.discoverTimeEcho(echoId)
    setState(newState)
  }, [])

  // Get time echoes for a game
  const getTimeEchoesForGame = useCallback((gameId: GameId): TimeEcho[] => {
    return CrossGameStorage.getTimeEchoesForGame(gameId)
  }, [])

  // Check if echo discovered
  const isEchoDiscovered = useCallback((echoId: TimeEchoId): boolean => {
    return state.timeEchoes[echoId] || false
  }, [state.timeEchoes])

  // Sync reputation
  const syncReputation = useCallback((reputations: Record<FactionId, number>) => {
    const newState = CrossGameStorage.syncReputation(reputations)
    setState(newState)
  }, [])

  // Get persisted reputation
  const getPersistedReputation = useCallback((): ReputationSnapshot | null => {
    return state.reputation
  }, [state.reputation])

  // Add bounty
  const addBounty = useCallback((bounty: Omit<SharedBounty, 'issuedTimestamp' | 'status'>) => {
    const newState = CrossGameStorage.addBounty(bounty)
    setState(newState)
  }, [])

  // Complete bounty
  const completeBounty = useCallback((bountyId: string, completedInGame: GameId) => {
    const newState = CrossGameStorage.completeBounty(bountyId, completedInGame)
    setState(newState)
  }, [])

  // Get active bounties
  const getActiveBounties = useCallback((): SharedBounty[] => {
    return state.bounties.filter(b => b.status === 'active')
  }, [state.bounties])

  // Dismiss an unlock toast
  const dismissUnlockToast = useCallback((id: string) => {
    setUnlockToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Reset progression
  const resetProgression = useCallback(() => {
    const newState = CrossGameStorage.reset()
    setState(newState)
  }, [])

  const value: CrossGameContextValue = {
    state,
    isInitialized,
    unlockToasts,
    isUnlocked,
    getUnlockConfig,
    recordMilestone,
    hasMilestone,
    updateQualities,
    updateQualitiesFromSaddle,
    discoverTimeEcho,
    getTimeEchoesForGame,
    isEchoDiscovered,
    syncReputation,
    getPersistedReputation,
    addBounty,
    completeBounty,
    getActiveBounties,
    dismissUnlockToast,
    resetProgression,
  }

  // Don't render until initialized (prevents hydration mismatch)
  if (!isInitialized) {
    return null
  }

  return (
    <CrossGameContext.Provider value={value}>
      {children}
    </CrossGameContext.Provider>
  )
}

export default CrossGameProgressionProvider
