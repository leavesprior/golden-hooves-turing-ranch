/** Authored 1849 walking scenes. These are fictional game layouts, not surveys
 * or GPS destinations. Movement never awards visits, clues, items, or karma. */
export const TOWN_WALK_VERSION = 1
export const TOWN_WALK_TILE_SIZE = 16
/**
 * How big one tile is DRAWN, as opposed to how big it is for collisions
 * (TOWN_WALK_TILE_SIZE). The pixel walk went to 32 for the 32/64-bit pass
 * (ca96dff), which doubled the walk SVG's viewBox — and the browser tool was
 * still asserting the old string, so it failed on every town while the walk
 * itself was correct. The renderer and anything that checks the renderer read
 * this one constant, so the next change to the draw scale cannot silently
 * disagree with the thing measuring it.
 */
export const TOWN_WALK_ART_TILE = 32
export type TownWalkTownId = 'volcano' | 'west_point'
export type TownWalkRoomId = 'exterior' | 'shelter'
export type TownWalkDirection = 'up' | 'down' | 'left' | 'right'
export interface TownWalkPosition { x: number; y: number }
export type TownWalkTerrain = 'grass' | 'dirt' | 'water' | 'planks' | 'floor'
export type TownWalkPropKind = 'tree' | 'rock' | 'canvas' | 'wall' | 'crate' | 'bench' | 'table' | 'marker' | 'fire'
export interface TownWalkProp {
  kind: TownWalkPropKind
  position: TownWalkPosition
  blocksMovement: boolean
}
interface TargetBase { id: string; label: string; position: TownWalkPosition }
export interface TownWalkDestination { roomId: TownWalkRoomId; position: TownWalkPosition }
export type TownWalkTarget =
  | (TargetBase & { kind: 'attraction'; attractionId: string })
  | (TargetBase & { kind: 'npc'; npcId: string })
  | (TargetBase & { kind: 'entrance'; attractionId: string; destination: TownWalkDestination })
  | (TargetBase & { kind: 'exit'; destination: TownWalkDestination })
export interface TownWalkMap {
  townId: TownWalkTownId
  roomId: TownWalkRoomId
  label: string
  year: 1849
  width: 20
  height: 11
  /** g grass, . dirt, ~ water, = planks, f shelter floor. Props are separate. */
  terrainRows: readonly string[]
  props: readonly TownWalkProp[]
  targets: readonly TownWalkTarget[]
  spawn: TownWalkPosition
  fictional: true
  notes: string
  sources: readonly string[]
}
export interface TownWalkSnapshot {
  version: typeof TOWN_WALK_VERSION
  townId: TownWalkTownId
  roomId: TownWalkRoomId
  position: TownWalkPosition
  /** The exterior approach cell, retained across a shelter save/reload. */
  exteriorReturnPosition?: TownWalkPosition
}
export interface TownWalkTile { terrain: TownWalkTerrain; prop?: TownWalkPropKind; blocked: boolean }

const WIDTH = 20
const HEIGHT = 11
const TERRAIN: Record<string, TownWalkTerrain> = { g: 'grass', '.': 'dirt', '~': 'water', '=': 'planks', f: 'floor' }
const STEP: Record<TownWalkDirection, TownWalkPosition> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
}
const at = (x: number, y: number): TownWalkPosition => ({ x, y })
const prop = (kind: TownWalkPropKind, x: number, y: number): TownWalkProp => ({ kind, position: at(x, y), blocksMovement: true })
const same = (a: TownWalkPosition, b: TownWalkPosition) => a.x === b.x && a.y === b.y

// Small authored geometry helpers build fixed data once; they are not a map
// generator or an interpretation of the separate narrative ASCII readings.
function ground(fill: string) { return Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill(fill)) }
function strip(rows: string[][], y: number, left: number, right: number, terrain: string) {
  for (let x = left; x <= right; x++) rows[y][x] = terrain
}
function canvas(left: number, top: number, right: number, bottom: number, doorX: number): TownWalkProp[] {
  const props: TownWalkProp[] = []
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    if (x !== doorX || y !== bottom) props.push(prop('canvas', x, y))
  }
  return props
}

