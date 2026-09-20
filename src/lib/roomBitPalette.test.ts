/**
 * The painted rooms are the authored rooms, in the walk's colours.
 *   node_modules/.bin/tsx src/lib/roomBitPalette.test.ts
 *
 * The failure this guards against is a room that paints, looks deliberate, and
 * says nothing: one flat colour, or a glyph nobody gave a colour to quietly
 * rendering as the same nothing as its neighbour.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BIT } from './walkBitPalette'
import { ROOM_GLYPH_INK, roomCellColor, roomPaintedColors, speckled, unpaintedGlyphs } from './roomBitPalette'
import { volcanoSaloonRows } from './overlay/volcano-canvas-saloon'
import { soldiersGulchRows } from './overlay/volcano-soldiers-gulch'
import { volcanoCemeteryRows } from './overlay/volcano-cemetery'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const rooms = {
  'canvas saloon': volcanoSaloonRows(),
  "soldiers' gulch": soldiersGulchRows(),
  'pioneer cemetery': volcanoCemeteryRows(),
}

const palette = new Set<string>(Object.values(BIT))
for (const [glyph, ink] of Object.entries(ROOM_GLYPH_INK)) {
  ok(palette.has(ink.fill), `${glyph} fill is a BIT colour`)
  ok(palette.has(ink.shade), `${glyph} shade is a BIT colour`)
  ok(ink.fill !== ink.shade, `${glyph} has two tones, so a flat field has texture`)
  ok(ink.of.length > 3, `${glyph} says what it is`)
}

for (const [name, rows] of Object.entries(rooms)) {
  // The grid is untouched: still the authored 40×22.
  ok(rows.length === 22, `${name} is still 22 rows`)
  ok(rows.every((r) => r.length === 40), `${name} is still 40 wide`)

  // Every glyph on screen has a declared colour. An unmapped glyph is a hole.
  const missing = unpaintedGlyphs(rows)
  ok(missing.length === 0, missing.length ? `${name} has unpainted glyphs ${JSON.stringify(missing)}` : `${name} paints every glyph it uses`)

  // A room painted one colour is a room that shows nothing.
  const colors = roomPaintedColors(rows)
  ok(colors.length >= 4, `${name} puts ${colors.length} colours on screen (needs 4+)`)
}

// The speckle is deterministic, scattered, and uses both tones.
const flat = Array.from({ length: 22 }, () => '#'.repeat(40))
const speckCount = flat.reduce((n, row, y) => n + [...row].filter((_, x) => speckled(x, y)).length, 0)
const cells = 40 * 22
ok(speckCount > cells * 0.15 && speckCount < cells * 0.4, `speckle covers ${Math.round((speckCount / cells) * 100)}% of a flat field (15-40%)`)
ok(roomPaintedColors(flat).length === 2, 'a field of one glyph still shows both of its tones')
ok(roomCellColor('#', 3, 3) === roomCellColor('#', 3, 3), 'the same cell is the same colour every time')
ok(
  [...flat[4]].some((_, x) => speckled(x, 4)) && [...flat[4]].some((_, x) => !speckled(x, 4)),
  'a single row carries both tones',
)
ok(
  !Array.from({ length: 20 }, (_, x) => speckled(x, 6)).every((v, i, a) => i === 0 || v !== a[i - 1]),
  'the second tone is scattered, not a chessboard',
)
ok(roomCellColor('Z', 0, 0) === null, 'an undeclared glyph is not painted a default colour')
ok(unpaintedGlyphs(['Z#']).join() === 'Z', 'an undeclared glyph is named')

// The component keeps the reading on the page: the grid is still the element's
// text, one real newline per row, and the test ids the browser tools use.
const here = path.dirname(fileURLToPath(import.meta.url))
const room = readFileSync(path.join(here, '../components/explore/BitRoom.tsx'), 'utf8')
ok(/data-testid=\{testid\}/.test(room), 'the room keeps its testid')
ok(/\{y < rows\.length - 1 \? '\\n' : ''\}/.test(room), 'rows are separated by a real newline, so 22 rows copy as 22 lines')
ok(/\{glyph\}/.test(room), 'each cell still carries its glyph as text')
ok(/backgroundColor: roomCellColor\(/.test(room), 'the paint is the declared ink')

const town = readFileSync(path.join(here, '../components/explore/InteractiveTown.tsx'), 'utf8')
const shop = readFileSync(path.join(here, '../app/oregon-trail/components/GoldCountryShopInterior.tsx'), 'utf8')
ok(/<BitRoom/.test(town), 'the town face paints its rooms')
ok(/<BitRoom/.test(shop), 'the shop front paints the same room')
ok(!/text-\[#c4b896\][^\n]*>\s*$/m.test(town), 'the old monochrome pre is gone from the town face')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({
  ok: true,
  passed,
  rooms: Object.fromEntries(Object.entries(rooms).map(([n, r]) => [n, roomPaintedColors(r).length])),
}))
