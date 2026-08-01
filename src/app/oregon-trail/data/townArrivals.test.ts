/**
 * Town arrival prose — reachability + tiering.
 *
 * townArrivals.ts held 331 lines of authored writing with ZERO importers, so no
 * player could ever see a line of it, and GENERIC_ARRIVALS was exported but not
 * even used by its own module (unknown towns returned null). These tests exist
 * to keep it CONSUMED, not merely correct.
 */

import assert from 'node:assert/strict'
import {
  getVisitTier,
  getTownArrivalMessage,
  TOWN_ARRIVALS,
  GENERIC_ARRIVALS,
} from './townArrivals'
import { computeTravel } from '../state/travelEngine'
import { DEFAULT_STATE } from '../state/constants'
import { LANDMARKS } from '../state/constants'
import type { OregonTrailState } from '../state/types'

let passed = 0
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ok  ${name}`) }
const firstOf = () => 0 // rng: always take the first message in a tier

console.log('townArrivals')

check('visit tiers ladder correctly', () => {
  assert.equal(getVisitTier(0), 'first')
  assert.equal(getVisitTier(1), 'return')
  assert.equal(getVisitTier(2), 'familiar')
  assert.equal(getVisitTier(4), 'familiar')
  assert.equal(getVisitTier(5), 'regular')
  assert.equal(getVisitTier(50), 'regular')
})

check('every authored town has prose in all four tiers', () => {
  for (const [town, set] of Object.entries(TOWN_ARRIVALS)) {
    for (const tier of ['first', 'return', 'familiar', 'regular'] as const) {
      assert.ok(set[tier] && set[tier].length > 0, `${town} has no ${tier} prose`)
      for (const m of set[tier]) {
        assert.ok(m.text.length > 15, `${town}/${tier} message too short`)
        assert.ok(m.mood, `${town}/${tier} missing mood`)
      }
    }
  }
})

check('an unknown town falls back to GENERIC_ARRIVALS instead of null', () => {
  const m = getTownArrivalMessage('Nowhere In Particular', 0, firstOf)
  assert.ok(m, 'unknown towns must still get an arrival line')
  assert.equal(m!.text, GENERIC_ARRIVALS.first[0].text)
})

check('tier changes the line as visits accumulate', () => {
  const town = 'Independence, Missouri'
  const a = getTownArrivalMessage(town, 0, firstOf)!
  const b = getTownArrivalMessage(town, 1, firstOf)!
  const c = getTownArrivalMessage(town, 5, firstOf)!
  assert.notEqual(a.text, b.text, 'first and return must differ')
  assert.notEqual(b.text, c.text, 'return and regular must differ')
  assert.equal(a.text, TOWN_ARRIVALS[town].first[0].text)
  assert.equal(c.text, TOWN_ARRIVALS[town].regular[0].text)
})

check('authored towns line up with real landmark names', () => {
  // The arrival lookup is keyed by landmark NAME, so a typo silently downgrades
  // a town to the generic set. At least the trail's own landmarks must match.
  const landmarkNames = new Set(LANDMARKS.map(l => l.name))
  const authored = Object.keys(TOWN_ARRIVALS)
  const matched = authored.filter(t => landmarkNames.has(t))
  assert.ok(
    matched.length >= 5,
    `expected authored towns to match real landmarks; matched ${matched.length} of ${authored.length}`,
  )
})

// --- consumption -------------------------------------------------------------

check('CONSUMPTION: arriving at a landmark puts the prose in the message', () => {
  // Park the party one mile short of Fort Kearny so the next tick arrives.
  const kearny = LANDMARKS.find(l => l.name === 'Fort Kearny')!
  const s = {
    ...DEFAULT_STATE,
    phase: 'traveling',
    distance: kearny.distance - 1,
    milesUntilNextLandmark: 1,
    nextLandmark: 'Fort Kearny',
    currentLandmark: 'Chimney Rock',
    food: 900, oxen: 6, ammunition: 200,
    party: [{ id: 'leader', name: 'T', health: 100, isSick: false, role: 'leader' }],
  } as unknown as OregonTrailState

  const after = computeTravel(s, undefined, () => 0.99) // 0.99 = no hazard
  assert.equal(after.currentLandmark, 'Fort Kearny', 'the tick should arrive at Fort Kearny')
  assert.ok(after.message, 'arrival must produce a message')

  const expected = getTownArrivalMessage('Fort Kearny', 0, () => 0)
  if (expected) {
    // rng differs, so assert the line came from Fort Kearny's authored FIRST tier
    const firstTier = TOWN_ARRIVALS['Fort Kearny']?.first ?? GENERIC_ARRIVALS.first
    const anyMatch = firstTier.some(m => after.message!.includes(m.text))
    assert.ok(anyMatch, `arrival prose must reach the player. got: ${after.message}`)
  }
})

check('CONSUMPTION: the visit counter increments on arrival', () => {
  const kearny = LANDMARKS.find(l => l.name === 'Fort Kearny')!
  const s = {
    ...DEFAULT_STATE,
    phase: 'traveling',
    distance: kearny.distance - 1,
    milesUntilNextLandmark: 1,
    nextLandmark: 'Fort Kearny',
    currentLandmark: 'Chimney Rock',
    food: 900, oxen: 6, ammunition: 200,
    landmarkVisits: { 'Fort Kearny': 2 },
    party: [{ id: 'leader', name: 'T', health: 100, isSick: false, role: 'leader' }],
  } as unknown as OregonTrailState

  const after = computeTravel(s, undefined, () => 0.99)
  assert.equal(after.landmarkVisits?.['Fort Kearny'], 3, 'arrival must count')
  // 2 prior visits => 'familiar' tier
  const familiar = TOWN_ARRIVALS['Fort Kearny']?.familiar ?? GENERIC_ARRIVALS.familiar
  assert.ok(
    familiar.some(m => after.message!.includes(m.text)),
    'a third visit must use the familiar tier, not the first-time line',
  )
})

check('CONSUMPTION: an ordinary travel day carries no arrival prose', () => {
  const s = {
    ...DEFAULT_STATE,
    phase: 'traveling',
    distance: 400, milesUntilNextLandmark: 200,
    food: 900, oxen: 6, ammunition: 200,
    party: [{ id: 'leader', name: 'T', health: 100, isSick: false, role: 'leader' }],
  } as unknown as OregonTrailState
  const after = computeTravel(s, undefined, () => 0.99)
  // `currentLandmark` legitimately STAYS at the last town on a non-arrival day —
  // the arrival test is "did it change", which is what `arrivedAt` compares.
  assert.equal(after.currentLandmark, s.currentLandmark, 'landmark should be unchanged')
  assert.equal(after.landmarkVisits, s.landmarkVisits, 'no arrival means no visit counted')
  const allProse = Object.values(TOWN_ARRIVALS).flatMap(t => t.first).map(m => m.text)
  assert.ok(
    !allProse.some(t => (after.message ?? '').includes(t)),
    'arrival prose must not fire on a day with no arrival',
  )
})

console.log(`\ntownArrivals: ${passed} checks passed`)
