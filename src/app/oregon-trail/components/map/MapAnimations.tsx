'use client'

import React, { useMemo } from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type ChapterType } from '../../data/worldMaps'
import { getPathControlPoints, buildConnectionPath } from './terrainData'

interface TravelAnimationState {
  active: boolean
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  targetLocationId: string
}

interface MapAnimationsProps {
  travelAnimation: TravelAnimationState
  scoutingLocation: string | null
  graphicsTier: GraphicsTier
  chapter: ChapterType
  // Location coords for scouting sparkle
  locationCoords?: Map<string, { x: number; y: number }>
}

export function MapAnimations({
  travelAnimation,
  scoutingLocation,
  graphicsTier,
  locationCoords,
}: MapAnimationsProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isUltra = graphicsTier === 'ultra_64bit'
  const highDetail = graphicsTier === 'modern_32bit' || isUltra

  // Travel path for animateMotion
  const travelPath = useMemo(() => {
    if (!travelAnimation.active) return null

    // Try to find Bezier control points for this connection
    const controlPoints = getPathControlPoints(
      travelAnimation.targetLocationId,
      '' // We don't have fromId easily, so build a direct path
    )

    return buildConnectionPath(
      travelAnimation.fromX, travelAnimation.fromY,
      travelAnimation.toX, travelAnimation.toY,
      controlPoints,
      graphicsTier,
    )
  }, [travelAnimation, graphicsTier])

  // Scouting sparkle position
  const scoutCoords = scoutingLocation && locationCoords?.get(scoutingLocation)

  return (
    <g className="map-animations">
      {/* Travel: player position indicator along path */}
      {travelAnimation.active && (
        <g>
          {/* Travel trail */}
          {!isRetro && travelPath && (
            <path
              d={travelPath}
              fill="none"
              stroke="var(--pixel-gold-light)"
              strokeWidth="1"
              strokeDasharray="2,1"
              opacity="0.6"
              className="map-path-active"
            />
          )}

          {/* Player dot during travel */}
          <circle
            cx={travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * travelAnimation.progress}
            cy={travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * travelAnimation.progress}
            r={isRetro ? 1.5 : 2}
            fill="var(--pixel-gold-light)"
            filter={isRetro ? undefined : 'url(#filter-gold-glow)'}
          />

          {/* "Traveling..." label */}
          {!isRetro && (
            <text
              x={travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * travelAnimation.progress}
              y={travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * travelAnimation.progress - 3}
              textAnchor="middle"
              fill="var(--pixel-gold-light)"
              fontSize="2"
              fontFamily="monospace"
              opacity="0.8"
            >
              Traveling...
            </text>
          )}
        </g>
      )}

      {/* Scouting reveal animation */}
      {scoutCoords && (
        <g>
          {/* Expanding ring */}
          <circle
            cx={scoutCoords.x}
            cy={scoutCoords.y}
            r="0"
            fill="none"
            stroke="#d4a843"
            strokeWidth="0.5"
            opacity="0"
            className="map-scout-ripple"
          >
            <animate attributeName="r" from="0" to="6" dur="1.2s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" fill="freeze" />
          </circle>

          {/* Sparkle at center */}
          {highDetail && (
            <>
              {[0, 60, 120, 180, 240, 300].map(angle => {
                const rad = (angle * Math.PI) / 180
                return (
                  <line
                    key={angle}
                    x1={scoutCoords.x}
                    y1={scoutCoords.y}
                    x2={scoutCoords.x + Math.cos(rad) * 2}
                    y2={scoutCoords.y + Math.sin(rad) * 2}
                    stroke="#f4d76b"
                    strokeWidth="0.3"
                    opacity="0"
                  >
                    <animate attributeName="opacity" values="0;1;0" dur="0.6s" begin="0.3s" fill="freeze" />
                    <animate
                      attributeName="x2"
                      from={String(scoutCoords.x + Math.cos(rad) * 1)}
                      to={String(scoutCoords.x + Math.cos(rad) * 3)}
                      dur="0.6s" begin="0.3s" fill="freeze"
                    />
                    <animate
                      attributeName="y2"
                      from={String(scoutCoords.y + Math.sin(rad) * 1)}
                      to={String(scoutCoords.y + Math.sin(rad) * 3)}
                      dur="0.6s" begin="0.3s" fill="freeze"
                    />
                  </line>
                )
              })}
            </>
          )}
        </g>
      )}
    </g>
  )
}

export default MapAnimations
