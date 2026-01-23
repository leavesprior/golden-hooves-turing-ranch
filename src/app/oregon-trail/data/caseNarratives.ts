/**
 * Case Narratives - Mystery Case Definitions
 * Migrated from Carmen Sandiego game for story structure
 */

import type { CaseId } from './educationalClues'

export type CaseDifficulty = 'recruit' | 'detective' | 'inspector' | 'chief'
export type CaseTheme = 'twain' | 'mining' | 'caves' | 'wine'
export type CaseSeason = 'spring' | 'summer' | 'fall' | 'all'

export interface CaseIntro {
  hook: string
  briefing: string
  objectives: string[]
}

export interface Case {
  id: CaseId
  title: string
  description: string
  shortDescription: string
  difficulty: CaseDifficulty
  minClues: number
  theme: CaseTheme
  stolenItem: string
  thiefId: string
  hidingSpot: string
  locations: string[]
  season: CaseSeason
  badge: string
  intro: CaseIntro
}

export const CASES: Case[] = [
  {
    id: 'jumping_frog',
    title: 'The Missing Jumping Frog',
    description: 'The legendary Calaveras County Jumping Frog Trophy has been stolen from Angels Camp just days before the annual Jubilee! The thief left a trail of clues leading through Gold Country. Can you solve the mystery before the festival begins?',
    shortDescription: 'Find the stolen frog trophy before the Jubilee!',
    difficulty: 'detective',
    minClues: 5,
    theme: 'twain',
    stolenItem: 'Jumping Frog Trophy',
    thiefId: 'slippery_pete',
    hidingSpot: 'moaning_cavern',
    locations: ['angels_camp', 'murphys', 'moaning_cavern', 'big_trees', 'bobr_cabin'],
    season: 'spring',
    badge: 'frog_detective',
    intro: {
      hook: 'BREAKING NEWS: Trophy stolen from Angels Camp!',
      briefing: 'The famous Jumping Frog Trophy, awarded at the Calaveras County Fair since 1928, has vanished! Witnesses report seeing a shadowy figure fleeing toward the mountains. Your mission: investigate the historic sites of Gold Country, gather clues, and catch the thief!',
      objectives: [
        'Visit at least 4 historic locations',
        'Collect 5 clues about the thief\'s identity',
        'Identify the culprit and their hiding spot'
      ]
    }
  },
  {
    id: 'gold_rush_heist',
    title: 'The Gold Rush Heist',
    description: 'A priceless gold nugget from the 1849 Gold Rush has been stolen from the Calaveras County Museum. Follow the trail through abandoned mines and historic towns to recover this piece of California history!',
    shortDescription: 'Recover the stolen gold nugget!',
    difficulty: 'inspector',
    minClues: 7,
    theme: 'mining',
    stolenItem: 'The Mother Lode Nugget',
    thiefId: 'prospector_pat',
    hidingSpot: 'kennedy_mine',
    locations: ['mokelumne_hill', 'kennedy_mine', 'angels_camp', 'murphys', 'bobr_cabin', 'jackson'],
    season: 'all',
    badge: 'gold_tracker',
    intro: {
      hook: 'ALERT: Historic gold nugget missing!',
      briefing: 'The Mother Lode Nugget, a 3-pound gold specimen found in 1852, has disappeared from its display case. Security cameras caught a figure in old mining gear slipping away. The trail leads through the abandoned shafts and boomtowns of the Gold Rush era. Can you recover this irreplaceable treasure?',
      objectives: [
        'Explore the mining heritage sites',
        'Gather 7 clues about the heist',
        'Track down the thief\'s underground hideout'
      ]
    }
  },
  {
    id: 'cave_secrets',
    title: 'Cave of Secrets',
    description: 'Strange lights have been spotted deep in the caverns of Calaveras County. Ancient Native American artifacts are disappearing one by one. Descend into the darkness to uncover the truth!',
    shortDescription: 'Solve the mystery of the vanishing artifacts!',
    difficulty: 'chief',
    minClues: 10,
    theme: 'caves',
    stolenItem: 'Miwok Ceremonial Basket',
    thiefId: 'cave_crawler_charlie',
    hidingSpot: 'california_caverns',
    locations: ['moaning_cavern', 'california_caverns', 'big_trees', 'murphys', 'angels_camp', 'bobr_cabin', 'natural_bridges'],
    season: 'summer',
    badge: 'spelunker_supreme',
    intro: {
      hook: 'MYSTERY: Strange lights in the caverns!',
      briefing: 'For weeks, hikers have reported eerie glows emanating from Calaveras County\'s famous caves. Now, precious Miwok artifacts have begun vanishing from local museums. The underground world holds secrets waiting to be discovered. Are you brave enough to descend into the darkness?',
      objectives: [
        'Investigate all major cave systems',
        'Discover 10 clues hidden in the depths',
        'Unmask the artifact smuggler'
      ]
    }
  },
  {
    id: 'wine_whodunit',
    title: 'Wine Country Whodunit',
    description: 'The secret recipe for Murphys\' award-winning Gold Rush Red has been stolen! Someone infiltrated the wine trail during the harvest festival. Taste your way through the clues to catch the culprit!',
    shortDescription: 'Find the stolen wine recipe!',
    difficulty: 'recruit',
    minClues: 3,
    theme: 'wine',
    stolenItem: 'Gold Rush Red Recipe',
    thiefId: 'vintage_vera',
    hidingSpot: 'ironstone_vineyards',
    locations: ['murphys', 'ironstone_vineyards', 'bobr_cabin'],
    season: 'fall',
    badge: 'wine_sleuth',
    intro: {
      hook: 'SCANDAL: Prized wine recipe vanishes!',
      briefing: 'The century-old recipe for Gold Rush Red, Murphys\' most celebrated wine, has been stolen from the historic wine cellar! The annual harvest festival is in jeopardy. Clues suggest someone on the wine trail knows more than they\'re saying. Time to uncork this mystery!',
      objectives: [
        'Tour the Murphys wine trail',
        'Collect 3 clues from local wineries',
        'Identify who wanted the recipe'
      ]
    }
  }
]

// Helper functions
export function getCaseById(id: CaseId): Case | undefined {
  return CASES.find(c => c.id === id)
}

export function getCasesByDifficulty(difficulty: CaseDifficulty): Case[] {
  return CASES.filter(c => c.difficulty === difficulty)
}

export function getCasesBySeason(season: CaseSeason): Case[] {
  return CASES.filter(c => c.season === season || c.season === 'all')
}

// Difficulty order for sorting
export const DIFFICULTY_ORDER: CaseDifficulty[] = ['recruit', 'detective', 'inspector', 'chief']

// Get cases sorted by difficulty
export function getCasesSortedByDifficulty(): Case[] {
  return [...CASES].sort((a, b) =>
    DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
  )
}

// Display names for difficulty levels
export const DIFFICULTY_DISPLAY: Record<CaseDifficulty, string> = {
  recruit: 'Recruit (Easy)',
  detective: 'Detective (Medium)',
  inspector: 'Inspector (Hard)',
  chief: 'Chief (Expert)'
}

// Theme icons for UI
export const THEME_ICONS: Record<CaseTheme, string> = {
  twain: '🐸',
  mining: '⛏️',
  caves: '🦇',
  wine: '🍷'
}
