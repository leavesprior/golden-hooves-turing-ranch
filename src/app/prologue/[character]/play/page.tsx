'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { usePrologue, type PrologueCharacterId, type ActId } from '../../prologueContext'
import { useKarma } from '@/lib/karmaContext'
import { useCharacter, type StatName } from '@/app/oregon-trail/characterContext'
import { CrossGameStorage, qualitiesFromSaddle } from '@/lib/crossGameProgression'

// Location data
import { NORSEMAN_LOCATIONS } from '../../data/locations/norseman'
import { NATIVE_LOCATIONS } from '../../data/locations/native'
import { CALIFIA_LOCATIONS } from '../../data/locations/califia'
import { INCAN_LOCATIONS } from '../../data/locations/incan'
import type { PrologueLocation } from '../../data/locations/norseman'

// Investigation data
import { PROLOGUE_ARTIFACTS, getArtifactsByLocation } from '../../data/clues/artifactTraits'
import { WITNESS_TYPES } from '../../data/clues/witnessTypes'

// Puzzle data
import { getPuzzleObjectsByCharacter } from '../../data/puzzles/puzzleObjects'
import { ALL_TRANSFORMATIONS, getApplicableTransformations } from '../../data/puzzles/puzzleTransformations'

// Components
import { LocationMap } from '@/components/prologue/LocationMap'
import { ArtifactMatrix, type TraitCategory, type ArtifactTraits } from '@/components/prologue/ArtifactMatrix'
import { CulturalInteraction, type WitnessType as CulturalWitnessType } from '@/components/prologue/CulturalInteraction'
import { PuzzleWorkbench, type PuzzleObject } from '@/components/prologue/PuzzleWorkbench'
import { GuidePanel } from '@/components/prologue/GuidePanel'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLocationsForCharacter(characterId: PrologueCharacterId): PrologueLocation[] {
  switch (characterId) {
    case 'norseman': return NORSEMAN_LOCATIONS
    case 'native': return NATIVE_LOCATIONS
    case 'califia': return CALIFIA_LOCATIONS
    case 'incan': return INCAN_LOCATIONS
    default: return []
  }
}

function buildConnections(locations: PrologueLocation[]): [string, string][] {
  const seen = new Set<string>()
  const connections: [string, string][] = []
  for (const loc of locations) {
    for (const target of loc.connectedTo) {
      const key = [loc.id, target].sort().join('|')
      if (!seen.has(key)) {
        seen.add(key)
        connections.push([loc.id, target])
      }
    }
  }
  return connections
}

function characterToAct(characterId: PrologueCharacterId): ActId {
  switch (characterId) {
    case 'norseman': return 'act_i'
    case 'native': return 'act_ii'
    case 'califia': return 'act_iii'
    case 'incan': return 'act_iv'
  }
}

// Seeded random for consistent witness selection per location
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 1000) / 1000
}

function selectWitnesses(witnessPool: typeof WITNESS_TYPES[string][], locationId: string, maxCount: number): typeof WITNESS_TYPES[string][] {
  if (witnessPool.length <= maxCount) return witnessPool
  // Use location ID as seed for consistent selection
  const sorted = [...witnessPool].sort((a, b) => {
    const ra = seededRandom(locationId + a.id)
    const rb = seededRandom(locationId + b.id)
    return ra - rb
  })
  return sorted.slice(0, maxCount)
}

// ─── Episode gate conditions ────────────────────────────────────────────────

const EPISODE_GATES: Record<PrologueCharacterId, { episodeId: string; condition: (gs: GameplayState) => boolean; label: string }[]> = {
  norseman: [
    { episodeId: 'act_i_ep_1', condition: (gs) => gs.cluesGathered.some(c => c.includes('maine_penny')), label: 'Solve the Maine Penny mystery' },
    { episodeId: 'act_i_ep_2', condition: (gs) => gs.visitedLocationIds.some(id => id.includes('montreal') || id.includes('great_lakes')), label: 'Reach Montreal or the Great Lakes' },
    { episodeId: 'act_i_ep_3', condition: (gs) => gs.visitedLocationIds.some(id => id.includes('cahokia')), label: 'Reach Cahokia' },
  ],
  native: [
    { episodeId: 'act_ii_ep_1', condition: (gs) => gs.cluesGathered.length >= 3, label: 'Gather 3 clues' },
    { episodeId: 'act_ii_ep_2', condition: (gs) => gs.visitedLocationIds.length >= 5, label: 'Visit 5 locations' },
    { episodeId: 'act_ii_ep_3', condition: (gs) => gs.cluesGathered.length >= 8, label: 'Gather 8 clues' },
  ],
  califia: [
    { episodeId: 'act_iii_ep_1', condition: (gs) => gs.cluesGathered.length >= 3, label: 'Gather 3 clues' },
    { episodeId: 'act_iii_ep_2', condition: (gs) => gs.visitedLocationIds.length >= 5, label: 'Visit 5 locations' },
    { episodeId: 'act_iii_ep_3', condition: (gs) => gs.cluesGathered.length >= 8, label: 'Gather 8 clues' },
  ],
  incan: [
    { episodeId: 'act_iv_ep_1', condition: (gs) => gs.cluesGathered.length >= 3, label: 'Gather 3 clues' },
    { episodeId: 'act_iv_ep_2', condition: (gs) => gs.visitedLocationIds.length >= 5, label: 'Visit 5 locations' },
    { episodeId: 'act_iv_ep_3', condition: (gs) => gs.cluesGathered.length >= 8, label: 'Gather 8 clues' },
  ],
}

