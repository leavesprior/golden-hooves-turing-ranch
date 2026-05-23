'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DISCOUNT_TIERS,
  type DiscountTier,
} from '@/app/oregon-trail/data/discountEngine'
import { useKarmaWallet } from '@/app/oregon-trail/karmaWalletContext'
import { useMystery } from '@/app/oregon-trail/mysteryContext'

interface AdventureRewardTrackerProps {
  locationsVisited: number
  totalLocations: number
  chapter: number
  playTimeMinutes: number
  cluesAnswered: number // Discovery clues answered correctly
  onUseHint?: (hintUrl: string) => void
}

type ExtendedTier = DiscountTier

interface ExtendedTierInfo {
  minClues?: number
  minCasesSolved?: number
  requiresOutlawCaught?: boolean
  discount: number
  maxDiscount: number
  validDays: number
  prefix: string
  displayName: string
  badge: string
}

const EXTENDED_TIERS: Record<ExtendedTier, ExtendedTierInfo> = {
  welcome: { ...DISCOUNT_TIERS.welcome, badge: '\uD83E\uDD20' },
  bronze: { ...DISCOUNT_TIERS.bronze, badge: '\uD83E\uDD49' },
  silver: { ...DISCOUNT_TIERS.silver, badge: '\uD83E\uDD48' },
  gold: { ...DISCOUNT_TIERS.gold, badge: '\uD83E\uDD47' },
  platinum: { ...DISCOUNT_TIERS.platinum, badge: '\uD83D\uDC8E' },
}

