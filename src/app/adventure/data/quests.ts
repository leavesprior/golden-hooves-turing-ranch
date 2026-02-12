import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'

// ============================================
// QUEST SYSTEM — Fallout-style multi-path quests
// 2 quests per chapter, each with multiple completion paths
// ============================================

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed'
export type ObjectiveType = 'talk' | 'travel' | 'item' | 'clue' | 'skill_check' | 'choice'

export interface QuestObjective {
  id: string
  description: string
  type: ObjectiveType
  target: string // NPC ID, location ID, item ID, or clue ID
  optional?: boolean
  completed?: boolean
  // For skill_check objectives
  stat?: StatName
  dc?: number
}

export interface QuestReward {
  xp: number
  gold?: number
  karma?: { lawful?: number; good?: number }
  reputation?: { faction: FactionId; amount: number }[]
  unlockLocation?: string
  setFlag?: string
  item?: string
}

export interface QuestPath {
  id: string
  name: string // e.g. "The Lawful Path", "The Outlaw's Way"
  description: string
  objectives: QuestObjective[]
  reward: QuestReward
  failureConsequence?: {
    reputation?: { faction: FactionId; amount: number }[]
    karma?: { lawful?: number; good?: number }
  }
}

export interface Quest {
  id: string
  chapter: number
  title: string
  description: string
  giver: string // NPC ID who gives the quest
  giverLocation: string // Location ID where quest starts
  paths: QuestPath[] // Multiple completion paths
  prerequisite?: {
    questId?: string // Must complete this quest first
    flag?: string
    minReputation?: { faction: FactionId; level: number }
  }
}

// ============================================
// CHAPTER 1: THE JOURNEY WEST
// ============================================

const CH1_QUEST_STOLEN_SUPPLIES: Quest = {
  id: 'ch1_stolen_supplies',
  chapter: 1,
  title: 'The Stolen Supplies',
  description:
    'Crates of flour, salted pork, and medicine have vanished from the wagon train overnight. ' +
    'Captain Shaw is furious — without those supplies, families will starve before Fort Laramie. ' +
    'Tracks lead toward the Platte Bridge, but Silas Crooke claims he saw nothing.',
  giver: 'ch1_wagonmaster', // Captain Josiah Shaw
  giverLocation: 'ch1_fort_kearny',
  paths: [
    // === PATH A: The Lawful Path ===
    {
      id: 'ch1_stolen_lawful',
      name: 'The Lawful Path',
      description:
        'Investigate the theft properly, gather evidence, and bring the thief to justice at Fort Kearny.',
      objectives: [
        {
          id: 'ch1_ss_law_1',
          description: 'Speak with Lt. Grattan at Fort Kearny about the stolen supplies',
          type: 'talk',
          target: 'ch1_commander',
        },
        {
          id: 'ch1_ss_law_2',
          description: 'Search the wagon camp for tracks (Expertise check)',
          type: 'skill_check',
          target: 'ch1_fort_kearny',
          stat: 'Expertise',
          dc: 10,
        },
        {
          id: 'ch1_ss_law_3',
          description: 'Travel to Platte Bridge and confront Silas Crooke',
          type: 'travel',
          target: 'ch1_platte_bridge',
        },
        {
          id: 'ch1_ss_law_4',
          description: 'Catch Crooke in a lie (Shrewdness check)',
          type: 'skill_check',
          target: 'ch1_toll_collector',
          stat: 'Shrewdness',
          dc: 12,
        },
        {
          id: 'ch1_ss_law_5',
          description: 'Recover the supplies from Crooke\'s hidden cache',
          type: 'item',
          target: 'stolen_supply_crates',
        },
      ],
      reward: {
        xp: 75,
        gold: 15,
        karma: { lawful: 10, good: 5 },
        reputation: [
          { faction: 'pinkerton', amount: 15 },
          { faction: 'settlers', amount: 10 },
        ],
        setFlag: 'ch1_crooke_arrested',
      },
      failureConsequence: {
        reputation: [{ faction: 'settlers', amount: -5 }],
        karma: { lawful: -3 },
      },
    },

    // === PATH B: The Diplomat's Way ===
    {
      id: 'ch1_stolen_diplomatic',
      name: 'The Diplomat\'s Way',
      description:
        'The thief is desperate, not evil. Find out why they stole and negotiate the supplies back without bloodshed.',
      objectives: [
        {
          id: 'ch1_ss_dip_1',
          description: 'Ask Dutch Bill at Blue River if he saw anyone hauling crates',
          type: 'talk',
          target: 'ch1_ferryman',
        },
        {
          id: 'ch1_ss_dip_2',
          description: 'Travel to Platte Bridge to find the thief',
          type: 'travel',
          target: 'ch1_platte_bridge',
        },
        {
          id: 'ch1_ss_dip_3',
          description: 'Learn Crooke\'s reason for stealing (Diplomacy check)',
          type: 'skill_check',
          target: 'ch1_toll_collector',
          stat: 'Diplomacy',
          dc: 10,
        },
        {
          id: 'ch1_ss_dip_4',
          description: 'Negotiate the return of supplies — Crooke keeps enough to survive',
          type: 'choice',
          target: 'negotiate_split',
        },
      ],
      reward: {
        xp: 60,
        gold: 5,
        karma: { lawful: 2, good: 10 },
        reputation: [
          { faction: 'settlers', amount: 10 },
          { faction: 'outlaws', amount: 5 },
        ],
        setFlag: 'ch1_crooke_spared',
      },
      failureConsequence: {
        reputation: [{ faction: 'settlers', amount: -10 }],
        karma: { good: -5 },
      },
    },

    // === PATH C: The Outlaw's Way ===
    {
      id: 'ch1_stolen_chaotic',
      name: 'The Outlaw\'s Way',
      description:
        'Who cares who stole what? The Hooded Figure knows where a bigger stash is hidden. ' +
        'Steal replacement supplies from the Army storehouse at Fort Kearny.',
      objectives: [
        {
          id: 'ch1_ss_out_1',
          description: 'Speak with the Hooded Figure in Independence',
          type: 'talk',
          target: 'ch1_mysterious',
        },
        {
          id: 'ch1_ss_out_2',
          description: 'Sneak into the Army storehouse at night (Agility check)',
          type: 'skill_check',
          target: 'ch1_fort_kearny',
          stat: 'Agility',
          dc: 14,
        },
        {
          id: 'ch1_ss_out_3',
          description: 'Steal replacement supplies without getting caught',
          type: 'item',
          target: 'army_supply_crates',
        },
        {
          id: 'ch1_ss_out_4',
          description: 'Deliver the stolen Army crates to the wagon train',
          type: 'choice',
          target: 'deliver_stolen_goods',
        },
      ],
      reward: {
        xp: 80,
        gold: 25,
        karma: { lawful: -15, good: -5 },
        reputation: [
          { faction: 'outlaws', amount: 15 },
          { faction: 'pinkerton', amount: -10 },
        ],
        setFlag: 'ch1_army_robbed',
      },
      failureConsequence: {
        reputation: [
          { faction: 'pinkerton', amount: -20 },
          { faction: 'settlers', amount: -5 },
        ],
        karma: { lawful: -10 },
      },
    },
  ],
}

