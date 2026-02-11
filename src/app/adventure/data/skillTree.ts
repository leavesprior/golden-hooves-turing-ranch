import type { StatName } from '@/app/oregon-trail/characterContext'

// MOO2-inspired forced-choice skill tree
// 6 branches (one per S.A.D.D.L.E. stat), 3 tiers each
// Must sacrifice one branch to master another — can't max everything

export interface SkillNode {
  id: string
  name: string
  description: string
  tier: 1 | 2 | 3
  stat: StatName
  statBonus: number
  specialEffect?: string
  prerequisiteId?: string // Must have this node to unlock
  levelRequired: number
}

export interface SkillBranch {
  stat: StatName
  name: string
  description: string
  icon: string
  nodes: SkillNode[]
}

export const SKILL_BRANCHES: SkillBranch[] = [
  {
    stat: 'Shrewdness',
    name: 'Investigator',
    description: 'The mind is the sharpest weapon on the frontier.',
    icon: '\uD83D\uDD0D', // magnifying glass
    nodes: [
      {
        id: 'shrewdness_1',
        name: 'Keen Observer',
        description: 'You notice things others overlook. +1 Shrewdness, bonus clue details.',
        tier: 1,
        stat: 'Shrewdness',
        statBonus: 1,
        specialEffect: 'Crime scene clues show extra detail',
        levelRequired: 2,
      },
      {
        id: 'shrewdness_2',
        name: 'Deductive Mind',
        description: 'Connect the dots faster. +2 Shrewdness, reveal witness reliability.',
        tier: 2,
        stat: 'Shrewdness',
        statBonus: 2,
        specialEffect: 'Witness reliability shown during dialogue',
        prerequisiteId: 'shrewdness_1',
        levelRequired: 4,
      },
      {
        id: 'shrewdness_3',
        name: 'Master Detective',
        description: 'The truth cannot hide from you. +3 Shrewdness, warrants auto-succeed.',
        tier: 3,
        stat: 'Shrewdness',
        statBonus: 3,
        specialEffect: 'Warrants issued always match the correct suspect',
        prerequisiteId: 'shrewdness_2',
        levelRequired: 7,
      },
    ],
  },
  {
    stat: 'Agility',
    name: 'Outrider',
    description: 'Speed saves more lives than bravery.',
    icon: '\uD83C\uDFC7', // horse racing
    nodes: [
      {
        id: 'agility_1',
        name: 'Sure-Footed',
        description: 'River crossings and mountain passes hold no fear. +1 Agility.',
        tier: 1,
        stat: 'Agility',
        statBonus: 1,
        specialEffect: 'Travel encounters less likely to cause injury',
        levelRequired: 2,
      },
      {
        id: 'agility_2',
        name: 'Ghost Walker',
        description: 'Move unseen through hostile territory. +2 Agility.',
        tier: 2,
        stat: 'Agility',
        statBonus: 2,
        specialEffect: 'Can bypass confrontation encounters',
        prerequisiteId: 'agility_1',
        levelRequired: 4,
      },
      {
        id: 'agility_3',
        name: 'Lightning Reflexes',
        description: 'Nothing touches you unless you allow it. +3 Agility.',
        tier: 3,
        stat: 'Agility',
        statBonus: 3,
        specialEffect: 'Automatic escape from ambushes',
        prerequisiteId: 'agility_2',
        levelRequired: 7,
      },
    ],
  },
  {
    stat: 'Durability',
    name: 'Survivor',
    description: 'The trail breaks the weak. You are not weak.',
    icon: '\uD83D\uDEE1\uFE0F', // shield
    nodes: [
      {
        id: 'durability_1',
        name: 'Trail Tough',
        description: 'Resist disease and exhaustion. +1 Durability.',
        tier: 1,
        stat: 'Durability',
        statBonus: 1,
        specialEffect: 'Rest action in camp restores extra health',
        levelRequired: 2,
      },
      {
        id: 'durability_2',
        name: 'Iron Will',
        description: 'Push through when others collapse. +2 Durability.',
        tier: 2,
        stat: 'Durability',
        statBonus: 2,
        specialEffect: 'Can take extra camp actions without rest penalty',
        prerequisiteId: 'durability_1',
        levelRequired: 4,
      },
      {
        id: 'durability_3',
        name: 'Unkillable',
        description: 'You\'ve survived things that should have ended you. +3 Durability.',
        tier: 3,
        stat: 'Durability',
        statBonus: 3,
        specialEffect: 'Death events become near-death instead',
        prerequisiteId: 'durability_2',
        levelRequired: 7,
      },
    ],
  },
  {
    stat: 'Diplomacy',
    name: 'Negotiator',
    description: 'Words are cheaper than bullets and twice as effective.',
    icon: '\uD83E\uDD1D', // handshake
    nodes: [
      {
        id: 'diplomacy_1',
        name: 'Smooth Talker',
        description: 'People lower their guard around you. +1 Diplomacy.',
        tier: 1,
        stat: 'Diplomacy',
        statBonus: 1,
        specialEffect: 'NPC trust builds 25% faster',
        levelRequired: 2,
      },
      {
        id: 'diplomacy_2',
        name: 'Faction Broker',
        description: 'You play all sides and prosper. +2 Diplomacy.',
        tier: 2,
        stat: 'Diplomacy',
        statBonus: 2,
        specialEffect: 'Reputation gains doubled with all factions',
        prerequisiteId: 'diplomacy_1',
        levelRequired: 4,
      },
      {
        id: 'diplomacy_3',
        name: 'Silver-Tongued Devil',
        description: 'Kings negotiate; legends dictate terms. +3 Diplomacy.',
        tier: 3,
        stat: 'Diplomacy',
        statBonus: 3,
        specialEffect: 'Can attempt persuasion in place of any other check',
        prerequisiteId: 'diplomacy_2',
        levelRequired: 7,
      },
    ],
  },
  {
    stat: 'Luck',
    name: 'Fortune\'s Child',
    description: 'The universe bends toward you. Don\'t ask why.',
    icon: '\uD83C\uDF40', // four-leaf clover
    nodes: [
      {
        id: 'luck_1',
        name: 'Fortunate',
        description: 'Good things just happen to you. +1 Luck.',
        tier: 1,
        stat: 'Luck',
        statBonus: 1,
        specialEffect: 'Random events skew positive',
        levelRequired: 2,
      },
      {
        id: 'luck_2',
        name: 'Charmed Life',
        description: 'Bullets miss. Bridges hold. Cards fall your way. +2 Luck.',
        tier: 2,
        stat: 'Luck',
        statBonus: 2,
        specialEffect: 'One free reroll per chapter on failed checks',
        prerequisiteId: 'luck_1',
        levelRequired: 4,
      },
      {
        id: 'luck_3',
        name: 'Chosen One',
        description: 'Fate itself conspires in your favor. +3 Luck.',
        tier: 3,
        stat: 'Luck',
        statBonus: 3,
        specialEffect: 'Critical success threshold lowered by 2',
        prerequisiteId: 'luck_2',
        levelRequired: 7,
      },
    ],
  },
  {
    stat: 'Expertise',
    name: 'Frontiersman',
    description: 'The land provides for those who know how to ask.',
    icon: '\uD83C\uDF32', // evergreen tree
    nodes: [
      {
        id: 'expertise_1',
        name: 'Trailblazer',
        description: 'You read the land like a book. +1 Expertise.',
        tier: 1,
        stat: 'Expertise',
        statBonus: 1,
        specialEffect: 'Scout action reveals 2 locations instead of 1',
        levelRequired: 2,
      },
      {
        id: 'expertise_2',
        name: 'Master Tracker',
        description: 'Nothing moves through your territory unnoticed. +2 Expertise.',
        tier: 2,
        stat: 'Expertise',
        statBonus: 2,
        specialEffect: 'Track outlaw movements between locations',
        prerequisiteId: 'expertise_1',
        levelRequired: 4,
      },
      {
        id: 'expertise_3',
        name: 'Legend of the Trail',
        description: 'They\'ll write songs about you. If you survive. +3 Expertise.',
        tier: 3,
        stat: 'Expertise',
        statBonus: 3,
        specialEffect: 'Forage action always finds rare items',
        prerequisiteId: 'expertise_2',
        levelRequired: 7,
      },
    ],
  },
]

