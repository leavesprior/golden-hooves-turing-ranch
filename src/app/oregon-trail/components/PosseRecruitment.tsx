'use client'

/**
 * PosseRecruitment Component — Improvement #6 (Posse System)
 *
 * Modal overlay for recruiting posse members at settlements/forts.
 * Shows candidates available at the current landmark, with costs,
 * stat requirements, and hire confirmation via KarmaWallet.
 *
 * Style: Matches existing amber/green DOS retro terminal theme.
 * Pattern: Mirrors GuideHire.tsx modal structure exactly.
 */

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useCharacter } from '../characterContext'
import { useNarrator } from '../narratorContext'
import { KarmaWallet } from './KarmaWallet'
import { KarmaConvertModal } from './KarmaConvertModal'
import {
  POSSE_MEMBERS,
  getAvailablePosse,
  meetsHiringRequirements,
  ROLE_BONUSES,
  type PosseMember,
  type PartyRole,
} from '../data/posseSystem'
import { playSFX } from '../lib/audioManager'
import { DOSMessage } from '@/components/ui/DOSMessage'

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

// Bonus type display and percentage set (mirrors PossePanel)
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

const PCT_TYPES = new Set([
  'shop_discount', 'travel_speed', 'food_efficiency',
  'wagon_repair', 'disease_resist', 'combat', 'hunting',
])

// Maximum hired posse members (not counting original party)
const MAX_POSSE_SIZE = 4

