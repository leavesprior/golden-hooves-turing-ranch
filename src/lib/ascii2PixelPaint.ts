/**
 * Paint the ascii2 camera as a 320×180 32/64-bit frame.
 * Client-only (needs CanvasRenderingContext2D). Classifier stays in ascii2PixelWalk.ts.
 */
import { pixelFacesAhead, pixelSkyline, type PixelFace, type PixelKind } from '@/lib/ascii2PixelWalk'
import { BIT, PIXEL_IH, PIXEL_IW, PIXEL_HORIZON } from '@/lib/walkBitPalette'
import type { Ascii2Scene, Heading } from '@/lib/ascii2Walk'
import type { TownWalkPosition, TownWalkTarget } from '@/lib/townWalk'

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

function drawSky(b: CanvasRenderingContext2D, townId: string, seed: number) {
  const r = rng(seed + 11)
  for (let y = 0; y < PIXEL_HORIZON; y++) {
    const t = y / PIXEL_HORIZON
    rect(b, 0, y, PIXEL_IW, 1, lerpHex(BIT.navy, BIT.sky, t * 0.55 + 0.15))
  }
  // late-day cloud bars
  b.globalAlpha = 0.35
  for (let i = 0; i < 6; i++) {
    rect(b, 20 + r() * 260, 8 + r() * 28, 40 + r() * 70, 4 + r() * 6, BIT.ice)
  }
  b.globalAlpha = 1
  const line = pixelSkyline(townId)
  if (line === 'limestone-bowl') {
    // The name is the look of the basin, not a volcano.
    const ridges = [
      { x: -20, w: 160, h: 38, c: BIT.limestoneDark },
      { x: 80, w: 180, h: 52, c: BIT.olive },
      { x: 200, w: 150, h: 34, c: BIT.limestoneDark },
      { x: 40, w: 110, h: 22, c: BIT.limestone },
    ]
    for (const ridge of ridges) {
      b.fillStyle = ridge.c
      b.beginPath()
      b.moveTo(ridge.x, PIXEL_HORIZON)
      b.lineTo(ridge.x + ridge.w * 0.35, PIXEL_HORIZON - ridge.h)
      b.lineTo(ridge.x + ridge.w * 0.7, PIXEL_HORIZON - ridge.h * 0.55)
      b.lineTo(ridge.x + ridge.w, PIXEL_HORIZON)
      b.closePath()
      b.fill()
    }
    dith(b, 0, PIXEL_HORIZON - 40, PIXEL_IW, 40, BIT.tan, 0.08, r)
  } else {
    for (let i = 0; i < 18; i++) {
      const x = i * 22 - 8
      const h = 18 + ((r() * 28) | 0)
      b.fillStyle = BIT.olive
      b.beginPath()
      b.moveTo(x, PIXEL_HORIZON)
      b.lineTo(x + 14, PIXEL_HORIZON - h)
      b.lineTo(x + 28, PIXEL_HORIZON)
      b.fill()
      rect(b, x + 12, PIXEL_HORIZON - 8, 3, 8, BIT.bark)
    }
  }
}

function drawGround(b: CanvasRenderingContext2D, seed: number) {
  const r = rng(seed + 29)
  for (let y = PIXEL_HORIZON; y < PIXEL_IH; y++) {
    const t = (y - PIXEL_HORIZON) / (PIXEL_IH - PIXEL_HORIZON)
    rect(b, 0, y, PIXEL_IW, 1, lerpHex(BIT.dirt, BIT.dirtDark, t * 0.45))
  }
  // wagon-rut perspective
  b.strokeStyle = BIT.bark
  b.lineWidth = 1
  b.beginPath()
  b.moveTo(PIXEL_IW * 0.42, PIXEL_HORIZON + 2)
  b.lineTo(PIXEL_IW * 0.18, PIXEL_IH)
  b.moveTo(PIXEL_IW * 0.58, PIXEL_HORIZON + 2)
  b.lineTo(PIXEL_IW * 0.82, PIXEL_IH)
  b.stroke()
  dith(b, 0, PIXEL_HORIZON, PIXEL_IW, PIXEL_IH - PIXEL_HORIZON, BIT.grass, 0.07, r)
  // grass tufts near the camera
  b.fillStyle = BIT.grassLite
  for (let i = 0; i < 40; i++) {
    const x = (r() * PIXEL_IW) | 0
    const y = PIXEL_HORIZON + 40 + ((r() * 70) | 0)
    b.fillRect(x, y, 1, 3)
  }
}

