import assert from 'node:assert/strict'
import { BASE_STATS, withBackgroundBonuses } from '../characterContext'
import { copySaddleSnapshot } from './saddleSnapshot'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'

const initial: OregonTrailState = {
  ...DEFAULT_STATE, phase: 'character_creation', day: 4, distance: 40, totalMilesTraveled: 40,
  milesUntilNextLandmark: 62, nextLandmark: 'Kansas River Crossing',
  party: [{ id: 'leader', name: 'Mae Reed', health: 100, isSick: false, role: 'leader' }],
  food: 500, ammunition: 100, medicine: 10, spareParts: 5, clothing: 5, oxen: 4, morale: 80,
  wagonCondition: 100, weather: 'fair', pace: 'steady', rations: 'filling',
}
const finalized = withBackgroundBonuses({ ...BASE_STATS, Luck: 16, Shrewdness: 16 }, 'gambler')
const entered = gameReducer(initial, { type: 'BEGIN_JOURNEY', saddle: finalized })
assert.equal(entered.phase, 'town')
assert.equal(entered.currentLandmark, 'Independence, Missouri')
assert.deepEqual(entered.saddle, finalized, 'same finalized six stats reach the live trail action')
assert.equal(entered.saddle?.Luck, 18, 'background bonus is included once')
finalized.Luck = 1
assert.equal(entered.saddle?.Luck, 18, 'reducer owns a copy, not the caller object')
const restored = gameReducer(initial, { type: 'LOAD_STATE', savedState: JSON.parse(JSON.stringify(entered)) })
assert.deepEqual(restored.saddle, entered.saddle, 'normal trail save/reload retains the snapshot')
const legacy = gameReducer(initial, { type: 'BEGIN_JOURNEY' })
assert.equal(legacy.saddle, undefined, 'old caller keeps the established optional-snapshot fallback')
assert.deepEqual(gameReducer(entered, { type: 'BEGIN_JOURNEY' }).saddle, entered.saddle)
assert.equal(copySaddleSnapshot({ Luck: 18 }), undefined)
assert.equal(copySaddleSnapshot({ ...BASE_STATS, Luck: Infinity }), undefined)
assert.deepEqual(copySaddleSnapshot({ ...BASE_STATS, Luck: 99, Agility: -2 }), { ...BASE_STATS, Luck: 20, Agility: 1 })

function begin(stats: typeof BASE_STATS, overrides: Partial<OregonTrailState> = {}) {
  const town = gameReducer({ ...initial, ...overrides }, { type: 'BEGIN_JOURNEY', saddle: stats })
  return gameReducer(town, { type: 'LEAVE_TOWN' })
}
const random = Math.random
try {
  Math.random = () => 0.99
  const plainRain = gameReducer(begin(BASE_STATS, { weather: 'rain' }), { type: 'TRAVEL' })
  const luckyRain = gameReducer(begin(withBackgroundBonuses({ ...BASE_STATS, Luck: 16 }, 'gambler'), { weather: 'rain' }), { type: 'TRAVEL' })
  assert.ok(luckyRain.distance > plainRain.distance, 'begin-journey Luck actually changes daily rain miles')
  const strain = { pace: 'grueling' as const, rations: 'bare_bones' as const }
  const plainHealth = gameReducer(begin(BASE_STATS, strain), { type: 'TRAVEL' })
  const toughHealth = gameReducer(begin(withBackgroundBonuses({ ...BASE_STATS, Durability: 15 }, 'doctor'), strain), { type: 'TRAVEL' })
  assert.ok(toughHealth.party[0].health > plainHealth.party[0].health, 'begin-journey Durability reaches travel health')
  const plainWear = gameReducer(begin(BASE_STATS), { type: 'TRAVEL' })
  const expertWear = gameReducer(begin(withBackgroundBonuses({ ...BASE_STATS, Expertise: 16 }, 'frontier_scout')), { type: 'TRAVEL' })
  assert.ok(expertWear.wagonCondition > plainWear.wagonCondition, 'begin-journey Expertise reduces actual wagon wear')
  Math.random = () => 0.2
  const plainHunt = gameReducer(begin(BASE_STATS), { type: 'HUNT' })
  const scoutHunt = gameReducer(begin(withBackgroundBonuses({ ...BASE_STATS, Agility: 16 }, 'frontier_scout')), { type: 'HUNT' })
  assert.equal(plainHunt.food, initial.food)
  assert.ok(scoutHunt.food > plainHunt.food, 'begin-journey Agility reaches the existing hunt resolver')
} finally { Math.random = random }
console.log('Live SADDLE action: all six copied/saved stats, background bonuses, legacy fallback and travel/hunt consumers PASS')

