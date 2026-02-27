'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useKarma } from '@/lib/karmaContext'
import { useKarmaWallet } from './karmaWalletContext'
import { type CrossingOutcome } from './data/riverCrossings'
import { getCriticalDescription } from './data/criticalDescriptions'
import { getEventVariant } from './data/statEventVariants'
import { type QuestReward } from './data/goldCountryNPCs'
import {
  getActiveCascades,
  getDailyDegradation,
  getScarcityWarnings,
  checkDesperationEvent,
  updateScarcityDays,
  type ResourceType,
  type DesperationEvent,
} from './data/scarcityCascades'
import {
  calculatePartyBonuses,
  checkDesertion,
  getActiveCompositionBonuses,
  type PartyRole,
  type PosseMember,
  type RoleBonus,
} from './data/posseSystem'
import {
  createRelationship,
  applyDispositionChange,
  getDispositionLevel,
  getShopPriceMultiplier,
  type NPCRelationship,
} from './data/npcRelationships'
import {
  getEffectivePrice,
  rollMarketEvent,
  type MarketEvent,
} from './data/seasonalMarket'
import { getCurrentSeason, getDayOfYear } from './data/ranchConfig'

// Types
export type Pace = 'steady' | 'strenuous' | 'grueling'
export type Rations = 'filling' | 'meager' | 'bare_bones'
export type Weather = 'fair' | 'rain' | 'storm' | 'snow'
export type GamePhase =
  | 'title'               // NEW: Title screen with scenic backdrop
  | 'chapter_intro'       // NEW: Chapter narrative introduction
  | 'menu'
  | 'character_creation'  // NEW: S.A.D.D.L.E. stats selection
  | 'outfitting'
  | 'traveling'
  | 'event'
  | 'town'
  | 'hunting'
  | 'river'
  | 'investigation'       // NEW: Crime scene investigation
  | 'witness'             // NEW: Witness dialogue
  | 'dossier'             // NEW: Suspect database
  | 'telegraph'           // NEW: Warrant issuing
  | 'journal'             // NEW: Clue journal
  | 'world_map'           // NEW: Fallout-style world map
  | 'ranch_management'    // NEW: Lords II-style ranch building
  | 'gold_country_arrival' // NEW: Arrival at Gold Country - settlement choice
  | 'gold_country_explore' // NEW: Free-roam world map hub
  | 'gold_country_location' // NEW: Per-location screen with NPCs/search
  | 'gold_country_travel'   // NEW: Travel between locations with encounters
  | 'settlement'          // NEW: Settlement building phase (accessed from BOBR Cabin)
  | 'settlement_victory'  // NEW: Settlement completion/ending screen
  | 'complete'
  | 'game_over'

// Graphics tier system (unlocked through progression)
export type GraphicsTier = 'retro_4bit' | 'classic_8bit' | 'enhanced_16bit' | 'modern_32bit' | 'ultra_64bit'

export function getGraphicsTier(gamesCompleted: number, outlawsCaught: number): GraphicsTier {
  if (gamesCompleted >= 3 && outlawsCaught >= 10) return 'ultra_64bit'
  if (gamesCompleted >= 2 && outlawsCaught >= 5) return 'modern_32bit'
  if (gamesCompleted >= 1 && outlawsCaught >= 2) return 'enhanced_16bit'
  if (outlawsCaught >= 1) return 'classic_8bit'
  return 'retro_4bit'
}

export interface PartyMember {
  id: string
  name: string
  health: number      // 0-100
  isSick: boolean
  sicknessType?: 'dysentery' | 'typhoid' | 'cholera' | 'broken_leg' | 'snakebite'
  daysUntilRecovery?: number
  // Posse system (#6)
  role: PartyRole
  loyalty?: number           // 0-100, only for hired posse members
  isHired?: boolean          // true if recruited (not original party)
  posseMemberId?: string     // Links back to PosseMember definition
  specialAbilityCooldown?: number  // Days until ability available
  emoji?: string
}

export interface RandomEvent {
  id: string
  title: string
  description: string
  choices: EventChoice[]
  image?: string
}

export interface EventChoice {
  id: string
  text: string
  outcome: EventOutcome
  karmaLawful?: number
  karmaGood?: number
}

export interface EventOutcome {
  message: string
  foodDelta?: number
  ammoDelta?: number
  medicineDelta?: number
  spareParts?: number
  healthDelta?: number  // Applied to all party members
  specificMemberEffect?: {
    memberId: string
    healthDelta: number
  }
  daysLost?: number
  // Karma Blockchain currency
  neutralKarmaDelta?: number  // 🌮 Primary currency (replaces gold)
  goodKarmaDelta?: number     // 🍪 Premium/special items
  badKarmaDelta?: number      // 🪨 Debt/consequences
}

// Investigation state for mystery system
export interface InvestigationState {
  currentOutlawId: string | null       // Which outlaw is being pursued
  hoursInvestigated: number            // Time spent at current location
  maxInvestigationHours: number        // Before trail goes cold
  witnessesInterviewed: string[]       // IDs of witnesses talked to
  locationsSearched: string[]          // Places searched at current landmark
  activeWitness: string | null         // Currently talking to
}

export interface OregonTrailState {
  // Journey progress
  day: number
  distance: number        // Miles traveled (0-2000)
  currentLandmark: string
  nextLandmark: string
  milesUntilNextLandmark: number

  // Party
  party: PartyMember[]
  wagonLeader: string

  // Resources
  food: number           // Pounds
  ammunition: number     // Rounds
  spareParts: number
  medicine: number
  oxen: number
  clothing: number       // Sets of warm clothing
  morale: number         // Party morale (0-100)
  // Note: Currency (karma) is now managed by KarmaWalletContext

  // Wagon status
  wagonCondition: number  // 0-100

  // Settings
  pace: Pace
  rations: Rations

  // Weather
  weather: Weather
  temperature: number

  // Game state
  phase: GamePhase
  currentChapter: number
  currentEvent: RandomEvent | null
  message: string | null

  // Statistics
  totalMilesTraveled: number
  daysOnTrail: number
  animalsKilled: number
  riversCrossed: number

  // Mystery/RPG Extensions
  investigation: InvestigationState
  previousPhase: GamePhase | null      // For returning from sub-screens
  graphicsTier: GraphicsTier
  gamesCompleted: number
  outlawsCaught: number

  // Gold Country Free-Roam
  currentGoldCountryLocation: string | null  // current location ID in Gold Country
  travelingToLocation: string | null         // destination during travel phase
  discoveredGoldLocations: string[]          // IDs of discovered locations
  goldCountryDay: number                     // days spent in Gold Country
  completedQuests: string[]                  // IDs of completed quests
  searchedAreas: string[]                    // IDs of searched areas
  inventory: string[]                        // items found during exploration

  // Scarcity cascades (#8)
  scarcityDays: Record<string, number>       // Consecutive days per resource in each scarcity state
  firedDesperationEvents: string[]           // One-time desperation events already fired
  activeDesperationEvent: DesperationEvent | null  // Currently showing desperation event

  // Posse system (#6)
  partyBonuses: Record<string, number>       // Aggregate bonuses from roles + composition
  compositionBonusNames: string[]            // Active composition bonus names

  // NPC Relationship system (#5)
  npcRelationships: Record<string, NPCRelationship>  // npcId -> relationship data

  // Seasonal market (trail-side — ranch has its own; this tracks the active event for the trail shop)
  trailMarketEvent: MarketEvent | null       // Active market event affecting trail shop prices
  trailMarketEventEndDay: number             // Game day the event expires
}

// Landmarks along the trail (Missouri to California Gold Country)
export const LANDMARKS = [
  { name: 'Independence, Missouri', distance: 0, type: 'town' },
  { name: 'Kansas River Crossing', distance: 102, type: 'river' },
  { name: 'Fort Kearny', distance: 304, type: 'fort' },
  { name: 'Chimney Rock', distance: 554, type: 'landmark' },
  { name: 'Fort Laramie', distance: 640, type: 'fort' },
  { name: 'Independence Rock', distance: 830, type: 'landmark' },
  { name: 'South Pass', distance: 932, type: 'pass' },
  { name: 'Fort Bridger', distance: 1032, type: 'fort' },
  { name: 'Raft River', distance: 1120, type: 'river' },
  { name: 'City of Rocks', distance: 1200, type: 'landmark' },
  { name: 'Humboldt River', distance: 1380, type: 'river' },
  { name: 'Humboldt Sink', distance: 1520, type: 'landmark' },
  { name: 'Forty Mile Desert', distance: 1600, type: 'desert' },
  { name: 'Truckee Pass', distance: 1750, type: 'pass' },
  { name: 'Sacramento Valley', distance: 1900, type: 'landmark' },
  { name: 'West Point', distance: 1950, type: 'town', special: 'cynthias_inn' },  // Back of Beyond connection!
  { name: 'Gold Country', distance: 2000, type: 'destination' },
]

// Check if a landmark has Cynthia's Inn
export function hasCynthiasInn(landmarkName: string): boolean {
  const landmark = LANDMARKS.find(l => l.name === landmarkName)
  return landmark?.special === 'cynthias_inn'
}

