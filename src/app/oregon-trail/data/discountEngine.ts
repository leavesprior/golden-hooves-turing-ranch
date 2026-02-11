/**
 * BOBR Discount Engine - Enhanced with Unified Tiers & Occupation Multiplier
 *
 * Tier System (per plan):
 *   Bronze:   3 clues            -> 8% base  (max 12% w/ multiplier)
 *   Silver:   5 clues + 1 case   -> 12% base (max 17% w/ multiplier)
 *   Gold:     7 clues + 2 cases  -> 16% base (max 22% w/ multiplier)
 *   Platinum: 10 clues + all cases + outlaw caught -> 20% base (max 27% w/ multiplier)
 *
 * Code format: TOBIAS-{TIER}{DISCOUNT}-{TIMESTAMP}-{SIGNATURE}
 * Example: TOBIAS-G16-1705708800-A3F2 (Gold tier, 16% base)
 */

// Updated discount tiers matching the plan
export type DiscountTier = 'welcome' | 'bronze' | 'silver' | 'gold' | 'platinum'

export interface TierInfo {
  minClues: number
  minCasesSolved: number
  requiresOutlawCaught: boolean
  discount: number        // Base discount percentage
  maxDiscount: number     // Maximum with all multipliers
  validDays: number
  prefix: string
  displayName: string
  badge: string
}

export const DISCOUNT_TIERS: Record<DiscountTier, TierInfo> = {
  welcome: {
    minClues: 0,
    minCasesSolved: 0,
    requiresOutlawCaught: false,
    discount: 5,
    maxDiscount: 5,
    validDays: 14,
    prefix: 'W',
    displayName: 'Welcome Prospector',
    badge: '\u{1F331}'
  },
  bronze: {
    minClues: 3,
    minCasesSolved: 0,
    requiresOutlawCaught: false,
    discount: 8,
    maxDiscount: 12,
    validDays: 30,
    prefix: 'B',
    displayName: 'Bronze Deputy',
    badge: '\u{1F949}'
  },
  silver: {
    minClues: 5,
    minCasesSolved: 1,
    requiresOutlawCaught: false,
    discount: 12,
    maxDiscount: 17,
    validDays: 45,
    prefix: 'S',
    displayName: 'Silver Detective',
    badge: '\u{1F948}'
  },
  gold: {
    minClues: 7,
    minCasesSolved: 2,
    requiresOutlawCaught: false,
    discount: 16,
    maxDiscount: 22,
    validDays: 60,
    prefix: 'G',
    displayName: 'Gold Inspector',
    badge: '\u{1F947}'
  },
  platinum: {
    minClues: 10,
    minCasesSolved: 3,
    requiresOutlawCaught: true,
    discount: 20,
    maxDiscount: 27,
    validDays: 90,
    prefix: 'P',
    displayName: 'Platinum Chief',
    badge: '\u{1F48E}'
  }
}

// D&D-style alignment positions with karma multipliers
export type AlignmentPosition =
  | 'lawful_good'
  | 'neutral_good'
  | 'chaotic_good'
  | 'lawful_neutral'
  | 'true_neutral'
  | 'chaotic_neutral'
  | 'lawful_evil'
  | 'neutral_evil'
  | 'chaotic_evil'

export const KARMA_MULTIPLIERS: Record<AlignmentPosition, number> = {
  lawful_good: 1.5,
  neutral_good: 1.3,
  chaotic_good: 1.2,
  lawful_neutral: 1.1,
  true_neutral: 1.0,
  chaotic_neutral: 0.9,
  lawful_evil: 0.8,
  neutral_evil: 0.6,
  chaotic_evil: 0.5
}

export const ALIGNMENT_DISPLAY_NAMES: Record<AlignmentPosition, string> = {
  lawful_good: 'Lawful Good',
  neutral_good: 'Neutral Good',
  chaotic_good: 'Chaotic Good',
  lawful_neutral: 'Lawful Neutral',
  true_neutral: 'True Neutral',
  chaotic_neutral: 'Chaotic Neutral',
  lawful_evil: 'Lawful Evil',
  neutral_evil: 'Neutral Evil',
  chaotic_evil: 'Chaotic Evil'
}

// Occupation-based discount multipliers (Oregon Trail difficulty scaling)
export type OccupationType =
  | 'banker'
  | 'carpenter'
  | 'farmer'
  | 'doctor'
  | 'merchant'
  | 'blacksmith'
  | 'teacher'
  | 'saddlemaker'

export interface OccupationDiscountInfo {
  discountMultiplier: number
  difficultyLabel: string
  flavorText: string
}

