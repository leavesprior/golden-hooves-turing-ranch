/**
 * Discoverable Traits System
 *
 * Fallout + Neverwinter Nights inspired trait discovery for the Bobr Game.
 * Traits are hidden until the player meets specific conditions, then
 * permanently unlock with stat bonuses and special abilities.
 *
 * These complement the base CharacterTrait set in characterContext.tsx
 * (eagle_eye, silver_tongue, iron_constitution, born_lucky, trail_hardened,
 *  quick_draw, poker_face, sympathetic_ear) -- none are duplicated here.
 *
 * Visual language: sepia / amber / gold / brown Gold Rush tones.
 */

import type { StatName } from '../characterContext'

// ============================================================================
// TYPES
// ============================================================================

export type TraitCategory =
  | 'combat'
  | 'social'
  | 'exploration'
  | 'mystery'
  | 'ranch'
  | 'meta'

export type TraitRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface DiscoverableTrait {
  id: string
  name: string
  description: string              // Full description when discovered
  hintText: string                 // Shows as "???" with this hint in character sheet
  statModifiers: Partial<Record<StatName, number>>
  specialAbility?: string          // Gameplay effect description
  discoveryCondition: TraitDiscoveryCondition
  category: TraitCategory
  rarity: TraitRarity
}

export interface TraitDiscoveryCondition {
  type:
    | 'stat_check_count'
    | 'location_visit'
    | 'npc_mood_max'
    | 'easter_egg'
    | 'faction_rank'
    | 'outlaw_caught'
    | 'ranch_milestone'
    | 'item_collected'
    | 'critical_roll'
    | 'choice_made'
    | 'combined'
  description: string              // Human-readable condition description
  requirements: TraitRequirement
}

export type TraitRequirement =
  | { type: 'stat_checks'; stat: StatName; count: number }
  | { type: 'location'; locationId: string; action?: string }
  | { type: 'mood_level'; minLevel: 5; count: number }
  | { type: 'easter_egg'; eggId: string; count: number }
  | { type: 'faction'; factionId: string; rank: string }
  | { type: 'outlaws_caught'; count: number }
  | { type: 'ranch'; milestone: string }
  | { type: 'item'; itemId: string }
  | { type: 'critical_rolls'; count: number; successOnly?: boolean }
  | { type: 'choice'; choiceId: string }
  | { type: 'combined'; all: TraitRequirement[] }

// ============================================================================
// DISCOVERABLE TRAITS  (18 total)
// ============================================================================

