/**
 * Gold Country Encounters - Random travel encounters and location search areas
 * Used during gold_country_travel phase and location exploration
 */

export interface TravelEncounter {
  id: string
  title: string
  description: string
  type: 'combat' | 'trade' | 'rescue' | 'wildlife' | 'mystery' | 'opportunity'
  icon: string
  choices: EncounterChoice[]
  minDistance?: number  // Only trigger if travel distance > this
}

export interface EncounterChoice {
  id: string
  text: string
  outcome: EncounterOutcome
  statCheck?: { stat: 'strength' | 'athleticism' | 'diplomacy' | 'luck' | 'expertise' | 'shrewdness'; difficulty: number }
}

export interface EncounterOutcome {
  message: string
  goldDelta?: number
  healthDelta?: number
  karmaDelta?: number   // good karma
  foodDelta?: number
  reputationDelta?: number
  itemGained?: string
  discoveredLocation?: string
}

export interface SearchArea {
  id: string
  name: string
  description: string
  location: string
  icon: string
  searchDifficulty: number  // 1-10
  statBonus?: 'expertise' | 'shrewdness' | 'luck'
  findings: SearchFinding[]
}

export interface SearchFinding {
  id: string
  description: string
  probability: number  // 0-1
  isClue: boolean
  clueId?: string  // links to investigation system
  itemGained?: string
  goldGained?: number
  karmaGained?: number
}

// === TRAVEL ENCOUNTERS ===

