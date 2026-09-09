/**
 * Gold Country gunsmith must stock the wagon it charges for.
 *   npx tsx src/app/oregon-trail/state/gunsmithStock.test.ts
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

const src = readFileSync(new URL('../components/Gunsmith.tsx', import.meta.url), 'utf8')
const buy = src.slice(src.indexOf('handleBuyAmmo'), src.indexOf('rifleTypes'))

ok(/spendNeutral\(cost/.test(buy), 'gunsmith charges Neutral')
ok(/buySupplies\('ammunition', ammoAmount, 0\)/.test(buy), 'gunsmith stocks wagon rounds')
ok(buy.indexOf('spendNeutral') < buy.indexOf("buySupplies('ammunition'"), 'charge then stock, not stock then charge')
ok(!/for now we just show the message/.test(buy), 'the old taco-sink comment is gone')

const next = gameReducer(
  { ...DEFAULT_STATE, ammunition: 10 },
  { type: 'BUY_SUPPLIES', resource: 'ammunition', amount: 50, cost: 0 },
)
ok(next.ammunition === 60, '50 rd credited is 10+50')

console.log(`\ngunsmith-stock tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
