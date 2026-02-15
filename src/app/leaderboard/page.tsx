'use client'

import { useState, useEffect, useCallback } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { TROPHY_DEFINITIONS, RARITY_COLORS, RARITY_LABELS, computeTrophies, computeCompositeScore } from '@/lib/trophyDefinitions'
import type { TrophyDefinition, TrophyCheckState } from '@/lib/trophyDefinitions'
import { collectTrophyState, getPlayerIdentifier } from '@/lib/trophyStateCollector'
import { NPC_LEGENDS } from '@/lib/npcLegends'
import type { LeaderboardEntry } from '@/lib/npcLegends'
import { getAlignmentPosition, ALIGNMENT_DISPLAY_NAMES } from '@/lib/karmaStorage'

type TimeFilter = 'all' | 'month' | 'week'

// ─── S.A.D.D.L.E. stat config ────────────────────────
const SADDLE_STATS = [
  { key: 'Shrewdness' as const, label: 'Shrewdness', color: 'var(--pixel-gold-light)' },
  { key: 'Agility' as const, label: 'Agility', color: 'var(--pixel-fire-orange)' },
  { key: 'Durability' as const, label: 'Durability', color: 'var(--pixel-forest-light)' },
  { key: 'Diplomacy' as const, label: 'Diplomacy', color: '#3B82F6' },
  { key: 'Luck' as const, label: 'Luck', color: '#A855F7' },
  { key: 'Expertise' as const, label: 'Expertise', color: '#EF4444' },
]

const FACTION_CONFIG: Record<string, { label: string; color: string }> = {
  pinkerton: { label: 'Pinkerton', color: '#3B82F6' },
  settlers: { label: 'Settlers', color: '#F59E0B' },
  natives: { label: 'Natives', color: '#22C55E' },
  outlaws: { label: 'Outlaws', color: '#EF4444' },
}

