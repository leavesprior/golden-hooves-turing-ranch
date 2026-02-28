/**
 * Gold Country actions — pure state transforms for the Gold Country free-roam phase.
 */

import type { OregonTrailState, GamePhase } from './types'

export function applyEnterGoldCountryExplore(prev: OregonTrailState): OregonTrailState {
  return {
    ...prev,
    phase: 'gold_country_explore' as GamePhase,
    currentGoldCountryLocation: 'bobr_cabin',
    message: 'Welcome to Gold Country! Explore the Sierra Foothills and uncover its secrets.',
  }
}

export function applyVisitGoldCountryLocation(prev: OregonTrailState, locationId: string): OregonTrailState {
  return {
    ...prev,
    phase: 'gold_country_location' as GamePhase,
    currentGoldCountryLocation: locationId,
    discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
      ? prev.discoveredGoldLocations
      : [...prev.discoveredGoldLocations, locationId],
  }
}

export function applyStartGoldCountryTravel(prev: OregonTrailState, toLocationId: string): OregonTrailState {
  return {
    ...prev,
    phase: 'gold_country_travel' as GamePhase,
    travelingToLocation: toLocationId,
  }
}

export function applyArriveAtGoldCountryLocation(prev: OregonTrailState, locationId: string): OregonTrailState {
  return {
    ...prev,
    phase: 'gold_country_location' as GamePhase,
    currentGoldCountryLocation: locationId,
    travelingToLocation: null,
    discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
      ? prev.discoveredGoldLocations
      : [...prev.discoveredGoldLocations, locationId],
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
  return { ...prev, goldCountryDay: prev.goldCountryDay + days }
}
