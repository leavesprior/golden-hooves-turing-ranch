import type { SaddleStats, StatName, CharacterBackground } from '@/app/oregon-trail/characterContext'

// MOO2-inspired zero-sum pick system
// Players get 12 picks. Advantages cost picks. Flaws grant picks.
// Every advantage has a meaningful trade-off.

export interface Advantage {
  id: string
  name: string
  description: string
  cost: number // Positive = costs picks, negative = grants picks (flaw)
  statModifiers: Partial<SaddleStats>
  specialAbility?: string
  incompatibleWith?: string[] // IDs of advantages this can't combine with
  requiresBackground?: CharacterBackground[]
  category: 'physical' | 'mental' | 'social' | 'supernatural' | 'flaw'
}

export const STARTING_PICKS = 12

// Advantages (cost picks)
export const ADVANTAGES: Advantage[] = [
  // === PHYSICAL ===
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'You spot details others miss. Clues at crime scenes are more revealing.',
    cost: 2,
    statModifiers: { Shrewdness: 3 },
    specialAbility: 'Crime scene clues reveal an extra trait',
    category: 'physical',
  },
  {
    id: 'iron_constitution',
    name: 'Iron Constitution',
    description: 'Trail fever, cholera, bad water — none of it sticks.',
    cost: 2,
    statModifiers: { Durability: 3 },
    specialAbility: 'Immune to disease events',
    category: 'physical',
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'When trouble comes, your hand moves before your brain.',
    cost: 2,
    statModifiers: { Agility: 3 },
    specialAbility: 'Always act first in confrontations',
    category: 'physical',
  },
  {
    id: 'trail_hardened',
    name: 'Trail Hardened',
    description: 'You\'ve crossed the Rockies twice. Nothing surprises you out here.',
    cost: 3,
    statModifiers: { Durability: 2, Expertise: 2 },
    specialAbility: 'Travel encounters are less dangerous',
    category: 'physical',
  },
  {
    id: 'light_footed',
    name: 'Light-Footed',
    description: 'You move through brush without a sound.',
    cost: 1,
    statModifiers: { Agility: 2 },
    category: 'physical',
  },

  // === MENTAL ===
  {
    id: 'born_detective',
    name: 'Born Detective',
    description: 'Patterns leap out at you. Witnesses can\'t hide inconsistencies.',
    cost: 3,
    statModifiers: { Shrewdness: 2 },
    specialAbility: 'Witness reliability is always visible',
    incompatibleWith: ['simple_minded'],
    category: 'mental',
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'You pick up new skills at twice the normal rate.',
    cost: 3,
    statModifiers: { Shrewdness: 1, Expertise: 1 },
    specialAbility: 'Double XP from skill checks',
    category: 'mental',
  },
  {
    id: 'wilderness_sage',
    name: 'Wilderness Sage',
    description: 'The land speaks to you. Hidden trails, animal signs, weather changes.',
    cost: 2,
    statModifiers: { Expertise: 3 },
    specialAbility: 'Scout action in camp always succeeds',
    category: 'mental',
  },
  {
    id: 'gold_nose',
    name: 'Gold Nose',
    description: 'Some say you can smell gold in the water. They\'re not entirely wrong.',
    cost: 2,
    statModifiers: { Expertise: 2, Luck: 1 },
    specialAbility: 'Better rewards from search actions',
    category: 'mental',
  },
  {
    id: 'card_counter',
    name: 'Card Counter',
    description: 'Numbers are your language. Odds calculate themselves in your head.',
    cost: 1,
    statModifiers: { Shrewdness: 1, Luck: 1 },
    category: 'mental',
  },

  // === SOCIAL ===
  {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: 'You could sell sand in the desert. People just... believe you.',
    cost: 3,
    statModifiers: { Diplomacy: 3 },
    specialAbility: 'Shop prices reduced by 20%',
    incompatibleWith: ['repulsive'],
    category: 'social',
  },
  {
    id: 'local_connections',
    name: 'Local Connections',
    description: 'You know someone in every town. Information flows freely to you.',
    cost: 2,
    statModifiers: { Diplomacy: 2 },
    specialAbility: 'Start with +15 Settler reputation',
    category: 'social',
  },
  {
    id: 'badge_of_authority',
    name: 'Badge of Authority',
    description: 'The Pinkerton badge opens doors. Most people cooperate immediately.',
    cost: 2,
    statModifiers: { Diplomacy: 1, Shrewdness: 1 },
    specialAbility: 'Start with +15 Pinkerton reputation',
    requiresBackground: ['pinkerton_veteran', 'army_officer'],
    category: 'social',
  },
  {
    id: 'empathic',
    name: 'Empathic',
    description: 'You feel what others feel. Their pain, their lies, their hidden truths.',
    cost: 2,
    statModifiers: { Diplomacy: 2, Shrewdness: 1 },
    specialAbility: 'NPC mood is always visible',
    category: 'social',
  },
  {
    id: 'intimidating',
    name: 'Intimidating',
    description: 'Something about your bearing makes people nervous. Outlaws talk faster.',
    cost: 1,
    statModifiers: { Diplomacy: 1 },
    specialAbility: 'Start with +10 Outlaw reputation (fear)',
    incompatibleWith: ['silver_tongue'],
    category: 'social',
  },

  // === SUPERNATURAL (expensive) ===
  {
    id: 'lucky_star',
    name: 'Lucky Star',
    description: 'Fortune favors you in ways that defy explanation.',
    cost: 3,
    statModifiers: { Luck: 4 },
    specialAbility: 'Critical failure becomes normal failure',
    category: 'supernatural',
  },
  {
    id: 'sixth_sense',
    name: 'Sixth Sense',
    description: 'A tingling in your spine warns you of danger before it arrives.',
    cost: 2,
    statModifiers: { Luck: 2, Agility: 1 },
    specialAbility: 'Warning before ambush encounters',
    category: 'supernatural',
  },
]

