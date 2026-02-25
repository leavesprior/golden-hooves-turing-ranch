'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  type TownMystery,
  TOWN_MYSTERIES,
  isDeductionUnlocked,
  attemptDeduction,
} from './data/townMysteries'

// ============================================
// TYPES
// ============================================

export type AttractionCategory = 'history' | 'dining' | 'adventure' | 'nature' | 'mystery' | 'entertainment'

export interface Attraction {
  id: string
  name: string
  icon: string
  category: AttractionCategory
  description: string
  funFact: string           // Disney-style "did you know?"
  insiderTip: string        // Local knowledge
  duration?: string         // "30 min", "Half day"
  secretUnlock?: string     // Hidden until discovered
  xp: number               // Experience points
  badge?: Badge
  coordinates?: { lat: number; lng: number }
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  unlockedAt?: number       // Timestamp when earned
}

export interface Town {
  id: string
  name: string
  tagline: string           // "The Town That Wouldn't Die"
  description: string
  attractions: Attraction[]
  secretAttractions: Attraction[]
  townStory: string
  coordinates: { lat: number; lng: number }
  image?: string
}

export interface ExplorerLevel {
  level: number
  title: string
  xpRequired: number
  icon: string
  perks: string[]
}

export interface Challenge {
  id: string
  name: string
  description: string
  type: 'visit' | 'collect' | 'discover' | 'complete'
  target: number
  progress: number
  reward: {
    xp: number
    badge?: Badge
  }
  completed: boolean
}

export interface MysteryProgressEntry {
  mysteryId: string
  cluesFound: string[]
  solved: boolean
  attempts: number
  solvedAt?: number
}

export interface ExplorerProgress {
  totalXP: number
  level: number
  visitedAttractions: string[]
  visitedTowns: string[]
  unlockedSecrets: string[]
  badges: Badge[]
  challenges: Challenge[]
  favoriteAttractions: string[]
  lastVisitedTown?: string
  streakDays: number
  lastPlayDate?: string
  mysteries: MysteryProgressEntry[]
}

export interface ExplorerContextValue {
  // Progress State
  progress: ExplorerProgress
  currentLevel: ExplorerLevel
  xpToNextLevel: number
  progressPercent: number

  // Town & Attraction Actions
  visitAttraction: (attractionId: string, townId: string) => { xpGained: number; levelUp: boolean; badgeEarned?: Badge }
  visitTown: (townId: string) => void
  unlockSecret: (secretId: string) => { xpGained: number; attraction: Attraction | null }
  toggleFavorite: (attractionId: string) => void

  // Badge & Challenge Actions
  checkForBadges: () => Badge[]
  updateChallengeProgress: (challengeId: string, increment?: number) => void
  getActiveChallenges: () => Challenge[]
  getCompletedChallenges: () => Challenge[]

  // Query Helpers
  isAttractionVisited: (attractionId: string) => boolean
  isTownVisited: (townId: string) => boolean
  isSecretUnlocked: (secretId: string) => boolean
  isFavorite: (attractionId: string) => boolean
  getTownCompletionPercent: (townId: string) => number

  // Persistence
  saveProgress: () => void
  loadProgress: () => boolean
  resetProgress: () => void

  // Mystery Deduction (Carmen Sandiego style)
  discoverClue: (mysteryId: string, clueId: string) => { xpGained: number; isNew: boolean }
  attemptMysteryDeduction: (mysteryId: string, optionId: string) => { correct: boolean; response: string; xpReward: number }
  getMysteryProgress: (mysteryId: string) => MysteryProgressEntry | null
  getAllMysteryProgress: () => MysteryProgressEntry[]
  isMysteryClueFound: (mysteryId: string, clueId: string) => boolean
  isMysteryDeductionUnlocked: (mysteryId: string) => boolean
  isMysterySolved: (mysteryId: string) => boolean

  // Gamification Helpers
  getRandomTobiasTip: () => string
  checkStreak: () => { maintained: boolean; newStreak: number }
}

// ============================================
// CONSTANTS
// ============================================

