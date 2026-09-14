'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { getGoldCountryLocation } from '../data/goldCountryLocations'
import { TRAVEL_ENCOUNTERS, type EncounterChoice } from '../data/goldCountryEncounters'
import { goldCountryTravelTick } from '@/lib/goldCountryTravelTick'
import { GoldCountryCalendar, formatTravelMinutes } from './GoldCountryTransportChoices'
import type { GoldCountryTripResult } from '../state/goldCountryTrip'

interface GoldCountryTravelProps {
  fromLocationId: string
  toLocationId: string
  onArrive: (locationId: string) => GoldCountryTripResult
  onReturnToMap: () => GoldCountryTripResult
}

type TravelPhase = 'departing' | 'traveling' | 'encounter' | 'outcome' | 'arriving'

export function GoldCountryTravel({
  fromLocationId,
  toLocationId,
  onArrive,
  onReturnToMap,
}: GoldCountryTravelProps) {
  const { state, resumeGoldCountryTravel, chooseGoldCountryRoadEncounter, continueGoldCountryRoadEncounter } = useOregonTrail()
  const { isInitialized } = useKarmaWallet()
  const trip = state.goldCountryTrip
  const [selectedPhase, setPhase] = useState<TravelPhase>(trip?.roadChoiceId && !trip.roadOutcomeAcknowledged ? 'outcome' : 'departing')
  const [travelProgress, setTravelProgress] = useState(0)
  const [error, setError] = useState('')
  const [resuming, setResuming] = useState(false)
  const encounter = TRAVEL_ENCOUNTERS.find(item => item.id === trip?.roadEncounterId) ?? null
  const outcome = encounter?.choices.find(choice => choice.id === trip?.roadChoiceId)?.outcome ?? null
  const phase: TravelPhase = selectedPhase === 'traveling' && travelProgress >= 50 && encounter && !trip?.roadOutcomeAcknowledged
    ? trip?.roadChoiceId ? 'outcome' : 'encounter'
    : selectedPhase === 'traveling' && travelProgress >= 100 ? 'arriving' : selectedPhase
  const fromLoc = getGoldCountryLocation(fromLocationId)
  const toLoc = getGoldCountryLocation(toLocationId)

  const showError = (result: GoldCountryTripResult) => {
    if (result.ok) { setError(''); return }
    setError(result.reason === 'storage' ? 'The journey could not be saved. Free some browser storage and retry; your saved ticket is kept.'
      : result.reason === 'funds' ? 'There are not enough tacos for the saved fare. You can turn back to the departure town.'
        : result.reason === 'conflict' ? 'This fare has already been paid. Resume the saved ticket before continuing.'
          : 'This journey cannot continue from the current state.')
  }

  const resume = useCallback(async () => {
    setResuming(true)
    const result = await resumeGoldCountryTravel()
    if (!result.ok) setError(result.reason === 'funds' ? 'There are not enough tacos for the saved fare. Turn back to the departure town.'
      : 'The paid ticket could not be saved. Your journey is kept; retry when browser storage is available.')
    else setError('')
    setResuming(false)
  }, [resumeGoldCountryTravel])

  useEffect(() => {
    if (trip?.status !== 'planned' || !isInitialized) return
    const timer = setTimeout(() => void resume(), 0)
    return () => clearTimeout(timer)
  }, [trip?.id, trip?.status, isInitialized, resume])

  useEffect(() => {
    if (phase !== 'departing' || trip?.status !== 'paid') return
    const timer = setTimeout(() => setPhase('traveling'), 1000)
    return () => clearTimeout(timer)
  }, [phase, trip?.status])

  // The existing animation remains cosmetic. Time is committed only by the
  // existing arrival action, with a saved trip ID guarding duplicates/reloads.
  useEffect(() => {
    if (phase !== 'traveling' || trip?.status !== 'paid') return
    const interval = setInterval(() => setTravelProgress(prev => goldCountryTravelTick(prev).next), 100)
    return () => clearInterval(interval)
  }, [phase, trip?.status])

  useEffect(() => {
    if (phase !== 'arriving' || error) return
    const timer = setTimeout(() => {
      const result = onArrive(toLocationId)
      if (!result.ok) setError('Arrival could not be saved. Your paid ticket is kept; retry when browser storage is available.')
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, error, toLocationId, onArrive])

  const handleEncounterChoice = (choice: EncounterChoice) => {
    const result = chooseGoldCountryRoadEncounter(choice.id)
    showError(result)
    if (result.ok) setPhase('outcome')
  }
  const handleContinueAfterOutcome = () => {
    const result = continueGoldCountryRoadEncounter()
    showError(result)
    if (result.ok) { setTravelProgress(50); setPhase('traveling') }
  }
  const turnBack = () => showError(onReturnToMap())
  const notice = error && <p role="alert" className="text-amber-200 text-sm my-3">{error}</p>
  const ticket = trip && <div className="my-3 space-y-1" data-testid="saved-transport-ticket">
    <GoldCountryCalendar />
    <p className="text-amber-200 text-sm capitalize">{trip.quote.mode === 'wagon' && state.oxen <= 0 ? 'On foot' : trip.quote.mode} · {trip.quote.fare ? `${trip.quote.fare} tacos` : 'no fare'} · {formatTravelMinutes(trip.quote.durationMinutes)}</p>
    <p className="text-green-300 text-sm" data-testid="transport-luck-outcome">{trip.quote.message}</p>
  </div>

  if (!trip) return <div className="west-face-shell min-h-screen p-6"><p className="west-face-body">There is no saved journey here.</p><button type="button" className="west-face-pill min-h-11 mt-3" onClick={turnBack}>Return to map</button>{notice}</div>
  if (trip.status === 'planned') return <div className="west-face-shell min-h-screen p-6" data-testid="transport-payment-pending">
    <div className="max-w-lg mx-auto"><h1 className="west-face-title text-2xl">Your journey is reserved</h1>{ticket}
      <p className="west-face-body">The fare must be saved before departure. A paid ticket is reused when you resume.</p>
      {!isInitialized && <p role="status" className="west-face-body mt-2">Your wallet has not been loaded. You can turn back without a new charge.</p>}
      {notice}
      <button type="button" className="west-face-pill min-h-11 mt-3" disabled={resuming || !isInitialized} onClick={() => void resume()}>{resuming ? 'Saving ticket…' : 'Retry saved ticket'}</button>
      <button type="button" className="west-face-pill min-h-11 mt-3 ml-2" disabled={resuming} onClick={turnBack}>Turn back</button>
    </div>
  </div>

  // Departing screen
  if (phase === 'departing') {
    return (
      <div className="west-face-shell min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-green-700 text-xs font-mono mb-2">DEPARTING</p>
          <p className="text-amber-400 font-pixel text-lg">{fromLoc?.name || fromLocationId}</p>
          {ticket}{notice}
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
      <div className="west-face-shell min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <p className="text-green-700 text-xs font-mono mb-2">TRAVELING</p>
            <p className="text-amber-400 font-pixel text-sm">
              {fromLoc?.shortName} &rarr; {toLoc?.shortName}
            </p>
          </div>

          {ticket}{notice}
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
              {trip.quote.mode !== 'wagon' ? trip.quote.message : travelProgress < 30
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
            onClick={turnBack}
            className="w-full mt-8 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-500 text-xs font-mono rounded border border-red-800/40 transition-colors"
          >
            {trip.quote.fare ? 'TURN BACK · FARE NOT REFUNDED' : 'TURN BACK'}
          </button>
        </div>
      </div>
    )
  }

  // Encounter screen
  if (phase === 'encounter' && encounter) {
    return (
      <div className="west-face-shell min-h-screen flex items-center justify-center">
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

            {notice}
            {/* Choices */}
            <div className="space-y-3">
              {encounter.choices.filter(choice => !choice.requiresItem || state.inventory.includes(choice.requiresItem)).map(choice => (
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
      <div className="west-face-shell min-h-screen flex items-center justify-center">
        <div className="max-w-lg w-full p-4">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-4 text-center">OUTCOME</h2>

            <div className="bg-black/40 border border-green-800/30 rounded p-4 mb-4">
              <p className="text-green-300 text-sm leading-relaxed">{outcome.message}</p>
            </div>

            {notice}
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
      <div className="west-face-shell min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">{toLoc?.icon}</span>
          <p className="text-amber-400 font-pixel text-lg mt-4">ARRIVING AT</p>
          <p className="text-green-300 font-pixel text-xl mt-1">{toLoc?.name}</p>
          {ticket}{notice}
          {error ? <button type="button" className="west-face-pill min-h-11 mt-3" onClick={() => showError(onArrive(toLocationId))}>Retry arrival</button>
            : <p className="text-green-700 text-xs font-mono mt-2 animate-pulse">Saving arrival...</p>}
        </div>
      </div>
    )
  }

  return null
}

export default GoldCountryTravel
