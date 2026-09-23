import assert from 'node:assert/strict'
import { DEFAULT_STATE, RANDOM_EVENTS } from './constants'
import { computeTravel, EVENT_COOLDOWN } from './travelEngine'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'

// Playtest 2026-09-23: Oxen Thieves 5x, Singing Wheel 5x, Starving Family twice
// in 3 days. With Math.random pinned, the old picker returned the SAME event
// every time an event fired.
const base: OregonTrailState = {
  ...DEFAULT_STATE, phase: 'traveling', wagonLeader: 'Mae',
  party: [{ id: 'leader', name: 'Mae', health: 100, isSick: false, role: 'leader' }],
  food: 5000, oxen: 4, medicine: 50, ammunition: 500, spareParts: 5, clothing: 10, morale: 100, distance: 200, totalMilesTraveled: 200, milesUntilNextLandmark: 100000,
  nextLandmark: 'Nowhere Yet', currentLandmark: '',
}

const random = Math.random
Math.random = () => 0   // every roll: event fires, index 0 of the pool
try {
  let state = base
  const seen: string[] = []
  for (let i = 0; i < 12; i++) {
    state = computeTravel(state)
    assert.equal(state.phase, 'event')
    seen.push(state.currentEvent!.id)
    state = { ...state, phase: 'traveling', currentEvent: null }
  }
  for (let i = 0; i < seen.length; i++) {
    const window = seen.slice(Math.max(0, i - EVENT_COOLDOWN), i)
    assert.ok(!window.includes(seen[i]), `${seen[i]} recurred within ${EVENT_COOLDOWN} events: ${seen.join(',')}`)
  }
  assert.ok(state.recentEventIds!.length <= EVENT_COOLDOWN, 'the memory is bounded')
  assert.deepEqual(state.recentEventIds, seen.slice(-EVENT_COOLDOWN))
  assert.ok(RANDOM_EVENTS.length > EVENT_COOLDOWN, 'cooldown never empties the pool')

  // Old saves without the field travel fine and gain it on LOAD_STATE.
  const legacy = { ...base } as Partial<OregonTrailState>
  delete legacy.recentEventIds
  const loaded = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: legacy as OregonTrailState })
  assert.deepEqual(loaded.recentEventIds, [])
  assert.equal(computeTravel(legacy as OregonTrailState).currentEvent!.id, RANDOM_EVENTS[0].id)
} finally {
  Math.random = random
}
console.log('eventCooldown: ok')
