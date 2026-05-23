import { BOBR_CANON_GHOST_NARRATOR, BOBR_CANON_PRIMARY_GUIDE } from '@/lib/bobrCanon'
import type {
  MapPoint,
  ObservationHotspot,
  SceneAssetMetadata,
  ScenePropData,
  TerrainTile,
  TopDownSceneBetaProps,
} from './TopDownSceneBeta'

export const WELCOME_SCENE_ASSETS: SceneAssetMetadata[] = [
  {
    id: 'welcome-backdrop',
    label: 'Welcome Gate Backdrop',
    src: '/scene-backdrops/welcome.jpg',
    role: 'backdrop',
    usage: 'Playable threshold backdrop for the beta welcome scene.',
  },
  {
    id: 'gate-cinematic-source',
    label: 'BOBR Gate View',
    src: '/home/granny/Documents/BOBR/marketing/bobr_backdrop_welcome_20260428.png',
    role: 'layout-reference',
    usage: 'Local cinematic gate view used to stage the entrance, path, tree cover, and ranch threshold.',
  },
  {
    id: 'satellite-near-ranch',
    label: 'Near-Ranch Satellite Reference',
    src: '/home/granny/Screenshots/Screenshot from 2026-05-08 12-16-00.png',
    role: 'satellite-reference',
    usage: 'Local top-down reference for road orientation and ranch-area layout.',
    rightsNote: 'Reference-only unless final asset rights are cleared.',
  },
  {
    id: 'satellite-neighborhood',
    label: 'Neighborhood Satellite Reference',
    src: '/home/granny/Screenshots/Screenshot from 2026-05-08 12-14-49.png',
    role: 'satellite-reference',
    usage: 'Local top-down reference for surrounding road and approach context.',
    rightsNote: 'Reference-only unless final asset rights are cleared.',
  },
]

export const WELCOME_TERRAIN_TILES: TerrainTile[] = [
  { id: 'hill-left', x: 24, y: 34, kind: 'scrub' },
  { id: 'hill-center', x: 38, y: 28, kind: 'grass' },
  { id: 'ridge-center', x: 52, y: 30, kind: 'scrub' },
  { id: 'ridge-right', x: 66, y: 35, kind: 'grass' },
  { id: 'gate-pad', x: 48, y: 43, kind: 'stone' },
  { id: 'entry-left', x: 34, y: 48, kind: 'path' },
  { id: 'entry-right', x: 62, y: 49, kind: 'path' },
  { id: 'raw-land', x: 24, y: 61, kind: 'grass' },
  { id: 'main-road', x: 44, y: 62, kind: 'path' },
  { id: 'work-yard', x: 66, y: 62, kind: 'scrub' },
  { id: 'low-water', x: 80, y: 71, kind: 'water' },
  { id: 'steward-flat', x: 48, y: 78, kind: 'grass' },
]

export const WELCOME_SCENE_PROPS: ScenePropData[] = [
  { id: 'left-oak', x: 18, y: 42, kind: 'oak' },
  { id: 'right-oak', x: 78, y: 39, kind: 'oak' },
  { id: 'entry-gate', x: 49, y: 39, kind: 'gate' },
  { id: 'west-fence', x: 30, y: 44, kind: 'fence' },
  { id: 'east-fence', x: 68, y: 45, kind: 'fence' },
  { id: 'utility-stake', x: 70, y: 57, kind: 'utility' },
  { id: 'water-tank', x: 75, y: 68, kind: 'waterTank' },
  { id: 'work-shed', x: 57, y: 71, kind: 'workShed' },
]

export const WELCOME_WALKWAY_POINTS: MapPoint[] = [
  { x: 48, y: 77 },
  { x: 47, y: 70 },
  { x: 45, y: 63 },
  { x: 43, y: 56 },
  { x: 45, y: 49 },
  { x: 49, y: 43 },
]

