'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import {
  BOB_PAD,
  MAP_VIEWBOX,
  anchorTopRight,
  circleExtent,
  glyphExtent,
  padExtentAsymmetric,
  translate,
  unionExtents,
  type LocalExtent,
} from './mapViewport'

interface MapCompassProps {
  graphicsTier: GraphicsTier
  /**
   * The host SVG's viewBox. NOT optional-by-accident: WorldMap is 100x62.5 while
   * GoldCountryExplore mounts this same component in 100x75. The anchor was only
   * correct in both because the widths happen to match — a silent trap the moment
   * one host changes width. Callers pass their own.
   */
  view?: { width: number; height: number }
}

/**
 * POSITIONING CONTRACT — read before changing any coordinate in this file.
 *
 * 1. Position lives on an OUTER <g> that carries no animated class. `.map-compass`
 *    runs a CSS `transform: translateY()` keyframe, and in SVG2 a CSS transform
 *    REPLACES the transform presentation attribute rather than composing with it.
 *    Both on one element silently discarded the translate and parked the compass in
 *    the top-left corner over the chapter title.
 *
 * 2. The outer translate is DERIVED from the geometry tables below, never typed.
 *    Hand-tuned constants were wrong twice: `92` clipped the E glyph against the
 *    viewBox edge, and its replacement `88` was right only for one set of labels.
 *
 * 3. ONE TABLE FEEDS BOTH THE DRAW AND THE EXTENT. This is the important part and
 *    it was wrong in the first version of this file: the extents were a second,
 *    hand-maintained copy of the coordinates. A reviewer proved it by moving the
 *    drawn E from x=8 to x=11 and leaving the extent table alone — the suite still
 *    reported "fits" while the ink overflowed by 3 units. That is the same
 *    dual-source defect as the original bug, one level down, and "keep them in
 *    sync by discipline" is precisely how 92 and 88 shipped. So the JSX now maps
 *    over the same arrays the extent is computed from. Moving a glyph moves both.
 *
 * What the arithmetic test can and cannot prove: it proves the derived anchor keeps
 * the MODELLED ink inside the safe area, and (since the tables are shared) that the
 * model tracks the draw. It does NOT prove the glyph metric model matches the real
 * font — see GLYPH / GLYPH_OBSERVED in mapViewport.ts, which is still a hand-copied
 * browser measurement and remains the weakest link here.
 */

interface Glyph { ch: string; x: number; y: number; size: number; fill: string; bold?: boolean; opacity?: number }

// ── Retro: text-only cross ──────────────────────────────────────────────────
const RETRO_FONT = 2.5
const INK = 'var(--pixel-ui-text)'
const GOLD = 'var(--pixel-gold-light)'

const RETRO_GLYPHS: readonly Glyph[] = [
  { ch: 'N', x: 4, y: 3, size: RETRO_FONT, fill: INK },
  { ch: 'W', x: 0, y: 6.5, size: RETRO_FONT, fill: INK },
  { ch: '+', x: 4, y: 6.5, size: 2, fill: GOLD },
  { ch: 'E', x: 8, y: 6.5, size: RETRO_FONT, fill: INK },
  { ch: 'S', x: 4, y: 10, size: RETRO_FONT, fill: INK },
]

// ── Classic: ring + N label ─────────────────────────────────────────────────
const CLASSIC = { cx: 4, cy: 5, r: 4, stroke: 0.3 } as const
const CLASSIC_GLYPHS: readonly Glyph[] = [
  { ch: 'N', x: CLASSIC.cx, y: 1, size: 1.8, fill: GOLD },
]

// ── Enhanced / Modern / Ultra: ornate rose ──────────────────────────────────
const ORNATE = { cx: 4, cy: 5, size: 5, stroke: 0.3 } as const
/**
 * Computed for the WIDEST case. S/W/E only render at highDetail, so the
 * enhanced_16bit rose is anchored as if it drew labels it does not. Deliberate: one
 * stable anchor across every ornate tier means a tier switch can never jump the rose
 * into the border. It costs a little empty air at enhanced. This is a stable-anchor
 * decision, NOT a claim of accurate ink per tier.
 */
const ORNATE_GLYPHS: readonly Glyph[] = [
  { ch: 'N', x: ORNATE.cx, y: ORNATE.cy - ORNATE.size - 0.5, size: 1.6, fill: GOLD, bold: true },
  { ch: 'S', x: ORNATE.cx, y: ORNATE.cy + ORNATE.size + 1.5, size: 1.2, fill: INK, opacity: 0.6 },
  { ch: 'W', x: ORNATE.cx - ORNATE.size - 1, y: ORNATE.cy + 0.5, size: 1.2, fill: INK, opacity: 0.6 },
  { ch: 'E', x: ORNATE.cx + ORNATE.size + 1, y: ORNATE.cy + 0.5, size: 1.2, fill: INK, opacity: 0.6 },
]

/** Extent of a glyph table, honouring bold's wider advance. */
function glyphsExtent(glyphs: readonly Glyph[]): LocalExtent {
  return unionExtents(glyphs.map(g => glyphExtent(g.x, g.y, g.size, g.bold)))
}

