'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useOregonTrail } from '../oregonTrailContext'
import { useCharacter } from '../characterContext'
import { KarmaToastContainer } from '@/components/karma'

/** Level 1 wagon-name step. Not a second game. Pinkerton/Bart wait in Gold Country. */
export function GameMenu() {
  const { startGame } = useOregonTrail()
  const { clearCharacter } = useCharacter()
  const [leaderName, setLeaderName] = useState('')
  const [partyNames, setPartyNames] = useState(['', '', ''])

  const handleStart = () => {
    if (!leaderName.trim()) return
    const validPartyNames = partyNames.filter(n => n.trim())
    // New wagon: drop any leftover sheet so S.A.D.D.L.E. is the person you play.
    clearCharacter()
    try { localStorage.removeItem('bobr_ot_character') } catch { /* ignore */ }
    queueMicrotask(() => startGame(leaderName.trim(), validPartyNames))
  }

  const updatePartyName = (index: number, value: string) => {
    setPartyNames(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const field =
    'w-full min-h-11 px-4 py-3 bg-black/40 border-2 border-amber-700/70 rounded text-amber-50 font-serif text-lg placeholder-amber-700/80 focus:outline-none focus:border-amber-400'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1b] via-amber-950 to-black flex items-center justify-center p-4">
      <KarmaToastContainer />

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="font-serif text-base uppercase tracking-[0.22em] text-amber-200/80">Golden Frog Trail</p>
          <h1 className="mt-2 font-serif text-4xl text-amber-50">Name the wagon</h1>
          <p className="mt-3 font-serif text-lg text-amber-100/90">
            First camp: Independence. Kansas keeps a Bridge of Death.
            Answer the questions three. A towel is never wasted.
          </p>
        </div>

        <div className="bg-amber-950/50 border-2 border-amber-700 rounded-lg p-6">
          <label className="block font-serif text-lg text-amber-200 mb-2">Wagon leader</label>
          <input
            type="text"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            placeholder="Your name"
            className={field}
            autoComplete="nickname"
          />

          <p className="mt-6 font-serif text-lg text-amber-200 mb-2">Party (optional)</p>
          <div className="space-y-2">
            {partyNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => updatePartyName(index, e.target.value)}
                placeholder={`Companion ${index + 1}`}
                className={field}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={!leaderName.trim()}
            className={`w-full min-h-11 mt-6 py-3 font-serif text-xl rounded transition-colors ${
              leaderName.trim()
                ? 'bg-[#e8dcc4] text-[#1a1208] hover:opacity-90'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Outfit the wagon
          </button>
        </div>

        <p className="mt-6 text-center font-serif text-base text-amber-200/80">
          A warrant rides along. The Sandiego chase waits in Gold Country.
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="font-serif text-lg text-amber-100 underline underline-offset-4">
            Back to the ranch
          </Link>
        </p>
      </div>
    </div>
  )
}
