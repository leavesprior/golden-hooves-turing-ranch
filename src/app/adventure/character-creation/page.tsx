'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PixelNavigation } from '@/components/pixel'
import { ZeroSumPicker } from '@/components/adventure/ZeroSumPicker'
import {
  CharacterProvider,
  useCharacter,
  BACKGROUND_DESCRIPTIONS,
  type CharacterBackground,
  type SaddleStats,
  type StatName,
} from '@/app/oregon-trail/characterContext'
import { STARTING_PICKS, getPickById } from '@/app/adventure/data/advantages'

type Step = 'name' | 'background' | 'picks' | 'tags' | 'review'

const ALL_STATS: StatName[] = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']

const STAT_TAG_HINT: Record<StatName, string> = {
  Shrewdness: 'Notice clues, see through lies.',
  Agility: 'Win chases. Dodge blows.',
  Durability: 'Soak damage. Resist illness.',
  Diplomacy: 'Persuade. Recruit. Haggle.',
  Luck: 'Gold finds you. Dice favor you.',
  Expertise: 'Tracking, repair, trail craft.',
}

const STAT_DISPLAY: Record<StatName, { name: string; icon: string; color: string }> = {
  Shrewdness: { name: 'Shrewdness', icon: '\uD83D\uDD0D', color: '#a78bfa' },
  Agility: { name: 'Agility', icon: '\u26A1', color: '#60a5fa' },
  Durability: { name: 'Durability', icon: '\uD83D\uDEE1\uFE0F', color: '#f87171' },
  Diplomacy: { name: 'Diplomacy', icon: '\uD83E\uDD1D', color: '#34d399' },
  Luck: { name: 'Luck', icon: '\uD83C\uDF40', color: '#fbbf24' },
  Expertise: { name: 'Expertise', icon: '\uD83C\uDF32', color: '#fb923c' },
}

