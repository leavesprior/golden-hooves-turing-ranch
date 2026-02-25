/**
 * Strategic Army/Posse System — Improvement #6
 * Inspired by: Heroes of Might & Magic II (New World Computing, 1996)
 *
 * Extends the basic PartyMember with roles, specialties, and
 * per-member bonuses. The guide system expands to a posse system
 * where multiple companions can be hired, each with unique abilities.
 *
 * Posse members provide passive bonuses while traveling, active
 * abilities in events, and composition bonuses when certain
 * combinations are present.
 */

import type { StatName } from '../characterContext'

// ============================================================================
// PARTY ROLES
// ============================================================================

export type PartyRole =
  | 'leader'        // The player character (wagon leader)
  | 'scout'         // Finds shortcuts, warns of danger
  | 'medic'         // Heals party members, prevents disease
  | 'hunter'        // Improves food yield from hunting
  | 'mechanic'      // Repairs wagon, reduces breakdown chance
  | 'guard'         // Protects against bandits, improves combat events
  | 'cook'          // Stretches food rations further
  | 'navigator'     // Increases daily travel distance
  | 'diplomat'      // Better NPC interactions, shop discounts
  | 'companion'     // No special role (default party member)

export interface RoleBonus {
  type: 'travel_speed' | 'food_efficiency' | 'hunting' | 'wagon_repair'
    | 'disease_resist' | 'combat' | 'shop_discount' | 'river_crossing'
    | 'morale' | 'danger_warning'
  value: number
  description: string
}

/** Passive bonuses granted by each role */
export const ROLE_BONUSES: Record<PartyRole, RoleBonus[]> = {
  leader: [
    { type: 'morale', value: 5, description: 'Leadership inspires the party (+5 max morale)' },
  ],
  scout: [
    { type: 'travel_speed', value: 10, description: '+10% travel speed from scouting ahead' },
    { type: 'danger_warning', value: 1, description: 'Scouts warn of trouble 1 day early' },
  ],
  medic: [
    { type: 'disease_resist', value: 30, description: '30% disease resistance for party' },
  ],
  hunter: [
    { type: 'hunting', value: 40, description: '+40% food from hunting' },
    { type: 'food_efficiency', value: 5, description: '5% less food consumed daily' },
  ],
  mechanic: [
    { type: 'wagon_repair', value: 20, description: 'Wagon degrades 20% slower' },
  ],
  guard: [
    { type: 'combat', value: 25, description: '+25% success in combat events' },
    { type: 'morale', value: 3, description: 'Party feels safer (+3 morale)' },
  ],
  cook: [
    { type: 'food_efficiency', value: 20, description: '20% less food consumed daily' },
    { type: 'morale', value: 2, description: 'Good meals boost morale (+2)' },
  ],
  navigator: [
    { type: 'travel_speed', value: 15, description: '+15% daily travel distance' },
    { type: 'river_crossing', value: 2, description: '+2 to river crossing rolls' },
  ],
  diplomat: [
    { type: 'shop_discount', value: 10, description: '10% discount at all shops' },
    { type: 'morale', value: 2, description: 'Smooth talker keeps spirits up (+2)' },
  ],
  companion: [
    { type: 'morale', value: 1, description: 'Company on the trail (+1 morale)' },
  ],
}

// ============================================================================
// POSSE MEMBERS (recruitable beyond starting party)
// ============================================================================

export interface PosseMember {
  id: string
  name: string
  emoji: string
  title: string
  description: string
  role: PartyRole
  hireCost: number            // Neutral karma cost
  goodKarmaCost?: number      // Optional good karma requirement
  loyalty: number             // 0-100, starts here. Below 20 = deserts
  specialAbility: SpecialAbility
  statRequirement?: { stat: StatName; minimum: number }
  dispositionRequirement?: number  // Minimum NPC disposition to recruit
  spawnLocations: string[]
  personalityQuirk: string
  narratorComment: string
}

export interface SpecialAbility {
  name: string
  description: string
  type: 'passive' | 'active' | 'event_override'
  cooldownDays?: number       // For active abilities
  trigger?: string            // Event ID that triggers this ability
}

