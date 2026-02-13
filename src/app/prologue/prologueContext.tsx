'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import type { TimeEchoId } from '@/lib/crossGameProgression'

// ============================================
// TYPES
// ============================================

export type PrologueCharacterId = 'norseman' | 'native' | 'califia' | 'incan'

export type ActId = 'act_i' | 'act_ii' | 'act_iii' | 'act_iv' | 'convergence'

export type EpisodeStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export interface EpisodeProgress {
  episodeId: string
  status: EpisodeStatus
  cluesFound: string[]
  puzzlesSolved: string[]
  artifactsIdentified: string[]
  timeEchoesPlanted: TimeEchoId[]
  actionsUsedToday: number
  dayNumber: number
}

export interface ActProgress {
  actId: ActId
  characterId: PrologueCharacterId
  episodes: EpisodeProgress[]
  completed: boolean
  convergenceUnlocked: boolean
}

export type DetectiveRank =
  | 'novice_traveler'
  | 'apprentice_explorer'
  | 'journeyman_investigator'
  | 'expert_archaeologist'
  | 'master_of_worlds'

export interface PrologueState {
  selectedCharacter: PrologueCharacterId | null
  actProgress: Record<PrologueCharacterId, ActProgress>
  convergenceProgress: ActProgress | null
  detectiveRank: DetectiveRank
  totalCluesFound: number
  totalPuzzlesSolved: number
  totalArtifactsIdentified: number
  currentAct: ActId | null
  currentEpisode: string | null
}

// ============================================
// DEFAULTS
// ============================================

const STORAGE_KEY = 'bobr_prologue_state'

const DETECTIVE_RANK_THRESHOLDS: { rank: DetectiveRank; minClues: number }[] = [
  { rank: 'novice_traveler', minClues: 0 },
  { rank: 'apprentice_explorer', minClues: 10 },
  { rank: 'journeyman_investigator', minClues: 30 },
  { rank: 'expert_archaeologist', minClues: 60 },
  { rank: 'master_of_worlds', minClues: 100 },
]

function createDefaultEpisodes(actId: ActId): EpisodeProgress[] {
  return [1, 2, 3].map((num, i) => ({
    episodeId: `${actId}_ep_${num}`,
    status: i === 0 ? 'available' : 'locked',
    cluesFound: [],
    puzzlesSolved: [],
    artifactsIdentified: [],
    timeEchoesPlanted: [],
    actionsUsedToday: 0,
    dayNumber: 1,
  }))
}

const createDefaultActProgress = (actId: ActId, characterId: PrologueCharacterId): ActProgress => ({
  actId,
  characterId,
  episodes: createDefaultEpisodes(actId),
  completed: false,
  convergenceUnlocked: false,
})

const DEFAULT_STATE: PrologueState = {
  selectedCharacter: null,
  actProgress: {
    norseman: createDefaultActProgress('act_i', 'norseman'),
    native: createDefaultActProgress('act_ii', 'native'),
    califia: createDefaultActProgress('act_iii', 'califia'),
    incan: createDefaultActProgress('act_iv', 'incan'),
  },
  convergenceProgress: null,
  detectiveRank: 'novice_traveler',
  totalCluesFound: 0,
  totalPuzzlesSolved: 0,
  totalArtifactsIdentified: 0,
  currentAct: null,
  currentEpisode: null,
}

// ============================================
// CONTEXT
// ============================================

interface PrologueContextValue {
  state: PrologueState
  isInitialized: boolean

  // Character selection
  selectCharacter: (id: PrologueCharacterId) => void
  isCharacterUnlocked: (id: PrologueCharacterId) => boolean

  // Progress
  startEpisode: (actId: ActId, episodeId: string) => void
  completeEpisode: (actId: ActId, episodeId: string) => void
  recordClue: (clueId: string) => void
  recordPuzzleSolved: (puzzleId: string) => void
  recordArtifactIdentified: (artifactId: string) => void
  plantTimeEcho: (echoId: TimeEchoId) => void
  useAction: () => boolean  // returns false if no actions left today

  // Queries
  getDetectiveRank: () => DetectiveRank
  canAccessConvergence: () => boolean
  getCompletedActCount: () => number

  // Persistence
  resetPrologue: () => void
}

const PrologueContext = createContext<PrologueContextValue | null>(null)

