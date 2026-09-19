/**
 * ascii2 → 32/64-bit pixels. Same camp, same stepper, a fleshed picture.
 *
 * The ascii2 camera already classifies each tile ahead (wall / figure / fog).
 * This module names the MATERIAL so a canvas can paint tent, creek, pine,
 * limestone, fire — not a second map.
 */
import {
  ghostAt,
  type Ascii2Scene,
  type Heading,
} from '@/lib/ascii2Walk'
import { PIXEL_DEPTH, PIXEL_SIDES } from '@/lib/walkBitPalette'
import { townWalkTileAt, type TownWalkPosition, type TownWalkTarget } from '@/lib/townWalk'
import { HEADING_BEARING } from '@/lib/townGeo'
import horizons from '@/data/towns/horizons.json'

export type PixelKind =
  | 'empty'
  | 'canvas'
  | 'wall'
  | 'tree'
  | 'rock'
  | 'crate'
  | 'bench'
  | 'table'
  | 'marker'
  | 'fire'
  | 'water'
  | 'fog'
  | 'npc'
  | 'attraction'
  | 'entrance'
  | 'brush'

export interface PixelFace {
  kind: PixelKind
  label?: string
  depth: number
  side: number
  /** The camp tile this face stands on, so textures stay attached to the world. */
  at: TownWalkPosition
}

const DELTA: Record<Heading, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export function offset(position: TownWalkPosition, heading: Heading, forward: number, side: number): TownWalkPosition {
  const f = DELTA[heading]
  return {
    x: position.x + f.dx * forward + -f.dy * side,
    y: position.y + f.dy * forward + f.dx * side,
  }
}

export function pixelKindAt(
  scene: Ascii2Scene,
  p: TownWalkPosition,
  allowed: (t: TownWalkTarget) => boolean = () => true,
): { kind: PixelKind; label?: string } {
  const tile = townWalkTileAt(scene.map, p)
  if (!tile) return { kind: 'brush' }
  const site = ghostAt(scene, p)
  if (site) return { kind: 'fog', label: site.label }
  const target = scene.map.targets.find((t) => t.position.x === p.x && t.position.y === p.y && allowed(t))
  if (tile.prop) {
    return { kind: tile.prop, label: target?.label }
  }
  if (target) {
    if (target.kind === 'npc') return { kind: 'npc', label: target.label }
    if (target.kind === 'entrance') return { kind: 'entrance', label: target.label }
    return { kind: 'attraction', label: target.label }
  }
  if (tile.terrain === 'water') return { kind: 'water' }
  return { kind: 'empty' }
}

/** Far-to-near, left-to-right. Painter draws in this order so near things cover far. */
export function pixelFacesAhead(
  scene: Ascii2Scene,
  position: TownWalkPosition,
  heading: Heading,
  allowed: (t: TownWalkTarget) => boolean = () => true,
): PixelFace[] {
  const out: PixelFace[] = []
  for (let depth = PIXEL_DEPTH - 1; depth >= 0; depth--) {
    for (let side = -PIXEL_SIDES; side <= PIXEL_SIDES; side++) {
      const p = offset(position, heading, depth, side)
      const hit = pixelKindAt(scene, p, allowed)
      if (hit.kind === 'empty') continue
      out.push({ ...hit, depth, side, at: p })
    }
  }
  return out
}

export function pixelSkyline(townId: string): 'limestone-bowl' | 'pine-road' | 'camp' {
  if (townId === 'volcano') return 'limestone-bowl'
  if (townId === 'west_point') return 'pine-road'
  return 'camp'
}

// ---------------------------------------------------------------------------
// The horizon and the distant sites: pure, so they can be tested without a canvas.
// ---------------------------------------------------------------------------

/** Horizontal field of view of the eye-level frame, in degrees. */
export const PIXEL_FOV_DEG = 90

type HorizonRow = readonly [bearing: number, nearDeg: number, nearM: number | null, farDeg: number, farM: number | null]
const HORIZONS = horizons as unknown as Record<string, { profile: readonly HorizonRow[] }>

/**
 * Skyline elevation angles at a compass bearing, from USGS 3DEP (horizons.json),
 * interpolated between the 10-degree samples. `near` is the highest ground within
 * 1.2 km, `far` the highest beyond it. Depends on bearing only — the skyline is
 * seen from the town's anchor, so it does not shift as you walk (no parallax) and
 * the same bearing always shows the same ridge.
 */
export function horizonAt(townId: string, bearing: number): { near: number; far: number } | null {
  const h = Object.hasOwn(HORIZONS, townId) ? HORIZONS[townId].profile : null
  if (!h || h.length === 0) return null
  const b = ((bearing % 360) + 360) % 360
  const step = 360 / h.length
  const i = Math.floor(b / step)
  const t = (b - i * step) / step
  const a = h[i % h.length], z = h[(i + 1) % h.length]
  return { near: a[1] + (z[1] - a[1]) * t, far: a[3] + (z[3] - a[3]) * t }
}

/** Signed degrees from the view centre to `bearing` (negative = left of centre). */
export function bearingOffset(heading: Heading, bearing: number): number {
  return ((bearing - HEADING_BEARING[heading] + 540) % 360) - 180
}

/** Distant later sites inside the field of view, with their screen x in a `width`-pixel frame. */
export function distantSitesInView(scene: Ascii2Scene, heading: Heading, width: number) {
  return scene.distant
    .map((site) => ({ site, off: bearingOffset(heading, site.bearing) }))
    .filter(({ off }) => Math.abs(off) <= PIXEL_FOV_DEG / 2)
    .map(({ site, off }) => ({ site, x: width / 2 + (off / PIXEL_FOV_DEG) * width }))
}
