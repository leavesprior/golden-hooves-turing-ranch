'use client'

import React from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import { useAuth } from '@/lib/authContext'
import { useSaveLoad } from '@/lib/saveLoadContext'
import { applyLevel2Persist, snapshotLevel2Persist } from '@/lib/goldCountryStreet'

export function SaveLoadIntegration() {
  const { state, loadState } = useOregonTrail()
  const { user } = useAuth()
  const { setGameDataCollector, setGameDataLoader, setMetadataCollector, setActiveGameType, enableAutoSave } = useSaveLoad()
  const { balance, alignment, getAlignmentDisplayName, loadKarmaState } = useKarmaWallet()
  const { state: mysteryState, loadMysteryState } = useMystery()

  // Declare ownership: every slot saved while Oregon Trail is mounted is
  // stamped 'oregon-trail' so other games' title screens never load it (C2).
  React.useEffect(() => {
    setActiveGameType('oregon-trail')
  }, [setActiveGameType])

  // Set up save data collector — skip during title/chapter_intro phases
  React.useEffect(() => {
    if (!user) return

    // Gate auto-save: don't collect data during invalid phases
    const isValidPhase = state.phase !== 'title' && state.phase !== 'chapter_intro'

    setGameDataCollector(() => {
      if (!isValidPhase) return {} // Return empty — saveGame will still work but data is minimal
      return {
        oregonTrail: state,
        karmaBalance: balance,
        karmaAlignment: alignment,
        mysteryState: {
          educationalCluesCollected: mysteryState.educationalCluesCollected,
          activeCase: mysteryState.activeCase,
          activeCaseData: mysteryState.activeCaseData,
          casesSolved: mysteryState.casesSolved,
          hintsUsedTotal: mysteryState.hintsUsedTotal,
          currentDiscountTier: mysteryState.currentDiscountTier,
          collectedClues: mysteryState.collectedClues,
          knownTraits: mysteryState.knownTraits,
          currentOutlaw: mysteryState.currentOutlaw,
          outlawsCaught: mysteryState.outlawsCaught,
          outlawsEscaped: mysteryState.outlawsEscaped,
          totalBountyEarned: mysteryState.totalBountyEarned,
          notebookEntries: mysteryState.notebookEntries,
        },
        level2: snapshotLevel2Persist(),
      }
    })

    setMetadataCollector(() => ({
      dayNumber: state.day,
      distance: state.distance,
      currentLocation: state.currentLandmark,
      partySize: state.party.length,
      karmaAlignment: getAlignmentDisplayName(),
      playTime: state.daysOnTrail * 24, // Rough estimate
    }))

    // Set up game data loader for restoring saved games
    setGameDataLoader((data) => {
      if (data.oregonTrail) {
        loadState(data.oregonTrail as typeof state)
      }
      // Restore karma balance and alignment
      if (data.karmaBalance) {
        loadKarmaState(
          data.karmaBalance as import('@/lib/karmaBlockchain').KarmaBalance,
          data.karmaAlignment as { lawfulChaotic: number; goodEvil: number } | undefined,
        )
      }
      // Restore mystery/investigation state
      if (data.mysteryState) {
        loadMysteryState(data.mysteryState as Partial<import('../mysteryContext').MysteryState>)
      }
      if (data.level2) {
        applyLevel2Persist(data.level2 as import('@/lib/goldCountryStreet').Level2Persist)
      }
    })
  }, [user, state, balance, alignment, mysteryState, setGameDataCollector, setGameDataLoader, setMetadataCollector, getAlignmentDisplayName, loadState, loadKarmaState, loadMysteryState, enableAutoSave])

  return null
}
