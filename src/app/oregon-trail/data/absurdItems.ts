// Absurd Inventory Items - Douglas Adams Style
// Non-physical collectibles, impossible combinations, and consistent illogic

export type ItemCategory =
  | 'physical'       // Normal items
  | 'emotional'      // Feelings as inventory
  | 'conceptual'     // Abstract ideas
  | 'temporal'       // Memories and moments
  | 'paradoxical'    // Items that shouldn't exist
  | 'meta'           // Fourth-wall breaking items

export interface AbsurdItem {
  id: string
  name: string
  category: ItemCategory
  description: string
  narratorDescription?: string  // What the narrator says about it
  obtainedFrom: string
  uses?: ItemUse[]
  combinations?: ItemCombination[]
  weight?: number | 'immeasurable' | 'negative' | 'variable'
  tradeable: boolean
  sellValue?: number | 'priceless' | 'worthless' | 'depends_on_buyer'
}

export interface ItemUse {
  context: string           // When this use is available
  effect: string            // What happens
  consumesItem: boolean
  karmaEffect?: { lawful: number; good: number }
  unlocks?: string          // What this use unlocks
}

export interface ItemCombination {
  withItem: string          // ID of item to combine with
  result: string            // ID of resulting item or effect
  description: string       // What happens during combination
  bothConsumed: boolean
}

