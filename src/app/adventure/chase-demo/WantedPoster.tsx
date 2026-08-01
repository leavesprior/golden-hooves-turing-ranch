'use client'

// Wanted Poster — Carmen's warrant mechanic. Fills in Vane's traits as the
// chase advances. Parchment panel, pixel font, amber/stone palette.
// PROTOTYPE component — not used by the live game.

import React from 'react'
import { VANE, type WantedTrait } from './chaseData'
import { ChaseArt } from './ChaseArt'
import PixelScene from '@/components/PixelScene'

interface WantedPosterProps {
  traits: WantedTrait[]
  /** Total traits in the full chase, for the "____ of N collected" line. */
  totalTraits: number
  /** When true, render the completed (cornered) flourish. */
  complete?: boolean
  /** Villain on the poster — defaults to Vane for backward compatibility. */
  villainName?: string
  villainDescription?: string
  villainCharge?: string
  /**
   * Poster portrait path; per-case art lands here when drawn. Leave undefined
   * when no PNG exists — the component then renders the authored DB32 `vane`
   * portrait rather than requesting a file that isn't there.
   */
  posterArt?: string
}

export function WantedPoster({
  traits,
  totalTraits,
  complete,
  villainName = VANE.name,
  villainDescription = VANE.baseDescription,
  villainCharge = VANE.charge,
  // No default path: `/chase/vane-poster.png` was never drawn, so defaulting to
  // it meant every render fetched a 404 before falling back. Undefined = go
  // straight to the authored portrait.
  posterArt,
}: WantedPosterProps) {
  // If the DB32 renderer itself can't draw, drop to the parchment silhouette.
  const [vanePixelFailed, setVanePixelFailed] = React.useState(false)
  return (
    <div
      className="relative border-4 border-[var(--pixel-earth-dark)] bg-[#e9dcc0] text-[#3b2a1f] p-3 sm:p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.45)]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(120,80,40,0.05) 0px, rgba(120,80,40,0.05) 2px, transparent 2px, transparent 4px)',
      }}
    >
      {/* torn-edge / nail flourishes */}
      <div className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-[var(--pixel-earth-dark)]/60" />
      <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--pixel-earth-dark)]/60" />

      <p className="text-center font-[var(--font-pixel)] text-[13px] sm:text-[15px] tracking-widest text-[#7a1f10]">
        WANTED
      </p>
      <p className="mt-1 text-center font-[var(--font-pixel)] text-[10px] sm:text-[11px] text-[#5c3d2e]">
        {complete ? 'IN CUSTODY' : 'DEAD OR ALIVE'}
      </p>

      {/* Portrait slot — a three-step fallback chain, best art first:
            1. the per-case PNG (`/chase/poster-<caseId>.png`) when one is drawn
            2. the AUTHORED DB32 scene `vane` — "Cyrus Vane, 'the Tare' — the scar
               that threads every con." It has existed in db32Renderer since the
               pixel-art batch but was reachable only from /pixel-preview, so the
               chase showed a generic silhouette while the real portrait sat
               unwired and the missing PNG 404'd on every case load.
            3. the flat parchment silhouette, if the renderer itself fails.
          The Tare forges presence; it is fitting that his own face was the one
          thing in this game that was never actually there. Now it is. */}
      <div className="mx-auto my-3 h-24 w-24 overflow-hidden border-2 border-[var(--pixel-earth-dark)] bg-[#d8c7a2] [image-rendering:pixelated]">
        <ChaseArt
          src={posterArt}
          alt={villainName}
          className="h-full w-full object-cover"
          fallback={
            vanePixelFailed ? (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-20 w-20" aria-hidden>
                  {/* hat */}
                  <rect x="5" y="3" width="14" height="2" fill="#3b2a1f" />
                  <rect x="7" y="1" width="10" height="3" fill="#3b2a1f" />
                  {/* head + shoulders */}
                  <rect x="8" y="6" width="8" height="7" fill="#5c3d2e" />
                  <rect x="6" y="13" width="12" height="8" fill="#3b2a1f" />
                  {/* eyes */}
                  <rect x="9" y="8" width="2" height="2" fill="#e9dcc0" />
                  <rect x="13" y="8" width="2" height="2" fill="#e9dcc0" />
                </svg>
              </div>
            ) : (
              <PixelScene
                loc="vane"
                hud={false}
                width={240}
                height={240}
                className="h-full w-full object-cover"
                onError={() => setVanePixelFailed(true)}
              />
            )
          }
        />
      </div>

      <p className="text-center font-[var(--font-pixel)] text-[11px] sm:text-[12px] leading-relaxed text-[#3b2a1f]">
        {villainName}
      </p>
      <p className="mt-2 font-[var(--font-pixel)] text-[10px] sm:text-[11px] leading-relaxed text-[#5c3d2e]">
        {villainDescription}
      </p>

      <div className="my-3 border-t-2 border-dashed border-[var(--pixel-earth-dark)]/50" />

      <p className="font-[var(--font-pixel)] text-[10px] sm:text-[11px] text-[#7a1f10]">
        KNOWN BY:
      </p>
      <ul className="mt-2 space-y-2">
        {Array.from({ length: totalTraits }).map((_, i) => {
          const trait = traits[i]
          return (
            <li
              key={i}
              className="font-[var(--font-pixel)] text-[10px] sm:text-[11px] leading-relaxed"
            >
              {trait ? (
                <span className="text-[#3b2a1f]">
                  <span className="text-[#7a1f10]">{trait.label}: </span>
                  {trait.value}
                </span>
              ) : (
                <span className="text-[#5c3d2e]/40 italic">
                  ?: not yet known...
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="my-3 border-t-2 border-dashed border-[var(--pixel-earth-dark)]/50" />
      <p className="font-[var(--font-pixel)] text-[9px] sm:text-[10px] leading-relaxed text-[#5c3d2e]">
        CHARGE: {villainCharge}
      </p>
      <p className="mt-2 text-center font-[var(--font-pixel)] text-[10px] sm:text-[11px] text-[#7a1f10]">
        {traits.length} of {totalTraits} traits confirmed
      </p>
    </div>
  )
}
