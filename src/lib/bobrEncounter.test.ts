import assert from 'node:assert/strict'
import { validateEncounterDefinition, VOLCANO_THEATRE_ENCOUNTER } from './bobrEncounter'

assert.deepEqual(validateEncounterDefinition(VOLCANO_THEATRE_ENCOUNTER), [])
assert.equal(VOLCANO_THEATRE_ENCOUNTER.triggers.length, 4)
assert.equal(VOLCANO_THEATRE_ENCOUNTER.triggers.some((trigger) => trigger.coordinates), false, 'coordinates must wait for field verification')
assert.equal(VOLCANO_THEATRE_ENCOUNTER.authority.llmMayAddFacts, false)
assert.equal(VOLCANO_THEATRE_ENCOUNTER.authority.llmMayChangeState, false)
assert.equal(VOLCANO_THEATRE_ENCOUNTER.actions.some((action) => action.availableTo === 'all'), true)

console.log('bobrEncounter tests passed')
