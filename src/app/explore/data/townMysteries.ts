/**
 * Mini-Mystery Deduction per Explore Town — Improvement #10
 * Inspired by: Where in the World Is Carmen Sandiego? (Broderbund, 1985)
 *
 * Each town has a historical mini-mystery. Players gather clues by
 * visiting specific attractions, then make a deduction to solve it.
 * Mysteries are based on real Gold Country history.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TownMystery {
  id: string
  townId: string
  title: string
  /** Intro text presented when the mystery is discovered */
  briefing: string
  /** The historical period */
  era: string
  /** Difficulty tier */
  difficulty: 'easy' | 'medium' | 'hard'
  /** Clues scattered across town attractions */
  clues: MysteryClue[]
  /** The deduction question */
  deduction: MysteryDeduction
  /** XP reward for solving */
  xpReward: number
  /** Badge awarded (optional) */
  badgeId?: string
  /** Flavor text when solved */
  solvedText: string
  /** Historical epilogue */
  historicalNote: string
}

export interface MysteryClue {
  id: string
  /** Which attraction ID reveals this clue */
  attractionId: string
  /** The clue text shown to the player */
  text: string
  /** Flavor text for how you found it */
  discoveryText: string
  /** Is this clue required to make the deduction? */
  required: boolean
  /** Order hint (lower = find first) */
  order: number
}

export interface MysteryDeduction {
  question: string
  /** Multiple choice options */
  options: DeductionOption[]
  /** How many clues needed before deduction unlocks */
  minCluesRequired: number
}

export interface DeductionOption {
  id: string
  text: string
  correct: boolean
  /** Response text if chosen */
  response: string
}

export interface MysteryProgress {
  mysteryId: string
  cluesFound: string[]
  solved: boolean
  attempts: number
  solvedAt?: number
}

// ============================================================================
// TOWN MYSTERIES
// ============================================================================

