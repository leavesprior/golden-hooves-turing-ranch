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
  /** Play year. Later fame lives in `becomes`, not in the 1849 mouth. */
  year: '1849'
  /** What the camp is this season. */
  then: string
  /** Dated later history — never claimed as present-1849 fact. */
  becomes: string
  /** What you can still walk into (pairs with Visit for real). */
  now: string
  /** Why these three clues are the same case. */
  thinking: string
  clues: readonly [Level2Clue, Level2Clue, Level2Clue]
}

export const LEVEL2_CASES: readonly Level2Case[] = [
  {
    id: 'bobr_cabin',
    title: 'The westernmost post',
    example: 'Oregon Trail fort / Carmen bureau',
    verb: 'Set camp. The map opens from the porch.',
    warrant: 'The guest book already knows who passed. The barn still holds a miner’s kit. Ask the host whose land this was before the rush.',
    icon: '🏠',
    year: '1849',
    then: 'Kit Carson named this ridge West Point in 1844 while hunting a Sierra pass. In 1849 it is still a trading post on Northern Sierra Miwok ground — Indian Gulch to some, a last mountain stop before the diggings.',
    becomes: 'California Historical Landmark 268. Writer Bret Harte later lived nearby, gathering the stories that made the Mother Lode famous.',
    now: 'Back of Beyond Ranch is the porch the game is played from. The Airbnb listing and the ranch site are the same cabin.',
    thinking: 'Guest book = who is already on this road. Barn = tools of a pre-rush post. Cynthia = the host who still talks to the people who were here first.',
    clues: [
      { id: 'cabin_guest_book', kind: 'search', label: 'Guest book', x: 50, y: 42 },
      { id: 'cabin_barn', kind: 'search', label: 'The barn', x: 82, y: 72 },
      { id: 'cynthia_owner', kind: 'talk', label: 'Cynthia', x: 28, y: 78 },
    ],
  },
  {
    id: 'angels_camp',
    title: 'The frog in the bar',
    example: 'Oregon Trail town + Twain',
    verb: 'Hear the frog yarn in Angell’s camp before any writer does.',
    warrant: 'The barroom already tells a jumping-frog story. A note behind the bar points to the moaning hole. Ben Coon will not forget who listened.',
    icon: '🐸',
    year: '1849',
    then: 'Henry Pinkney Angell opened a trading post here in 1848. In 1849 this is a creek camp of tents and a canvas hotel — not yet a stone Main Street. Miners already wager on frogs.',
    becomes: 'Angels Hotel in stone, 1855. Bartender Ben Coon tells Sam Clemens the frog tale in 1865; it prints in New York that November and makes him Mark Twain. The Jumping Frog Jubilee begins in 1928 at Frogtown.',
    now: 'City of Angels visitor page, Angels Camp Museum on South Main, and the still-running Jubilee at Frogtown.',
    thinking: 'Camp register = who is in before fame. Barroom = the yarn that will name the county. Ben = the man who will one day tell it to a writer from the east.',
    clues: [
      { id: 'angels_hotel_register', kind: 'search', label: 'Camp register', x: 50, y: 52 },
      { id: 'angels_saloon', kind: 'search', label: 'Barroom', x: 28, y: 52 },
      { id: 'bartender_ben', kind: 'talk', label: 'Ben Coon', x: 20, y: 68 },
    ],
  },
  {
    id: 'murphys',
    title: 'The Murphy brothers’ street',
    example: 'Where in Time witness',
    verb: 'Walk the muddy street the Murphy brothers staked.',
    warrant: 'The camp book is already a who’s-who. The cellar holds more than wine. Pierre thinks the vine will outlast the pan.',
    icon: '🍷',
    year: '1849',
    then: 'John and Daniel Murphy struck this gulch in 1848. In 1849 it is tents, a muddy street, and barrels — not twenty tasting rooms. French and Italian men are already talking vines.',
    becomes: 'Murphys Historic Hotel from 1856. Its register later holds Mark Twain, Ulysses S. Grant, and — by local tradition — Black Bart between stage jobs.',
    now: 'Visit Murphys, the Historic Hotel on Main, Mercer Caverns a mile north, Ironstone next door.',
    thinking: 'Camp book = names before the famous hotel. Cellar = stores and wine in the dark. Pierre = a Frenchman who has already decided the real gold is the grape.',
    clues: [
      { id: 'murphys_hotel_register', kind: 'search', label: 'Camp book', x: 48, y: 42 },
      { id: 'murphys_wine_cellar', kind: 'search', label: 'Wine cellar', x: 32, y: 62 },
      { id: 'vintner_pierre', kind: 'talk', label: 'Pierre Dumont', x: 58, y: 50 },
    ],
  },
  {
    id: 'volcano',
    title: 'Soldiers Gulch',
    example: 'Diggings chapter 2',
    verb: 'Walk the 1849 camp. There is no volcano.',
    warrant: 'Canvas now, stone later. The mist named the town. Ask who taught the pan, who keeps the tent bar, and whose oaks these are.',
    icon: '🎭',
    year: '1849',
    then: 'Soldiers of Stevenson’s New York regiment found color here in 1848. In 1849 it is tents in a limestone basin — Soldiers Gulch, renamed Volcano for the morning mist, not a crater.',
    becomes: 'Cut-stone stores from 1855, Masonic Cave/Lodge 56 (1854), Old Abe the Civil War cannon. None of that is here yet.',
    now: 'Amador Chamber’s Volcano page, St. George Hotel on Main, and nearby Chaw’se (Indian Grinding Rock State Historic Park).',
    thinking: 'Ortíz = how the gravel actually pays (Sonoran pan). Bell = the name, honestly. Ana = whose land this is, in the present tense.',
    clues: [
      { id: 'volcano_placer_ortiz', kind: 'talk', label: 'Rafael Ortíz', x: 42, y: 58 },
      { id: 'volcano_saloon_bell', kind: 'talk', label: 'Josiah Bell', x: 52, y: 48 },
      { id: 'volcano_miwok_ana', kind: 'talk', label: 'Ana', x: 22, y: 62 },
    ],
  },
  {
    id: 'kennedy_mine',
    title: 'The ridge above Jackson',
    example: 'Adventure ch4 mine mystery',
    verb: 'The books on this ridge do not add.',
    warrant: '1849: placer ground and a hole going deeper than it should. A man in the dark who is not on the roll.',
    icon: '⛏️',
    year: '1849',
    then: 'There is no mile-deep shaft yet. This ridge is placer. Black miners worked the hill first (later called Negro Hill). A hole is being sunk that the claim book does not explain. A canvas meat stall feeds the hole — Ellis Evans, with his sister Mae.',
    becomes: 'Quartz claims mid-1850s; Andrew Kennedy and partners file 4 Jan 1860. Company 1860–78, then Kennedy Mining & Milling 1886–1942: east shaft 5,912 ft, ~$34 million. Tailing wheels 1914. Argonaut fire 1922 (47 dead) is the neighbor, not this shaft. Ellis Evans’s butcher shop is in Jackson by 1850 (later the National Hotel lot). Swingle Meat Co. opens 1945 on Kennedy Flat Rd.',
    now: 'Kennedy Mine Foundation tours, City of Jackson mine page, Tailing Wheels Park, and Swingle Meat Co. at 12640 Kennedy Flat Rd — the ridge still eats.',
    thinking: 'Office = partners’ watch and a rare heavy purse. Hole = the man off the roll. Meat stall = Evans kin, and the Now butcher on Kennedy Flat. Fog belongs to this ridge.',
    clues: [
      { id: 'kennedy_mine_office', kind: 'search', label: 'Claim office', x: 42, y: 38 },
      { id: 'kennedy_mine_shaft', kind: 'search', label: 'The new hole', x: 58, y: 52 },
      { id: 'old_miner_giuseppe', kind: 'talk', label: 'Giuseppe', x: 30, y: 62 },
    ],
  },
  {
    id: 'jackson',
    title: 'Botilleas',
    example: 'Sandiego chase town',
    warrant: 'A spring of empty bottles. A constable who takes warrants personally. A path under the street the Yankees pretend not to see.',
    verb: 'The decoy trail already runs under Main Street.',
    icon: '⚖️',
    year: '1849',
    then: 'Jackson is a camp at a spring where travelers piled bottles — Botilleas. In 1849 Main Street is not brick. Chinese miners are already cutting a way to move unseen. Warrants are a man’s word and a gun.',
    becomes: 'Calaveras county seat 1850–52, then Amador’s seat from 1854. Hanging tree at 26 Main: ten men, 1851–55; cut down after the 1862 fire. National Hotel 1852. St. Sava, 1894 — first Serbian Orthodox church in America.',
    now: 'City of Jackson Visit page (not tourjackson.com, not Jackson, Mississippi), Kennedy Mine, Tailing Wheels Park, Amador County Museum, Saint Sava on North Main.',
    thinking: 'Express desk = news as power. The under-street path = who is allowed to walk in daylight. Thorn = law that has not yet become a dynasty.',
    clues: [
      { id: 'jackson_telegraph_office', kind: 'search', label: 'Express desk', x: 48, y: 42 },
      { id: 'jackson_tunnels', kind: 'search', label: 'Under the street', x: 28, y: 62 },
      { id: 'sheriff_thorn', kind: 'talk', label: 'Constable Thorn', x: 62, y: 48 },
    ],
  },
  {
    id: 'mokelumne_hill',
    title: 'Sixteen feet square',
    example: 'Dirk Gently',
    verb: 'The hill, the river, and the ranch are already the same case.',
    warrant: 'Claims so rich they are limited to sixteen feet. A ledger under the floor. A French grave with no name.',
    icon: '🔗',
    year: '1849',
    then: '1849: one of the richest and meanest camps in the southern mines. Ground so good that claims are limited to sixteen feet square. French, Chilean, and American tents share one slope — and already do not.',
    becomes: 'Thompson & West: a man killed every weekend for 17 weeks in 1851. The “French War” on French Hill that June. Fires 1854, 1865, 1874. Hotel Léger (1851) later swallows the old courthouse when the county seat leaves in 1866.',
    now: 'GoCalaveras Mokelumne Hill guide, Hotel Léger still open on Main, Calaveras Heritage Council’s Léger history.',
    thinking: 'Basement ledger = the quiet crime under the boom. Cemetery = the French dead before the feud has a newspaper name. Edgar = a man who hears the dead because the living will not speak.',
    clues: [
      { id: 'mokelumne_hotel_basement', kind: 'search', label: 'Store cellar', x: 42, y: 38 },
      { id: 'mokelumne_cemetery', kind: 'search', label: 'French cemetery', x: 86, y: 58 },
      { id: 'ghost_hunter_edgar', kind: 'talk', label: 'Edgar', x: 46, y: 58 },
    ],
  },
  {
    id: 'moaning_cavern',
    title: 'The moaning hole',
    example: 'Doctor Who',
    verb: 'Miners named it for the sound. Some will not go in.',
    warrant: 'A note from Angell’s bar ends at this mouth. Fresh tool marks on old bone. The guide and the surveyor disagree about why it moans.',
    icon: '🕳️',
    year: '1849',
    then: 'Gold Rush miners named it for the moan at the mouth. In 1849 some drop on ropes for color; others will not go in. Human bone is already underfoot — no one here can date it.',
    becomes: 'Largest single cave chamber in California (guides like to say it would swallow the Statue of Liberty). Spiral-stair walking tours. Remains later dated to as much as 13,000 years.',
    now: 'Moaning Caverns adventure park: cave tours from the operator’s own site.',
    thinking: 'Depths = someone is digging who is not a tourist. Hector = the rope man. Chen = a surveyor who cares more about the rock than the gold.',
    clues: [
      { id: 'moaning_cavern_depths', kind: 'search', label: 'The mouth', x: 50, y: 55 },
      { id: 'cave_guide_hector', kind: 'talk', label: 'Hector', x: 32, y: 42 },
      { id: 'geologist_chen', kind: 'talk', label: 'Surveyor Chen', x: 68, y: 48 },
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

export function replaceLevel2Stamps(ids: string[], storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = Array.from(new Set(ids.filter((x) => typeof x === 'string')))
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

export function replaceTalkedNpcs(ids: string[], storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = Array.from(new Set(ids.filter((x) => typeof x === 'string')))
  try { s?.setItem?.(LEVEL2_TALKED_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function clueWorked(clue: Level2Clue, searchedAreaIds: readonly string[], talkedNpcIds: readonly string[]): boolean {
  if (clue.kind === 'search') return searchedAreaIds.includes(clue.id)
  return talkedNpcIds.includes(clue.id)
}

export function casePinsDone(
  caze: Level2Case,
  searchedAreaIds: readonly string[],
  talkedNpcIds: readonly string[],
): { done: number; total: 3; complete: boolean } {
  const done = caze.clues.filter((c) => clueWorked(c, searchedAreaIds, talkedNpcIds)).length
  return { done, total: 3, complete: done >= 3 }
}

/** Stamp only when all three Carmen pins are worked — not for walking through a door. */
export function maybeStampCase(
  locationId: string,
  searchedAreaIds: readonly string[],
  talkedNpcIds: readonly string[],
  storage?: StorageLike | null,
): string[] {
  const caze = caseForLocation(locationId)
  if (!caze) return readLevel2Stamps(storage)
  if (!caze.clues.every((c) => clueWorked(c, searchedAreaIds, talkedNpcIds))) {
    return readLevel2Stamps(storage)
  }
  return writeLevel2Stamp(locationId, storage)
}

export function level2Progress(input: {
  stamps?: readonly string[]
  searchedAreaIds?: readonly string[]
  talkedNpcIds?: readonly string[]
}): {
  visited: string[]
  remaining: string[]
  count: number
  goal: number
  complete: boolean
} {
  const stamps = new Set(input.stamps ?? [])
  const searched = input.searchedAreaIds ?? []
  const talked = input.talkedNpcIds ?? []
  const visited = LEVEL2_CASES.filter((c) => {
    if (stamps.has(c.id)) return true
    return c.clues.every((clue) => clueWorked(clue, searched, talked))
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
