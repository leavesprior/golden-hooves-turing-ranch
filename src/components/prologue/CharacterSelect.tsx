'use client'

import React, { useState } from 'react'
import type { PrologueCharacterId } from '@/app/prologue/prologueContext'

interface CharacterSelectProps {
  characters: {
    id: PrologueCharacterId
    name: string
    era: string
    icon: string
    mechanic: string
    description: string
    unlocked: boolean
    completedEpisodes: number
    totalEpisodes: number
  }[]
  onSelect: (id: PrologueCharacterId) => void
  selectedId: PrologueCharacterId | null
}

export function CharacterSelect({ characters, onSelect, selectedId }: CharacterSelectProps) {
  const [hoveredId, setHoveredId] = useState<PrologueCharacterId | null>(null)

  return (
    <div className="grid grid-cols-2 gap-4">
      {characters.map(char => (
        <button
          key={char.id}
          onClick={() => char.unlocked && onSelect(char.id)}
          onMouseEnter={() => setHoveredId(char.id)}
          onMouseLeave={() => setHoveredId(null)}
          disabled={!char.unlocked}
          className={`
            relative p-5 border-3 rounded-lg text-left transition-all duration-300
            ${char.unlocked
              ? selectedId === char.id
                ? 'border-purple-400 bg-purple-900/40 scale-[1.02]'
                : 'border-purple-700 bg-purple-900/20 hover:border-purple-500 hover:scale-[1.01]'
              : 'border-gray-700 bg-gray-900/20 opacity-40 cursor-not-allowed'}
          `}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{char.unlocked ? char.icon : '\uD83D\uDD12'}</span>
            <div className="flex-1">
              <h3 className="font-pixel text-purple-200 text-xs">{char.name}</h3>
              <p className="text-purple-500 text-[9px] mt-0.5">{char.era}</p>
              {(hoveredId === char.id || selectedId === char.id) && char.unlocked && (
                <div className="mt-2 animate-fade-in">
                  <p className="text-purple-300/80 text-[9px]">{char.description}</p>
                  <span className="inline-block mt-1 text-[8px] bg-purple-800/60 text-purple-400 px-2 py-0.5 rounded">
                    {char.mechanic}
                  </span>
                </div>
              )}
              {char.unlocked && char.completedEpisodes > 0 && (
                <div className="mt-2 w-full bg-purple-900/60 rounded-full h-1">
                  <div
                    className="bg-purple-400 h-1 rounded-full transition-all"
                    style={{ width: `${(char.completedEpisodes / char.totalEpisodes) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
