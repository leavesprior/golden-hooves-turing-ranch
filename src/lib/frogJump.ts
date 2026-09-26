// Frog jump microgame (2026-09-23, Angels Camp slice).
//
// One button. A power needle sweeps 0 → 100 → 0 on a steady triangle wave; the
// player presses once to launch. The sweet band is just below the top — press at
// 100 and the frog over-jumps and lands in a belly-flop. Pure + deterministic
// (the only input is when you pressed), so it tests without a browser.
//
// Replaces nothing in the reward table: the honest-contest choice pays what it
// always paid. The jump only decides the story you are told.

export const FROG_CYCLE_MS = 1600
export const FROG_SWEET_MIN = 78
export const FROG_SWEET_MAX = 94
/** Distance in feet the frog must beat to take the pot. */
export const FROG_WIN_FEET = 12

/** Needle position (0-100) at elapsed ms since the needle started. */
export function frogPowerAt(elapsedMs: number, cycleMs: number = FROG_CYCLE_MS): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0
  const t = (elapsedMs % cycleMs) / cycleMs // 0..1
  const tri = t < 0.5 ? t * 2 : 2 - t * 2 // 0..1..0
  return Math.round(tri * 100)
}

export type FrogJumpOutcome = {
  power: number
  feet: number
  won: boolean
  kind: 'sweet' | 'short' | 'belly_flop'
  line: string
}

/** Feet jumped for a given power. Rises to the sweet band, collapses past it. */
export function frogFeetFor(power: number): number {
  const p = Math.max(0, Math.min(100, power))
  if (p > FROG_SWEET_MAX) return 5 // over-cranked: flop
  if (p >= FROG_SWEET_MIN) return 13 + Math.round(((p - FROG_SWEET_MIN) / (FROG_SWEET_MAX - FROG_SWEET_MIN)) * 4) // 13..17
  return Math.round((p / FROG_SWEET_MIN) * 11) // 0..11
}

export function frogJumpOutcome(power: number): FrogJumpOutcome {
  const p = Math.max(0, Math.min(100, Math.round(power)))
  const feet = frogFeetFor(p)
  const won = feet >= FROG_WIN_FEET
  if (p > FROG_SWEET_MAX) {
    return { power: p, feet, won, kind: 'belly_flop', line: `Too much shove. Your frog sails up, lands flat on its belly, and ${feet} feet is all the chalk will give you. The bar howls.` }
  }
  if (p >= FROG_SWEET_MIN) {
    return { power: p, feet, won, kind: 'sweet', line: `A clean launch — ${feet} feet, clear past the chalk. Nobody checks your frog for buckshot. Nobody needs to.` }
  }
  return { power: p, feet, won, kind: 'short', line: `Your frog considers the matter and hops ${feet} feet, which is honest if not much. The pot goes elsewhere; the bar respects a fair loser.` }
}

/**
 * The quest-outcome text after a played jump. A WIN tells only the jump; the
 * choice's "win or lose" consolation line belongs to a loss or a flop.
 */
export function frogOutcomeConsequence(outcome: FrogJumpOutcome, choiceConsequence?: string): string {
  if (outcome.won) return outcome.line
  return `${outcome.line} ${choiceConsequence ?? ''}`.trim()
}
