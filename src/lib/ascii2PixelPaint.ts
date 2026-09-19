/**
 * Paint the ascii2 camera as a 320×180 32/64-bit frame.
 * Client-only (needs CanvasRenderingContext2D). Classifier stays in ascii2PixelWalk.ts.
 */
import {
  bearingOffset,
  distantSitesInView,
  horizonAt,
  offset,
  pixelFacesAhead,
  pixelSkyline,
  PIXEL_FOV_DEG,
  type PixelFace,
  type PixelKind,
} from '@/lib/ascii2PixelWalk'
import { BIT, PIXEL_DEPTH, PIXEL_IH, PIXEL_IW, PIXEL_HORIZON } from '@/lib/walkBitPalette'
import type { Ascii2Scene, Heading } from '@/lib/ascii2Walk'
import { compassPoint, HEADING_BEARING } from '@/lib/townGeo'
import { townWalkTileAt, type TownWalkPosition, type TownWalkTarget } from '@/lib/townWalk'

function rng(seed: number) {
  let t = (seed >>> 0) || 1
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function rect(b: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  b.fillStyle = c
  b.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0))
}

function dith(
  b: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  c: string, prob: number, r: () => number,
) {
  b.fillStyle = c
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (((i + j) & 1) === 0 && r() < prob) b.fillRect((x + i) | 0, (y + j) | 0, 1, 1)
    }
  }
}

function lerpHex(a: string, z: string, t: number) {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  const A = p(a), Z = p(z)
  const m = (i: number) => Math.round(A[i] + (Z[i] - A[i]) * t)
  return `rgb(${m(0)},${m(1)},${m(2)})`
}

function band(depth: number, side: number) {
  const k = 1 / (1 + depth * 0.55)
  const cx = PIXEL_IW / 2
  const halfW = Math.max(10, Math.round((PIXEL_IW / 2 - 8) * k))
  const slice = Math.max(8, Math.round(halfW / 2.4))
  const mid = cx + side * slice * 1.15
  const top = Math.max(8, Math.round(PIXEL_HORIZON - 48 * k))
  const bot = Math.min(PIXEL_IH - 4, Math.round(PIXEL_HORIZON + 78 * k))
  return {
    x: Math.round(mid - slice / 2),
    w: slice,
    top,
    bot,
    k,
  }
}

function shade(kind: PixelKind, depth: number): { fill: string; light: string; dark: string } {
  const fog = Math.min(0.55, depth * 0.08)
  const mix = (c: string) => lerpHex(c, BIT.dusk, fog)
  switch (kind) {
    case 'canvas':
      return { fill: mix(BIT.canvas), light: mix(BIT.cream), dark: mix(BIT.canvasShade) }
    case 'wall':
    case 'crate':
    case 'bench':
    case 'table':
      return { fill: mix(BIT.wood), light: mix(BIT.tan), dark: mix(BIT.bark) }
    case 'tree':
      return { fill: mix(BIT.moss), light: mix(BIT.green), dark: mix(BIT.olive) }
    case 'rock':
    case 'marker':
      return { fill: mix(BIT.limestoneDark), light: mix(BIT.limestone), dark: mix(BIT.ash) }
    case 'fire':
      return { fill: mix(BIT.orange), light: mix(BIT.yellow), dark: mix(BIT.bark) }
    case 'water':
      return { fill: mix(BIT.water), light: mix(BIT.waterLite), dark: mix(BIT.navy) }
    case 'fog':
      return { fill: mix(BIT.fog), light: mix(BIT.fogLite), dark: mix(BIT.ash) }
    case 'brush':
      return { fill: mix(BIT.olive), light: mix(BIT.moss), dark: mix(BIT.ink) }
    default:
      return { fill: mix(BIT.tan), light: mix(BIT.cream), dark: mix(BIT.bark) }
  }
}