// Sutter Creek's course through the camp, one tile per ~120 m. Derived from the
// OpenStreetMap centreline through the georeference in townGeo.ts (anchor: the
// OHP No. 29 marker at Main & Consolation = tile 10,5), then made 4-connected so
// it blocks a walker the way water does. It comes in from the north-east, passes
// under the road at the plank crossing, and meanders south-west, as it does on
// the ground today. Whether it ran in exactly this channel in 1849 is NOT known:
// hydraulic mining began in 1855. `townGeo.test.ts` holds this list to the
// georeference, so neither can drift alone.
export const VOLCANO_CREEK_TILES: readonly (readonly [number, number])[] = [
  [0, 8], [1, 8], [2, 8], [3, 8], [3, 9], [3, 10], [4, 9], [4, 10], [5, 9], [6, 8], [6, 9], [7, 8], [8, 7], [8, 8],
  [9, 7], [10, 7], [11, 6], [11, 7], [12, 6], [13, 5], [13, 6], [14, 5], [15, 4], [15, 5], [16, 4], [17, 3], [17, 4],
  [18, 2], [18, 3], [19, 2],
]
const volcanoGround = ground('g')
for (let y = 0; y < HEIGHT; y++) strip(volcanoGround, y, 9, 11, '.')
strip(volcanoGround, 5, 2, 12, '.')
strip(volcanoGround, 8, 3, 11, '.')
volcanoGround[4][5] = '.'
// The road crosses the creek on planks; everywhere else it is water.
for (const [x, y] of VOLCANO_CREEK_TILES) volcanoGround[y][x] = x >= 9 && x <= 11 ? '=' : '~'
const westPointGround = ground('g')
for (let y = 0; y < HEIGHT; y++) {
  const left = y < 4 ? 9 : y < 8 ? 10 : 11
  strip(westPointGround, y, left, left + 1, '.')
}
strip(westPointGround, 5, 3, 18, '.')
westPointGround[4][15] = '.'

const COMMON_SOURCES = ['docs/OREGON_TRAIL_CORE_TO_LEVEL2_EXPLORE_VISUAL_PLAN.md', 'docs/CHASE_ART_BIBLE_20260614.md']
const VOLCANO_SOURCES = [...COMMON_SOURCES, 'src/app/explore/ExploreClient.tsx#volcano', 'src/lib/goldCountryEditorial.ts#v_bell', 'src/lib/overlay/townAsciiInterior.ts']
const WEST_POINT_SOURCES = [...COMMON_SOURCES, 'src/app/explore/ExploreClient.tsx#wp_trail_camp', 'src/lib/goldCountryEditorial.ts#wp_pack', 'src/lib/townRegistry.ts#west_point']