export const TRAVEL_ENCOUNTERS: TravelEncounter[] = [
  {
    id: 'bandit_ambush',
    title: 'Bandit Ambush!',
    description: 'A group of road agents blocks the trail ahead. Their leader tips his hat menacingly.',
    type: 'combat',
    icon: '🔫',
    choices: [
      {
        id: 'fight',
        text: 'Stand your ground and fight',
        outcome: {
          message: 'After a brief skirmish, you drive off the bandits! They drop some supplies in their retreat.',
          goldDelta: 25,
          healthDelta: -10,
          reputationDelta: 5,
        },
        statCheck: { stat: 'strength', difficulty: 5 },
      },
      {
        id: 'negotiate',
        text: 'Try to talk your way out',
        outcome: {
          message: 'Your silver tongue convinces them you\'re not worth the trouble. They wave you through.',
          reputationDelta: 3,
        },
        statCheck: { stat: 'diplomacy', difficulty: 6 },
      },
      {
        id: 'pay_toll',
        text: 'Pay the "toll" (30 gold)',
        outcome: {
          message: 'You hand over the gold. The bandit grins. "Pleasure doin\' business."',
          goldDelta: -30,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'traveling_merchant',
    title: 'Traveling Merchant',
    description: 'A well-stocked wagon pulls alongside you. "Genuine Gold Rush supplies! Best prices this side of Sacramento!"',
    type: 'trade',
    icon: '🛒',
    choices: [
      {
        id: 'buy_supplies',
        text: 'Buy food and medicine (40 gold)',
        outcome: {
          message: 'You stock up on supplies. The merchant throws in a lucky charm for free.',
          goldDelta: -40,
          foodDelta: 50,
          healthDelta: 10,
        },
      },
      {
        id: 'trade_info',
        text: 'Trade information instead',
        outcome: {
          message: 'The merchant shares valuable intel about a hidden location in exchange for your trail news.',
          discoveredLocation: 'sandy_gulch',
        },
        statCheck: { stat: 'shrewdness', difficulty: 4 },
      },
      {
        id: 'decline',
        text: 'Decline politely and move on',
        outcome: {
          message: '"Suit yourself! But you\'ll regret it when you\'re hungry!" The wagon moves on.',
        },
      },
    ],
  },
  {
    id: 'lost_traveler',
    title: 'Lost Traveler',
    description: 'A disoriented traveler stumbles toward you, dehydrated and confused. "Please... which way to town?"',
    type: 'rescue',
    icon: '🆘',
    choices: [
      {
        id: 'help_fully',
        text: 'Share water and escort them to safety',
        outcome: {
          message: 'The grateful traveler recovers and shares information about a nearby discovery.',
          karmaDelta: 20,
          foodDelta: -10,
          reputationDelta: 8,
          discoveredLocation: 'indian_grinding_rock',
        },
      },
      {
        id: 'give_directions',
        text: 'Point them toward the nearest town',
        outcome: {
          message: '"Thank you, stranger." They stumble off in the right direction.',
          karmaDelta: 5,
        },
      },
      {
        id: 'ignore',
        text: 'Keep moving - can\'t help everyone',
        outcome: {
          message: 'You press on, trying not to think about the traveler. Your conscience nags.',
          karmaDelta: -10,
        },
      },
    ],
  },
  {
    id: 'grizzly_bear',
    title: 'Grizzly Bear!',
    description: 'A massive California grizzly blocks the trail, sniffing the air. It\'s between you and your destination.',
    type: 'wildlife',
    icon: '🐻',
    choices: [
      {
        id: 'stand_tall',
        text: 'Stand tall and make yourself big',
        outcome: {
          message: 'The bear decides you\'re not worth the trouble and lumbers away into the brush.',
          reputationDelta: 3,
        },
        statCheck: { stat: 'athleticism', difficulty: 5 },
      },
      {
        id: 'back_away',
        text: 'Slowly back away',
        outcome: {
          message: 'You retreat carefully. The bear watches you go, then returns to foraging.',
        },
      },
      {
        id: 'offer_food',
        text: 'Toss some food as a distraction',
        outcome: {
          message: 'The bear takes the bait! While it eats, you slip past safely.',
          foodDelta: -20,
        },
      },
    ],
  },
  {
    id: 'mysterious_stranger',
    title: 'Mysterious Stranger',
    description: 'A figure in a long coat sits by a campfire, face hidden by shadow. "Join me for a spell?"',
    type: 'mystery',
    icon: '🕵️',
    choices: [
      {
        id: 'sit_and_talk',
        text: 'Sit and listen to their story',
        outcome: {
          message: 'The stranger shares a cryptic clue about the investigation. "Follow the laundry marks..."',
          itemGained: 'mysterious_note',
          reputationDelta: 2,
        },
      },
      {
        id: 'question',
        text: 'Demand to know their identity',
        outcome: {
          message: 'The figure stands and tips their hat. "In due time, friend." They vanish into the night.',
        },
        statCheck: { stat: 'shrewdness', difficulty: 7 },
      },
      {
        id: 'walk_away',
        text: 'Best not to engage with strangers',
        outcome: {
          message: 'You pass by. The stranger calls out: "You\'ll wish you\'d listened, when the time comes."',
        },
      },
    ],
    minDistance: 3,
  },
  {
    id: 'abandoned_wagon',
    title: 'Abandoned Wagon',
    description: 'An overturned wagon sits by the trail. Supplies are scattered, but no one is in sight.',
    type: 'opportunity',
    icon: '🛞',
    choices: [
      {
        id: 'search_wagon',
        text: 'Search the wagon for useful supplies',
        outcome: {
          message: 'You find food, a few gold coins, and a torn map fragment.',
          goldDelta: 35,
          foodDelta: 25,
          itemGained: 'torn_map_fragment',
        },
      },
      {
        id: 'look_for_owner',
        text: 'Look for the wagon\'s owner',
        outcome: {
          message: 'You find the owner injured nearby. They gratefully offer a reward for your help.',
          karmaDelta: 15,
          goldDelta: 50,
          reputationDelta: 5,
        },
        statCheck: { stat: 'expertise', difficulty: 4 },
      },
      {
        id: 'leave_it',
        text: 'Leave it alone - could be a trap',
        outcome: {
          message: 'Smart thinking. You notice boot prints in the dust leading to an ambush point.',
          reputationDelta: 2,
        },
        statCheck: { stat: 'luck', difficulty: 3 },
      },
    ],
  },
  {
    id: 'gold_nugget_stream',
    title: 'Glittering Stream',
    description: 'Sunlight catches something in the creek bed. It could be gold... or just fool\'s gold.',
    type: 'opportunity',
    icon: '✨',
    choices: [
      {
        id: 'pan_for_gold',
        text: 'Spend time panning the stream',
        outcome: {
          message: 'Your patience pays off! Real gold flakes settle in the pan.',
          goldDelta: 60,
        },
        statCheck: { stat: 'luck', difficulty: 5 },
      },
      {
        id: 'mark_location',
        text: 'Mark the location and continue',
        outcome: {
          message: 'You note the spot on your map. Could be worth coming back to.',
          itemGained: 'stream_location_note',
        },
      },
    ],
  },
  {
    id: 'stagecoach_holdup',
    title: 'Stagecoach in Trouble',
    description: 'Ahead, a stagecoach is being robbed by masked men. The driver is pinned down.',
    type: 'combat',
    icon: '🐎',
    choices: [
      {
        id: 'intervene',
        text: 'Rush in to help the stagecoach',
        outcome: {
          message: 'You help drive off the robbers! The grateful Wells Fargo driver rewards you handsomely.',
          goldDelta: 75,
          karmaDelta: 20,
          reputationDelta: 10,
          healthDelta: -15,
        },
        statCheck: { stat: 'strength', difficulty: 6 },
      },
      {
        id: 'sneak_around',
        text: 'Circle around and flank the robbers',
        outcome: {
          message: 'Your surprise attack scatters the bandits. The stagecoach escapes safely.',
          goldDelta: 50,
          karmaDelta: 15,
          reputationDelta: 8,
        },
        statCheck: { stat: 'shrewdness', difficulty: 5 },
      },
      {
        id: 'stay_hidden',
        text: 'Stay hidden and wait for it to pass',
        outcome: {
          message: 'The robbers take what they want and ride off. The driver limps away.',
          karmaDelta: -5,
        },
      },
    ],
    minDistance: 3,
  },
]

// === SEARCH AREAS ===

export const LOCATION_SEARCH_AREAS: SearchArea[] = [
  // BOBR Cabin
  {
    id: 'cabin_guest_book',
    name: 'Guest Book',
    description: 'The cabin\'s guest book on the front table. Previous visitors have left notes.',
    location: 'bobr_cabin',
    icon: '📖',
    searchDifficulty: 2,
    statBonus: 'expertise',
    findings: [
      { id: 'guest_entry_suspicious', description: 'A recent entry with a fake name and an encoded message.', probability: 0.8, isClue: true, clueId: 'guest_book_code' },
      { id: 'guest_entry_normal', description: 'Normal guest entries praising the cabin and the view.', probability: 1.0, isClue: false },
    ],
  },
  {
    id: 'cabin_barn',
    name: 'The Barn',
    description: 'The ranch barn behind the cabin. Old equipment and hay bales.',
    location: 'bobr_cabin',
    icon: '🏚️',
    searchDifficulty: 4,
    statBonus: 'luck',
    findings: [
      { id: 'barn_map', description: 'A hand-drawn map tucked under a hay bale, marking locations around Gold Country.', probability: 0.5, isClue: true, clueId: 'hidden_map' },
      { id: 'barn_tools', description: 'Old mining tools. Could come in handy.', probability: 0.7, isClue: false, itemGained: 'mining_tools' },
    ],
  },

  // Angels Camp
  {
    id: 'angels_hotel_register',
    name: 'Angels Hotel Register',
    description: 'The historic hotel register where Twain signed in.',
    location: 'angels_camp',
    icon: '📜',
    searchDifficulty: 3,
    statBonus: 'expertise',
    findings: [
      { id: 'twain_entry', description: 'Twain\'s actual signature, dated 1864. Beneath it, a modern forgery.', probability: 0.7, isClue: true, clueId: 'forged_signature' },
      { id: 'hotel_history', description: 'Fascinating entries from Gold Rush era guests.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
  {
    id: 'angels_saloon',
    name: 'Ross\'s Saloon',
    description: 'The bar where Twain heard the jumping frog story. Dark corners hold secrets.',
    location: 'angels_camp',
    icon: '🍺',
    searchDifficulty: 5,
    statBonus: 'shrewdness',
    findings: [
      { id: 'saloon_note', description: 'A crumpled note behind the bar referencing a meeting at Moaning Cavern.', probability: 0.6, isClue: true, clueId: 'cavern_meeting' },
      { id: 'saloon_coins', description: 'A few gold coins wedged between the floorboards.', probability: 0.4, isClue: false, goldGained: 15 },
    ],
  },

  // Murphys
  {
    id: 'murphys_hotel_register',
    name: 'Murphys Hotel Register',
    description: 'The famous guest register with signatures from Twain, Grant, and Black Bart.',
    location: 'murphys',
    icon: '📋',
    searchDifficulty: 3,
    statBonus: 'expertise',
    findings: [
      { id: 'bart_signature', description: 'Black Bart\'s entry, written in his distinctive poetic hand.', probability: 0.8, isClue: true, clueId: 'bart_handwriting' },
      { id: 'grant_entry', description: 'Ulysses S. Grant\'s bold signature from 1879.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
  {
    id: 'murphys_wine_cellar',
    name: 'Wine Cellar',
    description: 'The deep wine cellars beneath the tasting rooms. Cool, dark, and full of secrets.',
    location: 'murphys',
    icon: '🍷',
    searchDifficulty: 6,
    statBonus: 'luck',
    findings: [
      { id: 'cellar_stash', description: 'A hidden compartment behind wine barrels containing stolen goods.', probability: 0.4, isClue: true, clueId: 'stolen_goods_stash' },
      { id: 'cellar_wine', description: 'A bottle of exceptional vintage. Worth keeping.', probability: 0.6, isClue: false, itemGained: 'fine_wine' },
    ],
  },

  // Moaning Cavern
  {
    id: 'moaning_cavern_depths',
    name: 'Cavern Depths',
    description: 'The deepest accessible section of the cavern. Few venture this far.',
    location: 'moaning_cavern',
    icon: '🕳️',
    searchDifficulty: 7,
    statBonus: 'expertise',
    findings: [
      { id: 'cavern_markings', description: 'Fresh tool marks on the cavern wall. Someone was here recently.', probability: 0.6, isClue: true, clueId: 'recent_excavation' },
      { id: 'cavern_bones', description: 'Ancient bone fragments. The geologist would want to see these.', probability: 0.5, isClue: false, itemGained: 'ancient_bones' },
    ],
  },

  // California Caverns
  {
    id: 'california_caverns_crystal_room',
    name: 'Crystal Chamber',
    description: 'A chamber filled with aragonite crystal formations. They shimmer in lantern light.',
    location: 'california_caverns',
    icon: '💎',
    searchDifficulty: 5,
    statBonus: 'luck',
    findings: [
      { id: 'crystal_cache', description: 'Hidden among the natural crystals, a stash of items that don\'t belong here.', probability: 0.5, isClue: true, clueId: 'crystal_cache_evidence' },
      { id: 'crystal_specimen', description: 'A loose aragonite crystal of exceptional quality.', probability: 0.7, isClue: false, itemGained: 'aragonite_crystal', goldGained: 30 },
    ],
  },

  // Big Trees
  {
    id: 'big_trees_hollow',
    name: 'Hollow Sequoia',
    description: 'A massive hollow sequoia trunk, large enough to walk inside.',
    location: 'big_trees',
    icon: '🌲',
    searchDifficulty: 4,
    statBonus: 'shrewdness',
    findings: [
      { id: 'hollow_stash', description: 'Letters hidden in the hollow tree, describing a smuggling operation.', probability: 0.6, isClue: true, clueId: 'smuggling_letters' },
      { id: 'hollow_carving', description: 'A beautiful carving from 1853, the year the grove was discovered.', probability: 0.8, isClue: false, karmaGained: 5 },
    ],
  },

  // Kennedy Mine
  {
    id: 'kennedy_mine_office',
    name: 'Mine Office',
    description: 'The old mine foreman\'s office. Dusty records line the walls.',
    location: 'kennedy_mine',
    icon: '📁',
    searchDifficulty: 5,
    statBonus: 'expertise',
    findings: [
      { id: 'mine_records', description: 'Production records that don\'t add up. Gold is going missing.', probability: 0.7, isClue: true, clueId: 'gold_theft_records' },
      { id: 'mine_diary', description: 'A miner\'s diary from 1922, written days before the disaster.', probability: 0.5, isClue: false, karmaGained: 10 },
    ],
  },
  {
    id: 'kennedy_mine_shaft',
    name: 'Upper Mine Shaft',
    description: 'The entrance to the upper levels of Kennedy Mine. Dark and foreboding.',
    location: 'kennedy_mine',
    icon: '⛏️',
    searchDifficulty: 8,
    statBonus: 'luck',
    findings: [
      { id: 'mine_gold_vein', description: 'A gold vein the foreman didn\'t report. Someone is mining secretly.', probability: 0.3, isClue: true, clueId: 'secret_mining' },
      { id: 'mine_gold_flakes', description: 'Gold flakes in the rubble. Enough to pocket.', probability: 0.6, isClue: false, goldGained: 40 },
    ],
  },

  // Mokelumne Hill
  {
    id: 'mokelumne_hotel_basement',
    name: 'Hotel Leger Basement',
    description: 'The infamous basement of Hotel Leger. Cold spots and creaking floors.',
    location: 'mokelumne_hill',
    icon: '🏚️',
    searchDifficulty: 6,
    statBonus: 'shrewdness',
    findings: [
      { id: 'hotel_ledger', description: 'A hidden ledger recording illicit transactions. Dates match recent crimes.', probability: 0.6, isClue: true, clueId: 'criminal_ledger' },
      { id: 'hotel_ghost', description: 'A cold draft and a whisper... "Check room seven..." Just the wind. Probably.', probability: 0.8, isClue: false, karmaGained: 3 },
    ],
  },
  {
    id: 'mokelumne_cemetery',
    name: 'French Cemetery',
    description: 'The old French cemetery on the hill. Weathered headstones and overgrown paths.',
    location: 'mokelumne_hill',
    icon: '⚰️',
    searchDifficulty: 5,
    statBonus: 'expertise',
    findings: [
      { id: 'cemetery_grave', description: 'A recent grave with no name. The earth is freshly turned.', probability: 0.5, isClue: true, clueId: 'unmarked_grave' },
      { id: 'cemetery_history', description: 'Headstones from the 1851 Chilean War. A sobering reminder of Gold Rush violence.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },

  // Ironstone Vineyards
  {
    id: 'ironstone_museum',
    name: 'Gold Museum',
    description: 'The museum housing the 44-pound gold specimen and Gold Rush artifacts.',
    location: 'ironstone_vineyards',
    icon: '🏛️',
    searchDifficulty: 4,
    statBonus: 'expertise',
    findings: [
      { id: 'museum_artifact', description: 'An artifact with a suspicious provenance that may be linked to recent thefts.', probability: 0.6, isClue: true, clueId: 'suspicious_artifact' },
      { id: 'museum_gold', description: 'The 44-pound gold specimen is breathtaking. You learn about its discovery in Jamestown.', probability: 1.0, isClue: false, karmaGained: 10 },
    ],
  },

  // Jackson
  {
    id: 'jackson_tunnels',
    name: 'Chinese Tunnels',
    description: 'The hidden tunnel network beneath Main Street, built by Chinese workers.',
    location: 'jackson',
    icon: '🕯️',
    searchDifficulty: 8,
    statBonus: 'shrewdness',
    findings: [
      { id: 'tunnel_evidence', description: 'Evidence of recent use: fresh footprints, a dropped lantern, and a coded note.', probability: 0.5, isClue: true, clueId: 'tunnel_activity' },
      { id: 'tunnel_artifacts', description: 'Preserved Chinese artifacts from the 1850s. A time capsule of a forgotten community.', probability: 0.7, isClue: false, karmaGained: 15, itemGained: 'chinese_artifact' },
    ],
  },
  {
    id: 'jackson_telegraph_office',
    name: 'Telegraph Office Records',
    description: 'Past telegraph messages are filed here. Some may contain clues.',
    location: 'jackson',
    icon: '📡',
    searchDifficulty: 4,
    statBonus: 'expertise',
    findings: [
      { id: 'telegraph_messages', description: 'Coded telegraph messages that match the pattern from the investigation.', probability: 0.7, isClue: true, clueId: 'coded_telegraphs' },
      { id: 'telegraph_news', description: 'News telegraphs from Sacramento about stagecoach robberies.', probability: 1.0, isClue: false },
    ],
  },

  // Natural Bridges
  {
    id: 'natural_bridges_creek',
    name: 'Coyote Creek Bed',
    description: 'The creek bed where gold has been found for over 150 years.',
    location: 'natural_bridges',
    icon: '🏞️',
    searchDifficulty: 3,
    statBonus: 'luck',
    findings: [
      { id: 'creek_gold', description: 'Gold flakes glint in the gravel. A good day for panning!', probability: 0.7, isClue: false, goldGained: 25 },
      { id: 'creek_evidence', description: 'A waterproof pouch caught on a rock. Inside: a journal page with meeting notes.', probability: 0.4, isClue: true, clueId: 'meeting_notes' },
    ],
  },
  {
    id: 'natural_bridges_cave',
    name: 'Under the Bridge',
    description: 'The natural cave formation beneath the bridge. Cool shade and hidden alcoves.',
    location: 'natural_bridges',
    icon: '🌉',
    searchDifficulty: 5,
    statBonus: 'shrewdness',
    findings: [
      { id: 'bridge_cache', description: 'A hidden cache of supplies and a half-burned map.', probability: 0.5, isClue: true, clueId: 'burned_map' },
      { id: 'bridge_swimming', description: 'The swimming hole is inviting. A quick dip refreshes body and spirit.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
]

// Helper functions
export function getSearchAreasForLocation(locationId: string): SearchArea[] {
  return LOCATION_SEARCH_AREAS.filter(area => area.location === locationId)
}

export function getRandomEncounter(travelDistance: number): TravelEncounter | null {
  // Base encounter chance: 30%, increases with distance
  const encounterChance = Math.min(0.3 + (travelDistance * 0.05), 0.7)
  if (Math.random() > encounterChance) return null

  const eligible = TRAVEL_ENCOUNTERS.filter(e => !e.minDistance || travelDistance >= e.minDistance)
  if (eligible.length === 0) return null

  return eligible[Math.floor(Math.random() * eligible.length)]
}

export function resolveSearch(area: SearchArea, statValue: number = 0): SearchFinding | null {
  const bonusChance = area.statBonus ? statValue * 0.05 : 0

  for (const finding of area.findings) {
    const adjustedProbability = Math.min(finding.probability + bonusChance, 0.95)
    if (Math.random() < adjustedProbability) {
      return finding
    }
  }
  return null
}
