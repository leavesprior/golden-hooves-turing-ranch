/**
 * Clue Engine — Phase 1 read-only foundation tests.
 *
 * Covers, mirroring the markerSession.test.ts zero-dependency tsx harness style:
 *
 *   1. ADAPTERS — fromWantedTrait / fromTimeTrait / fromCaseEvidence /
 *      fromMysteryClue are TOTAL (handle every input) and LOSSLESS (payload
 *      round-trips via originalOf; identity on the original object).
 *   2. DISCRIMINATED UNION — narrowing on `kind` recovers the right payload type.
 *   3. UNIFIER DEFENSIVENESS — readTownSolved / readExplorerMysteries never throw
 *      on malformed JSON / hostile shapes; return safe all-false defaults
 *      (matches the surface stores' try/catch posture).
 *   4. CROSS-SURFACE CREDIT — computeCredit follows the explicit CREDIT_CONFIG
 *      rules (per-other-solve %, cap, solved=1.0), and unifyTowns folds explore
 *      mysteries per-town and reports solved/in-progress correctly.
 *   5. MIGRATION STUB — migrateClueStores is a no-op (migrated=false, versions
 *      unchanged) and writes nothing.
 *
 *   Run: node_modules/.bin/tsx src/lib/clueEngine/clueEngine.test.ts
 *   Exit 0 = all pass, 1 = at least one failure.
 */

