// ============================================================================
// TRAIL INVESTIGATION (2026-09-30) — per-town places for the trail's Investigate
// screen, replacing the one hard-coded list (Saloon / Stable / Store / Telegraph /
// Church / Street) that every town used to share.
//
// Leif 09-30: each town gets its own places and icons; NPCs vary by town; clues
// lead on to another city along the way or into another era; California's
// clues are harder.
//
// Nothing here re-authors town content. California towns reuse the scenes in
// townInvestigations.ts (keyed by canonical townRegistry id) and the period
// people in goldCountryNPCs.ts. Only the trail stops that have no town content
// (Independence, the three forts, the Sacramento Valley, Carson Hill) are
// authored below, and only from well-documented 1849 history.
//
// Era rule: the trail stands in 1849. A scene from a later year is shown as a
// crossing into that year and its text sits inside "(Later: …)", which is the
// same convention the angelsCampSlice 1849 guard strips before scanning.
// ============================================================================

import { TOWN_REGISTRY, getCanonicalTown } from './townRegistry'
import { getInvestigation, type InvestigationScene } from './townInvestigations'
import { getNPCById, type GoldCountryNPC, type GoldCountryWitnessType } from '@/app/oregon-trail/data/goldCountryNPCs'

export const TRAIL_YEAR = 1849

/** Same 1|2|3 scale as the overlay CarmenClue. */
export type Obscurity = 1 | 2 | 3

export interface TrailLead {
  /** Canonical registry id or trail landmark name the clue points on to. */
  to: string
  label: string
  /** Set when the lead is into another year rather than another town. */
  year?: number
}

export interface TrailWitness {
  id: string
  name: string
  role: string
  witnessType: GoldCountryWitnessType
  portrait: string
  greeting: string
  lines: string[]
  clue: string
  obscurity: Obscurity
  lead?: TrailLead
}

export interface TrailPlace {
  id: string
  name: string
  icon: string
  /** Year the place belongs to; > TRAIL_YEAR means a crossing into a later era. */
  year: number
  later: boolean
  witnesses: TrailWitness[]
}

export interface TrailTownResolution {
  /** Canonical registry id when the landmark is a registry town. */
  townId?: string
  /** goldCountryNPCs `location` ids whose people live here. */
  npcLocations: string[]
  california: boolean
}

// ---------------------------------------------------------------------------
// Landmark → town. The old code slugged the landmark name, so "West Point"
// and "Calaveras Big Trees" missed their people. One resolver for every
// caller.
// ---------------------------------------------------------------------------

/** People filed under a different location id than the town's own. */
const NPC_LOCATION_ALIASES: Record<string, string[]> = {
  // The ranch sits on the West Point ridge; its folk are filed under bobr_cabin.
  west_point: ['bobr_cabin'],
}

const CALIFORNIA_TRAIL_STOPS = new Set(['Sacramento Valley', 'Carson Hill', 'Sandy Gulch Mine'])

export function resolveTrailTown(landmark: string): TrailTownResolution {
  const town = TOWN_REGISTRY.find(t => t.name === landmark)
  if (!town) {
    return { npcLocations: [], california: CALIFORNIA_TRAIL_STOPS.has(landmark) }
  }
  const own = town.sources.oregon ?? town.id
  return {
    townId: town.id,
    npcLocations: NPC_LOCATION_ALIASES[town.id] ?? [own],
    california: true,
  }
}

// ---------------------------------------------------------------------------
// California: the authored town scenes, with an icon and a year each.
// ---------------------------------------------------------------------------

