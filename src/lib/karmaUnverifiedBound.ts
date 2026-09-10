/** Play-path max |delta| on /api/karma/event without a Leif-collapsed QSD envelope.
 * Not a client flag. Convert still does not use /api/karma/event; it uses the same
 * |delta| so 🍪→🌮 cannot print past the play bound. */
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

/** 2🍪 → 1🌮. Null when the spend or the taco mint would pass the play bound. */
export function convertGoodToTacos(goodAmount: number): number | null {
  if (!Number.isInteger(goodAmount) || goodAmount < 2) return null
  if (!withinUnverifiedBound(goodAmount)) return null
  const tacos = Math.floor(goodAmount / 2)
  if (tacos <= 0 || !withinUnverifiedBound(tacos)) return null
  return tacos
}
