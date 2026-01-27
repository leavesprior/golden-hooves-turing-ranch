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

import React, { useState, useCallback } from 'react'
import {
  BRIDGE_KEEPER_INTRO,
  BRIDGE_QUESTIONS,
  BRIDGE_KEEPER_SUCCESS,
  BRIDGE_KEEPER_SWALLOW_REVERSAL,
  checkBridgeAnswer,
  type BridgeQuestion,
} from '../data/adamsEasterEggs'

interface BridgeKeeperProps {
  playerName: string
  onSuccess: () => void
  onFailure: () => void
  onCancel: () => void
}

type Phase = 'intro' | 'questioning' | 'success' | 'failure' | 'reversal'

export function BridgeKeeper({
  playerName,
  onSuccess,
  onFailure,
  onCancel,
}: BridgeKeeperProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [dialogue, setDialogue] = useState(
    BRIDGE_KEEPER_INTRO[Math.floor(Math.random() * BRIDGE_KEEPER_INTRO.length)]
  )
  const [questionsAsked, setQuestionsAsked] = useState<BridgeQuestion[]>([])

  // Select 3 random questions (always include name and quest, then one random)
  const getQuestions = useCallback(() => {
    const mandatory = BRIDGE_QUESTIONS.slice(0, 3) // name, quest, color
    const tricky = BRIDGE_QUESTIONS.slice(3) // capital, swallow
    const randomTricky = tricky[Math.floor(Math.random() * tricky.length)]

    // 30% chance to get the tricky question instead of color
    if (Math.random() < 0.3) {
      return [mandatory[0], mandatory[1], randomTricky]
    }
    return mandatory
  }, [])

  const [questions] = useState(() => getQuestions())

  const handleStartQuestions = () => {
    setPhase('questioning')
    setDialogue(questions[0].question)
    setQuestionsAsked([questions[0]])
  }

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = checkBridgeAnswer(currentQuestion, answer)

    // Special case: asking about swallow type reverses the encounter
    if (currentQuestion.isSwallowQuestion &&
        (answer.toLowerCase().includes('african') ||
         answer.toLowerCase().includes('european') ||
         answer.toLowerCase().includes('what do you mean'))) {
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
      onSuccess()
    } else if (phase === 'failure') {
      onFailure()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-slate-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 p-4 text-center border-b-2 border-slate-500">
          <h1 className="text-xl font-bold text-slate-200">The Bridge of Death</h1>
          <p className="text-slate-400 text-sm">A Mysterious Encounter</p>
        </div>

        {/* Bridge Keeper Image (ASCII art style) */}
        <div className="bg-slate-950 p-4 text-center font-mono text-xs text-slate-500">
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
          <div className="bg-slate-800/50 border border-slate-600 rounded p-4 mb-4">
            <p className="text-slate-200 text-center italic">
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
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Input area */}
          {phase === 'intro' && (
            <div className="space-y-3">
              <button
                onClick={handleStartQuestions}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded border-2 border-slate-500 transition-colors"
              >
                Approach the Bridge
              </button>
              <button
                onClick={onCancel}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-600 transition-colors"
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
                className="w-full p-3 bg-slate-800 border-2 border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:border-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-amber-100 font-bold rounded border-2 border-amber-600 disabled:border-slate-600 transition-colors"
              >
                Answer
              </button>

              {/* Hint for the swallow question */}
              {questions[currentQuestionIndex]?.isSwallowQuestion && (
                <p className="text-slate-500 text-xs text-center">
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
        <div className="bg-slate-800 p-3 text-center border-t border-slate-600">
          <p className="text-slate-500 text-xs">
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
