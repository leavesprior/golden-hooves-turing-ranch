/**
 * Mark Twain Narrator Integration — Twain References & Special Events
 *
 * Extends the unreliable narrator system with a 'twain' mood: the narrator
 * channels Samuel Clemens' voice — dry wit, sardonic observation, tall tales,
 * and occasional genuine wonder at the natural world.
 *
 * Historical basis: Twain lived in Gold Country 1864-1865, staying at
 * Jackass Hill with Jim Gillis, hearing the Jumping Frog story at Angels Camp's
 * Ross's Saloon, and writing for the Territorial Enterprise in Virginia City.
 *
 * All Twain-style commentary is original but faithful to his voice and
 * references real works: Roughing It (1872), The Celebrated Jumping Frog of
 * Calaveras County (1865), and his Territorial Enterprise dispatches.
 */

import type { EncounterChoice, EncounterOutcome } from './goldCountryEncounters'
import type { TerrainType } from './travelObservations'

// ============================================================================
// TYPES
// ============================================================================

export interface TwainTallTale {
  id: string
  title: string
  setup: string
  punchline: string
  basedOn: string
  chance: number
}

export interface TwainMoodTransition {
  id: string
  trigger: string
  condition?: string
  toMood: 'twain' | string
  fromMood: string | 'any'
  narratorLine: string
  chance: number
}

export interface TwainObservation {
  text: string
  source: string
  mood: 'witty' | 'philosophical' | 'sardonic' | 'wonder'
}

export interface TwainSpecialEncounter {
  id: string
  title: string
  description: string
  type: string
  icon: string
  narratorIntro: string
  choices: EncounterChoice[]
  followUp?: {
    trigger: string
    narratorReveal: string
  }
  reference: string
}

// ============================================================================
// 1. TWAIN NARRATOR COMMENTARY
// ============================================================================

/**
 * Situation-keyed commentary the narrator delivers when in 'twain' mood.
 * Each situation has 4-6 lines. These replace or supplement the normal
 * Adams-style narrator commentary when the twain mood is active.
 */
