/**
 * Safety regression for the town-visit ledger (towns that remember you).
 *
 * The ledger must survive resetGame() (family memory) and must NOT increment
 * when TownScreen remounts on the same arrival day (Journal / Investigate
 * are sibling phases; React Strict Mode remounts in dev).
 *
 *   T1  getVisitTier bands
 *   T2  generic arrival fallback for a live landmark with no authored set
 *   T3  recordTownArrival is idempotent on (name, arrivalDay)
 *   T4  a later arrivalDay still increments
 *   T5  corrupt storage degrades (no throw)
 *
 *   node_modules/.bin/tsx src/app/oregon-trail/lib/townVisits.test.ts
 */

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
  removeItem(k: string): void { this.m.delete(k) }
  clear(): void { this.m.clear() }
}
const store = new MockStorage()
;(globalThis as { window?: unknown }).window = { localStorage: store }

import { getVisitTier, getTownArrivalMessage } from '../data/townArrivals'
import { getTownVisitCount, recordTownArrival, recordTownVisit } from './townVisits'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('T1 — getVisitTier bands')
ok(getVisitTier(0) === 'first', '0 => first')
ok(getVisitTier(1) === 'return', '1 => return')
ok(getVisitTier(2) === 'familiar', '2 => familiar')
ok(getVisitTier(4) === 'familiar', '4 => familiar')
ok(getVisitTier(5) === 'regular', '5 => regular')

console.log('T2 — generic fallback for a live landmark with no authored set')
{
  const msg = getTownArrivalMessage('Raft River', 0)
  ok(!!msg && typeof msg.text === 'string' && msg.text.length > 0, 'Raft River first visit returns a generic line')
  ok(!!msg && ['welcoming', 'suspicious', 'weary', 'mysterious', 'business', 'foreboding'].includes(msg.mood), 'mood is a known tint')
}

console.log('T3 — recordTownArrival is idempotent on (name, arrivalDay)')
store.clear()
{
  const first = recordTownArrival('Fort Kearny', 12)
  const remount = recordTownArrival('Fort Kearny', 12)
  ok(first.recorded === true && first.prior === 0, 'first arrival records prior=0', JSON.stringify(first))
  ok(remount.recorded === false && remount.prior === 0, 'same-day remount does not increment', JSON.stringify(remount))
  ok(getTownVisitCount('Fort Kearny') === 1, 'ledger stays at 1 after remount')
}

console.log('T4 — a later arrivalDay still increments')
{
  const next = recordTownArrival('Fort Kearny', 40)
  ok(next.recorded === true && next.prior === 1, 'return visit records prior=1', JSON.stringify(next))
  ok(getTownVisitCount('Fort Kearny') === 2, 'ledger is 2 after a later day')
}

console.log('T5 — corrupt storage degrades')
store.setItem('bobr_town_visits', '{not json')
{
  let threw = false
  let prior = -1
  try { prior = recordTownVisit('West Point') } catch { threw = true }
  ok(!threw, 'recordTownVisit does not throw on corrupt JSON')
  ok(prior === 0, 'corrupt ledger treated as empty', `prior=${prior}`)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
