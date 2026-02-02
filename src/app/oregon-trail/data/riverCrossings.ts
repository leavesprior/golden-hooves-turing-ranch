// River Crossing System - Classic Oregon Trail 5-Choice Mechanic
// The iconic "You have reached the [River]. Would you like to..." moment

import { type StatName } from '../characterContext'
import { type Weather } from '../oregonTrailContext'

// Trait bonuses that affect river crossings
export interface RiverTraitBonus {
  traitId: string
  effect: string           // Display text
  crossingBonus?: {
    methods: CrossingMethod[]
    luckBonus: number       // Added to luck roll
  }
  riskReduction?: CrossingMethod[]  // Methods where risk is reduced one level
}

export const RIVER_TRAIT_BONUSES: RiverTraitBonus[] = [
  {
    traitId: 'trail_hardened',
    effect: '+2 to ford/guide rolls',
    crossingBonus: { methods: ['ford', 'guide'], luckBonus: 2 },
  },
  {
    traitId: 'iron_constitution',
    effect: 'Reduced injury severity',
    // Applied in outcome resolution - no direct roll bonus
  },
  {
    traitId: 'born_lucky',
    effect: '+1 to all crossing rolls',
    crossingBonus: { methods: ['ford', 'caulk', 'ferry', 'guide'], luckBonus: 1 },
  },
  {
    traitId: 'quick_draw',
    effect: 'Ford risk reduced one level',
    riskReduction: ['ford'],
  },
  {
    traitId: 'iron_horse',
    effect: '+2 to ford rolls from travel experience',
    crossingBonus: { methods: ['ford'], luckBonus: 2 },
  },
  {
    traitId: 'bridge_keepers_bane',
    effect: 'Bridge Keeper always appears',
    // Handled in RiverCrossing component
  },
]

// Get active trait bonuses for a player's traits
export function getActiveTraitBonuses(playerTraits: string[]): RiverTraitBonus[] {
  return RIVER_TRAIT_BONUSES.filter(b => playerTraits.includes(b.traitId))
}

// Calculate total luck bonus from traits for a crossing method
export function getTraitLuckBonus(playerTraits: string[], method: CrossingMethod): number {
  return getActiveTraitBonuses(playerTraits).reduce((total, bonus) => {
    if (bonus.crossingBonus?.methods.includes(method)) {
      return total + bonus.crossingBonus.luckBonus
    }
    return total
  }, 0)
}

export type RiverCondition = 'low' | 'normal' | 'high' | 'flood'
export type CrossingMethod = 'ford' | 'caulk' | 'ferry' | 'wait' | 'guide'

export interface RiverState {
  name: string
  depth: number           // feet
  width: number           // feet
  currentSpeed: number    // mph
  condition: RiverCondition
  ferryAvailable: boolean
  ferryCost: number       // in karma (neutral)
  guideAvailable: boolean
  guideCost: number
  waitDays: number        // days until conditions improve (0 = won't improve)
}

export interface CrossingChoice {
  id: CrossingMethod
  name: string
  description: string
  icon: string
  available: boolean
  unavailableReason?: string
  riskLevel: 'low' | 'medium' | 'high' | 'very_high' | 'extreme'
  cost?: number
  statCheck?: {
    stat: StatName
    difficulty: number
    bonusOnSuccess: string
  }
}

export interface CrossingOutcome {
  success: boolean
  critical: boolean      // critical success or failure
  message: string
  flavorText: string     // Fallout-style colorful description
  effects: {
    foodLost?: number
    ammoLost?: number
    medicineUsed?: number
    sparePartsUsed?: number
    oxenLost?: number
    healthDelta?: number     // to all party members
    specificInjury?: {
      memberId?: string      // random if not specified
      damage: number
      injuryType: 'drowned' | 'hypothermia' | 'broken_limb' | 'swept_away'
    }
    wagonDamage?: number
    daysLost?: number
    karmaChange?: {
      neutral?: number
      good?: number
      bad?: number
    }
    moraleChange?: number
  }
}

