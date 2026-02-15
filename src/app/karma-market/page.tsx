'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useKarmaWallet } from '@/app/oregon-trail/karmaWalletContext'
import { useMarket } from './marketContext'
import { MarketTracker } from './components/MarketTracker'
import { MandelbrotVisualizer } from './components/MandelbrotVisualizer'
import { DonationPanel } from './components/DonationPanel'
import { AnimalTreatsStore } from './components/AnimalTreatsStore'
import { MomentoCollection } from './components/MomentoCollection'
import { ConsensusIndicator } from './components/ConsensusIndicator'

type MarketTab = 'market' | 'donate' | 'treats' | 'momentos'

const TAB_CONFIG: { id: MarketTab; label: string; emoji: string }[] = [
  { id: 'market', label: 'Market', emoji: '\uD83D\uDCC8' },
  { id: 'donate', label: 'Donate', emoji: '\uD83D\uDC9B' },
  { id: 'treats', label: 'Treats', emoji: '\uD83C\uDF7A' },
  { id: 'momentos', label: 'Momentos', emoji: '\uD83C\uDFAD' },
]

export default function KarmaMarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>('market')
  const { balance, isInitialized, initializeWallet } = useKarmaWallet()

  // Auto-initialize wallet if needed
  if (!isInitialized) {
    initializeWallet('continue')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950">
      {/* Header */}
      <header className="border-b-4 border-amber-600 bg-amber-900/50 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-pixel text-amber-200 text-lg">Karma Market</h1>
              <p className="text-amber-400 text-[10px] mt-0.5">
                Support the ranch, trade karma, collect momentos
              </p>
            </div>
            <Link
              href="/hub"
              className="text-amber-400 hover:text-amber-200 text-xs font-pixel transition-colors"
            >
              {'\u2190'} Hub
            </Link>
          </div>

          {/* Wallet bar */}
          <div className="mt-3 flex items-center justify-between bg-amber-800/30 border border-amber-700 rounded-lg px-3 py-2">
            <div className="flex gap-4 text-[10px]">
              <span className="text-amber-300">
                <span className="text-amber-500">Neutral:</span>{' '}
                <span className="font-pixel">{balance.neutral}</span>
              </span>
              <span className="text-amber-300">
                <span className="text-amber-500">Good:</span>{' '}
                <span className="font-pixel">{balance.good}</span>
              </span>
              <span className="text-amber-300">
                <span className="text-amber-500">Bad:</span>{' '}
                <span className="font-pixel">{balance.bad}</span>
              </span>
            </div>
            <ConsensusIndicator />
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b-2 border-amber-700 bg-amber-900/30 px-4">
        <div className="max-w-2xl mx-auto flex">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center font-pixel text-[10px] transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-amber-200 border-amber-400 bg-amber-800/20'
                  : 'text-amber-500 border-transparent hover:text-amber-300 hover:bg-amber-800/10'
              }`}
            >
              <span className="text-sm">{tab.emoji}</span>
              <span className="ml-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'market' && (
          <div className="space-y-4">
            <MarketTracker />
            <MandelbrotVisualizer />

            {/* Quick buy karma */}
            <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
              <h3 className="font-pixel text-amber-200 text-xs mb-3">Trade Karma</h3>
              <p className="text-[9px] text-amber-400 mb-3">
                Prices shift based on the Mandelbrot fractal engine. Each purchase moves
                the price for the next buyer. Neutral karma stays flat-rate.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <KarmaBuyButton type="good" />
                <KarmaBuyButton type="bad" />
              </div>
            </div>

            {/* How it works */}
            <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-4">
              <h3 className="font-pixel text-amber-200 text-xs mb-2">How the Market Works</h3>
              <ul className="text-[9px] text-amber-400 space-y-1.5">
                <li>
                  <span className="text-amber-300">Mandelbrot Pricing:</span>{' '}
                  The price of good and bad karma is driven by your position on the Mandelbrot set.
                </li>
                <li>
                  <span className="text-amber-300">Good Karma:</span>{' '}
                  Spirals inward {'\u2014'} tends to get more expensive over time.
                </li>
                <li>
                  <span className="text-amber-300">Bad Karma:</span>{' '}
                  Spirals outward {'\u2014'} volatile, sometimes cheap, sometimes expensive.
                </li>
                <li>
                  <span className="text-amber-300">Epoch Reset:</span>{' '}
                  After 50 units or 24 hours, prices reset to a new starting point.
                </li>
                <li>
                  <span className="text-amber-300">Donations:</span>{' '}
                  Real money goes toward ranch animal care. Donors receive karma at the going rate.
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'donate' && <DonationPanel />}
        {activeTab === 'treats' && <AnimalTreatsStore />}
        {activeTab === 'momentos' && <MomentoCollection />}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-amber-800 bg-amber-950/50 px-4 py-4 mt-8">
        <div className="max-w-2xl mx-auto text-center text-amber-600 text-[9px]">
          All donations support ranch animal care at Back of Beyond Ranch, Gold Country, CA
        </div>
      </footer>
    </div>
  )
}

// ── Sub-component for karma buy buttons ──

function KarmaBuyButton({ type }: { type: 'good' | 'bad' }) {
  const { currentPrices, purchaseGoodKarma, purchaseBadKarma } = useMarket()
  const { balance, spendNeutral, earnGood, addBadKarma } = useKarmaWallet()
  const [feedback, setFeedback] = useState('')

  const price = type === 'good' ? currentPrices.good : currentPrices.bad
  const canAfford = balance.neutral >= price

  const handleBuy = async () => {
    if (!canAfford) return

    const spent = await spendNeutral(price, `Buy ${type} karma`)
    if (!spent) return

    if (type === 'good') {
      await earnGood(1, 'Market purchase')
      purchaseGoodKarma()
      setFeedback('+1 good karma!')
    } else {
      await addBadKarma(1, 'Market purchase')
      purchaseBadKarma()
      setFeedback('+1 bad karma!')
    }

    setTimeout(() => setFeedback(''), 2000)
  }

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={!canAfford}
        className={`w-full py-2 px-3 rounded border-2 font-pixel text-xs transition-all ${
          type === 'good'
            ? canAfford
              ? 'bg-amber-800/40 border-amber-500 text-amber-200 hover:bg-amber-800/60'
              : 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-not-allowed'
            : canAfford
              ? 'bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50'
              : 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <div>Buy 1 {type === 'good' ? 'Good' : 'Bad'} Karma</div>
        <div className="text-[9px] opacity-70 mt-0.5">{price} neutral karma</div>
      </button>
      {feedback && (
        <div className={`text-[9px] text-center mt-1 animate-pulse ${
          type === 'good' ? 'text-amber-400' : 'text-red-400'
        }`}>
          {feedback}
        </div>
      )}
    </div>
  )
}
