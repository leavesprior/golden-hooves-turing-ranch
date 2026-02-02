'use client'

import React, { useState, useMemo } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import {
  GOLD_COUNTRY_LOCATIONS,
  getGoldCountryLocation,
  areLocationsAdjacent,
} from '../data/goldCountryLocations'

interface GoldCountryExploreProps {
  onVisitLocation: (locationId: string) => void
  onTravel: (toLocationId: string) => void
  onOpenSettlement: () => void
  onOpenQuestLog: () => void
  onLeave: () => void
}

export function GoldCountryExplore({
  onVisitLocation,
  onTravel,
  onOpenSettlement,
  onOpenQuestLog,
  onLeave,
}: GoldCountryExploreProps) {
  const { state } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const currentLoc = state.currentGoldCountryLocation || 'bobr_cabin'
  const discovered = state.discoveredGoldLocations

  // Map location positions (relative to SVG viewBox)
  const locationPositions: Record<string, { x: number; y: number }> = useMemo(() => ({
    bobr_cabin: { x: 50, y: 25 },
    angels_camp: { x: 25, y: 55 },
    murphys: { x: 35, y: 40 },
    moaning_cavern: { x: 20, y: 65 },
    california_caverns: { x: 40, y: 55 },
    big_trees: { x: 15, y: 35 },
    kennedy_mine: { x: 70, y: 60 },
    mokelumne_hill: { x: 55, y: 50 },
    ironstone_vineyards: { x: 30, y: 45 },
    jackson: { x: 75, y: 50 },
    natural_bridges: { x: 40, y: 30 },
  }), [])

  // Determine which locations can be reached from current position
  const reachableLocations = useMemo(() => {
    return GOLD_COUNTRY_LOCATIONS.filter(loc =>
      discovered.includes(loc.id) && loc.id !== currentLoc
    ).map(loc => loc.id)
  }, [discovered, currentLoc])

  const handleLocationClick = (locationId: string) => {
    if (!discovered.includes(locationId)) return

    if (locationId === currentLoc) {
      // Already here, visit directly
      onVisitLocation(locationId)
    } else {
      setSelectedLocation(locationId)
    }
  }

  const handleTravelConfirm = () => {
    if (!selectedLocation) return
    const isAdjacent = areLocationsAdjacent(currentLoc, selectedLocation)
    if (isAdjacent) {
      // Adjacent: go directly, no travel encounter
      onVisitLocation(selectedLocation)
    } else {
      // Distant: trigger travel phase with potential encounters
      onTravel(selectedLocation)
    }
    setSelectedLocation(null)
  }

  const selectedLocData = selectedLocation ? getGoldCountryLocation(selectedLocation) : null
  const currentLocData = getGoldCountryLocation(currentLoc)
  const hoveredLocData = hoveredLocation ? getGoldCountryLocation(hoveredLocation) : null

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
        }}
      />

      {/* Header - PipBoy style */}
      <header className="bg-green-950/30 border-b border-green-700/40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-400 text-xl tracking-wider">GOLD COUNTRY</h1>
            <p className="text-green-600 text-xs font-mono tracking-widest uppercase">
              Sierra Foothills - Free Roam
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-green-700 text-xs font-mono">DAY</p>
              <p className="text-amber-400 font-pixel text-lg">{state.goldCountryDay}</p>
            </div>
            <div className="text-right">
              <p className="text-green-700 text-xs font-mono">GOLD</p>
              <p className="text-amber-400 font-pixel text-lg">{balance.neutral}</p>
            </div>
            <div className="text-right">
              <p className="text-green-700 text-xs font-mono">QUESTS</p>
              <p className="text-amber-400 font-pixel text-lg">
                {state.completedQuests.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Map Area */}
        <div className="flex-1 p-4">
          <div className="relative bg-green-950/20 border border-green-700/40 rounded-lg overflow-hidden aspect-[4/3]">
            {/* Map background grid */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                  <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="rgba(34,197,94,0.1)" strokeWidth="0.2" />
                  <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="rgba(34,197,94,0.1)" strokeWidth="0.2" />
                </React.Fragment>
              ))}

              {/* Connection lines between discovered adjacent locations */}
              {GOLD_COUNTRY_LOCATIONS.filter(loc => discovered.includes(loc.id)).map(loc =>
                loc.adjacentTo
                  .filter(adjId => discovered.includes(adjId))
                  .map(adjId => {
                    const pos1 = locationPositions[loc.id]
                    const pos2 = locationPositions[adjId]
                    if (!pos1 || !pos2) return null
                    return (
                      <line
                        key={`${loc.id}-${adjId}`}
                        x1={pos1.x} y1={pos1.y}
                        x2={pos2.x} y2={pos2.y}
                        stroke="rgba(34,197,94,0.2)"
                        strokeWidth="0.3"
                        strokeDasharray="1,1"
                      />
                    )
                  })
              )}
            </svg>

            {/* Location markers */}
            {GOLD_COUNTRY_LOCATIONS.map(loc => {
              const pos = locationPositions[loc.id]
              if (!pos) return null
              const isDiscovered = discovered.includes(loc.id)
              const isCurrent = loc.id === currentLoc
              const isHovered = loc.id === hoveredLocation
              const isSelected = loc.id === selectedLocation

              return (
                <button
                  key={loc.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                    !isDiscovered
                      ? 'opacity-20 cursor-not-allowed'
                      : isCurrent
                        ? 'z-20'
                        : 'z-10 cursor-pointer'
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => isDiscovered && handleLocationClick(loc.id)}
                  onMouseEnter={() => isDiscovered && setHoveredLocation(loc.id)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  disabled={!isDiscovered}
                >
                  {/* Pulse ring for current location */}
                  {isCurrent && (
                    <div className="absolute inset-0 -m-2 rounded-full border-2 border-amber-400 animate-ping opacity-50" />
                  )}

                  {/* Marker */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    border-2 transition-all duration-200
                    ${isCurrent
                      ? 'bg-amber-900/80 border-amber-400 text-amber-300 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : isSelected
                        ? 'bg-green-900/80 border-green-400 text-green-300 scale-110 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                        : isHovered
                          ? 'bg-green-950/80 border-green-500 text-green-400 scale-110'
                          : isDiscovered
                            ? 'bg-green-950/60 border-green-700 text-green-500'
                            : 'bg-gray-900/40 border-gray-700 text-gray-600'
                    }
                  `}>
                    {isDiscovered ? loc.icon : '?'}
                  </div>

                  {/* Label */}
                  {isDiscovered && (isHovered || isCurrent || isSelected) && (
                    <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap
                      text-xs font-mono px-2 py-0.5 rounded
                      ${isCurrent ? 'text-amber-400 bg-amber-950/80' : 'text-green-400 bg-green-950/80'}
                      border ${isCurrent ? 'border-amber-700/50' : 'border-green-700/50'}
                    `}>
                      {loc.shortName}
                    </div>
                  )}
                </button>
              )
            })}

            {/* Map title */}
            <div className="absolute top-2 left-3 text-green-700/60 text-xs font-mono tracking-widest uppercase">
              Sierra Nevada Foothills
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 right-3 text-green-700/40 text-xs font-mono">
              <span className="text-amber-400/60">&#9679;</span> YOU ARE HERE
              &nbsp;&nbsp;
              <span className="text-green-400/60">&#9679;</span> DISCOVERED
              &nbsp;&nbsp;
              <span className="text-gray-600/60">&#9679;</span> UNKNOWN
            </div>
          </div>

          {/* Travel Confirmation Modal */}
          {selectedLocation && selectedLocData && (
            <div className="mt-4 bg-green-950/30 border border-green-700/40 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-400 font-pixel text-sm">
                    Travel to {selectedLocData.name}?
                  </p>
                  <p className="text-green-600 text-xs font-mono mt-1">
                    {selectedLocData.driveTime} | {selectedLocData.atmosphere.toUpperCase()}
                    {!areLocationsAdjacent(currentLoc, selectedLocation) && (
                      <span className="text-amber-500 ml-2">[ENCOUNTER POSSIBLE]</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="px-4 py-2 bg-green-950/50 hover:bg-green-900/50 text-green-500 text-xs font-mono rounded border border-green-700/40"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleTravelConfirm}
                    className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/60 text-amber-300 text-xs font-mono rounded border border-amber-600/50"
                  >
                    TRAVEL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-green-700/40 p-4 flex flex-col gap-4">
          {/* Current Location */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-3">
            <h3 className="text-amber-400 font-pixel text-xs tracking-wider mb-2">CURRENT LOCATION</h3>
            {currentLocData && (
              <>
                <p className="text-green-300 font-pixel text-sm">{currentLocData.icon} {currentLocData.name}</p>
                <p className="text-green-600 text-xs font-mono mt-1">{currentLocData.description}</p>
                <button
                  onClick={() => onVisitLocation(currentLoc)}
                  className="w-full mt-3 py-2 bg-green-900/50 hover:bg-green-800/60 text-green-300 text-xs font-mono rounded border border-green-700/40 transition-colors"
                >
                  ENTER {currentLocData.shortName.toUpperCase()}
                </button>
                {currentLoc === 'bobr_cabin' && (
                  <button
                    onClick={onOpenSettlement}
                    className="w-full mt-2 py-2 bg-amber-900/50 hover:bg-amber-800/60 text-amber-300 text-xs font-mono rounded border border-amber-600/50 transition-colors"
                  >
                    MANAGE SETTLEMENT
                  </button>
                )}
              </>
            )}
          </div>

          {/* Hovered Location Info */}
          {hoveredLocData && hoveredLocation !== currentLoc && (
            <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-3">
              <h3 className="text-green-500 font-pixel text-xs tracking-wider mb-2">LOCATION INFO</h3>
              <p className="text-green-300 text-sm">{hoveredLocData.icon} {hoveredLocData.name}</p>
              <p className="text-green-700 text-xs font-mono mt-1">{hoveredLocData.driveTime}</p>
              <p className="text-green-600 text-xs mt-1">{hoveredLocData.fact}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {hoveredLocData.tags.map(tag => (
                  <span key={tag} className="text-green-700 text-xs font-mono px-1 border border-green-800/40 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-3">
            <h3 className="text-amber-400 font-pixel text-xs tracking-wider mb-2">STATUS</h3>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-green-600">Locations Found</span>
                <span className="text-green-300">{discovered.length}/{GOLD_COUNTRY_LOCATIONS.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Areas Searched</span>
                <span className="text-green-300">{state.searchedAreas.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Items Found</span>
                <span className="text-green-300">{state.inventory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Party Health</span>
                <span className="text-green-300">
                  {state.party.filter(m => m.health > 0).length}/{state.party.length}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">
            <button
              onClick={onOpenQuestLog}
              className="w-full py-2 bg-green-950/50 hover:bg-green-900/50 text-green-400 text-xs font-mono rounded border border-green-700/40 transition-colors"
            >
              QUEST LOG
            </button>
            <button
              onClick={onLeave}
              className="w-full py-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-mono rounded border border-red-800/40 transition-colors"
            >
              LEAVE GOLD COUNTRY
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoldCountryExplore
