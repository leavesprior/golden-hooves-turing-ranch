/**
 * S.A.D.D.L.E. point allocation — one rule, evaluated against current state.
 *
 * THE DEFECT THIS REPLACES
 * `pointsRemaining` used to be React state held ALONGSIDE `statPoints`, and
 * `adjustStat` guarded on it by reading the closure:
 *
 *     if (delta > 0 && pointsRemaining <= 0) return   // stale within a batch
 *     setPointsRemaining(prev => prev - delta)        // batch-safe write
 *
 * The write was batch-safe, the guard was not. Every click inside one React
 * batch tested the same pre-batch value, all passed, and each then applied
 * `prev - delta`. A playtest drove the pool to -24 by clicking `+` quickly;
 * a player reaches the same place with key-repeat, a double-tap, or one janky
 * frame on a phone. Once negative, every `+` disabled itself on the stat cap,
 * the submit button relabelled from "Assign N more points" to "Begin the Hunt"
 * while staying disabled, and nothing on screen said why. A soft-lock behind a
 * button that looks ready.
 *
 * THE SHAPE OF THE FIX
 * Two states that must agree can disagree. So there is now ONE state — the stat
 * block — and the remaining pool is DERIVED from it:
 *
 *     remaining = pool - (sum(stats) - sum(base))
 *
 * A derived value cannot drift from its source, so "pool disagrees with stats"
 * stops being a bug you can write and becomes a sentence you cannot say. Every
 * guard below runs inside the functional updater, against `prev`, so a hundred
 * clicks in one batch fold correctly instead of racing.
 *
 * Same law as scripts/check-transform-clobber.mjs: prefer making the defect
 * unrepresentable over detecting it after the fact.
 */

export type StatKey =
  | 'Shrewdness' | 'Agility' | 'Durability' | 'Diplomacy' | 'Luck' | 'Expertise'

export type StatBlock = Record<StatKey, number>

export const STAT_KEYS: StatKey[] = [
  'Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise',
]

/** Ceiling per stat, as in classic D&D. */
export const MAX_STAT = 18

/** Floor when allocating by hand — you may dump a stat to 1 to fund another. */
export const POINT_BUY_FLOOR = 1

/** Pool when allocating by hand. */
export const POOL_POINT_BUY = 12

/** Pool after rolling 3d6 — fewer, because the dice already paid you. */
export const POOL_ROLLED = 6

export function poolFor(hasRolled: boolean): number {
  return hasRolled ? POOL_ROLLED : POOL_POINT_BUY
}

/**
 * Lowest legal value for a stat. After a roll the dice are the floor — you keep
 * what you rolled. Before a roll you may dump to 1 and spend the difference.
 */
export function floorFor(stat: StatKey, base: StatBlock, hasRolled: boolean): number {
  return hasRolled ? base[stat] : POINT_BUY_FLOOR
}

function total(block: StatBlock): number {
  return STAT_KEYS.reduce((sum, k) => sum + block[k], 0)
}

/** Points committed above the baseline. Negative when stats were dumped. */
export function spent(stats: StatBlock, base: StatBlock): number {
  return total(stats) - total(base)
}

/**
 * Points still available. DERIVED — never stored, so it cannot contradict the
 * stat block it describes. Dumping a stat below base raises this above the pool,
 * which is the intended point-buy trade.
 */
export function pointsRemaining(stats: StatBlock, base: StatBlock, hasRolled: boolean): number {
  return poolFor(hasRolled) - spent(stats, base)
}

/**
 * Apply one +1/-1 to a stat, or refuse.
 *
 * Returns the SAME object reference when the move is illegal, so React bails out
 * of the re-render and a rejected click costs nothing. Call this inside
 * `setStatPoints(prev => ...)` and never against a closure value.
 */
export function applyAdjustment(
  prev: StatBlock,
  base: StatBlock,
  hasRolled: boolean,
  stat: StatKey,
  delta: number,
): StatBlock {
  if (delta === 0) return prev

  const next = prev[stat] + delta
  if (next > MAX_STAT) return prev
  if (next < floorFor(stat, base, hasRolled)) return prev

  // The pool check must consider the block AFTER this move, computed from `prev`
  // rather than from a captured render. This is the line the old code got wrong.
  const candidate: StatBlock = { ...prev, [stat]: next }
  if (pointsRemaining(candidate, base, hasRolled) < 0) return prev

  return candidate
}

/** Allocation is complete when every point is spent and nothing is overspent. */
export function isAllocationComplete(
  stats: StatBlock,
  base: StatBlock,
  hasRolled: boolean,
): boolean {
  return pointsRemaining(stats, base, hasRolled) === 0
}

/**
 * Label for the submit control. The old ternary sent every non-positive value —
 * including negatives — to "Begin the Hunt", which is what made the soft-lock
 * silent. Overspend is now unreachable, but the branch is kept and named so a
 * future regression announces itself instead of hiding.
 */
export function allocationLabel(remaining: number, hasBackground: boolean): string {
  if (!hasBackground) return 'Select a background'
  if (remaining > 0) return `Assign ${remaining} more points`
  if (remaining < 0) return `Remove ${Math.abs(remaining)} points`
  return 'Begin the Hunt'
}
