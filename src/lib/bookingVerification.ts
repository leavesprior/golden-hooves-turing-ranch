/**
 * BOBR Booking Verification - Client-side MVP
 *
 * Pattern-matches booking confirmation codes to gate access
 * to the Prologue game. Client-side only (proportionate security
 * for a game gate, not a payment system).
 *
 * Supported formats:
 * - BOBR: BOBR-YYYYMMDD-XXXX (ranch direct booking)
 * - Airbnb: HM followed by alphanumeric (e.g., HMABCD1234)
 * - VRBO: HA- followed by alphanumeric (e.g., HA-ABC1234)
 */

export const BOOKING_STORAGE_KEY = 'bobr_booking_verified'

export type BookingPlatform = 'bobr_direct' | 'airbnb' | 'vrbo' | 'unknown'

export interface BookingVerification {
  verified: boolean
  platform: BookingPlatform
  code: string
  verifiedAt: string
}

// Patterns for each platform
const PATTERNS: { platform: BookingPlatform; regex: RegExp; label: string }[] = [
  {
    platform: 'bobr_direct',
    regex: /^BOBR-\d{8}-[A-Z0-9]{4}$/i,
    label: 'Back of Beyond Ranch (BOBR-YYYYMMDD-XXXX)',
  },
  {
    platform: 'airbnb',
    regex: /^HM[A-Z0-9]{6,12}$/i,
    label: 'Airbnb (HM...)',
  },
  {
    platform: 'vrbo',
    regex: /^HA-[A-Z0-9]{4,12}$/i,
    label: 'VRBO (HA-...)',
  },
]

/**
 * Verify a booking confirmation code.
 * Returns the detected platform or null if invalid.
 */
export function verifyBookingCode(code: string): { valid: boolean; platform: BookingPlatform } {
  const trimmed = code.trim().toUpperCase()

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      return { valid: true, platform: pattern.platform }
    }
  }

  return { valid: false, platform: 'unknown' }
}

/**
 * Save verified booking to localStorage
 */
export function saveBookingVerification(code: string, platform: BookingPlatform): void {
  try {
    if (typeof window === 'undefined') return
    const verification: BookingVerification = {
      verified: true,
      platform,
      code: code.substring(0, 4) + '****', // Store partial for privacy
      verifiedAt: new Date().toISOString(),
    }
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(verification))
  } catch {}
}

/**
 * Check if booking has been previously verified
 */
export function isBookingVerified(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const data = localStorage.getItem(BOOKING_STORAGE_KEY)
    if (!data) return false
    const verification = JSON.parse(data) as BookingVerification
    return verification.verified === true
  } catch {
    return false
  }
}

/**
 * Get supported format descriptions for UI display
 */
export function getSupportedFormats(): string[] {
  return PATTERNS.map(p => p.label)
}
