// ============================================================================
// CLUE ENGINE — STORE VERSIONING SCAFFOLD (Phase 1: no-op)
//
// The four deduction surfaces persist to TWO solved-state stores today:
//   - 'bobr_town_cases_solved'        : string[] of solved town ids
//   - 'gold_country_explorer_progress': { mysteries: MysteryProgressEntry[] ... }
// (plus per-session transient stores keyed by SESSION_KEY on each surface).
//
// THE PHASED PLAN (Grok APPROVE-WITH-CHANGES: "incremental migration only —
// NEVER big-bang on guest devices"):
//
//   Phase 1 (THIS):  Read-only. A shared schema + an expanded read-only unifier
//                    + cross-surface-credit COMPUTATION + this versioning stub.
//                    NO write-path change, NO migration. migrateClueStores() is
//                    a logging no-op that returns its input unchanged.
//
//   Phase 2 (later): DUAL-WRITE. Surfaces keep writing their existing stores AND
//                    begin writing a versioned unified store in parallel. Reads
//                    prefer the unified store, fall back to the legacy stores.
//                    Gated on a fresh adversarial pass (guest-device safety).
//
//   Phase 3 (later): MIGRATE + cut over. migrateClueStores() reads any
//                    lower-version unified store (or the legacy stores), folds
//                    them forward to CLUE_STORE_VERSION, writes the unified
//                    store, and the legacy writes are retired. Must be lazy,
//                    idempotent, and reversible per device — never a one-shot
//                    blanket rewrite of every guest's localStorage.
//
// Until Phase 2 ships, bumping CLUE_STORE_VERSION has no behavioral effect; it
// exists so the migration code has a target to fold toward.
// ============================================================================

/**
 * The schema version of the (future) unified clue store. Phase 1 ships at 1 and
 * the migrator is a no-op; Phase 2/3 will increment this as the unified store
 * shape evolves and migrateClueStores() gains real fold-forward logic.
 */
export const CLUE_STORE_VERSION = 1 as const

/** The localStorage key the unified store WILL live under (Phase 2+). Reserved
 *  now so the name is fixed and documented; nothing reads or writes it yet. */
export const UNIFIED_STORE_KEY = 'bobr_clue_engine_v1'

/** The legacy stores the unifier reads today (Phase 1 reads these directly). */
export const LEGACY_TOWN_SOLVED_KEY = 'bobr_town_cases_solved'
export const LEGACY_EXPLORER_KEY = 'gold_country_explorer_progress'

export interface MigrationResult {
  /** Version the stores were at before this call. Phase 1: always current. */
  fromVersion: number
  /** Version after this call. Phase 1: unchanged. */
  toVersion: number
  /** Whether anything was actually written. Phase 1: always false (no-op). */
  migrated: boolean
  /** Human-readable note for logs/telemetry. */
  note: string
}

/**
 * PHASE 1 NO-OP migrator. It inspects nothing destructively, writes nothing,
 * logs its (non-)action, and returns a result describing that it left every
 * store unchanged. This is the seam where Phase 2/3 migration logic will live.
 *
 * It is intentionally pure-ish: the ONLY side effect is a console log, and it
 * touches no storage. Safe to call on any device, any number of times.
 */
export function migrateClueStores(): MigrationResult {
  const result: MigrationResult = {
    fromVersion: CLUE_STORE_VERSION,
    toVersion: CLUE_STORE_VERSION,
    migrated: false,
    note:
      'Phase 1 no-op: clue stores are read-only; no migration performed. ' +
      'Dual-write (Phase 2) and cut-over migration (Phase 3) are gated on a ' +
      'later adversarial pass.',
  }
  // Fail-open logging only; never throws, never blocks gameplay.
  try {
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info(`[clueEngine] migrateClueStores: ${result.note}`)
    }
  } catch {
    /* no-op: logging must never break a guest device */
  }
  return result
}
