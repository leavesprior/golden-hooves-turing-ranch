export type BookingPlatform = 'bobr_direct' | 'hipcamp' | 'hostaway' | 'unknown'

export interface BookingCodePattern {
  platform: Exclude<BookingPlatform, 'unknown'>
  regex: RegExp
  label: string
}

export const BOOKING_CODE_PATTERNS: BookingCodePattern[] = [
  {
    platform: 'bobr_direct',
    regex: /^BOBR-\d{8}-[A-Z0-9]{4}$/i,
    label: 'Back of Beyond Ranch (BOBR-YYYYMMDD-XXXX)',
  },
  {
    platform: 'hipcamp',
    regex: /^HM[A-Z0-9]{6,12}$/i,
    label: 'Hipcamp (HM...)',
  },
  {
    platform: 'hostaway',
    regex: /^HA-[A-Z0-9]{4,12}$/i,
    label: 'Hostaway (HA-...)',
  },
]

export function normalizeBookingCode(code: string): string {
  return code.trim().toUpperCase()
}

export function detectBookingPlatform(code: string): BookingPlatform {
  const normalized = normalizeBookingCode(code)
  return BOOKING_CODE_PATTERNS.find(pattern => pattern.regex.test(normalized))?.platform ?? 'unknown'
}

export function isBookingCodeFormatValid(code: string, platform?: BookingPlatform): boolean {
  const normalized = normalizeBookingCode(code)
  return BOOKING_CODE_PATTERNS.some(pattern => {
    if (platform && platform !== 'unknown' && pattern.platform !== platform) return false
    return pattern.regex.test(normalized)
  })
}

export function getSupportedBookingFormats(): string[] {
  return BOOKING_CODE_PATTERNS.map(pattern => pattern.label)
}
