import assert from 'node:assert/strict'
import { buildProductionJourneyImport } from './bobrJourneyAdapter'

assert.equal(buildProductionJourneyImport({ crossGame: null }), null)
assert.equal(buildProductionJourneyImport({ crossGame: { milestones: 'bad', eventLog: {} } }), null)

const imported = buildProductionJourneyImport({
  crossGame: {
    milestones: [
      { id: 'time_chase_complete' },
      { id: 'completed_journey_west' },
      { id: 'reached_west_point' },
    ],
    eventLog: [
      { mode: 'prospectors_tale', action: 'survived_trail', label: 'The party survived the trail.' },
      { mode: 'prospectors_tale', action: 'generous_sharing', label: 'Shared freight after the crossing.' },
      { mode: 'prospectors_tale', action: 'npc_befriended', label: 'Earned a guide\'s trust.', impact: { reputationDelta: { natives: 4 } } },
    ],
  },
  whereInTime: {
    phase: 'won',
    state: { traits: [{ label: 'Tare', value: 'shaved brass' }] },
  },
  trailSave: {
    gamePhase: 'gold_country',
    currentChapter: 2,
    cluesGathered: ['freight manifest'],
  },
})

assert.ok(imported)
assert.equal(imported.timeChaseComplete, true)
assert.equal(imported.trailComplete, true)
assert.equal(imported.reachedGoldCountry, true)
assert.equal(imported.tradeSafetyDelta, 16)
assert.equal(imported.routeTrustDelta, 7)
assert.ok(imported.evidence.some((item) => item.includes('shaved brass')))
assert.ok(imported.evidence.includes('freight manifest'))

console.log('bobrJourneyAdapter tests passed')
