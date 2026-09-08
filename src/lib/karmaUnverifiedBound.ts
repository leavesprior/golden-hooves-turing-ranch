/** Play-path max |delta| on /api/karma/event without a Leif-collapsed QSD envelope.
 * Not a client flag. Convert / send-to-person stay off this route. */
export const UNVERIFIED_MAX_ABS_DELTA = 1000

/** Catalog prices above the play bound. Exact abs deltas only — not a range. */
export const CATALOG_ABS_DELTAS: readonly number[] = [1200, 2000, 3000]

export function withinUnverifiedBound(amount: number): boolean {
  return Number.isFinite(amount) && Math.abs(amount) <= UNVERIFIED_MAX_ABS_DELTA
}

export function allowedLedgerDelta(amount: number): boolean {
  if (!Number.isFinite(amount)) return false
  const abs = Math.abs(amount)
  if (abs <= UNVERIFIED_MAX_ABS_DELTA) return true
  return CATALOG_ABS_DELTAS.includes(abs)
}
