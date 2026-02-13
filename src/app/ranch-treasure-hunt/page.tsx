'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCrossGame } from '@/lib/crossGameProgressionContext'
import { CrossGameStorage, type TimeEchoId } from '@/lib/crossGameProgression'
import { useKarma } from '@/lib/karmaContext'

const ECHO_RIDDLES: Record<string, { riddle: string; answer: string; story: string }> = {
  norse_runestone: {
    riddle: 'What ancient people sailed west centuries before Columbus?',
    answer: 'norse',
    story: 'The Norseman carried this runestone across the Atlantic. Its markings tell of a voyage to Vinland and beyond.',
  },
  cahokian_mound_earth: {
    riddle: 'What great city of mounds stood near the Mississippi?',
    answer: 'cahokia',
    story: 'Sacred earth from the mound builders. The native peoples carried this soil as a blessing for the land.',
  },
  chumash_star_chart: {
    riddle: 'What coastal California people were master astronomers and canoe builders?',
    answer: 'chumash',
    story: 'Queen Califia\'s people mapped the stars. This chart guided travelers across the Pacific coast.',
  },
  guide_ranch_comment: {
    riddle: 'What mysterious figure appears throughout all timelines?',
    answer: 'guide',
    story: '"A rather nice ranch," the Guide once said, peering through the centuries. The prophecy echoes still.',
  },
}

