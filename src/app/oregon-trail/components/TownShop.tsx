'use client'

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useNarrator } from '../narratorContext'
import { useReputation } from '../reputationContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaWallet } from './KarmaWallet'
import { KarmaConvertModal } from './KarmaConvertModal'

interface ShopItem {
  id: string
  name: string
  emoji: string
  basePrice: number
  sellPrice: number
  unit: string
  description: string
  resource: 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing'
  quantity: number  // How much you get per purchase
}

const SHOP_INVENTORY: ShopItem[] = [
  {
    id: 'food',
    name: 'Trail Provisions',
    emoji: '🥫',
    basePrice: 0.20,
    sellPrice: 0.10,
    unit: 'lb',
    description: 'Hardtack, jerky, and dried beans',
    resource: 'food',
    quantity: 50,
  },
  {
    id: 'ammo',
    name: 'Ammunition',
    emoji: '🎯',
    basePrice: 2,
    sellPrice: 1,
    unit: 'box',
    description: 'Box of 20 rounds',
    resource: 'ammunition',
    quantity: 20,
  },
  {
    id: 'medicine',
    name: 'Medicine Kit',
    emoji: '💊',
    basePrice: 15,
    sellPrice: 8,
    unit: 'kit',
    description: 'Laudanum, bandages, and salves',
    resource: 'medicine',
    quantity: 1,
  },
  {
    id: 'parts',
    name: 'Wagon Parts',
    emoji: '🔧',
    basePrice: 25,
    sellPrice: 12,
    unit: 'set',
    description: 'Axles, wheels, and tongues',
    resource: 'spareParts',
    quantity: 1,
  },
  {
    id: 'clothing',
    name: 'Warm Clothing',
    emoji: '🧥',
    basePrice: 10,
    sellPrice: 5,
    unit: 'set',
    description: 'Wool coats and blankets',
    resource: 'clothing',
    quantity: 1,
  },
]

// Easter egg items that appear randomly or under special conditions
// These cost GOOD KARMA (premium currency) 🍪
const SPECIAL_ITEMS: Array<{
  id: string
  name: string
  emoji: string
  price: number  // In Good Karma 🍪
  description: string
  rarity: number  // 0-1, chance of appearing
  effect: string
  narratorComment?: string
}> = [
  {
    id: 'mysterious_map',
    name: 'Mysterious Map',
    emoji: '🗺️',
    price: 15,  // 15 Good Karma
    description: 'A faded map with an X marked near Gold Country',
    rarity: 0.15,
    effect: 'Reveals a shortcut at the next landmark',
    narratorComment: "The map smells faintly of adventure and poor life choices. The narrator approves.",
  },
  {
    id: 'snake_oil',
    name: "Dr. Pemberton's Miracle Elixir",
    emoji: '🧪',
    price: 3,  // 3 Good Karma
    description: 'Cures what ails ya! (Results may vary)',
    rarity: 0.25,
    effect: 'Either heals 20 health or causes 10 damage. Luck decides.',
    narratorComment: "The bottle is 90% alcohol and 10% optimism.",
  },
  {
    id: 'lucky_horseshoe',
    name: 'Lucky Horseshoe',
    emoji: '🧲',
    price: 5,  // 5 Good Karma
    description: "Found on the trail. Previous owner's luck ran out.",
    rarity: 0.20,
    effect: '+1 Luck permanently',
    narratorComment: "The horseshoe still has the nail holes. The narrator doesn't mention what happened to the horse.",
  },
  {
    id: 'dime_novel',
    name: 'Dime Novel: Black Bart',
    emoji: '📖',
    price: 1,  // 1 Good Karma
    description: 'A highly fictionalized account of the outlaw',
    rarity: 0.30,
    effect: 'Reading it grants insight into outlaw behavior (+1 clue hint)',
    narratorComment: "Chapter 7 is particularly inaccurate. The narrator knows because the narrator was there.",
  },
  {
    id: 'towel',
    name: 'Slightly Damp Towel',
    emoji: '🧣',
    price: 42,  // 42 Good Karma (Easter egg!)
    description: 'The most massively useful thing any interstellar hitchhiker can have',
    rarity: 0.05,
    effect: 'Grants +42% resistance to panic',
    narratorComment: "Don't panic. And always know where your towel is.",
  },
]

interface TownShopProps {
  onClose: () => void
}

// Transaction record for undo functionality
interface Transaction {
  id: string
  type: 'buy' | 'sell'
  item: ShopItem
  amount: number      // Units transacted
  karmaChange: number // Positive = earned, negative = spent
  timestamp: number
}

