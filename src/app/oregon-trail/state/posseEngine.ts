/**
 * Posse engine — pure state transforms for hiring/dismissing posse members.
 */

import type { OregonTrailState, PartyMember } from './types'
import {
  calculatePartyBonuses,
  getActiveCompositionBonuses,
  type PosseMember,
} from '../data/posseSystem'

export function applyHirePosseMember(prev: OregonTrailState, member: PosseMember): OregonTrailState {
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
}

export function applyDismissPosseMember(prev: OregonTrailState, memberId: string): OregonTrailState {
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
}
