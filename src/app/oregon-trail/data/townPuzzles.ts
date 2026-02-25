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
