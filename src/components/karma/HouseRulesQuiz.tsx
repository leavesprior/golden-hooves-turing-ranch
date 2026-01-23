'use client'

import React, { useState, useCallback } from 'react'
import { useKarma } from '@/lib/karmaContext'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

// Actual house rules questions for Back of Beyond Ranch
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the quiet hours at the cabin?',
    options: ['8 PM - 8 AM', '10 PM - 8 AM', '9 PM - 9 AM', 'No quiet hours'],
    correctIndex: 1,
    explanation: 'Quiet hours are 10 PM to 8 AM to respect neighbors and wildlife.',
  },
  {
    id: 2,
    question: 'Are pets allowed at Back of Beyond Ranch?',
    options: ['Yes, all pets welcome', 'Yes, with prior approval and fee', 'No pets allowed', 'Only cats allowed'],
    correctIndex: 1,
    explanation: 'Pets require prior approval and there is a pet fee to cover extra cleaning.',
  },
  {
    id: 3,
    question: 'What is the standard checkout time?',
    options: ['10 AM', '11 AM', '12 PM (Noon)', '2 PM'],
    correctIndex: 1,
    explanation: 'Checkout is at 11 AM to allow time for cleaning before the next guests.',
  },
  {
    id: 4,
    question: 'How should you dispose of trash when leaving?',
    options: ['Leave it in the kitchen', 'Take it to the bear-proof bins outside', 'Leave it on the porch', 'Burn it in the fireplace'],
    correctIndex: 1,
    explanation: 'All trash must go in bear-proof bins to prevent wildlife encounters.',
  },
  {
    id: 5,
    question: 'What should you do if you see a bear near the property?',
    options: ['Feed it', 'Approach for photos', 'Stay inside and make noise', 'Run towards it'],
    correctIndex: 2,
    explanation: 'Stay inside, make noise to scare it away, and never approach or feed bears.',
  },
  {
    id: 6,
    question: 'Is smoking allowed inside the cabin?',
    options: ['Yes, anywhere', 'Yes, only in bedrooms', 'No, outside only in designated areas', 'No, not allowed anywhere on property'],
    correctIndex: 2,
    explanation: 'Smoking is only permitted outside in designated areas, never inside.',
  },
  {
    id: 7,
    question: 'What is the maximum occupancy of the main cabin?',
    options: ['4 guests', '6 guests', '8 guests', '10 guests'],
    correctIndex: 2,
    explanation: 'The cabin comfortably accommodates up to 8 guests.',
  },
  {
    id: 8,
    question: 'How should you handle the fireplace before leaving?',
    options: ['Leave it burning for warmth', 'Ensure fire is completely out and screen closed', 'Close the flue only', 'Cover with blankets'],
    correctIndex: 1,
    explanation: 'Always ensure the fire is completely out and the screen is closed for safety.',
  },
  {
    id: 9,
    question: 'Where should you park your vehicle?',
    options: ['On the lawn', 'In the designated driveway area', 'On the street', 'Anywhere convenient'],
    correctIndex: 1,
    explanation: 'Park only in designated driveway areas to protect the property.',
  },
  {
    id: 10,
    question: 'What should you do if something breaks or malfunctions?',
    options: ['Hide it and hope no one notices', 'Try to fix it yourself', 'Contact the host immediately', 'Leave a note when you checkout'],
    correctIndex: 2,
    explanation: 'Always contact the host immediately so issues can be addressed promptly.',
  },
]

interface HouseRulesQuizProps {
  isOpen: boolean
  onClose: () => void
}

export function HouseRulesQuiz({ isOpen, onClose }: HouseRulesQuizProps) {
  const { recordHouseRulesCompletion, hasCompletedHouseRules } = useKarma()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const question = QUIZ_QUESTIONS[currentQuestion]

  const handleAnswer = useCallback((index: number) => {
    if (showExplanation) return  // Already answered

    setSelectedAnswer(index)
    setShowExplanation(true)

    if (index === question.correctIndex) {
      setCorrectAnswers(prev => prev + 1)
    }
  }, [showExplanation, question.correctIndex])

  const handleNext = useCallback(() => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      // Quiz complete
      const finalScore = selectedAnswer === question.correctIndex
        ? correctAnswers + 1
        : correctAnswers
      recordHouseRulesCompletion(finalScore)
      setIsComplete(true)
    }
  }, [currentQuestion, correctAnswers, selectedAnswer, question.correctIndex, recordHouseRulesCompletion])

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setCorrectAnswers(0)
    setIsComplete(false)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-amber-500 rounded-lg max-w-lg w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="border-b-2 border-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-amber-200 text-lg">House Rules Quiz</h2>
            <button
              onClick={onClose}
              className="text-amber-400 hover:text-amber-200 transition-colors text-2xl"
            >
              &times;
            </button>
          </div>
          {!isComplete && (
            <div className="text-amber-400 text-xs mt-2 font-pixel">
              Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isComplete ? (
            // Results screen
            <div className="text-center py-4">
              <div className="text-6xl mb-4">
                {correctAnswers >= 8 ? '\ud83c\udfc6' : correctAnswers >= 5 ? '\u2b50' : '\ud83d\udcda'}
              </div>
              <h3 className="font-pixel text-amber-200 text-xl mb-2">
                Quiz Complete!
              </h3>
              <div className="text-amber-100 text-lg mb-4 font-pixel">
                Score: {correctAnswers} / {QUIZ_QUESTIONS.length}
              </div>
              <p className="text-amber-300 text-sm mb-6">
                {correctAnswers >= 8
                  ? 'Excellent! You know the house rules perfectly!'
                  : correctAnswers >= 5
                  ? 'Good job! You have a solid understanding of the rules.'
                  : 'Review the house rules to be a better guest!'}
              </p>
              <div className="text-green-400 text-sm font-pixel mb-4">
                +{20 + correctAnswers * 5} Lawful | +{correctAnswers * 3} Good
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-2 border-amber-500 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-2 border-green-500 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Question screen
            <>
              <p className="text-amber-100 font-pixel text-sm mb-6">
                {question.question}
              </p>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index
                  const isCorrect = index === question.correctIndex
                  const showResult = showExplanation

                  let buttonClass = 'bg-amber-800/50 border-amber-600 text-amber-100 hover:bg-amber-700/50'

                  if (showResult) {
                    if (isCorrect) {
                      buttonClass = 'bg-green-700/80 border-green-500 text-green-100'
                    } else if (isSelected && !isCorrect) {
                      buttonClass = 'bg-red-700/80 border-red-500 text-red-100'
                    } else {
                      buttonClass = 'bg-amber-800/30 border-amber-700 text-amber-400'
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={showExplanation}
                      className={`
                        w-full px-4 py-3 text-left font-pixel text-xs
                        border-2 rounded transition-all
                        ${buttonClass}
                        ${showExplanation ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  )
                })}
              </div>

              {showExplanation && (
                <div className="mt-4 p-3 bg-amber-950/80 border border-amber-600 rounded">
                  <p className="text-amber-200 text-xs font-pixel">
                    {selectedAnswer === question.correctIndex ? '\u2705 Correct!' : '\u274c Incorrect.'} {question.explanation}
                  </p>
                </div>
              )}

              {showExplanation && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-amber-100 font-pixel text-sm rounded border-2 border-amber-400 transition-colors"
                  >
                    {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Next' : 'Finish'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress bar */}
        {!isComplete && (
          <div className="px-6 pb-4">
            <div className="h-2 bg-amber-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((currentQuestion + (showExplanation ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HouseRulesQuiz
