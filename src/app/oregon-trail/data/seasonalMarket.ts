/**
 * Seasonal Market Economy
 *
 * Lords of the Realm II-inspired seasonal price fluctuation system.
 * Prices for livestock and products change based on:
 *   - Current season (supply/demand shifts)
 *   - Random market events (drought, surplus, gold rush fever)
 *   - Time on ranch (early days have premium "newcomer" pricing)
 *
 * This creates a buy-low-sell-high dynamic where smart ranchers
 * stockpile in cheap seasons and sell in expensive ones.
 */

import type { Season } from './ranchConfig'
import type { LivestockType, FeedType } from './ranchConfig'

// Price multiplier per season for each product category
export interface SeasonalPriceTable {
  livestock: Record<Season, number>   // Buy/sell price multiplier for animals
  products: Record<Season, number>    // Sell price multiplier for milk/eggs/cheese
  feed: Record<Season, number>        // Buy price multiplier for feed
}

export const SEASONAL_PRICES: SeasonalPriceTable = {
  livestock: {
    spring: 1.2,   // High demand — breeding season, everyone wants stock
    summer: 1.0,   // Normal prices
    autumn: 0.8,   // Ranchers sell before winter feeding costs
    winter: 0.7,   // Lowest prices — few buyers, expensive to feed
  },
  products: {
    spring: 0.9,   // Surplus from spring production
    summer: 1.0,   // Normal
    autumn: 1.3,   // Harvest demand, preparing for winter
    winter: 1.5,   // Scarcity premium — fresh milk/eggs rare in winter
  },
  feed: {
    spring: 0.9,   // Abundant new growth
    summer: 0.8,   // Peak growing season — cheapest feed
    autumn: 1.1,   // Start stockpiling for winter
    winter: 1.6,   // Scarce — hay barns run low, prices spike
  },
}

// Random market events that temporarily modify prices
export interface MarketEvent {
  id: string
  name: string
  description: string
  duration: number        // Days the event lasts
  priceModifiers: {
    livestock?: number    // Multiplier applied ON TOP of seasonal
    products?: number
    feed?: number
  }
  chance: number          // Per-season chance (0-1)
  seasonRestriction?: Season[]
}

export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'gold_rush_fever',
    name: 'Gold Rush Fever',
    description: 'Prospectors flood the area! Food and products fetch premium prices.',
    duration: 30,
    priceModifiers: { products: 1.5, feed: 1.3 },
    chance: 0.12,
    seasonRestriction: ['spring', 'summer'],
  },
  {
    id: 'drought',
    name: 'Drought',
    description: 'Dry conditions drive up feed costs and reduce livestock value.',
    duration: 45,
    priceModifiers: { feed: 1.8, livestock: 0.7 },
    chance: 0.08,
    seasonRestriction: ['summer'],
  },
  {
    id: 'bumper_harvest',
    name: 'Bumper Harvest',
    description: 'Excellent growing conditions! Feed is cheap but product prices drop.',
    duration: 30,
    priceModifiers: { feed: 0.5, products: 0.8 },
    chance: 0.1,
    seasonRestriction: ['autumn'],
  },
  {
    id: 'cattle_drive',
    name: 'Cattle Drive',
    description: 'A large cattle drive passes through, flooding the market with livestock.',
    duration: 15,
    priceModifiers: { livestock: 0.6 },
    chance: 0.1,
    seasonRestriction: ['spring', 'autumn'],
  },
  {
    id: 'winter_shortage',
    name: 'Winter Shortage',
    description: 'Harsh winter depletes reserves. Everything costs more.',
    duration: 30,
    priceModifiers: { feed: 2.0, products: 1.8, livestock: 1.3 },
    chance: 0.15,
    seasonRestriction: ['winter'],
  },
  {
    id: 'railroad_coming',
    name: 'Railroad Coming',
    description: 'News of a railroad spur drives up land and livestock values.',
    duration: 60,
    priceModifiers: { livestock: 1.4, products: 1.2 },
    chance: 0.06,
  },
  {
    id: 'disease_scare',
    name: 'Disease Scare',
    description: 'Rumors of livestock disease tank animal prices but boost medicine demand.',
    duration: 20,
    priceModifiers: { livestock: 0.5 },
    chance: 0.08,
  },
]

