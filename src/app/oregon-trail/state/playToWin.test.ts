/**
 * Play to Gold Country: filling + steady + hunt + inn rest.
 * Writes a win save the live UI can load.
 *
 *   npx tsx src/app/oregon-trail/state/playToWin.test.ts
 */

import { mkdirSync, writeFileSync } from 'fs'
import { DEFAULT_STATE, RANDOM_EVENTS } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'
import type { GameAction } from './actions'

function pickSafestChoice(state: OregonTrailState): string {
  const ev = state.currentEvent
  if (!ev?.choices?.length) return ''
  let best = ev.choices[0]
  let bestScore = -999
  for (const c of ev.choices) {
    const o = c.outcome || {}
    const score =
      (o.healthDelta || 0) * 4 +
      (o.foodDelta || 0) * 0.05 +
      (o.ammoDelta || 0) * 0.1 -
      (o.daysLost || 0)
    if (score > bestScore) { bestScore = score; best = c }
  }
  return best.id
}

function playToWin(): { state: OregonTrailState; ticks: number; log: string[] } {
  const log: string[] = []
  let state: OregonTrailState = gameReducer(DEFAULT_STATE, {
    type: 'START_GAME',
    leaderName: 'Guest_Pioneer',
    partyNames: ['Ada', 'Cole', 'Juniper'],
  })
  state = gameReducer(state, {
    type: 'PURCHASE_SUPPLIES',
    supplies: { food: 1800, ammo: 120, parts: 6, medicine: 8, oxen: 4 },
  })
  state = gameReducer(state, { type: 'BEGIN_JOURNEY' })
  state = gameReducer(state, { type: 'SET_PACE', pace: 'steady' })
  state = gameReducer(state, { type: 'SET_RATIONS', rations: 'filling' })

  let ticks = 0
  while (ticks < 500) {
    ticks += 1
    const minHealth = Math.min(...state.party.map(m => m.health))
    let action: GameAction

    if (state.phase === 'gold_country_arrival' || state.phase === 'complete' || state.phase === 'game_over') {
      log.push(`end ${state.phase} day=${state.day} dist=${state.distance} food=${state.food} hp=${minHealth}`)
      break
    }
    if (state.phase === 'town') {
      if (minHealth < 75) action = { type: 'REST_AT_INN', healthBonus: 30, moraleBonus: 15, cost: 10 }
      else if (state.food < 400 && state.ammunition >= 10) action = { type: 'HUNT' }
      else action = { type: 'LEAVE_TOWN' }
    } else if (state.phase === 'river') {
      action = { type: 'CROSS_RIVER', method: 'ferry' }
    } else if (state.phase === 'event' && state.currentEvent?.choices?.length) {
      action = { type: 'HANDLE_EVENT_CHOICE', choiceId: pickSafestChoice(state) }
    } else if (state.phase === 'traveling') {
      if (state.food < 350 && state.ammunition >= 10) action = { type: 'HUNT' }
      else action = { type: 'TRAVEL' }
    } else {
      log.push(`unhandled ${state.phase}`)
      break
    }
    state = gameReducer(state, action)
  }
  return { state, ticks, log }
}

const run = playToWin()
const won = run.state.phase === 'gold_country_arrival' || run.state.distance >= 2000
console.log(`phase=${run.state.phase} day=${run.state.day} dist=${run.state.distance} food=${run.state.food} ticks=${run.ticks}`)
console.log(run.log.slice(-3).join('\n'))
console.log(won ? 'WIN' : 'NO_WIN')

if (won) {
  const payload = {
    savedAt: new Date().toISOString(),
    state: {
      ...run.state,
      // keep presentation pinned
      graphicsTier: 'ultra_64bit',
    },
  }
  mkdirSync('/tmp/bobr-play', { recursive: true })
  writeFileSync('/tmp/bobr-play/win-save.json', JSON.stringify(payload))
  console.log('wrote /tmp/bobr-play/win-save.json')
}

if (!won) process.exit(1)
