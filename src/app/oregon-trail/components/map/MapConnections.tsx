'use client'

import React, { useMemo } from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type MapLocation, type ChapterType, getLocationById } from '../../data/worldMaps'
import { getPathControlPoints, buildConnectionPath } from './terrainData'

interface MapConnectionsProps {
  locations: MapLocation[]
  discoveredLocations: Set<string>
  scoutableLocations: Set<string>
  currentLocationId: string
  hoveredLocationId: string | null
  graphicsTier: GraphicsTier
  chapter: ChapterType
}

export function MapConnections({
  locations,
  discoveredLocations,
  scoutableLocations,
  currentLocationId,
  hoveredLocationId,
  graphicsTier,
}: MapConnectionsProps) {
  const connections = useMemo(() => {
    const result: Array<{
      key: string
      d: string
      isCurrentPath: boolean
      isToScoutable: boolean
    }> = []
    const rendered = new Set<string>()

    locations.forEach(location => {
      if (!discoveredLocations.has(location.id)) return

      location.connectedTo.forEach(connectedId => {
        const connectionKey = [location.id, connectedId].sort().join('-')
        if (rendered.has(connectionKey)) return
        rendered.add(connectionKey)

        const connected = getLocationById(connectedId)
        if (!connected) return

        const connectedDiscovered = discoveredLocations.has(connectedId)
        const connectedScoutable = scoutableLocations.has(connectedId)

        // Skip if target is neither discovered nor scoutable
        if (!connectedDiscovered && !connectedScoutable) return

        const isCurrentPath =
          (currentLocationId === location.id && hoveredLocationId === connectedId) ||
          (currentLocationId === connectedId && hoveredLocationId === location.id)

        const isToScoutable = !connectedDiscovered && connectedScoutable

        // Build the path
        const controlPoints = getPathControlPoints(location.id, connectedId)
        const d = buildConnectionPath(
          location.x, location.y,
          connected.x, connected.y,
          controlPoints,
          graphicsTier,
        )

        result.push({ key: connectionKey, d, isCurrentPath, isToScoutable })
      })
    })

    return result
  }, [locations, discoveredLocations, scoutableLocations, currentLocationId, hoveredLocationId, graphicsTier])

  return (
    <g className="map-connections">
      {connections.map(({ key, d, isCurrentPath, isToScoutable }) => (
        <path
          key={key}
          d={d}
          fill="none"
          stroke={
            isCurrentPath
              ? 'var(--pixel-gold-light)'
              : isToScoutable
              ? '#8b6914'
              : 'var(--pixel-ui-border)'
          }
          strokeWidth={isCurrentPath ? 1.5 : 0.5}
          strokeDasharray={
            isToScoutable
              ? '1,2'
              : isCurrentPath
              ? undefined
              : '2,2'
          }
          opacity={isToScoutable ? 0.3 : isCurrentPath ? 1 : 0.5}
          className={isCurrentPath ? 'map-path-active' : undefined}
          style={{ transition: 'all 0.3s ease' }}
        />
      ))}
    </g>
  )
}

export default MapConnections
