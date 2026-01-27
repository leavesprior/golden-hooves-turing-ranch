'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useAuth } from './authContext'

/**
 * Golden Frog Trail - Save/Load System
 *
 * Persists game state per user with multiple save slots
 */

export interface SaveSlot {
  id: string
  name: string
  userId: string
  timestamp: string
  gameData: GameSaveData
  metadata: SaveMetadata
}

export interface SaveMetadata {
  dayNumber: number
  distance: number
  currentLocation: string
  partySize: number
  karmaAlignment: string
  playTime: number // minutes
}

export interface GameSaveData {
  // Oregon Trail state
  oregonTrail?: object
  // Karma state
  karma?: object
  // RPG context
  rpg?: object
  // Ranch state
  ranch?: object
  // Settlement state
  settlement?: object
  // Mystery progress
  mystery?: object
  // Chapter progress
  chapter?: object
  // Any additional state
  [key: string]: object | undefined
}

interface SaveLoadContextType {
  // Save slots
  saves: SaveSlot[]
  currentSlotId: string | null

  // Operations
  saveGame: (name?: string, slotId?: string) => Promise<{ success: boolean; error?: string; slotId?: string }>
  loadGame: (slotId: string) => Promise<{ success: boolean; error?: string; data?: GameSaveData }>
  deleteSave: (slotId: string) => Promise<boolean>
  renameSave: (slotId: string, newName: string) => Promise<boolean>

  // Auto-save
  enableAutoSave: boolean
  setEnableAutoSave: (enabled: boolean) => void
  autoSaveInterval: number // minutes

  // State for UI
  isSaving: boolean
  isLoading: boolean
  lastSaveTime: string | null

  // Game data collection (to be set by game components)
  setGameDataCollector: (collector: () => GameSaveData) => void
  setGameDataLoader: (loader: (data: GameSaveData) => void) => void
  setMetadataCollector: (collector: () => SaveMetadata) => void
}

const SaveLoadContext = createContext<SaveLoadContextType | undefined>(undefined)

const SAVES_STORAGE_KEY = 'golden_frog_saves'
const AUTOSAVE_KEY = 'golden_frog_autosave_enabled'
const MAX_SAVES_PER_USER = 10
const AUTOSAVE_INTERVAL_MINUTES = 5