const CH1_QUEST_PAWNEE_TREATY: Quest = {
  id: 'ch1_pawnee_treaty',
  chapter: 1,
  title: 'The Pawnee Treaty',
  description:
    'Chief Talking Bear has watched wagon trains trample Pawnee hunting grounds for years. ' +
    'He will allow safe passage — but only if the settlers prove they can be trusted. ' +
    'Marie Whitehawk says the Chief needs a gesture of good faith, not just words.',
  giver: 'ch1_chief', // Chief Talking Bear
  giverLocation: 'ch1_pawnee_camp',
  prerequisite: {
    minReputation: { faction: 'natives', level: -25 },
  },
  paths: [
    // === PATH A: Fair Trade (Good) ===
    {
      id: 'ch1_treaty_fair',
      name: 'The Fair Trade',
      description:
        'Trade honestly with the Pawnee. Bring supplies they actually need and negotiate terms both sides can honor.',
      objectives: [
        {
          id: 'ch1_pt_fair_1',
          description: 'Speak with Marie Whitehawk about what the Pawnee need',
          type: 'talk',
          target: 'ch1_trader',
        },
        {
          id: 'ch1_pt_fair_2',
          description: 'Acquire medicine and iron tools from Ezra Finch in Independence',
          type: 'item',
          target: 'trade_goods_medicine',
        },
        {
          id: 'ch1_pt_fair_3',
          description: 'Travel to Pawnee Village with the trade goods',
          type: 'travel',
          target: 'ch1_pawnee_camp',
        },
        {
          id: 'ch1_pt_fair_4',
          description: 'Present the trade goods honestly to Chief Talking Bear (Diplomacy check)',
          type: 'skill_check',
          target: 'ch1_chief',
          stat: 'Diplomacy',
          dc: 10,
        },
      ],
      reward: {
        xp: 80,
        gold: 10,
        karma: { lawful: 5, good: 15 },
        reputation: [
          { faction: 'natives', amount: 25 },
          { faction: 'settlers', amount: 5 },
        ],
        setFlag: 'ch1_pawnee_allied',
        item: 'pawnee_talisman',
      },
      failureConsequence: {
        reputation: [{ faction: 'natives', amount: -10 }],
        karma: { good: -5 },
      },
    },

    // === PATH B: The Trickster (Evil) ===
    {
      id: 'ch1_treaty_trick',
      name: 'The Trickster\'s Bargain',
      description:
        'Trick the Pawnee with worthless goods dressed up as valuables. ' +
        'They won\'t know the difference until you\'re long gone.',
      objectives: [
        {
          id: 'ch1_pt_trick_1',
          description: 'Buy cheap trade goods and fake medicine from the Hooded Figure',
          type: 'talk',
          target: 'ch1_mysterious',
        },
        {
          id: 'ch1_pt_trick_2',
          description: 'Disguise the worthless goods to look valuable (Shrewdness check)',
          type: 'skill_check',
          target: 'ch1_independence',
          stat: 'Shrewdness',
          dc: 12,
        },
        {
          id: 'ch1_pt_trick_3',
          description: 'Present the fake goods to Chief Talking Bear without detection (Luck check)',
          type: 'skill_check',
          target: 'ch1_chief',
          stat: 'Luck',
          dc: 14,
        },
      ],
      reward: {
        xp: 60,
        gold: 30,
        karma: { lawful: -5, good: -20 },
        reputation: [
          { faction: 'outlaws', amount: 10 },
        ],
        setFlag: 'ch1_pawnee_tricked',
      },
      failureConsequence: {
        reputation: [
          { faction: 'natives', amount: -30 },
          { faction: 'settlers', amount: -10 },
        ],
        karma: { good: -10, lawful: -5 },
      },
    },

    // === PATH C: Common Enemy (Neutral) ===
    {
      id: 'ch1_treaty_enemy',
      name: 'The Common Enemy',
      description:
        'Running Deer, the Army scout, knows that Pawnee raiders have been attacking wagons — ' +
        'but they\'re not Pawnee at all. Expose the real attackers to earn the Chief\'s trust.',
      objectives: [
        {
          id: 'ch1_pt_enemy_1',
          description: 'Speak with Running Deer at Fort Kearny about the raids',
          type: 'talk',
          target: 'ch1_scout',
        },
        {
          id: 'ch1_pt_enemy_2',
          description: 'Travel to Platte Bridge and search for evidence of the fake raiders',
          type: 'travel',
          target: 'ch1_platte_bridge',
        },
        {
          id: 'ch1_pt_enemy_3',
          description: 'Find disguises used by the fake raiders (Expertise check)',
          type: 'skill_check',
          target: 'ch1_platte_bridge',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch1_pt_enemy_4',
          description: 'Collect the Pawnee costume evidence',
          type: 'clue',
          target: 'fake_pawnee_disguise',
        },
        {
          id: 'ch1_pt_enemy_5',
          description: 'Present evidence to Chief Talking Bear',
          type: 'talk',
          target: 'ch1_chief',
        },
      ],
      reward: {
        xp: 90,
        karma: { lawful: 5, good: 5 },
        reputation: [
          { faction: 'natives', amount: 20 },
          { faction: 'pinkerton', amount: 10 },
          { faction: 'settlers', amount: 5 },
        ],
        setFlag: 'ch1_false_raiders_exposed',
      },
      failureConsequence: {
        reputation: [
          { faction: 'natives', amount: -5 },
          { faction: 'pinkerton', amount: -5 },
        ],
      },
    },
  ],
}

// ============================================
// CHAPTER 2: VOLCANO, CALIFORNIA
// ============================================

