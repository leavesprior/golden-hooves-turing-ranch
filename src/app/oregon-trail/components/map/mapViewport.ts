/**
 * The map's coordinate system, and anchoring within it.
 *
 * WHY THIS EXISTS
 * The compass used to be positioned with hand-tuned constants — `translate(92, 5)`,
 * then `translate(88, 5)` once the first number was found to clip the `E` glyph
 * against the map border. Both numbers were only ever correct for one viewBox and
 * one set of label sizes, and neither was written down anywhere near the viewBox
 * they depended on: the map declares `0 0 100 62.5` in WorldMap.tsx while the
 * compass silently assumed the width was 100. That split is the actual defect. The
 * magic numbers were its symptom, and re-tuning them by hand would re-break the
 * moment a label grows.
 *
 * So: the viewBox is declared once, here. A widget declares its own LOCAL extent —
 * how far its ink reaches around its own origin — and asks to be anchored. The
 * position becomes arithmetic, and "does it fit" becomes a deterministic assertion
 * that needs no browser.
 *
 * ON EXTENTS BEING APPROXIMATE
 * Text ink cannot be known exactly without font metrics, which are not available at
 * build time. A middle-anchored monospace glyph is modelled below from its font
 * size. These are declared ALLOWANCES, deliberately generous, not measurements. The
 * safe inset exists so that being slightly wrong is still not a clipped glyph. A
 * runtime placement check is the thing that would prove exactness; this module's job
 * is to stop the class of error at authoring time.
 */

/**
 * WorldMap's viewBox, and the DEFAULT for anchored widgets — not the only one.
 * GoldCountryExplore mounts MapCompass inside `viewBox="0 0 100 75"`. The anchor is
 * correct in both hosts today only because the widths coincide; a host with a
 * different width would silently mis-anchor. Anchored widgets therefore take the
 * host's viewBox as a parameter rather than assuming this one.
 */
export const MAP_VIEWBOX = { width: 100, height: 62.5 } as const

/**
 * Intentional design keep-out from the viewBox edge — visual breathing room, nothing
 * more. It is deliberately NOT the place where modelling error goes to hide.
 *
 * The first version of this file had a single `MAP_SAFE_INSET = 2` doing both jobs,
 * and that is exactly why a 12% glyph-ascent underestimate shipped invisibly: the
 * margin quietly ate it and review saw green. An inset big enough to be safe is big
 * enough to conceal the next modelling bug, so the two are now separate and the
 * tolerance is asserted small.
 */
export const MAP_MARGIN = 2

/**
 * Allowance for residual error in the glyph metric model. Asserted to stay small in
 * mapCompass.test.ts. If a metric correction ever needs more than this, the model is
 * wrong and must be fixed — not absorbed.
 */
export const MODEL_TOLERANCE = 0.05

/** Total inset used when anchoring: design margin plus the small model allowance. */
export const MAP_SAFE_INSET = MAP_MARGIN + MODEL_TOLERANCE

/**
 * Padding for the `.map-compass` bob.
 *
 * globals.css: `@keyframes compass-bob { 0%,100% { translateY(0) } 50% { translateY(0.3px) } }`
 *
 * Two honest caveats. First, the motion is VERTICAL and DOWNWARD-ONLY, so padding all
 * four sides (as the first version did) shifted the anchor left for no reason. Second,
 * the keyframe is written in `px` while this file works in user units; on this map one
 * user unit is roughly eight CSS px, so 0.3px is nearer 0.04 user units than 0.3.
 * The pad below is therefore an over-allowance, kept because over-allowing motion is
 * cheap and it is honest about not having measured the conversion. It is NOT
 * mechanically linked to the CSS — nothing fails if the keyframe changes, which is a
 * real remaining gap.
 */
export const BOB_PAD = { top: 0, bottom: 0.3, left: 0, right: 0 } as const

/**
 * Monospace glyph box as a fraction of font-size. Half-advance is horizontal reach
 * from a middle-anchored origin; ascent/descent are vertical reach from the baseline.
 *
 * These are MEASURED, not guessed. The first version of this file estimated
 * {halfAdvance: 0.35, ascent: 0.85, descent: 0.25} and a browser `getBBox()` sweep
 * over the glyphs this component actually draws showed the estimate was wrong:
 * ascent really reaches 0.95 (a 12% underestimate), while halfAdvance (0.349 for W)
 * and descent (0.25) sat exactly on the boundary — margins that existed only on
 * paper. MAP_SAFE_INSET was absorbing the error, so nothing clipped, which is
 * precisely how this kind of mistake survives review.
 *
 * Worst observed over N W E S + at font sizes 1.2 / 1.6 / 2 / 2.5 (Chromium,
 * generic `monospace`): halfAdvance 0.349, ascent 0.950, descent 0.250.
 * Values below add headroom on top of that. GLYPH_OBSERVED records what was seen so
 * mapCompass.test.ts can fail if anyone tightens the model back below reality.
 */
