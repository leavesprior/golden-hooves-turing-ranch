'use client'

import React, { useState } from 'react'
import { useSettlement } from '../settlementContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useRanch } from '../ranchContext'
import { SettlementView } from './SettlementView'
import { LandOffice } from './LandOffice'
import { LiveryStable } from './LiveryStable'
import { Gunsmith } from './Gunsmith'
import { RanchManagement } from './RanchManagement'
import { KarmaWallet } from './KarmaWallet'
import { BusinessHub } from './BusinessHub'
import { ENDINGS } from '../data/settlementConfig'
import { playSFX } from '../lib/audioManager'
import { DOSMessage } from '@/components/ui/DOSMessage'
import { FloatingNumber } from '@/components/ui/FloatingNumber'

interface SettlementHubProps {
  onLeave: () => void
  onComplete: () => void
}

type Tab = 'overview' | 'ranch' | 'land_office' | 'livery' | 'gunsmith' | 'business'

export function SettlementHub({ onLeave, onComplete }: SettlementHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showRanchModal, setShowRanchModal] = useState(false)

  const {
    state,
    advanceDay,
    workMiningClaims,
    getNetWorth,
    getCurrentEnding,
    leaveSettlement,
    completeSettlement,
  } = useSettlement()
  const { balance } = useKarmaWallet()
  const ranch = useRanch()

  const netWorth = getNetWorth()
  const currentEnding = getCurrentEnding()
  const endingConfig = ENDINGS[currentEnding]

  const [miningResult, setMiningResult] = useState<number | null>(null)
  const [showDayPassage, setShowDayPassage] = useState(false)
  const [dayPassageText, setDayPassageText] = useState('')

  const dayPhase = state.daysInSettlement % 4
  const DAY_GRADIENTS = [
    'from-blue-900/20 via-amber-900/10 to-yellow-900/10',   // morning
    'from-yellow-900/10 via-amber-900/10 to-orange-900/10', // afternoon
    'from-orange-900/20 via-red-900/15 to-purple-900/15',   // evening
    'from-indigo-900/30 via-blue-900/20 to-gray-900/20',    // night
  ]
  const dayGradient = DAY_GRADIENTS[dayPhase]

  const handleAdvanceDay = () => {
    playSFX('click')
    const nextDay = state.daysInSettlement + 1
    setDayPassageText(`Day ${nextDay}...`)
    setShowDayPassage(true)
    setTimeout(() => {
      advanceDay(1)
      if (ranch?.advanceDay) ranch.advanceDay(1)
      setShowDayPassage(false)
    }, 600)
  }

  const handleAdvanceWeek = () => {
    playSFX('click')
    const startDay = state.daysInSettlement + 1
    setDayPassageText(`Day ${startDay}... ${startDay + 1}... ${startDay + 2}... ${startDay + 3}... ${startDay + 4}... ${startDay + 5}... ${startDay + 6}...`)
    setShowDayPassage(true)
    setTimeout(() => {
      advanceDay(7)
      if (ranch?.advanceDay) ranch.advanceDay(7)
      setShowDayPassage(false)
    }, 1200)
  }

  const handleWorkMines = async () => {
    playSFX('shot')  // pickaxe sound
    const gold = await workMiningClaims()
    setMiningResult(gold)
    handleAdvanceDay()
    if (gold > 0) playSFX('coin')
    setTimeout(() => setMiningResult(null), 3000)
  }

  const handleLeave = () => {
    leaveSettlement()
    onLeave()
  }

  const handleComplete = () => {
    completeSettlement()
    onComplete()
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'ranch', label: 'Ranch', icon: '🐄' },
    { id: 'land_office', label: 'Land Office', icon: '📜' },
    { id: 'livery', label: 'Livery', icon: '🐴' },
    { id: 'gunsmith', label: 'Gunsmith', icon: '🔫' },
    { id: 'business', label: 'Business', icon: '🏪' },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${dayGradient} transition-all duration-1000 p-4`}>
      {showDayPassage && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <DOSMessage text={dayPassageText} speed={60} className="text-amber-400 text-lg font-mono" sfxEvery={0} />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-pixel text-amber-300 text-xl">Gold Country Settlement</h1>
              <p className="text-amber-500 text-sm">Day {state.daysInSettlement} in settlement</p>
            </div>
            <div className="flex items-center gap-4">
              <KarmaWallet compact />
              <div className="text-right">
                <p className="text-amber-400 text-xs">Net Worth</p>
                <p className="text-amber-200 font-pixel">{netWorth}🌮</p>
              </div>
            </div>
          </div>

          {/* Current Ending Preview */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{endingConfig.badge}</span>
                <div>
                  <p className="text-amber-200 text-sm">Current Path: {endingConfig.name}</p>
                  <p className="text-gray-400 text-xs">{endingConfig.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-xs rounded border-2 border-gray-500"
                >
                  Return to Map
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-xs rounded border-2 border-green-500"
                >
                  Complete Journey
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4 bg-gray-900/60 rounded-t-lg overflow-hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 md:py-3 text-base md:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 min-h-[500px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Settlement Visual */}
              <SettlementView />

              {/* Mining Result */}
              {miningResult !== null && (
                <div className="p-4 bg-yellow-900/60 border border-yellow-500 rounded-lg text-center relative">
                  <span className="text-yellow-300 font-pixel text-lg">
                    Mining yield: +{miningResult}🌮
                  </span>
                  <FloatingNumber value={miningResult} emoji="🌮" type="karma" />
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon="🏠"
                  label="Property Tier"
                  value={`${state.propertyTier}/5`}
                />
                <StatCard
                  icon="🏗️"
                  label="Buildings"
                  value={state.buildings.length.toString()}
                />
                <StatCard
                  icon="⭐"
                  label="Reputation"
                  value={state.reputation.toString()}
                />
                <StatCard
                  icon="💰"
                  label="Net Worth"
                  value={`${netWorth}🌮`}
                />
              </div>

              {/* Time Controls */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-3">Time Management</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAdvanceDay}
                    className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-medium"
                  >
                    Next Day
                  </button>
                  <button
                    onClick={handleAdvanceWeek}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-medium"
                  >
                    +7 Days
                  </button>
                  {state.miningClaims > 0 && (
                    <button
                      onClick={handleWorkMines}
                      className="flex-1 py-3 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 rounded font-medium"
                    >
                      Work Mines ({state.miningClaims})
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleLeave}
                  className="flex-1 py-3 bg-red-900/60 hover:bg-red-800/60 text-red-200 rounded border-2 border-red-600"
                >
                  Leave Gold Country
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ranch' && (
            <div>
              <p className="text-gray-400 mb-4">
                Manage your livestock, feed, and ranch infrastructure.
              </p>
              <button
                onClick={() => setShowRanchModal(true)}
                className="w-full py-4 bg-lime-700 hover:bg-lime-600 text-lime-100 rounded-lg font-pixel"
              >
                Open Ranch Management
              </button>

              {/* Quick Ranch Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-gray-400 text-sm">Total Livestock</span>
                  <p className="text-amber-200 font-pixel text-xl">
                    {ranch?.getTotalLivestock?.() || 0}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <span className="text-gray-400 text-sm">Ranch Value</span>
                  <p className="text-amber-200 font-pixel text-xl">
                    {ranch?.getRanchValue?.() || 0}🌮
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'land_office' && <LandOffice />}
          {activeTab === 'livery' && <LiveryStable />}
          {activeTab === 'gunsmith' && <Gunsmith />}
          {activeTab === 'business' && <BusinessHub />}
        </div>
      </div>

      {/* Ranch Modal */}
      {showRanchModal && (
        <RanchManagement onClose={() => setShowRanchModal(false)} />
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-amber-400 text-xl font-pixel">{value}</div>
    </div>
  )
}

export default SettlementHub
