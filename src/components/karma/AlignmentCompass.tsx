'use client'

import React from 'react'
import { useKarma, ALIGNMENT_DISPLAY_NAMES, KARMA_MULTIPLIERS, AlignmentPosition } from '@/lib/karmaContext'

// Grid positions for the 9 alignments
const ALIGNMENT_GRID: AlignmentPosition[][] = [
  ['lawful_good', 'neutral_good', 'chaotic_good'],
  ['lawful_neutral', 'true_neutral', 'chaotic_neutral'],
  ['lawful_evil', 'neutral_evil', 'chaotic_evil'],
]

// Short labels for grid cells
const ALIGNMENT_SHORT: Record<AlignmentPosition, string> = {
  lawful_good: 'LG',
  neutral_good: 'NG',
  chaotic_good: 'CG',
  lawful_neutral: 'LN',
  true_neutral: 'TN',
  chaotic_neutral: 'CN',
  lawful_evil: 'LE',
  neutral_evil: 'NE',
  chaotic_evil: 'CE',
}

// Colors for each alignment
const ALIGNMENT_COLORS: Record<AlignmentPosition, { bg: string; border: string; glow: string }> = {
  lawful_good: { bg: 'bg-yellow-100', border: 'border-yellow-400', glow: 'shadow-yellow-400/50' },
  neutral_good: { bg: 'bg-green-100', border: 'border-green-400', glow: 'shadow-green-400/50' },
  chaotic_good: { bg: 'bg-cyan-100', border: 'border-cyan-400', glow: 'shadow-cyan-400/50' },
  lawful_neutral: { bg: 'bg-blue-100', border: 'border-blue-400', glow: 'shadow-blue-400/50' },
  true_neutral: { bg: 'bg-gray-100', border: 'border-gray-400', glow: 'shadow-gray-400/50' },
  chaotic_neutral: { bg: 'bg-purple-100', border: 'border-purple-400', glow: 'shadow-purple-400/50' },
  lawful_evil: { bg: 'bg-orange-100', border: 'border-orange-400', glow: 'shadow-orange-400/50' },
  neutral_evil: { bg: 'bg-red-100', border: 'border-red-400', glow: 'shadow-red-400/50' },
  chaotic_evil: { bg: 'bg-red-200', border: 'border-red-600', glow: 'shadow-red-600/50' },
}

interface AlignmentCompassProps {
  size?: 'sm' | 'md' | 'lg'
  showMultiplier?: boolean
  showLabels?: boolean
}

export function AlignmentCompass({
  size = 'md',
  showMultiplier = true,
  showLabels = true,
}: AlignmentCompassProps) {
  const { karma, alignmentPosition, discountMultiplier } = useKarma()

  // Calculate dot position within the grid (0-100 on each axis)
  const dotX = ((karma.alignment.lawfulChaotic + 100) / 200) * 100
  const dotY = ((karma.alignment.goodEvil + 100) / 200) * 100

  // Size classes
  const sizeClasses = {
    sm: { grid: 'w-24 h-24', cell: 'w-8 h-8 text-[6px]', dot: 'w-2 h-2' },
    md: { grid: 'w-36 h-36', cell: 'w-12 h-12 text-[8px]', dot: 'w-3 h-3' },
    lg: { grid: 'w-48 h-48', cell: 'w-16 h-16 text-xs', dot: 'w-4 h-4' },
  }

  const classes = sizeClasses[size]
  const currentColor = ALIGNMENT_COLORS[alignmentPosition]

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Axis labels */}
      {showLabels && (
        <div className="text-[8px] text-amber-200 uppercase tracking-wider">Good</div>
      )}

      <div className="flex items-center gap-1">
        {showLabels && (
          <div className="text-[8px] text-amber-200 uppercase tracking-wider writing-mode-vertical">
            Lawful
          </div>
        )}

        {/* Main compass grid */}
        <div className={`${classes.grid} relative`}>
          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-0.5 w-full h-full">
            {ALIGNMENT_GRID.flat().map((position) => {
              const isActive = position === alignmentPosition
              const colors = ALIGNMENT_COLORS[position]
              return (
                <div
                  key={position}
                  className={`
                    ${classes.cell}
                    ${colors.bg}
                    ${isActive ? `${colors.border} border-2 ${colors.glow} shadow-lg` : 'border border-gray-300'}
                    flex items-center justify-center
                    font-pixel
                    transition-all duration-300
                    ${isActive ? 'scale-105' : 'opacity-60'}
                  `}
                >
                  {ALIGNMENT_SHORT[position]}
                </div>
              )
            })}
          </div>

          {/* Position dot (exact alignment) */}
          <div
            className={`
              ${classes.dot}
              absolute
              bg-amber-500
              rounded-full
              border-2 border-amber-300
              shadow-lg shadow-amber-500/50
              transform -translate-x-1/2 -translate-y-1/2
              transition-all duration-500 ease-out
              z-10
            `}
            style={{
              left: `${dotX}%`,
              top: `${dotY}%`,
            }}
          />
        </div>

        {showLabels && (
          <div className="text-[8px] text-amber-200 uppercase tracking-wider writing-mode-vertical">
            Chaotic
          </div>
        )}
      </div>

      {showLabels && (
        <div className="text-[8px] text-amber-200 uppercase tracking-wider">Evil</div>
      )}

      {/* Current alignment display */}
      <div className="text-center mt-2">
        <div className={`
          font-pixel text-sm
          ${currentColor.bg.replace('bg-', 'text-').replace('-100', '-700').replace('-200', '-800')}
        `}>
          {ALIGNMENT_DISPLAY_NAMES[alignmentPosition]}
        </div>
        {showMultiplier && (
          <div className="text-[10px] text-amber-300 mt-1">
            Discount: {discountMultiplier}x
          </div>
        )}
      </div>
    </div>
  )
}

export default AlignmentCompass
