'use client'

/**
 * Seasonal Market Overlay
 *
 * Lords of the Realm II-inspired market info panel that shows inside the
 * TownShop (and anywhere else trade happens).  Displays:
 *   - Current season with icon
 *   - Active market event banner
 *   - Per-category price multipliers with trend arrows
 *   - Crop planting/harvesting status when ranch is unlocked
 *
 * Reads from RanchContext (which already tracks season + market events) and
 * seasonalMarket data.  Designed to be dropped in as a compact info strip
 * rather than a full-screen modal.
 */

import React, { useState } from 'react'
import { useRanch } from '../ranchContext'
import {
  SEASONAL_PRICES,
  CROPS,
  getEffectivePrice,
  getSeasonalAdvice,
  isCropReady,
  type CropType,
} from '../data/seasonalMarket'
import { getCurrentSeason, getDayOfYear } from '../data/ranchConfig'

// ============================================================================
// CONSTANTS
// ============================================================================

const SEASON_ICONS: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

const SEASON_COLORS: Record<string, string> = {
  spring: 'text-green-400 border-green-700',
  summer: 'text-yellow-400 border-yellow-700',
  autumn: 'text-orange-400 border-orange-700',
  winter: 'text-blue-300 border-blue-700',
}

const SEASON_BG: Record<string, string> = {
  spring: 'bg-green-900/20',
  summer: 'bg-yellow-900/20',
  autumn: 'bg-orange-900/20',
  winter: 'bg-blue-900/20',
}

/** Return a trend arrow and color based on the multiplier vs 1.0 baseline. */
function trendArrow(multiplier: number): { symbol: string; color: string } {
  if (multiplier >= 1.4) return { symbol: '↑↑', color: 'text-red-400' }
  if (multiplier >= 1.1) return { symbol: '↑',  color: 'text-orange-400' }
  if (multiplier <= 0.6) return { symbol: '↓↓', color: 'text-green-400' }
  if (multiplier <= 0.9) return { symbol: '↓',  color: 'text-green-400' }
  return { symbol: '→', color: 'text-amber-400' }
}