// Generate river state based on landmark and weather
export function generateRiverState(
  riverName: string,
  weather: Weather,
  dayOfYear: number  // 1-365, for seasonal variation
): RiverState {
  // Base values by river (some rivers are more dangerous than others)
  const riverDefaults: Record<string, { depth: number; width: number; speed: number }> = {
    'Kansas River Crossing': { depth: 3.5, width: 200, speed: 3 },
    'Raft River': { depth: 2.5, width: 120, speed: 2 },
    'Humboldt River': { depth: 2, width: 80, speed: 1.5 },  // Shallow alkaline river
    // Default for unknown rivers
    'default': { depth: 3, width: 150, speed: 2.5 }
  }

  const base = riverDefaults[riverName] || riverDefaults['default']

  // Weather modifiers
  const weatherModifiers: Record<Weather, number> = {
    fair: 1.0,
    rain: 1.3,
    storm: 1.6,
    snow: 0.9  // Snowmelt depends on season
  }

  // Seasonal modifiers (spring = high water)
  const springPeak = dayOfYear >= 90 && dayOfYear <= 150  // Apr-May
  const seasonMod = springPeak ? 1.4 : 1.0

  const depth = base.depth * weatherModifiers[weather] * seasonMod
  const speed = base.speed * weatherModifiers[weather] * seasonMod

  // Determine condition
  let condition: RiverCondition = 'normal'
  if (depth < 2.5) condition = 'low'
  else if (depth > 5) condition = 'high'
  else if (depth > 7) condition = 'flood'

  // Ferry and guide availability
  const ferryAvailable = condition !== 'flood' && Math.random() > 0.2
  const guideAvailable = Math.random() > 0.3

  // Costs scale with difficulty
  const baseFerry = 20
  const baseGuide = 15
  const difficultyMultiplier = condition === 'flood' ? 3 : condition === 'high' ? 2 : 1

  return {
    name: riverName,
    depth: Math.round(depth * 10) / 10,
    width: base.width,
    currentSpeed: Math.round(speed * 10) / 10,
    condition,
    ferryAvailable,
    ferryCost: baseFerry * difficultyMultiplier,
    guideAvailable,
    guideCost: baseGuide * difficultyMultiplier,
    waitDays: condition === 'flood' ? 3 : condition === 'high' ? 2 : 0
  }
}

