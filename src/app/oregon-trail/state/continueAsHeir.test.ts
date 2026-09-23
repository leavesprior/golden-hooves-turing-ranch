import assert from 'node:assert/strict'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { heirFor, HEIR_HEALTH, HEIR_RELIEF_FOOD, HEIR_RELIEF_OXEN } from './passing'
import type { OregonTrailState } from './types'

// Playtest 2026-09-23: "Continue as heir" dispatched RESET_GAME, so the heir
// inherited nothing and Continue reloaded an older save of the doomed run.
const random = Math.random
Math.random = () => 0.5
try {
  const alive: OregonTrailState = {
    ...DEFAULT_STATE, phase: 'traveling', wagonLeader: 'Mae Reed',
    party: [
      { id: 'leader', name: 'Mae Reed', health: 1, isSick: false, role: 'leader' },
      { id: 'member_0', name: 'Tom', health: 1, isSick: false, role: 'companion' },
    ],
    rations: 'bare_bones', food: 12, oxen: 3, ammunition: 40, medicine: 2, spareParts: 1,
    distance: 1400, totalMilesTraveled: 1400, day: 90, daysOnTrail: 89,
    currentLandmark: 'Humboldt Sink', nextLandmark: 'Forty Mile Desert', milesUntilNextLandmark: 60,
    inventory: ['lucky_pan', 'compass'], completedQuests: ['q1'],
  }
  const ended = gameReducer(alive, { type: 'TRAVEL' })
  assert.equal(ended.phase, 'game_over', 'fixture must reach a real Passing')
  assert.ok(ended.passing, 'passing record attached')

  const heir = gameReducer(ended, { type: 'CONTINUE_AS_HEIR' })
  assert.notDeepEqual(heir, DEFAULT_STATE, 'the heir does not reset the run')
  assert.equal(heir.phase, 'traveling', 'play resumes on the trail')
  assert.equal(heir.currentEvent, null)
  for (const key of ['distance', 'totalMilesTraveled', 'day', 'currentLandmark', 'nextLandmark', 'milesUntilNextLandmark', 'ammunition', 'medicine', 'spareParts', 'wagonCondition', 'livingTrail', 'passing'] as const) {
    assert.deepEqual(heir[key], ended[key], `${key} carries forward`)
  }
  assert.deepEqual(heir.inventory, ['lucky_pan', 'compass'])
  assert.deepEqual(heir.completedQuests, ['q1'])
  assert.equal(heir.food, 12, 'no food relief when the wagon still has food')
  assert.equal(heir.oxen, 3, 'no oxen relief when the yoke is not empty')
  assert.equal(heir.party.length, 1)
  const [leader] = heir.party
  assert.equal(leader.role, 'leader')
  assert.equal(leader.name, "Reed's heir")
  assert.equal(leader.health, HEIR_HEALTH)
  assert.equal(leader.heirloomTrait, 'heir_of_mae_reed')
  assert.equal(heir.wagonLeader, "Reed's heir")
  assert.deepEqual(heirFor(ended), { name: "Reed's heir", heirloomTrait: 'heir_of_mae_reed' }, 'screen label and reducer share one derivation')

  // Death spiral breaker: relief only for what is at zero.
  const starved = gameReducer({ ...ended, food: 0, oxen: 0 }, { type: 'CONTINUE_AS_HEIR' })
  assert.equal(starved.food, HEIR_RELIEF_FOOD)
  assert.equal(starved.oxen, HEIR_RELIEF_OXEN)
  const noFoodOnly = gameReducer({ ...ended, food: 0 }, { type: 'CONTINUE_AS_HEIR' })
  assert.equal(noFoodOnly.food, HEIR_RELIEF_FOOD)
  assert.equal(noFoodOnly.oxen, 3)

  // The continued run travels: miles only go forward from here.
  const next = gameReducer(heir, { type: 'TRAVEL' })
  assert.ok(next.totalMilesTraveled >= heir.totalMilesTraveled, 'miles never go backward')
  assert.notEqual(next.phase, 'game_over', 'the heir survives the next day')

  // Second generation keeps the family name, not "heir's heir".
  assert.equal(heirFor({ ...heir, phase: 'game_over' }).name, "Reed's heir")

  // Only valid from a Passing; RESET_GAME still starts over.
  assert.equal(gameReducer(alive, { type: 'CONTINUE_AS_HEIR' }), alive)
  assert.equal(gameReducer(ended, { type: 'RESET_GAME' }), DEFAULT_STATE)
} finally {
  Math.random = random
}
console.log('continueAsHeir: ok')
