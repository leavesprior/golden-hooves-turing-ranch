'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { useRPG, type AttributeName } from '@/lib/rpgContext'
import { chapters } from '@/lib/chapters'
import { KarmaStorage, getAlignmentPosition, type AlignmentPosition } from '@/lib/karmaStorage'

// Attribute display names and descriptions (used by the active-session HUD).
const ATTRIBUTE_INFO: Record<AttributeName, { name: string; abbr: string; desc: string }> = {
  str: { name: 'Strength', abbr: 'STR', desc: 'Mining & hauling' },
  dex: { name: 'Dexterity', abbr: 'DEX', desc: 'Panning & precision' },
  con: { name: 'Constitution', abbr: 'CON', desc: 'Endurance & health' },
  int: { name: 'Intelligence', abbr: 'INT', desc: 'Geology & business' },
  wis: { name: 'Wisdom', abbr: 'WIS', desc: 'Survival & intuition' },
  cha: { name: 'Charisma', abbr: 'CHA', desc: 'Negotiation & trust' },
}

export default function AdventurePage() {
  const router = useRouter()
  const { session, startNewGame, loadGame, resetGame, getDiscountCode } = useRPG()

  const [showNewGame, setShowNewGame] = useState(false)

  // Unified karma carry-forward
  const [karmaAlignment, setKarmaAlignment] = useState<AlignmentPosition | null>(null)
  const [karmaImported, setKarmaImported] = useState(false)

  useEffect(() => {
    const karmaState = KarmaStorage.load()
    if (karmaState && (karmaState.alignment.lawfulChaotic !== 0 || karmaState.alignment.goodEvil !== 0)) {
      setKarmaAlignment(getAlignmentPosition(karmaState.alignment))
      setKarmaImported(true)
    }
  }, [])

  const hasSavedGame = typeof window !== 'undefined' && localStorage.getItem('bobr_rpg_session')
  const discount = getDiscountCode()

  const handleContinue = () => {
    loadGame()
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-2">
            THE PROSPECTOR'S TALE
          </h1>
          <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
            A Gold Rush Adventure
          </p>
        </div>

        {/* Hero Scene - 64-bit Style */}
        <div className="relative border-4 border-[var(--pixel-ui-border)] aspect-video mb-8 overflow-hidden">
          {/* Gradient Sky with Golden Hour */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #1a0a2e 0%, #16213e 15%, #0f3460 30%, #e94560 50%, #ff9a3c 65%, #ffd93d 80%, #6bcb77 95%)'
            }}
          />

          {/* Stars (visible in upper sky) - deterministic positions */}
          <div className="absolute top-0 left-0 right-0 h-1/3 overflow-hidden opacity-60">
            {[
              { x: 5, y: 12, d: 0 }, { x: 15, y: 28, d: 0.5 }, { x: 25, y: 8, d: 1 },
              { x: 35, y: 22, d: 1.5 }, { x: 42, y: 5, d: 2 }, { x: 52, y: 18, d: 0.3 },
              { x: 62, y: 30, d: 0.8 }, { x: 72, y: 10, d: 1.2 }, { x: 78, y: 25, d: 1.8 },
              { x: 88, y: 15, d: 2.2 }, { x: 95, y: 8, d: 0.6 }, { x: 8, y: 35, d: 1.4 },
              { x: 28, y: 38, d: 1.9 }, { x: 48, y: 32, d: 0.2 }, { x: 68, y: 36, d: 2.5 },
              { x: 82, y: 40, d: 0.9 }, { x: 18, y: 45, d: 1.6 }, { x: 58, y: 42, d: 2.1 },
              { x: 38, y: 48, d: 0.4 }, { x: 92, y: 38, d: 1.1 }
            ].map((star, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  animationDelay: `${star.d}s`,
                  animationDuration: '3s',
                }}
              />
            ))}
          </div>

          {/* Sun/Moon */}
          <div
            className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full"
            style={{
              right: '15%',
              top: '20%',
              background: 'radial-gradient(circle, #ffd93d 0%, #ff9a3c 50%, #e94560 100%)',
              boxShadow: '0 0 60px 20px rgba(255,217,61,0.4), 0 0 100px 40px rgba(255,154,60,0.2)',
            }}
          />

          {/* Distant Mountains (Purple/Blue) */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3">
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
              {/* Far mountains - misty purple */}
              <defs>
                <linearGradient id="farMountain" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4a3f6b" />
                  <stop offset="100%" stopColor="#2d2d44" />
                </linearGradient>
                <linearGradient id="midMountain" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3d5a80" />
                  <stop offset="100%" stopColor="#293241" />
                </linearGradient>
                <linearGradient id="nearMountain" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#386641" />
                  <stop offset="100%" stopColor="#1a3a1a" />
                </linearGradient>
                <linearGradient id="hills" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4a7c59" />
                  <stop offset="100%" stopColor="#2d5016" />
                </linearGradient>
              </defs>

              {/* Far mountains */}
              <polygon points="0,80 0,50 20,35 35,45 50,25 70,40 85,20 100,35 115,30 130,40 150,22 170,38 185,28 200,40 200,80" fill="url(#farMountain)" opacity="0.7" />

              {/* Mid mountains */}
              <polygon points="0,80 0,55 15,42 30,52 48,38 65,48 80,32 100,45 120,35 140,48 160,38 180,50 200,42 200,80" fill="url(#midMountain)" opacity="0.85" />

              {/* Near mountains */}
              <polygon points="0,80 0,58 25,48 45,55 60,42 80,52 100,40 125,50 145,45 165,52 185,48 200,55 200,80" fill="url(#nearMountain)" />

              {/* Rolling hills */}
              <ellipse cx="30" cy="75" rx="45" ry="15" fill="url(#hills)" />
              <ellipse cx="100" cy="78" rx="50" ry="12" fill="url(#hills)" />
              <ellipse cx="170" cy="76" rx="45" ry="14" fill="url(#hills)" />
            </svg>
          </div>

          {/* Ground/Valley */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/4"
            style={{
              background: 'linear-gradient(to bottom, #4a7c59 0%, #3d6b4f 30%, #2d5a3f 60%, #1e4a2f 100%)',
            }}
          />

          {/* Trail/Path leading to ranch */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 overflow-hidden">
            <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
              <path
                d="M 0,50 Q 50,45 100,30 Q 150,15 200,20"
                fill="none"
                stroke="#8b7355"
                strokeWidth="4"
                opacity="0.6"
              />
              <path
                d="M 0,50 Q 50,45 100,30 Q 150,15 200,20"
                fill="none"
                stroke="#a08060"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.4"
              />
            </svg>
          </div>

          {/* Ranch House - Pixel Art Style */}
          <div className="absolute bottom-[18%] left-1/2 transform -translate-x-1/2" style={{ width: '120px' }}>
            <svg viewBox="0 0 80 60" className="w-full">
              {/* Main house body */}
              <rect x="15" y="25" width="50" height="30" fill="#8b4513" />
              <rect x="15" y="25" width="50" height="30" fill="#a0522d" opacity="0.5" />

              {/* Roof */}
              <polygon points="10,25 40,5 70,25" fill="#654321" />
              <polygon points="10,25 40,5 40,25" fill="#5d3a1a" />

              {/* Chimney */}
              <rect x="55" y="8" width="8" height="17" fill="#4a3728" />
              <rect x="54" y="6" width="10" height="3" fill="#5d4532" />

              {/* Smoke from chimney */}
              <ellipse cx="59" cy="3" rx="3" ry="2" fill="#888" opacity="0.5">
                <animate attributeName="cy" values="3;-2;3" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" />
              </ellipse>

              {/* Door */}
              <rect x="35" y="38" width="10" height="17" fill="#4a3728" />
              <circle cx="43" cy="47" r="1" fill="#ffd700" />

              {/* Windows */}
              <rect x="20" y="32" width="8" height="8" fill="#87ceeb" stroke="#4a3728" strokeWidth="1" />
              <line x1="24" y1="32" x2="24" y2="40" stroke="#4a3728" strokeWidth="0.5" />
              <line x1="20" y1="36" x2="28" y2="36" stroke="#4a3728" strokeWidth="0.5" />

              <rect x="52" y="32" width="8" height="8" fill="#87ceeb" stroke="#4a3728" strokeWidth="1" />
              <line x1="56" y1="32" x2="56" y2="40" stroke="#4a3728" strokeWidth="0.5" />
              <line x1="52" y1="36" x2="60" y2="36" stroke="#4a3728" strokeWidth="0.5" />

              {/* Window glow (warm light) */}
              <rect x="20" y="32" width="8" height="8" fill="#ffd700" opacity="0.3" />
              <rect x="52" y="32" width="8" height="8" fill="#ffd700" opacity="0.3" />

              {/* Porch */}
              <rect x="12" y="52" width="56" height="3" fill="#654321" />
              <rect x="15" y="45" width="2" height="10" fill="#654321" />
              <rect x="63" y="45" width="2" height="10" fill="#654321" />
              <rect x="13" y="45" width="54" height="2" fill="#5d3a1a" />

              {/* Porch roof */}
              <polygon points="10,45 40,38 70,45" fill="#4a3728" opacity="0.8" />

              {/* Fence posts */}
              <rect x="0" y="48" width="2" height="12" fill="#8b7355" />
              <rect x="8" y="48" width="2" height="12" fill="#8b7355" />
              <rect x="70" y="48" width="2" height="12" fill="#8b7355" />
              <rect x="78" y="48" width="2" height="12" fill="#8b7355" />

              {/* Fence rails */}
              <rect x="0" y="50" width="12" height="1.5" fill="#a08060" />
              <rect x="0" y="55" width="12" height="1.5" fill="#a08060" />
              <rect x="68" y="50" width="12" height="1.5" fill="#a08060" />
              <rect x="68" y="55" width="12" height="1.5" fill="#a08060" />
            </svg>
          </div>

          {/* Trees (silhouettes) */}
          <div className="absolute bottom-[15%] left-[8%]">
            <svg viewBox="0 0 30 50" className="w-8 sm:w-10 h-auto">
              <polygon points="15,0 0,40 30,40" fill="#1a3a1a" />
              <rect x="12" y="40" width="6" height="10" fill="#4a3728" />
            </svg>
          </div>
          <div className="absolute bottom-[15%] right-[10%]">
            <svg viewBox="0 0 30 50" className="w-8 sm:w-10 h-auto">
              <polygon points="15,0 0,40 30,40" fill="#1a3a1a" />
              <rect x="12" y="40" width="6" height="10" fill="#4a3728" />
            </svg>
          </div>
          <div className="absolute bottom-[12%] left-[18%]">
            <svg viewBox="0 0 25 40" className="w-6 sm:w-8 h-auto">
              <polygon points="12.5,0 0,32 25,32" fill="#2d5016" />
              <rect x="10" y="32" width="5" height="8" fill="#4a3728" />
            </svg>
          </div>
          <div className="absolute bottom-[12%] right-[20%]">
            <svg viewBox="0 0 25 40" className="w-6 sm:w-8 h-auto">
              <polygon points="12.5,0 0,32 25,32" fill="#2d5016" />
              <rect x="10" y="32" width="5" height="8" fill="#4a3728" />
            </svg>
          </div>

          {/* Wagon on trail */}
          <div className="absolute bottom-[8%] left-[25%]">
            <svg viewBox="0 0 40 25" className="w-10 sm:w-12 h-auto">
              {/* Wagon body */}
              <rect x="8" y="5" width="20" height="12" fill="#8b4513" />
              <rect x="6" y="3" width="24" height="3" fill="#a0522d" />
              {/* Canvas cover */}
              <ellipse cx="18" cy="5" rx="12" ry="6" fill="#f5deb3" opacity="0.9" />
              {/* Wheels */}
              <circle cx="10" cy="20" r="5" fill="#4a3728" stroke="#8b7355" strokeWidth="1" />
              <circle cx="26" cy="20" r="5" fill="#4a3728" stroke="#8b7355" strokeWidth="1" />
              {/* Wheel spokes */}
              <line x1="10" y1="15" x2="10" y2="25" stroke="#8b7355" strokeWidth="0.5" />
              <line x1="5" y1="20" x2="15" y2="20" stroke="#8b7355" strokeWidth="0.5" />
              <line x1="26" y1="15" x2="26" y2="25" stroke="#8b7355" strokeWidth="0.5" />
              <line x1="21" y1="20" x2="31" y2="20" stroke="#8b7355" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Horse */}
          <div className="absolute bottom-[7%] left-[18%] text-xl sm:text-2xl">
            🐴
          </div>

          {/* Dust particles floating - deterministic positions */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { x: 25, y: 8, dur: 5, del: 0 }, { x: 35, y: 15, dur: 6, del: 0.5 },
              { x: 48, y: 10, dur: 4.5, del: 1 }, { x: 55, y: 18, dur: 5.5, del: 1.5 },
              { x: 65, y: 12, dur: 6.5, del: 0.3 }, { x: 72, y: 20, dur: 4, del: 0.8 },
              { x: 42, y: 22, dur: 5.2, del: 1.2 }, { x: 58, y: 6, dur: 6.2, del: 1.8 }
            ].map((dust, i) => (
              <div
                key={`dust-${i}`}
                className="absolute w-1 h-1 bg-amber-200/40 rounded-full"
                style={{
                  left: `${dust.x}%`,
                  bottom: `${dust.y}%`,
                  animation: `float ${dust.dur}s ease-in-out infinite`,
                  animationDelay: `${dust.del}s`,
                }}
              />
            ))}
          </div>

          {/* Title overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[var(--pixel-bg-dark)]/85 px-6 py-4 border-2 border-[var(--pixel-gold-mid)] backdrop-blur-sm">
              <p className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)] text-center">
                California, 1852
              </p>
              <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] text-center mt-2">
                The story that started it all...
              </p>
            </div>
          </div>

          {/* Floating animation keyframes */}
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
              50% { transform: translateY(-10px) translateX(5px); opacity: 0.7; }
            }
          `}</style>
        </div>

        {/* Phase 3.5 RED #1: Character creation used to happen TWICE — once
            on this landing page (name + dice/Mandelbrot stats + trait) and
            again on /adventure/play which immediately pushes to
            /adventure/character-creation (name + background + S.A.D.D.L.E.
            picks + review). Players asked "didn't I just do this?" because
            the two systems are different: STR/DEX/CON vs Shrewdness/Agility/
            etc., and the picks system overrides the landing picks anyway.

            Path A: the landing page is now pure intro + chapter select. All
            character creation — name, background, picks — lives on the play
            page (via /adventure/character-creation). Clicking "Begin Your
            Journey" spins up a placeholder session with default attributes;
            the placeholder gets overwritten the moment the player reaches
            the play page and creates their real character. */}

        {/* Game Start Options */}
        {!session && !showNewGame && (
          <div className="space-y-4 max-w-md mx-auto">
            {hasSavedGame && (
              <PixelButton onClick={handleContinue} variant="gold" size="md">
                Continue Adventure
              </PixelButton>
            )}
            <PixelButton
              onClick={() => router.push('/adventure/character-creation')}
              variant="green"
              size="md"
            >
              Begin Your Journey
            </PixelButton>

            {/* Karma carry-forward badge */}
            {karmaImported && karmaAlignment && (
              <div className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)] p-3 text-center">
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                  KARMA IMPORTED FROM TRAIL
                </p>
                <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mt-1">
                  Alignment: <span className="text-[var(--pixel-gold-light)]">
                    {karmaAlignment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </p>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] mt-1">
                  Starting attribute bonuses will be applied
                </p>
              </div>
            )}

            {/* Preview chapters */}
            <div className="mt-8">
              <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm text-center mb-4">
                5 Chapters to Explore
              </h2>
              <div className="grid gap-3">
                {Object.values(chapters).map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)]">
                          Chapter {chapter.id}:
                        </span>
                        <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] ml-2">
                          {chapter.title}
                        </span>
                      </div>
                      <span className="text-lg">🔒</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 3.5 RED #1: Streamlined intro screen. No stat rolling here
            — the real character creation happens inside the play flow so we
            don't duplicate systems. */}
        {!session && showNewGame && (
          <div className="max-w-lg mx-auto">
            <PixelCard title="A Gold Rush Adventure">
              <div className="space-y-4">
                <p className="font-[var(--font-pixel)] text-[11px] sm:text-[13px] text-[var(--pixel-ui-text)] leading-relaxed">
                  California, 1852. The gold has drawn people from every corner
                  of the world — prospectors, scouts, settlers, outlaws. Five
                  chapters await. Your choices — not your dice rolls — decide
                  who your character becomes.
                </p>
                <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-forest-light)] leading-relaxed">
                  Next you'll pick a chapter and forge your character inside
                  the story. Background, advantages, flaws — it all happens in
                  one place, with full S.A.D.D.L.E. stats (Shrewdness, Agility,
                  Durability, Diplomacy, Luck, Expertise).
                </p>
                {karmaImported && karmaAlignment && (
                  <div className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)] p-3 text-center">
                    <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                      KARMA IMPORTED FROM TRAIL
                    </p>
                    <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] mt-1">
                      Alignment:{' '}
                      <span className="text-[var(--pixel-gold-light)]">
                        {karmaAlignment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <PixelButton
                    onClick={() => {
                      // Create a placeholder session. Default attributes are
                      // fine — the real character (name, background, picks,
                      // S.A.D.D.L.E. stats) is forged on the play page.
                      startNewGame('Prospector')
                    }}
                    variant="gold"
                    size="md"
                  >
                    Begin Adventure
                  </PixelButton>
                  <PixelButton onClick={() => setShowNewGame(false)} variant="blue" size="sm">
                    Back
                  </PixelButton>
                </div>
              </div>
            </PixelCard>
          </div>
        )}


        {/* Active Session */}
        {session && (
          <div className="space-y-6">
            {/* Player HUD */}
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">PROSPECTOR: </span>
                  <span>{session.playerName}</span>
                </div>
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">SCORE: </span>
                  <span className="text-[var(--pixel-forest-light)]">{session.totalScore}</span>
                </div>
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">CHAPTER: </span>
                  <span>{session.currentChapter}/5</span>
                </div>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="grid gap-4">
              {Object.values(chapters).map((chapter) => {
                const progress = session.chapters[chapter.id]
                const isUnlocked = chapter.id <= session.currentChapter
                const isCurrent = chapter.id === session.currentChapter

                return (
                  <div
                    key={chapter.id}
                    className={`
                      border-4 p-4 transition-all
                      ${isCurrent ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]' :
                        isUnlocked ? 'border-[var(--pixel-forest-mid)] bg-[var(--pixel-bg-mid)]' :
                        'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] opacity-50'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)]">
                          Chapter {chapter.id}: {chapter.title}
                        </h3>
                        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-1">
                          {chapter.subtitle}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-2 max-w-md">
                          {chapter.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {progress.completed ? (
                          <span className="text-2xl">✅</span>
                        ) : isUnlocked ? (
                          <span className="text-2xl animate-pulse">▶️</span>
                        ) : (
                          <span className="text-2xl">🔒</span>
                        )}
                        {progress.score > 0 && (
                          <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-forest-light)] mt-1">
                            Score: {progress.score}
                          </p>
                        )}
                      </div>
                    </div>

                    {isCurrent && !progress.completed && (
                      <div className="mt-4">
                        <PixelButton href="/adventure/play" variant="gold" size="sm">
                          {progress.choicesMade.length > 0 ? 'Continue' : 'Begin Chapter'}
                        </PixelButton>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* D&D Attributes */}
            <PixelCard title="Character Attributes">
              <div className="grid grid-cols-6 gap-2 text-center mb-4">
                {(Object.keys(session.character.attributes) as AttributeName[]).map((attr) => {
                  const val = session.character.attributes[attr]
                  const mod = Math.floor((val - 10) / 2)
                  return (
                    <div key={attr} className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-1">
                      <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-gold-light)]">
                        {ATTRIBUTE_INFO[attr].abbr}
                      </p>
                      <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">{val}</p>
                      <p className={`font-[var(--font-pixel)] text-[8px] ${mod >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                        {mod >= 0 ? '+' : ''}{mod}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Legacy Stats */}
              <div className="grid grid-cols-4 gap-2 text-center border-t border-[var(--pixel-ui-border)] pt-3">
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)]">Wisdom</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">{session.stats.wisdom}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)]">Trust</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-forest-light)]">{session.stats.trust}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)]">Luck</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-sky-light)]">{session.stats.luck}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)]">Gold</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-mid)]">{session.stats.gold}</p>
                </div>
              </div>

              {/* Character Sheet Link */}
              <div className="mt-3 text-center">
                <PixelButton href="/adventure/character" variant="blue" size="sm">
                  View Character Sheet
                </PixelButton>
              </div>
            </PixelCard>

            {/* Discount earned */}
            {discount && (
              <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-fire-orange)] border-4 border-[var(--pixel-gold-mid)] p-4 text-center">
                <p className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-ui-text)]">
                  Discount Earned: <span className="text-[var(--pixel-gold-light)]">{discount.percent}% OFF</span>
                </p>
                <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)] mt-1">
                  Code: {discount.code}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <PixelButton href="/adventure/leaderboard" variant="blue" size="sm">
                Leaderboard
              </PixelButton>
              <PixelButton onClick={resetGame} variant="orange" size="sm">
                Reset Game
              </PixelButton>
            </div>
          </div>
        )}

        {/* Connection to Mystery Hunt */}
        <div className="mt-12 text-center bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-6">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm mb-4">
            The Story Continues...
          </h2>
          <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] mb-4 max-w-lg mx-auto">
            Complete the online adventure to unlock the prologue. Then visit Back of Beyond Ranch
            in person to play "The Golden Hooves Legacy" - a QR code mystery hunt where you
            discover what Tobias left behind 170 years ago.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <PixelButton href="/game" variant="gold" size="sm">
              Learn About Mystery Hunt
            </PixelButton>
            <PixelButton href="/rentals" variant="green" size="sm">
              Book Your Stay
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