const CH2_QUEST_MISSING_MINER: Quest = {
  id: 'ch2_missing_miner',
  chapter: 2,
  title: 'The Missing Miner',
  description:
    'Red Jack Mulligan\'s best man, a miner named Ezekiel "Zeke" Thorn, went to the Pioneer Cemetery ' +
    'three days ago to pay respects to a dead friend and never came back. Red Jack suspects foul play — ' +
    'Zeke had just struck a promising vein and someone may have wanted him gone.',
  giver: 'ch2_foreman', // Red Jack Mulligan
  giverLocation: 'ch2_miners_camp',
  paths: [
    // === PATH A: The Detective ===
    {
      id: 'ch2_miner_detective',
      name: 'The Detective\'s Method',
      description:
        'Investigate Zeke\'s disappearance step by step. Interview witnesses, examine the crime scene, follow the evidence.',
      objectives: [
        {
          id: 'ch2_mm_det_1',
          description: 'Examine Zeke\'s belongings at the Miner\'s Camp for clues (Shrewdness check)',
          type: 'skill_check',
          target: 'ch2_miners_camp',
          stat: 'Shrewdness',
          dc: 10,
        },
        {
          id: 'ch2_mm_det_2',
          description: 'Travel to the Pioneer Cemetery to search for signs of struggle',
          type: 'travel',
          target: 'ch2_cemetery',
        },
        {
          id: 'ch2_mm_det_3',
          description: 'Question Silent Pete about what he saw that night',
          type: 'talk',
          target: 'ch2_gravedigger',
        },
        {
          id: 'ch2_mm_det_4',
          description: 'Track footprints from the cemetery (Expertise check)',
          type: 'skill_check',
          target: 'ch2_cemetery',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch2_mm_det_5',
          description: 'Follow the trail to St. George Hotel and confront the kidnapper',
          type: 'travel',
          target: 'ch2_st_george',
        },
        {
          id: 'ch2_mm_det_6',
          description: 'Rescue Zeke from the hotel basement',
          type: 'item',
          target: 'rescue_zeke',
        },
      ],
      reward: {
        xp: 85,
        gold: 20,
        karma: { lawful: 10, good: 10 },
        reputation: [
          { faction: 'settlers', amount: 15 },
          { faction: 'pinkerton', amount: 10 },
        ],
        setFlag: 'ch2_zeke_rescued_lawfully',
      },
      failureConsequence: {
        reputation: [{ faction: 'settlers', amount: -10 }],
        karma: { good: -5 },
      },
    },

    // === PATH B: Bribe Your Way ===
    {
      id: 'ch2_miner_corrupt',
      name: 'The Greased Palm',
      description:
        'Honest investigation takes time Zeke may not have. Flash some gold around the saloon — ' +
        'someone always knows something, if the price is right.',
      objectives: [
        {
          id: 'ch2_mm_cor_1',
          description: 'Visit Big Mae Sullivan at the Nugget Saloon to buy information',
          type: 'talk',
          target: 'ch2_barkeep',
        },
        {
          id: 'ch2_mm_cor_2',
          description: 'Pay Mae\'s price for the name of the kidnapper (15 gold)',
          type: 'item',
          target: 'bribe_15_gold',
        },
        {
          id: 'ch2_mm_cor_3',
          description: 'Bribe Mrs. Frost at the St. George Hotel to unlock the basement (Diplomacy check)',
          type: 'skill_check',
          target: 'ch2_hotel_owner',
          stat: 'Diplomacy',
          dc: 10,
        },
        {
          id: 'ch2_mm_cor_4',
          description: 'Free Zeke and escort him back to camp',
          type: 'item',
          target: 'rescue_zeke',
        },
      ],
      reward: {
        xp: 65,
        karma: { lawful: -5, good: 5 },
        reputation: [
          { faction: 'settlers', amount: 5 },
          { faction: 'outlaws', amount: 5 },
        ],
        setFlag: 'ch2_zeke_rescued_bribery',
      },
      failureConsequence: {
        reputation: [{ faction: 'settlers', amount: -5 }],
        karma: { lawful: -5 },
      },
    },

    // === PATH C: The Lodge Connection ===
    {
      id: 'ch2_miner_masonic',
      name: 'The Lodge\'s Secret',
      description:
        'Worshipful Master Crane at the Masonic Lodge has eyes and ears everywhere in Volcano. ' +
        'The Brotherhood protects its own — and Zeke was a member. But the Lodge extracts favors in return.',
      objectives: [
        {
          id: 'ch2_mm_mas_1',
          description: 'Gain entry to the Masonic Lodge (requires Settlers reputation >= 0)',
          type: 'travel',
          target: 'ch2_masonic_lodge',
        },
        {
          id: 'ch2_mm_mas_2',
          description: 'Prove your worth to Master Crane with a riddle of logic (Shrewdness check)',
          type: 'skill_check',
          target: 'ch2_mason',
          stat: 'Shrewdness',
          dc: 14,
        },
        {
          id: 'ch2_mm_mas_3',
          description: 'Receive the Lodge\'s intelligence on Zeke\'s captor',
          type: 'clue',
          target: 'masonic_intelligence',
        },
        {
          id: 'ch2_mm_mas_4',
          description: 'Confront the kidnapper with the Lodge\'s authority behind you',
          type: 'talk',
          target: 'ch2_hotel_owner',
        },
        {
          id: 'ch2_mm_mas_5',
          description: 'Recover Zeke and deliver him to Red Jack',
          type: 'item',
          target: 'rescue_zeke',
        },
      ],
      reward: {
        xp: 90,
        gold: 10,
        karma: { lawful: 5, good: 5 },
        reputation: [
          { faction: 'settlers', amount: 20 },
        ],
        setFlag: 'ch2_zeke_rescued_lodge',
        item: 'masonic_signet',
      },
      failureConsequence: {
        reputation: [{ faction: 'settlers', amount: -15 }],
        karma: { lawful: -3 },
      },
    },
  ],
}

const CH2_QUEST_CLAIM_JUMPER: Quest = {
  id: 'ch2_claim_jumper',
  chapter: 2,
  title: 'The Claim Jumper\'s Deal',
  description:
    'Slim Perkins sidles up to you at the Miner\'s Camp with a proposition. He knows of an abandoned claim ' +
    'up near the cemetery — rich with gold but "tied up in paperwork." For a 50/50 split, he\'ll show you where it is. ' +
    'The catch? The claim belongs to the missing Zeke Thorn. And Slim knows it.',
  giver: 'ch2_claim_jumper', // Slim Perkins
  giverLocation: 'ch2_miners_camp',
  paths: [
    // === PATH A: Turn Him In (Lawful) ===
    {
      id: 'ch2_claim_lawful',
      name: 'Justice Served',
      description:
        'Slim just confessed to attempted claim jumping — a serious crime in Gold Country. ' +
        'Report him to the authorities and protect Zeke\'s rightful claim.',
      objectives: [
        {
          id: 'ch2_cj_law_1',
          description: 'Listen to Slim\'s full proposal to gather evidence',
          type: 'talk',
          target: 'ch2_claim_jumper',
        },
        {
          id: 'ch2_cj_law_2',
          description: 'Travel to Volcano and report Slim to Professor Morley, the assayer',
          type: 'talk',
          target: 'ch2_assayer',
        },
        {
          id: 'ch2_cj_law_3',
          description: 'Provide testimony about Slim\'s scheme (Diplomacy check)',
          type: 'skill_check',
          target: 'ch2_assayer',
          stat: 'Diplomacy',
          dc: 10,
        },
        {
          id: 'ch2_cj_law_4',
          description: 'Confront Slim at the Miner\'s Camp with the assayer\'s warrant',
          type: 'talk',
          target: 'ch2_claim_jumper',
        },
      ],
      reward: {
        xp: 65,
        gold: 10,
        karma: { lawful: 15, good: 5 },
        reputation: [
          { faction: 'pinkerton', amount: 10 },
          { faction: 'settlers', amount: 10 },
          { faction: 'outlaws', amount: -15 },
        ],
        setFlag: 'ch2_slim_arrested',
      },
      failureConsequence: {
        reputation: [{ faction: 'outlaws', amount: -5 }],
        karma: { lawful: -3 },
      },
    },

    // === PATH B: Join Him (Chaotic) ===
    {
      id: 'ch2_claim_chaotic',
      name: 'Partners in Crime',
      description:
        'Gold is gold. Zeke\'s gone, maybe dead. That claim is going to waste. ' +
        'Take Slim\'s deal and mine it before anyone asks questions.',
      objectives: [
        {
          id: 'ch2_cj_out_1',
          description: 'Accept Slim\'s deal and shake on it',
          type: 'choice',
          target: 'accept_slim_deal',
        },
        {
          id: 'ch2_cj_out_2',
          description: 'Travel to the Pioneer Cemetery to find the hidden claim',
          type: 'travel',
          target: 'ch2_cemetery',
        },
        {
          id: 'ch2_cj_out_3',
          description: 'Mine the claim before dawn (Durability check)',
          type: 'skill_check',
          target: 'ch2_cemetery',
          stat: 'Durability',
          dc: 12,
        },
        {
          id: 'ch2_cj_out_4',
          description: 'Sell the gold through the Cobblestone Theatre\'s back channels',
          type: 'talk',
          target: 'ch2_actress',
          optional: true,
        },
      ],
      reward: {
        xp: 70,
        gold: 40,
        karma: { lawful: -15, good: -10 },
        reputation: [
          { faction: 'outlaws', amount: 15 },
          { faction: 'settlers', amount: -10 },
        ],
        setFlag: 'ch2_claim_stolen',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -20 },
          { faction: 'pinkerton', amount: -10 },
        ],
        karma: { lawful: -10, good: -5 },
      },
    },

    // === PATH C: Play Both Sides ===
    {
      id: 'ch2_claim_double',
      name: 'The Double Cross',
      description:
        'Agree to Slim\'s deal, then use him to find the claim. Once he shows you the gold, ' +
        'reveal his scheme to Red Jack and claim the finder\'s fee. Slim gets nothing.',
      objectives: [
        {
          id: 'ch2_cj_dbl_1',
          description: 'Pretend to accept Slim\'s deal',
          type: 'choice',
          target: 'fake_accept_deal',
        },
        {
          id: 'ch2_cj_dbl_2',
          description: 'Let Slim lead you to the hidden claim at the cemetery',
          type: 'travel',
          target: 'ch2_cemetery',
        },
        {
          id: 'ch2_cj_dbl_3',
          description: 'Memorize the claim location without Slim noticing (Shrewdness check)',
          type: 'skill_check',
          target: 'ch2_cemetery',
          stat: 'Shrewdness',
          dc: 12,
        },
        {
          id: 'ch2_cj_dbl_4',
          description: 'Report Slim and the claim location to Red Jack Mulligan',
          type: 'talk',
          target: 'ch2_foreman',
        },
      ],
      reward: {
        xp: 80,
        gold: 20,
        karma: { lawful: 5, good: -5 },
        reputation: [
          { faction: 'settlers', amount: 10 },
          { faction: 'outlaws', amount: -10 },
        ],
        setFlag: 'ch2_slim_double_crossed',
      },
      failureConsequence: {
        reputation: [
          { faction: 'outlaws', amount: -15 },
          { faction: 'settlers', amount: -5 },
        ],
        karma: { lawful: -5 },
      },
    },
  ],
}

