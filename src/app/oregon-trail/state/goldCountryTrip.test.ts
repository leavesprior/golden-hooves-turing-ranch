import assert from 'node:assert/strict'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'
import { readGoldCountryTrip, type GoldCountryTrip } from './goldCountryTrip'
import { quoteGoldCountryTransport, getGoldCountryCalendar } from '@/lib/goldCountryTransport'
import { getGoldCountryLocation } from '../data/goldCountryLocations'

function town(overrides: Partial<OregonTrailState> = {}): OregonTrailState {
  return { ...DEFAULT_STATE, phase: 'gold_country_location', day: 91, daysOnTrail: 90, distance: 2000,
    currentGoldCountryLocation: 'volcano', goldCountryDay: 991, goldCountryMinute: 0,
    party: [{ id: 'leader', name: 'Mira', role: 'leader', health: 83, isSick: false }],
    inventory: ['towel'], searchedAreas: ['saved-search'], completedQuests: ['saved-quest'],
    ...overrides }
}
let serial = 0
function planned(state: OregonTrailState, toId: string, mode: 'wagon' | 'stage' | 'rail' = 'wagon', roll = 0.9): GoldCountryTrip {
  const result = quoteGoldCountryTransport({ fromId: state.currentGoldCountryLocation!, toId, mode, clock: state, luck: 5, roll: mode === 'wagon' ? undefined : roll })
  assert.equal(result.ok, true)
  return { version: 1, id: `test-trip-${++serial}`, status: mode === 'wagon' ? 'paid' : 'planned',
    departureClock: { day: state.day, goldCountryDay: state.goldCountryDay, goldCountryMinute: state.goldCountryMinute ?? 0 },
    quote: result.quote, roadEncounterId: null }
}
const load = (state: OregonTrailState) => gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: JSON.parse(JSON.stringify(state)) })
let cases = 0
function check(name: string, body: () => void) { body(); cases++; console.log(`PASS ${name}`) }

