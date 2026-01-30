'use client'

import React, { useState } from 'react'
import { useRanch } from '../ranchContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { LIVESTOCK_TYPES, type LivestockType } from '../data/ranchConfig'

export function LivestockPanel() {
  const {
    state,
    buyLivestock,
    sellLivestock,
    slaughterLivestock,
    getTotalLivestock,
    getMaxLivestock,
    getLivestockConfig,
  } = useRanch()
  const { balance, canAfford } = useKarmaWallet()

  const [selectedType, setSelectedType] = useState<LivestockType>('cattle')
  const [quantity, setQuantity] = useState(1)
  const [confirmSlaughter, setConfirmSlaughter] = useState(false)
  const totalLivestock = getTotalLivestock()
  const maxLivestock = getMaxLivestock()
  const selectedConfig = getLivestockConfig(selectedType)
  const availableSpace = maxLivestock - totalLivestock

  const buyPrice = selectedConfig.neutralKarmaCost * quantity
  const sellPrice = Math.floor(selectedConfig.neutralKarmaCost * 0.7 * quantity)
  const slaughterPrice = selectedConfig.slaughterValue * quantity

  const canBuy = canAfford('neutral', buyPrice) && quantity <= availableSpace
  const canSell = state.livestock[selectedType] >= quantity
  const canSlaughter = state.livestock[selectedType] >= quantity

  return (
    <div className="space-y-6">
      {/* Capacity Bar */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Livestock Capacity</span>
          <span className={totalLivestock >= maxLivestock ? 'text-red-400' : 'text-amber-400'}>
            {totalLivestock} / {maxLivestock}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              totalLivestock >= maxLivestock ? 'bg-red-500' :
              totalLivestock > maxLivestock * 0.8 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, (totalLivestock / maxLivestock) * 100)}%` }}
          />
        </div>
        {totalLivestock >= maxLivestock && (
          <p className="text-red-400 text-xs mt-2">Ranch is full! Upgrade fence to expand capacity.</p>
        )}
      </div>

      {/* Current Livestock */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">Your Livestock</h3>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(LIVESTOCK_TYPES).map(([type, config]) => {
            const count = state.livestock[type as LivestockType]
            const health = state.livestockHealth[type as LivestockType]

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type as LivestockType)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  selectedType === type
                    ? 'bg-amber-900/40 border border-amber-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{config.emoji}</span>
                  <span className="text-xl text-amber-400">{count}</span>
                </div>
                <div className="mt-2">
                  <div className="text-amber-300">{config.namePlural}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
                {count > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Health</span>
                      <span>{Math.round(health)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          health > 70 ? 'bg-green-500' :
                          health > 30 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Trade Panel */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">
          Trade {selectedConfig.namePlural} {selectedConfig.emoji}
        </h3>

        {/* Quantity Selector */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-400">Quantity:</span>
          <div className="flex gap-2">
            {[1, 5, 10].map(q => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`w-10 h-10 rounded ${
                  quantity === q
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-2 bg-gray-700 text-gray-200 rounded text-center"
              min={1}
            />
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Cost per head</div>
            <div className="text-amber-400">{selectedConfig.neutralKarmaCost}🌮</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Feed/day</div>
            <div className="text-amber-400">{selectedConfig.foodPerDay} units</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Slaughter value</div>
            <div className="text-amber-400">{selectedConfig.slaughterValue}🌮</div>
          </div>
        </div>

        {/* Production info */}
        {selectedConfig.produces.length > 0 && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <div className="text-gray-400 text-sm mb-1">Produces:</div>
            <div className="flex gap-3">
              {selectedConfig.produces.map(prod => (
                <div key={prod.name} className="text-sm">
                  <span className="text-amber-300">{prod.name}</span>
                  <span className="text-gray-500 ml-1">({prod.productionRate}/day @ {prod.karmaValue}🌮)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special bonus */}
        {selectedConfig.specialBonus && (
          <div className="mb-4 p-3 bg-emerald-900/30 rounded border border-emerald-700/50">
            <span className="text-emerald-400 text-sm">⭐ Special: {selectedConfig.specialBonus}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => buyLivestock(selectedType, quantity)}
            disabled={!canBuy}
            className={`p-3 rounded font-medium transition-colors ${
              canBuy
                ? 'bg-green-700 text-green-100 hover:bg-green-600'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div>Buy</div>
            <div className="text-sm opacity-75">{buyPrice}🌮</div>
          </button>

          <button
            onClick={() => sellLivestock(selectedType, quantity)}
            disabled={!canSell}
            className={`p-3 rounded font-medium transition-colors ${
              canSell
                ? 'bg-blue-700 text-blue-100 hover:bg-blue-600'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div>Sell</div>
            <div className="text-sm opacity-75">+{sellPrice}🌮</div>
          </button>

          <button
            onClick={() => setConfirmSlaughter(true)}
            disabled={!canSlaughter}
            className={`p-3 rounded font-medium transition-colors ${
              canSlaughter
                ? 'bg-red-700 text-red-100 hover:bg-red-600'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div>Slaughter</div>
            <div className="text-sm opacity-75">+{slaughterPrice}🌮</div>
          </button>
        </div>

        {!canBuy && quantity <= availableSpace && (
          <p className="text-red-400 text-xs mt-2">Not enough karma to buy {quantity} {selectedConfig.namePlural}</p>
        )}
        {quantity > availableSpace && (
          <p className="text-red-400 text-xs mt-2">Only room for {availableSpace} more livestock</p>
        )}
      </div>

      {/* Slaughter Confirmation Modal */}
      {confirmSlaughter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-red-700 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 text-lg font-medium mb-4">
              ⚠️ Confirm Slaughter
            </h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to slaughter {quantity} {selectedConfig.namePlural}?
              This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  slaughterLivestock(selectedType, quantity)
                  setConfirmSlaughter(false)
                }}
                className="flex-1 py-2 bg-red-700 text-red-100 rounded hover:bg-red-600"
              >
                Slaughter (+{slaughterPrice}🌮)
              </button>
              <button
                onClick={() => setConfirmSlaughter(false)}
                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LivestockPanel
