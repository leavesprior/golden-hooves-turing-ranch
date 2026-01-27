'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  generateRiverState,
  getCrossingChoices,
  resolveCrossing,
  getRiverDescription,
  type RiverState,
  type CrossingChoice,
  type CrossingMethod,
  type CrossingOutcome
} from '../data/riverCrossings'
import { useOregonTrail, type Weather } from '../oregonTrailContext'
import { useCharacter, type StatName } from '../characterContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useNarrator } from '../narratorContext'
// NEW: Douglas Adams / Monty Python Easter Egg imports
import { RiverAnimation } from './RiverAnimation'
import { BridgeKeeper } from './BridgeKeeper'

interface RiverCrossingProps {
  riverName: string
  weather: Weather
  dayOfYear?: number
  onComplete: (success: boolean, effects: CrossingOutcome['effects']) => void
  onCancel?: () => void
}

type Phase = 'assess' | 'choose' | 'crossing' | 'outcome' | 'bridge_keeper'

const RISK_COLORS: Record<CrossingChoice['riskLevel'], { bg: string; border: string; text: string }> = {
  low: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-300' },
  medium: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  high: { bg: 'bg-orange-900/50', border: 'border-orange-500', text: 'text-orange-300' },
  very_high: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300' },
  extreme: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300' }
}

const RISK_LABELS: Record<CrossingChoice['riskLevel'], string> = {
  low: 'Safe',
  medium: 'Moderate Risk',
  high: 'Risky',
  very_high: 'Dangerous',
  extreme: 'Suicidal'
}

