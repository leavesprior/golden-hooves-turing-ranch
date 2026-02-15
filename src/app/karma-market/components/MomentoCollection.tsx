'use client'

import React, { useState, useCallback } from 'react'
import { useMarket } from '../marketContext'
import { useKarmaWallet } from '@/app/oregon-trail/karmaWalletContext'
import {
  MOMENTOS,
  RARITY_COLORS,
  RARITY_BG,
  RARITY_LABELS,
  getTotalMomentoCount,
  type Momento,
  type MomentoRarity,
} from '../data/momentos'

function MomentoCard({
  momento,
  owned,
  locked,
  affordable,
  onBuy,
}: {
  momento: Momento
  owned: boolean
  locked: boolean
  affordable: boolean
  onBuy: (momento: Momento) => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [justBought, setJustBought] = useState(false)

  const handleBuy = useCallback(() => {
    onBuy(momento)
    setJustBought(true)
    setTimeout(() => setJustBought(false), 3000)
  }, [momento, onBuy])

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className={`relative p-3 rounded-lg border-2 text-left transition-all ${
          owned
            ? `${RARITY_BG[momento.rarity]} opacity-100`
            : locked
              ? 'bg-gray-900/40 border-gray-700 opacity-50'
              : `${RARITY_BG[momento.rarity]} opacity-70 hover:opacity-100`
        }`}
      >
        {/* Rarity badge */}
        <div className={`absolute -top-2 -right-2 text-[7px] px-1.5 py-0.5 rounded ${
          RARITY_BG[momento.rarity]
        } ${RARITY_COLORS[momento.rarity]} border`}>
          {RARITY_LABELS[momento.rarity]}
        </div>

        <div className="text-2xl text-center mb-1">
          {owned ? momento.emoji : locked ? '\uD83D\uDD12' : momento.emoji}
        </div>
        <div className={`font-pixel text-[9px] text-center ${
          owned ? RARITY_COLORS[momento.rarity] : 'text-gray-400'
        }`}>
          {momento.name}
        </div>
        {!owned && !locked && (
          <div className="text-[8px] text-amber-500 text-center mt-1">
            {momento.neutralKarmaCost} karma
          </div>
        )}
        {owned && (
          <div className="text-[8px] text-green-500 text-center mt-1">Owned</div>
        )}
      </button>

      {/* Detail modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className={`max-w-sm w-full ${RARITY_BG[momento.rarity]} border-2 rounded-lg p-5`}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">{momento.emoji}</div>
              <h3 className={`font-pixel text-sm ${RARITY_COLORS[momento.rarity]}`}>
                {momento.name}
              </h3>
              <div className={`text-[9px] ${RARITY_COLORS[momento.rarity]} opacity-70 mt-1`}>
                {RARITY_LABELS[momento.rarity]} {momento.category}
              </div>
            </div>

            <p className="text-amber-400 text-xs mt-3">{momento.description}</p>

            <div className="mt-3 p-2 bg-black/20 rounded italic text-[10px] text-amber-300/80">
              &ldquo;{momento.flavorText}&rdquo;
            </div>

            {momento.unlockCondition && !owned && (
              <div className="mt-2 text-[9px] text-purple-400 text-center">
                Unlock: {momento.unlockCondition}
              </div>
            )}

            {!owned && !locked && (
              <button
                onClick={handleBuy}
                disabled={!affordable || justBought}
                className={`mt-4 w-full py-2 font-pixel text-xs rounded border-2 transition-colors ${
                  justBought
                    ? 'bg-green-700 border-green-500 text-green-100'
                    : affordable
                      ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-amber-100'
                      : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {justBought
                  ? 'Collected!'
                  : affordable
                    ? `Buy for ${momento.neutralKarmaCost} neutral karma`
                    : `Need ${momento.neutralKarmaCost} neutral karma`
                }
              </button>
            )}

            {owned && (
              <div className="mt-4 text-center text-green-400 font-pixel text-xs">
                In Your Collection
              </div>
            )}

            <button
              onClick={() => setShowDetail(false)}
              className="mt-3 w-full py-1 text-amber-500 text-xs hover:text-amber-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function MomentoCollection() {
  const { ownedMomentos, buyMomento, ownsMomento, hasMetUnlockCondition } = useMarket()
  const { balance, spendNeutral, canAfford } = useKarmaWallet()

  const [rarityFilter, setRarityFilter] = useState<MomentoRarity | 'all'>('all')

  const totalCount = getTotalMomentoCount()
  const ownedCount = ownedMomentos.length
  const progressPercent = Math.round((ownedCount / totalCount) * 100)

  const filteredMomentos = rarityFilter === 'all'
    ? MOMENTOS
    : MOMENTOS.filter(m => m.rarity === rarityFilter)

  const handleBuy = useCallback(async (momento: Momento) => {
    if (ownsMomento(momento.id)) return
    if (!canAfford('neutral', momento.neutralKarmaCost)) return
    if (!hasMetUnlockCondition(momento.unlockCondition)) return

    const spent = await spendNeutral(momento.neutralKarmaCost, `Momento: ${momento.name}`)
    if (!spent) return

    buyMomento(momento.id)
  }, [ownsMomento, canAfford, hasMetUnlockCondition, spendNeutral, buyMomento])

  const rarities: (MomentoRarity | 'all')[] = ['all', 'common', 'uncommon', 'rare', 'legendary']

  return (
    <div className="space-y-4">
      {/* Collection progress */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-pixel text-amber-200 text-xs">Collection Progress</h3>
          <span className="font-pixel text-amber-300 text-xs">{ownedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-3 bg-amber-900/40 rounded-full border border-amber-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[9px] text-amber-500 text-center mt-1">{progressPercent}% complete</div>
      </div>

      {/* Balance display */}
      <div className="bg-amber-950/40 border border-amber-700 rounded px-3 py-2 flex items-center justify-between">
        <span className="text-[9px] text-amber-400">Your Neutral Karma:</span>
        <span className="font-pixel text-amber-200 text-sm">{balance.neutral}</span>
      </div>

      {/* Rarity filter */}
      <div className="flex gap-1.5 flex-wrap">
        {rarities.map(r => (
          <button
            key={r}
            onClick={() => setRarityFilter(r)}
            className={`px-2 py-1 rounded border text-[9px] transition-all ${
              rarityFilter === r
                ? 'bg-amber-800/60 border-amber-400 text-amber-200'
                : 'bg-amber-900/30 border-amber-700/50 text-amber-500 hover:border-amber-600'
            }`}
          >
            {r === 'all' ? 'All' : RARITY_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Momento grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filteredMomentos.map(momento => {
          const owned = ownsMomento(momento.id)
          const locked = !owned && !hasMetUnlockCondition(momento.unlockCondition)
          const affordable = canAfford('neutral', momento.neutralKarmaCost)

          return (
            <MomentoCard
              key={momento.id}
              momento={momento}
              owned={owned}
              locked={locked}
              affordable={affordable}
              onBuy={handleBuy}
            />
          )
        })}
      </div>
    </div>
  )
}
