'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type ChapterType } from '../../data/worldMaps'
import { CHAPTER_1_TERRAIN, CHAPTER_2_TERRAIN, meetsMinTier, type TerrainFeature } from './terrainData'
import { type MapViewBox, terrainInImmediateArea } from './immediateArea'

interface MapTerrainProps {
  chapter: ChapterType
  graphicsTier: GraphicsTier
  /** When set, only terrain that intersects this neighborhood is drawn. */
  area?: MapViewBox
}

export function MapTerrain({ chapter, graphicsTier, area }: MapTerrainProps) {
  const terrainFeatures = React.useMemo(() => {
    let features: TerrainFeature[]
    switch (chapter) {
      case 'journey_west':
        features = CHAPTER_1_TERRAIN
        break
      case 'gold_country':
        features = CHAPTER_2_TERRAIN
        break
      case 'return_visit':
        features = [...CHAPTER_1_TERRAIN, ...CHAPTER_2_TERRAIN]
        break
      default:
        features = []
    }
    return area ? terrainInImmediateArea(features, area) : features
  }, [chapter, area])

  const visibleFeatures = terrainFeatures.filter(f => meetsMinTier(graphicsTier, f.minTier))

  return (
    <g className="map-terrain">
      {visibleFeatures.map(feature => (
        <path
          key={feature.id}
          d={feature.d}
          fill={`url(#${feature.patternRef})`}
          opacity={feature.opacity ?? 0.6}
          className={feature.type === 'river' && graphicsTier === 'ultra_64bit' ? 'map-water-animated' : undefined}
        />
      ))}
    </g>
  )
}

export default MapTerrain
