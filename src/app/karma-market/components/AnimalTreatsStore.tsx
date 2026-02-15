'use client'

import React, { useState, useCallback } from 'react'
import { useMarket } from '../marketContext'
import { useKarmaWallet } from '@/app/oregon-trail/karmaWalletContext'
import { RANCH_ANIMALS, getAnimalsByCategory, type RanchAnimal, type AnimalTreat } from '../data/ranchAnimals'

type AnimalCategory = 'domestic' | 'wild_care' | 'infrastructure'

const CATEGORY_LABELS: Record<AnimalCategory, string> = {
  domestic: 'Ranch Animals',
  wild_care: 'Wild Care',
  infrastructure: 'Infrastructure',
}

const CATEGORY_EMOJIS: Record<AnimalCategory, string> = {
  domestic: '\uD83C\uDFE0',
  wild_care: '\uD83C\uDF3F',
  infrastructure: '\uD83D\uDD27',
}

function AnimalCard({
  animal,
  onBuyTreat,
  isTreatOnCooldown,
  getCooldownRemaining,
  canAffordTreat,
}: {
  animal: RanchAnimal
  onBuyTreat: (animalId: string, treat: AnimalTreat) => void
  isTreatOnCooldown: (treatId: string) => boolean
  getCooldownRemaining: (treatId: string) => number
  canAffordTreat: (cost: number) => boolean
}) {
  const [feedbackTreat, setFeedbackTreat] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const handleBuy = useCallback((treat: AnimalTreat) => {
    onBuyTreat(animal.id, treat)
    setFeedbackTreat(treat.id)
    setFeedbackText(treat.effect)
    setTimeout(() => {
      setFeedbackTreat(null)
      setFeedbackText('')
    }, 4000)
  }, [animal.id, onBuyTreat])

  return (
    <div className="bg-amber-900/40 border-2 border-amber-700 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{animal.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-pixel text-amber-200 text-xs">{animal.name}</h4>
            {animal.count > 1 && (
              <span className="text-[8px] text-amber-500">x{animal.count}</span>
            )}
          </div>
          <p className="text-[9px] text-amber-400 mt-0.5">{animal.description}</p>
        </div>
      </div>

      {/* Treats */}
      <div className="mt-2 space-y-1.5">
        {animal.treats.map(treat => {
          const onCooldown = isTreatOnCooldown(treat.id)
          const cooldownMs = getCooldownRemaining(treat.id)
          const cooldownMin = Math.ceil(cooldownMs / 60000)
          const affordable = canAffordTreat(treat.neutralKarmaCost)
          const showingFeedback = feedbackTreat === treat.id

          return (
            <div key={treat.id} className="flex items-center gap-2">
              <button
                onClick={() => handleBuy(treat)}
                disabled={onCooldown || !affordable}
                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded border transition-all text-left ${
                  onCooldown
                    ? 'bg-gray-800/40 border-gray-700 cursor-not-allowed'
                    : !affordable
                      ? 'bg-red-900/20 border-red-800/50 cursor-not-allowed'
                      : 'bg-amber-800/30 border-amber-600/50 hover:border-amber-400 hover:bg-amber-800/50'
                }`}
              >
                <span className="text-sm">{treat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-amber-300 truncate">{treat.name}</div>
                  <div className="text-[8px] text-amber-500">{treat.description}</div>
                </div>
                <div className="text-right shrink-0">
                  {onCooldown ? (
                    <span className="text-[8px] text-gray-500">{cooldownMin}m</span>
                  ) : (
                    <span className={`font-pixel text-[10px] ${affordable ? 'text-amber-300' : 'text-red-400'}`}>
                      {treat.neutralKarmaCost}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Feedback animation */}
      {feedbackText && (
        <div className="mt-2 p-2 bg-green-900/30 border border-green-700 rounded text-[9px] text-green-300 animate-pulse">
          {feedbackText}
        </div>
      )}

      {/* Fun fact */}
      <div className="mt-2 text-[8px] text-amber-600 italic">
        {animal.funFact}
      </div>
    </div>
  )
}

export function AnimalTreatsStore() {
  const { buyTreat, isTreatOnCooldown, getCooldownRemaining, getAnimalsFed } = useMarket()
  const { balance, spendNeutral, canAfford } = useKarmaWallet()

  const [activeCategory, setActiveCategory] = useState<AnimalCategory>('domestic')

  const animals = getAnimalsByCategory(activeCategory)
  const animalsFed = getAnimalsFed()
  const domesticAnimals = getAnimalsByCategory('domestic')
  const allDomesticFed = domesticAnimals.every(a => animalsFed.has(a.id))

  const handleBuyTreat = useCallback(async (animalId: string, treat: AnimalTreat) => {
    // Check affordability
    if (!canAfford('neutral', treat.neutralKarmaCost)) return

    // Spend karma first
    const spent = await spendNeutral(treat.neutralKarmaCost, `Treat: ${treat.name} for ${animalId}`)
    if (!spent) return

    // Record in market context
    buyTreat(animalId, treat.id)
  }, [canAfford, spendNeutral, buyTreat])

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2">
        {(Object.keys(CATEGORY_LABELS) as AnimalCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 px-3 rounded border-2 font-pixel text-[10px] transition-all ${
              activeCategory === cat
                ? 'bg-amber-800/60 border-amber-400 text-amber-200'
                : 'bg-amber-900/30 border-amber-700/50 text-amber-500 hover:border-amber-600'
            }`}
          >
            {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Achievement banner */}
      {allDomesticFed && (
        <div className="p-2 bg-green-900/40 border-2 border-green-600 rounded text-center">
          <span className="font-pixel text-green-300 text-xs">
            Achievement: Fed All Ranch Animals!
          </span>
        </div>
      )}

      {/* Balance display */}
      <div className="bg-amber-950/40 border border-amber-700 rounded px-3 py-2 flex items-center justify-between">
        <span className="text-[9px] text-amber-400">Your Neutral Karma:</span>
        <span className="font-pixel text-amber-200 text-sm">{balance.neutral}</span>
      </div>

      {/* Animal grid */}
      <div className="grid gap-3">
        {animals.map(animal => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            onBuyTreat={handleBuyTreat}
            isTreatOnCooldown={isTreatOnCooldown}
            getCooldownRemaining={getCooldownRemaining}
            canAffordTreat={(cost) => canAfford('neutral', cost)}
          />
        ))}
      </div>

      {/* Progress */}
      <div className="text-center text-[9px] text-amber-500">
        Animals fed: {animalsFed.size}/{RANCH_ANIMALS.length}
      </div>
    </div>
  )
}
