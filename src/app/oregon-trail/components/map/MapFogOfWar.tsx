'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type MapLocation } from '../../data/worldMaps'

interface MapFogOfWarProps {
  locations: MapLocation[]
  discoveredLocations: Set<string>
  scoutableLocations: Set<string>
  scoutingLocation: string | null
  graphicsTier: GraphicsTier
}

export function MapFogOfWar({
  locations,
  discoveredLocations,
  scoutableLocations,
  scoutingLocation,
  graphicsTier,
}: MapFogOfWarProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isClassic = graphicsTier === 'classic_8bit'
  const isUltra = graphicsTier === 'ultra_64bit'

  // Fog radius in viewBox units
  const fogRadius = isRetro ? 6 : 5

  // Build mask: white = visible, gray = scoutable (dimmer), black = hidden
  const maskId = 'fog-of-war-mask'

  return (
    <g className="map-fog-of-war">
      <defs>
        <mask id={maskId}>
          {/* Start with full black (everything hidden) */}
          <rect x="0" y="0" width="100" height="100" fill="black" />

          {/* White circles for discovered locations (fully visible) */}
          {locations.map(loc => {
            if (!discoveredLocations.has(loc.id)) return null
            return (
              <circle
                key={`fog-d-${loc.id}`}
                cx={loc.x}
                cy={loc.y}
                r={fogRadius + 2}
                fill="white"
                filter={isRetro ? undefined : 'url(#filter-fog-blur)'}
              />
            )
          })}

          {/* Gray circles for scoutable locations (partially visible) */}
          {locations.map(loc => {
            if (discoveredLocations.has(loc.id)) return null
            if (!scoutableLocations.has(loc.id)) return null
            const isBeingScouted = scoutingLocation === loc.id
            return (
              <circle
                key={`fog-s-${loc.id}`}
                cx={loc.x}
                cy={loc.y}
                r={isBeingScouted ? fogRadius + 1 : fogRadius - 1}
                fill={isBeingScouted ? '#ccc' : '#666'}
                filter={isRetro ? undefined : 'url(#filter-fog-blur)'}
              >
                {isBeingScouted && !isRetro && (
                  <animate
                    attributeName="r"
                    from={String(fogRadius - 1)}
                    to={String(fogRadius + 2)}
                    dur="1.2s"
                    fill="freeze"
                  />
                )}
                {isBeingScouted && !isRetro && (
                  <animate
                    attributeName="fill"
                    from="#666"
                    to="white"
                    dur="1.2s"
                    fill="freeze"
                  />
                )}
              </circle>
            )
          })}
        </mask>
      </defs>

      {/* The fog overlay: a dark rectangle masked to reveal discovered areas */}
      <rect
        x="0" y="0"
        width="100" height="100"
        fill={isRetro ? '#0f0f1b' : 'rgba(15, 15, 27, 0.85)'}
        mask={`url(#${maskId})`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Ultra tier: animated fog wisps at mask edges */}
      {isUltra && locations.filter(loc => scoutableLocations.has(loc.id) && !discoveredLocations.has(loc.id)).map(loc => (
        <circle
          key={`fog-wisp-${loc.id}`}
          cx={loc.x}
          cy={loc.y}
          r={fogRadius}
          fill="none"
          stroke="rgba(15, 15, 27, 0.3)"
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
          className="map-fog-wisp"
        >
          <animate
            attributeName="r"
            values={`${fogRadius - 1};${fogRadius + 1};${fogRadius - 1}`}
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.3;0.1;0.3"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  )
}

export default MapFogOfWar
