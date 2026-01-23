// Black Bart's Gang - 10 Notorious Outlaws
// Each with distinct traits for identification through witness clues

import type { CaseId } from './educationalClues'

export type HorseColor = 'black' | 'white' | 'pinto' | 'palomino' | 'chestnut'
export type HatStyle = 'stetson' | 'bowler' | 'sombrero' | 'derby' | 'none'
export type WeaponType = 'colt' | 'winchester' | 'knife' | 'dynamite' | 'derringer'
export type ViceType = 'whiskey' | 'cigars' | 'gambling' | 'poetry' | 'gold_teeth'
export type AccentType = 'southern' | 'eastern' | 'mexican' | 'irish' | 'german'
export type BuildType = 'tall' | 'short' | 'stocky' | 'lean' | 'average'
export type DistinguishingMark = 'scar_cheek' | 'missing_finger' | 'gold_tooth' | 'eye_patch' | 'limp' | 'tattoo' | 'none'

export interface OutlawTraits {
  horse: HorseColor
  hat: HatStyle
  weapon: WeaponType
  vice: ViceType
  accent: AccentType
  build: BuildType
  mark: DistinguishingMark
}

export interface Outlaw {
  id: string
  alias: string
  realName: string
  traits: OutlawTraits
  catchphrase: string
  bounty: number
  description: string
  backstory: string
  isLeader: boolean
  lastKnownLocation?: string
  preferredCrimes: CrimeType[]
}

export type CrimeType =
  | 'stagecoach_robbery'
  | 'bank_heist'
  | 'cattle_rustling'
  | 'train_robbery'
  | 'gold_theft'
  | 'horse_theft'
  | 'claim_jumping'
  | 'general_store_robbery'
  | 'kidnapping'
  | 'arson'

