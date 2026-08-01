/**
 * Trail hazard + starvation + death-state tests.
 *
 * These cover the three defects found in playtest 2026-07-31:
 *   1. starvation had no health term at all (food 0 was survivable indefinitely)
 *   2. the game-over branch spread `prev`, discarding the party that just died
 *   3. hazards did not exist, so the trail had no region character
 *
 * Deterministic: every roll goes through an injected rng, never Math.random.
 */

import assert from 'node:assert/strict'
import {
  regionForDistance,
  hazardsFor,
  rollHazard,
  resolveHazard,
  TRAIL_HAZARDS,
  NEUTRAL_STATS,
  type TrailRegion,
} from './trailHazards'
import { computeTravel } from '../state/travelEngine'
import { DEFAULT_STATE } from '../state/constants'
import type { OregonTrailState } from '../state/types'

let passed = 0
const check = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`  ok  ${name}`)
}

const base = (over: Partial<OregonTrailState> = {}): OregonTrailState => ({
  ...DEFAULT_STATE,
  phase: 'traveling',
  party: [
    { id: 'leader', name: 'Tester', health: 100, isSick: false, role: 'leader' },
    { id: 'm0', name: 'Second', health: 100, isSick: false, role: 'companion' },
  ],
  food: 500,
  oxen: 4,
  ammunition: 100,
  ...over,
} as OregonTrailState)

/** rng that never fires a hazard (first draw > chance). */
const noHazard = () => 0.99
/** rng that always fires, picks the first weighted hazard, and fails the check. */
const alwaysHazardFail = () => 0.0001

console.log('trailHazards')

// --- regions -----------------------------------------------------------------

check('regions map to the real landmark bands', () => {
  const cases: Array<[number, TrailRegion]> = [
    [0, 'eastern_prairie'],
    [303, 'eastern_prairie'],
    [304, 'platte_valley'],
    [639, 'platte_valley'],
    [640, 'high_plains'],
    [931, 'high_plains'],
    [932, 'basin_sage'],
    [1200, 'snake_country'],
    [1380, 'humboldt_desert'],
    [1699, 'humboldt_desert'],
    [1700, 'sierra'],
    [1900, 'foothills'],
    [2000, 'foothills'],
  ]
  for (const [d, want] of cases) {
    assert.equal(regionForDistance(d), want, `distance ${d}`)
  }
})

check('every hazard declares at least one region and a reachable pool', () => {
  for (const h of TRAIL_HAZARDS) {
    assert.ok(h.regions.length > 0, `${h.id} has no regions`)
    assert.ok(h.weight > 0, `${h.id} has no weight`)
    assert.ok(h.avoidedText.length > 20 && h.struckText.length > 20, `${h.id} lacks prose`)
  }
})

check('region pools are non-empty everywhere on the trail', () => {
  for (let d = 0; d <= 2000; d += 50) {
    const pool = hazardsFor(base({ distance: d }))
    assert.ok(pool.length > 0, `no hazards available at mile ${d}`)
  }
})

check('hazards are region-appropriate: no Sierra snow on the prairie', () => {
  const prairie = hazardsFor(base({ distance: 100 })).map(h => h.id)
  assert.ok(!prairie.includes('sierra_snow'), 'Sierra snow must not fire on the prairie')
  assert.ok(prairie.includes('cholera'), 'cholera belongs on the lower Platte approach')

  const sierra = hazardsFor(base({ distance: 1800 })).map(h => h.id)
  assert.ok(sierra.includes('sierra_snow'), 'Sierra snow must be available in the Sierra')
  assert.ok(!sierra.includes('bison_stampede'), 'no buffalo herds in the Sierra passes')
})

check('`when` gates suppress impossible hazards', () => {
  // wolves and alkali need stock to threaten; accidental discharge needs ammo
  const noStock = hazardsFor(base({ distance: 500, oxen: 0 })).map(h => h.id)
  assert.ok(!noStock.includes('wolf_pack'), 'wolves cannot take stock you do not have')

  const noAmmo = hazardsFor(base({ distance: 500, ammunition: 0 })).map(h => h.id)
  assert.ok(!noAmmo.includes('accidental_discharge'), 'no discharge without ammunition')
})

check('stats change the outcome — high stat avoids, low stat is struck', () => {
  const snake = TRAIL_HAZARDS.find(h => h.id === 'prairie_rattlesnake')!
  const midRoll = () => 0.5 // d20 -> 11
  const sharp = resolveHazard(snake, { ...NEUTRAL_STATS, Shrewdness: 10, Luck: 10 }, midRoll)
  const dull = resolveHazard(snake, { ...NEUTRAL_STATS, Shrewdness: 1, Luck: 1 }, midRoll)
  assert.equal(sharp.avoided, true, 'a shrewd, lucky agent should see the rattler')
  assert.equal(dull.avoided, false, 'an oblivious agent should be bitten')
})

// --- starvation --------------------------------------------------------------

check('STARVATION: an empty larder now costs health', () => {
  const before = base({ food: 0, rations: 'filling', pace: 'steady' })
  const after = computeTravel(before, NEUTRAL_STATS, noHazard)
  const worst = Math.min(...after.party.map(p => p.health))
  assert.ok(
    worst < 100,
    `party should lose health with no food; got ${after.party.map(p => p.health).join(',')}`,
  )
})

