'use client'

import React, { useState, useEffect } from 'react'
import {
  verifyBookingCode,
  saveBookingVerification,
  isBookingVerified,
  getSupportedFormats,
} from '@/lib/bookingVerification'
import { useCrossGame } from '@/lib/crossGameProgressionContext'

interface BookingGateProps {
  onUnlocked: () => void
  onClose?: () => void
}

export function BookingGate({ onUnlocked, onClose }: BookingGateProps) {
  const { recordMilestone, hasMilestone } = useCrossGame()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [dialogueStep, setDialogueStep] = useState(0)
  const [verified, setVerified] = useState(false)
  const [showInput, setShowInput] = useState(false)

  // Check if already verified
  useEffect(() => {
    if (isBookingVerified() || hasMilestone('booking_verified')) {
      setVerified(true)
    }
  }, [hasMilestone])

  const handleVerify = () => {
    const result = verifyBookingCode(code)
    if (result.valid) {
      saveBookingVerification(code, result.platform)
      recordMilestone('booking_verified', 'prologue', { platform: result.platform })
      setVerified(true)
      setError('')
    } else {
      setError('That code doesn\'t match any known format. Check your confirmation email.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify()
  }

  // If already verified, just call the callback
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(onUnlocked, 1500)
      return () => clearTimeout(timer)
    }
  }, [verified, onUnlocked])

  // Guide dialogue (archaeologist voice)
  const dialogue = [
    '"Ah, a new traveler! Welcome. I\'m the Guide -- your companion through the ancient world."',
    '"Before we begin, I should mention: this particular journey is reserved for guests of Back of Beyond Ranch."',
    '"If you have a booking confirmation, I can verify your passage. The ancient portals are surprisingly bureaucratic about these things."',
  ]

  if (verified) {
    return (
      <div className="bg-gradient-to-b from-indigo-950 via-purple-950 to-black border-4 border-purple-500 p-8 text-center">
        <div className="text-5xl mb-4">{'\uD83D\uDD13'}</div>
        <h2 className="font-pixel text-purple-200 text-sm mb-2">Passage Verified</h2>
        <p className="text-purple-300 text-xs">The ancient portals open before you...</p>
        <div className="mt-4 w-24 h-1 bg-purple-800 mx-auto overflow-hidden rounded">
          <div className="h-full bg-purple-400 animate-pulse" style={{ width: '100%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-indigo-950 via-purple-950 to-black border-4 border-purple-700 min-h-[400px]">
      {/* Header */}
      <div className="p-4 border-b-2 border-purple-700/30 text-center">
        <span className="text-3xl">{'\uD83D\uDCDA'}</span>
        <h2 className="font-pixel text-purple-200 text-[14px] mt-2">
          The Guide
        </h2>
        <p className="font-pixel text-[9px] text-purple-400/60 mt-1">
          A worn leather book floats before you, its pages rustling with anticipation.
        </p>
      </div>

      {/* Dialogue */}
      <div className="p-4">
        <div className="bg-black/40 border-2 border-purple-800 p-4 space-y-3">
          {/* Guide portrait */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-purple-900/60 border-2 border-purple-600 flex items-center justify-center shrink-0">
              <span className="text-2xl">{'\uD83D\uDCD6'}</span>
            </div>
            <div>
              <span className="font-pixel text-[10px] text-purple-300">
                The Guide -- Interdimensional Field Manual
              </span>
            </div>
          </div>

          {/* Dialogue text */}
          <div className="min-h-[80px]">
            {dialogue.slice(0, dialogueStep + 1).map((line, i) => (
              <p
                key={i}
                className={`font-pixel text-[9px] text-purple-100 mt-2 ${
                  i < dialogueStep ? 'opacity-50' : ''
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Navigation / Input */}
          <div className="pt-2 border-t border-purple-800/30">
            {dialogueStep < dialogue.length - 1 ? (
              <button
                onClick={() => setDialogueStep(prev => prev + 1)}
                className="font-pixel text-[10px] text-purple-200 border-2 border-purple-600 px-4 py-2 hover:bg-purple-900/60"
              >
                Continue {'\u25B6'}
              </button>
            ) : !showInput ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full font-pixel text-[11px] text-purple-200 bg-purple-800/60 border-2 border-purple-500 px-4 py-3 hover:bg-purple-700/60 transition-all"
                >
                  {'\uD83D\uDD11'} I HAVE A CONFIRMATION CODE
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-full font-pixel text-[9px] text-purple-400 border border-purple-800 px-4 py-2 hover:text-purple-200"
                  >
                    {'\u2190'} MAYBE LATER
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="font-pixel text-[9px] text-purple-300 block mb-1">
                    Enter your confirmation code:
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => { setCode(e.target.value); setError('') }}
                    onKeyDown={handleKeyDown}
                    placeholder="BOBR-20260301-A1B2"
                    className="w-full bg-black/60 border-2 border-purple-600 text-purple-100 font-pixel text-[10px] px-3 py-2 focus:border-purple-400 outline-none placeholder:text-purple-700"
                    autoFocus
                  />
                  {error && (
                    <p className="font-pixel text-[8px] text-red-400 mt-1">{error}</p>
                  )}
                  <div className="mt-2 text-[8px] text-purple-500">
                    <p className="mb-1">Accepted formats:</p>
                    {getSupportedFormats().map((fmt, i) => (
                      <p key={i}>{'\u2022'} {fmt}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={!code.trim()}
                    className="flex-1 font-pixel text-[10px] text-purple-100 bg-purple-700 border-2 border-purple-500 px-4 py-2 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    VERIFY
                  </button>
                  <button
                    onClick={() => { setShowInput(false); setError('') }}
                    className="font-pixel text-[9px] text-purple-400 border border-purple-800 px-3 py-2 hover:text-purple-200"
                  >
                    BACK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