// ---------------------------------------------------------------------------
// Projection. One model for ground and objects: a thing `d` tiles ahead touches
// the ground at contactY(d), and a tile `side` steps across is centred at
// cellX(d, side). Continuous, so ground cells tile without gaps.
// (Replaces a ground model whose perspective was inverted: near water was drawn
// at the horizon and far water at the bottom of the frame.)
// ---------------------------------------------------------------------------
const kAt = (d: number) => 1 / (1 + Math.max(-0.45, d) * 0.55)
const sliceAt = (k: number) => Math.max(8, Math.max(10, (PIXEL_IW / 2 - 8) * k) / 2.4)
const contactY = (d: number) => Math.min(PIXEL_IH, PIXEL_HORIZON + 78 * kAt(d))
const cellX = (d: number, side: number) => PIXEL_IW / 2 + side * 1.15 * sliceAt(kAt(d))
const cellHalf = (d: number) => 0.575 * sliceAt(kAt(d))

/** Stable per-world-cell noise: the same tile always looks the same. */
const cellRng = (townId: string, x: number, y: number, salt = 0) =>
  rng(townId.length * 7919 + (x + 64) * 104729 + (y + 64) * 1299709 + salt * 31)

function drawSky(b: CanvasRenderingContext2D, scene: Ascii2Scene, heading: Heading) {
  for (let y = 0; y < PIXEL_HORIZON; y++) {
    const t = y / PIXEL_HORIZON
    rect(b, 0, y, PIXEL_IW, 1, lerpHex(BIT.navy, BIT.sky, t * 0.55 + 0.15))
  }
  // Clouds live at fixed compass bearings per town, so turning moves them across
  // the sky and walking does not reshuffle them.
  const r = rng(scene.townId.length * 131 + 7)
  b.globalAlpha = 0.3
  for (let i = 0; i < 9; i++) {
    const bearing = r() * 360, y = 6 + r() * 24, w = 30 + r() * 60, h = 3 + r() * 5
    const off = bearingOffset(heading, bearing)
    if (Math.abs(off) > PIXEL_FOV_DEG / 2 + 20) continue
    rect(b, PIXEL_IW / 2 + (off / PIXEL_FOV_DEG) * PIXEL_IW - w / 2, y, w, h, BIT.ice)
  }
  b.globalAlpha = 1
}

/**
 * The skyline for the bearing you face, from USGS 3DEP (horizons.json), drawn at
 * true angular scale: PIXEL_FOV_DEG across the frame, no vertical exaggeration.
 * Far ridges (beyond 1.2 km) behind, in haze; the near rim in front.
 */
function drawHorizon(b: CanvasRenderingContext2D, scene: Ascii2Scene, heading: Heading) {
  const ppd = PIXEL_IW / PIXEL_FOV_DEG
  const center = HEADING_BEARING[heading]
  const wooded = pixelSkyline(scene.townId) === 'pine-road'
  const near: number[] = []
  for (let x = 0; x < PIXEL_IW; x++) {
    const bearing = center + ((x + 0.5) / PIXEL_IW - 0.5) * PIXEL_FOV_DEG
    const h = horizonAt(scene.townId, bearing)
    if (!h) return
    const yFar = PIXEL_HORIZON - h.far * ppd
    const yNear = PIXEL_HORIZON - h.near * ppd
    // Whole pixels down to the horizon row: truncating both the top and the
    // height left the last row unpainted, a bright sky line under every ridge.
    const fill = (top: number, c: string) => {
      const y0 = Math.floor(top)
      if (y0 < PIXEL_HORIZON) { b.fillStyle = c; b.fillRect(x, y0, 1, PIXEL_HORIZON - y0) }
    }
    if (h.far > h.near + 0.3) fill(yFar, lerpHex(BIT.slate, BIT.steel, 0.35))
    fill(yNear, wooded ? BIT.slate : lerpHex(BIT.olive, BIT.limestoneDark, 0.35))
    near.push(yNear)
  }
  // Slope texture, pinned to whole compass degrees so it turns with the view.
  for (let x = 0; x < PIXEL_IW; x++) {
    const bearing = Math.round(center + ((x + 0.5) / PIXEL_IW - 0.5) * PIXEL_FOV_DEG)
    const r = rng(scene.townId.length * 977 + ((bearing % 360) + 360) % 360 * 13)
    const top = near[x]
    if (top >= PIXEL_HORIZON - 1) continue
    if (wooded) {
      // A timbered ridge: small conifer tops along the skyline.
      if (bearing % 2 === 0 && r() < 0.8) {
        const h = 4 + ((r() * 5) | 0)
        b.fillStyle = BIT.moss
        b.beginPath(); b.moveTo(x - 2, top + 2); b.lineTo(x, top - h); b.lineTo(x + 2, top + 2); b.fill()
      }
    } else if (r() < 0.12) {
      // Open grassy slopes with scattered trees on the bowl's walls.
      const y = top + 2 + r() * (PIXEL_HORIZON - top - 3)
      rect(b, x, y, 2, 2, BIT.olive)
    }
  }
}

