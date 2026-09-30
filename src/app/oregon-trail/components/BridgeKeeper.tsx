'use client'

/**
 * Bridge Keeper Encounter
 *
 * "Stop! Who would cross the Bridge of Death must answer me
 * these questions three, ere the other side he see."
 *
 * A Monty Python easter egg that appears randomly at river crossings.
 * Answer correctly and you cross for free. Ask about swallows and... well.
 */

import React, { useState, useCallback, useRef } from 'react'
import type { CharacterBackground } from '../characterContext'
import { PlayerPortrait } from './PlayerPortrait'
import {
  BRIDGE_KEEPER_INTRO,
  BRIDGE_QUESTIONS,
  BRIDGE_KEEPER_SUCCESS,
  BRIDGE_KEEPER_SWALLOW_REVERSAL,
  checkBridgeAnswer,
  isBridgeSwallowReversal,
  type BridgeQuestion,
} from '../data/adamsEasterEggs'

interface BridgeKeeperProps {
  playerName: string
  /** Optional: the standalone DM-table encounter need not have a saved player. */
  playerBackground?: CharacterBackground
  onSuccess: () => void
  onFailure: () => void
  onCancel: () => void
  /**
   * dp-bridge-variant: optional question-set override. When provided, the Keeper
   * poses THESE questions in order (e.g. BRIDGE_QUESTIONS_OTHER_SERIES) instead of
   * the randomized default trio. A wrong answer on any question with a real
   * wrongAnswerEffect routes to the failure path (the chasm). Default behavior is
   * unchanged when omitted.
   */
  questions?: BridgeQuestion[]
  /** Optional intro lines override (themed for the alternate entrance). */
  introLines?: string[]
  /** Optional approach-button label. */
  approachLabel?: string
  /** Optional transcript for the local backroom. Ordinary river outcomes are unchanged. */
  onAnswersComplete?: (answers: readonly string[]) => void
}

type Phase = 'intro' | 'questioning' | 'success' | 'failure' | 'reversal'

