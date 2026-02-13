'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// S.A.D.D.L.E. Stats (same 6 stats, culturally adapted for pre-Columbian characters)
export interface SaddleStats {
  Shrewdness: number   // Intelligence, deduction, pattern recognition
  Agility: number      // Speed, hunting, navigation
  Durability: number   // Health, resistance to elements
  Diplomacy: number    // Interpersonal relations, trade, persuasion
  Luck: number         // Fortune, divine favor, chance
  Expertise: number    // Craft skills, survival, cultural knowledge
}

export type StatName = keyof SaddleStats

export interface SkillCheckResult {
  stat: StatName
  difficulty: number
  roll: number  // The dice roll
  modifier: number  // Stat modifier
  total: number  // roll + modifier
  success: boolean
  criticalSuccess: boolean  // Natural 20 equivalent
  criticalFailure: boolean  // Natural 1 equivalent
  margin: number  // How much above/below difficulty
}

// Character backgrounds (pre-Columbian characters)
export type CharacterBackground =
  | 'norseman'      // High Durability (7), High Expertise (7)
  | 'native'        // High Diplomacy (7), High Luck (7)
  | 'califia'       // High Agility (7), High Diplomacy (7)
  | 'incan_child'   // High Shrewdness (7), High Luck (7)

export interface CharacterTrait {
  id: string
  name: string
  description: string
  statModifiers: Partial<SaddleStats>
  specialAbility?: string
}

// Investigation proficiency - improves with practice
export type InvestigationCategory = 'artifactAnalysis' | 'witnessInterrogation' | 'culturalIdentification'
export type ProficiencyLevel = 'novice' | 'apprentice' | 'journeyman' | 'expert' | 'master'

export interface InvestigationProficiency {
  artifactAnalysis: number       // XP toward examining objects
  witnessInterrogation: number   // XP toward interview skills
  culturalIdentification: number // XP toward identifying origins
}

export interface Character {
  name: string
  background: CharacterBackground
  stats: SaddleStats
  traits: string[]  // IDs of acquired traits
  level: number
  experience: number
  experienceToNextLevel: number
  pendingStatPoints: number
  levelUpPending: boolean
  investigationProficiency: InvestigationProficiency
  uniqueMechanic: string  // Character-specific mechanic identifier
}

export interface CharacterState {
  character: Character | null
  lastSkillCheck: SkillCheckResult | null
  skillCheckHistory: SkillCheckResult[]
}

interface CharacterContextValue {
  state: CharacterState

  // Character creation
  createCharacter: (name: string, background: CharacterBackground) => void
  allocateStatPoints: (stats: Partial<SaddleStats>) => void

  // Stats
  getStat: (stat: StatName) => number
  getStatModifier: (stat: StatName) => number
  modifyStat: (stat: StatName, delta: number) => void
  setStatTemporarily: (stat: StatName, value: number, duration: number) => void

  // Skill checks
  rollSkillCheck: (stat: StatName, difficulty: number) => SkillCheckResult
  hasStatRequirement: (stat: StatName, requirement: number) => boolean

  // Progression
  addExperience: (amount: number) => void
  levelUp: () => void
  addTrait: (traitId: string) => void
  hasTrait: (traitId: string) => boolean
  allocateLevelUpPoints: (stat: StatName, points: number) => void
  dismissLevelUp: () => void

  // Investigation proficiency
  addInvestigationXP: (category: InvestigationCategory, amount: number) => void
  getInvestigationLevel: (category: InvestigationCategory) => ProficiencyLevel
  getInvestigationBonus: (category: InvestigationCategory) => number

  // Helpers
  getBackgroundBonuses: (background: CharacterBackground) => Partial<SaddleStats>
  getStatDescription: (stat: StatName) => string
  getUniqueMechanic: () => string
}

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined)