export const ABSURD_ITEMS: AbsurdItem[] = [
  // Emotional Items
  {
    id: 'profound_unease',
    name: 'A Profound Sense of Unease',
    category: 'emotional',
    description: 'Obtained after accusing the wrong person. It weighs on you.',
    narratorDescription: 'The unease settles into your inventory like an unwelcome houseguest. It does not pay rent.',
    obtainedFrom: 'Wrong warrant accusation',
    weight: 'variable',
    tradeable: false,
    uses: [
      {
        context: 'Interrogating a witness who seems too confident',
        effect: 'Your unease makes them nervous. They reveal an extra clue.',
        consumesItem: false
      }
    ],
    combinations: [
      {
        withItem: 'false_confidence',
        result: 'realistic_assessment',
        description: 'The unease and confidence cancel out, leaving you with something approximating wisdom.',
        bothConsumed: true
      }
    ]
  },
  {
    id: 'false_confidence',
    name: 'Entirely Unwarranted Confidence',
    category: 'emotional',
    description: 'You feel certain you know what you\'re doing. You definitely do not.',
    narratorDescription: 'The narrator would like to note that this confidence is, statistically speaking, misplaced.',
    obtainedFrom: 'Making an accusation based on a single clue',
    weight: 'negative',  // Makes you feel lighter
    tradeable: false,
    sellValue: 'worthless',
    uses: [
      {
        context: 'Bluffing during interrogation',
        effect: '+2 to Diplomacy check. If you fail, -4 to reputation.',
        consumesItem: true
      }
    ]
  },
  {
    id: 'lingering_doubt',
    name: 'Lingering Doubt',
    category: 'emotional',
    description: 'Is this really the right outlaw? The doubt whispers.',
    obtainedFrom: 'Gathering conflicting clues',
    weight: 'immeasurable',
    tradeable: false,
    uses: [
      {
        context: 'Before issuing a warrant',
        effect: 'Spend 2 extra hours investigating. Reveals if you have enough evidence.',
        consumesItem: true,
        karmaEffect: { lawful: 5, good: 0 }
      }
    ]
  },

  // Conceptual Items
  {
    id: 'absolutely_nothing',
    name: 'Absolutely Nothing',
    category: 'paradoxical',
    description: 'Your pockets were picked, but you caught them. Now you hold nothing itself.',
    narratorDescription: 'The nothing is surprisingly heavy for something that doesn\'t exist.',
    obtainedFrom: 'Catching a pickpocket with a successful Shrewdness check',
    weight: 0,
    tradeable: true,
    sellValue: 'depends_on_buyer',
    uses: [
      {
        context: 'Showing "criminal intent" to a sheriff',
        effect: 'Empty hands prove you\'re not here to cause trouble. Badge obtained.',
        consumesItem: false
      },
      {
        context: 'Paying a debt',
        effect: 'Some debts can only be paid with nothing. Clears one "unpaid debt" item.',
        consumesItem: true
      }
    ]
  },
  {
    id: 'unpaid_debt',
    name: 'An Unpaid Debt',
    category: 'conceptual',
    description: 'You owe someone. The debt is unspecified, which makes it worse.',
    obtainedFrom: 'Accepting help without offering payment',
    weight: 'immeasurable',
    tradeable: false,
    uses: [
      {
        context: 'Meeting the person you owe',
        effect: 'They call in the debt. Random consequence.',
        consumesItem: true
      }
    ]
  },
  {
    id: 'the_benefit_of_doubt',
    name: 'The Benefit of the Doubt',
    category: 'conceptual',
    description: 'Given by a witness. Use wisely.',
    obtainedFrom: 'High reputation with settlers',
    weight: 'variable',
    tradeable: false,
    uses: [
      {
        context: 'Failed skill check during witness interview',
        effect: 'Retry the check once at -2 difficulty.',
        consumesItem: true,
        karmaEffect: { lawful: 0, good: 2 }
      }
    ]
  },

  // Temporal Items
  {
    id: 'memory_of_tune',
    name: 'The Memory of a Tune',
    category: 'temporal',
    description: 'A witness was humming something. The tune stays with you.',
    narratorDescription: 'It\'s quite catchy. The narrator has been humming it for the past three paragraphs.',
    obtainedFrom: 'Successful Shrewdness check when a witness hums',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'Identifying an outlaw\'s accent through their music preference',
        effect: 'Reveals the outlaw\'s accent trait.',
        consumesItem: true
      },
      {
        context: 'Whistling while walking',
        effect: 'Provides mild entertainment. No game effect.',
        consumesItem: false
      }
    ]
  },
  {
    id: 'memory_of_gold',
    name: 'The Memory of Gold',
    category: 'temporal',
    description: 'You once held gold here. The memory shines.',
    obtainedFrom: 'Losing all your gold to gambling or theft',
    weight: 0,
    tradeable: true,
    sellValue: 'depends_on_buyer',
    uses: [
      {
        context: 'Trading with a nostalgic prospector',
        effect: 'Trade for $20 worth of actual gold. "Memories are worth more than gold, son."',
        consumesItem: true
      }
    ]
  },
  {
    id: 'moment_of_clarity',
    name: 'A Moment of Clarity',
    category: 'temporal',
    description: 'Everything makes sense. This feeling will not last.',
    narratorDescription: 'The narrator remembers clarity. Vaguely.',
    obtainedFrom: 'Correctly deducing the outlaw before getting all clues',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'Before any skill check',
        effect: 'Automatic success. Once.',
        consumesItem: true
      }
    ]
  },

  // Paradoxical Items
  {
    id: 'hope',
    name: 'Hope',
    category: 'emotional',
    description: 'You still believe you\'ll catch them.',
    obtainedFrom: 'Starting the game',
    weight: 'negative',  // Makes burdens lighter
    tradeable: false,
    combinations: [
      {
        withItem: 'despair',
        result: 'secret_dialogue',
        description: 'Carrying both hope and despair simultaneously unlocks a hidden conversation.',
        bothConsumed: false
      }
    ]
  },
  {
    id: 'despair',
    name: 'Despair',
    category: 'emotional',
    description: 'You\'re not sure you\'ll ever catch them.',
    obtainedFrom: 'Outlaw reaches 48+ hours ahead',
    weight: 'immeasurable',
    tradeable: false,
    combinations: [
      {
        withItem: 'hope',
        result: 'secret_dialogue',
        description: 'The contradiction unlocks a philosophical conversation with the narrator.',
        bothConsumed: false
      }
    ]
  },
  {
    id: 'schrodingers_evidence',
    name: 'Schrödinger\'s Evidence',
    category: 'paradoxical',
    description: 'This clue is both useful and useless until you observe the outcome of the trial.',
    narratorDescription: 'The evidence exists in a quantum state. The narrator advises against looking too closely.',
    obtainedFrom: 'Finding evidence that matches multiple outlaws equally',
    weight: 'variable',
    tradeable: false,
    uses: [
      {
        context: 'Issuing a warrant',
        effect: '50% chance to count as definitive proof. 50% chance to be thrown out.',
        consumesItem: true
      }
    ]
  },

  // Meta Items
  {
    id: 'fourth_wall_crack',
    name: 'A Crack in the Fourth Wall',
    category: 'meta',
    description: 'The narrator let something slip. You\'re not supposed to have this.',
    narratorDescription: 'The narrator declines to comment on this item. How did you even get it?',
    obtainedFrom: 'Catching the narrator in a lie',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'When the narrator withholds information',
        effect: 'Force the narrator to tell the truth. Once.',
        consumesItem: true
      }
    ]
  },
  {
    id: 'save_point_memory',
    name: 'The Feeling of Having Saved',
    category: 'meta',
    description: 'You get the distinct impression you could return to this moment.',
    narratorDescription: 'This is not that kind of game. The narrator is slightly concerned you found this.',
    obtainedFrom: 'Browser crash during gameplay (auto-granted if game recovers)',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'After making a disastrous decision',
        effect: 'Time reverses by one decision. The narrator sighs heavily.',
        consumesItem: true
      }
    ]
  },
  {
    id: 'narrator_trust',
    name: 'The Narrator\'s Grudging Respect',
    category: 'meta',
    description: 'You\'ve done something the narrator didn\'t expect. They\'re impressed.',
    obtainedFrom: 'Finding a solution the game didn\'t anticipate',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'Any time',
        effect: 'The narrator provides a helpful hint instead of a sarcastic comment.',
        consumesItem: true
      }
    ]
  },

  // Physical (But Weird) Items
  {
    id: 'poetry_fragment',
    name: 'Fragment of Terrible Poetry',
    category: 'physical',
    description: '"I\'ve labored long and hard for bread..." The rest is torn.',
    narratorDescription: 'Black Bart\'s poetry is technically competent but emotionally vacant. Much like the narrator\'s ex.',
    obtainedFrom: 'Crime scene where Black Bart was present',
    weight: 0.01,
    tradeable: true,
    sellValue: 'worthless',
    uses: [
      {
        context: 'Identifying if Black Bart committed the crime',
        effect: 'Confirms Black Bart\'s involvement. Not proof of identity.',
        consumesItem: false
      },
      {
        context: 'Reciting at a poetry reading',
        effect: 'Audience is confused. -2 reputation with settlers, +2 with outlaws.',
        consumesItem: false,
        karmaEffect: { lawful: -2, good: 0 }
      }
    ]
  },
  {
    id: 'spent_bullet',
    name: 'A Spent Bullet',
    category: 'physical',
    description: 'Found at the crime scene. The metal is still warm in your imagination.',
    obtainedFrom: 'Searching a crime scene thoroughly',
    weight: 0.02,
    tradeable: false,
    uses: [
      {
        context: 'Identifying the weapon type',
        effect: 'Reveals whether the outlaw uses colt, winchester, or derringer.',
        consumesItem: false
      }
    ]
  },
  {
    id: 'whiskey_bottle_empty',
    name: 'Empty Whiskey Bottle',
    category: 'physical',
    description: 'The outlaw drained it. The smell lingers.',
    narratorDescription: 'The narrator notes this is not the kind of whiskey a refined person would drink. Then again...',
    obtainedFrom: 'Found at scene of crime by whiskey-vice outlaw',
    weight: 0.5,
    tradeable: true,
    sellValue: 0.05,
    uses: [
      {
        context: 'Confirming vice trait',
        effect: 'Confirms outlaw has whiskey vice.',
        consumesItem: false
      },
      {
        context: 'Throwing at someone',
        effect: 'Deal 1 damage. You monster.',
        consumesItem: true,
        karmaEffect: { lawful: -5, good: -5 }
      }
    ]
  },

  // === HITCHHIKER'S GUIDE SPECIAL ITEMS ===
  {
    id: 'hoopy_towel',
    name: 'A Perfectly Ordinary Towel',
    category: 'physical',
    description: 'A towel is about the most massively useful thing you can have. Any man who can hitch the length of Gold Country and still know where his towel is, is clearly a man to be reckoned with.',
    narratorDescription: 'The narrator notes that this is, in fact, the most sensible thing in your entire inventory.',
    obtainedFrom: 'Purchased with good karma (cookies) or found by true hoopy froods',
    weight: 0.5,
    tradeable: true,
    sellValue: 'priceless',
    uses: [
      {
        context: 'Any skill check',
        effect: '+5% success chance. A towel has immense psychological value.',
        consumesItem: false
      },
      {
        context: 'At Cynthia\'s Inn (Back of Beyond Ranch)',
        effect: '10% discount. Cynthia recognizes a fellow traveler.',
        consumesItem: false,
        karmaEffect: { lawful: 0, good: 5 }
      },
      {
        context: 'River crossing',
        effect: 'Can be used to wave for help if stranded.',
        consumesItem: false
      },
      {
        context: 'Sleeping outdoors',
        effect: 'Restores extra health. Proper rest matters.',
        consumesItem: false
      }
    ]
  },
  {
    id: 'electronic_thumb',
    name: 'Electronic Thumb',
    category: 'paradoxical',
    description: 'A small device for hailing passing starships. In 1849 Gold Country, it seems to attract helpful wagon drivers instead.',
    narratorDescription: 'This device should not work. The narrator chooses not to investigate why it does.',
    obtainedFrom: 'Whiskey Pete, for those who know to ask',
    weight: 0.1,
    tradeable: false,
    sellValue: 'worthless',
    uses: [
      {
        context: 'Stranded on the trail',
        effect: '50% chance a friendly wagon appears. They will not explain where they came from.',
        consumesItem: false
      }
    ]
  },
  {
    id: 'guide_entry_gold_country',
    name: 'Guide Entry: Gold Country',
    category: 'meta',
    description: '"Gold Country: Mostly Harmless." A single page torn from a larger work. Underwhelming but surprisingly accurate.',
    narratorDescription: 'The narrator has opinions about this entry. They are not flattering.',
    obtainedFrom: 'Saying the right words to the right bartender',
    weight: 0,
    tradeable: false,
    uses: [
      {
        context: 'Viewing map',
        effect: 'Reveals one hidden location. The entry was updated recently.',
        consumesItem: false,
        unlocks: 'hidden_location'
      }
    ]
  },
  {
    id: 'pan_galactic_gargle_blaster',
    name: 'Pan Galactic Gargle Blaster (Approximation)',
    category: 'physical',
    description: 'The effect is like having your brains smashed out by a slice of lemon wrapped round a large gold brick. This is a reasonable approximation.',
    narratorDescription: 'The narrator strongly advises against consuming this. The narrator is being ignored.',
    obtainedFrom: 'Whiskey Pete, for those brave or foolish enough',
    weight: 0.3,
    tradeable: false,
    sellValue: 'depends_on_buyer',
    uses: [
      {
        context: 'Consumption',
        effect: 'Vision becomes... interesting. -3 to all checks for 1 hour. +10 to courage. Reveals hidden dialogue options.',
        consumesItem: true,
        karmaEffect: { lawful: -5, good: 0 }
      }
    ]
  },
  {
    id: 'holy_hand_grenade',
    name: 'Holy Hand Grenade of Antioch',
    category: 'physical',
    description: 'First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less.',
    narratorDescription: 'The narrator would like to remind you: three. Not five. Not four. Three.',
    obtainedFrom: 'A mysterious monk near the river crossings',
    weight: 1,
    tradeable: false,
    sellValue: 'priceless',
    uses: [
      {
        context: 'Combat encounter',
        effect: 'Automatic victory. Single use. Count to three first.',
        consumesItem: true,
        karmaEffect: { lawful: 0, good: -10 }
      }
    ]
  },
  {
    id: 'shrubbery',
    name: 'One Small Shrubbery',
    category: 'physical',
    description: 'A nice one. Not too expensive. The kind the Knights would approve of.',
    narratorDescription: 'Ni.',
    obtainedFrom: 'Purchased or found in the wild',
    weight: 2,
    tradeable: true,
    sellValue: 5,
    uses: [
      {
        context: 'Certain eccentric NPCs',
        effect: 'Appeases them immediately. They will stop saying that word.',
        consumesItem: true
      }
    ]
  }
]

