'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// AI Guide mood states
export type GuideMood = 'academic' | 'speculative' | 'humorous' | 'urgent' | 'contemplative'

// Footnote structure (supports recursive footnotes)
export interface Footnote {
  id: string
  text: string
  parentFootnoteId?: string  // For recursive footnotes
  timestamp: number
}

// Translation log entry
export interface Translation {
  id: string
  original: string
  translated: string
  language: string
  confidence: number
  timestamp: number
}

// Encyclopedia entry
export interface EncyclopediaEntry {
  id: string
  title: string
  content: string
  tier: 'gold' | 'silver' | 'bronze'
  viewed: boolean
  unlockedAt: number
}

export interface GuideState {
  currentMood: GuideMood
  footnotes: Footnote[]
  translationLog: Translation[]
  lieDetectionAccuracy: number
  consultationCount: number
  encyclopediaEntries: Record<string, EncyclopediaEntry>
}

interface GuideContextValue {
  state: GuideState

  // Mood management
  setMood: (mood: GuideMood) => void
  getMood: () => GuideMood

  // Footnotes
  addFootnote: (text: string, parentFootnoteId?: string) => Footnote
  getFootnotes: () => Footnote[]
  getFootnoteById: (id: string) => Footnote | undefined
  getFootnoteChain: (footnoteId: string) => Footnote[]

  // Translations
  addTranslation: (original: string, translated: string, language: string, confidence: number) => Translation
  getTranslations: () => Translation[]
  getTranslationsByLanguage: (language: string) => Translation[]

  // Lie detection
  getLieDetectionAccuracy: () => number
  improveLieDetection: (amount: number) => void
  detectLie: (statement: string, actualTruth: boolean) => { detected: boolean; confidence: number }

  // Consultations
  recordConsultation: () => void
  getConsultationCount: () => number

  // Encyclopedia
  addEncyclopediaEntry: (title: string, content: string, tier: 'gold' | 'silver' | 'bronze') => EncyclopediaEntry
  getEncyclopediaEntry: (id: string) => EncyclopediaEntry | undefined
  markEntryViewed: (id: string) => void
  getEntriesByTier: (tier: 'gold' | 'silver' | 'bronze') => EncyclopediaEntry[]
  getAllEntries: () => EncyclopediaEntry[]
  getUnviewedCount: () => number

  // Helpers
  clearFootnotes: () => void
  clearTranslations: () => void
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined)

const initialState: GuideState = {
  currentMood: 'academic',
  footnotes: [],
  translationLog: [],
  lieDetectionAccuracy: 0.7,
  consultationCount: 0,
  encyclopediaEntries: {},
}

const STORAGE_KEY = 'bobr_prologue_guide'

