'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { useMystery } from '../mysteryContext'
import { WitnessDialogue } from '../components/WitnessDialogue'
import { type WitnessType } from '../data/clueTemplates'
import { getNPCById, type GoldCountryWitnessType } from '../data/goldCountryNPCs'

/**
 * Coerce a GoldCountryNPC's (superset) witnessType down to a base trail WitnessType,
 * so the existing scripted dialogue-tree machinery (WITNESS_DIALOGUES, personalities,
 * labels) resolves and never crashes. The NPC's own name/portrait/voice come through
 * the `npc` prop; this only feeds the scripted floor + skill-check plumbing.
 */
const WITNESS_TYPE_COERCION: Record<GoldCountryWitnessType, WitnessType> = {
  bartender: 'bartender',
  shopkeeper: 'shopkeeper',
  stable_hand: 'stable_hand',
  traveler: 'traveler',
  settler: 'settler',
  native_trader: 'native_trader',
  telegraph_operator: 'telegraph_operator',
  sheriff_deputy: 'sheriff_deputy',
  prostitute: 'prostitute',
  preacher: 'preacher',
  drunk: 'drunk',
  child: 'child',
  // Gold Country additions → nearest base trail type
  innkeeper: 'bartender',
  miner: 'settler',
  townfolk: 'settler',
  merchant: 'shopkeeper',
  lawman: 'sheriff_deputy',
  scholar: 'settler',
}

export function WitnessScreen() {
  const { state, closeWitnessDialogue } = useOregonTrail()
  const { generateClueForWitness, addClue } = useMystery()

  const activeWitness = state.investigation.activeWitness
  const activeNpcId = state.investigation.activeNpcId ?? null

  if (!activeWitness) {
    return null
  }

  // If a real GoldCountryNPC is the witness, resolve it and coerce its witnessType for
  // the scripted machinery; otherwise activeWitness is already a base WitnessType string.
  const npc = activeNpcId ? getNPCById(activeNpcId) : undefined
  const witnessType: WitnessType = npc
    ? WITNESS_TYPE_COERCION[npc.witnessType]
    : (activeWitness as WitnessType)

  // Grounded clue when the NPC has an investigationClue; else the random generator.
  const witnessClue = generateClueForWitness(witnessType, state.currentLandmark, activeNpcId)

  return (
    <WitnessDialogue
      witnessType={witnessType}
      location={state.currentLandmark}
      npc={npc}
      clue={witnessClue}
      onClose={closeWitnessDialogue}
      onClueObtained={(clue) => {
        addClue(clue)
      }}
    />
  )
}
