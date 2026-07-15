'use client'

import { Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const SettlementHub = lazy(() => import('../components/SettlementHub').then(m => ({ default: m.SettlementHub })))

export function SettlementScreen() {
  const { returnToGoldCountryMap, completeSettlement, enterLivingTrail } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <SettlementHub
        onLeave={returnToGoldCountryMap}
        onComplete={completeSettlement}
      />
      {/* Living Trail entry — a real-world walk in West Point, CA (always visible: it's the point of the product) */}
      <button
        onClick={enterLivingTrail}
        title="Living Trail — a real-world walk in West Point, CA. Visit the actual historic sites to meet the ghosts."
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-950/90 px-3 py-2 font-[var(--font-pixel)] text-[11px] text-emerald-100 shadow-lg transition-colors hover:bg-emerald-900"
      >
        🥾 Living Trail (real world)
      </button>
    </Suspense>
  )
}
