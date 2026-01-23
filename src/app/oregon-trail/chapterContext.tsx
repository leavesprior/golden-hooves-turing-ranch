'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  ChapterType,
  MapLocation,
  RandomEncounterZone,
  getLocationById,
  getConnectedLocations,
  getAllLocations,
  CHAPTERS,
} from './data/worldMaps'
import { EasterEgg, checkEasterEggTrigger, EASTER_EGGS } from './data/easterEggs'

// ============================================
// TYPES
// ============================================

export interface ChapterProgress {
  chapter: ChapterType
  currentLocationId: string
  discoveredLocations: Set<string>
  visitedLocations: Set<string>
  visitCounts: Record<string, number>
  totalTravelTime: number
  encountersTriggered: string[]
  easterEggsFound: string[]
  outlawsCaptured: string[]
  choicesMade: ChapterChoice[]
}

export interface ChapterChoice {
  locationId: string
  choiceId: string
  timestamp: number
  consequence?: string
}

export interface TravelResult {
  success: boolean
  timeSpent: number
  encounter?: RandomEncounterZone
  newDiscoveries: string[]
  easterEgg?: EasterEgg
}

export interface ChapterContextValue {
  // State
  progress: ChapterProgress
  isTransitioning: boolean
  canAdvanceChapter: boolean

  // Location Actions
  travelTo: (locationId: string) => TravelResult
  discoverLocation: (locationId: string) => void
  markVisited: (locationId: string) => void

  // Chapter Actions
  advanceChapter: () => void
  resetChapter: () => void
  setChapter: (chapter: ChapterType) => void

  // Progress Queries
  getLocation: (id: string) => MapLocation | undefined
  getAdjacentLocations: () => MapLocation[]
  getDiscoverableLocations: () => MapLocation[]
  isLocationDiscovered: (id: string) => boolean
  isLocationVisited: (id: string) => boolean
  getVisitCount: (id: string) => number

  // Easter Egg Actions
  checkForEasterEggs: (context: EasterEggContext) => EasterEgg | null
  markEasterEggFound: (eggId: string) => void

  // Persistence
  saveProgress: () => void
  loadProgress: () => boolean
  clearProgress: () => void
}

