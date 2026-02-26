'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import {
  KarmaBlockchainClient,
  KarmaBalance,
  KarmaType,
  oregonTrailKarma,
} from '@/lib/karmaBlockchain'
import {
  AlignmentPosition,
  KARMA_MULTIPLIERS,
  ALIGNMENT_DISPLAY_NAMES,
} from './data/discountEngine'
import { KarmaStorage } from '@/lib/karmaStorage'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export type WalletMode = 'new' | 'continue'

export interface KarmaTransaction {
  id: string
  timestamp: number
  type: 'spend' | 'earn' | 'convert' | 'debt'
  karmaType: KarmaType
  amount: number
  memo?: string
}

// D&D Alignment axes: -100 to +100
// lawfulChaotic: negative = chaotic, positive = lawful
// goodEvil: negative = evil, positive = good
// Thresholds: < -33 = chaotic/evil, -33 to +33 = neutral, > +33 = lawful/good
interface AlignmentAxes {
  lawfulChaotic: number // -100 (chaotic) to +100 (lawful)
  goodEvil: number // -100 (evil) to +100 (good)
}

interface KarmaWalletState {
  balance: KarmaBalance
  isOnline: boolean
  isInitialized: boolean
  walletMode: WalletMode | null
  pendingTransactions: number
  recentTransactions: KarmaTransaction[]
  alignment: AlignmentAxes
}

interface KarmaWalletContextValue {
  // State
  balance: KarmaBalance
  isOnline: boolean
  isInitialized: boolean
  walletMode: WalletMode | null
  pendingCount: number
  recentTransactions: KarmaTransaction[]

  // Initialization
  initializeWallet: (mode: WalletMode) => Promise<void>

  // Spending (returns true if successful)
  spendNeutral: (amount: number, memo?: string) => Promise<boolean>
  spendGood: (amount: number, memo?: string) => Promise<boolean>

  // Earning
  earnNeutral: (amount: number, memo?: string) => Promise<void>
  earnGood: (amount: number, memo?: string) => Promise<void>
  addBadKarma: (amount: number, reason: string) => Promise<void>
  earnFromDonation: (neutralAmount: number, goodAmount: number, memo?: string) => Promise<void>

  // Conversion
  convertGoodToNeutral: (goodAmount: number) => Promise<boolean>
  takeDebt: (amount: number) => Promise<boolean>

  // Utility
  canAfford: (type: KarmaType, amount: number) => boolean
  getAffordableAmount: (type: KarmaType) => number
  refreshBalance: () => Promise<void>

  // D&D Alignment
  alignment: AlignmentAxes
  getKarmaAlignment: () => AlignmentPosition
  getAlignmentDisplayName: () => string
  getDiscountMultiplier: () => number
  recordLawfulAction: (magnitude?: number) => void
  recordChaoticAction: (magnitude?: number) => void
  recordGoodAction: (magnitude?: number) => void
  recordEvilAction: (magnitude?: number) => void

  // Save/Load support
  loadKarmaState: (savedBalance: KarmaBalance, savedAlignment?: AlignmentAxes) => void

  // Modal controls
  showConvertModal: boolean
  setShowConvertModal: (show: boolean) => void
  convertModalContext: { needed: number; karmaType: 'neutral' | 'good' } | null
  setConvertModalContext: (ctx: { needed: number; karmaType: 'neutral' | 'good' } | null) => void
}

const KarmaWalletContext = createContext<KarmaWalletContextValue | null>(null)

export function useKarmaWallet(): KarmaWalletContextValue {
  const context = useContext(KarmaWalletContext)
  if (!context) {
    throw new Error('useKarmaWallet must be used within a KarmaWalletProvider')
  }
  return context
}

const STARTING_NEUTRAL_KARMA = 400
const LOCAL_STORAGE_KEY = 'oregon_trail_karma_wallet'

interface StoredWalletState {
  balance: KarmaBalance
  walletMode: WalletMode
  lastUpdated: number
  alignment?: AlignmentAxes // Optional for backwards compatibility
}

interface KarmaWalletProviderProps {
  children: ReactNode
}

// Default alignment: True Neutral (0, 0)
const DEFAULT_ALIGNMENT: AlignmentAxes = { lawfulChaotic: 0, goodEvil: 0 }

