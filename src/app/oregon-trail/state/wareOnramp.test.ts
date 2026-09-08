/**
 * Ware pack + inn vs gate-only, no inn. Prints JSON for wheelwright.
 *   npx tsx src/app/oregon-trail/state/wareOnramp.test.ts
 */
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { WARE_WAGON, WARE_WAGON_COST, STARTING_NEUTRAL_FOR_WARE } from '../data/wareWagon'
import type { OregonTrailState } from './types'
import type { GameAction } from './actions'

const GATE = { food: 100, ammo: 0, parts: 0, medicine: 0, oxen: 2 }

function play(supplies: typeof GATE, inn: boolean): OregonTrailState {
  let s: OregonTrailState = gameReducer(DEFAULT_STATE, {
    type: 'START_GAME', leaderName: 'Mae', partyNames: ['Ada', 'Cole', 'Juniper'],
  })
  s = gameReducer(s, { type: 'PURCHASE_SUPPLIES', supplies })
  s = gameReducer(s, { type: 'BEGIN_JOURNEY' })
  s = gameReducer(s, { type: 'SET_PACE', pace: 'steady' })
  s = gameReducer(s, { type: 'SET_RATIONS', rations: 'filling' })
  let ticks = 0
  while (ticks++ < 500) {
    if (s.phase === 'gold_country_arrival' || s.phase === 'complete' || s.phase === 'game_over') break
    const minH = Math.min(...s.party.map(m => m.health))
    let action: GameAction
    if (s.phase === 'town') {
      if (inn && minH < 75) action = { type: 'REST_AT_INN', healthBonus: 30, moraleBonus: 15, cost: 10 }
      else if (s.food < 400 && s.ammunition >= 10) action = { type: 'HUNT' }
      else action = { type: 'LEAVE_TOWN' }
    } else if (s.phase === 'river') action = { type: 'CROSS_RIVER', method: 'ferry' }
    else if (s.phase === 'event' && s.currentEvent?.choices?.length) {
      action = { type: 'HANDLE_EVENT_CHOICE', choiceId: s.currentEvent.choices[0].id }
    } else if (s.phase === 'traveling') {
      if (s.food < 350 && s.ammunition >= 10) action = { type: 'HUNT' }
      else action = { type: 'TRAVEL' }
    } else break
    s = gameReducer(s, action)
  }
  return s
}

function tally(supplies: typeof GATE, inn: boolean, n = 12) {
  let gc = 0
  const ends: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const s = play(supplies, inn)
    const win = s.phase === 'gold_country_arrival' || s.distance >= 2000
    if (win) gc++
    ends[s.phase] = (ends[s.phase] || 0) + 1
  }
  return { gc, n, ends }
}

const gateNoInn = tally(GATE, false)
const wareInn = tally({ ...WARE_WAGON }, true)
const report = {
  ok: WARE_WAGON_COST <= STARTING_NEUTRAL_FOR_WARE
    && wareInn.gc >= 8
    && wareInn.gc >= gateNoInn.gc,
  ware_cost: WARE_WAGON_COST,
  starting_tacos: STARTING_NEUTRAL_FOR_WARE,
  ware_fits_purse: WARE_WAGON_COST <= STARTING_NEUTRAL_FOR_WARE,
  gate_no_inn: gateNoInn,
  ware_inn: wareInn,
  _conf: 1,
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exit(1)
