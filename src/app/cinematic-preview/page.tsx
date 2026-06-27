'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import type { Weather, TimeOfDay } from '@/components/CinematicScene'

const CinematicScene = dynamic(() => import('@/components/CinematicScene'), { ssr: false })

// The strongest existing place-art scenes to dress as living paintings —
// now each with a per-place mood (weather + time-of-day).
const SCENES: { art: string; label: string; rayColor?: number; fireflies?: boolean; weather?: Weather; timeOfDay?: TimeOfDay }[] = [
  { art: 'welcome_gate', label: 'Ranch Gate — dusk', rayColor: 0xffe6a8, fireflies: true, timeOfDay: 'dusk' },
  { art: 'bobr_cabin', label: 'Back of Beyond — dusk fireflies', rayColor: 0xffdca0, fireflies: true, timeOfDay: 'dusk' },
  { art: 'volcano', label: 'Volcano town — night embers', rayColor: 0xffe2b0, fireflies: false, weather: 'embers', timeOfDay: 'night' },
  { art: 'big_trees', label: 'Big Trees — morning', rayColor: 0xd8f0b0, fireflies: true, timeOfDay: 'dawn' },
  { art: 'forester_trail', label: 'Forester trail — dawn', rayColor: 0xcdeaa0, fireflies: true, timeOfDay: 'dawn' },
  { art: 'kennedy_mine', label: 'Kennedy Mine — dusk', rayColor: 0xffd28a, fireflies: false, timeOfDay: 'dusk' },
  { art: 'ch3_donner_pass', label: 'Donner Pass — snow', rayColor: 0xbcdfff, fireflies: false, weather: 'snow' },
  { art: 'natural_bridges', label: 'Natural Bridges — dawn', rayColor: 0xbfeecf, fireflies: true, timeOfDay: 'dawn' },
  { art: 'ch5_ghost_town', label: 'Ghost town — night embers', rayColor: 0xffc890, fireflies: false, weather: 'embers', timeOfDay: 'night' },
  { art: 'ch5_hydraulic_scar', label: 'Hydraulic scar — rain', rayColor: 0xc8d6e6, fireflies: false, weather: 'rain', timeOfDay: 'dusk' },
]

export default function CinematicPreviewPage() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('scene')
    const idx = SCENES.findIndex((x) => x.art === s)
    if (idx >= 0) setI(idx)
  }, [])
  const sc = SCENES[i]

  return (
    <div className="min-h-screen bg-black px-3 py-6 text-amber-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-200 text-lg">Cinematic Scene — proof of feel</h1>
            <p className="text-amber-400 text-[11px] mt-1">
              The SAME place-art, made alive: Ken-Burns drift · move your mouse for parallax · god-rays · drifting
              dust + fireflies · sun-glow · vignette. (Lunar / Phantasy-Star-IV cutscene feel.)
            </p>
          </div>
          <Link href="/hub" className="font-pixel text-[10px] text-amber-300 border border-amber-700 px-3 py-2 rounded hover:text-amber-100">← Hub</Link>
        </div>

        <div className="overflow-hidden rounded-lg border-2 border-amber-900 bg-black">
          {/* key forces a clean remount per scene */}
          <CinematicScene key={sc.art} src={`/place-art/${sc.art}.png`} width={1280} height={720} rayColor={sc.rayColor} fireflies={sc.fireflies} weather={sc.weather} timeOfDay={sc.timeOfDay} />
        </div>
        <p className="mt-2 text-center font-pixel text-amber-300 text-xs">{sc.label}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCENES.map((s, idx) => (
            <button
              key={s.art}
              onClick={() => setI(idx)}
              className={`font-pixel text-[9px] px-2 py-2 rounded border-2 transition-all ${
                i === idx ? 'border-amber-400 bg-amber-800/50 text-amber-100' : 'border-amber-800/60 bg-black/40 text-amber-300 hover:border-amber-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-amber-600 text-[10px]">
          Move your mouse over the scene — the art drifts, the atmosphere drifts more (depth). If this is the
          feel, the next step is treating every scene this way + per-place mood (rain, snow, embers, time-of-day)
          and wiring it behind the live scene views.
        </p>
      </div>
    </div>
  )
}
