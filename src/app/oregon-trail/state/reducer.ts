/**
 * Main game reducer — delegates to engine functions per action type.
 *
 * Note: Some actions (TRAVEL, HUNT, CROSS_RIVER) use Math.random() inside the
 * reducer. This matches the existing useState behavior. The three callbacks with
 * karma side effects (handleEventChoice, crossRiver, completeQuestWithReward)
 * call karma hooks BEFORE dispatching, then the reducer handles the state-only part.
 */

import type { OregonTrailState, GamePhase, PartyMember } from './types'
import type { GameAction } from './actions'
import { DEFAULT_STATE, DEFAULT_INVESTIGATION } from './constants'
import { computeTravel } from './travelEngine'
import {
  applyBuySupplies, applySellSupplies, applyRepairWagon,
  applyRestAtInn, applyBuyFood, applyBuyDrink,
} from './resourceEngine'
import {
  applyGoToCharacterCreation, applyOpenInvestigation, applyCloseInvestigation,
  applyInvestigateLocation, applyOpenWitnessDialogue, applyCloseWitnessDialogue,
  applyOpenDossier, applyCloseDossier, applyOpenTelegraph, applyCloseTelegraph,
  applyOpenJournal, applyCloseJournal, applySpendInvestigationTime,
  applyReturnToPreviousPhase,
} from './investigationActions'
import {
  applyEnterGoldCountryExplore, applyVisitGoldCountryLocation,
  applyStartGoldCountryTravel, applyArriveAtGoldCountryLocation,
  applyReturnToGoldCountryMap, applyDiscoverLocation,
  applyCompleteQuest, applyCompleteQuestState,
  applyMarkAreaSearched, applyAddInventoryItem, applyAdvanceGoldCountryDay,
} from './goldCountryActions'
import { applyHirePosseMember, applyDismissPosseMember } from './posseEngine'
import {
  applySetPhase, applySetCurrentLandmark, applyOpenWorldMap,
  applyStartFromTitle, applyCompleteChapterIntro,
  applyOpenRanchManagement, applyCloseRanchManagement,
  applyEnterSettlement, applyLeaveSettlement, applyCompleteSettlement,
  applyVisitTown, applyLeaveTown,
} from './phaseNavigation'
import { getCriticalDescription } from '../data/criticalDescriptions'
import { createRelationship, applyDispositionChange } from '../data/npcRelationships'
import type { PartyRole } from '../data/posseSystem'

