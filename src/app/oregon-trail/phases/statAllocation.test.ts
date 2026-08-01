import assert from 'node:assert/strict'
import {
  MAX_STAT,
  POOL_POINT_BUY,
  POOL_ROLLED,
  STAT_KEYS,
  applyAdjustment,
  allocationLabel,
  isAllocationComplete,
  pointsRemaining,
  type StatBlock,
} from './statAllocation'

const flat = (n: number): StatBlock => ({
  Shrewdness: n, Agility: n, Durability: n, Diplomacy: n, Luck: n, Expertise: n,
})

const BASE = flat(3)

// 1. Fresh point-buy starts with the full pool and is not complete.
assert.equal(pointsRemaining(BASE, BASE, false), POOL_POINT_BUY, 'point-buy starts at 12')
assert.equal(isAllocationComplete(BASE, BASE, false), false, 'unspent pool is not complete')

// 2. A roll pays you in dice, so the pool shrinks. Rolled stats are their own base.
const rolled = { ...flat(3), Shrewdness: 14, Luck: 11 }
assert.equal(pointsRemaining(rolled, rolled, true), POOL_ROLLED, 'rolled pool is 6')

// 3. THE REGRESSION THIS FILE EXISTS FOR.
//    A playtest reached -24 by clicking `+` faster than React re-rendered: the old
//    guard read `pointsRemaining` from a stale closure, so every click in one batch
//    tested the same pre-batch value and all passed. Folding many adjustments in a
//    row is exactly that batch. The pool must never go below zero, however hard the
//    button is mashed.
let spam: StatBlock = BASE
for (let i = 0; i < 200; i++) {
  spam = applyAdjustment(spam, BASE, false, STAT_KEYS[i % STAT_KEYS.length], +1)
  assert.ok(
    pointsRemaining(spam, BASE, false) >= 0,
    `pool went negative on click ${i} — the batch-fold guard regressed`,
  )
}
assert.equal(pointsRemaining(spam, BASE, false), 0, '200 clicks must settle at exactly 0, not below')

// 4. A rejected move returns the SAME reference, so React skips the re-render and
//    a refused click is free.
const settled = spam
assert.equal(applyAdjustment(settled, BASE, false, 'Luck', +1), settled, 'overspend returns prev ref')

// 5. The per-stat ceiling holds under the same mashing.
let tall: StatBlock = { ...flat(1), Shrewdness: 17 }
for (let i = 0; i < 50; i++) tall = applyAdjustment(tall, flat(1), false, 'Shrewdness', +1)
assert.ok(tall.Shrewdness <= MAX_STAT, 'stat ceiling must survive rapid clicks')

// 6. The floor holds too, and dumping below base funds other stats (point-buy only).
let dumped: StatBlock = BASE
for (let i = 0; i < 50; i++) dumped = applyAdjustment(dumped, BASE, false, 'Luck', -1)
assert.equal(dumped.Luck, 1, 'point-buy floor is 1')
assert.equal(pointsRemaining(dumped, BASE, false), POOL_POINT_BUY + 2, 'dumping 3->1 funds 2 points')

// 7. After a roll you keep what the dice gave — no dumping below the roll.
const rolledBase = { ...flat(3), Durability: 15 }
const noDump = applyAdjustment(rolledBase, rolledBase, true, 'Durability', -1)
assert.equal(noDump, rolledBase, 'rolled stats cannot be dumped below the roll')

// 8. The label must never say "Begin the Hunt" while the pool is wrong. The old
//    ternary sent every non-positive value there, including negatives, which is
//    what made the soft-lock silent.
assert.equal(allocationLabel(12, true), 'Assign 12 more points')
assert.equal(allocationLabel(0, true), 'Begin the Hunt')
assert.equal(allocationLabel(-3, true), 'Remove 3 points', 'negative must NOT read as ready')
assert.equal(allocationLabel(0, false), 'Select a background', 'background gate wins')

console.log('statAllocation tests passed')
