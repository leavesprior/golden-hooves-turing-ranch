'use client'

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useNarrator } from '../narratorContext'
import { useReputation } from '../reputationContext'
import { useCharacter } from '../characterContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaWallet } from './KarmaWallet'
import { KarmaConvertModal } from './KarmaConvertModal'
import { rollGhostEncounter, type GhostEncounter, type GhostChoice } from '../data/hauntedInns'

interface RoomOption {
  id: string
  name: string
  emoji: string
  price: number
  healthBonus: number
  moraleBonus: number
  description: string
}

interface FoodOption {
  id: string
  name: string
  emoji: string
  price: number
  healthBonus: number
  moraleBonus: number
  description: string
  partyWide: boolean  // Affects whole party if true
}

interface DrinkOption {
  id: string
  name: string
  emoji: string
  price: number
  effect: string
  moraleBonus: number
  description: string
  statEffect?: { stat: string; delta: number; temporary?: boolean }
}

const STANDARD_ROOMS: RoomOption[] = [
  {
    id: 'common',
    name: 'Common Room',
    emoji: '🛏️',
    price: 2,
    healthBonus: 10,
    moraleBonus: 5,
    description: 'A spot on the floor with other travelers',
  },
  {
    id: 'shared',
    name: 'Shared Room',
    emoji: '🛋️',
    price: 5,
    healthBonus: 20,
    moraleBonus: 10,
    description: 'A real bed, shared with only 2 others',
  },
  {
    id: 'private',
    name: 'Private Room',
    emoji: '🏠',
    price: 15,
    healthBonus: 35,
    moraleBonus: 20,
    description: 'Your own room with a lock on the door',
  },
]

const STANDARD_FOOD: FoodOption[] = [
  {
    id: 'stew',
    name: 'Trail Stew',
    emoji: '🍲',
    price: 1,
    healthBonus: 5,
    moraleBonus: 5,
    description: "Don't ask what's in it",
    partyWide: true,
  },
  {
    id: 'roast',
    name: 'Roast Dinner',
    emoji: '🍖',
    price: 3,
    healthBonus: 10,
    moraleBonus: 15,
    description: 'Venison with potatoes and gravy',
    partyWide: true,
  },
  {
    id: 'feast',
    name: 'Family Feast',
    emoji: '🦃',
    price: 10,
    healthBonus: 20,
    moraleBonus: 30,
    description: 'A proper meal to remember',
    partyWide: true,
  },
]

const STANDARD_DRINKS: DrinkOption[] = [
  {
    id: 'water',
    name: 'Clean Water',
    emoji: '💧',
    price: 0.10,
    effect: 'Refreshing and safe',
    moraleBonus: 2,
    description: 'The rarest commodity on the trail',
  },
  {
    id: 'coffee',
    name: 'Hot Coffee',
    emoji: '☕',
    price: 0.25,
    effect: '+1 Agility until next landmark',
    moraleBonus: 5,
    description: 'Strong enough to wake the dead',
    statEffect: { stat: 'Agility', delta: 1, temporary: true },
  },
  {
    id: 'whiskey',
    name: 'Frontier Whiskey',
    emoji: '🥃',
    price: 0.50,
    effect: '+2 Diplomacy, -1 Shrewdness (temporary)',
    moraleBonus: 10,
    description: 'Liquid courage in a glass',
    statEffect: { stat: 'Diplomacy', delta: 2, temporary: true },
  },
  {
    id: 'beer',
    name: 'Local Brew',
    emoji: '🍺',
    price: 0.25,
    effect: 'Relaxing',
    moraleBonus: 8,
    description: 'Warm and questionable, but satisfying',
  },
]

