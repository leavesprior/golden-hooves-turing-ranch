'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRanch } from '../ranchContext'
import {
  FENCE_TIERS,
  LIVESTOCK_TYPES,
  FEED_TYPES,
  SEASONS,
  type Season,
  type FenceTier,
  type LivestockType,
  type FeedType,
  getDayOfYear,
} from '../data/ranchConfig'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RanchViewProps {
  onClose?: () => void
}

// ---------------------------------------------------------------------------
// Season theme configuration
// ---------------------------------------------------------------------------

const SEASON_THEMES: Record<
  Season,
  { gradient: string; icon: string; accent: string; particle: string; label: string }
> = {
  spring: {
    gradient: 'bg-gradient-to-b from-green-900 to-emerald-950',
    icon: '\uD83C\uDF38', // blossom
    accent: 'text-green-400',
    particle: '\uD83C\uDF3C', // flower
    label: 'Spring',
  },
  summer: {
    gradient: 'bg-gradient-to-b from-amber-900 to-yellow-950',
    icon: '\u2600\uFE0F', // sun
    accent: 'text-yellow-400',
    particle: '\u2728', // sparkle
    label: 'Summer',
  },
  autumn: {
    gradient: 'bg-gradient-to-b from-orange-900 to-red-950',
    icon: '\uD83C\uDF42', // leaf
    accent: 'text-orange-400',
    particle: '\uD83C\uDF41', // maple leaf
    label: 'Autumn',
  },
  winter: {
    gradient: 'bg-gradient-to-b from-blue-900 to-slate-950',
    icon: '\u2744\uFE0F', // snowflake
    accent: 'text-blue-400',
    particle: '\u2744\uFE0F', // snowflake
    label: 'Winter',
  },
}

// ---------------------------------------------------------------------------
// Fence ASCII art per tier
// ---------------------------------------------------------------------------

const FENCE_ART: Record<FenceTier, string> = {
  1: '---===---===---===---',
  2: '|=|=|=|=|=|=|=|=|=|',
  3: '\u2554\u2550\u2557\u2554\u2550\u2557\u2554\u2550\u2557\u2554\u2550\u2557\u2554\u2550\u2557\u2554\u2550\u2557',
  4: '\u2588\u2593\u2588\u2593\u2588\u2593\u2588\u2593\u2588\u2593\u2588\u2593\u2588\u2593\u2588\u2593\u2588',
  5: '\u2605\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2605',
}

// ---------------------------------------------------------------------------
// Event log colour map
// ---------------------------------------------------------------------------

const EVENT_TYPE_COLORS: Record<string, string> = {
  birth: 'text-green-400',
  death: 'text-red-400',
  event: 'text-amber-400',
  production: 'text-blue-400',
  purchase: 'text-cyan-400',
  sale: 'text-yellow-400',
}

const EVENT_TYPE_DOT: Record<string, string> = {
  birth: 'bg-green-500',
  death: 'bg-red-500',
  event: 'bg-amber-500',
  production: 'bg-blue-500',
  purchase: 'bg-cyan-500',
  sale: 'bg-yellow-500',
}

// ---------------------------------------------------------------------------
// Health bar colour helper
// ---------------------------------------------------------------------------