// Get available crossing choices for a river
export function getCrossingChoices(river: RiverState, hasKarma: number): CrossingChoice[] {
  const choices: CrossingChoice[] = []

  // 1. FORD - Attempt to wade across
  const fordRisk = river.condition === 'flood' ? 'extreme' :
                   river.condition === 'high' ? 'very_high' :
                   river.depth > 4 ? 'high' :
                   river.depth > 3 ? 'medium' : 'low'

  choices.push({
    id: 'ford',
    name: 'Ford the River',
    description: `Wade across (${river.depth}ft deep, ${river.currentSpeed}mph current)`,
    icon: '🚶',
    available: river.condition !== 'flood',
    unavailableReason: river.condition === 'flood' ? 'River is too dangerous to ford' : undefined,
    riskLevel: fordRisk,
    statCheck: {
      stat: 'Agility',
      difficulty: 10 + Math.floor(river.depth * 2) + Math.floor(river.currentSpeed),
      bonusOnSuccess: 'Quick crossing, no supplies lost'
    }
  })

  // 2. CAULK - Float the wagon across
  const caulkRisk = river.condition === 'flood' ? 'extreme' :
                    river.condition === 'high' ? 'high' :
                    river.width > 250 ? 'high' : 'medium'

  choices.push({
    id: 'caulk',
    name: 'Caulk & Float',
    description: `Seal wagon and float across (${river.width}ft wide)`,
    icon: '🛶',
    available: true,
    riskLevel: caulkRisk,
    statCheck: {
      stat: 'Expertise',
      difficulty: 12 + Math.floor(river.width / 50),
      bonusOnSuccess: 'Wagon stays dry, supplies protected'
    }
  })

  // 3. FERRY - Pay for safe passage
  choices.push({
    id: 'ferry',
    name: 'Take the Ferry',
    description: `Pay ${river.ferryCost}🌮 for safe crossing`,
    icon: '⛴️',
    available: river.ferryAvailable && hasKarma >= river.ferryCost,
    unavailableReason: !river.ferryAvailable ? 'No ferry service available' :
                       hasKarma < river.ferryCost ? `Need ${river.ferryCost}🌮 (have ${hasKarma})` : undefined,
    riskLevel: 'low',
    cost: river.ferryCost
  })

  // 4. WAIT - Wait for conditions to improve
  choices.push({
    id: 'wait',
    name: 'Wait for Conditions',
    description: river.waitDays > 0 ?
      `Camp and wait ${river.waitDays} day${river.waitDays > 1 ? 's' : ''} for better conditions` :
      'Conditions unlikely to improve soon',
    icon: '⏳',
    available: river.waitDays > 0,
    unavailableReason: river.waitDays === 0 ? 'River won\'t improve for weeks' : undefined,
    riskLevel: 'low'
  })

  // 5. HIRE GUIDE - Local expertise
  choices.push({
    id: 'guide',
    name: 'Hire a Guide',
    description: `Pay ${river.guideCost}🌮 for local expertise`,
    icon: '🧭',
    available: river.guideAvailable && hasKarma >= river.guideCost,
    unavailableReason: !river.guideAvailable ? 'No guides available here' :
                       hasKarma < river.guideCost ? `Need ${river.guideCost}🌮 (have ${hasKarma})` : undefined,
    riskLevel: 'low',
    cost: river.guideCost
  })

  return choices
}

// Resolve a crossing attempt
export function resolveCrossing(
  method: CrossingMethod,
  river: RiverState,
  playerStats: Record<StatName, number>,
  luck: number  // 1-20 roll
): CrossingOutcome {
  const outcomes = CROSSING_OUTCOMES[method]

  switch (method) {
    case 'ford':
      return resolveFord(river, playerStats, luck)
    case 'caulk':
      return resolveCaulk(river, playerStats, luck)
    case 'ferry':
      return resolveFerry(river, luck)
    case 'wait':
      return resolveWait(river)
    case 'guide':
      return resolveGuide(river, luck)
    default:
      return {
        success: false,
        critical: false,
        message: 'Unknown crossing method',
        flavorText: 'You stand at the river\'s edge, confused.',
        effects: {}
      }
  }
}

function resolveFord(river: RiverState, stats: Record<StatName, number>, luck: number): CrossingOutcome {
  const agility = stats.Agility || 5
  const durability = stats.Durability || 5

  // Base difficulty scales with depth and current
  const difficulty = 10 + Math.floor(river.depth * 2) + Math.floor(river.currentSpeed)
  const roll = luck + Math.floor(agility / 2)
  const success = roll >= difficulty

  // Critical results
  const criticalSuccess = luck >= 18 && success
  const criticalFailure = luck <= 2 && !success

  if (criticalSuccess) {
    return {
      success: true,
      critical: true,
      message: 'A masterful crossing!',
      flavorText: pickRandom(FORD_OUTCOMES.criticalSuccess),
      effects: {
        moraleChange: 10,
        karmaChange: { good: 3 }
      }
    }
  }

  if (criticalFailure) {
    const injury = river.condition === 'high' ? 'swept_away' : 'hypothermia'
    return {
      success: false,
      critical: true,
      message: 'Disaster strikes!',
      flavorText: pickRandom(FORD_OUTCOMES.criticalFailure),
      effects: {
        foodLost: Math.floor(Math.random() * 50) + 30,
        ammoLost: Math.floor(Math.random() * 20) + 10,
        healthDelta: -20,
        specificInjury: {
          damage: 40,
          injuryType: injury
        },
        wagonDamage: 15,
        moraleChange: -15
      }
    }
  }

  if (success) {
    // Minor losses possible even on success
    const minorLoss = luck < 10
    return {
      success: true,
      critical: false,
      message: 'You made it across!',
      flavorText: pickRandom(FORD_OUTCOMES.success),
      effects: minorLoss ? {
        foodLost: Math.floor(Math.random() * 10) + 5,
        moraleChange: 5
      } : {
        moraleChange: 8
      }
    }
  }

  // Regular failure
  const severeLoss = river.condition === 'high'
  return {
    success: false,
    critical: false,
    message: 'The crossing went poorly.',
    flavorText: pickRandom(FORD_OUTCOMES.failure),
    effects: {
      foodLost: severeLoss ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 20) + 10,
      ammoLost: Math.floor(Math.random() * 15),
      healthDelta: severeLoss ? -15 : -8,
      wagonDamage: severeLoss ? 10 : 5,
      moraleChange: -8
    }
  }
}

