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
    // Text-only cross
    return (
      <g className="map-compass" transform="translate(92, 5)">
        <text x="4" y="3" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">N</text>
        <text x="0" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">W</text>
        <text x="4" y="6.5" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="2" fontFamily="monospace">+</text>
        <text x="8" y="6.5" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">E</text>
        <text x="4" y="10" textAnchor="middle" fill="var(--pixel-ui-text)" fontSize="2.5" fontFamily="monospace">S</text>
      </g>
    )
  }

  if (isClassic) {
    // Simple 4-point compass
    return (
      <g className="map-compass" transform="translate(92, 3)">
        <circle cx="4" cy="5" r="4" fill="none" stroke="var(--pixel-ui-border)" strokeWidth="0.3" opacity="0.5" />
        {/* Cardinal points */}
        <line x1="4" y1="1.5" x2="4" y2="3" stroke="var(--pixel-ui-text)" strokeWidth="0.4" />
        <line x1="4" y1="7" x2="4" y2="8.5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        <line x1="0.5" y1="5" x2="2" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        <line x1="6" y1="5" x2="7.5" y2="5" stroke="var(--pixel-ui-text)" strokeWidth="0.3" />
        {/* N label */}
        <text x="4" y="1" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="1.8" fontFamily="monospace">N</text>
      </g>
    )
  }

  // Enhanced/Modern/Ultra: ornate compass
  const compassSize = 5
  const cx = 4
  const cy = 5

  return (
    <g className="map-compass" transform="translate(90, 2)">
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

      {/* Subtle bob animation for ultra */}
      {isUltra && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values="90,2;90,2.3;90,2"
          dur="6s"
          repeatCount="indefinite"
        />
      )}
    </g>
  )
}

export default MapCompass
