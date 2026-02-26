'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useNarrator } from '../narratorContext'
import {
  getAllServices,
  getServicesForRole,
  getCostTier,
  COST_MULTIPLIERS,
  type PartyService,
} from '../data/partyServices'
import { POSSE_MEMBERS, type PartyRole, type PosseMember } from '../data/posseSystem'
import { playSFX } from '../lib/audioManager'
import { DOSMessage } from '@/components/ui/DOSMessage'
import { FloatingNumber } from '@/components/ui/FloatingNumber'

interface CampMenuProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// CATEGORY HEADERS
// ============================================================================

const CATEGORY_HEADERS: Record<string, { emoji: string; label: string }> = {
  medical: { emoji: '\u2695\ufe0f', label: 'Medical' },
  repair: { emoji: '\ud83d\udd27', label: 'Repair' },
  food: { emoji: '\ud83c\udf56', label: 'Food & Provisions' },
  scouting: { emoji: '\ud83d\udd2d', label: 'Scouting' },
  combat: { emoji: '\u2694\ufe0f', label: 'Combat' },
  social: { emoji: '\ud83e\udd1d', label: 'Social' },
  navigation: { emoji: '\ud83e\udded', label: 'Navigation' },
}

// ============================================================================
// CONTEXTUAL TALK LINES
// ============================================================================

