// ============================================
// PERIL ENGINE (pure — no side effects, no RNG)
// ============================================
// A survivable illness/injury/death model for the Prospector's Tale, in the
// Oregon-Trail spirit: reckless travel can get you bitten, feverish, or hurt;
// conditions worsen if ignored and can eventually kill; medicine + rest (spent
// in the existing 7-day camp loop) reliably recover you. Tuned so a careful
// player almost never dies, but a heedless one can — and on death the story
// continues through a SUCCESSOR (the Legacy theme), not a hard game-over.
//
// PURE: this module never rolls dice. WHETHER a peril strikes is decided by the
// caller (travel-encounter roll); this engine only resolves the consequences so
// it can be unit-tested deterministically. RNG lives at the call site.
//
// FLAG-GATED at the wiring layer (NEXT_PUBLIC_PERIL) — the engine + tests can
// land and be verified without forcing the mechanic live before it's tuned.

export type ConditionId = 'snakebite' | 'fever' | 'dysentery' | 'injury' | 'exhaustion'

// 1 = mild (a nuisance), 2 = serious (needs treating soon), 3 = grave (urgent).
export type Severity = 1 | 2 | 3

export interface Condition {
  id: ConditionId
  severity: Severity
}

export interface PerilState {
  vitality: number
  maxVitality: number
  conditions: Condition[]
  alive: boolean
}

// Mitigations derived from the character's advantages/flaws (see advantages.ts:
// "Immune to disease events", "Warning before ambush encounters", Trail Hardened).
export interface PerilMitigations {
  immuneToDisease?: boolean   // Iron Constitution — fever/dysentery cannot take hold
  trailHardened?: boolean     // travel-class perils land one severity lighter
  extraRest?: boolean         // skill-tree "Rest restores extra health"
}

export interface PerilConfig {
  baseMaxVitality: number        // vitality ceiling at Durability 8
  vitalityPerDurability: number  // +/- ceiling per Durability point away from 8
  drainPerSeverityPerTick: number// vitality lost, per severity, each untreated travel/day tick
  restVitalityPerDay: number     // vitality regained per camp day rested
  extraRestBonus: number         // additional per-day regen with the extraRest mitigation
  medicineSeverityReduction: number // severity levels a single dose of medicine removes
  // Legacy carried to a successor on death (fractions of the deceased's totals).
  successorGoldFraction: number
  successorReputationFraction: number
}

// Survivable-not-brutal defaults. A single SERIOUS (sev 2) condition drains
// 12 vitality/tick → ~8 untreated ticks from full before death: ample time to
// reach camp. One dose of medicine cures a serious condition; a couple of rest
// days refill vitality. Death requires actively ignoring conditions AND skipping
// recovery. All lethality lives here — tune in ONE place.
export const DEFAULT_PERIL_CONFIG: PerilConfig = {
  baseMaxVitality: 100,
  vitalityPerDurability: 10,
  drainPerSeverityPerTick: 6,
  restVitalityPerDay: 25,
  extraRestBonus: 10,
  medicineSeverityReduction: 2,
  successorGoldFraction: 0.5,
  successorReputationFraction: 0.25,
}

const clampSeverity = (n: number): Severity => (n < 1 ? 1 : n > 3 ? 3 : (n as Severity))

/** Vitality ceiling for a given Durability stat. Never below a floor of 20. */
export function maxVitalityForDurability(durability: number, cfg: PerilConfig = DEFAULT_PERIL_CONFIG): number {
  return Math.max(20, cfg.baseMaxVitality + (durability - 8) * cfg.vitalityPerDurability)
}

/** Fresh peril state at full health for a character of the given Durability. */
export function initPeril(durability: number, cfg: PerilConfig = DEFAULT_PERIL_CONFIG): PerilState {
  const max = maxVitalityForDurability(durability, cfg)
  return { vitality: max, maxVitality: max, conditions: [], alive: true }
}

const DISEASE: ReadonlySet<ConditionId> = new Set<ConditionId>(['fever', 'dysentery'])
const TRAVEL_CLASS: ReadonlySet<ConditionId> = new Set<ConditionId>(['snakebite', 'injury', 'fever', 'dysentery'])

/**
 * Inflict a condition, honoring mitigations. Disease is fully negated by
 * immunity; travel-class perils land one severity lighter for the trail-hardened.
 * Stacking the same condition takes the WORSE severity rather than duplicating.
 * Returns a new state (never mutates).
 */
