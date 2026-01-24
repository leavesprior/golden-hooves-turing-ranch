'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import {
  PropertyTier,
  BuildingType,
  WagonType,
  SaddleType,
  RifleType,
  EndingType,
  PROPERTY_TIERS,
  BUILDINGS,
  WAGONS,
  SADDLES,
  RIFLES,
  HORSE_CONFIG,
  MINING_CLAIM,
  FARMLAND,
  getNextPropertyTier,
  canAffordPropertyUpgrade,
  calculateNetWorth,
  determineEnding,
} from './data/settlementConfig'
import { useKarmaWallet } from './karmaWalletContext'
import { useRanch } from './ranchContext'

// ============================================================
// TYPES
// ============================================================

export interface SettlementState {
  // Property progression
  propertyTier: PropertyTier

  // Buildings owned (can have multiple)
  buildings: BuildingType[]
  buildingsInProgress: { type: BuildingType; daysRemaining: number }[]

  // Items owned
  wagon: WagonType | null
  horses: number
  saddle: SaddleType | null
  rifle: RifleType | null

  // Land ownership
  miningClaims: number
  farmAcres: number

  // Progress tracking
  goldMined: number
  daysInSettlement: number
  reputation: number

  // State flags
  hasLeftSettlement: boolean
  isSettlementComplete: boolean
  finalEnding: EndingType | null
}

interface SettlementContextValue {
  state: SettlementState

  // Property
  getPropertyTierConfig: () => typeof PROPERTY_TIERS[PropertyTier]
  canUpgradeProperty: () => { canAfford: boolean; reason?: string }
  upgradeProperty: () => Promise<boolean>

  // Buildings
  canBuildBuilding: (type: BuildingType) => { canAfford: boolean; reason?: string }
  startBuilding: (type: BuildingType) => Promise<boolean>
  hasBuilding: (type: BuildingType) => boolean

  // Purchases
  canBuyWagon: (type: WagonType) => { canAfford: boolean; reason?: string }
  buyWagon: (type: WagonType) => Promise<boolean>
  canBuyHorse: () => { canAfford: boolean; reason?: string }
  buyHorse: () => Promise<boolean>
  canBuySaddle: (type: SaddleType) => { canAfford: boolean; reason?: string }
  buySaddle: (type: SaddleType) => Promise<boolean>
  canBuyRifle: (type: RifleType) => { canAfford: boolean; reason?: string }
  buyRifle: (type: RifleType) => Promise<boolean>
  canBuyMiningClaim: () => { canAfford: boolean; reason?: string }
  buyMiningClaim: () => Promise<boolean>
  canBuyFarmland: (acres: number) => { canAfford: boolean; reason?: string }
  buyFarmland: (acres: number) => Promise<boolean>

  // Time management
  advanceDay: (days?: number) => void
  workMiningClaims: () => Promise<number>

  // Settlement completion
  getNetWorth: () => number
  getCurrentEnding: () => EndingType
  leaveSettlement: () => void
  completeSettlement: () => void

  // Reputation
  modifyReputation: (delta: number, reason: string) => void
}

// ============================================================
// CONTEXT
// ============================================================

const SettlementContext = createContext<SettlementContextValue | null>(null)

export function useSettlement(): SettlementContextValue {
  const context = useContext(SettlementContext)
  if (!context) {
    throw new Error('useSettlement must be used within a SettlementProvider')
  }
  return context
}

// ============================================================
// PROVIDER
// ============================================================

const LOCAL_STORAGE_KEY = 'oregon_trail_settlement'

interface SettlementProviderProps {
  children: ReactNode
}

// Helper function to get initial state from localStorage
function getInitialState(): SettlementState {
  const defaultState: SettlementState = {
    propertyTier: 0,
    buildings: [],
    buildingsInProgress: [],
    wagon: null,
    horses: 0,
    saddle: null,
    rifle: null,
    miningClaims: 0,
    farmAcres: 0,
    goldMined: 0,
    daysInSettlement: 0,
    reputation: 0,
    hasLeftSettlement: false,
    isSettlementComplete: false,
    finalEnding: null,
  }

  if (typeof window === 'undefined') return defaultState

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultState, ...parsed }
    }
  } catch (e) {
    console.warn('Failed to load settlement state:', e)
  }
  return defaultState
}