export const OUTLAWS: Outlaw[] = [
  {
    id: 'black_bart',
    alias: 'Black Bart',
    realName: 'Charles Earl Boles',
    traits: {
      horse: 'black',
      hat: 'bowler',
      weapon: 'derringer',
      vice: 'poetry',
      accent: 'eastern',
      build: 'tall',
      mark: 'none'
    },
    catchphrase: "I've labored long and hard for bread, for honor and for riches...",
    bounty: 500,
    description: 'The gentleman bandit. Never fires a shot, always leaves poetry at the scene.',
    backstory: 'A former Wells Fargo employee turned poet-robber. Impeccably dressed, unfailingly polite.',
    isLeader: true,
    preferredCrimes: ['stagecoach_robbery', 'gold_theft']
  },
  {
    id: 'sidewinder_sally',
    alias: 'Sidewinder Sally',
    realName: 'Sarah Jane McAllister',
    traits: {
      horse: 'pinto',
      hat: 'sombrero',
      weapon: 'dynamite',
      vice: 'poetry',
      accent: 'mexican',
      build: 'lean',
      mark: 'tattoo'
    },
    catchphrase: "The fuse is lit, and so am I.",
    bounty: 350,
    description: 'Explosives expert with a flair for dramatic entrances. Writes terrible haiku.',
    backstory: 'Learned demolition in the silver mines. Left after an "incident" with a foreman.',
    isLeader: false,
    preferredCrimes: ['bank_heist', 'train_robbery', 'arson']
  },
  {
    id: 'deadeye_dan',
    alias: 'Deadeye Dan',
    realName: 'Daniel "Danny" O\'Brien',
    traits: {
      horse: 'black',
      hat: 'stetson',
      weapon: 'winchester',
      vice: 'whiskey',
      accent: 'irish',
      build: 'stocky',
      mark: 'eye_patch'
    },
    catchphrase: "I only need one eye to put you down.",
    bounty: 400,
    description: 'Former Union sharpshooter. Lost an eye but none of his accuracy.',
    backstory: 'Decorated war hero turned outlaw after his pension was "lost in paperwork."',
    isLeader: false,
    preferredCrimes: ['stagecoach_robbery', 'train_robbery', 'cattle_rustling']
  },
  {
    id: 'the_professor',
    alias: 'The Professor',
    realName: 'Heinrich Wilhelm Strauss',
    traits: {
      horse: 'white',
      hat: 'bowler',
      weapon: 'knife',
      vice: 'cigars',
      accent: 'german',
      build: 'average',
      mark: 'gold_tooth'
    },
    catchphrase: "Crime is merely applied philosophy.",
    bounty: 300,
    description: 'Former university lecturer. Plans heists with mathematical precision.',
    backstory: 'Dismissed for "unorthodox teaching methods." His lectures on ethics are now... practical.',
    isLeader: false,
    preferredCrimes: ['bank_heist', 'gold_theft', 'claim_jumping']
  },
  {
    id: 'lucky_luke',
    alias: 'Lucky Luke',
    realName: 'Lucas "Lucky" Thornton',
    traits: {
      horse: 'palomino',
      hat: 'derby',
      weapon: 'colt',
      vice: 'gambling',
      accent: 'southern',
      build: 'lean',
      mark: 'missing_finger'
    },
    catchphrase: "Feelin\' lucky? I always am.",
    bounty: 275,
    description: 'Card shark and quick draw artist. Lost a finger to a sore loser.',
    backstory: 'Won his horse in a poker game. Won most things in poker games.',
    isLeader: false,
    preferredCrimes: ['general_store_robbery', 'horse_theft', 'stagecoach_robbery']
  },
  {
    id: 'iron_mae',
    alias: 'Iron Mae',
    realName: 'Margaret "Mae" Chen',
    traits: {
      horse: 'chestnut',
      hat: 'none',
      weapon: 'colt',
      vice: 'gold_teeth',
      accent: 'eastern',
      build: 'short',
      mark: 'scar_cheek'
    },
    catchphrase: "Gold in my teeth, iron in my heart.",
    bounty: 325,
    description: 'Railroad worker\'s daughter. Small but terrifying.',
    backstory: 'Watched her father die building the transcontinental. Now she takes back what\'s owed.',
    isLeader: false,
    preferredCrimes: ['train_robbery', 'gold_theft', 'kidnapping']
  },
  {
    id: 'whispering_will',
    alias: 'Whispering Will',
    realName: 'William Beauregard Montgomery III',
    traits: {
      horse: 'white',
      hat: 'stetson',
      weapon: 'derringer',
      vice: 'cigars',
      accent: 'southern',
      build: 'tall',
      mark: 'none'
    },
    catchphrase: "Shh... money talks, but I whisper.",
    bounty: 250,
    description: 'Speaks so softly you have to lean in. That\'s when he robs you.',
    backstory: 'Disgraced Southern aristocrat. Lost the plantation, kept the manners.',
    isLeader: false,
    preferredCrimes: ['stagecoach_robbery', 'general_store_robbery', 'cattle_rustling']
  },
  {
    id: 'coyote_kid',
    alias: 'The Coyote Kid',
    realName: 'Unknown',
    traits: {
      horse: 'pinto',
      hat: 'sombrero',
      weapon: 'knife',
      vice: 'whiskey',
      accent: 'mexican',
      build: 'short',
      mark: 'limp'
    },
    catchphrase: "The coyote always survives.",
    bounty: 200,
    description: 'Young, fast, and slippery. No one knows his real name.',
    backstory: 'Orphaned at the border. Raised by... well, no one actually knows.',
    isLeader: false,
    preferredCrimes: ['horse_theft', 'cattle_rustling', 'general_store_robbery']
  },
  {
    id: 'doc_mercury',
    alias: 'Doc Mercury',
    realName: 'Dr. Cornelius Blackwood',
    traits: {
      horse: 'palomino',
      hat: 'derby',
      weapon: 'dynamite',
      vice: 'gambling',
      accent: 'eastern',
      build: 'stocky',
      mark: 'missing_finger'
    },
    catchphrase: "The cure is always worse than the disease.",
    bounty: 375,
    description: 'Disbarred doctor. His "treatments" are explosive.',
    backstory: 'Lost his medical license after a mercury poisoning incident. Lost his finger to his own fuse.',
    isLeader: false,
    preferredCrimes: ['bank_heist', 'kidnapping', 'arson']
  },
  {
    id: 'rattlesnake_rosa',
    alias: 'Rattlesnake Rosa',
    realName: 'Rosa Maria Delgado',
    traits: {
      horse: 'chestnut',
      hat: 'none',
      weapon: 'winchester',
      vice: 'gold_teeth',
      accent: 'mexican',
      build: 'average',
      mark: 'tattoo'
    },
    catchphrase: "You hear the rattle? Too late.",
    bounty: 300,
    description: 'Sharpshooter and snake handler. The snakes are metaphorical. Mostly.',
    backstory: 'Daughter of a vaquero. Learned to shoot before she learned to walk.',
    isLeader: false,
    preferredCrimes: ['train_robbery', 'stagecoach_robbery', 'claim_jumping']
  }
]

// Helper function to get outlaw by ID
export function getOutlaw(id: string): Outlaw | undefined {
  return OUTLAWS.find(o => o.id === id)
}

// Helper function to get all outlaws except the leader
export function getGangMembers(): Outlaw[] {
  return OUTLAWS.filter(o => !o.isLeader)
}