export const RETRO_EXTENT = padExtentAsymmetric(glyphsExtent(RETRO_GLYPHS), BOB_PAD)
export const CLASSIC_EXTENT = padExtentAsymmetric(
  unionExtents([circleExtent(CLASSIC.cx, CLASSIC.cy, CLASSIC.r, CLASSIC.stroke), glyphsExtent(CLASSIC_GLYPHS)]),
  BOB_PAD,
)
export const ORNATE_EXTENT = padExtentAsymmetric(
  unionExtents([circleExtent(ORNATE.cx, ORNATE.cy, ORNATE.size, ORNATE.stroke), glyphsExtent(ORNATE_GLYPHS)]),
  BOB_PAD,
)

export function extentForTier(tier: GraphicsTier): LocalExtent {
  if (tier === 'retro_4bit') return RETRO_EXTENT
  if (tier === 'classic_8bit') return CLASSIC_EXTENT
  return ORNATE_EXTENT
}

function Glyphs({ glyphs }: { glyphs: readonly Glyph[] }) {
  return (
    <>
      {glyphs.map(g => (
        <text
          key={`${g.ch}-${g.x}-${g.y}`}
          x={g.x} y={g.y}
          textAnchor="middle"
          fill={g.fill}
          fontSize={g.size}
          fontFamily="monospace"
          fontWeight={g.bold ? 'bold' : undefined}
          opacity={g.opacity}
        >{g.ch}</text>
      ))}
    </>
  )
}

export function MapCompass({ graphicsTier, view = MAP_VIEWBOX }: MapCompassProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isClassic = graphicsTier === 'classic_8bit'
  const isUltra = graphicsTier === 'ultra_64bit'
  const highDetail = graphicsTier === 'modern_32bit' || isUltra

  const at = anchorTopRight(extentForTier(graphicsTier), view)

  if (isRetro) {
    return (
      <g transform={translate(at)}>
        <g className="map-compass"><Glyphs glyphs={RETRO_GLYPHS} /></g>
      </g>
    )
  }

  if (isClassic) {
    return (
      <g transform={translate(at)}>
        <g className="map-compass">
          <circle cx={CLASSIC.cx} cy={CLASSIC.cy} r={CLASSIC.r} fill="none" stroke="var(--pixel-ui-border)" strokeWidth={CLASSIC.stroke} opacity="0.5" />
          {/* Cardinal ticks — inside the ring, so they never drive the extent */}
          <line x1="4" y1="1.5" x2="4" y2="3" stroke={INK} strokeWidth="0.4" />
          <line x1="4" y1="7" x2="4" y2="8.5" stroke={INK} strokeWidth="0.3" />
          <line x1="0.5" y1="5" x2="2" y2="5" stroke={INK} strokeWidth="0.3" />
          <line x1="6" y1="5" x2="7.5" y2="5" stroke={INK} strokeWidth="0.3" />
          <Glyphs glyphs={CLASSIC_GLYPHS} />
        </g>
      </g>
    )
  }

  const { cx, cy, size } = ORNATE
  return (
    <g transform={translate(at)}>
      <g className="map-compass">
        <circle cx={cx} cy={cy} r={size} fill="rgba(15,15,27,0.6)" stroke="var(--pixel-ui-border)" strokeWidth={ORNATE.stroke} />
        {highDetail && (
          <circle cx={cx} cy={cy} r={size - 1} fill="none" stroke={INK} strokeWidth="0.15" opacity="0.3" />
        )}
        {/* Cardinal points — all inside the background circle, never the extent driver */}
        <polygon points={`${cx},${cy - size + 0.8} ${cx - 0.6},${cy - 1} ${cx + 0.6},${cy - 1}`} fill="var(--pixel-fire-orange)" />
        <polygon points={`${cx},${cy + size - 0.8} ${cx - 0.5},${cy + 1} ${cx + 0.5},${cy + 1}`} fill={INK} opacity="0.5" />
        <polygon points={`${cx - size + 0.8},${cy} ${cx - 1},${cy - 0.5} ${cx - 1},${cy + 0.5}`} fill={INK} opacity="0.5" />
        <polygon points={`${cx + size - 0.8},${cy} ${cx + 1},${cy - 0.5} ${cx + 1},${cy + 0.5}`} fill={INK} opacity="0.5" />
        {isUltra && [45, 135, 225, 315].map(angle => {
          const rad = (angle * Math.PI) / 180
          return (
            <line key={angle}
              x1={cx + Math.cos(rad) * 2} y1={cy - Math.sin(rad) * 2}
              x2={cx + Math.cos(rad) * (size - 0.5)} y2={cy - Math.sin(rad) * (size - 0.5)}
              stroke={INK} strokeWidth="0.2" opacity="0.4" />
          )
        })}
        <circle cx={cx} cy={cy} r="0.5" fill={GOLD} />
        {/* N always; S/W/E only at highDetail — but the extent models all four. */}
        <Glyphs glyphs={highDetail ? ORNATE_GLYPHS : ORNATE_GLYPHS.slice(0, 1)} />
      </g>
    </g>
  )
}

// The ultra tier previously carried a SMIL <animateTransform> duplicating the same
// 6s bob the `.map-compass` CSS keyframe already applies to every tier. It also
// hard-coded absolute values ("90,2") which, now that positioning lives on the outer
// <g>, would translate a second time. Removed as redundant.

export default MapCompass
