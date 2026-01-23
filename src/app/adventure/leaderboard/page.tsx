'use client'

import { useState, useEffect } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { useRPG } from '@/lib/rpgContext'

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  chaptersCompleted: number
  ending?: string
  date: string
}

export default function LeaderboardPage() {
  const { session } = useRPG()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all')

  // Load leaderboard from localStorage (in production, would be from database)
  useEffect(() => {
    const saved = localStorage.getItem('bobr_rpg_leaderboard')
    if (saved) {
      try {
        setEntries(JSON.parse(saved))
      } catch {
        setEntries([])
      }
    }

    // Add sample entries if empty
    if (!saved) {
      const sampleEntries: LeaderboardEntry[] = [
        { id: '1', name: 'GoldRush49', score: 2450, chaptersCompleted: 5, ending: 'legend', date: '2024-12-15' },
        { id: '2', name: 'ProspectorPete', score: 2100, chaptersCompleted: 5, ending: 'prospector', date: '2024-12-20' },
        { id: '3', name: 'SierraExplorer', score: 1850, chaptersCompleted: 4, date: '2024-12-28' },
        { id: '4', name: 'FortyNiner', score: 1600, chaptersCompleted: 4, date: '2025-01-02' },
        { id: '5', name: 'GoldenDreamer', score: 1400, chaptersCompleted: 3, date: '2025-01-01' },
      ]
      setEntries(sampleEntries)
      localStorage.setItem('bobr_rpg_leaderboard', JSON.stringify(sampleEntries))
    }
  }, [])

  // Add current player to leaderboard if they have a score
  const addToLeaderboard = () => {
    if (!session || session.totalScore === 0) return

    const newEntry: LeaderboardEntry = {
      id: session.id,
      name: session.playerName,
      score: session.totalScore,
      chaptersCompleted: Object.values(session.chapters).filter(c => c.completed).length,
      ending: session.ending,
      date: new Date().toISOString().split('T')[0],
    }

    const updated = [...entries.filter(e => e.id !== session.id), newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100) // Keep top 100

    setEntries(updated)
    localStorage.setItem('bobr_rpg_leaderboard', JSON.stringify(updated))
  }

  // Find player's rank
  const playerRank = session
    ? entries.findIndex(e => e.id === session.id) + 1
    : 0

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true
    const entryDate = new Date(entry.date)
    const now = new Date()
    if (filter === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return entryDate >= weekAgo
    }
    if (filter === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return entryDate >= monthAgo
    }
    return true
  })

  const getEndingBadge = (ending?: string) => {
    switch (ending) {
      case 'legend': return '👑'
      case 'prospector': return '⛏️'
      case 'ghost': return '👻'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mb-2">
            🏆 LEADERBOARD 🏆
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Top Prospectors of the Golden Hooves Legacy
          </p>
        </div>

        {/* Player Stats */}
        {session && session.totalScore > 0 && (
          <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-fire-orange)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                  Your Score
                </p>
                <p className="font-[var(--font-pixel)] text-lg text-[var(--pixel-gold-light)]">
                  {session.totalScore}
                </p>
              </div>
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                  Your Rank
                </p>
                <p className="font-[var(--font-pixel)] text-lg text-[var(--pixel-gold-light)]">
                  #{playerRank || 'Unranked'}
                </p>
              </div>
              <PixelButton onClick={addToLeaderboard} variant="gold" size="sm">
                Submit Score
              </PixelButton>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          {(['all', 'weekly', 'monthly'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                font-[var(--font-pixel)] text-[8px] px-4 py-2 border-2 transition-all
                ${filter === f
                  ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                  : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-mid)]'
                }
              `}
            >
              {f === 'all' ? 'All Time' : f === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <PixelCard title="Top Prospectors">
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 font-[var(--font-pixel)] text-[6px] text-[var(--pixel-gold-light)] border-b-2 border-[var(--pixel-ui-border)] pb-2">
              <div className="col-span-1">RANK</div>
              <div className="col-span-4">NAME</div>
              <div className="col-span-2 text-right">SCORE</div>
              <div className="col-span-2 text-center">CHAPTERS</div>
              <div className="col-span-1 text-center">END</div>
              <div className="col-span-2 text-right">DATE</div>
            </div>

            {/* Entries */}
            {filteredEntries.slice(0, 10).map((entry, index) => {
              const isPlayer = session?.id === entry.id
              const rank = index + 1

              return (
                <div
                  key={entry.id}
                  className={`
                    grid grid-cols-12 gap-2 font-[var(--font-pixel)] text-[8px] py-2
                    ${isPlayer ? 'bg-[var(--pixel-gold-dark)] -mx-2 px-2' : ''}
                    ${rank <= 3 ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-ui-text)]'}
                  `}
                >
                  <div className="col-span-1">
                    {rank === 1 && '🥇'}
                    {rank === 2 && '🥈'}
                    {rank === 3 && '🥉'}
                    {rank > 3 && `#${rank}`}
                  </div>
                  <div className="col-span-4 truncate">
                    {entry.name}
                    {isPlayer && ' (You)'}
                  </div>
                  <div className="col-span-2 text-right">{entry.score}</div>
                  <div className="col-span-2 text-center">{entry.chaptersCompleted}/5</div>
                  <div className="col-span-1 text-center">{getEndingBadge(entry.ending)}</div>
                  <div className="col-span-2 text-right text-[var(--pixel-ui-border)]">
                    {entry.date}
                  </div>
                </div>
              )
            })}

            {filteredEntries.length === 0 && (
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center py-4">
                No entries yet. Be the first!
              </p>
            )}
          </div>
        </PixelCard>

        {/* Legend */}
        <div className="mt-6 text-center">
          <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">
            Endings: 👑 Legend | ⛏️ Prospector | 👻 Ghost
          </p>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <PixelButton href="/adventure" variant="gold" size="md">
            ← Back to Adventure
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
