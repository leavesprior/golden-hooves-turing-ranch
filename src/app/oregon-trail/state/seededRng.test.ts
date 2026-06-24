/**
 * Determinism regression for the B3 seeded-RNG conversion of the Oregon Trail
 * reducer's pure state-transition path.
 *
 * Before B3, several reducer actions (HUNT, CROSS_RIVER) and engine helpers
 * (computeTravel → getRandomWeather / checkDesertion / checkDesperationEvent)
 * called Math.random() inline, violating the reducer's own purity contract
 * (reducer.ts header: "pure state transform, no side effects"). This pins:
 *
 *   1. nextRandom(seed, cursor) is DETERMINISTIC for a fixed (seed, cursor) and
 *      VARIES with cursor — the stream is indexable and reproducible.
 *   2. Dispatching the SAME action sequence (HUNT, then a TRAVEL tick) through
 *      the reducer from two states sharing the SAME rngSeed yields IDENTICAL
 *      resulting state (food / ammo / cursor / everything) — i.e. the path is
 *      now a pure function of (state, action) with no hidden Math.random().
 *   3. A DIFFERENT seed produces a different stream (guards against a degenerate
 *      implementation that ignores the seed).
 *
 * No test runner is installed in this project; this is a zero-dependency
 * self-contained harness runnable with the bundled tsx:
 *
 *   node_modules/.bin/tsx src/app/oregon-trail/state/seededRng.test.ts
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import { nextRandom, nextInt } from '../lib/seededRng'
import { gameReducer } from './reducer'
import { DEFAULT_STATE } from './constants'
import type { OregonTrailState, PartyMember } from './types'
import type { GameAction } from './actions'

let passed = 0
let failed = 0

function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

// ---------------------------------------------------------------------------
// 1. nextRandom / nextInt are deterministic and cursor-varying
// ---------------------------------------------------------------------------
console.log('seededRng — deterministic + cursor-varying')
{
  const SEED = 12345
  ok(nextRandom(SEED, 0) === nextRandom(SEED, 0), 'same (seed,cursor) → identical value')
  ok(nextRandom(SEED, 1) === nextRandom(SEED, 1), 'same (seed,cursor=1) → identical value')

  const v0 = nextRandom(SEED, 0)
  const v1 = nextRandom(SEED, 1)
  const v2 = nextRandom(SEED, 2)
  ok(v0 !== v1 && v1 !== v2 && v0 !== v2, 'distinct cursors → distinct values', `${v0},${v1},${v2}`)

  // Range [0,1)
  let inRange = true
  for (let c = 0; c < 200; c++) {
    const v = nextRandom(SEED, c)
    if (v < 0 || v >= 1) { inRange = false; break }
  }
  ok(inRange, 'all draws fall in [0,1)')

  // Different seed → different stream (not a no-op on seed)
  ok(nextRandom(SEED, 0) !== nextRandom(SEED + 999, 0), 'different seed → different value at same cursor')

  // nextInt stays in [0, maxExclusive) and is deterministic
  let intsOk = true
  for (let c = 0; c < 200; c++) {
    const n = nextInt(SEED, c, 7)
    if (n < 0 || n >= 7 || !Number.isInteger(n)) { intsOk = false; break }
  }
  ok(intsOk, 'nextInt in [0,maxExclusive) and integral')
  ok(nextInt(SEED, 5, 100) === nextInt(SEED, 5, 100), 'nextInt deterministic for fixed (seed,cursor,max)')
  ok(nextInt(SEED, 5, 0) === 0, 'nextInt(max=0) → 0 (no divide-by-zero / NaN)')
}

// ---------------------------------------------------------------------------
// 2. Reducer purity: same seed + same action sequence → identical state
// ---------------------------------------------------------------------------

/** Build a deterministic traveling state with a fixed rngSeed. */
function makeTravelingState(seed: number): OregonTrailState {
  const party: PartyMember[] = [
    { id: 'leader', name: 'Tester', health: 100, isSick: false, role: 'leader' },
    { id: 'm0', name: 'Comp', health: 100, isSick: false, role: 'companion' },
  ]
  return {
    ...DEFAULT_STATE,
    phase: 'traveling',
    party,
    wagonLeader: 'Tester',
    food: 500,
    ammunition: 200,
    spareParts: 5,
    medicine: 5,
    oxen: 4,
    clothing: 3,
    morale: 60,
    wagonCondition: 100,
    distance: 200,
    milesUntilNextLandmark: 100,
    nextLandmark: 'Fort Kearny',
    rngSeed: seed,
    rngCursor: 0,
  }
}

console.log('reducer — same seed + same actions → identical state')
{
  const SEED = 777777
  // Two independent states with the SAME seed.
  const a0 = makeTravelingState(SEED)
  const b0 = makeTravelingState(SEED)

  const actions: GameAction[] = [
    { type: 'HUNT' },
    { type: 'TRAVEL' },
  ]

  const aFinal = actions.reduce(gameReducer, a0)
  const bFinal = actions.reduce(gameReducer, b0)

  ok(
    JSON.stringify(aFinal) === JSON.stringify(bFinal),
    'HUNT→TRAVEL from two same-seed states → byte-identical state',
  )
  // Spot-check the resource fields the prompt called out explicitly.
  ok(aFinal.food === bFinal.food, 'food identical', `${aFinal.food} vs ${bFinal.food}`)
  ok(aFinal.ammunition === bFinal.ammunition, 'ammunition identical', `${aFinal.ammunition} vs ${bFinal.ammunition}`)
  ok(aFinal.rngCursor === bFinal.rngCursor, 'rngCursor identical (cursor threaded, not Math.random)', `${aFinal.rngCursor} vs ${bFinal.rngCursor}`)

  // The cursor must have ADVANCED (proving draws actually came from the stream).
  ok(aFinal.rngCursor > a0.rngCursor, 'rngCursor advanced past the starting cursor', `${a0.rngCursor} → ${aFinal.rngCursor}`)

  // A HUNT alone consumes exactly 3 cursors (roll, ammoUsed, foodGained).
  const huntOnly = gameReducer(makeTravelingState(SEED), { type: 'HUNT' })
  ok(huntOnly.rngCursor === 3, 'HUNT consumes exactly 3 cursors', String(huntOnly.rngCursor))
}

// ---------------------------------------------------------------------------
// 3. Different seed → different trajectory (guards seed-ignoring degeneracy)
// ---------------------------------------------------------------------------
console.log('reducer — different seed → different outcome')
{
  const huntA = gameReducer(makeTravelingState(111111), { type: 'HUNT' })
  const huntB = gameReducer(makeTravelingState(222222), { type: 'HUNT' })
  // With different seeds the hunt roll / amounts should (almost surely) differ.
  ok(
    huntA.food !== huntB.food || huntA.ammunition !== huntB.ammunition || huntA.message !== huntB.message,
    'different seeds produce a different HUNT result',
    `A(food=${huntA.food},ammo=${huntA.ammunition}) B(food=${huntB.food},ammo=${huntB.ammunition})`,
  )
}

// ---------------------------------------------------------------------------
console.log(`\nSeeded RNG: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
