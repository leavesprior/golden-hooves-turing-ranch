'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  MapLocation,
  RandomEncounterZone,
  ChapterType,
  getLocationById,
  ENCOUNTER_ZONES,
  GOLD_COUNTRY_LOCATIONS,
  CHAPTER_1_WAYPOINTS,
} from '../data/worldMaps'
import {
  MapSVGDefs,
  MapTerrain,
  MapIcon,
  MapFogOfWar,
  MapConnections,
  MapTooltip,
  MapCompass,
  MapAnimations,
  useMapInteraction,
} from './map'

// ============================================
// TYPES
// ============================================

interface WorldMapProps {
  chapter: ChapterType
  currentLocationId: string
  discoveredLocations: Set<string>
  onLocationClick: (locationId: string) => void
  onTravelStart?: (fromId: string, toId: string) => void
  onTravelComplete?: (locationId: string) => void
  onRandomEncounter?: (zone: RandomEncounterZone) => void
  onScout?: (locationId: string) => void
  playerPosition?: { x: number; y: number }
  isMoving?: boolean
  graphicsTier?: 'retro_4bit' | 'classic_8bit' | 'enhanced_16bit' | 'modern_32bit' | 'ultra_64bit'
  expertiseStat?: number
  scoutingCostHours?: number
}

interface Tooltip {
  visible: boolean
  x: number
  y: number
  location: MapLocation | null
}

interface TravelAnimation {
  active: boolean
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  targetLocationId: string
}

// ============================================
// COMPONENT
// ============================================