export const TWAIN_NARRATOR_COMMENTARY: Record<string, string[]> = {
  travel_desert: [
    "This desert gives one the feeling of being shipwrecked on dry land — all the thirst and none of the adventure.",
    "The alkali dust has gotten into everything. My boots, my provisions, my opinions. Everything tastes of regret.",
    "I have been informed that this wasteland builds character. I had sufficient character before we arrived.",
    "Somewhere out there is water, the same way somewhere out there is justice — theoretically, and at great distance.",
    "The sun in this desert does not shine so much as it prosecutes. We are all found guilty.",
  ],

  travel_mountains: [
    "These mountains were put here by the Almighty to remind man that some obstacles cannot be talked around.",
    "The view from this pass is the sort of thing that makes a man religious for approximately fifteen minutes.",
    "We are climbing. The mules are philosophical about it. I am less so.",
    "A man who has crossed the Sierra on foot has earned the right to exaggerate about it for the rest of his natural life.",
    "The air up here is so thin it would embarrass a politician's promise.",
    "God made these mountains and then apparently lost interest, because He left no instructions for getting over them.",
  ],

  travel_river: [
    "The river is running high and full of opinions. It is not interested in ours.",
    "I have piloted steamboats on the Mississippi, and I can tell you this creek has more malice per cubic foot.",
    "The water is cold enough to reconsider every warm decision that brought us to this crossing.",
    "Rivers are nature's way of telling you that the straight path is never the easy one.",
    "A man stares into the current and sees his future rushing past, utterly indifferent to his plans.",
  ],

  travel_forest: [
    "The trees here are older than the Republic and considerably more dignified.",
    "These pines have been standing since before Columbus made his famous wrong turn. They have earned their silence.",
    "The forest closes in like a good story — slowly, then all at once, until you cannot see where you came from.",
    "A jay screams from a branch overhead. Jays are the newspaper editors of the bird world: loud, opinionated, and impossible to ignore.",
    "Sunlight falls through these trees in cathedral shafts. Even a heathen feels something stir.",
  ],

  travel_plains: [
    "The plains are proof that God can create a great deal of nothing and make it somehow impressive.",
    "We have been traveling the plains for what I am told is two days. I believe it has been a month, minimum.",
    "The grass waves in the wind like a congregation that has forgotten what it was praying for.",
    "A prairie is a landscape designed for thinking. Unfortunately, most of the thoughts are about how far away everything is.",
    "The horizon out here is not a destination. It is a dare.",
    "I am told there are wonders ahead. The plain itself seems skeptical.",
  ],

  town_arrival: [
    "Civilization! Or a reasonable facsimile thereof, built of green lumber and unreasonable expectations.",
    "We have arrived at a town. I use the word generously. It has a saloon, a general store, and aspirations.",
    "Every Gold Rush town believes it will be the next San Francisco. Most of them will be a footnote.",
    "The streets are mud, the buildings are raw, and the optimism is frankly staggering.",
    "A town in Gold Country is born full-grown and dies young. It is the mayfly of human settlement.",
  ],

  town_saloon: [
    "In the real world, the right word might be the wrong word. In a saloon, it is the only word that matters.",
    "A Gold Country saloon is the one truly democratic institution — it robs every man equally.",
    "The whiskey here was manufactured sometime this morning. It has the character of a recent argument.",
    "There are two kinds of truth: the kind you find at the bottom of a mine shaft, and the kind you find at the bottom of a glass. Neither holds up well in daylight.",
    "I have visited saloons in four territories and can report that they all smell the same: ambition, sawdust, and poor judgment.",
    "A man walks into a saloon a skeptic and walks out a philosopher. The transformation costs about three dollars.",
  ],

  mining_camp: [
    "A mining camp is organized madness. Every man is certain his hole is the one that will change everything.",
    "The silver fever — or gold fever, they are the same disease — turns reasonable men into the most extravagant brand of lunatic.",
    "Speculation is the art of convincing yourself that the hole you are standing in is different from all the other holes.",
    "I have watched men trade sound farms back East for the privilege of digging in someone else's dirt. They call this progress.",
    "Every miner I have met is three days away from a fortune. They have been three days away for two years.",
  ],

  trading: [
    "Commerce in Gold Country operates on the principle that a fool and his gold dust are soon parted, and the dust travels uphill to the merchant.",
    "The merchant smiles the way a cat smiles at a bird feeder — with professional interest.",
    "Prices out here follow their own peculiar logic: whatever you need most costs the most.",
    "I once watched a man trade an ounce of gold for a pair of boots. The boots lasted three weeks. The regret lasted considerably longer.",
  ],

  death_party_member: [
    "We have lost a companion. The trail collects its toll and does not make change.",
    "Death in Gold Country is common but never commonplace. Each loss diminishes the camp by one story that will never be told.",
    "The grave is shallow because the ground is hard and the living cannot linger. We mark it and move on, which is the saddest verb in the English language.",
    "I have no words that are adequate. Fortunately, the West does not require adequate words. It requires only that we continue.",
  ],

  gold_found: [
    "Gold! The word that emptied entire cities and filled entire graveyards.",
    "It glitters there in the pan like a promise from a politician — beautiful, compelling, and almost certainly less than advertised.",
    "A man finds gold and immediately begins calculating what he will buy with it. This is the precise moment the gold begins to own him.",
    "The genuine article. I have seen men weep at the sight of it. I confess it makes me somewhat philosophical.",
  ],

  rattlesnake: [
    "A rattlesnake. Nature's way of saying 'You were not invited, and the dress code is mortal peril.'",
    "The rattler has the courtesy to warn you before it strikes. This makes it more polite than most business partners in Sacramento.",
    "I have been told that rattlesnake tastes like chicken. I have also been told that mining is easy. I believe neither claim.",
    "The snake regards us with the calm superiority of a creature that was here first and intends to remain.",
  ],

  horse_purchase: [
    "Buying a horse in Gold Country is a transaction governed by hope, ignorance, and the seller's ability to keep a straight face.",
    "The horse stands there looking noble. This is suspicious. Noble horses do not end up for sale in mining towns.",
    "Trust a horse dealer the way you would trust a riverboat gambler: admire the performance, but count your money afterward.",
    "Every horse in California was the fastest in its county, the strongest on the trail, and the gentlest with children. Just ask the man selling it.",
  ],

  river_crossing: [
    "The river must be forded, ferried, or feared. All three options have merit.",
    "I have seen the Mississippi swallow steamboats whole. This creek thinks it can do the same. It has ambition, I will grant it that.",
    "The ferry operator wants what seems like a king's ransom. Given that the alternative is drowning, his pricing is, I reluctantly concede, fair.",
    "Water is the only element that can kill you three different ways in a single afternoon: drowning, fever, and the argument about whether to cross.",
    "We commit ourselves to the current and hope for the best. This is also how I approach most social situations.",
  ],

  idle: [
    "Nothing is happening. This is either the calm before the storm or just the calm. Both are equally unsettling.",
    "The party sits in contemplative silence, which in Gold Country means everyone is calculating their share.",
    "Idleness is the devil's workshop. Out here, the devil subcontracts to boredom, sunstroke, and questionable card games.",
    "A quiet moment on the trail. Enjoy it. Quiet moments out here have a short shelf life.",
    "That Missouri writer who will embellish this story later would want me to mention that nothing happened here. But nothing, done properly, can be very interesting indeed.",
  ],

  fourth_wall: [
    "That Missouri writer who will embellish this story later would want me to mention that the narrator is aware of being a narrator.",
    "The author of this tale — and I use the word 'author' with the same generosity I apply to 'whiskey' and 'road' — seems to be watching.",
    "If this were a book, the reader would be growing impatient. Since it is not a book, I suppose the player is growing impatient instead. Same difference.",
    "I am told there is a person controlling our fates from beyond the veil of this reality. I find this less troubling than the price of flour.",
    "Samuel Clemens would like it noted that any resemblance between this narrator and himself is entirely the fault of the game designer.",
    "Between you and me — and I am aware that 'you' is a complicated pronoun in this context — this is all somewhat absurd, is it not?",
  ],
}

