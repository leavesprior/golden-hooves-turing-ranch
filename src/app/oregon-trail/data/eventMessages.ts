// Colorful Event Messages - Fallout-Style Flavor Text
// 200+ unique messages for hunting, combat, events, and outcomes
// Inspired by Fallout's critical hit messages

// ============================================
// HUNTING OUTCOMES
// ============================================

export const HUNTING_MESSAGES = {
  // Critical Success - You absolutely nailed it
  criticalSuccess: [
    'Your bullet finds its mark with surgical precision. The deer looks almost impressed.',
    'One shot, one kill. The animals will speak of this day in hushed whispers.',
    'The prey never knew what hit it. Neither did you, honestly. That was incredible.',
    'A perfect shot through the vitals. Even the wind was afraid to interfere.',
    'Clean kill. The hunting gods smile upon your barrel today.',
    'You\'ve peaked. All hunting from now on will be a disappointment.',
    'The bullet travels in a way that defies physics and good taste. It works.',
    'Your ancestors, generations of hunters, nod approvingly from wherever they are.',
    'That shot was so good, you should probably quit while you\'re ahead.',
    'The animal fell gracefully. You almost feel bad. Almost.',
  ],

  // Regular Success - You got something
  success: [
    'You bag some game. The frontier provides.',
    'A successful hunt. Your stomach thanks you in advance.',
    'You return with meat. The party refrains from asking too many questions.',
    'The hunting party eats tonight. And tomorrow. Maybe.',
    'Game secured. You resist the urge to pose dramatically.',
    'Not bad shooting. The deer would probably agree if it could.',
    'Fresh meat acquired. The vultures will have to find lunch elsewhere.',
    'You shot something. It stayed shot. Good enough.',
    'The wilderness surrenders some of its bounty. Reluctantly.',
    'Hunting success. You feel like a proper frontier person.',
  ],

  // Failure - You missed or couldn't find anything
  failure: [
    'The animals today have chosen violence. Or, more accurately, evasion.',
    'You return empty-handed, full of excuses.',
    'The game was smart today. Smarter than you, anyway.',
    'Your bullets found trees, rocks, and air. Just not animals.',
    'The wilderness keeps its creatures today. Tomorrow, maybe.',
    'Hours of stalking, seconds of shooting, zero hits. Mathematics.',
    'The prey wins this round. It also wins all the other rounds today.',
    'You\'ve successfully scared away everything within a mile radius.',
    'Hunting: attempt 1. Results: hypothetical.',
    'The animals must be laughing somewhere. You can\'t hear them. They\'re hiding too well.',
  ],

  // Critical Failure - Something went wrong
  criticalFailure: [
    'You shot at a deer. You hit a tree. The tree looks angry.',
    'The gun jams at the worst possible moment. The deer winks and saunters off.',
    'You trip, fall, and watch your bullet sail into the clouds.',
    'Not only did you miss, but you may have started a small forest fire.',
    'The animals aren\'t running from you. They\'re walking. Slowly. Mockingly.',
    'You\'ve wasted ammunition and dignity in equal measure.',
    'The prey escaped. Your ammunition escaped. Your patience escaped.',
    'Somewhere, a hunting instructor weeps for reasons they don\'t understand.',
    'The only thing you shot today was your confidence.',
    'You return with stories. Just stories. No meat. Many stories.',
  ],

  // Specific animal flavor
  bear: [
    'You found a bear. More accurately, a bear found you. You survived, barely.',
    'Bear encounter! Your shots were accurate. The bear was unimpressed.',
    'A bear! You bravely stood your ground and it bravely wandered off.',
  ],
  buffalo: [
    'Buffalo down! The weight of your kill physically impresses no one more than you.',
    'You can only carry 100 pounds of meat, but you shot 2000 pounds of buffalo. Math.',
    'The buffalo herd thins by one. The other 500 seem unbothered.',
  ],
  rabbit: [
    'You shot a rabbit. Your ammunition costs more than the meal.',
    'Rabbit acquired. It\'s small. It\'ll feed someone. One someone.',
    'A rabbit falls to your overwhelming firepower. Feel proud?',
  ],
  squirrel: [
    'You shot a squirrel. The energy spent exceeded the calories gained.',
    'Squirrel down. Achievement unlocked: Bare Minimum.',
    'You hunted a squirrel. The squirrel nation will remember this.',
  ]
}

