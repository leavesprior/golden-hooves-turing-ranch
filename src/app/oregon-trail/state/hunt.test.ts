/**
 * G9 hunt contract (donor law). Preview must not invent a minigame or re-nerf yield.
 *
 *   T1  ammo < 10 is a no-op (message only)
 *   T2  a hunt always costs a day
 *   T3  ammo spend is 5–14 inclusive, even on a miss
 *   T4  hit (~70%) adds 50–249 lb food; miss adds 0
 *   T5  message carries the number and "The hunt took a full day."
 *
 *   npx tsx src/app/oregon-trail/state/hunt.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function withRandom(seq: number[], fn: () => void) {
  const orig = Math.random
  let i = 0
  Math.random = () => {
    const v = seq[Math.min(i, seq.length - 1)]
    i += 1
    return v
  }
  try { fn() } finally { Math.random = orig }
}

const base = { ...DEFAULT_STATE, ammunition: 20, food: 80, day: 3, animalsKilled: 0 }

console.log('T1 — not enough powder is a no-op')
{
  const dry = gameReducer({ ...base, ammunition: 9 }, { type: 'HUNT' })
  ok(dry.ammunition === 9 && dry.food === 80 && dry.day === 3, 'ammo/food/day unchanged below 10')
  ok(dry.message === 'Not enough ammunition to hunt!', 'dry message is the donor line')
}

console.log('T2+T3+T4 — hit: day+1, ammo 5–14, food 50–249')
withRandom([0.5, 0.0], () => {
  // roll 0.5 => hit ( > 0.3 ); ammoUsed = floor(0*10)+5 = 5; food = floor(0*200)+50 = 50
  const next = gameReducer(base, { type: 'HUNT' })
  ok(next.day === 4, 'hunt costs a day')
  ok(next.ammunition === 15, 'ammo spend 5 on this seed')
  ok(next.food === 130, 'food +50 on this seed (do not re-nerf the 50–249 band)')
  ok(next.animalsKilled === 1, 'success increments animalsKilled')
  ok(typeof next.message === 'string' && next.message.includes('Gained 50 pounds of food.'), 'result sentence has the number')
  ok(typeof next.message === 'string' && next.message.includes('The hunt took a full day.'), 'day cost is spoken')
})

console.log('T4 miss — food stays, still a day and powder')
withRandom([0.2, 0.9], () => {
  // roll 0.2 => miss; ammoUsed = floor(0.9*10)+5 = 14
  const next = gameReducer(base, { type: 'HUNT' })
  ok(next.food === 80, 'miss adds 0 food')
  ok(next.day === 4, 'miss still costs a day')
  ok(next.ammunition === 6, 'ammo spend 14 on this seed')
  ok(next.animalsKilled === 0, 'miss does not increment animalsKilled')
  ok(typeof next.message === 'string' && next.message.includes('The hunt took a full day.'), 'miss still names the day')
  ok(typeof next.message === 'string' && !next.message.includes('Gained'), 'miss has no gain clause')
})

console.log(`\nhunt tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