// ============================================================================
// 2. TWAIN TALL TALES
// ============================================================================

/**
 * Tall tales the narrator tells when in 'twain' mood.
 * Each is based on a real Twain work or incident.
 */
export const TWAIN_TALL_TALES: TwainTallTale[] = [
  {
    id: 'genuine_mexican_plug',
    title: 'The Genuine Mexican Plug',
    setup: "I once purchased a horse in Carson City that was described, with perfect sincerity, as 'a genuine Mexican plug — the pride of the territory.' The price was suspiciously reasonable.",
    punchline: "The horse threw me seventeen times in the first hour, attempted to climb a telegraph pole, and was last seen heading east at a gallop with my saddle, my dignity, and my hat.",
    basedOn: 'Roughing It, Chapter 24',
    chance: 0.7,
  },
  {
    id: 'jumping_frog',
    title: 'The Celebrated Jumping Frog',
    setup: "In Angels Camp there lived a man named Jim Smiley who would bet on anything — which side a straddle-bug would go, which bird on a fence would fly first, and most famously, how far his frog Dan'l Webster could jump.",
    punchline: "A stranger filled Dan'l Webster full of quail shot when Smiley wasn't looking, and that frog couldn't jump any more than a church — which is how I learned that cheating, like gold, is an old California tradition.",
    basedOn: 'The Celebrated Jumping Frog of Calaveras County (1865)',
    chance: 0.8,
  },
  {
    id: 'petrified_man',
    title: 'The Petrified Man of Gravelly Ford',
    setup: "The Territorial Enterprise ran my report about a petrified man found near Gravelly Ford — perfectly preserved, one eye shut in a perpetual wink, his thumb resting against his nose with his fingers spread wide.",
    punchline: "Every newspaper from Sacramento to New York reprinted it in full seriousness, and not a single editor realized I had described a stone man thumbing his nose at the world — which tells you everything about editors.",
    basedOn: 'The Petrified Man hoax, Territorial Enterprise (1862)',
    chance: 0.6,
  },
  {
    id: 'stagecoach_ride',
    title: 'The Overland Stage',
    setup: "The Overland stagecoach promised to deliver passengers from Missouri to Nevada in comfort and style. The comfort consisted of being packed like sardines into a wooden box on wheels, and the style was provided by the dust.",
    punchline: "By day three I had been thrown from my seat so many times that the other passengers used me as a cushion, and the driver remarked that I was the most well-traveled piece of luggage he had ever carried.",
    basedOn: 'Roughing It, Chapters 2-20',
    chance: 0.65,
  },
  {
    id: 'lost_mining_claim',
    title: 'The Blind Lead',
    setup: "My partner Cal Higbie and I once discovered a blind lead — an underground vein of silver worth millions — in the Wide West mine at Aurora. All we had to do was occupy the claim for ten days to secure it legally.",
    punchline: "Cal left a note I never read, I left a note he never read, and we both wandered off on separate errands — losing a fortune because neither of us could be bothered to sit still, which I maintain is the most honest mining story ever told.",
    basedOn: 'Roughing It, Chapters 40-41',
    chance: 0.55,
  },
  {
    id: 'carson_city_weather',
    title: 'The Washoe Zephyr',
    setup: "Carson City enjoys what the locals call a 'Washoe Zephyr,' which is their way of making a catastrophic windstorm sound friendly. The zephyr arrives every afternoon with the punctuality of a tax collector.",
    punchline: "I once saw the wind lift a man's hat off his head, carry it across town, deposit it on a different man's head, and neither gentleman seemed particularly surprised — which tells you everything about Carson City's relationship with personal property.",
    basedOn: 'Roughing It, Chapter 21',
    chance: 0.7,
  },
  {
    id: 'lake_tahoe_fire',
    title: 'The Lake Tahoe Conflagration',
    setup: "My companion and I claimed a timber ranch on the shores of Lake Tahoe — the fairest picture the whole earth affords, a lake so clear you could count the scales on a trout at eighty feet.",
    punchline: "We accidentally set the entire mountainside on fire while cooking supper, watched our claim burn to cinders from a rowboat in the middle of the lake, and decided that perhaps the lumber business was not our calling.",
    basedOn: 'Roughing It, Chapter 23',
    chance: 0.75,
  },
  {
    id: 'territorial_enterprise',
    title: 'The Territorial Enterprise',
    setup: "I was hired as a reporter for the Territorial Enterprise of Virginia City on the strength of my letters from Aurora. My editor, Joe Goodman, told me to report the facts — but if the facts were dull, to improve upon them.",
    punchline: "I improved upon the facts so thoroughly that three men challenged me to duels, the governor threatened to have me arrested, and I was eventually encouraged to relocate to San Francisco for reasons of continued breathing — which is how journalism made me a Californian.",
    basedOn: 'Roughing It, Chapters 42-55; Territorial Enterprise (1862-1864)',
    chance: 0.6,
  },
]