// ============================================
// CHAPTER 3: ANGELS CAMP & THE MOTHER LODE
// ============================================

const CH3_QUEST_GOLD_THEFT: Quest = {
  id: 'ch3_gold_theft',
  chapter: 3,
  title: 'The Gold Theft',
  description:
    'Three hundred ounces of raw gold have vanished from the assayer\'s vault in Angels Camp. ' +
    'Sheriff Thorn is overwhelmed — half the town had motive, and the other half had opportunity. ' +
    'Sam Clemens, the young reporter, is already writing the story. The question is which version.',
  giver: 'ch3_sheriff', // Sheriff Thorn
  giverLocation: 'ch3_angels_camp',
  paths: [
    // === PATH A: Work With the Law ===
    {
      id: 'ch3_gold_lawful',
      name: 'The Sheriff\'s Deputy',
      description:
        'Join Sheriff Thorn\'s investigation. Interview suspects, examine the vault, ' +
        'and follow the evidence wherever it leads — even if it leads to powerful people.',
      objectives: [
        {
          id: 'ch3_gt_law_1',
          description: 'Examine the assayer\'s vault for evidence of the break-in (Expertise check)',
          type: 'skill_check',
          target: 'ch3_angels_camp',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch3_gt_law_2',
          description: 'Interview James Sperry at Murphys Hotel about suspicious guests',
          type: 'talk',
          target: 'ch3_hotel_owner',
        },
        {
          id: 'ch3_gt_law_3',
          description: 'Search Moaning Cavern for a hidden stash (Agility check)',
          type: 'skill_check',
          target: 'ch3_moaning_cavern',
          stat: 'Agility',
          dc: 12,
        },
        {
          id: 'ch3_gt_law_4',
          description: 'Recover the stolen gold from the cavern',
          type: 'item',
          target: 'stolen_gold_bars',
        },
        {
          id: 'ch3_gt_law_5',
          description: 'Present evidence to Sheriff Thorn and identify the thief',
          type: 'talk',
          target: 'ch3_sheriff',
        },
      ],
      reward: {
        xp: 100,
        gold: 30,
        karma: { lawful: 15, good: 10 },
        reputation: [
          { faction: 'pinkerton', amount: 20 },
          { faction: 'settlers', amount: 10 },
        ],
        setFlag: 'ch3_gold_recovered_lawfully',
      },
      failureConsequence: {
        reputation: [
          { faction: 'pinkerton', amount: -10 },
          { faction: 'settlers', amount: -5 },
        ],
        karma: { lawful: -5 },
      },
    },

    // === PATH B: The Bandit Network ===
    {
      id: 'ch3_gold_underworld',
      name: 'The Underworld Trail',
      description:
        'Joaquin Three-Fingers knows every thief between Murphys and Mariposa. ' +
        'The bandit network can track the stolen gold faster than the law — but they\'ll want a cut.',
      objectives: [
        {
          id: 'ch3_gt_out_1',
          description: 'Gain access to the Hidden Gold Vein (requires Outlaw rep >= 25)',
          type: 'travel',
          target: 'ch3_secret_mine',
        },
        {
          id: 'ch3_gt_out_2',
          description: 'Convince Joaquin Three-Fingers to help track the gold (Agility check to prove nerve)',
          type: 'skill_check',
          target: 'ch3_bandit_boss',
          stat: 'Agility',
          dc: 12,
        },
        {
          id: 'ch3_gt_out_3',
          description: 'Follow the bandit informant\'s lead to Natural Bridges',
          type: 'travel',
          target: 'ch3_natural_bridges',
        },
        {
          id: 'ch3_gt_out_4',
          description: 'Recover the gold from the smuggler\'s cache beneath the limestone arches',
          type: 'item',
          target: 'stolen_gold_bars',
        },
        {
          id: 'ch3_gt_out_5',
          description: 'Decide how to split the recovered gold — return it all, or keep Joaquin\'s cut',
          type: 'choice',
          target: 'split_recovered_gold',
        },
      ],
      reward: {
        xp: 90,
        gold: 50,
        karma: { lawful: -10, good: -5 },
        reputation: [
          { faction: 'outlaws', amount: 15 },
          { faction: 'settlers', amount: 5 },
        ],
        setFlag: 'ch3_gold_recovered_underworld',
      },
      failureConsequence: {
        reputation: [
          { faction: 'outlaws', amount: -15 },
        ],
        karma: { lawful: -5 },
      },
    },

    // === PATH C: Twain's Pen ===
    {
      id: 'ch3_gold_journalism',
      name: 'The Power of the Press',
      description:
        'Sam Clemens has a theory: the real thief is the assayer himself, faking the robbery to collect insurance. ' +
        'Help Twain expose the truth through investigative journalism. The pen is mightier than the six-shooter.',
      objectives: [
        {
          id: 'ch3_gt_pen_1',
          description: 'Speak with Sam Clemens about his theory at the Angels Saloon',
          type: 'talk',
          target: 'ch3_twain',
        },
        {
          id: 'ch3_gt_pen_2',
          description: 'Search the assayer\'s ledgers for inconsistencies (Shrewdness check)',
          type: 'skill_check',
          target: 'ch3_angels_camp',
          stat: 'Shrewdness',
          dc: 14,
        },
        {
          id: 'ch3_gt_pen_3',
          description: 'Find the assayer\'s secret account at Murphys Hotel',
          type: 'clue',
          target: 'assayer_secret_ledger',
        },
        {
          id: 'ch3_gt_pen_4',
          description: 'Gather testimony from Blind Jake at Moaning Cavern',
          type: 'talk',
          target: 'ch3_cave_guide',
          optional: true,
        },
        {
          id: 'ch3_gt_pen_5',
          description: 'Deliver the evidence to Sam Clemens for publication',
          type: 'talk',
          target: 'ch3_twain',
        },
      ],
      reward: {
        xp: 95,
        gold: 15,
        karma: { lawful: 10, good: 15 },
        reputation: [
          { faction: 'settlers', amount: 20 },
          { faction: 'pinkerton', amount: 5 },
        ],
        setFlag: 'ch3_assayer_exposed',
        item: 'twain_signed_article',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -10 },
        ],
        karma: { lawful: -3 },
      },
    },
  ],
}

