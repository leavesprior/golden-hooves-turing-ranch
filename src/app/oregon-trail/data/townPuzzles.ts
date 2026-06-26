/**
 * Multi-Step Town Puzzles
 *
 * Hitchhiker's Guide Babel Fish-style environmental puzzles at landmarks.
 * Each puzzle is a chain of steps where the player must combine clues,
 * use inventory items, and interact with the environment in the right order.
 *
 * Puzzles are tied to specific landmarks and reward exploration + stat use.
 */

import type { StatName } from '../characterContext'

export type PuzzleStepAction =
  | 'examine'     // Look at something closely
  | 'use_item'    // Use an inventory item
  | 'talk'        // Talk to someone
  | 'skill_check' // Roll against a stat
  | 'choose'      // Pick from options

export interface PuzzleStep {
  id: string
  text: string
  narratorComment?: string  // Unreliable narrator commentary
  action: PuzzleStepAction
  // For 'use_item': which item from inventory is needed
  requiredItem?: string
  // For 'skill_check': stat and DC
  skillCheck?: { stat: StatName; dc: number }
  // For 'choose': options
  choices?: PuzzleChoice[]
  // What the player gets on success
  successText: string
  failureText?: string
  // Next step on success (null = puzzle complete)
  nextStepId: string | null
  // Alternative next step on failure
  failStepId?: string
  // Hint text shown if player gets stuck
  hint?: string
}

export interface PuzzleChoice {
  id: string
  text: string
  correct: boolean
  response: string  // Shown after choosing
}

export interface TownPuzzle {
  id: string
  title: string
  landmark: string           // Which landmark this puzzle appears at
  description: string        // Initial puzzle hook
  narratorIntro?: string     // Narrator sets the scene
  difficulty: 'easy' | 'medium' | 'hard'
  steps: PuzzleStep[]
  startStepId: string
  // Rewards
  rewards: {
    neutralKarma?: number
    goodKarma?: number
    food?: number
    ammunition?: number
    medicine?: number
    spareParts?: number
    xp?: number
    inventoryItem?: string   // Unique item gained
  }
  // Requirements to see this puzzle
  minDay?: number            // Must be at least this many days into journey
  requiresItem?: string      // Must have this item in inventory
  oneTimeOnly: boolean       // Can only solve once per playthrough
}

// ============================================
// PUZZLE DEFINITIONS
// ============================================

