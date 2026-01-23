'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MapLocation,
  RandomEncounterZone,
  ChapterType,
  getLocationById,
  getConnectedLocations,
  ENCOUNTER_ZONES,
  GOLD_COUNTRY_LOCATIONS,
  CHAPTER_1_WAYPOINTS,
} from '../data/worldMaps'

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
  playerPosition?: { x: number; y: number }
  isMoving?: boolean
  graphicsTier?: 'retro_4bit' | 'classic_8bit' | 'enhanced_16bit' | 'modern_32bit' | 'ultra_64bit'
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
// CONSTANTS
// ============================================

const LOCATION_ICONS: Record<string, string> = {
  town: '🏘️',
  fort: '🏰',
  river: '🌊',
  landmark: '🗿',
  mine: '⛏️',
  ghost_town: '👻',
  pass: '🏔️',
  spring: '💧',
  mountains: '⛰️',
  destination: '⭐',
}

const DANGER_COLORS = {
  safe: 'var(--pixel-forest-light)',
  normal: 'var(--pixel-gold-mid)',
  dangerous: 'var(--pixel-fire-orange)',
}

const SERVICE_ICONS: Record<string, string> = {
  inn: '🛏️',
  shop: '🏪',
  telegraph: '📡',
  saloon: '🍺',
  mine: '⛏️',
  assay: '⚖️',
  church: '⛪',
  stable: '🐴',
  blacksmith: '🔨',
  doctor: '⚕️',
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
  playerPosition: externalPlayerPosition,
  isMoving = false,
  graphicsTier = 'classic_8bit',
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, x: 0, y: 0, location: null })
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
  const [travelAnimation, setTravelAnimation] = useState<TravelAnimation>({
    active: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    progress: 0,
    targetLocationId: '',
  })
  const [encounterFlash, setEncounterFlash] = useState(false)

  // Get locations for current chapter
  const chapterLocations = useMemo(() => {
    switch (chapter) {
      case 'journey_west':
        return CHAPTER_1_WAYPOINTS
      case 'gold_country':
        return GOLD_COUNTRY_LOCATIONS
      case 'return_visit':
        return [...CHAPTER_1_WAYPOINTS, ...GOLD_COUNTRY_LOCATIONS]
      default:
        return []
    }
  }, [chapter])

  // Calculate player position
  const playerPosition = useMemo(() => {
    if (travelAnimation.active) {
      const x = travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * travelAnimation.progress
      const y = travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * travelAnimation.progress
      return { x, y }
    }
    if (externalPlayerPosition) return externalPlayerPosition
    const currentLoc = getLocationById(currentLocationId)
    return currentLoc ? { x: currentLoc.x, y: currentLoc.y } : { x: 50, y: 50 }
  }, [currentLocationId, travelAnimation, externalPlayerPosition])

  // Flash encounter zones
  useEffect(() => {
    const interval = setInterval(() => {
      setEncounterFlash(prev => !prev)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Travel animation
  useEffect(() => {
    if (!travelAnimation.active) return

    const animationDuration = 2000 // 2 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      setTravelAnimation(prev => ({ ...prev, progress }))

      // Check for random encounters during travel
      if (progress > 0.3 && progress < 0.7 && Math.random() < 0.01) {
        const encounterZone = ENCOUNTER_ZONES.find(zone => {
          const px = travelAnimation.fromX + (travelAnimation.toX - travelAnimation.fromX) * progress
          const py = travelAnimation.fromY + (travelAnimation.toY - travelAnimation.fromY) * progress
          const dist = Math.sqrt(Math.pow(px - zone.x, 2) + Math.pow(py - zone.y, 2))
          return dist <= zone.radius
        })
        if (encounterZone && onRandomEncounter) {
          onRandomEncounter(encounterZone)
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTravelAnimation(prev => ({ ...prev, active: false }))
        if (onTravelComplete) {
          onTravelComplete(travelAnimation.targetLocationId)
        }
      }
    }

    requestAnimationFrame(animate)
  }, [travelAnimation.active, travelAnimation.fromX, travelAnimation.fromY, travelAnimation.toX, travelAnimation.toY, travelAnimation.targetLocationId, onTravelComplete, onRandomEncounter])

  // Handle travel to location
  const handleTravel = useCallback((targetId: string) => {
    const current = getLocationById(currentLocationId)
    const target = getLocationById(targetId)

    if (!current || !target) return
    if (!current.connectedTo.includes(targetId)) return
    if (!discoveredLocations.has(targetId)) return

    if (onTravelStart) {
      onTravelStart(currentLocationId, targetId)
    }

    setTravelAnimation({
      active: true,
      fromX: current.x,
      fromY: current.y,
      toX: target.x,
      toY: target.y,
      progress: 0,
      targetLocationId: targetId,
    })
  }, [currentLocationId, discoveredLocations, onTravelStart])

  // Handle location hover
  const handleLocationHover = useCallback((location: MapLocation, event: React.MouseEvent) => {
    setHoveredLocationId(location.id)
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.right + 10,
      y: rect.top,
      location,
    })
  }, [])

  const handleLocationLeave = useCallback(() => {
    setHoveredLocationId(null)
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  // Render fog of war overlay
  const renderFogOfWar = () => {
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {chapterLocations.map(location => {
          if (discoveredLocations.has(location.id)) return null
          return (
            <div
              key={`fog-${location.id}`}
              className="absolute rounded-full"
              style={{
                left: `${location.x - 5}%`,
                top: `${location.y - 5}%`,
                width: '10%',
                height: '10%',
                background: 'radial-gradient(circle, rgba(0,0,0,0.9) 30%, transparent 70%)',
                filter: 'blur(10px)',
              }}
            />
          )
        })}
      </div>
    )
  }

  // Render connection lines between locations
  const renderConnections = () => {
    const connections: React.ReactNode[] = []
    const rendered = new Set<string>()

    chapterLocations.forEach(location => {
      if (!discoveredLocations.has(location.id)) return

      location.connectedTo.forEach(connectedId => {
        const connectionKey = [location.id, connectedId].sort().join('-')
        if (rendered.has(connectionKey)) return
        rendered.add(connectionKey)

        const connected = getLocationById(connectedId)
        if (!connected || !discoveredLocations.has(connectedId)) return

        const isCurrentPath =
          (currentLocationId === location.id && hoveredLocationId === connectedId) ||
          (currentLocationId === connectedId && hoveredLocationId === location.id)

        connections.push(
          <line
            key={connectionKey}
            x1={`${location.x}%`}
            y1={`${location.y}%`}
            x2={`${connected.x}%`}
            y2={`${connected.y}%`}
            stroke={isCurrentPath ? 'var(--pixel-gold-light)' : 'var(--pixel-ui-border)'}
            strokeWidth={isCurrentPath ? 3 : 1}
            strokeDasharray={isCurrentPath ? 'none' : '5,5'}
            opacity={isCurrentPath ? 1 : 0.5}
            className="transition-all duration-300"
          />
        )
      })
    })

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
        {connections}
      </svg>
    )
  }

  // Render encounter zones
  const renderEncounterZones = () => {
    return ENCOUNTER_ZONES.map(zone => {
      // Only show in appropriate chapter
      if (chapter === 'journey_west') return null

      return (
        <div
          key={zone.id}
          className="absolute rounded-full pointer-events-none transition-opacity duration-500"
          style={{
            left: `${zone.x - zone.radius}%`,
            top: `${zone.y - zone.radius}%`,
            width: `${zone.radius * 2}%`,
            height: `${zone.radius * 2}%`,
            background: zone.dangerLevel === 'dangerous'
              ? `radial-gradient(circle, rgba(255,0,0,${encounterFlash ? 0.3 : 0.15}) 0%, transparent 70%)`
              : `radial-gradient(circle, rgba(255,200,0,${encounterFlash ? 0.2 : 0.1}) 0%, transparent 70%)`,
            zIndex: 1,
          }}
        />
      )
    })
  }

  // Render location markers
  const renderLocations = () => {
    return chapterLocations.map(location => {
      const isDiscovered = discoveredLocations.has(location.id)
      const isCurrent = location.id === currentLocationId
      const isHovered = location.id === hoveredLocationId
      const isConnected = getLocationById(currentLocationId)?.connectedTo.includes(location.id)
      const canTravel = isDiscovered && isConnected && !isCurrent && !travelAnimation.active

      // Undiscovered but adjacent locations show as "?" markers
      const showQuestionMark = !isDiscovered && isConnected

      if (!isDiscovered && !showQuestionMark) return null

      return (
        <button
          key={location.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200
            ${isCurrent ? 'z-30' : 'z-20'}
            ${isHovered || isCurrent ? 'scale-125' : 'scale-100'}
            ${canTravel ? 'cursor-pointer hover:scale-125' : showQuestionMark ? 'cursor-help' : 'cursor-default'}
          `}
          style={{
            left: `${location.x}%`,
            top: `${location.y}%`,
          }}
          onClick={() => canTravel ? handleTravel(location.id) : onLocationClick(location.id)}
          onMouseEnter={(e) => isDiscovered && handleLocationHover(location, e)}
          onMouseLeave={handleLocationLeave}
          disabled={!isDiscovered && !showQuestionMark}
        >
          <div className="relative">
            {/* Location icon */}
            <span
              className={`text-2xl sm:text-3xl drop-shadow-lg transition-all ${
                showQuestionMark ? 'grayscale opacity-50' : ''
              }`}
              style={{
                filter: isCurrent ? 'drop-shadow(0 0 8px gold)' : undefined,
              }}
            >
              {showQuestionMark ? '❓' : (location.icon || LOCATION_ICONS[location.type])}
            </span>

            {/* Current location pulse */}
            {isCurrent && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--pixel-gold-light)] rounded-full animate-ping opacity-50" />
            )}

            {/* Danger indicator */}
            {isDiscovered && location.dangerLevel !== 'safe' && (
              <div
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: DANGER_COLORS[location.dangerLevel] }}
              />
            )}

            {/* Travel indicator */}
            {canTravel && !showQuestionMark && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-[var(--pixel-gold-light)] whitespace-nowrap">
                Click to travel
              </div>
            )}
          </div>
        </button>
      )
    })
  }

  // Render player marker
  const renderPlayer = () => {
    const isAnimating = travelAnimation.active || isMoving

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-40 transition-all ${
          isAnimating ? 'duration-0' : 'duration-500'
        }`}
        style={{
          left: `${playerPosition.x}%`,
          top: `${playerPosition.y}%`,
        }}
      >
        <div className="relative">
          {/* Player icon */}
          <span
            className="text-3xl sm:text-4xl drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.8))',
              animation: isAnimating ? 'wagonBob 0.3s ease-in-out infinite' : undefined,
            }}
          >
            🐴
          </span>

          {/* Direction indicator during travel */}
          {isAnimating && (
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-[var(--pixel-gold-light)]"
            >
              Traveling...
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render tooltip
  const renderTooltip = () => {
    if (!tooltip.visible || !tooltip.location) return null

    const location = tooltip.location

    return (
      <div
        className="fixed bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-3 rounded-lg shadow-xl z-50 max-w-xs"
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
        }}
      >
        <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm mb-1">
          {location.icon || LOCATION_ICONS[location.type]} {location.name}
        </div>

        <div className="text-[8px] text-[var(--pixel-ui-text)] mb-2">
          {location.description}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[8px] px-2 py-0.5 rounded"
            style={{
              backgroundColor: DANGER_COLORS[location.dangerLevel],
              color: 'black',
            }}
          >
            {location.dangerLevel.toUpperCase()}
          </span>
          <span className="text-[8px] text-[var(--pixel-ui-text)]">
            {location.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {location.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {location.services.map(service => (
              <span key={service} className="text-sm" title={service}>
                {SERVICE_ICONS[service]}
              </span>
            ))}
          </div>
        )}

        {location.lore && (
          <div className="mt-2 pt-2 border-t border-[var(--pixel-ui-border)]">
            <div className="text-[8px] text-[var(--pixel-forest-light)] italic">
              Est. {location.lore.founded}
              {location.lore.peakPopulation > 0 && ` | Peak: ${location.lore.peakPopulation.toLocaleString()}`}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render compass
  const renderCompass = () => (
    <div className="absolute top-4 right-4 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] z-10">
      <div className="text-center">N</div>
      <div className="flex">
        <span>W</span>
        <span className="mx-2 text-[var(--pixel-gold-light)]">✦</span>
        <span>E</span>
      </div>
      <div className="text-center">S</div>
    </div>
  )

  // Render chapter title
  const renderChapterTitle = () => {
    const titles = {
      journey_west: 'Chapter 1: Journey West',
      gold_country: 'Chapter 2: Gold Country',
      return_visit: 'Chapter 3: The Long Road Home',
    }

    return (
      <div className="absolute top-4 left-4 z-10">
        <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm">
          {titles[chapter]}
        </div>
        <div className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
          {discoveredLocations.size} / {chapterLocations.length} locations discovered
        </div>
      </div>
    )
  }

  // Render map background
  const renderBackground = () => {
    if (chapter === 'journey_west') {
      // Wide USA-style background for Chapter 1
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a5a40] via-[#588157] to-[#a3b18a]">
          {/* Subtle terrain texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='%23000' fill-opacity='0.05'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Mountain range indicator */}
          <svg className="absolute bottom-0 w-full h-1/4 opacity-30" viewBox="0 0 100 25" preserveAspectRatio="none">
            <path d="M0,25 L10,15 L25,20 L40,10 L55,18 L70,8 L85,15 L100,12 L100,25 Z" fill="#2d3e23" />
          </svg>
        </div>
      )
    }

    // Gold Country style background for Chapter 2+
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355] via-[#a08060] to-[#c4a574]">
        {/* Mining terrain texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='2' fill='%23000'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Sierra foothills */}
        <svg className="absolute bottom-0 w-full h-1/3 opacity-40" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,30 L5,22 L15,25 L30,15 L45,20 L60,10 L75,18 L90,12 L100,20 L100,30 Z" fill="#6b5040" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden border-4 border-[var(--pixel-ui-border)] rounded-lg">
      {/* Map background */}
      {renderBackground()}

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ zIndex: 1 }}>
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full h-px bg-[var(--pixel-ui-text)]" style={{ top: `${i * 10}%` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full w-px bg-[var(--pixel-ui-text)]" style={{ left: `${i * 10}%` }} />
        ))}
      </div>

      {/* Encounter zones */}
      {renderEncounterZones()}

      {/* Fog of war */}
      {renderFogOfWar()}

      {/* Connection lines */}
      {renderConnections()}

      {/* Location markers */}
      {renderLocations()}

      {/* Player marker */}
      {renderPlayer()}

      {/* Compass */}
      {renderCompass()}

      {/* Chapter title */}
      {renderChapterTitle()}

      {/* Tooltip */}
      {renderTooltip()}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes wagonBob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// MINI MAP COMPONENT (For travel screen)
// ============================================

interface MiniMapProps {
  currentLocationId: string
  discoveredLocations: Set<string>
  chapter: ChapterType
}

export function MiniMap({ currentLocationId, discoveredLocations, chapter }: MiniMapProps) {
  const currentLocation = getLocationById(currentLocationId)
  const connectedLocations = currentLocation ? getConnectedLocations(currentLocationId) : []

  return (
    <div className="relative w-32 h-24 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] rounded overflow-hidden">
      {/* Simple dot representation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-24 h-16">
          {/* Current location (center) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--pixel-gold-light)] rounded-full animate-pulse"
          />

          {/* Connected locations */}
          {connectedLocations.slice(0, 4).map((loc, i) => {
            const angles = [0, 90, 180, 270]
            const angle = angles[i] * Math.PI / 180
            const x = 50 + Math.cos(angle) * 35
            const y = 50 + Math.sin(angle) * 25

            return (
              <div
                key={loc.id}
                className={`absolute w-2 h-2 rounded-full ${
                  discoveredLocations.has(loc.id)
                    ? 'bg-[var(--pixel-ui-text)]'
                    : 'bg-[var(--pixel-ui-border)]'
                }`}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                title={discoveredLocations.has(loc.id) ? loc.name : '???'}
              />
            )
          })}
        </div>
      </div>

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
