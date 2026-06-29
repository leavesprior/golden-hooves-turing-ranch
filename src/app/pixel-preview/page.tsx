'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Client-only: the DB32 renderer builds an internal canvas buffer on first use.
const PixelScene = dynamic(() => import('@/components/PixelScene'), { ssr: false })

// The 12 authored Gold Country scenes (+ the Cyrus Vane portrait). Each label is
// the real place the scene depicts.
const SCENES: { key: string; label: string }[] = [
  { key: 'ranch', label: "Pryor's Back of Beyond" },
  { key: 'columbia', label: 'Columbia boomtown' },
  { key: 'mokehill', label: 'Mokelumne Hill' },
  { key: 'bearvalley', label: 'Bear Valley' },
  { key: 'river', label: 'The Karmic River' },
  { key: 'mine', label: 'Hydraulic scar' },
  { key: 'angels', label: 'Angels Camp' },
  { key: 'murphys', label: 'Murphys' },
  { key: 'lookout', label: 'Eagle Point' },
  { key: 'map', label: 'Trail map (Carmen-style)' },
  { key: 'battle', label: 'Encounter' },
  { key: 'office', label: 'Assay office' },
  { key: 'vane', label: 'Cyrus Vane, "the Tare"' },
]

export default function PixelPreviewPage() {
  const [loc, setLoc] = useState('ranch')

  // Honor ?scene= after mount (robust for the prerendered page + headless capture).
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('scene')
    if (s) setLoc(s)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-black px-4 py-8 text-amber-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-200 text-lg">32/64-bit Scene Preview</h1>
            <p className="text-amber-400 text-[11px] mt-1">
              DB32 palette · 320×180 internal buffer · nearest-neighbor upscale — the SNES/Genesis-RPG look,
              rendered live in the site (no assets, no Godot).
            </p>
          </div>
          <Link href="/hub" className="font-pixel text-[10px] text-amber-300 border border-amber-700 px-3 py-2 rounded hover:text-amber-100">
            ← Hub
          </Link>
        </div>

        <div className="rounded-lg border-2 border-amber-800 bg-black/40 p-2">
          <PixelScene loc={loc} state={{ flags: { scarredStranger: true } }} width={1280} height={720} className="rounded" />
        </div>

        <p className="mt-2 text-center text-amber-300 text-xs font-pixel">
          {SCENES.find((s) => s.key === loc)?.label}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SCENES.map((s) => (
            <button
              key={s.key}
              onClick={() => setLoc(s.key)}
              className={`font-pixel text-[9px] px-2 py-2 rounded border-2 transition-all ${
                loc === s.key
                  ? 'border-amber-400 bg-amber-800/50 text-amber-100'
                  : 'border-amber-800/60 bg-black/30 text-amber-300 hover:border-amber-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-amber-600 text-[10px]">
          Proof-of-look for the graphics uplift. If this is the direction, the next step is wiring this renderer
          behind the live scene views (replacing the static photo backdrops, opt-in per scene).
        </p>
      </div>
    </div>
  )
}