// Special combinations and their results
export const SPECIAL_COMBINATIONS: Record<string, {
  items: string[]
  result: string
  description: string
}> = {
  hope_despair: {
    items: ['hope', 'despair'],
    result: 'secret_dialogue',
    description: 'Holding both hope and despair simultaneously unlocks a conversation with the narrator about the nature of detective work.'
  },
  nothing_debt: {
    items: ['absolutely_nothing', 'unpaid_debt'],
    result: 'debt_cleared',
    description: 'You pay your debt with nothing. Surprisingly, this is accepted.'
  },
  memory_gold_nostalgia: {
    items: ['memory_of_gold', 'profound_unease'],
    result: 'wisdom_of_loss',
    description: 'You combine what you\'ve lost with how you feel about it. The result is a kind of wisdom.'
  }
}

// The $42 Easter Egg
export const FORTY_TWO_EFFECT = {
  trigger: 'exactGold',
  amount: 42,
  effect: 'All store prices halved for this transaction',
  narratorComment: 'The universe briefly acknowledges your excellent taste in numbers. The shopkeeper does not know why they\'re giving you a discount.',
  reference: 'The Hitchhiker\'s Guide to the Galaxy'
}

// Absurd actions and their rewards
export const ABSURD_ACTIONS: Record<string, {
  action: string
  context: string
  reward: string
  narratorComment: string
}> = {
  whiskey_horse: {
    action: 'Give whiskey to horse',
    context: 'While at stable with whiskey in inventory',
    reward: 'Horse gains 15% speed boost and develops personality',
    narratorComment: 'Your horse, apparently a connoisseur, develops a worrying personality change along with the speed boost. The narrator is not responsible for what happens next.'
  },
  poetry_reading: {
    action: 'Read Black Bart\'s poetry to outlaws',
    context: 'Captured by outlaw gang',
    reward: 'Outlaws release you out of respect for poetry',
    narratorComment: 'The outlaws have standards. Poor ones, but standards nonetheless.'
  },
  tip_nothing: {
    action: 'Tip the bartender with "absolutely nothing"',
    context: 'At saloon with nothing in inventory',
    reward: 'Bartender is moved by your philosophical generosity. Free drinks.',
    narratorComment: 'The bartender stares at the nothing in their hand. Tears form. "This... this is beautiful."'
  },
  talk_to_narrator: {
    action: 'Attempt to address the narrator directly',
    context: 'After obtaining fourth_wall_crack',
    reward: 'Narrator breaks character and has a real conversation',
    narratorComment: '...Fine. What do you want to talk about?'
  }
}

// Helper function to check if player has specific items for combination
export function canCombine(inventory: string[], combination: string[]): boolean {
  return combination.every(item => inventory.includes(item))
}

// Get item by ID
export function getAbsurdItem(id: string): AbsurdItem | undefined {
  return ABSURD_ITEMS.find(item => item.id === id)
}

// Get all items in a category
export function getItemsByCategory(category: ItemCategory): AbsurdItem[] {
  return ABSURD_ITEMS.filter(item => item.category === category)
}

// Calculate inventory weight (accounting for paradoxical weights)
export function calculateInventoryWeight(items: string[]): number {
  let weight = 0
  for (const itemId of items) {
    const item = getAbsurdItem(itemId)
    if (!item) continue

    if (typeof item.weight === 'number') {
      weight += item.weight
    } else if (item.weight === 'negative') {
      weight -= 1  // Makes you feel lighter
    } else if (item.weight === 'variable') {
      weight += Math.random() * 2 - 1  // Random between -1 and 1
    }
    // 'immeasurable' adds nothing but exists
  }
  return Math.max(0, weight)
}
