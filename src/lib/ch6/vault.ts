/**
 * Chapter 6 "The Wall and the Post" — the vault.
 *
 * The combination is the California Historical Landmark numbers of the places
 * the player revisited, in leg order, then a final dial set to June 30, 1864
 * (Lincoln signed the Yosemite Grant the same day as the Bullion Bend robbery).
 *
 * Every number here is a VERIFIED row in
 * the Chapter 6 design docs, 05_verification.md
 * (OHP ListedResources). The book's numbers are NOT used: it gives Knights
 * Ferry as 415, but 415 is Willms Ranch — Knights Ferry is 347.
 *
 * Pure: no storage, no karma, no ledger.
 */

export interface VaultPlace {
  id: string
  name: string
  chl: number
  leg: number // leg order in 03_level_design.md; Knights Ferry + Jamestown share leg 6
}

// Leg order. The combination follows this order, never the order of visits.
export const VAULT_PLACES: readonly VaultPlace[] = Object.freeze([
  { id: 'sandy_gulch', name: 'Sandy Gulch', chl: 253, leg: 0.5 },
  { id: 'angels_camp', name: 'Angels Camp', chl: 287, leg: 1 },
  { id: 'san_andreas', name: 'San Andreas', chl: 252, leg: 2 },
  { id: 'placerville', name: 'Placerville (Old Dry Diggins–Old Hangtown)', chl: 475, leg: 3 },
  { id: 'mokelumne_hill', name: 'Mokelumne Hill', chl: 269, leg: 4 },
  { id: 'columbia', name: 'Columbia', chl: 123, leg: 5 },
  { id: 'knights_ferry', name: 'Knights Ferry', chl: 347, leg: 6 },
  { id: 'jamestown', name: 'Jamestown', chl: 431, leg: 6 },
  { id: 'jackass_hill', name: 'Mark Twain Cabin, Jackass Hill', chl: 138, leg: 7 },
].map(p => Object.freeze(p)))

// The final dial: Thursday, June 30, 1864.
export const VAULT_DIAL = Object.freeze({ year: 1864, month: 6, day: 30 })

export type VaultResult =
  | { ok: true; combination: number[] }
  | { ok: false; reason: 'unknown_place' | 'duplicate_place' | 'no_places'; detail?: string }

/** The combination for the places this player revisited, in leg order. */
export function combinationFor(revisitedPlaceIds: readonly string[]): VaultResult {
  if (revisitedPlaceIds.length === 0) return { ok: false, reason: 'no_places' }
  const seen = new Set<string>()
  for (const id of revisitedPlaceIds) {
    if (!VAULT_PLACES.some(p => p.id === id)) return { ok: false, reason: 'unknown_place', detail: id }
    if (seen.has(id)) return { ok: false, reason: 'duplicate_place', detail: id }
    seen.add(id)
  }
  return { ok: true, combination: VAULT_PLACES.filter(p => seen.has(p.id)).map(p => p.chl) }
}

export interface VaultAttempt {
  numbers: readonly number[]
  dial: { year: number; month: number; day: number }
}

/** True only if every number is right, in order, and the dial reads June 30, 1864. */
export function tryOpenVault(revisitedPlaceIds: readonly string[], attempt: VaultAttempt): boolean {
  const expected = combinationFor(revisitedPlaceIds)
  if (!expected.ok) return false
  const { numbers, dial } = attempt
  if (numbers.length !== expected.combination.length) return false
  if (!numbers.every((n, i) => n === expected.combination[i])) return false
  return dial.year === VAULT_DIAL.year && dial.month === VAULT_DIAL.month && dial.day === VAULT_DIAL.day
}
