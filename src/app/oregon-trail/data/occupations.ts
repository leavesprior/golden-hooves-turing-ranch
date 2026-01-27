// Oregon Trail Occupation System
// Classic 8 occupations affecting starting karma, score multiplier, and special abilities
// Inspired by the original Oregon Trail's occupation-based scoring

import { type StatName } from '../characterContext'

export type Occupation =
  | 'banker'
  | 'carpenter'
  | 'farmer'
  | 'doctor'
  | 'merchant'
  | 'blacksmith'
  | 'teacher'
  | 'saddlemaker'

export interface OccupationData {
  id: Occupation
  name: string
  icon: string
  description: string
  flavorText: string

  // Starting resources
  startingKarma: {
    neutral: number   // 🪙 Starting karma coins
    good: number      // 🍪 Starting good karma
    bad: number       // 🪨 Starting karma debt
  }

  // Final score multiplier (like original Oregon Trail)
  // Banker = 1x, Farmer = 3x, etc.
  scoreMultiplier: number

  // Stat bonuses (applied on top of background)
  statBonuses: Partial<Record<StatName, number>>

  // Special ability
  specialAbility: {
    name: string
    description: string
    mechanic: string  // For code reference
  }

  // Starting supplies bonus/penalty
  supplyModifier?: {
    food?: number
    ammunition?: number
    medicine?: number
    spareParts?: number
    oxen?: number
  }

  // Reputation modifiers by faction
  reputationModifiers?: {
    lawful?: number     // With law enforcement, Pinkertons
    merchants?: number  // With shopkeepers
    outlaws?: number    // With criminal elements
    settlers?: number   // With common folk
  }
}

export const OCCUPATIONS: Record<Occupation, OccupationData> = {
  banker: {
    id: 'banker',
    name: 'Banker from Boston',
    icon: '🏦',
    description: 'Wealthy but inexperienced. Money solves most problems... most.',
    flavorText: 'You\'ve traded ledgers for adventure. The frontier doesn\'t accept bank drafts.',

    startingKarma: {
      neutral: 800,  // Most starting money
      good: 0,
      bad: 0
    },

    scoreMultiplier: 1,  // Lowest multiplier (easy mode)

    statBonuses: {
      Diplomacy: 2,  // Good at negotiating
    },

    specialAbility: {
      name: 'Deep Pockets',
      description: 'Shop prices reduced by 10%',
      mechanic: 'shop_discount'
    },

    supplyModifier: {
      food: 50,
      medicine: 2
    },

    reputationModifiers: {
      merchants: 10,
      settlers: -5
    }
  },

  carpenter: {
    id: 'carpenter',
    name: 'Carpenter from Ohio',
    icon: '🔨',
    description: 'Skilled with tools. Your wagon fears no breakdown.',
    flavorText: 'Wood speaks to you. It usually says "don\'t hit your thumb."',

    startingKarma: {
      neutral: 400,
      good: 5,
      bad: 0
    },

    scoreMultiplier: 2,

    statBonuses: {
      Expertise: 3,  // Repair skills
    },

    specialAbility: {
      name: 'Master Craftsman',
      description: 'Wagon repairs use half the spare parts',
      mechanic: 'repair_efficiency'
    },

    supplyModifier: {
      spareParts: 3
    },

    reputationModifiers: {
      settlers: 5
    }
  },

  farmer: {
    id: 'farmer',
    name: 'Farmer from Illinois',
    icon: '🌾',
    description: 'Hard working and practical. The earth provides.',
    flavorText: 'You traded soil for trail dust. At least the stars are the same.',

    startingKarma: {
      neutral: 300,  // Least starting money
      good: 10,      // But good karma from honest work
      bad: 0
    },

    scoreMultiplier: 3,  // Highest multiplier (hard mode)

    statBonuses: {
      Durability: 2,
      Expertise: 1
    },

    specialAbility: {
      name: 'Hearty Stock',
      description: 'Oxen health degrades 50% slower',
      mechanic: 'oxen_durability'
    },

    supplyModifier: {
      food: 100,  // Farmers know how to pack food
      oxen: 1     // Bonus ox
    },

    reputationModifiers: {
      settlers: 10,
      merchants: -5
    }
  },

  doctor: {
    id: 'doctor',
    name: 'Doctor from Philadelphia',
    icon: '⚕️',
    description: 'Healer of ailments. Death respects your badge. Sometimes.',
    flavorText: 'Your Hippocratic oath extends to the frontier. Mostly.',

    startingKarma: {
      neutral: 500,
      good: 5,
      bad: 0
    },

    scoreMultiplier: 2,

    statBonuses: {
      Shrewdness: 2,
      Durability: 1
    },

    specialAbility: {
      name: 'Frontier Medicine',
      description: 'Medicine is twice as effective. Disease recovery time halved.',
      mechanic: 'medicine_boost'
    },

    supplyModifier: {
      medicine: 5
    },

    reputationModifiers: {
      lawful: 5,
      settlers: 5
    }
  },

  merchant: {
    id: 'merchant',
    name: 'Merchant from New York',
    icon: '🛒',
    description: 'Shrewd trader. Every exchange is an opportunity.',
    flavorText: 'Buy low, sell high. The frontier is just another market.',

    startingKarma: {
      neutral: 600,
      good: 0,
      bad: 5  // Some questionable deals in your past
    },

    scoreMultiplier: 1.5,

    statBonuses: {
      Diplomacy: 2,
      Shrewdness: 1
    },

    specialAbility: {
      name: 'Keen Haggler',
      description: 'Selling items yields 25% more karma',
      mechanic: 'sell_bonus'
    },

    supplyModifier: {
      food: 30,
      ammunition: 40
    },

    reputationModifiers: {
      merchants: 15,
      outlaws: 5
    }
  },

  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith from Pennsylvania',
    icon: '⚒️',
    description: 'Forger of metal. Strength and skill in equal measure.',
    flavorText: 'Iron bends to your will. Most things do, eventually.',

    startingKarma: {
      neutral: 350,
      good: 5,
      bad: 0
    },

    scoreMultiplier: 2.5,

    statBonuses: {
      Durability: 2,
      Expertise: 2
    },

    specialAbility: {
      name: 'Iron Will',
      description: 'Wagon condition degrades slower. Can repair without spare parts (once per landmark)',
      mechanic: 'iron_repairs'
    },

    supplyModifier: {
      spareParts: 2,
      ammunition: 20
    },

    reputationModifiers: {
      settlers: 5,
      lawful: 5
    }
  },

  teacher: {
    id: 'teacher',
    name: 'Teacher from Connecticut',
    icon: '📚',
    description: 'Educated and observant. Knowledge is the ultimate supply.',
    flavorText: 'You traded the classroom for the classroom of life. It\'s less metaphorical than you\'d hoped.',

    startingKarma: {
      neutral: 350,
      good: 15,  // Respected profession
      bad: 0
    },

    scoreMultiplier: 2.5,

    statBonuses: {
      Shrewdness: 3,  // Educated, observant
    },

    specialAbility: {
      name: 'Quick Learner',
      description: 'Clue analysis is more accurate. Mystery skill checks get +2 bonus.',
      mechanic: 'clue_bonus'
    },

    supplyModifier: {
      medicine: 1
    },

    reputationModifiers: {
      lawful: 10,
      settlers: 10
    }
  },

  saddlemaker: {
    id: 'saddlemaker',
    name: 'Saddlemaker from Kentucky',
    icon: '🎠',
    description: 'Expert in leather and animals. The trail was made for you.',
    flavorText: 'If it has hooves, you understand it. If it has leather, you can fix it.',

    startingKarma: {
      neutral: 350,
      good: 5,
      bad: 0
    },

    scoreMultiplier: 2.5,

    statBonuses: {
      Agility: 2,
      Expertise: 1
    },

    specialAbility: {
      name: 'Animal Whisperer',
      description: 'Hunting success rate +20%. Oxen rarely get injured.',
      mechanic: 'animal_affinity'
    },

    supplyModifier: {
      ammunition: 30
    },

    reputationModifiers: {
      settlers: 5
    }
  }
}