export const OCCUPATION_DISCOUNT_MULTIPLIERS: Record<OccupationType, OccupationDiscountInfo> = {
  banker: {
    discountMultiplier: 1.0,
    difficultyLabel: 'Easy',
    flavorText: 'The banker\'s wealth makes the journey easy. Standard reward.'
  },
  merchant: {
    discountMultiplier: 1.1,
    difficultyLabel: 'Moderate',
    flavorText: 'The merchant\'s trade skills earn a modest bonus.'
  },
  doctor: {
    discountMultiplier: 1.2,
    difficultyLabel: 'Moderate',
    flavorText: 'The doctor\'s care for others is rewarded.'
  },
  carpenter: {
    discountMultiplier: 1.3,
    difficultyLabel: 'Hard',
    flavorText: 'The carpenter builds their fortune the hard way.'
  },
  teacher: {
    discountMultiplier: 1.3,
    difficultyLabel: 'Hard',
    flavorText: 'The teacher\'s knowledge enriches the journey.'
  },
  blacksmith: {
    discountMultiplier: 1.35,
    difficultyLabel: 'Hard',
    flavorText: 'The blacksmith forges their own destiny.'
  },
  saddlemaker: {
    discountMultiplier: 1.35,
    difficultyLabel: 'Hard',
    flavorText: 'The saddlemaker\'s grit is rewarded in gold.'
  },
  farmer: {
    discountMultiplier: 1.5,
    difficultyLabel: 'Expert',
    flavorText: 'The farmer\'s life is hard, but fortune favors the bold.'
  }
}

// Client-side signature key (real validation happens server-side)
const CLIENT_SECRET = 'bobr-gold-country-2026'

/**
 * Simple hash function for browser (sufficient for coupon codes)
 * Real validation happens on the server with proper HMAC
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().slice(0, 4).padStart(4, '0')
}

export interface GeneratedCode {
  code: string
  tier: DiscountTier
  discount: number
  validDays: number
  expiresAt: string
  cluesRequired: number
  cluesCollected: number
  casesSolved: number
  outlawCaught: boolean
  generatedAt: string
}

export interface KarmaAdjustedCode extends GeneratedCode {
  baseDiscount: number
  karmaMultiplier: number
  occupationMultiplier: number
  occupationName: string
  finalDiscount: number
  karmaPosition: AlignmentPosition
  karmaMessage: string | null
  occupationMessage: string | null
}

export interface ParsedCode {
  valid: boolean
  tier?: DiscountTier
  discount?: number
  timestamp?: number
  signature?: string
  expiresAt?: string
  isExpired?: boolean
  error?: string
  message?: string
}

/**
 * Get qualifying tier based on clues, cases solved, and outlaw status.
 * The 'welcome' tier is special — awarded for early engagement (play time or location visits).
 * Pass locationsVisited >= 2 OR playTimeMinutes >= 5 to qualify for welcome.
 */
export function getQualifyingTier(
  cluesCollected: number,
  casesSolved: number = 0,
  outlawCaught: boolean = false,
  welcomeEarned: boolean = false
): DiscountTier | null {
  if (
    cluesCollected >= DISCOUNT_TIERS.platinum.minClues &&
    casesSolved >= DISCOUNT_TIERS.platinum.minCasesSolved &&
    outlawCaught
  ) return 'platinum'
  if (
    cluesCollected >= DISCOUNT_TIERS.gold.minClues &&
    casesSolved >= DISCOUNT_TIERS.gold.minCasesSolved
  ) return 'gold'
  if (
    cluesCollected >= DISCOUNT_TIERS.silver.minClues &&
    casesSolved >= DISCOUNT_TIERS.silver.minCasesSolved
  ) return 'silver'
  if (cluesCollected >= DISCOUNT_TIERS.bronze.minClues) return 'bronze'
  if (welcomeEarned) return 'welcome'
  return null
}

/**
 * Check if player qualifies for the Welcome Prospector early reward.
 * Criteria: visited 2+ locations OR played for 5+ minutes.
 */
export function checkWelcomeEligibility(
  locationsVisited: number,
  playTimeMinutes: number
): boolean {
  return locationsVisited >= 2 || playTimeMinutes >= 5
}

/**
 * Generate a discount code based on player progress
 */
