'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { useKarma } from '@/lib/karmaContext'
import { useKarmaWallet } from './karmaWalletContext'
import { type CrossingOutcome } from './data/riverCrossings'
import { type QuestReward } from './data/goldCountryNPCs'
import {
  getScarcityWarnings,
  type ResourceType,
} from './data/scarcityCascades'
import {
  type PosseMember,
} from './data/posseSystem'
import {
  createRelationship,
  getShopPriceMultiplier,
  type NPCRelationship,
} from './data/npcRelationships'
import {
  getEffectivePrice,
  type MarketEvent,
} from './data/seasonalMarket'
import { getCurrentSeason, getDayOfYear } from './data/ranchConfig'

// === State types and constants (extracted to state/ directory) ===
import type {
  Pace, Rations, Weather, GamePhase, GraphicsTier,
  PartyMember, RandomEvent, EventChoice, EventOutcome,
  InvestigationState, OregonTrailState,
} from './state/types'
import { getGraphicsTier } from './state/types'
import {
  LANDMARKS, RANDOM_EVENTS, DEFAULT_STATE,
  hasCynthiasInn,
} from './state/constants'
import { gameReducer } from './state/reducer'

// Re-export types and constants for backward compatibility (28+ consumers import from this file)
export type { Pace, Rations, Weather, GamePhase, GraphicsTier }
export type { PartyMember, RandomEvent, EventChoice, EventOutcome, InvestigationState, OregonTrailState }
export { getGraphicsTier }
export { LANDMARKS, RANDOM_EVENTS, DEFAULT_STATE, hasCynthiasInn }


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
  const [state, dispatch] = useReducer(gameReducer, DEFAULT_STATE)
  const { applyKarma } = useKarma()
  const {
    earnNeutral, earnGood, addBadKarma, spendNeutral,
    recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction,
  } = useKarmaWallet()

  // === Thin dispatch wrappers ===

  const startGame = useCallback((leaderName: string, partyNames: string[]) => {
    dispatch({ type: 'START_GAME', leaderName, partyNames })
  }, [])

  const purchaseSupplies = useCallback((supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number }) => {
    dispatch({ type: 'PURCHASE_SUPPLIES', supplies })
  }, [])

  const beginJourney = useCallback(() => dispatch({ type: 'BEGIN_JOURNEY' }), [])
  const travel = useCallback(() => dispatch({ type: 'TRAVEL' }), [])
  const setPace = useCallback((pace: Pace) => dispatch({ type: 'SET_PACE', pace }), [])
  const setRations = useCallback((rations: Rations) => dispatch({ type: 'SET_RATIONS', rations }), [])

  // === Karma side-effect wrappers (call hooks BEFORE dispatching) ===

  const handleEventChoice = useCallback((choiceId: string, outcomeMessageOverride?: string) => {
    const currentEvent = state.currentEvent
    if (!currentEvent) return

    const choice = currentEvent.choices.find(c => c.id === choiceId)
    if (!choice) return

    // Apply karma OUTSIDE dispatch to avoid calling hooks during render
    if (choice.karmaLawful !== undefined || choice.karmaGood !== undefined) {
      applyKarma(
        'oregon_trail',
        currentEvent.title + ': ' + choice.text,
        choice.karmaLawful || 0,
        choice.karmaGood || 0
      )
    }

    dispatch({ type: 'HANDLE_EVENT_CHOICE', choiceId, outcomeMessageOverride })
  }, [state.currentEvent, applyKarma])

  const hunt = useCallback(() => dispatch({ type: 'HUNT' }), [])

  // Ferry costs 20🌮 - caller must handle payment via KarmaWalletContext
  const crossRiver = useCallback((method: 'ford' | 'ferry' | 'caulk') => {
    if (method === 'ford') {
      applyKarma('oregon_trail', 'Risked fording the river', 10, 0)
    }
    dispatch({ type: 'CROSS_RIVER', method })
  }, [applyKarma])

  const applyRiverCrossingEffects = useCallback((effects: CrossingOutcome['effects'], message: string) => {
    dispatch({ type: 'APPLY_RIVER_CROSSING_EFFECTS', effects, message })
  }, [])

  const visitTown = useCallback(() => dispatch({ type: 'VISIT_TOWN' }), [])
  const leaveTown = useCallback(() => dispatch({ type: 'LEAVE_TOWN' }), [])
  const resetGame = useCallback(() => dispatch({ type: 'RESET_GAME' }), [])

  // === Shop & Inn (cost handled by caller via KarmaWalletContext) ===

  const buySupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    cost: number
  ) => {
    dispatch({ type: 'BUY_SUPPLIES', resource, amount, cost })
  }, [])

  const sellSupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    karmaGained: number
  ) => {
    dispatch({ type: 'SELL_SUPPLIES', resource, amount, karmaGained })
  }, [])

  const repairWagon = useCallback(() => dispatch({ type: 'REPAIR_WAGON' }), [])

  const restAtInn = useCallback((healthBonus: number, moraleBonus: number, cost: number) => {
    dispatch({ type: 'REST_AT_INN', healthBonus, moraleBonus, cost })
  }, [])

  const buyFood = useCallback((healthBonus: number, moraleBonus: number, cost: number, partyWide: boolean) => {
    dispatch({ type: 'BUY_FOOD', healthBonus, moraleBonus, cost, partyWide })
  }, [])

  const buyDrink = useCallback((moraleBonus: number, cost: number) => {
    dispatch({ type: 'BUY_DRINK', moraleBonus, cost })
  }, [])

  // === Mystery/RPG navigation ===

  const goToCharacterCreation = useCallback(() => dispatch({ type: 'GO_TO_CHARACTER_CREATION' }), [])
  const openInvestigation = useCallback(() => dispatch({ type: 'OPEN_INVESTIGATION' }), [])
  const closeInvestigation = useCallback(() => dispatch({ type: 'CLOSE_INVESTIGATION' }), [])
  const investigateLocation = useCallback((locationId: string) => dispatch({ type: 'INVESTIGATE_LOCATION', locationId }), [])
  const openWitnessDialogue = useCallback((witnessType: string) => dispatch({ type: 'OPEN_WITNESS_DIALOGUE', witnessType }), [])
  const closeWitnessDialogue = useCallback(() => dispatch({ type: 'CLOSE_WITNESS_DIALOGUE' }), [])
  const openDossier = useCallback(() => dispatch({ type: 'OPEN_DOSSIER' }), [])
  const closeDossier = useCallback(() => dispatch({ type: 'CLOSE_DOSSIER' }), [])
  const openTelegraph = useCallback(() => dispatch({ type: 'OPEN_TELEGRAPH' }), [])
  const closeTelegraph = useCallback(() => dispatch({ type: 'CLOSE_TELEGRAPH' }), [])
  const openJournal = useCallback(() => dispatch({ type: 'OPEN_JOURNAL' }), [])
  const closeJournal = useCallback(() => dispatch({ type: 'CLOSE_JOURNAL' }), [])
  const spendInvestigationTime = useCallback((hours: number) => dispatch({ type: 'SPEND_INVESTIGATION_TIME', hours }), [])
  const returnToPreviousPhase = useCallback(() => dispatch({ type: 'RETURN_TO_PREVIOUS_PHASE' }), [])

  // === World map / direct state ===

  const setPhase = useCallback((phase: GamePhase) => dispatch({ type: 'SET_PHASE', phase }), [])
  const setCurrentLandmark = useCallback((landmark: string) => dispatch({ type: 'SET_CURRENT_LANDMARK', landmark }), [])
  const openWorldMap = useCallback(() => dispatch({ type: 'OPEN_WORLD_MAP' }), [])

  // === Title and Chapter flow ===

  const startFromTitle = useCallback(() => dispatch({ type: 'START_FROM_TITLE' }), [])
  const completeChapterIntro = useCallback(() => dispatch({ type: 'COMPLETE_CHAPTER_INTRO' }), [])

  // === Ranch management ===

  const openRanchManagement = useCallback(() => dispatch({ type: 'OPEN_RANCH_MANAGEMENT' }), [])
  const closeRanchManagement = useCallback(() => dispatch({ type: 'CLOSE_RANCH_MANAGEMENT' }), [])

  // === Settlement system ===

  const enterSettlement = useCallback(() => dispatch({ type: 'ENTER_SETTLEMENT' }), [])
  const leaveSettlement = useCallback(() => dispatch({ type: 'LEAVE_SETTLEMENT' }), [])
  const completeSettlement = useCallback(() => dispatch({ type: 'COMPLETE_SETTLEMENT' }), [])

  // === Gold Country Free-Roam ===

  const enterGoldCountryExplore = useCallback(() => dispatch({ type: 'ENTER_GOLD_COUNTRY_EXPLORE' }), [])
  const visitGoldCountryLocation = useCallback((locationId: string) => dispatch({ type: 'VISIT_GOLD_COUNTRY_LOCATION', locationId }), [])
  const startGoldCountryTravel = useCallback((toLocationId: string) => dispatch({ type: 'START_GOLD_COUNTRY_TRAVEL', toLocationId }), [])
  const arriveAtGoldCountryLocation = useCallback((locationId: string) => dispatch({ type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION', locationId }), [])
  const returnToGoldCountryMap = useCallback(() => dispatch({ type: 'RETURN_TO_GOLD_COUNTRY_MAP' }), [])
  const discoverLocation = useCallback((locationId: string) => dispatch({ type: 'DISCOVER_LOCATION', locationId }), [])
  const completeQuest = useCallback((questId: string) => dispatch({ type: 'COMPLETE_QUEST', questId }), [])

  // completeQuestWithReward — karma side effects wrapper
  const completeQuestWithReward = useCallback((questId: string, reward: QuestReward, choiceId?: string) => {
    // State update via reducer
    dispatch({ type: 'COMPLETE_QUEST_WITH_REWARD', questId, reward, choiceId })

    // Apply karma rewards (side effects outside reducer)
    if (reward.neutralKarma) {
      if (reward.neutralKarma > 0) {
        earnNeutral(reward.neutralKarma, `Quest: ${questId}`)
      } else {
        spendNeutral(Math.abs(reward.neutralKarma), `Quest: ${questId}`)
      }
    }
    if (reward.gold && !reward.neutralKarma) {
      earnNeutral(reward.gold, `Quest: ${questId}`)
    }
    if (reward.goodKarma && reward.goodKarma > 0) {
      earnGood(reward.goodKarma, `Quest: ${questId}`)
    }
    if (reward.karma && !reward.goodKarma) {
      earnGood(reward.karma, `Quest: ${questId}`)
    }
    if (reward.badKarma && reward.badKarma > 0) {
      addBadKarma(reward.badKarma, `Quest: ${questId}`)
    }
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

  const markAreaSearched = useCallback((areaId: string) => dispatch({ type: 'MARK_AREA_SEARCHED', areaId }), [])
  const addInventoryItem = useCallback((itemId: string) => dispatch({ type: 'ADD_INVENTORY_ITEM', itemId }), [])
  const advanceGoldCountryDay = useCallback((days: number) => dispatch({ type: 'ADVANCE_GOLD_COUNTRY_DAY', days }), [])

  // === Save/Load ===

  const loadState = useCallback((savedState: OregonTrailState) => {
    dispatch({ type: 'LOAD_STATE', savedState })
  }, [])

  // === Posse system ===

  const hirePosseMember = useCallback((member: PosseMember) => {
    dispatch({ type: 'HIRE_POSSE_MEMBER', member })
  }, [])

  const dismissPosseMember = useCallback((memberId: string) => {
    dispatch({ type: 'DISMISS_POSSE_MEMBER', memberId })
  }, [])

  const handleDesperationChoice = useCallback((choiceId: string) => {
    dispatch({ type: 'HANDLE_DESPERATION_CHOICE', choiceId })
  }, [])

  // === NPC Relationships ===

  const updateNPCRelationship = useCallback((npcId: string, modifierId: string) => {
    dispatch({ type: 'UPDATE_NPC_RELATIONSHIP', npcId, modifierId })
  }, [])

  // === Getter functions (derive from state, not dispatched) ===

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

  const getNPCRelationship = useCallback((npcId: string): NPCRelationship => {
    return state.npcRelationships[npcId] ?? createRelationship(npcId)
  }, [state.npcRelationships])

  const getAllNPCRelationships = useCallback((): NPCRelationship[] => {
    return Object.values(state.npcRelationships)
  }, [state.npcRelationships])

  const getShopDiscount = useCallback((npcId: string): number => {
    const rel = state.npcRelationships[npcId]
    if (!rel) return 1.0
    return getShopPriceMultiplier(rel.disposition)
  }, [state.npcRelationships])

  const getTrailMarketPrices = useCallback(() => {
    const dayOfYear = getDayOfYear(state.day)
    const season = getCurrentSeason(dayOfYear)
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

  const getTrailMarketEvent = useCallback((): MarketEvent | null => {
    if (!state.trailMarketEvent) return null
    if (state.day > state.trailMarketEventEndDay) return null
    return state.trailMarketEvent
  }, [state.trailMarketEvent, state.trailMarketEventEndDay, state.day])

  // === Context value (identical shape — zero consumer changes) ===

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

export default OregonTrailProvider