export const ALL_SKILL_NODES = SKILL_BRANCHES.flatMap(b => b.nodes)

export function getSkillNode(id: string): SkillNode | undefined {
  return ALL_SKILL_NODES.find(n => n.id === id)
}

export function getBranch(stat: StatName): SkillBranch | undefined {
  return SKILL_BRANCHES.find(b => b.stat === stat)
}

export function canUnlockNode(
  nodeId: string,
  unlockedIds: string[],
  playerLevel: number,
): { canUnlock: boolean; reason?: string } {
  const node = getSkillNode(nodeId)
  if (!node) return { canUnlock: false, reason: 'Node not found' }
  if (unlockedIds.includes(nodeId)) return { canUnlock: false, reason: 'Already unlocked' }
  if (playerLevel < node.levelRequired) {
    return { canUnlock: false, reason: `Requires level ${node.levelRequired}` }
  }
  if (node.prerequisiteId && !unlockedIds.includes(node.prerequisiteId)) {
    const prereq = getSkillNode(node.prerequisiteId)
    return { canUnlock: false, reason: `Requires: ${prereq?.name ?? node.prerequisiteId}` }
  }
  return { canUnlock: true }
}

// Calculate total stat bonuses from unlocked skill nodes
export function getSkillTreeBonuses(unlockedIds: string[]): Partial<Record<StatName, number>> {
  const bonuses: Partial<Record<StatName, number>> = {}
  for (const id of unlockedIds) {
    const node = getSkillNode(id)
    if (!node) continue
    bonuses[node.stat] = (bonuses[node.stat] ?? 0) + node.statBonus
  }
  return bonuses
}