export const TOWN_MYSTERIES: TownMystery[] = [
  // === VOLCANO ===
  {
    id: 'volcano_cannon',
    townId: 'volcano',
    title: 'The Cannon That Never Fired',
    briefing: 'During the Civil War, a cannon called "Old Abe" was smuggled into Volcano to defend the Union cause. But the cannon was never fired in battle. Why? And who was behind its secret journey to this tiny town?',
    era: '1862',
    difficulty: 'easy',
    clues: [
      {
        id: 'vc_1',
        attractionId: 'vol_st_george',
        text: 'A faded letter behind the hotel bar reads: "The package arrives by mule train Thursday. Tell no one. —Union League"',
        discoveryText: 'You notice something tucked behind a portrait in the lobby...',
        required: true,
        order: 1,
      },
      {
        id: 'vc_2',
        attractionId: 'vol_theatre',
        text: 'Old playbills advertise a "special performance" the same night the cannon arrived — a convenient distraction for the whole town.',
        discoveryText: 'Flipping through historical playbills backstage, one date stands out...',
        required: false,
        order: 2,
      },
      {
        id: 'vc_3',
        attractionId: 'vol_brewery',
        text: 'The brewery ledger shows an unusual purchase: "6 barrels, extra reinforced, FRAGILE" — just the right size to hide a cannon in pieces.',
        discoveryText: 'An old ledger in the brewery museum catches your eye...',
        required: true,
        order: 3,
      },
      {
        id: 'vc_4',
        attractionId: 'vol_cemetery',
        text: 'A headstone reads: "Capt. Edward Byrne, Union League of Volcano, 1824-1891. He kept the secret."',
        discoveryText: 'Walking among the headstones, one epitaph is unusually specific...',
        required: true,
        order: 4,
      },
    ],
    deduction: {
      question: 'Who organized the secret transport of Old Abe to Volcano?',
      options: [
        { id: 'a', text: 'Confederate sympathizers hiding weapons', correct: false, response: 'No — the cannon was brought BY Union supporters, not against them. The Confederates never knew about it.' },
        { id: 'b', text: 'The Union League, a secret pro-Union society', correct: true, response: 'Correct! The Union League of Volcano secretly transported Old Abe to defend the gold shipments from Confederate raiders. The cannon was never needed — its mere presence was deterrent enough.' },
        { id: 'c', text: 'A traveling arms dealer from San Francisco', correct: false, response: 'Close, but no. The cannon was a community effort by local Union loyalists, not a commercial transaction.' },
        { id: 'd', text: 'The U.S. Army garrison at Fort Miller', correct: false, response: 'The Army was spread thin. Old Abe was a grassroots effort by Volcano\'s own citizens.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 75,
    badgeId: 'mystery_volcano',
    solvedText: 'The mystery of Old Abe is solved! The Union League\'s secret mission kept Gold Country loyal.',
    historicalNote: 'Old Abe, a brass cannon, was indeed smuggled into Volcano by the Union League in 1862. It was never fired in anger but served as a powerful symbol of Union loyalty in the gold country. The cannon still sits in Volcano today.',
  },

  // === ANGELS CAMP ===
  {
    id: 'angels_twain',
    townId: 'angels_camp',
    title: 'The Jumping Frog Swindle',
    briefing: 'In 1865, Mark Twain published a story about a rigged frog-jumping contest in Angels Camp. But was it pure fiction, or based on a real swindle? Someone in town knows the truth about who cheated — and how.',
    era: '1865',
    difficulty: 'medium',
    clues: [
      {
        id: 'at_1',
        attractionId: 'ac_museum',
        text: 'A yellowed newspaper clipping: "Jim Smiley\'s frog, Dan\'l Webster, lost the contest after being mysteriously weighed down. Quail shot suspected."',
        discoveryText: 'In the museum\'s Twain exhibit, a newspaper is preserved under glass...',
        required: true,
        order: 1,
      },
      {
        id: 'at_2',
        attractionId: 'ac_jumping_frog',
        text: 'A bartender at the old saloon reportedly told Twain the original tale. His name: Ben Coon, a retired river pilot.',
        discoveryText: 'A plaque near the frog statue mentions the story\'s real source...',
        required: true,
        order: 2,
      },
      {
        id: 'at_3',
        attractionId: 'ac_utica_park',
        text: 'Old mining records show a "J. Smiley" filed a claim near Angels Camp in 1849. A real man, not just fiction.',
        discoveryText: 'Among historical mining records posted in the park, one name jumps out...',
        required: false,
        order: 3,
      },
      {
        id: 'at_4',
        attractionId: 'ac_main_street',
        text: 'A diary entry from 1864: "The stranger filled Dan\'l Webster with buckshot while Jim weren\'t looking. Easiest $40 that cheat ever made."',
        discoveryText: 'A reproduction diary in a shop window tells a familiar tale...',
        required: true,
        order: 4,
      },
    ],
    deduction: {
      question: 'What was the real basis for Twain\'s "Celebrated Jumping Frog" story?',
      options: [
        { id: 'a', text: 'Pure fiction — Twain invented the whole thing', correct: false, response: 'Twain was many things, but he credited his source. The story came from a real person in Angels Camp.' },
        { id: 'b', text: 'A tale told by bartender Ben Coon about a real contest cheat', correct: true, response: 'Correct! Mark Twain heard the tale from Ben Coon (or "Coon" as he spelled it) at the Angels Hotel bar in 1865. The story of Jim Smiley and the buckshot-laden frog became his first major literary success.' },
        { id: 'c', text: 'Twain witnessed the fraud himself at a frog contest', correct: false, response: 'Twain arrived in Angels Camp in 1864-65 for gold mining, not frog watching. He heard the story secondhand.' },
        { id: 'd', text: 'A revenge tale from a miner Twain swindled at cards', correct: false, response: 'Twain was notoriously bad at cards and mining alike. No swindle required — just a good ear for storytelling.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_angels',
    solvedText: 'You\'ve traced the origin of one of America\'s most famous short stories!',
    historicalNote: 'Mark Twain spent several months in Angels Camp in 1864-65 during an unsuccessful gold mining venture. He heard the frog story from a local (likely Ben Coon at the Angels Hotel) and published "The Celebrated Jumping Frog of Calaveras County" in 1865, launching his literary career.',
  },

  // === WEST POINT ===
  {
    id: 'westpoint_robbery',
    townId: 'west_point',
    title: 'Black Bart\'s Last Laugh',
    briefing: 'Charles Bolles, a.k.a. Black Bart, robbed 28 stagecoaches without firing a single shot. After his capture, he vanished. But some say he left one final clue about hidden loot near West Point. Can you find it?',
    era: '1883',
    difficulty: 'medium',
    clues: [
      {
        id: 'wp_1',
        attractionId: 'wp_hotel',
        text: 'A guest registry shows "C.E. Bolton, Mining Engineer" checked in the night before the last stage robbery on this route.',
        discoveryText: 'The old hotel keeps its guest registries on display...',
        required: true,
        order: 1,
      },
      {
        id: 'wp_2',
        attractionId: 'wp_general_store',
        text: 'A poem scratched into the counter reads: "I\'ve labored long and hard for bread, for honor and for riches. But on my corns too long you\'ve tread, you fine-haired sons of —"',
        discoveryText: 'Etched into the original wooden counter, barely legible...',
        required: true,
        order: 2,
      },
      {
        id: 'wp_3',
        attractionId: 'wp_mine',
        text: 'Mining records show no claim filed by "Bolton" — his cover story was a lie. But he purchased a new flour sack at the Sandy Gulch store.',
        discoveryText: 'In the mine\'s historical archive, a purchase receipt stands out...',
        required: false,
        order: 3,
      },
      {
        id: 'wp_4',
        attractionId: 'wp_cemetery',
        text: 'A laundry mark "F.X.O.7" was found in a handkerchief at his last robbery. It was traced to a San Francisco laundry — his downfall.',
        discoveryText: 'A weathered historical marker near the cemetery tells the tale...',
        required: true,
        order: 4,
      },
    ],
    deduction: {
      question: 'How was Black Bart finally caught after 28 robberies?',
      options: [
        { id: 'a', text: 'A posse tracked him to his hideout in the mountains', correct: false, response: 'Black Bart was too clever for posses. He escaped on foot every time — no horse, no accomplices, no trail.' },
        { id: 'b', text: 'He was recognized by a victim in San Francisco', correct: false, response: 'Bart always wore a flour sack mask. No victim ever saw his face during a robbery.' },
        { id: 'c', text: 'A laundry mark on a dropped handkerchief traced to his identity', correct: true, response: 'Correct! At his last robbery near Copperopolis in 1883, Bart dropped a handkerchief with laundry mark "F.X.O.7." Detective Harry Morse traced it to a San Francisco laundry, which led to Charles E. Bolton — respectable mining engineer and secret stagecoach robber.' },
        { id: 'd', text: 'He turned himself in to collect the reward money', correct: false, response: 'A romantic notion, but Bart valued his freedom above all. He was caught — he didn\'t surrender.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_westpoint',
    solvedText: 'You\'ve cracked the case of Black Bart! A gentleman bandit undone by his own handkerchief.',
    historicalNote: 'Charles E. Bolles (Black Bart) was indeed caught via laundry mark F.X.O.7 in 1883. He served 4 years in San Quentin, then vanished completely after release. His hidden loot, if it existed, was never found.',
  },

  // === MOKELUMNE HILL ===
  {
    id: 'mokehill_murders',
    townId: 'mokelumne_hill',
    title: 'Murder Capital of the Mother Lode',
    briefing: 'In 1851, Mokelumne Hill earned the grim title "Murder Capital" — a killing every week for 17 weeks straight. But the last murder broke the pattern. Who was the victim, and why did the killing stop?',
    era: '1851',
    difficulty: 'hard',
    clues: [
      {
        id: 'mh_1',
        attractionId: 'mh_leger',
        text: 'The Hotel Leger\'s original ledger notes: "Room 6 unrentable. Blood stain persists. The French miner died there Nov 12."',
        discoveryText: 'The hotel\'s haunted history tour reveals an original document...',
        required: true,
        order: 1,
      },
      {
        id: 'mh_2',
        attractionId: 'mh_courthouse',
        text: 'Court records show the 17th murder was of a Mexican miner named Dr. Concha — the camp\'s only doctor. After his death, the miners realized they needed him alive.',
        discoveryText: 'Dusty court records in the old courthouse tell a dark story...',
        required: true,
        order: 2,
      },
      {
        id: 'mh_3',
        attractionId: 'mh_cemetery',
        text: 'A gravestone reads: "Dr. Raphael Concha, Healer. His death cured the killing fever." The only headstone with flowers still laid.',
        discoveryText: 'One grave in the overcrowded cemetery stands apart from the rest...',
        required: true,
        order: 3,
      },
      {
        id: 'mh_4',
        attractionId: 'mh_saloon',
        text: 'A posted notice: "Any man who draws steel in this establishment answers to the Vigilance Committee." Dated December 1851 — after the killings stopped.',
        discoveryText: 'Behind the bar, preserved under glass, a vigilante notice...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Why did Mokelumne Hill\'s 17-week murder spree finally end?',
      options: [
        { id: 'a', text: 'The sheriff caught and hanged the serial killer', correct: false, response: 'There was no single killer. The murders were separate incidents — claim disputes, gambling feuds, and racial violence.' },
        { id: 'b', text: 'The army arrived and imposed martial law', correct: false, response: 'The U.S. Army had no presence in Mokelumne Hill. The miners governed themselves — for better or worse.' },
        { id: 'c', text: 'The town\'s only doctor was murdered, and miners realized they needed to stop', correct: true, response: 'Correct! The 17th murder was Dr. Concha, the only physician for miles. The miners realized that without a doctor, the next gunshot wound or mining accident could kill any of them. A vigilance committee formed, and the killing stopped.' },
        { id: 'd', text: 'A massive flood washed away the mining camp', correct: false, response: 'Mokelumne Hill survived floods, fires, and worse. It was the loss of their doctor that changed everything.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_mokehill',
    solvedText: 'The grim tale of Murder Capital is solved. Sometimes it takes losing what you need to appreciate what you had.',
    historicalNote: 'Mokelumne Hill\'s violent 1851 period is documented in multiple Gold Rush era accounts. While the exact details vary, the town did experience extraordinary violence during the mining boom, driven by claim jumping, ethnic tensions, and lawlessness before vigilance committees brought order.',
  },

  // === JACKSON ===
  {
    id: 'jackson_fire',
    townId: 'jackson',
    title: 'The Great Fire of Jackson',
    briefing: 'In August 1862, a devastating fire swept through Jackson, destroying most of the town. It was officially declared an accident. But some evidence suggests it was deliberately set. Who had the most to gain?',
    era: '1862',
    difficulty: 'hard',
    clues: [
      {
        id: 'jf_1',
        attractionId: 'jk_national_hotel',
        text: 'Insurance records show three businesses had suspiciously large policies taken out just weeks before the fire.',
        discoveryText: 'In the hotel\'s historical room, insurance documents from 1862 are displayed...',
        required: true,
        order: 1,
      },
      {
        id: 'jf_2',
        attractionId: 'jk_kennedy_mine',
        text: 'The mine owners needed to reroute the road through town — impossible with the old buildings standing. After the fire, the road was rebuilt exactly where they wanted.',
        discoveryText: 'Old mine survey maps show an interesting before-and-after...',
        required: true,
        order: 2,
      },
      {
        id: 'jf_3',
        attractionId: 'jk_main_street',
        text: 'A surviving letter: "The fire started at precisely 2 AM in three locations simultaneously. No natural fire behaves thus."',
        discoveryText: 'A framed letter in the heritage center catches your eye...',
        required: true,
        order: 3,
      },
      {
        id: 'jf_4',
        attractionId: 'jk_cemetery',
        text: 'The Chinese quarter was the only section untouched by the fire. Suspiciously convenient — or was it the firebreak?',
        discoveryText: 'A historical marker near the cemetery mentions the fire\'s curious boundaries...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'What was the most likely cause of Jackson\'s Great Fire?',
      options: [
        { id: 'a', text: 'An accidental kitchen fire that spread in dry conditions', correct: false, response: 'Three simultaneous ignition points? That\'s no kitchen accident. The evidence points to deliberate action.' },
        { id: 'b', text: 'Mining interests who needed to rebuild the road', correct: true, response: 'Correct! While never officially proven, the circumstantial evidence points to mining interests. Three simultaneous fires, fresh insurance policies, and a road conveniently rerouted through the ashes suggest a profitable "accident."' },
        { id: 'c', text: 'Rival towns trying to eliminate Jackson as a county seat', correct: false, response: 'Jackson\'s rivals had grievances, but arson across town lines would have been nearly impossible to coordinate in 1862.' },
        { id: 'd', text: 'Confederate saboteurs targeting Union gold supplies', correct: false, response: 'While Confederate sympathizers were active in the Mother Lode, the fire\'s beneficiaries were all local business interests, not political actors.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_jackson',
    solvedText: 'The truth behind Jackson\'s ashes is revealed. Where there\'s smoke, there\'s money.',
    historicalNote: 'Jackson suffered multiple devastating fires during the Gold Rush era, common in towns built of wood and canvas. While arson was suspected in some cases, the exact causes remain debated by historians. The town was always rebuilt, eventually with more fire-resistant materials.',
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get mystery for a specific town
 */
export function getMysteryForTown(townId: string): TownMystery | null {
  return TOWN_MYSTERIES.find(m => m.townId === townId) || null
}

/**
 * Get all mysteries
 */
export function getAllMysteries(): TownMystery[] {
  return TOWN_MYSTERIES
}

/**
 * Check if a clue should be revealed when visiting an attraction
 */
export function getClueForAttraction(townId: string, attractionId: string): MysteryClue | null {
  const mystery = getMysteryForTown(townId)
  if (!mystery) return null
  return mystery.clues.find(c => c.attractionId === attractionId) || null
}

/**
 * Check if deduction is unlocked (enough clues found)
 */
export function isDeductionUnlocked(mysteryId: string, cluesFound: string[]): boolean {
  const mystery = TOWN_MYSTERIES.find(m => m.id === mysteryId)
  if (!mystery) return false

  const mysteryCluesFound = mystery.clues.filter(c => cluesFound.includes(c.id))
  return mysteryCluesFound.length >= mystery.deduction.minCluesRequired
}

/**
 * Attempt a deduction
 */
export function attemptDeduction(
  mysteryId: string,
  chosenOptionId: string,
): { correct: boolean; response: string; xpReward: number } {
  const mystery = TOWN_MYSTERIES.find(m => m.id === mysteryId)
  if (!mystery) return { correct: false, response: 'Mystery not found.', xpReward: 0 }

  const option = mystery.deduction.options.find(o => o.id === chosenOptionId)
  if (!option) return { correct: false, response: 'Invalid choice.', xpReward: 0 }

  return {
    correct: option.correct,
    response: option.response,
    xpReward: option.correct ? mystery.xpReward : 0,
  }
}

/**
 * Get mystery progress summary for display
 */
export function getMysteryStatus(
  mysteryId: string,
  cluesFound: string[],
  solved: boolean,
): {
  totalClues: number
  cluesFound: number
  requiredClues: number
  deductionUnlocked: boolean
  solved: boolean
  percentComplete: number
} {
  const mystery = TOWN_MYSTERIES.find(m => m.id === mysteryId)
  if (!mystery) {
    return { totalClues: 0, cluesFound: 0, requiredClues: 0, deductionUnlocked: false, solved: false, percentComplete: 0 }
  }

  const found = mystery.clues.filter(c => cluesFound.includes(c.id)).length
  const total = mystery.clues.length

  return {
    totalClues: total,
    cluesFound: found,
    requiredClues: mystery.deduction.minCluesRequired,
    deductionUnlocked: found >= mystery.deduction.minCluesRequired,
    solved,
    percentComplete: solved ? 100 : Math.round((found / total) * 100),
  }
}
