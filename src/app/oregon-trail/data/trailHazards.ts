/**
 * TRAIL HAZARDS — region-accurate survival events, resolved against S.A.D.D.L.E.
 *
 * Pure data + pure functions. No React, no side effects, no Math.random at module
 * scope. `rollHazard` takes an injected rng so the reducer keeps the same
 * seedable-determinism story as the rest of the travel tick.
 *
 * HISTORICAL BASIS (1849 California Trail, Independence -> Gold Country)
 * The dime-novel version of this trail is wrong, and the true version is better
 * drama, so we encode the true one:
 *
 *   - CHOLERA was the overwhelming killer of the 1849 season. The pandemic that
 *     reached New Orleans in Dec 1848 travelled up the Mississippi with the
 *     emigrants and struck hardest along the lower Platte. Whole companies buried
 *     people at the rate of several a day. It is the single most accurate hazard
 *     we can put on this trail, and it is spread by fouled water — which makes it
 *     a SHREWDNESS problem (camp upstream, dig away from the ruts), not bad luck.
 *   - ACCIDENTS came second: drownings at crossings, wagons rolling, and a
 *     startling number of accidental gunshots from men unused to carrying arms.
 *   - INDIAN ATTACK was RARE — best modern estimates put emigrant deaths from
 *     conflict near 4%, and emigrants were far more often GUIDED, FERRIED, FED and
 *     TRADED WITH than attacked. Pawnee, Lakota, Cheyenne, Shoshone and Northern
 *     Paiute people ran ferries, sold horses and grain, and carried messages.
 *     So `native_encounter` below is weighted to trade and aid, keyed to
 *     DIPLOMACY, and it turns bad chiefly when the PLAYER has behaved badly.
 *     Encoding the myth would be both inaccurate and worse writing.
 *   - GRIZZLIES ranged the plains and Rockies in 1849, and the California grizzly
 *     still held the Sierra (it is on the state flag; it was extinct by 1924).
 *   - The FORTY MILE DESERT was the trail's worst stretch: alkali water that
 *     killed oxen outright, and a roadside of abandoned wagons and dead stock.
 *   - The SIERRA crossing was made in the shadow of the Donner party, only three
 *     winters gone in 1849. Every emigrant knew that story. The game should too.
 */

import type { OregonTrailState } from '../state/types'
// Type-only import: `SaddleStats` is defined once, in characterContext, and
// erased at compile time — so this pure-data module pulls in no React and the
// two definitions cannot drift apart.
import type { SaddleStats, StatName } from '../characterContext'

export type { SaddleStats, StatName }

// --- S.A.D.D.L.E. ------------------------------------------------------------

/** Neutral fallback so callers without a character still get sane resolution. */
export const NEUTRAL_STATS: SaddleStats = {
  Shrewdness: 5, Agility: 5, Durability: 5, Diplomacy: 5, Luck: 5, Expertise: 5,
}

// --- Regions -----------------------------------------------------------------

export type TrailRegion =
  | 'eastern_prairie'
  | 'platte_valley'
  | 'high_plains'
  | 'basin_sage'
  | 'snake_country'
  | 'humboldt_desert'
  | 'sierra'
  | 'foothills'

/**
 * Distance bands keyed to the real LANDMARKS table in state/constants.ts.
 * Independence 0 · Ft Kearny 304 · Ft Laramie 640 · South Pass 932 ·
 * City of Rocks 1200 · Humboldt R. 1380 · Forty Mile Desert 1600 ·
 * Truckee Pass 1750 · Sacramento Valley 1900 · Gold Country 2000.
 */
export function regionForDistance(distance: number): TrailRegion {
  if (distance < 304) return 'eastern_prairie'
  if (distance < 640) return 'platte_valley'
  if (distance < 932) return 'high_plains'
  if (distance < 1200) return 'basin_sage'
  if (distance < 1380) return 'snake_country'
  if (distance < 1700) return 'humboldt_desert'
  if (distance < 1900) return 'sierra'
  return 'foothills'
}

