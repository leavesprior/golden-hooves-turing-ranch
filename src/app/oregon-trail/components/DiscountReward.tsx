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
  occupation?: string
}

/**
 * DiscountReward - Gold Rush themed modal showing earned Tobias Gold discount code
 *
 * Uses the enhanced discount engine with Bronze/Silver/Gold/Platinum tiers
 * and occupation multiplier for difficulty-scaled rewards.
 *
 * Tier Requirements:
 *   Bronze:   3 clues                              -> 8% base
 *   Silver:   5 clues + 1 case solved              -> 12% base
 *   Gold:     7 clues + 2 cases solved             -> 16% base
 *   Platinum: 10 clues + 3 cases + outlaw caught   -> 20% base
 *
 * Color palette: Sepia Gold Rush
 *   Primary gold:   #d4a843
 *   Dark gold:      #8b6914
 *   Deep brown:     #2a1f14
 *   Medium brown:   #3d2b18
 *   Warm tan:       #a08050
 *   Dusty bronze:   #6a5030
 *   Shadow brown:   #5a4020
 */
export function DiscountReward({
  isOpen,
  onClose,
  caseId = 'default',
  occupation,
}: DiscountRewardProps) {
  const { getKarmaAlignment, getAlignmentDisplayName, getDiscountMultiplier } = useKarmaWallet()
  const { state: mysteryState, getCorrectClueCount } = useMystery()

  const [copied, setCopied] = useState(false)

  // Derive progress values from mystery state
  const casesSolved = mysteryState.casesSolved?.length || 0
  const outlawCaught = (mysteryState.outlawsCaught ?? 0) > 0

  // Generate the discount code with all multipliers
  const discountCode = useMemo((): KarmaAdjustedCode | null => {
    const cluesCollected = getCorrectClueCount()
    const alignment = getKarmaAlignment()
    return generateKarmaDiscountCode(
      cluesCollected,
      alignment,
      caseId,
      casesSolved,
      outlawCaught,
      occupation as any
    )
  }, [getCorrectClueCount, getKarmaAlignment, caseId, casesSolved, outlawCaught, occupation])

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

  if (!isOpen) return null

  // --- No discount earned yet ------------------------------------------------
  if (!discountCode) {
    const cluesCollected = getCorrectClueCount()
    const progress = getNextTierProgress(cluesCollected, casesSolved, outlawCaught)

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
        <div
          className="rounded-lg w-full max-w-md overflow-hidden border-2"
          style={{ backgroundColor: '#2a1f14', borderColor: '#6a5030' }}
        >
          {/* Header */}
          <div
            className="p-4 border-b"
            style={{ backgroundColor: '#3d2b18', borderColor: '#5a4020' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="font-bold" style={{ color: '#d4a843' }}>
                  No Discount Yet
                </h2>
                <p className="text-sm" style={{ color: '#a08050' }}>
                  Keep investigating to earn rewards!
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#3d2b18' }}>
              <p className="mb-1" style={{ color: '#a08050' }}>
                Clues collected:{' '}
                <span className="font-bold" style={{ color: '#d4a843' }}>
                  {cluesCollected}
                </span>
              </p>
              <p className="mb-2" style={{ color: '#a08050' }}>
                Cases solved:{' '}
                <span className="font-bold" style={{ color: '#d4a843' }}>
                  {casesSolved}
                </span>
              </p>
              {!progress.maxed && progress.nextTier && (
                <>
                  <p className="text-sm mb-2" style={{ color: '#a08050' }}>
                    {progress.message}
                  </p>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#5a4020' }}
                  >
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        backgroundColor: '#d4a843',
                        width: `${Math.min(
                          100,
                          (cluesCollected / DISCOUNT_TIERS[progress.nextTier].minClues) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Tier breakdown with requirements */}
            <div className="space-y-2">
              <p className="text-sm font-bold" style={{ color: '#6a5030' }}>
                Discount Tiers:
              </p>
              {(['bronze', 'silver', 'gold', 'platinum'] as DiscountTier[]).map((tier) => {
                const tierInfo = DISCOUNT_TIERS[tier]
                const meetsClues = cluesCollected >= tierInfo.minClues
                const meetsCases = casesSolved >= tierInfo.minCasesSolved
                const meetsOutlaw = !tierInfo.requiresOutlawCaught || outlawCaught
                const isUnlocked = meetsClues && meetsCases && meetsOutlaw
                return (
                  <div
                    key={tier}
                    className="flex items-center justify-between px-3 py-2 rounded"
                    style={{
                      backgroundColor: isUnlocked ? 'rgba(212, 168, 67, 0.15)' : 'rgba(90, 64, 32, 0.3)',
                      border: isUnlocked ? '1px solid #8b6914' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: isUnlocked ? '#d4a843' : '#6a5030' }}>
                      {tierInfo.badge} {tierInfo.displayName}
                    </span>
                    <span
                      className="text-xs text-right"
                      style={{ color: isUnlocked ? '#d4a843' : '#6a5030' }}
                    >
                      {tierInfo.minClues} clues
                      {tierInfo.minCasesSolved > 0 && ` + ${tierInfo.minCasesSolved} case${tierInfo.minCasesSolved !== 1 ? 's' : ''}`}
                      {tierInfo.requiresOutlawCaught && ' + outlaw'}
                      {' = '}
                      {tierInfo.discount}% off
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4" style={{ borderTop: '1px solid #5a4020' }}>
            <button
              onClick={onClose}
              className="w-full py-2 rounded font-bold text-sm"
              style={{ backgroundColor: '#5a4020', color: '#d4a843' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6a5030'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5a4020'
              }}
            >
              Keep Investigating
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Show discount code ----------------------------------------------------
  const alignment = getKarmaAlignment()
  const multiplier = getDiscountMultiplier()
  const hasBonus = discountCode.finalDiscount > discountCode.baseDiscount
  const hasPenalty = discountCode.finalDiscount < discountCode.baseDiscount
  const tierInfo = DISCOUNT_TIERS[discountCode.tier]
  const tierTitle = tierInfo.displayName
  const tierBadge = tierInfo.badge

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div
        className="rounded-lg w-full max-w-md overflow-hidden border-2"
        style={{ backgroundColor: '#2a1f14', borderColor: '#d4a843' }}
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{ backgroundColor: '#3d2b18', borderColor: '#8b6914' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tierBadge}</span>
            <div>
              <h2 className="font-bold" style={{ color: '#d4a843' }}>
                Congratulations, {tierTitle}!
              </h2>
              <p className="text-sm" style={{ color: '#a08050' }}>
                You&apos;ve earned a Tobias Gold discount code
              </p>
            </div>
          </div>
        </div>

        {/* Discount Code */}
        <div className="p-4 space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-4"
            style={{ backgroundColor: '#3d2b18', borderColor: '#d4a843' }}
          >
            <p
              className="text-center text-2xl font-mono tracking-wider mb-3"
              style={{ color: '#d4a843' }}
            >
              {discountCode.code}
            </p>
            <button
              onClick={handleCopy}
              className="w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: '#8b6914', color: '#2a1f14' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d4a843'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b6914'
              }}
            >
              {copied ? (
                <>
                  <span>&#10003;</span>
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
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#3d2b18' }}>
            <div className="flex items-center justify-between">
              <span style={{ color: '#a08050' }}>Rank:</span>
              <span className="font-bold" style={{ color: '#d4a843' }}>
                {tierBadge} {tierTitle}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#a08050' }}>Base Discount:</span>
              <span style={{ color: '#d4a843' }}>{discountCode.baseDiscount}%</span>
            </div>
            {(hasBonus || hasPenalty) && (
              <div className="flex items-center justify-between">
                <span style={{ color: '#a08050' }}>Alignment:</span>
                <span style={{ color: hasBonus ? '#7cb87c' : '#c97070' }}>
                  {ALIGNMENT_DISPLAY_NAMES[alignment]} ({multiplier}x)
                </span>
              </div>
            )}
            {discountCode.occupationMultiplier > 1.0 && (
              <div className="flex items-center justify-between">
                <span style={{ color: '#a08050' }}>Occupation Bonus:</span>
                <span style={{ color: '#d4a843' }}>
                  {discountCode.occupationName} ({discountCode.occupationMultiplier}x)
                </span>
              </div>
            )}
            <div
              className="flex items-center justify-between pt-2 mt-2"
              style={{ borderTop: '1px solid #5a4020' }}
            >
              <span className="font-bold" style={{ color: '#a08050' }}>
                Final Discount:
              </span>
              <span className="text-xl font-bold" style={{ color: '#d4a843' }}>
                {discountCode.finalDiscount}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#6a5030' }}>Valid for:</span>
              <span style={{ color: '#a08050' }}>{discountCode.validDays} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#6a5030' }}>Expires:</span>
              <span style={{ color: '#a08050' }}>
                {new Date(discountCode.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Karma Message */}
          {discountCode.karmaMessage && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: hasBonus ? 'rgba(124, 184, 124, 0.12)' : 'rgba(201, 112, 112, 0.12)',
                border: `1px solid ${hasBonus ? '#4a7a4a' : '#7a4a4a'}`,
              }}
            >
              <p className="text-sm" style={{ color: hasBonus ? '#7cb87c' : '#c97070' }}>
                {discountCode.karmaMessage}
              </p>
            </div>
          )}

          {/* Occupation Message */}
          {discountCode.occupationMessage && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'rgba(212, 168, 67, 0.12)',
                border: '1px solid #8b6914',
              }}
            >
              <p className="text-sm" style={{ color: '#d4a843' }}>
                {discountCode.occupationMessage}
              </p>
            </div>
          )}

          {/* Usage Instructions */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'rgba(160, 128, 80, 0.12)',
              border: '1px solid #6a5030',
            }}
          >
            <p className="text-sm" style={{ color: '#a08050' }}>
              <span className="font-bold">How to use:</span> Click &quot;Book Now&quot; below, then
              mention your code in the message to the host to receive your discount.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2" style={{ borderTop: '1px solid #5a4020' }}>
          <button
            onClick={() => {
              window.open(
                'https://www.airbnb.com/rooms/30045739',
                '_blank',
                'noopener,noreferrer'
              )
            }}
            className="w-full py-3 rounded font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#d4a843', color: '#2a1f14' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8c060'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#d4a843'
            }}
          >
            <span>Save {discountCode.finalDiscount}% at Back of Beyond Ranch</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded font-bold"
            style={{ backgroundColor: '#5a4020', color: '#a08050' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6a5030'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5a4020'
            }}
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
 *
 * Accepts optional casesSolved and outlawCaught props; otherwise
 * derives them from the mystery context state.
 */
interface DiscountProgressBarProps {
  onShowReward?: () => void
  casesSolved?: number
  outlawCaught?: boolean
}

export function DiscountProgressBar({
  onShowReward,
  casesSolved: casesSolvedProp,
  outlawCaught: outlawCaughtProp,
}: DiscountProgressBarProps) {
  const { state: mysteryState, getCorrectClueCount } = useMystery()
  const cluesCollected = getCorrectClueCount()

  // Use props if provided, otherwise derive from state
  const casesSolved = casesSolvedProp ?? (mysteryState.casesSolved?.length || 0)
  const outlawCaught = outlawCaughtProp ?? ((mysteryState.outlawsCaught ?? 0) > 0)

  const progress = getNextTierProgress(cluesCollected, casesSolved, outlawCaught)
  const currentTier = getQualifyingTier(cluesCollected, casesSolved, outlawCaught)

  const getBadge = (tier: DiscountTier | null): string => {
    if (!tier) return '🔒'
    return DISCOUNT_TIERS[tier].badge
  }

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(61, 43, 24, 0.6)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: '#a08050' }}>
          Discount Progress
        </span>
        {currentTier && (
          <button
            onClick={onShowReward}
            className="text-sm underline"
            style={{ color: '#d4a843' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a08050'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#d4a843'
            }}
          >
            View Code
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">{getBadge(currentTier)}</span>
        <div className="flex-1">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: '#5a4020' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                backgroundColor: '#d4a843',
                width: progress.maxed
                  ? '100%'
                  : progress.nextTier
                  ? `${Math.min(
                      100,
                      (cluesCollected / DISCOUNT_TIERS[progress.nextTier].minClues) * 100
                    )}%`
                  : '0%',
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: '#6a5030' }}>
            {progress.maxed ? 'Maximum tier reached!' : progress.message}
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-sm" style={{ color: '#d4a843' }}>
            {cluesCollected} clues
          </span>
          {casesSolved > 0 && (
            <span className="block text-xs" style={{ color: '#a08050' }}>
              {casesSolved} case{casesSolved !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiscountReward
