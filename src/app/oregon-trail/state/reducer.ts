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
  applyEnterLivingTrail, applyCompleteLivingTrailNode, migrateLivingTrail,
} from './livingTrailActions'
import { applyDmDirectiveState } from './dmDirectiveActions'
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

/**
 * Save migration (#8): corrupted/legacy saves can carry duplicate party ids
 * (e.g. every starting member `id:"leader"`), which produces duplicate React
 * keys (TownScreen/CampMenu party lists) and multiple LEADER badges in Camp.
 * Ensures every id is unique and only the first leader keeps role 'leader'.
 */
export function migrateParty(party: PartyMember[]): PartyMember[] {
  const seen = new Set<string>()
  let leaderSeen = false
  return party.map((original, i) => {
    let member = original
    if (member.role === 'leader') {
      if (leaderSeen) member = { ...member, role: 'companion' as PartyRole }
      else leaderSeen = true
    }
    if (!member.id || seen.has(member.id)) {
      let n = i
      let candidate = `member_${n}`
      while (seen.has(candidate)) { n += 1; candidate = `member_${n}` }
      member = { ...member, id: candidate }
    }
    seen.add(member.id)
    return member
  })
}

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
      return computeTravel(state, action.stats)

    case 'RESET_GAME':
      return DEFAULT_STATE

    case 'LOAD_STATE': {
      // graphicsTier pinned: presentation is not save data (visual64) — old
      // saves carry 'retro_4bit' from the progression-lock era
      const loaded = { ...DEFAULT_STATE, ...action.savedState, graphicsTier: DEFAULT_STATE.graphicsTier }
      // #8: migrate saves with duplicate party ids / duplicate leader roles
      loaded.party = migrateParty(loaded.party ?? [])
      // Living Trail: old saves have no livingTrail slice — default it, and
      // merge in any nodes added after the save was written (never clobbers
      // recorded progress). Same migration choke point as the party fix.
      loaded.livingTrail = migrateLivingTrail(loaded.livingTrail)
      return loaded
    }

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
      // DM boss encounters (P1) can interrupt the TOWN phase; return the
      // player there instead of teleporting to the trail. Scoped to dm_boss_*
      // event ids only — every existing event fires from computeTravel while
      // traveling (travelEngine never sets previousPhase), so touching the
      // general case could resurrect a stale previousPhase. For non-DM events
      // this branch is provably identity: their ids never start with dm_boss_.
      const postEventPhase: GamePhase =
        state.currentEvent.id.startsWith('dm_boss_') && state.previousPhase === 'town'
          ? 'town'
          : 'traveling'
      // Optional event item reward (e.g. the tribe's towel on a fair trade),
      // rolled at itemRewardChance when present, otherwise guaranteed.
      const grantsEventItem = outcome.itemReward != null &&
        (outcome.itemRewardChance == null || Math.random() < outcome.itemRewardChance)
      return {
        ...state,
        inventory: grantsEventItem ? [...state.inventory, outcome.itemReward as string] : state.inventory,
        food: Math.max(0, state.food + (outcome.foodDelta || 0)),
        ammunition: Math.max(0, state.ammunition + (outcome.ammoDelta || 0)),
        medicine: Math.max(0, state.medicine + (outcome.medicineDelta || 0)),
        spareParts: Math.max(0, state.spareParts + (outcome.spareParts || 0)),
        day: state.day + (outcome.daysLost || 0),
        party: updatedParty,
        phase: postEventPhase,
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
      // Hunt yield: rand*200+50 (E≈150lb). RESTORED 2026-07-21 at Leif's explicit
      // direction after the 2026-07-20 "Grok balance fix" nerf (to *70+30) removed a
      // hard-earned player strategy. This is the owner's deliberate call — DO NOT
      // re-nerf without Leif's say-so. If karma-printing via food ever needs a guard,
      // gate it at the food->karma conversion, NOT by starving the hunt yield.
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
        // #12: hunting takes a full day (same pattern as applyRestAtInn) —
        // closes the free-food farm exploit from town Hunt spam
        day: state.day + 1,
        message: `${huntMessage} The hunt took a full day.`,
      }
    }

    // === Pan Galactic Gargle Blaster (Hitchhiker's) ===
    // "Like having your brains smashed out by a slice of lemon wrapped round a
    // large gold brick." One shot → 2-3 day hangover. A second shot DURING the
    // hangover clears today's misery but DOUBLES the next one. A third shot in the
    // same bender is a comical death (Adams × classic Oregon Trail). Consumes one
    // from inventory; escalation state is persisted on OregonTrailState.
    case 'DRINK_GARGLE_BLASTER': {
      // The bottle is not consumed — the escalation itself is the limiter. Drink
      // again while hungover at your peril; a third in one bender is fatal.
      const hungover = (state.hangoverUntilDay ?? 0) > state.day
      const shots = hungover ? (state.gargleBlasterShots ?? 0) + 1 : 1
      const baseDays = 2 + Math.floor(Math.random() * 2) // 2-3

      if (shots >= 3) {
        return {
          ...state,
          phase: 'game_over' as GamePhase,
          gargleBlasterShots: 0,
          hangoverUntilDay: state.day,
          morale: 0,
          message: 'A third Pan Galactic Gargle Blaster in one bender. Your brains, smashed out once more by a slice of lemon wrapped round a large gold brick, decline to return. You have died of enthusiasm. The wagon rolls on. Someone eats your rations and pockets your towel.',
        }
      }
      if (hungover) {
        const doubled = baseDays * 2
        return {
          ...state,
          gargleBlasterShots: shots, // 2
          hangoverUntilDay: state.day + doubled,
          morale: Math.min(100, state.morale + 25),
          message: `Another Gargle Blaster and the hangover politely steps aside — for today. But the universe keeps a tab, and it has doubled: ${doubled} days of reckoning are coming. A third would be your last.`,
        }
      }
      return {
        ...state,
        gargleBlasterShots: 1,
        hangoverUntilDay: state.day + baseDays,
        morale: Math.min(100, state.morale + 35),
        message: `You drink the Pan Galactic Gargle Blaster. For one incandescent moment you comprehend the entire universe and your place in it. Then the hangover arrives, and stays ${baseDays} days.`,
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
      // A towel is a genuinely useful crossing tool — wrap the gear, dry off, wave
      // down the ferryman. Carrying one lowers the odds of a soggy disaster.
      const hasTowel = state.inventory.includes('towel')
      const crossingRisk = hasTowel ? crossOutcome.damageProbability * 0.6 : crossOutcome.damageProbability
      const tookDamage = Math.random() < crossingRisk
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
    case 'OPEN_WITNESS_DIALOGUE': return applyOpenWitnessDialogue(state, action.witnessType, action.npcId)
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

    // === Living Trail (presence-gated real-world chains) ===
    case 'ENTER_LIVING_TRAIL': return applyEnterLivingTrail(state)
    case 'COMPLETE_LT_NODE': return applyCompleteLivingTrailNode(state, action.nodeId, action.verifiedPresence)

    // === Posse system ===
    case 'HIRE_POSSE_MEMBER': return applyHirePosseMember(state, action.member)
    case 'DISMISS_POSSE_MEMBER': return applyDismissPosseMember(state, action.memberId)

    // === Trail guide (#11) — persisted so the guide survives reload ===
    case 'HIRE_GUIDE':
      return { ...state, hiredGuideId: action.guideId, guideRemainingLandmarks: action.duration }

    // === DM directive channel (DM Layer P1) ===
    case 'APPLY_DM_DIRECTIVE': return applyDmDirectiveState(state, action.directive)

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
