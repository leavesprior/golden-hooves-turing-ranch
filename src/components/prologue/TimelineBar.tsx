'use client'

import React from 'react'

interface TimelineEvent {
  id: string
  year: number
  label: string
  characterId: string
  completed: boolean
  active: boolean
}

interface TimelineBarProps {
  events: TimelineEvent[]
  currentYear: number
}

const CHARACTER_COLORS: Record<string, string> = {
  norseman: 'bg-blue-500',
  native: 'bg-emerald-500',
  califia: 'bg-amber-500',
  incan: 'bg-purple-500',
  convergence: 'bg-red-500',
}

export function TimelineBar({ events, currentYear }: TimelineBarProps) {
  const minYear = 600
  const maxYear = 1500
  const range = maxYear - minYear

  const getPosition = (year: number) => ((year - minYear) / range) * 100

  return (
    <div className="relative bg-black/40 border border-purple-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-pixel text-purple-500 text-[8px]">{minYear} CE</span>
        <span className="font-pixel text-purple-300 text-[9px]">
          Current: ~{currentYear} CE
        </span>
        <span className="font-pixel text-purple-500 text-[8px]">{maxYear} CE</span>
      </div>

      {/* Timeline track */}
      <div className="relative h-6 bg-purple-900/40 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-purple-800/60 rounded-full"
          style={{ width: `${getPosition(currentYear)}%` }}
        />

        {/* Event markers */}
        {events.map(event => (
          <div
            key={event.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${getPosition(event.year)}%` }}
          >
            <div
              className={`w-3 h-3 rounded-full border-2 border-white/30 transition-all ${
                event.completed
                  ? CHARACTER_COLORS[event.characterId] || 'bg-gray-500'
                  : event.active
                    ? `${CHARACTER_COLORS[event.characterId] || 'bg-gray-500'} animate-pulse`
                    : 'bg-gray-700'
              }`}
              title={`${event.label} (${event.year} CE)`}
            />
          </div>
        ))}

        {/* Current position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${getPosition(currentYear)}%` }}
        >
          <div className="w-4 h-4 bg-amber-400 rounded-full border-2 border-amber-200 shadow-lg shadow-amber-500/50" />
        </div>
      </div>

      {/* Year labels */}
      <div className="flex justify-between mt-1 text-[7px] text-purple-600">
        {[700, 900, 1100, 1300, 1500].map(year => (
          <span key={year} style={{ position: 'relative', left: `${getPosition(year) - 50}%` }}>
            {year}
          </span>
        ))}
      </div>
    </div>
  )
}
