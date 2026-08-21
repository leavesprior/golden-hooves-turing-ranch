/**
 * G9 shop-sell contract (donor law). Preview must not invent a second price list.
 *
 *   T1  sell with stock decreases the resource and nothing else
 *   T2  sell without stock is a no-op
 *   T3  buy increases the resource
 *   T4  TownShop food sellPrice is half of basePrice (0.10 vs 0.20)
 *
 *   npx tsx src/app/oregon-trail/state/shopSell.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { readFileSync } from 'node:fs'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const base = { ...DEFAULT_STATE, food: 80, ammunition: 20, medicine: 1 }

console.log('T1 — sell with stock')
{
  const next = gameReducer(base, { type: 'SELL_SUPPLIES', resource: 'food', amount: 50, karmaGained: 0 })
  ok(next.food === 30, 'food 80-50=30')
  ok(next.ammunition === 20 && next.day === base.day, 'ammo and day unchanged')
}

console.log('T2 — sell without stock is a no-op')
{
  const next = gameReducer(base, { type: 'SELL_SUPPLIES', resource: 'food', amount: 81, karmaGained: 0 })
  ok(next.food === 80, 'short sell leaves stock')
}

console.log('T3 — buy increases stock')
{
  const next = gameReducer(base, { type: 'BUY_SUPPLIES', resource: 'ammunition', amount: 20, cost: 0 })
  ok(next.ammunition === 40, 'ammo 20+20=40')
}

console.log('T4 — TownShop food sell is half buy (source pin, no export)')
{
  const src = readFileSync(new URL('../components/TownShop.tsx', import.meta.url), 'utf8')
  const foodBlock = src.slice(src.indexOf("id: 'food'"), src.indexOf("id: 'ammo'"))
  ok(/basePrice:\s*0\.20/.test(foodBlock), 'food buy 0.20')
  ok(/sellPrice:\s*0\.10/.test(foodBlock), 'food sell 0.10 (half)')
}

console.log(`\nshop-sell tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