// ============================================================================
// 3. TWAIN MOOD TRANSITIONS
// ============================================================================

/**
 * Conditions that trigger the narrator to enter or exit the 'twain' mood.
 * The system checks these against game events and state.
 */
export const TWAIN_MOOD_TRANSITIONS: TwainMoodTransition[] = [
  {
    id: 'enter_angels_camp',
    trigger: 'location_enter',
    condition: 'location_id === "angels_camp"',
    toMood: 'twain',
    fromMood: 'any',
    narratorLine: "Angels Camp. The narrator clears his throat, adjusts his white suit, and — is that a Missouri accent? The narrator appears to have become someone else entirely.",
    chance: 0.85,
  },
  {
    id: 'find_a_frog',
    trigger: 'item_acquired',
    condition: 'item_id === "jumping_frog" || item_id === "frog"',
    toMood: 'twain',
    fromMood: 'any',
    narratorLine: "A frog. The narrator's eyes light up with the particular gleam of a man who has a story about frogs and has been waiting his entire life to tell it again.",
    chance: 0.9,
  },
  {
    id: 'saloon_regular',
    trigger: 'consecutive_visit',
    condition: 'location_type === "saloon" && visit_count >= 3',
    toMood: 'twain',
    fromMood: 'any',
    narratorLine: "Three saloons in a row. The narrator pours himself a whiskey, leans back, and adopts the drawl of a man who has spent considerable time in similar establishments. 'Now, let me tell you about the time...'",
    chance: 0.7,
  },
  {
    id: 'narrator_drunk_twain',
    trigger: 'narrator_state',
    condition: 'intoxication >= 4',
    toMood: 'twain',
    fromMood: 'drinking',
    narratorLine: "The narrator has passed through mere drunkenness into that elevated state where every observation becomes profound and every sentence acquires a drawl. Mark Twain would recognize the symptoms.",
    chance: 0.6,
  },
  {
    id: 'idle_storytelling',
    trigger: 'idle_threshold',
    condition: 'idle_actions >= 10',
    toMood: 'twain',
    fromMood: 'bored',
    narratorLine: "Nothing has happened for some time. The narrator, desperate for entertainment, reaches for a battered copy of Roughing It and begins reading aloud. The voice changes. The drawl settles in.",
    chance: 0.5,
  },
  {
    id: 'book_reader',
    trigger: 'item_used',
    condition: 'item_type === "book"',
    toMood: 'twain',
    fromMood: 'any',
    narratorLine: "A book! The narrator pauses, peers at the title, and a slow smile spreads. 'A person who won't read has no advantage over one who can't read.' The voice has changed. It sounds like Missouri.",
    chance: 0.65,
  },
  {
    id: 'near_calaveras',
    trigger: 'location_proximity',
    condition: 'near_location === "calaveras_county" || near_location === "jackass_hill"',
    toMood: 'twain',
    fromMood: 'any',
    narratorLine: "Calaveras County. The narrator straightens up, as if the very geography demands a better class of storytelling. The prose becomes drier. The wit, sharper. Something has awakened.",
    chance: 0.75,
  },
]

