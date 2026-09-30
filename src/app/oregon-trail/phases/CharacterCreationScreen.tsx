'use client'

import React, { useState, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import {
  useCharacter,
  BACKGROUND_BONUSES,
  BACKGROUND_DESCRIPTIONS,
  BASE_STATS,
  withBackgroundBonuses,
  type StatName,
  type CharacterBackground,
} from '../characterContext'
import { useNarrator } from '../narratorContext'
import { KarmaToastContainer } from '@/components/karma'
import { NarratorOverlay } from '../components/NarratorOverlay'
import { creationBonusPoints, isKidMode } from '@/lib/gftAgeMode'
import { applySaddleAdjust } from '@/lib/gftSaddleAdjust'
import { PlayerPortrait } from '../components/PlayerPortrait'
import { editorialForLandmark } from '@/lib/californiaTrailArt'

export function CharacterCreationScreen() {
  const { state: trailState, beginJourney } = useOregonTrail()
  const { state: charState, createCharacter, getStat } = useCharacter()
  const { comment } = useNarrator()

  // Dice roll state
  const [hasRolled, setHasRolled] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [baseStats, setBaseStats] = useState({ ...BASE_STATS })
  const [lastRolls, setLastRolls] = useState<Record<string, number[]>>({})
  const [isRolling, setIsRolling] = useState(false)

  // Local state for character creation
  const [selectedBackground, setSelectedBackground] = useState<CharacterBackground | null>(null)
  const [statPoints, setStatPoints] = useState({ ...BASE_STATS })
  const [pointsRemaining, setPointsRemaining] = useState(() => creationBonusPoints(false))
  const [kidTrail, setKidTrail] = useState(false)
  const statsRef = React.useRef(statPoints)
  const remainingRef = React.useRef(pointsRemaining)
  statsRef.current = statPoints
  remainingRef.current = pointsRemaining

  useEffect(() => {
    setKidTrail(isKidMode())
    const n = creationBonusPoints(false)
    setPointsRemaining(n)
    remainingRef.current = n
  }, [])

  // Roll 3d6 for each stat (like classic D&D)
  const rollDice = () => {
    setIsRolling(true)
    setRollCount(prev => prev + 1)

    // Animate the roll
    let iterations = 0
    const maxIterations = 10
    const interval = setInterval(() => {
      const tempStats: Record<string, number> = {}
      const tempRolls: Record<string, number[]> = {}

      const statNames = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']
      statNames.forEach(stat => {
        const dice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]
        tempRolls[stat] = dice
        tempStats[stat] = dice.reduce((a, b) => a + b, 0)
      })

      setLastRolls(tempRolls)
      setBaseStats(tempStats as typeof baseStats)

      iterations++
      if (iterations >= maxIterations) {
        clearInterval(interval)
        setIsRolling(false)
        setHasRolled(true)

        // Reset bonus points to 0 (base stats from roll are the foundation)
        setStatPoints(tempStats as typeof statPoints)
        const rolledPts = creationBonusPoints(true)
        setPointsRemaining(rolledPts)
        statsRef.current = tempStats as typeof statPoints
        remainingRef.current = rolledPts
      }
    }, 80)
  }

  // Calculate total stat value
  const getTotalStats = () => {
    return Object.values(statPoints).reduce((a, b) => a + b, 0)
  }

  // Convert BACKGROUND_DESCRIPTIONS to array format
  const backgrounds = Object.entries(BACKGROUND_DESCRIPTIONS).map(([id, data]) => ({
    id: id as CharacterBackground,
    ...data,
  }))

  const adjustStat = (stat: StatName, delta: number) => {
    const minValue = hasRolled ? baseStats[stat] : BASE_STATS[stat]
    const next = applySaddleAdjust(statsRef.current, remainingRef.current, stat, delta, minValue)
    if (!next) return
    statsRef.current = next.stats
    remainingRef.current = next.remaining
    setStatPoints(next.stats)
    setPointsRemaining(next.remaining)
  }

  const spendEven = () => {
    const order: StatName[] = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']
    let i = 0
    while (remainingRef.current > 0 && i < 48) {
      const stat = order[i % order.length]
      const minValue = hasRolled ? baseStats[stat] : BASE_STATS[stat]
      const next = applySaddleAdjust(statsRef.current, remainingRef.current, stat, 1, minValue)
      i += 1
      if (!next) continue
      statsRef.current = next.stats
      remainingRef.current = next.remaining
    }
    setStatPoints({ ...statsRef.current })
    setPointsRemaining(remainingRef.current)
  }

  const handleFinalize = () => {
    if (remainingRef.current !== 0 || !selectedBackground) return

    // Create the character with the selected background
    const leaderName = trailState.party.find(m => m.role === 'leader')?.name || 'Agent'
    // #16: hand the exact on-screen stat block to createCharacter via its
    // statsOverride param, so the character the player BUILDS is the character
    // they PLAY. The old path called modifyStat() in a loop right after
    // createCharacter(), but modifyStat guards on state.character from THIS
    // render's closure — still null until the create commits — so every
    // adjustment silently no-oped and only background defaults (base 5 +
    // background bonuses, e.g. Pinkerton 7/5/5/5/5/7) ever landed in the
    // character sheet, bobr_ot_character, and skill-check DCs.
    // One finalized object feeds both the saved character and the trail snapshot.
    // getStat() here would still see the previous render's character.
    const finalizedStats = withBackgroundBonuses(statsRef.current, selectedBackground)
    createCharacter(leaderName, selectedBackground, finalizedStats)

    if (hasRolled && getTotalStats() >= 70) {
      comment("The dice favor the bold, pardner. The persistent, they merely tolerate.", 'observation')
    } else if (hasRolled) {
      comment("The frontier takes all rolls. Some folks just have to shovel harder.", 'observation')
    } else {
      comment("Another hero bound for 1849 to bring justice to the frontier. The frontier has been warned.", 'observation')
    }
    beginJourney(finalizedStats)
  }

  const statDescriptions: Record<StatName, string> = {
    Shrewdness: 'Deduction, clue interpretation',
    Agility: 'Speed, hunting, river crossings',
    Durability: 'Health, disease resistance',
    Diplomacy: 'NPC interactions, fair trades',
    Luck: 'Random events, gold finding',
    Expertise: 'Tracking, survival, repair',
  }

  // Same Independence still and grade as the outfitters (continuity doc §6: one western look).
  const still = editorialForLandmark('Independence, Missouri') || '/place-art/editorial/independence.jpg'

  return (
    <div className="relative min-h-screen pb-28">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="pointer-events-none fixed inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={still} alt="" className="h-full w-full object-cover object-[center_38%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8">
        <header className="mb-6">
          <p className="west-face-eyebrow">First camp · Independence, Missouri</p>
          <h1 className="west-face-title mt-2">Swear In Your Agent</h1>
          <p className="west-face-body mt-2">
            Saddle up your S.A.D.D.L.E. stats{kidTrail ? ' · kid trail' : ' · adult warrant'}
          </p>
        </header>

        {/* Background Selection */}
        <div className="west-face-paper mb-6">
          <h2 className="west-face-eyebrow mb-4">Choose Your Past</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {backgrounds.map(bg => (
              <button
                key={bg.id}
                type="button"
                data-testid={`saddle-background-${bg.id}`}
                onClick={() => setSelectedBackground(bg.id)}
                aria-pressed={selectedBackground === bg.id}
                className={`flex items-start gap-3 p-4 md:p-3 rounded-xl border text-left transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--west-cream)] ${
                  selectedBackground === bg.id
                    ? 'bg-[var(--west-cream)] border-transparent text-[var(--west-cream-ink)]'
                    : 'bg-[var(--west-pill)] border-[var(--west-line)] text-[var(--west-ink)] hover:border-[var(--west-muted)]'
                }`}
              >
                <PlayerPortrait background={bg.id} name={bg.name} width={48} />
                <span className="min-w-0">
                  <span className="font-serif text-base md:text-sm">{bg.name}</span>
                  <span className="block font-serif text-sm md:text-xs mt-1 opacity-80">{bg.description}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="west-face-footer mt-3">Fictional adult portraits {'\u2014'} no real folks sat for these daguerreotypes.</p>
        </div>

        {/* Dice Roll Section */}
        <div className="west-face-paper mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="west-face-eyebrow">{'\uD83C\uDFB2'} Roll the Bones</h2>
            {hasRolled && (
              <span className="font-serif text-xs text-[var(--west-muted)]">
                Total: {getTotalStats()} | Rolls: {rollCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              data-testid="saddle-roll"
              onClick={rollDice}
              disabled={isRolling}
              className={`west-face-pill flex-1 min-h-11! text-center transition-all active:scale-[0.98] ${
                isRolling ? 'animate-pulse' : ''
              }`}
            >
              {isRolling ? '\uD83C\uDFB2 Rolling...' : hasRolled ? '\uD83C\uDFB2 Reroll Stats (3d6)' : '\uD83C\uDFB2 Roll Stats (3d6 each)'}
            </button>
            {pointsRemaining > 0 && (
              <button
                type="button"
                data-testid="saddle-standard"
                onClick={spendEven}
                className="west-face-pill min-h-11! text-center"
              >
                Spend remaining evenly
              </button>
            )}
          </div>

          {/* Show dice results */}
          {hasRolled && Object.keys(lastRolls).length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as StatName[]).map(stat => {
                const dice = lastRolls[stat] || [0, 0, 0]
                const total = dice.reduce((a, b) => a + b, 0)
                const isGoodRoll = total >= 12
                const isBadRoll = total <= 8

                return (
                  <div key={stat} className={`flex items-center gap-2 px-2 py-1 rounded ${
                    isGoodRoll ? 'bg-green-900/40' : isBadRoll ? 'bg-red-900/40' : 'bg-[var(--west-pill)]'
                  }`}>
                    <span className="text-[var(--west-ink)] w-8">{stat.charAt(0)}.</span>
                    <span className="text-[var(--west-muted)]">
                      [{dice.map((d, i) => (
                        <span key={i} className={d === 6 ? 'text-green-400' : d === 1 ? 'text-red-400' : ''}>
                          {d}{i < 2 ? '+' : ''}
                        </span>
                      ))}]
                    </span>
                    <span className={`font-pixel ml-auto ${
                      isGoodRoll ? 'text-green-400' : isBadRoll ? 'text-red-400' : 'text-[var(--west-ink)]'
                    }`}>
                      = {total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {!hasRolled && (
            <p className="west-face-footer text-center">
              Standard: 5 base + background + {creationBonusPoints(false)} points. Rolled: 3d6 + background + {creationBonusPoints(true)}.
            </p>
          )}
        </div>

        {/* Stat Distribution */}
        <div className="west-face-paper mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="west-face-eyebrow">S.A.D.D.L.E. Stats</h2>
            <span className={`font-serif text-sm ${pointsRemaining > 0 ? 'text-amber-100/80' : 'text-[var(--west-cream)]'}`}>
              Bonus Points: {pointsRemaining}
            </span>
          </div>

          <div className="space-y-3">
            {(['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as StatName[]).map(stat => {
              const bonus = selectedBackground ? (BACKGROUND_BONUSES[selectedBackground][stat] || 0) : 0
              const value = statPoints[stat]
              const shown = Math.min(18, value + bonus)
              const baseValue = hasRolled ? baseStats[stat] : BASE_STATS[stat]

              return (
                <div key={stat} className="flex items-center gap-2 md:gap-3">
                  <div className="w-20 md:w-24">
                    <span className="text-[#f3ead8] text-sm md:text-xs font-serif">{stat.charAt(0)}</span>
                    <span className="text-[var(--west-muted)] text-sm md:text-xs font-serif">. {stat.slice(1)}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => adjustStat(stat, -1)}
                      disabled={value <= baseValue}
                      className="w-11 h-11 md:w-7 md:h-7 text-lg md:text-base bg-[var(--west-pill)] text-[var(--west-ink)] border border-[var(--west-line)] rounded-full disabled:opacity-30 active:opacity-80"
                    >-</button>
                    <div className="flex-1 h-3 md:h-2 bg-[var(--west-line)] rounded-full overflow-hidden relative">
                      {/* Base value indicator */}
                      {hasRolled && (
                        <div
                          className="absolute h-full bg-[color-mix(in_srgb,var(--west-muted)_45%,transparent)]"
                          style={{ width: `${(baseValue / 18) * 100}%` }}
                        />
                      )}
                      <div
                        className="h-full bg-[var(--west-cream)] transition-all relative"
                        style={{ width: `${(shown / 18) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-center text-[#f3ead8] text-base md:text-sm font-serif">{shown}</span>
                    <button
                      type="button"
                      data-testid={`saddle-plus-${stat}`}
                      onClick={() => adjustStat(stat, 1)}
                      disabled={value >= 18 || pointsRemaining <= 0}
                      className="w-11 h-11 md:w-7 md:h-7 text-lg md:text-base bg-[var(--west-pill)] text-[var(--west-ink)] border border-[var(--west-line)] rounded-full disabled:opacity-30 active:opacity-80"
                    >+</button>
                  </div>
                  <span className="w-32 font-serif text-[var(--west-muted)] text-xs hidden md:block">{statDescriptions[stat]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proceed stays in the iPhone fold above mute. */}
        <button
          type="button"
          data-testid="saddle-begin"
          onClick={handleFinalize}
          disabled={pointsRemaining !== 0 || !selectedBackground}
          className="west-face-pill west-face-pill-cream relative z-10 mt-4 w-full min-h-12! text-center text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {!selectedBackground ? 'Select a background' : pointsRemaining > 0 ? `Assign ${pointsRemaining} more points` : 'Hitch the wagon'}
        </button>
      </div>
    </div>
  )
}
