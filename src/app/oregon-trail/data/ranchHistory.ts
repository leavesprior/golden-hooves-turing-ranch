/**
 * BOBR Ranch History - Gold Rush-era ranch enrichment data
 *
 * Inspired by 1850s California Gold Country memoirs. Provides historical
 * depth to the ranch system: land clearing, water development, horse
 * training, wildlife encounters, mastery progression, and historical facts.
 *
 * Complements ranchConfig.ts with narrative and progression content.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface LandClearingStage {
  id: string
  name: string
  description: string
  daysToComplete: number
  laborRequired: number
  tools: string[]
  visualDescription: string
  nextStage: string | null
}

export interface WaterSystem {
  id: string
  name: string
  description: string
  waterOutput: number  // gallons per day
  cost: { neutral: number; good?: number }
  buildDays: number
  prerequisiteId?: string
  bonus: string
}

export interface HorseTrainingStage {
  id: string
  name: string
  description: string
  daysToTrain: number
  trainerSkillRequired: number
  speedBonus: number
  staminaBonus: number
  specialAbility?: string
}

export interface WildlifeEncounter {
  id: string
  name: string
  description: string
  season: string | null
  chance: number
  effect: {
    livestockLoss?: number
    foodGain?: number
    karmaChange?: number
    message: string
  }
  rarity: 'common' | 'uncommon' | 'rare'
}

export interface MasteryTier {
  id: string
  name: string
  description: string
  color: string
  requirements: {
    minDays: number
    minLivestock?: number
    minHorseLevel?: string
    requiredBuildings?: string[]
  }
  perks: string[]
  reputationBonus: number
}

export interface HistoricalRanchFact {
  id: string
  fact: string
  source: string
  era: string
  relatedGameMechanic?: string
}

// ─── 1. Land Clearing Stages ─────────────────────────────────────────────────

export const LAND_CLEARING_STAGES: LandClearingStage[] = [
  {
    id: 'raw_manzanita',
    name: 'Raw Manzanita Chaparral',
    description: 'Dense, tangled manzanita and scrub oak blanket the hillside. The red-barked brush is so thick a rabbit could barely squeeze through. Nothing will grow here until the land is cleared by hand and fire.',
    daysToComplete: 14,
    laborRequired: 4,
    tools: ['axe', 'mattock', 'brush_hook'],
    visualDescription: [
      '  ~~^^~~^^~~^^~~^^~~',
      '  ^/\\/\\/\\/\\/\\/\\/\\^',
      '  ~~^^~~^^~~^^~~^^~~',
      '  ^/\\/\\MANZANITA/\\^',
      '  ~~^^~~^^~~^^~~^^~~',
      '  ████████████████████',
      '  ▓▓▓ ROCKY SOIL ▓▓▓',
    ].join('\n'),
    nextStage: 'partially_cleared',
  },
  {
    id: 'partially_cleared',
    name: 'Partially Cleared',
    description: 'Some brush has been hacked away and burned in slash piles. Rocky soil is exposed in patches, studded with manzanita stumps and granite boulders. The air smells of smoke and fresh-turned earth.',
    daysToComplete: 10,
    laborRequired: 3,
    tools: ['axe', 'mattock', 'pry_bar', 'stone_boat'],
    visualDescription: [
      '  ..^^..  ..^^..  ..',
      '  .    ▓▓▓▓    ^.  ',
      '  . ○  ▓▓▓▓  ○  .  ',
      '   STUMPS & ROCKS   ',
      '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
      '  ░░░ BARE SOIL ░░░',
    ].join('\n'),
    nextStage: 'cleared',
  },
  {
    id: 'cleared',
    name: 'Cleared Land',
    description: 'The land is cleared to bare soil. Stumps have been grubbed out, rocks hauled off in a stone boat and piled into walls. The red Gold Country clay lies open to the sun, ready for fencing or planting.',
    daysToComplete: 7,
    laborRequired: 2,
    tools: ['shovel', 'rake', 'wheelbarrow'],
    visualDescription: [
      '  ........................',
      '  .                    .',
      '  .   CLEARED GROUND   .',
      '  .    ~~~~~~~~~~~~    .',
      '  .   ready to fence   .',
      '  ........................',
    ].join('\n'),
    nextStage: 'fenced',
  },
  {
    id: 'fenced',
    name: 'Fenced Pasture',
    description: 'Post-and-rail fence installed from hand-split sugar pine. The corral is tight and sturdy, ready for livestock. Gate swings true on leather hinges. A proper ranch is taking shape.',
    daysToComplete: 5,
    laborRequired: 2,
    tools: ['post_hole_digger', 'froe', 'mallet', 'saw'],
    visualDescription: [
      '  |====|====|====|====|',
      '  |                   |',
      '  |   FENCED CORRAL   |',
      '  |    ___     ___    |',
      '  |   |HAY|   |H2O|   |',
      '  |====|==[ GATE ]==|=|',
    ].join('\n'),
    nextStage: 'productive',
  },
  {
    id: 'productive',
    name: 'Productive Ranch',
    description: 'The ranch is fully operational. Irrigation ditches carry spring water to gardens and troughs. Composted soil produces vegetables and forage. Livestock graze on green pasture where manzanita once stood.',
    daysToComplete: 0,
    laborRequired: 0,
    tools: [],
    visualDescription: [
      '  |====|====|====|====|',
      '  | ~~ IRRIGATION ~~ |',
      '  | ,;, GARDEN  ,;,  |',
      '  | |#| BARN    |#|  |',
      '  | 🐄  🐔  🐴  🐐  |',
      '  |==PRODUCTIVE RANCH=|',
    ].join('\n'),
    nextStage: null,
  },
]

// ─── 2. Water Systems ────────────────────────────────────────────────────────

export const WATER_SYSTEMS: WaterSystem[] = [
  {
    id: 'natural_spring',
    name: 'Natural Spring',
    description: 'A seep found among the rocks on the property. Water trickles from a crack in the granite, pooling in a muddy depression. Flow varies with the season -- a torrent after winter rains, barely a drip by late summer.',
    waterOutput: 50,
    cost: { neutral: 0 },
    buildDays: 0,
    bonus: 'Provides basic drinking water for household and a few animals. Unreliable in dry months.',
  },
  {
    id: 'spring_box',
    name: 'Spring Box',
    description: 'A cedar box built over the spring captures and stores water as it emerges. Gravel filter keeps sediment out. The overflow runs into a wooden trough. Water stays cool even in summer heat.',
    waterOutput: 150,
    cost: { neutral: 30 },
    buildDays: 3,
    prerequisiteId: 'natural_spring',
    bonus: 'Reliable water supply for up to 20 livestock. Enables a small kitchen garden.',
  },
  {
    id: 'irrigation_ditch',
    name: 'Irrigation Ditch',
    description: 'Hand-dug channels carry water from the spring box across the property. Lined with flat stones to reduce seepage. Wooden headgates control flow to different fields. A week of backbreaking shovel work.',
    waterOutput: 400,
    cost: { neutral: 80 },
    buildDays: 7,
    prerequisiteId: 'spring_box',
    bonus: 'Waters pastures and crop fields. Supports up to 50 livestock. Enables hay production, reducing feed costs by 25%.',
  },
  {
    id: 'gravity_fed',
    name: 'Gravity-Fed Pipe System',
    description: 'Hollowed sugar pine logs piped from a higher-elevation spring deliver pressurized water to the barn, house, and troughs. The engineering marvel of the county -- water flows uphill to nowhere but always downhill to where you need it.',
    waterOutput: 1000,
    cost: { neutral: 200, good: 50 },
    buildDays: 14,
    prerequisiteId: 'irrigation_ditch',
    bonus: 'Full ranch water system. Supports unlimited livestock. Enables year-round irrigation, orchard, and fire suppression. +15% livestock health bonus.',
  },
]

// ─── 3. Horse Training Stages ────────────────────────────────────────────────

export const HORSE_TRAINING_STAGES: HorseTrainingStage[] = [
  {
    id: 'wild',
    name: 'Wild / Unbroken',
    description: 'Fresh off the range, this mustang wants nothing to do with humans. Ears pinned, nostrils flared, ready to kick or bolt. Getting a halter on is a victory. Getting a saddle on is a prayer.',
    daysToTrain: 0,
    trainerSkillRequired: 0,
    speedBonus: 0,
    staminaBonus: 0,
  },
  {
    id: 'green_broke',
    name: 'Green Broke',
    description: 'Accepts a saddle and rider without trying to kill anyone, most of the time. Still spooky -- a blowing leaf can send this horse sideways. Responds to reins about half the time. The other half is an adventure.',
    daysToTrain: 7,
    trainerSkillRequired: 2,
    speedBonus: 3,
    staminaBonus: 2,
    specialAbility: 'Can be ridden short distances but may spook, adding random travel delays.',
  },
  {
    id: 'trail_ready',
    name: 'Trail Ready',
    description: 'Reliable on the trail. Crosses water, handles steep terrain, ties to a post without pulling back. A solid working horse that has seen enough rattlesnakes and mule deer to hold steady. A ranch hand\'s best friend.',
    daysToTrain: 14,
    trainerSkillRequired: 4,
    speedBonus: 6,
    staminaBonus: 5,
    specialAbility: 'Reliable travel mount. +10% travel speed. Can carry extra supplies (100 lbs bonus cargo).',
  },
  {
    id: 'endurance_conditioned',
    name: 'Endurance Conditioned',
    description: 'Built up through months of long, slow distance work on Gold Country trails. Can cover 50 miles in a day over mountain terrain and still eat dinner. Heart rate recovers in minutes. Legs are iron.',
    daysToTrain: 30,
    trainerSkillRequired: 7,
    speedBonus: 8,
    staminaBonus: 9,
    specialAbility: 'Can travel 50 miles per day without rest penalty. +20% travel speed. Recovers stamina 2x faster at camp.',
  },
  {
    id: 'champion',
    name: 'Champion (Tevis Cup Level)',
    description: '100 miles from Squaw Valley to Auburn in under 24 hours -- across the Sierra Nevada, through canyons and over granite ridges. This horse is a legend. The Haggin Cup awaits the best-conditioned finisher. This is that horse.',
    daysToTrain: 60,
    trainerSkillRequired: 10,
    speedBonus: 10,
    staminaBonus: 10,
    specialAbility: 'Can travel 100 miles in 24 hours. +30% travel speed. Immune to terrain penalties. Grants +5 reputation in any town. "Is that THE horse?"',
  },
]

// ─── 4. Wildlife Encounters ──────────────────────────────────────────────────

export const WILDLIFE_ENCOUNTERS: WildlifeEncounter[] = [
  {
    id: 'rattlesnake_den',
    name: 'Rattlesnake Den',
    description: 'While clearing rocks near the barn, you uncover a den of Pacific rattlesnakes warming themselves in the spring sun. A dozen coiled bodies buzz their warnings. One strikes at your boot.',
    season: 'spring',
    chance: 0.2,
    effect: {
      livestockLoss: 1,
      karmaChange: -2,
      message: 'A rattlesnake bit one of your animals before you could clear the den. Lost 1 livestock.',
    },
    rarity: 'common',
  },
  {
    id: 'mountain_lion_prowl',
    name: 'Mountain Lion on the Prowl',
    description: 'Fresh tracks in the snow around the corral -- a big cat, maybe 150 pounds. Claw marks on the fence post where it tried to climb over. Your livestock are huddled in the far corner, trembling.',
    season: 'winter',
    chance: 0.12,
    effect: {
      livestockLoss: 2,
      karmaChange: -5,
      message: 'A mountain lion broke into the corral overnight. Lost 2 livestock before the dogs drove it off.',
    },
    rarity: 'uncommon',
  },
  {
    id: 'bear_in_orchard',
    name: 'Bear in the Orchard',
    description: 'A black bear has discovered your apple trees and decided this is now his orchard. He has eaten half the crop and broken three branches. He stares at you with juice dripping from his muzzle, completely unimpressed.',
    season: 'autumn',
    chance: 0.1,
    effect: {
      foodGain: -20,
      karmaChange: -3,
      message: 'A bear ravaged your orchard. Lost significant food stores, but at least the livestock are unharmed.',
    },
    rarity: 'uncommon',
  },
  {
    id: 'eagle_nest_discovery',
    name: 'Golden Eagle Nest',
    description: 'While riding the upper pasture, you spot a massive stick nest in a tall ponderosa pine. A golden eagle perches on the rim, feeding two downy chicks. The Miwok considered this the most powerful of omens. Your ranch is blessed.',
    season: 'spring',
    chance: 0.05,
    effect: {
      karmaChange: 10,
      message: 'A golden eagle has nested on your property -- a sign of great fortune! +10 karma. The Miwok would say the land has chosen you.',
    },
    rarity: 'rare',
  },
  {
    id: 'coyote_pack',
    name: 'Coyote Pack',
    description: 'Yipping and howling pierce the night. A pack of coyotes circles the chicken coop, testing the fence for weakness. Your rooster sounds the alarm, and the dogs go berserk.',
    season: null,
    chance: 0.18,
    effect: {
      livestockLoss: 1,
      message: 'Coyotes got into the chicken coop. Lost 1 poultry despite the dogs\' best efforts.',
    },
    rarity: 'common',
  },
  {
    id: 'deer_in_garden',
    name: 'Deer in the Garden',
    description: 'A doe and two fawns have discovered your vegetable garden and are methodically eating every green thing in sight. They look up with those big brown eyes as if daring you to do something about it.',
    season: 'summer',
    chance: 0.22,
    effect: {
      foodGain: -10,
      message: 'Deer ate through your garden overnight. Lost some food production, but they sure are pretty.',
    },
    rarity: 'common',
  },
  {
    id: 'wild_turkey_flock',
    name: 'Wild Turkey Flock',
    description: 'A flock of two dozen wild turkeys struts across the lower pasture, gobbling and fanning their tails. Gold Country turkeys are fat this time of year, gorged on acorns. Easy pickings for a hunter with steady aim.',
    season: 'autumn',
    chance: 0.2,
    effect: {
      foodGain: 15,
      message: 'Bagged several wild turkeys from the flock passing through! +15 food. Thanksgiving came early.',
    },
    rarity: 'common',
  },
  {
    id: 'bobcat_sighting',
    name: 'Bobcat Sighting',
    description: 'At dusk, you spot a bobcat sitting perfectly still on the rock wall at the edge of the property. Tufted ears, spotted coat, golden eyes watching you with that patient, ancient gaze. It blinks once, then vanishes into the manzanita like smoke.',
    season: null,
    chance: 0.04,
    effect: {
      message: 'A bobcat watches you from the rock wall, then disappears. No harm done -- just a reminder of who was here first.',
    },
    rarity: 'rare',
  },
]

// ─── 5. La Sierra Mastery Tiers ──────────────────────────────────────────────

export const LA_SIERRA_MASTERY_TIERS: MasteryTier[] = [
  {
    id: 'white_belt',
    name: 'White Belt - Newcomer',
    description: 'Fresh off the wagon from back East. You can haul water and muck stalls, but you don\'t know a fetlock from a fencepost. The old-timers give you the easy chores and watch to see if you\'ll last.',
    color: '#FFFFFF',
    requirements: {
      minDays: 0,
    },
    perks: [
      'Can perform basic ranch chores (feeding, watering)',
      'Access to general store for basic supplies',
    ],
    reputationBonus: 0,
  },
  {
    id: 'yellow_belt',
    name: 'Yellow Belt - Apprentice',
    description: 'You can saddle a horse without getting kicked, ride at a walk and trot without falling off, and you\'ve stopped calling cattle "cows." The old-timers have stopped watching you so closely.',
    color: '#FFD700',
    requirements: {
      minDays: 10,
    },
    perks: [
      'Can saddle and ride horses (green broke level)',
      'Basic livestock care (feeding, health checks)',
      '+5% trade prices at general store',
    ],
    reputationBonus: 2,
  },
  {
    id: 'red_belt',
    name: 'Red Belt - Ranch Hand',
    description: 'You can work livestock independently -- move cattle, doctor a sick calf, string fence wire in the rain. You\'ve been thrown, bitten, kicked, and sunburned. You keep coming back. The ranch hands respect that.',
    color: '#CC0000',
    requirements: {
      minDays: 30,
      minLivestock: 10,
      minHorseLevel: 'trail_ready',
    },
    perks: [
      'Can work livestock independently',
      'Horse training up to trail_ready level',
      'Can trade livestock at market',
      '+10% trade prices at all shops',
      'Reduced predator attack chance (-10%)',
    ],
    reputationBonus: 5,
  },
  {
    id: 'blue_belt',
    name: 'Blue Belt - Trail Boss',
    description: 'You lead cattle drives and trail rides. Other ranchers ask your opinion on breeding stock and water rights. You can read the weather, the land, and a horse\'s mood. The La Sierra boys look up to you.',
    color: '#0044CC',
    requirements: {
      minDays: 60,
      minLivestock: 25,
      minHorseLevel: 'endurance_conditioned',
    },
    perks: [
      'Can lead cattle drives (bonus trade events)',
      'Horse training up to endurance_conditioned level',
      'Can hire ranch hands (NPC helpers)',
      '+20% trade prices, access to premium buyers',
      'Reduced livestock disease chance (-15%)',
      'Can participate in endurance rides',
    ],
    reputationBonus: 10,
  },
  {
    id: 'brown_belt',
    name: 'Brown Belt - Ranch Foreman',
    description: 'You manage all ranch operations. Breeding programs, water systems, hay contracts, fencing crews -- it all runs through you. The county knows your brand. Neighbors bring their difficult horses to you.',
    color: '#8B4513',
    requirements: {
      minDays: 100,
      minLivestock: 50,
      minHorseLevel: 'endurance_conditioned',
      requiredBuildings: ['barn', 'bunkhouse', 'smokehouse', 'tack_room'],
    },
    perks: [
      'Full ranch management (automated daily operations)',
      'Horse training up to champion level',
      'Can breed and sell trained horses',
      '+30% trade prices, access to exclusive auctions',
      'Reduced all negative event chances (-20%)',
      'Can mentor other players (NPC apprentices generate karma)',
      'Unlocks gravity-fed water system construction',
    ],
    reputationBonus: 20,
  },
  {
    id: 'black_belt',
    name: 'Black Belt - Master Rancher',
    description: 'Legend of the county. Your ranch is the standard by which all others are measured. You\'ve ridden the Tevis trail, bred champion stock, and turned raw manzanita into the finest spread in Gold Country. The La Sierra program sends their best students to learn from you.',
    color: '#1A1A1A',
    requirements: {
      minDays: 200,
      minLivestock: 100,
      minHorseLevel: 'champion',
      requiredBuildings: ['barn', 'bunkhouse', 'smokehouse', 'tack_room', 'arena', 'veterinary_station'],
    },
    perks: [
      'Master rancher status -- maximum reputation everywhere',
      'All horse training levels unlocked',
      'Champion breeding program (rare horse traits)',
      '+50% trade prices, can set market prices',
      'All negative events reduced by 40%',
      'Generates passive karma income from ranch tourism',
      'Can establish a La Sierra chapter (trains NPC youth)',
      'Unlocks secret Tevis Cup endurance race event',
      'Title: "The Don/Dona of Gold Country"',
    ],
    reputationBonus: 50,
  },
]

// ─── 6. Historical Ranch Facts ───────────────────────────────────────────────

export const HISTORICAL_RANCH_FACTS: HistoricalRanchFact[] = [
  {
    id: 'manzanita_clearing',
    fact: 'Manzanita chaparral was the bane of Gold Country ranchers. The dense, fire-adapted shrub had to be cleared by hand with mattocks and brush hooks before any land could be used. Old-timers would burn cleared brush in slash piles, then grub out the iron-hard root crowns -- work that broke tools and backs in equal measure.',
    source: 'Gold Country ranching memoirs, 1850s',
    era: '1849-1860',
    relatedGameMechanic: 'land_clearing',
  },
  {
    id: 'adobe_construction',
    fact: 'Early Gold Country ranch buildings were constructed from rammed earth and adobe bricks made from local red clay mixed with straw. The thick walls stayed cool in summer heat that could reach 110 degrees in the foothills. Some of these structures still stand today, 170 years later.',
    source: 'California adobe building traditions',
    era: '1850-1870',
    relatedGameMechanic: 'building',
  },
  {
    id: 'gravity_water',
    fact: 'Gravity-fed water systems were engineering marvels of the Gold Country. Miners adapted their flume-building skills to ranch use, running hollowed sugar pine logs from high-elevation springs downhill to barns and houses. Some systems dropped hundreds of feet over a mile, delivering water at impressive pressure without any pump.',
    source: 'Gold Country water engineering records',
    era: '1852-1880',
    relatedGameMechanic: 'water_system',
  },
  {
    id: 'la_sierra_program',
    fact: 'The La Sierra Youth Program was a legendary endurance and horsemanship program in the California foothills. Students progressed through colored belt ranks by completing increasingly grueling riding and ranch work challenges. The black belt required a 100-mile endurance ride -- the same distance as the famous Tevis Cup.',
    source: 'La Sierra program historical records',
    era: '1950s-1970s (inspired by earlier ranching traditions)',
    relatedGameMechanic: 'mastery_tiers',
  },
  {
    id: 'endurance_riding',
    fact: 'The Western States Trail Ride (Tevis Cup), first run in 1955 from Tahoe to Auburn, traces routes used by Gold Rush riders and Pony Express predecessors. Riders must complete 100 miles in 24 hours over the Sierra Nevada. The Haggin Cup goes to the best-conditioned horse at the finish -- the real prize, since it proves horsemanship over speed.',
    source: 'Western States Trail Foundation',
    era: '1955-present (route dates to 1850s)',
    relatedGameMechanic: 'horse_training',
  },
  {
    id: 'rattlesnake_lore',
    fact: 'Pacific rattlesnakes were a constant hazard of Gold Country ranch life. They denned in rock piles and under barn foundations, emerging in spring to sun themselves. Ranchers learned to stomp loudly when walking through grass and to check boots before putting them on. A good ranch dog that could dodge a strike was worth its weight in gold dust.',
    source: 'Gold Country settler journals',
    era: '1849-present',
    relatedGameMechanic: 'wildlife_encounters',
  },
  {
    id: 'mountain_lion_territory',
    fact: 'Mountain lions (California grizzlies were already being hunted out by the 1850s) were the apex predators of Gold Country ranches. A single big cat could kill a dozen sheep in a night, taking only a bite from each. Ranchers organized lion hunts with hound packs, but the cats always came back. The mountains belong to them.',
    source: 'El Dorado County historical society records',
    era: '1849-present',
    relatedGameMechanic: 'wildlife_encounters',
  },
  {
    id: 'miwok_grinding_rocks',
    fact: 'While clearing land for ranching, settlers frequently discovered Miwok grinding rocks -- granite boulders worn smooth with dozens of cup-shaped mortars used for centuries to grind acorns into flour. The largest known site, at Indian Grinding Rock State Historic Park, has 1,185 mortar holes in a single limestone outcrop. Many ranchers built their homesteads near these sites, unknowingly choosing the same spots the Miwok had selected for good water and shelter.',
    source: 'Miwok archaeological records, Indian Grinding Rock SHP',
    era: 'Pre-contact through 1850s',
    relatedGameMechanic: 'land_clearing',
  },
  {
    id: 'archaeological_finds',
    fact: 'Gold Country ranchers regularly turned up artifacts while plowing or digging post holes: obsidian arrowheads traded from eastern tribes, stone pestles, shell beads from coastal Ohlone trade networks, and occasionally Spanish-era mission items. The layers of history in the soil told stories stretching back thousands of years.',
    source: 'Central Sierra archaeological surveys',
    era: '1850s-present',
    relatedGameMechanic: 'land_clearing',
  },
  {
    id: 'seasonal_challenges',
    fact: 'Gold Country ranchers faced extreme seasonal swings. Summer brought weeks of 100+ degree heat and fire danger. Winter brought torrential rains that turned red clay roads to impassable mud, and occasional snowfall at higher elevations. Spring was rattlesnake season. Autumn brought the blessed relief of cool nights and the scramble to put up hay before the rains.',
    source: 'Placer County agricultural records',
    era: '1849-present',
    relatedGameMechanic: 'seasons',
  },
  {
    id: 'gold_country_soil',
    fact: 'Gold Country soil is a distinctive red clay derived from ancient laterite deposits, mixed with decomposed granite. It drains poorly when compacted, bakes brick-hard in summer, and turns to sticky mud in winter. Successful ranchers learned to amend it heavily with composted manure and leaf litter. The old-timers said the soil was "too poor to grow rocks, but too stubborn to quit."',
    source: 'UC Davis agricultural extension reports',
    era: '1850s-present',
    relatedGameMechanic: 'land_clearing',
  },
  {
    id: 'historic_fencing',
    fact: 'Before barbed wire reached California in the 1870s, Gold Country ranchers built fences from hand-split sugar pine rails stacked in a zigzag "worm fence" pattern, or from local granite stacked into dry-stone walls. A good fence builder could split 200 rails a day with a froe and mallet. Many of these original stone walls still mark property lines in the foothills today.',
    source: 'Gold Country ranching memoirs, fence-building records',
    era: '1850-1875',
    relatedGameMechanic: 'fencing',
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get the next land clearing stage for progression.
 */
