'use client'

import React, { useEffect, useState } from 'react'

interface EasterEggToastProps {
  title: string
  description: string
  isVisible: boolean
  onDismiss: () => void
}

export function EasterEggToast({ title, description, isVisible, onDismiss }: EasterEggToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Slight delay for entrance animation
      const timer = setTimeout(() => setShow(true), 100)
      // Auto-dismiss after 8 seconds
      const dismiss = setTimeout(() => {
        setShow(false)
        setTimeout(onDismiss, 300)
      }, 8000)
      return () => { clearTimeout(timer); clearTimeout(dismiss) }
    } else {
      setShow(false)
    }
  }, [isVisible, onDismiss])

  if (!isVisible) return null

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div
        className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-2 border-purple-400 rounded-lg p-4 shadow-2xl max-w-sm cursor-pointer"
        onClick={() => { setShow(false); setTimeout(onDismiss, 300) }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{'\u2728'}</div>
          <div>
            <p className="font-pixel text-purple-200 text-[10px]">Time Echo Discovered!</p>
            <p className="font-pixel text-amber-300 text-xs mt-1">{title}</p>
            <p className="text-purple-300/80 text-[9px] mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
