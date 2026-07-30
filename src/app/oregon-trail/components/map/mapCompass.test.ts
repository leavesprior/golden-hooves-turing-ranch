/**
 * The compass fits, and the anchor is what makes it fit.
 *
 * The compass shipped twice in the wrong place with hand-tuned constants: `92`
 * clipped the E glyph against the viewBox edge, and `88` was only right for one set
 * of label sizes. This test replaces "someone looked at it" with arithmetic, so a
 * label or font-size change that would clip fails here instead of in a screenshot.
 *
 * Deliberately includes NEGATIVE controls: the old constants must be shown to fail,
 * otherwise this file only proves that today's numbers happen to work.
 */

import {
  GLYPH,
  GLYPH_OBSERVED,
  MAP_MARGIN,
  MODEL_TOLERANCE,
  MAP_VIEWBOX,
  MAP_SAFE_INSET,
  anchorTopRight,
  fitsWithinSafeArea,
  glyphExtent,
  padExtent,
  placedBounds,
  translate,
  unionExtents,
} from './mapViewport'
import { CLASSIC_EXTENT, ORNATE_EXTENT, RETRO_EXTENT, extentForTier } from './MapCompass'
import { readFileSync } from 'node:fs'

let failures = 0
function ok(label: string, cond: boolean, detail = '') {
  if (cond) console.log(`  PASS  ${label}`)
  else { failures++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }
}

console.log('\nthe glyph model must not dip below measured reality')
// The original model guessed ascent 0.85 while a browser getBBox() sweep measured
// 0.95, and put halfAdvance/descent exactly on the boundary. The safe inset hid it.
// These assertions make "we measured it" a fact the suite defends, not a comment.
ok(`halfAdvance model ${GLYPH.halfAdvance} >= observed ${GLYPH_OBSERVED.halfAdvance}`,
  GLYPH.halfAdvance >= GLYPH_OBSERVED.halfAdvance)
ok(`ascent model ${GLYPH.ascent} >= observed ${GLYPH_OBSERVED.ascent}`,
  GLYPH.ascent >= GLYPH_OBSERVED.ascent)
ok(`descent model ${GLYPH.descent} >= observed ${GLYPH_OBSERVED.descent}`,
  GLYPH.descent >= GLYPH_OBSERVED.descent)
ok('the model keeps real headroom, not a boundary tie',
  GLYPH.halfAdvance - GLYPH_OBSERVED.halfAdvance > 0.02 &&
  GLYPH.ascent - GLYPH_OBSERVED.ascent > 0.02 &&
  GLYPH.descent - GLYPH_OBSERVED.descent > 0.02,
  'a margin of 0.001 is not a margin')

console.log('\nmapViewport primitives')
ok('unionExtents takes the outer hull',
  JSON.stringify(unionExtents([
    { left: 0, right: 2, top: 0, bottom: 2 },
    { left: -1, right: 1, top: 1, bottom: 5 },
  ])) === JSON.stringify({ left: -1, right: 2, top: 0, bottom: 5 }))

ok('padExtent grows every side', (() => {
  const p = padExtent({ left: 0, right: 1, top: 0, bottom: 1 }, 0.5)
  return p.left === -0.5 && p.right === 1.5 && p.top === -0.5 && p.bottom === 1.5
})())

ok('a middle-anchored glyph reaches both sides of its origin', (() => {
  const g = glyphExtent(10, 5, 2)
  return g.left < 10 && g.right > 10 && g.top < 5 && g.bottom > 5
})())

ok('anchorTopRight puts the ink flush against the right inset', (() => {
  const e = { left: 0, right: 8, top: 0, bottom: 8 }
  const b = placedBounds(e, anchorTopRight(e))
  return Math.abs(b.right - (MAP_VIEWBOX.width - MAP_SAFE_INSET)) < 1e-9
})())

ok('anchorTopRight puts the ink flush against the top inset', (() => {
  const e = { left: 0, right: 8, top: -2, bottom: 8 }
  const b = placedBounds(e, anchorTopRight(e))
  return Math.abs(b.top - MAP_SAFE_INSET) < 1e-9
})())

console.log('\nevery tier fits inside the safe area')
const tiers = [
  ['retro_4bit', RETRO_EXTENT],
  ['classic_8bit', CLASSIC_EXTENT],
  ['modern_32bit', ORNATE_EXTENT],
  ['ultra_64bit', ORNATE_EXTENT],
  ['enhanced_16bit', ORNATE_EXTENT],
] as const

