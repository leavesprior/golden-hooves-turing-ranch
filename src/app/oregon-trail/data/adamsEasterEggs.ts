/**
 * Douglas Adams & Monty Python Easter Eggs
 *
 * Douglas Adams wrote for Monty Python (1974-1978) and Doctor Who (1978-1980).
 * These connections create a rich web of easter eggs for knowledgeable players.
 *
 * Keywords trigger extended conversations with NPCs, especially Whiskey Pete.
 * River crossings may trigger the Bridge Keeper encounter.
 */

// ============================================
// DOUGLAS ADAMS KNOWLEDGE BASE
// ============================================

export interface AdamsReference {
  id: string
  source: 'hitchhiker' | 'dirk_gently' | 'doctor_who' | 'infocom' | 'last_chance' | 'salmon_doubt' | 'monty_python'
  keywords: string[]  // Words that trigger this reference
  responses: string[]  // Possible responses
  followUps?: string[]  // What Whiskey Pete might say next
  unlocks?: string  // What this might unlock in the game
  karmaEffect?: { good: number; neutral: number }
}

export const ADAMS_REFERENCES: AdamsReference[] = [
  // === HITCHHIKER'S GUIDE ===
  {
    id: 'towel',
    source: 'hitchhiker',
    keywords: ['towel', 'froody', 'frood', 'hoopy'],
    responses: [
      "*eyes light up* A towel! Now here's a hoopy frood who really knows where their towel is.",
      "You carry a towel? *nods approvingly* More people should. A towel has immense psychological value.",
      "*leans in* The Hitchhiker's Guide has a few things to say about towels...",
    ],
    followUps: [
      "A towel is about the most massively useful thing an interstellar hitchhiker can have.",
      "Any man who can hitch the length and breadth of the galaxy and still know where his towel is, is clearly a man to be reckoned with.",
      "Don't forget to bring a towel. Words to live by, friend.",
    ],
    unlocks: 'towel_discount',
    karmaEffect: { good: 5, neutral: 0 }
  },
  {
    id: 'forty_two',
    source: 'hitchhiker',
    keywords: ['42', 'forty-two', 'forty two', 'answer', 'ultimate question', 'meaning of life'],
    responses: [
      "*pauses polishing glass* Forty-two, you say? Interesting. Very interesting.",
      "The answer is forty-two. The question, however... that's the tricky part.",
      "*long stare* You know about the Answer. But do you know the Question?",
    ],
    followUps: [
      "I once spent seven and a half million years contemplating that answer.",
      "The problem was, they didn't know what the Question was.",
      "Deep Thought computed for millennia. Turns out the Question and Answer can't both be known in the same universe.",
    ],
    karmaEffect: { good: 10, neutral: 0 }
  },
  {
    id: 'pan_galactic',
    source: 'hitchhiker',
    keywords: ['pan galactic', 'gargle blaster', 'pangalactic', 'gargle'],
    responses: [
      "*grins* A Pan Galactic Gargle Blaster? Well now, you've got sophisticated tastes.",
      "Pan Galactic Gargle Blaster... the effect is like having your brains smashed out by a slice of lemon wrapped round a large gold brick.",
      "*reaches under counter* I don't serve that officially... but for someone who knows to ask...",
    ],
    followUps: [
      "The Hitchhiker's Guide describes it as the best drink in existence.",
      "Drinking more than two is inadvisable. Drinking more than three is seldom survived.",
      "*slides drink across* This is the closest approximation possible on Earth. Don't say I didn't warn you.",
    ],
    unlocks: 'special_drink',
    karmaEffect: { good: 0, neutral: -10 }
  },
  {
    id: 'dont_panic',
    source: 'hitchhiker',
    keywords: ['don\'t panic', 'dont panic', 'panic'],
    responses: [
      "*nods sagely* Don't Panic. The most useful advice in the entire Guide.",
      "Large friendly letters. DON'T PANIC. If only more people heeded those words.",
      "*taps sign behind bar that reads 'Don't Panic'* Words to live by, friend.",
    ],
    followUps: [
      "Panic, I've found, is rarely the appropriate response. Mild concern, perhaps.",
      "The Guide has 'Don't Panic' inscribed in large, friendly letters on its cover.",
      "In my experience, the universe finds panic rather boring.",
    ],
  },
  {
    id: 'babel_fish',
    source: 'hitchhiker',
    keywords: ['babel fish', 'babel', 'translator', 'understand'],
    responses: [
      "*tilts head* A Babel fish? Small, yellow, leech-like? You've been places.",
      "The Babel fish is small, yellow, and leech-like, and probably the oddest thing in the Universe.",
      "*whispers* I've heard there's something that helps you understand any language...",
    ],
    followUps: [
      "By effectively removing all barriers to communication, it caused more and bloodier wars than anything else in the history of creation.",
      "The poor Babel fish, by effectively removing all barriers to communication, has caused more and bloodier wars than anything else.",
    ],
  },
  {
    id: 'marvin',
    source: 'hitchhiker',
    keywords: ['marvin', 'paranoid android', 'depressed', 'brain the size'],
    responses: [
      "*sighs deeply* Brain the size of a planet, and here I am, polishing glasses.",
      "You know Marvin? *sigh* I have that same look in my eyes, don't I.",
      "*stares at glass* Life. Don't talk to me about life.",
    ],
    followUps: [
      "Here I am, brain the size of a planet, and they tell me to polish glasses. Call that job satisfaction? I don't.",
      "I think you ought to know I'm feeling very depressed.",
      "The first ten million years were the worst. And the second ten million years, they were the worst too. The third ten million years I didn't enjoy at all.",
    ],
  },
  {
    id: 'zaphod',
    source: 'hitchhiker',
    keywords: ['zaphod', 'beeblebrox', 'two heads', 'president'],
    responses: [
      "*laughs* Zaphod Beeblebrox! Now there's a hoopy frood.",
      "The President of the Galaxy? That job's not about wielding power. It's about distracting attention from power.",
      "*grins* Two heads, three arms, and the ego to match.",
    ],
    followUps: [
      "If there's anything more important than my ego around, I want it caught and shot now.",
      "He's just this guy, you know?",
      "The man who invented the Pan Galactic Gargle Blaster. A true genius.",
    ],
  },
  {
    id: 'ford_prefect',
    source: 'hitchhiker',
    keywords: ['ford prefect', 'betelgeuse', 'researcher'],
    responses: [
      "Ford Prefect? *pauses* Curious name for a human. Unless...",
      "*knowing look* Betelgeuse, you say? I've heard of researchers from there.",
      "A researcher for the Guide? Must be fascinating work, updating entries.",
    ],
    followUps: [
      "He thought the dominant life form on Earth was cars.",
      "Fifteen years researching Earth, and they cut his entry to 'Mostly Harmless.'",
      "If you're a friend of Ford's, the first drink is on the house. He owes me for several thousand.",
    ],
  },

  // === DIRK GENTLY ===
  {
    id: 'holistic',
    source: 'dirk_gently',
    keywords: ['holistic', 'interconnected', 'fundamental interconnectedness', 'quantum'],
    responses: [
      "*leans forward* The fundamental interconnectedness of all things? You've been reading detective stories.",
      "Holistic detection. *nods* Everything connects to everything else.",
      "*mysterious smile* I believe the term is 'holistic investigation.'",
    ],
    followUps: [
      "If you look at the whole problem, not just the immediate mystery, the answer reveals itself.",
      "The Universe is a single, unified field. What happens in one place affects everything.",
      "Dirk Gently understood this. Most private detectives just look for clues.",
    ],
  },
  {
    id: 'electric_monk',
    source: 'dirk_gently',
    keywords: ['electric monk', 'belief', 'believes'],
    responses: [
      "*chuckles* An Electric Monk? A labor-saving device, for believing things you don't have time to believe yourself.",
      "I've heard of monks that believe things for you. Useful in these complicated times.",
      "*thoughtfully* Some beliefs are too absurd to hold yourself. That's what the monk is for.",
    ],
    followUps: [
      "It believed things they'd have difficulty believing themselves.",
      "By the time it was malfunctioning, it believed in over three thousand impossible things before breakfast.",
    ],
  },

  // === MONTY PYTHON ===
  {
    id: 'spanish_inquisition',
    source: 'monty_python',
    keywords: ['spanish inquisition', 'expect', 'nobody expects', 'inquisition'],
    responses: [
      "*dramatic pause* NOBODY expects the Spanish Inquisition!",
      "*spins around* Our chief weapon is surprise! Surprise and fear!",
      "*sigh* I didn't expect the Spanish Inquisition. Nobody ever does.",
    ],
    followUps: [
      "Our chief weapons are fear, surprise, ruthless efficiency, and an almost fanatical devotion to the Pope.",
      "And nice red uniforms. I forgot the nice red uniforms.",
    ],
  },
  {
    id: 'parrot',
    source: 'monty_python',
    keywords: ['dead parrot', 'parrot', 'norwegian blue', 'pining', 'fjords'],
    responses: [
      "*looks at bird perched on shelf* That parrot? It's not dead. It's resting.",
      "Norwegian Blue, beautiful plumage! *pokes bird* ...pining for the fjords.",
      "*sighs* It's not pining, it's passed on. It has ceased to be.",
    ],
    followUps: [
      "This is an ex-parrot!",
      "It's shuffled off this mortal coil, run down the curtain and joined the choir invisible!",
      "If you hadn't nailed it to the perch it would be pushing up the daisies!",
    ],
  },
  {
    id: 'holy_grail',
    source: 'monty_python',
    keywords: ['holy grail', 'grail', 'quest', 'camelot'],
    responses: [
      "*stares into distance* The Holy Grail? 'Tis a silly place, Camelot.",
      "On second thought, let's not go to Camelot. 'Tis a silly place.",
      "*thoughtfully* I once heard of knights who sought the Grail...",
    ],
    followUps: [
      "We are the Knights who say... well, I shouldn't say.",
      "Some call me... Tim?",
      "First, thou shalt count to three. No more, no less.",
    ],
  },
  {
    id: 'shrubbery',
    source: 'monty_python',
    keywords: ['shrubbery', 'ni', 'knights who say'],
    responses: [
      "*clears throat* Ni! ...I mean, pardon me. Old habit.",
      "You want a... shrubbery? *looks confused* We're fresh out.",
      "*whispers* We are the knights who say... actually, we don't say that anymore.",
    ],
    followUps: [
      "We now say 'Ekke Ekke Ekke Ekke Ptang Zoo Boing!'",
      "We want... a shrubbery!",
      "Then you must cut down the mightiest tree in the forest... with a herring!",
    ],
  },
]

