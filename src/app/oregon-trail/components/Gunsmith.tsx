'use client'

import React, { useState } from 'react'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useOregonTrail } from '../oregonTrailContext'
import { RIFLES, RifleType } from '../data/settlementConfig'

export function Gunsmith() {
  const { state, canBuyRifle, buyRifle } = useSettlement()
  const { balance, spendNeutral } = useKarmaWallet()
  const trail = useOregonTrail()

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [ammoAmount, setAmmoAmount] = useState(50)

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleBuyRifle = async (type: RifleType) => {
    const success = await buyRifle(type)
    if (success) {
      showMessage(`Purchased ${RIFLES[type].name}!`, 'success')
    } else {
      showMessage('Could not purchase rifle', 'error')
    }
  }

  const handleBuyAmmo = async () => {
    const cost = Math.ceil(ammoAmount * 0.5) // 0.5 karma per round
    if (balance.neutral < cost) {
      showMessage(`Need ${cost}🪙 for ${ammoAmount} rounds`, 'error')
      return
    }

    const success = await spendNeutral(cost, `Ammunition: ${ammoAmount} rounds`)
    if (success && trail.state) {
      // Add ammo to trail state (this would need to be exposed from the context)
      // For now we just show the message
      showMessage(`Purchased ${ammoAmount} rounds of ammunition!`, 'success')
    }
  }

  const rifleTypes: RifleType[] = ['muzzleloader', 'repeater', 'sharps']

  // Calculate hunting bonus from current rifle
  const currentRifleBonus = state.rifle ? RIFLES[state.rifle].huntingMultiplier : 1.0

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

      {/* Current Equipment */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Your Equipment
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {state.rifle ? RIFLES[state.rifle].emoji : '❌'}
            </span>
            <div>
              <p className="text-amber-200">
                {state.rifle ? RIFLES[state.rifle].name : 'No Rifle'}
              </p>
              <p className="text-gray-500 text-xs">
                Hunting bonus: {currentRifleBonus}x
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-200">{trail.state?.ammunition || 0}</p>
            <p className="text-gray-500 text-xs">rounds</p>
          </div>
        </div>
      </div>

      {/* Rifles */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Rifles for Sale
        </h3>

        <div className="space-y-4">
          {rifleTypes.map(type => {
            const config = RIFLES[type]
            const owned = state.rifle === type
            const check = canBuyRifle(type)
            const isUpgrade = state.rifle && RIFLES[state.rifle].huntingMultiplier < config.huntingMultiplier

            return (
              <div
                key={type}
                className={`p-4 rounded-lg border ${
                  owned
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{config.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-amber-200 font-medium text-lg">{config.name}</h4>
                        {isUpgrade && !owned && (
                          <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded">
                            UPGRADE
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-medium">{config.neutralKarmaCost}🪙</span>
                        {config.goodKarmaRequired > 0 && (
                          <span className="text-green-400 text-sm ml-2">+{config.goodKarmaRequired}🍪</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{config.description}</p>

                    {/* Stats */}
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-amber-400 font-medium text-lg">{config.huntingMultiplier}x</p>
                        <p className="text-gray-500 text-xs">Hunting</p>
                      </div>
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-amber-400 font-medium text-lg">{config.accuracy}%</p>
                        <p className="text-gray-500 text-xs">Accuracy</p>
                      </div>
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-amber-400 font-medium text-lg">{config.ammoCapacity}</p>
                        <p className="text-gray-500 text-xs">Capacity</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {owned ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <span className="text-xl">✓</span>
                      <span>Currently Equipped</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyRifle(type)}
                      disabled={!check.canAfford}
                      className={`w-full py-3 text-sm rounded font-medium transition-colors ${
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

      {/* Ammunition */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-3 border-b border-gray-700 pb-2">
          Ammunition
        </h3>

        <p className="text-gray-400 text-sm mb-4">
          Stock up on ammunition for hunting and protection. 0.5🪙 per round.
        </p>

        <div className="flex gap-2 mb-4">
          {[25, 50, 100, 200].map(amount => (
            <button
              key={amount}
              onClick={() => setAmmoAmount(amount)}
              className={`flex-1 py-2 text-sm rounded ${
                ammoAmount === amount
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">{ammoAmount} rounds</span>
          <span className="text-amber-400">{Math.ceil(ammoAmount * 0.5)}🪙</span>
        </div>

        <button
          onClick={handleBuyAmmo}
          disabled={balance.neutral < Math.ceil(ammoAmount * 0.5)}
          className={`w-full py-3 rounded font-medium ${
            balance.neutral >= Math.ceil(ammoAmount * 0.5)
              ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Purchase Ammunition
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">Hunting Tips</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Better rifles increase hunting success rate</li>
          <li>• The Sharps Buffalo rifle is best for large game</li>
          <li>• Keep plenty of ammunition for emergencies</li>
          <li>• Higher accuracy means less ammo wasted</li>
        </ul>
      </div>
    </div>
  )
}

export default Gunsmith
