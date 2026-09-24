import { metersBetween } from '@/lib/oneMapDiscovery'

/**
 * "Out of time" — a real place seen Today, or slipped back to how it may have
 * stood. The fact/interpretation line is load-bearing: `known` holds only what
 * a cited source says; the painted "then" plate is always labelled as a guess.
 *
 * Distance decides what a guest gets:
 *   far      → a place to see (name, distance, hours)
 *   in_town  → you are in town, walk this way
 *   here     → the keeper speaks (only within a very short distance)
 * A fix too rough to tell "here" from "down the street" never unlocks the keeper.
 * Even a good fix cannot tell one door from the next: at 16154 Main the
 * neighbour's door is 13.9 m away (outOfTime.keeperDoor.test.ts, intended red).
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
  /** Where the keeper stands and how close is "here". */
  point: { lat: number; lng: number }
  pointSource: string
  keeper: { name: string; radiusM: number; lines: string[] }
}

export type PlaceTier = 'far' | 'in_town' | 'here'

/** Within this, you are in the town the place belongs to. */
export const IN_TOWN_M = 1500
/** A fix worse than this can't tell "at the door" from "down the street". */
export const MAX_ACCURACY_FOR_HERE_M = 50
/** At most this much GPS slack is added to the keeper radius. */
const MAX_SLACK_M = 25

export interface Fix {
  lat: number
  lng: number
  accuracyM: number
}

export function placeTier(fix: Fix, oot: Pick<OutOfTime, 'point' | 'keeper'>): { tier: PlaceTier; meters: number } {
  const meters = metersBetween(fix, oot.point)
  const reach = oot.keeper.radiusM + Math.min(fix.accuracyM, MAX_SLACK_M)
  if (meters <= reach && fix.accuracyM <= MAX_ACCURACY_FOR_HERE_M) return { tier: 'here', meters }
  if (meters <= IN_TOWN_M) return { tier: 'in_town', meters }
  return { tier: 'far', meters }
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
