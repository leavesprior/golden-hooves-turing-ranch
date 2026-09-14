import { areLocationsAdjacent, getGoldCountryLocation, getLocationTravelDistance } from '../app/oregon-trail/data/goldCountryLocations'

/** Simulation policy, not a historical calendar or fare table. Existing market
 * seasons use 360 days; trail day 1 and Gold Country day 1 are the same origin.
 * Stage charters unlock in 1852; this does not claim a named local timetable.
 * https://history.wf.com/serving-customers-since-1852/ (founded March 18, 1852)
 * Sacramento–Roseville had daily Central Pacific trains from April 25, 1864:
 * https://ohp.parks.ca.gov/?page_id=21450 (CHL 780-1). The game's 1869 rail gate
 * follows the brief, not that segment's opening date. National completion:
 * https://www.nps.gov/im/ncpn/bpd-gosp.htm (May 10, 1869).
 * Prices, minutes, Luck thresholds and delays below are authored game choices.
 * This module neither awards progress nor proves a saved calendar authentic. */
export const GOLD_COUNTRY_START_YEAR = 1849
export const GOLD_COUNTRY_DAYS_PER_YEAR = 360
export const GOLD_COUNTRY_MINUTES_PER_DAY = 1440
export const GOLD_COUNTRY_RAIL_GATEWAYS = ['sacramento_gateway', 'roseville_gateway'] as const
export type GoldCountryTransportMode = 'wagon' | 'stage' | 'rail'
export type GoldCountryTransportEvent = 'clear' | 'weather' | 'robbers' | 'wreck'
export interface GoldCountryClock {
  day: number
  /** Optional fields on old trail saves begin at Gold Country day 1, minute 0. */
  goldCountryDay?: number
  goldCountryMinute?: number
}
export interface GoldCountryCalendar {
  year: number
  dayOfYear: number
  elapsedDays: number
  goldCountryMinute: number
}
export interface GoldCountryTransportRequest {
  fromId: string
  toId: string
  mode?: GoldCountryTransportMode
  clock: GoldCountryClock
  /** Defaults to character BASE_STATS.Luck (5); valid integers clamp to 1..20. */
  luck?: number
  /** Caller supplies exactly one roll in [0,1) for a paid trip and persists it. */
  roll?: number
}
export interface GoldCountryTransportQuote {
  fromId: string
  toId: string
  mode: GoldCountryTransportMode
  year: number
  adjacent: boolean
  distance: number
  fare: number
  baseMinutes: number
  delayMinutes: number
  durationMinutes: number
  event: GoldCountryTransportEvent
  message: string
  luck: number | null
  roll: number | null
}
export type GoldCountryTransportRejection = 'invalid_input' | 'unknown_location' | 'same_location'
  | 'stage_not_available' | 'rail_not_available' | 'rail_route_unavailable' | 'gateway_not_available'
export type GoldCountryTransportResult = { ok: true; quote: GoldCountryTransportQuote }
  | { ok: false; reason: GoldCountryTransportRejection }

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function safeInteger(value: unknown, minimum: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= minimum
}

export function getGoldCountryCalendar(clock: GoldCountryClock): GoldCountryCalendar | undefined {
  if (!isRecord(clock)) return undefined
  const goldCountryDay = clock.goldCountryDay === undefined ? 1 : clock.goldCountryDay
  const goldCountryMinute = clock.goldCountryMinute === undefined ? 0 : clock.goldCountryMinute
  if (!safeInteger(clock.day, 1) || !safeInteger(goldCountryDay, 1)
    || !safeInteger(goldCountryMinute, 0) || goldCountryMinute >= GOLD_COUNTRY_MINUTES_PER_DAY) return undefined
  const elapsedDays = (clock.day - 1) + (goldCountryDay - 1)
  if (!Number.isSafeInteger(elapsedDays)) return undefined
  return { year: GOLD_COUNTRY_START_YEAR + Math.floor(elapsedDays / GOLD_COUNTRY_DAYS_PER_YEAR),
    dayOfYear: elapsedDays % GOLD_COUNTRY_DAYS_PER_YEAR + 1, elapsedDays, goldCountryMinute }
}

/** Add elapsed time only when the existing arrival resolver accepts a trip.
 * This arithmetic is not an idempotency guard: the caller must consume the saved
 * trip once. Whole-day weather/search/warrant counters remain integer days. */
export function advanceGoldCountryClock(clock: GoldCountryClock, elapsedMinutes: number): Pick<Required<GoldCountryClock>, 'goldCountryDay' | 'goldCountryMinute'> | undefined {
  const calendar = getGoldCountryCalendar(clock)
  if (!calendar || !safeInteger(elapsedMinutes, 0)) return undefined
  const totalMinutes = calendar.goldCountryMinute + elapsedMinutes
  if (!Number.isSafeInteger(totalMinutes)) return undefined
  const goldCountryDay = (clock.goldCountryDay ?? 1) + Math.floor(totalMinutes / GOLD_COUNTRY_MINUTES_PER_DAY)
  const goldCountryMinute = totalMinutes % GOLD_COUNTRY_MINUTES_PER_DAY
  if (!getGoldCountryCalendar({ day: clock.day, goldCountryDay, goldCountryMinute })) return undefined
  return { goldCountryDay, goldCountryMinute }
}

