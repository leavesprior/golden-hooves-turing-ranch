'use client'

import React, { useState } from 'react'
import { getPlayerBackgroundPortrait, type PlayerBackgroundPortrait } from '../data/playerPortraits'

interface PlayerPortraitProps {
  background?: string | null
  name: string
  width?: 48 | 72 | 96
  className?: string
  'data-testid'?: string
}

/** Derive art from the saved background; never create another identity/save field. */
export function PlayerPortrait({ background, name, width = 72, className = '', 'data-testid': testId = 'player-portrait' }: PlayerPortraitProps) {
  const portrait = getPlayerBackgroundPortrait(background)
  return (
    <span
      data-testid={testId}
      data-background={background ?? ''}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded border border-amber-700/60 bg-stone-900 ${className}`}
      style={{ width, height: width * 4 / 3 }}
    >
      <PortraitImage key={portrait?.src ?? 'unavailable'} portrait={portrait} name={name} />
    </span>
  )
}

/** The source key resets a failed image when a different background is chosen. */
function PortraitImage({ portrait, name }: { portrait?: PlayerBackgroundPortrait; name: string }) {
  const [failed, setFailed] = useState(false)
  const label = portrait?.label ?? 'Traveler'
  const alt = `${name || 'Traveler'} — ${label} portrait`
  if (!portrait || failed) {
    return <span role="img" aria-label={`${alt} unavailable`} data-testid="player-portrait-fallback" className="text-3xl">{portrait?.emoji ?? '👤'}</span>
  }
  return (
    // Small local pixel art must bypass image optimization and the shell's descendant smoothing rule.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={portrait.src}
      alt={alt}
      width={96}
      height={128}
      draggable={false}
      style={{ imageRendering: 'pixelated', width: '100%', height: '100%', objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  )
}

