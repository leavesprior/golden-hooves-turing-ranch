/**
 * ascii2Walk.ts — rung 0 of the graphics ladder: a colored ASCII FIRST-PERSON
 * camera on the 1849 camp. Pure module: no React, no DOM, no fetch.
 *
 * ONE WORLD, MANY PRESENTATIONS — this is the whole point of the ladder, and the
 * reason this file owns no geometry of its own. The world is `townWalk.ts`: the
 * authored 1849 tile map, its props, its collisions, its targets, its save
 * snapshot. TownWalkScene draws that world from above in pixels. This module
 * draws the SAME world from eye level in ASCII. Every step here goes through
 * `stepTownWalk`, so a weak device gets a different picture of the camp, never a
 * different camp. `ascii2Walk.test.ts` walks both presentations down the same key
 * sequence and fails if they ever part company.
 *
 * WHAT THIS ADDS THAT THE TILE MAP DOES NOT HAVE: the year.
 * The tile map is 1849-only, so it says what IS there by saying nothing about the
 * rest. At eye level you can look down the street toward ground where the St.
 * George Hotel will stand in 1862, and the walk should be able to tell you that.
 * So each town's `<id>.1849.json` carries `later_sites` — the explore attractions
 * whose period is 'later' — and this camera draws them as FOG:
 *   - not brick: a later site never renders with a solid glyph;
 *   - not a wall: absence does not stop a walking man (`absenceBlocks = false`),
 *     so the tile map's collisions stay the only collisions;
 *   - not enterable: stepping in is refused, and the refusal names the year.
 * Fog placement is an authored overlay on an authored map (see each JSON's
 * `note`) — the honest claim is the YEAR, not a surveyed position.
 */

import {
  adjacentTownWalkTargets,
  isTownWalkPassable,
  stepTownWalk,
  townWalkMap,
  townWalkTileAt,
  type TownWalkDirection,
  type TownWalkMap,
  type TownWalkPosition,
  type TownWalkPropKind,
  type TownWalkSnapshot,
  type TownWalkTarget,
} from '@/lib/townWalk'

export type Heading = TownWalkDirection

/** An explore attraction whose period is 'later' — absence on the 1849 ground. */
export interface LaterSite {
  id: string
  label: string
  /** Percent across the painted town face (mirrors TOWN_HOTSPOTS). */
  x: number
  y: number
  notYet: string
  /** true when this later attraction has no pin on the painted face (authored x/y). */
  unpinned?: boolean
  unpinnedWhy?: string
}

export interface Town1849 {
  id: string
  era: '1849'
  face: string
  note: string
  must_not: string[]
  may: string[]
  sources: string[]
  ascii2_palette: Record<string, string>
  later_sites: LaterSite[]
}

export interface PlacedLaterSite extends LaterSite {
  position: TownWalkPosition
}

export interface Ascii2Scene {
  townId: string
  roomId: string
  face: string
  map: TownWalkMap
  ghosts: PlacedLaterSite[]
  palette: Record<string, string>
}

export interface Ascii2Cell {
  ch: string
  color: string
}

export interface Ascii2Frame {
  /** 24 rows x 80 columns of colored cells. */
  rows: Ascii2Cell[][]
  compass: string
  caption: string
}

export type Ascii2Look =
  | { kind: 'target'; target: TownWalkTarget }
  | { kind: 'absence'; site: PlacedLaterSite }
  | { kind: 'nothing' }

export const FRAME_COLS = 80
export const FRAME_ROWS = 24
/** Later sites are absence, not brick — they do not block a walking man. */
export const absenceBlocks = false

const DEPTH = 7
const WORLD_ROWS = FRAME_ROWS - 2
const EYE_ROW = 9

const DELTA: Record<Heading, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}
const CLOCKWISE: Heading[] = ['up', 'right', 'down', 'left']
export const COMPASS: Record<Heading, string> = { up: 'north', down: 'south', left: 'west', right: 'east' }

const PROP_FILL: Record<TownWalkPropKind, string> = {
  canvas: '▒',
  wall: '█',
  tree: '♠',
  rock: '▲',
  crate: '▓',
  bench: '▄',
  table: '▄',
  marker: '†',
  fire: '≈',
}
const FOG_GLYPHS = ['·', '˙', ' ', '·', ' ', '˚']

export function turnHeading(heading: Heading, delta: number): Heading {
  const i = CLOCKWISE.indexOf(heading)
  return CLOCKWISE[(i + delta + CLOCKWISE.length) % CLOCKWISE.length]
}

/**
 * Percent-of-painting → tile, then snapped to the nearest passable tile so a
 * ghost never lands inside the creek or a canvas wall. Deterministic: ties break
 * by scanning rows then columns.
 */
export function placeLaterSites(map: TownWalkMap, sites: LaterSite[]): PlacedLaterSite[] {
  const taken = new Set<string>()
  const placed: PlacedLaterSite[] = []
  for (const site of sites) {
    const wanted = {
      x: Math.min(map.width - 1, Math.max(0, Math.round((site.x / 100) * (map.width - 1)))),
      y: Math.min(map.height - 1, Math.max(0, Math.round((site.y / 100) * (map.height - 1)))),
    }
    let best: TownWalkPosition | undefined
    let bestScore = Number.POSITIVE_INFINITY
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const k = `${x},${y}`
        if (taken.has(k) || !isTownWalkPassable(map, { x, y })) continue
        // Never sit a ghost on top of a real 1849 target — the year is the claim,
        // and a labelled absence must not hide something that IS there.
        if (map.targets.some((t) => t.position.x === x && t.position.y === y)) continue
        const score = Math.abs(x - wanted.x) + Math.abs(y - wanted.y)
        if (score < bestScore) {
          bestScore = score
          best = { x, y }
        }
      }
    }
    if (!best) continue
    taken.add(`${best.x},${best.y}`)
    placed.push({ ...site, position: best })
  }
  return placed
}

export function buildAscii2Scene(
  town: Town1849,
  snapshot: TownWalkSnapshot,
): Ascii2Scene | undefined {
  const map = townWalkMap(snapshot.townId, snapshot.roomId)
  if (!map) return undefined
  // Indoors there is no horizon and no future street — fog stays outside.
  const ghosts = map.roomId === 'exterior' ? placeLaterSites(map, town.later_sites) : []
  return {
    townId: map.townId,
    roomId: map.roomId,
    face: town.face,
    map,
    ghosts,
    palette: town.ascii2_palette,
  }
}

export function ghostAt(scene: Ascii2Scene, position: TownWalkPosition): PlacedLaterSite | undefined {
  return scene.ghosts.find((g) => g.position.x === position.x && g.position.y === position.y)
}

/** Movement is the tile world's, unchanged — this only names what stopped you. */
export function ascii2Forward(
  scene: Ascii2Scene,
  position: TownWalkPosition,
  heading: Heading,
): { position: TownWalkPosition; blocked?: string; crossing?: PlacedLaterSite } {
  const next = stepTownWalk(scene.map, position, heading)
  if (next.x === position.x && next.y === position.y) {
    const d = DELTA[heading]
    const tile = townWalkTileAt(scene.map, { x: position.x + d.dx, y: position.y + d.dy })
    const blocked = !tile
      ? 'The camp ends here.'
      : tile.terrain === 'water'
        ? 'The creek blocks the way. Look for the plank crossing.'
        : tile.prop
          ? `The ${tile.prop} blocks the way.`
          : 'Someone is standing there. Walk around them.'
    return { position, blocked }
  }
  return { position: next, crossing: ghostAt(scene, next) }
}

/** What is straight ahead (or underfoot): a real target, an absence, or nothing. */
export function ascii2Look(
  scene: Ascii2Scene,
  position: TownWalkPosition,
  heading: Heading,
  allowed: (t: TownWalkTarget) => boolean = () => true,
): Ascii2Look {
  const d = DELTA[heading]
  const front = { x: position.x + d.dx, y: position.y + d.dy }
  const reachable = adjacentTownWalkTargets(scene.map, position).filter(allowed)
  const facing = reachable.find((t) => t.position.x === front.x && t.position.y === front.y)
  if (facing) return { kind: 'target', target: facing }
  const underfoot = reachable.find((t) => t.position.x === position.x && t.position.y === position.y)
  if (underfoot) return { kind: 'target', target: underfoot }
  const site = ghostAt(scene, front) || ghostAt(scene, position)
  if (site) return { kind: 'absence', site }
  return { kind: 'nothing' }
}

// ---------------------------------------------------------------------------
// Renderer — depth-banded first person, the way the old crawlers drew a corridor.
// ---------------------------------------------------------------------------

