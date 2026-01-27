'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import {
  generateKarmaDiscountCode,
  getNextTierProgress,
  getQualifyingTier,
  DISCOUNT_TIERS,
  ALIGNMENT_DISPLAY_NAMES,
  type KarmaAdjustedCode,
  type DiscountTier,
} from '../data/discountEngine'

interface DiscountRewardProps {
  isOpen: boolean
  onClose: () => void
  caseId?: string
}

/**
 * DiscountReward - Modal showing earned BOBR discount code
 *
 * Displays the discount code earned from solving mysteries,
 * with karma alignment affecting the final discount percentage.
 *
 * ┌─────────────────────────────────────────┐
 * │ 🎉 Congratulations, Detective!          │
 * │                                         │
 * │ You've earned a discount code:          │
 * │                                         │
 * │ ┌─────────────────────────────────────┐ │
 * │ │   BOBR-D08-1705708800-A3F2          │ │
 * │ │              [📋 Copy]              │ │
 * │ └─────────────────────────────────────┘ │
 * │                                         │
 * │ 8% off your BOBR stay!                  │
 * │ Valid for 30 days                       │
 * │                                         │
 * │ Lawful Good alignment: 1.5x bonus!      │
 * │ Final discount: 12%                     │
 * │                                         │
 * │ [Close]                                 │
 * └─────────────────────────────────────────┘
 */