export function getNextClearingStage(currentStageId: string): LandClearingStage | null {
  const current = LAND_CLEARING_STAGES.find(s => s.id === currentStageId)
  if (!current || !current.nextStage) return null
  return LAND_CLEARING_STAGES.find(s => s.id === current.nextStage) ?? null
}

/**
 * Get the next water system upgrade.
 */
export function getNextWaterSystem(currentSystemId: string): WaterSystem | null {
  const currentIndex = WATER_SYSTEMS.findIndex(w => w.id === currentSystemId)
  if (currentIndex < 0 || currentIndex >= WATER_SYSTEMS.length - 1) return null
  return WATER_SYSTEMS[currentIndex + 1]
}

/**
 * Get the next horse training stage.
 */
export function getNextTrainingStage(currentStageId: string): HorseTrainingStage | null {
  const currentIndex = HORSE_TRAINING_STAGES.findIndex(s => s.id === currentStageId)
  if (currentIndex < 0 || currentIndex >= HORSE_TRAINING_STAGES.length - 1) return null
  return HORSE_TRAINING_STAGES[currentIndex + 1]
}

/**
 * Get total days required to fully train a horse from wild to a target level.
 */
export function getTotalTrainingDays(targetStageId: string): number {
  let total = 0
  for (const stage of HORSE_TRAINING_STAGES) {
    total += stage.daysToTrain
    if (stage.id === targetStageId) break
  }
  return total
}