const CH3_QUEST_FROG_CONTEST: Quest = {
  id: 'ch3_frog_contest',
  chapter: 3,
  title: 'The Celebrated Contest',
  description:
    'The annual Calaveras County Frog Jumping Contest draws gamblers, spectators, and swindlers ' +
    'from across California. Smiley, the professional gambler, has a frog named "Dan\'l Webster" that ' +
    'hasn\'t lost in three years. The prize purse is 50 gold. Entry requires a frog and a $5 fee.',
  giver: 'ch3_gambler', // Smiley
  giverLocation: 'ch3_jumping_frog',
  paths: [
    // === PATH A: Honest Competition ===
    {
      id: 'ch3_frog_honest',
      name: 'The Honest Competitor',
      description:
        'Catch your own frog, train it properly, and win on skill alone. ' +
        'Grandmother Willow of the Miwok knows the old ways of speaking to animals.',
      objectives: [
        {
          id: 'ch3_fc_hon_1',
          description: 'Catch a healthy bullfrog at Natural Bridges (Agility check)',
          type: 'skill_check',
          target: 'ch3_natural_bridges',
          stat: 'Agility',
          dc: 10,
        },
        {
          id: 'ch3_fc_hon_2',
          description: 'Visit Grandmother Willow at Big Trees to learn the frog-training secret',
          type: 'talk',
          target: 'ch3_miwok_elder',
          optional: true,
        },
        {
          id: 'ch3_fc_hon_3',
          description: 'Train your frog for the competition (Expertise check)',
          type: 'skill_check',
          target: 'ch3_jumping_frog',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch3_fc_hon_4',
          description: 'Enter the contest and compete against Dan\'l Webster (Luck check)',
          type: 'skill_check',
          target: 'ch3_jumping_frog',
          stat: 'Luck',
          dc: 12,
        },
      ],
      reward: {
        xp: 70,
        gold: 50,
        karma: { lawful: 5, good: 5 },
        reputation: [
          { faction: 'settlers', amount: 10 },
          { faction: 'natives', amount: 10 },
        ],
        setFlag: 'ch3_frog_won_honestly',
      },
      failureConsequence: {
        karma: { lawful: 0, good: 0 },
      },
    },

    // === PATH B: Cheat to Win ===
    {
      id: 'ch3_frog_cheat',
      name: 'The Loaded Frog',
      description:
        'Smiley\'s been cheating for years — his frog is fed a special Miwok root that makes it jump further. ' +
        'Fight fire with fire. Feed your opponent\'s frog buckshot so it can\'t hop.',
      objectives: [
        {
          id: 'ch3_fc_cheat_1',
          description: 'Catch any frog — doesn\'t matter how good it is',
          type: 'item',
          target: 'any_bullfrog',
        },
        {
          id: 'ch3_fc_cheat_2',
          description: 'Buy buckshot from the Angels Hotel Store',
          type: 'item',
          target: 'buckshot',
        },
        {
          id: 'ch3_fc_cheat_3',
          description: 'Distract Smiley while you feed Dan\'l Webster the buckshot (Shrewdness check)',
          type: 'skill_check',
          target: 'ch3_gambler',
          stat: 'Shrewdness',
          dc: 12,
        },
        {
          id: 'ch3_fc_cheat_4',
          description: 'Win the contest with your mediocre frog against the weighted Dan\'l Webster',
          type: 'choice',
          target: 'win_frog_contest',
        },
      ],
      reward: {
        xp: 60,
        gold: 50,
        karma: { lawful: -10, good: -10 },
        reputation: [
          { faction: 'outlaws', amount: 10 },
        ],
        setFlag: 'ch3_frog_won_cheating',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -15 },
          { faction: 'pinkerton', amount: -5 },
        ],
        karma: { lawful: -10, good: -5 },
      },
    },

    // === PATH C: Sabotage the Competition ===
    {
      id: 'ch3_frog_sabotage',
      name: 'The Saboteur',
      description:
        'Don\'t just beat Smiley — ruin the contest entirely. If you can\'t win, make sure no one else does either. ' +
        'Release a snake near the frog pens the night before and bet on the chaos.',
      objectives: [
        {
          id: 'ch3_fc_sab_1',
          description: 'Capture a king snake from the creek at Natural Bridges (Agility check)',
          type: 'skill_check',
          target: 'ch3_natural_bridges',
          stat: 'Agility',
          dc: 12,
        },
        {
          id: 'ch3_fc_sab_2',
          description: 'Place a bet against all competitors with Smiley',
          type: 'talk',
          target: 'ch3_gambler',
        },
        {
          id: 'ch3_fc_sab_3',
          description: 'Release the snake near the frog pens at night (Luck check to avoid detection)',
          type: 'skill_check',
          target: 'ch3_jumping_frog',
          stat: 'Luck',
          dc: 14,
        },
        {
          id: 'ch3_fc_sab_4',
          description: 'Collect your winnings from the cancelled contest',
          type: 'item',
          target: 'sabotage_winnings',
        },
      ],
      reward: {
        xp: 55,
        gold: 35,
        karma: { lawful: -15, good: -15 },
        reputation: [
          { faction: 'outlaws', amount: 10 },
          { faction: 'settlers', amount: -15 },
          { faction: 'natives', amount: -10 },
        ],
        setFlag: 'ch3_frog_contest_sabotaged',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -20 },
          { faction: 'pinkerton', amount: -10 },
          { faction: 'outlaws', amount: -5 },
        ],
        karma: { lawful: -10, good: -10 },
      },
    },
  ],
}

// ============================================
// CHAPTER 4: BUILDING THE RANCH
// ============================================