const GAMEPLAY_STORAGE_KEY = 'bobr_prologue_gameplay'

interface GameplayState {
  currentLocationId: string
  discoveredLocationIds: string[]
  visitedLocationIds: string[]
  inventoryObjectIds: string[]
  objectStates: Record<string, Record<string, boolean>>
  revealedTraits: string[]  // TraitCategory[]
  activeArtifactId: string | null
  witnessesInterviewed: string[]
  cluesGathered: string[]
  dayNumber: number
  actionsRemaining: number
  // Puzzle chain tracking
  activePuzzleChain: string | null
  puzzleChainStep: number
  puzzleChainsCompleted: string[]
  // Episode tracking
  completedEpisodes: string[]
  // Witness selections per location (for consistency)
  witnessSelections: Record<string, string[]>
  // Fylguir spirit (Norseman-only)
  fylguirTarget: string | null
  // Identified artifacts (so fallback skips them)
  identifiedArtifactIds: string[]
}

function loadGameplayState(characterId: string): GameplayState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GAMEPLAY_STORAGE_KEY + '_' + characterId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Backfill fields added after initial release
    if (!parsed.identifiedArtifactIds) parsed.identifiedArtifactIds = []
    // Migrate older saves
    return {
      ...parsed,
      activePuzzleChain: parsed.activePuzzleChain ?? null,
      puzzleChainStep: parsed.puzzleChainStep ?? 0,
      puzzleChainsCompleted: parsed.puzzleChainsCompleted ?? [],
      completedEpisodes: parsed.completedEpisodes ?? [],
      witnessSelections: parsed.witnessSelections ?? {},
      fylguirTarget: parsed.fylguirTarget ?? null,
    }
  } catch { return null }
}

function saveGameplayState(characterId: string, state: GameplayState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GAMEPLAY_STORAGE_KEY + '_' + characterId, JSON.stringify(state))
}

// ─── SADDLE Stat Display ─────────────────────────────────────────────────────

