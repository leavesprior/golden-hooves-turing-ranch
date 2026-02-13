'use client'

import React from 'react'

interface MapLocation {
  id: string
  name: string
  x: number  // percentage 0-100
  y: number  // percentage 0-100
  discovered: boolean
  visited: boolean
  active: boolean
  dangerLevel: 'safe' | 'moderate' | 'dangerous'
  hasClues: boolean
  hasPuzzle: boolean
}

interface LocationMapProps {
  locations: MapLocation[]
  connections: [string, string][]
  currentLocationId: string
  onTravelTo: (locationId: string) => void
  culturalZone: string
  mapBackground?: string
}

const DANGER_COLORS = {
  safe: 'border-green-500 bg-green-900/40',
  moderate: 'border-amber-500 bg-amber-900/40',
  dangerous: 'border-red-500 bg-red-900/40',
}

export function LocationMap({
  locations,
  connections,
  currentLocationId,
  onTravelTo,
  culturalZone,
}: LocationMapProps) {
  const discoveredLocations = locations.filter(l => l.discovered)

  return (
    <div className="relative bg-black/30 border-2 border-purple-800 rounded-lg overflow-hidden">
      {/* Map label */}
      <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded">
        <span className="font-pixel text-purple-400 text-[8px]">{culturalZone}</span>
      </div>

      {/* Map area */}
      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        {/* Connection lines (SVG overlay) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60">
          {connections.map(([fromId, toId]) => {
            const from = locations.find(l => l.id === fromId)
            const to = locations.find(l => l.id === toId)
            if (!from?.discovered || !to?.discovered) return null
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.x}
                y1={from.y * 0.6}
                x2={to.x}
                y2={to.y * 0.6}
                stroke="rgba(168, 85, 247, 0.3)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
              />
            )
          })}
        </svg>

        {/* Location markers */}
        {discoveredLocations.map(loc => {
          const isCurrent = loc.id === currentLocationId
          const isAdjacent = connections.some(
            ([a, b]) => (a === currentLocationId && b === loc.id) || (b === currentLocationId && a === loc.id)
          )
          const canTravel = isAdjacent && !isCurrent

          return (
            <button
              key={loc.id}
              onClick={() => canTravel && onTravelTo(loc.id)}
              disabled={!canTravel}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                canTravel ? 'cursor-pointer hover:scale-125' : isCurrent ? '' : 'cursor-default'
              }`}
              style={{ left: `${loc.x}%`, top: `${loc.y * 0.6 / 60 * 100}%` }}
              title={loc.name}
            >
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px]
                ${isCurrent
                  ? 'border-amber-400 bg-amber-600 shadow-lg shadow-amber-500/50 animate-pulse scale-125'
                  : loc.visited
                    ? DANGER_COLORS[loc.dangerLevel]
                    : 'border-gray-500 bg-gray-700/60'}
              `}>
                {isCurrent && '\u25CF'}
                {!isCurrent && loc.hasClues && '\uD83D\uDD0D'}
                {!isCurrent && loc.hasPuzzle && !loc.hasClues && '\uD83E\uDDE9'}
              </div>
              <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`font-pixel text-[7px] ${
                  isCurrent ? 'text-amber-300' : loc.visited ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  {loc.name}
                </span>
              </div>
            </button>
          )
        })}

        {/* Undiscovered fog */}
        {locations.filter(l => !l.discovered).length > 0 && (
          <div className="absolute bottom-2 right-2 text-[8px] text-gray-600 font-pixel">
            ? undiscovered locations remain
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 p-2 border-t border-purple-800/50 text-[7px] text-purple-500">
        <span>{'\u25CF'} You are here</span>
        <span>{'\uD83D\uDD0D'} Has clues</span>
        <span>{'\uD83E\uDDE9'} Has puzzle</span>
      </div>
    </div>
  )
}
