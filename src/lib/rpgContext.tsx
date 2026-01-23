'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// Types
export type ChapterId = 1 | 2 | 3 | 4 | 5
export type GamePhase = 'title' | 'playing' | 'dialogue' | 'puzzle' | 'paused' | 'complete'
export type AttributeName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// Progressive Graphics Tier - unlocked by BOTH level AND chapter completion
export type GraphicsTier = 'retro_4bit' | 'classic_8bit' | 'enhanced_16bit' | 'modern_32bit'

// Calculate graphics tier based on level and chapters completed
export function getGraphicsTier(level: number, chaptersCompleted: number): GraphicsTier {
  // Must meet BOTH requirements for each tier
  if (level >= 8 && chaptersCompleted >= 4) return 'modern_32bit'
  if (level >= 5 && chaptersCompleted >= 3) return 'enhanced_16bit'
  if (level >= 3 && chaptersCompleted >= 1) return 'classic_8bit'
  return 'retro_4bit'
}

// Get tier index for comparison (0-3)
export function getTierIndex(tier: GraphicsTier): number {
  const tiers: GraphicsTier[] = ['retro_4bit', 'classic_8bit', 'enhanced_16bit', 'modern_32bit']
  return tiers.indexOf(tier)
}

export interface Position {
  x: number
  y: number
}

// Legacy stats (kept for backward compatibility)
export interface PlayerStats {
  wisdom: number
  trust: number
  luck: number
  gold: number
}

// D&D 3.5 Style Character System
export interface CharacterAttributes {
  str: number  // Strength - mining, hauling, physical labor
  dex: number  // Dexterity - panning, riding, precision work
  con: number  // Constitution - endurance, health, disease resistance
  int: number  // Intelligence - geology, languages, business
  wis: number  // Wisdom - intuition, survival, land reading
  cha: number  // Charisma - negotiation, leadership, trust
}

export interface SkillRanks {
  // Mining skills
  prospecting: number
  panning: number
  hardrock_mining: number
  assaying: number
  // Survival skills
  wilderness_survival: number
  animal_handling: number
  navigation: number
  foraging: number
  // Social skills
  diplomacy: number
  intimidate: number
  gather_info: number
  sense_motive: number
  // Trade skills
  appraise: number
  craft_blacksmith: number
  craft_cooking: number
  profession_ranching: number
}

export type SkillName = keyof SkillRanks

export const SKILL_ATTRIBUTES: Record<SkillName, AttributeName> = {
  prospecting: 'int',
  panning: 'dex',
  hardrock_mining: 'str',
  assaying: 'int',
  wilderness_survival: 'wis',
  animal_handling: 'cha',
  navigation: 'int',
  foraging: 'wis',
  diplomacy: 'cha',
  intimidate: 'str',
  gather_info: 'cha',
  sense_motive: 'wis',
  appraise: 'int',
  craft_blacksmith: 'int',
  craft_cooking: 'wis',
  profession_ranching: 'wis',
}

export const SKILL_DISPLAY_NAMES: Record<SkillName, string> = {
  prospecting: 'Prospecting',
  panning: 'Panning',
  hardrock_mining: 'Hardrock Mining',
  assaying: 'Assaying',
  wilderness_survival: 'Wilderness Survival',
  animal_handling: 'Animal Handling',
  navigation: 'Navigation',
  foraging: 'Foraging',
  diplomacy: 'Diplomacy',
  intimidate: 'Intimidate',
  gather_info: 'Gather Information',
  sense_motive: 'Sense Motive',
  appraise: 'Appraise',
  craft_blacksmith: 'Blacksmithing',
  craft_cooking: 'Cooking',
  profession_ranching: 'Ranching',
}

export type TraitId =
  | 'forty_niner' | 'trail_veteran' | 'silver_tongue' | 'quick_hands'
  | 'book_learned' | 'strong_back' | 'lucky_strike' | 'animal_friend'

export type FeatId =
  | 'improved_panning' | 'keen_eye' | 'hardy' | 'haggler'
  | 'master_prospector' | 'iron_will' | 'leadership' | 'craft_mastery'
  | 'gold_sense' | 'respected_citizen' | 'land_baron' | 'legacy'

export interface Trait {
  id: TraitId
  name: string
  description: string
  effects: { type: 'skill_bonus' | 'stat_bonus' | 'special'; target?: string; value?: number }[]
  prerequisite?: { attribute: AttributeName; min: number }
}

export interface Feat {
  id: FeatId
  name: string
  description: string
  levelRequired: number
  effects: { type: 'skill_bonus' | 'stat_bonus' | 'special'; target?: string; value?: number }[]
}

export const TRAITS: Record<TraitId, Trait> = {
  forty_niner: {
    id: 'forty_niner',
    name: 'Forty-Niner',
    description: '+2 Prospecting, start with mining gear',
    effects: [{ type: 'skill_bonus', target: 'prospecting', value: 2 }],
  },
  trail_veteran: {
    id: 'trail_veteran',
    name: 'Trail Veteran',
    description: '+2 Wilderness Survival, resist fatigue',
    effects: [{ type: 'skill_bonus', target: 'wilderness_survival', value: 2 }],
    prerequisite: { attribute: 'con', min: 12 },
  },
  silver_tongue: {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: '+2 Diplomacy, better prices',
    effects: [{ type: 'skill_bonus', target: 'diplomacy', value: 2 }, { type: 'special', target: 'prices' }],
    prerequisite: { attribute: 'cha', min: 12 },
  },
  quick_hands: {
    id: 'quick_hands',
    name: 'Quick Hands',
    description: '+2 Panning, faster actions',
    effects: [{ type: 'skill_bonus', target: 'panning', value: 2 }],
    prerequisite: { attribute: 'dex', min: 12 },
  },
  book_learned: {
    id: 'book_learned',
    name: 'Book Learned',
    description: '+2 to all INT skills, can read/write',
    effects: [{ type: 'special', target: 'int_skills' }],
    prerequisite: { attribute: 'int', min: 12 },
  },
  strong_back: {
    id: 'strong_back',
    name: 'Strong Back',
    description: '+50% carrying capacity',
    effects: [{ type: 'special', target: 'carrying' }],
    prerequisite: { attribute: 'str', min: 14 },
  },
  lucky_strike: {
    id: 'lucky_strike',
    name: 'Lucky Strike',
    description: '10% bonus gold from mining',
    effects: [{ type: 'special', target: 'mining_gold' }],
  },
  animal_friend: {
    id: 'animal_friend',
    name: 'Animal Friend',
    description: '+2 Animal Handling, mount bonus',
    effects: [{ type: 'skill_bonus', target: 'animal_handling', value: 2 }],
    prerequisite: { attribute: 'wis', min: 12 },
  },
}

export const FEATS: Record<FeatId, Feat> = {
  improved_panning: { id: 'improved_panning', name: 'Improved Panning', description: 'Double gold from placer mining', levelRequired: 3, effects: [{ type: 'special', target: 'panning_yield' }] },
  keen_eye: { id: 'keen_eye', name: 'Keen Eye', description: 'Detect hidden items/passages', levelRequired: 3, effects: [{ type: 'special', target: 'hidden_detection' }] },
  hardy: { id: 'hardy', name: 'Hardy', description: '+20 max HP', levelRequired: 3, effects: [{ type: 'stat_bonus', target: 'hp', value: 20 }] },
  haggler: { id: 'haggler', name: 'Haggler', description: '15% better buy/sell prices', levelRequired: 3, effects: [{ type: 'special', target: 'prices' }] },
  master_prospector: { id: 'master_prospector', name: 'Master Prospector', description: 'Sense gold deposits on map', levelRequired: 6, effects: [{ type: 'special', target: 'gold_sense' }] },
  iron_will: { id: 'iron_will', name: 'Iron Will', description: 'Resist fear/intimidation', levelRequired: 6, effects: [{ type: 'special', target: 'will_save' }] },
  leadership: { id: 'leadership', name: 'Leadership', description: 'Recruit companion NPC', levelRequired: 6, effects: [{ type: 'special', target: 'companions' }] },
  craft_mastery: { id: 'craft_mastery', name: 'Craft Mastery', description: 'Create higher quality items', levelRequired: 6, effects: [{ type: 'special', target: 'crafting' }] },
  gold_sense: { id: 'gold_sense', name: 'Gold Sense', description: 'Automatically find richest deposits', levelRequired: 9, effects: [{ type: 'special', target: 'gold_finding' }] },
  respected_citizen: { id: 'respected_citizen', name: 'Respected Citizen', description: 'Unlock special dialogues', levelRequired: 9, effects: [{ type: 'special', target: 'dialogue_unlock' }] },
  land_baron: { id: 'land_baron', name: 'Land Baron', description: 'Purchase property, passive income', levelRequired: 9, effects: [{ type: 'special', target: 'property' }] },
  legacy: { id: 'legacy', name: 'Legacy', description: 'Unlock epilogue content', levelRequired: 9, effects: [{ type: 'special', target: 'epilogue' }] },
}

// XP requirements per level
export const XP_TABLE = [0, 0, 300, 900, 1900, 3400, 5500, 8300, 11900, 16400, 21900]

export interface CharacterSheet {
  attributes: CharacterAttributes
  skills: SkillRanks
  level: number
  xp: number
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  traits: TraitId[]
  feats: FeatId[]
  skillPoints: number  // Unspent skill points
  attributePoints: number  // Unspent attribute points
}

// ============ NPC Archetype System ============
// Personality archetypes that define how NPCs behave and respond

export type NPCArchetypeId =
  | 'grizzled_veteran'    // Experienced, cynical, respects hard work
  | 'eager_merchant'      // Profit-driven, persuadable, values deals
  | 'wise_elder'          // Patient, philosophical, rewards thoughtfulness
  | 'suspicious_local'    // Distrustful of outsiders, loyalty-focused
  | 'friendly_guide'      // Helpful, encouraging, likes newcomers
  | 'cunning_gambler'     // Risk-taker, respects cleverness
  | 'honest_worker'       // Values integrity, dislikes shortcuts
  | 'desperate_prospector' // Unpredictable, easily swayed by gold
  | 'stern_authority'     // Formal, respects rules and order
  | 'storyteller'         // Loves tales, responds to curiosity

export interface NPCArchetype {
  id: NPCArchetypeId
  name: string
  description: string
  // What this NPC values - affects attitude changes
  values: {
    honesty: number      // -2 to +2: responds to honest/deceptive choices
    courage: number      // -2 to +2: responds to brave/cowardly actions
    generosity: number   // -2 to +2: responds to giving/taking
    cunning: number      // -2 to +2: responds to clever/straightforward
    respect: number      // -2 to +2: responds to formal/casual approach
    curiosity: number    // -2 to +2: responds to questions/acceptance
  }
  // Greeting style variations by mood
  greetings: {
    hostile: string
    unfriendly: string
    neutral: string
    friendly: string
    allied: string
  }
  // How they refer to the player based on relationship
  playerTitles: {
    hostile: string
    unfriendly: string
    neutral: string
    friendly: string
    allied: string
  }
  // Topics this NPC knows about
  expertiseTopics: string[]
  // Dialogue quirks
  speechPattern?: string  // e.g., "Speaks in short sentences" or "Uses mining terms"
}