function bandRect(d: number) {
  const k = 1 / (1 + d * 0.62)
  const halfW = Math.max(2, Math.round(39 * k))
  const halfH = Math.max(1, Math.round(9 * k))
  const cx = Math.floor(FRAME_COLS / 2)
  return {
    left: cx - halfW,
    right: cx + halfW,
    top: Math.max(0, EYE_ROW - halfH),
    bottom: Math.min(WORLD_ROWS - 1, EYE_ROW + halfH),
  }
}

function tileOffset(position: TownWalkPosition, heading: Heading, forward: number, side: number) {
  const f = DELTA[heading]
  const rx = -f.dy
  const ry = f.dx
  return { x: position.x + f.dx * forward + rx * side, y: position.y + f.dy * forward + ry * side }
}

/**
 * How a tile presents at eye level:
 *  wall   — fills its depth band (canvas, timber, rock, the creek, off-map brush)
 *  figure — a person or a marked place: a small shape standing ON the ground,
 *           never a wall of repeated glyphs filling the view
 *  fog    — a later site: thin dither, never solid (see the era note at the top)
 */
type FaceForm = 'wall' | 'figure' | 'fog'
interface Face {
  ch: string
  color: string
  form: FaceForm
  label?: string
}

function faceAt(scene: Ascii2Scene, p: TownWalkPosition, allowed: (t: TownWalkTarget) => boolean): Face | undefined {
  const pal = scene.palette
  const tile = townWalkTileAt(scene.map, p)
  if (!tile) return { ch: '▓', color: pal.timber || '#8a6a44', form: 'wall' } // off-map: the brush wall
  const site = ghostAt(scene, p)
  if (site) {
    return { ch: FOG_GLYPHS[(p.x + p.y) % FOG_GLYPHS.length], color: pal.fog || '#4a443c', form: 'fog', label: site.label }
  }
  const target = scene.map.targets.find((t) => t.position.x === p.x && t.position.y === p.y && allowed(t))
  if (tile.prop) {
    const color =
      tile.prop === 'canvas'
        ? pal.canvas || '#c4a574'
        : tile.prop === 'tree'
          ? pal.brush || '#2e4a3b'
          : tile.prop === 'fire'
            ? pal.fire || '#c96a2a'
            : pal.timber || '#8a6a44'
    return { ch: PROP_FILL[tile.prop], color, form: 'wall', label: target?.label }
  }
  if (target) {
    return {
      ch: target.kind === 'npc' ? '☺' : '◇',
      color: pal.ink || '#e8dcc4',
      form: 'figure',
      label: target.label,
    }
  }
  if (tile.terrain === 'water') return { ch: '≈', color: pal.water || '#3b5a6b', form: 'wall' }
  return undefined
}

/** A person or a signpost: a small shape on the ground inside its depth band. */
function drawFigure(
  put: (r: number, c: number, ch: string, color: string) => void,
  rect: { left: number; right: number; top: number; bottom: number },
  face: Face,
) {
  const cx = Math.floor((rect.left + rect.right) / 2)
  const height = Math.max(2, Math.min(5, Math.round((rect.bottom - rect.top) / 2)))
  const halfW = Math.max(0, Math.round(height / 3))
  const base = rect.bottom
  for (let r = base - height + 1; r <= base; r++) {
    const head = r === base - height + 1
    for (let c = cx - halfW; c <= cx + halfW; c++) {
      if (head && c !== cx) continue
      put(r, c, head ? face.ch : c === cx ? '║' : '▖', face.color)
    }
  }
}

