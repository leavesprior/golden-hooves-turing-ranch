import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { IN_TOWN_M, distanceLabel, parseSimulatedPlaceFix, placeTier } from './outOfTime'
import { LOCAL_PLACES } from './localPlaces'
import { metersBetween } from './oneMapDiscovery'
import { TOWN_REGISTRY } from './townRegistry'

const north = (p: { lat: number; lng: number }, m: number) => ({ lat: p.lat + m / 111320, lng: p.lng })
const oot = { point: { lat: 38.442575, lng: -120.63102 }, keeper: { name: 'k', radiusM: 45, lines: ['x'] } }

// Tiers: the keeper speaks only at the door, and only on a fix good enough to say so.
assert.equal(placeTier({ ...oot.point, accuracyM: 10 }, oot).tier, 'here')
assert.equal(placeTier({ ...north(oot.point, 50), accuracyM: 10 }, oot).tier, 'here') // 45 + 10 slack
assert.equal(placeTier({ ...north(oot.point, 60), accuracyM: 10 }, oot).tier, 'in_town')
assert.equal(placeTier({ ...north(oot.point, 20), accuracyM: 80 }, oot).tier, 'in_town', 'a rough fix never unlocks the keeper')
assert.equal(placeTier({ ...north(oot.point, 72), accuracyM: 40 }, oot).tier, 'in_town', 'slack is capped at 25 m')
assert.equal(placeTier({ ...north(oot.point, 1400), accuracyM: 10 }, oot).tier, 'in_town')
assert.equal(placeTier({ ...north(oot.point, 2000), accuracyM: 10 }, oot).tier, 'far')
assert.ok(Math.abs(placeTier({ ...north(oot.point, 2000), accuracyM: 10 }, oot).meters - 2000) <= 5)

assert.equal(distanceLabel(84), '84 m')
assert.equal(distanceLabel(16093), '10 mi')
assert.equal(distanceLabel(4828), '3.0 mi')

// The simulated fix is a localhost-only dev tool.
assert.equal(parseSimulatedPlaceFix('?nearPlace=p', 'p', oot.point, 'backofbeyondranch.farm'), null)
assert.equal(parseSimulatedPlaceFix('?nearPlace=other', 'p', oot.point, 'localhost'), null)
const sim = parseSimulatedPlaceFix('?nearPlace=p&nearOffsetM=500', 'p', oot.point, 'localhost')
assert.ok(sim && Math.abs(metersBetween(sim, oot.point) - 500) <= 1)

// Every out-of-time place: plates on disk, the guess labelled as a guess, facts sourced,
// the keeper close-range, and the point inside its own town.
const withOot = LOCAL_PLACES.filter((p) => p.outOfTime)
assert.ok(withOot.length >= 1)
for (const p of withOot) {
  const o = p.outOfTime!
  for (const src of [o.plateToday, o.plateThen, o.plateThenInside].filter(Boolean) as string[]) {
    assert.ok(existsSync(join(process.cwd(), 'public', src)), `${p.id}: ${src} exists`)
  }
  assert.match(o.interpretationLabel, /interpretation/i, `${p.id}: then-plate says it is an interpretation`)
  assert.ok(o.keeper.radiusM <= 60, `${p.id}: keeper is a very-short-distance unlock`)
  assert.ok(o.keeper.lines.length > 0)
  assert.ok(o.pointSource.length > 10, `${p.id}: point names its source`)
  const town = TOWN_REGISTRY.find((t) => t.id === p.townId)
  assert.ok(town, `${p.id}: town ${p.townId} registered`)
  assert.ok(metersBetween(o.point, { lat: town!.lat, lng: town!.lng }) <= IN_TOWN_M, `${p.id}: point is in town`)
  // No invented build year: nothing may say when these walls went up.
  for (const text of [o.known, o.interpretationLabel, ...o.keeper.lines]) {
    assert.doesNotMatch(text, /\bbuilt (in )?1[89]\d\d\b/i, `${p.id}: no build year claimed`)
  }
}

// 16154 Main: the point is the county parcel centre (029-043-010), ~99 m north of the St. George.
const baked = LOCAL_PLACES.find((p) => p.id === 'vol_baked_in_amador')!.outOfTime!
assert.deepEqual(baked.point, { lat: 38.442575, lng: -120.63102 })
assert.match(baked.known, /Stone Jug/)
assert.match(baked.pointSource, /029-043-010/)
const stGeorge = { lat: 38.44175, lng: -120.63058 }
const d = metersBetween(baked.point, stGeorge)
assert.ok(d > 80 && d < 120, `bakery ${d} m from St. George`)

console.log(`outOfTime: ok (${withOot.length} place${withOot.length === 1 ? '' : 's'})`)
