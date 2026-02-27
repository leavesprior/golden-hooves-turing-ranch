'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

interface DOSMessageProps {
  text: string
  speed?: number        // ms per character (default 30)
  onComplete?: () => void
  className?: string
  sfxEvery?: number     // play click every N chars (0 = disabled)
}

export function DOSMessage({ text, speed = 30, onComplete, className = '', sfxEvery = 4 }: DOSMessageProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevTextRef = useRef(text)

  // Reset on new text
  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text
      setDisplayed('')
      setDone(false)
      indexRef.current = 0
    }
  }, [text])

  useEffect(() => {
    if (done) return
    timerRef.current = setInterval(() => {
      indexRef.current++
      const next = text.slice(0, indexRef.current)
      setDisplayed(next)
      if (sfxEvery > 0 && indexRef.current % sfxEvery === 0) {
        import('@/app/oregon-trail/lib/audioManager')
          .then(({ playSFX }) => playSFX('click'))
          .catch(() => {})
      }
      if (indexRef.current >= text.length) {
        clearInterval(timerRef.current!)
        setDone(true)
        onComplete?.()
      }
    }, speed)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [text, speed, done, onComplete, sfxEvery])

  const handleClick = useCallback(() => {
    if (!done) {
      if (timerRef.current) clearInterval(timerRef.current)
      setDisplayed(text)
      setDone(true)
      indexRef.current = text.length
      onComplete?.()
    }
  }, [done, text, onComplete])

  return (
    <p
      onClick={handleClick}
      className={`font-mono text-amber-200 text-sm cursor-pointer select-none ${className}`}
    >
      {displayed}
      {!done && <span className="animate-pulse">_</span>}
    </p>
  )
}