export const REGION_LABEL: Record<TrailRegion, string> = {
  eastern_prairie: 'the eastern prairie',
  platte_valley: 'the Platte bottoms',
  high_plains: 'the high plains',
  basin_sage: 'the sage basin',
  snake_country: 'the Snake country',
  humboldt_desert: 'the Humboldt desert',
  sierra: 'the Sierra Nevada',
  foothills: 'the Mother Lode foothills',
}

// --- Hazard model ------------------------------------------------------------

export interface HazardEffects {
  healthDelta?: number
  oxenLost?: number
  foodLost?: number
  ammoLost?: number
  daysLost?: number
  wagonDamage?: number
  moraleDelta?: number
  /** Karma is awarded by the caller (context owns the karma wallet). */
  karma?: { good?: number; neutral?: number; bad?: number }
}

export interface TrailHazard {
  id: string
  name: string
  /** Regions this can fire in. Accuracy matters more than variety here. */
  regions: TrailRegion[]
  /** Relative weight within a region. */
  weight: number
  /** The stat that decides whether you see it coming / handle it. */
  test: StatName
  /** Target number on d20 + stat. Higher = harder to avoid. */
  dc: number
  /** Optional extra gate — only fires when this predicate holds. */
  when?: (s: OregonTrailState) => boolean
  /** Shown when the check succeeds. */
  avoidedText: string
  /** Shown when the check fails. */
  struckText: string
  /** Applied on failure. */
  effects: HazardEffects
  /** Applied on success (usually a small boon or nothing). */
  avoidedEffects?: HazardEffects
}

