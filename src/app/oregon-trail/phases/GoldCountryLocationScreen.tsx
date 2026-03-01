'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const GoldCountryLocation = lazy(() => import('../components/GoldCountryLocation').then(m => ({ default: m.GoldCountryLocation })))

export function GoldCountryLocationScreen() {
  const { state, returnToGoldCountryMap, setPhase } = useOregonTrail()

  const locationId = state.currentGoldCountryLocation || 'bobr_cabin'

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryLocation
        locationId={locationId}
        onReturnToMap={returnToGoldCountryMap}
        onOpenSettlement={() => {
          setPhase('settlement')
        }}
      />
    </Suspense>
  )
}
