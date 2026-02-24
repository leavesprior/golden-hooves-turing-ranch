'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useOregonTrail } from '../oregonTrailContext'
import { useChapter, ChapterTransition } from '../chapterContext'
import { useNarrator } from '../narratorContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import { NarratorOverlay } from '../components/NarratorOverlay'
import { WorldMap } from '../components/WorldMap'
import { getLocationById } from '../data/worldMaps'
import { getRandomTwainQuote } from '../data/easterEggs'

export function WorldMapScreen() {
  const { state, setPhase, setCurrentLandmark } = useOregonTrail()
  const {
    progress,
    isTransitioning,
    canAdvanceChapter,
    travelTo,
    advanceChapter,
    isLocationDiscovered,
    checkForEasterEggs,
    markEasterEggFound,
  } = useChapter()
  const { comment } = useNarrator()

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [travelMessage, setTravelMessage] = useState<string | null>(null)
  const [showTwainQuote, setShowTwainQuote] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<{ quote: string; context: string } | null>(null)

  // Check for easter eggs when entering a location
  const handleLocationClick = useCallback((locationId: string) => {
    setSelectedLocation(locationId)

    // Check for easter eggs at this location
    const easterEgg = checkForEasterEggs({ locationId })
    if (easterEgg) {
      markEasterEggFound(easterEgg.id)
      comment(`Secret found: ${easterEgg.title}! ${easterEgg.description}`, 'fourth_wall')
    }
  }, [checkForEasterEggs, markEasterEggFound, comment])

  const handleTravel = useCallback(() => {
    if (!selectedLocation) return

    const result = travelTo(selectedLocation)
    if (result.success) {
      // Show travel message
      setTravelMessage(`Traveled to ${getLocationById(selectedLocation)?.name}. Time spent: ${result.timeSpent} hours.`)

      // Check for random encounter
      if (result.encounter) {
        comment("Something stirs on the trail ahead...", 'warning')
      }

      // Check for new discoveries
      if (result.newDiscoveries.length > 0) {
        const names = result.newDiscoveries.map(id => getLocationById(id)?.name).filter(Boolean)
        comment(`New locations discovered: ${names.join(', ')}`, 'observation')
      }

      // Occasionally show a Twain quote
      if (Math.random() < 0.3) {
        const twainQuote = getRandomTwainQuote()
        setCurrentQuote({ quote: twainQuote.text, context: twainQuote.context })
        setShowTwainQuote(true)
        setTimeout(() => setShowTwainQuote(false), 5000)
      }

      // Clear selection
      setSelectedLocation(null)
      setTimeout(() => setTravelMessage(null), 3000)
    }
  }, [selectedLocation, travelTo, comment])

  const handleEnterLocation = useCallback(() => {
    if (!selectedLocation) return

    const location = getLocationById(selectedLocation)
    if (!location) return

    // Update the main game state with the new location
    setCurrentLandmark(location.name)

    // Transition to town phase
    setPhase('town')
  }, [selectedLocation, setCurrentLandmark, setPhase])

  const selectedLocationData = selectedLocation ? getLocationById(selectedLocation) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">
              {progress.chapter === 'journey_west' ? 'Chapter 1: Journey West' :
               progress.chapter === 'gold_country' ? 'Chapter 2: Gold Country' :
               'Chapter 3: The Long Road Home'}
            </h1>
            <p className="text-amber-400 text-xs">
              Day {state.day} | {progress.totalTravelTime} hours traveled
            </p>
          </div>
          <div className="flex items-center gap-4">
            <KarmaWallet compact />
            {canAdvanceChapter && (
              <button
                onClick={advanceChapter}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-yellow-100 font-pixel text-xs rounded border-2 border-yellow-400 animate-pulse"
              >
                Advance Chapter {'\u2192'}
              </button>
            )}
          </div>
        </header>

        {/* World Map */}
        <div className="relative">
          <WorldMap
            chapter={progress.chapter}
            currentLocationId={progress.currentLocationId}
            discoveredLocations={progress.discoveredLocations}
            onLocationClick={handleLocationClick}
            graphicsTier={state.graphicsTier}
          />

          {/* Location Details Panel */}
          {selectedLocationData && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border-2 border-amber-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-pixel text-amber-200 text-lg">{selectedLocationData.name}</h3>
                  <p className="text-amber-400 text-xs capitalize">
                    {selectedLocationData.type} {'\u2022'} {selectedLocationData.dangerLevel}
                  </p>
                  <p className="text-slate-300 text-sm mt-2">{selectedLocationData.description}</p>

                  {/* Lore */}
                  {selectedLocationData.lore && (
                    <div className="mt-2 text-xs text-slate-400">
                      <span className="text-amber-500">Est. {selectedLocationData.lore.founded}</span>
                      {selectedLocationData.lore.peakPopulation > 0 && (
                        <span className="ml-2">{'\u2022'} Peak pop: {selectedLocationData.lore.peakPopulation.toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  {/* Services */}
                  {selectedLocationData.services.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {selectedLocationData.services.map(service => (
                        <span
                          key={service}
                          className="px-2 py-0.5 bg-amber-900/60 text-amber-300 text-[10px] rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {progress.currentLocationId !== selectedLocation && (
                    <button
                      onClick={handleTravel}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-xs rounded border-2 border-green-500"
                    >
                      Travel Here
                    </button>
                  )}
                  <button
                    onClick={handleEnterLocation}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-xs rounded border-2 border-amber-500"
                  >
                    Enter Town
                  </button>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-pixel text-xs rounded border-2 border-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Travel Message */}
        {travelMessage && (
          <div className="mt-4 p-3 bg-green-900/60 border border-green-600 rounded text-center">
            <p className="text-green-200 text-sm">{travelMessage}</p>
          </div>
        )}

        {/* Twain Quote Popup */}
        {showTwainQuote && currentQuote && (
          <div className="fixed bottom-8 right-8 max-w-sm p-4 bg-amber-900/95 border-2 border-amber-500 rounded-lg shadow-xl animate-fade-in">
            <p className="text-amber-200 text-sm italic">"{currentQuote.quote}"</p>
            <p className="text-amber-500 text-xs mt-2">{'\u2014'} Mark Twain, {currentQuote.context}</p>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Locations Discovered</span>
            <span className="text-amber-200 font-pixel">{progress.discoveredLocations.size}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Locations Visited</span>
            <span className="text-amber-200 font-pixel">{progress.visitedLocations.size}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Easter Eggs Found</span>
            <span className="text-amber-200 font-pixel">{progress.easterEggsFound.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Outlaws Captured</span>
            <span className="text-amber-200 font-pixel">{progress.outlawsCaptured.length}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => setPhase('traveling')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-pixel text-xs rounded border-2 border-slate-500"
          >
            {'\u2190'} Back to Trail
          </button>
          <Link
            href="/hub"
            className="px-4 py-2 bg-red-900/60 hover:bg-red-800/60 text-red-200 font-pixel text-xs rounded border-2 border-red-600"
          >
            Quit Game
          </Link>
        </div>
      </div>

      {/* Chapter Transition Overlay */}
      {isTransitioning && (
        <ChapterTransition
          isVisible={isTransitioning}
          fromChapter={progress.chapter}
          toChapter={progress.chapter === 'journey_west' ? 'gold_country' : 'return_visit'}
        />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