// Helper function to find outlaws matching certain traits
export function findOutlawsByTraits(traits: Partial<OutlawTraits>): Outlaw[] {
  return OUTLAWS.filter(outlaw => {
    for (const [key, value] of Object.entries(traits)) {
      if (outlaw.traits[key as keyof OutlawTraits] !== value) {
        return false
      }
    }
    return true
  })
}

// Get random outlaw for a crime (weighted by preferred crimes)
export function getRandomOutlawForCrime(crimeType: CrimeType, excludeIds: string[] = []): Outlaw | null {
  const eligible = OUTLAWS.filter(o =>
    !excludeIds.includes(o.id) &&
    o.preferredCrimes.includes(crimeType)
  )

  if (eligible.length === 0) {
    // Fallback to any non-excluded outlaw
    const fallback = OUTLAWS.filter(o => !excludeIds.includes(o.id))
    return fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)] : null
  }

  return eligible[Math.floor(Math.random() * eligible.length)]
}

// Get all unique trait values for building warrant forms
export const TRAIT_OPTIONS = {
  horse: ['black', 'white', 'pinto', 'palomino', 'chestnut'] as HorseColor[],
  hat: ['stetson', 'bowler', 'sombrero', 'derby', 'none'] as HatStyle[],
  weapon: ['colt', 'winchester', 'knife', 'dynamite', 'derringer'] as WeaponType[],
  vice: ['whiskey', 'cigars', 'gambling', 'poetry', 'gold_teeth'] as ViceType[],
  accent: ['southern', 'eastern', 'mexican', 'irish', 'german'] as AccentType[],
  build: ['tall', 'short', 'stocky', 'lean', 'average'] as BuildType[],
  mark: ['scar_cheek', 'missing_finger', 'gold_tooth', 'eye_patch', 'limp', 'tattoo', 'none'] as DistinguishingMark[]
}

// Display names for traits
export const TRAIT_DISPLAY_NAMES: Record<keyof OutlawTraits, string> = {
  horse: 'Horse',
  hat: 'Hat',
  weapon: 'Weapon',
  vice: 'Vice',
  accent: 'Accent',
  build: 'Build',
  mark: 'Distinguishing Mark'
}

// Friendly names for trait values
export const TRAIT_VALUE_DISPLAY: Record<string, string> = {
  // Horses
  black: 'Black Horse',
  white: 'White Horse',
  pinto: 'Pinto',
  palomino: 'Palomino',
  chestnut: 'Chestnut',
  // Hats
  stetson: 'Stetson',
  bowler: 'Bowler Hat',
  sombrero: 'Sombrero',
  derby: 'Derby Hat',
  none: 'No Hat',
  // Weapons
  colt: 'Colt Revolver',
  winchester: 'Winchester Rifle',
  knife: 'Knife',
  dynamite: 'Dynamite',
  derringer: 'Derringer',
  // Vices
  whiskey: 'Whiskey Drinker',
  cigars: 'Cigar Smoker',
  gambling: 'Gambler',
  poetry: 'Poetry Lover',
  gold_teeth: 'Gold Teeth',
  // Accents
  southern: 'Southern Drawl',
  eastern: 'Eastern Accent',
  mexican: 'Mexican Accent',
  irish: 'Irish Brogue',
  german: 'German Accent',
  // Builds
  tall: 'Tall',
  short: 'Short',
  stocky: 'Stocky',
  lean: 'Lean',
  average: 'Average Build',
  // Marks
  scar_cheek: 'Scar on Cheek',
  missing_finger: 'Missing Finger',
  gold_tooth: 'Gold Tooth',
  eye_patch: 'Eye Patch',
  limp: 'Walks with Limp',
  tattoo: 'Visible Tattoo'
}

// ========================================================================
// GOLD COUNTRY SUSPECTS (Carmen Sandiego integration)
// These suspects are specific to the Gold Country mystery cases
// ========================================================================

export interface GoldCountrySuspectAppearance {
  age: string
  height: string
  build: string
  distinguishing: string
}

export interface GoldCountrySuspect {
  id: string
  name: string
  nickname: string
  description: string
  backstory: string
  appearance: GoldCountrySuspectAppearance
  personalityTraits: string[]
  weaknesses: string[]
  voiceLine: string
  guiltyCase: CaseId | null // null for red herrings
  // Mapped to Oregon Trail trait system for cross-system compatibility
  traits: OutlawTraits
}

