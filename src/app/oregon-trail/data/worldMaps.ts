/**
 * World Maps Data for The Prospector's Tale
 *
 * Chapter 1: Journey West - Linear trail from Missouri to Sacramento (existing LANDMARKS)
 * Chapter 2: Gold Country - Open exploration of Sierra Foothills mining towns
 * Chapter 3+: Return Visits - Towns evolve based on player choices
 */

// ============================================
// TYPES
// ============================================

export type ChapterType = 'journey_west' | 'gold_country' | 'return_visit'

export type LocationType = 'town' | 'landmark' | 'fort' | 'river' | 'mine' | 'ghost_town' | 'pass' | 'spring' | 'mountains' | 'destination' | 'desert'

export type DangerLevel = 'safe' | 'normal' | 'dangerous'

export type ServiceType = 'inn' | 'shop' | 'telegraph' | 'saloon' | 'mine' | 'assay' | 'church' | 'stable' | 'blacksmith' | 'doctor'

export interface LocationLore {
  founded: string
  peakPopulation: number
  currentPopulation?: number
  historicalNote: string
  easterEggs: string[]
  famousResidents?: string[]
  notableEvents?: string[]
}

export interface MapLocation {
  id: string
  name: string
  x: number  // Map coordinates (0-100%)
  y: number  // Map coordinates (0-100%)
  type: LocationType
  chapter: ChapterType
  discovered: boolean
  lore: LocationLore
  services: ServiceType[]
  dangerLevel: DangerLevel
  connectedTo: string[]  // IDs of connected locations
  travelTime: number  // Hours to traverse
  description: string
  icon?: string
  special?: string  // Special features like 'cynthias_inn', 'black_bart_capture'
}

export interface RandomEncounterZone {
  id: string
  name: string
  x: number
  y: number
  radius: number  // Area of effect
  encounterTypes: string[]
  dangerLevel: DangerLevel
  description: string
}

export interface ChapterData {
  id: ChapterType
  name: string
  description: string
  unlockRequirement: string
  mapBounds: { x1: number; y1: number; x2: number; y2: number }
  locations: string[]  // Location IDs in this chapter
}

// ============================================
// CHAPTER 1: JOURNEY WEST (Existing Trail)
// These map to the existing LANDMARKS array
// ============================================

