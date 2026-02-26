'use client'

import React, { useState, useMemo } from 'react'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { type OutlawTraits, type Outlaw, TRAIT_DISPLAY_NAMES, TRAIT_VALUE_DISPLAY, OUTLAWS, findOutlawsByTraits, getOutlaw } from '../data/outlaws'

interface ClueJournalProps {
  onClose: () => void
  onOpenDossier?: () => void
  onOpenTelegraph?: () => void
}

// Helper to group clues by outlaw ID
function groupCluesByOutlaw(clues: CollectedClue[]): Record<string, CollectedClue[]> {
  return clues.reduce((acc, clue) => {
    const outlawId = clue.outlawId || 'unknown'
    if (!acc[outlawId]) acc[outlawId] = []
    acc[outlawId].push(clue)
    return acc
  }, {} as Record<string, CollectedClue[]>)
}

export function ClueJournal({ onClose, onOpenDossier, onOpenTelegraph }: ClueJournalProps) {
  useEscapeKey(onClose)
  const { state: mysteryState, getNarrowedDown } = useMystery()
  const [activeTab, setActiveTab] = useState<'bounties' | 'clues' | 'evidence' | 'suspects' | 'notes'>('bounties')

  // Group clues by outlaw for bounty hunter mode
  const cluesByOutlaw = useMemo(() => groupCluesByOutlaw(mysteryState.collectedClues), [mysteryState.collectedClues])

  const { possible, eliminated } = getNarrowedDown()
  const cluesByLocation = groupCluesByLocation(mysteryState.collectedClues)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Clue Journal">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 40L40 0H20L0 20V40zM40 40V20L20 40H40z\' fill=\'%23000\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")', backgroundColor: '#1a1612' }}
      >
        {/* Header - Bounty Hunter style */}
        <div className="bg-amber-900/80 p-4 border-b-4 border-amber-950">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-amber-200 text-xl tracking-wide">Bounty Hunter's Journal</h2>
                <p className="text-amber-600 text-xs">Track outlaws across the frontier</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2.5 md:px-3 md:py-1 bg-amber-950 text-amber-300 rounded hover:bg-amber-800 active:bg-amber-700 text-base md:text-sm"
            >
              Close
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('bounties')}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded-t text-base md:text-sm active:scale-[0.98] ${
                activeTab === 'bounties'
                  ? 'bg-amber-200/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              🎯 Bounties ({Object.keys(cluesByOutlaw).length})
            </button>
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
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2.5 md:px-3 md:py-1 rounded-t text-base md:text-sm active:scale-[0.98] ${
                activeTab === 'notes'
                  ? 'bg-amber-200/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              {'\uD83D\uDCD3'} Notes ({mysteryState.notebookEntries?.length ?? 0})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* BOUNTIES TAB - Main bounty hunter view */}
          {activeTab === 'bounties' && (
            <div className="space-y-4">
              {Object.keys(cluesByOutlaw).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-amber-300 text-lg">No bounties tracked yet</p>
                  <p className="text-amber-700 text-sm mt-2">
                    Talk to witnesses in towns to gather intel on Black Bart's Gang.
                  </p>
                  <p className="text-amber-600 text-xs mt-4">
                    Tip: Bartenders, shopkeepers, and stable hands often see passing strangers.
                  </p>
                </div>
              ) : (
                <>
                  {/* Bounty Summary */}
                  <div className="bg-gradient-to-r from-amber-900/40 to-red-900/30 border border-amber-600 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-medium">Black Bart's Gang</h3>
                        <p className="text-amber-600 text-sm">
                          Tracking {Object.keys(cluesByOutlaw).length} of {OUTLAWS.length} known outlaws
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 text-lg font-bold">
                          ${OUTLAWS.reduce((sum, o) => sum + o.bounty, 0).toLocaleString()}
                        </span>
                        <p className="text-amber-600 text-xs">Total bounty</p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Bounty Cards */}
                  <div className="grid gap-4">
                    {Object.entries(cluesByOutlaw).map(([outlawId, clues]) => {
                      const outlaw = getOutlaw(outlawId)
                      if (!outlaw) return null

                      // Calculate traits discovered for this outlaw
                      const traitsFound = new Set(clues.filter(c => c.trait).map(c => c.trait))
                      const totalTraits = Object.keys(outlaw.traits).length

                      return (
                        <div
                          key={outlawId}
                          className="bg-gray-800/80 border border-amber-700 rounded-lg overflow-hidden"
                        >
                          {/* Wanted Poster Header */}
                          <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-4 py-3 border-b border-amber-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🤠</span>
                                <div>
                                  <h4 className="text-amber-200 font-bold">{outlaw.alias}</h4>
                                  <p className="text-amber-500 text-xs">{outlaw.realName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-yellow-400 font-bold">${outlaw.bounty}</span>
                                <p className="text-amber-600 text-xs">REWARD</p>
                              </div>
                            </div>
                          </div>

                          {/* Progress & Clues */}
                          <div className="p-4">
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-amber-400">Traits Identified</span>
                                <span className="text-amber-300">{traitsFound.size}/{totalTraits}</span>
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 transition-all"
                                  style={{ width: `${(traitsFound.size / totalTraits) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Clues List */}
                            <div className="space-y-2">
                              {clues.slice(0, 3).map(clue => (
                                <div key={clue.id} className="text-sm">
                                  <p className="text-gray-300 italic">"{clue.text}"</p>
                                  {clue.trait && (
                                    <span className="text-emerald-400 text-xs">
                                      → {TRAIT_DISPLAY_NAMES[clue.trait]}: {TRAIT_VALUE_DISPLAY[clue.value!] || clue.value}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {clues.length > 3 && (
                                <p className="text-amber-600 text-xs">+{clues.length - 3} more clues...</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Unknown Outlaws */}
                  {Object.keys(cluesByOutlaw).length < OUTLAWS.length && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="text-gray-400 text-sm mb-2">Unknown Gang Members</h4>
                      <p className="text-gray-500 text-xs">
                        {OUTLAWS.length - Object.keys(cluesByOutlaw).length} outlaws still untracked.
                        Keep interviewing witnesses to discover more of Black Bart's Gang.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
                <>
                  {/* Clue Summary */}
                  <div className="bg-amber-900/30 border border-amber-700 rounded p-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-amber-300">
                        {mysteryState.collectedClues.length} clues collected
                      </span>
                      <span className="text-emerald-400">
                        {mysteryState.collectedClues.filter(c => c.trait && c.value).length} revealed evidence
                      </span>
                    </div>
                    <p className="text-amber-600 text-xs mt-1">
                      Clues with green highlights have revealed outlaw traits. Check the Evidence tab to see your deductions.
                    </p>
                  </div>
                  {Object.entries(cluesByLocation).map(([location, clues]) => (
                  <div key={location} className="border-b border-amber-900/50 pb-4">
                    <h3 className="text-amber-400 text-sm mb-2 uppercase tracking-wider">{location}</h3>
                    <div className="space-y-2">
                      {clues.map(clue => (
                        <ClueEntry key={clue.id} clue={clue} />
                      ))}
                    </div>
                  </div>
                ))}
                </>
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

          {activeTab === 'notes' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(!mysteryState.notebookEntries || mysteryState.notebookEntries.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-amber-500 text-sm">No notes yet.</p>
                  <p className="text-amber-600 text-xs mt-1">
                    Discover people, places, and secrets to fill your notebook.
                  </p>
                </div>
              ) : (
                <>
                  {(['discovery', 'hint', 'map_note', 'npc_info', 'lore'] as const).map(noteType => {
                    const entries = mysteryState.notebookEntries.filter((e: any) => e.type === noteType)
                    if (entries.length === 0) return null
                    const typeLabels: Record<string, string> = {
                      discovery: '\uD83D\uDD0D Discoveries',
                      hint: '\uD83D\uDCA1 Hints',
                      map_note: '\uD83D\uDCCD Map Notes',
                      npc_info: '\uD83D\uDC64 People',
                      lore: '\uD83D\uDCDC Lore',
                    }
                    return (
                      <div key={noteType}>
                        <h4 className="text-amber-400 text-xs font-bold mb-2 uppercase tracking-wider">
                          {typeLabels[noteType]}
                        </h4>
                        <div className="space-y-2">
                          {entries.map((entry: any) => (
                            <div key={entry.id} className="bg-black/30 border border-amber-800/50 rounded p-2">
                              <div className="flex items-start gap-2">
                                {entry.icon && <span className="text-lg">{entry.icon}</span>}
                                <div className="flex-1">
                                  <span className="text-amber-200 text-xs font-bold">{entry.title}</span>
                                  {entry.location && (
                                    <span className="text-amber-600 text-[10px] ml-2">@ {entry.location}</span>
                                  )}
                                  <p className="text-amber-300 text-[10px] mt-1">{entry.text}</p>
                                  <span className="text-amber-700 text-[9px]">Day {entry.gameDay}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
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
  const hasTrait = clue.trait && clue.value
  return (
    <div className={`pl-3 border-l-2 ${hasTrait ? 'border-emerald-600 bg-emerald-900/20' : 'border-amber-800'} rounded-r`}>
      <p className="text-amber-200 text-sm italic">"{clue.text}"</p>
      <div className="flex flex-wrap gap-3 mt-1 text-xs">
        <span className="text-amber-600">
          \u2014 {clue.witnessType.replace(/_/g, ' ')}
        </span>
        {hasTrait && (
          <span className="text-emerald-400 font-medium bg-emerald-900/40 px-2 py-0.5 rounded">
            Evidence: {TRAIT_DISPLAY_NAMES[clue.trait!]}: {TRAIT_VALUE_DISPLAY[clue.value!] || clue.value}
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
