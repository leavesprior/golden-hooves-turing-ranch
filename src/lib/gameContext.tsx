'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  Location,
  locations,
  getLocationsForDifficulty,
  calculateRewardTier,
  generateEarlyDiscountCode,
  EARLY_DISCOUNT_MARKER,
  EARLY_DISCOUNT_PERCENT,
  EARLY_DISCOUNT_VALID_DAYS,
} from './locations'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameState = 'menu' | 'playing' | 'complete'

interface GameSession {
  id: string
  difficulty: Difficulty
  startedAt: Date
  completedAt?: Date
  discoveredLocations: string[]
  hintsUsed: number
  score: number
  earlyDiscountCode?: string
  earlyDiscountIssuedAt?: Date
}

export interface EarlyReward {
  tier: 'early'
  discount: number
  code: string
  issuedAt: Date
  expiresAt: Date
}

interface GameContextType {
  // State
  gameState: GameState
  session: GameSession | null
  currentLocationIndex: number
  availableLocations: Location[]

  // Actions
  startGame: (difficulty: Difficulty, playerName?: string) => void
  discoverLocation: (slug: string) => { success: boolean; points: number; isComplete: boolean; earlyUnlocked: boolean }
  useHint: () => string | null
  resetGame: () => void
  getProgress: () => { found: number; total: number; percent: number }
  getReward: () => { tier: string; discount: number; code: string } | null
  getEarlyReward: () => EarlyReward | null

  // Player
  playerName: string
  setPlayerName: (name: string) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

const STORAGE_KEY = 'bobr_game_session'

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [session, setSession] = useState<GameSession | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [availableLocations, setAvailableLocations] = useState<Location[]>([])
  const [mounted, setMounted] = useState(false)

  // Load saved session on mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSession({
          ...parsed,
          startedAt: new Date(parsed.startedAt),
          completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
          earlyDiscountIssuedAt: parsed.earlyDiscountIssuedAt ? new Date(parsed.earlyDiscountIssuedAt) : undefined
        })
        setAvailableLocations(getLocationsForDifficulty(parsed.difficulty))
        setGameState(parsed.completedAt ? 'complete' : 'playing')
        setPlayerName(parsed.playerName || '')
      } catch (e) {
        console.error('Failed to load saved game:', e)
      }
    }
  }, [])

  // Save session on change
  useEffect(() => {
    if (mounted && session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...session,
        playerName
      }))
    }
  }, [session, playerName, mounted])

  const startGame = (difficulty: Difficulty, name?: string) => {
    const newSession: GameSession = {
      id: `game_${Date.now()}`,
      difficulty,
      startedAt: new Date(),
      discoveredLocations: [],
      hintsUsed: 0,
      score: 0
    }

    setSession(newSession)
    setAvailableLocations(getLocationsForDifficulty(difficulty))
    setGameState('playing')
    if (name) setPlayerName(name)
  }

  const discoverLocation = (slug: string): { success: boolean; points: number; isComplete: boolean; earlyUnlocked: boolean } => {
    if (!session) return { success: false, points: 0, isComplete: false, earlyUnlocked: false }

    // Check if already discovered
    if (session.discoveredLocations.includes(slug)) {
      return { success: false, points: 0, isComplete: false, earlyUnlocked: false }
    }

    // Find the location
    const location = availableLocations.find(loc => loc.slug === slug)
    if (!location) {
      return { success: false, points: 0, isComplete: false, earlyUnlocked: false }
    }

    // Calculate points with time bonus
    const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / 60000
    const timeBonus = Math.max(1, 10 - Math.floor(elapsedMinutes / 5))
    const points = location.points + (timeBonus * 10)

    // Update session
    const newDiscovered = [...session.discoveredLocations, slug]
    const isComplete = newDiscovered.length >= availableLocations.length

    // Early-bird discount fires the first time the player crosses the marker threshold.
    // Issued only once per session — preserved through completion so the rewards page can show both.
    const shouldIssueEarly =
      newDiscovered.length >= EARLY_DISCOUNT_MARKER && !session.earlyDiscountCode
    const earlyDiscountCode = shouldIssueEarly
      ? generateEarlyDiscountCode()
      : session.earlyDiscountCode
    const earlyDiscountIssuedAt = shouldIssueEarly
      ? new Date()
      : session.earlyDiscountIssuedAt

    setSession({
      ...session,
      discoveredLocations: newDiscovered,
      score: session.score + points,
      completedAt: isComplete ? new Date() : undefined,
      earlyDiscountCode,
      earlyDiscountIssuedAt,
    })

    if (isComplete) {
      setGameState('complete')
    }

    return { success: true, points, isComplete, earlyUnlocked: shouldIssueEarly }
  }

  const useHint = (): string | null => {
    if (!session) return null

    // Find next undiscovered location
    const nextLocation = availableLocations.find(
      loc => !session.discoveredLocations.includes(loc.slug)
    )

    if (!nextLocation) return null

    setSession({
      ...session,
      hintsUsed: session.hintsUsed + 1,
      score: Math.max(0, session.score - 10)
    })

    return nextLocation.hint
  }

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setGameState('menu')
    setAvailableLocations([])
  }

  const getProgress = () => {
    if (!session) return { found: 0, total: 0, percent: 0 }
    const found = session.discoveredLocations.length
    const total = availableLocations.length
    return { found, total, percent: total > 0 ? (found / total) * 100 : 0 }
  }

  const getReward = () => {
    if (!session || gameState !== 'complete') return null
    return calculateRewardTier(
      session.discoveredLocations.length,
      session.difficulty,
      session.hintsUsed
    )
  }

  const getEarlyReward = (): EarlyReward | null => {
    if (!session || !session.earlyDiscountCode || !session.earlyDiscountIssuedAt) return null
    const expiresAt = new Date(session.earlyDiscountIssuedAt)
    expiresAt.setDate(expiresAt.getDate() + EARLY_DISCOUNT_VALID_DAYS)
    return {
      tier: 'early',
      discount: EARLY_DISCOUNT_PERCENT,
      code: session.earlyDiscountCode,
      issuedAt: session.earlyDiscountIssuedAt,
      expiresAt,
    }
  }

  const currentLocationIndex = session ? session.discoveredLocations.length : 0

  if (!mounted) return null

  return (
    <GameContext.Provider
      value={{
        gameState,
        session,
        currentLocationIndex,
        availableLocations,
        startGame,
        discoverLocation,
        useHint,
        resetGame,
        getProgress,
        getReward,
        getEarlyReward,
        playerName,
        setPlayerName
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
