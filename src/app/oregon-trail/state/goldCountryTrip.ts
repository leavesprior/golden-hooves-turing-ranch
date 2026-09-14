/** Persisted journey data and validation, consumed by the existing Gold Country actions. */
import { quoteGoldCountryTransport, getGoldCountryCalendar, type GoldCountryClock, type GoldCountryTransportQuote } from '@/lib/goldCountryTransport'
import { TRAVEL_ENCOUNTERS } from '../data/goldCountryEncounters'
import type { OregonTrailState } from './types'

export interface GoldCountryTrip {
  version: 1
  id: string
  status: 'planned' | 'paid' | 'arrived' | 'cancelled'
  departureClock: Required<GoldCountryClock>
  quote: GoldCountryTransportQuote
  /** Original wagon encounters; adjacent roads and paid transport do not roll this table. */
  roadEncounterId: string | null
  roadChoiceId?: string
  roadOutcomeAcknowledged?: boolean
}

export type GoldCountryTripResult = { ok: true } | { ok: false; reason: 'invalid' | 'busy' | 'funds' | 'storage' | 'conflict' }

export function isActiveGoldCountryTrip(trip: GoldCountryTrip | undefined): boolean {
  return trip?.status === 'planned' || trip?.status === 'paid'
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Recompute the saved quote from its original clock/roll; never reroll on load. */
export function readGoldCountryTrip(value: unknown): GoldCountryTrip | undefined {
  if (!record(value) || value.version !== 1 || typeof value.id !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value.id)
    || !['planned', 'paid', 'arrived', 'cancelled'].includes(value.status as string)
    || !record(value.departureClock) || !record(value.quote)) return undefined
  const clock = value.departureClock as unknown as Required<GoldCountryClock>
  if (!getGoldCountryCalendar(clock) || clock.goldCountryDay === undefined || clock.goldCountryMinute === undefined) return undefined
  const savedQuote = value.quote
  const quote = savedQuote as unknown as GoldCountryTransportQuote
  const checked = quoteGoldCountryTransport({ fromId: quote.fromId, toId: quote.toId, mode: quote.mode, clock,
    luck: quote.luck ?? undefined, roll: quote.roll ?? undefined })
  if (!checked.ok || Object.keys(checked.quote).some(key => checked.quote[key as keyof GoldCountryTransportQuote] !== savedQuote[key])) return undefined
  if (value.status === 'planned' && checked.quote.fare === 0) return undefined
  const encounter = TRAVEL_ENCOUNTERS.find(candidate => candidate.id === value.roadEncounterId)
  if (value.roadEncounterId !== null && (!encounter || quote.mode !== 'wagon' || quote.adjacent)) return undefined
  if (value.roadChoiceId !== undefined && !encounter?.choices.some(choice => choice.id === value.roadChoiceId)) return undefined
  if (value.roadOutcomeAcknowledged !== undefined && (typeof value.roadOutcomeAcknowledged !== 'boolean' || !value.roadChoiceId)) return undefined
  return {
    version: 1, id: value.id, status: value.status as GoldCountryTrip['status'],
    departureClock: { day: clock.day, goldCountryDay: clock.goldCountryDay, goldCountryMinute: clock.goldCountryMinute },
    quote: checked.quote, roadEncounterId: value.roadEncounterId as string | null,
    ...(value.roadChoiceId === undefined ? {} : { roadChoiceId: value.roadChoiceId as string }),
    ...(value.roadOutcomeAcknowledged === undefined ? {} : { roadOutcomeAcknowledged: value.roadOutcomeAcknowledged as boolean }),
  }
}

export function tripMatchesDeparture(state: OregonTrailState, trip: GoldCountryTrip): boolean {
  return state.currentGoldCountryLocation === trip.quote.fromId && state.day === trip.departureClock.day
    && (state.goldCountryDay ?? 1) === trip.departureClock.goldCountryDay
    && (state.goldCountryMinute ?? 0) === trip.departureClock.goldCountryMinute
}

/** Old animations did not persist a time/payment marker. Keep the origin and all
 * progress; route selection is the honest recovery when that history is missing. */
export function migrateGoldCountryTrip(state: OregonTrailState): OregonTrailState {
  const trip = readGoldCountryTrip(state.goldCountryTrip)
  const invalid = state.goldCountryTrip !== undefined && !trip
  const inconsistent = trip && isActiveGoldCountryTrip(trip)
    && (!tripMatchesDeparture(state, trip) || state.travelingToLocation !== trip.quote.toId)
  const legacyTravel = state.phase === 'gold_country_travel' && !trip
  if (invalid || inconsistent || legacyTravel) {
    return { ...state, goldCountryTrip: undefined, travelingToLocation: null,
      phase: state.phase === 'gold_country_travel' ? 'gold_country_explore' : state.phase,
      message: 'This road save has no usable travel record. Your town and progress are kept; choose a route to continue.' }
  }
  return { ...state, ...(trip ? { goldCountryTrip: trip } : {}) }
}