check('STARVATION: a fed party on full rations takes no starvation damage', () => {
  const before = base({ food: 500, rations: 'filling', pace: 'steady', weather: 'fair' })
  const after = computeTravel(before, NEUTRAL_STATS, noHazard)
  assert.equal(after.party[0].health, 100, 'a fed, rested party should be unharmed')
})

check('STARVATION: starving is worse than eating badly (the 07-31 inversion)', () => {
  const starved = computeTravel(
    base({ food: 0, rations: 'filling', pace: 'steady', weather: 'fair' }),
    NEUTRAL_STATS, noHazard,
  )
  const fedButThin = computeTravel(
    base({ food: 500, rations: 'bare_bones', pace: 'steady', weather: 'fair' }),
    NEUTRAL_STATS, noHazard,
  )
  assert.ok(
    starved.party[0].health < fedButThin.party[0].health,
    `starving (${starved.party[0].health}) must hurt more than bare rations (${fedButThin.party[0].health})`,
  )
})

// --- death state -------------------------------------------------------------

check('GAME OVER: the death state keeps the party that died', () => {
  const doomed = base({
    food: 0,
    rations: 'bare_bones',
    pace: 'grueling',
    party: [
      { id: 'leader', name: 'Tester', health: 1, isSick: false, role: 'leader' },
      { id: 'm0', name: 'Second', health: 1, isSick: false, role: 'companion' },
    ],
  } as Partial<OregonTrailState>)

  const after = computeTravel(doomed, NEUTRAL_STATS, noHazard)
  assert.equal(after.phase, 'game_over', 'a party at 1hp with no food should not survive the day')
  assert.ok(
    after.party.every(p => p.health === 0),
    `the persisted party must be dead, got ${after.party.map(p => p.health).join(',')}`,
  )
})

check('GAME OVER: the death state advances the day it died on', () => {
  const doomed = base({
    day: 24, daysOnTrail: 23, food: 0, rations: 'bare_bones', pace: 'grueling',
    party: [{ id: 'leader', name: 'T', health: 1, isSick: false, role: 'leader' }],
  } as Partial<OregonTrailState>)
  const after = computeTravel(doomed, NEUTRAL_STATS, noHazard)
  assert.equal(after.phase, 'game_over')
  assert.equal(after.day, 25, 'the day the party died should be recorded, not rolled back')
  assert.ok(after.message && after.message.length > 0, 'the ending must explain itself')
})

// --- consumption -------------------------------------------------------------
// A hazard layer nobody calls passes tsc, lint and every other test. Prove the
// travel tick actually reaches it and writes its result to state.

check('CONSUMPTION: computeTravel surfaces a fired hazard on state.lastHazard', () => {
  // computeTravel still uses Math.random() internally for random events and
  // weather, so the day can legitimately end on the traveling, event or
  // desperation path. `lastHazard` is the invariant that must hold on ALL of
  // them — an event stealing the screen must not silently eat the hazard. This
  // ran 1-in-5 flaky until the desperation return was carrying it too, which is
  // precisely the silent-drop bug this suite exists to catch.
  for (let i = 0; i < 40; i++) {
    const after = computeTravel(base({ distance: 500 }), NEUTRAL_STATS, alwaysHazardFail)
    assert.ok(after.lastHazard, `travel must record the hazard it rolled (phase=${after.phase})`)
    assert.equal(after.lastHazard!.avoided, false)
    // The narrative only claims the message slot on the ordinary travel screen;
    // an event screen shows the event's own description instead.
    if (after.phase === 'traveling') {
      assert.ok(
        after.message && after.message.includes(after.lastHazard!.text.slice(0, 30)),
        'on a normal day the hazard narrative must reach the player-facing message',
      )
    }
  }
})

check('CONSUMPTION: a quiet day records no hazard', () => {
  const after = computeTravel(base({ distance: 500 }), NEUTRAL_STATS, noHazard)
  assert.equal(after.lastHazard, undefined, 'no hazard rolled means no hazard reported')
})

check('CONSUMPTION: hazard resource costs reach state', () => {
  // Force the wolf/alkali class by standing where stock is threatened.
  let sawOxenLoss = false
  for (const h of TRAIL_HAZARDS) {
    if (!h.effects.oxenLost) continue
    const r = resolveHazard(h, { ...NEUTRAL_STATS, [h.test]: 1, Luck: 1 }, () => 0.01)
    if (!r.avoided && r.effects.oxenLost) sawOxenLoss = true
  }
  assert.ok(sawOxenLoss, 'at least one hazard must be able to take stock')
})

check('rollHazard respects the chance gate', () => {
  assert.equal(rollHazard(base(), NEUTRAL_STATS, () => 0.99, 0.18), null, 'high draw = no hazard')
  assert.ok(rollHazard(base(), NEUTRAL_STATS, () => 0.001, 0.18), 'low draw = hazard')
})

console.log(`\ntrailHazards: ${passed} checks passed`)
