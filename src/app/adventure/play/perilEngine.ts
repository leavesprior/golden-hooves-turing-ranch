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
  // "Bleeding out" — the graded dying window between hurt and dead (3.5's dying
  // state: 0 HP is not −10 HP). While dying the character is still `alive` but
  // unconscious and losing a small reserve each tick; a field-medicine check
  // (stabilize) or rest/medicine can pull them back before the reserve runs out.
  dying: boolean
  // Remaining "bleed out" buffer while dying (mirrors the −1..−9 window before
  // −10 = dead). Only meaningful when `dying` is true; 0 otherwise.
  dyingReserve: number
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
  // --- Graded dying / stabilization window (3.5's dying-then-stabilize model) ---
  dyingReserve: number           // "bleed out" buffer when vitality first hits 0 (like the −1..−9 window)
  dyingBleedPerTick: number      // reserve lost each tick while dying and unstabilized
  stabilizeVitalityRestore: number // vitality a successful field-medicine check pulls you back to
  // Legacy carried to a successor on death (fractions of the deceased's totals).
  successorGoldFraction: number
  successorReputationFraction: number
}

// Survivable-not-brutal defaults ("Soft" mode — the default, tuned for casual
// players / vacation-rental guests). A single SERIOUS (sev 2) condition drains
// 12 vitality/tick → ~8 untreated ticks from full before you even reach the
// brink: ample time to reach camp. Reaching 0 does NOT kill outright — it opens
// a dying window (dyingReserve/dyingBleedPerTick ≈ 3 more ticks) during which a
// field-medicine check, medicine, or rest can save you. One dose of medicine
// cures a serious condition; a couple of rest days refill vitality. Death
// requires ignoring conditions, failing the stabilize, AND skipping recovery.
// All lethality lives here — tune in ONE place.
export const DEFAULT_PERIL_CONFIG: PerilConfig = {
  baseMaxVitality: 100,
  vitalityPerDurability: 10,
  drainPerSeverityPerTick: 6,
  restVitalityPerDay: 25,
  extraRestBonus: 10,
  medicineSeverityReduction: 2,
  dyingReserve: 12,
  dyingBleedPerTick: 4,
  stabilizeVitalityRestore: 15,
  successorGoldFraction: 0.5,
  successorReputationFraction: 0.25,
}

