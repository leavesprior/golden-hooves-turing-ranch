import assert from 'node:assert/strict'
import {
  getGoldCountryCalendar, advanceGoldCountryClock, quoteGoldCountryTransport,
  type GoldCountryClock, type GoldCountryTransportRequest, type GoldCountryTransportQuote,
} from './goldCountryTransport'

const oldYear: GoldCountryClock = { day: 1 }
const stageYear: GoldCountryClock = { day: 400, goldCountryDay: 682 }
const railYear: GoldCountryClock = { day: 91, goldCountryDay: 7111 }
function quote(overrides: Partial<GoldCountryTransportRequest> = {}): GoldCountryTransportQuote {
  const result = quoteGoldCountryTransport({ fromId: 'volcano', toId: 'murphys', clock: railYear, ...overrides })
  assert.equal(result.ok, true, JSON.stringify(result))
  return result.quote
}
function rejected(overrides: Partial<GoldCountryTransportRequest>, reason: string) {
  assert.deepEqual(quoteGoldCountryTransport({ fromId: 'volcano', toId: 'murphys', clock: railYear, ...overrides }), { ok: false, reason })
}

assert.deepEqual(getGoldCountryCalendar(oldYear), { year: 1849, dayOfYear: 1, elapsedDays: 0, goldCountryMinute: 0 })
assert.equal(getGoldCountryCalendar({ day: 1, goldCountryDay: 1 })!.elapsedDays, 0, 'two day-one counters do not add an extra day')
assert.deepEqual(getGoldCountryCalendar({ day: 100, goldCountryDay: 262 }), { year: 1850, dayOfYear: 1, elapsedDays: 360, goldCountryMinute: 0 })

const beforeStage = { day: 400, goldCountryDay: 681, goldCountryMinute: 1439 }
assert.equal(getGoldCountryCalendar(beforeStage)!.year, 1851)
rejected({ mode: 'stage', clock: beforeStage, roll: 0.9 }, 'stage_not_available')
const afterStage = { day: beforeStage.day, ...advanceGoldCountryClock(beforeStage, 1)! }
assert.deepEqual(afterStage, { day: 400, goldCountryDay: 682, goldCountryMinute: 0 })
assert.equal(getGoldCountryCalendar(afterStage)!.year, 1852)
assert.equal(quote({ mode: 'stage', clock: afterStage, roll: 0.9 }).fare, 10)

const beforeRail = { day: 91, goldCountryDay: 7110, goldCountryMinute: 1439 }
const railRoute = { fromId: 'sacramento_gateway', toId: 'roseville_gateway', mode: 'rail' as const, roll: 0.9 }
assert.equal(getGoldCountryCalendar(beforeRail)!.year, 1868)
rejected({ ...railRoute, clock: beforeRail }, 'rail_not_available')
const afterRail = { day: beforeRail.day, ...advanceGoldCountryClock(beforeRail, 1)! }
assert.equal(getGoldCountryCalendar(afterRail)!.year, 1869)
const train = quote({ ...railRoute, clock: afterRail })
assert.equal(train.fare, 8); assert.equal(train.durationMinutes, 90)
assert.equal(quote({ ...railRoute, fromId: 'roseville_gateway', toId: 'sacramento_gateway' }).durationMinutes, 90)
for (const toId of ['volcano', 'bobr_cabin', 'jackson', 'murphys']) rejected({ ...railRoute, toId }, 'rail_route_unavailable')
rejected({ mode: 'rail', roll: 0.9 }, 'rail_route_unavailable')
rejected({ ...railRoute, toId: 'west_point' }, 'unknown_location') // Explore ID is not a main Gold Country destination.
for (const toId of ['sacramento_gateway', 'roseville_gateway']) {
  rejected({ toId, clock: oldYear }, 'gateway_not_available')
  rejected({ toId, clock: stageYear, mode: 'stage', roll: 0.9 }, 'gateway_not_available')
  rejected({ fromId: toId, clock: beforeRail }, 'gateway_not_available')
  assert.equal(quote({ toId, clock: afterRail }).fare, 0)
}

const wagon = quote({ clock: oldYear })
assert.equal(wagon.mode, 'wagon'); assert.equal(wagon.fare, 0)
assert.equal(wagon.durationMinutes, 1440); assert.equal(wagon.event, 'clear')
assert.equal(wagon.luck, null); assert.equal(wagon.roll, null)
const adjacentWagon = quote({ toId: 'jackson', clock: oldYear })
assert.equal(adjacentWagon.adjacent, true); assert.equal(adjacentWagon.durationMinutes, 480)
assert.equal(quote({ mode: 'stage', toId: 'jackson', clock: stageYear, roll: 0.9 }).durationMinutes, 240)
assert.equal(quote({ mode: 'stage', toId: 'jackson', clock: stageYear, roll: 0.9 }).fare, 6)
assert.equal(quote({ mode: 'stage', clock: stageYear, roll: 0.9 }).durationMinutes, 720)
const firstHop = quote({ fromId: 'volcano', toId: 'mokelumne_hill', clock: oldYear })
const secondHop = quote({ fromId: 'mokelumne_hill', toId: 'murphys', clock: oldYear })
assert.equal(firstHop.durationMinutes + secondHop.durationMinutes, 960, 'the former two-instant-hop route now consumes sixteen hours')
const partialHop = advanceGoldCountryClock(oldYear, firstHop.durationMinutes)!
assert.deepEqual(advanceGoldCountryClock({ day: 1, ...partialHop }, secondHop.durationMinutes), { goldCountryDay: 1, goldCountryMinute: 960 })

