/**
 * Difficulty tier system — Golden Frog Codex Phase 1.
 *
 * Three tiers surface as a persistently-visible dial (Story / Explorer /
 * Challenger). The tier shifts skill-check DCs by a multiplier and, via
 * the skill-check preview, lets players see their odds before committing
 * so a check is never a blind trap.
 *
 * HARD RULE: never make the player feel stupid. Difficulty is adjustable
 * at any time with zero penalty. Previews are mandatory on every stat-gated
 * button.
 *
 * Roll formula (oregon-trail characterContext.rollSkillCheck):
 *   total = d20 + stat
 *   success iff total >= difficulty
 *
 * So P(success | stat, dc) = clamp((21 - (dc - stat)) / 20, 0.05, 0.95).
 * (0.05 floor = nat-1 crit-fail; 0.95 ceiling = nat-20 always lands.)
 */

export type GameDifficulty = 'story' | 'explorer' | 'challenger'

export const DIFFICULTY_STORAGE_KEY = 'adventure_difficulty'
export const DIFFICULTY_DEFAULT: GameDifficulty = 'explorer'

export const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  story: 'Story',
  explorer: 'Explorer',
  challenger: 'Challenger',
}

export const DIFFICULTY_TOOLTIPS: Record<GameDifficulty, string> = {
  story: 'Checks are forgiving. Your goal is the story.',
  explorer: 'Balanced. See your odds before rolling. (Default)',
  challenger: 'Checks are harder. Trust your gut — odds shown only as tier.',
}

/**
 * DC multiplier per tier.
 * Story makes checks 20% easier; Challenger makes them 20% harder.
 */
export function getDCMultiplier(difficulty: GameDifficulty): number {
  switch (difficulty) {
    case 'story':
      return 0.8
    case 'challenger':
      return 1.2
    case 'explorer':
    default:
      return 1.0
  }
}

/**
 * Apply the difficulty multiplier to a raw DC.
 * Rounded to the nearest integer; floored at 1 so a check is never trivialized
 * to "always succeed" past the nat-1 floor.
 */
export function applyDifficultyToDC(baseDC: number, difficulty: GameDifficulty): number {
  const multiplier = getDCMultiplier(difficulty)
  const scaled = Math.round(baseDC * multiplier)
  return Math.max(1, scaled)
}

/**
 * Exact success probability for a d20+stat >= dc check.
 * Returns integer percentage [5, 95].
 */
export function computeSuccessPct(stat: number, effectiveDC: number): number {
  // total = roll + stat; success if roll >= dc - stat
  const needed = effectiveDC - stat
  // roll in [1, 20]: favorable rolls = 21 - needed, clamped to [1, 19]
  // (nat 1 always fails, nat 20 always succeeds.)
  const favorable = Math.max(1, Math.min(19, 21 - needed))
  const pct = (favorable / 20) * 100
  return Math.round(pct)
}

/**
 * Compute the full preview payload for a stat-gated choice: the effective
 * DC after difficulty, the probability, and a tone bucket for colouring.
 */
export interface SkillCheckPreview {
  effectiveDC: number
  successPct: number
  tone: 'green' | 'yellow' | 'red'
}

export function getSkillCheckPreview(
  stat: number,
  baseDC: number,
  difficulty: GameDifficulty,
): SkillCheckPreview {
  const effectiveDC = applyDifficultyToDC(baseDC, difficulty)
  const successPct = computeSuccessPct(stat, effectiveDC)
  const tone: SkillCheckPreview['tone'] =
    successPct >= 70 ? 'green' : successPct >= 40 ? 'yellow' : 'red'
  return { effectiveDC, successPct, tone }
}

/**
 * localStorage I/O. Safe on SSR.
 */
export function loadDifficulty(): GameDifficulty {
  if (typeof window === 'undefined') return DIFFICULTY_DEFAULT
  try {
    const raw = window.localStorage.getItem(DIFFICULTY_STORAGE_KEY)
    if (raw === 'story' || raw === 'explorer' || raw === 'challenger') return raw
  } catch {
    /* ignore */
  }
  return DIFFICULTY_DEFAULT
}

export function saveDifficulty(difficulty: GameDifficulty): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficulty)
  } catch {
    /* ignore */
  }
}

export const DIFFICULTY_TIERS: GameDifficulty[] = ['story', 'explorer', 'challenger']

