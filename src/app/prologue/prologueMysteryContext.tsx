'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Artifact Trait Matrix (replaces outlaw traits)
export interface ArtifactTraits {
  material: 'stone' | 'gold' | 'jade' | 'obsidian' | 'bone' | 'copper'
  origin_culture: 'norse' | 'mississippian' | 'chumash' | 'incan' | 'aztec' | 'maya'
  age_period: '600ce' | '800ce' | '1000ce' | '1200ce' | '1400ce'
  purpose: 'ceremonial' | 'navigational' | 'astronomical' | 'agricultural' | 'martial' | 'trade'
  symbol_family: 'serpent' | 'sun' | 'bird' | 'jaguar' | 'spiral' | 'cross'
  provenance: 'local' | 'traded' | 'gifted' | 'stolen' | 'unknown'
}

export type TraitName = keyof ArtifactTraits

// Witness types (cultural informants)
export type WitnessType =
  | 'Elder'
  | 'Skald'
  | 'Medicine Person'
  | 'Priestess'
  | 'Quipucamayoc'
  | 'Trader'
  | 'Warrior'
  | 'Shaman'

// Artifact being investigated
export interface Artifact {
  id: string
  name: string
  description: string
  traits: ArtifactTraits
  imageUrl?: string
}

// Collected clue about the artifact
export interface CollectedClue {
  id: string
  text: string
  trait?: TraitName
  value?: string
  witnessType: WitnessType
  reliability: number
  location: string
  timestamp: number
  isTrue?: boolean   // Whether this clue is accurate (based on witness reliability)
}

// Investigation session
export interface Investigation {
  id: string
  artifactId: string
  location: string
  witnesses: WitnessType[]
  cluesAvailable: CollectedClue[]
  investigated: boolean
  solved: boolean
}

// Identification warrant (equivalent to outlaw warrant)
export interface ArtifactIdentification {
  id: string
  traits: Partial<ArtifactTraits>
  issuedAt: string
  issuedTimestamp: number
  valid: boolean
  confidence: number  // How many clues support this
}

export interface MysteryState {
  // Current investigation
  currentArtifact: Artifact | null
  currentInvestigation: Investigation | null

  // Clues
  collectedClues: CollectedClue[]
  knownTraits: Partial<ArtifactTraits>
  investigationTime: number  // Hours spent investigating

  // Identifications
  activeIdentification: ArtifactIdentification | null
  identificationHistory: ArtifactIdentification[]

  // Statistics
  artifactsIdentified: number
  wrongIdentifications: number
  investigationsCompleted: number
  totalKnowledgeGained: number

  // One-Fragment Rule: every puzzle has at least one viable path clue
  oneFragmentClues: string[]  // IDs of guaranteed-viable clues
}

interface MysteryContextValue {
  state: MysteryState

  // Investigation setup
  initializeMystery: () => void
  startInvestigation: (artifact: Artifact, location: string) => void

  // Clue gathering
  investigateArtifact: () => CollectedClue[]
  interviewWitness: (witnessType: WitnessType) => CollectedClue | null
  addClue: (clue: CollectedClue) => void
  processClue: (clue: CollectedClue) => void

  // Artifact identification
  issueIdentification: (traits: Partial<ArtifactTraits>) => ArtifactIdentification
  verifyIdentification: () => { success: boolean; message: string; knowledge: number }
  canIssueIdentification: () => { canIssue: boolean; reason: string; confidence: number }

  // Helpers
  getKnownTraits: () => Partial<ArtifactTraits>
  generateClueForWitness: (witnessType: WitnessType, location: string) => CollectedClue | undefined

  // Persistence
  loadMysteryState: (savedState: Partial<MysteryState>) => void
}

const MysteryContext = createContext<MysteryContextValue | undefined>(undefined)

const initialState: MysteryState = {
  currentArtifact: null,
  currentInvestigation: null,
  collectedClues: [],
  knownTraits: {},
  investigationTime: 0,
  activeIdentification: null,
  identificationHistory: [],
  artifactsIdentified: 0,
  wrongIdentifications: 0,
  investigationsCompleted: 0,
  totalKnowledgeGained: 0,
  oneFragmentClues: [],
}

const STORAGE_KEY = 'bobr_prologue_mystery'

