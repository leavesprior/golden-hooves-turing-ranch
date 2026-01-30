'use client'

import React from 'react'
import { useRanch } from '../ranchContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { FENCE_TIERS, type FenceTier } from '../data/ranchConfig'

export function FenceUpgradePanel() {
  const {
    state,
    getCurrentFence,
    getNextFence,
    canUpgradeFence,
    upgradeFence,
  } = useRanch()
  const { balance } = useKarmaWallet()

  const currentFence = getCurrentFence()
  const nextFence = getNextFence()
  const upgradeCheck = canUpgradeFence()

  const tiers = Object.values(FENCE_TIERS)

  return (
    <div className="space-y-6">
      {/* Current Fence */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">Current Infrastructure</h3>

        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {state.fenceTier === 1 && '🪤'}
            {state.fenceTier === 2 && '🪵'}
            {state.fenceTier === 3 && '🚧'}
            {state.fenceTier === 4 && '🧱'}
            {state.fenceTier === 5 && '🏆'}
          </div>
          <div className="flex-1">
            <h4 className="text-lg text-amber-300">{currentFence.name}</h4>
            <p className="text-gray-400 text-sm">{currentFence.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">
                Max Livestock: <span className="text-amber-400">{currentFence.maxLivestock}</span>
              </div>
              <div className="text-gray-500">
                Birth Rate: <span className="text-green-400">×{currentFence.birthRateMultiplier}</span>
              </div>
              <div className="text-gray-500">
                Predator Defense: <span className="text-blue-400">{Math.round(currentFence.predatorResistance * 100)}%</span>
              </div>
              <div className="text-gray-500">
                Escape Prevention: <span className="text-purple-400">{Math.round(currentFence.escapeResistance * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade in progress */}
        {state.upgradeInProgress && (
          <div className="mt-4 p-3 bg-amber-900/30 rounded border border-amber-700/50">
            <div className="flex items-center gap-2">
              <span className="animate-bounce">🔨</span>
              <span className="text-amber-400">Upgrade in progress</span>
              <span className="text-gray-400">({state.upgradeDaysRemaining} days remaining)</span>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{
                  width: `${100 - (state.upgradeDaysRemaining / (nextFence?.upgradeTime || 1)) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Option */}
      {nextFence && !state.upgradeInProgress && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-amber-400 font-medium mb-4">Available Upgrade</h3>

          <div className="flex items-start gap-4">
            <div className="text-4xl">
              {nextFence.tier === 2 && '🪵'}
              {nextFence.tier === 3 && '🚧'}
              {nextFence.tier === 4 && '🧱'}
              {nextFence.tier === 5 && '🏆'}
            </div>
            <div className="flex-1">
              <h4 className="text-lg text-amber-300">{nextFence.name}</h4>
              <p className="text-gray-400 text-sm">{nextFence.description}</p>

              {/* Improvement preview */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-500">
                  Max Livestock:
                  <span className="text-gray-400 ml-1">{currentFence.maxLivestock}</span>
                  <span className="text-green-400 ml-1">→ {nextFence.maxLivestock}</span>
                </div>
                <div className="text-gray-500">
                  Birth Rate:
                  <span className="text-gray-400 ml-1">×{currentFence.birthRateMultiplier}</span>
                  <span className="text-green-400 ml-1">→ ×{nextFence.birthRateMultiplier}</span>
                </div>
                <div className="text-gray-500">
                  Predator Defense:
                  <span className="text-gray-400 ml-1">{Math.round(currentFence.predatorResistance * 100)}%</span>
                  <span className="text-green-400 ml-1">→ {Math.round(nextFence.predatorResistance * 100)}%</span>
                </div>
                <div className="text-gray-500">
                  Build Time:
                  <span className="text-amber-400 ml-1">{nextFence.upgradeTime} days</span>
                </div>
              </div>

              {/* Cost */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Cost:</span>
                  <span className={balance.neutral >= nextFence.neutralKarmaCost ? 'text-yellow-400' : 'text-red-400'}>
                    {nextFence.neutralKarmaCost}🌮
                  </span>
                  {nextFence.goodKarmaRequired > 0 && (
                    <span className={balance.good >= nextFence.goodKarmaRequired ? 'text-amber-400' : 'text-red-400'}>
                      + {nextFence.goodKarmaRequired}🍪
                    </span>
                  )}
                </div>

                <button
                  onClick={() => upgradeFence()}
                  disabled={!upgradeCheck.canUpgrade}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    upgradeCheck.canUpgrade
                      ? 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {upgradeCheck.canUpgrade ? 'Build Upgrade' : upgradeCheck.reason}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Tiers Overview */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">Fence Progression</h3>

        <div className="space-y-2">
          {tiers.map(tier => {
            const isCurrent = tier.tier === state.fenceTier
            const isUnlocked = tier.tier <= state.fenceTier
            const isNext = tier.tier === state.fenceTier + 1

            return (
              <div
                key={tier.tier}
                className={`flex items-center gap-3 p-2 rounded ${
                  isCurrent ? 'bg-amber-900/30 border border-amber-700/50' :
                  isUnlocked ? 'bg-gray-700/30' :
                  'opacity-50'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700">
                  {isUnlocked ? (
                    <span className="text-green-400">✓</span>
                  ) : isNext ? (
                    <span className="text-amber-400">→</span>
                  ) : (
                    <span className="text-gray-500">🔒</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={isCurrent ? 'text-amber-300' : 'text-gray-300'}>{tier.name}</span>
                    {isCurrent && <span className="text-xs text-amber-500">(Current)</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tier.maxLivestock} livestock • ×{tier.birthRateMultiplier} births
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {tier.neutralKarmaCost}🌮
                  {tier.goodKarmaRequired > 0 && <span className="ml-1">+{tier.goodKarmaRequired}🍪</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FenceUpgradePanel
