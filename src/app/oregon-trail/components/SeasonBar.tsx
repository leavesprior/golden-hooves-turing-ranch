'use client'

import React from 'react'
import { type Season, SEASONS } from '../data/ranchConfig'

interface SeasonBarProps {
  season: Season
  daysRemaining: number
  day: number
}

export function SeasonBar({ season, daysRemaining, day }: SeasonBarProps) {
  const seasonConfig = SEASONS[season]
  const progress = ((90 - daysRemaining) / 90) * 100

  const seasonColors: Record<Season, { bg: string; text: string; icon: string }> = {
    spring: { bg: 'bg-green-600', text: 'text-green-400', icon: '🌸' },
    summer: { bg: 'bg-yellow-600', text: 'text-yellow-400', icon: '☀️' },
    autumn: { bg: 'bg-orange-600', text: 'text-orange-400', icon: '🍂' },
    winter: { bg: 'bg-blue-600', text: 'text-blue-400', icon: '❄️' },
  }

  const colors = seasonColors[season]

  return (
    <div className="flex items-center gap-3">
      {/* Season Icon */}
      <div className="text-xl">{colors.icon}</div>

      {/* Season Info */}
      <div className="text-right">
        <div className={`text-sm font-medium ${colors.text}`}>
          {seasonConfig.name}
        </div>
        <div className="text-xs text-gray-500">
          Day {day} • {daysRemaining} days left
        </div>
      </div>

      {/* Progress Ring */}
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-700"
          />
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${progress * 0.75} 75`}
            strokeLinecap="round"
            className={colors.text}
          />
        </svg>
      </div>
    </div>
  )
}

export default SeasonBar
