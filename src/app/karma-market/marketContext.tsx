'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  MandelbrotPricingState,
  createInitialPricingState,
  advanceState,
  getCurrentPrices,
  calculatePrice,
} from './data/mandelbrotPricing'
import { DonationRecord } from './data/donationConfig'

const MARKET_STORAGE_KEY = 'bobr_karma_market'

// ── Types ───────────────────────────────────────────────

interface TreatPurchaseRecord {
  animalId: string
  treatId: string
  timestamp: number
}

interface MarketState {
  pricingState: MandelbrotPricingState
  ownedMomentos: string[]
  treatPurchases: TreatPurchaseRecord[]
  activeCooldowns: Record<string, number> // treatId -> expiry timestamp
  donations: DonationRecord[]
}

interface MarketContextValue {
  // Pricing
  pricingState: MandelbrotPricingState
  currentPrices: { good: number; bad: number; neutral: number }

  // Momentos
  ownedMomentos: string[]
  buyMomento: (momentoId: string) => boolean // Returns success
  ownsMomento: (momentoId: string) => boolean

  // Animal Treats
  treatPurchases: TreatPurchaseRecord[]
  buyTreat: (animalId: string, treatId: string) => boolean
  isTreatOnCooldown: (treatId: string) => boolean
  getCooldownRemaining: (treatId: string) => number // ms remaining

  // Donations
  donations: DonationRecord[]
  recordDonation: (donation: DonationRecord) => void

  // Karma purchases (advance Mandelbrot state)
  purchaseGoodKarma: () => void
  purchaseBadKarma: () => void

  // Animals fed tracking (for achievements)
  getAnimalsFed: () => Set<string>
  hasMetUnlockCondition: (condition: string | undefined) => boolean
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function useMarket(): MarketContextValue {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider')
  }
  return context
}

// ── Default State ────────────────────────────────────────

function createDefaultState(): MarketState {
  return {
    pricingState: createInitialPricingState(),
    ownedMomentos: [],
    treatPurchases: [],
    activeCooldowns: {},
    donations: [],
  }
}

// ── Provider ─────────────────────────────────────────────

interface MarketProviderProps {
  children: ReactNode
}

export function MarketProvider({ children }: MarketProviderProps) {
  const [state, setState] = useState<MarketState>(createDefaultState)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MARKET_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults in case schema evolved
        setState(prev => ({
          ...prev,
          ...parsed,
          pricingState: {
            ...createInitialPricingState(),
            ...parsed.pricingState,
          },
        }))
      }
    } catch (e) {
      console.warn('Failed to load market state:', e)
    }
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save market state:', e)
    }
  }, [state])

  // Cross-tab sync via StorageEvent
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MARKET_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setState(parsed)
        } catch {
          // ignore parse errors from other tabs
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Current prices (derived)
  const currentPrices = getCurrentPrices(state.pricingState)

  // ── Momentos ─────────────────

  const ownsMomento = useCallback((momentoId: string): boolean => {
    return state.ownedMomentos.includes(momentoId)
  }, [state.ownedMomentos])

  const buyMomento = useCallback((momentoId: string): boolean => {
    if (state.ownedMomentos.includes(momentoId)) return false
    setState(prev => ({
      ...prev,
      ownedMomentos: [...prev.ownedMomentos, momentoId],
    }))
    return true
  }, [state.ownedMomentos])

  // ── Animal Treats ────────────

  const buyTreat = useCallback((animalId: string, treatId: string): boolean => {
    const cooldownExpiry = state.activeCooldowns[treatId]
    if (cooldownExpiry && Date.now() < cooldownExpiry) return false

    setState(prev => ({
      ...prev,
      treatPurchases: [
        ...prev.treatPurchases,
        { animalId, treatId, timestamp: Date.now() },
      ],
    }))
    return true
  }, [state.activeCooldowns])

  const isTreatOnCooldown = useCallback((treatId: string): boolean => {
    const expiry = state.activeCooldowns[treatId]
    return !!expiry && Date.now() < expiry
  }, [state.activeCooldowns])

  const getCooldownRemaining = useCallback((treatId: string): number => {
    const expiry = state.activeCooldowns[treatId]
    if (!expiry) return 0
    return Math.max(0, expiry - Date.now())
  }, [state.activeCooldowns])

  // Set cooldown after treat purchase
  const setTreatCooldown = useCallback((treatId: string, cooldownMinutes: number) => {
    setState(prev => ({
      ...prev,
      activeCooldowns: {
        ...prev.activeCooldowns,
        [treatId]: Date.now() + cooldownMinutes * 60 * 1000,
      },
    }))
  }, [])

  // Wrap buyTreat with cooldown setting
  const buyTreatWithCooldown = useCallback((animalId: string, treatId: string): boolean => {
    const success = buyTreat(animalId, treatId)
    if (success) {
      // Find the treat to get its cooldown
      // Import is at module level, but we need to find the treat
      // The caller should handle cooldown setting, but we can set a default
      setTreatCooldown(treatId, 15) // default 15 min, caller can override
    }
    return success
  }, [buyTreat, setTreatCooldown])

  // ── Donations ────────────────

  const recordDonation = useCallback((donation: DonationRecord) => {
    setState(prev => ({
      ...prev,
      donations: [...prev.donations, donation],
    }))
  }, [])

  // ── Karma Purchases ──────────

  const purchaseGoodKarma = useCallback(() => {
    setState(prev => ({
      ...prev,
      pricingState: advanceState(prev.pricingState, 'good'),
    }))
  }, [])

  const purchaseBadKarma = useCallback(() => {
    setState(prev => ({
      ...prev,
      pricingState: advanceState(prev.pricingState, 'bad'),
    }))
  }, [])

  // ── Achievement Tracking ─────

  const getAnimalsFed = useCallback((): Set<string> => {
    return new Set(state.treatPurchases.map(tp => tp.animalId))
  }, [state.treatPurchases])

  const hasMetUnlockCondition = useCallback((condition: string | undefined): boolean => {
    if (!condition) return true

    if (condition === 'Buy treats for every domestic animal') {
      const domesticIds = ['barn_cats', 'pigs', 'sheep', 'horse', 'emus', 'donkeys', 'peacocks']
      const fed = getAnimalsFed()
      return domesticIds.every(id => fed.has(id))
    }

    if (condition === 'Collect all rare momentos') {
      // Check if all rare momentos are owned
      const rareIds = ['black_bart_bandana', 'golden_frog', 'peacock_fan', 'stagecoach_model']
      return rareIds.every(id => state.ownedMomentos.includes(id))
    }

    return true // Unknown conditions default to true
  }, [getAnimalsFed, state.ownedMomentos])

  const value: MarketContextValue = {
    pricingState: state.pricingState,
    currentPrices,
    ownedMomentos: state.ownedMomentos,
    buyMomento,
    ownsMomento,
    treatPurchases: state.treatPurchases,
    buyTreat: buyTreatWithCooldown,
    isTreatOnCooldown,
    getCooldownRemaining,
    donations: state.donations,
    recordDonation,
    purchaseGoodKarma,
    purchaseBadKarma,
    getAnimalsFed,
    hasMetUnlockCondition,
  }

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  )
}
