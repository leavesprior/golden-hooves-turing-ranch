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
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Spin a yarn, Twain-style. Tall tales and true ones lift spirits and sometimes reveal useful lore about the territory ahead.',
    icon: '\uD83D\uDCD6',
    daysCost: 1,
    stat: 'Diplomacy',
    difficulty: 8,
    successResult: {
      text: 'Your tale of a jumping frog contest in Calaveras County has everyone howling. Morale soars, and an old-timer shares a tip about a hidden trail.',
      xpGain: 20,
      healthChange: 10,
      reputationChange: { faction: 'settlers', amount: 3 },
      revealLocations: 1,
    },
    failureResult: {
      text: 'The story falls flat — maybe the punchline needed work. Still, the campfire warmth helps.',
      xpGain: 10,
      healthChange: 5,
    },
  },
  {
    id: 'arrow_knapping',
    name: 'Arrow Knapping',
    description: 'Learn the Miwok technique of pressure-flaking obsidian into razor-sharp arrowheads. Requires patience and a steady hand.',
    icon: '\uD83C\uDFF9',
    daysCost: 2,
    stat: 'Expertise',
    difficulty: 12,
    successResult: {
      text: 'Under careful instruction, you shape volcanic glass into deadly points. The obsidian arrows gleam like black mirrors.',
      xpGain: 30,
      itemFound: 'obsidian_arrows',
      reputationChange: { faction: 'natives', amount: 5 },
    },
    failureResult: {
      text: 'The obsidian shatters. Knapping is harder than it looks — the Miwok make it seem effortless.',
      xpGain: 15,
      healthChange: -5,
      reputationChange: { faction: 'natives', amount: 2 },
    },
    requiresMinStat: { stat: 'Expertise', value: 8 },
  },
  {
    id: 'star_navigation',
    name: 'Star Navigation',
    description: 'Study the Gold Country night sky. Polaris, the Dippers, and the seasonal constellations reveal shortcuts and warn of weather changes.',
    icon: '\u2B50',
    daysCost: 1,
    stat: 'Shrewdness',
    difficulty: 10,
    successResult: {
      text: 'The stars map out a faster route through the foothills. You also spot a weather front rolling in from the Pacific — time to prepare.',
      xpGain: 20,
      revealLocations: 2,
    },
    failureResult: {
      text: 'Overcast skies obscure the stars tonight. You pick out Polaris before the clouds roll in, but little else.',
      xpGain: 10,
      revealLocations: 1,
    },
  },
  {
    id: 'herbal_medicine',
    name: 'Herbal Medicine',
    description: 'Gather yerba buena, manzanita bark, and mugwort — native plants the Miwok have used for generations. Heal without spending supplies.',
    icon: '\uD83C\uDF3B',
    daysCost: 2,
    stat: 'Expertise',
    difficulty: 11,
    successResult: {
      text: 'A poultice of yerba buena and crushed manzanita draws the fever out. The old remedies work better than any patent medicine.',
      healthChange: 30,
      xpGain: 25,
      reputationChange: { faction: 'natives', amount: 3 },
    },
    failureResult: {
      text: 'You gather the wrong variety of mugwort. No harm done, but no healing either. The plants all look alike to untrained eyes.',
      xpGain: 10,
      healthChange: 5,
    },
  },
  {
    id: 'journal_writing',
    name: 'Journal Writing',
    description: 'Record the day\'s events in your trail journal. Reflection sharpens the mind and preserves hard-won lessons.',
    icon: '\u270D\uFE0F',
    daysCost: 1,
    stat: 'Shrewdness',
    difficulty: 6,
    successResult: {
      text: 'You write with clarity tonight. Re-reading your earlier entries, patterns emerge — connections you missed in the moment.',
      xpGain: 25,
      statChange: { stat: 'Shrewdness', amount: 1 },
    },
    failureResult: {
      text: 'The words come slowly. Exhaustion blurs your thoughts. Still, even a few lines preserve the memory.',
      xpGain: 15,
    },
  },
  {
    id: 'gold_panning',
    name: 'Gold Panning',
    description: 'Work the nearest creek with a flat-bottomed pan. Swirl, tilt, and pray for color. Every gulch in the Sierra holds promise.',
    icon: '\u2728',
    daysCost: 2,
    stat: 'Luck',
    difficulty: 12,
    successResult: {
      text: 'Color! Fine flakes of gold settle in the pan\'s riffles. Not a motherlode, but enough to jingle in your pouch.',
      xpGain: 20,
      karmaGain: 15,
    },
    failureResult: {
      text: 'Nothing but black sand and pyrite. Fool\'s gold mocks you from the pan. The real stuff is always somewhere else.',
      xpGain: 10,
      karmaGain: 3,
    },
  },
  {
    id: 'horse_care',
    name: 'Horse Care',
    description: 'Tend to your horses — check hooves, brush coats, treat saddle sores. A well-kept mount is the difference between life and death on the trail.',
    icon: '\uD83D\uDC34',
    daysCost: 1,
    stat: 'Expertise',
    difficulty: 8,
    successResult: {
      text: 'You pick a stone from the mare\'s hoof and salve a raw spot under the saddle. She nickers gratefully. Tomorrow\'s ride will be faster.',
      xpGain: 15,
      statChange: { stat: 'Agility', amount: 1 },
    },
    failureResult: {
      text: 'The stallion won\'t let you near his back hooves. You manage a brush-down, but the deeper care will have to wait.',
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
