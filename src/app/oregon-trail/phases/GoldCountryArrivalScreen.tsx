'use client'

import React, { useState, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import { KarmaToastContainer } from '@/components/karma'
import { useCrossGame } from '@/lib/crossGameProgressionContext'
import GoldCountryBooking from '../components/GoldCountryBooking'
import { writePostWinChoice } from '@/lib/arcadeFirstLevel'

export function GoldCountryArrivalScreen() {
  const { state, enterSettlement } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const { state: mysteryState } = useMystery()
  const { recordMilestone } = useCrossGame()
  const [showBooking, setShowBooking] = useState(false)

  // Reaching Gold Country IS the trail victory — this screen mounts exactly
  // once when the party arrives (travelEngine sets phase gold_country_arrival
  // at 2000mi). The auto-driver/2000mi victory path never touched the
  // WorldMap/chapter machine that used to emit this milestone, so a full trail
  // win left bobr_cross_game_progression.milestones empty and Ranch Treasure
  // Hunt (gated on reached_west_point) never unlocked. Emit it here — the
  // single, canonical victory point. recordMilestone dedupes, so a player who
  // also reached West Point via the WorldMap path is never double-counted.
  //
  // A1 (dual-emit): `reached_west_point` is kept for back-compat (the Ranch
  // Treasure Hunt gate), but it is semantically "beat the trail," NOT "visited
  // West Point town" — a party can win without ever stopping in the town. Also
  // emit `trail_victory`, the honestly-named beat-the-trail event, so future
  // town-quests can gate on a true `visited_west_point` without mis-firing here.
  //
  // Run ONCE on mount — recordMilestone is intentionally omitted from deps: its
  // identity churns on every mint (useCallback dep [state.milestones]), so
  // listing it re-runs this effect after the mint and re-fires recordMilestone
  // in a render loop. It dedupes, so the mount-time closure call is correct.
  useEffect(() => {
    recordMilestone('reached_west_point', 'prospectors_tale')
    recordMilestone('trail_victory', 'prospectors_tale')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate karma score and outlaws caught for discount tier
  const karmaScore = balance.good + Math.floor(balance.neutral / 2)
  // Trail reducer never writes outlawsCaught; the Pinkerton catch lives on mysteryState.
  const outlawsCaught = Math.max(state.outlawsCaught || 0, mysteryState.outlawsCaught || 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
      <KarmaToastContainer />
      <div className="max-w-lg w-full">
        {/* Welcome Banner */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{'\uD83C\uDFD4\uFE0F'}</div>
          <h1 className="font-pixel text-yellow-300 text-3xl mb-2">Gold Country!</h1>
          <p className="text-amber-300 text-lg mb-4">You've reached the end of the trail!</p>
          <p className="text-amber-500 text-sm">
            After {state.daysOnTrail} days on the trail, you and your party of{' '}
            {state.party.filter(m => m.health > 0).length} have arrived.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
          <h2 className="text-amber-400 font-pixel text-sm mb-3 text-center">Your Resources</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-amber-200 font-pixel text-lg">{balance.neutral}{'\uD83C\uDF2E'}</p>
              <p className="text-gray-500 text-xs">Coins</p>
            </div>
            <div>
              <p className="text-green-200 font-pixel text-lg">{balance.good}{'\uD83C\uDF6A'}</p>
              <p className="text-gray-500 text-xs">Good Karma</p>
            </div>
            <div>
              <p className="text-amber-200 font-pixel text-lg">{state.food}</p>
              <p className="text-gray-500 text-xs">Food (lbs)</p>
            </div>
          </div>
        </div>

        {/* Arcade post-win: take the first discount, or risk it for the next level. */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-6 mb-6">
          <p className="text-amber-100 text-center text-lg mb-6 font-serif">
            Take the first discount now, or risk it on the next level for a higher one.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                writePostWinChoice('take_discount')
                setShowBooking(true)
              }}
              className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif text-xl rounded border-4 border-amber-500 transition-colors"
            >
              Take the discount
            </button>
            <p className="text-amber-200/80 text-base text-center font-serif">
              Send a message on Airbnb when requesting to book. The host provides the discount.
            </p>
            <button
              onClick={() => {
                writePostWinChoice('risk_next')
                enterSettlement()
              }}
              className="w-full py-3 bg-black/60 hover:bg-black/40 text-amber-100 font-serif text-lg rounded border-2 border-amber-700 transition-colors"
            >
              Risk it — play the next level
            </button>
            <p className="text-amber-200/70 text-base text-center font-serif">
              Gold Country: a holistic detective, a time-slipped old-west warrant, and a Sandiego noir chase through real towns.
              Higher discount if you finish. The ranch-house QR opens the porch map when you are there — leave GPS on.
            </p>
          </div>
        </div>
      </div>

      {/* Gold Country Booking Modal */}
      {showBooking && (
        <GoldCountryBooking
          playerName={state.party[0]?.name || 'Traveler'}
          partySize={state.party.filter(m => m.health > 0).length}
          karmaScore={karmaScore}
          outlawsCaught={outlawsCaught}
          daysOnTrail={state.daysOnTrail}
          onClose={() => setShowBooking(false)}
          onBookingIntent={() => {}}
          graphicsTier={state.graphicsTier}
        />
      )}
    </div>
  )
}
