/**
 * act5GateStore — Zustand slice for the Hidden Act 5 (Golden Frog Codex) gate.
 *
 * State machine (per cipher spec §7):
 *   IDLE
 *     └─► ALTAR_AVAILABLE   (all 4 artifacts collected)
 *           └─► ALTAR_ACTIVE    (pulque-night scene entered in Tenochtitlan)
 *                 └─► CIPHER_SOLVED  (4 artifacts aligned + COMBINE pressed)
 *                       └─► ACT5_UNLOCKED  (dawn timestep at Templo Mayor)
 *
 * Transitions are intentionally explicit rather than auto-derived so the
 * narrative beats stay under designer control. `transition()` does not enforce
 * validity — callers are expected to drive the machine from gameplay events.
 *
 * `collectArtifact` is de-duplicating and automatically promotes IDLE ->
 * ALTAR_AVAILABLE once all four artifacts are in the collection.
 *
 * This slice is intentionally free of persistence, side effects, and
 * references to other game stores so it can be dropped into Phase 8
 * integration without entanglement.
 */

import { create } from 'zustand'

export const ARTIFACT_IDS = [
  'norse_sunwheel',
  'miss_gorget',
  'chumash_stone',
  'inca_chakana',
] as const

export type ArtifactId = (typeof ARTIFACT_IDS)[number]

export type Act5State =
  | 'IDLE'
  | 'ALTAR_AVAILABLE'
  | 'ALTAR_ACTIVE'
  | 'CIPHER_SOLVED'
  | 'ACT5_UNLOCKED'

export interface Act5GateSlice {
  state: Act5State
  collectedArtifacts: ArtifactId[]
  transition: (newState: Act5State) => void
  collectArtifact: (id: ArtifactId) => void
  /** Test-only hook; not wired into production gameplay. */
  reset: () => void
}

const INITIAL: Pick<Act5GateSlice, 'state' | 'collectedArtifacts'> = {
  state: 'IDLE',
  collectedArtifacts: [],
}

export const useAct5GateStore = create<Act5GateSlice>((set) => ({
  ...INITIAL,

  transition: (newState) => set({ state: newState }),

  collectArtifact: (id) =>
    set((prev) => {
      if (prev.collectedArtifacts.includes(id)) return prev
      const next = [...prev.collectedArtifacts, id]
      const allFour =
        next.length === ARTIFACT_IDS.length &&
        ARTIFACT_IDS.every((a) => next.includes(a))
      return {
        collectedArtifacts: next,
        state: allFour && prev.state === 'IDLE' ? 'ALTAR_AVAILABLE' : prev.state,
      }
    }),

  reset: () => set({ ...INITIAL }),
}))
