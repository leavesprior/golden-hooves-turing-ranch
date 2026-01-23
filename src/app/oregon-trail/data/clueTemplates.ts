// Clue Templates for the Mystery System
// Clues are generated based on outlaw traits and point to identity or location

import type { OutlawTraits, CrimeType } from './outlaws'

export interface ClueTemplate {
  id: string
  type: 'identity' | 'location' | 'time' | 'method'
  trait?: keyof OutlawTraits  // Which trait this clue reveals
  traitValue?: string         // Specific value (if direct clue)
  text: string                // Template with {value} placeholder
  witnessType: WitnessType
  reliability: number         // 0-1 how trustworthy (affects narrator lies)
  difficulty: number          // Shrewdness check to interpret correctly
}

export type WitnessType =
  | 'bartender'
  | 'shopkeeper'
  | 'stable_hand'
  | 'traveler'
  | 'settler'
  | 'native_trader'
  | 'telegraph_operator'
  | 'sheriff_deputy'
  | 'prostitute'
  | 'preacher'
  | 'drunk'
  | 'child'

// Direct identity clues - clearly point to a trait
export const IDENTITY_CLUES: ClueTemplate[] = [
  // Horse clues
  {
    id: 'horse_direct',
    type: 'identity',
    trait: 'horse',
    text: "The bandit rode a {value}. I'd recognize that horse anywhere.",
    witnessType: 'stable_hand',
    reliability: 0.95,
    difficulty: 2
  },
  {
    id: 'horse_dust',
    type: 'identity',
    trait: 'horse',
    text: "Saw a {value} tearing out of here like the devil himself was chasing it.",
    witnessType: 'traveler',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'horse_feed',
    type: 'identity',
    trait: 'horse',
    text: "Someone bought oats for a {value} not an hour ago. Paid in fresh-minted gold.",
    witnessType: 'shopkeeper',
    reliability: 0.9,
    difficulty: 2
  },

  // Hat clues
  {
    id: 'hat_direct',
    type: 'identity',
    trait: 'hat',
    text: "Wore a {value}. Tipped it at me before drawing his gun. Polite-like.",
    witnessType: 'bartender',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'hat_shadow',
    type: 'identity',
    trait: 'hat',
    text: "Could only see the shadow, but that {value} shape is unmistakable.",
    witnessType: 'settler',
    reliability: 0.75,
    difficulty: 4
  },
  {
    id: 'hat_left',
    type: 'identity',
    trait: 'hat',
    text: "Left their {value} behind when they fled. Still has a bullet hole in it.",
    witnessType: 'sheriff_deputy',
    reliability: 1.0,
    difficulty: 1
  },

  // Weapon clues
  {
    id: 'weapon_shot',
    type: 'identity',
    trait: 'weapon',
    text: "I know the sound of a {value}. That's what they were shooting.",
    witnessType: 'sheriff_deputy',
    reliability: 0.9,
    difficulty: 3
  },
  {
    id: 'weapon_threat',
    type: 'identity',
    trait: 'weapon',
    text: "Waved a {value} in my face. I'll never forget those cold eyes behind it.",
    witnessType: 'shopkeeper',
    reliability: 0.95,
    difficulty: 2
  },
  {
    id: 'weapon_blast',
    type: 'identity',
    trait: 'weapon',
    text: "Used {value}! The whole building shook. Thought the world was ending.",
    witnessType: 'settler',
    reliability: 1.0,
    difficulty: 1
  },

  // Vice clues
  {
    id: 'vice_smell',
    type: 'identity',
    trait: 'vice',
    text: "Reeked of {value}. Could smell it from ten feet away.",
    witnessType: 'bartender',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'vice_purchase',
    type: 'identity',
    trait: 'vice',
    text: "Bought {value} before the robbery. Seemed in good spirits.",
    witnessType: 'shopkeeper',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'vice_habit',
    type: 'identity',
    trait: 'vice',
    text: "Couldn't stop fidgeting with their {value}. Nervous habit, I reckon.",
    witnessType: 'prostitute',
    reliability: 0.8,
    difficulty: 4
  },
  {
    id: 'vice_poetry',
    type: 'identity',
    trait: 'vice',
    traitValue: 'poetry',
    text: "Left a poem at the scene. Something about bread and riches.",
    witnessType: 'sheriff_deputy',
    reliability: 1.0,
    difficulty: 1
  },

  // Accent clues
  {
    id: 'accent_direct',
    type: 'identity',
    trait: 'accent',
    text: "Spoke with a {value}. Tried to hide it, but it slipped out.",
    witnessType: 'bartender',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'accent_curse',
    type: 'identity',
    trait: 'accent',
    text: "When the safe stuck, they cursed in that {value} way. Very distinctive.",
    witnessType: 'shopkeeper',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'accent_song',
    type: 'identity',
    trait: 'accent',
    text: "Heard them humming a tune. Old {value} folk song, if I'm not mistaken.",
    witnessType: 'traveler',
    reliability: 0.7,
    difficulty: 5
  },

  // Build clues
  {
    id: 'build_direct',
    type: 'identity',
    trait: 'build',
    text: "A {value} figure, that one. Couldn't miss them in a crowd.",
    witnessType: 'settler',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'build_shadow',
    type: 'identity',
    trait: 'build',
    text: "Their shadow was {value}. That's all I saw before I hit the floor.",
    witnessType: 'shopkeeper',
    reliability: 0.75,
    difficulty: 4
  },
  {
    id: 'build_horse',
    type: 'identity',
    trait: 'build',
    text: "Rode a small horse, but they were {value}. Legs nearly touched the ground.",
    witnessType: 'stable_hand',
    reliability: 0.85,
    difficulty: 3
  },

  // Distinguishing mark clues
  {
    id: 'mark_direct',
    type: 'identity',
    trait: 'mark',
    text: "Had a {value}. Hard to forget something like that.",
    witnessType: 'bartender',
    reliability: 0.95,
    difficulty: 2
  },
  {
    id: 'mark_glimpse',
    type: 'identity',
    trait: 'mark',
    text: "Caught a glimpse of {value} when their sleeve rode up.",
    witnessType: 'prostitute',
    reliability: 0.8,
    difficulty: 4
  },
  {
    id: 'mark_telltale',
    type: 'identity',
    trait: 'mark',
    text: "The wanted posters don't mention it, but I saw {value} clear as day.",
    witnessType: 'sheriff_deputy',
    reliability: 0.9,
    difficulty: 2
  }
]

