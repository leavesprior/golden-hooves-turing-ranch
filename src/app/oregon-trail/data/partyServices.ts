/**
 * Party Services System — Camp & Trail Services
 *
 * Each posse member can offer services based on their PartyRole.
 * Services cost gold (modified by loyalty tier), have cooldowns,
 * and provide mechanical effects plus Mark Twain narrator commentary.
 */

import type { PartyRole } from './posseSystem'

// ============================================================================
// TYPES
// ============================================================================

export interface PartyService {
  id: string
  roleRequired: PartyRole
  name: string
  emoji: string
  description: string
  category: 'medical' | 'repair' | 'food' | 'scouting' | 'combat' | 'social' | 'navigation'
  baseCost: number
  cooldownDays: number
  effects: {
    healthTarget?: 'individual' | 'party'
    healthDelta?: number
    moraleDelta?: number
    wagonRepair?: number
    foodGain?: number
    scoutReveal?: boolean
    statBuff?: { stat: string; delta: number; durationDays: number }
    shopDiscount?: number
  }
  loyaltyRequirement?: number
  narratorComment?: string
}

export const COST_MULTIPLIERS = {
  original_party: 0,
  hired_loyal: 0.5,
  hired_standard: 1.0,
  hired_disgruntled: 1.5,
} as const

/** Cost tier keys derived from the multiplier table */
export type CostTier = keyof typeof COST_MULTIPLIERS

// ============================================================================
// SERVICES DATA
// ============================================================================