function healthColor(hp: number): string {
  if (hp > 70) return 'bg-green-500'
  if (hp > 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function healthTextColor(hp: number): string {
  if (hp > 70) return 'text-green-400'
  if (hp > 40) return 'text-yellow-400'
  return 'text-red-400'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RanchView({ onClose }: RanchViewProps) {
  const {
    state,
    getCurrentSeason,
    getSeasonProgress,
    buyLivestock,
    sellLivestock,
    buyFeed,
    setFeedType,
    upgradeFence,
    sellProducts,
    advanceDay,
    getCurrentFence,
    getNextFence,
    canUpgradeFence,
    getTotalLivestock,
    getMaxLivestock,
    getDailyFeedNeed,
    getDailyProduction,
    getEventLog,
  } = useRanch()

  // ---- Derived data -------------------------------------------------------

  const season = getCurrentSeason()
  const seasonProgress = getSeasonProgress()
  const seasonConfig = SEASONS[season]
  const theme = SEASON_THEMES[season]
  const fence = getCurrentFence()
  const nextFence = getNextFence()
  const upgradeCheck = canUpgradeFence()
  const totalLivestock = getTotalLivestock()
  const maxLivestock = getMaxLivestock()
  const dailyFeedNeed = getDailyFeedNeed()
  const dailyProduction = getDailyProduction()
  const events = getEventLog(10)

  // ---- Local UI state -----------------------------------------------------

  const [selectedFeedType, setSelectedFeedType] = useState<FeedType>(state.feedType)
  const eventLogRef = useRef<HTMLDivElement>(null)

  // Scroll event log to bottom when new events appear
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight
    }
  }, [events.length])

  // Days until next season
  const daysUntilNextSeason = seasonProgress.daysRemaining

  // Total products count for sell-all convenience
  const totalProducts = useMemo(() => {
    return Object.values(state.products).reduce((sum: number, v: number) => sum + v, 0)
  }, [state.products])

  // ---- Handlers -----------------------------------------------------------

  const handleBuyLivestock = async (type: LivestockType) => {
    await buyLivestock(type, 1)
  }

  const handleSellLivestock = async (type: LivestockType) => {
    if (state.livestock[type] > 0) {
      await sellLivestock(type, 1)
    }
  }

  const handleBuyFeed = async (amount: number) => {
    await buyFeed(selectedFeedType, amount)
  }

  const handleSetFeedType = (type: FeedType) => {
    setSelectedFeedType(type)
    setFeedType(type)
  }

  const handleSellAllProducts = async () => {
    for (const [product, amount] of Object.entries(state.products) as [string, number][]) {
      if (amount >= 1) {
        await sellProducts(product, Math.floor(amount))
      }
    }
  }

  const handleUpgradeFence = async () => {
    await upgradeFence()
  }

  const handleAdvanceDay = () => {
    advanceDay(1)
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div
      className={`relative rounded-lg border-2 border-amber-700/60 overflow-hidden transition-all duration-1000 ${theme.gradient}`}
    >
      {/* ================================================================= */}
      {/* RANCH HEADER                                                       */}
      {/* ================================================================= */}
      <div className="relative z-10 p-4 sm:p-6 border-b border-amber-800/40 bg-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Ranch name + season */}
          <div className="flex-1 min-w-0">
            <h2 className="font-pixel text-xl sm:text-2xl text-amber-300 truncate">
              Back of Beyond Ranch
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-lg">{theme.icon}</span>
              <span className={`font-pixel text-sm ${theme.accent}`}>
                {theme.label}
              </span>
              <span className="text-amber-600 text-xs">|</span>
              <span className="text-amber-500 text-sm">
                Day {state.gameDay}
              </span>
            </div>
          </div>

          {/* Right: Fence tier indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-amber-400 text-xs font-pixel">
                {fence.name}
              </div>
              {/* Fence tier progression bar */}
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((t) => (
                  <div
                    key={t}
                    className={`w-5 h-2 rounded-sm transition-all duration-500 ${
                      t <= state.fenceTier
                        ? 'bg-amber-500'
                        : 'bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-stone-800 text-amber-400 rounded hover:bg-stone-700 active:bg-stone-600 text-sm border border-amber-800/50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MAIN CONTENT GRID                                                  */}
      {/* ================================================================= */}
      <div className="relative z-10 p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* -------------------------------------------------------------- */}
          {/* LEFT COLUMN: Livestock Grid + Fence Visualization               */}
          {/* -------------------------------------------------------------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* ============================================================ */}
            {/* LIVESTOCK GRID (2x2)                                          */}
            {/* ============================================================ */}
            <div>
              <h3 className="font-pixel text-amber-300 text-sm mb-3">
                Livestock
                <span className="text-amber-600 ml-2 font-normal text-xs">
                  {totalLivestock}/{maxLivestock} capacity
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {(Object.keys(LIVESTOCK_TYPES) as LivestockType[]).map((type) => {
                  const config = LIVESTOCK_TYPES[type]
                  const count = state.livestock[type]
                  const health = state.livestockHealth[type]
                  const isSpring = season === 'spring'
                  const hasProduction = config.produces.length > 0

                  return (
                    <div
                      key={type}
                      className="bg-black/30 border border-amber-800/30 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:border-amber-600/50"
                    >
                      {/* Header: emoji + count + buttons */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl sm:text-4xl">{config.emoji}</span>
                          {/* Spring breeding indicator */}
                          {isSpring && count >= 2 && (
                            <span className="relative flex h-2.5 w-2.5" title="Breeding season!">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSellLivestock(type)}
                            disabled={count < 1}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-sm font-bold transition-colors ${
                              count >= 1
                                ? 'bg-red-900/60 text-red-300 hover:bg-red-800/80 active:bg-red-700'
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                            title={`Sell 1 ${config.name}`}
                          >
                            -
                          </button>
                          <span className="text-amber-300 text-lg sm:text-xl font-bold w-8 text-center">
                            {count}
                          </span>
                          <button
                            onClick={() => handleBuyLivestock(type)}
                            disabled={totalLivestock >= maxLivestock}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-sm font-bold transition-colors ${
                              totalLivestock < maxLivestock
                                ? 'bg-green-900/60 text-green-300 hover:bg-green-800/80 active:bg-green-700'
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                            title={`Buy 1 ${config.name} (${config.neutralKarmaCost} karma)`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="text-amber-400 text-xs font-pixel mb-1">
                        {config.namePlural}
                      </div>

                      {/* Health bar */}
                      {count > 0 && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-amber-600">Health</span>
                            <span className={healthTextColor(health)}>
                              {Math.round(health)}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${healthColor(health)}`}
                              style={{ width: `${Math.max(2, health)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Daily production info */}
                      {hasProduction && count > 0 && (
                        <div className="text-xs text-amber-600 space-y-0.5">
                          {config.produces.map((prod) => (
                            <div key={prod.name} className="flex justify-between">
                              <span>{prod.name}</span>
                              <span className="text-amber-500">
                                +{(prod.productionRate * count).toFixed(1)}/day
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Special bonus note */}
                      {config.specialBonus && count > 0 && (
                        <div className="text-xs text-emerald-500 mt-1">
                          {config.specialBonus}
                        </div>
                      )}

                      {/* Cost info when empty */}
                      {count === 0 && (
                        <div className="text-xs text-stone-500 mt-1">
                          Cost: {config.neutralKarmaCost} karma
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ============================================================ */}
            {/* FENCE VISUALIZATION                                           */}
            {/* ============================================================ */}
            <div className="bg-black/30 border border-amber-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-pixel text-amber-300 text-sm">
                  Fence: {fence.name}
                </h3>
                <span className="text-xs text-amber-600">
                  Tier {state.fenceTier}/5
                </span>
              </div>

              {/* Fence ASCII art */}
              <div className="bg-stone-950/60 rounded p-3 mb-3 text-center overflow-x-auto">
                <pre className="font-mono text-amber-500 text-sm sm:text-base tracking-wider whitespace-nowrap">
                  {FENCE_ART[state.fenceTier]}
                </pre>
              </div>

              {/* Protection stats */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <span className="text-amber-600">Predator Resistance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-stone-800 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${fence.predatorResistance * 100}%` }}
                      />
                    </div>
                    <span className="text-blue-400 w-8 text-right">
                      {Math.round(fence.predatorResistance * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-amber-600">Escape Resistance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-stone-800 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${fence.escapeResistance * 100}%` }}
                      />
                    </div>
                    <span className="text-purple-400 w-8 text-right">
                      {Math.round(fence.escapeResistance * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Upgrade in progress */}
              {state.upgradeInProgress && (
                <div className="p-2 bg-amber-900/20 rounded border border-amber-700/30 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="animate-bounce">🔨</span>
                    <span className="text-amber-400">Upgrading...</span>
                    <span className="text-amber-600 text-xs">
                      ({state.upgradeDaysRemaining} days remaining)
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-stone-800 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${
                          nextFence
                            ? 100 - (state.upgradeDaysRemaining / nextFence.upgradeTime) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upgrade button */}
              {!state.upgradeInProgress && state.fenceTier < 5 && nextFence && (
                <button
                  onClick={handleUpgradeFence}
                  disabled={!upgradeCheck.canUpgrade}
                  className={`w-full py-2.5 rounded text-sm font-medium transition-colors ${
                    upgradeCheck.canUpgrade
                      ? 'bg-amber-700 text-amber-100 hover:bg-amber-600 active:bg-amber-500'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {upgradeCheck.canUpgrade
                    ? `Upgrade to ${nextFence.name} (${nextFence.neutralKarmaCost} karma)`
                    : upgradeCheck.reason || 'Max tier reached'}
                </button>
              )}

              {state.fenceTier === 5 && !state.upgradeInProgress && (
                <div className="text-center text-amber-500 text-xs py-1">
                  Maximum fence tier reached
                </div>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Resources + Season Info + Advance Day             */}
          {/* -------------------------------------------------------------- */}
          <div className="space-y-6">
            {/* ============================================================ */}
            {/* RESOURCE PANEL                                                */}
            {/* ============================================================ */}
            <div className="bg-black/30 border border-amber-800/30 rounded-lg p-4 space-y-4">
              <h3 className="font-pixel text-amber-300 text-sm">
                Resources
              </h3>

              {/* Feed stock */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600">Feed Stock</span>
                  <span
                    className={
                      state.feedStock < 10
                        ? 'text-red-400 animate-pulse'
                        : state.feedStock < dailyFeedNeed * 3
                        ? 'text-yellow-400'
                        : 'text-amber-400'
                    }
                  >
                    {state.feedStock} units
                  </span>
                </div>
                <div
                  className={`w-full bg-stone-800 rounded-full h-2 ${
                    state.feedStock < 10 ? 'ring-1 ring-red-500/60 animate-pulse' : ''
                  }`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      state.feedStock < 10
                        ? 'bg-red-500'
                        : state.feedStock < dailyFeedNeed * 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (state.feedStock / Math.max(dailyFeedNeed * 14, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  Needs {dailyFeedNeed}/day
                  {dailyFeedNeed > 0 && (
                    <span className="text-stone-500 ml-1">
                      ({Math.floor(state.feedStock / dailyFeedNeed)} days left)
                    </span>
                  )}
                </div>

                {/* Buy feed buttons */}
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleBuyFeed(amt)}
                      className="flex-1 py-1.5 text-xs bg-stone-800 text-amber-400 rounded hover:bg-stone-700 active:bg-stone-600 border border-amber-800/30 transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed type selector */}
              <div>
                <div className="text-xs text-amber-600 mb-1">Feed Type</div>
                <div className="flex gap-1">
                  {(Object.keys(FEED_TYPES) as FeedType[]).map((type) => {
                    const feedConfig = FEED_TYPES[type]
                    const isActive = selectedFeedType === type
                    return (
                      <button
                        key={type}
                        onClick={() => handleSetFeedType(type)}
                        className={`flex-1 py-1.5 px-1 text-xs rounded transition-colors ${
                          isActive
                            ? 'bg-amber-700 text-amber-100 border border-amber-500'
                            : 'bg-stone-800 text-amber-500 hover:bg-stone-700 border border-stone-700'
                        }`}
                        title={feedConfig.description}
                      >
                        {feedConfig.name}
                      </button>
                    )
                  })}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Health: {FEED_TYPES[selectedFeedType].healthBonus}x | Birth:{' '}
                  {FEED_TYPES[selectedFeedType].birthBonus}x
                </div>
              </div>

              {/* Products inventory */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-amber-600">Products</span>
                  {totalProducts >= 1 && (
                    <button
                      onClick={handleSellAllProducts}
                      className="text-xs text-yellow-400 hover:text-yellow-300 active:text-yellow-200 transition-colors"
                    >
                      Sell All
                    </button>
                  )}
                </div>
                {Object.entries(state.products).filter(([, amt]) => amt >= 0.5).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(state.products)
                      .filter(([, amt]) => amt >= 0.5)
                      .map(([name, amount]) => {
                        // Find value
                        let valuePerUnit = 1
                        for (const config of Object.values(LIVESTOCK_TYPES)) {
                          const prod = config.produces.find((p) => p.name === name)
                          if (prod) {
                            valuePerUnit = prod.karmaValue
                            break
                          }
                        }
                        return (
                          <div
                            key={name}
                            className="flex justify-between items-center text-xs bg-stone-800/50 px-2 py-1 rounded"
                          >
                            <span className="text-amber-400">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-500">
                                x{Math.floor(amount)}
                              </span>
                              <button
                                onClick={() => sellProducts(name, Math.floor(amount))}
                                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                title={`Sell for ${Math.floor(amount) * valuePerUnit} karma`}
                              >
                                Sell
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-xs text-stone-500">
                    No products yet
                  </div>
                )}
              </div>

              {/* Neutral Karma balance display */}
              <div className="bg-stone-900/50 rounded p-2 border border-amber-800/20">
                <div className="text-xs text-amber-600 mb-0.5">Karma Balance</div>
                <div className="text-amber-400 text-sm font-pixel">
                  {/* Karma balance is managed by KarmaWalletContext, but we show a summary here via dailyProduction */}
                  Daily income:{' '}
                  {Object.values(dailyProduction)
                    .reduce((sum, p) => sum + p.value, 0)
                    .toFixed(1)}{' '}
                  karma/day
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SEASON INFO CARD                                              */}
            {/* ============================================================ */}
            <div className="bg-black/30 border border-amber-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{theme.icon}</span>
                <h3 className="font-pixel text-amber-300 text-sm">
                  {theme.label} Effects
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {/* Feed multiplier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>🌾</span>
                    <span className="text-amber-500">Feed Consumption</span>
                  </div>
                  <span
                    className={
                      seasonConfig.feedMultiplier > 1.0
                        ? 'text-red-400'
                        : seasonConfig.feedMultiplier < 1.0
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }
                  >
                    x{seasonConfig.feedMultiplier}
                  </span>
                </div>

                {/* Birth multiplier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>🐣</span>
                    <span className="text-amber-500">Birth Rate</span>
                  </div>
                  <span
                    className={
                      seasonConfig.birthMultiplier > 1.0
                        ? 'text-green-400'
                        : seasonConfig.birthMultiplier < 1.0
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }
                  >
                    x{seasonConfig.birthMultiplier}
                  </span>
                </div>

                {/* Predator risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>🐺</span>
                    <span className="text-amber-500">Predator Risk</span>
                  </div>
                  <span
                    className={
                      seasonConfig.predatorRisk > 0.2
                        ? 'text-red-400'
                        : seasonConfig.predatorRisk > 0.1
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }
                  >
                    {Math.round(seasonConfig.predatorRisk * 100)}%
                  </span>
                </div>

                {/* Season description */}
                <div className="pt-2 border-t border-stone-700/50 text-amber-600 italic">
                  {seasonConfig.description}
                </div>

                {/* Next season countdown */}
                <div className="text-stone-500 pt-1">
                  Next season in{' '}
                  <span className={theme.accent}>
                    {daysUntilNextSeason}
                  </span>{' '}
                  days
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* ADVANCE DAY BUTTON                                            */}
            {/* ============================================================ */}
            <button
              onClick={handleAdvanceDay}
              disabled={state.upgradeInProgress && state.upgradeDaysRemaining <= 0}
              className="w-full py-3 sm:py-4 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-600 active:bg-amber-500 transition-colors font-pixel text-sm sm:text-base border border-amber-600/50 shadow-lg shadow-amber-900/30"
            >
              <div>
                Advance to Day {state.gameDay + 1}
              </div>
              <div className="text-xs text-amber-300/70 font-normal mt-0.5">
                {state.feedStock >= dailyFeedNeed
                  ? `Feed: -${dailyFeedNeed}`
                  : 'WARNING: Not enough feed!'}
                {state.upgradeInProgress && state.upgradeDaysRemaining > 0 && (
                  <span className="ml-2">| Build: {state.upgradeDaysRemaining}d left</span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* EVENT LOG                                                          */}
        {/* ================================================================= */}
        <div className="bg-black/30 border border-amber-800/30 rounded-lg p-4">
          <h3 className="font-pixel text-amber-300 text-sm mb-2">
            Ranch Log
          </h3>

          <div
            ref={eventLogRef}
            className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-stone-900"
          >
            {events.length > 0 ? (
              [...events].reverse().map((entry, idx) => {
                const seasonIcon = SEASON_THEMES[entry.season]?.icon || ''
                const colorClass = EVENT_TYPE_COLORS[entry.type] || 'text-amber-400'
                const dotClass = EVENT_TYPE_DOT[entry.type] || 'bg-amber-500'

                return (
                  <div
                    key={`event-${entry.day}-${idx}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-stone-500 shrink-0 w-10 text-right">
                      D{entry.day}
                    </span>
                    <span className="shrink-0 text-xs" title={entry.season}>
                      {seasonIcon}
                    </span>
                    <span
                      className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`}
                    />
                    <span className={colorClass}>{entry.event}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-stone-500 text-xs text-center py-4">
                No events yet. Advance a day to begin ranching!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SEASONAL PARTICLE ACCENTS (decorative)                             */}
      {/* ================================================================= */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none overflow-hidden opacity-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={`particle-${i}`}
            className="absolute text-lg animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          >
            {theme.particle}
          </span>
        ))}
      </div>
    </div>
  )
}

export default RanchView
