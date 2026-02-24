'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import { KarmaToastContainer } from '@/components/karma'
import GoldCountryBooking from '../components/GoldCountryBooking'

export function GoldCountryArrivalScreen() {
  const { state, enterSettlement, leaveSettlement, resetGame } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const { autoStartFirstCase } = useMystery()
  const [showBooking, setShowBooking] = useState(false)

  // Calculate karma score and outlaws caught for discount tier
  const karmaScore = balance.good + Math.floor(balance.neutral / 2)
  const outlawsCaught = state.outlawsCaught || 0

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

        {/* NEW: Back of Beyond Ranch Booking Offer */}
        <div className="bg-yellow-900/40 border-2 border-yellow-600 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-yellow-300 font-pixel text-sm mb-2">{'\uD83C\uDFC6'} Special Reward Unlocked!</p>
            <p className="text-yellow-200 text-xs mb-3">
              Your journey has earned you a discount at Back of Beyond Ranch
            </p>
            <button
              onClick={() => setShowBooking(true)}
              className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded border-2 border-yellow-400 transition-all"
            >
              {'\uD83D\uDD17'} Claim Your Reward
            </button>
          </div>
        </div>

        {/* Choice */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-6 mb-6">
          <p className="text-amber-300 text-center mb-6">
            The frontier awaits. Will you stake your claim and build a life here in Gold Country,
            or move on to new adventures?
          </p>

          <div className="space-y-4">
            <button
              onClick={() => { autoStartFirstCase(); enterSettlement() }}
              className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-lg rounded border-4 border-amber-500 transition-colors"
            >
              {'\uD83C\uDFE0'} Stake Your Claim
            </button>
            <p className="text-gray-500 text-xs text-center">
              Build a ranch, mine for gold, and become a legend of Gold Country
            </p>

            <button
              onClick={leaveSettlement}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-sm rounded border-2 border-gray-500 transition-colors"
            >
              {'\uD83D\uDEB6'} Continue Your Journey
            </button>
            <p className="text-gray-500 text-xs text-center">
              You've reached your destination - claim victory and move on
            </p>
          </div>
        </div>

        {/* Back to Hub */}
        <div className="text-center">
          <button
            onClick={resetGame}
            className="text-amber-500 hover:text-amber-300 text-xs font-pixel transition-colors"
          >
            Start Over
          </button>
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