const CH4_QUEST_LAND_FRAUD: Quest = {
  id: 'ch4_land_fraud',
  chapter: 4,
  title: 'The Land Fraud',
  description:
    'Tobias arrives at the county courthouse in Jackson to register his claim, only to find someone ' +
    'has already filed papers on his 160 acres. The signature on the fraudulent claim is clearly forged, ' +
    'but Judge Whitfield says "paper is paper." Samuel Clemson, the land lawyer, offers his services — ' +
    'for a steep fee. Something about this stinks.',
  giver: 'ch4_judge', // Judge Whitfield
  giverLocation: 'ch4_jackson',
  paths: [
    // === PATH A: Legal Battle (Lawful) ===
    {
      id: 'ch4_fraud_legal',
      name: 'The Legal Path',
      description:
        'Fight the fraud through proper legal channels. It will take time, money, and sharp wits — ' +
        'but a legitimate title is worth more than one won by force.',
      objectives: [
        {
          id: 'ch4_lf_leg_1',
          description: 'Hire Samuel Clemson as your lawyer (25 gold)',
          type: 'talk',
          target: 'ch4_lawyer',
        },
        {
          id: 'ch4_lf_leg_2',
          description: 'Search the courthouse records for the original fraudulent filing (Shrewdness check)',
          type: 'skill_check',
          target: 'ch4_jackson',
          stat: 'Shrewdness',
          dc: 12,
        },
        {
          id: 'ch4_lf_leg_3',
          description: 'Get Sarah McGraw\'s testimony as a neighboring witness',
          type: 'talk',
          target: 'ch4_neighbor_wife',
        },
        {
          id: 'ch4_lf_leg_4',
          description: 'Find the forger\'s ink and pen at Bear Creek (Expertise check)',
          type: 'skill_check',
          target: 'ch4_creek',
          stat: 'Expertise',
          dc: 10,
        },
        {
          id: 'ch4_lf_leg_5',
          description: 'Present the evidence to Judge Whitfield (Diplomacy check)',
          type: 'skill_check',
          target: 'ch4_judge',
          stat: 'Diplomacy',
          dc: 12,
        },
      ],
      reward: {
        xp: 100,
        gold: 10,
        karma: { lawful: 15, good: 10 },
        reputation: [
          { faction: 'pinkerton', amount: 15 },
          { faction: 'settlers', amount: 15 },
        ],
        setFlag: 'ch4_land_won_legally',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -10 },
        ],
        karma: { lawful: -5, good: -5 },
      },
    },

    // === PATH B: Direct Confrontation (Brave) ===
    {
      id: 'ch4_fraud_confront',
      name: 'Frontier Justice',
      description:
        'The law is slow and the judge might be bought. Find the claim jumper yourself, ' +
        'confront them on the land, and settle this the old-fashioned way.',
      objectives: [
        {
          id: 'ch4_lf_con_1',
          description: 'Ask Big Jim Harwell who else has been surveying the ranch site',
          type: 'talk',
          target: 'ch4_foreman',
        },
        {
          id: 'ch4_lf_con_2',
          description: 'Track the claim jumper\'s camp near Bear Creek (Expertise check)',
          type: 'skill_check',
          target: 'ch4_creek',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch4_lf_con_3',
          description: 'Confront the claim jumper at the ranch site (Durability check — they fight dirty)',
          type: 'skill_check',
          target: 'ch4_ranch_site',
          stat: 'Durability',
          dc: 14,
        },
        {
          id: 'ch4_lf_con_4',
          description: 'Run them off the land and destroy their fraudulent papers',
          type: 'choice',
          target: 'destroy_fraud_papers',
        },
      ],
      reward: {
        xp: 85,
        gold: 5,
        karma: { lawful: -5, good: 0 },
        reputation: [
          { faction: 'settlers', amount: 10 },
          { faction: 'outlaws', amount: 5 },
        ],
        setFlag: 'ch4_land_won_force',
      },
      failureConsequence: {
        reputation: [
          { faction: 'pinkerton', amount: -10 },
          { faction: 'settlers', amount: -5 },
        ],
        karma: { lawful: -10 },
      },
    },

    // === PATH C: Gather Community Evidence ===
    {
      id: 'ch4_fraud_community',
      name: 'The Neighbors\' Petition',
      description:
        'Rally the homesteaders. If enough neighbors testify that Tobias was here first ' +
        'and improved the land, even a crooked judge can\'t ignore a community petition.',
      objectives: [
        {
          id: 'ch4_lf_com_1',
          description: 'Visit the McGraw Homestead and convince Sarah to organize a petition',
          type: 'talk',
          target: 'ch4_neighbor_wife',
        },
        {
          id: 'ch4_lf_com_2',
          description: 'Get Thomas McGraw\'s account of the boundary markers (Diplomacy check)',
          type: 'skill_check',
          target: 'ch4_neighbor_husband',
          stat: 'Diplomacy',
          dc: 8,
        },
        {
          id: 'ch4_lf_com_3',
          description: 'Collect Walt Henderson\'s testimony about lumber deliveries to the ranch',
          type: 'talk',
          target: 'ch4_miller',
        },
        {
          id: 'ch4_lf_com_4',
          description: 'Photograph or document improvements at the ranch site (Expertise check)',
          type: 'skill_check',
          target: 'ch4_ranch_site',
          stat: 'Expertise',
          dc: 10,
        },
        {
          id: 'ch4_lf_com_5',
          description: 'Present the community petition to Judge Whitfield with all signatures',
          type: 'talk',
          target: 'ch4_judge',
        },
      ],
      reward: {
        xp: 95,
        gold: 5,
        karma: { lawful: 10, good: 15 },
        reputation: [
          { faction: 'settlers', amount: 25 },
          { faction: 'pinkerton', amount: 5 },
        ],
        setFlag: 'ch4_land_won_community',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -15 },
        ],
        karma: { good: -5 },
      },
    },
  ],
}