function resolveCaulk(river: RiverState, stats: Record<StatName, number>, luck: number): CrossingOutcome {
  const expertise = stats.Expertise || 5

  const difficulty = 12 + Math.floor(river.width / 50)
  const roll = luck + Math.floor(expertise / 2)
  const success = roll >= difficulty

  const criticalSuccess = luck >= 18 && success
  const criticalFailure = luck <= 2 && !success

  if (criticalSuccess) {
    return {
      success: true,
      critical: true,
      message: 'Perfect float!',
      flavorText: pickRandom(CAULK_OUTCOMES.criticalSuccess),
      effects: {
        moraleChange: 12,
        karmaChange: { good: 2 }
      }
    }
  }

  if (criticalFailure) {
    return {
      success: false,
      critical: true,
      message: 'The wagon capsizes!',
      flavorText: pickRandom(CAULK_OUTCOMES.criticalFailure),
      effects: {
        foodLost: Math.floor(Math.random() * 80) + 40,
        ammoLost: Math.floor(Math.random() * 30) + 20,
        medicineUsed: 2,
        healthDelta: -15,
        wagonDamage: 25,
        moraleChange: -20
      }
    }
  }

  if (success) {
    return {
      success: true,
      critical: false,
      message: 'The wagon floats across safely.',
      flavorText: pickRandom(CAULK_OUTCOMES.success),
      effects: {
        moraleChange: 5
      }
    }
  }

  return {
    success: false,
    critical: false,
    message: 'Water gets into the wagon.',
    flavorText: pickRandom(CAULK_OUTCOMES.failure),
    effects: {
      foodLost: Math.floor(Math.random() * 30) + 15,
      ammoLost: Math.floor(Math.random() * 10),
      wagonDamage: 8,
      moraleChange: -5
    }
  }
}

function resolveFerry(river: RiverState, luck: number): CrossingOutcome {
  // Ferry is very safe, but not 100%
  const criticalFailure = luck === 1
  const bonus = luck >= 18

  if (criticalFailure) {
    return {
      success: false,
      critical: true,
      message: 'Ferry accident!',
      flavorText: pickRandom(FERRY_OUTCOMES.criticalFailure),
      effects: {
        foodLost: Math.floor(Math.random() * 20) + 10,
        healthDelta: -10,
        moraleChange: -10,
        karmaChange: { neutral: Math.floor(river.ferryCost / 2) } // Partial refund
      }
    }
  }

  if (bonus) {
    return {
      success: true,
      critical: true,
      message: 'Excellent ferry service!',
      flavorText: pickRandom(FERRY_OUTCOMES.criticalSuccess),
      effects: {
        moraleChange: 8,
        healthDelta: 5  // Rest during crossing
      }
    }
  }

  return {
    success: true,
    critical: false,
    message: 'The ferry crosses without incident.',
    flavorText: pickRandom(FERRY_OUTCOMES.success),
    effects: {
      moraleChange: 3
    }
  }
}