const volcanoExterior: TownWalkMap = {
  townId: 'volcano', roomId: 'exterior', label: 'The canvas camp', year: 1849,
  width: WIDTH, height: HEIGHT, terrainRows: volcanoGround.map(row => row.join('')),
  spawn: at(10, 9), fictional: true,
  notes: 'An authored camp in the bowl: canvas, grass, creek and wooden markers. The creek\'s course and the graves follow today\'s ground (townGeo.ts, ~120 m per tile); paths, tents and the saloon are invented for play. Not a surveyed 1849 plan.',
  sources: VOLCANO_SOURCES,
  props: [
    ...canvas(3, 1, 7, 4, 5),
    prop('tree', 1, 1), prop('tree', 1, 2), prop('tree', 12, 1), prop('tree', 18, 1),
    prop('tree', 18, 4), prop('tree', 1, 9), prop('tree', 17, 9), prop('tree', 18, 9),
    prop('rock', 4, 8), prop('rock', 2, 6), prop('rock', 15, 8),
    // Graves where Volcano's Pioneer (Protestant) Cemetery is today, beside the
    // road north of the creek (townGeo.ts 'cemetery'; was 488 m too far east).
    // Whether 1849 burials were here is not known.
    prop('marker', 12, 2), prop('marker', 13, 2), prop('marker', 12, 3),
    prop('crate', 7, 5), prop('fire', 11, 5),
  ],
  targets: [
    { id: 'vol_canvas_flat.enter', kind: 'entrance', attractionId: 'vol_canvas_flat', label: 'Enter the canvas saloon', position: at(5, 4), destination: { roomId: 'shelter', position: at(10, 8) } },
    { id: 'vol_soldiers_gulch', kind: 'attraction', attractionId: 'vol_soldiers_gulch', label: "Look at Soldiers’ Gulch", position: at(4, 8) },
    { id: 'vol_cemetery', kind: 'attraction', attractionId: 'vol_cemetery', label: 'Look at the wooden markers', position: at(12, 3) },
    { id: 'v_bell', kind: 'npc', npcId: 'v_bell', label: 'Talk to Josiah Bell', position: at(8, 5) },
  ],
}
const westPointExterior: TownWalkMap = {
  townId: 'west_point', roomId: 'exterior', label: 'The trail camp', year: 1849,
  width: WIDTH, height: HEIGHT, terrainRows: westPointGround.map(row => row.join('')),
  spawn: at(11, 9), fictional: true,
  notes: 'An authored pack-road camp among trees. The road bends, shelter and supplies are fictional placements; this is West Point, not the ranch or a surveyed historical street.',
  sources: WEST_POINT_SOURCES,
  props: [
    ...canvas(14, 1, 17, 4, 15),
    prop('tree', 2, 1), prop('tree', 3, 2), prop('tree', 5, 1), prop('tree', 7, 2),
    prop('tree', 1, 6), prop('tree', 3, 8), prop('tree', 5, 9), prop('tree', 17, 7), prop('tree', 18, 9),
    prop('rock', 6, 4), prop('rock', 14, 8), prop('crate', 16, 5), prop('fire', 6, 7),
  ],
  targets: [
    { id: 'wp_trail_camp', kind: 'attraction', attractionId: 'wp_trail_camp', label: 'Look at the pack road', position: at(10, 6) },
    { id: 'wp_trail_camp.enter', kind: 'entrance', attractionId: 'wp_trail_camp', label: 'Enter the pack shelter', position: at(15, 4), destination: { roomId: 'shelter', position: at(10, 8) } },
    { id: 'wp_pack', kind: 'npc', npcId: 'wp_pack', label: 'Talk to the Packer', position: at(12, 5) },
  ],
}

function shelter(townId: TownWalkTownId): TownWalkMap {
  const volcano = townId === 'volcano'
  const walls: TownWalkProp[] = []
  for (let x = 0; x < WIDTH; x++) walls.push(prop('wall', x, 0), prop('wall', x, HEIGHT - 1))
  for (let y = 1; y < HEIGHT - 1; y++) walls.push(prop('wall', 0, y), prop('wall', WIDTH - 1, y))
  const attractionId = volcano ? 'vol_canvas_flat' : 'wp_trail_camp'
  return {
    townId, roomId: 'shelter', label: volcano ? 'Inside the canvas saloon' : 'Inside the pack shelter', year: 1849,
    width: WIDTH, height: HEIGHT, terrainRows: ground('f').map(row => row.join('')),
    spawn: at(10, 8), fictional: true,
    notes: volcano
      ? 'Fictional canvas-room furniture for walking. The existing canvas-saloon ASCII reading remains its own view; no new historical building or reward is implied.'
      : 'Fictional shelter beside the pack road, with flour and rope. No surviving building, surveyed placement or new historical attraction is claimed.',
    sources: volcano ? VOLCANO_SOURCES : WEST_POINT_SOURCES,
    props: [...walls, prop('table', 9, 3), prop('table', 10, 3), prop('table', 11, 3),
      prop('crate', 3, 2), prop('crate', 4, 2), prop('crate', 3, 3),
      ...(volcano ? [prop('bench', 5, 5), prop('bench', 6, 5), prop('bench', 14, 6)]
        : [prop('crate', 15, 3), prop('crate', 16, 3), prop('bench', 5, 6)]),
    ],
    targets: [
      { id: attractionId, kind: 'attraction', attractionId, label: volcano ? 'Read the canvas saloon' : 'Look at the flour and rope', position: at(10, 3) },
      { id: 'exterior.exit', kind: 'exit', label: 'Return outside', position: at(10, 9), destination: { roomId: 'exterior', position: volcano ? at(5, 5) : at(15, 5) } },
    ],
  }
}
const MAPS: Record<TownWalkTownId, Record<TownWalkRoomId, TownWalkMap>> = {
  volcano: { exterior: volcanoExterior, shelter: shelter('volcano') },
  west_point: { exterior: westPointExterior, shelter: shelter('west_point') },
}

