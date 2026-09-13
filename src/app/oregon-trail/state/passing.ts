import type { OregonTrailState, PartyMember } from './types'

/** A record of an already-resolved ending, never a damage/death resolver. */
export interface PassingRecord {
  kind: 'town' | 'river' | 'trail' | 'unknown'
  place: string
  cause: string
  fallenName: string
  day?: number
  miles?: number
}

export function hasNewPartyDeath(before: PartyMember[], after: PartyMember[]): boolean {
  return !after.some(member => member.health > 0)
    && before.some(member => member.health > 0
      && after.some(updated => updated.id === member.id && updated.health <= 0))
}

function sourceKind(state: OregonTrailState): PassingRecord['kind'] {
  if (state.phase === 'town') return 'town'
  if (state.phase === 'river') return 'river'
  if (state.phase === 'traveling') return 'trail'
  if (state.phase === 'event') {
    // Only this event producer records a trustworthy interrupted town phase.
    return state.currentEvent?.id.startsWith('dm_boss_') && state.previousPhase === 'town' ? 'town' : 'trail'
  }
  return 'unknown'
}

export function createPassingRecord(source: OregonTrailState, ended: OregonTrailState, knownSource = true): PassingRecord {
  const newlyFallen = source.party.filter(member => member.health > 0
    && ended.party.some(updated => updated.id === member.id && updated.health <= 0))
  const fallen = newlyFallen.find(member => member.role === 'leader') ?? newlyFallen[0]
  return {
    kind: knownSource ? sourceKind(source) : 'unknown',
    place: source.currentLandmark || 'Place not recorded',
    cause: knownSource ? ended.message || 'This chapter has ended.' : 'The circumstances of this passing were not recorded.',
    fallenName: fallen?.name || source.wagonLeader || source.party.find(member => member.role === 'leader')?.name || 'the traveler',
    day: ended.day,
    miles: ended.totalMilesTraveled,
  }
}

export function readPassingRecord(value: unknown): PassingRecord | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (!['town', 'river', 'trail', 'unknown'].includes(record.kind as string)
    || typeof record.place !== 'string' || typeof record.cause !== 'string' || typeof record.fallenName !== 'string') return undefined
  return {
    kind: record.kind as PassingRecord['kind'], place: record.place, cause: record.cause, fallenName: record.fallenName,
    ...(typeof record.day === 'number' && Number.isFinite(record.day) && record.day >= 0 ? { day: record.day } : {}),
    ...(typeof record.miles === 'number' && Number.isFinite(record.miles) && record.miles >= 0 ? { miles: record.miles } : {}),
  }
}

/** Old terminal saves cannot establish where a death occurred from the last
 * landmark alone. Keep their prose, but identify their location kind as unknown. */
export function passingForState(state: OregonTrailState): PassingRecord {
  return readPassingRecord(state.passing) ?? {
    kind: 'unknown', place: state.currentLandmark || 'Place not recorded',
    cause: state.message || 'The circumstances of this passing were not recorded.',
    fallenName: state.wagonLeader || state.party.find(member => member.role === 'leader')?.name || 'the traveler',
    day: state.day, miles: state.totalMilesTraveled,
  }
}