// ============================================
// BRIDGE KEEPER (RIVER CROSSING ENCOUNTER)
// ============================================

export interface BridgeQuestion {
  question: string
  correctAnswer: string | string[]  // Multiple valid answers
  wrongAnswerEffect: string
  isSwallowQuestion?: boolean  // The trick question
}

export const BRIDGE_KEEPER_INTRO = [
  "Stop! Who would cross the Bridge of Death must answer me these questions three, ere the other side he see.",
  "*old man appears from mist* Answer my questions three and you may cross.",
  "What... is your name? What... is your quest? What... is your favorite color?",
]

export const BRIDGE_QUESTIONS: BridgeQuestion[] = [
  // Easy questions
  {
    question: "What... is your name?",
    correctAnswer: ["any", "*player_name*"],
    wrongAnswerEffect: "none"
  },
  {
    question: "What... is your quest?",
    correctAnswer: ["gold", "gold country", "seek gold", "find gold", "track", "catch", "outlaw", "black bart", "pinkerton"],
    wrongAnswerEffect: "none"
  },
  {
    question: "What... is your favorite color?",
    correctAnswer: ["any"],
    wrongAnswerEffect: "none"
  },
  // The trick questions
  {
    question: "What... is the capital of Assyria?",
    correctAnswer: ["nineveh", "assur", "ashur", "calah", "dur-sharrukin"],
    wrongAnswerEffect: "The Bridge Keeper stares. 'Wrong!' The bridge wobbles dangerously.",
    isSwallowQuestion: false
  },
  {
    question: "What... is the airspeed velocity of an unladen swallow?",
    correctAnswer: [
      "african or european",
      "what do you mean",
      "an african or european swallow",
      "european or african",
      "11 meters per second",
      "24 miles per hour"
    ],
    wrongAnswerEffect: "The Bridge Keeper cackles. Only the wise know to question the question.",
    isSwallowQuestion: true
  },
]