export default function AdventureRewardTracker({
  locationsVisited,
  totalLocations,
  chapter,
  playTimeMinutes,
  cluesAnswered,
  onUseHint
}: AdventureRewardTrackerProps) {
  const { getDiscountMultiplier, getAlignmentDisplayName } = useKarmaWallet()
  const { getCorrectClueCount, getCurrentDiscountTier, state: mysteryState } = useMystery()

  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false)

  const mysteryClues = getCorrectClueCount()
  const casesSolved = mysteryState.casesSolved.length
  const outlawCaught = mysteryState.outlawsCaught > 0
  // Combined clue count: discovery clues + mystery clues
  const totalClues = cluesAnswered + mysteryClues

  // Welcome tier eligibility: 5 minutes OR 2 locations (matching discountEngine)
  const welcomeEligible = playTimeMinutes >= 5 || locationsVisited >= 2

  // Determine current tier
  const getCurrentTier = useCallback((): ExtendedTier | null => {
    const standardTier = getCurrentDiscountTier()
    if (standardTier && standardTier !== 'welcome') return standardTier
    if (welcomeEligible) return 'welcome'
    return standardTier || null
  }, [welcomeEligible, getCurrentDiscountTier])

  const currentTier = getCurrentTier()

  // Check for Welcome tier achievement
  useEffect(() => {
    if (!hasCheckedWelcome && welcomeEligible) {
      setHasCheckedWelcome(true)
      setShowWelcomeModal(true)
    }
  }, [welcomeEligible, hasCheckedWelcome])

  // Progress to next tier
  const getProgressInfo = useCallback(() => {
    if (!currentTier) {
      const timeProgress = Math.min(100, (playTimeMinutes / 5) * 100)
      const locationProgress = Math.min(100, (locationsVisited / 2) * 100)
      const overallProgress = Math.max(timeProgress, locationProgress)
      return {
        percent: overallProgress,
        nextTier: 'welcome' as ExtendedTier,
        message: `${Math.max(0, 5 - playTimeMinutes)} min OR ${Math.max(0, 2 - locationsVisited)} locations to Welcome tier`
      }
    }

    const tiers: ExtendedTier[] = ['welcome', 'bronze', 'silver', 'gold', 'platinum']
    const currentIndex = tiers.indexOf(currentTier)
    if (currentIndex >= tiers.length - 1) {
      return { percent: 100, nextTier: null, message: 'Maximum tier achieved!' }
    }

    const nextTier = tiers[currentIndex + 1]
    const nextTierInfo = EXTENDED_TIERS[nextTier]
    const cluesNeeded = Math.max(0, (nextTierInfo.minClues || 0) - totalClues)
    const casesNeeded = Math.max(0, (nextTierInfo.minCasesSolved || 0) - casesSolved)
    const needsOutlaw = (nextTierInfo.requiresOutlawCaught || false) && !outlawCaught

    const clueProgress = nextTierInfo.minClues ? (totalClues / nextTierInfo.minClues) * 100 : 100
    const caseProgress = nextTierInfo.minCasesSolved ? (casesSolved / nextTierInfo.minCasesSolved) * 100 : 100
    const outlawProgress = nextTierInfo.requiresOutlawCaught ? (outlawCaught ? 100 : 0) : 100
    const overallProgress = Math.min(100, (clueProgress + caseProgress + outlawProgress) / 3)

    const parts: string[] = []
    if (cluesNeeded > 0) parts.push(`${cluesNeeded} clue${cluesNeeded !== 1 ? 's' : ''}`)
    if (casesNeeded > 0) parts.push(`${casesNeeded} case${casesNeeded !== 1 ? 's' : ''}`)
    if (needsOutlaw) parts.push('catch outlaw')

    return {
      percent: overallProgress,
      nextTier,
      message: parts.length > 0 ? `${parts.join(', ')} to ${nextTierInfo.displayName}` : `Ready for ${nextTierInfo.displayName}!`
    }
  }, [currentTier, playTimeMinutes, locationsVisited, totalClues, casesSolved, outlawCaught])

  const progress = getProgressInfo()
  const karmaMultiplier = getDiscountMultiplier()
  const alignmentName = getAlignmentDisplayName()

  const handleUseHint = useCallback(() => {
    const hintUrl = `https://www.airbnb.com/rooms/30045739?utm_source=bobr_game&utm_medium=hint&utm_campaign=adventure_ch${chapter}`
    if (onUseHint) {
      onUseHint(hintUrl)
    } else {
      window.open(hintUrl, '_blank', 'noopener,noreferrer')
    }
  }, [chapter, onUseHint])

  return (
    <>
      <div className="fixed top-4 right-4 w-80 bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)] p-4 font-[var(--font-pixel)] shadow-lg z-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[var(--pixel-ui-border)]">
          <h3 className="text-[12px] text-[var(--pixel-gold-light)] uppercase tracking-wider">
            Reward Tracker
          </h3>
          <span className="text-[10px] text-[var(--pixel-ui-text)]">
            {playTimeMinutes} min
          </span>
        </div>

        {/* Current Tier */}
        {currentTier && (
          <div className="mb-3 p-2 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)]">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{EXTENDED_TIERS[currentTier].badge}</span>
              <div>
                <div className="text-[10px] text-[var(--pixel-gold-light)] uppercase">
                  {EXTENDED_TIERS[currentTier].displayName}
                </div>
                <div className="text-[14px] text-[var(--pixel-gold-light)] font-bold">
                  {EXTENDED_TIERS[currentTier].discount}% OFF
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress to Next Tier */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] text-[var(--pixel-ui-text)] uppercase">Next Tier</span>
            <span className="text-[8px] text-[var(--pixel-gold-mid)]">{Math.floor(progress.percent)}%</span>
          </div>
          <div className="w-full h-4 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-gold-light)] transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="text-[8px] text-[var(--pixel-ui-text)] mt-1">{progress.message}</div>
        </div>

        {/* Karma Alignment */}
        <div className="mb-3 p-2 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)]">
          <div className="text-[8px] text-[var(--pixel-ui-text)] uppercase mb-1">Karma Alignment</div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[var(--pixel-forest-light)]">{alignmentName}</span>
            <span className="text-[10px] text-[var(--pixel-gold-light)] font-bold">{karmaMultiplier.toFixed(1)}x</span>
          </div>
        </div>

        {/* Search The Listing Button - shows when player has answered at least 1 clue */}
        {totalClues > 0 && (
          <button
            onClick={handleUseHint}
            className="w-full mb-3 p-2 bg-[var(--pixel-fire-orange)] hover:bg-[var(--pixel-gold-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-bg-dark)] transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[14px]">{'\uD83D\uDD0D'}</span>
              <span className="text-[10px] uppercase font-bold">Search The Listing</span>
            </div>
            <div className="text-[7px] mt-1 opacity-80">
              The answer might be hidden in the cabin listing...
            </div>
          </button>
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-center">
            <div className="text-[10px] text-[var(--pixel-ui-text)]">Clues</div>
            <div className="text-[14px] text-[var(--pixel-gold-light)] font-bold">{totalClues}</div>
          </div>
          <div className="p-2 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-center">
            <div className="text-[10px] text-[var(--pixel-ui-text)]">Cases</div>
            <div className="text-[14px] text-[var(--pixel-gold-light)] font-bold">{casesSolved}</div>
          </div>
        </div>

        {/* Reward Verification */}
        {currentTier && (
          <div className="border-t-2 border-[var(--pixel-ui-border)] pt-3">
            <div className="text-[8px] text-[var(--pixel-ui-text)] uppercase mb-2">
              Reward Verification
            </div>
            <div className="p-2 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)]">
              <div className="text-[8px] text-[var(--pixel-gold-light)] uppercase">
                {EXTENDED_TIERS[currentTier].displayName} earned
              </div>
              <div className="text-[7px] text-[var(--pixel-ui-text)] mt-1 leading-relaxed">
                Booking rewards now require host verification. No client discount codes are issued from this tracker.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] font-[var(--font-pixel)]">
          <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-light)] p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-[24px] mb-2">{'\uD83E\uDD20'}</div>
              <h2 className="text-[16px] text-[var(--pixel-gold-light)] uppercase tracking-wider mb-2">
                Welcome, Prospector!
              </h2>
              <p className="text-[10px] text-[var(--pixel-ui-text)] mb-4">
                You&apos;ve earned 5% off your stay at Back of Beyond Ranch
              </p>
            </div>

            <div className="mb-4 p-3 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)]">
              <div className="text-[8px] text-[var(--pixel-ui-text)] uppercase mb-2 text-center">Host Verification Required</div>
              <p className="text-[8px] text-[var(--pixel-gold-light)] text-center leading-relaxed">
                Your Welcome tier is tracked here, but booking discounts must be verified by the host before a code is issued.
              </p>
            </div>

            <a
              href="/rentals"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-3 bg-[var(--pixel-fire-orange)] hover:bg-[var(--pixel-gold-mid)] border-2 border-[var(--pixel-ui-border)] text-center text-[var(--pixel-bg-dark)] text-[10px] uppercase font-bold mb-3 transition-colors"
            >
              Book Now
            </a>

            <p className="text-[8px] text-[var(--pixel-ui-text)] text-center mb-4">
              Keep playing to unlock bigger discounts!
              <br />
              Next tier: <span className="text-[var(--pixel-gold-light)]">Bronze Deputy (8%)</span>
            </p>

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full p-2 bg-[var(--pixel-bg-mid)] hover:bg-[var(--pixel-ui-border)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] text-[8px] uppercase transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </>
  )
}
