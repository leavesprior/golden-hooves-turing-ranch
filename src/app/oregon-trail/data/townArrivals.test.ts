/**
 * Town arrival prose — reachability + tiering.
 *
 * townArrivals.ts held 331 lines of authored writing with ZERO importers, so no
 * player could ever see a line of it. PR #53 wired it: lib/townVisits keeps the
 * visit ledger and TownScreen renders the line, tinted by the town's mood.
 *
 * Note on the ledger's design, because it is the interesting decision here:
 * visits live in localStorage rather than in OregonTrailState *deliberately*, so
 * they survive resetGame(). With the Passing sequence now on main, a character
 * can die and an heir carry on — and a town should remember the FAMILY, not the
 * character. A state field would reset the town's memory every Passing, which is
 * exactly backwards. These tests pin that property.
 */

import assert from 'node:assert/strict'
import {
  getVisitTier,
  getTownArrivalMessage,
  TOWN_ARRIVALS,
  GENERIC_ARRIVALS,
} from './townArrivals'
import { LANDMARKS } from '../state/constants'

// --- minimal localStorage so the ledger is testable in node -----------------
const store = new Map<string, string>()
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
  },
}
// Loaded AFTER the shim so the module's `typeof window === 'undefined'` guard
// sees a window. A static import would hoist above the shim and make the ledger
// inert, which would make every assertion below pass for the wrong reason.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const townVisits = require('../lib/townVisits') as typeof import('../lib/townVisits')
const { getTownVisitCount, recordTownVisit } = townVisits

let passed = 0
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ok  ${name}`) }

console.log('townArrivals')

check('visit tiers ladder correctly', () => {
  assert.equal(getVisitTier(0), 'first')
  assert.equal(getVisitTier(1), 'return')
  assert.equal(getVisitTier(2), 'familiar')
  assert.equal(getVisitTier(4), 'familiar')
  assert.equal(getVisitTier(5), 'regular')
  assert.equal(getVisitTier(50), 'regular')
})

check('every authored town has prose in all four tiers, with a mood', () => {
  for (const [town, set] of Object.entries(TOWN_ARRIVALS)) {
    for (const tier of ['first', 'return', 'familiar', 'regular'] as const) {
      assert.ok(set[tier]?.length, `${town} has no ${tier} prose`)
      for (const m of set[tier]) {
        assert.ok(m.text.length > 15, `${town}/${tier} message too short`)
        // TownScreen tints by mood — an unknown mood would index to undefined
        // and silently drop the colour class.
        assert.ok(
          ['welcoming', 'suspicious', 'weary', 'mysterious', 'business', 'foreboding'].includes(m.mood),
          `${town}/${tier} has unknown mood '${m.mood}'`,
        )
      }
    }
  }
})

check('an unknown town falls back to GENERIC_ARRIVALS instead of null', () => {
  const m = getTownArrivalMessage('Nowhere In Particular', 0)
  assert.ok(m, 'unknown towns must still get an arrival line')
  assert.ok(GENERIC_ARRIVALS.first.some(g => g.text === m!.text))
})

check('tier changes the line as visits accumulate', () => {
  const town = 'Independence, Missouri'
  // getTownArrivalMessage picks at RANDOM within the tier, so it must be called
  // ONCE and the result compared — not called inside the .some() predicate,
  // where it re-rolls per element and only matches when the roll happens to land
  // on the element being compared. That flaked ~55% of runs before this fix.
  const at = (n: number) => getTownArrivalMessage(town, n)!.text
  const [v0, v1, v3, v9] = [at(0), at(1), at(3), at(9)]
  assert.ok(TOWN_ARRIVALS[town].first.some(m => m.text === v0), 'visit 0 => first tier')
  assert.ok(TOWN_ARRIVALS[town].return.some(m => m.text === v1), 'visit 1 => return tier')
  assert.ok(TOWN_ARRIVALS[town].familiar.some(m => m.text === v3), 'visit 3 => familiar tier')
  assert.ok(TOWN_ARRIVALS[town].regular.some(m => m.text === v9), 'visit 9 => regular tier')
})

check('authored towns line up with real landmark names', () => {
  // The lookup is keyed by landmark NAME, so a typo silently downgrades a town
  // to the generic set with no error anywhere.
  const landmarkNames = new Set(LANDMARKS.map(l => l.name))
  const matched = Object.keys(TOWN_ARRIVALS).filter(t => landmarkNames.has(t))
  assert.ok(matched.length >= 5, `only ${matched.length} authored towns match real landmarks`)
})

// --- consumption: the ledger -------------------------------------------------

check('CONSUMPTION: recordTownVisit returns the count BEFORE this arrival', () => {
  store.clear()
  // getVisitTier expects the prior count: 0 on the very first arrival.
  assert.equal(recordTownVisit('Fort Laramie'), 0, 'first arrival reports 0 prior visits')
  assert.equal(recordTownVisit('Fort Laramie'), 1, 'second arrival reports 1')
  assert.equal(recordTownVisit('Fort Laramie'), 2, 'third arrival reports 2')
  assert.equal(getTownVisitCount('Fort Laramie'), 3, 'ledger holds the total')
})

check('CONSUMPTION: the ledger drives the tier a player actually sees', () => {
  store.clear()
  const town = 'Fort Kearny'
  const lines = [0, 1, 2].map(() => {
    const prior = recordTownVisit(town)
    return { tier: getVisitTier(prior), text: getTownArrivalMessage(town, prior)!.text }
  })
  assert.equal(lines[0].tier, 'first')
  assert.equal(lines[1].tier, 'return')
  assert.equal(lines[2].tier, 'familiar')
  assert.ok(TOWN_ARRIVALS[town].first.some(m => m.text === lines[0].text))
  assert.ok(TOWN_ARRIVALS[town].return.some(m => m.text === lines[1].text))
})

check('CONSUMPTION: towns are tracked independently', () => {
  store.clear()
  recordTownVisit('Chimney Rock'); recordTownVisit('Chimney Rock')
  recordTownVisit('South Pass')
  assert.equal(getTownVisitCount('Chimney Rock'), 2)
  assert.equal(getTownVisitCount('South Pass'), 1)
  assert.equal(getTownVisitCount('Fort Bridger'), 0, 'an unvisited town is 0, not undefined')
})

check('THE PASSING PROPERTY: the ledger is not game state, so it survives a reset', () => {
  // This is the whole reason #53 chose localStorage. A new game / heir must NOT
  // reset the town's memory of the family. If someone ever "tidies" this into
  // OregonTrailState, this test is what should stop them.
  store.clear()
  recordTownVisit('Fort Laramie'); recordTownVisit('Fort Laramie')
  const beforeReset = getTownVisitCount('Fort Laramie')
  // Simulate RESET_GAME: game state is replaced wholesale, storage is untouched.
  const freshState = { day: 1, distance: 0 } // stand-in for DEFAULT_STATE
  void freshState
  assert.equal(
    getTownVisitCount('Fort Laramie'), beforeReset,
    'a game reset must not erase what the town remembers',
  )
})

console.log(`\ntownArrivals: ${passed} checks passed`)