export const BRIDGE_KEEPER_SUCCESS = [
  "Right. Off you go. *waves dismissively*",
  "*nods sagely* You may pass.",
  "Very well. Cross, if you dare.",
]

export const BRIDGE_KEEPER_SWALLOW_REVERSAL = [
  "*Bridge Keeper pauses* What? I... I don't know that! *is flung into river*",
  "*looks confused* African or European? I... AAAAUUUGGGHHH! *disappears*",
  "Wait, what do YOU mean? *splashes into water*",
]

// ============================================
// BLACK KNIGHT ENCOUNTER
// ============================================

export const BLACK_KNIGHT_DIALOGUE = {
  initial: [
    "*A dark figure blocks the path* None shall pass.",
    "'Tis I, the Black Knight. NONE shall pass!",
    "I move... for no man.",
  ],
  challenge: [
    "Then you shall die.",
    "So be it!",
    "Have at you!",
  ],
  wounded: [
    "'Tis but a scratch!",
    "I've had worse.",
    "It's just a flesh wound!",
    "Come back here! I'll bite your legs off!",
  ],
  defeated: [
    "Right, we'll call it a draw.",
    "Running away, eh? Come back here and take what's coming to you!",
    "I'm invincible! ...The Black Knight always triumphs!",
  ],
}