// ============================================================================
// 4. GENUINE MEXICAN PLUG EVENT
// ============================================================================

/**
 * Special encounter: a terrible horse sold as a bargain.
 * Direct reference to Roughing It, Chapter 24, where Twain buys
 * the infamous "Genuine Mexican Plug" in Carson City.
 */
export const GENUINE_MEXICAN_PLUG_EVENT: TwainSpecialEncounter = {
  id: 'genuine_mexican_plug_encounter',
  title: 'A Genuine Mexican Plug',
  description: 'A leathery horse trader stands beside a rail-thin mustang with wild eyes and a suspicious calm. "Genuine Mexican Plug," he announces. "Finest animal in the territory. Previous owner was a United States Senator. Five dollars and she\'s yours."',
  type: 'opportunity',
  icon: '\ud83d\udc0e',
  narratorIntro: "The narrator — who has suddenly developed a Missouri drawl — insists this is an extraordinary opportunity. The horse stands perfectly still, which the narrator interprets as poise and breeding. The narrator is, it should be noted, not a reliable judge of horses.",
  choices: [
    {
      id: 'buy_plug',
      text: 'Buy the Genuine Mexican Plug (5 gold)',
      outcome: {
        message: "You hand over the gold. The horse trader pockets it with the practiced speed of a man who has done this before. The horse regards you with what might be affection or might be contempt. At this price, both are included.",
        goldDelta: -5,
        karmaDelta: 5,
        itemGained: 'genuine_mexican_plug',
      },
    },
    {
      id: 'inspect_plug',
      text: 'Inspect the horse carefully first',
      outcome: {
        message: "You walk around the horse. Its legs are thin, its ribs are visible, and one ear points in a direction that ears should not point. The horse trader assures you these are signs of 'character.' The narrator agrees enthusiastically, which is itself a warning sign.",
        karmaDelta: 2,
      },
      statCheck: { stat: 'shrewdness', difficulty: 8 },
    },
    {
      id: 'decline_plug',
      text: 'Walk away from this deal',
      outcome: {
        message: "You decline. The horse trader shrugs. The narrator seems genuinely disappointed. 'You will regret this,' the narrator says, in a tone that suggests the narrator will make sure of it.",
        karmaDelta: 0,
      },
    },
    {
      id: 'haggle_plug',
      text: 'Offer 3 gold instead',
      outcome: {
        message: "The horse trader considers your offer for approximately one-tenth of a second. 'Sold!' he says, fast enough that you immediately wonder what you've done. The narrator assures you this was a master stroke of negotiation.",
        goldDelta: -3,
        karmaDelta: 3,
        itemGained: 'genuine_mexican_plug',
      },
      statCheck: { stat: 'diplomacy', difficulty: 4 },
    },
  ],
  followUp: {
    trigger: 'travel_segments >= 3 && has_item("genuine_mexican_plug")',
    narratorReveal: "The narrator owes you an apology. The Genuine Mexican Plug has now thrown you twice, eaten your hat, bitten the mule, and attempted to join a herd of wild horses three separate times. Its speed is remarkable — but only in directions you did not intend to travel. The narrator confesses that this horse is, in the most technical sense, the worst horse. The narrator also confesses that this is extremely funny.",
  },
  reference: 'Roughing It, Chapter 24',
}

/**
 * Stats for the Genuine Mexican Plug, if the game tracks horse stats.
 */