// Random events with karma choices
// Karma deltas: positive values ADD to that karma type, negative values SUBTRACT
// karmaGood: -15 = +15 Good Karma (virtuous), karmaGood: 15 = +15 Bad alignment push
// neutralKarmaDelta: positive = gain, negative = spend
// goodKarmaDelta: positive = gain, negative = spend
// badKarmaDelta: positive = gain debt
export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'sick_traveler',
    title: 'Sick Traveler',
    description: 'You encounter a sick traveler by the trail, too weak to continue alone.',
    choices: [
      {
        id: 'help',
        text: 'Share your medicine and food',
        outcome: {
          message: 'The traveler thanks you and recovers. Good karma flows.',
          foodDelta: -20,
          medicineDelta: -1,
          neutralKarmaDelta: -20,  // Costs 20🌮
          goodKarmaDelta: 15,      // Earns 15🍪
        },
        karmaLawful: 0,
        karmaGood: -15,
      },
      {
        id: 'ignore',
        text: 'Continue on your way',
        outcome: {
          message: 'You leave the traveler behind. Their fate is uncertain.',
          badKarmaDelta: 3,  // Gains 3🪨
        },
        karmaLawful: 0,
        karmaGood: 5,
      },
    ],
  },
  {
    id: 'broken_wagon',
    title: 'Stranded Family',
    description: 'A family is stranded with a broken wagon wheel. They look desperate.',
    choices: [
      {
        id: 'share_parts',
        text: 'Give them a spare part',
        outcome: {
          message: 'The family is deeply grateful. They share some of their food.',
          spareParts: -1,
          foodDelta: 10,
          goodKarmaDelta: 10,  // Earns 10🍪
        },
        karmaLawful: -5,
        karmaGood: -10,
      },
      {
        id: 'trade_unfair',
        text: 'Offer to trade at triple the value',
        outcome: {
          message: 'They reluctantly agree. You profit from their misfortune.',
          spareParts: -1,
          neutralKarmaDelta: 30,  // Earns 30🌮
          badKarmaDelta: 5,       // Gains 5🪨 debt
        },
        karmaLawful: 5,
        karmaGood: 15,
      },
      {
        id: 'pass',
        text: 'Wish them luck and continue',
        outcome: { message: 'You pass by without stopping.' },
        karmaLawful: 0,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'native_trade',
    title: 'Native Traders',
    description: 'A group of Native American traders approaches with goods to trade.',
    choices: [
      {
        id: 'fair_trade',
        text: 'Trade fairly for supplies',
        outcome: {
          message: 'The trade is mutually beneficial. You gain food and trust.',
          neutralKarmaDelta: -15,  // Costs 15🌮
          foodDelta: 50,
          goodKarmaDelta: 10,      // Earns 10🍪 for fair dealing
        },
        karmaLawful: -10,
        karmaGood: -10,
      },
      {
        id: 'decline',
        text: 'Politely decline',
        outcome: { message: 'They nod respectfully and continue on.' },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'steal',
        text: 'Wait until nightfall and take their goods',
        outcome: {
          message: 'You steal their supplies. It weighs on your conscience.',
          foodDelta: 80,
          ammoDelta: 20,
          neutralKarmaDelta: 80,  // Ill-gotten gains 80🌮 worth
          badKarmaDelta: 20,      // Major bad karma 20🪨
        },
        karmaLawful: 10,
        karmaGood: 20,
      },
    ],
  },
  {
    id: 'claim_jumping',
    title: 'Claim Jumpers',
    description: 'You witness claim jumpers trying to steal a prospector\'s land.',
    choices: [
      {
        id: 'report',
        text: 'Help the prospector and report to authorities',
        outcome: {
          message: 'Justice is served. The prospector rewards you.',
          neutralKarmaDelta: 25,  // Reward 25🌮
          goodKarmaDelta: 10,     // Earns 10🍪
          daysLost: 1,
        },
        karmaLawful: -15,
        karmaGood: -10,
      },
      {
        id: 'join',
        text: 'Join the claim jumpers for a cut',
        outcome: {
          message: 'You share in ill-gotten gains.',
          neutralKarmaDelta: 50,  // Ill-gotten 50🌮
          badKarmaDelta: 15,      // Major bad karma 15🪨
        },
        karmaLawful: 15,
        karmaGood: 15,
      },
      {
        id: 'avoid',
        text: 'Mind your own business',
        outcome: { message: 'You slip away unnoticed.' },
        karmaLawful: 0,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'starving_family',
    title: 'Starving Family',
    description: 'A family hasn\'t eaten in days. Their children look weak.',
    choices: [
      {
        id: 'share_food',
        text: 'Share a generous portion of food',
        outcome: {
          message: 'The family weeps with gratitude. Your heart feels light.',
          foodDelta: -40,
          neutralKarmaDelta: -40,  // Costs 40🌮 worth
          goodKarmaDelta: 15,      // Earns 15🍪
        },
        karmaLawful: 0,
        karmaGood: -15,
      },
      {
        id: 'small_share',
        text: 'Share a small amount',
        outcome: {
          message: 'It\'s not much, but it helps.',
          foodDelta: -15,
          goodKarmaDelta: 5,  // Earns 5🍪
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'refuse',
        text: 'You can\'t spare any food',
        outcome: {
          message: 'You walk away from their pleas.',
          badKarmaDelta: 8,  // Gains 8🪨
        },
        karmaLawful: 0,
        karmaGood: 8,
      },
    ],
  },
  {
    id: 'wild_animal',
    title: 'Wild Animal Attack',
    description: 'A mountain lion stalks your camp at night!',
    choices: [
      {
        id: 'shoot',
        text: 'Shoot it before it attacks',
        outcome: { message: 'Your quick reflexes save the party.', ammoDelta: -3 },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'scare',
        text: 'Try to scare it away with fire',
        outcome: {
          message: 'The lion retreats into the darkness, but a party member got scratched.',
          healthDelta: -15,
          goodKarmaDelta: 2,  // Mercy earns a little good karma
        },
        karmaLawful: 0,
        karmaGood: -2,
      },
    ],
  },
  {
    id: 'found_gold',
    title: 'Karma Nugget',
    description: 'You spot something glinting in a stream bed. It could be valuable!',
    choices: [
      {
        id: 'pan',
        text: 'Spend a day panning',
        outcome: {
          message: 'Lady luck smiles! You find a decent nugget.',
          neutralKarmaDelta: 40,  // Earns 40🌮
          daysLost: 1,
        },
        karmaLawful: -3,
        karmaGood: 0,
      },
      {
        id: 'continue',
        text: 'Keep moving - Gold Country awaits',
        outcome: { message: 'You resist temptation and press on.' },
        karmaLawful: -2,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'oxen_theft',
    title: 'Oxen Thieves',
    description: 'Bandits try to steal your oxen in the night!',
    choices: [
      {
        id: 'fight',
        text: 'Fight them off',
        outcome: {
          message: 'You drive them away but use ammunition.',
          ammoDelta: -10,
          goodKarmaDelta: 5,  // Defending yourself is honorable
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'negotiate',
        text: 'Offer them karma to leave',
        outcome: {
          message: 'They take the karma and disappear.',
          neutralKarmaDelta: -25,  // Costs 25🌮
        },
        karmaLawful: 5,
        karmaGood: 0,
      },
    ],
  },
  // === HITCHHIKER'S GUIDE STYLE EVENTS ===
  {
    id: 'philosophical_stranger',
    title: 'The Philosophical Stranger',
    description: 'A disheveled traveler blocks your path, seemingly lost in deep thought. "Tell me," he says without introduction, "if a wagon wheel falls in the desert and no one is around to hear it, does it still ruin your day?"',
    choices: [
      {
        id: 'engage',
        text: 'Engage in philosophical debate',
        outcome: {
          message: 'Two hours later, you have solved nothing but somehow feel enlightened. The stranger vanishes with a knowing smile.',
          daysLost: 0,
          goodKarmaDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'practical',
        text: '"Yes. Obviously yes."',
        outcome: {
          message: 'He nods sagely. "A practical soul. The frontier needs more of you." He gives you a spare part from nowhere.',
          spareParts: 1,
        },
        karmaLawful: -2,
        karmaGood: 0,
      },
      {
        id: 'ignore',
        text: 'Edge around him slowly',
        outcome: {
          message: '"Ah, the silent treatment," he calls after you. "Also valid!" You travel on, slightly unsettled.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'suspiciously_helpful_map',
    title: 'The Suspiciously Helpful Map',
    description: 'You find a map tacked to a tree. It shows a shortcut that would save three days. It is labeled, in beautiful calligraphy, "NOT A TRAP."',
    choices: [
      {
        id: 'trust',
        text: 'Take the shortcut (it probably isn\'t a trap)',
        outcome: {
          message: 'Against all logic, the shortcut works perfectly. You find supplies hidden along the way by... someone. The universe may have a sense of humor.',
          foodDelta: 30,
          neutralKarmaDelta: 15,
        },
        karmaLawful: 5,
        karmaGood: 0,
      },
      {
        id: 'distrust',
        text: 'Ignore it (because it definitely IS a trap)',
        outcome: {
          message: 'You stick to the main trail. That night, you hear distant screaming from the direction of the "shortcut." You made the right call.',
        },
        karmaLawful: -5,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'singing_wheel',
    title: 'The Singing Wheel',
    description: 'One of your wagon wheels has developed a squeak that sounds uncannily like a song. Party morale is divided: half find it charming, half want to burn the wagon.',
    choices: [
      {
        id: 'grease',
        text: 'Grease the wheel (silence the song)',
        outcome: {
          message: 'The squeak stops. The silence somehow feels judgmental. Party morale stabilizes.',
          spareParts: -1,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'sing_along',
        text: 'Teach everyone the lyrics',
        outcome: {
          message: 'By day three, you have a traveling chorus. Other wagons give you strange looks but your morale soars.',
          healthDelta: 5,
          goodKarmaDelta: 3,
        },
        karmaLawful: 3,
        karmaGood: -3,
      },
    ],
  },
  {
    id: 'competitive_snake',
    title: 'The Competitive Snake',
    description: 'A rattlesnake appears on the trail. Rather than striking, it seems to be challenging your lead ox to a staring contest.',
    choices: [
      {
        id: 'wait',
        text: 'Wait for the ox to win',
        outcome: {
          message: 'After 47 minutes, the snake blinks first. Your ox has never looked more proud. Snake reputation: damaged.',
          healthDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'intervene',
        text: 'Break up the contest',
        outcome: {
          message: 'Both participants look disappointed in you. The snake slithers off. Your ox refuses to make eye contact for the next ten miles.',
          healthDelta: -5,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'bet',
        text: 'Place bets',
        outcome: {
          message: 'You organize a gambling ring around the staring contest. Word spreads. You make a small fortune before authorities ask questions.',
          neutralKarmaDelta: 25,
          badKarmaDelta: 3,
        },
        karmaLawful: 5,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'over_prepared_traveler',
    title: 'The Over-Prepared Traveler',
    description: 'A fellow traveler approaches with a wagon so laden with supplies it has carved a rut three inches deep. "I brought EVERYTHING," they announce proudly. "Want to trade?"',
    choices: [
      {
        id: 'trade_food',
        text: 'Trade for food',
        outcome: {
          message: '"Food? I have seventeen varieties!" You leave with more provisions than your wagon can reasonably hold.',
          foodDelta: 60,
          neutralKarmaDelta: -20,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'trade_advice',
        text: 'Trade advice for medicine',
        outcome: {
          message: 'You explain that they don\'t need three butter churns. In gratitude, they share medical supplies.',
          medicineDelta: 3,
        },
        karmaLawful: 0,
        karmaGood: -3,
      },
      {
        id: 'decline_politely',
        text: 'Decline politely (their wagon is a cautionary tale)',
        outcome: {
          message: '"Your loss!" They trundle on. You notice their oxen weeping.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'prophetic_child',
    title: 'The Prophetic Child',
    description: 'A child from a passing wagon points at you and declares, "The trail knows your name." Their parents apologize and hurry on. You are left with questions.',
    choices: [
      {
        id: 'ponder',
        text: 'Ponder the meaning deeply',
        outcome: {
          message: 'You spend the day in contemplation. No answers come, but you feel... prepared for something.',
          goodKarmaDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'dismiss',
        text: 'Children say strange things',
        outcome: {
          message: 'You shrug it off. Probably nothing. The wind whispers your name once, but that could be coincidence.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'ghost_town_shortcut',
    title: 'The Unusually Quiet Settlement',
    description: 'You pass through a town that exists on no map. The buildings are well-maintained but the streets are empty. A sign reads: "WELCOME. PLEASE DON\'T STAY."',
    choices: [
      {
        id: 'take_supplies',
        text: 'Help yourself to obviously abandoned supplies',
        outcome: {
          message: 'You grab what you can. As you leave, every window suddenly has a face watching. You do not look back.',
          foodDelta: 40,
          ammoDelta: 15,
          badKarmaDelta: 10,
        },
        karmaLawful: 10,
        karmaGood: 10,
      },
      {
        id: 'respect_wishes',
        text: 'Leave immediately (respect their wishes)',
        outcome: {
          message: 'You hurry through. At the edge of town, you find a package with your name on it containing supplies. Best not to question it.',
          foodDelta: 20,
          medicineDelta: 2,
          goodKarmaDelta: 10,
        },
        karmaLawful: -5,
        karmaGood: -10,
      },
    ],
  },
]

// Default investigation state
const DEFAULT_INVESTIGATION: InvestigationState = {
  currentOutlawId: null,
  hoursInvestigated: 0,
  maxInvestigationHours: 8,    // 8 hours per location before trail goes cold
  witnessesInterviewed: [],
  locationsSearched: [],
  activeWitness: null,
}

// Default initial state
const DEFAULT_STATE: OregonTrailState = {
  day: 1,
  distance: 0,
  currentLandmark: 'Independence, Missouri',
  nextLandmark: 'Kansas River Crossing',
  milesUntilNextLandmark: 102,
  party: [],
  wagonLeader: '',
  food: 0,
  ammunition: 0,
  spareParts: 0,
  medicine: 0,
  oxen: 0,
  clothing: 0,
  morale: 50,
  wagonCondition: 100,
  pace: 'steady',
  rations: 'filling',
  weather: 'fair',
  temperature: 70,
  phase: 'title',
  currentChapter: 1,
  currentEvent: null,
  message: null,
  totalMilesTraveled: 0,
  daysOnTrail: 0,
  animalsKilled: 0,
  riversCrossed: 0,
  // Mystery/RPG defaults
  investigation: DEFAULT_INVESTIGATION,
  previousPhase: null,
  graphicsTier: 'retro_4bit',
  gamesCompleted: 0,
  outlawsCaught: 0,
  // Gold Country Free-Roam defaults
  currentGoldCountryLocation: null,
  travelingToLocation: null,
  discoveredGoldLocations: ['bobr_cabin'],  // BOBR Cabin always visible
  goldCountryDay: 1,
  completedQuests: [],
  searchedAreas: [],
  inventory: [],
  // Scarcity cascades (#8)
  scarcityDays: {},
  firedDesperationEvents: [],
  activeDesperationEvent: null,
  // Posse system (#6)
  partyBonuses: {},
  compositionBonusNames: [],
  // NPC Relationship system (#5)
  npcRelationships: {},
  // Seasonal market (trail-side)
  trailMarketEvent: null,
  trailMarketEventEndDay: 0,
}

// Context
interface OregonTrailContextValue {
  state: OregonTrailState
  startGame: (leaderName: string, partyNames: string[]) => void
  purchaseSupplies: (supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number }) => void
  beginJourney: () => void
  travel: () => void
  setPace: (pace: Pace) => void
  setRations: (rations: Rations) => void
  handleEventChoice: (choiceId: string, outcomeMessageOverride?: string) => void
  hunt: () => void
  crossRiver: (method: 'ford' | 'ferry' | 'caulk') => void
  applyRiverCrossingEffects: (effects: CrossingOutcome['effects'], message: string) => void
  visitTown: () => void
  leaveTown: () => void
  resetGame: () => void

  // Shop & Inn Methods
  buySupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen', amount: number, cost: number) => void
  sellSupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen', amount: number, goldGained: number) => void
  restAtInn: (healthBonus: number, moraleBonus: number, cost: number) => void
  buyFood: (healthBonus: number, moraleBonus: number, cost: number, partyWide: boolean) => void
  buyDrink: (moraleBonus: number, cost: number) => void

  // Mystery/RPG Extensions
  goToCharacterCreation: () => void
  openInvestigation: () => void
  closeInvestigation: () => void
  investigateLocation: (locationId: string) => void
  openWitnessDialogue: (witnessType: string) => void
  closeWitnessDialogue: () => void
  openDossier: () => void
  closeDossier: () => void
  openTelegraph: () => void
  closeTelegraph: () => void
  openJournal: () => void
  closeJournal: () => void
  spendInvestigationTime: (hours: number) => void
  returnToPreviousPhase: () => void

  // Direct state setters (for world map integration)
  setPhase: (phase: GamePhase) => void
  setCurrentLandmark: (landmark: string) => void
  openWorldMap: () => void

  // Title and Chapter flow
  startFromTitle: () => void
  completeChapterIntro: () => void

  // Ranch management (Lords II-style building)
  openRanchManagement: () => void
  closeRanchManagement: () => void

  // Settlement system (Gold Country endgame)
  enterSettlement: () => void
  leaveSettlement: () => void
  completeSettlement: () => void

  // Gold Country Free-Roam
  enterGoldCountryExplore: () => void
  visitGoldCountryLocation: (locationId: string) => void
  startGoldCountryTravel: (toLocationId: string) => void
  arriveAtGoldCountryLocation: (locationId: string) => void
  returnToGoldCountryMap: () => void
  discoverLocation: (locationId: string) => void
  completeQuest: (questId: string) => void
  completeQuestWithReward: (questId: string, reward: QuestReward, choiceId?: string) => void
  markAreaSearched: (areaId: string) => void
  addInventoryItem: (itemId: string) => void
  advanceGoldCountryDay: (days: number) => void

  // Save/Load support
  loadState: (savedState: OregonTrailState) => void

  // Posse system (#6)
  hirePosseMember: (member: PosseMember) => void
  dismissPosseMember: (memberId: string) => void
  getPartyBonuses: () => Record<string, number>
  getScarcityWarnings: () => { resource: ResourceType; level: 'low' | 'critical' | 'depleted'; description: string }[]
  handleDesperationChoice: (choiceId: string) => void

  // NPC Relationship system (#5)
  getNPCRelationship: (npcId: string) => NPCRelationship
  updateNPCRelationship: (npcId: string, modifierId: string) => void
  getAllNPCRelationships: () => NPCRelationship[]
  getShopDiscount: (npcId: string) => number   // 0-1 price multiplier for the given shopkeeper NPC

  // Wagon repair
  repairWagon: () => void

  // Seasonal market (trail-side)
  getTrailMarketPrices: () => { livestock: number; products: number; feed: number }
  getTrailMarketEvent: () => MarketEvent | null
}

const OregonTrailContext = createContext<OregonTrailContextValue | null>(null)

export function useOregonTrail(): OregonTrailContextValue {
  const context = useContext(OregonTrailContext)
  if (!context) {
    throw new Error('useOregonTrail must be used within OregonTrailProvider')
  }
  return context
}

interface OregonTrailProviderProps {
  children: ReactNode
}

export function OregonTrailProvider({ children }: OregonTrailProviderProps) {
  const [state, setState] = useState<OregonTrailState>(DEFAULT_STATE)
  const { applyKarma } = useKarma()
  const {
    earnNeutral, earnGood, addBadKarma, spendNeutral,
    recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction,
  } = useKarmaWallet()

  // Start new game
  const startGame = useCallback((leaderName: string, partyNames: string[]) => {
    const party: PartyMember[] = [
      { id: 'leader', name: leaderName, health: 100, isSick: false, role: 'leader' as PartyRole },
      ...partyNames.map((name, i) => ({
        id: `member_${i}`,
        name,
        health: 100,
        isSick: false,
        role: 'companion' as PartyRole,
      })),
    ]

    setState({
      ...DEFAULT_STATE,
      phase: 'outfitting',
      party,
      wagonLeader: leaderName,
      // Currency is now managed by KarmaWalletContext (starting with 400🌮)
    })
  }, [])

  // Purchase supplies - updates resources only
  // Cost (in 🌮) is returned and must be paid via KarmaWalletContext
  const purchaseSupplies = useCallback((supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number }) => {
    setState(prev => ({
      ...prev,
      food: prev.food + supplies.food,
      ammunition: prev.ammunition + supplies.ammo * 20, // Boxes of 20
      spareParts: prev.spareParts + supplies.parts,
      medicine: prev.medicine + supplies.medicine,
      oxen: prev.oxen + supplies.oxen,
    }))
  }, [])

  // Begin journey from town
  const beginJourney = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'traveling',
      message: 'Your journey to Gold Country begins!',
    }))
  }, [])

  // Main travel function
  const travel = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'traveling') return prev

      // === POSSE BONUSES (#6) ===
      const roles = prev.party.map(m => m.role)
      const bonuses = calculatePartyBonuses(roles)
      const speedBonus = 1 + (bonuses.travel_speed || 0) / 100
      const foodEfficiency = 1 - (bonuses.food_efficiency || 0) / 100
      const wagonProtection = 1 - (bonuses.wagon_repair || 0) / 100

      // Calculate daily distance based on pace and conditions
      const paceMultiplier = { steady: 1, strenuous: 1.5, grueling: 2 }[prev.pace]
      const weatherPenalty = { fair: 0, rain: 0.2, storm: 0.5, snow: 0.6 }[prev.weather]
      const baseDistance = 15 // Miles per day with good conditions
      const dailyDistance = Math.round(baseDistance * paceMultiplier * (1 - weatherPenalty) * speedBonus)

      // Desert terrain check (Humboldt Sink → Forty Mile Desert region)
      const inDesertTerrain = prev.distance >= 1380 && prev.distance <= 1700

      // Food consumption based on rations (modified by cook/hunter posse bonus)
      const rationMultiplier = { filling: 3, meager: 2, bare_bones: 1 }[prev.rations]
      const desertFoodMultiplier = inDesertTerrain ? 1.5 : 1.0
      const foodConsumed = Math.ceil(prev.party.length * rationMultiplier * desertFoodMultiplier * foodEfficiency)

      // Health effects (medic bonus: disease_resist reduces health loss slightly)
      const medicBonus = (bonuses.disease_resist || 0) > 0 ? 1 : 0
      let healthChange = 0
      if (prev.rations === 'bare_bones') healthChange -= 3
      if (prev.rations === 'meager') healthChange -= 1
      if (prev.pace === 'grueling') healthChange -= 2
      if (prev.weather === 'storm') healthChange -= 2
      if (prev.weather === 'snow') healthChange -= 3
      // Desert heat exhaustion
      if (inDesertTerrain) {
        healthChange -= 2  // Base desert health drain
        if (prev.pace === 'grueling') healthChange -= 2  // Extra penalty for pushing hard in heat
      }
      healthChange += medicBonus  // Medic slightly reduces health loss

      // === SCARCITY CASCADES (#8) ===
      // Build resource snapshot for cascade calculation
      const resourceSnapshot: Record<ResourceType, number> = {
        food: prev.food,
        ammunition: prev.ammunition,
        medicine: prev.medicine,
        spareParts: prev.spareParts,
        oxen: prev.oxen,
        clothing: prev.clothing,
        morale: prev.morale,
        wagonCondition: prev.wagonCondition,
      }

      // Get cascade effects (resource interdependencies)
      const cascades = getActiveCascades(resourceSnapshot)
      let moraleCascadeDelta = 0
      let foodCascadeDelta = 0
      let wagonCascadeDelta = 0
      let oxenCascadeDelta = 0

      for (const cascade of cascades) {
        switch (cascade.targetResource) {
          case 'morale': moraleCascadeDelta += cascade.dailyDelta; break
          case 'food': foodCascadeDelta += cascade.dailyDelta; break
          case 'wagonCondition': wagonCascadeDelta += cascade.dailyDelta; break
          case 'oxen': oxenCascadeDelta += cascade.dailyDelta; break
        }
      }

      // Daily degradation (wagon wear, clothing wear)
      const degradation = getDailyDegradation(prev.weather, prev.pace)
      let wagonDegradation = 0
      let clothingDegradation = 0
      for (const deg of degradation) {
        if (deg.resource === 'wagonCondition') wagonDegradation += deg.loss
        if (deg.resource === 'clothing') clothingDegradation += deg.loss
      }
      // Apply wagon protection from mechanic
      wagonDegradation *= wagonProtection

      // Update scarcity day tracking
      const newScarcityDays = updateScarcityDays(resourceSnapshot, prev.scarcityDays)

      // Check for desperation events
      const despEvent = checkDesperationEvent(
        resourceSnapshot,
        prev.firedDesperationEvents,
        newScarcityDays,
      )

      // Calculate new resource values
      const newFood = Math.max(0, prev.food - foodConsumed + foodCascadeDelta)
      const newMorale = Math.max(0, Math.min(100, prev.morale + moraleCascadeDelta + (bonuses.morale || 0)))
      const newWagonCond = Math.max(0, Math.min(100,
        prev.wagonCondition + wagonCascadeDelta - wagonDegradation))
      const newOxen = Math.max(0, prev.oxen + oxenCascadeDelta)
      const newClothing = Math.max(0, prev.clothing - clothingDegradation)

      // === LOYALTY CHECK (#6) — hired posse members may desert ===
      let desertionMessage: string | null = null

      // Update party health and check loyalty
      const updatedParty = prev.party.map(member => {
        const updated = {
          ...member,
          health: Math.max(0, Math.min(100, member.health + healthChange)),
        }

        // Reduce special ability cooldowns
        if (updated.specialAbilityCooldown && updated.specialAbilityCooldown > 0) {
          updated.specialAbilityCooldown = updated.specialAbilityCooldown - 1
        }

        // Loyalty for hired members — base conditions + personality-specific modifiers
        if (updated.isHired && updated.loyalty !== undefined) {
          let loyaltyDelta = 0
          // Base conditions: food & morale (affects everyone)
          if (newFood <= 0) loyaltyDelta -= 3          // Starving: sharp drop
          else if (prev.rations === 'filling') loyaltyDelta += 2  // Well-fed: party appreciates it
          else if (prev.rations === 'meager') loyaltyDelta -= 1   // Short rations: mild grumbling
          if (newMorale <= 20) loyaltyDelta -= 2       // Low morale: doubt creeps in
          else if (newMorale >= 60) loyaltyDelta += 1  // Good spirits: trust grows

          // Personality-based modifiers by role — each character values different things
          switch (updated.role) {
            case 'cook':
              // Cookie takes pride in well-fed parties
              if (prev.rations === 'filling' && newFood > 20) loyaltyDelta += 1
              if (prev.rations === 'bare_bones') loyaltyDelta -= 1 // Insulted
              break
            case 'mechanic':
              // Patches happy when wagon is maintained
              if (newWagonCond >= 70) loyaltyDelta += 1
              if (newWagonCond < 30) loyaltyDelta -= 1
              break
            case 'medic':
              // Sister Grace: values compassion, healing, party wellbeing
              if (healthChange >= 0) loyaltyDelta += 1  // Party not suffering
              if (newMorale >= 50) loyaltyDelta += 1     // People's spirits are up
              if (prev.party.some(m => m.health < 30)) loyaltyDelta -= 1 // Someone suffering
              break
            case 'scout':
              // Hawkeye respects steady progress
              if (prev.pace === 'strenuous' || prev.pace === 'grueling') loyaltyDelta += 1
              break
            case 'guard':
              // Iron Bear values strength and safety
              if (newMorale >= 70) loyaltyDelta += 1  // Party feels safe
              break
            case 'diplomat':
              // Beau loves prosperity and comfort
              if (newMorale >= 70 && newFood > 30) loyaltyDelta += 1
              if (newMorale < 40) loyaltyDelta -= 1  // Bad vibes
              break
            case 'hunter':
              // Billy Buck happy when food is plentiful
              if (newFood > 40) loyaltyDelta += 1
              break
            case 'navigator':
              // Professor appreciates steady progress and discovery
              if (prev.pace !== 'steady') loyaltyDelta += 1
              break
          }
          updated.loyalty = Math.max(0, Math.min(100, updated.loyalty + loyaltyDelta))
        }

        return updated
      }).filter(member => {
        // Check if hired member deserts
        if (member.isHired && member.loyalty !== undefined) {
          const { deserts } = checkDesertion(member.loyalty)
          if (deserts) {
            desertionMessage = `${member.name} has deserted the party!`
            return false
          }
        }
        return true
      })

      // Check for deaths
      const survivors = updatedParty.filter(m => m.health > 0)
      if (survivors.length === 0) {
        return { ...prev, phase: 'game_over' as GamePhase, message: 'Your entire party has perished...' }
      }

      // Recalculate bonuses after potential desertion
      const newRoles = survivors.map(m => m.role)
      const newBonuses = calculatePartyBonuses(newRoles)
      const activeComps = getActiveCompositionBonuses(newRoles)

      // If a desperation event fired, show it instead of normal travel
      if (despEvent) {
        return {
          ...prev,
          day: prev.day + 1,
          distance: prev.distance + dailyDistance,
          milesUntilNextLandmark: prev.milesUntilNextLandmark - dailyDistance,
          food: newFood,
          morale: newMorale,
          wagonCondition: newWagonCond,
          oxen: newOxen,
          clothing: newClothing,
          party: survivors,
          totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
          daysOnTrail: prev.daysOnTrail + 1,
          scarcityDays: newScarcityDays,
          activeDesperationEvent: despEvent,
          firedDesperationEvents: despEvent.oneTimeOnly
            ? [...prev.firedDesperationEvents, despEvent.id]
            : prev.firedDesperationEvents,
          phase: 'event' as GamePhase,
          currentEvent: {
            id: despEvent.id,
            title: despEvent.title,
            description: despEvent.description,
            choices: despEvent.choices.map(c => ({
              id: c.id,
              text: c.text,
              outcome: {
                message: c.narratorReaction,
                ...Object.fromEntries(c.effects.map(e => {
                  const key = e.resource === 'food' ? 'foodDelta'
                    : e.resource === 'ammunition' ? 'ammoDelta'
                    : e.resource === 'medicine' ? 'medicineDelta'
                    : e.resource === 'spareParts' ? 'spareParts'
                    : undefined
                  return key ? [key, e.delta] : ['healthDelta', 0]
                }).filter(([k]) => k)),
              },
            })),
          },
          weather: getRandomWeather(prev.distance + dailyDistance),
          partyBonuses: newBonuses,
          compositionBonusNames: activeComps.map(c => c.name),
          message: desertionMessage,
        }
      }

      // Calculate new position
      const newDistance = prev.distance + dailyDistance
      const newMilesUntil = prev.milesUntilNextLandmark - dailyDistance

      // Check if reached destination - trigger Gold Country arrival
      if (newDistance >= 2000) {
        return {
          ...prev,
          phase: 'gold_country_arrival' as GamePhase,
          distance: 2000,
          party: survivors,
          food: newFood,
          morale: newMorale,
          wagonCondition: newWagonCond,
          oxen: newOxen,
          clothing: newClothing,
          scarcityDays: newScarcityDays,
          partyBonuses: newBonuses,
          compositionBonusNames: activeComps.map(c => c.name),
          message: 'You have reached Gold Country! The frontier awaits...',
        }
      }

      // Check if reached next landmark
      let newLandmark = prev.currentLandmark
      let nextLandmarkName = prev.nextLandmark
      let nextLandmarkMiles = newMilesUntil
      let newPhase: GamePhase = 'traveling'

      if (newMilesUntil <= 0) {
        const currentIndex = LANDMARKS.findIndex(l => l.name === prev.nextLandmark)
        const landmark = LANDMARKS[currentIndex]
        newLandmark = landmark.name
        nextLandmarkName = LANDMARKS[currentIndex + 1]?.name || 'Gold Country'
        nextLandmarkMiles = (LANDMARKS[currentIndex + 1]?.distance || 2000) - newDistance

        // Special locations trigger different phases
        if (landmark.type === 'river') {
          newPhase = 'river'
        } else if (landmark.type === 'fort' || landmark.type === 'town') {
          newPhase = 'town'
        }
      }

      // Random events (20% chance when traveling)
      if (newPhase === 'traveling' && Math.random() < 0.2) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
        return {
          ...prev,
          day: prev.day + 1,
          distance: newDistance,
          currentLandmark: newLandmark,
          nextLandmark: nextLandmarkName,
          milesUntilNextLandmark: Math.max(0, nextLandmarkMiles),
          food: newFood,
          morale: newMorale,
          wagonCondition: newWagonCond,
          oxen: newOxen,
          clothing: newClothing,
          party: survivors,
          totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
          daysOnTrail: prev.daysOnTrail + 1,
          phase: 'event',
          currentEvent: event,
          weather: getRandomWeather(prev.distance),
          scarcityDays: newScarcityDays,
          partyBonuses: newBonuses,
          compositionBonusNames: activeComps.map(c => c.name),
          message: desertionMessage,
        }
      }

      // Normal weather changes
      const newWeather = Math.random() < 0.15 ? getRandomWeather(newDistance) : prev.weather

      return {
        ...prev,
        day: prev.day + 1,
        distance: newDistance,
        currentLandmark: newLandmark,
        nextLandmark: nextLandmarkName,
        milesUntilNextLandmark: Math.max(0, nextLandmarkMiles),
        food: newFood,
        morale: newMorale,
        wagonCondition: newWagonCond,
        oxen: newOxen,
        clothing: newClothing,
        party: survivors,
        totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
        daysOnTrail: prev.daysOnTrail + 1,
        phase: newPhase,
        weather: newWeather,
        scarcityDays: newScarcityDays,
        partyBonuses: newBonuses,
        compositionBonusNames: activeComps.map(c => c.name),
        message: desertionMessage ||
                 (newPhase === 'river' ? `You have arrived at ${newLandmark}. The river must be crossed.` :
                  newPhase === 'town' ? `You have arrived at ${newLandmark}.` :
                  null),
      }
    })
  }, [])

  // Set travel pace
  const setPace = useCallback((pace: Pace) => {
    setState(prev => ({ ...prev, pace }))
  }, [])

  // Set food rations
  const setRations = useCallback((rations: Rations) => {
    setState(prev => ({ ...prev, rations }))
  }, [])

  // Handle event choice
  // outcomeMessageOverride: optional replacement message from stat-keyed variants
  const handleEventChoice = useCallback((choiceId: string, outcomeMessageOverride?: string) => {
    // Get karma info BEFORE setState to avoid calling applyKarma during render
    const currentEvent = state.currentEvent
    if (!currentEvent) return

    const choice = currentEvent.choices.find(c => c.id === choiceId)
    if (!choice) return

    // Apply karma OUTSIDE setState callback
    if (choice.karmaLawful !== undefined || choice.karmaGood !== undefined) {
      applyKarma(
        'oregon_trail',
        currentEvent.title + ': ' + choice.text,
        choice.karmaLawful || 0,
        choice.karmaGood || 0
      )
    }

    setState(prev => {
      if (!prev.currentEvent) return prev

      const prevChoice = prev.currentEvent.choices.find(c => c.id === choiceId)
      if (!prevChoice) return prev

      const outcome = prevChoice.outcome

      // Apply outcome effects
      const updatedParty = prev.party.map(member => ({
        ...member,
        health: Math.max(0, Math.min(100, member.health + (outcome.healthDelta || 0))),
      }))

      // Note: Karma deltas (neutralKarmaDelta, goodKarmaDelta, badKarmaDelta)
      // are handled by the caller via KarmaWalletContext

      return {
        ...prev,
        food: Math.max(0, prev.food + (outcome.foodDelta || 0)),
        ammunition: Math.max(0, prev.ammunition + (outcome.ammoDelta || 0)),
        medicine: Math.max(0, prev.medicine + (outcome.medicineDelta || 0)),
        spareParts: Math.max(0, prev.spareParts + (outcome.spareParts || 0)),
        day: prev.day + (outcome.daysLost || 0),
        party: updatedParty,
        phase: 'traveling',
        currentEvent: null,
        message: outcomeMessageOverride ?? outcome.message,
      }
    })
  }, [state.currentEvent, applyKarma])

  // Hunting mini-game (simplified)
  const hunt = useCallback(() => {
    setState(prev => {
      if (prev.ammunition < 10) {
        return { ...prev, message: 'Not enough ammunition to hunt!' }
      }

      const roll = Math.random()
      const success = roll > 0.3
      const isCritSuccess = roll > 0.95  // Top 5% = critical hit
      const isCritFailure = roll < 0.05  // Bottom 5% = critical miss
      const ammoUsed = Math.floor(Math.random() * 10) + 5
      const foodGained = success ? Math.floor(Math.random() * 200) + 50 : 0

      let message = success
        ? `You shot a deer! Gained ${foodGained} pounds of food.`
        : 'The animals got away. Better luck next time.'

      // Add critical description flavor text for extreme outcomes
      if (isCritSuccess) {
        const critDesc = getCriticalDescription(true, 'hunting', undefined, 'Agility')
        message = `${critDesc} ${message}`
      } else if (isCritFailure) {
        const critDesc = getCriticalDescription(false, 'hunting')
        message = `${critDesc} ${message}`
      }

      return {
        ...prev,
        ammunition: prev.ammunition - ammoUsed,
        food: prev.food + foodGained,
        animalsKilled: prev.animalsKilled + (success ? 1 : 0),
        message,
      }
    })
  }, [])

  // River crossing
  // Ferry costs 20🌮 - caller must handle payment via KarmaWalletContext
  const crossRiver = useCallback((method: 'ford' | 'ferry' | 'caulk') => {
    // Apply karma OUTSIDE setState callback for ford method
    if (method === 'ford') {
      applyKarma('oregon_trail', 'Risked fording the river', 10, 0)
    }

    setState(prev => {
      let outcome: { message: string; karmaCost?: number; damageProbability: number; damageAmount: number }

      switch (method) {
        case 'ford':
          outcome = {
            message: 'You attempt to ford the river...',
            damageProbability: 0.4,
            damageAmount: 20,
          }
          break
        case 'ferry':
          outcome = {
            message: 'You pay for the ferry crossing.',
            karmaCost: 20,  // 20🌮 - handled by caller
            damageProbability: 0.05,
            damageAmount: 5,
          }
          break
        case 'caulk':
          outcome = {
            message: 'You caulk the wagon and float across...',
            damageProbability: 0.25,
            damageAmount: 15,
          }
          break
      }

      // Check for damage
      const tookDamage = Math.random() < outcome.damageProbability
      const foodLost = tookDamage ? Math.floor(prev.food * 0.1) : 0

      return {
        ...prev,
        // Note: karmaCost is paid via KarmaWalletContext by caller
        food: prev.food - foodLost,
        wagonCondition: tookDamage ? Math.max(0, prev.wagonCondition - outcome.damageAmount) : prev.wagonCondition,
        riversCrossed: prev.riversCrossed + 1,
        phase: 'traveling',
        message: tookDamage
          ? `${outcome.message} Some supplies were lost in the crossing!`
          : `${outcome.message} Crossed safely!`,
      }
    })
  }, [applyKarma])

  // Apply river crossing effects from enhanced RiverCrossing component
  const applyRiverCrossingEffects = useCallback((
    effects: CrossingOutcome['effects'],
    message: string
  ) => {
    setState(prev => {
      // Update party health
      let updatedParty = prev.party.map(member => ({
        ...member,
        health: Math.max(0, Math.min(100, member.health + (effects.healthDelta || 0)))
      }))

      // Handle specific injury
      if (effects.specificInjury) {
        const targetId = effects.specificInjury.memberId ||
          updatedParty[Math.floor(Math.random() * updatedParty.length)]?.id

        updatedParty = updatedParty.map(member => {
          if (member.id === targetId) {
            const newHealth = Math.max(0, member.health - effects.specificInjury!.damage)
            const isDead = newHealth <= 0
            const injuryType = effects.specificInjury!.injuryType

            return {
              ...member,
              health: newHealth,
              isSick: !isDead && (injuryType === 'hypothermia' || injuryType === 'broken_limb'),
              sicknessType: injuryType === 'broken_limb' ? 'broken_leg' : undefined,
              daysUntilRecovery: injuryType === 'broken_limb' ? 14 : (injuryType === 'hypothermia' ? 5 : undefined)
            }
          }
          return member
        })
      }

      return {
        ...prev,
        // Resources
        food: Math.max(0, prev.food - (effects.foodLost || 0)),
        ammunition: Math.max(0, prev.ammunition - (effects.ammoLost || 0)),
        medicine: Math.max(0, prev.medicine - (effects.medicineUsed || 0)),
        spareParts: Math.max(0, prev.spareParts - (effects.sparePartsUsed || 0)),
        oxen: Math.max(0, prev.oxen - (effects.oxenLost || 0)),

        // Wagon and morale
        wagonCondition: Math.max(0, prev.wagonCondition - (effects.wagonDamage || 0)),
        morale: Math.max(0, Math.min(100, prev.morale + (effects.moraleChange || 0))),

        // Party
        party: updatedParty,

        // Time
        day: prev.day + (effects.daysLost || 0),
        daysOnTrail: prev.daysOnTrail + (effects.daysLost || 0),

        // Progress
        riversCrossed: prev.riversCrossed + 1,
        phase: 'traveling' as GamePhase,
        message,
      }
    })
  }, [])

  // Town interactions
  const visitTown = useCallback(() => {
    setState(prev => {
      // Roll for a new market event when arriving at a town (if none currently active)
      const dayOfYear = getDayOfYear(prev.day)
      const season = getCurrentSeason(dayOfYear)
      const stillActive = prev.trailMarketEvent && prev.day <= prev.trailMarketEventEndDay
      const newEvent = !stillActive ? rollMarketEvent(season) : prev.trailMarketEvent
      const newEndDay = newEvent && !stillActive
        ? prev.day + newEvent.duration
        : prev.trailMarketEventEndDay

      return {
        ...prev,
        phase: 'town',
        trailMarketEvent: newEvent,
        trailMarketEventEndDay: newEndDay,
      }
    })
  }, [])

  const leaveTown = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'traveling', message: 'You leave town and continue west.' }))
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  // ============================================
  // SHOP & INN METHODS
  // Note: All costs are in 🌮 Neutral Karma, handled by KarmaWalletContext
  // These methods only update game resources - caller must handle karma payment
  // ============================================

  // Buy supplies from shop - updates resources only
  const buySupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    _cost: number  // Cost parameter kept for API compatibility, but handled by caller
  ) => {
    setState(prev => ({
      ...prev,
      [resource]: prev[resource] + amount,
    }))
  }, [])

  // Sell supplies to shop - updates resources only
  const sellSupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    _karmaGained: number  // Karma earned, handled by caller
  ) => {
    setState(prev => {
      if (prev[resource] < amount) return prev
      return {
        ...prev,
        [resource]: prev[resource] - amount,
      }
    })
  }, [])

  // Repair wagon - consume 1 spare part, restore 25 wagon condition
  const repairWagon = useCallback(() => {
    setState(prev => {
      if (prev.spareParts <= 0 || prev.wagonCondition >= 100) return prev
      return {
        ...prev,
        spareParts: prev.spareParts - 1,
        wagonCondition: Math.min(100, prev.wagonCondition + 25),
      }
    })
  }, [])

  // Rest at inn - heals party, boosts morale, and improves loyalty
  const restAtInn = useCallback((healthBonus: number, moraleBonus: number, _cost: number) => {
    setState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + moraleBonus),
      party: prev.party.map(member => ({
        ...member,
        health: Math.min(100, member.health + healthBonus),
        // Inn rest gives loyalty boost to hired members (they appreciate comfort)
        loyalty: member.isHired && member.loyalty !== undefined
          ? Math.min(100, member.loyalty + 3)
          : member.loyalty,
      })),
      day: prev.day + 1,  // Resting takes a day
      message: 'Your party rests and recovers.',
    }))
  }, [])

  // Buy food at inn - heals and boosts morale
  const buyFood = useCallback((
    healthBonus: number,
    moraleBonus: number,
    _cost: number,  // Handled by caller
    partyWide: boolean
  ) => {
    setState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + moraleBonus),
      party: partyWide
        ? prev.party.map(member => ({
            ...member,
            health: Math.min(100, member.health + healthBonus),
          }))
        : prev.party,  // Individual meals don't affect party health here
    }))
  }, [])

  // Buy drink at inn - boosts morale
  const buyDrink = useCallback((moraleBonus: number, _cost: number) => {
    setState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + moraleBonus),
    }))
  }, [])

  // ============================================
  // MYSTERY/RPG EXTENSION METHODS
  // ============================================

  // Go to character creation screen
  const goToCharacterCreation = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'character_creation',
      previousPhase: prev.phase,
    }))
  }, [])

  // Open investigation mode at current location
  const openInvestigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'investigation',
      previousPhase: prev.phase,
      investigation: {
        ...prev.investigation,
        hoursInvestigated: 0,
        witnessesInterviewed: [],
        locationsSearched: [],
      },
    }))
  }, [])

  // Close investigation and return to previous phase
  const closeInvestigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'town',
      previousPhase: null,
    }))
  }, [])

  // Investigate a specific location (saloon, stable, etc.)
  const investigateLocation = useCallback((locationId: string) => {
    setState(prev => ({
      ...prev,
      investigation: {
        ...prev.investigation,
        locationsSearched: [...prev.investigation.locationsSearched, locationId],
        hoursInvestigated: prev.investigation.hoursInvestigated + 1,
      },
    }))
  }, [])

  // Open witness dialogue
  const openWitnessDialogue = useCallback((witnessType: string) => {
    setState(prev => ({
      ...prev,
      phase: 'witness',
      previousPhase: prev.phase,
      investigation: {
        ...prev.investigation,
        activeWitness: witnessType,
      },
    }))
  }, [])

  // Close witness dialogue
  const closeWitnessDialogue = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'investigation',
      previousPhase: null,
      investigation: {
        ...prev.investigation,
        activeWitness: null,
        witnessesInterviewed: prev.investigation.activeWitness
          ? [...prev.investigation.witnessesInterviewed, prev.investigation.activeWitness]
          : prev.investigation.witnessesInterviewed,
        hoursInvestigated: prev.investigation.hoursInvestigated + 1,
      },
    }))
  }, [])

  // Open dossier screen
  const openDossier = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'dossier',
      previousPhase: prev.phase,
    }))
  }, [])

  // Close dossier screen
  const closeDossier = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'town',
      previousPhase: null,
    }))
  }, [])

  // Open telegraph office
  const openTelegraph = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'telegraph',
      previousPhase: prev.phase,
    }))
  }, [])

  // Close telegraph office
  const closeTelegraph = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'town',
      previousPhase: null,
    }))
  }, [])

  // Open clue journal
  const openJournal = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'journal',
      previousPhase: prev.phase,
    }))
  }, [])

  // Close clue journal
  const closeJournal = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'traveling',
      previousPhase: null,
    }))
  }, [])

  // Spend time investigating (for time pressure mechanic)
  const spendInvestigationTime = useCallback((hours: number) => {
    setState(prev => ({
      ...prev,
      investigation: {
        ...prev.investigation,
        hoursInvestigated: prev.investigation.hoursInvestigated + hours,
      },
    }))
  }, [])

  // Generic return to previous phase
  const returnToPreviousPhase = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'traveling',
      previousPhase: null,
    }))
  }, [])

  // Direct state setters for world map integration
  const setPhase = useCallback((phase: GamePhase) => {
    setState(prev => ({
      ...prev,
      phase,
      previousPhase: prev.phase,
    }))
  }, [])

  const setCurrentLandmark = useCallback((landmark: string) => {
    setState(prev => ({
      ...prev,
      currentLandmark: landmark,
    }))
  }, [])

  const openWorldMap = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'world_map',
      previousPhase: prev.phase,
    }))
  }, [])

  // Title and Chapter flow methods
  const startFromTitle = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'chapter_intro',
    }))
  }, [])

  const completeChapterIntro = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'menu',
    }))
  }, [])

  // Ranch management methods (Lords II-style building)
  const openRanchManagement = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'ranch_management',
      previousPhase: prev.phase,
    }))
  }, [])

  const closeRanchManagement = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.previousPhase || 'town',
      previousPhase: null,
    }))
  }, [])

  // Settlement system (Gold Country endgame)
  const enterSettlement = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_explore' as GamePhase,
      currentGoldCountryLocation: 'bobr_cabin',
      message: 'Welcome to Gold Country! Explore the Sierra Foothills and build your future.',
    }))
  }, [])

  const leaveSettlement = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'complete' as GamePhase,
      message: 'You chose to move on from Gold Country.',
    }))
  }, [])

  const completeSettlement = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'settlement_victory' as GamePhase,
      message: 'Your journey in Gold Country has come to an end.',
    }))
  }, [])

  // Gold Country Free-Roam
  const enterGoldCountryExplore = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_explore' as GamePhase,
      currentGoldCountryLocation: 'bobr_cabin',
      message: 'Welcome to Gold Country! Explore the Sierra Foothills and uncover its secrets.',
    }))
  }, [])

  const visitGoldCountryLocation = useCallback((locationId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_location' as GamePhase,
      currentGoldCountryLocation: locationId,
      discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
        ? prev.discoveredGoldLocations
        : [...prev.discoveredGoldLocations, locationId],
    }))
  }, [])

  const startGoldCountryTravel = useCallback((toLocationId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_travel' as GamePhase,
      travelingToLocation: toLocationId,
    }))
  }, [])

  const arriveAtGoldCountryLocation = useCallback((locationId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_location' as GamePhase,
      currentGoldCountryLocation: locationId,
      travelingToLocation: null,
      discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
        ? prev.discoveredGoldLocations
        : [...prev.discoveredGoldLocations, locationId],
    }))
  }, [])

  const returnToGoldCountryMap = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'gold_country_explore' as GamePhase,
    }))
  }, [])

  const discoverLocation = useCallback((locationId: string) => {
    setState(prev => ({
      ...prev,
      discoveredGoldLocations: prev.discoveredGoldLocations.includes(locationId)
        ? prev.discoveredGoldLocations
        : [...prev.discoveredGoldLocations, locationId],
    }))
  }, [])

  const completeQuest = useCallback((questId: string) => {
    setState(prev => ({
      ...prev,
      completedQuests: prev.completedQuests.includes(questId)
        ? prev.completedQuests
        : [...prev.completedQuests, questId],
    }))
  }, [])

  // Complete quest with specific reward (for moral choice quests)
  const completeQuestWithReward = useCallback((questId: string, reward: QuestReward, _choiceId?: string) => {
    // Mark quest as completed
    setState(prev => ({
      ...prev,
      completedQuests: prev.completedQuests.includes(questId)
        ? prev.completedQuests
        : [...prev.completedQuests, questId],
      // Add item to inventory if rewarded
      inventory: reward.item
        ? [...prev.inventory, reward.item]
        : prev.inventory,
    }))

    // Apply karma rewards
    // Handle neutralKarma (positive = earn, negative = spend)
    if (reward.neutralKarma) {
      if (reward.neutralKarma > 0) {
        earnNeutral(reward.neutralKarma, `Quest: ${questId}`)
      } else {
        spendNeutral(Math.abs(reward.neutralKarma), `Quest: ${questId}`)
      }
    }

    // Handle legacy gold field (maps to neutralKarma)
    if (reward.gold && !reward.neutralKarma) {
      earnNeutral(reward.gold, `Quest: ${questId}`)
    }

    // Handle goodKarma
    if (reward.goodKarma && reward.goodKarma > 0) {
      earnGood(reward.goodKarma, `Quest: ${questId}`)
    }

    // Handle legacy karma field (maps to goodKarma)
    if (reward.karma && !reward.goodKarma) {
      earnGood(reward.karma, `Quest: ${questId}`)
    }

    // Handle badKarma
    if (reward.badKarma && reward.badKarma > 0) {
      addBadKarma(reward.badKarma, `Quest: ${questId}`)
    }

    // Apply alignment shifts
    if (reward.lawfulShift) {
      if (reward.lawfulShift > 0) {
        recordLawfulAction(reward.lawfulShift)
      } else {
        recordChaoticAction(Math.abs(reward.lawfulShift))
      }
    }

    if (reward.goodEvilShift) {
      if (reward.goodEvilShift > 0) {
        recordGoodAction(reward.goodEvilShift)
      } else {
        recordEvilAction(Math.abs(reward.goodEvilShift))
      }
    }
  }, [earnNeutral, spendNeutral, earnGood, addBadKarma, recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction])

  const markAreaSearched = useCallback((areaId: string) => {
    setState(prev => ({
      ...prev,
      searchedAreas: prev.searchedAreas.includes(areaId)
        ? prev.searchedAreas
        : [...prev.searchedAreas, areaId],
    }))
  }, [])

  const addInventoryItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemId],
    }))
  }, [])

  const advanceGoldCountryDay = useCallback((days: number) => {
    setState(prev => ({
      ...prev,
      goldCountryDay: prev.goldCountryDay + days,
    }))
  }, [])

  // Load saved state (for save/load system)
  // Merge with DEFAULT_STATE to handle saves from older versions that
  // may be missing newer fields (e.g. Gold Country arrays)
  const loadState = useCallback((savedState: OregonTrailState) => {
    setState({
      ...DEFAULT_STATE,
      ...savedState,
    })
  }, [])

  // === POSSE SYSTEM (#6) ===

  const hirePosseMember = useCallback((member: PosseMember) => {
    setState(prev => {
      const newMember: PartyMember = {
        id: member.id,
        name: member.name,
        health: 100,
        isSick: false,
        role: member.role,
        loyalty: member.loyalty,
        isHired: true,
        posseMemberId: member.id,
        specialAbilityCooldown: 0,
        emoji: member.emoji,
      }

      const newParty = [...prev.party, newMember]
      const roles = newParty.map(m => m.role)
      const bonuses = calculatePartyBonuses(roles)
      const comps = getActiveCompositionBonuses(roles)

      return {
        ...prev,
        party: newParty,
        partyBonuses: bonuses,
        compositionBonusNames: comps.map(c => c.name),
      }
    })
  }, [])

  const dismissPosseMember = useCallback((memberId: string) => {
    setState(prev => {
      const newParty = prev.party.filter(m => m.posseMemberId !== memberId)
      const roles = newParty.map(m => m.role)
      const bonuses = calculatePartyBonuses(roles)
      const comps = getActiveCompositionBonuses(roles)

      return {
        ...prev,
        party: newParty,
        partyBonuses: bonuses,
        compositionBonusNames: comps.map(c => c.name),
      }
    })
  }, [])

  const getPartyBonusesFn = useCallback(() => {
    return state.partyBonuses
  }, [state.partyBonuses])

  const getScarcityWarningsFn = useCallback(() => {
    const resources: Record<ResourceType, number> = {
      food: state.food,
      ammunition: state.ammunition,
      medicine: state.medicine,
      spareParts: state.spareParts,
      oxen: state.oxen,
      clothing: state.clothing,
      morale: state.morale,
      wagonCondition: state.wagonCondition,
    }
    return getScarcityWarnings(resources)
  }, [state.food, state.ammunition, state.medicine, state.spareParts, state.oxen, state.clothing, state.morale, state.wagonCondition])

  // ============================================================================
  // NPC RELATIONSHIP SYSTEM (#5)
  // ============================================================================

  /** Return an NPC's relationship record, creating a default one if missing. */
  const getNPCRelationship = useCallback((npcId: string): NPCRelationship => {
    return state.npcRelationships[npcId] ?? createRelationship(npcId)
  }, [state.npcRelationships])

  /** Apply a disposition modifier event to an NPC's relationship record. */
  const updateNPCRelationship = useCallback((npcId: string, modifierId: string) => {
    setState(prev => {
      const existing = prev.npcRelationships[npcId] ?? createRelationship(npcId)
      const updated = applyDispositionChange(existing, modifierId, prev.day)
      return {
        ...prev,
        npcRelationships: {
          ...prev.npcRelationships,
          [npcId]: updated,
        },
      }
    })
  }, [])

  /** Return all NPC relationships as a sorted array. */
  const getAllNPCRelationships = useCallback((): NPCRelationship[] => {
    return Object.values(state.npcRelationships)
  }, [state.npcRelationships])

  /**
   * Return the shop price multiplier for a specific shopkeeper NPC.
   * Falls back to 1.0 (neutral) if the NPC has never been interacted with.
   */
  const getShopDiscount = useCallback((npcId: string): number => {
    const rel = state.npcRelationships[npcId]
    if (!rel) return 1.0
    return getShopPriceMultiplier(rel.disposition)
  }, [state.npcRelationships])

  // ============================================================================
  // SEASONAL MARKET — TRAIL SIDE
  // Rolls for a market event whenever the player arrives at a new town.
  // ============================================================================

  /** Get current effective price multipliers for the trail shop. */
  const getTrailMarketPrices = useCallback(() => {
    const dayOfYear = getDayOfYear(state.day)
    const season = getCurrentSeason(dayOfYear)
    // Check whether the stored event is still active
    const event =
      state.trailMarketEvent && state.day <= state.trailMarketEventEndDay
        ? state.trailMarketEvent
        : null
    return {
      livestock: getEffectivePrice('livestock', season, event),
      products:  getEffectivePrice('products',  season, event),
      feed:      getEffectivePrice('feed',      season, event),
    }
  }, [state.day, state.trailMarketEvent, state.trailMarketEventEndDay])

  /** Return the currently active trail market event (or null). */
  const getTrailMarketEvent = useCallback((): MarketEvent | null => {
    if (!state.trailMarketEvent) return null
    if (state.day > state.trailMarketEventEndDay) return null
    return state.trailMarketEvent
  }, [state.trailMarketEvent, state.trailMarketEventEndDay, state.day])

  const handleDesperationChoice = useCallback((choiceId: string) => {
    const despEvent = state.activeDesperationEvent
    if (!despEvent) return

    const choice = despEvent.choices.find(c => c.id === choiceId)
    if (!choice) return

    setState(prev => {
      let newFood = prev.food
      let newAmmo = prev.ammunition
      let newMedicine = prev.medicine
      let newParts = prev.spareParts
      let newOxen = prev.oxen
      const newMorale = Math.max(0, Math.min(100, prev.morale + choice.moraleDelta))
      let newWagonCond = prev.wagonCondition

      for (const effect of choice.effects) {
        switch (effect.resource) {
          case 'food': newFood = Math.max(0, newFood + effect.delta); break
          case 'ammunition': newAmmo = Math.max(0, newAmmo + effect.delta); break
          case 'medicine': newMedicine = Math.max(0, newMedicine + effect.delta); break
          case 'spareParts': newParts = Math.max(0, newParts + effect.delta); break
          case 'oxen': newOxen = Math.max(0, newOxen + effect.delta); break
          case 'wagonCondition': newWagonCond = Math.max(0, Math.min(100, newWagonCond + effect.delta)); break
        }
      }

      return {
        ...prev,
        food: newFood,
        ammunition: newAmmo,
        medicine: newMedicine,
        spareParts: newParts,
        oxen: newOxen,
        morale: newMorale,
        wagonCondition: newWagonCond,
        activeDesperationEvent: null,
        phase: 'traveling' as GamePhase,
        message: choice.narratorReaction,
      }
    })
  }, [state.activeDesperationEvent])

  const value: OregonTrailContextValue = {
    state,
    startGame,
    purchaseSupplies,
    beginJourney,
    travel,
    setPace,
    setRations,
    handleEventChoice,
    hunt,
    crossRiver,
    applyRiverCrossingEffects,
    visitTown,
    leaveTown,
    resetGame,
    // Shop & Inn methods
    buySupplies,
    sellSupplies,
    restAtInn,
    buyFood,
    buyDrink,
    // Mystery/RPG extensions
    goToCharacterCreation,
    openInvestigation,
    closeInvestigation,
    investigateLocation,
    openWitnessDialogue,
    closeWitnessDialogue,
    openDossier,
    closeDossier,
    openTelegraph,
    closeTelegraph,
    openJournal,
    closeJournal,
    spendInvestigationTime,
    returnToPreviousPhase,
    // World map integration
    setPhase,
    setCurrentLandmark,
    openWorldMap,
    // Title and Chapter flow
    startFromTitle,
    completeChapterIntro,
    // Ranch management
    openRanchManagement,
    closeRanchManagement,
    // Settlement system
    enterSettlement,
    leaveSettlement,
    completeSettlement,
    // Gold Country Free-Roam
    enterGoldCountryExplore,
    visitGoldCountryLocation,
    startGoldCountryTravel,
    arriveAtGoldCountryLocation,
    returnToGoldCountryMap,
    discoverLocation,
    completeQuest,
    completeQuestWithReward,
    markAreaSearched,
    addInventoryItem,
    advanceGoldCountryDay,
    // Save/Load
    loadState,
    // Posse system (#6)
    hirePosseMember,
    dismissPosseMember,
    getPartyBonuses: getPartyBonusesFn,
    getScarcityWarnings: getScarcityWarningsFn,
    handleDesperationChoice,
    // NPC Relationship system (#5)
    getNPCRelationship,
    updateNPCRelationship,
    getAllNPCRelationships,
    getShopDiscount,
    // Wagon repair
    repairWagon,
    // Seasonal market (trail-side)
    getTrailMarketPrices,
    getTrailMarketEvent,
  }

  return (
    <OregonTrailContext.Provider value={value}>
      {children}
    </OregonTrailContext.Provider>
  )
}

// Helper function for weather
function getRandomWeather(distance: number): Weather {
  // Mountain passes: Rocky Mountains (800-1032) and Truckee Pass (1700-1800)
  const inMountains = (distance > 800 && distance < 1032) || (distance > 1700 && distance < 1800)
  // Desert region: Humboldt Sink through Forty Mile Desert (1380-1700)
  const inDesert = distance > 1380 && distance < 1700
  const rand = Math.random()

  if (inMountains) {
    if (rand < 0.3) return 'snow'
    if (rand < 0.5) return 'storm'
    if (rand < 0.7) return 'rain'
    return 'fair'
  }

  if (inDesert) {
    // Desert: almost always fair (hot), rare storm
    if (rand < 0.05) return 'storm'
    return 'fair'
  }

  if (rand < 0.1) return 'storm'
  if (rand < 0.3) return 'rain'
  return 'fair'
}

export default OregonTrailProvider
