'use client'

import React, { useState } from 'react'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { type OutlawTraits, TRAIT_DISPLAY_NAMES, TRAIT_VALUE_DISPLAY, OUTLAWS, findOutlawsByTraits } from '../data/outlaws'

interface ClueJournalProps {
  onClose: () => void
  onOpenDossier?: () => void
  onOpenTelegraph?: () => void
}

export function ClueJournal({ onClose, onOpenDossier, onOpenTelegraph }: ClueJournalProps) {
  const { state: mysteryState, getNarrowedDown } = useMystery()
  const [activeTab, setActiveTab] = useState<'clues' | 'evidence' | 'suspects'>('clues')

  const { possible, eliminated } = getNarrowedDown()
  const cluesByLocation = groupCluesByLocation(mysteryState.collectedClues)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 40L40 0H20L0 20V40zM40 40V20L20 40H40z\' fill=\'%23000\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")', backgroundColor: '#1a1612' }}
      >
        {/* Header - Leather journal style */}
        <div className="bg-amber-900/80 p-4 border-b-4 border-amber-950">
          <div className="flex justify-between items-center">
            <h2 className="text-amber-200 text-xl tracking-wide">Detective's Journal</h2>
            <button
              onClick={onClose}
              className="px-4 py-2.5 md:px-3 md:py-1 bg-amber-950 text-amber-300 rounded hover:bg-amber-800 active:bg-amber-700 text-base md:text-sm"
            >
              Close
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('clues')}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded-t text-base md:text-sm active:scale-[0.98] ${
                activeTab === 'clues'
                  ? 'bg-amber-200/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              Clues ({mysteryState.collectedClues.length})
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded-t text-base md:text-sm active:scale-[0.98] ${
                activeTab === 'evidence'
                  ? 'bg-amber-200/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              Evidence ({Object.keys(mysteryState.knownTraits).length})
            </button>
            <button
              onClick={() => setActiveTab('suspects')}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded-t text-base md:text-sm active:scale-[0.98] ${
                activeTab === 'suspects'
                  ? 'bg-amber-200/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              Suspects ({possible.length}/{OUTLAWS.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'clues' && (
            <div className="space-y-6">
              {mysteryState.collectedClues.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-amber-700 italic">No clues collected yet.</p>
                  <p className="text-amber-900 text-sm mt-2">
                    Investigate crime scenes and interview witnesses to gather evidence.
                  </p>
                </div>
              ) : (
                Object.entries(cluesByLocation).map(([location, clues]) => (
                  <div key={location} className="border-b border-amber-900/50 pb-4">
                    <h3 className="text-amber-400 text-sm mb-2 uppercase tracking-wider">{location}</h3>
                    <div className="space-y-2">
                      {clues.map(clue => (
                        <ClueEntry key={clue.id} clue={clue} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <p className="text-amber-600 text-sm">
                Evidence derived from collected clues. Use this to narrow down suspects.
              </p>

              {Object.keys(mysteryState.knownTraits).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-amber-700 italic">No evidence confirmed yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {(Object.entries(mysteryState.knownTraits) as Array<[keyof OutlawTraits, string]>).map(
                    ([trait, value]) => (
                      <div
                        key={trait}
                        className="p-3 bg-amber-950/50 border border-amber-800 rounded"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-amber-400">{TRAIT_DISPLAY_NAMES[trait]}</span>
                          <span className="text-amber-200 font-medium">
                            {TRAIT_VALUE_DISPLAY[value] || value}
                          </span>
                        </div>
                        <p className="text-amber-700 text-xs mt-1">
                          Matches {findOutlawsByTraits({ [trait]: value }).length} known outlaws
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Deduction Summary */}
              <div className="mt-6 p-4 bg-gray-900/50 rounded border border-amber-900">
                <h4 className="text-amber-400 text-sm mb-2">Current Deduction</h4>
                {possible.length === 1 ? (
                  <p className="text-emerald-400">
                    Evidence points to: <strong>{possible[0].alias}</strong>
                  </p>
                ) : possible.length > 1 ? (
                  <p className="text-amber-300">
                    {possible.length} suspects remain. Need more evidence.
                  </p>
                ) : (
                  <p className="text-red-400">
                    No suspects match all evidence. Check for errors.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'suspects' && (
            <div className="space-y-4">
              <p className="text-amber-600 text-sm mb-4">
                Based on your evidence, {possible.length} suspects remain.
                {eliminated.length > 0 && ` ${eliminated.length} have been eliminated.`}
              </p>

              {/* Possible Suspects */}
              <div>
                <h4 className="text-amber-400 text-sm mb-2 uppercase">Possible Suspects</h4>
                {possible.length > 0 ? (
                  <div className="grid gap-2">
                    {possible.map(outlaw => (
                      <div
                        key={outlaw.id}
                        className="p-3 bg-amber-950/30 border border-amber-700 rounded flex justify-between items-center"
                      >
                        <div>
                          <span className="text-amber-200">{outlaw.alias}</span>
                          <span className="text-amber-600 text-sm ml-2">({outlaw.realName})</span>
                        </div>
                        <span className="text-yellow-500">${outlaw.bounty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-400 italic">No suspects match the evidence!</p>
                )}
              </div>

              {/* Eliminated */}
              {eliminated.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-gray-500 text-sm mb-2 uppercase">Eliminated</h4>
                  <div className="flex flex-wrap gap-2">
                    {eliminated.map(outlaw => (
                      <span
                        key={outlaw.id}
                        className="px-2 py-1 bg-gray-800 text-gray-500 text-sm rounded line-through"
                      >
                        {outlaw.alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-amber-950/50 p-3 border-t border-amber-900 flex flex-col md:flex-row justify-between gap-2">
          <div className="text-amber-700 text-sm md:text-xs">
            Investigation Time: {mysteryState.investigationTime} hours
          </div>
          <div className="flex gap-2">
            {onOpenDossier && (
              <button
                onClick={onOpenDossier}
                className="px-4 py-2.5 md:px-3 md:py-1 bg-amber-900 text-amber-300 text-base md:text-sm rounded hover:bg-amber-800 active:bg-amber-700"
              >
                View Dossiers
              </button>
            )}
            {onOpenTelegraph && possible.length === 1 && (
              <button
                onClick={onOpenTelegraph}
                className="px-4 py-2.5 md:px-3 md:py-1 bg-emerald-900 text-emerald-300 text-base md:text-sm rounded hover:bg-emerald-800 active:bg-emerald-700"
              >
                Issue Warrant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual clue entry component
function ClueEntry({ clue }: { clue: CollectedClue }) {
  return (
    <div className="pl-3 border-l-2 border-amber-800">
      <p className="text-amber-200 text-sm italic">"{clue.text}"</p>
      <div className="flex gap-3 mt-1 text-xs">
        <span className="text-amber-600">
          \u2014 {clue.witnessType.replace(/_/g, ' ')}
        </span>
        {clue.trait && clue.value && (
          <span className="text-emerald-600">
            \u2192 {TRAIT_DISPLAY_NAMES[clue.trait]}: {TRAIT_VALUE_DISPLAY[clue.value] || clue.value}
          </span>
        )}
        <span className="text-amber-800">
          ({Math.round(clue.reliability * 100)}% reliable)
        </span>
      </div>
    </div>
  )
}

// Helper to group clues by location
function groupCluesByLocation(clues: CollectedClue[]): Record<string, CollectedClue[]> {
  return clues.reduce((acc, clue) => {
    const loc = clue.location || 'Unknown'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(clue)
    return acc
  }, {} as Record<string, CollectedClue[]>)
}

export default ClueJournal
