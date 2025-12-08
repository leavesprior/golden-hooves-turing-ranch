'use client'
import { useState } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

type TimeFilter = 'all' | 'month' | 'week'

const mockLeaderboard = [
  { rank: 1, name: 'GoldRushKing', score: 2450, time: '08:23', difficulty: 'hard', date: '2025-01-05' },
  { rank: 2, name: 'TreasureHuntress', score: 2380, time: '09:12', difficulty: 'hard', date: '2025-01-04' },
  { rank: 3, name: 'MountainExplorer', score: 2290, time: '10:45', difficulty: 'hard', date: '2025-01-03' },
  { rank: 4, name: 'CabinFever2024', score: 1850, time: '12:30', difficulty: 'medium', date: '2025-01-02' },
  { rank: 5, name: 'SkiAndSeek', score: 1720, time: '14:15', difficulty: 'medium', date: '2025-01-01' },
  { rank: 6, name: 'WineCaveWanderer', score: 1650, time: '15:22', difficulty: 'medium', date: '2024-12-30' },
  { rank: 7, name: 'GoldCountryGal', score: 1580, time: '16:45', difficulty: 'medium', date: '2024-12-28' },
  { rank: 8, name: 'FamilyAdventure5', score: 980, time: '22:10', difficulty: 'easy', date: '2024-12-25' },
  { rank: 9, name: 'FirstTimeFinders', score: 850, time: '25:30', difficulty: 'easy', date: '2024-12-20' },
  { rank: 10, name: 'HotTubHeroes', score: 720, time: '28:45', difficulty: 'easy', date: '2024-12-15' },
]

const difficultyColors = {
  easy: 'var(--pixel-forest-light)',
  medium: 'var(--pixel-gold-light)',
  hard: 'var(--pixel-fire-orange)',
}

const difficultyIcons = {
  easy: '🌱',
  medium: '⚔️',
  hard: '👑',
}

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-4">
            🏆 HALL OF FAME 🏆
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            The greatest treasure hunters of Gold Country
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {(['all', 'month', 'week'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`font-[var(--font-pixel)] text-[8px] px-4 py-2 border-2 transition-colors ${
                timeFilter === filter
                  ? 'bg-[var(--pixel-gold-mid)] border-[var(--pixel-gold-dark)] text-[var(--pixel-bg-dark)]'
                  : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-bg-light)]'
              }`}
            >
              {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-4 mb-8">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--pixel-bg-mid)] border-4 border-[#C0C0C0] flex items-center justify-center mb-2">
              <span className="text-3xl">🥈</span>
            </div>
            <p className="font-[var(--font-pixel)] text-[8px] text-[#C0C0C0]">{mockLeaderboard[1].name}</p>
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{mockLeaderboard[1].score}</p>
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-light)] flex items-center justify-center mb-2 relative">
              <span className="text-4xl">🥇</span>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-2xl">👑</span>
              </div>
            </div>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">{mockLeaderboard[0].name}</p>
            <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-mid)]">{mockLeaderboard[0].score}</p>
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--pixel-bg-mid)] border-4 border-[#CD7F32] flex items-center justify-center mb-2">
              <span className="text-3xl">🥉</span>
            </div>
            <p className="font-[var(--font-pixel)] text-[8px] text-[#CD7F32]">{mockLeaderboard[2].name}</p>
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{mockLeaderboard[2].score}</p>
          </div>
        </div>

        {/* Full Leaderboard */}
        <PixelCard title="📊 Full Rankings">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] border-b-2 border-[var(--pixel-ui-border)]">
                  <th className="py-2 text-left">Rank</th>
                  <th className="py-2 text-left">Player</th>
                  <th className="py-2 text-center">Score</th>
                  <th className="py-2 text-center">Time</th>
                  <th className="py-2 text-center">Mode</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`font-[var(--font-pixel)] text-[8px] border-b border-[var(--pixel-bg-light)] ${
                      entry.rank <= 3 ? 'bg-[var(--pixel-bg-light)]' : ''
                    }`}
                  >
                    <td className="py-3">
                      {entry.rank <= 3 ? (
                        <span className="text-lg">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        <span className="text-[var(--pixel-ui-text)]">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--pixel-ui-text)]">{entry.name}</td>
                    <td className="py-3 text-center text-[var(--pixel-gold-light)]">{entry.score}</td>
                    <td className="py-3 text-center text-[var(--pixel-forest-light)]">{entry.time}</td>
                    <td className="py-3 text-center">
                      <span style={{ color: difficultyColors[entry.difficulty as keyof typeof difficultyColors] }}>
                        {difficultyIcons[entry.difficulty as keyof typeof difficultyIcons]} {entry.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PixelCard>

        {/* CTA */}
        <div className="mt-8 text-center space-y-4">
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Think you can claim a spot on the board?
          </p>
          <div className="flex justify-center gap-4">
            <PixelButton href="/game" variant="gold" size="md">
              ⚔️ Start Quest
            </PixelButton>
            <PixelButton href="/rentals" variant="orange" size="md">
              🏨 Book Stay
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
