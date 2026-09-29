import type { InvestigationState, OregonTrailState, RandomEvent, Weather } from './types'
import { buildDefaultLivingTrailSlice } from './livingTrailActions'

// Landmarks along the trail (Missouri to California Gold Country)
export const LANDMARKS = [
  { name: 'Independence, Missouri', distance: 0, type: 'town' },
  { name: 'Kansas River Crossing', distance: 102, type: 'river' },
  { name: 'Fort Kearny', distance: 304, type: 'fort' },
  { name: 'Chimney Rock', distance: 554, type: 'landmark' },
  { name: 'Fort Laramie', distance: 640, type: 'fort' },
  { name: 'Independence Rock', distance: 830, type: 'landmark' },
  { name: 'South Pass', distance: 932, type: 'pass' },
  { name: 'Fort Bridger', distance: 1032, type: 'fort' },
  { name: 'Raft River', distance: 1120, type: 'river' },
  { name: 'City of Rocks', distance: 1200, type: 'landmark' },
  { name: 'Humboldt River', distance: 1380, type: 'river' },
  { name: 'Humboldt Sink', distance: 1520, type: 'landmark' },
  { name: 'Forty Mile Desert', distance: 1600, type: 'desert' },
  { name: 'Truckee Pass', distance: 1750, type: 'pass' },
  { name: 'Sacramento Valley', distance: 1900, type: 'landmark' },
  { name: 'West Point', distance: 1950, type: 'town', special: 'cynthias_inn' },  // Back of Beyond connection!
  { name: 'Gold Country', distance: 2000, type: 'destination' },
]

// Check if a landmark has Cynthia's Inn
export function hasCynthiasInn(landmarkName: string): boolean {
  const landmark = LANDMARKS.find(l => l.name === landmarkName)
  return landmark?.special === 'cynthias_inn'
}

