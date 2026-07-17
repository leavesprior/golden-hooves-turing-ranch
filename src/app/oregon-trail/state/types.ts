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
  | 'living_trail'        // Presence-gated real-world quest chains (Living Trail P1)
  | 'complete'
  | 'game_over'

// Graphics tiers. The progression-unlock function that once gated these was
// removed 2026-07-13 (visual64): it was never called, and the tier is pinned
// to ultra_64bit in DEFAULT_STATE + LOAD_STATE (see graphicsTier.test.ts).
export type GraphicsTier = 'retro_4bit' | 'classic_8bit' | 'enhanced_16bit' | 'modern_32bit' | 'ultra_64bit'

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
  activeWitness: string | null         // Currently talking to (witnessType string)
  activeNpcId?: string | null          // Real GoldCountryNPC id, when the witness is one (undefined-safe for old saves)
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

  // Hired trail guide (#11) — persisted so the guide survives reload
  hiredGuideId: string | null
  guideRemainingLandmarks: number

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

  // #15: day the current landmark was reached — scenic place art (LandmarkScene)
  // shows only when landmarkArrivalDay === day. Optional: old saves lack it
  // (undefined never equals a number, so they just show the wagon scene).
  // currentLandmark itself is load-bearing elsewhere and is never cleared.
  landmarkArrivalDay?: number

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
  lastDesperationEventDay: number            // Day the last desperation event fired (3-day cooldown)

  // Posse system (#6)
  partyBonuses: Record<string, number>       // Aggregate bonuses from roles + composition
  compositionBonusNames: string[]            // Active composition bonus names

  // NPC Relationship system (#5)
  npcRelationships: Record<string, NPCRelationship>  // npcId -> relationship data

  // Seasonal market (trail-side — ranch has its own; this tracks the active event for the trail shop)
  trailMarketEvent: MarketEvent | null       // Active market event affecting trail shop prices
  trailMarketEventEndDay: number             // Game day the event expires

  // Living Trail (presence-gated real-world quest chains)
  livingTrail: LivingTrailSlice
}

// === Living Trail (P1) ===

export type LivingTrailNodeStatus = 'locked' | 'available' | 'completed'

export interface LivingTrailNodeState {
  status: LivingTrailNodeStatus
  completedAt?: number
  verifiedPresence?: boolean   // false = completed via the remote "by-lantern-light" variant
}

export interface LivingTrailSlice {
  nodes: Record<string, LivingTrailNodeState>
}
