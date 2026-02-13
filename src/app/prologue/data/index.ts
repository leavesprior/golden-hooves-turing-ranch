// Prologue data module exports
// Central index for all prologue game data

// Character definitions
export {
  PROLOGUE_CHARACTERS,
  CHARACTER_PROGRESSION,
  getCharacter,
  getAllCharacters,
  type PrologueCharacterId,
  type PrologueCharacterDef,
} from './characters'

// Location data by act
export {
  NORSEMAN_LOCATIONS,
  getNorsemanLocation,
  getNorsemanStartLocation,
} from './locations/norseman'

export {
  NATIVE_LOCATIONS,
  getNativeLocation,
  getNativeStartLocation,
} from './locations/native'

export {
  CALIFIA_LOCATIONS,
  getCalifiaLocation,
  getCalifiaStartLocation,
} from './locations/califia'

export {
  INCAN_LOCATIONS,
  getIncanLocation,
  getIncanStartLocation,
} from './locations/incan'

export {
  CONVERGENCE_LOCATIONS,
  CONVERGENCE_UNLOCK_CONDITIONS,
  getConvergenceLocation,
  isConvergenceLocationUnlocked,
} from './locations/convergence'

// Export location type
export type { PrologueLocation } from './locations/norseman'

// Artifact and clue system
export {
  PROLOGUE_ARTIFACTS,
  getArtifact,
  getArtifactsByLocation,
  getArtifactsByTrait,
  matchArtifactTraits,
  findAnomalousConnections,
  type Material,
  type OriginCulture,
  type AgePeriod,
  type Purpose,
  type SymbolFamily,
  type Provenance,
  type TraitCategory,
  type ArtifactTrait,
  type Artifact,
} from './clues/artifactTraits'

// Witness types
export {
  WITNESS_TYPES,
  getWitnessType,
  getWitnessesByCulture,
  getReliabilityScore,
  getClueQualityScore,
  type WitnessReliability,
  type ClueQuality,
  type WitnessType,
} from './clues/witnessTypes'

// AI Guide entries
export {
  GUIDE_ENTRIES,
  getGuideEntry,
  getEntriesByTier,
  getEntriesByCategory,
  getEntriesForCharacter,
  type GuideEntry,
} from './guide/entries'

// Time echoes (easter eggs connecting to 1849 game)
export {
  TIME_ECHOES,
  getEchoById,
  getEchoesForCharacter,
  getEchoByAct,
  type TimeEchoData,
} from './easterEggs'

// Portal network
export {
  PORTAL_SITES,
  getPortalSite,
  getConnectedSites,
  getPortalSitesForCharacter,
  getFullNetwork,
  type PortalSite,
} from './portalNetwork'

// Historical facts (three-tier system)
export {
  HISTORICAL_FACTS,
  getFactById,
  getFactsByTier,
  getFactsByCulture,
  getFactsForGameRelevance,
  type HistoricalFact,
} from './historicalFacts'

// Helper function: Get all locations for a character
export function getAllLocationsForCharacter(characterId: PrologueCharacterId): PrologueLocation[] {
  switch (characterId) {
    case 'norseman':
      return NORSEMAN_LOCATIONS
    case 'native':
      return NATIVE_LOCATIONS
    case 'califia':
      return CALIFIA_LOCATIONS
    case 'incan':
      return INCAN_LOCATIONS
    default:
      return []
  }
}

// Helper function: Get starting location for a character
export function getStartingLocation(characterId: PrologueCharacterId): PrologueLocation | undefined {
  switch (characterId) {
    case 'norseman':
      return getNorsemanStartLocation()
    case 'native':
      return getNativeStartLocation()
    case 'califia':
      return getCalifiaStartLocation()
    case 'incan':
      return getIncanStartLocation()
    default:
      return undefined
  }
}

// Import types and values for helper functions
import type { PrologueCharacterId } from './characters'
import { NORSEMAN_LOCATIONS, getNorsemanStartLocation } from './locations/norseman'
import { NATIVE_LOCATIONS, getNativeStartLocation } from './locations/native'
import { CALIFIA_LOCATIONS, getCalifiaStartLocation } from './locations/califia'
import { INCAN_LOCATIONS, getIncanStartLocation } from './locations/incan'
import type { PrologueLocation } from './locations/norseman'
