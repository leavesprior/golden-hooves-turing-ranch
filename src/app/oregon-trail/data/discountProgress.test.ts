import assert from 'node:assert/strict'
import { getNextTierProgress, tierProgressPercent } from './discountEngine'
import { EARLY_DISCOUNT_MARKER } from '@/lib/locations'

// Playtest 2026-09-23: at 0 clues the bar rendered FULL (0/0*100 = NaN%) next to
// "Ready for Welcome Prospector!" and a locked badge.
const fresh = getNextTierProgress(0)
assert.equal(fresh.nextTier, 'welcome')
const width = tierProgressPercent(0, 'welcome')
assert.ok(Number.isFinite(width), 'width is a real number')
assert.equal(width, 0, 'Welcome is not earned by clues: the bar stays empty')
assert.equal(tierProgressPercent(5, 'welcome'), 0, 'no Infinity% either')
assert.doesNotMatch(fresh.message, /Ready for/, 'no false "ready" promise for an unearned tier')
assert.equal(fresh.message, `Find ${EARLY_DISCOUNT_MARKER} ranch markers to earn Welcome Prospector (5% off)`)

// Ordinary tiers keep their clue math.
assert.equal(tierProgressPercent(0, 'bronze'), 0)
assert.equal(Math.round(tierProgressPercent(2, 'bronze')), 67)
assert.equal(tierProgressPercent(9, 'bronze'), 100, 'clamped at 100')
assert.equal(tierProgressPercent(3, 'silver'), 60)
console.log('discountProgress: ok')
