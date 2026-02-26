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
