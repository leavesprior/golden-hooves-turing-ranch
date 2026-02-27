'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useMystery } from '../mysteryContext'
import { useKarmaWallet } from '../karmaWalletContext'
import type { EducationalClue } from '../data/educationalClues'
import { isCloseAnswer, generateContextualMultipleChoice } from '../data/educationalClues'
import { useCharacter } from '../characterContext'
import type { GoldCountryLocation } from '../data/goldCountryLocations'
import { getNextTierProgress, getQualifyingTier, DISCOUNT_TIERS } from '../data/discountEngine'

/** Minimal location info for trail landmarks (not Gold Country locations) */
export interface TrailLandmarkInfo {
  name: string
  description: string
  icon: string
}

interface ResearchStationProps {
  isOpen: boolean
  onClose: () => void
  location?: GoldCountryLocation
  trailLandmark?: TrailLandmarkInfo
  clue: EducationalClue
  onClueAnswered?: (correct: boolean) => void
}

/**
 * ResearchStation - Educational trivia modal for Gold Country locations
 *
 * Players research real locations and answer trivia questions to:
 * 1. Learn historical facts about Gold Country
 * 2. Progress toward discount tiers
 * 3. Earn karma based on their alignment
 *
 * ┌─────────────────────────────────────────┐
 * │ 📍 Moaning Cavern                       │
 * │                                         │
 * │ The largest public cavern in California │
 * │                                         │
 * │ 🔗 Research this location               │
 * │                                         │
 * │ Question:                               │
 * │ How deep is the main chamber?           │
 * │                                         │
 * │ [_____________________] [Submit]        │
 * │                                         │
 * │ 💡 Need a hint? [-1 Karma]              │
 * └─────────────────────────────────────────┘
 */
