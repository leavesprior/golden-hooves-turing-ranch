'use client'

import React, { useEffect, useState } from 'react'
import { readAgeMode, writeAgeMode, type GftAgeMode } from '@/lib/gftAgeMode'
import { isLoopbackHostname } from '@/lib/localBackendAccess'

interface TitleScreenProps {
  onStart: () => void
  hasSaves?: boolean
  onContinue?: () => void
  continueError?: boolean
  fromBook?: boolean
}

export function TitleScreen({ onStart, hasSaves, onContinue, continueError, fromBook }: TitleScreenProps) {
  const [ageMode, setAgeMode] = useState<GftAgeMode>('adult')
  // The Bridge of Death in the background is the secret way to the local
  // backend (/dm-table). Public hosts 404 that route, so draw it only on loopback.
  const [showBridge, setShowBridge] = useState(false)

  useEffect(() => {
    setAgeMode(readAgeMode())
    setShowBridge(isLoopbackHostname(window.location.hostname))
  }, [])

  useEffect(() => {
    if (hasSaves) return
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter on the focused bridge follows the bridge, not "any key to start".
      if ((e.target as HTMLElement | null)?.closest?.('[data-bridge-of-death]')) return
      onStart()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onStart, hasSaves])

  const pickAge = (mode: GftAgeMode) => {
    setAgeMode(writeAgeMode(mode))
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden cursor-pointer"
      onClick={() => { if (!hasSaves) onStart() }}
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

      {showBridge && (
        <a
          href="/dm-table"
          data-bridge-of-death
          data-testid="title-bridge-of-death"
          aria-label="The Bridge of Death"
          title="Who would cross the Bridge of Death?"
          onClick={e => e.stopPropagation()}
          className="absolute z-20 block opacity-80 transition-opacity hover:opacity-100 focus:opacity-100"
          style={{ left: '86%', top: '46%', width: '10%', minWidth: 72, minHeight: 44, filter: 'drop-shadow(0 0 2px rgba(251,191,36,0.45))' }}
        >
          {/* Rope-bridge silhouette across the far gap (placeholder until the art has a real bridge). */}
          <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
            <path d="M4 10 Q60 30 116 10" fill="none" stroke="#2b1a10" strokeWidth="2" />
            <path d="M4 16 Q60 36 116 16" fill="none" stroke="#2b1a10" strokeWidth="2.5" />
            {Array.from({ length: 11 }, (_, i) => {
              const x = 10 + i * 10, t = (x - 4) / 112, y = 16 + 40 * t * (1 - t)
              return <line key={i} x1={x} y1={y - 6} x2={x} y2={y} stroke="#2b1a10" strokeWidth="1.5" />
            })}
            <line x1="4" y1="6" x2="4" y2="22" stroke="#2b1a10" strokeWidth="3" />
            <line x1="116" y1="6" x2="116" y2="22" stroke="#2b1a10" strokeWidth="3" />
          </svg>
        </a>
      )}

      {/* Type + buttons in the dusk sky, stacked, not on the cabin. */}
      <div className="absolute inset-x-0 top-16 z-10 px-8 text-left md:top-20 md:px-16">
        <p
          className="font-serif text-[16px] sm:text-[18px] uppercase tracking-[0.28em] text-amber-100/80"
          data-testid="title-location"
        >
          West Point, Calaveras County · 1849
        </p>
        <h1 className="mt-2 font-serif text-5xl font-medium text-amber-50 md:text-6xl">
          Golden Frog Trail
        </h1>
        <p className="mt-3 max-w-md font-serif text-lg text-amber-100/90">
          A golden frog, a covered wagon, and a warrant for a man who hasn{'’'}t done it yet.
          1849 lies a hundred and seventy-seven years down the road {'—'} the back road.
          The Kansas crossing keeps a Bridge of Death {'—'} answer the questions three.
          A towel is never wasted. Ni is optional.
        </p>
        {fromBook && (
          <p className="mt-4 max-w-md font-serif text-lg text-amber-50">
            Play the trail first. When you reach Gold Country, send me a message on Airbnb when requesting to book and I will provide the discount.
          </p>
        )}
        <p className="mt-3 max-w-md font-serif text-lg text-amber-100/80">
          Already a guest? Play once — the trail is the door to a return-stay discount.
        </p>
        <div className="mt-6 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            data-testid="age-adult"
            aria-pressed={ageMode === 'adult'}
            onClick={() => pickAge('adult')}
            className={`min-h-11 rounded-sm px-4 py-2 text-base font-medium tracking-wide ${
              ageMode === 'adult'
                ? 'bg-[#e8dcc4] text-[#1a1208]'
                : 'border border-amber-200/40 bg-black/50 text-amber-100'
            }`}
          >
            Adult warrant
          </button>
          <button
            type="button"
            data-testid="age-kid"
            aria-pressed={ageMode === 'under18'}
            onClick={() => pickAge('under18')}
            className={`min-h-11 rounded-sm px-4 py-2 text-base font-medium tracking-wide ${
              ageMode === 'under18'
                ? 'bg-[#e8dcc4] text-[#1a1208]'
                : 'border border-amber-200/40 bg-black/50 text-amber-100'
            }`}
          >
            Kid trail
          </button>
        </div>
        <p className="mt-2 max-w-md font-serif text-sm text-amber-100/75">
          {ageMode === 'under18'
            ? 'Kid trail: easier checks, a slower S.A.D.D.L.E., and fewer karma of every type.'
            : 'Adult warrant: D&D 3.5 growth, full DCs, +2 S.A.D.D.L.E. points each level.'}
        </p>
        <div className="mt-8 inline-flex flex-col gap-3 items-start max-w-[14rem]">
            {hasSaves && onContinue && (
              <button
                onClick={(e) => { e.stopPropagation(); onContinue(); }}
                className="min-h-11 rounded-sm bg-[#e8dcc4] px-5 py-2 text-lg font-medium tracking-wide text-[#1a1208] hover:opacity-90"
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
              type="button"
              data-testid="title-play"
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="min-h-11 rounded-sm border border-amber-200/40 bg-black/50 px-5 py-2 text-lg font-medium tracking-wide text-amber-100 hover:bg-black/70"
            >
              Play
            </button>
          </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center z-10">
        <p className="text-amber-200/70 text-sm font-serif">
          A Golden Frog Production • Oregon Trail × Python × Adams
        </p>
      </div>
    </div>
  )
}

export default TitleScreen