export const POSSE_MEMBERS: PosseMember[] = [
  {
    id: 'posse_cookie',
    name: 'Cookie McGee',
    emoji: '\ud83e\uddd1\u200d\ud83c\udf73',
    title: 'Trail Cook',
    description: 'A retired Army cook who can make hardtack taste like steak. His campfire stories are questionable but his beans are legendary.',
    role: 'cook',
    hireCost: 15,
    loyalty: 70,
    specialAbility: {
      name: 'Frontier Feast',
      description: 'Once per landmark, cooks a feast that restores 10 morale and heals 5 health to all',
      type: 'active',
      cooldownDays: 5,
    },
    spawnLocations: ['Independence, Missouri', 'Fort Kearny'],
    personalityQuirk: 'Hums while cooking. Always hums the same tune. Nobody knows what it is.',
    narratorComment: 'Cookie\'s food is surprisingly edible. The narrator is suspicious of anyone this cheerful.',
  },
  {
    id: 'posse_patches',
    name: 'Patches O\'Malley',
    emoji: '\ud83d\udd27',
    title: 'Wagon Mechanic',
    description: 'Lost an eye to a flying rivet and gained an encyclopedic knowledge of wagon repair. Can fix anything with wire and stubbornness.',
    role: 'mechanic',
    hireCost: 20,
    loyalty: 60,
    specialAbility: {
      name: 'Miracle Repair',
      description: 'When wagon breaks down, 50% chance of instant free repair',
      type: 'event_override',
      trigger: 'wagon_breakdown',
    },
    spawnLocations: ['Fort Kearny', 'Fort Laramie', 'Fort Bridger'],
    personalityQuirk: 'Talks to the wagon like it\'s a person. Names every wheel.',
    narratorComment: 'Patches treats wagons the way some people treat horses. Better, actually.',
  },
  {
    id: 'posse_hawkeye',
    name: 'Hawkeye Jenkins',
    emoji: '\ud83c\udff9',
    title: 'Sharpshooter & Scout',
    description: 'Can shoot a rabbit at 200 yards and track a whisper through a storm. Doesn\'t talk much, but every word counts.',
    role: 'scout',
    hireCost: 25,
    loyalty: 55,
    specialAbility: {
      name: 'Eagle Eye',
      description: 'Reveals hidden events and shortcuts at each landmark',
      type: 'passive',
    },
    statRequirement: { stat: 'Agility', minimum: 6 },
    spawnLocations: ['Chimney Rock', 'Independence Rock', 'South Pass'],
    personalityQuirk: 'Speaks in three-word sentences. Maximum.',
    narratorComment: 'The narrator appreciates Hawkeye\'s economy with words. A kindred spirit.',
  },
  {
    id: 'posse_sister_grace',
    name: 'Sister Grace',
    emoji: '\u271d\ufe0f',
    title: 'Traveling Nurse',
    description: 'A nun with medical training who left the convent to tend to trail emigrants. Stern but compassionate.',
    role: 'medic',
    hireCost: 20,
    goodKarmaCost: 5,
    loyalty: 80,
    specialAbility: {
      name: 'Divine Healing',
      description: 'Can cure any disease once per landmark, no medicine needed',
      type: 'active',
      cooldownDays: 4,
    },
    spawnLocations: ['Independence, Missouri', 'Fort Kearny', 'Fort Laramie'],
    personalityQuirk: 'Prays before every meal. And before every amputation.',
    narratorComment: 'Sister Grace is proof that faith and practical skill are not mutually exclusive. The narrator finds this inconvenient to their worldview.',
  },
  {
    id: 'posse_iron_bear',
    name: 'Iron Bear',
    emoji: '\ud83d\udee1\ufe0f',
    title: 'Trail Guardian',
    description: 'A mountain of a man who worked as a railroad guard. His mere presence deters trouble.',
    role: 'guard',
    hireCost: 30,
    loyalty: 65,
    specialAbility: {
      name: 'Intimidation',
      description: 'Bandits and hostile encounters have 40% chance of fleeing before combat',
      type: 'event_override',
      trigger: 'bandit_attack',
    },
    statRequirement: { stat: 'Durability', minimum: 5 },
    spawnLocations: ['Fort Laramie', 'Fort Bridger', 'Fort Hall'],
    personalityQuirk: 'Carved his own chess set from river stones. Plays himself. Always wins.',
    narratorComment: 'Iron Bear is the kind of person who makes a room quieter just by entering it.',
  },
  {
    id: 'posse_silver_tongue',
    name: 'Beauregard "Beau" Fontaine',
    emoji: '\ud83c\udfa9',
    title: 'Traveling Diplomat',
    description: 'A former riverboat gambler who can talk anyone into anything. His charm is a weapon.',
    role: 'diplomat',
    hireCost: 18,
    loyalty: 45,  // Low loyalty — he's an opportunist
    specialAbility: {
      name: 'Silver Tongue',
      description: 'Can talk down any hostile encounter. Shops give extra 15% discount.',
      type: 'passive',
    },
    statRequirement: { stat: 'Diplomacy', minimum: 7 },
    spawnLocations: ['Independence, Missouri', 'Chimney Rock', 'Soda Springs'],
    personalityQuirk: 'Never tells the same story twice. None of them are true.',
    narratorComment: 'Beau is a professional liar. The narrator feels a professional rivalry.',
  },
  {
    id: 'posse_billy_buck',
    name: 'Billy Buck',
    emoji: '\ud83e\udd20',
    title: 'Prairie Hunter',
    description: 'A young hunter who grew up on the prairie. Can track anything that leaves prints and some things that don\'t.',
    role: 'hunter',
    hireCost: 12,
    loyalty: 75,
    specialAbility: {
      name: 'Legendary Tracker',
      description: 'Hunting always succeeds. Yields 50% more food.',
      type: 'passive',
    },
    spawnLocations: ['Independence, Missouri', 'Fort Kearny', 'Chimney Rock', 'South Pass'],
    personalityQuirk: 'Names every animal before shooting it. Says it\'s respectful.',
    narratorComment: 'Billy Buck is so young that his enthusiasm hasn\'t been crushed by reality yet. The narrator envies this.',
  },
  {
    id: 'posse_stargazer',
    name: 'Professor Aldrich',
    emoji: '\ud83d\udd2d',
    title: 'Astronomer & Navigator',
    description: 'A university professor mapping stars for the Smithsonian. His navigation skills are unparalleled.',
    role: 'navigator',
    hireCost: 22,
    loyalty: 60,
    specialAbility: {
      name: 'Celestial Navigation',
      description: 'Night travel has zero penalty. Always knows exact distance to next landmark.',
      type: 'passive',
    },
    statRequirement: { stat: 'Expertise', minimum: 6 },
    spawnLocations: ['Fort Laramie', 'Independence Rock', 'City of Rocks'],
    personalityQuirk: 'Carries a telescope everywhere. Stops mid-sentence to look at the sky.',
    narratorComment: 'The Professor looks up while everyone else looks ahead. Somehow he never trips.',
  },
]

