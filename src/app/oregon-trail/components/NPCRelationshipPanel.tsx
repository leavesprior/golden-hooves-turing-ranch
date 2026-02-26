'use client'

/**
 * NPC Relationship Panel — Improvement #5 UI
 *
 * Displays the player's disposition history with every NPC they have
 * interacted with. Collapsible list sorted by most recent interaction.
 * Matches the retro amber/pixel-art theme of the rest of the trail UI.
 */

import React, { useState } from 'react'
import {
  RELATIONSHIP_GATES,
  getShopPriceMultiplier,
  type NPCRelationship,
  type DispositionLevel,
} from '../data/npcRelationships'
import { FloatingNumber } from '@/components/ui/FloatingNumber'

// ============================================================================
// HELPERS
// ============================================================================

/** Map NPC id keywords to an emoji portrait placeholder */
function getPersonalityEmoji(npcId: string): string {
  const id = npcId.toLowerCase()
  if (id.includes('blacksmith') || id.includes('smithy')) return '⚒️'
  if (id.includes('sheriff') || id.includes('marshal')) return '⭐'
  if (id.includes('doc') || id.includes('medic') || id.includes('nurse')) return '🩺'
  if (id.includes('merchant') || id.includes('trader') || id.includes('shop')) return '🏪'
  if (id.includes('farmer') || id.includes('ranch')) return '🌾'
  if (id.includes('outlaw') || id.includes('bandit')) return '🤠'
  if (id.includes('miner') || id.includes('prospect')) return '⛏️'
  if (id.includes('inn') || id.includes('tavern') || id.includes('saloon')) return '🍺'
  if (id.includes('guide') || id.includes('scout')) return '🧭'
  if (id.includes('priest') || id.includes('reverend') || id.includes('pastor')) return '📖'
  if (id.includes('gambler') || id.includes('card')) return '🃏'
  if (id.includes('native') || id.includes('chief')) return '🦅'
  if (id.includes('telegraph')) return '📨'
  if (id.includes('judge')) return '⚖️'
  return '👤'
}

/** Tailwind color classes per disposition level */
const LEVEL_COLORS: Record<
  DispositionLevel,
  { label: string; bar: string; text: string; bg: string }
> = {
  hostile:    { label: 'Hostile',    bar: 'bg-red-600',    text: 'text-red-400',    bg: 'bg-red-900/20' },
  unfriendly: { label: 'Unfriendly', bar: 'bg-orange-600', text: 'text-orange-400', bg: 'bg-orange-900/20' },
  neutral:    { label: 'Neutral',    bar: 'bg-gray-500',   text: 'text-gray-400',   bg: 'bg-gray-800/20' },
  friendly:   { label: 'Friendly',   bar: 'bg-green-600',  text: 'text-green-400',  bg: 'bg-green-900/20' },
  trusted:    { label: 'Trusted',    bar: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-900/20' },
  devoted:    { label: 'Devoted',    bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-900/20' },
}

/** Human-readable shop discount label for a disposition level */
function getDiscountLabel(level: DispositionLevel): string {
  switch (level) {
    case 'hostile':    return '+100% prices (hostile)'
    case 'unfriendly': return '+25% prices'
    case 'neutral':    return 'Standard prices'
    case 'friendly':   return '10% discount'
    case 'trusted':    return '25% discount'
    case 'devoted':    return '35% discount'
  }
}

/** Next unlock hint — first interesting gate the player has not yet reached */
function getNextGateHint(level: DispositionLevel): string | null {
  const order: DispositionLevel[] = [
    'hostile', 'unfriendly', 'neutral', 'friendly', 'trusted', 'devoted',
  ]
  const idx = order.indexOf(level)
  if (idx >= order.length - 1) return null
  const nextLevel = order[idx + 1]
  const gates = RELATIONSHIP_GATES[nextLevel]
  const interesting =
    gates.find(g =>
      g.includes('dialogue') ||
      g.includes('quest') ||
      g.includes('secret') ||
      g.includes('info') ||
      g.includes('clue')
    ) ?? gates[0]
  if (!interesting) return null
  return `Become ${LEVEL_COLORS[nextLevel].label} to unlock: ${interesting}`
}

/** Format a game-day offset into a short relative string */
function formatDayAgo(lastInteraction: number, currentDay: number): string {
  const delta = currentDay - lastInteraction
  if (delta <= 0) return 'today'
  if (delta === 1) return 'yesterday'
  return `${delta} days ago`
}

// ============================================================================
// PANEL COMPONENT
// ============================================================================

export interface NPCRelationshipPanelProps {
  relationships: NPCRelationship[]
  currentDay: number
  onClose?: () => void
  /** When true renders inline with no fixed overlay wrapper. */
  inline?: boolean
}

/**
 * Full NPC relationship list, sorted by most recent interaction.
 * Each entry is a collapsible card showing score bar, discount, gate hints,
 * and memory log.
 */
export function NPCRelationshipPanel({
  relationships,
  currentDay,
  onClose,
  inline = false,
}: NPCRelationshipPanelProps) {
  const sorted = [...relationships].sort(
    (a, b) => b.lastInteraction - a.lastInteraction
  )

  const inner = (
    <div
      className={
        inline
          ? ''
          : 'bg-amber-950 border-2 border-amber-600 rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col'
      }
    >
      {/* Header */}
      <div className="bg-amber-900 px-4 py-3 border-b border-amber-600 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <div>
            <h2 className="text-amber-200 font-bold text-sm">Trail Acquaintances</h2>
            <p className="text-amber-500 text-xs">
              {sorted.length} {sorted.length === 1 ? 'person' : 'people'} remembered
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-amber-500 hover:text-amber-200 text-lg leading-none px-2"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-amber-500 text-sm">No one remembers you yet.</p>
            <p className="text-amber-600 text-xs mt-1">
              Meet NPCs by investigating, trading, or talking at towns.
            </p>
          </div>
        ) : (
          sorted.map(rel => (
            <RelationshipCard
              key={rel.npcId}
              relationship={rel}
              currentDay={currentDay}
            />
          ))
        )}
      </div>
    </div>
  )

  if (inline) return inner

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {inner}
    </div>
  )
}

