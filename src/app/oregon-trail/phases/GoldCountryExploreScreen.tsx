'use client'

import { useState, Suspense, lazy } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { LazyFallback } from './LazyFallback'

const GoldCountryExplore = lazy(() => import('../components/GoldCountryExplore').then(m => ({ default: m.GoldCountryExplore })))
const QuestLog = lazy(() => import('../components/QuestLog').then(m => ({ default: m.QuestLog })))

export function GoldCountryExploreScreen() {
  const {
    state,
    visitGoldCountryLocation,
    startGoldCountryTravel,
    leaveSettlement,
    setPhase,
  } = useOregonTrail()
  const [showQuestLog, setShowQuestLog] = useState(false)

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryExplore
        onVisitLocation={(locationId) => {
          visitGoldCountryLocation(locationId)
        }}
        onTravel={(toLocationId) => {
          startGoldCountryTravel(toLocationId)
        }}
        onOpenSettlement={() => {
          setPhase('settlement')
        }}
        onOpenQuestLog={() => setShowQuestLog(true)}
        onLeave={leaveSettlement}
      />
      {showQuestLog && <QuestLog onClose={() => setShowQuestLog(false)} />}
    </Suspense>
  )
}
