/**
 * Zero oxen cannot add miles. SADDLE bites travel. Named rescue verbs exist.
 *   npx tsx src/app/oregon-trail/state/oxenSaddleTravel.test.ts
 */
import { DEFAULT_STATE } from './constants'
import { computeTravel, NO_OXEN_EVENT } from './travelEngine'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const party = [{ id: 'a', name: 'A', health: 100, isSick: false, role: 'leader' as const }]

function traveling(over: Partial<OregonTrailState>): OregonTrailState {
  return {
    ...DEFAULT_STATE,
    day: 4,
    distance: 40,
    milesUntilNextLandmark: 62,
    nextLandmark: 'Kansas River Crossing',
    phase: 'traveling',
    party,
    food: 80,
    oxen: 4,
    weather: 'fair',
    pace: 'steady',
    ...over,
  }
}

{
  const next = computeTravel(traveling({ oxen: 0 }))
  ok(next.distance === 40, `zero oxen add no miles, got ${next.distance}`)
  ok(next.currentEvent?.id === 'no_oxen', 'zero oxen opens the yoke-empty event')
  ok(NO_OXEN_EVENT.choices.map((c) => c.id).join() === 'walk_to_town,hire_teamster,abandon_wagon', 'named verbs exist')
}

{
  const stuck = traveling({ oxen: 0, currentEvent: NO_OXEN_EVENT, phase: 'event' })
  const hired = gameReducer(stuck, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'hire_teamster' })
  ok(hired.oxen === 2, `hire_teamster adds two head, got ${hired.oxen}`)
}

{
  const stuck = traveling({ oxen: 0, currentEvent: NO_OXEN_EVENT, phase: 'event', saddle: { Expertise: 10 } })
  const walked = gameReducer(stuck, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'walk_to_town' })
  ok(walked.distance === 40 + 4 + Math.floor(10 / 2), `walk miles follow Expertise, got ${walked.distance}`)
}

{
  const stuck = traveling({ oxen: 0, currentEvent: NO_OXEN_EVENT, phase: 'event' })
  const left = gameReducer(stuck, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'abandon_wagon' })
  ok(left.wagonAbandoned === true, 'abandon_wagon sets the flag')
  const next = computeTravel({ ...left, phase: 'traveling', oxen: 0 })
  ok(next.distance > 40, `abandoned wagon still walks, got ${next.distance}`)
}

{
  const fair = computeTravel(traveling({ weather: 'fair', saddle: { Luck: 5 } }))
  const lucky = computeTravel(traveling({ weather: 'rain', saddle: { Luck: 18 } }))
  const unlucky = computeTravel(traveling({ weather: 'rain', saddle: { Luck: 5 } }))
  ok(fair.distance === 55, `fair steady 15 mi, got ${fair.distance}`)
  ok((lucky.distance ?? 0) > (unlucky.distance ?? 0), `Luck 18 rain outwalks Luck 5 rain (${lucky.distance} vs ${unlucky.distance})`)
}

{
  const soft = computeTravel(traveling({ saddle: { Durability: 5 }, rations: 'bare_bones', pace: 'grueling' }))
  const tough = computeTravel(traveling({ saddle: { Durability: 17 }, rations: 'bare_bones', pace: 'grueling' }))
  const h0 = soft.party[0]?.health ?? 0
  const h1 = tough.party[0]?.health ?? 0
  ok(h1 > h0, `Durability 17 loses less health than 5 (${h1} vs ${h0})`)
}

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed }))
