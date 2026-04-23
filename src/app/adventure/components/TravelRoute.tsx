'use client'

/**
 * TravelRoute — Golden Frog Codex Phase 3.
 *
 * Renders an animated dashed route + walking pixel sprite between two
 * nodes on the SVG overworld map. Two modes:
 *
 *   previewMode = true  → pulse-only dashed line (hover preview, no commit)
 *   previewMode = false → walking sprite marches from → to (commit)
 *
 * Lives INSIDE the <svg viewBox="0 0 100 100"> so all coordinates are in
 * the same 0-100 space as the map. Keep the sprite small (≈2.5 units) so
 * it scales with the map.
 *
 * Colour semantics match travelDanger tiers:
 *   peaceful → --pixel-forest-light (green)
 *   risky    → --pixel-gold-mid     (yellow/amber)
 *   dangerous→ --pixel-fire-red     (red)
 */

import React from 'react'
import type { DangerTier } from '@/app/adventure/lib/travelDanger'

export interface TravelRouteNode {
  id: string
  x: number
  y: number
}

interface TravelRouteProps {
  /** Ordered list of nodes (multi-hop supported). Path length >= 2. */
  path: TravelRouteNode[]
  previewMode: boolean
  tier: DangerTier
  /** Unique key so the sprite animation restarts when the path changes. */
  routeKey?: string
}

const TIER_STROKE: Record<DangerTier, string> = {
  peaceful: 'var(--pixel-forest-light, #34d399)',
  risky: 'var(--pixel-gold-mid, #fbbf24)',
  dangerous: 'var(--pixel-fire-red, #f87171)',
}

const TIER_GLOW: Record<DangerTier, string> = {
  peaceful: 'rgba(52, 211, 153, 0.35)',
  risky: 'rgba(251, 191, 36, 0.35)',
  dangerous: 'rgba(248, 113, 113, 0.4)',
}

export function TravelRoute({
  path,
  previewMode,
  tier,
  routeKey,
}: TravelRouteProps): React.ReactElement | null {
  if (path.length < 2) return null

  const stroke = TIER_STROKE[tier]
  const glow = TIER_GLOW[tier]

  // Build a polyline-style path string through all waypoints.
  const points = path.map(p => `${p.x},${p.y}`).join(' ')

  // Total path length for sprite animation (approximate polyline length).
  let totalLen = 0
  const segLens: number[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x
    const dy = path[i + 1].y - path[i].y
    const d = Math.hypot(dx, dy)
    segLens.push(d)
    totalLen += d
  }

  // Animate the sprite only on commit (not preview).
  // Duration is proportional to total length — ~0.35s per 10 map units.
  const durationSec = Math.max(1.2, totalLen * 0.035)

  // Pre-compute animateMotion values="x,y;x,y;..." from waypoints.
  // animateMotion keyTimes must match the normalized cumulative length.
  const keyTimes: number[] = [0]
  let running = 0
  for (const d of segLens) {
    running += d
    keyTimes.push(totalLen === 0 ? 1 : running / totalLen)
  }
  const motionValues = path.map(p => `${p.x},${p.y}`).join(';')
  const motionKeyTimes = keyTimes.join(';')

  const keyForRestart = routeKey ?? path.map(p => p.id).join('-')

  return (
    <g className="travel-route" key={keyForRestart}>
      {/* Soft glow underlay for the whole route */}
      <polyline
        points={points}
        fill="none"
        stroke={glow}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={previewMode ? 0.55 : 0.85}
      />

      {/* Main dashed animated line */}
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={previewMode ? 0.5 : 0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1.4 1.1"
        opacity={0.95}
      >
        {/* Dash-march animation — classic marching-ants. */}
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-5"
          dur="0.6s"
          repeatCount="indefinite"
        />
      </polyline>

      {/* Waypoint ticks (intermediate hops only) */}
      {path.slice(1, -1).map((p, i) => (
        <circle
          key={`wp-${p.id}-${i}`}
          cx={p.x}
          cy={p.y}
          r={0.8}
          fill={stroke}
          opacity={0.8}
        >
          <animate
            attributeName="r"
            values="0.6;1;0.6"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Walking sprite — only on commit (non-preview). */}
      {!previewMode && (
        <g>
          {/* The sprite is a tiny pixel character: circle head + square body.
              animateMotion walks it along the polyline. */}
          <g>
            {/* Head */}
            <circle cx={0} cy={-1.1} r={0.6} fill="var(--pixel-gold-light, #fde68a)" stroke="#1a1a0e" strokeWidth={0.15} />
            {/* Body */}
            <rect x={-0.55} y={-0.5} width={1.1} height={1.3} fill="var(--pixel-earth-mid, #92400e)" stroke="#1a1a0e" strokeWidth={0.15} />
            {/* Hat nub */}
            <rect x={-0.7} y={-1.8} width={1.4} height={0.35} fill="#1a1a0e" />
            {/* Bob animation — head-bob while walking */}
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values="0,0;0,-0.25;0,0;0,-0.25;0,0"
              dur="0.5s"
              repeatCount="indefinite"
            />
            <animateMotion
              dur={`${durationSec}s`}
              repeatCount="indefinite"
              rotate="auto"
              values={motionValues}
              keyTimes={motionKeyTimes}
            />
          </g>
        </g>
      )}
    </g>
  )
}

export default TravelRoute