/** Far later sites (e.g. Sandy Gulch, 2.3 km SSW) marked on the skyline at their true bearing. */
function drawDistantSites(b: CanvasRenderingContext2D, scene: Ascii2Scene, heading: Heading) {
  const ppd = PIXEL_IW / PIXEL_FOV_DEG
  for (const { site, x } of distantSitesInView(scene, heading, PIXEL_IW)) {
    const h = horizonAt(scene.townId, site.bearing)
    const top = PIXEL_HORIZON - Math.max(0, h ? Math.max(h.near, h.far) : 0) * ppd
    rect(b, x, top - 10, 1, 10, BIT.cream)
    const text = `${site.label} · ${(site.distanceM / 1000).toFixed(1)} km ${compassPoint(site.bearing)}`
    b.font = '7px monospace'
    const tw = b.measureText(text).width + 6
    const lx = Math.max(2, Math.min(PIXEL_IW - tw - 2, x - tw / 2))
    rect(b, lx, top - 20, tw, 10, BIT.ink)
    b.fillStyle = BIT.cream
    b.fillText(text, lx + 3, top - 12)
  }
}

/** The camp's own tiles laid out in perspective: grass, dirt, creek, planks, brush. */
function drawGround(b: CanvasRenderingContext2D, scene: Ascii2Scene, position: TownWalkPosition, heading: Heading) {
  for (let y = PIXEL_HORIZON; y < PIXEL_IH; y++) {
    const t = (y - PIXEL_HORIZON) / (PIXEL_IH - PIXEL_HORIZON)
    rect(b, 0, y, PIXEL_IW, 1, lerpHex(BIT.olive, BIT.grass, 0.4 + t * 0.6))
  }
  for (let d = PIXEL_DEPTH + 2; d >= 0; d--) {
    const yFar = contactY(d + 0.5), yNear = contactY(d - 0.5)
    if (yNear - yFar < 0.5) continue
    const reach = Math.min(14, Math.ceil(PIXEL_IW / 2 / (1.15 * sliceAt(kAt(d + 0.5)))) + 1)
    for (let side = -reach; side <= reach; side++) {
      const at = offset(position, heading, d, side)
      const tile = townWalkTileAt(scene.map, at)
      const fx0 = cellX(d + 0.5, side) - cellHalf(d + 0.5), fx1 = cellX(d + 0.5, side) + cellHalf(d + 0.5)
      const nx0 = cellX(d - 0.5, side) - cellHalf(d - 0.5), nx1 = cellX(d - 0.5, side) + cellHalf(d - 0.5)
      const quad = (c: string) => {
        b.fillStyle = c
        b.beginPath(); b.moveTo(fx0, yFar); b.lineTo(fx1, yFar); b.lineTo(nx1, yNear); b.lineTo(nx0, yNear); b.closePath(); b.fill()
      }
      const haze = Math.min(0.5, d * 0.06)
      const r = cellRng(scene.townId, at.x, at.y)
      // Beyond the camp: unmodelled country, drawn as dim scrub, not a void.
      if (!tile) { quad(lerpHex(BIT.olive, BIT.dusk, 0.25 + haze)); continue }
      if (tile.terrain === 'water') {
        quad(lerpHex(BIT.water, BIT.dusk, haze))
        // Ripples across the current, fixed to the tile.
        b.strokeStyle = lerpHex(BIT.waterLite, BIT.dusk, haze)
        for (let i = 0; i < 2; i++) {
          const ty = yFar + (yNear - yFar) * (0.3 + 0.4 * i + r() * 0.1)
          const tx = fx0 + (nx0 - fx0) * 0.5 + r() * (fx1 - fx0) * 0.6
          b.beginPath(); b.moveTo(tx, ty); b.lineTo(tx + Math.max(3, (nx1 - nx0) * 0.25), ty); b.stroke()
        }
        // A bank where the water meets land on the near edge.
        const nearer = townWalkTileAt(scene.map, offset(position, heading, d - 1, side))
        if (nearer && nearer.terrain !== 'water' && nearer.terrain !== 'planks') rect(b, nx0, yNear - 1, nx1 - nx0, 1, BIT.bark)
        continue
      }
      if (tile.terrain === 'planks') {
        quad(lerpHex(BIT.wood, BIT.dusk, haze))
        b.strokeStyle = lerpHex(BIT.bark, BIT.dusk, haze)
        const boards = Math.max(2, Math.round((yNear - yFar) / 3))
        for (let i = 1; i < boards; i++) {
          const ty = yFar + ((yNear - yFar) * i) / boards
          b.beginPath(); b.moveTo(fx0 + (nx0 - fx0) * (i / boards), ty); b.lineTo(fx1 + (nx1 - fx1) * (i / boards), ty); b.stroke()
        }
        // Water shows beside the bridge, so the crossing reads as a crossing.
        continue
      }
      if (tile.terrain === 'dirt') {
        quad(lerpHex(BIT.dirt, BIT.dusk, haze))
        if (d <= 3) { b.fillStyle = BIT.bark; b.fillRect((nx0 + (fx0 - nx0) * r()) | 0, (yFar + (yNear - yFar) * r()) | 0, 2, 1) }
        continue
      }
      // Grass: a few tufts, placed by the tile, so they do not jump as you move.
      if (d <= 4) {
        b.fillStyle = lerpHex(BIT.grassLite, BIT.dusk, haze)
        const n = d <= 1 ? 4 : 2
        for (let i = 0; i < n; i++) {
          const ty = yFar + (yNear - yFar) * (0.2 + r() * 0.7)
          const w = (ty - yFar) / Math.max(1, yNear - yFar)
          const x0 = fx0 + (nx0 - fx0) * w, x1 = fx1 + (nx1 - fx1) * w
          b.fillRect((x0 + (x1 - x0) * r()) | 0, (ty - 2) | 0, 1, d <= 1 ? 3 : 2)
        }
      }
    }
  }
}

