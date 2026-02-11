'use client'

import React, { useState, useMemo } from 'react'
import {
  getChapterLocations,
  getLocationById as getChapterLocation,
  type ChapterLocation,
} from '@/app/adventure/data/chapterLocations'
import type { FactionId } from '@/app/oregon-trail/reputationContext'

interface ChapterMapProps {
  chapter: number
  currentLocationId: string
  discoveredLocationIds: string[]
  visitedLocationIds: string[]
  factionReps: Record<FactionId, number>
  onTravelTo: (locationId: string) => void
  onVisitLocation: (locationId: string) => void
}

const ATMOSPHERE_COLORS: Record<string, string> = {
  bustling: '#fbbf24',
  peaceful: '#34d399',
  dangerous: '#f87171',
  orderly: '#60a5fa',
  ancient: '#a78bfa',
  historic: '#fbbf24',
  mysterious: '#8b5cf6',
  secretive: '#6366f1',
  charming: '#f472b6',
  rough: '#fb923c',
  haunting: '#94a3b8',
  dark: '#64748b',
  elegant: '#f472b6',
  festive: '#fbbf24',
  wondrous: '#22d3ee',
  majestic: '#34d399',
  hopeful: '#fbbf24',
  industrial: '#fb923c',
  rustic: '#d97706',
  official: '#60a5fa',
  nostalgic: '#fbbf24',
  wild: '#22c55e',
}

function canAccessLocation(
  loc: ChapterLocation,
  factionReps: Record<FactionId, number>,
): { accessible: boolean; reason?: string } {
  if (!loc.requiredReputation) return { accessible: true }
  const { faction, level } = loc.requiredReputation
  const rep = factionReps[faction] ?? 0
  if (rep < level) {
    return {
      accessible: false,
      reason: `Requires ${faction} reputation ${level}+ (current: ${rep})`,
    }
  }
  return { accessible: true }
}

