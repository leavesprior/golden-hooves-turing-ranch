/**
 * Enemy Recruitment via Diplomacy — Improvement #9
 * Inspired by: Heroes of Might & Magic II (New World Computing, 1996)
 *
 * After talking down an enemy, the player can attempt to recruit them
 * as a temporary ally. Each recruitable enemy has a Diplomacy DC,
 * gold cost, and passive bonus they provide while traveling.
 * Animals and boss-tier enemies cannot be recruited.
 */

import type { StatName } from '@/app/oregon-trail/characterContext'

// ============================================================================
// TYPES
// ============================================================================

export interface RecruitableEnemy {
  /** Must match ConfrontationEnemy.name */
  enemyName: string
  /** Can this enemy be recruited at all? */
  canRecruit: boolean
  /** Diplomacy DC to convince them to join */
  recruitDC: number
  /** Gold cost to seal the deal */
  goldCost: number
  /** What stat they primarily boost */
  bonusStat: StatName
  /** Magnitude of the stat bonus */
  bonusAmount: number
  /** Passive effect description shown to player */
  passiveEffect: string
  /** Flavor text when recruited */
  recruitText: string
  /** Flavor text when recruitment fails */
  refuseText: string
  /** Flavor text when you can't afford them */
  cantAffordText: string
  /** How many chapters they stay for (0 = rest of game) */
  duration: number
  /** Icon override (or null to use enemy icon) */
  icon?: string
  /** Special ability that triggers during travel encounters */
  specialAbility?: RecruitSpecialAbility
}

export interface RecruitSpecialAbility {
  name: string
  description: string
  /** Chance (0-1) to trigger per encounter */
  triggerChance: number
  /** What it does */
  effect: 'auto_resolve' | 'damage_boost' | 'flee_guaranteed' | 'gold_bonus' | 'xp_bonus'
  /** Magnitude of the effect */
  magnitude: number
}

export interface RecruitedAlly {
  enemyName: string
  icon: string
  bonusStat: StatName
  bonusAmount: number
  passiveEffect: string
  chaptersRemaining: number
  recruitedAtChapter: number
  specialAbility?: RecruitSpecialAbility
}

// ============================================================================
// RECRUITMENT DATA
// ============================================================================