export default function RanchTreasureHuntPage() {
  const { isUnlocked, hasMilestone, getActiveBounties, state } = useCrossGame()
  const { alignmentPosition } = useKarma()
  const [isReady, setIsReady] = useState(false)
  const [activeRiddle, setActiveRiddle] = useState<string | null>(null)
  const [riddleAnswer, setRiddleAnswer] = useState('')
  const [riddleResult, setRiddleResult] = useState<{ correct: boolean; story?: string } | null>(null)

  useEffect(() => {
    setIsReady(true)
  }, [])

  const handleEchoClick = useCallback((echoId: string) => {
    const discovered = state.timeEchoes[echoId as keyof typeof state.timeEchoes]
    if (discovered) return // Already found
    setActiveRiddle(echoId)
    setRiddleAnswer('')
    setRiddleResult(null)
  }, [state.timeEchoes])

  const handleRiddleSubmit = useCallback(() => {
    if (!activeRiddle) return
    const riddle = ECHO_RIDDLES[activeRiddle]
    if (!riddle) return
    const isCorrect = riddleAnswer.trim().toLowerCase().includes(riddle.answer)
    if (isCorrect) {
      CrossGameStorage.discoverTimeEcho(activeRiddle as TimeEchoId)
      setRiddleResult({ correct: true, story: riddle.story })
    } else {
      setRiddleResult({ correct: false })
    }
    setRiddleAnswer('')
  }, [activeRiddle, riddleAnswer])

  if (!isReady) return null

  const unlocked = isUnlocked('ranch_treasure_hunt')

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">{'\uD83D\uDD12'}</div>
          <h2 className="font-pixel text-amber-200 text-lg mb-3">Ranch Treasure Hunt</h2>
          <p className="text-amber-400 text-xs mb-4">
            This adventure unlocks when you reach West Point in The Prospector's Tale.
          </p>
          <p className="text-amber-500 text-[10px] mb-6">
            The trail to Back of Beyond Ranch begins at the frontier's edge.
          </p>
          <div className="space-y-3">
            <Link
              href="/oregon-trail"
              className="block font-pixel text-[10px] text-amber-200 bg-amber-800 border-2 border-amber-600 px-4 py-3 rounded hover:bg-amber-700"
            >
              PLAY THE PROSPECTOR'S TALE
            </Link>
            <Link
              href="/hub"
              className="block font-pixel text-[10px] text-amber-400 border border-amber-700 px-4 py-2 rounded hover:text-amber-200"
            >
              {'\u2190'} Back to Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeBounties = getActiveBounties()
  const timeEchoes = state.timeEchoes
  const discoveredEchoes = Object.values(timeEchoes).filter(Boolean).length
  const reputation = state.reputation

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950">
      {/* Header */}
      <header className="border-b-4 border-amber-600 bg-amber-900/50 px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">Ranch Treasure Hunt</h1>
            <p className="text-amber-400 text-xs mt-1">Back of Beyond Ranch, West Point, CA</p>
          </div>
          <Link
            href="/hub"
            className="text-amber-400 hover:text-amber-200 text-xs font-pixel"
          >
            {'\u2190'} Hub
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{'\uD83C\uDFDE\uFE0F'}</div>
          <h2 className="font-pixel text-amber-100 text-2xl mb-2">Welcome to the Ranch</h2>
          <p className="text-amber-300 text-sm max-w-lg mx-auto">
            You've made it to West Point. The ranch holds secrets older than the Gold Rush --
            and treasure that's been waiting for someone worthy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Active Bounties */}
          <div className="bg-amber-800/30 border-2 border-amber-600 rounded-lg p-5">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\uD83D\uDCDC'} Active Bounties
            </h3>
            {activeBounties.length > 0 ? (
              <div className="space-y-2">
                {activeBounties.map(bounty => (
                  <div key={bounty.id} className="p-3 bg-amber-900/40 border border-amber-700/50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-pixel text-amber-200 text-[10px]">{bounty.targetName}</p>
                        <p className="text-amber-400 text-[9px] mt-1">{bounty.description}</p>
                      </div>
                      <span className="font-pixel text-amber-300 text-[10px]">${bounty.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-amber-500 text-xs">
                No active bounties. Complete more of The Prospector's Tale to earn bounty contracts.
              </p>
            )}
          </div>

          {/* Time Echoes */}
          <div className="bg-purple-900/20 border-2 border-purple-700/50 rounded-lg p-5">
            <h3 className="font-pixel text-purple-200 text-sm mb-3">
              {'\u2728'} Time Echoes ({discoveredEchoes}/7)
            </h3>
            <p className="text-purple-400 text-xs mb-3">
              Ancient discoveries from the Prologue that manifest here at the ranch.
            </p>
            <div className="space-y-2">
              {[
                { id: 'norse_runestone', name: 'Norse Runestone', hint: 'Beneath the old mine' },
                { id: 'cahokian_mound_earth', name: 'Cahokian Earth', hint: 'In the ranch soil' },
                { id: 'chumash_star_chart', name: 'Chumash Star Chart', hint: 'Look to the stars' },
                { id: 'guide_ranch_comment', name: "Guide's Prophecy", hint: '"A rather nice ranch"' },
              ].map(echo => {
                const discovered = timeEchoes[echo.id as keyof typeof timeEchoes]
                return (
                  <div key={echo.id}>
                    <button
                      onClick={() => handleEchoClick(echo.id)}
                      disabled={!!discovered}
                      className={`flex items-center gap-2 text-[10px] w-full text-left py-1 ${
                        !discovered ? 'hover:text-purple-200 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span className={discovered ? 'text-purple-300' : 'text-purple-700'}>
                        {discovered ? '\u2713' : '\u25CB'}
                      </span>
                      <span className={discovered ? 'text-purple-300' : 'text-purple-600'}>
                        {discovered ? echo.name : echo.hint}
                      </span>
                    </button>
                    {activeRiddle === echo.id && (
                      <div className="ml-4 mt-1 p-3 bg-purple-900/30 border border-purple-700/50 rounded">
                        <p className="text-purple-200 text-[10px] mb-2">
                          {ECHO_RIDDLES[echo.id]?.riddle}
                        </p>
                        {riddleResult ? (
                          <div>
                            {riddleResult.correct ? (
                              <div className="text-purple-200 text-[9px]">
                                <p className="text-green-400 font-pixel mb-1">{'\u2713'} Correct!</p>
                                <p className="italic">{riddleResult.story}</p>
                              </div>
                            ) : (
                              <p className="text-red-400 text-[9px]">Not quite. Try again...</p>
                            )}
                            <button
                              onClick={() => {
                                if (riddleResult.correct) setActiveRiddle(null)
                                else setRiddleResult(null)
                              }}
                              className="mt-1 text-purple-400 text-[9px] hover:text-purple-200"
                            >
                              {riddleResult.correct ? 'Close' : 'Retry'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={riddleAnswer}
                              onChange={e => setRiddleAnswer(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRiddleSubmit() }}
                              placeholder="Your answer..."
                              className="flex-1 bg-black/40 border border-purple-700 text-purple-200 text-[10px] px-2 py-1 rounded outline-none focus:border-purple-500"
                            />
                            <button
                              onClick={handleRiddleSubmit}
                              className="font-pixel text-[9px] text-purple-200 bg-purple-800/60 border border-purple-600 px-2 py-1 rounded hover:bg-purple-700/60"
                            >
                              Submit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Treasure Hunt Zones */}
        <h3 className="font-pixel text-amber-200 text-sm mb-4 border-b-2 border-amber-600 pb-2">
          Treasure Hunt Zones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { name: 'The Old Mine', icon: '\u26CF\uFE0F', hint: 'Look for Norse markings', available: true },
            { name: 'Ranch House', icon: '\uD83C\uDFE0', hint: 'Check the foundations', available: true },
            { name: 'The Pond', icon: '\uD83C\uDFDE\uFE0F', hint: 'What lies beneath?', available: true },
            { name: 'Animal Pasture', icon: '\uD83D\uDC0E', hint: 'The emus know something', available: true },
            { name: 'Solar Array', icon: '\u2600\uFE0F', hint: 'Modern meets ancient', available: true },
            { name: 'The Trail', icon: '\uD83E\uDDB6', hint: 'Follow the golden frog', available: true },
          ].map(zone => (
            <div
              key={zone.name}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                zone.available
                  ? 'bg-amber-800/30 border-amber-600 hover:border-amber-400 cursor-pointer hover:scale-105'
                  : 'bg-gray-800/30 border-gray-700 opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{zone.icon}</div>
              <h4 className="font-pixel text-amber-200 text-[10px]">{zone.name}</h4>
              <p className="text-amber-500 text-[8px] mt-1">{zone.hint}</p>
            </div>
          ))}
        </div>

        {/* Cross-game status */}
        <div className="p-5 bg-amber-950/60 border border-amber-700 rounded-lg">
          <h3 className="font-pixel text-amber-200 text-sm mb-3">Cross-Game Status</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
            <div>
              <div className="text-amber-300 font-pixel">Alignment</div>
              <div className="text-amber-400 mt-1">{alignmentPosition.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div className="text-amber-300 font-pixel">Reputation</div>
              <div className="text-amber-400 mt-1">
                {reputation ? 'Synced' : 'Not yet synced'}
              </div>
            </div>
            <div>
              <div className="text-amber-300 font-pixel">Bounties</div>
              <div className="text-amber-400 mt-1">{activeBounties.length} active</div>
            </div>
          </div>
        </div>

        {/* QR Code hint */}
        <div className="mt-8 text-center p-4 bg-black/30 border border-amber-800 rounded-lg">
          <p className="text-amber-500 text-xs">
            {'\uD83D\uDCF1'} When you visit the ranch in person, scan the QR codes to unlock
            real-world treasure hunt challenges!
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-amber-800 bg-amber-950/50 px-4 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-amber-600 text-xs">
          &copy; 2026 Back of Beyond Ranch | Ranch Treasure Hunt
        </div>
      </footer>
    </div>
  )
}