export const PARTY_SERVICES: PartyService[] = [
  // ── MEDIC ──────────────────────────────────────────────────────────────
  {
    id: 'medic_treat_wounds',
    roleRequired: 'medic',
    name: 'Treat Wounds',
    emoji: '\ud83e\ude79',
    description: 'Clean and dress injuries with whatever the frontier provides.',
    category: 'medical',
    baseCost: 5,
    cooldownDays: 0,
    effects: {
      healthTarget: 'individual',
      healthDelta: 30,
    },
    narratorComment: 'The medic applied a poultice of mud, whiskey, and optimism. Two of those ingredients actually work.',
  },
  {
    id: 'medic_cure_disease',
    roleRequired: 'medic',
    name: 'Cure Disease',
    emoji: '\ud83d\udc8a',
    description: 'Administer treatment for cholera, dysentery, or whatever plague the trail has conjured today.',
    category: 'medical',
    baseCost: 15,
    cooldownDays: 3,
    effects: {
      healthTarget: 'individual',
      healthDelta: 50,
    },
    loyaltyRequirement: 30,
    narratorComment: 'Curing disease on the frontier is less about medicine and more about convincing the patient they are not, in fact, dying. The medic excels at both.',
  },
  {
    id: 'medic_health_checkup',
    roleRequired: 'medic',
    name: 'Health Checkup',
    emoji: '\ud83e\ude7a',
    description: 'A thorough examination that wards off illness for the next three days.',
    category: 'medical',
    baseCost: 8,
    cooldownDays: 2,
    effects: {
      healthTarget: 'party',
      statBuff: { stat: 'disease_resistance', delta: 40, durationDays: 3 },
    },
    narratorComment: 'The checkup revealed that everyone is malnourished, sunburnt, and spiritually exhausted. In frontier terms, that is a clean bill of health.',
  },

  // ── MECHANIC ───────────────────────────────────────────────────────────
  {
    id: 'mechanic_quick_fix',
    roleRequired: 'mechanic',
    name: 'Quick Fix',
    emoji: '\ud83d\udd27',
    description: 'Patch the wagon with wire, spit, and stubborn determination.',
    category: 'repair',
    baseCost: 5,
    cooldownDays: 0,
    effects: {
      wagonRepair: 20,
    },
    narratorComment: 'The mechanic fixed the axle with a bent nail and a prayer. The nail did most of the work.',
  },
  {
    id: 'mechanic_reinforce_wagon',
    roleRequired: 'mechanic',
    name: 'Reinforce Wagon',
    emoji: '\ud83d\udee0\ufe0f',
    description: 'Strengthen the wagon frame and grease the wheels for reduced wear.',
    category: 'repair',
    baseCost: 15,
    cooldownDays: 5,
    effects: {
      wagonRepair: 50,
      statBuff: { stat: 'wagon_durability', delta: 25, durationDays: 3 },
    },
    loyaltyRequirement: 40,
    narratorComment: 'Patches reinforced every joint and beam with the tenderness of a man who loves wagons more than people. The wagon, for its part, said nothing, which Patches took as approval.',
  },
  {
    id: 'mechanic_inspect_gear',
    roleRequired: 'mechanic',
    name: 'Inspect Gear',
    emoji: '\ud83d\udd0d',
    description: 'Examine the wagon and equipment to reveal their true condition.',
    category: 'repair',
    baseCost: 0,
    cooldownDays: 1,
    effects: {
      scoutReveal: true,
    },
    narratorComment: 'The mechanic tapped every board and listened. He nodded gravely. Either the wagon is sound, or the mechanic is deaf. Time will tell.',
  },

  // ── COOK ───────────────────────────────────────────────────────────────
  {
    id: 'cook_trail_meal',
    roleRequired: 'cook',
    name: 'Trail Meal',
    emoji: '\ud83c\udf72',
    description: 'Stretch the rations into something that resembles an actual meal.',
    category: 'food',
    baseCost: 3,
    cooldownDays: 0,
    effects: {
      foodGain: 10,
    },
    narratorComment: 'The cook turned hardtack and despair into a passable stew. No one asked what the meat was. Wisdom, on the frontier, is knowing when not to inquire.',
  },
  {
    id: 'cook_frontier_feast',
    roleRequired: 'cook',
    name: 'Frontier Feast',
    emoji: '\ud83c\udf56',
    description: 'A proper meal with all the trimmings. Lifts spirits and fills bellies.',
    category: 'food',
    baseCost: 12,
    cooldownDays: 3,
    effects: {
      foodGain: 30,
      moraleDelta: 10,
    },
    loyaltyRequirement: 50,
    narratorComment: 'Cookie produced a feast so magnificent that for one brief evening the party forgot they were a thousand miles from civilization, eating off tin plates, and probably doomed. That is the power of good cooking.',
  },

  // ── HUNTER ─────────────────────────────────────────────────────────────
  {
    id: 'hunter_hunting_party',
    roleRequired: 'hunter',
    name: 'Hunting Party',
    emoji: '\ud83c\udff9',
    description: 'Organize a proper hunt. Results vary with the terrain and your hunter\'s mood.',
    category: 'food',
    baseCost: 5,
    cooldownDays: 1,
    effects: {
      foodGain: 30,
    },
    narratorComment: 'The hunter returned with enough game to feed the party and a story about the one that got away. The story, naturally, involved a bear of impossible dimensions.',
  },
  {
    id: 'hunter_set_traps',
    roleRequired: 'hunter',
    name: 'Set Traps',
    emoji: '\ud83e\udea4',
    description: 'Lay snares and traps along the trail for a steady trickle of game.',
    category: 'food',
    baseCost: 8,
    cooldownDays: 4,
    effects: {
      statBuff: { stat: 'passive_food', delta: 5, durationDays: 3 },
    },
    loyaltyRequirement: 35,
    narratorComment: 'The traps were set with the quiet expertise of a man who has spent more time conversing with rabbits than with people. The rabbits, alas, were not consulted on the arrangement.',
  },

  // ── SCOUT ──────────────────────────────────────────────────────────────
  {
    id: 'scout_terrain_scan',
    roleRequired: 'scout',
    name: 'Terrain Scan',
    emoji: '\ud83d\uddfa\ufe0f',
    description: 'Scout ahead and report on the next two landmarks along the trail.',
    category: 'scouting',
    baseCost: 5,
    cooldownDays: 2,
    effects: {
      scoutReveal: true,
    },
    narratorComment: 'The scout vanished at dawn and returned at dusk with a detailed report and a suspicious reluctance to discuss what happened between noon and three o\'clock.',
  },
  {
    id: 'scout_night_watch',
    roleRequired: 'scout',
    name: 'Night Watch',
    emoji: '\ud83c\udf19',
    description: 'Stand vigilant through the night. No ambush will catch the party unaware.',
    category: 'scouting',
    baseCost: 8,
    cooldownDays: 3,
    effects: {
      statBuff: { stat: 'ambush_immunity', delta: 1, durationDays: 2 },
    },
    loyaltyRequirement: 40,
    narratorComment: 'The scout kept watch all night without complaint. Whether this was dedication or insomnia, the narrator cannot say, but the result was the same.',
  },

  // ── GUARD ──────────────────────────────────────────────────────────────
  {
    id: 'guard_fortify_camp',
    roleRequired: 'guard',
    name: 'Fortify Camp',
    emoji: '\ud83d\udee1\ufe0f',
    description: 'Barricade the camp perimeter. Any attacker will think twice.',
    category: 'combat',
    baseCost: 8,
    cooldownDays: 3,
    effects: {
      statBuff: { stat: 'combat_bonus', delta: 20, durationDays: 2 },
    },
    narratorComment: 'The guard fortified the camp with such thoroughness that it resembled a small fortress. The only thing missing was a moat, and the narrator suspects the guard was considering it.',
  },
  {
    id: 'guard_combat_training',
    roleRequired: 'guard',
    name: 'Combat Training',
    emoji: '\u2694\ufe0f',
    description: 'Drill the party in frontier combat. The lesson sticks until the next real fight.',
    category: 'combat',
    baseCost: 12,
    cooldownDays: 5,
    effects: {
      statBuff: { stat: 'combat_bonus', delta: 10, durationDays: 99 },
      moraleDelta: 3,
    },
    loyaltyRequirement: 50,
    narratorComment: 'Iron Bear taught the party to fight with fists, sticks, and harsh language. By sundown, everyone was bruised but considerably more dangerous. The narrator took notes from a safe distance.',
  },

  // ── NAVIGATOR ──────────────────────────────────────────────────────────
  {
    id: 'navigator_find_shortcut',
    roleRequired: 'navigator',
    name: 'Find Shortcut',
    emoji: '\ud83e\udded',
    description: 'Chart an alternate route that shaves a full day off the journey.',
    category: 'navigation',
    baseCost: 10,
    cooldownDays: 4,
    effects: {
      statBuff: { stat: 'travel_days_saved', delta: 1, durationDays: 1 },
    },
    loyaltyRequirement: 45,
    narratorComment: 'The navigator found a shortcut through a canyon that no map has ever recorded. Whether this is genius or recklessness depends entirely on whether the canyon has a bottom.',
  },
  {
    id: 'navigator_star_reading',
    roleRequired: 'navigator',
    name: 'Star Reading',
    emoji: '\u2b50',
    description: 'Read the heavens to predict the weather for the next three days.',
    category: 'navigation',
    baseCost: 5,
    cooldownDays: 2,
    effects: {
      scoutReveal: true,
    },
    narratorComment: 'The Professor gazed at the stars and declared it would rain on Thursday. The stars, as always, offered no rebuttal. The narrator finds astronomy to be the most polite of the sciences.',
  },

  // ── DIPLOMAT ───────────────────────────────────────────────────────────
  {
    id: 'diplomat_inspiring_speech',
    roleRequired: 'diplomat',
    name: 'Inspiring Speech',
    emoji: '\ud83c\udf99\ufe0f',
    description: 'Rally the party with eloquence, charm, and possibly fabricated anecdotes.',
    category: 'social',
    baseCost: 5,
    cooldownDays: 2,
    effects: {
      moraleDelta: 15,
      healthTarget: 'party',
    },
    narratorComment: 'Beau delivered a speech so stirring that even the oxen seemed moved. The narrator suspects at least half the anecdotes were invented, but acknowledges that invention is the soul of inspiration.',
  },
  {
    id: 'diplomat_negotiate',
    roleRequired: 'diplomat',
    name: 'Negotiate',
    emoji: '\ud83e\udd1d',
    description: 'Smooth-talk the next shopkeeper into a generous discount.',
    category: 'social',
    baseCost: 8,
    cooldownDays: 3,
    effects: {
      shopDiscount: 20,
    },
    loyaltyRequirement: 35,
    narratorComment: 'Beau walked into the shop, and within ten minutes the shopkeeper was apologizing for his own prices. This is either diplomacy or witchcraft. The narrator has witnessed both and cannot always tell the difference.',
  },

  // ── LEADER ─────────────────────────────────────────────────────────────
  {
    id: 'leader_rally',
    roleRequired: 'leader',
    name: 'Rally',
    emoji: '\ud83d\udcef',
    description: 'The wagon leader steadies the party with quiet confidence and shared purpose.',
    category: 'social',
    baseCost: 0,
    cooldownDays: 1,
    effects: {
      moraleDelta: 10,
      healthTarget: 'party',
    },
    narratorComment: 'The leader said a few words, and somehow the miles ahead seemed shorter and the load lighter. Leadership, the narrator observes, is the art of making the impossible feel merely improbable.',
  },

  // ── COMPANION ──────────────────────────────────────────────────────────
  {
    id: 'companion_idle_chat',
    roleRequired: 'companion',
    name: 'Idle Chat',
    emoji: '\ud83d\udcac',
    description: 'Share stories, complaints, and questionable jokes around the campfire.',
    category: 'social',
    baseCost: 0,
    cooldownDays: 0,
    effects: {
      moraleDelta: 3,
      healthTarget: 'party',
    },
    narratorComment: 'The party exchanged stories of no particular importance. This is, the narrator has found, the very foundation of human happiness — talking about nothing with people who care about you.',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine the cost tier for a party member based on loyalty and hire status.
 * Original party members pay nothing; hired members pay according to loyalty.
 */
export function getCostTier(loyalty?: number, isHired?: boolean): CostTier {
  if (!isHired) return 'original_party'
  if (!loyalty || loyalty >= 70) return 'hired_loyal'
  if (loyalty >= 40) return 'hired_standard'
  return 'hired_disgruntled'
}

/**
 * Get all services available for a given party role
 */
export function getServicesForRole(role: PartyRole): PartyService[] {
  return PARTY_SERVICES.filter(s => s.roleRequired === role)
}

/**
 * Get every service in the system
 */
export function getAllServices(): PartyService[] {
  return PARTY_SERVICES
}

/**
 * Calculate the actual gold cost of a service given a cost tier
 */
export function getServiceCost(service: PartyService, tier: CostTier): number {
  return Math.round(service.baseCost * COST_MULTIPLIERS[tier])
}

/**
 * Check whether a party member meets the loyalty requirement for a service
 */
export function meetsLoyaltyRequirement(service: PartyService, loyalty: number): boolean {
  if (service.loyaltyRequirement === undefined) return true
  return loyalty >= service.loyaltyRequirement
}
