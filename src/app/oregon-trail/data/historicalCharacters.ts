/**
 * Historical Characters - Real people who lived and worked along the California Trail
 *
 * Each character appears at specific trail locations and provides
 * historical dialogue, quests, and discoverable traits.
 */

export interface HistoricalDialogue {
  greeting: string
  fact: string
  farewell: string
}

export interface HistoricalCharacterEvent {
  id: string
  characterName: string
  title: string
  locationIds: string[]  // Which landmarks this character can appear at
  period: string         // Historical life dates
  portrait: string       // Emoji representation
  description: string    // Brief character intro
  historicalBio: string  // Full historical background
  dialogue: HistoricalDialogue
  choices: HistoricalCharacterChoice[]
  alwaysTriggers?: boolean  // If true, triggers on first visit (e.g., Donner memorial)
  probability: number    // Chance of appearing (0.0-1.0) if not always
}

export interface HistoricalCharacterChoice {
  id: string
  text: string
  outcome: {
    message: string
    moraleDelta?: number
    healthDelta?: number
    foodDelta?: number
    goodKarmaDelta?: number
    neutralKarmaDelta?: number
    traitReward?: string
  }
}

export const HISTORICAL_CHARACTERS: HistoricalCharacterEvent[] = [
  {
    id: 'jim_beckwourth',
    characterName: 'Jim Beckwourth',
    title: 'The Mountain Man',
    locationIds: ['Truckee Pass', 'Sacramento Valley'],
    period: '1798-1866',
    portrait: '🏔️',
    description: 'A towering figure in buckskins approaches your wagon. His weathered face tells of decades in the wilderness. He is Jim Beckwourth — fur trapper, mountain man, and discoverer of Beckwourth Pass.',
    historicalBio: 'James Pierson Beckwourth was born enslaved in Virginia, became one of the greatest mountain men of the American West. He lived with the Crow Nation for years, becoming a war chief. He discovered Beckwourth Pass through the Sierra Nevada in 1850, opening a route used by thousands of emigrants.',
    dialogue: {
      greeting: "Name's Beckwourth. I've walked every trail from the Missouri to the Pacific. I found a pass through these mountains — lower and easier than Donner. You look like folks who could use some advice.",
      fact: "I lived with the Crow people for six years. They taught me things about these mountains no white man ever knew. The pass I found sits at 5,221 feet — lowest crossing of the Sierra Nevada. Could've saved those Donner folks a world of grief.",
      farewell: "Travel smart, travel light, and trust the land more than the maps. The mountains don't care about your plans — they've got their own.",
    },
    choices: [
      {
        id: 'ask_route',
        text: 'Ask about the best route through the mountains',
        outcome: {
          message: 'Beckwourth sketches a rough map in the dirt, showing his pass to the north. "It\'ll add two days, but you won\'t be fighting snow at 7,000 feet." His knowledge of the terrain is extraordinary.',
          moraleDelta: 10,
          goodKarmaDelta: 5,
          traitReward: 'beckwourth_wisdom',
        },
      },
      {
        id: 'trade',
        text: 'Trade supplies for mountain knowledge',
        outcome: {
          message: 'You share some coffee and hardtack. In return, Beckwourth shows you which plants are edible, where to find clean water, and how to read the weather signs. Invaluable frontier wisdom.',
          foodDelta: -10,
          moraleDelta: 8,
          healthDelta: 5,
        },
      },
      {
        id: 'listen',
        text: 'Ask about his life with the Crow Nation',
        outcome: {
          message: '"The Crow named me Morning Star," he says with a distant look. "I was a war chief. Fought battles, saved lives. Some say I exaggerate. But the mountains know the truth." His stories are riveting.',
          moraleDelta: 5,
          goodKarmaDelta: 3,
        },
      },
    ],
    probability: 0.35,
  },
  {
    id: 'snowshoe_thompson',
    characterName: 'Snowshoe Thompson',
    title: 'The Sierra Mailman',
    locationIds: ['Truckee Pass'],
    period: '1827-1876',
    portrait: '⛷️',
    description: 'A broad-shouldered Norwegian man glides past on enormous wooden skis, a heavy mailbag strapped to his back. He moves through the snow with impossible grace. This is John "Snowshoe" Thompson, who carries the mail 90 miles across the Sierra Nevada — in winter.',
    historicalBio: 'John Albert "Snowshoe" Thompson was a Norwegian immigrant who carried mail across the Sierra Nevada on skis for 20 years (1856-1876). He traveled 90 miles in 3 days, through blizzards and avalanche terrain, and never lost a single letter. He also rescued several stranded travelers.',
    dialogue: {
      greeting: "Hei! Don't mind me, just delivering the mail. Ninety miles across these mountains, three days each way. The snow is nothing — I grew up skiing in Norway. It's the loneliness that gets you.",
      fact: "I carry a hundred pounds of mail on my back, on skis ten feet long. Been doing it for years. Never lost a letter. Once found a man half-frozen in a snowbank — carried him twelve miles to safety on my back, along with the mail.",
      farewell: "If you're crossing the pass, do it before October. After that, it's my territory. And if you see fresh ski tracks in the snow — that's me, coming the other way!",
    },
    choices: [
      {
        id: 'mail',
        text: 'Ask him to carry a letter back east',
        outcome: {
          message: 'Thompson takes your letter carefully and tucks it into his weatherproof bag. "It\'ll get there," he says simply. And you believe him completely. Your family will know you\'re alive.',
          moraleDelta: 15,
          goodKarmaDelta: 3,
        },
      },
      {
        id: 'ski_lesson',
        text: 'Ask about his skiing technique',
        outcome: {
          message: 'Thompson shows you how Norwegians craft and use skis. "Balance and rhythm," he says. "Same as life." He even lets you try a short slope. You fall immediately, but learn something about perseverance.',
          moraleDelta: 5,
          traitReward: 'ski_novice',
        },
      },
      {
        id: 'weather',
        text: 'Ask about weather conditions ahead',
        outcome: {
          message: '"The wind\'s shifting northwest," Thompson observes, sniffing the air. "You have maybe two days of good weather. After that, snow. Move fast." His weather sense, honed by thousands of miles on skis, is unerring.',
          moraleDelta: 8,
          healthDelta: 3,
        },
      },
    ],
    probability: 0.25,
  },
  {
    id: 'charley_parkhurst',
    characterName: 'Charley Parkhurst',
    title: 'The Greatest Stagecoach Driver',
    locationIds: ['Sacramento Valley', 'West Point'],
    period: '1812-1879',
    portrait: '🐴',
    description: 'A wiry, one-eyed figure with a tobacco-stained grin holds the reins of a six-horse stagecoach with casual mastery. "One-Eyed Charley" Parkhurst is the most famous stagecoach driver in California — and harbors an extraordinary secret.',
    historicalBio: 'Charlotte "Charley" Parkhurst was born female in 1812 but lived as a man for most of their life. They became one of California\'s most famous stagecoach drivers, surviving a kick from a horse that cost them an eye. In 1868, Charley became one of the first women to vote in a U.S. presidential election. Their true identity was only discovered after death in 1879.',
    dialogue: {
      greeting: "Need a ride? I've been driving these mountain roads for twenty years. Lost an eye to a horse kick back in '60, but I can still thread a six-horse team through a canyon at full gallop. Name's Charley.",
      fact: "They call me 'One-Eyed Charley.' I've driven stages from Stockton to Mariposa, Sacramento to Placerville. Once held off a bandit with my whip and my Colt. Nobody rides my coach who doesn't pay — and nobody robs it either.",
      farewell: "Stay on the main roads when you can. And if you see a stage coming the other way — get clear. I don't slow down for anybody.",
    },
    choices: [
      {
        id: 'ride',
        text: 'Pay for a stagecoach ride to the next town',
        outcome: {
          message: 'The ride is terrifying and exhilarating. Charley takes corners that seem impossible, the horses responding to the lightest touch. You arrive shaken but grinning — and hours ahead of schedule.',
          moraleDelta: 10,
          neutralKarmaDelta: -10,
        },
      },
      {
        id: 'driving_tips',
        text: 'Ask for advice on handling your team',
        outcome: {
          message: '"Talk to your animals," Charley says. "They know the road better than you do. Trust their instincts." The advice is surprisingly gentle from such a rough figure. Your oxen seem to travel better afterward.',
          moraleDelta: 5,
          healthDelta: 3,
          traitReward: 'teamster_wisdom',
        },
      },
      {
        id: 'bandit_stories',
        text: 'Ask about bandit encounters',
        outcome: {
          message: '"Bandits?" Charley laughs. "I\'ve faced down Black Bart himself. He tried his poetry routine, I tried my Colt .44 routine. Turns out my routine was more persuasive." The stories are colorful and probably mostly true.',
          moraleDelta: 8,
        },
      },
    ],
    probability: 0.3,
  },
  {
    id: 'sarah_winnemucca',
    characterName: 'Sarah Winnemucca',
    title: 'Voice of the Paiute',
    locationIds: ['Humboldt River', 'Humboldt Sink'],
    period: '1844-1891',
    portrait: '📖',
    description: 'A dignified Paiute woman approaches your party, speaking perfect English. She introduces herself as Sarah Winnemucca — daughter of Chief Winnemucca, interpreter, educator, and author. Her eyes hold both wisdom and sorrow.',
    historicalBio: 'Sarah Winnemucca (Thocmetony) was a Northern Paiute author, educator, and activist. She served as an interpreter and scout for the U.S. Army, lectured across the country on behalf of her people, and wrote "Life Among the Piutes" (1883) — the first autobiography by a Native American woman.',
    dialogue: {
      greeting: "I am Thocmetony — Sarah, as the white people call me. My people have lived along this river for thousands of years. We call it the Ogden. You call it the Humboldt. Whatever you call it, it is dying — and so are my people.",
      fact: "I speak English, Spanish, and three Native languages. I have lectured in San Francisco, New York, and Washington. I have written a book about my people. And still, we are pushed from our lands. The river you follow — we showed the first white travelers how to survive it.",
      farewell: "Be careful with the water here. It has always been alkaline, but it sustains life — if you respect it. I wish your people would learn to respect what sustains them.",
    },
    choices: [
      {
        id: 'learn_water',
        text: 'Ask about surviving the Humboldt',
        outcome: {
          message: 'Sarah shows you which plants filter alkaline water, where to dig for cleaner springs, and how to pace your animals along the river. "My people have known these things forever," she says quietly. Her knowledge saves your livestock.',
          healthDelta: 8,
          moraleDelta: 10,
          goodKarmaDelta: 5,
          traitReward: 'paiute_water_wisdom',
        },
      },
      {
        id: 'listen_story',
        text: 'Ask about her people and their history',
        outcome: {
          message: 'Sarah speaks of the Paiute way of life — the pine nut harvests, the rabbit drives, the songs for every season. "We were happy before the wagons came," she says. "We welcomed you as guests. And look what happened." Her words carry the weight of a world being erased.',
          moraleDelta: 5,
          goodKarmaDelta: 8,
        },
      },
      {
        id: 'trade_fair',
        text: 'Offer fair trade for dried fish and roots',
        outcome: {
          message: 'Sarah arranges a trade with her band. You receive dried fish, pine nuts, and medicinal roots. In exchange, you provide cloth and metal tools. Sarah nods approvingly. "This is how it should always be done."',
          foodDelta: 30,
          neutralKarmaDelta: -15,
          goodKarmaDelta: 5,
        },
      },
    ],
    probability: 0.35,
  },
  {
    id: 'lansford_hastings',
    characterName: 'Lansford Hastings',
    title: 'The Deceiver',
    locationIds: ['Fort Bridger'],
    period: '1819-1870',
    portrait: '📜',
    description: 'A smooth-talking man in a clean suit approaches, waving a book. "Friends! I am Lansford Hastings, author of The Emigrant\'s Guide to Oregon and California! I can show you a shortcut that will save you weeks!" His smile is too wide, his promises too easy.',
    historicalBio: 'Lansford Warren Hastings wrote "The Emigrant\'s Guide to Oregon and California" (1845), promoting a shortcut he had only partially explored — on horseback, not with wagons. The "Hastings Cutoff" proved disastrous. The Donner Party, following his advice, was fatally delayed and trapped in the Sierra Nevada.',
    dialogue: {
      greeting: "Ah, fellow travelers! You look like intelligent folk who want to reach California faster. My shortcut — the Hastings Cutoff — will save you 300 miles! I've mapped it myself!",
      fact: "My guide has sold thousands of copies! The route goes south of the Great Salt Lake, through the salt flats, and rejoins the trail at the Humboldt. Simple! I've traveled it myself — on horseback. I'm sure wagons will be... fine.",
      farewell: "Remember: Hastings Cutoff! South of the lake! You'll thank me when you arrive weeks early. Just... don't wait too long to cross the mountains.",
    },
    choices: [
      {
        id: 'reject',
        text: 'Decline his shortcut firmly',
        outcome: {
          message: '"I\'ll stick to the known trail, thank you." Hastings\' smile falters. An old-timer nearby nods approvingly: "Smart. That shortcut killed the Donner Party." You chose wisely.',
          moraleDelta: 10,
          goodKarmaDelta: 5,
          traitReward: 'wise_traveler',
        },
      },
      {
        id: 'question',
        text: 'Press him on whether he traveled it with wagons',
        outcome: {
          message: '"Well, I... that is... I rode it on horseback, but the terrain should support..." Hastings stammers when challenged. Other emigrants nearby exchange knowing glances. His guide is dangerously incomplete.',
          moraleDelta: 8,
          goodKarmaDelta: 3,
        },
      },
      {
        id: 'buy_book',
        text: 'Buy his guidebook (for entertainment value)',
        outcome: {
          message: 'You pay for the book, which turns out to be a fascinating mix of useful information and wild exaggeration. At least you\'ll have reading material. The section on the "easy" desert crossing is particularly creative fiction.',
          neutralKarmaDelta: -5,
          moraleDelta: 3,
        },
      },
    ],
    probability: 0.4,
  },
  {
    id: 'donner_memorial',
    characterName: 'Donner Party Memorial',
    title: 'Those Who Came Before',
    locationIds: ['Truckee Pass'],
    period: 'Winter 1846-47',
    portrait: '🪦',
    description: 'At the summit of Truckee Pass, you find a stone monument. A plaque lists 87 names — men, women, and children who were trapped here by early snow in the winter of 1846-47. The wind carries whispers. Your party falls silent.',
    historicalBio: 'The Donner Party departed Springfield, Illinois in April 1846. Taking the untested Hastings Cutoff, they arrived at the Sierra Nevada too late in the season. Trapped by snow at Truckee Lake, they endured a horrific winter. Of 87 members, only 48 survived. Some resorted to cannibalism to stay alive.',
    dialogue: {
      greeting: "A weathered stone monument stands at the pass. Names are carved into it, many belonging to children. A small plaque reads: 'IN MEMORIAM — The Donner Party, 1846-47. May their suffering not be in vain.'",
      fact: "Nearby, a guide has posted a timeline: The party left too late (May instead of April), lost weeks on the Hastings Cutoff, and arrived at the pass on October 31 — one day after the first heavy snowfall trapped them. Every decision mattered.",
      farewell: "The monument stands in silence. Your party moves on, checking their supplies and the calendar. Nobody suggests taking any shortcuts.",
    },
    choices: [
      {
        id: 'pay_respects',
        text: 'Leave flowers and say a prayer',
        outcome: {
          message: 'Your party gathers around the monument. Someone reads the names aloud. Others place wildflowers at the base. The solemnity of the moment strengthens your resolve to be prepared, to be careful, to value every member of your party.',
          moraleDelta: 15,
          goodKarmaDelta: 10,
          traitReward: 'donner_witness',
        },
      },
      {
        id: 'study',
        text: 'Study the timeline to learn from their mistakes',
        outcome: {
          message: 'You carefully read the posted timeline, noting each fateful decision. The lesson is clear: don\'t take untested shortcuts, don\'t delay, and always respect the mountains. Your party discusses supplies and timing with new urgency.',
          moraleDelta: 10,
          goodKarmaDelta: 5,
        },
      },
      {
        id: 'hurry',
        text: 'Urge the party to move quickly through the pass',
        outcome: {
          message: 'The memorial\'s lesson hits home — you push through the pass with renewed urgency. No one complains about the pace. The fear of becoming another monument is a powerful motivator.',
          moraleDelta: 5,
        },
      },
    ],
    alwaysTriggers: true,
    probability: 1.0,
  },
]

/** Get historical character events for a specific location */
export function getCharactersForLocation(locationName: string): HistoricalCharacterEvent[] {
  return HISTORICAL_CHARACTERS.filter(c => c.locationIds.includes(locationName))
}

/** Roll for a historical character encounter at a location */
export function rollHistoricalEncounter(locationName: string, visitedIds: string[]): HistoricalCharacterEvent | null {
  const available = HISTORICAL_CHARACTERS.filter(c => {
    if (!c.locationIds.includes(locationName)) return false
    // Always-trigger events only fire once
    if (c.alwaysTriggers && visitedIds.includes(c.id)) return false
    // Always-trigger events always fire on first visit
    if (c.alwaysTriggers && !visitedIds.includes(c.id)) return true
    // Normal probability
    return Math.random() < c.probability
  })

  if (available.length === 0) return null
  // Prioritize always-triggers, then random
  const alwaysTrigger = available.find(c => c.alwaysTriggers)
  return alwaysTrigger || available[Math.floor(Math.random() * available.length)]
}