import {
  fromWantedTrait,
  fromTimeTrait,
  fromCaseEvidence,
  fromMysteryClue,
  originalOf,
  SURFACE_KINDS,
  type UnifiedTrait,
} from './types'
import {
  readTownSolved,
  readExplorerMysteries,
  computeCredit,
  unifyTowns,
  unifyFromStorage,
  CREDIT_CONFIG,
  type StorageLike,
  type MysteryTownMap,
} from './unifier'
import {
  migrateClueStores,
  CLUE_STORE_VERSION,
} from './version'
import type { SurfaceKind } from './types'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = ''): void {
  if (cond) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

/** A fake StorageLike for injecting controlled (and hostile) values. */
function fakeStore(map: Record<string, string>): StorageLike {
  return { getItem: (k) => (k in map ? map[k] : null) }
}

// ===========================================================================
console.log('adapters — total + lossless')
// ===========================================================================
{
  const w = fromWantedTrait({ label: 'GAIT', value: 'On foot' })
  ok(w.kind === 'wanted' && w.label === 'GAIT' && w.text === 'On foot', 'wanted adapter maps label/value->text')
  ok(originalOf(w).value === 'On foot', 'wanted payload round-trips (lossless)')
  ok(originalOf(w) === w.payload, 'wanted originalOf is identity on payload')

  const t = fromTimeTrait({ label: 'FORGERY', value: 'False surveys' })
  ok(t.kind === 'time' && t.text === 'False surveys', 'time adapter maps value->text')
  ok(originalOf(t).label === 'FORGERY', 'time payload round-trips')

  const e = fromCaseEvidence({ label: 'WEIGHT', value: 'Dust rings false' })
  ok(e.kind === 'evidence' && e.text === 'Dust rings false', 'evidence adapter maps value->text')
  ok(originalOf(e).value === 'Dust rings false', 'evidence payload round-trips')

  const c = fromMysteryClue({
    id: 'vc_1',
    attractionId: 'vol_st_george',
    text: 'A faded letter...',
    discoveryText: 'You notice...',
    required: true,
    order: 1,
  })
  ok(c.kind === 'mystery' && c.text === 'A faded letter...', 'mystery adapter maps clue text->text')
  ok(c.label === 'vol_st_george', 'mystery adapter synthesizes label from attractionId')
  ok(originalOf(c).id === 'vc_1' && originalOf(c).required === true, 'mystery payload preserves id/required/order (lossless)')

  // Totality: empty strings are valid inputs, never throw.
  const w2 = fromWantedTrait({ label: '', value: '' })
  ok(w2.kind === 'wanted' && w2.label === '' && w2.text === '', 'adapters are total on empty strings')

  ok(SURFACE_KINDS.length === 4, 'SURFACE_KINDS lists all four surfaces')
}

// ===========================================================================
console.log('discriminated union — narrows correctly')
// ===========================================================================
{
  const all: UnifiedTrait[] = [
    fromWantedTrait({ label: 'A', value: 'a' }),
    fromTimeTrait({ label: 'B', value: 'b' }),
    fromCaseEvidence({ label: 'C', value: 'c' }),
    fromMysteryClue({ id: 'x', attractionId: 'att', text: 't', discoveryText: 'd', required: false, order: 0 }),
  ]
  // Narrowing: each branch sees the correct payload type at compile time and the
  // correct discriminant at runtime.
  for (const u of all) {
    switch (u.kind) {
      case 'wanted':
        ok(u.payload.value === 'a', 'narrow wanted -> WantedTrait payload')
        break
      case 'time':
        ok(u.payload.value === 'b', 'narrow time -> TimeTrait payload')
        break
      case 'evidence':
        ok(u.payload.value === 'c', 'narrow evidence -> CaseEvidence payload')
        break
      case 'mystery':
        ok(u.payload.attractionId === 'att', 'narrow mystery -> MysteryClue payload')
        break
      default: {
        // Exhaustiveness: this must be unreachable (compile-time `never`).
        const _exhaustive: never = u
        ok(false, 'union is exhaustive', String(_exhaustive))
      }
    }
  }
}

// ===========================================================================
console.log('unifier readers — defensive, never throw, safe defaults')
// ===========================================================================
{
  // Absent store (SSR / no injection): empty.
  ok(readTownSolved(null).size === 0, 'readTownSolved(null) -> empty set')
  ok(readExplorerMysteries(null).length === 0, 'readExplorerMysteries(null) -> empty')

  // Malformed JSON: no throw, empty.
  ok(readTownSolved(fakeStore({ bobr_town_cases_solved: '{not json' })).size === 0, 'townSolved tolerates malformed JSON')
  ok(readExplorerMysteries(fakeStore({ gold_country_explorer_progress: 'nope[' })).length === 0, 'explorer tolerates malformed JSON')

  // Wrong shape: non-array / non-object collapses to default.
  ok(readTownSolved(fakeStore({ bobr_town_cases_solved: '{"a":1}' })).size === 0, 'townSolved rejects non-array')
  ok(readExplorerMysteries(fakeStore({ gold_country_explorer_progress: '42' })).length === 0, 'explorer rejects non-object')
  ok(readExplorerMysteries(fakeStore({ gold_country_explorer_progress: '{"mysteries":"x"}' })).length === 0, 'explorer rejects non-array mysteries')

  // Hostile members filtered, valid kept.
  const mixed = readTownSolved(fakeStore({ bobr_town_cases_solved: '["west_point", 5, null, "", "volcano"]' }))
  ok(mixed.size === 2 && mixed.has('west_point') && mixed.has('volcano'), 'townSolved keeps only non-empty strings', String([...mixed]))

  const ms = readExplorerMysteries(
    fakeStore({
      gold_country_explorer_progress: JSON.stringify({
        mysteries: [
          { mysteryId: 'volcano_cannon', solved: true },
          { mysteryId: 'angels_twain', solved: false },
          { mysteryId: 5, solved: true }, // bad id -> dropped
          { solved: true }, // no id -> dropped
          null, // junk -> dropped
        ],
      }),
    }),
  )
  ok(ms.length === 2, 'explorer keeps only well-formed mystery entries', String(ms.length))
  ok(ms.find((m) => m.mysteryId === 'volcano_cannon')?.solved === true, 'explorer reads solved=true')
  ok(ms.find((m) => m.mysteryId === 'angels_twain')?.solved === false, 'explorer reads solved=false')
}

// ===========================================================================
console.log('cross-surface credit — explicit rules')
// ===========================================================================
{
  const none: Record<SurfaceKind, boolean> = { wanted: false, time: false, evidence: false, mystery: false }
  const c0 = computeCredit(none)
  ok(c0.wanted === 0 && c0.time === 0 && c0.evidence === 0 && c0.mystery === 0, 'no solves -> zero credit everywhere')

  // One surface solved -> that surface 1.0, others get one perOtherSurfaceSolve.
  const oneEvidence: Record<SurfaceKind, boolean> = { wanted: false, time: false, evidence: true, mystery: false }
  const c1 = computeCredit(oneEvidence)
  ok(c1.evidence === 1, 'solved surface credit = 1.0')
  ok(c1.wanted === CREDIT_CONFIG.perOtherSurfaceSolve, 'one other solve grants exactly perOtherSurfaceSolve', String(c1.wanted))
  ok(c1.time === CREDIT_CONFIG.perOtherSurfaceSolve && c1.mystery === CREDIT_CONFIG.perOtherSurfaceSolve, 'all non-solved peers get the same partial credit')

  // Three surfaces solved -> the lone unsolved is capped, never reaching 1.0.
  const three: Record<SurfaceKind, boolean> = { wanted: true, time: true, evidence: true, mystery: false }
  const c3 = computeCredit(three)
  const rawThree = CREDIT_CONFIG.perOtherSurfaceSolve * 3
  ok(c3.mystery === Math.min(CREDIT_CONFIG.crossCreditCap, rawThree), 'three other solves applies the cap', `${c3.mystery} vs cap ${CREDIT_CONFIG.crossCreditCap}`)
  ok(c3.mystery < 1, 'cross-credit alone can NEVER reach solved=1.0 (must play the surface)', String(c3.mystery))
  ok(c3.wanted === 1 && c3.time === 1 && c3.evidence === 1, 'solved surfaces stay 1.0 regardless of peers')
}

// ===========================================================================
console.log('unifier — per-town fold, solved/in-progress, all/any')
// ===========================================================================
{
  const map: MysteryTownMap = {
    volcano_cannon: 'volcano',
    westpoint_robbery: 'west_point',
  }
  const view = unifyTowns({
    townSolved: new Set(['west_point']), // evidence solved west_point
    solvedMysteryIds: new Set(['volcano_cannon']), // mystery solved volcano
    mysteryTownMap: map,
    wantedSolved: new Set(['west_point']), // chase also solved west_point
    inProgress: { time: new Set(['volcano']) }, // where-in-time open on volcano
  })

  ok(!!view.west_point && !!view.volcano, 'both towns appear in unified view')

  const wp = view.west_point
  ok(wp.surfaces.evidence.solved && wp.surfaces.wanted.solved, 'west_point: evidence+wanted solved')
  ok(!wp.surfaces.time.solved && !wp.surfaces.mystery.solved, 'west_point: time+mystery not solved')
  ok(wp.anySolved && !wp.allSolved, 'west_point: anySolved true, allSolved false')
  ok(wp.surfaces.evidence.solved && wp.credit.evidence === 1, 'west_point: solved surface credit 1.0')
  // two solved peers (evidence+wanted) for the unsolved time/mystery
  ok(wp.credit.time === Math.min(CREDIT_CONFIG.crossCreditCap, CREDIT_CONFIG.perOtherSurfaceSolve * 2), 'west_point: unsolved surface gets 2-peer credit')

  const vol = view.volcano
  ok(vol.surfaces.mystery.solved, 'volcano: mystery solved (folded from mysteryId)')
  ok(vol.surfaces.time.inProgress, 'volcano: time surface in-progress flagged')
  ok(!vol.surfaces.time.solved, 'volcano: time not solved (in-progress only)')
  ok(vol.anySolved && !vol.allSolved, 'volcano: anySolved true (mystery), allSolved false')

  // A solved surface is never simultaneously in-progress.
  const both = unifyTowns({
    townSolved: new Set(['jackson']),
    solvedMysteryIds: new Set<string>(),
    mysteryTownMap: {},
    inProgress: { evidence: new Set(['jackson']) }, // claim in-progress AND solved
  })
  ok(both.jackson.surfaces.evidence.solved && !both.jackson.surfaces.evidence.inProgress, 'solved surface clears its in-progress flag')

  // allSolved is true only when every surface is solved.
  const full = unifyTowns({
    townSolved: new Set(['angels_camp']),
    solvedMysteryIds: new Set(['angels_twain']),
    mysteryTownMap: { angels_twain: 'angels_camp' },
    wantedSolved: new Set(['angels_camp']),
    timeSolved: new Set(['angels_camp']),
  })
  ok(full.angels_camp.allSolved, 'all four surfaces solved -> allSolved true')
  ok(full.angels_camp.credit.wanted === 1 && full.angels_camp.credit.mystery === 1, 'allSolved -> every credit 1.0')
}

// ===========================================================================
console.log('unifyFromStorage — reads both real stores defensively')
// ===========================================================================
{
  const store = fakeStore({
    bobr_town_cases_solved: '["west_point","murphys"]',
    gold_country_explorer_progress: JSON.stringify({
      mysteries: [{ mysteryId: 'volcano_cannon', solved: true }],
    }),
  })
  const map: MysteryTownMap = { volcano_cannon: 'volcano' }
  const view = unifyFromStorage(map, store)
  ok(view.west_point?.surfaces.evidence.solved === true, 'unifyFromStorage reads town-solved store')
  ok(view.murphys?.surfaces.evidence.solved === true, 'unifyFromStorage reads multiple solved towns')
  ok(view.volcano?.surfaces.mystery.solved === true, 'unifyFromStorage folds explore mysteries per-town')

  // Hostile both-stores: no throw, empty view.
  const bad = unifyFromStorage(map, fakeStore({ bobr_town_cases_solved: 'x[', gold_country_explorer_progress: '}{' }))
  ok(Object.keys(bad).length === 0, 'unifyFromStorage on malformed stores -> empty view (no throw)')
}

// ===========================================================================
console.log('migration stub — no-op, writes nothing')
// ===========================================================================
{
  const r = migrateClueStores()
  ok(r.migrated === false, 'migrateClueStores is a no-op (migrated=false)')
  ok(r.fromVersion === CLUE_STORE_VERSION && r.toVersion === CLUE_STORE_VERSION, 'migrate leaves version unchanged')
  ok(typeof r.note === 'string' && r.note.length > 0, 'migrate returns a human-readable note')
  ok(CLUE_STORE_VERSION === 1, 'CLUE_STORE_VERSION ships at 1 for Phase 1')
}

console.log('')
console.log(`clueEngine Phase 1: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
