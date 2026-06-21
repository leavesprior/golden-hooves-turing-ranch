'use client'

import React, { useState } from 'react'
import { useRanch } from '../ranchContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { RanchView } from './RanchView'
import { FenceUpgradePanel } from './FenceUpgradePanel'
import { LivestockPanel } from './LivestockPanel'
import { SeasonBar } from './SeasonBar'
import { LIVESTOCK_TYPES, FEED_TYPES, type LivestockType, type FeedType, type FenceConfig } from '../data/ranchConfig'
import { CROPS, PURCHASABLE_PARCELS } from '../data/seasonalMarket'

interface RanchManagementProps {
  onClose: () => void
}

type Tab = 'overview' | 'livestock' | 'fields' | 'infrastructure' | 'market'

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
    { id: 'fields', label: 'Fields', icon: '🌱' },
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
            <p className="text-gray-500 text-sm">{fence.name} • Value: {getRanchValue()}🌮</p>
          </div>
          <div className="flex items-center gap-4">
            <SeasonBar season={seasonProgress.current} daysRemaining={seasonProgress.daysRemaining} day={state.gameDay} />
            <button
              onClick={onClose}
              className="px-4 py-2.5 md:px-3 md:py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 active:bg-gray-500 text-base md:text-sm"
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
              className={`flex-1 py-4 md:py-3 text-base md:text-sm font-medium transition-colors active:scale-[0.98] ${
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

          {activeTab === 'fields' && (
            <FieldsPanel />
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
      <RanchView />

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
          value={`${balance.neutral}🌮`}
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
                <span className="text-gray-500 text-xs ml-1">({value.toFixed(0)}🌮/day)</span>
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
            className="px-5 py-3 md:px-4 md:py-2 bg-amber-700 text-amber-100 rounded hover:bg-amber-600 active:bg-amber-500 text-base md:text-sm"
          >
            Next Day
          </button>
          <button
            onClick={onAdvanceWeek}
            className="px-5 py-3 md:px-4 md:py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 active:bg-gray-500 text-base md:text-sm"
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

        <div className="flex items-center gap-2 md:gap-4 mb-4 flex-wrap">
          <span className="text-gray-400">Amount:</span>
          {[10, 25, 50, 100, 500, 1000].map(amt => (
            <button
              key={amt}
              onClick={() => setBuyAmount(amt)}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded text-base md:text-sm active:scale-[0.98] ${
                buyAmount === amt
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(FEED_TYPES).map(feed => {
            const cost = feed.neutralKarmaCost * Math.ceil(buyAmount / feed.unitsProvided)
            const canAfford = balance.neutral >= cost

            return (
              <button
                key={feed.type}
                onClick={() => onBuyFeed(feed.type, buyAmount)}
                disabled={!canAfford}
                className={`p-5 md:p-4 rounded-lg text-left transition-colors active:scale-[0.99] ${
                  canAfford
                    ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500'
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-amber-400 font-medium">{feed.name}</div>
                <div className="text-gray-400 text-xs mt-1">{feed.description}</div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-gray-300">{buyAmount} units</span>
                  <span className={canAfford ? 'text-yellow-400' : 'text-red-400'}>{cost}🌮</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="p-5 md:p-4 bg-gray-700 rounded-lg hover:bg-gray-600 active:bg-gray-500 text-left active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400">{name}</span>
                      <span className="text-gray-400">x{sellAmount}</span>
                    </div>
                    <div className="text-sm text-green-400 mt-1">
                      Sell for {totalValue}🌮
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

// FIELDS PANEL (2026-06-17) — the parcel/season "castle builder" layer. See each
// field; assign it, this season, to a crop / livestock grazing / fallow; harvest
// when ready. Reuses the existing crop engine (cost/growth/yield) via the context.
function soilLabel(q: number): { color: string; word: string } {
  if (q >= 75) return { color: '#4ade80', word: 'rich' }
  if (q >= 55) return { color: '#a3e635', word: 'good' }
  if (q >= 40) return { color: '#facc15', word: 'fair' }
  if (q >= 25) return { color: '#fb923c', word: 'tired' }
  return { color: '#f87171', word: 'spent' }
}

function FieldsPanel() {
  const { getParcels, getParcelAssignment, assignParcel, harvestParcel, getPlantableCrops, getCurrentSeason, getSoilMetrics, releasePigsOnParcel, buyParcel, state } = useRanch()
  const [msg, setMsg] = useState<string | null>(null)
  const parcels = getParcels()
  const plantable = getPlantableCrops()
  const season = getCurrentSeason()
  const pigs = state.livestock.pigs || 0
  const buyable = PURCHASABLE_PARCELS.filter(p => !state.ownedParcels.includes(p.id))
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3500) }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-amber-200 text-sm font-bold">Your Fields</p>
        <span className="text-amber-400/70 text-xs capitalize">{season} · assign each field this season</span>
      </div>
      <p className="text-gray-400 text-xs">Plant a crop (costs karma, grows over the season), set a field to grazing, or leave it fallow to rest. Harvest pays karma + feed.</p>
      {msg && <div className="text-amber-200 text-xs bg-amber-900/40 border border-amber-600/40 rounded p-2">{msg}</div>}

      {parcels.map(p => {
        const a = getParcelAssignment(p.id)
        const ready = a?.use === 'crop' && a.harvestDay !== undefined && state.gameDay >= a.harvestDay
        const status = a?.use === 'crop' && a.cropType
          ? (ready
              ? `${CROPS[a.cropType].emoji} ${CROPS[a.cropType].name} — READY TO HARVEST`
              : `${CROPS[a.cropType].emoji} ${CROPS[a.cropType].name} — ${(a.harvestDay! - state.gameDay)} day(s) to harvest`)
          : a?.use === 'livestock' ? '🐄 Grazing'
          : a?.use === 'fallow' ? '🟫 Fallow (resting the soil)'
          : '— unassigned —'
        return (
          <div key={p.id} className="border-2 border-amber-700/50 bg-amber-950/20 rounded-lg p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-amber-200 text-sm font-bold">🌾 {p.name} <span className="text-amber-500/70 text-[10px] font-normal">({p.acres} acres)</span></span>
              <span className="text-amber-500/60 text-[10px] italic">{p.note}</span>
            </div>
            <p className="text-amber-100 text-xs mt-1">{status}</p>
            {(() => { const q = Math.round(getSoilMetrics(p.id).quality); const s = soilLabel(q); return (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-amber-400/70">soil</span>
                <div className="h-1.5 bg-black/40 rounded overflow-hidden w-[140px]"><div style={{ width: `${q}%`, background: s.color }} className="h-full" /></div>
                <span className="text-[10px]" style={{ color: s.color }}>{q}% {s.word}</span>
              </div>
            ) })()}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ready ? (
                <button
                  onClick={() => flash(harvestParcel(p.id).message)}
                  className="px-2 py-1 rounded text-xs bg-green-700 hover:bg-green-600 text-green-50 border border-green-500"
                >
                  🧺 Harvest
                </button>
              ) : (
                <>
                  {plantable.map(ct => (
                    <button
                      key={ct}
                      onClick={async () => { const ok = await assignParcel(p.id, 'crop', ct); flash(ok ? `Planted ${CROPS[ct].name} in ${p.name}.` : `Can't plant ${CROPS[ct].name} — need ${CROPS[ct].plantCost}🌮 (and it's a ${CROPS[ct].plantSeasons.join('/')} crop).`) }}
                      className="px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-amber-700 text-amber-100 border border-amber-600/40"
                    >
                      {CROPS[ct].emoji} {CROPS[ct].name} · {CROPS[ct].plantCost}🌮
                    </button>
                  ))}
                  <button onClick={async () => { await assignParcel(p.id, 'livestock'); flash(`${p.name} set to grazing.`) }} className="px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-amber-700 text-amber-100 border border-amber-600/40">🐄 Graze</button>
                  <button onClick={async () => { await assignParcel(p.id, 'fallow'); flash(`${p.name} left fallow.`) }} className="px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-amber-700 text-amber-100 border border-amber-600/40">🟫 Fallow</button>
                </>
              )}
              {a?.use === 'crop' && a.cropType === 'potatoes' && ready && pigs > 0 && (
                <button onClick={() => flash(releasePigsOnParcel(p.id).message)} title="The trick: when the potatoes are ripe, pigs eat them, till the ground and manure it — leaving the soil richer (instead of harvesting)." className="px-2 py-1 rounded text-[11px] bg-pink-800 hover:bg-pink-700 text-pink-50 border border-pink-500">🐷 Loose the pigs</button>
              )}
            </div>
            {plantable.length === 0 && !ready && a?.use !== 'crop' && (
              <p className="text-amber-500/60 text-[10px] mt-1 italic">No crops can be planted this season — graze or leave fallow.</p>
            )}
          </div>
        )
      })}

      {buyable.length > 0 && (
        <div className="border-2 border-amber-700/40 bg-amber-950/10 rounded-lg p-3 mt-2">
          <p className="text-amber-200 text-sm font-bold mb-1">Buy Nearby Parcels</p>
          <p className="text-gray-400 text-[11px] mb-2">Expand the ranch — each new field can be cropped, grazed, or rested like the rest. Soil starts where the land left it.</p>
          <div className="flex flex-wrap gap-1.5">
            {buyable.map(bp => (
              <button key={bp.id} onClick={async () => { const ok = await buyParcel(bp.id); flash(ok ? `Bought ${bp.name} (${bp.acres} ac).` : `Can't buy ${bp.name} — need ${bp.cost}🌮.`) }} title={bp.note} className="px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-amber-700 text-amber-100 border border-amber-600/40">
                🪙 {bp.name} · {bp.acres}ac · {bp.cost}🌮
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RanchManagement
