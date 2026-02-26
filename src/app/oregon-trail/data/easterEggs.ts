/**
 * Easter Eggs, Mark Twain Quotes, and Hidden Secrets
 *
 * Historical accuracy: Real figures, actual 1849-1883 events
 * All quotes are genuine Mark Twain (Samuel Clemens)
 */

// ============================================
// TYPES
// ============================================

export type TriggerCondition =
  | { type: 'stat_threshold'; stat: string; value: number; comparison: 'gte' | 'lte' | 'eq' }
  | { type: 'karma_alignment'; alignment: 'lawful' | 'chaotic' | 'good' | 'evil' }
  | { type: 'location'; locationId: string }
  | { type: 'time_of_day'; time: 'dawn' | 'day' | 'dusk' | 'night' }
  | { type: 'item_possessed'; itemId: string }
  | { type: 'outlaw_captured'; outlawId: string }
  | { type: 'random'; chance: number }
  | { type: 'chapter'; chapter: number }
  | { type: 'consecutive_visits'; locationId: string; count: number }

export interface EasterEgg {
  id: string
  title: string
  description: string
  trigger: TriggerCondition[]
  reward?: EasterEggReward
  hint?: string
  discovered?: boolean
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

export interface EasterEggReward {
  type: 'item' | 'karma' | 'stat_boost' | 'unlock' | 'lore' | 'achievement'
  value: string | number
  description: string
}

export interface TwainQuote {
  id: string
  text: string
  context: string  // Where/when Twain wrote this
  location?: string  // If tied to a specific location
  trigger?: TriggerCondition[]
  source: string  // Book, letter, speech
  year: number
}

export interface HistoricalFigure {
  id: string
  name: string
  realName?: string  // If they used a pseudonym
  birthYear: number
  deathYear?: number
  description: string
  locations: string[]  // Location IDs where they might appear
  quotes: string[]
  interactions: FigureInteraction[]
  portrait?: string  // Emoji or sprite reference
}

export interface FigureInteraction {
  condition: TriggerCondition
  dialogue: string[]
  reward?: EasterEggReward
}

// ============================================
// MARK TWAIN QUOTES
// ============================================

export const TWAIN_QUOTES: TwainQuote[] = [
  // General wisdom
  {
    id: 'twain_truth',
    text: "If you tell the truth, you don't have to remember anything.",
    context: 'Written in his notebook',
    source: 'Notebook, 1894',
    year: 1894,
  },
  {
    id: 'twain_gold_rush',
    text: "During the gold excitement, men brought in eight thousand dollars' worth of treasure in a single basket.",
    context: 'Describing his time in Gold Country',
    location: 'angels_camp',
    source: 'Roughing It',
    year: 1872,
  },
  {
    id: 'twain_frog',
    text: "And turning to Simon Wheeler, I inquired after my friend's friend, Leonidas W. Smiley, as requested to do, and I hereunto append the result.",
    context: 'Opening of his most famous short story',
    location: 'angels_camp',
    source: 'The Celebrated Jumping Frog of Calaveras County',
    year: 1865,
  },
  {
    id: 'twain_mining',
    text: "A gold mine is a hole in the ground with a liar standing over it.",
    context: 'Advice about mining investments',
    source: 'Attributed',
    year: 1870,
  },
  {
    id: 'twain_courage',
    text: "Courage is resistance to fear, mastery of fear - not absence of fear.",
    context: 'Wisdom on bravery',
    source: 'Pudd\'nhead Wilson',
    year: 1894,
    trigger: [{ type: 'karma_alignment', alignment: 'good' }],
  },
  {
    id: 'twain_kindness',
    text: "Kindness is a language which the deaf can hear and the blind can see.",
    context: 'On human decency',
    source: 'Attributed',
    year: 1880,
    trigger: [{ type: 'karma_alignment', alignment: 'good' }],
  },
  {
    id: 'twain_politicians',
    text: "Politicians and diapers must be changed often, and for the same reason.",
    context: 'On politics',
    source: 'Attributed',
    year: 1880,
  },
  {
    id: 'twain_travel',
    text: "Travel is fatal to prejudice, bigotry, and narrow-mindedness.",
    context: 'On the value of travel',
    source: 'The Innocents Abroad',
    year: 1869,
    trigger: [{ type: 'chapter', chapter: 2 }],
  },
  {
    id: 'twain_silence',
    text: "It is better to keep your mouth closed and let people think you are a fool than to open it and remove all doubt.",
    context: 'On discretion',
    source: 'Attributed',
    year: 1880,
  },
  {
    id: 'twain_clothes',
    text: "Clothes make the man. Naked people have little or no influence in society.",
    context: 'On appearances',
    source: 'More Maxims of Mark',
    year: 1927,
  },
  // Location-specific quotes
  {
    id: 'twain_volcano',
    text: "The world owes a great deal to the pioneer who had the courage to pack his frying-pan and go west.",
    context: 'On Western pioneers',
    location: 'volcano',
    source: 'Roughing It',
    year: 1872,
  },
  {
    id: 'twain_trees',
    text: "The Big Trees...they seemed like the master-pieces of creation.",
    context: 'After visiting the Calaveras grove',
    location: 'big_trees',
    source: 'Roughing It',
    year: 1872,
  },
  // Saloon wall quotes
  {
    id: 'twain_whiskey',
    text: "Too much of anything is bad, but too much good whiskey is barely enough.",
    context: 'Found scrawled on saloon walls',
    source: 'Attributed',
    year: 1875,
    trigger: [{ type: 'location', locationId: 'saloon' }],
  },
  {
    id: 'twain_never',
    text: "Never argue with stupid people, they will drag you down to their level and then beat you with experience.",
    context: 'Advice for saloon patrons',
    source: 'Attributed',
    year: 1880,
    trigger: [{ type: 'location', locationId: 'saloon' }],
  },
]

// ============================================
// BLACK BART POETRY (ACTUAL POEMS)
// ============================================

export const BLACK_BART_POEMS = [
  {
    id: 'bart_poem_1',
    title: 'First Poem (July 1878)',
    text: `I've labored long and hard for bread,
For honor and for riches,
But on my corns too long you've tread,
You fine-haired sons of bitches.`,
    location: 'san_andreas',
    foundAt: 'Wells Fargo strongbox, Quincy to Oroville robbery',
    hint: 'Search the old Wells Fargo office files',
  },
  {
    id: 'bart_poem_2',
    title: 'Second Poem (August 1877)',
    text: `Here I lay me down to sleep
To wait the coming morrow,
Perhaps success, perhaps defeat,
And everlasting sorrow.
Let come what will, I'll try it on,
My condition can't be worse;
And if there's money in that box
'Tis munny in my purse.`,
    location: 'funk_hill',
    foundAt: 'Duncan Mills robbery site',
    hint: 'The old stage route has secrets',
  },
]

// ============================================
// HISTORICAL FIGURES
// ============================================

export const HISTORICAL_FIGURES: HistoricalFigure[] = [
  {
    id: 'black_bart',
    name: 'Black Bart',
    realName: 'Charles Earl Boles',
    birthYear: 1829,
    deathYear: 1917,
    description: 'The gentleman bandit who robbed 28 stagecoaches without firing a shot. Known for polite manner and poetry.',
    locations: ['san_andreas', 'mokelumne_hill', 'angels_camp', 'jackson'],
    portrait: '🎩',
    quotes: [
      "I am the Poet of the hills.",
      "Please throw down the box.",
      "I never robbed a passenger, only Wells Fargo.",
    ],
    interactions: [
      {
        condition: { type: 'karma_alignment', alignment: 'lawful' },
        dialogue: [
          "I see you're a person of principles. I respect that.",
          "Even I had my rules - never harmed a soul, never robbed a common traveler.",
          "The law caught up with me through a laundry mark. Can you believe it?",
        ],
      },
      {
        condition: { type: 'karma_alignment', alignment: 'chaotic' },
        dialogue: [
          "You remind me of my younger self. That fire in your eyes...",
          "But heed my warning - there's always someone smarter.",
          "A single handkerchief brought down my empire.",
        ],
      },
    ],
  },
  {
    id: 'mark_twain',
    name: 'Mark Twain',
    realName: 'Samuel Langhorne Clemens',
    birthYear: 1835,
    deathYear: 1910,
    description: 'America\'s greatest humorist, who spent time in Gold Country in 1864-1865 and wrote the famous "Jumping Frog" story.',
    locations: ['angels_camp', 'big_trees', 'jackass_hill'],
    portrait: '📝',
    quotes: [
      "The secret of getting ahead is getting started.",
      "I came to California for gold, and all I got was this story about a frog.",
      "A man who carries a cat by the tail learns something he can learn in no other way.",
    ],
    interactions: [
      {
        condition: { type: 'location', locationId: 'angels_camp' },
        dialogue: [
          "You look like someone who appreciates a good story.",
          "Have you heard about Jim Smiley and his jumping frog?",
          "They say that frog could out-jump any creature in Calaveras County...",
        ],
        reward: {
          type: 'unlock',
          value: 'jumping_frog_story',
          description: 'Unlocked the complete "Jumping Frog" story',
        },
      },
    ],
  },
  {
    id: 'joaquin_murrieta',
    name: 'Joaquin Murrieta',
    birthYear: 1829,
    deathYear: 1853,
    description: 'The "Robin Hood of El Dorado" or ruthless bandit, depending on who tells the story. His legend haunts Gold Country.',
    locations: ['mokelumne_hill', 'san_andreas', 'jackson'],
    portrait: '🗡️',
    quotes: [
      "The Americanos took everything from me. Now I take from them.",
      "They call me bandit. I call myself avenger.",
      "My head may be in a jar, but my spirit rides free.",
    ],
    interactions: [
      {
        condition: { type: 'time_of_day', time: 'night' },
        dialogue: [
          "*A figure appears in the moonlight*",
          "You dare ride these hills at night, stranger?",
          "Perhaps you are brave. Perhaps foolish. We shall see...",
        ],
      },
    ],
  },
  {
    id: 'kit_carson',
    name: 'Kit Carson',
    birthYear: 1809,
    deathYear: 1868,
    description: 'Legendary frontiersman and explorer who named West Point during his 1844 California expedition.',
    locations: ['west_point'],
    portrait: '🏔️',
    quotes: [
      "I named this spot West Point, for it marks the western edge of the known.",
      "The wilderness teaches patience and respect.",
      "Trust your horse, your rifle, and your instincts - in that order.",
    ],
    interactions: [
      {
        condition: { type: 'location', locationId: 'west_point' },
        dialogue: [
          "See that marker? I carved my initials there in '44.",
          "This was untamed wilderness then. Look at it now.",
          "Progress comes with a cost, friend. Never forget that.",
        ],
      },
    ],
  },
  {
    id: 'lotta_crabtree',
    name: 'Lotta Crabtree',
    birthYear: 1847,
    deathYear: 1924,
    description: 'Child actress who performed in mining camps. Later became one of the wealthiest and most beloved entertainers in America.',
    locations: ['volcano', 'mokelumne_hill', 'jackson'],
    portrait: '🎭',
    quotes: [
      "I started dancing for miners when I was six years old!",
      "They threw gold nuggets at my feet instead of flowers.",
      "Gold Country gave me my start. I've never forgotten.",
    ],
    interactions: [
      {
        condition: { type: 'location', locationId: 'volcano' },
        dialogue: [
          "The Cobblestone Theatre! I performed here as a child.",
          "The miners were rough, but they loved a good show.",
          "I remember when 17,000 souls lived in this valley...",
        ],
        reward: {
          type: 'achievement',
          value: 'met_lotta',
          description: 'Met Lotta Crabtree at the Cobblestone Theatre',
        },
      },
    ],
  },
]

// ============================================
// EASTER EGGS
// ============================================

export const EASTER_EGGS: EasterEgg[] = [
  // Common discoveries
  {
    id: 'chimney_rock_carving',
    title: 'Twain\'s Secret Carving',
    description: 'Hidden among thousands of names on Chimney Rock: "S. CLEMENS 1861"',
    trigger: [{ type: 'location', locationId: 'chimney_rock' }, { type: 'random', chance: 0.3 }],
    hint: 'Look carefully among the carvings at Chimney Rock...',
    rarity: 'uncommon',
    reward: {
      type: 'achievement',
      value: 'twain_historian',
      description: 'Found Samuel Clemens\' pre-fame signature',
    },
  },
  {
    id: 'laundry_mark',
    title: 'F.X.O.7',
    description: 'You found a handkerchief with the laundry mark that led to Black Bart\'s capture.',
    trigger: [{ type: 'location', locationId: 'san_andreas' }, { type: 'stat_threshold', stat: 'investigation', value: 5, comparison: 'gte' }],
    hint: 'The courthouse in San Andreas holds evidence from the famous trial...',
    rarity: 'rare',
    reward: {
      type: 'item',
      value: 'black_bart_handkerchief',
      description: 'A replica of the handkerchief that brought down Black Bart',
    },
  },
  {
    id: 'jumping_frog',
    title: 'The Celebrated Jumping Frog',
    description: 'You found Daniel Webster\'s descendant - a frog that can truly jump!',
    trigger: [{ type: 'location', locationId: 'angels_camp' }, { type: 'karma_alignment', alignment: 'good' }],
    hint: 'The pond behind Ross\'s Saloon is home to remarkable frogs...',
    rarity: 'rare',
    reward: {
      type: 'item',
      value: 'jumping_frog',
      description: 'A champion jumping frog (just don\'t fill him with quail shot)',
    },
  },
  {
    id: 'old_abe_cannon',
    title: 'Old Abe',
    description: 'You discovered the Civil War cannon hidden by Union sympathizers.',
    trigger: [{ type: 'location', locationId: 'volcano' }, { type: 'time_of_day', time: 'night' }],
    hint: 'Volcano was a Union stronghold during the Civil War...',
    rarity: 'rare',
    reward: {
      type: 'lore',
      value: 'civil_war_gold_country',
      description: 'Learned about the Civil War\'s impact on Gold Country',
    },
  },
  {
    id: 'carson_hill_nugget_spot',
    title: 'X Marks the Spot',
    description: 'You found the exact location where the 195-pound gold nugget was discovered.',
    trigger: [{ type: 'location', locationId: 'carson_hill' }, { type: 'item_possessed', itemId: 'miners_map' }],
    hint: 'Old maps sometimes mark more than trails...',
    rarity: 'rare',
    reward: {
      type: 'karma',
      value: 50,
      description: 'The thrill of discovery grants karma',
    },
  },
  {
    id: 'hotel_leger_ghost',
    title: 'The Ghost of George Leger',
    description: 'You witnessed the ghost of George Leger walking the halls at midnight.',
    trigger: [{ type: 'location', locationId: 'mokelumne_hill' }, { type: 'time_of_day', time: 'night' }, { type: 'consecutive_visits', locationId: 'mokelumne_hill', count: 3 }],
    hint: 'They say George Leger never truly left his hotel...',
    rarity: 'legendary',
    reward: {
      type: 'achievement',
      value: 'ghost_hunter',
      description: 'Witnessed a genuine Gold Country ghost',
    },
  },
  {
    id: 'chinese_tunnels_entrance',
    title: 'The Hidden World',
    description: 'You discovered the secret entrance to the Chinese tunnels beneath Mokelumne Hill.',
    trigger: [
      { type: 'location', locationId: 'mokelumne_hill' },
      { type: 'stat_threshold', stat: 'investigation', value: 8, comparison: 'gte' },
    ],
    hint: 'The Chinese quarter held secrets from the taxman...',
    rarity: 'rare',
    reward: {
      type: 'unlock',
      value: 'chinese_tunnels',
      description: 'Discovered the Chinese tunnel network',
    },
  },
  {
    id: 'sutters_lament',
    title: 'Sutter\'s Lament',
    description: 'You heard John Sutter himself cursing the day gold was found on his land.',
    trigger: [{ type: 'location', locationId: 'sacramento_valley' }],
    hint: 'Sutter\'s Fort stands as a monument to irony...',
    rarity: 'uncommon',
    reward: {
      type: 'lore',
      value: 'sutters_story',
      description: 'Learned the tragic tale of John Sutter',
    },
  },
  {
    id: 'cynthias_special',
    title: 'The Pinkerton Special',
    description: 'At Cynthia\'s Inn, you ordered the secret menu item.',
    trigger: [{ type: 'location', locationId: 'west_point' }],
    hint: 'Ask Cynthia about the Pinkerton Special...',
    rarity: 'uncommon',
    reward: {
      type: 'stat_boost',
      value: 'health_10',
      description: 'A hearty meal restores 10 health to all party members',
    },
  },
  {
    id: 'miwok_blessing',
    title: 'Ancient Blessing',
    description: 'A Miwok elder blessed your journey at Indian Grinding Rock.',
    trigger: [{ type: 'location', locationId: 'indian_grinding_rock' }, { type: 'karma_alignment', alignment: 'good' }],
    hint: 'Show respect at the sacred grinding rock...',
    rarity: 'rare',
    reward: {
      type: 'stat_boost',
      value: 'luck_boost',
      description: 'Increased luck for 7 days',
    },
  },
  // Twain-themed Easter eggs
  {
    id: 'twains_pocket_watch',
    title: "Twain's Pocket Watch",
    description: 'A battered pocket watch with "S.L.C." scratched on the back. It runs backwards, gains 15 minutes a day, and the narrator insists it\'s priceless.',
    trigger: [{ type: 'location', locationId: 'angels_camp' }, { type: 'stat_threshold', stat: 'investigation', value: 3, comparison: 'gte' }],
    hint: 'Check the lost-and-found box at Ross\'s Saloon. It\'s been there since \'65.',
    rarity: 'rare',
    reward: {
      type: 'item',
      value: 'twains_pocket_watch',
      description: 'A worthless (priceless?) timepiece. The narrator will not shut up about it.',
    },
  },
  {
    id: 'genuine_mexican_plug',
    title: 'Genuine Mexican Plug',
    description: 'A horse dealer swears this is the finest steed in California. It bucks like a hurricane, runs sideways, and has a personality disorder.',
    trigger: [{ type: 'location', locationId: 'sacramento_valley' }, { type: 'random', chance: 0.25 }],
    hint: 'There\'s a persuasive horse trader near the stockyards. Don\'t listen to him.',
    rarity: 'uncommon',
    reward: {
      type: 'item',
      value: 'genuine_mexican_plug',
      description: 'The worst horse in the territory. -2 travel speed, +5 comedy.',
    },
  },
  {
    id: 'calaveras_frog_contest',
    title: 'The Calaveras County Frog Jump',
    description: 'You entered the annual frog jumping contest at Angels Camp. Your frog jumped 39 feet and 3 inches before a suspicious stranger filled the competition\'s frog with quail shot.',
    trigger: [{ type: 'location', locationId: 'angels_camp' }, { type: 'karma_alignment', alignment: 'lawful' }, { type: 'random', chance: 0.15 }],
    hint: 'The annual contest is held behind the old hotel. Bring your own frog.',
    rarity: 'legendary',
    reward: {
      type: 'karma',
      value: 25,
      description: 'The crowd loves you (even if the stranger cheated)',
    },
  },
  {
    id: 'twain_cabin_jackass_hill',
    title: 'The Cabin on Jackass Hill',
    description: 'You found the cabin where Mark Twain spent the winter of 1864-65, listening to the stories that became "The Celebrated Jumping Frog." His initials are carved in the door frame.',
    trigger: [{ type: 'location', locationId: 'jackass_hill' }],
    hint: 'Follow the old trail up Jackass Hill. There\'s a cabin that smells of pipe tobacco.',
    rarity: 'uncommon',
    reward: {
      type: 'lore',
      value: 'twain_cabin',
      description: 'Discovered where Twain transformed from journalist to literary legend',
    },
  },
  {
    id: 'califia_golden_armor',
    title: 'Califia\'s Golden Fragment',
    description: 'Half-buried in creek gravel, you found a piece of golden armor etched with symbols no European could have made. The Miwok elder says it\'s from "before the naming."',
    trigger: [
      { type: 'location', locationId: 'indian_grinding_rock' },
      { type: 'karma_alignment', alignment: 'good' },
      { type: 'stat_threshold', stat: 'investigation', value: 7, comparison: 'gte' },
    ],
    hint: 'The creek near Chaw\'se yields more than gold to those who look with respect.',
    rarity: 'legendary',
    reward: {
      type: 'achievement',
      value: 'califia_touched',
      description: 'Found a trace of the Amazon queen California was named for',
    },
  },
  {
    id: 'roughing_it_manuscript',
    title: 'The Lost Chapter',
    description: 'Tucked inside a saloon wall, you found three handwritten pages of "Roughing It" that Twain apparently discarded — a scathing account of a local judge that was too honest to print.',
    trigger: [
      { type: 'location', locationId: 'mokelumne_hill' },
      { type: 'stat_threshold', stat: 'investigation', value: 6, comparison: 'gte' },
      { type: 'random', chance: 0.1 },
    ],
    hint: 'The old saloon has been renovated many times. Not every wall was built straight.',
    rarity: 'legendary',
    reward: {
      type: 'unlock',
      value: 'roughing_it_lost_chapter',
      description: 'Unlocked a "lost" Twain manuscript (the narrator wrote it)',
    },
  },
  // Legendary secrets
  {
    id: 'lost_dutchman',
    title: 'The Lost Dutchman\'s Clue',
    description: 'You found a cryptic map referencing a lost mine far to the south...',
    trigger: [
      { type: 'outlaw_captured', outlawId: 'black_bart' },
      { type: 'stat_threshold', stat: 'investigation', value: 10, comparison: 'gte' },
    ],
    hint: 'Black Bart collected more than just gold...',
    rarity: 'legendary',
    reward: {
      type: 'item',
      value: 'lost_dutchman_map',
      description: 'A mysterious map pointing to Arizona territory',
    },
  },
  {
    id: 'kennedy_mine_secret',
    title: 'What Lies Beneath',
    description: 'At the deepest point of the Kennedy Mine, you heard something... impossible.',
    trigger: [{ type: 'location', locationId: 'jackson' }, { type: 'time_of_day', time: 'night' }],
    hint: 'The Kennedy Mine goes down nearly a mile...',
    rarity: 'legendary',
    reward: {
      type: 'lore',
      value: 'mine_horror',
      description: 'Some mysteries are best left unexplored',
    },
  },
]

// ============================================
// NPC DIALOGUE LINES (For random encounters)
// ============================================

export const NPC_DIALOGUE = {
  saloon_patron: [
    "They say Black Bart walks these hills still...",
    "Mark Twain used to drink right where you're standing.",
    "The big nugget at Carson Hill? That was just the small one they found.",
    "Don't go to Mokelumne Hill after dark. Just don't.",
    "Cynthia's Inn in West Point has the best biscuits west of Missouri.",
  ],
  miner: [
    "I've been digging twenty years and ain't found nothing but calluses.",
    "My claim's worth millions! I just need investors...",
    "See this gold dust? That's a whole week's work.",
    "The Chinese know tunnels we've never found.",
    "Old-timers say there's a mother lode no one's touched.",
  ],
  stagecoach_driver: [
    "Keep your eyes on the hills at Funk Hill. That's bandit country.",
    "Black Bart never needed a gun. Just pointed a stick at us.",
    "Wells Fargo pays good bounty for information.",
    "The road to Volcano is rough, but the ghosts make it worse.",
    "Sacramento to Jackson in two days if the weather holds.",
  ],
  merchant: [
    "Just got a shipment from San Francisco. Real coffee!",
    "Prices are fair here. Not like those Jackson swindlers.",
    "I don't ask where goods come from. Bad for business.",
    "That assay office will cheat you blind. Bring your gold to me.",
    "Maps? I've got maps. Some even show real places.",
  ],
  mysterious_stranger: [
    "Have we met before? You look familiar...",
    "The hills have eyes, friend. And ears. And memories.",
    "PO8. Remember that name.",
    "Some say I'm a ghost. Some say worse.",
    "The truth about Gold Country? Nobody leaves unchanged.",
  ],
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getRandomTwainQuote(): TwainQuote {
  return TWAIN_QUOTES[Math.floor(Math.random() * TWAIN_QUOTES.length)]
}

export function getTwainQuoteForLocation(locationId: string): TwainQuote | null {
  const locationQuotes = TWAIN_QUOTES.filter(q => q.location === locationId)
  if (locationQuotes.length === 0) return null
  return locationQuotes[Math.floor(Math.random() * locationQuotes.length)]
}

export function getHistoricalFigure(figureId: string): HistoricalFigure | undefined {
  return HISTORICAL_FIGURES.find(f => f.id === figureId)
}

export function getFiguresAtLocation(locationId: string): HistoricalFigure[] {
  return HISTORICAL_FIGURES.filter(f => f.locations.includes(locationId))
}

export function getRandomNPCDialogue(npcType: keyof typeof NPC_DIALOGUE): string {
  const dialogues = NPC_DIALOGUE[npcType]
  return dialogues[Math.floor(Math.random() * dialogues.length)]
}

export function checkEasterEggTrigger(
  egg: EasterEgg,
  context: {
    locationId?: string
    timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night'
    stats?: Record<string, number>
    karma?: { lawful: number; good: number }
    items?: string[]
    outlawsCaptured?: string[]
    chapter?: number
    visitCounts?: Record<string, number>
  }
): boolean {
  return egg.trigger.every(trigger => {
    switch (trigger.type) {
      case 'location':
        return context.locationId === trigger.locationId
      case 'time_of_day':
        return context.timeOfDay === trigger.time
      case 'stat_threshold':
        const statValue = context.stats?.[trigger.stat] ?? 0
        switch (trigger.comparison) {
          case 'gte': return statValue >= trigger.value
          case 'lte': return statValue <= trigger.value
          case 'eq': return statValue === trigger.value
        }
        return false
      case 'karma_alignment':
        if (!context.karma) return false
        switch (trigger.alignment) {
          case 'lawful': return context.karma.lawful < -10
          case 'chaotic': return context.karma.lawful > 10
          case 'good': return context.karma.good < -10
          case 'evil': return context.karma.good > 10
        }
        return false
      case 'item_possessed':
        return context.items?.includes(trigger.itemId) ?? false
      case 'outlaw_captured':
        return context.outlawsCaptured?.includes(trigger.outlawId) ?? false
      case 'random':
        return Math.random() < trigger.chance
      case 'chapter':
        return context.chapter === trigger.chapter
      case 'consecutive_visits':
        return (context.visitCounts?.[trigger.locationId] ?? 0) >= trigger.count
      default:
        return false
    }
  })
}

export function getEasterEggsForLocation(locationId: string): EasterEgg[] {
  return EASTER_EGGS.filter(egg =>
    egg.trigger.some(t => t.type === 'location' && t.locationId === locationId)
  )
}

export function getBlackBartPoemForLocation(locationId: string): typeof BLACK_BART_POEMS[0] | null {
  const poem = BLACK_BART_POEMS.find(p => p.location === locationId)
  return poem || null
}
