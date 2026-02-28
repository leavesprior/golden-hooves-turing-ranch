/**
 * Discriminated union of all OregonTrail game actions.
 *
 * Each action carries its payload. The reducer delegates to engine functions
 * (travelEngine, resourceEngine, etc.) based on action.type.
 *
 * Actions that require external side effects (karma hooks) are marked with comments.
 * These stay as useCallback wrappers that call the side effect, then dispatch.
 */

import type { Pace, Rations, GamePhase, OregonTrailState } from './types'
import type { CrossingOutcome } from '../data/riverCrossings'
import type { QuestReward } from '../data/goldCountryNPCs'
import type { PosseMember } from '../data/posseSystem'

// === Core Gameplay ===

export type GameAction =
  // Game lifecycle
  | { type: 'START_GAME'; leaderName: string; partyNames: string[] }
  | { type: 'PURCHASE_SUPPLIES'; supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number } }
  | { type: 'BEGIN_JOURNEY' }
  | { type: 'TRAVEL' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; savedState: OregonTrailState }

  // Settings
  | { type: 'SET_PACE'; pace: Pace }
  | { type: 'SET_RATIONS'; rations: Rations }

  // Events — handleEventChoice calls karma hooks before dispatching
  | { type: 'HANDLE_EVENT_CHOICE'; choiceId: string; outcomeMessageOverride?: string }
  | { type: 'HANDLE_DESPERATION_CHOICE'; choiceId: string }

  // Hunting
  | { type: 'HUNT' }

  // River crossing — crossRiver calls karma hooks before dispatching
  | { type: 'CROSS_RIVER'; method: 'ford' | 'ferry' | 'caulk' }
  | { type: 'APPLY_RIVER_CROSSING_EFFECTS'; effects: CrossingOutcome['effects']; message: string }

  // Town
  | { type: 'VISIT_TOWN' }
  | { type: 'LEAVE_TOWN' }

  // Shop & Inn
  | { type: 'BUY_SUPPLIES'; resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen'; amount: number; cost: number }
  | { type: 'SELL_SUPPLIES'; resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen'; amount: number; karmaGained: number }
  | { type: 'REPAIR_WAGON' }
  | { type: 'REST_AT_INN'; healthBonus: number; moraleBonus: number; cost: number }
  | { type: 'BUY_FOOD'; healthBonus: number; moraleBonus: number; cost: number; partyWide: boolean }
  | { type: 'BUY_DRINK'; moraleBonus: number; cost: number }

  // Mystery/RPG navigation
  | { type: 'GO_TO_CHARACTER_CREATION' }
  | { type: 'OPEN_INVESTIGATION' }
  | { type: 'CLOSE_INVESTIGATION' }
  | { type: 'INVESTIGATE_LOCATION'; locationId: string }
  | { type: 'OPEN_WITNESS_DIALOGUE'; witnessType: string }
  | { type: 'CLOSE_WITNESS_DIALOGUE' }
  | { type: 'OPEN_DOSSIER' }
  | { type: 'CLOSE_DOSSIER' }
  | { type: 'OPEN_TELEGRAPH' }
  | { type: 'CLOSE_TELEGRAPH' }
  | { type: 'OPEN_JOURNAL' }
  | { type: 'CLOSE_JOURNAL' }
  | { type: 'SPEND_INVESTIGATION_TIME'; hours: number }
  | { type: 'RETURN_TO_PREVIOUS_PHASE' }

  // World map / direct state
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'SET_CURRENT_LANDMARK'; landmark: string }
  | { type: 'OPEN_WORLD_MAP' }

  // Title and Chapter flow
  | { type: 'START_FROM_TITLE' }
  | { type: 'COMPLETE_CHAPTER_INTRO' }

  // Ranch management
  | { type: 'OPEN_RANCH_MANAGEMENT' }
  | { type: 'CLOSE_RANCH_MANAGEMENT' }

  // Settlement
  | { type: 'ENTER_SETTLEMENT' }
  | { type: 'LEAVE_SETTLEMENT' }
  | { type: 'COMPLETE_SETTLEMENT' }

  // Gold Country Free-Roam
  | { type: 'ENTER_GOLD_COUNTRY_EXPLORE' }
  | { type: 'VISIT_GOLD_COUNTRY_LOCATION'; locationId: string }
  | { type: 'START_GOLD_COUNTRY_TRAVEL'; toLocationId: string }
  | { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION'; locationId: string }
  | { type: 'RETURN_TO_GOLD_COUNTRY_MAP' }
  | { type: 'DISCOVER_LOCATION'; locationId: string }
  | { type: 'COMPLETE_QUEST'; questId: string }
  // completeQuestWithReward calls karma hooks before dispatching
  | { type: 'COMPLETE_QUEST_WITH_REWARD'; questId: string; reward: QuestReward; choiceId?: string }
  | { type: 'MARK_AREA_SEARCHED'; areaId: string }
  | { type: 'ADD_INVENTORY_ITEM'; itemId: string }
  | { type: 'ADVANCE_GOLD_COUNTRY_DAY'; days: number }

  // Posse system
  | { type: 'HIRE_POSSE_MEMBER'; member: PosseMember }
  | { type: 'DISMISS_POSSE_MEMBER'; memberId: string }

  // NPC relationships
  | { type: 'UPDATE_NPC_RELATIONSHIP'; npcId: string; modifierId: string }