export function KarmaWalletProvider({ children }: KarmaWalletProviderProps) {
  const [state, setState] = useState<KarmaWalletState>({
    balance: { good: 0, neutral: STARTING_NEUTRAL_KARMA, bad: 0 },
    isOnline: true,
    isInitialized: false,
    walletMode: null,
    pendingTransactions: 0,
    recentTransactions: [],
    alignment: DEFAULT_ALIGNMENT,
  })
  // Ref to always hold current state for use in callbacks (avoids React 18 batch timing issues)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Modal state
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertModalContext, setConvertModalContext] = useState<{
    needed: number
    karmaType: 'neutral' | 'good'
  } | null>(null)

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed: StoredWalletState = JSON.parse(stored)
        setState(prev => ({
          ...prev,
          balance: parsed.balance,
          walletMode: parsed.walletMode,
          alignment: parsed.alignment || DEFAULT_ALIGNMENT,
          isInitialized: true,
        }))
      }
    } catch (e) {
      console.warn('Failed to load karma wallet from storage:', e)
    }
  }, [])

  // Save to local storage on state change
  useEffect(() => {
    if (state.isInitialized && state.walletMode) {
      try {
        const toStore: StoredWalletState = {
          balance: state.balance,
          walletMode: state.walletMode,
          lastUpdated: Date.now(),
          alignment: state.alignment,
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toStore))
      } catch (e) {
        console.warn('Failed to save karma wallet to storage:', e)
      }
    }
  }, [state.balance, state.isInitialized, state.walletMode, state.alignment])

  // Sync alignment to unified karma storage for cross-branch carry-forward
  useEffect(() => {
    if (!state.isInitialized) return
    // Map Trail alignment axes to unified storage axes
    // Trail: lawfulChaotic positive=lawful, goodEvil positive=good
    // Unified: lawfulChaotic negative=lawful, goodEvil negative=good
    const unifiedLawful = -state.alignment.lawfulChaotic
    const unifiedGood = -state.alignment.goodEvil
    const current = KarmaStorage.load()
    if (current) {
      // Only update if significantly different (avoid thrashing)
      const lawDiff = Math.abs(current.alignment.lawfulChaotic - unifiedLawful)
      const goodDiff = Math.abs(current.alignment.goodEvil - unifiedGood)
      if (lawDiff > 2 || goodDiff > 2) {
        current.alignment.lawfulChaotic = unifiedLawful
        current.alignment.goodEvil = unifiedGood
        KarmaStorage.save(current)
      }
    } else {
      KarmaStorage.applyAction('oregon_trail', 'Trail alignment sync', unifiedLawful, unifiedGood)
    }
  }, [state.alignment, state.isInitialized])

  // Check online status periodically
  useEffect(() => {
    const checkOnline = async () => {
      const online = await oregonTrailKarma.checkConnection()
      setState(prev => ({
        ...prev,
        isOnline: online,
        pendingTransactions: oregonTrailKarma.pendingCount,
      }))
    }

    checkOnline()
    const interval = setInterval(checkOnline, 10000)
    return () => clearInterval(interval)
  }, [])

  // Add a transaction to recent history
  const addTransaction = useCallback((tx: Omit<KarmaTransaction, 'id' | 'timestamp'>) => {
    const newTx: KarmaTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    }
    setState(prev => ({
      ...prev,
      recentTransactions: [newTx, ...prev.recentTransactions.slice(0, 19)],
    }))
  }, [])

  // Initialize wallet with mode
  const initializeWallet = useCallback(async (mode: WalletMode) => {
    if (mode === 'new') {
      // Check for shared karma pool to carry forward
      const sharedKarma = CrossGameStorage.loadSharedKarma()
      const carryForward = sharedKarma.totalEarned > 0
        ? Math.min(50, Math.floor(sharedKarma.good / 5))  // Up to 50 good karma bonus from shared pool
        : 0

      const balance = { good: carryForward, neutral: STARTING_NEUTRAL_KARMA, bad: 0 }

      // Try to initialize on blockchain
      await oregonTrailKarma.initializeWallet(STARTING_NEUTRAL_KARMA)

      setState(prev => ({
        ...prev,
        balance,
        walletMode: mode,
        isInitialized: true,
        recentTransactions: carryForward > 0
          ? [{
            id: `tx_${Date.now()}_crossgame`,
            timestamp: Date.now(),
            type: 'earn' as const,
            karmaType: 'good' as KarmaType,
            amount: carryForward,
            memo: 'Cross-game karma bonus from other adventures',
          }]
          : [],
      }))
    } else {
      // Continue - fetch existing balance
      try {
        const balance = await oregonTrailKarma.getBalance()
        setState(prev => ({
          ...prev,
          balance,
          walletMode: mode,
          isInitialized: true,
          isOnline: oregonTrailKarma.online,
        }))
      } catch (e) {
        // Use local storage balance if available
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed: StoredWalletState = JSON.parse(stored)
          setState(prev => ({
            ...prev,
            balance: parsed.balance,
            walletMode: mode,
            isInitialized: true,
            isOnline: false,
          }))
        } else {
          // Fallback to starting balance
          setState(prev => ({
            ...prev,
            balance: { good: 0, neutral: STARTING_NEUTRAL_KARMA, bad: 0 },
            walletMode: mode,
            isInitialized: true,
            isOnline: false,
          }))
        }
      }
    }
  }, [])

  // Refresh balance from blockchain
  const refreshBalance = useCallback(async () => {
    try {
      const balance = await oregonTrailKarma.getBalance()
      setState(prev => ({
        ...prev,
        balance,
        isOnline: oregonTrailKarma.online,
        pendingTransactions: oregonTrailKarma.pendingCount,
      }))
    } catch (e) {
      setState(prev => ({ ...prev, isOnline: false }))
    }
  }, [])

  // Spend neutral karma
  const spendNeutral = useCallback(async (amount: number, memo?: string): Promise<boolean> => {
    // Check affordability using ref to avoid React 18 async batch timing issue
    if (stateRef.current.balance.neutral < amount) return false

    setState(prev => {
      if (prev.balance.neutral < amount) return prev // Double-check in updater for safety
      return { ...prev, balance: { ...prev.balance, neutral: prev.balance.neutral - amount } }
    })

    addTransaction({
      type: 'spend',
      karmaType: 'neutral',
      amount: -amount,
      memo,
    })

    // Sync with blockchain (fire and forget for speed)
    oregonTrailKarma.spendNeutral(amount, memo).catch(() => {
      // Queued for later sync
    })

    return true
  }, [addTransaction])

  // Spend good karma
  const spendGood = useCallback(async (amount: number, memo?: string): Promise<boolean> => {
    // Check affordability using ref to avoid React 18 async batch timing issue
    if (stateRef.current.balance.good < amount) return false
    setState(prev => {
      if (prev.balance.good < amount) return prev // Double-check in updater for safety
      return { ...prev, balance: { ...prev.balance, good: prev.balance.good - amount } }
    })

    addTransaction({
      type: 'spend',
      karmaType: 'good',
      amount: -amount,
      memo,
    })

    // Sync with blockchain
    oregonTrailKarma.spendGood(amount, memo).catch(() => {})

    return true
  }, [addTransaction])

  // Earn neutral karma
  const earnNeutral = useCallback(async (amount: number, memo?: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      balance: { ...prev.balance, neutral: prev.balance.neutral + amount },
    }))

    addTransaction({
      type: 'earn',
      karmaType: 'neutral',
      amount: amount,
      memo,
    })

    // Sync to shared karma pool
    CrossGameStorage.syncKarmaToPool('prospectors_tale', 'neutral', amount, memo || 'Trail earn')

    oregonTrailKarma.earnNeutral(amount, memo).catch(() => {})
  }, [addTransaction])

  // Earn good karma
  const earnGood = useCallback(async (amount: number, memo?: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      balance: { ...prev.balance, good: prev.balance.good + amount },
    }))

    addTransaction({
      type: 'earn',
      karmaType: 'good',
      amount: amount,
      memo,
    })

    // Sync to shared karma pool
    CrossGameStorage.syncKarmaToPool('prospectors_tale', 'good', amount, memo || 'Trail good deed')

    oregonTrailKarma.earnGood(amount, memo).catch(() => {})
  }, [addTransaction])

  // Add bad karma
  const addBadKarma = useCallback(async (amount: number, reason: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      balance: { ...prev.balance, bad: prev.balance.bad + amount },
    }))

    addTransaction({
      type: 'debt',
      karmaType: 'bad',
      amount: amount,
      memo: reason,
    })

    // Sync to shared karma pool
    CrossGameStorage.syncKarmaToPool('prospectors_tale', 'bad', amount, reason)

    oregonTrailKarma.addBadKarma(amount, reason).catch(() => {})
  }, [addTransaction])

  // Earn karma from donation (neutral + good in one call)
  const earnFromDonation = useCallback(async (neutralAmount: number, goodAmount: number, memo?: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      balance: {
        ...prev.balance,
        neutral: prev.balance.neutral + neutralAmount,
        good: prev.balance.good + goodAmount,
      },
      // Record as a good action in alignment system
      alignment: {
        ...prev.alignment,
        goodEvil: clampAlignment(prev.alignment.goodEvil + Math.min(20, Math.floor(neutralAmount / 10))),
      },
    }))

    addTransaction({
      type: 'earn',
      karmaType: 'neutral',
      amount: neutralAmount,
      memo: memo || 'Donation',
    })

    if (goodAmount > 0) {
      addTransaction({
        type: 'earn',
        karmaType: 'good',
        amount: goodAmount,
        memo: `Donation bonus: ${memo || ''}`,
      })
    }

    oregonTrailKarma.earnNeutral(neutralAmount, `DONATION: ${memo}`).catch(() => {})
    if (goodAmount > 0) {
      oregonTrailKarma.earnGood(goodAmount, `DONATION_BONUS: ${memo}`).catch(() => {})
    }
  }, [addTransaction])

  // Convert good to neutral (2:1 ratio)
  const convertGoodToNeutral = useCallback(async (goodAmount: number): Promise<boolean> => {
    const neutralReceived = Math.floor(goodAmount / 2)

    // Check affordability using ref to avoid React 18 async batch timing issue
    if (stateRef.current.balance.good < goodAmount) return false
    setState(prev => {
      if (prev.balance.good < goodAmount) return prev // Double-check in updater for safety
      return {
        ...prev,
        balance: {
          ...prev.balance,
          good: prev.balance.good - goodAmount,
          neutral: prev.balance.neutral + neutralReceived,
        },
      }
    })

    addTransaction({
      type: 'convert',
      karmaType: 'good',
      amount: -goodAmount,
      memo: `Converted to ${neutralReceived}🌮`,
    })

    oregonTrailKarma.convertGoodToNeutral(goodAmount).catch(() => {})

    return true
  }, [addTransaction])

  // Take debt (1:1 neutral:bad)
  const takeDebt = useCallback(async (amount: number): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      balance: {
        ...prev.balance,
        neutral: prev.balance.neutral + amount,
        bad: prev.balance.bad + amount,
      },
    }))

    addTransaction({
      type: 'debt',
      karmaType: 'neutral',
      amount: amount,
      memo: `Debt: +${amount}🪨 / +${amount}🌮`,
    })

    oregonTrailKarma.takeDebt(amount).catch(() => {})

    return true
  }, [addTransaction])

  // Check if player can afford an amount
  const canAfford = useCallback((type: KarmaType, amount: number): boolean => {
    switch (type) {
      case 'good':
        return state.balance.good >= amount
      case 'neutral':
        return state.balance.neutral >= amount
      case 'bad':
        return true // Can always take on bad karma
      default:
        return false
    }
  }, [state.balance])

  // Get affordable amount for a karma type
  const getAffordableAmount = useCallback((type: KarmaType): number => {
    switch (type) {
      case 'good':
        return state.balance.good
      case 'neutral':
        return state.balance.neutral
      case 'bad':
        return Infinity
      default:
        return 0
    }
  }, [state.balance])

  // ============================================================
  // D&D ALIGNMENT SYSTEM
  // ============================================================
  // Two-axis system: lawfulChaotic and goodEvil, each -100 to +100
  // Thresholds at -33 and +33 determine alignment category

  // Calculate alignment position from axes
  const getKarmaAlignment = useCallback((): AlignmentPosition => {
    const { lawfulChaotic, goodEvil } = state.alignment

    // Determine lawful/neutral/chaotic
    let lawAxis: 'lawful' | 'neutral' | 'chaotic'
    if (lawfulChaotic > 33) lawAxis = 'lawful'
    else if (lawfulChaotic < -33) lawAxis = 'chaotic'
    else lawAxis = 'neutral'

    // Determine good/neutral/evil
    let goodAxis: 'good' | 'neutral' | 'evil'
    if (goodEvil > 33) goodAxis = 'good'
    else if (goodEvil < -33) goodAxis = 'evil'
    else goodAxis = 'neutral'

    // Combine into alignment position
    if (lawAxis === 'neutral' && goodAxis === 'neutral') return 'true_neutral'
    if (lawAxis === 'neutral') return `neutral_${goodAxis}` as AlignmentPosition
    if (goodAxis === 'neutral') return `${lawAxis}_neutral` as AlignmentPosition
    return `${lawAxis}_${goodAxis}` as AlignmentPosition
  }, [state.alignment])

  // Get display name for current alignment
  const getAlignmentDisplayName = useCallback((): string => {
    const alignment = getKarmaAlignment()
    return ALIGNMENT_DISPLAY_NAMES[alignment]
  }, [getKarmaAlignment])

  // Get discount multiplier based on alignment
  const getDiscountMultiplier = useCallback((): number => {
    const alignment = getKarmaAlignment()
    return KARMA_MULTIPLIERS[alignment]
  }, [getKarmaAlignment])

  // Helper to clamp alignment values to -100 to +100
  const clampAlignment = (value: number): number => {
    return Math.max(-100, Math.min(100, value))
  }

  // Record a lawful action (following rules, respecting authority)
  const recordLawfulAction = useCallback((magnitude: number = 10): void => {
    setState(prev => ({
      ...prev,
      alignment: {
        ...prev.alignment,
        lawfulChaotic: clampAlignment(prev.alignment.lawfulChaotic + magnitude),
      },
    }))
  }, [])

  // Record a chaotic action (breaking rules, defying authority)
  const recordChaoticAction = useCallback((magnitude: number = 10): void => {
    setState(prev => ({
      ...prev,
      alignment: {
        ...prev.alignment,
        lawfulChaotic: clampAlignment(prev.alignment.lawfulChaotic - magnitude),
      },
    }))
  }, [])

  // Record a good action (helping others, selfless)
  const recordGoodAction = useCallback((magnitude: number = 10): void => {
    setState(prev => ({
      ...prev,
      alignment: {
        ...prev.alignment,
        goodEvil: clampAlignment(prev.alignment.goodEvil + magnitude),
      },
    }))
  }, [])

  // Load karma state from a saved game
  const loadKarmaState = useCallback((savedBalance: KarmaBalance, savedAlignment?: AlignmentAxes): void => {
    setState(prev => ({
      ...prev,
      balance: savedBalance,
      alignment: savedAlignment || prev.alignment,
      isInitialized: true,
    }))
  }, [])

  // Record an evil action (harming others, selfish)
  const recordEvilAction = useCallback((magnitude: number = 10): void => {
    setState(prev => ({
      ...prev,
      alignment: {
        ...prev.alignment,
        goodEvil: clampAlignment(prev.alignment.goodEvil - magnitude),
      },
    }))
  }, [])

  const value: KarmaWalletContextValue = {
    // State
    balance: state.balance,
    isOnline: state.isOnline,
    isInitialized: state.isInitialized,
    walletMode: state.walletMode,
    pendingCount: state.pendingTransactions,
    recentTransactions: state.recentTransactions,

    // Initialization
    initializeWallet,

    // Spending
    spendNeutral,
    spendGood,

    // Earning
    earnNeutral,
    earnGood,
    addBadKarma,
    earnFromDonation,

    // Conversion
    convertGoodToNeutral,
    takeDebt,

    // Utility
    canAfford,
    getAffordableAmount,
    refreshBalance,

    // D&D Alignment
    alignment: state.alignment,
    getKarmaAlignment,
    getAlignmentDisplayName,
    getDiscountMultiplier,
    recordLawfulAction,
    recordChaoticAction,
    recordGoodAction,
    recordEvilAction,

    // Save/Load support
    loadKarmaState,

    // Modal controls
    showConvertModal,
    setShowConvertModal,
    convertModalContext,
    setConvertModalContext,
  }

  return (
    <KarmaWalletContext.Provider value={value}>
      {children}
    </KarmaWalletContext.Provider>
  )
}

export default KarmaWalletProvider
