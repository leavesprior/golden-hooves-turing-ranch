'use client'

/**
 * AttackPreview — Shining-Force-style inline chip for the ATTACK button on
 * the confrontation screen. Parallel to `SkillCheckPreviewChip`, but uses
 * the attack-roll formula (d20+mod+weapon >= AC) and hides AC numbers on
 * Challenger difficulty per the hard rule: never let the player commit to
 * a roll without their odds shown in *some* form.
 *
 * Render examples:
 *   Story/Explorer → [ATTACK AGI 14 / AC 13 → 65%]
 *   Challenger     → [ATTACK AGI 14 / Avg → 65%]
 *
 * Tone colouring matches the skill-check chip so the visual language is
 * consistent across FLEE / TALK / ATTACK.
 */

import React from 'react'
import type { AttackPreview as Preview } from '@/app/adventure/lib/difficulty'

interface AttackPreviewChipProps {
  /** Name of the stat driving the attack (Agility in the current system). */
  statName: string
  statValue: number
  preview: Preview
  /** Enemy name/icon line shown in the hover tooltip (e.g. "Bandit Outlaw AC 13"). */
  enemyHover?: string
  compact?: boolean
  className?: string
}

const TONE_CLASSES: Record<Preview['tone'], string> = {
  green:
    'text-[var(--pixel-forest-light)] border-[var(--pixel-forest-dark)] bg-[var(--pixel-forest-dark)]/20',
  yellow: 'text-yellow-300 border-yellow-800 bg-yellow-950/20',
  red: 'text-[var(--pixel-fire-orange)] border-[var(--pixel-fire-red)] bg-red-950/20',
}

const TIER_LABELS: Record<Preview['tier'], string> = {
  weak: 'Weak',
  average: 'Avg',
  tough: 'Tough',
}

export function AttackPreviewChip({
  statName,
  statValue,
  preview,
  enemyHover,
  compact = false,
  className = '',
}: AttackPreviewChipProps) {
  const sizeClass = compact ? 'text-[7px] px-1 py-0' : 'text-[8px] px-1.5 py-0.5'
  // Challenger: null effectiveAC → show the coarse tier label instead.
  const middle =
    preview.effectiveAC == null
      ? TIER_LABELS[preview.tier]
      : `AC ${preview.effectiveAC}`
  const tooltip = enemyHover
    ? `${enemyHover} | ${statName} ${statValue} → ${preview.successPct}% hit`
    : `${statName} ${statValue} vs ${middle} → ${preview.successPct}% hit`
  return (
    <span
      className={`inline-block font-[var(--font-pixel)] ${sizeClass} border ${TONE_CLASSES[preview.tone]} ${className}`}
      title={tooltip}
    >
      {statName.toUpperCase()} {statValue} / {middle} {'→'} {preview.successPct}%
    </span>
  )
}

export default AttackPreviewChip