function isGateway(id: string): boolean {
  return GOLD_COUNTRY_RAIL_GATEWAYS.some(gateway => gateway === id)
}
function paidEvent(luck: number, roll: number): GoldCountryTransportEvent {
  // Higher Luck moves the same roll toward shorter delays. A default-Luck
  // traveler can still meet every event. No damage, theft or new stat rules.
  const score = Math.floor(roll * 100) + Math.floor((luck - 1) / 2)
  return score < 4 ? 'wreck' : score < 12 ? 'robbers' : score < 32 ? 'weather' : 'clear'
}
const DELAYS: Record<'stage' | 'rail', Record<GoldCountryTransportEvent, number>> = {
  stage: { clear: 0, weather: 30, robbers: 60, wreck: 120 },
  rail: { clear: 0, weather: 15, robbers: 30, wreck: 60 },
}
const MESSAGES: Record<'stage' | 'rail', Record<GoldCountryTransportEvent, string>> = {
  stage: {
    clear: 'The hired coach makes a clear run.',
    weather: 'Heavy weather slows the hired coach.',
    robbers: 'A robbery alert holds the coach until the road is cleared.',
    wreck: 'A coach wheel breaks; repairs delay the trip.',
  },
  rail: {
    clear: 'The train makes a clear run.',
    weather: 'Heavy weather slows the train.',
    robbers: 'A robbery alert holds the train until the line is cleared.',
    wreck: 'A wreck blocks the line; the train waits for clearance.',
  },
}

export function quoteGoldCountryTransport(request: GoldCountryTransportRequest): GoldCountryTransportResult {
  if (!isRecord(request)) return { ok: false, reason: 'invalid_input' }
  const mode = request.mode === undefined ? 'wagon' : request.mode
  const calendar = getGoldCountryCalendar(request.clock)
  if (!calendar || !['wagon', 'stage', 'rail'].includes(mode)
    || typeof request.fromId !== 'string' || typeof request.toId !== 'string'
    || (request.luck !== undefined && !Number.isSafeInteger(request.luck))
    || (request.roll !== undefined && (!Number.isFinite(request.roll) || request.roll < 0 || request.roll >= 1))) {
    return { ok: false, reason: 'invalid_input' }
  }
  const { fromId, toId } = request
  if ((!getGoldCountryLocation(fromId) && !isGateway(fromId)) || (!getGoldCountryLocation(toId) && !isGateway(toId))) {
    return { ok: false, reason: 'unknown_location' }
  }
  if (fromId === toId) return { ok: false, reason: 'same_location' }
  const railPair = isGateway(fromId) && isGateway(toId)
  if (mode === 'stage' && calendar.year < 1852) return { ok: false, reason: 'stage_not_available' }
  if (mode === 'rail' && calendar.year < 1869) return { ok: false, reason: 'rail_not_available' }
  if (mode === 'rail' && !railPair) return { ok: false, reason: 'rail_route_unavailable' }
  if ([fromId, toId].some(id => {
    const gateway = getGoldCountryLocation(id)?.transportGateway
    return gateway && calendar.year < gateway.availableFromYear
  })) return { ok: false, reason: 'gateway_not_available' }
  if (mode !== 'wagon' && request.roll === undefined) return { ok: false, reason: 'invalid_input' }

  // Preserve the existing catalog's directional adjacency; the reviewed nearby
  // gateway pair is also adjacent. Catalog distances are game units, not surveyed miles.
  const adjacent = railPair || areLocationsAdjacent(fromId, toId)
  const distance = adjacent ? 1 : getLocationTravelDistance(fromId, toId)
  if (!safeInteger(distance, 1) || distance > 5) return { ok: false, reason: 'invalid_input' }
  const luck = mode === 'wagon' ? null : Math.max(1, Math.min(20, request.luck ?? 5))
  const roll = mode === 'wagon' ? null : request.roll!
  const event = mode === 'wagon' ? 'clear' : paidEvent(luck!, roll!)
  // Adjacent trips now consume eight hours: chaining them no longer costs zero
  // days. Existing nonadjacent wagon trips retain their one-day duration.
  const baseMinutes = mode === 'wagon' ? adjacent ? 480 : 1440 : mode === 'stage' ? adjacent ? 240 : 720 : 90
  const delayMinutes = mode === 'wagon' ? 0 : DELAYS[mode][event]
  return { ok: true, quote: { fromId, toId, mode, year: calendar.year, adjacent, distance,
    fare: mode === 'wagon' ? 0 : mode === 'stage' ? 4 + 2 * distance : 8,
    baseMinutes, delayMinutes, durationMinutes: baseMinutes + delayMinutes, event,
    message: mode === 'wagon' ? 'You follow the road.' : MESSAGES[mode][event], luck, roll,
  } }
}