// Flaws (grant picks)
export const FLAWS: Advantage[] = [
  {
    id: 'city_slicker',
    name: 'City Slicker',
    description: 'You don\'t know a coyote from a cocker spaniel. The wilderness is hostile territory.',
    cost: -2,
    statModifiers: { Expertise: -3 },
    incompatibleWith: ['wilderness_sage', 'trail_hardened'],
    category: 'flaw',
  },
  {
    id: 'simple_minded',
    name: 'Simple-Minded',
    description: 'Complex puzzles give you headaches. Investigation is... not your strength.',
    cost: -2,
    statModifiers: { Shrewdness: -3 },
    incompatibleWith: ['born_detective', 'eagle_eye'],
    category: 'flaw',
  },
  {
    id: 'repulsive',
    name: 'Repulsive',
    description: 'Something about you puts people off. Bad hygiene? Worse personality?',
    cost: -3,
    statModifiers: { Diplomacy: -4 },
    specialAbility: 'Cannot improve faction reputation through socializing',
    incompatibleWith: ['silver_tongue', 'empathic', 'local_connections'],
    category: 'flaw',
  },
  {
    id: 'glass_jaw',
    name: 'Glass Jaw',
    description: 'One solid hit and you\'re seeing stars. Avoid confrontation.',
    cost: -2,
    statModifiers: { Durability: -3 },
    incompatibleWith: ['iron_constitution', 'trail_hardened'],
    category: 'flaw',
  },
  {
    id: 'jinxed',
    name: 'Jinxed',
    description: 'If something can go wrong, it will. Your companions keep their distance.',
    cost: -2,
    statModifiers: { Luck: -3 },
    specialAbility: 'Random events are more frequent and worse',
    incompatibleWith: ['lucky_star', 'sixth_sense'],
    category: 'flaw',
  },
  {
    id: 'clumsy',
    name: 'Clumsy',
    description: 'You trip over flat ground. Stealth is a foreign concept.',
    cost: -1,
    statModifiers: { Agility: -2 },
    incompatibleWith: ['quick_draw', 'light_footed'],
    category: 'flaw',
  },
  {
    id: 'wanted_man',
    name: 'Wanted Man',
    description: 'There\'s a price on your head. The Pinkertons have a long memory.',
    cost: -2,
    statModifiers: {},
    specialAbility: 'Start with -20 Pinkerton reputation',
    requiresBackground: ['outlaw_reformed', 'gambler'],
    category: 'flaw',
  },
  {
    id: 'tenderfoot',
    name: 'Tenderfoot',
    description: 'Fresh off the boat and green as spring grass.',
    cost: -1,
    statModifiers: { Durability: -1, Expertise: -1 },
    category: 'flaw',
  },
]

export const ALL_PICKS = [...ADVANTAGES, ...FLAWS]

export function getPickById(id: string): Advantage | undefined {
  return ALL_PICKS.find(p => p.id === id)
}

export function arePicksCompatible(selectedIds: string[]): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = []
  const selected = selectedIds.map(id => getPickById(id)).filter(Boolean) as Advantage[]

  for (const pick of selected) {
    if (pick.incompatibleWith) {
      for (const incompId of pick.incompatibleWith) {
        if (selectedIds.includes(incompId)) {
          conflicts.push(`${pick.name} is incompatible with ${getPickById(incompId)?.name}`)
        }
      }
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}

export function calculatePicksCost(selectedIds: string[]): number {
  return selectedIds.reduce((total, id) => {
    const pick = getPickById(id)
    return total + (pick?.cost ?? 0)
  }, 0)
}

export function calculateStatModifiers(selectedIds: string[]): Partial<SaddleStats> {
  const mods: Partial<SaddleStats> = {}
  for (const id of selectedIds) {
    const pick = getPickById(id)
    if (!pick) continue
    for (const [stat, value] of Object.entries(pick.statModifiers)) {
      const key = stat as StatName
      mods[key] = (mods[key] ?? 0) + value
    }
  }
  return mods
}
