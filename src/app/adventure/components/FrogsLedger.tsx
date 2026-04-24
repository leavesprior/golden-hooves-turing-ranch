'use client'

/**
 * FrogsLedger — chapter-end narrative review of SADDLE stat growth.
 *
 * Research note: Krondor-style usage-based progression is SILENT at the
 * moment of level-up (no mid-combat popup) and gets its catharsis here,
 * at chapter rollover. One line per stat that moved, phrased in-world.
 *
 *   "Shrewdness grew from 12 to 14 — you noticed three things others missed"
 *
 * Pixel-parchment aesthetic reuses the existing --pixel-gold-* / --pixel-bg-*
 * CSS variables so it fits the site's palette without new tokens.
 */

import React from 'react'
import type { StatName } from '@/app/oregon-trail/characterContext'
import type { LedgerEntry } from '@/app/adventure/lib/skillProgression'

interface FrogsLedgerProps {
  chapter: number
  entries: LedgerEntry[]
  onContinue: () => void
}

const STAT_ICON: Record<StatName, string> = {
  Shrewdness: '🔍',
  Agility: '⚡',
  Durability: '🛡️',
  Diplomacy: '🤝',
  Luck: '🍀',
  Expertise: '🌲',
}

const STAT_COLOR: Record<StatName, string> = {
  Shrewdness: '#a78bfa',
  Agility: '#60a5fa',
  Durability: '#f87171',
  Diplomacy: '#34d399',
  Luck: '#fbbf24',
  Expertise: '#fb923c',
}

function formatEntry(e: LedgerEntry): string {
  const delta = e.toLevel - e.fromLevel
  const verb = delta > 0 ? 'grew' : delta < 0 ? 'faded' : 'held steady'
  return `${e.stat} ${verb} from ${e.fromLevel} to ${e.toLevel} — ${e.narrative}`
}

export function FrogsLedger({ chapter, entries, onContinue }: FrogsLedgerProps) {
  return (
    <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] p-6 max-w-2xl mx-auto">
      {/* Parchment header */}
      <div className="text-center mb-4 border-b-2 border-[var(--pixel-gold-dark)] pb-3">
        <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
          {'🐸'} THE FROG&apos;S LEDGER
        </h2>
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60 mt-1">
          Chapter {chapter} closes. The frog records what has changed in you.
        </p>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] text-center py-6 opacity-50">
          No stat changed this chapter. The frog turns the page without comment.
        </p>
      ) : (
        <ul className="space-y-3 py-2">
          {entries.map((entry, i) => {
            const delta = entry.toLevel - entry.fromLevel
            return (
              <li
                key={`${entry.stat}-${i}`}
                className="flex items-start gap-3 bg-[var(--pixel-bg-mid)]/40 border border-[var(--pixel-ui-border)] p-3"
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {STAT_ICON[entry.stat]}
                </span>
                <div className="flex-1">
                  <p
                    className="font-[var(--font-pixel)] text-[10px]"
                    style={{ color: STAT_COLOR[entry.stat] }}
                  >
                    {entry.stat}{' '}
                    <span className="text-[var(--pixel-ui-text)] opacity-70">
                      {entry.fromLevel} {'→'} {entry.toLevel}
                    </span>
                    {delta > 0 && (
                      <span className="text-[var(--pixel-forest-light)] ml-2">
                        (+{delta})
                      </span>
                    )}
                    {delta < 0 && (
                      <span className="text-[var(--pixel-fire-orange)] ml-2">
                        ({delta})
                      </span>
                    )}
                  </p>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-80 mt-1">
                    {formatEntry(entry)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Continue */}
      <button
        onClick={onContinue}
        className="w-full mt-6 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)] transition-all"
      >
        CONTINUE {'▶'}
      </button>
    </div>
  )
}

export default FrogsLedger
