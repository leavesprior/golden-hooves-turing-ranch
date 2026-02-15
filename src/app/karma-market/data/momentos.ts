/**
 * Momento Catalog for the Karma Marketplace
 *
 * Collectible items themed around Gold Country, the ranch, and the game world.
 * 15-20 items across 4 rarity tiers.
 */

export type MomentoRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Momento {
  id: string
  name: string
  emoji: string
  description: string
  rarity: MomentoRarity
  neutralKarmaCost: number
  category: string
  flavorText: string
  unlockCondition?: string // Human-readable condition description
}

export const RARITY_COLORS: Record<MomentoRarity, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-amber-400',
}

export const RARITY_BG: Record<MomentoRarity, string> = {
  common: 'bg-gray-700/40 border-gray-600',
  uncommon: 'bg-green-900/40 border-green-700',
  rare: 'bg-blue-900/40 border-blue-700',
  legendary: 'bg-amber-900/40 border-amber-600',
}

export const RARITY_LABELS: Record<MomentoRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}

export const MOMENTOS: Momento[] = [
  // ─── COMMON (10-15 neutral karma) ──────────────────────
  {
    id: 'gold_nugget',
    name: 'Gold Nugget Pendant',
    emoji: '\uD83E\uDE99',
    description: 'A tiny pendant shaped like a Gold Country nugget.',
    rarity: 'common',
    neutralKarmaCost: 10,
    category: 'Jewelry',
    flavorText: 'They say the first nugget found at Sutter\'s Mill was about this size. You hold history in your hand.',
  },
  {
    id: 'pressed_wildflower',
    name: 'Pressed Wildflower',
    emoji: '\uD83C\uDF3C',
    description: 'A California poppy pressed between glass.',
    rarity: 'common',
    neutralKarmaCost: 10,
    category: 'Nature',
    flavorText: 'Golden as the hills in summer. The state flower, preserved forever.',
  },
  {
    id: 'ranch_postcard',
    name: 'Ranch Postcard',
    emoji: '\uD83D\uDCEE',
    description: 'A vintage-style postcard of Back of Beyond Ranch.',
    rarity: 'common',
    neutralKarmaCost: 12,
    category: 'Keepsake',
    flavorText: '"Wish you were here! The emus say hello (they also tried to eat this postcard)."',
  },
  {
    id: 'horseshoe_charm',
    name: 'Lucky Horseshoe',
    emoji: '\uD83D\uDC34',
    description: 'A miniature horseshoe charm for good luck on the trail.',
    rarity: 'common',
    neutralKarmaCost: 12,
    category: 'Charm',
    flavorText: 'Hang it points-up to catch luck. Points-down to pour luck on those below.',
  },
  {
    id: 'acorn_woodpecker',
    name: 'Acorn Woodpecker Carving',
    emoji: '\uD83E\uDD89',
    description: 'A tiny wooden carving of Gold Country\'s busiest bird.',
    rarity: 'common',
    neutralKarmaCost: 15,
    category: 'Craft',
    flavorText: 'They store thousands of acorns in a single tree. The original hoarders.',
  },

  // ─── UNCOMMON (25-35 neutral karma) ──────────────────────
  {
    id: 'emu_figurine',
    name: 'Miniature Emu Figurine',
    emoji: '\uD83E\uDD83',
    description: 'A hand-painted emu figurine with attitude.',
    rarity: 'uncommon',
    neutralKarmaCost: 25,
    category: 'Figurine',
    flavorText: 'This figurine somehow captures the exact look an emu gives you before stealing your sandwich.',
  },
  {
    id: 'prospectors_pan',
    name: 'Prospector\'s Pan',
    emoji: '\uD83E\uDD44',
    description: 'A replica gold panning dish, complete with flakes of fool\'s gold.',
    rarity: 'uncommon',
    neutralKarmaCost: 30,
    category: 'Replica',
    flavorText: 'Swirl it just right and you might find... pyrite. But hope springs eternal.',
  },
  {
    id: 'barn_cat_whisker',
    name: 'Barn Cat Whisker',
    emoji: '\uD83D\uDC31',
    description: 'A naturally-shed whisker from one of the ranch cats, in a tiny vial.',
    rarity: 'uncommon',
    neutralKarmaCost: 28,
    category: 'Curiosity',
    flavorText: 'The ranch cats shed these occasionally. Each one is said to grant one small wish.',
  },
  {
    id: 'miners_lantern',
    name: 'Miner\'s Lantern',
    emoji: '\uD83C\uDFEE',
    description: 'A miniature replica of an 1849 miner\'s oil lantern.',
    rarity: 'uncommon',
    neutralKarmaCost: 35,
    category: 'Replica',
    flavorText: 'In the deep mines, this lantern was your only friend. It flickered when the air got bad.',
  },
  {
    id: 'quail_feather',
    name: 'Quail Plume',
    emoji: '\uD83E\uDEB6',
    description: 'A distinctive California quail head plume.',
    rarity: 'uncommon',
    neutralKarmaCost: 25,
    category: 'Nature',
    flavorText: 'The comma-shaped plume bobs as the quail runs. Fashion icon of the foothills.',
  },

  // ─── RARE (50-75 neutral karma) ──────────────────────
  {
    id: 'black_bart_bandana',
    name: 'Black Bart\'s Bandana',
    emoji: '\uD83E\uDE72',
    description: 'A replica of the notorious stagecoach robber\'s mask.',
    rarity: 'rare',
    neutralKarmaCost: 50,
    category: 'Historical',
    flavorText: '"I\'ve labored long and hard for bread, for honor and for riches, but on my corns too long you\'ve tread, you fine-haired sons of..." \u2014 Black Bart, PO8',
  },
  {
    id: 'golden_frog',
    name: 'Golden Frog Statuette',
    emoji: '\uD83D\uDC38',
    description: 'A golden frog, homage to the Calaveras County Jumping Frog.',
    rarity: 'rare',
    neutralKarmaCost: 60,
    category: 'Figurine',
    flavorText: 'Mark Twain made Calaveras famous with one frog. Imagine what you could do with a golden one.',
  },
  {
    id: 'peacock_fan',
    name: 'Peacock Feather Fan',
    emoji: '\uD83E\uDD9A',
    description: 'A small fan made from genuine shed peacock feathers.',
    rarity: 'rare',
    neutralKarmaCost: 65,
    category: 'Craft',
    flavorText: 'Each eye on a peacock feather is called an ocellus. This fan has seven. Seven eyes watching.',
  },
  {
    id: 'stagecoach_model',
    name: 'Wells Fargo Stagecoach',
    emoji: '\uD83D\uDE8C',
    description: 'A detailed model of a Wells Fargo stagecoach circa 1855.',
    rarity: 'rare',
    neutralKarmaCost: 75,
    category: 'Model',
    flavorText: 'Sacramento to Placerville in just 6 hours! (Modern traffic sometimes takes longer.)',
  },

  // ─── LEGENDARY (100-200 neutral karma) ──────────────────
  {
    id: 'ranch_deed',
    name: 'Ranch Deed Certificate',
    emoji: '\uD83D\uDCDC',
    description: 'An ornate honorary deed declaring you a Friend of the Ranch.',
    rarity: 'legendary',
    neutralKarmaCost: 100,
    category: 'Certificate',
    flavorText: 'By decree of the emus, donkeys, and cats: you are hereby granted honorary rancher status. The pigs abstained.',
    unlockCondition: 'Buy treats for every domestic animal',
  },
  {
    id: 'sunset_painting',
    name: 'Sunset Over Gold Country',
    emoji: '\uD83C\uDF05',
    description: 'A pixel-art rendition of sunset over the Sierra Nevada foothills.',
    rarity: 'legendary',
    neutralKarmaCost: 150,
    category: 'Art',
    flavorText: 'The hills turn amber, then rust, then purple. For a moment, you understand why they stayed.',
  },
  {
    id: 'cynthias_key',
    name: "Cynthia's Inn Room Key",
    emoji: '\uD83D\uDD11',
    description: 'A brass key to Room 42 at Cynthia\'s Inn. What awaits inside?',
    rarity: 'legendary',
    neutralKarmaCost: 200,
    category: 'Mystery',
    flavorText: 'The key is warm to the touch. The number 42 is engraved in a font that shouldn\'t exist yet in 1849.',
    unlockCondition: 'Collect all rare momentos',
  },
]

/**
 * Get momentos by rarity
 */
export function getMomentosByRarity(rarity: MomentoRarity): Momento[] {
  return MOMENTOS.filter(m => m.rarity === rarity)
}

/**
 * Get a specific momento by ID
 */
export function getMomentoById(id: string): Momento | undefined {
  return MOMENTOS.find(m => m.id === id)
}

/**
 * Get total number of momentos
 */
export function getTotalMomentoCount(): number {
  return MOMENTOS.length
}

/**
 * Get IDs of all rare momentos (for legendary unlock condition check)
 */
export function getAllRareMomentoIds(): string[] {
  return MOMENTOS.filter(m => m.rarity === 'rare').map(m => m.id)
}

/**
 * Get IDs of all domestic animal treat IDs (for ranch deed condition check)
 */
export function getDomesticTreatCategories(): string[] {
  // Return animal IDs so we can check "fed all domestic animals"
  return ['barn_cats', 'pigs', 'sheep', 'horse', 'emus', 'donkeys', 'peacocks']
}
