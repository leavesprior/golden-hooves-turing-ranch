// Unified per-town progression (2026-06-21) — the SAFE half of "unify the two clue
// systems" (Grok enrichment). The game has two complementary town-clue surfaces:
//   • Investigations — the deep Where-in-Time chase at /town/[id]
//       (solved-state: localStorage 'bobr_town_cases_solved' = string[] of townIds)
//   • Explore mysteries — the lightweight inline deduction in /explore
//       (solved-state: localStorage 'gold_country_explorer_progress'.mysteries[].solved,
//        keyed by mysteryId === `${townId}_${topic}`)
//
// This module is a READ-ONLY unifier: it reads both stores and reports a single per-town
// progression, so each surface can reflect the other (a town solved in one shows solved
// in both, and they cross-link). It does NOT merge the data models or migrate saves —
// that destructive consolidation is a separate, Grok-/adversarial-review-gated cycle.
// Read-only + defensive: never throws, returns all-false on any storage problem.

import { getInvestigation } from '@/lib/townInvestigations'

const INVESTIGATION_SOLVED_KEY = 'bobr_town_cases_solved'
const EXPLORER_PROGRESS_KEY = 'gold_country_explorer_progress'

export interface TownProgress {
  townId: string
  /** Has the deep /town/[id] investigation been solved? */
  investigationSolved: boolean
  /** Has the /explore inline mystery for this town been solved? */
  mysterySolved: boolean
  /** Solved in at least one surface. */
  anySolved: boolean
  /** Solved in both surfaces (full town completion). */
  fullySolved: boolean
}

function readInvestigationSolved(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(INVESTIGATION_SOLVED_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function readSolvedMysteryIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(EXPLORER_PROGRESS_KEY)
    if (!raw) return new Set()
    const p = JSON.parse(raw)
    const entries: Array<{ mysteryId?: string; solved?: boolean }> = Array.isArray(p?.mysteries) ? p.mysteries : []
    return new Set(entries.filter((m) => m?.solved && m.mysteryId).map((m) => m.mysteryId as string))
  } catch { return new Set() }
}

/** Does this town have a solved explore mystery? Matches any solved mystery id for the town. */
function townMysterySolved(townId: string, solvedIds: Set<string>): boolean {
  for (const id of solvedIds) {
    // mystery ids are `${townId}_${topic}` (or the bare townId); match on the town prefix.
    if (id === townId || id.startsWith(`${townId}_`)) return true
  }
  return false
}

/** Unified progression for one town, reading both clue surfaces. */
export function getTownProgress(townId: string): TownProgress {
  const investigationSolved = readInvestigationSolved().includes(townId)
  const mysterySolved = townMysterySolved(townId, readSolvedMysteryIds())
  // an investigation existing is a precondition for investigationSolved being meaningful
  void getInvestigation // kept for symmetry / future use; tree-shaken if unused
  return {
    townId,
    investigationSolved,
    mysterySolved,
    anySolved: investigationSolved || mysterySolved,
    fullySolved: investigationSolved && mysterySolved,
  }
}

/** Unified progression for many towns at once (one storage read each — cheap). */
export function getTownProgressMap(townIds: string[]): Record<string, TownProgress> {
  const invSolved = new Set(readInvestigationSolved())
  const mysSolved = readSolvedMysteryIds()
  const out: Record<string, TownProgress> = {}
  for (const townId of townIds) {
    const investigationSolved = invSolved.has(townId)
    const mysterySolved = townMysterySolved(townId, mysSolved)
    out[townId] = {
      townId, investigationSolved, mysterySolved,
      anySolved: investigationSolved || mysterySolved,
      fullySolved: investigationSolved && mysterySolved,
    }
  }
  return out
}
