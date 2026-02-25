'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  FENCE_TIERS,
  LIVESTOCK_TYPES,
  FEED_TYPES,
  SEASONS,
  RANCH_EVENTS,
  type FenceTier,
  type LivestockType,
  type FeedType,
  type Season,
  type RanchEvent,
  type FenceConfig,
  type LivestockConfig,
  getNextFenceTier,
  canAffordFenceUpgrade,
  calculateDailyFeedNeed,
  calculateDailyProduction,
  getTotalLivestockCount,
  getCurrentSeason,
  getDayOfYear,
} from './data/ranchConfig'
import {
  SEASONAL_PRICES,
  CROPS,
  MARKET_EVENTS,
  getEffectivePrice,
  rollMarketEvent,
  getSeasonalAdvice,
  canPlantCrop,
  isCropReady,
  type MarketEvent,
  type CropType,
  type CropPlot,
} from './data/seasonalMarket'
import { useKarmaWallet } from './karmaWalletContext'

// Storage key
const RANCH_STORAGE_KEY = 'bobr_ranch_state'

// Ranch State
export interface RanchState {
  // Ranch ownership
  unlocked: boolean
  location: string

  // Infrastructure
  fenceTier: FenceTier
  upgradeInProgress: boolean
  upgradeDaysRemaining: number

  // Livestock
  livestock: Record<LivestockType, number>
  livestockHealth: Record<LivestockType, number> // 0-100 health per type

  // Resources
  feedStock: number // Total feed units
  feedType: FeedType // Current feed quality

  // Time
  gameDay: number
  lastProcessedDay: number

  // Products (accumulated, can be sold)
  products: Record<string, number>

  // Events log
  eventLog: Array<{
    day: number
    season: Season
    event: string
    type: 'birth' | 'death' | 'event' | 'production' | 'purchase' | 'sale'
  }>

  // Seasonal Market (Lords II-inspired economy)
  activeMarketEvent: MarketEvent | null
  marketEventEndDay: number
  lastSeasonChecked: Season | null  // Track season changes for market events

  // Crops
  cropPlots: CropPlot[]

  // Statistics
  totalLivestockRaised: number
  totalProductsSold: number
  totalKarmaEarned: number
}

const defaultRanchState: RanchState = {
  unlocked: false,
  location: 'West Point',
  fenceTier: 1,
  upgradeInProgress: false,
  upgradeDaysRemaining: 0,
  livestock: {
    cattle: 0,
    chickens: 0,
    horses: 0,
    goats: 0,
  },
  livestockHealth: {
    cattle: 100,
    chickens: 100,
    horses: 100,
    goats: 100,
  },
  feedStock: 0,
  feedType: 'hay',
  gameDay: 1,
  lastProcessedDay: 0,
  products: {},
  eventLog: [],
  activeMarketEvent: null,
  marketEventEndDay: 0,
  lastSeasonChecked: null,
  cropPlots: [],
  totalLivestockRaised: 0,
  totalProductsSold: 0,
  totalKarmaEarned: 0,
}

interface RanchContextValue {
  state: RanchState

  // Ranch management
  unlockRanch: () => void
  isRanchUnlocked: () => boolean

  // Fence operations
  getCurrentFence: () => FenceConfig
  getNextFence: () => FenceConfig | null
  canUpgradeFence: () => { canUpgrade: boolean; reason?: string }
  upgradeFence: () => Promise<boolean>

  // Livestock operations
  buyLivestock: (type: LivestockType, count: number) => Promise<boolean>
  sellLivestock: (type: LivestockType, count: number) => Promise<number>
  slaughterLivestock: (type: LivestockType, count: number) => Promise<number>
  getLivestockConfig: (type: LivestockType) => LivestockConfig
  getTotalLivestock: () => number
  getMaxLivestock: () => number

  // Feed operations
  buyFeed: (type: FeedType, units: number) => Promise<boolean>
  setFeedType: (type: FeedType) => void
  getDailyFeedNeed: () => number

