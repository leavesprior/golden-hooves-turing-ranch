'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import {
  type TownMystery,
  TOWN_MYSTERIES,
  isDeductionUnlocked,
  attemptDeduction,
} from './data/townMysteries'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { getSiteRefForTown, type TownSiteRef } from './data/townSites'

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

export interface JournalEntry {
  id: string
  timestamp: number
  type: 'attraction' | 'mystery' | 'discovery' | 'note'
  townId: string
  title: string
  content: string  // auto-generated from the attraction/mystery description
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
  historicalDepthScore: number
  historicalDepthLevel: string
  journalEntries: JournalEntry[]
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

  // Historical Depth
  historicalDepthScore: number
  historicalDepthLevel: string

  // Field Journal
  getJournal: () => JournalEntry[]
  getJournalForTown: (townId: string) => JournalEntry[]
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
  { id: 'mystery_san_andreas', name: 'Gentleman Bandit', icon: '🎩', description: 'Unmasked Black Bart\'s double life in San Andreas', rarity: 'rare' },
  { id: 'mystery_bobr_ranch', name: 'Ranch Historian', icon: '🏠', description: 'Uncovered the secret of the ranch\'s first homesteader', rarity: 'uncommon' },
  { id: 'mystery_murphys', name: 'Cavern Chronicler', icon: '🕳️', description: 'Exposed the truth behind Mercer Caverns\' discovery', rarity: 'rare' },
  { id: 'mystery_moaning_cavern', name: 'Ancient Witness', icon: '🦴', description: 'Solved the 13,000-year-old mystery of Moaning Cavern', rarity: 'legendary' },
  { id: 'mystery_kennedy_mine', name: 'Labor Advocate', icon: '⛏️', description: 'Uncovered the negligence behind the Kennedy Mine disaster', rarity: 'legendary' },
  { id: 'mystery_ironstone_vineyards', name: 'Gold Sleuth', icon: '🍇', description: 'Revealed the hidden gold history of Ironstone Vineyards', rarity: 'rare' },
  { id: 'mystery_nevada_city', name: 'Theater Detective', icon: '🎭', description: 'Solved the mystery of Lotta Crabtree\'s lost locket', rarity: 'rare' },
  { id: 'mystery_grass_valley', name: 'Deep Earth Detective', icon: '⛏️', description: 'Uncovered the secret of Empire Mine\'s sealed shaft', rarity: 'legendary' },
  { id: 'mystery_angels_twain', name: 'Literary Sleuth', icon: '📝', description: 'Traced the real source of Twain\'s jumping frog story', rarity: 'rare' },
  { id: 'mystery_mariposa', name: 'Land Grant Detective', icon: '📜', description: 'Exposed Fremont\'s floating grant maneuver', rarity: 'legendary' },
  // Collection badges
  { id: 'twain_scholar', name: 'Twain Scholar', icon: '📚', description: 'Follow Mark Twain\'s California footsteps', rarity: 'rare' },
  { id: 'califia_seeker', name: 'Califia Seeker', icon: '👑', description: 'Discover the myth behind California\'s name', rarity: 'legendary' },
  { id: 'miwok_historian', name: 'Miwok Historian', icon: '🏛️', description: 'Respectfully learn about Miwok culture', rarity: 'rare' },
  { id: 'ranch_pioneer', name: 'Ranch Pioneer', icon: '🤠', description: 'Discover ranching history of El Dorado County', rarity: 'uncommon' },
  { id: 'gold_economist', name: 'Gold Rush Economist', icon: '💰', description: 'Understand the real economics of the Gold Rush', rarity: 'rare' },
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
  "Mark Twain first heard the famous Jumping Frog tale right here in Angels Camp - he wrote it up later!",
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
// HELPER FUNCTIONS
// ============================================

export function getHistoricalDepthLevel(score: number): string {
  if (score >= 100) return 'Living Archive'
  if (score >= 50) return 'Historian'
  if (score >= 25) return 'Scholar'
  if (score >= 10) return 'Student'
  return 'Newcomer'
}

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
  historicalDepthScore: 0,
  historicalDepthLevel: 'Newcomer',
  journalEntries: [],
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