// ============================================================================
// RELATIONSHIP CARD (collapsible)
// ============================================================================

interface RelationshipCardProps {
  relationship: NPCRelationship
  currentDay: number
}

function RelationshipCard({ relationship, currentDay }: RelationshipCardProps) {
  const [expanded, setExpanded] = useState(false)

  const {
    npcId,
    disposition,
    level,
    memories,
    personalOpinion,
    lastInteraction,
    timesHelped,
    timesAntagonized,
  } = relationship

  const colors = LEVEL_COLORS[level]
  const discountLabel = getDiscountLabel(level)
  const gateHint = getNextGateHint(level)
  const shopMultiplier = getShopPriceMultiplier(disposition)

  // e.g. "sheriff_fort_laramie" -> "Sheriff Fort Laramie"
  const displayName = npcId
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const recentMemory = memories.length > 0 ? memories[memories.length - 1] : null

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${colors.bg} border-amber-700/50`}
    >
      {/* Summary row — always visible */}
      <button
        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-amber-800/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {/* Portrait emoji */}
        <span className="text-2xl flex-shrink-0">{getPersonalityEmoji(npcId)}</span>

        {/* Name + level label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amber-200 text-sm font-bold truncate">{displayName}</span>
            {gateHint && gateHint.includes('dialogue') && (
              <span className="animate-pulse text-yellow-400 text-xs ml-1">!</span>
            )}
            <span
              className={`text-xs px-1.5 py-0.5 rounded border ${colors.text} border-current bg-black/20`}
            >
              {colors.label}
            </span>
          </div>
          <p className="text-amber-500 text-xs mt-0.5">
            Last seen: {formatDayAgo(lastInteraction, currentDay)}
          </p>
        </div>

        {/* Disposition bar */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 w-20">
          <span className="text-amber-400 text-xs">{disposition}/100</span>
          <div className="w-20 h-2 bg-gray-800 rounded overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-700 ease-out ${colors.bar}`}
              style={{ width: `${disposition}%` }}
            />
          </div>
        </div>

        <span className="text-amber-600 text-xs ml-1 flex-shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-amber-800/50 space-y-2 mt-1">
          {/* Opinion */}
          {personalOpinion && personalOpinion !== 'Has no opinion yet.' && (
            <p className="text-amber-300 text-xs italic">{personalOpinion}</p>
          )}

          {/* Counts */}
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">{timesHelped} positive</span>
            <span className="text-red-400">{timesAntagonized} negative</span>
          </div>

          {/* Most recent memory */}
          {recentMemory && (
            <div className="bg-black/20 rounded px-2 py-1.5">
              <span className="text-amber-500 text-xs font-bold">Last: </span>
              <span className="text-amber-300 text-xs">{recentMemory.description}</span>
              <span
                className={`text-xs ml-1 ${
                  recentMemory.delta > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ({recentMemory.delta > 0 ? '+' : ''}
                {recentMemory.delta})
              </span>
            </div>
          )}

          {/* Shop discount indicator */}
          <div className="flex items-center gap-1">
            <span className="text-amber-500 text-xs">Shop price:</span>
            <span
              className={`text-xs font-bold ${
                shopMultiplier < 1
                  ? 'text-green-400'
                  : shopMultiplier > 1
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {discountLabel}
            </span>
          </div>

          {/* Gate hint — next unlock */}
          {gateHint && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded px-2 py-1.5">
              <span className="text-amber-600 text-xs italic">{gateHint}</span>
            </div>
          )}

          {/* Memory log */}
          {memories.length > 1 && (
            <details className="text-xs">
              <summary className="text-amber-500 cursor-pointer hover:text-amber-300 select-none">
                Memory log ({memories.length} events)
              </summary>
              <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                {[...memories]
                  .reverse()
                  .slice(0, 8)
                  .map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <span className="text-amber-700 flex-shrink-0">
                        Day {m.timestamp}
                      </span>
                      <span className="text-amber-400 flex-1">{m.description}</span>
                      <span
                        className={`flex-shrink-0 ${
                          m.delta > 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {m.delta > 0 ? '+' : ''}
                        {m.delta}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default NPCRelationshipPanel
