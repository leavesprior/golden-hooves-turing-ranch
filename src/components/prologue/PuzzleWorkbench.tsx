'use client'

import React, { useState } from 'react'

export interface PuzzleObject {
  id: string
  name: string
  description: string
  icon: string
  stateFlags: Record<string, boolean>
}

interface PuzzleWorkbenchProps {
  inventory: PuzzleObject[]
  onTransform: (objectId: string, action: string) => boolean
  onCombine: (objectId1: string, objectId2: string) => boolean
  availableActions: string[]
}

const STATE_ICONS: Record<string, string> = {
  wet: '\uD83D\uDCA7',
  heated: '\uD83D\uDD25',
  inscribed: '\u270D\uFE0F',
  broken: '\uD83D\uDCA5',
  combined: '\uD83D\uDD17',
  glowing: '\u2728',
  frozen: '\u2744\uFE0F',
  enchanted: '\uD83C\uDF1F',
}

export function PuzzleWorkbench({ inventory, onTransform, onCombine, availableActions }: PuzzleWorkbenchProps) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [combineMode, setCombineMode] = useState(false)
  const [combineTarget, setCombineTarget] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleAction = (action: string) => {
    if (!selectedObject) return
    const success = onTransform(selectedObject, action)
    setFeedback(success
      ? `Applied "${action}" to the object. Something changed...`
      : `Nothing happens. Perhaps a different approach?`
    )
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleCombine = (targetId: string) => {
    if (!selectedObject || selectedObject === targetId) return
    const success = onCombine(selectedObject, targetId)
    setFeedback(success
      ? 'The objects combine into something new!'
      : 'These objects don\'t seem to fit together.'
    )
    setCombineMode(false)
    setCombineTarget(null)
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <div className="bg-black/30 border-2 border-purple-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-purple-200 text-xs">Puzzle Workbench</h3>
        <span className="text-purple-500 text-[9px]">{inventory.length} objects</span>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-3 p-2 bg-purple-900/40 border border-purple-700/50 rounded text-purple-300 text-[9px]">
          {feedback}
        </div>
      )}

      {/* Inventory grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {inventory.map(obj => {
          const isSelected = selectedObject === obj.id
          const activeStates = Object.entries(obj.stateFlags).filter(([, v]) => v)

          return (
            <button
              key={obj.id}
              onClick={() => {
                if (combineMode && selectedObject && selectedObject !== obj.id) {
                  handleCombine(obj.id)
                } else {
                  setSelectedObject(isSelected ? null : obj.id)
                }
              }}
              className={`p-3 rounded border text-center transition-all ${
                isSelected
                  ? 'border-purple-400 bg-purple-800/40 scale-105'
                  : combineMode && selectedObject !== obj.id
                    ? 'border-amber-600/50 bg-amber-900/20 hover:border-amber-400'
                    : 'border-purple-700/50 bg-purple-900/20 hover:border-purple-600'
              }`}
            >
              <div className="text-2xl mb-1">{obj.icon}</div>
              <div className="font-pixel text-[8px] text-purple-300 truncate">{obj.name}</div>
              {activeStates.length > 0 && (
                <div className="flex gap-0.5 justify-center mt-1">
                  {activeStates.map(([key]) => (
                    <span key={key} className="text-[10px]" title={key}>
                      {STATE_ICONS[key] || '\u25CF'}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}

        {inventory.length === 0 && (
          <div className="col-span-4 text-center py-6 text-purple-600 text-xs">
            No objects in inventory. Explore to find items.
          </div>
        )}
      </div>

      {/* Selected object detail */}
      {selectedObject && (
        <div className="bg-purple-900/20 border border-purple-700/30 rounded p-3 mb-3">
          {(() => {
            const obj = inventory.find(o => o.id === selectedObject)
            if (!obj) return null
            const activeStates = Object.entries(obj.stateFlags).filter(([, v]) => v)
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{obj.icon}</span>
                  <div>
                    <p className="font-pixel text-purple-200 text-[10px]">{obj.name}</p>
                    <p className="text-purple-400 text-[8px]">{obj.description}</p>
                  </div>
                </div>
                {activeStates.length > 0 && (
                  <div className="flex gap-2 text-[8px] text-purple-400">
                    {activeStates.map(([key]) => (
                      <span key={key} className="bg-purple-800/40 px-1.5 py-0.5 rounded">
                        {STATE_ICONS[key] || ''} {key}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Actions */}
      {selectedObject && (
        <div className="flex flex-wrap gap-2">
          {availableActions.map(action => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="font-pixel text-[9px] text-purple-200 bg-purple-800/60 border border-purple-600 px-3 py-1.5 rounded hover:bg-purple-700/60"
            >
              {action}
            </button>
          ))}
          <button
            onClick={() => setCombineMode(!combineMode)}
            className={`font-pixel text-[9px] px-3 py-1.5 rounded border ${
              combineMode
                ? 'text-amber-200 bg-amber-800/60 border-amber-500'
                : 'text-purple-200 bg-purple-800/60 border-purple-600 hover:bg-purple-700/60'
            }`}
          >
            {combineMode ? 'Select target...' : '\uD83D\uDD17 Combine'}
          </button>
        </div>
      )}
    </div>
  )
}
