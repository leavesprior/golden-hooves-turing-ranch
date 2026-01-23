'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { useGame } from '@/lib/gameContext'
import { getLocationBySlug, locations } from '@/lib/locations'

export default function CluePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const location = getLocationBySlug(slug)

  const { gameState, session, discoverLocation, availableLocations, startGame } = useGame()

  const [discovered, setDiscovered] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Check if already discovered
  const alreadyDiscovered = session?.discoveredLocations.includes(slug) || false

  // Handle discovery when page loads (QR scan)
  useEffect(() => {
    if (location && gameState === 'playing' && !alreadyDiscovered) {
      // Check if this location is part of current game
      const isInGame = availableLocations.some(loc => loc.slug === slug)
      if (isInGame) {
        const result = discoverLocation(slug)
        if (result.success) {
          setDiscovered(true)
          setPointsEarned(result.points)
          setShowConfetti(true)
          setIsComplete(result.isComplete)

          // Play sound effect
          if (location.soundEffect) {
            const audio = new Audio(`/sounds/${location.soundEffect}`)
            audio.play().catch(() => {})
          }

          setTimeout(() => setShowConfetti(false), 3000)
        }
      }
    }
  }, [location, gameState, alreadyDiscovered, slug])

  if (!location) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
        <PixelNavigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-fire-orange)] text-lg mb-8">
            Location Not Found
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-8">
            This QR code doesn't match any known location.
          </p>
          <PixelButton href="/" variant="gold" size="md">
            Return Home
          </PixelButton>
        </div>
      </div>
    )
  }

  // Get next clue
  const currentIndex = locations.findIndex(loc => loc.slug === slug)
  const nextLocation = availableLocations.find(
    loc => !session?.discoveredLocations.includes(loc.slug) && loc.slug !== slug
  )

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)] relative overflow-hidden">
      <PixelNavigation />

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ['#f4d76b', '#e8a027', '#3e8948', '#41a6f6', '#b13e53'][i % 5],
                animation: `fall ${1 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Location Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{location.icon}</div>
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg mb-2">
            {location.name}
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Location {location.id} of 14
          </p>
        </div>

        {/* Discovery Status */}
        {gameState === 'playing' && (discovered || alreadyDiscovered) && (
          <div className="bg-[var(--pixel-forest-dark)] border-4 border-[var(--pixel-forest-mid)] p-4 mb-6 text-center">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-forest-light)]">
              {discovered ? (
                <>
                  <span className="text-[var(--pixel-gold-light)]">+{pointsEarned} POINTS!</span>
                  <br />Location Discovered!
                </>
              ) : (
                'Already Discovered'
              )}
            </p>
          </div>
        )}

        {/* Not Playing Yet */}
        {gameState === 'menu' && (
          <PixelCard title="Start Your Quest!">
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-4">
              You found a clue location! Start a treasure hunt to earn points and discover the story.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <PixelButton onClick={() => startGame('easy')} variant="green" size="sm">
                Easy Quest (5 clues)
              </PixelButton>
              <PixelButton onClick={() => startGame('medium')} variant="gold" size="sm">
                Medium Quest (8 clues)
              </PixelButton>
              <PixelButton onClick={() => startGame('hard')} variant="orange" size="sm">
                Full Quest (14 clues)
              </PixelButton>
            </div>
          </PixelCard>
        )}

        {/* Game Complete */}
        {isComplete && (
          <PixelCard title="QUEST COMPLETE!">
            <div className="text-center space-y-4">
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                You discovered all the treasures!
              </p>
              <PixelButton href="/certificate" variant="gold" size="md">
                Claim Your Reward
              </PixelButton>
            </div>
          </PixelCard>
        )}

        {/* Story Fragment */}
        <PixelCard title="The Story Unfolds...">
          <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)] whitespace-pre-line">
            {location.storyFragment}
          </p>
        </PixelCard>

        {/* Practical Info */}
        <PixelCard title="Good to Know">
          <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-forest-light)]">
            {location.practicalInfo}
          </p>
        </PixelCard>

        {/* Gold County Fact */}
        <div className="bg-[var(--pixel-gold-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 my-6">
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
            <span className="text-[var(--pixel-ui-text)]">Gold Country Fact: </span>
            {location.goldCountyFact}
          </p>
        </div>

        {/* Next Clue */}
        {gameState === 'playing' && nextLocation && !isComplete && (
          <PixelCard title="Your Next Clue">
            <p className="font-[var(--font-pixel)] text-[10px] text-center leading-relaxed text-[var(--pixel-gold-light)] italic mb-6">
              {nextLocation.clueRhyme}
            </p>
            <div className="text-center">
              <PixelButton href="/game" variant="gold" size="md">
                Back to Quest Map
              </PixelButton>
            </div>
          </PixelCard>
        )}

        {/* Book Your Stay CTA */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-[var(--pixel-bg-mid)] via-[var(--pixel-ui-bg)] to-[var(--pixel-bg-mid)] p-6 border-4 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-4">
              Love the adventure? Book your stay at Back of Beyond Ranch!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <PixelButton href="/rentals" variant="orange" size="sm">
                Book Direct & Save 15%
              </PixelButton>
              <PixelButton
                href="https://airbnb.com/h/backofbeyondranch"
                variant="blue"
                size="sm"
              >
                View on Airbnb
              </PixelButton>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for confetti */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