// ============================================================================
// COMPOSITION BONUSES
// ============================================================================

export interface CompositionBonus {
  id: string
  name: string
  requiredRoles: PartyRole[]    // All of these must be present
  bonus: RoleBonus
  narratorComment: string
}

/** Synergy bonuses when specific role combinations exist */
export const COMPOSITION_BONUSES: CompositionBonus[] = [
  {
    id: 'comp_fortified_camp',
    name: 'Fortified Camp',
    requiredRoles: ['guard', 'mechanic'],
    bonus: { type: 'wagon_repair', value: 10, description: 'Guard + mechanic: wagon takes 10% less damage' },
    narratorComment: 'Iron Bear watches while Patches works. Nothing attacks. Nothing breaks. It\'s almost boring.',
  },
  {
    id: 'comp_feast_and_medicine',
    name: 'Full Belly, Full Health',
    requiredRoles: ['cook', 'medic'],
    bonus: { type: 'disease_resist', value: 15, description: 'Good food + medicine: +15% disease resistance' },
    narratorComment: 'Cookie feeds them, Sister Grace heals them. The party is annoyingly healthy.',
  },
  {
    id: 'comp_pathfinder',
    name: 'Pathfinder Corps',
    requiredRoles: ['scout', 'navigator'],
    bonus: { type: 'travel_speed', value: 10, description: 'Scout + navigator: +10% bonus travel speed' },
    narratorComment: 'One reads the stars, the other reads the ground. Between them, nothing is missed.',
  },
  {
    id: 'comp_negotiators',
    name: 'Smooth Operators',
    requiredRoles: ['diplomat', 'cook'],
    bonus: { type: 'shop_discount', value: 5, description: 'Diplomat + cook: extra 5% shop discount' },
    narratorComment: 'Beau talks, Cookie bribes with pastries. Commerce bends to their will.',
  },
  {
    id: 'comp_wilderness_team',
    name: 'Wilderness Survival Team',
    requiredRoles: ['hunter', 'scout'],
    bonus: { type: 'food_efficiency', value: 10, description: 'Hunter + scout: 10% less food wasted' },
    narratorComment: 'They find the game, they find the water. The frontier feels almost hospitable.',
  },
  {
    id: 'comp_full_posse',
    name: 'Full Posse',
    requiredRoles: ['guard', 'scout', 'medic'],
    bonus: { type: 'morale', value: 10, description: 'Protected, informed, and healthy: +10 morale' },
    narratorComment: 'A scout, a guard, and a medic walk into a wagon... it\'s not a joke, it\'s good planning.',
  },
]

