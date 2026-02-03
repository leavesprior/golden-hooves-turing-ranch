'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type ChapterType } from '../../data/worldMaps'
import { CHAPTER_1_TERRAIN, CHAPTER_2_TERRAIN, meetsMinTier } from './terrainData'

interface MapTerrainProps {
  chapter: ChapterType
  graphicsTier: GraphicsTier
}

export function MapTerrain({ chapter, graphicsTier }: MapTerrainProps) {
  const terrainFeatures = React.useMemo(() => {
    switch (chapter) {
      case 'journey_west':
        return CHAPTER_1_TERRAIN
      case 'gold_country':
        return CHAPTER_2_TERRAIN
      case 'return_visit':
        return [...CHAPTER_1_TERRAIN, ...CHAPTER_2_TERRAIN]
      default:
        return []
    }
  }, [chapter])

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