// ============================================
// DISEASE AND INJURY OUTCOMES
// ============================================

export const HEALTH_MESSAGES = {
  // Disease contracted
  dysentery: [
    'Dysentery strikes. The trail becomes significantly less pleasant.',
    'Someone has dysentery. Rest stops will be frequent and undignified.',
    'The dreaded dysentery appears. A classic trail experience.',
    'Dysentery arrives, uninvited and unwelcome.',
  ],
  typhoid: [
    'Typhoid fever descends like an unwelcome guest.',
    'Typhoid. The trail\'s way of saying "slow down."',
    'Fever takes hold. The journey just got harder.',
  ],
  cholera: [
    'Cholera strikes. The water was not your friend.',
    'Cholera! A reminder that not all rivers are drinkable.',
    'The dreaded cholera appears. Time and rest are the only cure.',
  ],
  snakebite: [
    'Snakebite! The desert strikes back.',
    'A snake objects to your presence. Violently.',
    'Bitten! The snake has spoken, and it said "no."',
  ],
  broken_leg: [
    'A broken leg. The wagon just became someone\'s bedroom.',
    'Snap! That\'s not a sound you wanted to hear.',
    'Broken limb. The journey continues, but slower.',
  ],

  // Recovery
  recovered: [
    'Health restored! The body remembers how to work.',
    'Recovery complete. The trail beckons once more.',
    'Feeling better. The frontier isn\'t done with you yet.',
    'Strength returns. Time to continue being reckless.',
  ],

  // Death
  death: [
    'Here lies a dreamer. The trail keeps their story.',
    'Gone, but the journey continues. It always continues.',
    'The trail claims another. It\'s neither kind nor cruel, just inevitable.',
    'A grave marker joins many others. The west is unforgiving.',
  ]
}

// ============================================
// WAGON AND EQUIPMENT
// ============================================

export const EQUIPMENT_MESSAGES = {
  // Wagon damage
  wheel_broke: [
    'The wagon wheel disagrees with a rock. The rock wins.',
    'Snap! That sound was expensive.',
    'Wheel down! Time for everyone\'s least favorite activity: repairs.',
    'The wheel breaks in the most dramatic way possible.',
  ],
  axle_broke: [
    'The axle gives up. It\'s been a long journey for everyone.',
    'Axle failure. The wagon\'s skeleton betrays you.',
    'That grinding noise was worse than you thought.',
  ],
  tongue_broke: [
    'The wagon tongue snaps. Even wood has limits.',
    'The oxen are suddenly free. They don\'t know what to do with this information.',
  ],

  // Repairs
  repair_success: [
    'Repairs complete. Your ancestors would be proud. Probably.',
    'Fixed! The wagon will complain about this for miles.',
    'Repaired. It\'s not pretty, but it works.',
    'Good as new. Well, good as used. Good as functional.',
  ],
  repair_fail: [
    'The repair didn\'t take. The spare parts gave their lives in vain.',
    'You fixed it. Then it unfixed itself. Engineering is hard.',
    'Turns out you\'re not as handy as you thought.',
  ],

  // Lost items
  lost_supplies: [
    'Supplies fall from the wagon. They\'re free now.',
    'Some cargo decides to explore the wilderness solo.',
    'Items lost! The trail takes its toll.',
  ],
  lost_to_river: [
    'The river claims tribute. Your supplies volunteer.',
    'Water damage! Some things float. Your supplies don\'t.',
    'The crossing cost more than you expected.',
  ],
  stolen: [
    'Thieves in the night! They took things you liked.',
    'Morning inventory reveals nocturnal visitors.',
    'Someone helped themselves. Without asking.',
  ]
}

// ============================================
// WEATHER EVENTS
// ============================================

