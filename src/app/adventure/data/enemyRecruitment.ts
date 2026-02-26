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
// RECRUITED ALLY DIALOGUE
// ============================================================================

export interface AllyDialogueLine {
  /** Trigger context for the line */
  trigger: 'travel' | 'camp' | 'combat' | 'discovery' | 'idle'
  /** The dialogue text */
  line: string
}

export interface RecruitedAllyDialogue {
  /** Must match RecruitableEnemy.enemyName */
  enemyName: string
  /** Dialogue lines this ally says after joining your party */
  lines: AllyDialogueLine[]
}

export const RECRUITED_ALLY_DIALOGUE: RecruitedAllyDialogue[] = [
  {
    enemyName: 'Road Agent',
    lines: [
      { trigger: 'travel', line: '"See that bend up ahead? Perfect ambush spot. I know because I\'ve used it three times. We\'ll go around."' },
      { trigger: 'camp', line: '"Don\'t look at me like that. Everyone out here\'s done things they ain\'t proud of. Difference is, I\'m honest about it."' },
      { trigger: 'combat', line: '"You aim for the body, I\'ll flank left. Learned that trick from a Texan ranger — right before I robbed him."' },
      { trigger: 'discovery', line: '"Well I\'ll be damned. Rode past this spot a dozen times and never noticed. Guess it pays to slow down once in a while."' },
      { trigger: 'idle', line: '"You know, the pay\'s worse riding honest, but the sleeping\'s better. Hadn\'t realized how tired I was of watching my back."' },
    ],
  },
  {
    enemyName: 'Claim Jumper',
    lines: [
      { trigger: 'travel', line: '"That creek bed\'s got color in it. I can smell it. ...No, I ain\'t jumping your claim. Those days are behind me."' },
      { trigger: 'camp', line: '"My daddy was a miner in Georgia before the rush. Said gold makes good men bad and bad men worse. Guess he was right about me."' },
      { trigger: 'combat', line: '"I\'ve been in more fistfights over a patch of dirt than I care to count. Stand back — I know how desperate men fight."' },
      { trigger: 'discovery', line: '"See how the quartz runs through that rock face? That\'s a vein. A real one. Not every shiny thing is pyrite, friend."' },
      { trigger: 'idle', line: '"Partner, I want you to know — you\'re the first person who gave me a fair shake since I came west. That means something."' },
    ],
  },
  {
    enemyName: 'Gang Outriders',
    lines: [
      { trigger: 'travel', line: '"Joaquin\'s boys patrol this road on Tuesdays. Today\'s Wednesday, so we\'re clear. Probably."' },
      { trigger: 'camp', line: '"Riding with the gang was simple. Ride, rob, split the take. But simple ain\'t the same as right. Took me too long to figure that."' },
      { trigger: 'combat', line: '"We ride hard and shoot straight. That\'s what Joaquin taught us, and that\'s what we\'ll do for you. Just point the way."' },
      { trigger: 'discovery', line: '"The gang had stashes all through these hills. I could show you a few, if you don\'t ask where the gold came from."' },
      { trigger: 'idle', line: '"The others\'ll call us traitors. But between you and me? Most of \'em were looking for a way out too."' },
    ],
  },
  {
    enemyName: 'Desperate Prospector',
    lines: [
      { trigger: 'travel', line: '"I know every creek between here and Coloma. The one where Marshall found gold? I panned it dry. Got maybe two dollars."' },
      { trigger: 'camp', line: '"Haven\'t sat at a fire with company in... I don\'t rightly know how long. Months? Feels like years."' },
      { trigger: 'combat', line: '"I ain\'t much in a fight, but I know these ravines like the back of my hand. I\'ll find us an escape route."' },
      { trigger: 'discovery', line: '"Would you look at that. I spent six months searching for something like this, and here you stumble on it walking by."' },
      { trigger: 'idle', line: '"You ever wonder if the gold was the worst thing that happened to California? Sometimes I think the land was better off before us."' },
    ],
  },
  {
    enemyName: 'Bounty Hunters',
    lines: [
      { trigger: 'travel', line: '"We\'ve tracked men through worse terrain than this. Stay on our six and keep your powder dry."' },
      { trigger: 'camp', line: '"Don\'t take this the wrong way, but we ran your name through our book when we met. You\'re clean. Had to be sure."' },
      { trigger: 'combat', line: '"Spread formation. You — center. We\'ll take the flanks. This is textbook. We\'ve drilled it a hundred times."' },
      { trigger: 'discovery', line: '"Interesting. Our employer mentioned something like this. Didn\'t think it was real. Adjust the bounty accordingly."' },
      { trigger: 'idle', line: '"In this line of work, you learn to read people fast. You\'re alright. Not many folks we\'d say that about."' },
    ],
  },
]

// ============================================================================
// BETRAYAL CONDITIONS
// ============================================================================