export const EXPLORER_LEVELS: ExplorerLevel[] = [
  { level: 1, title: 'Tenderfoot', xpRequired: 0, icon: '🥾', perks: ['Access to all basic attractions'] },
  { level: 2, title: 'Prospector', xpRequired: 100, icon: '⛏️', perks: ['See insider tips', 'Unlock first secret'] },
  { level: 3, title: 'Forty-Niner', xpRequired: 300, icon: '🪙', perks: ['Access to hidden trails', 'Tobias appears more often'] },
  { level: 4, title: 'Gold Country Guide', xpRequired: 600, icon: '🗺️', perks: ['All secrets visible', 'Special badge unlocks'] },
  { level: 5, title: 'Mother Lode Master', xpRequired: 1000, icon: '💎', perks: ['Legendary locations revealed', 'VIP tips'] },
  { level: 6, title: 'Legendary Explorer', xpRequired: 1500, icon: '👑', perks: ['All content unlocked', 'Exclusive badge'] },
]

export const CATEGORY_BADGES: Record<AttractionCategory, Badge> = {
  history: { id: 'historian', name: 'Gold Rush Historian', icon: '📜', description: 'Visited all history sites', rarity: 'rare' },
  dining: { id: 'gourmand', name: 'Gold Country Gourmand', icon: '🍽️', description: 'Tried all dining spots', rarity: 'uncommon' },
  adventure: { id: 'adventurer', name: 'Sierra Adventurer', icon: '🏔️', description: 'Completed all adventure activities', rarity: 'rare' },
  nature: { id: 'naturalist', name: 'Mother Lode Naturalist', icon: '🌲', description: 'Explored all nature sites', rarity: 'uncommon' },
  mystery: { id: 'detective', name: 'Mystery Detective', icon: '🔍', description: 'Solved all mysteries', rarity: 'legendary' },
  entertainment: { id: 'showgoer', name: 'Frontier Showgoer', icon: '🎭', description: 'Attended all entertainment venues', rarity: 'common' },
}

export const COLLECTION_BADGES: Badge[] = [
  { id: 'ghost_towns', name: 'Ghost Town Explorer', icon: '👻', description: 'Visit all ghost towns', rarity: 'rare' },
  { id: 'haunted_hotels', name: 'Paranormal Investigator', icon: '🏚️', description: 'Stay at all haunted hotels', rarity: 'legendary' },
  { id: 'twain_trail', name: 'Mark Twain Trail', icon: '📚', description: 'Visit all Twain-related sites', rarity: 'rare' },
  { id: 'black_bart', name: 'Black Bart Hunter', icon: '🎭', description: 'Complete the Black Bart mystery trail', rarity: 'legendary' },
  { id: 'mine_explorer', name: 'Deep Earth Diver', icon: '⛏️', description: 'Visit all historic mines', rarity: 'uncommon' },
  { id: 'first_visit', name: 'First Steps', icon: '👣', description: 'Visit your first attraction', rarity: 'common' },
  { id: 'town_complete', name: 'Town Completionist', icon: '🏘️', description: 'Visit all attractions in one town', rarity: 'uncommon' },
  { id: 'secret_finder', name: 'Secret Seeker', icon: '🔮', description: 'Find your first secret attraction', rarity: 'uncommon' },
  { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: 'Maintain a 7-day exploration streak', rarity: 'rare' },
  { id: 'streak_30', name: 'Month Master', icon: '⚡', description: 'Maintain a 30-day exploration streak', rarity: 'legendary' },
  // Mystery badges (awarded on solve)
  { id: 'mystery_volcano', name: 'Cannon Detective', icon: '💣', description: 'Solved the mystery of Old Abe', rarity: 'uncommon' },
  { id: 'mystery_angels', name: 'Frog Sleuth', icon: '🐸', description: 'Uncovered the truth behind the Jumping Frog', rarity: 'rare' },
  { id: 'mystery_westpoint', name: 'Bart Tracker', icon: '🎭', description: 'Cracked Black Bart\'s last case', rarity: 'rare' },
  { id: 'mystery_mokehill', name: 'Murder Historian', icon: '💀', description: 'Solved the Murder Capital mystery', rarity: 'legendary' },
  { id: 'mystery_jackson', name: 'Arson Investigator', icon: '🔥', description: 'Exposed the Great Fire of Jackson', rarity: 'legendary' },
]

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'visit_3_towns',
    name: 'Town Hopper',
    description: 'Visit 3 different towns',
    type: 'visit',
    target: 3,
    progress: 0,
    reward: { xp: 50 },
    completed: false,
  },
  {
    id: 'black_bart_trail',
    name: 'Black Bart Mystery Trail',
    description: 'Visit all locations connected to Black Bart',
    type: 'complete',
    target: 4,
    progress: 0,
    reward: { xp: 200, badge: COLLECTION_BADGES.find(b => b.id === 'black_bart') },
    completed: false,
  },
  {
    id: 'find_5_secrets',
    name: 'Secret Hunter',
    description: 'Discover 5 hidden attractions',
    type: 'discover',
    target: 5,
    progress: 0,
    reward: { xp: 150 },
    completed: false,
  },
  {
    id: 'complete_volcano',
    name: 'Volcano Complete',
    description: 'Visit all attractions in Volcano',
    type: 'complete',
    target: 6,
    progress: 0,
    reward: { xp: 100 },
    completed: false,
  },
  {
    id: 'history_buff',
    name: 'History Buff',
    description: 'Visit 10 history sites',
    type: 'collect',
    target: 10,
    progress: 0,
    reward: { xp: 100, badge: CATEGORY_BADGES.history },
    completed: false,
  },
]

