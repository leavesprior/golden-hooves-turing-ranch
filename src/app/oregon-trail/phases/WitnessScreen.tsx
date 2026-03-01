'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { useMystery } from '../mysteryContext'
import { useCharacter } from '../characterContext'
import { WitnessDialogue } from '../components/WitnessDialogue'
import { type WitnessType } from '../data/clueTemplates'

export function WitnessScreen() {
  const { state, closeWitnessDialogue } = useOregonTrail()
  const { generateClueForWitness, addClue } = useMystery()

  const witnessType = state.investigation.activeWitness as WitnessType | null

  if (!witnessType) {
    return null
  }

  // Generate a clue for this witness (Bounty Hunter mode - always available)
  const witnessClue = generateClueForWitness(witnessType, state.currentLandmark)

  return (
    <WitnessDialogue
      witnessType={witnessType}
      location={state.currentLandmark}
      clue={witnessClue}
      onClose={closeWitnessDialogue}
      onClueObtained={(clue) => {
        addClue(clue)
      }}
    />
  )
}
