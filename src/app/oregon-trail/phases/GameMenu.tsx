'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useOregonTrail } from '../oregonTrailContext'
import { KarmaToastContainer } from '@/components/karma'

export function GameMenu() {
  const { state, startGame } = useOregonTrail()
  const [leaderName, setLeaderName] = useState('')
  const [partyNames, setPartyNames] = useState(['', '', ''])

  const handleStart = () => {
    if (!leaderName.trim()) return
    const validPartyNames = partyNames.filter(n => n.trim())
    startGame(leaderName.trim(), validPartyNames)
  }

  const updatePartyName = (index: number, value: string) => {
    setPartyNames(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-amber-950 flex items-center justify-center p-4">
      <KarmaToastContainer />

      <div className="max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{'\uD83E\uDD20'}</div>
          <h1 className="font-pixel text-amber-200 text-2xl mb-2">Where in Gold Country</h1>
          <h2 className="font-pixel text-red-400 text-xl mb-2">is Black Bart?</h2>
          <p className="text-amber-400 text-sm">A Pinkerton Mystery</p>
          <p className="text-amber-600 text-xs mt-2 italic">
            The Emigrant Trail {'\u00D7'} Carmen Sandiego {'\u00D7'} Fallout
          </p>
        </div>

        {/* Start form */}
        <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-6">
          <h2 className="font-pixel text-amber-200 text-sm mb-4 text-center">
            Begin Your Journey
          </h2>

          {/* Leader name */}
          <div className="mb-4">
            <label className="block text-amber-400 text-xs mb-1 font-pixel">
              Wagon Leader Name:
            </label>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-amber-950 border-2 border-amber-600 rounded text-amber-100 font-pixel text-sm placeholder-amber-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Party members */}
          <div className="mb-6">
            <label className="block text-amber-400 text-xs mb-2 font-pixel">
              Party Members (optional):
            </label>
            <div className="space-y-2">
              {partyNames.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  value={name}
                  onChange={(e) => updatePartyName(index, e.target.value)}
                  placeholder={`Party member ${index + 1}`}
                  className="w-full px-3 py-2 bg-amber-950 border-2 border-amber-700 rounded text-amber-100 font-pixel text-xs placeholder-amber-700 focus:outline-none focus:border-amber-500"
                />
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!leaderName.trim()}
            className={`
              w-full py-3 font-pixel text-sm rounded border-4 transition-all
              ${leaderName.trim()
                ? 'bg-green-700 border-green-500 text-green-100 hover:bg-green-600'
                : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'}
            `}
          >
            Start Journey
          </button>
        </div>

        {/* Game info */}
        <div className="mt-6 text-center">
          <p className="text-amber-500 text-xs mb-4">
            You're a Pinkerton agent pursuing the notorious Black Bart gang
            across 2,000 miles of frontier. Gather clues, interview witnesses,
            and issue warrants. But beware - your narrator may not be reliable...
          </p>
          <Link
            href="/hub"
            className="text-amber-400 hover:text-amber-200 text-xs font-pixel transition-colors"
          >
            &larr; Back to Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