export function GuideProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuideState>(() => {
    if (typeof window === 'undefined') return initialState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as GuideState
      }
    } catch {}
    return initialState
  })

  // Set guide mood
  const setMood = useCallback((mood: GuideMood) => {
    setState(prev => ({
      ...prev,
      currentMood: mood
    }))
  }, [])

  // Get current mood
  const getMood = useCallback((): GuideMood => {
    return state.currentMood
  }, [state.currentMood])

  // Add a footnote (supports recursive footnotes)
  const addFootnote = useCallback((text: string, parentFootnoteId?: string): Footnote => {
    const footnote: Footnote = {
      id: `footnote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      parentFootnoteId,
      timestamp: Date.now()
    }

    setState(prev => ({
      ...prev,
      footnotes: [...prev.footnotes, footnote]
    }))

    return footnote
  }, [])

  // Get all footnotes
  const getFootnotes = useCallback((): Footnote[] => {
    return [...state.footnotes]
  }, [state.footnotes])

  // Get footnote by ID
  const getFootnoteById = useCallback((id: string): Footnote | undefined => {
    return state.footnotes.find(f => f.id === id)
  }, [state.footnotes])

  // Get footnote chain (for recursive footnotes)
  const getFootnoteChain = useCallback((footnoteId: string): Footnote[] => {
    const chain: Footnote[] = []
    let currentId: string | undefined = footnoteId

    while (currentId) {
      const footnote = state.footnotes.find(f => f.id === currentId)
      if (!footnote) break
      chain.push(footnote)
      currentId = footnote.parentFootnoteId
    }

    return chain.reverse()
  }, [state.footnotes])

  // Add a translation
  const addTranslation = useCallback((original: string, translated: string, language: string, confidence: number): Translation => {
    const translation: Translation = {
      id: `translation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      original,
      translated,
      language,
      confidence,
      timestamp: Date.now()
    }

    setState(prev => ({
      ...prev,
      translationLog: [...prev.translationLog, translation]
    }))

    return translation
  }, [])

  // Get all translations
  const getTranslations = useCallback((): Translation[] => {
    return [...state.translationLog]
  }, [state.translationLog])

  // Get translations by language
  const getTranslationsByLanguage = useCallback((language: string): Translation[] => {
    return state.translationLog.filter(t => t.language === language)
  }, [state.translationLog])

  // Get lie detection accuracy
  const getLieDetectionAccuracy = useCallback((): number => {
    return state.lieDetectionAccuracy
  }, [state.lieDetectionAccuracy])

  // Improve lie detection accuracy (improves with Shrewdness)
  const improveLieDetection = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      lieDetectionAccuracy: Math.min(1.0, prev.lieDetectionAccuracy + amount)
    }))
  }, [])

  // Detect if a statement is a lie
  const detectLie = useCallback((statement: string, actualTruth: boolean): { detected: boolean; confidence: number } => {
    const roll = Math.random()
    const detected = roll < state.lieDetectionAccuracy ? !actualTruth : actualTruth
    const confidence = state.lieDetectionAccuracy

    return { detected, confidence }
  }, [state.lieDetectionAccuracy])

  // Record a consultation
  const recordConsultation = useCallback(() => {
    setState(prev => ({
      ...prev,
      consultationCount: prev.consultationCount + 1
    }))
  }, [])

  // Get consultation count
  const getConsultationCount = useCallback((): number => {
    return state.consultationCount
  }, [state.consultationCount])

  // Add encyclopedia entry
  const addEncyclopediaEntry = useCallback((title: string, content: string, tier: 'gold' | 'silver' | 'bronze'): EncyclopediaEntry => {
    const entry: EncyclopediaEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      tier,
      viewed: false,
      unlockedAt: Date.now()
    }

    setState(prev => ({
      ...prev,
      encyclopediaEntries: {
        ...prev.encyclopediaEntries,
        [entry.id]: entry
      }
    }))

    return entry
  }, [])

  // Get encyclopedia entry by ID
  const getEncyclopediaEntry = useCallback((id: string): EncyclopediaEntry | undefined => {
    return state.encyclopediaEntries[id]
  }, [state.encyclopediaEntries])

  // Mark entry as viewed
  const markEntryViewed = useCallback((id: string) => {
    setState(prev => {
      const entry = prev.encyclopediaEntries[id]
      if (!entry) return prev

      return {
        ...prev,
        encyclopediaEntries: {
          ...prev.encyclopediaEntries,
          [id]: { ...entry, viewed: true }
        }
      }
    })
  }, [])

  // Get entries by tier
  const getEntriesByTier = useCallback((tier: 'gold' | 'silver' | 'bronze'): EncyclopediaEntry[] => {
    return Object.values(state.encyclopediaEntries).filter(e => e.tier === tier)
  }, [state.encyclopediaEntries])

  // Get all entries
  const getAllEntries = useCallback((): EncyclopediaEntry[] => {
    return Object.values(state.encyclopediaEntries)
  }, [state.encyclopediaEntries])

  // Get unviewed entry count
  const getUnviewedCount = useCallback((): number => {
    return Object.values(state.encyclopediaEntries).filter(e => !e.viewed).length
  }, [state.encyclopediaEntries])

  // Clear footnotes
  const clearFootnotes = useCallback(() => {
    setState(prev => ({
      ...prev,
      footnotes: []
    }))
  }, [])

  // Clear translations
  const clearTranslations = useCallback(() => {
    setState(prev => ({
      ...prev,
      translationLog: []
    }))
  }, [])

  // Persist guide state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const value: GuideContextValue = {
    state,
    setMood,
    getMood,
    addFootnote,
    getFootnotes,
    getFootnoteById,
    getFootnoteChain,
    addTranslation,
    getTranslations,
    getTranslationsByLanguage,
    getLieDetectionAccuracy,
    improveLieDetection,
    detectLie,
    recordConsultation,
    getConsultationCount,
    addEncyclopediaEntry,
    getEncyclopediaEntry,
    markEntryViewed,
    getEntriesByTier,
    getAllEntries,
    getUnviewedCount,
    clearFootnotes,
    clearTranslations
  }

  return (
    <GuideContext.Provider value={value}>
      {children}
    </GuideContext.Provider>
  )
}

export function useGuide() {
  const context = useContext(GuideContext)
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider')
  }
  return context
}
