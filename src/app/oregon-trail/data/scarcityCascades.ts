/**
 * Resource Scarcity Cascade System — Improvement #8
 * Inspired by: Master of Orion II (MicroProse, 1996)
 *
 * Resources have interdependencies. When one drops critically low,
 * it triggers cascading effects on others. Starvation kills morale,
 * low morale slows travel, slow travel burns more food, etc.
 *
 * Each resource has a scarcity threshold, cascade effects, and
 * desperation events that fire at critical levels.
 */

// ============================================================================
// SCARCITY THRESHOLDS
// ============================================================================

export type ResourceType = 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'oxen' | 'clothing' | 'morale' | 'wagonCondition'

export interface ScarcityThreshold {
  resource: ResourceType
  lowThreshold: number       // Below this = "low" (yellow warning)
  criticalThreshold: number  // Below this = "critical" (red alarm)
  depletedEffects: CascadeEffect[]   // When resource hits 0
  lowEffects: CascadeEffect[]        // When resource is low
  criticalEffects: CascadeEffect[]   // When resource is critical
}

export interface CascadeEffect {
  targetResource: ResourceType
  dailyDelta: number         // Change per day (negative = drain)
  description: string
  narratorComment?: string
}

export const SCARCITY_THRESHOLDS: ScarcityThreshold[] = [
  {
    resource: 'food',
    lowThreshold: 50,
    criticalThreshold: 20,
    lowEffects: [
      { targetResource: 'morale', dailyDelta: -2, description: 'Hunger erodes morale' },
    ],
    criticalEffects: [
      { targetResource: 'morale', dailyDelta: -5, description: 'Starvation panic' },
      {
        targetResource: 'oxen', dailyDelta: -1,
        description: 'Party considers eating the oxen',
        narratorComment: 'The party eyes the oxen with a hunger that is not metaphorical.',
      },
    ],
    depletedEffects: [
      { targetResource: 'morale', dailyDelta: -10, description: 'No food: despair sets in' },
      {
        targetResource: 'oxen', dailyDelta: -1,
        description: 'Oxen slaughtered for meat',
        narratorComment: 'Old Bessie is now steaks. The narrator wishes they could unsee this.',
      },
    ],
  },
  {
    resource: 'ammunition',
    lowThreshold: 20,
    criticalThreshold: 5,
    lowEffects: [
      { targetResource: 'morale', dailyDelta: -1, description: 'Low ammo makes party nervous' },
    ],
    criticalEffects: [
      { targetResource: 'morale', dailyDelta: -3, description: 'Nearly defenseless' },
    ],
    depletedEffects: [
      {
        targetResource: 'morale', dailyDelta: -5,
        description: 'No ammunition: party feels defenseless',
        narratorComment: 'No bullets left. The frontier does not care about your feelings, but it does notice your vulnerability.',
      },
    ],
  },
  {
    resource: 'medicine',
    lowThreshold: 5,
    criticalThreshold: 2,
    lowEffects: [],
    criticalEffects: [
      { targetResource: 'morale', dailyDelta: -2, description: 'Running low on medicine' },
    ],
    depletedEffects: [
      {
        targetResource: 'morale', dailyDelta: -4,
        description: 'No medicine: illnesses go untreated',
        narratorComment: 'No medicine. Every cough sounds like a death sentence. The narrator has seen this before.',
      },
    ],
  },
  {
    resource: 'oxen',
    lowThreshold: 3,
    criticalThreshold: 1,
    lowEffects: [
      { targetResource: 'wagonCondition', dailyDelta: -2, description: 'Overworked oxen strain the wagon' },
    ],
    criticalEffects: [
      { targetResource: 'wagonCondition', dailyDelta: -5, description: 'One ox pulling: wagon failing' },
      { targetResource: 'morale', dailyDelta: -3, description: 'Progress nearly impossible' },
    ],
    depletedEffects: [
      {
        targetResource: 'morale', dailyDelta: -15,
        description: 'No oxen: wagon cannot move',
        narratorComment: 'No oxen. The wagon sits. The narrator suggests you learn to carry it.',
      },
    ],
  },
  {
    resource: 'clothing',
    lowThreshold: 2,
    criticalThreshold: 1,
    lowEffects: [],
    criticalEffects: [
      { targetResource: 'morale', dailyDelta: -2, description: 'Insufficient clothing for the weather' },
    ],
    depletedEffects: [
      {
        targetResource: 'morale', dailyDelta: -5,
        description: 'No clothing: exposure risk',
        narratorComment: 'Naked in the wilderness. This is not the adventure anyone signed up for.',
      },
    ],
  },
  {
    resource: 'wagonCondition',
    lowThreshold: 40,
    criticalThreshold: 15,
    lowEffects: [
      { targetResource: 'morale', dailyDelta: -1, description: 'Wagon creaks ominously' },
    ],
    criticalEffects: [
      {
        targetResource: 'morale', dailyDelta: -4,
        description: 'Wagon barely holding together',
        narratorComment: 'The wagon is held together by optimism and a prayer. The narrator has faith in neither.',
      },
    ],
    depletedEffects: [
      {
        targetResource: 'morale', dailyDelta: -20,
        description: 'Wagon destroyed: stranded',
        narratorComment: 'The wagon is gone. You are now pedestrians in the middle of nowhere. Congratulations.',
      },
    ],
  },
  {
    resource: 'morale',
    lowThreshold: 40,
    criticalThreshold: 15,
    lowEffects: [],
    criticalEffects: [
      {
        targetResource: 'food', dailyDelta: -3,
        description: 'Depressed party eats more for comfort',
        narratorComment: 'Morale is so low the party has started stress-eating. Relatable, the narrator supposes.',
      },
    ],
    depletedEffects: [
      {
        targetResource: 'food', dailyDelta: -5,
        description: 'Party in despair: wasteful consumption',
        narratorComment: 'The party has given up. They eat like there\'s no tomorrow. There might not be.',
      },
    ],
  },
]

