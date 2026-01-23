'use client'

import React, { useEffect, useState } from 'react'
import { useKarma, KarmaToast as ToastType, ALIGNMENT_DISPLAY_NAMES } from '@/lib/karmaContext'

// Format karma delta for display
function formatDelta(value: number, axis: 'lawful' | 'good'): string {
  if (value === 0) return ''

  const labels = {
    lawful: { negative: 'Lawful', positive: 'Chaotic' },
    good: { negative: 'Good', positive: 'Evil' },
  }

  const label = value < 0 ? labels[axis].negative : labels[axis].positive
  const absValue = Math.abs(value)
  const sign = value < 0 ? '+' : '+'  // Both show + since negative lawful = more lawful

  return `${sign}${absValue} ${label}`
}

interface SingleToastProps {
  toast: ToastType
  onDismiss: () => void
}

function SingleToast({ toast, onDismiss }: SingleToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true))

    // Start exit animation after 3.5s
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 3500)

    // Actually dismiss after animation
    const dismissTimer = setTimeout(() => {
      onDismiss()
    }, 4000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  // Determine if this is a "good" or "bad" karma change
  const isPositive = toast.lawfulDelta < 0 || toast.goodDelta < 0  // Negative = lawful/good
  const isNegative = toast.lawfulDelta > 0 || toast.goodDelta > 0  // Positive = chaotic/evil

  const bgColor = isPositive && !isNegative
    ? 'bg-gradient-to-r from-yellow-900/95 to-amber-900/95 border-yellow-500'
    : isNegative && !isPositive
    ? 'bg-gradient-to-r from-red-900/95 to-orange-900/95 border-red-500'
    : 'bg-gradient-to-r from-gray-900/95 to-slate-900/95 border-gray-500'

  const iconColor = isPositive && !isNegative
    ? 'text-yellow-400'
    : isNegative && !isPositive
    ? 'text-red-400'
    : 'text-gray-400'

  return (
    <div
      className={`
        ${bgColor}
        border-2
        rounded-lg
        px-4 py-3
        shadow-xl
        font-pixel
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl ${iconColor}`}>
          {isPositive && !isNegative ? '\u2728' : isNegative && !isPositive ? '\u26a0\ufe0f' : '\u2696\ufe0f'}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="text-white text-sm mb-1">
            {toast.message}
          </div>

          {/* Karma deltas */}
          <div className="flex gap-3 text-[10px]">
            {toast.lawfulDelta !== 0 && (
              <span className={toast.lawfulDelta < 0 ? 'text-blue-300' : 'text-purple-300'}>
                {toast.lawfulDelta < 0 ? '+' : ''}{Math.abs(toast.lawfulDelta)} {toast.lawfulDelta < 0 ? 'Lawful' : 'Chaotic'}
              </span>
            )}
            {toast.goodDelta !== 0 && (
              <span className={toast.goodDelta < 0 ? 'text-green-300' : 'text-red-300'}>
                {toast.goodDelta < 0 ? '+' : ''}{Math.abs(toast.goodDelta)} {toast.goodDelta < 0 ? 'Good' : 'Evil'}
              </span>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors text-xs"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

export function KarmaToastContainer() {
  const { toasts, dismissToast } = useKarma()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <SingleToast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default KarmaToastContainer
