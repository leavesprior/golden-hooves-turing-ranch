'use client'

import React, { useState, useMemo } from 'react'
import {
  ADVANTAGES,
  FLAWS,
  STARTING_PICKS,
  calculatePicksCost,
  calculateStatModifiers,
  arePicksCompatible,
  getPickById,
  type Advantage,
} from '@/app/adventure/data/advantages'
import type { SaddleStats, StatName } from '@/app/oregon-trail/characterContext'

interface ZeroSumPickerProps {
  onConfirm: (selectedIds: string[], totalMods: Partial<SaddleStats>) => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<Advantage['category'], { label: string; color: string }> = {
  physical: { label: 'Physical', color: 'var(--pixel-fire-orange)' },
  mental: { label: 'Mental', color: 'var(--pixel-gold-light)' },
  social: { label: 'Social', color: 'var(--pixel-forest-light)' },
  supernatural: { label: 'Supernatural', color: 'var(--pixel-earth-light)' },
  flaw: { label: 'Flaw', color: 'var(--pixel-fire-red)' },
}

const STAT_DISPLAY: Record<StatName, { abbr: string; color: string }> = {
  Shrewdness: { abbr: 'SHR', color: '#a78bfa' },
  Agility: { abbr: 'AGI', color: '#60a5fa' },
  Durability: { abbr: 'DUR', color: '#f87171' },
  Diplomacy: { abbr: 'DIP', color: '#34d399' },
  Luck: { abbr: 'LCK', color: '#fbbf24' },
  Expertise: { abbr: 'EXP', color: '#fb923c' },
}

export function ZeroSumPicker({ onConfirm, onBack }: ZeroSumPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCategory, setShowCategory] = useState<'advantages' | 'flaws'>('advantages')

  const picksCost = useMemo(() => calculatePicksCost(selectedIds), [selectedIds])
  const picksRemaining = STARTING_PICKS - picksCost
  const statMods = useMemo(() => calculateStatModifiers(selectedIds), [selectedIds])
  const compatibility = useMemo(() => arePicksCompatible(selectedIds), [selectedIds])