/** Format a multiplier as a readable price modifier string. */
function formatMult(multiplier: number): string {
  if (multiplier === 1.0) return 'Normal'
  const pct = Math.round((multiplier - 1) * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

// ============================================================================
// COMPONENT
// ============================================================================

interface SeasonalMarketOverlayProps {
  /** Game day from OregonTrailState — used to derive season when ranch is not
   *  unlocked (ranch tracks its own day; trail uses state.day). */
  gameDay: number
  /** Whether to show crop status rows (only relevant when ranch is unlocked). */
  showCrops?: boolean
  /** Compact mode: just a one-line season + price strip, no event banner. */
  compact?: boolean
}

export function SeasonalMarketOverlay({
  gameDay,
  showCrops = false,
  compact = false,
}: SeasonalMarketOverlayProps) {
  const ranch = useRanch()
  const [expanded, setExpanded] = useState(!compact)

  // Derive season — prefer ranch context (more accurate when ranch is active)
  const season = ranch.getCurrentSeason()

  // Market event
  const activeEvent = ranch.getActiveMarketEvent()

  // Effective multipliers for each category
  const livestockMult = getEffectivePrice('livestock', season, activeEvent)
  const productsMult  = getEffectivePrice('products',  season, activeEvent)
  const feedMult      = getEffectivePrice('feed',      season, activeEvent)

  // Seasonal advice string
  const advice = getSeasonalAdvice(season)

  // Crop status (only when ranch is unlocked and showCrops is true)
  const cropPlots = ranch.getCropPlots()
  const readyCrops = cropPlots.filter(p => isCropReady(p, gameDay) && !p.harvested)
  const growingCrops = cropPlots.filter(p => !p.harvested && !isCropReady(p, gameDay))

  const seasonIcon  = SEASON_ICONS[season]  ?? '🌍'
  const seasonColor = SEASON_COLORS[season] ?? 'text-amber-400 border-amber-700'
  const seasonBg    = SEASON_BG[season]     ?? 'bg-amber-900/20'

  // ---- Compact strip -------------------------------------------------------
  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded border ${seasonColor} ${seasonBg} text-xs hover:opacity-90 transition-opacity`}
      >
        <span>{seasonIcon}</span>
        <span className="font-bold capitalize">{season}</span>
        {activeEvent && (
          <>
            <span className="text-amber-600">|</span>
            <span className="text-amber-300 truncate">{activeEvent.name}</span>
          </>
        )}
        <span className="ml-auto text-amber-600">▼ market</span>
      </button>
    )
  }

  // ---- Full panel ----------------------------------------------------------
  return (
    <div className={`border rounded-lg overflow-hidden ${seasonBg} border-amber-700/60`}>
      {/* Season header */}
      <div
        className={`px-3 py-2 flex items-center justify-between border-b border-amber-700/40`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{seasonIcon}</span>
          <div>
            <span className={`text-sm font-bold capitalize ${seasonColor.split(' ')[0]}`}>
              {season}
            </span>
            <span className="text-amber-600 text-xs ml-2">Season</span>
          </div>
        </div>
        {compact && (
          <button
            onClick={() => setExpanded(false)}
            className="text-amber-600 hover:text-amber-300 text-xs"
          >
            ▲ hide
          </button>
        )}
      </div>

      {/* Active market event banner */}
      {activeEvent && (
        <div className="px-3 py-2 bg-yellow-900/30 border-b border-yellow-700/40 flex items-start gap-2">
          <span className="text-yellow-400 text-sm flex-shrink-0">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-yellow-300 text-xs font-bold">{activeEvent.name}</p>
            <p className="text-yellow-500 text-[10px] leading-tight">{activeEvent.description}</p>
          </div>
        </div>
      )}

      {/* Price table */}
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-amber-600 text-[10px] uppercase tracking-wide mb-2">
          Market Prices
        </p>

        {/* Livestock */}
        <PriceRow
          label="Livestock"
          emoji="🐄"
          multiplier={livestockMult}
          baseNote={`Base: ${SEASONAL_PRICES.livestock[season]}x`}
          eventMod={activeEvent?.priceModifiers.livestock}
        />

        {/* Products */}
        <PriceRow
          label="Products"
          emoji="🥛"
          multiplier={productsMult}
          baseNote={`Base: ${SEASONAL_PRICES.products[season]}x`}
          eventMod={activeEvent?.priceModifiers.products}
        />

        {/* Feed */}
        <PriceRow
          label="Feed"
          emoji="🌾"
          multiplier={feedMult}
          baseNote={`Base: ${SEASONAL_PRICES.feed[season]}x`}
          eventMod={activeEvent?.priceModifiers.feed}
        />
      </div>

      {/* Seasonal advice */}
      <div className="px-3 pb-2">
        <p className="text-amber-500 text-[10px] italic leading-tight">{advice}</p>
      </div>

      {/* Crop status (ranch only) */}
      {showCrops && ranch.isRanchUnlocked() && (cropPlots.length > 0) && (
        <div className="border-t border-amber-700/40 px-3 py-2 space-y-1">
          <p className="text-amber-600 text-[10px] uppercase tracking-wide mb-1.5">
            Ranch Crops
          </p>

          {readyCrops.length > 0 && (
            <div className="flex items-center gap-2 bg-green-900/30 rounded px-2 py-1">
              <span className="text-green-400 text-sm">✅</span>
              <div>
                <p className="text-green-300 text-xs font-bold">
                  {readyCrops.length} plot{readyCrops.length !== 1 ? 's' : ''} ready to harvest!
                </p>
                <p className="text-green-500 text-[10px]">
                  {readyCrops
                    .map(p => CROPS[p.cropType as CropType]?.emoji ?? '')
                    .join(' ')}
                </p>
              </div>
            </div>
          )}

          {growingCrops.length > 0 && (
            <div className="space-y-1">
              {growingCrops.slice(0, 3).map((plot, i) => {
                const cfg = CROPS[plot.cropType as CropType]
                const daysLeft = Math.max(0, plot.harvestDay - gameDay)
                const progress = Math.min(
                  100,
                  Math.round(
                    ((plot.harvestDay - plot.plantedDay - daysLeft) /
                      (plot.harvestDay - plot.plantedDay)) *
                      100
                  )
                )
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span>{cfg?.emoji ?? '🌱'}</span>
                    <span className="text-amber-400 w-16 truncate">{cfg?.name ?? plot.cropType}</span>
                    <div className="flex-1 h-1.5 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-amber-500 flex-shrink-0">{daysLeft}d</span>
                  </div>
                )
              })}
              {growingCrops.length > 3 && (
                <p className="text-amber-600 text-[10px]">
                  +{growingCrops.length - 3} more growing
                </p>
              )}
            </div>
          )}

          {cropPlots.length === 0 && (
            <p className="text-amber-600 text-[10px] italic">No crops planted this season.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PRICE ROW SUB-COMPONENT
// ============================================================================

interface PriceRowProps {
  label: string
  emoji: string
  multiplier: number
  baseNote: string
  eventMod?: number
}

function PriceRow({ label, emoji, multiplier, baseNote, eventMod }: PriceRowProps) {
  const { symbol, color } = trendArrow(multiplier)

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-base w-6 flex-shrink-0 text-center">{emoji}</span>
      <span className="text-amber-300 w-16 flex-shrink-0">{label}</span>

      {/* Trend arrow */}
      <span className={`font-bold w-5 text-center ${color}`}>{symbol}</span>

      {/* Modifier badge */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          multiplier > 1.0
            ? 'bg-red-900/40 text-red-300'
            : multiplier < 1.0
            ? 'bg-green-900/40 text-green-300'
            : 'bg-gray-800 text-gray-400'
        }`}
      >
        {formatMult(multiplier)}
      </span>

      {/* Base note */}
      <span className="text-amber-700 text-[10px] ml-auto">{baseNote}</span>

      {/* Event modifier indicator */}
      {eventMod !== undefined && eventMod !== 1.0 && (
        <span
          className={`text-[10px] ${eventMod > 1 ? 'text-yellow-400' : 'text-cyan-400'}`}
          title="Market event modifier"
        >
          (event:{eventMod}x)
        </span>
      )}
    </div>
  )
}

export default SeasonalMarketOverlay
