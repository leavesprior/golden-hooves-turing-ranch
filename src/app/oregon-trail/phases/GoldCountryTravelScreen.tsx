'use client'

import { Suspense, lazy, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'
import type { GoldCountryTripResult } from '../state/goldCountryTrip'

const GoldCountryTravel = lazy(() => import('../components/GoldCountryTravel').then(m => ({ default: m.GoldCountryTravel })))

export function GoldCountryTravelScreen() {
  const { state, arriveAtGoldCountryLocation, cancelGoldCountryTravel, returnToGoldCountryMap } = useOregonTrail()
  const tripId = state.goldCountryTrip?.id
  const onArrive = useCallback((locationId: string) => arriveAtGoldCountryLocation(locationId, tripId ?? ''), [arriveAtGoldCountryLocation, tripId])
  const onReturn = useCallback((): GoldCountryTripResult => {
    if (!tripId) { returnToGoldCountryMap(); return { ok: true } }
    return cancelGoldCountryTravel()
  }, [tripId, returnToGoldCountryMap, cancelGoldCountryTravel])
  return <Suspense fallback={<LazyFallback />}>
    <GoldCountryTravel key={tripId ?? 'legacy'}
      fromLocationId={state.currentGoldCountryLocation || 'bobr_cabin'}
      toLocationId={state.travelingToLocation || 'bobr_cabin'}
      onArrive={onArrive} onReturnToMap={onReturn} />
  </Suspense>
}
