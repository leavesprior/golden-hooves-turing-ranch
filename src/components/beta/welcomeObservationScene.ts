import { BOBR_CANON_PRIMARY_GUIDE } from '@/lib/bobrCanon'
import type {
  MapPoint,
  SceneAssetMetadata,
  ScenePropData,
  TerrainTile,
  TopDownSceneBetaProps,
} from './TopDownSceneBeta'
import { WELCOME_HOTSPOTS } from './welcomeHotspots'

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

export const WELCOME_OBSERVATION_HOTSPOTS = WELCOME_HOTSPOTS

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
  hotspots: WELCOME_HOTSPOTS,
}
