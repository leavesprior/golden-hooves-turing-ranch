/** One local, recoverable teamster order. Payment lives in the existing wallet. */
import type { OregonTrailState } from './types'

export const TEAMSTER_COST = 20
export interface TeamsterHire { version: 1; id: string; cost: typeof TEAMSTER_COST }
export type TeamsterHireResult = { ok: true } | { ok: false; reason: 'invalid' | 'busy' | 'funds' | 'storage' | 'conflict' }

export function readTeamsterHire(value: unknown): TeamsterHire | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  if (raw.version !== 1 || raw.cost !== TEAMSTER_COST || typeof raw.id !== 'string'
    || !/^teamster_[A-Za-z0-9][A-Za-z0-9._:-]{0,118}$/.test(raw.id)) return undefined
  return { version: 1, id: raw.id, cost: TEAMSTER_COST }
}

export function canHireTeamster(state: Partial<OregonTrailState>): boolean {
  return state.phase === 'event' && canRetainTeamsterHire(state)
}

/** My Farm is a supported round-trip overlay over the unresolved event. Keep
 * its pending order on load, but never grant a yoke while the overlay is open. */
export function canRetainTeamsterHire(state: Partial<OregonTrailState>): boolean {
  const returnsToEvent = state.phase === 'event'
    || (state.phase === 'ranch_management' && state.previousPhase === 'event')
  return returnsToEvent && state.currentEvent?.id === 'no_oxen'
    && typeof state.oxen === 'number' && state.oxen < 1 && !state.wagonAbandoned
}

/** Slot loading must not replace a newer paid wallet with its pre-payment balance. */
export function hasPaidPendingTeamster(state: Partial<OregonTrailState> | undefined,
  hasReceipt: (id: string, amount: number) => boolean): boolean {
  const order = readTeamsterHire(state?.teamsterHire)
  return !!state && canRetainTeamsterHire(state) && !!order && hasReceipt(order.id, order.cost)
}
