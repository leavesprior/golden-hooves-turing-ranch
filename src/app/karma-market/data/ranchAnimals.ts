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
    name: 'Jumanji',
    species: 'Arabian Horse',
    emoji: '\uD83D\uDC0E',
    description: 'A retired endurance racing Arabian. This elegant white horse ran hundreds of desert miles before finding his forever home at the ranch.',
    category: 'domestic',
    count: 1,
    treats: [
      {
        id: 'horse_carrots',
        name: 'Carrot Bundle',
        emoji: '\uD83E\uDD55',
        description: 'A bundle of fresh carrots from the ranch garden.',
        neutralKarmaCost: 8,
        effect: 'Jumanji nickers softly and nuzzles your palm. A champion\'s gratitude.',
        cooldownMinutes: 15,
      },
      {
        id: 'horse_sugar',
        name: 'Sugar Cube',
        emoji: '\uD83E\uDDC2',
        description: 'A rare sugar cube treat. Used sparingly for a retired racer.',
        neutralKarmaCost: 12,
        effect: 'Jumanji\'s ears perk forward with pure joy. Still has that racer\'s spark.',
        cooldownMinutes: 45,
      },
      {
        id: 'horse_groom',
        name: 'Full Grooming',
        emoji: '\u2728',
        description: 'Complete mane and tail grooming for Jumanji\'s beautiful white coat.',
        neutralKarmaCost: 20,
        effect: 'Gleaming white coat, braided mane. Jumanji looks ready for the Arabian nationals.',
        cooldownMinutes: 120,
      },
    ],
    funFact: 'Arabians dominate endurance racing worldwide. Jumanji ran 100-mile desert races before retiring to ranch life.',
  },

  // ── Emus ──
  {
    id: 'emus',
    name: 'Ranch Emus',
    species: 'Emu',
    emoji: '\uD83E\uDDA4',
    description: 'Three bold, curious emus who stand nearly 6 feet tall and investigate everything that moves. Mischievous and fearless.',
    category: 'domestic',
    count: 3,
    treats: [
      {
        id: 'emu_berries',
        name: 'Berry Bowl',
        emoji: '\uD83C\uDF53',
        description: 'Strawberries and blueberries \u2014 their absolute favorite treats.',
        neutralKarmaCost: 8,
        effect: 'The emus bob their heads excitedly, snatching berries with surprising delicacy. Juice stains their beaks purple.',
        cooldownMinutes: 20,
      },
      {
        id: 'emu_cabbage',
        name: 'Cabbage Head',
        emoji: '\uD83E\uDD66',
        description: 'A whole cabbage to peck apart. Emus love leafy greens.',
        neutralKarmaCost: 6,
        effect: 'All three emus crowd around, tearing off cabbage leaves in a frenzy. Controlled chaos.',
        cooldownMinutes: 15,
      },
      {
        id: 'emu_meet',
        name: 'Emu Meet & Greet',
        emoji: '\uD83E\uDD1D',
        description: 'A guided visit with the emus. Pro tip: remove jewelry and shiny items first!',
        neutralKarmaCost: 15,
        effect: 'The emus strut over to inspect you, tilting their heads curiously. One drums a deep booming call. An unforgettable encounter!',
        cooldownMinutes: 60,
      },
    ],
    funFact: 'Emus are attracted to shiny objects and WILL peck at jewelry, glasses, and buttons. Remove sparkly items before visiting! They also won the Great Emu War of 1932 against the Australian military.',
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
