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

/** The main map SVG's viewBox. WorldMap.tsx renders from this — do not re-declare it. */
export const MAP_VIEWBOX = { width: 100, height: 62.5 } as const

/**
 * Keep-out band inside the viewBox edge. Absorbs font-metric approximation and the
 * `compass-bob` keyframe, which translates by 0.3 user units.
 */
export const MAP_SAFE_INSET = 2

/** Vertical travel of the `.map-compass` bob keyframe, in user units. */
export const BOB_AMPLITUDE = 0.3

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

/** Extent of a middle-anchored text glyph drawn at (x, baselineY). */
export function glyphExtent(x: number, baselineY: number, fontSize: number): LocalExtent {
  const half = fontSize * GLYPH.halfAdvance
  return {
    left: x - half,
    right: x + half,
    top: baselineY - fontSize * GLYPH.ascent,
    bottom: baselineY + fontSize * GLYPH.descent,
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