export function ChapterMap({
  chapter,
  currentLocationId,
  discoveredLocationIds,
  visitedLocationIds,
  factionReps,
  onTravelTo,
  onVisitLocation,
}: ChapterMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const allLocations = useMemo(() => getChapterLocations(chapter), [chapter])
  const currentLoc = getChapterLocation(currentLocationId)
  const discoveredSet = useMemo(() => new Set(discoveredLocationIds), [discoveredLocationIds])
  const visitedSet = useMemo(() => new Set(visitedLocationIds), [visitedLocationIds])

  // Determine which locations are scoutable (adjacent to discovered, not yet discovered)
  const scoutableSet = useMemo(() => {
    const scoutable = new Set<string>()
    for (const id of discoveredLocationIds) {
      const loc = getChapterLocation(id)
      if (!loc) continue
      for (const adjId of loc.connectedTo) {
        if (!discoveredSet.has(adjId)) scoutable.add(adjId)
      }
    }
    return scoutable
  }, [discoveredLocationIds, discoveredSet])

  // Is a location adjacent to current position?
  const isAdjacentToCurrent = (id: string): boolean => {
    return currentLoc?.connectedTo.includes(id) ?? false
  }

  const handleLocationClick = (loc: ChapterLocation) => {
    if (loc.id === currentLocationId) {
      onVisitLocation(loc.id)
      return
    }
    if (isAdjacentToCurrent(loc.id) && discoveredSet.has(loc.id)) {
      const access = canAccessLocation(loc, factionReps)
      if (access.accessible) {
        setSelectedId(loc.id)
      }
    }
  }

  const handleTravel = () => {
    if (selectedId) {
      onTravelTo(selectedId)
      setSelectedId(null)
    }
  }

  const selectedLoc = selectedId ? getChapterLocation(selectedId) : null
  const hoveredLoc = hoveredId ? getChapterLocation(hoveredId) : null

  return (
    <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)]">
      {/* Map Header */}
      <div className="p-3 border-b-2 border-[var(--pixel-ui-border)] flex justify-between items-center">
        <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
          CHAPTER {chapter} MAP
        </span>
        <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
          {discoveredLocationIds.length} / {allLocations.length} discovered
        </span>
      </div>

      {/* SVG Map */}
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-full aspect-square bg-[var(--pixel-bg-dark)]">
          {/* Connection lines */}
          {allLocations.map(loc => {
            if (!discoveredSet.has(loc.id)) return null
            return loc.connectedTo.map(adjId => {
              const adj = getChapterLocation(adjId)
              if (!adj || !discoveredSet.has(adjId)) return null
              const isTravelPath = currentLocationId === loc.id && selectedId === adjId
              return (
                <line
                  key={`${loc.id}-${adjId}`}
                  x1={loc.x} y1={loc.y}
                  x2={adj.x} y2={adj.y}
                  stroke={isTravelPath ? '#fbbf24' : '#4a5568'}
                  strokeWidth={isTravelPath ? 0.8 : 0.4}
                  strokeDasharray={isTravelPath ? 'none' : '2 1'}
                  opacity={isTravelPath ? 1 : 0.5}
                />
              )
            })
          })}

          {/* Fog of war (scoutable locations as question marks) */}
          {allLocations.filter(l => scoutableSet.has(l.id)).map(loc => (
            <g key={`fog-${loc.id}`}>
              <circle cx={loc.x} cy={loc.y} r={2.5} fill="#1a1a2e" stroke="#4a5568" strokeWidth={0.3} opacity={0.6} />
              <text
                x={loc.x} y={loc.y + 1}
                textAnchor="middle" fontSize={3}
                fill="#4a5568"
              >
                ?
              </text>
            </g>
          ))}

          {/* Discovered locations */}
          {allLocations.filter(l => discoveredSet.has(l.id)).map(loc => {
            const isCurrent = loc.id === currentLocationId
            const isHovered = loc.id === hoveredId
            const isSelected = loc.id === selectedId
            const isAdjacent = isAdjacentToCurrent(loc.id) && !isCurrent
            const access = canAccessLocation(loc, factionReps)
            const isVisited = visitedSet.has(loc.id)
            const color = ATMOSPHERE_COLORS[loc.atmosphere] ?? '#9ca3af'

            return (
              <g
                key={loc.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleLocationClick(loc)}
              >
                {/* Glow for current location */}
                {isCurrent && (
                  <circle cx={loc.x} cy={loc.y} r={4.5} fill={color} opacity={0.15}>
                    <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Location circle */}
                <circle
                  cx={loc.x} cy={loc.y}
                  r={isCurrent ? 3.5 : isHovered || isSelected ? 3 : 2.5}
                  fill={isCurrent ? color : isVisited ? '#2d2d44' : '#1a1a2e'}
                  stroke={
                    isCurrent ? '#fff' :
                    isSelected ? '#fbbf24' :
                    !access.accessible ? '#f87171' :
                    isAdjacent ? `${color}cc` : '#4a5568'
                  }
                  strokeWidth={isCurrent ? 0.6 : isSelected ? 0.5 : 0.3}
                  opacity={!access.accessible ? 0.5 : 1}
                />

                {/* Icon */}
                <text
                  x={loc.x} y={loc.y + 1.2}
                  textAnchor="middle" fontSize={isCurrent ? 3.5 : 2.5}
                >
                  {!access.accessible ? '\uD83D\uDD12' : loc.icon}
                </text>

                {/* Name label */}
                {(isHovered || isCurrent || isSelected) && (
                  <g>
                    <rect
                      x={loc.x - 12} y={loc.y - 7}
                      width={24} height={3.5}
                      rx={0.5}
                      fill="rgba(0,0,0,0.85)"
                      stroke={color}
                      strokeWidth={0.2}
                    />
                    <text
                      x={loc.x} y={loc.y - 4.5}
                      textAnchor="middle" fontSize={1.8}
                      fill={color}
                      className="font-[var(--font-pixel)]"
                    >
                      {loc.name}
                    </text>
                  </g>
                )}

                {/* Danger indicator */}
                {loc.travelDanger === 'dangerous' && isAdjacent && (
                  <text x={loc.x + 3} y={loc.y - 2} fontSize={2} fill="#f87171">!</text>
                )}
              </g>
            )
          })}

          {/* Compass */}
          <g transform="translate(90, 10)">
            <circle cx={0} cy={0} r={4} fill="none" stroke="#4a5568" strokeWidth={0.2} />
            <text x={0} y={-2} textAnchor="middle" fontSize={2} fill="#9ca3af">N</text>
            <text x={0} y={3.5} textAnchor="middle" fontSize={1.5} fill="#4a556880">S</text>
          </g>
        </svg>
      </div>

      {/* Info Panel */}
      <div className="p-3 border-t-2 border-[var(--pixel-ui-border)]">
        {selectedLoc ? (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                  {selectedLoc.icon} {selectedLoc.name}
                </h3>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70">
                  {selectedLoc.description}
                </p>
              </div>
              {selectedLoc.travelDanger !== 'safe' && (
                <span className={`font-[var(--font-pixel)] text-[8px] px-2 py-0.5 border ${
                  selectedLoc.travelDanger === 'dangerous'
                    ? 'text-[var(--pixel-fire-red)] border-[var(--pixel-fire-red)]'
                    : 'text-[var(--pixel-fire-orange)] border-[var(--pixel-fire-orange)]'
                }`}>
                  {selectedLoc.travelDanger.toUpperCase()}
                </span>
              )}
            </div>
            {selectedLoc.services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLoc.services.map(s => (
                  <span key={s.type} className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] px-1 border border-[var(--pixel-forest-dark)]">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {selectedLoc.npcs.length > 0 && (
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                {selectedLoc.npcs.length} NPC{selectedLoc.npcs.length > 1 ? 's' : ''} present
              </p>
            )}
            <button
              onClick={handleTravel}
              className="w-full py-2 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)] transition-all"
            >
              TRAVEL TO {selectedLoc.name.toUpperCase()} {'\u25B6'}
            </button>
          </div>
        ) : hoveredLoc && discoveredSet.has(hoveredLoc.id) ? (
          <div>
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
              {hoveredLoc.icon} {hoveredLoc.name}
            </h3>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50">
              {hoveredLoc.id === currentLocationId ? 'You are here. Click to explore.' : 'Click to select destination.'}
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
              {currentLoc?.icon} {currentLoc?.name ?? 'Unknown'}
            </h3>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50">
              Click a location to travel. Click your current location to explore it.
            </p>
          </div>
        )}

        {/* Historical fact */}
        {(selectedLoc ?? currentLoc)?.historicalFact && (
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-earth-light)] mt-2 italic opacity-70">
            "{(selectedLoc ?? currentLoc)!.historicalFact}"
          </p>
        )}
      </div>
    </div>
  )
}