export const TRAIL_HAZARDS: TrailHazard[] = [
  // --- disease: the real killer of 1849 -------------------------------------
  {
    id: 'cholera',
    name: 'Cholera',
    regions: ['eastern_prairie', 'platte_valley'],
    weight: 30,
    test: 'Shrewdness',
    dc: 12,
    avoidedText:
      'You draw water upstream of the camps and dig the necessary pit well back from the ruts. ' +
      'Downriver, a company that did neither is burying someone before breakfast.',
    struckText:
      'It comes on in the afternoon and it is unmistakable — the cramps, the terrible thirst, the grey look. ' +
      'Cholera. The doctors of 1849 blame the night air. The night air is innocent. It was the water.',
    effects: { healthDelta: -18, daysLost: 1, moraleDelta: -8 },
  },
  {
    id: 'bad_water_alkali',
    name: 'Alkali Water',
    regions: ['basin_sage', 'humboldt_desert'],
    weight: 24,
    test: 'Expertise',
    dc: 12,
    when: s => s.oxen > 0,
    avoidedText:
      'You taste the seep, spit, and haul the stock off before they can drink. The white crust around the pool ' +
      'is the tell — good water does not leave a ring like a kettle.',
    struckText:
      'The oxen reach the alkali pool before you can head them off. What kills stock out here is rarely thirst. ' +
      'It is the water that looks like an answer.',
    effects: { oxenLost: 1, healthDelta: -4, moraleDelta: -6 },
  },

  // --- snakes: region-correct species ---------------------------------------
  {
    id: 'prairie_rattlesnake',
    name: 'Prairie Rattlesnake',
    regions: ['eastern_prairie', 'platte_valley', 'high_plains'],
    weight: 18,
    test: 'Shrewdness',
    dc: 11,
    avoidedText:
      'The buzz stops your boot an inch short. A prairie rattler, thick as a wrist, unhurried about leaving. ' +
      'It was not hunting you. You were simply large and in the way.',
    struckText:
      'It strikes above the boot before the rattle registers. Prairie rattlesnake — rarely fatal to a grown ' +
      'traveller, reliably terrible for about four days.',
    effects: { healthDelta: -12, daysLost: 1, moraleDelta: -4 },
  },
  {
    id: 'great_basin_rattlesnake',
    name: 'Great Basin Rattlesnake',
    regions: ['basin_sage', 'humboldt_desert'],
    weight: 16,
    test: 'Shrewdness',
    dc: 12,
    avoidedText:
      'You turn the wagon tongue over before reaching under it. The rattlesnake beneath has been enjoying the ' +
      'shade and resents the review, but leaves without argument.',
    struckText:
      'It was under the wagon tongue, in the only shade for a mile, and you reached in without looking. ' +
      'The desert punishes the incurious more than the unlucky.',
    effects: { healthDelta: -14, daysLost: 1, moraleDelta: -5 },
  },

  // --- weather ---------------------------------------------------------------
  {
    id: 'plains_hailstorm',
    name: 'Hailstorm',
    regions: ['eastern_prairie', 'platte_valley', 'high_plains'],
    weight: 20,
    test: 'Expertise',
    dc: 12,
    avoidedText:
      'You read the green in the cloud, chain the wheels and get canvas over the stock before it breaks. ' +
      'The hail comes through like thrown gravel and finds nothing to ruin.',
    struckText:
      'The cloud goes green and then the sky falls in pieces the size of hen eggs. The Platte country does ' +
      'this without warning and without apology. Canvas tears. Stock scatters.',
    effects: { healthDelta: -6, wagonDamage: 8, foodLost: 10, moraleDelta: -8 },
  },
  {
    id: 'sierra_snow',
    name: 'Early Snow in the Passes',
    regions: ['sierra'],
    weight: 30,
    test: 'Expertise',
    dc: 13,
    avoidedText:
      'You read the sky, push the stock hard for the saddle and clear it before the weather closes. ' +
      'Behind you the pass fills in and stays filled.',
    struckText:
      'Snow in the pass, weeks earlier than it has any right to come. Every soul on this trail knows what ' +
      'happened to the Donner company three winters back. Nobody says the name. Everybody is thinking it.',
    effects: { healthDelta: -16, daysLost: 2, foodLost: 20, moraleDelta: -14 },
  },

  // --- predators -------------------------------------------------------------
  {
    id: 'grizzly',
    name: 'Grizzly Bear',
    regions: ['high_plains', 'sierra'],
    weight: 12,
    test: 'Expertise',
    dc: 14,
    avoidedText:
      'You cached the food away from the beds and camped off the game trail, and so the grizzly that walks ' +
      'through at dusk merely walks through. It is enormous. It is not interested. Both facts are a mercy.',
    struckText:
      'A grizzly comes into camp for the food you left too near the wagons. In 1849 these bears still own the ' +
      'plains and the Sierra both. Arguing the point costs you supplies and someone gets hurt doing it.',
    effects: { healthDelta: -20, foodLost: 30, oxenLost: 1, moraleDelta: -10 },
  },
  {
    id: 'mountain_lion',
    name: 'Mountain Lion',
    regions: ['basin_sage', 'sierra', 'foothills'],
    weight: 10,
    test: 'Shrewdness',
    dc: 13,
    avoidedText:
      'You notice the stock has gone quiet and all facing one way. Something long and tawny decides against it ' +
      'and pours back into the rocks. You were watched for some time before you noticed.',
    struckText:
      'It takes a calf at the edge of the firelight and is gone before the rifle is up. You never get a clean ' +
      'look at it. That is rather the point of a mountain lion.',
    effects: { healthDelta: -8, oxenLost: 1, moraleDelta: -6 },
  },
  {
    id: 'wolf_pack',
    name: 'Wolves on the Stock',
    regions: ['platte_valley', 'high_plains'],
    weight: 14,
    test: 'Expertise',
    dc: 12,
    when: s => s.oxen > 0,
    avoidedText:
      'You ring the stock and keep a fire going on the windward side. The wolves hold at the edge of the light ' +
      'all night, and take nothing but sleep.',
    struckText:
      'Wolves work the picket line in the dark. They want the stock, not you — which is little comfort when ' +
      'the stock is the only reason the wagon moves.',
    effects: { oxenLost: 1, healthDelta: -3, moraleDelta: -7 },
  },
  {
    id: 'bison_stampede',
    name: 'Buffalo Stampede',
    regions: ['platte_valley'],
    weight: 10,
    test: 'Agility',
    dc: 12,
    avoidedText:
      'You hear it as weather before you understand it as animals, and get the wagons turned into the draw ' +
      'in time. The herd passes for the better part of an hour.',
    struckText:
      'The herd comes over the rise and does not consider you at all. A buffalo stampede is not malice. ' +
      'It is simply several thousand animals agreeing on a direction.',
    effects: { healthDelta: -10, wagonDamage: 12, oxenLost: 1, moraleDelta: -8 },
  },

  // --- people ----------------------------------------------------------------
  // Weighted to the historical truth: trade, guidance and ferrying, not ambush.
  {
    id: 'native_encounter',
    name: 'Travellers on the Road',
    regions: [
      'eastern_prairie', 'platte_valley', 'high_plains',
      'basin_sage', 'snake_country', 'humboldt_desert',
    ],
    weight: 26,
    test: 'Diplomacy',
    dc: 10,
    avoidedText:
      'A party from the nearby village rides out to meet you. They know where the water is sweet and where the ' +
      'ford is hard-bottomed, and they are willing to trade for both. You deal straight and are dealt with straight. ' +
      'This was the ordinary experience of the emigration, whatever the newspapers back east preferred to print.',
    struckText:
      'You handle the meeting badly — too much rifle, too little greeting — and the party withdraws without trading. ' +
      'You have lost nothing but the ford they would have shown you, the grain they would have sold you, and a day ' +
      'finding both yourself. The narrator notes that this was, historically, the more expensive mistake.',
    effects: { daysLost: 1, moraleDelta: -5 },
    avoidedEffects: { foodLost: -25, karma: { good: 8 } }, // negative foodLost = gain
  },

  // --- accidents: the true number two ---------------------------------------
  {
    id: 'accidental_discharge',
    name: 'Accidental Discharge',
    regions: [
      'eastern_prairie', 'platte_valley', 'high_plains',
      'basin_sage', 'snake_country', 'humboldt_desert', 'sierra',
    ],
    weight: 12,
    test: 'Expertise',
    dc: 11,
    when: s => s.ammunition > 0,
    avoidedText:
      'Someone pulls a loaded rifle from the wagon muzzle-first, catches themselves, and goes white. ' +
      'No harm done. It is worth remembering how many were killed on this road by their own guns.',
    struckText:
      'A rifle is dragged from the wagon by the muzzle and goes off. This killed more emigrants than the Indians ' +
      'did, by a wide and unromantic margin, and it never once made the newspapers back home.',
    effects: { healthDelta: -15, ammoLost: 5, daysLost: 1, moraleDelta: -9 },
  },
]

