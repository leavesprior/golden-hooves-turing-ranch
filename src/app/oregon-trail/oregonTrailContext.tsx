'use client'

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'
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
import { getLivingTrailNode, getChainNodes } from './data/livingTrailChains'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { validateDmDirective, type DmDirective } from '@/lib/dmDirectives'

// === State types and constants (extracted to state/ directory) ===
import type {
  Pace, Rations, Weather, GamePhase, GraphicsTier,
  PartyMember, RandomEvent, EventChoice, EventOutcome,
  InvestigationState, OregonTrailState,
} from './state/types'
import {
  LANDMARKS, RANDOM_EVENTS, DEFAULT_STATE,
  hasCynthiasInn,
} from './state/constants'
import { gameReducer } from './state/reducer'
import type { GameAction } from './state/actions'
import { isActiveGoldCountryTrip, type GoldCountryTrip, type GoldCountryTripResult } from './state/goldCountryTrip'
import { quoteGoldCountryTransport, type GoldCountryTransportMode } from '@/lib/goldCountryTransport'
import { getRandomEncounter, TRAVEL_ENCOUNTERS } from './data/goldCountryEncounters'
import { writeLocalTrailAutosave } from './lib/localTrailSave'

// Re-export types and constants for backward compatibility (28+ consumers import from this file)
export type { Pace, Rations, Weather, GamePhase, GraphicsTier }
export type { PartyMember, RandomEvent, EventChoice, EventOutcome, InvestigationState, OregonTrailState }
export { LANDMARKS, RANDOM_EVENTS, DEFAULT_STATE, hasCynthiasInn }