/** `approx` marks a year given to the decade, not the documented date. */
const SCENE_META: Record<string, { icon: string; year: number; approx?: boolean }> = {
  'west_point:trading_post': { icon: '🏪', year: 1849 },
  'west_point:sandy_gulch': { icon: '🥇', year: 1849 },
  'west_point:sawmill': { icon: '🪚', year: 1855, approx: true },
  'volcano:general_store': { icon: '🧂', year: 1852 },
  'volcano:library': { icon: '📚', year: 1850 },
  'volcano:thespian': { icon: '🎭', year: 1854 },
  'mokelumne_hill:diggings': { icon: '⛏️', year: 1849 },
  'mokelumne_hill:express_bank': { icon: '🏦', year: 1854 },
  'mokelumne_hill:courthouse': { icon: '⚖️', year: 1852, approx: true },
  'murphys:murphys_hotel': { icon: '🏨', year: 1856 },
  'murphys:mercer_caverns': { icon: '🦇', year: 1885 },
  'murphys:big_trees': { icon: '🌲', year: 1853 },
  'angels_camp:angels_hotel': { icon: '🏨', year: 1855 },
  'angels_camp:utica_mine': { icon: '🛗', year: 1890, approx: true },
  'angels_camp:frog_jubilee': { icon: '🐸', year: 1928 },
  'jackson:kennedy_mine': { icon: '🏗️', year: 1900, approx: true },
  'jackson:tailing_wheels': { icon: '🎡', year: 1914 },
  'jackson:st_sava': { icon: '⛪', year: 1894 },
  'san_andreas:sa_courthouse': { icon: '🏛️', year: 1867 },
  'san_andreas:old_jail': { icon: '🔒', year: 1883 },
  'san_andreas:hall_of_records': { icon: '📜', year: 1867, approx: true },
  'nevada_city:national_hotel': { icon: '🏨', year: 1856 },
  'nevada_city:nevada_theatre': { icon: '🎭', year: 1865 },
  'nevada_city:malakoff': { icon: '💦', year: 1884 },
  'grass_valley:empire_mine': { icon: '🏡', year: 1897 },
  'grass_valley:north_star': { icon: '⚙️', year: 1895 },
  'grass_valley:lola_montez': { icon: '💃', year: 1853 },
  'mariposa:las_mariposas_grant': { icon: '🗺️', year: 1849 },
  'mariposa:courthouse': { icon: '🕰️', year: 1854 },
  'mariposa:pine_tree_mine': { icon: '⚒️', year: 1858 },
}

const SCENE_WITNESS_PREFIX = 'tinv:'

/** "(Later: …)" must not contain a ")" or the 1849 guard's strip stops short. */
function laterSafe(text: string): string {
  return text.replace(/\s*\(([^)]*)\)/g, ' — $1').replace(/\)/g, '')
}

function sceneLead(townId: string, scene: InvestigationScene): TrailLead | undefined {
  const choice = scene.choices.find(c => c.id === scene.answer)
  if (!choice) return undefined
  const town = getCanonicalTown(scene.answer)
  if (town && town.id !== townId) return { to: town.id, label: town.name }
  const next = getInvestigation(townId)?.scenes.find(s => s.id === scene.answer)
  if (next) {
    const year = SCENE_META[`${townId}:${next.id}`]?.year
    return { to: `${townId}:${next.id}`, label: choice.label, year }
  }
  // A deduction (not a place): the lead is the reading itself.
  return { to: `${townId}:${scene.answer}`, label: choice.label }
}

function sceneWitness(townId: string, scene: InvestigationScene, index: number): TrailWitness {
  const meta = SCENE_META[`${townId}:${scene.id}`]
  const year = meta?.year ?? TRAIL_YEAR
  const later = year > TRAIL_YEAR
  // California is the harder country: the sharper read, the lead left unsaid,
  // and deeper scenes harder still.
  const obscurity: Obscurity = index === 0 ? 2 : 3
  const read = scene.clueHard
  const clue = later ? `(Later: ${year} — ${laterSafe(read)})` : read
  const greeting = later ? `(Later: ${year} — ${laterSafe(scene.prompt)})` : scene.prompt
  const lines = [scene.clueEasy, scene.clueHard].map(t => (later ? `(Later: ${year} — ${laterSafe(t)})` : t))
  return {
    id: `${SCENE_WITNESS_PREFIX}${townId}:${scene.id}`,
    name: scene.witness.name,
    role: scene.witness.role,
    witnessType: 'townfolk',
    portrait: meta?.icon ?? '🔎',
    greeting,
    lines,
    clue,
    obscurity,
    lead: sceneLead(townId, scene),
  }
}