// Location clues - point to where the outlaw went next
export const LOCATION_CLUES: ClueTemplate[] = [
  {
    id: 'location_asked',
    type: 'location',
    text: "Asked about the trail to {destination}. Seemed in a hurry.",
    witnessType: 'traveler',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'location_supplies',
    type: 'location',
    text: "Bought supplies for a long journey. Mentioned crossing {destination}.",
    witnessType: 'shopkeeper',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'location_telegraph',
    type: 'location',
    text: "Sent a wire to someone near {destination}. Tried to be discrete.",
    witnessType: 'telegraph_operator',
    reliability: 0.95,
    difficulty: 2
  },
  {
    id: 'location_dust',
    type: 'location',
    text: "Headed west on the {destination} road. Riding hard.",
    witnessType: 'stable_hand',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'location_gossip',
    type: 'location',
    text: "Overheard them talking about meeting someone at {destination}.",
    witnessType: 'prostitute',
    reliability: 0.8,
    difficulty: 4
  },
  {
    id: 'location_drunk',
    type: 'location',
    text: "After a few drinks, bragged about their hideout near {destination}.",
    witnessType: 'drunk',
    reliability: 0.6,
    difficulty: 5
  },
  {
    id: 'location_child',
    type: 'location',
    text: "The scary person gave me a nickel! Said they were going to {destination}.",
    witnessType: 'child',
    reliability: 0.7,
    difficulty: 3
  },
  {
    id: 'location_native',
    type: 'location',
    text: "A rider matching that description passed through heading toward {destination}.",
    witnessType: 'native_trader',
    reliability: 0.85,
    difficulty: 3
  }
]

