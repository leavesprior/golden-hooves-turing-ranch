import { BOBR_CANON_PRIMARY_GUIDE, getBobrCanonCharacter } from '@/lib/bobrCanon'
import type {
  MapPoint,
  ObservationHotspot,
  SceneAssetMetadata,
  ScenePropData,
  TerrainTile,
  TopDownSceneBetaProps,
} from './TopDownSceneBeta'

const BOBR_CANON_STEWARD = getBobrCanonCharacter('leif_pryor')

export const HOUSE_SCENE_ASSETS: SceneAssetMetadata[] = [
  {
    id: 'game-room-backdrop',
    label: 'Game Room Backdrop',
    src: '/scene-backdrops/game-room.jpg',
    role: 'backdrop',
    usage: 'Playable house-node backdrop for the built-ranch beta scene.',
  },
  {
    id: 'house-photo-reference',
    label: 'House Node Reference',
    src: '/home/granny/Documents/BOBR/pictures/01-20190329-2105.jpg',
    role: 'property-photo',
    usage: 'Local property photo reference for the house massing and built-ranch identity.',
  },
  {
    id: 'kitchen-backdrop-reference',
    label: 'Kitchen Clue Backdrop',
    src: '/scene-backdrops/kitchen.jpg',
    role: 'backdrop',
    usage: 'Existing clue backdrop reference for guest-readiness and working-house details.',
  },
  {
    id: 'fireplace-backdrop-reference',
    label: 'Fireplace Clue Backdrop',
    src: '/scene-backdrops/fireplace.jpg',
    role: 'backdrop',
    usage: 'Existing clue backdrop reference for hearth, warmth, and gathering beats.',
  },
]

export const HOUSE_TERRAIN_TILES: TerrainTile[] = [
  { id: 'entry-yard', x: 28, y: 70, kind: 'path' },
  { id: 'front-pad', x: 42, y: 61, kind: 'stone' },
  { id: 'house-core', x: 53, y: 50, kind: 'stone' },
  { id: 'work-yard', x: 70, y: 60, kind: 'scrub' },
  { id: 'guest-wing-left', x: 34, y: 44, kind: 'grass' },
  { id: 'guest-wing-right', x: 68, y: 42, kind: 'grass' },
  { id: 'deck-edge', x: 50, y: 31, kind: 'path' },
  { id: 'systems-corner', x: 78, y: 74, kind: 'grass' },
  { id: 'memory-corner', x: 22, y: 35, kind: 'scrub' },
]

export const HOUSE_SCENE_PROPS: ScenePropData[] = [
  { id: 'built-house', x: 52, y: 49, kind: 'house' },
  { id: 'front-deck', x: 50, y: 31, kind: 'deck' },
  { id: 'hearth', x: 38, y: 48, kind: 'hearth' },
  { id: 'game-table', x: 63, y: 52, kind: 'table' },
  { id: 'tool-bench', x: 76, y: 64, kind: 'toolBench' },
  { id: 'utility-route', x: 78, y: 73, kind: 'utility' },
  { id: 'left-oak', x: 21, y: 40, kind: 'oak' },
]

export const HOUSE_WALKWAY_POINTS: MapPoint[] = [
  { x: 28, y: 76 },
  { x: 34, y: 69 },
  { x: 42, y: 62 },
  { x: 50, y: 55 },
  { x: 58, y: 50 },
  { x: 66, y: 55 },
  { x: 74, y: 64 },
]