// Get occupation array for selection UI
export function getOccupationList(): OccupationData[] {
  return Object.values(OCCUPATIONS)
}

// Get occupation by ID
export function getOccupation(id: Occupation): OccupationData {
  return OCCUPATIONS[id]
}

// Calculate final score with occupation multiplier
export function calculateFinalScore(
  baseScore: number,
  occupation: Occupation
): { score: number; multiplier: number; breakdown: string } {
  const occupationData = OCCUPATIONS[occupation]
  const multiplier = occupationData.scoreMultiplier
  const finalScore = Math.floor(baseScore * multiplier)

  return {
    score: finalScore,
    multiplier,
    breakdown: `Base: ${baseScore} × ${occupationData.name} (${multiplier}x) = ${finalScore}`
  }
}

// Get difficulty description based on occupation
export function getOccupationDifficulty(occupation: Occupation): {
  level: 'easy' | 'medium' | 'hard' | 'expert'
  description: string
} {
  const multiplier = OCCUPATIONS[occupation].scoreMultiplier

  if (multiplier <= 1) {
    return {
      level: 'easy',
      description: 'Recommended for new players. More starting resources, lower score potential.'
    }
  } else if (multiplier <= 1.5) {
    return {
      level: 'medium',
      description: 'Balanced experience. Moderate resources and scoring.'
    }
  } else if (multiplier <= 2.5) {
    return {
      level: 'hard',
      description: 'Challenging journey. Fewer resources, higher score potential.'
    }
  } else {
    return {
      level: 'expert',
      description: 'For experienced travelers. Minimal resources, maximum glory.'
    }
  }
}