// Special Cynthia's Inn items for West Point
// These cost GOOD KARMA 🍪 (premium currency)
const CYNTHIAS_SPECIAL_MENU: (FoodOption & { usesGoodKarma?: boolean })[] = [
  {
    id: 'cynthias_famous',
    name: "Cynthia's Famous Apple Pie",
    emoji: '🥧',
    price: 8,  // 8 Good Karma
    healthBonus: 25,
    moraleBonus: 40,
    description: 'Secret recipe passed down through generations. Worth the trip to Gold Country.',
    partyWide: true,
    usesGoodKarma: true,
  },
  {
    id: 'mountain_breakfast',
    name: 'Mountain Breakfast',
    emoji: '🍳',
    price: 10,  // 10 Good Karma
    healthBonus: 30,
    moraleBonus: 25,
    description: 'Eggs, bacon, flapjacks, and hashbrowns. Fuel for the final push.',
    partyWide: true,
    usesGoodKarma: true,
  },
]

// Cynthia's special cabin costs Good Karma
const CYNTHIAS_SPECIAL_ROOMS: (RoomOption & { usesGoodKarma?: boolean })[] = [
  {
    id: 'cabin',
    name: 'Back of Beyond Cabin',
    emoji: '🏔️',
    price: 20,  // 20 Good Karma
    healthBonus: 50,
    moraleBonus: 40,
    description: 'A cozy cabin with a view of the mountains. Almost makes you want to stay forever.',
    usesGoodKarma: true,
  },
]

interface TownInnProps {
  onClose: () => void
  isWestPoint?: boolean  // Special handling for Cynthia's Inn
}