export const CHAPTER_1_WAYPOINTS: MapLocation[] = [
  {
    id: 'independence',
    name: 'Independence, Missouri',
    x: 95, y: 50,
    type: 'town',
    chapter: 'journey_west',
    discovered: true,  // Always starts discovered
    lore: {
      founded: '1827',
      peakPopulation: 4000,
      historicalNote: 'Launching point for the Oregon, California, and Santa Fe Trails. Known as the "Queen City of the Trails."',
      easterEggs: ['Ask the merchant about "frontier whiskey" for a special item', 'The courthouse holds records of early Gold Rush departures'],
      famousResidents: ['Harry S. Truman (later)'],
    },
    services: ['inn', 'shop', 'stable', 'blacksmith', 'church'],
    dangerLevel: 'safe',
    connectedTo: ['kansas_river'],
    travelTime: 0,
    description: 'Your journey begins here, where the western trails meet.',
  },
  {
    id: 'kansas_river',
    name: 'Kansas River Crossing',
    x: 88, y: 48,
    type: 'river',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'First major river crossing. Many emigrants drowned here or lost supplies.',
      easterEggs: ['An old ferryman tells tales of gold nuggets lost in the river'],
    },
    services: [],
    dangerLevel: 'normal',
    connectedTo: ['independence', 'fort_kearny'],
    travelTime: 4,
    description: 'The first test of your journey - can you cross safely?',
  },
  {
    id: 'fort_kearny',
    name: 'Fort Kearny',
    x: 75, y: 45,
    type: 'fort',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 500,
      historicalNote: 'Built to protect emigrants on the Oregon and California Trails. Named after Stephen W. Kearny.',
      easterEggs: ['The quartermaster has a wanted poster for a familiar face...'],
    },
    services: ['shop', 'stable', 'blacksmith', 'doctor'],
    dangerLevel: 'safe',
    connectedTo: ['kansas_river', 'chimney_rock'],
    travelTime: 8,
    description: 'A welcome sight of civilization in the wilderness.',
  },
  {
    id: 'chimney_rock',
    name: 'Chimney Rock',
    x: 62, y: 42,
    type: 'landmark',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'Most famous landmark on the Oregon Trail. Emigrants carved their names in the surrounding rock.',
      easterEggs: ['Find the carving: "S. CLEMENS 1861" hidden among thousands of names'],
    },
    services: [],
    dangerLevel: 'normal',
    connectedTo: ['fort_kearny', 'fort_laramie'],
    travelTime: 6,
    description: 'A natural spire rising 300 feet, visible for miles.',
  },
  {
    id: 'fort_laramie',
    name: 'Fort Laramie',
    x: 52, y: 38,
    type: 'fort',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: '1834',
      peakPopulation: 800,
      historicalNote: 'Originally a fur trading post, converted to military fort in 1849.',
      easterEggs: ['The telegraph operator hints at strange messages from the west'],
    },
    services: ['inn', 'shop', 'telegraph', 'stable', 'blacksmith', 'doctor'],
    dangerLevel: 'safe',
    connectedTo: ['chimney_rock', 'independence_rock'],
    travelTime: 7,
    description: 'Major resupply point where you decide your final route.',
  },
  {
    id: 'independence_rock',
    name: 'Independence Rock',
    x: 42, y: 35,
    type: 'landmark',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'Known as the "Register of the Desert." Emigrants aimed to reach it by July 4th.',
      easterEggs: ['A strange symbol carved here matches one in Angels Camp...'],
    },
    services: [],
    dangerLevel: 'normal',
    connectedTo: ['fort_laramie', 'south_pass'],
    travelTime: 5,
    description: 'A granite dome bearing the names of thousands of emigrants.',
  },
  {
    id: 'south_pass',
    name: 'South Pass',
    x: 35, y: 32,
    type: 'pass',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'The only feasible wagon crossing of the Continental Divide. Elevation: 7,550 feet.',
      easterEggs: ['A prospector claims to have found gold here before California'],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['independence_rock', 'fort_bridger'],
    travelTime: 8,
    description: 'The Continental Divide - you cross from Atlantic to Pacific watersheds.',
  },
  {
    id: 'fort_bridger',
    name: 'Fort Bridger',
    x: 28, y: 35,
    type: 'fort',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: '1843',
      peakPopulation: 400,
      historicalNote: 'Founded by Jim Bridger and Louis Vasquez as a trading post.',
      easterEggs: ['Old Jim Bridger himself might share tales of the California gold'],
    },
    services: ['inn', 'shop', 'stable', 'blacksmith'],
    dangerLevel: 'safe',
    connectedTo: ['south_pass', 'raft_river'],
    travelTime: 6,
    description: 'The last major supply point before the difficult terrain ahead.',
  },
  {
    id: 'raft_river',
    name: 'Raft River',
    x: 22, y: 30,
    type: 'river',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'The California Trail split point. A signpost read "Road to California." 70% of Gold Rush emigrants took this fork.',
      easterEggs: ['An old signpost reads "Road to California" in faded paint'],
    },
    services: [],
    dangerLevel: 'normal',
    connectedTo: ['fort_bridger', 'city_of_rocks'],
    travelTime: 5,
    description: 'The parting of ways. Here the California Trail splits from the Oregon route.',
  },
  {
    id: 'city_of_rocks',
    name: 'City of Rocks',
    x: 18, y: 28,
    type: 'landmark',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'Ancient granite spires 2.5 billion years old. Emigrants carved names and dates into the rock.',
      easterEggs: ['You find a name carved in 1849 - could it be a distant relative?'],
    },
    services: [],
    dangerLevel: 'safe',
    connectedTo: ['raft_river', 'humboldt_river'],
    travelTime: 6,
    description: 'Towering granite spires rise from the desert like a city of stone.',
  },
  {
    id: 'humboldt_river',
    name: 'Humboldt River',
    x: 15, y: 32,
    type: 'river',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'The most hated river on the trail. 350 miles of alkaline water that killed livestock. Yet it was the only water source across the Great Basin.',
      easterEggs: ['An emigrant diary warns: "Do NOT let the oxen drink freely"'],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['city_of_rocks', 'humboldt_sink'],
    travelTime: 8,
    description: 'The Humboldt - hated by all who follow it, yet impossible to leave.',
  },
  {
    id: 'humboldt_sink',
    name: 'Humboldt Sink',
    x: 12, y: 35,
    type: 'landmark',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'Where the Humboldt River vanishes into the desert sand. Emigrants abandoned wagons and belongings here to lighten loads for the desert crossing ahead.',
      easterEggs: ['Abandoned wagons contain useful salvage... and a mysterious journal'],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['humboldt_river', 'forty_mile_desert'],
    travelTime: 4,
    description: 'The river ends. It simply sinks into the earth and is gone.',
  },
  {
    id: 'forty_mile_desert',
    name: 'Forty Mile Desert',
    x: 10, y: 40,
    type: 'desert',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'The deadliest stretch of the California Trail. 40 miles with no water. Thousands of animal carcasses lined the route. Most emigrants crossed at night to avoid the heat.',
      easterEggs: ['Mirages dance on the horizon - or are those ghost wagons?'],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['humboldt_sink', 'truckee_pass'],
    travelTime: 12,
    description: 'Forty miles of hell. No water. No shade. Only the bones of those who came before.',
  },
  {
    id: 'truckee_pass',
    name: 'Truckee Pass',
    x: 8, y: 45,
    type: 'pass',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: 'N/A',
      peakPopulation: 0,
      historicalNote: 'Site of the Donner Party tragedy. In 1846-47, 87 emigrants were trapped by early snow. Only 48 survived the winter.',
      easterEggs: ['A memorial plaque lists the names of the Donner Party'],
      notableEvents: ['Donner Party trapped here winter 1846-47'],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['forty_mile_desert', 'sacramento_valley'],
    travelTime: 10,
    description: 'The final barrier. Snow can come early here, as the Donner Party learned.',
  },
  {
    id: 'sacramento_valley',
    name: 'Sacramento Valley',
    x: 6, y: 55,
    type: 'landmark',
    chapter: 'journey_west',
    discovered: false,
    lore: {
      founded: '1839',
      peakPopulation: 0,
      historicalNote: 'Sutter\'s Fort stands here. Gold was discovered nearby in 1848.',
      easterEggs: ['Sutter himself laments how gold destroyed his empire'],
    },
    services: ['inn', 'shop', 'stable', 'telegraph'],
    dangerLevel: 'safe',
    connectedTo: ['truckee_pass', 'west_point'],
    travelTime: 6,
    description: 'The gateway to Gold Country. Your real adventure begins.',
  },
]

