'use client'

/**
 * Game Persistence Hook - Save/Load system for Golden Hooves
 *
 * Saves game state to localStorage so players can continue where they left off.
 * Non-invasive: works alongside existing state management without modification.
 *
 * Storage key: 'golden_hooves_save'
 */

import { useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'golden_hooves_save'
const SETTINGS_KEY = 'golden_hooves_settings'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface SavedGameState {
  version: string
  timestamp: number

  // Core game state
  gamePhase: string
  currentDay: number
  milesRemaining: number
  currentLandmark: string | null

  // Party
  partyMembers: Array<{
    id: string
    name: string
    health: number
    isSick: boolean
    sicknessType?: string
  }>

  // Resources
  food: number
  ammo: number
  medicine: number
  spareParts: number

  // Karma
  neutralKarma: number
  goodKarma: number
  badKarma: number

  // Settings
  pace: string
  rations: string

  // Mystery progress
  outlawsCaught: number
  currentOutlawId: string | null
  cluesGathered: string[]

  // Chapter/narrative
  currentChapter: number

  // Graphics tier
  graphicsTier: string
}

export interface GameSettings {
  musicVolume: number
  sfxVolume: number
  masterVolume: number
  isMuted: boolean
  musicStyle: 'dirty_harry' | 'blazing_saddles' | 'classic_western' | 'eighties' | 'nineties'
}

/**
 * Check if a saved game exists
 */
export function hasSavedGame(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Get summary of saved game for display on title screen
 */
export function getSaveSummary(): {
  lastPlayed: string
  day: number
  miles: number
  party: number
  chapter: number
} | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const state: SavedGameState = JSON.parse(saved)
    return {
      lastPlayed: new Date(state.timestamp).toLocaleDateString(),
      day: state.currentDay,
      miles: state.milesRemaining,
      party: state.partyMembers?.length || 0,
      chapter: state.currentChapter || 1
    }
  } catch {
    return null
  }
}

// Landmark migration map: old Oregon Trail names → new California Trail names
const LANDMARK_MIGRATIONS: Record<string, string> = {
  'Soda Springs': 'Raft River',
  'Fort Hall': 'City of Rocks',
  'Snake River Crossing': 'Humboldt River',
  'Fort Boise': 'Humboldt Sink',
  'Blue Mountains': 'Forty Mile Desert',
  'The Dalles': 'Truckee Pass',
}

/** Migrate old save data to new format */
function migrateSave(state: SavedGameState): SavedGameState {
  // Migrate landmark names
  if (state.currentLandmark && LANDMARK_MIGRATIONS[state.currentLandmark]) {
    state.currentLandmark = LANDMARK_MIGRATIONS[state.currentLandmark]
  }

  // Update version
  state.version = '2.0.0'
  return state
}

/**
 * Load saved game state
 */
export function loadGame(): SavedGameState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    let state: SavedGameState = JSON.parse(saved)

    // Version check for compatibility
    // Migrate if needed (pre-2.0.0 saves have old Oregon Trail landmarks)
    if (!state.version || state.version < '2.0.0') {
      state = migrateSave(state)
      // Re-save migrated state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }

    return state
  } catch (e) {
    return null
  }
}

/**
 * Save game state
 */
export function saveGame(state: Partial<SavedGameState>): boolean {
  if (typeof window === 'undefined') return false
  try {
    const fullState: SavedGameState = {
      version: '2.0.0',
      timestamp: Date.now(),

      // Defaults that get overwritten by state
      gamePhase: 'menu',
      currentDay: 1,
      milesRemaining: 2000,
      currentLandmark: null,
      partyMembers: [],
      food: 0,
      ammo: 0,
      medicine: 0,
      spareParts: 0,
      neutralKarma: 0,
      goodKarma: 0,
      badKarma: 0,
      pace: 'steady',
      rations: 'filling',
      outlawsCaught: 0,
      currentOutlawId: null,
      cluesGathered: [],
      currentChapter: 1,
      graphicsTier: 'retro_4bit',

      ...state
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState))
    return true
  } catch {
    return false
  }
}

/**
 * Delete saved game
 */
export function deleteSave(): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Load settings
 */
export function loadSettings(): GameSettings {
  const defaults: GameSettings = {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    masterVolume: 1.0,
    isMuted: false,
    musicStyle: 'dirty_harry'
  }

  if (typeof window === 'undefined') return defaults

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return defaults
    return { ...defaults, ...JSON.parse(saved) }
  } catch {
    return defaults
  }
}

/**
 * Save settings
 */
export function saveSettings(settings: Partial<GameSettings>): boolean {
  if (typeof window === 'undefined') return false
  try {
    const current = loadSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
    return true
  } catch {
    return false
  }
}

/**
 * Hook for auto-save functionality
 * Call this in your main game component
 */
export function useAutoSave(
  getState: () => Partial<SavedGameState> | null,
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const doSave = useCallback(() => {
    const state = getState()
    if (state && state.gamePhase && state.gamePhase !== 'menu' && state.gamePhase !== 'title') {
      saveGame(state)
    }
  }, [getState])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(doSave, AUTO_SAVE_INTERVAL)

    // Also save on page unload
    const handleUnload = () => doSave()
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [enabled, doSave])

  // Return manual save function
  return { saveNow: doSave }
}