function getContextualLine(
  memberName: string,
  role: PartyRole,
  food: number,
  morale: number,
  personalityQuirk?: string,
): string {
  if (food < 20) {
    const lowFoodLines: Record<string, string> = {
      cook: `"I can stretch what we have, but even I can't cook air. We need supplies."`,
      hunter: `"Point me at the nearest game trail. I'll have us fed by sundown."`,
      medic: `"Starvation weakens the immune system. We're all vulnerable right now."`,
      scout: `"I spotted berry bushes a mile back. Not much, but it's something."`,
      guard: `"Hungry men make poor fighters. We need to fix this, fast."`,
    }
    if (lowFoodLines[role]) return lowFoodLines[role]
  }

  if (morale < 30) {
    const lowMoraleLines: Record<string, string> = {
      cook: `"Tell you what — I'll make my famous trail stew tonight. That always cheers folks up."`,
      diplomat: `"Morale is low. Let me talk to people, smooth things over."`,
      guard: `"Spirits are sagging. I've seen it before. Someone needs to give a speech. Not me."`,
      navigator: `"We're making good progress, even if it doesn't feel like it. Tell the others."`,
      medic: `"Some rest would do everyone good. Even a few hours can lift the spirits."`,
    }
    if (lowMoraleLines[role]) return lowMoraleLines[role]
  }

  if (personalityQuirk) return `"${personalityQuirk}"`

  const genericLines: Record<string, string[]> = {
    scout: [
      `"Weather looks fair tomorrow. Good time to push ahead."`,
      `"I scouted the trail ahead. Clear for now."`,
    ],
    medic: [
      `"Everyone's holding up well enough. For frontier standards, anyway."`,
      `"Drink more water. All of you."`,
    ],
    hunter: [
      `"Saw some tracks earlier. Might be worth a hunting trip."`,
      `"Game's been scarce lately. Might need to change our route."`,
    ],
    mechanic: [
      `"Wagon's holding together. For now. Don't hit any more rocks."`,
      `"I oiled the axles this morning. Should run smoother."`,
    ],
    guard: [
      `"Perimeter's secure. Get some rest."`,
      `"Heard coyotes last night. Nothing to worry about. Probably."`,
    ],
    cook: [
      `"Supper's on in an hour. Don't ask what's in it."`,
      `"I found some wild herbs by the creek. Tonight's gonna be good."`,
    ],
    navigator: [
      `"We're on schedule. Maybe even ahead, if the weather holds."`,
      `"I've been studying the maps. There might be a shortcut."`,
    ],
    diplomat: [
      `"If we meet anyone, let me do the talking."`,
      `"Word is there's a trading post up ahead. I'll negotiate."`,
    ],
    companion: [
      `"Nice night for a campfire."`,
      `"You know, this trail isn't as bad as they say. Well, mostly."`,
    ],
    leader: [
      `"We'll make it. I didn't come this far to stop now."`,
      `"How's everyone holding up?"`,
    ],
  }

  const roleLines = genericLines[role] || genericLines.companion || ['"..."']
  return roleLines[Math.floor(Math.random() * roleLines.length)]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CampMenu({ isOpen, onClose }: CampMenuProps) {
  const { state } = useOregonTrail()
  const { balance, canAfford, spendNeutral } = useKarmaWallet()
  const narrator = useNarrator()

  const [tab, setTab] = useState<'services' | 'party' | 'talk'>('services')
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [floatingEffect, setFloatingEffect] = useState<{
    value: number
    type: 'gain' | 'cost' | 'karma'
  } | null>(null)
  const [talkTarget, setTalkTarget] = useState<string | null>(null)
  const [talkLine, setTalkLine] = useState<string | null>(null)

  // Auto-dismiss talk bubble
  useEffect(() => {
    if (!talkLine) return
    const timer = setTimeout(() => {
      setTalkLine(null)
      setTalkTarget(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [talkLine])

  // Clear floating effect
  useEffect(() => {
    if (!floatingEffect) return
    const timer = setTimeout(() => setFloatingEffect(null), 900)
    return () => clearTimeout(timer)
  }, [floatingEffect])

  const handleUseService = useCallback(
    async (service: PartyService, member: typeof state.party[number]) => {
      const tier = getCostTier(member.loyalty, member.isHired)
      const adjustedCost = Math.ceil(service.baseCost * COST_MULTIPLIERS[tier])

      if (adjustedCost > 0 && !canAfford('neutral', adjustedCost)) {
        playSFX('fail')
        setResultMessage(`Not enough karma. Need ${adjustedCost} neutral karma.`)
        return
      }

      if (cooldowns[service.id] && cooldowns[service.id] > 0) {
        playSFX('fail')
        setResultMessage(`${service.name} is on cooldown for ${cooldowns[service.id]} more day(s).`)
        return
      }

      // Spend karma
      if (adjustedCost > 0) {
        const success = await spendNeutral(adjustedCost, `Camp service: ${service.name}`)
        if (!success) {
          playSFX('fail')
          setResultMessage('Transaction failed.')
          return
        }
      }

      playSFX('success')

      // Set cooldown
      if (service.cooldownDays > 0) {
        setCooldowns((prev) => ({ ...prev, [service.id]: service.cooldownDays }))
      }

      // Show effects
      const effects = service.effects
      if (effects.healthDelta) {
        setFloatingEffect({ value: effects.healthDelta, type: 'gain' })
      } else if (effects.moraleDelta) {
        setFloatingEffect({ value: effects.moraleDelta, type: 'gain' })
      } else if (effects.wagonRepair) {
        setFloatingEffect({ value: effects.wagonRepair, type: 'gain' })
      } else if (effects.foodGain) {
        setFloatingEffect({ value: effects.foodGain, type: 'gain' })
      }

      // Show narrator comment or generic result
      setResultMessage(
        service.narratorComment || `${member.name} performed ${service.name} successfully.`,
      )
    },
    [canAfford, cooldowns, spendNeutral],
  )

  const handleTalk = useCallback(
    (member: typeof state.party[number]) => {
      const posseDef = member.posseMemberId
        ? POSSE_MEMBERS.find((p) => p.id === member.posseMemberId)
        : undefined
      const line = getContextualLine(
        member.name,
        member.role,
        state.food,
        state.morale,
        posseDef?.personalityQuirk,
      )
      setTalkTarget(member.id)
      setTalkLine(line)
      playSFX('click')
    },
    [state.food, state.morale, state.party],
  )

  if (!isOpen) return null

  const membersWithRoles = state.party.filter(
    (m) => m.role && m.role !== 'companion' && m.role !== 'leader',
  )

  // Group services by category for the services tab
  const servicesByCategory: Record<string, { service: PartyService; provider: typeof state.party[number] }[]> = {}
  for (const member of membersWithRoles) {
    const services = getServicesForRole(member.role)
    for (const service of services) {
      if (!servicesByCategory[service.category]) {
        servicesByCategory[service.category] = []
      }
      servicesByCategory[service.category].push({ service, provider: member })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800 bg-stone-900/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u26fa'}</span>
            <div>
              <h2 className="font-pixel text-amber-200 text-sm">Make Camp</h2>
              <p className="text-amber-400/60 text-[10px] font-pixel">
                Day {state.day} {'\u2022'} {state.currentLandmark}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSFX('click')
              onClose()
            }}
            className="font-pixel text-amber-400 text-xs border border-amber-700 px-2 py-1 rounded hover:bg-amber-900/30"
          >
            [X]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-800">
          {(['services', 'party', 'talk'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                playSFX('click')
              }}
              className={`flex-1 font-pixel text-[10px] py-2 uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'text-amber-200 bg-amber-900/40 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              {t === 'services' ? 'Services' : t === 'party' ? 'Party Status' : 'Companion Talk'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── SERVICES TAB ─────────────────────────────────────────── */}
          {tab === 'services' && (
            <div className="space-y-4">
              {membersWithRoles.length === 0 && (
                <p className="font-pixel text-amber-400/60 text-xs text-center py-8">
                  No party members with service roles. Recruit specialists at towns.
                </p>
              )}

              {Object.entries(servicesByCategory).map(([category, entries]) => {
                const header = CATEGORY_HEADERS[category] || {
                  emoji: '\u2699\ufe0f',
                  label: category,
                }
                return (
                  <div key={category}>
                    <h3 className="font-pixel text-amber-300 text-xs mb-2">
                      {header.emoji} {header.label}
                    </h3>
                    <div className="space-y-2">
                      {entries.map(({ service, provider }) => {
                        const tier = getCostTier(provider.loyalty, provider.isHired)
                        const adjustedCost = Math.ceil(
                          service.baseCost * COST_MULTIPLIERS[tier],
                        )
                        const onCooldown = (cooldowns[service.id] || 0) > 0
                        const loyaltyTooLow =
                          service.loyaltyRequirement &&
                          provider.loyalty !== undefined &&
                          provider.loyalty < service.loyaltyRequirement
                        const disabled = onCooldown || !!loyaltyTooLow

                        return (
                          <div
                            key={`${service.id}-${provider.id}`}
                            className={`border rounded p-2 transition-colors ${
                              disabled
                                ? 'border-stone-700 opacity-50'
                                : 'border-amber-800 hover:border-amber-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{service.emoji}</span>
                                <div>
                                  <span className="font-pixel text-amber-200 text-xs">
                                    {service.name}
                                  </span>
                                  <span className="text-amber-400/50 text-[10px] ml-2">
                                    via {provider.emoji || '\ud83e\udd20'} {provider.name}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {adjustedCost > 0 && (
                                  <span className="font-pixel text-[10px] text-amber-400">
                                    {'\ud83c\udf2e'}{adjustedCost}
                                  </span>
                                )}
                                {adjustedCost === 0 && (
                                  <span className="font-pixel text-[10px] text-emerald-400">
                                    FREE
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-amber-400/60 text-[10px] mt-1">
                              {service.description}
                            </p>

                            {/* Effect preview */}
                            <div className="flex items-center gap-3 mt-1 text-[10px]">
                              {service.effects.healthDelta && (
                                <span className="text-green-400">
                                  +{service.effects.healthDelta} HP
                                </span>
                              )}
                              {service.effects.moraleDelta && (
                                <span className="text-blue-400">
                                  +{service.effects.moraleDelta} Morale
                                </span>
                              )}
                              {service.effects.wagonRepair && (
                                <span className="text-orange-400">
                                  +{service.effects.wagonRepair} Wagon
                                </span>
                              )}
                              {service.effects.foodGain && (
                                <span className="text-yellow-400">
                                  +{service.effects.foodGain} Food
                                </span>
                              )}
                              {service.effects.scoutReveal && (
                                <span className="text-cyan-400">Reveals Ahead</span>
                              )}
                              {service.effects.shopDiscount && (
                                <span className="text-purple-400">
                                  -{service.effects.shopDiscount}% Prices
                                </span>
                              )}
                            </div>

                            {/* Cooldown / Loyalty warning */}
                            {onCooldown && (
                              <p className="text-red-400/70 text-[10px] mt-1 font-pixel">
                                Cooldown: {cooldowns[service.id]}d remaining
                              </p>
                            )}
                            {loyaltyTooLow && (
                              <p className="text-red-400/70 text-[10px] mt-1 font-pixel">
                                Loyalty too low (need {service.loyaltyRequirement})
                              </p>
                            )}

                            {/* Use button */}
                            {!disabled && (
                              <button
                                onClick={() => handleUseService(service, provider)}
                                className="mt-2 font-pixel text-[10px] text-stone-950 bg-amber-600 px-3 py-1 rounded hover:bg-amber-500 transition-colors"
                              >
                                [USE]
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── PARTY STATUS TAB ─────────────────────────────────────── */}
          {tab === 'party' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.party.map((member) => {
                const posseDef = member.posseMemberId
                  ? POSSE_MEMBERS.find((p) => p.id === member.posseMemberId)
                  : undefined

                return (
                  <div
                    key={member.id}
                    className="border border-amber-800 rounded p-3 bg-stone-900/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{member.emoji || '\ud83e\udd20'}</span>
                      <div>
                        <span className="font-pixel text-amber-200 text-xs">{member.name}</span>
                        <span className="ml-2 font-pixel text-[10px] text-amber-400/60 uppercase bg-amber-900/40 px-1.5 py-0.5 rounded">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Health bar */}
                    <div className="mb-1">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-amber-400/60 font-pixel">Health</span>
                        <span className="text-amber-200 font-pixel">{member.health}/100</span>
                      </div>
                      <div className="w-full h-2 bg-stone-800 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-700 ${
                            member.health > 60
                              ? 'bg-green-500'
                              : member.health > 30
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${member.health}%` }}
                        />
                      </div>
                    </div>

                    {/* Loyalty bar (hired members only) */}
                    {member.isHired && member.loyalty !== undefined && (
                      <div className="mb-1">
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-amber-400/60 font-pixel">Loyalty</span>
                          <span className="text-amber-200 font-pixel">
                            {member.loyalty}/100 {'\u2192'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-800 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-700 ${
                              member.loyalty > 60
                                ? 'bg-blue-500'
                                : member.loyalty > 30
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${member.loyalty}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Sickness indicator */}
                    {member.isSick && (
                      <p className="text-red-400 text-[10px] font-pixel mt-1">
                        {'\ud83e\udd12'} {member.sicknessType || 'Ill'}{' '}
                        {member.daysUntilRecovery
                          ? `(${member.daysUntilRecovery}d)`
                          : ''}
                      </p>
                    )}

                    {/* Personality quirk */}
                    {posseDef?.personalityQuirk && (
                      <p className="text-amber-400/40 text-[10px] italic mt-1">
                        &ldquo;{posseDef.personalityQuirk}&rdquo;
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── COMPANION TALK TAB ───────────────────────────────────── */}
          {tab === 'talk' && (
            <div className="space-y-4">
              <p className="font-pixel text-amber-400/60 text-[10px] text-center mb-4">
                Click a companion to hear what they have to say.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                {state.party.map((member) => {
                  const isActive = talkTarget === member.id
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleTalk(member)}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        isActive ? 'scale-110' : 'hover:scale-105'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-colors ${
                          isActive
                            ? 'border-amber-400 bg-amber-900/40 ring-2 ring-amber-400/50'
                            : 'border-amber-700 bg-stone-800 hover:border-amber-500'
                        }`}
                      >
                        {member.emoji || '\ud83e\udd20'}
                      </div>
                      <span className="font-pixel text-[10px] text-amber-300">{member.name}</span>
                      <span className="font-pixel text-[8px] text-amber-400/40 uppercase">
                        {member.role}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Dialogue bubble */}
              {talkLine && (
                <div
                  className="mt-6 bg-stone-900 border border-amber-700 rounded-lg p-4 relative cursor-pointer"
                  onClick={() => {
                    setTalkLine(null)
                    setTalkTarget(null)
                  }}
                >
                  <DOSMessage text={talkLine} speed={25} sfxEvery={0} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result message bar */}
        {resultMessage && (
          <div className="relative border-t border-amber-800 bg-stone-900/80 px-4 py-3">
            {floatingEffect && (
              <FloatingNumber value={floatingEffect.value} type={floatingEffect.type} />
            )}
            <DOSMessage
              text={resultMessage}
              speed={15}
              sfxEvery={0}
              onComplete={() => {
                setTimeout(() => setResultMessage(null), 3000)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