export function TownShop({ onClose }: TownShopProps) {
  const { state, buySupplies, sellSupplies } = useOregonTrail()
  const { comment, setMood } = useNarrator()
  const { getInteractionBonus, modifyReputation } = useReputation()
  const { balance, canAfford, spendNeutral, spendGood, earnNeutral, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()

  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [message, setMessage] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [availableSpecials] = useState(() =>
    SPECIAL_ITEMS.filter(item => Math.random() < item.rarity)
  )

  // Price modifier based on reputation
  const settlerBonus = getInteractionBonus('settlers')
  const priceModifier = 1 - (settlerBonus * 0.02)  // Up to 20% discount at max rep

  const getPrice = useCallback((item: ShopItem, isSelling: boolean) => {
    const basePrice = isSelling ? item.sellPrice : item.basePrice
    return isSelling ? basePrice : Math.max(0.01, basePrice * priceModifier)
  }, [priceModifier])

  const getCurrentStock = useCallback((resource: string) => {
    switch (resource) {
      case 'food': return state.food
      case 'ammunition': return state.ammunition
      case 'medicine': return state.medicine
      case 'spareParts': return state.spareParts
      case 'clothing': return state.clothing || 0
      default: return 0
    }
  }, [state])

  const handleBuy = useCallback(async (item: ShopItem, qty: number) => {
    const totalCost = Math.ceil(getPrice(item, false) * item.quantity * qty)
    const totalAmount = item.quantity * qty

    if (!canAfford('neutral', totalCost)) {
      // Show conversion modal
      setConvertModalContext({ needed: totalCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }

    const success = await spendNeutral(totalCost, `${item.name} x${qty}`)
    if (success) {
      buySupplies(item.resource, totalAmount, 0) // Don't deduct gold (already done via karma)

      // Record transaction for undo
      const tx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'buy',
        item,
        amount: totalAmount,
        karmaChange: -totalCost,
        timestamp: Date.now(),
      }
      setTransactions(prev => [tx, ...prev])
      setMessage(`Bought ${totalAmount} ${item.unit}(s) of ${item.name} for ${totalCost}🪙`)

      // Build reputation with settlers for fair trade
      if (qty >= 3) {
        modifyReputation('settlers', 1, 'Generous purchase', state.currentLandmark)
      }
    }
  }, [state.currentLandmark, getPrice, buySupplies, modifyReputation, canAfford, spendNeutral, setConvertModalContext, setShowConvertModal])

  const handleSell = useCallback(async (item: ShopItem, qty: number) => {
    // Sell in units, not batches - qty is the number of units to sell
    const totalAmount = qty
    const currentStock = getCurrentStock(item.resource)

    if (currentStock < totalAmount) {
      setMessage("You don't have enough to sell!")
      return
    }

    // Sell price is per unit
    const totalKarma = Math.floor(item.sellPrice * totalAmount)
    if (totalKarma <= 0) {
      setMessage("Not enough to sell for any karma!")
      return
    }

    sellSupplies(item.resource, totalAmount, 0) // Don't add gold (use karma instead)
    await earnNeutral(totalKarma, `Sold ${item.name} x${qty}`)

    // Record transaction for undo
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'sell',
      item,
      amount: totalAmount,
      karmaChange: totalKarma,
      timestamp: Date.now(),
    }
    setTransactions(prev => [tx, ...prev])
    setMessage(`Sold ${totalAmount} ${item.unit}(s) of ${item.name} for ${totalKarma}🪙`)
  }, [getCurrentStock, sellSupplies, earnNeutral])

  const handleBuySpecial = useCallback(async (item: typeof SPECIAL_ITEMS[0]) => {
    // Special items cost Good Karma 🍪
    if (!canAfford('good', item.price)) {
      setMessage(`You need ${item.price}🍪 Good Karma for this item!`)
      setMood('amused')
      comment("Good karma is earned through virtuous deeds, not purchased. The irony is not lost on the narrator.", 'observation')
      return
    }

    const success = await spendGood(item.price, `Special: ${item.name}`)
    if (success) {
      setMessage(`You acquired: ${item.name}! (-${item.price}🍪)`)

      if (item.narratorComment) {
        setTimeout(() => {
          comment(item.narratorComment!, 'observation')
        }, 500)
      }

      // Easter egg: buying at exactly 42 Good Karma
      if (item.price === 42) {
        setMood('impressed')
        setTimeout(() => {
          comment("The answer to life, the universe, and everything... is exact karma.", 'withholding')
        }, 1500)
      }
    }
  }, [canAfford, spendGood, comment, setMood])

  // Undo a transaction - reverse the supply and karma changes
  const undoTransaction = useCallback(async (txId: string) => {
    const tx = transactions.find(t => t.id === txId)
    if (!tx) return

    if (tx.type === 'buy') {
      // Undo buy: remove supplies, refund karma
      const currentStock = getCurrentStock(tx.item.resource)
      if (currentStock < tx.amount) {
        setMessage("Can't undo - you've already used some of these supplies!")
        return
      }
      sellSupplies(tx.item.resource, tx.amount, 0) // Remove the supplies
      await earnNeutral(Math.abs(tx.karmaChange), `Refund: ${tx.item.name}`) // Refund karma
      setMessage(`Undid purchase: +${Math.abs(tx.karmaChange)}🪙 returned`)
    } else {
      // Undo sell: restore supplies, take back karma
      const karmaToTakeBack = tx.karmaChange
      if (!canAfford('neutral', karmaToTakeBack)) {
        setMessage("Can't undo - you don't have enough karma to return!")
        return
      }
      await spendNeutral(karmaToTakeBack, `Undo sale: ${tx.item.name}`) // Take back karma
      buySupplies(tx.item.resource, tx.amount, 0) // Restore the supplies
      setMessage(`Undid sale: ${tx.amount} ${tx.item.unit}(s) returned`)
    }

    // Remove the transaction from history
    setTransactions(prev => prev.filter(t => t.id !== txId))
  }, [transactions, getCurrentStock, sellSupplies, buySupplies, earnNeutral, spendNeutral, canAfford])

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-900 p-4 border-b border-amber-600 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h2 className="text-amber-200 font-bold">General Store</h2>
              <p className="text-amber-400 text-xs">{state.currentLandmark}</p>
              {settlerBonus > 0 && (
                <p className="text-green-400 text-xs">Settler Discount: {Math.round(settlerBonus * 2)}%</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <KarmaWallet compact showBadKarma={false} />
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-amber-700">
          <button
            onClick={() => setMode('buy')}
            className={`flex-1 py-2 text-sm font-bold ${
              mode === 'buy'
                ? 'bg-amber-800 text-amber-200'
                : 'bg-amber-950 text-amber-500 hover:text-amber-300'
            }`}
          >
            Buy Supplies
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 py-2 text-sm font-bold ${
              mode === 'sell'
                ? 'bg-amber-800 text-amber-200'
                : 'bg-amber-950 text-amber-500 hover:text-amber-300'
            }`}
          >
            Sell Supplies
          </button>
        </div>

        {/* Inventory */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Regular Items */}
          <div className="grid gap-3">
            {SHOP_INVENTORY.map(item => {
              const stock = getCurrentStock(item.resource)
              // Buy mode: price per batch (item.quantity units)
              // Sell mode: price per unit
              const displayPrice = mode === 'buy'
                ? Math.ceil(getPrice(item, false) * item.quantity)
                : item.sellPrice
              const itemAffordable = mode === 'buy'
                ? canAfford('neutral', displayPrice)
                : stock >= 1  // Can sell if you have at least 1 unit

              return (
                <div
                  key={item.id}
                  className={`bg-amber-900/50 border rounded-lg p-3 ${
                    itemAffordable
                      ? 'border-amber-600 hover:bg-amber-800/50 cursor-pointer'
                      : 'border-gray-700 opacity-50'
                  }`}
                  onClick={() => itemAffordable && setSelectedItem(item)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-amber-200 font-bold">{item.name}</h3>
                          <p className="text-amber-400 text-xs">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${mode === 'sell' ? 'text-green-400' : 'text-yellow-300'}`}>
                            {mode === 'sell' ? displayPrice.toFixed(2) : displayPrice}🪙
                          </p>
                          <p className="text-amber-500 text-xs">
                            {mode === 'buy' ? `per ${item.quantity} ${item.unit}` : `per ${item.unit}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-amber-500 text-xs">You have: {stock} {item.unit}</span>
                        {selectedItem?.id === item.id && (
                          <div className="flex items-center gap-2 md:gap-2 flex-wrap">
                            {/* Standard +/- controls */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (mode === 'sell') {
                                  setQuantity(q => Math.max(1, q - (item.resource === 'food' ? 10 : 1)))
                                } else {
                                  setQuantity(q => Math.max(1, q - 1))
                                }
                              }}
                              className="w-10 h-10 md:w-6 md:h-6 text-lg md:text-base bg-amber-700 rounded text-amber-200 active:bg-amber-600"
                            >
                              -
                            </button>
                            <span className="text-amber-200 w-12 text-center text-base md:text-sm">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (mode === 'sell') {
                                  const step = item.resource === 'food' ? 10 : 1
                                  setQuantity(q => Math.min(stock, q + step))
                                } else {
                                  setQuantity(q => q + 1)
                                }
                              }}
                              className="w-10 h-10 md:w-6 md:h-6 text-lg md:text-base bg-amber-700 rounded text-amber-200 active:bg-amber-600"
                            >
                              +
                            </button>

                            {/* Quick-set buttons for sell mode */}
                            {mode === 'sell' && (
                              <div className="flex items-center gap-1 md:gap-1 ml-1 border-l border-amber-600 pl-2">
                                {[1, 10, 100].map(amt => (
                                  <button
                                    key={amt}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setQuantity(Math.min(amt, stock))
                                    }}
                                    disabled={stock < 1}
                                    className={`px-3 py-2 md:px-2 md:py-0.5 rounded text-sm md:text-xs font-bold active:scale-95 ${
                                      quantity === Math.min(amt, stock) && amt <= stock
                                        ? 'bg-green-600 text-green-100'
                                        : amt <= stock
                                          ? 'bg-amber-600 text-amber-100 hover:bg-amber-500'
                                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {amt}
                                  </button>
                                ))}
                                {/* Sell All button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setQuantity(stock)
                                  }}
                                  disabled={stock < 1}
                                  className={`px-3 py-2 md:px-2 md:py-0.5 rounded text-sm md:text-xs font-bold active:scale-95 ${
                                    quantity === stock
                                      ? 'bg-green-600 text-green-100'
                                      : 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                                  }`}
                                >
                                  All
                                </button>
                              </div>
                            )}

                            {/* Show total karma to be earned/spent */}
                            <span className={`text-sm md:text-xs ${mode === 'sell' ? 'text-green-400' : 'text-yellow-300'}`}>
                              {mode === 'sell'
                                ? `+${Math.floor(item.sellPrice * quantity)}🪙`
                                : `-${Math.ceil(getPrice(item, false) * item.quantity * quantity)}🪙`
                              }
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (mode === 'buy') handleBuy(item, quantity)
                                else handleSell(item, quantity)
                                setSelectedItem(null)
                                setQuantity(1)
                              }}
                              className={`px-4 py-2 md:px-3 md:py-1 rounded text-base md:text-sm font-bold active:scale-95 ${
                                mode === 'buy'
                                  ? 'bg-green-700 text-green-100 hover:bg-green-600'
                                  : 'bg-blue-700 text-blue-100 hover:bg-blue-600'
                              }`}
                            >
                              {mode === 'buy' ? 'Buy' : 'Sell'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Special Items - Cost Good Karma 🍪 */}
          {mode === 'buy' && availableSpecials.length > 0 && (
            <div className="mt-6">
              <h3 className="text-purple-300 font-bold mb-3 flex items-center gap-2">
                <span>✨</span> Curious Wares <span className="text-amber-400 text-xs font-normal">(Cost Good Karma 🍪)</span>
              </h3>
              <div className="grid gap-3">
                {availableSpecials.map(item => (
                  <div
                    key={item.id}
                    className={`bg-purple-900/30 border border-purple-600 rounded-lg p-3 ${
                      canAfford('good', item.price)
                        ? 'hover:bg-purple-800/30 cursor-pointer'
                        : 'opacity-50'
                    }`}
                    onClick={() => canAfford('good', item.price) && handleBuySpecial(item)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-purple-200 font-bold">{item.name}</h3>
                          <p className="text-amber-400 font-bold">{item.price}🍪</p>
                        </div>
                        <p className="text-purple-300 text-xs">{item.description}</p>
                        <p className="text-purple-400 text-xs italic mt-1">{item.effect}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transaction History with Undo */}
        {transactions.length > 0 && (
          <div className="border-t border-amber-700 p-3 bg-amber-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-300 text-xs font-bold">Recent Transactions</span>
              <span className="text-amber-500 text-xs">(undo available until you leave)</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {transactions.slice(0, 5).map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-amber-950/50 rounded px-2 py-1 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{tx.item.emoji}</span>
                    <span className={tx.type === 'buy' ? 'text-red-300' : 'text-green-300'}>
                      {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.amount} {tx.item.unit}
                    </span>
                    <span className={tx.karmaChange > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.karmaChange > 0 ? '+' : ''}{tx.karmaChange}🪙
                    </span>
                  </div>
                  <button
                    onClick={() => undoTransaction(tx.id)}
                    className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message & Close */}
        <div className="border-t border-amber-700 p-4">
          {message && (
            <p className="text-amber-200 text-sm mb-3 text-center">{message}</p>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 bg-amber-700 text-amber-100 rounded hover:bg-amber-600 font-bold"
          >
            Leave Store
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

export default TownShop
