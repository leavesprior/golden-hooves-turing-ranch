/**
 * Play many full journeys through the reducer. Catches throws that white-screen
 * the tab when the player actually tries Hunt / Continue / river / events.
 *
 *   npx tsx src/app/oregon-trail/state/playMany.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'
import type { GameAction } from './actions'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function playOne(seedLabel: string): { state: OregonTrailState; ticks: number; log: string[] } {
  const log: string[] = []
  let state: OregonTrailState = gameReducer(DEFAULT_STATE, {
    type: 'START_GAME',
    leaderName: `Lead_${seedLabel}`,
    partyNames: ['Lilith', 'Neoma', 'Bevan'],
  })
  state = gameReducer(state, {
    type: 'PURCHASE_SUPPLIES',
    supplies: { food: 400, ammo: 80, parts: 4, medicine: 6, oxen: 4 },
  })
  state = gameReducer(state, { type: 'BEGIN_JOURNEY' })
  log.push(`begin ${state.phase} @ ${state.currentLandmark}`)

  let ticks = 0
  const MAX = 400
  while (ticks < MAX) {
    ticks += 1
    const before = `${state.phase}:${state.day}:${state.distance}`
    let action: GameAction
    if (state.phase === 'town') {
      if (ticks % 7 === 0 && state.ammunition >= 10) action = { type: 'HUNT' }
      else action = { type: 'LEAVE_TOWN' }
    } else if (state.phase === 'river') {
      const methods = ['ford', 'ferry', 'caulk', 'swim'] as const
      action = { type: 'CROSS_RIVER', method: methods[ticks % methods.length] as 'ford' | 'ferry' | 'caulk' }
    } else if (state.phase === 'event' && state.currentEvent?.choices?.length) {
      const choice = state.currentEvent.choices[ticks % state.currentEvent.choices.length]
      action = { type: 'HANDLE_EVENT_CHOICE', choiceId: choice.id }
    } else if (state.phase === 'traveling') {
      if (ticks % 11 === 0 && state.ammunition >= 10) action = { type: 'HUNT' }
      else if (ticks % 13 === 0) action = { type: 'SET_PACE', pace: ticks % 2 ? 'grueling' : 'steady' }
      else if (ticks % 17 === 0) action = { type: 'SET_RATIONS', rations: ticks % 2 ? 'meager' : 'filling' }
      else action = { type: 'TRAVEL' }
    } else if (state.phase === 'gold_country_arrival' || state.phase === 'complete' || state.phase === 'game_over' || state.phase === 'settlement_victory') {
      log.push(`end ${state.phase} day=${state.day} dist=${state.distance} ticks=${ticks}`)
      break
    } else {
      log.push(`unhandled phase ${state.phase} at tick ${ticks}`)
      break
    }
    state = gameReducer(state, action)
    if (`${state.phase}:${state.day}:${state.distance}` === before && action.type !== 'HUNT' && action.type !== 'SET_PACE' && action.type !== 'SET_RATIONS') {
      // Leave-town then travel should change something; a hard stuck is a crash analogue.
      if (action.type === 'TRAVEL' && state.phase === 'traveling') {
        throw new Error(`TRAVEL no-op at ${before}`)
      }
    }
  }
  if (ticks >= MAX) log.push(`hit cap day=${state.day} dist=${state.distance} phase=${state.phase}`)
  return { state, ticks, log }
}

console.log('play-many — 12 journeys, hunt/river/event/pace mixed')
const ends: string[] = []
for (let i = 0; i < 12; i++) {
  try {
    const run = playOne(String(i))
    ends.push(run.state.phase)
    const reached =
      run.state.phase === 'gold_country_arrival' ||
      run.state.distance >= 2000 ||
      run.state.phase === 'game_over'
    ok(reached, `run ${i} finished (${run.state.phase} day ${run.state.day} ${run.state.distance}mi in ${run.ticks} ticks)`)
    if (!reached) console.error('    ', run.log.slice(-4).join(' | '))
  } catch (e) {
    ok(false, `run ${i} threw`, String(e))
  }
}

console.log('play-many — corrupt save load then travel')
{
  const dirty = gameReducer(DEFAULT_STATE, {
    type: 'LOAD_STATE',
    savedState: {
      phase: 'traveling',
      day: 67,
      distance: 0,
      nextLandmark: 'A Town That Never Was',
      currentLandmark: 'Independence, Missouri',
      milesUntilNextLandmark: 0,
      food: 40,
      ammunition: 20,
      party: [{ id: 'leader', name: 'Rabbit', health: 80, isSick: false, role: 'leader' }],
    } as OregonTrailState,
  })
  let threw = false
  try {
    gameReducer(dirty, { type: 'TRAVEL' })
    gameReducer(dirty, { type: 'HUNT' })
    gameReducer(dirty, { type: 'CROSS_RIVER', method: 'ford' })
  } catch (e) {
    threw = true
    console.error(e)
  }
  ok(!threw, 'corrupt Independence save does not throw on travel/hunt/river')
}

console.log(`\nplay-many tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