for (const [tier, extent] of tiers) {
  const at = anchorTopRight(extent)
  const bounds = placedBounds(extent, at)
  const fit = fitsWithinSafeArea(bounds)
  ok(`${tier} fits (${translate(at)})`, fit.ok, JSON.stringify(fit.overflow))
  // and it must be in the TOP-RIGHT, not merely inside
  ok(`${tier} is anchored top-right`,
    bounds.right > MAP_VIEWBOX.width * 0.75 && bounds.top < MAP_VIEWBOX.height * 0.25,
    `right=${bounds.right.toFixed(2)} top=${bounds.top.toFixed(2)}`)
}

console.log('\nextentForTier routes every tier to a real extent')
for (const [tier] of tiers) {
  const e = extentForTier(tier as never)
  ok(`${tier} has a non-empty extent`, e.right > e.left && e.bottom > e.top)
}

console.log('\nNEGATIVE CONTROLS — the historical bugs must still be detectable')

// The original constant. The rose reached local x≈8.75 (E glyph + half advance),
// so translate(92) put its right edge past the viewBox and the border clipped it.
ok('the original translate(92, 5) would OVERFLOW the right edge',
  (() => {
    const b = placedBounds(RETRO_EXTENT, { x: 92, y: 5 })
    const fit = fitsWithinSafeArea(b)
    return !fit.ok && fit.overflow.right !== undefined
  })(),
  'expected a right-edge overflow')

// The replacement constant sat inside the viewBox but hard against the inset --
// it only "worked" for these exact label sizes.
ok('a wider label would break the hand-tuned 88 but not the anchor',
  (() => {
    const wider = padExtent(unionExtents([
      glyphExtent(4, 3, 2.5),
      glyphExtent(0, 6.5, 2.5),
      glyphExtent(12, 6.5, 2.5),  // an E moved further out, e.g. a bigger rose
      glyphExtent(4, 10, 2.5),
    ]), 0.3)
    const hardCoded = fitsWithinSafeArea(placedBounds(wider, { x: 88, y: 5 }))
    const anchored = fitsWithinSafeArea(placedBounds(wider, anchorTopRight(wider)))
    return !hardCoded.ok && anchored.ok
  })(),
  'the anchor must absorb a geometry change the constant cannot')

// A widget too large for the map must be reported, not silently placed.
ok('an oversized widget is reported as overflowing, not silently accepted',
  (() => {
    const huge = { left: 0, right: MAP_VIEWBOX.width + 10, top: 0, bottom: 5 }
    return !fitsWithinSafeArea(placedBounds(huge, anchorTopRight(huge))).ok
  })())

console.log('\nthe model tolerance must stay small, not become a sponge')
ok(`MODEL_TOLERANCE ${MODEL_TOLERANCE} is small`, MODEL_TOLERANCE <= 0.05,
  'a large tolerance hides the next metric bug, which is how the 12% ascent error shipped')
ok('the design margin is separate from the model tolerance',
  MAP_MARGIN > 0 && MAP_SAFE_INSET === MAP_MARGIN + MODEL_TOLERANCE)

console.log('\nDUAL-SOURCE REGRESSION — one table must feed both draw and extent')
// A reviewer broke the first version by moving the drawn E from x=8 to x=11 while
// leaving a separate extent table alone: the suite said "fits" while the ink
// overflowed by 3 units. Guard the property that made that possible: the component
// must not contain hard-coded <text x=...> coordinates for the compass glyphs, because
// those are what used to drift from the extent model.
{
  const src = readFileSync(new URL('./MapCompass.tsx', import.meta.url), 'utf8')
  // `<text\s[^>]*\sx="` was the first attempt and it required TWO whitespace runs,
  // so `<text x="20"` — the exact shape it existed to catch — slipped through and the
  // guard silently passed. Verified against a deliberate reintroduction before trusting.
  const literalTextCoords = src.match(/<text\s[^>]*x="/g) || []
  ok('no compass glyph is drawn from a hard-coded x= literal',
    literalTextCoords.length === 0,
    `${literalTextCoords.length} literal <text x="..."> found — those can drift from the extent table`)
  ok('glyph tables exist and are the draw source',
    /RETRO_GLYPHS/.test(src) && /<Glyphs glyphs=/.test(src))
}

console.log(failures ? `\nmapCompass: ${failures} FAILED` : '\nmapCompass: ALL PASS')
if (failures) process.exit(1)
