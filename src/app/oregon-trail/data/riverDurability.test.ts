import assert from 'node:assert/strict'
import { BASE_STATS } from '../characterContext'
import { resolveCrossing, type CrossingMethod, type CrossingOutcome, type RiverState } from './riverCrossings'

const river: RiverState = { name: 'Test crossing', depth: 3.5, width: 180, currentSpeed: 2, condition: 'normal', ferryAvailable: true, ferryCost: 20, guideAvailable: true, guideCost: 15, waitDays: 2 }
const originalRandom = Math.random
let draws = 0
function outcome(method: CrossingMethod, luck: number, durability: number, water = river) {
  draws = 0
  const value = resolveCrossing(method, water, { ...BASE_STATS, Durability: durability }, luck)
  return { value, draws }
}
function withoutSeverity(value: CrossingOutcome) {
  const otherEffects = { ...value.effects }
  const specificInjury = otherEffects.specificInjury
  delete otherEffects.healthDelta
  delete otherEffects.specificInjury
  const result = { ...value, effects: { ...otherEffects } } as CrossingOutcome
  if (specificInjury) result.effects.specificInjury = { ...specificInjury, damage: 0 }
  return result
}
try {
  Math.random = () => { draws++; return 0.5 }
  for (const method of ['ford', 'caulk', 'ferry', 'guide', 'wait'] as const) {
    for (const luck of [1, 5, 20]) {
      for (const condition of ['low', 'normal', 'high'] as const) {
        const water = { ...river, condition, depth: condition === 'low' ? 2 : condition === 'high' ? 6 : 3.5 }
        const baseline = outcome(method, luck, 5, water)
        for (const durability of [1, 5, 9, 13, 17, 18, 20, NaN, Infinity]) {
          const actual = outcome(method, luck, durability, water)
          assert.equal(actual.draws, baseline.draws, 'severity consumes no additional RNG')
          assert.deepEqual(withoutSeverity(actual.value), withoutSeverity(baseline.value), 'roll identity, success, art, prose, item loss and other effects stay unchanged')
          const reduction = method === 'ford' && Number.isFinite(durability) ? Math.max(0, Math.floor((durability - 5) / 4)) : 0
          assert.equal(actual.value.effects.healthDelta, baseline.value.effects.healthDelta === undefined
            ? undefined : baseline.value.effects.healthDelta < 0
              ? -Math.max(0, -baseline.value.effects.healthDelta - reduction)
              : baseline.value.effects.healthDelta)
          if (baseline.value.effects.specificInjury) assert.equal(actual.value.effects.specificInjury?.damage, Math.max(0, baseline.value.effects.specificInjury.damage - reduction))
        }
      }
    }
  }
  const critical = outcome('ford', 1, 17).value
  assert.equal(critical.success, false)
  assert.equal(critical.critical, true)
  assert.equal(critical.effects.healthDelta, -17)
  assert.equal(critical.effects.specificInjury?.damage, 37)
  assert.equal(critical.failureScene, 'rocks')
} finally { Math.random = originalRandom }
console.log('River Durability authored policy: baseline5, monotone injury mitigation, unchanged outcomes/art/resources and RNG PASS')