export function gameReducer(state: OregonTrailState, action: GameAction): OregonTrailState {
  switch (action.type) {
    // === Game lifecycle ===

    case 'START_GAME': {
      const party: PartyMember[] = [
        { id: 'leader', name: action.leaderName, health: 100, isSick: false, role: 'leader' as PartyRole },
        ...action.partyNames.map((name, i) => ({
          id: `member_${i}`,
          name,
          health: 100,
          isSick: false,
          role: 'companion' as PartyRole,
        })),
      ]
      return { ...DEFAULT_STATE, phase: 'outfitting', party, wagonLeader: action.leaderName }
    }

    case 'PURCHASE_SUPPLIES':
      return {
        ...state,
        food: state.food + action.supplies.food,
        ammunition: state.ammunition + action.supplies.ammo * 20,
        spareParts: state.spareParts + action.supplies.parts,
        medicine: state.medicine + action.supplies.medicine,
        oxen: state.oxen + action.supplies.oxen,
      }

    case 'BEGIN_JOURNEY':
      return { ...state, phase: 'traveling', message: 'Your journey to Gold Country begins!' }

    case 'TRAVEL':
      return computeTravel(state)

    case 'RESET_GAME':
      return DEFAULT_STATE

    case 'LOAD_STATE':
      return { ...DEFAULT_STATE, ...action.savedState }

    // === Settings ===

    case 'SET_PACE':
      return { ...state, pace: action.pace }

    case 'SET_RATIONS':
      return { ...state, rations: action.rations }

    // === Events ===

    case 'HANDLE_EVENT_CHOICE': {
      if (!state.currentEvent) return state
      const choice = state.currentEvent.choices.find(c => c.id === action.choiceId)
      if (!choice) return state
      const outcome = choice.outcome
      const updatedParty = state.party.map(member => ({
        ...member,
        health: Math.max(0, Math.min(100, member.health + (outcome.healthDelta || 0))),
      }))
      return {
        ...state,
        food: Math.max(0, state.food + (outcome.foodDelta || 0)),
        ammunition: Math.max(0, state.ammunition + (outcome.ammoDelta || 0)),
        medicine: Math.max(0, state.medicine + (outcome.medicineDelta || 0)),
        spareParts: Math.max(0, state.spareParts + (outcome.spareParts || 0)),
        day: state.day + (outcome.daysLost || 0),
        party: updatedParty,
        phase: 'traveling',
        currentEvent: null,
        message: action.outcomeMessageOverride ?? outcome.message,
      }
    }

    case 'HANDLE_DESPERATION_CHOICE': {
      const despEvent = state.activeDesperationEvent
      if (!despEvent) return state
      const despChoice = despEvent.choices.find(c => c.id === action.choiceId)
      if (!despChoice) return state

      let newFood = state.food
      let newAmmo = state.ammunition
      let newMedicine = state.medicine
      let newParts = state.spareParts
      let newOxen = state.oxen
      const newMorale = Math.max(0, Math.min(100, state.morale + despChoice.moraleDelta))
      let newWagonCond = state.wagonCondition

      for (const effect of despChoice.effects) {
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
        ...state,
        food: newFood,
        ammunition: newAmmo,
        medicine: newMedicine,
        spareParts: newParts,
        oxen: newOxen,
        morale: newMorale,
        wagonCondition: newWagonCond,
        activeDesperationEvent: null,
        phase: 'traveling' as GamePhase,
        message: despChoice.narratorReaction,
      }
    }

    // === Hunting ===

    case 'HUNT': {
      if (state.ammunition < 10) {
        return { ...state, message: 'Not enough ammunition to hunt!' }
      }
      const roll = Math.random()
      const success = roll > 0.3
      const isCritSuccess = roll > 0.95
      const isCritFailure = roll < 0.05
      const ammoUsed = Math.floor(Math.random() * 10) + 5
      const foodGained = success ? Math.floor(Math.random() * 200) + 50 : 0
      let huntMessage = success
        ? `You shot a deer! Gained ${foodGained} pounds of food.`
        : 'The animals got away. Better luck next time.'
      if (isCritSuccess) {
        huntMessage = `${getCriticalDescription(true, 'hunting', undefined, 'Agility')} ${huntMessage}`
      } else if (isCritFailure) {
        huntMessage = `${getCriticalDescription(false, 'hunting')} ${huntMessage}`
      }
      return {
        ...state,
        ammunition: state.ammunition - ammoUsed,
        food: state.food + foodGained,
        animalsKilled: state.animalsKilled + (success ? 1 : 0),
        message: huntMessage,
      }
    }

    // === River crossing ===

    case 'CROSS_RIVER': {
      let crossOutcome: { message: string; damageProbability: number; damageAmount: number }
      switch (action.method) {
        case 'ford':
          crossOutcome = { message: 'You attempt to ford the river...', damageProbability: 0.4, damageAmount: 20 }
          break
        case 'ferry':
          crossOutcome = { message: 'You pay for the ferry crossing.', damageProbability: 0.05, damageAmount: 5 }
          break
        case 'caulk':
          crossOutcome = { message: 'You caulk the wagon and float across...', damageProbability: 0.25, damageAmount: 15 }
          break
      }
      const tookDamage = Math.random() < crossOutcome.damageProbability
      const foodLost = tookDamage ? Math.floor(state.food * 0.1) : 0
      return {
        ...state,
        food: state.food - foodLost,
        wagonCondition: tookDamage ? Math.max(0, state.wagonCondition - crossOutcome.damageAmount) : state.wagonCondition,
        riversCrossed: state.riversCrossed + 1,
        phase: 'traveling',
        message: tookDamage
          ? `${crossOutcome.message} Some supplies were lost in the crossing!`
          : `${crossOutcome.message} Crossed safely!`,
      }
    }

    case 'APPLY_RIVER_CROSSING_EFFECTS': {
      const { effects, message } = action
      let updatedRiverParty = state.party.map(member => ({
        ...member,
        health: Math.max(0, Math.min(100, member.health + (effects.healthDelta || 0)))
      }))
      if (effects.specificInjury) {
        const targetId = effects.specificInjury.memberId ||
          updatedRiverParty[Math.floor(Math.random() * updatedRiverParty.length)]?.id
        updatedRiverParty = updatedRiverParty.map(member => {
          if (member.id === targetId) {
            const newHealth = Math.max(0, member.health - effects.specificInjury!.damage)
            const isDead = newHealth <= 0
            const injuryType = effects.specificInjury!.injuryType
            return {
              ...member,
              health: newHealth,
              isSick: !isDead && (injuryType === 'hypothermia' || injuryType === 'broken_limb'),
              sicknessType: injuryType === 'broken_limb' ? 'broken_leg' as const : undefined,
              daysUntilRecovery: injuryType === 'broken_limb' ? 14 : (injuryType === 'hypothermia' ? 5 : undefined)
            }
          }
          return member
        })
      }
      return {
        ...state,
        food: Math.max(0, state.food - (effects.foodLost || 0)),
        ammunition: Math.max(0, state.ammunition - (effects.ammoLost || 0)),
        medicine: Math.max(0, state.medicine - (effects.medicineUsed || 0)),
        spareParts: Math.max(0, state.spareParts - (effects.sparePartsUsed || 0)),
        oxen: Math.max(0, state.oxen - (effects.oxenLost || 0)),
        wagonCondition: Math.max(0, state.wagonCondition - (effects.wagonDamage || 0)),
        morale: Math.max(0, Math.min(100, state.morale + (effects.moraleChange || 0))),
        party: updatedRiverParty,
        day: state.day + (effects.daysLost || 0),
        daysOnTrail: state.daysOnTrail + (effects.daysLost || 0),
        riversCrossed: state.riversCrossed + 1,
        phase: 'traveling' as GamePhase,
        message,
      }
    }

    // === Town ===
    case 'VISIT_TOWN': return applyVisitTown(state)
    case 'LEAVE_TOWN': return applyLeaveTown(state)

    // === Shop & Inn ===
    case 'BUY_SUPPLIES': return applyBuySupplies(state, action.resource, action.amount)
    case 'SELL_SUPPLIES': return applySellSupplies(state, action.resource, action.amount)
    case 'REPAIR_WAGON': return applyRepairWagon(state)
    case 'REST_AT_INN': return applyRestAtInn(state, action.healthBonus, action.moraleBonus)
    case 'BUY_FOOD': return applyBuyFood(state, action.healthBonus, action.moraleBonus, action.partyWide)
    case 'BUY_DRINK': return applyBuyDrink(state, action.moraleBonus)

    // === Mystery/RPG navigation ===
    case 'GO_TO_CHARACTER_CREATION': return applyGoToCharacterCreation(state)
    case 'OPEN_INVESTIGATION': return applyOpenInvestigation(state)
    case 'CLOSE_INVESTIGATION': return applyCloseInvestigation(state)
    case 'INVESTIGATE_LOCATION': return applyInvestigateLocation(state, action.locationId)
    case 'OPEN_WITNESS_DIALOGUE': return applyOpenWitnessDialogue(state, action.witnessType)
    case 'CLOSE_WITNESS_DIALOGUE': return applyCloseWitnessDialogue(state)
    case 'OPEN_DOSSIER': return applyOpenDossier(state)
    case 'CLOSE_DOSSIER': return applyCloseDossier(state)
    case 'OPEN_TELEGRAPH': return applyOpenTelegraph(state)
    case 'CLOSE_TELEGRAPH': return applyCloseTelegraph(state)
    case 'OPEN_JOURNAL': return applyOpenJournal(state)
    case 'CLOSE_JOURNAL': return applyCloseJournal(state)
    case 'SPEND_INVESTIGATION_TIME': return applySpendInvestigationTime(state, action.hours)
    case 'RETURN_TO_PREVIOUS_PHASE': return applyReturnToPreviousPhase(state)

    // === World map / direct state ===
    case 'SET_PHASE': return applySetPhase(state, action.phase)
    case 'SET_CURRENT_LANDMARK': return applySetCurrentLandmark(state, action.landmark)
    case 'OPEN_WORLD_MAP': return applyOpenWorldMap(state)

    // === Title and Chapter flow ===
    case 'START_FROM_TITLE': return applyStartFromTitle(state)
    case 'COMPLETE_CHAPTER_INTRO': return applyCompleteChapterIntro(state)

    // === Ranch management ===
    case 'OPEN_RANCH_MANAGEMENT': return applyOpenRanchManagement(state)
    case 'CLOSE_RANCH_MANAGEMENT': return applyCloseRanchManagement(state)

    // === Settlement ===
    case 'ENTER_SETTLEMENT': return applyEnterSettlement(state)
    case 'LEAVE_SETTLEMENT': return applyLeaveSettlement(state)
    case 'COMPLETE_SETTLEMENT': return applyCompleteSettlement(state)

    // === Gold Country Free-Roam ===
    case 'ENTER_GOLD_COUNTRY_EXPLORE': return applyEnterGoldCountryExplore(state)
    case 'VISIT_GOLD_COUNTRY_LOCATION': return applyVisitGoldCountryLocation(state, action.locationId)
    case 'START_GOLD_COUNTRY_TRAVEL': return applyStartGoldCountryTravel(state, action.toLocationId)
    case 'ARRIVE_AT_GOLD_COUNTRY_LOCATION': return applyArriveAtGoldCountryLocation(state, action.locationId)
    case 'RETURN_TO_GOLD_COUNTRY_MAP': return applyReturnToGoldCountryMap(state)
    case 'DISCOVER_LOCATION': return applyDiscoverLocation(state, action.locationId)
    case 'COMPLETE_QUEST': return applyCompleteQuest(state, action.questId)
    case 'COMPLETE_QUEST_WITH_REWARD': return applyCompleteQuestState(state, action.questId, action.reward.item)
    case 'MARK_AREA_SEARCHED': return applyMarkAreaSearched(state, action.areaId)
    case 'ADD_INVENTORY_ITEM': return applyAddInventoryItem(state, action.itemId)
    case 'ADVANCE_GOLD_COUNTRY_DAY': return applyAdvanceGoldCountryDay(state, action.days)

    // === Posse system ===
    case 'HIRE_POSSE_MEMBER': return applyHirePosseMember(state, action.member)
    case 'DISMISS_POSSE_MEMBER': return applyDismissPosseMember(state, action.memberId)

    // === NPC relationships ===
    case 'UPDATE_NPC_RELATIONSHIP': {
      const existing = state.npcRelationships[action.npcId] ?? createRelationship(action.npcId)
      const updated = applyDispositionChange(existing, action.modifierId, state.day)
      return {
        ...state,
        npcRelationships: { ...state.npcRelationships, [action.npcId]: updated },
      }
    }

    default:
      return state
  }
}
