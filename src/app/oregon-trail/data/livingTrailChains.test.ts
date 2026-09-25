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
const OSM = new Set(['38.44175,-120.63058', '38.4431,-120.63079', '38.44241,-120.6316', '38.4417812,-120.6307693'])
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
// Council 20260923_195527: the night stop's zero must be the public road, not the private hotel.
assert.equal(`${ghost.geofence.lat},${ghost.geofence.lng}`, '38.4417812,-120.6307693', 'Fire Dragon anchors on the OSM Main Street road node')
// A remote (daytime) play must not greet with 'after dark'.
assert.doesNotMatch(dragon.greeting, /after dark/i)

// Mokelumne Hill + Angels Camp: every anchor is on an explicit per-chain allow-list
// of OSM coordinates; ghosts label themselves legend; the Leger legend stays uncited-free.
const ALLOWED: Record<string, Set<string>> = {
  mh_courthouse_hill: new Set(['38.3004709,-120.7046552', '38.3011585,-120.7057368', '38.3010086,-120.7059348']),
  ac_frog_and_hearse: new Set(['38.0684646,-120.5393015', '38.0756818,-120.5457283']),
}
const npcText = (id: string) => {
  const n = GOLD_COUNTRY_NPCS.find((x) => x.id === id)!
  assert.ok(n, `npc ${id} exists`)
  return [n.title, n.greeting, n.personality, n.ollamaPrompt, ...n.dialogueLines].join(' ')
}
for (const [chainId, allowed] of Object.entries(ALLOWED)) {
  const chain = LIVING_TRAIL_CHAINS.find((c) => c.id === chainId)
  assert.ok(chain, `${chainId} exists`)
  assert.ok(chain!.completionLine, `${chainId}: completionLine`)
  const nodes = getChainNodes(chainId)
  assert.ok(nodes.length >= 2 && nodes.length <= 3, `${chainId}: 2-3 stops`)
  for (const n of nodes) assert.ok(allowed.has(`${n.geofence.lat},${n.geofence.lng}`), `${n.id}: allow-listed OSM anchor`)
}
assert.equal(LIVING_TRAIL_CHAINS.find((c) => c.id === 'mh_courthouse_hill')!.place, 'Mokelumne Hill, California')
assert.equal(LIVING_TRAIL_CHAINS.find((c) => c.id === 'ac_frog_and_hearse')!.place, 'Angels Camp, California')

const leger = getChainNodes('mh_courthouse_hill').find((n) => n.id === 'lt_mh_leger_ghost')!
assert.ok(leger, 'the Leger night stop exists')
assert.equal(isNodeInTimeWindow(leger, 22), true, 'Leger walks at 22:00')
assert.equal(isNodeInTimeWindow(leger, 0), true, 'Leger walks past midnight')
assert.equal(isNodeInTimeWindow(leger, 14), false, 'no Leger at 14:00')
assert.match(leger.safetyNotice ?? '', /public/i, 'Leger stop keeps players on public ground')
assert.equal(`${leger.geofence.lat},${leger.geofence.lng}`, '38.3010086,-120.7059348', 'Leger anchors on the public Main x Lafayette corner, not the hotel')
const legerText = npcText(leger.npcId)
assert.match(legerText, /legend/i, 'the Leger ghost labels itself legend')
assert.doesNotMatch(legerText, /shot|room \d/i, 'no uncited shooting or room-number claims')

const hearse = getChainNodes('ac_frog_and_hearse').find((n) => n.id === 'lt_ac_carly_wagon')!
assert.ok(hearse, 'the museum wagon stop exists')
assert.equal(isNodeInTimeWindow(hearse, 20), false, 'museum closed at 20:00')
assert.equal(isNodeInTimeWindow(hearse, 12), true, 'museum open at noon')
assert.match(npcText(hearse.npcId), /legend/i, 'the Carly wagon labels itself legend')
const coon = getChainNodes('ac_frog_and_hearse').find((n) => n.id === 'lt_ac_angels_hotel')!
assert.ok(coon, 'the Angels Hotel stop exists')
assert.match(npcText(coon.npcId), /legend/i, 'the Ben Coon ghost labels the ghost as legend')
assert.match(npcText(coon.npcId), /reportedly/i, 'the frog yarn is kept "reportedly"')

console.log(`livingTrailChains: ok (${LIVING_TRAIL_CHAINS.length} chains, ${LIVING_TRAIL_NODES.length} nodes)`)

// The Angels Hotel stop stands at the hotel: NE corner of S Main St x Birds Way (NRHP 72000220),
// OSM junction node 86883112, not Utica Park ~0.6 km away (Street View survey 2026-09-24).
{
  const hotelStop = LIVING_TRAIL_NODES.find((n) => n.id === 'lt_ac_angels_hotel')!
  const toRad = (d: number) => (d * Math.PI) / 180
  const m = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    6371000 * 2 * Math.asin(Math.sqrt(Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2))
  assert.ok(m(hotelStop.geofence, { lat: 38.0684646, lng: -120.5393015 }) < 30, 'hotel stop is on the Main x Birds Way corner')
  assert.ok(m(hotelStop.geofence, { lat: 38.0727006, lng: -120.5432579 }) > 400, 'not at Utica Park')
}

// Sandy Gulch: at the CHL #253 cairn (HMDB text, OSM-measured, seen in Street View), not the junction.
{
  const sg = LIVING_TRAIL_NODES.find((n) => n.id === 'lt_wp_sandy_gulch')!
  const toRad = (d: number) => (d * Math.PI) / 180
  const m = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    6371000 * 2 * Math.asin(Math.sqrt(Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2))
  assert.ok(m(sg.geofence, { lat: 38.379061, lng: -120.540014 }) < 30, 'Sandy Gulch stop is at the cairn')
  assert.ok(m(sg.geofence, { lat: 38.38019, lng: -120.532862 }) > 500, 'not at the Associated Office Rd junction')
}
