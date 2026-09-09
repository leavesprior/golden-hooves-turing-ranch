/**
 * Trail hunker costs a day and rations. Does not move miles. Does not auto.
 *   node_modules/.bin/tsx src/app/oregon-trail/state/hunker.test.ts
 */
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const traveling: OregonTrailState = {
  ...DEFAULT_STATE,
  phase: 'traveling',
  day: 80,
  daysOnTrail: 79,
  distance: 1790,
  milesUntilNextLandmark: 40,
  food: 556,
  morale: 40,
  rations: 'filling',
  party: [
    { id: 'ada', name: 'Ada', health: 20, isSick: false, role: 'leader' },
    { id: 'cole', name: 'Cole', health: 18, isSick: false, role: 'companion' },
  ],
}

const after = gameReducer(traveling, { type: 'HUNKER' })
ok(after.phase === 'traveling', 'stays on the trail')
ok(after.distance === 1790, 'does not move miles')
ok(after.day === 81, 'costs a day')
ok(after.daysOnTrail === 80, 'counts a trail day')
ok(after.food === 556 - 6, 'eats filling rations for two (3 each)')
ok(after.party[0].health === 30, 'heals 10')
ok(after.party[1].health === 28, 'heals the second rider 10')
ok(after.morale === 45, 'morale +5')
ok(/hunker/i.test(after.message || ''), 'says hunker')

const town = gameReducer({ ...traveling, phase: 'town' }, { type: 'HUNKER' })
ok(town.day === 80 && town.food === 556, 'town hunker is a no-op')

const twice = gameReducer(after, { type: 'HUNKER' })
ok(twice.day === 82, 'second hunker is still a click, not auto')
ok(twice.distance === 1790, 'still no miles')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({
  ok: true,
  passed,
  food_spent: traveling.food - after.food,
  hp: after.party[0].health,
  day: after.day,
  miles: after.distance,
}))
