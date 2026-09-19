import assert from 'node:assert/strict'
import {
  TOWN_WALK_VERSION, TOWN_WALK_TILE_SIZE, townWalkMap, townWalkTileAt,
  isTownWalkPassable, stepTownWalk, adjacentTownWalkTargets, normalizeTownWalkSnapshot,
  type TownWalkMap, type TownWalkPosition, type TownWalkDirection,
} from './townWalk'

const directions: TownWalkDirection[] = ['up', 'down', 'left', 'right']
const key = (position: TownWalkPosition) => `${position.x},${position.y}`
function reachable(map: TownWalkMap) {
  const visited = new Map([[key(map.spawn), map.spawn]])
  const queue = [map.spawn]
  while (queue.length) {
    const position = queue.shift()!
    for (const direction of directions) {
      const next = stepTownWalk(map, position, direction)
      if (visited.has(key(next))) continue
      visited.set(key(next), next)
      queue.push(next)
    }
  }
  return [...visited.values()]
}

for (const townId of ['volcano', 'west_point'] as const) {
  const allowedAttractions = townId === 'volcano'
    ? new Set(['vol_canvas_flat', 'vol_soldiers_gulch', 'vol_cemetery']) : new Set(['wp_trail_camp'])
  const seenAttractions = new Set<string>()
  const seenNpcs = new Set<string>()
  for (const roomId of ['exterior', 'shelter'] as const) {
    const map = townWalkMap(townId, roomId)!
    assert.ok(map)
    assert.equal(map.townId, townId); assert.equal(map.roomId, roomId)
    assert.equal(map.width * TOWN_WALK_TILE_SIZE, 320)
    assert.equal(map.height * TOWN_WALK_TILE_SIZE, 176)
    assert.equal(map.terrainRows.length, map.height)
    assert.ok(map.terrainRows.every(row => row.length === map.width && /^[g.~=f]+$/.test(row)))
    assert.equal(map.year, 1849); assert.equal(map.fictional, true)
    assert.match(map.notes, /fictional|invented/i)
    assert.ok(map.sources.includes('docs/CHASE_ART_BIBLE_20260614.md'))
    assert.ok(isTownWalkPassable(map, map.spawn), 'every scene starts on traversable ground')
    assert.equal(new Set(map.props.map(item => key(item.position))).size, map.props.length, 'props do not conceal one another')
    assert.equal(new Set(map.targets.map(target => target.id)).size, map.targets.length, 'local interaction IDs are unique within a room')
    for (const item of map.props) {
      assert.ok(townWalkTileAt(map, item.position), 'props lie within the authored grid')
      if (item.blocksMovement) assert.equal(isTownWalkPassable(map, item.position), false)
    }
    const reached = reachable(map)
    assert.ok(reached.length > 20, 'the spawn is connected to a usable room, not a tiny isolated pocket')
    for (const target of map.targets) {
      assert.ok(townWalkTileAt(map, target.position), 'target lies within the grid')
      // Check geometric adjacency independently of the interaction helper.
      const approach = reached.find(position => Math.abs(position.x - target.position.x) + Math.abs(position.y - target.position.y) <= 1)
      assert.ok(approach, `${townId}/${roomId}: ${target.id} is reachable from spawn`)
      assert.ok(adjacentTownWalkTargets(map, approach).includes(target), 'reaching a target makes its action available')
      if ('attractionId' in target) { assert.ok(allowedAttractions.has(target.attractionId)); seenAttractions.add(target.attractionId) }
      if (target.kind === 'npc') {
        seenNpcs.add(target.npcId)
        assert.equal(isTownWalkPassable(map, target.position), false, 'walkers do not pass through NPCs')
      }
      if (target.kind === 'entrance' || target.kind === 'exit') {
        const destination = townWalkMap(townId, target.destination.roomId)!
        assert.ok(destination, 'door points to an existing room in the same town')
        assert.ok(isTownWalkPassable(map, target.position), 'a doorway can be occupied')
        assert.ok(isTownWalkPassable(destination, target.destination.position), 'door arrival never lands in a prop')
        assert.notEqual(destination.roomId, roomId)
        const reciprocalKind = target.kind === 'entrance' ? 'exit' : 'entrance'
        assert.ok(destination.targets.some(other => other.kind === reciprocalKind && other.destination.roomId === roomId), 'rooms have a return route')
        assert.ok(reachable(destination).some(position => key(position) === key(target.destination.position)), 'door destination belongs to the room\'s connected floor')
      }
    }
    // Every movement is one orthogonal cell or no movement; never diagonal or a jump.
    for (const position of reached) for (const direction of directions) {
      const next = stepTownWalk(map, position, direction)
      const distance = Math.abs(next.x - position.x) + Math.abs(next.y - position.y)
      assert.ok(distance === 0 || distance === 1)
      assert.ok(isTownWalkPassable(map, next))
    }
    const saved = { version: TOWN_WALK_VERSION, townId, roomId, position: reached.at(-1)! }
    assert.deepEqual(normalizeTownWalkSnapshot(townId, JSON.parse(JSON.stringify(saved))), saved, 'versioned safe position round-trips')
    const normalized = normalizeTownWalkSnapshot(townId, saved)!
    normalized.position.x = -100
    assert.notEqual(saved.position.x, -100, 'normalization does not expose the saved position object for mutation')
  }
  const exterior = townWalkMap(townId)!
  const entrance = exterior.targets.find(target => target.kind === 'entrance')!
  assert.equal(entrance.kind, 'entrance')
  if (entrance.kind !== 'entrance') throw new Error('missing entrance')
  const inside = townWalkMap(townId, entrance.destination.roomId)!
  const exit = inside.targets.find(target => target.kind === 'exit')!
  assert.equal(exit.kind, 'exit')
  if (exit.kind !== 'exit') throw new Error('missing exit')
  // Enter from the doorway itself, a valid approach different from the fixed
  // exterior fallback. A reload inside must preserve that exact approach cell.
  const approach = { ...entrance.position }
  assert.ok(adjacentTownWalkTargets(exterior, approach).includes(entrance))
  assert.notDeepEqual(approach, exit.destination.position)
  const entered = { version: TOWN_WALK_VERSION, townId, ...entrance.destination, exteriorReturnPosition: approach }
  const persisted = JSON.parse(JSON.stringify(entered))
  const reloaded = normalizeTownWalkSnapshot(townId, persisted)!
  assert.deepEqual(reloaded, entered, 'shelter reload retains the exact exterior approach')
  const returned = normalizeTownWalkSnapshot(townId, { ...reloaded, roomId: exit.destination.roomId, position: reloaded.exteriorReturnPosition })!
  assert.deepEqual(returned.position, approach, 'the saved approach is usable as the exterior return position')
  reloaded.exteriorReturnPosition!.x = -100
  assert.notEqual(persisted.exteriorReturnPosition.x, -100, 'normalization copies the exterior return object')
  for (const badReturn of [null, [], {}, { x: 1.5, y: 5 }, { x: NaN, y: 5 }, { x: 5, y: Infinity }, { x: '5', y: 5 }, { x: -1, y: 5 }, { x: 20, y: 5 }, exterior.targets.find(target => target.kind === 'npc')!.position]) {
    const recovered = normalizeTownWalkSnapshot(townId, { ...entered, exteriorReturnPosition: badReturn })!
    assert.equal(Object.hasOwn(recovered, 'exteriorReturnPosition'), false, 'invalid return data is dropped, not guessed')
    assert.deepEqual(recovered.position, entered.position, 'invalid return data does not discard a valid shelter position')
  }
  assert.deepEqual(seenAttractions, allowedAttractions, 'all current attractions remain reachable; no later attraction or secret is introduced')
  assert.deepEqual(seenNpcs, new Set([townId === 'volcano' ? 'v_bell' : 'wp_pack']))
}

