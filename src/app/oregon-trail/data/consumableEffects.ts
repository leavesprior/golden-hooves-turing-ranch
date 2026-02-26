/**
 * Consumable Effects System - Bobr Game (Oregon Trail RPG)
 *
 * Implements timed, stackable consumable items with effects that modify
 * S.A.D.D.L.E. stats, health, morale, and resources over travel days.
 *
 * Stacking rules:
 *   - Same item re-applied: increment stackCount, extend duration (capped at 2x base)
 *   - Different items buffing same stat: effects are additive
 *   - Most items max 3 stacks; special items max 1
 *   - Duration extends on re-application, never resets
 */

import type { StatName } from '../characterContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EffectType =
  | 'stat_buff'
  | 'stat_debuff'
  | 'heal_over_time'
  | 'resource_regen'
  | 'resistance'
  | 'special'

export type ConsumableEffectType =
  | 'stat_buff'
  | 'stat_debuff'
  | 'heal'
  | 'heal_over_time'
  | 'cure_sickness'
  | 'morale'
  | 'resource'
  | 'resistance'
  | 'special'

export type ConsumableCategory = 'food' | 'drink' | 'medicine' | 'tonic' | 'special'

export type SicknessType = 'dysentery' | 'typhoid' | 'cholera' | 'broken_leg' | 'snakebite'

/** A single effect currently active on a character or the party. */
export interface ActiveEffect {
  id: string
  sourceItemId: string
  sourceName: string
  type: EffectType
  stat?: StatName
  value: number          // Magnitude of effect
  remainingTurns: number // Turns (travel days) remaining
  stackCount: number     // How many times stacked
  maxStacks: number      // Maximum stack count
  appliedAt: number      // Game day applied
}

/** One atomic effect produced by a consumable. */
export interface ConsumableEffect {
  type: ConsumableEffectType
  stat?: StatName        // Which stat for buff/debuff
  value: number          // Amount
  duration?: number      // Override item-level default duration
  sicknessTarget?: SicknessType // For cure_sickness: which sickness it cures
}

/** A consumable item definition. */
export interface ConsumableItem {
  id: string
  name: string
  emoji: string
  category: ConsumableCategory
  description: string
  effects: ConsumableEffect[]
  stackable: boolean
  maxStacks: number
  duration: number       // Base duration in travel days/turns
  cooldown?: number      // Minimum turns between uses
  sideEffects?: ConsumableEffect[] // Negative or secondary effects
  partyWide?: boolean    // Applies to all party members
  warningText?: string   // Displayed when conditions are met (e.g. addiction)
}

// ---------------------------------------------------------------------------
// Stat names used for type-safe references
// ---------------------------------------------------------------------------

const SHREWDNESS: StatName = 'Shrewdness'
const AGILITY: StatName = 'Agility'
const DURABILITY: StatName = 'Durability'
const DIPLOMACY: StatName = 'Diplomacy'
const LUCK: StatName = 'Luck'
const EXPERTISE: StatName = 'Expertise'

const ALL_STATS: StatName[] = [SHREWDNESS, AGILITY, DURABILITY, DIPLOMACY, LUCK, EXPERTISE]

// ---------------------------------------------------------------------------
// Consumable item definitions
// ---------------------------------------------------------------------------

