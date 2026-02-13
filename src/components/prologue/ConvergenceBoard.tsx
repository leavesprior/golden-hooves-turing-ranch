'use client'

import React from 'react'

interface EvidenceCard {
  id: string
  characterSource: string
  title: string
  description: string
  serpentConnection: string
  verified: boolean
}

interface ConvergenceBoardProps {
  evidence: EvidenceCard[]
  requiredEvidence: number
  onPresent: (evidenceIds: string[]) => void
}

const CHARACTER_STYLES: Record<string, { color: string; icon: string }> = {
  norseman: { color: 'border-blue-600 bg-blue-900/30', icon: '\u2693' },
  native: { color: 'border-emerald-600 bg-emerald-900/30', icon: '\uD83C\uDF3F' },
  califia: { color: 'border-amber-600 bg-amber-900/30', icon: '\uD83D\uDDE1\uFE0F' },
  incan: { color: 'border-purple-600 bg-purple-900/30', icon: '\uD83D\uDD2E' },
}

export function ConvergenceBoard({ evidence, requiredEvidence, onPresent }: ConvergenceBoardProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const toggleEvidence = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canPresent = selected.size >= requiredEvidence

  return (
    <div className="bg-black/30 border-2 border-amber-800 rounded-lg p-4">
      <div className="text-center mb-4">
        <h3 className="font-pixel text-amber-200 text-sm">Evidence Board</h3>
        <p className="text-amber-400 text-[9px] mt-1">
          Select {requiredEvidence}+ pieces of evidence to present to the Aztec priests.
        </p>
        <p className="text-amber-500 text-[8px] mt-1">
          Prove that Cortez is mortal, not Quetzalcoatl returned.
        </p>
      </div>

      {/* Evidence cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {evidence.map(card => {
          const style = CHARACTER_STYLES[card.characterSource] || { color: 'border-gray-600 bg-gray-900/30', icon: '?' }
          const isSelected = selected.has(card.id)

          return (
            <button
              key={card.id}
              onClick={() => toggleEvidence(card.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${style.color} ${
                isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{style.icon}</span>
                <div className="flex-1">
                  <p className="font-pixel text-amber-200 text-[10px]">{card.title}</p>
                  <p className="text-amber-400/70 text-[9px] mt-1">{card.description}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[8px]">{'\uD83D\uDC0D'}</span>
                    <span className="text-red-400/70 text-[8px]">{card.serpentConnection}</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isSelected ? 'border-amber-400 bg-amber-600' : 'border-gray-600'
                }`}>
                  {isSelected && <span className="text-[8px] text-white">{'\u2713'}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Present evidence */}
      <div className="text-center">
        <button
          onClick={() => canPresent && onPresent(Array.from(selected))}
          disabled={!canPresent}
          className={`font-pixel text-sm px-8 py-3 rounded border-2 transition-all ${
            canPresent
              ? 'text-amber-100 bg-amber-700 border-amber-500 hover:bg-amber-600'
              : 'text-gray-500 bg-gray-800 border-gray-700 cursor-not-allowed'
          }`}
        >
          PRESENT EVIDENCE ({selected.size}/{requiredEvidence} minimum)
        </button>
      </div>
    </div>
  )
}
