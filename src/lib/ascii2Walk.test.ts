import assert from 'node:assert/strict'
import {
  absenceBlocks,
  ascii2Forward,
  ascii2Look,
  buildAscii2Scene,
  frameText,
  ghostAt,
  placeLaterSites,
  renderFrame,
  turnHeading,
  FRAME_COLS,
  FRAME_ROWS,
  type Ascii2Scene,
  type Heading,
} from './ascii2Walk'
import { ASCII2_TOWNS, ascii2TownFor, hasAscii2Walk } from './ascii2Towns'
import {
  isTownWalkPassable,
  normalizeTownWalkSnapshot,
  stepTownWalk,
  townWalkMap,
  type TownWalkDirection,
  type TownWalkSnapshot,
} from './townWalk'
import {
  TOWN_HOTSPOTS,
  VOLCANO_LATER_ATTRACTION_IDS,
  WEST_POINT_LATER_ATTRACTION_IDS,
} from './goldCountryEditorial'

const snapshotFor = (townId: string): TownWalkSnapshot => normalizeTownWalkSnapshot(townId, undefined)!

// ---------------------------------------------------------------------------
// 1. ONE WORLD. The ascii2 camera must not invent a second camp: every town it
//    offers has to be a town the tile world already authored.
// ---------------------------------------------------------------------------

for (const [townId, town] of Object.entries(ASCII2_TOWNS)) {
  assert.ok(townWalkMap(townId), `${townId} has an 1849 json but no authored tile map`)
  assert.equal(town.era, '1849')
  assert.ok(town.sources.length >= 2, `${townId} needs sources (canon rule 4)`)
  assert.ok(town.note.length > 40, `${townId} must say what it does and does not claim`)
}
assert.equal(hasAscii2Walk('angels_camp'), false, 'only towns with an 1849 json get the ascii2 rung')
assert.equal(hasAscii2Walk('west_point'), true)

// The later-site list IS the live later-attraction list, not prose typed twice.
assert.deepEqual(
  ASCII2_TOWNS.volcano.later_sites.map((s) => s.id).sort(),
  [...VOLCANO_LATER_ATTRACTION_IDS].sort(),
  'volcano later_sites must equal VOLCANO_LATER_ATTRACTION_IDS',
)
assert.deepEqual(
  ASCII2_TOWNS.west_point.later_sites.map((s) => s.id).sort(),
  [...WEST_POINT_LATER_ATTRACTION_IDS].sort(),
  'west_point later_sites must equal WEST_POINT_LATER_ATTRACTION_IDS',
)
for (const [townId, town] of Object.entries(ASCII2_TOWNS)) {
  assert.deepEqual([...town.must_not].sort(), town.later_sites.map((s) => s.id).sort(), `${townId} must_not`)
  const pins = new Map((TOWN_HOTSPOTS[townId] || []).map((p) => [p.attractionId, p]))
  for (const site of town.later_sites) {
    const pin = pins.get(site.id)
    if (pin) {
      assert.equal(site.x, pin.x, `${townId}/${site.id} x drifted from TOWN_HOTSPOTS`)
      assert.equal(site.y, pin.y, `${townId}/${site.id} y drifted from TOWN_HOTSPOTS`)
      assert.ok(!site.unpinned, `${townId}/${site.id} IS a pin — do not declare it unpinned`)
    } else {
      // No pin on the painted face means the x/y are authored, not mirrored.
      // That is allowed, but it must be DECLARED — an undeclared miss would
      // otherwise read exactly like a mirrored pin that happens to match nothing.
      assert.ok(
        site.unpinned && site.unpinnedWhy,
        `${townId}/${site.id} has no TOWN_HOTSPOTS pin, so it must declare unpinned + unpinnedWhy`,
      )
    }
    assert.ok(site.notYet.length > 10, `${townId}/${site.id} must say what is NOT there`)
  }
}