export const WEATHER_MESSAGES = {
  storm_damage: [
    'The storm decides to make a point. Violently.',
    'Lightning, thunder, and very wet belongings.',
    'Nature throws a tantrum. Your wagon participates.',
    'The storm passes. Some of your things don\'t.',
  ],
  snow_delay: [
    'Snow falls. Progress freezes with it.',
    'Winter arrives early. Plans change accordingly.',
    'The white stuff covers everything. Including hope of quick travel.',
  ],
  heatwave: [
    'The sun has opinions about your comfort. Negative opinions.',
    'Heat ripples off the trail. So does your will to continue.',
    'Today\'s forecast: hot. Tomorrow: also hot. Forever: increasingly hot.',
  ],
  dust_storm: [
    'Dust everywhere. In everything. Forever.',
    'The wind brings the desert. All of it.',
    'You\'ll be finding sand in your ears for weeks.',
  ]
}

// ============================================
// RANDOM EVENT OUTCOMES
// ============================================

export const EVENT_MESSAGES = {
  // Good fortune
  found_supplies: [
    'Fortune smiles! Supplies appear when you needed them.',
    'Someone\'s loss is your gain. The trail provides.',
    'Abandoned goods! Someone else\'s misfortune becomes yours. The good kind.',
    'Luck! Free stuff! The universe balances itself.',
  ],
  found_money: [
    'Karma nuggets glint in the dirt. Today is good.',
    'A hidden cache reveals itself. You\'re richer!',
    'Fortune literally falls into your lap.',
  ],
  good_trade: [
    'A fair trade! Both parties walk away confused but satisfied.',
    'The barter goes well. This might be a first.',
    'Good deal! Your negotiation skills are... adequate.',
  ],

  // Neutral events
  nothing_happened: [
    'Another day passes. Nothing tries to kill you.',
    'Uneventful travel. You almost miss the chaos.',
    'The trail is quiet. Too quiet? No, just quiet.',
    'A normal day. Suspiciously normal.',
  ],
  met_travelers: [
    'Fellow travelers pass. Waves are exchanged.',
    'Others on the trail. Misery loves company.',
    'Travelers share news. Most of it is even true.',
  ],

  // Bad fortune
  bad_water: [
    'The water was bad. Your insides agree vocally.',
    'That spring was a trap. Your stomach knows.',
    'Contaminated water! The frontier\'s classic prank.',
  ],
  lost_trail: [
    'The trail vanishes. You\'re making your own path now.',
    'Lost! The map says one thing, reality says another.',
    'You\'ve pioneered a new route. By accident.',
  ],
  oxen_trouble: [
    'The oxen are being dramatic. More dramatic than usual.',
    'Ox drama. They\'ve been watching you and picked up bad habits.',
    'The oxen refuse to cooperate. A labor strike on the prairie.',
  ]
}

// ============================================
// KARMA AND MORAL OUTCOMES
// ============================================

export const KARMA_MESSAGES = {
  // Good karma earned
  helped_stranger: [
    'Your kindness ripples outward. The universe notices.',
    'A good deed done. The trail remembers.',
    'Compassion on the frontier. Rare and valuable.',
  ],
  fair_deal: [
    'Honesty in commerce. A revolutionary concept.',
    'A fair shake for everyone. Novel.',
    'Good business karma earned.',
  ],

  // Bad karma earned
  selfish_act: [
    'Self-interest wins today. Your conscience loses.',
    'Looking out for number one. The trail doesn\'t judge. Much.',
    'A practical decision. That\'s what you tell yourself.',
  ],
  cruel_act: [
    'The frontier hardens hearts. Yours hardens further.',
    'That choice will follow you. In memories, mostly.',
    'Some karma cannot be recovered. This might be it.',
  ],

  // Neutral
  practical_choice: [
    'Neither good nor bad. Just... necessary.',
    'Survival makes ethicists of no one.',
    'The frontier doesn\'t deal in morality. Neither do you today.',
  ]
}

// ============================================
// MILESTONE MESSAGES
// ============================================

