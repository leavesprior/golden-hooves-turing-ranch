'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const RanchManagement = lazy(() => import('../components/RanchManagement').then(m => ({ default: m.RanchManagement })))

export function RanchManagementScreen() {
  const { closeRanchManagement } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <RanchManagement onClose={closeRanchManagement} />
    </Suspense>
  )
}