// ============================================================================
// DAILY DEGRADATION (passive resource loss)
// ============================================================================

export interface DailyDegradation {
  resource: ResourceType
  baseLoss: number           // Per-day loss in normal conditions
  weatherMultiplier: Record<string, number>  // Weather affects loss rate
  paceMultiplier: Record<string, number>     // Pace affects loss rate
  terrainMultiplier?: Record<string, number> // Special terrain
}

export const DAILY_DEGRADATION: DailyDegradation[] = [
  {
    resource: 'wagonCondition',
    baseLoss: 0.5,
    weatherMultiplier: { fair: 1, rain: 1.5, storm: 2.5, snow: 2 },
    paceMultiplier: { steady: 1, strenuous: 1.5, grueling: 2.5 },
  },
  {
    resource: 'clothing',
    baseLoss: 0,  // Only degrades in bad weather
    weatherMultiplier: { fair: 0, rain: 0.1, storm: 0.2, snow: 0.3 },
    paceMultiplier: { steady: 1, strenuous: 1, grueling: 1.5 },
  },
]

// ============================================================================
// DESPERATION EVENTS
// ============================================================================

export interface DesperationEvent {
  id: string
  trigger: {
    resource: ResourceType
    condition: 'depleted' | 'critical' | 'low'
    minDays?: number          // Must be in this state for N days
  }
  title: string
  description: string
  choices: DesperationChoice[]
  oneTimeOnly: boolean
  narratorComment: string
}

export interface DesperationChoice {
  id: string
  text: string
  effects: {
    resource: ResourceType
    delta: number
  }[]
  moraleDelta: number
  narratorReaction: string
}