export function inflict(
  state: PerilState,
  id: ConditionId,
  severity: Severity,
  mit: PerilMitigations = {},
  cfg: PerilConfig = DEFAULT_PERIL_CONFIG,
): PerilState {
  if (!state.alive) return state
  if (mit.immuneToDisease && DISEASE.has(id)) return state

  let sev = severity
  if (mit.trailHardened && TRAVEL_CLASS.has(id)) {
    const reduced = sev - 1
    if (reduced < 1) return state // shrugged off entirely
    sev = clampSeverity(reduced)
  }

  const existing = state.conditions.find(c => c.id === id)
  const conditions = existing
    ? state.conditions.map(c => (c.id === id ? { ...c, severity: clampSeverity(Math.max(c.severity, sev)) } : c))
    : [...state.conditions, { id, severity: sev }]
  return { ...state, conditions }
}

/**
 * Advance one travel/day tick: every untreated condition drains vitality by its
 * severity. Death (alive=false, vitality clamped to 0) only if vitality reaches
 * 0 — i.e. conditions were left untended across enough ticks. Pure.
 */
export function tick(state: PerilState, cfg: PerilConfig = DEFAULT_PERIL_CONFIG): PerilState {
  if (!state.alive) return state
  const drain = state.conditions.reduce((sum, c) => sum + c.severity * cfg.drainPerSeverityPerTick, 0)
  const vitality = state.vitality - drain
  if (vitality <= 0) return { ...state, vitality: 0, alive: false }
  return { ...state, vitality }
}

/**
 * Treat one condition with medicine: reduce its severity; remove it at 0. No-op
 * if the condition isn't present. Pure.
 */
export function treatWithMedicine(
  state: PerilState,
  id: ConditionId,
  cfg: PerilConfig = DEFAULT_PERIL_CONFIG,
): PerilState {
  if (!state.alive) return state
  const target = state.conditions.find(c => c.id === id)
  if (!target) return state
  const nextSeverity = target.severity - cfg.medicineSeverityReduction
  const conditions = nextSeverity <= 0
    ? state.conditions.filter(c => c.id !== id)
    : state.conditions.map(c => (c.id === id ? { ...c, severity: clampSeverity(nextSeverity) } : c))
  return { ...state, conditions }
}

/**
 * Spend camp days resting: regain vitality (capped at max) and let time heal —
 * each day eases the single most-severe condition by one level, clearing it at 0.
 * This is the "medicine + time" recovery Leif described, hosted in the 7-day
 * camp loop. Pure.
 */
export function rest(
  state: PerilState,
  days: number,
  mit: PerilMitigations = {},
  cfg: PerilConfig = DEFAULT_PERIL_CONFIG,
): PerilState {
  if (!state.alive || days <= 0) return state
  const perDay = cfg.restVitalityPerDay + (mit.extraRest ? cfg.extraRestBonus : 0)
  let vitality = Math.min(state.maxVitality, state.vitality + perDay * days)
  let conditions = state.conditions.map(c => ({ ...c }))
  for (let d = 0; d < days && conditions.length > 0; d++) {
    // Ease the worst condition each day (time heals the body). Decrement raw —
    // NOT via clampSeverity, which would floor a mild condition at 1 and never
    // let it clear — then drop anything that has reached 0.
    conditions.sort((a, b) => b.severity - a.severity)
    conditions[0].severity = (conditions[0].severity - 1) as Severity
    conditions = conditions.filter(c => c.severity > 0)
  }
  return { ...state, vitality, conditions }
}

export function isDead(state: PerilState): boolean {
  return !state.alive
}

/** Human-readable label for a condition + severity (UI/narrator convenience). */
export function describeCondition(c: Condition): string {
  const sev = c.severity === 1 ? 'mild' : c.severity === 2 ? 'serious' : 'grave'
  const name: Record<ConditionId, string> = {
    snakebite: 'snakebite', fever: 'trail fever', dysentery: 'dysentery',
    injury: 'injury', exhaustion: 'exhaustion',
  }
  return `${sev} ${name[c.id]}`
}

export interface SuccessorLegacy {
  inheritedGold: number
  reputationFraction: number
  // A keepsake trait tag the heir carries — narrative continuity with the fallen.
  heirloomTrait: string
}

/**
 * What a successor inherits when the current character dies. The heir takes up
 * the trail with a fraction of the estate — enough that death costs progress
 * without erasing it (Legacy theme). Pure.
 */
export function successorLegacy(
  deceasedName: string,
  deceasedGold: number,
  cfg: PerilConfig = DEFAULT_PERIL_CONFIG,
): SuccessorLegacy {
  return {
    inheritedGold: Math.max(0, Math.floor(deceasedGold * cfg.successorGoldFraction)),
    reputationFraction: cfg.successorReputationFraction,
    heirloomTrait: `heir_of_${deceasedName.trim().toLowerCase().replace(/\s+/g, '_') || 'the_fallen'}`,
  }
}
