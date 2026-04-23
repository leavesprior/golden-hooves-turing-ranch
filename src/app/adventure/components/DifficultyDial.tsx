'use client'

/**
 * DifficultyDial — persistent three-position toggle in the play-page header.
 *
 * Story / Explorer / Challenger. Explorer is the default. Adjustable at any
 * time with zero penalty. Visible persistently so the player always knows
 * what tier they are on.
 *
 * Pixel-style segmented control matching the PixelButton aesthetic: pressed
 * segment gets a gold fill, the others are muted with a border that matches
 * the existing UI chrome.
 */

import React, { useCallback } from 'react'
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TIERS,
  DIFFICULTY_TOOLTIPS,
  type GameDifficulty,
} from '@/app/adventure/lib/difficulty'

interface DifficultyDialProps {
  value: GameDifficulty
  onChange: (next: GameDifficulty) => void
  compact?: boolean
  className?: string
}

export function DifficultyDial({ value, onChange, compact = false, className = '' }: DifficultyDialProps) {
  const handleSelect = useCallback(
    (tier: GameDifficulty) => {
      if (tier !== value) onChange(tier)
    },
    [value, onChange],
  )

  const textSize = compact ? 'text-[8px]' : 'text-[9px]'
  const padding = compact ? 'px-2 py-0.5' : 'px-2 py-1'

  return (
    <div
      role="radiogroup"
      aria-label="Adventure difficulty"
      className={`inline-flex items-center gap-0 border-2 border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] ${className}`}
    >
      {!compact && (
        <span
          className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-60 px-2 py-1 border-r border-[var(--pixel-ui-border)] select-none"
          aria-hidden
        >
          DIFFICULTY
        </span>
      )}
      {DIFFICULTY_TIERS.map(tier => {
        const active = tier === value
        return (
          <button
            key={tier}
            type="button"
            role="radio"
            aria-checked={active}
            title={DIFFICULTY_TOOLTIPS[tier]}
            onClick={() => handleSelect(tier)}
            className={`font-[var(--font-pixel)] ${textSize} ${padding} transition-all border-r border-[var(--pixel-ui-border)] last:border-r-0 ${
              active
                ? 'bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)]'
                : 'bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)] opacity-70 hover:opacity-100 hover:text-[var(--pixel-gold-light)]'
            }`}
          >
            {DIFFICULTY_LABELS[tier].toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}

export default DifficultyDial