  const togglePick = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(p => p !== id))
    } else {
      const pick = getPickById(id)
      if (!pick) return
      // Check if we can afford it
      if (picksRemaining - pick.cost < 0) return
      // Check compatibility
      const newIds = [...selectedIds, id]
      const { valid } = arePicksCompatible(newIds)
      if (!valid) return
      setSelectedIds(newIds)
    }
  }

  const items = showCategory === 'advantages' ? ADVANTAGES : FLAWS

  return (
    <div className="space-y-4">
      {/* Picks Budget Bar */}
      <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
            PICKS REMAINING
          </span>
          <span className={`font-[var(--font-pixel)] text-[16px] ${
            picksRemaining < 0 ? 'text-[var(--pixel-fire-red)]' :
            picksRemaining === 0 ? 'text-[var(--pixel-forest-light)]' :
            'text-[var(--pixel-gold-light)]'
          }`}>
            {picksRemaining} / {STARTING_PICKS}
          </span>
        </div>
        {/* Visual bar */}
        <div className="w-full h-3 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.max(0, Math.min(100, (picksRemaining / STARTING_PICKS) * 100))}%`,
              backgroundColor: picksRemaining <= 2 ? 'var(--pixel-fire-orange)' :
                picksRemaining <= 0 ? 'var(--pixel-fire-red)' : 'var(--pixel-gold-mid)',
            }}
          />
        </div>
        {/* Stat preview */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.entries(statMods) as [StatName, number][]).map(([stat, val]) => (
            <span
              key={stat}
              className="font-[var(--font-pixel)] text-[10px] px-2 py-1 border"
              style={{
                color: STAT_DISPLAY[stat].color,
                borderColor: STAT_DISPLAY[stat].color,
              }}
            >
              {STAT_DISPLAY[stat].abbr} {val > 0 ? '+' : ''}{val}
            </span>
          ))}
          {Object.keys(statMods).length === 0 && (
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] opacity-50">
              No modifiers yet — choose advantages and flaws
            </span>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCategory('advantages')}
          className={`flex-1 py-2 px-4 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
            showCategory === 'advantages'
              ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
              : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]'
          }`}
        >
          ADVANTAGES (Cost Picks)
        </button>
        <button
          onClick={() => setShowCategory('flaws')}
          className={`flex-1 py-2 px-4 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
            showCategory === 'flaws'
              ? 'bg-[var(--pixel-fire-red)]/30 border-[var(--pixel-fire-red)] text-[var(--pixel-fire-orange)]'
              : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]'
          }`}
        >
          FLAWS (Grant Picks)
        </button>
      </div>

      {/* Compatibility warnings */}
      {!compatibility.valid && (
        <div className="bg-[var(--pixel-fire-red)]/20 border-2 border-[var(--pixel-fire-red)] p-2">
          {compatibility.conflicts.map((c, i) => (
            <p key={i} className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-fire-orange)]">
              {c}
            </p>
          ))}
        </div>
      )}

      {/* Pick Grid */}
      <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
        {items.map(pick => {
          const isSelected = selectedIds.includes(pick.id)
          const canAfford = picksRemaining >= pick.cost
          const wouldConflict = !isSelected && !arePicksCompatible([...selectedIds, pick.id]).valid
          const disabled = !isSelected && (!canAfford || wouldConflict)

          return (
            <button
              key={pick.id}
              onClick={() => !disabled && togglePick(pick.id)}
              disabled={disabled}
              className={`text-left p-3 border-2 transition-all ${
                isSelected
                  ? pick.cost > 0
                    ? 'bg-[var(--pixel-gold-dark)]/40 border-[var(--pixel-gold-mid)]'
                    : 'bg-[var(--pixel-fire-red)]/20 border-[var(--pixel-fire-orange)]'
                  : disabled
                    ? 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] opacity-40 cursor-not-allowed'
                    : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isSelected && <span className="text-[var(--pixel-gold-light)]">{'\u2713'}</span>}
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                      {pick.name}
                    </span>
                    <span
                      className="font-[var(--font-pixel)] text-[9px] px-1 border"
                      style={{ color: CATEGORY_LABELS[pick.category].color, borderColor: CATEGORY_LABELS[pick.category].color }}
                    >
                      {CATEGORY_LABELS[pick.category].label}
                    </span>
                  </div>
                  <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 mb-1">
                    {pick.description}
                  </p>
                  {/* Stat effects */}
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(pick.statModifiers) as [StatName, number][]).map(([stat, val]) => (
                      <span
                        key={stat}
                        className="font-[var(--font-pixel)] text-[8px] px-1"
                        style={{ color: STAT_DISPLAY[stat].color }}
                      >
                        {STAT_DISPLAY[stat].abbr} {val > 0 ? '+' : ''}{val}
                      </span>
                    ))}
                  </div>
                  {pick.specialAbility && (
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] mt-1">
                      Special: {pick.specialAbility}
                    </p>
                  )}
                </div>
                <div className={`font-[var(--font-pixel)] text-[14px] ml-2 ${
                  pick.cost > 0 ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-forest-light)]'
                }`}>
                  {pick.cost > 0 ? `-${pick.cost}` : `+${Math.abs(pick.cost)}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Action Buttons — sticky so they're always visible */}
      <div className="flex gap-3 sticky bottom-0 bg-[var(--pixel-bg-dark)] pt-3 pb-1 -mx-1 px-1 border-t border-[var(--pixel-ui-border)]/30">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
        >
          {'\u2190'} BACK
        </button>
        <button
          onClick={() => onConfirm(selectedIds, statMods)}
          disabled={picksRemaining < 0 || !compatibility.valid}
          className={`flex-1 py-3 px-4 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
            picksRemaining >= 0 && compatibility.valid
              ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)]'
              : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] opacity-40 cursor-not-allowed'
          }`}
        >
          CONFIRM PICKS ({picksRemaining} unspent)
        </button>
      </div>
    </div>
  )
}
