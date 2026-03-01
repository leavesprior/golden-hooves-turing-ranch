'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const SettlementVictory = lazy(() => import('../components/SettlementVictory').then(m => ({ default: m.SettlementVictory })))

export function SettlementVictoryScreen() {
  const { resetGame } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <SettlementVictory onPlayAgain={resetGame} />
    </Suspense>
  )
}
