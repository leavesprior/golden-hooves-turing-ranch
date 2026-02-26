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

  // === SAN ANDREAS ===
  {
    id: 'sanandreas_bart',
    townId: 'san_andreas',
    title: 'The Gentleman Bandit\'s Double Life',
    briefing: 'When Black Bart was finally arrested in San Andreas in 1883, detectives discovered something shocking: he had been living openly in San Francisco as respectable mining consultant "Charles E. Bolton" for years. How did a wanted man hide in plain sight — and who helped him do it?',
    era: '1883',
    difficulty: 'medium',
    clues: [
      {
        id: 'sb_1',
        attractionId: 'sa_courthouse',
        text: 'Court records show Bart gave his occupation as "mining engineer." His San Francisco address: 37 Second Street — a boarding house where he lived for eight years. The landlady said he was "the most gentlemanly lodger we ever had."',
        discoveryText: 'In the preserved courtroom, the original trial transcript sits under glass...',
        required: true,
        order: 1,
      },
      {
        id: 'sb_2',
        attractionId: 'sa_museum',
        text: 'A Wells Fargo detective\'s memo: "Bolton maintains a membership at the American Exchange Hotel club. He dines with businessmen who know him as a respectable citizen. His manners suggest eastern education — possibly Civil War officer background."',
        discoveryText: 'In the museum\'s Wells Fargo exhibit, confidential detective files are on display...',
        required: true,
        order: 2,
      },
      {
        id: 'sb_3',
        attractionId: 'sa_main_street',
        text: 'A letter fragment displayed in a shop window: "The laundry mark F.X.O.7 traced to Ferguson & Bigg, Kearny Street. Only 91 customers. Among them: one C.E. Bolton, address on file. Detective Morse says we have our man."',
        discoveryText: 'A historic reproduction in a Main Street window tells the story of the arrest...',
        required: true,
        order: 3,
      },
      {
        id: 'sb_4',
        attractionId: 'sa_bart_capture',
        text: 'At the capture site, a historical note reads: "Bart/Bolton\'s neighbors reported he often left for weeks on \'mining surveys\' carrying only a flour sack and a walking stick. None suspected. The sack was his mask; the stick, his shotgun."',
        discoveryText: 'At the unmarked capture site, a brass plaque gives final details...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'How did Black Bart hide his true identity for 8 years in plain sight?',
      options: [
        { id: 'a', text: 'He bribed police officials to look the other way', correct: false, response: 'No evidence of bribery exists. Bart\'s genius was simpler — and more brazen.' },
        { id: 'b', text: 'He maintained a convincing false identity as a gentleman professional', correct: true, response: 'Correct! Charles Bolles became Charles E. Bolton, a well-dressed mining consultant who attended church, dined at clubs, and charmed everyone he met. He robbed only in remote foothills far from his San Francisco life. His genteel manner was his perfect cover — no one suspected a stagecoach bandit would be so civilized.' },
        { id: 'c', text: 'He disguised himself with theatrical makeup between robberies', correct: false, response: 'Bart used a flour sack mask during robberies but no theatrical disguise — his real appearance was simply never seen at crime scenes.' },
        { id: 'd', text: 'He had a twin brother who was his alibi for the robberies', correct: false, response: 'No twin. Just one clever man living two completely separate lives in the same state.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_san_andreas',
    solvedText: 'The double life of Charles E. Bolton / Black Bart stands exposed. Gentleman by day, road agent by season.',
    historicalNote: 'Charles E. Bolles (Black Bart) robbed 28 Wells Fargo stagecoaches between 1875 and 1883, always on foot, always politely, never firing his shotgun. He lived openly in San Francisco as mining consultant C.E. Bolton throughout. After 4 years in San Quentin, he was released in 1888 and vanished completely, never to be identified again.',
  },

  // === BOBR RANCH ===
  {
    id: 'bobr_founders',
    townId: 'bobr_ranch',
    title: 'The Cabin\'s First Owner',
    briefing: 'The main cabin at BOBR Ranch was built using timber from Gold Rush-era structures, but records suggest the original homestead here dates to 1852 — and its first occupant vanished under mysterious circumstances. A journal found in the wall cavity raises more questions than it answers.',
    era: '1852',
    difficulty: 'easy',
    clues: [
      {
        id: 'bf_1',
        attractionId: 'bobr_cabin',
        text: 'Carved into a ceiling beam: "J.P. MINER 1852 — GOD WILLING." The original homesteader\'s mark. Cross-referencing county records, "J.P." was Josiah Pryor — and he filed a gold claim on this exact parcel in June 1852.',
        discoveryText: 'Looking up at the exposed ceiling beams in the cabin, you notice old carvings...',
        required: true,
        order: 1,
      },
      {
        id: 'bf_2',
        attractionId: 'bobr_treasure',
        text: 'Along the treasure trail, a rock formation matches a crude map found in a wall cavity. The map shows a buried cache marker, a creek crossing, and a symbol — three circles in a triangle. The same symbol appears in Josiah Pryor\'s 1852 mining claim paperwork.',
        discoveryText: 'Following the treasure trail, one landmark looks oddly deliberate — not natural...',
        required: true,
        order: 2,
      },
      {
        id: 'bf_3',
        attractionId: 'bobr_gold_pan',
        text: 'The gold-panning gravel comes from a specific creek bend on the property. An 1854 Amador County survey notes this bend as "Pryor\'s Diggings — abandoned." The annotation adds: "Pryor departed suddenly spring 1853, whereabouts unknown."',
        discoveryText: 'The panning station has an information placard with old survey details...',
        required: false,
        order: 3,
      },
      {
        id: 'bf_4',
        attractionId: 'bobr_campfire',
        text: 'The campfire ring stones are old — much older than the ranch. Carved on the largest stone: "He who finds this kept his promise." No name. No date. But the style matches 1850s Gold Rush-era markings found throughout Amador County.',
        discoveryText: 'Sitting by the campfire, you examine the ring stones more closely...',
        required: true,
        order: 3,
      },
    ],
    deduction: {
      question: 'What most likely happened to Josiah Pryor, the ranch\'s first homesteader?',
      options: [
        { id: 'a', text: 'He struck it rich and moved to San Francisco in 1853', correct: true, response: 'Correct! County records show a "J. Pryor, miner" purchased a Market Street property in San Francisco in 1853 — consistent with a successful claim sale. He likely buried a portion of his gold at the ranch as insurance before departing, then honored his promise by leaving the map behind for a future discoverer. The Gold Rush rewarded those who moved fast.' },
        { id: 'b', text: 'He was murdered for his claim and buried on the property', correct: false, response: 'The 1854 survey describes the claim as "abandoned" — not disputed or contested. Murder victims\' claims typically became the subject of legal battles, not quiet abandonments.' },
        { id: 'c', text: 'He returned to Ohio and the cabin fell to squatters', correct: false, response: 'The carved stone says "He who finds this kept his promise" — suggesting Pryor left intentionally and on his own terms, not in defeat.' },
        { id: 'd', text: 'He became an outlaw and was arrested in Stockton in 1854', correct: false, response: 'A respectable mining claim and homestead construction suggests a law-abiding man. The San Francisco property purchase points to honest prosperity.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 75,
    badgeId: 'mystery_bobr_ranch',
    solvedText: 'Josiah Pryor\'s story is pieced together. The ranch\'s first owner left on his own terms — and left something behind.',
    historicalNote: 'The Gold Rush of 1848-1855 created thousands of "instant millionaires" who parlayed successful claims into city lots in the booming town of San Francisco. Many miners who struck good pay dirt quickly sold their claims and moved to urban California, leaving behind hastily built homesteads that later became ranches. Amador and Calaveras County records from this period show many such abandoned claims from 1852-1854.',
  },

  // === MURPHYS ===
  {
    id: 'murphys_cavern',
    townId: 'murphys',
    title: 'The Mercer Caverns Conspiracy',
    briefing: 'When Walter Mercer "discovered" the caverns bearing his name in 1885, he filed them as his private property and began charging admission. But local Miwok oral tradition described these caves for generations. And a competitor\'s claim suggests Mercer wasn\'t even the first white explorer. Who really found the Mercer Caverns?',
    era: '1885',
    difficulty: 'medium',
    clues: [
      {
        id: 'mc_1',
        attractionId: 'mu_mercer_caverns',
        text: 'Mercer\'s original discovery affidavit reads: "I, Walter J. Mercer, being thirsty, followed cool air to a hole in the limestone, descended by rope, and found a magnificent cavern. Date: September 23, 1885." Notably absent: any mention of prior knowledge of the site.',
        discoveryText: 'At the cavern entrance, a framed reproduction of the original discovery claim is displayed...',
        required: true,
        order: 1,
      },
      {
        id: 'mc_2',
        attractionId: 'mu_museum',
        text: 'A competing affidavit filed just weeks after Mercer\'s: "John T. Griffin states he explored a cavern matching this description in 1878, seven years prior, with two witnesses, and chose not to file claim believing the land was Miwok sacred ground." The claim was dismissed for lack of documentation.',
        discoveryText: 'In the Murphys Museum, filed legal documents from the 1885 land dispute are on display...',
        required: true,
        order: 2,
      },
      {
        id: 'mc_3',
        attractionId: 'mu_hotel_mitchler',
        text: 'The hotel guest register shows "W.J. Mercer, Prospector" checked in the week before his "discovery." More telling: he roomed with a Miwok guide named Thomas, who was widely known to lead visitors to "spirit caves" in the limestone hills.',
        discoveryText: 'The hotel\'s historic register, preserved behind glass in the lobby, shows an interesting entry...',
        required: true,
        order: 3,
      },
      {
        id: 'mc_4',
        attractionId: 'mu_main_street',
        text: 'A letter in the Murphys historical collection: "Everyone in town knew about the caves. The Miwok had names for them. But Mercer was the first to FILE — and in California, filing is owning. A crying shame, says my husband."',
        discoveryText: 'At the historical society display on Main Street, a letter from an 1885 resident is on display...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'What was the truth behind Walter Mercer\'s "discovery" of Mercer Caverns?',
      options: [
        { id: 'a', text: 'He genuinely discovered the caverns alone while prospecting', correct: false, response: 'The competing affidavit, the Miwok guide he roomed with, and widespread local knowledge all contradict the lone-discoverer story.' },
        { id: 'b', text: 'He was guided to the caves by a Miwok guide and was first to file a legal claim', correct: true, response: 'Correct! Mercer almost certainly knew about the caves through local Miwok knowledge — likely through his guide Thomas. But under California law in 1885, filing first was all that mattered. The caves had been known to Indigenous people and some settlers for years, but Mercer was the first to commercialize them. He built the first tourist infrastructure and ran the caverns profitably until his death.' },
        { id: 'c', text: 'He stole the claim documents from Griffin in 1885', correct: false, response: 'No evidence of document theft. Mercer simply filed before Griffin, who had actively chosen NOT to file believing the land was sacred.' },
        { id: 'd', text: 'He fabricated the caves entirely — they don\'t really exist', correct: false, response: 'Mercer Caverns are very real and still open to visitors today — one of the finest show caves in California.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_murphys',
    solvedText: 'The story of Mercer Caverns is more complicated than the official history admits.',
    historicalNote: 'Mercer Caverns in Murphys, California were commercially opened in 1885 by Walter J. Mercer and have been operated as a tourist attraction ever since. The caves feature impressive calcite formations including stalactites, stalagmites, and aragonite crystals. Indigenous Miwok people of the Calaveras County region did have oral traditions about limestone caves in these hills long before Euro-American settlement.',
  },

  // === MOANING CAVERN ===
  {
    id: 'moaningcavern_bones',
    townId: 'moaning_cavern',
    title: 'The Ancient Dead of Moaning Cavern',
    briefing: 'When Gold Rush miners enlarged the entrance to Moaning Cavern in 1851 to mine guano, they made a grim discovery: ancient human bones at the bottom of a 180-foot shaft, some more than 12,000 years old. Who were these people? And how did their bones end up at the bottom of an inaccessible vertical pit?',
    era: '1851',
    difficulty: 'hard',
    clues: [
      {
        id: 'mcb_1',
        attractionId: 'mc_main_chamber',
        text: 'A museum placard reads: "Paleontological excavation 1922 — Dr. William Sinclair, UC Berkeley: recovered 13+ sets of human remains, all pre-Columbian. Ages ranged from adolescent to elder. Carbon dating (1970s): 8,000-13,000 BP. This is among the oldest human remains found in California."',
        discoveryText: 'In the main chamber, geological and historical placards line the walls...',
        required: true,
        order: 1,
      },
      {
        id: 'mcb_2',
        attractionId: 'mc_spiral_rappel',
        text: 'Looking down the rappel shaft, you see the problem: the pit is nearly vertical with no ledges. It is physically impossible to climb in or out without modern rope equipment. The original discoverers noted: "The bones were at the bottom. No way down except to fall."',
        discoveryText: 'At the rappel point, the sheer vertical drop makes something obvious...',
        required: true,
        order: 2,
      },
      {
        id: 'mcb_3',
        attractionId: 'mc_cave_entrance',
        text: 'A geological survey note: "The cave entrance was significantly smaller in pre-historic times — possibly just a crack wide enough to admit a person sideways. The \'moaning\' sound is caused by wind through this restriction. Theory: accidental falls during cave exploration in the dark."',
        discoveryText: 'At the cave entrance, a survey describes how the opening has changed over millennia...',
        required: true,
        order: 3,
      },
      {
        id: 'mcb_4',
        attractionId: 'mc_gift_shop',
        text: 'A display case shows Miwok ceremonial artifacts found near the cave opening. A docent\'s note: "Local Miwok oral tradition suggests the cave was considered a \'spirit entrance\' — a place where the boundary between worlds was thin. Access was restricted. Falls may have been ritual, accidental, or deliberate sacrifice."',
        discoveryText: 'In the gift shop museum display, artifacts and interpretive notes tell another story...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'How did 13+ ancient human skeletons end up at the bottom of an inaccessible vertical pit?',
      options: [
        { id: 'a', text: 'They were carried down by ancient people using primitive rope systems', correct: false, response: 'The bones were found scattered, not arranged — suggesting falls, not deliberate placement. And carbon dating puts them at 8,000-13,000 years ago, far predating any evidence of rope technology in the region.' },
        { id: 'b', text: 'They fell accidentally through a smaller prehistoric entrance in the dark', correct: true, response: 'Correct! The geological evidence is compelling: the original entrance was much smaller, and the "moaning" sound would have been louder and more eerie, possibly luring curious individuals. In the dark, the vertical shaft would have been invisible. Over thousands of years, multiple people — possibly cave explorers or those drawn by the mysterious sound — fell to their deaths. The remains span 5,000+ years, suggesting repeated accidental tragedies.' },
        { id: 'c', text: 'They were deliberately thrown in as human sacrifice victims', correct: false, response: 'Possible but not the leading theory. The skeletal remains show no evidence of pre-mortem trauma suggesting ritual killing, and the age span of the victims (adolescent to elder) argues against a targeted sacrifice program.' },
        { id: 'd', text: 'They climbed in voluntarily and became trapped', correct: false, response: 'At 180 feet deep, with no footholds, entrapment would mean death by thirst/starvation, not the sudden-impact injuries archaeologists found.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_moaning_cavern',
    solvedText: 'The ancient dead of Moaning Cavern reveal 13,000 years of human curiosity — and its cost.',
    historicalNote: 'Moaning Cavern near Vallecito, California contains one of the oldest documented human remains in North America. The 180-foot vertical pit has yielded skeletal material carbon-dated to between 8,000 and 13,000 years ago. The cave was used as a guano mine during the Gold Rush before its paleontological significance was understood. Today it operates as a show cave and adventure attraction with rappelling available.',
  },

  // === KENNEDY MINE ===
  {
    id: 'kennedy_disaster',
    townId: 'kennedy_mine',
    title: 'The Bulkhead Decision',
    briefing: 'In 1922, the Kennedy Mine in Jackson suffered one of California\'s deadliest mine disasters — 47 men died when lower levels flooded. But a coroner\'s inquest uncovered something troubling: management had been warned about the failing bulkhead weeks before the flood. Why was the warning ignored?',
    era: '1922',
    difficulty: 'hard',
    clues: [
      {
        id: 'kd_1',
        attractionId: 'km_headframe',
        text: 'The Kennedy Mine headframe towers over the site. A placard reads: "At 5,912 feet, the Kennedy was the deepest gold mine in the United States. The lower levels below 3,000 feet required massive pumping systems to stay dry. Pump failure meant flooding within hours."',
        discoveryText: 'Standing at the famous headframe, you read the interpretive marker...',
        required: true,
        order: 1,
      },
      {
        id: 'kd_2',
        attractionId: 'km_museum',
        text: 'Coroner\'s inquest document: "Witness Thomas Mahoney, shift foreman, testified: \'I submitted a written report on February 15, 1922 noting the No. 4 bulkhead showed seepage and required immediate reinforcement. No action was taken.\' The flood occurred February 28, 1922."',
        discoveryText: 'In the Kennedy Mine museum, the original inquest documents are archived...',
        required: true,
        order: 2,
      },
      {
        id: 'kd_3',
        attractionId: 'km_tailings_wheels',
        text: 'The enormous tailings wheels — used to lift waste rock — still stand. A historical note: "Mine management had contracted for new pump equipment in January 1922, but delivery was delayed. Rather than halt operations, management continued working the lower levels. The 47 men who died were all working below the 2,800-foot level."',
        discoveryText: 'At the tailings wheels exhibit, operational records reveal the timeline...',
        required: true,
        order: 3,
      },
      {
        id: 'kd_4',
        attractionId: 'km_memorial',
        text: 'The memorial plaque lists 47 names. Of them, 35 were immigrants — Irish, Welsh, Italian, and Cornish miners. A labor historian\'s note attached: "The coroner\'s jury returned a verdict of \'accidental death\' but recommended criminal negligence charges. No charges were ever filed. The mine reopened three months later."',
        discoveryText: 'At the miners\' memorial, an attached historical analysis gives context...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Why was the foreman\'s warning about the failing bulkhead ignored before the 1922 Kennedy Mine flood?',
      options: [
        { id: 'a', text: 'The warning report was lost in administrative confusion', correct: false, response: 'The foreman testified he submitted a written report. "Lost paperwork" was the company\'s defense — but the coroner\'s inquest found the claim unconvincing given that senior management also toured the lower levels that week.' },
        { id: 'b', text: 'Management prioritized production over safety while waiting for delayed pump equipment', correct: true, response: 'Correct! The inquest evidence points clearly to a production-over-safety decision. New pumps had been ordered but not delivered. Halting operations to fix the bulkhead would have cost weeks of production. Mine management chose to continue working the lower levels and hoped the bulkhead would hold. It did not. The coroner\'s jury recommended criminal negligence charges, but none were filed — a pattern tragically common in early 20th century mining disasters.' },
        { id: 'c', text: 'The foreman exaggerated the danger to force a pay raise negotiation', correct: false, response: 'The foreman lost colleagues in the flood and testified under oath at a coroner\'s inquest. No evidence of ulterior motive — and the bulkhead\'s failure proved his warning accurate.' },
        { id: 'd', text: 'The mine was sabotaged by labor union organizers', correct: false, response: 'The IWW was active in California mining at this time, but no evidence of sabotage was found. The failure was mechanical and foreseeable, not caused by human intervention.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_kennedy_mine',
    solvedText: 'The 47 names on the Kennedy Mine memorial represent a preventable tragedy — a warning ignored for profit.',
    historicalNote: 'The Kennedy Mine in Jackson, California was the deepest gold mine in the United States at 5,912 feet. The February 1922 flood killed 47 miners when a bulkhead failed in the lower levels, flooding the shaft faster than men could escape. The mine had operated continuously since 1856 and produced over $34 million in gold. It closed permanently in 1942 due to wartime restrictions. The headframe and tailings wheels are preserved as California historical landmarks.',
  },

  // === IRONSTONE VINEYARDS ===
  {
    id: 'ironstone_cavallo',
    townId: 'ironstone_vineyards',
    title: 'The Cavallo Nugget Mystery',
    briefing: 'In 1992, workers at Ironstone Vineyards in Murphys uncovered the largest crystalline gold specimen ever found in California — a 44-pound leaf-gold formation now called the "Cavallo Nugget." But old-timers say it wasn\'t the first time gold was found there. And a hidden cellar beneath the winery holds clues to why that earlier discovery was never reported.',
    era: '1992',
    difficulty: 'medium',
    clues: [
      {
        id: 'ic_1',
        attractionId: 'iv_heritage_museum',
        text: 'The Heritage Museum displays the Cavallo Nugget — 44 pounds of crystalline leaf gold, valued at over $1.5 million. The display notes it was found during vineyard excavation in 1992, just 6 feet below the surface. A geologist\'s note: "Formation like this doesn\'t form alone. Where there is one, there are usually others nearby."',
        discoveryText: 'In the Heritage Museum, the magnificent Cavallo Nugget is on display...',
        required: true,
        order: 1,
      },
      {
        id: 'ic_2',
        attractionId: 'iv_underground_cavern',
        text: 'The underground cavern tour reveals the natural cave system beneath the winery. A tour guide\'s placard: "This cavern was used for wine storage as far back as the 1880s. When Kautz family purchased the property in the 1970s, they found evidence of earlier occupation — including a bricked-up alcove that contained rusted mining tools and an unmarked glass jar."',
        discoveryText: 'Deep in the underground cavern, a placard tells the story of what was found here...',
        required: true,
        order: 2,
      },
      {
        id: 'ic_3',
        attractionId: 'iv_tasting_room',
        text: 'A framed document in the tasting room: a 1923 Prohibition-era permit for "medicinal wine storage." The property was then owned by the Bellotti family, who also ran a small dairy. Scrawled in the margin: "Do NOT excavate near the old oak root system." No explanation given.',
        discoveryText: 'In the historic tasting room, framed documents from the Prohibition era line the walls...',
        required: true,
        order: 3,
      },
      {
        id: 'ic_4',
        attractionId: 'iv_concert_grounds',
        text: 'The concert grounds sit atop a filled-in hydraulic mining cut from the 1880s. A geological survey marker reads: "This area was subject to extensive placer and drift mining 1875-1895. All mineral rights reverted to state 1921." If earlier owners found gold here, state mineral rights law would have required them to report — and surrender — the find.',
        discoveryText: 'A geological marker near the concert stage reveals the ground\'s history...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Why was an earlier gold discovery at the Ironstone property likely never officially reported?',
      options: [
        { id: 'a', text: 'The previous owners were unaware they had found gold', correct: false, response: 'The bricked-up alcove with mining tools and the explicit warning "Do NOT excavate near the old oak" suggests deliberate concealment — not ignorance.' },
        { id: 'b', text: 'California mineral rights law required discovered gold to be surrendered to the state', correct: true, response: 'Correct! After California\'s 1921 mineral rights statute, any gold found on private property technically belonged to the state — a fact widely known and widely ignored by small landowners. The Bellotti family\'s Prohibition-era note warning against excavation near the oak tree, combined with the bricked-up mining tools, strongly suggests an earlier find was quietly concealed and pocketed. When the Cavallo Nugget was found in 1992, Ironstone retained it because mineral rights law had changed.' },
        { id: 'c', text: 'They sold the gold secretly to avoid taxation during the Depression', correct: false, response: 'Possible, but tax evasion alone wouldn\'t explain the sealed alcove and the warning note not to excavate — that suggests concealing the location, not just the sale.' },
        { id: 'd', text: 'The gold was actually planted as a tourist attraction stunt', correct: false, response: 'The Cavallo Nugget has been independently authenticated as a genuine natural formation by multiple geological institutions. It is the real thing.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_ironstone_vineyards',
    solvedText: 'The Ironstone property held its golden secret for decades. The Cavallo Nugget may not have been the first — just the first reported.',
    historicalNote: 'The Cavallo Nugget, found at Ironstone Vineyards in 1992, is the largest crystalline gold leaf specimen ever found in California, weighing 44 pounds (equivalent to about 9 pounds of pure gold). Ironstone Vineyards in Murphys, established by the Kautz family, is one of the Sierra Foothills\' most prominent wineries and features a Heritage Museum, underground cavern, and regular concerts. Gold was extensively mined throughout the Calaveras County area from the 1850s onward.',
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

  // === NEVADA CITY ===
  {
    id: 'nevada_city_theater',
    townId: 'nevada_city',
    title: 'The Lost Theatrical Treasure',
    briefing: 'In 1865, Lotta Crabtree — the child star of the Gold Rush — performed at Nevada City\'s theater to a packed house. After the show, a valuable golden locket she wore as a prop vanished from backstage. It was never recovered. Was it stolen, hidden, or lost in the chaos of a Gold Rush boomtown?',
    era: '1865',
    difficulty: 'medium',
    clues: [
      {
        id: 'nc_1',
        attractionId: 'nc_theater',
        text: 'A yellowed backstage inventory reads: "One gold locket, filigree, containing miniature portrait. Property of Miss L. Crabtree. Status after Oct 14 performance: MISSING. Theater manager Mr. Hallam secured all doors during the fire alarm at 10:47 PM."',
        discoveryText: 'Backstage, a framed inventory sheet from 1865 hangs on the wall...',
        required: true,
        order: 1,
      },
      {
        id: 'nc_2',
        attractionId: 'nc_main_street',
        text: 'A newspaper clipping from the Nevada Journal, 1865: "A small fire broke out in the hay barn adjacent to the theater during Miss Crabtree\'s curtain call. All patrons evacuated safely. The fire was extinguished within minutes — cause unknown."',
        discoveryText: 'In a Main Street antique shop, a framed newspaper clipping catches your eye...',
        required: true,
        order: 2,
      },
      {
        id: 'nc_3',
        attractionId: 'nc_firehouse',
        text: 'The Firehouse Museum\'s log for Oct 14, 1865 reads: "Responded to hay barn fire, Broad St. Small blaze, no structural damage. Theater manager Mr. Hallam was first on scene — had left the theater before the fire company arrived. Curious."',
        discoveryText: 'The Firehouse Museum\'s original logbook is open to an interesting page...',
        required: true,
        order: 3,
      },
      {
        id: 'nc_4',
        attractionId: 'nc_broad_street',
        text: 'A letter from Lotta Crabtree\'s tour manager to the Nevada City Theater Company, dated November 1865: "Miss Crabtree does not wish to press charges regarding the missing locket. She suspects Mr. Hallam acted to protect the piece during the fire confusion. She asks only that it be returned quietly."',
        discoveryText: 'A historical display on Broad Street features Gold Rush-era correspondence...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Who hid Lotta Crabtree\'s golden locket, and why?',
      options: [
        { id: 'a', text: 'The theater manager hid it to protect it during the fire', correct: true, response: 'Correct! Mr. Hallam, the theater manager, almost certainly pocketed the locket when the fire alarm sounded — either to protect it from potential looters during the evacuation, or because he started the hay barn fire himself as a distraction to secure the valuable piece. Lotta\'s own letter suggests she believed Hallam acted protectively. The locket was never returned, likely because Hallam died in a mining accident the following year before he could reveal where he\'d hidden it.' },
        { id: 'b', text: 'A rival performer stole it out of jealousy', correct: false, response: 'While theatrical rivalries were fierce in Gold Rush California, the fire alarm and Hallam\'s suspicious movements point to him, not a competing actor.' },
        { id: 'c', text: 'A stagecoach robber broke in during the show', correct: false, response: 'The backstage inventory shows the locket was present at curtain call — it vanished during the fire evacuation, not during the performance.' },
        { id: 'd', text: 'Lotta herself hid it as a publicity stunt', correct: false, response: 'Lotta\'s private letter asking for quiet return suggests genuine concern, not a publicity ploy. She was already famous enough not to need manufactured drama.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_nevada_city',
    solvedText: 'The mystery of Lotta\'s locket is solved! A theater manager\'s protective instinct — or clever theft — left a Gold Rush treasure hidden forever.',
    historicalNote: 'Lotta Crabtree (1847-1924) was the most popular entertainer in Gold Rush California, beginning her career as a child performer in mining camps at age 8. She became one of the wealthiest women in America, leaving an estate of $4 million (over $70 million today) to charity. Nevada City\'s theater was one of many venues where she performed to adoring miners who threw gold nuggets onto the stage.',
  },

  // === GRASS VALLEY ===
  {
    id: 'grass_valley_empire',
    townId: 'grass_valley',
    title: 'The Empire Mine\'s Secret Shaft',
    briefing: 'The Empire Mine in Grass Valley was one of the oldest and richest gold mines in California, operating from 1850 to 1956. But miners whispered about Shaft #7 — sealed in 1890 despite rumors it contained the richest vein ever found. A hundred years later, the reason for the sealing remains officially unexplained.',
    era: '1890',
    difficulty: 'hard',
    clues: [
      {
        id: 'gv_1',
        attractionId: 'gv_empire_mine',
        text: 'A mine engineer\'s report from 1889: "Shaft #7, Level 12. Assay results extraordinary — 4.2 oz/ton, highest grade in the Empire system. However, cross-cut reveals significant displacement along what appears to be an active fault plane. Recommend geological survey before further development."',
        discoveryText: 'In the mine\'s engineering office, preserved reports are displayed under glass...',
        required: true,
        order: 1,
      },
      {
        id: 'gv_2',
        attractionId: 'gv_lola_montez',
        text: 'A diary entry from a miner\'s wife, 1890: "Thomas came home shaking. Said the ground moved in Shaft 7 today. Three timbers cracked like gunshots. The foreman pulled everyone out. Thomas says the gold down there is the richest he\'s ever seen — but the mountain doesn\'t want to give it up."',
        discoveryText: 'At the Lola Montez house museum, personal diaries from mining families are on display...',
        required: true,
        order: 2,
      },
      {
        id: 'gv_3',
        attractionId: 'gv_mill_street',
        text: 'A Grass Valley Union newspaper article, March 1890: "Empire Mine management announced the permanent closure of Shaft #7 citing \'geological instability.\' Company stock dipped 3% on the news. Superintendent William Bourn Jr. stated: \'No amount of gold justifies risking men\'s lives.\' A rare sentiment in California mining."',
        discoveryText: 'A historical newspaper display on Mill Street features the original article...',
        required: true,
        order: 3,
      },
      {
        id: 'gv_4',
        attractionId: 'gv_north_star',
        text: 'A geological survey from 1923 (declassified 1960): "The Wolf Creek Fault bisects the Empire Mine property at depth, passing directly through the former Shaft #7 zone. Seismic activity along this fault has been recorded intermittently since 1887. The 1890 closure decision was geologically sound — continued mining would have risked catastrophic collapse."',
        discoveryText: 'At the North Star Mining Museum, a declassified geological survey tells the full story...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Why was the Empire Mine\'s Shaft #7 permanently sealed in 1890?',
      options: [
        { id: 'a', text: 'An active fault line made it too dangerous despite the gold', correct: true, response: 'Correct! Shaft #7 sat directly on the Wolf Creek Fault, an active geological fault that caused ground movement and timber failures. Despite assay results showing the richest ore in the entire Empire system, Superintendent William Bourn Jr. made the rare decision to prioritize safety over profit. The shaft was sealed with concrete and never reopened. The gold is still there — estimated at tens of millions of dollars — but the mountain keeps its treasure.' },
        { id: 'b', text: 'The vein had played out and the rich ore story was exaggerated', correct: false, response: 'The 1889 assay report showing 4.2 oz/ton was genuine — that\'s extraordinary grade. The gold was real; the danger was also real.' },
        { id: 'c', text: 'Miners believed the shaft was haunted and refused to work', correct: false, response: 'Gold Rush miners were a superstitious lot, but no ghost stories explain the cracking timbers and geological fault evidence. This was science, not superstition.' },
        { id: 'd', text: 'A labor dispute led management to seal it out of spite', correct: false, response: 'Sealing a rich shaft to spite workers would have been financial suicide. Bourn\'s decision cost the company millions — it was made reluctantly, for safety.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_grass_valley',
    solvedText: 'Shaft #7\'s secret is revealed — the richest vein in the Empire, sealed forever by the mountain itself.',
    historicalNote: 'The Empire Mine in Grass Valley operated from 1850 to 1956, producing an estimated 5.8 million ounces of gold — worth over $11 billion at modern prices. Its 367 miles of underground tunnels make it one of the most extensive hard-rock gold mines ever developed. William Bourn Jr., who managed the mine in the 1880s-90s, later built the famous Filoli estate near San Francisco. The mine is now a California State Historic Park.',
  },

  // === ANGELS CAMP (expanded) ===
  {
    id: 'angels_camp_twain_trail',
    townId: 'angels_camp',
    title: 'The Real Dan\'l Webster',
    briefing: 'Mark Twain\'s "The Celebrated Jumping Frog of Calaveras County" launched his career in 1865. The story was based on a tale told to him in an Angels Camp bar. But the identity of the storyteller has been debated for over 150 years. Who really told Twain the frog story — and did Twain almost throw it away?',
    era: '1865',
    difficulty: 'medium',
    clues: [
      {
        id: 'act_1',
        attractionId: 'ac_hotel',
        text: 'The Angels Hotel register shows "S. Clemens" (Twain\'s real name) checked in January 1865. A note in the margin, in different handwriting: "The Missouri writer. Spends his evenings at the bar listening to Ben Coon\'s tales. Says he\'s mining but hasn\'t lifted a pan in weeks."',
        discoveryText: 'The old hotel preserves its guest register under glass...',
        required: true,
        order: 1,
      },
      {
        id: 'act_2',
        attractionId: 'ac_museum',
        text: 'A letter from Twain to his brother Orion, February 1865: "I have heard a curious yarn from a dreary old bore at the bar — something about a frog-jumping contest and buckshot. I may write it up if I can find nothing better. It is a villainous backwoods sketch."',
        discoveryText: 'In the museum\'s Twain collection, a reproduced letter reveals his first impression...',
        required: true,
        order: 2,
      },
      {
        id: 'act_3',
        attractionId: 'ac_main_st',
        text: 'A historical society placard: "Ben Coon was a retired river pilot who tended bar at the Angels Hotel in the 1860s. Known for his deadpan delivery and endless tall tales, Coon was described by Twain as \'monotonous and dull\' — but the stories stuck. Twain\'s notebook from this period identifies Coon by name as the source."',
        discoveryText: 'A Main Street historical display identifies the man behind the tale...',
        required: true,
        order: 3,
      },
      {
        id: 'act_4',
        attractionId: 'ac_creek',
        text: 'A literary historian\'s note posted near the creek: "Twain was asked by Artemus Ward to submit a story for a book. Twain sent the frog story as a last resort, calling it \'a squib\' he dashed off reluctantly. It arrived too late for the book but was published in a New York newspaper instead — and became a national sensation overnight. Twain never forgave himself for almost discarding it."',
        discoveryText: 'By the creek where miners once panned, a literary marker tells a surprising story...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Who told Mark Twain the jumping frog story?',
      options: [
        { id: 'a', text: 'Ben Coon, the bartender at the Angels Hotel', correct: true, response: 'Correct! Ben Coon, a retired river pilot turned bartender, told Twain the tale in his trademark monotonous style during the winter of 1865. Twain\'s own notebooks identify Coon by name. The irony is rich: Twain considered the story worthless — "a villainous backwoods sketch" — and nearly didn\'t write it at all. When he finally did, it was as a throwaway piece for a friend\'s book. It arrived too late, was published separately, and made Twain famous overnight.' },
        { id: 'b', text: 'A drunk miner at the saloon', correct: false, response: 'Twain heard many tales from miners, but his notebooks specifically credit Ben Coon — a bartender, not a miner — for the frog story.' },
        { id: 'c', text: 'Ross Coon, Ben\'s brother', correct: false, response: 'There is no documented brother named Ross Coon in the Angels Camp records. Ben Coon alone is credited in Twain\'s personal notebooks.' },
        { id: 'd', text: 'A traveling salesman passing through town', correct: false, response: 'The story came from a local, not a traveler. Ben Coon was a fixture at the Angels Hotel bar — exactly the kind of source a writer mines for material.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_angels_twain',
    solvedText: 'You\'ve traced the frog story to its source — a monotonous bartender whose tale changed American literature forever.',
    historicalNote: 'Mark Twain almost didn\'t write "The Celebrated Jumping Frog of Calaveras County." He considered it a throwaway piece and submitted it reluctantly to humorist Artemus Ward\'s book. It arrived too late and was published in the New York Saturday Press on November 18, 1865, instead. The story became a national sensation and launched Twain\'s career. He later called it "the best humorous sketch America has produced yet," though he never fully shed his initial embarrassment at its "backwoods" origins.',
  },

  // === MARIPOSA ===
  {
    id: 'mariposa_fremont',
    townId: 'mariposa',
    title: 'Fremont\'s Folly',
    briefing: 'In 1847, John C. Fremont purchased a 44,000-acre Mexican land grant called the Mariposa Grant. He thought he was buying worthless ranchland. Two years later, gold was discovered on it — and the Mariposa Grant became one of the most contested land claims in California history. But there\'s a catch: the original grant was for land 100 miles away. How did Fremont end up with Gold Country?',
    era: '1849',
    difficulty: 'hard',
    clues: [
      {
        id: 'mf_1',
        attractionId: 'mp_courthouse',
        text: 'The Mariposa County Courthouse — the oldest courthouse west of the Rockies — holds records of the Fremont land case. A key document: "The original Mariposa Grant, issued to Juan Bautista Alvarado by Governor Micheltorena in 1844, described a 10-league parcel near the San Joaquin River valley. It contained no fixed boundaries — a \'floating grant\' that could be placed anywhere within the general region."',
        discoveryText: 'In the historic courthouse, the Fremont land case documents are preserved...',
        required: true,
        order: 1,
      },
      {
        id: 'mf_2',
        attractionId: 'mp_museum',
        text: 'A letter from Fremont\'s agent, Thomas Larkin, dated 1847: "I have purchased the Alvarado grant on your behalf for $3,000. The land is unremarkable grazing territory. However, as the grant boundaries are unfixed, they may be surveyed to encompass more favorable terrain should circumstances warrant."',
        discoveryText: 'The Mariposa Museum displays correspondence that reveals the land deal\'s origins...',
        required: true,
        order: 2,
      },
      {
        id: 'mf_3',
        attractionId: 'mp_mine',
        text: 'At the Mariposa Mine site, a historical marker reads: "When gold was discovered in 1849, Fremont\'s agents resurveyed the \'floating\' Mariposa Grant to encompass the gold-bearing foothills — 100 miles from the original intended location. The U.S. Supreme Court upheld this maneuver in 1855 (Fremont v. United States), ruling the vague Mexican grant language permitted the shift."',
        discoveryText: 'At the mine, a historical marker explains the legal maneuver that changed everything...',
        required: true,
        order: 3,
      },
      {
        id: 'mf_4',
        attractionId: 'mp_grove',
        text: 'A historian\'s note at the Mariposa Grove: "Fremont\'s Mariposa Grant made him briefly the richest man in California. He was elected California\'s first U.S. Senator in 1850 and ran for President in 1856 as the first Republican candidate. Yet he died nearly broke in 1890 — the gold ran out, the lawsuits never stopped, and his financial management was catastrophic."',
        discoveryText: 'Near the grove, a biographical marker traces Fremont\'s rise and fall...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'How did John C. Fremont end up with gold-bearing land when his original grant was for worthless ranchland?',
      options: [
        { id: 'a', text: 'His agent moved the floating grant boundaries to include gold areas', correct: true, response: 'Correct! The Mariposa Grant was a "floating grant" — a Mexican land grant with no fixed boundaries, only a general region and acreage. When gold was discovered in 1849, Fremont\'s agents simply resurveyed the grant to encompass the gold-rich Sierra foothills, 100 miles from the original intended location. The U.S. Supreme Court upheld this in 1855, ruling the vague Mexican-era language permitted the shift. It was perfectly legal — and perfectly outrageous.' },
        { id: 'b', text: 'He won the land gambling with Mexican ranchers', correct: false, response: 'Fremont purchased the grant through his agent Thomas Larkin for $3,000 — a straightforward transaction, not a card game.' },
        { id: 'c', text: 'The U.S. government rewarded him with the land for his military service', correct: false, response: 'Fremont was court-martialed by the Army in 1848 for insubordination. The government gave him nothing — he bought the grant privately.' },
        { id: 'd', text: 'He purchased it at fair market value after gold was discovered', correct: false, response: 'Fremont bought the grant in 1847, before gold was discovered. The $3,000 price reflected worthless grazing land. His luck — and his agents\' cunning — turned it into a gold mine.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_mariposa',
    solvedText: 'Fremont\'s Folly revealed — a $3,000 ranch became a gold empire through the legal loophole of a "floating grant."',
    historicalNote: 'John C. Fremont (1813-1890) became California\'s first U.S. Senator in 1850 and was the first Republican presidential candidate in 1856, losing to James Buchanan. His Mariposa Grant, purchased for $3,000, produced millions in gold and made him temporarily one of the richest men in America. Yet Fremont died nearly destitute in 1890, undone by bad investments, endless litigation, and the exhaustion of his mines. The Mariposa County Courthouse, built in 1854, is the oldest courthouse in continuous use west of the Rocky Mountains.',
  },

  // === NEVADA CITY — The Lost Pelton Wheel ===
  {
    id: 'nevada_city_pelton',
    townId: 'nevada_city',
    title: 'The Lost Pelton Wheel',
    briefing: 'In 1878, Lester Pelton invented the Pelton water wheel in Nevada City — a design so efficient it revolutionized hydroelectric power worldwide. But Pelton\'s original prototype, built and tested along Deer Creek, vanished after a patent dispute with rival manufacturers. Where is the wheel that changed the world?',
    era: '1878',
    difficulty: 'hard',
    clues: [
      {
        id: 'ncp_1',
        attractionId: 'nc_deer_creek',
        text: 'Along Deer Creek, a faded survey stake reads: "Pelton Test Site — Water Rights Claim #447, 1877." The creek\'s flow rate at this narrow bend is exactly what Pelton\'s journals describe as ideal for his tests: 200 cubic feet per minute at 20 feet of head.',
        discoveryText: 'Following the creek trail, you notice an old survey stake half-hidden in the brush...',
        required: true,
        order: 1,
      },
      {
        id: 'ncp_2',
        attractionId: 'nc_foundry',
        text: 'A foundry work order from 1878: "One cast-iron wheel, 18 inches, split-bucket design per L. Pelton specifications. RUSH — Mr. Pelton insists on testing before the dry season." A marginal note adds: "Pelton took the wheel. Paid in full. Did not return it to the foundry as agreed."',
        discoveryText: 'In the Miners Foundry archives, a work order stands out among hundreds...',
        required: true,
        order: 2,
      },
      {
        id: 'ncp_3',
        attractionId: 'nc_broad_street',
        text: 'A letter in a Broad Street antique shop, dated 1889: "The patent trial in San Francisco demands the original wheel as evidence. Pelton says he stored it \'somewhere safe in Nevada City\' but cannot recall the exact location. His health is failing. If the wheel is not produced, the Pelton Water Wheel Company may lose the patent to those thieves at the California Hydraulic Company."',
        discoveryText: 'A framed letter in a Broad Street antique shop catches your eye...',
        required: true,
        order: 3,
      },
      {
        id: 'ncp_4',
        attractionId: 'nc_national_hotel',
        text: 'The National Hotel guest register shows "L.A. Pelton, Camptonville" as a regular guest in 1877-78, always requesting a ground-floor room. A bellhop\'s note: "Mr. Pelton stores heavy equipment in the cellar. Does not wish it disturbed." The hotel\'s cellar was bricked up during a 1901 renovation and never fully reopened.',
        discoveryText: 'In the hotel\'s historic guest register, a familiar name appears repeatedly...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Where is Lester Pelton\'s original prototype water wheel most likely hidden?',
      options: [
        { id: 'a', text: 'It was melted down for scrap during the patent dispute', correct: false, response: 'If it had been destroyed, Pelton would have said so during the trial. Instead he said it was "somewhere safe" — suggesting he believed it still existed.' },
        { id: 'b', text: 'In the bricked-up cellar of the National Hotel where Pelton stored equipment', correct: true, response: 'Correct! The evidence converges: Pelton was a regular guest who stored heavy equipment in the hotel cellar. The cellar was bricked up in 1901, and its full contents were never catalogued. Pelton\'s failing memory in 1889 prevented him from directing anyone to the wheel. He won the patent case anyway — on the strength of witness testimony and the foundry work order — but the original 18-inch split-bucket prototype that changed the world likely still sits behind brick in the National Hotel\'s sealed cellar.' },
        { id: 'c', text: 'At the bottom of Deer Creek where it fell during testing', correct: false, response: 'An 18-inch cast-iron wheel would be heavy but recoverable from a shallow creek. Pelton explicitly said he stored it — it didn\'t fall.' },
        { id: 'd', text: 'Pelton took it to San Francisco for the patent trial', correct: false, response: 'The 1889 letter makes clear that Pelton could NOT produce the wheel for the trial. He said it was in Nevada City but couldn\'t remember exactly where.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_pelton_wheel',
    solvedText: 'The Lost Pelton Wheel may still be waiting behind brick in a hotel cellar — the forgotten prototype that powered the modern world.',
    historicalNote: 'Lester Allan Pelton (1829-1908) developed the Pelton water wheel in Nevada City and Camptonville, California in the late 1870s. His split-bucket design achieved 90% efficiency — a dramatic improvement over previous water wheels — and became the foundation of hydroelectric power generation. Pelton won a critical patent case in 1889, and the Pelton Water Wheel Company (later absorbed by General Electric) manufactured wheels used in power plants worldwide. The original prototype has never been conclusively located.',
  },

  // === GRASS VALLEY — Empire's Hidden Vault ===
  {
    id: 'grass_valley_vault',
    townId: 'grass_valley',
    title: 'Empire\'s Hidden Vault',
    briefing: 'Legend persists that a sealed chamber deep in the Empire Mine contains the mine owner\'s personal gold reserve, hidden during a bitter labor dispute in 1869. When miners threatened to seize the works, Superintendent William Magee allegedly sealed a vault of refined gold behind a false wall. The mine closed in 1956 — but no vault was ever found.',
    era: '1869',
    difficulty: 'hard',
    clues: [
      {
        id: 'gvv_1',
        attractionId: 'gv_empire_mine',
        text: 'In the mine superintendent\'s office, a journal entry from William Magee, dated June 1869: "The union men grow bold. Have taken precautions with the refined reserves — moved to a location only I and Bourn know. If the worst occurs, the company\'s future is secured. Map enclosed under separate cover." No map was ever found among Magee\'s papers.',
        discoveryText: 'In the superintendent\'s preserved office, a journal under glass reveals a secret...',
        required: true,
        order: 1,
      },
      {
        id: 'gvv_2',
        attractionId: 'gv_holbrooke',
        text: 'A miner\'s diary displayed at the Holbrooke Hotel bar, dated July 1869: "The strike collapsed after three weeks. Magee showed the new ore car schedules and claimed the gold had been shipped to San Francisco. But Cornish Tom swears he saw Magee and two Chinese laborers sealing a drift on Level 4 at midnight. They carried no ore out — only mortar and brick."',
        discoveryText: 'Behind the bar at the Holbrooke, a framed diary page tells a provocative story...',
        required: true,
        order: 2,
      },
      {
        id: 'gvv_3',
        attractionId: 'gv_north_star',
        text: 'A cross-referenced mine survey from the North Star Mining Museum shows Level 4 of the Empire Mine had three known drifts — but structural analysis in 1923 detected a fourth void behind the west wall of Drift C. The surveyor\'s note: "Anomalous cavity detected. Not on original plans. Approximately 8 feet by 12 feet. Not investigated — Level 4 is flooded."',
        discoveryText: 'At the North Star Museum, a structural survey report reveals something hidden...',
        required: true,
        order: 3,
      },
      {
        id: 'gvv_4',
        attractionId: 'gv_mill_street',
        text: 'A Grass Valley Union article from 1870: "The labor dispute at Empire Mine resolved amicably with a 10% wage increase. Superintendent Magee announced full gold production resumed and all reserves accounted for. Mr. William Bourn Sr. expressed satisfaction from San Francisco." An editor\'s marginal note, unpublished: "Magee is lying. The assay office numbers don\'t match. 400 ounces unaccounted for."',
        discoveryText: 'A historical newspaper display on Mill Street includes an editor\'s unpublished margin note...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Where is the Empire Mine owner\'s hidden gold reserve most likely sealed?',
      options: [
        { id: 'a', text: 'Behind a false wall in Drift C on Level 4, now flooded', correct: true, response: 'Correct! The evidence aligns: Magee\'s journal mentions securing refined reserves; a miner witnessed midnight sealing on Level 4; and a 1923 structural survey detected an unexplained 8-by-12-foot void behind Drift C. The vault was never opened because Level 4 flooded after the mine closed in 1956. Four hundred ounces of refined gold — worth over $900,000 today — may still be sealed behind brick and mortar, submerged in groundwater 2,000 feet below the surface.' },
        { id: 'b', text: 'The gold was secretly shipped to San Francisco during the strike', correct: false, response: 'The newspaper editor noted that assay numbers didn\'t match — 400 ounces were unaccounted for. If shipped, the discrepancy would have been resolved in San Francisco ledgers.' },
        { id: 'c', text: 'Magee buried it on the surface somewhere on the mine property', correct: false, response: 'A surface burial would have been too risky with striking miners watching the property. Magee used his access to the underground workings — the one place strikers couldn\'t go.' },
        { id: 'd', text: 'The vault story is a myth — the gold was simply in the regular safe', correct: false, response: 'Magee\'s own journal and the midnight sealing witnessed by Cornish Tom go beyond myth. The 1923 survey\'s unexplained void is physical evidence.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_empire_vault',
    solvedText: 'The Empire\'s Hidden Vault lies flooded and sealed on Level 4 — 400 ounces of gold, waiting in the dark since 1869.',
    historicalNote: 'The Empire Mine in Grass Valley experienced several labor disputes during its 106-year history (1850-1956). The mine\'s 367 miles of tunnels descend to 5,912 feet, with many lower levels permanently flooded after closure. The mine produced an estimated 5.8 million ounces of gold — worth over $11 billion at modern prices. It is now a California State Historic Park. Whether any hidden vault exists on Level 4 has never been conclusively determined, as the lower levels remain inaccessible.',
  },

  // === ANGELS CAMP (Old Town) — Twain's Lost Notebook ===
  {
    id: 'angels_camp_notebook',
    townId: 'angels_camp_expanded',
    title: 'Twain\'s Lost Notebook',
    briefing: 'During his winter in Angels Camp in 1864-65, Mark Twain filled several pocket notebooks with stories, character sketches, and observations. Most survived to become treasures of American literature. But one notebook — the one he was writing in the week before he left Angels Camp — was never found among his papers. What happened to it?',
    era: '1865',
    difficulty: 'medium',
    clues: [
      {
        id: 'acn_1',
        attractionId: 'ace_ross_saloon',
        text: 'A historical society reconstruction of the saloon includes a placard: "Twain was known to leave personal items at the bar — his hat, his pipe, and once \'a small leather book\' which the bartender held for three days before Twain collected it. Ben Coon complained: \'That writer leaves more behind than he takes.\'"',
        discoveryText: 'At the saloon site, a historical placard mentions Twain\'s forgetful habits...',
        required: true,
        order: 1,
      },
      {
        id: 'acn_2',
        attractionId: 'ace_museum',
        text: 'A letter from Twain to his brother Orion, March 1865: "I have lost the damned notebook — the one with the Coon stories and the description of that infernal rain. I suspect I left it at the hotel or possibly at the bar. I have written to both establishments requesting its return. The stories in it are rough but contain seeds that may grow."',
        discoveryText: 'In the museum\'s Twain collection, a letter reveals the missing notebook...',
        required: true,
        order: 2,
      },
      {
        id: 'acn_3',
        attractionId: 'ace_twain_cabin',
        text: 'A list of Twain\'s known notebooks, compiled by the Mark Twain Project at UC Berkeley, identifies "Notebook 4a (Angels Camp, Jan-Feb 1865)" as "missing, presumed lost." A footnote: "References in Twain\'s correspondence suggest Notebook 4a contained early versions of material later reworked for \'Roughing It\' and the jumping frog story. Its recovery would be a significant literary find."',
        discoveryText: 'At the cabin replica, a scholarly poster catalogs Twain\'s notebooks...',
        required: true,
        order: 3,
      },
      {
        id: 'acn_4',
        attractionId: 'ace_main_street',
        text: 'A 1920s oral history from the Angels Camp Historical Society: "Old Mrs. Rutherford, who cleaned rooms at the Angels Hotel in the 1860s, told her grandchildren she once found \'a little leather book full of scribbles\' under a mattress after a guest departed. She could not read well and kept it in her family Bible. The Bible was donated to the Methodist church in 1910, but no notebook was catalogued with it."',
        discoveryText: 'In a Main Street historical display, an oral history from the 1920s mentions a curious find...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'What most likely happened to Twain\'s lost Angels Camp notebook?',
      options: [
        { id: 'a', text: 'Twain destroyed it himself, dissatisfied with the contents', correct: false, response: 'Twain\'s letter to Orion shows he valued the notebook\'s contents and actively tried to recover it. He called the stories "seeds that may grow" — not trash to be burned.' },
        { id: 'b', text: 'It was found by a hotel maid and preserved in a family Bible, now lost in a church collection', correct: true, response: 'Correct! The evidence trail points to Mrs. Rutherford finding the notebook under a mattress at the Angels Hotel after Twain\'s departure. Unable to read the scribbles, she kept it in her family Bible. When the Bible was donated to the Methodist church in 1910, the notebook was either overlooked during cataloguing or separated from the Bible. A pocket notebook tucked into a donated Bible in a small-town church — it could still be sitting in a storage box somewhere, unrecognized. The literary world holds its breath.' },
        { id: 'c', text: 'Ben Coon kept it as a souvenir and it was buried with him', correct: false, response: 'Coon was the storyteller, not a thief. And Twain wrote to "both establishments" — the hotel and the bar — suggesting Coon would have returned it if he had it.' },
        { id: 'd', text: 'It was stolen by a rival writer who plagiarized the contents', correct: false, response: 'No published work from the period matches the described contents of Notebook 4a closely enough to suggest plagiarism. The notebook simply disappeared.' },
      ],
      minCluesRequired: 2,
    },
    xpReward: 100,
    badgeId: 'mystery_twain_notebook',
    solvedText: 'Twain\'s lost notebook may still be waiting in a church storage room — a literary treasure hiding in plain sight.',
    historicalNote: 'Mark Twain kept detailed pocket notebooks throughout his life. The Mark Twain Project at UC Berkeley has catalogued and published most of them. Twain\'s Angels Camp period (winter 1864-65) produced some of his most important early material, including the jumping frog story that launched his career. Several notebooks from this period survive, but gaps in the sequence suggest at least one is missing. Whether it was lost, destroyed, or remains undiscovered is unknown.',
  },

  // === MARIPOSA — Fremont's Fortune ===
  {
    id: 'mariposa_fortune',
    townId: 'mariposa',
    title: 'Fremont\'s Fortune',
    briefing: 'John C. Fremont\'s Mariposa land grant made him the richest man in California — briefly. After lawsuits, bad investments, and political ruin, Fremont departed Mariposa nearly broke. But local legend insists he buried a chest of gold coins on the estate before leaving, intending to return. He never did. Where is Fremont\'s fortune?',
    era: '1861',
    difficulty: 'hard',
    clues: [
      {
        id: 'mff_1',
        attractionId: 'mp_courthouse',
        text: 'In the courthouse archives, a deposition from Fremont\'s Mariposa estate manager, Marcus Whitfield, dated 1862: "Colonel Fremont instructed me to prepare two strongboxes for transport. One was loaded onto the wagon bound for Stockton. The second, he said, would \'remain on the property against future need.\' I was not told where it was placed. The Colonel left that evening and did not return."',
        discoveryText: 'In the courthouse archives, a deposition from Fremont\'s estate manager reveals a secret...',
        required: true,
        order: 1,
      },
      {
        id: 'mff_2',
        attractionId: 'mp_museum',
        text: 'A Mariposa Museum exhibit displays a partial inventory of Fremont\'s assets at departure, compiled by creditors in 1863: "Two strongboxes documented. One received in Stockton, contents: $8,400 in gold coin. Second box: not located. Estate manager claims ignorance. Property searched by creditors — nothing found. Estimated contents: $5,000-$12,000 in gold coin."',
        discoveryText: 'In the museum\'s Fremont exhibit, a creditor\'s inventory reveals a discrepancy...',
        required: true,
        order: 2,
      },
      {
        id: 'mff_3',
        attractionId: 'mp_fremont_site',
        text: 'At the Fremont estate grounds, a stone foundation includes an unusual feature: a cellar entrance sealed with hand-cut granite blocks, different from the local fieldstone used elsewhere. A historian\'s note: "This granite matches stone quarried from the Mariposa Mine waste rock pile, not local building stone. The sealing appears deliberate and was done with mortar of a type consistent with 1860s construction. The cellar has never been fully excavated."',
        discoveryText: 'At the estate grounds, a sealed cellar entrance catches your attention...',
        required: true,
        order: 3,
      },
      {
        id: 'mff_4',
        attractionId: 'mp_mining_museum',
        text: 'A display at the Mining and Mineral Museum includes a letter from Fremont to his wife Jessie, dated December 1861: "I have made arrangements for our future security in Mariposa that no creditor can seize. The law protects what is buried on one\'s own land — I learned this much from the Mexican grants. When the time is right, we will return and retrieve what is ours." Fremont lost the Mariposa property to creditors in 1863 and never returned.',
        discoveryText: 'At the Mining Museum, a personal letter from Fremont to Jessie speaks of hidden security...',
        required: false,
        order: 4,
      },
    ],
    deduction: {
      question: 'Where did John C. Fremont most likely hide his second strongbox of gold coins?',
      options: [
        { id: 'a', text: 'In the sealed granite cellar on the estate grounds', correct: true, response: 'Correct! The evidence converges on the estate cellar: Fremont told his manager the second box would "remain on the property." The cellar was sealed with mine-quarried granite — not local stone — suggesting deliberate concealment rather than routine construction. Fremont\'s letter to Jessie confirms he buried something on the property, believing it legally protected. When he lost the land to creditors in 1863, the sealed cellar was apparently overlooked during the property search. The estimated $5,000-$12,000 in 1862 gold coins would be worth $200,000-$500,000 today.' },
        { id: 'b', text: 'He took it to San Francisco and spent it on his presidential campaign debts', correct: false, response: 'Only one strongbox arrived in Stockton — the creditors\' inventory confirms the second was never accounted for. And Fremont\'s debts far exceeded what one box could cover.' },
        { id: 'c', text: 'The estate manager Whitfield found it and kept it for himself', correct: false, response: 'Whitfield testified he was "not told where it was placed." He remained in Mariposa as a respected citizen for decades — consistent with honesty, not secret wealth.' },
        { id: 'd', text: 'It was found by creditors and the records were lost', correct: false, response: 'The 1863 creditor inventory specifically notes "Second box: not located." If found, it would have been documented and applied against Fremont\'s debts.' },
      ],
      minCluesRequired: 3,
    },
    xpReward: 150,
    badgeId: 'mystery_fremont_fortune',
    solvedText: 'Fremont\'s Fortune lies beneath granite in a sealed cellar — a strongbox of gold coins buried by California\'s most controversial pioneer.',
    historicalNote: 'John C. Fremont (1813-1890) purchased the 44,000-acre Mariposa Grant for $3,000 in 1847. Gold discoveries made him briefly the richest man in California. He served as one of California\'s first U.S. Senators, ran for President as the first Republican candidate in 1856, and served as a Union general in the Civil War. Financial mismanagement, lawsuits, and bad investments cost him everything. He lost the Mariposa property to creditors in the 1860s and died nearly destitute in New York in 1890. Whether he actually buried gold on the property is a persistent Mariposa County legend that has never been confirmed or disproven.',
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