function resolveWait(river: RiverState): CrossingOutcome {
  return {
    success: true,
    critical: false,
    message: `You wait ${river.waitDays} day${river.waitDays > 1 ? 's' : ''} for conditions to improve.`,
    flavorText: pickRandom(WAIT_OUTCOMES.success),
    effects: {
      daysLost: river.waitDays,
      // Waiting consumes food
      foodLost: river.waitDays * 3,  // Per party member would be applied in context
      moraleChange: -3  // Waiting is boring
    }
  }
}

function resolveGuide(river: RiverState, luck: number): CrossingOutcome {
  // Guide is very reliable
  const bonus = luck >= 15

  if (bonus) {
    return {
      success: true,
      critical: true,
      message: 'The guide knows a secret path!',
      flavorText: pickRandom(GUIDE_OUTCOMES.criticalSuccess),
      effects: {
        moraleChange: 10,
        karmaChange: { good: 3 }
      }
    }
  }

  return {
    success: true,
    critical: false,
    message: 'The guide leads you safely across.',
    flavorText: pickRandom(GUIDE_OUTCOMES.success),
    effects: {
      moraleChange: 5
    }
  }
}

// Helper
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// =========================================
// FALLOUT-STYLE COLORFUL OUTCOME MESSAGES
// =========================================

const FORD_OUTCOMES = {
  criticalSuccess: [
    'You find the perfect crossing point. The oxen seem almost smug about it.',
    'The river parts before you like it has somewhere better to be.',
    'Your wagon practically skips across the stones. The fish look impressed.',
    'A natural sandbar appears exactly where needed. Someone up there likes you.',
    'The current helpfully pushes you in exactly the right direction.',
  ],
  success: [
    'You emerge on the far bank, soggy but intact. Victory never felt so damp.',
    'The crossing is uneventful. You choose to call this a win.',
    'Water rises to the wagon bed but doesn\'t breach. Close call.',
    'The oxen complain the entire way but get the job done.',
    'You make it across. The river seems almost disappointed.',
  ],
  failure: [
    'The current has opinions about your life choices. Strong opinions.',
    'Supplies float downstream like escaping prisoners.',
    'The wagon tips. Physics is not your friend today.',
    'You discover the deep part of the river. With your wagon. In the middle.',
    'The oxen give you a look that says "I told you so" in Bovine.',
  ],
  criticalFailure: [
    'The river decides to keep some of your belongings. Forever.',
    'Everything that can go wrong does. Murphy would be proud.',
    'The current treats your wagon like a chew toy.',
    'This is the kind of crossing they\'ll warn future travelers about.',
    'The river wins this round. And the next several rounds.',
  ]
}

const CAULK_OUTCOMES = {
  criticalSuccess: [
    'The wagon floats so well, you consider a career in boat-building.',
    'Not a drop of water enters. The laws of physics politely look away.',
    'You drift across like a majestic, ox-powered yacht.',
    'The seal holds perfectly. Your ancestors would be proud.',
    'The wagon glides across. Several fish try to hitch a ride.',
  ],
  success: [
    'The caulking holds. You pretend this was the plan all along.',
    'A few nervous moments, but you reach the far shore intact.',
    'The wagon bobs alarmingly but makes it across.',
    'Water laps at the edges but stays out. Mostly.',
    'You float across with the grace of a determined bathtub.',
  ],
  failure: [
    'The seal fails in the most inconvenient spot possible.',
    'Turns out caulking is harder than it looks. Much harder.',
    'Water finds every gap your caulking missed.',
    'The wagon takes on water like it\'s trying to become a submarine.',
    'Your caulking job wouldn\'t pass inspection. By anyone. Ever.',
  ],
  criticalFailure: [
    'The wagon flips. Everything you own meets the river bottom.',
    'Your caulking dissolves. Was that the right substance? No. No it was not.',
    'The wagon becomes a very inefficient submarine.',
    'You invent a new sport: extreme supplies loss.',
    'The river accepts your offerings. All of them. At once.',
  ]
}

