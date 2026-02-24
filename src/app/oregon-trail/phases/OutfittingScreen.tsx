'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import { KarmaConvertModal } from '../components/KarmaConvertModal'

export function OutfittingScreen() {
  const { state, purchaseSupplies, goToCharacterCreation } = useOregonTrail()
  const { balance, canAfford, spendNeutral, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()
  const [supplies, setSupplies] = useState({
    food: 0,
    ammo: 0,
    parts: 0,
    medicine: 0,
    oxen: 0,
  })

  const prices = {
    food: 0.2,
    ammo: 2,
    parts: 10,
    medicine: 5,
    oxen: 40,
  }

  const totalCost =
    supplies.food * prices.food +
    supplies.ammo * prices.ammo +
    supplies.parts * prices.parts +
    supplies.medicine * prices.medicine +
    supplies.oxen * prices.oxen

  const handlePurchase = async () => {
    const totalKarmaCost = Math.ceil(totalCost) // Round up to whole karma

    // Check if we can afford it
    if (!canAfford('neutral', totalKarmaCost)) {
      // Show convert modal to get more karma
      setConvertModalContext({ needed: totalKarmaCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }

    // Spend the karma
    const success = await spendNeutral(totalKarmaCost, 'Matt\'s General Store - Outfitting')
    if (success) {
      purchaseSupplies(supplies)
      setSupplies({ food: 0, ammo: 0, parts: 0, medicine: 0, oxen: 0 })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 p-4">
      <KarmaToastContainer />

      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="font-pixel text-amber-200 text-xl mb-2">Matt's General Store</h1>
          <p className="text-amber-400 text-sm">Independence, Missouri</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Store */}
          <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-4">
            <h2 className="font-pixel text-amber-200 text-sm mb-4 border-b border-amber-600 pb-2">
              Purchase Supplies
            </h2>

            <div className="space-y-4">
              {/* Food */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Food (lbs)</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.food.toFixed(2)}/lb</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, food: Math.max(0, s.food - 50) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.food}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, food: s.food + 50 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Ammo */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Ammo (boxes)</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.ammo}/box</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, ammo: Math.max(0, s.ammo - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.ammo}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, ammo: s.ammo + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Spare Parts */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Spare Parts</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.parts}/ea</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, parts: Math.max(0, s.parts - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.parts}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, parts: s.parts + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Medicine */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Medicine</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.medicine}/unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, medicine: Math.max(0, s.medicine - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.medicine}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, medicine: s.medicine + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Oxen */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Oxen</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.oxen}/ea</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, oxen: Math.max(0, s.oxen - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.oxen}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, oxen: s.oxen + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-600">
              <div className="flex justify-between items-center mb-4">
                <span className="text-amber-400 text-xs font-pixel">Total Cost:</span>
                <span className={`font-pixel text-sm ${!canAfford('neutral', Math.ceil(totalCost)) ? 'text-red-400' : 'text-amber-200'}`}>
                  {Math.ceil(totalCost)}{'\uD83C\uDF2E'}
                </span>
              </div>
              <button
                onClick={handlePurchase}
                disabled={totalCost === 0}
                className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-xs rounded border-2 border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canAfford('neutral', Math.ceil(totalCost)) ? 'Purchase' : 'Get More Karma & Purchase'}
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-4">
            <h2 className="font-pixel text-amber-200 text-sm mb-4 border-b border-amber-600 pb-2">
              Your Wagon
            </h2>

            <div className="space-y-3 text-xs">
              {/* Karma Balance Display */}
              <div className="mb-3 pb-2 border-b border-amber-600">
                <KarmaWallet compact showBadKarma={false} />
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Food:</span>
                <span className="text-amber-200 font-pixel">{state.food} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Ammunition:</span>
                <span className="text-amber-200 font-pixel">{state.ammunition} rounds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Spare Parts:</span>
                <span className="text-amber-200 font-pixel">{state.spareParts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Medicine:</span>
                <span className="text-amber-200 font-pixel">{state.medicine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Oxen:</span>
                <span className="text-amber-200 font-pixel">{state.oxen}</span>
              </div>
            </div>

            {/* Party */}
            <div className="mt-4 pt-4 border-t border-amber-600">
              <h3 className="text-amber-400 text-xs mb-2">Party ({state.party.length} members):</h3>
              <ul className="space-y-1">
                {state.party.map(member => (
                  <li key={member.id} className="text-amber-200 text-xs">
                    {member.name} {member.id === 'leader' && '(Leader)'}
                  </li>
                ))}
              </ul>
            </div>

            {/* Begin Journey - Now goes to character creation first */}
            <button
              onClick={goToCharacterCreation}
              disabled={state.oxen < 2 || state.food < 100}
              className="w-full mt-4 py-3 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-4 border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Your Agent
            </button>
            {(state.oxen < 2 || state.food < 100) && (
              <p className="text-red-400 text-[10px] mt-2 text-center">
                Need at least 2 oxen and 100 lbs of food
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Karma Convert Modal */}
      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false)
            setConvertModalContext(null)
          }}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType === 'good' ? 'good' : 'neutral'}
          onSuccess={() => {
            // Re-trigger purchase after successful conversion
            handlePurchase()
          }}
        />
      )}
    </div>
  )
}
