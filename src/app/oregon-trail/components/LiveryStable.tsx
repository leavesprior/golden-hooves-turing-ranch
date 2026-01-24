'use client'

import React, { useState } from 'react'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import {
  WAGONS,
  HORSE_CONFIG,
  SADDLES,
  WagonType,
  SaddleType,
} from '../data/settlementConfig'

export function LiveryStable() {
  const {
    state,
    hasBuilding,
    canBuyWagon,
    buyWagon,
    canBuyHorse,
    buyHorse,
    canBuySaddle,
    buySaddle,
  } = useSettlement()
  const { balance } = useKarmaWallet()

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleBuyWagon = async (type: WagonType) => {
    const success = await buyWagon(type)
    if (success) {
      showMessage(`Purchased ${WAGONS[type].name}!`, 'success')
    } else {
      showMessage('Could not purchase wagon', 'error')
    }
  }

  const handleBuyHorse = async () => {
    const success = await buyHorse()
    if (success) {
      showMessage('Purchased Draft Horse!', 'success')
    } else {
      showMessage('Could not purchase horse', 'error')
    }
  }

  const handleBuySaddle = async (type: SaddleType) => {
    const success = await buySaddle(type)
    if (success) {
      showMessage(`Purchased ${SADDLES[type].name}!`, 'success')
    } else {
      showMessage('Could not purchase saddle', 'error')
    }
  }

  const hasBarn = hasBuilding('barn')
  const wagonTypes: WagonType[] = ['basic', 'covered', 'freight']
  const saddleTypes: SaddleType[] = ['work', 'silver']

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
          <span className="text-amber-400">{balance.neutral}🪙</span>
          <span className="text-green-400">{balance.good}🍪</span>
        </div>
      </div>

      {/* Current Inventory */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Your Inventory
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-2xl">{state.wagon ? WAGONS[state.wagon].emoji : '❌'}</span>
            <p className="text-gray-400 text-xs mt-1">
              {state.wagon ? WAGONS[state.wagon].name : 'No Wagon'}
            </p>
          </div>
          <div>
            <span className="text-2xl">{state.horses > 0 ? '🐴'.repeat(Math.min(state.horses, 4)) : '❌'}</span>
            <p className="text-gray-400 text-xs mt-1">
              {state.horses > 0 ? `${state.horses} Horse(s)` : 'No Horses'}
            </p>
          </div>
          <div>
            <span className="text-2xl">{state.saddle ? SADDLES[state.saddle].emoji : '❌'}</span>
            <p className="text-gray-400 text-xs mt-1">
              {state.saddle ? SADDLES[state.saddle].name : 'No Saddle'}
            </p>
          </div>
        </div>
      </div>

      {/* Barn Required Notice */}
      {!hasBarn && (
        <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-3 text-center">
          <span className="text-amber-300 text-sm">
            Build a Barn at the Land Office to purchase horses
          </span>
        </div>
      )}

      {/* Wagons */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Wagons
        </h3>

        <div className="space-y-3">
          {wagonTypes.map(type => {
            const config = WAGONS[type]
            const owned = state.wagon === type
            const check = canBuyWagon(type)

            return (
              <div
                key={type}
                className={`p-3 rounded-lg border ${
                  owned
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{config.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-amber-200 font-medium">{config.name}</h4>
                      <span className="text-amber-400">{config.neutralKarmaCost}🪙</span>
                    </div>
                    <p className="text-gray-400 text-xs">{config.description}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Cargo:</span>
                        <span className="text-amber-200 ml-1">{config.cargoCapacity} lbs</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Speed:</span>
                        <span className="text-amber-200 ml-1">{config.speedMultiplier}x</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Durability:</span>
                        <span className="text-amber-200 ml-1">{config.durability}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {owned ? (
                    <span className="text-green-400 text-sm">Owned</span>
                  ) : (
                    <button
                      onClick={() => handleBuyWagon(type)}
                      disabled={!check.canAfford}
                      className={`w-full py-2 text-sm rounded ${
                        check.canAfford
                          ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {check.canAfford ? 'Purchase' : check.reason}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Horses */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Horses
        </h3>

        <div className="p-3 rounded-lg border bg-gray-700/50 border-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{HORSE_CONFIG.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="text-amber-200 font-medium">{HORSE_CONFIG.name}</h4>
                <span className="text-amber-400">{HORSE_CONFIG.neutralKarmaCost}🪙</span>
              </div>
              <p className="text-gray-400 text-xs">{HORSE_CONFIG.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                <p>• +{HORSE_CONFIG.travelSpeedBonus}% travel speed per horse</p>
                <p>• Feed: {HORSE_CONFIG.feedPerDay} units/day each</p>
                <p>• Requires: Barn</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <span className="text-gray-400">
              Owned: {state.horses}/{HORSE_CONFIG.maxOwned}
            </span>

            {(() => {
              const check = canBuyHorse()
              return (
                <button
                  onClick={handleBuyHorse}
                  disabled={!check.canAfford}
                  className={`px-4 py-2 text-sm rounded ${
                    check.canAfford
                      ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {check.canAfford ? 'Buy Horse' : check.reason}
                </button>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Saddles */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Saddles
        </h3>

        <div className="space-y-3">
          {saddleTypes.map(type => {
            const config = SADDLES[type]
            const owned = state.saddle === type
            const check = canBuySaddle(type)

            return (
              <div
                key={type}
                className={`p-3 rounded-lg border ${
                  owned
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-amber-200 font-medium">{config.name}</h4>
                      <span className="text-amber-400">{config.neutralKarmaCost}🪙</span>
                    </div>
                    <p className="text-gray-400 text-xs">{config.description}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span>Riding bonus: +{config.ridingBonus}%</span>
                      {config.prestige > 0 && (
                        <span className="ml-3">Prestige: +{config.prestige}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {owned ? (
                    <span className="text-green-400 text-sm">Owned</span>
                  ) : (
                    <button
                      onClick={() => handleBuySaddle(type)}
                      disabled={!check.canAfford}
                      className={`w-full py-2 text-sm rounded ${
                        check.canAfford
                          ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {check.canAfford ? 'Purchase' : check.reason}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LiveryStable
