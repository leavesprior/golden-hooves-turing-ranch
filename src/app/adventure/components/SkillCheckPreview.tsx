'use client'

/**
 * SkillCheckPreview — Fallout-style success-% chip shown inline on every
 * stat-gated button in the adventure. Hard rule: never let the player
 * commit to a check without knowing their odds first.
 *
 * Renders like `[SHREWDNESS 14 / DC 12 → 72%]` and colours the chip by tone
 * (green >=70, yellow 40-69, red <40).
 */

import React from 'react'
import type { StatName } from '@/app/oregon-trail/characterContext'
import type { SkillCheckPreview as Preview } from '@/app/adventure/lib/difficulty'

interface SkillCheckPreviewChipProps {
  stat: StatName
  statValue: number
  preview: Preview
  compact?: boolean
  className?: string
  label?: string // optional prefix label (e.g. "ATTEMPT")
}

const TONE_CLASSES: Record<Preview['tone'], string> = {
  green: 'text-[var(--pixel-forest-light)] border-[var(--pixel-forest-dark)] bg-[var(--pixel-forest-dark)]/20',
  yellow: 'text-yellow-300 border-yellow-800 bg-yellow-950/20',
  red: 'text-[var(--pixel-fire-orange)] border-[var(--pixel-fire-red)] bg-red-950/20',
}

export function SkillCheckPreviewChip({
  stat,
  statValue,
  preview,
  compact = false,
  className = '',
  label,
}: SkillCheckPreviewChipProps) {
  const sizeClass = compact ? 'text-[7px] px-1 py-0' : 'text-[8px] px-1.5 py-0.5'
  return (
    <span
      className={`inline-block font-[var(--font-pixel)] ${sizeClass} border ${TONE_CLASSES[preview.tone]} ${className}`}
      title={`${stat} ${statValue} vs DC ${preview.effectiveDC} → ${preview.successPct}% success`}
    >
      {label ? `${label} ` : ''}
      {stat.toUpperCase()} {statValue} / DC {preview.effectiveDC} {'→'} {preview.successPct}%
    </span>
  )
}

export default SkillCheckPreviewChip
