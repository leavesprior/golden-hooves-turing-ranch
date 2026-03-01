'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export function GameOverScreen() {
  const { state, resetGame } = useOregonTrail()

  // Log game over event (fires on render — pre-existing behavior)
  CrossGameStorage.logEvent(
    'prospectors_tale', 'party_member_died',
    `Journey ended: ${state.message || 'The trail claimed another'}`,
    { detail: `Day ${state.daysOnTrail}, ${state.totalMilesTraveled} miles` }
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">☠️</div>
        <h1 className="font-pixel text-red-400 text-2xl mb-4">Game Over</h1>
        <p className="text-gray-400 mb-6">{state.message}</p>
        <p className="text-gray-500 text-sm mb-8">
          Days on trail: {state.daysOnTrail} | Miles traveled: {state.totalMilesTraveled}
        </p>
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-4 border-amber-500"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
