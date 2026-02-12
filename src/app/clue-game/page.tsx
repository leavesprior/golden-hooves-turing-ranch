'use client'

import { useState, useEffect } from 'react'
import { PixelNavigation, PixelButton } from '@/components/pixel'

export default function ClueGamePage() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const unlocked = localStorage.getItem('bobr_clue_game_unlocked') === 'true'
    setIsUnlocked(unlocked)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-2">
            CYNTHIA'S TREASURE HUNT
          </h1>
          <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
            The Golden Hooves Legacy
          </p>
        </div>

        {/* Main Content */}
        <div className="border-4 border-[var(--pixel-gold-mid)] bg-[var(--pixel-bg-mid)] p-6 text-center space-y-6">
          {isUnlocked ? (
            <>
              <div className="text-4xl">🏡</div>
              <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
                Quest Unlocked!
              </h2>
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] max-w-md mx-auto">
                Cynthia has entrusted you with the location of Tobias's legacy.
                Visit Back of Beyond Ranch in person to begin the treasure hunt.
              </p>
              <div className="bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-4 max-w-xs mx-auto">
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-3">
                  HOW IT WORKS
                </p>
                <div className="space-y-2 text-left">
                  <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
                    1. Book your stay at Back of Beyond Ranch
                  </p>
                  <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
                    2. Find the QR codes hidden around the property
                  </p>
                  <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
                    3. Scan each code to unlock clues
                  </p>
                  <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
                    4. Solve the puzzle to discover Tobias's treasure
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <PixelButton href="/rentals" variant="gold" size="md">
                  Book Your Stay
                </PixelButton>
                <PixelButton href="/adventure" variant="blue" size="sm">
                  Back to Adventure
                </PixelButton>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl">🔒</div>
              <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-ui-text)]">
                Quest Locked
              </h2>
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] opacity-70 max-w-md mx-auto">
                Complete The Prospector's Tale adventure with good karma to unlock
                Cynthia's Treasure Hunt — a real-world QR code mystery at Back of Beyond Ranch.
              </p>
              <div className="space-y-2">
                <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-50">
                  Requirements:
                </p>
                <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-fire-red)]">
                  {'\u2610'} Complete all 5 chapters
                </p>
                <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-fire-red)]">
                  {'\u2610'} Achieve Neutral Good alignment or better
                </p>
                <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-fire-red)]">
                  {'\u2610'} Meet Cynthia at the Inn
                </p>
              </div>
              <PixelButton href="/adventure" variant="green" size="md">
                Start the Adventure
              </PixelButton>
            </>
          )}
        </div>

        {/* Teaser */}
        <div className="mt-8 text-center bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6">
          <h3 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm mb-3">
            About the Ranch
          </h3>
          <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] max-w-md mx-auto">
            Back of Beyond Ranch is a real Gold Country property in the Sierra Nevada foothills
            of California. The same land where miners sought fortune 170 years ago.
          </p>
          <div className="mt-4">
            <PixelButton href="/" variant="blue" size="sm">
              Learn More About the Ranch
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
