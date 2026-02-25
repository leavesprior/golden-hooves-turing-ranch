'use client'

/**
 * Town Puzzle Component
 *
 * Hitchhiker's Guide Babel Fish-style multi-step environmental puzzles.
 * Players examine, choose, talk, and roll skill checks to solve
 * chained puzzle steps at landmarks.
 */

import React, { useState, useCallback } from 'react'
import type { TownPuzzle as TownPuzzleData, PuzzleStep, PuzzleChoice } from '../data/townPuzzles'
import type { StatName } from '../characterContext'

interface TownPuzzleProps {
  puzzle: TownPuzzleData
  playerStats: Record<StatName, number>
  onComplete: (puzzleId: string, rewards: TownPuzzleData['rewards']) => void
  onClose: () => void
  onSkillCheck: (stat: StatName, dc: number) => { success: boolean; roll: number; modifier: number; total: number }
}

export default function TownPuzzle({
  puzzle,
  playerStats,
  onComplete,
  onClose,
  onSkillCheck,
}: TownPuzzleProps) {
  const [currentStepId, setCurrentStepId] = useState(puzzle.startStepId)
  const [stepHistory, setStepHistory] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [resultText, setResultText] = useState<string | null>(null)
  const [resultSuccess, setResultSuccess] = useState(false)
  const [rollResult, setRollResult] = useState<{ roll: number; modifier: number; total: number; dc: number; stat: StatName } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [stepsCompleted, setStepsCompleted] = useState(0)

  const currentStep = puzzle.steps.find(s => s.id === currentStepId)
  const totalSteps = puzzle.steps.length

  const advanceToStep = useCallback((nextStepId: string | null, success: boolean) => {
    if (nextStepId === null) {
      // Puzzle complete!
      setCompleted(true)
      onComplete(puzzle.id, puzzle.rewards)
      return
    }
    setStepsCompleted(prev => prev + 1)
    setStepHistory(prev => [...prev, currentStepId])
    setCurrentStepId(nextStepId)
    setResultText(null)
    setRollResult(null)
    setShowHint(false)
  }, [currentStepId, puzzle.id, puzzle.rewards, onComplete])

  const handleExamine = useCallback(() => {
    if (!currentStep) return
    setResultText(currentStep.successText)
    setResultSuccess(true)
  }, [currentStep])

  const handleTalk = useCallback(() => {
    if (!currentStep) return
    setResultText(currentStep.successText)
    setResultSuccess(true)
  }, [currentStep])

  const handleChoice = useCallback((choice: PuzzleChoice) => {
    if (!currentStep) return
    if (choice.correct) {
      setResultText(choice.response + '\n\n' + currentStep.successText)
      setResultSuccess(true)
    } else {
      setResultText(choice.response + (currentStep.failureText ? '\n\n' + currentStep.failureText : ''))
      setResultSuccess(false)
    }
  }, [currentStep])

  const handleSkillCheck = useCallback(() => {
    if (!currentStep?.skillCheck) return
    const { stat, dc } = currentStep.skillCheck
    const result = onSkillCheck(stat, dc)
    setRollResult({ ...result, dc, stat })

    if (result.success) {
      setResultText(currentStep.successText)
      setResultSuccess(true)
    } else {
      setResultText(currentStep.failureText || 'You failed the check.')
      setResultSuccess(false)
    }
  }, [currentStep, onSkillCheck])

  const handleContinue = useCallback(() => {
    if (!currentStep) return
    if (resultSuccess) {
      advanceToStep(currentStep.nextStepId, true)
    } else if (currentStep.failStepId) {
      advanceToStep(currentStep.failStepId, false)
    } else if (currentStep.nextStepId) {
      // Failure but no fail path — still advance (with reduced reward implied)
      advanceToStep(currentStep.nextStepId, false)
    }
  }, [currentStep, resultSuccess, advanceToStep])

  if (!currentStep && !completed) {
    return (
      <div className="p-4 bg-amber-950 border-4 border-yellow-700">
        <p className="text-yellow-200 text-sm">Puzzle error: step not found.</p>
        <button onClick={onClose} className="mt-2 text-yellow-400 text-xs underline">Leave</button>
      </div>
    )
  }

  return (
    <div className="bg-amber-950 border-4 border-yellow-700 max-w-lg w-full">
      {/* Header */}
      <div className="bg-yellow-800/60 p-3 border-b-2 border-yellow-700 flex items-center justify-between">
        <div>
          <h2 className="text-yellow-300 font-bold text-sm">{puzzle.title}</h2>
          <p className="text-yellow-500 text-xs">
            {completed ? 'Solved!' : `Step ${stepsCompleted + 1} of ${totalSteps}`}
            {' \u2022 '}
            <span className={
              puzzle.difficulty === 'easy' ? 'text-green-400' :
              puzzle.difficulty === 'medium' ? 'text-yellow-400' :
              'text-red-400'
            }>
              {puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)}
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-yellow-500 hover:text-yellow-300 text-xs border border-yellow-700 px-2 py-1"
        >
          Leave
        </button>
      </div>

      {/* Narrator Intro (first step only) */}
      {stepsCompleted === 0 && !resultText && puzzle.narratorIntro && (
        <div className="px-4 pt-3">
          <p className="text-yellow-600 text-xs italic">
            *{puzzle.narratorIntro}*
          </p>
        </div>
      )}

      {/* Completed State */}
      {completed ? (
        <div className="p-4 space-y-3">
          <div className="text-center">
            <p className="text-yellow-300 text-lg font-bold">Puzzle Solved!</p>
            <p className="text-yellow-200 text-sm mt-2">{puzzle.title} completed.</p>
          </div>

          {/* Rewards */}
          <div className="bg-yellow-900/30 p-3 border border-yellow-700 space-y-1">
            <p className="text-yellow-400 text-xs font-bold mb-2">Rewards:</p>
            {puzzle.rewards.neutralKarma && (
              <p className="text-yellow-200 text-xs">+{puzzle.rewards.neutralKarma} Neutral Karma</p>
            )}
            {puzzle.rewards.goodKarma && (
              <p className="text-green-300 text-xs">+{puzzle.rewards.goodKarma} Good Karma</p>
            )}
            {puzzle.rewards.food && (
              <p className="text-yellow-200 text-xs">+{puzzle.rewards.food} Food</p>
            )}
            {puzzle.rewards.ammunition && (
              <p className="text-yellow-200 text-xs">+{puzzle.rewards.ammunition} Ammunition</p>
            )}
            {puzzle.rewards.medicine && (
              <p className="text-yellow-200 text-xs">+{puzzle.rewards.medicine} Medicine</p>
            )}
            {puzzle.rewards.spareParts && (
              <p className="text-yellow-200 text-xs">+{puzzle.rewards.spareParts} Spare Parts</p>
            )}
            {puzzle.rewards.xp && (
              <p className="text-purple-300 text-xs">+{puzzle.rewards.xp} XP</p>
            )}
            {puzzle.rewards.inventoryItem && (
              <p className="text-cyan-300 text-xs">Found: {puzzle.rewards.inventoryItem}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-yellow-700 hover:bg-yellow-600 text-black font-bold py-2 text-sm"
          >
            Continue
          </button>
        </div>
      ) : (
        /* Active Puzzle Step */
        <div className="p-4 space-y-3">
          {/* Step text */}
          <p className="text-yellow-200 text-sm leading-relaxed">
            {currentStep!.text}
          </p>

          {/* Narrator comment */}
          {currentStep!.narratorComment && !resultText && (
            <p className="text-yellow-600 text-xs italic">
              *{currentStep!.narratorComment}*
            </p>
          )}

          {/* Result text (after action) */}
          {resultText && (
            <div className={`p-3 border-2 ${
              resultSuccess ? 'border-green-700 bg-green-950/30' : 'border-red-700 bg-red-950/30'
            }`}>
              {rollResult && (
                <p className="text-yellow-300 text-xs mb-2">
                  Roll: {rollResult.roll} + {rollResult.modifier} ({rollResult.stat}) = {rollResult.total} vs DC {rollResult.dc}
                  {' \u2014 '}
                  <span className={resultSuccess ? 'text-green-400' : 'text-red-400'}>
                    {resultSuccess ? 'Success!' : 'Failed!'}
                  </span>
                </p>
              )}
              <p className={`text-sm leading-relaxed ${resultSuccess ? 'text-green-200' : 'text-red-200'}`}>
                {resultText}
              </p>
            </div>
          )}

          {/* Action buttons — only show before result */}
          {!resultText && (
            <div className="space-y-2">
              {/* Examine / Talk — simple advance */}
              {(currentStep!.action === 'examine' || currentStep!.action === 'talk') && (
                <button
                  onClick={currentStep!.action === 'examine' ? handleExamine : handleTalk}
                  className="w-full bg-yellow-800/60 hover:bg-yellow-700/60 border-2 border-yellow-600 text-yellow-200 py-2 text-sm"
                >
                  {currentStep!.action === 'examine' ? 'Examine closely' : 'Listen and respond'}
                </button>
              )}

              {/* Skill Check */}
              {currentStep!.action === 'skill_check' && currentStep!.skillCheck && (
                <button
                  onClick={handleSkillCheck}
                  className="w-full bg-purple-900/60 hover:bg-purple-800/60 border-2 border-purple-600 text-purple-200 py-2 text-sm"
                >
                  Roll {currentStep!.skillCheck.stat} (DC {currentStep!.skillCheck.dc})
                  <span className="text-purple-400 text-xs ml-2">
                    Your {currentStep!.skillCheck.stat}: {playerStats[currentStep!.skillCheck.stat] ?? 5}
                  </span>
                </button>
              )}

              {/* Choices */}
              {currentStep!.action === 'choose' && currentStep!.choices && (
                <div className="space-y-1">
                  {currentStep!.choices.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice)}
                      className="w-full text-left bg-amber-900/40 hover:bg-amber-800/40 border-2 border-yellow-700 hover:border-yellow-500 text-yellow-200 p-2 text-sm transition-colors"
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Continue button — after result */}
          {resultText && (
            <button
              onClick={handleContinue}
              className={`w-full font-bold py-2 text-sm ${
                resultSuccess
                  ? 'bg-green-800 hover:bg-green-700 text-green-100'
                  : 'bg-amber-800 hover:bg-amber-700 text-yellow-200'
              }`}
            >
              {resultSuccess ? 'Continue' : (currentStep!.failStepId ? 'Try Again' : 'Continue')}
            </button>
          )}

          {/* Hint toggle */}
          {currentStep!.hint && !resultText && (
            <div className="pt-2 border-t border-yellow-800">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-yellow-600 text-xs hover:text-yellow-400"
              >
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </button>
              {showHint && (
                <p className="text-yellow-500 text-xs mt-1 italic">
                  Hint: {currentStep!.hint}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="w-full bg-yellow-900/30 h-1">
          <div
            className="bg-yellow-500 h-1 transition-all"
            style={{ width: `${completed ? 100 : (stepsCompleted / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