/**
 * Get mastery tier for a given number of ranch days.
 */
export function getMasteryTierForDays(days: number): MasteryTier {
  let tier = LA_SIERRA_MASTERY_TIERS[0]
  for (const t of LA_SIERRA_MASTERY_TIERS) {
    if (days >= t.requirements.minDays) {
      tier = t
    }
  }
  return tier
}

/**
 * Check if player meets all requirements for a mastery tier.
 */
export function checkMasteryRequirements(
  tierId: string,
  days: number,
  livestockCount: number,
  horseLevel: string,
  builtBuildings: string[]
): { met: boolean; missing: string[] } {
  const tier = LA_SIERRA_MASTERY_TIERS.find(t => t.id === tierId)
  if (!tier) return { met: false, missing: ['Invalid tier'] }

  const missing: string[] = []

  if (days < tier.requirements.minDays) {
    missing.push(`Need ${tier.requirements.minDays} days ranching (have ${days})`)
  }

  if (tier.requirements.minLivestock && livestockCount < tier.requirements.minLivestock) {
    missing.push(`Need ${tier.requirements.minLivestock} livestock (have ${livestockCount})`)
  }

  if (tier.requirements.minHorseLevel) {
    const requiredIndex = HORSE_TRAINING_STAGES.findIndex(s => s.id === tier.requirements.minHorseLevel)
    const currentIndex = HORSE_TRAINING_STAGES.findIndex(s => s.id === horseLevel)
    if (currentIndex < requiredIndex) {
      missing.push(`Need horse at ${tier.requirements.minHorseLevel} level`)
    }
  }

  if (tier.requirements.requiredBuildings) {
    for (const building of tier.requirements.requiredBuildings) {
      if (!builtBuildings.includes(building)) {
        missing.push(`Need to build: ${building}`)
      }
    }
  }

  return { met: missing.length === 0, missing }
}