function drawCanvasTent(b: CanvasRenderingContext2D, x: number, top: number, w: number, bot: number, pal: ReturnType<typeof shade>) {
  const h = bot - top
  const mid = x + w / 2
  b.fillStyle = pal.dark
  b.beginPath()
  b.moveTo(x, bot - 2)
  b.lineTo(mid, top)
  b.lineTo(x + w, bot - 2)
  b.closePath()
  b.fill()
  b.fillStyle = pal.fill
  b.beginPath()
  b.moveTo(x + 2, bot - 2)
  b.lineTo(mid, top + 2)
  b.lineTo(x + w - 2, bot - 2)
  b.closePath()
  b.fill()
  b.strokeStyle = pal.light
  b.beginPath()
  b.moveTo(mid, top)
  b.lineTo(mid, bot - 2)
  b.stroke()
  // flap
  const flap = Math.max(4, w * 0.28)
  rect(b, mid - flap / 2, bot - h * 0.45, flap, h * 0.45, BIT.bark)
  rect(b, mid - flap / 2 + 1, bot - h * 0.45 + 1, flap - 2, h * 0.2, pal.dark)
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

function groundY(depth: number) {
  const k = 1 / (1 + depth * 0.55)
  return Math.round(PIXEL_HORIZON + 8 + (1 - k) * 88)
}

function drawWaterRibbon(b: CanvasRenderingContext2D, depth: number, pal: ReturnType<typeof shade>) {
  const y = groundY(depth)
  const h = Math.max(5, Math.round(18 / (1 + depth * 0.35)))
  rect(b, 0, y, PIXEL_IW, h, pal.fill)
  b.strokeStyle = pal.light
  for (let x = 4; x < PIXEL_IW; x += 14) {
    b.beginPath()
    b.moveTo(x, y + 3)
    b.lineTo(x + 8, y + 3 + (depth % 2 ? 1 : -1))
    b.stroke()
  }
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
      drawCanvasTent(b, box.x, box.top, box.w, box.bot, pal)
      break
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
    case 'entrance':
      drawCanvasTent(b, box.x, box.top, box.w, box.bot, pal)
      break
    case 'attraction':
      drawMarker(b, box.x, box.top + 8, box.w, box.bot, pal)
      break
    case 'wall':
    case 'brush':
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
  const seed = scene.townId.length * 97 + position.x * 13 + position.y * 29 + heading.charCodeAt(0)
  const r = rng(seed)
  drawSky(ctx, scene.townId, seed)
  drawGround(ctx, seed)
  const faces = pixelFacesAhead(scene, position, heading, allowed)
  const waterDepths = new Set(faces.filter((f) => f.kind === 'water').map((f) => f.depth))
  for (const depth of [...waterDepths].sort((a, b) => b - a)) {
    drawWaterRibbon(ctx, depth, shade('water', depth))
  }
  for (const face of faces) {
    if (face.kind === 'water') continue
    drawFace(ctx, face, r)
  }
  // name the nearest labelled thing
  const named = [...faces].reverse().find((f) => f.label && f.depth <= 3 && Math.abs(f.side) <= 1)
  if (named?.label) {
    const text = named.kind === 'fog' ? named.label : named.label
    ctx.font = '8px monospace'
    const tw = Math.min(PIXEL_IW - 16, ctx.measureText(text).width + 8)
    rect(ctx, (PIXEL_IW - tw) / 2, 8, tw, 12, BIT.ink)
    ctx.fillStyle = BIT.cream
    ctx.fillText(text, (PIXEL_IW - tw) / 2 + 4, 17)
  }
}