const volcano = townWalkMap('volcano')!
const westPoint = townWalkMap('west_point')!
assert.notDeepEqual(volcano.terrainRows, westPoint.terrainRows, 'the bowl creek and pack road have distinct terrain')
assert.notDeepEqual(volcano.props, westPoint.props)
assert.equal(volcano.label, 'The canvas camp'); assert.equal(westPoint.label, 'The trail camp')
// The creek follows Sutter Creek's measured course (townGeo.ts); (1,8) is on it.
assert.equal(townWalkTileAt(volcano, { x: 1, y: 8 })?.terrain, 'water')
assert.deepEqual(stepTownWalk(volcano, { x: 1, y: 7 }, 'down'), { x: 1, y: 7 }, 'the creek blocks walking')
assert.deepEqual(stepTownWalk(volcano, { x: 10, y: 8 }, 'up'), { x: 10, y: 7 }, 'the authored plank crossing carries the walker')
assert.deepEqual(stepTownWalk(volcano, { x: 8, y: 6 }, 'up'), { x: 8, y: 6 }, 'Bell occupies his own cell')
assert.deepEqual(stepTownWalk(volcano, { x: 0, y: 5 }, 'left'), { x: 0, y: 5 }, 'walking beyond the edge is blocked')
assert.equal(adjacentTownWalkTargets(volcano, { x: 7, y: 6 }).some(target => target.kind === 'npc'), false, 'diagonal NPC proximity is not adjacency')
assert.equal(adjacentTownWalkTargets(volcano, { x: 8, y: 6 }).some(target => target.id === 'v_bell'), true)
assert.deepEqual(stepTownWalk(volcano, volcano.spawn, 'diagonal' as TownWalkDirection), volcano.spawn)

