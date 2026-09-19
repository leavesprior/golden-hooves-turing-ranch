/**
 * The spatial ledger, made executable. Every number the ledger states about
 * where the 1849 camps sit is recomputed here from the stored coordinates.
 * Passing says the camp matches TODAY'S ground to the stated tolerance. It says
 * nothing about 1849 positions, which are mostly unknown (TOWN_GEO.*.unknowns).
 */
import assert from 'node:assert/strict'
import horizons from '../data/towns/horizons.json'
import { buildAscii2Scene, renderFrame } from './ascii2Walk'
import { ascii2TownFor } from './ascii2Towns'
import { TOWN_GEO, bearingDeg, compassPoint, distanceM, geoToTile, HEADING_BEARING } from './townGeo'
import { normalizeTownWalkSnapshot, townWalkMap, townWalkTileAt, VOLCANO_CREEK_TILES } from './townWalk'

const vol = TOWN_GEO.volcano
const map = townWalkMap('volcano')!
const tile = (id: string) => {
  const r = vol.references.find((x) => x.id === id)!
  return { ref: r, at: geoToTile(vol, r.point)! }
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

// 1. The transform: anchor maps to its tile, scale comes from the stated crossing.
assert.deepEqual(geoToTile(vol, vol.anchor.point), vol.anchor.tile)
{
  const { ref, at } = tile('creek-crossing')
  assert.ok(Math.abs(at.y - ref.gameTile!.y) < 0.02, `the scale is set by the crossing being ${ref.gameTile!.y - vol.anchor.tile.y} rows south`)
  assert.ok(dist(at, ref.gameTile!) <= 0.5, `the plank crossing is within half a tile (60 m) of the real one: ${dist(at, ref.gameTile!).toFixed(2)}`)
  assert.equal(townWalkTileAt(map, ref.gameTile!)?.terrain, 'planks')
}

// 2. The creek list IS the georeferenced centreline, rounded per column and
//    joined 4-connected — derived again here, so the list and the evidence
//    cannot drift apart.
{
  const pts = vol.references.filter((r) => r.id.startsWith('sutter-creek-')).map((r) => geoToTile(vol, r.point)!).sort((a, b) => a.x - b.x)
  const yAt = (x: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]
      if (x >= a.x && x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x)
    }
    return x < pts[0].x ? pts[0].y : pts[pts.length - 1].y
  }
  const ys = Array.from({ length: map.width }, (_, x) => Math.round(yAt(x)))
  const derived = new Set<string>()
  ys.forEach((y, x) => {
    derived.add(`${x},${y}`)
    if (x > 0) for (let yy = Math.min(ys[x - 1], y); yy <= Math.max(ys[x - 1], y); yy++) derived.add(`${x},${yy}`)
  })
  assert.deepEqual(new Set(VOLCANO_CREEK_TILES.map(([x, y]) => `${x},${y}`)), derived, 'VOLCANO_CREEK_TILES drifted from the georeferenced centreline')
  // And the map actually carries it: water, or planks where the road crosses.
  for (const [x, y] of VOLCANO_CREEK_TILES) {
    assert.ok(['water', 'planks'].includes(townWalkTileAt(map, { x, y })!.terrain), `creek tile ${x},${y} is not water`)
  }
  // Every creek sample inside the camp is within 0.75 tile (90 m) of a creek tile.
  let worst = 0
  for (const p of pts) {
    if (p.x < -0.5 || p.x > map.width - 0.5 || p.y < -0.5 || p.y > map.height - 0.5) continue
    const near = Math.min(...VOLCANO_CREEK_TILES.map(([x, y]) => dist(p, { x, y })))
    worst = Math.max(worst, near)
  }
  assert.ok(worst <= 0.75, `worst creek error ${worst.toFixed(2)} tiles`)
}

// 3. The graves sit on today's Pioneer Cemetery, within a tile.
{
  const { ref, at } = tile('cemetery')
  const target = map.targets.find((t) => t.id === 'vol_cemetery')!
  assert.deepEqual(target.position, ref.gameTile, 'the ledger names the cemetery tile the map uses')
  assert.ok(dist(at, target.position) <= 1, `cemetery error ${dist(at, target.position).toFixed(2)} tiles`)
  assert.equal(ref.era1849, 'unknown', 'do not let this read as an 1849 burial ground')
}

