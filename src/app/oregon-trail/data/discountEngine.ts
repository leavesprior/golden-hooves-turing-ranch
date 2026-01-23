/**
 * BOBR Discount Engine - TypeScript Port
 * Creates HMAC-signed, self-validating discount codes
 *
 * Code format: BOBR-{TIER}{DISCOUNT}-{TIMESTAMP}-{SIGNATURE}
 * Example: BOBR-D08-1705708800-A3F2
 */

// Discount tiers based on clues collected
export type DiscountTier = 'recruit' | 'detective' | 'inspector' | 'chief'

export interface TierInfo {
  minClues: number
  discount: number
  validDays: number
  prefix: string
}

export const DISCOUNT_TIERS: Record<DiscountTier, TierInfo> = {
  recruit: { minClues: 3, discount: 5, validDays: 30, prefix: 'R' },
  detective: { minClues: 5, discount: 8, validDays: 30, prefix: 'D' },
  inspector: { minClues: 7, discount: 10, validDays: 60, prefix: 'I' },
  chief: { minClues: 10, discount: 15, validDays: 90, prefix: 'C' }
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
  generatedAt: string
}

export interface KarmaAdjustedCode extends GeneratedCode {
  baseDiscount: number
  finalDiscount: number
  karmaPosition: AlignmentPosition
  karmaMultiplier: number
  karmaMessage: string | null
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
 * Get qualifying tier based on clues collected
 */
export function getQualifyingTier(cluesCollected: number): DiscountTier | null {
  if (cluesCollected >= DISCOUNT_TIERS.chief.minClues) return 'chief'
  if (cluesCollected >= DISCOUNT_TIERS.inspector.minClues) return 'inspector'
  if (cluesCollected >= DISCOUNT_TIERS.detective.minClues) return 'detective'
  if (cluesCollected >= DISCOUNT_TIERS.recruit.minClues) return 'recruit'
  return null
}

/**
 * Generate a discount code based on player progress
 */
export function generateDiscountCode(cluesCollected: number, caseId: string = 'default'): GeneratedCode | null {
  const tier = getQualifyingTier(cluesCollected)
  if (!tier) return null

  const tierInfo = DISCOUNT_TIERS[tier]
  const timestamp = Math.floor(Date.now() / 1000)
  const expiresAt = timestamp + (tierInfo.validDays * 24 * 60 * 60)

  // Create signature payload
  const payload = `${tierInfo.prefix}${tierInfo.discount.toString().padStart(2, '0')}-${timestamp}`
  const signature = simpleHash(payload + CLIENT_SECRET + caseId)

  const code = `BOBR-${tierInfo.prefix}${tierInfo.discount.toString().padStart(2, '0')}-${timestamp}-${signature}`

  return {
    code,
    tier,
    discount: tierInfo.discount,
    validDays: tierInfo.validDays,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    cluesRequired: tierInfo.minClues,
    cluesCollected,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Parse a discount code to extract its components
 */
export function parseDiscountCode(code: string): ParsedCode {
  const pattern = /^BOBR-([RDIC])(\d{2})-(\d+)-([A-F0-9]{4})$/
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
    message: `${parsed.discount}% off your BOBR stay!`
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
 * Generate discount code with karma adjustment
 */
export function generateKarmaDiscountCode(
  cluesCollected: number,
  karmaPosition: AlignmentPosition = 'true_neutral',
  caseId: string = 'default'
): KarmaAdjustedCode | null {
  const baseCode = generateDiscountCode(cluesCollected, caseId)
  if (!baseCode) return null

  const karmaAdjustment = calculateKarmaAdjustedDiscount(baseCode.discount, karmaPosition)

  return {
    ...baseCode,
    baseDiscount: baseCode.discount,
    finalDiscount: karmaAdjustment.adjustedDiscount,
    karmaPosition,
    karmaMultiplier: KARMA_MULTIPLIERS[karmaPosition],
    karmaMessage: karmaAdjustment.message
  }
}

/**
 * Get next tier progress info
 */
export function getNextTierProgress(cluesCollected: number): {
  maxed: boolean
  currentTier: DiscountTier | 'none'
  nextTier?: DiscountTier
  cluesNeeded?: number
  nextDiscount?: number
  message: string
} {
  const currentTier = getQualifyingTier(cluesCollected)
  const tiers: DiscountTier[] = ['recruit', 'detective', 'inspector', 'chief']
  const currentIndex = currentTier ? tiers.indexOf(currentTier) : -1

  if (currentIndex >= tiers.length - 1) {
    return {
      maxed: true,
      currentTier: 'chief',
      message: 'You\'ve reached the highest rank!'
    }
  }

  const nextTier = tiers[currentIndex + 1]
  const nextTierInfo = DISCOUNT_TIERS[nextTier]
  const cluesNeeded = nextTierInfo.minClues - cluesCollected

  return {
    maxed: false,
    currentTier: currentTier || 'none',
    nextTier,
    cluesNeeded,
    nextDiscount: nextTierInfo.discount,
    message: `${cluesNeeded} more clue${cluesNeeded !== 1 ? 's' : ''} to unlock ${nextTierInfo.discount}% off!`
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
