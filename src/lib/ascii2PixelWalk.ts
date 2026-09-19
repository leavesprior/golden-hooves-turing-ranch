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
}

const DELTA: Record<Heading, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

function offset(position: TownWalkPosition, heading: Heading, forward: number, side: number): TownWalkPosition {
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
      out.push({ ...hit, depth, side })
    }
  }
  return out
}

export function pixelSkyline(townId: string): 'limestone-bowl' | 'pine-road' | 'camp' {
  if (townId === 'volcano') return 'limestone-bowl'
  if (townId === 'west_point') return 'pine-road'
  return 'camp'
}