function scenePlaces(townId: string): TrailPlace[] {
  const inv = getInvestigation(townId)
  if (!inv) return []
  return inv.scenes.map((scene, i) => {
    const meta = SCENE_META[`${townId}:${scene.id}`]
    const year = meta?.year ?? TRAIL_YEAR
    return {
      id: `${townId}:${scene.id}`,
      name: year > TRAIL_YEAR ? `(Later: ${year} — ${laterSafe(scene.place)})` : scene.place,
      icon: meta?.icon ?? '🔎',
      year,
      later: year > TRAIL_YEAR,
      witnesses: [sceneWitness(townId, scene, i)],
    }
  })
}

// ---------------------------------------------------------------------------
// Trail stops with no town content: authored here, 1849 only. Each clue
// names the next stop, so the plains read easy (obscurity 1) and California
// reads hard.
// ---------------------------------------------------------------------------

const TRAIL_STOP_PREFIX = 'tstop:'

type StopPlace = Omit<TrailPlace, 'witnesses' | 'year' | 'later'> & {
  witness: Omit<TrailWitness, 'id' | 'obscurity'> & { obscurity?: Obscurity }
}

const TRAIL_STOPS: Record<string, StopPlace[]> = {
  'Independence, Missouri': [
    {
      id: 'courthouse_square', name: 'The outfitters on the courthouse square', icon: '🧰',
      witness: {
        name: 'An outfitter\'s clerk', role: 'outfitter', witnessType: 'merchant', portrait: '🧰',
        greeting: 'Flour, bacon, powder, a good India-rubber sheet. Every company bound for California fits out on this square.',
        lines: [
          'Half the county is here buying for the California road. Prices climb every week the grass gets greener.',
          'The ones in a hurry buy mules. Oxen are slower but they eat the grass and don\'t run off.',
        ],
        clue: 'He bought a pack mule and a light kit, not oxen. A man in that kind of hurry rides for the Platte and Fort Kearny, the new army post on it.',
        lead: { to: 'Fort Kearny', label: 'Fort Kearny, on the Platte' },
      },
    },
    {
      id: 'wayne_city_landing', name: 'The river landing at Wayne City', icon: '⚓',
      witness: {
        name: 'A steamboat deckhand', role: 'deckhand', witnessType: 'traveler', portrait: '⚓',
        greeting: 'Every boat up from St. Louis is packed to the rails with gold-seekers and their wagons.',
        lines: [
          'We land them at the Wayne City landing and they haul up the bluff to Independence.',
          'Cholera rode up the river with some of them this spring. Boil your water.',
        ],
        clue: 'He came off the St. Louis boat with no wagon and asked only one thing: how far to Fort Kearny on the Platte.',
        lead: { to: 'Fort Kearny', label: 'Fort Kearny, on the Platte' },
      },
    },
    {
      id: 'wagon_yard', name: 'The wagon yard and forge', icon: '🛞',
      witness: {
        name: 'A wagon-maker', role: 'wagon-maker', witnessType: 'settler', portrait: '🛞',
        greeting: 'Wagons, yokes, and wheels. This town builds and mends more of them than anywhere west of St. Louis.',
        lines: [
          'A light wagon and a strong team beats a heavy wagon every time. Most folks learn that at the Platte.',
          'I shod his mule myself. Paid in coin and did not give a name.',
        ],
        clue: 'I shod his mule for a long, dry road. He asked the road to Fort Kearny and the Platte, not the Santa Fe road.',
        lead: { to: 'Fort Kearny', label: 'Fort Kearny, on the Platte' },
      },
    },
  ],
  'Fort Kearny': [
    {
      id: 'post', name: 'The sod-and-adobe post', icon: '🏚️',
      witness: {
        name: 'A soldier of the garrison', role: 'soldier', witnessType: 'lawman', portrait: '🪖',
        greeting: 'The army built this post last year to watch over the emigrant road. It is mostly sod and adobe yet.',
        lines: [
          'The officers keep a count of the wagons that pass. This season it runs to the thousands.',
          'Cholera is on the road ahead of you. Bury the dead deep and keep moving.',
        ],
        clue: 'A rider on a pack mule passed the count without stopping. He said he meant to be at Fort Laramie before the grass there is eaten.',
        lead: { to: 'Fort Laramie', label: 'Fort Laramie' },
      },
    },
    {
      id: 'sutler', name: 'The sutler\'s store', icon: '🏪',
      witness: {
        name: 'The sutler\'s clerk', role: 'sutler\'s clerk', witnessType: 'shopkeeper', portrait: '🏪',
        greeting: 'Everything costs more past the Missouri, friend. Next store is Laramie.',
        lines: [
          'Flour\'s dear here and dearer at Laramie. Buy what you need, not what you fancy.',
        ],
        clue: 'He bought flour for one and asked how many days to Fort Laramie at a hard pace.',
        lead: { to: 'Fort Laramie', label: 'Fort Laramie' },
      },
    },
    {
      id: 'platte_bank', name: 'The Platte River bank', icon: '🌊',
      witness: {
        name: 'An emigrant woman', role: 'emigrant', witnessType: 'settler', portrait: '🧺',
        greeting: 'That river is wide and shallow and full of quicksand. Nobody drinks it without settling it first.',
        lines: [
          'We follow the Platte for weeks. There is no wood, so we burn buffalo chips.',
        ],
        clue: 'A man watered a mule here at dawn and kept to the north bank, toward Fort Laramie.',
        lead: { to: 'Fort Laramie', label: 'Fort Laramie' },
      },
    },
  ],
  'Fort Laramie': [
    {
      id: 'fort_john', name: 'The adobe walls of Fort John', icon: '🧱',
      witness: {
        name: 'A fur-company clerk', role: 'fur-company clerk', witnessType: 'merchant', portrait: '🦫',
        greeting: 'The army bought this post from the American Fur Company this June. The walls are still ours in all but the paper.',
        lines: [
          'It was a trading post for robes and furs. Now it is an army post for emigrants.',
        ],
        clue: 'He traded his mule for a fresh one, paid in gold, and asked the road to Fort Bridger.',
        lead: { to: 'Fort Bridger', label: 'Fort Bridger' },
      },
    },
    {
      id: 'laramie_ford', name: 'The Laramie River ford', icon: '🌊',
      witness: {
        name: 'A ferryman\'s hand', role: 'ferry hand', witnessType: 'traveler', portrait: '🛶',
        greeting: 'High water or low, somebody always wants across before the next company.',
        lines: [
          'Past the ford it\'s the long climb to South Pass. Names are carved on every rock along the way.',
        ],
        clue: 'He crossed at first light, alone, headed up the river toward South Pass and Fort Bridger.',
        lead: { to: 'Fort Bridger', label: 'Fort Bridger' },
      },
    },
    {
      id: 'discard_piles', name: 'The discard piles by the road', icon: '🗑️',
      witness: {
        name: 'An emigrant sorting goods', role: 'emigrant', witnessType: 'settler', portrait: '🪓',
        greeting: 'Stoves, anvils, trunks of books. Everyone lightens their wagon here or loses the team on the mountains.',
        lines: [
          'You can outfit a whole house from what\'s left by this road.',
        ],
        clue: 'A man dropped a heavy strongbox here, empty, and rode on light toward Fort Bridger.',
        lead: { to: 'Fort Bridger', label: 'Fort Bridger' },
      },
    },
  ],
  'Fort Bridger': [
    {
      id: 'trading_post', name: 'Bridger and Vásquez\'s trading post', icon: '🏕️',
      witness: {
        name: 'A trading-post hand', role: 'trading-post hand', witnessType: 'merchant', portrait: '🏕️',
        greeting: 'Jim Bridger and Louis Vásquez built this post for the emigrant trade. We sell and mend what the road breaks.',
        lines: [
          'Plenty of companies skip us this year for the cutoff. They save days and lose the grass.',
        ],
        clue: 'He never came through here. He took the cutoff and is making for the Humboldt, then over the Sierra.',
        lead: { to: 'Humboldt River', label: 'The Humboldt River' },
      },
    },
    {
      id: 'forge', name: 'The blacksmith\'s forge', icon: '🔨',
      witness: {
        name: 'The blacksmith', role: 'blacksmith', witnessType: 'settler', portrait: '🔨',
        greeting: 'Iron tires shrink in this dry air. I set more of them than I can count.',
        lines: [
          'A wheel that rattles here falls apart on the Humboldt.',
        ],
        clue: 'A teamster said a rider on a mule took the cutoff west, bound for the Humboldt.',
        lead: { to: 'Humboldt River', label: 'The Humboldt River' },
      },
    },
    {
      id: 'blacks_fork', name: 'The Blacks Fork meadows', icon: '🌾',
      witness: {
        name: 'A herder', role: 'herder', witnessType: 'traveler', portrait: '🐂',
        greeting: 'Best grass for days in either direction. Rest the team while you can.',
        lines: [
          'After here the country gets drier every day to California.',
        ],
        clue: 'The man you describe watered here two days back and asked the way to the Humboldt.',
        lead: { to: 'Humboldt River', label: 'The Humboldt River' },
      },
    },
  ],
  'Sacramento Valley': [
    {
      id: 'sutters_fort', name: 'Sutter\'s Fort', icon: '🏰',
      witness: {
        name: 'A store clerk at the fort', role: 'store clerk', witnessType: 'merchant', portrait: '🏰',
        greeting: 'Pans, picks, and flour at gold-rush prices. Everything that goes to the mines passes through here.',
        lines: [
          'The whole valley emptied out for the diggings. The fort is a store now more than a fort.',
        ],
        clue: 'He bought a pan and a pick and asked which diggings were paying. Somebody told him the Mokelumne.',
        obscurity: 2,
        lead: { to: 'mokelumne_hill', label: 'Mokelumne Hill' },
      },
    },
    {
      id: 'embarcadero', name: 'The Embarcadero at Sacramento City', icon: '⛵',
      witness: {
        name: 'A boatman', role: 'boatman', witnessType: 'traveler', portrait: '⛵',
        greeting: 'Ships up from San Francisco every day, and a town of tents on the bank.',
        lines: [
          'They laid out Sacramento City this year. It\'s canvas and lumber and mud.',
        ],
        clue: 'A mule rider took the road east toward the southern diggings. He didn\'t say which camp, only that it\'s on a hill above a river.',
        obscurity: 2,
        lead: { to: 'mokelumne_hill', label: 'Mokelumne Hill' },
      },
    },
  ],
  'Carson Hill': [
    {
      id: 'carson_creek', name: 'Carson Creek', icon: '⛏️',
      witness: {
        name: 'A placer miner', role: 'placer miner', witnessType: 'miner', portrait: '⛏️',
        greeting: 'James Carson found gold in this creek last year, and the hill has been crawling with men since.',
        lines: [
          'The creek\'s rich, but the men who know say the real gold is in the quartz of the hill itself.',
        ],
        clue: 'He panned one day and moved on north, toward a camp named for a trader called Angel.',
        obscurity: 2,
        lead: { to: 'angels_camp', label: 'Angels Camp' },
      },
    },
  ],
}

