'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  KarmaStorage,
  KarmaState,
  KarmaSource,
  AlignmentPosition,
  KARMA_STORAGE_KEY,
  DEFAULT_KARMA_STATE,
  getAlignmentPosition,
  getDiscountMultiplier,
  calculateKarmaDiscount,
  ALIGNMENT_DISPLAY_NAMES,
  KARMA_MULTIPLIERS,
} from './karmaStorage'

// Re-export types and utilities for convenience
export {
  type KarmaState,
  type KarmaSource,
  type AlignmentPosition,
  getAlignmentPosition,
  getDiscountMultiplier,
  calculateKarmaDiscount,
  ALIGNMENT_DISPLAY_NAMES,
  KARMA_MULTIPLIERS,
}

// Toast notification for karma changes
export interface KarmaToast {
  id: string
  message: string
  lawfulDelta: number
  goodDelta: number
  position: AlignmentPosition
  timestamp: number
}

interface KarmaContextValue {
  // State
  karma: KarmaState
  alignmentPosition: AlignmentPosition
  discountMultiplier: number
  toasts: KarmaToast[]

  // Actions
  applyKarma: (source: KarmaSource, description: string, lawful: number, good: number) => void
  recordHintUsed: () => void
  recordCleanCompletion: () => void
  recordHouseRulesCompletion: (correctAnswers: number) => void
  calculateDiscount: (baseDiscount: number) => number
  resetKarma: () => void
  dismissToast: (id: string) => void

  // State checks
  hasCompletedHouseRules: boolean
  houseRulesScore: number
}

const KarmaContext = createContext<KarmaContextValue | null>(null)

export function useKarma(): KarmaContextValue {
  const context = useContext(KarmaContext)
  if (!context) {
    throw new Error('useKarma must be used within a KarmaProvider')
  }
  return context
}

interface KarmaProviderProps {
  children: ReactNode
}

export function KarmaProvider({ children }: KarmaProviderProps) {
  const [karma, setKarma] = useState<KarmaState>(DEFAULT_KARMA_STATE)
  const [toasts, setToasts] = useState<KarmaToast[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const state = KarmaStorage.init()
    setKarma(state)
    setIsInitialized(true)
  }, [])

  // Cross-tab sync via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === KARMA_STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue) as KarmaState
          setKarma(newState)
        } catch (err) {
          console.error('Failed to parse karma sync:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Auto-dismiss toasts after 4 seconds
  useEffect(() => {
    if (toasts.length === 0) return

    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 4000)

    return () => clearTimeout(timer)
  }, [toasts])

  // Create a toast notification
  const createToast = useCallback((
    message: string,
    lawfulDelta: number,
    goodDelta: number,
    position: AlignmentPosition
  ) => {
    const toast: KarmaToast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      message,
      lawfulDelta,
      goodDelta,
      position,
      timestamp: Date.now(),
    }
    setToasts(prev => [...prev, toast])
  }, [])

  // Apply karma action
  const applyKarma = useCallback((
    source: KarmaSource,
    description: string,
    lawful: number,
    good: number
  ) => {
    const newState = KarmaStorage.applyAction(source, description, lawful, good)
    setKarma(newState)
    createToast(description, lawful, good, getAlignmentPosition(newState.alignment))
  }, [createToast])

  // Record hint used
  const recordHintUsed = useCallback(() => {
    const newState = KarmaStorage.recordHintUsed()
    setKarma(newState)
    createToast('Used a hint', 5, 2, getAlignmentPosition(newState.alignment))
  }, [createToast])

  // Record clean completion
  const recordCleanCompletion = useCallback(() => {
    const newState = KarmaStorage.recordCleanCompletion()
    setKarma(newState)
    createToast('Completed without hints!', -15, -10, getAlignmentPosition(newState.alignment))
  }, [createToast])

  // Record house rules completion
  const recordHouseRulesCompletion = useCallback((correctAnswers: number) => {
    const newState = KarmaStorage.recordHouseRulesCompletion(correctAnswers)
    setKarma(newState)
    const lawfulDelta = -20 + (correctAnswers * -5)
    const goodDelta = correctAnswers * -3
    createToast(
      `House rules: ${correctAnswers}/10 correct`,
      lawfulDelta,
      goodDelta,
      getAlignmentPosition(newState.alignment)
    )
  }, [createToast])

  // Calculate discount with karma modifier
  const calculateDiscount = useCallback((baseDiscount: number): number => {
    return calculateKarmaDiscount(baseDiscount, karma.alignment)
  }, [karma.alignment])

  // Reset karma
  const resetKarma = useCallback(() => {
    const newState = KarmaStorage.reset()
    setKarma(newState)
  }, [])

  // Dismiss a specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Derived values
  const alignmentPosition = getAlignmentPosition(karma.alignment)
  const discountMultiplier = getDiscountMultiplier(karma.alignment)
  const hasCompletedHouseRules = karma.houseRulesCompleted
  const houseRulesScore = karma.houseRulesScore

  const value: KarmaContextValue = {
    karma,
    alignmentPosition,
    discountMultiplier,
    toasts,
    applyKarma,
    recordHintUsed,
    recordCleanCompletion,
    recordHouseRulesCompletion,
    calculateDiscount,
    resetKarma,
    dismissToast,
    hasCompletedHouseRules,
    houseRulesScore,
  }

  // Don't render children until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null
  }

  return (
    <KarmaContext.Provider value={value}>
      {children}
    </KarmaContext.Provider>
  )
}

export default KarmaProvider
