'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { getGoldCountryLocation, getLocationTravelDistance } from '../data/goldCountryLocations'
import {
  getRandomEncounter,
  type TravelEncounter,
  type EncounterChoice,
  type EncounterOutcome,
} from '../data/goldCountryEncounters'

interface GoldCountryTravelProps {
  fromLocationId: string
  toLocationId: string
  onArrive: (locationId: string) => void
  onReturnToMap: () => void
}

type TravelPhase = 'departing' | 'traveling' | 'encounter' | 'outcome' | 'arriving'

export function GoldCountryTravel({
  fromLocationId,
  toLocationId,
  onArrive,
  onReturnToMap,
}: GoldCountryTravelProps) {
  const { state, advanceGoldCountryDay } = useOregonTrail()
  const { earnGood, earnNeutral, spendNeutral } = useKarmaWallet()

  const [phase, setPhase] = useState<TravelPhase>('departing')
  const [encounter, setEncounter] = useState<TravelEncounter | null>(null)
  const [outcome, setOutcome] = useState<EncounterOutcome | null>(null)
  const [travelProgress, setTravelProgress] = useState(0)

  const fromLoc = getGoldCountryLocation(fromLocationId)
  const toLoc = getGoldCountryLocation(toLocationId)
  const distance = getLocationTravelDistance(fromLocationId, toLocationId)

  // Travel animation
  useEffect(() => {
    if (phase !== 'departing') return

    const timer = setTimeout(() => {
      setPhase('traveling')
    }, 1000)
    return () => clearTimeout(timer)
  }, [phase])

  // Travel progress + encounter check
  useEffect(() => {
    if (phase !== 'traveling') return

    const interval = setInterval(() => {
      setTravelProgress(prev => {
        const next = prev + 5
        if (next >= 50 && !encounter) {
          // Check for encounter at midpoint
          const enc = getRandomEncounter(distance)
          if (enc) {
            setEncounter(enc)
            setPhase('encounter')
            clearInterval(interval)
            return next
          }
        }
        if (next >= 100) {
          setPhase('arriving')
          clearInterval(interval)
          advanceGoldCountryDay(1)
          return 100
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [phase, encounter, distance, advanceGoldCountryDay])

  // Auto-arrive after arriving phase
  useEffect(() => {
    if (phase !== 'arriving') return
    const timer = setTimeout(() => {
      onArrive(toLocationId)
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, toLocationId, onArrive])

  const handleEncounterChoice = useCallback((choice: EncounterChoice) => {
    // Check stat if required
    let success = true
    if (choice.statCheck) {
      const roll = Math.floor(Math.random() * 10) + 1
      success = roll >= choice.statCheck.difficulty
    }

    const result = choice.outcome
    setOutcome(result)

    // Apply outcome effects
    if (result.karmaDelta && result.karmaDelta > 0) {
      earnGood(result.karmaDelta)
    }
    if (result.goldDelta && result.goldDelta > 0) {
      earnNeutral(result.goldDelta)
    }
    if (result.goldDelta && result.goldDelta < 0) {
      spendNeutral(Math.abs(result.goldDelta))
    }

    setPhase('outcome')
  }, [earnGood, earnNeutral, spendNeutral])

  const handleContinueAfterOutcome = () => {
    setPhase('traveling')
    setEncounter(null)
    setOutcome(null)
  }

  // Departing screen
  if (phase === 'departing') {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-green-700 text-xs font-mono mb-2">DEPARTING</p>
          <p className="text-amber-400 font-pixel text-lg">{fromLoc?.name || fromLocationId}</p>
          <div className="mt-4 text-green-600 text-xs font-mono animate-pulse">
            Heading toward {toLoc?.name || toLocationId}...
          </div>
        </div>
      </div>
    )
  }

  // Traveling screen with progress bar
  if (phase === 'traveling') {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <p className="text-green-700 text-xs font-mono mb-2">TRAVELING</p>
            <p className="text-amber-400 font-pixel text-sm">
              {fromLoc?.shortName} &rarr; {toLoc?.shortName}
            </p>
          </div>

          {/* Progress bar */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-full h-3 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-700 to-amber-600 transition-all duration-100"
              style={{ width: `${travelProgress}%` }}
            />
          </div>

          {/* Travel description */}
          <div className="text-center">
            <p className="text-green-600 text-xs font-mono">
              {travelProgress < 30
                ? 'The trail winds through pine forests...'
                : travelProgress < 60
                  ? 'Rocky terrain slows your progress...'
                  : travelProgress < 90
                    ? 'You can see the destination ahead...'
                    : 'Almost there...'
              }
            </p>
          </div>

          {/* Cancel button */}
          <button
            onClick={onReturnToMap}
            className="w-full mt-8 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-500 text-xs font-mono rounded border border-red-800/40 transition-colors"
          >
            TURN BACK
          </button>
        </div>
      </div>
    )
  }

  // Encounter screen
  if (phase === 'encounter' && encounter) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="max-w-lg w-full p-4">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            {/* Encounter header */}
            <div className="text-center mb-4">
              <span className="text-4xl">{encounter.icon}</span>
              <h2 className="text-amber-400 font-pixel text-lg mt-2">{encounter.title}</h2>
              <span className="text-green-700 text-xs font-mono uppercase">{encounter.type}</span>
            </div>

            {/* Description */}
            <div className="bg-black/40 border border-green-800/30 rounded p-4 mb-6">
              <p className="text-green-300 text-sm leading-relaxed">{encounter.description}</p>
            </div>

            {/* Choices */}
            <div className="space-y-3">
              {encounter.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleEncounterChoice(choice)}
                  className="w-full text-left p-3 bg-green-950/40 hover:bg-green-900/40 rounded-lg border border-green-800/30 hover:border-green-600/50 transition-all group"
                >
                  <p className="text-green-300 text-sm group-hover:text-green-200">{choice.text}</p>
                  {choice.statCheck && (
                    <p className="text-green-700 text-xs font-mono mt-1">
                      [{choice.statCheck.stat.toUpperCase()} {choice.statCheck.difficulty}+]
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Outcome screen
  if (phase === 'outcome' && outcome) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="max-w-lg w-full p-4">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-4 text-center">OUTCOME</h2>

            <div className="bg-black/40 border border-green-800/30 rounded p-4 mb-4">
              <p className="text-green-300 text-sm leading-relaxed">{outcome.message}</p>
            </div>

            {/* Effects */}
            <div className="space-y-1 mb-6">
              {outcome.goldDelta && outcome.goldDelta !== 0 && (
                <p className={`text-xs font-mono ${outcome.goldDelta > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {outcome.goldDelta > 0 ? '+' : ''}{outcome.goldDelta} gold
                </p>
              )}
              {outcome.karmaDelta && outcome.karmaDelta !== 0 && (
                <p className={`text-xs font-mono ${outcome.karmaDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {outcome.karmaDelta > 0 ? '+' : ''}{outcome.karmaDelta} karma
                </p>
              )}
              {outcome.healthDelta && outcome.healthDelta !== 0 && (
                <p className={`text-xs font-mono ${outcome.healthDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {outcome.healthDelta > 0 ? '+' : ''}{outcome.healthDelta} health
                </p>
              )}
              {outcome.reputationDelta && outcome.reputationDelta > 0 && (
                <p className="text-amber-400 text-xs font-mono">+{outcome.reputationDelta} reputation</p>
              )}
              {outcome.itemGained && (
                <p className="text-green-400 text-xs font-mono">Found: {outcome.itemGained.replace(/_/g, ' ')}</p>
              )}
              {outcome.discoveredLocation && (
                <p className="text-amber-400 text-xs font-mono">Location discovered!</p>
              )}
            </div>

            <button
              onClick={handleContinueAfterOutcome}
              className="w-full py-3 bg-green-900/50 hover:bg-green-800/60 text-green-300 font-mono text-xs rounded border border-green-700/40 transition-colors"
            >
              CONTINUE JOURNEY
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Arriving screen
  if (phase === 'arriving') {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">{toLoc?.icon}</span>
          <p className="text-amber-400 font-pixel text-lg mt-4">ARRIVING AT</p>
          <p className="text-green-300 font-pixel text-xl mt-1">{toLoc?.name}</p>
          <p className="text-green-700 text-xs font-mono mt-2 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}

export default GoldCountryTravel