/** The generic list, now only for stops with nothing authored. No 1849 telegraph. */
const GENERIC_PLACES: { id: string; name: string; icon: string; witnesses: string[] }[] = [
  { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender', 'drunk', 'traveler'] },
  { id: 'stable', name: 'Stable', icon: '🐴', witnesses: ['stable_hand'] },
  { id: 'general_store', name: 'General Store', icon: '🏪', witnesses: ['shopkeeper'] },
  { id: 'church', name: 'Church', icon: '⛪', witnesses: ['preacher'] },
  { id: 'street', name: 'Street', icon: '🛤️', witnesses: ['settler', 'child', 'traveler'] },
]

function stopPlaces(landmark: string): TrailPlace[] {
  const stops = TRAIL_STOPS[landmark]
  if (!stops) return []
  return stops.map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    year: TRAIL_YEAR,
    later: false,
    witnesses: [{ ...p.witness, id: `${TRAIL_STOP_PREFIX}${landmark}:${p.id}`, obscurity: p.witness.obscurity ?? 1 }],
  }))
}

/** Authored places for this stop: scene places for a registry town, else trail-stop places. */
export function getTrailPlaces(landmark: string): TrailPlace[] {
  const { townId } = resolveTrailTown(landmark)
  const scenes = townId ? scenePlaces(townId) : []
  return scenes.length > 0 ? scenes : stopPlaces(landmark)
}

