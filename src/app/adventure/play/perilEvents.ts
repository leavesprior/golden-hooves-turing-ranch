// ============================================
// PERIL EVENTS — encounter/choice → condition mapping (pure, config-driven)
// ============================================
// Maps failed travel encounters and reckless dialogue choices to peril conditions,
// gated by a SADDLE-stat check that stands in for D&D 3.5's Fortitude save
// (Grok + SuperGrok peril consults, 2026-07-03). All difficulty lives in ONE table
// so lethality/fairness is tuned in one place — same discipline as DEFAULT_PERIL_CONFIG.
//
// PURE: the d20-style roll is supplied by the CALLER (RNG lives at the call site,
// exactly like perilEngine). This module only decides WHICH condition an encounter
// threatens and, given a roll, whether it lands and at what severity.

import type { ConditionId, Severity } from './perilEngine'

// The stat that rolls the "save". Durability = the Fortitude analog (poison/disease/
// toughness); Agility dodges wagon-wrecks and falls; Shrewdness reads the route ahead.
export type GatingStat = 'durability' | 'agility' | 'shrewdness'

export interface PerilEvent {
  id: string
  label: string             // narrative flavor shown to the player
  condition: ConditionId
  gatingStat: GatingStat     // which SADDLE stat resists it
  dc: number                 // fail the check (roll+mod < dc) → inflicted
  baseSeverity: Severity     // severity on an ordinary failure
  poison?: boolean           // two-stage: a secondary drain one tick later (snakebite)
  incubationTicks?: number   // disease: symptom-free delay before it bites (fever/dysentery)
  source: 'travel' | 'dialogue'
}

// Tuned for a casual audience (soft mode) while honoring both inspirations. SuperGrok's
// concrete instincts: snakebite is a high-DC poison track; injury rolls Agility not
// Durability; exhaustion is the lowest DC but stacks; disease incubates a tick or two.
export const PERIL_EVENTS: readonly PerilEvent[] = [
  // --- travel encounters ---
  { id: 'rattlesnake',  label: 'A rattler strikes from the sage',        condition: 'snakebite',  gatingStat: 'durability', dc: 15, baseSeverity: 1, poison: true,       source: 'travel' },
  { id: 'fouled_water', label: 'The only water is a fouled creek',       condition: 'dysentery',  gatingStat: 'durability', dc: 12, baseSeverity: 1, incubationTicks: 1, source: 'travel' },
  { id: 'river_miasma', label: 'Fever hangs over the swampy bottoms',    condition: 'fever',      gatingStat: 'durability', dc: 12, baseSeverity: 1, incubationTicks: 2, source: 'travel' },
  { id: 'wagon_flip',   label: 'A wheel gives out on the grade',         condition: 'injury',     gatingStat: 'agility',    dc: 13, baseSeverity: 2,                     source: 'travel' },
  { id: 'forced_march', label: 'You push the team on past dusk',         condition: 'exhaustion', gatingStat: 'durability', dc: 10, baseSeverity: 1,                     source: 'travel' },
  // --- reckless dialogue choices ---
  { id: 'wrestle_boast', label: '"I\'ll wrestle that bear for the gold!"', condition: 'injury',     gatingStat: 'agility',    dc: 14, baseSeverity: 2, source: 'dialogue' },
  { id: 'tainted_gift',  label: 'You accept a hostile camp\'s "gift" food', condition: 'dysentery',  gatingStat: 'durability', dc: 13, baseSeverity: 1, incubationTicks: 1, source: 'dialogue' },
  { id: 'ignore_doc',    label: 'You wave off the doctor\'s warning',       condition: 'exhaustion', gatingStat: 'durability', dc: 11, baseSeverity: 1, source: 'dialogue' },
] as const

export function findPerilEvent(id: string): PerilEvent | undefined {
  return PERIL_EVENTS.find(e => e.id === id)
}

export interface PerilCheckResult {
  avoided: boolean        // passed the save — no condition (or shrugged off)
  severity: Severity | 0  // 0 when avoided
  margin: number          // roll+mod - dc (how well/badly it went, for flavor)
  critical: boolean       // natural 1 or a rout — escalates to grave
}

/**
 * Resolve an encounter's save. PURE — the caller rolls the d20 and supplies the
 * character's stat modifier (Fort-save analog: roll + statMod vs dc). Pass → avoided.
 * Fail → inflicted, with severity scaling by how badly it was blown (SuperGrok:
 * critical/severe failure → grave). The caller then feeds (condition, severity) to
 * perilEngine.inflict(), which applies Trail-Hardened / Iron-Constitution mitigations.
 */
export function resolvePerilCheck(ev: PerilEvent, d20Roll: number, statMod: number): PerilCheckResult {
  const margin = (d20Roll + statMod) - ev.dc
  // D&D save convention: a natural 1 auto-fails (→ grave) and a natural 20
  // auto-succeeds, regardless of modifiers.
  if (d20Roll === 1)  return { avoided: false, severity: 3, margin, critical: true }
  if (d20Roll === 20) return { avoided: true,  severity: 0, margin, critical: false }
  if (margin >= 0) return { avoided: true, severity: 0, margin, critical: false }
  const critical = margin <= -8               // a rout also goes grave
  let severity: Severity = ev.baseSeverity
  if (critical) severity = 3
  else if (margin <= -4) severity = Math.min(3, ev.baseSeverity + 1) as Severity
  return { avoided: false, severity, margin, critical }
}
