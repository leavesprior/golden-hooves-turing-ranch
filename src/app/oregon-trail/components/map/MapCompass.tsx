'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'

interface MapCompassProps {
  graphicsTier: GraphicsTier
}

export function MapCompass({ graphicsTier }: MapCompassProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isClassic = graphicsTier === 'classic_8bit'
  const isUltra = graphicsTier === 'ultra_64bit'
  const highDetail = graphicsTier === 'modern_32bit' || isUltra

  if (isRetro) {
    // Text-only cross.
    // NOTE: the positioning transform MUST live on an outer <g> that carries no
    // animated class. `.map-compass` runs a CSS `transform: translateY(...)`
    // keyframe, and a CSS transform REPLACES the SVG transform presentation
    // attribute rather than composing with it — putting both on one element
    // silently discarded translate(92,5) and parked the compass in the
    // top-left corner over the chapter title. Position outside, animate inside.
    // x=88 not 92: the rose spans local x 0..8, so 92 put E at exactly 100 —
    // the viewBox's right edge — and the glyph was clipped by the map border.
    return (
      <g transform="translate(88, 5)">
        <g className="map-compass">
          <text x="4" y="3" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">N</text>
          <text x="0" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">W</text>
          <text x="4" y="6.5" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="2" fontFamily="monospace">+</text>
          <text x="8" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">E</text>
          <text x="4" y="10" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">S</text>
        </g>
      </g>
    )
  }

  if (isClassic) {
    // Simple 4-point compass
    // x=88: circle spans local 0..8, so 92 ran flush to the viewBox edge.
    return (
      <g transform="translate(88, 3)">
        <g className="map-compass">
        <circle cx="4" cy="5" r="4" fill="none" stroke="var(--pixel-ui-border)" strokeWidth="0.3" opacity="0.5" />
        {/* Cardinal points */}
        <line x1="4" y1="1.5" x2="4" y2="3" stroke="var(--pixel-ui-text)" strokeWidth="0.4" />
        <line x1="4" y1="7" x2="4" y2="8.5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        <line x1="0.5" y1="5" x2="2" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        <line x1="6" y1="5" x2="7.5" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        {/* N label */}
        <text x="4" y="1" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="1.8" fontFamily="monospace">N</text>
        </g>
      </g>
    )
  }

  // Enhanced/Modern/Ultra: ornate compass
  const compassSize = 5
  const cx = 4
  const cy = 5

  // x=86: the E/W labels sit at cx±(compassSize+1) = local -2..10, so 90 pushed
  // the E label to exactly 100 and the border clipped it.
  return (
    <g transform="translate(86, 2)">
      <g className="map-compass">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={compassSize} fill="rgba(15,15,27,0.6)" stroke="var(--pixel-ui-border)" strokeWidth="0.3" />

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
      <text x={cx} y={cy - compassSize - 0.5} textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="1.6" fontFamily="monospace" fontWeight="bold">N</text>
      {highDetail && (
        <>
          <text x={cx} y={cy + compassSize + 1.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="1.2" fontFamily="monospace" opacity="0.6">S</text>
          <text x={cx - compassSize - 1} y={cy + 0.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="1.2" fontFamily="monospace" opacity="0.6">W</text>
          <text x={cx + compassSize + 1} y={cy + 0.5} textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="1.2" fontFamily="monospace" opacity="0.6">E</text>
        </>
      )}

      </g>
    </g>
  )
}
// The ultra tier previously carried a SMIL <animateTransform> duplicating the
// same 6s bob the `.map-compass` CSS keyframe already applies to every tier.
// It also hard-coded absolute values ("90,2") which, now that positioning lives
// on the outer <g>, would translate a second time. Removed as redundant.

export default MapCompass
