'use client'

import React, { useState } from 'react'
import { useRanch } from '../ranchContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { RanchView } from './RanchView'
import { FenceUpgradePanel } from './FenceUpgradePanel'
import { LivestockPanel } from './LivestockPanel'
import { SeasonBar } from './SeasonBar'
import { LIVESTOCK_TYPES, FEED_TYPES, type LivestockType, type FeedType, type FenceConfig, type RanchEvent } from '../data/ranchConfig'

interface RanchManagementProps {
  onClose: () => void
}

type Tab = 'overview' | 'livestock' | 'infrastructure' | 'market'

export function RanchManagement({ onClose }: RanchManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const {
    state,
    getCurrentFence,
    getTotalLivestock,
    getMaxLivestock,
    getDailyFeedNeed,
    getDailyProduction,
    advanceDay,
    getSeasonProgress,
    getRanchValue,
    getEventLog,
    buyFeed,
    sellProducts,
  } = useRanch()
  const { balance } = useKarmaWallet()

  const fence = getCurrentFence()
  const seasonProgress = getSeasonProgress()
  const production = getDailyProduction()
  const events = getEventLog(5)

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'livestock', label: 'Livestock', icon: '🐄' },
    { id: 'infrastructure', label: 'Build', icon: '🔨' },
    { id: 'market', label: 'Market', icon: '💰' },
  ]

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-amber-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl text-amber-300">🌾 {state.location} Ranch</h1>
            <p className="text-gray-500 text-sm">{fence.name} • Value: {getRanchValue()}🪙</p>
          </div>
          <div className="flex items-center gap-4">
            <SeasonBar season={seasonProgress.current} daysRemaining={seasonProgress.daysRemaining} day={state.gameDay} />
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Back to Trail
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <OverviewTab
              state={state}
              fence={fence}
              balance={balance}
              production={production}
              events={events}
              totalLivestock={getTotalLivestock()}
              maxLivestock={getMaxLivestock()}
              dailyFeed={getDailyFeedNeed()}
              onAdvanceDay={() => advanceDay(1)}
              onAdvanceWeek={() => advanceDay(7)}
            />
          )}

          {activeTab === 'livestock' && (
            <LivestockPanel />
          )}

          {activeTab === 'infrastructure' && (
            <FenceUpgradePanel />
          )}

          {activeTab === 'market' && (
            <MarketTab
              products={state.products}
              feedStock={state.feedStock}
              onBuyFeed={buyFeed}
              onSellProducts={sellProducts}
              balance={balance}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({
  state,
  fence,
  balance,
  production,
  events,
  totalLivestock,
  maxLivestock,
  dailyFeed,
  onAdvanceDay,
  onAdvanceWeek,
}: {
  state: ReturnType<typeof useRanch>['state']
  fence: FenceConfig
  balance: { neutral: number; good: number; bad: number }
  production: Record<string, { amount: number; value: number }>
  events: Array<{ day: number; season: string; event: string; type: string }>
  totalLivestock: number
  maxLivestock: number
  dailyFeed: number
  onAdvanceDay: () => void
  onAdvanceWeek: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Ranch Visual */}
      <RanchView
        fenceTier={state.fenceTier}
        livestock={state.livestock}
        upgradeInProgress={state.upgradeInProgress}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🐄"
          label="Livestock"
          value={`${totalLivestock}/${maxLivestock}`}
          subtext={Object.entries(state.livestock)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => `${count} ${LIVESTOCK_TYPES[type as LivestockType].namePlural}`)
            .join(', ') || 'None'}
        />
        <StatCard
          icon="🌾"
          label="Feed Stock"
          value={state.feedStock.toString()}
          subtext={`Need ${dailyFeed}/day`}
          warning={state.feedStock < dailyFeed * 7}
        />
        <StatCard
          icon="💰"
          label="Balance"
          value={`${balance.neutral}🪙`}
          subtext={balance.good > 0 ? `+${balance.good}🍪` : undefined}
        />
        <StatCard
          icon="📦"
          label="Products"
          value={Object.values(state.products).reduce((a, b) => a + b, 0).toFixed(0)}
          subtext={Object.entries(state.products)
            .filter(([, amt]) => amt > 0.5)
            .map(([name, amt]) => `${Math.floor(amt)} ${name}`)
            .join(', ') || 'None'}
        />
      </div>

      {/* Daily Production */}
      {Object.keys(production).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-amber-400 text-sm font-medium mb-2">Daily Production</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(production).map(([name, { amount, value }]) => (
              <div key={name} className="bg-gray-700 px-3 py-2 rounded">
                <span className="text-gray-300">{name}</span>
                <span className="text-amber-400 ml-2">+{amount.toFixed(1)}</span>
                <span className="text-gray-500 text-xs ml-1">({value.toFixed(0)}🪙/day)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Controls */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-amber-400 text-sm font-medium">Time Management</h3>
          <p className="text-gray-500 text-xs">Day {state.gameDay} • Feed lasts {Math.floor(state.feedStock / Math.max(dailyFeed, 1))} days</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAdvanceDay}
            className="px-4 py-2 bg-amber-700 text-amber-100 rounded hover:bg-amber-600"
          >
            Next Day
          </button>
          <button
            onClick={onAdvanceWeek}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            +7 Days
          </button>
        </div>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-amber-400 text-sm font-medium mb-2">Recent Events</h3>
          <div className="space-y-1">
            {events.reverse().map((event, idx) => (
              <div key={idx} className="text-sm flex items-center gap-2">
                <span className="text-gray-500 text-xs">Day {event.day}</span>
                <span className={`w-2 h-2 rounded-full ${
                  event.type === 'birth' ? 'bg-green-500' :
                  event.type === 'death' ? 'bg-red-500' :
                  event.type === 'sale' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-gray-300">{event.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Market Tab Component
function MarketTab({
  products,
  feedStock,
  onBuyFeed,
  onSellProducts,
  balance,
}: {
  products: Record<string, number>
  feedStock: number
  onBuyFeed: (type: FeedType, units: number) => Promise<boolean>
  onSellProducts: (name: string, amount: number) => Promise<number>
  balance: { neutral: number; good: number; bad: number }
}) {
  const [buyAmount, setBuyAmount] = useState(10)

  return (
    <div className="space-y-6">
      {/* Buy Feed */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">Buy Feed</h3>
        <p className="text-gray-500 text-sm mb-4">Current stock: {feedStock} units</p>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-400">Amount:</span>
          {[10, 25, 50, 100].map(amt => (
            <button
              key={amt}
              onClick={() => setBuyAmount(amt)}
              className={`px-3 py-1 rounded ${
                buyAmount === amt
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Object.values(FEED_TYPES).map(feed => {
            const cost = feed.neutralKarmaCost * Math.ceil(buyAmount / feed.unitsProvided)
            const canAfford = balance.neutral >= cost

            return (
              <button
                key={feed.type}
                onClick={() => onBuyFeed(feed.type, buyAmount)}
                disabled={!canAfford}
                className={`p-4 rounded-lg text-left transition-colors ${
                  canAfford
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-amber-400 font-medium">{feed.name}</div>
                <div className="text-gray-400 text-xs mt-1">{feed.description}</div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-gray-300">{buyAmount} units</span>
                  <span className={canAfford ? 'text-yellow-400' : 'text-red-400'}>{cost}🪙</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Health: {feed.healthBonus}x • Birth: {feed.birthBonus}x
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sell Products */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-amber-400 font-medium mb-4">Sell Products</h3>

        {Object.entries(products).filter(([, amt]) => amt >= 1).length === 0 ? (
          <p className="text-gray-500">No products to sell. Raise livestock to produce goods!</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(products)
              .filter(([, amt]) => amt >= 1)
              .map(([name, amount]) => {
                // Find value
                let valuePerUnit = 1
                for (const config of Object.values(LIVESTOCK_TYPES)) {
                  const prod = config.produces.find(p => p.name === name)
                  if (prod) {
                    valuePerUnit = prod.karmaValue
                    break
                  }
                }

                const sellAmount = Math.floor(amount)
                const totalValue = sellAmount * valuePerUnit

                return (
                  <button
                    key={name}
                    onClick={() => onSellProducts(name, sellAmount)}
                    className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400">{name}</span>
                      <span className="text-gray-400">x{sellAmount}</span>
                    </div>
                    <div className="text-sm text-green-400 mt-1">
                      Sell for {totalValue}🪙
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtext,
  warning,
}: {
  icon: string
  label: string
  value: string
  subtext?: string
  warning?: boolean
}) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${warning ? 'border border-red-500/50' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className={`text-xl font-bold ${warning ? 'text-red-400' : 'text-amber-400'}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-gray-500 text-xs mt-1 truncate">{subtext}</div>
      )}
    </div>
  )
}

export default RanchManagement
