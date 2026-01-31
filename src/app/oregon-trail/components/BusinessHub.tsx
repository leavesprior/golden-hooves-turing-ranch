'use client'

import React, { useState } from 'react'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { BUSINESSES, type BusinessTier, getNextBusinessTier, getBusinessPriceDiscount } from '../data/businessConfig'
import { GoldPanning } from './GoldPanning'

/**
 * BusinessHub - Business management tab for SettlementHub
 *
 * Shows current business tier, daily income/costs, upgrade options,
 * karma-to-price relationships, and the gold panning minigame.
 */
export function BusinessHub() {
  const {
    state,
    canUpgradeBusiness,
    startBusinessUpgrade,
    getBusinessPriceDiscount: getPriceDiscount,
  } = useSettlement()
  const { balance } = useKarmaWallet()

  const [showPanning, setShowPanning] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)

  const currentBusiness = BUSINESSES[state.businessTier]
  const nextBusiness = getNextBusinessTier(state.businessTier)
  const upgradeCheck = canUpgradeBusiness()
  const priceDiscount = getPriceDiscount()

  const handleUpgrade = async () => {
    const success = await startBusinessUpgrade()
    if (success && nextBusiness) {
      setUpgradeMessage(`Building ${nextBusiness.name}... (${nextBusiness.buildDays} days)`)
      setTimeout(() => setUpgradeMessage(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Business */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{currentBusiness.emoji}</span>
          <div className="flex-1">
            <h3 className="text-amber-200 font-bold text-lg">{currentBusiness.name}</h3>
            <p className="text-gray-400 text-sm">{currentBusiness.description}</p>
          </div>
          <div className="text-right">
            <p className="text-amber-400 text-xs">Tier {state.businessTier}/5</p>
          </div>
        </div>

        {/* Income/Cost Summary */}
        {state.businessTier > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-700">
            <div className="text-center">
              <p className="text-green-400 font-bold">
                {currentBusiness.dailyIncomeRange[0]}-{currentBusiness.dailyIncomeRange[1]}🌮
              </p>
              <p className="text-gray-500 text-xs">Daily Income</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-bold">{currentBusiness.dailyOperatingCost}🌮</p>
              <p className="text-gray-500 text-xs">Staff Cost</p>
            </div>
            <div className="text-center">
              <p className="text-amber-300 font-bold">
                {state.businessDailyIncome}🌮
              </p>
              <p className="text-gray-500 text-xs">Total Earned</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Under Construction */}
      {state.businessInProgress && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🔨</span>
            <div className="flex-1">
              <p className="text-yellow-200 font-bold">
                Building {BUSINESSES[state.businessInProgress.tier].name}...
              </p>
              <p className="text-yellow-400 text-sm">
                {state.businessInProgress.daysRemaining} day{state.businessInProgress.daysRemaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{
                width: `${((BUSINESSES[state.businessInProgress.tier].buildDays - state.businessInProgress.daysRemaining) / BUSINESSES[state.businessInProgress.tier].buildDays) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Upgrade Message */}
      {upgradeMessage && (
        <div className="bg-green-900/40 border border-green-600 rounded-lg p-3 text-center">
          <p className="text-green-300">{upgradeMessage}</p>
        </div>
      )}

      {/* Next Tier Upgrade */}
      {nextBusiness && !state.businessInProgress && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-amber-400 font-bold mb-3">Available Upgrade</h4>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{nextBusiness.emoji}</span>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-amber-200 font-bold">{nextBusiness.name} (Tier {nextBusiness.tier})</p>
                <p className="text-gray-400 text-sm">{nextBusiness.description}</p>
              </div>

              {/* Requirements */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className={balance.good >= nextBusiness.goodKarmaRequired ? 'text-green-400' : 'text-red-400'}>
                    {balance.good >= nextBusiness.goodKarmaRequired ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">
                    Requires: {nextBusiness.goodKarmaRequired}🍪
                    <span className="text-gray-500"> (you have {balance.good}🍪)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={balance.neutral >= nextBusiness.neutralKarmaCost ? 'text-green-400' : 'text-red-400'}>
                    {balance.neutral >= nextBusiness.neutralKarmaCost ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300">
                    Cost: {nextBusiness.neutralKarmaCost}🌮
                    <span className="text-gray-500"> (you have {balance.neutral}🌮)</span>
                  </span>
                </div>
                <p className="text-gray-500">Build time: {nextBusiness.buildDays} days</p>
              </div>

              {/* Perks Preview */}
              <div className="flex flex-wrap gap-1 mt-1">
                {nextBusiness.specialPerks.map((perk, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                    {perk}
                  </span>
                ))}
              </div>

              {/* Upgrade Button */}
              <button
                onClick={handleUpgrade}
                disabled={!upgradeCheck.canUnlock}
                className={`w-full py-2 rounded font-bold text-sm mt-2 ${
                  upgradeCheck.canUnlock
                    ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {upgradeCheck.canUnlock
                  ? `Build ${nextBusiness.name} (-${nextBusiness.neutralKarmaCost}🌮)`
                  : upgradeCheck.reason || 'Cannot upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.businessTier >= 5 && !state.businessInProgress && (
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-4 text-center">
          <span className="text-3xl">🏆</span>
          <p className="text-amber-200 font-bold mt-2">Maximum Business Tier Reached!</p>
          <p className="text-amber-400 text-sm">Your Hotel & Trading Company is the finest in Gold Country.</p>
        </div>
      )}

      {/* Reputation Discount */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-amber-400 font-bold">Reputation Discount</h4>
            <p className="text-gray-500 text-sm">
              Applied to all shop purchases (Land Office, Livery, Gunsmith)
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-xl">{priceDiscount}% off</p>
            <p className="text-gray-500 text-xs">
              {currentBusiness.priceDiscount}% tier + {Math.min(10, Math.floor(balance.good / 50))}% karma
            </p>
          </div>
        </div>
      </div>

      {/* Gold Panning Action */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛏️</span>
            <div>
              <h4 className="text-yellow-200 font-bold">Pan for Gold</h4>
              <p className="text-gray-500 text-sm">
                4 rounds of timing-based panning (takes 1 day)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPanning(true)}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 rounded font-bold text-sm"
          >
            Start Panning
          </button>
        </div>
      </div>

      {/* All Tiers Reference */}
      <div className="bg-gray-800/60 rounded-lg p-4">
        <h4 className="text-gray-400 font-bold text-sm mb-3">Business Tiers</h4>
        <div className="space-y-2">
          {([1, 2, 3, 4, 5] as BusinessTier[]).map(tier => {
            const config = BUSINESSES[tier]
            const isCurrentOrBelow = tier <= state.businessTier
            const isCurrent = tier === state.businessTier
            return (
              <div
                key={tier}
                className={`flex items-center gap-3 p-2 rounded ${
                  isCurrent ? 'bg-amber-900/30 border border-amber-700' :
                  isCurrentOrBelow ? 'opacity-60' : ''
                }`}
              >
                <span className="text-lg">{config.emoji}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-amber-200' : 'text-gray-300'}`}>
                    {config.name}
                    {isCurrent && <span className="text-amber-500 text-xs ml-2">(Current)</span>}
                    {isCurrentOrBelow && !isCurrent && <span className="text-green-500 text-xs ml-2">✓</span>}
                  </p>
                </div>
                <span className="text-gray-500 text-xs">{config.goodKarmaRequired}🍪</span>
                <span className="text-gray-500 text-xs">{config.priceDiscount}% off</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gold Panning Modal */}
      <GoldPanning
        isOpen={showPanning}
        onClose={() => setShowPanning(false)}
        miningClaims={state.miningClaims}
      />
    </div>
  )
}

export default BusinessHub