export const DISCOVERABLE_TRAITS: DiscoverableTrait[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // EXPLORATION  (5 traits)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'frog_whisperer',
    name: 'Frog Whisperer',
    description:
      'At the frog pond behind Ross\'s Saloon in Angels Camp, you felt an uncanny kinship ' +
      'with the croaking chorus. The celebrated jumping frogs of Calaveras County recognize ' +
      'you as one of their own -- and the rest of the animal kingdom seems to agree.',
    hintText: 'Something croaks in appreciation near a famous pond...',
    statModifiers: { Luck: 2 },
    specialAbility: '+2 Luck during all animal encounters (hunting, livestock, predator events)',
    discoveryCondition: {
      type: 'combined',
      description: 'Visit Angels Camp and pass a Luck check at the frog pond',
      requirements: {
        type: 'combined',
        all: [
          { type: 'location', locationId: 'angels_camp', action: 'frog_pond_visit' },
          { type: 'stat_checks', stat: 'Luck', count: 1 },
        ],
      },
    },
    category: 'exploration',
    rarity: 'rare',
  },

  {
    id: 'gold_nose',
    name: 'Gold Nose',
    description:
      'Months of dust and river-silt have trained your senses to a fine edge. ' +
      'You can smell color in the gravel -- the faint metallic tang that means ' +
      'pay-dirt is close. Old-timers swear you could sniff out a nugget in a snowstorm.',
    hintText: 'Those who dig in many places learn to sense what lies beneath...',
    statModifiers: { Expertise: 1 },
    specialAbility: 'Increased gold yield when panning or searching rivers',
    discoveryCondition: {
      type: 'location_visit',
      description: 'Visit 3 different mining locations',
      requirements: {
        type: 'combined',
        all: [
          { type: 'location', locationId: 'kennedy_mine' },
          { type: 'location', locationId: 'carson_hill' },
          { type: 'location', locationId: 'mokelumne_hill' },
        ],
      },
    },
    category: 'exploration',
    rarity: 'common',
  },

  {
    id: 'iron_horse',
    name: 'Iron Horse',
    description:
      'Five hundred miles of rutted trails, swollen rivers, and sun-bleached ' +
      'passes have forged your body into something that barely notices hardship. ' +
      'Where others collapse from trail fever, you merely loosen your collar.',
    hintText: 'The trail itself tempers those who walk it long enough...',
    statModifiers: { Durability: 2 },
    specialAbility: 'Reduced chance of contracting travel illnesses (dysentery, cholera, trail fever)',
    discoveryCondition: {
      type: 'stat_check_count',
      description: 'Travel 500 or more miles on the trail',
      requirements: { type: 'stat_checks', stat: 'Durability', count: 10 },
    },
    category: 'exploration',
    rarity: 'common',
  },

  {
    id: 'sourdough',
    name: 'Sourdough',
    description:
      'Thirty dawns on the trail and you have become part of the landscape. ' +
      'You know which berries won\'t kill you, how to stretch a pound of flour ' +
      'into a week of biscuits, and why the old-timers always camp uphill from ' +
      'the creek. The Gold Country has claimed you as its own.',
    hintText: 'Only time on the trail earns this mark of respect...',
    statModifiers: { Durability: 1, Expertise: 1 },
    specialAbility: 'Food consumption reduced by 25%; foraging yields increased',
    discoveryCondition: {
      type: 'stat_check_count',
      description: 'Survive 30 or more trail days',
      requirements: { type: 'stat_checks', stat: 'Expertise', count: 6 },
    },
    category: 'exploration',
    rarity: 'common',
  },

  {
    id: 'prospectors_eye',
    name: 'Prospector\'s Eye',
    description:
      'While most forty-niners chase rumors, you found the hidden cache that ' +
      'the old Spaniard buried under the manzanita. A knack for spotting what ' +
      'others miss translates into steady income -- gold has a way of finding you.',
    hintText: 'A keen eye might spot what a thousand boots have walked over...',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'Bonus Neutral Karma income from passive gold discovery each season',
    discoveryCondition: {
      type: 'item_collected',
      description: 'Find the hidden gold cache',
      requirements: { type: 'item', itemId: 'hidden_gold_cache' },
    },
    category: 'exploration',
    rarity: 'uncommon',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SOCIAL  (2 traits)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'golden_tongue',
    name: 'Golden Tongue',
    description:
      'Five times you have talked your way through a locked door, a drawn gun, ' +
      'or a stubborn witness. Your words carry the warm weight of California ' +
      'gold -- people listen, and they believe. Even strangers greet you like ' +
      'an old friend.',
    hintText: 'Those who speak well enough, often enough, earn a gilded reputation...',
    statModifiers: { Diplomacy: 1 },
    specialAbility: 'All NPCs start at one mood level higher than default',
    discoveryCondition: {
      type: 'stat_check_count',
      description: 'Pass 5 Diplomacy skill checks',
      requirements: { type: 'stat_checks', stat: 'Diplomacy', count: 5 },
    },
    category: 'social',
    rarity: 'uncommon',
  },

  {
    id: 'outlaws_friend',
    name: 'Outlaw\'s Friend',
    description:
      'You have earned a reputation in the wrong circles -- or the right ones, ' +
      'depending on your perspective. Bart\'s boys nod when you ride past, and ' +
      'whispered intelligence flows to you from cantinas and card tables. The ' +
      'law may not approve, but your informants never lie.',
    hintText: 'Some friendships are forged on the wrong side of the law...',
    statModifiers: { Luck: 1 },
    specialAbility: 'Access to informant network: receive tip-offs about outlaw movements and hidden stashes',
    discoveryCondition: {
      type: 'faction_rank',
      description: 'Reach "Accepted" rank with the Outlaw faction',
      requirements: { type: 'faction', factionId: 'outlaws', rank: 'accepted' },
    },
    category: 'social',
    rarity: 'rare',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MYSTERY  (4 traits)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'twain_scholar',
    name: 'Twain Scholar',
    description:
      'Five hidden quotations, five obscure references, five moments of ' +
      'recognition -- you have tracked Samuel Clemens across Gold Country with ' +
      'the tenacity of a Pinkerton detective. Every clue he left behind now ' +
      'shines twice as bright in your journal.',
    hintText: 'A certain humorist left breadcrumbs across the Mother Lode...',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'Educational clues are worth double experience points',
    discoveryCondition: {
      type: 'easter_egg',
      description: 'Discover 5 Mark Twain easter eggs',
      requirements: { type: 'easter_egg', eggId: 'twain', count: 5 },
    },
    category: 'mystery',
    rarity: 'uncommon',
  },

  {
    id: 'bounty_hunter',
    name: 'Bounty Hunter',
    description:
      'Three outlaws brought to justice, three Wells Fargo bounty vouchers cashed. ' +
      'You have developed a nose for deception and the patience to build a case. ' +
      'Every investigation now yields an extra thread to pull.',
    hintText: 'Justice serves those who serve it often enough...',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'Gain one bonus clue per investigation at each new location',
    discoveryCondition: {
      type: 'outlaw_caught',
      description: 'Catch 3 outlaws',
      requirements: { type: 'outlaws_caught', count: 3 },
    },
    category: 'mystery',
    rarity: 'uncommon',
  },

  {
    id: 'master_detective',
    name: 'Master Detective',
    description:
      'Every last member of Bart\'s gang wears iron bracelets because of you. ' +
      'The Pinkertons want you on payroll, Wells Fargo named a coach after you, ' +
      'and the Governor sent a personal letter of commendation. Your deductive ' +
      'faculties are the stuff of dime novels.',
    hintText: 'Only one who clears the entire docket earns this distinction...',
    statModifiers: { Shrewdness: 2 },
    specialAbility: 'All clues are flagged as reliable; contradictions auto-highlighted in journal',
    discoveryCondition: {
      type: 'outlaw_caught',
      description: 'Catch every outlaw in Black Bart\'s gang',
      requirements: { type: 'outlaws_caught', count: 10 },
    },
    category: 'mystery',
    rarity: 'legendary',
  },

  {
    id: 'pinkerton_star',
    name: 'Pinkerton Star',
    description:
      'The brass star of an Idolized Pinkerton operative gleams on your lapel. ' +
      'The Agency\'s federal vault -- a repository of cold-case evidence and ' +
      'classified intelligence -- is now open to you. No door in Gold Country ' +
      'stays locked when you knock.',
    hintText: 'The Agency rewards its most devoted operatives with secrets of the vault...',
    statModifiers: { Shrewdness: 1, Expertise: 1 },
    specialAbility: 'Access to the Federal Vault: unique evidence and classified dossiers for all cases',
    discoveryCondition: {
      type: 'faction_rank',
      description: 'Reach "Idolized" rank with the Pinkerton faction',
      requirements: { type: 'faction', factionId: 'pinkertons', rank: 'idolized' },
    },
    category: 'mystery',
    rarity: 'rare',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COMBAT  (2 traits)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description:
      'Five impossible shots, five plumes of gunsmoke, five stunned witnesses. ' +
      'Your hand-eye coordination borders on preternatural. When lead flies, ' +
      'you move like a rattlesnake strikes -- fast, precise, and final.',
    hintText: 'The quickest hands prove themselves when the stakes are highest...',
    statModifiers: { Agility: 2 },
    specialAbility: '+2 Agility bonus applied during all combat encounters',
    discoveryCondition: {
      type: 'critical_roll',
      description: 'Roll 5 critical successes on Agility checks',
      requirements: { type: 'critical_rolls', count: 5, successOnly: true },
    },
    category: 'combat',
    rarity: 'uncommon',
  },

  {
    id: 'lucky_strike',
    name: 'Lucky Strike',
    description:
      'Three impossible outcomes in a row. The old card players at the Empire ' +
      'Saloon say you sold your soul to the Devil at a crossroads -- but you ' +
      'know it is something stranger. Fortune clings to you like gold dust to ' +
      'a wet pan. Your critical range has permanently widened.',
    hintText: 'Fortune favors the absurdly, persistently fortunate...',
    statModifiers: { Luck: 1 },
    specialAbility: 'Critical success range extended by 1 (stacks with Born Lucky)',
    discoveryCondition: {
      type: 'critical_roll',
      description: 'Roll 3 critical successes in a row',
      requirements: { type: 'critical_rolls', count: 3, successOnly: true },
    },
    category: 'combat',
    rarity: 'rare',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RANCH  (2 traits)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'ranch_baron',
    name: 'Ranch Baron',
    description:
      'Five tiers of fence, a hundred head of stock, and the finest premium ' +
      'ranch west of the Mississippi. Neighboring ranchers visit just to gawk. ' +
      'Your livestock are the fattest, happiest creatures in Calaveras County, ' +
      'and they repay you with abundance.',
    hintText: 'Only the most dedicated stockman builds the finest spread in Gold Country...',
    statModifiers: { Expertise: 2 },
    specialAbility: 'All livestock produce 50% more goods (milk, eggs, cheese)',
    discoveryCondition: {
      type: 'ranch_milestone',
      description: 'Upgrade your ranch fence to Tier 5 (Premium Ranch)',
      requirements: { type: 'ranch', milestone: 'fence_tier_5' },
    },
    category: 'ranch',
    rarity: 'rare',
  },

  {
    id: 'horse_whisperer',
    name: 'Horse Whisperer',
    description:
      'Ten horses know your voice, your step, your scent. They come when you ' +
      'whistle and run when you lean forward. Trail hands say you were a mustang ' +
      'in a past life. On the road, your string moves like the wind itself.',
    hintText: 'Hooves thunder for those who earn the herd\'s trust...',
    statModifiers: { Agility: 1 },
    specialAbility: 'Travel speed increased by 20%; horses never bolt during random events',
    discoveryCondition: {
      type: 'ranch_milestone',
      description: 'Own 10 or more horses at your ranch',
      requirements: { type: 'ranch', milestone: 'horses_owned_10' },
    },
    category: 'ranch',
    rarity: 'uncommon',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // META  (3 traits -- fourth-wall / narrator / easter egg)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'narrators_nemesis',
    name: 'Narrator\'s Nemesis',
    description:
      'Three times you peeked behind the curtain. Three times you caught the ' +
      'narrator in a bold-faced fabrication. He knows you are watching now, ' +
      'and his lies have grown subtler -- but less frequent. The fourth wall ' +
      'trembles when you walk into the room.',
    hintText: 'The voice that tells your story does not always tell the truth...',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'The unreliable narrator lies less often; blatant lies are flagged with a subtle tell',
    discoveryCondition: {
      type: 'easter_egg',
      description: 'Trigger 3 fourth-wall break easter eggs',
      requirements: { type: 'easter_egg', eggId: 'fourth_wall', count: 3 },
    },
    category: 'meta',
    rarity: 'rare',
  },

  {
    id: 'snake_oil_resistant',
    name: 'Snake Oil Resistant',
    description:
      'Three times the narrator tried to sell you a tall tale, and three times ' +
      'you called his bluff. Charlatans, con men, and unreliable storytellers ' +
      'have met their match. When information is suspect, a quiet warning ' +
      'now sounds in the back of your mind.',
    hintText: 'Skeptics who catch the storyteller lying earn a certain immunity...',
    statModifiers: { Shrewdness: 1 },
    specialAbility: 'Narrator flags unreliable information with a visible "rumor" badge',
    discoveryCondition: {
      type: 'easter_egg',
      description: 'Successfully detect 3 narrator lies',
      requirements: { type: 'easter_egg', eggId: 'narrator_lie_detected', count: 3 },
    },
    category: 'meta',
    rarity: 'rare',
  },

  {
    id: 'bridge_keepers_bane',
    name: 'Bridge Keeper\'s Bane',
    description:
      'You defeated the Bridge Keeper -- not by answering his questions, but by ' +
      'turning them back on him. He tumbled into the gorge with a startled ' +
      '"Auuuuuuugh!" and you crossed in triumph. Absurdity itself bows before ' +
      'your wit. Monty Python would be proud.',
    hintText: 'A certain keeper of bridges fears the one who asks the right counter-question...',
    statModifiers: { Luck: 2 },
    specialAbility: 'Immune to absurd random events; "impossible" skill checks gain a hidden +2 bonus',
    discoveryCondition: {
      type: 'easter_egg',
      description: 'Defeat the Bridge Keeper by reversing his questioning',
      requirements: { type: 'easter_egg', eggId: 'bridge_keeper_defeated', count: 1 },
    },
    category: 'meta',
    rarity: 'legendary',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns all discoverable traits belonging to the given category.
 */
export function getTraitsByCategory(category: TraitCategory): DiscoverableTrait[] {
  return DISCOVERABLE_TRAITS.filter(t => t.category === category)
}

/**
 * Returns all discoverable traits of the given rarity.
 */
export function getTraitsByRarity(rarity: DiscoverableTrait['rarity']): DiscoverableTrait[] {
  return DISCOVERABLE_TRAITS.filter(t => t.rarity === rarity)
}

/**
 * Returns display-safe data for a discoverable trait.
 * If the trait has not been discovered yet, the name shows as "???" and
 * the description is replaced by the hint text.
 */
export function getDiscoveredTraitDisplay(
  traitId: string,
  isDiscovered: boolean
): { name: string; description: string; icon: string } {
  const trait = DISCOVERABLE_TRAITS.find(t => t.id === traitId)

  if (!trait) {
    return { name: '???', description: 'Unknown trait.', icon: '?' }
  }

  if (!isDiscovered) {
    return {
      name: '???',
      description: trait.hintText,
      icon: getCategoryLockedIcon(trait.category),
    }
  }

  return {
    name: trait.name,
    description: trait.description,
    icon: getTraitCategoryIcon(trait.category),
  }
}

/**
 * Returns a sepia-palette hex color for the given rarity tier.
 *
 *   common    - dusty amber   (#a08050)
 *   uncommon  - trail green   (#22c55e)
 *   rare      - river blue    (#3b82f6)
 *   legendary - California gold (#d4a843)
 */
export function getTraitRarityColor(rarity: DiscoverableTrait['rarity']): string {
  switch (rarity) {
    case 'common':
      return '#a08050'
    case 'uncommon':
      return '#22c55e'
    case 'rare':
      return '#3b82f6'
    case 'legendary':
      return '#d4a843'
  }
}

/**
 * Returns a human-readable label for the rarity tier.
 */
export function getTraitRarityLabel(rarity: DiscoverableTrait['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'Common'
    case 'uncommon':
      return 'Uncommon'
    case 'rare':
      return 'Rare'
    case 'legendary':
      return 'Legendary'
  }
}

/**
 * Returns an emoji icon representing the trait category.
 */
export function getTraitCategoryIcon(category: TraitCategory): string {
  switch (category) {
    case 'combat':
      return '\u{1F52B}'   // pistol
    case 'social':
      return '\u{1F91D}'   // handshake
    case 'exploration':
      return '\u{1F9ED}'   // compass
    case 'mystery':
      return '\u{1F50D}'   // magnifying glass
    case 'ranch':
      return '\u{1F434}'   // horse face
    case 'meta':
      return '\u{1F3AD}'   // performing arts / masks
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Returns a "locked" icon for undiscovered traits, hinting at category.
 */
function getCategoryLockedIcon(category: TraitCategory): string {
  switch (category) {
    case 'combat':
      return '\u{2753}'   // question mark (red)
    case 'social':
      return '\u{2753}'
    case 'exploration':
      return '\u{2753}'
    case 'mystery':
      return '\u{2753}'
    case 'ranch':
      return '\u{2753}'
    case 'meta':
      return '\u{2753}'
  }
}
