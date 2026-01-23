'use client'

import React, { useState, useCallback } from 'react'
import { useKarmaWallet } from '../karmaWalletContext'

interface KarmaConvertModalProps {
  isOpen: boolean
  onClose: () => void
  neededAmount: number
  karmaType: 'neutral' | 'good'
  onSuccess?: () => void
}

/**
 * KarmaConvertModal - Shows options when player can't afford a purchase
 *
 * ┌─────────────────────────────────────┐
 * │ ⚠️ Insufficient Neutral Karma       │
 * │                                     │
 * │ You need 20🪙 but only have 5🪙     │
 * │                                     │
 * │ Options:                            │
 * │ ○ Convert Good Karma (30🍪 → 15🪙)  │
 * │ ○ Take Debt (+15🪨)                 │
 * │                                     │
 * │ [Convert] [Take Debt] [Cancel]      │
 * └─────────────────────────────────────┘
 */
export function KarmaConvertModal({
  isOpen,
  onClose,
  neededAmount,
  karmaType,
  onSuccess,
}: KarmaConvertModalProps) {
  const { balance, convertGoodToNeutral, takeDebt } = useKarmaWallet()
  const [selectedOption, setSelectedOption] = useState<'convert' | 'debt' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const currentAmount = karmaType === 'neutral' ? balance.neutral : balance.good
  const shortfall = Math.ceil(neededAmount - currentAmount)

  // Calculate how much good karma needed to convert (2:1 ratio)
  const goodKarmaToConvert = Math.ceil(shortfall * 2)
  const canConvert = balance.good >= goodKarmaToConvert

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (!canConvert) return

    setIsProcessing(true)
    try {
      const success = await convertGoodToNeutral(goodKarmaToConvert)
      if (success) {
        onSuccess?.()
        onClose()
      }
    } finally {
      setIsProcessing(false)
    }
  }, [canConvert, goodKarmaToConvert, convertGoodToNeutral, onSuccess, onClose])

  // Handle taking debt
  const handleTakeDebt = useCallback(async () => {
    setIsProcessing(true)
    try {
      const success = await takeDebt(shortfall)
      if (success) {
        onSuccess?.()
        onClose()
      }
    } finally {
      setIsProcessing(false)
    }
  }, [shortfall, takeDebt, onSuccess, onClose])

  if (!isOpen) return null

  const karmaEmoji = karmaType === 'neutral' ? '🪙' : '🍪'
  const karmaName = karmaType === 'neutral' ? 'Neutral' : 'Good'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border-2 border-amber-600 rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-amber-900/60 p-4 border-b border-amber-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h2 className="text-amber-200 font-bold">Insufficient {karmaName} Karma</h2>
              <p className="text-amber-400 text-sm">
                You need {neededAmount}{karmaEmoji} but only have {Math.floor(currentAmount)}{karmaEmoji}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-4">
          <p className="text-gray-400 text-sm">Choose how to cover the shortfall of {shortfall}{karmaEmoji}:</p>

          {/* Convert Good Karma Option */}
          <button
            onClick={() => setSelectedOption('convert')}
            disabled={!canConvert || isProcessing}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'convert'
                ? 'bg-amber-900/60 border-amber-400'
                : canConvert
                ? 'bg-gray-800/60 border-gray-600 hover:border-amber-600'
                : 'bg-gray-900/60 border-gray-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedOption === 'convert' ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
              }`}>
                {selectedOption === 'convert' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-200 font-bold">Convert Good Karma</span>
                  {!canConvert && (
                    <span className="text-red-400 text-xs">(Insufficient)</span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Sacrifice {goodKarmaToConvert}🍪 to receive {Math.floor(goodKarmaToConvert / 2)}🪙
                </p>
                <p className="text-amber-500 text-xs mt-1">
                  You have {Math.floor(balance.good)}🍪 Good Karma
                </p>
              </div>
            </div>
          </button>

          {/* Take Debt Option */}
          <button
            onClick={() => setSelectedOption('debt')}
            disabled={isProcessing}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'debt'
                ? 'bg-red-900/60 border-red-400'
                : 'bg-gray-800/60 border-gray-600 hover:border-red-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedOption === 'debt' ? 'border-red-400 bg-red-400' : 'border-gray-500'
              }`}>
                {selectedOption === 'debt' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-200 font-bold">Take Debt</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Receive {shortfall}🪙 now, but gain {shortfall}🪨 Bad Karma
                </p>
                <p className="text-red-400 text-xs mt-1">
                  Current Bad Karma: {Math.floor(balance.bad)}🪨
                </p>
              </div>
            </div>
          </button>

          {/* Info about Bad Karma */}
          {selectedOption === 'debt' && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-xs">
                <span className="font-bold">Warning:</span> Bad Karma has consequences.
                It may affect random events, NPC interactions, and your final score.
              </p>
            </div>
          )}

          {/* Conversion info */}
          {selectedOption === 'convert' && canConvert && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
              <p className="text-amber-300 text-xs">
                Good Karma converts at 2:1 ratio. You'll sacrifice {goodKarmaToConvert}🍪
                and receive {Math.floor(goodKarmaToConvert / 2)}🪙.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-bold text-sm disabled:opacity-50"
          >
            Cancel
          </button>

          {selectedOption === 'convert' && (
            <button
              onClick={handleConvert}
              disabled={!canConvert || isProcessing}
              className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-bold text-sm disabled:opacity-50"
            >
              {isProcessing ? 'Converting...' : `Convert ${goodKarmaToConvert}🍪`}
            </button>
          )}

          {selectedOption === 'debt' && (
            <button
              onClick={handleTakeDebt}
              disabled={isProcessing}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-red-100 rounded font-bold text-sm disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Take ${shortfall}🪨 Debt`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * InsufficientKarmaPrompt - Simpler inline prompt for when player can't afford something
 */
interface InsufficientKarmaPromptProps {
  neededAmount: number
  currentAmount: number
  karmaType: 'neutral' | 'good'
  onOpenConvertModal: () => void
}

export function InsufficientKarmaPrompt({
  neededAmount,
  currentAmount,
  karmaType,
  onOpenConvertModal,
}: InsufficientKarmaPromptProps) {
  const karmaEmoji = karmaType === 'neutral' ? '🪙' : '🍪'

  return (
    <div className="bg-red-900/30 border border-red-600 rounded p-3 text-center">
      <p className="text-red-300 text-sm mb-2">
        Insufficient karma! Need {neededAmount}{karmaEmoji}, have {Math.floor(currentAmount)}{karmaEmoji}
      </p>
      <button
        onClick={onOpenConvertModal}
        className="px-4 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded text-xs font-bold"
      >
        Get More Karma
      </button>
    </div>
  )
}

export default KarmaConvertModal