export function generateDiscountCode(
  cluesCollected: number,
  casesSolved: number = 0,
  outlawCaught: boolean = false,
  caseId: string = 'default'
): GeneratedCode | null {
  const tier = getQualifyingTier(cluesCollected, casesSolved, outlawCaught)
  if (!tier) return null

  const tierInfo = DISCOUNT_TIERS[tier]
  const timestamp = Math.floor(Date.now() / 1000)
  const expiresAt = timestamp + (tierInfo.validDays * 24 * 60 * 60)

  // Create signature payload
  const payload = `${tierInfo.prefix}${tierInfo.discount.toString().padStart(2, '0')}-${timestamp}`
  const signature = simpleHash(payload + CLIENT_SECRET + caseId)

  // Use TOBIAS format (plan spec) for online codes
  const code = `TOBIAS-${tierInfo.prefix}${tierInfo.discount.toString().padStart(2, '0')}-${timestamp}-${signature}`

  return {
    code,
    tier,
    discount: tierInfo.discount,
    validDays: tierInfo.validDays,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    cluesRequired: tierInfo.minClues,
    cluesCollected,
    casesSolved,
    outlawCaught,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Parse a discount code to extract its components
 */
export function parseDiscountCode(code: string): ParsedCode {
  // Support both BOBR- and TOBIAS- prefixes
  const pattern = /^(?:BOBR|TOBIAS)-([BSGP])(\d{2})-(\d+)-([A-F0-9]{4})$/
  const match = code.match(pattern)

  if (!match) {
    return { valid: false, error: 'Invalid code format' }
  }

  const [, tierPrefix, discountStr, timestampStr, signature] = match
  const discount = parseInt(discountStr, 10)
  const timestamp = parseInt(timestampStr, 10)

  // Find tier by prefix
  const tierEntry = Object.entries(DISCOUNT_TIERS).find(([, info]) => info.prefix === tierPrefix)
  if (!tierEntry) {
    return { valid: false, error: 'Invalid tier prefix' }
  }

  const tier = tierEntry[0] as DiscountTier
  const tierInfo = DISCOUNT_TIERS[tier]
  const expiresAt = timestamp + (tierInfo.validDays * 24 * 60 * 60)
  const isExpired = Date.now() / 1000 > expiresAt

  return {
    valid: true,
    tier,
    discount,
    timestamp,
    signature,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    isExpired
  }
}

/**
 * Validate a discount code (basic client-side check)
 * Note: Full validation should happen server-side
 */
export function validateDiscountCode(code: string, caseId: string = 'default'): ParsedCode {
  const parsed = parseDiscountCode(code)
  if (!parsed.valid) {
    return parsed
  }

  if (parsed.isExpired) {
    return { ...parsed, valid: false, error: 'Code has expired' }
  }

  // Verify signature (client-side, real validation is server-side)
  const tierInfo = DISCOUNT_TIERS[parsed.tier!]
  const payload = `${tierInfo.prefix}${parsed.discount!.toString().padStart(2, '0')}-${parsed.timestamp}`
  const expectedSignature = simpleHash(payload + CLIENT_SECRET + caseId)

  if (parsed.signature !== expectedSignature) {
    console.warn('Signature validation should be done server-side')
  }

  return {
    ...parsed,
    valid: true,
    message: `${parsed.discount}% off your stay at Back of Beyond Ranch!`
  }
}

/**
 * Calculate karma-adjusted discount
 */
export function calculateKarmaAdjustedDiscount(
  baseDiscount: number,
  karmaPosition: AlignmentPosition
): { adjustedDiscount: number; wasCapped: boolean; message: string | null } {
  const multiplier = KARMA_MULTIPLIERS[karmaPosition] || 1.0
  const adjustedDiscount = Math.round(baseDiscount * multiplier)
  const finalDiscount = Math.min(35, adjustedDiscount) // Cap at 35%
  const wasCapped = adjustedDiscount > 35

  let message: string | null = null
  if (finalDiscount > baseDiscount) {
    message = `Your ${ALIGNMENT_DISPLAY_NAMES[karmaPosition]} alignment boosted your discount!`
  } else if (finalDiscount < baseDiscount) {
    message = `Your ${ALIGNMENT_DISPLAY_NAMES[karmaPosition]} alignment reduced your discount.`
  }

  return { adjustedDiscount: finalDiscount, wasCapped, message }
}

/**
 * Calculate occupation multiplier on discount
 */
export function calculateOccupationDiscount(
  baseDiscount: number,
  occupation: OccupationType
): { adjustedDiscount: number; multiplier: number; message: string | null } {
  const info = OCCUPATION_DISCOUNT_MULTIPLIERS[occupation]
  const adjustedDiscount = Math.round(baseDiscount * info.discountMultiplier)

  let message: string | null = null
  if (info.discountMultiplier > 1.0) {
    message = info.flavorText
  }

  return { adjustedDiscount, multiplier: info.discountMultiplier, message }
}

/**
 * Generate discount code with karma AND occupation adjustments
 */
export function generateKarmaDiscountCode(
  cluesCollected: number,
  karmaPosition: AlignmentPosition = 'true_neutral',
  caseId: string = 'default',
  casesSolved: number = 0,
  outlawCaught: boolean = false,
  occupation: OccupationType = 'banker'
): KarmaAdjustedCode | null {
  const baseCode = generateDiscountCode(cluesCollected, casesSolved, outlawCaught, caseId)
  if (!baseCode) return null

  // Apply karma multiplier first
  const karmaAdjustment = calculateKarmaAdjustedDiscount(baseCode.discount, karmaPosition)

  // Apply occupation multiplier on top
  const occupationInfo = OCCUPATION_DISCOUNT_MULTIPLIERS[occupation]
  const withOccupation = Math.round(karmaAdjustment.adjustedDiscount * occupationInfo.discountMultiplier)

  // Cap at tier max discount
  const tierInfo = DISCOUNT_TIERS[baseCode.tier]
  const finalDiscount = Math.min(tierInfo.maxDiscount, withOccupation)

  const occupationMessage = occupationInfo.discountMultiplier > 1.0
    ? `${occupationInfo.flavorText} (${occupationInfo.discountMultiplier}x)`
    : null

  return {
    ...baseCode,
    baseDiscount: baseCode.discount,
    karmaMultiplier: KARMA_MULTIPLIERS[karmaPosition],
    occupationMultiplier: occupationInfo.discountMultiplier,
    occupationName: occupation,
    finalDiscount,
    karmaPosition,
    karmaMessage: karmaAdjustment.message,
    occupationMessage
  }
}

/**
 * Get next tier progress info
 */
export function getNextTierProgress(
  cluesCollected: number,
  casesSolved: number = 0,
  outlawCaught: boolean = false
): {
  maxed: boolean
  currentTier: DiscountTier | 'none'
  nextTier?: DiscountTier
  cluesNeeded?: number
  casesNeeded?: number
  needsOutlaw?: boolean
  nextDiscount?: number
  message: string
} {
  const currentTier = getQualifyingTier(cluesCollected, casesSolved, outlawCaught)
  const tiers: DiscountTier[] = ['welcome', 'bronze', 'silver', 'gold', 'platinum']
  const currentIndex = currentTier ? tiers.indexOf(currentTier) : -1

  if (currentIndex >= tiers.length - 1) {
    return {
      maxed: true,
      currentTier: 'platinum',
      message: 'You\'ve reached Platinum Chief - the highest rank!'
    }
  }

  const nextTier = tiers[currentIndex + 1]
  const nextTierInfo = DISCOUNT_TIERS[nextTier]
  const cluesNeeded = Math.max(0, nextTierInfo.minClues - cluesCollected)
  const casesNeeded = Math.max(0, nextTierInfo.minCasesSolved - casesSolved)
  const needsOutlaw = nextTierInfo.requiresOutlawCaught && !outlawCaught

  const parts: string[] = []
  if (cluesNeeded > 0) parts.push(`${cluesNeeded} more clue${cluesNeeded !== 1 ? 's' : ''}`)
  if (casesNeeded > 0) parts.push(`${casesNeeded} more case${casesNeeded !== 1 ? 's' : ''} solved`)
  if (needsOutlaw) parts.push('catch an outlaw')

  const message = parts.length > 0
    ? `${parts.join(', ')} to unlock ${nextTierInfo.displayName} (${nextTierInfo.discount}% off)!`
    : `Ready for ${nextTierInfo.displayName}!`

  return {
    maxed: false,
    currentTier: currentTier || 'none',
    nextTier,
    cluesNeeded,
    casesNeeded,
    needsOutlaw,
    nextDiscount: nextTierInfo.discount,
    message
  }
}

/**
 * Get all tiers for display
 */
export function getAllTiers(): Array<{ name: DiscountTier } & TierInfo> {
  return Object.entries(DISCOUNT_TIERS).map(([name, info]) => ({
    name: name as DiscountTier,
    ...info
  }))
}

/**
 * Get tier info by name
 */
export function getTierInfo(tier: DiscountTier): TierInfo {
  return DISCOUNT_TIERS[tier]
}

/**
 * Get occupation discount info
 */
export function getOccupationDiscountInfo(occupation: OccupationType): OccupationDiscountInfo {
  return OCCUPATION_DISCOUNT_MULTIPLIERS[occupation]
}
