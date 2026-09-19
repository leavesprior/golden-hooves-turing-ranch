import assert from 'node:assert/strict'
import { buildAscii2Scene } from './ascii2Walk'
import { ascii2TownFor } from './ascii2Towns'
import { bearingOffset, distantSitesInView, horizonAt, pixelFacesAhead, pixelKindAt, pixelSkyline, PIXEL_FOV_DEG } from './ascii2PixelWalk'
import horizons from '../data/towns/horizons.json'
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

// The creek follows its measured course; (8,7) is water beside the plank crossing. Off-map is brush.
const creek = pixelKindAt(scene, { x: 8, y: 7 }, allow)
assert.equal(creek.kind, 'water')
const off = pixelKindAt(scene, { x: -1, y: 0 }, allow)
assert.equal(off.kind, 'brush')

const westOfJosiah = pixelFacesAhead(scene, { x: 9, y: 5 }, 'left', allow)
assert.ok(
  westOfJosiah.some((f) => f.kind === 'npc' || f.kind === 'canvas'),
  'looking west from 9,5 must show the canvas camp or Josiah, not empty dusk',
)

// Faces carry their world tile, so texture can stay attached to the world.
for (const f of spawnNorth) assert.ok(Number.isInteger(f.at.x) && Number.isInteger(f.at.y))

// The horizon is the USGS profile, by bearing only.
{
  const at270 = horizons.volcano.profile.find(([b]) => b === 270)!
  assert.deepEqual(horizonAt('volcano', 270), { near: at270[1], far: at270[3] })
  assert.deepEqual(horizonAt('volcano', 630), horizonAt('volcano', 270), 'bearings wrap')
  const a = horizonAt('volcano', 0)!, z = horizonAt('volcano', 10)!, mid = horizonAt('volcano', 5)!
  assert.ok(Math.abs(mid.near - (a.near + z.near) / 2) < 1e-9, 'interpolates between samples')
  assert.equal(horizonAt('angels_camp', 0), null, 'no profile, no invented skyline')
  assert.equal(bearingOffset('up', 350), -10)
  assert.equal(bearingOffset('left', 300), 30)
}

// A far site sits at its bearing on screen, and only when it is in view.
{
  const wp = buildAscii2Scene(ascii2TownFor('west_point')!, normalizeTownWalkSnapshot('west_point', undefined)!)!
  const south = distantSitesInView(wp, 'down', 320)
  assert.equal(south.length, 1)
  const expect = 160 + ((south[0].site.bearing - 180) / PIXEL_FOV_DEG) * 320
  assert.ok(Math.abs(south[0].x - expect) < 1e-6 && south[0].x > 160, 'SSW is right of centre when facing south')
  assert.equal(distantSitesInView(wp, 'up', 320).length, 0)
}

console.log(JSON.stringify({ ok: true, spawnFog: theatre.label, josiah: josiah.label, creek: creek.kind }))