export function DiscountReward({
  isOpen,
  onClose,
  caseId = 'default',
}: DiscountRewardProps) {
  const { getKarmaAlignment, getAlignmentDisplayName, getDiscountMultiplier } = useKarmaWallet()
  const { getCorrectClueCount } = useMystery()

  const [copied, setCopied] = useState(false)

  // Generate the discount code
  const discountCode = useMemo((): KarmaAdjustedCode | null => {
    const cluesCollected = getCorrectClueCount()
    const alignment = getKarmaAlignment()
    return generateKarmaDiscountCode(cluesCollected, alignment, caseId)
  }, [getCorrectClueCount, getKarmaAlignment, caseId])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!discountCode) return

    try {
      await navigator.clipboard.writeText(discountCode.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [discountCode])

  // Get tier display info
  const getTierEmoji = (tier: DiscountTier): string => {
    switch (tier) {
      case 'recruit': return '🔰'
      case 'detective': return '🔍'
      case 'inspector': return '🎖️'
      case 'chief': return '👑'
    }
  }

  const getTierTitle = (tier: DiscountTier): string => {
    switch (tier) {
      case 'recruit': return 'Recruit'
      case 'detective': return 'Detective'
      case 'inspector': return 'Inspector'
      case 'chief': return 'Chief'
    }
  }

  if (!isOpen) return null

  // No discount earned yet
  if (!discountCode) {
    const cluesCollected = getCorrectClueCount()
    const progress = getNextTierProgress(cluesCollected)

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
        <div className="bg-gray-900 border-2 border-gray-600 rounded-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800/60 p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="text-gray-200 font-bold">No Discount Yet</h2>
                <p className="text-gray-400 text-sm">Keep investigating to earn rewards!</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 space-y-4">
            <div className="bg-gray-800/60 rounded-lg p-4">
              <p className="text-gray-300 mb-2">
                Clues collected: <span className="text-amber-300 font-bold">{cluesCollected}</span>
              </p>
              {!progress.maxed && progress.nextTier && (
                <>
                  <p className="text-gray-400 text-sm mb-2">
                    {progress.cluesNeeded} more clue{progress.cluesNeeded !== 1 ? 's' : ''} to unlock{' '}
                    <span className="text-amber-300">{DISCOUNT_TIERS[progress.nextTier].discount}% off</span>
                  </p>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${(cluesCollected / DISCOUNT_TIERS[progress.nextTier].minClues) * 100}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Tier breakdown */}
            <div className="space-y-2">
              <p className="text-gray-500 text-sm font-bold">Discount Tiers:</p>
              {(['recruit', 'detective', 'inspector', 'chief'] as DiscountTier[]).map((tier) => {
                const tierInfo = DISCOUNT_TIERS[tier]
                const isUnlocked = cluesCollected >= tierInfo.minClues
                return (
                  <div
                    key={tier}
                    className={`flex items-center justify-between px-3 py-2 rounded ${
                      isUnlocked ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800/30'
                    }`}
                  >
                    <span className={isUnlocked ? 'text-green-300' : 'text-gray-500'}>
                      {getTierEmoji(tier)} {getTierTitle(tier)}
                    </span>
                    <span className={isUnlocked ? 'text-green-300' : 'text-gray-500'}>
                      {tierInfo.minClues} clues = {tierInfo.discount}% off
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-4">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-bold text-sm"
            >
              Keep Investigating
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show discount code
  const alignment = getKarmaAlignment()
  const multiplier = getDiscountMultiplier()
  const hasBonus = discountCode.finalDiscount > discountCode.baseDiscount
  const hasPenalty = discountCode.finalDiscount < discountCode.baseDiscount

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border-2 border-amber-600 rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-amber-900/60 p-4 border-b border-amber-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h2 className="text-amber-200 font-bold">Congratulations, {getTierTitle(discountCode.tier)}!</h2>
              <p className="text-amber-400 text-sm">You've earned a Golden Frog discount code</p>
            </div>
          </div>
        </div>

        {/* Discount Code */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-800 border-2 border-dashed border-amber-500 rounded-lg p-4">
            <p className="text-center text-2xl font-mono text-amber-200 tracking-wider mb-3">
              {discountCode.code}
            </p>
            <button
              onClick={handleCopy}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-bold text-sm flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Discount Details */}
          <div className="bg-gray-800/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Rank:</span>
              <span className="text-amber-300 font-bold">
                {getTierEmoji(discountCode.tier)} {getTierTitle(discountCode.tier)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Base Discount:</span>
              <span className="text-gray-200">{discountCode.baseDiscount}%</span>
            </div>
            {(hasBonus || hasPenalty) && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Alignment:</span>
                <span className={hasBonus ? 'text-green-400' : 'text-red-400'}>
                  {ALIGNMENT_DISPLAY_NAMES[alignment]} ({multiplier}x)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-700 pt-2 mt-2">
              <span className="text-gray-400 font-bold">Final Discount:</span>
              <span className="text-amber-300 text-xl font-bold">{discountCode.finalDiscount}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Valid for:</span>
              <span className="text-gray-400">{discountCode.validDays} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Expires:</span>
              <span className="text-gray-400">
                {new Date(discountCode.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Karma Message */}
          {discountCode.karmaMessage && (
            <div
              className={`border rounded-lg p-3 ${
                hasBonus
                  ? 'bg-green-900/30 border-green-700'
                  : 'bg-red-900/30 border-red-700'
              }`}
            >
              <p className={hasBonus ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                {discountCode.karmaMessage}
              </p>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
            <p className="text-cyan-300 text-sm">
              <span className="font-bold">How to use:</span> Enter this code when booking your
              stay at Back of Beyond Ranch to receive your discount.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-bold"
          >
            Continue Adventure
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * DiscountProgressBar - Inline component showing discount tier progress
 */
interface DiscountProgressBarProps {
  onShowReward?: () => void
}

export function DiscountProgressBar({ onShowReward }: DiscountProgressBarProps) {
  const { getCorrectClueCount } = useMystery()
  const cluesCollected = getCorrectClueCount()
  const progress = getNextTierProgress(cluesCollected)
  const currentTier = getQualifyingTier(cluesCollected)

  const getTierEmoji = (tier: DiscountTier | null): string => {
    if (!tier) return '🔒'
    switch (tier) {
      case 'recruit': return '🔰'
      case 'detective': return '🔍'
      case 'inspector': return '🎖️'
      case 'chief': return '👑'
    }
  }

  return (
    <div className="bg-gray-800/60 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">Discount Progress</span>
        {currentTier && (
          <button
            onClick={onShowReward}
            className="text-amber-400 hover:text-amber-300 text-sm underline"
          >
            View Code
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">{getTierEmoji(currentTier)}</span>
        <div className="flex-1">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{
                width: progress.maxed
                  ? '100%'
                  : progress.nextTier
                  ? `${(cluesCollected / DISCOUNT_TIERS[progress.nextTier].minClues) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {progress.maxed ? '🏆 Maximum tier!' : progress.message}
          </p>
        </div>
        <span className="text-amber-300 font-bold text-sm">{cluesCollected} clues</span>
      </div>
    </div>
  )
}

export default DiscountReward
