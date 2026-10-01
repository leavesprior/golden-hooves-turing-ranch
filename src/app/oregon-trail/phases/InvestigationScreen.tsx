'use client'

import React, { useState, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useMystery } from '../mysteryContext'
import { useNarrator } from '../narratorContext'
import { useCharacter } from '../characterContext'
import { KarmaToastContainer } from '@/components/karma'
import { NarratorOverlay, ReliabilityIndicator } from '../components/NarratorOverlay'
import { PlayerPortrait } from '../components/PlayerPortrait'
import { InvestigationFigure } from '../components/InvestigationFigure'
import { MapIcon } from '../components/map/MapIcons'
import { getNPCsAtLocation } from '../data/goldCountryNPCs'
import { CRIME_DESCRIPTIONS } from '../data/clueTemplates'
import { getGenericPlaces, getTrailPlaces, heroStillFor, resolveTrailTown, tradeGlyph, TRAIL_YEAR } from '@/lib/trailInvestigation'

// Same card language as the Level 2 interiors (GoldCountryShopInterior).
const CARD = 'rounded-lg border border-[var(--west-line)] p-3 text-left min-h-11 w-full transition-colors'
const CARD_OPEN = 'hover:bg-[#1f1a14]'
const CARD_DONE = 'opacity-60'

