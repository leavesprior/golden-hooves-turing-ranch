'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

export default function Home() {
  const [showCursor, setShowCursor] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      {/* Hero Section - 16-bit Title Screen */}
      <section className="relative min-h-[80vh] bg-gradient-to-b from-[var(--pixel-sky-dark)] via-[var(--pixel-bg-mid)] to-[var(--pixel-bg-dark)] overflow-hidden">
        {/* Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
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
            <PixelButton href="/rentals" variant="orange" size="md">
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

          <div className="grid md:grid-cols-3 gap-6">
            <PixelCard title="⚔️ Treasure Hunt">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                Embark on an epic quest through the ranch! Solve clues, discover secrets, and compete for the fastest time.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • 3 Difficulty Levels<br/>
                • Hidden Treasures<br/>
                • Real-time Leaderboard
              </div>
              <PixelButton href="/game" variant="gold" size="sm">
                Begin Quest
              </PixelButton>
            </PixelCard>

            <PixelCard title="🗺️ Gold Country Map">
              <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-4">
                Explore the vast lands of Gold Country! Discover wine trails, ski slopes, historic caves, and more.
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
                Rest at our cozy mountain base camp. Hot tub, fire pit, and all the comfort you need for adventure.
              </p>
              <div className="text-[8px] font-[var(--font-pixel)] text-[var(--pixel-forest-light)] mb-4">
                • 6 Bedrooms<br/>
                • Hot Tub & Fire Pit<br/>
                • Book Direct & Save
              </div>
              <PixelButton href="/rentals" variant="orange" size="sm">
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
      `}</style>
    </div>
  )
}