const FERRY_OUTCOMES = {
  criticalSuccess: [
    'The ferryman shares lunch. And stories. And a shorter route ahead.',
    'Best ferry ride ever. You consider tipping in gold.',
    'The ferry practically flies across. The ferryman winks mysteriously.',
    'You arrive refreshed. The ferryman knows what he\'s doing.',
    'The crossing is so smooth you actually nap.',
  ],
  success: [
    'The ferry creaks but delivers you safely.',
    'An uneventful crossing. In the frontier, that\'s a win.',
    'The ferryman hums off-key the entire way. You\'ve paid for worse.',
    'Slow and steady gets you to the other side.',
    'The ferry does exactly what ferries do. No more, no less.',
  ],
  criticalFailure: [
    'The ferry springs a leak mid-crossing. The ferryman seems surprised.',
    'The rope snaps. Chaos ensues.',
    'You begin to suspect this ferryman is new to the job.',
    'The ferry\'s "slight list" becomes more concerning mid-river.',
    'The ferryman\'s "this never happens" is not reassuring.',
  ]
}

const WAIT_OUTCOMES = {
  success: [
    'Camp life isn\'t so bad. The mosquitoes keep you company.',
    'You wait. And wait. Time moves differently at riversides.',
    'The river eventually calms. Your patience is rewarded.',
    'Days of fishing, card games, and questioning your life choices.',
    'The wait is long, but the crossing will be safer. Probably.',
  ]
}

const GUIDE_OUTCOMES = {
  criticalSuccess: [
    'The guide knows every rock, eddy, and friendly fish by name.',
    '"Follow me," says the guide, finding a path you couldn\'t see existed.',
    'The guide\'s secret crossing is almost suspiciously perfect.',
    'You realize you\'re paying for years of expertise. Worth it.',
    'The guide whistles, and the river seems to obey.',
  ],
  success: [
    'The guide earns their pay. You\'d recommend them.',
    'Local knowledge proves invaluable. Again.',
    'The guide finds the safest path with practiced ease.',
    'Following the guide, you wonder how you\'d have done it alone.',
    'The guide makes it look easy. Because for them, it is.',
  ]
}

// =========================================
// RIVER DESCRIPTIONS FOR ATMOSPHERE
// =========================================

export const RIVER_DESCRIPTIONS: Record<RiverCondition, string[]> = {
  low: [
    'The river runs low and lazy, exposing sandbars and smooth stones.',
    'A gentle current whispers over exposed rocks. Almost inviting.',
    'The water level is mercifully low. The riverbed waves hello.',
  ],
  normal: [
    'The river flows with steady purpose, neither friend nor foe.',
    'Brown water churns past at a businesslike pace.',
    'A respectable current moves through. The river means business.',
  ],
  high: [
    'Muddy water rushes by, carrying branches and ambition.',
    'The river is swollen and angry. It has opinions about wagons.',
    'High water churns past. The far bank looks very far away.',
  ],
  flood: [
    'The river has become a brown, roaring monster.',
    'Water covers the banks and keeps going. This is not a river, it\'s a force of nature.',
    'The flood stage means one thing: wait, or regret.',
  ]
}

export function getRiverDescription(condition: RiverCondition): string {
  return pickRandom(RIVER_DESCRIPTIONS[condition])
}

// Export the outcome banks for use in other event messages
export const CROSSING_OUTCOMES = {
  ford: FORD_OUTCOMES,
  caulk: CAULK_OUTCOMES,
  ferry: FERRY_OUTCOMES,
  wait: WAIT_OUTCOMES,
  guide: GUIDE_OUTCOMES
}
