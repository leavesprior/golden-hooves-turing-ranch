'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const SettlementHub = lazy(() => import('../components/SettlementHub').then(m => ({ default: m.SettlementHub })))

export function SettlementScreen() {
  const { returnToGoldCountryMap, completeSettlement } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <SettlementHub
        onLeave={returnToGoldCountryMap}
        onComplete={completeSettlement}
      />
    </Suspense>
  )
}
