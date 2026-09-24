import { metersBetween } from '@/lib/oneMapDiscovery'

/**
 * "Out of time" — a real place seen Today, or slipped back to how it may have
 * stood. The fact/interpretation line is load-bearing: `known` holds only what
 * a cited source says; the painted "then" plate is always labelled as a guess.
 *
 * GPS decides three tiers; only the door code decides the fourth:
 *   far       → a place to see (name, distance, hours)
 *   in_town   → you are in town, walk this way
 *   on_block  → you are on the block; the hint names which front is the door
 *   here      → the keeper speaks — ONLY from the code posted at the door
 * GPS never says "here": at 16154 Main the neighbour's door is 13.9 m away and
 * phone GPS is 10–50 m (outOfTime.keeperDoor.test.ts).
 * The fix is used on the device only; nothing here sends it anywhere.
 */
export interface OutOfTime {
  /** When the "then" plate imagines it, e.g. "about 1885". */
  era: string
  plateToday: string
  plateThen: string
  plateThenInside?: string
  /** Shown under every "then" plate. */
  interpretationLabel: string
  /** What sources actually say, with the source named in the text. */
  known: string
  /** Centre for the GPS tiers (distance, in town, on the block). */
  point: { lat: number; lng: number }
  pointSource: string
  /** GPS radius for "on this block". Never unlocks the keeper. */
  blockRadiusM: number
  /** Which front is the door, told to a guest on the block. */
  blockHint: string
  /** The code at the door. `posted` = a card is physically up; until then no copy promises one. */
  doorCode: { token: string; posted: boolean }
  keeper: { name: string; lines: string[] }
}

export type PlaceTier = 'far' | 'in_town' | 'on_block' | 'here'

/** Within this, you are in the town the place belongs to. */
export const IN_TOWN_M = 1500
/** A fix worse than this can't tell "on the block" from "down the street". */
export const MAX_ACCURACY_FOR_BLOCK_M = 50
/** At most this much GPS slack is added to the block radius. */
const MAX_SLACK_M = 25

export interface Fix {
  lat: number
  lng: number
  accuracyM: number
}

/** GPS tier. Never returns 'here' — see atDoor. */
export function placeTier(fix: Fix, oot: Pick<OutOfTime, 'point' | 'blockRadiusM'>): { tier: Exclude<PlaceTier, 'here'>; meters: number } {
  const meters = metersBetween(fix, oot.point)
  const reach = oot.blockRadiusM + Math.min(fix.accuracyM, MAX_SLACK_M)
  if (meters <= reach && fix.accuracyM <= MAX_ACCURACY_FOR_BLOCK_M) return { tier: 'on_block', meters }
  if (meters <= IN_TOWN_M) return { tier: 'in_town', meters }
  return { tier: 'far', meters }
}

/** The guest scanned this place's door code: ?door=<token>. */
export function atDoor(search: string, oot: Pick<OutOfTime, 'doorCode'>): boolean {
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    return (q.get('door') || '').trim() === oot.doorCode.token
  } catch {
    return false
  }
}

/** The door code's URL. `town` is a peek town, so a stranger scanning it lands in the game. */
export function doorCodePath(townId: string, oot: Pick<OutOfTime, 'doorCode'>): string {
  return `/explore?town=${encodeURIComponent(townId)}&door=${encodeURIComponent(oot.doorCode.token)}`
}

export function distanceLabel(meters: number): string {
  if (meters < 1000) return `${meters} m`
  const tenths = Math.round((meters / 1609.344) * 10) / 10
  return tenths < 10 ? `${tenths.toFixed(1)} mi` : `${Math.round(tenths)} mi`
}

/** Dev-only simulated fix: ?nearPlace=<placeId>[&nearOffsetM=<n>] on localhost. */
export function parseSimulatedPlaceFix(
  search: string,
  placeId: string,
  point: { lat: number; lng: number },
  hostname: string,
): Fix | null {
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null
  const q = new URLSearchParams(search)
  if (q.get('nearPlace') !== placeId) return null
  const offset = Number(q.get('nearOffsetM') || '0')
  // Move due north by `offset` meters (1° latitude ≈ 111,320 m).
  return { lat: point.lat + (Number.isFinite(offset) ? offset : 0) / 111320, lng: point.lng, accuracyM: 10 }
}