export const DESPERATION_EVENTS: DesperationEvent[] = [
  {
    id: 'desp_eat_oxen',
    trigger: { resource: 'food', condition: 'depleted', minDays: 2 },
    title: 'Desperate Measures',
    description: 'Two days without food. The party can barely walk. Someone suggests slaughtering an ox.',
    choices: [
      {
        id: 'slaughter_ox',
        text: 'Slaughter an ox for meat',
        effects: [
          { resource: 'food', delta: 100 },
          { resource: 'oxen', delta: -1 },
        ],
        moraleDelta: -10,
        narratorReaction: 'It had to be done. But nobody is happy about it. Especially the ox.',
      },
      {
        id: 'forage_instead',
        text: 'Forage for roots and berries instead',
        effects: [
          { resource: 'food', delta: 15 },
        ],
        moraleDelta: -3,
        narratorReaction: 'Roots and berries. Not a feast, but the oxen breathe easier.',
      },
      {
        id: 'press_on',
        text: 'Push forward on empty stomachs',
        effects: [],
        moraleDelta: -15,
        narratorReaction: 'Bravery or foolishness. The narrator cannot tell the difference anymore.',
      },
    ],
    oneTimeOnly: false,
    narratorComment: 'The narrator has been dreading this moment.',
  },
  {
    id: 'desp_wagon_collapse',
    trigger: { resource: 'wagonCondition', condition: 'critical' },
    title: 'The Wagon Groans',
    description: 'A wheel wobbles dangerously. If the wagon breaks down here, you may never fix it.',
    choices: [
      {
        id: 'use_spare_parts',
        text: 'Use spare parts for emergency repair',
        effects: [
          { resource: 'wagonCondition', delta: 25 },
          { resource: 'spareParts', delta: -1 },
        ],
        moraleDelta: 5,
        narratorReaction: 'Fixed. For now. The narrator makes no guarantees about tomorrow.',
      },
      {
        id: 'jury_rig',
        text: 'Jury-rig a fix with rope and prayer',
        effects: [
          { resource: 'wagonCondition', delta: 10 },
        ],
        moraleDelta: -2,
        narratorReaction: 'It holds. Barely. The narrator admires your optimism.',
      },
      {
        id: 'lighten_load',
        text: 'Dump supplies to reduce weight',
        effects: [
          { resource: 'wagonCondition', delta: 15 },
          { resource: 'food', delta: -30 },
          { resource: 'ammunition', delta: -10 },
        ],
        moraleDelta: -8,
        narratorReaction: 'Lighter wagon, lighter supplies. The mathematics of desperation.',
      },
    ],
    oneTimeOnly: false,
    narratorComment: 'The narrator hears the wagon\'s cries for help. Wood should not make that sound.',
  },
  {
    id: 'desp_morale_mutiny',
    trigger: { resource: 'morale', condition: 'critical', minDays: 3 },
    title: 'Whispers of Mutiny',
    description: 'The party is on the edge. Members talk quietly about turning back or splitting up.',
    choices: [
      {
        id: 'inspiring_speech',
        text: 'Give a rousing speech about Gold Country',
        effects: [],
        moraleDelta: 20,
        narratorReaction: 'Against all odds, your words spark something. Hope, maybe. Or stubbornness.',
      },
      {
        id: 'share_rations',
        text: 'Share your personal rations to show solidarity',
        effects: [
          { resource: 'food', delta: -20 },
        ],
        moraleDelta: 15,
        narratorReaction: 'Sacrifice. The oldest form of leadership. The narrator notes your character.',
      },
      {
        id: 'let_them_go',
        text: 'Let anyone who wants to leave, leave',
        effects: [],
        moraleDelta: 5,
        narratorReaction: 'Freedom of choice. How very modern. The narrator hopes the deserters survive.',
      },
    ],
    oneTimeOnly: true,
    narratorComment: 'The narrator has seen parties break apart before. It never ends well for anyone.',
  },
  {
    id: 'desp_no_medicine',
    trigger: { resource: 'medicine', condition: 'depleted' },
    title: 'Sickness Without Remedy',
    description: 'Someone falls ill and there is no medicine. Traditional remedies may help... or not.',
    choices: [
      {
        id: 'folk_remedy',
        text: 'Try a folk remedy (herbs and rest)',
        effects: [],
        moraleDelta: -3,
        narratorReaction: 'Folk medicine. Sometimes it works. Sometimes it makes things worse. Science is unhelpful here.',
      },
      {
        id: 'trade_for_medicine',
        text: 'Trade ammunition for medicine at next stop',
        effects: [
          { resource: 'ammunition', delta: -15 },
          { resource: 'medicine', delta: 3 },
        ],
        moraleDelta: 0,
        narratorReaction: 'Bullets for bandages. A frontier exchange rate the narrator finds poetically appropriate.',
      },
      {
        id: 'quarantine',
        text: 'Isolate the sick and keep moving',
        effects: [],
        moraleDelta: -8,
        narratorReaction: 'Practical. Cold. Effective. The narrator approves, reluctantly.',
      },
    ],
    oneTimeOnly: false,
    narratorComment: 'The narrator should mention that leeches are not the answer. They never are.',
  },
  {
    id: 'desp_no_ammo_encounter',
    trigger: { resource: 'ammunition', condition: 'depleted' },
    title: 'Unarmed Encounter',
    description: 'Figures on the ridge. Without ammunition, you have limited options.',
    choices: [
      {
        id: 'bluff_weapons',
        text: 'Bluff: wave empty rifles and shout',
        effects: [],
        moraleDelta: 5,
        narratorReaction: 'They ride away. Your acting was convincing. The narrator is impressed.',
      },
      {
        id: 'hide_and_wait',
        text: 'Hide the wagon and wait them out',
        effects: [],
        moraleDelta: -5,
        narratorReaction: 'You hide in a ditch while strangers ride past. Dignified, this is not.',
      },
      {
        id: 'peaceful_approach',
        text: 'Approach peacefully, hands up',
        effects: [
          { resource: 'food', delta: -20 },
        ],
        moraleDelta: -3,
        narratorReaction: 'They take some food as "toll." You live. The math works out.',
      },
    ],
    oneTimeOnly: false,
    narratorComment: 'The narrator notes that diplomacy becomes more important when bullets run out.',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all active cascade effects based on current resource levels
 */
export function getActiveCascades(resources: Record<ResourceType, number>): CascadeEffect[] {
  const effects: CascadeEffect[] = []

  for (const threshold of SCARCITY_THRESHOLDS) {
    const value = resources[threshold.resource] ?? 0

    if (value <= 0) {
      effects.push(...threshold.depletedEffects)
    } else if (value <= threshold.criticalThreshold) {
      effects.push(...threshold.criticalEffects)
    } else if (value <= threshold.lowThreshold) {
      effects.push(...threshold.lowEffects)
    }
  }

  return effects
}

/**
 * Apply daily degradation based on weather and pace
 */
export function getDailyDegradation(
  weather: string,
  pace: string,
): { resource: ResourceType; loss: number }[] {
  return DAILY_DEGRADATION.map(deg => {
    const weatherMult = deg.weatherMultiplier[weather] ?? 1
    const paceMult = deg.paceMultiplier[pace] ?? 1
    const loss = deg.baseLoss * weatherMult * paceMult
    return { resource: deg.resource, loss }
  }).filter(d => d.loss > 0)
}

/**
 * Get scarcity warnings for display
 */
export function getScarcityWarnings(resources: Record<ResourceType, number>): {
  resource: ResourceType
  level: 'low' | 'critical' | 'depleted'
  description: string
}[] {
  const warnings: { resource: ResourceType; level: 'low' | 'critical' | 'depleted'; description: string }[] = []

  for (const threshold of SCARCITY_THRESHOLDS) {
    const value = resources[threshold.resource] ?? 0

    if (value <= 0) {
      warnings.push({ resource: threshold.resource, level: 'depleted', description: `${threshold.resource}: DEPLETED` })
    } else if (value <= threshold.criticalThreshold) {
      warnings.push({ resource: threshold.resource, level: 'critical', description: `${threshold.resource}: CRITICAL (${value})` })
    } else if (value <= threshold.lowThreshold) {
      warnings.push({ resource: threshold.resource, level: 'low', description: `${threshold.resource}: LOW (${value})` })
    }
  }

  return warnings
}

/**
 * Check if a desperation event should fire
 */
export function checkDesperationEvent(
  resources: Record<ResourceType, number>,
  firedEvents: string[],
  scarcityDays: Record<string, number>,
  currentDay: number = 0,
  lastDesperationEventDay: number = 0,
): DesperationEvent | null {
  // 3-day cooldown between desperation events
  if (lastDesperationEventDay > 0 && currentDay - lastDesperationEventDay < 3) return null

  for (const event of DESPERATION_EVENTS) {
    // Skip one-time events already fired
    if (event.oneTimeOnly && firedEvents.includes(event.id)) continue

    const { resource, condition, minDays } = event.trigger
    const value = resources[resource] ?? 0
    const threshold = SCARCITY_THRESHOLDS.find(t => t.resource === resource)
    if (!threshold) continue

    let conditionMet = false
    if (condition === 'depleted' && value <= 0) conditionMet = true
    if (condition === 'critical' && value <= threshold.criticalThreshold) conditionMet = true
    if (condition === 'low' && value <= threshold.lowThreshold) conditionMet = true

    if (!conditionMet) continue

    // Check minDays
    if (minDays) {
      const days = scarcityDays[`${resource}_${condition}`] || 0
      if (days < minDays) continue
    }

    // Random chance (don't fire every day)
    if (Math.random() > 0.3) continue

    return event
  }

  return null
}

/**
 * Track how many consecutive days a resource has been in each scarcity state
 */
export function updateScarcityDays(
  resources: Record<ResourceType, number>,
  currentDays: Record<string, number>,
): Record<string, number> {
  const updated = { ...currentDays }

  for (const threshold of SCARCITY_THRESHOLDS) {
    const value = resources[threshold.resource] ?? 0
    const depKey = `${threshold.resource}_depleted`
    const critKey = `${threshold.resource}_critical`
    const lowKey = `${threshold.resource}_low`

    if (value <= 0) {
      updated[depKey] = (updated[depKey] || 0) + 1
      updated[critKey] = (updated[critKey] || 0) + 1
      updated[lowKey] = (updated[lowKey] || 0) + 1
    } else if (value <= threshold.criticalThreshold) {
      updated[depKey] = 0
      updated[critKey] = (updated[critKey] || 0) + 1
      updated[lowKey] = (updated[lowKey] || 0) + 1
    } else if (value <= threshold.lowThreshold) {
      updated[depKey] = 0
      updated[critKey] = 0
      updated[lowKey] = (updated[lowKey] || 0) + 1
    } else {
      updated[depKey] = 0
      updated[critKey] = 0
      updated[lowKey] = 0
    }
  }

  return updated
}