export const GOLD_COUNTRY_SUSPECTS: GoldCountrySuspect[] = [
  // ========== GUILTY SUSPECTS ==========
  {
    id: 'slippery_pete',
    name: 'Slippery Pete McAllister',
    nickname: 'The Literary Bandit',
    description: 'A former English professor turned antiquarian who believes historic artifacts belong in his private collection, not public museums.',
    backstory: 'Pete lost his university position after being caught selling rare books from the library\'s collection. Now he roams Gold Country, \'liberating\' what he considers underappreciated treasures.',
    appearance: {
      age: '55',
      height: '5\'10"',
      build: 'Wiry',
      distinguishing: 'Wire-rimmed spectacles, tweed jacket even in summer'
    },
    personalityTraits: [
      'Quotes Mark Twain incessantly',
      'Always carries a leather satchel',
      'Has ink-stained fingers',
      'Speaks in elaborate metaphors'
    ],
    weaknesses: [
      'Can\'t resist showing off his knowledge',
      'Underestimates locals',
      'Afraid of heights'
    ],
    voiceLine: 'As Twain himself said, \'The secret of getting ahead is getting started.\' I simply... started with your trophy.',
    guiltyCase: 'jumping_frog',
    // Oregon Trail trait mapping
    traits: {
      horse: 'white',
      hat: 'bowler',
      weapon: 'derringer',
      vice: 'poetry',
      accent: 'eastern',
      build: 'lean',
      mark: 'none'
    }
  },
  {
    id: 'prospector_pat',
    name: 'Patricia \'Prospector Pat\' Donovan',
    nickname: 'The Golden Ghost',
    description: 'A fourth-generation gold miner who believes all Gold Rush artifacts rightfully belong to the descendants of the original prospectors - specifically, her family.',
    backstory: 'Pat\'s great-great-grandfather struck it rich in 1851 but was swindled out of his claim. She\'s spent her life trying to reclaim what she considers her birthright.',
    appearance: {
      age: '48',
      height: '5\'6"',
      build: 'Strong and weathered',
      distinguishing: 'Worn mining helmet, always has gold dust under her fingernails'
    },
    personalityTraits: [
      'Knows every abandoned mine shaft in the county',
      'Can identify gold content by weight alone',
      'Speaks with a slight Irish lilt',
      'Never seen without her pickaxe'
    ],
    weaknesses: [
      'Family grudge blinds her judgment',
      'Trusts mining equipment too much',
      'Claustrophobia in tight passages'
    ],
    voiceLine: 'My family pulled that gold from the earth. I\'m just taking back what\'s ours.',
    guiltyCase: 'gold_rush_heist',
    traits: {
      horse: 'chestnut',
      hat: 'none',
      weapon: 'dynamite',
      vice: 'whiskey',
      accent: 'irish',
      build: 'stocky',
      mark: 'scar_cheek'
    }
  },
  {
    id: 'cave_crawler_charlie',
    name: 'Charles \'Cave Crawler\' Blackwood',
    nickname: 'The Subterranean Shadow',
    description: 'A disgraced archaeologist who now sells artifacts on the black market. His knowledge of the underground world is unmatched.',
    backstory: 'Charlie was banned from legitimate archaeology after being caught falsifying dig site records. Now he uses his expertise to locate and steal cultural artifacts for wealthy collectors.',
    appearance: {
      age: '42',
      height: '5\'8"',
      build: 'Lean and agile',
      distinguishing: 'Night vision goggles on forehead, rope burn scars on hands'
    },
    personalityTraits: [
      'Can navigate caves without light',
      'Expert rappeller and climber',
      'Collects rare minerals as a hobby',
      'Always knows the nearest cave entrance'
    ],
    weaknesses: [
      'Obsessed with completing his collection',
      'Leaves crystal fragments behind',
      'Suffers migraines from light sensitivity'
    ],
    voiceLine: 'The darkness holds more secrets than you surface-dwellers could ever imagine.',
    guiltyCase: 'cave_secrets',
    traits: {
      horse: 'black',
      hat: 'none',
      weapon: 'knife',
      vice: 'cigars',
      accent: 'german',
      build: 'lean',
      mark: 'tattoo'
    }
  },
  {
    id: 'vintage_vera',
    name: 'Vera \'Vintage\' Castellano',
    nickname: 'The Sommelier Spy',
    description: 'A failed winemaker who now steals proprietary wine secrets to sell to competing vineyards.',
    backstory: 'Vera\'s family winery went bankrupt after a bad harvest and some questionable investments. Now she uses her extensive wine knowledge to infiltrate and steal from successful vineyards.',
    appearance: {
      age: '38',
      height: '5\'7"',
      build: 'Elegant',
      distinguishing: 'Always wears purple (the color of wine), distinctive grape-shaped earrings'
    },
    personalityTraits: [
      'Can identify any wine by smell alone',
      'Knows every winemaker in the region',
      'Charming and sophisticated',
      'Always arrives during harvest festival'
    ],
    weaknesses: [
      'Can\'t resist tasting wine at crime scenes',
      'Too proud of her wine knowledge',
      'Allergic to sulfites - ironic for a wine thief'
    ],
    voiceLine: 'This recipe will make me rich. The wine industry is cutthroat - I\'m just playing the game.',
    guiltyCase: 'wine_whodunit',
    traits: {
      horse: 'palomino',
      hat: 'derby',
      weapon: 'derringer',
      vice: 'gambling',
      accent: 'eastern',
      build: 'average',
      mark: 'none'
    }
  },

  // ========== RED HERRINGS (INNOCENT) ==========
  {
    id: 'red_herring_randy',
    name: 'Randy \'Red Herring\' Rodriguez',
    nickname: 'The Suspicious Innocent',
    description: 'A local tour guide who seems suspicious but is actually innocent. He just happens to be in the wrong place at the right time.',
    backstory: 'Randy runs \'Gold Country Ghost Tours\' and knows all the local legends. His encyclopedic knowledge and habit of lurking in historic sites makes him seem guilty, but he\'s just passionate about local history.',
    appearance: {
      age: '35',
      height: '6\'0"',
      build: 'Average',
      distinguishing: 'Ghost tour polo shirt, flashlight always in hand'
    },
    personalityTraits: [
      'Knows every ghost story in the county',
      'Always found near crime scenes (giving tours)',
      'Speaks in dramatic whispers',
      'Has keys to most historic buildings (for tours)'
    ],
    weaknesses: [
      'Too helpful - it seems suspicious',
      'Loves attention',
      'Terrible at keeping secrets'
    ],
    voiceLine: 'I didn\'t steal anything! I just... I was giving a tour! The spirits told me to be there!',
    guiltyCase: null,
    traits: {
      horse: 'pinto',
      hat: 'stetson',
      weapon: 'colt',
      vice: 'whiskey',
      accent: 'southern',
      build: 'tall',
      mark: 'none'
    }
  },
  {
    id: 'innocent_irene',
    name: 'Irene \'Innocent\' Chen',
    nickname: 'The Accidental Witness',
    description: 'A travel blogger documenting Gold Country who keeps accidentally photographing the real thieves in the background of her shots.',
    backstory: 'Irene runs a popular travel blog called \'Sierra Strolls.\' She\'s completely innocent but her photos contain crucial evidence if examined carefully.',
    appearance: {
      age: '29',
      height: '5\'4"',
      build: 'Petite',
      distinguishing: 'Camera always around neck, hiking boots, colorful scarves'
    },
    personalityTraits: [
      'Takes hundreds of photos daily',
      'Talks to everyone she meets',
      'Excellent memory for faces',
      'Night owl - often photographs at odd hours'
    ],
    weaknesses: [
      'Trusts everyone too easily',
      'Distracted by photo opportunities',
      'Posts location in real-time on social media'
    ],
    voiceLine: 'Oh my gosh, I just realized - there\'s someone suspicious in ALL my vacation photos!',
    guiltyCase: null,
    traits: {
      horse: 'palomino',
      hat: 'none',
      weapon: 'knife',
      vice: 'cigars',
      accent: 'eastern',
      build: 'short',
      mark: 'none'
    }
  }
]

// Helper functions for Gold Country suspects
export function getGoldCountrySuspect(id: string): GoldCountrySuspect | undefined {
  return GOLD_COUNTRY_SUSPECTS.find(s => s.id === id)
}

export function getSuspectByCase(caseId: CaseId): GoldCountrySuspect | undefined {
  return GOLD_COUNTRY_SUSPECTS.find(s => s.guiltyCase === caseId)
}

export function getGuiltySubspects(): GoldCountrySuspect[] {
  return GOLD_COUNTRY_SUSPECTS.filter(s => s.guiltyCase !== null)
}

export function getRedHerrings(): GoldCountrySuspect[] {
  return GOLD_COUNTRY_SUSPECTS.filter(s => s.guiltyCase === null)
}

// Find Gold Country suspects matching certain traits
export function findGoldCountrySuspectsByTraits(traits: Partial<OutlawTraits>): GoldCountrySuspect[] {
  return GOLD_COUNTRY_SUSPECTS.filter(suspect => {
    for (const [key, value] of Object.entries(traits)) {
      if (suspect.traits[key as keyof OutlawTraits] !== value) {
        return false
      }
    }
    return true
  })
}