export function getGenericPlaces() {
  return GENERIC_PLACES
}

export function getAuthoredStops(): string[] {
  return Object.keys(TRAIL_STOPS)
}

export function getSceneMeta() {
  return SCENE_META
}

/**
 * True for an authored place witness. These have no chat persona (the DM adapter
 * frames every NPC as 1849 California), so they speak their scripted lines.
 */
export function isTrailWitnessId(id: string | null | undefined): boolean {
  return !!id && (id.startsWith(SCENE_WITNESS_PREFIX) || id.startsWith(TRAIL_STOP_PREFIX))
}

/** Find an authored place witness by id (scene or trail stop). */
export function getTrailWitness(id: string): TrailWitness | undefined {
  if (id.startsWith(SCENE_WITNESS_PREFIX)) {
    const [townId, sceneId] = id.slice(SCENE_WITNESS_PREFIX.length).split(':')
    const inv = getInvestigation(townId)
    const i = inv?.scenes.findIndex(s => s.id === sceneId) ?? -1
    return inv && i >= 0 ? sceneWitness(townId, inv.scenes[i], i) : undefined
  }
  if (id.startsWith(TRAIL_STOP_PREFIX)) {
    const rest = id.slice(TRAIL_STOP_PREFIX.length)
    const cut = rest.lastIndexOf(':')
    return stopPlaces(rest.slice(0, cut)).find(p => p.id === rest.slice(cut + 1))?.witnesses[0]
  }
  return undefined
}

/**
 * A place witness shaped as a GoldCountryNPC, so the existing witness dialogue
 * and grounded-clue path take it without changes.
 */
export function trailWitnessAsNpc(w: TrailWitness): GoldCountryNPC {
  return {
    id: w.id,
    name: w.name,
    title: w.role,
    location: w.id,
    witnessType: w.witnessType,
    portrait: w.portrait,
    greeting: w.greeting,
    personality: `A ${w.role}. Speaks plainly and only of what they saw.`,
    ollamaPrompt: `You are ${w.name}, a ${w.role}. Answer in 1-2 plain sentences, only from these facts: ${w.lines.join(' ')} ${w.clue}`,
    dialogueLines: w.lines,
    investigationClue: { text: w.clue, isTrue: true },
  }
}

/** A period NPC by id, else an authored place witness. One lookup for every caller. */
export function resolveWitnessNpc(id: string | null | undefined): GoldCountryNPC | undefined {
  if (!id) return undefined
  const npc = getNPCById(id)
  if (npc) return npc
  const w = getTrailWitness(id)
  return w ? trailWitnessAsNpc(w) : undefined
}
