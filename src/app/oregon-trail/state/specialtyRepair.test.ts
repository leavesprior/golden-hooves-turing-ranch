/**
 * Wagonwright repair must move wagon condition, not a dummy spareParts 0.
 *   npx tsx src/app/oregon-trail/state/specialtyRepair.test.ts
 */
import { readFileSync } from 'node:fs'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}`) }
}

const src = readFileSync(new URL('../components/SpecialtyShop.tsx', import.meta.url), 'utf8')
const block = src.slice(src.indexOf("case 'wagon_repair'"), src.indexOf("case 'wagon_upgrade'"))

ok(/repairWagon\(\)/.test(block), 'wagonwright calls repairWagon')
ok(/buySupplies\('spareParts', ticks, 0\)/.test(block), 'taco job issues the parts it then spends')
ok(!/buySupplies\('spareParts', 0, 0\)/.test(src), 'dummy spareParts 0 is gone')
ok(/wagonCondition >= 100/.test(src), 'does not charge when the wagon is already sound')

let s = { ...DEFAULT_STATE, wagonCondition: 40, spareParts: 0 }
s = gameReducer(s, { type: 'BUY_SUPPLIES', resource: 'spareParts', amount: 2, cost: 0 })
s = gameReducer(s, { type: 'REPAIR_WAGON' })
s = gameReducer(s, { type: 'REPAIR_WAGON' })
ok(s.wagonCondition === 90, 'two ticks 40→90')
ok(s.spareParts === 0, 'issued parts were spent')

const full = gameReducer(
  { ...DEFAULT_STATE, wagonCondition: 100, spareParts: 1 },
  { type: 'REPAIR_WAGON' },
)
ok(full.wagonCondition === 100 && full.spareParts === 1, 'sound wagon is a no-op')

console.log(`\nspecialty-repair tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
