'use client'

import React from 'react'
import { type FenceTier, type LivestockType, LIVESTOCK_TYPES } from '../data/ranchConfig'

interface RanchViewProps {
  fenceTier: FenceTier
  livestock: Record<LivestockType, number>
  upgradeInProgress: boolean
}

export function RanchView({ fenceTier, livestock, upgradeInProgress }: RanchViewProps) {
  // Generate animal positions
  const getAnimalPositions = () => {
    const positions: Array<{ type: LivestockType; x: number; y: number; flip: boolean }> = []
    let seed = 12345

    // Simple seeded random for consistent positions
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }

    for (const [type, count] of Object.entries(livestock)) {
      for (let i = 0; i < Math.min(count, 20); i++) { // Max 20 visible per type
        positions.push({
          type: type as LivestockType,
          x: 10 + random() * 80, // 10-90%
          y: 30 + random() * 50, // 30-80%
          flip: random() > 0.5,
        })
      }
    }

    return positions
  }

  const animals = getAnimalPositions()

  // Fence styles based on tier
  const fenceStyles: Record<FenceTier, { color: string; pattern: string; width: string }> = {
    1: { color: 'border-gray-600', pattern: 'border-dashed', width: 'border-2' },
    2: { color: 'border-amber-800', pattern: 'border-solid', width: 'border-4' },
    3: { color: 'border-amber-700', pattern: 'border-solid', width: 'border-4' },
    4: { color: 'border-gray-500', pattern: 'border-solid', width: 'border-8' },
    5: { color: 'border-amber-500', pattern: 'border-double', width: 'border-8' },
  }

  const fenceStyle = fenceStyles[fenceTier]

  return (
    <div className="relative bg-gradient-to-b from-sky-900 to-emerald-900 rounded-lg overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-800 via-sky-700 to-transparent h-1/3" />

      {/* Sun/Moon based on time */}
      <div className="absolute top-4 right-8 w-8 h-8 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />

      {/* Mountains in background */}
      <div className="absolute bottom-1/3 left-0 right-0 flex justify-center gap-2">
        <div className="w-32 h-20 bg-gray-700 clip-triangle opacity-50" />
        <div className="w-40 h-24 bg-gray-600 clip-triangle opacity-50" />
        <div className="w-28 h-16 bg-gray-700 clip-triangle opacity-50" />
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-b from-emerald-800 to-emerald-900" />

      {/* Fence */}
      <div className={`relative m-4 h-64 ${fenceStyle.color} ${fenceStyle.pattern} ${fenceStyle.width} rounded-lg`}>
        {/* Fence posts */}
        {fenceTier >= 2 && (
          <div className="absolute inset-0 flex justify-around items-stretch pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 ${fenceTier >= 4 ? 'bg-gray-500' : 'bg-amber-800'} rounded-t`}
              />
            ))}
          </div>
        )}

        {/* Premium tier decorations */}
        {fenceTier === 5 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <span className="text-2xl">🏆</span>
          </div>
        )}

        {/* Animals */}
        <div className="relative w-full h-full overflow-hidden">
          {animals.map((animal, idx) => (
            <div
              key={`${animal.type}-${idx}`}
              className={`absolute text-2xl transition-all duration-500 ${animal.flip ? 'scale-x-[-1]' : ''}`}
              style={{
                left: `${animal.x}%`,
                top: `${animal.y}%`,
                animation: `bob-${idx % 3} 2s ease-in-out infinite`,
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              {LIVESTOCK_TYPES[animal.type].emoji}
            </div>
          ))}

          {/* Empty state */}
          {animals.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <span className="text-4xl">🌾</span>
                <p className="mt-2 text-sm">No livestock yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade in progress overlay */}
        {upgradeInProgress && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
            <div className="text-center">
              <span className="text-4xl animate-bounce">🔨</span>
              <p className="text-amber-400 mt-2">Upgrading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Barn */}
      <div className="absolute bottom-4 right-8 text-4xl">
        🏚️
      </div>

      {/* Tree decorations */}
      <div className="absolute bottom-4 left-8 text-3xl">🌲</div>
      <div className="absolute bottom-4 left-16 text-2xl">🌳</div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bob-0 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes bob-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes bob-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  )
}

export default RanchView
