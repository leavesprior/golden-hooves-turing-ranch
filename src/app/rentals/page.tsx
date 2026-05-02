'use client'

import { useState } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { useGame } from '@/lib/gameContext'
import { airbnbBookingLink } from '@/lib/airbnbLink'

const amenities = [
  { icon: '🛏️', name: '6 Bedrooms', desc: 'Sleeps 12 guests' },
  { icon: '♨️', name: 'Hot Tub', desc: 'Under the stars' },
  { icon: '🔥', name: 'Fire Pit', desc: 'S\'mores included' },
  { icon: '🎮', name: 'Game Room', desc: 'Pool table & games' },
  { icon: '🏔️', name: 'Mountain Views', desc: '360° panorama' },
  { icon: '🍳', name: 'Full Kitchen', desc: 'Chef-ready' },
  { icon: '📶', name: 'Fast WiFi', desc: 'Work remotely' },
  { icon: '🚗', name: 'Free Parking', desc: '6+ vehicles' },
]

const nearby = [
  { name: 'Kirkwood Ski Resort', time: '25 min', icon: '⛷️' },
  { name: 'Bear Valley Ski', time: '35 min', icon: '🏂' },
  { name: 'Wine Country', time: '20 min', icon: '🍷' },
  { name: 'Historic Gold Mines', time: '15 min', icon: '⛏️' },
]