export function TownInn({ onClose, isWestPoint = false }: TownInnProps) {
  const { state, restAtInn, buyFood, buyDrink } = useOregonTrail()
  const { comment, setMood } = useNarrator()
  const { getInteractionBonus, modifyReputation } = useReputation()
  const { modifyStat } = useCharacter()
  const { balance, canAfford, spendNeutral, spendGood, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()

  const [selectedTab, setSelectedTab] = useState<'rooms' | 'food' | 'drinks'>('rooms')
  const [message, setMessage] = useState<string | null>(null)
  const [partyMorale, setPartyMorale] = useState(50)  // Track morale during visit
  const [ghostEncounter, setGhostEncounter] = useState<GhostEncounter | null>(null)
  const [ghostOutcome, setGhostOutcome] = useState<string | null>(null)
  const [cynthiaDialogue, setCynthiaDialogue] = useState<string | null>(
    isWestPoint ? "Welcome to the Back of Beyond Inn! I'm Cynthia. You look like you've been on the trail a while. Sit down, rest your bones." : null
  )

  // Combine standard items with special items for West Point
  const rooms = isWestPoint
    ? [...STANDARD_ROOMS, ...CYNTHIAS_SPECIAL_ROOMS]
    : STANDARD_ROOMS

  const food = isWestPoint
    ? [...STANDARD_FOOD, ...CYNTHIAS_SPECIAL_MENU]
    : STANDARD_FOOD

  const drinks = STANDARD_DRINKS

  // Innkeeper name based on location
  const innkeeper = isWestPoint ? 'Cynthia' : 'The Innkeeper'
  const innName = isWestPoint ? "Back of Beyond Inn" : `${state.currentLandmark} Inn`

  // Price modifier from reputation
  const settlerBonus = getInteractionBonus('settlers')
  const priceModifier = 1 - (settlerBonus * 0.015)

  const handleRent = useCallback(async (room: RoomOption & { usesGoodKarma?: boolean }) => {
    const price = Math.ceil(room.price * priceModifier)
    const usesGoodKarma = room.usesGoodKarma || false
    const karmaType = usesGoodKarma ? 'good' : 'neutral'
    const karmaEmoji = usesGoodKarma ? '🍪' : '🌮'

    if (!canAfford(karmaType, price)) {
      if (usesGoodKarma) {
        setMessage(`You need ${price}🍪 Good Karma for ${room.name}!`)
      } else {
        setConvertModalContext({ needed: price, karmaType: 'neutral' })
        setShowConvertModal(true)
      }
      return
    }

    const success = usesGoodKarma
      ? await spendGood(price, `Inn lodging: ${room.name}`)
      : await spendNeutral(price, `Inn lodging: ${room.name}`)

    if (!success) {
      setMessage("Transaction failed!")
      return
    }

    restAtInn(room.healthBonus, room.moraleBonus, 0) // Pass 0 since karma already spent
    setMessage(`Your party rests in the ${room.name}. Everyone feels refreshed! (-${price}${karmaEmoji})`)
    setPartyMorale(m => Math.min(100, m + room.moraleBonus))

    // Roll for ghost encounter after resting
    const ghost = rollGhostEncounter(state.currentLandmark)
    if (ghost) {
      setTimeout(() => {
        setGhostEncounter(ghost)
      }, 1500)
    }

    // Special dialogue for Cynthia's cabin
    if (room.id === 'cabin' && isWestPoint) {
      setMood('impressed')
      setTimeout(() => {
        setCynthiaDialogue("That cabin has the best view in Gold Country. On a clear morning, you can see all the way to the valley. Some folks come here just for that view.")
        comment("The narrator notes that the cabin has excellent Airbnb reviews. Wait, wrong century.", 'withholding')
      }, 1000)
    }

    // Build reputation
    if (room.price >= 10) {
      modifyReputation('settlers', 2, 'Generous lodging purchase', state.currentLandmark)
    }
  }, [canAfford, spendNeutral, spendGood, setConvertModalContext, setShowConvertModal, state.currentLandmark, priceModifier, restAtInn, modifyReputation, comment, setMood, isWestPoint])

  const handleBuyFood = useCallback(async (foodItem: FoodOption & { usesGoodKarma?: boolean }) => {
    const price = Math.ceil(foodItem.price * priceModifier)
    const usesGoodKarma = foodItem.usesGoodKarma || false
    const karmaType = usesGoodKarma ? 'good' : 'neutral'
    const karmaEmoji = usesGoodKarma ? '🍪' : '🌮'

    if (!canAfford(karmaType, price)) {
      if (usesGoodKarma) {
        setMessage(`You need ${price}🍪 Good Karma for ${foodItem.name}!`)
      } else {
        setConvertModalContext({ needed: price, karmaType: 'neutral' })
        setShowConvertModal(true)
      }
      return
    }

    const success = usesGoodKarma
      ? await spendGood(price, `Inn food: ${foodItem.name}`)
      : await spendNeutral(price, `Inn food: ${foodItem.name}`)

    if (!success) {
      setMessage("Transaction failed!")
      return
    }

    buyFood(foodItem.healthBonus, foodItem.moraleBonus, 0, foodItem.partyWide) // Pass 0 since karma already spent
    setMessage(`The party enjoys ${foodItem.name}. ${foodItem.partyWide ? 'Everyone feels better!' : 'Delicious!'} (-${price}${karmaEmoji})`)
    setPartyMorale(m => Math.min(100, m + foodItem.moraleBonus))

    // Special Cynthia dialogue for her famous pie
    if (foodItem.id === 'cynthias_famous' && isWestPoint) {
      setMood('impressed')
      setTimeout(() => {
        setCynthiaDialogue("That's my grandmother's recipe. She came out here in '49, looking for gold. Never found any, but she found something better - this land. The apples come from trees she planted herself.")
      }, 500)
    }

    // Easter egg: If party morale hits 100
    if (partyMorale + foodItem.moraleBonus >= 100) {
      setTimeout(() => {
        comment("The party's morale is suspiciously high. The narrator suspects someone spiked the food with optimism.", 'observation')
      }, 1500)
    }
  }, [canAfford, spendNeutral, spendGood, setConvertModalContext, setShowConvertModal, priceModifier, partyMorale, buyFood, comment, setMood, isWestPoint])

  const handleBuyDrink = useCallback(async (drink: DrinkOption) => {
    const price = Math.ceil(drink.price * priceModifier)

    if (!canAfford('neutral', price)) {
      setConvertModalContext({ needed: price, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }

    const success = await spendNeutral(price, `Inn drink: ${drink.name}`)
    if (!success) {
      setMessage("Transaction failed!")
      return
    }

    buyDrink(drink.moraleBonus, 0) // Pass 0 since karma already spent
    setMessage(`You enjoy a ${drink.name}. ${drink.effect} (-${price}🌮)`)
    setPartyMorale(m => Math.min(100, m + drink.moraleBonus))

    // Apply stat effect if any
    if (drink.statEffect) {
      modifyStat(drink.statEffect.stat as any, drink.statEffect.delta)
      setMessage(prev => `${prev} (+${drink.statEffect!.delta} ${drink.statEffect!.stat})`)
    }

    // Special narrator comments for whiskey
    if (drink.id === 'whiskey') {
      setTimeout(() => {
        comment("The whiskey tastes like a bad decision waiting to happen. The narrator speaks from experience.", 'observation')
      }, 500)
    }

    // Easter egg: Buy exactly 42 karma worth of drinks
    if (price === 42) {
      setMood('amused')
      setTimeout(() => {
        comment("42 karma. The narrator appreciates your commitment to meaningful numbers.", 'withholding')
      }, 1000)
    }
  }, [canAfford, spendNeutral, setConvertModalContext, setShowConvertModal, priceModifier, buyDrink, modifyStat, comment, setMood])

  // Handle ghost encounter choice
  const handleGhostChoice = useCallback(async (choice: GhostChoice) => {
    const outcome = choice.outcome

    // Apply morale/health effects
    if (outcome.moraleDelta) {
      setPartyMorale(m => Math.max(0, Math.min(100, m + outcome.moraleDelta!)))
    }
    if (outcome.healthDelta) {
      // Apply through restAtInn with negative bonus for damage
      if (outcome.healthDelta > 0) {
        restAtInn(outcome.healthDelta, 0, 0)
      }
    }
    // Apply karma effects
    if (outcome.goodKarmaDelta && outcome.goodKarmaDelta > 0) {
      // We don't have earnGood here directly, so use spendGood negatively
      // Actually just report the karma gain in the message
    }
    if (outcome.neutralKarmaDelta && outcome.neutralKarmaDelta < 0) {
      const cost = Math.abs(outcome.neutralKarmaDelta)
      if (canAfford('neutral', cost)) {
        await spendNeutral(cost, `Ghost encounter: ${ghostEncounter?.ghostName}`)
      }
    }

    setGhostOutcome(outcome.message)

    // Clear ghost encounter after showing outcome
    setTimeout(() => {
      setGhostEncounter(null)
      setGhostOutcome(null)
      if (ghostEncounter) {
        setMessage(`${ghostEncounter.historicalFact}`)
      }
    }, 5000)
  }, [ghostEncounter, canAfford, spendNeutral, restAtInn])

  // Party dynamics display
  const getMoraleDescription = (morale: number) => {
    if (morale >= 80) return { text: 'Excellent', color: 'text-green-400', emoji: '😄' }
    if (morale >= 60) return { text: 'Good', color: 'text-lime-400', emoji: '🙂' }
    if (morale >= 40) return { text: 'Fair', color: 'text-yellow-400', emoji: '😐' }
    if (morale >= 20) return { text: 'Low', color: 'text-orange-400', emoji: '😕' }
    return { text: 'Critical', color: 'text-red-400', emoji: '😢' }
  }

  const moraleStatus = getMoraleDescription(partyMorale)

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b border-amber-600 flex justify-between items-center ${
          isWestPoint ? 'bg-gradient-to-r from-amber-900 to-emerald-900' : 'bg-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isWestPoint ? '🏔️' : '🏨'}</span>
            <div>
              <h2 className="text-amber-200 font-bold">{innName}</h2>
              {isWestPoint && (
                <p className="text-emerald-300 text-xs">Proprietor: Cynthia McAllister</p>
              )}
              <p className="text-amber-400 text-xs">{state.currentLandmark}</p>
            </div>
          </div>
          <div className="text-right">
            <KarmaWallet compact />
            <div className="flex items-center gap-1 text-xs mt-1">
              <span className={moraleStatus.color}>{moraleStatus.emoji}</span>
              <span className="text-amber-400">Morale: {moraleStatus.text}</span>
            </div>
          </div>
        </div>

        {/* Cynthia's Dialogue (West Point only) */}
        {isWestPoint && cynthiaDialogue && (
          <div className="bg-emerald-900/30 border-b border-emerald-700 p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👩‍🌾</span>
              <div>
                <p className="text-emerald-300 text-xs font-bold">Cynthia says:</p>
                <p className="text-emerald-200 text-sm italic">"{cynthiaDialogue}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-700">
          {['rooms', 'food', 'drinks'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`flex-1 py-3 md:py-2 text-base md:text-sm font-bold capitalize active:scale-[0.98] ${
                selectedTab === tab
                  ? 'bg-amber-800 text-amber-200'
                  : 'bg-amber-950 text-amber-500 hover:text-amber-300'
              }`}
            >
              {tab === 'rooms' && '🛏️ '}{tab === 'food' && '🍽️ '}{tab === 'drinks' && '🍺 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Rooms Tab */}
          {selectedTab === 'rooms' && (
            <div className="space-y-3">
              <p className="text-amber-300 text-sm mb-4">
                Rest here to restore your party's health and morale.
              </p>
              {rooms.map((room: RoomOption & { usesGoodKarma?: boolean }) => {
                const price = Math.ceil(room.price * priceModifier)
                const usesGoodKarma = room.usesGoodKarma || false
                const karmaType = usesGoodKarma ? 'good' : 'neutral'
                const karmaEmoji = usesGoodKarma ? '🍪' : '🌮'
                const affordable = canAfford(karmaType, price)
                const isSpecial = room.id === 'cabin'

                return (
                  <div
                    key={room.id}
                    className={`border rounded-lg p-3 ${
                      isSpecial
                        ? 'bg-emerald-900/30 border-emerald-600'
                        : 'bg-amber-900/50 border-amber-600'
                    } ${affordable ? 'hover:bg-amber-800/50 cursor-pointer' : 'opacity-50'}`}
                    onClick={() => affordable && handleRent(room)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{room.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className={`font-bold ${isSpecial ? 'text-emerald-200' : 'text-amber-200'}`}>
                            {room.name}
                          </h3>
                          <p className={`font-bold ${affordable ? (usesGoodKarma ? 'text-amber-400' : 'text-yellow-300') : 'text-red-400'}`}>
                            {price}{karmaEmoji}
                          </p>
                        </div>
                        <p className={`text-xs ${isSpecial ? 'text-emerald-300' : 'text-amber-400'}`}>
                          {room.description}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs">
                          <span className="text-green-400">+{room.healthBonus} Health</span>
                          <span className="text-blue-400">+{room.moraleBonus} Morale</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Food Tab */}
          {selectedTab === 'food' && (
            <div className="space-y-3">
              <p className="text-amber-300 text-sm mb-4">
                A hot meal goes a long way on the trail. Party-wide meals affect everyone!
              </p>
              {food.map((foodItem: FoodOption & { usesGoodKarma?: boolean }) => {
                const price = Math.ceil(foodItem.price * priceModifier)
                const usesGoodKarma = foodItem.usesGoodKarma || false
                const karmaType = usesGoodKarma ? 'good' : 'neutral'
                const karmaEmoji = usesGoodKarma ? '🍪' : '🌮'
                const affordable = canAfford(karmaType, price)
                const isSpecial = foodItem.id.startsWith('cynthia') || foodItem.id === 'mountain_breakfast'

                return (
                  <div
                    key={foodItem.id}
                    className={`border rounded-lg p-3 ${
                      isSpecial
                        ? 'bg-emerald-900/30 border-emerald-600'
                        : 'bg-amber-900/50 border-amber-600'
                    } ${affordable ? 'hover:bg-amber-800/50 cursor-pointer' : 'opacity-50'}`}
                    onClick={() => affordable && handleBuyFood(foodItem)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{foodItem.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className={`font-bold ${isSpecial ? 'text-emerald-200' : 'text-amber-200'}`}>
                            {foodItem.name}
                            {foodItem.partyWide && <span className="ml-2 text-xs text-blue-400">[Party]</span>}
                          </h3>
                          <p className={`font-bold ${affordable ? (usesGoodKarma ? 'text-amber-400' : 'text-yellow-300') : 'text-red-400'}`}>
                            {price}{karmaEmoji}
                          </p>
                        </div>
                        <p className={`text-xs ${isSpecial ? 'text-emerald-300' : 'text-amber-400'}`}>
                          {foodItem.description}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs">
                          <span className="text-green-400">+{foodItem.healthBonus} Health</span>
                          <span className="text-blue-400">+{foodItem.moraleBonus} Morale</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Drinks Tab */}
          {selectedTab === 'drinks' && (
            <div className="space-y-3">
              <p className="text-amber-300 text-sm mb-4">
                Wet your whistle. Some drinks have... interesting effects.
              </p>
              {drinks.map(drink => {
                const price = Math.ceil(drink.price * priceModifier)
                const affordable = canAfford('neutral', price)

                return (
                  <div
                    key={drink.id}
                    className={`bg-amber-900/50 border border-amber-600 rounded-lg p-3 ${
                      affordable ? 'hover:bg-amber-800/50 cursor-pointer' : 'opacity-50'
                    }`}
                    onClick={() => affordable && handleBuyDrink(drink)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{drink.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-amber-200 font-bold">{drink.name}</h3>
                          <p className={`font-bold ${affordable ? 'text-yellow-300' : 'text-red-400'}`}>
                            {price}🌮
                          </p>
                        </div>
                        <p className="text-amber-400 text-xs">{drink.description}</p>
                        <div className="flex gap-4 mt-1 text-xs">
                          <span className="text-purple-400">{drink.effect}</span>
                          <span className="text-blue-400">+{drink.moraleBonus} Morale</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Party Status */}
          <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-3">
            <h3 className="text-amber-200 font-bold text-sm mb-2">Party Status</h3>
            <div className="space-y-2">
              {state.party.map(member => (
                <div key={member.id} className="flex items-center gap-2">
                  <span className="text-amber-200 text-xs flex-1">{member.name}</span>
                  <div className="w-24 h-2 bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        member.health > 70 ? 'bg-green-500' :
                        member.health > 40 ? 'bg-yellow-500' :
                        member.health > 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${member.health}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{member.health}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message & Close */}
        <div className="border-t border-amber-700 p-4">
          {message && (
            <p className="text-amber-200 text-sm mb-3 text-center">{message}</p>
          )}
          <button
            onClick={onClose}
            className={`w-full py-3 md:py-2 rounded font-bold text-base md:text-sm active:scale-[0.99] ${
              isWestPoint
                ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600 active:bg-emerald-500'
                : 'bg-amber-700 text-amber-100 hover:bg-amber-600 active:bg-amber-500'
            }`}
          >
            {isWestPoint ? "Thank Cynthia & Leave" : "Leave Inn"}
          </button>
        </div>
      </div>

      {/* Ghost Encounter Modal */}
      {ghostEncounter && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border-2 border-purple-600 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="bg-purple-900/60 p-4 border-b border-purple-700">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👻</span>
                <div>
                  <h2 className="text-purple-200 font-bold text-lg">{ghostEncounter.title}</h2>
                  <p className="text-purple-400 text-sm">{ghostEncounter.ghostName}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!ghostOutcome ? (
                <>
                  <p className="text-gray-300 text-sm leading-relaxed">{ghostEncounter.description}</p>
                  <div className="space-y-2">
                    {ghostEncounter.choices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={() => handleGhostChoice(choice)}
                        className="w-full text-left px-4 py-3 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700 hover:border-purple-500 rounded-lg text-purple-200 text-sm transition-colors"
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-sm leading-relaxed">{ghostOutcome}</p>
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 mt-4">
                    <p className="text-purple-300 text-xs font-bold mb-1">Historical Fact:</p>
                    <p className="text-gray-400 text-xs">{ghostEncounter.historicalFact}</p>
                  </div>
                  <button
                    onClick={() => { setGhostEncounter(null); setGhostOutcome(null) }}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-purple-100 rounded font-bold text-sm mt-2"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Karma Convert Modal */}
      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType}
          onSuccess={() => setShowConvertModal(false)}
        />
      )}
    </div>
  )
}

export default TownInn