  // Production
  getDailyProduction: () => Record<string, { amount: number; value: number }>
  sellProducts: (productName: string, amount: number) => Promise<number>

  // Time operations
  advanceDay: (days?: number) => void
  getCurrentSeason: () => Season
  getSeasonProgress: () => { current: Season; daysRemaining: number }

  // Seasonal Market
  getMarketPrices: () => { livestock: number; products: number; feed: number }
  getActiveMarketEvent: () => MarketEvent | null
  getSeasonalAdvice: () => string

  // Crops
  plantCrop: (cropType: CropType) => Promise<boolean>
  harvestCrops: () => { harvested: number; feedGained: number; karmaGained: number; medicineGained: number }
  getCropPlots: () => CropPlot[]
  getPlantableCrops: () => CropType[]

  // Information
  getRanchValue: () => number
  getEventLog: (limit?: number) => RanchState['eventLog']

  // Save/Load
  saveRanch: () => void
  resetRanch: () => void
}

const RanchContext = createContext<RanchContextValue | undefined>(undefined)

export function RanchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RanchState>(defaultRanchState)
  const { balance, spendNeutral, earnNeutral, canAfford } = useKarmaWallet()

  // Load saved state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(RANCH_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState(prev => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      console.error('[RanchContext] Failed to load saved state:', e)
    }
  }, [])

  // Save state when it changes
  const saveRanch = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(RANCH_STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('[RanchContext] Failed to save state:', e)
    }
  }, [state])

  useEffect(() => {
    saveRanch()
  }, [state, saveRanch])

  // Unlock ranch
  const unlockRanch = useCallback(() => {
    setState(prev => ({
      ...prev,
      unlocked: true,
      eventLog: [
        ...prev.eventLog,
        { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: 'Ranch unlocked!', type: 'event' as const },
      ],
    }))
  }, [])

  // Check if ranch is unlocked
  const isRanchUnlocked = useCallback(() => state.unlocked, [state.unlocked])

  // Get current fence config
  const getCurrentFence = useCallback(() => FENCE_TIERS[state.fenceTier], [state.fenceTier])

  // Get next fence config
  const getNextFence = useCallback((): FenceConfig | null => {
    const nextTier = getNextFenceTier(state.fenceTier)
    return nextTier ? FENCE_TIERS[nextTier] : null
  }, [state.fenceTier])

  // Check if can upgrade fence
  const canUpgradeFenceCheck = useCallback((): { canUpgrade: boolean; reason?: string } => {
    if (state.upgradeInProgress) {
      return { canUpgrade: false, reason: `Upgrade in progress (${state.upgradeDaysRemaining} days)` }
    }

    const affordCheck = canAffordFenceUpgrade(state.fenceTier, balance.neutral, balance.good)
    return { canUpgrade: affordCheck.canAfford, reason: affordCheck.reason }
  }, [state.fenceTier, state.upgradeInProgress, state.upgradeDaysRemaining, balance])

  // Upgrade fence
  const upgradeFence = useCallback(async (): Promise<boolean> => {
    const check = canUpgradeFenceCheck()
    if (!check.canUpgrade) return false

    const nextTier = getNextFenceTier(state.fenceTier)
    if (!nextTier) return false

    const config = FENCE_TIERS[nextTier]
    const success = await spendNeutral(config.neutralKarmaCost, `Fence upgrade to ${config.name}`)

    if (success) {
      setState(prev => ({
        ...prev,
        upgradeInProgress: true,
        upgradeDaysRemaining: config.upgradeTime,
        eventLog: [
          ...prev.eventLog,
          { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Started building ${config.name}`, type: 'purchase' as const },
        ],
      }))
    }

    return success
  }, [state.fenceTier, canUpgradeFenceCheck, spendNeutral])

  // Buy livestock
  const buyLivestock = useCallback(async (type: LivestockType, count: number): Promise<boolean> => {
    const config = LIVESTOCK_TYPES[type]
    const totalCost = config.neutralKarmaCost * count
    const currentTotal = getTotalLivestockCount(state.livestock)
    const maxLivestock = FENCE_TIERS[state.fenceTier].maxLivestock

    if (currentTotal + count > maxLivestock) {
      return false // Would exceed capacity
    }

    if (!canAfford('neutral', totalCost)) {
      return false
    }

    const success = await spendNeutral(totalCost, `Bought ${count} ${config.namePlural}`)

    if (success) {
      setState(prev => ({
        ...prev,
        livestock: {
          ...prev.livestock,
          [type]: prev.livestock[type] + count,
        },
        totalLivestockRaised: prev.totalLivestockRaised + count,
        eventLog: [
          ...prev.eventLog,
          { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Bought ${count} ${config.namePlural}`, type: 'purchase' as const },
        ],
      }))
    }

    return success
  }, [state.livestock, state.fenceTier, canAfford, spendNeutral])

  // Sell livestock (price affected by seasonal market)
  const sellLivestock = useCallback(async (type: LivestockType, count: number): Promise<number> => {
    if (state.livestock[type] < count) return 0

    const config = LIVESTOCK_TYPES[type]
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    const priceMod = getEffectivePrice('livestock', season, state.activeMarketEvent)
    const earnings = Math.floor(config.neutralKarmaCost * 0.7 * count * priceMod) // 70% base * seasonal

    await earnNeutral(earnings, `Sold ${count} ${config.namePlural}`)

    setState(prev => ({
      ...prev,
      livestock: {
        ...prev.livestock,
        [type]: prev.livestock[type] - count,
      },
      totalKarmaEarned: prev.totalKarmaEarned + earnings,
      eventLog: [
        ...prev.eventLog,
        { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Sold ${count} ${config.namePlural} for ${earnings}🌮`, type: 'sale' as const },
      ],
    }))

    return earnings
  }, [state.livestock, earnNeutral])

  // Slaughter livestock
  const slaughterLivestock = useCallback(async (type: LivestockType, count: number): Promise<number> => {
    if (state.livestock[type] < count) return 0

    const config = LIVESTOCK_TYPES[type]
    const earnings = config.slaughterValue * count

    await earnNeutral(earnings, `Slaughtered ${count} ${config.namePlural}`)

    setState(prev => ({
      ...prev,
      livestock: {
        ...prev.livestock,
        [type]: prev.livestock[type] - count,
      },
      totalKarmaEarned: prev.totalKarmaEarned + earnings,
      eventLog: [
        ...prev.eventLog,
        { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Slaughtered ${count} ${config.namePlural} for ${earnings}🌮`, type: 'death' as const },
      ],
    }))

    return earnings
  }, [state.livestock, earnNeutral])

  // Get livestock config
  const getLivestockConfig = useCallback((type: LivestockType) => LIVESTOCK_TYPES[type], [])

  // Get total livestock
  const getTotalLivestock = useCallback(() => getTotalLivestockCount(state.livestock), [state.livestock])

  // Get max livestock
  const getMaxLivestock = useCallback(() => FENCE_TIERS[state.fenceTier].maxLivestock, [state.fenceTier])

  // Buy feed (price affected by seasonal market)
  const buyFeed = useCallback(async (type: FeedType, units: number): Promise<boolean> => {
    const config = FEED_TYPES[type]
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    const priceMod = getEffectivePrice('feed', season, state.activeMarketEvent)
    const totalCost = Math.ceil(config.neutralKarmaCost * Math.ceil(units / config.unitsProvided) * priceMod)

    if (!canAfford('neutral', totalCost)) return false

    const success = await spendNeutral(totalCost, `Bought ${units} units of ${config.name}`)

    if (success) {
      setState(prev => ({
        ...prev,
        feedStock: prev.feedStock + units,
        feedType: type,
        eventLog: [
          ...prev.eventLog,
          { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Bought ${units} ${config.name}`, type: 'purchase' as const },
        ],
      }))
    }

    return success
  }, [canAfford, spendNeutral])

  // Set feed type
  const setFeedType = useCallback((type: FeedType) => {
    setState(prev => ({ ...prev, feedType: type }))
  }, [])

  // Get daily feed need
  const getDailyFeedNeed = useCallback(() => {
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    return calculateDailyFeedNeed(state.livestock, season)
  }, [state.livestock, state.gameDay])

  // Get daily production
  const getDailyProduction = useCallback(() => {
    return calculateDailyProduction(state.livestock)
  }, [state.livestock])

  // Sell products (price affected by seasonal market)
  const sellProducts = useCallback(async (productName: string, amount: number): Promise<number> => {
    const currentAmount = state.products[productName] || 0
    if (currentAmount < amount) return 0

    // Find product value from livestock configs
    let valuePerUnit = 1
    for (const config of Object.values(LIVESTOCK_TYPES)) {
      const product = config.produces.find(p => p.name === productName)
      if (product) {
        valuePerUnit = product.karmaValue
        break
      }
    }

    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    const priceMod = getEffectivePrice('products', season, state.activeMarketEvent)
    const earnings = Math.floor(valuePerUnit * amount * priceMod)
    await earnNeutral(earnings, `Sold ${amount} ${productName}`)

    setState(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [productName]: (prev.products[productName] || 0) - amount,
      },
      totalProductsSold: prev.totalProductsSold + amount,
      totalKarmaEarned: prev.totalKarmaEarned + earnings,
      eventLog: [
        ...prev.eventLog,
        { day: prev.gameDay, season: getCurrentSeason(getDayOfYear(prev.gameDay)), event: `Sold ${amount} ${productName} for ${earnings}🌮`, type: 'sale' as const },
      ],
    }))

    return earnings
  }, [state.products, earnNeutral])

  // Advance day
  const advanceDay = useCallback((days: number = 1) => {
    setState(prev => {
      const newState = { ...prev }
      const newEvents: typeof prev.eventLog = []

      for (let d = 0; d < days; d++) {
        newState.gameDay++
        const dayOfYear = getDayOfYear(newState.gameDay)
        const season = getCurrentSeason(dayOfYear)
        const seasonConfig = SEASONS[season]
        const fenceConfig = FENCE_TIERS[newState.fenceTier]
        const feedConfig = FEED_TYPES[newState.feedType]

        // Process upgrade
        if (newState.upgradeInProgress) {
          newState.upgradeDaysRemaining--
          if (newState.upgradeDaysRemaining <= 0) {
            newState.upgradeInProgress = false
            newState.fenceTier = getNextFenceTier(newState.fenceTier) || newState.fenceTier
            newEvents.push({
              day: newState.gameDay,
              season,
              event: `${FENCE_TIERS[newState.fenceTier].name} completed!`,
              type: 'event' as const,
            })
          }
        }

        // Consume feed
        const feedNeeded = calculateDailyFeedNeed(newState.livestock, season)
        if (newState.feedStock >= feedNeeded) {
          newState.feedStock -= feedNeeded
        } else {
          // Starvation - reduce health
          const shortage = feedNeeded - newState.feedStock
          newState.feedStock = 0
          for (const type of Object.keys(newState.livestockHealth) as LivestockType[]) {
            if (newState.livestock[type] > 0) {
              newState.livestockHealth[type] = Math.max(0, newState.livestockHealth[type] - 10)
              // Animals may die from starvation
              if (newState.livestockHealth[type] <= 0) {
                const deaths = Math.ceil(newState.livestock[type] * 0.1)
                newState.livestock[type] -= deaths
                newEvents.push({
                  day: newState.gameDay,
                  season,
                  event: `${deaths} ${LIVESTOCK_TYPES[type].namePlural} died from starvation`,
                  type: 'death' as const,
                })
              }
            }
          }
        }

        // Recover health if well-fed
        if (newState.feedStock > feedNeeded * 2) {
          for (const type of Object.keys(newState.livestockHealth) as LivestockType[]) {
            newState.livestockHealth[type] = Math.min(100, newState.livestockHealth[type] + 5 * feedConfig.healthBonus)
          }
        }

        // Production
        const production = calculateDailyProduction(newState.livestock)
        for (const [product, { amount }] of Object.entries(production)) {
          newState.products[product] = (newState.products[product] || 0) + amount
        }

        // Check for market events at season change
        if (dayOfYear % 90 === 1) {
          const newSeason = getCurrentSeason(dayOfYear)
          if (newState.lastSeasonChecked !== newSeason) {
            newState.lastSeasonChecked = newSeason
            // Clear expired market event
            if (newState.activeMarketEvent && newState.gameDay >= newState.marketEventEndDay) {
              newEvents.push({
                day: newState.gameDay, season: newSeason,
                event: `Market returns to normal: ${newState.activeMarketEvent.name} ends.`,
                type: 'event' as const,
              })
              newState.activeMarketEvent = null
              newState.marketEventEndDay = 0
            }
            // Roll for new market event
            if (!newState.activeMarketEvent) {
              const marketEvent = rollMarketEvent(newSeason)
              if (marketEvent) {
                newState.activeMarketEvent = marketEvent
                newState.marketEventEndDay = newState.gameDay + marketEvent.duration
                newEvents.push({
                  day: newState.gameDay, season: newSeason,
                  event: `Market news: ${marketEvent.name}! ${marketEvent.description}`,
                  type: 'event' as const,
                })
              }
            }
          }
        }

        // Expire active market event if duration exceeded
        if (newState.activeMarketEvent && newState.gameDay >= newState.marketEventEndDay) {
          newEvents.push({
            day: newState.gameDay, season,
            event: `${newState.activeMarketEvent.name} has ended.`,
            type: 'event' as const,
          })
          newState.activeMarketEvent = null
          newState.marketEventEndDay = 0
        }

        // Process crop growth — check for harvestable crops
        // (Auto-harvest not done here; player must manually harvest)

        // Check for breeding (once per season change)
        if (dayOfYear % 90 === 1) { // First day of new season
          for (const [type, count] of Object.entries(newState.livestock)) {
            if (count >= 2) { // Need at least 2 to breed
              const config = LIVESTOCK_TYPES[type as LivestockType]
              const birthChance = (fenceConfig.birthRateMultiplier * seasonConfig.birthMultiplier * feedConfig.birthBonus) / 4
              if (Math.random() < birthChance) {
                const [min, max] = config.offspringRange
                const births = Math.floor(Math.random() * (max - min + 1)) + min
                const maxCapacity = fenceConfig.maxLivestock - getTotalLivestockCount(newState.livestock)
                const actualBirths = Math.min(births, maxCapacity)
                if (actualBirths > 0) {
                  newState.livestock[type as LivestockType] += actualBirths
                  newState.totalLivestockRaised += actualBirths
                  newEvents.push({
                    day: newState.gameDay,
                    season,
                    event: `${actualBirths} ${config.namePlural} born!`,
                    type: 'birth' as const,
                  })
                }
              }
            }
          }
        }

        // Random events (once per season)
        if (dayOfYear % 90 === 45) { // Mid-season
          for (const event of RANCH_EVENTS) {
            if (event.seasonRestriction && !event.seasonRestriction.includes(season)) continue
            if (Math.random() > event.chance) continue

            // Check predator resistance
            if (event.effect.livestockLoss && Math.random() < fenceConfig.predatorResistance) {
              continue // Fence prevented the event
            }

            // Apply event
            if (event.effect.livestockLoss) {
              const { type, count, amount } = event.effect.livestockLoss
              if (type === 'any') {
                for (const lt of Object.keys(newState.livestock) as LivestockType[]) {
                  if (newState.livestock[lt] > 0) {
                    const loss = count === 'percentage'
                      ? Math.ceil(newState.livestock[lt] * amount / 100)
                      : Math.min(amount, newState.livestock[lt])
                    newState.livestock[lt] -= loss
                  }
                }
              } else {
                const loss = count === 'percentage'
                  ? Math.ceil(newState.livestock[type] * amount / 100)
                  : Math.min(amount, newState.livestock[type])
                newState.livestock[type] -= loss
              }
            }

            if (event.effect.livestockGain) {
              const { type, count } = event.effect.livestockGain
              const maxCapacity = fenceConfig.maxLivestock - getTotalLivestockCount(newState.livestock)
              newState.livestock[type] += Math.min(count, maxCapacity)
            }

            newEvents.push({
              day: newState.gameDay,
              season,
              event: event.effect.message,
              type: 'event' as const,
            })

            break // Only one event per check
          }
        }
      }

      return {
        ...newState,
        lastProcessedDay: newState.gameDay,
        eventLog: [...prev.eventLog, ...newEvents].slice(-50), // Keep last 50 events
      }
    })
  }, [])

  // Get current season
  const getCurrentSeasonValue = useCallback((): Season => {
    return getCurrentSeason(getDayOfYear(state.gameDay))
  }, [state.gameDay])

  // Get season progress
  const getSeasonProgress = useCallback(() => {
    const dayOfYear = getDayOfYear(state.gameDay)
    const season = getCurrentSeason(dayOfYear)
    const seasonStart = season === 'spring' ? 1 : season === 'summer' ? 91 : season === 'autumn' ? 181 : 271
    const daysRemaining = 90 - (dayOfYear - seasonStart)
    return { current: season, daysRemaining }
  }, [state.gameDay])

  // Get ranch value
  const getRanchValue = useCallback(() => {
    let value = 0

    // Fence value
    value += FENCE_TIERS[state.fenceTier].neutralKarmaCost

    // Livestock value
    for (const [type, count] of Object.entries(state.livestock)) {
      value += LIVESTOCK_TYPES[type as LivestockType].neutralKarmaCost * count
    }

    // Products value
    for (const [product, amount] of Object.entries(state.products)) {
      for (const config of Object.values(LIVESTOCK_TYPES)) {
        const prod = config.produces.find(p => p.name === product)
        if (prod) {
          value += prod.karmaValue * amount
          break
        }
      }
    }

    return value
  }, [state.fenceTier, state.livestock, state.products])

  // Get event log
  const getEventLog = useCallback((limit?: number) => {
    return limit ? state.eventLog.slice(-limit) : state.eventLog
  }, [state.eventLog])

  // Get current market prices (seasonal + event)
  const getMarketPrices = useCallback(() => {
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    return {
      livestock: getEffectivePrice('livestock', season, state.activeMarketEvent),
      products: getEffectivePrice('products', season, state.activeMarketEvent),
      feed: getEffectivePrice('feed', season, state.activeMarketEvent),
    }
  }, [state.gameDay, state.activeMarketEvent])

  // Get active market event
  const getActiveMarketEvent = useCallback(() => state.activeMarketEvent, [state.activeMarketEvent])

  // Get seasonal market advice
  const getSeasonalAdviceValue = useCallback(() => {
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    return getSeasonalAdvice(season)
  }, [state.gameDay])

  // Plant a crop
  const plantCrop = useCallback(async (cropType: CropType): Promise<boolean> => {
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    if (!canPlantCrop(cropType, season)) return false

    const config = CROPS[cropType]
    const currentPlots = state.cropPlots.filter(p => !p.harvested).length
    if (currentPlots >= config.maxPlots) return false

    if (!canAfford('neutral', config.plantCost)) return false
    const success = await spendNeutral(config.plantCost, `Planted ${config.name}`)
    if (!success) return false

    setState(prev => ({
      ...prev,
      cropPlots: [
        ...prev.cropPlots,
        {
          cropType,
          plantedDay: prev.gameDay,
          harvestDay: prev.gameDay + config.growthDays,
          harvested: false,
        },
      ],
      eventLog: [
        ...prev.eventLog,
        {
          day: prev.gameDay,
          season: getCurrentSeason(getDayOfYear(prev.gameDay)),
          event: `Planted ${config.emoji} ${config.name}`,
          type: 'purchase' as const,
        },
      ],
    }))

    return true
  }, [state.gameDay, state.cropPlots, canAfford, spendNeutral])

  // Harvest all ready crops
  const harvestCrops = useCallback(() => {
    let harvested = 0
    let feedGained = 0
    let karmaGained = 0
    let medicineGained = 0

    setState(prev => {
      const newPlots = [...prev.cropPlots]
      const newEvents: typeof prev.eventLog = []

      for (let i = 0; i < newPlots.length; i++) {
        if (!newPlots[i].harvested && prev.gameDay >= newPlots[i].harvestDay) {
          newPlots[i] = { ...newPlots[i], harvested: true }
          const config = CROPS[newPlots[i].cropType]
          harvested++

          if (config.type === 'herbs') {
            medicineGained += 1
          } else {
            feedGained += config.feedConversion
          }
          karmaGained += config.harvestValue

          newEvents.push({
            day: prev.gameDay,
            season: getCurrentSeason(getDayOfYear(prev.gameDay)),
            event: `Harvested ${config.emoji} ${config.name}: +${config.feedConversion > 0 ? config.feedConversion + ' feed' : '1 medicine'}, +${config.harvestValue} karma`,
            type: 'production' as const,
          })
        }
      }

      return {
        ...prev,
        cropPlots: newPlots.filter(p => !p.harvested), // Remove harvested plots
        feedStock: prev.feedStock + feedGained,
        medicine: (prev as unknown as { medicine?: number }).medicine ?? 0, // Ranch doesn't track medicine directly
        eventLog: [...prev.eventLog, ...newEvents].slice(-50),
      }
    })

    // Karma earning is done outside setState
    if (karmaGained > 0) {
      earnNeutral(karmaGained, `Crop harvest: ${harvested} plots`)
    }

    return { harvested, feedGained, karmaGained, medicineGained }
  }, [earnNeutral])

  // Get crop plots
  const getCropPlots = useCallback(() => state.cropPlots, [state.cropPlots])

  // Get plantable crop types for current season
  const getPlantableCrops = useCallback((): CropType[] => {
    const season = getCurrentSeason(getDayOfYear(state.gameDay))
    return (Object.keys(CROPS) as CropType[]).filter(ct => canPlantCrop(ct, season))
  }, [state.gameDay])

  // Reset ranch
  const resetRanch = useCallback(() => {
    setState(defaultRanchState)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RANCH_STORAGE_KEY)
    }
  }, [])

  const contextValue: RanchContextValue = {
    state,
    unlockRanch,
    isRanchUnlocked,
    getCurrentFence,
    getNextFence,
    canUpgradeFence: canUpgradeFenceCheck,
    upgradeFence,
    buyLivestock,
    sellLivestock,
    slaughterLivestock,
    getLivestockConfig,
    getTotalLivestock,
    getMaxLivestock,
    buyFeed,
    setFeedType,
    getDailyFeedNeed,
    getDailyProduction,
    sellProducts,
    advanceDay,
    getCurrentSeason: getCurrentSeasonValue,
    getSeasonProgress,
    getMarketPrices,
    getActiveMarketEvent,
    getSeasonalAdvice: getSeasonalAdviceValue,
    plantCrop,
    harvestCrops,
    getCropPlots,
    getPlantableCrops,
    getRanchValue,
    getEventLog,
    saveRanch,
    resetRanch,
  }

  return (
    <RanchContext.Provider value={contextValue}>
      {children}
    </RanchContext.Provider>
  )
}

export function useRanch() {
  const context = useContext(RanchContext)
  if (!context) {
    throw new Error('useRanch must be used within a RanchProvider')
  }
  return context
}

export type { RanchContextValue }
