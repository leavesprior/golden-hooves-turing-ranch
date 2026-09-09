/**
 * Pure travel-progress tick. Side effects (day advance, encounter roll,
 * phase changes) stay OUT of React setState updaters — calling
 * advanceGoldCountryDay inside setTravelProgress updates OregonTrailProvider
 * while GoldCountryTravel is rendering.
 */

export const TRAVEL_STEP = 5
export const ENCOUNTER_AT = 50

export function goldCountryTravelTick(prev: number, step = TRAVEL_STEP): {
  next: number
  arrive: boolean
  rollEncounter: boolean
} {
  const start = Number.isFinite(prev) ? Math.max(0, prev) : 0
  const next = Math.min(100, start + step)
  return {
    next,
    arrive: next >= 100,
    rollEncounter: start < ENCOUNTER_AT && next >= ENCOUNTER_AT,
  }
}
