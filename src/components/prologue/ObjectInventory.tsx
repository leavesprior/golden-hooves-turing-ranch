'use client'

import React from 'react'
import type { PuzzleObject } from './PuzzleWorkbench'

interface ObjectInventoryProps {
  objects: PuzzleObject[]
  selectedId: string | null
  onSelect: (id: string) => void
  compact?: boolean
}

export function ObjectInventory({ objects, selectedId, onSelect, compact = false }: ObjectInventoryProps) {
  if (compact) {
    return (
      <div className="flex gap-1 flex-wrap">
        {objects.map(obj => (
          <button
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={`p-1.5 rounded border transition-all ${
              selectedId === obj.id
                ? 'border-purple-400 bg-purple-800/40'
                : 'border-purple-700/30 bg-purple-900/10 hover:border-purple-600'
            }`}
            title={obj.name}
          >
            <span className="text-lg">{obj.icon}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {objects.map(obj => {
        const activeStates = Object.entries(obj.stateFlags).filter(([, v]) => v)
        return (
          <button
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-all ${
              selectedId === obj.id
                ? 'border-purple-400 bg-purple-800/30'
                : 'border-transparent hover:bg-purple-900/20'
            }`}
          >
            <span className="text-lg">{obj.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-purple-200 text-[9px] truncate">{obj.name}</p>
              {activeStates.length > 0 && (
                <p className="text-purple-500 text-[8px] truncate">
                  {activeStates.map(([k]) => k).join(', ')}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
