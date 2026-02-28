import { type PartyRole } from '../data/posseSystem'
export type { PartyRole }
import { type DesperationEvent } from '../data/scarcityCascades'
import { type NPCRelationship } from '../data/npcRelationships'
import { type MarketEvent } from '../data/seasonalMarket'

// Core game types
export type Pace = 'steady' | 'strenuous' | 'grueling'
export type Rations = 'filling' | 'meager' | 'bare_bones'
export type Weather = 'fair' | 'rain' | 'storm' | 'snow'
export type GamePhase =
  | 'title'               // Title screen with scenic backdrop
  | 'chapter_intro'       // Chapter narrative introduction
  | 'menu'
  | 'character_creation'  // S.A.D.D.L.E. stats selection
  | 'outfitting'
  | 'traveling'
  | 'event'
  | 'town'
  | 'hunting'
  | 'river'
  | 'investigation'       // Crime scene investigation
  | 'witness'             // Witness dialogue
  | 'dossier'             // Suspect database
  | 'telegraph'           // Warrant issuing
  | 'journal'             // Clue journal
  | 'world_map'           // Fallout-style world map
  | 'ranch_management'    // Lords II-style ranch building
  | 'gold_country_arrival' // Arrival at Gold Country - settlement choice
  | 'gold_country_explore' // Free-roam world map hub
  | 'gold_country_location' // Per-location screen with NPCs/search
  | 'gold_country_travel'   // Travel between locations with encounters
  | 'settlement'          // Settlement building phase (accessed from BOBR Cabin)
  | 'settlement_victory'  // Settlement completion/ending screen
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