export default function LeaderboardPage() {
  const [gameState, setGameState] = useState<TrophyCheckState | null>(null)
  const [earned, setEarned] = useState<TrophyDefinition[]>([])
  const [score, setScore] = useState(0)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [hallEntries, setHallEntries] = useState<LeaderboardEntry[]>([])
  const [hallSource, setHallSource] = useState<'loading' | 'notion' | 'offline'>('loading')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'already' | 'error'>('idle')
  const [expandedTrophy, setExpandedTrophy] = useState<string | null>(null)

  // Load game state from localStorage
  useEffect(() => {
    const state = collectTrophyState()
    if (state) {
      setGameState(state)
      const result = computeTrophies(state)
      setEarned(result.earned)
      setScore(computeCompositeScore(state))
    }
  }, [])

  // Fetch Hall of Fame entries
  const fetchHall = useCallback(async (filter: TimeFilter) => {
    setHallSource('loading')
    try {
      const resp = await fetch(`/api/leaderboard?limit=50&filter=${filter}`)
      if (!resp.ok) throw new Error('fetch failed')
      const data = await resp.json()

      if (data.source === 'notion' && data.entries.length > 0) {
        // Merge NPC legends with real entries
        const merged = mergeWithNPCs(data.entries)
        setHallEntries(merged)
        setHallSource('notion')
      } else {
        // Fallback: show NPC legends + any local data
        setHallEntries(getFallbackEntries())
        setHallSource('offline')
      }
    } catch {
      setHallEntries(getFallbackEntries())
      setHallSource('offline')
    }
  }, [])

  useEffect(() => {
    fetchHall(timeFilter)
  }, [timeFilter, fetchHall])

  // Submit score to Notion
  const handleSubmit = async () => {
    if (!gameState || submitState === 'submitting') return
    setSubmitState('submitting')
    try {
      const { name, id } = getPlayerIdentifier()
      const alignmentPos = getAlignmentPosition({
        lawfulChaotic: gameState.lawfulChaotic,
        goodEvil: gameState.goodEvil,
      })
      const topFaction = getTopFaction(gameState)

      const resp = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: name,
          playerId: id,
          score,
          trophies: earned.map(t => t.id),
          chapter: gameState.chapter,
          level: gameState.level,
          alignment: ALIGNMENT_DISPLAY_NAMES[alignmentPos],
          saddleStats: gameState.saddle,
          topFaction,
          timeEchoes: gameState.timeEchoes,
          milestonesCount: gameState.milestonesCount,
        }),
      })
      const data = await resp.json()
      if (data.action === 'created' || data.action === 'updated') {
        setSubmitState('success')
        fetchHall(timeFilter) // Refresh
      } else {
        setSubmitState('already')
      }
    } catch {
      setSubmitState('error')
    }
  }

  const hasGameData = gameState !== null && gameState.chapter >= 1
  const playerId = typeof window !== 'undefined' ? getPlayerIdentifier().id : ''

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl mb-2">
            TROPHY WALL & HALL OF FAME
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Your legend on the frontier
          </p>
        </div>

        {/* ═══ Section 1: Your Progress ═══ */}
        {hasGameData ? (
          <PixelCard title="Your Progress">
            <div className="space-y-4">
              {/* Top row: name, score, level, chapter */}
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-1">Player</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                    {getPlayerIdentifier().name}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-1">Score</p>
                  <p className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-mid)]">{score}</p>
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-1">Level</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">{gameState.level}</p>
                </div>
                <div className="text-center">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-1">Chapter</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">{gameState.chapter}/5</p>
                </div>
              </div>

              {/* S.A.D.D.L.E. stat bars */}
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mb-2">S.A.D.D.L.E.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SADDLE_STATS.map(({ key, label, color }) => {
                    const val = gameState.saddle[key]
                    const pct = Math.min(100, (val / 20) * 100)
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] w-20 shrink-0">{label}</span>
                        <div className="flex-1 h-3 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
                          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] w-6 text-right">{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Karma alignment + faction reputation */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mb-1">Alignment</p>
                  <AlignmentBadge lawfulChaotic={gameState.lawfulChaotic} goodEvil={gameState.goodEvil} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mb-1">Faction Standing</p>
                  <div className="space-y-1">
                    {Object.entries(FACTION_CONFIG).map(([id, { label, color }]) => {
                      const rep = id === 'pinkerton' ? gameState.pinkertonRep :
                        id === 'settlers' ? gameState.settlersRep :
                        id === 'natives' ? gameState.nativesRep : gameState.outlawsRep
                      const pct = Math.min(100, Math.max(0, (rep + 100) / 200 * 100))
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] w-16 shrink-0">{label}</span>
                          <div className="flex-1 h-2 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <span className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] w-8 text-right">{rep}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </PixelCard>
        ) : (
          <PixelCard title="Your Progress">
            <div className="text-center py-4 space-y-3">
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                No adventure data yet. Start playing to track your progress!
              </p>
              <PixelButton href="/adventure" variant="gold" size="md">
                Start Adventure
              </PixelButton>
            </div>
          </PixelCard>
        )}

        {/* ═══ Section 2: Your Trophies ═══ */}
        <PixelCard title={`Your Trophies (${earned.length}/${TROPHY_DEFINITIONS.length})`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TROPHY_DEFINITIONS.map((trophy) => {
              const isEarned = earned.some(e => e.id === trophy.id)
              const isExpanded = expandedTrophy === trophy.id
              return (
                <button
                  key={trophy.id}
                  onClick={() => setExpandedTrophy(isExpanded ? null : trophy.id)}
                  className={`p-2 border-2 transition-all text-center ${
                    isEarned
                      ? 'bg-[var(--pixel-bg-light)] hover:bg-[var(--pixel-bg-mid)]'
                      : 'bg-[var(--pixel-bg-dark)] opacity-50'
                  }`}
                  style={{
                    borderColor: isEarned ? RARITY_COLORS[trophy.rarity] : 'var(--pixel-ui-border)',
                  }}
                >
                  <div className="text-2xl mb-1">{isEarned ? trophy.icon : '?'}</div>
                  <p className="font-[var(--font-pixel)] text-[7px] leading-tight"
                     style={{ color: isEarned ? RARITY_COLORS[trophy.rarity] : 'var(--pixel-ui-border)' }}>
                    {isEarned ? trophy.name : '???'}
                  </p>
                  <p className="font-[var(--font-pixel)] text-[6px] mt-0.5"
                     style={{ color: RARITY_COLORS[trophy.rarity] }}>
                    {RARITY_LABELS[trophy.rarity]}
                  </p>
                  {isExpanded && isEarned && (
                    <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] mt-1 leading-tight">
                      {trophy.description}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </PixelCard>

        {/* ═══ Section 3: Hall of Fame ═══ */}
        <PixelCard title="Hall of Fame">
          {/* Offline banner */}
          {hallSource === 'offline' && (
            <div className="bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-fire-orange)] p-2 mb-4 text-center">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)]">
                Trophy Wall offline &mdash; showing legends & local data
              </p>
            </div>
          )}

          {/* Time filter tabs */}
          <div className="flex justify-center gap-2 mb-4">
            {(['all', 'month', 'week'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`font-[var(--font-pixel)] text-[8px] px-4 py-2 border-2 transition-colors ${
                  timeFilter === filter
                    ? 'bg-[var(--pixel-gold-mid)] border-[var(--pixel-gold-dark)] text-[var(--pixel-bg-dark)]'
                    : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-bg-light)]'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {hallSource === 'loading' && (
            <div className="text-center py-8">
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] animate-pulse">
                Loading Hall of Fame...
              </p>
            </div>
          )}

          {/* Podium for top 3 */}
          {hallSource !== 'loading' && hallEntries.length >= 3 && (
            <div className="flex justify-center items-end gap-4 mb-6">
              {/* 2nd Place */}
              <PodiumSlot entry={hallEntries[1]} medal="silver" size="sm" />
              {/* 1st Place */}
              <PodiumSlot entry={hallEntries[0]} medal="gold" size="lg" />
              {/* 3rd Place */}
              <PodiumSlot entry={hallEntries[2]} medal="bronze" size="sm" />
            </div>
          )}

          {/* Full table */}
          {hallSource !== 'loading' && hallEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)] border-b-2 border-[var(--pixel-ui-border)]">
                    <th className="py-2 text-left w-10">Rank</th>
                    <th className="py-2 text-left">Player</th>
                    <th className="py-2 text-center">Score</th>
                    <th className="py-2 text-center hidden sm:table-cell">Trophies</th>
                    <th className="py-2 text-center hidden sm:table-cell">Ch.</th>
                    <th className="py-2 text-center">Lvl</th>
                  </tr>
                </thead>
                <tbody>
                  {hallEntries.map((entry, i) => {
                    const rank = i + 1
                    const isPlayer = entry.playerId === playerId
                    return (
                      <tr
                        key={entry.playerId}
                        className={`font-[var(--font-pixel)] text-[8px] border-b border-[var(--pixel-bg-light)] ${
                          isPlayer ? 'bg-[var(--pixel-gold-dark)]' : ''
                        } ${rank <= 3 ? 'bg-[var(--pixel-bg-light)]' : ''}`}
                      >
                        <td className="py-2">
                          {rank === 1 ? '\uD83E\uDD47' : rank === 2 ? '\uD83E\uDD48' : rank === 3 ? '\uD83E\uDD49' : `#${rank}`}
                        </td>
                        <td className="py-2 text-[var(--pixel-ui-text)]">
                          <span className={entry.isNPC ? 'italic' : ''}>
                            {entry.playerName}
                          </span>
                          {entry.isNPC && (
                            <span className="text-[6px] text-[var(--pixel-gold-mid)] ml-1">(Legend)</span>
                          )}
                          {isPlayer && (
                            <span className="text-[6px] text-[var(--pixel-gold-light)] ml-1">(You)</span>
                          )}
                        </td>
                        <td className="py-2 text-center text-[var(--pixel-gold-light)]">{entry.score}</td>
                        <td className="py-2 text-center hidden sm:table-cell">{entry.trophyCount}</td>
                        <td className="py-2 text-center hidden sm:table-cell">{entry.chapter}/5</td>
                        <td className="py-2 text-center">{entry.level}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hallSource !== 'loading' && hallEntries.length === 0 && (
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center py-4">
              No entries yet. Be the first legend!
            </p>
          )}

          {/* Submit Score button */}
          {hasGameData && (
            <div className="mt-4 text-center space-y-2">
              <PixelButton
                onClick={handleSubmit}
                variant="gold"
                size="sm"
                disabled={submitState === 'submitting' || submitState === 'success'}
              >
                {submitState === 'idle' && 'Submit Score'}
                {submitState === 'submitting' && 'Submitting...'}
                {submitState === 'success' && 'On the Board!'}
                {submitState === 'already' && 'Already Submitted'}
                {submitState === 'error' && 'Try Again'}
              </PixelButton>
              {submitState === 'success' && (
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)]">
                  Your score has been recorded in the Hall of Fame!
                </p>
              )}
              {submitState === 'already' && (
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                  Your current score is already on the board (or a higher score exists).
                </p>
              )}
              {submitState === 'error' && (
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)]">
                  Could not reach the Hall of Fame. Try again later.
                </p>
              )}
            </div>
          )}
        </PixelCard>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 flex-wrap">
            <PixelButton href="/adventure" variant="gold" size="md">
              Play Adventure
            </PixelButton>
            <PixelButton href="/game" variant="orange" size="md">
              Mystery Game
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────

function AlignmentBadge({ lawfulChaotic, goodEvil }: { lawfulChaotic: number; goodEvil: number }) {
  const pos = getAlignmentPosition({ lawfulChaotic, goodEvil })
  const name = ALIGNMENT_DISPLAY_NAMES[pos]

  const bgColor = goodEvil <= -33
    ? 'var(--pixel-forest-mid)'
    : goodEvil >= 33
      ? 'var(--pixel-fire-orange)'
      : 'var(--pixel-bg-light)'

  return (
    <span
      className="font-[var(--font-pixel)] text-[8px] px-2 py-1 border-2 border-[var(--pixel-ui-border)] inline-block"
      style={{ backgroundColor: bgColor }}
    >
      {name}
    </span>
  )
}

function PodiumSlot({ entry, medal, size }: { entry: LeaderboardEntry; medal: 'gold' | 'silver' | 'bronze'; size: 'sm' | 'lg' }) {
  const borderColor = medal === 'gold' ? 'var(--pixel-gold-light)' : medal === 'silver' ? '#C0C0C0' : '#CD7F32'
  const medalEmoji = medal === 'gold' ? '\uD83E\uDD47' : medal === 'silver' ? '\uD83E\uDD48' : '\uD83E\uDD49'
  const boxSize = size === 'lg' ? 'w-24 h-24 sm:w-32 sm:h-32' : 'w-20 h-20 sm:w-24 sm:h-24'
  const textSize = size === 'lg' ? 'text-4xl' : 'text-3xl'

  return (
    <div className="text-center">
      <div
        className={`${boxSize} bg-[var(--pixel-bg-mid)] border-4 flex items-center justify-center mb-2 relative`}
        style={{ borderColor }}
      >
        <span className={textSize}>{medalEmoji}</span>
        {medal === 'gold' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-2xl">{'\uD83D\uDC51'}</span>
          </div>
        )}
      </div>
      <p className={`font-[var(--font-pixel)] text-[8px] ${entry.isNPC ? 'italic' : ''}`}
         style={{ color: borderColor }}>
        {entry.playerName}
      </p>
      <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{entry.score}</p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────

function getTopFaction(state: TrophyCheckState): string {
  const factions = [
    { id: 'pinkerton', rep: state.pinkertonRep },
    { id: 'settlers', rep: state.settlersRep },
    { id: 'natives', rep: state.nativesRep },
    { id: 'outlaws', rep: state.outlawsRep },
  ]
  const top = factions.reduce((a, b) => a.rep >= b.rep ? a : b)
  return top.rep > 0 ? top.id : 'none'
}

function mergeWithNPCs(notionEntries: LeaderboardEntry[]): LeaderboardEntry[] {
  // Add NPCs that aren't already in the list
  const existingIds = new Set(notionEntries.map(e => e.playerId))
  const npcsToAdd = NPC_LEGENDS.filter(n => !existingIds.has(n.playerId))
  const merged = [...notionEntries, ...npcsToAdd]
  merged.sort((a, b) => b.score - a.score)
  return merged
}

function getFallbackEntries(): LeaderboardEntry[] {
  // Try loading local leaderboard data
  let localEntries: LeaderboardEntry[] = []
  try {
    const stored = localStorage.getItem('bobr_rpg_leaderboard')
    if (stored) {
      const parsed = JSON.parse(stored) as Array<{
        name: string; id: string; score: number; chaptersCompleted: number; ending?: string
      }>
      localEntries = parsed.map(e => ({
        playerName: e.name,
        playerId: e.id,
        score: e.score,
        trophyCount: 0,
        trophies: [],
        chapter: e.chaptersCompleted,
        level: 1,
        isNPC: false,
      }))
    }
  } catch { /* ignore */ }

  // Merge with NPC legends
  return mergeWithNPCs(localEntries)
}