// ============================================================================
// Phase 3 — Travel-preview transparency by difficulty tier.
// ============================================================================
// The whole point of the three-tier system is to give Story/Explorer players
// more foresight into what they're walking into. Challenger keeps mystery.
//
// Story      → tier + % + full encounter list (generous)
// Explorer   → tier + %                        (balanced)
// Challenger → tier only                       (veterans get minimal preview)

import type { EdgeDangerInfo, DangerTier } from './travelDanger'

export interface DifficultyTravelPreview {
  /** Always shown — the colour-coded danger tier. */
  tier: DangerTier
  /** Story+Explorer only. Null on Challenger. */
  chancePct: number | null
  /** Story only. Empty array on Explorer/Challenger. */
  possibleEncounters: string[]
  /** Story only. Empty array on Explorer/Challenger. */
  possibleConfrontations: string[]
}

export function getDifficultyTravelPreview(
  difficulty: GameDifficulty,
  edge: EdgeDangerInfo,
): DifficultyTravelPreview {
  switch (difficulty) {
    case 'story':
      return {
        tier: edge.tier,
        chancePct: edge.chancePct,
        possibleEncounters: edge.possibleEncounters,
        possibleConfrontations: edge.possibleConfrontations,
      }
    case 'explorer':
      return {
        tier: edge.tier,
        chancePct: edge.chancePct,
        possibleEncounters: [],
        possibleConfrontations: [],
      }
    case 'challenger':
      return {
        tier: edge.tier,
        chancePct: null,
        possibleEncounters: [],
        possibleConfrontations: [],
      }
  }
}

// ============================================================================
// Phase 5 — Shining-Force-style attack preview.
// ============================================================================
// Confrontation attack rolls use a *different* formula from skill checks:
//
//   hit iff d20 + (attackerStat - 10) / 2 + weaponBonus >= targetAC
//
// So we need a parallel preview helper. Design intent matches
// `getSkillCheckPreview`: always show the player their odds before they
// commit; never let an attack feel like a blind coin-flip.
//
// Difficulty-aware UI rule (rendered by the preview chip):
//   Story/Explorer → exact AC + success%
//   Challenger     → tier only ("Tough / Avg / Weak"), no numbers
//
// AC-tier bucketing is intentionally coarse. The numbers here were picked
// after skimming the chapter-1 → chapter-5 enemies in confrontationEnemies.ts:
// AC <= 11 reads "Weak", 12-13 "Avg", 14+ "Tough". If enemies creep higher
// in later chapters tune `TOUGH_AC_THRESHOLD`.

export interface AttackPreview {
  /** d20+mod+weapon threshold for a hit. Numeric only on Story/Explorer. */
  effectiveAC: number | null
  /** Probability of hitting, as an integer percentage, 5..95. */
  successPct: number
  /** Coarse tier for Challenger, which hides AC numbers. */
  tier: 'weak' | 'average' | 'tough'
  /** Green >= 70, yellow 40-69, red < 40 — same buckets as skill-check tone. */
  tone: 'green' | 'yellow' | 'red'
}

const WEAK_AC_CEILING = 11
const TOUGH_AC_THRESHOLD = 14

/**
 * Compute attack-hit probability.
 *
 * Stat is the raw SADDLE stat value (e.g. Agility=14 → mod=+2). Weapon
 * bonus defaults to 0 to match current ConfrontationView (no weapon system
 * yet; add when weapons land).
 */
export function getAttackPreview(
  attackerStat: number,
  weaponBonus: number,
  targetAC: number,
  difficulty: GameDifficulty,
): AttackPreview {
  const statMod = Math.floor((attackerStat - 10) / 2)
  // Using the spec formula: needed = targetAC - statMod - weaponBonus
  // favorable rolls on d20 in [2..19] = 21 - needed, clamped [1, 19] so
  // nat-1 always misses and nat-20 always hits.
  const needed = targetAC - statMod - weaponBonus
  const favorable = Math.max(1, Math.min(19, 21 - needed))
  const successPct = Math.round((favorable / 20) * 100)
  const tier: AttackPreview['tier'] =
    targetAC <= WEAK_AC_CEILING
      ? 'weak'
      : targetAC >= TOUGH_AC_THRESHOLD
        ? 'tough'
        : 'average'
  const tone: AttackPreview['tone'] =
    successPct >= 70 ? 'green' : successPct >= 40 ? 'yellow' : 'red'
  return {
    effectiveAC: difficulty === 'challenger' ? null : targetAC,
    successPct,
    tier,
    tone,
  }
}
