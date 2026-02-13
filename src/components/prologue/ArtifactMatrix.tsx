'use client'

import React from 'react'

export type TraitCategory = 'material' | 'origin_culture' | 'age_period' | 'purpose' | 'symbol_family' | 'provenance'

export interface ArtifactTraits {
  material: string | null
  origin_culture: string | null
  age_period: string | null
  purpose: string | null
  symbol_family: string | null
  provenance: string | null
}

interface ArtifactMatrixProps {
  traits: ArtifactTraits
  revealedTraits: Set<TraitCategory>
  possibleValues?: Partial<Record<TraitCategory, string[]>>  // Narrowed possibilities
  onIdentify?: () => void
  canIdentify: boolean
}

const TRAIT_LABELS: Record<TraitCategory, { label: string; icon: string }> = {
  material: { label: 'Material', icon: '\uD83E\uDEA8' },
  origin_culture: { label: 'Origin', icon: '\uD83C\uDFDB\uFE0F' },
  age_period: { label: 'Age', icon: '\u23F3' },
  purpose: { label: 'Purpose', icon: '\uD83C\uDFAF' },
  symbol_family: { label: 'Symbol', icon: '\uD83D\uDD3B' },
  provenance: { label: 'Provenance', icon: '\uD83D\uDDFA\uFE0F' },
}

const TRAIT_CATEGORIES: TraitCategory[] = ['material', 'origin_culture', 'age_period', 'purpose', 'symbol_family', 'provenance']

export function ArtifactMatrix({ traits, revealedTraits, possibleValues, onIdentify, canIdentify }: ArtifactMatrixProps) {
  const revealedCount = revealedTraits.size
  const totalTraits = TRAIT_CATEGORIES.length

  return (
    <div className="bg-black/30 border-2 border-purple-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-purple-200 text-xs">Artifact Analysis</h3>
        <span className="text-purple-500 text-[9px]">{revealedCount}/{totalTraits} traits identified</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-purple-900/60 rounded-full h-1.5 mb-4">
        <div
          className="bg-purple-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(revealedCount / totalTraits) * 100}%` }}
        />
      </div>

      {/* Trait grid */}
      <div className="grid grid-cols-2 gap-3">
        {TRAIT_CATEGORIES.map(category => {
          const info = TRAIT_LABELS[category]
          const isRevealed = revealedTraits.has(category)
          const value = traits[category]
          const possibles = possibleValues?.[category]

          return (
            <div
              key={category}
              className={`p-3 rounded border transition-all ${
                isRevealed
                  ? 'bg-purple-900/40 border-purple-600'
                  : 'bg-gray-900/30 border-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{info.icon}</span>
                <span className={`font-pixel text-[9px] ${isRevealed ? 'text-purple-300' : 'text-gray-500'}`}>
                  {info.label}
                </span>
              </div>
              {isRevealed && value ? (
                <p className="text-purple-200 text-[10px] font-pixel">
                  {value.replace(/_/g, ' ')}
                </p>
              ) : possibles && possibles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {possibles.map(p => (
                    <span key={p} className="text-[8px] text-gray-400 bg-gray-800/60 px-1 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-[9px]">???</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Identify button */}
      {revealedCount >= 3 && (
        <button
          onClick={onIdentify}
          disabled={!canIdentify}
          className={`w-full mt-4 font-pixel text-[10px] px-4 py-3 rounded border-2 transition-all ${
            canIdentify
              ? 'text-amber-200 bg-amber-800/60 border-amber-600 hover:bg-amber-700/60'
              : 'text-gray-500 bg-gray-800/40 border-gray-700 cursor-not-allowed'
          }`}
        >
          {canIdentify
            ? `\uD83D\uDCDC COMMIT IDENTIFICATION (${revealedCount}/${totalTraits} traits known)`
            : 'Gather more evidence before identifying'}
        </button>
      )}
    </div>
  )
}