export const TOWN_PUZZLES: TownPuzzle[] = [
  // --- Fort Kearny: The Quartermaster's Lockbox ---
  {
    id: 'kearny_lockbox',
    title: 'The Quartermaster\'s Lockbox',
    landmark: 'Fort Kearny',
    description: 'The fort\'s quartermaster left in a hurry and forgot to open the supply lockbox. The combination is hidden somewhere in his office. He was known for his love of ciphers.',
    narratorIntro: 'The narrator finds lockbox puzzles tedious. But you, apparently, do not.',
    difficulty: 'easy',
    startStepId: 'examine_desk',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 15,
      spareParts: 2,
      medicine: 1,
      xp: 25,
    },
    steps: [
      {
        id: 'examine_desk',
        text: 'The quartermaster\'s desk is covered in papers. A locked iron box sits on the shelf. There\'s a worn journal, a map with strange markings, and a calendar with certain dates circled.',
        action: 'examine',
        successText: 'You notice the journal has numbers written in the margins: "Remember — the key is in the stars."',
        nextStepId: 'check_calendar',
        hint: 'Look at everything on the desk carefully.',
      },
      {
        id: 'check_calendar',
        text: 'The calendar has three dates circled: March 3rd, July 7th, and November 1st. Each date has a tiny star drawn next to it.',
        action: 'choose',
        choices: [
          { id: 'dates', text: 'The combination is 3-7-1 (the dates)', correct: false, response: 'Click... click... nothing. The lock doesn\'t budge. The dates seem too obvious.' },
          { id: 'months', text: 'The combination is 3-7-11 (the months)', correct: true, response: 'Click... click... CLICK! The lock springs open! "Stars" meant the star markings — the months they were in.' },
          { id: 'stars', text: 'Count the stars on the map instead', correct: false, response: 'The map stars are decorative. Back to the calendar...' },
        ],
        successText: 'The lockbox opens to reveal spare parts, medicine, and a stash of karma nuggets. The quartermaster won\'t miss what he forgot.',
        failureText: 'Wrong combination. The lock mechanism resets. Try again.',
        nextStepId: null,
        failStepId: 'check_calendar',
        hint: '"The key is in the stars" — which items have stars next to them?',
      },
    ],
  },

  // --- Chimney Rock: The Settler's Cache ---
  {
    id: 'chimney_rock_cache',
    title: 'The Settler\'s Cache',
    landmark: 'Chimney Rock',
    description: 'Carved into the base of Chimney Rock, you find initials: "J.D. 1849" with an arrow pointing down. Someone buried something here years ago.',
    narratorIntro: 'Another person\'s buried treasure. The narrator notes that this never ends well in stories. But your story isn\'t over yet.',
    difficulty: 'medium',
    startStepId: 'read_carving',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 30,
      food: 25,
      xp: 40,
      inventoryItem: 'J.D.\'s Journal',
    },
    steps: [
      {
        id: 'read_carving',
        text: 'The carving is weathered but readable: "J.D. 1849" with an arrow pointing at the ground. Below it, barely visible, are more words scratched into the rock.',
        action: 'skill_check',
        skillCheck: { stat: 'Shrewdness', dc: 10 },
        successText: 'You make out the words: "Four paces east from the shadow\'s tip at noon." It\'s a set of directions!',
        failureText: 'The scratches are too worn. You can make out "four" and "shadow" but not the rest. Maybe there\'s another clue nearby.',
        nextStepId: 'find_shadow',
        failStepId: 'ask_around',
        hint: 'The faded text mentions shadows and pacing.',
      },
      {
        id: 'ask_around',
        text: 'An old prospector near the rock has been here many times. He eyes you knowingly.',
        action: 'talk',
        successText: '"J.D.? Old Jedidiah Drake. Crazy prospector. He always said his fortune would be found when the rock\'s shadow points home. Noon shadow, four paces east." He grins toothlessly.',
        nextStepId: 'find_shadow',
        hint: 'Local knowledge can fill gaps in old carvings.',
      },
      {
        id: 'find_shadow',
        text: 'It\'s close to noon. Chimney Rock casts a dramatic shadow. Four paces east from its tip puts you at a patch of ground that looks slightly disturbed.',
        action: 'skill_check',
        skillCheck: { stat: 'Expertise', dc: 8 },
        successText: 'You dig carefully and find a waterproof tin box wrapped in oilcloth. Inside: dried food (still edible!), karma nuggets, and a journal detailing Jedidiah\'s route to a rich claim.',
        failureText: 'You dig in the wrong spot first, wasting time. But persistence pays off — after two more holes, you find the cache.',
        nextStepId: null,
        hint: 'Track the shadow carefully and pace exactly.',
      },
    ],
  },

  // --- Fort Laramie: The Coded Telegraph ---
  {
    id: 'laramie_telegraph',
    title: 'The Coded Message',
    landmark: 'Fort Laramie',
    description: 'The telegraph operator pulls you aside. "Got a message in code. Sender said the next person headed to Gold Country would know what to do." The message reads: XLIIV QEFIC XQ WYFHKIV',
    narratorIntro: 'A cipher. The narrator is impressed you haven\'t already walked away.',
    difficulty: 'hard',
    startStepId: 'examine_message',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 50,
      ammunition: 20,
      xp: 60,
      inventoryItem: 'Decoded Map Fragment',
    },
    steps: [
      {
        id: 'examine_message',
        text: 'The coded message: XLIIV QEFIC XQ WYFHKIV. The operator adds: "He also said something about Caesar knowing the way."',
        action: 'choose',
        choices: [
          { id: 'caesar_3', text: 'Apply a Caesar cipher shift of 3', correct: false, response: 'UKHHQ NBCEZ NU TVCEHSB... That\'s still gibberish.' },
          { id: 'caesar_4', text: 'Apply a Caesar cipher shift of 4', correct: true, response: 'THREE MILES AT SUBRIGE... wait — THREE MILES AT SUBRIGE? Close but one more shift needed.' },
          { id: 'reverse', text: 'Read it backwards', correct: false, response: 'EKGBYFW QX CFIEHQ VIILX... nope.' },
          { id: 'ask_more', text: 'Ask the operator for more context', correct: false, response: '"That\'s all I got, friend. Caesar cipher, he said. Classic military code."' },
        ],
        successText: 'A shift of 4 gets close: THREE MILES AT SUBRIGE. But it\'s almost there...',
        failureText: 'Not quite right. Caesar cipher means shifting letters. But by how many?',
        nextStepId: 'refine_decode',
        failStepId: 'examine_message',
        hint: 'Caesar cipher = shift each letter by a fixed number. "Caesar" + the year 4 BC...',
      },
      {
        id: 'refine_decode',
        text: 'Almost decoded: THREE M?LES AT SUBR?DGE. Some letters are off. The shift might vary, or some letters use a different key.',
        action: 'skill_check',
        skillCheck: { stat: 'Shrewdness', dc: 12 },
        successText: 'You crack it! THREE MILES AT SUNRIDGE. Adjusting for the mixed cipher, the message reveals a supply cache location near your route. The operator is impressed.',
        failureText: 'You struggle with the mixed cipher but brute-force the remaining letters: THREE MILES AT SUNRIDGE. Got it, even if it wasn\'t elegant.',
        nextStepId: 'collect_reward',
        hint: 'Fill in the obvious words and work backwards to fix the remaining letters.',
      },
      {
        id: 'collect_reward',
        text: 'Three miles from the fort, at a rock formation called Sunridge, you find a buried ammunition box and a map fragment showing a shortcut through the mountains.',
        action: 'examine',
        successText: 'The cache contains premium ammunition, karma nuggets, and a hand-drawn map fragment. Whoever left this was planning ahead — for someone just like you.',
        nextStepId: null,
        hint: 'Follow the decoded directions exactly.',
      },
    ],
  },

  // --- Independence Rock: The Name Game ---
  {
    id: 'independence_rock_names',
    title: 'The Trail of Names',
    landmark: 'Independence Rock',
    description: 'Independence Rock is covered with carved names of thousands of travelers. But one section has names arranged in a deliberate pattern, with a note: "Read us right and we\'ll share our secret."',
    narratorIntro: 'Thousands of names on a rock. The narrator has read them all. Most are boring. This section is not.',
    difficulty: 'medium',
    startStepId: 'read_names',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 25,
      goodKarma: 10,
      food: 30,
      xp: 35,
    },
    steps: [
      {
        id: 'read_names',
        text: 'The carved names read: Sarah, Ulysses, Nathaniel, Rosalind, Isaac, Samuel, Elijah. Below them: "Our first letters light the way."',
        action: 'choose',
        choices: [
          { id: 'sunrise', text: 'The first letters spell SUNRISE — look east!', correct: true, response: 'S-U-N-R-I-S-E! At sunrise, a specific shadow falls on the rock face, revealing a hidden carving.' },
          { id: 'read_aloud', text: 'Read all the names aloud', correct: false, response: 'You recite the names. A nearby traveler gives you an odd look. Nothing happens.' },
          { id: 'count', text: 'Count the total letters in all names', correct: false, response: 'You count... 43 letters. This doesn\'t seem to mean anything.' },
        ],
        successText: 'SUNRISE! You need to return at dawn.',
        failureText: 'The answer is in the initials, not the names themselves.',
        nextStepId: 'wait_sunrise',
        failStepId: 'read_names',
        hint: 'Take the FIRST letter of each name...',
      },
      {
        id: 'wait_sunrise',
        text: 'At dawn, the rising sun casts a shadow through a natural notch in the rock. The shadow\'s edge points to a specific spot on the ground — a flat stone with a handprint carved into it.',
        action: 'skill_check',
        skillCheck: { stat: 'Expertise', dc: 8 },
        successText: 'You pry up the stone carefully. Beneath it: a waterproof pouch containing karma nuggets, dried provisions, and a heartfelt letter from the group who left it. "For the next clever soul who reads the sunrise."',
        failureText: 'You nearly drop the stone back into place, but catch it. Underneath: supplies and a letter left by those seven travelers.',
        nextStepId: null,
        hint: 'Follow the shadow at sunrise to find what\'s hidden.',
      },
    ],
  },

  // --- Humboldt Sink: The Mirage Riddle ---
  {
    id: 'humboldt_mirage',
    title: 'The Desert\'s Question',
    landmark: 'Humboldt Sink',
    description: 'In the shimmering heat, a figure appears — or seems to. It speaks in a voice like wind over sand: "I have cities but no houses, forests but no trees, water but no fish. What am I?"',
    narratorIntro: 'The desert is talking. The narrator has seen this before. It never goes well.',
    difficulty: 'easy',
    startStepId: 'hear_riddle',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 20,
      medicine: 2,
      xp: 30,
    },
    steps: [
      {
        id: 'hear_riddle',
        text: '"I have cities but no houses, forests but no trees, water but no fish." The mirage-figure waits, flickering in the heat.',
        action: 'choose',
        choices: [
          { id: 'map', text: 'A map!', correct: true, response: 'The figure smiles — or the heat shimmer shifts. "Correct. And maps lead to treasure." The mirage dissipates, leaving behind something real on the ground.' },
          { id: 'dream', text: 'A dream?', correct: false, response: '"Close, but dreams have people in their cities. Try again."' },
          { id: 'desert', text: 'The desert itself?', correct: false, response: '"The desert has sand, not cities. Think more... cartographically."' },
          { id: 'book', text: 'A book?', correct: false, response: '"Books have words, not cities. But you\'re thinking in the right direction."' },
        ],
        successText: 'Where the mirage stood, you find a leather tube containing medicine, a small pouch of karma nuggets, and a map with a water source marked that\'s not on any official chart.',
        failureText: 'Not quite. The riddle is about something that represents the world without containing it.',
        nextStepId: null,
        failStepId: 'hear_riddle',
        hint: 'What shows cities, forests, and water without actually having them?',
      },
    ],
  },

  // --- South Pass: The Prospector's Test ---
  {
    id: 'south_pass_prospector',
    title: 'The Old Prospector\'s Challenge',
    landmark: 'South Pass',
    description: 'An ancient prospector sits by the pass, testing every traveler with a challenge. "Gold Country don\'t need fools," he growls. "Answer my questions and I\'ll tell you something worth knowing."',
    narratorIntro: 'The narrator knows this man. He\'s been here since \'49. His questions are annoying but his rewards are real.',
    difficulty: 'medium',
    startStepId: 'question_one',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 35,
      food: 20,
      ammunition: 10,
      xp: 45,
      inventoryItem: 'Prospector\'s Wisdom',
    },
    steps: [
      {
        id: 'question_one',
        text: '"First question: You find a gold vein on someone else\'s claimed land. What do you do?"',
        action: 'choose',
        choices: [
          { id: 'steal', text: 'Mine it at night when they\'re not looking', correct: false, response: '"A thief! Gold Country has enough of those. Try again."' },
          { id: 'negotiate', text: 'Offer to split the proceeds with the claim owner', correct: true, response: '"Fair dealing. The foundation of any good partnership. Next question."' },
          { id: 'report', text: 'Report it to the claims office and move on', correct: false, response: '"Honest, but foolish. There\'s a middle ground, friend."' },
          { id: 'buy', text: 'Offer to buy the claim', correct: false, response: '"You\'d go broke before you got rich. Think about partnerships."' },
        ],
        successText: 'The prospector nods approvingly.',
        failureText: 'Wrong answer, but the prospector lets you try again.',
        nextStepId: 'question_two',
        failStepId: 'question_one',
        hint: 'The gold is on THEIR land. What\'s the fairest arrangement?',
      },
      {
        id: 'question_two',
        text: '"Second: Your partner strikes gold but claims he found nothing. You saw the nugget. What do you do?"',
        action: 'skill_check',
        skillCheck: { stat: 'Diplomacy', dc: 10 },
        successText: 'You talk through it diplomatically — confront with evidence but leave room for them to save face. The prospector grins. "Wisdom AND tact."',
        failureText: 'Your approach is too blunt, but the prospector respects the honesty. "Close enough. You\'ll learn."',
        nextStepId: 'question_three',
        hint: 'This requires diplomatic skill to navigate.',
      },
      {
        id: 'question_three',
        text: '"Final question. Not a question really. Look me in the eye and tell me: why are you going to Gold Country?"',
        action: 'choose',
        choices: [
          { id: 'wealth', text: 'To get rich, of course', correct: false, response: '"At least you\'re honest. But gold fever burns out faster than a candle in a mine shaft."' },
          { id: 'adventure', text: 'For the adventure of a lifetime', correct: true, response: '"NOW you\'re talking! The ones who survive Gold Country are the ones who came for the journey, not just the destination."' },
          { id: 'family', text: 'To build a future for my family', correct: true, response: '"A purpose bigger than gold. That\'s what keeps a person going when the mines run dry. Good answer."' },
          { id: 'escape', text: 'To leave my old life behind', correct: false, response: '"Running from something doesn\'t mean you\'re running toward something better. Think on that."' },
        ],
        successText: 'The prospector rises, reaches into his pack, and hands you supplies, ammunition, and a small journal. "My notes on every claim and creek from here to Sacramento. Worth more than any nugget."',
        failureText: 'The prospector shakes his head but gives you provisions anyway. "You\'ll figure out the right answer eventually."',
        nextStepId: null,
        failStepId: undefined, // No retry on the last question — both correct answers are accepted
        hint: 'What matters more than gold?',
      },
    ],
  },

  // ============================================================
  // GOLD COUNTRY TOWN PUZZLES (2026-06-20)
  // Additive content per the enrichment plan: the puzzle engine + TownScreen
  // renderer already support any landmark; these attach to the Gold Country
  // town `name` strings (matching state.currentLandmark = landmark.name).
  // Each town gets a DISTINCT verb, grounded in real CHL / Gold Country history.
  // ============================================================

  // --- Angels Camp: The Jumping Frog (TALK / deduction — Twain at the Angels Hotel, 1865) ---
  {
    id: 'angels_camp_jumping_frog',
    title: 'The Celebrated Frog',
    landmark: 'Angels Camp',
    description: 'At the Angels Hotel bar, an old-timer is mid-story about a frog loaded with quail shot so it couldn\'t jump. He stops, eyes you. "You want the rest? Earn it. Answer me true."',
    narratorIntro: 'The narrator recognizes this tale. A young writer named Sam Clemens heard it at this very bar in 1865 and made himself famous with it. History rhymes; the narrator merely takes notes.',
    difficulty: 'easy',
    startStepId: 'hear_tale',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 25,
      goodKarma: 1,
      xp: 35,
      inventoryItem: 'Lucky Frog Charm',
    },
    steps: [
      {
        id: 'hear_tale',
        text: 'The barkeep leans in. "Stranger came through, bet Jim Smiley\'s prize frog Dan\'l couldn\'t out-jump a plain frog. While Smiley fetched one, the stranger did something to Dan\'l. When the contest came, Dan\'l sat like a church. Now — what did the stranger DO to that frog?"',
        action: 'choose',
        choices: [
          { id: 'shot', text: 'Filled him with quail shot so he was too heavy to jump', correct: true, response: '"HAH! You know the tale — or you\'re a fast thinker. Quail shot, right down the gullet. Dan\'l couldn\'t budge." He slaps the bar.' },
          { id: 'tired', text: 'Tired him out by making him jump first', correct: false, response: 'The barkeep shakes his head. "Nothin\' so honest as that. The stranger cheated clever."' },
          { id: 'swap', text: 'Swapped Dan\'l for a heavier frog', correct: false, response: '"No swap — same frog, Dan\'l himself. Just... heavier than he ought to be."' },
        ],
        successText: 'The barkeep is delighted you know your Calaveras lore.',
        failStepId: 'second_chance',
        nextStepId: 'reward_charm',
        hint: 'Why couldn\'t a champion jumper jump? Think about weight.',
      },
      {
        id: 'second_chance',
        text: '"You\'re green. I\'ll give you one more. When the stranger left, Smiley picked up Dan\'l and was surprised at how HEAVY he\'d got. He turned him upside down and out came— what?"',
        action: 'choose',
        choices: [
          { id: 'shot2', text: 'A double handful of quail shot', correct: true, response: '"There it is! Spilled out like a busted hourglass. Smiley near tore the county apart lookin\' for that stranger." He laughs.' },
          { id: 'gold', text: 'Gold nuggets', correct: false, response: '"Gold! Ha. You wish. Heavier and meaner than gold — buckshot."' },
        ],
        successText: 'You got there in the end.',
        nextStepId: 'reward_charm',
        hint: 'The same thing that weighed him down in the first place.',
      },
      {
        id: 'reward_charm',
        text: 'The barkeep reaches under the bar and hands you a little brass frog on a thong. "For knowin\' the story right. They jump these frogs for real every May now — the Jumping Frog Jubilee. You carry a piece of it."',
        action: 'talk',
        successText: 'You pocket the Lucky Frog Charm. The whole bar raises a glass to Mark Twain, who never knew what that afternoon would start.',
        nextStepId: null,
      },
    ],
  },

  // --- Murphys: The Banker's Ledger (LEDGER-MATH / cipher — the gold-era counting house) ---
  {
    id: 'murphys_ledger_cipher',
    title: 'The Banker\'s Ledger',
    landmark: 'Murphys',
    description: 'In a dusty back room of an old Murphys counting house, a ledger lies open. The last clerk encoded the location of a strongbox in the column sums — but the page is water-stained and one figure is missing.',
    narratorIntro: 'The narrator, who has strong feelings about arithmetic, perks up. Finally, a puzzle with a correct answer.',
    difficulty: 'medium',
    startStepId: 'read_ledger',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 40,
      xp: 50,
      spareParts: 1,
      inventoryItem: 'Strongbox Key',
    },
    steps: [
      {
        id: 'read_ledger',
        text: 'The ledger header reads: "Deposits, week ending. The honest sum opens the box." Three rows are legible: 47, 88, and 65. A fourth is blotted out. At the bottom: "TOTAL: 247."',
        action: 'skill_check',
        skillCheck: { stat: 'Shrewdness', dc: 10 },
        successText: 'You realize the missing row is simply 247 minus the three you can read. The clerk\'s "honest sum" is the missing deposit itself.',
        failureText: 'The figures swim before you. Maybe work it the other way — what plus the known rows makes the total?',
        nextStepId: 'compute',
        failStepId: 'compute',
        hint: '47 + 88 + 65 + ? = 247. Solve for the blotted figure.',
      },
      {
        id: 'compute',
        text: 'The known deposits are 47, 88, and 65 — together 200. The total is 247. What was the missing fourth deposit (and the strongbox combination)?',
        action: 'choose',
        choices: [
          { id: '47', text: '47', correct: true, response: 'You dial 4-7 into the strongbox. The tumblers fall. CLICK. Inside: a key and a clerk\'s apologetic note.' },
          { id: '57', text: '57', correct: false, response: 'The dial won\'t catch. Recount: 247 minus 200 is not 57.' },
          { id: '147', text: '147', correct: false, response: 'Too large — that would make the total far over 247. Try again.' },
        ],
        successText: 'The strongbox opens.',
        failStepId: 'compute',
        nextStepId: 'claim_box',
        hint: '247 − (47 + 88 + 65) = 247 − 200.',
      },
      {
        id: 'claim_box',
        text: 'Inside the strongbox: a brass Strongbox Key (it fits doors all over the southern mines), spare machine parts, and karma the old clerk set aside "for whoever\'s honest enough to do the sums."',
        action: 'examine',
        successText: 'You take the key and the clerk\'s honest hoard. Murphys was once called "Queen of the Sierra" for gold like this.',
        nextStepId: null,
      },
    ],
  },

  // --- Moaning Cavern: The Shadow Descent (SHADOW/TIMING — the 165-ft vertical chamber) ---
  {
    id: 'moaning_cavern_descent',
    title: 'The Moaning Descent',
    landmark: 'Moaning Cavern',
    description: 'The cavern\'s great chamber drops 165 feet — deep enough to hold the Statue of Liberty. A rope ladder sways into the dark. Miners say the safe footing only shows when the noon light spears down the shaft.',
    narratorIntro: 'The narrator is not fond of caves, holes, or the dark, and notes that this cavern combines all three. It proceeds under protest.',
    difficulty: 'medium',
    startStepId: 'time_the_light',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 35,
      goodKarma: 1,
      xp: 45,
      medicine: 1,
    },
    steps: [
      {
        id: 'time_the_light',
        text: 'A shaft of daylight moves across the cavern wall as the sun climbs. Carved ledges are only safe to step on when the light touches them — step in shadow and the rock is slick with cave-moisture. When should you descend?',
        action: 'choose',
        choices: [
          { id: 'noon', text: 'At noon, when the light reaches deepest down the shaft', correct: true, response: 'You wait for the sun to stand highest. The beam plunges far into the chamber, lighting ledge after ledge in a glowing stair. You descend on the lit stone, sure-footed.' },
          { id: 'dawn', text: 'At dawn, while it is cool', correct: false, response: 'At dawn the light barely clears the rim; the ledges below stay dark and treacherous. You wait.' },
          { id: 'dusk', text: 'At dusk, to avoid crowds', correct: false, response: 'By dusk the shaft is in shadow and the moss is slick. Far too dangerous. You wait for tomorrow\'s noon.' },
        ],
        successText: 'The timed light shows the way down.',
        failStepId: 'time_the_light',
        nextStepId: 'descend',
        hint: 'When does sunlight reach FARTHEST down a vertical shaft? Highest sun = deepest reach.',
      },
      {
        id: 'descend',
        text: 'On the lit ledges you climb down to the chamber floor. Among the flowstone you find an old miner\'s cache — and the prehistoric bones the cavern is famous for, undisturbed. You leave the bones; you take the cache.',
        action: 'skill_check',
        skillCheck: { stat: 'Agility', dc: 8 },
        successText: 'Sure-footed on the wet rock, you retrieve medicine and karma a careful soul left for the next careful soul.',
        failureText: 'You slip once, scrape a shin, but catch the ladder. Shaken, you still reach the cache.',
        nextStepId: null,
        hint: 'Move when the rock is dry and lit.',
      },
    ],
  },

  // --- Kennedy Mine: The Tailing Wheel (USE_ITEM / mechanism — the real 58-ft Kennedy wheels) ---
  {
    id: 'kennedy_mine_tailing_wheel',
    title: 'The Great Tailing Wheel',
    landmark: 'Kennedy Mine',
    description: 'One of the Kennedy Mine\'s giant 58-foot tailing wheels has seized — the elevator that lifts mine waste over the hills has jammed. A foreman offers good pay to anyone who can free it without wrecking the buckets.',
    narratorIntro: 'The narrator admires a well-made machine, and the Kennedy wheels — four of them, lifting tailings 128 feet — are among the finest the narrator has seen. It would be a shame to break one.',
    difficulty: 'hard',
    startStepId: 'inspect_wheel',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 50,
      xp: 60,
      spareParts: 2,
      inventoryItem: 'Foreman\'s Recommendation',
    },
    steps: [
      {
        id: 'inspect_wheel',
        text: 'The huge wheel is fouled — a bucket has come loose and wedged against the frame. Forcing the motor would tear the rim. You have tools. What do you reach for first?',
        action: 'use_item',
        successText: 'You set a pry-bar against the wedged bucket and ease tension off the rim before anything turns. The foreman nods — you understand machines.',
        failureText: 'You consider just running the motor harder. The foreman grabs your arm. "You\'ll snap the rim. Think first."',
        nextStepId: 'free_bucket',
        failStepId: 'free_bucket',
        hint: 'Relieve the jam by hand BEFORE applying power, or you destroy the wheel.',
      },
      {
        id: 'free_bucket',
        text: 'With the bucket freed and re-pinned, you must restart the wheel. The foreman watches. How do you bring 58 feet of iron back to turning?',
        action: 'choose',
        choices: [
          { id: 'slow', text: 'Engage the drive slowly, letting the wheel take the load gradually', correct: true, response: 'The great wheel groans, then turns — smooth, buckets climbing the hillside again. The foreman grins. "Clean work."' },
          { id: 'full', text: 'Throw it to full power to break the inertia', correct: false, response: 'The foreman lunges for the lever. "NO — full power on a cold wheel shears the gudgeon. Slow, always slow."' },
        ],
        successText: 'The tailing wheel runs again.',
        failStepId: 'free_bucket',
        nextStepId: 'get_paid',
        hint: 'Massive rotating iron must be brought up to speed gently.',
      },
      {
        id: 'get_paid',
        text: 'The foreman pays you in spare parts and karma, and writes a recommendation. "The Kennedy\'s one of the deepest mines in the country — near a mile straight down. We always need hands who think before they pull a lever."',
        action: 'talk',
        successText: 'You pocket the Foreman\'s Recommendation — it opens doors at mines all through the Mother Lode.',
        nextStepId: null,
      },
    ],
  },

  // --- Mokelumne Hill: The Sixteen-Foot Lie (EXAMINE / survey-fraud — the real 16-ft claim limit) ---
  {
    id: 'mokelumne_hill_claim_fraud',
    title: 'The Sixteen-Foot Lie',
    landmark: 'Mokelumne Hill',
    description: 'On Mokelumne Hill, where claims were limited to a mere sixteen feet because the gold was so rich, a miner accuses his neighbor of moving a boundary stake to steal ground. He asks you to judge the line.',
    narratorIntro: 'The narrator notes that Mokelumne Hill was so rich men killed over sixteen feet of dirt. A boundary dispute here is never small.',
    difficulty: 'medium',
    startStepId: 'examine_stakes',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 35,
      goodKarma: 1,
      xp: 50,
    },
    steps: [
      {
        id: 'examine_stakes',
        text: 'Two boundary stakes stand sixteen feet apart — the legal claim width. But one stake\'s hole shows fresh-turned earth, while the original posthole sits eighteen inches away, packed and weathered. What does the evidence say?',
        action: 'examine',
        successText: 'The fresh dirt is plain: the disputed stake was recently MOVED, narrowing the accuser\'s claim and widening the neighbor\'s. The old, packed posthole is the true line.',
        failureText: 'At a glance both stakes look planted. But look closer — one hole is fresh, one is old and weathered.',
        nextStepId: 'render_judgment',
        failStepId: 'render_judgment',
        hint: 'Compare the two postholes. Which was dug recently?',
      },
      {
        id: 'render_judgment',
        text: 'A crowd gathers — claim disputes draw blood here. You must rule. Where is the true boundary?',
        action: 'choose',
        choices: [
          { id: 'old', text: 'The old weathered posthole — the stake was moved; restore the original line', correct: true, response: 'You point to the packed old hole. "That\'s the true mark. The stake was shifted." The crowd murmurs agreement; the neighbor reddens and re-sets the line. Justice on sixteen feet of gold ground.' },
          { id: 'new', text: 'The current stake position — possession is the law', correct: false, response: 'The accuser erupts. "He MOVED it — you\'re rewarding the thief!" The crowd turns ugly. You reconsider the evidence.' },
          { id: 'split', text: 'Split the difference between the two holes', correct: false, response: '"There\'s no \'difference\' to split — one hole is a lie!" The miner is right; a fraud isn\'t settled by compromise.' },
        ],
        successText: 'You restore the honest boundary.',
        failStepId: 'render_judgment',
        nextStepId: null,
        hint: 'A moved stake isn\'t a negotiation — the original line is the honest one.',
      },
    ],
  },
  // --- Phase 0 upgrade (per bobr_game_enrichment_plan_20260620): Big Trees ring-count puzzle ---
  {
    id: 'big_trees_rings',
    title: 'The Discovery Tree\'s Calendar',
    landmark: 'big_trees',
    description: 'The Big Trees (Calaveras Grove). The "Discovery Tree" stump still shows its rings — 1,244 of them. A claim marker nearby says Vane\'s party "settled and milled here in \'48." The rings disagree.',
    narratorIntro: 'The narrator observes that trees do not lie, and liars hate trees.',
    difficulty: 'medium',
    startStepId: 'examine_stump',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 25,
      xp: 40,
      goodKarma: 1,
    },
    steps: [
      {
        id: 'examine_stump',
        text: 'The stump is cross-sectioned. A fresh blaze mark claims "1848 — first cut." But the ring count from the center to that blaze is only 1,191 rings. The outer bark edge adds the rest.',
        action: 'examine',
        successText: 'Counting inward from the blaze: 1,191 rings to the heart. The tree was still standing in 1849 when the first real claims were registered. 1848 is a lie.',
        nextStepId: 'date_the_cut',
        hint: 'The blaze claims a year. Count the rings it would take to reach that year.',
      },
      {
        id: 'date_the_cut',
        text: 'If the outer ring is 1852 (the year the "Discovery Tree" was felled for exhibition), how many rings lie between the false 1848 blaze and the true heart?',
        action: 'choose',
        choices: [
          { id: '1191', text: '1,191 rings — the tree was growing strong in 1848; Vane\'s "settled" marker is fresh-milled fraud', correct: true, response: 'The rings are honest. Whoever blazed 1848 was cutting after the fact. Evidence for the Tare\'s presence forgery.' },
          { id: '1244', text: 'The full 1,244 — it is ancient, therefore Vane is old', correct: false, response: 'The total age is irrelevant. The blaze date is the lie.' },
          { id: '1852', text: 'Count only from the bark inward', correct: false, response: 'The bark is the present. The question is what the blaze year proves.' },
        ],
        successText: 'You pocket a sliver of the false blaze as evidence. Another thread in the case against Cyrus Vane.',
        nextStepId: null,
        hint: 'The question is not the tree\'s age, but whether it was standing when Vane claims he milled it.',
      },
    ],
  },
  // --- Phase 0: Mokelumne Hill ledger / math (Adams & Co express tie-in) ---
  {
    id: 'mok_hill_ledger',
    title: 'The Adams Express Tally',
    landmark: 'mokelumne_hill',
    description: 'Adams & Co. express office. A deposit slip for "Vane & Co." shows 47 ounces credited on a date when the books say the office was closed by the Panic. The numbers do not add up to any honest panning day.',
    narratorIntro: 'The narrator notes that panic years make the best liars — and the worst accountants.',
    difficulty: 'medium',
    startStepId: 'read_slip',
    oneTimeOnly: true,
    rewards: {
      neutralKarma: 20,
      xp: 35,
    },
    steps: [
      {
        id: 'read_slip',
        text: 'The slip is dated June 1855. "47 oz dust, assayed, credited." But the ledger for that week is stamped "OFFICE CLOSED — RUN." The only other entry that week is a single 12-oz withdrawal by the same name two days later.',
        action: 'examine',
        successText: '47 oz credited on a closed day, then 12 oz out. The dust was never in the safe. The slip is the forgery; the withdrawal is the cleanup.',
        nextStepId: 'balance_the_books',
        hint: 'Closed office cannot credit. Look at what actually moved.',
      },
      {
        id: 'balance_the_books',
        text: 'If the real daily take that week averaged 8-9 oz for honest claims, what does 47 oz on one slip actually represent?',
        action: 'choose',
        choices: [
          { id: 'salted', text: 'Salted with filings or low-grade from multiple claims — Vane "found" what others had already dug', correct: true, response: 'The numbers only work if the dust was collected after the fact and laundered through a closed book. Classic Tare.' },
          { id: 'lucky', text: 'One rich pan — the luck of the draw', correct: false, response: 'No pan in the Hill ever ran 47 oz in a morning. The books would have noted a strike.' },
          { id: 'error', text: 'Clerk error; ignore the date stamp', correct: false, response: 'The stamp and the withdrawal two days later tell the same lie.' },
        ],
        successText: 'The ledger now carries a marginal note in your hand: "Presence forged — dust arrived after the run." Another honest record Vane cannot erase.',
        nextStepId: null,
        hint: 'The closed date is the tell. The withdrawal is the proof it was never real.',
      },
    ],
  },
]

/**
 * Get puzzles available at a specific landmark
 */
export function getPuzzlesForLandmark(
  landmark: string,
  solvedPuzzles: string[] = [],
  currentDay: number = 1,
  inventory: string[] = []
): TownPuzzle[] {
  return TOWN_PUZZLES.filter(puzzle => {
    if (puzzle.landmark !== landmark) return false
    if (puzzle.oneTimeOnly && solvedPuzzles.includes(puzzle.id)) return false
    if (puzzle.minDay && currentDay < puzzle.minDay) return false
    if (puzzle.requiresItem && !inventory.includes(puzzle.requiresItem)) return false
    return true
  })
}
