import assert from 'node:assert/strict'
import { metersBetween, revealOnMap, readDiscovered } from './oneMapDiscovery'
import { nearbyNpcs, parseSimulatedNear, PROXIMITY_NPCS } from './gpsProximity'

const ranch = { lat: 38.3947, lng: -120.5269 }
assert.equal(metersBetween(ranch, ranch), 0)
const westPoint = { lat: 38.3965, lng: -120.5269 }
const d = metersBetween(ranch, westPoint)
assert.equal(d > 100 && d < 400, true, `ranch↔west_point should be hundreds of meters, got ${d}`)

assert.equal(parseSimulatedNear('?near=bobr_ranch', 'backofbeyondranch.farm'), null, 'prod host cannot sim GPS')
const sim = parseSimulatedNear('?near=bobr_ranch', 'localhost')
assert.ok(sim)
assert.equal(sim.source, 'sim')
const seen = nearbyNpcs(sim)
assert.equal(seen.some((n) => n.id === 'tobias_gate'), true)
assert.equal(seen.some((n) => n.id === 'twain_angels'), false, 'Angels Camp must stay hidden from ranch GPS')

const far = nearbyNpcs({ lat: 0, lng: 0, accuracyM: 10, source: 'sim' })
assert.equal(far.length, 0)

revealOnMap('murphys')
assert.equal(readDiscovered().includes('murphys'), true)
assert.equal(readDiscovered().includes('independence'), true)

assert.equal(PROXIMITY_NPCS.every((n) => n.radiusM >= 180), true)
console.log('gpsProximity tests passed')
