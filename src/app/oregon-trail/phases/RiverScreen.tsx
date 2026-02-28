'use client'

import { useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useNarrator } from '../narratorContext'
import { RiverCrossing } from '../components/RiverCrossing'
import { type CrossingOutcome } from '../data/riverCrossings'

export function RiverScreen() {
  const { state, applyRiverCrossingEffects } = useOregonTrail()
  const { earnNeutral, earnGood, addBadKarma } = useKarmaWallet()
  const { comment } = useNarrator()

  const handleRiverCrossingComplete = useCallback(async (success: boolean, effects: CrossingOutcome['effects']) => {
    // Apply karma changes from crossing
    if (effects.karmaChange) {
      if (effects.karmaChange.neutral && effects.karmaChange.neutral > 0) {
        await earnNeutral(effects.karmaChange.neutral, 'River crossing bonus')
      }
      if (effects.karmaChange.good && effects.karmaChange.good > 0) {
        await earnGood(effects.karmaChange.good, 'River crossing virtue')
      }
      if (effects.karmaChange.bad && effects.karmaChange.bad > 0) {
        await addBadKarma(effects.karmaChange.bad, 'River crossing mishap')
      }
    }

    // Narrator comment based on outcome
    if (success) {
      comment("The river is behind you. The frontier doesn't offer many such clean victories.", 'observation')
    } else {
      comment("The river extracts its toll. It always does, one way or another.", 'warning')
    }

    // Generate outcome message
    const outcomeMessage = success
      ? 'Crossed safely! The journey continues.'
      : 'The crossing took its toll. Some supplies were lost.'

    // Apply all effects to game state and return to traveling
    applyRiverCrossingEffects(effects, outcomeMessage)
  }, [earnNeutral, earnGood, addBadKarma, comment, applyRiverCrossingEffects])

  return (
    <RiverCrossing
      riverName={state.currentLandmark}
      weather={state.weather}
      dayOfYear={state.day % 365}
      onComplete={handleRiverCrossingComplete}
    />
  )
}