export interface BetrayalCondition {
  /** Must match RecruitableEnemy.enemyName */
  enemyName: string
  /** Original faction alignment — if player reputation with this faction drops below threshold, betrayal triggers */
  originalFaction: 'outlaws' | 'settlers' | 'pinkerton' | 'natives'
  /** Reputation threshold — below this value, the ally may betray you */
  reputationThreshold: number
  /** Chance (0-1) of betrayal when conditions are met, checked each chapter */
  betrayalChance: number
  /** Narrative text when betrayal occurs */
  betrayalText: string
  /** What happens mechanically on betrayal */
  betrayalEffect: {
    goldStolen: number
    healthDamage: number
    itemsLost: boolean
  }
}

export const BETRAYAL_CONDITIONS: BetrayalCondition[] = [
  {
    enemyName: 'Road Agent',
    originalFaction: 'outlaws',
    reputationThreshold: -50,
    betrayalChance: 0.4,
    betrayalText: '"Sorry, partner. Word got back to the boys that you\'ve been hunting our kind. I can\'t ride with someone who wants my people dead. And I ain\'t leaving empty-handed." He disappears into the night — along with your gold pouch.',
    betrayalEffect: {
      goldStolen: 30,
      healthDamage: 0,
      itemsLost: false,
    },
  },
  {
    enemyName: 'Claim Jumper',
    originalFaction: 'settlers',
    reputationThreshold: -50,
    betrayalChance: 0.35,
    betrayalText: '"The miners are talking. They say you\'re no friend to honest working folk. I may be a claim jumper, but I\'m still a miner at heart. Don\'t follow me." He leaves at dawn, taking supplies with him.',
    betrayalEffect: {
      goldStolen: 20,
      healthDamage: 0,
      itemsLost: true,
    },
  },
  {
    enemyName: 'Gang Outriders',
    originalFaction: 'outlaws',
    reputationThreshold: -50,
    betrayalChance: 0.5,
    betrayalText: '"Joaquin sent word. You\'ve made too many enemies among our brothers. We were supposed to bring you back alive, but... accidents happen on the trail." They draw their weapons in the dark.',
    betrayalEffect: {
      goldStolen: 50,
      healthDamage: 25,
      itemsLost: true,
    },
  },
  {
    enemyName: 'Desperate Prospector',
    originalFaction: 'settlers',
    reputationThreshold: -50,
    betrayalChance: 0.25,
    betrayalText: '"I heard what you did to those settlers upriver. I was desperate when I joined you, but I ain\'t that desperate. I\'m leaving before I end up like them." He slips away quietly, taking only what he feels he\'s owed.',
    betrayalEffect: {
      goldStolen: 15,
      healthDamage: 0,
      itemsLost: false,
    },
  },
  {
    enemyName: 'Bounty Hunters',
    originalFaction: 'pinkerton',
    reputationThreshold: -50,
    betrayalChance: 0.6,
    betrayalText: '"New contract just came in. You know how this works — nothing personal, just business. Your bounty\'s worth more than your friendship." They surround you, professional and cold.',
    betrayalEffect: {
      goldStolen: 80,
      healthDamage: 30,
      itemsLost: true,
    },
  },
]

// ============================================================================
// ALLY SPECIAL ABILITIES (ENCOUNTER USE)
// ============================================================================

export interface AllyEncounterAbility {
  /** Must match RecruitableEnemy.enemyName */
  enemyName: string
  /** Unique ability name */
  abilityName: string
  /** Detailed description of what it does */
  abilityDescription: string
  /** Cooldown in chapters before it can be used again */
  cooldownChapters: number
  /** Stat check required to activate (ally rolls, not player) */
  activationStat: StatName
  /** DC for the activation check */
  activationDC: number
  /** Effects when the ability succeeds */
  successEffects: {
    damageToEnemy?: number
    healToParty?: number
    goldGained?: number
    autoResolve?: boolean
    statBuff?: { stat: StatName; amount: number; duration: number }
    narrativeText: string
  }
  /** Effects when the ability fails */
  failureEffects: {
    damageToAlly?: number
    narrativeText: string
  }
}

