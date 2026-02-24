// Confrontation enemies for the Gold Country Adventure.
// Enemies scale by chapter. Each has SADDLE stats for combat calculations.
import type { Combatant } from '@/components/adventure/ConfrontationView'

export interface ConfrontationEnemy extends Combatant {
  chapter: number      // minimum chapter to encounter
  dangerLevel: number  // 1-5, higher = tougher
  encounterChance: number // 0-1, base probability when traveling
  description: string
  defeatText: string
  fleeText: string
}

export const CONFRONTATION_ENEMIES: ConfrontationEnemy[] = [
  // Chapter 1 — Trail Dangers
  {
    name: 'Road Agent',
    icon: '\uD83E\uDD20',
    health: 30,
    maxHealth: 30,
    stats: { Agility: 10, Durability: 8, Diplomacy: 6, Shrewdness: 7 },
    loot: { gold: 15, xp: 25 },
    chapter: 1,
    dangerLevel: 1,
    encounterChance: 0.12,
    description: 'A masked bandit steps from behind a boulder, pistol drawn.',
    defeatText: 'The road agent ties your hands and helps himself to your coin purse.',
    fleeText: 'You scramble through the brush, thorns catching at your clothes.',
  },
  {
    name: 'Feral Dog Pack',
    icon: '\uD83D\uDC3A',
    health: 20,
    maxHealth: 20,
    stats: { Agility: 13, Durability: 6, Diplomacy: 2, Shrewdness: 5 },
    loot: { xp: 15 },
    chapter: 1,
    dangerLevel: 1,
    encounterChance: 0.1,
    description: 'Snarling shapes emerge from the scrub. A pack of feral dogs circles you.',
    defeatText: 'The dogs overwhelm you. You limp away bruised and bitten.',
    fleeText: 'You back away slowly, arms raised, until the pack loses interest.',
  },

  // Chapter 2 — Mining Country
  {
    name: 'Claim Jumper',
    icon: '\u26CF\uFE0F',
    health: 40,
    maxHealth: 40,
    stats: { Agility: 9, Durability: 12, Diplomacy: 5, Shrewdness: 8 },
    loot: { gold: 30, xp: 40 },
    chapter: 2,
    dangerLevel: 2,
    encounterChance: 0.1,
    description: 'A burly miner with a pickaxe blocks your path. "This here claim is MINE now."',
    defeatText: 'The claim jumper shoves you to the ground. "Best stay down, tenderfoot."',
    fleeText: 'You retreat, the miner\'s laughter echoing off the canyon walls.',
  },
  {
    name: 'Rattlesnake Den',
    icon: '\uD83D\uDC0D',
    health: 15,
    maxHealth: 15,
    stats: { Agility: 14, Durability: 4, Diplomacy: 1, Shrewdness: 3 },
    loot: { xp: 20 },
    chapter: 2,
    dangerLevel: 1,
    encounterChance: 0.08,
    description: 'The dry rattle sends ice through your veins. You\'ve stumbled into a nest.',
    defeatText: 'A fang catches your ankle. The venom burns like liquid fire.',
    fleeText: 'You freeze, then slowly back away. The rattling fades behind you.',
  },

  // Chapter 3 — Lawless Country
  {
    name: 'Gang Outriders',
    icon: '\uD83D\uDC34',
    health: 55,
    maxHealth: 55,
    stats: { Agility: 12, Durability: 11, Diplomacy: 7, Shrewdness: 9 },
    loot: { gold: 50, xp: 60 },
    chapter: 3,
    dangerLevel: 3,
    encounterChance: 0.1,
    description: 'Two riders wheel their horses to block the trail. "Toll road, friend."',
    defeatText: 'Outnumbered and outgunned, you hand over your valuables.',
    fleeText: 'You spur your horse off the trail and lose them in the trees.',
  },
  {
    name: 'Desperate Prospector',
    icon: '\uD83E\uDDD4',
    health: 35,
    maxHealth: 35,
    stats: { Agility: 8, Durability: 10, Diplomacy: 9, Shrewdness: 6 },
    loot: { gold: 20, xp: 35 },
    chapter: 3,
    dangerLevel: 2,
    encounterChance: 0.08,
    description: 'A gaunt man with wild eyes blocks the path. "I need your supplies. Don\'t make this harder."',
    defeatText: 'Desperation gives him strength you didn\'t expect.',
    fleeText: 'You toss a few coins behind you as you run. It\'s enough to distract him.',
  },

  // Chapter 4 — The Deep Country
  {
    name: 'Bounty Hunters',
    icon: '\uD83D\uDD2B',
    health: 65,
    maxHealth: 65,
    stats: { Agility: 13, Durability: 12, Diplomacy: 8, Shrewdness: 11 },
    loot: { gold: 60, xp: 75 },
    chapter: 4,
    dangerLevel: 4,
    encounterChance: 0.08,
    description: '"You match a description." Three armed men fan out across the road.',
    defeatText: 'They leave you hog-tied by the road. It takes hours to work free.',
    fleeText: 'A desperate sprint through a ravine. They won\'t follow into that terrain.',
  },

  // Chapter 5 — Final Stretch
  {
    name: 'Joaquin\'s Lieutenant',
    icon: '\u2694\uFE0F',
    health: 80,
    maxHealth: 80,
    stats: { Agility: 14, Durability: 13, Diplomacy: 10, Shrewdness: 12 },
    loot: { gold: 80, xp: 100 },
    chapter: 5,
    dangerLevel: 5,
    encounterChance: 0.06,
    description: 'A scarred man in a cavalry coat blocks the pass. "Joaquin sends his regards."',
    defeatText: 'The lieutenant disarms you with practiced ease. "Run along, little bird."',
    fleeText: 'You barely escape, his laughter ringing through the canyon.',
  },
]

/**
 * Roll for a confrontation encounter based on chapter.
 * Returns an enemy or null if no encounter.
 * Respects the Ghost Walker skill (agility_2 bypass).
 */
export function rollConfrontation(
  chapter: number,
  unlockedSkillNodes: string[],
): ConfrontationEnemy | null {
  // Ghost Walker perk: 70% chance to bypass confrontations entirely
  if (unlockedSkillNodes.includes('agility_2') && Math.random() < 0.7) {
    return null
  }

  const eligible = CONFRONTATION_ENEMIES.filter(e => e.chapter <= chapter)
  for (const enemy of eligible) {
    if (Math.random() < enemy.encounterChance) {
      return enemy
    }
  }
  return null
}
