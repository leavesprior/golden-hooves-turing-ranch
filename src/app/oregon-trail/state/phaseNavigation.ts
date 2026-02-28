/**
 * Phase navigation — pure state transforms for phase transitions.
 * Covers world map, title flow, ranch, settlement, and direct phase setters.
 */

import type { OregonTrailState, GamePhase } from './types'
import { getCurrentSeason, getDayOfYear } from '../data/ranchConfig'
import { rollMarketEvent } from '../data/seasonalMarket'

// === Direct state setters ===

export function applySetPhase(prev: OregonTrailState, phase: GamePhase): OregonTrailState {
  return { ...prev, phase, previousPhase: prev.phase }
}

export function applySetCurrentLandmark(prev: OregonTrailState, landmark: string): OregonTrailState {
  return { ...prev, currentLandmark: landmark }
}

export function applyOpenWorldMap(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'world_map', previousPhase: prev.phase }
}

// === Title and Chapter flow ===

export function applyStartFromTitle(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'chapter_intro' }
}

export function applyCompleteChapterIntro(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'menu' }
}

// === Ranch management ===

export function applyOpenRanchManagement(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'ranch_management', previousPhase: prev.phase }
}

export function applyCloseRanchManagement(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'town', previousPhase: null }
}

// === Settlement system ===

export function applyEnterSettlement(prev: OregonTrailState): OregonTrailState {
  return {
    ...prev,
    phase: 'gold_country_explore' as GamePhase,
    currentGoldCountryLocation: 'bobr_cabin',
    message: 'Welcome to Gold Country! Explore the Sierra Foothills and build your future.',
  }
}

export function applyLeaveSettlement(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'complete' as GamePhase, message: 'You chose to move on from Gold Country.' }
}

export function applyCompleteSettlement(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'settlement_victory' as GamePhase, message: 'Your journey in Gold Country has come to an end.' }
}

// === Town ===

export function applyVisitTown(prev: OregonTrailState): OregonTrailState {
  const dayOfYear = getDayOfYear(prev.day)
  const season = getCurrentSeason(dayOfYear)
  const stillActive = prev.trailMarketEvent && prev.day <= prev.trailMarketEventEndDay
  const newEvent = !stillActive ? rollMarketEvent(season) : prev.trailMarketEvent
  const newEndDay = newEvent && !stillActive
    ? prev.day + newEvent.duration
    : prev.trailMarketEventEndDay

  return {
    ...prev,
    phase: 'town',
    trailMarketEvent: newEvent,
    trailMarketEventEndDay: newEndDay,
  }
}

export function applyLeaveTown(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'traveling', message: 'You leave town and continue west.' }
}