export interface EasterEggContext {
  locationId?: string
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night'
  stats?: Record<string, number>
  karma?: { lawful: number; good: number }
  items?: string[]
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_PROGRESS: ChapterProgress = {
  chapter: 'journey_west',
  currentLocationId: 'independence',
  discoveredLocations: new Set(['independence']),
  visitedLocations: new Set(['independence']),
  visitCounts: { independence: 1 },
  totalTravelTime: 0,
  encountersTriggered: [],
  easterEggsFound: [],
  outlawsCaptured: [],
  choicesMade: [],
}

const STORAGE_KEY = 'prospectors_tale_chapter_progress'

// ============================================
// CONTEXT
// ============================================

const ChapterContext = createContext<ChapterContextValue | null>(null)

export function useChapter(): ChapterContextValue {
  const context = useContext(ChapterContext)
  if (!context) {
    throw new Error('useChapter must be used within ChapterProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

interface ChapterProviderProps {
  children: ReactNode
  initialChapter?: ChapterType
  onChapterComplete?: (chapter: ChapterType) => void
  onEasterEggFound?: (egg: EasterEgg) => void
}

export function ChapterProvider({
  children,
  initialChapter = 'journey_west',
  onChapterComplete,
  onEasterEggFound,
}: ChapterProviderProps) {
  const [progress, setProgress] = useState<ChapterProgress>({
    ...DEFAULT_PROGRESS,
    chapter: initialChapter,
  })
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgressFromStorage()
    if (saved) {
      setProgress(saved)
    }
  }, [])

  // Check if can advance to next chapter
  const canAdvanceChapter = (() => {
    const chapterData = CHAPTERS.find(c => c.id === progress.chapter)
    if (!chapterData) return false

    // Chapter 1: Must reach Sacramento Valley
    if (progress.chapter === 'journey_west') {
      return progress.visitedLocations.has('sacramento_valley')
    }

    // Chapter 2: Must capture or confront Black Bart
    if (progress.chapter === 'gold_country') {
      return progress.outlawsCaptured.includes('black_bart')
    }

    return false
  })()

  // Travel to location
  const travelTo = useCallback((locationId: string): TravelResult => {
    const current = getLocationById(progress.currentLocationId)
    const target = getLocationById(locationId)

    if (!current || !target) {
      return { success: false, timeSpent: 0, newDiscoveries: [] }
    }

    // Check if connected
    if (!current.connectedTo.includes(locationId)) {
      return { success: false, timeSpent: 0, newDiscoveries: [] }
    }

    const timeSpent = target.travelTime
    const newDiscoveries: string[] = []

    // Check for random encounter (20% chance in dangerous areas)
    let encounter: RandomEncounterZone | undefined
    if (target.dangerLevel === 'dangerous' && Math.random() < 0.2) {
      encounter = {
        id: `random_${Date.now()}`,
        name: 'Random Encounter',
        x: (current.x + target.x) / 2,
        y: (current.y + target.y) / 2,
        radius: 5,
        encounterTypes: ['bandit', 'animal', 'traveler'],
        dangerLevel: 'dangerous',
        description: 'Something stirs on the trail...',
      }
    }

    // Update progress
    setProgress(prev => {
      const newDiscovered = new Set(prev.discoveredLocations)
      const newVisited = new Set(prev.visitedLocations)
      const newVisitCounts = { ...prev.visitCounts }
      const newEncounters = [...prev.encountersTriggered]

      // Discover the target location
      if (!newDiscovered.has(locationId)) {
        newDiscovered.add(locationId)
        newDiscoveries.push(locationId)
      }

      // Discover connected locations (fog of war reveal)
      target.connectedTo.forEach(connectedId => {
        if (!newDiscovered.has(connectedId)) {
          newDiscovered.add(connectedId)
          newDiscoveries.push(connectedId)
        }
      })

      // Mark as visited
      newVisited.add(locationId)
      newVisitCounts[locationId] = (newVisitCounts[locationId] || 0) + 1

      // Record encounter
      if (encounter) {
        newEncounters.push(encounter.id)
      }

      return {
        ...prev,
        currentLocationId: locationId,
        discoveredLocations: newDiscovered,
        visitedLocations: newVisited,
        visitCounts: newVisitCounts,
        totalTravelTime: prev.totalTravelTime + timeSpent,
        encountersTriggered: newEncounters,
      }
    })

    return { success: true, timeSpent, encounter, newDiscoveries }
  }, [progress.currentLocationId])

  // Discover location without visiting
  const discoverLocation = useCallback((locationId: string) => {
    setProgress(prev => {
      const newDiscovered = new Set(prev.discoveredLocations)
      newDiscovered.add(locationId)
      return { ...prev, discoveredLocations: newDiscovered }
    })
  }, [])

  // Mark location as visited
  const markVisited = useCallback((locationId: string) => {
    setProgress(prev => {
      const newVisited = new Set(prev.visitedLocations)
      const newVisitCounts = { ...prev.visitCounts }
      newVisited.add(locationId)
      newVisitCounts[locationId] = (newVisitCounts[locationId] || 0) + 1
      return { ...prev, visitedLocations: newVisited, visitCounts: newVisitCounts }
    })
  }, [])

  // Advance to next chapter
  const advanceChapter = useCallback(() => {
    if (!canAdvanceChapter) return

    setIsTransitioning(true)

    const nextChapter: ChapterType = (() => {
      switch (progress.chapter) {
        case 'journey_west': return 'gold_country'
        case 'gold_country': return 'return_visit'
        default: return progress.chapter
      }
    })()

    // Set initial location for new chapter
    const initialLocation: string = (() => {
      switch (nextChapter) {
        case 'gold_country': return 'west_point'
        case 'return_visit': return progress.currentLocationId
        default: return 'independence'
      }
    })()

    if (onChapterComplete) {
      onChapterComplete(progress.chapter)
    }

    setTimeout(() => {
      setProgress(prev => ({
        ...prev,
        chapter: nextChapter,
        currentLocationId: initialLocation,
        discoveredLocations: new Set([...prev.discoveredLocations, initialLocation]),
        visitedLocations: new Set([...prev.visitedLocations, initialLocation]),
      }))
      setIsTransitioning(false)
    }, 1500) // Transition animation time
  }, [canAdvanceChapter, progress.chapter, progress.currentLocationId, onChapterComplete])

  // Reset current chapter
  const resetChapter = useCallback(() => {
    const chapterStart = (() => {
      switch (progress.chapter) {
        case 'journey_west': return 'independence'
        case 'gold_country': return 'west_point'
        default: return progress.currentLocationId
      }
    })()

    setProgress(prev => ({
      ...DEFAULT_PROGRESS,
      chapter: prev.chapter,
      currentLocationId: chapterStart,
      discoveredLocations: new Set([chapterStart]),
      visitedLocations: new Set([chapterStart]),
      visitCounts: { [chapterStart]: 1 },
    }))
  }, [progress.chapter, progress.currentLocationId])

  // Set chapter directly (for testing/debugging)
  const setChapter = useCallback((chapter: ChapterType) => {
    const initialLocation = (() => {
      switch (chapter) {
        case 'journey_west': return 'independence'
        case 'gold_country': return 'west_point'
        default: return 'west_point'
      }
    })()

    setProgress({
      ...DEFAULT_PROGRESS,
      chapter,
      currentLocationId: initialLocation,
      discoveredLocations: new Set([initialLocation]),
      visitedLocations: new Set([initialLocation]),
      visitCounts: { [initialLocation]: 1 },
    })
  }, [])

  // Query helpers
  const getLocation = useCallback((id: string) => getLocationById(id), [])

  const getAdjacentLocations = useCallback(() => {
    return getConnectedLocations(progress.currentLocationId)
  }, [progress.currentLocationId])

  const getDiscoverableLocations = useCallback(() => {
    const current = getLocationById(progress.currentLocationId)
    if (!current) return []

    return current.connectedTo
      .map(id => getLocationById(id))
      .filter((l): l is MapLocation => l !== undefined && !progress.discoveredLocations.has(l.id))
  }, [progress.currentLocationId, progress.discoveredLocations])

  const isLocationDiscovered = useCallback((id: string) => {
    return progress.discoveredLocations.has(id)
  }, [progress.discoveredLocations])

  const isLocationVisited = useCallback((id: string) => {
    return progress.visitedLocations.has(id)
  }, [progress.visitedLocations])

  const getVisitCount = useCallback((id: string) => {
    return progress.visitCounts[id] || 0
  }, [progress.visitCounts])

  // Easter egg checking
  const checkForEasterEggs = useCallback((context: EasterEggContext): EasterEgg | null => {
    const fullContext = {
      ...context,
      outlawsCaptured: progress.outlawsCaptured,
      chapter: progress.chapter === 'journey_west' ? 1 : progress.chapter === 'gold_country' ? 2 : 3,
      visitCounts: progress.visitCounts,
    }

    for (const egg of EASTER_EGGS) {
      if (progress.easterEggsFound.includes(egg.id)) continue
      if (checkEasterEggTrigger(egg, fullContext)) {
        return egg
      }
    }
    return null
  }, [progress.easterEggsFound, progress.outlawsCaptured, progress.chapter, progress.visitCounts])

  const markEasterEggFound = useCallback((eggId: string) => {
    const egg = EASTER_EGGS.find(e => e.id === eggId)

    setProgress(prev => ({
      ...prev,
      easterEggsFound: [...prev.easterEggsFound, eggId],
    }))

    if (egg && onEasterEggFound) {
      onEasterEggFound(egg)
    }
  }, [onEasterEggFound])

  // Persistence
  const saveProgress = useCallback(() => {
    const serializable = {
      ...progress,
      discoveredLocations: Array.from(progress.discoveredLocations),
      visitedLocations: Array.from(progress.visitedLocations),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch (e) {
      console.error('Failed to save chapter progress:', e)
    }
  }, [progress])

  const loadProgress = useCallback((): boolean => {
    const saved = loadProgressFromStorage()
    if (saved) {
      setProgress(saved)
      return true
    }
    return false
  }, [])

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear chapter progress:', e)
    }
    setProgress({ ...DEFAULT_PROGRESS })
  }, [])

