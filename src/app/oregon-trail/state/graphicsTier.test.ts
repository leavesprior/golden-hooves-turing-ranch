import assert from 'node:assert/strict'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'

// visual64 invariant: the best presentation IS the game. The tier must never
// regress to the progression-lock era ('retro_4bit' default, dead unlock path).

// 1. New games start at ultra_64bit
assert.equal(DEFAULT_STATE.graphicsTier, 'ultra_64bit', 'DEFAULT_STATE must start at ultra_64bit')

// 2. Loading an old save (which carries retro_4bit from the lock era) must not
//    drag the presentation back down — LOAD_STATE pins the tier
const oldSave = { ...DEFAULT_STATE, graphicsTier: 'retro_4bit' as const, day: 12, distance: 640 }
const loaded = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: oldSave })
assert.equal(loaded.graphicsTier, 'ultra_64bit', 'LOAD_STATE must pin graphicsTier to the default')
assert.equal(loaded.day, 12, 'LOAD_STATE must still restore the rest of the save')
assert.equal(loaded.distance, 640, 'LOAD_STATE must still restore the rest of the save')

// 3. Reset keeps the elevated default
const reset = gameReducer(loaded, { type: 'RESET_GAME' })
assert.equal(reset.graphicsTier, 'ultra_64bit', 'RESET_GAME must keep ultra_64bit')

console.log('graphicsTier tests passed')