// "Classic" mode — for nostalgic players who want the brutal Oregon-Trail / lethal
// 3.5 feel. Faster drain, weaker medicine (a dose only knocks a condition one level,
// never a full clear), slower rest, and a razor-thin dying window that bleeds out in
// ~1 tick. Same mechanics, spicier numbers — expose as a difficulty toggle at
// character creation. Death is a real threat here; the heir/Legacy loop is the
// safety net, not the stabilize check.
export const CLASSIC_PERIL_CONFIG: PerilConfig = {
  baseMaxVitality: 100,
  vitalityPerDurability: 10,
  drainPerSeverityPerTick: 9,
  restVitalityPerDay: 18,
  extraRestBonus: 8,
  medicineSeverityReduction: 1,
  dyingReserve: 6,
  dyingBleedPerTick: 6,
  stabilizeVitalityRestore: 8,
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
  return { vitality: max, maxVitality: max, conditions: [], alive: true, dying: false, dyingReserve: 0 }
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
 * Advance one travel/day tick.
 *
 * Healthy → hurt: every untreated condition drains vitality by its severity.
 * Hurt → dying: when vitality first reaches 0 the character does NOT die — they
 *   enter the dying/"bleeding out" window (alive, unconscious) with a reserve.
 * Dying → dead: while dying, the reserve bleeds by dyingBleedPerTick each tick;
 *   only when the reserve is exhausted is the character truly dead. This is the
 *   graded 3.5 dying window — a stabilize check, medicine, or rest can save them
 *   before then. Pure.
 */
export function tick(state: PerilState, cfg: PerilConfig = DEFAULT_PERIL_CONFIG): PerilState {
  if (!state.alive) return state

  // Already bleeding out: drain the reserve, not vitality (you're at 0).
  if (state.dying) {
    const dyingReserve = state.dyingReserve - cfg.dyingBleedPerTick
    if (dyingReserve <= 0) return { ...state, dyingReserve: 0, vitality: 0, alive: false, dying: false }
    return { ...state, dyingReserve }
  }

  const drain = state.conditions.reduce((sum, c) => sum + c.severity * cfg.drainPerSeverityPerTick, 0)
  const vitality = state.vitality - drain
  // Crossing 0 opens the dying window rather than killing outright.
  if (vitality <= 0) return { ...state, vitality: 0, dying: true, dyingReserve: cfg.dyingReserve }
  return { ...state, vitality }
}

/**
 * Attempt to stabilize a dying character — the field-medicine moment at the brink.
 * PURE: the check itself (Expertise as the primary "Heal" analog, with Shrewdness/
 * Luck assist or a raw Durability roll — vs a DC) is rolled at the CALL SITE, like
 * every other RNG in this module; the caller passes the outcome as `success`.
 * On success the character is pulled back to a fragile-but-conscious footing
 * (stabilizeVitalityRestore) with their conditions still to treat — buying the
 * moment to reach medicine or camp. On failure (or if not dying) it's a no-op and
 * the next tick keeps bleeding.
 */
export function stabilize(state: PerilState, success: boolean, cfg: PerilConfig = DEFAULT_PERIL_CONFIG): PerilState {
  if (!state.alive || !state.dying || !success) return state
  const vitality = Math.min(state.maxVitality, cfg.stabilizeVitalityRestore)
  return { ...state, dying: false, dyingReserve: 0, vitality }
}

/** True while the character is bleeding out — unconscious but not yet dead. */
export function isDying(state: PerilState): boolean {
  return state.alive && state.dying
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
  // A dose administered to a bleeding-out character pulls them back — a guaranteed
  // but dose-costly alternative to gambling on the stabilize check.
  const revive = state.dying
    ? { dying: false, dyingReserve: 0, vitality: Math.min(state.maxVitality, cfg.stabilizeVitalityRestore) }
    : {}
  const target = state.conditions.find(c => c.id === id)
  if (!target) return { ...state, ...revive }
  const nextSeverity = target.severity - cfg.medicineSeverityReduction
  const conditions = nextSeverity <= 0
    ? state.conditions.filter(c => c.id !== id)
    : state.conditions.map(c => (c.id === id ? { ...c, severity: clampSeverity(nextSeverity) } : c))
  return { ...state, ...revive, conditions }
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
  // Camp rest also pulls a bleeding-out character back from the brink (a companion
  // tends them through the night) — clear the dying flag before restoring vitality.
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
  return { ...state, vitality, conditions, dying: false, dyingReserve: 0 }
}

export function isDead(state: PerilState): boolean {
  return !state.alive
}

/** Human-readable label for a condition + severity (compact UI convenience). */
export function describeCondition(c: Condition): string {
  const sev = c.severity === 1 ? 'mild' : c.severity === 2 ? 'serious' : 'grave'
  const name: Record<ConditionId, string> = {
    snakebite: 'snakebite', fever: 'trail fever', dysentery: 'dysentery',
    injury: 'injury', exhaustion: 'exhaustion',
  }
  return `${sev} ${name[c.id]}`
}

// Flavorful, historically-grounded condition lore (Grok's highest-leverage change
// beyond the stabilization stage, 2026-07-03): tie each peril to real Gold-Rush
// history + the underlying mechanic, so a loss reads as "the Trail claimed another
// with dysentery" rather than "I died to a debuff." Prose/tooltip layer — the
// compact describeCondition() stays for tight UI.
const CONDITION_LORE: Record<ConditionId, { name: string; flavor: string; note: string }> = {
  dysentery: {
    name: 'dysentery',
    flavor: 'the great killer of the overland trails — fouled water and camp filth took more souls than any ambush or accident',
    note: 'a hardy Durability throws off the worst; clean rest and medicine turn it back',
  },
  fever: {
    name: 'trail fever',
    flavor: 'the ague — chills and sweats that haunted the river camps and the low, wet ground',
    note: 'time and rest break it; push on unrested and it deepens',
  },
  snakebite: {
    name: 'snakebite',
    flavor: 'rattlesnake venom — the diamondbacks struck more prospectors than any outlaw ever did',
    note: 'a strong Durability shrugs off the worst; left untended the poison spreads',
  },
  injury: {
    name: 'injury',
    flavor: "a hard hurt — a wagon flip, a horse's kick, a fall on the rocks",
    note: 'rest knits bone slowly; a steady field-medicine hand speeds it',
  },
  exhaustion: {
    name: 'exhaustion',
    flavor: 'bone-deep weariness from forced marches and thin rations',
    note: 'it saps you and opens the door to worse — make camp and eat',
  },
}

/**
 * Immersive, history-grounded description of a condition for prose / tooltips.
 * Severity-aware. e.g. narrateCondition({id:'dysentery',severity:3}) →
 * "A grave, life-threatening bout of dysentery — the great killer of the overland
 *  trails … A hardy Durability throws off the worst; clean rest and medicine turn it back."
 */
export function narrateCondition(c: Condition): string {
  const lore = CONDITION_LORE[c.id]
  const sev = c.severity === 1 ? 'A touch of'
            : c.severity === 2 ? 'A serious case of'
            : 'A grave, life-threatening bout of'
  const note = lore.note.charAt(0).toUpperCase() + lore.note.slice(1)
  return `${sev} ${lore.name} — ${lore.flavor}. ${note}.`
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
