/**
 * Ranch Animal Catalog for the Karma Marketplace
 *
 * Real animals from Back of Beyond Ranch plus wild animal care
 * and infrastructure donation goals.
 */

export interface AnimalTreat {
  id: string
  name: string
  emoji: string
  description: string
  neutralKarmaCost: number
  effect: string // Flavor text shown on purchase
  cooldownMinutes: number
}

export interface RanchAnimal {
  id: string
  name: string
  species: string
  emoji: string
  description: string
  category: 'domestic' | 'wild_care' | 'infrastructure'
  count: number
  treats: AnimalTreat[]
  funFact: string
}

// ═══════════════════════════════════════════════
// DOMESTIC ANIMALS (named individuals)
// ═══════════════════════════════════════════════

export const RANCH_ANIMALS: RanchAnimal[] = [
  // ── Cats ──
  {
    id: 'barn_cats',
    name: 'Barn Cats',
    species: 'Cat',
    emoji: '\uD83D\uDC31',
    description: 'The ranch\'s resident mousers keep the barn clear of pests.',
    category: 'domestic',
    count: 2,
    treats: [
      {
        id: 'cat_treats',
        name: 'Catnip Pouch',
        emoji: '\uD83C\uDF3F',
        description: 'Premium organic catnip from Gold Country.',
        neutralKarmaCost: 5,
        effect: 'The barn cats roll around in pure bliss!',
        cooldownMinutes: 15,
      },
      {
        id: 'cat_tuna',
        name: 'Tuna Snack',
        emoji: '\uD83D\uDC1F',
        description: 'Fresh tuna treat for the hardest-working cats in Gold Country.',
        neutralKarmaCost: 8,
        effect: 'Purring intensifies to 11. You can hear it from the porch.',
        cooldownMinutes: 30,
      },
    ],
    funFact: 'One cat has been spotted riding on the donkeys\' backs.',
  },

  // ── Pigs ──
  {
    id: 'pigs',
    name: 'Ranch Pigs',
    species: 'Pig',
    emoji: '\uD83D\uDC37',
    description: 'Two friendly pigs who love belly rubs and mud baths.',
    category: 'domestic',
    count: 2,
    treats: [
      {
        id: 'pig_apples',
        name: 'Apple Bucket',
        emoji: '\uD83C\uDF4E',
        description: 'A bucket of Gold Country apples, their absolute favorite.',
        neutralKarmaCost: 8,
        effect: 'Happy squealing echoes across the ranch! The pigs do a little dance.',
        cooldownMinutes: 20,
      },
      {
        id: 'pig_mud_spa',
        name: 'Premium Mud Spa',
        emoji: '\uD83D\uDEC1',
        description: 'Fresh mud mixed with mineral water for the ultimate pig spa day.',
        neutralKarmaCost: 15,
        effect: 'The pigs sink into the mud with visible contentment. This is their happy place.',
        cooldownMinutes: 60,
      },
    ],
    funFact: 'Pigs are smarter than dogs and can learn tricks just as fast.',
  },

  // ── Sheep ──
  {
    id: 'sheep',
    name: 'Ranch Sheep',
    species: 'Sheep',
    emoji: '\uD83D\uDC11',
    description: 'A flock of five woolly sheep who keep the hillsides trimmed.',
    category: 'domestic',
    count: 5,
    treats: [
      {
        id: 'sheep_grain',
        name: 'Sweet Feed Mix',
        emoji: '\uD83C\uDF3E',
        description: 'A blend of oats, corn, and molasses.',
        neutralKarmaCost: 7,
        effect: 'The whole flock comes running! Baa-ing in harmony.',
        cooldownMinutes: 20,
      },
      {
        id: 'sheep_brush',
        name: 'Wool Brushing',
        emoji: '\uD83E\uDEE7',
        description: 'A gentle brushing session to keep their wool fluffy.',
        neutralKarmaCost: 10,
        effect: 'Each sheep leans into the brush, eyes half-closed with pleasure.',
        cooldownMinutes: 30,
      },
    ],
    funFact: 'Sheep can recognize up to 50 individual faces, human and sheep alike.',
  },

  // ── Horse ──
  {
    id: 'horse',
    name: 'Ranch Horse',
    species: 'Horse',
    emoji: '\uD83D\uDC0E',
    description: 'The ranch\'s trusty horse, a true Gold Country trail companion.',
    category: 'domestic',
    count: 1,
    treats: [
      {
        id: 'horse_carrots',
        name: 'Carrot Bundle',
        emoji: '\uD83E\uDD55',
        description: 'A bundle of fresh carrots from the ranch garden.',
        neutralKarmaCost: 8,
        effect: 'A grateful nicker and a soft nuzzle. You\'ve made a friend for life.',
        cooldownMinutes: 15,
      },
      {
        id: 'horse_sugar',
        name: 'Sugar Cube',
        emoji: '\uD83E\uDDC2',
        description: 'A rare sugar cube treat. Used sparingly.',
        neutralKarmaCost: 12,
        effect: 'The horse\'s ears perk forward with pure joy. Tail swishing happily.',
        cooldownMinutes: 45,
      },
      {
        id: 'horse_groom',
        name: 'Full Grooming',
        emoji: '\u2728',
        description: 'Complete mane and tail grooming session.',
        neutralKarmaCost: 20,
        effect: 'Gleaming coat, braided mane. This horse is ready for the county fair.',
        cooldownMinutes: 120,
      },
    ],
    funFact: 'Horses can sleep standing up thanks to a special locking mechanism in their legs.',
  },

  // ── Emus ──
  {
    id: 'emus',
    name: 'Ranch Emus',
    species: 'Emu',
    emoji: '\uD83E\uDD83',
    description: 'Three curious emus who investigate everything that moves.',
    category: 'domestic',
    count: 3,
    treats: [
      {
        id: 'emu_grapes',
        name: 'Grape Cluster',
        emoji: '\uD83C\uDF47',
        description: 'Seedless grapes \u2014 an emu delicacy.',
        neutralKarmaCost: 7,
        effect: 'The emus bob their heads excitedly, pecking grapes with surprising delicacy.',
        cooldownMinutes: 20,
      },
      {
        id: 'emu_shiny',
        name: 'Shiny Object',
        emoji: '\uD83D\uDC8E',
        description: 'A sparkly trinket for emus to investigate. They love shiny things.',
        neutralKarmaCost: 10,
        effect: 'All three emus crowd around, tilting their heads. One tries to eat it.',
        cooldownMinutes: 30,
      },
    ],
    funFact: 'Emus won the Great Emu War of 1932. They are undefeated against the Australian military.',
  },

  // ── Donkeys ──
  {
    id: 'donkeys',
    name: 'Ranch Donkeys',
    species: 'Donkey',
    emoji: '\uD83E\uDECF',
    description: 'Three guardian donkeys who protect the flock from predators.',
    category: 'domestic',
    count: 3,
    treats: [
      {
        id: 'donkey_hay',
        name: 'Premium Hay Bale',
        emoji: '\uD83C\uDF3E',
        description: 'Alfalfa hay \u2014 the donkey equivalent of fine dining.',
        neutralKarmaCost: 10,
        effect: 'Content munching sounds. The donkeys share politely, which is rare.',
        cooldownMinutes: 25,
      },
      {
        id: 'donkey_scratch',
        name: 'Ear Scratching',
        emoji: '\uD83D\uDC42',
        description: 'A long, thorough ear scratching session. Donkeys live for this.',
        neutralKarmaCost: 6,
        effect: 'The donkey stretches its neck, lips quivering with pleasure. Pure donkey ASMR.',
        cooldownMinutes: 15,
      },
    ],
    funFact: 'Donkeys have an incredible memory and can recognize areas and donkeys they haven\'t seen in 25 years.',
  },

  // ── Peacocks ──
  {
    id: 'peacocks',
    name: 'Ranch Peacocks',
    species: 'Peacock',
    emoji: '\uD83E\uDD9A',
    description: 'Four stunning peacocks who strut around like they own the place. They might.',
    category: 'domestic',
    count: 4,
    treats: [
      {
        id: 'peacock_seeds',
        name: 'Sunflower Seeds',
        emoji: '\uD83C\uDF3B',
        description: 'Hulled sunflower seeds, a peacock favorite.',
        neutralKarmaCost: 6,
        effect: 'The peacocks fan their magnificent tails in appreciation. Show-offs.',
        cooldownMinutes: 15,
      },
      {
        id: 'peacock_mirror',
        name: 'Vanity Mirror',
        emoji: '\uD83E\uDE9E',
        description: 'A small mirror for the peacocks to admire themselves. They will.',
        neutralKarmaCost: 12,
        effect: 'A peacock spots its reflection and immediately fans to full display. Narcissism: confirmed.',
        cooldownMinutes: 45,
      },
    ],
    funFact: 'A peacock\'s tail feathers can be up to 6 feet long and contain microscopic crystal-like structures that reflect light.',
  },

  // ═══════════════════════════════════════════════
  // WILD ANIMAL CARE (donation goals)
  // ═══════════════════════════════════════════════

  {
    id: 'ducks_geese',
    name: 'Pond Birds',
    species: 'Ducks & Geese',
    emoji: '\uD83E\uDD86',
    description: 'Wild ducks and geese that visit the ranch ponds seasonally.',
    category: 'wild_care',
    count: 1,
    treats: [
      {
        id: 'duck_feed',
        name: 'Cracked Corn',
        emoji: '\uD83C\uDF3D',
        description: 'Proper waterfowl feed (not bread!).',
        neutralKarmaCost: 5,
        effect: 'A flotilla of ducks paddles over. Splashing and quacking ensues!',
        cooldownMinutes: 10,
      },
    ],
    funFact: 'Bread is actually bad for ducks. Cracked corn, peas, and oats are much healthier.',
  },

  {
    id: 'quail',
    name: 'California Quail',
    species: 'Quail',
    emoji: '\uD83D\uDC26',
    description: 'California\'s state bird, with their adorable head plumes bobbing as they run.',
    category: 'wild_care',
    count: 1,
    treats: [
      {
        id: 'quail_seeds',
        name: 'Millet Scatter',
        emoji: '\uD83C\uDF3E',
        description: 'Scatter millet for the quail families.',
        neutralKarmaCost: 5,
        effect: 'A whole family of quail appears from nowhere, babies in a perfect line behind mom!',
        cooldownMinutes: 15,
      },
    ],
    funFact: 'California quail form large winter coveys of up to 75 birds for warmth and protection.',
  },

  {
    id: 'deer_fawns',
    name: 'Deer Fawn Care',
    species: 'Black-tailed Deer',
    emoji: '\uD83E\uDD8C',
    description: 'Supporting orphaned fawns found on the ranch property.',
    category: 'wild_care',
    count: 1,
    treats: [
      {
        id: 'deer_salt',
        name: 'Mineral Lick',
        emoji: '\uD83E\uDEA8',
        description: 'A mineral salt block placed in the meadow.',
        neutralKarmaCost: 15,
        effect: 'At dawn, deer emerge from the tree line. The fawns cautiously approach the lick.',
        cooldownMinutes: 60,
      },
    ],
    funFact: 'Fawns are born nearly scentless to protect them from predators.',
  },

  {
    id: 'honeybees',
    name: 'Honey Bee Program',
    species: 'Honey Bee',
    emoji: '\uD83D\uDC1D',
    description: 'Reintroducing honey bees to pollinate Gold Country wildflowers.',
    category: 'wild_care',
    count: 1,
    treats: [
      {
        id: 'bee_garden',
        name: 'Wildflower Planting',
        emoji: '\uD83C\uDF3A',
        description: 'Plant native wildflower seeds to feed the bees.',
        neutralKarmaCost: 20,
        effect: 'Seeds planted! In spring, the meadow will burst with color and buzzing.',
        cooldownMinutes: 120,
      },
    ],
    funFact: 'A single bee colony can pollinate 300 million flowers per day.',
  },

  // ═══════════════════════════════════════════════
  // INFRASTRUCTURE (donation goals)
  // ═══════════════════════════════════════════════

  {
    id: 'predator_fence',
    name: 'Predator Fence',
    species: 'Infrastructure',
    emoji: '\uD83E\uDEA4',
    description: 'Fencing to protect ranch animals from coyotes and foxes.',
    category: 'infrastructure',
    count: 1,
    treats: [
      {
        id: 'fence_section',
        name: 'Fence Section',
        emoji: '\uD83D\uDEE1\uFE0F',
        description: 'Fund one section of predator-proof fencing.',
        neutralKarmaCost: 30,
        effect: 'Another section secured! The animals sleep a little safer tonight.',
        cooldownMinutes: 60,
      },
      {
        id: 'fence_gate',
        name: 'Gate Upgrade',
        emoji: '\uD83D\uDEAA',
        description: 'Upgrade a gate to be coyote-proof while allowing deer passage.',
        neutralKarmaCost: 50,
        effect: 'Smart gate installed! Deer can pass but coyotes are turned away.',
        cooldownMinutes: 120,
      },
    ],
    funFact: 'Coyotes can jump 6-foot fences, so ranch fencing needs coyote rollers on top.',
  },

  {
    id: 'winter_shelter',
    name: 'Winter Shelters',
    species: 'Infrastructure',
    emoji: '\u26EA',
    description: 'Shelters for animals during Gold Country\'s cold, wet winters.',
    category: 'infrastructure',
    count: 1,
    treats: [
      {
        id: 'shelter_straw',
        name: 'Fresh Straw Bedding',
        emoji: '\uD83C\uDF3E',
        description: 'A thick layer of warm straw for the winter shelters.',
        neutralKarmaCost: 25,
        effect: 'Warm, golden straw fills the shelter. The animals burrow in gratefully.',
        cooldownMinutes: 60,
      },
      {
        id: 'shelter_heat',
        name: 'Heat Lamp',
        emoji: '\uD83D\uDCA1',
        description: 'A safe heat lamp for the coldest nights.',
        neutralKarmaCost: 40,
        effect: 'Warm glow fills the shelter. Even the emus huddle close on freezing nights.',
        cooldownMinutes: 120,
      },
    ],
    funFact: 'Gold Country temperatures can drop below freezing in winter despite its reputation for warmth.',
  },
]

/**
 * Get animals by category
 */
export function getAnimalsByCategory(category: RanchAnimal['category']): RanchAnimal[] {
  return RANCH_ANIMALS.filter(a => a.category === category)
}

/**
 * Get a specific animal by ID
 */
export function getAnimalById(id: string): RanchAnimal | undefined {
  return RANCH_ANIMALS.find(a => a.id === id)
}

/**
 * Get all unique treat IDs for achievement tracking
 */
export function getAllTreatIds(): string[] {
  return RANCH_ANIMALS.flatMap(a => a.treats.map(t => t.id))
}