export function SettlementProvider({ children }: SettlementProviderProps) {
  const { balance, spendNeutral, spendGood, earnNeutral } = useKarmaWallet()
  const ranch = useRanch()

  const [state, setState] = useState<SettlementState>(getInitialState)

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save settlement state:', e)
    }
  }, [state])

  // ============================================================
  // PROPERTY FUNCTIONS
  // ============================================================

  const getPropertyTierConfig = useCallback(() => {
    return PROPERTY_TIERS[state.propertyTier]
  }, [state.propertyTier])

  const canUpgradeProperty = useCallback(() => {
    return canAffordPropertyUpgrade(
      state.propertyTier,
      balance.neutral,
      balance.good,
      state.daysInSettlement,
      state.reputation
    )
  }, [state.propertyTier, balance.neutral, balance.good, state.daysInSettlement, state.reputation])

  const upgradeProperty = useCallback(async () => {
    const { canAfford, reason } = canUpgradeProperty()
    if (!canAfford) return false

    const nextTier = getNextPropertyTier(state.propertyTier)
    if (!nextTier) return false

    const config = PROPERTY_TIERS[nextTier]

    // Spend karma
    const neutralSuccess = await spendNeutral(config.neutralKarmaCost, `Property upgrade: ${config.name}`)
    if (!neutralSuccess) return false

    if (config.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(config.goodKarmaRequired, `Property upgrade: ${config.name}`)
      if (!goodSuccess) return false
    }

    setState(prev => ({
      ...prev,
      propertyTier: nextTier,
    }))

    return true
  }, [canUpgradeProperty, state.propertyTier, spendNeutral, spendGood])

  // ============================================================
  // BUILDING FUNCTIONS
  // ============================================================

  const hasBuilding = useCallback((type: BuildingType) => {
    return state.buildings.includes(type)
  }, [state.buildings])

  const canBuildBuilding = useCallback((type: BuildingType) => {
    const config = BUILDINGS[type]

    if (hasBuilding(type)) {
      return { canAfford: false, reason: 'Already built' }
    }

    if (config.prerequisite && !hasBuilding(config.prerequisite)) {
      return { canAfford: false, reason: `Requires ${BUILDINGS[config.prerequisite].name}` }
    }

    // Check if this tier unlocks this building
    const tierConfig = PROPERTY_TIERS[state.propertyTier]
    if (!tierConfig.unlocksBuildings.includes(type) && state.propertyTier < 2) {
      return { canAfford: false, reason: 'Requires higher property tier' }
    }

    if (balance.neutral < config.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🪙 (have ${balance.neutral})` }
    }

    if (balance.good < config.goodKarmaRequired) {
      return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪 (have ${balance.good})` }
    }

    if (state.buildingsInProgress.some(b => b.type === type)) {
      return { canAfford: false, reason: 'Already under construction' }
    }

    return { canAfford: true }
  }, [hasBuilding, state.propertyTier, state.buildingsInProgress, balance.neutral, balance.good])

  const startBuilding = useCallback(async (type: BuildingType) => {
    const { canAfford } = canBuildBuilding(type)
    if (!canAfford) return false

    const config = BUILDINGS[type]

    const neutralSuccess = await spendNeutral(config.neutralKarmaCost, `Building: ${config.name}`)
    if (!neutralSuccess) return false

    if (config.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(config.goodKarmaRequired, `Building: ${config.name}`)
      if (!goodSuccess) return false
    }

    setState(prev => ({
      ...prev,
      buildingsInProgress: [
        ...prev.buildingsInProgress,
        { type, daysRemaining: config.buildDays }
      ],
    }))

    return true
  }, [canBuildBuilding, spendNeutral, spendGood])

  // ============================================================
  // PURCHASE FUNCTIONS
  // ============================================================

  const canBuyWagon = useCallback((type: WagonType) => {
    const config = WAGONS[type]

    if (state.wagon === type) {
      return { canAfford: false, reason: 'Already owned' }
    }

    if (balance.neutral < config.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🪙` }
    }

    if (balance.good < config.goodKarmaRequired) {
      return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪` }
    }

    return { canAfford: true }
  }, [state.wagon, balance.neutral, balance.good])

  const buyWagon = useCallback(async (type: WagonType) => {
    const { canAfford } = canBuyWagon(type)
    if (!canAfford) return false

    const config = WAGONS[type]

    const neutralSuccess = await spendNeutral(config.neutralKarmaCost, `Wagon: ${config.name}`)
    if (!neutralSuccess) return false

    if (config.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(config.goodKarmaRequired, `Wagon: ${config.name}`)
      if (!goodSuccess) return false
    }

    setState(prev => ({ ...prev, wagon: type }))
    return true
  }, [canBuyWagon, spendNeutral, spendGood])

  const canBuyHorse = useCallback(() => {
    if (state.horses >= HORSE_CONFIG.maxOwned) {
      return { canAfford: false, reason: `Maximum ${HORSE_CONFIG.maxOwned} horses` }
    }

    if (HORSE_CONFIG.requiresBarn && !hasBuilding('barn')) {
      return { canAfford: false, reason: 'Requires barn' }
    }

    if (balance.neutral < HORSE_CONFIG.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${HORSE_CONFIG.neutralKarmaCost}🪙` }
    }

    if (balance.good < HORSE_CONFIG.goodKarmaRequired) {
      return { canAfford: false, reason: `Need ${HORSE_CONFIG.goodKarmaRequired}🍪` }
    }

    return { canAfford: true }
  }, [state.horses, hasBuilding, balance.neutral, balance.good])

  const buyHorse = useCallback(async () => {
    const { canAfford } = canBuyHorse()
    if (!canAfford) return false

    const neutralSuccess = await spendNeutral(HORSE_CONFIG.neutralKarmaCost, 'Draft Horse')
    if (!neutralSuccess) return false

    if (HORSE_CONFIG.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(HORSE_CONFIG.goodKarmaRequired, 'Draft Horse')
      if (!goodSuccess) return false
    }

    setState(prev => ({ ...prev, horses: prev.horses + 1 }))
    return true
  }, [canBuyHorse, spendNeutral, spendGood])

  const canBuySaddle = useCallback((type: SaddleType) => {
    const config = SADDLES[type]

    if (state.saddle === type) {
      return { canAfford: false, reason: 'Already owned' }
    }

    if (state.horses === 0) {
      return { canAfford: false, reason: 'Need a horse first' }
    }

    if (balance.neutral < config.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🪙` }
    }

    if (balance.good < config.goodKarmaRequired) {
      return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪` }
    }

    return { canAfford: true }
  }, [state.saddle, state.horses, balance.neutral, balance.good])

  const buySaddle = useCallback(async (type: SaddleType) => {
    const { canAfford } = canBuySaddle(type)
    if (!canAfford) return false

    const config = SADDLES[type]

    const neutralSuccess = await spendNeutral(config.neutralKarmaCost, `Saddle: ${config.name}`)
    if (!neutralSuccess) return false

    if (config.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(config.goodKarmaRequired, `Saddle: ${config.name}`)
      if (!goodSuccess) return false
    }

    setState(prev => ({ ...prev, saddle: type }))
    return true
  }, [canBuySaddle, spendNeutral, spendGood])

  const canBuyRifle = useCallback((type: RifleType) => {
    const config = RIFLES[type]

    if (state.rifle === type) {
      return { canAfford: false, reason: 'Already owned' }
    }

    if (balance.neutral < config.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🪙` }
    }

    if (balance.good < config.goodKarmaRequired) {
      return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪` }
    }

    return { canAfford: true }
  }, [state.rifle, balance.neutral, balance.good])

  const buyRifle = useCallback(async (type: RifleType) => {
    const { canAfford } = canBuyRifle(type)
    if (!canAfford) return false

    const config = RIFLES[type]

    const neutralSuccess = await spendNeutral(config.neutralKarmaCost, `Rifle: ${config.name}`)
    if (!neutralSuccess) return false

    if (config.goodKarmaRequired > 0) {
      const goodSuccess = await spendGood(config.goodKarmaRequired, `Rifle: ${config.name}`)
      if (!goodSuccess) return false
    }

    setState(prev => ({ ...prev, rifle: type }))
    return true
  }, [canBuyRifle, spendNeutral, spendGood])

  const canBuyMiningClaim = useCallback(() => {
    if (state.miningClaims >= MINING_CLAIM.maxOwned) {
      return { canAfford: false, reason: `Maximum ${MINING_CLAIM.maxOwned} claims` }
    }

    if (balance.neutral < MINING_CLAIM.neutralKarmaCost) {
      return { canAfford: false, reason: `Need ${MINING_CLAIM.neutralKarmaCost}🪙` }
    }

    return { canAfford: true }
  }, [state.miningClaims, balance.neutral])

  const buyMiningClaim = useCallback(async () => {
    const { canAfford } = canBuyMiningClaim()
    if (!canAfford) return false

    const neutralSuccess = await spendNeutral(MINING_CLAIM.neutralKarmaCost, 'Mining Claim')
    if (!neutralSuccess) return false

    setState(prev => ({ ...prev, miningClaims: prev.miningClaims + 1 }))
    return true
  }, [canBuyMiningClaim, spendNeutral])

  const canBuyFarmland = useCallback((acres: number) => {
    const totalCost = acres * FARMLAND.costPerAcre
    const newTotal = state.farmAcres + acres

    if (newTotal > FARMLAND.maxAcres) {
      return { canAfford: false, reason: `Maximum ${FARMLAND.maxAcres} acres` }
    }

    if (balance.neutral < totalCost) {
      return { canAfford: false, reason: `Need ${totalCost}🪙 for ${acres} acres` }
    }

    return { canAfford: true }
  }, [state.farmAcres, balance.neutral])

  const buyFarmland = useCallback(async (acres: number) => {
    const { canAfford } = canBuyFarmland(acres)
    if (!canAfford) return false

    const totalCost = acres * FARMLAND.costPerAcre

    const neutralSuccess = await spendNeutral(totalCost, `Farmland: ${acres} acres`)
    if (!neutralSuccess) return false

    setState(prev => ({ ...prev, farmAcres: prev.farmAcres + acres }))
    return true
  }, [canBuyFarmland, spendNeutral])

  // ============================================================
  // TIME MANAGEMENT
  // ============================================================

  const advanceDay = useCallback((days: number = 1) => {
    setState(prev => {
      const newBuildingsInProgress = prev.buildingsInProgress
        .map(b => ({ ...b, daysRemaining: b.daysRemaining - days }))
        .filter(b => b.daysRemaining > 0)

      const completedBuildings = prev.buildingsInProgress
        .filter(b => b.daysRemaining - days <= 0)
        .map(b => b.type)

      return {
        ...prev,
        daysInSettlement: prev.daysInSettlement + days,
        buildingsInProgress: newBuildingsInProgress,
        buildings: [...prev.buildings, ...completedBuildings],
      }
    })
  }, [])

  const workMiningClaims = useCallback(async () => {
    if (state.miningClaims === 0) return 0

    let totalGold = 0
    for (let i = 0; i < state.miningClaims; i++) {
      const [min, max] = MINING_CLAIM.dailyGoldRange
      const gold = Math.floor(Math.random() * (max - min + 1)) + min
      totalGold += gold

      // Check for artifact (mystery clue)
      if (Math.random() < MINING_CLAIM.artifactChance) {
        // TODO: Integrate with mystery system
      }
    }

    await earnNeutral(totalGold, `Mining: ${state.miningClaims} claim(s)`)

    setState(prev => ({
      ...prev,
      goldMined: prev.goldMined + totalGold,
    }))

    return totalGold
  }, [state.miningClaims, earnNeutral])

  // ============================================================
  // SETTLEMENT COMPLETION
  // ============================================================

  const getNetWorth = useCallback(() => {
    const livestockValue = ranch?.getRanchValue?.() || 0
    const totalLivestock = ranch?.getTotalLivestock?.() || 0

    return calculateNetWorth(
      balance.neutral,
      state.propertyTier,
      state.buildings,
      state.horses,
      state.wagon,
      state.rifle,
      state.saddle,
      state.miningClaims,
      state.farmAcres,
      state.goldMined,
      livestockValue
    )
  }, [balance.neutral, state, ranch])

  const getCurrentEnding = useCallback(() => {
    const totalLivestock = ranch?.getTotalLivestock?.() || 0
    // TODO: Get mysterySolved from mysteryContext
    const mysterySolved = false

    return determineEnding(
      state.propertyTier,
      state.daysInSettlement,
      state.reputation,
      getNetWorth(),
      state.buildings,
      totalLivestock,
      state.miningClaims,
      state.goldMined,
      mysterySolved,
      state.hasLeftSettlement
    )
  }, [state, ranch, getNetWorth])

  const leaveSettlement = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasLeftSettlement: true,
      isSettlementComplete: true,
      finalEnding: 'departed',
    }))
  }, [])

  const completeSettlement = useCallback(() => {
    const ending = getCurrentEnding()
    setState(prev => ({
      ...prev,
      isSettlementComplete: true,
      finalEnding: ending,
    }))
  }, [getCurrentEnding])

  const modifyReputation = useCallback((delta: number, reason: string) => {
    setState(prev => ({
      ...prev,
      reputation: Math.max(0, Math.min(100, prev.reputation + delta)),
    }))
  }, [])

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: SettlementContextValue = {
    state,

    getPropertyTierConfig,
    canUpgradeProperty,
    upgradeProperty,

    canBuildBuilding,
    startBuilding,
    hasBuilding,

    canBuyWagon,
    buyWagon,
    canBuyHorse,
    buyHorse,
    canBuySaddle,
    buySaddle,
    canBuyRifle,
    buyRifle,
    canBuyMiningClaim,
    buyMiningClaim,
    canBuyFarmland,
    buyFarmland,

    advanceDay,
    workMiningClaims,

    getNetWorth,
    getCurrentEnding,
    leaveSettlement,
    completeSettlement,

    modifyReputation,
  }

  return (
    <SettlementContext.Provider value={value}>
      {children}
    </SettlementContext.Provider>
  )
}

export default SettlementProvider
