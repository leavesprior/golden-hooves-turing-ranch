'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// S.A.D.D.L.E. Stats (replacing basic party system)
export interface SaddleStats {
  Shrewdness: number   // Intelligence, deduction, clue interpretation
  Agility: number      // Speed, hunting, river crossings
  Durability: number   // Health, disease resistance
  Diplomacy: number    // NPC interactions, fair trades
  Luck: number         // Random events, gold finding
  Expertise: number    // Tracking, survival, repair
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

// Character background affects starting stats
export type CharacterBackground =
  | 'pinkerton_veteran'   // +Shrewdness, +Expertise
  | 'frontier_scout'      // +Agility, +Expertise
  | 'army_officer'        // +Diplomacy, +Durability
  | 'gambler'             // +Luck, +Shrewdness
  | 'doctor'              // +Shrewdness, +Durability
  | 'preacher'            // +Diplomacy, +Luck
  | 'outlaw_reformed'     // +Agility, +Luck, -Diplomacy with law

export interface CharacterTrait {
  id: string
  name: string
  description: string
  statModifiers: Partial<SaddleStats>
  specialAbility?: string
}

export interface Character {
  name: string
  background: CharacterBackground
  stats: SaddleStats
  traits: string[]  // IDs of acquired traits
  level: number
  experience: number
  experienceToNextLevel: number
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

  // Skill checks (Fallout-style)
  rollSkillCheck: (stat: StatName, difficulty: number) => SkillCheckResult
  hasStatRequirement: (stat: StatName, requirement: number) => boolean

  // Progression
  addExperience: (amount: number) => void
  levelUp: () => void
  addTrait: (traitId: string) => void
  hasTrait: (traitId: string) => boolean

  // Helpers
  getBackgroundBonuses: (background: CharacterBackground) => Partial<SaddleStats>
  getStatDescription: (stat: StatName) => string
}

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined)

// Background stat bonuses
const BACKGROUND_BONUSES: Record<CharacterBackground, Partial<SaddleStats>> = {
  pinkerton_veteran: { Shrewdness: 2, Expertise: 2 },
  frontier_scout: { Agility: 2, Expertise: 2 },
  army_officer: { Diplomacy: 2, Durability: 2 },
  gambler: { Luck: 2, Shrewdness: 2 },
  doctor: { Shrewdness: 2, Durability: 2 },
  preacher: { Diplomacy: 2, Luck: 2 },
  outlaw_reformed: { Agility: 2, Luck: 2 }
}

// Background descriptions
export const BACKGROUND_DESCRIPTIONS: Record<CharacterBackground, {
  name: string
  description: string
  bonuses: string
}> = {
  pinkerton_veteran: {
    name: 'Pinkerton Veteran',
    description: 'Years of detective work have honed your investigative skills.',
    bonuses: '+2 Shrewdness, +2 Expertise'
  },
  frontier_scout: {
    name: 'Frontier Scout',
    description: 'You know the land better than anyone.',
    bonuses: '+2 Agility, +2 Expertise'
  },
  army_officer: {
    name: 'Army Officer',
    description: 'Military discipline and leadership come naturally.',
    bonuses: '+2 Diplomacy, +2 Durability'
  },
  gambler: {
    name: 'Gambler',
    description: 'Lady Luck has always favored you. Reading people is your trade.',
    bonuses: '+2 Luck, +2 Shrewdness'
  },
  doctor: {
    name: 'Doctor',
    description: 'Medical training provides keen observation and endurance.',
    bonuses: '+2 Shrewdness, +2 Durability'
  },
  preacher: {
    name: 'Preacher',
    description: 'Faith guides you. People trust your words.',
    bonuses: '+2 Diplomacy, +2 Luck'
  },
  outlaw_reformed: {
    name: 'Reformed Outlaw',
    description: 'You know how criminals think. Some lawmen are suspicious.',
    bonuses: '+2 Agility, +2 Luck'
  }
}

