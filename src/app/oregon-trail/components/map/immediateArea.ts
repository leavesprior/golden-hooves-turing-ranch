/**
 * Immediate-area map scope.
 *
 * The atlas (full trail) may show both ranges and every river. A place map
 * may not. Independence is prairie + the next water; the Rockies and the
 * Sierra are not "here" until the wagon is.
 *
 * Same placement law as LandmarkScene / PlaceBackdrop: depict this place.
 */

import { getLocationById } from '../../data/worldMaps'
import { type TerrainFeature } from './terrainData'

export type MapScope = 'here' | 'atlas'

export interface MapViewBox {
  x: number
  y: number
  w: number
  h: number
}

/** Full Chapter-1 / world-map frame (matches WorldMap's historic viewBox). */
export const ATLAS_VIEWBOX: MapViewBox = { x: 0, y: 0, w: 100, h: 62.5 }

const DEFAULT_PAD = 8

export function viewBoxToAttr(box: MapViewBox): string {
  return `${box.x} ${box.y} ${box.w} ${box.h}`
}

export function viewBoxContains(box: MapViewBox, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h
}

/** Pull x,y pairs out of an SVG path `d` (M/L/Q numbers). */
export function pathPoints(d: string): Array<{ x: number; y: number }> {
  const nums = d.match(/-?\d*\.?\d+/g)
  if (!nums) return []
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push({ x: Number(nums[i]), y: Number(nums[i + 1]) })
  }
  return pts
}

export function pathIntersectsViewBox(d: string, box: MapViewBox): boolean {
  return pathPoints(d).some((p) => viewBoxContains(box, p.x, p.y))
}

/**
 * Neighborhood of this stop: the place plus every directly connected
 * neighbor, padded. Unknown id → atlas (honest "I don't know where").
 */
export function immediateViewBox(locationId: string, pad = DEFAULT_PAD): MapViewBox {
  const here = getLocationById(locationId)
  if (!here) return ATLAS_VIEWBOX

  const pts = [here]
  for (const id of here.connectedTo) {
    const n = getLocationById(id)
    if (n) pts.push(n)
  }

  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const x1 = Math.max(0, Math.min(...xs) - pad)
  const y1 = Math.max(0, Math.min(...ys) - pad)
  const x2 = Math.min(100, Math.max(...xs) + pad)
  const y2 = Math.min(62.5, Math.max(...ys) + pad)
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export function terrainInImmediateArea(
  features: TerrainFeature[],
  box: MapViewBox,
): TerrainFeature[] {
  return features.filter((f) => pathIntersectsViewBox(f.d, box))
}

export function compassOrigin(box: MapViewBox): { x: number; y: number } {
  return { x: box.x + box.w - 10, y: box.y + 2 }
}