export function townWalkMap(townId: string, roomId: string = 'exterior'): TownWalkMap | undefined {
  if (!Object.hasOwn(MAPS, townId)) return undefined
  const rooms = MAPS[townId as TownWalkTownId]
  return Object.hasOwn(rooms, roomId) ? rooms[roomId as TownWalkRoomId] : undefined
}
function validPosition(value: unknown): value is TownWalkPosition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const position = value as Record<string, unknown>
  return Number.isSafeInteger(position.x) && Number.isSafeInteger(position.y)
}
export function townWalkTileAt(map: TownWalkMap, position: TownWalkPosition): TownWalkTile | undefined {
  if (!validPosition(position) || position.x < 0 || position.x >= map.width || position.y < 0 || position.y >= map.height) return undefined
  const terrain = TERRAIN[map.terrainRows[position.y]?.[position.x]]
  if (!terrain) return undefined
  const placed = map.props.find(item => same(item.position, position))
  const npc = map.targets.some(target => target.kind === 'npc' && same(target.position, position))
  return { terrain, ...(placed ? { prop: placed.kind } : {}), blocked: terrain === 'water' || !!placed?.blocksMovement || npc }
}
export function isTownWalkPassable(map: TownWalkMap, position: TownWalkPosition): boolean {
  return townWalkTileAt(map, position)?.blocked === false
}
export function stepTownWalk(map: TownWalkMap, position: TownWalkPosition, direction: TownWalkDirection): TownWalkPosition {
  if (!isTownWalkPassable(map, position)) return { ...map.spawn }
  if (!Object.hasOwn(STEP, direction)) return position
  const delta = STEP[direction]
  const next = at(position.x + delta.x, position.y + delta.y)
  return isTownWalkPassable(map, next) ? next : position
}
/** Orthogonal reach only; a walkable doorway/road target may also be underfoot.
 * Invalid positions offer no interactions. Merely approaching never runs one. */
export function adjacentTownWalkTargets(map: TownWalkMap, position: TownWalkPosition): TownWalkTarget[] {
  if (!isTownWalkPassable(map, position)) return []
  return map.targets.filter(target => Math.abs(target.position.x - position.x) + Math.abs(target.position.y - position.y) <= 1)
}
/** Version and town mismatches start outside. Invalid positions in a valid room
 * fall back to that room's spawn. Return cells must be passable in this town's
 * exterior; invalid return data is dropped. The UI owns storage and transitions. */
export function normalizeTownWalkSnapshot(townId: string, value: unknown): TownWalkSnapshot | undefined {
  const exterior = townWalkMap(townId)
  if (!exterior) return undefined
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
  const savedMap = record?.version === TOWN_WALK_VERSION && record.townId === townId && typeof record.roomId === 'string'
    ? townWalkMap(townId, record.roomId) : undefined
  const map = savedMap ?? exterior
  const position = savedMap && validPosition(record?.position) && isTownWalkPassable(map, record.position)
    ? record.position : map.spawn
  const exteriorReturnPosition = savedMap && validPosition(record?.exteriorReturnPosition) && isTownWalkPassable(exterior, record.exteriorReturnPosition)
    ? record.exteriorReturnPosition : undefined
  return { version: TOWN_WALK_VERSION, townId: map.townId, roomId: map.roomId, position: { ...position },
    ...(exteriorReturnPosition ? { exteriorReturnPosition: { ...exteriorReturnPosition } } : {}),
  }
}
