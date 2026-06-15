'use client'

// Two-register art slots for The Tare's Trail (see docs/CHASE_ART_BIBLE_20260614.md).
// Each slot tries a real asset and falls back to an on-style programmatic emblem,
// so the chase always looks finished even before raster art lands. When the art
// is added at the manifest path, it simply replaces the fallback — no code change.

import { useState } from 'react'

/** Loads an asset; on 404/error renders the supplied fallback. */
export function ChaseArt({
  src,
  alt,
  fallback,
  className,
}: {
  src: string
  alt: string
  fallback: React.ReactNode
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

// Old-style pixel NPC sprite for the witness dialogue (toward the Welcome-Gate
// composition: backdrop + pixel NPC + JRPG dialogue box). Real per-witness art at
// /chase/npc-{key}.png replaces the drawn prospector fallback when it lands.
export function WitnessSprite({ npcKey }: { npcKey?: string }) {
  return (
    <div className="h-16 w-12 shrink-0 self-end sm:h-20 sm:w-16">
      <ChaseArt
        src={`/chase/npc-${npcKey || 'witness'}.png`}
        alt="witness"
        className="h-full w-full object-contain [image-rendering:pixelated]"
        fallback={<ProspectorSvg />}
      />
    </div>
  )
}

// A characterful little Gold-Country prospector — hat, grey beard, suspenders,
// lantern — drawn as crisp pixels (the Welcome-Gate NPC register).
function ProspectorSvg() {
  return (
    <svg viewBox="0 0 16 22" shapeRendering="crispEdges" className="h-full w-full [image-rendering:pixelated]" aria-hidden>
      <rect x="4" y="0" width="8" height="3" fill="#7a5230" />
      <rect x="4" y="2" width="8" height="1" fill="#4a3019" />
      <rect x="2" y="3" width="12" height="1" fill="#6b4a2b" />
      <rect x="5" y="4" width="6" height="4" fill="#d8a878" />
      <rect x="6" y="5" width="1" height="1" fill="#2b2b2b" />
      <rect x="9" y="5" width="1" height="1" fill="#2b2b2b" />
      <rect x="4" y="7" width="8" height="3" fill="#cfcabd" />
      <rect x="4" y="10" width="8" height="6" fill="#3f6b8a" />
      <rect x="6" y="10" width="1" height="6" fill="#5a3a1f" />
      <rect x="9" y="10" width="1" height="6" fill="#5a3a1f" />
      <rect x="3" y="10" width="1" height="5" fill="#3f6b8a" />
      <rect x="12" y="10" width="1" height="5" fill="#3f6b8a" />
      <rect x="5" y="16" width="2" height="5" fill="#34506a" />
      <rect x="9" y="16" width="2" height="5" fill="#34506a" />
      {/* lantern */}
      <rect x="1" y="12" width="2" height="1" fill="#7a5230" />
      <rect x="1" y="13" width="2" height="3" fill="#e0a93b" />
    </svg>
  )
}

type VerdictKind = 'gallows' | 'prison' | 'mercy'

// Per-verdict storybook emblem (the fallback until /chase/verdict-{kind}.png exists).
// Warm, illustrative — a soft radial glow in the verdict's hue behind a simple
// line-emblem. Mercy = a rising dawn; prison = the measured bars; gallows = the
// stark gibbet at cold dawn.
export function VerdictEmblem({ kind }: { kind: VerdictKind }) {
  const tone =
    kind === 'mercy'
      ? 'text-[var(--pixel-forest-light)]'
      : kind === 'gallows'
        ? 'text-[var(--pixel-fire-orange)]'
        : 'text-[var(--pixel-gold-light)]'
  return (
    <div
      className={`relative flex h-28 w-full items-center justify-center overflow-hidden border-2 border-[var(--pixel-gold-dark)] sm:h-36 ${tone}`}
      style={{
        background:
          'radial-gradient(120% 90% at 50% 100%, currentColor 0%, transparent 55%)',
      }}
      data-testid="verdict-emblem"
      data-emblem={kind}
    >
      <div className="absolute inset-0 opacity-25" style={{ background: 'currentColor', mixBlendMode: 'overlay' }} />
      <svg viewBox="0 0 120 50" className="relative h-20 w-44" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
        {kind === 'mercy' && (
          <>
            {/* a rising sun over the horizon — the wronged made whole at dawn */}
            <line x1="6" y1="40" x2="114" y2="40" />
            <path d="M44 40 A16 16 0 0 1 76 40" fill="currentColor" opacity="0.35" stroke="none" />
            <path d="M44 40 A16 16 0 0 1 76 40" />
            {[24, 36, 60, 84, 96].map((x, i) => (
              <line key={i} x1={x} y1={i === 2 ? 14 : 20} x2={x} y2={i === 2 ? 6 : 12} />
            ))}
          </>
        )}
        {kind === 'prison' && (
          <>
            {/* the measured bars — hard labor, the law's even hand */}
            <rect x="30" y="12" width="60" height="30" />
            {[42, 54, 66, 78].map((x) => (
              <line key={x} x1={x} y1="12" x2={x} y2="42" />
            ))}
          </>
        )}
        {kind === 'gallows' && (
          <>
            {/* the stark gibbet at cold dawn — hard, final justice */}
            <line x1="40" y1="44" x2="40" y2="8" />
            <line x1="40" y1="8" x2="74" y2="8" />
            <line x1="74" y1="8" x2="74" y2="20" />
          </>
        )}
      </svg>
    </div>
  )
}
