import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'

export interface DiscoveryClue {
  id: string
  question: string
  answer: string  // The correct answer (case-insensitive match)
  acceptableAnswers: string[]  // Alternative acceptable answers
  hintText: string  // Shown as the hint
  hintUrl?: string  // URL to find the answer (Airbnb listing for some)
  isListingClue: boolean  // True if answer is on the Airbnb listing
  xpReward: number
  karmaReward: { lawful: number, good: number }  // Negative = chaotic/evil
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ChapterLocation {
  id: string
  name: string
  description: string
  chapter: number
  x: number // SVG position (0-100)
  y: number
  icon: string
  atmosphere: string
  connectedTo: string[]
  travelDanger: 'safe' | 'moderate' | 'dangerous'
  services: LocationService[]
  npcs: LocationNPC[]
  clueIds?: string[] // Mystery clue IDs available here
  requiredReputation?: { faction: FactionId; level: number } // Gate by reputation
  discoveredByDefault?: boolean
  historicalFact?: string
  discoveryClues?: DiscoveryClue[]
}

export interface LocationService {
  type: 'shop' | 'inn' | 'blacksmith' | 'saloon' | 'church' | 'sheriff' | 'stable'
  name: string
  description: string
}

export interface LocationNPC {
  id: string
  name: string
  role: string
  witnessType: 'bartender' | 'sheriff' | 'settler' | 'miner' | 'native' | 'outlaw' | 'merchant' | 'doctor' | 'preacher'
  faction?: FactionId
  dialogueHint: string
  skillCheckStat?: StatName
  skillCheckDC?: number
}

export interface TravelEncounter {
  id: string
  name: string
  description: string
  chance: number // 0-1 probability
  stat: StatName
  difficulty: number
  successText: string
  failureText: string
  karmaReward?: number
  xpReward: number
}

// ============================================
// CHAPTER 1: THE JOURNEY WEST (Missouri → Kansas → Nebraska)
// ============================================

export const CHAPTER_1_LOCATIONS: ChapterLocation[] = [
  {
    id: 'ch1_independence',
    name: 'Independence, Missouri',
    description: 'The jumping-off point for the West. Wagon trains form here every spring.',
    chapter: 1,
    x: 15, y: 40,
    icon: '\uD83C\uDFD8\uFE0F',
    atmosphere: 'bustling',
    connectedTo: ['ch1_alcove_spring', 'ch1_blue_river'],
    travelDanger: 'safe',
    discoveredByDefault: true,
    services: [
      { type: 'shop', name: 'Outfitter\'s General Store', description: 'Trail supplies at town prices' },
      { type: 'stable', name: 'Barlow\'s Livery', description: 'Horses, mules, and oxen for sale' },
      { type: 'inn', name: 'Noland House', description: 'Last comfortable bed for 2,000 miles' },
    ],
    npcs: [
      { id: 'ch1_wagonmaster', name: 'Captain Josiah Shaw', role: 'Wagon Master', witnessType: 'settler', dialogueHint: 'Knows the trail. Shares wisdom for respect.', skillCheckStat: 'Diplomacy', skillCheckDC: 8 },
      { id: 'ch1_merchant', name: 'Ezra Finch', role: 'Supply Merchant', witnessType: 'merchant', faction: 'settlers', dialogueHint: 'Sells supplies. Overcharges the naive.' },
      { id: 'ch1_mysterious', name: 'The Hooded Figure', role: 'Stranger', witnessType: 'outlaw', dialogueHint: 'Watching the wagon trains. Knows more than he says.', skillCheckStat: 'Shrewdness', skillCheckDC: 12 },
    ],
    historicalFact: 'Independence was the primary starting point for the Oregon, California, and Santa Fe trails.',
    discoveryClues: [
      {
        id: 'ch1_ind_trail',
        question: 'What trail did most settlers take from Missouri to California?',
        answer: 'California Trail',
        acceptableAnswers: ['California Trail', 'Oregon Trail', 'California', 'Oregon'],
        hintText: 'The trail started in Independence and led to the goldfields.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'easy',
      },
      {
        id: 'ch1_ind_bedrooms',
        question: 'How many bedrooms does Pryor\'s Back of Beyond Ranch have waiting in California?',
        answer: '6',
        acceptableAnswers: ['6', 'six'],
        hintText: 'Check the Airbnb listing for Pryor\'s Back of Beyond Ranch to see the accommodations.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch1_ind_guests',
        question: 'How many guests can shelter at Pryor\'s Back of Beyond Ranch?',
        answer: '12',
        acceptableAnswers: ['12', 'twelve'],
        hintText: 'The ranch listing shows the maximum capacity for weary travelers.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'ch1_alcove_spring',
    name: 'Alcove Spring',
    description: 'A natural spring with a waterfall. The Donner Party camped here in 1846.',
    chapter: 1,
    x: 35, y: 30,
    icon: '\uD83D\uDCA7',
    atmosphere: 'peaceful',
    connectedTo: ['ch1_independence', 'ch1_blue_river', 'ch1_fort_kearny'],
    travelDanger: 'safe',
    services: [],
    npcs: [
      { id: 'ch1_hermit', name: 'Old Tom', role: 'Hermit', witnessType: 'settler', dialogueHint: 'Lives alone at the spring. Knows old stories.' },
    ],
    historicalFact: 'The name "Alcove Spring" was carved into a rock face by members of the Donner Party.',
    discoveryClues: [
      {
        id: 'ch1_alcove_donner',
        question: 'What ill-fated wagon party camped at Alcove Spring in 1846?',
        answer: 'Donner Party',
        acceptableAnswers: ['Donner Party', 'Donner', 'The Donner Party'],
        hintText: 'A tragic group that carved their name into the rocks here before disaster struck.',
        isListingClue: false,
        xpReward: 10,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
      {
        id: 'ch1_alcove_hottub',
        question: 'What outdoor luxury feature awaits at Pryor\'s Back of Beyond Ranch that a trail-weary pioneer would dream of?',
        answer: 'hot tub',
        acceptableAnswers: ['hot tub', 'hottub', 'spa', 'hot tub spa'],
        hintText: 'Check the Airbnb listing for a relaxing amenity perfect after a long journey.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'ch1_blue_river',
    name: 'Blue River Crossing',
    description: 'A treacherous river crossing. Many wagons have been lost here.',
    chapter: 1,
    x: 30, y: 55,
    icon: '\uD83C\uDF0A',
    atmosphere: 'dangerous',
    connectedTo: ['ch1_independence', 'ch1_alcove_spring', 'ch1_fort_kearny'],
    travelDanger: 'moderate',
    services: [
      { type: 'shop', name: 'Ferry Operator', description: 'Pay to cross safely, or risk the ford' },
    ],
    npcs: [
      { id: 'ch1_ferryman', name: 'Dutch Bill', role: 'Ferry Operator', witnessType: 'settler', dialogueHint: 'Charges too much. But the alternative is worse.', skillCheckStat: 'Diplomacy', skillCheckDC: 10 },
    ],
    discoveryClues: [
      {
        id: 'ch1_blue_goldrush',
        question: 'What year did the California Gold Rush begin?',
        answer: '1848',
        acceptableAnswers: ['1848'],
        hintText: 'The year gold was discovered at Sutter\'s Mill, starting the rush west.',
        isListingClue: false,
        xpReward: 10,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
      {
        id: 'ch1_blue_animals',
        question: 'What animals live at Pryor\'s Back of Beyond Ranch property? (Name one)',
        answer: 'horses',
        acceptableAnswers: ['horses', 'chickens', 'goats', 'horse', 'chicken', 'goat'],
        hintText: 'The Airbnb listing mentions several farm animals that call the ranch home.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch1_blue_ford',
        question: 'What dangerous river crossing method did pioneers use when they couldn\'t afford the ferry?',
        answer: 'ford',
        acceptableAnswers: ['ford', 'fording', 'wade', 'wading'],
        hintText: 'Dutch Bill charges too much - some risked crossing the river on foot instead.',
        isListingClue: false,
        xpReward: 15,
        karmaReward: { lawful: -1, good: 0 },
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'ch1_fort_kearny',
    name: 'Fort Kearny',
    description: 'A military outpost on the Platte River. Law and order, such as it is.',
    chapter: 1,
    x: 55, y: 35,
    icon: '\uD83C\uDFF0',
    atmosphere: 'orderly',
    connectedTo: ['ch1_alcove_spring', 'ch1_blue_river', 'ch1_platte_bridge'],
    travelDanger: 'safe',
    services: [
      { type: 'shop', name: 'Sutler\'s Store', description: 'Military surplus at fair prices' },
      { type: 'blacksmith', name: 'Army Forge', description: 'Wagon and tool repair' },
      { type: 'sheriff', name: 'Commander\'s Office', description: 'Report crimes, issue warrants' },
    ],
    npcs: [
      { id: 'ch1_commander', name: 'Lt. Grattan', role: 'Post Commander', witnessType: 'sheriff', faction: 'pinkerton', dialogueHint: 'Strict but fair. Respects authority.', skillCheckStat: 'Diplomacy', skillCheckDC: 10 },
      { id: 'ch1_scout', name: 'Running Deer', role: 'Army Scout', witnessType: 'native', faction: 'natives', dialogueHint: 'Caught between worlds. Knows the Pawnee trails.', skillCheckStat: 'Diplomacy', skillCheckDC: 12 },
    ],
    clueIds: ['ch1_case_stolen_goods'],
    discoveryClues: [
      {
        id: 'ch1_kearny_marshall',
        question: 'Who discovered gold at Sutter\'s Mill?',
        answer: 'James Marshall',
        acceptableAnswers: ['James Marshall', 'Marshall', 'James W. Marshall', 'James W Marshall'],
        hintText: 'The carpenter who found the first nugget in 1848.',
        isListingClue: false,
        xpReward: 15,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
      {
        id: 'ch1_kearny_platte',
        question: 'What river does Fort Kearny sit on?',
        answer: 'Platte River',
        acceptableAnswers: ['Platte River', 'Platte', 'The Platte'],
        hintText: 'Read the location description carefully - it names the river.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'ch1_platte_bridge',
    name: 'Platte River Bridge',
    description: 'The gateway west. Beyond this, civilization thins to nothing.',
    chapter: 1,
    x: 75, y: 45,
    icon: '\uD83C\uDF09',
    atmosphere: 'wild',
    connectedTo: ['ch1_fort_kearny', 'ch1_pawnee_camp'],
    travelDanger: 'moderate',
    services: [],
    npcs: [
      { id: 'ch1_toll_collector', name: 'Silas Crooke', role: 'Toll Collector', witnessType: 'outlaw', dialogueHint: 'Claims to own the bridge. Suspiciously wealthy.' },
    ],
    clueIds: ['ch1_case_stolen_goods'],
    discoveryClues: [
      {
        id: 'ch1_platte_civilization',
        question: 'Beyond Platte River Bridge, what becomes scarce according to the location description?',
        answer: 'civilization',
        acceptableAnswers: ['civilization', 'civilisation', 'towns', 'people', 'settlements'],
        hintText: 'The location description says "civilization thins to nothing."',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'easy',
      },
      {
        id: 'ch1_platte_view',
        question: 'What kind of view feature does Pryor\'s Back of Beyond Ranch property have?',
        answer: 'mountain view',
        acceptableAnswers: ['mountain view', 'mountain', 'mountains', 'mountain views', 'sierra view'],
        hintText: 'Check the Airbnb listing for the scenic views from the property.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'ch1_pawnee_camp',
    name: 'Pawnee Village',
    description: 'A Pawnee trading camp. They\'ve watched wagons roll past for years.',
    chapter: 1,
    x: 85, y: 60,
    icon: '\uD83C\uDFD5\uFE0F',
    atmosphere: 'ancient',
    connectedTo: ['ch1_platte_bridge'],
    travelDanger: 'moderate',
    requiredReputation: { faction: 'natives', level: -25 }, // Not hated
    services: [
      { type: 'shop', name: 'Trading Post', description: 'Unique items unavailable elsewhere' },
    ],
    npcs: [
      { id: 'ch1_chief', name: 'Chief Talking Bear', role: 'Village Elder', witnessType: 'native', faction: 'natives', dialogueHint: 'Wise and cautious. Judges by actions, not words.', skillCheckStat: 'Diplomacy', skillCheckDC: 12 },
      { id: 'ch1_trader', name: 'Marie Whitehawk', role: 'Trader', witnessType: 'native', faction: 'natives', dialogueHint: 'Half-French, half-Pawnee. Bridge between worlds.' },
    ],
    historicalFact: 'The Pawnee were one of the first tribes encountered by emigrants on the Oregon Trail.',
    discoveryClues: [
      {
        id: 'ch1_pawnee_heritage',
        question: 'What is Marie Whitehawk\'s heritage? (Two ancestries)',
        answer: 'French and Pawnee',
        acceptableAnswers: ['French and Pawnee', 'Pawnee and French', 'half-French half-Pawnee', 'French Pawnee', 'Pawnee French'],
        hintText: 'Read Marie Whitehawk\'s NPC description carefully.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch1_pawnee_acres',
        question: 'How many acres is Pryor\'s Back of Beyond Ranch?',
        answer: '60',
        acceptableAnswers: ['60', '60 acres', 'sixty', 'sixty acres'],
        hintText: 'Check the Airbnb listing for the ranch\'s acreage.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 15,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
    ],
  },
]

// ============================================
// CHAPTER 2: VOLCANO, CALIFORNIA
// ============================================

export const CHAPTER_2_LOCATIONS: ChapterLocation[] = [
  {
    id: 'ch2_volcano_main',
    name: 'Volcano, California',
    description: 'A Gold Rush boomtown clinging to the mountainside. Named for its volcanic origins.',
    chapter: 2,
    x: 50, y: 35,
    icon: '\uD83C\uDFD8\uFE0F',
    atmosphere: 'historic',
    connectedTo: ['ch2_st_george', 'ch2_masonic_lodge', 'ch2_cobblestone', 'ch2_miners_camp'],
    travelDanger: 'safe',
    discoveredByDefault: true,
    services: [
      { type: 'shop', name: 'General Store', description: 'Mining supplies and dry goods' },
      { type: 'saloon', name: 'The Nugget Saloon', description: 'Whiskey and rumors in equal measure' },
    ],
    npcs: [
      { id: 'ch2_barkeep', name: 'Big Mae Sullivan', role: 'Saloon Owner', witnessType: 'bartender', faction: 'settlers', dialogueHint: 'Hears everything. Tells nothing for free.' },
      { id: 'ch2_assayer', name: 'Professor Morley', role: 'Gold Assayer', witnessType: 'merchant', dialogueHint: 'Weighs gold and judges character.' },
    ],
    historicalFact: 'Volcano had the first lending library and astronomical observatory in California.',
    discoveryClues: [
      {
        id: 'ch2_volcano_library',
        question: 'What two cultural firsts did Volcano have in California?',
        answer: 'library and observatory',
        acceptableAnswers: ['library and observatory', 'observatory and library', 'lending library and observatory', 'library observatory'],
        hintText: 'Check the historical fact for this location.',
        isListingClue: false,
        xpReward: 10,
        karmaReward: { lawful: 1, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_volcano_town',
        question: 'What Gold Country town is Pryor\'s Back of Beyond Ranch near?',
        answer: 'West Point',
        acceptableAnswers: ['West Point', 'West Point California', 'West Point CA', 'Volcano', 'Volcano CA'],
        hintText: 'Check the Airbnb listing location for the nearest town.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_volcano_county',
        question: 'What county is Pryor\'s Back of Beyond Ranch in?',
        answer: 'Calaveras County',
        acceptableAnswers: ['Calaveras County', 'Calaveras', 'Calaveras Co'],
        hintText: 'Check the Airbnb listing for the county. West Point sits in this county named after skulls.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'ch2_st_george',
    name: 'St. George Hotel',
    description: 'The finest hotel in the Mother Lode. Also the most haunted, they say.',
    chapter: 2,
    x: 40, y: 25,
    icon: '\uD83C\uDFE8',
    atmosphere: 'mysterious',
    connectedTo: ['ch2_volcano_main'],
    travelDanger: 'safe',
    services: [
      { type: 'inn', name: 'St. George Hotel', description: 'Rest and recovery. Some rooms... occupied.' },
    ],
    npcs: [
      { id: 'ch2_hotel_owner', name: 'Mrs. Abigail Frost', role: 'Proprietress', witnessType: 'settler', dialogueHint: 'Knows every guest who\'s stayed. And some who never left.' },
    ],
    clueIds: ['ch2_case_missing_miner'],
    discoveryClues: [
      {
        id: 'ch2_stgeorge_haunted',
        question: 'What supernatural reputation does St. George Hotel have?',
        answer: 'haunted',
        acceptableAnswers: ['haunted', 'ghosts', 'haunted hotel', 'ghost hotel', 'most haunted'],
        hintText: 'The location description mentions spirits that remain.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 0, good: 0 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_stgeorge_wifi',
        question: 'What modern amenity does Pryor\'s Back of Beyond Ranch offer that 1850s hotels didn\'t have?',
        answer: 'wifi',
        acceptableAnswers: ['wifi', 'wi-fi', 'internet', 'wireless internet'],
        hintText: 'Check the Airbnb listing amenities for 21st century connectivity.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'ch2_masonic_lodge',
    name: 'Masonic Lodge',
    description: 'The stone lodge holds secrets older than the Gold Rush.',
    chapter: 2,
    x: 60, y: 20,
    icon: '\uD83C\uDFDB\uFE0F',
    atmosphere: 'secretive',
    connectedTo: ['ch2_volcano_main'],
    travelDanger: 'safe',
    requiredReputation: { faction: 'settlers', level: 0 },
    services: [],
    npcs: [
      { id: 'ch2_mason', name: 'Worshipful Master Crane', role: 'Lodge Master', witnessType: 'settler', faction: 'settlers', dialogueHint: 'Speaks in riddles. Guards the brotherhood\'s secrets.', skillCheckStat: 'Shrewdness', skillCheckDC: 12 },
    ],
    clueIds: ['ch2_case_missing_miner'],
    discoveryClues: [
      {
        id: 'ch2_mason_material',
        question: 'What material is the Masonic Lodge built from?',
        answer: 'stone',
        acceptableAnswers: ['stone', 'stones', 'rock', 'rocks'],
        hintText: 'The location description describes the building material.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_mason_parking',
        question: 'What modern convenience does Pryor\'s Back of Beyond Ranch offer for carriages (or cars)?',
        answer: 'parking',
        acceptableAnswers: ['parking', 'free parking', 'parking lot', 'car park'],
        hintText: 'Check the Airbnb listing amenities for vehicle storage.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_mason_reputation',
        question: 'What minimum reputation level with Settlers is needed to enter the Masonic Lodge?',
        answer: '0',
        acceptableAnswers: ['0', 'zero', 'neutral'],
        hintText: 'The Masonic Lodge welcomes all who arrive with no ill will.',
        isListingClue: false,
        xpReward: 10,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'ch2_cobblestone',
    name: 'Cobblestone Theatre',
    description: 'Performances every Saturday. The actors know more than they perform.',
    chapter: 2,
    x: 55, y: 50,
    icon: '\uD83C\uDFAD',
    atmosphere: 'charming',
    connectedTo: ['ch2_volcano_main', 'ch2_cemetery'],
    travelDanger: 'safe',
    services: [],
    npcs: [
      { id: 'ch2_actress', name: 'Lily Fontaine', role: 'Lead Actress', witnessType: 'settler', dialogueHint: 'Dramatic in all things. Observes everyone from the stage.', skillCheckStat: 'Diplomacy', skillCheckDC: 10 },
    ],
    discoveryClues: [
      {
        id: 'ch2_cobble_performances',
        question: 'What day of the week does the Cobblestone Theatre have performances?',
        answer: 'Saturday',
        acceptableAnswers: ['Saturday', 'Saturdays', 'Sat'],
        hintText: 'The location description mentions the performance schedule.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_cobble_kitchen',
        question: 'What cooking appliance does Pryor\'s Back of Beyond Ranch kitchen have that theatre boarding houses lacked?',
        answer: 'dishwasher',
        acceptableAnswers: ['dishwasher', 'dish washer', 'automatic dishwasher'],
        hintText: 'Check the Airbnb listing kitchen amenities for this modern convenience.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'ch2_miners_camp',
    name: 'Miner\'s Camp',
    description: 'Tents and sluice boxes line the creek. Gold fever runs hot here.',
    chapter: 2,
    x: 35, y: 60,
    icon: '\u26CF\uFE0F',
    atmosphere: 'rough',
    connectedTo: ['ch2_volcano_main', 'ch2_cemetery'],
    travelDanger: 'moderate',
    services: [
      { type: 'blacksmith', name: 'Hammer & Pick', description: 'Mining equipment and repairs' },
    ],
    npcs: [
      { id: 'ch2_foreman', name: 'Red Jack Mulligan', role: 'Mine Foreman', witnessType: 'miner', faction: 'settlers', dialogueHint: 'Tough but honest. His men respect him.' },
      { id: 'ch2_claim_jumper', name: 'Slim Perkins', role: 'Drifter', witnessType: 'outlaw', faction: 'outlaws', dialogueHint: 'Always looking for an easy score.', skillCheckStat: 'Shrewdness', skillCheckDC: 10 },
    ],
    clueIds: ['ch2_case_missing_miner'],
    discoveryClues: [
      {
        id: 'ch2_miners_sluice',
        question: 'What mining equipment lines the creek at the Miner\'s Camp?',
        answer: 'sluice boxes',
        acceptableAnswers: ['sluice boxes', 'sluice box', 'sluices', 'sluice'],
        hintText: 'The location description mentions the equipment used to separate gold from gravel.',
        isListingClue: false,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 0 },
        difficulty: 'medium',
      },
      {
        id: 'ch2_miners_fire',
        question: 'What outdoor gathering feature does Pryor\'s Back of Beyond Ranch have for telling stories?',
        answer: 'fire pit',
        acceptableAnswers: ['fire pit', 'firepit', 'campfire', 'fire ring', 'outdoor fireplace'],
        hintText: 'Check the Airbnb listing outdoor amenities for a place to gather around flames.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_miners_danger',
        question: 'What is the travel danger level of the Miner\'s Camp?',
        answer: 'moderate',
        acceptableAnswers: ['moderate', 'moderately dangerous'],
        hintText: 'Check the travelDanger field for this rough location.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 1, good: 0 },
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'ch2_cemetery',
    name: 'Pioneer Cemetery',
    description: 'Weathered headstones tell stories the living have forgotten.',
    chapter: 2,
    x: 70, y: 65,
    icon: '\u26B0\uFE0F',
    atmosphere: 'haunting',
    connectedTo: ['ch2_cobblestone', 'ch2_miners_camp'],
    travelDanger: 'safe',
    services: [],
    npcs: [
      { id: 'ch2_gravedigger', name: 'Silent Pete', role: 'Gravedigger', witnessType: 'settler', dialogueHint: 'Rarely speaks. When he does, listen carefully.' },
    ],
    clueIds: ['ch2_case_missing_miner'],
    discoveryClues: [
      {
        id: 'ch2_cemetery_stories',
        question: 'What do the weathered headstones tell according to the location description?',
        answer: 'stories',
        acceptableAnswers: ['stories', 'story', 'tales', 'forgotten stories'],
        hintText: 'Read the Pioneer Cemetery location description.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_cemetery_bathrooms',
        question: 'How many bathrooms does Pryor\'s Back of Beyond Ranch house have?',
        answer: '3',
        acceptableAnswers: ['3', 'three', '3 bathrooms'],
        hintText: 'Check the Airbnb listing for the number of bathrooms.',
        hintUrl: 'https://www.airbnb.com/rooms/30045739',
        isListingClue: true,
        xpReward: 10,
        karmaReward: { lawful: 0, good: 1 },
        difficulty: 'easy',
      },
      {
        id: 'ch2_cemetery_pete',
        question: 'What is unusual about Silent Pete the gravedigger?',
        answer: 'rarely speaks',
        acceptableAnswers: ['rarely speaks', 'silent', 'doesn\'t talk', 'doesn\'t speak', 'quiet'],
        hintText: 'His name and dialogue hint give you the answer.',
        isListingClue: false,
        xpReward: 5,
        karmaReward: { lawful: 0, good: 0 },
        difficulty: 'easy',
      },
    ],
  },
]

// ============================================
// CHAPTER 3: ANGELS CAMP & THE MOTHER LODE
// ============================================

export const CHAPTER_3_LOCATIONS: ChapterLocation[] = [
  {
    id: 'ch3_angels_camp',
    name: 'Angels Camp',
    description: 'Mark Twain made this town famous. The gold made it rich.',
    chapter: 3,
    x: 45, y: 30,
    icon: '\uD83C\uDFD8\uFE0F',
    atmosphere: 'charming',
    connectedTo: ['ch3_murphys', 'ch3_moaning_cavern', 'ch3_jumping_frog'],
    travelDanger: 'safe',
    discoveredByDefault: true,
    services: [
      { type: 'shop', name: 'Angels Hotel Store', description: 'The finest goods in Calaveras County' },
      { type: 'saloon', name: 'The Angels Saloon', description: 'Where Twain heard the frog story' },
      { type: 'inn', name: 'Angels Hotel', description: 'Comfortable rooms, colorful guests' },
    ],
    npcs: [
      { id: 'ch3_twain', name: 'Sam Clemens', role: 'Reporter', witnessType: 'settler', dialogueHint: 'A young journalist collecting stories. Sharp wit, sharper pen.', skillCheckStat: 'Shrewdness', skillCheckDC: 12 },
      { id: 'ch3_sheriff', name: 'Sheriff Thorn', role: 'County Sheriff', witnessType: 'sheriff', faction: 'pinkerton', dialogueHint: 'Overworked. Grateful for competent help.' },
    ],
    historicalFact: 'Mark Twain wrote "The Celebrated Jumping Frog of Calaveras County" based on a story heard at Angels Hotel in 1865.',
  },
  {
    id: 'ch3_murphys',
    name: 'Murphys',
    description: 'The "Queen of the Sierra." Wealthy miners built mansions here.',
    chapter: 3,
    x: 30, y: 45,
    icon: '\uD83C\uDFE0',
    atmosphere: 'elegant',
    connectedTo: ['ch3_angels_camp', 'ch3_big_trees', 'ch3_natural_bridges'],
    travelDanger: 'safe',
    services: [
      { type: 'shop', name: 'Murphys Trading Post', description: 'Upscale goods for discerning tastes' },
      { type: 'inn', name: 'Murphys Hotel', description: 'Slept in by presidents and bandits alike' },
    ],
    npcs: [
      { id: 'ch3_hotel_owner', name: 'James Sperry', role: 'Hotel Owner', witnessType: 'merchant', faction: 'settlers', dialogueHint: 'Knows everyone who matters. Social climber.' },
    ],
    historicalFact: 'Murphys Hotel guest register includes Ulysses S. Grant, Mark Twain, and Black Bart.',
  },
  {
    id: 'ch3_moaning_cavern',
    name: 'Moaning Cavern',
    description: 'A vast underground chamber. The wind makes it moan like a living thing.',
    chapter: 3,
    x: 60, y: 55,
    icon: '\uD83D\uDD73\uFE0F',
    atmosphere: 'mysterious',
    connectedTo: ['ch3_angels_camp', 'ch3_secret_mine'],
    travelDanger: 'moderate',
    services: [],
    npcs: [
      { id: 'ch3_cave_guide', name: 'Blind Jake', role: 'Cave Guide', witnessType: 'miner', dialogueHint: 'Lost his sight underground. Gained something else.', skillCheckStat: 'Expertise', skillCheckDC: 12 },
    ],
    clueIds: ['ch3_case_gold_theft'],
  },
  {
    id: 'ch3_big_trees',
    name: 'Calaveras Big Trees',
    description: 'Giant sequoias older than Rome. The natives consider them sacred.',
    chapter: 3,
    x: 20, y: 60,
    icon: '\uD83C\uDF32',
    atmosphere: 'majestic',
    connectedTo: ['ch3_murphys'],
    travelDanger: 'moderate',
    requiredReputation: { faction: 'natives', level: -25 },
    services: [],
    npcs: [
      { id: 'ch3_miwok_elder', name: 'Grandmother Willow', role: 'Miwok Elder', witnessType: 'native', faction: 'natives', dialogueHint: 'Keeper of old ways. Tests before she trusts.', skillCheckStat: 'Diplomacy', skillCheckDC: 12 },
    ],
    historicalFact: 'Augustus T. Dowd discovered the grove in 1852 while chasing a grizzly bear.',
  },
  {
    id: 'ch3_jumping_frog',
    name: 'Frog Jump Grounds',
    description: 'The annual frog jumping contest draws crowds from across the state.',
    chapter: 3,
    x: 55, y: 25,
    icon: '\uD83D\uDC38',
    atmosphere: 'festive',
    connectedTo: ['ch3_angels_camp'],
    travelDanger: 'safe',
    services: [],
    npcs: [
      { id: 'ch3_gambler', name: 'Smiley', role: 'Professional Gambler', witnessType: 'outlaw', faction: 'outlaws', dialogueHint: 'Will bet on anything. His frog is suspiciously talented.', skillCheckStat: 'Luck', skillCheckDC: 10 },
    ],
  },
  {
    id: 'ch3_natural_bridges',
    name: 'Natural Bridges',
    description: 'Limestone arches carved by centuries of flowing water.',
    chapter: 3,
    x: 25, y: 30,
    icon: '\uD83C\uDF09',
    atmosphere: 'wondrous',
    connectedTo: ['ch3_murphys'],
    travelDanger: 'safe',
    services: [],
    npcs: [],
    clueIds: ['ch3_case_gold_theft'],
  },
  {
    id: 'ch3_secret_mine',
    name: 'Hidden Gold Vein',
    description: 'A secret mine, known only to those who know where to look.',
    chapter: 3,
    x: 75, y: 70,
    icon: '\uD83D\uDC8E',
    atmosphere: 'mysterious',
    connectedTo: ['ch3_moaning_cavern'],
    travelDanger: 'dangerous',
    requiredReputation: { faction: 'outlaws', level: 25 }, // Need Outlaw connections
    services: [],
    npcs: [
      { id: 'ch3_bandit_boss', name: 'Joaquin Three-Fingers', role: 'Bandit Leader', witnessType: 'outlaw', faction: 'outlaws', dialogueHint: 'Dangerous. Respects strength and nerve.', skillCheckStat: 'Agility', skillCheckDC: 12 },
    ],
    clueIds: ['ch3_case_gold_theft'],
  },
]

// ============================================
// CHAPTER 4: BUILDING THE RANCH
// ============================================

export const CHAPTER_4_LOCATIONS: ChapterLocation[] = [
  {
    id: 'ch4_ranch_site',
    name: 'Back of Beyond - Ranch Site',
    description: 'Tobias\'s claim. 160 acres of wilderness that will become home.',
    chapter: 4,
    x: 50, y: 40,
    icon: '\uD83C\uDFE0',
    atmosphere: 'hopeful',
    connectedTo: ['ch4_lumber_mill', 'ch4_creek', 'ch4_neighbor', 'ch4_jackson'],
    travelDanger: 'safe',
    discoveredByDefault: true,
    services: [],
    npcs: [
      { id: 'ch4_foreman', name: 'Big Jim Harwell', role: 'Construction Foreman', witnessType: 'settler', faction: 'settlers', dialogueHint: 'Knows how to build anything. If you can pay.' },
    ],
    historicalFact: 'The Homestead Act of 1862 granted 160 acres to settlers who improved the land for 5 years.',
  },
  {
    id: 'ch4_lumber_mill',
    name: 'Henderson\'s Lumber Mill',
    description: 'The only source of milled lumber for fifty miles.',
    chapter: 4,
    x: 30, y: 25,
    icon: '\uD83E\uDEB5',
    atmosphere: 'industrial',
    connectedTo: ['ch4_ranch_site'],
    travelDanger: 'safe',
    services: [
      { type: 'shop', name: 'Henderson\'s Mill', description: 'Lumber, nails, and building supplies' },
    ],
    npcs: [
      { id: 'ch4_miller', name: 'Walt Henderson', role: 'Mill Owner', witnessType: 'merchant', faction: 'settlers', dialogueHint: 'Fair prices for friends. Expensive for strangers.' },
    ],
  },
  {
    id: 'ch4_creek',
    name: 'Bear Creek',
    description: 'A clear-water creek. Good for fishing, watering stock, and hiding secrets.',
    chapter: 4,
    x: 65, y: 55,
    icon: '\uD83C\uDFDE\uFE0F',
    atmosphere: 'peaceful',
    connectedTo: ['ch4_ranch_site', 'ch4_cave_system'],
    travelDanger: 'moderate',
    services: [],
    npcs: [],
    clueIds: ['ch4_case_land_fraud'],
  },
  {
    id: 'ch4_neighbor',
    name: 'McGraw Homestead',
    description: 'Your nearest neighbor, three miles east. They arrived last spring.',
    chapter: 4,
    x: 75, y: 35,
    icon: '\uD83C\uDF3E',
    atmosphere: 'rustic',
    connectedTo: ['ch4_ranch_site'],
    travelDanger: 'safe',
    services: [],
    npcs: [
      { id: 'ch4_neighbor_wife', name: 'Sarah McGraw', role: 'Homesteader', witnessType: 'settler', faction: 'settlers', dialogueHint: 'Tough frontier woman. Good ally, bad enemy.' },
      { id: 'ch4_neighbor_husband', name: 'Thomas McGraw', role: 'Farmer', witnessType: 'settler', faction: 'settlers', dialogueHint: 'Quiet man with a sharp eye for trouble.' },
    ],
  },
  {
    id: 'ch4_jackson',
    name: 'Jackson',
    description: 'County seat of Amador County. Law, commerce, and gossip.',
    chapter: 4,
    x: 25, y: 60,
    icon: '\uD83C\uDFDB\uFE0F',
    atmosphere: 'official',
    connectedTo: ['ch4_ranch_site'],
    travelDanger: 'safe',
    services: [
      { type: 'shop', name: 'Jackson General Store', description: 'Everything a rancher needs' },
      { type: 'sheriff', name: 'County Courthouse', description: 'Land disputes and warrants' },
      { type: 'inn', name: 'National Hotel', description: 'The oldest hotel in California' },
    ],
    npcs: [
      { id: 'ch4_judge', name: 'Judge Whitfield', role: 'County Judge', witnessType: 'sheriff', faction: 'pinkerton', dialogueHint: 'The law is the law. But justice has a price.', skillCheckStat: 'Diplomacy', skillCheckDC: 12 },
      { id: 'ch4_lawyer', name: 'Samuel Clemson', role: 'Land Lawyer', witnessType: 'merchant', dialogueHint: 'Handles land claims. Some say he handles them twice.' },
    ],
    clueIds: ['ch4_case_land_fraud'],
  },
  {
    id: 'ch4_cave_system',
    name: 'Hidden Cave System',
    description: 'Limestone caves beneath the ranch. Perfect for hiding... things.',
    chapter: 4,
    x: 80, y: 70,
    icon: '\uD83D\uDD73\uFE0F',
    atmosphere: 'mysterious',
    connectedTo: ['ch4_creek'],
    travelDanger: 'dangerous',
    services: [],
    npcs: [],
    clueIds: ['ch4_case_land_fraud'],
  },
]

// ============================================
// CHAPTER 5: THE TREASURE & LEGACY
// ============================================

export const CHAPTER_5_LOCATIONS: ChapterLocation[] = [
  {
    id: 'ch5_ranch_house',
    name: 'Pryor\'s Ranch House',
    description: 'The house Tobias built. Every board holds a memory. Some hold clues.',
    chapter: 5,
    x: 50, y: 35,
    icon: '\uD83C\uDFE0',
    atmosphere: 'nostalgic',
    connectedTo: ['ch5_barn', 'ch5_orchard', 'ch5_old_mine', 'ch5_lookout'],
    travelDanger: 'safe',
    discoveredByDefault: true,
    services: [],
    npcs: [
      { id: 'ch5_ghost_tobias', name: 'Tobias\'s Journal', role: 'Memory', witnessType: 'settler', dialogueHint: 'Pages from the past. The treasure map, in pieces.' },
    ],
  },
  {
    id: 'ch5_barn',
    name: 'The Old Barn',
    description: 'Built with Tobias\'s own hands. The foundation stone has an inscription.',
    chapter: 5,
    x: 35, y: 50,
    icon: '\uD83C\uDFDA\uFE0F',
    atmosphere: 'rustic',
    connectedTo: ['ch5_ranch_house'],
    travelDanger: 'safe',
    services: [
      { type: 'stable', name: 'Ranch Stable', description: 'Pegasus and the other horses' },
    ],
    npcs: [],
    clueIds: ['ch5_treasure_hunt'],
  },
  {
    id: 'ch5_orchard',
    name: 'The Apple Orchard',
    description: 'Tobias planted these trees in 1860. They still bear fruit.',
    chapter: 5,
    x: 65, y: 25,
    icon: '\uD83C\uDF4E',
    atmosphere: 'peaceful',
    connectedTo: ['ch5_ranch_house', 'ch5_lookout'],
    travelDanger: 'safe',
    services: [],
    npcs: [],
    clueIds: ['ch5_treasure_hunt'],
  },
  {
    id: 'ch5_old_mine',
    name: 'Tobias\'s Abandoned Mine',
    description: 'The mine that started it all. Played out decades ago. Or was it?',
    chapter: 5,
    x: 25, y: 65,
    icon: '\u26CF\uFE0F',
    atmosphere: 'dark',
    connectedTo: ['ch5_ranch_house', 'ch5_hidden_chamber'],
    travelDanger: 'dangerous',
    services: [],
    npcs: [],
    clueIds: ['ch5_treasure_hunt'],
  },
  {
    id: 'ch5_lookout',
    name: 'Eagle Point Lookout',
    description: 'The highest point on the ranch. You can see three counties from here.',
    chapter: 5,
    x: 75, y: 40,
    icon: '\uD83C\uDFD4\uFE0F',
    atmosphere: 'majestic',
    connectedTo: ['ch5_ranch_house', 'ch5_orchard'],
    travelDanger: 'moderate',
    services: [],
    npcs: [],
    clueIds: ['ch5_treasure_hunt'],
  },
  {
    id: 'ch5_hidden_chamber',
    name: 'The Hidden Chamber',
    description: 'Deep beneath the mine, a chamber Tobias never told anyone about.',
    chapter: 5,
    x: 40, y: 80,
    icon: '\uD83D\uDC8E',
    atmosphere: 'ancient',
    connectedTo: ['ch5_old_mine'],
    travelDanger: 'dangerous',
    requiredReputation: { faction: 'settlers', level: 25 }, // Need community trust
    services: [],
    npcs: [],
    clueIds: ['ch5_treasure_hunt'],
  },
]

// ============================================
// TRAVEL ENCOUNTERS (between locations)
// ============================================

export const TRAVEL_ENCOUNTERS: TravelEncounter[] = [
  {
    id: 'enc_rattlesnake',
    name: 'Rattlesnake!',
    description: 'A diamondback blocks your path, coiled and angry.',
    chance: 0.12,
    stat: 'Agility',
    difficulty: 10,
    successText: 'You sidestep the snake with practiced ease.',
    failureText: 'The snake strikes! You manage to avoid a fatal bite, but it slows you down.',
    xpReward: 10,
  },
  {
    id: 'enc_lost_traveler',
    name: 'Lost Traveler',
    description: 'A disoriented traveler stumbles toward you, delirious from thirst.',
    chance: 0.08,
    stat: 'Diplomacy',
    difficulty: 8,
    successText: 'You calm them down and share your water. They share information in return.',
    failureText: 'They\'re too far gone to help. You do what you can and move on.',
    karmaReward: 5,
    xpReward: 15,
  },
  {
    id: 'enc_bandits',
    name: 'Road Agents',
    description: 'Two masked men step out from behind the rocks. "Your money or your life."',
    chance: 0.10,
    stat: 'Agility',
    difficulty: 12,
    successText: 'You outrun them. They weren\'t expecting someone that fast.',
    failureText: 'They take some of your supplies. At least they left you alive.',
    xpReward: 20,
  },
  {
    id: 'enc_gold_nugget',
    name: 'Glint in the Creek',
    description: 'Something catches the light in the creek bed.',
    chance: 0.06,
    stat: 'Luck',
    difficulty: 12,
    successText: 'A gold nugget! Small, but real. Fortune smiles on you.',
    failureText: 'Just fool\'s gold. The creek laughs at your hopes.',
    karmaReward: 10,
    xpReward: 5,
  },
  {
    id: 'enc_bridge_out',
    name: 'Bridge Washed Out',
    description: 'Heavy rains took the bridge. You need to find another way across.',
    chance: 0.08,
    stat: 'Expertise',
    difficulty: 10,
    successText: 'You find a shallow ford upstream. Trail knowledge saves the day.',
    failureText: 'The detour adds hours to your journey.',
    xpReward: 15,
  },
  {
    id: 'enc_witness',
    name: 'Talkative Stranger',
    description: 'A fellow traveler shares the trail with you. They seem eager to talk.',
    chance: 0.08,
    stat: 'Shrewdness',
    difficulty: 8,
    successText: 'You pick up useful information about the area ahead.',
    failureText: 'They ramble on about nothing useful. You politely nod.',
    xpReward: 10,
  },
  {
    id: 'enc_storm',
    name: 'Sudden Storm',
    description: 'Black clouds roll in fast. Lightning strikes nearby.',
    chance: 0.07,
    stat: 'Durability',
    difficulty: 10,
    successText: 'You find shelter and ride it out. The storm passes quickly.',
    failureText: 'Soaked to the bone and shivering. You press on regardless.',
    xpReward: 10,
  },
  // ============================================
  // NEW ENCOUNTERS - Gold Country Historical
  // ============================================
  {
    id: 'enc_abandoned_wagon',
    name: 'Abandoned Wagon',
    description: 'A broken-down covered wagon sits by the trail. The owners are long gone, but supplies may remain.',
    chance: 0.07,
    stat: 'Expertise',
    difficulty: 9,
    successText: 'You salvage useful supplies — rope, hardtack, and a tin of matches.',
    failureText: 'The wagon is picked clean. Nothing but dust and splinters remain.',
    xpReward: 12,
  },
  {
    id: 'enc_grizzly',
    name: 'California Grizzly',
    description: 'A massive grizzly bear rises on its hind legs, blocking the trail ahead. Its breath steams in the mountain air.',
    chance: 0.06,
    stat: 'Durability',
    difficulty: 14,
    successText: 'You stand your ground and make yourself large. The bear decides you\'re not worth the trouble.',
    failureText: 'The bear swipes at you before lumbering off. Painful, but you\'ll survive.',
    xpReward: 25,
  },
  {
    id: 'enc_chinese_miners',
    name: 'Chinese Mining Camp',
    description: 'You come across a small camp of Chinese miners working a claim that others abandoned. They eye you cautiously.',
    chance: 0.07,
    stat: 'Diplomacy',
    difficulty: 10,
    successText: 'You share tea and exchange stories. They teach you a panning technique that could prove useful.',
    failureText: 'They remain wary and keep their distance. The distrust runs deep in Gold Country.',
    karmaReward: 3,
    xpReward: 15,
  },
  {
    id: 'enc_stagecoach',
    name: 'Stagecoach Robbery in Progress',
    description: 'Ahead on the road, a lone bandit holds up a Wells Fargo stagecoach. The driver has his hands up.',
    chance: 0.05,
    stat: 'Agility',
    difficulty: 13,
    successText: 'You intervene and the bandit flees! The grateful driver offers you a ride and a reward.',
    failureText: 'The bandit spots you and fires a warning shot. You duck behind cover as they escape with the strongbox.',
    karmaReward: 8,
    xpReward: 30,
  },
  {
    id: 'enc_prospector_ghost',
    name: 'The Ghostly Prospector',
    description: 'In the fog, you see the translucent figure of an old miner, pickaxe over his shoulder. He points deeper into the hills.',
    chance: 0.04,
    stat: 'Luck',
    difficulty: 11,
    successText: 'You follow the ghost\'s direction and find a hidden spring. The water is clear and sweet.',
    failureText: 'The figure vanishes. Was it real, or just mountain fog playing tricks on your eyes?',
    xpReward: 20,
  },
  {
    id: 'enc_miwok_trail',
    name: 'Ancient Trail Markers',
    description: 'You notice strange markings on the trees — Miwok trail blazes, ancient and nearly invisible.',
    chance: 0.07,
    stat: 'Expertise',
    difficulty: 11,
    successText: 'Following the markers reveals a shortcut. The native peoples knew these mountains intimately.',
    failureText: 'The markings are too weathered to follow. You continue on the main trail.',
    karmaReward: 2,
    xpReward: 15,
  },
  {
    id: 'enc_claim_dispute',
    name: 'Claim Dispute',
    description: 'Two miners are arguing loudly, pickaxes raised. One claims the other jumped his stake.',
    chance: 0.06,
    stat: 'Diplomacy',
    difficulty: 12,
    successText: 'Your calm words defuse the situation. Both miners agree to have the sheriff settle it properly.',
    failureText: 'The arguing intensifies. You back away as fists start flying. Not your problem — yet.',
    karmaReward: 4,
    xpReward: 15,
  },
  {
    id: 'enc_hydraulic_damage',
    name: 'Hydraulic Mining Scar',
    description: 'The hillside is torn apart — raw earth exposed for acres. A hydraulic monitor lies abandoned, its work of destruction done.',
    chance: 0.08,
    stat: 'Expertise',
    difficulty: 8,
    successText: 'Among the debris, you spot quartz veins exposed by the blasting. Worth remembering this location.',
    failureText: 'Nothing but mud and devastation. Progress has a heavy cost in Gold Country.',
    xpReward: 10,
  },
  {
    id: 'enc_frog_in_path',
    name: 'A Celebrated Frog',
    description: 'A large bull frog sits in the middle of the trail, watching you with apparent intelligence.',
    chance: 0.05,
    stat: 'Luck',
    difficulty: 8,
    successText: 'The frog leaps an impressive distance. You could swear it winked at you. Mark Twain would love this.',
    failureText: 'The frog hops away lazily. Nothing special about this one.',
    xpReward: 5,
  },
  {
    id: 'enc_wildfire_smoke',
    name: 'Distant Wildfire',
    description: 'Smoke billows from the next ridge. A wildfire is burning through the dry chaparral.',
    chance: 0.06,
    stat: 'Expertise',
    difficulty: 11,
    successText: 'You read the wind correctly and find a safe detour around the fire.',
    failureText: 'The smoke forces you back. You lose time backtracking to find a safe route.',
    xpReward: 15,
  },
  {
    id: 'enc_vigilance_patrol',
    name: 'Vigilance Committee',
    description: 'A group of armed men ride past. "Vigilance Committee business," their leader announces. They\'re looking for someone.',
    chance: 0.06,
    stat: 'Shrewdness',
    difficulty: 10,
    successText: 'You read the situation correctly and show your papers. They tip their hats and ride on.',
    failureText: 'They question you for a tense hour before finally deciding you\'re not who they\'re looking for.',
    xpReward: 12,
  },
  {
    id: 'enc_mercury_pool',
    name: 'Mercury Pool',
    description: 'Liquid mercury pools in the creek bed, left behind by amalgamation mining. The silver liquid is hypnotic.',
    chance: 0.05,
    stat: 'Expertise',
    difficulty: 9,
    successText: 'You know better than to touch it. Quicksilver poisoning killed many a miner. You mark the spot to warn others.',
    failureText: 'You didn\'t realize the danger. Your hands tingle after touching the water. Best wash them thoroughly.',
    karmaReward: 2,
    xpReward: 10,
  },
  {
    id: 'enc_black_bart_poem',
    name: 'A Poem on a Rock',
    description: 'Someone has left a handwritten poem on a flat rock by the trail. The penmanship is surprisingly elegant.',
    chance: 0.04,
    stat: 'Shrewdness',
    difficulty: 10,
    successText: 'You recognize the style — this reads like Black Bart\'s work. "I\'ve labored long and hard for bread, for honor and for riches..."',
    failureText: 'Nice poem, but you can\'t make out the rain-smudged signature at the bottom.',
    xpReward: 15,
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export const ALL_CHAPTER_LOCATIONS: Record<number, ChapterLocation[]> = {
  1: CHAPTER_1_LOCATIONS,
  2: CHAPTER_2_LOCATIONS,
  3: CHAPTER_3_LOCATIONS,
  4: CHAPTER_4_LOCATIONS,
  5: CHAPTER_5_LOCATIONS,
}

export function getChapterLocations(chapter: number): ChapterLocation[] {
  return ALL_CHAPTER_LOCATIONS[chapter] ?? []
}

export function getLocationById(id: string): ChapterLocation | undefined {
  for (const locations of Object.values(ALL_CHAPTER_LOCATIONS)) {
    const loc = locations.find(l => l.id === id)
    if (loc) return loc
  }
  return undefined
}

export function getConnectedLocations(locationId: string): ChapterLocation[] {
  const location = getLocationById(locationId)
  if (!location) return []
  return location.connectedTo
    .map(id => getLocationById(id))
    .filter(Boolean) as ChapterLocation[]
}

export function getDefaultLocation(chapter: number): ChapterLocation | undefined {
  const locations = getChapterLocations(chapter)
  return locations.find(l => l.discoveredByDefault) ?? locations[0]
}

export function rollTravelEncounter(): TravelEncounter | null {
  for (const enc of TRAVEL_ENCOUNTERS) {
    if (Math.random() < enc.chance) return enc
  }
  return null
}