const TOBIAS_TIPS = [
  "Did ye know the Kennedy Mine in Jackson goes down 5,912 feet? That's deeper than a mile!",
  "Black Bart robbed 28 stagecoaches and never fired a shot. A gentleman bandit, they called him.",
  "Mark Twain wrote his famous Jumping Frog story right here in Angels Camp!",
  "Volcano once had 17,000 people. Now? About 85 souls remain.",
  "The Hotel Leger in Mokelumne Hill is said to be haunted by George Leger himself!",
  "Look for the Chinese tunnels beneath Volcano - they're still there if ye know where to look.",
  "West Point was named by Kit Carson during his 1844 expedition through the Sierra foothills!",
  "The laundry mark that caught Black Bart? F.X.O.7 - traced to a San Francisco laundry.",
  "Carson Hill produced the largest gold nugget in California - 195 pounds!",
  "Old Abe, the cannon in Volcano, was going to be used in the Civil War but never fired.",
]

const STORAGE_KEY = 'gold_country_explorer_progress'

// ============================================
// DEFAULT STATE
// ============================================

const DEFAULT_PROGRESS: ExplorerProgress = {
  totalXP: 0,
  level: 1,
  visitedAttractions: [],
  visitedTowns: [],
  unlockedSecrets: [],
  badges: [],
  challenges: DEFAULT_CHALLENGES,
  favoriteAttractions: [],
  streakDays: 0,
  mysteries: [],
}

// ============================================
// CONTEXT
// ============================================

const ExplorerContext = createContext<ExplorerContextValue | null>(null)

