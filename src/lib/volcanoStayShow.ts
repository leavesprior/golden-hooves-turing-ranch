/**
 * Volcano Cobblestone Theatre + Back of Beyond stay, same nights.
 *
 * Show dates from volcanotheatre.net/tickets (read 2026-08-20):
 *   Catch Me If You Can  Apr 10–May 16  Cobblestone
 *   Too Many Cooks       Jun 12–Aug 1   Amphitheatre
 *   Dr. Jekyll & Mr Hyde Aug 28–Oct 3   Cobblestone
 * Tickets: $24 general / $22 senior / $18 student. Online only at volcanotheatre.net.
 * Ranch: Airbnb room 30045739 / h/backofbeyondranch (West Point). Volcano is a
 * short Gold Country drive — the guest still picks the same weekend on both sites.
 */

import { airbnbBookingLink } from './airbnbLink'

export const THEATRE_TICKETS_URL = 'https://volcanotheatre.net/tickets/'
export const THEATRE_HOME_URL = 'https://volcanotheatre.net/'
export const AIRBNB_ROOM_ID = '30045739'

export interface TheatreShow {
  id: string
  title: string
  venue: 'cobblestone' | 'amphitheatre'
  start: string
  end: string
  ticketsUrl: string
}

export const THEATRE_SEASON_2026: TheatreShow[] = [
  {
    id: 'catch-me-if-you-can',
    title: 'Catch Me If You Can',
    venue: 'cobblestone',
    start: '2026-04-10',
    end: '2026-05-16',
    ticketsUrl: 'https://volcanotheatre.net/catch-me-if-you-can/',
  },
  {
    id: 'too-many-cooks',
    title: 'Too Many Cooks',
    venue: 'amphitheatre',
    start: '2026-06-12',
    end: '2026-08-01',
    ticketsUrl: THEATRE_TICKETS_URL,
  },
  {
    id: 'jekyll-hyde',
    title: 'Dr. Jekyll and Mr. Hyde',
    venue: 'cobblestone',
    start: '2026-08-28',
    end: '2026-10-03',
    ticketsUrl: THEATRE_TICKETS_URL,
  },
]

export interface StayWindow {
  checkIn: string
  checkOut: string
  nights: number
  adults: number
}

function parseDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function isoDay(ms: number): string {
  const dt = new Date(ms)
  const y = dt.getUTCFullYear()
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function nightsOverlapShow(stay: StayWindow, show: TheatreShow): boolean {
  const inMs = parseDay(stay.checkIn)
  const outMs = parseDay(stay.checkOut)
  const start = parseDay(show.start)
  const end = parseDay(show.end) + 24 * 3600 * 1000
  return inMs < end && outMs > start && outMs > inMs
}

/** Next Friday on or after `fromIso` (UTC calendar date). */
export function nextFridayOnOrAfter(fromIso: string): string {
  const ms = parseDay(fromIso)
  const dow = new Date(ms).getUTCDay()
  const add = dow === 5 ? 0 : (5 - dow + 7) % 7
  return isoDay(ms + add * 24 * 3600 * 1000)
}

export function defaultStayForShow(show: TheatreShow, todayIso: string, nights = 2, adults = 2): StayWindow {
  const openFri = nextFridayOnOrAfter(show.start)
  const todayFri = nextFridayOnOrAfter(todayIso)
  const checkIn = parseDay(todayFri) > parseDay(openFri) ? todayFri : openFri
  const clampedIn = parseDay(checkIn) > parseDay(show.end) ? show.start : checkIn
  const checkOut = isoDay(parseDay(clampedIn) + nights * 24 * 3600 * 1000)
  return { checkIn: clampedIn, checkOut, nights, adults }
}

export function upcomingShows(todayIso: string): TheatreShow[] {
  const t = parseDay(todayIso)
  return THEATRE_SEASON_2026.filter((s) => parseDay(s.end) >= t)
}

export function airbnbStayUrl(stay: StayWindow, source = 'volcano_stay_show'): string {
  const vanity = airbnbBookingLink(source, 'theatre-weekend')
  const room = new URL(`https://www.airbnb.com/rooms/${AIRBNB_ROOM_ID}`)
  room.searchParams.set('check_in', stay.checkIn)
  room.searchParams.set('check_out', stay.checkOut)
  room.searchParams.set('adults', String(stay.adults))
  room.searchParams.set('utm_source', source)
  room.searchParams.set('utm_medium', 'game')
  room.searchParams.set('utm_campaign', 'theatre-weekend')
  return `${room.toString()}#vanity=${encodeURIComponent(vanity)}`
}

export function airbnbRoomUrl(stay: StayWindow, source = 'volcano_stay_show'): string {
  const room = new URL(`https://www.airbnb.com/rooms/${AIRBNB_ROOM_ID}`)
  room.searchParams.set('check_in', stay.checkIn)
  room.searchParams.set('check_out', stay.checkOut)
  room.searchParams.set('adults', String(stay.adults))
  room.searchParams.set('utm_source', source)
  room.searchParams.set('utm_medium', 'game')
  room.searchParams.set('utm_campaign', 'theatre-weekend')
  return room.toString()
}

export const HOLD_KEY = 'bobr_volcano_stay_show'

export interface StayShowHold {
  showId: string
  stay: StayWindow
  heldAt: string
}

export function readHold(): StayShowHold | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(HOLD_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as StayShowHold
    if (!v?.showId || !v.stay?.checkIn) return null
    return v
  } catch {
    return null
  }
}

export function writeHold(hold: StayShowHold): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HOLD_KEY, JSON.stringify(hold))
  } catch { /* fail-open */ }
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