export const NPC_ARCHETYPES: Record<NPCArchetypeId, NPCArchetype> = {
  grizzled_veteran: {
    id: 'grizzled_veteran',
    name: 'Grizzled Veteran',
    description: 'Experienced, cynical, respects hard work',
    values: { honesty: 1, courage: 2, generosity: 0, cunning: -1, respect: 1, curiosity: -1 },
    greetings: {
      hostile: "What do YOU want?",
      unfriendly: "Hmph. You again.",
      neutral: "Somethin' I can help with?",
      friendly: "Good to see ya, partner.",
      allied: "Well if it ain't my trusted friend!",
    },
    playerTitles: {
      hostile: 'greenhorn',
      unfriendly: 'stranger',
      neutral: 'prospector',
      friendly: 'partner',
      allied: 'old friend',
    },
    expertiseTopics: ['mining', 'survival', 'gold_rush_history', 'claim_jumping'],
    speechPattern: 'Uses frontier slang and mining terms',
  },
  eager_merchant: {
    id: 'eager_merchant',
    name: 'Eager Merchant',
    description: 'Profit-driven, persuadable, values deals',
    values: { honesty: -1, courage: 0, generosity: -1, cunning: 2, respect: 1, curiosity: 1 },
    greetings: {
      hostile: "Your credit's no good here.",
      unfriendly: "Shopping or wasting my time?",
      neutral: "Welcome! Looking to buy?",
      friendly: "My favorite customer! What can I show you?",
      allied: "For you, my friend - special prices!",
    },
    playerTitles: {
      hostile: 'deadbeat',
      unfriendly: 'customer',
      neutral: 'sir/madam',
      friendly: 'valued patron',
      allied: 'dear friend',
    },
    expertiseTopics: ['prices', 'supplies', 'town_gossip', 'trade_routes'],
    speechPattern: 'Emphasizes value and deals',
  },
  wise_elder: {
    id: 'wise_elder',
    name: 'Wise Elder',
    description: 'Patient, philosophical, rewards thoughtfulness',
    values: { honesty: 2, courage: 1, generosity: 1, cunning: 0, respect: 2, curiosity: 2 },
    greetings: {
      hostile: "Your actions speak louder than words...",
      unfriendly: "I see you've returned.",
      neutral: "Ah, a seeker. What brings you?",
      friendly: "Welcome back, young one.",
      allied: "My door is always open to you.",
    },
    playerTitles: {
      hostile: 'troubled soul',
      unfriendly: 'young one',
      neutral: 'seeker',
      friendly: 'friend',
      allied: 'kindred spirit',
    },
    expertiseTopics: ['history', 'philosophy', 'native_wisdom', 'land_reading'],
    speechPattern: 'Speaks in metaphors and proverbs',
  },
  suspicious_local: {
    id: 'suspicious_local',
    name: 'Suspicious Local',
    description: 'Distrustful of outsiders, loyalty-focused',
    values: { honesty: 2, courage: 1, generosity: 0, cunning: -2, respect: 1, curiosity: -1 },
    greetings: {
      hostile: "Get out. Now.",
      unfriendly: "We don't like your kind here.",
      neutral: "State your business.",
      friendly: "You've proven yourself. Welcome.",
      allied: "You're one of us now.",
    },
    playerTitles: {
      hostile: 'trespasser',
      unfriendly: 'outsider',
      neutral: 'stranger',
      friendly: 'neighbor',
      allied: 'kin',
    },
    expertiseTopics: ['local_secrets', 'family_history', 'territorial_disputes'],
    speechPattern: 'Short, guarded responses',
  },
  friendly_guide: {
    id: 'friendly_guide',
    name: 'Friendly Guide',
    description: 'Helpful, encouraging, likes newcomers',
    values: { honesty: 1, courage: 0, generosity: 2, cunning: 0, respect: 0, curiosity: 1 },
    greetings: {
      hostile: "I... I thought you were different.",
      unfriendly: "Oh. It's you.",
      neutral: "Hello there! Need directions?",
      friendly: "Great to see you! How can I help?",
      allied: "My friend! What adventure awaits us?",
    },
    playerTitles: {
      hostile: 'you',
      unfriendly: 'traveler',
      neutral: 'friend',
      friendly: 'good friend',
      allied: 'dear companion',
    },
    expertiseTopics: ['navigation', 'camping', 'local_landmarks', 'safe_routes'],
    speechPattern: 'Enthusiastic and supportive',
  },
  cunning_gambler: {
    id: 'cunning_gambler',
    name: 'Cunning Gambler',
    description: 'Risk-taker, respects cleverness',
    values: { honesty: -1, courage: 1, generosity: 0, cunning: 2, respect: -1, curiosity: 1 },
    greetings: {
      hostile: "You cheated. We're done.",
      unfriendly: "Not feeling lucky today.",
      neutral: "Care for a wager?",
      friendly: "Ah, a kindred spirit! Shall we play?",
      allied: "The odds are always in your favor with me!",
    },
    playerTitles: {
      hostile: 'cheat',
      unfriendly: 'mark',
      neutral: 'player',
      friendly: 'sharp',
      allied: 'partner in crime',
    },
    expertiseTopics: ['gambling', 'odds', 'reading_people', 'saloon_gossip'],
    speechPattern: 'Uses gambling metaphors',
  },
  honest_worker: {
    id: 'honest_worker',
    name: 'Honest Worker',
    description: 'Values integrity, dislikes shortcuts',
    values: { honesty: 2, courage: 1, generosity: 1, cunning: -2, respect: 1, curiosity: 0 },
    greetings: {
      hostile: "I've got nothing to say to a snake.",
      unfriendly: "Keep walking.",
      neutral: "Mornin'. Hard day's work ahead.",
      friendly: "Good to see an honest face!",
      allied: "You're the real deal. What do you need?",
    },
    playerTitles: {
      hostile: 'snake',
      unfriendly: 'you',
      neutral: 'friend',
      friendly: 'good soul',
      allied: 'true friend',
    },
    expertiseTopics: ['farming', 'ranching', 'building', 'honest_work'],
    speechPattern: 'Plain, straightforward speech',
  },
  desperate_prospector: {
    id: 'desperate_prospector',
    name: 'Desperate Prospector',
    description: 'Unpredictable, easily swayed by gold',
    values: { honesty: -1, courage: 0, generosity: -2, cunning: 1, respect: -1, curiosity: 2 },
    greetings: {
      hostile: "Stay away from my claim!",
      unfriendly: "You after my gold?",
      neutral: "Any luck out there?",
      friendly: "Partner! Found anything good?",
      allied: "We'll strike it rich together!",
    },
    playerTitles: {
      hostile: 'claim jumper',
      unfriendly: 'competitor',
      neutral: 'fellow prospector',
      friendly: 'partner',
      allied: 'best friend',
    },
    expertiseTopics: ['gold_locations', 'mining_techniques', 'rumors', 'desperation'],
    speechPattern: 'Nervous, excitable, gold-obsessed',
  },
  stern_authority: {
    id: 'stern_authority',
    name: 'Stern Authority',
    description: 'Formal, respects rules and order',
    values: { honesty: 1, courage: 1, generosity: 0, cunning: -1, respect: 2, curiosity: 0 },
    greetings: {
      hostile: "You're under suspicion.",
      unfriendly: "Move along.",
      neutral: "Keep the peace.",
      friendly: "You've been a model citizen.",
      allied: "I can always count on you.",
    },
    playerTitles: {
      hostile: 'suspect',
      unfriendly: 'citizen',
      neutral: 'sir/madam',
      friendly: 'upstanding citizen',
      allied: 'trusted ally',
    },
    expertiseTopics: ['law', 'justice', 'town_order', 'criminals'],
    speechPattern: 'Formal, authoritative',
  },
  storyteller: {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Loves tales, responds to curiosity',
    values: { honesty: 0, courage: 1, generosity: 1, cunning: 0, respect: 0, curiosity: 2 },
    greetings: {
      hostile: "Some stories aren't meant to be told...",
      unfriendly: "Not in the mood for tales today.",
      neutral: "Care for a story?",
      friendly: "Ah! My favorite audience returns!",
      allied: "You inspire the best stories, friend!",
    },
    playerTitles: {
      hostile: 'you',
      unfriendly: 'listener',
      neutral: 'friend',
      friendly: 'dear listener',
      allied: 'story-brother/sister',
    },
    expertiseTopics: ['legends', 'folklore', 'mark_twain', 'gold_rush_tales'],
    speechPattern: 'Dramatic, uses colorful language',
  },
}

// Player play style tracking for NPC adaptation
export type PlayStyle =
  | 'explorer'     // Visits many locations, examines everything
  | 'completionist' // Tries to collect/complete everything
  | 'social'       // Talks to everyone, makes friends
  | 'efficient'    // Moves directly toward goals
  | 'cautious'     // Avoids risks, saves often
  | 'bold'         // Takes risks, makes daring choices

export interface PlayerProfile {
  // Tracked behaviors that determine play style
  tilesExplored: number
  dialoguesComplete: number
  itemsCollected: number
  skillChecksAttempted: number
  skillChecksPassed: number
  riskyChoicesTaken: number
  helpfulChoicesTaken: number

  // Derived play style (calculated)
  dominantStyle: PlayStyle

  // Current goals (tracked by game events)
  activeGoals: string[]
  completedGoals: string[]

  // Player values (derived from choices)
  demonstratedValues: {
    honesty: number    // -10 to +10
    courage: number
    generosity: number
    cunning: number
  }
}

// NPC Memory System
export interface NPCMemory {
  interactions: number
  giftsReceived: string[]
  questsCompleted: string[]
  insults: number
  helpGiven: number
  lastInteraction: number
}

export interface NPCState {
  id: string
  archetype?: NPCArchetypeId  // NPC personality archetype
  attitude: number  // -100 to +100
  trust: number     // 0 to 100
  memory: NPCMemory
  knownFacts: string[]
}

// Skill check result
export interface SkillCheckResult {
  success: boolean
  roll: number
  total: number
  dc: number
  margin: number  // How much over/under DC
}

export interface InventoryItem {
  id: string
  name: string
  icon: string
  description: string
}

export interface Choice {
  nodeId: string
  choiceIndex: number
  timestamp: number
}

export interface ChapterProgress {
  completed: boolean
  score: number
  puzzleSolved: boolean
  choicesMade: Choice[]
  itemsCollected: string[]
}

// ============ Puzzle System Types ============

export type PuzzleType = 'strength' | 'dexterity' | 'intelligence' | 'wisdom' | 'multi' | 'sequence'

export interface PuzzleStep {
  id: string
  description: string
  // What type of challenge this step is
  type: 'attribute_check' | 'skill_check' | 'item_use' | 'choice' | 'sequence'
  // For attribute/skill checks
  attributeCheck?: { attribute: AttributeName; dc: number }
  skillCheck?: { skill: SkillName; dc: number }
  // For item use
  requiredItem?: string
  consumeItem?: boolean
  // For choice puzzles
  options?: { text: string; correct: boolean; hint?: string }[]
  // For sequence puzzles
  correctSequence?: string[]
  // Feedback messages
  successMessage: string
  failureMessage: string
  hintMessage?: string
  // Allow retry?
  allowRetry: boolean
  maxAttempts?: number
}