// 4. Later sites: evidence outranks the painting, and a far site stays far.
{
  const scene = buildAscii2Scene(ascii2TownFor('volcano')!, normalizeTownWalkSnapshot('volcano', undefined)!)!
  const hotel = scene.ghosts.find((g) => g.id === 'vol_st_george')!
  assert.equal(hotel.placedBy, 'geo')
  const want = tile('st-george').at
  assert.ok(dist(hotel.position, want) <= 1, `St. George fog ${JSON.stringify(hotel.position)} vs ground ${want.x.toFixed(2)},${want.y.toFixed(2)}`)
  assert.equal(scene.ghosts.find((g) => g.id === 'vol_theatre')!.placedBy, 'painting', 'no footprint for the theatre: still the painted pin')
  assert.equal(scene.distant.length, 0, 'every Volcano later site stands inside the camp')

  const wp = buildAscii2Scene(ascii2TownFor('west_point')!, normalizeTownWalkSnapshot('west_point', undefined)!)!
  assert.ok(!wp.ghosts.some((g) => g.id === 'wp_sandy_gulch'), 'Sandy Gulch is 2 miles off: never on a camp tile')
  const gulch = wp.distant.find((d) => d.id === 'wp_sandy_gulch')!
  assert.ok(Math.abs(gulch.bearing - 210) < 3, `Sandy Gulch bearing ${gulch.bearing.toFixed(1)}`)
  assert.equal(compassPoint(gulch.bearing), 'SSW')
  assert.ok(Math.abs(gulch.distanceM - 2348) < 50, `Sandy Gulch distance ${gulch.distanceM.toFixed(0)} m`)
  assert.ok(/south-southwest/.test(gulch.notYet), 'its line gives the real direction')
  assert.equal(TOWN_GEO.west_point.metersPerTile, null, 'West Point has no measured scale; do not pretend one')
  // Facing south from spawn, Sandy Gulch (bearing 210) is in view and says where it is.
  const southFrom = renderFrame(wp, wp.map.spawn, 'down')
  assert.ok(/Toward the SSW, 2\.3 km off: Sandy Gulch/.test(southFrom.status), `status: "${southFrom.status}"`)
  const northFrom = renderFrame(wp, wp.map.spawn, 'up')
  assert.ok(!/Sandy Gulch/.test(northFrom.status), 'facing north you cannot see a site to the SSW')
}

// 5. Bearing helpers agree with a known pair (the two landmark markers).
{
  const b = bearingDeg(vol.anchor.point, TOWN_GEO.west_point.anchor.point)
  assert.ok(b > 110 && b < 130, `West Point lies ESE-SE of Volcano: ${b.toFixed(1)}`)
  assert.ok(Math.abs(distanceM(vol.anchor.point, TOWN_GEO.west_point.anchor.point) - 10.4e3) < 600)
  assert.deepEqual(HEADING_BEARING, { up: 0, right: 90, down: 180, left: 270 })
}

// 6. The horizon: complete, and it tells the two towns apart the way the ground
//    does — Volcano walled in (a bowl), West Point open on a ridge.
{
  const mean = (id: 'volcano' | 'west_point') => {
    const p = horizons[id].profile.map(([, nearDeg, , farDeg]) => Math.max(nearDeg as number, farDeg as number))
    return p.reduce((a, b) => a + b, 0) / p.length
  }
  for (const id of ['volcano', 'west_point'] as const) {
    assert.equal(horizons[id].profile.length, 36, `${id}: 36 bearings`)
    assert.equal(horizons[id].missing_samples, 0, `${id}: no missing elevation samples`)
    assert.deepEqual(horizons[id].origin, { lat: TOWN_GEO[id].anchor.point.lat, lon: TOWN_GEO[id].anchor.point.lon }, `${id}: horizon seen from the anchor`)
  }
  assert.ok(mean('volcano') > 6 && mean('west_point') < 2.5, `bowl ${mean('volcano').toFixed(1)} deg vs ridge ${mean('west_point').toFixed(1)} deg`)
  const vw = horizons.volcano.profile.find(([b]) => b === 270)!
  const ve = horizons.volcano.profile.find(([b]) => b === 90)!
  assert.ok(Math.max(vw[1] as number, vw[3] as number) > 2 * Math.max(ve[1] as number, ve[3] as number), 'Volcano: the west wall stands twice as high as the east')
}

console.log(JSON.stringify({ ok: true, metersPerTile: vol.metersPerTile, creekTiles: VOLCANO_CREEK_TILES.length }))