export const GENUINE_MEXICAN_PLUG_STATS = {
  name: 'Genuine Mexican Plug',
  speed: 1,
  stamina: 1,
  temperament: 'ornery' as const,
  description: "A rail-thin mustang with one ear that points sideways, a malevolent gleam in its eye, and a talent for bucking that borders on the artistic. It was described as the finest horse in the territory by a man who left town immediately after selling it.",
  specialTraits: [
    'Throws rider at unpredictable intervals',
    'Eats hats, gloves, and important documents',
    'Maximum speed achieved only when fleeing from owner',
    'Refuses to cross water, climb hills, or stand still',
  ],
  hiddenBenefit: 'Narrator affection +3 (the narrator loves this horse)',
}

// ============================================================================
// 5. JUMPING FROG EVENT
// ============================================================================

/**
 * Special encounter for the Angels Camp area.
 * Based on "The Celebrated Jumping Frog of Calaveras County" (1865).
 */
export const JUMPING_FROG_EVENT: TwainSpecialEncounter = {
  id: 'jumping_frog_contest',
  title: "The Celebrated Jumping Frog Contest",
  description: "A crowd has gathered behind Ross's Saloon in Angels Camp. A man in a stained vest stands on a barrel: \"Annual Calaveras County Frog-Jumping Jubilee! Entry fee: ten gold! Prize: forty gold and the admiration of the territory! Who's got a frog that can jump?\"",
  type: 'opportunity',
  icon: '\ud83d\udc38',
  narratorIntro: "The narrator perks up considerably. This is, for reasons the narrator declines to explain, a subject very close to the narrator's heart. The narrator has opinions about frogs. Many opinions. The narrator would like you to enter this contest.",
  choices: [
    {
      id: 'enter_contest',
      text: 'Enter the frog-jumping contest (10 gold, Luck DC 12)',
      outcome: {
        message: "Your frog crouches at the starting line. The crowd holds its breath. You give the frog a nudge. It launches itself forward in a magnificent arc — three feet, four feet, four and a half — and the crowd erupts! Your frog is the champion of Calaveras County! The narrator is beside himself with delight.",
        goldDelta: 30,
        karmaDelta: 40,
        reputationDelta: 10,
        itemGained: 'frog_jumping_trophy',
      },
      statCheck: { stat: 'luck', difficulty: 12 },
    },
    {
      id: 'bet_on_other',
      text: 'Bet 15 gold on another man\'s frog (Luck DC 8)',
      outcome: {
        message: "You place your money on a spotted frog named General Jackson. The frog jumps like it has a personal grudge against the ground. You collect your winnings. The narrator nods approvingly — sometimes the wisest gamble is betting on someone else's frog.",
        goldDelta: 15,
        karmaDelta: 10,
      },
      statCheck: { stat: 'luck', difficulty: 8 },
    },
    {
      id: 'walk_away_frog',
      text: 'Walk away from the contest',
      outcome: {
        message: "You turn to leave. The narrator is crestfallen. 'You are walking away from history,' the narrator says. 'Literal, actual, frog-related history.' The narrator will remember this.",
        karmaDelta: 0,
        reputationDelta: -2,
      },
    },
    {
      id: 'catch_own_frog',
      text: 'Catch a frog from the creek and enter it',
      outcome: {
        message: "You wade into the creek and emerge with a fine bullfrog — green, muscular, and apparently confident. 'That,' the narrator says with genuine admiration, 'is a frog with potential.' Entry fee waived on account of sporting spirit.",
        goldDelta: 0,
        karmaDelta: 20,
        itemGained: 'contest_frog',
        reputationDelta: 5,
      },
      statCheck: { stat: 'athleticism', difficulty: 6 },
    },
  ],
  followUp: {
    trigger: 'lost_frog_contest && narrator_mood === "twain"',
    narratorReveal: "The narrator settles in for what is clearly going to be a lengthy consolation. 'Let me tell you,' the narrator begins, 'about a man named Jim Smiley, who lived in this very camp, and who had a frog named Dan'l Webster...' The story takes forty-five minutes. It is not clear whether this is a consolation or a punishment.",
  },
  reference: 'The Celebrated Jumping Frog of Calaveras County (1865)',
}

/**
 * Secret mechanic: if the player has accumulated bad karma > 20,
 * a stranger sabotages their frog with quail shot — a direct
 * reference to the original story.
 */
