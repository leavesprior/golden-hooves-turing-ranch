/**
 * Gold Country actions — pure state transforms for the Gold Country free-roam phase.
 */

import type { OregonTrailState, GamePhase } from './types'
import { LEVEL2_CASE_IDS } from '@/lib/goldCountryLevel2'
import { trailWeatherForDay } from '@/lib/goldCountryWeather'
import { advanceGoldCountryClock } from '@/lib/goldCountryTransport'
import { getGoldCountryLocation } from '../data/goldCountryLocations'
import { TRAVEL_ENCOUNTERS } from '../data/goldCountryEncounters'
import { isActiveGoldCountryTrip, readGoldCountryTrip, tripMatchesDeparture, type GoldCountryTrip } from './goldCountryTrip'

export function applyEnterGoldCountryExplore(prev: OregonTrailState): OregonTrailState {
  if (isActiveGoldCountryTrip(prev.goldCountryTrip)) return prev
  return {
    ...prev,
    phase: 'gold_country_explore' as GamePhase,
    currentGoldCountryLocation: 'bobr_cabin',
    discoveredGoldLocations: Array.from(new Set([...(prev.discoveredGoldLocations || []), ...LEVEL2_CASE_IDS])),
    message: 'Level 2 — Explore the Gold Country. Stamp five cases on the painted map.',
  }
}

export function applyVisitGoldCountryLocation(prev: OregonTrailState, locationId: string): OregonTrailState {
  // Enter the current street only. Every different town uses the travel/arrival path.
  if (locationId !== prev.currentGoldCountryLocation || !getGoldCountryLocation(locationId) || isActiveGoldCountryTrip(prev.goldCountryTrip)) return prev
  return {
    ...prev,
    phase: 'gold_country_location' as GamePhase,
    currentGoldCountryLocation: locationId,
    discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
      ? prev.discoveredGoldLocations
      : [...prev.discoveredGoldLocations, locationId],
  }
}

export function applyStartGoldCountryTravel(prev: OregonTrailState, candidate: GoldCountryTrip): OregonTrailState {
  const trip = readGoldCountryTrip(candidate)
  if (!trip || isActiveGoldCountryTrip(prev.goldCountryTrip) || !tripMatchesDeparture(prev, trip)
    || !['gold_country_explore', 'gold_country_location'].includes(prev.phase)
    || trip.status !== (trip.quote.fare > 0 ? 'planned' : 'paid')) return prev
  return { ...prev, phase: 'gold_country_travel', travelingToLocation: trip.quote.toId, goldCountryTrip: trip }
}

export function applyPayGoldCountryTravel(prev: OregonTrailState, tripId: string): OregonTrailState {
  const trip = prev.goldCountryTrip
  if (!trip || trip.id !== tripId || trip.status !== 'planned' || !tripMatchesDeparture(prev, trip)) return prev
  return { ...prev, goldCountryTrip: { ...trip, status: 'paid' } }
}

export function applyCancelGoldCountryTravel(prev: OregonTrailState, tripId: string): OregonTrailState {
  const trip = prev.goldCountryTrip
  if (!trip || trip.id !== tripId || !isActiveGoldCountryTrip(trip)) return prev
  return { ...prev, phase: 'gold_country_explore', travelingToLocation: null,
    goldCountryTrip: { ...trip, status: 'cancelled' },
    message: trip.quote.fare > 0 && trip.status === 'paid' ? 'You returned to the departure town. The used fare is not refunded.' : 'You returned to the departure town.' }
}

export function applyChooseGoldCountryRoadEncounter(prev: OregonTrailState, tripId: string, choiceId: string): OregonTrailState {
  const trip = prev.goldCountryTrip
  if (!trip || trip.id !== tripId || trip.status !== 'paid' || trip.roadChoiceId) return prev
  const choice = TRAVEL_ENCOUNTERS.find(encounter => encounter.id === trip.roadEncounterId)?.choices.find(item => item.id === choiceId)
  if (!choice || (choice.requiresItem && !prev.inventory.includes(choice.requiresItem))) return prev
  return { ...prev, goldCountryTrip: { ...trip, roadChoiceId: choiceId } }
}

export function applyContinueGoldCountryRoadEncounter(prev: OregonTrailState, tripId: string): OregonTrailState {
  const trip = prev.goldCountryTrip
  if (!trip || trip.id !== tripId || trip.status !== 'paid' || !trip.roadChoiceId || trip.roadOutcomeAcknowledged) return prev
  return { ...prev, goldCountryTrip: { ...trip, roadOutcomeAcknowledged: true } }
}

export function applyArriveAtGoldCountryLocation(prev: OregonTrailState, locationId: string, tripId: string): OregonTrailState {
  const trip = prev.goldCountryTrip
  if (!trip || trip.id !== tripId || trip.status !== 'paid' || locationId !== trip.quote.toId
    || prev.phase !== 'gold_country_travel' || !tripMatchesDeparture(prev, trip)
    || (trip.roadEncounterId && !trip.roadOutcomeAcknowledged)) return prev
  const clock = advanceGoldCountryClock(prev, trip.quote.durationMinutes)
  if (!clock) return prev
  return {
    ...prev, ...clock,
    weather: clock.goldCountryDay === prev.goldCountryDay ? prev.weather : trailWeatherForDay(clock.goldCountryDay),
    phase: 'gold_country_location', currentGoldCountryLocation: locationId, travelingToLocation: null,
    goldCountryTrip: { ...trip, status: 'arrived' },
    message: trip.quote.message,
    discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
      ? prev.discoveredGoldLocations : [...prev.discoveredGoldLocations, locationId],
  }
}

export function applyReturnToGoldCountryMap(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'gold_country_explore' as GamePhase }
}

export function applyDiscoverLocation(prev: OregonTrailState, locationId: string): OregonTrailState {
  return {
    ...prev,
    discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
      ? prev.discoveredGoldLocations
      : [...prev.discoveredGoldLocations, locationId],
  }
}

export function applyCompleteQuest(prev: OregonTrailState, questId: string): OregonTrailState {
  return {
    ...prev,
    completedQuests: prev.completedQuests.includes(questId)
      ? prev.completedQuests
      : [...prev.completedQuests, questId],
  }
}

/** State-only part of completeQuestWithReward. Karma side effects handled by the callback wrapper. */
export function applyCompleteQuestState(
  prev: OregonTrailState,
  questId: string,
  rewardItem?: string,
): OregonTrailState {
  return {
    ...prev,
    completedQuests: prev.completedQuests.includes(questId)
      ? prev.completedQuests
      : [...prev.completedQuests, questId],
    inventory: rewardItem ? [...prev.inventory, rewardItem] : prev.inventory,
  }
}

export function applyMarkAreaSearched(prev: OregonTrailState, areaId: string): OregonTrailState {
  return {
    ...prev,
    searchedAreas: prev.searchedAreas.includes(areaId)
      ? prev.searchedAreas
      : [...prev.searchedAreas, areaId],
  }
}

export function applyAddInventoryItem(prev: OregonTrailState, itemId: string): OregonTrailState {
  return { ...prev, inventory: [...prev.inventory, itemId] }
}

export function applyAdvanceGoldCountryDay(prev: OregonTrailState, days: number): OregonTrailState {
  if (!Number.isSafeInteger(days) || days <= 0 || isActiveGoldCountryTrip(prev.goldCountryTrip)) return prev
  const clock = advanceGoldCountryClock(prev, days * 1440)
  if (!clock) return prev
  return { ...prev, ...clock, weather: trailWeatherForDay(clock.goldCountryDay) }
}