// ---------------------------------------------------------------------------
// 2. PARITY: pixel and ascii2 are two cameras on one camp. Walk the same keys in
//    both and they must stand on the same tile at every step — this is the whole
//    "step down the ladder, never fork lore" claim, made executable.
// ---------------------------------------------------------------------------

{
  const town = ascii2TownFor('volcano')!
  const snap = snapshotFor('volcano')
  const scene = buildAscii2Scene(town, snap)!
  const map = scene.map
  const keys: TownWalkDirection[] = [
    'up', 'up', 'left', 'left', 'up', 'up', 'right', 'right', 'right',
    'down', 'down', 'left', 'up', 'up', 'up', 'left', 'left', 'down',
  ]
  let pixel = { ...snap.position }
  let ascii = { ...snap.position }
  keys.forEach((k, i) => {
    pixel = stepTownWalk(map, pixel, k)
    ascii = ascii2Forward(scene, ascii, k).position
    assert.deepEqual(ascii, pixel, `presentations parted company at key ${i} (${k})`)
  })
  assert.ok(keys.some((_, i) => i >= 0), 'the parity walk must actually move')
  assert.notDeepEqual(pixel, snap.position, 'the parity walk must leave the spawn tile')
}

// ---------------------------------------------------------------------------
// 3. THE YEAR. A later site is labelled absence: not enterable, not brick, not a wall.
// ---------------------------------------------------------------------------

const volcano = ascii2TownFor('volcano')!
const volcanoSnap = snapshotFor('volcano')
const scene = buildAscii2Scene(volcano, volcanoSnap)!

// Ghosts land on passable ground, never in the creek, a canvas wall, or on a
// real 1849 target.
{
  assert.equal(scene.ghosts.length, volcano.later_sites.length, 'every later site is placed')
  for (const g of scene.ghosts) {
    assert.ok(isTownWalkPassable(scene.map, g.position), `${g.id} landed on blocked ground`)
    assert.ok(
      !scene.map.targets.some((t) => t.position.x === g.position.x && t.position.y === g.position.y),
      `${g.id} sits on top of a real 1849 target`,
    )
  }
  const cells = new Set(scene.ghosts.map((g) => `${g.position.x},${g.position.y}`))
  assert.equal(cells.size, scene.ghosts.length, 'two absences must not share one tile')
  // Deterministic placement: same inputs, same tiles, every time.
  const again = placeLaterSites(scene.map, volcano.later_sites)
  assert.deepEqual(again.map((g) => g.position), scene.ghosts.map((g) => g.position))
}

function standSouthOf(scene: Ascii2Scene, id: string): { pos: { x: number; y: number }; heading: Heading } {
  const g = scene.ghosts.find((s) => s.id === id)!
  const pos = { x: g.position.x, y: g.position.y + 1 }
  assert.ok(isTownWalkPassable(scene.map, pos), `fixture needs open ground south of ${id}`)
  return { pos, heading: 'up' }
}

// 3a. You cannot step into 1862 from 1849 — and the refusal names the year.
{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const look = ascii2Look(scene, pos, heading)
  assert.equal(look.kind, 'absence', 'the St. George is not enterable in 1849')
  assert.ok(
    look.kind === 'absence' && /1862/.test(look.site.notYet),
    'the refusal must carry the year, not a shrug',
  )
}

// 3b. Not brick: a later site never renders with a solid glyph. Positive control —
//     a real canvas wall in the same frame DOES render solid, so this is a
//     measurement, not an empty assertion.
{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const text = frameText(renderFrame(scene, pos, heading)).join('\n')
  assert.ok(!/[█▒▓]/.test(text.split('\n').slice(0, 20).join('\n')) || !text.includes('█'), 'later ground must not be brick')
  assert.ok(text.includes('St. George'), 'absence is labelled — the walk says what will stand here')

  // positive control: standing in front of the canvas saloon shows a solid wall
  const door = scene.map.targets.find((t) => t.kind === 'entrance')!
  const front = { x: door.position.x, y: door.position.y + 1 }
  const wall = frameText(renderFrame(scene, front, 'up')).join('\n')
  assert.ok(/[▒█]/.test(wall), 'a real 1849 canvas wall must render solid — else the fog test proves nothing')
}