export function SaveLoadProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [saves, setSaves] = useState<SaveSlot[]>([])
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null)
  const [enableAutoSave, setEnableAutoSave] = useState(true)

  // Collector functions set by game components
  const [gameDataCollector, setGameDataCollectorState] = useState<(() => GameSaveData) | null>(null)
  const [gameDataLoader, setGameDataLoaderState] = useState<((data: GameSaveData) => void) | null>(null)
  const [metadataCollector, setMetadataCollectorState] = useState<(() => SaveMetadata) | null>(null)

  // Wrapper to store functions without React calling them
  const setGameDataCollector = useCallback((collector: () => GameSaveData) => {
    setGameDataCollectorState(() => collector)
  }, [])

  const setGameDataLoader = useCallback((loader: (data: GameSaveData) => void) => {
    setGameDataLoaderState(() => loader)
  }, [])

  const setMetadataCollector = useCallback((collector: () => SaveMetadata) => {
    setMetadataCollectorState(() => collector)
  }, [])

  // Load saves for current user
  useEffect(() => {
    if (!user) {
      setSaves([])
      return
    }

    try {
      const allSaves = JSON.parse(localStorage.getItem(SAVES_STORAGE_KEY) || '[]') as SaveSlot[]
      const userSaves = allSaves.filter(s => s.userId === user.id)
      setSaves(userSaves)
    } catch (e) {
      console.error('Failed to load saves:', e)
      setSaves([])
    }

    // Load autosave preference
    const autoSavePref = localStorage.getItem(AUTOSAVE_KEY)
    if (autoSavePref !== null) {
      setEnableAutoSave(autoSavePref === 'true')
    }
  }, [user])

  // Save autosave preference
  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, String(enableAutoSave))
  }, [enableAutoSave])

  // Auto-save timer
  useEffect(() => {
    if (!enableAutoSave || !isAuthenticated || !gameDataCollector) return

    const interval = setInterval(() => {
      saveGame('Auto-Save', 'autosave')
    }, AUTOSAVE_INTERVAL_MINUTES * 60 * 1000)

    return () => clearInterval(interval)
  }, [enableAutoSave, isAuthenticated, gameDataCollector])

  // Save game
  const saveGame = useCallback(async (
    name?: string,
    slotId?: string
  ): Promise<{ success: boolean; error?: string; slotId?: string }> => {
    if (!user) {
      return { success: false, error: 'Must be logged in to save' }
    }

    if (!gameDataCollector) {
      return { success: false, error: 'Game not ready for saving' }
    }

    setIsSaving(true)

    try {
      const gameData = gameDataCollector()
      const metadata = metadataCollector?.() || {
        dayNumber: 1,
        distance: 0,
        currentLocation: 'Starting',
        partySize: 1,
        karmaAlignment: 'Neutral',
        playTime: 0,
      }

      const allSaves = JSON.parse(localStorage.getItem(SAVES_STORAGE_KEY) || '[]') as SaveSlot[]
      const userSaves = allSaves.filter(s => s.userId === user.id)
      const otherSaves = allSaves.filter(s => s.userId !== user.id)

      const timestamp = new Date().toISOString()
      const finalSlotId = slotId || `save_${Date.now()}`
      const finalName = name || `Save ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`

      // Check for existing slot (update) or new slot
      const existingIndex = userSaves.findIndex(s => s.id === finalSlotId)

      const newSlot: SaveSlot = {
        id: finalSlotId,
        name: finalName,
        userId: user.id,
        timestamp,
        gameData,
        metadata,
      }

      let updatedUserSaves: SaveSlot[]
      if (existingIndex >= 0) {
        // Update existing
        updatedUserSaves = [...userSaves]
        updatedUserSaves[existingIndex] = newSlot
      } else {
        // Check max saves
        if (userSaves.length >= MAX_SAVES_PER_USER) {
          // Remove oldest (excluding autosave)
          const sortedSaves = [...userSaves]
            .filter(s => s.id !== 'autosave')
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          if (sortedSaves.length > 0) {
            const oldestId = sortedSaves[0].id
            updatedUserSaves = userSaves.filter(s => s.id !== oldestId)
          } else {
            updatedUserSaves = userSaves
          }
        } else {
          updatedUserSaves = userSaves
        }
        updatedUserSaves.push(newSlot)
      }

      localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify([...otherSaves, ...updatedUserSaves]))
      setSaves(updatedUserSaves)
      setCurrentSlotId(finalSlotId)
      setLastSaveTime(timestamp)

      return { success: true, slotId: finalSlotId }
    } catch (e) {
      console.error('Save failed:', e)
      return { success: false, error: 'Failed to save game' }
    } finally {
      setIsSaving(false)
    }
  }, [user, gameDataCollector, metadataCollector])

  // Load game
  const loadGame = useCallback(async (
    slotId: string
  ): Promise<{ success: boolean; error?: string; data?: GameSaveData }> => {
    if (!user) {
      return { success: false, error: 'Must be logged in to load' }
    }

    if (!gameDataLoader) {
      return { success: false, error: 'Game not ready for loading' }
    }

    setIsLoading(true)

    try {
      const save = saves.find(s => s.id === slotId)
      if (!save) {
        return { success: false, error: 'Save not found' }
      }

      gameDataLoader(save.gameData)
      setCurrentSlotId(slotId)

      return { success: true, data: save.gameData }
    } catch (e) {
      console.error('Load failed:', e)
      return { success: false, error: 'Failed to load game' }
    } finally {
      setIsLoading(false)
    }
  }, [user, saves, gameDataLoader])

  // Delete save
  const deleteSave = useCallback(async (slotId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const allSaves = JSON.parse(localStorage.getItem(SAVES_STORAGE_KEY) || '[]') as SaveSlot[]
      const filtered = allSaves.filter(s => !(s.id === slotId && s.userId === user.id))
      localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(filtered))
      setSaves(filtered.filter(s => s.userId === user.id))

      if (currentSlotId === slotId) {
        setCurrentSlotId(null)
      }

      return true
    } catch (e) {
      console.error('Delete failed:', e)
      return false
    }
  }, [user, currentSlotId])

  // Rename save
  const renameSave = useCallback(async (slotId: string, newName: string): Promise<boolean> => {
    if (!user) return false

    try {
      const allSaves = JSON.parse(localStorage.getItem(SAVES_STORAGE_KEY) || '[]') as SaveSlot[]
      const saveIndex = allSaves.findIndex(s => s.id === slotId && s.userId === user.id)

      if (saveIndex < 0) return false

      allSaves[saveIndex].name = newName
      localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(allSaves))
      setSaves(allSaves.filter(s => s.userId === user.id))

      return true
    } catch (e) {
      console.error('Rename failed:', e)
      return false
    }
  }, [user])

  return (
    <SaveLoadContext.Provider
      value={{
        saves,
        currentSlotId,
        saveGame,
        loadGame,
        deleteSave,
        renameSave,
        enableAutoSave,
        setEnableAutoSave,
        autoSaveInterval: AUTOSAVE_INTERVAL_MINUTES,
        isSaving,
        isLoading,
        lastSaveTime,
        setGameDataCollector,
        setGameDataLoader,
        setMetadataCollector,
      }}
    >
      {children}
    </SaveLoadContext.Provider>
  )
}

export function useSaveLoad() {
  const context = useContext(SaveLoadContext)
  if (context === undefined) {
    throw new Error('useSaveLoad must be used within a SaveLoadProvider')
  }
  return context
}