export function MysteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MysteryState>(() => {
    if (typeof window === 'undefined') return initialState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as MysteryState
      }
    } catch {}
    return initialState
  })

  // Initialize the mystery system
  const initializeMystery = useCallback(() => {
    setState({
      ...initialState
    })
  }, [])

  // Start investigating a specific artifact
  const startInvestigation = useCallback((artifact: Artifact, location: string) => {
    const witnesses: WitnessType[] = ['Elder', 'Trader', 'Medicine Person', 'Shaman']
      .sort(() => Math.random() - 0.5)
      .slice(0, 3) as WitnessType[]

    // Generate available clues (2-4 clues per investigation)
    const cluesAvailable: CollectedClue[] = []
    const traitKeys = Object.keys(artifact.traits) as TraitName[]
    const numClues = 2 + Math.floor(Math.random() * 3)

    // Ensure at least one viable clue (One-Fragment Rule)
    const viableTraitKey = traitKeys[Math.floor(Math.random() * traitKeys.length)]
    const viableClue: CollectedClue = {
      id: `clue_viable_${Date.now()}`,
      text: generateClueText(viableTraitKey, artifact.traits[viableTraitKey], witnesses[0]),
      trait: viableTraitKey,
      value: artifact.traits[viableTraitKey],
      witnessType: witnesses[0],
      reliability: 0.95,
      location,
      timestamp: Date.now(),
      isTrue: true
    }
    cluesAvailable.push(viableClue)

    // Add additional clues
    for (let i = 1; i < numClues; i++) {
      const randomTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)]
      const witnessType = witnesses[Math.floor(Math.random() * witnesses.length)]
      const reliability = 0.6 + Math.random() * 0.3

      cluesAvailable.push({
        id: `clue_${Date.now()}_${i}`,
        text: generateClueText(randomTrait, artifact.traits[randomTrait], witnessType),
        trait: randomTrait,
        value: artifact.traits[randomTrait],
        witnessType,
        reliability,
        location,
        timestamp: Date.now(),
        isTrue: Math.random() < reliability
      })
    }

    const investigation: Investigation = {
      id: `investigation_${Date.now()}`,
      artifactId: artifact.id,
      location,
      witnesses,
      cluesAvailable,
      investigated: false,
      solved: false
    }

    setState(prev => ({
      ...prev,
      currentArtifact: artifact,
      currentInvestigation: investigation,
      collectedClues: [],
      knownTraits: {},
      oneFragmentClues: [viableClue.id]
    }))
  }, [])

  // Investigate the artifact (costs time)
  const investigateArtifact = useCallback((): CollectedClue[] => {
    if (!state.currentInvestigation) return []

    const clues = state.currentInvestigation.cluesAvailable.filter(
      c => !state.collectedClues.some(cc => cc.id === c.id)
    )

    // Return 1-2 clues per investigation
    const numClues = Math.min(clues.length, 1 + Math.floor(Math.random() * 2))
    const foundClues = clues.slice(0, numClues)

    setState(prev => ({
      ...prev,
      collectedClues: [...prev.collectedClues, ...foundClues],
      investigationTime: prev.investigationTime + 2,
      investigationsCompleted: prev.investigationsCompleted + (foundClues.length > 0 ? 1 : 0)
    }))

    // Process each clue to update known traits
    foundClues.forEach(clue => {
      if (clue.trait && clue.value && clue.isTrue) {
        setState(prev => ({
          ...prev,
          knownTraits: {
            ...prev.knownTraits,
            [clue.trait!]: clue.value
          }
        }))
      }
    })

    return foundClues
  }, [state.currentInvestigation, state.collectedClues])

  // Interview a specific witness
  const interviewWitness = useCallback((witnessType: WitnessType): CollectedClue | null => {
    if (!state.currentInvestigation) return null

    const clues = state.currentInvestigation.cluesAvailable.filter(
      c => c.witnessType === witnessType && !state.collectedClues.some(cc => cc.id === c.id)
    )

    if (clues.length === 0) return null

    const clue = clues[0]

    setState(prev => ({
      ...prev,
      collectedClues: [...prev.collectedClues, clue],
      investigationTime: prev.investigationTime + 1
    }))

    // Update known traits if clue is reliable
    if (clue.trait && clue.value && clue.isTrue) {
      setState(prev => ({
        ...prev,
        knownTraits: {
          ...prev.knownTraits,
          [clue.trait!]: clue.value
        }
      }))
    }

    return clue
  }, [state.currentInvestigation, state.collectedClues])

  // Generate a clue for a witness at a location
  const generateClueForWitness = useCallback((witnessType: WitnessType, location: string): CollectedClue | undefined => {
    if (!state.currentArtifact) return undefined

    const artifact = state.currentArtifact
    const traitKeys = Object.keys(artifact.traits) as TraitName[]
    const randomTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)]
    const traitValue = artifact.traits[randomTrait]

    const reliabilityMap: Record<WitnessType, number> = {
      'Elder': 0.9,
      'Skald': 0.85,
      'Medicine Person': 0.8,
      'Priestess': 0.85,
      'Quipucamayoc': 0.9,
      'Trader': 0.7,
      'Warrior': 0.65,
      'Shaman': 0.8,
    }

    const reliability = reliabilityMap[witnessType] || 0.7

    return {
      id: `clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: generateClueText(randomTrait, traitValue, witnessType),
      witnessType,
      location,
      reliability,
      trait: randomTrait,
      value: traitValue,
      isTrue: Math.random() < reliability,
      timestamp: Date.now(),
    }
  }, [state.currentArtifact])

  // Add a clue manually
  const addClue = useCallback((clue: CollectedClue) => {
    setState(prev => {
      const newState = {
        ...prev,
        collectedClues: [...prev.collectedClues, clue]
      }
      // Also extract trait information if the clue has it and is true
      if (clue.trait && clue.value && clue.isTrue) {
        newState.knownTraits = {
          ...prev.knownTraits,
          [clue.trait]: clue.value
        }
      }
      return newState
    })
  }, [])

  // Process a clue to extract trait information
  const processClue = useCallback((clue: CollectedClue) => {
    if (clue.trait && clue.value && clue.isTrue) {
      setState(prev => ({
        ...prev,
        knownTraits: {
          ...prev.knownTraits,
          [clue.trait!]: clue.value
        }
      }))
    }
  }, [])

  // Check if we can issue an identification
  const canIssueIdentification = useCallback((): { canIssue: boolean; reason: string; confidence: number } => {
    const traitCount = Object.keys(state.knownTraits).length
    const confidence = traitCount / 6  // 6 total traits

    if (traitCount === 0) {
      return { canIssue: false, reason: 'No evidence collected. Examine the artifact first.', confidence: 0 }
    }

    if (traitCount < 3) {
      return { canIssue: false, reason: `Insufficient evidence. ${traitCount}/3 minimum traits identified.`, confidence }
    }

    return { canIssue: true, reason: 'Sufficient evidence to make identification.', confidence }
  }, [state.knownTraits])

  // Issue an artifact identification
  const issueIdentification = useCallback((traits: Partial<ArtifactTraits>): ArtifactIdentification => {
    const confidence = Object.keys(traits).length / 6

    const identification: ArtifactIdentification = {
      id: `identification_${Date.now()}`,
      traits,
      issuedAt: state.currentInvestigation?.location || 'Unknown',
      issuedTimestamp: Date.now(),
      valid: confidence >= 0.5,
      confidence
    }

    setState(prev => ({
      ...prev,
      activeIdentification: identification,
      identificationHistory: [...prev.identificationHistory, identification]
    }))

    return identification
  }, [state.currentInvestigation?.location])

  // Verify the identification
  const verifyIdentification = useCallback((): { success: boolean; message: string; knowledge: number } => {
    if (!state.activeIdentification) {
      return { success: false, message: 'No active identification.', knowledge: 0 }
    }

    if (!state.currentArtifact) {
      return { success: false, message: 'No artifact being investigated.', knowledge: 0 }
    }

    const identification = state.activeIdentification
    const artifact = state.currentArtifact

    // Check if identification matches the actual artifact
    const traitKeys = Object.keys(identification.traits) as TraitName[]
    const matchingTraits = traitKeys.filter(key => identification.traits[key] === artifact.traits[key])
    const accuracy = matchingTraits.length / traitKeys.length

    if (accuracy >= 0.8) {
      // Correct identification!
      const knowledge = Math.floor(100 * identification.confidence)

      setState(prev => ({
        ...prev,
        artifactsIdentified: prev.artifactsIdentified + 1,
        totalKnowledgeGained: prev.totalKnowledgeGained + knowledge,
        activeIdentification: null,
        currentArtifact: null,
        currentInvestigation: null,
        collectedClues: [],
        knownTraits: {}
      }))

      return {
        success: true,
        message: `Artifact correctly identified! Cultural significance: ${artifact.name}`,
        knowledge
      }
    } else {
      // Wrong identification!
      setState(prev => ({
        ...prev,
        wrongIdentifications: prev.wrongIdentifications + 1,
        activeIdentification: null
      }))

      return {
        success: false,
        message: `Incorrect identification. Accuracy: ${Math.floor(accuracy * 100)}%. Re-examine the evidence.`,
        knowledge: 0
      }
    }
  }, [state.activeIdentification, state.currentArtifact])

  // Get known traits
  const getKnownTraits = useCallback((): Partial<ArtifactTraits> => {
    return { ...state.knownTraits }
  }, [state.knownTraits])

  // Load mystery state from saved data
  const loadMysteryState = useCallback((savedState: Partial<MysteryState>) => {
    setState(prev => ({
      ...prev,
      ...savedState
    }))
  }, [])

  // Persist mystery state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const value: MysteryContextValue = {
    state,
    initializeMystery,
    startInvestigation,
    investigateArtifact,
    interviewWitness,
    addClue,
    processClue,
    issueIdentification,
    verifyIdentification,
    canIssueIdentification,
    getKnownTraits,
    generateClueForWitness,
    loadMysteryState
  }

  return (
    <MysteryContext.Provider value={value}>
      {children}
    </MysteryContext.Provider>
  )
}

export function useMystery() {
  const context = useContext(MysteryContext)
  if (!context) {
    throw new Error('useMystery must be used within a MysteryProvider')
  }
  return context
}

// Helper: Generate clue text based on trait and witness type
function generateClueText(trait: TraitName, value: string, witnessType: WitnessType): string {
  const clueTemplates: Record<TraitName, Record<string, string[]>> = {
    material: {
      stone: ["This stone is sacred, from the high mountains.", "The weight suggests volcanic stone."],
      gold: ["Gold like this comes from the southern rivers.", "The sun's metal, worked with care."],
      jade: ["Green stone, precious as life itself.", "Jade from distant trade routes."],
      obsidian: ["Black glass, sharp as night.", "Obsidian from the fire mountains."],
      bone: ["Carved from ancient bone.", "The strength of ancestors preserved."],
      copper: ["Red metal, worked by fire.", "Copper from the northern mines."],
    },
    origin_culture: {
      norse: ["The patterns remind me of the sea-farers.", "Strange symbols, like those from across the ocean."],
      mississippian: ["Made by the mound-builders.", "Work of the river people."],
      chumash: ["The coastal people crafted this.", "Shell-work suggests ocean dwellers."],
      incan: ["From the mountain empire.", "Quipu patterns, from the south."],
      aztec: ["The serpent motif is unmistakable.", "Calendar symbols of the valley people."],
      maya: ["Glyphs of the jungle cities.", "The jaguar lords made this."],
    },
    age_period: {
      '600ce': ["Ancient, from the time of our grandfathers' grandfathers.", "Many generations old."],
      '800ce': ["Old, but not ancient.", "From the time of the great migrations."],
      '1000ce': ["Made in my grandfather's time.", "Not so old, perhaps ten generations."],
      '1200ce': ["Recent work, within living memory.", "My grandmother might have seen this made."],
      '1400ce': ["Newly made, still fresh.", "Contemporary craftsmanship."],
    },
    purpose: {
      ceremonial: ["Used in sacred rites.", "The spirits dwelt in this."],
      navigational: ["For finding the way.", "Star-guides used this."],
      astronomical: ["To track the sun and moon.", "Calendar-keeping device."],
      agricultural: ["For blessing the harvest.", "Planting-time marker."],
      martial: ["Warrior's tool.", "Made for battle or defense."],
      trade: ["Token of exchange.", "Merchant's seal."],
    },
    symbol_family: {
      serpent: ["The serpent coils here.", "Snake wisdom carved within."],
      sun: ["Solar emblems cover it.", "The day-star is honored."],
      bird: ["Wing patterns, messenger symbols.", "Eagle or hawk motifs."],
      jaguar: ["Spotted fur, night-hunter marks.", "Jaguar strength preserved."],
      spiral: ["The endless spiral.", "Journey symbols wind around."],
      cross: ["Four directions united.", "Balance of earth and sky."],
    },
    provenance: {
      local: ["Made here, by our people.", "Local work, I recognize the style."],
      traded: ["Came from far away, through many hands.", "Trade-good from distant lands."],
      gifted: ["A gift between leaders.", "Diplomatic exchange item."],
      stolen: ["Taken, not given.", "The markings suggest theft."],
      unknown: ["Its journey is lost to time.", "Cannot say where it wandered."],
    },
  }

  const templates = clueTemplates[trait]?.[value] || [`The ${trait} appears to be ${value}.`]
  return templates[Math.floor(Math.random() * templates.length)]
}