/**
 * One wall tent across a run of canvas tiles: pitched roof on a ridge pole,
 * canvas wall in panels, guy-lines to stakes, and the flap if the doorway is in
 * the run. The collision tiles do not change; only the picture joins them up.
 */
function drawWallTent(b: CanvasRenderingContext2D, d: number, s0: number, s1: number, doorSide: number | null) {
  const pal = shade('canvas', d)
  const k = kAt(d)
  const left = cellX(d, s0) - cellHalf(d), right = cellX(d, s1) + cellHalf(d)
  const bot = contactY(d)
  const top = Math.max(6, PIXEL_HORIZON - 44 * k)
  const h = bot - top
  const wallTop = top + h * 0.42
  const eave = Math.max(2, h * 0.08)
  // Guy-lines first, so the tent stands in front of them.
  b.strokeStyle = lerpHex(BIT.bark, BIT.dusk, Math.min(0.5, d * 0.08))
  for (const [ex, sx] of [[left - eave, left - h * 0.38], [right + eave, right + h * 0.38]]) {
    b.beginPath(); b.moveTo(ex, wallTop); b.lineTo(sx, bot); b.stroke()
    rect(b, sx - 1, bot - 3, 2, 3, BIT.bark)
  }
  // Canvas wall in vertical panels.
  rect(b, left, wallTop, right - left, bot - wallTop, pal.fill)
  const panel = Math.max(4, cellHalf(d))
  for (let x = left + panel; x < right - 1; x += panel) rect(b, x, wallTop, 1, bot - wallTop, pal.dark)
  rect(b, left, bot - Math.max(2, h * 0.06), right - left, Math.max(2, h * 0.06), pal.dark)
  // Pitched roof, lit on the upper plane.
  b.fillStyle = pal.light
  b.beginPath()
  b.moveTo(left - eave, wallTop); b.lineTo(left + eave, top); b.lineTo(right - eave, top); b.lineTo(right + eave, wallTop)
  b.closePath(); b.fill()
  b.fillStyle = pal.dark
  b.beginPath()
  b.moveTo(left - eave, wallTop); b.lineTo(right + eave, wallTop); b.lineTo(right + eave * 0.5, wallTop - Math.max(2, h * 0.06)); b.lineTo(left - eave * 0.5, wallTop - Math.max(2, h * 0.06))
  b.closePath(); b.fill()
  // Ridge pole, its ends standing proud of the canvas.
  rect(b, left, top - 1, right - left, 2, BIT.wood)
  rect(b, left - 2, top - 2, 3, 3, BIT.bark)
  rect(b, right - 1, top - 2, 3, 3, BIT.bark)
  if (doorSide !== null) {
    // The doorway: flaps tied back, dark inside.
    const cx = cellX(d, doorSide), w = Math.max(4, cellHalf(d) * 1.1)
    b.fillStyle = BIT.ink
    b.beginPath(); b.moveTo(cx - w / 2, bot); b.lineTo(cx, wallTop + (bot - wallTop) * 0.1); b.lineTo(cx + w / 2, bot); b.closePath(); b.fill()
    b.strokeStyle = pal.dark
    b.beginPath(); b.moveTo(cx - w / 2 - 1, bot); b.lineTo(cx, wallTop + (bot - wallTop) * 0.1); b.lineTo(cx + w / 2 + 1, bot); b.stroke()
  }
}