// Context
interface OregonTrailContextValue {
  state: OregonTrailState
  getCurrentState: () => OregonTrailState
  startGame: (leaderName: string, partyNames: string[]) => void
  purchaseSupplies: (supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number }) => void
  beginJourney: () => void
  travel: () => void
  setPace: (pace: Pace) => void
  setRations: (rations: Rations) => void
  handleEventChoice: (choiceId: string, outcomeMessageOverride?: string) => void
  hunt: () => void
  drinkGargleBlaster: () => void
  crossRiver: (method: 'ford' | 'ferry' | 'caulk') => void
  applyRiverCrossingEffects: (effects: CrossingOutcome['effects'], message: string) => void
  visitTown: () => void
  leaveTown: () => void
  resetGame: () => void

  // Shop & Inn Methods
  buySupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen', amount: number, cost: number) => void
  sellSupplies: (resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen', amount: number, goldGained: number) => void
  restAtInn: (healthBonus: number, moraleBonus: number, cost: number) => void
  hunker: () => void
  cureSickness: () => void
  buyFood: (healthBonus: number, moraleBonus: number, cost: number, partyWide: boolean) => void
  buyDrink: (moraleBonus: number, cost: number) => void

  // Mystery/RPG Extensions
  goToCharacterCreation: () => void
  openInvestigation: () => void
  closeInvestigation: () => void
  investigateLocation: (locationId: string) => void
  openWitnessDialogue: (witnessType: string, npcId?: string | null) => void
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
  startGoldCountryTravel: (toLocationId: string, mode?: GoldCountryTransportMode, luck?: number) => Promise<GoldCountryTripResult>
  resumeGoldCountryTravel: () => Promise<GoldCountryTripResult>
  cancelGoldCountryTravel: () => GoldCountryTripResult
  arriveAtGoldCountryLocation: (locationId: string, tripId: string) => GoldCountryTripResult
  chooseGoldCountryRoadEncounter: (choiceId: string) => GoldCountryTripResult
  continueGoldCountryRoadEncounter: () => GoldCountryTripResult
  returnToGoldCountryMap: () => void
  discoverLocation: (locationId: string) => void
  completeQuest: (questId: string) => void
  completeQuestWithReward: (questId: string, reward: QuestReward, choiceId?: string) => void
  markAreaSearched: (areaId: string) => void
  addInventoryItem: (itemId: string) => void
  advanceGoldCountryDay: (days: number) => void

  // Living Trail (presence-gated real-world chains)
  enterLivingTrail: () => void
  completeLivingTrailNode: (nodeId: string, verifiedPresence: boolean) => void

  // DM directive channel (DM Layer P1)
  applyDmDirective: (directive: DmDirective) => void

  // Save/Load support
  loadState: (savedState: OregonTrailState) => void

  // Posse system (#6)
  hirePosseMember: (member: PosseMember) => void
  dismissPosseMember: (memberId: string) => void

  // Trail guide (#11)
  hireGuide: (guideId: string, duration: number) => void
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
  const [state, setRenderedState] = useState(DEFAULT_STATE)
  const stateRef = useRef(state)
  // One reducer evaluation per accepted action. Critical saves and same-event
  // actions see the latest state before React renders, including arrival guards.
  const dispatch = useCallback((action: GameAction) => {
    const next = gameReducer(stateRef.current, action)
    stateRef.current = next
    setRenderedState(next)
  }, [])
  const getCurrentState = useCallback(() => stateRef.current, [])
  const commitTripAction = useCallback((action: GameAction): GoldCountryTripResult => {
    const next = gameReducer(stateRef.current, action)
    if (next === stateRef.current) return { ok: false, reason: 'invalid' }
    try { writeLocalTrailAutosave(next) } catch { return { ok: false, reason: 'storage' } }
    stateRef.current = next
    setRenderedState(next)
    return { ok: true }
  }, [])
  const { applyKarma } = useKarma()
  const {
    earnNeutral, earnGood, addBadKarma, spendNeutral, spendTravelFare, hasTravelFareReceipt, isInitialized: walletInitialized,
    recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction,
  } = useKarmaWallet()

  // === Thin dispatch wrappers ===

  const startGame = useCallback((leaderName: string, partyNames: string[]) => {
    dispatch({ type: 'START_GAME', leaderName, partyNames })
  }, [dispatch])

  const purchaseSupplies = useCallback((supplies: { food: number; ammo: number; parts: number; medicine: number; oxen: number }) => {
    dispatch({ type: 'PURCHASE_SUPPLIES', supplies })
  }, [dispatch])

  const beginJourney = useCallback(() => dispatch({ type: 'BEGIN_JOURNEY' }), [dispatch])
  const travel = useCallback(() => dispatch({ type: 'TRAVEL' }), [dispatch])
  const setPace = useCallback((pace: Pace) => dispatch({ type: 'SET_PACE', pace }), [dispatch])
  const setRations = useCallback((rations: Rations) => dispatch({ type: 'SET_RATIONS', rations }), [dispatch])

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
  }, [state.currentEvent, applyKarma, dispatch])

  const hunt = useCallback(() => dispatch({ type: 'HUNT' }), [dispatch])
  const drinkGargleBlaster = useCallback(() => dispatch({ type: 'DRINK_GARGLE_BLASTER' }), [dispatch])

  // Ferry costs 20🌮 - caller must handle payment via KarmaWalletContext
  const crossRiver = useCallback((method: 'ford' | 'ferry' | 'caulk') => {
    if (method === 'ford') {
      applyKarma('oregon_trail', 'Risked fording the river', 10, 0)
    }
    dispatch({ type: 'CROSS_RIVER', method })
  }, [applyKarma, dispatch])

  const applyRiverCrossingEffects = useCallback((effects: CrossingOutcome['effects'], message: string) => {
    dispatch({ type: 'APPLY_RIVER_CROSSING_EFFECTS', effects, message })
  }, [dispatch])

  const visitTown = useCallback(() => dispatch({ type: 'VISIT_TOWN' }), [dispatch])
  const leaveTown = useCallback(() => dispatch({ type: 'LEAVE_TOWN' }), [dispatch])
  const resetGame = useCallback(() => dispatch({ type: 'RESET_GAME' }), [dispatch])

  // === Shop & Inn (cost handled by caller via KarmaWalletContext) ===

  const buySupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    cost: number
  ) => {
    dispatch({ type: 'BUY_SUPPLIES', resource, amount, cost })
  }, [dispatch])

  const sellSupplies = useCallback((
    resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen',
    amount: number,
    karmaGained: number
  ) => {
    dispatch({ type: 'SELL_SUPPLIES', resource, amount, karmaGained })
  }, [dispatch])

  const repairWagon = useCallback(() => dispatch({ type: 'REPAIR_WAGON' }), [dispatch])

  const restAtInn = useCallback((healthBonus: number, moraleBonus: number, cost: number) => {
    dispatch({ type: 'REST_AT_INN', healthBonus, moraleBonus, cost })
  }, [dispatch])

  const hunker = useCallback(() => {
    dispatch({ type: 'HUNKER' })
  }, [dispatch])

  const cureSickness = useCallback(() => {
    dispatch({ type: 'CURE_SICKNESS' })
  }, [dispatch])

  const buyFood = useCallback((healthBonus: number, moraleBonus: number, cost: number, partyWide: boolean) => {
    dispatch({ type: 'BUY_FOOD', healthBonus, moraleBonus, cost, partyWide })
  }, [dispatch])

  const buyDrink = useCallback((moraleBonus: number, cost: number) => {
    dispatch({ type: 'BUY_DRINK', moraleBonus, cost })
  }, [dispatch])

  // === Mystery/RPG navigation ===

  const goToCharacterCreation = useCallback(() => dispatch({ type: 'GO_TO_CHARACTER_CREATION' }), [dispatch])
  const openInvestigation = useCallback(() => dispatch({ type: 'OPEN_INVESTIGATION' }), [dispatch])
  const closeInvestigation = useCallback(() => dispatch({ type: 'CLOSE_INVESTIGATION' }), [dispatch])
  const investigateLocation = useCallback((locationId: string) => dispatch({ type: 'INVESTIGATE_LOCATION', locationId }), [dispatch])
  const openWitnessDialogue = useCallback((witnessType: string, npcId?: string | null) => dispatch({ type: 'OPEN_WITNESS_DIALOGUE', witnessType, npcId }), [dispatch])
  const closeWitnessDialogue = useCallback(() => dispatch({ type: 'CLOSE_WITNESS_DIALOGUE' }), [dispatch])
  const openDossier = useCallback(() => dispatch({ type: 'OPEN_DOSSIER' }), [dispatch])
  const closeDossier = useCallback(() => dispatch({ type: 'CLOSE_DOSSIER' }), [dispatch])
  const openTelegraph = useCallback(() => dispatch({ type: 'OPEN_TELEGRAPH' }), [dispatch])
  const closeTelegraph = useCallback(() => dispatch({ type: 'CLOSE_TELEGRAPH' }), [dispatch])
  const openJournal = useCallback(() => dispatch({ type: 'OPEN_JOURNAL' }), [dispatch])
  const closeJournal = useCallback(() => dispatch({ type: 'CLOSE_JOURNAL' }), [dispatch])
  const spendInvestigationTime = useCallback((hours: number) => dispatch({ type: 'SPEND_INVESTIGATION_TIME', hours }), [dispatch])
  const returnToPreviousPhase = useCallback(() => dispatch({ type: 'RETURN_TO_PREVIOUS_PHASE' }), [dispatch])

  // === World map / direct state ===

  const setPhase = useCallback((phase: GamePhase) => dispatch({ type: 'SET_PHASE', phase }), [dispatch])
  const setCurrentLandmark = useCallback((landmark: string) => dispatch({ type: 'SET_CURRENT_LANDMARK', landmark }), [dispatch])
  const openWorldMap = useCallback(() => dispatch({ type: 'OPEN_WORLD_MAP' }), [dispatch])

  // === Title and Chapter flow ===

  const startFromTitle = useCallback(() => dispatch({ type: 'START_FROM_TITLE' }), [dispatch])
  const completeChapterIntro = useCallback(() => dispatch({ type: 'COMPLETE_CHAPTER_INTRO' }), [dispatch])

  // === Ranch management ===

  const openRanchManagement = useCallback(() => dispatch({ type: 'OPEN_RANCH_MANAGEMENT' }), [dispatch])
  const closeRanchManagement = useCallback(() => dispatch({ type: 'CLOSE_RANCH_MANAGEMENT' }), [dispatch])

  // === Settlement system ===

  const enterSettlement = useCallback(() => dispatch({ type: 'ENTER_SETTLEMENT' }), [dispatch])
  const leaveSettlement = useCallback(() => dispatch({ type: 'LEAVE_SETTLEMENT' }), [dispatch])
  const completeSettlement = useCallback(() => dispatch({ type: 'COMPLETE_SETTLEMENT' }), [dispatch])

  // === Gold Country Free-Roam ===

  const enterGoldCountryExplore = useCallback(() => dispatch({ type: 'ENTER_GOLD_COUNTRY_EXPLORE' }), [dispatch])
  const resumeGoldCountryTravel = useCallback(async (): Promise<GoldCountryTripResult> => {
    const trip = stateRef.current.goldCountryTrip
    if (!trip || !isActiveGoldCountryTrip(trip)) return { ok: false, reason: 'invalid' }
    if (trip.status === 'paid') return { ok: true }
    if (!walletInitialized) return { ok: false, reason: 'invalid' }
    const fare = await spendTravelFare(trip.id, trip.quote.fare, `${trip.quote.mode} to ${trip.quote.toId}`)
    if (!fare.ok) return fare
    const current = stateRef.current.goldCountryTrip
    if (current?.id === trip.id && current.status === 'paid') return { ok: true }
    // A failed paid-state save leaves the plan available. Retrying reuses the
    // wallet receipt, so a crash here never requires a second local fare.
    return commitTripAction({ type: 'PAY_GOLD_COUNTRY_TRAVEL', tripId: trip.id })
  }, [spendTravelFare, walletInitialized, commitTripAction])

  const startGoldCountryTravel = useCallback(async (toLocationId: string, mode: GoldCountryTransportMode = 'wagon', luck?: number): Promise<GoldCountryTripResult> => {
    const current = stateRef.current
    if (isActiveGoldCountryTrip(current.goldCountryTrip)) return { ok: false, reason: 'busy' }
    if (mode !== 'wagon' && !walletInitialized) return { ok: false, reason: 'invalid' }
    const result = quoteGoldCountryTransport({ fromId: current.currentGoldCountryLocation || 'bobr_cabin', toId: toLocationId,
      mode, clock: current, luck: luck ?? current.saddle?.Luck, roll: mode === 'wagon' ? undefined : Math.random() }) // safe-mint: Luck changes travel minutes only; no reward is minted.
    if (!result.ok) return { ok: false, reason: 'invalid' }
    const trip: GoldCountryTrip = {
      version: 1,
      id: `gc_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`, // safe-mint: local journey identity for debit replay; no valuable token or API authority.
      status: result.quote.fare > 0 ? 'planned' : 'paid',
      departureClock: { day: current.day, goldCountryDay: current.goldCountryDay ?? 1, goldCountryMinute: current.goldCountryMinute ?? 0 },
      quote: result.quote,
      roadEncounterId: mode === 'wagon' && !result.quote.adjacent ? getRandomEncounter(result.quote.distance)?.id ?? null : null,
    }
    const saved = commitTripAction({ type: 'START_GOLD_COUNTRY_TRAVEL', trip })
    if (!saved.ok || trip.status === 'paid') return saved
    return resumeGoldCountryTravel()
  }, [walletInitialized, commitTripAction, resumeGoldCountryTravel])

  const visitGoldCountryLocation = useCallback((locationId: string) => {
    if (locationId === stateRef.current.currentGoldCountryLocation) dispatch({ type: 'VISIT_GOLD_COUNTRY_LOCATION', locationId })
    else void startGoldCountryTravel(locationId)
  }, [dispatch, startGoldCountryTravel])

  const arriveAtGoldCountryLocation = useCallback((locationId: string, tripId: string): GoldCountryTripResult =>
    commitTripAction({ type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION', locationId, tripId }), [commitTripAction])

  const cancelGoldCountryTravel = useCallback((): GoldCountryTripResult => {
    const trip = stateRef.current.goldCountryTrip
    if (!trip || !isActiveGoldCountryTrip(trip)) return { ok: false, reason: 'invalid' }
    // Payment may have succeeded before the paid trip save did. Resume that
    // ticket instead of silently cancelling a fare that was actually debited.
    if (trip.status === 'planned' && hasTravelFareReceipt(trip.id, trip.quote.fare)) return { ok: false, reason: 'conflict' }
    return commitTripAction({ type: 'CANCEL_GOLD_COUNTRY_TRAVEL', tripId: trip.id })
  }, [commitTripAction, hasTravelFareReceipt])

  const chooseGoldCountryRoadEncounter = useCallback((choiceId: string): GoldCountryTripResult => {
    const trip = stateRef.current.goldCountryTrip
    if (!trip) return { ok: false, reason: 'invalid' }
    const choice = TRAVEL_ENCOUNTERS.find(encounter => encounter.id === trip.roadEncounterId)?.choices.find(item => item.id === choiceId)
    if (!choice) return { ok: false, reason: 'invalid' }
    const saved = commitTripAction({ type: 'CHOOSE_GOLD_COUNTRY_ROAD_ENCOUNTER', tripId: trip.id, choiceId })
    if (!saved.ok) return saved
    // Preserve the donor encounter's existing effects. The saved choice prevents
    // duplicate clicks/reloads awarding it again; these ordinary grants still
    // use the existing wallet sync, not a new server transaction protocol.
    const result = choice.outcome
    if (result.karmaDelta && result.karmaDelta > 0) void earnGood(result.karmaDelta)
    if (result.goldDelta && result.goldDelta > 0) void earnNeutral(result.goldDelta)
    if (result.goldDelta && result.goldDelta < 0) void spendNeutral(Math.abs(result.goldDelta))
    return { ok: true }
  }, [commitTripAction, earnGood, earnNeutral, spendNeutral])

  const continueGoldCountryRoadEncounter = useCallback((): GoldCountryTripResult => {
    const trip = stateRef.current.goldCountryTrip
    return trip ? commitTripAction({ type: 'CONTINUE_GOLD_COUNTRY_ROAD_ENCOUNTER', tripId: trip.id }) : { ok: false, reason: 'invalid' }
  }, [commitTripAction])
  const returnToGoldCountryMap = useCallback(() => dispatch({ type: 'RETURN_TO_GOLD_COUNTRY_MAP' }), [dispatch])
  const discoverLocation = useCallback((locationId: string) => dispatch({ type: 'DISCOVER_LOCATION', locationId }), [dispatch])
  const completeQuest = useCallback((questId: string) => dispatch({ type: 'COMPLETE_QUEST', questId }), [dispatch])

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
  }, [earnNeutral, spendNeutral, earnGood, addBadKarma, recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction, dispatch])

  const markAreaSearched = useCallback((areaId: string) => dispatch({ type: 'MARK_AREA_SEARCHED', areaId }), [dispatch])
  const addInventoryItem = useCallback((itemId: string) => dispatch({ type: 'ADD_INVENTORY_ITEM', itemId }), [dispatch])
  const advanceGoldCountryDay = useCallback((days: number) => dispatch({ type: 'ADVANCE_GOLD_COUNTRY_DAY', days }), [dispatch])

  // === Living Trail (presence-gated real-world chains) ===

  const enterLivingTrail = useCallback(() => dispatch({ type: 'ENTER_LIVING_TRAIL' }), [dispatch])

  // completeLivingTrailNode — karma side effects wrapper (same split as
  // completeQuestWithReward: reducer owns state, wrapper owns karma).
  // Remote "by-lantern-light" completions earn karma scaled by
  // remoteVariant.karmaScale (rounded) and record verifiedPresence: false.
  const completeLivingTrailNode = useCallback((nodeId: string, verifiedPresence: boolean) => {
    const node = getLivingTrailNode(nodeId)
    if (!node) return
    // Mirror the reducer guard so karma can't be double-granted: only an
    // 'available' node completes.
    if (state.livingTrail.nodes[nodeId]?.status !== 'available') return

    dispatch({ type: 'COMPLETE_LT_NODE', nodeId, verifiedPresence })

    const scale = verifiedPresence ? 1 : node.remoteVariant.karmaScale
    if (node.reward.goodKarma) {
      earnGood(Math.round(node.reward.goodKarma * scale), `Living Trail: ${node.title}`)
    }
    if (node.reward.neutralKarma) {
      earnNeutral(Math.round(node.reward.neutralKarma * scale), `Living Trail: ${node.title}`)
    }

    // Chain completion → one cross-game event (fire-and-forget) for the
    // future town-memory layer.
    const chainNodes = getChainNodes(node.chainId)
    const chainComplete = chainNodes.every(
      n => n.id === nodeId || state.livingTrail.nodes[n.id]?.status === 'completed'
    )
    if (chainComplete) {
      try {
        CrossGameStorage.logEvent(
          'prospectors_tale',
          'living_trail_chain_completed',
          `Walked the Living Trail: ${node.chainId}`,
          { detail: `chain=${node.chainId} finalNode=${nodeId} verifiedPresence=${verifiedPresence}` }
        )
      } catch { /* fire-and-forget */ }
    }
  }, [state.livingTrail.nodes, earnGood, earnNeutral, dispatch])

  // === DM directive channel (DM Layer P1) ===

  // Validate at this boundary too (the queue validated on write AND read; the
  // reducer will validate again — a directive that fails here is dropped and
  // logged, never partially applied). Audit-tape logging is a side effect, so
  // it lives in this wrapper, not the reducer — same split as the karma hooks.
  const applyDmDirective = useCallback((directive: DmDirective) => {
    const v = validateDmDirective(directive)
    if (!v.ok) {
      console.warn(`[dm-directive] DROP at client boundary: ${v.reason}`)
      return
    }
    dispatch({ type: 'APPLY_DM_DIRECTIVE', directive: v.directive })
    try {
      CrossGameStorage.logEvent(
        'prospectors_tale',
        'dm_directive',
        `DM directive applied: ${v.directive.kind}`,
        { detail: JSON.stringify(v.directive) }
      )
    } catch { /* fire-and-forget */ }
  }, [dispatch])

  // === Save/Load ===

  const loadState = useCallback((savedState: OregonTrailState) => {
    dispatch({ type: 'LOAD_STATE', savedState })
  }, [dispatch])

  // === Posse system ===

  const hirePosseMember = useCallback((member: PosseMember) => {
    dispatch({ type: 'HIRE_POSSE_MEMBER', member })
  }, [dispatch])

  const dismissPosseMember = useCallback((memberId: string) => {
    dispatch({ type: 'DISMISS_POSSE_MEMBER', memberId })
  }, [dispatch])

  // Trail guide (#11) — karma cost handled by GuideHire before this call
  const hireGuide = useCallback((guideId: string, duration: number) => {
    dispatch({ type: 'HIRE_GUIDE', guideId, duration })
  }, [dispatch])

  const handleDesperationChoice = useCallback((choiceId: string) => {
    dispatch({ type: 'HANDLE_DESPERATION_CHOICE', choiceId })
  }, [dispatch])

  // === NPC Relationships ===

  const updateNPCRelationship = useCallback((npcId: string, modifierId: string) => {
    dispatch({ type: 'UPDATE_NPC_RELATIONSHIP', npcId, modifierId })
  }, [dispatch])

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
    getCurrentState,
    startGame,
    purchaseSupplies,
    beginJourney,
    travel,
    setPace,
    setRations,
    handleEventChoice,
    hunt,
    drinkGargleBlaster,
    crossRiver,
    applyRiverCrossingEffects,
    visitTown,
    leaveTown,
    resetGame,
    // Shop & Inn methods
    buySupplies,
    sellSupplies,
    restAtInn,
    hunker,
    cureSickness,
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
    resumeGoldCountryTravel,
    cancelGoldCountryTravel,
    chooseGoldCountryRoadEncounter,
    continueGoldCountryRoadEncounter,
    arriveAtGoldCountryLocation,
    returnToGoldCountryMap,
    discoverLocation,
    completeQuest,
    completeQuestWithReward,
    markAreaSearched,
    addInventoryItem,
    advanceGoldCountryDay,
    // Living Trail
    enterLivingTrail,
    completeLivingTrailNode,
    // DM directive channel (DM Layer P1)
    applyDmDirective,
    // Save/Load
    loadState,
    // Posse system (#6)
    hirePosseMember,
    dismissPosseMember,
    // Trail guide (#11)
    hireGuide,
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
