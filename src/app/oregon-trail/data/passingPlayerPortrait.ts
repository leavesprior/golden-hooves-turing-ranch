import type { Character } from '../characterContext'
import type { OregonTrailState } from '../state/types'
import { readPassingRecord } from '../state/passing'

export interface PassingPlayerPortrait {
  placement: 'memorial' | 'legacy'
  name: string
  background: Character['background']
}

/**
 * The passing save records a name, not a portrait or stable fallen-person ID.
 * Only a unique dead leader matching both the record and saved player can
 * supply the memorial face. Otherwise show the verified family owner separately.
 * A mismatched/stale character save supplies no face at all.
 */
export function getPassingPlayerPortrait(
  state: Pick<OregonTrailState, 'passing' | 'party' | 'wagonLeader'>,
  character: Pick<Character, 'name' | 'background'> | null,
): PassingPlayerPortrait | undefined {
  // Same fallback as PassingScreen's existing legacy owner, without inferring a companion appearance.
  const fallbackName = state.wagonLeader || state.party.find(member => member.role === 'leader')?.name || 'the traveler'
  const recorded = readPassingRecord(state.passing)
  const legacyOwner = state.wagonLeader || recorded?.fallenName || fallbackName
  if (!character?.name.trim() || character.name !== legacyOwner) return undefined

  const namedMembers = state.party.filter(member => member.name === character.name)
  const memorial = recorded?.fallenName === character.name
    && namedMembers.length === 1
    && namedMembers[0].role === 'leader'
    && namedMembers[0].health <= 0
  return {
    placement: memorial ? 'memorial' : 'legacy',
    name: character.name,
    background: character.background,
  }
}
