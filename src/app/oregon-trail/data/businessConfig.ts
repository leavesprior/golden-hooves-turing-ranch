/**
 * Gold Country Karma-Gated Business System
 *
 * Upon reaching Gold Country, Good Karma (🍪) gates access to business tiers.
 * Higher tiers unlock better businesses with better returns.
 * Good karma also provides reputation-based price discounts.
 *
 * Tier System:
 *   Tier 1 - Street Vendor   (0🍪)   Pan for gold, sell foraged goods
 *   Tier 2 - Market Stall    (50🍪)  Buy/sell trading post
 *   Tier 3 - General Store   (100🍪) Full storefront with employee
 *   Tier 4 - Saloon          (200🍪) Entertainment venue with gambling
 *   Tier 5 - Hotel & Trading (500🍪) Premium lodging + trade routes
 */

export type BusinessTier = 0 | 1 | 2 | 3 | 4 | 5

export interface BusinessConfig {
  tier: BusinessTier
  name: string
  description: string
  goodKarmaRequired: number   // minimum 🍪 to unlock (not spent, just checked)
  neutralKarmaCost: number    // 🌮 to purchase/build
  buildDays: number           // days to construct
  dailyIncomeRange: [number, number]  // daily operating income
  dailyOperatingCost: number  // staff/upkeep costs
  priceDiscount: number       // percentage reduction on all purchases
  specialPerks: string[]      // unique benefits
  emoji: string
}

export const BUSINESSES: Record<BusinessTier, BusinessConfig> = {
  0: {
    tier: 0,
    name: 'No Business',
    description: 'Just arrived in Gold Country. Pan for gold at the creek.',
    goodKarmaRequired: 0,
    neutralKarmaCost: 0,
    buildDays: 0,
    dailyIncomeRange: [0, 0],
    dailyOperatingCost: 0,
    priceDiscount: 0,
    specialPerks: [],
    emoji: '🏕️',
  },
  1: {
    tier: 1,
    name: 'Street Vendor',
    description: 'Pan for gold at the creek and sell foraged goods to travelers.',
    goodKarmaRequired: 0,
    neutralKarmaCost: 25,
    buildDays: 1,
    dailyIncomeRange: [5, 20],
    dailyOperatingCost: 0,
    priceDiscount: 0,
    specialPerks: ['Gold panning minigame', 'Sell foraged goods'],
    emoji: '🪙',
  },
  2: {
    tier: 2,
    name: 'Market Stall',
    description: 'A small trading post. Buy low, sell high between locations.',
    goodKarmaRequired: 50,
    neutralKarmaCost: 150,
    buildDays: 3,
    dailyIncomeRange: [15, 40],
    dailyOperatingCost: 0,
    priceDiscount: 5,
    specialPerks: ['Buy/sell trading', '5% shop discount'],
    emoji: '🏪',
  },
  3: {
    tier: 3,
    name: 'General Store',
    description: 'A full storefront. Hire an employee and stock goods for travelers.',
    goodKarmaRequired: 100,
    neutralKarmaCost: 400,
    buildDays: 7,
    dailyIncomeRange: [30, 80],
    dailyOperatingCost: 10,
    priceDiscount: 10,
    specialPerks: ['Hire 1 employee', 'Stock and sell goods', '10% shop discount'],
    emoji: '🏬',
  },
  4: {
    tier: 4,
    name: 'Saloon',
    description: 'An entertainment venue with gambling and music. The heart of any frontier town.',
    goodKarmaRequired: 200,
    neutralKarmaCost: 800,
    buildDays: 14,
    dailyIncomeRange: [50, 150],
    dailyOperatingCost: 20,
    priceDiscount: 15,
    specialPerks: ['Gambling mini-games', 'Hire bartender + musician', '15% shop discount', 'Special NPC dialogue'],
    emoji: '🍺',
  },
  5: {
    tier: 5,
    name: 'Hotel & Trading Company',
    description: 'Premium lodging for travelers and trading routes with other settlements. The pinnacle of frontier enterprise.',
    goodKarmaRequired: 500,
    neutralKarmaCost: 2000,
    buildDays: 30,
    dailyIncomeRange: [100, 300],
    dailyOperatingCost: 40,
    priceDiscount: 20,
    specialPerks: ['Premium lodging', 'Trade routes', 'Full staff', '20% shop discount', 'Land deals', 'Exclusive inventory'],
    emoji: '🏨',
  },
}

/**
 * Calculate total price discount based on business tier and current good karma.
 *
 * Formula:
 *   baseDiscount = business.priceDiscount (from tier, 0-20%)
 *   karmaBonus = min(10, floor(goodKarma / 50)) (up to 10% extra)
 *   totalDiscount = min(30, baseDiscount + karmaBonus)
 */
export function getBusinessPriceDiscount(businessTier: BusinessTier, goodKarma: number): number {
  const business = BUSINESSES[businessTier]
  const baseDiscount = business.priceDiscount
  const karmaBonus = Math.min(10, Math.floor(goodKarma / 50))
  return Math.min(30, baseDiscount + karmaBonus)
}

/**
 * Check if a business tier can be unlocked.
 */
export function canUnlockBusiness(
  targetTier: BusinessTier,
  currentTier: BusinessTier,
  goodKarma: number,
  neutralKarma: number
): { canUnlock: boolean; reason?: string } {
  if (targetTier <= currentTier) {
    return { canUnlock: false, reason: 'Already at this tier or higher' }
  }

  if (targetTier !== currentTier + 1) {
    return { canUnlock: false, reason: 'Must upgrade one tier at a time' }
  }

  const config = BUSINESSES[targetTier]

  if (goodKarma < config.goodKarmaRequired) {
    return {
      canUnlock: false,
      reason: `Need ${config.goodKarmaRequired}🍪 reputation (have ${goodKarma}🍪)`
    }
  }

  if (neutralKarma < config.neutralKarmaCost) {
    return {
      canUnlock: false,
      reason: `Need ${config.neutralKarmaCost}🌮 to build (have ${neutralKarma}🌮)`
    }
  }

  return { canUnlock: true }
}

/**
 * Get the next business tier config, or null if at max.
 */
export function getNextBusinessTier(currentTier: BusinessTier): BusinessConfig | null {
  if (currentTier >= 5) return null
  return BUSINESSES[(currentTier + 1) as BusinessTier]
}

/**
 * Calculate daily business income (random within range).
 */
export function rollDailyBusinessIncome(businessTier: BusinessTier): number {
  const config = BUSINESSES[businessTier]
  if (config.dailyIncomeRange[0] === 0 && config.dailyIncomeRange[1] === 0) return 0
  const [min, max] = config.dailyIncomeRange
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Calculate net daily business income (income - operating costs).
 */
export function getDailyNetIncome(businessTier: BusinessTier, grossIncome: number): number {
  const config = BUSINESSES[businessTier]
  return Math.max(0, grossIncome - config.dailyOperatingCost)
}

/**
 * Get the value of a business for net worth calculation.
 */
export function getBusinessValue(businessTier: BusinessTier): number {
  let totalValue = 0
  for (let i = 1; i <= businessTier; i++) {
    totalValue += BUSINESSES[i as BusinessTier].neutralKarmaCost * 0.7
  }
  return Math.floor(totalValue)
}
