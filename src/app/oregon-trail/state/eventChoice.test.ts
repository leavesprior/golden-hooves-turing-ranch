/**
 * G9 trail-choice contract. A choice must change a number. No new emoji spine.
 *
 *   T1  starving_family / share_food subtracts 40 food
 *   T2  unknown choiceId is a no-op
 *   T3  daysLost advances the day
 *
 *   npx tsx src/app/oregon-trail/state/eventChoice.test.ts
 */

import { DEFAULT_STATE, RANDOM_EVENTS } from './constants'
import { gameReducer } from './reducer'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const starving = RANDOM_EVENTS.find(e => e.id === 'starving_family')
const gold = RANDOM_EVENTS.find(e => e.id === 'found_gold')

console.log('T1 — share_food changes food by -40')
{
  ok(!!starving, 'starving_family exists in RANDOM_EVENTS')
  const start = { ...DEFAULT_STATE, food: 80, currentEvent: starving!, phase: 'event' as const }
  const next = gameReducer(start, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'share_food' })
  ok(next.food === 40, '80-40=40', `got ${next.food}`)
  ok(next.currentEvent === null, 'event clears')
  ok(next.phase === 'traveling', 'returns to traveling')
  ok(typeof next.message === 'string' && next.message.length > 0, 'speaks an outcome')
}

console.log('T2 — unknown choice is a no-op')
{
  const start = { ...DEFAULT_STATE, food: 80, currentEvent: starving!, phase: 'event' as const }
  const next = gameReducer(start, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'not_a_choice' })
  ok(next.food === 80 && next.currentEvent === starving, 'stock and event unchanged')
}

console.log('T3 — daysLost advances the day')
{
  ok(!!gold, 'found_gold exists')
  const pan = gold!.choices.find(c => c.id === 'pan')
  ok(!!pan && (pan!.outcome.daysLost || 0) >= 1, 'pan costs a day in the authored outcome')
  const start = { ...DEFAULT_STATE, day: 5, currentEvent: gold!, phase: 'event' as const }
  const next = gameReducer(start, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'pan' })
  ok(next.day === 5 + (pan!.outcome.daysLost || 0), 'day advances by daysLost')
}

console.log(`\nevent-choice tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