// ============================================
// CHAPTER 2: GOLD COUNTRY (Sierra Foothills)
// Open exploration of mining towns
// ============================================

export const GOLD_COUNTRY_LOCATIONS: MapLocation[] = [
  {
    id: 'west_point',
    name: 'West Point',
    x: 50, y: 30,
    type: 'town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1852',
      peakPopulation: 2000,
      currentPopulation: 500,
      historicalNote: 'Named by Kit Carson during his 1844 exploration. A key crossroads of mining trails.',
      easterEggs: [
        "Cynthia's Inn serves a secret menu item: 'The Pinkerton Special'",
        'The old livery stable has a hidden cellar',
        'Kit Carson carved his initials on the signpost',
      ],
      famousResidents: ['Kit Carson (briefly)'],
      notableEvents: ['1852: Town established as supply point', '1854: Stage route established'],
    },
    services: ['inn', 'shop', 'telegraph', 'saloon', 'stable', 'blacksmith'],
    dangerLevel: 'safe',
    connectedTo: ['sacramento_valley', 'mokelumne_hill', 'sandy_gulch'],
    travelTime: 4,
    description: 'A crossroads town where miners meet to trade stories and supplies.',
    special: 'cynthias_inn',
    icon: '🏔️',
  },
  {
    id: 'mokelumne_hill',
    name: 'Mokelumne Hill',
    x: 40, y: 45,
    type: 'town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 15000,
      currentPopulation: 800,
      historicalNote: 'The "murder capital of the Gold Rush" - a man was killed here every weekend for 17 weeks.',
      easterEggs: [
        'Hotel Leger is haunted - visit at midnight',
        'The French cemetery holds secrets',
        'Chinese miners built tunnels beneath Main Street',
        'The gallows tree still stands behind the courthouse',
      ],
      famousResidents: ['Joaquin Murrieta (rumored)'],
      notableEvents: [
        '1851: Chilean War - conflict between American and Chilean miners',
        '1852: French miners expelled',
        '1855: Great Fire destroys half the town',
      ],
    },
    services: ['inn', 'shop', 'saloon', 'church', 'doctor'],
    dangerLevel: 'dangerous',
    connectedTo: ['west_point', 'san_andreas', 'jackson'],
    travelTime: 3,
    description: 'Once the third-largest city in California. Now a shadow of its violent past.',
    icon: '💀',
  },
  {
    id: 'san_andreas',
    name: 'San Andreas',
    x: 35, y: 55,
    type: 'town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 5000,
      currentPopulation: 2500,
      historicalNote: 'Black Bart was captured here in 1883, identified by a laundry mark on his handkerchief.',
      easterEggs: [
        'The courthouse has Black Bart\'s trial records',
        'A laundry mark leads to Ferguson\'s Tobacco Shop in SF',
        'The jail cell where Bart was held is preserved',
        "Check the Wells Fargo office for 'wanted' posters",
      ],
      famousResidents: ['Charles Boles (Black Bart) - briefly'],
      notableEvents: [
        '1883: Black Bart arrested by Sheriff Ben Thorn',
        '1848: Mexican miners establish camp',
      ],
    },
    services: ['inn', 'shop', 'telegraph', 'assay', 'stable', 'church', 'doctor'],
    dangerLevel: 'normal',
    connectedTo: ['mokelumne_hill', 'angels_camp', 'jackson'],
    travelTime: 2,
    description: 'County seat where justice was served to the infamous Black Bart.',
    special: 'black_bart_capture',
    icon: '⚖️',
  },
  {
    id: 'jackson',
    name: 'Jackson',
    x: 45, y: 60,
    type: 'town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 8000,
      currentPopulation: 4500,
      historicalNote: 'Home to the Kennedy Mine - the deepest gold mine in North America at 5,912 feet.',
      easterEggs: [
        'The mine elevator descends a mile underground',
        'Miners report strange sounds from the deepest levels',
        'The tailing wheels are the largest in the world',
        'A miner\'s journal speaks of finding "something other than gold"',
      ],
      notableEvents: [
        '1922: Kennedy Mine disaster - 47 miners killed by fire',
        '1942: Mine closed by WWII order',
      ],
    },
    services: ['inn', 'shop', 'telegraph', 'mine', 'saloon', 'stable', 'blacksmith', 'doctor'],
    dangerLevel: 'normal',
    connectedTo: ['san_andreas', 'mokelumne_hill', 'volcano'],
    travelTime: 2,
    description: 'A working mining town with the deepest shaft in North America.',
    icon: '⛏️',
  },
  {
    id: 'angels_camp',
    name: 'Angels Camp',
    x: 25, y: 50,
    type: 'town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 4500,
      currentPopulation: 3800,
      historicalNote: 'Where Mark Twain heard the story that became "The Celebrated Jumping Frog of Calaveras County."',
      easterEggs: [
        'Ross\'s Saloon is where Twain heard the frog story',
        'A bartender named Ben Coon still tells the tale',
        'The Angels Hotel register has Twain\'s signature',
        'Carson Hill nearby yielded the largest gold nugget in California (195 lbs)',
      ],
      famousResidents: ['Mark Twain (briefly, 1864-1865)'],
      notableEvents: [
        '1865: Twain writes "The Jumping Frog"',
        '1854: Carson Hill nugget discovered',
      ],
    },
    services: ['inn', 'shop', 'saloon', 'stable', 'church'],
    dangerLevel: 'safe',
    connectedTo: ['san_andreas', 'big_trees', 'carson_hill'],
    travelTime: 2,
    description: 'Literary history meets Gold Rush legend in this charming town.',
    special: 'mark_twain',
    icon: '🐸',
  },
  {
    id: 'volcano',
    name: 'Volcano',
    x: 55, y: 40,
    type: 'ghost_town',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 17000,
      currentPopulation: 85,
      historicalNote: 'Named for its bowl-shaped valley (not an actual volcano). Once rivaled San Francisco in size.',
      easterEggs: [
        'St. George Hotel is haunted by a Civil War soldier',
        'California\'s first astronomical observatory (1860) ruins remain',
        '"Old Abe" - a Civil War cannon hidden by Union sympathizers',
        'The Cobblestone Theatre (1856) still operates',
        'Tunnels beneath Main Street connect to Chinese quarters',
      ],
      notableEvents: [
        '1860: First astronomical observatory in California',
        '1863: "Old Abe" cannon arrives',
        '1866: Great Fire destroys most buildings',
      ],
    },
    services: ['saloon'],
    dangerLevel: 'dangerous',
    connectedTo: ['jackson', 'west_point', 'indian_grinding_rock'],
    travelTime: 3,
    description: 'A dying town where 17,000 souls once sought fortune. Now, ghosts outnumber the living.',
    icon: '👻',
  },
  // SECRET/UNLOCKABLE LOCATIONS
  {
    id: 'sandy_gulch',
    name: 'Sandy Gulch Mine',
    x: 58, y: 25,
    type: 'mine',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1849',
      peakPopulation: 200,
      currentPopulation: 0,
      historicalNote: 'An abandoned mine with rumors of a hidden vein. Many have entered, few returned.',
      easterEggs: [
        'A map hidden in West Point shows the safe path',
        'The mine connects to natural caves',
        'Strange symbols on the walls predate the Gold Rush',
      ],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['west_point'],
    travelTime: 5,
    description: 'An abandoned mine. Local miners refuse to speak of what happened here.',
    icon: '🕳️',
  },
  {
    id: 'carson_hill',
    name: 'Carson Hill',
    x: 20, y: 55,
    type: 'mine',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1848',
      peakPopulation: 3000,
      currentPopulation: 50,
      historicalNote: 'Site of the largest gold nugget ever found in California - 195 pounds!',
      easterEggs: [
        'The exact spot is marked by a stone',
        'Old-timers claim there\'s a larger nugget still hidden',
        'James Marshall (Sutter\'s Mill discoverer) worked here briefly',
      ],
      notableEvents: ['1854: 195-lb nugget discovered'],
    },
    services: ['saloon'],
    dangerLevel: 'normal',
    connectedTo: ['angels_camp'],
    travelTime: 2,
    description: 'Where California\'s largest gold nugget was found. Could there be more?',
    icon: '💎',
  },
  {
    id: 'chinese_tunnels',
    name: 'Chinese Tunnels',
    x: 42, y: 42,
    type: 'landmark',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1850',
      peakPopulation: 0,
      historicalNote: 'Secret tunnel network built by Chinese miners to avoid the Foreign Miners Tax.',
      easterEggs: [
        'Entry hidden in Mokelumne Hill\'s Chinatown ruins',
        'Tunnels contain preserved artifacts',
        'A hidden shrine holds clues about Black Bart\'s routes',
      ],
    },
    services: [],
    dangerLevel: 'dangerous',
    connectedTo: ['mokelumne_hill', 'volcano'],
    travelTime: 4,
    description: 'A secret world beneath the streets. Few outsiders know of its existence.',
    icon: '🕯️',
  },
  {
    id: 'indian_grinding_rock',
    name: 'Indian Grinding Rock',
    x: 60, y: 35,
    type: 'landmark',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: 'Ancient',
      peakPopulation: 0,
      historicalNote: 'Sacred Miwok site with 1,185 mortar cups - the largest collection in North America.',
      easterEggs: [
        'The patterns contain a map of the region',
        'Offerings to the old spirits may bring luck',
        'Local Miwok elders share stories of the "ghost prospector"',
      ],
    },
    services: [],
    dangerLevel: 'safe',
    connectedTo: ['volcano'],
    travelTime: 2,
    description: 'A sacred place where the Miwok people gathered for thousands of years.',
    icon: '🪨',
  },
  {
    id: 'big_trees',
    name: 'Calaveras Big Trees',
    x: 15, y: 45,
    type: 'landmark',
    chapter: 'gold_country',
    discovered: false,
    lore: {
      founded: '1852',
      peakPopulation: 0,
      historicalNote: 'The first grove of Giant Sequoias discovered. The "Discovery Tree" was sadly cut down.',
      easterEggs: [
        'Mark Twain visited and wrote about these trees',
        'A hollow sequoia can hide a person... or their loot',
        'The oldest trees have seen 2,000 years of history',
      ],
      notableEvents: ['1852: A.T. Dowd discovers the grove', '1853: Discovery Tree felled'],
    },
    services: [],
    dangerLevel: 'safe',
    connectedTo: ['angels_camp'],
    travelTime: 4,
    description: 'Giants that were old when Rome was young. A reminder of nature\'s majesty.',
    icon: '🌲',
  },
]

