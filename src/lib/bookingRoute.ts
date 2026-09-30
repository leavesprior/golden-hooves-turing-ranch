/**
 * Book Your Stay routing rule — pure, no Date.now() inside (caller passes today).
 *
 *   nights >= 28                 → long-stay: direct inquiry on /rentals/availability
 *   else check-in within 30 days → last-minute leg (Whimstay when listed, else Airbnb)
 *   else                         → Airbnb with dates prefilled
 *
 * Stay length is checked first: a 35-night stay starting tomorrow is long-stay.
 * VRBO has no listing — never linked.
 */
import { AIRBNB_ROOM_ID } from './volcanoStayShow'

export const LONG_STAY_MIN_NIGHTS = 28
export const LAST_MINUTE_MAX_LEAD_DAYS = 30
export const MAX_GUESTS = 12

// TODO(Whimstay): there is NO Whimstay listing yet. When one exists, set this to
// its listing URL and last-minute stays will go there instead of Airbnb.
export const WHIMSTAY_LISTING_URL: string | null = null

export type BookingRouteKind = 'long-stay' | 'last-minute' | 'airbnb'

export type BookingRoute =
  | { ok: true; kind: BookingRouteKind; url: string; nights: number; leadDays: number }
  | { ok: false; reason: string }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function dayNumber(iso: string): number | null {
  if (!DATE_RE.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d)
  // Reject rollovers like 2026-02-31.
  if (new Date(t).toISOString().slice(0, 10) !== iso) return null
  return Math.round(t / 86_400_000)
}

export function airbnbStayUrl(checkIn: string, checkOut: string, guests: number): string {
  const q = new URLSearchParams({ check_in: checkIn, check_out: checkOut, adults: String(guests) })
  return `https://www.airbnb.com/rooms/${AIRBNB_ROOM_ID}?${q.toString()}`
}

export function directInquiryUrl(checkIn: string, checkOut: string, guests: number): string {
  const q = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) })
  return `/rentals/availability?${q.toString()}`
}

export function bookingRoute(
  checkIn: string,
  checkOut: string,
  guests: number,
  today: string,
): BookingRoute {
  const inDay = dayNumber(checkIn)
  const outDay = dayNumber(checkOut)
  const todayDay = dayNumber(today)
  if (inDay === null || outDay === null || todayDay === null) return { ok: false, reason: 'invalid_date' }
  if (outDay <= inDay) return { ok: false, reason: 'check_out_must_follow_check_in' }
  if (inDay < todayDay) return { ok: false, reason: 'check_in_in_past' }
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    return { ok: false, reason: 'guests_out_of_range' }
  }

  const nights = outDay - inDay
  const leadDays = inDay - todayDay

  if (nights >= LONG_STAY_MIN_NIGHTS) {
    return { ok: true, kind: 'long-stay', url: directInquiryUrl(checkIn, checkOut, guests), nights, leadDays }
  }
  if (leadDays <= LAST_MINUTE_MAX_LEAD_DAYS) {
    const url = WHIMSTAY_LISTING_URL ?? airbnbStayUrl(checkIn, checkOut, guests)
    return { ok: true, kind: 'last-minute', url, nights, leadDays }
  }
  return { ok: true, kind: 'airbnb', url: airbnbStayUrl(checkIn, checkOut, guests), nights, leadDays }
}
