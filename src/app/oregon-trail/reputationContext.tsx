'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { CrossGameStorage } from '@/lib/crossGameProgression'

// Faction definitions
export type FactionId = 'pinkerton' | 'settlers' | 'natives' | 'outlaws'

export interface Faction {
  id: FactionId
  name: string
  description: string
  color: string  // Tailwind color class
  icon: string   // Emoji or icon
}

export const FACTIONS: Record<FactionId, Faction> = {
  pinkerton: {
    id: 'pinkerton',
    name: 'Pinkerton Agency',
    description: 'Your employer. Values proper procedure and successful captures.',
    color: 'blue',
    icon: '\u2605'  // star
  },
  settlers: {
    id: 'settlers',
    name: 'Frontier Settlers',
    description: 'The common folk. Appreciate help and honest dealings.',
    color: 'amber',
    icon: '\ud83c\udfe0'  // house
  },
  natives: {
    id: 'natives',
    name: 'Native Tribes',
    description: 'The original inhabitants. Value fair trade and respect.',
    color: 'emerald',
    icon: '\ud83e\udeb6'  // feather
  },
  outlaws: {
    id: 'outlaws',
    name: 'Outlaw Network',
    description: 'Criminals and their associates. Fear or respect based on your methods.',
    color: 'red',
    icon: '\ud83d\udca3'  // bomb
  }
}

// Reputation levels and their effects
export interface ReputationLevel {
  name: string
  minRep: number
  effects: string[]
}

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { name: 'Hated', minRep: -100, effects: ['Attacked on sight', 'No assistance', 'Double prices'] },
  { name: 'Vilified', minRep: -75, effects: ['Actively avoided', 'Refused service', '+50% prices'] },
  { name: 'Unpopular', minRep: -50, effects: ['Cold reception', 'Limited help', '+25% prices'] },
  { name: 'Mixed', minRep: -25, effects: ['Cautious interactions', 'Normal prices'] },
  { name: 'Neutral', minRep: 0, effects: ['Standard treatment', 'Normal prices'] },
  { name: 'Accepted', minRep: 25, effects: ['Friendly reception', '-10% prices'] },
  { name: 'Liked', minRep: 50, effects: ['Warm welcome', 'Occasional free help', '-20% prices'] },
  { name: 'Respected', minRep: 75, effects: ['Honored guest', 'Free information', '-30% prices'] },
  { name: 'Idolized', minRep: 100, effects: ['Legendary status', 'Free supplies', 'All doors open'] }
]

export interface ReputationState {
  reputations: Record<FactionId, number>
  reputationHistory: ReputationEvent[]
}

export interface ReputationEvent {
  timestamp: number
  faction: FactionId
  delta: number
  reason: string
  location?: string
}

interface ReputationContextValue {
  state: ReputationState

  // Core operations
  modifyReputation: (faction: FactionId, delta: number, reason: string, location?: string) => void
  getReputation: (faction: FactionId) => number
  getReputationLevel: (faction: FactionId) => ReputationLevel
  resetReputations: () => void

  // Effects
  getPriceModifier: (faction: FactionId) => number
  canAccessService: (faction: FactionId, serviceType: ServiceType) => boolean
  getInteractionBonus: (faction: FactionId) => number

  // Helpers
  getFaction: (id: FactionId) => Faction
  getAllFactions: () => Faction[]
  getRecentEvents: (count?: number) => ReputationEvent[]
}

export type ServiceType = 'shop' | 'information' | 'shelter' | 'medical' | 'telegraph' | 'horses'

const ReputationContext = createContext<ReputationContextValue | undefined>(undefined)

const REPUTATION_STORAGE_KEY = 'bobr_reputation_state'

const initialReputations: Record<FactionId, number> = {
  pinkerton: 25,   // Start with some agency trust
  settlers: 0,     // Neutral with common folk
  natives: 0,      // Neutral with tribes
  outlaws: -25     // Criminals are wary of you
}

const initialState: ReputationState = {
  reputations: { ...initialReputations },
  reputationHistory: []
}

