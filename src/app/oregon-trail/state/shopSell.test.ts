/**
 * G9 shop-sell contract (donor law). Preview must not invent a second price list.
 *
 *   T1  sell with stock decreases the resource and nothing else
 *   T2  sell without stock is a no-op
 *   T3  buy increases the resource
 *   T4  TownShop food sellPrice is half of basePrice (0.10 vs 0.20)
 *   T5  Independence town powder is Matt's box, sold by the round — no taco print
 *
 *   npx tsx src/app/oregon-trail/state/shopSell.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { readFileSync } from 'node:fs'
import {
  AMMO_BUY_PER_ROUND,
  AMMO_ROUNDS_PER_BOX,
  AMMO_SELL_PER_ROUND,
  WARE_WAGON,
  WARE_WAGON_PRICES,
} from '../data/wareWagon'
import { defaultSellAmount } from '../data/shopLots'

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

console.log('T5 — dual-shop powder is one list')
{
  ok(AMMO_ROUNDS_PER_BOX === 20, 'box is 20 rounds')
  ok(AMMO_BUY_PER_ROUND === 0.1, 'Matt $2 box is $0.10/rd')
  ok(AMMO_SELL_PER_ROUND === 0.05, 'town sell is half buy')
  const src = readFileSync(new URL('../components/TownShop.tsx', import.meta.url), 'utf8')
  const ammoBlock = src.slice(src.indexOf("id: 'ammo'"), src.indexOf("id: 'medicine'"))
  ok(/basePrice:\s*AMMO_BUY_PER_ROUND/.test(ammoBlock), 'town buy binds Ware per-round')
  ok(/sellPrice:\s*AMMO_SELL_PER_ROUND/.test(ammoBlock), 'town sell binds Ware half')
  ok(/quantity:\s*AMMO_ROUNDS_PER_BOX/.test(ammoBlock), 'town batch binds Matt box')
  ok(/unit:\s*'rd'/.test(ammoBlock), 'town unit is rounds')
  ok(/Math\.floor\(item\.sellPrice \* totalAmount\)/.test(src), 'handleSell mints floor(sellPrice * amount)')
  const reducerSrc = readFileSync(new URL('./reducer.ts', import.meta.url), 'utf8')
  ok(/ammo \* AMMO_ROUNDS_PER_BOX/.test(reducerSrc), 'purchase converts boxes to rounds')
  const outfitSrc = readFileSync(new URL('../phases/OutfittingScreen.tsx', import.meta.url), 'utf8')
  ok(!/Oxen \(pair\)/.test(outfitSrc), 'outfit oxen not labeled pair')
  ok(/unit: 'head'/.test(outfitSrc), 'outfit oxen unit is head')
  ok(/\$\{onHand\.ammo\} rd/.test(outfitSrc), 'outfit on-hand powder is rounds')
  const bought = gameReducer(base, {
    type: 'PURCHASE_SUPPLIES',
    supplies: { food: 0, ammo: WARE_WAGON.ammo, parts: 0, medicine: 0, oxen: 0 },
  })
  const rounds = WARE_WAGON.ammo * AMMO_ROUNDS_PER_BOX
  ok(bought.ammunition === base.ammunition + rounds, `Ware ${WARE_WAGON.ammo} boxes → ${rounds} rd`)
  const paid = WARE_WAGON.ammo * WARE_WAGON_PRICES.ammo
  // Same formula as TownShop handleSell: Math.floor(item.sellPrice * totalAmount)
  const townSell = Math.floor(AMMO_SELL_PER_ROUND * rounds)
  const oldMint = Math.floor(1 * rounds)
  ok(townSell <= paid, 'selling Ware powder at town cannot print tacos')
  ok(paid === 40 && townSell === 20, 'paid 40, town would give 20')
  ok(oldMint === 400 && oldMint > paid, 'the old $1/rd sell would have printed')
  ok(defaultSellAmount(AMMO_SELL_PER_ROUND, AMMO_ROUNDS_PER_BOX, rounds) === AMMO_ROUNDS_PER_BOX, 'Sell pill dumps one box')
  ok(defaultSellAmount(AMMO_SELL_PER_ROUND, AMMO_ROUNDS_PER_BOX, 19) === 0, 'short powder does not no-op-click')
  ok(defaultSellAmount(0.10, 50, 800) === 50, 'food Sell still dumps 50 lb')
  ok(defaultSellAmount(0.10, 50, 9) === 0, 'food under 10 lb cannot floor a taco')
  ok(/defaultSellAmount\(item\.sellPrice, item\.quantity, stock\)/.test(src), 'Sell pill binds the lot helper')
  ok(!/item\.resource === 'food' \? Math.min\(50, stock\) : 1/.test(src), 'old qty=1 ammo Sell is gone')
}

console.log(`\nshop-sell tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
