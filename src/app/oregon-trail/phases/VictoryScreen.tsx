'use client'

import Link from 'next/link'
import { useOregonTrail } from '../oregonTrailContext'
import { KarmaWallet } from '../components/KarmaWallet'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export function VictoryScreen() {
  const { state, resetGame } = useOregonTrail()

  // Log journey complete event (fires on render — pre-existing behavior)
  const survivors = state.party.filter(m => m.health > 0)
  CrossGameStorage.logEvent(
    'prospectors_tale', 'survived_trail',
    `Survived the Trail with ${survivors.length} companion${survivors.length !== 1 ? 's' : ''}!`,
    { detail: `Day ${state.daysOnTrail}, ${survivors.length} survivors`, survivorName: survivors[0]?.name }
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="font-pixel text-yellow-300 text-2xl mb-4">You Made It!</h1>
        <p className="text-amber-300 mb-6">Welcome to Gold Country, California!</p>
        <div className="text-amber-400 text-sm mb-8 space-y-1">
          <p>Days on trail: {state.daysOnTrail}</p>
          <p>Party members surviving: {state.party.filter(m => m.health > 0).length}</p>
          <div className="flex items-center justify-center gap-2">
            <span>Karma:</span>
            <KarmaWallet compact />
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-4 border-amber-500"
          >
            Play Again
          </button>
          <Link
            href="/hub"
            className="px-6 py-3 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-4 border-green-500"
          >
            Back to Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
