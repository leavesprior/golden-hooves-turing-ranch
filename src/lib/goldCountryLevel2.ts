/**
 * Level 2 — Explore the Gold Country.
 *
 * Hub-and-spoke county overworld after the wagon trail. Each case is a real
 * Calaveras/Amador place, a game already on this land, and three Carmen-style
 * clues (search / talk) that already exist as search areas and NPCs.
 *
 * Visual language: painted editorial map + west-face cream, not CRT green.
 * Stamp a case by working a clue, not by merely discovering the pin.
 */

/** Tight Calaveras/Amador frame so L2 pins spread on the painted map. */
export const LEVEL2_MAP_BOUNDS = {
  minLat: 37.95,
  maxLat: 38.55,
  minLng: -120.85,
  maxLng: -120.38,
}

export function level2MapPosition(lat: number, lng: number): { x: number; y: number } {
  const pad = 10
  const { minLat, maxLat, minLng, maxLng } = LEVEL2_MAP_BOUNDS
  const x = pad + ((lng - minLng) / (maxLng - minLng)) * (100 - 2 * pad)
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (100 - 2 * pad)
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

/** Fan overlapping Mother Lode pins so labels stay tappable. */
const PIN_NUDGE: Record<string, { dx: number; dy: number }> = {
  bobr_cabin: { dx: 7, dy: -4 },
  angels_camp: { dx: -6, dy: 8 },
  murphys: { dx: 8, dy: 6 },
  moaning_cavern: { dx: 2, dy: 12 },
  volcano: { dx: -2, dy: -8 },
  kennedy_mine: { dx: -10, dy: 2 },
  jackson: { dx: -8, dy: 8 },
  mokelumne_hill: { dx: 6, dy: 2 },
  natural_bridges: { dx: 10, dy: 10 },
  california_caverns: { dx: -4, dy: 10 },
  big_trees: { dx: 12, dy: -2 },
  ironstone_vineyards: { dx: 10, dy: 4 },
}

export function level2PinPosition(id: string, lat: number, lng: number): { x: number; y: number } {
  const p = level2MapPosition(lat, lng)
  const n = PIN_NUDGE[id]
  if (!n) return p
  return {
    x: Math.max(8, Math.min(92, Math.round((p.x + n.dx) * 10) / 10)),
    y: Math.max(8, Math.min(92, Math.round((p.y + n.dy) * 10) / 10)),
  }
}

export const LEVEL2_STAMP_KEY = 'bobr_l2_stamps'
export const LEVEL2_TALKED_KEY = 'bobr_l2_talked_npcs'
export const LEVEL2_VISIT_GOAL = 5

export type Level2ClueKind = 'search' | 'talk'

export type Level2Clue = {
  id: string
  kind: Level2ClueKind
  label: string
  /** Pin on the town painting (percent). */
  x: number
  y: number
}

export type Level2Case = {
  id: string
  title: string
  example: string
  verb: string
  warrant: string
  icon: string
  clues: readonly [Level2Clue, Level2Clue, Level2Clue]
}

export const LEVEL2_CASES: readonly Level2Case[] = [
  {
    id: 'bobr_cabin',
    title: 'Ranch HQ',
    example: 'Oregon Trail fort / Carmen bureau',
    verb: 'Set camp. The map opens from the porch.',
    warrant: 'The guest book remembers who passed through. Start the dossier here.',
    icon: '🏠',
    clues: [
      { id: 'cabin_guest_book', kind: 'search', label: 'Guest book', x: 50, y: 42 },
      { id: 'cabin_barn', kind: 'search', label: 'The barn', x: 82, y: 72 },
      { id: 'cynthia_owner', kind: 'talk', label: 'Cynthia', x: 28, y: 78 },
    ],
  },
  {
    id: 'angels_camp',
    title: 'The jumping frog',
    example: 'Oregon Trail town + Twain',
    verb: 'Investigate the hotel where Twain heard the frog.',
    warrant: 'A forged Twain sits under the real one. Follow the barroom note to the cavern.',
    icon: '🐸',
    clues: [
      { id: 'angels_hotel_register', kind: 'search', label: 'Hotel register', x: 50, y: 52 },
      { id: 'angels_saloon', kind: 'search', label: 'Barroom', x: 28, y: 52 },
      { id: 'bartender_ben', kind: 'talk', label: 'Ben Coon', x: 20, y: 68 },
    ],
  },
  {
    id: 'murphys',
    title: 'Black Bart’s register',
    example: 'Where in Time witness',
    verb: 'Read who signed the Murphys Hotel book.',
    warrant: 'Bart signed in verse. The cellar still holds what the stage lost.',
    icon: '🍷',
    clues: [
      { id: 'murphys_hotel_register', kind: 'search', label: 'Hotel register', x: 48, y: 42 },
      { id: 'murphys_wine_cellar', kind: 'search', label: 'Wine cellar', x: 32, y: 62 },
      { id: 'vintner_pierre', kind: 'talk', label: 'Pierre Dumont', x: 58, y: 50 },
    ],
  },
  {
    id: 'volcano',
    title: 'Cobblestone theatre',
    example: 'Diggings chapter 2',
    verb: 'Walk the 1850s town. The play is still running.',
    warrant: 'Canvas now, stone later. The mist named the town — there is no volcano.',
    icon: '🎭',
    clues: [
      { id: 'volcano_placer_ortiz', kind: 'talk', label: 'Rafael Ortíz', x: 42, y: 58 },
      { id: 'volcano_saloon_bell', kind: 'talk', label: 'Josiah Bell', x: 52, y: 48 },
      { id: 'volcano_miwok_ana', kind: 'talk', label: 'Ana', x: 22, y: 62 },
    ],
  },
  {
    id: 'kennedy_mine',
    title: 'The Argonaut fire',
    example: 'Adventure ch4 mine mystery',
    verb: 'Follow the warrant into the Kennedy / Argonaut shafts.',
    warrant: 'The office books do not add. Someone is mining a vein the foreman never reported.',
    icon: '⛏️',
    clues: [
      { id: 'kennedy_mine_office', kind: 'search', label: 'Mine office', x: 42, y: 38 },
      { id: 'kennedy_mine_shaft', kind: 'search', label: 'Upper shaft', x: 58, y: 52 },
      { id: 'old_miner_giuseppe', kind: 'talk', label: 'Giuseppe', x: 30, y: 62 },
    ],
  },
  {
    id: 'jackson',
    title: 'National Hotel noir',
    example: 'Sandiego chase town',
    warrant: 'Thorn still takes warrants. The decoy trail runs under Main Street.',
    verb: 'A decoy trail runs Main Street.',
    icon: '⚖️',
    clues: [
      { id: 'jackson_telegraph_office', kind: 'search', label: 'Telegraph office', x: 48, y: 42 },
      { id: 'jackson_tunnels', kind: 'search', label: 'Chinese tunnels', x: 28, y: 62 },
      { id: 'sheriff_thorn', kind: 'talk', label: 'Sheriff Thorn', x: 62, y: 48 },
    ],
  },
  {
    id: 'mokelumne_hill',
    title: 'Holistic coincidence',
    example: 'Dirk Gently',
    verb: 'The hill, the river, and the ranch are the same case.',
    warrant: 'Everything connects: the ledger in the basement, the unnamed grave, the ranch guest book.',
    icon: '🔗',
    clues: [
      { id: 'mokelumne_hotel_basement', kind: 'search', label: 'Léger basement', x: 42, y: 38 },
      { id: 'mokelumne_cemetery', kind: 'search', label: 'French cemetery', x: 86, y: 58 },
      { id: 'ghost_hunter_edgar', kind: 'talk', label: 'Edgar Poe', x: 46, y: 58 },
    ],
  },
  {
    id: 'moaning_cavern',
    title: 'Time-slip chamber',
    example: 'Doctor Who',
    verb: 'The chamber is 13,000 years deep. Something slipped.',
    warrant: 'Fresh tool marks in a vault of ancient bone. The meeting note from Angels Camp ends here.',
    icon: '🕳️',
    clues: [
      { id: 'moaning_cavern_depths', kind: 'search', label: 'Cavern depths', x: 50, y: 55 },
      { id: 'cave_guide_hector', kind: 'talk', label: 'Hector', x: 32, y: 42 },
      { id: 'geologist_chen', kind: 'talk', label: 'Dr. Chen', x: 68, y: 48 },
    ],
  },
] as const

export const LEVEL2_CASE_IDS: readonly string[] = LEVEL2_CASES.map((c) => c.id)

export function caseForLocation(locationId: string): Level2Case | undefined {
  return LEVEL2_CASES.find((c) => c.id === locationId)
}

export function editorialTownId(locationId: string): string {
  return locationId === 'bobr_cabin' ? 'bobr_ranch' : locationId
}

type StorageLike = { getItem(key: string): string | null; setItem?(key: string, value: string): void }

function parseStamps(raw: string | null): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function readLevel2Stamps(storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  return parseStamps(s?.getItem(LEVEL2_STAMP_KEY) ?? null)
}

export function writeLevel2Stamp(locationId: string, storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = Array.from(new Set([...readLevel2Stamps(s), locationId]))
  try { s?.setItem?.(LEVEL2_STAMP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function readTalkedNpcs(storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  return parseStamps(s?.getItem(LEVEL2_TALKED_KEY) ?? null)
}

export function writeTalkedNpc(npcId: string, storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = Array.from(new Set([...readTalkedNpcs(s), npcId]))
  try { s?.setItem?.(LEVEL2_TALKED_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function clueWorked(clue: Level2Clue, searchedAreaIds: readonly string[], talkedNpcIds: readonly string[]): boolean {
  if (clue.kind === 'search') return searchedAreaIds.includes(clue.id)
  return talkedNpcIds.includes(clue.id)
}

export function level2Progress(input: {
  stamps?: readonly string[]
  searchedAreaIds?: readonly string[]
}): {
  visited: string[]
  remaining: string[]
  count: number
  goal: number
  complete: boolean
} {
  const stamps = new Set(input.stamps ?? [])
  const searched = new Set(input.searchedAreaIds ?? [])
  const visited = LEVEL2_CASES.filter((c) => {
    if (stamps.has(c.id)) return true
    return c.clues.some((clue) => clue.kind === 'search' && searched.has(clue.id))
  }).map((c) => c.id)
  const remaining = LEVEL2_CASE_IDS.filter((id) => !visited.includes(id))
  return {
    visited,
    remaining,
    count: visited.length,
    goal: LEVEL2_VISIT_GOAL,
    complete: visited.length >= LEVEL2_VISIT_GOAL,
  }
}