// --- Resolution --------------------------------------------------------------

export interface HazardResult {
  hazard: TrailHazard
  avoided: boolean
  roll: number
  total: number
  text: string
  effects: HazardEffects
}

/** d20 + stat vs dc. Luck nudges every check by a small amount. */
export function resolveHazard(
  hazard: TrailHazard,
  stats: SaddleStats,
  rng: () => number,
): HazardResult {
  const roll = Math.floor(rng() * 20) + 1
  const statVal = stats[hazard.test] ?? 5
  const luckNudge = Math.floor(((stats.Luck ?? 5) - 5) / 2)
  const total = roll + statVal + luckNudge
  const avoided = total >= hazard.dc + 5 // stat 5 + roll ~10 ≈ even odds at dc 10
  return {
    hazard,
    avoided,
    roll,
    total,
    text: avoided ? hazard.avoidedText : hazard.struckText,
    effects: (avoided ? hazard.avoidedEffects : hazard.effects) ?? {},
  }
}

/** Candidate hazards for a state, honouring region + `when` gates. */
export function hazardsFor(state: OregonTrailState): TrailHazard[] {
  const region = regionForDistance(state.distance)
  return TRAIL_HAZARDS.filter(
    h => h.regions.includes(region) && (h.when ? h.when(state) : true),
  )
}

/**
 * Roll the day's hazard, or null. `chance` is the per-day probability that ANY
 * hazard fires; the specific one is drawn by weight from the region pool.
 */
export function rollHazard(
  state: OregonTrailState,
  stats: SaddleStats = NEUTRAL_STATS,
  rng: () => number = Math.random,
  chance = 0.18,
): HazardResult | null {
  if (rng() > chance) return null
  const pool = hazardsFor(state)
  if (pool.length === 0) return null
  const totalWeight = pool.reduce((sum, h) => sum + h.weight, 0)
  let pick = rng() * totalWeight
  for (const h of pool) {
    pick -= h.weight
    if (pick <= 0) return resolveHazard(h, stats, rng)
  }
  return resolveHazard(pool[pool.length - 1], stats, rng)
}