const STAT_COLORS: Record<StatName, string> = {
  Shrewdness: 'text-violet-400',
  Agility: 'text-blue-400',
  Durability: 'text-red-400',
  Diplomacy: 'text-emerald-400',
  Luck: 'text-amber-400',
  Expertise: 'text-orange-400',
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProloguePlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const characterId = params.character as PrologueCharacterId
  const episodeId = searchParams.get('episode') || ''

  const { state: prologueState, recordClue, recordPuzzleSolved, completeEpisode, plantTimeEcho } = usePrologue()
  const { applyKarma } = useKarma()
  const { rollSkillCheck, addExperience, getStat, addInvestigationXP, getInvestigationBonus, state: charState } = useCharacter()

  const locations = useMemo(() => getLocationsForCharacter(characterId), [characterId])
  const connections = useMemo(() => buildConnections(locations), [locations])
  const startLocation = locations[0]

  // ─── Gameplay state with localStorage persistence ─────────────────────────

  const [gameState, setGameState] = useState<GameplayState>(() => {
    const saved = loadGameplayState(characterId)
    if (saved) return saved
    return {
      currentLocationId: startLocation?.id || '',
      discoveredLocationIds: startLocation ? [startLocation.id, ...startLocation.connectedTo] : [],
      visitedLocationIds: startLocation ? [startLocation.id] : [],
      inventoryObjectIds: [],
      objectStates: {},
      revealedTraits: [],
      activeArtifactId: null,
      witnessesInterviewed: [],
      cluesGathered: [],
      dayNumber: 1,
      actionsRemaining: 10,
      activePuzzleChain: null,
      puzzleChainStep: 0,
      puzzleChainsCompleted: [],
      completedEpisodes: [],
      witnessSelections: {},
      fylguirTarget: null,
      identifiedArtifactIds: [],
    }
  })

  // Auto-save on state change
  useEffect(() => {
    saveGameplayState(characterId, gameState)
  }, [characterId, gameState])

  const [gamePhase, setGamePhase] = useState<'exploring' | 'investigating' | 'puzzling' | 'guide'>('exploring')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [witnessResponse, setWitnessResponse] = useState<string | null>(null)
  const [activeWitnessIdx, setActiveWitnessIdx] = useState<number | null>(null)
  const [showEpisodeGate, setShowEpisodeGate] = useState<string | null>(null)
  const [showSkillCheck, setShowSkillCheck] = useState<{ stat: StatName; result: string; success: boolean } | null>(null)

  // ─── Episode gate checking ────────────────────────────────────────────────

  useEffect(() => {
    const gates = EPISODE_GATES[characterId] || []
    const actId = characterToAct(characterId)
    for (const gate of gates) {
      if (gameState.completedEpisodes.includes(gate.episodeId)) continue
      if (gate.condition(gameState)) {
        // Auto-complete episode
        completeEpisode(actId, gate.episodeId)
        setGameState(prev => ({
          ...prev,
          completedEpisodes: [...prev.completedEpisodes, gate.episodeId],
        }))
        setShowEpisodeGate(gate.episodeId)
        addExperience(50)
      }
    }
  }, [gameState.cluesGathered, gameState.visitedLocationIds, characterId, completeEpisode, addExperience, gameState.completedEpisodes])

  // ─── CrossGame sync on significant actions ────────────────────────────────

  const syncCrossGame = useCallback(() => {
    if (!charState.character) return
    CrossGameStorage.updateQualities(qualitiesFromSaddle(charState.character.stats))
  }, [charState.character])

  // ─── Current location data ────────────────────────────────────────────────

  const currentLocation = useMemo(
    () => locations.find(l => l.id === gameState.currentLocationId),
    [locations, gameState.currentLocationId]
  )

  const locationArtifacts = useMemo(
    () => currentLocation ? getArtifactsByLocation(currentLocation.id) : [],
    [currentLocation]
  )

  // Location witnesses (randomized but consistent)
  const locationWitnesses = useMemo(() => {
    if (!currentLocation) return []
    const fullPool = currentLocation.witnessTypes
      .map(wt => WITNESS_TYPES[wt])
      .filter(Boolean)
    // Select 1-3 witnesses consistently
    const maxWitnesses = Math.min(3, Math.max(1, fullPool.length))
    return selectWitnesses(fullPool, currentLocation.id, maxWitnesses)
  }, [currentLocation])

  // ─── Puzzle objects adapted for PuzzleWorkbench ───────────────────────────

  const puzzleInventory: PuzzleObject[] = useMemo(() => {
    const characterObjects = getPuzzleObjectsByCharacter(characterId)
    return gameState.inventoryObjectIds
      .map(id => {
        const obj = characterObjects.find(o => o.id === id)
        if (!obj) return null
        return {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          icon: obj.icon,
          stateFlags: gameState.objectStates[obj.id] || { ...obj.initialStates },
        }
      })
      .filter((o): o is PuzzleObject => o !== null)
  }, [characterId, gameState.inventoryObjectIds, gameState.objectStates])

  const availablePuzzleActions = useMemo(() => {
    return ALL_TRANSFORMATIONS.map(t => t.name)
  }, [])

  // ─── Location map data ───────────────────────────────────────────────────

  const mapLocations = useMemo(() => {
    return locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      x: loc.x,
      y: loc.y,
      discovered: gameState.discoveredLocationIds.includes(loc.id),
      visited: gameState.visitedLocationIds.includes(loc.id),
      active: loc.id === gameState.currentLocationId,
      dangerLevel: loc.dangerLevel,
      hasClues: loc.clueIds.length > 0,
      hasPuzzle: loc.puzzleIds.length > 0,
      fylguirTarget: gameState.fylguirTarget === loc.id,
    }))
  }, [locations, gameState])

  // ─── Artifact investigation state ────────────────────────────────────────

  const activeArtifact = useMemo(() => {
    if (!gameState.activeArtifactId) return null
    return PROLOGUE_ARTIFACTS.find(a => a.id === gameState.activeArtifactId) || null
  }, [gameState.activeArtifactId])

  const artifactTraits: ArtifactTraits = useMemo(() => {
    if (!activeArtifact) {
      return { material: null, origin_culture: null, age_period: null, purpose: null, symbol_family: null, provenance: null }
    }
    const revealed = new Set(gameState.revealedTraits)
    return {
      material: revealed.has('material') ? activeArtifact.traits.material : null,
      origin_culture: revealed.has('origin_culture') ? activeArtifact.traits.originCulture : null,
      age_period: revealed.has('age_period') ? activeArtifact.traits.agePeriod : null,
      purpose: revealed.has('purpose') ? activeArtifact.traits.purpose : null,
      symbol_family: revealed.has('symbol_family') ? activeArtifact.traits.symbolFamily : null,
      provenance: revealed.has('provenance') ? activeArtifact.traits.provenance : null,
    }
  }, [activeArtifact, gameState.revealedTraits])

  // ─── Actions ─────────────────────────────────────────────────────────────

  const spendAction = useCallback((): boolean => {
    if (gameState.actionsRemaining <= 0) {
      setActionFeedback('No actions remaining today. Rest at camp to start a new day.')
      return false
    }
    setGameState(prev => ({ ...prev, actionsRemaining: prev.actionsRemaining - 1 }))
    setActionFeedback(null)
    return true
  }, [gameState.actionsRemaining])

  const handleTravel = useCallback((locationId: string) => {
    const targetLoc = locations.find(l => l.id === locationId)
    if (!targetLoc) return
    if (!spendAction()) return

    setGameState(prev => {
      const newDiscovered = new Set(prev.discoveredLocationIds)
      const newVisited = new Set(prev.visitedLocationIds)

      // Discover connected locations (fog of war)
      newDiscovered.add(locationId)
      for (const conn of targetLoc.connectedTo) {
        newDiscovered.add(conn)
      }
      newVisited.add(locationId)

      // Pick up puzzle objects at new location
      const newInventory = [...prev.inventoryObjectIds]
      const newObjectStates = { ...prev.objectStates }
      const characterObjects = getPuzzleObjectsByCharacter(characterId)
      for (const obj of characterObjects) {
        if (!newInventory.includes(obj.id)) {
          if (targetLoc.puzzleIds.some(pid => obj.id.includes(pid.replace(/_\d+$/, '')) || pid.includes(obj.id.split('_')[0]))) {
            newInventory.push(obj.id)
            newObjectStates[obj.id] = { ...obj.initialStates }
          }
        }
      }

      // Fylguir spirit mechanic (Norseman-only): after travel, Luck check for spirit clue
      let fylguirTarget = prev.fylguirTarget
      if (characterId === 'norseman' && !fylguirTarget) {
        const luckStat = getStat('Luck')
        const roll = Math.floor(Math.random() * 20) + 1
        if (roll + luckStat >= 12) {
          // Find an undiscovered location with artifacts
          const undiscovered = locations.filter(
            l => !newDiscovered.has(l.id) && getArtifactsByLocation(l.id).length > 0
          )
          if (undiscovered.length > 0) {
            fylguirTarget = undiscovered[Math.floor(Math.random() * undiscovered.length)].id
          }
        }
      }
      // Clear fylguir target if we arrived at it
      if (fylguirTarget === locationId) {
        fylguirTarget = null
      }

      return {
        ...prev,
        currentLocationId: locationId,
        discoveredLocationIds: Array.from(newDiscovered),
        visitedLocationIds: Array.from(newVisited),
        inventoryObjectIds: newInventory,
        objectStates: newObjectStates,
        fylguirTarget,
      }
    })

    // XP for travel
    addExperience(5)

    let feedback = `Traveled to ${targetLoc.name}.`
    if (targetLoc.travelTime > 3) feedback += ' A long journey.'

    // Fylguir feedback
    if (characterId === 'norseman' && gameState.fylguirTarget && gameState.fylguirTarget !== locationId) {
      const targetName = locations.find(l => l.id === gameState.fylguirTarget)?.name
      if (targetName) {
        feedback += ` A raven circles above ${targetName}...`
      }
    }

    setActionFeedback(feedback)
    setWitnessResponse(null)
    setActiveWitnessIdx(null)
  }, [locations, characterId, spendAction, addExperience, getStat, gameState.fylguirTarget])

  const handleSearchLocation = useCallback(() => {
    if (!currentLocation) return
    if (!spendAction()) return

    // Skill check: Expertise for searching
    const result = rollSkillCheck('Expertise', 8)
    const bonus = getInvestigationBonus('crimeSceneAnalysis')
    addInvestigationXP('crimeSceneAnalysis', 5)

    const characterObjects = getPuzzleObjectsByCharacter(characterId)
    const newClueIds: string[] = []

    // Compute found-something BEFORE setState to avoid React 18 closure bug
    // (setState updater is queued, not executed synchronously)
    const findBonus = result.success ? 1 : 0
    const hasNewObjects = characterObjects.some(
      obj => !gameState.inventoryObjectIds.includes(obj.id) && obj.actNumber <= Math.ceil(gameState.dayNumber / 10) + 1 + findBonus
    )
    const hasNewClues = currentLocation.clueIds.some(
      clueId => !gameState.cluesGathered.includes(clueId)
    )
    const foundSomething = hasNewObjects || hasNewClues

    setGameState(prev => {
      const newInventory = [...prev.inventoryObjectIds]
      const newObjectStates = { ...prev.objectStates }
      const newClues = [...prev.cluesGathered]

      // Add puzzle objects from this location
      for (const obj of characterObjects) {
        if (!newInventory.includes(obj.id) && obj.actNumber <= Math.ceil(gameState.dayNumber / 10) + 1 + findBonus) {
          newInventory.push(obj.id)
          newObjectStates[obj.id] = { ...obj.initialStates }
        }
      }

      // Add clues from this location (record outside updater to avoid setState-in-render)
      for (const clueId of currentLocation.clueIds) {
        if (!newClues.includes(clueId)) {
          newClues.push(clueId)
          newClueIds.push(clueId)
        }
      }

      // If no active artifact, assign one (local first, then act-level fallback)
      // Skip already-identified artifacts
      let newActiveArtifact = prev.activeArtifactId
      if (!newActiveArtifact) {
        const identified = new Set(prev.identifiedArtifactIds)
        const localUnidentified = locationArtifacts.filter(a => !identified.has(a.id))
        if (localUnidentified.length > 0) {
          newActiveArtifact = localUnidentified[0].id
        } else {
          const actArtifacts = PROLOGUE_ARTIFACTS.filter(a =>
            locations.some(l => l.id === a.foundAt) && !identified.has(a.id)
          )
          if (actArtifacts.length > 0) {
            newActiveArtifact = actArtifacts[0].id
          }
        }
      }

      // Start puzzle chain if first puzzle location visit
      let activePuzzleChain = prev.activePuzzleChain
      let puzzleChainStep = prev.puzzleChainStep
      if (!activePuzzleChain && currentLocation.puzzleIds.length > 0) {
        activePuzzleChain = currentLocation.puzzleIds[0]
        puzzleChainStep = 0
      }

      return {
        ...prev,
        inventoryObjectIds: newInventory,
        objectStates: newObjectStates,
        cluesGathered: newClues,
        activeArtifactId: newActiveArtifact,
        activePuzzleChain,
        puzzleChainStep,
      }
    })

    // Record clues in PrologueContext after state update (not inside updater)
    for (const clueId of newClueIds) {
      recordClue(clueId)
    }

    addExperience(result.success ? 15 : 5)
    setShowSkillCheck({
      stat: 'Expertise',
      result: `Rolled ${result.total} vs DC 8 ${bonus > 0 ? `(+${bonus} proficiency)` : ''}`,
      success: result.success,
    })
    setTimeout(() => setShowSkillCheck(null), 3000)

    if (foundSomething) {
      setActionFeedback(`You search ${currentLocation.name} and find something interesting!`)
    } else if (!gameState.activeArtifactId) {
      // Check if a new artifact was assigned by the fallback
      const identified = new Set(gameState.identifiedArtifactIds ?? [])
      const hasUnidentified = PROLOGUE_ARTIFACTS.some(a =>
        locations.some(l => l.id === a.foundAt) && !identified.has(a.id)
      )
      if (hasUnidentified) {
        setActionFeedback(`Nothing new here, but your research points to another artifact to investigate. Talk to witnesses to learn more.`)
      } else {
        setActionFeedback(`You have identified all known artifacts in this region. Travel further to discover new mysteries.`)
      }
    } else {
      setActionFeedback(`You search thoroughly but find nothing new at ${currentLocation.name}.`)
    }
  }, [currentLocation, characterId, spendAction, locationArtifacts, locations, gameState.dayNumber, gameState.activeArtifactId, gameState.identifiedArtifactIds, recordClue, rollSkillCheck, addExperience, addInvestigationXP, getInvestigationBonus])

  const handleRestAtCamp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      dayNumber: prev.dayNumber + 1,
      actionsRemaining: 10,
      fylguirTarget: null,
    }))
    addExperience(3)
    setActionFeedback('You rest for the night. A new day dawns. Actions restored.')
  }, [addExperience])

  const handleWitnessInterview = useCallback((optionId: string) => {
    if (!activeArtifact) {
      setWitnessResponse('You need to be investigating an artifact first. Search the area to find artifacts.')
      return
    }
    if (!spendAction()) return

    // Diplomacy skill check for interviews
    const result = rollSkillCheck('Diplomacy', 8)
    const bonus = getInvestigationBonus('witnessInterrogation')
    addInvestigationXP('witnessInterrogation', 5)

    // Reveal a random unrevealed trait
    const allTraits: TraitCategory[] = ['material', 'origin_culture', 'age_period', 'purpose', 'symbol_family', 'provenance']
    const unrevealed = allTraits.filter(t => !gameState.revealedTraits.includes(t))

    if (unrevealed.length === 0) {
      setWitnessResponse('"I have told you all I know about this artifact. You have all the evidence you need."')
      return
    }

    // Better interviews reveal more useful traits first with high Diplomacy
    const revealed = result.success
      ? unrevealed[0]  // Most useful first on success
      : unrevealed[Math.floor(Math.random() * unrevealed.length)]

    setGameState(prev => ({
      ...prev,
      revealedTraits: [...prev.revealedTraits, revealed],
      witnessesInterviewed: prev.witnessesInterviewed.includes(optionId)
        ? prev.witnessesInterviewed
        : [...prev.witnessesInterviewed, optionId],
    }))

    const traitValue = (() => {
      switch (revealed) {
        case 'material': return activeArtifact.traits.material
        case 'origin_culture': return activeArtifact.traits.originCulture
        case 'age_period': return activeArtifact.traits.agePeriod
        case 'purpose': return activeArtifact.traits.purpose
        case 'symbol_family': return activeArtifact.traits.symbolFamily
        case 'provenance': return activeArtifact.traits.provenance
        default: return '???'
      }
    })()

    const responses = [
      `"The ${revealed.replace(/_/g, ' ')} of this artifact... it is ${traitValue.replace(/_/g, ' ')}. Of this I am certain."`,
      `"I have seen such things before. The ${revealed.replace(/_/g, ' ')} tells me it is ${traitValue.replace(/_/g, ' ')}."`,
      `"My people know this well. It is ${traitValue.replace(/_/g, ' ')} in nature, regarding its ${revealed.replace(/_/g, ' ')}."`,
    ]
    setWitnessResponse(responses[Math.floor(Math.random() * responses.length)])

    addExperience(result.success ? 15 : 8)
    applyKarma('oregon_trail', 'Respectful witness interview', 1, 1)
    setShowSkillCheck({
      stat: 'Diplomacy',
      result: `Rolled ${result.total} vs DC 8`,
      success: result.success,
    })
    setTimeout(() => setShowSkillCheck(null), 3000)
  }, [spendAction, activeArtifact, gameState.revealedTraits, applyKarma, rollSkillCheck, addExperience, addInvestigationXP, getInvestigationBonus])

  const handleIdentifyArtifact = useCallback(() => {
    if (!activeArtifact) return
    if (!spendAction()) return

    // Expertise skill check for identification
    const result = rollSkillCheck('Expertise', 10)
    addInvestigationXP('suspectIdentification', 10)

    recordPuzzleSolved(activeArtifact.id)
    addExperience(result.success ? 30 : 15)

    setActionFeedback(`Artifact identified: ${activeArtifact.name}! ${activeArtifact.significance}`)
    setGameState(prev => ({
      ...prev,
      activeArtifactId: null,
      revealedTraits: [],
      identifiedArtifactIds: [...prev.identifiedArtifactIds, activeArtifact.id],
    }))

    applyKarma('oregon_trail', `Identified artifact: ${activeArtifact.name}`, 3, 2)
    syncCrossGame()
  }, [activeArtifact, spendAction, recordPuzzleSolved, applyKarma, rollSkillCheck, addExperience, addInvestigationXP, syncCrossGame])

  const handleTransform = useCallback((objectId: string, actionName: string): boolean => {
    if (!spendAction()) return false

    const transformation = ALL_TRANSFORMATIONS.find(t => t.name === actionName)
    if (!transformation) return false

    const currentStates = gameState.objectStates[objectId]
    if (!currentStates) return false

    const applicable = getApplicableTransformations(
      currentStates,
      currentLocation?.id,
      gameState.inventoryObjectIds
    )
    if (!applicable.find(t => t.id === transformation.id)) {
      setActionFeedback(transformation.failureMessage || 'Nothing happens.')
      return false
    }

    // Apply transformation
    const newStates = { ...currentStates, ...transformation.appliesState }
    setGameState(prev => {
      // Advance puzzle chain if this transformation matches
      let chainStep = prev.puzzleChainStep
      let chainsCompleted = prev.puzzleChainsCompleted
      let activePuzzleChain = prev.activePuzzleChain
      if (activePuzzleChain) {
        chainStep++
        if (chainStep >= 4) {
          chainsCompleted = [...chainsCompleted, activePuzzleChain]
          activePuzzleChain = null
          chainStep = 0
        }
      }
      return {
        ...prev,
        objectStates: { ...prev.objectStates, [objectId]: newStates },
        puzzleChainStep: chainStep,
        puzzleChainsCompleted: chainsCompleted,
        activePuzzleChain,
      }
    })

    addExperience(10)
    setActionFeedback(transformation.successMessage || 'Something changed...')
    return true
  }, [gameState.objectStates, gameState.inventoryObjectIds, currentLocation, spendAction, addExperience])

  const handleCombine = useCallback((objectId1: string, objectId2: string): boolean => {
    if (!spendAction()) return false

    const characterObjects = getPuzzleObjectsByCharacter(characterId)
    const obj1 = characterObjects.find(o => o.id === objectId1)
    const obj2 = characterObjects.find(o => o.id === objectId2)

    if (!obj1?.canCombineWith?.includes(objectId2) && !obj2?.canCombineWith?.includes(objectId1)) {
      setActionFeedback('These objects don\'t seem to fit together.')
      return false
    }

    setGameState(prev => ({
      ...prev,
      objectStates: {
        ...prev.objectStates,
        [objectId1]: { ...prev.objectStates[objectId1], combined: true },
        [objectId2]: { ...prev.objectStates[objectId2], combined: true },
      },
    }))

    addExperience(20)
    setActionFeedback(`The ${obj1?.name} and ${obj2?.name} combine — revealing something extraordinary!`)
    recordPuzzleSolved(`combine_${objectId1}_${objectId2}`)
    syncCrossGame()
    return true
  }, [characterId, spendAction, recordPuzzleSolved, addExperience, syncCrossGame])

  // ─── Prologue episode check ──────────────────────────────────────────────

  const actProgress = prologueState.actProgress[characterId]
  const currentEpisode = actProgress?.episodes.find(e => e.episodeId === episodeId)

  if (!currentEpisode && episodeId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-red-400 text-sm">Episode not found</p>
          <Link href={`/prologue/${characterId}`} className="text-purple-400 text-xs mt-4 block">
            {'\u2190'} Back to episodes
          </Link>
        </div>
      </div>
    )
  }

  // ─── SADDLE stat display data ─────────────────────────────────────────────

  const playerStats = charState.character?.stats

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-black to-purple-950">
      {/* HUD */}
      <header className="sticky top-0 z-40 bg-black/80 border-b border-purple-700/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/prologue/${characterId}`}
              className="text-purple-400 hover:text-purple-200 text-xs font-pixel"
            >
              {'\u2190'}
            </Link>
            <div>
              <span className="font-pixel text-purple-200 text-xs">
                {characterId.charAt(0).toUpperCase() + characterId.slice(1)}
              </span>
              {currentLocation && (
                <>
                  <span className="text-purple-600 mx-2">|</span>
                  <span className="text-purple-400 text-[10px]">{currentLocation.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[9px]">
            {/* SADDLE stats mini-display */}
            {playerStats && (
              <div className="hidden md:flex items-center gap-2">
                {(Object.entries(playerStats) as [StatName, number][]).map(([stat, val]) => (
                  <span key={stat} className={`${STAT_COLORS[stat]} font-pixel`}>
                    {stat.charAt(0)}{val}
                  </span>
                ))}
              </div>
            )}
            <span className="text-purple-400">
              Day {gameState.dayNumber}
            </span>
            <span className={`${gameState.actionsRemaining <= 2 ? 'text-red-400' : 'text-purple-400'}`}>
              Actions: {gameState.actionsRemaining}/10
            </span>
            <span className="text-purple-400">
              Clues: {gameState.cluesGathered.length}
            </span>
            <span className="text-purple-400">
              Items: {gameState.inventoryObjectIds.length}
            </span>
            <button
              onClick={() => setGuideOpen(true)}
              className="text-amber-400 hover:text-amber-200 font-pixel"
              title="Open The Guide"
            >
              {'\uD83D\uDCD6'}
            </button>
          </div>
        </div>
      </header>

      {/* Skill Check Toast */}
      {showSkillCheck && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border-2 rounded font-pixel text-[10px] ${
          showSkillCheck.success
            ? 'bg-emerald-900/80 border-emerald-600 text-emerald-200'
            : 'bg-red-900/80 border-red-600 text-red-200'
        }`}>
          [{showSkillCheck.stat}] {showSkillCheck.result} — {showSkillCheck.success ? 'SUCCESS' : 'FAILED'}
        </div>
      )}

      {/* Episode Gate Interstitial */}
      {showEpisodeGate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowEpisodeGate(null)}>
          <div className="bg-purple-950 border-4 border-purple-600 rounded-lg p-8 max-w-md text-center">
            <div className="text-4xl mb-4">{'\u2728'}</div>
            <h2 className="font-pixel text-purple-200 text-lg mb-2">Episode Complete!</h2>
            <p className="text-purple-300 text-sm mb-2">
              {showEpisodeGate}
            </p>
            <p className="text-purple-400 text-xs mb-4">+50 XP earned</p>
            <button
              onClick={() => setShowEpisodeGate(null)}
              className="font-pixel text-[10px] text-purple-200 bg-purple-800 border border-purple-600 px-6 py-2 rounded hover:bg-purple-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Fylguir spirit message (Norseman only) */}
      {characterId === 'norseman' && gameState.fylguirTarget && (
        <div className="sticky top-[52px] z-30 bg-blue-950/70 border-b border-blue-700/30 px-4 py-1 text-center">
          <span className="text-blue-300 text-[9px] font-pixel italic">
            A raven circles above {locations.find(l => l.id === gameState.fylguirTarget)?.name || 'a distant location'}...
          </span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Phase tabs */}
        <div className="flex gap-1 mb-6 border-b border-purple-800">
          {(['exploring', 'investigating', 'puzzling'] as const).map(phase => (
            <button
              key={phase}
              onClick={() => {
                setGamePhase(phase)
                if (phase === 'investigating') setActiveWitnessIdx(0)
              }}
              className={`font-pixel text-[10px] px-4 py-2 border-b-2 transition-colors ${
                gamePhase === phase
                  ? 'text-purple-200 border-purple-400'
                  : 'text-purple-500 border-transparent hover:text-purple-300'
              }`}
            >
              {phase === 'exploring' && '\uD83D\uDDFA\uFE0F '}
              {phase === 'investigating' && '\uD83D\uDD0D '}
              {phase === 'puzzling' && '\uD83E\uDDE9 '}
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </button>
          ))}
        </div>

        {/* Action feedback */}
        {actionFeedback && (
          <div className="mb-4 p-3 bg-purple-900/30 border border-purple-700/50 rounded text-purple-200 text-xs font-pixel animate-pulse">
            {actionFeedback}
          </div>
        )}

        {/* Puzzle chain progress */}
        {gameState.activePuzzleChain && gamePhase === 'puzzling' && (
          <div className="mb-4 p-3 bg-indigo-900/30 border border-indigo-700/50 rounded">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-indigo-200 text-[10px]">
                Puzzle Chain: {gameState.activePuzzleChain}
              </span>
              <span className="font-pixel text-indigo-400 text-[9px]">
                Step {gameState.puzzleChainStep + 1}/4
              </span>
            </div>
            <div className="mt-1 h-1 bg-indigo-900 rounded">
              <div
                className="h-full bg-indigo-400 rounded transition-all"
                style={{ width: `${(gameState.puzzleChainStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ═══ EXPLORING TAB ═══ */}
        {gamePhase === 'exploring' && (
          <div className="space-y-4">
            {/* Location Map */}
            <LocationMap
              locations={mapLocations}
              connections={connections}
              currentLocationId={gameState.currentLocationId}
              onTravelTo={handleTravel}
              culturalZone={currentLocation?.culturalZone || 'Unknown'}
            />

            {/* Current location detail */}
            {currentLocation && (
              <div className="bg-black/40 border-2 border-purple-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-pixel text-purple-200 text-sm">{currentLocation.name}</h3>
                    <p className="text-purple-500 text-[9px]">{currentLocation.culturalZone}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentLocation.clueIds.length > 0 && (
                      <span className="text-[8px] bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50">
                        {'\uD83D\uDD0D'} {currentLocation.clueIds.length} clues
                      </span>
                    )}
                    {currentLocation.puzzleIds.length > 0 && (
                      <span className="text-[8px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">
                        {'\uD83E\uDDE9'} puzzle
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-purple-300/80 text-xs leading-relaxed mb-4">
                  {currentLocation.description}
                </p>

                {currentLocation.historicalNote && (
                  <div className="bg-amber-900/20 border border-amber-800/30 rounded p-3 mb-4">
                    <p className="text-amber-400/80 text-[9px] italic">
                      {'\uD83C\uDFC5'} <span className="text-amber-300 font-pixel">Historical Fact:</span> {currentLocation.historicalNote}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleSearchLocation}
                    disabled={gameState.actionsRemaining <= 0}
                    className="font-pixel text-[9px] text-purple-200 bg-purple-800/60 border border-purple-600 px-4 py-2 rounded hover:bg-purple-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {'\uD83D\uDD0D'} Search Area
                  </button>
                  <button
                    onClick={handleRestAtCamp}
                    className="font-pixel text-[9px] text-emerald-200 bg-emerald-900/40 border border-emerald-700 px-4 py-2 rounded hover:bg-emerald-800/40"
                  >
                    {'\u26FA'} Rest (New Day)
                  </button>
                  {locationWitnesses.length > 0 && (
                    <button
                      onClick={() => { setGamePhase('investigating'); setActiveWitnessIdx(0) }}
                      className="font-pixel text-[9px] text-amber-200 bg-amber-900/40 border border-amber-700 px-4 py-2 rounded hover:bg-amber-800/40"
                    >
                      {'\uD83D\uDDE3\uFE0F'} Talk to Witnesses ({locationWitnesses.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Episode progress */}
            <div className="bg-black/30 border border-purple-800/50 rounded-lg p-3">
              <h4 className="font-pixel text-purple-300 text-[10px] mb-2">Episode Progress</h4>
              <div className="space-y-1">
                {(EPISODE_GATES[characterId] || []).map(gate => {
                  const done = gameState.completedEpisodes.includes(gate.episodeId)
                  return (
                    <div key={gate.episodeId} className="flex items-center gap-2 text-[9px]">
                      <span className={done ? 'text-emerald-400' : 'text-purple-600'}>
                        {done ? '\u2713' : '\u25CB'}
                      </span>
                      <span className={done ? 'text-purple-300' : 'text-purple-500'}>
                        {gate.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ INVESTIGATING TAB ═══ */}
        {gamePhase === 'investigating' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Artifact Matrix */}
            <div className="space-y-4">
              <ArtifactMatrix
                traits={artifactTraits}
                revealedTraits={new Set(gameState.revealedTraits as TraitCategory[])}
                canIdentify={gameState.revealedTraits.length >= 3 && activeArtifact !== null}
                onIdentify={handleIdentifyArtifact}
              />

              {activeArtifact && (
                <div className="bg-black/40 border-2 border-amber-800/50 rounded-lg p-4">
                  <h4 className="font-pixel text-amber-200 text-[10px] mb-2">Active Investigation</h4>
                  <p className="text-amber-300 text-xs font-pixel">{activeArtifact.name}</p>
                  <p className="text-amber-400/70 text-[9px] mt-1">{activeArtifact.description}</p>
                  <p className="text-purple-400/70 text-[8px] mt-2 italic">
                    Mystery: {activeArtifact.mystery}
                  </p>
                </div>
              )}

              {!activeArtifact && (
                <div className="bg-black/40 border-2 border-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-500 text-xs font-pixel">No active artifact investigation</p>
                  <p className="text-gray-600 text-[9px] mt-2">
                    Search locations to discover artifacts for investigation.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Witness interviews */}
            <div className="space-y-4">
              {locationWitnesses.length > 0 ? (
                locationWitnesses.map((witness, idx) => (
                  <CulturalInteraction
                    key={witness.id}
                    witness={{
                      type: (witness.id.includes('elder') ? 'elder'
                        : witness.id.includes('shaman') ? 'shaman'
                        : witness.id.includes('trader') ? 'trader'
                        : witness.id.includes('priest') ? 'priestess'
                        : witness.id.includes('warrior') ? 'warrior'
                        : 'elder') as CulturalWitnessType,
                      name: witness.name,
                      culture: witness.culturalAffiliation[0] || 'unknown',
                      icon: '',
                      reliability: witness.reliability === 'very_high' ? 0.95
                        : witness.reliability === 'high' ? 0.85
                        : witness.reliability === 'moderate' ? 0.7
                        : witness.reliability === 'low' ? 0.5
                        : 0.3,
                      clueQuality: witness.clueQuality === 'definitive' ? 'high'
                        : witness.clueQuality === 'strong' ? 'high'
                        : witness.clueQuality === 'moderate' ? 'medium'
                        : 'low',
                    }}
                    dialogueOptions={[
                      {
                        id: `ask_artifact_${witness.id}`,
                        text: activeArtifact
                          ? `Ask about the ${activeArtifact.name}`
                          : 'Ask about artifacts in this area',
                      },
                      {
                        id: `ask_history_${witness.id}`,
                        text: 'Ask about the history of this place',
                      },
                      {
                        id: `ask_route_${witness.id}`,
                        text: 'Ask about routes to the south and west',
                        karmaEffect: { lawful: 1, good: 1 },
                      },
                    ]}
                    onChoose={handleWitnessInterview}
                    responseText={activeWitnessIdx === idx ? witnessResponse || undefined : undefined}
                    isComplete={gameState.witnessesInterviewed.includes(`ask_artifact_${witness.id}`)
                      && gameState.witnessesInterviewed.includes(`ask_history_${witness.id}`)
                      && gameState.witnessesInterviewed.includes(`ask_route_${witness.id}`)}
                  />
                ))
              ) : (
                <div className="bg-black/40 border-2 border-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-500 text-xs font-pixel">No witnesses at this location</p>
                  <p className="text-gray-600 text-[9px] mt-2">
                    Travel to settlements to find people to interview.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PUZZLING TAB ═══ */}
        {gamePhase === 'puzzling' && (
          <div className="space-y-4">
            <PuzzleWorkbench
              inventory={puzzleInventory}
              onTransform={handleTransform}
              onCombine={handleCombine}
              availableActions={availablePuzzleActions}
            />

            {puzzleInventory.length === 0 && (
              <div className="bg-black/40 border-2 border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-xs font-pixel">No puzzle objects yet</p>
                <p className="text-gray-600 text-[9px] mt-2">
                  Search locations and explore to find objects. Objects can be transformed by applying
                  water, fire, moonlight, and other forces.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Guide slide-in panel */}
      <GuidePanel
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        currentLocation={currentLocation?.name}
        currentCulture={currentLocation?.culturalZone}
      />
    </div>
  )
}