export const CONSUMABLE_ITEMS: ConsumableItem[] = [
  // =========================================================================
  // FOOD ITEMS (duration 2-3 days)
  // =========================================================================
  {
    id: 'hardtack',
    name: 'Hardtack',
    emoji: '\uD83C\uDF5E',
    category: 'food',
    description: 'Rock-hard biscuit that lasts forever and tastes like it, too. Better than nothing.',
    effects: [
      { type: 'heal', value: 5 },
      { type: 'morale', value: 2 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 3,
  },
  {
    id: 'jerky',
    name: 'Jerky',
    emoji: '\uD83E\uDD69',
    category: 'food',
    description: 'Dried, salted meat. Chewy, flavorful, and keeps you going through the rough miles.',
    effects: [
      { type: 'heal', value: 10 },
      { type: 'morale', value: 5 },
      { type: 'stat_buff', stat: DURABILITY, value: 1, duration: 2 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 2,
  },
  {
    id: 'trail_stew',
    name: 'Trail Stew',
    emoji: '\uD83C\uDF72',
    category: 'food',
    description: 'A hearty pot of whatever was on hand. The whole party eats well tonight.',
    effects: [
      { type: 'heal', value: 15 },
      { type: 'morale', value: 10 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 2,
    partyWide: true,
  },
  {
    id: 'roast_venison',
    name: 'Roast Venison',
    emoji: '\uD83C\uDF56',
    category: 'food',
    description: 'Freshly hunted and roasted over the campfire. The smell alone lifts spirits.',
    effects: [
      { type: 'heal', value: 20 },
      { type: 'morale', value: 15 },
      { type: 'stat_buff', stat: AGILITY, value: 1, duration: 2 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 2,
  },
  {
    id: 'sourdough_bread',
    name: 'Sourdough Bread',
    emoji: '\uD83E\uDD56',
    category: 'food',
    description: 'Warm from the dutch oven, tangy and satisfying. A trail luxury.',
    effects: [
      { type: 'heal', value: 8 },
      { type: 'morale', value: 8 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 3,
  },
  {
    id: 'cynthias_apple_pie',
    name: "Cynthia's Apple Pie",
    emoji: '\uD83E\uDD67',
    category: 'food',
    description: 'Baked by Cynthia herself at the Back of Beyond Ranch. Legendary comfort food. The crust alone could heal a broken heart.',
    effects: [
      { type: 'heal', value: 25 },
      { type: 'morale', value: 30 },
      { type: 'stat_buff', stat: LUCK, value: 1, duration: 3 },
    ],
    stackable: false,
    maxStacks: 1,
    duration: 3,
  },

  // =========================================================================
  // DRINK ITEMS (duration 1-2 days)
  // =========================================================================
  {
    id: 'clean_water',
    name: 'Clean Water',
    emoji: '\uD83D\uDCA7',
    category: 'drink',
    description: 'Fresh, clean water. Hard to come by on the trail and worth its weight in gold.',
    effects: [
      { type: 'heal', value: 3 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 1,
  },
  {
    id: 'hot_coffee',
    name: 'Hot Coffee',
    emoji: '\u2615',
    category: 'drink',
    description: 'Strong frontier coffee, black as midnight. Sharpens the senses and quickens the step.',
    effects: [
      { type: 'stat_buff', stat: AGILITY, value: 1, duration: 1 },
      { type: 'morale', value: 5 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 1,
  },
  {
    id: 'frontier_whiskey',
    name: 'Frontier Whiskey',
    emoji: '\uD83E\uDD43',
    category: 'drink',
    description: 'Burns going down and loosens the tongue. Great for making friends, less so for making plans.',
    effects: [
      { type: 'stat_buff', stat: DIPLOMACY, value: 2, duration: 1 },
      { type: 'morale', value: 10 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 1,
    sideEffects: [
      { type: 'stat_debuff', stat: SHREWDNESS, value: 1, duration: 1 },
    ],
  },
  {
    id: 'sarsaparilla',
    name: 'Sarsaparilla',
    emoji: '\uD83C\uDF7A',
    category: 'drink',
    description: 'Sweet, fizzy, and refreshing. Rumored to bring good fortune to those who sip it slowly.',
    effects: [
      { type: 'morale', value: 5 },
      { type: 'stat_buff', stat: LUCK, value: 1, duration: 2 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 2,
  },
  {
    id: 'herbal_tea',
    name: 'Herbal Tea',
    emoji: '\uD83C\uDF75',
    category: 'drink',
    description: 'A calming blend of wild herbs. Clears the mind and settles the stomach.',
    effects: [
      { type: 'stat_buff', stat: SHREWDNESS, value: 1, duration: 2 },
      { type: 'heal', value: 5 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 2,
  },
  {
    id: 'pan_galactic_gargle_blaster_drink',
    name: 'Pan Galactic Gargle Blaster',
    emoji: '\uD83C\uDF0C',
    category: 'special',
    description: 'The effect is like having your brains smashed out by a slice of lemon wrapped round a large gold brick. The narrator strongly advises against this.',
    effects: [
      { type: 'stat_buff', stat: LUCK, value: 1, duration: 1 },
      { type: 'special', value: 1 }, // Reveals hidden dialogue options
    ],
    stackable: false,
    maxStacks: 1,
    duration: 1,
    sideEffects: [
      { type: 'stat_debuff', stat: SHREWDNESS, value: 3, duration: 1 },
      { type: 'stat_debuff', stat: AGILITY, value: 3, duration: 1 },
      { type: 'stat_debuff', stat: DURABILITY, value: 3, duration: 1 },
      { type: 'stat_debuff', stat: DIPLOMACY, value: 3, duration: 1 },
      { type: 'stat_debuff', stat: EXPERTISE, value: 3, duration: 1 },
    ],
    cooldown: 3,
  },

  // =========================================================================
  // MEDICINE ITEMS (immediate or 3-5 day duration)
  // =========================================================================
  {
    id: 'bandage',
    name: 'Bandage',
    emoji: '\uD83E\uDE79',
    category: 'medicine',
    description: 'Clean cloth strips. Simple but effective for patching up wounds on the trail.',
    effects: [
      { type: 'heal', value: 15 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 0, // Immediate
  },
  {
    id: 'medicine_kit',
    name: 'Medicine Kit',
    emoji: '\uD83D\uDC8A',
    category: 'medicine',
    description: 'A proper frontier medical kit with tinctures, herbs, and instructions a doctor might understand.',
    effects: [
      { type: 'cure_sickness', value: 1 }, // Cures any sickness
      { type: 'heal_over_time', value: 8, duration: 3 }, // ~25 total over 3 days
    ],
    stackable: true,
    maxStacks: 2,
    duration: 3,
  },
  {
    id: 'laudanum',
    name: 'Laudanum',
    emoji: '\uD83C\uDF36\uFE0F',
    category: 'medicine',
    description: 'Opium tincture. Numbs pain and toughens the spirit, but dulls the reflexes. Use sparingly.',
    effects: [
      { type: 'heal', value: 10 },
      { type: 'stat_buff', stat: DURABILITY, value: 2, duration: 2 },
    ],
    stackable: true,
    maxStacks: 3,
    duration: 2,
    sideEffects: [
      { type: 'stat_debuff', stat: AGILITY, value: 1, duration: 2 },
    ],
    warningText: 'Dependency risk: Using 3 or more doses in quick succession may cause withdrawal (-2 Durability for 2 days when effects expire).',
  },
  {
    id: 'frontier_doctors_salve',
    name: "Frontier Doctor's Salve",
    emoji: '\uD83E\uDDEA',
    category: 'medicine',
    description: 'A thick, pungent poultice. Mends bones and deep wounds over time. Smells terrible; works wonders.',
    effects: [
      { type: 'cure_sickness', value: 1, sicknessTarget: 'broken_leg' },
      { type: 'heal_over_time', value: 5, duration: 5 }, // 5 HP per day for 5 days = 25 total
    ],
    stackable: false,
    maxStacks: 1,
    duration: 5,
  },
  {
    id: 'snakebite_kit',
    name: 'Snakebite Kit',
    emoji: '\uD83D\uDC0D',
    category: 'medicine',
    description: 'Tourniquet, blade, and suction cup. Every trailsman should carry one west of the Mississippi.',
    effects: [
      { type: 'cure_sickness', value: 1, sicknessTarget: 'snakebite' },
      { type: 'heal', value: 10 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 0, // Immediate
  },

  // =========================================================================
  // TONIC ITEMS (longer duration 3-5 days)
  // =========================================================================
  {
    id: 'strength_tonic',
    name: 'Strength Tonic',
    emoji: '\uD83D\uDCAA',
    category: 'tonic',
    description: 'A thick, bitter elixir sold by traveling apothecaries. Whether it works or it is a placebo, your grip feels stronger.',
    effects: [
      { type: 'stat_buff', stat: DURABILITY, value: 2, duration: 3 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 3,
  },
  {
    id: 'wit_tonic',
    name: 'Wit Tonic',
    emoji: '\uD83E\uDDE0',
    category: 'tonic',
    description: 'Ginseng and herbs steeped in brandy. Sharpens the mind and quickens deduction.',
    effects: [
      { type: 'stat_buff', stat: SHREWDNESS, value: 2, duration: 3 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 3,
  },
  {
    id: 'lucky_charm_tonic',
    name: 'Lucky Charm Tonic',
    emoji: '\uD83C\uDF40',
    category: 'tonic',
    description: 'Four-leaf clover extract, rabbit foot powder, and something that glows faintly. The label says "Results May Vary (But They Usually Don\'t)."',
    effects: [
      { type: 'stat_buff', stat: LUCK, value: 1, duration: 5 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 5,
  },

  // =========================================================================
  // SPECIAL / ABSURD ITEMS
  // =========================================================================
  {
    id: 'cynthias_mystery_moonshine',
    name: "Cynthia's Mystery Moonshine",
    emoji: '\u2728',
    category: 'special',
    description: 'Nobody knows what Cynthia puts in this. The jar glows. Your teeth tingle. The narrator has questions.',
    effects: [
      { type: 'stat_buff', stat: EXPERTISE, value: 2, duration: 2 },
      { type: 'stat_buff', stat: LUCK, value: 1, duration: 2 },
      { type: 'morale', value: 20 },
      { type: 'special', value: 1 }, // Unlocks special ranch event
    ],
    stackable: false,
    maxStacks: 1,
    duration: 2,
    cooldown: 5,
    sideEffects: [
      { type: 'stat_debuff', stat: SHREWDNESS, value: 1, duration: 1 },
    ],
  },
  {
    id: 'snake_oil',
    name: 'Dr. Pemberton\'s Miracle Elixir',
    emoji: '\uD83D\uDC0D',
    category: 'tonic',
    description: 'Guaranteed to cure anything! (Guarantee not guaranteed.) Contains: mystery. Side effects may include optimism.',
    effects: [
      { type: 'morale', value: 15 },
      { type: 'resistance', value: 1, duration: 2 }, // Minor disease resistance
    ],
    stackable: true,
    maxStacks: 2,
    duration: 2,
    sideEffects: [
      { type: 'stat_debuff', stat: SHREWDNESS, value: 1, duration: 1 }, // You believed in snake oil
    ],
  },
  {
    id: 'prospectors_pick_me_up',
    name: "Prospector's Pick-Me-Up",
    emoji: '\u26CF\uFE0F',
    category: 'drink',
    description: 'Equal parts coffee, whiskey, and sheer determination. The prospector\'s breakfast of champions.',
    effects: [
      { type: 'stat_buff', stat: EXPERTISE, value: 1, duration: 2 },
      { type: 'stat_buff', stat: DURABILITY, value: 1, duration: 2 },
      { type: 'morale', value: 8 },
    ],
    stackable: true,
    maxStacks: 2,
    duration: 2,
  },
]

// ---------------------------------------------------------------------------
// Helper: generate a unique effect ID
// ---------------------------------------------------------------------------

let _effectIdCounter = 0

function generateEffectId(sourceItemId: string): string {
  _effectIdCounter += 1
  return `effect_${sourceItemId}_${Date.now()}_${_effectIdCounter}`
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Retrieve a consumable item definition by its ID. */
export function getConsumableItem(id: string): ConsumableItem | undefined {
  return CONSUMABLE_ITEMS.find(item => item.id === id)
}

/** Retrieve all consumable items belonging to a category. */
export function getConsumablesByCategory(category: ConsumableCategory): ConsumableItem[] {
  return CONSUMABLE_ITEMS.filter(item => item.category === category)
}

// ---------------------------------------------------------------------------
// Cooldown & stack validation
// ---------------------------------------------------------------------------

/**
 * Check whether a consumable can be used given the current active effects.
 *
 * Returns `{ canUse: true }` or `{ canUse: false, reason: '...' }`.
 */
export function canUseConsumable(
  itemId: string,
  activeEffects: ActiveEffect[],
  currentDay?: number,
): { canUse: boolean; reason?: string } {
  const item = getConsumableItem(itemId)
  if (!item) {
    return { canUse: false, reason: 'Unknown consumable item.' }
  }

  // Check max stacks: count active effects originating from this item
  const existingEffects = activeEffects.filter(e => e.sourceItemId === itemId)
  if (existingEffects.length > 0) {
    const highestStack = Math.max(...existingEffects.map(e => e.stackCount))
    if (highestStack >= item.maxStacks) {
      return {
        canUse: false,
        reason: `${item.name} is already at maximum stacks (${item.maxStacks}).`,
      }
    }
  }

  // Check cooldown: the most recent application must be far enough in the past
  if (item.cooldown !== undefined && currentDay !== undefined) {
    const mostRecentApplication = existingEffects.reduce<number | null>((latest, e) => {
      if (latest === null) return e.appliedAt
      return e.appliedAt > latest ? e.appliedAt : latest
    }, null)

    if (mostRecentApplication !== null) {
      const daysSinceLastUse = currentDay - mostRecentApplication
      if (daysSinceLastUse < item.cooldown) {
        const remaining = item.cooldown - daysSinceLastUse
        return {
          canUse: false,
          reason: `${item.name} is on cooldown. ${remaining} day${remaining !== 1 ? 's' : ''} remaining.`,
        }
      }
    }
  }

  return { canUse: true }
}

// ---------------------------------------------------------------------------
// Core: apply a consumable
// ---------------------------------------------------------------------------

/**
 * Apply a consumable item to the active effects list.
 *
 * Stacking rules:
 *   - Same item already active: increment stackCount, extend remaining
 *     duration by the item's base duration (capped at 2x base).
 *   - New item: create fresh ActiveEffect entries for each effect line.
 *
 * Returns the updated active effects array (does not mutate the input).
 */
export function applyConsumable(
  itemId: string,
  activeEffects: ActiveEffect[],
  gameDay: number,
): ActiveEffect[] {
  const item = getConsumableItem(itemId)
  if (!item) return activeEffects

  const result = [...activeEffects]

  // Combine primary effects and side effects into one pass
  const allEffects: Array<{ effect: ConsumableEffect; isSideEffect: boolean }> = [
    ...item.effects.map(e => ({ effect: e, isSideEffect: false })),
    ...(item.sideEffects ?? []).map(e => ({ effect: e, isSideEffect: true })),
  ]

  for (const { effect } of allEffects) {
    // Immediate effects (heal, morale, resource, cure_sickness with duration 0)
    // are not tracked as active effects -- they are applied instantly by the
    // caller. We still create entries for them so getActiveEffectsSummary can
    // report them. For truly instant effects (duration 0 and no base duration),
    // we give them a single-turn lifetime so tickEffects cleans them up.

    const effectDuration = effect.duration ?? item.duration
    const effectType = mapConsumableEffectType(effect.type)

    // Skip types that don't translate to active effects
    if (effectType === null) continue

    // Look for an existing effect from the same source item AND same stat
    const existingIdx = result.findIndex(
      e =>
        e.sourceItemId === itemId &&
        e.type === effectType &&
        e.stat === (effect.stat ?? undefined),
    )

    if (existingIdx !== -1) {
      // Stack: increment count and extend duration
      const existing = result[existingIdx]
      const newStackCount = Math.min(existing.stackCount + 1, item.maxStacks)
      const maxDuration = effectDuration * 2
      const extendedDuration = Math.min(existing.remainingTurns + effectDuration, maxDuration)

      result[existingIdx] = {
        ...existing,
        stackCount: newStackCount,
        remainingTurns: extendedDuration,
        value: effect.value * newStackCount,
        appliedAt: gameDay,
      }
    } else {
      // New effect
      result.push({
        id: generateEffectId(itemId),
        sourceItemId: itemId,
        sourceName: item.name,
        type: effectType,
        stat: effect.stat,
        value: effect.value,
        remainingTurns: effectDuration === 0 ? 1 : effectDuration,
        stackCount: 1,
        maxStacks: item.maxStacks,
        appliedAt: gameDay,
      })
    }
  }

  return result
}

/**
 * Map a ConsumableEffectType to an ActiveEffect EffectType.
 * Returns null for types that don't become persistent active effects.
 */
function mapConsumableEffectType(type: ConsumableEffectType): EffectType | null {
  switch (type) {
    case 'stat_buff':
      return 'stat_buff'
    case 'stat_debuff':
      return 'stat_debuff'
    case 'heal_over_time':
      return 'heal_over_time'
    case 'resource':
      return 'resource_regen'
    case 'resistance':
      return 'resistance'
    case 'special':
      return 'special'
    // These are instant and handled separately by the game logic
    case 'heal':
    case 'cure_sickness':
    case 'morale':
      return null
  }
}

// ---------------------------------------------------------------------------
// Core: tick effects each game day
// ---------------------------------------------------------------------------

/**
 * Called once per game day / travel turn. Decrements remaining turns on all
 * active effects and removes any that have expired.
 *
 * Returns the updated array (does not mutate the input).
 */
export function tickEffects(activeEffects: ActiveEffect[]): ActiveEffect[] {
  return activeEffects
    .map(effect => ({
      ...effect,
      remainingTurns: effect.remainingTurns - 1,
    }))
    .filter(effect => effect.remainingTurns > 0)
}

// ---------------------------------------------------------------------------
// Core: aggregate stat modifiers
// ---------------------------------------------------------------------------

/** S.A.D.D.L.E. stats as a partial record for modifier aggregation. */
export type SaddleStatModifiers = Partial<Record<StatName, number>>

/**
 * Calculate the total stat modifiers from all currently active effects.
 * Buffs add, debuffs subtract. Multiple effects targeting the same stat
 * are fully additive (even from different sources).
 */
export function getStatModifiers(activeEffects: ActiveEffect[]): SaddleStatModifiers {
  const modifiers: SaddleStatModifiers = {}

  for (const effect of activeEffects) {
    if (!effect.stat) continue

    if (effect.type === 'stat_buff') {
      modifiers[effect.stat] = (modifiers[effect.stat] ?? 0) + effect.value
    } else if (effect.type === 'stat_debuff') {
      modifiers[effect.stat] = (modifiers[effect.stat] ?? 0) - effect.value
    }
  }

  return modifiers
}

// ---------------------------------------------------------------------------
// Core: heal-over-time extraction
// ---------------------------------------------------------------------------

/**
 * Calculate the total heal-over-time value to apply this turn.
 * The caller should add this to the character's health.
 */
export function getHealOverTimeTotal(activeEffects: ActiveEffect[]): number {
  return activeEffects
    .filter(e => e.type === 'heal_over_time')
    .reduce((sum, e) => sum + e.value, 0)
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Produce human-readable descriptions for all active effects.
 * Example outputs:
 *   "Hot Coffee: +1 Agility (1 day remaining, 2 stacks)"
 *   "Medicine Kit: Healing 8 HP/day (2 days remaining)"
 */
export function getActiveEffectsSummary(activeEffects: ActiveEffect[]): string[] {
  return activeEffects.map(effect => {
    const parts: string[] = []

    // Source name
    parts.push(`${effect.sourceName}:`)

    // Effect description
    switch (effect.type) {
      case 'stat_buff':
        parts.push(`+${effect.value} ${effect.stat}`)
        break
      case 'stat_debuff':
        parts.push(`-${effect.value} ${effect.stat}`)
        break
      case 'heal_over_time':
        parts.push(`Healing ${effect.value} HP/day`)
        break
      case 'resource_regen':
        parts.push(`Resource regen +${effect.value}`)
        break
      case 'resistance':
        parts.push(`Disease resistance +${effect.value}`)
        break
      case 'special':
        parts.push('Special effect active')
        break
    }

    // Duration
    const dayLabel = effect.remainingTurns === 1 ? 'day' : 'days'
    parts.push(`(${effect.remainingTurns} ${dayLabel} remaining`)

    // Stack info (only show if stackable and more than 1)
    if (effect.stackCount > 1) {
      parts[parts.length - 1] += `, ${effect.stackCount} stacks)`
    } else {
      parts[parts.length - 1] += ')'
    }

    return parts.join(' ')
  })
}

/**
 * Return a compact tooltip-style description for a consumable item,
 * listing all of its effects and side effects.
 */
export function getConsumableTooltip(itemId: string): string[] {
  const item = getConsumableItem(itemId)
  if (!item) return ['Unknown item']

  const lines: string[] = []
  lines.push(`${item.emoji} ${item.name}`)
  lines.push(item.description)
  lines.push('')

  // Primary effects
  for (const effect of item.effects) {
    lines.push(`  ${formatEffect(effect, item.duration)}`)
  }

  // Side effects
  if (item.sideEffects && item.sideEffects.length > 0) {
    lines.push('  Side effects:')
    for (const effect of item.sideEffects) {
      lines.push(`    ${formatEffect(effect, item.duration)}`)
    }
  }

  // Meta info
  if (item.stackable && item.maxStacks > 1) {
    lines.push(`  Stackable (max ${item.maxStacks})`)
  }
  if (item.cooldown) {
    lines.push(`  Cooldown: ${item.cooldown} day${item.cooldown !== 1 ? 's' : ''}`)
  }
  if (item.partyWide) {
    lines.push('  Affects entire party')
  }
  if (item.warningText) {
    lines.push(`  Warning: ${item.warningText}`)
  }

  return lines
}

/** Format a single ConsumableEffect for display. */
function formatEffect(effect: ConsumableEffect, defaultDuration: number): string {
  const dur = effect.duration ?? defaultDuration
  const durStr = dur > 0 ? ` (${dur} day${dur !== 1 ? 's' : ''})` : ''

  switch (effect.type) {
    case 'stat_buff':
      return `+${effect.value} ${effect.stat}${durStr}`
    case 'stat_debuff':
      return `-${effect.value} ${effect.stat}${durStr}`
    case 'heal':
      return `+${effect.value} Health`
    case 'heal_over_time':
      return `+${effect.value} HP/day${durStr}`
    case 'cure_sickness':
      return effect.sicknessTarget
        ? `Cures ${formatSickness(effect.sicknessTarget)}`
        : 'Cures sickness'
    case 'morale':
      return `+${effect.value} Morale`
    case 'resource':
      return `+${effect.value} Resources${durStr}`
    case 'resistance':
      return `Disease resistance +${effect.value}${durStr}`
    case 'special':
      return `Special effect${durStr}`
  }
}

/** Human-readable sickness name. */
function formatSickness(sickness: SicknessType): string {
  switch (sickness) {
    case 'dysentery':
      return 'Dysentery'
    case 'typhoid':
      return 'Typhoid Fever'
    case 'cholera':
      return 'Cholera'
    case 'broken_leg':
      return 'Broken Leg'
    case 'snakebite':
      return 'Snakebite'
  }
}

// ---------------------------------------------------------------------------
// Utility: extract instant effects for the caller to apply
// ---------------------------------------------------------------------------

export interface InstantEffects {
  healAmount: number
  moraleAmount: number
  curesSickness: boolean
  curesSicknessType?: SicknessType
  resourceAmount: number
}

/**
 * Extract the instant (non-duration) effects from a consumable so the
 * game logic can apply them immediately (health, morale, cure).
 */
export function getInstantEffects(itemId: string): InstantEffects {
  const item = getConsumableItem(itemId)
  const result: InstantEffects = {
    healAmount: 0,
    moraleAmount: 0,
    curesSickness: false,
    resourceAmount: 0,
  }

  if (!item) return result

  for (const effect of item.effects) {
    switch (effect.type) {
      case 'heal':
        result.healAmount += effect.value
        break
      case 'morale':
        result.moraleAmount += effect.value
        break
      case 'cure_sickness':
        result.curesSickness = true
        if (effect.sicknessTarget) {
          result.curesSicknessType = effect.sicknessTarget
        }
        break
      case 'resource':
        result.resourceAmount += effect.value
        break
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Utility: check for addiction warnings
// ---------------------------------------------------------------------------

/**
 * Check if a consumable triggers its warning text based on current stacks.
 * Returns the warning string if conditions are met, undefined otherwise.
 */
export function getAddictionWarning(
  itemId: string,
  activeEffects: ActiveEffect[],
): string | undefined {
  const item = getConsumableItem(itemId)
  if (!item?.warningText) return undefined

  const currentStacks = activeEffects
    .filter(e => e.sourceItemId === itemId)
    .reduce((max, e) => Math.max(max, e.stackCount), 0)

  // Trigger warning at maxStacks - 1 or higher (approaching limit)
  if (currentStacks >= (item.maxStacks - 1)) {
    return item.warningText
  }

  return undefined
}

// ---------------------------------------------------------------------------
// Utility: check for special effects (hidden dialogue, etc.)
// ---------------------------------------------------------------------------

/**
 * Check whether any active effect grants the 'special' type,
 * which can unlock hidden dialogue or unique interactions.
 */
export function hasSpecialEffect(activeEffects: ActiveEffect[]): boolean {
  return activeEffects.some(e => e.type === 'special')
}

/**
 * Get a list of source item IDs contributing special effects.
 * Useful for determining which specific item triggered an interaction.
 */
export function getSpecialEffectSources(activeEffects: ActiveEffect[]): string[] {
  return activeEffects
    .filter(e => e.type === 'special')
    .map(e => e.sourceItemId)
}
