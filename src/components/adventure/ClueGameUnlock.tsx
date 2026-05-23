'use client'

import React, { useState, useEffect } from 'react'
import type { AlignmentPosition } from '@/lib/karmaStorage'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { ClueSceneV2 } from '@/components/clue/ClueSceneV2'

interface ClueGameUnlockProps {
  karmaAlignment: AlignmentPosition | null
  chaptersCompleted: number
  playerName: string
  onClose: () => void
}

const WORTHY_ALIGNMENTS: AlignmentPosition[] = [
  'lawful_good', 'neutral_good', 'chaotic_good', 'lawful_neutral', 'true_neutral',
]

// Cynthia's inn lives in the property's living room with the hearth — using
// the existing committed cabin photo so the scene grounds in the real space.
// When a Cynthia portrait sprite ships, drop it at /sprites/cynthia.png and
// pass it as spriteSrc here (the migration is a one-prop change).
const INN_BACKDROP = '/cabin-photos/cabin-2.jpg'
const INN_BACKDROP_ALT = "Cynthia's inn — the hearth at Back of Beyond Ranch"

export function ClueGameUnlock({
  karmaAlignment,
  chaptersCompleted,
  playerName,
  onClose,
}: ClueGameUnlockProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [dialogueStep, setDialogueStep] = useState(0)

  const isWorthy = karmaAlignment ? WORTHY_ALIGNMENTS.includes(karmaAlignment) : false
  const hasCompletedGame = chaptersCompleted >= 5

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMilestone = CrossGameStorage.hasMilestone('clue_game_unlocked')
      // Also check legacy key for backwards compat
      const legacy = localStorage.getItem('bobr_clue_game_unlocked') === 'true'
      if (hasMilestone || legacy) setUnlocked(true)
    }
  }, [])

  const handleUnlock = () => {
    CrossGameStorage.recordMilestone('clue_game_unlocked', 'clue_game')
    // Also write the legacy key so /clue-game (which only reads this) actually unlocks.
    if (typeof window !== 'undefined') {
      localStorage.setItem('bobr_clue_game_unlocked', 'true')
    }
    setUnlocked(true)
  }

  // Cynthia's dialogue for worthy players
  const worthyDialogue = [
    `"Well, well... ${playerName}. I've been watching your journey from the very beginning."`,
    '"My name is Cynthia. I\'ve kept this inn for... longer than most remember."',
    '"Pryor was a friend of mine — the best kind. Honest, brave, and kind to strangers."',
    '"He left something behind when he passed. Something meant for someone worthy."',
    '"I believe that someone is you."',
    '"When you visit Pryor\'s Back of Beyond Ranch in person, look for the QR codes. They\'ll guide you to what he hid."',
    '"But remember — the treasure isn\'t just gold. It never was."',
  ]

  // Cynthia's dialogue for unworthy players
  const unworthyDialogue = [
    `"${playerName}... I see you've made it this far."`,
    '"I\'m Cynthia. I run this inn, and I know everyone who passes through."',
    '"Tobias left something behind. Something precious."',
    '"But you\'re not the kind of person he\'d trust with it. Not yet."',
    '"Your choices have consequences, traveler. The alignment of your soul matters here."',
    '"Come back when your heart has found a better path. Show kindness. Follow the rules that matter."',
    `"Your alignment: ${karmaAlignment?.replace(/_/g, ' ')}. Tobias trusted the good-hearted."`,
  ]

  const dialogue = isWorthy ? worthyDialogue : unworthyDialogue
  // Render all dialogue revealed so far as a single multi-paragraph block;
  // ClueSceneV2's whitespace-pre-line handles the paragraph breaks.
  const visibleDialogue = dialogue.slice(0, dialogueStep + 1).join('\n\n')
  const isLastStep = dialogueStep >= dialogue.length - 1

  // Locked state — chapters not yet complete. Uses ClueSceneV2 with a brief
  // gate dialogue so the visual contract stays consistent across games.
  if (!hasCompletedGame) {
    return (
      <div className="space-y-3">
        <ClueSceneV2
          backdropSrc={INN_BACKDROP}
          backdropAlt="The inn from afar — closed for now"
          locationTitle="CYNTHIA'S INN"
          locationNumber={chaptersCompleted}
          locationTotal={5}
          dialogueText={`The inn's lamps are dim. Cynthia speaks only to those who've finished the journey.\n\nComplete all 5 chapters to meet the innkeeper.`}
        >
          <button
            onClick={onClose}
            className="mt-4 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] border-2 border-[var(--pixel-ui-border)] px-4 py-2 hover:text-[var(--pixel-gold-light)]"
          >
            {'←'} RETURN
          </button>
        </ClueSceneV2>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ClueSceneV2
        backdropSrc={INN_BACKDROP}
        backdropAlt={INN_BACKDROP_ALT}
        locationTitle="CYNTHIA — INNKEEPER"
        locationNumber={dialogueStep + 1}
        locationTotal={dialogue.length}
        dialogueText={visibleDialogue}
        // No spriteSrc yet — Cynthia portrait pending. ClueSceneV2 renders
        // dialogue full-width when spriteSrc is omitted.
      >
        {/* Action area below the scene — preserves the original
            dialogue-walking + accept/leave UX, just with the scene
            wrapper around the visual layer. */}
        <div className="mt-4 space-y-2 w-full">
          {!isLastStep && (
            <button
              onClick={() => setDialogueStep(prev => prev + 1)}
              className="w-full font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] border-2 border-[var(--pixel-gold-mid)] px-4 py-2 hover:bg-[var(--pixel-gold-dark)] transition-colors"
            >
              Continue {'▶'}
            </button>
          )}

          {isLastStep && isWorthy && !unlocked && (
            <button
              onClick={handleUnlock}
              className="w-full font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] px-4 py-3 hover:bg-[var(--pixel-gold-mid)] transition-colors"
            >
              {'🔑'} ACCEPT CYNTHIA'S QUEST
            </button>
          )}

          {isLastStep && unlocked && (
            <div className="text-center p-3 bg-[var(--pixel-gold-dark)]/30 border-2 border-[var(--pixel-gold-mid)]">
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                {'✅'} QUEST UNLOCKED
              </p>
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mt-2">
                Visit Back of Beyond Ranch in person to begin the treasure hunt.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] border border-[var(--pixel-ui-border)] px-4 py-2 hover:text-[var(--pixel-gold-light)]"
          >
            {'←'} LEAVE INN
          </button>
        </div>
      </ClueSceneV2>
    </div>
  )
}