export function WorldMap({
  chapter,
  currentLocationId,
  discoveredLocations,
  onLocationClick,
  onTravelStart,
  onTravelComplete,
  onRandomEncounter,
  onScout,
  playerPosition: externalPlayerPosition,
  isMoving = false,
  graphicsTier = 'classic_8bit',
  expertiseStat = 0,
  scoutingCostHours = 2,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, x: 0, y: 0, location: null })
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
  const [travelAnimation, setTravelAnimation] = useState<TravelAnimation>({
    active: false, fromX: 0, fromY: 0, toX: 0, toY: 0, progress: 0, targetLocationId: '',
  })
  const [scoutingLocation, setScoutingLocation] = useState<string | null>(null)
  const [scoutAnimation, setScoutAnimation] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const isRetro = graphicsTier === 'retro_4bit'

  // Scouting range
  const scoutRange = expertiseStat >= 8 ? 3 : expertiseStat >= 5 ? 2 : 1

  // BFS for scoutable locations
  const scoutableLocations = useMemo(() => {
    const scoutable = new Set<string>()
    const visited = new Set<string>()
    const queue: Array<{ id: string; depth: number }> = []
    discoveredLocations.forEach(locId => {
      queue.push({ id: locId, depth: 0 })
      visited.add(locId)
    })
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (depth >= scoutRange) continue
      const loc = getLocationById(id)
      if (!loc) continue
      for (const connId of loc.connectedTo) {
        if (!visited.has(connId)) {
          visited.add(connId)
          if (!discoveredLocations.has(connId)) scoutable.add(connId)
          queue.push({ id: connId, depth: depth + 1 })
        }
      }
    }
    return scoutable
  }, [discoveredLocations, scoutRange])

  const handleScout = useCallback((locationId: string) => {
    setScoutingLocation(locationId)
    setScoutAnimation(true)
    setTimeout(() => {
      setScoutAnimation(false)
      setScoutingLocation(null)
      onScout?.(locationId)
    }, 1200)
  }, [onScout])

  const chapterLocations = useMemo(() => {
    switch (chapter) {
      case 'journey_west': return CHAPTER_1_WAYPOINTS
      case 'gold_country': return GOLD_COUNTRY_LOCATIONS
      case 'return_visit': return [...CHAPTER_1_WAYPOINTS, ...GOLD_COUNTRY_LOCATIONS]
      default: return []
    }
  }, [chapter])

  // Location coords map for animations
  const locationCoords = useMemo(() => {
    const coords = new Map<string, { x: number; y: number }>()
    chapterLocations.forEach(loc => coords.set(loc.id, { x: loc.x, y: loc.y }))
    return coords
  }, [chapterLocations])

  const playerPosition = useMemo(() => {
    if (travelAnimation.active) {
      return {
        x: travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * travelAnimation.progress,
        y: travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * travelAnimation.progress,
      }
    }
    if (externalPlayerPosition) return externalPlayerPosition
    const currentLoc = getLocationById(currentLocationId)
    return currentLoc ? { x: currentLoc.x, y: currentLoc.y } : { x: 50, y: 50 }
  }, [currentLocationId, travelAnimation, externalPlayerPosition])

  // Travel animation
  useEffect(() => {
    if (!travelAnimation.active) return
    const animationDuration = 2000
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)
      setTravelAnimation(prev => ({ ...prev, progress }))
      if (progress > 0.3 && progress < 0.7 && Math.random() < 0.01) {
        const px = travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * progress
        const py = travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * progress
        const encounterZone = ENCOUNTER_ZONES.find(zone => {
          const dist = Math.sqrt(Math.pow(px - zone.x, 2) + Math.pow(py - zone.y, 2))
          return dist <= zone.radius
        })
        if (encounterZone && onRandomEncounter) onRandomEncounter(encounterZone)
      }
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTravelAnimation(prev => ({ ...prev, active: false }))
        onTravelComplete?.(travelAnimation.targetLocationId)
      }
    }
    requestAnimationFrame(animate)
  }, [travelAnimation.active, travelAnimation.fromX, travelAnimation.fromY, travelAnimation.toX, travelAnimation.toY, travelAnimation.targetLocationId, onTravelComplete, onRandomEncounter])

  const handleTravel = useCallback((targetId: string) => {
    const current = getLocationById(currentLocationId)
    const target = getLocationById(targetId)
    if (!current || !target || !current.connectedTo.includes(targetId) || !discoveredLocations.has(targetId)) return
    onTravelStart?.(currentLocationId, targetId)
    setTravelAnimation({
      active: true, fromX: current.x, fromY: current.y,
      toX: target.x, toY: target.y, progress: 0, targetLocationId: targetId,
    })
  }, [currentLocationId, discoveredLocations, onTravelStart])

  const handleLocationHover = useCallback((location: MapLocation, event: React.MouseEvent) => {
    setHoveredLocationId(location.id)
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setTooltip({ visible: true, x: rect.right + 10, y: rect.top, location })
  }, [])

  const handleLocationLeave = useCallback(() => {
    setHoveredLocationId(null)
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  // Zoom/pan interaction
  const { svgTransform, handlers: interactionHandlers, containerRef } = useMapInteraction({
    graphicsTier,
  })

  // Chapter titles
  const chapterTitle = { journey_west: 'Chapter 1: Journey West', gold_country: 'Chapter 2: Gold Country', return_visit: 'Chapter 3: The Long Road Home' }[chapter]
  const bgGradient = chapter === 'journey_west' ? 'url(#grad-ch1-bg)' : 'url(#grad-ch2-bg)'

  return (
    <div
      ref={el => {
        // Assign to both refs
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
        ;(mapContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      }}
      className={`relative w-full aspect-[16/10] overflow-hidden border-4 border-[var(--pixel-ui-border)] rounded-lg map-tier-${graphicsTier}`}
      {...interactionHandlers}
    >
      <svg
        viewBox="0 0 100 62.5"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{ transform: svgTransform || undefined }}
      >
        <MapSVGDefs graphicsTier={graphicsTier} chapter={chapter} />

        {/* Background */}
        <rect x="0" y="0" width="100" height="62.5" fill={bgGradient} />

        {/* Grid overlay */}
        <g opacity="0.1">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="62.5" stroke="var(--pixel-ui-text)" strokeWidth="0.1" />
              <line x1="0" y1={i * 6.25} x2="100" y2={i * 6.25} stroke="var(--pixel-ui-text)" strokeWidth="0.1" />
            </React.Fragment>
          ))}
        </g>

        {/* Terrain */}
        <MapTerrain chapter={chapter} graphicsTier={graphicsTier} />

        {/* Encounter zones */}
        {chapter !== 'journey_west' && ENCOUNTER_ZONES.map(zone => (
          <circle
            key={zone.id}
            cx={zone.x} cy={zone.y} r={zone.radius}
            fill={zone.dangerLevel === 'dangerous' ? 'url(#grad-danger-high)' : 'url(#grad-danger-normal)'}
            className="map-encounter-zone"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* Connections */}
        <MapConnections
          locations={chapterLocations}
          discoveredLocations={discoveredLocations}
          scoutableLocations={scoutableLocations}
          currentLocationId={currentLocationId}
          hoveredLocationId={hoveredLocationId}
          graphicsTier={graphicsTier}
          chapter={chapter}
        />

        {/* Fog of war */}
        <MapFogOfWar
          locations={chapterLocations}
          discoveredLocations={discoveredLocations}
          scoutableLocations={scoutableLocations}
          scoutingLocation={scoutingLocation}
          graphicsTier={graphicsTier}
        />

        {/* Location markers */}
        {chapterLocations.map(location => {
          const isDiscovered = discoveredLocations.has(location.id)
          const isCurrent = location.id === currentLocationId
          const isHovered = location.id === hoveredLocationId
          const isConnected = getLocationById(currentLocationId)?.connectedTo.includes(location.id)
          const canTravel = isDiscovered && isConnected && !isCurrent && !travelAnimation.active
          const isScoutable = scoutableLocations.has(location.id)
          const isBeingScouted = scoutingLocation === location.id
          const showQuestion = !isDiscovered && isScoutable
          const canScout = !isDiscovered && isConnected && !!onScout && !travelAnimation.active && !scoutAnimation

          if (!isDiscovered && !showQuestion) return null

          return (
            <g
              key={location.id}
              transform={`translate(${location.x}, ${location.y})`}
              style={{ cursor: canTravel ? 'pointer' : canScout ? 'crosshair' : showQuestion ? 'help' : 'default' }}
              role="button"
              tabIndex={0}
              aria-label={isDiscovered ? location.name : 'Unknown location'}
              onClick={() => {
                if (canTravel) handleTravel(location.id)
                else if (canScout) handleScout(location.id)
                else onLocationClick(location.id)
              }}
              onMouseEnter={(e) => isDiscovered && handleLocationHover(location, e as unknown as React.MouseEvent)}
              onMouseLeave={handleLocationLeave}
            >
              {/* Current location pulse */}
              {isCurrent && (
                <circle cx="0" cy="0" r={isRetro ? 3 : 2.5} fill="var(--pixel-gold-light)" opacity="0.3">
                  <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Scouting pulse */}
              {isBeingScouted && (
                <circle cx="0" cy="0" r="2" fill="none" stroke="#d4a843" strokeWidth="0.3" opacity="0.5">
                  <animate attributeName="r" values="1;4;1" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Icon */}
              <foreignObject
                x={isRetro ? -4 : -6}
                y={isRetro ? -4 : -6}
                width={isRetro ? 8 : 12}
                height={isRetro ? 8 : 12}
                style={{
                  overflow: 'visible',
                  filter: isCurrent ? 'url(#filter-gold-glow)' : isBeingScouted ? 'url(#filter-scout-pulse)' : undefined,
                  transform: isHovered || isCurrent ? 'scale(1.2)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease',
                }}
              >
                {showQuestion ? (
                  <MapIcon type="question" tier={graphicsTier} size={isRetro ? 8 : 12} dimmed />
                ) : (
                  <MapIcon
                    type={location.type}
                    tier={graphicsTier}
                    size={isRetro ? 8 : 12}
                    glow={isCurrent}
                    animated={isCurrent}
                  />
                )}
              </foreignObject>

              {/* Danger indicator */}
              {isDiscovered && location.dangerLevel !== 'safe' && (
                <circle
                  cx={isRetro ? 3 : 4}
                  cy={isRetro ? -3 : -4}
                  r="1"
                  fill={location.dangerLevel === 'dangerous' ? 'var(--pixel-fire-orange)' : 'var(--pixel-gold-mid)'}
                />
              )}

              {/* Travel indicator */}
              {canTravel && !showQuestion && !isRetro && (
                <text x="0" y={isRetro ? 6 : 8} textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="1.5" fontFamily="monospace" opacity="0.7">
                  Travel
                </text>
              )}

              {/* Scout indicator */}
              {canScout && !isBeingScouted && (
                <g>
                  <rect x="-6" y="6" width="12" height="3.5" rx="0.5" fill="rgba(42,31,20,0.85)" stroke="#8b6914" strokeWidth="0.2" />
                  <text x="0" y="8.2" textAnchor="middle" fill="#d4a843" fontSize="1.5" fontFamily="monospace">
                    Scout ({scoutingCostHours}hr)
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Player marker */}
        <g
          transform={`translate(${playerPosition.x}, ${playerPosition.y})`}
          className={(travelAnimation.active || isMoving) ? 'map-wagon-bob' : undefined}
          style={{ transition: (travelAnimation.active || isMoving) ? 'none' : 'transform 0.5s ease' }}
        >
          <foreignObject x="-6" y="-6" width="12" height="12" style={{ overflow: 'visible' }}>
            <MapIcon type="player" tier={graphicsTier} size={isRetro ? 10 : 14} glow />
          </foreignObject>
          {(travelAnimation.active || isMoving) && !isRetro && (
            <text x="0" y="-7" textAnchor="middle" fill="var(--pixel-gold-light)" fontSize="1.5" fontFamily="monospace" opacity="0.8">
              Traveling...
            </text>
          )}
        </g>

        {/* Animations overlay */}
        <MapAnimations
          travelAnimation={travelAnimation}
          scoutingLocation={scoutingLocation}
          graphicsTier={graphicsTier}
          chapter={chapter}
          locationCoords={locationCoords}
        />

        {/* Compass */}
        <MapCompass graphicsTier={graphicsTier} />
      </svg>

      {/* Chapter title (HTML overlay) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-xs">
          {chapterTitle}
        </div>
        <div className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
          {discoveredLocations.size} / {chapterLocations.length} locations discovered
        </div>
        {expertiseStat > 0 && (
          <div className="font-[var(--font-pixel)] text-[8px] mt-0.5" style={{ color: '#8b6914' }}>
            Scout range: {scoutRange} {scoutRange > 1 ? '(Expertise bonus)' : ''}
          </div>
        )}
      </div>

      {/* Tooltip (HTML overlay) */}
      <MapTooltip
        location={tooltip.location}
        position={{ x: tooltip.x, y: tooltip.y }}
        visible={tooltip.visible}
        graphicsTier={graphicsTier}
        containerRef={mapContainerRef}
      />
    </div>
  )
}

// ============================================
// MINI MAP COMPONENT
// ============================================

interface MiniMapProps {
  currentLocationId: string
  discoveredLocations: Set<string>
  chapter: ChapterType
}

export function MiniMap({ currentLocationId, discoveredLocations, chapter }: MiniMapProps) {
  const currentLocation = getLocationById(currentLocationId)
  const connectedLocations = currentLocation
    ? currentLocation.connectedTo.map(id => getLocationById(id)).filter((l): l is MapLocation => !!l)
    : []

  return (
    <div className="relative w-32 h-24 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] rounded overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Current location (center) */}
        <circle cx="50" cy="50" r="4" fill="var(--pixel-gold-light)">
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Connected locations */}
        {connectedLocations.slice(0, 4).map((loc, i) => {
          const angles = [0, 90, 180, 270]
          const angle = angles[i] * Math.PI / 180
          const x = 50 + Math.cos(angle) * 30
          const y = 50 + Math.sin(angle) * 25
          return (
            <React.Fragment key={loc.id}>
              <line x1="50" y1="50" x2={x} y2={y} stroke="var(--pixel-ui-border)" strokeWidth="0.5" opacity="0.3" />
              <circle cx={x} cy={y} r="3"
                fill={discoveredLocations.has(loc.id) ? 'var(--pixel-ui-text)' : 'var(--pixel-ui-border)'}
              />
            </React.Fragment>
          )
        })}
      </svg>

      {/* Location name */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
        <div className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] truncate text-center">
          {currentLocation?.name || 'Unknown'}
        </div>
      </div>
    </div>
  )
}

export default WorldMap
