'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  OUTLAWS,
  type Outlaw,
  type OutlawTraits,
  type CrimeType,
  findOutlawsByTraits,
  getRandomOutlawForCrime,
  TRAIT_OPTIONS
} from './data/outlaws'
import {
  IDENTITY_CLUES,
  LOCATION_CLUES,
  TIME_CLUES,
  CRIME_DESCRIPTIONS,
  generateClue,
  type ClueTemplate,
  type WitnessType
} from './data/clueTemplates'
import {
  EDUCATIONAL_CLUES,
  type EducationalClue,
  type CaseId,
  getCluesByCaseId,
  getCluesByLocationId,
  checkAnswer as checkEducationalAnswer
} from './data/educationalClues'
import {
  CASES,
  type Case,
  getCaseById
} from './data/caseNarratives'
import {
  GOLD_COUNTRY_SUSPECTS,
  type GoldCountrySuspect,
  getSuspectByCase
} from './data/outlaws'
import {
  type DiscountTier,
  getQualifyingTier
} from './data/discountEngine'

// Types for the mystery system
export interface CollectedClue {
  id: string
  text: string
  trait?: keyof OutlawTraits
  value?: string
  witnessType: WitnessType
  reliability: number
  location: string
  timestamp: number  // Game time when collected
  isTrue?: boolean   // Whether this clue is accurate (based on witness reliability)
  outlawId?: string  // Which outlaw this clue is about (for bounty hunter mode)
}

export interface Crime {
  id: string
  type: CrimeType
  location: string
  perpetratorId: string  // The actual outlaw who did it
  timestamp: number      // When it happened (game time)
  witnesses: WitnessType[]
  cluesAvailable: CollectedClue[]
  investigated: boolean
  solved: boolean
}

export interface Warrant {
  id: string
  targetId: string | null  // null if traits don't match exactly one outlaw
  traits: Partial<OutlawTraits>
  issuedAt: string
  issuedTimestamp: number
  valid: boolean
  matchedOutlaws: string[]  // IDs of outlaws matching the traits
}

export interface OutlawStatus {
  id: string
  hoursAhead: number       // How far ahead they are
  lastKnownLocation: string
  captured: boolean
  escaped: boolean
  warrant?: Warrant
}

// Collected educational clue with answer status
export interface CollectedEducationalClue {
  clue: EducationalClue
  answeredCorrectly: boolean
  attemptedAt: number
  hintsUsed: number
}

export interface MysteryState {
  // Current chase
  currentOutlaw: string | null
  outlawStatuses: Record<string, OutlawStatus>

  // Crimes
  crimes: Crime[]
  currentCrime: Crime | null

  // Investigation
  collectedClues: CollectedClue[]
  knownTraits: Partial<OutlawTraits>
  investigationTime: number  // Hours spent investigating

  // Warrants
  activeWarrant: Warrant | null
  warrantHistory: Warrant[]

  // Statistics
  outlawsCaught: number
  outlawsEscaped: number
  wrongAccusations: number
  crimesInvestigated: number
  totalBountyEarned: number

  // === GOLD COUNTRY MYSTERY (Carmen Sandiego integration) ===

  // Active case tracking
  activeCase: CaseId | null
  activeCaseData: Case | null
  casesSolved: CaseId[]

  // Educational clues (trivia-based)
  educationalCluesCollected: CollectedEducationalClue[]
  currentLocationClues: EducationalClue[]
  hintsUsedTotal: number

  // Discount tracking
  currentDiscountTier: DiscountTier | null
}

interface MysteryContextValue {
  state: MysteryState

  // Game setup
  initializeMystery: () => void
  startChase: (outlawId?: string) => void

  // Crime scene investigation
  generateCrimeAtLocation: (location: string, crimeType?: CrimeType) => Crime
  investigateCrimeScene: () => CollectedClue[]
  interviewWitness: (witnessType: WitnessType) => CollectedClue | null

  // Clue management
  addClue: (clue: CollectedClue) => void
  processClue: (clue: CollectedClue) => void
  getMatchingOutlaws: () => Outlaw[]
  getNarrowedDown: () => { possible: Outlaw[]; eliminated: Outlaw[] }
  generateClueForWitness: (witnessType: WitnessType, location: string) => CollectedClue | undefined

  // Warrant system
  issueWarrant: (traits: Partial<OutlawTraits>) => Warrant
  executeWarrant: () => { success: boolean; message: string; bounty: number }
  canIssueWarrant: () => { canIssue: boolean; reason: string; matchCount: number }

  // Chase mechanics
  advanceOutlaw: (hours: number) => void
  checkEscape: () => boolean
  captureOutlaw: (outlawId: string) => { bounty: number; message: string }

  // Helpers
  getOutlawStatus: (outlawId: string) => OutlawStatus | null
  getAllOutlaws: () => Outlaw[]
  getOutlawById: (id: string) => Outlaw | undefined

  // === GOLD COUNTRY MYSTERY (Carmen Sandiego integration) ===

  // Case management
  startCase: (caseId: CaseId) => void
  getActiveCase: () => Case | null
  getCaseSuspect: () => GoldCountrySuspect | null
  solveCase: () => { success: boolean; message: string }
  getAllCases: () => Case[]
  getAvailableCases: () => Case[]

  // Educational clue system
  getCluesForLocation: (locationId: string) => EducationalClue[]
  attemptEducationalClue: (clueId: string, answer: string) => {
    correct: boolean
    fact: string
    suspectHint: string
  }
  useHint: (clueId: string) => string | null
  getEducationalProgress: () => {
    collected: number
    correct: number
    needed: number
    discountTier: DiscountTier | null
    nextTierClues: number
  }

  // Discount tier
  getCurrentDiscountTier: () => DiscountTier | null
  getCorrectClueCount: () => number
}

const MysteryContext = createContext<MysteryContextValue | undefined>(undefined)

const initialState: MysteryState = {
  currentOutlaw: null,
  outlawStatuses: {},
  crimes: [],
  currentCrime: null,
  collectedClues: [],
  knownTraits: {},
  investigationTime: 0,
  activeWarrant: null,
  warrantHistory: [],
  outlawsCaught: 0,
  outlawsEscaped: 0,
  wrongAccusations: 0,
  crimesInvestigated: 0,
  totalBountyEarned: 0,

  // Gold Country Mystery
  activeCase: null,
  activeCaseData: null,
  casesSolved: [],
  educationalCluesCollected: [],
  currentLocationClues: [],
  hintsUsedTotal: 0,
  currentDiscountTier: null
}

