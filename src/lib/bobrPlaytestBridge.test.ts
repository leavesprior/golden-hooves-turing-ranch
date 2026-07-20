import assert from 'node:assert/strict'
import { campaignReducer, createLocalCampaign } from './bobrLocalCampaign'
import { PLAYTEST_SYNC_ENABLED, syncPlaytestOutcome } from './bobrPlaytestBridge'

const setup = createLocalCampaign(1849)
const escape = campaignReducer(setup, {
  type: 'START',
  profile: { name: 'Bridge Test', role: 'sleuth', ageMode: 'adult', presentation: 'self_described' },
})

assert.equal(PLAYTEST_SYNC_ENABLED, false, 'production progression bridge must default off')
assert.equal(syncPlaytestOutcome(setup, escape), false, 'disabled bridge must be inert')
console.log('bobrPlaytestBridge tests passed')
