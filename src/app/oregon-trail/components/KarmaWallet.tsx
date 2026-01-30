'use client'

import React, { useState } from 'react'
import { useKarmaWallet } from '../karmaWalletContext'

interface KarmaWalletProps {
  compact?: boolean
  showBadKarma?: boolean
  className?: string
}

/**
 * KarmaWallet - Displays the player's karma balance
 *
 * Balance Display:
 * ┌─────────────────────────────────┐
 * │ 🌮 385 │ 🍪 15 │ 🪨 0          │
 * └─────────────────────────────────┘
 */
export function KarmaWallet({ compact = false, showBadKarma = true, className = '' }: KarmaWalletProps) {
  const { balance, isOnline, pendingCount } = useKarmaWallet()
  const [showTooltip, setShowTooltip] = useState(false)

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 text-sm ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-yellow-300 font-bold">
          🌮 {Math.floor(balance.neutral)}
        </span>
        {balance.good > 0 && (
          <span className="text-amber-400">
            🍪 {Math.floor(balance.good)}
          </span>
        )}
        {showBadKarma && balance.bad > 0 && (
          <span className="text-red-400">
            🪨 {Math.floor(balance.bad)}
          </span>
        )}
        {!isOnline && (
          <span className="text-yellow-500 animate-pulse" title="Offline mode">
            ⚠️
          </span>
        )}
        {pendingCount > 0 && (
          <span className="text-blue-400 text-xs" title={`${pendingCount} pending transactions`}>
            ↻{pendingCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="bg-amber-950/80 border-2 border-amber-600 rounded-lg px-4 py-2 flex items-center gap-4"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Neutral Karma - Primary Currency */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🌮</span>
          <div className="text-right">
            <span className="text-yellow-300 font-bold text-lg">{Math.floor(balance.neutral)}</span>
            {!compact && (
              <span className="text-amber-500 text-xs block">Neutral</span>
            )}
          </div>
        </div>

        <div className="w-px h-8 bg-amber-700" />

        {/* Good Karma - Premium Currency */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🍪</span>
          <div className="text-right">
            <span className="text-amber-400 font-bold text-lg">{Math.floor(balance.good)}</span>
            {!compact && (
              <span className="text-amber-500 text-xs block">Good</span>
            )}
          </div>
        </div>

        {showBadKarma && (
          <>
            <div className="w-px h-8 bg-amber-700" />

            {/* Bad Karma - Debt */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🪨</span>
              <div className="text-right">
                <span className={`font-bold text-lg ${balance.bad > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {Math.floor(balance.bad)}
                </span>
                {!compact && (
                  <span className="text-amber-500 text-xs block">Bad</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Offline/Sync indicator */}
        {!isOnline && (
          <span className="text-yellow-500 animate-pulse ml-2" title="Offline mode - transactions will sync when connected">
            ⚠️
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-amber-600 rounded-lg p-3 z-50 min-w-64 shadow-xl">
          <h4 className="text-amber-200 font-bold text-sm mb-2">Karma Wallet</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">🌮 Neutral Karma</span>
              <span className="text-amber-200">{balance.neutral.toFixed(0)}</span>
            </div>
            <p className="text-gray-400 text-[10px]">Primary currency for supplies and services</p>

            <div className="flex justify-between items-center">
              <span className="text-amber-400">🍪 Good Karma</span>
              <span className="text-amber-200">{balance.good.toFixed(0)}</span>
            </div>
            <p className="text-gray-400 text-[10px]">Earned through virtuous actions, used for special items</p>

            <div className="flex justify-between items-center">
              <span className="text-red-400">🪨 Bad Karma</span>
              <span className={balance.bad > 0 ? 'text-red-300' : 'text-gray-500'}>{balance.bad.toFixed(0)}</span>
            </div>
            <p className="text-gray-400 text-[10px]">Debt from dark choices - has consequences</p>

            {!isOnline && (
              <div className="border-t border-gray-700 pt-2 mt-2">
                <span className="text-yellow-400 text-[10px]">
                  ⚠️ Offline mode - transactions will sync when connected
                </span>
              </div>
            )}

            {pendingCount > 0 && (
              <div className="text-blue-400 text-[10px]">
                {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} pending sync
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * KarmaPrice - Displays a price tag with the appropriate karma type
 */
interface KarmaPriceProps {
  amount: number
  type?: 'neutral' | 'good'
  className?: string
}

export function KarmaPrice({ amount, type = 'neutral', className = '' }: KarmaPriceProps) {
  const { canAfford } = useKarmaWallet()
  const affordable = canAfford(type, amount)

  const emoji = type === 'good' ? '🍪' : '🌮'
  const colorClass = type === 'good'
    ? affordable ? 'text-amber-400' : 'text-red-400'
    : affordable ? 'text-yellow-300' : 'text-red-400'

  return (
    <span className={`font-bold ${colorClass} ${className}`}>
      {Math.floor(amount)}{emoji}
    </span>
  )
}

/**
 * KarmaChange - Displays a karma delta (for transaction toasts)
 */
interface KarmaChangeProps {
  neutralDelta?: number
  goodDelta?: number
  badDelta?: number
  className?: string
}

export function KarmaChange({ neutralDelta = 0, goodDelta = 0, badDelta = 0, className = '' }: KarmaChangeProps) {
  const changes: React.ReactNode[] = []

  if (neutralDelta !== 0) {
    const sign = neutralDelta > 0 ? '+' : ''
    const color = neutralDelta > 0 ? 'text-green-400' : 'text-red-400'
    changes.push(
      <span key="neutral" className={color}>
        {sign}{neutralDelta}🌮
      </span>
    )
  }

  if (goodDelta !== 0) {
    const sign = goodDelta > 0 ? '+' : ''
    const color = goodDelta > 0 ? 'text-amber-400' : 'text-amber-600'
    changes.push(
      <span key="good" className={color}>
        {sign}{goodDelta}🍪
      </span>
    )
  }

  if (badDelta !== 0) {
    const sign = badDelta > 0 ? '+' : ''
    const color = badDelta > 0 ? 'text-red-400' : 'text-green-400'
    changes.push(
      <span key="bad" className={color}>
        {sign}{badDelta}🪨
      </span>
    )
  }

  if (changes.length === 0) {
    return null
  }

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {changes}
    </span>
  )
}

/**
 * WalletModeSelector - Initial wallet selection screen
 */
interface WalletModeSelectorProps {
  onSelect: (mode: 'new' | 'continue') => void
}

export function WalletModeSelector({ onSelect }: WalletModeSelectorProps) {
  return (
    <div className="bg-amber-950/80 border-4 border-amber-600 rounded-lg p-6 max-w-md mx-auto">
      <h2 className="font-pixel text-amber-200 text-lg mb-2 text-center">
        Choose Your Karma Wallet
      </h2>
      <p className="text-amber-400 text-sm mb-6 text-center">
        Your karma determines your fortune on the trail
      </p>

      <div className="space-y-4">
        {/* New Wallet Option */}
        <button
          onClick={() => onSelect('new')}
          className="w-full p-4 bg-emerald-900/60 hover:bg-emerald-800/60 border-2 border-emerald-600 rounded-lg text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🆕</span>
            <div>
              <h3 className="text-emerald-200 font-bold">New Wallet</h3>
              <p className="text-emerald-400 text-xs">Start fresh with 400🌮 Neutral Karma</p>
            </div>
          </div>
        </button>

        {/* Continue Wallet Option */}
        <button
          onClick={() => onSelect('continue')}
          className="w-full p-4 bg-blue-900/60 hover:bg-blue-800/60 border-2 border-blue-600 rounded-lg text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">↩️</span>
            <div>
              <h3 className="text-blue-200 font-bold">Continue Wallet</h3>
              <p className="text-blue-400 text-xs">Resume with your existing karma balance</p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-amber-700">
        <h4 className="text-amber-300 text-xs font-bold mb-2">Karma Types:</h4>
        <div className="space-y-1 text-xs text-amber-400">
          <p>🌮 <span className="text-yellow-300">Neutral</span> - Primary currency for supplies</p>
          <p>🍪 <span className="text-amber-300">Good</span> - Earned by helping others, used for special items</p>
          <p>🪨 <span className="text-red-300">Bad</span> - Debt from dark choices</p>
        </div>
      </div>
    </div>
  )
}

export default KarmaWallet