function drawTree(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  const mid = x + w / 2
  const trunkW = Math.max(2, w * 0.18)
  rect(b, mid - trunkW / 2, bot - (bot - top) * 0.35, trunkW, (bot - top) * 0.35, BIT.bark)
  b.fillStyle = pal.fill
  b.beginPath()
  b.moveTo(x, bot - (bot - top) * 0.3)
  b.lineTo(mid, top)
  b.lineTo(x + w, bot - (bot - top) * 0.3)
  b.closePath()
  b.fill()
  b.fillStyle = pal.light
  b.beginPath()
  b.moveTo(x + w * 0.2, bot - (bot - top) * 0.45)
  b.lineTo(mid, top + 4)
  b.lineTo(mid, bot - (bot - top) * 0.35)
  b.closePath()
  b.fill()
}

function drawFire(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  rect(b, x + w * 0.15, bot - 4, w * 0.7, 4, BIT.ash)
  const mid = x + w / 2
  b.fillStyle = pal.fill
  b.beginPath()
  b.moveTo(mid, top)
  b.lineTo(x + w * 0.15, bot - 4)
  b.lineTo(x + w * 0.85, bot - 4)
  b.closePath()
  b.fill()
  b.fillStyle = pal.light
  b.beginPath()
  b.moveTo(mid, top + 6)
  b.lineTo(mid - w * 0.18, bot - 6)
  b.lineTo(mid + w * 0.18, bot - 6)
  b.closePath()
  b.fill()
}

