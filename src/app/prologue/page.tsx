'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePrologue, type PrologueCharacterId } from './prologueContext'
import { useCrossGame } from '@/lib/crossGameProgressionContext'
import { BookingGate } from '@/components/game/BookingGate'

const CHARACTERS: {
  id: PrologueCharacterId
  name: string
  era: string
  setting: string
  icon: string
  color: string
  mechanic: string
  description: string
}[] = [
  {
    id: 'norseman',
    name: 'The Norseman',
    era: '~1000 CE',
    setting: 'Vinland to Cahokia',
    icon: '\u2693',
    color: 'from-blue-900 to-blue-950',
    mechanic: 'Fylguir Spirit Tracking',
    description: 'Follow spirit animals west from L\'Anse aux Meadows through uncharted lands.',
  },
  {
    id: 'native',
    name: 'The Native',
    era: '~1000-1100 CE',
    setting: 'Cahokia & Beyond',
    icon: '\uD83C\uDF3F',
    color: 'from-emerald-900 to-emerald-950',
    mechanic: 'Dream Walking',
    description: 'Walk between worlds at the heart of the greatest city in North America.',
  },
  {
    id: 'califia',
    name: 'Califia',
    era: '~1200 CE',
    setting: 'California Coast',
    icon: '\uD83D\uDDE1\uFE0F',
    color: 'from-amber-900 to-amber-950',
    mechanic: 'Warrior Strategy',
    description: 'Command warriors and uncover the truth behind the Island of California.',
  },
  {
    id: 'incan',
    name: 'The Incan Child',
    era: '~1400 CE',
    setting: 'Titicaca to Nazca',
    icon: '\uD83D\uDD2E',
    color: 'from-purple-900 to-purple-950',
    mechanic: 'Hieroglyphic Puzzles',
    description: 'Decode quipus and follow the trail of Viracocha toward the stars.',
  },
]