export const MILESTONE_MESSAGES = {
  // Distance milestones
  hundred_miles: [
    'One hundred miles behind you. Many more ahead.',
    '100 miles. A good start. The trail disagrees.',
    'First hundred down. Only... many more to go.',
  ],
  halfway: [
    'Halfway! The point of no return was miles ago.',
    'The middle of the journey. Too far to turn back.',
    'Halfway there. Or maybe just beginning, depending on your optimism.',
  ],
  near_destination: [
    'Gold Country looms. You can almost smell the opportunity.',
    'Nearly there! The end is almost visible.',
    'The destination approaches. You\'ve earned it.',
  ],

  // Time milestones
  one_month: [
    'A month on the trail. Time moves differently out here.',
    'Four weeks of dust, hope, and questionable decisions.',
    'One month. You\'re officially a trail veteran.',
  ],
  survived_winter: [
    'Winter survived. Spring feels like a reward.',
    'You outlasted the cold. Not everyone can say that.',
    'The freeze passes. You remain. Victory.',
  ]
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getHuntingMessage(
  success: boolean,
  critical: boolean,
  animal?: 'bear' | 'buffalo' | 'rabbit' | 'squirrel' | 'generic'
): string {
  if (critical) {
    return pickRandom(success ? HUNTING_MESSAGES.criticalSuccess : HUNTING_MESSAGES.criticalFailure)
  }

  if (animal && animal !== 'generic' && HUNTING_MESSAGES[animal]) {
    return pickRandom(HUNTING_MESSAGES[animal])
  }

  return pickRandom(success ? HUNTING_MESSAGES.success : HUNTING_MESSAGES.failure)
}

export function getHealthMessage(
  type: 'dysentery' | 'typhoid' | 'cholera' | 'snakebite' | 'broken_leg' | 'recovered' | 'death'
): string {
  return pickRandom(HEALTH_MESSAGES[type] || HEALTH_MESSAGES.recovered)
}

export function getEquipmentMessage(
  type: keyof typeof EQUIPMENT_MESSAGES
): string {
  return pickRandom(EQUIPMENT_MESSAGES[type])
}

export function getWeatherMessage(
  type: keyof typeof WEATHER_MESSAGES
): string {
  return pickRandom(WEATHER_MESSAGES[type])
}

export function getEventMessage(
  type: keyof typeof EVENT_MESSAGES
): string {
  return pickRandom(EVENT_MESSAGES[type])
}

export function getKarmaMessage(
  type: keyof typeof KARMA_MESSAGES
): string {
  return pickRandom(KARMA_MESSAGES[type])
}

export function getMilestoneMessage(
  type: keyof typeof MILESTONE_MESSAGES
): string {
  return pickRandom(MILESTONE_MESSAGES[type])
}

// Get a random dramatic outcome message for any action
export function getDramaticOutcome(success: boolean, critical: boolean = false): string {
  const successMessages = [
    'Against all odds, it works.',
    'Success! The frontier isn\'t done with you yet.',
    'You did it. Feel proud. Briefly.',
    'That worked better than expected. Suspicious.',
    'Victory! Small, but still victory.',
  ]

  const criticalSuccessMessages = [
    'Perfection. Frame this moment.',
    'The universe aligns in your favor. Enjoy it.',
    'Legendary. They\'ll tell stories about this.',
    'You\'ve peaked. It\'s all downhill from here.',
    'Even luck is impressed.',
  ]

  const failureMessages = [
    'That didn\'t work. At all.',
    'Failure, but educational.',
    'Not your finest moment.',
    'The frontier laughs. It always laughs.',
    'Try again? Or don\'t. Either way.',
  ]

  const criticalFailureMessages = [
    'Disaster. Pure, uncut disaster.',
    'This is the kind of failure people remember.',
    'Spectacularly wrong. Almost impressive.',
    'Everything that could go wrong did. And then some.',
    'Rock bottom has a basement. You\'ve found it.',
  ]

  if (critical) {
    return pickRandom(success ? criticalSuccessMessages : criticalFailureMessages)
  }

  return pickRandom(success ? successMessages : failureMessages)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Export all message banks for direct access
export const ALL_MESSAGES = {
  hunting: HUNTING_MESSAGES,
  health: HEALTH_MESSAGES,
  equipment: EQUIPMENT_MESSAGES,
  weather: WEATHER_MESSAGES,
  events: EVENT_MESSAGES,
  karma: KARMA_MESSAGES,
  milestones: MILESTONE_MESSAGES
}