check('paid departure cannot arrive before payment; replayed arrival changes nothing', () => {
  const initial = town()
  const trip = planned(initial, 'jackson', 'stage', 0.2)
  const reserved = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  assert.equal(reserved.phase, 'gold_country_travel')
  assert.equal(reserved.goldCountryMinute, 0)
  assert.equal(reserved.goldCountryTrip?.quote.durationMinutes, 270)
  const arrival = { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION' as const, locationId: 'jackson', tripId: trip.id }
  assert.equal(gameReducer(reserved, arrival), reserved)
  const paid = gameReducer(load(reserved), { type: 'PAY_GOLD_COUNTRY_TRAVEL', tripId: trip.id })
  assert.equal(gameReducer(paid, { ...arrival, tripId: 'old-trip' }), paid)
  assert.equal(gameReducer(paid, { ...arrival, locationId: 'murphys' }), paid)
  const arrived = gameReducer(load(paid), arrival)
  assert.equal(arrived.currentGoldCountryLocation, 'jackson')
  assert.equal(arrived.travelingToLocation, null)
  assert.equal(arrived.goldCountryDay, 991)
  assert.equal(arrived.goldCountryMinute, 270)
  assert.equal(arrived.goldCountryTrip?.status, 'arrived')
  assert.equal(gameReducer(arrived, arrival), arrived)
  const reloaded = load(arrived)
  assert.equal(gameReducer(reloaded, arrival), reloaded)
  for (const key of ['food', 'ammunition', 'medicine', 'oxen', 'wagonCondition', 'party', 'inventory', 'searchedAreas', 'completedQuests'] as const) {
    assert.deepEqual(arrived[key], initial[key], `${key} retained; paid delay adds no damage or reward policy`)
  }
})

check('adjacent road chain consumes three eight-hour hops; direct visit cannot bypass travel', () => {
  let state = town({ goldCountryDay: 1 })
  for (const toId of ['jackson', 'volcano', 'mokelumne_hill']) {
    assert.equal(gameReducer(state, { type: 'VISIT_GOLD_COUNTRY_LOCATION', locationId: toId }), state)
    const trip = planned(state, toId)
    assert.equal(trip.quote.durationMinutes, 480)
    state = gameReducer(state, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
    state = gameReducer(state, { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION', locationId: toId, tripId: trip.id })
  }
  assert.equal(state.goldCountryDay, 2)
  assert.equal(state.goldCountryMinute, 0)
})

check('ordinary wagon arrival crosses 1851 to 1852 using the same calendar', () => {
  const initial = town({ goldCountryDay: 990, goldCountryMinute: 0 })
  assert.equal(getGoldCountryCalendar(initial)?.year, 1851)
  const trip = planned(initial, 'murphys')
  let state = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  state = gameReducer(state, { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION', locationId: 'murphys', tripId: trip.id })
  assert.equal(state.goldCountryDay, 991)
  assert.equal(getGoldCountryCalendar(state)?.year, 1852)
  assert.equal(planned(state, 'volcano', 'stage').quote.mode, 'stage')
})

check('rail gateway pair is real catalog data; arrival retains its 90 minutes', () => {
  const initial = town({ currentGoldCountryLocation: 'sacramento_gateway', goldCountryDay: 7111 })
  const trip = planned(initial, 'roseville_gateway', 'rail')
  const from = getGoldCountryLocation(trip.quote.fromId)!
  const to = getGoldCountryLocation(trip.quote.toId)!
  assert.equal(from.transportGateway?.fictional, true)
  assert.equal(to.transportGateway?.fictional, true)
  assert.equal(from.adjacentTo.includes(to.id), true)
  assert.equal(to.adjacentTo.includes(from.id), true)
  assert.equal(trip.quote.year, 1869)
  assert.equal(trip.quote.fare, 8)
  let state = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  state = gameReducer(state, { type: 'PAY_GOLD_COUNTRY_TRAVEL', tripId: trip.id })
  state = gameReducer(state, { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION', locationId: to.id, tripId: trip.id })
  assert.equal(state.goldCountryMinute, 90)
  assert.equal(state.currentGoldCountryLocation, 'roseville_gateway')
})

check('a saved paid Luck roll survives JSON reload, while edited quotes reject', () => {
  const initial = town()
  const trip = planned(initial, 'murphys', 'stage', 0.05)
  assert.equal(trip.quote.event, 'robbers')
  const state = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  assert.deepEqual(load(state).goldCountryTrip, trip)
  for (const badQuote of [{ ...trip.quote, fare: 0 }, { ...trip.quote, durationMinutes: 1 }, { ...trip.quote, event: 'clear' }, { ...trip.quote, roll: 0.9 }]) {
    assert.equal(readGoldCountryTrip({ ...trip, quote: badQuote }), undefined)
  }
  const tooEarly = town({ goldCountryDay: 1 })
  assert.equal(gameReducer(tooEarly, { type: 'START_GOLD_COUNTRY_TRAVEL', trip }), tooEarly)
})

check('active journey blocks duplicate departure and unrelated day advancement', () => {
  const initial = town()
  const trip = planned(initial, 'murphys', 'stage')
  const state = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  assert.equal(gameReducer(state, { type: 'START_GOLD_COUNTRY_TRAVEL', trip: planned(initial, 'jackson') }), state)
  assert.equal(gameReducer(state, { type: 'ADVANCE_GOLD_COUNTRY_DAY', days: 1 }), state)
  assert.equal(gameReducer(state, { type: 'ENTER_GOLD_COUNTRY_EXPLORE' }), state)
})

check('legacy or corrupt in-flight save keeps donor progress and returns to route selection', () => {
  const initial = town({ phase: 'gold_country_travel', travelingToLocation: 'murphys' })
  for (const state of [initial, { ...initial, goldCountryTrip: { version: 999 } as unknown as GoldCountryTrip }]) {
    const recovered = load(state)
    assert.equal(recovered.phase, 'gold_country_explore')
    assert.equal(recovered.currentGoldCountryLocation, 'volcano')
    assert.equal(recovered.goldCountryDay, initial.goldCountryDay)
    assert.deepEqual(recovered.inventory, initial.inventory)
    assert.deepEqual(recovered.completedQuests, initial.completedQuests)
    assert.match(recovered.message ?? '', /town and progress are kept/)
  }
})

check('wagon encounter choice is durable, cannot repeat, and must be acknowledged before arrival', () => {
  const initial = town()
  const trip = { ...planned(initial, 'murphys'), roadEncounterId: 'bandit_ambush' }
  let state = gameReducer(initial, { type: 'START_GOLD_COUNTRY_TRAVEL', trip })
  const choose = { type: 'CHOOSE_GOLD_COUNTRY_ROAD_ENCOUNTER' as const, tripId: trip.id, choiceId: 'negotiate' }
  const arrival = { type: 'ARRIVE_AT_GOLD_COUNTRY_LOCATION' as const, locationId: 'murphys', tripId: trip.id }
  assert.equal(gameReducer(state, arrival), state)
  state = gameReducer(state, choose)
  assert.equal(gameReducer(state, choose), state)
  state = load(state)
  assert.equal(state.goldCountryTrip?.roadChoiceId, 'negotiate')
  assert.equal(gameReducer(state, choose), state)
  assert.equal(gameReducer(state, arrival), state)
  state = gameReducer(state, { type: 'CONTINUE_GOLD_COUNTRY_ROAD_ENCOUNTER', tripId: trip.id })
  assert.equal(gameReducer(state, arrival).currentGoldCountryLocation, 'murphys')
})

console.log(JSON.stringify({ ok: true, cases, scope: 'Gold Country reducer trip integration' }))