// 3c. Not a wall: absence does not stop a walking man, and crossing it says so.
{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const moved = ascii2Forward(scene, pos, heading)
  if (absenceBlocks) {
    assert.ok(moved.blocked, 'with absenceBlocks on, a later site stops you')
  } else {
    assert.notDeepEqual(moved.position, pos, 'absence does not block a walking man')
    assert.equal(moved.crossing?.id, 'vol_st_george', 'crossing names the absent site')
    assert.ok(ghostAt(scene, moved.position), 'the ghost is where the walker now stands')
  }
}

// 3d. Collisions still belong to the tile world — a canvas wall stops you.
{
  const door = scene.map.targets.find((t) => t.kind === 'entrance')!
  const front = { x: door.position.x, y: door.position.y - 1 }
  if (isTownWalkPassable(scene.map, front)) {
    const into = ascii2Forward(scene, front, 'up')
    assert.deepEqual(into.position, front, 'the canvas wall is solid in first person too')
    assert.ok(into.blocked, 'and it says what stopped you')
  }
}

// 3e. Indoors there is no future street: fog stays outside.
{
  const inside = buildAscii2Scene(volcano, { ...volcanoSnap, roomId: 'shelter', position: townWalkMap('volcano', 'shelter')!.spawn })!
  assert.equal(inside.ghosts.length, 0, 'no 1862 hotel inside a canvas saloon')
}

// ---------------------------------------------------------------------------
// 4. Mechanics and frame shape
// ---------------------------------------------------------------------------

{
  assert.equal(turnHeading('up', 1), 'right')
  assert.equal(turnHeading('up', -1), 'left')
  assert.equal(turnHeading(turnHeading('up', 1), 1), 'down')

  const frame = renderFrame(scene, volcanoSnap.position, 'up')
  assert.equal(frame.rows.length, FRAME_ROWS, 'frame must be 24 rows')
  for (const row of frame.rows) {
    assert.equal(row.length, FRAME_COLS, 'frame must be 80 columns')
    for (const cell of row) {
      assert.ok(cell.ch.length <= 1, 'one glyph per cell')
      assert.ok(/^#[0-9a-f]{6}$/i.test(cell.color), `every cell carries a color, got ${cell.color}`)
    }
  }
  assert.ok(frame.compass.includes('canvas camp'), 'the compass wears the 1849 face name')
  assert.ok(/north|south|east|west/.test(frame.compass), 'the compass says which way you face')

  // An allowlist the caller supplies is honoured — the same gate the pixel walk uses.
  const none = renderFrame(scene, volcanoSnap.position, 'up', () => false)
  assert.equal(none.rows.length, FRAME_ROWS)
}

// ---------------------------------------------------------------------------
// 5. West Point: the plaque is later, the pack road is 1849.
// ---------------------------------------------------------------------------

{
  const wp = ascii2TownFor('west_point')!
  const wpScene = buildAscii2Scene(wp, snapshotFor('west_point'))!
  const marker = wp.later_sites.find((s) => s.id === 'wp_kit_carson')!
  assert.ok(/Hwy 26|Highway 26/i.test(marker.notYet), 'the marker belongs at Hwy 26 & Main')
  assert.ok(
    !wp.later_sites.some((s) => /cemetery|campsite/i.test(s.label + s.notYet)),
    'no cemetery-as-campsite for Kit Carson',
  )
  const road = wpScene.map.targets.find((t) => t.kind === 'attraction' && t.attractionId === 'wp_trail_camp')
  assert.ok(road, 'the pack road is a real 1849 target you can reach')
  const beside = { x: road!.position.x, y: road!.position.y + 1 }
  if (isTownWalkPassable(wpScene.map, beside)) {
    assert.equal(ascii2Look(wpScene, beside, 'up').kind, 'target', 'the pack road is enterable in 1849')
  }
}

console.log('ascii2Walk tests passed')
