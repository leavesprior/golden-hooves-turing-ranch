import assert from 'node:assert/strict'
import {
  ABSENCE_BLOCKS_DEFAULT,
  SOLID_GLYPHS,
  ascii2Forward,
  ascii2Look,
  buildAscii2Scene,
  frameText,
  ghostAt,
  placeLaterSites,
  renderFrame,
  turnHeading,
  FRAME_COLS,
  FRAME_COLS_NARROW,
  FRAME_ROWS,
  MIN_FRAME_COLS,
  type Ascii2Scene,
  type Ascii2Frame,
  type Heading,
} from './ascii2Walk'
import { ASCII2_TOWNS, ascii2TownFor, hasAscii2Walk } from './ascii2Towns'
import { townGeo } from './townGeo'
import {
  isTownWalkPassable,
  townWalkTileAt,
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
  const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const
  let pixel = { ...snap.position }
  let ascii = { ...snap.position }
  const refusedBy: string[] = []
  keys.forEach((k, i) => {
    const before = pixel
    pixel = stepTownWalk(map, pixel, k)
    ascii = ascii2Forward(scene, ascii, k).position
    assert.deepEqual(ascii, pixel, `presentations parted company at key ${i} (${k})`)
    if (pixel.x === before.x && pixel.y === before.y) {
      const into = { x: before.x + step[k][0], y: before.y + step[k][1] }
      const tile = townWalkTileAt(map, into)
      const npc = map.targets.some((t) => t.kind === 'npc' && t.position.x === into.x && t.position.y === into.y)
      refusedBy.push(npc ? 'npc' : tile?.prop ?? tile?.terrain ?? 'edge')
    }
  })
  // The notes call this walk "not a stroll". Pin that, or a map edit can quietly
  // turn it into one: a parity test that never hits an obstacle proves only that
  // two callers agree on open ground.
  assert.equal(refusedBy.length, 5, `the parity walk must be refused 5 times, was ${refusedBy.length}: ${refusedBy}`)
  assert.deepEqual(
    [...new Set(refusedBy)].sort(),
    ['canvas', 'fire', 'npc', 'water'],
    `the refusals must span creek, fire, canvas and a person: ${refusedBy}`,
  )
  assert.deepEqual(pixel, { x: 8, y: 4 }, 'the parity walk must end far from spawn, at 8,4')
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
  // The target guard, exercised directly. No real site needs it since the
  // St. George moved to its measured ground (2026-09-18), so aim a synthetic site
  // at every real 1849 target and require it to land beside, never on top.
  for (const t of scene.map.targets) {
    const aim = {
      id: `probe_${t.id}`, label: 'probe', notYet: 'probe site for the target guard',
      x: (t.position.x / (scene.map.width - 1)) * 100, y: (t.position.y / (scene.map.height - 1)) * 100,
    }
    const [p] = placeLaterSites(scene.map, [aim])
    assert.ok(p && !(p.position.x === t.position.x && p.position.y === t.position.y), `a later site must not cover ${t.id}`)
  }
  // Deterministic placement: same inputs, same tiles, every time.
  const again = placeLaterSites(scene.map, volcano.later_sites, townGeo('volcano'))
  assert.deepEqual(again.map((g) => g.position), scene.ghosts.map((g) => g.position))
}

function standSouthOf(scene: Ascii2Scene, id: string): { pos: { x: number; y: number }; heading: Heading } {
  const g = scene.ghosts.find((s) => s.id === id)!
  const pos = { x: g.position.x, y: g.position.y + 1 }
  assert.ok(isTownWalkPassable(scene.map, pos), `fixture needs open ground south of ${id}`)
  return { pos, heading: 'up' }
}