export function RiverCrossing({
  riverName,
  weather,
  dayOfYear = 150,  // Default to late spring
  onComplete,
  onCancel
}: RiverCrossingProps) {
  const { state: charState, getStat, rollSkillCheck } = useCharacter()
  const { balance, spendNeutral } = useKarmaWallet()
  const karmaBalance = balance.neutral
  const { comment } = useNarrator()

  const [phase, setPhase] = useState<Phase>('assess')
  const [riverState, setRiverState] = useState<RiverState | null>(null)
  const [choices, setChoices] = useState<CrossingChoice[]>([])
  const [selectedChoice, setSelectedChoice] = useState<CrossingMethod | null>(null)
  const [outcome, setOutcome] = useState<CrossingOutcome | null>(null)
  const [animatingCrossing, setAnimatingCrossing] = useState(false)
  const [riverDescription, setRiverDescription] = useState('')
  const [crossingProgress, setCrossingProgress] = useState(0)

  // NEW: Bridge Keeper easter egg - 15% chance to encounter at any river
  const [showBridgeKeeper] = useState(() => Math.random() < 0.15)

  // Generate river state on mount
  useEffect(() => {
    const river = generateRiverState(riverName, weather, dayOfYear)
    setRiverState(river)
    setChoices(getCrossingChoices(river, karmaBalance))
    setRiverDescription(getRiverDescription(river.condition))

    // Narrator comment on arrival
    if (river.condition === 'flood') {
      comment('The river is in flood. Perhaps the universe is testing your decision-making skills.', 'warning')
    } else if (river.condition === 'high') {
      comment('High water. Every crossing method becomes a philosophical statement about risk.', 'observation')
    }
  }, [riverName, weather, dayOfYear, karmaBalance, comment])

  // Get player stats for skill checks
  const playerStats = useMemo(() => {
    const stats: Record<StatName, number> = {
      Shrewdness: getStat('Shrewdness'),
      Agility: getStat('Agility'),
      Durability: getStat('Durability'),
      Diplomacy: getStat('Diplomacy'),
      Luck: getStat('Luck'),
      Expertise: getStat('Expertise')
    }
    return stats
  }, [getStat])

  const handleChoiceSelect = (choice: CrossingChoice) => {
    if (!choice.available) return
    setSelectedChoice(choice.id)
  }

  const handleConfirmCrossing = async () => {
    if (!selectedChoice || !riverState) return

    const choice = choices.find(c => c.id === selectedChoice)
    if (!choice?.available) return

    // Pay cost if any
    if (choice.cost) {
      const success = await spendNeutral(choice.cost, `River crossing: ${choice.name}`)
      if (!success) {
        comment('Your karma wallet protests loudly.', 'sarcasm')
        return
      }
    }

    // Start crossing animation
    setPhase('crossing')
    setAnimatingCrossing(true)
    setCrossingProgress(0)

    // Animate crossing progress
    const progressInterval = setInterval(() => {
      setCrossingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
    }, 100)

    // Simulate crossing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000))
    clearInterval(progressInterval)
    setCrossingProgress(100)

    // Roll for outcome
    const luck = Math.floor(Math.random() * 20) + 1  // d20 roll
    const result = resolveCrossing(selectedChoice, riverState, playerStats, luck)

    setOutcome(result)
    setAnimatingCrossing(false)
    setPhase('outcome')

    // Narrator comment on outcome
    if (result.critical && result.success) {
      comment('Fortune favors the... well, you, apparently.', 'observation')
    } else if (result.critical && !result.success) {
      comment('The river always collects its due. Today, it collected interest.', 'warning')
    }
  }

  const handleContinue = () => {
    if (outcome) {
      onComplete(outcome.success, outcome.effects)
    }
  }

  // NEW: Bridge Keeper handlers (Monty Python easter egg)
  const handleBridgeKeeperSuccess = () => {
    // Free crossing! The Bridge Keeper was defeated by wit
    comment('You have answered the questions three. Or was it two? The bridge keeper seems confused.', 'observation')
    onComplete(true, {
      karmaChange: { good: 10, neutral: 0, bad: 0 },
      daysLost: 0
    })
  }

  const handleBridgeKeeperFailure = () => {
    // Wrong answer - take damage
    comment('AAAAAAARGH! You are cast into the Gorge of Eternal Peril. Well, the river anyway.', 'warning')
    onComplete(false, {
      healthDelta: -15,
      foodLost: 20,
      karmaChange: { good: 0, neutral: 0, bad: 0 },
      daysLost: 1
    })
  }

  const handleBridgeKeeperCancel = () => {
    // Player chose not to face the Bridge Keeper
    setPhase('assess')
  }

  if (!riverState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-cyan-950 flex items-center justify-center">
        <div className="text-cyan-300 font-pixel animate-pulse">Approaching the river...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-cyan-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* River Header */}
        <header className="text-center mb-6">
          <h1 className="font-pixel text-cyan-200 text-2xl mb-2">{riverName}</h1>
          <p className="text-cyan-400 text-sm italic">{riverDescription}</p>
        </header>

        {/* River Stats Display */}
        <div className="bg-blue-900/60 border-2 border-cyan-600 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-cyan-500 text-xs font-pixel">Depth</div>
              <div className={`font-pixel text-lg ${riverState.depth > 4 ? 'text-red-400' : 'text-cyan-200'}`}>
                {riverState.depth} ft
              </div>
            </div>
            <div>
              <div className="text-cyan-500 text-xs font-pixel">Width</div>
              <div className="font-pixel text-lg text-cyan-200">{riverState.width} ft</div>
            </div>
            <div>
              <div className="text-cyan-500 text-xs font-pixel">Current</div>
              <div className={`font-pixel text-lg ${riverState.currentSpeed > 4 ? 'text-orange-400' : 'text-cyan-200'}`}>
                {riverState.currentSpeed} mph
              </div>
            </div>
            <div>
              <div className="text-cyan-500 text-xs font-pixel">Condition</div>
              <div className={`font-pixel text-lg ${
                riverState.condition === 'flood' ? 'text-purple-400' :
                riverState.condition === 'high' ? 'text-red-400' :
                riverState.condition === 'low' ? 'text-green-400' : 'text-cyan-200'
              }`}>
                {riverState.condition.charAt(0).toUpperCase() + riverState.condition.slice(1)}
              </div>
            </div>
          </div>

          {/* Weather indicator */}
          <div className="mt-3 text-center text-cyan-500 text-xs">
            Weather: {weather.charAt(0).toUpperCase() + weather.slice(1)}
            {weather === 'storm' && ' ⚠️'}
          </div>
        </div>

        {/* Phase-specific content */}
        {/* NEW: Bridge Keeper Easter Egg (Monty Python) */}
        {phase === 'bridge_keeper' && charState && (
          <BridgeKeeper
            playerName={charState.name || 'Traveler'}
            onSuccess={handleBridgeKeeperSuccess}
            onFailure={handleBridgeKeeperFailure}
            onCancel={handleBridgeKeeperCancel}
          />
        )}

        {phase === 'assess' && (
          <div className="text-center mb-6">
            {/* Show RiverAnimation in assessment phase too */}
            {riverState && (
              <div className="mb-4">
                <RiverAnimation
                  riverCondition={riverState.condition}
                  weather={weather}
                  isCrossing={false}
                  crossingProgress={0}
                  crossingSuccess={null}
                />
              </div>
            )}

            <p className="text-cyan-300 mb-4">
              You have arrived at the river crossing. How would you like to proceed?
            </p>

            {/* Bridge Keeper button - appears on 15% of crossings */}
            {showBridgeKeeper && (
              <div className="mb-4">
                <button
                  onClick={() => setPhase('bridge_keeper')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-pixel rounded border-2 border-slate-500 transition-colors"
                >
                  🌉 Approach the Ancient Bridge
                </button>
                <p className="text-slate-400 text-xs mt-2 italic">
                  "Stop! Who would cross the Bridge of Death must answer me these questions three..."
                </p>
              </div>
            )}

            <button
              onClick={() => setPhase('choose')}
              className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 font-pixel rounded border-2 border-cyan-500 transition-colors"
            >
              Examine Crossing Options
            </button>
          </div>
        )}

        {phase === 'choose' && (
          <>
            {/* Crossing Choices */}
            <div className="space-y-3 mb-6">
              <h2 className="font-pixel text-cyan-300 text-sm mb-3">Choose Your Method:</h2>

              {choices.map(choice => {
                const riskStyle = RISK_COLORS[choice.riskLevel]
                const isSelected = selectedChoice === choice.id

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={!choice.available}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected ? `${riskStyle.bg} ${riskStyle.border} ring-2 ring-white/30` :
                        choice.available ? `${riskStyle.bg} ${riskStyle.border} hover:ring-2 hover:ring-white/20` :
                        'bg-gray-900/50 border-gray-600 opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{choice.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-pixel text-sm ${choice.available ? riskStyle.text : 'text-gray-400'}`}>
                            {choice.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${riskStyle.bg} ${riskStyle.text}`}>
                            {RISK_LABELS[choice.riskLevel]}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{choice.description}</p>

                        {!choice.available && choice.unavailableReason && (
                          <p className="text-red-400 text-xs mt-1">{choice.unavailableReason}</p>
                        )}

                        {choice.statCheck && (
                          <p className="text-cyan-500 text-xs mt-1">
                            {choice.statCheck.stat} check (DC {choice.statCheck.difficulty}) -
                            Your {choice.statCheck.stat}: {playerStats[choice.statCheck.stat]}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-sm rounded border-2 border-gray-500 transition-colors"
                >
                  Turn Back
                </button>
              )}
              <button
                onClick={handleConfirmCrossing}
                disabled={!selectedChoice}
                className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 font-pixel text-sm rounded border-2 border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedChoice ? `Attempt Crossing` : 'Select a Method'}
              </button>
            </div>
          </>
        )}

        {phase === 'crossing' && riverState && (
          <div className="text-center py-6">
            {/* NEW: Pixel art river animation */}
            <RiverAnimation
              riverCondition={riverState.condition}
              weather={weather}
              isCrossing={animatingCrossing}
              crossingMethod={selectedChoice || 'ford'}
              crossingProgress={crossingProgress}
              crossingSuccess={null}
            />

            <p className="text-cyan-300 font-pixel animate-pulse mt-4">
              {selectedChoice === 'ford' && 'Wading through the current...'}
              {selectedChoice === 'caulk' && 'Floating across...'}
              {selectedChoice === 'ferry' && 'The ferry carries you across...'}
              {selectedChoice === 'wait' && 'Waiting for conditions to improve...'}
              {selectedChoice === 'guide' && 'Following the guide\'s path...'}
            </p>
          </div>
        )}

        {phase === 'outcome' && outcome && (
          <div className={`
            rounded-lg border-4 p-6 mb-6
            ${outcome.success
              ? outcome.critical
                ? 'bg-green-900/60 border-green-400'
                : 'bg-cyan-900/60 border-cyan-500'
              : outcome.critical
                ? 'bg-red-900/60 border-red-400'
                : 'bg-orange-900/60 border-orange-500'
            }
          `}>
            {/* Outcome Header */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {outcome.success
                  ? outcome.critical ? '🌟' : '✅'
                  : outcome.critical ? '💀' : '⚠️'
                }
              </div>
              <h2 className={`font-pixel text-xl ${
                outcome.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {outcome.message}
              </h2>
            </div>

            {/* Flavor Text */}
            <p className="text-gray-200 italic text-center mb-4">
              "{outcome.flavorText}"
            </p>

            {/* Effects Summary */}
            {Object.keys(outcome.effects).length > 0 && (
              <div className="bg-black/30 rounded p-3">
                <h3 className="text-cyan-400 text-xs font-pixel mb-2">Effects:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {outcome.effects.foodLost && (
                    <div className="text-red-400">-{outcome.effects.foodLost} lbs food</div>
                  )}
                  {outcome.effects.ammoLost && (
                    <div className="text-red-400">-{outcome.effects.ammoLost} ammo</div>
                  )}
                  {outcome.effects.healthDelta && (
                    <div className={outcome.effects.healthDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                      {outcome.effects.healthDelta > 0 ? '+' : ''}{outcome.effects.healthDelta} party health
                    </div>
                  )}
                  {outcome.effects.wagonDamage && (
                    <div className="text-orange-400">-{outcome.effects.wagonDamage}% wagon condition</div>
                  )}
                  {outcome.effects.daysLost && (
                    <div className="text-yellow-400">+{outcome.effects.daysLost} days</div>
                  )}
                  {outcome.effects.moraleChange && (
                    <div className={outcome.effects.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}>
                      {outcome.effects.moraleChange > 0 ? '+' : ''}{outcome.effects.moraleChange} morale
                    </div>
                  )}
                  {outcome.effects.specificInjury && (
                    <div className="text-red-400 col-span-2">
                      Party member injured: {outcome.effects.specificInjury.injuryType.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full mt-4 py-3 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 font-pixel text-sm rounded border-2 border-cyan-500 transition-colors"
            >
              Continue Journey
            </button>
          </div>
        )}

        {/* Karma Balance Display */}
        <div className="fixed bottom-4 right-4 bg-amber-900/80 border-2 border-amber-600 rounded-lg px-4 py-2">
          <span className="text-amber-400 text-sm font-pixel">🪙 {karmaBalance}</span>
        </div>
      </div>
    </div>
  )
}

export default RiverCrossing