// ============================================
// RANDOM ENCOUNTER ZONES
// ============================================

export const ENCOUNTER_ZONES: RandomEncounterZone[] = [
  {
    id: 'bandit_pass',
    name: 'Funk Hill',
    x: 45, y: 35,
    radius: 8,
    encounterTypes: ['bandit_ambush', 'stagecoach_robbery', 'traveler_rescue'],
    dangerLevel: 'dangerous',
    description: 'Black Bart\'s favorite ambush spot. The stage route passes through here.',
  },
  {
    id: 'grizzly_flats',
    name: 'Grizzly Flats',
    x: 30, y: 40,
    radius: 10,
    encounterTypes: ['bear_attack', 'lost_miner', 'gold_discovery'],
    dangerLevel: 'dangerous',
    description: 'Named for the California Grizzlies that once roamed here.',
  },
  {
    id: 'prospectors_creek',
    name: 'Prospector\'s Creek',
    x: 35, y: 30,
    radius: 6,
    encounterTypes: ['gold_panning', 'claim_dispute', 'friendly_prospector'],
    dangerLevel: 'normal',
    description: 'A popular panning spot where fortunes have been made and lost.',
  },
  {
    id: 'highway_49',
    name: 'Highway 49 Route',
    x: 40, y: 50,
    radius: 5,
    encounterTypes: ['stagecoach', 'merchant_caravan', 'fellow_traveler'],
    dangerLevel: 'normal',
    description: 'The main route connecting Gold Country towns.',
  },
  {
    id: 'miwok_territory',
    name: 'Miwok Territory',
    x: 55, y: 38,
    radius: 7,
    encounterTypes: ['native_guide', 'sacred_site', 'trading_party'],
    dangerLevel: 'safe',
    description: 'The ancestral lands of the Miwok people.',
  },
]