// 3a. You cannot step into the 1860s from 1849 — and the refusal names the year.
{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const look = ascii2Look(scene, pos, heading)
  assert.equal(look.kind, 'absence', 'the St. George is not enterable in 1849')
  assert.ok(
    look.kind === 'absence' && /1863/.test(look.site.notYet) && /1867/.test(look.site.notYet),
    'the refusal must carry both recorded years (1863 / 1867), not a shrug',
  )
}

// 3b. NOT BRICK — measured on the glyphs actually drawn, inside the fog's own
//     bounding box. Three earlier versions of this test were too weak, each
//     proved by a surviving mutant:
//       · `!text.includes('█')` — '█' is the shelter wall glyph and cannot occur
//         in ANY exterior frame, so it passed however fog was drawn;
//       · excluding cells "whose glyph appears in the label" — the label contains
//         SPACES, so that silently excused fog drawn as blank;
//       · a density ratio over whole 80-column rows — a solid fog block only
//         reaches ~0.44 of a full row, so a filled block slipped under the bar.
//     What is measured now: inside the box the fog occupies (label row excluded),
//     no glyph may mean something-stands-here, none may be blank, and the fill
//     must stay a dither — with a real canvas wall measured the same way as the
//     positive control.
{
  const fogColor = volcano.ascii2_palette.fog
  const canvasColor = volcano.ascii2_palette.canvas
  const label = 'St. George Hotel'

  /**
   * Cells of one colour (name-plate row excluded) and the LONGEST HORIZONTAL RUN
   * of them. Run length is what separates a dither from a fill: the fog stencil
   * is `(r + c) % 3`, so its runs are 1 cell long, while a standing wall paints
   * unbroken rows. A bounding-box ratio was tried first and was too blunt — a
   * scene with walls at several depths scatters one colour across the frame.
   */
  const field = (frame: Ascii2Frame, color: string) => {
    const text = frameText(frame)
    const labelRow = text.findIndex((r) => r.includes(label))
    const cells: { ch: string; r: number; c: number }[] = []
    let longestRun = 0
    frame.rows.forEach((row, r) => {
      // Rows 22-23 are the compass and caption — chrome, not the drawn world. The
      // caption is painted in the fog colour when nothing is named, and its spaces
      // were being counted as holes in the fog.
      if (r === labelRow || r >= FRAME_ROWS - 2) return
      let run = 0
      row.forEach((cell, c) => {
        if (cell.color === color) {
          cells.push({ ch: cell.ch, r, c })
          run += 1
          longestRun = Math.max(longestRun, run)
        } else {
          run = 0
        }
      })
    })
    return { cells, longestRun }
  }

  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const frame = renderFrame(scene, pos, heading)
  const fog = field(frame, fogColor)

  assert.ok(fog.cells.length > 0, 'the later site must actually be drawn — absence is visible AS absence')
  const solid = fog.cells.filter((x) => SOLID_GLYPHS.includes(x.ch))
  assert.equal(solid.length, 0, `a later site must never wear a standing-thing glyph (got ${solid.map((x) => x.ch).join('')})`)
  const blank = fog.cells.filter((x) => x.ch.trim() === '')
  assert.equal(blank.length, 0, 'fog must leave a visible mark, not a hole in the world')
  assert.ok(frameText(frame).join('\n').includes(label), 'absence is labelled — the walk says what will stand here')

  // The name plate pads the label with spaces to clear a gap. Those blanks must
  // clear to the BACKGROUND — painting them in the face colour puts empty cells
  // inside the absence, which is the same defect as fog drawn as nothing. The
  // measurements above deliberately skip the plate row, so without this assertion
  // nothing would enforce it (a mutant proved exactly that).
  {
    const plateRow = frameText(frame).findIndex((r) => r.includes(label))
    const platedFogBlanks = frame.rows[plateRow].filter((c) => c.color === fogColor && c.ch.trim() === '')
    assert.equal(platedFogBlanks.length, 0, 'the name plate must clear to the background, not paint blanks in the fog colour')
  }
  assert.ok(fog.longestRun <= 2, `fog must stay a dither; longest unbroken run was ${fog.longestRun}`)

  // POSITIVE CONTROL, measured the same way. Stand on open ground with a canvas
  // wall directly ahead: it must paint an unbroken row. Without this the fog
  // assertions could pass on a renderer that draws almost nothing at all.
  let control: { cells: { ch: string }[]; longestRun: number } | undefined
  const dirs: { d: Heading; dx: number; dy: number }[] = [
    { d: 'up', dx: 0, dy: -1 }, { d: 'down', dx: 0, dy: 1 },
    { d: 'left', dx: -1, dy: 0 }, { d: 'right', dx: 1, dy: 0 },
  ]
  outer: for (let y = 0; y < scene.map.height; y++) {
    for (let x = 0; x < scene.map.width; x++) {
      if (!isTownWalkPassable(scene.map, { x, y }) || ghostAt(scene, { x, y })) continue
      for (const dir of dirs) {
        if (townWalkTileAt(scene.map, { x: x + dir.dx, y: y + dir.dy })?.prop !== 'canvas') continue
        const candidate = field(renderFrame(scene, { x, y }, dir.d), canvasColor)
        if (candidate.longestRun > (control?.longestRun ?? 0)) control = candidate
        if ((control?.longestRun ?? 0) >= 20) break outer
      }
    }
  }
  assert.ok(control, 'the fixture must find open ground facing a canvas wall')
  if (!control) throw new Error('unreachable — asserted above')
  assert.ok(
    control.cells.some((x) => SOLID_GLYPHS.includes(x.ch)),
    'the control must draw a SOLID canvas glyph — else "never solid" proves nothing',
  )
  assert.ok(control.longestRun >= 20, `a standing wall must paint an unbroken row, got ${control.longestRun}`)
  assert.ok(
    control.longestRun > fog.longestRun * 5,
    `a wall must read far denser than absence (wall run ${control.longestRun} vs fog run ${fog.longestRun})`,
  )
}

