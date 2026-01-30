'use client'

/**
 * Specialty Shop Component
 *
 * Modal for wagonwright, apothecary, outfitter, assayer, and blacksmith shops.
 * These appear randomly at certain towns and offer unique items.
 */

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useCharacter, type StatName } from '../characterContext'
import { useNarrator } from '../narratorContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaWallet } from './KarmaWallet'
import { KarmaConvertModal } from './KarmaConvertModal'
import {
  type SpecialtyShop as SpecialtyShopType,
  type SpecialtyShopItem,
  meetsRequirement,
} from '../data/specialtyShops'

interface SpecialtyShopProps {
  shop: SpecialtyShopType
  onClose: () => void
}

export function SpecialtyShop({ shop, onClose }: SpecialtyShopProps) {
  const { state, buySupplies } = useOregonTrail()
  const { getStat, modifyStat } = useCharacter()
  const { comment, setMood } = useNarrator()
  const {
    balance, canAfford, spendNeutral, spendGood,
    showConvertModal, setShowConvertModal,
    convertModalContext, setConvertModalContext,
  } = useKarmaWallet()

  const [message, setMessage] = useState<string | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set())
  const [stock, setStock] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    shop.items.forEach(item => { initial[item.id] = item.stock })
    return initial
  })

  const getStats = useCallback((): Record<string, number> => ({
    Shrewdness: getStat('Shrewdness'),
    Agility: getStat('Agility'),
    Durability: getStat('Durability'),
    Diplomacy: getStat('Diplomacy'),
    Luck: getStat('Luck'),
    Expertise: getStat('Expertise'),
  }), [getStat])

  const handleBuy = useCallback(async (item: SpecialtyShopItem) => {
    // Check stock
    if ((stock[item.id] || 0) <= 0) {
      setMessage('Sold out!')
      return
    }

    // Check stat requirement
    const req = meetsRequirement(item, getStats())
    if (!req.meets) {
      setMessage(req.reason || 'Requirements not met')
      return
    }

    // Determine cost type
    const usesGoodKarma = !!item.goodKarmaPrice
    const neutralCost = item.price
    const goodCost = item.goodKarmaPrice || 0

    // Check both currencies if needed
    if (!canAfford('neutral', neutralCost)) {
      setConvertModalContext({ needed: neutralCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }
    if (usesGoodKarma && !canAfford('good', goodCost)) {
      setMessage(`Need ${goodCost}🍪 Good Karma for ${item.name}!`)
      return
    }

    // Spend karma
    const neutralSuccess = await spendNeutral(neutralCost, `${shop.name}: ${item.name}`)
    if (!neutralSuccess) {
      setMessage('Transaction failed!')
      return
    }

    if (usesGoodKarma && goodCost > 0) {
      await spendGood(goodCost, `${shop.name}: ${item.name} (premium)`)
    }

    // Apply effects
    const eff = item.effect
    switch (eff.type) {
      case 'wagon_repair':
        // Repair wagon condition
        buySupplies('spareParts', 0, 0) // Trigger state update
        setMessage(`${item.name} applied! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'wagon_upgrade':
        setMessage(`${item.name} installed! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'health_restore':
        setMessage(`${item.name} administered! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'cure_sickness':
        setMessage(`${item.name} applied! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'stat_buff':
        if (eff.stat) {
          modifyStat(eff.stat as StatName, eff.value)
          setMessage(`${item.name} acquired! ${eff.description} (-${neutralCost}🌮)`)
        }
        break
      case 'resource_add':
        if (item.id.includes('wheel') || item.id.includes('repair') || item.id.includes('spare')) {
          buySupplies('spareParts', eff.value, 0)
        } else if (item.id.includes('winter') || item.id.includes('clothing')) {
          buySupplies('clothing', eff.value, 0)
        }
        setMessage(`${item.name} added to supplies! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'oxen_heal':
        setMessage(`${item.name} applied to your oxen! ${eff.description} (-${neutralCost}🌮)`)
        break
      case 'speed_boost':
        setMessage(`${item.name} applied! ${eff.description} (-${neutralCost}🌮)`)
        break
      default:
        setMessage(`${item.name} acquired! ${eff.description} (-${neutralCost}🌮)`)
    }

    // Update stock and purchases
    setStock(prev => ({ ...prev, [item.id]: (prev[item.id] || 1) - 1 }))
    setPurchasedItems(prev => new Set([...prev, item.id]))

    // Narrator comment on first purchase
    if (purchasedItems.size === 0) {
      setTimeout(() => {
        comment(shop.narratorComment, 'observation')
      }, 800)
    }
  }, [
    stock, getStats, canAfford, spendNeutral, spendGood,
    setConvertModalContext, setShowConvertModal, shop,
    buySupplies, modifyStat, comment, purchasedItems,
  ])

  // Color theme per shop type
  const themeColors = {
    wagonwright: { bg: 'bg-orange-900/60', border: 'border-orange-600', text: 'text-orange-200', accent: 'text-orange-400' },
    apothecary: { bg: 'bg-teal-900/60', border: 'border-teal-600', text: 'text-teal-200', accent: 'text-teal-400' },
    outfitter: { bg: 'bg-sky-900/60', border: 'border-sky-600', text: 'text-sky-200', accent: 'text-sky-400' },
    assayer: { bg: 'bg-yellow-900/60', border: 'border-yellow-600', text: 'text-yellow-200', accent: 'text-yellow-400' },
    blacksmith: { bg: 'bg-red-900/60', border: 'border-red-600', text: 'text-red-200', accent: 'text-red-400' },
  }
  const theme = themeColors[shop.type]

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className={`bg-stone-950 border-2 ${theme.border} rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`${theme.bg} p-4 border-b ${theme.border} flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{shop.emoji}</span>
            <div>
              <h2 className={`${theme.text} font-bold`}>{shop.name}</h2>
              <p className={`${theme.accent} text-xs`}>Proprietor: {shop.keeperName}</p>
            </div>
          </div>
          <div className="text-right">
            <KarmaWallet compact showBadKarma={false} />
          </div>
        </div>

        {/* Keeper Greeting */}
        <div className={`${theme.bg} border-b ${theme.border} p-3`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{shop.emoji}</span>
            <div>
              <p className={`${theme.accent} text-xs font-bold`}>{shop.keeperName} says:</p>
              <p className={`${theme.text} text-sm italic`}>"{shop.keeperGreeting}"</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className={`${theme.accent} text-sm mb-4`}>{shop.description}</p>

          <div className="space-y-3">
            {shop.items.map(item => {
              const remaining = stock[item.id] || 0
              const soldOut = remaining <= 0
              const req = meetsRequirement(item, getStats())
              const affordable = canAfford('neutral', item.price) && (!item.goodKarmaPrice || canAfford('good', item.goodKarmaPrice))
              const available = !soldOut && req.meets && affordable

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    soldOut
                      ? 'bg-gray-900/50 border-gray-700 opacity-40'
                      : available
                        ? `${theme.bg} ${theme.border} hover:brightness-110 cursor-pointer`
                        : `${theme.bg} ${theme.border} opacity-60`
                  }`}
                  onClick={() => available && handleBuy(item)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`${theme.text} font-bold`}>{item.name}</h3>
                          {soldOut && (
                            <span className="text-xs text-red-400 bg-red-900/50 px-2 py-0.5 rounded">SOLD OUT</span>
                          )}
                          {purchasedItems.has(item.id) && !soldOut && (
                            <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded ml-1">PURCHASED</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${affordable ? 'text-yellow-300' : 'text-red-400'}`}>
                            {item.price}🌮
                          </p>
                          {item.goodKarmaPrice && (
                            <p className={`text-xs ${canAfford('good', item.goodKarmaPrice) ? 'text-amber-400' : 'text-red-400'}`}>
                              +{item.goodKarmaPrice}🍪
                            </p>
                          )}
                        </div>
                      </div>
                      <p className={`${theme.accent} text-xs mt-1`}>{item.description}</p>
                      <p className="text-green-400/80 text-xs mt-1 italic">{item.effect.description}</p>

                      {/* Stat requirement */}
                      {item.requiresStat && (
                        <p className={`text-xs mt-1 ${req.meets ? 'text-green-400' : 'text-red-400'}`}>
                          [{item.requiresStat.stat} {item.requiresStat.minimum}] {req.meets ? '✓' : req.reason}
                        </p>
                      )}

                      {/* Stock indicator */}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">Stock: {remaining}</span>
                        {item.effect.duration && item.effect.duration > 0 && (
                          <span className="text-xs text-gray-500">Duration: {item.effect.duration} days</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t ${theme.border} p-4`}>
          {message && (
            <p className={`${theme.text} text-sm mb-3 text-center`}>{message}</p>
          )}
          <button
            onClick={() => {
              if (purchasedItems.size > 0) {
                setMood('impressed')
                comment(`"${shop.keeperFarewell}" says ${shop.keeperName}.`, 'observation')
              }
              onClose()
            }}
            className={`w-full py-3 md:py-2 rounded font-bold text-base md:text-sm active:scale-[0.99] ${theme.bg} ${theme.text} hover:brightness-110`}
          >
            Leave {shop.name}
          </button>
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
        />
      )}
    </div>
  )
}

export default SpecialtyShop
