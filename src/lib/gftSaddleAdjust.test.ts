/**
 * node_modules/.bin/tsx src/lib/gftSaddleAdjust.test.ts
 */
import { applySaddleAdjust } from './gftSaddleAdjust'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

const base = { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 }

let s = { ...base }
let rem = 12
for (let i = 0; i < 20; i++) {
  const next = applySaddleAdjust(s, rem, 'Shrewdness', 1, 5, 18)
  if (!next) break
  s = next.stats
  rem = next.remaining
}
ok(s.Shrewdness === 17, 'twelve points land on Shrewdness (5+12)')
ok(rem === 0, 'remaining hits 0, extra clicks do not spend')
ok(applySaddleAdjust(s, rem, 'Shrewdness', 1, 5, 18) === null, 'click 13 is refused')

const down = applySaddleAdjust(s, 0, 'Shrewdness', -1, 5, 18)
ok(!!down && down.stats.Shrewdness === 16 && down.remaining === 1, 'minus refunds a point')

ok(applySaddleAdjust(base, 12, 'Shrewdness', -1, 5, 18) === null, 'cannot go below buy-in min')
ok(applySaddleAdjust({ ...base, Shrewdness: 18 }, 3, 'Shrewdness', 1, 5, 18) === null, 'cannot exceed 18')
ok(applySaddleAdjust(base, 12, 'Shrewdness', 2, 5, 18) === null, 'only ±1')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`gftSaddleAdjust tests passed (${passed})`)
