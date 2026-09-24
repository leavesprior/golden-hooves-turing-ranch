import assert from 'node:assert/strict'
import { LIVING_TRAIL_CHAINS, LIVING_TRAIL_NODES, getChainNodes, isNodeInTimeWindow, type LivingTrailNode } from './livingTrailChains'
import { GOLD_COUNTRY_NPCS } from './goldCountryNPCs'

const at = (startHour: number, endHour: number): LivingTrailNode =>
  ({ ...LIVING_TRAIL_NODES[0], timeWindow: { startHour, endHour } })

// Daylight window (unchanged behaviour).
assert.equal(isNodeInTimeWindow(at(8, 18), 8), true)
assert.equal(isNodeInTimeWindow(at(8, 18), 17), true)
assert.equal(isNodeInTimeWindow(at(8, 18), 18), false)
assert.equal(isNodeInTimeWindow(at(8, 18), 3), false)
// A night window wraps midnight: 21:00 -> 02:00.
assert.equal(isNodeInTimeWindow(at(21, 2), 23), true, 'wrap: 23:00 is inside 21->2')
assert.equal(isNodeInTimeWindow(at(21, 2), 1), true, 'wrap: 01:00 is inside 21->2')
assert.equal(isNodeInTimeWindow(at(21, 2), 21), true)
assert.equal(isNodeInTimeWindow(at(21, 2), 2), false)
assert.equal(isNodeInTimeWindow(at(21, 2), 12), false)

// Structure: unique ids, every node in exactly one chain, every chain node exists,
// every chain starts with a node that has no prerequisite, every NPC exists.
assert.equal(new Set(LIVING_TRAIL_NODES.map((n) => n.id)).size, LIVING_TRAIL_NODES.length)
const npcIds = new Set(GOLD_COUNTRY_NPCS.map((n) => n.id))
for (const chain of LIVING_TRAIL_CHAINS) {
  const nodes = getChainNodes(chain.id)
  assert.equal(nodes.length, chain.nodeIds.length, `${chain.id}: every node id resolves`)
  assert.equal(nodes[0].prerequisiteNodeId, undefined, `${chain.id}: first node is open`)
  for (const n of nodes) {
    assert.equal(n.chainId, chain.id, `${n.id}: chainId matches`)
    assert.ok(npcIds.has(n.npcId), `${n.id}: npc ${n.npcId} exists`)
    assert.ok(n.geofence.radiusM >= 75, `${n.id}: radius >= 75 m`)
    assert.equal(n.remoteVariant.enabled, true, `${n.id}: playable from the ranch`)
  }
}
for (const n of LIVING_TRAIL_NODES) {
  assert.ok(LIVING_TRAIL_CHAINS.some((c) => c.nodeIds.includes(n.id)), `${n.id} belongs to a chain`)
}

// Volcano: only OSM-verified points (research VOLCANO_LOCAL_PLACES_20260923),
// a night ghost on the public street with a safety notice.
const vol = getChainNodes('vol_kept_burning')
assert.ok(vol.length >= 4, 'volcano chain has its stops')
const OSM = new Set(['38.44175,-120.63058', '38.4431,-120.63079', '38.44241,-120.6316'])
for (const n of vol) assert.ok(OSM.has(`${n.geofence.lat},${n.geofence.lng}`), `${n.id}: OSM-verified anchor`)
const ghost = vol.find((n) => n.id === 'lt_vol_fire_dragon')!
assert.ok(ghost, 'the Fire Dragon night stop exists')
assert.equal(isNodeInTimeWindow(ghost, 22), true, 'ghost walks at 22:00')
assert.equal(isNodeInTimeWindow(ghost, 0), true, 'ghost walks past midnight')
assert.equal(isNodeInTimeWindow(ghost, 14), false, 'no ghost at 14:00')
assert.match(ghost.safetyNotice ?? '', /public/i, 'ghost stop tells players to stay on public ground')
const dragon = GOLD_COUNTRY_NPCS.find((n) => n.id === ghost.npcId)!
assert.match([dragon.greeting, ...dragon.dialogueLines].join(' '), /legend/i, 'the ghost labels itself legend')
assert.match(dragon.dialogueLines.join(' '), /1853/, 'the ghost tells the documented burnings')

console.log(`livingTrailChains: ok (${LIVING_TRAIL_CHAINS.length} chains, ${LIVING_TRAIL_NODES.length} nodes)`)
