// Regression tests for the Where-in-Time chase data + randomizer (2026-06-22).
// Locks in the two fixes from the WIT verification review:
//   • buildChase re-salt: randomized routes must be coherent AND the silent
//     fallback-to-canonical rate must stay low (was ~25%, now ~nil).
//   • data invariants: exactly one real warrant charge; every hop references
//     real eras + real distractors (so the render guard never needs to fire in
//     normal play, and the warrant deduction stays winnable).
// Run by `npm test` (tsx). Pure data/logic — no DOM, no storage.

import {
  ERAS, CHASE, HOP_POOL, buildChase, WARRANT_CHARGES, DISTRACTOR_SCENES, TRUE_HISTORY,
} from './whereInTimeData'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`) }
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

function isCoherent(route: typeof CHASE): boolean {
  if (route.length < 3) return false
  if (route[0].fromEra !== 'era_1849') return false
  if (route[route.length - 1].toEra !== 'era_future') return false
  for (let i = 1; i < route.length; i++) {
    if (route[i].fromEra !== route[i - 1].toEra) return false
  }
  return true
}

console.log('whereInTimeData')

// 1. flag-off / seed<0 => canonical CHASE (instant rollback path)
check('flag-off returns canonical CHASE', buildChase(12345, false) === CHASE)
check('seed<0 returns canonical CHASE', buildChase(-1, true) === CHASE)
check('canonical CHASE is itself coherent', isCoherent(CHASE))

// 2. randomized: every seed yields a coherent route, and the fallback-to-canonical
//    rate is low (the bug we fixed). Sample a wide seed range deterministically.
let coherent = 0, fellBack = 0
const N = 5000
for (let seed = 1; seed <= N; seed++) {
  const r = buildChase(seed, true)
  if (isCoherent(r)) coherent++
  if (r === CHASE) fellBack++
}
check('every randomized seed is coherent', coherent === N, `${coherent}/${N}`)
check('fallback-to-canonical rate < 2%', fellBack / N < 0.02, `${((fellBack / N) * 100).toFixed(1)}%`)

// 3. determinism: same seed => same route (replayable/debuggable)
const a = buildChase(424242, true).map((h) => h.fromEra + '>' + h.toEra).join('|')
const b = buildChase(424242, true).map((h) => h.fromEra + '>' + h.toEra).join('|')
check('buildChase is deterministic for a fixed seed', a === b)

// 4. variety: across seeds we get more than one distinct trail (not memorizable)
const trails = new Set<string>()
for (let seed = 1; seed <= 500; seed++) {
  trails.add(buildChase(seed, true).map((h) => h.fromEra + '>' + h.toEra).join('|'))
}
check('randomization yields >=3 distinct trails', trails.size >= 3, `${trails.size} distinct`)

// 5. warrant: exactly one real charge (the deduction is winnable and unambiguous)
check('exactly one real warrant charge', WARRANT_CHARGES.filter((c) => c.isReal).length === 1)
check('warrant has >=2 decoy charges', WARRANT_CHARGES.filter((c) => !c.isReal).length >= 2)

// 6. data integrity: every hop in the pool references real eras + real distractors,
//    so candidatesFor() and the era render never hit an undefined era.
let hopOk = true
for (const h of HOP_POOL) {
  if (!ERAS[h.fromEra] || !ERAS[h.toEra]) hopOk = false
  for (const d of h.distractors) if (!ERAS[d]) hopOk = false
}
check('every HOP_POOL hop references real ERAS + distractors', hopOk)
// The three thematic distractor eras get bespoke witness scenes; real eras used as
// distractors fall back to a generic (still ERA-safe) line in page.tsx by design.
check('thematic distractor eras (dreamtime/1906/2049) have witness scenes', ['era_dreamtime', 'era_1906', 'era_2049'].every((d) => !!DISTRACTOR_SCENES[d]))
check('TRUE_HISTORY has an entry per canonical era stop', TRUE_HISTORY.length >= 4)

if (failures > 0) { console.error(`\nwhereInTimeData: ${failures} FAILED`); process.exit(1) }
console.log('whereInTimeData: all passed')