export const HOUSE_OBSERVATION_HOTSPOTS: ObservationHotspot[] = [
  {
    id: 'house_shell',
    label: 'House Shell',
    x: 52,
    y: 40,
    prompt: 'Read the building as a system. What had to be solved before this could become a guest-ready ranch house?',
    evidence:
      'The house node ties shelter, access, power, water, guest comfort, and family labor into one visible structure.',
    sourceLayer: 'Gold',
    sourceNote: 'Verified public property surface: the working guest house and its existing clue backdrops are live assets.',
    response:
      'Greggory asks you to stop seeing a house as scenery. A ranch house is a stack of solved problems that has to keep solving them.',
    linkedClueSlug: 'game-room',
    assetRefs: ['game-room-backdrop', 'house-photo-reference'],
  },
  {
    id: 'guest_readiness',
    label: 'Guest Readiness',
    x: 70,
    y: 48,
    prompt: 'Find the difference between a family place and a place ready for strangers to stay safely.',
    evidence:
      'Beds, kitchen, heat, play space, instructions, and maintenance all turn private memory into a public guest experience.',
    sourceLayer: 'Gold',
    sourceNote: 'Grounded in existing BOBR website amenities and live clue routes for bedroom, kitchen, fireplace, and game room.',
    response:
      `${BOBR_CANON_STEWARD.displayName} is the living bridge here: if a guest touches it, somebody has to maintain it before they arrive.`,
    unlocks: ['bedroom', 'kitchen', 'fireplace'],
    assetRefs: ['kitchen-backdrop-reference', 'fireplace-backdrop-reference'],
  },
  {
    id: 'work_trace',
    label: 'Work Trace',
    x: 80,
    y: 66,
    prompt: 'Inspect the practical corner: tools, utility routes, edges, and repairs. Which details show ongoing work?',
    evidence: 'A finished guest room still depends on unfinished labor: repairs, checks, cleaning, supplies, and system upkeep.',
    sourceLayer: 'Silver',
    sourceNote:
      "Interpretive beat from verified ranch-maintenance themes and Dad's Book candidate lore; not a public biographical claim.",
    response:
      'Greggory points past the nice room to the workbench. The clue is not whether it looks done. The clue is what keeps it done.',
    linkedClueSlug: 'ev-charger',
  },
  {
    id: 'hearth_gathering',
    label: 'Hearth Gathering',
    x: 34,
    y: 47,
    prompt: 'Why does warmth matter in a ranch game? Look for the place where practical comfort becomes memory.',
    evidence:
      'The hearth is both a live clue surface and a gathering symbol: heat, safety, winter, conversation, and remembered work.',
    sourceLayer: 'Silver',
    sourceNote:
      'Uses the existing fireplace clue as public game material while keeping family-memory meaning interpretive until verified.',
    response:
      'He says fire is the old test: did you build something that can keep people warm when the weather stops being polite?',
    linkedClueSlug: 'fireplace',
    assetRefs: ['fireplace-backdrop-reference'],
  },
  {
    id: 'play_room_signal',
    label: 'Play Room Signal',
    x: 56,
    y: 63,
    prompt: 'A game room is not just decoration. What does play reveal about how the ranch wants guests to move through it?',
    evidence:
      'The live clue game already uses play as orientation: guests follow fun first, then notice history, systems, and place.',
    sourceLayer: 'Bronze',
    sourceNote:
      'Game-design interpretation layered over the existing game-room route; useful as fiction until progression rules are finalized.',
    response:
      'Greggory lets the room stay playful. If the ranch teaches too loudly, people stop exploring. Let the game carry the lesson.',
    linkedClueSlug: 'game-room',
    unlocks: ['deck'],
  },
]

export const HOUSE_OBSERVATION_SCENE: TopDownSceneBetaProps = {
  sceneTitle: 'Built Ranch House',
  sceneSubtitle:
    'The second field scene: house, work systems, guest readiness, and the labor that keeps comfort alive.',
  backdropSrc: '/scene-backdrops/game-room.jpg',
  guideName: BOBR_CANON_PRIMARY_GUIDE.displayName,
  guideRole: 'Builder logic guide',
  guideIntro:
    'This beta keeps the live clue intact, then asks what the built house reveals when you treat every room as part of a working ranch system.',
  assets: HOUSE_SCENE_ASSETS,
  terrainTiles: HOUSE_TERRAIN_TILES,
  sceneProps: HOUSE_SCENE_PROPS,
  walkwayPoints: HOUSE_WALKWAY_POINTS,
  guidePosition: { x: 28, y: 68 },
  playerStart: { x: 30, y: 76 },
  hotspots: HOUSE_OBSERVATION_HOTSPOTS,
}