/**
 * Filter wildlife encounters by season. Pass null for encounters that can happen any time.
 */
export function getEncountersForSeason(season: string): WildlifeEncounter[] {
  return WILDLIFE_ENCOUNTERS.filter(e => e.season === null || e.season === season)
}

/**
 * Roll for wildlife encounters this season. Returns encounters that triggered.
 */
export function rollWildlifeEncounters(season: string): WildlifeEncounter[] {
  const eligible = getEncountersForSeason(season)
  return eligible.filter(e => Math.random() < e.chance)
}

/**
 * Get a random historical fact, optionally filtered by game mechanic.
 */
export function getRandomFact(relatedMechanic?: string): HistoricalRanchFact {
  const pool = relatedMechanic
    ? HISTORICAL_RANCH_FACTS.filter(f => f.relatedGameMechanic === relatedMechanic)
    : HISTORICAL_RANCH_FACTS
  const facts = pool.length > 0 ? pool : HISTORICAL_RANCH_FACTS
  return facts[Math.floor(Math.random() * facts.length)]
}

/**
 * Calculate total water system cost to reach a target level from scratch.
 */
export function getTotalWaterCost(targetSystemId: string): { neutral: number; good: number } {
  let neutral = 0
  let good = 0
  for (const system of WATER_SYSTEMS) {
    neutral += system.cost.neutral
    good += system.cost.good ?? 0
    if (system.id === targetSystemId) break
  }
  return { neutral, good }
}

/**
 * Calculate total land clearing days from raw manzanita to a target stage.
 */
export function getTotalClearingDays(targetStageId: string): number {
  let total = 0
  for (const stage of LAND_CLEARING_STAGES) {
    total += stage.daysToComplete
    if (stage.id === targetStageId) break
  }
  return total
}
