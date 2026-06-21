'use client'

// Wanted Poster — Carmen's warrant mechanic. Fills in Vane's traits as the
// chase advances. Parchment panel, pixel font, amber/stone palette.
// PROTOTYPE component — not used by the live game.

import React from 'react'
import { VANE, type WantedTrait } from './chaseData'
import { ChaseArt } from './ChaseArt'

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
  /** Poster portrait path; per-case art lands here when drawn. */
  posterArt?: string
}

export function WantedPoster({
  traits,
  totalTraits,
  complete,
  villainName = VANE.name,
  villainDescription = VANE.baseDescription,
  villainCharge = VANE.charge,
  posterArt = '/chase/vane-poster.png',
}: WantedPosterProps) {
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

      {/* Portrait slot — real pixel portrait at /chase/vane-poster.png when it
          lands; until then a simple pixel silhouette in parchment ink. */}
      <div className="mx-auto my-3 h-24 w-24 overflow-hidden border-2 border-[var(--pixel-earth-dark)] bg-[#d8c7a2]">
        <ChaseArt
          src={posterArt}
          alt={villainName}
          className="h-full w-full object-cover"
          fallback={
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
