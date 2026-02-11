import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'

// Camp management between chapters — MOO2 between-turns style
// Player gets 7 days to spend on activities before the next chapter

export const CAMP_DAYS = 7

export interface CampActivity {
  id: string
  name: string
  description: string
  icon: string
  daysCost: number
  stat: StatName
  difficulty: number
  successResult: ActivityResult
  failureResult: ActivityResult
  requiresMinStat?: { stat: StatName; value: number }
}

export interface ActivityResult {
  text: string
  healthChange?: number
  xpGain?: number
  karmaGain?: number
  reputationChange?: { faction: FactionId; amount: number }
  statChange?: { stat: StatName; amount: number }
  revealLocations?: number // Number of next-chapter locations to reveal
  itemFound?: string
}

export const CAMP_ACTIVITIES: CampActivity[] = [
  {
    id: 'rest',
    name: 'Rest',
    description: 'Recover your strength. Sleep under the stars.',
    icon: '\uD83D\uDECC',
    daysCost: 1,
    stat: 'Durability',
    difficulty: 6, // Easy
    successResult: {
      text: 'You sleep soundly. The trail\'s aches fade away.',
      healthChange: 20,
      xpGain: 5,
    },
    failureResult: {
      text: 'Restless night. Bad dreams about the trail.',
      healthChange: 10,
    },
  },
  {
    id: 'train',
    name: 'Train',
    description: 'Practice your skills. Sharpshoot, track, or study.',
    icon: '\uD83C\uDFAF',
    daysCost: 2,
    stat: 'Expertise',
    difficulty: 10,
    successResult: {
      text: 'Focused training pays off. You feel sharper.',
      xpGain: 40,
    },
    failureResult: {
      text: 'The training is harder than expected, but you learn from the struggle.',
      xpGain: 20,
    },
  },
  {
    id: 'socialize',
    name: 'Socialize',
    description: 'Share stories around the campfire. Build relationships.',
    icon: '\uD83E\uDD1D',
    daysCost: 1,
    stat: 'Diplomacy',
    difficulty: 8,
    successResult: {
      text: 'Good conversation flows freely. You\'ve made friends.',
      xpGain: 15,
      reputationChange: { faction: 'settlers', amount: 5 },
    },
    failureResult: {
      text: 'Awkward silence. Maybe you said the wrong thing.',
      xpGain: 5,
      reputationChange: { faction: 'settlers', amount: 1 },
    },
  },
  {
    id: 'investigate',
    name: 'Investigate',
    description: 'Review your clues. Connect the dots. Advance the case.',
    icon: '\uD83D\uDD0D',
    daysCost: 2,
    stat: 'Shrewdness',
    difficulty: 12,
    successResult: {
      text: 'A breakthrough! The clues are starting to form a picture.',
      xpGain: 30,
    },
    failureResult: {
      text: 'The clues don\'t add up. Yet. You\'re missing something.',
      xpGain: 10,
    },
    requiresMinStat: { stat: 'Shrewdness', value: 8 },
  },
  {
    id: 'trade',
    name: 'Trade',
    description: 'Buy, sell, and barter at camp prices.',
    icon: '\uD83D\uDCB0',
    daysCost: 1,
    stat: 'Diplomacy',
    difficulty: 8,
    successResult: {
      text: 'Shrewd dealing. You got a good price.',
      karmaGain: 5,
      xpGain: 10,
    },
    failureResult: {
      text: 'Paid a bit more than you should have. Live and learn.',
      karmaGain: 2,
      xpGain: 5,
    },
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Explore ahead. Reveal fog of war for the next chapter.',
    icon: '\uD83D\uDD2D',
    daysCost: 2,
    stat: 'Expertise',
    difficulty: 10,
    successResult: {
      text: 'You\'ve mapped the territory ahead. New locations revealed.',
      xpGain: 25,
      revealLocations: 2,
    },
    failureResult: {
      text: 'Rough terrain made scouting difficult. You found one path forward.',
      xpGain: 10,
      revealLocations: 1,
    },
  },
  {
    id: 'forage',
    name: 'Forage',
    description: 'Gather herbs, food, and useful materials from the wild.',
    icon: '\uD83C\uDF3F',
    daysCost: 1,
    stat: 'Luck',
    difficulty: 10,
    successResult: {
      text: 'The land provides. You find something valuable.',
      xpGain: 15,
      healthChange: 5,
      itemFound: 'random_forage_item',
    },
    failureResult: {
      text: 'Slim pickings today. At least the fresh air was nice.',
      xpGain: 5,
    },
  },
]

export function getActivity(id: string): CampActivity | undefined {
  return CAMP_ACTIVITIES.find(a => a.id === id)
}

export function canPerformActivity(
  activity: CampActivity,
  daysRemaining: number,
  stats: Record<StatName, number>,
): { canDo: boolean; reason?: string } {
  if (daysRemaining < activity.daysCost) {
    return { canDo: false, reason: `Requires ${activity.daysCost} days (${daysRemaining} remaining)` }
  }
  if (activity.requiresMinStat) {
    const { stat, value } = activity.requiresMinStat
    if ((stats[stat] ?? 0) < value) {
      return { canDo: false, reason: `Requires ${stat} ${value}+` }
    }
  }
  return { canDo: true }
}
