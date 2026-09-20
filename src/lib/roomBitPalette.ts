/**
 * roomBitPalette.ts — the 40×22 interior rooms, in the walk's 32-bit colours.
 *
 * The rooms (canvas saloon, Soldiers' Gulch, Pioneer Cemetery) are authored as
 * glyph grids, and the grid is the ground truth: the overlay tests read those
 * rows, and the browser tools read them off the page. This file does not change
 * a single cell. It says what colour each glyph is painted in, using the same
 * BIT palette the pixel walk uses, so a room stops looking like a leftover DOS
 * screen beside a 32-bit camp.
 *
 * A glyph with no entry here is NOT painted a default colour. An unmapped cell
 * returns null and is left unpainted, and `unpaintedGlyphs` names it — a room
 * quietly painted one flat colour would look deliberate while meaning nothing.
 */

import { BIT } from './walkBitPalette'

export type RoomInk = {
  /** The cell's colour. */
  fill: string
  /** Its darker twin, alternated cell by cell so a flat field reads as texture. */
  shade: string
  /** What the glyph is, for the palette test and for anyone reading this file. */
  of: string
}

/** Glyph → colour. The glyphs come from the three room files' own `note` lines. */
export const ROOM_GLYPH_INK: Record<string, RoomInk> = {
  '#': { fill: BIT.bark, shade: BIT.dusk, of: 'plank wall, fence rail' },
  f: { fill: BIT.canvas, shade: BIT.canvasShade, of: 'canvas wall' },
  '=': { fill: BIT.wood, shade: BIT.bark, of: 'plank floor' },
  o: { fill: BIT.slate, shade: BIT.ink, of: 'barrel, pothole in the limestone' },
  '.': { fill: BIT.limestone, shade: BIT.limestoneDark, of: 'gravel, swept floor' },
  ',': { fill: BIT.moss, shade: BIT.olive, of: 'grass' },
  '~': { fill: BIT.water, shade: BIT.navy, of: 'the wash' },
  '+': { fill: BIT.tan, shade: BIT.brass, of: 'door flap, wooden grave marker' },
}

/**
 * The colour for one cell, or null when the glyph has no declared ink.
 *
 * The second tone is speckled, not checkerboarded. Alternating every other cell
 * ((x + y) % 2) paints a chessboard — regular enough that the eye reads the
 * pattern instead of the room, which is not what the eye-level walk looks like.
 * This scatters roughly a quarter of the cells onto the darker tone with a small
 * deterministic hash, so a flat field gets grain: the same room always paints
 * the same way, and no cell's colour depends on anything outside this function.
 */
export function roomCellColor(glyph: string, x: number, y: number): string | null {
  const ink = ROOM_GLYPH_INK[glyph]
  if (!ink) return null
  return speckled(x, y) ? ink.shade : ink.fill
}

/** True for about a quarter of cells, scattered, and always the same ones. */
export function speckled(x: number, y: number): boolean {
  return ((x * 7 + y * 13 + ((x * y) % 5)) % 4) === 0
}

/** Glyphs in these rows that nothing has declared a colour for. */
export function unpaintedGlyphs(rows: string[]): string[] {
  const missing = new Set<string>()
  for (const row of rows) {
    for (const glyph of row) if (!ROOM_GLYPH_INK[glyph]) missing.add(glyph)
  }
  return [...missing].sort()
}

/** Every colour a painted room actually puts on screen. */
export function roomPaintedColors(rows: string[]): string[] {
  const seen = new Set<string>()
  rows.forEach((row, y) => {
    ;[...row].forEach((glyph, x) => {
      const c = roomCellColor(glyph, x, y)
      if (c) seen.add(c)
    })
  })
  return [...seen].sort()
}