// Check if occupation has a specific ability
export function hasAbility(occupation: Occupation, abilityMechanic: string): boolean {
  return OCCUPATIONS[occupation].specialAbility.mechanic === abilityMechanic
}

// Get starting supplies with occupation modifiers
export function getStartingSupplies(occupation: Occupation): {
  food: number
  ammunition: number
  medicine: number
  spareParts: number
  oxen: number
} {
  const base = {
    food: 200,
    ammunition: 80,
    medicine: 3,
    spareParts: 2,
    oxen: 4
  }

  const mods = OCCUPATIONS[occupation].supplyModifier || {}

  return {
    food: base.food + (mods.food || 0),
    ammunition: base.ammunition + (mods.ammunition || 0),
    medicine: base.medicine + (mods.medicine || 0),
    spareParts: base.spareParts + (mods.spareParts || 0),
    oxen: base.oxen + (mods.oxen || 0)
  }
}

// Occupation-specific flavor messages for events
export const OCCUPATION_EVENT_FLAVOR: Record<Occupation, {
  hunting: string[]
  trading: string[]
  repair: string[]
  medical: string[]
}> = {
  banker: {
    hunting: ['Your investment in this hunting expedition is underperforming.', 'Numbers are your game, not animals.'],
    trading: ['You recognize a fair deal. Finally, familiar territory.', 'The merchant\'s prices are... negotiable.'],
    repair: ['Manual labor. How... quaint.', 'You consider hiring someone for this.'],
    medical: ['Money can\'t solve this one. Frustrating.', 'You briefly wish you\'d paid more attention in biology.']
  },
  carpenter: {
    hunting: ['Wood doesn\'t run. Animals do. Adjustment required.', 'If only deer were made of pine...'],
    trading: ['Fair price for fair work. Simple.', 'You assess the craftsmanship of their goods. Amateur.'],
    repair: ['This is what you do. It\'s almost relaxing.', 'The wagon practically repairs itself under your hands.'],
    medical: ['Healing people is harder than healing furniture.', 'You can\'t nail a splint on a fever.']
  },
  farmer: {
    hunting: ['Livestock doesn\'t run. Wild game does.', 'You miss the simplicity of chickens.'],
    trading: ['City prices. Highway robbery.', 'Back home, neighbors trade fairly.'],
    repair: ['Farm equipment prepared you for this.', 'If it breaks, fix it. Simple as seasons.'],
    medical: ['Animals get sick too. Similar enough.', 'Hard work is the best medicine. Usually.']
  },
  doctor: {
    hunting: ['Your oath says nothing about deer.', 'At least it\'s quick. That counts.'],
    trading: ['Fair compensation for goods. Reasonable.', 'Merchant markup is its own kind of disease.'],
    repair: ['Surgery on wood. Less blood, same precision.', 'The wagon\'s anatomy is straightforward.'],
    medical: ['Finally, your element.', 'This is what you trained for. You\'ve got this.']
  },
  merchant: {
    hunting: ['Wild meat is free inventory. Excellent.', 'Market value of venison: considerable.'],
    trading: ['This is your arena. Time to shine.', 'You can smell a markup from miles away.'],
    repair: ['Time is money. This costs both.', 'You consider the cost-benefit of replacement vs repair.'],
    medical: ['Health is wealth. Literally, in this case.', 'No profit in sickness.']
  },
  blacksmith: {
    hunting: ['Your hammer is better at shaping metal than catching dinner.', 'Forge heat is different from hunting patience.'],
    trading: ['You know the value of good iron. These prices are fair. Mostly.', 'Craftsmanship has a price.'],
    repair: ['Metal, wood, it all bends to skill.', 'You could make these parts from scratch if needed.'],
    medical: ['Bodies aren\'t metal. Unfortunate.', 'You wish healing were as straightforward as forging.']
  },
  teacher: {
    hunting: ['You\'ve read about this. Theory and practice diverge.', 'The animals are not your students. They don\'t listen.'],
    trading: ['Historical context suggests these prices are inflated.', 'You recognize rhetorical pricing tricks.'],
    repair: ['Applied physics. You remember the principles.', 'Books help. Experience helps more.'],
    medical: ['Medical texts come flooding back.', 'You recall chapters on frontier ailments.']
  },
  saddlemaker: {
    hunting: ['Animals understand you. Or at least, horses do.', 'The wild ones are wilder, but still readable.'],
    trading: ['Leather quality tells you everything about their stock.', 'Fair trades are fair. Simple.'],
    repair: ['Leather and wood. Your specialties.', 'This wagon is becoming quite well-maintained.'],
    medical: ['Animal medicine overlaps. Somewhat.', 'Creatures heal in similar ways.']
  }
}

// Get occupation-specific flavor text for an event
export function getOccupationFlavor(
  occupation: Occupation,
  eventType: 'hunting' | 'trading' | 'repair' | 'medical'
): string {
  const flavors = OCCUPATION_EVENT_FLAVOR[occupation][eventType]
  return flavors[Math.floor(Math.random() * flavors.length)]
}
