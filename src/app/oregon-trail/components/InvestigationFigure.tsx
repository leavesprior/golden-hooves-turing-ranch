'use client'

import React from 'react'
import { MapIcon } from './map/MapIcons'
import type { GraphicsTier } from '../state/types'
import type { PlaceGlyph, WitnessSprite } from '@/lib/trailInvestigation'

/**
 * The picture beside a place or a person on the Investigation screens, in the
 * game's own languages only: a painted still, an atlas figure, or a MapIcon
 * glyph at the player's graphics tier. Never an emoji.
 */
export function InvestigationFigure({
  still,
  sprite,
  glyph,
  tier,
  size = 'md',
  alt = '',
}: {
  still?: string | null
  sprite?: WitnessSprite
  glyph: PlaceGlyph
  tier: GraphicsTier
  size?: 'sm' | 'md' | 'lg'
  alt?: string
}) {
  const box = size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'
  if (still) {
    return (
      <span className={`relative shrink-0 overflow-hidden rounded-md border border-[var(--west-line)] bg-[#120e0a] ${box}`} data-figure="still">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={still} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      </span>
    )
  }
  if (sprite) {
    return (
      <span className={`relative shrink-0 flex items-end justify-center overflow-hidden rounded-md border border-[var(--west-line)] bg-[#120e0a] ${box}`} data-figure="sprite">
        <span className="visual64-character-sprite" data-sprite={sprite} style={{ width: size === 'lg' ? 61 : size === 'sm' ? 30 : 41, height: size === 'lg' ? 96 : size === 'sm' ? 47 : 64 }} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className={`shrink-0 flex items-center justify-center rounded-md border border-[var(--west-line)] bg-[#120e0a] ${box}`} data-figure="glyph">
      <MapIcon type={glyph} tier={tier} size={size === 'lg' ? 44 : size === 'sm' ? 24 : 32} />
    </span>
  )
}
