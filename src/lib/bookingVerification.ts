/**
 * BOBR Booking Verification
 *
 * Client-side format checks are only for fast UX feedback. Final
 * verification is server-side through /api/verify-booking, which checks
 * a host-managed allow-list before unlocking the Prologue game.
 *
 * Supported formats:
 * - BOBR: BOBR-YYYYMMDD-XXXX (ranch direct booking)
 * - Hipcamp: HM followed by alphanumeric (e.g., HMABCD1234)
 * - Hostaway: HA- followed by alphanumeric (e.g., HA-ABC1234)
 */

import {
  detectBookingPlatform,
  getSupportedBookingFormats,
  normalizeBookingCode,
} from './bookingCodeFormat'
import type { BookingPlatform } from './bookingCodeFormat'

export const BOOKING_STORAGE_KEY = 'bobr_booking_verified'

export interface BookingVerification {
  verified: boolean
  platform: BookingPlatform
  code: string
  verifiedAt: string
  expiresAt?: string
}

export interface BookingVerificationResult {
  valid: boolean
  platform: BookingPlatform
  expiresAt?: string
  reason?: 'format' | 'not_verified' | 'rate_limited' | 'network'
}

/**
 * Verify a booking confirmation code.
 * Returns the detected platform and server verification result.
 */
export async function verifyBookingCode(code: string): Promise<BookingVerificationResult> {
  const trimmed = normalizeBookingCode(code)
  const platform = detectBookingPlatform(trimmed)

  if (platform === 'unknown') {
    return { valid: false, platform, reason: 'format' }
  }

  try {
    const response = await fetch('/api/verify-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed, platform }),
    })

    if (response.status === 429) {
      return { valid: false, platform, reason: 'rate_limited' }
    }

    const data = await response.json() as { verified?: boolean; expiresAt?: string }
    return {
      valid: data.verified === true,
      platform,
      expiresAt: data.expiresAt,
      reason: data.verified === true ? undefined : 'not_verified',
    }
  } catch {
    return { valid: false, platform, reason: 'network' }
  }
}

/**
 * Save verified booking to localStorage
 */
export function saveBookingVerification(code: string, platform: BookingPlatform, expiresAt?: string): void {
  try {
    if (typeof window === 'undefined') return
    const normalized = normalizeBookingCode(code)
    const verification: BookingVerification = {
      verified: true,
      platform,
      code: normalized.substring(0, 4) + '****', // Store partial for privacy
      verifiedAt: new Date().toISOString(),
      expiresAt,
    }
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(verification))
  } catch {}
}

/**
 * Get supported format descriptions for UI display
 */
export function getSupportedFormats(): string[] {
  return getSupportedBookingFormats()
}
