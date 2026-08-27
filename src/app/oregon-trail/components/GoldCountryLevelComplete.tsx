'use client'

import React from 'react'
import {
  discountFloorForLevel,
  levelCompleteCopy,
  type ArcadeLevel,
} from '@/lib/goldCountryLevelRewards'

type GoldCountryLevelCompleteProps = {
  level: ArcadeLevel
  onTakeDiscount: () => void
  onContinue: () => void
}

export function GoldCountryLevelComplete({
  level,
  onTakeDiscount,
  onContinue,
}: GoldCountryLevelCompleteProps) {
  const copy = levelCompleteCopy(level)
  const floor = discountFloorForLevel(level)

  return (
    <div className="bg-[#1a1610] border-2 border-amber-600 rounded-lg p-6 mb-6" data-testid={`level-complete-${level}`}>
      <p className="text-amber-100 text-center text-lg mb-2 font-serif">{copy.lead}</p>
      <p className="text-amber-300/80 text-center text-sm mb-6 font-serif">
        Stay voucher floor this level: {floor}%. Host verifies on Airbnb.
      </p>
      <div className="space-y-4">
        <button
          type="button"
          onClick={onTakeDiscount}
          className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif text-xl rounded border-4 border-amber-500 transition-colors"
        >
          {copy.takeLabel}
        </button>
        <p className="text-amber-200/80 text-base text-center font-serif">{copy.takeHint}</p>
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3 bg-black/60 hover:bg-black/40 text-amber-100 font-serif text-lg rounded border-2 border-amber-700 transition-colors"
        >
          {copy.nextLabel}
        </button>
        <p className="text-amber-200/70 text-base text-center font-serif">{copy.nextHint}</p>
      </div>
    </div>
  )
}

export default GoldCountryLevelComplete
