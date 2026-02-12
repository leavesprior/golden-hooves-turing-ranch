'use client'

import React, { useState, useEffect } from 'react'
import type { AlignmentPosition } from '@/lib/karmaStorage'

interface ClueGameUnlockProps {
  karmaAlignment: AlignmentPosition | null
  chaptersCompleted: number
  playerName: string
  onClose: () => void
}

const WORTHY_ALIGNMENTS: AlignmentPosition[] = [
  'lawful_good', 'neutral_good', 'chaotic_good', 'lawful_neutral', 'true_neutral',
]

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
      const stored = localStorage.getItem('bobr_clue_game_unlocked')
      if (stored === 'true') setUnlocked(true)
    }
  }, [])

  const handleUnlock = () => {
    localStorage.setItem('bobr_clue_game_unlocked', 'true')
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

  if (!hasCompletedGame) {
    return (
      <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)] p-6 text-center">
        <span className="text-3xl">🔒</span>
        <h3 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mt-3">
          Complete all 5 chapters to meet Cynthia
        </h3>
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-2">
          The innkeeper has a story for those who finish the journey.
        </p>
        <button
          onClick={onClose}
          className="mt-4 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] border border-[var(--pixel-ui-border)] px-4 py-2 hover:text-[var(--pixel-gold-light)]"
        >
          RETURN
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-amber-950 via-stone-950 to-black border-4 border-[var(--pixel-gold-mid)] min-h-[400px]">
      {/* Inn Header */}
      <div className="p-4 border-b-2 border-[var(--pixel-gold-mid)]/30 text-center">
        <span className="text-3xl">🏨</span>
        <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)] mt-2">
          Cynthia's Inn
        </h2>
        <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60">
          A warm fire crackles. The innkeeper beckons you closer.
        </p>
      </div>

      {/* Dialogue */}
      <div className="p-4">
        <div className="bg-black/40 border-2 border-[var(--pixel-ui-border)] p-4 space-y-3">
          {/* NPC portrait area */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)] flex items-center justify-center shrink-0">
              <span className="text-2xl">👩‍🍳</span>
            </div>
            <div>
              <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                Cynthia — Innkeeper
              </span>
            </div>
          </div>

          {/* Dialogue text */}
          <div className="min-h-[80px]">
            {dialogue.slice(0, dialogueStep + 1).map((line, i) => (
              <p
                key={i}
                className={`font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mt-2 ${
                  i < dialogueStep ? 'opacity-50' : ''
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--pixel-ui-border)]/30">
            {dialogueStep < dialogue.length - 1 ? (
              <button
                onClick={() => setDialogueStep(prev => prev + 1)}
                className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] border-2 border-[var(--pixel-gold-mid)] px-4 py-2 hover:bg-[var(--pixel-gold-dark)]"
              >
                Continue {'\u25B6'}
              </button>
            ) : (
              <div className="space-y-2 w-full">
                {isWorthy && !unlocked && (
                  <button
                    onClick={handleUnlock}
                    className="w-full font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] px-4 py-3 hover:bg-[var(--pixel-gold-mid)] transition-all"
                  >
                    {'\uD83D\uDD11'} ACCEPT CYNTHIA'S QUEST
                  </button>
                )}

                {unlocked && (
                  <div className="text-center p-3 bg-[var(--pixel-gold-dark)]/30 border-2 border-[var(--pixel-gold-mid)]">
                    <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                      {'\u2705'} QUEST UNLOCKED
                    </p>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mt-2">
                      Visit Back of Beyond Ranch in person to begin the treasure hunt.
                    </p>
                    <div className="mt-3 p-2 bg-black/40 border border-[var(--pixel-ui-border)]">
                      <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
                        QR Code Placeholder
                      </p>
                      <div className="w-24 h-24 mx-auto mt-2 bg-white/10 border-2 border-[var(--pixel-ui-border)] flex items-center justify-center">
                        <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-40">
                          [QR]
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] border border-[var(--pixel-ui-border)] px-4 py-2 hover:text-[var(--pixel-gold-light)]"
                >
                  {'\u2190'} LEAVE INN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
