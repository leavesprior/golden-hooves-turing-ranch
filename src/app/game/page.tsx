'use client'
import { useState } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

type Difficulty = 'easy' | 'medium' | 'hard'
type GameState = 'menu' | 'playing' | 'complete'

const difficulties = {
  easy: { name: 'Novice Explorer', clues: 5, timeBonus: 1.5, icon: '🌱' },
  medium: { name: 'Treasure Hunter', clues: 8, timeBonus: 1.0, icon: '⚔️' },
  hard: { name: 'Master Adventurer', clues: 12, timeBonus: 0.75, icon: '👑' },
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [currentClue, setCurrentClue] = useState(0)
  const [score, setScore] = useState(0)

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff)
    setGameState('playing')
    setCurrentClue(1)
    setScore(0)
  }

  const resetGame = () => {
    setGameState('menu')
    setDifficulty(null)
    setCurrentClue(0)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {gameState === 'menu' && (
          <>
            <div className="text-center mb-12">
              <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-4">
                ⚔️ TREASURE HUNT ⚔️
              </h1>
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                Explore the ranch, solve riddles, find the treasure!
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {(Object.entries(difficulties) as [Difficulty, typeof difficulties.easy][]).map(([key, diff]) => (
                <PixelCard key={key} title={`${diff.icon} ${diff.name}`}>
                  <div className="space-y-4">
                    <div className="font-[var(--font-pixel)] text-[8px] space-y-2">
                      <p>📜 {diff.clues} Clues to solve</p>
                      <p>⏱️ Time bonus: x{diff.timeBonus}</p>
                      <p>🏆 {key === 'easy' ? '100' : key === 'medium' ? '250' : '500'}+ points possible</p>
                    </div>
                    <PixelButton
                      onClick={() => startGame(key)}
                      variant={key === 'easy' ? 'green' : key === 'medium' ? 'gold' : 'orange'}
                      size="sm"
                    >
                      Select
                    </PixelButton>
                  </div>
                </PixelCard>
              ))}
            </div>

            {/* How to Play */}
            <PixelCard title="📖 How to Play">
              <div className="font-[var(--font-pixel)] text-[8px] space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[var(--pixel-gold-light)] mb-2">Step 1: Choose Difficulty</p>
                    <p>Select your adventure level. Harder = more clues but bigger rewards!</p>
                  </div>
                  <div>
                    <p className="text-[var(--pixel-gold-light)] mb-2">Step 2: Get Clues</p>
                    <p>Receive riddles that hint at locations around the ranch.</p>
                  </div>
                  <div>
                    <p className="text-[var(--pixel-gold-light)] mb-2">Step 3: Explore & Find</p>
                    <p>Visit locations IRL and scan QR codes to confirm your finds!</p>
                  </div>
                  <div>
                    <p className="text-[var(--pixel-gold-light)] mb-2">Step 4: Win Glory!</p>
                    <p>Complete all clues fast to earn a spot on the leaderboard.</p>
                  </div>
                </div>
              </div>
            </PixelCard>
          </>
        )}

        {gameState === 'playing' && difficulty && (
          <div className="space-y-6">
            {/* Game HUD */}
            <div className="flex justify-between items-center bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4">
              <div className="font-[var(--font-pixel)] text-[8px]">
                <span className="text-[var(--pixel-gold-light)]">CLUE: </span>
                <span>{currentClue}/{difficulties[difficulty].clues}</span>
              </div>
              <div className="font-[var(--font-pixel)] text-[8px]">
                <span className="text-[var(--pixel-gold-light)]">SCORE: </span>
                <span>{score}</span>
              </div>
              <div className="font-[var(--font-pixel)] text-[8px]">
                <span className="text-[var(--pixel-gold-light)]">MODE: </span>
                <span>{difficulties[difficulty].icon}</span>
              </div>
            </div>

            {/* Current Clue */}
            <PixelCard title={`📜 Clue #${currentClue}`}>
              <div className="space-y-6">
                <p className="font-[var(--font-pixel)] text-[10px] text-center leading-relaxed text-[var(--pixel-gold-light)] italic">
                  &quot;Where water bubbles warm and steam does rise,<br/>
                  Beneath the stars and mountain skies,<br/>
                  Find the spot where travelers rest,<br/>
                  And prove yourself among the best.&quot;
                </p>
                <div className="text-center">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-4">
                    Found the location? Scan the QR code there!
                  </p>
                  <div className="flex justify-center gap-4">
                    <PixelButton variant="gold" size="md">
                      📷 Scan QR Code
                    </PixelButton>
                    <PixelButton variant="blue" size="md">
                      💡 Get Hint (-10pts)
                    </PixelButton>
                  </div>
                </div>
              </div>
            </PixelCard>

            {/* Progress Bar */}
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-2">Progress:</p>
              <div className="h-4 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)]">
                <div
                  className="h-full bg-[var(--pixel-forest-mid)] transition-all duration-500"
                  style={{ width: `${(currentClue / difficulties[difficulty].clues) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <PixelButton onClick={resetGame} variant="orange" size="sm">
                ← Exit Quest
              </PixelButton>
            </div>
          </div>
        )}

        {gameState === 'complete' && (
          <div className="text-center space-y-8">
            <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-xl">
              🎉 QUEST COMPLETE! 🎉
            </h2>
            <PixelCard title="Your Results">
              <div className="font-[var(--font-pixel)] text-[10px] space-y-4">
                <p>Final Score: <span className="text-[var(--pixel-gold-light)]">{score}</span></p>
                <p>Time: <span className="text-[var(--pixel-forest-light)]">12:34</span></p>
                <p>Rank: <span className="text-[var(--pixel-fire-orange)]">#7</span></p>
              </div>
            </PixelCard>
            <div className="flex justify-center gap-4">
              <PixelButton onClick={resetGame} variant="gold" size="md">
                Play Again
              </PixelButton>
              <PixelButton href="/leaderboard" variant="green" size="md">
                View Leaderboard
              </PixelButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