const delays = { stage: [120, 60, 30, 0], rail: [60, 30, 15, 0] } as const
for (const mode of ['stage', 'rail'] as const) {
  const endpoints = mode === 'rail' ? railRoute : {}
  for (const [index, roll] of [0, 0.05, 0.2, 0.9].entries()) {
    const resolved = quote({ ...endpoints, mode, luck: 5, roll })
    assert.equal(resolved.event, ['wreck', 'robbers', 'weather', 'clear'][index])
    assert.equal(resolved.delayMinutes, delays[mode][index])
    assert.equal(resolved.durationMinutes, resolved.baseMinutes + resolved.delayMinutes)
    assert.ok(resolved.message.length > 10)
  }
}
// Enumerate the full supported stat range across a fine roll grid and both road
// classes. This catches a severity table inversion or a paid delay exceeding the
// matching wagon duration, not merely a single handpicked success example.
for (const endpoints of [
  { fromId: 'volcano', toId: 'jackson', mode: 'stage' as const },
  { fromId: 'volcano', toId: 'murphys', mode: 'stage' as const },
  { ...railRoute },
]) {
  const ordinary = quote({ ...endpoints, mode: 'wagon' })
  for (let rollStep = 0; rollStep < 1000; rollStep++) {
    const roll = rollStep / 1000
    let previous = Infinity
    for (let luck = 1; luck <= 20; luck++) {
      const resolved = quote({ ...endpoints, roll, luck })
      assert.ok(resolved.durationMinutes <= previous, 'higher Luck never makes an identical paid trip slower')
      assert.ok(resolved.durationMinutes < ordinary.durationMinutes, 'even a paid delay stays shorter than its wagon trip')
      assert.ok(Number.isSafeInteger(resolved.durationMinutes) && resolved.durationMinutes > 0)
      previous = resolved.durationMinutes
    }
  }
}
const frozenRequest = Object.freeze({ fromId: 'volcano', toId: 'murphys', mode: 'stage' as const, clock: Object.freeze({ ...stageYear }), luck: 5, roll: 0.05 })
assert.deepEqual(quoteGoldCountryTransport(frozenRequest), quoteGoldCountryTransport(frozenRequest), 'same saved inputs produce the same quote without fresh randomness')
assert.equal(quote({ mode: 'stage', roll: 0.2, luck: 999 }).luck, 20, 'legacy integer stats cannot exceed the live stat ceiling')
assert.equal(quote({ mode: 'stage', roll: 0.2, luck: -999 }).luck, 1)
assert.equal(quote({ mode: 'stage', roll: 0.2 }).luck, 5)

// Independent BigInt conservation across partial-day trips and ordinary whole
// days: the remainder must never accumulate a fractional day or lose minutes.
let clock: GoldCountryClock = { day: 91, goldCountryDay: 17, goldCountryMinute: 1430 }
let expectedMinutes = BigInt(16) * BigInt(1440) + BigInt(1430)
for (const elapsed of [0, 15, 480, 240, 90, 1440, 1425, 720, 1440, 1440]) {
  const advanced = advanceGoldCountryClock(clock, elapsed)!
  expectedMinutes += BigInt(elapsed)
  assert.equal(BigInt(advanced.goldCountryDay - 1) * BigInt(1440) + BigInt(advanced.goldCountryMinute), expectedMinutes)
  assert.ok(Number.isSafeInteger(advanced.goldCountryDay))
  assert.ok(advanced.goldCountryMinute >= 0 && advanced.goldCountryMinute < 1440)
  clock = { ...clock, ...advanced }
  assert.equal(clock.day, 91, 'Gold Country time does not advance the trail counter again')
}
assert.deepEqual(advanceGoldCountryClock(oldYear, 0), { goldCountryDay: 1, goldCountryMinute: 0 })
for (const badClock of [null, [], {}, { day: 0 }, { day: '91' }, { day: NaN }, { day: Infinity }, { day: 1.5 },
  { day: 91, goldCountryDay: null }, { day: 91, goldCountryDay: 0 }, { day: 91, goldCountryDay: '7111' },
  { day: 91, goldCountryMinute: -1 }, { day: 91, goldCountryMinute: 1440 }, { day: 91, goldCountryMinute: 0.5 },
  { day: Number.MAX_SAFE_INTEGER, goldCountryDay: 3 },
]) {
  assert.equal(getGoldCountryCalendar(badClock as GoldCountryClock), undefined)
  assert.equal(advanceGoldCountryClock(badClock as GoldCountryClock, 90), undefined)
  rejected({ clock: badClock as GoldCountryClock }, 'invalid_input')
}
for (const elapsed of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(advanceGoldCountryClock(oldYear, elapsed), undefined)
assert.equal(advanceGoldCountryClock({ day: 1, goldCountryMinute: 1439 }, Number.MAX_SAFE_INTEGER), undefined)
assert.equal(advanceGoldCountryClock({ day: 1, goldCountryDay: Number.MAX_SAFE_INTEGER }, 1440), undefined)
for (const toId of ['unknown', '__proto__', 'sacremento_gateway', '']) rejected({ toId }, 'unknown_location')
rejected({ toId: 'volcano' }, 'same_location')
rejected({ ...railRoute, toId: 'sacramento_gateway' }, 'same_location')
rejected({ mode: 'horse' as 'wagon' }, 'invalid_input')
rejected({ mode: 'stage' }, 'invalid_input')
for (const roll of [-0.01, 1, NaN, Infinity]) rejected({ mode: 'stage', roll }, 'invalid_input')
for (const luck of [NaN, Infinity, 3.5]) rejected({ mode: 'stage', roll: 0.5, luck }, 'invalid_input')
assert.deepEqual(quoteGoldCountryTransport(null as unknown as GoldCountryTransportRequest), { ok: false, reason: 'invalid_input' })
console.log('Gold Country transport: calendar gates, partial-day conservation, known rail pair, deterministic Luck and bounded faster paid trips PASS')
