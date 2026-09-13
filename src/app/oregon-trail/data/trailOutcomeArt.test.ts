import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolveCrossing, type RiverState, type CrossingMethod } from './riverCrossings'
import { TRAIL_OUTCOME_ART } from './trailOutcomeArt'

const river: RiverState = { name: 'Test crossing', depth: 3.5, width: 180, currentSpeed: 2, condition: 'normal', ferryAvailable: true, ferryCost: 20, guideAvailable: true, guideCost: 15, waitDays: 2 }
const stats = { Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5 }
const originalRandom = Math.random
let draws = 0
Math.random = () => { draws++; return 0.5 }
try {
  const cases = [
    { method: 'ford', luck: 1, river, scene: 'rocks', draws: 3, effects: { foodLost: 55, ammoLost: 20, healthDelta: -20, specificInjury: { damage: 40, injuryType: 'hypothermia' }, wagonDamage: 15, moraleChange: -15 } },
    { method: 'ford', luck: 5, river: { ...river, depth: 2, condition: 'low' }, scene: 'mud', draws: 3, effects: { foodLost: 20, ammoLost: 7, healthDelta: -8, wagonDamage: 5, moraleChange: -8 } },
    { method: 'ford', luck: 5, river, scene: 'drifting', draws: 3, effects: { foodLost: 20, ammoLost: 7, healthDelta: -8, wagonDamage: 5, moraleChange: -8 } },
    { method: 'ford', luck: 5, river: { ...river, depth: 6, condition: 'high' }, scene: 'drifting', draws: 3, effects: { foodLost: 40, ammoLost: 7, healthDelta: -15, wagonDamage: 10, moraleChange: -8 } },
    { method: 'caulk', luck: 1, river, scene: 'drifting', draws: 3, effects: { foodLost: 80, ammoLost: 35, medicineUsed: 2, healthDelta: -15, wagonDamage: 25, moraleChange: -20 } },
    { method: 'caulk', luck: 5, river, scene: 'drifting', draws: 3, effects: { foodLost: 30, ammoLost: 5, wagonDamage: 8, moraleChange: -5 } },
    { method: 'ferry', luck: 1, river, scene: undefined, draws: 2, effects: { foodLost: 20, healthDelta: -10, moraleChange: -10, karmaChange: { neutral: 10 } } },
  ] as const
  for (const fixture of cases) {
    draws = 0
    const outcome = resolveCrossing(fixture.method, fixture.river, stats, fixture.luck)
    assert.equal(outcome.success, false)
    assert.equal(outcome.failureScene, fixture.scene)
    if (fixture.method === 'caulk' && fixture.luck === 1) assert.match(outcome.failureSceneCaption!, /^After the capsize:/)
    assert.deepEqual(outcome.effects, fixture.effects, 'illustration does not change existing losses')
    assert.equal(draws, fixture.draws, 'illustration consumes no extra random draws')
  }
  for (const method of ['ford', 'caulk', 'ferry', 'wait', 'guide'] as CrossingMethod[]) {
    const outcome = resolveCrossing(method, river, stats, 20)
    assert.equal(outcome.success, true)
    assert.equal(outcome.failureScene, undefined, 'success never shows a damaged wagon')
  }
} finally { Math.random = originalRandom }

for (const asset of Object.values(TRAIL_OUTCOME_ART)) {
  const png = readFileSync(new URL('../../../../public' + asset.src, import.meta.url))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 320)
  assert.equal(png.readUInt32BE(20), 180)
  assert.ok(asset.alt.length > 20)
}
console.log('Trail outcome art: failure branches, unchanged effects/RNG, success/ferry exclusions and 320x180 assets PASS')