export default function ProloguePage() {
  const { state, selectCharacter, isCharacterUnlocked, getCompletedActCount } = usePrologue()
  const { isUnlocked, hasMilestone } = useCrossGame()
  const [showGate, setShowGate] = useState(!isUnlocked('prologue'))
  const [selectedForDetail, setSelectedForDetail] = useState<PrologueCharacterId | null>(null)

  const handleGateUnlocked = useCallback(() => {
    setShowGate(false)
  }, [])

  if (showGate && !hasMilestone('booking_verified')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-black to-purple-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <BookingGate onUnlocked={handleGateUnlocked} onClose={() => window.history.back()} />
        </div>
      </div>
    )
  }

  const completedActs = getCompletedActCount()
  const selectedDetail = selectedForDetail ? CHARACTERS.find(c => c.id === selectedForDetail) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-black to-purple-950">
      {/* Header */}
      <header className="border-b-2 border-purple-700 bg-indigo-950/50 px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-purple-200 text-xl">Play The Prologue</h1>
            <p className="text-purple-400 text-xs mt-1">600 - 1500 AD: Before the Gold Rush</p>
          </div>
          <Link
            href="/hub"
            className="text-purple-400 hover:text-purple-200 text-xs font-pixel transition-colors"
          >
            {'\u2190'} Hub
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title card */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{'\uD83C\uDFDB\uFE0F'}</div>
          <h2 className="font-pixel text-purple-100 text-2xl mb-2">The Ancient Americas</h2>
          <p className="text-purple-300 text-sm max-w-lg mx-auto">
            Four civilizations. One mystery. Investigate artifacts, solve puzzles, and uncover
            the truth behind the ancient portal network.
          </p>
          <p className="text-purple-500 text-xs mt-3">
            Detective Rank: <span className="text-purple-300">{state.detectiveRank.replace(/_/g, ' ')}</span>
            {' '}{'\u2022'}{' '}
            Acts Completed: <span className="text-purple-300">{completedActs}/4</span>
          </p>
        </div>

        {/* Character selection grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CHARACTERS.map(char => {
            const unlocked = isCharacterUnlocked(char.id)
            const actProgress = state.actProgress[char.id]
            const episodesCompleted = actProgress.episodes.filter(e => e.status === 'completed').length

            return (
              <div
                key={char.id}
                onClick={() => unlocked && setSelectedForDetail(char.id)}
                className={`
                  relative p-6 border-4 rounded-lg transition-all duration-300 cursor-pointer
                  bg-gradient-to-b ${char.color}
                  ${unlocked
                    ? 'border-purple-500 hover:border-purple-400 hover:scale-[1.02]'
                    : 'border-gray-700 opacity-50 cursor-not-allowed'}
                  ${selectedForDetail === char.id ? 'ring-2 ring-purple-400' : ''}
                `}
              >
                {actProgress.completed && (
                  <div className="absolute -top-3 -right-3 bg-green-600 text-white text-[8px] font-pixel px-2 py-1 rounded">
                    COMPLETE
                  </div>
                )}
                {!unlocked && (
                  <div className="absolute -top-3 -right-3 bg-gray-600 text-gray-300 text-[8px] font-pixel px-2 py-1 rounded">
                    LOCKED
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{unlocked ? char.icon : '\uD83D\uDD12'}</div>
                  <div className="flex-1">
                    <h3 className="font-pixel text-purple-200 text-sm">{char.name}</h3>
                    <p className="text-purple-400 text-[10px] mt-1">{char.era} {'\u2022'} {char.setting}</p>
                    <p className="text-purple-300/70 text-xs mt-2">{char.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[9px] bg-purple-800/60 text-purple-300 px-2 py-0.5 rounded">
                        {char.mechanic}
                      </span>
                      {unlocked && (
                        <span className="text-[9px] text-purple-400">
                          Episodes: {episodesCompleted}/3
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected character detail panel */}
        {selectedDetail && (
          <div className={`p-6 border-2 border-purple-600 rounded-lg bg-gradient-to-b ${selectedDetail.color} mb-8`}>
            <h3 className="font-pixel text-purple-200 text-sm mb-3">
              {selectedDetail.name} -- {selectedDetail.era}
            </h3>
            <p className="text-purple-300 text-xs mb-4">{selectedDetail.description}</p>
            <div className="flex gap-3">
              <Link
                href={`/prologue/${selectedDetail.id}`}
                onClick={() => selectCharacter(selectedDetail.id)}
                className="font-pixel text-[11px] text-purple-100 bg-purple-700 border-2 border-purple-500 px-6 py-3 rounded hover:bg-purple-600 transition-all"
              >
                {state.actProgress[selectedDetail.id].episodes.some(e => e.status === 'in_progress')
                  ? 'CONTINUE'
                  : 'BEGIN ACT'}
              </Link>
              <button
                onClick={() => setSelectedForDetail(null)}
                className="font-pixel text-[9px] text-purple-400 border border-purple-700 px-4 py-2 rounded hover:text-purple-200"
              >
                BACK
              </button>
            </div>
          </div>
        )}

        {/* Convergence */}
        <div className={`
          p-6 border-4 rounded-lg text-center transition-all
          ${completedActs >= 2
            ? 'bg-gradient-to-b from-amber-900/40 to-purple-900/40 border-amber-600 cursor-pointer hover:border-amber-400'
            : 'bg-gray-900/40 border-gray-700 opacity-50'}
        `}>
          <div className="text-4xl mb-3">{completedActs >= 2 ? '\uD83C\uDF10' : '\uD83D\uDD12'}</div>
          <h3 className="font-pixel text-amber-200 text-sm mb-1">The Convergence</h3>
          <p className="text-purple-400 text-xs">
            {completedActs >= 2
              ? 'Tenochtitlan, ~1500 CE. Prove that Cortez is mortal.'
              : `Complete ${2 - completedActs} more act${2 - completedActs !== 1 ? 's' : ''} to unlock.`}
          </p>
          {completedActs >= 2 && (
            <Link
              href="/prologue/convergence"
              className="inline-block mt-4 font-pixel text-[11px] text-amber-100 bg-amber-800 border-2 border-amber-600 px-6 py-3 rounded hover:bg-amber-700 transition-all"
            >
              ENTER CONVERGENCE
            </Link>
          )}
        </div>

        {/* Guide link */}
        <div className="mt-8 text-center">
          <Link
            href="/prologue/guide"
            className="text-purple-400 hover:text-purple-200 text-xs font-pixel transition-colors"
          >
            {'\uD83D\uDCD6'} Open The Guide Encyclopedia
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-purple-800 bg-indigo-950/50 px-4 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-purple-600 text-xs">
          &copy; 2026 Back of Beyond Ranch | The Prologue
        </div>
      </footer>
    </div>
  )
}