function drawFog(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>, r: () => number) {
  b.globalAlpha = 0.55
  rect(b, x, top, w, bot - top, pal.fill)
  dith(b, x, top, w, bot - top, pal.light, 0.35, r)
  b.globalAlpha = 1
}

function drawPerson(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number) {
  const mid = x + w / 2
  const h = bot - top
  const bodyH = Math.max(8, h * 0.55)
  const head = Math.max(3, w * 0.28)
  rect(b, mid - w * 0.18, bot - bodyH, w * 0.36, bodyH * 0.7, BIT.navy)
  rect(b, mid - w * 0.12, bot - bodyH * 0.35, w * 0.1, bodyH * 0.35, BIT.bark)
  rect(b, mid + w * 0.02, bot - bodyH * 0.35, w * 0.1, bodyH * 0.35, BIT.bark)
  rect(b, mid - head / 2, bot - bodyH - head, head, head, BIT.tan)
  rect(b, mid - head / 2 - 1, bot - bodyH - head - 2, head + 2, 3, BIT.wood)
}

function drawRock(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  b.fillStyle = pal.fill
  b.beginPath()
  b.moveTo(x + 2, bot)
  b.lineTo(x + w * 0.25, top + 4)
  b.lineTo(x + w * 0.8, top)
  b.lineTo(x + w, bot)
  b.closePath()
  b.fill()
  b.fillStyle = pal.light
  b.fillRect(x + w * 0.3, top + 4, w * 0.25, 3)
}

function drawMarker(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  const mid = x + w / 2
  rect(b, mid - 1, top, 3, bot - top, pal.fill)
  rect(b, mid - w * 0.28, top + (bot - top) * 0.22, w * 0.56, 3, pal.light)
}

/** A waymark on a post — not a cross, so a road sign never reads as a grave. */
function drawSignpost(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number) {
  const mid = x + w / 2
  rect(b, mid - 1, top + (bot - top) * 0.2, 2, (bot - top) * 0.8, BIT.bark)
  rect(b, mid - w * 0.32, top + (bot - top) * 0.2, w * 0.64, Math.max(3, (bot - top) * 0.16), BIT.wood)
  rect(b, mid - w * 0.32, top + (bot - top) * 0.2, w * 0.64, 1, BIT.tan)
}

/**
 * The camp's edge: knee-high scrub, not a wall. The map ends here and you cannot
 * walk on, but the country does not stop — the skyline beyond stays visible.
 */
function drawScrub(b: CanvasRenderingContext2D, x: number, w: number, bot: number, h: number, pal: ReturnType<typeof shade>, r: () => number) {
  const bushH = Math.max(3, h * 0.28)
  for (let i = 0; i < 3; i++) {
    const bx = x + (w * (i + 0.2 + r() * 0.3)) / 3
    const bw = Math.max(3, w / 3 + r() * 3)
    const bh = bushH * (0.7 + r() * 0.5)
    b.fillStyle = i % 2 ? pal.fill : pal.light
    b.beginPath(); b.ellipse(bx + bw / 2, bot - bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2); b.fill()
  }
}

function drawCrate(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  rect(b, x + 2, top + 4, w - 4, bot - top - 4, pal.fill)
  b.strokeStyle = pal.dark
  b.strokeRect(x + 2, top + 4, w - 4, bot - top - 4)
  b.beginPath()
  b.moveTo(x + 2, top + 4)
  b.lineTo(x + w - 2, bot)
  b.stroke()
}

