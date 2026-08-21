/**
 * Donor read must not invent a person and must map SADDLE + visits + wallet.
 *   node_modules/.bin/tsx src/lib/bobrDepthDonor.test.ts
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

import { DONOR_KEYS, readDepthDonor, SADDLE_ORDER } from './bobrDepthDonor'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}`) }
}

console.log('T1 — empty store is empty, not a fake scout')
store.clear()
{
  const d = readDepthDonor()
  ok(d.source === 'empty' && d.name === null, 'no invented name')
  ok(d.wallet.tacos === 0 && d.wallet.cookies === 0 && d.wallet.coal === 0, 'wallet zeros')
}

console.log('T2 — SADDLE person + visits + wallet')
store.setItem(DONOR_KEYS.character, JSON.stringify({
  name: 'Neoma',
  background: 'pinkerton_veteran',
  stats: { Shrewdness: 7, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 7 },
  traits: ['hoopy_frood'],
}))
store.setItem(DONOR_KEYS.visits, JSON.stringify({ 'Fort Kearny': 1 }))
store.setItem(DONOR_KEYS.wallet, JSON.stringify({ balance: { neutral: 12, good: 3, bad: 1 } }))
{
  const d = readDepthDonor()
  ok(d.source === 'local_donor' && d.name === 'Neoma', 'name from bobr_ot_character')
  ok(d.saddle.Shrewdness === 7 && d.saddle.Expertise === 7, 'SADDLE letters not STR/DEX')
  ok(SADDLE_ORDER.length === 6, 'six SADDLE letters')
  ok(d.visits['Fort Kearny'] === 1, 'family visit ledger')
  ok(d.wallet.tacos === 12 && d.wallet.cookies === 3 && d.wallet.coal === 1, 'tacos/cookies/coal')
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