export function ResearchStation({
  isOpen,
  onClose,
  location,
  trailLandmark,
  clue,
  onClueAnswered,
}: ResearchStationProps) {
  // Derive display info from either Gold Country location or trail landmark
  const displayName = location?.name || trailLandmark?.name || 'Unknown Location'
  const displayDescription = location?.description || trailLandmark?.description || ''
  const displayLink = location?.externalLink || clue.hintLink
  const displayLinkPrompt = location?.linkPrompt || 'Research this location'
  const displayLinkHint = location?.linkHint || ''
  const { attemptEducationalClue, useHint: applyHint, getEducationalProgress, getCorrectClueCount, state: mysteryState } = useMystery()
  const { earnGood, earnNeutral, recordGoodAction, spendNeutral, canAfford } = useKarmaWallet()
  const { addExperience } = useCharacter()

  // Check if this clue was already answered correctly
  const alreadyCompleted = useMemo(() => {
    return mysteryState.educationalCluesCollected.some(
      c => c.clue.id === clue.id && c.answeredCorrectly
    )
  }, [mysteryState.educationalCluesCollected, clue.id])

  const [answer, setAnswer] = useState('')
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | 'close' | null>(alreadyCompleted ? 'correct' : null)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[] | null>(null)
  const [multipleChoiceDifficulty, setMultipleChoiceDifficulty] = useState<'easy' | 'hard'>('hard')
  const [reducedKarma, setReducedKarma] = useState(false)
  const [wasEverClose, setWasEverClose] = useState(false)

  // Calculate progress info
  const correctCount = getCorrectClueCount()
  const tierProgress = useMemo(() => getNextTierProgress(correctCount), [correctCount])
  const currentTier = getQualifyingTier(correctCount)

  // Handle answer submission
  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || isSubmitting) return

    setIsSubmitting(true)
    const result = attemptEducationalClue(clue.id, answer.trim())

    if (result.correct) {
      setShowResult('correct')
      const karmaAmount = reducedKarma ? 3 : 5
      await earnGood(karmaAmount, `Learned about ${displayName}`)
      recordGoodAction(karmaAmount)
      onClueAnswered?.(true)
    } else {
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      // Check if answer is close and track it
      const closeThisTime = isCloseAnswer(clue.id, answer.trim())
      if (closeThisTime) {
        setShowResult('close')
        setWasEverClose(true)
      } else {
        setShowResult('incorrect')
      }

      // After 2 failed attempts, switch to contextual multiple choice
      if (newFailedAttempts >= 2 && !multipleChoiceOptions) {
        const isClose = wasEverClose || closeThisTime
        const { options, difficulty } = generateContextualMultipleChoice(clue.id, isClose)
        setMultipleChoiceOptions(options)
        setMultipleChoiceDifficulty(difficulty)
        setReducedKarma(true)
      }

      onClueAnswered?.(false)
    }

    setIsSubmitting(false)
  }, [answer, clue.id, attemptEducationalClue, earnGood, recordGoodAction, displayName, onClueAnswered, isSubmitting, failedAttempts, multipleChoiceOptions, reducedKarma, wasEverClose])

  // Handle multiple choice selection
  const handleMultipleChoiceSelect = useCallback((option: string) => {
    setAnswer(option)
    // Auto-submit after a short delay for visual feedback
    setTimeout(async () => {
      const result = attemptEducationalClue(clue.id, option)
      if (result.correct) {
        setShowResult('correct')
        // Differentiated rewards: close players get 4 karma + 5 XP, way-off players get 2 karma
        const karmaAmount = wasEverClose ? 4 : 2
        await earnGood(karmaAmount, `Learned about ${displayName}`)
        recordGoodAction(karmaAmount)
        if (wasEverClose) {
          addExperience(5)
        }
        onClueAnswered?.(true)
      } else {
        setShowResult('incorrect')
        onClueAnswered?.(false)
      }
    }, 200)
  }, [clue.id, attemptEducationalClue, earnGood, recordGoodAction, displayName, onClueAnswered, wasEverClose, addExperience])

  // Handle hint request
  const handleUseHint = useCallback(async () => {
    const hintCost = 10
    if (!canAfford('neutral', hintCost)) return

    const success = await spendNeutral(hintCost, `Hint for ${displayName}`)
    if (success) {
      applyHint(clue.id)
      setShowHint(true)
      setHintsUsed(prev => prev + 1)
    }
  }, [canAfford, spendNeutral, applyHint, clue.id, displayName])

  // Handle closing and reset
  const handleClose = useCallback(() => {
    setAnswer('')
    setShowResult(alreadyCompleted ? 'correct' : null)
    setShowHint(false)
    setHintsUsed(0)
    setFailedAttempts(0)
    setMultipleChoiceOptions(null)
    setMultipleChoiceDifficulty('hard')
    setReducedKarma(false)
    setWasEverClose(false)
    onClose()
  }, [onClose, alreadyCompleted])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmit()
    }
  }, [handleSubmit, showResult])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border-2 border-cyan-600 rounded-lg w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-cyan-900/60 p-4 border-b border-cyan-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{trailLandmark?.icon || '📍'}</span>
            <div className="flex-1">
              <h2 className="text-cyan-200 font-bold text-lg">{displayName}</h2>
              <p className="text-cyan-400 text-sm">{displayDescription}</p>
            </div>
          </div>
        </div>

        {/* Research Link */}
        <div className="p-4 border-b border-gray-700">
          <a
            href={displayLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>🔗</span>
            <span className="underline">{displayLinkPrompt}</span>
            <span className="text-gray-500 text-xs">(opens new tab)</span>
          </a>
          {displayLinkHint && (
            <p className="text-gray-500 text-xs mt-1 italic">{displayLinkHint}</p>
          )}
        </div>

        {/* Question */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-amber-200 font-bold mb-2">Question:</p>
            <p className="text-gray-200">{clue.question}</p>
          </div>

          {/* Hint */}
          {showHint && clue.hintLink && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
              <p className="text-amber-300 text-sm">
                <span className="font-bold">Hint:</span> Check out this link for help:{' '}
                <a
                  href={clue.hintLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Research Help
                </a>
              </p>
            </div>
          )}

          {/* Answer Input (only show if not yet answered correctly) */}
          {showResult !== 'correct' && (
            <div className="space-y-3">
              {/* Multiple choice mode (after 2 failed attempts) */}
              {multipleChoiceOptions ? (
                <div className="space-y-2">
                  <p className="text-amber-300 text-sm font-bold">
                    {wasEverClose
                      ? 'You were on the right track! Pick the answer:'
                      : 'Choose the correct answer:'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {wasEverClose
                      ? '(Partial reward: +4🍪 Good Karma + 5 XP Knowledge Boost)'
                      : '(Reduced reward: +2🍪 Good Karma)'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {multipleChoiceOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMultipleChoiceSelect(option)}
                        disabled={isSubmitting}
                        className="px-4 py-3 bg-gray-800 hover:bg-cyan-900/60 border border-gray-600 hover:border-cyan-500 rounded text-gray-200 text-left transition-colors disabled:opacity-50"
                      >
                        {String.fromCharCode(65 + idx)}. {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => { setAnswer(e.target.value); if (showResult === 'incorrect' || showResult === 'close') setShowResult(null) }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer..."
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '...' : 'Submit'}
                  </button>
                </div>
              )}

              {/* Hint Button */}
              {!showHint && clue.hintLink && (
                <button
                  onClick={handleUseHint}
                  disabled={!canAfford('neutral', 10)}
                  className="text-amber-400 hover:text-amber-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💡 Need a hint? (-10🌮)
                </button>
              )}
            </div>
          )}

          {/* Result Feedback */}
          {showResult === 'correct' && (
            <div className="space-y-4">
              <div className="bg-green-900/40 border border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  {alreadyCompleted ? (
                    <span className="text-green-300 font-bold">Already Completed</span>
                  ) : reducedKarma ? (
                    <>
                      <span className="text-green-300 font-bold">Correct!</span>
                      <span className="text-green-400 text-sm">
                        {wasEverClose ? '+4🍪 Good Karma +5 XP' : '+2🍪 Good Karma'}
                      </span>
                      {!wasEverClose && (
                        <span className="text-amber-400 text-xs block mt-1">Next time, check the research page first!</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-green-300 font-bold">Correct!</span>
                      <span className="text-green-400 text-sm">+5🍪 Good Karma</span>
                    </>
                  )}
                </div>
                <p className="text-green-200 text-sm">
                  <span className="font-bold">Answer:</span> {clue.answer}
                </p>
              </div>

              {/* Historical Fact */}
              <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
                <p className="text-cyan-200 font-bold mb-2">📚 Historical Fact:</p>
                <p className="text-gray-300">{clue.fact}</p>
              </div>

              {/* Progress Update */}
              <div className="bg-gray-800/60 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Clues Collected:</span>
                  <span className="text-amber-300 font-bold">{correctCount + 1}</span>
                </div>
                {!tierProgress.maxed && tierProgress.nextTier && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-xs">{tierProgress.message}</p>
                    <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{
                          width: `${((correctCount + 1) / DISCOUNT_TIERS[tierProgress.nextTier].minClues) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {tierProgress.maxed && (
                  <p className="text-amber-400 text-xs mt-1">🏆 Maximum tier reached!</p>
                )}
              </div>
            </div>
          )}

          {showResult === 'close' && (
            <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🤏</span>
                <span className="text-amber-300 font-bold">Close! Try being more specific.</span>
              </div>
              <p className="text-gray-400 text-sm">
                You&apos;re on the right track. Check the research link for more details.
              </p>
            </div>
          )}

          {showResult === 'incorrect' && (
            <div className="bg-red-900/40 border border-red-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">❌</span>
                <span className="text-red-300 font-bold">Not quite right...</span>
              </div>
              <p className="text-gray-400 text-sm">
                {failedAttempts >= 2 && !multipleChoiceOptions
                  ? 'Multiple choice options are now available above.'
                  : 'Try again! Visit the research link above for clues.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 p-4 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-bold text-sm"
          >
            {showResult === 'correct' ? 'Continue' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResearchStation
