'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

// Cabin photos from Airbnb listing
const cabinPhotos = [
  '/cabin-photos/cabin-1.jpg',
  '/cabin-photos/cabin-2.jpg',
  '/cabin-photos/cabin-3.jpg',
  '/cabin-photos/cabin-4.jpg',
  '/cabin-photos/cabin-5.jpg',
  '/cabin-photos/cabin-7.jpg',
  '/cabin-photos/cabin-8.jpg',
]

const AIRBNB_URL = 'https://airbnb.com/h/backofbeyondranch'

export default function Home() {
  const [showCursor, setShowCursor] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    // Rotate photos every 8 seconds
    const photoInterval = setInterval(() => {
      setCurrentPhotoIndex(prev => (prev + 1) % cabinPhotos.length)
    }, 8000)

    return () => {
      clearInterval(cursorInterval)
      clearInterval(photoInterval)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      {/* Hero Section - Photo Background with Pixel Overlay */}
      <section className="relative min-h-[80vh] overflow-hidden">
        {/* Rotating Photo Background */}
        <div className="absolute inset-0">
          {cabinPhotos.map((photo, index) => (
            <div
              key={photo}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentPhotoIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={photo}
                alt={`Back of Beyond Ranch - Photo ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        {/* Stars Background (on top of photos) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 13) % 40}%`,
                opacity: 0.3 + ((i % 5) * 0.1),
                animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${(i % 20) * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Mountain Silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 h-64">
          <svg className="absolute bottom-32 w-full h-32 fill-[var(--pixel-bg-mid)]" preserveAspectRatio="none" viewBox="0 0 100 20">
            <polygon points="0,20 10,8 20,15 30,5 45,12 55,3 70,10 85,6 100,12 100,20" />
          </svg>
          <svg className="absolute bottom-16 w-full h-32 fill-[var(--pixel-forest-dark)]" preserveAspectRatio="none" viewBox="0 0 100 20">
            <polygon points="0,20 15,10 25,15 40,5 55,12 65,8 80,14 95,6 100,10 100,20" />
          </svg>
          <div className="absolute bottom-0 w-full h-20 bg-[var(--pixel-forest-dark)]" />
        </div>

        {/* Cabin with Glowing Windows */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="w-40 h-24 bg-[var(--pixel-earth-dark)] relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[85px] border-r-[85px] border-b-[50px] border-l-transparent border-r-transparent border-b-[var(--pixel-earth-mid)]" />
              <div className="absolute -top-20 right-6 w-5 h-12 bg-[var(--pixel-earth-mid)]" />
              {/* Smoke */}
              <div className="absolute -top-24 right-6">
                <div className="pixel-steam w-3 h-3 bg-[var(--pixel-hot-tub-steam)] rounded-full opacity-60" />
                <div className="pixel-steam w-4 h-4 bg-[var(--pixel-hot-tub-steam)] rounded-full opacity-40 ml-1 -mt-1" style={{ animationDelay: '0.5s' }} />
              </div>
              {/* Windows */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-[var(--pixel-cabin-window)] shadow-[0_0_15px_var(--pixel-cabin-glow),0_0_30px_var(--pixel-cabin-window)]" />
              <div className="absolute top-4 right-4 w-8 h-8 bg-[var(--pixel-cabin-window)] shadow-[0_0_15px_var(--pixel-cabin-glow),0_0_30px_var(--pixel-cabin-window)]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-14 bg-[var(--pixel-earth-mid)]" />
            </div>
          </div>
        </div>

        {/* Hot Tub */}
        <div className="absolute bottom-16 right-1/4 z-10 hidden sm:block">
          <div className="relative">
            <div className="w-20 h-10 bg-[var(--pixel-earth-mid)] rounded-t-lg">
              <div className="absolute inset-2 bg-[var(--pixel-sky-mid)] rounded-t" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="pixel-steam w-2 h-2 bg-[var(--pixel-hot-tub-steam)] rounded-full" />
                <div className="pixel-steam w-3 h-3 bg-[var(--pixel-hot-tub-steam)] rounded-full" style={{ animationDelay: '0.3s' }} />
                <div className="pixel-steam w-2 h-2 bg-[var(--pixel-hot-tub-steam)] rounded-full" style={{ animationDelay: '0.6s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Barn */}
        <div className="absolute bottom-20 left-[15%] z-10 hidden md:block">
          <div className="relative">
            {/* Barn Structure */}
            <div className="w-24 h-16 bg-[#8B4513] relative">
              {/* Gambrel Roof */}
              <div className="absolute -top-6 left-0 w-24 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#654321]" />
              <div className="absolute -top-14 left-[12px] w-0 h-0 border-l-[12px] border-r-[12px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#654321]" />
              {/* Barn Door */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 bg-[#5D3A1A] border-2 border-[#3D2A0A]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#FFD700] rounded-full" />
              </div>
              {/* Hay Loft Window */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-[#F4D76B] opacity-50" />
            </div>
          </div>
        </div>

        {/* Horses in Corral */}
        <div className="absolute bottom-12 left-[8%] z-10 hidden lg:block">
          <div className="flex gap-2">
            {/* Horse 1 - Brown */}
            <div className="relative" style={{ animation: 'horseIdle 3s ease-in-out infinite' }}>
              <div className="text-xl">🐴</div>
            </div>
            {/* Horse 2 - Black */}
            <div className="relative" style={{ animation: 'horseIdle 3s ease-in-out infinite', animationDelay: '1s' }}>
              <div className="text-xl transform scale-x-[-1]">🐴</div>
            </div>
          </div>
          {/* Fence */}
          <div className="absolute -bottom-1 left-[-8px] w-16 h-1 bg-[var(--pixel-earth-mid)]" />
        </div>

        {/* Sheep Grazing */}
        <div className="absolute bottom-12 right-[10%] z-10 hidden lg:block">
          <div className="flex gap-1">
            <div className="text-sm" style={{ animation: 'graze 4s ease-in-out infinite' }}>🐑</div>
            <div className="text-sm" style={{ animation: 'graze 4s ease-in-out infinite', animationDelay: '1s' }}>🐑</div>
            <div className="text-xs mt-1" style={{ animation: 'graze 4s ease-in-out infinite', animationDelay: '2s' }}>🐑</div>
          </div>
        </div>

        {/* Cattle in Distance */}
        <div className="absolute bottom-28 left-[5%] z-5 hidden md:block opacity-70">
          <div className="flex gap-2">
            <div className="text-xs">🐄</div>
            <div className="text-[10px] mt-1">🐄</div>
            <div className="text-xs">🐂</div>
          </div>
        </div>

        {/* Emus near Barn */}
        <div className="absolute bottom-14 left-[22%] z-10 hidden lg:block">
          <div className="flex gap-1">
            <div className="text-lg" style={{ animation: 'emuWalk 5s ease-in-out infinite' }}>🦙</div>
            <div className="text-lg" style={{ animation: 'emuWalk 5s ease-in-out infinite', animationDelay: '2s' }}>🦙</div>
          </div>
        </div>

        {/* Pegasus Flying - Magical Easter Egg */}
        <div className="absolute z-20 hidden sm:block" style={{ animation: 'pegasusFly 20s linear infinite' }}>
          <div className="relative">
            <div className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ animation: 'wingFlap 0.5s ease-in-out infinite' }}>🦄</div>
            {/* Sparkle Trail */}
            <div className="absolute -right-2 top-0 text-xs opacity-60" style={{ animation: 'sparkle 0.3s ease-in-out infinite' }}>✨</div>
            <div className="absolute -right-4 top-1 text-[8px] opacity-40" style={{ animation: 'sparkle 0.3s ease-in-out infinite', animationDelay: '0.1s' }}>⭐</div>
          </div>
        </div>

        {/* Chickens Pecking */}
        <div className="absolute bottom-8 left-[18%] z-10 hidden lg:block">
          <div className="flex gap-1">
            <div className="text-xs" style={{ animation: 'peck 1.5s ease-in-out infinite' }}>🐔</div>
            <div className="text-xs" style={{ animation: 'peck 1.5s ease-in-out infinite', animationDelay: '0.5s' }}>🐔</div>
            <div className="text-[10px]" style={{ animation: 'peck 1.5s ease-in-out infinite', animationDelay: '1s' }}>🐥</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <div className="mb-8">
            <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-2xl md:text-3xl drop-shadow-[0_0_10px_var(--pixel-gold-mid)] mb-4">
              Back of Beyond Ranch
            </h1>
            <div className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)] tracking-widest">
              ═══════════════════════
            </div>
            <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-sky-light)] mt-2">
              A Gold Country Adventure
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <PixelButton href="/game" variant="gold" size="lg">
                ⚔️ Start Quest
              </PixelButton>
              <PixelButton href="/explore" variant="green" size="lg">
                🗺️ Explore Map
              </PixelButton>
            </div>
            <PixelButton href={AIRBNB_URL} variant="orange" size="md">
              🏨 Book Your Stay
            </PixelButton>
          </div>

          <div className="mt-12 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            <span className={showCursor ? 'opacity-100' : 'opacity-30'}>
              ▶ Press START to begin your adventure ◀
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 sm:gap-8 font-[var(--font-pixel)] text-[6px] sm:text-[8px] text-[var(--pixel-ui-text)]">
          <div className="flex items-center gap-1 sm:gap-2">
            <span>⭐</span>
            <span>268 Reviews</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span>🏆</span>
            <span>#1 Ranked</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span>🛏️</span>
            <span>Sleeps 12</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-[var(--pixel-bg-dark)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg text-center mb-12">
            Choose Your Path
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PixelCard title="🎮 Prospector's Tale">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                Play the prequel! Experience Tobias's 1852 Gold Rush journey in this browser RPG adventure.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • 5 Chapters<br/>
                • Branching Story<br/>
                • Earn Discounts
              </div>
              <PixelButton href="/adventure" variant="blue" size="sm">
                Play Now
              </PixelButton>
            </PixelCard>

            <PixelCard title="⚔️ Mystery Hunt">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                At the ranch: scan QR codes, solve riddles, and discover what Tobias left behind.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • 14 Locations<br/>
                • Hidden Treasures<br/>
                • Up to 27% Off
              </div>
              <PixelButton href="/game" variant="gold" size="sm">
                Learn More
              </PixelButton>
            </PixelCard>

            <PixelCard title="🗺️ Gold Country">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                Explore the area! Discover wine trails, ski slopes, historic caves, and more.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • 20+ Locations<br/>
                • Side Quests<br/>
                • Local Secrets
              </div>
              <PixelButton href="/explore" variant="green" size="sm">
                View Map
              </PixelButton>
            </PixelCard>

            <PixelCard title="🏨 The Inn">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                Book your stay at our mountain retreat. Hot tub, game room, and more.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • Sleeps 12<br/>
                • Hot Tub & Games<br/>
                • Book Direct & Save
              </div>
              <PixelButton href={AIRBNB_URL} variant="orange" size="sm">
                Book Stay
              </PixelButton>
            </PixelCard>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 px-4 bg-gradient-to-b from-[var(--pixel-bg-dark)] to-[var(--pixel-bg-mid)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg mb-8">
            🏆 Hall of Fame 🏆
          </h2>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-8">
            Think you can beat the current champions? Start your quest!
          </p>
          <PixelButton href="/leaderboard" variant="gold" size="md">
            View Leaderboard
          </PixelButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--pixel-bg-dark)] border-t-4 border-[var(--pixel-ui-border)] py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            © 2025 Back of Beyond Ranch
          </p>
          <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-gold-mid)] mt-2">
            Adventure • Mystery • Comfort
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="https://airbnb.com/h/backofbeyondranch" target="_blank" className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-sky-light)] hover:text-[var(--pixel-gold-light)] transition-colors">
              Airbnb
            </Link>
            <Link href="https://x.com/BackBeyondRanch" target="_blank" className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-sky-light)] hover:text-[var(--pixel-gold-light)] transition-colors">
              Twitter/X
            </Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes horseIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes graze {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(2px) rotate(5deg); }
          75% { transform: translateY(2px) rotate(-5deg); }
        }
        @keyframes emuWalk {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes peck {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(3px) rotate(15deg); }
        }
        @keyframes pegasusFly {
          0% { left: -10%; top: 15%; }
          25% { left: 25%; top: 8%; }
          50% { left: 50%; top: 12%; }
          75% { left: 75%; top: 6%; }
          100% { left: 110%; top: 10%; }
        }
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.9); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