// 3b-ii. The same rules where a later site appears OFF TO THE SIDE. The renderer
//     draws side walls through a separate code path, and a mutant that filled that
//     path solid was a NO-OP in the head-on frame above — it changed nothing, so it
//     proved nothing. This frame is what makes that path convictable.
{
  const fogColor = volcano.ascii2_palette.fog
  let found = 0
  for (const g of scene.ghosts) {
    for (const dx of [-1, 1]) {
      const stand = { x: g.position.x + dx, y: g.position.y + 2 }
      if (!isTownWalkPassable(scene.map, stand) || ghostAt(scene, stand)) continue
      const frame = renderFrame(scene, stand, 'up')
      const labelRow = frameText(frame).findIndex((r) => r.includes(g.label))
      let longest = 0
      const cells: string[] = []
      frame.rows.forEach((row, r) => {
        if (r === labelRow || r >= FRAME_ROWS - 2) return // compass + caption are chrome
        let run = 0
        row.forEach((cell) => {
          if (cell.color === fogColor) {
            cells.push(cell.ch)
            run += 1
            longest = Math.max(longest, run)
          } else run = 0
        })
      })
      if (!cells.length) continue
      found += 1
      assert.equal(
        cells.filter((ch) => SOLID_GLYPHS.includes(ch)).length,
        0,
        `${g.id} seen from the side must not wear a standing-thing glyph`,
      )
      assert.equal(cells.filter((ch) => ch.trim() === '').length, 0, `${g.id} from the side must still leave a mark`)
      assert.ok(longest <= 2, `${g.id} from the side must stay a dither, longest run ${longest}`)
    }
  }
  assert.ok(found >= 2, `the fixture must actually see later sites from the side (saw ${found})`)
}

