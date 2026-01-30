/**
 * Critical Hit/Miss Descriptions
 * 50+ unique Gold Rush themed descriptions for skill check outcomes
 *
 * Context-specific, stat-aware, and narrator-mood-aware.
 * Inspired by Fallout's memorable critical hit text.
 */

export type CriticalContext =
  | 'hunting'
  | 'negotiation'
  | 'river_crossing'
  | 'investigation'
  | 'combat'
  | 'repair'
  | 'gambling'
  | 'survival'
  | 'tracking'
  | 'general'

export type NarratorMoodFilter = 'any' | 'sober' | 'intoxicated' | 'philosophical' | 'dramatic' | 'sardonic'

export interface CriticalDescription {
  id: string
  text: string
  context: CriticalContext
  isSuccess: boolean
  narratorMood: NarratorMoodFilter
  statAware?: string // Optional stat name for extra-specific descriptions
  itemAware?: string // Optional item reference
}

// ============================================
// CRITICAL SUCCESSES
// ============================================

export const CRITICAL_SUCCESSES: CriticalDescription[] = [
  // Hunting
  {
    id: 'hunt_perfect_shot',
    text: 'Your shot echoes through the canyon. The deer drops instantly. Even the vultures are impressed.',
    context: 'hunting',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'hunt_two_for_one',
    text: 'The bullet ricochets off a rock and somehow hits a second rabbit. You stare at your gun, then at the sky, then wisely say nothing.',
    context: 'hunting',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'hunt_saddlemaker',
    text: 'You read the animal\'s movement before it made it. Years with horses taught you how creatures think.',
    context: 'hunting',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Agility'
  },
  {
    id: 'hunt_bear_respect',
    text: 'The bear looks at you. You look at the bear. It turns and walks away. Mutual respect achieved through sheer presence.',
    context: 'hunting',
    isSuccess: true,
    narratorMood: 'dramatic'
  },
  {
    id: 'hunt_narrator_impressed',
    text: 'Your shot ricochets and hits the rattlesnake mid-strike. Even the narrator is impressed.',
    context: 'hunting',
    isSuccess: true,
    narratorMood: 'sardonic'
  },

  // Negotiation
  {
    id: 'negotiate_silver_tongue',
    text: 'Your words flow like Sacramento river gold. The witness can\'t help but tell you everything.',
    context: 'negotiation',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Diplomacy'
  },
  {
    id: 'negotiate_bartender',
    text: 'The bartender leans in conspiratorially. "Between you and me..." - and proceeds to reveal far more than you asked for.',
    context: 'negotiation',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'negotiate_price',
    text: 'The merchant\'s jaw drops. "Nobody\'s ever talked me down that low." You tip your hat and collect your supplies.',
    context: 'negotiation',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'negotiate_lawman',
    text: 'The deputy straightens up. "I\'ve never met a finer detective." He gives you access to the restricted evidence room.',
    context: 'negotiation',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'negotiate_philosophical',
    text: 'You choose exactly the right words at exactly the right moment. Language, the narrator reflects, is the finest gold.',
    context: 'negotiation',
    isSuccess: true,
    narratorMood: 'philosophical'
  },

  // River Crossing
  {
    id: 'river_perfect_ford',
    text: 'You read the current like a book written in water. Your wagon glides across as if the river itself stepped aside.',
    context: 'river_crossing',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'river_caulk_genius',
    text: 'Your caulking job is so perfect that the wagon floats better than a steamboat. The oxen seem confused but grateful.',
    context: 'river_crossing',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Expertise'
  },
  {
    id: 'river_bridge_keeper',
    text: 'You answer the Bridge Keeper\'s absurd question with equal absurdity. He lets you pass, deeply satisfied.',
    context: 'river_crossing',
    isSuccess: true,
    narratorMood: 'sardonic'
  },
  {
    id: 'river_lucky_ford',
    text: 'A sandbar appears exactly where you need to step. Lady Luck doesn\'t wink - she gives you a standing ovation.',
    context: 'river_crossing',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Luck'
  },

  // Investigation
  {
    id: 'investigate_sherlock',
    text: 'The clue clicks into place like the final gear in a pocket watch. You see the entire pattern at once.',
    context: 'investigation',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Shrewdness'
  },
  {
    id: 'investigate_hidden',
    text: 'A glint catches your eye. Behind the loose floorboard: a letter that changes everything.',
    context: 'investigation',
    isSuccess: true,
    narratorMood: 'any'
  },
  {
    id: 'investigate_witness_crack',
    text: 'The witness\'s composure shatters. "Fine! FINE! I saw everything!" They proceed to give a remarkably detailed account.',
    context: 'investigation',
    isSuccess: true,
    narratorMood: 'dramatic'
  },
  {
    id: 'investigate_drunk_narrator',
    text: 'Even the narrator didn\'t see that connection coming. Grudging respect is earned.',
    context: 'investigation',
    isSuccess: true,
    narratorMood: 'intoxicated'
  },
  {
    id: 'investigate_twain',
    text: 'Mark Twain himself couldn\'t have written a more elegant deduction. The truth reveals itself like sunrise over the Sierras.',
    context: 'investigation',
    isSuccess: true,
    narratorMood: 'philosophical'
  },

  // Combat/Confrontation
  {
    id: 'combat_quick_draw',
    text: 'Your hand moves faster than thought. The outlaw\'s gun hasn\'t cleared the holster before they\'re staring down your barrel.',
    context: 'combat',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Agility'
  },
  {
    id: 'combat_iron_jaw',
    text: 'The blow lands square on your jaw. You don\'t flinch. The attacker reconsiders their life choices.',
    context: 'combat',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Durability'
  },
  {
    id: 'combat_dodge',
    text: 'You sidestep the attack with the casual grace of a man avoiding a puddle. The assailant stumbles past you into a horse trough.',
    context: 'combat',
    isSuccess: true,
    narratorMood: 'sardonic'
  },

  // Repair
  {
    id: 'repair_masterwork',
    text: 'The wagon axle snaps back into place with a satisfying click. It\'s now stronger than when it was new.',
    context: 'repair',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Expertise'
  },
  {
    id: 'repair_improvise',
    text: 'Using nothing but a belt buckle and fierce determination, you fashion a repair that would make a blacksmith weep with joy.',
    context: 'repair',
    isSuccess: true,
    narratorMood: 'any'
  },

  // Gambling
  {
    id: 'gamble_royal_flush',
    text: 'Royal flush. The table goes silent. Someone whispers "That ain\'t possible." Oh, but it is.',
    context: 'gambling',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Luck'
  },
  {
    id: 'gamble_bluff',
    text: 'Your poker face would make a statue jealous. The other players fold one by one, defeated by your absolute stillness.',
    context: 'gambling',
    isSuccess: true,
    narratorMood: 'any'
  },

  // Survival
  {
    id: 'survive_disease',
    text: 'Your body fights off the fever with the stubbornness of a mule refusing to cross a bridge. By morning, you\'re stronger.',
    context: 'survival',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Durability'
  },
  {
    id: 'survive_food',
    text: 'You find edible roots, berries, and a honeycomb that the bees have mysteriously abandoned. Nature provides.',
    context: 'survival',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Expertise'
  },

  // Tracking
  {
    id: 'track_footprint',
    text: 'A single boot print in the dust tells you everything: direction, weight, speed, and the slight limp in their left leg.',
    context: 'tracking',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Expertise'
  },
  {
    id: 'track_horse',
    text: 'The horse droppings are still warm. You\'re close. Very close. The outlaw has no idea what\'s coming.',
    context: 'tracking',
    isSuccess: true,
    narratorMood: 'any'
  },

  // General
  {
    id: 'general_legendary',
    text: 'Future generations will tell stories about what you just did. They won\'t believe them, but they\'ll tell them.',
    context: 'general',
    isSuccess: true,
    narratorMood: 'dramatic'
  },
  {
    id: 'general_narrator_jealous',
    text: 'The narrator reluctantly admits that was actually quite impressive. Don\'t let it go to your head.',
    context: 'general',
    isSuccess: true,
    narratorMood: 'sardonic'
  },
  {
    id: 'general_luck_personified',
    text: 'Lady Luck doesn\'t just smile on you. She writes you a love letter.',
    context: 'general',
    isSuccess: true,
    narratorMood: 'any',
    statAware: 'Luck'
  },
]