export const WELCOME_OBSERVATION_HOTSPOTS: ObservationHotspot[] = [
  {
    id: 'raw_land',
    label: 'Raw Land',
    x: 28,
    y: 62,
    prompt: 'Look past the entrance. What would it take to turn raw foothill land into a place guests can safely reach?',
    evidence: 'No ranch works by accident: roads, drainage, power, water, and defensible space all had to be made legible.',
    sourceLayer: 'Silver',
    sourceNote:
      "Candidate family-history beat from Dad's Book notes; verify final public wording before treating it as settled lore.",
    response:
      'Greggory does not hand you the answer. He points at the land and asks what had to be solved first: access, water, fire, or shelter.',
  },
  {
    id: 'first_thirteen',
    label: 'First 13 Acres',
    x: 52,
    y: 38,
    prompt: 'Find the first boundary in your mind. Why would a family start with a smaller parcel and add piece by piece?',
    evidence:
      "Candidate lore thread: Dad's Book points toward a first smaller land purchase and later parcel-by-parcel growth.",
    sourceLayer: 'Silver',
    sourceNote:
      "Potential family-history information from Dad's Book; keep as lore candidate until verified for public canon.",
    response:
      'He says a ranch is not bought all at once when you have more time than money. You build until the land starts answering back.',
  },
  {
    id: 'work_trace',
    label: 'Work Trace',
    x: 72,
    y: 58,
    prompt: 'Inspect the built edges: posts, paths, cleared limbs, utility routes. Which details show work instead of decoration?',
    evidence: 'Observation clue: built systems are part of the mystery, not background art.',
    sourceLayer: 'Silver',
    sourceNote: 'Interpretive beat from verified construction and ranch-maintenance themes, not a quoted passage.',
    response:
      'Greggory tells you to notice straight lines, cleared fuel, places water would run, and anything too practical to be accidental.',
  },
  {
    id: 'living_steward',
    label: 'Living Steward',
    x: 47,
    y: 76,
    prompt: 'The ranch is not frozen in memory. Who keeps the systems working now?',
    evidence:
      "Leif is the present-day bridge between family lore, guest operations, maintenance, and the living ranch.",
    sourceLayer: 'Silver',
    sourceNote:
      "Current-ranch and family-history beat; use Dad's Book as support material, then verify exact public phrasing.",
    response:
      'The old work only matters if someone keeps it alive. The next clue is not just what was built, but who keeps it running.',
  },
  {
    id: 'memory_layer',
    label: 'Memory Layer',
    x: 64,
    y: 27,
    prompt: 'Some parts of the ranch are practical. Some are remembered. What changes when a place keeps both?',
    evidence: `${BOBR_CANON_GHOST_NARRATOR.displayName} belongs to the memory layer, but her final public spelling is still pending.`,
    sourceLayer: 'Silver',
    sourceNote: 'Leif-directed ghost narrator role; display spelling and public relationship wording still need verification.',
    response:
      'Greggory gets quieter here. He says some clues are built with tools, and some are kept because someone loved the place enough to leave a shape behind.',
  },
]

export const WELCOME_OBSERVATION_SCENE: TopDownSceneBetaProps = {
  sceneTitle: 'Welcome Gate',
  sceneSubtitle:
    "The first ranch threshold: land, work, memory, and the systems that keep Back of Beyond alive.",
  backdropSrc: '/scene-backdrops/welcome.jpg',
  guideName: BOBR_CANON_PRIMARY_GUIDE.displayName,
  guideRole: 'Ranch-memory guide',
  guideIntro:
    "The gold-rush stranger is only a prototype now. This beta starts with the family-built ranch and the details a careful guest can observe.",
  assets: WELCOME_SCENE_ASSETS,
  terrainTiles: WELCOME_TERRAIN_TILES,
  sceneProps: WELCOME_SCENE_PROPS,
  walkwayPoints: WELCOME_WALKWAY_POINTS,
  guidePosition: { x: 35, y: 72 },
  playerStart: { x: 47, y: 77 },
  hotspots: WELCOME_OBSERVATION_HOTSPOTS,
}