export interface Puzzle {
  id: string
  name: string
  description: string
  type: PuzzleType
  chapter: ChapterId
  // Linked attribute for thematic display
  primaryAttribute: AttributeName
  // Steps in order
  steps: PuzzleStep[]
  // Rewards
  xpReward: number
  itemReward?: InventoryItem
  unlockReward?: string  // Exit or content to unlock
  objectiveReward?: string  // Objective to complete
  // Time limit in seconds (0 = no limit)
  timeLimit: number
  // Difficulty tier for XP scaling
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
}

export interface PuzzleAttempt {
  puzzleId: string
  currentStep: number
  stepAttempts: Record<string, number>  // attempts per step
  sequenceInput: string[]  // for sequence puzzles
  startTime: number
  completed: boolean
  success: boolean
}

export interface PuzzleState {
  activePuzzle: Puzzle | null
  attempt: PuzzleAttempt | null
  completedPuzzles: string[]  // puzzle IDs
  failedPuzzles: Record<string, number>  // puzzle ID -> fail count
}

export interface RPGSession {
  id: string
  playerName: string
  currentChapter: ChapterId
  currentMap: string
  position: Position
  stats: PlayerStats  // Legacy stats for backward compatibility
  character: CharacterSheet  // D&D 3.5 style character
  inventory: InventoryItem[]
  chapters: Record<ChapterId, ChapterProgress>
  npcStates: Record<string, NPCState>  // NPC memory/attitudes
  playerProfile: PlayerProfile  // Player behavior and play style tracking
  unlockedExits: string[]  // Exit IDs that have been unlocked
  completedObjectives: string[]  // Objective IDs that have been completed
  puzzleState: PuzzleState  // Current puzzle progress
  mapDiscovery: MapDiscovery  // Per-map fog of war state
  creationMethod: CreationMethod  // How character was created (for graphics tier)
  rerollsUsed: number  // Rerolls used during character creation (max 3)
  totalScore: number
  hintsUsed: number
  startedAt: Date
  completedAt?: Date
  ending?: 'prospector' | 'legend' | 'ghost'
}

// Skill check configuration for dialogue choices
export interface SkillCheck {
  skill: SkillName
  dc: number  // Difficulty Class
  successNode: string
  failNode?: string
}

export interface AttributeCheck {
  attribute: AttributeName
  min: number
}

export interface DialogueChoice {
  text: string
  nextNode: string
  // Legacy stat effects
  effect?: { stat: keyof PlayerStats; change: number }
  requirement?: { stat: keyof PlayerStats; min: number }
  // D&D 3.5 style checks
  skillCheck?: SkillCheck
  attributeCheck?: AttributeCheck
  levelRequirement?: number
  itemRequirement?: string  // Item ID required
  featRequirement?: FeatId
  // Rewards
  giveItem?: InventoryItem
  giveXP?: number
  modifyNPC?: { npcId: string; attitude?: number; trust?: number; fact?: string }
}

// NPC attitude thresholds for dynamic dialogue
export type NPCMood = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied'

// Dialogue variations based on NPC attitude
export interface DialogueVariation {
  mood: NPCMood           // Minimum attitude level for this variation
  text: string            // Alternative text to show
  choices?: DialogueChoice[]  // Alternative choices if mood-specific
}

export interface DialogueNode {
  id: string
  speaker: 'narrator' | 'tobias' | string
  text: string
  choices?: DialogueChoice[]
  nextNode?: string
  giveItem?: InventoryItem  // Item given when dialogue ends
  giveXP?: number           // XP given when dialogue ends
  effect?: { stat: keyof PlayerStats; change: number }  // Legacy stat effect when dialogue is shown
  unlockExit?: string       // Unlock an exit point
  completeObjective?: string // Mark an objective complete
  modifyNPC?: { npcId: string; attitude?: number; trust?: number; fact?: string }
  // AI-driven NPC features
  npcId?: string            // Which NPC this dialogue is with (for attitude lookup)
  variations?: DialogueVariation[]  // Different text based on NPC mood
  requiresMood?: NPCMood    // Only show this node if NPC has this mood or better
  trustGate?: number        // Minimum trust required to access this dialogue
  remembers?: string        // Shows different text if NPC knows this fact
  remembersText?: string    // Text to show if NPC remembers the fact
}

// Helper to convert attitude score to mood
export function getAttitudeMood(attitude: number): NPCMood {
  if (attitude <= -50) return 'hostile'
  if (attitude <= -10) return 'unfriendly'
  if (attitude <= 9) return 'neutral'
  if (attitude <= 49) return 'friendly'
  return 'allied'
}

// Mood comparison helper
export function moodMeetsThreshold(current: NPCMood, required: NPCMood): boolean {
  const moodOrder: NPCMood[] = ['hostile', 'unfriendly', 'neutral', 'friendly', 'allied']
  return moodOrder.indexOf(current) >= moodOrder.indexOf(required)
}

interface RPGContextType {
  // State
  phase: GamePhase
  session: RPGSession | null
  currentDialogue: DialogueNode | null

  // Actions
  startNewGame: (playerName: string, options?: CharacterCreationOptions) => void
  loadGame: () => boolean
  saveGame: () => void
  resetGame: () => void

  // Movement
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => boolean
  setPosition: (pos: Position) => void

  // Fog of War
  revealTiles: (mapId: string, positions: string[]) => void
  revealArea: (mapId: string, areaName: string) => void
  checkRevealTriggers: () => void  // Check if any objectives unlock new areas

  // Chapter & Map
  changeChapter: (chapter: ChapterId) => void
  changeMap: (mapId: string) => void

  // Dialogue
  startDialogue: (node: DialogueNode) => void
  advanceDialogue: () => void
  selectChoice: (choiceIndex: number, skillCheckResult?: SkillCheckResult) => void
  closeDialogue: () => void

  // Stats & Inventory (Legacy)
  modifyStat: (stat: keyof PlayerStats, change: number) => void
  addItem: (item: InventoryItem) => void
  removeItem: (itemId: string) => void
  hasItem: (itemId: string) => boolean

  // D&D 3.5 Character System
  getAttributeModifier: (attr: AttributeName) => number
  getSkillBonus: (skill: SkillName) => number
  rollSkillCheck: (skill: SkillName, dc: number) => SkillCheckResult
  addXP: (amount: number) => void
  levelUp: () => boolean  // Returns true if level up occurred
  spendSkillPoint: (skill: SkillName) => boolean
  spendAttributePoint: (attr: AttributeName) => boolean
  addTrait: (trait: TraitId) => boolean
  addFeat: (feat: FeatId) => boolean
  hasFeat: (feat: FeatId) => boolean
  hasTrait: (trait: TraitId) => boolean

  // NPC System
  getNPCState: (npcId: string) => NPCState
  modifyNPCAttitude: (npcId: string, change: number) => void
  modifyNPCTrust: (npcId: string, change: number) => void
  addNPCFact: (npcId: string, fact: string) => void

  // Unlock System
  unlockExit: (exitId: string) => void
  isExitUnlocked: (exitId: string) => boolean
  completeObjective: (objectiveId: string) => void
  isObjectiveComplete: (objectiveId: string) => boolean

  // NPC Dialogue System
  processDialogue: (node: DialogueNode) => DialogueNode  // Process node for NPC variations
  getNPCMood: (npcId: string) => NPCMood

  // NPC Archetype System
  getNPCArchetype: (npcId: string) => NPCArchetype | null
  setNPCArchetype: (npcId: string, archetypeId: NPCArchetypeId) => void
  getNPCGreeting: (npcId: string) => string
  getNPCPlayerTitle: (npcId: string) => string

  // Player Profile System
  getPlayerProfile: () => PlayerProfile
  trackBehavior: (type: 'explore' | 'dialogue' | 'item' | 'risky' | 'helpful') => void
  addPlayerGoal: (goal: string) => void
  completePlayerGoal: (goal: string) => void
  getPlayStyle: () => PlayStyle
  modifyPlayerValue: (value: 'honesty' | 'courage' | 'generosity' | 'cunning', change: number) => void

  // Puzzle System
  startPuzzle: (puzzle: Puzzle) => void
  attemptPuzzleStep: (input?: string | string[]) => { success: boolean; message: string; puzzleComplete?: boolean }
  getPuzzleHint: () => string | null
  abandonPuzzle: () => void
  isPuzzleCompleted: (puzzleId: string) => boolean
  getPuzzleState: () => PuzzleState

  // Progress
  completeChapter: (score: number) => void
  solvePuzzle: () => void
  addScore: (points: number) => void
  useHint: () => void

  // Rewards
  getDiscountCode: () => { code: string; percent: number } | null

  // Phase
  setPhase: (phase: GamePhase) => void

  // Graphics Tier
  graphicsTier: GraphicsTier
  getChaptersCompleted: () => number
}

const RPGContext = createContext<RPGContextType | undefined>(undefined)

const STORAGE_KEY = 'bobr_rpg_session'

// ============ Dice Rolling & Character Creation System ============

// Individual die roll result
export interface DieRoll {
  value: number
  kept: boolean  // Was this die kept or dropped?
}

// Result of rolling a single stat (4d6 drop lowest)
export interface StatRollResult {
  dice: DieRoll[]
  total: number
  dropped: number
}

// Full attribute roll results
export interface AttributeRolls {
  str: StatRollResult
  dex: StatRollResult
  con: StatRollResult
  int: StatRollResult
  wis: StatRollResult
  cha: StatRollResult
}

// Character creation method
export type CreationMethod = 'dice_roll' | 'mandelbrot' | 'standard'

// Roll 4d6 drop lowest (D&D 3.5 style)
export function rollStat(): StatRollResult {
  const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1)

  // Sort descending to find the lowest
  const sorted = [...rolls].sort((a, b) => b - a)
  const dropped = sorted[3]  // Lowest value

  // Create dice result with kept/dropped flags
  const dice: DieRoll[] = rolls.map((value, index) => {
    // Find if this is the first occurrence of the dropped value
    const droppedIndex = sorted.indexOf(dropped)
    const isDropped = index === rolls.indexOf(sorted[droppedIndex]) &&
      sorted.filter(v => v === dropped).length === 1
      ? value === dropped
      : value === dropped && rolls.slice(0, index).filter(v => v === dropped).length ===
        sorted.slice(0, 3).filter(v => v === dropped).length

    return { value, kept: true }
  })

  // Mark one instance of the lowest as dropped
  let dropFound = false
  for (let i = 0; i < dice.length; i++) {
    if (dice[i].value === dropped && !dropFound) {
      dice[i].kept = false
      dropFound = true
    }
  }

  const total = sorted[0] + sorted[1] + sorted[2]

  return { dice, total, dropped }
}

// Roll all six attributes
export function rollAllStats(): AttributeRolls {
  return {
    str: rollStat(),
    dex: rollStat(),
    con: rollStat(),
    int: rollStat(),
    wis: rollStat(),
    cha: rollStat(),
  }
}

