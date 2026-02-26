'use client'

import React from 'react'
import { useSettlement } from '../settlementContext'
import {
  PropertyTier,
  PROPERTY_TIERS,
  BUILDINGS,
  WAGONS,
  RIFLES,
  SADDLES,
  BuildingType,
} from '../data/settlementConfig'
import { SETTLEMENT_BUILDINGS, getSettlementArt } from '../data/asciiArt'

interface SettlementViewProps {
  compact?: boolean
}

export function SettlementView({ compact = false }: SettlementViewProps) {
  const { state, getPropertyTierConfig } = useSettlement()

  const tierConfig = getPropertyTierConfig()

  // Get building positions for visual layout
  const getBuildingPosition = (type: BuildingType, index: number) => {
    const positions: Record<BuildingType, { x: number; y: number }> = {
      cabin: { x: 30, y: 45 },
      house: { x: 25, y: 40 },
      barn: { x: 65, y: 50 },
      workshop: { x: 75, y: 35 },
      storehouse: { x: 15, y: 60 },
    }
    return positions[type] || { x: 50, y: 50 }
  }

  // Fence visual based on tier
  const getFenceStyle = (tier: PropertyTier) => {
    const styles: Record<PropertyTier, { border: string; bg: string }> = {
      0: { border: 'border-transparent', bg: 'bg-transparent' },
      1: { border: 'border-gray-500 border-dashed', bg: 'bg-green-950/30' },
      2: { border: 'border-amber-700', bg: 'bg-green-900/40' },
      3: { border: 'border-amber-600 border-2', bg: 'bg-green-900/50' },
      4: { border: 'border-stone-500 border-2', bg: 'bg-green-800/50' },
      5: { border: 'border-yellow-500 border-4', bg: 'bg-green-800/60' },
    }
    return styles[tier]
  }

  const fenceStyle = getFenceStyle(state.propertyTier)

  if (compact) {
    return (
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-amber-400 text-sm font-pixel">{tierConfig.name}</span>
          <span className="text-amber-200 text-xs">Tier {state.propertyTier}/5</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {state.buildings.map((building, idx) => (
            <span key={idx} className="text-lg" title={BUILDINGS[building].name}>
              {BUILDINGS[building].emoji}
            </span>
          ))}
          {state.horses > 0 && (
            <span className="text-lg" title={`${state.horses} horse(s)`}>
              {'🐴'.repeat(state.horses)}
            </span>
          )}
          {state.wagon && (
            <span className="text-lg" title={WAGONS[state.wagon].name}>
              {WAGONS[state.wagon].emoji}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Property Title Badge */}
      <div className="absolute top-2 left-2 z-10 bg-gray-900/90 px-3 py-1 rounded border border-amber-600">
        <span className="text-amber-400 font-pixel text-sm">{tierConfig.name}</span>
        {state.propertyTier > 0 && (
          <span className="text-amber-200 text-xs ml-2">Tier {state.propertyTier}</span>
        )}
      </div>

      {/* Main Property View */}
      <div
        className={`relative w-full h-64 rounded-lg overflow-hidden ${fenceStyle.border} ${fenceStyle.bg}`}
        style={{
          background: `linear-gradient(to bottom,
            rgba(34, 197, 94, 0.1) 0%,
            rgba(22, 163, 74, 0.2) 50%,
            rgba(21, 128, 61, 0.3) 100%),
            url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23166534' fill-opacity='0.2'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Sky gradient at top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-900/30 to-transparent" />

        {/* Sun/Moon */}
        <div className="absolute top-4 right-8 w-8 h-8 bg-yellow-300 rounded-full blur-sm opacity-60" />

        {/* Mountains in background */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-32 opacity-30"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <polygon fill="#374151" points="0,100 50,40 100,80 150,30 200,70 250,20 300,60 350,40 400,100" />
        </svg>

        {/* Buildings */}
        {state.buildings.map((building, idx) => {
          const pos = getBuildingPosition(building, idx)
          const config = BUILDINGS[building]
          return (
            <div
              key={`${building}-${idx}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-4xl hover:scale-110 transition-transform cursor-pointer animate-slide-in-up"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={config.name}
            >
              {config.emoji}
            </div>
          )
        })}

        {/* Buildings under construction */}
        {state.buildingsInProgress.map((building, idx) => {
          const pos = getBuildingPosition(building.type, idx + state.buildings.length)
          const config = BUILDINGS[building.type]
          return (
            <div
              key={`progress-${building.type}-${idx}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl opacity-50 animate-pulse"
              style={{ left: `${pos.x + 10}%`, top: `${pos.y}%` }}
              title={`${config.name} (${building.daysRemaining} days remaining)`}
            >
              {config.emoji}
              <span className="absolute -top-2 -right-2 text-xs bg-amber-600 px-1 rounded">
                {building.daysRemaining}d
              </span>
            </div>
          )
        })}

        {/* Horses in pasture */}
        {state.horses > 0 && (
          <div
            className="absolute text-3xl flex gap-1"
            style={{ left: '70%', top: '70%' }}
          >
            {Array.from({ length: state.horses }).map((_, idx) => (
              <span
                key={idx}
                className="hover:scale-110 transition-transform cursor-pointer"
                style={{ transform: `translateX(${idx * -10}px)` }}
                title="Draft Horse"
              >
                🐴
              </span>
            ))}
          </div>
        )}

        {/* Wagon near barn */}
        {state.wagon && (
          <div
            className="absolute text-3xl hover:scale-110 transition-transform cursor-pointer"
            style={{ left: '55%', top: '65%' }}
            title={WAGONS[state.wagon].name}
          >
            {WAGONS[state.wagon].emoji}
          </div>
        )}

        {/* Mining claims indicator */}
        {state.miningClaims > 0 && (
          <div
            className="absolute text-2xl flex gap-1"
            style={{ left: '10%', top: '80%' }}
            title={`${state.miningClaims} Mining Claim(s)`}
          >
            {'⛏️'.repeat(state.miningClaims)}
          </div>
        )}

        {/* Farm acres indicator */}
        {state.farmAcres > 0 && (
          <div
            className="absolute text-2xl"
            style={{ left: '85%', top: '80%' }}
            title={`${state.farmAcres} Farm Acres`}
          >
            🌾
            <span className="text-xs text-amber-300">{state.farmAcres}ac</span>
          </div>
        )}

        {/* No property placeholder */}
        {state.propertyTier === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🏕️</div>
              <p className="text-gray-400 text-sm">No property yet</p>
              <p className="text-gray-500 text-xs">Visit the Land Office to stake a claim</p>
            </div>
          </div>
        )}

        {/* ASCII Art overlay for settlement tier */}
        {state.propertyTier > 0 && (
          <div className="absolute bottom-1 left-1 opacity-20 pointer-events-none">
            <pre className="text-amber-400 text-[6px] leading-[7px] font-mono">
              {getSettlementArt(state.propertyTier).art}
            </pre>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400 text-[10px] block">Days Here</span>
          <span className="text-amber-200 font-pixel text-sm">{state.daysInSettlement}</span>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400 text-[10px] block">Reputation</span>
          <span className="text-amber-200 font-pixel text-sm">{state.reputation}</span>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400 text-[10px] block">Buildings</span>
          <span className="text-amber-200 font-pixel text-sm">{state.buildings.length}</span>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400 text-[10px] block">Gold Mined</span>
          <span className="text-amber-200 font-pixel text-sm">{state.goldMined}🌮</span>
        </div>
      </div>
    </div>
  )
}

export default SettlementView
