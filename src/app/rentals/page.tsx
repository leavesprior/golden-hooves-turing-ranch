'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard, BookStayButton } from '@/components/pixel'
import { useGame } from '@/lib/gameContext'

const RANCH_ORIGIN = '38.3947,-120.5269'
function mapsDir(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${RANCH_ORIGIN}&destination=${encodeURIComponent(destination)}`
}

// Real BOBR property photos shipped in /public/cabin-photos.
// Hero = cabin-1; gallery = the rest. cabin-6 is .png; the rest are .jpg.
const propertyPhotos = [
  { src: '/cabin-photos/cabin-1.jpg', alt: 'BOBR exterior with mountain backdrop' },
  { src: '/cabin-photos/cabin-2.jpg', alt: 'Living room with fireplace' },
  { src: '/cabin-photos/cabin-3.jpg', alt: 'Hot tub with mountain views' },
  { src: '/cabin-photos/cabin-4.jpg', alt: 'Game room and billiard table' },
  { src: '/cabin-photos/cabin-5.jpg', alt: 'Full kitchen, ranch interior' },
  { src: '/cabin-photos/cabin-6.png', alt: 'Master bedroom with views' },
  { src: '/cabin-photos/cabin-7.jpg', alt: 'Lake and grounds' },
  { src: '/cabin-photos/cabin-8.jpg', alt: 'Dining and gathering area' },
]

const amenities = [
  { icon: '🛏️', name: '6 Bedrooms', desc: 'Sleeps 12 guests' },
  { icon: '♨️', name: 'Hot Tub', desc: 'Under the stars' },
  { icon: '🔥', name: 'Fire Pit', desc: 'S\'mores included' },
  { icon: '🎮', name: 'Game Room', desc: 'Pool table & games' },
  { icon: '🏔️', name: 'Mountain Views', desc: '360° panorama' },
  { icon: '🍳', name: 'Full Kitchen', desc: 'Chef-ready' },
  { icon: '📶', name: 'Fast WiFi', desc: 'Work remotely' },
  { icon: '🚗', name: 'Free Parking', desc: '6+ vehicles' },
  { icon: '⚡', name: 'Level 2 EV', desc: 'Solar overnight · Tesla adapter' },
]

const nearby: Array<{
  name: string
  time: string
  icon: string
  href: string
  external?: boolean
  go: string
}> = [
  {
    name: 'Kirkwood Ski Resort',
    time: '45 min',
    icon: '⛷️',
    href: mapsDir('Kirkwood Mountain Resort, California'),
    external: true,
    go: 'Directions',
  },
  {
    name: 'Bear Valley Ski',
    time: '1 hr',
    icon: '🏂',
    href: mapsDir('Bear Valley Mountain Resort, California'),
    external: true,
    go: 'Directions',
  },
  {
    name: 'Wine Country',
    time: '50 min',
    icon: '🍷',
    href: mapsDir('Ironstone Vineyards, Murphys, California'),
    external: true,
    go: 'Ironstone · Murphys',
  },
  {
    name: 'Historic Gold Mines',
    time: '15 min',
    icon: '⛏️',
    href: mapsDir('Angels Camp, California'),
    external: true,
    go: 'Angels Camp · directions',
  },
]

export default function RentalsPage() {
  const { getReward, getEarlyReward, gameState } = useGame()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const reward = getReward()
  const earlyReward = getEarlyReward()
  const hero = propertyPhotos[heroIndex]

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Game Reward Banner */}
        {gameState === 'complete' && reward && (
          <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] via-[var(--pixel-fire-orange)] to-[var(--pixel-gold-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6 text-center">
            <p className="read-body text-[var(--pixel-ui-text)]">
              Quest Complete! You earned <span className="text-[var(--pixel-gold-light)]">{reward.discount}% OFF</span>
            </p>
            {reward.code ? (
              <p className="read-body text-[var(--pixel-gold-light)] mt-2">
                Use code: <span className="bg-[var(--pixel-bg-dark)] px-2 py-1 mx-1">{reward.code}</span>
              </p>
            ) : (
              <p className="read-body text-[var(--pixel-gold-light)] mt-2">
                Completion rewards are verified by the host before booking.
              </p>
            )}
            <p className="read-body text-[var(--pixel-ui-text)] mt-2">
              Email <a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a> when booking direct to verify your quest completion.
            </p>
          </div>
        )}

        {/* Early-Bird Banner — visible mid-game until quest is completed */}
        {gameState !== 'complete' && earlyReward && (
          <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6 text-center">
            <p className="read-body text-[var(--pixel-gold-light)]">
              Early-Bird Unlocked: <span className="text-[var(--pixel-fire-orange)]">{earlyReward.discount}% OFF</span> your next direct stay
            </p>
            <p className="read-body text-[var(--pixel-ui-text)] mt-2">
              Code: <span className="bg-[var(--pixel-bg-dark)] px-2 py-1 mx-1">{earlyReward.code}</span>
            </p>
            <p className="read-body text-[var(--pixel-ui-text)] mt-2">
              Email <a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a> to redeem.
            </p>
            <p className="read-body text-[var(--pixel-forest-light)] mt-2">
              Expires {earlyReward.expiresAt.toLocaleDateString()} — finish the quest for up to 27% OFF.
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-[var(--pixel-gold-light)] text-3xl sm:text-5xl mb-4">
            Stay at Back of Beyond Ranch
          </h1>
          <p className="read-body text-[var(--pixel-ui-text)]">
            A house in Gold Country — the towns, mines, and theatre are a drive from the porch
          </p>
        </div>

        {/* Stats Banner */}
        <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4 mb-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 read-body">
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">4.84</span>
              <p className="text-[var(--pixel-ui-text)]">⭐ Rating</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">290</span>
              <p className="text-[var(--pixel-ui-text)]">Reviews</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">{reward ? `${reward.discount}%` : '10%'}</span>
              <p className="text-[var(--pixel-ui-text)]">{reward ? 'Your Discount' : 'Direct Discount'}</p>
            </div>
            <div className="text-center">
              <span className="text-[var(--pixel-gold-light)] text-lg">#1</span>
              <p className="text-[var(--read-ink)]">Airbnb in the area</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Hero + Gallery */}
            <div>
              <button
                onClick={() => setLightboxOpen(true)}
                className="block w-full bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] aspect-video relative overflow-hidden cursor-zoom-in group"
                aria-label="Open full-size photo"
              >
                <Image
                  src={hero.src}
                  alt={hero.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority
                />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 read-body text-[var(--pixel-gold-light)] pointer-events-none">
                  {heroIndex + 1} / {propertyPhotos.length} · click to enlarge
                </div>
              </button>

              {/* Thumbnail strip */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
                {propertyPhotos.map((p, i) => (
                  <button
                    key={p.src}
                    onClick={() => setHeroIndex(i)}
                    className={`relative aspect-square border-2 overflow-hidden transition-all ${
                      i === heroIndex
                        ? 'border-[var(--pixel-gold-light)] shadow-[0_0_8px_var(--pixel-gold-mid)]'
                        : 'border-[var(--pixel-ui-border)] opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`View photo ${i + 1}: ${p.alt}`}
                  >
                    <Image
                      src={p.src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
              <div
                onClick={() => setLightboxOpen(false)}
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                role="dialog"
                aria-label="Photo lightbox"
              >
                <div className="relative w-full max-w-5xl aspect-[3/2]">
                  <Image
                    src={hero.src}
                    alt={hero.alt}
                    fill
                    className="object-contain"
                    sizes="90vw"
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
                  className="absolute top-4 right-4 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-light)] px-3 py-1 read-body text-[var(--pixel-gold-light)]"
                >
                  Close
                </button>
              </div>
            )}

            {/* Amenities */}
            <PixelCard title="✨ Amenities">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {amenities.map((amenity) => (
                  <div key={amenity.name} className="text-center">
                    <span className="text-2xl">{amenity.icon}</span>
                    <p className="read-body text-[var(--pixel-gold-light)] mt-1">
                      {amenity.name}
                    </p>
                    <p className="read-body text-[16px] text-[var(--pixel-ui-text)]">
                      {amenity.desc}
                    </p>
                  </div>
                ))}
              </div>
            </PixelCard>

            {/* Description */}
            <PixelCard title="📜 About the Ranch">
              <div className="read-body leading-relaxed space-y-4">
                <p>
                  Nestled in the heart of Gold Country, Back of Beyond Ranch offers the perfect escape for adventurers, families, and anyone seeking mountain tranquility.
                </p>
                <p>
                  Our 6-bedroom retreat sleeps up to 12 guests comfortably, with modern amenities and rustic charm. Relax in the hot tub under starlit skies, gather around the fire pit for stories, or challenge friends to pool in the game room.
                </p>
                <p>
                  Kirkwood and Bear Valley sit up the mountain; Ironstone and Murphys hold the wine country;
                  Volcano and the Mother Lode keep the Gold Rush towns. Walk them on the map below, then stay
                  if the country has hold of you.
                </p>
              </div>
            </PixelCard>

            {/* Nearby */}
            <PixelCard title="🗺️ Nearby Adventures">
              <div className="grid sm:grid-cols-2 gap-4">
                {nearby.map((place) => {
                  const className = 'flex items-center gap-3 bg-[var(--pixel-bg-dark)] p-3 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-mid)] transition-colors cursor-pointer'
                  const inner = (
                    <>
                      <span className="text-2xl">{place.icon}</span>
                      <div className="min-w-0">
                        <p className="read-body text-[var(--pixel-gold-light)]">
                          {place.name}
                        </p>
                        <p className="read-body text-[16px] text-[var(--pixel-forest-light)]">
                          {place.time} drive · {place.go} →
                        </p>
                      </div>
                    </>
                  )
                  if (place.external) {
                    return (
                      <a
                        key={place.name}
                        href={place.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {inner}
                      </a>
                    )
                  }
                  return (
                    <Link key={place.name} href={place.href} className={className}>
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </PixelCard>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <PixelCard title="Book direct">
              <div className="space-y-4">
                <p className="read-body">
                  Book direct and save 10% versus Airbnb. Instant confirmation. Free cancellation.
                </p>
                <BookStayButton variant="gold" size="lg">
                  Check Availability
                </BookStayButton>
                <p className="read-body text-center">
                  Send me a message on Airbnb when requesting to book and I will provide the discount.
                </p>
                <BookStayButton variant="clear" size="md">
                  Message on Airbnb
                </BookStayButton>
              </div>
            </PixelCard>

            {gameState === 'complete' && reward ? (
            <PixelCard title="Your bonus">
              <p className="read-body mb-3">You earned {reward.discount}% off a return stay.</p>
              <PixelButton href="/certificate" variant="gold" size="sm">
                View Certificate
              </PixelButton>
            </PixelCard>
            ) : (
            <PixelCard title="After you book">
              <p className="read-body mb-3">
                Once you have a stay, play the Golden Frog Trail and earn up to 27% off a return visit. The bonus is the discount.
              </p>
              <PixelButton href="/oregon-trail" variant="clear" size="sm">
                Play Golden Frog Trail
              </PixelButton>
            </PixelCard>
            )}

            <PixelCard title="Questions">
              <p className="read-body">We respond within an hour.</p>
              <a href="mailto:contact@backofbeyondranch.farm" className="mt-3 inline-block font-serif text-xl text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">
                contact@backofbeyondranch.farm
              </a>
            </PixelCard>
          </div>
        </div>
      </div>
    </div>
  )
}
