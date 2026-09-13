import assert from 'node:assert/strict'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { hasNewPartyDeath, passingForState, readPassingRecord } from './passing'
import type { OregonTrailState, PartyMember } from './types'

const leader: PartyMember = { id: 'leader', name: 'Mae Reed', health: 100, isSick: false, role: 'leader' }
const base: OregonTrailState = { ...DEFAULT_STATE, wagonLeader: leader.name, party: [leader], food: 100, oxen: 2, weather: 'fair', rations: 'filling', day: 10 }
const random = Math.random
let randomCalls = 0
Math.random = () => { randomCalls++; return 0.5 }
try {
  for (const phase of ['town', 'traveling'] as const) {
    let state: OregonTrailState = { ...base, phase, currentLandmark: 'Independence, Missouri' }
    const beforeRolls = randomCalls
    for (let shot = 0; shot < 3; shot++) state = gameReducer(state, { type: 'DRINK_GARGLE_BLASTER' })
    assert.equal(state.phase, 'game_over')
    assert.equal(state.passing?.kind, phase === 'town' ? 'town' : 'trail', 'classify the source phase, not the stale town landmark')
    assert.equal(state.passing?.cause, state.message)
    assert.match(state.passing!.cause, /third Pan Galactic Gargle Blaster/)
    assert.equal(state.passing?.fallenName, 'Mae Reed')
    assert.equal(randomCalls - beforeRolls, 3, 'provenance adds no random draws')
  }

  const riverBefore: OregonTrailState = { ...base, phase: 'river', currentLandmark: 'Kansas River Crossing', party: [{ ...leader, health: 30 }] }
  const river = gameReducer(riverBefore, { type: 'APPLY_RIVER_CROSSING_EFFECTS',
    effects: { healthDelta: -15, specificInjury: { memberId: 'leader', damage: 40, injuryType: 'swept_away' }, foodLost: 20, wagonDamage: 15, daysLost: 1 },
    message: 'A crossing disaster. The current swept Mae away.',
  })
  assert.equal(river.phase, 'game_over', 'lethal resolved river effects go directly to Passing')
  assert.equal(river.party[0].health, 0)
  assert.equal(river.food, 80); assert.equal(river.wagonCondition, 85)
  assert.equal(river.day, 11); assert.equal(river.riversCrossed, base.riversCrossed + 1)
  assert.deepEqual(river.passing, { kind: 'river', place: 'Kansas River Crossing', cause: river.message, fallenName: 'Mae Reed', day: 11, miles: base.totalMilesTraveled })
  const restored = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: JSON.parse(JSON.stringify(river)) })
  assert.deepEqual(restored.passing, river.passing)
  assert.equal(gameReducer(restored, { type: 'TRAVEL' }).passing, restored.passing, 'later travel cannot replace the terminal cause')

  const bridge = gameReducer({ ...base, phase: 'river' }, { type: 'APPLY_RIVER_CROSSING_EFFECTS', effects: { healthDelta: -15, foodLost: 20, daysLost: 1 }, message: 'Cast into the Gorge of Eternal Peril.' })
  assert.equal(bridge.phase, 'traveling')
  assert.equal(bridge.party[0].health, 85)
  assert.equal(bridge.food, 80); assert.equal(bridge.day, 11)
  assert.equal(bridge.passing, undefined, 'the existing nonfatal Bridge effects remain nonfatal')
  const partial = gameReducer({ ...riverBefore, party: [...riverBefore.party, { ...leader, id: 'other', role: 'companion', health: 100 }] }, { type: 'APPLY_RIVER_CROSSING_EFFECTS', effects: { specificInjury: { memberId: 'leader', damage: 40, injuryType: 'hypothermia' } }, message: 'One traveler was lost.' })
  assert.equal(partial.phase, 'traveling')
  assert.equal(partial.party[0].health, 0); assert.equal(partial.party[1].health, 100)
  assert.equal(partial.passing, undefined, 'a surviving party does not close its chapter')

  for (const id of ['dm_boss_claim_jumper', 'ordinary_trail_event']) {
    const eventBefore: OregonTrailState = { ...base, phase: 'event', previousPhase: 'town', party: [{ ...leader, health: 5 }], currentEvent: {
      id, title: 'An encounter', description: 'The choice is yours.', choices: [{ id: 'stand', text: 'Stand', outcome: { healthDelta: -10, message: 'The final exchange of shots.' } }],
    } }
    const event = gameReducer(eventBefore, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'stand', outcomeMessageOverride: 'Exact selected outcome: the final exchange of shots.' })
    assert.equal(event.phase, 'game_over')
    assert.equal(event.party[0].health, 0)
    assert.equal(event.currentEvent, null)
    assert.equal(event.passing?.kind, id.startsWith('dm_boss_') ? 'town' : 'trail', 'only town-interrupting DM events trust previousPhase')
    assert.equal(event.passing?.cause, 'Exact selected outcome: the final exchange of shots.')
  }

  for (const oxen of [0, 2]) {
    const travel = gameReducer({ ...base, phase: 'traveling', oxen, currentLandmark: 'Fort Kearny', rations: 'bare_bones', party: [{ ...leader, health: 1 }], message: 'An old nonfatal snake story.' }, { type: 'TRAVEL' })
    assert.equal(travel.phase, 'game_over')
    assert.equal(travel.party[0].health, 0, 'terminal travel preserves computed party health')
    assert.equal(travel.passing?.kind, 'trail')
    assert.equal(travel.passing?.cause, travel.message)
    assert.notEqual(travel.passing?.cause, 'An old nonfatal snake story.')
  }

  const old: OregonTrailState = { ...base, phase: 'game_over', currentLandmark: 'Fort Kearny', message: 'A preserved old ending.' }
  const loadedOld = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: old })
  assert.equal(loadedOld.passing, undefined)
  assert.equal(passingForState(loadedOld).kind, 'unknown', 'old landmark name cannot establish a town grave')
  assert.equal(passingForState(loadedOld).cause, old.message)
  const direct = gameReducer({ ...base, phase: 'town', message: 'An unrelated purchase.' }, { type: 'SET_PHASE', phase: 'game_over' })
  assert.equal(direct.passing?.kind, 'unknown')
  assert.notEqual(direct.passing?.cause, 'An unrelated purchase.')
  assert.equal(readPassingRecord({ kind: 'castle', place: 'X', cause: 'Y', fallenName: 'Z' }), undefined)
  assert.equal(readPassingRecord({ kind: 'town', place: 'X', cause: 42, fallenName: 'Z' }), undefined)
  assert.equal(gameReducer(river, { type: 'RESET_GAME' }).passing, undefined)
  assert.equal(hasNewPartyDeath([leader], []), false, 'desertion/empty party is not a calculated health death')
  assert.equal(hasNewPartyDeath([{ ...leader, health: 0 }], [{ ...leader, health: 0 }]), false, 'previously dead party does not generate a new cause')
} finally { Math.random = random }
console.log('Passing provenance: source location, resolved river/event mortality, unchanged nonfatal effects/RNG, terminal travel health and save compatibility PASS')