  // Latest-progress ref so callbacks with [] deps can compute side-effect
  // inputs OUTSIDE setProgress updaters. Updaters must stay PURE: Strict Mode
  // re-invokes them during render, so any CrossGameStorage/localStorage call
  // inside one fires setState in other providers mid-render ("Cannot update a
  // component while rendering a different component") and double-applies
  // side effects. Ref is updated in an effect, never during render.
  const progressRef = useRef(progress)
  useEffect(() => { progressRef.current = progress }, [progress])

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
  // Pure-updater discipline: XP/level/badge/journal are computed OUTSIDE the
  // setProgress updater (from progressRef) so the updater has no Date.now(),
  // no closure mutation, and no side effects. Side effects run after.
  const visitAttraction = useCallback((attractionId: string, townId: string) => {
    const current = progressRef.current
    const attraction = current.visitedAttractions.includes(attractionId)
      ? undefined // Already visited
      : getAllAttractions().find(a => a.id === attractionId)

    let xpGained = 0
    let levelUp = false
    let badgeEarned: Badge | undefined
    let newLevel = current.level

    if (attraction) {
      const now = Date.now()
      xpGained = attraction.xp
      const newXP = current.totalXP + xpGained
      newLevel = EXPLORER_LEVELS.reduce((acc, level) => {
        if (newXP >= level.xpRequired) return level.level
        return acc
      }, 1)

      levelUp = newLevel > current.level

      // Check for first visit badge
      if (current.visitedAttractions.length === 0) {
        badgeEarned = COLLECTION_BADGES.find(b => b.id === 'first_visit')
      }

      // Check for attraction's badge
      if (attraction.badge && !current.badges.find(b => b.id === attraction.badge?.id)) {
        badgeEarned = attraction.badge
      }

      const stampedBadge = badgeEarned ? { ...badgeEarned, unlockedAt: now } : undefined

      // Auto-generate journal entry for attraction visit
      const journalEntry: JournalEntry = {
        id: `attraction_${attractionId}_${now}`,
        timestamp: now,
        type: 'attraction',
        townId,
        title: attraction.name,
        content: attraction.funFact,
      }

      setProgress(prev => {
        if (prev.visitedAttractions.includes(attractionId)) {
          return prev // Already visited
        }

        const newTotalXP = prev.totalXP + xpGained
        const badge = stampedBadge

        // Historical depth: +1 for attraction visit
        const newDepthScore = prev.historicalDepthScore + 1

        return {
          ...prev,
          totalXP: newTotalXP,
          level: EXPLORER_LEVELS.reduce((acc, level) => {
            if (newTotalXP >= level.xpRequired) return level.level
            return acc
          }, 1),
          visitedAttractions: [...prev.visitedAttractions, attractionId],
          badges: badge && !prev.badges.find(b => b.id === badge.id)
            ? [...prev.badges, badge]
            : prev.badges,
          lastVisitedTown: townId,
          historicalDepthScore: newDepthScore,
          historicalDepthLevel: getHistoricalDepthLevel(newDepthScore),
          journalEntries: [...prev.journalEntries, journalEntry],
        }
      })
    }

    if (levelUp && onLevelUp) {
      const newLevelData = EXPLORER_LEVELS.find(l => l.level === newLevel)
      if (newLevelData) {
        onLevelUp(newLevelData)
        // Cross-game milestone for reaching legendary
        if (newLevelData.level === 6) {
          CrossGameStorage.recordMilestone('explorer_legendary_level', 'gold_country_explorer')
        }
      }
    }

    if (badgeEarned && onBadgeEarned) {
      onBadgeEarned(badgeEarned)
      // Cross-game: badge earns good karma
      CrossGameStorage.syncKarmaToPool('gold_country_explorer', 'good', 5, `Badge: ${badgeEarned.name}`)
    }

    // Cross-game: attraction visits add historical depth
    if (xpGained > 0) {
      CrossGameStorage.addHistoricalDepth(1)
    }

    // Sacred-site gameplay is GATED OFF by default (Grok pre-publish #3).
    // Visiting a town must not auto-award karma/XP for sacred/burial sites on a
    // live business domain until Leif + tribal review opt in.
    // Opt-in: NEXT_PUBLIC_SACRED_SITE_GAMEPLAY=1
    if (process.env.NEXT_PUBLIC_SACRED_SITE_GAMEPLAY === '1') {
      const spiritualSite: TownSiteRef | undefined = getSiteRefForTown(townId)
      if (spiritualSite) {
        CrossGameStorage.visitSpiritualSite(spiritualSite.id)
      }
    }

    return { xpGained, levelUp, badgeEarned }
  }, [getAllAttractions, onLevelUp, onBadgeEarned])

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
  // Pure-updater discipline: secret lookup, XP, badge and journal entry are
  // computed OUTSIDE the setProgress updater (from progressRef); the updater
  // has no Date.now() and no closure mutation.
  const unlockSecret = useCallback((secretId: string) => {
    const current = progressRef.current

    if (current.unlockedSecrets.includes(secretId)) {
      return { xpGained: 0, attraction: null }
    }

    // Find the secret attraction
    let attraction: Attraction | null = null
    for (const town of towns) {
      const secret = town.secretAttractions.find(a => a.id === secretId)
      if (secret) {
        attraction = secret
        break
      }
    }

    if (!attraction) {
      return { xpGained: 0, attraction: null }
    }

    const xpGained = attraction.xp * 2 // Bonus XP for secrets
    const now = Date.now()

    // Check for secret finder badge
    const secretBadge = current.unlockedSecrets.length === 0
      ? COLLECTION_BADGES.find(b => b.id === 'secret_finder')
      : undefined
    const stampedBadge = secretBadge && !current.badges.find(b => b.id === 'secret_finder')
      ? { ...secretBadge, unlockedAt: now }
      : undefined

    // Find which town this secret belongs to for journal entry
    const secretTownId = towns.find(t =>
      t.secretAttractions.some(a => a.id === secretId)
    )?.id || ''

    // Auto-generate journal entry for secret discovery
    const journalEntry: JournalEntry = {
      id: `discovery_${secretId}_${now}`,
      timestamp: now,
      type: 'discovery',
      townId: secretTownId,
      title: attraction.name,
      content: attraction.secretUnlock || attraction.description,
    }

    setProgress(prev => {
      if (prev.unlockedSecrets.includes(secretId)) {
        return prev
      }

      const badge = stampedBadge

      // Historical depth: +5 for secret unlock
      const newDepthScore = prev.historicalDepthScore + 5

      return {
        ...prev,
        totalXP: prev.totalXP + xpGained,
        unlockedSecrets: [...prev.unlockedSecrets, secretId],
        badges: badge && !prev.badges.find(b => b.id === badge.id)
          ? [...prev.badges, badge]
          : prev.badges,
        historicalDepthScore: newDepthScore,
        historicalDepthLevel: getHistoricalDepthLevel(newDepthScore),
        journalEntries: [...prev.journalEntries, journalEntry],
      }
    })

    if (onSecretUnlocked) {
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

    // Award new badges (timestamp computed once outside the pure updater)
    if (newBadges.length > 0) {
      const now = Date.now()
      const stampedBadges = newBadges.map(b => ({ ...b, unlockedAt: now }))
      setProgress(prev => ({
        ...prev,
        badges: [...prev.badges, ...stampedBadges],
      }))

      newBadges.forEach(badge => {
        if (onBadgeEarned) onBadgeEarned(badge)
      })
    }

    return newBadges
  }, [progress, getAllAttractions, onBadgeEarned])

  // Update challenge progress
  // Pure-updater discipline: completion/reward decided OUTSIDE the updater
  // (from progressRef); onBadgeEarned (a parent setState path) no longer
  // fires from inside the updater, and Date.now() is computed once outside.
  const updateChallengeProgress = useCallback((challengeId: string, increment = 1) => {
    const current = progressRef.current
    const challenge = current.challenges.find(c => c.id === challengeId)
    if (!challenge || challenge.completed) return

    const newProgress = Math.min(challenge.progress + increment, challenge.target)
    const completed = newProgress >= challenge.target
    const rewardBadge = completed
      && challenge.reward.badge
      && !current.badges.find(b => b.id === challenge.reward.badge?.id)
      ? challenge.reward.badge
      : undefined
    const stampedBadge = rewardBadge ? { ...rewardBadge, unlockedAt: Date.now() } : undefined

    setProgress(prev => {
      const challengeIndex = prev.challenges.findIndex(c => c.id === challengeId)
      if (challengeIndex === -1) return prev
      if (prev.challenges[challengeIndex].completed) return prev

      const updatedChallenge = {
        ...prev.challenges[challengeIndex],
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
        const badge = stampedBadge
        if (badge && !prev.badges.find(b => b.id === badge.id)) {
          newBadges = [...newBadges, badge]
        }
      }

      return {
        ...prev,
        totalXP: newXP,
        badges: newBadges,
        challenges: newChallenges,
      }
    })

    if (rewardBadge && onBadgeEarned) onBadgeEarned(rewardBadge)
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
        const historicalDepthScore = parsed.historicalDepthScore ?? 0
        setProgress({
          ...DEFAULT_PROGRESS,
          ...parsed,
          challenges: parsed.challenges || DEFAULT_CHALLENGES,
          mysteries: parsed.mysteries || [],
          historicalDepthScore,
          historicalDepthLevel: getHistoricalDepthLevel(historicalDepthScore),
          journalEntries: parsed.journalEntries || [],
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
    return TOBIAS_TIPS[Math.floor(Math.random() * TOBIAS_TIPS.length)] // safe-mint: random display tip only, no reward value or code
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
    // Already-found check OUTSIDE the updater (no closure mutation inside it)
    const existing = progressRef.current.mysteries.find(m => m.mysteryId === mysteryId)
    if (existing?.cluesFound.includes(clueId)) {
      return { xpGained: 0, isNew: false } // Already found
    }

    const xpGained = 15 // Base clue discovery XP

    setProgress(prev => {
      const prevEntry = prev.mysteries.find(m => m.mysteryId === mysteryId)

      if (prevEntry?.cluesFound.includes(clueId)) {
        return prev // Already found
      }

      if (prevEntry) {
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

    return { xpGained, isNew: true }
  }, [])

  const attemptMysteryDeduction = useCallback((mysteryId: string, optionId: string) => {
    const result = attemptDeduction(mysteryId, optionId)

    // THE FIX for "Cannot update a component (CrossGameProgressionProvider)
    // while rendering a different component (ExplorerProvider)": all
    // CrossGameStorage calls used to live INSIDE the setProgress updater.
    // Strict Mode re-invokes updaters during render, so syncKarmaToPool's
    // save() dispatched a storage event whose listener setState'd the
    // cross-game provider mid-render (and side effects double-applied).
    // Now: side-effect inputs are computed OUTSIDE from progressRef, the
    // updater is pure, and CrossGameStorage runs AFTER the state update.
    const now = Date.now()
    const current = progressRef.current
    const mystery = TOWN_MYSTERIES.find(m => m.id === mysteryId)

    // Badge to award on correct deduction (decided outside the updater)
    const badgeDef = result.correct && mystery?.badgeId
      ? COLLECTION_BADGES.find(b => b.id === mystery.badgeId)
      : undefined
    const earnedBadge = badgeDef && !current.badges.some(b => b.id === badgeDef.id)
      ? { ...badgeDef, unlockedAt: now }
      : undefined

    // Journal entry on correct deduction (timestamp computed once)
    const journalEntry: JournalEntry | undefined = result.correct
      ? {
          id: `mystery_${mysteryId}_${now}`,
          timestamp: now,
          type: 'mystery',
          townId: mystery?.townId || '',
          title: mystery?.title || mysteryId,
          content: result.response,
        }
      : undefined

    // Pure updater — no CrossGameStorage, no Date.now(), no callbacks.
    setProgress(prev => {
      const updated = prev.mysteries.map(m => {
        if (m.mysteryId !== mysteryId) return m
        return {
          ...m,
          attempts: m.attempts + 1,
          solved: result.correct ? true : m.solved,
          solvedAt: result.correct ? now : m.solvedAt,
        }
      })

      // Award mystery badge on correct deduction
      const badge = earnedBadge
      const newBadges = badge && !prev.badges.some(b => b.id === badge.id)
        ? [...prev.badges, badge]
        : prev.badges

      // Historical depth: +3 for mystery solve, journal entry
      let newDepthScore = prev.historicalDepthScore
      let newJournalEntries = prev.journalEntries
      if (result.correct) {
        newDepthScore = prev.historicalDepthScore + 3
        if (journalEntry) {
          newJournalEntries = [...prev.journalEntries, journalEntry]
        }
      }

      return {
        ...prev,
        mysteries: updated,
        badges: newBadges,
        totalXP: prev.totalXP + result.xpReward,
        historicalDepthScore: newDepthScore,
        historicalDepthLevel: getHistoricalDepthLevel(newDepthScore),
        journalEntries: newJournalEntries,
      }
    })

    // Side effects AFTER the pure state update — run exactly once per attempt.
    if (result.correct) {
      // Cross-game: sync good karma for historical discovery
      CrossGameStorage.syncKarmaToPool(
        'gold_country_explorer', 'good',
        Math.floor(result.xpReward / 10),
        `Mystery solved: ${mysteryId}`
      )
      // Track historical depth
      CrossGameStorage.addHistoricalDepth(2)

      // Check for explorer milestones — solved count derived from the
      // pre-update state plus this solve (the known delta), not from
      // inside the updater. recordMilestone also dedupes internally.
      const wasAlreadySolved = current.mysteries.find(m => m.mysteryId === mysteryId)?.solved ?? false
      const solvedCount = current.mysteries.filter(m => m.solved).length + (wasAlreadySolved ? 0 : 1)
      if (solvedCount === 1) {
        CrossGameStorage.recordMilestone('explorer_first_mystery_solved', 'gold_country_explorer')
      }
      if (solvedCount >= TOWN_MYSTERIES.length) {
        CrossGameStorage.recordMilestone('explorer_all_mysteries_solved', 'gold_country_explorer')
      }
    }

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

  // === Field Journal Methods ===

  const getJournal = useCallback((): JournalEntry[] => {
    return [...progress.journalEntries].sort((a, b) => b.timestamp - a.timestamp)
  }, [progress.journalEntries])

  const getJournalForTown = useCallback((townId: string): JournalEntry[] => {
    return progress.journalEntries
      .filter(e => e.townId === townId)
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [progress.journalEntries])

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
    historicalDepthScore: progress.historicalDepthScore,
    historicalDepthLevel: progress.historicalDepthLevel,
    getJournal,
    getJournalForTown,
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