function CharacterCreationContent() {
  const router = useRouter()
  const { createCharacter, getBackgroundBonuses } = useCharacter()
  const [step, setStep] = useState<Step>('name')
  const [characterName, setCharacterName] = useState('')
  const [selectedBackground, setSelectedBackground] = useState<CharacterBackground | null>(null)
  const [selectedPicks, setSelectedPicks] = useState<string[]>([])
  const [pickMods, setPickMods] = useState<Partial<SaddleStats>>({})
  // Phase 5 — up-to-2 tagged stats (Krondor-style, tagged stats grow faster).
  const [taggedStats, setTaggedStats] = useState<StatName[]>([])

  const handleConfirmPicks = useCallback((ids: string[], mods: Partial<SaddleStats>) => {
    setSelectedPicks(ids)
    setPickMods(mods)
    setStep('tags')
  }, [])

  const toggleTag = useCallback((stat: StatName) => {
    setTaggedStats(prev => {
      if (prev.includes(stat)) return prev.filter(s => s !== stat)
      if (prev.length >= 2) return prev // cap at 2
      return [...prev, stat]
    })
  }, [])

  const handleCreateCharacter = useCallback(() => {
    if (!selectedBackground || !characterName) return
    // Create character with the Oregon Trail characterContext
    createCharacter(characterName, selectedBackground)
    // Store pick selections + tagged stats in localStorage for the adventure system to apply
    const adventureData = {
      picks: selectedPicks,
      pickModifiers: pickMods,
      specialAbilities: selectedPicks
        .map(id => getPickById(id))
        .filter(p => p?.specialAbility)
        .map(p => ({ id: p!.id, name: p!.name, ability: p!.specialAbility! })),
      // Phase 5 — tagged stats get a 1.5x (solo) or 1.25x (paired) usage boost.
      taggedStats,
    }
    localStorage.setItem('bobr_adventure_picks', JSON.stringify(adventureData))
    // Navigate to play
    router.push('/adventure/play')
  }, [selectedBackground, characterName, selectedPicks, pickMods, taggedStats, createCharacter, router])

  // Calculate final stats for review
  const getFinalStats = (): Partial<SaddleStats> => {
    if (!selectedBackground) return {}
    const bgBonuses = getBackgroundBonuses(selectedBackground)
    const final: Partial<SaddleStats> = {}
    const allStats: StatName[] = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']
    for (const stat of allStats) {
      const base = 8 // Base stat
      const bg = bgBonuses[stat] ?? 0
      const picks = pickMods[stat] ?? 0
      final[stat] = base + bg + picks
    }
    return final
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mb-1">
            FORGE YOUR DESTINY
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
            Every choice shapes who you are. Every pick costs something.
          </p>
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {(['name', 'background', 'picks', 'tags', 'review'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 flex items-center justify-center border-2 font-[var(--font-pixel)] text-[10px] ${
                  step === s
                    ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                    : (['name', 'background', 'picks', 'tags', 'review'].indexOf(step) > i)
                      ? 'bg-[var(--pixel-forest-dark)] border-[var(--pixel-forest-mid)] text-[var(--pixel-forest-light)]'
                      : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]'
                }`}>
                  {(['name', 'background', 'picks', 'tags', 'review'].indexOf(step) > i) ? '\u2713' : i + 1}
                </div>
                {i < 4 && <div className="w-4 h-0.5 bg-[var(--pixel-ui-border)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* === STEP 1: NAME === */}
        {step === 'name' && (
          <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6">
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] mb-4">
              WHAT IS YOUR NAME, TRAVELER?
            </h2>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-3 font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] placeholder:text-[var(--pixel-ui-text)]/30 focus:border-[var(--pixel-gold-mid)] outline-none"
            />
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-2">
              This name will follow you through five chapters of Gold Country history.
            </p>
            <button
              onClick={() => characterName.trim() && setStep('background')}
              disabled={!characterName.trim()}
              className={`w-full mt-4 py-3 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
                characterName.trim()
                  ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)]'
                  : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] opacity-40 cursor-not-allowed'
              }`}
            >
              CONTINUE {'\u2192'}
            </button>
          </div>
        )}

        {/* === STEP 2: BACKGROUND === */}
        {step === 'background' && (
          <div className="space-y-3">
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] text-center mb-2">
              CHOOSE YOUR BACKGROUND
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center opacity-60 mb-4">
              Your past shapes your present. Each background grants +2 to two S.A.D.D.L.E. stats.
            </p>

            <div className="grid gap-2">
              {(Object.entries(BACKGROUND_DESCRIPTIONS) as [CharacterBackground, typeof BACKGROUND_DESCRIPTIONS[CharacterBackground]][]).map(
                ([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedBackground(id)}
                    className={`text-left p-3 border-2 transition-all ${
                      selectedBackground === id
                        ? 'bg-[var(--pixel-gold-dark)]/40 border-[var(--pixel-gold-mid)]'
                        : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {selectedBackground === id && <span className="text-[var(--pixel-gold-light)]">{'\u25B6'}</span>}
                      <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                        {info.name}
                      </span>
                    </div>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70">
                      {info.description}
                    </p>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] mt-1">
                      {info.bonuses}
                    </p>
                  </button>
                )
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('name')}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]"
              >
                {'\u2190'} BACK
              </button>
              <button
                onClick={() => selectedBackground && setStep('picks')}
                disabled={!selectedBackground}
                className={`flex-1 py-3 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
                  selectedBackground
                    ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)]'
                    : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] opacity-40 cursor-not-allowed'
                }`}
              >
                CONTINUE {'\u2192'}
              </button>
            </div>
          </div>
        )}

        {/* === STEP 3: ZERO-SUM PICKS === */}
        {step === 'picks' && (
          <div>
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] text-center mb-2">
              SPEND YOUR PICKS
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center opacity-60 mb-4">
              {STARTING_PICKS} picks to spend. Advantages cost picks. Flaws grant picks.
              Every advantage has a price. There is no perfect build.
            </p>
            <ZeroSumPicker
              onConfirm={handleConfirmPicks}
              onBack={() => setStep('background')}
            />
          </div>
        )}

        {/* === STEP 4: TAG UP TO 2 STATS === */}
        {step === 'tags' && (
          <div className="space-y-3">
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] text-center mb-2">
              TAG UP TO 2 STATS
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center opacity-60 mb-4">
              Tagged stats grow faster from use. Pick 1 for a 1.5x boost, or 2 for 1.25x each.
              Untagged stats still grow, just slower. You can skip this step.
            </p>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-mid)] text-center opacity-80 mb-4">
              {taggedStats.length}/2 tags selected
            </p>

            <div className="grid grid-cols-2 gap-2">
              {ALL_STATS.map(stat => {
                const isTagged = taggedStats.includes(stat)
                const atCap = !isTagged && taggedStats.length >= 2
                const display = STAT_DISPLAY[stat]
                return (
                  <button
                    key={stat}
                    onClick={() => toggleTag(stat)}
                    disabled={atCap}
                    className={`p-3 text-left transition-all ${
                      isTagged
                        ? 'bg-[var(--pixel-gold-dark)]/40 border-[3px] border-[var(--pixel-gold-light)]'
                        : atCap
                          ? 'bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] opacity-30 cursor-not-allowed'
                          : 'bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{display.icon}</span>
                      <span
                        className="font-[var(--font-pixel)] text-[10px]"
                        style={{ color: display.color }}
                      >
                        {stat}
                      </span>
                      {isTagged && (
                        <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] ml-auto">
                          TAGGED
                        </span>
                      )}
                    </div>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70">
                      {STAT_TAG_HINT[stat]}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('picks')}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]"
              >
                ← BACK
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)] transition-all"
              >
                {taggedStats.length === 0 ? 'SKIP →' : 'CONTINUE →'}
              </button>
            </div>
          </div>
        )}

        {/* === STEP 5: REVIEW === */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] text-center mb-2">
              REVIEW YOUR CHARACTER
            </h2>

            {/* Character Summary */}
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-4">
              <h3 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)] text-center mb-1">
                {characterName}
              </h3>
              <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] text-center mb-4 opacity-70">
                {selectedBackground && BACKGROUND_DESCRIPTIONS[selectedBackground].name}
              </p>

              {/* Stats Grid — tagged stats get a gold border */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {(Object.entries(getFinalStats()) as [StatName, number][]).map(([stat, value]) => {
                  const isTagged = taggedStats.includes(stat)
                  return (
                    <div
                      key={stat}
                      className={`bg-[var(--pixel-bg-dark)] p-2 text-center ${
                        isTagged
                          ? 'border-[3px] border-[var(--pixel-gold-light)]'
                          : 'border border-[var(--pixel-ui-border)]'
                      }`}
                    >
                      <span className="text-sm">{STAT_DISPLAY[stat].icon}</span>
                      <p className="font-[var(--font-pixel)] text-[10px]" style={{ color: STAT_DISPLAY[stat].color }}>
                        {stat}
                        {isTagged && ' ★'}
                      </p>
                      <p className="font-[var(--font-pixel)] text-[16px] text-[var(--pixel-ui-text)]">
                        {value}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Selected Picks */}
              {selectedPicks.length > 0 && (
                <div>
                  <h4 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-2">
                    TRAITS
                  </h4>
                  <div className="space-y-1">
                    {selectedPicks.map(id => {
                      const pick = getPickById(id)
                      if (!pick) return null
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className={`font-[var(--font-pixel)] text-[9px] ${
                            pick.cost > 0 ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-fire-orange)]'
                          }`}>
                            {pick.cost > 0 ? '+' : ''}{pick.name}
                          </span>
                          {pick.specialAbility && (
                            <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)]">
                              ({pick.specialAbility})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('tags')}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
              >
                {'\u2190'} CHANGE TAGS
              </button>
              <button
                onClick={handleCreateCharacter}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)] transition-all"
              >
                BEGIN ADVENTURE {'\u25B6'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CharacterCreationPage() {
  return (
    <CharacterProvider>
      <CharacterCreationContent />
    </CharacterProvider>
  )
}
