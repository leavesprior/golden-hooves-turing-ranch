// ============================================================================
// CLUE ENGINE — SHARED SCHEMA (Phase 1, read-only foundation)
//
// BOBR has FOUR independent Cyrus-Vane deduction surfaces, each with its own
// trait/clue type and its own localStorage store:
//
//   1. chase-demo      WantedTrait{label,value}      (CASE/CaseFile, ClueHop)
//   2. where-in-time   TimeTrait{label,value}        (TimeHop)
//   3. town investig.  CaseEvidence{label,value}     (InvestigationScene)
//   4. explore mystery MysteryClue[] + multiple-choice (TownMystery/MysteryClue)
//
// This file is the SHARED VOCABULARY those four can ADAPT into for unified
// reading. It is a DISCRIMINATED UNION (per Grok's APPROVE-WITH-CHANGES 8.5/10
// verdict): we deliberately do NOT flatten the four surfaces to a lowest-common-
// denominator blob. Each variant keeps its surface-specific payload so adapters
// are LOSSLESS — nothing a surface knows is thrown away on the way in.
//
// PHASE 1 IS READ-ONLY + ADDITIVE. Nothing here changes any surface's write
// path or migrates any store. These are pure types + pure adapter functions.
// (Dual-write + store migration are Phase 2/3, gated on a later adversarial
// pass — out of scope here.)
// ============================================================================

// ---------------------------------------------------------------------------
// Re-import the four surfaces' own types so the adapters are type-checked
// against the REAL shapes (read-only type imports — zero runtime coupling,
// they erase at compile time, so importing them does not change any surface).
// ---------------------------------------------------------------------------
import type { WantedTrait } from '@/app/adventure/chase-demo/chaseData'
import type { TimeTrait } from '@/app/adventure/where-in-time/whereInTimeData'
import type { CaseEvidence } from '@/lib/townInvestigations'
import type { MysteryClue } from '@/app/explore/data/townMysteries'

// ---------------------------------------------------------------------------
// THE DISCRIMINATED UNION
//
// Common fields shared by every variant:
//   kind   — the discriminant ('wanted' | 'time' | 'evidence' | 'mystery')
//   label  — the human-readable label for the datum (the "field name")
//   text   — the human-readable value/body of the datum (the "field value")
//
// Each variant then carries a `payload` that PRESERVES the surface-specific
// shape verbatim, so the adapter is total (handles every input) and lossless
// (round-trips the original). `payload` is always the surface's own object.
// ---------------------------------------------------------------------------

/** A wanted-poster trait from the chase-demo surface. */
export interface WantedUnifiedTrait {
  kind: 'wanted'
  label: string
  text: string
  /** The original WantedTrait, preserved losslessly. */
  payload: WantedTrait
}

/** A period-attribute trait from the where-in-time surface. */
export interface TimeUnifiedTrait {
  kind: 'time'
  label: string
  text: string
  /** The original TimeTrait, preserved losslessly. */
  payload: TimeTrait
}

/** A collected case-file datum from the town-investigations surface. */
export interface EvidenceUnifiedTrait {
  kind: 'evidence'
  label: string
  text: string
  /** The original CaseEvidence, preserved losslessly. */
  payload: CaseEvidence
}

/**
 * A clue from the explore mini-mystery surface. Unlike the other three (which
 * are {label,value} traits), a MysteryClue is a richer object (id, attraction,
 * text, discovery, required, order). We map `text` to the clue text and supply
 * a synthetic `label` from the attraction it is found at, while preserving the
 * full clue object in `payload`.
 */
export interface MysteryUnifiedTrait {
  kind: 'mystery'
  label: string
  text: string
  /** The original MysteryClue, preserved losslessly. */
  payload: MysteryClue
}

/**
 * The unified, read-only view of a single clue/trait/evidence datum from ANY of
 * the four surfaces. Discriminated on `kind` — narrow on it to recover the
 * surface-specific payload type.
 */
