'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PixelNavigation } from '@/components/pixel'
import { readSharedCharacter } from '@/lib/sharedCharacter'
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

type Step = 'name' | 'background' | 'picks' | 'review'

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
  // Shared character read (never re-ask creation): if any game already has a
  // character, prefill the name and offer to continue instead of re-creating.
  // Creating anyway stays possible — it deliberately replaces the character.
  const [existingName, setExistingName] = useState<string | null>(null)
  useEffect(() => {
    const existing = readSharedCharacter()
    if (existing) {
      setExistingName(existing.name)
      setCharacterName(prev => prev || existing.name)
    }
  }, [])

  // Continuity guard: warn before overwriting an existing character (from The
  // Golden Frog / a prior Tale run). Confirming creation replaces them; the
  // notice offers a one-click path to keep and continue instead.
  const [existingName, setExistingName] = useState<string | null>(null)
  const [dismissedWarning, setDismissedWarning] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bobr_ot_character')
      if (raw) {
        const c = JSON.parse(raw)
        if (c && typeof c.name === 'string' && c.name.trim()) setExistingName(c.name)
      }
    } catch {
      /* no existing character */
    }
  }, [])

  const handleConfirmPicks = useCallback((ids: string[], mods: Partial<SaddleStats>) => {
    setSelectedPicks(ids)
    setPickMods(mods)
    setStep('review')
  }, [])

  // Mirror in-progress selections so picks survive the picker unmounting
  // on any back-nav (step 3 BACK, Review's CHANGE PICKS) — P1-9.
  const handlePicksChange = useCallback((ids: string[], mods: Partial<SaddleStats>) => {
    setSelectedPicks(ids)
    setPickMods(mods)
  }, [])

  const handleCreateCharacter = useCallback(() => {
    if (!selectedBackground || !characterName) return
    // Build the SAME final stats the review screen shows (base 8 + background + picks)
    // and hand them to createCharacter verbatim, so the character the player built
    // is exactly the character they play (no base mismatch, no dropped pick modifiers).
    const bgBonuses = getBackgroundBonuses(selectedBackground)
    const allStats: StatName[] = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']
    const finalStats = allStats.reduce((acc, stat) => {
      acc[stat] = 8 + (bgBonuses[stat] ?? 0) + (pickMods[stat] ?? 0)
      return acc
    }, {} as SaddleStats)
    // Create character with the Oregon Trail characterContext, stats pre-resolved
    // and the chosen picks recorded on the character (B3) so they aren't orphaned.
    createCharacter(characterName, selectedBackground, finalStats, selectedPicks)
    // Store pick selections in localStorage for the adventure system to apply
    const adventureData = {
      picks: selectedPicks,
      pickModifiers: pickMods,
      specialAbilities: selectedPicks
        .map(id => getPickById(id))
        .filter(p => p?.specialAbility)
        .map(p => ({ id: p!.id, name: p!.name, ability: p!.specialAbility! })),
    }
    localStorage.setItem('bobr_adventure_picks', JSON.stringify(adventureData))
    // Navigate to play
    router.push('/adventure/play')
  }, [selectedBackground, characterName, selectedPicks, pickMods, createCharacter, getBackgroundBonuses, router])

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
          <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] opacity-60">
            Every choice shapes who you are. Every pick costs something.
          </p>
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {(['name', 'background', 'picks', 'review'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 flex items-center justify-center border-2 font-[var(--font-pixel)] text-[10px] ${
                  step === s
                    ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                    : (['name', 'background', 'picks', 'review'].indexOf(step) > i)
                      ? 'bg-[var(--pixel-forest-dark)] border-[var(--pixel-forest-mid)] text-[var(--pixel-forest-light)]'
                      : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]'
                }`}>
                  {(['name', 'background', 'picks', 'review'].indexOf(step) > i) ? '\u2713' : i + 1}
                </div>
                {i < 3 && <div className="w-4 h-0.5 bg-[var(--pixel-ui-border)]" />}
              </div>
            ))}
          </div>

          {/* Overwrite warning — you already have a character. */}
          {existingName && !dismissedWarning && (
            <div className="mt-5 border-2 border-[var(--pixel-fire-orange)] bg-[var(--pixel-fire-orange)]/10 p-3 text-left">
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)]">
                You already ride as {existingName}.
              </p>
              <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)] mt-1">
                Forging a new character replaces {existingName} and their stats, karma,
                and reputation. This can&apos;t be undone.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => router.push('/adventure/play')}
                  className="font-[var(--font-pixel)] text-[10px] px-3 py-1.5 border-2 border-[var(--pixel-forest-mid)] bg-[var(--pixel-forest-dark)] text-[var(--pixel-forest-light)]"
                >
                  Keep {existingName} — continue
                </button>
                <button
                  onClick={() => setDismissedWarning(true)}
                  className="font-[var(--font-pixel)] text-[10px] px-3 py-1.5 border-2 border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] text-[var(--pixel-ui-text)]"
                >
                  Start over anyway
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing-character notice — continue instead of re-creating */}
        {existingName && step === 'name' && (
          <div className="bg-[var(--pixel-forest-dark)]/40 border-2 border-[var(--pixel-forest-mid)] p-4 mb-4 text-center">
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)]">
              You already have a character: <span className="text-[var(--pixel-gold-light)]">{existingName}</span>
            </p>
            <button
              onClick={() => router.push('/adventure/play')}
              className="mt-3 w-full py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)] transition-all"
            >
              CONTINUE AS {existingName.toUpperCase()} {'▶'}
            </button>
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] opacity-60 mt-2">
              Or forge a new destiny below — it replaces your current character.
            </p>
          </div>
        )}

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
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] opacity-50 mt-2">
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
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] text-center opacity-60 mb-4">
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
                    <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] opacity-70">
                      {info.description}
                    </p>
                    <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)] mt-1">
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
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] text-center opacity-60 mb-4">
              {STARTING_PICKS} picks to spend. Advantages cost picks. Flaws grant picks.
              Every advantage has a price. There is no perfect build.
            </p>
            <ZeroSumPicker
              initialSelectedIds={selectedPicks}
              onSelectionChange={handlePicksChange}
              onConfirm={handleConfirmPicks}
              onBack={() => setStep('background')}
            />
          </div>
        )}

        {/* === STEP 4: REVIEW === */}
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
              <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] text-center mb-4 opacity-70">
                {selectedBackground && BACKGROUND_DESCRIPTIONS[selectedBackground].name}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {(Object.entries(getFinalStats()) as [StatName, number][]).map(([stat, value]) => (
                  <div key={stat} className="bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] p-2 text-center">
                    <span className="text-sm">{STAT_DISPLAY[stat].icon}</span>
                    <p className="font-[var(--font-pixel)] text-[10px]" style={{ color: STAT_DISPLAY[stat].color }}>
                      {stat}
                    </p>
                    <p className="font-[var(--font-pixel)] text-[16px] text-[var(--pixel-ui-text)]">
                      {value}
                    </p>
                  </div>
                ))}
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
                          <span className={`font-[var(--font-pixel)] text-[12px] ${
                            pick.cost > 0 ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-fire-orange)]'
                          }`}>
                            {pick.cost > 0 ? '+' : ''}{pick.name}
                          </span>
                          {pick.specialAbility && (
                            <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)]">
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
                onClick={() => setStep('picks')}
                className="flex-1 py-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
              >
                {'\u2190'} CHANGE PICKS
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