export function InvestigationScreen() {
  const { state, closeInvestigation, openWitnessDialogue, openDossier, openTelegraph, openJournal } = useOregonTrail()
  const { state: mysteryState, generateCrimeAtLocation } = useMystery()
  const { comment, recordPlayerAction } = useNarrator()
  const { state: characterState } = useCharacter()

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

  // Per-town places (Leif 09-30). California towns use their authored scenes,
  // trail stops their own 1849 places; the generic list is the last resort.
  const landmark = state.currentLandmark || ''
  const townPlaces = getTrailPlaces(landmark)
  const investigationLocations = getGenericPlaces()
  const hero = heroStillFor(landmark)
  const tier = state.graphicsTier
  const player = characterState.character
  const interviewedIds = state.investigation.witnessesInterviewed

  const hoursRemaining = state.investigation.maxInvestigationHours - state.investigation.hoursInvestigated

  // Town Investigations 1849 (insertion 1): the current town's REAL period
  // townsfolk from goldCountryNPCs, resolved through the town registry (the old
  // name slug missed West Point and Calaveras Big Trees).
  const townNPCs = resolveTrailTown(landmark).npcLocations.flatMap(getNPCsAtLocation)
  const hasTownNPCs = townNPCs.length > 0
  const present = townPlaces.filter(p => !p.later)
  const crossings = townPlaces.filter(p => p.later)

  const interview = (id: string) => {
    if (interviewedIds.includes(id)) return
    // Track by id (unique per person) and carry it for the grounded-clue path.
    openWitnessDialogue(id, id)
    recordPlayerAction(`interview_${id}`)
  }

  const placeCard = (place: (typeof townPlaces)[number]) => {
    const w = place.witnesses[0]
    const done = interviewedIds.includes(w.id)
    const who = w.name.toLowerCase().includes(w.role.toLowerCase()) ? w.name : `${w.name}, ${w.role}`
    return (
      <button
        key={place.id}
        type="button"
        onClick={() => interview(w.id)}
        disabled={done}
        data-testid="investigation-place"
        data-later={place.later ? 'true' : 'false'}
        className={`${CARD} ${done ? CARD_DONE : CARD_OPEN} ${place.later ? 'border-[#b8963e]/40' : ''}`}
      >
        <div className="flex items-start gap-3">
          <InvestigationFigure still={place.still} sprite={w.sprite} glyph={place.glyph} tier={tier} alt={place.displayName} />
          <div className="min-w-0">
            <p className="font-serif text-[#e8dcc4] leading-snug">
              {place.later ? `(Later: ${place.year} — ${place.displayName})` : place.displayName}
              {done && <span className="ml-1 text-[#9fb58a]">{'✓'}</span>}
            </p>
            <p className="text-sm text-[#b8a88a] mt-0.5">{who}</p>
            {place.later && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#d9bf7a]">
                <MapIcon type="frog" tier={tier} size={14} />A crossing to {place.year}
              </p>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="west-face-shell min-h-screen game-chrome-pad" data-testid="investigation-screen">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="west-face-eyebrow">Investigation · {TRAIL_YEAR}</p>
          <h1 className="west-face-title text-3xl truncate">{landmark}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`west-face-pill inline-flex items-center ${hoursRemaining <= 2 ? 'text-[#e89a8a]' : ''}`}>
            {hoursRemaining}h left
          </span>
          <ReliabilityIndicator compact />
        </div>
      </header>

      {hero && (
        <div className="relative w-full aspect-video max-h-[46vh] overflow-hidden bg-[#120e0a]" data-testid="investigation-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.src} alt={hero.caption ? `${landmark}. ${hero.caption}` : `${landmark}, ${TRAIL_YEAR}`} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/30 to-transparent" />
          {player?.name ? (
            <div className="absolute bottom-3 left-3 flex items-end gap-2">
              <PlayerPortrait background={player.background} name={player.name} width={72} className="shadow-lg" />
              <span className="west-face-paper px-2 py-1 font-serif text-xs text-[#e8dcc4]">{player.name}</span>
            </div>
          ) : null}
          {hero.caption && (
            <p className="absolute bottom-2 right-3 max-w-[55%] text-right font-serif text-[11px] italic text-[#cbbfa6] drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              {hero.caption}
            </p>
          )}
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {mysteryState.currentCrime && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-2">The warrant</h2>
            <p className="font-serif text-xl text-[#f3ead8]">
              {CRIME_DESCRIPTIONS[mysteryState.currentCrime.type]?.title || 'A crime on the books'}
            </p>
            <p className="west-face-body mt-2">
              {CRIME_DESCRIPTIONS[mysteryState.currentCrime.type]?.description ||
                'Someone left a mess. The paper on the spike wants a name.'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={openJournal} className="west-face-pill">
                Journal · {mysteryState.collectedClues.length} clues, {Object.keys(mysteryState.knownTraits).length} traits
              </button>
              <button type="button" onClick={openDossier} className="west-face-pill">Dossiers</button>
              <button type="button" onClick={openTelegraph} className="west-face-pill">Telegraph</button>
            </div>
          </div>
        )}

        {/* Per-town townsfolk roster — REAL period NPCs when the town has authored data */}
        {hasTownNPCs && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Townsfolk to question</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {townNPCs.map(npc => {
                const done = interviewedIds.includes(npc.id)
                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => interview(npc.id)}
                    disabled={done}
                    data-testid="investigation-townsfolk"
                    className={`${CARD} ${done ? CARD_DONE : CARD_OPEN}`}
                  >
                    <div className="flex items-start gap-3">
                      <InvestigationFigure glyph={tradeGlyph(npc.witnessType)} tier={tier} size="sm" />
                      <div className="min-w-0">
                        <p className="font-serif text-[#e8dcc4]">
                          {npc.name}
                          {done && <span className="ml-1 text-[#9fb58a]">{'✓'}</span>}
                        </p>
                        <p className="text-sm text-[#b8a88a]">{npc.title}</p>
                        <p className="west-face-body text-xs mt-1 line-clamp-2 italic">&ldquo;{npc.greeting}&rdquo;</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Authored places — each town its own */}
        {present.length > 0 && (
          <div className="west-face-paper" data-testid="town-places">
            <h2 className="west-face-eyebrow mb-3">Places to search</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{present.map(placeCard)}</div>
          </div>
        )}

        {/* Later eras — reached through the golden frog's crossing */}
        {crossings.length > 0 && (
          <div className="west-face-paper border-[#b8963e]/30" data-testid="town-crossings">
            <h2 className="west-face-eyebrow mb-1 inline-flex items-center gap-2">
              <MapIcon type="frog" tier={tier} size={16} />Through the crossing
            </h2>
            <p className="west-face-body text-sm mb-3">Places this town becomes, after {TRAIL_YEAR}.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{crossings.map(placeCard)}</div>
          </div>
        )}

        {/* Generic fallback for stops with nothing authored */}
        {!hasTownNPCs && townPlaces.length === 0 && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Places to search</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {investigationLocations.map(loc => {
                const interviewedCount = loc.witnesses.filter(w => interviewedIds.includes(w)).length
                const allInterviewed = interviewedCount === loc.witnesses.length
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`${CARD} ${allInterviewed ? CARD_DONE : CARD_OPEN} ${selectedLocation === loc.id ? 'border-[#d9bf7a]/60' : ''}`}
                  >
                    <InvestigationFigure glyph={loc.glyph} tier={tier} size="sm" />
                    <p className="font-serif text-[#e8dcc4] mt-2">{loc.name}</p>
                    {interviewedCount > 0 && (
                      <span className="text-xs text-[#b8a88a]">{interviewedCount}/{loc.witnesses.length} asked</span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedLocation && (
              <div className="west-face-row mt-3 flex-wrap">
                {investigationLocations
                  .find(l => l.id === selectedLocation)
                  ?.witnesses.map(witness => {
                    const done = interviewedIds.includes(witness)
                    return (
                      <button
                        key={witness}
                        type="button"
                        onClick={() => {
                          if (!done) {
                            // Time is spent when dialogue closes (in closeWitnessDialogue)
                            openWitnessDialogue(witness)
                            recordPlayerAction(`interview_${witness}`)
                          }
                        }}
                        disabled={done}
                        className="west-face-pill capitalize"
                      >
                        {witness.replace(/_/g, ' ')}
                        {done && ' ✓'}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              comment("Leaving already? The trail grows colder by the hour...", 'warning')
              closeInvestigation()
            }}
            className="west-face-pill west-face-pill-cream"
          >
            Return to town
          </button>
        </div>
      </div>
    </div>
  )
}