// Time clues - how long ago the outlaw was here
export const TIME_CLUES: ClueTemplate[] = [
  {
    id: 'time_recent',
    type: 'time',
    text: "Just missed them. {hours} hours, maybe less.",
    witnessType: 'bartender',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'time_morning',
    type: 'time',
    text: "Saw them this morning at dawn. You're {hours} hours behind.",
    witnessType: 'settler',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'time_yesterday',
    type: 'time',
    text: "They passed through yesterday. Got about {hours} hours on you.",
    witnessType: 'shopkeeper',
    reliability: 0.8,
    difficulty: 3
  },
  {
    id: 'time_dust',
    type: 'time',
    text: "Trail's still warm. Can't be more than {hours} hours old.",
    witnessType: 'native_trader',
    reliability: 0.95,
    difficulty: 2
  }
]

// Method clues - how the crime was committed
export const METHOD_CLUES: ClueTemplate[] = [
  {
    id: 'method_alone',
    type: 'method',
    text: "Worked alone. Professional. In and out in five minutes.",
    witnessType: 'sheriff_deputy',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'method_violence',
    type: 'method',
    text: "Didn't hurt nobody. Almost... polite about the whole thing.",
    witnessType: 'shopkeeper',
    reliability: 0.85,
    difficulty: 3
  },
  {
    id: 'method_brutal',
    type: 'method',
    text: "Roughed up the witnesses. Didn't need to, just seemed to enjoy it.",
    witnessType: 'settler',
    reliability: 0.9,
    difficulty: 2
  },
  {
    id: 'method_disguise',
    type: 'method',
    text: "Wore a bandana over their face. But those eyes...",
    witnessType: 'bartender',
    reliability: 0.75,
    difficulty: 4
  }
]

// Witness personalities affect how they give clues
export const WITNESS_PERSONALITIES: Record<WitnessType, {
  openness: number      // How willing to talk (0-1)
  accuracy: number      // How accurate their observations are (0-1)
  bribable: number      // How much gold to guarantee cooperation
  intimidatable: number // How much force to guarantee cooperation
  diplomacyDC: number   // Diplomacy check to get info
  shrewdnessDC: number  // Shrewdness check to notice they're holding back
  greeting: string
}> = {
  bartender: {
    openness: 0.7,
    accuracy: 0.8,
    bribable: 5,
    intimidatable: 0.3,
    diplomacyDC: 4,
    shrewdnessDC: 5,
    greeting: "What'll it be, stranger?"
  },
  shopkeeper: {
    openness: 0.6,
    accuracy: 0.9,
    bribable: 10,
    intimidatable: 0.7,
    diplomacyDC: 5,
    shrewdnessDC: 4,
    greeting: "Welcome to my establishment. Cash only."
  },
  stable_hand: {
    openness: 0.8,
    accuracy: 0.85,
    bribable: 3,
    intimidatable: 0.5,
    diplomacyDC: 3,
    shrewdnessDC: 6,
    greeting: "Your horse need tendin'?"
  },
  traveler: {
    openness: 0.5,
    accuracy: 0.7,
    bribable: 8,
    intimidatable: 0.4,
    diplomacyDC: 5,
    shrewdnessDC: 5,
    greeting: "Just passing through, same as you."
  },
  settler: {
    openness: 0.6,
    accuracy: 0.75,
    bribable: 15,
    intimidatable: 0.2,
    diplomacyDC: 4,
    shrewdnessDC: 5,
    greeting: "This is a good land. Hard, but good."
  },
  native_trader: {
    openness: 0.4,
    accuracy: 0.95,
    bribable: 20,
    intimidatable: 0.1,
    diplomacyDC: 7,
    shrewdnessDC: 3,
    greeting: "I trade fair. Do you?"
  },
  telegraph_operator: {
    openness: 0.3,
    accuracy: 0.98,
    bribable: 25,
    intimidatable: 0.6,
    diplomacyDC: 6,
    shrewdnessDC: 3,
    greeting: "Telegraph office. Ten cents a word."
  },
  sheriff_deputy: {
    openness: 0.7,
    accuracy: 0.9,
    bribable: 50,
    intimidatable: 0.1,
    diplomacyDC: 4,
    shrewdnessDC: 4,
    greeting: "Pinkerton, eh? The sheriff's out. I can help."
  },
  prostitute: {
    openness: 0.8,
    accuracy: 0.85,
    bribable: 5,
    intimidatable: 0.8,
    diplomacyDC: 3,
    shrewdnessDC: 4,
    greeting: "Looking for company, or information?"
  },
  preacher: {
    openness: 0.5,
    accuracy: 0.8,
    bribable: 100, // Won't be bribed
    intimidatable: 0.05,
    diplomacyDC: 5,
    shrewdnessDC: 6,
    greeting: "The Lord sees all, my child. Even outlaws."
  },
  drunk: {
    openness: 0.9,
    accuracy: 0.5,
    bribable: 1,
    intimidatable: 0.9,
    diplomacyDC: 2,
    shrewdnessDC: 7,
    greeting: "*hic* You buyin'?"
  },
  child: {
    openness: 0.7,
    accuracy: 0.6,
    bribable: 0.5, // A penny works
    intimidatable: 0.0, // Never intimidate children (karma penalty)
    diplomacyDC: 2,
    shrewdnessDC: 3,
    greeting: "Are you a real detective?"
  }
}

