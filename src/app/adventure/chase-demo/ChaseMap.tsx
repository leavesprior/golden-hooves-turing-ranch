'use client'

// ChaseMap — a simple SVG map of the Gold Country towns with the chase route
// drawn as a glowing line that extends with each correct hop.
// PROTOTYPE component — not used by the live game.

import React from 'react'
import { TOWNS, MAP_TOWN_IDS } from './chaseData'

interface ChaseMapProps {
  /** Ordered list of town ids the player has correctly reached so far. */
  routeIds: string[]
  /** The town the player is currently standing in. */
  currentId: string
}

export function ChaseMap({ routeIds, currentId }: ChaseMapProps) {
  // Build the polyline points from the confirmed route.
  const routePoints = routeIds
    .map((id) => {
      const t = TOWNS[id]
      return t ? `${t.x},${t.y}` : null
    })
    .filter(Boolean)
    .join(' ')

  return (
    <div className="relative w-full overflow-hidden border-2 border-[var(--pixel-ui-border)] bg-gradient-to-b from-[#2a2418] via-[#1a1c2c] to-black">
      <svg
        viewBox="0 0 100 84"
        className="block w-full"
        role="img"
        aria-label="Map of the chase across Gold Country"
      >
        <defs>
          <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="hereGlow">
            <stop offset="0%" stopColor="#f4d76b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f4d76b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* faint terrain wash — ridgelines hinting at the Sierra */}
        <g opacity="0.18" stroke="#8f6845" strokeWidth="0.4" fill="none">
          <path d="M0,22 Q20,14 40,20 T80,16 100,22" />
          <path d="M0,40 Q25,32 50,38 T100,36" />
          <path d="M0,60 Q30,52 60,58 T100,56" />
        </g>

        {/* the glowing chase route */}
        {routeIds.length > 1 && (
          <polyline
            points={routePoints}
            fill="none"
            stroke="#e8a027"
            strokeWidth="1.1"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="2 1.4"
            filter="url(#trailGlow)"
          />
        )}

        {/* towns */}
        {MAP_TOWN_IDS.map((id) => {
          const t = TOWNS[id]
          if (!t) return null
          const onRoute = routeIds.includes(id)
          const isHere = id === currentId
          return (
            <g key={id}>
              {isHere && <circle cx={t.x} cy={t.y} r="4.5" fill="url(#hereGlow)" />}
              <circle
                cx={t.x}
                cy={t.y}
                r={isHere ? 1.8 : 1.3}
                fill={isHere ? '#f4d76b' : onRoute ? '#e8a027' : '#5c3d2e'}
                stroke={onRoute || isHere ? '#f4d76b' : '#8f6845'}
                strokeWidth="0.4"
              />
              <text
                x={t.x}
                y={t.y - 2.6}
                textAnchor="middle"
                fontSize="2.4"
                fontFamily="var(--font-pixel), monospace"
                fill={isHere ? '#f4d76b' : onRoute ? '#e8a027' : '#8f6845'}
              >
                {t.name}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="absolute bottom-1 right-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/40">
        GOLD COUNTRY
      </p>
    </div>
  )
}
