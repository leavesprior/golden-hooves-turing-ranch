import assert from 'node:assert/strict'
import { buildKarmaMarketSignal } from './bobrMarketSignal'

assert.deepEqual(buildKarmaMarketSignal({}), {
  good: 0, neutral: 0, bad: 0, bias: 0, source: 'cross_game_ledger', chainStatus: 'resolve_later',
})
assert.equal(buildKarmaMarketSignal({ good: 75, neutral: 20, bad: 25 }).bias, 0.5)
assert.equal(buildKarmaMarketSignal({ good: 0, bad: 10 }).bias, -1)
assert.equal(buildKarmaMarketSignal({ good: Number.NaN, bad: -3 }).bias, 0)

console.log('bobrMarketSignal tests passed')