const CH4_QUEST_WATER_RIGHTS: Quest = {
  id: 'ch4_water_rights',
  chapter: 4,
  title: 'The Water Rights',
  description:
    'Bear Creek, which feeds Pryor\'s Back of Beyond Ranch, has slowed to a trickle. Someone upstream ' +
    'has built a diversion dam. Without water, the livestock die, the garden fails, and the ranch is finished. ' +
    'Thomas McGraw says he saw strangers working up near the cave system last week.',
  giver: 'ch4_neighbor_husband', // Thomas McGraw
  giverLocation: 'ch4_neighbor',
  prerequisite: {
    questId: 'ch4_land_fraud',
  },
  paths: [
    // === PATH A: Negotiate (Diplomatic) ===
    {
      id: 'ch4_water_negotiate',
      name: 'The Negotiator',
      description:
        'Find out who diverted the water and why. There may be a deal to be made — ' +
        'enough water for everyone, if cooler heads prevail.',
      objectives: [
        {
          id: 'ch4_wr_neg_1',
          description: 'Follow Bear Creek upstream to find the diversion dam',
          type: 'travel',
          target: 'ch4_creek',
        },
        {
          id: 'ch4_wr_neg_2',
          description: 'Discover the dam was built by a mining company from Jackson',
          type: 'clue',
          target: 'mining_company_markers',
        },
        {
          id: 'ch4_wr_neg_3',
          description: 'Travel to Jackson and confront the mining company\'s representative',
          type: 'travel',
          target: 'ch4_jackson',
        },
        {
          id: 'ch4_wr_neg_4',
          description: 'Negotiate a water-sharing agreement (Diplomacy check)',
          type: 'skill_check',
          target: 'ch4_jackson',
          stat: 'Diplomacy',
          dc: 14,
        },
        {
          id: 'ch4_wr_neg_5',
          description: 'Have Judge Whitfield formalize the water rights agreement',
          type: 'talk',
          target: 'ch4_judge',
        },
      ],
      reward: {
        xp: 90,
        gold: 10,
        karma: { lawful: 10, good: 10 },
        reputation: [
          { faction: 'settlers', amount: 15 },
          { faction: 'pinkerton', amount: 10 },
        ],
        setFlag: 'ch4_water_negotiated',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -10 },
        ],
        karma: { lawful: -3, good: -3 },
      },
    },

    // === PATH B: Dam It Back (Aggressive) ===
    {
      id: 'ch4_water_aggressive',
      name: 'Dam Buster',
      description:
        'No time for lawyers. Blow the dam, restore the flow, and deal with the consequences later. ' +
        'Walt Henderson can supply the black powder. All you need is nerve.',
      objectives: [
        {
          id: 'ch4_wr_agg_1',
          description: 'Travel to Bear Creek and scout the diversion dam',
          type: 'travel',
          target: 'ch4_creek',
        },
        {
          id: 'ch4_wr_agg_2',
          description: 'Buy black powder from Henderson\'s Mill (don\'t tell him why)',
          type: 'talk',
          target: 'ch4_miller',
        },
        {
          id: 'ch4_wr_agg_3',
          description: 'Set charges on the dam under cover of darkness (Agility check)',
          type: 'skill_check',
          target: 'ch4_creek',
          stat: 'Agility',
          dc: 12,
        },
        {
          id: 'ch4_wr_agg_4',
          description: 'Detonate the charges and destroy the dam (Luck check — hope no one sees)',
          type: 'skill_check',
          target: 'ch4_creek',
          stat: 'Luck',
          dc: 12,
        },
      ],
      reward: {
        xp: 80,
        karma: { lawful: -15, good: 0 },
        reputation: [
          { faction: 'settlers', amount: 10 },
          { faction: 'outlaws', amount: 10 },
          { faction: 'pinkerton', amount: -15 },
        ],
        setFlag: 'ch4_dam_destroyed',
      },
      failureConsequence: {
        reputation: [
          { faction: 'pinkerton', amount: -20 },
          { faction: 'settlers', amount: -10 },
        ],
        karma: { lawful: -10 },
      },
    },

    // === PATH C: Alternative Source ===
    {
      id: 'ch4_water_alternative',
      name: 'The Hidden Spring',
      description:
        'The cave system beneath the ranch hides more than secrets. Thomas McGraw heard water flowing ' +
        'deep underground. Find an alternative water source and make the dam irrelevant.',
      objectives: [
        {
          id: 'ch4_wr_alt_1',
          description: 'Explore the Hidden Cave System beneath the ranch',
          type: 'travel',
          target: 'ch4_cave_system',
        },
        {
          id: 'ch4_wr_alt_2',
          description: 'Navigate the dangerous cave passages (Durability check)',
          type: 'skill_check',
          target: 'ch4_cave_system',
          stat: 'Durability',
          dc: 12,
        },
        {
          id: 'ch4_wr_alt_3',
          description: 'Locate the underground spring (Expertise check)',
          type: 'skill_check',
          target: 'ch4_cave_system',
          stat: 'Expertise',
          dc: 14,
        },
        {
          id: 'ch4_wr_alt_4',
          description: 'Chart a path to bring the water to the surface',
          type: 'clue',
          target: 'spring_route_map',
        },
        {
          id: 'ch4_wr_alt_5',
          description: 'Hire Big Jim Harwell to dig a channel from the spring to the ranch',
          type: 'talk',
          target: 'ch4_foreman',
        },
      ],
      reward: {
        xp: 100,
        gold: 5,
        karma: { lawful: 5, good: 10 },
        reputation: [
          { faction: 'settlers', amount: 20 },
          { faction: 'natives', amount: 5 },
        ],
        unlockLocation: 'ch4_cave_system',
        setFlag: 'ch4_spring_discovered',
        item: 'cave_spring_deed',
      },
      failureConsequence: {
        reputation: [
          { faction: 'settlers', amount: -5 },
        ],
        karma: { good: -3 },
      },
    },
  ],
}

// ============================================
// CHAPTER 5: THE TREASURE & LEGACY
// ============================================

const CH5_QUEST_TOBIAS_LEGACY: Quest = {
  id: 'ch5_tobias_legacy',
  chapter: 5,
  title: 'Tobias\'s Legacy',
  description:
    'In the attic of the ranch house, you find Pryor\'s journal — the last entry mentions "my legacy, ' +
    'split in four pieces, hidden where only someone who truly knows this land could find them." ' +
    'Four pieces of a treasure map are scattered across the ranch property. Each piece is hidden in a place ' +
    'that meant something to Tobias.',
  giver: 'ch5_ghost_tobias', // Tobias's Journal
  giverLocation: 'ch5_ranch_house',
  paths: [
    // This quest has a single path but with branching optional objectives
    {
      id: 'ch5_legacy_search',
      name: 'The Treasure Hunt',
      description:
        'Search every corner of the ranch property for the four pieces of Pryor\'s treasure map. ' +
        'Each piece is guarded by a puzzle or challenge that reflects the old man\'s character.',
      objectives: [
        {
          id: 'ch5_tl_1',
          description: 'Read Pryor\'s journal in the ranch house for the first clue',
          type: 'clue',
          target: 'tobias_journal_entry',
        },
        {
          id: 'ch5_tl_2',
          description: 'Find Map Piece 1: hidden in the Old Barn\'s foundation stone inscription (Shrewdness check)',
          type: 'skill_check',
          target: 'ch5_barn',
          stat: 'Shrewdness',
          dc: 10,
        },
        {
          id: 'ch5_tl_3',
          description: 'Find Map Piece 2: buried beneath the oldest apple tree in the orchard (Expertise check)',
          type: 'skill_check',
          target: 'ch5_orchard',
          stat: 'Expertise',
          dc: 12,
        },
        {
          id: 'ch5_tl_4',
          description: 'Find Map Piece 3: carved into a rock face at Eagle Point Lookout (Agility check to reach it)',
          type: 'skill_check',
          target: 'ch5_lookout',
          stat: 'Agility',
          dc: 12,
        },
        {
          id: 'ch5_tl_5',
          description: 'Find Map Piece 4: sealed in a tin box inside the Abandoned Mine (Durability check — the shaft is unstable)',
          type: 'skill_check',
          target: 'ch5_old_mine',
          stat: 'Durability',
          dc: 14,
        },
        {
          id: 'ch5_tl_6',
          description: 'Assemble the four map pieces at the ranch house',
          type: 'item',
          target: 'complete_treasure_map',
        },
      ],
      reward: {
        xp: 120,
        karma: { lawful: 5, good: 5 },
        reputation: [
          { faction: 'settlers', amount: 10 },
        ],
        unlockLocation: 'ch5_hidden_chamber',
        setFlag: 'ch5_map_assembled',
        item: 'tobias_treasure_map',
      },
      failureConsequence: {
        karma: { good: -3 },
      },
    },
  ],
}

