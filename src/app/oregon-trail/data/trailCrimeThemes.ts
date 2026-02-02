/**
 * Trail Crime Themes - Region-specific crime types for Carmen Sandiego investigation
 *
 * Each trail region has unique crime types, witnesses, and investigation elements
 * that give the detective gameplay local flavor.
 */

export interface TrailCrimeTheme {
  regionId: string
  regionName: string
  distanceRange: [number, number]  // [start, end] miles
  crimeTypes: RegionalCrime[]
  witnesses: RegionalWitness[]
  atmosphere: string  // Flavor text for the region
}

export interface RegionalCrime {
  type: string
  description: string
  clueTypes: string[]  // Types of evidence found
}

export interface RegionalWitness {
  type: string
  title: string
  reliability: number  // 0.0-1.0
  flavorText: string
}

export const TRAIL_CRIME_THEMES: TrailCrimeTheme[] = [
  {
    regionId: 'plains',
    regionName: 'The Great Plains',
    distanceRange: [0, 304],
    crimeTypes: [
      {
        type: 'cattle_rustling',
        description: 'Livestock has gone missing from a nearby herd. The thieves struck at dawn while the drovers slept.',
        clueTypes: ['hoofprints', 'broken fence', 'dropped branding iron'],
      },
      {
        type: 'supply_theft',
        description: 'A general store was broken into overnight. Flour, salt pork, and ammunition are missing.',
        clueTypes: ['boot prints', 'torn burlap', 'witness at the well'],
      },
    ],
    witnesses: [
      { type: 'drover', title: 'Cattle Drover', reliability: 0.75, flavorText: 'A weathered man who sleeps with one eye open.' },
      { type: 'farm_wife', title: 'Settler\'s Wife', reliability: 0.85, flavorText: 'Sharp eyes from watching the horizon every day.' },
      { type: 'child', title: 'Settler\'s Child', reliability: 0.5, flavorText: 'Saw something from the loft window.' },
    ],
    atmosphere: 'The endless grass whispers secrets to those who listen. Out here, a man can see for miles — but the night hides everything.',
  },
  {
    regionId: 'platte_river',
    regionName: 'Platte River Valley',
    distanceRange: [304, 932],
    crimeTypes: [
      {
        type: 'stagecoach_robbery',
        description: 'A stagecoach was held up on the road between forts. The driver was tied to a tree and the strongbox taken.',
        clueTypes: ['rope fibers', 'wheel tracks', 'mask fragment'],
      },
      {
        type: 'mail_theft',
        description: 'The mail pouch was stolen from a courier. Personal letters and important documents — and possibly bank drafts — are missing.',
        clueTypes: ['torn letter', 'horse shoe impression', 'dropped envelope'],
      },
    ],
    witnesses: [
      { type: 'soldier', title: 'Fort Soldier', reliability: 0.9, flavorText: 'On patrol when it happened. Military precision in his account.' },
      { type: 'trader', title: 'Fur Trader', reliability: 0.7, flavorText: 'Knows every trail and every rogue in the territory.' },
      { type: 'emigrant', title: 'Fellow Emigrant', reliability: 0.6, flavorText: 'Traveling the same road, saw something suspicious.' },
    ],
    atmosphere: 'Fort country. Soldiers patrol the roads, but the territory between forts belongs to no law. The Platte River stretches wide and shallow — a mile wide and an inch deep, they say.',
  },
  {
    regionId: 'rockies',
    regionName: 'The Rocky Mountains',
    distanceRange: [932, 1120],
    crimeTypes: [
      {
        type: 'claim_jumping',
        description: 'A prospector\'s claim has been stolen while he was in town for supplies. His stakes were pulled and replaced.',
        clueTypes: ['new stakes', 'disturbed earth', 'unfamiliar tool marks'],
      },
      {
        type: 'horse_theft',
        description: 'Three horses vanished from the picket line during the night. The rope was cut clean with a sharp knife.',
        clueTypes: ['cut rope', 'tracks heading south', 'oat trail'],
      },
    ],
    witnesses: [
      { type: 'mountain_man', title: 'Mountain Man', reliability: 0.8, flavorText: 'Lives up here year-round. Sees everything, says little.' },
      { type: 'prospector', title: 'Gold Prospector', reliability: 0.65, flavorText: 'Paranoid but observant. Trusts no one with his claim.' },
      { type: 'native_guide', title: 'Shoshone Guide', reliability: 0.85, flavorText: 'Reads tracks like a book.' },
    ],
    atmosphere: 'The mountains care nothing for human quarrels. Up here, the air is thin and men\'s tempers shorter. Gold fever makes neighbors into enemies.',
  },
  {
    regionId: 'great_basin',
    regionName: 'The Great Basin',
    distanceRange: [1120, 1700],
    crimeTypes: [
      {
        type: 'water_cache_poisoning',
        description: 'Someone poisoned a water cache left for travelers crossing the desert. Two families fell ill before the contamination was discovered.',
        clueTypes: ['chemical residue', 'tampered seal', 'suspicious tracks'],
      },
      {
        type: 'wagon_abandonment_scam',
        description: 'A con man has been telling desperate travelers their wagons are "cursed" and offering to buy them for pennies. He then sells the wagons at full price further down the trail.',
        clueTypes: ['forged blessing certificate', 'multiple wagon receipts', 'witness testimony'],
      },
    ],
    witnesses: [
      { type: 'desert_guide', title: 'Desert Guide', reliability: 0.85, flavorText: 'Knows every spring and shortcut in the basin.' },
      { type: 'paiute_elder', title: 'Paiute Elder', reliability: 0.9, flavorText: 'Has watched wagon trains pass for years. Misses nothing.' },
      { type: 'dehydrated_traveler', title: 'Delirious Traveler', reliability: 0.35, flavorText: 'Saw something... or maybe it was a mirage.' },
    ],
    atmosphere: 'The Great Basin is a land of absence. No trees, no shade, barely any water. In this emptiness, desperation breeds crime — and the desert covers all tracks.',
  },
  {
    regionId: 'sierra',
    regionName: 'The Sierra Nevada',
    distanceRange: [1700, 2000],
    crimeTypes: [
      {
        type: 'mule_theft',
        description: 'Pack mules loaded with supplies were stolen from a camp. Without them, crossing the pass will be nearly impossible.',
        clueTypes: ['mule droppings trail', 'campsite disturbance', 'cut picket line'],
      },
      {
        type: 'toll_road_extortion',
        description: 'Someone has set up a fake toll road on a mountain path, demanding payment from exhausted travelers who have no other route.',
        clueTypes: ['makeshift gate', 'fake toll receipts', 'frightened travelers'],
      },
    ],
    witnesses: [
      { type: 'stagecoach_driver', title: 'Stagecoach Driver', reliability: 0.8, flavorText: 'Drives this route weekly. Knows every boulder and bandit.' },
      { type: 'miner', title: 'Returning Miner', reliability: 0.7, flavorText: 'Heading back east, pockets empty but eyes full of stories.' },
      { type: 'lumber_worker', title: 'Sawmill Worker', reliability: 0.75, flavorText: 'Works the timber camps. Sees who comes and goes on the mountain roads.' },
    ],
    atmosphere: 'The Sierra Nevada — the "snowy range." These mountains are the last barrier between you and California\'s golden valleys. But they exact a price from everyone who crosses.',
  },
]

/** Get the crime theme for a given trail distance */
export function getCrimeThemeForDistance(distance: number): TrailCrimeTheme | null {
  return TRAIL_CRIME_THEMES.find(
    theme => distance >= theme.distanceRange[0] && distance < theme.distanceRange[1]
  ) || null
}

/** Get a random regional crime for a given distance */
export function getRandomRegionalCrime(distance: number): RegionalCrime | null {
  const theme = getCrimeThemeForDistance(distance)
  if (!theme || theme.crimeTypes.length === 0) return null
  return theme.crimeTypes[Math.floor(Math.random() * theme.crimeTypes.length)]
}

/** Get available witnesses for a given distance */
export function getRegionalWitnesses(distance: number): RegionalWitness[] {
  const theme = getCrimeThemeForDistance(distance)
  return theme?.witnesses || []
}

/** Get atmosphere text for the current region */
export function getRegionalAtmosphere(distance: number): string {
  const theme = getCrimeThemeForDistance(distance)
  return theme?.atmosphere || 'The trail stretches on...'
}
