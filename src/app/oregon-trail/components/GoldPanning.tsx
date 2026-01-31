'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useCharacter } from '../characterContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useSettlement } from '../settlementContext'

interface GoldPanningProps {
  isOpen: boolean
  onClose: () => void
  miningClaims: number
}

type PanResult = 'gravel' | 'flakes' | 'nugget'

interface RoundResult {
  round: number
  result: PanResult
  earnings: number
  timing: 'early' | 'perfect' | 'late'
}

const TOTAL_ROUNDS = 4
const SWING_DURATION = 2000 // ms for one full swing cycle
const PERFECT_WINDOW_BASE = 150 // ms window for "perfect" (modified by Expertise)

/**
 * GoldPanning - Interactive timing-based minigame
 *
 * Player watches a swirling pan animation and clicks at the right moment.
 * Timing determines yield: early=gravel, perfect=nugget, late=silt
 *
 * S.A.D.D.L.E. stat bonuses:
 * - Luck: increases gold yield multiplier
 * - Expertise: widens the "perfect" timing window
 */
export function GoldPanning({ isOpen, onClose, miningClaims }: GoldPanningProps) {
  const { getStat } = useCharacter()
  const { earnNeutral } = useKarmaWallet()
  const { advanceDay } = useSettlement()

  const [currentRound, setCurrentRound] = useState(0)
  const [isSwinging, setIsSwinging] = useState(false)
  const [swingProgress, setSwingProgress] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [gamePhase, setGamePhase] = useState<'ready' | 'swinging' | 'result' | 'complete'>('ready')
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)

  const swingStartRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)

  // Stats modify the game
  const luckStat = getStat('Luck')
  const expertiseStat = getStat('Expertise')

  // Expertise widens the perfect window
  const perfectWindow = PERFECT_WINDOW_BASE + (expertiseStat - 5) * 20 // base +-20ms per expertise point
  // Luck increases yield multiplier
  const luckMultiplier = 1 + (luckStat - 5) * 0.1 // base +-10% per luck point
  // Mining claims boost yield
  const claimMultiplier = 1 + (miningClaims * 0.25)

  // Start a round
  const startSwing = useCallback(() => {
    setIsSwinging(true)
    setGamePhase('swinging')
    swingStartRef.current = Date.now()

    const animate = () => {
      const elapsed = Date.now() - swingStartRef.current
      const progress = (elapsed % SWING_DURATION) / SWING_DURATION
      setSwingProgress(progress)
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [])

  // Click to pan - timing matters
  const handlePan = useCallback(() => {
    if (!isSwinging) return

    cancelAnimationFrame(animFrameRef.current)
    setIsSwinging(false)

    // The "sweet spot" is at 50% of the swing (when the pan is centered)
    const elapsed = Date.now() - swingStartRef.current
    const cyclePosition = (elapsed % SWING_DURATION) / SWING_DURATION
    // Convert to distance from center (0 = perfect, 0.5 = worst)
    const distFromCenter = Math.abs(cyclePosition - 0.5)
    const msFromPerfect = distFromCenter * SWING_DURATION

    let timing: 'early' | 'perfect' | 'late'
    let result: PanResult
    let baseEarnings: number

    if (msFromPerfect <= perfectWindow / 2) {
      // Perfect timing!
      timing = 'perfect'
      result = 'nugget'
      baseEarnings = 8 + Math.floor(Math.random() * 8) // 8-15
    } else if (msFromPerfect <= perfectWindow) {
      // Close - gold flakes
      timing = cyclePosition < 0.5 ? 'early' : 'late'
      result = 'flakes'
      baseEarnings = 3 + Math.floor(Math.random() * 5) // 3-7
    } else {
      // Missed - just gravel
      timing = cyclePosition < 0.5 ? 'early' : 'late'
      result = 'gravel'
      baseEarnings = 1 + Math.floor(Math.random() * 2) // 1-2
    }

    // Apply multipliers
    const earnings = Math.max(1, Math.floor(baseEarnings * luckMultiplier * claimMultiplier))

    const roundResult: RoundResult = {
      round: currentRound + 1,
      result,
      earnings,
      timing,
    }

    setLastResult(roundResult)
    setResults(prev => [...prev, roundResult])
    setCurrentRound(prev => prev + 1)
    setGamePhase('result')
  }, [isSwinging, currentRound, perfectWindow, luckMultiplier, claimMultiplier])

  // Continue to next round or finish
  const handleContinue = useCallback(async () => {
    if (currentRound >= TOTAL_ROUNDS) {
      // All rounds complete
      const totalEarnings = results.reduce((sum, r) => sum + r.earnings, 0)
      await earnNeutral(totalEarnings, `Gold panning: ${TOTAL_ROUNDS} rounds`)
      advanceDay(1) // Mining takes a full day
      setGamePhase('complete')
    } else {
      setLastResult(null)
      setGamePhase('ready')
    }
  }, [currentRound, results, lastResult, earnNeutral, advanceDay])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentRound(0)
      setResults([])
      setLastResult(null)
      setGamePhase('ready')
      setSwingProgress(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalEarnings = results.reduce((sum, r) => sum + r.earnings, 0)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-900/60 p-4 border-b border-yellow-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⛏️</span>
              <div>
                <h2 className="text-yellow-200 font-bold text-lg">Gold Panning</h2>
                <p className="text-yellow-400 text-sm">
                  Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-300 font-bold">{totalEarnings}🌮</p>
              <p className="text-gray-500 text-xs">earned</p>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="p-6 space-y-4">
          {/* Creek & Pan Visualization */}
          <div className="relative bg-blue-950/40 border border-blue-800 rounded-lg h-40 overflow-hidden flex items-center justify-center">
            {/* Water ripples */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute w-full h-full bg-gradient-to-r from-blue-600/0 via-blue-400/30 to-blue-600/0 animate-pulse" />
            </div>

            {gamePhase === 'ready' && (
              <div className="text-center z-10">
                <p className="text-blue-200 text-lg mb-2">🍳 Ready your pan...</p>
                <p className="text-blue-400 text-sm">Click Start, then tap when the pan is centered!</p>
              </div>
            )}

            {gamePhase === 'swinging' && (
              <div className="relative w-full h-full flex items-center z-10">
                {/* Swinging pan indicator */}
                <div
                  className="absolute transition-none"
                  style={{
                    left: `${swingProgress * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span className="text-5xl">🍳</span>
                </div>
                {/* Sweet spot indicator */}
                <div className="absolute left-1/2 -translate-x-1/2 w-16 h-full border-l-2 border-r-2 border-yellow-500/40 flex items-center justify-center">
                  <span className="text-yellow-500/60 text-xs">sweet spot</span>
                </div>
              </div>
            )}

            {gamePhase === 'result' && lastResult && (
              <div className="text-center z-10 animate-fade-in">
                <span className="text-5xl">
                  {lastResult.result === 'nugget' ? '🥇' : lastResult.result === 'flakes' ? '✨' : '🪨'}
                </span>
                <p className={`text-lg font-bold mt-2 ${
                  lastResult.result === 'nugget' ? 'text-yellow-300' :
                  lastResult.result === 'flakes' ? 'text-amber-300' : 'text-gray-400'
                }`}>
                  {lastResult.result === 'nugget' ? 'Gold Nugget!' :
                   lastResult.result === 'flakes' ? 'Gold Flakes!' : 'Just Gravel...'}
                </p>
                <p className="text-amber-200 text-sm">+{lastResult.earnings}🌮</p>
                <p className="text-gray-500 text-xs mt-1">
                  {lastResult.timing === 'perfect' ? 'Perfect timing!' :
                   lastResult.timing === 'early' ? 'A bit early...' : 'A bit late...'}
                </p>
              </div>
            )}

            {gamePhase === 'complete' && (
              <div className="text-center z-10">
                <span className="text-5xl mb-2 block">💰</span>
                <p className="text-yellow-300 text-lg font-bold">Day Complete!</p>
                <p className="text-amber-200">Total: {totalEarnings}🌮</p>
              </div>
            )}
          </div>

          {/* Stat Bonuses Display */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>🎲 Luck: {luckStat} ({luckMultiplier > 1 ? '+' : ''}{Math.round((luckMultiplier - 1) * 100)}% yield)</span>
            <span>🎯 Expertise: {expertiseStat} ({perfectWindow}ms window)</span>
            {miningClaims > 0 && <span>⛏️ Claims: x{claimMultiplier.toFixed(2)}</span>}
          </div>

          {/* Round History */}
          {results.length > 0 && (
            <div className="space-y-1">
              {results.map(r => (
                <div key={r.round} className="flex items-center justify-between text-sm bg-gray-800/40 rounded px-3 py-1">
                  <span className="text-gray-400">Round {r.round}</span>
                  <span>
                    {r.result === 'nugget' ? '🥇' : r.result === 'flakes' ? '✨' : '🪨'}
                  </span>
                  <span className="text-amber-300">+{r.earnings}🌮</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 p-4 flex gap-3">
          {gamePhase === 'ready' && (
            <button
              onClick={startSwing}
              className="flex-1 py-3 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 rounded font-bold"
            >
              Start Panning
            </button>
          )}
          {gamePhase === 'swinging' && (
            <button
              onClick={handlePan}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-amber-100 rounded font-bold text-lg animate-pulse"
            >
              PAN NOW!
            </button>
          )}
          {gamePhase === 'result' && (
            <button
              onClick={handleContinue}
              className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 rounded font-bold"
            >
              {currentRound >= TOTAL_ROUNDS ? 'Finish Day' : 'Next Round'}
            </button>
          )}
          {gamePhase === 'complete' && (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-green-100 rounded font-bold"
            >
              Done (+{totalEarnings}🌮)
            </button>
          )}
          {gamePhase !== 'swinging' && gamePhase !== 'complete' && (
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GoldPanning
