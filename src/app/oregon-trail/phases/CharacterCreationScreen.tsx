'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useCharacter, BACKGROUND_DESCRIPTIONS, type StatName, type CharacterBackground } from '../characterContext'
import { useNarrator } from '../narratorContext'
import { KarmaToastContainer } from '@/components/karma'
import { NarratorOverlay } from '../components/NarratorOverlay'

export function CharacterCreationScreen() {
  const { state: trailState, beginJourney } = useOregonTrail()
  const { state: charState, createCharacter, modifyStat, getStat } = useCharacter()
  const { comment } = useNarrator()

  // Dice roll state
  const [hasRolled, setHasRolled] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [baseStats, setBaseStats] = useState({
    Shrewdness: 3,
    Agility: 3,
    Durability: 3,
    Diplomacy: 3,
    Luck: 3,
    Expertise: 3,
  })
  const [lastRolls, setLastRolls] = useState<Record<string, number[]>>({})
  const [isRolling, setIsRolling] = useState(false)

  // Local state for character creation
  const [selectedBackground, setSelectedBackground] = useState<CharacterBackground | null>(null)
  const [statPoints, setStatPoints] = useState({
    Shrewdness: 3,
    Agility: 3,
    Durability: 3,
    Diplomacy: 3,
    Luck: 3,
    Expertise: 3,
  })
  const [pointsRemaining, setPointsRemaining] = useState(12)

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
        setPointsRemaining(6) // Fewer bonus points when rolling (6 instead of 12)
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
    icon: id === 'pinkerton_veteran' ? '\u{1F575}' :
          id === 'frontier_scout' ? '\u{1F3AF}' :
          id === 'army_officer' ? '\u2694\uFE0F' :
          id === 'gambler' ? '\u{1F0CF}' :
          id === 'doctor' ? '\u2695\uFE0F' :
          id === 'preacher' ? '\u271D\uFE0F' :
          id === 'outlaw_reformed' ? '\u{1F3AD}' : '\u{1F464}'
  }))

  const adjustStat = (stat: StatName, delta: number) => {
    const currentValue = statPoints[stat]
    const minValue = hasRolled ? baseStats[stat] : 1
    const maxValue = 18  // Max stat value (like D&D)
    const newValue = currentValue + delta

    if (newValue < minValue || newValue > maxValue) return
    if (delta > 0 && pointsRemaining <= 0) return
    if (delta < 0 && currentValue <= minValue) return

    setStatPoints(prev => ({ ...prev, [stat]: newValue }))
    setPointsRemaining(prev => prev - delta)
  }

  const handleFinalize = () => {
    if (pointsRemaining !== 0 || !selectedBackground) return

    // Create the character with the selected background
    const leaderName = trailState.party.find(m => m.id === 'leader')?.name || 'Agent'
    createCharacter(leaderName, selectedBackground)

    // Apply stat adjustments
    // - Standard allocation: diff from base 3 (UI display value)
    // - Rolled stats: diff from BASE_STATS (5) since we're replacing the base entirely
    Object.entries(statPoints).forEach(([stat, value]) => {
      const base = hasRolled ? 5 : 3  // BASE_STATS is 5, UI default is 3
      const diff = value - base
      if (diff !== 0) {
        modifyStat(stat as StatName, diff)
      }
    })

    if (hasRolled && getTotalStats() >= 70) {
      comment("The dice favor the bold. Or perhaps just the persistent.", 'observation')
    } else if (hasRolled) {
      comment("The frontier accepts all rolls. Some just have to work harder.", 'observation')
    } else {
      comment("Another hero setting off to bring justice to the frontier. How... optimistic.", 'observation')
    }
    beginJourney()
  }

  const statDescriptions: Record<StatName, string> = {
    Shrewdness: 'Deduction, clue interpretation',
    Agility: 'Speed, hunting, river crossings',
    Durability: 'Health, disease resistance',
    Diplomacy: 'NPC interactions, fair trades',
    Luck: 'Random events, gold finding',
    Expertise: 'Tracking, survival, repair',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-gray-900 to-amber-950 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-2xl mx-auto pt-8">
        <header className="text-center mb-8">
          <h1 className="font-pixel text-purple-300 text-xl mb-2">Create Your Agent</h1>
          <p className="text-purple-400 text-sm">Distribute your S.A.D.D.L.E. stats</p>
        </header>

        {/* Background Selection */}
        <div className="bg-gray-900/80 border-2 border-purple-600 rounded-lg p-4 mb-6">
          <h2 className="font-pixel text-purple-300 text-sm mb-4">Choose Background</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {backgrounds.map(bg => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-4 md:p-3 rounded border-2 text-left transition-all active:scale-[0.98] ${
                  selectedBackground === bg.id
                    ? 'bg-purple-900/60 border-purple-400 text-purple-200'
                    : 'bg-gray-800/60 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl md:text-lg mr-2">{bg.icon}</span>
                <span className="font-pixel text-sm md:text-xs">{bg.name}</span>
                <p className="text-xs md:text-[10px] mt-1 opacity-70">{bg.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dice Roll Section */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-pixel text-amber-300 text-sm">{'\uD83C\uDFB2'} Roll for Stats</h2>
            {hasRolled && (
              <span className="text-amber-400 text-xs">
                Total: {getTotalStats()} | Rolls: {rollCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={rollDice}
              disabled={isRolling}
              className={`flex-1 py-4 md:py-2 font-pixel text-base md:text-sm rounded border-2 transition-all active:scale-[0.98] ${
                isRolling
                  ? 'bg-amber-800 border-amber-600 text-amber-300 animate-pulse'
                  : 'bg-amber-700 border-amber-500 text-amber-100 hover:bg-amber-600'
              }`}
            >
              {isRolling ? '\uD83C\uDFB2 Rolling...' : hasRolled ? '\uD83C\uDFB2 Reroll Stats (3d6)' : '\uD83C\uDFB2 Roll Stats (3d6 each)'}
            </button>
            {!hasRolled && (
              <div className="text-amber-500 text-xs">
                or use standard allocation {'\u2192'}
              </div>
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
                    isGoodRoll ? 'bg-green-900/40' : isBadRoll ? 'bg-red-900/40' : 'bg-gray-800/40'
                  }`}>
                    <span className="text-purple-300 w-8">{stat.charAt(0)}.</span>
                    <span className="text-gray-400">
                      [{dice.map((d, i) => (
                        <span key={i} className={d === 6 ? 'text-green-400' : d === 1 ? 'text-red-400' : ''}>
                          {d}{i < 2 ? '+' : ''}
                        </span>
                      ))}]
                    </span>
                    <span className={`font-pixel ml-auto ${
                      isGoodRoll ? 'text-green-400' : isBadRoll ? 'text-red-400' : 'text-amber-300'
                    }`}>
                      = {total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {!hasRolled && (
            <p className="text-gray-500 text-xs text-center">
              Standard: 3 base + 12 bonus points | Rolled: 3d6 base + 6 bonus points
            </p>
          )}
        </div>

        {/* Stat Distribution */}
        <div className="bg-gray-900/80 border-2 border-purple-600 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-pixel text-purple-300 text-sm">S.A.D.D.L.E. Stats</h2>
            <span className={`font-pixel text-sm ${pointsRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Bonus Points: {pointsRemaining}
            </span>
          </div>

          <div className="space-y-3">
            {(['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as StatName[]).map(stat => {
              const value = statPoints[stat]
              const baseValue = hasRolled ? baseStats[stat] : 3

              return (
                <div key={stat} className="flex items-center gap-2 md:gap-3">
                  <div className="w-20 md:w-24">
                    <span className="text-purple-200 text-sm md:text-xs font-pixel">{stat.charAt(0)}</span>
                    <span className="text-gray-400 text-sm md:text-xs">. {stat.slice(1)}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => adjustStat(stat, -1)}
                      disabled={value <= baseValue}
                      className="w-11 h-11 md:w-6 md:h-6 text-lg md:text-base bg-purple-800 text-purple-200 rounded disabled:opacity-30 active:bg-purple-600"
                    >-</button>
                    <div className="flex-1 h-3 md:h-2 bg-gray-700 rounded overflow-hidden relative">
                      {/* Base value indicator */}
                      {hasRolled && (
                        <div
                          className="absolute h-full bg-amber-700/50"
                          style={{ width: `${(baseValue / 18) * 100}%` }}
                        />
                      )}
                      <div
                        className="h-full bg-purple-500 transition-all relative"
                        style={{ width: `${(value / 18) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-center text-purple-200 text-base md:text-sm font-pixel">{value}</span>
                    <button
                      onClick={() => adjustStat(stat, 1)}
                      disabled={value >= 18 || pointsRemaining <= 0}
                      className="w-11 h-11 md:w-6 md:h-6 text-lg md:text-base bg-purple-800 text-purple-200 rounded disabled:opacity-30 active:bg-purple-600"
                    >+</button>
                  </div>
                  <span className="w-32 text-gray-500 text-[10px] hidden md:block">{statDescriptions[stat]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleFinalize}
          disabled={pointsRemaining !== 0 || !selectedBackground}
          className="w-full py-4 md:py-3 bg-purple-700 hover:bg-purple-600 text-purple-100 font-pixel text-base md:text-sm rounded border-4 border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
        >
          {!selectedBackground ? 'Select a background' : pointsRemaining > 0 ? `Assign ${pointsRemaining} more points` : 'Begin the Hunt'}
        </button>
      </div>
    </div>
  )
}