export const RECRUITABLE_ENEMIES: RecruitableEnemy[] = [
  // Chapter 1
  {
    enemyName: 'Road Agent',
    canRecruit: true,
    recruitDC: 14,
    goldCost: 20,
    bonusStat: 'Agility',
    bonusAmount: 2,
    passiveEffect: 'Knows the back roads. +2 Agility on travel encounters.',
    recruitText: '"Alright, alright. Maybe there\'s more gold working WITH someone than robbing \'em. You got yourself a partner."',
    refuseText: '"Nice words, but I work alone. Now git, before I change my mind about letting you go."',
    cantAffordText: '"Talk is cheap, friend. Come back when you\'ve got coin to back it up."',
    duration: 2,
    specialAbility: {
      name: 'Ambush Knowledge',
      description: 'Warns of ambushes ahead',
      triggerChance: 0.3,
      effect: 'flee_guaranteed',
      magnitude: 1,
    },
  },
  {
    enemyName: 'Feral Dog Pack',
    canRecruit: false,
    recruitDC: 0,
    goldCost: 0,
    bonusStat: 'Agility',
    bonusAmount: 0,
    passiveEffect: '',
    recruitText: '',
    refuseText: 'You can\'t exactly negotiate with feral dogs.',
    cantAffordText: '',
    duration: 0,
  },

  // Chapter 2
  {
    enemyName: 'Claim Jumper',
    canRecruit: true,
    recruitDC: 13,
    goldCost: 35,
    bonusStat: 'Durability',
    bonusAmount: 2,
    passiveEffect: 'Tough as nails. +2 Durability for the party.',
    recruitText: '"You know what? Mining alone ain\'t been working out. Maybe a partner is what I need. Let\'s shake on it."',
    refuseText: '"This claim is mine and mine alone. Don\'t need no partners muddying the waters."',
    cantAffordText: '"A handshake ain\'t enough. I need to see the color of your gold first."',
    duration: 2,
    specialAbility: {
      name: 'Prospector\'s Nose',
      description: 'Finds hidden gold at locations',
      triggerChance: 0.25,
      effect: 'gold_bonus',
      magnitude: 15,
    },
  },
  {
    enemyName: 'Rattlesnake Den',
    canRecruit: false,
    recruitDC: 0,
    goldCost: 0,
    bonusStat: 'Agility',
    bonusAmount: 0,
    passiveEffect: '',
    recruitText: '',
    refuseText: 'Rattlesnakes make poor traveling companions.',
    cantAffordText: '',
    duration: 0,
  },

  // Chapter 3
  {
    enemyName: 'Gang Outriders',
    canRecruit: true,
    recruitDC: 16,
    goldCost: 60,
    bonusStat: 'Agility',
    bonusAmount: 3,
    passiveEffect: 'Mounted escorts. +3 Agility and faster travel.',
    recruitText: '"Boss won\'t like it, but the pay\'s better with you. We ride together now."',
    refuseText: '"We answer to Joaquin. No amount of pretty words changes that."',
    cantAffordText: '"Sixty gold. That\'s what it costs to buy our loyalty. Not a coin less."',
    duration: 2,
    specialAbility: {
      name: 'Outrider Screen',
      description: 'Mounted scouts spot trouble early',
      triggerChance: 0.35,
      effect: 'auto_resolve',
      magnitude: 1,
    },
  },
  {
    enemyName: 'Desperate Prospector',
    canRecruit: true,
    recruitDC: 10,
    goldCost: 15,
    bonusStat: 'Expertise',
    bonusAmount: 2,
    passiveEffect: 'Knows the land. +2 Expertise for survival checks.',
    recruitText: '"You\'d... you\'d take me along? I know every gulch and creek between here and Sacramento. I won\'t be a burden, I swear."',
    refuseText: '"I appreciate the thought, but I\'ve been alone too long. Can\'t trust nobody no more."',
    cantAffordText: '"I\'m desperate, not stupid. At least feed me if you want my help."',
    duration: 3,
    specialAbility: {
      name: 'Trail Wisdom',
      description: 'Earns extra XP from encounters',
      triggerChance: 0.4,
      effect: 'xp_bonus',
      magnitude: 10,
    },
  },

  // Chapter 4
  {
    enemyName: 'Bounty Hunters',
    canRecruit: true,
    recruitDC: 18,
    goldCost: 80,
    bonusStat: 'Shrewdness',
    bonusAmount: 3,
    passiveEffect: 'Professional trackers. +3 Shrewdness for deduction.',
    recruitText: '"We checked. You ain\'t who we\'re looking for. But you seem like someone worth riding with. For the right price."',
    refuseText: '"We\'ve got a job to do. Move along, or we\'ll add you to the list."',
    cantAffordText: '"Eighty gold. Non-negotiable. Our services don\'t come cheap."',
    duration: 1,
    specialAbility: {
      name: 'Bounty Sense',
      description: 'Double damage in confrontations',
      triggerChance: 0.3,
      effect: 'damage_boost',
      magnitude: 2,
    },
  },

  // Chapter 5
  {
    enemyName: 'Joaquin\'s Lieutenant',
    canRecruit: false,
    recruitDC: 0,
    goldCost: 0,
    bonusStat: 'Agility',
    bonusAmount: 0,
    passiveEffect: '',
    recruitText: '',
    refuseText: '"I serve Joaquin. No amount of gold or silver tongues will change that."',
    cantAffordText: '',
    duration: 0,
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get recruitment data for an enemy by name
 */
export function getRecruitmentData(enemyName: string): RecruitableEnemy | null {
  return RECRUITABLE_ENEMIES.find(r => r.enemyName === enemyName) || null
}

/**
 * Check if an enemy can be recruited
 */
export function canRecruitEnemy(enemyName: string): boolean {
  const data = getRecruitmentData(enemyName)
  return data?.canRecruit ?? false
}

/**
 * Attempt recruitment after a successful TALK
 * Returns the result of the recruitment attempt
 */
export function attemptRecruitment(
  enemyName: string,
  enemyIcon: string,
  playerDiplomacy: number,
  playerGold: number,
  currentChapter: number,
  existingAllies: RecruitedAlly[],
): {
  success: boolean
  reason: 'recruited' | 'refused' | 'cant_afford' | 'not_recruitable' | 'party_full'
  ally?: RecruitedAlly
  text: string
  goldCost: number
} {
  const data = getRecruitmentData(enemyName)

  if (!data || !data.canRecruit) {
    return {
      success: false,
      reason: 'not_recruitable',
      text: data?.refuseText || 'This enemy cannot be recruited.',
      goldCost: 0,
    }
  }

  // Max 2 recruited allies at once
  if (existingAllies.length >= 2) {
    return {
      success: false,
      reason: 'party_full',
      text: 'Your party is full. You\'ll need to part ways with an ally before recruiting another.',
      goldCost: 0,
    }
  }

  // Check gold
  if (playerGold < data.goldCost) {
    return {
      success: false,
      reason: 'cant_afford',
      text: data.cantAffordText,
      goldCost: data.goldCost,
    }
  }

  // Diplomacy check: D20 + modifier vs DC
  const roll = Math.floor(Math.random() * 20) + 1
  const modifier = Math.floor((playerDiplomacy - 10) / 2)
  const total = roll + modifier

  if (roll === 20 || total >= data.recruitDC) {
    // Success
    const ally: RecruitedAlly = {
      enemyName: data.enemyName,
      icon: data.icon || enemyIcon,
      bonusStat: data.bonusStat,
      bonusAmount: data.bonusAmount,
      passiveEffect: data.passiveEffect,
      chaptersRemaining: data.duration || 99,
      recruitedAtChapter: currentChapter,
      specialAbility: data.specialAbility,
    }

    return {
      success: true,
      reason: 'recruited',
      ally,
      text: data.recruitText,
      goldCost: data.goldCost,
    }
  }

  // Failed
  return {
    success: false,
    reason: 'refused',
    text: data.refuseText,
    goldCost: 0,
  }
}

/**
 * Check recruited allies for chapter expiration
 */
export function updateAllyDurations(
  allies: RecruitedAlly[],
  currentChapter: number,
): { remaining: RecruitedAlly[]; departed: RecruitedAlly[] } {
  const remaining: RecruitedAlly[] = []
  const departed: RecruitedAlly[] = []

  for (const ally of allies) {
    const chaptersServed = currentChapter - ally.recruitedAtChapter
    if (chaptersServed >= ally.chaptersRemaining && ally.chaptersRemaining < 99) {
      departed.push(ally)
    } else {
      remaining.push(ally)
    }
  }

  return { remaining, departed }
}

/**
 * Check if a recruited ally's special ability triggers
 */
export function rollAllyAbility(ally: RecruitedAlly): {
  triggered: boolean
  effect?: RecruitSpecialAbility['effect']
  magnitude?: number
  description?: string
} {
  if (!ally.specialAbility) return { triggered: false }

  if (Math.random() < ally.specialAbility.triggerChance) {
    return {
      triggered: true,
      effect: ally.specialAbility.effect,
      magnitude: ally.specialAbility.magnitude,
      description: `${ally.enemyName}: ${ally.specialAbility.description}`,
    }
  }

  return { triggered: false }
}

/**
 * Calculate total stat bonuses from all recruited allies
 */
export function getAllyStatBonuses(allies: RecruitedAlly[]): Partial<Record<StatName, number>> {
  const bonuses: Partial<Record<StatName, number>> = {}
  for (const ally of allies) {
    bonuses[ally.bonusStat] = (bonuses[ally.bonusStat] || 0) + ally.bonusAmount
  }
  return bonuses
}