// ─── Props ─────────────────────────────────────────────────────────────────────
interface PosseRecruitmentProps {
  onClose: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function PosseRecruitment({ onClose }: PosseRecruitmentProps) {
  const { state, hirePosseMember } = useOregonTrail()
  const {
    canAfford, spendNeutral, spendGood,
    showConvertModal, setShowConvertModal,
    convertModalContext, setConvertModalContext,
  } = useKarmaWallet()
  const { getStat } = useCharacter()
  const { comment, setMood } = useNarrator()

  const [message, setMessage]           = useState<string | null>(null)
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [justHiredId, setJustHiredId]   = useState<string | null>(null)

  const currentLandmark = state.currentLandmark
  const hiredIds        = new Set(
    state.party.filter(m => m.isHired).map(m => m.posseMemberId).filter(Boolean) as string[]
  )
  const currentHiredCount = state.party.filter(m => m.isHired).length
  const isAtCapacity      = currentHiredCount >= MAX_POSSE_SIZE

  // Available candidates at this landmark — or ALL members if none spawn here
  // (so the panel is never empty at any location)
  const landmarkCandidates = getAvailablePosse(currentLandmark)
  const candidates: PosseMember[] =
    landmarkCandidates.length > 0 ? landmarkCandidates : POSSE_MEMBERS

  // Build player stats map for requirements check
  const playerStats: Record<string, number> = {
    Shrewdness: getStat('Shrewdness'),
    Agility:    getStat('Agility'),
    Durability: getStat('Durability'),
    Diplomacy:  getStat('Diplomacy'),
    Luck:       getStat('Luck'),
    Expertise:  getStat('Expertise'),
  }

  const handleRecruit = useCallback(async (member: PosseMember) => {
    if (isAtCapacity) {
      playSFX('fail')
      setMessage(`Posse is full (${MAX_POSSE_SIZE} max). Dismiss someone first.`)
      return
    }
    if (hiredIds.has(member.id)) {
      playSFX('fail')
      setMessage(`${member.name} is already in your posse.`)
      return
    }

    // Requirements check
    const { canHire, reasons } = meetsHiringRequirements(member, playerStats)
    if (!canHire) {
      playSFX('fail')
      setMessage(`Can't recruit: ${reasons.join('. ')}`)
      return
    }

    // Karma cost check
    if (!canAfford('neutral', member.hireCost)) {
      setConvertModalContext({ needed: member.hireCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }
    if (member.goodKarmaCost && !canAfford('good', member.goodKarmaCost)) {
      setMessage(
        `${member.name} requires ${member.goodKarmaCost}\ud83c\udf6a Good Karma — proof of character.`
      )
      return
    }

    // Spend neutral karma
    const ok = await spendNeutral(member.hireCost, `Hire posse: ${member.name}`)
    if (!ok) {
      setMessage('Transaction failed — try again.')
      return
    }

    // Spend good karma if required
    if (member.goodKarmaCost) {
      await spendGood(member.goodKarmaCost, `Posse reputation: ${member.name}`)
    }

    // Add to party via context
    hirePosseMember(member)

    setJustHiredId(member.id)
    playSFX('success')
    setMessage(`${member.name} has joined your posse!`)
    setMood('impressed')
    setTimeout(() => {
      comment(member.narratorComment, 'observation')
    }, 600)
  }, [
    isAtCapacity, hiredIds, playerStats, canAfford,
    spendNeutral, spendGood, hirePosseMember,
    setMood, comment, setConvertModalContext, setShowConvertModal,
  ])

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-amber-900/60 p-4 border-b border-amber-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{'\ud83e\udd20'}</span>
            <div>
              <h2 className="text-amber-200 font-bold font-pixel text-sm">Recruit Posse</h2>
              <p className="text-amber-400 text-xs">
                {currentLandmark} &mdash; {currentHiredCount}/{MAX_POSSE_SIZE} hired
              </p>
            </div>
          </div>
          <div className="text-right">
            <KarmaWallet compact showBadKarma={false} />
          </div>
        </div>

        {/* ── At-capacity warning ── */}
        {isAtCapacity && (
          <div className="bg-red-900/30 border-b border-red-700 px-4 py-2 shrink-0">
            <p className="text-red-300 text-xs text-center">
              {'\u26a0\ufe0f'} Posse is full ({MAX_POSSE_SIZE}/{MAX_POSSE_SIZE}).
              Dismiss a member before recruiting.
            </p>
          </div>
        )}

        {/* ── Candidate list ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {candidates.length === 0 && (
            <p className="text-amber-500 text-sm text-center py-8">
              No recruits available here. Continue west.
            </p>
          )}

          {candidates.map(member => {
            const alreadyHired    = hiredIds.has(member.id)
            const justHired       = justHiredId === member.id
            const affordable      = canAfford('neutral', member.hireCost) &&
              (!member.goodKarmaCost || canAfford('good', member.goodKarmaCost))
            const { canHire: meetsReqs, reasons } =
              meetsHiringRequirements(member, playerStats)
            const canRecruit  = !alreadyHired && !isAtCapacity && meetsReqs
            const isExpanded  = expandedId === member.id

            // Card border colour
            const borderClass = alreadyHired || justHired
              ? 'border-green-600'
              : canRecruit
                ? 'border-amber-600 hover:border-amber-400 cursor-pointer'
                : 'border-gray-700 opacity-60'

            return (
              <div
                key={member.id}
                className={`border rounded-lg overflow-hidden transition-all ${borderClass}`}
                onClick={() => { if (!alreadyHired) { playSFX('click'); setExpandedId(isExpanded ? null : member.id) } }}
              >
                {/* Candidate summary row */}
                <div
                  className={`p-3 ${
                    isExpanded
                      ? 'bg-amber-900/40'
                      : alreadyHired || justHired
                        ? 'bg-green-900/20'
                        : 'bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{member.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="text-amber-200 font-bold text-sm truncate">
                            {member.name}
                          </h3>
                          <p className="text-amber-400 text-xs">{member.title}</p>
                          <p className="text-amber-600 text-[10px] capitalize">
                            {ROLE_ICONS[member.role]} {member.role}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {alreadyHired || justHired ? (
                            <span className="text-green-400 text-xs font-bold">
                              {'\u2713'} In posse
                            </span>
                          ) : (
                            <>
                              <p className={`font-bold text-sm ${
                                affordable ? 'text-yellow-300' : 'text-red-400'
                              }`}>
                                {member.hireCost}{'\ud83c\udf2e'}
                              </p>
                              {member.goodKarmaCost && (
                                <p className="text-amber-400 text-[10px]">
                                  +{member.goodKarmaCost}{'\ud83c\udf6a'}
                                </p>
                              )}
                              <p className="text-amber-600 text-[10px]">
                                Loyalty: {member.loyalty}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && !alreadyHired && (
                  <div className="bg-stone-900/80 p-3 border-t border-amber-800 space-y-3">

                    {/* Description */}
                    <p className="text-amber-300 text-xs leading-relaxed">
                      {member.description}
                    </p>

                    {/* Stat requirement */}
                    {member.statRequirement && (
                      <div className={`text-xs px-2 py-1 rounded border ${
                        (playerStats[member.statRequirement.stat] ?? 0) >= member.statRequirement.minimum
                          ? 'bg-green-900/30 border-green-700 text-green-300'
                          : 'bg-red-900/30 border-red-700 text-red-300'
                      }`}>
                        Requires {member.statRequirement.stat} {member.statRequirement.minimum}
                        {' '}(yours: {playerStats[member.statRequirement.stat] ?? 0})
                      </div>
                    )}

                    {/* Requirements failures */}
                    {reasons.length > 0 && (
                      <div className="space-y-1">
                        {reasons.map((r, i) => (
                          <p key={i} className="text-red-400 text-[10px]">
                            {'\u2715'} {r}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Role bonuses */}
                    <div>
                      <p className="text-amber-500 text-[10px] uppercase tracking-wider mb-1">
                        Role Bonuses
                      </p>
                      <div className="space-y-1">
                        {(ROLE_BONUSES[member.role] ?? []).map((b, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-green-400 text-[10px]">+</span>
                            <span className="text-green-300 text-[10px]">
                              {b.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special ability */}
                    <div className="bg-amber-950/60 border border-amber-800 rounded p-2">
                      <p className="text-amber-400 text-[10px] uppercase tracking-wider mb-0.5">
                        Special: {member.specialAbility.name}
                      </p>
                      <p className="text-amber-300 text-[10px] leading-snug">
                        {member.specialAbility.description}
                      </p>
                      <p className="text-amber-600 text-[9px] mt-0.5 capitalize">
                        {member.specialAbility.type}
                        {member.specialAbility.cooldownDays
                          ? ` — ${member.specialAbility.cooldownDays}d cooldown`
                          : ''}
                      </p>
                    </div>

                    {/* Personality quirk */}
                    <p className="text-amber-600 text-[10px] italic">
                      &ldquo;{member.personalityQuirk}&rdquo;
                    </p>

                    {/* Recruit button */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (canRecruit) handleRecruit(member)
                      }}
                      disabled={!canRecruit}
                      className={`w-full py-3 md:py-2 rounded font-bold text-base md:text-sm font-pixel transition-colors active:scale-[0.99] ${
                        canRecruit
                          ? affordable
                            ? 'bg-amber-700 hover:bg-amber-600 text-amber-100 border-2 border-amber-500'
                            : 'bg-red-900/60 text-red-300 border-2 border-red-700 cursor-not-allowed'
                          : 'bg-gray-800 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {isAtCapacity
                        ? 'Posse full'
                        : !meetsReqs
                          ? 'Requirements not met'
                          : !affordable
                            ? `Need ${member.hireCost}\ud83c\udf2e${member.goodKarmaCost ? ` + ${member.goodKarmaCost}\ud83c\udf6a` : ''}`
                            : `Recruit ${member.name} (${member.hireCost}\ud83c\udf2e${member.goodKarmaCost ? ` + ${member.goodKarmaCost}\ud83c\udf6a` : ''})`
                      }
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-amber-700 p-4 shrink-0 space-y-3">
          {message && (
            <DOSMessage text={message} speed={25} sfxEvery={0} className="text-amber-200 text-sm text-center" />
          )}
          <button
            onClick={onClose}
            className="w-full py-3 md:py-2 bg-amber-900/60 border-2 border-amber-700 text-amber-200 rounded font-bold text-base md:text-sm font-pixel hover:bg-amber-800/60 active:scale-[0.99] transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Karma Convert Modal (triggered when player can't afford) */}
      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false)
            setConvertModalContext(null)
          }}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType === 'good' ? 'good' : 'neutral'}
        />
      )}
    </div>
  )
}

export default PosseRecruitment
