'use client'

import React, { useEffect, useState } from 'react'
import { useNarrator, getNarratorMoodColor, getNarratorAvatar, type NarratorComment } from '../narratorContext'

interface NarratorOverlayProps {
  position?: 'top' | 'bottom' | 'corner'
  autoHide?: boolean
  showReliability?: boolean
}

export function NarratorOverlay({ position = 'bottom', autoHide = true, showReliability = false }: NarratorOverlayProps) {
  const { state, dismissComment, getReliabilityPercent, isReliable } = useNarrator()
  const [isHiding, setIsHiding] = useState(false)

  const comment = state.activeComment

  // Auto-hide animation
  useEffect(() => {
    if (comment && autoHide) {
      setIsHiding(false)
      const timer = setTimeout(() => {
        setIsHiding(true)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [comment, autoHide])

  if (!comment) return null

  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    corner: 'bottom-4 right-4'
  }

  return (
    <div
      className={`fixed z-40 max-w-md transition-all duration-500 ${positionClasses[position]} ${
        isHiding ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
      onClick={dismissComment}
    >
      <div className={`bg-gray-900/95 border rounded-lg p-4 shadow-xl cursor-pointer ${
        state.mood === 'drinking' ? 'border-red-600 animate-pulse' : 'border-gray-600'
      }`}>
        {/* Narrator Avatar and Mood */}
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getNarratorAvatar(state.mood)}</span>
          <div className="flex-1">
            {/* Narrator Label */}
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-medium ${getNarratorMoodColor(state.mood)}`}>
                THE NARRATOR
                {state.mood !== 'neutral' && ` (${state.mood})`}
              </span>
              {showReliability && (
                <span className={`text-xs ${isReliable() ? 'text-gray-500' : 'text-red-500'}`}>
                  {getReliabilityPercent()}% reliable
                </span>
              )}
            </div>

            {/* Comment Text */}
            <p className={`text-gray-300 text-sm italic ${
              comment.isLie ? 'decoration-wavy decoration-red-500/50' : ''
            }`}>
              {comment.text}
            </p>

            {/* Category indicator */}
            {comment.category !== 'observation' && (
              <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                comment.category === 'lie' ? 'bg-red-900 text-red-300' :
                comment.category === 'warning' ? 'bg-amber-900 text-amber-300' :
                comment.category === 'fourth_wall' ? 'bg-purple-900 text-purple-300' :
                comment.category === 'withholding' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-700 text-gray-400'
              }`}>
                {comment.category.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Click to dismiss hint */}
        <p className="text-gray-600 text-xs mt-2 text-right">click to dismiss</p>
      </div>
    </div>
  )
}

// Inline narrator comment (for embedding in text)
interface InlineNarratorProps {
  text: string
  mood?: NarratorComment['mood']
}

export function InlineNarrator({ text, mood = 'neutral' }: InlineNarratorProps) {
  return (
    <span className={`italic ${getNarratorMoodColor(mood)}`}>
      [{text}]
    </span>
  )
}

// Narrator dialogue box (for longer interactions)
interface NarratorDialogueProps {
  text: string
  responses?: Array<{ text: string; action: () => void }>
  onDismiss: () => void
}

export function NarratorDialogue({ text, responses, onDismiss }: NarratorDialogueProps) {
  const { state } = useNarrator()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-600 rounded-lg max-w-lg w-full p-6">
        {/* Narrator Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700">
          <span className="text-3xl">{getNarratorAvatar(state.mood)}</span>
          <div>
            <h3 className={`font-bold ${getNarratorMoodColor(state.mood)}`}>THE NARRATOR</h3>
            {state.fourthWallBroken && (
              <span className="text-purple-500 text-xs">Fourth Wall Broken</span>
            )}
          </div>
        </div>

        {/* Dialogue Text */}
        <p className="text-gray-300 mb-6 leading-relaxed italic">
          {text}
        </p>

        {/* Responses or Dismiss */}
        {responses && responses.length > 0 ? (
          <div className="space-y-2">
            {responses.map((response, index) => (
              <button
                key={index}
                onClick={response.action}
                className="w-full p-2 text-left bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
              >
                {response.text}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={onDismiss}
            className="w-full py-2 bg-purple-800 text-purple-200 rounded hover:bg-purple-700"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

// Narrator reliability indicator
interface ReliabilityIndicatorProps {
  compact?: boolean
}

export function ReliabilityIndicator({ compact = false }: ReliabilityIndicatorProps) {
  const { state, getReliabilityPercent, isReliable } = useNarrator()

  const reliability = getReliabilityPercent()
  const reliable = isReliable()

  if (compact) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${
        reliable ? 'bg-gray-800' : 'bg-red-900/50'
      }`} title={`Narrator is ${reliability}% reliable`}>
        <span className="text-sm">{getNarratorAvatar(state.mood)}</span>
        {!reliable && <span className="text-red-400 text-xs">*hic*</span>}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-400 text-xs">Narrator Reliability</span>
        <span className={`text-xs ${reliable ? 'text-gray-400' : 'text-red-400'}`}>
          {reliability}%
        </span>
      </div>
      <div className="w-full h-1 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full transition-all ${
            reliability > 70 ? 'bg-emerald-500' :
            reliability > 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${reliability}%` }}
        />
      </div>
      {state.intoxication > 0 && (
        <p className="text-red-400 text-xs mt-1 italic">*hic*</p>
      )}
    </div>
  )
}

// Fourth wall crack visual effect
interface FourthWallCrackProps {
  intensity?: number  // 1-10
}

export function FourthWallCrack({ intensity = 5 }: FourthWallCrackProps) {
  const { state } = useNarrator()

  if (!state.fourthWallBroken) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: `radial-gradient(circle at ${50 + (Math.random() * 20 - 10)}% ${50 + (Math.random() * 20 - 10)}%, transparent 0%, rgba(128, 0, 128, ${0.02 * intensity}) 100%)`,
      }}
    >
      {/* Crack lines */}
      <svg className="w-full h-full opacity-20">
        <line
          x1={`${40 + Math.random() * 20}%`}
          y1="0"
          x2={`${40 + Math.random() * 20}%`}
          y2="100%"
          stroke="purple"
          strokeWidth="1"
          strokeDasharray="5,10"
        />
        <line
          x1="0"
          y1={`${40 + Math.random() * 20}%`}
          x2="100%"
          y2={`${40 + Math.random() * 20}%`}
          stroke="purple"
          strokeWidth="1"
          strokeDasharray="10,5"
        />
      </svg>
    </div>
  )
}

export default NarratorOverlay