export function usePrologue(): PrologueContextValue {
  const context = useContext(PrologueContext)
  if (!context) {
    throw new Error('usePrologue must be used within PrologueProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

export function PrologueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PrologueState>(DEFAULT_STATE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch {}
    setIsInitialized(true)
  }, [])

  // Auto-save on state change
  useEffect(() => {
    if (!isInitialized) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state, isInitialized])

  const selectCharacter = useCallback((id: PrologueCharacterId) => {
    setState(prev => ({ ...prev, selectedCharacter: id }))
  }, [])

  const isCharacterUnlocked = useCallback((id: PrologueCharacterId): boolean => {
    // Norseman is always first available
    if (id === 'norseman') return true
    // Others unlock as you progress
    const completedActs = Object.values(state.actProgress).filter(a => a.completed).length
    if (id === 'native') return completedActs >= 1 || state.actProgress.norseman.episodes.some(e => e.status === 'completed')
    if (id === 'califia') return completedActs >= 1
    if (id === 'incan') return completedActs >= 1
    return false
  }, [state.actProgress])

  const startEpisode = useCallback((actId: ActId, episodeId: string) => {
    setState(prev => {
      const characterId = actToCharacter(actId)
      if (!characterId) return prev
      const act = prev.actProgress[characterId]
      const updatedEpisodes = act.episodes.map(ep =>
        ep.episodeId === episodeId ? { ...ep, status: 'in_progress' as EpisodeStatus } : ep
      )
      return {
        ...prev,
        currentAct: actId,
        currentEpisode: episodeId,
        actProgress: {
          ...prev.actProgress,
          [characterId]: { ...act, episodes: updatedEpisodes },
        },
      }
    })
  }, [])

  const completeEpisode = useCallback((actId: ActId, episodeId: string) => {
    setState(prev => {
      const characterId = actToCharacter(actId)
      if (!characterId) return prev
      const act = prev.actProgress[characterId]
      const episodeIndex = act.episodes.findIndex(e => e.episodeId === episodeId)
      const updatedEpisodes = act.episodes.map((ep, i) => {
        if (ep.episodeId === episodeId) return { ...ep, status: 'completed' as EpisodeStatus }
        if (i === episodeIndex + 1 && ep.status === 'locked') return { ...ep, status: 'available' as EpisodeStatus }
        return ep
      })
      const actCompleted = updatedEpisodes.every(e => e.status === 'completed')

      // Record milestone if act completed
      if (actCompleted) {
        const milestoneMap = {
          norseman: 'prologue_norseman_complete' as const,
          native: 'prologue_native_complete' as const,
          califia: 'prologue_califia_complete' as const,
          incan: 'prologue_incan_complete' as const,
        }
        CrossGameStorage.recordMilestone(milestoneMap[characterId], 'prologue')
      }

      return {
        ...prev,
        actProgress: {
          ...prev.actProgress,
          [characterId]: { ...act, episodes: updatedEpisodes, completed: actCompleted },
        },
      }
    })
  }, [])

  const recordClue = useCallback((clueId: string) => {
    setState(prev => {
      if (!prev.currentAct || !prev.currentEpisode) return prev
      const characterId = actToCharacter(prev.currentAct)
      if (!characterId) return prev
      const act = prev.actProgress[characterId]
      const updatedEpisodes = act.episodes.map(ep => {
        if (ep.episodeId !== prev.currentEpisode) return ep
        if (ep.cluesFound.includes(clueId)) return ep
        return { ...ep, cluesFound: [...ep.cluesFound, clueId] }
      })
      return {
        ...prev,
        totalCluesFound: prev.totalCluesFound + 1,
        detectiveRank: computeRank(prev.totalCluesFound + 1),
        actProgress: {
          ...prev.actProgress,
          [characterId]: { ...act, episodes: updatedEpisodes },
        },
      }
    })
  }, [])

  const recordPuzzleSolved = useCallback((puzzleId: string) => {
    setState(prev => ({
      ...prev,
      totalPuzzlesSolved: prev.totalPuzzlesSolved + 1,
    }))
  }, [])

  const recordArtifactIdentified = useCallback((artifactId: string) => {
    setState(prev => ({
      ...prev,
      totalArtifactsIdentified: prev.totalArtifactsIdentified + 1,
    }))
  }, [])

  const plantTimeEcho = useCallback((echoId: TimeEchoId) => {
    CrossGameStorage.discoverTimeEcho(echoId)
  }, [])

  const useAction = useCallback((): boolean => {
    // 10 actions per day
    const MAX_ACTIONS = 10
    let success = false
    setState(prev => {
      if (!prev.currentAct || !prev.currentEpisode) return prev
      const characterId = actToCharacter(prev.currentAct)
      if (!characterId) return prev
      const act = prev.actProgress[characterId]
      const updatedEpisodes = act.episodes.map(ep => {
        if (ep.episodeId !== prev.currentEpisode) return ep
        if (ep.actionsUsedToday >= MAX_ACTIONS) return ep
        success = true
        return { ...ep, actionsUsedToday: ep.actionsUsedToday + 1 }
      })
      return {
        ...prev,
        actProgress: {
          ...prev.actProgress,
          [characterId]: { ...act, episodes: updatedEpisodes },
        },
      }
    })
    return success
  }, [])

  const getDetectiveRank = useCallback((): DetectiveRank => {
    return state.detectiveRank
  }, [state.detectiveRank])

  const canAccessConvergence = useCallback((): boolean => {
    const completedActs = Object.values(state.actProgress).filter(a => a.completed).length
    return completedActs >= 2
  }, [state.actProgress])

  const getCompletedActCount = useCallback((): number => {
    return Object.values(state.actProgress).filter(a => a.completed).length
  }, [state.actProgress])

  const resetPrologue = useCallback(() => {
    setState(DEFAULT_STATE)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  const value: PrologueContextValue = {
    state,
    isInitialized,
    selectCharacter,
    isCharacterUnlocked,
    startEpisode,
    completeEpisode,
    recordClue,
    recordPuzzleSolved,
    recordArtifactIdentified,
    plantTimeEcho,
    useAction,
    getDetectiveRank,
    canAccessConvergence,
    getCompletedActCount,
    resetPrologue,
  }

  if (!isInitialized) return null

  return (
    <PrologueContext.Provider value={value}>
      {children}
    </PrologueContext.Provider>
  )
}

// ============================================
// HELPERS
// ============================================

function actToCharacter(actId: ActId): PrologueCharacterId | null {
  switch (actId) {
    case 'act_i': return 'norseman'
    case 'act_ii': return 'native'
    case 'act_iii': return 'califia'
    case 'act_iv': return 'incan'
    default: return null
  }
}

function computeRank(totalClues: number): DetectiveRank {
  let rank: DetectiveRank = 'novice_traveler'
  for (const threshold of DETECTIVE_RANK_THRESHOLDS) {
    if (totalClues >= threshold.minClues) rank = threshold.rank
  }
  return rank
}

export default PrologueProvider
