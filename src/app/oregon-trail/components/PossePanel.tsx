'use client'

/**
 * PossePanel Component — Improvement #6 (Posse System)
 *
 * Displays the current posse roster, per-member loyalty bars,
 * active composition bonuses, and party stat bonus summary.
 *
 * Style: Matches existing amber/green DOS retro terminal theme.
 */

import React from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import {
  ROLE_BONUSES,
  getActiveCompositionBonuses,
  type PartyRole,
} from '../data/posseSystem'

// ─── Role icon map ─────────────────────────────────────────────────────────────
const ROLE_ICONS: Record<PartyRole, string> = {
  leader:    '\u2605',
  scout:     '\ud83d\udc41\ufe0f',
  medic:     '\u2695\ufe0f',
  hunter:    '\ud83c\udff9',
  mechanic:  '\ud83d\udd27',
  guard:     '\ud83d\udee1\ufe0f',
  cook:      '\ud83e\uddd1\u200d\ud83c\udf73',
  navigator: '\ud83e\uddad',
  diplomat:  '\ud83c\udfa9',
  companion: '\ud83d\udc64',
}

// ─── Bonus type display names ──────────────────────────────────────────────────
const BONUS_DISPLAY: Record<string, string> = {
  travel_speed:    'Travel Speed',
  food_efficiency: 'Food Eff.',
  hunting:         'Hunting',
  wagon_repair:    'Wagon Repair',
  disease_resist:  'Disease Resist',
  combat:          'Combat',
  shop_discount:   'Shop Discount',
  river_crossing:  'River Crossing',
  morale:          'Morale',
  danger_warning:  'Danger Warning',
}

// Bonus types that are percentages
const PCT_TYPES = new Set([
  'shop_discount', 'travel_speed', 'food_efficiency',
  'wagon_repair', 'disease_resist', 'combat', 'hunting',
])

// ─── Loyalty helpers ───────────────────────────────────────────────────────────
function loyaltyBarColor(loyalty: number): string {
  if (loyalty < 30) return 'bg-red-500'
  if (loyalty < 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

function loyaltyLabel(loyalty: number): string {
  if (loyalty <= 10) return 'Deserting!'
  if (loyalty <= 20) return 'Mutinous'
  if (loyalty <= 30) return 'Wavering'
  if (loyalty <= 60) return 'Steady'
  if (loyalty <= 80) return 'Loyal'
  return 'Devoted'
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function PossePanel() {
  const { state, dismissPosseMember } = useOregonTrail()
  const { party, partyBonuses } = state

  const hiredMembers  = party.filter(m => m.isHired)
  const originalParty = party.filter(m => !m.isHired)

  const roles       = party.map(m => m.role)
  const activeComps = getActiveCompositionBonuses(roles)

  const bonusList = Object.entries(partyBonuses)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-stone-950 border-2 border-amber-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-amber-900/60 px-4 py-2 border-b border-amber-700 flex items-center gap-2">
        <span className="text-amber-400 text-sm">{'\ud83e\udd20'}</span>
        <h3 className="font-pixel text-amber-200 text-xs tracking-wide">POSSE ROSTER</h3>
        <span className="ml-auto text-amber-500 text-[10px]">
          {hiredMembers.length} hired / {party.length} total
        </span>
      </div>

      <div className="p-3 space-y-3">

        {/* Original party members — compact */}
        {originalParty.length > 0 && (
          <div>
            <p className="text-amber-600 text-[10px] uppercase tracking-wider mb-1">Party</p>
            <div className="space-y-1">
              {originalParty.map(member => (
                <div key={member.id} className="flex items-center gap-2 text-xs">
                  <span className="text-base leading-none">{ROLE_ICONS[member.role]}</span>
                  <span className="text-amber-200 flex-1 truncate">{member.name}</span>
                  <span className="text-amber-500 text-[10px] capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hired posse members — detailed with loyalty bars */}
        {hiredMembers.length > 0 ? (
          <div>
            <p className="text-amber-600 text-[10px] uppercase tracking-wider mb-1">Hired Guns</p>
            <div className="space-y-2">
              {hiredMembers.map(member => {
                const loyalty   = member.loyalty ?? 50
                const isWarning = loyalty < 25
                const dismissId = member.posseMemberId ?? member.id

                return (
                  <div
                    key={member.id}
                    className={`border rounded p-2 ${
                      isWarning
                        ? 'border-red-600 bg-red-950/30'
                        : 'border-amber-800/60 bg-amber-950/30'
                    }`}
                  >
                    {/* Name + warning + dismiss */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base leading-none">
                        {member.emoji ?? ROLE_ICONS[member.role]}
                      </span>
                      <span className="text-amber-200 text-xs font-bold flex-1 truncate">
                        {member.name}
                      </span>
                      {isWarning && (
                        <span className="text-red-400 text-[9px] animate-pulse shrink-0">
                          {'\u26a0\ufe0f'} Low loyalty
                        </span>
                      )}
                      <button
                        onClick={() => dismissPosseMember(dismissId)}
                        className="text-[10px] text-red-700 hover:text-red-500 px-1 shrink-0 leading-none"
                        title={`Dismiss ${member.name}`}
                        aria-label={`Dismiss ${member.name} from posse`}
                      >
                        {'\u2715'}
                      </button>
                    </div>

                    {/* Role label */}
                    <p className="text-amber-500 text-[10px] capitalize mb-1.5">
                      {ROLE_ICONS[member.role]} {member.role}
                    </p>

                    {/* Loyalty bar */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[9px] w-14 shrink-0 ${
                          isWarning ? 'text-red-400' : 'text-amber-600'
                        }`}
                      >
                        {loyaltyLabel(loyalty)}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all ${loyaltyBarColor(loyalty)}`}
                          style={{ width: `${loyalty}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-amber-600 w-6 text-right shrink-0">
                        {loyalty}
                      </span>
                    </div>

                    {/* Role bonus tags */}
                    <div className="flex flex-wrap gap-1">
                      {(ROLE_BONUSES[member.role] ?? []).map((b, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-green-900/40 text-green-400 px-1 rounded border border-green-900/60"
                        >
                          {BONUS_DISPLAY[b.type] ?? b.type} +{b.value}
                          {PCT_TYPES.has(b.type) ? '%' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-amber-700 text-[10px] italic text-center py-1">
            No posse hired. Visit a fort or town to recruit.
          </p>
        )}

        {/* Active composition synergy bonuses */}
        {activeComps.length > 0 && (
          <div>
            <p className="text-amber-600 text-[10px] uppercase tracking-wider mb-1">Synergies</p>
            <div className="space-y-1">
              {activeComps.map(comp => (
                <div
                  key={comp.id}
                  className="flex items-start gap-1.5 bg-purple-950/30 border border-purple-800/50 rounded px-2 py-1"
                >
                  <span className="text-purple-400 text-[10px] shrink-0 mt-px">{'\u2605'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-purple-300 text-[10px] font-bold leading-snug">
                      {comp.name}
                    </p>
                    <p className="text-purple-500 text-[9px] leading-snug">
                      {comp.bonus.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aggregate party bonus summary */}
        {bonusList.length > 0 && (
          <div>
            <p className="text-amber-600 text-[10px] uppercase tracking-wider mb-1">
              Party Bonuses
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {bonusList.map(([type, value]) => (
                <div key={type} className="flex justify-between text-[10px]">
                  <span className="text-amber-500">{BONUS_DISPLAY[type] ?? type}:</span>
                  <span className="text-green-400 font-bold">
                    +{value}{PCT_TYPES.has(type) ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PossePanel