// Random events with karma choices
// Karma deltas: positive values ADD to that karma type, negative values SUBTRACT
// karmaGood: -15 = +15 Good Karma (virtuous), karmaGood: 15 = +15 Bad alignment push
// neutralKarmaDelta: positive = gain, negative = spend
// goodKarmaDelta: positive = gain, negative = spend
// badKarmaDelta: positive = gain debt
export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'sick_traveler',
    title: 'Sick Traveler',
    description: 'A sick traveler sits by the trail, too weak to go on alone. He asks what year it is. You tell him 1849, which is true, if not the whole truth.',
    choices: [
      {
        id: 'help',
        text: 'Share your medicine and food',
        outcome: {
          message: 'Your medicine does what medicine will. He shakes your hand and swears he\'ll return the favor someday. Out here, someday is a long word.',
          foodDelta: -20,
          medicineDelta: -1,
          neutralKarmaDelta: -20,  // Costs 20🌮
          goodKarmaDelta: 15,      // Earns 15🍪
        },
        karmaLawful: 0,
        karmaGood: -15,
      },
      {
        id: 'ignore',
        text: 'Continue on your way',
        outcome: {
          message: 'You leave him by the trail. You will never learn how his story ends, and that is its own kind of weight.',
          badKarmaDelta: 3,  // Gains 3🪨
        },
        karmaLawful: 0,
        karmaGood: 5,
      },
    ],
  },
  {
    id: 'broken_wagon',
    title: 'Stranded Family',
    description: 'A family sits beside a wagon with a busted wheel, a long way from anywhere with a wheelwright.',
    choices: [
      {
        id: 'share_parts',
        text: 'Give them a spare part',
        outcome: {
          message: 'The wheel goes on and the family\'s spirits go up. They press a sack of food on you and won\'t hear otherwise.',
          spareParts: -1,
          foodDelta: 10,
          goodKarmaDelta: 10,  // Earns 10🍪
        },
        karmaLawful: -5,
        karmaGood: -10,
      },
      {
        id: 'trade_unfair',
        text: 'Offer to trade at triple the value',
        outcome: {
          message: 'They pay it, because what else can they do. You profit from their misfortune, and the trail takes note.',
          spareParts: -1,
          neutralKarmaDelta: 30,  // Earns 30🌮
          badKarmaDelta: 5,       // Gains 5🪨 debt
        },
        karmaLawful: 5,
        karmaGood: 15,
      },
      {
        id: 'pass',
        text: 'Wish them luck and continue',
        outcome: { message: 'You tip your hat and roll on. They are still sitting there when you look back.' },
        karmaLawful: 0,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'native_trade',
    title: 'Native Traders',
    description: 'A party of Native American traders rides up with goods to trade. They know this country far better than any map in your wagon.',
    choices: [
      {
        id: 'fair_trade',
        text: 'Trade fairly for supplies',
        outcome: {
          message: 'The trade is mutually beneficial. You gain food and trust. Seeing you deal honestly, an elder presses a well-kept traveler\'s towel into your hands — "for the road."',
          neutralKarmaDelta: -15,  // Costs 15🌮
          foodDelta: 50,
          goodKarmaDelta: 10,      // Earns 10🍪 for fair dealing
          itemReward: 'towel',     // the tribe may gift a towel for fair dealing...
          itemRewardChance: 0.35,  // ...35% of the time (they are rare)
        },
        karmaLawful: -10,
        karmaGood: -10,
      },
      {
        id: 'decline',
        text: 'Politely decline',
        outcome: { message: 'They nod and ride on, unbothered. They have seen plenty of wagons pass.' },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'steal',
        text: 'Wait until nightfall and take their goods',
        outcome: {
          message: 'You take their goods in the dark. It sits in your wagon and on your conscience, and only one of them lightens with time.',
          foodDelta: 80,
          ammoDelta: 20,
          neutralKarmaDelta: 80,  // Ill-gotten gains 80🌮 worth
          badKarmaDelta: 20,      // Major bad karma 20🪨
        },
        karmaLawful: 10,
        karmaGood: 20,
      },
    ],
  },
  {
    id: 'claim_jumping',
    title: 'Claim Jumpers',
    description: 'Three claim jumpers are pulling up a prospector\'s stakes while he hollers about the law. The law is several hundred miles away.',
    choices: [
      {
        id: 'report',
        text: 'Help the prospector and report to authorities',
        outcome: {
          message: 'You stand with the prospector until the jumpers think better of it. He pays you in gratitude and a little dust.',
          neutralKarmaDelta: 25,  // Reward 25🌮
          goodKarmaDelta: 10,     // Earns 10🍪
          daysLost: 1,
        },
        karmaLawful: -15,
        karmaGood: -10,
      },
      {
        id: 'join',
        text: 'Join the claim jumpers for a cut',
        outcome: {
          message: 'You take your cut of a stolen claim. It spends the same as honest gold. It doesn\'t sleep the same.',
          neutralKarmaDelta: 50,  // Ill-gotten 50🌮
          badKarmaDelta: 15,      // Major bad karma 15🪨
        },
        karmaLawful: 15,
        karmaGood: 15,
      },
      {
        id: 'avoid',
        text: 'Mind your own business',
        outcome: { message: 'You find something fascinating to look at in the other direction, and keep looking until you are out of sight.' },
        karmaLawful: 0,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'starving_family',
    title: 'Starving Family',
    description: 'A family by the trail hasn\'t eaten in days. The children are too tired to beg.',
    choices: [
      {
        id: 'share_food',
        text: 'Share a generous portion of food',
        outcome: {
          message: 'The family eats their first real meal in a week. Your wagon is lighter, and so, somehow, are you.',
          foodDelta: -40,
          neutralKarmaDelta: -40,  // Costs 40🌮 worth
          goodKarmaDelta: 15,      // Earns 15🍪
        },
        karmaLawful: 0,
        karmaGood: -15,
      },
      {
        id: 'small_share',
        text: 'Share a small amount',
        outcome: {
          message: 'It isn\'t much. It is more than they had an hour ago.',
          foodDelta: -15,
          goodKarmaDelta: 5,  // Earns 5🍪
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'refuse',
        text: 'You can\'t spare any food',
        outcome: {
          message: 'You walk on. Their voices follow you further than you\'d like.',
          badKarmaDelta: 8,  // Gains 8🪨
        },
        karmaLawful: 0,
        karmaGood: 8,
      },
    ],
  },
  {
    id: 'wild_animal',
    title: 'Wild Animal Attack',
    description: 'Two green eyes at the edge of the firelight. A mountain lion is taking an interest in your camp.',
    choices: [
      {
        id: 'shoot',
        text: 'Shoot it before it attacks',
        outcome: { message: 'Quick hands and a few loud shots, and the lion decides your camp is more trouble than supper.', ammoDelta: -3 },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'scare',
        text: 'Try to scare it away with fire',
        outcome: {
          message: 'A burning branch sends the lion back into the dark, but not before it leaves a party member a souvenir.',
          healthDelta: -15,
          goodKarmaDelta: 2,  // Mercy earns a little good karma
        },
        karmaLawful: 0,
        karmaGood: -2,
      },
    ],
  },
  {
    id: 'found_gold',
    title: 'Karma Nugget',
    description: 'Something glints in the stream bed. Could be gold. Could be fool\'s gold. Could be a tin button somebody lost in 1848.',
    choices: [
      {
        id: 'pan',
        text: 'Spend a day panning',
        outcome: {
          message: 'Lady Luck smiles, and a respectable nugget rolls into your pan. Half of Missouri would give a year for this.',
          neutralKarmaDelta: 40,  // Earns 40🌮
          daysLost: 1,
        },
        karmaLawful: -3,
        karmaGood: 0,
      },
      {
        id: 'continue',
        text: 'Keep moving - Gold Country awaits',
        outcome: { message: 'You resist temptation and press on.' },
        karmaLawful: -2,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'oxen_theft',
    title: 'Oxen Thieves',
    description: 'Somebody is untying your oxen in the dark, and it isn\'t anybody you hired.',
    choices: [
      {
        id: 'fight',
        text: 'Fight them off',
        outcome: {
          message: 'A few shots into the dark and the rustlers remember urgent business elsewhere. Your ammunition does not come back.',
          ammoDelta: -10,
          goodKarmaDelta: 5,  // Defending yourself is honorable
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'negotiate',
        text: 'Offer them karma to leave',
        outcome: {
          message: 'They take the karma, tip their hats, and melt into the night. Fine manners, for thieves.',
          neutralKarmaDelta: -25,  // Costs 25🌮
        },
        karmaLawful: 5,
        karmaGood: 0,
      },
    ],
  },
  // === HITCHHIKER'S GUIDE STYLE EVENTS ===
  {
    id: 'philosophical_stranger',
    title: 'The Philosophical Stranger',
    description: 'A disheveled traveler blocks your path, seemingly lost in deep thought. "Tell me," he says without introduction, "if a wagon wheel falls in the desert and no one is around to hear it, does it still ruin your day?"',
    choices: [
      {
        id: 'engage',
        text: 'Engage in philosophical debate',
        outcome: {
          message: 'Two hours later you have solved nothing, but you feel enlightened. The stranger mentions he has read about you in a history book, then vanishes with a knowing smile.',
          daysLost: 0,
          goodKarmaDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'practical',
        text: '"Yes. Obviously yes."',
        outcome: {
          message: 'He nods sagely. "A practical soul. The frontier needs more of you." He gives you a spare part from nowhere.',
          spareParts: 1,
        },
        karmaLawful: -2,
        karmaGood: 0,
      },
      {
        id: 'ignore',
        text: 'Edge around him slowly',
        outcome: {
          message: '"Ah, the silent treatment," he calls after you. "Also valid!" You travel on, slightly unsettled.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'suspiciously_helpful_map',
    title: 'The Suspiciously Helpful Map',
    description: 'You find a map tacked to a tree. It shows a shortcut that would save three days. It is labeled, in beautiful calligraphy, "NOT A TRAP."',
    choices: [
      {
        id: 'trust',
        text: 'Take the shortcut (it probably isn\'t a trap)',
        outcome: {
          message: 'Against all logic, the shortcut works perfectly. You find supplies hidden along the way by... someone. The universe may have a sense of humor.',
          foodDelta: 30,
          neutralKarmaDelta: 15,
        },
        karmaLawful: 5,
        karmaGood: 0,
      },
      {
        id: 'distrust',
        text: 'Ignore it (because it definitely IS a trap)',
        outcome: {
          message: 'You stick to the main trail. That night, you hear distant screaming from the direction of the "shortcut." You made the right call.',
        },
        karmaLawful: -5,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'singing_wheel',
    title: 'The Singing Wheel',
    description: 'One of your wagon wheels has developed a squeak that sounds uncannily like a song. Party morale is divided: half find it charming, half want to burn the wagon.',
    choices: [
      {
        id: 'grease',
        text: 'Grease the wheel (silence the song)',
        outcome: {
          message: 'The squeak stops. The silence somehow feels judgmental. Party morale stabilizes.',
          spareParts: -1,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'sing_along',
        text: 'Teach everyone the lyrics',
        outcome: {
          message: 'By day three, you have a traveling chorus. Other wagons give you strange looks but your morale soars.',
          healthDelta: 5,
          goodKarmaDelta: 3,
        },
        karmaLawful: 3,
        karmaGood: -3,
      },
    ],
  },
  {
    id: 'competitive_snake',
    title: 'The Competitive Snake',
    description: 'A rattlesnake appears on the trail. Rather than striking, it seems to be challenging your lead ox to a staring contest.',
    choices: [
      {
        id: 'wait',
        text: 'Wait for the ox to win',
        outcome: {
          message: 'After 47 minutes, the snake blinks first. Your ox has never looked more proud. Snake reputation: damaged.',
          healthDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'intervene',
        text: 'Break up the contest',
        outcome: {
          message: 'Both participants look disappointed in you. The snake slithers off. Your ox refuses to make eye contact for the next ten miles.',
          healthDelta: -5,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'bet',
        text: 'Place bets',
        outcome: {
          message: 'You organize a gambling ring around the staring contest. Word spreads. You make a small fortune before authorities ask questions.',
          neutralKarmaDelta: 25,
          badKarmaDelta: 3,
        },
        karmaLawful: 5,
        karmaGood: 3,
      },
    ],
  },
  {
    id: 'over_prepared_traveler',
    title: 'The Over-Prepared Traveler',
    description: 'A fellow traveler approaches with a wagon so laden with supplies it has carved a rut three inches deep. "I brought EVERYTHING," they announce proudly. "Want to trade?"',
    choices: [
      {
        id: 'trade_food',
        text: 'Trade for food',
        outcome: {
          message: '"Food? I have seventeen varieties!" You leave with more provisions than your wagon can reasonably hold.',
          foodDelta: 60,
          neutralKarmaDelta: -20,
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
      {
        id: 'trade_advice',
        text: 'Trade advice for medicine',
        outcome: {
          message: 'You explain that they don\'t need three butter churns. In gratitude, they share medical supplies.',
          medicineDelta: 3,
        },
        karmaLawful: 0,
        karmaGood: -3,
      },
      {
        id: 'decline_politely',
        text: 'Decline politely (their wagon is a cautionary tale)',
        outcome: {
          message: '"Your loss!" They trundle on. You notice their oxen weeping.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'prophetic_child',
    title: 'The Prophetic Child',
    description: 'A child from a passing wagon points at you and declares, "The trail knows your name, and the year you came from." Their parents apologize and hurry on. You are left with questions.',
    choices: [
      {
        id: 'ponder',
        text: 'Ponder the meaning deeply',
        outcome: {
          message: 'You spend the day in contemplation. No answers come, but you feel... prepared for something.',
          goodKarmaDelta: 5,
        },
        karmaLawful: 0,
        karmaGood: -5,
      },
      {
        id: 'dismiss',
        text: 'Children say strange things',
        outcome: {
          message: 'You shrug it off. Probably nothing. The wind whispers your name once, but that could be coincidence.',
        },
        karmaLawful: 0,
        karmaGood: 0,
      },
    ],
  },
  {
    id: 'ghost_town_shortcut',
    title: 'The Unusually Quiet Settlement',
    description: 'You pass through a town that exists on no map, not this century\'s and not yours. The buildings are well kept but the streets are empty. A sign reads: "WELCOME. PLEASE DON\'T STAY."',
    choices: [
      {
        id: 'take_supplies',
        text: 'Help yourself to obviously abandoned supplies',
        outcome: {
          message: 'You grab what you can. As you leave, every window suddenly has a face watching. You do not look back.',
          foodDelta: 40,
          ammoDelta: 15,
          badKarmaDelta: 10,
        },
        karmaLawful: 10,
        karmaGood: 10,
      },
      {
        id: 'respect_wishes',
        text: 'Leave immediately (respect their wishes)',
        outcome: {
          message: 'You hurry through. At the edge of town, you find a package with your name on it containing supplies. Best not to question it.',
          foodDelta: 20,
          medicineDelta: 2,
          goodKarmaDelta: 10,
        },
        karmaLawful: -5,
        karmaGood: -10,
      },
    ],
  },
]

// Default investigation state
export const DEFAULT_INVESTIGATION: InvestigationState = {
  currentOutlawId: null,
  hoursInvestigated: 0,
  maxInvestigationHours: 8,    // 8 hours per location before trail goes cold
  witnessesInterviewed: [],
  locationsSearched: [],
  activeWitness: null,
  activeNpcId: null,
}

// Default initial state
export const DEFAULT_STATE: OregonTrailState = {
  day: 1,
  distance: 0,
  currentLandmark: 'Independence, Missouri',
  nextLandmark: 'Kansas River Crossing',
  milesUntilNextLandmark: 102,
  party: [],
  wagonLeader: '',
  // Hired trail guide (#11)
  hiredGuideId: null,
  guideRemainingLandmarks: 0,
  food: 0,
  ammunition: 0,
  spareParts: 0,
  medicine: 0,
  oxen: 0,
  clothing: 0,
  morale: 50,
  wagonCondition: 100,
  pace: 'steady',
  rations: 'filling',
  weather: 'fair',
  temperature: 70,
  phase: 'title',
  currentChapter: 1,
  currentEvent: null,
  message: null,
  totalMilesTraveled: 0,
  daysOnTrail: 0,
  animalsKilled: 0,
  riversCrossed: 0,
  // Mystery/RPG defaults
  investigation: DEFAULT_INVESTIGATION,
  previousPhase: null,
  // visual64: the best presentation IS the game — no longer a progression lock
  graphicsTier: 'ultra_64bit',
  gamesCompleted: 0,
  outlawsCaught: 0,
  // Gold Country Free-Roam defaults
  currentGoldCountryLocation: null,
  travelingToLocation: null,
  discoveredGoldLocations: ['bobr_cabin'],  // BOBR Cabin always visible
  goldCountryDay: 1,
  completedQuests: [],
  searchedAreas: [],
  inventory: [],
  // Scarcity cascades (#8)
  scarcityDays: {},
  firedDesperationEvents: [],
  recentEventIds: [],
  activeDesperationEvent: null,
  lastDesperationEventDay: 0,
  // Posse system (#6)
  partyBonuses: {},
  compositionBonusNames: [],
  // NPC Relationship system (#5)
  npcRelationships: {},
  // Seasonal market (trail-side)
  trailMarketEvent: null,
  trailMarketEventEndDay: 0,
  // Living Trail (presence-gated real-world chains)
  livingTrail: buildDefaultLivingTrailSlice(),
}

// Helper function for weather
export function getRandomWeather(distance: number): Weather {
  // Mountain passes: Rocky Mountains (800-1032) and Truckee Pass (1700-1800)
  const inMountains = (distance > 800 && distance < 1032) || (distance > 1700 && distance < 1800)
  // Desert region: Humboldt Sink through Forty Mile Desert (1380-1700)
  const inDesert = distance > 1380 && distance < 1700
  const rand = Math.random()

  if (inMountains) {
    if (rand < 0.3) return 'snow'
    if (rand < 0.5) return 'storm'
    if (rand < 0.7) return 'rain'
    return 'fair'
  }

  if (inDesert) {
    // Desert: almost always fair (hot), rare storm
    if (rand < 0.05) return 'storm'
    return 'fair'
  }

  if (rand < 0.1) return 'storm'
  if (rand < 0.3) return 'rain'
  return 'fair'
}