for (const badPosition of [null, [], {}, { x: 1.5, y: 2 }, { x: NaN, y: 2 }, { x: 2, y: Infinity }, { x: '2', y: 2 }, { x: -1, y: 3 }, { x: 20, y: 10 }, { x: 8, y: 5 }, { x: 1, y: 8 }]) {
  assert.equal(townWalkTileAt(volcano, badPosition as TownWalkPosition)?.blocked === false, false)
  assert.deepEqual(adjacentTownWalkTargets(volcano, badPosition as TownWalkPosition), [], 'malformed/blocked positions expose no actions')
  const normalized = normalizeTownWalkSnapshot('volcano', { version: 1, townId: 'volcano', roomId: 'exterior', position: badPosition })!
  assert.deepEqual(normalized.position, volcano.spawn)
  assert.deepEqual(stepTownWalk(volcano, badPosition as TownWalkPosition, 'right'), volcano.spawn, 'invalid input recovers to spawn without a bonus step')
}
// Migration: the 2026-09-18 creek correction turned the street's old east end
// (13,5) into creek. A save standing there must fall back to spawn, not strand
// the walker in water; a save on the old straight creek (3,7), now bank, stays put.
assert.deepEqual(normalizeTownWalkSnapshot('volcano', { version: 1, townId: 'volcano', roomId: 'exterior', position: { x: 13, y: 5 } })!.position, volcano.spawn)
assert.deepEqual(normalizeTownWalkSnapshot('volcano', { version: 1, townId: 'volcano', roomId: 'exterior', position: { x: 3, y: 7 } })!.position, { x: 3, y: 7 })
for (const invalid of [null, [], 'bad-json', {}, { version: 0, townId: 'volcano', roomId: 'shelter', position: { x: 4, y: 4 } }, { version: 1, townId: 'west_point', roomId: 'shelter', position: { x: 4, y: 4 } }, { version: 1, townId: 'volcano', roomId: 'castle', position: { x: 4, y: 4 } }]) {
  assert.deepEqual(normalizeTownWalkSnapshot('volcano', invalid), { version: 1, townId: 'volcano', roomId: 'exterior', position: volcano.spawn })
}
// This cell is open in West Point but canvas-blocked in Volcano: validate the
// return cell against the snapshot's own exterior, never its shelter or another town.
const returnCell = { x: 6, y: 3 }
const insideSave = { version: 1, townId: 'volcano', roomId: 'shelter', position: { x: 10, y: 8 }, exteriorReturnPosition: returnCell }
assert.equal(isTownWalkPassable(townWalkMap('volcano', 'shelter')!, returnCell), true)
assert.equal(normalizeTownWalkSnapshot('volcano', insideSave)!.exteriorReturnPosition, undefined)
assert.deepEqual(normalizeTownWalkSnapshot('west_point', { ...insideSave, townId: 'west_point' })!.exteriorReturnPosition, returnCell)
for (const invalidIdentity of [{ version: 0 }, { townId: 'west_point' }, { roomId: 'castle' }]) {
  const normalized = normalizeTownWalkSnapshot('volcano', { ...insideSave, exteriorReturnPosition: volcano.spawn, ...invalidIdentity })!
  assert.equal(Object.hasOwn(normalized, 'exteriorReturnPosition'), false, 'rejected snapshot identity cannot retain a return position')
}
for (const unsupported of ['bobr_cabin', 'bobr_ranch', 'unknown', '__proto__', 'constructor']) {
  assert.equal(townWalkMap(unsupported), undefined, 'unsupported towns never borrow West Point')
  assert.equal(normalizeTownWalkSnapshot(unsupported, null), undefined)
}
assert.equal(townWalkMap('volcano', '__proto__'), undefined)
console.log('Town walk: four authored scenes, all targets/doors reachable, orthogonal collisions, 1849 identities and safe versioned position recovery PASS')