export type UnifiedTrait =
  | WantedUnifiedTrait
  | TimeUnifiedTrait
  | EvidenceUnifiedTrait
  | MysteryUnifiedTrait

/** The four surface identifiers, used across the unifier and credit config. */
export type SurfaceKind = UnifiedTrait['kind']

export const SURFACE_KINDS: readonly SurfaceKind[] = [
  'wanted',
  'time',
  'evidence',
  'mystery',
] as const

// ---------------------------------------------------------------------------
// UnifiedClue / ClueHop adaptation shape
//
// A "hop" in the chase/time surfaces is a step from one place/era to the next,
// carrying a witness, a free + costed clue reading, and a revealed trait. The
// investigation/mystery surfaces are not literal hops but read the same way: a
// prompt/question, an easy + hard read, and a datum collected on success.
//
// UnifiedClue is the read-only adaptation of one such step. Surfaces ADAPT into
// it; nothing adapts back out (Phase 1 is read-only). Fields are optional where
// a surface genuinely lacks them, so the shape stays total across all four.
// ---------------------------------------------------------------------------

export interface UnifiedClue {
  /** Which surface this clue came from. */
  surface: SurfaceKind
  /** Stable id within the surface, when one exists (scene id, clue id, hop key). */
  id?: string
  /** Where the player stands / the question's anchor (town id, era id, place). */
  fromKey?: string
  /** Where the clue points (next town/era id), when the surface is a chase. */
  toKey?: string
  /** Named diegetic source, when the surface has one. */
  witness?: { name: string; role: string }
  /** The free reading (easy clue / prompt). */
  easy?: string
  /** The costed reading (hard clue), when the surface offers one. */
  hard?: string
  /** The datum revealed/collected on a correct read, unified. */
  trait?: UnifiedTrait
}

// ---------------------------------------------------------------------------
// PURE ADAPTERS — total + lossless. Each takes a surface's own datum and
// returns the corresponding UnifiedTrait variant, preserving the original in
// `payload`. No I/O, no mutation, no throw.
// ---------------------------------------------------------------------------

/** chase-demo WantedTrait -> UnifiedTrait('wanted'). */
export function fromWantedTrait(t: WantedTrait): WantedUnifiedTrait {
  return { kind: 'wanted', label: t.label, text: t.value, payload: t }
}

/** where-in-time TimeTrait -> UnifiedTrait('time'). */
export function fromTimeTrait(t: TimeTrait): TimeUnifiedTrait {
  return { kind: 'time', label: t.label, text: t.value, payload: t }
}

/** town-investigations CaseEvidence -> UnifiedTrait('evidence'). */
export function fromCaseEvidence(e: CaseEvidence): EvidenceUnifiedTrait {
  return { kind: 'evidence', label: e.label, text: e.value, payload: e }
}

/**
 * explore MysteryClue -> UnifiedTrait('mystery'). The synthetic label is the
 * attraction the clue is found at (so the unified label is human-meaningful);
 * the full clue is preserved in payload, so id/order/required/discovery survive.
 */
export function fromMysteryClue(c: MysteryClue): MysteryUnifiedTrait {
  return {
    kind: 'mystery',
    label: c.attractionId,
    text: c.text,
    payload: c,
  }
}

// ---------------------------------------------------------------------------
// Convenience: recover the original surface datum from a UnifiedTrait. Because
// each adapter is lossless, this is the exact object the adapter was given —
// the round-trip is identity on `payload`. Narrowing is by the discriminant.
// ---------------------------------------------------------------------------

export function originalOf(
  u: WantedUnifiedTrait,
): WantedTrait
export function originalOf(u: TimeUnifiedTrait): TimeTrait
export function originalOf(u: EvidenceUnifiedTrait): CaseEvidence
export function originalOf(u: MysteryUnifiedTrait): MysteryClue
export function originalOf(
  u: UnifiedTrait,
): WantedTrait | TimeTrait | CaseEvidence | MysteryClue
export function originalOf(
  u: UnifiedTrait,
): WantedTrait | TimeTrait | CaseEvidence | MysteryClue {
  return u.payload
}