function drawFace(b: CanvasRenderingContext2D, face: PixelFace, r: () => number) {
  const box = band(face.depth, face.side)
  const pal = shade(face.kind, face.depth)
  switch (face.kind) {
    case 'canvas':
    case 'entrance':
      break // drawn as whole tents (drawWallTent)
    case 'tree':
      drawTree(b, box.x, box.top, box.w, box.bot, pal)
      break
    case 'water':
      break
    case 'fire':
      drawFire(b, box.x, box.top + 8, box.w, box.bot, pal)
      break
    case 'fog':
      drawFog(b, box.x, box.top, box.w, box.bot, pal, r)
      break
    case 'npc':
      drawPerson(b, box.x, box.top + 6, box.w, box.bot)
      break
    case 'rock':
      drawRock(b, box.x, box.top + 10, box.w, box.bot, pal)
      break
    case 'marker':
      drawMarker(b, box.x, box.top, box.w, box.bot, pal)
      break
    case 'crate':
    case 'bench':
    case 'table':
      drawCrate(b, box.x, box.top + 12, box.w, box.bot, pal)
      break
    case 'attraction':
      drawSignpost(b, box.x, box.top + 8, box.w, box.bot)
      break
    case 'brush':
      drawScrub(b, box.x, box.w, box.bot, box.bot - box.top, pal, r)
      break
    case 'wall':
      rect(b, box.x, box.top, box.w, box.bot - box.top, pal.fill)
      dith(b, box.x, box.top, box.w, box.bot - box.top, pal.dark, 0.2, r)
      break
    default:
      break
  }
}

export function paintAscii2Pixels(
  ctx: CanvasRenderingContext2D,
  scene: Ascii2Scene,
  position: TownWalkPosition,
  heading: Heading,
  allowed: (t: TownWalkTarget) => boolean = () => true,
) {
  const buf = ctx.canvas
  if (buf.width !== PIXEL_IW || buf.height !== PIXEL_IH) {
    buf.width = PIXEL_IW
    buf.height = PIXEL_IH
  }
  ctx.imageSmoothingEnabled = false
  drawSky(ctx, scene, heading)
  drawHorizon(ctx, scene, heading)
  drawGround(ctx, scene, position, heading)
  const faces = pixelFacesAhead(scene, position, heading, allowed)
  // Runs of canvas (and its doorway) at each depth become one tent.
  const tentDone = new Set<number>()
  for (const face of faces) {
    if (face.kind === 'water') continue
    if (face.kind === 'canvas' || face.kind === 'entrance') {
      if (tentDone.has(face.depth)) continue
      tentDone.add(face.depth)
      const row = faces.filter((f) => f.depth === face.depth && (f.kind === 'canvas' || f.kind === 'entrance')).map((f) => f.side).sort((a, b) => a - b)
      let s0 = row[0]
      for (let i = 1; i <= row.length; i++) {
        if (i === row.length || row[i] !== row[i - 1] + 1) {
          const door = faces.find((f) => f.depth === face.depth && f.kind === 'entrance' && f.side >= s0 && f.side <= row[i - 1])
          drawWallTent(ctx, face.depth, s0, row[i - 1], door ? door.side : null)
          if (i < row.length) s0 = row[i]
        }
      }
      continue
    }
    drawFace(ctx, face, cellRng(scene.townId, face.at.x, face.at.y, 1))
  }
  // Far sites last, so nothing near is drawn over their bearing and name.
  drawDistantSites(ctx, scene, heading)
  // Name the nearest labelled thing.
  const named = [...faces].reverse().find((f) => f.label && f.depth <= 3 && Math.abs(f.side) <= 1)
  if (named?.label) {
    ctx.font = '8px monospace'
    const tw = Math.min(PIXEL_IW - 16, ctx.measureText(named.label).width + 8)
    rect(ctx, (PIXEL_IW - tw) / 2, 8, tw, 12, BIT.ink)
    ctx.fillStyle = BIT.cream
    ctx.fillText(named.label, (PIXEL_IW - tw) / 2 + 4, 17)
  }
}
