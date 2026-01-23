'use client'

import React, { useState } from 'react'
import {
  OUTLAWS,
  type Outlaw,
  type OutlawTraits,
  TRAIT_DISPLAY_NAMES,
  TRAIT_VALUE_DISPLAY
} from '../data/outlaws'
import { useMystery } from '../mysteryContext'

interface DossierViewProps {
  onClose: () => void
  showCapturedOnly?: boolean
}

export function DossierView({ onClose, showCapturedOnly = false }: DossierViewProps) {
  const { state: mysteryState, getOutlawStatus, getNarrowedDown } = useMystery()
  const [selectedOutlaw, setSelectedOutlaw] = useState<Outlaw | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'suspects' | 'eliminated' | 'captured'>('all')

  const { possible, eliminated } = getNarrowedDown()

  // Get filtered outlaw list
  const getFilteredOutlaws = (): Outlaw[] => {
    if (showCapturedOnly) {
      return OUTLAWS.filter(o => getOutlawStatus(o.id)?.captured)
    }

    switch (filterMode) {
      case 'suspects':
        return possible
      case 'eliminated':
        return eliminated
      case 'captured':
        return OUTLAWS.filter(o => getOutlawStatus(o.id)?.captured)
      default:
        return OUTLAWS
    }
  }

  const filteredOutlaws = getFilteredOutlaws()

  // Check if a trait matches known traits
  const isTraitKnown = (trait: keyof OutlawTraits): boolean => {
    return trait in mysteryState.knownTraits
  }

  const doesTraitMatch = (outlaw: Outlaw, trait: keyof OutlawTraits): boolean | null => {
    if (!isTraitKnown(trait)) return null
    return outlaw.traits[trait] === mysteryState.knownTraits[trait]
  }

  // Get status badge for outlaw
  const getStatusBadge = (outlaw: Outlaw) => {
    const status = getOutlawStatus(outlaw.id)

    if (status?.captured) {
      return <span className="px-2 py-0.5 bg-emerald-900 text-emerald-300 text-xs rounded">CAPTURED</span>
    }
    if (status?.escaped) {
      return <span className="px-2 py-0.5 bg-red-900 text-red-300 text-xs rounded">ESCAPED</span>
    }
    if (possible.includes(outlaw)) {
      return <span className="px-2 py-0.5 bg-amber-900 text-amber-300 text-xs rounded">SUSPECT</span>
    }
    if (eliminated.includes(outlaw)) {
      return <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">ELIMINATED</span>
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-amber-600 flex justify-between items-center">
          <h2 className="text-amber-300 text-xl">Suspect Dossiers</h2>
          <div className="flex gap-2">
            {!showCapturedOnly && (
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-1 text-xs rounded ${filterMode === 'all' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-gray-300'}`}
                >
                  All ({OUTLAWS.length})
                </button>
                <button
                  onClick={() => setFilterMode('suspects')}
                  className={`px-2 py-1 text-xs rounded ${filterMode === 'suspects' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-gray-300'}`}
                >
                  Suspects ({possible.length})
                </button>
                <button
                  onClick={() => setFilterMode('eliminated')}
                  className={`px-2 py-1 text-xs rounded ${filterMode === 'eliminated' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-gray-300'}`}
                >
                  Eliminated ({eliminated.length})
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-800 text-red-200 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Outlaw List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
            {filteredOutlaws.map(outlaw => (
              <button
                key={outlaw.id}
                onClick={() => setSelectedOutlaw(outlaw)}
                className={`w-full p-3 text-left border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                  selectedOutlaw?.id === outlaw.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-amber-300 font-medium">{outlaw.alias}</p>
                    <p className="text-gray-500 text-xs">{outlaw.realName}</p>
                  </div>
                  {getStatusBadge(outlaw)}
                </div>
                <p className="text-yellow-500 text-sm mt-1">${outlaw.bounty} BOUNTY</p>
              </button>
            ))}
            {filteredOutlaws.length === 0 && (
              <p className="p-4 text-gray-500 text-center">No outlaws match this filter.</p>
            )}
          </div>

          {/* Outlaw Details */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedOutlaw ? (
              <div className="space-y-4">
                {/* Name & Bounty */}
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl text-amber-300">{selectedOutlaw.alias}</h3>
                      <p className="text-gray-400">AKA: {selectedOutlaw.realName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-500 text-2xl">${selectedOutlaw.bounty}</p>
                      <p className="text-gray-500 text-sm">BOUNTY</p>
                    </div>
                  </div>
                  {selectedOutlaw.isLeader && (
                    <span className="inline-block mt-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                      GANG LEADER
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">DESCRIPTION</h4>
                  <p className="text-gray-300">{selectedOutlaw.description}</p>
                </div>

                {/* Backstory */}
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">BACKSTORY</h4>
                  <p className="text-gray-300 text-sm">{selectedOutlaw.backstory}</p>
                </div>

                {/* Catchphrase */}
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">KNOWN CATCHPHRASE</h4>
                  <p className="text-amber-400 italic">"{selectedOutlaw.catchphrase}"</p>
                </div>

                {/* Traits Grid */}
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">IDENTIFYING CHARACTERISTICS</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(selectedOutlaw.traits) as Array<keyof OutlawTraits>).map(trait => {
                      const match = doesTraitMatch(selectedOutlaw, trait)
                      const value = selectedOutlaw.traits[trait]

                      return (
                        <div
                          key={trait}
                          className={`p-2 rounded border ${
                            match === true
                              ? 'border-emerald-600 bg-emerald-900/30'
                              : match === false
                              ? 'border-red-600 bg-red-900/30'
                              : 'border-gray-700 bg-gray-800/50'
                          }`}
                        >
                          <p className="text-gray-500 text-xs">{TRAIT_DISPLAY_NAMES[trait]}</p>
                          <p className={`text-sm ${
                            match === true
                              ? 'text-emerald-400'
                              : match === false
                              ? 'text-red-400 line-through'
                              : 'text-gray-300'
                          }`}>
                            {TRAIT_VALUE_DISPLAY[value] || value}
                          </p>
                          {match !== null && (
                            <span className="text-xs">
                              {match ? '\u2713 Matches Evidence' : '\u2717 Doesn\'t Match'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Preferred Crimes */}
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">KNOWN CRIMES</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedOutlaw.preferredCrimes.map(crime => (
                      <span
                        key={crime}
                        className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {crime.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select an outlaw to view their dossier
              </div>
            )}
          </div>
        </div>

        {/* Known Evidence Summary */}
        {Object.keys(mysteryState.knownTraits).length > 0 && (
          <div className="bg-gray-800 p-3 border-t border-amber-600">
            <p className="text-amber-400 text-sm mb-2">Evidence Gathered:</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(mysteryState.knownTraits) as Array<[keyof OutlawTraits, string]>).map(
                ([trait, value]) => (
                  <span
                    key={trait}
                    className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded"
                  >
                    {TRAIT_DISPLAY_NAMES[trait]}: {TRAIT_VALUE_DISPLAY[value] || value}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DossierView
