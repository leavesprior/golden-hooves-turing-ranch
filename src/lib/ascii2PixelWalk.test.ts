import assert from 'node:assert/strict'
import { buildAscii2Scene } from './ascii2Walk'
import { ascii2TownFor } from './ascii2Towns'
import { pixelFacesAhead, pixelKindAt, pixelSkyline } from './ascii2PixelWalk'
import { normalizeTownWalkSnapshot } from './townWalk'

const volcano = ascii2TownFor('volcano')!
const snap = normalizeTownWalkSnapshot('volcano', undefined)!
const scene = buildAscii2Scene(volcano, snap)!
const allow = () => true

assert.equal(pixelSkyline('volcano'), 'limestone-bowl')
assert.equal(pixelSkyline('west_point'), 'pine-road')

// Spawn (10,9) facing north is the Theatre ghost — same camera as ascii2.
const spawnNorth = pixelFacesAhead(scene, snap.position, 'up', allow)
const theatre = spawnNorth.find((f) => f.kind === 'fog' && /theatre/i.test(f.label || ''))
assert.ok(theatre, 'spawn looking north must show the Theatre as fog, not brick')
assert.ok(theatre.depth >= 0)

const onGhost = pixelKindAt(scene, { x: 10, y: 5 }, allow)
assert.equal(onGhost.kind, 'fog')
assert.match(onGhost.label || '', /theatre/i)

const josiah = pixelKindAt(scene, { x: 8, y: 5 }, allow)
assert.equal(josiah.kind, 'npc')
assert.match(josiah.label || '', /Josiah/i)

const creek = pixelKindAt(scene, { x: 10, y: 6 }, allow)
// The creek is a row of water; spawn road is dirt. Off-map is brush.
const off = pixelKindAt(scene, { x: -1, y: 0 }, allow)
assert.equal(off.kind, 'brush')

const westOfJosiah = pixelFacesAhead(scene, { x: 9, y: 5 }, 'left', allow)
assert.ok(
  westOfJosiah.some((f) => f.kind === 'npc' || f.kind === 'canvas'),
  'looking west from 9,5 must show the canvas camp or Josiah, not empty dusk',
)

console.log(JSON.stringify({ ok: true, spawnFog: theatre.label, josiah: josiah.label, creek: creek.kind }))
