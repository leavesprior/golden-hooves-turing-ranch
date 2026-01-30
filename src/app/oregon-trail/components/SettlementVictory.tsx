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
  discountCode?: string
  occupation?: string
}

export function SettlementVictory({ onPlayAgain, discountCode, occupation }: SettlementVictoryProps) {
  const { state: settlementState, getNetWorth } = useSettlement()
  const { state: trailState } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const ranch = useRanch()

  const ending = settlementState.finalEnding || 'departed'
  const endingConfig = ENDINGS[ending]
  const netWorth = getNetWorth()
  const totalLivestock = ranch?.getTotalLivestock?.() || 0
  const ranchValue = ranch?.getRanchValue?.() || 0

  // Sepia Gold Rush color palette
  // Primary: #d4a843, Dark gold: #8b6914, Deep brown: #2a1f14
  // Medium brown: #3d2b18, Tan: #a08050, Olive brown: #6a5030, Dark olive: #5a4020

  // Color mappings for ending tiers
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; accent: string }> = {
    gray: {
      bg: 'bg-gray-800',
      border: 'border-gray-600',
      text: 'text-gray-300',
      glow: '',
      accent: '#a08050',
    },
    bronze: {
      bg: 'bg-orange-900/60',
      border: 'border-orange-600',
      text: 'text-orange-300',
      glow: '',
      accent: '#8b6914',
    },
    silver: {
      bg: 'bg-gray-700',
      border: 'border-gray-400',
      text: 'text-gray-200',
      glow: 'shadow-lg shadow-gray-500/30',
      accent: '#a08050',
    },
    gold: {
      bg: 'bg-yellow-900/60',
      border: 'border-yellow-500',
      text: 'text-yellow-300',
      glow: 'shadow-lg shadow-yellow-500/30',
      accent: '#d4a843',
    },
    platinum: {
      bg: 'bg-cyan-900/60',
      border: 'border-cyan-400',
      text: 'text-cyan-300',
      glow: 'shadow-lg shadow-cyan-500/40',
      accent: '#6a5030',
    },
    legendary: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-400',
      text: 'text-purple-300',
      glow: 'shadow-xl shadow-purple-500/50 animate-pulse',
      accent: '#5a4020',
    },
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

  // Themed discount code presentation
  const renderDiscountCode = () => {
    if (!discountCode) return null

    const presentation = endingConfig.discountPresentation

    if (presentation === 'property_deed') {
      return (
        <div
          className="mt-6 p-6 rounded-lg text-center"
          style={{
            border: '3px solid #d4a843',
            background: 'linear-gradient(135deg, #3d2b18 0%, #2a1f14 100%)',
          }}
        >
          <p
            className="font-pixel text-lg tracking-widest mb-3"
            style={{ color: '#d4a843' }}
          >
            PROPERTY DEED
          </p>
          <p className="text-amber-200 text-sm italic mb-4">
            This deed entitles the bearer to a special discount at Back of Beyond Ranch.
          </p>
          <div
            className="inline-block px-6 py-3 rounded font-mono text-xl tracking-wider"
            style={{
              border: '2px dashed #8b6914',
              color: '#d4a843',
              background: '#2a1f14',
            }}
          >
            {discountCode}
          </div>
        </div>
      )
    }

    if (presentation === 'wanted_poster') {
      return (
        <div
          className="mt-6 p-6 rounded-lg text-center"
          style={{
            border: '3px solid #a08050',
            background: 'linear-gradient(135deg, #3d2b18 0%, #2a1f14 100%)',
          }}
        >
          <p
            className="font-pixel text-lg tracking-widest mb-3"
            style={{ color: '#a08050' }}
          >
            CASE CLOSED - REWARD
          </p>
          <p className="text-gray-300 text-sm italic mb-4">
            For outstanding detective work, the bearer is entitled to a special reward.
          </p>
          <div
            className="inline-block px-6 py-3 rounded font-mono text-xl tracking-wider"
            style={{
              border: '2px dashed #6a5030',
              color: '#a08050',
              background: '#2a1f14',
            }}
          >
            {discountCode}
          </div>
        </div>
      )
    }

    if (presentation === 'winning_hand') {
      return (
        <div
          className="mt-6 p-6 rounded-lg text-center"
          style={{
            border: '3px solid #d4a843',
            background: 'linear-gradient(135deg, #5a4020 0%, #2a1f14 100%)',
          }}
        >
          <p
            className="font-pixel text-lg tracking-widest mb-3"
            style={{ color: '#d4a843' }}
          >
            WINNER&apos;S TICKET
          </p>
          <p className="text-yellow-200 text-sm italic mb-4">
            Lady Luck cashes out. Present this ticket for your winnings.
          </p>
          <div
            className="inline-block px-6 py-3 rounded font-mono text-xl tracking-wider"
            style={{
              border: '2px dashed #8b6914',
              color: '#d4a843',
              background: '#2a1f14',
            }}
          >
            {discountCode}
          </div>
        </div>
      )
    }

    if (presentation === 'treasure_map') {
      return (
        <div
          className="mt-6 p-6 rounded-lg text-center"
          style={{
            border: '3px solid #9b59b6',
            background: 'linear-gradient(135deg, #2a1f14 0%, #1a0a2e 50%, #2a1f14 100%)',
          }}
        >
          <p
            className="font-pixel text-lg tracking-widest mb-3"
            style={{ color: '#9b59b6' }}
          >
            GOLDEN HOOVES MAP
          </p>
          <p className="text-purple-200 text-sm italic mb-4">
            Follow the golden hooves to where the deer dance at dusk.
          </p>
          <div
            className="inline-block px-6 py-3 rounded font-mono text-xl tracking-wider"
            style={{
              border: '2px dashed #7d3c98',
              color: '#9b59b6',
              background: '#2a1f14',
            }}
          >
            {discountCode}
          </div>
        </div>
      )
    }

    // Default fallback for endings without a specific presentation
    return (
      <div
        className="mt-6 p-6 rounded-lg text-center"
        style={{
          border: '3px solid #8b6914',
          background: 'linear-gradient(135deg, #3d2b18 0%, #2a1f14 100%)',
        }}
      >
        <p
          className="font-pixel text-lg tracking-widest mb-3"
          style={{ color: '#d4a843' }}
        >
          REWARD CODE
        </p>
        <div
          className="inline-block px-6 py-3 rounded font-mono text-xl tracking-wider"
          style={{
            border: '2px dashed #8b6914',
            color: '#d4a843',
            background: '#2a1f14',
          }}
        >
          {discountCode}
        </div>
      </div>
    )
  }

  // Special ending messages for thematic endings
  const renderSpecialEndingMessage = () => {
    if (ending === 'golden_hooves') {
      return (
        <div className="mt-4 p-3 rounded-lg animate-pulse" style={{ background: 'rgba(212, 168, 67, 0.15)' }}>
          <p className="text-sm italic" style={{ color: '#d4a843' }}>
            At dusk, the deer emerge from the treeline, their coats painted gold by the setting sun.
            The real treasure was never buried &mdash; it walks on golden hooves.
          </p>
        </div>
      )
    }

    if (ending === 'detective') {
      return (
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(160, 128, 80, 0.15)' }}>
          <p className="text-sm italic" style={{ color: '#a08050' }}>
            Every case solved. Every thread followed to its end.
            {occupation ? ` The ${occupation} turned Pinkerton agent \u2014 ` : ' '}
            Gold Country sleeps safer tonight.
          </p>
        </div>
      )
    }

    if (ending === 'gambler') {
      return (
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(212, 168, 67, 0.15)' }}>
          <p className="text-sm italic" style={{ color: '#d4a843' }}>
            They say you can&apos;t win &apos;em all &mdash; but nobody told you that.
            The cards fell right, the dice rolled true, and fortune
            kissed you on both cheeks.
          </p>
        </div>
      )
    }

    if (ending === 'legend') {
      return (
        <div className="mt-4 p-3 bg-purple-800/50 rounded-lg">
          <p className="text-purple-200 text-sm italic">
            &quot;Your name echoes through the canyons of Gold Country.
            Future generations will speak of your legend.&quot;
          </p>
        </div>
      )
    }

    return null
  }

  // Ranch reference display
  const renderRanchReference = () => {
    if (!endingConfig.ranchReference) return null

    return (
      <div
        className="mt-4 p-4 rounded-lg text-center"
        style={{
          border: '1px solid #6a5030',
          background: 'linear-gradient(135deg, #3d2b18 0%, #2a1f14 100%)',
        }}
      >
        <p className="text-sm" style={{ color: '#a08050' }}>
          {endingConfig.ranchReference}
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to bottom, #2a1f14 0%, #3d2b18 30%, #5a4020 60%, #3d2b18 85%, #2a1f14 100%)',
      }}
    >
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

          {renderSpecialEndingMessage()}
          {renderRanchReference()}
          {renderDiscountCode()}
        </div>

        {/* Stats Summary */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: 'rgba(42, 31, 20, 0.85)',
            border: '2px solid #8b6914',
          }}
        >
          <h2 className="font-pixel text-lg mb-4 text-center" style={{ color: '#d4a843' }}>
            Journey Statistics
          </h2>

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
            <p className="text-sm" style={{ color: '#6a5030' }}>Total Net Worth</p>
            <p className="font-pixel text-3xl" style={{ color: '#d4a843' }}>{netWorth}🌮</p>
          </div>
        </div>

        {/* Achievements */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: 'rgba(42, 31, 20, 0.85)',
            border: '2px solid #8b6914',
          }}
        >
          <h2 className="font-pixel text-lg mb-4 text-center" style={{ color: '#d4a843' }}>
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
            className="px-8 py-4 text-amber-100 font-pixel text-lg rounded border-4 transition-colors"
            style={{
              background: '#5a4020',
              borderColor: '#8b6914',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = '#6a5030'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = '#5a4020'
            }}
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
          <p className="text-xs mb-2" style={{ color: '#6a5030' }}>Ending Tiers</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(ENDINGS).map(([key, config]) => (
              <span
                key={key}
                className="px-2 py-1 text-xs rounded"
                style={
                  key === ending
                    ? { background: '#5a4020', color: '#d4a843' }
                    : { background: '#2a1f14', color: '#6a5030' }
                }
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
    <div className="rounded-lg p-3 text-center" style={{ background: '#2a1f14' }}>
      <span className="text-xl">{icon}</span>
      <p className="font-pixel text-lg" style={{ color: '#d4a843' }}>{value}</p>
      <p className="text-xs" style={{ color: '#6a5030' }}>{label}</p>
    </div>
  )
}

export default SettlementVictory