  // Auto-save on progress changes
  useEffect(() => {
    const timeoutId = setTimeout(saveProgress, 1000)
    return () => clearTimeout(timeoutId)
  }, [progress, saveProgress])

  const value: ChapterContextValue = {
    progress,
    isTransitioning,
    canAdvanceChapter,
    travelTo,
    discoverLocation,
    markVisited,
    advanceChapter,
    resetChapter,
    setChapter,
    getLocation,
    getAdjacentLocations,
    getDiscoverableLocations,
    isLocationDiscovered,
    isLocationVisited,
    getVisitCount,
    checkForEasterEggs,
    markEasterEggFound,
    saveProgress,
    loadProgress,
    clearProgress,
  }

  return (
    <ChapterContext.Provider value={value}>
      {children}
    </ChapterContext.Provider>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function loadProgressFromStorage(): ChapterProgress | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const parsed = JSON.parse(saved)
    return {
      ...parsed,
      discoveredLocations: new Set(parsed.discoveredLocations || []),
      visitedLocations: new Set(parsed.visitedLocations || []),
    }
  } catch (e) {
    console.error('Failed to load chapter progress:', e)
    return null
  }
}

// ============================================
// CHAPTER TRANSITION OVERLAY
// ============================================

interface ChapterTransitionProps {
  isVisible: boolean
  fromChapter: ChapterType
  toChapter: ChapterType
}

export function ChapterTransition({ isVisible, fromChapter, toChapter }: ChapterTransitionProps) {
  if (!isVisible) return null

  const chapterNames = {
    journey_west: 'Journey West',
    gold_country: 'Gold Country',
    return_visit: 'The Long Road Home',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center animate-fade-in">
        <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-sm mb-4">
          {chapterNames[fromChapter]} Complete
        </div>
        <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-2xl mb-2">
          Chapter {toChapter === 'gold_country' ? '2' : '3'}
        </div>
        <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-mid)] text-lg">
          {chapterNames[toChapter]}
        </div>
        <div className="mt-8 w-32 h-1 bg-[var(--pixel-ui-border)] mx-auto overflow-hidden">
          <div className="h-full bg-[var(--pixel-gold-light)] animate-load-bar" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes load-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-load-bar {
          animation: load-bar 1.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

export default ChapterProvider