// ============================================
// CRITICAL FAILURES
// ============================================

export const CRITICAL_FAILURES: CriticalDescription[] = [
  // Hunting
  {
    id: 'hunt_miss_tree',
    text: 'You shoot a tree. The tree is unimpressed. A squirrel chittering from the branches sounds suspiciously like laughter.',
    context: 'hunting',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'hunt_scare_herd',
    text: 'Your shot echoes magnificently. Every animal within three miles is now in the next county.',
    context: 'hunting',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'hunt_own_hat',
    text: 'You shoot your own hat off. The narrator pauses to savor this moment.',
    context: 'hunting',
    isSuccess: false,
    narratorMood: 'sardonic'
  },

  // Negotiation
  {
    id: 'negotiate_insult',
    text: 'You accidentally insult the witness\'s mother, grandmother, and their horse. In one sentence. Impressive, in a way.',
    context: 'negotiation',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'negotiate_worse_price',
    text: 'You negotiate the price UP. The shopkeeper is so delighted they almost feel guilty. Almost.',
    context: 'negotiation',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'negotiate_speechless',
    text: 'Your mouth opens. Nothing comes out. The silence stretches until a tumbleweed rolls between you and the witness.',
    context: 'negotiation',
    isSuccess: false,
    narratorMood: 'dramatic'
  },
  {
    id: 'negotiate_narrator_pity',
    text: 'The narrator feels secondhand embarrassment on your behalf. That takes effort.',
    context: 'negotiation',
    isSuccess: false,
    narratorMood: 'sardonic'
  },

  // River Crossing
  {
    id: 'river_everything_wet',
    text: 'Everything is wet. Everything. Including the gunpowder, the flour, and your dignity.',
    context: 'river_crossing',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'river_ox_refuses',
    text: 'The lead ox plants its hooves and gives you a look that clearly says "No." You respect its opinion. Eventually.',
    context: 'river_crossing',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'river_caulk_fail',
    text: 'Your caulking job lasts exactly four seconds. The wagon takes on water faster than a politician takes bribes.',
    context: 'river_crossing',
    isSuccess: false,
    narratorMood: 'any'
  },

  // Investigation
  {
    id: 'investigate_wrong_clue',
    text: 'You follow the clue with absolute certainty to... the outhouse behind the saloon. It was not a clue.',
    context: 'investigation',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'investigate_narrator_lie',
    text: 'You believe the narrator\'s lie without question. That\'s three hours of investigation time wasted. The narrator feels a twinge of guilt. A small twinge.',
    context: 'investigation',
    isSuccess: false,
    narratorMood: 'intoxicated'
  },
  {
    id: 'investigate_obvious',
    text: 'You miss a clue that a blind prospector could have spotted from across town during a dust storm.',
    context: 'investigation',
    isSuccess: false,
    narratorMood: 'any',
    statAware: 'Shrewdness'
  },

  // Combat
  {
    id: 'combat_trip',
    text: 'You trip over your own spurs. The outlaw watches you fall with a mixture of confusion and pity.',
    context: 'combat',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'combat_wrong_end',
    text: 'You draw your gun backwards. The outlaw helpfully points this out before proceeding to rob you.',
    context: 'combat',
    isSuccess: false,
    narratorMood: 'sardonic'
  },
  {
    id: 'combat_sneeze',
    text: 'At the critical moment, you sneeze. The element of surprise is thoroughly destroyed.',
    context: 'combat',
    isSuccess: false,
    narratorMood: 'any'
  },

  // Repair
  {
    id: 'repair_worse',
    text: 'The wagon was limping before your repair attempt. Now it\'s actively decomposing.',
    context: 'repair',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'repair_thumb',
    text: 'CRACK. That was your thumb, not the nail. The stream of words that follows would make a sailor blush.',
    context: 'repair',
    isSuccess: false,
    narratorMood: 'any'
  },

  // Gambling
  {
    id: 'gamble_bust',
    text: 'You had a winning hand. You had a WINNING HAND. And then you asked for another card. Why?',
    context: 'gambling',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'gamble_bluff_fail',
    text: 'Your poker face crumbles like a dry riverbank. Everyone at the table can see you\'re bluffing, including the dog under the table.',
    context: 'gambling',
    isSuccess: false,
    narratorMood: 'any'
  },

  // Survival
  {
    id: 'survive_bad_berries',
    text: 'Those berries looked perfectly fine. Your stomach has a strongly worded rebuttal. You\'ll be indisposed for a day.',
    context: 'survival',
    isSuccess: false,
    narratorMood: 'any'
  },
  {
    id: 'survive_wrong_direction',
    text: 'You confidently lead the party east. The sun, which is setting behind you, begs to differ.',
    context: 'survival',
    isSuccess: false,
    narratorMood: 'any',
    statAware: 'Expertise'
  },

  // Tracking
  {
    id: 'track_own_prints',
    text: 'You\'ve been tracking someone for two hours. That someone was you. You\'ve been walking in circles.',
    context: 'tracking',
    isSuccess: false,
    narratorMood: 'any'
  },

  // General
  {
    id: 'general_narrator_delight',
    text: 'The narrator cackles with glee. This is exactly the kind of disaster that makes the story interesting.',
    context: 'general',
    isSuccess: false,
    narratorMood: 'sardonic'
  },
  {
    id: 'general_philosophical_fail',
    text: 'Perhaps failure is the universe\'s way of saying "try again, but differently." Or perhaps it\'s just saying "no."',
    context: 'general',
    isSuccess: false,
    narratorMood: 'philosophical'
  },
  {
    id: 'general_unease',
    text: 'You negotiate peace while holding A Profound Sense of Unease. It does not help.',
    context: 'general',
    isSuccess: false,
    narratorMood: 'any',
    itemAware: 'A Profound Sense of Unease'
  },
  {
    id: 'general_dramatic_fail',
    text: 'In the annals of frontier history, this moment will be quietly omitted. Some failures are best forgotten.',
    context: 'general',
    isSuccess: false,
    narratorMood: 'dramatic'
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a critical description matching the context and outcome
 */
export function getCriticalDescription(
  isSuccess: boolean,
  context: CriticalContext = 'general',
  narratorMood?: string,
  stat?: string,
  itemName?: string
): string {
  const pool = isSuccess ? CRITICAL_SUCCESSES : CRITICAL_FAILURES

  // Filter by context (include 'general' as fallback)
  let candidates = pool.filter(d => d.context === context || d.context === 'general')

  // Prefer stat-aware descriptions if stat is provided
  if (stat) {
    const statSpecific = candidates.filter(d => d.statAware === stat)
    if (statSpecific.length > 0 && Math.random() < 0.6) {
      candidates = statSpecific
    }
  }

  // Prefer item-aware descriptions if item is provided
  if (itemName) {
    const itemSpecific = candidates.filter(d => d.itemAware === itemName)
    if (itemSpecific.length > 0) {
      candidates = itemSpecific
    }
  }

  // Prefer mood-matching descriptions
  if (narratorMood) {
    const moodSpecific = candidates.filter(
      d => d.narratorMood === narratorMood || d.narratorMood === 'any'
    )
    if (moodSpecific.length > 0) {
      candidates = moodSpecific
    }
  }

  // If no candidates, fall back to all descriptions for this outcome
  if (candidates.length === 0) {
    candidates = pool.filter(d => d.context === 'general')
  }

  // Random selection
  const selected = candidates[Math.floor(Math.random() * candidates.length)]
  return selected?.text || (isSuccess
    ? 'A remarkable success that defies description.'
    : 'A failure of historic proportions.')
}

/**
 * Get all descriptions for a specific context (for preview/testing)
 */
export function getDescriptionsForContext(
  context: CriticalContext,
  isSuccess?: boolean
): CriticalDescription[] {
  const all = [...CRITICAL_SUCCESSES, ...CRITICAL_FAILURES]
  return all.filter(d => {
    if (d.context !== context) return false
    if (isSuccess !== undefined && d.isSuccess !== isSuccess) return false
    return true
  })
}