// Crime scene descriptions
export const CRIME_DESCRIPTIONS: Record<CrimeType, {
  title: string
  description: string
  clueLocations: string[]
}> = {
  stagecoach_robbery: {
    title: 'Stagecoach Robbery',
    description: 'The Wells Fargo stage was held up on the road. Driver wounded, strongbox emptied.',
    clueLocations: ['road', 'saloon', 'stable']
  },
  bank_heist: {
    title: 'Bank Heist',
    description: 'The town bank was robbed in broad daylight. Vault blown open, teller traumatized.',
    clueLocations: ['bank', 'saloon', 'telegraph']
  },
  cattle_rustling: {
    title: 'Cattle Rustling',
    description: 'A rancher reports fifty head of cattle stolen in the night.',
    clueLocations: ['ranch', 'stable', 'general_store']
  },
  train_robbery: {
    title: 'Train Robbery',
    description: 'The Pacific Express was stopped and looted. Passengers relieved of valuables.',
    clueLocations: ['station', 'telegraph', 'saloon']
  },
  gold_theft: {
    title: 'Gold Shipment Theft',
    description: 'A gold shipment bound for San Francisco has vanished.',
    clueLocations: ['assay_office', 'stable', 'saloon']
  },
  horse_theft: {
    title: 'Horse Theft',
    description: 'Several prize horses stolen from the livery stable.',
    clueLocations: ['stable', 'road', 'general_store']
  },
  claim_jumping: {
    title: 'Claim Jumping',
    description: 'A prospector was run off his claim at gunpoint. Found gold last week.',
    clueLocations: ['mine', 'assay_office', 'saloon']
  },
  general_store_robbery: {
    title: 'General Store Robbery',
    description: 'The general store was robbed. Cash box emptied, supplies taken.',
    clueLocations: ['general_store', 'stable', 'saloon']
  },
  kidnapping: {
    title: 'Kidnapping',
    description: 'A wealthy citizen has been taken. Ransom demanded.',
    clueLocations: ['residence', 'telegraph', 'saloon']
  },
  arson: {
    title: 'Arson',
    description: 'A building was deliberately set ablaze. Witnesses report fleeing figures.',
    clueLocations: ['ruins', 'saloon', 'stable']
  }
}

