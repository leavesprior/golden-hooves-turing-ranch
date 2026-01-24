'use client'

import React from 'react'
import Link from 'next/link'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useOregonTrail } from '../oregonTrailContext'
import { useRanch } from '../ranchContext'
import { ENDINGS, PROPERTY_TIERS, EndingType } from '../data/settlementConfig'
import { KarmaWallet } from './KarmaWallet'

interface SettlementVictoryProps {
  onPlayAgain: () => void
}

export function SettlementVictory({ onPlayAgain }: SettlementVictoryProps) {
  const { state: settlementState, getNetWorth } = useSettlement()
  const { state: trailState } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const ranch = useRanch()

  const ending = settlementState.finalEnding || 'departed'
  const endingConfig = ENDINGS[ending]
  const netWorth = getNetWorth()
  const totalLivestock = ranch?.getTotalLivestock?.() || 0
  const ranchValue = ranch?.getRanchValue?.() || 0

  // Color mappings for ending tiers
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    gray: { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-300', glow: '' },
    bronze: { bg: 'bg-orange-900/60', border: 'border-orange-600', text: 'text-orange-300', glow: '' },
    silver: { bg: 'bg-gray-700', border: 'border-gray-400', text: 'text-gray-200', glow: 'shadow-lg shadow-gray-500/30' },
    gold: { bg: 'bg-yellow-900/60', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-lg shadow-yellow-500/30' },
    platinum: { bg: 'bg-cyan-900/60', border: 'border-cyan-400', text: 'text-cyan-300', glow: 'shadow-lg shadow-cyan-500/40' },
    legendary: { bg: 'bg-purple-900/60', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-xl shadow-purple-500/50 animate-pulse' },
  }

  const colors = colorMap[endingConfig.color] || colorMap.gray

  // Achievement checks
  const achievements = [
    {
      name: 'First Steps',
      description: 'Stake your first claim',
      unlocked: settlementState.propertyTier >= 1,
      icon: '🏕️',
    },
    {
      name: 'Homemaker',
      description: 'Build a cabin',
      unlocked: settlementState.buildings.includes('cabin'),
      icon: '🏚️',
    },
    {
      name: 'Ranch Hand',
      description: 'Own 10 livestock',
      unlocked: totalLivestock >= 10,
      icon: '🤠',
    },
    {
      name: 'Gold Fever',
      description: 'Mine 500 gold',
      unlocked: settlementState.goldMined >= 500,
      icon: '⛏️',
    },
    {
      name: 'Respected',
      description: 'Reach 50 reputation',
      unlocked: settlementState.reputation >= 50,
      icon: '⭐',
    },
    {
      name: 'Tycoon',
      description: 'Amass 5000 net worth',
      unlocked: netWorth >= 5000,
      icon: '💰',
    },
    {
      name: 'Master Builder',
      description: 'Build all structures',
      unlocked: settlementState.buildings.length >= 5,
      icon: '🏗️',
    },
    {
      name: 'Year One',
      description: 'Survive 365 days',
      unlocked: settlementState.daysInSettlement >= 365,
      icon: '📅',
    },
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Victory Badge */}
        <div
          className={`${colors.bg} ${colors.border} ${colors.glow} border-4 rounded-2xl p-8 mb-6 text-center`}
        >
          <div className="text-8xl mb-4">{endingConfig.badge}</div>
          <h1 className={`font-pixel text-3xl ${colors.text} mb-2`}>
            {endingConfig.name}
          </h1>
          <p className="text-amber-300 text-lg mb-4">{endingConfig.description}</p>

          {ending === 'legend' && (
            <div className="mt-4 p-3 bg-purple-800/50 rounded-lg">
              <p className="text-purple-200 text-sm italic">
                "Your name echoes through the canyons of Gold Country.
                Future generations will speak of your legend."
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-6 mb-6">
          <h2 className="text-amber-400 font-pixel text-lg mb-4 text-center">Journey Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatBox label="Days on Trail" value={trailState?.daysOnTrail || 0} icon="🛤️" />
            <StatBox label="Days in Settlement" value={settlementState.daysInSettlement} icon="📅" />
            <StatBox label="Property Tier" value={`${settlementState.propertyTier}/5`} icon="🏠" />
            <StatBox label="Buildings" value={settlementState.buildings.length} icon="🏗️" />
            <StatBox label="Livestock" value={totalLivestock} icon="🐄" />
            <StatBox label="Gold Mined" value={settlementState.goldMined} icon="⛏️" />
            <StatBox label="Mining Claims" value={settlementState.miningClaims} icon="📜" />
            <StatBox label="Farm Acres" value={settlementState.farmAcres} icon="🌾" />
            <StatBox label="Reputation" value={settlementState.reputation} icon="⭐" />
          </div>

          {/* Final Karma */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-center">
              <KarmaWallet showBadKarma />
            </div>
          </div>

          {/* Net Worth */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">Total Net Worth</p>
            <p className="text-amber-400 font-pixel text-3xl">{netWorth}🪙</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-6 mb-6">
          <h2 className="text-amber-400 font-pixel text-lg mb-4 text-center">
            Achievements ({unlockedCount}/{achievements.length})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-center ${
                  achievement.unlocked
                    ? 'bg-green-900/40 border border-green-600'
                    : 'bg-gray-800/40 border border-gray-700 opacity-50'
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <p
                  className={`text-xs font-medium mt-1 ${
                    achievement.unlocked ? 'text-green-300' : 'text-gray-500'
                  }`}
                >
                  {achievement.name}
                </p>
                <p className="text-[10px] text-gray-500">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-lg rounded border-4 border-amber-500 transition-colors"
          >
            Play Again
          </button>
          <Link
            href="/hub"
            className="px-8 py-4 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-lg rounded border-4 border-green-500 transition-colors"
          >
            Back to Hub
          </Link>
        </div>

        {/* Ending Tier Legend */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs mb-2">Ending Tiers</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(ENDINGS).map(([key, config]) => (
              <span
                key={key}
                className={`px-2 py-1 text-xs rounded ${
                  key === ending
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {config.badge} {config.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: string
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-amber-200 font-pixel text-lg">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  )
}

export default SettlementVictory