export function useExplorer(): ExplorerContextValue {
  const context = useContext(ExplorerContext)
  if (!context) {
    throw new Error('useExplorer must be used within ExplorerProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

interface ExplorerProviderProps {
  children: ReactNode
  towns: Town[]
  onLevelUp?: (level: ExplorerLevel) => void
  onBadgeEarned?: (badge: Badge) => void
  onSecretUnlocked?: (attraction: Attraction) => void
}

export function ExplorerProvider({
  children,
  towns,
  onLevelUp,
  onBadgeEarned,
  onSecretUnlocked,
}: ExplorerProviderProps) {
  const [progress, setProgress] = useState<ExplorerProgress>(DEFAULT_PROGRESS)

  // Load saved progress on mount
  useEffect(() => {
    loadProgressFromStorage()
  }, [])

  // Calculate current level info
  const currentLevel = EXPLORER_LEVELS.reduce((acc, level) => {
    if (progress.totalXP >= level.xpRequired) return level
    return acc
  }, EXPLORER_LEVELS[0])

  const nextLevel = EXPLORER_LEVELS.find(l => l.level === currentLevel.level + 1)
  const xpToNextLevel = nextLevel ? nextLevel.xpRequired - progress.totalXP : 0
  const progressPercent = nextLevel
    ? ((progress.totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100

  // Helper to get all attractions across all towns
  const getAllAttractions = useCallback((): Attraction[] => {
    return towns.flatMap(t => [...t.attractions, ...t.secretAttractions])
  }, [towns])

  // Visit attraction
  const visitAttraction = useCallback((attractionId: string, townId: string) => {
    let xpGained = 0
    let levelUp = false
    let badgeEarned: Badge | undefined

    setProgress(prev => {
      if (prev.visitedAttractions.includes(attractionId)) {
        return prev // Already visited
      }

      const attraction = getAllAttractions().find(a => a.id === attractionId)
      if (!attraction) return prev

      xpGained = attraction.xp
      const newXP = prev.totalXP + xpGained
      const newLevel = EXPLORER_LEVELS.reduce((acc, level) => {
        if (newXP >= level.xpRequired) return level.level
        return acc
      }, 1)

      levelUp = newLevel > prev.level

      // Check for first visit badge
      if (prev.visitedAttractions.length === 0) {
        badgeEarned = COLLECTION_BADGES.find(b => b.id === 'first_visit')
      }

      // Check for attraction's badge
      if (attraction.badge && !prev.badges.find(b => b.id === attraction.badge?.id)) {
        badgeEarned = attraction.badge
      }

      const newBadges = badgeEarned
        ? [...prev.badges, { ...badgeEarned, unlockedAt: Date.now() }]
        : prev.badges

      return {
        ...prev,
        totalXP: newXP,
        level: newLevel,
        visitedAttractions: [...prev.visitedAttractions, attractionId],
        badges: newBadges,
        lastVisitedTown: townId,
      }
    })

    if (levelUp && onLevelUp) {
      const newLevelData = EXPLORER_LEVELS.find(l => l.level === progress.level + 1)
      if (newLevelData) onLevelUp(newLevelData)
    }

    if (badgeEarned && onBadgeEarned) {
      onBadgeEarned(badgeEarned)
    }

    return { xpGained, levelUp, badgeEarned }
  }, [getAllAttractions, onLevelUp, onBadgeEarned, progress.level])

  // Visit town
  const visitTown = useCallback((townId: string) => {
    setProgress(prev => {
      if (prev.visitedTowns.includes(townId)) return prev
      return {
        ...prev,
        visitedTowns: [...prev.visitedTowns, townId],
        lastVisitedTown: townId,
      }
    })
  }, [])

  // Unlock secret
  const unlockSecret = useCallback((secretId: string) => {
    let xpGained = 0
    let attraction: Attraction | null = null

    setProgress(prev => {
      if (prev.unlockedSecrets.includes(secretId)) {
        return prev
      }

      // Find the secret attraction
      for (const town of towns) {
        const secret = town.secretAttractions.find(a => a.id === secretId)
        if (secret) {
          attraction = secret
          xpGained = secret.xp * 2 // Bonus XP for secrets
          break
        }
      }

      if (!attraction) return prev

      // Check for secret finder badge
      let newBadges = prev.badges
      if (prev.unlockedSecrets.length === 0) {
        const secretBadge = COLLECTION_BADGES.find(b => b.id === 'secret_finder')
        if (secretBadge && !prev.badges.find(b => b.id === 'secret_finder')) {
          newBadges = [...newBadges, { ...secretBadge, unlockedAt: Date.now() }]
        }
      }

      return {
        ...prev,
        totalXP: prev.totalXP + xpGained,
        unlockedSecrets: [...prev.unlockedSecrets, secretId],
        badges: newBadges,
      }
    })

    if (attraction && onSecretUnlocked) {
      onSecretUnlocked(attraction)
    }

    return { xpGained, attraction }
  }, [towns, onSecretUnlocked])

  // Toggle favorite
  const toggleFavorite = useCallback((attractionId: string) => {
    setProgress(prev => {
      const isFav = prev.favoriteAttractions.includes(attractionId)
      return {
        ...prev,
        favoriteAttractions: isFav
          ? prev.favoriteAttractions.filter(id => id !== attractionId)
          : [...prev.favoriteAttractions, attractionId],
      }
    })
  }, [])

  // Check for badges
  const checkForBadges = useCallback((): Badge[] => {
    const newBadges: Badge[] = []

    // Check category badges
    Object.entries(CATEGORY_BADGES).forEach(([category, badge]) => {
      if (progress.badges.find(b => b.id === badge.id)) return

      const categoryAttractions = getAllAttractions().filter(a => a.category === category)
      const visitedInCategory = categoryAttractions.filter(a =>
        progress.visitedAttractions.includes(a.id)
      )

      if (visitedInCategory.length >= categoryAttractions.length && categoryAttractions.length > 0) {
        newBadges.push(badge)
      }
    })

    // Check streak badges
    if (progress.streakDays >= 7 && !progress.badges.find(b => b.id === 'streak_7')) {
      const streakBadge = COLLECTION_BADGES.find(b => b.id === 'streak_7')
      if (streakBadge) newBadges.push(streakBadge)
    }

    if (progress.streakDays >= 30 && !progress.badges.find(b => b.id === 'streak_30')) {
      const streakBadge = COLLECTION_BADGES.find(b => b.id === 'streak_30')
      if (streakBadge) newBadges.push(streakBadge)
    }

    // Award new badges
    if (newBadges.length > 0) {
      setProgress(prev => ({
        ...prev,
        badges: [
          ...prev.badges,
          ...newBadges.map(b => ({ ...b, unlockedAt: Date.now() })),
        ],
      }))

      newBadges.forEach(badge => {
        if (onBadgeEarned) onBadgeEarned(badge)
      })
    }

    return newBadges
  }, [progress, getAllAttractions, onBadgeEarned])

  // Update challenge progress
  const updateChallengeProgress = useCallback((challengeId: string, increment = 1) => {
    setProgress(prev => {
      const challengeIndex = prev.challenges.findIndex(c => c.id === challengeId)
      if (challengeIndex === -1) return prev

      const challenge = prev.challenges[challengeIndex]
      if (challenge.completed) return prev

      const newProgress = Math.min(challenge.progress + increment, challenge.target)
      const completed = newProgress >= challenge.target

      const updatedChallenge = {
        ...challenge,
        progress: newProgress,
        completed,
      }

      const newChallenges = [...prev.challenges]
      newChallenges[challengeIndex] = updatedChallenge

      // Award challenge rewards
      let newXP = prev.totalXP
      let newBadges = prev.badges
      if (completed) {
        newXP += challenge.reward.xp
        if (challenge.reward.badge && !prev.badges.find(b => b.id === challenge.reward.badge?.id)) {
          newBadges = [...newBadges, { ...challenge.reward.badge, unlockedAt: Date.now() }]
          if (onBadgeEarned) onBadgeEarned(challenge.reward.badge)
        }
      }

      return {
        ...prev,
        totalXP: newXP,
        badges: newBadges,
        challenges: newChallenges,
      }
    })
  }, [onBadgeEarned])

  // Get challenges
  const getActiveChallenges = useCallback(() => {
    return progress.challenges.filter(c => !c.completed)
  }, [progress.challenges])

  const getCompletedChallenges = useCallback(() => {
    return progress.challenges.filter(c => c.completed)
  }, [progress.challenges])

  // Query helpers
  const isAttractionVisited = useCallback((attractionId: string) => {
    return progress.visitedAttractions.includes(attractionId)
  }, [progress.visitedAttractions])

  const isTownVisited = useCallback((townId: string) => {
    return progress.visitedTowns.includes(townId)
  }, [progress.visitedTowns])

  const isSecretUnlocked = useCallback((secretId: string) => {
    return progress.unlockedSecrets.includes(secretId)
  }, [progress.unlockedSecrets])

  const isFavorite = useCallback((attractionId: string) => {
    return progress.favoriteAttractions.includes(attractionId)
  }, [progress.favoriteAttractions])

  const getTownCompletionPercent = useCallback((townId: string) => {
    const town = towns.find(t => t.id === townId)
    if (!town) return 0

    const totalAttractions = town.attractions.length
    const visitedCount = town.attractions.filter(a =>
      progress.visitedAttractions.includes(a.id)
    ).length

    return totalAttractions > 0 ? (visitedCount / totalAttractions) * 100 : 0
  }, [towns, progress.visitedAttractions])

  // Persistence
  const saveProgress = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (e) {
      console.error('Failed to save explorer progress:', e)
    }
  }, [progress])

  const loadProgressFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setProgress({
          ...DEFAULT_PROGRESS,
          ...parsed,
          challenges: parsed.challenges || DEFAULT_CHALLENGES,
          mysteries: parsed.mysteries || [],
        })
        return true
      }
    } catch (e) {
      console.error('Failed to load explorer progress:', e)
    }
    return false
  }, [])

  const loadProgress = useCallback(() => {
    return loadProgressFromStorage()
  }, [loadProgressFromStorage])

  const resetProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear explorer progress:', e)
    }
    setProgress({ ...DEFAULT_PROGRESS })
  }, [])

  // Gamification helpers
  const getRandomTobiasTip = useCallback(() => {
    return TOBIAS_TIPS[Math.floor(Math.random() * TOBIAS_TIPS.length)]
  }, [])

  const checkStreak = useCallback(() => {
    const today = new Date().toDateString()
    const lastPlay = progress.lastPlayDate

    if (!lastPlay) {
      setProgress(prev => ({ ...prev, lastPlayDate: today, streakDays: 1 }))
      return { maintained: true, newStreak: 1 }
    }

    const lastDate = new Date(lastPlay)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Same day, streak maintained
      return { maintained: true, newStreak: progress.streakDays }
    } else if (diffDays === 1) {
      // Next day, streak continues
      const newStreak = progress.streakDays + 1
      setProgress(prev => ({ ...prev, lastPlayDate: today, streakDays: newStreak }))
      return { maintained: true, newStreak }
    } else {
      // Streak broken
      setProgress(prev => ({ ...prev, lastPlayDate: today, streakDays: 1 }))
      return { maintained: false, newStreak: 1 }
    }
  }, [progress.lastPlayDate, progress.streakDays])

  // === Mystery Deduction Methods (Carmen Sandiego style) ===

  const discoverClue = useCallback((mysteryId: string, clueId: string) => {
    let xpGained = 0
    let isNew = false

    setProgress(prev => {
      const existing = prev.mysteries.find(m => m.mysteryId === mysteryId)

      if (existing?.cluesFound.includes(clueId)) {
        return prev // Already found
      }

      isNew = true
      xpGained = 15 // Base clue discovery XP

      if (existing) {
        // Update existing mystery progress
        const updated = prev.mysteries.map(m =>
          m.mysteryId === mysteryId
            ? { ...m, cluesFound: [...m.cluesFound, clueId] }
            : m
        )
        return { ...prev, mysteries: updated, totalXP: prev.totalXP + xpGained }
      } else {
        // Start tracking this mystery
        const newEntry: MysteryProgressEntry = {
          mysteryId,
          cluesFound: [clueId],
          solved: false,
          attempts: 0,
        }
        return { ...prev, mysteries: [...prev.mysteries, newEntry], totalXP: prev.totalXP + xpGained }
      }
    })

    return { xpGained, isNew }
  }, [])

  const attemptMysteryDeduction = useCallback((mysteryId: string, optionId: string) => {
    const result = attemptDeduction(mysteryId, optionId)

    setProgress(prev => {
      const updated = prev.mysteries.map(m => {
        if (m.mysteryId !== mysteryId) return m
        return {
          ...m,
          attempts: m.attempts + 1,
          solved: result.correct ? true : m.solved,
          solvedAt: result.correct ? Date.now() : m.solvedAt,
        }
      })

      // Award mystery badge on correct deduction
      let newBadges = prev.badges
      if (result.correct) {
        const mystery = TOWN_MYSTERIES.find(m => m.id === mysteryId)
        if (mystery?.badgeId) {
          const badge = COLLECTION_BADGES.find(b => b.id === mystery.badgeId)
          if (badge && !prev.badges.some(b => b.id === badge.id)) {
            newBadges = [...prev.badges, { ...badge, unlockedAt: Date.now() }]
          }
        }
      }

      return {
        ...prev,
        mysteries: updated,
        badges: newBadges,
        totalXP: prev.totalXP + result.xpReward,
      }
    })

    return result
  }, [])

  const getMysteryProgress = useCallback((mysteryId: string): MysteryProgressEntry | null => {
    return progress.mysteries.find(m => m.mysteryId === mysteryId) || null
  }, [progress.mysteries])

  const getAllMysteryProgress = useCallback((): MysteryProgressEntry[] => {
    return progress.mysteries
  }, [progress.mysteries])

  const isMysteryClueFound = useCallback((mysteryId: string, clueId: string): boolean => {
    const entry = progress.mysteries.find(m => m.mysteryId === mysteryId)
    return entry?.cluesFound.includes(clueId) ?? false
  }, [progress.mysteries])

  const isMysteryDeductionUnlocked = useCallback((mysteryId: string): boolean => {
    const entry = progress.mysteries.find(m => m.mysteryId === mysteryId)
    if (!entry) return false
    return isDeductionUnlocked(mysteryId, entry.cluesFound)
  }, [progress.mysteries])

  const isMysterySolved = useCallback((mysteryId: string): boolean => {
    const entry = progress.mysteries.find(m => m.mysteryId === mysteryId)
    return entry?.solved ?? false
  }, [progress.mysteries])

  // Auto-save on progress changes
  useEffect(() => {
    const timeoutId = setTimeout(saveProgress, 1000)
    return () => clearTimeout(timeoutId)
  }, [progress, saveProgress])

  const value: ExplorerContextValue = {
    progress,
    currentLevel,
    xpToNextLevel,
    progressPercent,
    visitAttraction,
    visitTown,
    unlockSecret,
    toggleFavorite,
    checkForBadges,
    updateChallengeProgress,
    getActiveChallenges,
    getCompletedChallenges,
    isAttractionVisited,
    isTownVisited,
    isSecretUnlocked,
    isFavorite,
    getTownCompletionPercent,
    saveProgress,
    loadProgress,
    resetProgress,
    discoverClue,
    attemptMysteryDeduction,
    getMysteryProgress,
    getAllMysteryProgress,
    isMysteryClueFound,
    isMysteryDeductionUnlocked,
    isMysterySolved,
    getRandomTobiasTip,
    checkStreak,
  }

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface XPBarProps {
  currentXP: number
  currentLevel: ExplorerLevel
  nextLevelXP: number
  progressPercent: number
  className?: string
}