// Helper function to generate a clue from template
export function generateClue(
  template: ClueTemplate,
  outlaw: { traits: OutlawTraits },
  destination?: string
): { text: string; trait?: keyof OutlawTraits; value?: string } {
  let text = template.text

  if (template.trait && template.traitValue) {
    // Fixed trait value
    text = text.replace('{value}', template.traitValue)
    return { text, trait: template.trait, value: template.traitValue }
  } else if (template.trait) {
    // Dynamic trait value from outlaw
    const value = outlaw.traits[template.trait]
    text = text.replace('{value}', formatTraitValue(template.trait, value))
    return { text, trait: template.trait, value }
  } else if (template.type === 'location' && destination) {
    // Location clue
    text = text.replace('{destination}', destination)
    return { text }
  } else if (template.type === 'time') {
    // Time clue - hours would be passed in differently
    return { text }
  }

  return { text }
}

// Format trait value for display in clue text
function formatTraitValue(trait: keyof OutlawTraits, value: string): string {
  const displayMap: Record<string, Record<string, string>> = {
    horse: {
      black: 'black horse',
      white: 'white horse',
      pinto: 'pinto',
      palomino: 'palomino',
      chestnut: 'chestnut mare'
    },
    hat: {
      stetson: 'Stetson',
      bowler: 'bowler hat',
      sombrero: 'sombrero',
      derby: 'derby',
      none: 'no hat, bald as an egg'
    },
    weapon: {
      colt: 'Colt revolver',
      winchester: 'Winchester rifle',
      knife: 'wicked knife',
      dynamite: 'dynamite',
      derringer: 'little Derringer'
    },
    vice: {
      whiskey: 'whiskey',
      cigars: 'fine cigars',
      gambling: 'gambling - kept flipping a coin',
      poetry: 'poetry books',
      gold_teeth: 'gold teeth, flashing when they smiled'
    },
    accent: {
      southern: 'Southern drawl',
      eastern: 'Eastern, educated-like',
      mexican: 'Mexican',
      irish: 'Irish brogue',
      german: 'German'
    },
    build: {
      tall: 'tall',
      short: 'short',
      stocky: 'stocky, built like a barrel',
      lean: 'lean and wiry',
      average: 'average, forgettable really'
    },
    mark: {
      scar_cheek: 'a nasty scar on their cheek',
      missing_finger: 'missing a finger on their gun hand',
      gold_tooth: 'a gold tooth that caught the light',
      eye_patch: 'an eye patch',
      limp: 'a bad limp',
      tattoo: 'a tattoo on their arm',
      none: 'nothing special - just a face you\'d forget'
    }
  }

  return displayMap[trait]?.[value] || value
}

// Get random clues for a crime scene
export function getRandomCluesForCrime(
  outlaw: { traits: OutlawTraits },
  crimeType: CrimeType,
  nextDestination: string,
  hoursAhead: number,
  count: number = 3
): Array<{ template: ClueTemplate; text: string; trait?: keyof OutlawTraits; value?: string }> {
  const clues: Array<{ template: ClueTemplate; text: string; trait?: keyof OutlawTraits; value?: string }> = []

  // Always include at least one identity clue
  const identityClue = IDENTITY_CLUES[Math.floor(Math.random() * IDENTITY_CLUES.length)]
  const generated = generateClue(identityClue, outlaw)
  clues.push({ template: identityClue, ...generated })

  // Add a location clue
  const locationClue = LOCATION_CLUES[Math.floor(Math.random() * LOCATION_CLUES.length)]
  const locationGenerated = generateClue(locationClue, outlaw, nextDestination)
  clues.push({ template: locationClue, ...locationGenerated })

  // Add remaining clues from pool
  const remainingPool = [...IDENTITY_CLUES, ...METHOD_CLUES]
  while (clues.length < count && remainingPool.length > 0) {
    const index = Math.floor(Math.random() * remainingPool.length)
    const template = remainingPool.splice(index, 1)[0]
    const gen = generateClue(template, outlaw)
    clues.push({ template, ...gen })
  }

  return clues
}
