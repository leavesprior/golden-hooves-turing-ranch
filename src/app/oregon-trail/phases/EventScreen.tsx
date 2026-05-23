'use client'

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useCharacter } from '../characterContext'
import { useNarrator } from '../narratorContext'
import { KarmaToastContainer } from '@/components/karma'
import { getCriticalDescription } from '../data/criticalDescriptions'
import { getEventVariant } from '../data/statEventVariants'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export interface EventScreenProps {
  setLastStatVariant: (v: { stat: string; threshold: 'high' | 'low' } | null) => void
}

export function EventScreen({ setLastStatVariant }: EventScreenProps) {
  const { state, handleEventChoice } = useOregonTrail()
  const { earnNeutral, spendNeutral, earnGood, addBadKarma } = useKarmaWallet()
  const { getStat } = useCharacter()
  const { comment } = useNarrator()

  // Panning result state for showing roll results
  const [panningResult, setPanningResult] = useState<{
    roll: number
    luckBonus: number
    total: number
    reward: number
    message: string
  } | null>(null)

  // Wrapper to handle event choice AND apply karma deltas from outcomes
  const handleEventChoiceWithKarma = useCallback(async (choiceId: string) => {
    if (!state.currentEvent) return

    const choice = state.currentEvent.choices.find(c => c.id === choiceId)
    if (!choice) return

    // SPECIAL HANDLING: Panning for gold uses dice roll + Luck
    if (state.currentEvent.id === 'found_gold' && choiceId === 'pan') {
      const luck = getStat('Luck')
      const roll = Math.floor(Math.random() * 20) + 1  // d20 // safe-mint: game-event roll, not a booking code
      const luckBonus = Math.floor((luck - 10) / 2)    // D&D-style modifier
      const total = roll + luckBonus

      let reward = 0
      let message = ''

      if (roll === 20) {
        // Natural 20 - jackpot!
        reward = 100 + (luck * 5)
        const critDesc = getCriticalDescription(true, 'gambling', undefined, 'Luck')
        message = `${critDesc} JACKPOT! Natural 20! You strike a rich vein! (+${reward}🌮)`
        comment("The narrator has witnessed many fortunes found and lost. This one sparkles with promise.", 'observation')
      } else if (total >= 18) {
        // Excellent find
        reward = 60 + Math.floor(Math.random() * 30) // safe-mint: in-game taco reward only, not redeemable value
        message = `Excellent! You find several quality nuggets! (+${reward}🌮)`
      } else if (total >= 12) {
        // Decent find
        reward = 25 + Math.floor(Math.random() * 20) // safe-mint: in-game taco reward only, not redeemable value
        message = `Not bad! You find some flakes and a small nugget. (+${reward}🌮)`
      } else if (total >= 6) {
        // Poor find
        reward = 5 + Math.floor(Math.random() * 10) // safe-mint: in-game taco reward only, not redeemable value
        message = `Slim pickings. Just a few flakes of color. (+${reward}🌮)`
      } else {
        // Nothing
        reward = 0
        message = roll === 1
          ? `${getCriticalDescription(false, 'gambling')} Critical fail! You slip and soak yourself. Nothing found.`
          : `The stream bed yields nothing but mud and disappointment.`
        comment("Fortune favors the bold, but today she merely watches.", 'observation')
      }

      // Show result briefly
      setPanningResult({ roll, luckBonus, total, reward, message })
      setTimeout(() => setPanningResult(null), 4000)

      // Apply the event choice (for day lost, etc.)
      handleEventChoice(choiceId)

      // Apply the rolled karma reward
      if (reward > 0) {
        await earnNeutral(reward, `Panning: ${message}`)
      }
      return
    }

    // Standard event handling — pass stat-variant outcome override if available
    const variantStats = {
      Shrewdness: getStat('Shrewdness'), Agility: getStat('Agility'),
      Durability: getStat('Durability'), Diplomacy: getStat('Diplomacy'),
      Luck: getStat('Luck'), Expertise: getStat('Expertise'),
    }
    const variant = getEventVariant(state.currentEvent.id, variantStats)
    const outcomeOverride = variant?.outcomeOverrides?.[choiceId]
    handleEventChoice(choiceId, outcomeOverride)

    // Record which stat variant fired so the outcome screen can badge it
    if (variant) {
      setLastStatVariant({ stat: variant.stat, threshold: variant.threshold })
      // Auto-clear after 8 seconds so it doesn't linger forever
      setTimeout(() => setLastStatVariant(null), 8000)
    } else {
      setLastStatVariant(null)
    }

    // Apply karma wallet changes from the outcome
    const outcome = choice.outcome
    if (outcome.neutralKarmaDelta) {
      if (outcome.neutralKarmaDelta > 0) {
        await earnNeutral(outcome.neutralKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
      } else {
        await spendNeutral(Math.abs(outcome.neutralKarmaDelta), `${state.currentEvent.title}: ${choice.text}`)
      }
    }
    if (outcome.goodKarmaDelta && outcome.goodKarmaDelta > 0) {
      await earnGood(outcome.goodKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
    }
    if (outcome.badKarmaDelta && outcome.badKarmaDelta > 0) {
      await addBadKarma(outcome.badKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
    }

    // Log world event for cross-game narrator
    const karmaDelta = (outcome.neutralKarmaDelta || 0) + (outcome.goodKarmaDelta || 0) - (outcome.badKarmaDelta || 0)
    const isGreedy = karmaDelta < -10 || (outcome.badKarmaDelta && outcome.badKarmaDelta > 5)
    const isGenerous = karmaDelta > 10 || (outcome.goodKarmaDelta && outcome.goodKarmaDelta > 5)
    CrossGameStorage.logEvent(
      'prospectors_tale',
      isGreedy ? 'greedy_hoarding' : isGenerous ? 'generous_sharing' : 'custom',
      `${state.currentEvent.title}: ${choice.text}`,
      { karmaDelta, locationId: state.currentLandmark?.toLowerCase().replace(/[^a-z]/g, '_'), detail: outcome.message }
    )
  }, [state.currentEvent, handleEventChoice, earnNeutral, spendNeutral, earnGood, addBadKarma, getStat, comment, setLastStatVariant])

  if (!state.currentEvent) return null

  // Show panning hint for gold event
  const isPanningEvent = state.currentEvent.id === 'found_gold'
  const luckStat = getStat('Luck')
  const luckMod = Math.floor((luckStat - 10) / 2)

  // Check for stat-keyed event variant (Improvement #1: Fallout-style stat awareness)
  const playerStats = {
    Shrewdness: getStat('Shrewdness'),
    Agility: getStat('Agility'),
    Durability: getStat('Durability'),
    Diplomacy: getStat('Diplomacy'),
    Luck: getStat('Luck'),
    Expertise: getStat('Expertise'),
  }
  const eventVariant = getEventVariant(state.currentEvent.id, playerStats)
  const eventDescription = eventVariant?.description ?? state.currentEvent.description

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
      <KarmaToastContainer />
      <div className="max-w-md w-full bg-amber-900/80 border-4 border-amber-600 rounded-lg p-6">
        <h2 className="font-pixel text-amber-200 text-lg mb-4 text-center">
          {state.currentEvent.title}
        </h2>
        {eventVariant && (
          <p className="text-center mb-2">
            {eventVariant.threshold === 'high' ? (
              <span className="inline-flex items-center gap-1 text-xs bg-green-900/70 text-green-300 px-2 py-0.5 rounded border border-green-600 font-bold tracking-wide">
                {'\u25b2'} HIGH {eventVariant.stat.toUpperCase()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-red-900/70 text-red-300 px-2 py-0.5 rounded border border-red-700 font-bold tracking-wide">
                {'\u25bc'} LOW {eventVariant.stat.toUpperCase()}
              </span>
            )}
            <span className="text-amber-600 text-[10px] ml-2 italic">
              {eventVariant.threshold === 'high'
                ? `Your ${eventVariant.stat} gives you an edge`
                : `Your low ${eventVariant.stat} changes how this plays out`}
            </span>
          </p>
        )}
        <p className="text-amber-300 text-sm mb-6 text-center">
          {eventDescription}
        </p>

        {/* Panning stat hint */}
        {isPanningEvent && (
          <div className="mb-4 p-2 bg-yellow-900/40 border border-yellow-600 rounded text-center">
            <span className="text-yellow-300 text-xs">
              🎲 Panning uses d20 + Luck modifier ({luckMod >= 0 ? '+' : ''}{luckMod})
            </span>
          </div>
        )}

        <div className="space-y-3">
          {state.currentEvent.choices.map(choice => {
            const choiceText = eventVariant?.choiceOverrides?.[choice.id] ?? choice.text
            return (
            <button
              key={choice.id}
              onClick={() => handleEventChoiceWithKarma(choice.id)}
              className="w-full p-3 bg-amber-800/60 hover:bg-amber-700/60 border-2 border-amber-600 rounded text-amber-200 font-pixel text-xs text-left transition-colors"
            >
              {choiceText}
              {((choice.karmaLawful !== undefined && choice.karmaLawful !== 0) || (choice.karmaGood !== undefined && choice.karmaGood !== 0)) && (
                <span className="block mt-1 text-[10px] text-amber-500">
                  {choice.karmaLawful !== undefined && choice.karmaLawful !== 0 && (choice.karmaLawful < 0 ? '\u2696 Lawful' : '\ud83c\udf00 Chaotic')}
                  {choice.karmaGood !== undefined && choice.karmaGood !== 0 && (choice.karmaGood < 0 ? ' \u2728 Good' : ' \ud83d\udd25 Evil')}
                </span>
              )}
            </button>
            )
          })}
        </div>
      </div>

      {/* Panning Result Overlay */}
      {panningResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-amber-900 border-4 border-yellow-500 rounded-lg p-6 max-w-sm text-center animate-pulse">
            <div className="text-4xl mb-3">⛏️🎲</div>
            <div className="text-yellow-300 font-pixel text-lg mb-2">
              Roll: {panningResult.roll} {panningResult.luckBonus >= 0 ? '+' : ''}{panningResult.luckBonus} = {panningResult.total}
            </div>
            <div className={`text-lg font-bold mb-2 ${
              panningResult.reward >= 60 ? 'text-yellow-300' :
              panningResult.reward >= 25 ? 'text-green-300' :
              panningResult.reward > 0 ? 'text-amber-300' :
              'text-gray-400'
            }`}>
              {panningResult.message}
            </div>
            {panningResult.roll === 20 && (
              <div className="text-yellow-400 text-2xl">✨ CRITICAL SUCCESS! ✨</div>
            )}
            {panningResult.roll === 1 && (
              <div className="text-red-400 text-sm">💀 Critical Fail</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
