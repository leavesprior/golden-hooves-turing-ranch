'use client'

import React, { useState, useEffect } from 'react'

export type WitnessType = 'elder' | 'skald' | 'medicine_person' | 'priestess' | 'quipucamayoc' | 'trader' | 'warrior' | 'shaman'

interface Witness {
  type: WitnessType
  name: string
  culture: string
  icon: string
  reliability: number  // 0-1
  clueQuality: 'low' | 'medium' | 'high'
}

interface DialogueOption {
  id: string
  text: string
  statRequired?: { stat: string; value: number }
  karmaEffect?: { lawful: number; good: number }
}

interface CulturalInteractionProps {
  witness: Witness
  dialogueOptions: DialogueOption[]
  onChoose: (optionId: string) => void
  responseText?: string
  isComplete: boolean
}

const WITNESS_ICONS: Record<WitnessType, string> = {
  elder: '\uD83D\uDC74',
  skald: '\uD83C\uDFB6',
  medicine_person: '\uD83C\uDF3F',
  priestess: '\uD83D\uDD2E',
  quipucamayoc: '\uD83E\uDDF5',
  trader: '\uD83D\uDCE6',
  warrior: '\u2694\uFE0F',
  shaman: '\uD83C\uDF19',
}

export function CulturalInteraction({
  witness,
  dialogueOptions,
  onChoose,
  responseText,
  isComplete,
}: CulturalInteractionProps) {
  const [usedOptions, setUsedOptions] = useState<Set<string>>(new Set())
  const [pendingOption, setPendingOption] = useState<string | null>(null)

  // Re-enable options after response arrives
  useEffect(() => {
    if (responseText && pendingOption) {
      setPendingOption(null)
    }
  }, [responseText, pendingOption])

  const handleChoose = (optionId: string) => {
    setPendingOption(optionId)
    setUsedOptions(prev => new Set(prev).add(optionId))
    onChoose(optionId)
  }

  return (
    <div className="bg-black/40 border-2 border-purple-800 rounded-lg overflow-hidden">
      {/* Witness header */}
      <div className="p-4 bg-purple-900/30 border-b border-purple-700/50 flex items-start gap-3">
        <div className="w-12 h-12 bg-purple-800/60 border-2 border-purple-600 rounded flex items-center justify-center">
          <span className="text-2xl">{WITNESS_ICONS[witness.type] || witness.icon}</span>
        </div>
        <div>
          <h3 className="font-pixel text-purple-200 text-xs">{witness.name}</h3>
          <p className="text-purple-500 text-[9px]">
            {witness.type.replace(/_/g, ' ')} {'\u2022'} {witness.culture}
          </p>
          <div className="flex gap-2 mt-1 text-[8px]">
            <span className="text-purple-400">
              Reliability: {Math.round(witness.reliability * 100)}%
            </span>
            <span className="text-purple-400">
              Clue quality: {witness.clueQuality}
            </span>
          </div>
        </div>
      </div>

      {/* Response text */}
      {responseText && (
        <div className="p-4 border-b border-purple-800/30">
          <p className="text-purple-200/80 text-xs leading-relaxed italic">
            "{responseText}"
          </p>
        </div>
      )}

      {/* Dialogue options */}
      {!isComplete && (
        <div className="p-4 space-y-2">
          {dialogueOptions.map(option => (
            <button
              key={option.id}
              onClick={() => handleChoose(option.id)}
              disabled={usedOptions.has(option.id) || pendingOption !== null}
              className={`w-full text-left p-3 rounded border transition-all ${
                usedOptions.has(option.id)
                  ? 'border-gray-700 bg-gray-900/20 opacity-40'
                  : pendingOption !== null
                    ? 'border-gray-700 bg-gray-900/20 opacity-40'
                    : 'border-purple-700/50 bg-purple-900/20 hover:border-purple-500 hover:bg-purple-900/30'
              }`}
            >
              <p className="text-purple-200 text-[10px]">{option.text}</p>
              {option.statRequired && (
                <p className="text-purple-500 text-[8px] mt-1">
                  Requires {option.statRequired.stat} {option.statRequired.value}+
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {isComplete && (
        <div className="p-3 text-center text-purple-500 text-[9px]">
          Conversation complete.
        </div>
      )}
    </div>
  )
}