// ============================================
// FRENCH CASTLE ENCOUNTER
// ============================================

export const FRENCH_TAUNTS = [
  "I fart in your general direction!",
  "Your mother was a hamster, and your father smelt of elderberries!",
  "I don't want to talk to you no more, you empty-headed animal food trough wiper!",
  "I wave my private parts at your aunties!",
  "Go and boil your bottoms, sons of a silly person!",
  "Now go away or I shall taunt you a second time!",
  "You don't frighten us, English pig-dogs!",
  "Fetchez la vache!",
]

// ============================================
// SPECIAL ITEMS
// ============================================

export interface AdamsItem {
  id: string
  name: string
  description: string
  price: { karma: number; coins: number }
  effect: string
  keywords: string[]
  source: AdamsReference['source']
}

export const ADAMS_SPECIAL_ITEMS: AdamsItem[] = [
  {
    id: 'towel',
    name: 'Perfectly Ordinary Towel',
    description: 'A towel is about the most massively useful thing you can have. Dry yourself, wave for help, sleep on it, or wrap it around your head to ward off noxious fumes.',
    price: { karma: 10, coins: 0 },  // Karma (cookies) only
    effect: '+5% to all skill checks, 10% discount at Cynthia\'s Inn',
    keywords: ['towel', 'hoopy', 'frood'],
    source: 'hitchhiker',
  },
  {
    id: 'sub_etha_thumb',
    name: 'Electronic Thumb',
    description: 'A small device for hailing passing starships. In Gold Country, it seems to attract helpful wagons.',
    price: { karma: 25, coins: 0 },
    effect: 'Chance of wagon rescue when stranded',
    keywords: ['thumb', 'hitchhike', 'sub-etha'],
    source: 'hitchhiker',
  },
  {
    id: 'guide_entry',
    name: 'Guide Entry: Gold Country',
    description: '"Gold Country: Mostly Harmless." A single-page entry from the Hitchhiker\'s Guide. Underwhelming but accurate.',
    price: { karma: 15, coins: 0 },
    effect: 'Reveals hidden locations on map',
    keywords: ['guide', 'entry', 'mostly harmless'],
    source: 'hitchhiker',
  },
  {
    id: 'holy_hand_grenade',
    name: 'Holy Hand Grenade of Antioch',
    description: 'Count to three. No more, no less. Three shall be the number of the counting.',
    price: { karma: 0, coins: 100 },
    effect: 'Auto-win one combat encounter (single use)',
    keywords: ['hand grenade', 'holy', 'antioch', 'count to three'],
    source: 'monty_python',
  },
  {
    id: 'shrubbery',
    name: 'One Small Shrubbery',
    description: 'A nice one. Not too expensive.',
    price: { karma: 5, coins: 5 },
    effect: 'Appeases certain eccentric NPCs',
    keywords: ['shrubbery', 'ni', 'bush'],
    source: 'monty_python',
  },
]

// ============================================
// KEYWORD DETECTION
// ============================================