export function renderFrame(
  scene: Ascii2Scene,
  position: TownWalkPosition,
  heading: Heading,
  allowed: (t: TownWalkTarget) => boolean = () => true,
): Ascii2Frame {
  const pal = scene.palette
  const sky = pal.sky || '#2b2620'
  const ground = pal.ground || '#3b2a1a'
  const ink = pal.ink || '#e8dcc4'
  const fog = pal.fog || '#4a443c'
  const indoors = scene.roomId !== 'exterior'
  const horizon = EYE_ROW

  const rows: Ascii2Cell[][] = []
  for (let r = 0; r < FRAME_ROWS; r++) {
    const row: Ascii2Cell[] = []
    for (let c = 0; c < FRAME_COLS; c++) {
      if (r >= WORLD_ROWS) {
        row.push({ ch: ' ', color: '#000000' })
      } else if (r < horizon) {
        // Indoors the sky is a canvas roof; outdoors it is the limestone bowl.
        row.push(indoors ? { ch: (c + r) % 5 === 0 ? '-' : ' ', color: pal.canvas || '#c4a574' } : { ch: ' ', color: sky })
      } else if (r === horizon) {
        row.push(
          indoors
            ? { ch: '=', color: pal.timber || '#8a6a44' }
            : { ch: c % 7 === 3 ? '^' : '~', color: pal.brush || '#2e4a3b' },
        )
      } else {
        const near = r - horizon
        row.push({ ch: (c + r * 3) % Math.min(9, 1 + near * 2) === 0 ? '.' : ' ', color: ground })
      }
    }
    rows.push(row)
  }

  const put = (r: number, c: number, ch: string, color: string) => {
    if (r < 0 || r >= WORLD_ROWS || c < 0 || c >= FRAME_COLS) return
    rows[r][c] = { ch, color }
  }

  let caption = 'Open ground. Walk on.'
  let captionSet = false
  let nearest: { d: number; face: Face; rect: ReturnType<typeof bandRect> } | undefined

  for (let d = DEPTH; d >= 1; d--) {
    const outer = bandRect(d - 1)
    const inner = bandRect(d)

    for (const side of [-1, 1]) {
      const f = faceAt(scene, tileOffset(position, heading, d, side), allowed)
      if (!f || f.form === 'figure') continue // a person beside you is not a wall
      const cFrom = side < 0 ? outer.left : inner.right
      const cTo = side < 0 ? inner.left : outer.right
      const span = Math.max(1, Math.abs(cTo - cFrom))
      for (let c = Math.min(cFrom, cTo); c <= Math.max(cFrom, cTo); c++) {
        const t = Math.abs(c - (side < 0 ? outer.left : outer.right)) / span
        const top = Math.round(outer.top + (inner.top - outer.top) * t)
        const bot = Math.round(outer.bottom + (inner.bottom - outer.bottom) * t)
        for (let r = top; r <= bot; r++) {
          if (f.form === 'fog' && (r + c) % 3 !== 0) continue // fog is thin, timber is not
          put(r, c, f.ch, f.color)
        }
      }
    }

    const f = faceAt(scene, tileOffset(position, heading, d, 0), allowed)
    if (!f) continue
    const rect = bandRect(d)
    if (f.form === 'figure') {
      drawFigure(put, rect, f)
    } else {
      for (let r = rect.top; r <= rect.bottom; r++) {
        for (let c = rect.left; c <= rect.right; c++) {
          if (f.form === 'fog' && (r + c) % 3 !== 0) continue
          put(r, c, f.ch, f.color)
        }
      }
    }
    // The NEAREST thing ahead owns both the name plate and the caption — the loop
    // runs far-to-near, so the last one to set these wins. Two plates on one row
    // would overwrite each other into nonsense ("En  St. George Hotel on").
    nearest = { d, face: f, rect }
  }

  if (nearest?.face.label) {
    const { d, face, rect } = nearest
    const label = ` ${face.label} `
    if (rect.right - rect.left >= label.length - 2) {
      const lc = Math.max(0, Math.floor((FRAME_COLS - label.length) / 2))
      const lr = face.form === 'figure' ? Math.max(0, rect.bottom - 6) : rect.top + Math.floor((rect.bottom - rect.top) / 2)
      for (let i = 0; i < label.length; i++) put(lr, lc + i, label[i], face.form === 'fog' ? fog : ink)
    }
    caption =
      face.form === 'fog'
        ? `${face.label}: not built in 1849.`
        : d === 1
          ? `${face.label} — within reach.`
          : `${face.label}, ${d} paces on.`
    captionSet = true
  }

  const look = ascii2Look(scene, position, heading, allowed)
  if (look.kind === 'absence') caption = `${look.site.label}: ${look.site.notYet}`

  const compass = `${scene.face} · facing ${COMPASS[heading]} · ${position.x},${position.y}`
  const writeRow = (r: number, text: string, color: string) => {
    for (let i = 0; i < Math.min(text.length, FRAME_COLS); i++) rows[r][i] = { ch: text[i], color }
  }
  writeRow(FRAME_ROWS - 2, compass, ink)
  writeRow(FRAME_ROWS - 1, caption, captionSet ? ink : fog)

  return { rows, compass, caption }
}

/** Rows as plain strings — for tests, snapshots and copy/paste into a note. */
export function frameText(frame: Ascii2Frame): string[] {
  return frame.rows.map((r) => r.map((c) => c.ch).join('').replace(/\s+$/, ''))
}