function loadReputationFromStorage(): ReputationState | null {
  try {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem(REPUTATION_STORAGE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    return {
      ...parsed,
      reputationHistory: Array.isArray(parsed.reputationHistory) ? parsed.reputationHistory : []
    }
  } catch {
    return null
  }
}

export function ReputationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReputationState>(() => {
    const saved = loadReputationFromStorage()
    if (saved) return saved
    // Try cross-game store for persisted reputation
    const crossGame = CrossGameStorage.getReputation()
    if (crossGame) {
      return { reputations: crossGame.reputations, reputationHistory: [] }
    }
    return initialState
  })

  // Persist reputation to localStorage and cross-game store on state change
  useEffect(() => {
    try {
      localStorage.setItem(REPUTATION_STORAGE_KEY, JSON.stringify(state))
      CrossGameStorage.syncReputation(state.reputations)
    } catch {}
  }, [state])

  // Modify reputation with a faction
  const modifyReputation = useCallback((
    faction: FactionId,
    delta: number,
    reason: string,
    location?: string
  ) => {
    const event: ReputationEvent = {
      timestamp: Date.now(),
      faction,
      delta,
      reason,
      location
    }

    setState(prev => {
      const newRep = Math.max(-100, Math.min(100, prev.reputations[faction] + delta))

      return {
        ...prev,
        reputations: {
          ...prev.reputations,
          [faction]: newRep
        },
        reputationHistory: [...(prev.reputationHistory || []), event]
      }
    })

    // Cross-faction effects
    // High outlaws rep decreases pinkerton rep
    if (faction === 'outlaws' && delta > 0) {
      setState(prev => ({
        ...prev,
        reputations: {
          ...prev.reputations,
          pinkerton: Math.max(-100, prev.reputations.pinkerton - Math.floor(delta / 2))
        }
      }))
    }

    // Being too aggressive with settlers upsets natives
    if (faction === 'settlers' && delta < -10) {
      setState(prev => ({
        ...prev,
        reputations: {
          ...prev.reputations,
          natives: Math.max(-100, prev.reputations.natives - Math.floor(Math.abs(delta) / 3))
        }
      }))
    }
  }, [])

  // Get current reputation with a faction
  const getReputation = useCallback((faction: FactionId): number => {
    return state.reputations[faction]
  }, [state.reputations])

  // Get the reputation level (tier) for a faction
  const getReputationLevel = useCallback((faction: FactionId): ReputationLevel => {
    const rep = state.reputations[faction]

    // Find highest matching level
    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
      if (rep >= REPUTATION_LEVELS[i].minRep) {
        return REPUTATION_LEVELS[i]
      }
    }

    return REPUTATION_LEVELS[0]  // Fallback to Hated
  }, [state.reputations])

  // Reset all reputations
  const resetReputations = useCallback(() => {
    setState({
      reputations: { ...initialReputations },
      reputationHistory: []
    })
  }, [])

  // Get price modifier for trading with faction-associated NPCs
  const getPriceModifier = useCallback((faction: FactionId): number => {
    const rep = state.reputations[faction]

    if (rep >= 100) return 0.7   // -30%
    if (rep >= 75) return 0.7    // -30%
    if (rep >= 50) return 0.8    // -20%
    if (rep >= 25) return 0.9    // -10%
    if (rep >= 0) return 1.0     // Normal
    if (rep >= -25) return 1.0   // Normal
    if (rep >= -50) return 1.25  // +25%
    if (rep >= -75) return 1.5   // +50%
    return 2.0                   // +100%
  }, [state.reputations])

  // Check if a service is accessible based on reputation
  const canAccessService = useCallback((faction: FactionId, serviceType: ServiceType): boolean => {
    const rep = state.reputations[faction]

    switch (serviceType) {
      case 'shop':
        return rep > -75  // Can shop unless vilified
      case 'information':
        return rep > -50  // Need at least unpopular
      case 'shelter':
        return rep > -25  // Need at least mixed
      case 'medical':
        return rep > -50  // Most will heal even enemies
      case 'telegraph':
        return rep > -75 || faction !== 'pinkerton'  // Agency can cut you off
      case 'horses':
        return rep > -50  // Won't sell horses to enemies
      default:
        return true
    }
  }, [state.reputations])

  // Get bonus/penalty for skill checks involving this faction
  const getInteractionBonus = useCallback((faction: FactionId): number => {
    const rep = state.reputations[faction]

    if (rep >= 100) return 4
    if (rep >= 75) return 3
    if (rep >= 50) return 2
    if (rep >= 25) return 1
    if (rep >= 0) return 0
    if (rep >= -25) return 0
    if (rep >= -50) return -1
    if (rep >= -75) return -2
    return -4
  }, [state.reputations])

  // Get faction by ID
  const getFaction = useCallback((id: FactionId): Faction => {
    return FACTIONS[id]
  }, [])

  // Get all factions
  const getAllFactions = useCallback((): Faction[] => {
    return Object.values(FACTIONS)
  }, [])

  // Get recent reputation events
  const getRecentEvents = useCallback((count: number = 10): ReputationEvent[] => {
    return (state.reputationHistory || []).slice(-count)
  }, [state.reputationHistory])

  const value: ReputationContextValue = {
    state,
    modifyReputation,
    getReputation,
    getReputationLevel,
    resetReputations,
    getPriceModifier,
    canAccessService,
    getInteractionBonus,
    getFaction,
    getAllFactions,
    getRecentEvents
  }

  return (
    <ReputationContext.Provider value={value}>
      {children}
    </ReputationContext.Provider>
  )
}