// Stat descriptions
const STAT_DESCRIPTIONS: Record<StatName, string> = {
  Shrewdness: 'Intelligence and deduction. Helps interpret clues and see through lies.',
  Agility: 'Speed and reflexes. Improves hunting, river crossings, and escaping danger.',
  Durability: 'Health and constitution. Resists disease and recovers faster.',
  Diplomacy: 'Charisma and persuasion. Gets better prices, more information from witnesses.',
  Luck: 'Fortune favors you. Better random events, finding gold, critical successes.',
  Expertise: 'Practical skills. Tracking, survival, wagon repair, trail knowledge.'
}

// Available character traits
export const CHARACTER_TRAITS: Record<string, CharacterTrait> = {
  eagle_eye: {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'You notice details others miss.',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'First investigation at each location reveals extra clue'
  },
  silver_tongue: {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: 'Your words can convince almost anyone.',
    statModifiers: { Diplomacy: 1 },
    specialAbility: 'Reroll failed Diplomacy checks once per location'
  },
  iron_constitution: {
    id: 'iron_constitution',
    name: 'Iron Constitution',
    description: 'Disease rarely affects you.',
    statModifiers: { Durability: 2 },
    specialAbility: '50% chance to resist disease'
  },
  born_lucky: {
    id: 'born_lucky',
    name: 'Born Lucky',
    description: 'Things just seem to work out for you.',
    statModifiers: { Luck: 2 },
    specialAbility: 'Critical success range increased by 1'
  },
  trail_hardened: {
    id: 'trail_hardened',
    name: 'Trail Hardened',
    description: 'The wilderness holds no surprises for you.',
    statModifiers: { Expertise: 1, Agility: 1 },
    specialAbility: 'Travel speed +10%'
  },
  quick_draw: {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Your gun clears the holster faster than most.',
    statModifiers: { Agility: 2 },
    specialAbility: 'Always act first in confrontations'
  },
  poker_face: {
    id: 'poker_face',
    name: 'Poker Face',
    description: 'Your expression reveals nothing.',
    statModifiers: { Shrewdness: 1, Luck: 1 },
    specialAbility: 'Bluffs are harder to detect'
  },
  sympathetic_ear: {
    id: 'sympathetic_ear',
    name: 'Sympathetic Ear',
    description: 'People open up to you.',
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

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>(initialState)

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
      experienceToNextLevel: 100
    }

    setState(prev => ({
      ...prev,
      character
    }))
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

  // Roll a skill check (Fallout-style)
  const rollSkillCheck = useCallback((stat: StatName, difficulty: number): SkillCheckResult => {
    const statValue = getStat(stat)

    // Roll d20 + stat value vs difficulty * 2
    const roll = Math.floor(Math.random() * 20) + 1
    const modifier = statValue
    const total = roll + modifier

    // Critical success on natural 20 or total > difficulty + 10
    // Critical failure on natural 1
    const criticalSuccess = roll === 20 || total >= difficulty + 10
    const criticalFailure = roll === 1

    // Luck can affect critical range
    const luckBonus = state.character?.traits.includes('born_lucky') ? 1 : 0
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
      const newExp = prev.character!.experience + amount
      const newLevel = prev.character!.level

      // Check for level up
      if (newExp >= prev.character!.experienceToNextLevel) {
        return {
          ...prev,
          character: {
            ...prev.character!,
            experience: newExp - prev.character!.experienceToNextLevel,
            level: newLevel + 1,
            experienceToNextLevel: Math.floor(prev.character!.experienceToNextLevel * 1.5)
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

  // Level up (grant stat points)
  const levelUp = useCallback(() => {
    if (!state.character) return

    // Each level grants 2 stat points to allocate
    // For simplicity, auto-distribute based on background
    const background = state.character.background
    const bonuses = BACKGROUND_BONUSES[background]
    const statToBoost = Object.keys(bonuses)[0] as StatName

    modifyStat(statToBoost, 1)
    modifyStat('Luck', 1)  // Everyone gets luck

    addExperience(0) // Trigger level calculation
  }, [state.character, modifyStat, addExperience])

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
    getBackgroundBonuses,
    getStatDescription
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