// 3c. NOT A WALL — and the other reading is a real switch, not a comment.
//     Both policies are exercised here, so the documented "one line to overturn"
//     is a claim the suite actually stands behind.
{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  assert.equal(scene.absenceBlocks, ABSENCE_BLOCKS_DEFAULT, 'the scene carries the policy')

  const crossing = ascii2Forward(scene, pos, heading)
  assert.notDeepEqual(crossing.position, pos, 'by default absence does not block a walking man')
  assert.equal(crossing.crossing?.id, 'vol_st_george', 'crossing names the absent site')
  assert.ok(ghostAt(scene, crossing.position), 'the ghost is where the walker now stands')

  const strict = buildAscii2Scene(volcano, volcanoSnap, { absenceBlocks: true })!
  assert.equal(strict.absenceBlocks, true)
  const stopped = ascii2Forward(strict, pos, heading)
  assert.deepEqual(stopped.position, pos, 'under the other reading, a later site stops you')
  assert.ok(stopped.blocked && /1867/.test(stopped.blocked), 'and the refusal still names the year')

  // The policy must not invent a wall anywhere else: ordinary ground is still
  // walkable under the strict reading.
  const open = ascii2Forward(strict, volcanoSnap.position, 'up')
  assert.notDeepEqual(open.position, volcanoSnap.position, 'the policy touches later sites only')
}

// 3d. Collisions still belong to the tile world. The earlier version of this
//     stood ON the canvas wall itself, so its `if (isTownWalkPassable(...))` guard
//     was never true and the test asserted NOTHING. Find the wall from open
//     ground instead, and fail loudly if no such spot exists.
{
  const facings: { d: Heading; dx: number; dy: number }[] = [
    { d: 'up', dx: 0, dy: -1 }, { d: 'down', dx: 0, dy: 1 },
    { d: 'left', dx: -1, dy: 0 }, { d: 'right', dx: 1, dy: 0 },
  ]
  let checked = 0
  for (let y = 0; y < scene.map.height; y++) {
    for (let x = 0; x < scene.map.width; x++) {
      if (!isTownWalkPassable(scene.map, { x, y })) continue
      for (const f of facings) {
        const front = { x: x + f.dx, y: y + f.dy }
        if (townWalkTileAt(scene.map, front)?.prop !== 'canvas') continue
        const into = ascii2Forward(scene, { x, y }, f.d)
        assert.deepEqual(into.position, { x, y }, `the canvas wall at ${front.x},${front.y} must stop the walker`)
        assert.ok(into.blocked, 'and it must say what stopped you')
        checked++
      }
    }
  }
  assert.ok(checked >= 3, `the fixture must actually reach canvas walls from open ground (reached ${checked})`)
}

// 3e. Indoors there is no future street: fog stays outside.
{
  const inside = buildAscii2Scene(volcano, { ...volcanoSnap, roomId: 'shelter', position: townWalkMap('volcano', 'shelter')!.spawn })!
  assert.equal(inside.ghosts.length, 0, 'no 1860s hotel inside a canvas saloon')
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

  // An allowlist the caller supplies is honoured — the same gate the pixel walk
  // uses. Measured on CONTENT: a disallowed target must lose its name plate.
  // (Asserting only `rows.length === FRAME_ROWS` could not fail — the row loop
  //  is literally `for r < FRAME_ROWS`.)
  const npc = scene.map.targets.find((t) => t.kind === 'npc')!
  const beside = { x: npc.position.x, y: npc.position.y + 1 }
  assert.ok(isTownWalkPassable(scene.map, beside), 'fixture needs open ground beside the NPC')
  const shown = frameText(renderFrame(scene, beside, 'up')).join('\n')
  assert.ok(shown.includes(npc.label), 'an allowed target is named in the frame')
  const hidden = frameText(renderFrame(scene, beside, 'up', () => false)).join('\n')
  assert.ok(!hidden.includes(npc.label), 'a target the caller disallows must not be drawn or named')
}