// ============================================
// CHAPTER DEFINITIONS
// ============================================

export const CHAPTERS: ChapterData[] = [
  {
    id: 'journey_west',
    name: 'Chapter 1: Journey West',
    description: 'Travel 2,000 miles from Independence, Missouri to Sacramento Valley, following the historic emigrant trails.',
    unlockRequirement: 'Start of game',
    mapBounds: { x1: 0, y1: 0, x2: 100, y2: 100 },
    locations: CHAPTER_1_WAYPOINTS.map(l => l.id),
  },
  {
    id: 'gold_country',
    name: 'Chapter 2: Gold Country',
    description: 'Explore the Sierra Foothills mining towns in search of Black Bart and untold riches.',
    unlockRequirement: 'Complete Chapter 1 (reach Sacramento Valley)',
    mapBounds: { x1: 10, y1: 20, x2: 70, y2: 70 },
    locations: GOLD_COUNTRY_LOCATIONS.map(l => l.id),
  },
  {
    id: 'return_visit',
    name: 'Chapter 3: The Long Road Home',
    description: 'Return to any discovered location. Towns have evolved based on your previous choices.',
    unlockRequirement: 'Complete Chapter 2 (capture or confront Black Bart)',
    mapBounds: { x1: 0, y1: 0, x2: 100, y2: 100 },
    locations: [...CHAPTER_1_WAYPOINTS.map(l => l.id), ...GOLD_COUNTRY_LOCATIONS.map(l => l.id)],
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAllLocations(): MapLocation[] {
  return [...CHAPTER_1_WAYPOINTS, ...GOLD_COUNTRY_LOCATIONS]
}

export function getLocationById(id: string): MapLocation | undefined {
  return getAllLocations().find(l => l.id === id)
}

export function getLocationsForChapter(chapter: ChapterType): MapLocation[] {
  return getAllLocations().filter(l => l.chapter === chapter)
}

export function getConnectedLocations(locationId: string): MapLocation[] {
  const location = getLocationById(locationId)
  if (!location) return []
  return location.connectedTo
    .map(id => getLocationById(id))
    .filter((l): l is MapLocation => l !== undefined)
}

export function calculateTravelTime(fromId: string, toId: string): number {
  const from = getLocationById(fromId)
  const to = getLocationById(toId)
  if (!from || !to) return -1

  // Check if directly connected
  if (from.connectedTo.includes(toId)) {
    return to.travelTime
  }

  return -1 // Not directly connected
}

export function getEncounterZoneAtPosition(x: number, y: number): RandomEncounterZone | null {
  for (const zone of ENCOUNTER_ZONES) {
    const distance = Math.sqrt(Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2))
    if (distance <= zone.radius) {
      return zone
    }
  }
  return null
}

export function getDiscoverableLocations(currentId: string, discovered: Set<string>): MapLocation[] {
  const current = getLocationById(currentId)
  if (!current) return []

  return current.connectedTo
    .map(id => getLocationById(id))
    .filter((l): l is MapLocation => l !== undefined && !discovered.has(l.id))
}
