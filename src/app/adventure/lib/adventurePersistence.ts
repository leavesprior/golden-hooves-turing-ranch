/**
 * Adventure Persistence System
 *
 * Auto-saves adventure state every 30 seconds and on page unload.
 * Handles version migration for backwards compatibility.
 */

import type { GameDifficulty } from '@/app/adventure/lib/difficulty'

const STORAGE_KEY = 'bobr_adventure_state'
const SAVE_VERSION = '1.0.0'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface AdventureQuestState {
  id: string
  status: 'available' | 'active' | 'completed' | 'failed'
  activePath?: string
  completedObjectives: string[]
}

export interface AdventureSaveData {
  version: string
  savedAt: string
  // Player
  playerName: string
  chapter: number
  currentLocationId: string
  // Progress
  discoveredLocations: string[]
  visitedLocations: string[]
  // Quests
  quests: AdventureQuestState[]
  // Flags
  gameFlags: Record<string, boolean>
  // NPC conversation memory
  npcConversations: Record<string, string[]> // npcId -> dialogueIds completed
  // Combat
  confrontationsWon: number
  confrontationsLost: number
  // Stats at save time (for display, not authoritative - rpgContext owns these)
  level?: number
  xp?: number
  gold?: number
  // Difficulty tier (Story/Explorer/Challenger). Optional so pre-facelift
  // saves continue to load without error; migration backfills 'explorer'.
  gameDifficulty?: GameDifficulty
}

/**
 * Save adventure state to localStorage
 */
export function saveAdventureState(data: Omit<AdventureSaveData, 'version' | 'savedAt'>): boolean {
  try {
    const saveData: AdventureSaveData = {
      ...data,
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    return true
  } catch (e) {
    console.error('Failed to save adventure state:', e)
    return false
  }
}

/**
 * Load adventure state from localStorage
 */
export function loadAdventureState(): AdventureSaveData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const data = JSON.parse(stored) as AdventureSaveData
    // Version migration
    if (data.version !== SAVE_VERSION) {
      return migrateAdventureSave(data)
    }
    return data
  } catch (e) {
    console.error('Failed to load adventure state:', e)
    return null
  }
}

/**
 * Clear adventure save
 */
export function clearAdventureState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if a save exists
 */
export function hasAdventureSave(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

/**
 * Migrate from older save versions
 */
function migrateAdventureSave(oldData: Partial<AdventureSaveData>): AdventureSaveData {
  const migrated: AdventureSaveData = {
    version: SAVE_VERSION,
    savedAt: oldData.savedAt ?? new Date().toISOString(),
    playerName: oldData.playerName ?? 'Prospector',
    chapter: oldData.chapter ?? 1,
    currentLocationId: oldData.currentLocationId ?? 'ch1_independence',
    discoveredLocations: oldData.discoveredLocations ?? [],
    visitedLocations: oldData.visitedLocations ?? [],
    quests: oldData.quests ?? [],
    gameFlags: oldData.gameFlags ?? {},
    npcConversations: oldData.npcConversations ?? {},
    confrontationsWon: oldData.confrontationsWon ?? 0,
    confrontationsLost: oldData.confrontationsLost ?? 0,
    level: oldData.level,
    xp: oldData.xp,
    gold: oldData.gold,
    gameDifficulty: oldData.gameDifficulty ?? 'explorer',
  }
  saveAdventureState(migrated)
  return migrated
}

/**
 * Auto-save hook setup
 * Call this in your top-level adventure component.
 * Returns cleanup function.
 */
/**
 * Save a named checkpoint (e.g. chapter completions, camp rests)
 */
export function saveCheckpoint(data: Omit<AdventureSaveData, 'version' | 'savedAt'>, label: string): boolean {
  try {
    const saveData: AdventureSaveData = {
      ...data,
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${STORAGE_KEY}_checkpoint_${label}`, JSON.stringify(saveData))
    return true
  } catch (e) {
    console.error('Failed to save checkpoint:', e)
    return false
  }
}

/**
 * Load a named checkpoint
 */
export function loadCheckpoint(label: string): AdventureSaveData | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_checkpoint_${label}`)
    if (!stored) return null
    return JSON.parse(stored) as AdventureSaveData
  } catch {
    return null
  }
}

export function setupAutoSave(
  getState: () => Omit<AdventureSaveData, 'version' | 'savedAt'> | null,
): () => void {
  // Auto-save on interval
  const interval = setInterval(() => {
    const state = getState()
    if (state) saveAdventureState(state)
  }, AUTO_SAVE_INTERVAL)

  // Save on page unload
  const handleUnload = () => {
    const state = getState()
    if (state) saveAdventureState(state)
  }
  window.addEventListener('beforeunload', handleUnload)

  // Save on visibility change (tab switch)
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      const state = getState()
      if (state) saveAdventureState(state)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  // Cleanup
  return () => {
    clearInterval(interval)
    window.removeEventListener('beforeunload', handleUnload)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}