// Generate Mandelbrot seed using z = z² + C iteration
export function generateMandelbrotSeed(): { seed: number; iterations: number; c: { re: number; im: number }; escaped: boolean } {
  const c = {
    re: Math.random() * 3 - 1.5,  // Range -1.5 to 1.5
    im: Math.random() * 3 - 1.5
  }
  let z = { re: 0, im: 0 }
  let iterations = 0
  const maxIterations = 100

  while (iterations < maxIterations && (z.re * z.re + z.im * z.im) < 4) {
    const newRe = z.re * z.re - z.im * z.im + c.re
    z.im = 2 * z.re * z.im + c.im
    z.re = newRe
    iterations++
  }

  const escaped = z.re * z.re + z.im * z.im >= 4

  // Generate a seed from 0-999 based on iteration count and final position
  const positionFactor = Math.abs(z.re * 100 + z.im * 100) % 100
  const seed = Math.floor((iterations * 10 + positionFactor) % 1000)

  return { seed, iterations, c, escaped }
}

// Use Mandelbrot seed to distribute balanced stats
export function distributeStatsMandelbrot(seed: number): CharacterAttributes {
  // Base pool of 72 points (average of 12 per stat, same as 4d6 drop lowest average ~12.24)
  const basePoints = 72

  // Use seed to create variation pattern
  const seedStr = seed.toString().padStart(3, '0')
  const variation = [
    parseInt(seedStr[0]) - 4,  // -4 to +5
    parseInt(seedStr[1]) - 4,
    parseInt(seedStr[2]) - 4,
    (seed % 7) - 3,            // -3 to +3
    ((seed >> 2) % 7) - 3,
    ((seed >> 4) % 7) - 3,
  ]

  // Calculate initial distribution (12 base + variation)
  const stats = [
    12 + variation[0],
    12 + variation[1],
    12 + variation[2],
    12 + variation[3],
    12 + variation[4],
    12 + variation[5],
  ]

  // Normalize to ensure total = 72 and all stats are between 8 and 16
  let total = stats.reduce((a, b) => a + b, 0)
  const diff = basePoints - total

  // Distribute difference across stats
  for (let i = 0; i < Math.abs(diff); i++) {
    const idx = i % 6
    if (diff > 0) {
      if (stats[idx] < 16) stats[idx]++
    } else {
      if (stats[idx] > 8) stats[idx]--
    }
  }

  // Ensure bounds (8-16 for Mandelbrot method)
  for (let i = 0; i < 6; i++) {
    stats[i] = Math.max(8, Math.min(16, stats[i]))
  }

  return {
    str: stats[0],
    dex: stats[1],
    con: stats[2],
    int: stats[3],
    wis: stats[4],
    cha: stats[5],
  }
}

// Convert AttributeRolls to CharacterAttributes
export function attributeRollsToStats(rolls: AttributeRolls): CharacterAttributes {
  return {
    str: rolls.str.total,
    dex: rolls.dex.total,
    con: rolls.con.total,
    int: rolls.int.total,
    wis: rolls.wis.total,
    cha: rolls.cha.total,
  }
}

// ============ Map Discovery / Fog of War System ============

export type TileVisibility = 'hidden' | 'fog' | 'revealed'

export interface MapDiscovery {
  [mapId: string]: {
    revealedTiles: string[]     // "x,y" format
    revealedAreas: string[]     // Named areas/features
    visitedPositions: string[]  // Positions player has stood on
  }
}

// Rules for what triggers reveal events
export interface RevealRule {
  id: string
  triggerId: string              // Objective/dialogue/item ID
  triggerType: 'objective' | 'dialogue' | 'item' | 'position'
  mapId: string                  // Which map this affects
  revealsPositions?: string[]    // "x,y" positions to reveal
  revealsArea?: string           // Named area to reveal
}

// Tile info for fog of war
export interface TileFogInfo {
  x: number
  y: number
  visibility: TileVisibility
  justRevealed?: boolean  // True if this tile was just revealed (for animation)
}

// Create empty map discovery for a map
export const createEmptyMapDiscovery = (mapId: string): MapDiscovery[string] => ({
  revealedTiles: [],
  revealedAreas: [],
  visitedPositions: [],
})

// Check if a tile should be visible based on fog rules
export function getTileVisibility(
  mapId: string,
  x: number,
  y: number,
  mapDiscovery: MapDiscovery,
  fogTiles?: string[],  // Tiles that should be fogged until revealed (e.g., "2,3")
  hiddenTiles?: string[]  // Tiles that are completely hidden (can't be seen at all)
): TileVisibility {
  const posKey = `${x},${y}`
  const discovery = mapDiscovery[mapId]

  // If tile is in hidden list and not revealed, it's hidden
  if (hiddenTiles?.includes(posKey)) {
    if (discovery?.revealedTiles.includes(posKey)) {
      return 'revealed'
    }
    return 'hidden'
  }

  // If tile is in fog list and not revealed, it's fogged
  if (fogTiles?.includes(posKey)) {
    if (discovery?.revealedTiles.includes(posKey)) {
      return 'revealed'
    }
    return 'fog'
  }

  // Default: tile is visible
  return 'revealed'
}

// Calculate attribute modifier (D&D 3.5 standard)
const getModifier = (score: number): number => Math.floor((score - 10) / 2)

// Create default character sheet
const createDefaultCharacter = (
  traits: TraitId[] = [],
  attributes?: CharacterAttributes
): CharacterSheet => {
  const baseAttributes: CharacterAttributes = attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  const baseSkills: SkillRanks = {
    prospecting: 0, panning: 0, hardrock_mining: 0, assaying: 0,
    wilderness_survival: 0, animal_handling: 0, navigation: 0, foraging: 0,
    diplomacy: 0, intimidate: 0, gather_info: 0, sense_motive: 0,
    appraise: 0, craft_blacksmith: 0, craft_cooking: 0, profession_ranching: 0,
  }

  const conMod = getModifier(baseAttributes.con)
  const intMod = getModifier(baseAttributes.int)

  return {
    attributes: baseAttributes,
    skills: baseSkills,
    level: 1,
    xp: 0,
    hp: 10 + conMod,
    maxHp: 10 + conMod,
    stamina: 100 + conMod * 10,
    maxStamina: 100 + conMod * 10,
    traits,
    feats: [],
    skillPoints: intMod + 4,  // Starting skill points
    attributePoints: 0,
  }
}

const createDefaultPuzzleState = (): PuzzleState => ({
  activePuzzle: null,
  attempt: null,
  completedPuzzles: [],
  failedPuzzles: {},
})

const createDefaultPlayerProfile = (): PlayerProfile => ({
  tilesExplored: 0,
  dialoguesComplete: 0,
  itemsCollected: 0,
  skillChecksAttempted: 0,
  skillChecksPassed: 0,
  riskyChoicesTaken: 0,
  helpfulChoicesTaken: 0,
  dominantStyle: 'explorer',
  activeGoals: ['reach_california'],  // Initial goal
  completedGoals: [],
  demonstratedValues: {
    honesty: 0,
    courage: 0,
    generosity: 0,
    cunning: 0,
  },
})

// Calculate dominant play style from tracked behaviors
const calculatePlayStyle = (profile: PlayerProfile): PlayStyle => {
  const { tilesExplored, dialoguesComplete, itemsCollected, riskyChoicesTaken, helpfulChoicesTaken } = profile
  const total = tilesExplored + dialoguesComplete + itemsCollected

  if (total === 0) return 'explorer'

  // Calculate ratios
  const explorationRatio = tilesExplored / Math.max(total, 1)
  const socialRatio = dialoguesComplete / Math.max(total, 1)
  const collectionRatio = itemsCollected / Math.max(total, 1)
  const riskRatio = riskyChoicesTaken / Math.max(riskyChoicesTaken + helpfulChoicesTaken, 1)

  // Determine dominant style
  if (collectionRatio > 0.4 && itemsCollected > 10) return 'completionist'
  if (socialRatio > 0.4 && dialoguesComplete > 10) return 'social'
  if (riskRatio > 0.6 && riskyChoicesTaken > 5) return 'bold'
  if (riskRatio < 0.3 && helpfulChoicesTaken > 5) return 'cautious'
  if (explorationRatio < 0.2 && total > 20) return 'efficient'
  return 'explorer'
}

// Options for creating a new game session
export interface CharacterCreationOptions {
  traits?: TraitId[]
  attributes?: CharacterAttributes
  creationMethod?: CreationMethod
  rerollsUsed?: number
}

const createNewSession = (
  playerName: string,
  options: CharacterCreationOptions = {}
): RPGSession => ({
  id: `rpg_${Date.now()}`,
  playerName,
  currentChapter: 1,
  currentMap: 'ch1_trail',
  position: { x: 4, y: 5 },
  stats: { wisdom: 0, trust: 0, luck: 0, gold: 0 },
  character: createDefaultCharacter(options.traits || [], options.attributes),
  inventory: [],
  chapters: {
    1: { completed: false, score: 0, puzzleSolved: false, choicesMade: [], itemsCollected: [] },
    2: { completed: false, score: 0, puzzleSolved: false, choicesMade: [], itemsCollected: [] },
    3: { completed: false, score: 0, puzzleSolved: false, choicesMade: [], itemsCollected: [] },
    4: { completed: false, score: 0, puzzleSolved: false, choicesMade: [], itemsCollected: [] },
    5: { completed: false, score: 0, puzzleSolved: false, choicesMade: [], itemsCollected: [] },
  },
  npcStates: {},
  playerProfile: createDefaultPlayerProfile(),
  unlockedExits: [],
  completedObjectives: [],
  puzzleState: createDefaultPuzzleState(),
  mapDiscovery: {},  // Start with no discoveries
  creationMethod: options.creationMethod || 'standard',
  rerollsUsed: options.rerollsUsed || 0,
  totalScore: 0,
  hintsUsed: 0,
  startedAt: new Date(),
})

