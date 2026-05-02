'use client'

import Image from 'next/image'
import { ReactNode } from 'react'

// ClueSceneV2 — Option 3 visual layout (with Option 7 polish path).
// Real-photo backdrop + character portrait + 16-bit dialogue UI.
// `visualMode='retro'` (default) is the Option 3 ship-now look.
// `visualMode='painterly'` is the Option 7 v2 polish path — same component,
// swapped assets + softer dialogue-box styling so the future migration is
// a one-prop change, not a rewrite.

export type VisualMode = 'retro' | 'painterly'

export interface ClueSceneV2Props {
  /** Real photograph used as the scene backdrop (Sierra-foothills, hot-tub, game-room, etc.) */
  backdropSrc: string
  /** Alt text for accessibility / SEO */
  backdropAlt: string
  /** Character portrait PNG. Defaults to /sprites/tobias-portrait.png. */
  spriteSrc?: string
  /** Sprite alt text */
  spriteAlt?: string
  /** UPPERCASE location title for the dialogue box header */
  locationTitle: string
  /** "Location N of 14" — pass the marker number */
  locationNumber: number
  /** Total markers (default 14 for The Golden Hooves Legacy) */
  locationTotal?: number
  /** Story fragment text for the dialogue box */
  dialogueText: string
  /** Optional points-earned readout in the corner ("+200 POINTS") */
  pointsEarned?: number
  /** 'retro' = Option 3 (default), 'painterly' = Option 7 polish path */
  visualMode?: VisualMode
  /** Optional next-clue rhyme rendered below the dialogue */
  children?: ReactNode
}

const DEFAULT_PORTRAIT = '/sprites/tobias-portrait.png'

export function ClueSceneV2({
  backdropSrc,
  backdropAlt,
  spriteSrc = DEFAULT_PORTRAIT,
  spriteAlt = 'Tobias Goldsworth',
  locationTitle,
  locationNumber,
  locationTotal = 14,
  dialogueText,
  pointsEarned,
  visualMode = 'retro',
  children,
}: ClueSceneV2Props) {
  const isPainterly = visualMode === 'painterly'
  // Dialogue box styling differs by mode.
  // - retro: hard pixel borders, dark wood, gold trim, pixel font
  // - painterly: softer parchment look, gentle gold leaf, serif-ish (still pixel font for now until painterly font asset arrives)
  const dialogueBg = isPainterly ? 'bg-[#3a2b18]/90' : 'bg-[#3a1d0d]/95'
  const dialogueBorderColor = isPainterly ? '#a8794d' : '#8b5a2b'
  const dialogueGoldShadow = isPainterly
    ? 'inset 0 0 0 1px #e0b870, inset 0 0 0 3px #3a2b18'
    : 'inset 0 0 0 2px #d4a04a, inset 0 0 0 4px #3a1d0d'
  // Painterly gradient is softer (less darkening of the photo)
  const gradientClass = isPainterly
    ? 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
    : 'bg-gradient-to-t from-black/70 via-transparent to-transparent'
  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video overflow-hidden border-4 border-[var(--pixel-ui-border)] shadow-2xl">
      {/* Backdrop */}
      <Image
        src={backdropSrc}
        alt={backdropAlt}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 1024px"
      />

      {/* Subtle bottom gradient so dialogue box reads */}
      <div className={`absolute inset-0 ${gradientClass} pointer-events-none`} />

      {/* Points readout — top-right pixel font */}
      {pointsEarned !== undefined && (
        <div className="absolute top-3 right-3 z-20 font-[var(--font-pixel)] text-base sm:text-lg drop-shadow-[2px_2px_0_rgba(0,0,0,0.9)]">
          <span className="text-[var(--pixel-gold-light)]">+{pointsEarned}</span>{' '}
          <span className="text-[var(--pixel-gold-mid)]">POINTS</span>
        </div>
      )}

      {/* Bottom dialogue cluster — character sprite + dialogue box */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end gap-2 sm:gap-3 p-3 sm:p-4">
        {/* Character sprite */}
        {spriteSrc && (
          <div className="relative w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0">
            <Image
              src={spriteSrc}
              alt={spriteAlt}
              fill
              className="object-contain object-bottom"
              sizes="160px"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}

        {/* Dialogue box — wooden frame with gold trim, pixel font (or softer parchment in painterly mode) */}
        <div
          className={`flex-1 relative ${dialogueBg} border-4 px-4 py-3 sm:px-6 sm:py-4`}
          style={{
            borderColor: dialogueBorderColor,
            boxShadow: dialogueGoldShadow,
          }}
        >
          {/* Title line */}
          <div className="font-[var(--font-pixel)] text-sm sm:text-base text-[var(--pixel-gold-light)] mb-1 sm:mb-2 uppercase tracking-wide">
            {locationTitle}
          </div>
          {/* Location N of N */}
          <div className="font-[var(--font-pixel)] text-[10px] sm:text-xs text-[var(--pixel-gold-mid)] mb-2 sm:mb-3">
            Location {locationNumber} of {locationTotal}
          </div>
          {/* Story fragment / dialogue (whitespace-pre-line lets multi-step
              dialogue migrations pass joined lines with paragraph breaks) */}
          <p className="font-[var(--font-pixel)] text-[11px] sm:text-sm leading-relaxed text-[var(--pixel-ui-text)] whitespace-pre-line">
            {dialogueText}
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}
