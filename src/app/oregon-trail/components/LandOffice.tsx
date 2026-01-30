'use client'

import React, { useState } from 'react'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import {
  PROPERTY_TIERS,
  BUILDINGS,
  MINING_CLAIM,
  FARMLAND,
  PropertyTier,
  BuildingType,
  getNextPropertyTier,
} from '../data/settlementConfig'

export function LandOffice() {
  const {
    state,
    canUpgradeProperty,
    upgradeProperty,
    canBuildBuilding,
    startBuilding,
    hasBuilding,
    canBuyMiningClaim,
    buyMiningClaim,
    canBuyFarmland,
    buyFarmland,
  } = useSettlement()
  const { balance } = useKarmaWallet()

  const [farmAcresAmount, setFarmAcresAmount] = useState(10)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpgradeProperty = async () => {
    const success = await upgradeProperty()
    if (success) {
      showMessage('Property upgraded!', 'success')
    } else {
      showMessage('Could not upgrade property', 'error')
    }
  }

  const handleBuildBuilding = async (type: BuildingType) => {
    const success = await startBuilding(type)
    if (success) {
      showMessage(`Started building ${BUILDINGS[type].name}!`, 'success')
    } else {
      showMessage('Could not start building', 'error')
    }
  }

  const handleBuyMiningClaim = async () => {
    const success = await buyMiningClaim()
    if (success) {
      showMessage('Mining claim purchased!', 'success')
    } else {
      showMessage('Could not purchase claim', 'error')
    }
  }

  const handleBuyFarmland = async () => {
    const success = await buyFarmland(farmAcresAmount)
    if (success) {
      showMessage(`Purchased ${farmAcresAmount} acres!`, 'success')
    } else {
      showMessage('Could not purchase farmland', 'error')
    }
  }

  const nextTier = getNextPropertyTier(state.propertyTier)
  const nextTierConfig = nextTier ? PROPERTY_TIERS[nextTier] : null
  const propertyUpgradeCheck = canUpgradeProperty()

  const buildableBuildings: BuildingType[] = ['cabin', 'house', 'barn', 'workshop', 'storehouse']

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded text-center ${
            message.type === 'success'
              ? 'bg-green-900/60 border border-green-500 text-green-200'
              : 'bg-red-900/60 border border-red-500 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
        <span className="text-gray-400">Your Balance:</span>
        <div className="flex gap-3">
          <span className="text-amber-400">{balance.neutral}🌮</span>
          <span className="text-green-400">{balance.good}🍪</span>
        </div>
      </div>

      {/* Property Tier Upgrade */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Property Tier
        </h3>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-amber-200">
              Current: {PROPERTY_TIERS[state.propertyTier].name}
            </span>
            <span className="text-gray-400 text-sm">Tier {state.propertyTier}/5</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(state.propertyTier / 5) * 100}%` }}
            />
          </div>
        </div>

        {nextTierConfig ? (
          <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-300">Next: {nextTierConfig.name}</span>
              <span className="text-amber-400">{nextTierConfig.neutralKarmaCost}🌮</span>
            </div>
            <p className="text-gray-400 text-xs mb-2">{nextTierConfig.description}</p>
            <div className="text-xs text-gray-500 space-y-1">
              {nextTierConfig.goodKarmaRequired > 0 && (
                <p>Requires: {nextTierConfig.goodKarmaRequired}🍪 Good Karma</p>
              )}
              {nextTierConfig.daysRequired > 0 && (
                <p>
                  Days required: {nextTierConfig.daysRequired} (you have {state.daysInSettlement})
                </p>
              )}
              {nextTierConfig.reputationRequired > 0 && (
                <p>
                  Reputation required: {nextTierConfig.reputationRequired} (you have {state.reputation})
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-green-400 text-center py-4">Maximum property tier achieved!</p>
        )}

        {nextTierConfig && (
          <button
            onClick={handleUpgradeProperty}
            disabled={!propertyUpgradeCheck.canAfford}
            className={`w-full py-3 rounded font-medium transition-colors ${
              propertyUpgradeCheck.canAfford
                ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {propertyUpgradeCheck.canAfford
              ? `Upgrade to ${nextTierConfig.name}`
              : propertyUpgradeCheck.reason}
          </button>
        )}
      </div>

      {/* Buildings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Buildings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buildableBuildings.map(type => {
            const config = BUILDINGS[type]
            const owned = hasBuilding(type)
            const inProgress = state.buildingsInProgress.find(b => b.type === type)
            const buildCheck = canBuildBuilding(type)

            return (
              <div
                key={type}
                className={`p-3 rounded-lg border ${
                  owned
                    ? 'bg-green-900/30 border-green-700'
                    : inProgress
                    ? 'bg-amber-900/30 border-amber-600'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{config.emoji}</span>
                  <div className="flex-1">
                    <h4 className="text-amber-200 text-sm font-medium">{config.name}</h4>
                    <p className="text-gray-400 text-xs">{config.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {config.benefits.map((b, idx) => (
                        <span key={idx} className="block">• {b}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {owned ? (
                    <span className="text-green-400 text-sm">Built</span>
                  ) : inProgress ? (
                    <span className="text-amber-400 text-sm">
                      Building... {inProgress.daysRemaining} days remaining
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuildBuilding(type)}
                      disabled={!buildCheck.canAfford}
                      className={`w-full py-2 text-sm rounded ${
                        buildCheck.canAfford
                          ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {buildCheck.canAfford
                        ? `Build (${config.neutralKarmaCost}🌮, ${config.buildDays} days)`
                        : buildCheck.reason}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mining Claims */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Mining Claims
        </h3>

        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{MINING_CLAIM.emoji}</span>
          <div>
            <h4 className="text-amber-200">{MINING_CLAIM.name}</h4>
            <p className="text-gray-400 text-xs">{MINING_CLAIM.description}</p>
            <p className="text-gray-500 text-xs mt-1">
              Daily yield: {MINING_CLAIM.dailyGoldRange[0]}-{MINING_CLAIM.dailyGoldRange[1]}🌮
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400">
            Owned: {state.miningClaims}/{MINING_CLAIM.maxOwned}
          </span>
          <span className="text-amber-400">{MINING_CLAIM.neutralKarmaCost}🌮 each</span>
        </div>

        {(() => {
          const check = canBuyMiningClaim()
          return (
            <button
              onClick={handleBuyMiningClaim}
              disabled={!check.canAfford}
              className={`w-full py-2 rounded ${
                check.canAfford
                  ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {check.canAfford ? 'Purchase Mining Claim' : check.reason}
            </button>
          )
        })()}
      </div>

      {/* Farmland */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Farmland
        </h3>

        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{FARMLAND.emoji}</span>
          <div>
            <h4 className="text-amber-200">{FARMLAND.name}</h4>
            <p className="text-gray-400 text-xs">{FARMLAND.description}</p>
            <p className="text-gray-500 text-xs mt-1">
              Yield: {FARMLAND.yieldPerAcre}🌮 per acre per season
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400">
            Owned: {state.farmAcres}/{FARMLAND.maxAcres} acres
          </span>
          <span className="text-amber-400">{FARMLAND.costPerAcre}🌮 per acre</span>
        </div>

        <div className="flex gap-2 mb-3">
          {[5, 10, 25, 50].map(acres => (
            <button
              key={acres}
              onClick={() => setFarmAcresAmount(acres)}
              className={`flex-1 py-2 text-sm rounded ${
                farmAcresAmount === acres
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {acres}ac
            </button>
          ))}
        </div>

        {(() => {
          const check = canBuyFarmland(farmAcresAmount)
          const cost = farmAcresAmount * FARMLAND.costPerAcre
          return (
            <button
              onClick={handleBuyFarmland}
              disabled={!check.canAfford}
              className={`w-full py-2 rounded ${
                check.canAfford
                  ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {check.canAfford
                ? `Purchase ${farmAcresAmount} acres (${cost}🌮)`
                : check.reason}
            </button>
          )
        })()}
      </div>
    </div>
  )
}

export default LandOffice
