// ============================================================================
// CLUE ENGINE — READ-ONLY UNIFIER (Phase 1)
//
// A defensive, read-only view across the four Cyrus-Vane deduction surfaces and
// their two solved-state stores:
//
//   - 'bobr_town_cases_solved'        : string[] of solved CANONICAL town ids.
//       Written by the town-investigations surface (TownInvestigation.tsx).
//       Also the cross-game milestone the chase-demo reads.
//   - 'gold_country_explorer_progress': ExplorerProgress with a `mysteries`
//       array of { mysteryId, solved, ... }. Written by the explore surface.
//
// THE CHASE (chase-demo) and WHERE-IN-TIME surfaces persist per-CASE transient
// session state under their own SESSION_KEYs, plus a `bobr_chase_cases_caught`
// set for the chase. Those are session/rotation state, not a stable per-town
// solved ledger, so Phase 1 treats them as "in-progress" signals only and does
// not attempt to read their internal shape (it is transient and surface-owned).
//
// This module is PURE + DEFENSIVE: it never throws on malformed JSON, returns
// safe all-false defaults on bad/absent data, and writes NOTHING. It mirrors the
// safety posture of the existing surface stores (try/catch, JSON.parse guarded,
// no dependency on persistence succeeding).
//
// CROSS-SURFACE CREDIT is COMPUTED here (read-only). Solving a town on one
// surface yields a defined % credit toward the SAME town on the others. The
// rules are explicit and visible (see CREDIT_CONFIG). This computes and returns
// credit; it does NOT write it anywhere and does NOT change gameplay.
// ============================================================================

import {
  LEGACY_TOWN_SOLVED_KEY,
  LEGACY_EXPLORER_KEY,
} from './version'
import type { SurfaceKind } from './types'

// ---------------------------------------------------------------------------
// Raw store readers — each guarded, each returns a safe default on any failure.
// ---------------------------------------------------------------------------

/** A minimal localStorage-like shape, so tests can inject a fake store. */
export interface StorageLike {
  getItem(key: string): string | null
}

/** Resolve the storage to read from: an injected one, else window.localStorage,
 *  else null (SSR / no-DOM). Never throws. */
function resolveStorage(injected?: StorageLike | null): StorageLike | null {
  if (injected) return injected
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    /* access to localStorage can throw in locked-down contexts */
  }
  return null
}

/**
 * Read 'bobr_town_cases_solved' -> Set of solved town ids. Defensive: bad JSON,
 * non-array, or non-string members all collapse to an empty set.
 */
export function readTownSolved(injected?: StorageLike | null): Set<string> {
  const store = resolveStorage(injected)
  const out = new Set<string>()
  if (!store) return out
  try {
    const raw = store.getItem(LEGACY_TOWN_SOLVED_KEY)
    if (!raw) return out
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return out
    for (const id of parsed) {
      if (typeof id === 'string' && id.length > 0) out.add(id)
    }
  } catch {
    /* malformed JSON / hostile value: return empty, never throw */
  }
  return out
}

/** One solved mystery, as read from the explorer store (defensively typed). */
export interface ReadMysteryEntry {
  mysteryId: string
  solved: boolean
}

/**
 * Read 'gold_country_explorer_progress'.mysteries -> array of {mysteryId,solved}.
 * Defensive: bad JSON, missing/!array `mysteries`, or malformed members are all
 * filtered out. Never throws.
 */