export default function RentalsPage() {
  const { getReward, getEarlyReward, gameState } = useGame()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const reward = getReward()
  const earlyReward = getEarlyReward()

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Game Reward Banner */}
        {gameState === 'complete' && reward && (
          <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] via-[var(--pixel-fire-orange)] to-[var(--pixel-gold-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6 text-center">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
              Quest Complete! You earned <span className="text-[var(--pixel-gold-light)]">{reward.discount}% OFF</span>
            </p>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-2">
              Use code: <span className="bg-[var(--pixel-bg-dark)] px-2 py-1 mx-1">{reward.code}</span>
            </p>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] mt-2">
              Email <a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a> when booking direct to redeem.
            </p>
          </div>
        )}

        {/* Early-Bird Banner — visible mid-game until quest is completed */}
        {gameState !== 'complete' && earlyReward && (
          <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6 text-center">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
              Early-Bird Unlocked: <span className="text-[var(--pixel-fire-orange)]">{earlyReward.discount}% OFF</span> your next direct stay
            </p>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mt-2">
              Code: <span className="bg-[var(--pixel-bg-dark)] px-2 py-1 mx-1">{earlyReward.code}</span>
            </p>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] mt-2">
              Email <a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a> to redeem.
            </p>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)] mt-2">
              Expires {earlyReward.expiresAt.toLocaleDateString()} — finish the quest for up to 27% OFF.
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-4">
            🏨 THE INN 🏨
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Your base camp for Gold Country adventure
          </p>
        </div>

        {/* Stats Banner */}
        <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4 mb-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 font-[var(--font-pixel)] text-[8px]">
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">4.85</span>
              <p className="text-[var(--pixel-ui-text)]">⭐ Rating</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">268</span>
              <p className="text-[var(--pixel-ui-text)]">Reviews</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-forest-light)] text-lg">{reward ? `${reward.discount}%` : '10%'}</span>
              <p className="text-[var(--pixel-ui-text)]">{reward ? 'Your Discount' : 'Direct Discount'}</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-fire-orange)] text-lg">#1</span>
              <p className="text-[var(--pixel-ui-text)]">in Area</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Image Placeholder */}
            <div className="bg-gradient-to-b from-[var(--pixel-sky-dark)] to-[var(--pixel-forest-dark)] border-4 border-[var(--pixel-ui-border)] aspect-video relative overflow-hidden">
              {/* Pixel art cabin scene */}
              <div className="absolute inset-0 flex items-end justify-center pb-8">
                <div className="relative">
                  <div className="w-48 h-28 bg-[var(--pixel-earth-dark)] relative">
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[100px] border-r-[100px] border-b-[55px] border-l-transparent border-r-transparent border-b-[var(--pixel-earth-mid)]" />
                    <div className="absolute top-4 left-4 w-10 h-10 bg-[var(--pixel-cabin-window)] shadow-[0_0_20px_var(--pixel-cabin-glow)]" />
                    <div className="absolute top-4 right-4 w-10 h-10 bg-[var(--pixel-cabin-window)] shadow-[0_0_20px_var(--pixel-cabin-glow)]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-[var(--pixel-earth-mid)]" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                📸 Gallery coming soon
              </div>
            </div>

            {/* Amenities */}
            <PixelCard title="✨ Amenities">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {amenities.map((amenity) => (
                  <div key={amenity.name} className="text-center">
                    <span className="text-2xl">{amenity.icon}</span>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-1">
                      {amenity.name}
                    </p>
                    <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">
                      {amenity.desc}
                    </p>
                  </div>
                ))}
              </div>
            </PixelCard>

            {/* Description */}
            <PixelCard title="📜 About the Ranch">
              <div className="font-[var(--font-pixel)] text-[8px] leading-relaxed space-y-4">
                <p>
                  Nestled in the heart of Gold Country, Back of Beyond Ranch offers the perfect escape for adventurers, families, and anyone seeking mountain tranquility.
                </p>
                <p>
                  Our 6-bedroom retreat sleeps up to 12 guests comfortably, with modern amenities and rustic charm. Relax in the hot tub under starlit skies, gather around the fire pit for stories, or challenge friends to pool in the game room.
                </p>
                <p>
                  Minutes from world-class skiing, historic gold mines, and wine country—adventure awaits in every direction!
                </p>
              </div>
            </PixelCard>

            {/* Nearby */}
            <PixelCard title="🗺️ Nearby Adventures">
              <div className="grid sm:grid-cols-2 gap-4">
                {nearby.map((place) => (
                  <div key={place.name} className="flex items-center gap-3 bg-[var(--pixel-bg-dark)] p-3 border-2 border-[var(--pixel-ui-border)]">
                    <span className="text-2xl">{place.icon}</span>
                    <div>
                      <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
                        {place.name}
                      </p>
                      <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-forest-light)]">
                        {place.time} drive
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <PixelCard title="📅 Book Direct & Save">
              <div className="space-y-4">
                <div className="bg-[var(--pixel-forest-dark)] border-2 border-[var(--pixel-forest-mid)] p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-forest-light)]">
                    💰 SAVE 10%
                  </p>
                  <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">
                    vs. Airbnb booking
                  </p>
                </div>

                <div className="space-y-3">
                  <PixelButton href={airbnbBookingLink('rentals')} variant="gold" size="md">
                    Check Availability
                  </PixelButton>
                  <p className="font-[var(--font-pixel)] text-[6px] text-center text-[var(--pixel-ui-text)]">
                    or contact us directly
                  </p>
                  <PixelButton variant="green" size="sm">
                    📧 Send Message
                  </PixelButton>
                </div>

                <div className="border-t-2 border-[var(--pixel-ui-border)] pt-4">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-2">
                    Instant confirmation • Free cancellation
                  </p>
                </div>
              </div>
            </PixelCard>

            <PixelCard title="⚔️ Bonus: Treasure Hunt">
              <div className="space-y-4">
                {gameState === 'complete' && reward ? (
                  <>
                    <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-forest-light)]">
                      You completed the Golden Hooves Legacy!
                    </p>
                    <div className="bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] p-3 text-center">
                      <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                        {reward.discount}% OFF
                      </p>
                      <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">
                        {reward.tier.toUpperCase()} TIER
                      </p>
                    </div>
                    <PixelButton href="/certificate" variant="gold" size="sm">
                      View Certificate
                    </PixelButton>
                  </>
                ) : (
                  <>
                    <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed">
                      Every stay includes access to our exclusive treasure hunt game! Explore the ranch, solve riddles, and earn up to 27% off your next stay.
                    </p>
                    <PixelButton href="/game" variant="orange" size="sm">
                      {gameState === 'playing' ? 'Continue Quest' : 'Start the Quest'}
                    </PixelButton>
                  </>
                )}
              </div>
            </PixelCard>

            <PixelCard title="📞 Questions?">
              <div className="font-[var(--font-pixel)] text-[8px] space-y-2">
                <p>We respond within 1 hour</p>
                <p><a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a></p>
              </div>
            </PixelCard>
          </div>
        </div>
      </div>
    </div>
  )
}