export const GLYPH = { halfAdvance: 0.40, ascent: 1.05, descent: 0.32 } as const

/** Worst ink actually measured in a browser. The model must never dip below this. */
export const GLYPH_OBSERVED = { halfAdvance: 0.349, ascent: 0.950, descent: 0.250 } as const

/** How far a widget's ink reaches from its own local origin. */
export interface LocalExtent {
  left: number
  right: number
  top: number
  bottom: number
}

/** Bold widens the advance. Unmodelled in the first version; the ornate N is bold. */
export const BOLD_ADVANCE_FACTOR = 1.15

/** Extent of a middle-anchored text glyph drawn at (x, baselineY). */
export function glyphExtent(x: number, baselineY: number, fontSize: number, bold = false): LocalExtent {
  const half = fontSize * GLYPH.halfAdvance * (bold ? BOLD_ADVANCE_FACTOR : 1)
  return {
    left: x - half,
    right: x + half,
    top: baselineY - fontSize * GLYPH.ascent,
    bottom: baselineY + fontSize * GLYPH.descent,
  }
}

/** Extent of a stroked circle. Stroke straddles the path, so half sits outside. */
export function circleExtent(cx: number, cy: number, r: number, strokeWidth = 0): LocalExtent {
  const reach = r + strokeWidth / 2
  return { left: cx - reach, right: cx + reach, top: cy - reach, bottom: cy + reach }
}

/** Grow an extent per-side — for motion that only travels one way. */
export function padExtentAsymmetric(
  e: LocalExtent,
  pad: { top: number; bottom: number; left: number; right: number },
): LocalExtent {
  return {
    left: e.left - pad.left,
    right: e.right + pad.right,
    top: e.top - pad.top,
    bottom: e.bottom + pad.bottom,
  }
}

/** Smallest extent containing all of them. */
export function unionExtents(parts: LocalExtent[]): LocalExtent {
  if (parts.length === 0) throw new Error('unionExtents: need at least one extent')
  return parts.reduce((a, b) => ({
    left: Math.min(a.left, b.left),
    right: Math.max(a.right, b.right),
    top: Math.min(a.top, b.top),
    bottom: Math.max(a.bottom, b.bottom),
  }))
}

/** Grow an extent on every side — e.g. to allow for an animation's travel. */
export function padExtent(e: LocalExtent, pad: number): LocalExtent {
  return { left: e.left - pad, right: e.right + pad, top: e.top - pad, bottom: e.bottom + pad }
}

/**
 * Place a widget so its ink sits flush against the top-right safe boundary.
 * Returns the translate() the widget's positioning wrapper should carry.
 */
export function anchorTopRight(
  extent: LocalExtent,
  view: { width: number; height: number } = MAP_VIEWBOX,
  inset: number = MAP_SAFE_INSET,
): { x: number; y: number } {
  return {
    x: view.width - inset - extent.right,
    y: inset - extent.top,
  }
}

/** Where a widget's ink actually lands once anchored, in viewBox coordinates. */
export function placedBounds(extent: LocalExtent, at: { x: number; y: number }): LocalExtent {
  return {
    left: at.x + extent.left,
    right: at.x + extent.right,
    top: at.y + extent.top,
    bottom: at.y + extent.bottom,
  }
}

/** Does the placed ink stay inside the viewBox, respecting the inset? */
export function fitsWithinSafeArea(
  bounds: LocalExtent,
  view: { width: number; height: number } = MAP_VIEWBOX,
  inset: number = MAP_SAFE_INSET,
): { ok: boolean; overflow: Partial<Record<'left' | 'right' | 'top' | 'bottom', number>> } {
  const overflow: Partial<Record<'left' | 'right' | 'top' | 'bottom', number>> = {}
  if (bounds.left < inset) overflow.left = inset - bounds.left
  if (bounds.right > view.width - inset) overflow.right = bounds.right - (view.width - inset)
  if (bounds.top < inset) overflow.top = inset - bounds.top
  if (bounds.bottom > view.height - inset) overflow.bottom = bounds.bottom - (view.height - inset)
  return { ok: Object.keys(overflow).length === 0, overflow }
}

/** Format a translate() for an SVG transform attribute, rounded to keep the DOM tidy. */
export function translate(at: { x: number; y: number }): string {
  const r = (n: number) => Math.round(n * 100) / 100
  return `translate(${r(at.x)}, ${r(at.y)})`
}