export function BridgeKeeper({
  playerName,
  playerBackground,
  onSuccess,
  onFailure,
  onCancel,
  questions: questionsOverride,
  introLines,
  approachLabel = 'Approach the Bridge',
  onAnswersComplete,
}: BridgeKeeperProps) {
  const introPool = introLines && introLines.length > 0 ? introLines : BRIDGE_KEEPER_INTRO
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [dialogue, setDialogue] = useState(
    introPool[Math.floor(Math.random() * introPool.length)]
  )
  const [questionsAsked, setQuestionsAsked] = useState<BridgeQuestion[]>([])
  const submittedAnswers = useRef<string[]>([])

  // Name and quest (the traveller's own), then one question with a real answer.
  // When an override set is supplied (dp-bridge-variant), pose it verbatim.
  const getQuestions = useCallback(() => {
    if (questionsOverride && questionsOverride.length > 0) return questionsOverride
    const [name, quest, ...answerable] = BRIDGE_QUESTIONS // answerable: capital, swallow
    return [name, quest, answerable[Math.floor(Math.random() * answerable.length)]]
  }, [questionsOverride])

  const [questions] = useState(() => getQuestions())

  const handleStartQuestions = () => {
    submittedAnswers.current = []
    setPhase('questioning')
    setDialogue(questions[0].question)
    setQuestionsAsked([questions[0]])
  }

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = checkBridgeAnswer(currentQuestion, answer, playerName)
    submittedAnswers.current[currentQuestionIndex] = answer

    // Special case: asking about swallow type reverses the encounter
    if (isBridgeSwallowReversal(currentQuestion, answer)) {
      setPhase('reversal')
      setDialogue(BRIDGE_KEEPER_SWALLOW_REVERSAL[
        Math.floor(Math.random() * BRIDGE_KEEPER_SWALLOW_REVERSAL.length)
      ])
      return
    }

    if (!isCorrect && currentQuestion.wrongAnswerEffect !== 'none') {
      // Wrong answer on a tricky question
      setPhase('failure')
      setDialogue(currentQuestion.wrongAnswerEffect)
      return
    }

    // Move to next question or success
    if (currentQuestionIndex >= questions.length - 1) {
      setPhase('success')
      setDialogue(BRIDGE_KEEPER_SUCCESS[
        Math.floor(Math.random() * BRIDGE_KEEPER_SUCCESS.length)
      ])
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setDialogue(questions[currentQuestionIndex + 1].question)
      setQuestionsAsked(prev => [...prev, questions[currentQuestionIndex + 1]])
      setAnswer('')
    }
  }

  const handleContinue = () => {
    if (phase === 'success' || phase === 'reversal') {
      onAnswersComplete?.([...submittedAnswers.current])
      onSuccess()
    } else if (phase === 'failure') {
      onFailure()
    }
  }

  // z-[60]: above the fixed Save/Load row (z-50), which covered the dialog foot.
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
      <div className="max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#16130f] border-4 border-[rgba(232,220,196,0.18)] rounded-lg">
        {/* Header */}
        <div className="bg-[#2a241c] p-4 text-center border-b-2 border-[rgba(232,220,196,0.18)]">
          <h1 className="text-xl font-serif text-[#e8dcc4]">The Bridge of Death</h1>
          <p className="text-[#b8a88a] text-sm">A Mysterious Encounter</p>
        </div>

        {playerBackground && (
          <div data-testid="bridge-player" className="flex items-center justify-center gap-3 px-4 pt-4 text-left">
            <PlayerPortrait background={playerBackground} name={playerName} width={48} data-testid="bridge-player-portrait" />
            <div className="min-w-0">
              <p className="text-[#b8a88a] text-xs">At the bridge</p>
              <p className="text-amber-100 text-sm break-words">{playerName}</p>
            </div>
          </div>
        )}

        {/* Bridge Keeper Image (ASCII art style) */}
        <div className="bg-[#0e0c0a] p-4 text-center font-mono text-xs text-[#b8a88a]">
          <pre className="inline-block text-left">{`
      .---.
     /     \\
    | () () |
     \\  ^  /
      |||||
     /|   |\\
    (_|   |_)
          `}</pre>
        </div>

        {/* Dialogue */}
        <div className="p-6">
          <div className="bg-[#0e0c0a]/60 border border-[rgba(232,220,196,0.18)] rounded p-4 mb-4">
            <p className="text-[#e8dcc4] text-center italic">
              "{dialogue}"
            </p>
          </div>

          {/* Progress indicator */}
          {phase === 'questioning' && (
            <div className="flex justify-center gap-2 mb-4">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < currentQuestionIndex
                      ? 'bg-green-500'
                      : i === currentQuestionIndex
                      ? 'bg-yellow-500'
                      : 'bg-[#3a3228]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Input area */}
          {phase === 'intro' && (
            <div className="space-y-3">
              <button
                type="button"
                data-testid="bridge-keeper-approach"
                onClick={handleStartQuestions}
                className="w-full py-3 bg-[#2a241c] hover:bg-[#3a3228] text-[#e8dcc4] font-bold rounded border-2 border-[rgba(232,220,196,0.18)] transition-colors"
              >
                {approachLabel}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-2 bg-[#1d1914] hover:bg-[#2a241c] text-[#b8a88a] rounded border border-[rgba(232,220,196,0.18)] transition-colors"
              >
                Find Another Way
              </button>
            </div>
          )}

          {phase === 'questioning' && (
            <div className="space-y-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                placeholder="Speak your answer..."
                className="w-full p-3 bg-[#1d1914] border-2 border-[rgba(232,220,196,0.18)] rounded text-[#e8dcc4] placeholder-[#b8a88a]/60 focus:border-[#b8a88a] focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                className="w-full py-3 bg-[#e8dcc4] hover:bg-[#f3ead8] disabled:bg-[#2a241c] disabled:text-[#b8a88a] text-[#1a1208] font-bold rounded border-2 border-[#e8dcc4] disabled:border-[rgba(232,220,196,0.18)] transition-colors"
              >
                Answer
              </button>

              {/* Hint for the swallow question */}
              {questions[currentQuestionIndex]?.isSwallowQuestion && (
                <p className="text-[#b8a88a] text-xs text-center">
                  Hint: Perhaps question the question itself...
                </p>
              )}
            </div>
          )}

          {(phase === 'success' || phase === 'failure' || phase === 'reversal') && (
            <div className="space-y-3">
              {phase === 'reversal' && (
                <div className="text-center mb-4">
                  <span className="text-4xl">💨</span>
                  <p className="text-green-400 text-sm mt-2">
                    The Bridge Keeper flew into the gorge! You may cross freely.
                  </p>
                </div>
              )}
              {phase === 'success' && (
                <div className="text-center mb-4">
                  <span className="text-4xl">🌉</span>
                  <p className="text-green-400 text-sm mt-2">
                    You answered correctly. The bridge awaits.
                  </p>
                </div>
              )}
              {phase === 'failure' && (
                <div className="text-center mb-4">
                  <span className="text-4xl">💀</span>
                  <p className="text-red-400 text-sm mt-2">
                    The bridge rejects the unworthy.
                  </p>
                </div>
              )}
              <button
                type="button"
                data-testid={phase === 'failure' ? 'bridge-keeper-fail' : 'bridge-keeper-cross'}
                onClick={handleContinue}
                className={`w-full py-3 font-bold rounded border-2 transition-colors ${
                  phase === 'failure'
                    ? 'bg-red-800 hover:bg-red-700 text-red-100 border-red-600'
                    : 'bg-green-800 hover:bg-green-700 text-green-100 border-green-600'
                }`}
              >
                {phase === 'failure' ? 'Accept Your Fate' : 'Cross the Bridge'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1d1914] p-3 text-center border-t border-[rgba(232,220,196,0.18)]">
          <p className="text-[#b8a88a] text-xs">
            {phase === 'questioning'
              ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
              : 'What is the airspeed velocity of an unladen swallow?'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default BridgeKeeper