// Background stat bonuses (each character has 2 stats at 7, rest at 5)
const BACKGROUND_BONUSES: Record<CharacterBackground, Partial<SaddleStats>> = {
  norseman: { Durability: 2, Expertise: 2 },
  native: { Diplomacy: 2, Luck: 2 },
  califia: { Agility: 2, Diplomacy: 2 },
  incan_child: { Shrewdness: 2, Luck: 2 }
}

// Unique mechanics per character
const UNIQUE_MECHANICS: Record<CharacterBackground, string> = {
  norseman: 'fylguir_tracking',
  native: 'dream_walking',
  califia: 'warrior_strategy',
  incan_child: 'hieroglyphic_puzzles'
}

// Background descriptions
export const BACKGROUND_DESCRIPTIONS: Record<CharacterBackground, {
  name: string
  description: string
  bonuses: string
  mechanic: string
}> = {
  norseman: {
    name: 'Norseman',
    description: 'A Viking explorer, far from home. Your people sailed west seeking new lands.',
    bonuses: '+2 Durability, +2 Expertise',
    mechanic: 'Fylguir Tracking: Spirit guide reveals hidden paths'
  },
  native: {
    name: 'Native (Cahokia)',
    description: 'From the great mound city of Cahokia. You walk between the waking world and the dream realm.',
    bonuses: '+2 Diplomacy, +2 Luck',
    mechanic: 'Dream Walking: Visions reveal artifact secrets'
  },
  califia: {
    name: 'Califia',
    description: 'Legendary warrior queen. Your tactical mind sees patterns others miss.',
    bonuses: '+2 Agility, +2 Diplomacy',
    mechanic: 'Warrior Strategy: Combat puzzles unlock clues'
  },
  incan_child: {
    name: 'Incan Child',
    description: 'Young keeper of quipu records. Numbers and symbols speak to you.',
    bonuses: '+2 Shrewdness, +2 Luck',
    mechanic: 'Hieroglyphic Puzzles: Decode ancient inscriptions'
  }
}

// Stat descriptions
const STAT_DESCRIPTIONS: Record<StatName, string> = {
  Shrewdness: 'Intelligence and pattern recognition. Helps decode symbols and interpret artifacts.',
  Agility: 'Speed and reflexes. Improves navigation, hunting, and avoiding danger.',
  Durability: 'Health and constitution. Resists harsh conditions and recovers faster.',
  Diplomacy: 'Charisma and cultural understanding. Builds trust across civilizations.',
  Luck: 'Fortune and divine favor. Better outcomes, finding rare artifacts.',
  Expertise: 'Practical skills. Craftsmanship, survival, cultural knowledge.'
}

// XP reward constants
export const XP_REWARDS = {
  WITNESS_INTERVIEW: 15,
  SKILL_CHECK_SUCCESS: 25,
  SKILL_CHECK_CRITICAL: 50,
  ARTIFACT_EXAMINED: 20,
  CLUE_OBTAINED: 20,
  PUZZLE_SOLVED: 30,
  ARTIFACT_IDENTIFIED: 100,
  WRONG_IDENTIFICATION: -10,
  MYSTERY_SOLVED: 150,
  CULTURAL_INSIGHT: 20,
} as const

// Investigation proficiency thresholds
const PROFICIENCY_THRESHOLDS: { level: ProficiencyLevel; minXP: number; bonus: number; reliabilityBoost: number }[] = [
  { level: 'novice',      minXP: 0,   bonus: 0, reliabilityBoost: 0 },
  { level: 'apprentice',  minXP: 50,  bonus: 1, reliabilityBoost: 0 },
  { level: 'journeyman',  minXP: 150, bonus: 2, reliabilityBoost: 0.1 },
  { level: 'expert',      minXP: 300, bonus: 3, reliabilityBoost: 0.2 },
  { level: 'master',      minXP: 500, bonus: 4, reliabilityBoost: 0.3 },
]

// Available character traits
export const CHARACTER_TRAITS: Record<string, CharacterTrait> = {
  keen_observer: {
    id: 'keen_observer',
    name: 'Keen Observer',
    description: 'You notice details in artifacts others miss.',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'First examination at each location reveals extra clue'
  },
  cultural_bridge: {
    id: 'cultural_bridge',
    name: 'Cultural Bridge',
    description: 'Your words transcend language barriers.',
    statModifiers: { Diplomacy: 1 },
    specialAbility: 'Reroll failed Diplomacy checks once per location'
  },
  weathered_traveler: {
    id: 'weathered_traveler',
    name: 'Weathered Traveler',
    description: 'The elements rarely affect you.',
    statModifiers: { Durability: 2 },
    specialAbility: '50% chance to resist harsh conditions'
  },
  blessed_by_spirits: {
    id: 'blessed_by_spirits',
    name: 'Blessed by Spirits',
    description: 'The spirits favor your path.',
    statModifiers: { Luck: 2 },
    specialAbility: 'Critical success range increased by 1'
  },
  master_craftsman: {
    id: 'master_craftsman',
    name: 'Master Craftsman',
    description: 'Ancient techniques flow through your hands.',
    statModifiers: { Expertise: 1, Shrewdness: 1 },
    specialAbility: 'Object transformations reveal hidden properties'
  },
  swift_navigator: {
    id: 'swift_navigator',
    name: 'Swift Navigator',
    description: 'You read the land like a map.',
    statModifiers: { Agility: 2 },
    specialAbility: 'Travel speed +10%'
  },
  dreamer: {
    id: 'dreamer',
    name: 'Dreamer',
    description: 'Visions guide your understanding.',
    statModifiers: { Shrewdness: 1, Luck: 1 },
    specialAbility: 'Dreams provide artifact hints during rest'
  },
  trusted_voice: {
    id: 'trusted_voice',
    name: 'Trusted Voice',
    description: 'People from all cultures trust you.',
    statModifiers: { Diplomacy: 2 },
    specialAbility: 'Witnesses provide more detailed clues'
  }
}

// Base stats for new characters
const BASE_STATS: SaddleStats = {
  Shrewdness: 5,
  Agility: 5,
  Durability: 5,
  Diplomacy: 5,
  Luck: 5,
  Expertise: 5
}

const initialState: CharacterState = {
  character: null,
  lastSkillCheck: null,
  skillCheckHistory: []
}

const STORAGE_KEY = 'bobr_prologue_character'

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>(() => {
    if (typeof window === 'undefined') return initialState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const character = JSON.parse(saved) as Character
        return { ...initialState, character }
      }
    } catch {}
    return initialState
  })

  // Create a new character
  const createCharacter = useCallback((name: string, background: CharacterBackground) => {
    const bonuses = BACKGROUND_BONUSES[background]
    const stats: SaddleStats = { ...BASE_STATS }

    // Apply background bonuses
    Object.entries(bonuses).forEach(([stat, bonus]) => {
      stats[stat as StatName] += bonus
    })

    const character: Character = {
      name,
      background,
      stats,
      traits: [],
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      pendingStatPoints: 0,
      levelUpPending: false,
      investigationProficiency: {
        artifactAnalysis: 0,
        witnessInterrogation: 0,
        culturalIdentification: 0,
      },
      uniqueMechanic: UNIQUE_MECHANICS[background],
    }

    setState(prev => ({
      ...prev,
      character
    }))

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(character))
    } catch {}
  }, [])

  // Allocate additional stat points
  const allocateStatPoints = useCallback((statDeltas: Partial<SaddleStats>) => {
    if (!state.character) return

    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        stats: {
          ...prev.character!.stats,
          ...Object.fromEntries(
            Object.entries(statDeltas).map(([stat, delta]) => [
              stat,
              prev.character!.stats[stat as StatName] + delta
            ])
          )
        }
      }
    }))
  }, [state.character])

  // Get a stat value
  const getStat = useCallback((stat: StatName): number => {
    if (!state.character) return 5
    return state.character.stats[stat]
  }, [state.character])

  // Get stat modifier (for skill checks)
  // Every 2 points above 10 = +1, every 2 points below 10 = -1
  const getStatModifier = useCallback((stat: StatName): number => {
    const value = getStat(stat)
    return Math.floor((value - 10) / 2)
  }, [getStat])

  // Modify a stat
  const modifyStat = useCallback((stat: StatName, delta: number) => {
    if (!state.character) return

    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        stats: {
          ...prev.character!.stats,
          [stat]: Math.max(1, Math.min(20, prev.character!.stats[stat] + delta))
        }
      }
    }))
  }, [state.character])

  // Temporarily modify a stat
  const setStatTemporarily = useCallback((stat: StatName, value: number, duration: number) => {
    // This would need a timer system - for now just modify
    modifyStat(stat, value - getStat(stat))

    // In a full implementation, this would revert after duration
    setTimeout(() => {
      // Revert logic would go here
    }, duration * 1000)
  }, [modifyStat, getStat])

  // Roll a skill check
  const rollSkillCheck = useCallback((stat: StatName, difficulty: number): SkillCheckResult => {
    const statValue = getStat(stat)

    // Roll d20 + stat value vs difficulty
    const roll = Math.floor(Math.random() * 20) + 1
    const modifier = statValue
    const total = roll + modifier

    // Critical success on natural 20 or total > difficulty + 10
    // Critical failure on natural 1
    const criticalSuccess = roll === 20 || total >= difficulty + 10
    const criticalFailure = roll === 1

    // Luck can affect critical range
    const luckBonus = state.character?.traits.includes('blessed_by_spirits') ? 1 : 0
    const effectiveCriticalRange = 20 - luckBonus

    const result: SkillCheckResult = {
      stat,
      difficulty,
      roll,
      modifier,
      total,
      success: criticalFailure ? false : (criticalSuccess || total >= difficulty),
      criticalSuccess: roll >= effectiveCriticalRange || criticalSuccess,
      criticalFailure,
      margin: total - difficulty
    }

    setState(prev => ({
      ...prev,
      lastSkillCheck: result,
      skillCheckHistory: [...prev.skillCheckHistory.slice(-19), result]
    }))

    return result
  }, [getStat, state.character?.traits])

  // Check if character meets stat requirement
  const hasStatRequirement = useCallback((stat: StatName, requirement: number): boolean => {
    return getStat(stat) >= requirement
  }, [getStat])

  // Add experience
  const addExperience = useCallback((amount: number) => {
    if (!state.character) return

    setState(prev => {
      const newExp = Math.max(0, prev.character!.experience + amount)

      // Check for level up
      if (newExp >= prev.character!.experienceToNextLevel) {
        return {
          ...prev,
          character: {
            ...prev.character!,
            experience: newExp - prev.character!.experienceToNextLevel,
            level: prev.character!.level + 1,
            experienceToNextLevel: Math.floor(prev.character!.experienceToNextLevel * 1.5),
            pendingStatPoints: prev.character!.pendingStatPoints + 2,
            levelUpPending: true,
          }
        }
      }

      return {
        ...prev,
        character: {
          ...prev.character!,
          experience: newExp
        }
      }
    })
  }, [state.character])

  // Level up (legacy - triggers stat allocation prompt)
  const levelUp = useCallback(() => {
    if (!state.character) return
    // Now handled automatically in addExperience
  }, [state.character])

  // Allocate stat points earned from leveling up
  const allocateLevelUpPoints = useCallback((stat: StatName, points: number) => {
    if (!state.character) return
    if (points > state.character.pendingStatPoints) return

    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        stats: {
          ...prev.character!.stats,
          [stat]: Math.min(20, prev.character!.stats[stat] + points),
        },
        pendingStatPoints: prev.character!.pendingStatPoints - points,
        levelUpPending: prev.character!.pendingStatPoints - points > 0,
      }
    }))
  }, [state.character])

  // Dismiss the level-up prompt
  const dismissLevelUp = useCallback(() => {
    if (!state.character) return
    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        levelUpPending: false,
      }
    }))
  }, [state.character])

  // Add investigation proficiency XP
  const addInvestigationXP = useCallback((category: InvestigationCategory, amount: number) => {
    if (!state.character) return

    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        investigationProficiency: {
          ...prev.character!.investigationProficiency,
          [category]: prev.character!.investigationProficiency[category] + amount,
        }
      }
    }))
  }, [state.character])

  // Get the proficiency level name for a category
  const getInvestigationLevel = useCallback((category: InvestigationCategory): ProficiencyLevel => {
    if (!state.character) return 'novice'
    const xp = state.character.investigationProficiency[category]
    let level: ProficiencyLevel = 'novice'
    for (const threshold of PROFICIENCY_THRESHOLDS) {
      if (xp >= threshold.minXP) level = threshold.level
    }
    return level
  }, [state.character])

  // Get the numeric bonus for skill checks from proficiency
  const getInvestigationBonus = useCallback((category: InvestigationCategory): number => {
    if (!state.character) return 0
    const xp = state.character.investigationProficiency[category]
    let bonus = 0
    for (const threshold of PROFICIENCY_THRESHOLDS) {
      if (xp >= threshold.minXP) bonus = threshold.bonus
    }
    return bonus
  }, [state.character])

  // Add a trait
  const addTrait = useCallback((traitId: string) => {
    if (!state.character) return
    if (state.character.traits.includes(traitId)) return

    const trait = CHARACTER_TRAITS[traitId]
    if (!trait) return

    setState(prev => ({
      ...prev,
      character: {
        ...prev.character!,
        traits: [...prev.character!.traits, traitId],
        stats: {
          ...prev.character!.stats,
          ...Object.fromEntries(
            Object.entries(trait.statModifiers).map(([stat, bonus]) => [
              stat,
              prev.character!.stats[stat as StatName] + (bonus || 0)
            ])
          )
        }
      }
    }))
  }, [state.character])

  // Check if character has a trait
  const hasTrait = useCallback((traitId: string): boolean => {
    if (!state.character) return false
    return state.character.traits.includes(traitId)
  }, [state.character])

  // Get background bonuses
  const getBackgroundBonuses = useCallback((background: CharacterBackground): Partial<SaddleStats> => {
    return BACKGROUND_BONUSES[background]
  }, [])

  // Get stat description
  const getStatDescription = useCallback((stat: StatName): string => {
    return STAT_DESCRIPTIONS[stat]
  }, [])

  // Get unique mechanic
  const getUniqueMechanic = useCallback((): string => {
    if (!state.character) return ''
    return state.character.uniqueMechanic
  }, [state.character])

  // Persist character to localStorage whenever it changes
  React.useEffect(() => {
    if (state.character) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.character))
      } catch {}
    }
  }, [state.character])

  const value: CharacterContextValue = {
    state,
    createCharacter,
    allocateStatPoints,
    getStat,
    getStatModifier,
    modifyStat,
    setStatTemporarily,
    rollSkillCheck,
    hasStatRequirement,
    addExperience,
    levelUp,
    addTrait,
    hasTrait,
    allocateLevelUpPoints,
    dismissLevelUp,
    addInvestigationXP,
    getInvestigationLevel,
    getInvestigationBonus,
    getBackgroundBonuses,
    getStatDescription,
    getUniqueMechanic
  }

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const context = useContext(CharacterContext)
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}

// Utility function to format skill check results for display
export function formatSkillCheck(result: SkillCheckResult): string {
  if (result.criticalSuccess) {
    return `Critical Success! (${result.roll}+${result.modifier}=${result.total} vs DC${result.difficulty})`
  }
  if (result.criticalFailure) {
    return `Critical Failure! (Natural 1)`
  }
  if (result.success) {
    return `Success! (${result.roll}+${result.modifier}=${result.total} vs DC${result.difficulty})`
  }
  return `Failed. (${result.roll}+${result.modifier}=${result.total} vs DC${result.difficulty})`
}