export function readExplorerMysteries(
  injected?: StorageLike | null,
): ReadMysteryEntry[] {
  const store = resolveStorage(injected)
  if (!store) return []
  try {
    const raw = store.getItem(LEGACY_EXPLORER_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return []
    const mysteries = (parsed as { mysteries?: unknown }).mysteries
    if (!Array.isArray(mysteries)) return []
    const out: ReadMysteryEntry[] = []
    for (const m of mysteries) {
      if (!m || typeof m !== 'object') continue
      const id = (m as { mysteryId?: unknown }).mysteryId
      const solved = (m as { solved?: unknown }).solved
      if (typeof id === 'string' && id.length > 0) {
        out.push({ mysteryId: id, solved: solved === true })
      }
    }
    return out
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// MAPPING — the explore surface keys its progress by MYSTERY id (e.g.
// 'volcano_cannon'), not by town id. To unify per-town, callers pass a map from
// mystery id -> canonical town id (derivable from TOWN_MYSTERIES' townId field).
// We accept it as a param so this module has no static import coupling to the
// (large) mystery data and stays a pure function of its inputs.
// ---------------------------------------------------------------------------

export type MysteryTownMap = Readonly<Record<string, string>>

// ---------------------------------------------------------------------------
// CROSS-SURFACE CREDIT CONFIG (explicit, visible, satisfying — per Grok)
//
// Solving a town on ONE surface grants partial credit toward the SAME town on
// the OTHER surfaces. The intent: a player who cracked West Point in the town
// investigation already "knows" West Point, so the explore mystery and the
// chase feel warmer — without auto-completing them (that would gut the other
// surfaces' play). The numbers below are the WHOLE rule set, in one place.
//
// Credit is a value in [0,1]. 1.0 = this surface has it solved outright. The
// cross-surface contribution is the SAME flat percentage per other-surface
// solve, capped so cross-credit alone can never reach a "solved" 1.0 — direct
// play on a surface is always required to finish it.
// ---------------------------------------------------------------------------

export interface CreditConfig {
  /** Credit a town gets on a surface for EACH OTHER surface that has it solved. */
  readonly perOtherSurfaceSolve: number
  /** Hard cap on cross-surface credit (so it never reaches solved=1.0 alone). */
  readonly crossCreditCap: number
}

export const CREDIT_CONFIG: CreditConfig = {
  // Each other surface that solved this town contributes 25% of "knowing" it.
  // With at most 3 other surfaces that is 0.75 max before the cap...
  perOtherSurfaceSolve: 0.25,
  // ...and we cap cross-credit at 0.6 so even three other solves leave the
  // player short of a free completion — they must still play THIS surface.
  crossCreditCap: 0.6,
} as const

// ---------------------------------------------------------------------------
// THE UNIFIED PER-TOWN VIEW
// ---------------------------------------------------------------------------

/** Which surfaces have a given town solved / in progress, read-only. */
export interface SurfaceState {
  solved: boolean
  inProgress: boolean
}

export interface UnifiedTownView {
  townId: string
  /** Per-surface solved/in-progress state. */
  surfaces: Record<SurfaceKind, SurfaceState>
  /** True if ANY surface has this town solved. */
  anySolved: boolean
  /** True if EVERY surface that exists for this town is solved. */
  allSolved: boolean
  /**
   * Computed cross-surface credit per surface, in [0,1]. For a surface NOT yet
   * solved, this is min(crossCreditCap, perOtherSurfaceSolve * (#other solved)).
   * For a surface already solved, it is 1.0. READ-ONLY — never persisted.
   */
  credit: Record<SurfaceKind, number>
}

const ALL_SURFACES: readonly SurfaceKind[] = ['wanted', 'time', 'evidence', 'mystery']

function emptySurfaceState(): Record<SurfaceKind, SurfaceState> {
  return {
    wanted: { solved: false, inProgress: false },
    time: { solved: false, inProgress: false },
    evidence: { solved: false, inProgress: false },
    mystery: { solved: false, inProgress: false },
  }
}

/**
 * Compute cross-surface credit for one town given its per-surface solved flags.
 * Pure: same input -> same output. A solved surface is 1.0; an unsolved surface
 * earns perOtherSurfaceSolve per OTHER solved surface, capped at crossCreditCap.
 */
export function computeCredit(
  solvedBySurface: Record<SurfaceKind, boolean>,
  config: CreditConfig = CREDIT_CONFIG,
): Record<SurfaceKind, number> {
  const out = { wanted: 0, time: 0, evidence: 0, mystery: 0 } as Record<
    SurfaceKind,
    number
  >
  for (const s of ALL_SURFACES) {
    if (solvedBySurface[s]) {
      out[s] = 1
      continue
    }
    let others = 0
    for (const o of ALL_SURFACES) {
      if (o !== s && solvedBySurface[o]) others++
    }
    out[s] = Math.min(config.crossCreditCap, config.perOtherSurfaceSolve * others)
  }
  return out
}

// ---------------------------------------------------------------------------
// THE MAIN ENTRY — build the read-only unified view for every town that appears
// in ANY store. Inputs are explicit so the function is pure and testable:
//   - townSolved        : Set from readTownSolved()  (town-investigations surface)
//   - solvedMysteryIds  : ids of solved mysteries (explore surface)
//   - mysteryTownMap    : mysteryId -> townId, so explore solves map per-town
//   - inProgressTowns   : optional towns the player has an open session on
//                         (chase/where-in-time), keyed by surface
//
// chase-demo ('wanted') and where-in-time ('time') do not keep a stable
// per-town SOLVED ledger in Phase 1 (their persisted state is transient session
// + a caught-cases set), so this read marks them solved ONLY when the caller
// supplies explicit solved sets for them; otherwise they contribute in-progress
// signals at most. This keeps Phase 1 honest: we do not invent solved-state we
// cannot read.
// ---------------------------------------------------------------------------

export interface UnifyInput {
  /** Solved town ids from 'bobr_town_cases_solved' (evidence surface). */
  townSolved: Set<string>
  /** Solved mystery ids from the explorer store (mystery surface). */
  solvedMysteryIds: Set<string>
  /** mysteryId -> canonical townId, to fold explore solves per-town. */
  mysteryTownMap: MysteryTownMap
  /** Optional explicit solved town sets for the chase/time surfaces. */
  wantedSolved?: Set<string>
  timeSolved?: Set<string>
  /** Optional in-progress town sets per surface (open sessions). */
  inProgress?: Partial<Record<SurfaceKind, Set<string>>>
}

export function unifyTowns(input: UnifyInput): Record<string, UnifiedTownView> {
  const {
    townSolved,
    solvedMysteryIds,
    mysteryTownMap,
    wantedSolved,
    timeSolved,
    inProgress,
  } = input

  // Fold explore solves (keyed by mystery id) down to town ids.
  const mysterySolvedTowns = new Set<string>()
  for (const mid of solvedMysteryIds) {
    const tid = mysteryTownMap[mid]
    if (typeof tid === 'string' && tid.length > 0) mysterySolvedTowns.add(tid)
  }

  // The universe of towns = every town id mentioned by any solved/in-progress
  // signal across all four surfaces.
  const towns = new Set<string>()
  for (const t of townSolved) towns.add(t)
  for (const t of mysterySolvedTowns) towns.add(t)
  if (wantedSolved) for (const t of wantedSolved) towns.add(t)
  if (timeSolved) for (const t of timeSolved) towns.add(t)
  if (inProgress) {
    for (const s of ALL_SURFACES) {
      const set = inProgress[s]
      if (set) for (const t of set) towns.add(t)
    }
  }

  const result: Record<string, UnifiedTownView> = {}
  for (const townId of towns) {
    const surfaces = emptySurfaceState()

    surfaces.evidence.solved = townSolved.has(townId)
    surfaces.mystery.solved = mysterySolvedTowns.has(townId)
    surfaces.wanted.solved = wantedSolved ? wantedSolved.has(townId) : false
    surfaces.time.solved = timeSolved ? timeSolved.has(townId) : false

    if (inProgress) {
      for (const s of ALL_SURFACES) {
        const set = inProgress[s]
        if (set && set.has(townId)) surfaces[s].inProgress = true
      }
    }
    // A solved surface is implicitly "done", not in-progress.
    for (const s of ALL_SURFACES) {
      if (surfaces[s].solved) surfaces[s].inProgress = false
    }

    const solvedBySurface: Record<SurfaceKind, boolean> = {
      wanted: surfaces.wanted.solved,
      time: surfaces.time.solved,
      evidence: surfaces.evidence.solved,
      mystery: surfaces.mystery.solved,
    }

    const anySolved = ALL_SURFACES.some((s) => solvedBySurface[s])
    const allSolved = ALL_SURFACES.every((s) => solvedBySurface[s])

    result[townId] = {
      townId,
      surfaces,
      anySolved,
      allSolved,
      credit: computeCredit(solvedBySurface),
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// CONVENIENCE — read both real stores and build the unified view in one call.
// This is the browser-facing entry; it is still read-only (never writes) and
// fully defensive (delegates to the guarded readers above).
// ---------------------------------------------------------------------------

export function unifyFromStorage(
  mysteryTownMap: MysteryTownMap,
  injected?: StorageLike | null,
): Record<string, UnifiedTownView> {
  const townSolved = readTownSolved(injected)
  const mysteries = readExplorerMysteries(injected)
  const solvedMysteryIds = new Set<string>()
  for (const m of mysteries) if (m.solved) solvedMysteryIds.add(m.mysteryId)
  return unifyTowns({ townSolved, solvedMysteryIds, mysteryTownMap })
}