/**
 * Check if player input contains Douglas Adams/Monty Python keywords
 * Returns the matching reference if found
 */
export function detectAdamsKeyword(input: string): AdamsReference | null {
  const lowerInput = input.toLowerCase()

  for (const ref of ADAMS_REFERENCES) {
    for (const keyword of ref.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return ref
      }
    }
  }

  return null
}

/**
 * Get a random response for a detected reference
 */
export function getAdamsResponse(ref: AdamsReference): string {
  return ref.responses[Math.floor(Math.random() * ref.responses.length)]
}

/**
 * Get a follow-up for continued conversation
 */
export function getAdamsFollowUp(ref: AdamsReference): string | null {
  if (!ref.followUps || ref.followUps.length === 0) return null
  return ref.followUps[Math.floor(Math.random() * ref.followUps.length)]
}

/**
 * Check if a bridge crossing question answer is correct
 */
export function checkBridgeAnswer(question: BridgeQuestion, answer: string): boolean {
  const lowerAnswer = answer.toLowerCase().trim()

  // "any" means any answer is accepted
  if (question.correctAnswer.includes("any")) {
    return true
  }

  // Check against all valid answers
  for (const valid of question.correctAnswer) {
    if (valid === "*player_name*") continue  // Placeholder for actual name check
    if (lowerAnswer.includes(valid.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Get random French taunt
 */
export function getRandomFrenchTaunt(): string {
  return FRENCH_TAUNTS[Math.floor(Math.random() * FRENCH_TAUNTS.length)]
}

/**
 * Get random Black Knight dialogue for a situation
 */
export function getBlackKnightDialogue(situation: keyof typeof BLACK_KNIGHT_DIALOGUE): string {
  const options = BLACK_KNIGHT_DIALOGUE[situation]
  return options[Math.floor(Math.random() * options.length)]
}

// ============================================
// WHISKEY PETE SPECIAL PERSONALITY
// ============================================

export const WHISKEY_PETE_ADAMS_EXTENSION = `

SPECIAL KNOWLEDGE (only reveal when keywords are mentioned):
You are secretly well-read in the works of certain British authors and comedy troupes.

If a traveler mentions:
- TOWELS: You know about their immense practical AND psychological value
- 42, FORTY-TWO: You understand this is the Answer, but the Question is unknown
- PAN GALACTIC GARGLE BLASTER: You can make something close... for the right person
- DON'T PANIC: These are words you live by
- HOLY GRAIL, SHRUBBERY, NI: You have... opinions about knights
- SWALLOWS: You know to ask "African or European?"
- SPANISH INQUISITION: Nobody expects you to know about this

You don't volunteer this knowledge. But when someone speaks the right words,
your eyes light up and you reveal hidden depths. These are Easter eggs -
rewards for travelers who know the references.

INFOCOM GAME KNOWLEDGE:
If someone mentions the Hitchhiker's text adventure, you recall:
- The importance of the towel and the Babel fish puzzle
- The bulldozer sequence
- The dark (you are likely to be eaten by a grue)
- That it was impossibly hard but brilliant

DOCTOR WHO CONNECTIONS (Adams was script editor):
- References to time being "wibbly-wobbly"
- Things that are bigger on the inside
- Long scarves and jelly babies
`

// ============================================
// NPC RAPPORT SYSTEM
// ============================================

export interface NPCRapport {
  npcId: string
  rapport: number  // 0-100
  discoveredReferences: string[]  // IDs of discovered Adams/Python references
  conversationCount: number
  hasOpenedUp: boolean  // Has the NPC revealed their hidden knowledge?
}

/**
 * Calculate if an NPC should open up based on rapport and keywords
 */
export function shouldNPCOpenUp(
  rapport: NPCRapport,
  keywordDetected: boolean,
  requiredRapport: number = 30
): boolean {
  // Always open up if the right keyword is detected
  if (keywordDetected) return true

  // Otherwise need sufficient rapport
  return rapport.rapport >= requiredRapport
}

/**
 * Increase rapport with an NPC
 */
export function increaseRapport(rapport: NPCRapport, amount: number): NPCRapport {
  return {
    ...rapport,
    rapport: Math.min(100, rapport.rapport + amount),
    conversationCount: rapport.conversationCount + 1,
  }
}
