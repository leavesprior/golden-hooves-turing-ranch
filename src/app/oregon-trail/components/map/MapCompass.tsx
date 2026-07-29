'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import {
  BOB_AMPLITUDE,
  anchorTopRight,
  glyphExtent,
  padExtent,
  translate,
  unionExtents,
  type LocalExtent,
} from './mapViewport'

interface MapCompassProps {
  graphicsTier: GraphicsTier
}

/**
 * POSITIONING CONTRACT — read before changing any coordinate in this file.
 *
 * 1. Position lives on an OUTER <g> that carries no animated class. `.map-compass`
 *    runs a CSS `transform: translateY()` keyframe, and in SVG2 a CSS transform
 *    REPLACES the transform presentation attribute rather than composing with it.
 *    Putting both on one element silently discarded the translate and parked the
 *    compass in the top-left corner over the chapter title.
 *
 * 2. The outer translate is DERIVED, never typed. Each tier declares how far its
 *    ink reaches from its own origin; `anchorTopRight` turns that into a position.
 *    Hand-tuned constants were wrong twice: `92` clipped the E glyph against the
 *    viewBox edge, and the replacement `88` was only right for today's label sizes.
 *    Change a font size or add a label and the anchor follows automatically.
 *
 * 3. Extents are padded by the bob amplitude, because the thing that moves must
 *    still fit at the extreme of its motion, not only at rest.
 *
 * mapCompass.test.ts asserts every tier lands inside the safe area. That test is
 * pure arithmetic — if you change geometry here and it still passes, the compass
 * still fits.
 */

// ── Retro: text-only cross ──────────────────────────────────────────────────
const RETRO_FONT = 2.5
const RETRO_PLUS_FONT = 2
const retroGlyphs: LocalExtent[] = [
  glyphExtent(4, 3, RETRO_FONT),          // N
  glyphExtent(0, 6.5, RETRO_FONT),        // W
  glyphExtent(4, 6.5, RETRO_PLUS_FONT),   // +
  glyphExtent(8, 6.5, RETRO_FONT),        // E
  glyphExtent(4, 10, RETRO_FONT),         // S
]
export const RETRO_EXTENT = padExtent(unionExtents(retroGlyphs), BOB_AMPLITUDE)

// ── Classic: ring + N label ─────────────────────────────────────────────────
const CLASSIC_CX = 4
const CLASSIC_CY = 5
const CLASSIC_R = 4
const CLASSIC_STROKE = 0.3
const CLASSIC_FONT = 1.8
export const CLASSIC_EXTENT = padExtent(
  unionExtents([
    {
      left: CLASSIC_CX - CLASSIC_R - CLASSIC_STROKE,
      right: CLASSIC_CX + CLASSIC_R + CLASSIC_STROKE,
      top: CLASSIC_CY - CLASSIC_R - CLASSIC_STROKE,
      bottom: CLASSIC_CY + CLASSIC_R + CLASSIC_STROKE,
    },
    glyphExtent(CLASSIC_CX, 1, CLASSIC_FONT), // N sits above the ring
  ]),
  BOB_AMPLITUDE,
)

// ── Enhanced / Modern / Ultra: ornate rose ──────────────────────────────────
const ORNATE_SIZE = 5
const ORNATE_CX = 4
const ORNATE_CY = 5
const ORNATE_STROKE = 0.3
const ORNATE_N_FONT = 1.6
const ORNATE_LABEL_FONT = 1.2
export const ORNATE_EXTENT = padExtent(
  unionExtents([
    {
      left: ORNATE_CX - ORNATE_SIZE - ORNATE_STROKE,
      right: ORNATE_CX + ORNATE_SIZE + ORNATE_STROKE,
      top: ORNATE_CY - ORNATE_SIZE - ORNATE_STROKE,
      bottom: ORNATE_CY + ORNATE_SIZE + ORNATE_STROKE,
    },
    glyphExtent(ORNATE_CX, ORNATE_CY - ORNATE_SIZE - 0.5, ORNATE_N_FONT),          // N
    // The S/W/E labels only render at highDetail, but the extent is deliberately
    // computed for the widest case so every tier shares one anchor and a tier
    // switch can never move the rose into the border.
    glyphExtent(ORNATE_CX, ORNATE_CY + ORNATE_SIZE + 1.5, ORNATE_LABEL_FONT),      // S
    glyphExtent(ORNATE_CX - ORNATE_SIZE - 1, ORNATE_CY + 0.5, ORNATE_LABEL_FONT),  // W
    glyphExtent(ORNATE_CX + ORNATE_SIZE + 1, ORNATE_CY + 0.5, ORNATE_LABEL_FONT),  // E
  ]),
  BOB_AMPLITUDE,
)

export function extentForTier(tier: GraphicsTier): LocalExtent {
  if (tier === 'retro_4bit') return RETRO_EXTENT
  if (tier === 'classic_8bit') return CLASSIC_EXTENT
  return ORNATE_EXTENT
}

