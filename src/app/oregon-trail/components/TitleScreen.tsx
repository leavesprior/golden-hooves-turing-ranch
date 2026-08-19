'use client'

import React, { useState, useEffect } from 'react'

interface TitleScreenProps {
  onStart: () => void
  hasSaves?: boolean
  onContinue?: () => void
  continueError?: boolean
}

export function TitleScreen({ onStart, hasSaves, onContinue, continueError }: TitleScreenProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (hasSaves) return
    const handleKeyPress = () => {
      if (showPrompt) onStart()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showPrompt, onStart, hasSaves])

  return (
    <div
      className="min-h-screen relative overflow-hidden cursor-pointer"
      onClick={() => showPrompt && !hasSaves && onStart()}
    >
      {/* Editorial still from live title pixels + Gold Country grade. No UI in the image. */}
      <div className="absolute inset-0">
        <img
          src="/place-art/ot_title_prairie_editorial.jpg"
          alt=""
          className="h-full w-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      </div>

      {/* Type + buttons in the dusk sky, stacked, not on the cabin. */}
      <div className="absolute inset-x-0 top-16 z-10 px-8 text-left md:top-20 md:px-16">
        <p className="font-serif text-[11px] uppercase tracking-[0.28em] text-amber-100/80">
          Neoma keeps the tables
        </p>
        <h1 className="mt-2 font-serif text-5xl font-medium text-amber-50 md:text-6xl">
          Golden Frog Trail
        </h1>
        <p className="mt-3 max-w-md font-serif text-base text-amber-100/85">
          An 1849 expedition. Wagon, warrant, and the river that started a country over.
        </p>
        {showPrompt && (
          <div className="mt-8 inline-flex flex-col gap-3 items-start max-w-[14rem]">
            {hasSaves && onContinue && (
              <button
                onClick={(e) => { e.stopPropagation(); onContinue(); }}
                className="min-h-11 rounded-sm bg-[#e8dcc4] px-5 py-2 text-sm font-medium tracking-wide text-[#1a1208] hover:opacity-90"
              >
                Continue
              </button>
            )}
            {continueError && (
              <p className="text-red-300 text-sm font-serif">
                Couldn{'’'}t load your save {'—'} start a new game or try again.
              </p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="min-h-11 rounded-sm border border-amber-200/40 bg-black/50 px-5 py-2 text-sm font-medium tracking-wide text-amber-100 hover:bg-black/70"
            >
              New expedition
            </button>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-4 text-center z-10">
        <p className="text-amber-600/60 text-xs">
          A Golden Frog Production • Inspired by the classics
        </p>
      </div>
    </div>
  )
}

export default TitleScreen