const CH5_QUEST_FINAL_CHOICE: Quest = {
  id: 'ch5_final_choice',
  chapter: 5,
  title: 'The Final Choice',
  description:
    'The assembled map leads to the Hidden Chamber deep beneath Tobias\'s mine. Inside: a chest ' +
    'containing gold nuggets, land deeds, and historical artifacts worth a fortune. Pryor\'s journal ' +
    'says: "Whatever you do with this, let it reflect who you truly are." The treasure belongs to you. ' +
    'The question is what kind of person you\'ve become.',
  giver: 'ch5_ghost_tobias', // Tobias's Journal
  giverLocation: 'ch5_hidden_chamber',
  prerequisite: {
    questId: 'ch5_tobias_legacy',
    flag: 'ch5_map_assembled',
  },
  paths: [
    // === PATH A: Share With the Community (Good) ===
    {
      id: 'ch5_choice_share',
      name: 'The People\'s Treasure',
      description:
        'This land was built by community. The miners, the homesteaders, the Miwok who were here first — ' +
        'they all deserve a share. Divide the treasure among those who helped you get here.',
      objectives: [
        {
          id: 'ch5_fc_share_1',
          description: 'Enter the Hidden Chamber and open Tobias\'s chest',
          type: 'travel',
          target: 'ch5_hidden_chamber',
        },
        {
          id: 'ch5_fc_share_2',
          description: 'Inventory the treasure and decide fair shares',
          type: 'item',
          target: 'tobias_treasure_chest',
        },
        {
          id: 'ch5_fc_share_3',
          description: 'Return historical artifacts to the Miwok through Grandmother Willow',
          type: 'choice',
          target: 'return_native_artifacts',
          optional: true,
        },
        {
          id: 'ch5_fc_share_4',
          description: 'Distribute gold to the settlers who helped build the ranch',
          type: 'choice',
          target: 'distribute_settler_gold',
        },
        {
          id: 'ch5_fc_share_5',
          description: 'Use remaining funds to establish a community trust',
          type: 'choice',
          target: 'establish_trust',
        },
      ],
      reward: {
        xp: 150,
        gold: 25,
        karma: { lawful: 10, good: 25 },
        reputation: [
          { faction: 'settlers', amount: 30 },
          { faction: 'natives', amount: 20 },
          { faction: 'pinkerton', amount: 10 },
        ],
        setFlag: 'ch5_treasure_shared',
      },
    },

    // === PATH B: Keep It All (Evil) ===
    {
      id: 'ch5_choice_keep',
      name: 'The Dragon\'s Hoard',
      description:
        'You fought for this. Bled for it. Every ounce of gold, every deed, every artifact — yours by right of ' +
        'blood and sweat. Seal the chamber and tell no one what you found.',
      objectives: [
        {
          id: 'ch5_fc_keep_1',
          description: 'Enter the Hidden Chamber and claim everything',
          type: 'travel',
          target: 'ch5_hidden_chamber',
        },
        {
          id: 'ch5_fc_keep_2',
          description: 'Load the entire treasure — gold, deeds, artifacts — into packs',
          type: 'item',
          target: 'tobias_treasure_chest',
        },
        {
          id: 'ch5_fc_keep_3',
          description: 'Seal the chamber entrance so no one else can find it (Expertise check)',
          type: 'skill_check',
          target: 'ch5_hidden_chamber',
          stat: 'Expertise',
          dc: 10,
        },
        {
          id: 'ch5_fc_keep_4',
          description: 'Register all land deeds in your name at Jackson courthouse',
          type: 'choice',
          target: 'register_all_deeds',
        },
      ],
      reward: {
        xp: 100,
        gold: 200,
        karma: { lawful: -5, good: -25 },
        reputation: [
          { faction: 'settlers', amount: -20 },
          { faction: 'natives', amount: -20 },
          { faction: 'outlaws', amount: 15 },
        ],
        setFlag: 'ch5_treasure_hoarded',
      },
    },

    // === PATH C: Preserve for History (Neutral Good) ===
    {
      id: 'ch5_choice_preserve',
      name: 'The Curator\'s Path',
      description:
        'The treasure is not just gold — it\'s history. The artifacts, the deeds, Pryor\'s journal — ' +
        'they tell the story of Gold Country. Donate them to the state for preservation. Keep only ' +
        'enough gold to maintain the ranch.',
      objectives: [
        {
          id: 'ch5_fc_pres_1',
          description: 'Enter the Hidden Chamber and carefully document everything',
          type: 'travel',
          target: 'ch5_hidden_chamber',
        },
        {
          id: 'ch5_fc_pres_2',
          description: 'Catalog the historical artifacts (Shrewdness check)',
          type: 'skill_check',
          target: 'ch5_hidden_chamber',
          stat: 'Shrewdness',
          dc: 10,
        },
        {
          id: 'ch5_fc_pres_3',
          description: 'Contact Sam Clemens to write the story for posterity',
          type: 'choice',
          target: 'contact_twain_preservation',
          optional: true,
        },
        {
          id: 'ch5_fc_pres_4',
          description: 'Arrange for the California Historical Society to receive the collection',
          type: 'choice',
          target: 'donate_to_history',
        },
        {
          id: 'ch5_fc_pres_5',
          description: 'Keep a modest share to sustain the ranch into the future',
          type: 'item',
          target: 'modest_gold_share',
        },
      ],
      reward: {
        xp: 130,
        gold: 50,
        karma: { lawful: 15, good: 15 },
        reputation: [
          { faction: 'settlers', amount: 15 },
          { faction: 'natives', amount: 15 },
          { faction: 'pinkerton', amount: 15 },
        ],
        setFlag: 'ch5_treasure_preserved',
        item: 'historical_society_commendation',
      },
    },
  ],
}

// ============================================
// MASTER QUEST LIST
// ============================================

export const QUESTS: Quest[] = [
  // Chapter 1: The Journey West
  CH1_QUEST_STOLEN_SUPPLIES,
  CH1_QUEST_PAWNEE_TREATY,
  // Chapter 2: Volcano
  CH2_QUEST_MISSING_MINER,
  CH2_QUEST_CLAIM_JUMPER,
  // Chapter 3: Angels Camp
  CH3_QUEST_GOLD_THEFT,
  CH3_QUEST_FROG_CONTEST,
  // Chapter 4: Building the Ranch
  CH4_QUEST_LAND_FRAUD,
  CH4_QUEST_WATER_RIGHTS,
  // Chapter 5: The Treasure
  CH5_QUEST_TOBIAS_LEGACY,
  CH5_QUEST_FINAL_CHOICE,
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find(q => q.id === id)
}

export function getQuestsForChapter(chapter: number): Quest[] {
  return QUESTS.filter(q => q.chapter === chapter)
}

export function getQuestByGiver(npcId: string): Quest[] {
  return QUESTS.filter(q => q.giver === npcId)
}
