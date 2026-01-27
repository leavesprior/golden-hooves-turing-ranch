'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useKarma } from '@/lib/karmaContext'
import { type CrossingOutcome } from './data/riverCrossings'

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
  | 'settlement'          // NEW: Settlement building phase (Fallout-inspired)
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
  neutralKarmaDelta?: number  // 🪙 Primary currency (replaces gold)
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
  { name: 'Soda Springs', distance: 1160, type: 'spring' },
  { name: 'Fort Hall', distance: 1220, type: 'fort' },
  { name: 'Snake River Crossing', distance: 1430, type: 'river' },
  { name: 'Fort Boise', distance: 1534, type: 'fort' },
  { name: 'Blue Mountains', distance: 1680, type: 'mountains' },
  { name: 'The Dalles', distance: 1820, type: 'town' },
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
          neutralKarmaDelta: -20,  // Costs 20🪙
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
          neutralKarmaDelta: 30,  // Earns 30🪙
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
          neutralKarmaDelta: -15,  // Costs 15🪙
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
          neutralKarmaDelta: 80,  // Ill-gotten gains 80🪙 worth
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
          neutralKarmaDelta: 25,  // Reward 25🪙
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
          neutralKarmaDelta: 50,  // Ill-gotten 50🪙
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
          neutralKarmaDelta: -40,  // Costs 40🪙 worth
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
          neutralKarmaDelta: 40,  // Earns 40🪙
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
          neutralKarmaDelta: -25,  // Costs 25🪙
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
  handleEventChoice: (choiceId: string) => void
  hunt: () => void
  crossRiver: (method: 'ford' | 'ferry' | 'caulk') => void
  applyRiverCrossingEffects: (effects: CrossingOutcome['effects'], message: string) => void
  visitTown: () => void
  leaveTown: () => void
  resetGame: () => void

  // Shop & Inn Methods
  buySupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing', amount: number, cost: number) => void
  sellSupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing', amount: number, goldGained: number) => void
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

  // Save/Load support
  loadState: (savedState: OregonTrailState) => void
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

  // Start new game
  const startGame = useCallback((leaderName: string, partyNames: string[]) => {
    const party: PartyMember[] = [
      { id: 'leader', name: leaderName, health: 100, isSick: false },
      ...partyNames.map((name, i) => ({
        id: `member_${i}`,
        name,
        health: 100,
        isSick: false,
      })),
    ]

    setState({
      ...DEFAULT_STATE,
      phase: 'outfitting',
      party,
      wagonLeader: leaderName,
      // Currency is now managed by KarmaWalletContext (starting with 400🪙)
    })
  }, [])

  // Purchase supplies - updates resources only
  // Cost (in 🪙) is returned and must be paid via KarmaWalletContext
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

      // Calculate daily distance based on pace and conditions
      const paceMultiplier = { steady: 1, strenuous: 1.5, grueling: 2 }[prev.pace]
      const weatherPenalty = { fair: 0, rain: 0.2, storm: 0.5, snow: 0.6 }[prev.weather]
      const baseDistance = 15 // Miles per day with good conditions
      const dailyDistance = Math.round(baseDistance * paceMultiplier * (1 - weatherPenalty))

      // Food consumption based on rations
      const rationMultiplier = { filling: 3, meager: 2, bare_bones: 1 }[prev.rations]
      const foodConsumed = prev.party.length * rationMultiplier

      // Health effects
      let healthChange = 0
      if (prev.rations === 'bare_bones') healthChange -= 3
      if (prev.rations === 'meager') healthChange -= 1
      if (prev.pace === 'grueling') healthChange -= 2
      if (prev.weather === 'storm') healthChange -= 2
      if (prev.weather === 'snow') healthChange -= 3

      // Update party health
      const updatedParty = prev.party.map(member => ({
        ...member,
        health: Math.max(0, Math.min(100, member.health + healthChange)),
      }))

      // Check for deaths
      const survivors = updatedParty.filter(m => m.health > 0)
      if (survivors.length === 0) {
        return { ...prev, phase: 'game_over' as GamePhase, message: 'Your entire party has perished...' }
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
          food: Math.max(0, prev.food - foodConsumed),
          party: survivors,
          totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
          daysOnTrail: prev.daysOnTrail + 1,
          phase: 'event',
          currentEvent: event,
          weather: getRandomWeather(prev.distance),
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
        food: Math.max(0, prev.food - foodConsumed),
        party: survivors,
        totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
        daysOnTrail: prev.daysOnTrail + 1,
        phase: newPhase,
        weather: newWeather,
        message: newPhase === 'river' ? `You have arrived at ${newLandmark}. The river must be crossed.` :
                 newPhase === 'town' ? `You have arrived at ${newLandmark}.` :
                 null,
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
  const handleEventChoice = useCallback((choiceId: string) => {
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
        message: outcome.message,
      }
    })
  }, [state.currentEvent, applyKarma])

  // Hunting mini-game (simplified)
  const hunt = useCallback(() => {
    setState(prev => {
      if (prev.ammunition < 10) {
        return { ...prev, message: 'Not enough ammunition to hunt!' }
      }

      const success = Math.random() > 0.3
      const ammoUsed = Math.floor(Math.random() * 10) + 5
      const foodGained = success ? Math.floor(Math.random() * 200) + 50 : 0

      return {
        ...prev,
        ammunition: prev.ammunition - ammoUsed,
        food: prev.food + foodGained,
        animalsKilled: prev.animalsKilled + (success ? 1 : 0),
        message: success
          ? `You shot a deer! Gained ${foodGained} pounds of food.`
          : 'The animals got away. Better luck next time.',
      }
    })
  }, [])

  // River crossing
  // Ferry costs 20🪙 - caller must handle payment via KarmaWalletContext
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
            karmaCost: 20,  // 20🪙 - handled by caller
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
    setState(prev => ({ ...prev, phase: 'town' }))
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
  // Note: All costs are in 🪙 Neutral Karma, handled by KarmaWalletContext
  // These methods only update game resources - caller must handle karma payment
  // ============================================

  // Buy supplies from shop - updates resources only
  const buySupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing',
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
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing',
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

  // Rest at inn - heals party and boosts morale
  const restAtInn = useCallback((healthBonus: number, moraleBonus: number, _cost: number) => {
    setState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + moraleBonus),
      party: prev.party.map(member => ({
        ...member,
        health: Math.min(100, member.health + healthBonus),
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
      phase: 'settlement' as GamePhase,
      message: 'Welcome to Gold Country! Stake your claim and build your future.',
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

  // Load saved state (for save/load system)
  const loadState = useCallback((savedState: OregonTrailState) => {
    setState(savedState)
  }, [])

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
    // Save/Load
    loadState,
  }

  return (
    <OregonTrailContext.Provider value={value}>
      {children}
    </OregonTrailContext.Provider>
  )
}

// Helper function for weather
function getRandomWeather(distance: number): Weather {
  // More snow in mountains (distance 800-1200)
  const inMountains = distance > 800 && distance < 1200
  const rand = Math.random()

  if (inMountains) {
    if (rand < 0.3) return 'snow'
    if (rand < 0.5) return 'storm'
    if (rand < 0.7) return 'rain'
    return 'fair'
  }

  if (rand < 0.1) return 'storm'
  if (rand < 0.3) return 'rain'
  return 'fair'
}

export default OregonTrailProvider