export function MysteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MysteryState>(initialState)

  // Initialize the mystery system
  const initializeMystery = useCallback(() => {
    // Set up initial outlaw statuses
    const statuses: Record<string, OutlawStatus> = {}
    OUTLAWS.forEach(outlaw => {
      statuses[outlaw.id] = {
        id: outlaw.id,
        hoursAhead: 12, // Start 12 hours ahead
        lastKnownLocation: 'Independence',
        captured: false,
        escaped: false
      }
    })

    setState(prev => ({
      ...prev,
      outlawStatuses: statuses,
      currentOutlaw: null,
      crimes: [],
      currentCrime: null,
      collectedClues: [],
      knownTraits: {},
      investigationTime: 0,
      activeWarrant: null
    }))
  }, [])

  // Start chasing a specific outlaw (or random)
  const startChase = useCallback((outlawId?: string) => {
    const targetId = outlawId || OUTLAWS[Math.floor(Math.random() * OUTLAWS.length)].id

    setState(prev => ({
      ...prev,
      currentOutlaw: targetId,
      outlawStatuses: {
        ...prev.outlawStatuses,
        [targetId]: {
          ...prev.outlawStatuses[targetId],
          hoursAhead: 12
        }
      }
    }))
  }, [])

  // Generate a crime at a location
  const generateCrimeAtLocation = useCallback((location: string, crimeType?: CrimeType): Crime => {
    const caughtOutlawIds = Object.values(state.outlawStatuses)
      .filter(s => s.captured)
      .map(s => s.id)

    // Select crime type
    const crimeTypes: CrimeType[] = ['stagecoach_robbery', 'bank_heist', 'cattle_rustling', 'gold_theft', 'horse_theft', 'general_store_robbery']
    const selectedType = crimeType || crimeTypes[Math.floor(Math.random() * crimeTypes.length)]

    // Get the current outlaw or pick one
    let perpetrator: Outlaw | null = null
    if (state.currentOutlaw) {
      perpetrator = OUTLAWS.find(o => o.id === state.currentOutlaw) || null
    }
    if (!perpetrator) {
      perpetrator = getRandomOutlawForCrime(selectedType, caughtOutlawIds)
    }
    if (!perpetrator) {
      perpetrator = OUTLAWS[0] // Fallback
    }

    const crimeInfo = CRIME_DESCRIPTIONS[selectedType]

    // Generate available witnesses based on crime type
    const possibleWitnesses: WitnessType[] = ['bartender', 'shopkeeper', 'stable_hand', 'traveler', 'settler']
    const witnesses = possibleWitnesses
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Generate clues for this crime
    const cluesAvailable: CollectedClue[] = []

    // Add 2-4 identity clues
    const numIdentityClues = 2 + Math.floor(Math.random() * 3)
    const usedTraits = new Set<keyof OutlawTraits>()

    for (let i = 0; i < numIdentityClues; i++) {
      // Pick a random identity clue template
      const availableClues = IDENTITY_CLUES.filter(c => c.trait && !usedTraits.has(c.trait))
      if (availableClues.length === 0) break

      const template = availableClues[Math.floor(Math.random() * availableClues.length)]
      if (template.trait) usedTraits.add(template.trait)

      const generated = generateClue(template, perpetrator)
      const witnessType = witnesses[Math.floor(Math.random() * witnesses.length)]

      cluesAvailable.push({
        id: `clue_${Date.now()}_${i}`,
        text: generated.text,
        trait: generated.trait,
        value: generated.value,
        witnessType,
        reliability: template.reliability,
        location,
        timestamp: Date.now()
      })
    }

    // Add a location clue
    const locationTemplate = LOCATION_CLUES[Math.floor(Math.random() * LOCATION_CLUES.length)]
    const nextLocation = getNextLocationOnTrail(location)
    const locationClue = generateClue(locationTemplate, perpetrator, nextLocation)

    cluesAvailable.push({
      id: `clue_location_${Date.now()}`,
      text: locationClue.text,
      witnessType: 'traveler',
      reliability: locationTemplate.reliability,
      location,
      timestamp: Date.now()
    })

    const crime: Crime = {
      id: `crime_${Date.now()}`,
      type: selectedType,
      location,
      perpetratorId: perpetrator.id,
      timestamp: Date.now(),
      witnesses,
      cluesAvailable,
      investigated: false,
      solved: false
    }

    setState(prev => ({
      ...prev,
      crimes: [...prev.crimes, crime],
      currentCrime: crime,
      currentOutlaw: perpetrator!.id
    }))

    return crime
  }, [state.currentOutlaw, state.outlawStatuses])

  // Investigate the current crime scene (costs time)
  const investigateCrimeScene = useCallback((): CollectedClue[] => {
    if (!state.currentCrime) return []

    const clues = state.currentCrime.cluesAvailable.filter(
      c => !state.collectedClues.some(cc => cc.id === c.id)
    )

    // Return 1-2 clues per investigation
    const numClues = Math.min(clues.length, 1 + Math.floor(Math.random() * 2))
    const foundClues = clues.slice(0, numClues)

    setState(prev => ({
      ...prev,
      collectedClues: [...prev.collectedClues, ...foundClues],
      investigationTime: prev.investigationTime + 2, // 2 hours per investigation
      crimesInvestigated: prev.crimesInvestigated + (foundClues.length > 0 ? 1 : 0)
    }))

    // Process each clue to update known traits
    foundClues.forEach(clue => {
      if (clue.trait && clue.value) {
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
  }, [state.currentCrime, state.collectedClues])

  // Interview a specific witness
  const interviewWitness = useCallback((witnessType: WitnessType): CollectedClue | null => {
    if (!state.currentCrime) return null

    // Find clues from this witness type
    const clues = state.currentCrime.cluesAvailable.filter(
      c => c.witnessType === witnessType && !state.collectedClues.some(cc => cc.id === c.id)
    )

    if (clues.length === 0) return null

    const clue = clues[0]

    setState(prev => ({
      ...prev,
      collectedClues: [...prev.collectedClues, clue],
      investigationTime: prev.investigationTime + 1 // 1 hour per interview
    }))

    // Update known traits
    if (clue.trait && clue.value) {
      setState(prev => ({
        ...prev,
        knownTraits: {
          ...prev.knownTraits,
          [clue.trait!]: clue.value
        }
      }))
    }

    return clue
  }, [state.currentCrime, state.collectedClues])

  // Generate a clue for a witness at a location (used by WitnessDialogue)
  // BOUNTY HUNTER MODE: If no active outlaw, pick a random one from the gang
  const generateClueForWitness = useCallback((witnessType: WitnessType, location: string): CollectedClue | undefined => {
    let outlaw: Outlaw | undefined

    if (state.currentOutlaw) {
      // Active case - use the current target
      outlaw = getOutlawById(state.currentOutlaw)
    } else {
      // BOUNTY HUNTER MODE: Pick a random outlaw to give clues about
      // Prefer outlaws we haven't caught yet
      const unidentifiedOutlaws = OUTLAWS.filter(o => {
        const status = state.outlawStatuses[o.id]
        return !status || !status.captured
      })
      if (unidentifiedOutlaws.length > 0) {
        outlaw = unidentifiedOutlaws[Math.floor(Math.random() * unidentifiedOutlaws.length)]
      }
    }

    if (!outlaw) return undefined

    // Get a random identity clue based on the outlaw's traits
    const traitKeys = Object.keys(outlaw.traits) as Array<keyof OutlawTraits>
    const randomTraitKey = traitKeys[Math.floor(Math.random() * traitKeys.length)]
    const traitValue = outlaw.traits[randomTraitKey]

    // Generate clue text based on witness personality and trait
    const clueTexts: Record<string, Record<string, string[]>> = {
      horse: {
        black: ["I saw someone ride through on a horse as dark as midnight.", "That stranger had a black stallion, finest I've seen."],
        white: ["A rider came through on a pure white horse.", "Saw a pale horse, like death itself was riding it."],
        pinto: ["Colorful horse, brown and white patches all over.", "That painted horse stood out in the crowd."],
        palomino: ["Golden horse with a white mane. Beautiful creature.", "A palomino came through here not long ago."],
      },
      hat: {
        stetson: ["Wore a proper cowboy hat, Stetson I'd reckon.", "Big wide-brimmed hat, casting shadow over their face."],
        bowler: ["Funny looking hat, round like a bowl.", "City folk hat, a derby or bowler they call it."],
        sombrero: ["Wide brimmed Mexican hat, hard to miss.", "Wore one of them sombreros, broader than their shoulders."],
        none: ["Didn't wear no hat, which is strange in this sun.", "Bare-headed, that one. Bold choice out here."],
      },
      weapon: {
        colt: ["Saw a six-shooter on their hip.", "Carried a Colt revolver, kept touching it nervous-like."],
        winchester: ["Had a rifle on their saddle. Winchester, I think.", "Long gun strapped to their back."],
        knife: ["Kept fiddling with a big knife at their belt.", "Didn't see no gun, but that knife looked mean."],
        dynamite: ["Saw some sticks poking from their saddlebag. Looked like dynamite!", "Dangerous cargo, they were carrying explosives."],
      },
      vice: {
        whiskey: ["Stank of whiskey, that one did.", "Ordered three whiskeys before they even sat down."],
        cigars: ["Left cigar ash everywhere they went.", "Fine cigars, the expensive kind."],
        gambling: ["Spent the whole time at the card table.", "Lost a fair bit at poker, I heard."],
        poetry: ["Kept mumbling verse under their breath.", "Strange one, was reading poetry at the bar."],
      },
      accent: {
        southern: ["Talked slow, Southern drawl.", "From down south, by the sound of it."],
        eastern: ["City talk, educated sounding.", "Spoke proper, like them Eastern folks."],
        mexican: ["Had that Mexican way of speaking.", "Spanish accent, rolled their R's."],
        irish: ["Irish through and through, by their voice.", "Talked like they just came off the boat from Ireland."],
      },
      build: {
        thin: ["Skinny as a rail, that one.", "Thin fellow, looked like a strong wind could blow them over."],
        average: ["Normal build, nothing special about their size.", "Regular sized, neither big nor small."],
        stocky: ["Built like a barrel, short but thick.", "Compact, powerful looking."],
        tall: ["Stood head and shoulders above everyone.", "Tall drink of water, had to duck through doors."],
      },
      mark: {
        scar_cheek: ["Had a nasty scar across their cheek.", "Face was marked, slashed right across the cheek."],
        missing_finger: ["Noticed they were missing a finger.", "Only had nine fingers, missing one on the left hand."],
        gold_tooth: ["Smiled and I saw a gold tooth glinting.", "Gold tooth caught the light when they talked."],
        tattoo_arm: ["Had ink on their arm, some kind of picture.", "Tattoo on their forearm, couldn't make out what."],
        limp: ["Walked with a limp, favored one leg.", "Had a bad leg, limped when they walked."],
        eyepatch: ["Wore an eyepatch, missing an eye.", "One-eyed, had a patch over it."],
        none: ["Nothing particular marking them that I could see.", "Plain looking, no distinguishing marks."],
      },
    }

    const textOptions = clueTexts[randomTraitKey]?.[traitValue] || [`They had ${randomTraitKey} that was ${traitValue}.`]
    const clueText = textOptions[Math.floor(Math.random() * textOptions.length)]

    // Determine reliability based on witness type
    const reliabilityMap: Record<WitnessType, number> = {
      bartender: 0.8,
      shopkeeper: 0.85,
      stable_hand: 0.7,
      traveler: 0.6,
      settler: 0.75,
      native_trader: 0.8,
      telegraph_operator: 0.9,
      sheriff_deputy: 0.95,
      prostitute: 0.7,
      preacher: 0.85,
      drunk: 0.4,
      child: 0.5,
    }

    return {
      id: `clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: clueText,
      witnessType,
      location,
      reliability: reliabilityMap[witnessType] || 0.5,
      trait: randomTraitKey,
      value: traitValue,
      isTrue: Math.random() < (reliabilityMap[witnessType] || 0.5),
      timestamp: Date.now(),
      outlawId: outlaw.id,  // Track which outlaw this clue is about
    }
  }, [state.currentOutlaw, state.outlawStatuses])

  // Add a clue manually (also extracts traits if present)
  const addClue = useCallback((clue: CollectedClue) => {
    setState(prev => {
      const newState = {
        ...prev,
        collectedClues: [...prev.collectedClues, clue]
      }
      // Also extract trait information if the clue has it
      if (clue.trait && clue.value) {
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
    if (clue.trait && clue.value) {
      setState(prev => ({
        ...prev,
        knownTraits: {
          ...prev.knownTraits,
          [clue.trait!]: clue.value
        }
      }))
    }
  }, [])

  // Get outlaws matching currently known traits
  const getMatchingOutlaws = useCallback((): Outlaw[] => {
    return findOutlawsByTraits(state.knownTraits)
  }, [state.knownTraits])

  // Get narrowed down results
  const getNarrowedDown = useCallback(() => {
    const possible = findOutlawsByTraits(state.knownTraits)
    const eliminated = OUTLAWS.filter(o => !possible.includes(o))
    return { possible, eliminated }
  }, [state.knownTraits])

  // Check if we can issue a warrant
  const canIssueWarrant = useCallback((): { canIssue: boolean; reason: string; matchCount: number } => {
    const matching = findOutlawsByTraits(state.knownTraits)

    if (Object.keys(state.knownTraits).length === 0) {
      return { canIssue: false, reason: 'No evidence collected. Gather clues first.', matchCount: 0 }
    }

    if (matching.length === 0) {
      return { canIssue: false, reason: 'No outlaws match these traits. Check your evidence.', matchCount: 0 }
    }

    if (matching.length > 1) {
      return { canIssue: false, reason: `Insufficient evidence. ${matching.length} suspects still match.`, matchCount: matching.length }
    }

    return { canIssue: true, reason: 'Evidence points to a single suspect.', matchCount: 1 }
  }, [state.knownTraits])

  // Issue a warrant
  const issueWarrant = useCallback((traits: Partial<OutlawTraits>): Warrant => {
    const matching = findOutlawsByTraits(traits)
    const targetId = matching.length === 1 ? matching[0].id : null

    const warrant: Warrant = {
      id: `warrant_${Date.now()}`,
      targetId,
      traits,
      issuedAt: state.currentCrime?.location || 'Unknown',
      issuedTimestamp: Date.now(),
      valid: matching.length === 1,
      matchedOutlaws: matching.map(o => o.id)
    }

    setState(prev => ({
      ...prev,
      activeWarrant: warrant,
      warrantHistory: [...prev.warrantHistory, warrant]
    }))

    return warrant
  }, [state.currentCrime?.location])

  // Execute the warrant (attempt to capture)
  const executeWarrant = useCallback((): { success: boolean; message: string; bounty: number } => {
    if (!state.activeWarrant) {
      return { success: false, message: 'No active warrant.', bounty: 0 }
    }

    if (!state.currentOutlaw) {
      return { success: false, message: 'No outlaw being pursued.', bounty: 0 }
    }

    const warrant = state.activeWarrant
    const actualOutlaw = OUTLAWS.find(o => o.id === state.currentOutlaw)

    if (!actualOutlaw) {
      return { success: false, message: 'Target not found.', bounty: 0 }
    }

    // Check if warrant matches the actual criminal
    if (warrant.targetId === state.currentOutlaw) {
      // Correct warrant!
      const bounty = actualOutlaw.bounty

      setState(prev => ({
        ...prev,
        outlawsCaught: prev.outlawsCaught + 1,
        totalBountyEarned: prev.totalBountyEarned + bounty,
        outlawStatuses: {
          ...prev.outlawStatuses,
          [state.currentOutlaw!]: {
            ...prev.outlawStatuses[state.currentOutlaw!],
            captured: true,
            warrant
          }
        },
        activeWarrant: null,
        currentOutlaw: null,
        collectedClues: [],
        knownTraits: {}
      }))

      return {
        success: true,
        message: `${actualOutlaw.alias} captured! "${actualOutlaw.catchphrase}"`,
        bounty
      }
    } else {
      // Wrong warrant!
      setState(prev => ({
        ...prev,
        wrongAccusations: prev.wrongAccusations + 1,
        activeWarrant: null
      }))

      // The outlaw gains time during the confusion
      advanceOutlaw(6)

      return {
        success: false,
        message: `Wrong suspect! The real criminal escapes in the confusion. +6 hours head start.`,
        bounty: 0
      }
    }
  }, [state.activeWarrant, state.currentOutlaw])

  // Advance the outlaw (they get further ahead)
  const advanceOutlaw = useCallback((hours: number) => {
    if (!state.currentOutlaw) return

    setState(prev => {
      const status = prev.outlawStatuses[state.currentOutlaw!]
      if (!status) return prev

      return {
        ...prev,
        outlawStatuses: {
          ...prev.outlawStatuses,
          [state.currentOutlaw!]: {
            ...status,
            hoursAhead: status.hoursAhead + hours
          }
        }
      }
    })
  }, [state.currentOutlaw])

  // Check if outlaw has escaped
  const checkEscape = useCallback((): boolean => {
    if (!state.currentOutlaw) return false

    const status = state.outlawStatuses[state.currentOutlaw]
    if (!status) return false

    if (status.hoursAhead >= 72) {
      // Outlaw escaped!
      setState(prev => ({
        ...prev,
        outlawsEscaped: prev.outlawsEscaped + 1,
        outlawStatuses: {
          ...prev.outlawStatuses,
          [state.currentOutlaw!]: {
            ...status,
            escaped: true
          }
        },
        currentOutlaw: null,
        activeWarrant: null,
        collectedClues: [],
        knownTraits: {}
      }))

      return true
    }

    return false
  }, [state.currentOutlaw, state.outlawStatuses])

  // Manually capture outlaw (for alternate paths)
  const captureOutlaw = useCallback((outlawId: string): { bounty: number; message: string } => {
    const outlaw = OUTLAWS.find(o => o.id === outlawId)
    if (!outlaw) return { bounty: 0, message: 'Outlaw not found.' }

    setState(prev => ({
      ...prev,
      outlawsCaught: prev.outlawsCaught + 1,
      totalBountyEarned: prev.totalBountyEarned + outlaw.bounty,
      outlawStatuses: {
        ...prev.outlawStatuses,
        [outlawId]: {
          ...prev.outlawStatuses[outlawId],
          captured: true
        }
      }
    }))

    return { bounty: outlaw.bounty, message: `${outlaw.alias} captured!` }
  }, [])

  // Get status of a specific outlaw
  const getOutlawStatus = useCallback((outlawId: string): OutlawStatus | null => {
    return state.outlawStatuses[outlawId] || null
  }, [state.outlawStatuses])

  // Get all outlaws
  const getAllOutlaws = useCallback((): Outlaw[] => {
    return [...OUTLAWS]
  }, [])

  // Get outlaw by ID
  const getOutlawById = useCallback((id: string): Outlaw | undefined => {
    return OUTLAWS.find(o => o.id === id)
  }, [])

  // ========================================================================
  // GOLD COUNTRY MYSTERY (Carmen Sandiego integration)
  // ========================================================================

  // Start a new case
  const startCase = useCallback((caseId: CaseId) => {
    const caseData = getCaseById(caseId)
    if (!caseData) return

    const suspect = getSuspectByCase(caseId)

    setState(prev => ({
      ...prev,
      activeCase: caseId,
      activeCaseData: caseData,
      // Reset educational clues for new case
      educationalCluesCollected: [],
      currentLocationClues: [],
      currentDiscountTier: null,
      // Set up the suspect as the current target using their Oregon Trail traits
      currentOutlaw: suspect?.id || null
    }))
  }, [])

  // Get the active case
  const getActiveCase = useCallback((): Case | null => {
    return state.activeCaseData
  }, [state.activeCaseData])

  // Get the suspect for the current case
  const getCaseSuspect = useCallback((): GoldCountrySuspect | null => {
    if (!state.activeCase) return null
    return getSuspectByCase(state.activeCase) || null
  }, [state.activeCase])

  // Solve the current case
  const solveCase = useCallback((): { success: boolean; message: string } => {
    if (!state.activeCase || !state.activeCaseData) {
      return { success: false, message: 'No active case.' }
    }

    const suspect = getSuspectByCase(state.activeCase)
    if (!suspect) {
      return { success: false, message: 'No suspect found for this case.' }
    }

    const correctClues = state.educationalCluesCollected.filter(c => c.answeredCorrectly).length
    const minClues = state.activeCaseData.minClues

    if (correctClues < minClues) {
      return {
        success: false,
        message: `Not enough evidence! You need ${minClues} clues, but only have ${correctClues}.`
      }
    }

    // Case solved!
    setState(prev => ({
      ...prev,
      casesSolved: [...prev.casesSolved, state.activeCase!],
      activeCase: null,
      activeCaseData: null
    }))

    return {
      success: true,
      message: `Case solved! ${suspect.name} (${suspect.nickname}) caught! "${suspect.voiceLine}"`
    }
  }, [state.activeCase, state.activeCaseData, state.educationalCluesCollected])

  // Get all cases
  const getAllCases = useCallback((): Case[] => {
    return [...CASES]
  }, [])

  // Get cases not yet solved
  const getAvailableCases = useCallback((): Case[] => {
    return CASES.filter(c => !state.casesSolved.includes(c.id))
  }, [state.casesSolved])

  // Get educational clues for a location (filtered by active case)
  const getCluesForLocation = useCallback((locationId: string): EducationalClue[] => {
    if (!state.activeCase) {
      // No active case - return all clues for location
      return getCluesByLocationId(locationId)
    }
    // Filter to only clues for the active case at this location
    return EDUCATIONAL_CLUES.filter(
      c => c.caseId === state.activeCase && c.locationId === locationId
    )
  }, [state.activeCase])

  // Attempt to answer an educational clue
  const attemptEducationalClue = useCallback((clueId: string, answer: string): {
    correct: boolean
    fact: string
    suspectHint: string
  } => {
    const clue = EDUCATIONAL_CLUES.find(c => c.id === clueId)
    if (!clue) {
      return { correct: false, fact: '', suspectHint: '' }
    }

    const correct = checkEducationalAnswer(clueId, answer)

    // Record the attempt
    const existingIndex = state.educationalCluesCollected.findIndex(c => c.clue.id === clueId)

    if (existingIndex === -1) {
      // First attempt at this clue
      setState(prev => {
        const newCollected: CollectedEducationalClue = {
          clue,
          answeredCorrectly: correct,
          attemptedAt: Date.now(),
          hintsUsed: 0
        }
        const collected = [...prev.educationalCluesCollected, newCollected]
        const correctCount = collected.filter(c => c.answeredCorrectly).length

        return {
          ...prev,
          educationalCluesCollected: collected,
          currentDiscountTier: getQualifyingTier(correctCount)
        }
      })
    } else if (correct && !state.educationalCluesCollected[existingIndex].answeredCorrectly) {
      // Update existing entry to correct
      setState(prev => {
        const collected = [...prev.educationalCluesCollected]
        collected[existingIndex] = {
          ...collected[existingIndex],
          answeredCorrectly: true
        }
        const correctCount = collected.filter(c => c.answeredCorrectly).length

        return {
          ...prev,
          educationalCluesCollected: collected,
          currentDiscountTier: getQualifyingTier(correctCount)
        }
      })
    }

    return {
      correct,
      fact: correct ? clue.fact : '',
      suspectHint: correct ? clue.suspectHint : ''
    }
  }, [state.educationalCluesCollected])

  // Use a hint for a clue
  const useHint = useCallback((clueId: string): string | null => {
    const clue = EDUCATIONAL_CLUES.find(c => c.id === clueId)
    if (!clue) return null

    setState(prev => ({
      ...prev,
      hintsUsedTotal: prev.hintsUsedTotal + 1
    }))

    // Return the hint link
    return clue.hintLink
  }, [])

  // Get educational progress
  const getEducationalProgress = useCallback(() => {
    const collected = state.educationalCluesCollected.length
    const correct = state.educationalCluesCollected.filter(c => c.answeredCorrectly).length
    const needed = state.activeCaseData?.minClues || 3
    const tier = getQualifyingTier(correct)

    // Calculate clues needed for next tier
    const tierThresholds = { recruit: 3, detective: 5, inspector: 7, chief: 10 }
    const tierOrder: (DiscountTier | null)[] = [null, 'recruit', 'detective', 'inspector', 'chief']
    const currentTierIndex = tier ? tierOrder.indexOf(tier) : 0
    const nextTier = tierOrder[currentTierIndex + 1]
    const nextTierClues = nextTier ? tierThresholds[nextTier] - correct : 0

    return {
      collected,
      correct,
      needed,
      discountTier: tier,
      nextTierClues: Math.max(0, nextTierClues)
    }
  }, [state.educationalCluesCollected, state.activeCaseData])

  // Get current discount tier
  const getCurrentDiscountTier = useCallback((): DiscountTier | null => {
    const correct = state.educationalCluesCollected.filter(c => c.answeredCorrectly).length
    return getQualifyingTier(correct)
  }, [state.educationalCluesCollected])

  // Get count of correctly answered clues
  const getCorrectClueCount = useCallback((): number => {
    return state.educationalCluesCollected.filter(c => c.answeredCorrectly).length
  }, [state.educationalCluesCollected])

  const value: MysteryContextValue = {
    state,
    initializeMystery,
    startChase,
    generateCrimeAtLocation,
    investigateCrimeScene,
    interviewWitness,
    generateClueForWitness,
    addClue,
    processClue,
    getMatchingOutlaws,
    getNarrowedDown,
    issueWarrant,
    executeWarrant,
    canIssueWarrant,
    advanceOutlaw,
    checkEscape,
    captureOutlaw,
    getOutlawStatus,
    getAllOutlaws,
    getOutlawById,

    // Gold Country Mystery
    startCase,
    getActiveCase,
    getCaseSuspect,
    solveCase,
    getAllCases,
    getAvailableCases,
    getCluesForLocation,
    attemptEducationalClue,
    useHint,
    getEducationalProgress,
    getCurrentDiscountTier,
    getCorrectClueCount
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

// Helper: Get next location on the trail
function getNextLocationOnTrail(currentLocation: string): string {
  const trailLocations = [
    'Independence', 'Kansas River', 'Fort Kearny', 'Chimney Rock',
    'Fort Laramie', 'Independence Rock', 'South Pass', 'Fort Bridger',
    'Soda Springs', 'Fort Hall', 'Snake River', 'Fort Boise',
    'Blue Mountains', 'The Dalles', 'Sacramento Valley', 'Gold Country'
  ]

  const currentIndex = trailLocations.findIndex(
    loc => loc.toLowerCase().includes(currentLocation.toLowerCase()) ||
           currentLocation.toLowerCase().includes(loc.toLowerCase())
  )

  if (currentIndex === -1 || currentIndex === trailLocations.length - 1) {
    return trailLocations[trailLocations.length - 1]
  }

  return trailLocations[currentIndex + 1]
}

// Export trait options for UI
export { TRAIT_OPTIONS }