export function useReputation() {
  const context = useContext(ReputationContext)
  if (!context) {
    throw new Error('useReputation must be used within a ReputationProvider')
  }
  return context
}

// Utility functions
export function getReputationColorClass(rep: number): string {
  if (rep >= 75) return 'text-emerald-400'
  if (rep >= 50) return 'text-green-400'
  if (rep >= 25) return 'text-lime-400'
  if (rep >= 0) return 'text-amber-400'
  if (rep >= -25) return 'text-orange-400'
  if (rep >= -50) return 'text-red-400'
  return 'text-red-600'
}

export function getReputationBarColor(rep: number): string {
  if (rep >= 75) return 'bg-emerald-500'
  if (rep >= 50) return 'bg-green-500'
  if (rep >= 25) return 'bg-lime-500'
  if (rep >= 0) return 'bg-amber-500'
  if (rep >= -25) return 'bg-orange-500'
  if (rep >= -50) return 'bg-red-500'
  return 'bg-red-700'
}

// Reputation-affecting actions and their standard deltas
export const REPUTATION_ACTIONS = {
  // Positive actions
  CAPTURE_OUTLAW: { pinkerton: 15, settlers: 10, outlaws: -20 },
  HELP_SETTLER: { settlers: 10, pinkerton: 2 },
  FAIR_TRADE: { natives: 5, settlers: 3 },
  SHARE_FOOD: { settlers: 8, natives: 5 },
  RETURN_STOLEN_GOODS: { settlers: 10, pinkerton: 5 },
  REPORT_CRIME: { pinkerton: 5, settlers: 3 },

  // Negative actions
  WRONG_ACCUSATION: { pinkerton: -15, settlers: -10 },
  STEAL_FROM_NPC: { settlers: -15, natives: -20, pinkerton: -10 },
  INTIMIDATE_WITNESS: { settlers: -8, pinkerton: -3 },
  UNFAIR_TRADE: { natives: -10, settlers: -5 },
  KILL_INNOCENT: { settlers: -30, pinkerton: -20, natives: -25 },
  BRIBE_OFFICIAL: { pinkerton: -10 },

  // Outlaw-specific
  JOIN_OUTLAW_SCHEME: { outlaws: 20, pinkerton: -25, settlers: -15 },
  BETRAY_OUTLAW: { outlaws: -30, pinkerton: 10 },
  SHOW_MERCY_TO_OUTLAW: { outlaws: 5, pinkerton: -5 }
} as const

export type ReputationAction = keyof typeof REPUTATION_ACTIONS