// Crop system — seasonal planting and harvesting
export type CropType = 'wheat' | 'corn' | 'potatoes' | 'herbs'

export interface CropConfig {
  type: CropType
  name: string
  emoji: string
  plantSeasons: Season[]       // When it CAN be planted
  growthDays: number           // Days from planting to harvest
  harvestValue: number         // Base karma value per plot
  feedConversion: number       // How many feed units per harvest
  plantCost: number            // Karma cost to plant one plot
  maxPlots: number             // How many can be planted at once
  description: string
}

export const CROPS: Record<CropType, CropConfig> = {
  wheat: {
    type: 'wheat',
    name: 'Wheat',
    emoji: '🌾',
    plantSeasons: ['spring'],
    growthDays: 60,
    harvestValue: 12,
    feedConversion: 8,
    plantCost: 5,
    maxPlots: 10,
    description: 'Plant in spring, harvest in summer. Converts to quality feed.',
  },
  corn: {
    type: 'corn',
    name: 'Corn',
    emoji: '🌽',
    plantSeasons: ['spring', 'summer'],
    growthDays: 75,
    harvestValue: 15,
    feedConversion: 10,
    plantCost: 8,
    maxPlots: 8,
    description: 'Versatile crop. Higher yield but longer growth time.',
  },
  potatoes: {
    type: 'potatoes',
    name: 'Potatoes',
    emoji: '🥔',
    plantSeasons: ['spring', 'autumn'],
    growthDays: 45,
    harvestValue: 8,
    feedConversion: 5,
    plantCost: 3,
    maxPlots: 12,
    description: 'Quick-growing, reliable. Can plant in spring or autumn.',
  },
  herbs: {
    type: 'herbs',
    name: 'Medicinal Herbs',
    emoji: '🌿',
    plantSeasons: ['spring', 'summer'],
    growthDays: 30,
    harvestValue: 20,
    feedConversion: 0,
    plantCost: 10,
    maxPlots: 4,
    description: 'Valuable but limited. Converts to medicine, not feed.',
  },
}

// Crop plot state
export interface CropPlot {
  cropType: CropType
  plantedDay: number        // Game day when planted
  harvestDay: number        // Game day when ready to harvest
  harvested: boolean
}

/**
 * Get the effective price multiplier for a category, combining
 * seasonal baseline and any active market event.
 */
export function getEffectivePrice(
  category: 'livestock' | 'products' | 'feed',
  season: Season,
  activeEvent: MarketEvent | null
): number {
  const base = SEASONAL_PRICES[category][season]
  const eventMod = activeEvent?.priceModifiers[category] ?? 1.0
  return Math.round(base * eventMod * 100) / 100
}

/**
 * Check if a crop can be planted in the current season.
 */
export function canPlantCrop(cropType: CropType, season: Season): boolean {
  return CROPS[cropType].plantSeasons.includes(season)
}

/**
 * Check if a crop plot is ready to harvest.
 */
export function isCropReady(plot: CropPlot, currentDay: number): boolean {
  return !plot.harvested && currentDay >= plot.harvestDay
}

/**
 * Roll for a market event at season change.
 */
export function rollMarketEvent(season: Season): MarketEvent | null {
  const eligible = MARKET_EVENTS.filter(
    e => !e.seasonRestriction || e.seasonRestriction.includes(season)
  )

  for (const event of eligible) {
    if (Math.random() < event.chance) {
      return event
    }
  }

  return null
}

/**
 * Get seasonal advice for the player — hints about market timing.
 */
export function getSeasonalAdvice(season: Season): string {
  switch (season) {
    case 'spring':
      return 'Livestock prices are high — good time to sell animals, bad time to buy. Plant crops now for summer harvest.'
    case 'summer':
      return 'Feed is cheapest now — stock up! Product prices are fair. Last chance to plant corn.'
    case 'autumn':
      return 'Product prices rising — sell milk, eggs, cheese. Livestock prices dropping — buy now for winter breeding.'
    case 'winter':
      return 'Everything costs more. Survive on stockpiled feed and sell products at premium winter prices.'
  }
}