export const ALLY_ENCOUNTER_ABILITIES: AllyEncounterAbility[] = [
  {
    enemyName: 'Road Agent',
    abilityName: 'Highwayman\'s Gambit',
    abilityDescription: 'The Road Agent uses his knowledge of bandit tactics to bluff and misdirect enemies, creating an opening for escape or ambush.',
    cooldownChapters: 1,
    activationStat: 'Agility',
    activationDC: 12,
    successEffects: {
      autoResolve: true,
      narrativeText: 'Your Road Agent steps forward with a whistle. "Boys, you\'re surrounded. My people are in the trees." The bluff works — the enemies scatter before realizing there\'s nobody else.',
    },
    failureEffects: {
      damageToAlly: 10,
      narrativeText: 'The bluff falls flat. "Nice try," the enemy leader sneers, and your Road Agent takes a hit diving back to cover.',
    },
  },
  {
    enemyName: 'Claim Jumper',
    abilityName: 'Miner\'s Demolition',
    abilityDescription: 'The Claim Jumper rigs a makeshift black powder charge from mining supplies — a dangerous but devastating tactic he learned in the diggings.',
    cooldownChapters: 2,
    activationStat: 'Expertise',
    activationDC: 14,
    successEffects: {
      damageToEnemy: 40,
      narrativeText: 'The Claim Jumper lights a fuse tucked into a rock crevice. BOOM. Gravel and dust rain down. When the smoke clears, the opposition has lost its nerve entirely.',
    },
    failureEffects: {
      damageToAlly: 15,
      narrativeText: 'The fuse burns too fast. The blast goes off early and the Claim Jumper catches shrapnel. "Damn black powder," he mutters, bleeding but alive.',
    },
  },
  {
    enemyName: 'Gang Outriders',
    abilityName: 'Cavalry Charge',
    abilityDescription: 'The Outriders mount up and execute a coordinated flanking charge — the same tactic that made Joaquin\'s gang the terror of the Mother Lode.',
    cooldownChapters: 2,
    activationStat: 'Agility',
    activationDC: 13,
    successEffects: {
      damageToEnemy: 35,
      statBuff: { stat: 'Agility', amount: 3, duration: 1 },
      narrativeText: 'Thunder of hooves from both flanks. The Outriders charge in perfect formation, scattering the enemy like quail. For a moment you understand why Joaquin was so feared.',
    },
    failureEffects: {
      damageToAlly: 10,
      narrativeText: 'The horses balk at the rough terrain. The charge falters and one outrider takes a hit pulling back. "Terrain\'s no good for mounted work," he curses.',
    },
  },
  {
    enemyName: 'Desperate Prospector',
    abilityName: 'Pathfinder\'s Escape',
    abilityDescription: 'The Prospector knows every gulch, mineshaft, and hidden ravine in the territory. He leads the party through a concealed escape route no one else would find.',
    cooldownChapters: 1,
    activationStat: 'Expertise',
    activationDC: 10,
    successEffects: {
      healToParty: 15,
      autoResolve: true,
      narrativeText: '"This way — through the old shaft. I dug it myself in \'51." The Prospector leads you through a forgotten mine tunnel that exits half a mile away. The enemy never finds the entrance.',
    },
    failureEffects: {
      damageToAlly: 5,
      narrativeText: 'The old mine entrance has collapsed since he was last here. "It was open last spring, I swear." You\'ll have to find another way.',
    },
  },
  {
    enemyName: 'Bounty Hunters',
    abilityName: 'Dead or Alive',
    abilityDescription: 'The Bounty Hunters use their professional tracking and combat skills to systematically dismantle the opposition — controlled, methodical, lethal.',
    cooldownChapters: 2,
    activationStat: 'Shrewdness',
    activationDC: 14,
    successEffects: {
      damageToEnemy: 50,
      goldGained: 20,
      narrativeText: 'The lead hunter signals silently. In thirty seconds it\'s over — suppressive fire, flanking move, surrender demand. Professional and clean. "That one had a bounty," she notes, pocketing a wanted poster.',
    },
    failureEffects: {
      damageToAlly: 15,
      narrativeText: 'The enemy was better prepared than expected. The hunters regroup but take casualties. "We underestimated them. Won\'t happen again."',
    },
  },
]

// ============================================================================
// BETRAYAL & DIALOGUE HELPERS
// ============================================================================

/**
 * Get dialogue lines for a recruited ally
 */
export function getAllyDialogue(enemyName: string): AllyDialogueLine[] {
  const entry = RECRUITED_ALLY_DIALOGUE.find(d => d.enemyName === enemyName)
  return entry?.lines ?? []
}

/**
 * Get a random dialogue line for a specific trigger context
 */
export function getRandomAllyLine(enemyName: string, trigger: AllyDialogueLine['trigger']): string | null {
  const lines = getAllyDialogue(enemyName).filter(l => l.trigger === trigger)
  if (lines.length === 0) return null
  return lines[Math.floor(Math.random() * lines.length)].line
}

/**
 * Check if a recruited ally might betray the player based on faction reputation
 */
export function checkBetrayalRisk(
  enemyName: string,
  factionReputations: Record<string, number>,
): { atRisk: boolean; condition?: BetrayalCondition } {
  const condition = BETRAYAL_CONDITIONS.find(b => b.enemyName === enemyName)
  if (!condition) return { atRisk: false }

  const currentRep = factionReputations[condition.originalFaction] ?? 0
  if (currentRep < condition.reputationThreshold) {
    return { atRisk: true, condition }
  }
  return { atRisk: false }
}

/**
 * Roll for betrayal — call this once per chapter for each at-risk ally
 */
export function rollBetrayal(condition: BetrayalCondition): {
  betrayed: boolean
  text: string
  effect: BetrayalCondition['betrayalEffect']
} {
  if (Math.random() < condition.betrayalChance) {
    return {
      betrayed: true,
      text: condition.betrayalText,
      effect: condition.betrayalEffect,
    }
  }
  return {
    betrayed: false,
    text: '',
    effect: { goldStolen: 0, healthDamage: 0, itemsLost: false },
  }
}

/**
 * Get the encounter ability for a recruited ally
 */
export function getAllyEncounterAbility(enemyName: string): AllyEncounterAbility | null {
  return ALLY_ENCOUNTER_ABILITIES.find(a => a.enemyName === enemyName) ?? null
}

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
