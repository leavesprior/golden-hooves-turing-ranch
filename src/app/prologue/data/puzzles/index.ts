// Barrel file for puzzle data

export {
  ALL_PUZZLE_OBJECTS,
  getPuzzleObjectById,
  getPuzzleObjectsByCharacter,
  getPuzzleObjectsByAct,
  getCompatibleObjects,
} from './puzzleObjects'

export type { PuzzleObjectData } from './puzzleObjects'

export {
  ALL_TRANSFORMATIONS,
  TRANSFORM_WATER,
  TRANSFORM_FIRE,
  TRANSFORM_MOONLIGHT,
  TRANSFORM_SUNLIGHT,
  TRANSFORM_COMBINE,
  TRANSFORM_BREAK,
  TRANSFORM_SMOKE,
  TRANSFORM_MERCURY,
  TRANSFORM_STARLIGHT,
  TRANSFORM_EARTH_BURIAL,
  TRANSFORM_SOUND,
  TRANSFORM_BLOOD_OFFERING,
  getTransformationById,
  getApplicableTransformations,
} from './puzzleTransformations'

export type { PuzzleTransformation } from './puzzleTransformations'
