'use client'

import React, { useState, useEffect } from 'react'
import { useCharacter, type StatName, type SkillCheckResult, formatSkillCheck } from '../characterContext'

interface SkillCheckProps {
  stat: StatName
  difficulty: number
  description: string
  onResult: (result: SkillCheckResult) => void
  onCancel?: () => void
}

export function SkillCheck({ stat, difficulty, description, onResult, onCancel }: SkillCheckProps) {
  const { getStat, rollSkillCheck } = useCharacter()
  const [phase, setPhase] = useState<'preview' | 'rolling' | 'result'>('preview')
  const [animatedRoll, setAnimatedRoll] = useState(1)
  const [result, setResult] = useState<SkillCheckResult | null>(null)

  const statValue = getStat(stat)
  const successChance = Math.min(95, Math.max(5, ((statValue + 10 - difficulty) / 20) * 100))

  // Rolling animation
  useEffect(() => {
    if (phase === 'rolling') {
      const interval = setInterval(() => {
        setAnimatedRoll(Math.floor(Math.random() * 20) + 1)
      }, 50)

      // Stop after animation duration
      const timeout = setTimeout(() => {
        clearInterval(interval)
        const checkResult = rollSkillCheck(stat, difficulty)
        setResult(checkResult)
        setAnimatedRoll(checkResult.roll)
        setPhase('result')
      }, 1500)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [phase, stat, difficulty, rollSkillCheck])

  // Handle confirming result
  const handleConfirm = () => {
    if (result) {
      onResult(result)
    }
  }

  // Get die face display
  const getDieFace = (value: number): string => {
    const faces = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685']
    // Map 1-20 to die faces (repeating pattern for display)
    return faces[(value - 1) % 6]
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-600 rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-purple-400 text-xl mb-2">Skill Check</h2>
          <p className="text-gray-300">{description}</p>
        </div>

        {/* Stat Info */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-800 rounded">
          <div>
            <span className="text-purple-400">{stat}</span>
            <span className="text-gray-400 ml-2">({statValue})</span>
          </div>
          <div>
            <span className="text-gray-400">DC </span>
            <span className="text-red-400 font-bold">{difficulty}</span>
          </div>
        </div>

        {/* Success Chance */}
        {phase === 'preview' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Success Chance</span>
              <span className={`${successChance > 50 ? 'text-emerald-400' : successChance > 25 ? 'text-amber-400' : 'text-red-400'}`}>
                {Math.round(successChance)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  successChance > 50 ? 'bg-emerald-500' : successChance > 25 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${successChance}%` }}
              />
            </div>
          </div>
        )}

        {/* Rolling Animation / Result */}
        <div className="flex justify-center items-center h-32 mb-4">
          {phase === 'preview' && (
            <div className="text-6xl text-gray-600 opacity-50">
              {getDieFace(10)}
            </div>
          )}

          {phase === 'rolling' && (
            <div className="text-6xl text-purple-400 animate-pulse">
              {getDieFace(animatedRoll)}
              <span className="block text-3xl text-center mt-2">{animatedRoll}</span>
            </div>
          )}

          {phase === 'result' && result && (
            <div className={`text-center ${
              result.criticalSuccess
                ? 'text-yellow-400'
                : result.criticalFailure
                ? 'text-red-600'
                : result.success
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}>
              <div className="text-6xl mb-2">
                {result.criticalSuccess ? '\u2728' : result.criticalFailure ? '\ud83d\udca5' : getDieFace(result.roll)}
              </div>
              <div className="text-3xl font-bold">
                {result.roll} + {result.modifier} = {result.total}
              </div>
              <div className="text-lg mt-2">
                {result.criticalSuccess && 'CRITICAL SUCCESS!'}
                {result.criticalFailure && 'CRITICAL FAILURE!'}
                {!result.criticalSuccess && !result.criticalFailure && (result.success ? 'SUCCESS!' : 'FAILED!')}
              </div>
              {result.margin !== 0 && (
                <div className="text-sm text-gray-400 mt-1">
                  {result.success ? `Beat DC by ${result.margin}` : `Missed by ${Math.abs(result.margin)}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {phase === 'preview' && (
            <>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
                >
                  Back Down
                </button>
              )}
              <button
                onClick={() => setPhase('rolling')}
                className="flex-1 py-2 bg-purple-700 text-purple-100 rounded hover:bg-purple-600 font-bold"
              >
                Roll the Dice
              </button>
            </>
          )}

          {phase === 'result' && (
            <button
              onClick={handleConfirm}
              className={`w-full py-2 rounded font-bold ${
                result?.success
                  ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600'
                  : 'bg-red-700 text-red-100 hover:bg-red-600'
              }`}
            >
              Continue
            </button>
          )}
        </div>

        {/* Flavor Text */}
        {phase === 'preview' && (
          <p className="text-gray-500 text-xs text-center mt-4 italic">
            "Fortune favors the bold... or those with high stats."
          </p>
        )}
      </div>
    </div>
  )
}

// Inline skill check display (for use in dialogue)
interface InlineSkillCheckProps {
  stat: StatName
  difficulty: number
  currentValue: number
}

export function InlineSkillCheck({ stat, difficulty, currentValue }: InlineSkillCheckProps) {
  const meetsRequirement = currentValue >= difficulty
  const statColors: Record<StatName, string> = {
    Shrewdness: 'text-blue-400',
    Agility: 'text-green-400',
    Durability: 'text-red-400',
    Diplomacy: 'text-purple-400',
    Luck: 'text-yellow-400',
    Expertise: 'text-orange-400'
  }

  return (
    <span className={`px-2 py-0.5 rounded ${meetsRequirement ? 'bg-gray-800' : 'bg-gray-900 opacity-50'}`}>
      <span className={statColors[stat]}>[{stat} {difficulty}]</span>
      {!meetsRequirement && <span className="text-gray-500 ml-1">({currentValue})</span>}
    </span>
  )
}

// Skill check result toast
interface SkillCheckToastProps {
  result: SkillCheckResult
  onDismiss: () => void
}

export function SkillCheckToast({ result, onDismiss }: SkillCheckToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg cursor-pointer z-50 ${
        result.success ? 'bg-emerald-900 border border-emerald-500' : 'bg-red-900 border border-red-500'
      }`}
      onClick={onDismiss}
    >
      <p className={`font-bold ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
        {formatSkillCheck(result)}
      </p>
    </div>
  )
}

export default SkillCheck
