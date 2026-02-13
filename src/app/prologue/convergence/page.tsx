'use client'

import React from 'react'
import Link from 'next/link'
import { usePrologue } from '../prologueContext'

export default function ConvergencePage() {
  const { canAccessConvergence, getCompletedActCount, state } = usePrologue()

  if (!canAccessConvergence()) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-black to-red-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">{'\uD83D\uDD12'}</div>
          <h2 className="font-pixel text-amber-200 text-lg mb-3">The Convergence</h2>
          <p className="text-amber-400 text-xs mb-4">
            Complete at least 2 character acts to access the Convergence.
          </p>
          <p className="text-amber-500 text-[10px] mb-6">
            Acts completed: {getCompletedActCount()}/4
          </p>
          <Link
            href="/prologue"
            className="font-pixel text-[10px] text-amber-300 border border-amber-600 px-4 py-2 hover:text-amber-100"
          >
            {'\u2190'} Back to Characters
          </Link>
        </div>
      </div>
    )
  }

  // Determine which characters have been completed
  const completedCharacters = Object.entries(state.actProgress)
    .filter(([, progress]) => progress.completed)
    .map(([id]) => id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-red-950 to-black">
      {/* Header */}
      <header className="border-b-2 border-amber-700 bg-black/30 px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">The Convergence</h1>
            <p className="text-amber-400 text-xs mt-1">Tenochtitlan, ~1500 CE</p>
          </div>
          <Link href="/prologue" className="text-amber-400 hover:text-amber-200 text-xs font-pixel">
            {'\u2190'} Prologue
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Central mystery */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{'\uD83C\uDF10'}</div>
          <h2 className="font-pixel text-amber-100 text-lg mb-3">The Year Ce Acatl</h2>
          <p className="text-amber-300 text-sm max-w-lg mx-auto mb-4">
            Cortez approaches the shores of the Aztec Empire. The priests say Quetzalcoatl has returned.
            But you know the truth from your journeys across time and culture.
          </p>
          <p className="text-amber-400 text-xs">
            Use evidence from your completed acts to prove that Cortez is just a man.
          </p>
        </div>

        {/* Evidence from completed acts */}
        <div className="mb-8">
          <h3 className="font-pixel text-amber-200 text-sm mb-4 border-b border-amber-700/30 pb-2">
            Your Evidence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCharacters.map(charId => {
              const names: Record<string, string> = {
                norseman: 'The Norseman\'s Testimony',
                native: 'The Dream Walker\'s Vision',
                califia: 'Califia\'s Battle Records',
                incan: 'The Quipu Reader\'s Proof',
              }
              const evidence: Record<string, string> = {
                norseman: 'Norse rune carvings prove non-divine beings traveled these lands centuries before.',
                native: 'Dream Walking at Cahokia revealed the Great Serpent is a natural force, not a god.',
                califia: 'Military records show gods don\'t need ships, armor, or horses.',
                incan: 'Quipu calculations prove the Ce Acatl year is mathematical coincidence, not prophecy.',
              }
              return (
                <div key={charId} className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <h4 className="font-pixel text-amber-300 text-xs mb-2">{names[charId] || charId}</h4>
                  <p className="text-amber-400/80 text-[10px]">{evidence[charId] || 'Evidence gathered.'}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* The Great Serpent connection */}
        <div className="p-6 bg-red-900/20 border-2 border-red-700/50 rounded-lg mb-8">
          <h3 className="font-pixel text-red-300 text-sm mb-3">The Great Serpent Archetype</h3>
          <p className="text-red-400/80 text-xs mb-4">
            All four cultures share the serpent myth. This is your key to understanding the portal network.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-[9px]">
            <div className="p-2 bg-blue-900/30 border border-blue-700/30 rounded">
              <div className="text-lg mb-1">{'\uD83D\uDC0D'}</div>
              <div className="text-blue-300">Jormungandr</div>
              <div className="text-blue-500">Norse</div>
            </div>
            <div className="p-2 bg-emerald-900/30 border border-emerald-700/30 rounded">
              <div className="text-lg mb-1">{'\uD83D\uDC0D'}</div>
              <div className="text-emerald-300">Uktena</div>
              <div className="text-emerald-500">Mississippian</div>
            </div>
            <div className="p-2 bg-amber-900/30 border border-amber-700/30 rounded">
              <div className="text-lg mb-1">{'\uD83D\uDC0D'}</div>
              <div className="text-amber-300">Alchupo'osh</div>
              <div className="text-amber-500">Chumash</div>
            </div>
            <div className="p-2 bg-red-900/30 border border-red-700/30 rounded">
              <div className="text-lg mb-1">{'\uD83D\uDC0D'}</div>
              <div className="text-red-300">Quetzalcoatl</div>
              <div className="text-red-500">Aztec</div>
            </div>
            <div className="p-2 bg-purple-900/30 border border-purple-700/30 rounded">
              <div className="text-lg mb-1">{'\uD83D\uDC0D'}</div>
              <div className="text-purple-300">Amaru</div>
              <div className="text-purple-500">Incan</div>
            </div>
          </div>
        </div>

        {/* Play convergence */}
        <div className="text-center">
          <Link
            href="/prologue/convergence/play"
            className="inline-block font-pixel text-sm text-amber-100 bg-amber-800 border-2 border-amber-500 px-8 py-4 rounded hover:bg-amber-700 transition-all"
          >
            ENTER TENOCHTITLAN
          </Link>
          <p className="text-amber-600 text-[9px] mt-3">
            Your discoveries will determine the fate of an empire.
          </p>
        </div>
      </main>
    </div>
  )
}