// ---------------------------------------------------------------------------
// 4b. NARROW VIEWPORT. The brief allows 40-80 columns, and a phone needs the
//     narrow one (80 columns on a 390px screen renders as an unreadable smear).
//     Every rule above must hold at 40 columns too — a second geometry that
//     forgets the year would be the same fork this whole module exists to avoid.
// ---------------------------------------------------------------------------

{
  const { pos, heading } = standSouthOf(scene, 'vol_st_george')
  const narrow = renderFrame(scene, pos, heading, () => true, { cols: FRAME_COLS_NARROW })
  assert.equal(narrow.rows.length, FRAME_ROWS, 'narrow frame keeps 24 rows')
  for (const row of narrow.rows) assert.equal(row.length, FRAME_COLS_NARROW, 'every narrow row is 40 columns')

  const fogColor = volcano.ascii2_palette.fog
  const text = frameText(narrow)
  const labelRow = text.findIndex((r) => r.includes('St. George'))
  let longest = 0
  const cells: string[] = []
  narrow.rows.forEach((row, r) => {
    if (r === labelRow || r >= FRAME_ROWS - 2) return
    let run = 0
    row.forEach((cell) => {
      if (cell.color === fogColor) {
        cells.push(cell.ch)
        run += 1
        longest = Math.max(longest, run)
      } else run = 0
    })
  })
  assert.ok(cells.length > 0, 'the later site is drawn in the narrow frame too')
  assert.equal(cells.filter((ch) => SOLID_GLYPHS.includes(ch)).length, 0, 'narrow: absence is still not solid')
  assert.equal(cells.filter((ch) => ch.trim() === '').length, 0, 'narrow: absence still leaves a mark')
  assert.ok(longest <= 2, `narrow: absence stays a dither, longest run ${longest}`)
  assert.ok(narrow.caption.length > 0 && narrow.compass.length > 0, 'narrow frame still carries compass and caption')

  // A width below the floor is clamped, not honoured — no zero-width frames.
  const tiny = renderFrame(scene, pos, heading, () => true, { cols: 4 })
  assert.equal(tiny.rows[0].length, MIN_FRAME_COLS, 'a silly width clamps to the floor')
}

// ---------------------------------------------------------------------------
// 5. West Point: the plaque is later, the pack road is 1849.
// ---------------------------------------------------------------------------

{
  const wp = ascii2TownFor('west_point')!
  const wpScene = buildAscii2Scene(wp, snapshotFor('west_point'))!
  const marker = wp.later_sites.find((s) => s.id === 'wp_kit_carson')!
  assert.ok(/Hwy 26|Highway 26/i.test(marker.notYet), 'the marker belongs at Hwy 26 & Main')
  // OHP No. 268 gives registration 9/3/1937; the plaque itself was dedicated 7/3/1949.
  // Calling it 'a 1937 plaque' was the error this line guards against.
  assert.ok(/1949/.test(marker.notYet) && !/plaque is 1937/i.test(marker.notYet), 'the plaque is 1949; 1937 is the registration')
  assert.ok(/tradition/i.test(marker.notYet), 'Carson\'s 1844 is tradition, not a recorded date')
  assert.ok(
    !wp.later_sites.some((s) => /cemetery|campsite/i.test(s.label + s.notYet)),
    'no cemetery-as-campsite for Kit Carson',
  )
  const road = wpScene.map.targets.find((t) => t.kind === 'attraction' && t.attractionId === 'wp_trail_camp')
  assert.ok(road, 'the pack road is a real 1849 target you can reach')
  const beside = { x: road!.position.x, y: road!.position.y + 1 }
  // An assertion, not an `if`: a guard that is false asserts nothing and still passes.
  assert.ok(isTownWalkPassable(wpScene.map, beside), 'fixture needs open ground south of the pack road')
  assert.equal(ascii2Look(wpScene, beside, 'up').kind, 'target', 'the pack road is enterable in 1849')
}

console.log('ascii2Walk tests passed')