export function RPGProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GamePhase>('title')
  const [session, setSession] = useState<RPGSession | null>(null)
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null)
  const [dialogueQueue, setDialogueQueue] = useState<DialogueNode[]>([])
  const [mounted, setMounted] = useState(false)

  // Load saved game on mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-save on session change
  useEffect(() => {
    if (mounted && session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  }, [session, mounted])

  const startNewGame = useCallback((playerName: string, options: CharacterCreationOptions = {}) => {
    const newSession = createNewSession(playerName, options)
    setSession(newSession)
    setPhase('playing')
  }, [])

  const loadGame = useCallback((): boolean => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)

        // Migrate old save data - add missing fields for backwards compatibility
        const migratedSession = {
          ...parsed,
          startedAt: new Date(parsed.startedAt),
          completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
          // Add playerProfile if missing (for saves before this feature was added)
          playerProfile: parsed.playerProfile || createDefaultPlayerProfile(),
          // Add puzzleState if missing
          puzzleState: parsed.puzzleState || createDefaultPuzzleState(),
          // Add unlockedExits if missing
          unlockedExits: parsed.unlockedExits || [],
          // Add completedObjectives if missing
          completedObjectives: parsed.completedObjectives || [],
          // Add mapDiscovery if missing (fog of war)
          mapDiscovery: parsed.mapDiscovery || {},
          // Add creationMethod if missing (default to standard for old saves)
          creationMethod: parsed.creationMethod || 'standard',
          // Add rerollsUsed if missing
          rerollsUsed: parsed.rerollsUsed || 0,
        }

        setSession(migratedSession)
        setPhase('playing')
        return true
      } catch {
        return false
      }
    }
    return false
  }, [])

  const saveGame = useCallback(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  }, [session])

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setPhase('title')
    setCurrentDialogue(null)
    setDialogueQueue([])
  }, [])

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    if (!session || phase !== 'playing') return false

    const delta = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }[direction]

    const newPos = {
      x: session.position.x + delta.x,
      y: session.position.y + delta.y,
    }

    // Bounds check (8x6 grid)
    if (newPos.x < 0 || newPos.x > 7 || newPos.y < 0 || newPos.y > 5) {
      return false
    }

    setSession(prev => prev ? { ...prev, position: newPos } : null)
    return true
  }, [session, phase])

  const setPosition = useCallback((pos: Position) => {
    setSession(prev => prev ? { ...prev, position: pos } : null)
  }, [])

  // ============ Fog of War Functions ============

  const revealTiles = useCallback((mapId: string, positions: string[]) => {
    setSession(prev => {
      if (!prev) return null

      const currentDiscovery = prev.mapDiscovery[mapId] || createEmptyMapDiscovery(mapId)
      const newRevealedTiles = [
        ...currentDiscovery.revealedTiles,
        ...positions.filter(pos => !currentDiscovery.revealedTiles.includes(pos))
      ]

      return {
        ...prev,
        mapDiscovery: {
          ...prev.mapDiscovery,
          [mapId]: {
            ...currentDiscovery,
            revealedTiles: newRevealedTiles,
          },
        },
      }
    })
  }, [])

  const revealArea = useCallback((mapId: string, areaName: string) => {
    setSession(prev => {
      if (!prev) return null

      const currentDiscovery = prev.mapDiscovery[mapId] || createEmptyMapDiscovery(mapId)
      if (currentDiscovery.revealedAreas.includes(areaName)) {
        return prev  // Already revealed
      }

      return {
        ...prev,
        mapDiscovery: {
          ...prev.mapDiscovery,
          [mapId]: {
            ...currentDiscovery,
            revealedAreas: [...currentDiscovery.revealedAreas, areaName],
          },
        },
      }
    })
  }, [])

  const checkRevealTriggers = useCallback(() => {
    if (!session) return

    // Import reveal rules from chapters and check each one
    import('./chapters').then(({ REVEAL_RULES }) => {
      if (!REVEAL_RULES) return

      REVEAL_RULES.forEach(rule => {
        let triggered = false

        switch (rule.triggerType) {
          case 'objective':
            triggered = session.completedObjectives.includes(rule.triggerId)
            break
          case 'item':
            triggered = session.inventory.some(item => item.id === rule.triggerId)
            break
          case 'dialogue':
            // Check if dialogue was completed (exists in choicesMade for any chapter)
            triggered = Object.values(session.chapters).some(chapter =>
              chapter.choicesMade.some(choice => choice.nodeId === rule.triggerId)
            )
            break
        }

        if (triggered) {
          if (rule.revealsPositions) {
            revealTiles(rule.mapId, rule.revealsPositions)
          }
          if (rule.revealsArea) {
            revealArea(rule.mapId, rule.revealsArea)
          }
        }
      })
    })
  }, [session, revealTiles, revealArea])

  // Auto-check reveal triggers when objectives, items, or choices change
  useEffect(() => {
    if (!session) return
    checkRevealTriggers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Watch for changes to completed objectives
    session?.completedObjectives?.length,
    // Watch for inventory changes
    session?.inventory?.length,
    // Watch for choice count changes across all chapters
    session && Object.values(session.chapters).reduce((sum, ch) => sum + ch.choicesMade.length, 0),
  ])

  const changeChapter = useCallback((chapter: ChapterId) => {
    setSession(prev => prev ? { ...prev, currentChapter: chapter } : null)
  }, [])

  const changeMap = useCallback((mapId: string) => {
    setSession(prev => prev ? { ...prev, currentMap: mapId } : null)
  }, [])

  const startDialogue = useCallback((node: DialogueNode) => {
    setCurrentDialogue(node)
    setPhase('dialogue')
  }, [])

  const advanceDialogue = useCallback(() => {
    if (!currentDialogue) return

    if (currentDialogue.choices && currentDialogue.choices.length > 0) {
      // Wait for choice selection
      return
    }

    // Process dialogue node rewards and effects
    setSession(prev => {
      if (!prev) return null
      let newSession = { ...prev }

      // Give item if this dialogue node has one
      if (currentDialogue.giveItem && !newSession.inventory.some(i => i.id === currentDialogue.giveItem!.id)) {
        newSession = {
          ...newSession,
          inventory: [...newSession.inventory, currentDialogue.giveItem!],
          chapters: {
            ...newSession.chapters,
            [newSession.currentChapter]: {
              ...newSession.chapters[newSession.currentChapter],
              itemsCollected: [...newSession.chapters[newSession.currentChapter].itemsCollected, currentDialogue.giveItem!.id],
            },
          },
        }
      }

      // Apply stat effect if specified (legacy stats with D&D attribute syncing)
      if (currentDialogue.effect) {
        const { stat, change } = currentDialogue.effect
        const oldValue = newSession.stats[stat]
        const newValue = oldValue + change

        // Calculate D&D attribute changes
        let attributeChanges: Partial<CharacterAttributes> = {}
        if (stat === 'wisdom') {
          const wisBonus = Math.floor(newValue / 2) - Math.floor(oldValue / 2)
          if (wisBonus !== 0) {
            attributeChanges.wis = newSession.character.attributes.wis + wisBonus
          }
        } else if (stat === 'trust') {
          const chaBonus = Math.floor(newValue / 2) - Math.floor(oldValue / 2)
          if (chaBonus !== 0) {
            attributeChanges.cha = newSession.character.attributes.cha + chaBonus
          }
        }

        newSession = {
          ...newSession,
          stats: {
            ...newSession.stats,
            [stat]: newValue,
          },
          character: Object.keys(attributeChanges).length > 0
            ? {
                ...newSession.character,
                attributes: {
                  ...newSession.character.attributes,
                  ...attributeChanges,
                },
              }
            : newSession.character,
        }
      }

      // Give XP if specified
      if (currentDialogue.giveXP) {
        const newXP = newSession.character.xp + currentDialogue.giveXP
        let newLevel = newSession.character.level
        let newSkillPoints = newSession.character.skillPoints
        let newAttributePoints = newSession.character.attributePoints

        while (newLevel < 10 && newXP >= XP_TABLE[newLevel + 1]) {
          newLevel++
          const intMod = getModifier(newSession.character.attributes.int)
          newSkillPoints += intMod + 2
          if (newLevel % 2 === 0) newAttributePoints++
        }

        const conMod = getModifier(newSession.character.attributes.con)
        const newMaxHp = 10 + conMod * newLevel

        newSession = {
          ...newSession,
          character: {
            ...newSession.character,
            xp: newXP,
            level: newLevel,
            skillPoints: newSkillPoints,
            attributePoints: newAttributePoints,
            maxHp: newMaxHp,
            hp: Math.min(newSession.character.hp, newMaxHp),
          },
          totalScore: newSession.totalScore + Math.floor(currentDialogue.giveXP / 10),
        }
      }

      // Modify NPC state if specified
      if (currentDialogue.modifyNPC) {
        const npcId = currentDialogue.modifyNPC.npcId
        const currentNPCState = newSession.npcStates[npcId] || {
          id: npcId,
          attitude: 0,
          trust: 0,
          memory: { interactions: 0, giftsReceived: [], questsCompleted: [], insults: 0, helpGiven: 0, lastInteraction: Date.now() },
          knownFacts: [],
        }

        const updatedNPCState = {
          ...currentNPCState,
          attitude: Math.max(-100, Math.min(100, currentNPCState.attitude + (currentDialogue.modifyNPC.attitude || 0))),
          trust: Math.max(0, Math.min(100, currentNPCState.trust + (currentDialogue.modifyNPC.trust || 0))),
          knownFacts: currentDialogue.modifyNPC.fact
            ? [...currentNPCState.knownFacts.filter(f => f !== currentDialogue.modifyNPC!.fact), currentDialogue.modifyNPC.fact]
            : currentNPCState.knownFacts,
          memory: {
            ...currentNPCState.memory,
            interactions: currentNPCState.memory.interactions + 1,
            lastInteraction: Date.now(),
          },
        }

        newSession = {
          ...newSession,
          npcStates: {
            ...newSession.npcStates,
            [npcId]: updatedNPCState,
          },
        }
      }

      // Unlock exit if specified
      if (currentDialogue.unlockExit && !newSession.unlockedExits.includes(currentDialogue.unlockExit)) {
        newSession = {
          ...newSession,
          unlockedExits: [...newSession.unlockedExits, currentDialogue.unlockExit],
        }
      }

      // Complete objective if specified
      if (currentDialogue.completeObjective && !newSession.completedObjectives.includes(currentDialogue.completeObjective)) {
        newSession = {
          ...newSession,
          completedObjectives: [...newSession.completedObjectives, currentDialogue.completeObjective],
        }
      }

      return newSession
    })

    if (currentDialogue.nextNode) {
      // Import dynamically to avoid circular dependency
      import('./chapters').then(({ getDialogueById }) => {
        const nextDialogue = getDialogueById(currentDialogue.nextNode!)
        if (nextDialogue) {
          setCurrentDialogue(nextDialogue)
        } else {
          setCurrentDialogue(null)
          setPhase('playing')
        }
      })
    } else {
      setCurrentDialogue(null)
      setPhase('playing')
    }
  }, [currentDialogue])

  const selectChoice = useCallback((choiceIndex: number, skillCheckResult?: SkillCheckResult) => {
    if (!currentDialogue?.choices || !session) return

    const choice = currentDialogue.choices[choiceIndex]

    // Apply effect and add item
    setSession(prev => {
      if (!prev) return null
      let newSession = { ...prev }

      // Record choice made
      newSession = {
        ...newSession,
        chapters: {
          ...newSession.chapters,
          [newSession.currentChapter]: {
            ...newSession.chapters[newSession.currentChapter],
            choicesMade: [
              ...newSession.chapters[newSession.currentChapter].choicesMade,
              { nodeId: currentDialogue.id, choiceIndex, timestamp: Date.now() },
            ],
          },
        },
      }

      // Apply stat effect (legacy)
      if (choice.effect) {
        newSession = {
          ...newSession,
          stats: {
            ...newSession.stats,
            [choice.effect.stat]: newSession.stats[choice.effect.stat] + choice.effect.change,
          },
        }
      }

      // Give item if specified
      if (choice.giveItem && !newSession.inventory.some(i => i.id === choice.giveItem!.id)) {
        newSession = {
          ...newSession,
          inventory: [...newSession.inventory, choice.giveItem],
          chapters: {
            ...newSession.chapters,
            [newSession.currentChapter]: {
              ...newSession.chapters[newSession.currentChapter],
              itemsCollected: [...newSession.chapters[newSession.currentChapter].itemsCollected, choice.giveItem.id],
            },
          },
        }
      }

      // Give XP if specified
      if (choice.giveXP) {
        const newXP = newSession.character.xp + choice.giveXP
        let newLevel = newSession.character.level
        let newSkillPoints = newSession.character.skillPoints
        let newAttributePoints = newSession.character.attributePoints

        // Check for level up
        while (newLevel < 10 && newXP >= XP_TABLE[newLevel + 1]) {
          newLevel++
          const intMod = getModifier(newSession.character.attributes.int)
          newSkillPoints += intMod + 2
          if (newLevel % 2 === 0) newAttributePoints++
        }

        const conMod = getModifier(newSession.character.attributes.con)
        const newMaxHp = 10 + conMod * newLevel

        newSession = {
          ...newSession,
          character: {
            ...newSession.character,
            xp: newXP,
            level: newLevel,
            skillPoints: newSkillPoints,
            attributePoints: newAttributePoints,
            maxHp: newMaxHp,
            hp: Math.min(newSession.character.hp, newMaxHp),
          },
          totalScore: newSession.totalScore + Math.floor(choice.giveXP / 10),
        }
      }

      // Modify NPC state if specified
      if (choice.modifyNPC) {
        const npcId = choice.modifyNPC.npcId
        const currentNPCState = newSession.npcStates[npcId] || {
          id: npcId,
          attitude: 0,
          trust: 0,
          memory: { interactions: 0, giftsReceived: [], questsCompleted: [], insults: 0, helpGiven: 0, lastInteraction: Date.now() },
          knownFacts: [],
        }

        const updatedNPCState = {
          ...currentNPCState,
          attitude: Math.max(-100, Math.min(100, currentNPCState.attitude + (choice.modifyNPC.attitude || 0))),
          trust: Math.max(0, Math.min(100, currentNPCState.trust + (choice.modifyNPC.trust || 0))),
          knownFacts: choice.modifyNPC.fact
            ? [...currentNPCState.knownFacts.filter(f => f !== choice.modifyNPC!.fact), choice.modifyNPC.fact]
            : currentNPCState.knownFacts,
          memory: {
            ...currentNPCState.memory,
            interactions: currentNPCState.memory.interactions + 1,
            lastInteraction: Date.now(),
          },
        }

        newSession = {
          ...newSession,
          npcStates: {
            ...newSession.npcStates,
            [npcId]: updatedNPCState,
          },
        }
      }

      return newSession
    })

    // Determine next node - handle skill check success/fail routing
    let targetNode = choice.nextNode
    if (choice.skillCheck && skillCheckResult) {
      if (skillCheckResult.success) {
        targetNode = choice.skillCheck.successNode
      } else if (choice.skillCheck.failNode) {
        targetNode = choice.skillCheck.failNode
      }
      // If no failNode specified, use the regular nextNode
    }

    // Follow nextNode if specified
    if (targetNode) {
      import('./chapters').then(({ getDialogueById }) => {
        const nextDialogue = getDialogueById(targetNode!)
        if (nextDialogue) {
          setCurrentDialogue(nextDialogue)
        } else {
          setCurrentDialogue(null)
          setPhase('playing')
        }
      })
    } else {
      setCurrentDialogue(null)
      setPhase('playing')
    }
  }, [currentDialogue, session])

  const closeDialogue = useCallback(() => {
    setCurrentDialogue(null)
    setPhase('playing')
  }, [])

  const modifyStat = useCallback((stat: keyof PlayerStats, change: number) => {
    setSession(prev => {
      if (!prev) return null

      const newStatValue = prev.stats[stat] + change
      const oldStatValue = prev.stats[stat]

      // Calculate D&D attribute changes based on legacy stat changes
      // wisdom → WIS (+1 per 2 wisdom)
      // trust → CHA (+1 per 2 trust)
      let attributeChanges: Partial<CharacterAttributes> = {}

      if (stat === 'wisdom') {
        // Calculate WIS bonus: floor(newValue / 2) - floor(oldValue / 2)
        const wisBonus = Math.floor(newStatValue / 2) - Math.floor(oldStatValue / 2)
        if (wisBonus !== 0) {
          attributeChanges.wis = prev.character.attributes.wis + wisBonus
        }
      } else if (stat === 'trust') {
        // Calculate CHA bonus: floor(newValue / 2) - floor(oldValue / 2)
        const chaBonus = Math.floor(newStatValue / 2) - Math.floor(oldStatValue / 2)
        if (chaBonus !== 0) {
          attributeChanges.cha = prev.character.attributes.cha + chaBonus
        }
      }
      // Luck doesn't modify attributes directly but affects roll bonuses

      return {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: newStatValue,
        },
        character: Object.keys(attributeChanges).length > 0
          ? {
              ...prev.character,
              attributes: {
                ...prev.character.attributes,
                ...attributeChanges,
              },
            }
          : prev.character,
      }
    })
  }, [])

  const addItem = useCallback((item: InventoryItem) => {
    setSession(prev => {
      if (!prev) return null
      if (prev.inventory.some(i => i.id === item.id)) return prev
      return {
        ...prev,
        inventory: [...prev.inventory, item],
        chapters: {
          ...prev.chapters,
          [prev.currentChapter]: {
            ...prev.chapters[prev.currentChapter],
            itemsCollected: [...prev.chapters[prev.currentChapter].itemsCollected, item.id],
          },
        },
      }
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== itemId),
      }
    })
  }, [])

  const hasItem = useCallback((itemId: string): boolean => {
    return session?.inventory.some(i => i.id === itemId) ?? false
  }, [session])

  // ============ D&D 3.5 Character System Functions ============

  const getAttributeModifier = useCallback((attr: AttributeName): number => {
    if (!session) return 0
    return getModifier(session.character.attributes[attr])
  }, [session])

  const getSkillBonus = useCallback((skill: SkillName): number => {
    if (!session) return 0
    const ranks = session.character.skills[skill]
    const attrMod = getModifier(session.character.attributes[SKILL_ATTRIBUTES[skill]])

    // Add trait bonuses
    let traitBonus = 0
    for (const traitId of session.character.traits) {
      const trait = TRAITS[traitId]
      for (const effect of trait.effects) {
        if (effect.type === 'skill_bonus' && effect.target === skill && effect.value) {
          traitBonus += effect.value
        }
      }
    }

    return ranks + attrMod + traitBonus
  }, [session])

  const rollSkillCheck = useCallback((skill: SkillName, dc: number): SkillCheckResult => {
    const skillBonus = getSkillBonus(skill)
    // Add luck bonus: +1 per 3 luck stat points
    const luckBonus = session ? Math.floor(session.stats.luck / 3) : 0
    const totalBonus = skillBonus + luckBonus

    const roll = Math.floor(Math.random() * 20) + 1  // d20 roll
    const total = roll + totalBonus
    const success = total >= dc

    return {
      success,
      roll,
      total,
      dc,
      margin: total - dc,
    }
  }, [getSkillBonus, session])

  const addXP = useCallback((amount: number) => {
    setSession(prev => {
      if (!prev) return null
      const newXP = prev.character.xp + amount
      let newLevel = prev.character.level
      let newSkillPoints = prev.character.skillPoints
      let newAttributePoints = prev.character.attributePoints

      // Check for level up
      while (newLevel < 10 && newXP >= XP_TABLE[newLevel + 1]) {
        newLevel++
        const intMod = getModifier(prev.character.attributes.int)
        newSkillPoints += intMod + 2  // Skill points per level

        // Attribute point every even level
        if (newLevel % 2 === 0) {
          newAttributePoints++
        }
      }

      // Recalculate HP if level changed
      const conMod = getModifier(prev.character.attributes.con)
      const newMaxHp = 10 + conMod * newLevel

      return {
        ...prev,
        character: {
          ...prev.character,
          xp: newXP,
          level: newLevel,
          skillPoints: newSkillPoints,
          attributePoints: newAttributePoints,
          maxHp: newMaxHp,
          hp: Math.min(prev.character.hp, newMaxHp),
        },
        totalScore: prev.totalScore + Math.floor(amount / 10),  // XP also adds to score
      }
    })
  }, [])

  const levelUp = useCallback((): boolean => {
    if (!session) return false
    const nextLevelXP = XP_TABLE[session.character.level + 1]
    if (!nextLevelXP || session.character.xp < nextLevelXP) return false

    // Level up happens automatically in addXP
    return true
  }, [session])

  const spendSkillPoint = useCallback((skill: SkillName): boolean => {
    if (!session || session.character.skillPoints <= 0) return false

    const maxRank = session.character.level + 3
    if (session.character.skills[skill] >= maxRank) return false

    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        character: {
          ...prev.character,
          skills: {
            ...prev.character.skills,
            [skill]: prev.character.skills[skill] + 1,
          },
          skillPoints: prev.character.skillPoints - 1,
        },
      }
    })
    return true
  }, [session])

  const spendAttributePoint = useCallback((attr: AttributeName): boolean => {
    if (!session || session.character.attributePoints <= 0) return false
    if (session.character.attributes[attr] >= 20) return false  // Max 20

    setSession(prev => {
      if (!prev) return null
      const newAttributes = {
        ...prev.character.attributes,
        [attr]: prev.character.attributes[attr] + 1,
      }

      // Recalculate derived stats if CON changed
      let newMaxHp = prev.character.maxHp
      let newMaxStamina = prev.character.maxStamina
      if (attr === 'con') {
        const newConMod = getModifier(newAttributes.con)
        newMaxHp = 10 + newConMod * prev.character.level
        newMaxStamina = 100 + newConMod * 10
      }

      return {
        ...prev,
        character: {
          ...prev.character,
          attributes: newAttributes,
          attributePoints: prev.character.attributePoints - 1,
          maxHp: newMaxHp,
          hp: Math.min(prev.character.hp, newMaxHp),
          maxStamina: newMaxStamina,
        },
      }
    })
    return true
  }, [session])

  const addTrait = useCallback((trait: TraitId): boolean => {
    if (!session) return false
    if (session.character.traits.includes(trait)) return false
    if (session.character.traits.length >= 2) return false  // Max 2 traits

    const traitDef = TRAITS[trait]
    if (traitDef.prerequisite) {
      const attrValue = session.character.attributes[traitDef.prerequisite.attribute]
      if (attrValue < traitDef.prerequisite.min) return false
    }

    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        character: {
          ...prev.character,
          traits: [...prev.character.traits, trait],
        },
      }
    })
    return true
  }, [session])

  const addFeat = useCallback((feat: FeatId): boolean => {
    if (!session) return false
    if (session.character.feats.includes(feat)) return false

    const featDef = FEATS[feat]
    if (session.character.level < featDef.levelRequired) return false

    // Check feat slots (every 3 levels starting at 3)
    const maxFeats = Math.floor(session.character.level / 3)
    if (session.character.feats.length >= maxFeats) return false

    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        character: {
          ...prev.character,
          feats: [...prev.character.feats, feat],
        },
      }
    })
    return true
  }, [session])

  const hasFeat = useCallback((feat: FeatId): boolean => {
    return session?.character.feats.includes(feat) ?? false
  }, [session])

  const hasTrait = useCallback((trait: TraitId): boolean => {
    return session?.character.traits.includes(trait) ?? false
  }, [session])

  // ============ NPC System Functions ============

  const createDefaultNPCState = (npcId: string): NPCState => ({
    id: npcId,
    attitude: 0,
    trust: 0,
    memory: {
      interactions: 0,
      giftsReceived: [],
      questsCompleted: [],
      insults: 0,
      helpGiven: 0,
      lastInteraction: Date.now(),
    },
    knownFacts: [],
  })

  const getNPCState = useCallback((npcId: string): NPCState => {
    if (!session) return createDefaultNPCState(npcId)
    return session.npcStates[npcId] || createDefaultNPCState(npcId)
  }, [session])

  const modifyNPCAttitude = useCallback((npcId: string, change: number) => {
    setSession(prev => {
      if (!prev) return null
      const currentState = prev.npcStates[npcId] || createDefaultNPCState(npcId)
      const newAttitude = Math.max(-100, Math.min(100, currentState.attitude + change))

      return {
        ...prev,
        npcStates: {
          ...prev.npcStates,
          [npcId]: {
            ...currentState,
            attitude: newAttitude,
            memory: {
              ...currentState.memory,
              interactions: currentState.memory.interactions + 1,
              lastInteraction: Date.now(),
            },
          },
        },
      }
    })
  }, [])

  const modifyNPCTrust = useCallback((npcId: string, change: number) => {
    setSession(prev => {
      if (!prev) return null
      const currentState = prev.npcStates[npcId] || createDefaultNPCState(npcId)
      const newTrust = Math.max(0, Math.min(100, currentState.trust + change))

      return {
        ...prev,
        npcStates: {
          ...prev.npcStates,
          [npcId]: {
            ...currentState,
            trust: newTrust,
          },
        },
      }
    })
  }, [])

  const addNPCFact = useCallback((npcId: string, fact: string) => {
    setSession(prev => {
      if (!prev) return null
      const currentState = prev.npcStates[npcId] || createDefaultNPCState(npcId)
      if (currentState.knownFacts.includes(fact)) return prev

      return {
        ...prev,
        npcStates: {
          ...prev.npcStates,
          [npcId]: {
            ...currentState,
            knownFacts: [...currentState.knownFacts, fact],
          },
        },
      }
    })
  }, [])

  const getNPCMood = useCallback((npcId: string): NPCMood => {
    const state = getNPCState(npcId)
    return getAttitudeMood(state.attitude)
  }, [getNPCState])

  const processDialogue = useCallback((node: DialogueNode): DialogueNode => {
    if (!session) return node

    let processedNode = { ...node }
    const npcId = node.npcId || node.speaker

    // Get NPC state for this dialogue
    const npcState = getNPCState(npcId)
    const mood = getAttitudeMood(npcState.attitude)
    const archetype = npcState.archetype ? NPC_ARCHETYPES[npcState.archetype] : null

    // Check if NPC remembers something and apply different text
    if (node.remembers && node.remembersText && npcState.knownFacts.includes(node.remembers)) {
      processedNode = {
        ...processedNode,
        text: node.remembersText,
      }
    }

    // Apply mood-based variations (best matching mood wins)
    if (node.variations && node.variations.length > 0) {
      const moodOrder: NPCMood[] = ['hostile', 'unfriendly', 'neutral', 'friendly', 'allied']
      const currentMoodIndex = moodOrder.indexOf(mood)

      // Find the highest mood variation that applies (mood <= current)
      let bestVariation: DialogueVariation | null = null
      let bestMoodIndex = -1

      for (const variation of node.variations) {
        const variationMoodIndex = moodOrder.indexOf(variation.mood)
        if (variationMoodIndex <= currentMoodIndex && variationMoodIndex > bestMoodIndex) {
          bestVariation = variation
          bestMoodIndex = variationMoodIndex
        }
      }

      if (bestVariation) {
        processedNode = {
          ...processedNode,
          text: bestVariation.text,
          choices: bestVariation.choices || processedNode.choices,
        }
      }
    }

    // Apply archetype-based dynamic text replacements
    if (archetype) {
      const playerTitle = archetype.playerTitles[mood]
      const greeting = archetype.greetings[mood]

      // Replace placeholders in text with archetype-specific values
      processedNode = {
        ...processedNode,
        text: processedNode.text
          .replace(/\{playerTitle\}/g, playerTitle)
          .replace(/\{greeting\}/g, greeting)
          .replace(/\{mood\}/g, mood),
      }

      // Also process choices text for placeholders
      if (processedNode.choices) {
        processedNode.choices = processedNode.choices.map(choice => ({
          ...choice,
          text: choice.text
            .replace(/\{playerTitle\}/g, playerTitle)
            .replace(/\{greeting\}/g, greeting),
        }))
      }
    }

    // Apply player experience/goal-based text variations (with safety check for old saves)
    const profile = session.playerProfile || createDefaultPlayerProfile()
    const playStyle = profile.dominantStyle

    // Add play style awareness - NPCs can acknowledge player's approach
    processedNode = {
      ...processedNode,
      text: processedNode.text
        .replace(/\{playStyle\}/g, playStyle)
        .replace(/\{playerLevel\}/g, session.character.level.toString())
        .replace(/\{chapterProgress\}/g, session.currentChapter.toString()),
    }

    return processedNode
  }, [session, getNPCState])

  // ============ NPC Archetype System Functions ============

  const getNPCArchetype = useCallback((npcId: string): NPCArchetype | null => {
    const npcState = getNPCState(npcId)
    if (!npcState.archetype) return null
    return NPC_ARCHETYPES[npcState.archetype] || null
  }, [getNPCState])

  const setNPCArchetype = useCallback((npcId: string, archetypeId: NPCArchetypeId) => {
    setSession(prev => {
      if (!prev) return null
      const currentState = prev.npcStates[npcId] || createDefaultNPCState(npcId)

      return {
        ...prev,
        npcStates: {
          ...prev.npcStates,
          [npcId]: {
            ...currentState,
            archetype: archetypeId,
          },
        },
      }
    })
  }, [])

  const getNPCGreeting = useCallback((npcId: string): string => {
    const npcState = getNPCState(npcId)
    const archetype = npcState.archetype ? NPC_ARCHETYPES[npcState.archetype] : null
    if (!archetype) return 'Greetings.'

    const mood = getAttitudeMood(npcState.attitude)
    return archetype.greetings[mood]
  }, [getNPCState])

  const getNPCPlayerTitle = useCallback((npcId: string): string => {
    const npcState = getNPCState(npcId)
    const archetype = npcState.archetype ? NPC_ARCHETYPES[npcState.archetype] : null
    if (!archetype) return 'friend'

    const mood = getAttitudeMood(npcState.attitude)
    return archetype.playerTitles[mood]
  }, [getNPCState])

  // ============ Player Profile System Functions ============

  const getPlayerProfile = useCallback((): PlayerProfile => {
    return session?.playerProfile || createDefaultPlayerProfile()
  }, [session])

  const trackBehavior = useCallback((type: 'explore' | 'dialogue' | 'item' | 'risky' | 'helpful') => {
    setSession(prev => {
      if (!prev) return null

      const profile = { ...(prev.playerProfile || createDefaultPlayerProfile()) }

      switch (type) {
        case 'explore':
          profile.tilesExplored++
          break
        case 'dialogue':
          profile.dialoguesComplete++
          break
        case 'item':
          profile.itemsCollected++
          break
        case 'risky':
          profile.riskyChoicesTaken++
          break
        case 'helpful':
          profile.helpfulChoicesTaken++
          break
      }

      // Recalculate play style
      profile.dominantStyle = calculatePlayStyle(profile)

      return {
        ...prev,
        playerProfile: profile,
      }
    })
  }, [])

  const addPlayerGoal = useCallback((goal: string) => {
    setSession(prev => {
      if (!prev) return null
      const profile = prev.playerProfile || createDefaultPlayerProfile()
      if (profile.activeGoals.includes(goal)) return prev

      return {
        ...prev,
        playerProfile: {
          ...profile,
          activeGoals: [...profile.activeGoals, goal],
        },
      }
    })
  }, [])

  const completePlayerGoal = useCallback((goal: string) => {
    setSession(prev => {
      if (!prev) return null
      const profile = prev.playerProfile || createDefaultPlayerProfile()
      if (!profile.activeGoals.includes(goal)) return prev
      if (profile.completedGoals.includes(goal)) return prev

      return {
        ...prev,
        playerProfile: {
          ...profile,
          activeGoals: profile.activeGoals.filter(g => g !== goal),
          completedGoals: [...profile.completedGoals, goal],
        },
      }
    })
  }, [])

  const getPlayStyle = useCallback((): PlayStyle => {
    const profile = session?.playerProfile || createDefaultPlayerProfile()
    return profile.dominantStyle || 'explorer'
  }, [session])

  const modifyPlayerValue = useCallback((value: 'honesty' | 'courage' | 'generosity' | 'cunning', change: number) => {
    setSession(prev => {
      if (!prev) return null

      const profile = prev.playerProfile || createDefaultPlayerProfile()
      const currentValue = profile.demonstratedValues[value]
      const newValue = Math.max(-10, Math.min(10, currentValue + change))

      return {
        ...prev,
        playerProfile: {
          ...profile,
          demonstratedValues: {
            ...profile.demonstratedValues,
            [value]: newValue,
          },
        },
      }
    })
  }, [])

  // ============ Puzzle System Functions ============

  const startPuzzle = useCallback((puzzle: Puzzle) => {
    if (!session) return

    const attempt: PuzzleAttempt = {
      puzzleId: puzzle.id,
      currentStep: 0,
      stepAttempts: {},
      sequenceInput: [],
      startTime: Date.now(),
      completed: false,
      success: false,
    }

    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        puzzleState: {
          ...prev.puzzleState,
          activePuzzle: puzzle,
          attempt,
        },
      }
    })
    setPhase('puzzle')
  }, [session])

  const attemptPuzzleStep = useCallback((input?: string | string[]): { success: boolean; message: string; puzzleComplete?: boolean } => {
    if (!session?.puzzleState.activePuzzle || !session?.puzzleState.attempt) {
      return { success: false, message: 'No active puzzle' }
    }

    const puzzle = session.puzzleState.activePuzzle
    const attempt = session.puzzleState.attempt
    const currentStep = puzzle.steps[attempt.currentStep]

    if (!currentStep) {
      return { success: false, message: 'Invalid puzzle step' }
    }

    // Track attempt count for this step
    const stepId = currentStep.id
    const attemptCount = (attempt.stepAttempts[stepId] || 0) + 1

    let success = false
    let message = currentStep.failureMessage

    // Evaluate based on step type
    switch (currentStep.type) {
      case 'attribute_check':
        if (currentStep.attributeCheck) {
          const attrValue = session.character.attributes[currentStep.attributeCheck.attribute]
          const modifier = getModifier(attrValue)
          const roll = Math.floor(Math.random() * 20) + 1
          const total = roll + modifier
          success = total >= currentStep.attributeCheck.dc
          if (success) {
            message = `${currentStep.successMessage} (Rolled ${roll} + ${modifier} = ${total} vs DC ${currentStep.attributeCheck.dc})`
          } else {
            message = `${currentStep.failureMessage} (Rolled ${roll} + ${modifier} = ${total} vs DC ${currentStep.attributeCheck.dc})`
          }
        }
        break

      case 'skill_check':
        if (currentStep.skillCheck) {
          const result = rollSkillCheck(currentStep.skillCheck.skill, currentStep.skillCheck.dc)
          success = result.success
          if (success) {
            message = `${currentStep.successMessage} (Rolled ${result.roll} + ${result.total - result.roll} = ${result.total} vs DC ${result.dc})`
          } else {
            message = `${currentStep.failureMessage} (Rolled ${result.roll} + ${result.total - result.roll} = ${result.total} vs DC ${result.dc})`
          }
        }
        break

      case 'item_use':
        if (currentStep.requiredItem) {
          success = hasItem(currentStep.requiredItem)
          if (success) {
            message = currentStep.successMessage
            if (currentStep.consumeItem) {
              removeItem(currentStep.requiredItem)
            }
          }
        }
        break

      case 'choice':
        if (currentStep.options && typeof input === 'string') {
          const selectedOption = currentStep.options.find(opt => opt.text === input)
          if (selectedOption) {
            success = selectedOption.correct
            message = success ? currentStep.successMessage : (selectedOption.hint || currentStep.failureMessage)
          }
        }
        break

      case 'sequence':
        if (currentStep.correctSequence && Array.isArray(input)) {
          const correctSeq = currentStep.correctSequence
          success = input.length === correctSeq.length && input.every((val, idx) => val === correctSeq[idx])
          message = success ? currentStep.successMessage : currentStep.failureMessage
        }
        break
    }

    // Check max attempts
    const maxAttempts = currentStep.maxAttempts || (currentStep.allowRetry ? Infinity : 1)
    const canRetry = currentStep.allowRetry && attemptCount < maxAttempts

    // Update puzzle state
    setSession(prev => {
      if (!prev || !prev.puzzleState.attempt) return null

      const newAttempt = {
        ...prev.puzzleState.attempt,
        stepAttempts: {
          ...prev.puzzleState.attempt.stepAttempts,
          [stepId]: attemptCount,
        },
      }

      if (success) {
        // Move to next step
        const nextStepIndex = prev.puzzleState.attempt.currentStep + 1
        const isComplete = nextStepIndex >= puzzle.steps.length

        if (isComplete) {
          // Puzzle completed successfully!
          newAttempt.completed = true
          newAttempt.success = true

          // Apply rewards
          let newSession = {
            ...prev,
            puzzleState: {
              ...prev.puzzleState,
              attempt: newAttempt,
              completedPuzzles: [...prev.puzzleState.completedPuzzles, puzzle.id],
            },
            character: {
              ...prev.character,
              xp: prev.character.xp + puzzle.xpReward,
            },
            chapters: {
              ...prev.chapters,
              [prev.currentChapter]: {
                ...prev.chapters[prev.currentChapter],
                puzzleSolved: true,
              },
            },
            totalScore: prev.totalScore + puzzle.xpReward + 100,
          }

          // Level up check
          let newLevel = newSession.character.level
          let newSkillPoints = newSession.character.skillPoints
          let newAttributePoints = newSession.character.attributePoints
          while (newLevel < 10 && newSession.character.xp >= XP_TABLE[newLevel + 1]) {
            newLevel++
            const intMod = getModifier(newSession.character.attributes.int)
            newSkillPoints += intMod + 2
            if (newLevel % 2 === 0) newAttributePoints++
          }
          newSession.character.level = newLevel
          newSession.character.skillPoints = newSkillPoints
          newSession.character.attributePoints = newAttributePoints

          // Item reward
          if (puzzle.itemReward && !newSession.inventory.some(i => i.id === puzzle.itemReward!.id)) {
            newSession.inventory = [...newSession.inventory, puzzle.itemReward]
          }

          // Unlock reward
          if (puzzle.unlockReward && !newSession.unlockedExits.includes(puzzle.unlockReward)) {
            newSession.unlockedExits = [...newSession.unlockedExits, puzzle.unlockReward]
          }

          // Objective reward
          if (puzzle.objectiveReward && !newSession.completedObjectives.includes(puzzle.objectiveReward)) {
            newSession.completedObjectives = [...newSession.completedObjectives, puzzle.objectiveReward]
          }

          return newSession
        } else {
          // Move to next step
          newAttempt.currentStep = nextStepIndex
        }
      } else if (!canRetry) {
        // Failed and can't retry - puzzle failed
        newAttempt.completed = true
        newAttempt.success = false

        return {
          ...prev,
          puzzleState: {
            ...prev.puzzleState,
            attempt: newAttempt,
            failedPuzzles: {
              ...prev.puzzleState.failedPuzzles,
              [puzzle.id]: (prev.puzzleState.failedPuzzles[puzzle.id] || 0) + 1,
            },
          },
        }
      }

      return {
        ...prev,
        puzzleState: {
          ...prev.puzzleState,
          attempt: newAttempt,
        },
      }
    })

    const isComplete = success && (attempt.currentStep + 1 >= puzzle.steps.length)
    return { success, message, puzzleComplete: isComplete }
  }, [session, rollSkillCheck, hasItem, removeItem])

  const getPuzzleHint = useCallback((): string | null => {
    if (!session?.puzzleState.activePuzzle || !session?.puzzleState.attempt) {
      return null
    }

    const puzzle = session.puzzleState.activePuzzle
    const currentStep = puzzle.steps[session.puzzleState.attempt.currentStep]

    if (currentStep?.hintMessage) {
      // Using a hint costs score
      setSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          hintsUsed: prev.hintsUsed + 1,
          totalScore: Math.max(0, prev.totalScore - 25),
        }
      })
      return currentStep.hintMessage
    }
    return null
  }, [session])

  const abandonPuzzle = useCallback(() => {
    if (!session?.puzzleState.activePuzzle) return

    const puzzleId = session.puzzleState.activePuzzle.id

    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        puzzleState: {
          ...prev.puzzleState,
          activePuzzle: null,
          attempt: null,
          failedPuzzles: {
            ...prev.puzzleState.failedPuzzles,
            [puzzleId]: (prev.puzzleState.failedPuzzles[puzzleId] || 0) + 1,
          },
        },
      }
    })
    setPhase('playing')
  }, [session])

  const isPuzzleCompleted = useCallback((puzzleId: string): boolean => {
    return session?.puzzleState.completedPuzzles.includes(puzzleId) ?? false
  }, [session])

  const getPuzzleState = useCallback((): PuzzleState => {
    return session?.puzzleState || createDefaultPuzzleState()
  }, [session])

  // ============ Unlock System Functions ============

  const unlockExit = useCallback((exitId: string) => {
    setSession(prev => {
      if (!prev) return null
      if (prev.unlockedExits.includes(exitId)) return prev
      return {
        ...prev,
        unlockedExits: [...prev.unlockedExits, exitId],
      }
    })
  }, [])

  const isExitUnlocked = useCallback((exitId: string): boolean => {
    return session?.unlockedExits.includes(exitId) ?? false
  }, [session])

  const completeObjective = useCallback((objectiveId: string) => {
    setSession(prev => {
      if (!prev) return null
      if (prev.completedObjectives.includes(objectiveId)) return prev
      return {
        ...prev,
        completedObjectives: [...prev.completedObjectives, objectiveId],
      }
    })
  }, [])

  const isObjectiveComplete = useCallback((objectiveId: string): boolean => {
    return session?.completedObjectives.includes(objectiveId) ?? false
  }, [session])

  const completeChapter = useCallback((score: number) => {
    setSession(prev => {
      if (!prev) return null
      const nextChapter = Math.min(prev.currentChapter + 1, 5) as ChapterId
      const isGameComplete = prev.currentChapter === 5

      return {
        ...prev,
        chapters: {
          ...prev.chapters,
          [prev.currentChapter]: {
            ...prev.chapters[prev.currentChapter],
            completed: true,
            score,
          },
        },
        totalScore: prev.totalScore + score,
        currentChapter: isGameComplete ? prev.currentChapter : nextChapter,
        completedAt: isGameComplete ? new Date() : undefined,
      }
    })

    if (session?.currentChapter === 5) {
      setPhase('complete')
    }
  }, [session])

  const solvePuzzle = useCallback(() => {
    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        chapters: {
          ...prev.chapters,
          [prev.currentChapter]: {
            ...prev.chapters[prev.currentChapter],
            puzzleSolved: true,
          },
        },
        totalScore: prev.totalScore + 100,
      }
    })
  }, [])

  const addScore = useCallback((points: number) => {
    setSession(prev => prev ? { ...prev, totalScore: prev.totalScore + points } : null)
  }, [])

  const useHint = useCallback(() => {
    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        totalScore: Math.max(0, prev.totalScore - 25),
      }
    })
  }, [])

  const getDiscountCode = useCallback(() => {
    if (!session) return null

    const completedCount = Object.values(session.chapters).filter(c => c.completed).length
    const perfectScore = session.hintsUsed === 0 && completedCount === 5
    const allEndings = false // Would track multiple playthroughs

    let percent = 0
    if (completedCount >= 1) percent = 5
    if (completedCount >= 3) percent = 10
    if (completedCount >= 5) percent = 15
    if (perfectScore) percent = 20
    if (allEndings) percent = 25

    if (percent === 0) return null

    const code = `TOBIAS-${percent}-${session.id.slice(-6).toUpperCase()}`
    return { code, percent }
  }, [session])

  if (!mounted) return null

  return (
    <RPGContext.Provider
      value={{
        phase,
        session,
        currentDialogue,
        startNewGame,
        loadGame,
        saveGame,
        resetGame,
        movePlayer,
        setPosition,
        revealTiles,
        revealArea,
        checkRevealTriggers,
        changeChapter,
        changeMap,
        startDialogue,
        advanceDialogue,
        selectChoice,
        closeDialogue,
        modifyStat,
        addItem,
        removeItem,
        hasItem,
        // D&D 3.5 Character System
        getAttributeModifier,
        getSkillBonus,
        rollSkillCheck,
        addXP,
        levelUp,
        spendSkillPoint,
        spendAttributePoint,
        addTrait,
        addFeat,
        hasFeat,
        hasTrait,
        // NPC System
        getNPCState,
        modifyNPCAttitude,
        modifyNPCTrust,
        addNPCFact,
        // NPC Dialogue System
        processDialogue,
        getNPCMood,
        // NPC Archetype System
        getNPCArchetype,
        setNPCArchetype,
        getNPCGreeting,
        getNPCPlayerTitle,
        // Player Profile System
        getPlayerProfile,
        trackBehavior,
        addPlayerGoal,
        completePlayerGoal,
        getPlayStyle,
        modifyPlayerValue,
        // Puzzle System
        startPuzzle,
        attemptPuzzleStep,
        getPuzzleHint,
        abandonPuzzle,
        isPuzzleCompleted,
        getPuzzleState,
        // Unlock System
        unlockExit,
        isExitUnlocked,
        completeObjective,
        isObjectiveComplete,
        // Progress
        completeChapter,
        solvePuzzle,
        addScore,
        useHint,
        getDiscountCode,
        setPhase,
        // Graphics Tier
        graphicsTier: session ? getGraphicsTier(
          session.character.level,
          Object.values(session.chapters).filter(ch => ch.completed).length
        ) : 'retro_4bit',
        getChaptersCompleted: () => session
          ? Object.values(session.chapters).filter(ch => ch.completed).length
          : 0,
      }}
    >
      {children}
    </RPGContext.Provider>
  )
}

export function useRPG() {
  const context = useContext(RPGContext)
  if (context === undefined) {
    throw new Error('useRPG must be used within an RPGProvider')
  }
  return context
}