export function MapCompass({ graphicsTier }: MapCompassProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isClassic = graphicsTier === 'classic_8bit'
  const isUltra = graphicsTier === 'ultra_64bit'
  const highDetail = graphicsTier === 'modern_32bit' || isUltra

  const at = anchorTopRight(extentForTier(graphicsTier))

  if (isRetro) {
    return (
      <g transform={translate(at)}>
        <g className="map-compass">
          <text x="4" y="3" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={RETRO_FONT} fontFamily="monospace">N</text>
          <text x="0" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={RETRO_FONT} fontFamily="monospace">W</text>
          <text x="4" y="6.5" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize={RETRO_PLUS_FONT} fontFamily="monospace">+</text>
          <text x="8" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={RETRO_FONT} fontFamily="monospace">E</text>
          <text x="4" y="10" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={RETRO_FONT} fontFamily="monospace">S</text>
        </g>
      </g>
    )
  }

  if (isClassic) {
    return (
      <g transform={translate(at)}>
        <g className="map-compass">
          <circle cx={CLASSIC_CX} cy={CLASSIC_CY} r={CLASSIC_R} fill="none" stroke="var(--pixel-ui-border)" strokeWidth={CLASSIC_STROKE} opacity="0.5" />
          {/* Cardinal points */}
          <line x1="4" y1="1.5" x2="4" y2="3" stroke="var(--pixel-ui-text)" strokeWidth="0.4" />
          <line x1="4" y1="7" x2="4" y2="8.5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
          <line x1="0.5" y1="5" x2="2" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
          <line x1="6" y1="5" x2="7.5" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
          {/* N label */}
          <text x={CLASSIC_CX} y="1" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize={CLASSIC_FONT} fontFamily="monospace">N</text>
        </g>
      </g>
    )
  }

  const compassSize = ORNATE_SIZE
  const cx = ORNATE_CX
  const cy = ORNATE_CY

  return (
    <g transform={translate(at)}>
      <g className="map-compass">
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={compassSize} fill="rgba(15,15,27,0.6)" stroke="var(--pixel-ui-border)" strokeWidth={ORNATE_STROKE} />

        {/* Inner ring */}
        {highDetail && (
          <circle cx={cx} cy={cy} r={compassSize - 1} fill="none" stroke="var(--pixel-ui-text)" strokeWidth="0.15" opacity="0.3" />
        )}

        {/* Cardinal points - N is emphasized */}
        <polygon points={`${cx},${cy - compassSize + 0.8} ${cx - 0.6},${cy - 1} ${cx + 0.6},${cy - 1}`} fill="var(--pixel-fire-orange)" />
        <polygon points={`${cx},${cy + compassSize - 0.8} ${cx - 0.5},${cy + 1} ${cx + 0.5},${cy + 1}`} fill="var(--pixel-ui-text)" opacity="0.5" />
        <polygon points={`${cx - compassSize + 0.8},${cy} ${cx - 1},${cy - 0.5} ${cx - 1},${cy + 0.5}`} fill="var(--pixel-ui-text)" opacity="0.5" />
        <polygon points={`${cx + compassSize - 0.8},${cy} ${cx + 1},${cy - 0.5} ${cx + 1},${cy + 0.5}`} fill="var(--pixel-ui-text)" opacity="0.5" />

        {/* Ordinal points for 8-point compass (ultra) */}
        {isUltra && (
          <>
            {[45, 135, 225, 315].map(angle => {
              const rad = (angle * Math.PI) / 180
              const x1 = cx + Math.cos(rad) * 2
              const y1 = cy - Math.sin(rad) * 2
              const x2 = cx + Math.cos(rad) * (compassSize - 0.5)
              const y2 = cy - Math.sin(rad) * (compassSize - 0.5)
              return (
                <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--pixel-ui-text)" strokeWidth="0.2" opacity="0.4" />
              )
            })}
          </>
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="0.5" fill="var(--pixel-gold-light)" />

        {/* Labels */}
        <text x={cx} y={cy - compassSize - 0.5} textAnchor="middle" fill="var(--pixel-gold-light)" fontSize={ORNATE_N_FONT} fontFamily="monospace" fontWeight="bold">N</text>
        {highDetail && (
          <>
            <text x={cx} y={cy + compassSize + 1.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={ORNATE_LABEL_FONT} fontFamily="monospace" opacity="0.6">S</text>
            <text x={cx - compassSize - 1} y={cy + 0.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={ORNATE_LABEL_FONT} fontFamily="monospace" opacity="0.6">W</text>
            <text x={cx + compassSize + 1} y={cy + 0.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize={ORNATE_LABEL_FONT} fontFamily="monospace" opacity="0.6">E</text>
          </>
        )}
      </g>
    </g>
  )
}

// The ultra tier previously carried a SMIL <animateTransform> duplicating the same
// 6s bob the `.map-compass` CSS keyframe already applies to every tier. It also
// hard-coded absolute values ("90,2") which, now that positioning lives on the outer
// <g>, would translate a second time. Removed as redundant.

export default MapCompass