// ============================================================================
// LOYALTY SYSTEM
// ============================================================================

export interface LoyaltyEvent {
  event: string
  loyaltyDelta: number
  description: string
}

/** Events that affect posse member loyalty */
export const LOYALTY_EVENTS: LoyaltyEvent[] = [
  { event: 'good_food', loyaltyDelta: 2, description: 'Well-fed party: loyalty increases' },
  { event: 'starving', loyaltyDelta: -5, description: 'No food: loyalty drops sharply' },
  { event: 'victory', loyaltyDelta: 3, description: 'Successful event outcome: morale boost' },
  { event: 'defeat', loyaltyDelta: -3, description: 'Failed event: doubt creeps in' },
  { event: 'party_death', loyaltyDelta: -8, description: 'Party member died: trust shaken' },
  { event: 'reached_landmark', loyaltyDelta: 2, description: 'Progress: confidence grows' },
  { event: 'long_stall', loyaltyDelta: -4, description: 'No progress for 5+ days' },
  { event: 'paid_bonus', loyaltyDelta: 5, description: 'Extra payment: loyalty purchased' },
  { event: 'low_morale_3_days', loyaltyDelta: -5, description: 'Morale below 20 for 3 days' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all posse members available at a given landmark
 */
export function getAvailablePosse(landmarkName: string): PosseMember[] {
  return POSSE_MEMBERS.filter(p => p.spawnLocations.includes(landmarkName))
}

/**
 * Calculate aggregate bonuses from all party roles
 */
export function calculatePartyBonuses(
  roles: PartyRole[]
): Record<string, number> {
  const bonuses: Record<string, number> = {}

  // Role bonuses
  for (const role of roles) {
    const roleBonuses = ROLE_BONUSES[role] || []
    for (const bonus of roleBonuses) {
      bonuses[bonus.type] = (bonuses[bonus.type] || 0) + bonus.value
    }
  }

  // Composition bonuses
  for (const comp of COMPOSITION_BONUSES) {
    if (comp.requiredRoles.every(r => roles.includes(r))) {
      bonuses[comp.bonus.type] = (bonuses[comp.bonus.type] || 0) + comp.bonus.value
    }
  }

  return bonuses
}

/**
 * Check if a posse member will desert based on loyalty
 */
export function checkDesertion(loyalty: number): { deserts: boolean; warning: boolean } {
  if (loyalty <= 10) {
    return { deserts: Math.random() < 0.5, warning: false }
  }
  if (loyalty <= 20) {
    return { deserts: Math.random() < 0.15, warning: true }
  }
  if (loyalty <= 30) {
    return { deserts: false, warning: true }
  }
  return { deserts: false, warning: false }
}

/**
 * Get active composition bonuses based on current party roles
 */
export function getActiveCompositionBonuses(roles: PartyRole[]): CompositionBonus[] {
  return COMPOSITION_BONUSES.filter(
    comp => comp.requiredRoles.every(r => roles.includes(r))
  )
}

/**
 * Check if player meets hiring requirements for a posse member
 */
export function meetsHiringRequirements(
  member: PosseMember,
  stats: Record<string, number>,
  npcDisposition?: number,
): { canHire: boolean; reasons: string[] } {
  const reasons: string[] = []

  if (member.statRequirement) {
    const playerStat = stats[member.statRequirement.stat] || 0
    if (playerStat < member.statRequirement.minimum) {
      reasons.push(`Requires ${member.statRequirement.stat} ${member.statRequirement.minimum} (you have ${playerStat})`)
    }
  }

  if (member.dispositionRequirement && npcDisposition !== undefined) {
    if (npcDisposition < member.dispositionRequirement) {
      reasons.push(`Requires disposition ${member.dispositionRequirement}+ (current: ${npcDisposition})`)
    }
  }

  return { canHire: reasons.length === 0, reasons }
}
