/**
 * Safety regression for the read-only town-progression unifier (townProgress.ts).
 *
 * The unifier is the SAFE half of "unify the two clue systems": it reads BOTH
 * solved-stores (investigations + explore mysteries) and reports one per-town
 * progression WITHOUT migrating or destroying either data model. Because it runs
 * over real player localStorage, the controls that matter are:
 *
 *   T1  old-save loads clean      — a save written before the unifier existed
 *                                   (investigations only, no explore key) must
 *                                   resolve, not throw, and not invent a mystery.
 *   T2  both surfaces resolve      — a town solved in BOTH surfaces is fullySolved;
 *                                   one surface alone is anySolved but not full.
 *   T3  no cross-town false-match  — a mystery id for `volcano` must not light up
 *                                   a different town that merely shares a prefix.
 *   T4  corrupt storage is inert   — malformed JSON / wrong shapes => all-false,
 *                                   never an exception (the game must not crash on
 *                                   a tampered or partially-written save).
 *   T5  map === per-town           — getTownProgressMap agrees with getTownProgress.
 *
 * No test runner is installed; this is a zero-dependency tsx harness:
 *   node_modules/.bin/tsx src/lib/townProgress.test.ts
 * Exit code 0 = all pass, 1 = at least one failure.
 */

// In-memory localStorage mock installed on a global `window` BEFORE the module is
// called (townProgress reads window at call-time, so post-import install is fine).
class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
  removeItem(k: string): void { this.m.delete(k) }
  clear(): void { this.m.clear() }
}
const store = new MockStorage()
;(globalThis as { window?: unknown }).window = { localStorage: store }

import { getTownProgress, getTownProgressMap } from './townProgress'

const INVESTIGATION_KEY = 'bobr_town_cases_solved'
const EXPLORER_KEY = 'gold_country_explorer_progress'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

// --- T1: an old save (investigations only, explore key absent) loads clean -----
console.log('T1 — pre-unifier save (investigations only) loads clean')
store.clear()
store.setItem(INVESTIGATION_KEY, JSON.stringify(['volcano', 'angels_camp']))
{
  let threw = false
  let p: ReturnType<typeof getTownProgress> | null = null
  try { p = getTownProgress('volcano') } catch { threw = true }
  ok(!threw, 'no throw when explore key is absent')
  ok(!!p && p.investigationSolved === true, 'investigationSolved reads the legacy store')
  ok(!!p && p.mysterySolved === false, 'mysterySolved is false (no explore data invented)')
  ok(!!p && p.anySolved === true && p.fullySolved === false, 'anySolved true, fullySolved false on one surface')
}

// --- T2: a town solved in BOTH surfaces is fullySolved -------------------------
console.log('T2 — both surfaces resolve into fullySolved')
store.clear()
store.setItem(INVESTIGATION_KEY, JSON.stringify(['volcano']))
store.setItem(EXPLORER_KEY, JSON.stringify({
  mysteries: [
    { mysteryId: 'volcano_cannon', solved: true },
    { mysteryId: 'san_andreas_bart', solved: false },
  ],
}))
{
  const v = getTownProgress('volcano')
  ok(v.investigationSolved && v.mysterySolved && v.fullySolved, 'volcano fully solved in both surfaces')
  const sa = getTownProgress('san_andreas')
  ok(!sa.investigationSolved && !sa.mysterySolved && !sa.anySolved, 'san_andreas: unsolved mystery does not count')
}

// --- T3: no cross-town false-positive on a shared prefix -----------------------
console.log('T3 — prefix-collision towns do not bleed into each other')
store.clear()
store.setItem(EXPLORER_KEY, JSON.stringify({
  mysteries: [{ mysteryId: 'volcanoville_x', solved: true }],
}))
{
  const v = getTownProgress('volcano')
  ok(v.mysterySolved === false, "'volcano' is NOT matched by 'volcanoville_x'")
}
// exact-id match (no topic suffix) still works
store.clear()
store.setItem(EXPLORER_KEY, JSON.stringify({ mysteries: [{ mysteryId: 'volcano', solved: true }] }))
ok(getTownProgress('volcano').mysterySolved === true, "bare town-id mystery still matches")

// --- T4: corrupt / malformed storage is inert (no throw, all-false) ------------
console.log('T4 — corrupt storage degrades to all-false, never throws')
store.clear()
store.setItem(INVESTIGATION_KEY, '{not json')
store.setItem(EXPLORER_KEY, '][')
{
  let threw = false
  let p: ReturnType<typeof getTownProgress> | null = null
  try { p = getTownProgress('volcano') } catch { threw = true }
  ok(!threw, 'no throw on malformed JSON')
  ok(!!p && !p.anySolved, 'all-false on malformed JSON')
}
// wrong shapes (investigations not an array, mysteries not an array)
store.clear()
store.setItem(INVESTIGATION_KEY, JSON.stringify({ nope: true }))
store.setItem(EXPLORER_KEY, JSON.stringify({ mysteries: 'not-an-array' }))
{
  let threw = false
  try { getTownProgress('volcano') } catch { threw = true }
  ok(!threw, 'no throw on wrong-typed shapes')
  ok(!getTownProgress('volcano').anySolved, 'all-false on wrong-typed shapes')
}

// --- T5: getTownProgressMap agrees with per-town getTownProgress ---------------
console.log('T5 — batch map matches per-town reads (no double-counting)')
store.clear()
store.setItem(INVESTIGATION_KEY, JSON.stringify(['volcano', 'murphys']))
store.setItem(EXPLORER_KEY, JSON.stringify({
  mysteries: [{ mysteryId: 'volcano_cannon', solved: true }, { mysteryId: 'angels_camp_frog', solved: true }],
}))
{
  const ids = ['volcano', 'murphys', 'angels_camp', 'san_andreas']
  const map = getTownProgressMap(ids)
  let agree = true
  for (const id of ids) {
    const single = getTownProgress(id)
    const m = map[id]
    if (!m || m.investigationSolved !== single.investigationSolved || m.mysterySolved !== single.mysterySolved ||
        m.anySolved !== single.anySolved || m.fullySolved !== single.fullySolved) { agree = false }
  }
  ok(agree, 'map and per-town reads are identical for every town')
  ok(map['volcano'].fullySolved === true, 'volcano fullySolved in batch')
  ok(map['murphys'].investigationSolved === true && map['murphys'].mysterySolved === false, 'murphys investigation-only in batch')
  ok(map['angels_camp'].mysterySolved === true && map['angels_camp'].investigationSolved === false, 'angels_camp mystery-only in batch')
  ok(map['san_andreas'].anySolved === false, 'san_andreas untouched in batch')
}

console.log('')
console.log(`townProgress unifier safety: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