export const JUMPING_FROG_QUAIL_SHOT_SECRET = {
  condition: 'bad_karma > 20',
  triggerText: "A stranger sidles up to your frog while you're not looking. He seems to be feeding it something. 'Just a snack,' he says, smiling too wide.",
  effectText: "Your frog sits at the starting line like a church. It does not jump. It cannot jump. Someone — the narrator suspects the smiling stranger — has filled your frog with quail shot. The narrator finds this deeply, personally hilarious and will not explain why.",
  narratorReaction: "The narrator is laughing so hard the narration temporarily ceases. When it resumes: 'History,' the narrator wheezes, 'has a sense of humor.'",
  karmaCheck: 20,
  outcome: {
    message: "Your frog does not jump. The crowd jeers. The stranger has vanished. The narrator is still laughing.",
    goldDelta: -10,
    karmaDelta: -5,
    reputationDelta: -5,
  } as EncounterOutcome,
}

// ============================================================================
// 6. TWAIN TERRAIN OBSERVATIONS
// ============================================================================

/**
 * Terrain-specific observations in Twain's voice.
 * These are distinct from the Adams-style observations in travelObservations.ts.
 * 5 per terrain type = 25 total.
 */
export const TWAIN_TERRAIN_OBSERVATIONS: Record<TerrainType, TwainObservation[]> = {
  plains: [
    {
      text: "The prairie is a page that God wrote on and then, apparently, erased.",
      source: 'Roughing It',
      mood: 'philosophical',
    },
    {
      text: "We crossed an alkali flat so white and featureless that even the jackrabbits looked lost.",
      source: 'Roughing It',
      mood: 'sardonic',
    },
    {
      text: "The sagebrush is not beautiful. It is the horticultural equivalent of a pessimist: gray, low, and everywhere.",
      source: 'Roughing It',
      mood: 'witty',
    },
    {
      text: "There is something about the open plains that makes a man feel simultaneously free and completely exposed, like a sermon that has gone on too long.",
      source: 'Life on the Mississippi',
      mood: 'philosophical',
    },
    {
      text: "Dawn on the prairie arrived the way all important things arrive out here — slowly, grandly, and with considerably more beauty than the day that followed deserved.",
      source: 'Roughing It',
      mood: 'wonder',
    },
  ],

  forest: [
    {
      text: "The Big Trees deserve their name. Standing among them, a man feels the appropriate insignificance that churches aspire to but rarely achieve.",
      source: 'Roughing It',
      mood: 'wonder',
    },
    {
      text: "A squirrel lectured us from a pine branch for ten minutes. I took no notes, but the gist was that we were trespassing.",
      source: 'A Tramp Abroad',
      mood: 'witty',
    },
    {
      text: "The forest floor is carpeted in needles that have been falling since before the printing press. Nobody has swept.",
      source: 'Roughing It',
      mood: 'sardonic',
    },
    {
      text: "These trees were seedlings when Rome fell. They have outlasted every empire and show no signs of stopping. There is a lesson here, but it is not a comfortable one.",
      source: 'Roughing It',
      mood: 'philosophical',
    },
    {
      text: "Sunlight through the redwoods is the color of stained glass and twice as holy. Even the mules went quiet.",
      source: 'Roughing It',
      mood: 'wonder',
    },
  ],

  mountains: [
    {
      text: "The Sierra Nevada is the Almighty's rough draft of the world — magnificent, unfinished, and utterly hostile to travel.",
      source: 'Roughing It',
      mood: 'sardonic',
    },
    {
      text: "From this elevation I can see two territories, three weather systems, and the full scope of my poor judgment in coming here.",
      source: 'Roughing It',
      mood: 'witty',
    },
    {
      text: "The mountain does not care that you are tired. The mountain does not care that you are brave. The mountain is the most honest thing in California.",
      source: 'Roughing It',
      mood: 'philosophical',
    },
    {
      text: "Lake Tahoe appeared below us as suddenly as a thought — blue beyond the capacity of that word, clear beyond the capacity of belief. I have never seen its equal.",
      source: 'Roughing It, Chapter 22',
      mood: 'wonder',
    },
    {
      text: "The switchback trail was designed by someone who believed that the shortest distance between two points is a corkscrew.",
      source: 'Roughing It',
      mood: 'witty',
    },
  ],

  desert: [
    {
      text: "The alkali desert is nature's practical joke on the concept of hospitality. Everything here is designed to repel visitors.",
      source: 'Roughing It',
      mood: 'sardonic',
    },
    {
      text: "I have heard it said that the desert teaches a man what is essential. It taught me that what is essential is not being in a desert.",
      source: 'Roughing It',
      mood: 'witty',
    },
    {
      text: "The mirage shimmered ahead like a promise of water, trees, and civilization. The desert makes liars of light itself.",
      source: 'Roughing It',
      mood: 'philosophical',
    },
    {
      text: "Sunset over the desert was the most astonishing thing I have ever witnessed that I could not drink, sell, or write home about with any expectation of being believed.",
      source: 'Roughing It',
      mood: 'wonder',
    },
    {
      text: "A coyote crossed our path at a leisurely trot. He looked better fed and more purposeful than any member of our party. This was humbling.",
      source: 'Roughing It, Chapter 5',
      mood: 'sardonic',
    },
  ],

  river: [
    {
      text: "A river is the only road that moves. I have spent my life on them and they have never once taken me where I expected.",
      source: 'Life on the Mississippi',
      mood: 'philosophical',
    },
    {
      text: "The current has the smooth and friendly look of something that could kill you without meaning to, which is the most dangerous kind of thing.",
      source: 'Life on the Mississippi',
      mood: 'sardonic',
    },
    {
      text: "Water finds the lowest path, which is also the wisest path, which is why rivers are smarter than pioneers.",
      source: 'Life on the Mississippi',
      mood: 'witty',
    },
    {
      text: "The river at twilight was liquid bronze, moving with a purpose that put our own vague ambitions to shame.",
      source: 'Life on the Mississippi',
      mood: 'wonder',
    },
    {
      text: "I have piloted boats on water that was deeper, wider, and more famous than this creek. But this creek has a wildness the Mississippi lost to commerce long ago.",
      source: 'Roughing It',
      mood: 'philosophical',
    },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random Twain commentary line for a given situation.
 */
export function getTwainCommentary(situation: string): string | null {
  const lines = TWAIN_NARRATOR_COMMENTARY[situation]
  if (!lines || lines.length === 0) return null
  return lines[Math.floor(Math.random() * lines.length)]
}

/**
 * Get a random tall tale, respecting the chance threshold.
 */
export function getRandomTallTale(): TwainTallTale | null {
  const eligible = TWAIN_TALL_TALES.filter(t => Math.random() < t.chance)
  if (eligible.length === 0) return null
  return eligible[Math.floor(Math.random() * eligible.length)]
}

/**
 * Get a terrain observation in Twain's voice.
 */
export function getTwainTerrainObservation(terrain: TerrainType): TwainObservation | null {
  const observations = TWAIN_TERRAIN_OBSERVATIONS[terrain]
  if (!observations || observations.length === 0) return null
  return observations[Math.floor(Math.random() * observations.length)]
}

/**
 * Check if any mood transition should fire, given current game state.
 * Returns the first matching transition, or null.
 */
export function checkTwainMoodTransition(
  currentMood: string,
  context: {
    locationId?: string
    nearLocation?: string
    itemAcquired?: string
    itemUsedType?: string
    saloonVisits?: number
    intoxication?: number
    idleActions?: number
  }
): TwainMoodTransition | null {
  for (const transition of TWAIN_MOOD_TRANSITIONS) {
    // Check fromMood
    if (transition.fromMood !== 'any' && transition.fromMood !== currentMood) continue

    // Check chance
    if (Math.random() > transition.chance) continue

    // Check trigger-specific conditions
    switch (transition.trigger) {
      case 'location_enter':
        if (context.locationId === 'angels_camp') return transition
        break
      case 'item_acquired':
        if (context.itemAcquired === 'jumping_frog' || context.itemAcquired === 'frog') return transition
        break
      case 'consecutive_visit':
        if ((context.saloonVisits ?? 0) >= 3) return transition
        break
      case 'narrator_state':
        if ((context.intoxication ?? 0) >= 4) return transition
        break
      case 'idle_threshold':
        if ((context.idleActions ?? 0) >= 10) return transition
        break
      case 'item_used':
        if (context.itemUsedType === 'book') return transition
        break
      case 'location_proximity':
        if (context.nearLocation === 'calaveras_county' || context.nearLocation === 'jackass_hill') return transition
        break
    }
  }

  return null
}

/**
 * Check if the quail shot secret should trigger during the frog contest.
 */
export function shouldTriggerQuailShot(badKarma: number): boolean {
  return badKarma > JUMPING_FROG_QUAIL_SHOT_SECRET.karmaCheck
}
