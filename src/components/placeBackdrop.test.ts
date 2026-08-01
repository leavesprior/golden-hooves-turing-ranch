/**
 * PlaceBackdrop scene-mapping contract.
 *
 * The DB32 scene map is keyed by PLACE id, and RiverCrossing.tsx BUILDS its id
 * from the crossing's display name at runtime:
 *
 *   'ot_' + name.toLowerCase().replace(/ crossing$/, '').replace(/[^a-z]+/g, '_')
 *
 * so a rename on either side silently downgrades the crossing to its PNG with no
 * error anywhere. These tests pin that contract, and pin the placement law.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LANDMARKS } from '../app/oregon-trail/state/constants'

let passed = 0
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ok  ${name}`) }

const src = readFileSync(join(__dirname, 'PlaceBackdrop.tsx'), 'utf8')

const sceneMap: Record<string, string> = (() => {
  const m = src.match(/DB32_SCENE_BY_PLACE[^=]*=\s*\{([\s\S]*?)\n\}/)
  if (!m) throw new Error('DB32_SCENE_BY_PLACE not found')
  return Object.fromEntries([...m[1].matchAll(/(\w+):\s*'(\w+)'/g)].map(x => [x[1], x[2]]))
})()

const sceneKeys: string[] = (() => {
  const m = src.match(/type Db32SceneKey\s*=([\s\S]*?)\n\n/)
  if (!m) throw new Error('Db32SceneKey not found')
  return [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1])
})()

/** Mirrors RiverCrossing.tsx's id construction exactly. */
const riverIdFor = (riverName: string) =>
  'ot_' + riverName.toLowerCase().replace(/ crossing$/, '').replace(/[^a-z]+/g, '_')

console.log('PlaceBackdrop scene map')

check('PLACEMENT LAW: no place may map to the `map` scene', () => {
  // A trail map is never a place backdrop. /explore is a photo, /map is the local
  // map, a trail town is walkable — a map inside PlaceBackdrop is always wrong.
  assert.ok(sceneKeys.includes('map'), 'the `map` scene should still exist for the map surface')
  const offenders = Object.entries(sceneMap).filter(([, scene]) => scene === 'map')
  assert.equal(offenders.length, 0, `map scene must not back a place: ${JSON.stringify(offenders)}`)
})

check('every mapped scene is a real Db32SceneKey', () => {
  for (const [place, scene] of Object.entries(sceneMap)) {
    assert.ok(sceneKeys.includes(scene), `${place} -> '${scene}' is not a Db32SceneKey`)
  }
})

check('river crossings on the trail resolve to ids the scene map knows', () => {
  const riverLandmarks = LANDMARKS.filter(l => l.type === 'river')
  assert.ok(riverLandmarks.length > 0, 'the trail should have river crossings')

  const mapped = riverLandmarks.filter(l => sceneMap[riverIdFor(l.name)] === 'river')
  assert.ok(
    mapped.length >= 2,
    'river crossings should reach the generic ford scene; ' +
      `mapped ${mapped.length}/${riverLandmarks.length}: ` +
      riverLandmarks.map(l => `${l.name} -> ${riverIdFor(l.name)}`).join(', '),
  )
})

check('the id builder produces the exact keys the map declares', () => {
  // The bug this catches: someone renames "Kansas River Crossing" and the derived
  // id stops matching `ot_kansas_river`, silently dropping back to the PNG.
  assert.equal(riverIdFor('Kansas River Crossing'), 'ot_kansas_river')
  assert.equal(riverIdFor('Raft River'), 'ot_raft_river')
  assert.equal(riverIdFor('Humboldt River'), 'ot_humboldt_river')
  for (const id of ['ot_kansas_river', 'ot_raft_river', 'ot_humboldt_river']) {
    assert.equal(sceneMap[id], 'river', `${id} must map to the ford scene`)
  }
})

check('authored scenes with no place are reported, not silently forgotten', () => {
  const used = new Set(Object.values(sceneMap))
  const unused = sceneKeys.filter(k => !used.has(k))
  // `map` is unused BY LAW; `vane` is wired directly in WantedPoster, not here.
  const expectedUnused = ['battle', 'bearvalley', 'columbia', 'lookout', 'map', 'office', 'vane']
  assert.deepEqual(
    unused.sort(),
    expectedUnused.sort(),
    'authored-but-unplaced scene list changed — update this list deliberately, ' +
      'so art never goes unreachable without someone noticing',
  )
})

console.log(`\nPlaceBackdrop scene map: ${passed} checks passed`)
