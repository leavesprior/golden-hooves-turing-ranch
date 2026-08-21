'use client'

import React, { useState, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useMystery } from '../mysteryContext'
import { useNarrator } from '../narratorContext'
import { useReputation } from '../reputationContext'
import { KarmaToastContainer } from '@/components/karma'
import { NarratorOverlay, ReliabilityIndicator } from '../components/NarratorOverlay'
import { getNPCsAtLocation } from '../data/goldCountryNPCs'
import { CRIME_DESCRIPTIONS } from '../data/clueTemplates'

export function InvestigationScreen() {
  const { state, closeInvestigation, openWitnessDialogue, openDossier, openTelegraph, openJournal, investigateLocation } = useOregonTrail()
  const { state: mysteryState, generateCrimeAtLocation } = useMystery()
  const { comment, recordPlayerAction } = useNarrator()
  const { getReputation } = useReputation()

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  // The crime generator existed but was never called from this screen, so
  // Investigate was a map of empty saloons. Open a case when none is live.
  useEffect(() => {
    if (!mysteryState.currentCrime) {
      generateCrimeAtLocation(state.currentLandmark || 'Independence, Missouri')
    }
    // once per visit — a fresh crime every render would wipe clues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Available investigation locations based on landmark type
  const investigationLocations = [
    { id: 'saloon', name: 'Saloon', icon: '\uD83C\uDF7A', witnesses: ['bartender', 'drunk', 'traveler'] },
    { id: 'stable', name: 'Stable', icon: '\uD83D\uDC34', witnesses: ['stable_hand'] },
    { id: 'general_store', name: 'General Store', icon: '\uD83C\uDFEA', witnesses: ['shopkeeper'] },
    { id: 'telegraph', name: 'Telegraph Office', icon: '\u26A1', witnesses: ['telegraph_operator'] },
    { id: 'church', name: 'Church', icon: '\u26EA', witnesses: ['preacher'] },
    { id: 'street', name: 'Street', icon: '\uD83D\uDEE4\uFE0F', witnesses: ['settler', 'child', 'traveler'] },
  ]

  const hoursRemaining = state.investigation.maxInvestigationHours - state.investigation.hoursInvestigated

  // Town Investigations 1849 (insertion 1): resolve the current town's REAL period
  // townsfolk from goldCountryNPCs. Location id is derived from the landmark name the
  // same way TownScreen does. When a town has authored NPCs, we render one interview per
  // real person; otherwise we fall back to the generic saloon/street witness roster so
  // towns without data (and old saves) still work with no crash.
  const locationId = (state.currentLandmark || '').toLowerCase().replace(/[^a-z]/g, '_')
  const townNPCs = getNPCsAtLocation(locationId)
  const hasTownNPCs = townNPCs.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-amber-950 to-gray-900 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-2xl mx-auto pt-8">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">Investigation</h1>
            <p className="text-amber-400 text-sm">{state.currentLandmark}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs ${hoursRemaining <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
              {'\u23F0'} {hoursRemaining}h remaining
            </div>
            <ReliabilityIndicator compact />
          </div>
        </header>

        {mysteryState.currentCrime && (
          <div className="mb-6 rounded-lg border-2 border-amber-700/70 bg-black/30 p-4">
            <p className="font-pixel text-amber-200 text-sm">
              {CRIME_DESCRIPTIONS[mysteryState.currentCrime.type]?.title || 'A crime on the books'}
            </p>
            <p className="text-amber-400/90 text-sm mt-2 leading-relaxed">
              {CRIME_DESCRIPTIONS[mysteryState.currentCrime.type]?.description ||
                'Someone left a mess. The paper on the spike wants a name.'}
            </p>
            <p className="text-stone-500 text-xs mt-2">
              Ask around. Traits go in the journal. The telegraph is for the warrant.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={openJournal}
            className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
          >
            {'\uD83D\uDCD4'} Journal ({mysteryState.collectedClues.length} clues, {Object.keys(mysteryState.knownTraits).length} traits)
          </button>
          <button
            onClick={openDossier}
            className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
          >
            {'\uD83D\uDCCB'} Dossiers
          </button>
          <button
            onClick={openTelegraph}
            className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
          >
            {'\uD83D\uDCE8'} Telegraph
          </button>
        </div>

        {/* Per-town townsfolk roster — REAL period NPCs when the town has authored data */}
        {hasTownNPCs && (
          <div className="mb-6">
            <p className="text-amber-300 text-xs mb-3 font-pixel">Townsfolk to question</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {townNPCs.map(npc => {
                const interviewed = state.investigation.witnessesInterviewed.includes(npc.id)
                return (
                  <button
                    key={npc.id}
                    onClick={() => {
                      if (!interviewed) {
                        // Track by npc.id (unique per person) and carry the id for the
                        // grounded-clue + DM-voiced-dialogue paths.
                        openWitnessDialogue(npc.id, npc.id)
                        recordPlayerAction(`interview_${npc.id}`)
                      }
                    }}
                    disabled={interviewed}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      interviewed
                        ? 'bg-green-900/40 border-green-700 opacity-70'
                        : 'bg-gray-800/70 border-amber-700 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{npc.portrait}</span>
                      <div className="min-w-0">
                        <p className="text-amber-200 text-sm">
                          {npc.name}
                          {interviewed && ' ✓'}
                        </p>
                        <p className="text-amber-500 text-xs">{npc.title}</p>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2 italic">&ldquo;{npc.greeting}&rdquo;</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Investigation Locations — generic fallback for towns without authored NPCs */}
        {!hasTownNPCs && (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {investigationLocations.map(loc => {
            // Count how many witnesses at this location have been interviewed
            const interviewedCount = loc.witnesses.filter(w =>
              state.investigation.witnessesInterviewed.includes(w)
            ).length
            const allInterviewed = interviewedCount === loc.witnesses.length
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  allInterviewed
                    ? 'bg-green-900/40 border-green-700'
                    : selectedLocation === loc.id
                    ? 'bg-amber-900/60 border-amber-400'
                    : 'bg-gray-800/60 border-gray-600 hover:border-amber-600'
                }`}
              >
                <span className="text-2xl">{loc.icon}</span>
                <p className="text-amber-200 text-sm mt-1">{loc.name}</p>
                {interviewedCount > 0 && (
                  <span className={`text-xs ${allInterviewed ? 'text-green-400' : 'text-amber-400'}`}>
                    {interviewedCount}/{loc.witnesses.length} interviewed
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Location Details */}
        {selectedLocation && (
          <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
            <h3 className="text-amber-200 font-pixel text-sm mb-3">
              {investigationLocations.find(l => l.id === selectedLocation)?.name}
            </h3>
            <p className="text-gray-400 text-xs mb-4">Available witnesses to interview:</p>
            <div className="flex flex-wrap gap-2">
              {investigationLocations
                .find(l => l.id === selectedLocation)
                ?.witnesses.map(witness => {
                  const interviewed = state.investigation.witnessesInterviewed.includes(witness)
                  return (
                    <button
                      key={witness}
                      onClick={() => {
                        if (!interviewed) {
                          // Don't mark location as searched - just interview the witness
                          // Time is spent when dialogue closes (in closeWitnessDialogue)
                          openWitnessDialogue(witness)
                          recordPlayerAction(`interview_${witness}`)
                        }
                      }}
                      disabled={interviewed}
                      className={`px-3 py-2 rounded text-sm ${
                        interviewed
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-amber-800 text-amber-200 hover:bg-amber-700'
                      }`}
                    >
                      {witness.replace(/_/g, ' ')}
                      {interviewed && ' \u2713'}
                    </button>
                  )
                })}
            </div>
          </div>
        )}
        </>
        )}

        {/* Leave Investigation */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              comment("Leaving already? The trail grows colder by the hour...", 'warning')
              closeInvestigation()
            }}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-sm rounded border-2 border-gray-500"
          >
            Return to Town
          </button>
        </div>
      </div>
    </div>
  )
}
