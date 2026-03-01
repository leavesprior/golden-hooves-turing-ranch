'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const GoldCountryTravel = lazy(() => import('../components/GoldCountryTravel').then(m => ({ default: m.GoldCountryTravel })))

export function GoldCountryTravelScreen() {
  const { state, arriveAtGoldCountryLocation, returnToGoldCountryMap } = useOregonTrail()

  const fromId = state.currentGoldCountryLocation || 'bobr_cabin'
  const toId = state.travelingToLocation || 'bobr_cabin'

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryTravel
        fromLocationId={fromId}
        toLocationId={toId}
        onArrive={(locationId) => {
          arriveAtGoldCountryLocation(locationId)
        }}
        onReturnToMap={returnToGoldCountryMap}
      />
    </Suspense>
  )
}