export function XPBar({ currentXP, currentLevel, nextLevelXP, progressPercent, className = '' }: XPBarProps) {
  return (
    <div className={`bg-[var(--pixel-ui-bg)] border-2 border-[var(--pixel-ui-border)] p-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-[var(--font-pixel)] text-xs text-[var(--pixel-gold-light)]">
          {currentLevel.icon} {currentLevel.title}
        </span>
        <span className="font-[var(--font-pixel)] text-xs text-[var(--pixel-ui-text)]">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      <div className="h-3 bg-[var(--pixel-ui-border)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-gold-light)] transition-all duration-500"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface BadgeDisplayProps {
  badges: Badge[]
  showLocked?: boolean
  allBadges?: Badge[]
  className?: string
}

export function BadgeDisplay({ badges, showLocked = false, allBadges = [], className = '' }: BadgeDisplayProps) {
  const displayBadges = showLocked
    ? allBadges.map(b => ({ ...b, unlocked: badges.some(ub => ub.id === b.id) }))
    : badges.map(b => ({ ...b, unlocked: true }))

  const rarityColors = {
    common: 'border-gray-400',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    legendary: 'border-purple-500',
  }

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {displayBadges.map(badge => (
        <div
          key={badge.id}
          className={`
            p-2 border-2 rounded text-center
            ${rarityColors[badge.rarity]}
            ${badge.unlocked ? 'bg-[var(--pixel-ui-bg)]' : 'bg-gray-800 opacity-50'}
          `}
          title={badge.unlocked ? badge.description : '???'}
        >
          <div className="text-2xl">{badge.unlocked ? badge.icon : '🔒'}</div>
          <div className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] truncate">
            {badge.unlocked ? badge.name : '???'}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ChallengeCardProps {
  challenge: Challenge
  className?: string
}

export function ChallengeCard({ challenge, className = '' }: ChallengeCardProps) {
  const progressPercent = (challenge.progress / challenge.target) * 100

  return (
    <div className={`bg-[var(--pixel-ui-bg)] border-2 border-[var(--pixel-ui-border)] p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-[var(--font-pixel)] text-sm text-[var(--pixel-gold-light)]">
          {challenge.name}
        </span>
        {challenge.completed && (
          <span className="text-green-500">✓</span>
        )}
      </div>
      <p className="font-[var(--font-pixel)] text-xs text-[var(--pixel-ui-text)] mb-2">
        {challenge.description}
      </p>
      <div className="h-2 bg-[var(--pixel-ui-border)] overflow-hidden mb-1">
        <div
          className={`h-full transition-all duration-300 ${
            challenge.completed ? 'bg-green-500' : 'bg-[var(--pixel-gold-mid)]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex justify-between">
        <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
          {challenge.progress} / {challenge.target}
        </span>
        <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-mid)]">
          +{challenge.reward.xp} XP
        </span>
      </div>
    </div>
  )
}

export default ExplorerProvider
