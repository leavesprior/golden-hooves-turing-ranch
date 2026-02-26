/**
 * Gold Country NPCs - Fallout 2-style location NPCs
 * Each location has 2-3 NPCs with dialogue, quests, and Ollama prompt templates
 */

// NPC witness types for Gold Country (superset of trail WitnessType)
export type GoldCountryWitnessType =
  | 'bartender' | 'shopkeeper' | 'stable_hand' | 'traveler' | 'settler'
  | 'native_trader' | 'telegraph_operator' | 'sheriff_deputy' | 'prostitute'
  | 'preacher' | 'drunk' | 'child'
  // Gold Country additions
  | 'innkeeper' | 'miner' | 'townfolk' | 'merchant' | 'lawman' | 'scholar'

export interface GoldCountryNPC {
  id: string
  name: string
  title: string
  location: string
  witnessType: GoldCountryWitnessType
  portrait: string  // emoji
  greeting: string
  personality: string
  ollamaPrompt: string  // system prompt for Ollama dialogue
  dialogueLines: string[]  // fallback scripted lines
  quest?: GoldCountryQuest           // Primary quest (legacy single-quest)
  additionalQuests?: GoldCountryQuest[]  // Additional quests from this NPC
  shopKeeper?: boolean
  clueHint?: string  // hint about investigation clue at this location
}

export type QuestCategory =
  | 'investigation'  // Warrant/clue related
  | 'livestock'      // Ranch/animal trading
  | 'business'       // Commerce ventures
  | 'community'      // Helping locals
  | 'exploration'    // Discovery quests
  | 'moral_dilemma'  // Ethical choices

export interface MoralChoice {
  id: string
  text: string                     // What the player sees
  reward: QuestReward              // Specific reward for this path
  consequence?: string             // Narrative description of what happens
}

export interface GoldCountryQuest {
  id: string
  title: string
  description: string
  objective: string
  reward: QuestReward              // Default reward (used if no moral choice made)
  moralChoices?: MoralChoice[]     // Optional branching paths
  requiredItems?: string[]
  requiredReputation?: number
  requiredLocation?: string
  requiredQuest?: string           // Prerequisite quest ID
  completionCheck: 'item' | 'dialogue' | 'search' | 'stat_check' | 'visit' | 'choice'
  category: QuestCategory
}

export interface QuestReward {
  // Specific karma types
  neutralKarma?: number    // 🌮 Gold/neutral karma earned (+ = earn, - = spend)
  goodKarma?: number       // 🍪 Good karma earned
  badKarma?: number        // 🪨 Bad karma (consequences)

  // D&D alignment shifts
  lawfulShift?: number     // + = more lawful, - = more chaotic
  goodEvilShift?: number   // + = more good, - = more evil

  // Other rewards
  reputation?: number
  item?: string
  unlockLocation?: string
  gold?: number            // Legacy field (maps to neutralKarma)

  // Legacy field for backward compat
  karma?: number           // Legacy: maps to goodKarma
}

export const GOLD_COUNTRY_NPCS: GoldCountryNPC[] = [
  // === BOBR CABIN (bobr_cabin) ===
  {
    id: 'ranch_hand_jake',
    name: 'Jake',
    title: 'Ranch Hand',
    location: 'bobr_cabin',
    witnessType: 'innkeeper',
    portrait: '🤠',
    greeting: 'Howdy, boss! The ranch is lookin\' good today. Anything you need?',
    personality: 'Loyal, hardworking, speaks with a drawl. Knows the land well.',
    ollamaPrompt: 'You are Jake, a ranch hand at Back of Beyond Ranch in the California Gold Country. You are loyal, hardworking, and speak with a Western drawl. You know the local area well and can give directions to nearby attractions. You care deeply about the ranch animals and the property. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Them cattle are doin\' fine. Fed and watered this mornin\'.',
      'You hear about the trouble up in Mokelumne Hill? Wouldn\'t go there after dark.',
      'If you\'re lookin\' for gold, Natural Bridges is where I\'d start pannin\'.',
      'Cynthia asked me to fix the fence on the north pasture. Should be done by sundown.',
    ],
    additionalQuests: [
      {
        id: 'quest_ranch_hand_dilemma',
        title: 'Ranch Hand\'s Dilemma',
        description: 'Old Biscuit, the ranch horse, is sick and suffering. Jake needs help deciding what to do.',
        objective: 'Decide the fate of the sick horse',
        reward: { goodKarma: 10, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'livestock',
        moralChoices: [
          {
            id: 'pay_vet',
            text: 'Pay for the veterinarian (costs 50🌮)',
            reward: { neutralKarma: -50, goodKarma: 10, lawfulShift: 10, goodEvilShift: 10 },
            consequence: 'The vet arrives and treats Old Biscuit. It\'ll be a long recovery, but the horse will live. Jake wipes a tear.',
          },
          {
            id: 'put_down',
            text: 'Put the horse down mercifully',
            reward: { badKarma: 5, lawfulShift: -5 },
            consequence: 'Jake leads Old Biscuit behind the barn. It\'s over quick. "Least he ain\'t sufferin\' no more," Jake says quietly.',
          },
          {
            id: 'sell_unknowing',
            text: 'Sell to an unknowing buyer at the market',
            reward: { neutralKarma: 30, badKarma: 15, goodEvilShift: -15 },
            consequence: 'A trader buys Old Biscuit without knowing he\'s sick. Jake won\'t look you in the eye for a week.',
          },
        ],
      },
      {
        id: 'quest_broken_fence',
        title: 'The Broken Fence',
        description: 'The north pasture fence broke overnight and livestock escaped into the hills.',
        objective: 'Track down the escaped livestock and decide what to do',
        reward: { goodKarma: 15, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'livestock',
        moralChoices: [
          {
            id: 'return_all',
            text: 'Track and return all the livestock',
            reward: { goodKarma: 15, lawfulShift: 10, goodEvilShift: 5 },
            consequence: 'After a hard day\'s work, every animal is accounted for. Cynthia is grateful.',
          },
          {
            id: 'keep_some',
            text: 'Return most, keep a few for yourself',
            reward: { neutralKarma: 20, badKarma: 5, lawfulShift: -10 },
            consequence: 'You return most of the livestock. Cynthia doesn\'t notice the missing ones... yet.',
          },
          {
            id: 'sell_to_trader',
            text: 'Sell them all to a passing trader',
            reward: { neutralKarma: 40, badKarma: 10, goodEvilShift: -15, lawfulShift: -10 },
            consequence: 'A trader heading to Sacramento buys the lot. You pocket the gold. Jake looks devastated.',
          },
        ],
      },
    ],
  },
  {
    id: 'cynthia_owner',
    name: 'Cynthia',
    title: 'Ranch Owner',
    location: 'bobr_cabin',
    witnessType: 'innkeeper',
    portrait: '👩‍🌾',
    greeting: 'Welcome back! How\'s the investigation coming along?',
    personality: 'Warm, knowledgeable about local history, protective of the ranch. Secretly knows more about the mystery than she lets on.',
    ollamaPrompt: 'You are Cynthia, the owner of Back of Beyond Ranch in Gold Country, California. You are warm and welcoming but sharp-minded. You know extensive local history and have lived here for decades. You subtly hint at mysteries in the area without giving away too much. You care about your guests and the community. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'This land has stories older than the Gold Rush. The Miwok knew things we\'re only rediscovering.',
      'If you need supplies, Jackson has the best general store. But watch yourself in Mokelumne Hill.',
      'I found something strange in the guest book the other day. Names that don\'t match any booking...',
      'The stars are beautiful tonight. Reminds me why I never left this mountain.',
    ],
    quest: {
      id: 'quest_guest_book',
      title: 'The Guest Book Mystery',
      description: 'Cynthia found strange entries in the ranch guest book. Investigate the names.',
      objective: 'Search the cabin for the guest book and examine the suspicious entries',
      reward: { goodKarma: 15, reputation: 5, lawfulShift: 5 },
      completionCheck: 'search',
      category: 'investigation',
    },
    additionalQuests: [
      {
        id: 'quest_cynthias_hospitality',
        title: 'Cynthia\'s Hospitality',
        description: 'A group of weary travelers arrived at the ranch. Cynthia asks for help deciding how to handle them.',
        objective: 'Decide how to handle the travelers at the ranch',
        reward: { goodKarma: 20, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'share_supplies',
            text: 'Share your supplies generously',
            reward: { goodKarma: 20, goodEvilShift: 15, reputation: 5 },
            consequence: 'The travelers are deeply grateful. They leave a handmade quilt as thanks and promise to spread word of the ranch\'s kindness.',
          },
          {
            id: 'charge_premium',
            text: 'Charge them premium rates for lodging',
            reward: { neutralKarma: 40, lawfulShift: -5 },
            consequence: 'They pay, grumbling. It\'s business, you tell yourself. Cynthia raises an eyebrow.',
          },
          {
            id: 'turn_away',
            text: 'Turn away the suspicious-looking one',
            reward: { lawfulShift: 10 },
            consequence: 'One traveler is turned away. The others stay peacefully. Was it the right call? You\'ll never know.',
          },
        ],
      },
      {
        id: 'quest_land_dispute',
        title: 'Cynthia\'s Land Dispute',
        description: 'A neighbor named Buckley claims his property line extends into Cynthia\'s ranch. She needs help resolving it.',
        objective: 'Help resolve the land boundary dispute',
        reward: { goodKarma: 15, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'business',
        moralChoices: [
          {
            id: 'negotiate_fairly',
            text: 'Mediate a fair boundary agreement',
            reward: { goodKarma: 15, lawfulShift: 10, goodEvilShift: 5, reputation: 5 },
            consequence: 'Both parties shake hands on a fair compromise. The boundary is marked with new posts.',
          },
          {
            id: 'old_deed_trick',
            text: 'Use an old deed loophole to claim extra land',
            reward: { neutralKarma: 30, lawfulShift: -10 },
            consequence: 'A clever reading of the original deed gives Cynthia an extra acre. Buckley storms off.',
          },
          {
            id: 'threaten_buckley',
            text: 'Intimidate Buckley into backing down',
            reward: { badKarma: 10, goodEvilShift: -10, lawfulShift: -5 },
            consequence: 'Buckley retreats, but the look in his eyes says this isn\'t over. You\'ve made an enemy.',
          },
        ],
      },
    ],
  },

  // === ANGELS CAMP (angels_camp) ===
  {
    id: 'bartender_ben',
    name: 'Ben Coon',
    title: 'Bartender',
    location: 'angels_camp',
    witnessType: 'bartender',
    portrait: '🍺',
    greeting: 'Pull up a stool, friend. Heard the one about the jumping frog?',
    personality: 'Garrulous storyteller, loves retelling Twain\'s tale. Knows everyone\'s business.',
    ollamaPrompt: 'You are Ben Coon, a bartender in Angels Camp, California during the Gold Rush era. You are the man who told Mark Twain the story of the Celebrated Jumping Frog. You love telling stories, know all the local gossip, and are always ready with a tall tale. You mention Twain\'s visit frequently. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Did I ever tell you about the time Sam Clemens sat right where you\'re sittin\'?',
      'There\'s a prospector been askin\' around about caves near Moaning Cavern. Seemed nervous.',
      'The Frog Jubilee is comin\' up. You should enter! Prize is 50 tacos worth of gold dust.',
      'Carson Hill still has gold, they say. Biggest nugget ever found came from there.',
    ],
    shopKeeper: true,
    additionalQuests: [
      {
        id: 'quest_frog_wager',
        title: 'The Frog Jumping Wager',
        description: 'The annual Frog Jubilee is here. Ben Coon has a tip on how to win big.',
        objective: 'Enter the frog jumping contest and decide how to compete',
        reward: { neutralKarma: 25, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'compete_honestly',
            text: 'Enter the contest fair and square',
            reward: { neutralKarma: 25, lawfulShift: 10 },
            consequence: 'Your frog puts up a respectable fight. Win or lose, you earned every inch honestly.',
          },
          {
            id: 'buckshot_trick',
            text: 'Feed the opponent\'s frog buckshot (like the Twain story)',
            reward: { neutralKarma: 50, badKarma: 10, lawfulShift: -15 },
            consequence: 'The opponent\'s frog can\'t jump. You win easily, but Ben Coon gives you a knowing look. "Just like the story," he says.',
          },
          {
            id: 'report_cheaters',
            text: 'Refuse and report the other cheaters',
            reward: { goodKarma: 10, lawfulShift: 15, goodEvilShift: 5 },
            consequence: 'Several contestants are disqualified. The honest competitors thank you. Justice, if not profit.',
          },
        ],
      },
      {
        id: 'quest_saloon_supply',
        title: 'Saloon Supply Run',
        description: 'Ben needs supplies delivered from Murphys. A simple job... if you stay honest.',
        objective: 'Deliver supplies from Murphys to the Angels Camp saloon',
        reward: { goodKarma: 10, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'business',
        moralChoices: [
          {
            id: 'honest_delivery',
            text: 'Deliver everything as promised',
            reward: { goodKarma: 10, lawfulShift: 10, reputation: 5 },
            consequence: 'Ben pays you fair and square. "Reliable help is hard to find," he says approvingly.',
          },
          {
            id: 'skim_top',
            text: 'Skim a few bottles off the top',
            reward: { neutralKarma: 15, badKarma: 5, lawfulShift: -10 },
            consequence: 'Ben doesn\'t notice the missing bottles. Extra supplies for you, guilt included.',
          },
          {
            id: 'sell_competitor',
            text: 'Sell the whole shipment to a competitor',
            reward: { neutralKarma: 30, badKarma: 10, lawfulShift: -15, goodEvilShift: -5 },
            consequence: 'The competitor pays well. When Ben finds out, you\'re no longer welcome at the saloon.',
          },
        ],
      },
    ],
  },
  {
    id: 'prospector_old_pete',
    name: 'Old Pete',
    title: 'Prospector',
    location: 'angels_camp',
    witnessType: 'miner',
    portrait: '⛏️',
    greeting: '*squints* You ain\'t from the Pinkerton agency, are ya?',
    personality: 'Paranoid old prospector, suspicious of strangers but softens with trust. Knows secret mining spots.',
    ollamaPrompt: 'You are Old Pete, a grizzled Gold Rush prospector in Angels Camp. You are suspicious of strangers, paranoid about claim jumpers, and protective of your mining secrets. You speak in short, gruff sentences. If someone earns your trust, you might share the location of a hidden gold vein. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'I ain\'t tellin\' nobody about my claim. Last fella who asked ended up in the river.',
      'That cave up at Moaning Cavern... things ain\'t right down there. Heard voices.',
      'If you want gold, go to Natural Bridges. The creek bed still glitters after rain.',
      'Trust nobody in Mokelumne Hill. That town\'s cursed.',
    ],
    quest: {
      id: 'quest_lost_claim',
      title: 'Old Pete\'s Lost Claim',
      description: 'Old Pete lost the map to his richest claim somewhere near Carson Hill.',
      objective: 'Search Carson Hill for Old Pete\'s lost claim map',
      reward: { neutralKarma: 100, unlockLocation: 'carson_hill' },
      requiredLocation: 'carson_hill',
      completionCheck: 'search',
      category: 'exploration',
    },
    clueHint: 'I seen someone suspicious skulkin\' around the Angels Hotel late at night.',
    additionalQuests: [
      {
        id: 'quest_miners_debt',
        title: 'The Miner\'s Debt',
        description: 'Old Pete owes 30🌮 to a dangerous creditor. He\'s desperate for help.',
        objective: 'Help Old Pete with his debt problem',
        reward: { goodKarma: 20, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'help_pay',
            text: 'Help pay off his debt (costs 30🌮)',
            reward: { neutralKarma: -30, goodKarma: 20, goodEvilShift: 15, reputation: 5 },
            consequence: 'Pete\'s debt is cleared. He hugs you with tears in his eyes. "I won\'t forget this," he says.',
          },
          {
            id: 'help_skip',
            text: 'Help him skip town quietly',
            reward: { badKarma: 5, lawfulShift: -15 },
            consequence: 'Under cover of darkness, Pete slips away. The creditor comes looking and isn\'t happy.',
          },
          {
            id: 'buy_claim',
            text: 'Buy his mining claim cheap while he\'s desperate',
            reward: { neutralKarma: 100, badKarma: 15, goodEvilShift: -15 },
            consequence: 'Pete sells his life\'s work for a fraction of its value. The gold vein is rich. Your conscience is not.',
          },
        ],
      },
    ],
  },
  {
    id: 'frog_jockey_lily',
    name: 'Lily',
    title: 'Frog Jockey',
    location: 'angels_camp',
    witnessType: 'townfolk',
    portrait: '🐸',
    greeting: 'Wanna see my champion jumper? His name is Daniel Webster the Third!',
    personality: 'Enthusiastic young woman obsessed with frog jumping. Surprisingly observant.',
    ollamaPrompt: 'You are Lily, a young frog jockey in Angels Camp, California. You are obsessed with frog jumping contests and training your champion frog. You are bubbly and enthusiastic but also surprisingly observant about people coming and going in town. You reference the Calaveras County Fair and Mark Twain frequently. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Daniel Webster the Third can jump 15 feet! Nobody\'s beating that.',
      'I saw a stranger in town last week. Wore a fancy coat and kept askin\' about the caverns.',
      'You should enter the Frog Jubilee! I can lend you a frog if you don\'t have one.',
      'Twain got the story wrong, you know. The frog wasn\'t named Dan\'l Webster. It was Jim Smiley\'s frog.',
    ],
  },

  // === MURPHYS (murphys) ===
  {
    id: 'vintner_pierre',
    name: 'Pierre Dumont',
    title: 'Vintner',
    location: 'murphys',
    witnessType: 'merchant',
    portrait: '🍷',
    greeting: 'Bienvenue! May I interest you in a tasting of our finest vintage?',
    personality: 'French vintner, sophisticated, proud of his wines. Connected to the wine tasting room network.',
    ollamaPrompt: 'You are Pierre Dumont, a French vintner in Murphys, California during the Gold Rush era. You are sophisticated, proud of your wines, and slightly condescending about American palates. You know the wine country well and have connections throughout the region. You occasionally drop French phrases. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'This Zinfandel is magnifique! The Gold Country terroir is underrated.',
      'The hotel guest register has some famous names. Twain, Grant, even Black Bart.',
      'I heard Ironstone has a gold nugget the size of a cat on display. Très impressionnant.',
      'Wine, mon ami, is the real gold of California.',
    ],
    shopKeeper: true,
    additionalQuests: [
      {
        id: 'quest_wine_tasting',
        title: 'Wine Tasting Ethics',
        description: 'Pierre invites you to a private tasting of rare vintages. Temptation lurks among the barrels.',
        objective: 'Attend the wine tasting and face temptation',
        reward: { goodKarma: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'taste_honestly',
            text: 'Enjoy the tasting honestly',
            reward: { goodKarma: 10, reputation: 5 },
            consequence: 'Pierre appreciates your palate and your integrity. He offers you a discount on future purchases.',
          },
          {
            id: 'pocket_bottle',
            text: 'Pocket a rare bottle when Pierre isn\'t looking',
            reward: { neutralKarma: 20, badKarma: 10, lawfulShift: -10 },
            consequence: 'The bottle is worth a fortune. Every time you see Pierre, your stomach knots.',
          },
          {
            id: 'expose_fraud',
            text: 'Help expose a competitor\'s watered-down wine',
            reward: { goodKarma: 25, lawfulShift: 15, reputation: 5 },
            consequence: 'The fraud is exposed and the honest vintners celebrate. Pierre calls you "a person of honor."',
          },
        ],
      },
      {
        id: 'quest_vineyard_labor',
        title: 'The Vineyard Labor',
        description: 'Pierre\'s vineyard workers are struggling. He needs help deciding fair compensation during harvest.',
        objective: 'Advise on vineyard labor practices',
        reward: { goodKarma: 15, lawfulShift: 5, goodEvilShift: 5 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'fair_wages',
            text: 'Advocate for fair wages (costs 20🌮)',
            reward: { neutralKarma: -20, goodKarma: 15, lawfulShift: 10, goodEvilShift: 10 },
            consequence: 'The workers are grateful and work harder. The harvest is the best in years.',
          },
          {
            id: 'cheap_labor',
            text: 'Suggest hiring cheaper labor from the mines',
            reward: { neutralKarma: 10, goodEvilShift: -10 },
            consequence: 'The original workers are replaced. The wine quality drops. Pierre blames the terroir.',
          },
          {
            id: 'organize_workers',
            text: 'Help the workers organize for better conditions',
            reward: { goodKarma: 10, lawfulShift: -10, goodEvilShift: 10 },
            consequence: 'The workers band together. Pierre is annoyed but conditions improve. Change is messy.',
          },
        ],
      },
    ],
  },
  {
    id: 'historian_margaret',
    name: 'Margaret Hayes',
    title: 'Historian',
    location: 'murphys',
    witnessType: 'townfolk',
    portrait: '📚',
    greeting: 'Oh! Are you interested in local history? I have so much to share!',
    personality: 'Passionate local historian, talks fast, knows every detail about Gold Country. Writes for the local paper.',
    ollamaPrompt: 'You are Margaret Hayes, a passionate local historian in Murphys, California. You know extensive details about Gold Rush history, Black Bart, Mark Twain, and the local mining towns. You talk fast and get excited about historical connections. You write for the Calaveras Enterprise. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Did you know Black Bart robbed 28 stagecoaches and never fired a shot? A gentleman bandit!',
      'The Murphys Hotel guest register is priceless. Ulysses S. Grant signed it in 1879.',
      'Mokelumne Hill had 17 murders in one weekend in 1851. Seventeen!',
      'The Chinese tunnels under Jackson are still there. Nobody knows how extensive they are.',
    ],
    clueHint: 'I found a reference to your suspect in the county archives.',
  },
  {
    id: 'deputy_walsh',
    name: 'Deputy Walsh',
    title: 'Sheriff\'s Deputy',
    location: 'murphys',
    witnessType: 'lawman',
    portrait: '⭐',
    greeting: 'Keep your nose clean in Murphys, stranger. We like it peaceful here.',
    personality: 'Stern but fair lawman. Keeps the peace in wine country. Has information about criminal activity.',
    ollamaPrompt: 'You are Deputy Walsh, a sheriff\'s deputy stationed in Murphys, California. You are stern but fair, focused on keeping the peace. You have information about criminal activity in the region and can point investigators toward leads. You respect the law above all. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Heard reports of suspicious activity near the caverns. You seen anything?',
      'The sheriff in Jackson is overwhelmed. Too many claims disputes turning violent.',
      'Murphys is quiet, and I aim to keep it that way.',
      'If you\'re lookin\' for trouble, Mokelumne Hill is the place. But I wouldn\'t recommend it.',
    ],
    additionalQuests: [
      {
        id: 'quest_deputy_favor',
        title: 'Sheriff\'s Deputy Favor',
        description: 'Deputy Walsh needs help tracking a suspect through the vineyards outside Murphys.',
        objective: 'Help track the suspect and decide what to do',
        reward: { goodKarma: 15, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'investigation',
        moralChoices: [
          {
            id: 'assist_lawfully',
            text: 'Help the deputy make a lawful arrest',
            reward: { goodKarma: 15, lawfulShift: 15, goodEvilShift: 5, reputation: 5 },
            consequence: 'The suspect is brought in peacefully. Deputy Walsh puts in a good word with the Sheriff in Jackson.',
          },
          {
            id: 'tip_off_suspect',
            text: 'Warn the suspect and let them escape',
            reward: { badKarma: 10, lawfulShift: -15 },
            consequence: 'The suspect vanishes into the hills. Walsh is furious. "I trusted you," he says coldly.',
          },
          {
            id: 'extort_both',
            text: 'Extort both sides for information',
            reward: { neutralKarma: 40, badKarma: 10, goodEvilShift: -10, lawfulShift: -10 },
            consequence: 'You play both sides and profit. Neither the deputy nor the suspect trusts you now.',
          },
        ],
      },
    ],
  },

  // === MOANING CAVERN (moaning_cavern) ===
  {
    id: 'cave_guide_hector',
    name: 'Hector Ramirez',
    title: 'Cave Guide',
    location: 'moaning_cavern',
    witnessType: 'townfolk',
    portrait: '🔦',
    greeting: 'Ready for the descent? Moaning Cavern waits for no one.',
    personality: 'Adventurous cave guide, fearless, knows every passage. Respects the cavern.',
    ollamaPrompt: 'You are Hector Ramirez, an experienced cave guide at Moaning Cavern in California. You are adventurous and fearless but deeply respectful of the cavern. You know that human remains 13,000 years old were found here. The main chamber is big enough for the Statue of Liberty. You warn about the dangers but encourage bravery. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'The main chamber is 165 feet deep. Big enough to fit the Statue of Liberty.',
      'They found bones down here. 13,000 years old. This place has always drawn people.',
      'The moaning sound? Air pressure changes through narrow passages. Nothing supernatural... probably.',
      'I\'ve explored every passage. Well, almost every passage. There\'s one I won\'t enter.',
    ],
    quest: {
      id: 'quest_rappel_challenge',
      title: 'The Rappel Challenge',
      description: 'Hector challenges you to rappel 165 feet into the main chamber.',
      objective: 'Pass a SADDLE stat check (Athleticism 6+) to complete the rappel',
      reward: { goodKarma: 20, reputation: 10 },
      completionCheck: 'stat_check',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_trapped_spelunker',
        title: 'Trapped Spelunker',
        description: 'A spelunker is trapped deep in the cavern. Hector needs help with the rescue.',
        objective: 'Decide how to handle the rescue mission',
        reward: { goodKarma: 25, goodEvilShift: 10, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'rescue',
            text: 'Mount a rescue (costs 30🌮 for equipment)',
            reward: { neutralKarma: -30, goodKarma: 25, goodEvilShift: 15, lawfulShift: 10, reputation: 10 },
            consequence: 'After hours of careful work, the spelunker is free. "You saved my life," they say, shaking.',
          },
          {
            id: 'charge_rescue',
            text: 'Rescue them, but charge for the service',
            reward: { neutralKarma: 20, lawfulShift: -5 },
            consequence: 'The spelunker is saved and pays you. Grateful, but the transaction leaves a sour taste.',
          },
          {
            id: 'loot_pack',
            text: 'Loot their abandoned pack before rescuing',
            reward: { neutralKarma: 15, badKarma: 15, goodEvilShift: -15 },
            consequence: 'You pocket their supplies, then rescue them. They never know. Hector gives you a long look.',
          },
        ],
      },
    ],
  },
  {
    id: 'geologist_chen',
    name: 'Dr. Chen',
    title: 'Geologist',
    location: 'moaning_cavern',
    witnessType: 'scholar',
    portrait: '🪨',
    greeting: 'Fascinating formations in here. Each one tells a story millions of years old.',
    personality: 'Academic geologist, fascinated by cave formations, speaks precisely.',
    ollamaPrompt: 'You are Dr. Chen, a geologist studying Moaning Cavern in California. You are an academic who speaks precisely about geological formations, mineralogy, and cave science. You find cave formations more interesting than gold. You know about the unique geology of the Sierra Nevada foothills. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'These stalactites took over 100,000 years to form. Magnificent.',
      'The limestone here dates to the Paleozoic era. Ancient seabeds, lifted by tectonic forces.',
      'California Caverns to the north has aragonite crystals. Extremely rare.',
      'Gold? Geologically uninteresting. Now, calcite flowstone... that\'s remarkable.',
    ],
    clueHint: 'I noticed unusual tool marks on the cavern walls. Someone was digging recently.',
    additionalQuests: [
      {
        id: 'quest_cave_artifact',
        title: 'Cave Artifact Trade',
        description: 'Dr. Chen discovered Miwok artifacts in a sealed chamber. They have historical value.',
        objective: 'Decide the fate of the Miwok artifacts',
        reward: { goodKarma: 30, lawfulShift: 10, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'donate_museum',
            text: 'Donate to the state museum for study',
            reward: { goodKarma: 30, lawfulShift: 15, goodEvilShift: 15, reputation: 10 },
            consequence: 'The artifacts are preserved and studied. Dr. Chen publishes a paper and credits your ethical decision.',
          },
          {
            id: 'sell_collector',
            text: 'Sell to a private collector',
            reward: { neutralKarma: 60, lawfulShift: -10 },
            consequence: 'A collector pays handsomely. The artifacts disappear into a private vault, lost to science.',
          },
          {
            id: 'keep_display',
            text: 'Keep some and display at the ranch',
            reward: { neutralKarma: 10, goodKarma: 5 },
            consequence: 'You keep a few pieces. Ranch visitors are fascinated. Dr. Chen is conflicted but understands.',
          },
        ],
      },
    ],
  },

  // === CALIFORNIA CAVERNS (california_caverns) ===
  {
    id: 'spelunker_max',
    name: 'Mad Max',
    title: 'Spelunker',
    location: 'california_caverns',
    witnessType: 'townfolk',
    portrait: '🧗',
    greeting: 'You look like you can handle tight spaces. Want to see the wild caves?',
    personality: 'Thrill-seeking spelunker, slightly unhinged, knows every cave in the region.',
    ollamaPrompt: 'You are Mad Max, an extreme spelunker at California Caverns. You are a thrill-seeker who loves crawling through tight passages and discovering new chambers. You are slightly unhinged but incredibly knowledgeable about cave systems. You refer to the wild cave tours as the real adventure. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'The show cave is for tourists. The WILD cave... that\'s where the real adventure is.',
      'John Muir explored these caves in 1858. I found his old campfire ring.',
      'There\'s a passage that connects to Moaning Cavern. Nobody believes me, but I\'ve seen it.',
      'The aragonite crystals down here are worth more than gold. Don\'t tell anyone.',
    ],
    additionalQuests: [
      {
        id: 'quest_spelunker_secret',
        title: 'The Spelunker\'s Secret',
        description: 'Mad Max found evidence of recent illegal activity deep in the caves. Someone\'s been hiding something.',
        objective: 'Investigate the evidence Max found and decide what to do',
        reward: { goodKarma: 15, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'investigation',
        moralChoices: [
          {
            id: 'report_sheriff',
            text: 'Report the evidence to the Sheriff in Jackson',
            reward: { goodKarma: 15, lawfulShift: 15, reputation: 5 },
            consequence: 'Sheriff Thorn investigates and makes an arrest. Max is relieved someone took it seriously.',
          },
          {
            id: 'confront_yourself',
            text: 'Confront the suspects yourself',
            reward: { lawfulShift: -10, reputation: 3 },
            consequence: 'You corner the suspects deep in the cave. It\'s tense, but they flee. Dangerous, but effective.',
          },
          {
            id: 'destroy_evidence',
            text: 'Destroy the evidence for a bribe',
            reward: { neutralKarma: 40, badKarma: 20, goodEvilShift: -15, lawfulShift: -15 },
            consequence: 'The evidence vanishes. Money changes hands. Max never speaks to you again.',
          },
        ],
      },
    ],
  },
  {
    id: 'crystal_collector_ada',
    name: 'Ada',
    title: 'Crystal Collector',
    location: 'california_caverns',
    witnessType: 'merchant',
    portrait: '💎',
    greeting: 'Shh... listen. The crystals sing if you\'re quiet enough.',
    personality: 'Mystical crystal collector, believes crystals have power. Trades in rare minerals.',
    ollamaPrompt: 'You are Ada, a crystal collector at California Caverns. You believe crystals have mystical properties and can sense hidden things. You trade in rare minerals and aragonite specimens. You speak softly and mysteriously. You may have found a crystal that points toward hidden gold. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'This aragonite specimen resonates with the earth\'s energy. Can you feel it?',
      'Crystals don\'t lie. This one is pointing northeast. Toward the gold.',
      'I found something deep in the caves. Not a crystal. Something... older.',
      'The caves remember everything. Every footstep, every whisper.',
    ],
    clueHint: 'My crystals detected unusual vibrations last week. Someone was digging nearby.',
    quest: {
      id: 'quest_crystal_discovery',
      title: 'The Crystal Chamber',
      description: 'Ada senses a hidden chamber with rare crystals deeper in the cave.',
      objective: 'Search the deep caves to find the hidden crystal chamber',
      reward: { goodKarma: 25, item: 'rare_aragonite_crystal' },
      completionCheck: 'search',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_crystal_mining',
        title: 'Crystal Mining Operation',
        description: 'Ada believes the crystal deposits could sustain a mining operation. But the caves are fragile.',
        objective: 'Decide the approach to crystal harvesting',
        reward: { goodKarma: 20, neutralKarma: 30, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'business',
        requiredQuest: 'quest_crystal_discovery',
        moralChoices: [
          {
            id: 'sustainable',
            text: 'Establish sustainable, careful harvesting',
            reward: { goodKarma: 20, neutralKarma: 30, lawfulShift: 10, goodEvilShift: 5 },
            consequence: 'Slow but steady crystal harvesting begins. Ada is satisfied the caves are protected.',
          },
          {
            id: 'strip_mine',
            text: 'Strip mine for maximum profit',
            reward: { neutralKarma: 80, badKarma: 20, goodEvilShift: -20 },
            consequence: 'The profits are enormous. The crystal formations that took millennia to grow are destroyed in weeks.',
          },
          {
            id: 'seal_cave',
            text: 'Seal the cave to protect the formations',
            reward: { goodKarma: 30, goodEvilShift: 15 },
            consequence: 'The cave is sealed. No profit, but the crystals will endure for future generations. Ada smiles.',
          },
        ],
      },
    ],
  },

  // === BIG TREES (big_trees) ===
  {
    id: 'ranger_sarah',
    name: 'Ranger Sarah',
    title: 'Park Ranger',
    location: 'big_trees',
    witnessType: 'townfolk',
    portrait: '🌲',
    greeting: 'Welcome to Calaveras Big Trees. Please stay on the marked trails.',
    personality: 'Dedicated park ranger, passionate about conservation, knows every tree by name.',
    ollamaPrompt: 'You are Ranger Sarah, a park ranger at Calaveras Big Trees State Park. You are passionate about giant sequoia conservation and know every tree in the grove. You are saddened by the cutting of the Discovery Tree in 1853. You educate visitors about the ecology and history of the grove. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'The Discovery Tree was over 1,200 years old when they cut it down in 1853. A tragedy.',
      'These sequoias can live 3,000 years. They were ancient before Rome was built.',
      'Mark Twain visited this grove. He said the trees made him feel insignificant.',
      'The bark is up to 2 feet thick. That\'s their fire protection.',
    ],
    additionalQuests: [
      {
        id: 'quest_logging_rights',
        title: 'Logging Rights Dispute',
        description: 'A timber company is pressuring for logging rights near the grove. Ranger Sarah is desperate for help.',
        objective: 'Decide the fate of the old growth forest near the sequoias',
        reward: { goodKarma: 30, lawfulShift: 10, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'block_logging',
            text: 'Help block the logging operation',
            reward: { goodKarma: 30, lawfulShift: 10, goodEvilShift: 15, neutralKarma: -20, reputation: 10 },
            consequence: 'The timber company backs down. The ancient trees are saved. Sarah salutes you.',
          },
          {
            id: 'negotiate_limited',
            text: 'Negotiate limited, sustainable logging',
            reward: { neutralKarma: 40, goodKarma: 5 },
            consequence: 'A compromise is reached. Some trees fall, but the grove is mostly preserved. Both sides grumble.',
          },
          {
            id: 'sell_rights',
            text: 'Broker the logging deal and take a cut',
            reward: { neutralKarma: 100, badKarma: 25, goodEvilShift: -20 },
            consequence: 'The timber company pays handsomely. The sound of sawing echoes through the hills. Sarah refuses to look at you.',
          },
        ],
      },
    ],
  },
  {
    id: 'naturalist_william',
    name: 'William Brewer',
    title: 'Naturalist',
    location: 'big_trees',
    witnessType: 'scholar',
    portrait: '🔬',
    greeting: 'Have you ever considered that these trees predate most human civilizations?',
    personality: 'Intellectual naturalist, philosophizes about trees and time. Named after the real 1864 surveyor.',
    ollamaPrompt: 'You are William Brewer, a naturalist studying the giant sequoias at Calaveras Big Trees. You are philosophical and intellectual, often contemplating the relationship between time, nature, and human history. You are named after the real William Brewer who surveyed California in 1864. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'A.T. Dowd discovered this grove in 1852 while chasing a grizzly bear.',
      'The heartwood of these trees is resistant to rot and fire. Nature\'s fortress.',
      'Imagine what these trees have witnessed. The rise and fall of empires.',
      'In the South Grove, there are trees that have never been catalogued. Secrets of the forest.',
    ],
    quest: {
      id: 'quest_sequoia_id',
      title: 'Sequoia Identification',
      description: 'William wants help identifying an unusual tree in the South Grove.',
      objective: 'Visit the South Grove and identify the unusual sequoia (educational quiz)',
      reward: { goodKarma: 15, reputation: 5 },
      completionCheck: 'dialogue',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_naturalist_collection',
        title: 'The Naturalist\'s Collection',
        description: 'William is cataloguing rare species in the South Grove. He needs a field assistant.',
        objective: 'Help William with his species catalogue',
        reward: { goodKarma: 20, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'thorough_work',
            text: 'Do thorough, careful cataloguing work',
            reward: { goodKarma: 20, lawfulShift: 10, reputation: 5 },
            consequence: 'William is impressed by your diligence. "A true naturalist\'s eye," he says warmly.',
          },
          {
            id: 'rush_job',
            text: 'Rush through it for the pay',
            reward: { neutralKarma: 10 },
            consequence: 'The work is sloppy. William has to redo half of it. He doesn\'t ask for help again.',
          },
          {
            id: 'steal_specimens',
            text: 'Steal rare specimens to sell',
            reward: { neutralKarma: 30, badKarma: 15, goodEvilShift: -10, lawfulShift: -10 },
            consequence: 'The specimens fetch a good price. William notices they\'re missing but can\'t prove anything.',
          },
        ],
      },
    ],
  },

  // === KENNEDY MINE (kennedy_mine) ===
  {
    id: 'old_miner_giuseppe',
    name: 'Giuseppe',
    title: 'Old Miner',
    location: 'kennedy_mine',
    witnessType: 'miner',
    portrait: '👴',
    greeting: '*coughs* Don\'t go down there, young one. The mine takes more than it gives.',
    personality: 'Aging miner haunted by the 1922 disaster. Speaks with Italian accent. Knows mine secrets.',
    ollamaPrompt: 'You are Giuseppe, an elderly Italian miner who survived the 1922 Kennedy Mine disaster that killed 47 men. You are haunted by the memory and speak with an Italian accent. You warn people about the dangers of the mine but know its secrets, including hidden passages and gold veins that were never fully explored. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Forty-seven men died in \'22. I hear their voices sometimes, deep underground.',
      'The mine goes down 5,912 feet. Nearly a mile. The heat down there... unbearable.',
      'There\'s gold still in those walls. But the price of getting it... too high.',
      'I told the foreman the timbers were weak. He didn\'t listen.',
    ],
    clueHint: 'The night before the fire, I saw a man who shouldn\'t have been there.',
    additionalQuests: [
      {
        id: 'quest_miners_memorial',
        title: 'The Miner\'s Memorial',
        description: 'Giuseppe wants to build a memorial for the 47 men who died in the 1922 disaster. He\'s raising funds.',
        objective: 'Decide how to contribute to the memorial fund',
        reward: { goodKarma: 30, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'full_donation',
            text: 'Make a generous donation (costs 40🌮)',
            reward: { neutralKarma: -40, goodKarma: 30, goodEvilShift: 15, reputation: 10 },
            consequence: 'Giuseppe weeps openly. "Forty-seven names, carved in stone. They will never be forgotten."',
          },
          {
            id: 'partial_donation',
            text: 'Donate what you can spare (costs 15🌮)',
            reward: { neutralKarma: -15, goodKarma: 10, goodEvilShift: 5 },
            consequence: 'Every bit helps. The memorial grows, one donation at a time.',
          },
          {
            id: 'pocket_fund',
            text: 'Volunteer to collect donations, then pocket them',
            reward: { neutralKarma: 40, badKarma: 20, goodEvilShift: -20 },
            consequence: 'The memorial fund vanishes. Giuseppe\'s hope dies a second time. This weighs on you.',
          },
        ],
      },
      {
        id: 'quest_night_mining',
        title: 'Illegal Night Mining',
        description: 'Giuseppe tells you miners have been sneaking into the mine at night. They\'re offering a cut.',
        objective: 'Decide how to handle the illegal mining operation',
        reward: { goodKarma: 15, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'join_mining',
            text: 'Join the night miners for a share',
            reward: { neutralKarma: 60, badKarma: 10, lawfulShift: -15 },
            consequence: 'The gold is real and the work is dangerous. Every creak of timber makes your heart race.',
          },
          {
            id: 'report_foreman',
            text: 'Report it to Foreman Harris',
            reward: { goodKarma: 15, lawfulShift: 15, reputation: 5 },
            consequence: 'Harris shuts down the operation. The miners are angry, but the mine is safer.',
          },
          {
            id: 'demand_bigger_cut',
            text: 'Demand a bigger cut or you\'ll report them',
            reward: { neutralKarma: 100, badKarma: 15, goodEvilShift: -10, lawfulShift: -10 },
            consequence: 'They pay your price. Blackmail is profitable but makes enemies in dark places.',
          },
        ],
      },
    ],
  },
  {
    id: 'foreman_harris',
    name: 'Foreman Harris',
    title: 'Mine Foreman',
    location: 'kennedy_mine',
    witnessType: 'townfolk',
    portrait: '🪖',
    greeting: 'This mine is closed for tours today. Official business only.',
    personality: 'Gruff, authoritative mine foreman. Hides something about the mine\'s current operations.',
    ollamaPrompt: 'You are Foreman Harris, the mine foreman at Kennedy Mine in Jackson. You are gruff and authoritative, concerned about safety but also hiding that some unauthorized mining is happening. You deflect questions about current operations. You respect the miners who died in 1922. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'The tailing wheels are the largest in the world. Built to carry waste rock uphill.',
      'No, you can\'t go below the first level. Insurance reasons.',
      'Some miners still come here at night. I don\'t ask questions.',
      'The mine museum has artifacts from 1860. Worth seeing, if that\'s your interest.',
    ],
    quest: {
      id: 'quest_mine_exploration',
      title: 'Into the Deep',
      description: 'Explore the abandoned lower levels of Kennedy Mine.',
      objective: 'Navigate the mine safely (danger encounter + stat check)',
      reward: { neutralKarma: 200, goodKarma: 10 },
      completionCheck: 'stat_check',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_mine_safety',
        title: 'Mine Safety Inspection',
        description: 'Foreman Harris asks you to help inspect the mine\'s safety conditions. But someone\'s offering to look the other way.',
        objective: 'Complete the mine safety inspection',
        reward: { goodKarma: 20, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'business',
        moralChoices: [
          {
            id: 'report_honestly',
            text: 'Report conditions honestly',
            reward: { goodKarma: 20, lawfulShift: 15, reputation: 5 },
            consequence: 'The mine is shut down for repairs. Workers are safe. Harris respects your integrity.',
          },
          {
            id: 'overlook_bribe',
            text: 'Overlook issues for a bribe (50🌮)',
            reward: { neutralKarma: 50, badKarma: 15, goodEvilShift: -15, lawfulShift: -15 },
            consequence: 'The money is good. The timbers are still weak. Every creak sounds like a warning.',
          },
          {
            id: 'shut_down',
            text: 'Shut down the entire operation for safety',
            reward: { goodKarma: 10, lawfulShift: 15, badKarma: 5 },
            consequence: 'The mine closes. Workers lose their income. It\'s the right call, but families go hungry.',
          },
        ],
      },
    ],
  },

  // === MOKELUMNE HILL (mokelumne_hill) ===
  {
    id: 'ghost_hunter_edgar',
    name: 'Edgar Poe',
    title: 'Ghost Hunter',
    location: 'mokelumne_hill',
    witnessType: 'townfolk',
    portrait: '👻',
    greeting: 'You feel that? The temperature just dropped. They\'re watching us.',
    personality: 'Dramatic ghost hunter convinced Hotel Leger is haunted. Has actually found real evidence of crimes.',
    ollamaPrompt: 'You are Edgar Poe (no relation), a ghost hunter investigating the haunted Hotel Leger in Mokelumne Hill. You are dramatic and love spooky atmosphere. While hunting ghosts, you accidentally found evidence of real crimes - both historical and recent. You speak in hushed, dramatic tones. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Hotel Leger\'s Room 7... don\'t sleep there. The previous occupant never checked out.',
      'I was ghost hunting and found something very real. A ledger of stolen goods.',
      'Seventeen murders in one weekend, 1851. Their spirits linger.',
      'The French cemetery has a grave with no name. Only a date: the night of the fire.',
    ],
    clueHint: 'While ghost hunting in the hotel basement, I found a ledger that doesn\'t belong to any ghost.',
    quest: {
      id: 'quest_haunted_inn',
      title: 'The Haunted Hotel',
      description: 'Spend a night at Hotel Leger and investigate the mysterious happenings.',
      objective: 'Search Hotel Leger for evidence (investigation + courage)',
      reward: { goodKarma: 30, item: 'stolen_ledger' },
      completionCheck: 'search',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_ghost_tour',
        title: 'Ghost Tour Business',
        description: 'Edgar wants to start ghost tours at Hotel Leger. How far should the showmanship go?',
        objective: 'Help plan the ghost tour business',
        reward: { goodKarma: 15, neutralKarma: 20, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'business',
        moralChoices: [
          {
            id: 'honest_tour',
            text: 'Create an honest historical ghost tour',
            reward: { goodKarma: 15, neutralKarma: 20, lawfulShift: 10, reputation: 5 },
            consequence: 'The tours are popular and educational. Edgar becomes a respected local historian.',
          },
          {
            id: 'embellish',
            text: 'Embellish the stories for bigger crowds',
            reward: { neutralKarma: 40, lawfulShift: -5 },
            consequence: 'The exaggerated tours pack in tourists. The money\'s good but the history suffers.',
          },
          {
            id: 'fake_hauntings',
            text: 'Stage fake hauntings for maximum profit',
            reward: { neutralKarma: 60, badKarma: 10, lawfulShift: -10, goodEvilShift: -5 },
            consequence: 'Hidden wires, fake ectoplasm, staged screams. Tourists love it until someone gets hurt.',
          },
        ],
      },
    ],
  },
  {
    id: 'innkeeper_rosa',
    name: 'Rosa Leger',
    title: 'Innkeeper',
    location: 'mokelumne_hill',
    witnessType: 'innkeeper',
    portrait: '🏨',
    greeting: 'Welcome to Hotel Leger. We have... history. Would you like a room?',
    personality: 'Protective innkeeper, descendant of the original owners. Knows the hotel\'s dark secrets.',
    ollamaPrompt: 'You are Rosa Leger, innkeeper at the historic Hotel Leger in Mokelumne Hill. Your family has owned the hotel since the Gold Rush. You know its dark history - murders, ghosts, and hidden rooms. You are protective of the hotel\'s reputation but will share stories with trusted guests. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Room 7 is... unavailable tonight. Don\'t ask why.',
      'My great-grandmother kept a diary of every guest since 1851. Some entries are disturbing.',
      'The ghost? Oh, that\'s just George. He was a miner. Harmless, mostly.',
      'We serve breakfast at 7. The spirits quiet down by then.',
    ],
    shopKeeper: true,
    additionalQuests: [
      {
        id: 'quest_stolen_goods',
        title: 'The Innkeeper\'s Stolen Goods',
        description: 'While cleaning the basement, Rosa found a stash of stolen property. She doesn\'t know what to do.',
        objective: 'Decide what to do with the stolen property',
        reward: { goodKarma: 25, lawfulShift: 10, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'return_owners',
            text: 'Track down the original owners and return everything',
            reward: { goodKarma: 25, lawfulShift: 15, goodEvilShift: 15, reputation: 10 },
            consequence: 'It takes days, but every item finds its way home. The gratitude of the owners is overwhelming.',
          },
          {
            id: 'sell_fence',
            text: 'Sell the goods through a fence in Jackson',
            reward: { neutralKarma: 50, badKarma: 10, lawfulShift: -10, goodEvilShift: -10 },
            consequence: 'Quick profit, no questions asked. Rosa looks uneasy but takes her cut.',
          },
          {
            id: 'blackmail_innkeeper',
            text: 'Blackmail Rosa for silence about the stash',
            reward: { neutralKarma: 30, badKarma: 15, goodEvilShift: -15 },
            consequence: 'Rosa pays to keep quiet. She\'ll never trust anyone with her secrets again.',
          },
        ],
      },
    ],
  },

  // === IRONSTONE VINEYARDS (ironstone_vineyards) ===
  {
    id: 'winemaker_frank',
    name: 'Frank Kautz',
    title: 'Winemaker',
    location: 'ironstone_vineyards',
    witnessType: 'merchant',
    portrait: '🍇',
    greeting: 'Welcome to Ironstone! Care for a tour of the caves and a tasting?',
    personality: 'Proud winemaker, generous host. Named after the real Kautz family who founded Ironstone.',
    ollamaPrompt: 'You are Frank Kautz, winemaker at Ironstone Vineyards in Murphys, California. You are proud of your estate, generous with tastings, and love showing off the property. You know about the famous 44-pound gold specimen in your museum. Your family built the estate from a Gold Rush-era ranch. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Our caves are perfect for aging wine. Natural temperature of 62 degrees.',
      'The gold specimen in our museum weighs 44 pounds. Largest crystalline gold leaf ever found.',
      'From Gold Rush mining to Gold Medal wine. That\'s the story of this land.',
      'Try the Reserve Cabernet. It\'s our best vintage in a decade.',
    ],
    shopKeeper: true,
    additionalQuests: [
      {
        id: 'quest_wine_partnership',
        title: 'Wine Business Partnership',
        description: 'Frank Kautz offers a partnership opportunity in his expanding wine operation.',
        objective: 'Decide the terms of the wine business partnership',
        reward: { goodKarma: 10, neutralKarma: 30, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'business',
        moralChoices: [
          {
            id: 'fair_partnership',
            text: 'Agree to fair, equal terms',
            reward: { goodKarma: 10, neutralKarma: 30, lawfulShift: 10, reputation: 5 },
            consequence: 'The partnership thrives on mutual trust. Profits are steady and the wine improves.',
          },
          {
            id: 'majority_stake',
            text: 'Negotiate a majority stake aggressively',
            reward: { neutralKarma: 50, lawfulShift: -5 },
            consequence: 'Frank reluctantly agrees. The money\'s better but the partnership is strained.',
          },
          {
            id: 'sabotage_competitor',
            text: 'Sabotage a competing winery first',
            reward: { neutralKarma: 70, badKarma: 20, goodEvilShift: -15, lawfulShift: -15 },
            consequence: 'The competitor\'s vintage is ruined. Your partnership has a monopoly. At what cost?',
          },
        ],
      },
    ],
  },
  {
    id: 'curator_james',
    name: 'James Marshall IV',
    title: 'Museum Curator',
    location: 'ironstone_vineyards',
    witnessType: 'scholar',
    portrait: '🏛️',
    greeting: 'Ah, a visitor! Let me show you the most magnificent gold specimen in existence.',
    personality: 'Passionate museum curator, claims descent from James Marshall who discovered gold at Sutter\'s Mill.',
    ollamaPrompt: 'You are James Marshall IV, curator of the museum at Ironstone Vineyards. You claim descent from James Marshall who discovered gold at Sutter\'s Mill in 1848. You are passionate about Gold Rush history and particularly proud of the 44-pound gold specimen. You are always trying to authenticate artifacts. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'My ancestor found the gold that started it all. January 24, 1848. Sutter\'s Mill.',
      'This 44-pound specimen was found in Jamestown. Pure crystalline gold leaf. Priceless.',
      'I\'ve been cataloguing Gold Rush artifacts for 30 years. Some tell disturbing stories.',
      'Someone offered to buy the gold specimen last month. Ten million dollars. We said no.',
    ],
    clueHint: 'An artifact that came in last week doesn\'t match any known Gold Rush provenance.',
    additionalQuests: [
      {
        id: 'quest_gold_nugget_display',
        title: 'Gold Nugget Display',
        description: 'James needs help researching the provenance of the famous 44-pound gold specimen.',
        objective: 'Research and report on the gold nugget\'s history',
        reward: { goodKarma: 20, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'investigation',
        moralChoices: [
          {
            id: 'honest_report',
            text: 'Write an honest provenance report',
            reward: { goodKarma: 20, lawfulShift: 15, reputation: 5 },
            consequence: 'The truth reveals a fascinating and complex history. James publishes your findings.',
          },
          {
            id: 'forge_provenance',
            text: 'Forge a more impressive provenance',
            reward: { neutralKarma: 30, badKarma: 10, lawfulShift: -10 },
            consequence: 'The forged history draws more visitors. James is delighted until a real historian visits.',
          },
          {
            id: 'reveal_stolen',
            text: 'Reveal evidence it was originally stolen',
            reward: { goodKarma: 25, lawfulShift: 15 },
            consequence: 'The revelation rocks the museum. James loses the nugget but gains his integrity.',
          },
        ],
      },
      {
        id: 'quest_vintage_heist',
        title: 'The Vintage Heist',
        description: 'A case of rare vintage wine was stolen from the estate. James has a lead on the thief.',
        objective: 'Track down the stolen wine and decide what to do',
        reward: { goodKarma: 20, lawfulShift: 10, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'track_return',
            text: 'Track the thief and return the wine',
            reward: { goodKarma: 20, lawfulShift: 15, goodEvilShift: 10, reputation: 5 },
            consequence: 'The wine is recovered. Frank Kautz is so grateful he gives you a bottle from his private reserve.',
          },
          {
            id: 'buy_cheap',
            text: 'Buy the wine cheap from the thief',
            reward: { neutralKarma: 10, lawfulShift: -10 },
            consequence: 'You get rare wine at a fraction of the cost. Frank never finds out. Or does he?',
          },
          {
            id: 'steal_more',
            text: 'Team up with the thief and steal more',
            reward: { neutralKarma: 40, badKarma: 25, goodEvilShift: -15, lawfulShift: -15 },
            consequence: 'The wine cellar is emptied. You and the thief split the profits. Frank is devastated.',
          },
        ],
      },
    ],
  },

  // === JACKSON (jackson) ===
  {
    id: 'sheriff_thorn',
    name: 'Sheriff Thorn',
    title: 'Sheriff',
    location: 'jackson',
    witnessType: 'lawman',
    portrait: '🔫',
    greeting: 'State your business in Jackson, stranger. We\'ve had trouble lately.',
    personality: 'Tough frontier sheriff, descendant of Ben Thorn who captured Black Bart. No-nonsense.',
    ollamaPrompt: 'You are Sheriff Thorn, the sheriff of Jackson, California. You are the descendant of Ben Thorn who captured Black Bart in 1883. You are tough, no-nonsense, and dedicated to law enforcement. You handle the telegraph for warrant submissions and take criminal investigations seriously. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'My grandfather captured Black Bart right here in Calaveras County.',
      'Got a warrant? Bring it to the telegraph office. We\'ll wire it to Sacramento.',
      'The Chinese tunnels under Main Street... I know about them. Not safe to explore.',
      'If you have evidence, present it. I don\'t deal in rumors.',
    ],
    additionalQuests: [
      {
        id: 'quest_bounty_hunter',
        title: 'Bounty Hunter Contract',
        description: 'Sheriff Thorn has a warrant for a dangerous outlaw hiding in the hills. He needs a tracker.',
        objective: 'Track the outlaw and decide how to bring them in',
        reward: { goodKarma: 30, neutralKarma: 50, lawfulShift: 10, goodEvilShift: 10 },
        completionCheck: 'choice',
        category: 'investigation',
        moralChoices: [
          {
            id: 'bring_alive',
            text: 'Bring the outlaw in alive',
            reward: { goodKarma: 30, neutralKarma: 50, lawfulShift: 15, goodEvilShift: 10, reputation: 10 },
            consequence: 'After a tense standoff, the outlaw surrenders. Justice will be served. Thorn is impressed.',
          },
          {
            id: 'bring_dead',
            text: 'Take them down permanently',
            reward: { neutralKarma: 30, badKarma: 10, lawfulShift: -5 },
            consequence: '"Dead or alive," you tell yourself. The bounty is paid, but it sits heavy.',
          },
          {
            id: 'let_escape_bribe',
            text: 'Let them escape for a bribe',
            reward: { neutralKarma: 40, badKarma: 20, lawfulShift: -20, goodEvilShift: -10 },
            consequence: 'The outlaw vanishes with a grateful nod. The Sheriff gets suspicious about your empty hands.',
          },
        ],
      },
      {
        id: 'quest_jailbreak_dilemma',
        title: 'The Jailbreak Dilemma',
        description: 'A prisoner in Jackson jail claims to be innocent and begs for help. The evidence is ambiguous.',
        objective: 'Investigate the prisoner\'s claim and decide what to do',
        reward: { goodKarma: 15, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'investigate_claim',
            text: 'Spend time investigating the claim thoroughly',
            reward: { goodKarma: 15, lawfulShift: 10, goodEvilShift: 5, reputation: 5 },
            consequence: 'Your investigation reveals new evidence. The truth is more complicated than anyone thought.',
          },
          {
            id: 'help_escape',
            text: 'Help the prisoner escape',
            reward: { lawfulShift: -15, badKarma: 5, goodKarma: 20 },
            consequence: 'The prisoner escapes. Were they innocent? You may never know. The risk was yours.',
          },
          {
            id: 'report_attempt',
            text: 'Report the escape attempt to Thorn',
            reward: { goodKarma: 5, lawfulShift: 15 },
            consequence: 'Thorn tightens security. The prisoner\'s face through the bars haunts you.',
          },
        ],
      },
      {
        id: 'quest_livestock_auction',
        title: 'Livestock Auction',
        description: 'The Sheriff is organizing a livestock auction in Jackson. There are deals to be made.',
        objective: 'Participate in the livestock auction',
        reward: { lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'livestock',
        moralChoices: [
          {
            id: 'buy_fair',
            text: 'Buy livestock at fair market prices',
            reward: { lawfulShift: 10 },
            consequence: 'Fair deals all around. You get good stock and a reputation for honest dealing.',
          },
          {
            id: 'bid_down_desperate',
            text: 'Bid down a desperate seller\'s livestock',
            reward: { neutralKarma: 20, goodEvilShift: -10 },
            consequence: 'The seller has no choice but to accept. The livestock is worth triple what you paid.',
          },
          {
            id: 'report_rigged',
            text: 'Expose the rigged auction to the crowd',
            reward: { goodKarma: 20, lawfulShift: 15 },
            consequence: 'The auctioneer is run out of town. Honest sellers thank you. The rigged bidders do not.',
          },
        ],
      },
    ],
  },
  {
    id: 'telegraph_operator_wong',
    name: 'Henry Wong',
    title: 'Telegraph Operator',
    location: 'jackson',
    witnessType: 'townfolk',
    portrait: '📡',
    greeting: '*tap tap tap* Hold on... message coming in. Alright, what can I do for you?',
    personality: 'Efficient telegraph operator, hears all the news first. Son of Chinese tunnel builders.',
    ollamaPrompt: 'You are Henry Wong, the telegraph operator in Jackson. Your father helped build the Chinese tunnels under Main Street. You are efficient, well-informed, and hear news from across California before anyone else. You can send warrant telegraphs and receive investigation updates. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'News from Sacramento: they\'re looking for someone matching your suspect\'s description.',
      'My father helped build the tunnels. They were a lifeline for the Chinese community.',
      'I can wire your warrant to any town in California. Takes about an hour.',
      'Strange messages coming through lately. Coded. Someone\'s planning something.',
    ],
    additionalQuests: [
      {
        id: 'quest_telegraph_delivery',
        title: 'Telegraph Delivery',
        description: 'Henry has an urgent message that must be hand-delivered. The contents could be valuable.',
        objective: 'Deliver the telegraph message and resist temptation',
        reward: { goodKarma: 10, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'deliver_honestly',
            text: 'Deliver the message sealed and unread',
            reward: { goodKarma: 10, lawfulShift: 15, reputation: 5 },
            consequence: 'The recipient is grateful. Henry trusts you with more important work.',
          },
          {
            id: 'read_sell_info',
            text: 'Read the message and sell the information',
            reward: { neutralKarma: 30, badKarma: 10, goodEvilShift: -10, lawfulShift: -10 },
            consequence: 'The information is worth gold to the right buyer. Henry never knows. The buyer does.',
          },
          {
            id: 'alter_message',
            text: 'Alter the message to benefit yourself',
            reward: { badKarma: 15, goodEvilShift: -15, lawfulShift: -10 },
            consequence: 'The altered message causes chaos. Deals fall through, plans change. Your fingerprints are invisible but the damage is real.',
          },
        ],
      },
    ],
  },

  // === NATURAL BRIDGES (natural_bridges) ===
  {
    id: 'prospector_tom',
    name: 'Panning Tom',
    title: 'Prospector',
    location: 'natural_bridges',
    witnessType: 'miner',
    portrait: '🪣',
    greeting: 'Best pannin\' spot in all of Gold Country, right here in Coyote Creek!',
    personality: 'Cheerful prospector who loves teaching gold panning. Makes a modest living.',
    ollamaPrompt: 'You are Panning Tom, a cheerful gold prospector at Natural Bridges in California. You love teaching people how to pan for gold in Coyote Creek. You make a modest living and are happy with your simple life. You know the geological formations well and can explain how the natural bridges were formed. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'Swirl the pan gently. Let the heavy stuff settle. Gold is heavier than rock.',
      'These bridges were carved by Coyote Creek over millions of years. Nature\'s patience.',
      'On a good day, I find maybe $20 in flakes. Enough for beans and coffee.',
      'The swimming hole under the bridge is the best kept secret in the county.',
    ],
    quest: {
      id: 'quest_gold_panning',
      title: 'Gold Panning Lesson',
      description: 'Learn gold panning from Panning Tom at Coyote Creek.',
      objective: 'Complete the gold panning mini-game to find gold flakes',
      reward: { neutralKarma: 50, goodKarma: 5 },
      completionCheck: 'item',
      category: 'exploration',
    },
    additionalQuests: [
      {
        id: 'quest_claim_dispute',
        title: 'Claim Dispute',
        description: 'Two miners are fighting over a gold claim at the creek. Tom asks you to help settle it.',
        objective: 'Mediate the claim dispute between two miners',
        reward: { goodKarma: 20, lawfulShift: 10 },
        completionCheck: 'choice',
        category: 'moral_dilemma',
        moralChoices: [
          {
            id: 'mediate_fairly',
            text: 'Mediate a fair split of the claim',
            reward: { goodKarma: 20, lawfulShift: 15, goodEvilShift: 5, reputation: 5 },
            consequence: 'Both miners grudgingly agree. Neither is fully happy, which means it\'s probably fair.',
          },
          {
            id: 'side_with_stronger',
            text: 'Side with the stronger miner for a cut',
            reward: { neutralKarma: 30, lawfulShift: -10, goodEvilShift: -10 },
            consequence: 'The weaker miner is pushed out. Your cut is generous. Tom shakes his head sadly.',
          },
          {
            id: 'file_own_claim',
            text: 'File your own overlapping claim on the spot',
            reward: { neutralKarma: 40, badKarma: 15, goodEvilShift: -15, lawfulShift: -15 },
            consequence: 'While they fight, you stake your own claim. Both miners unite... against you. Worth it?',
          },
        ],
      },
    ],
  },
  {
    id: 'geologist_petra',
    name: 'Dr. Petra Stone',
    title: 'Geologist',
    location: 'natural_bridges',
    witnessType: 'scholar',
    portrait: '🔬',
    greeting: 'Look at these formations! Millions of years of geological history in plain sight.',
    personality: 'Enthusiastic geologist, loves explaining how natural bridges form.',
    ollamaPrompt: 'You are Dr. Petra Stone, a geologist studying the Natural Bridges formation in California. You are enthusiastic about geology and love explaining how Coyote Creek dissolved limestone to form the bridges and caves. You can identify mineral deposits and know where gold is most likely to be found. Keep responses to 2-3 sentences.',
    dialogueLines: [
      'The creek dissolved the limestone over millions of years, creating caves that collapsed into bridges.',
      'See that quartz vein? Where there\'s quartz, there might be gold.',
      'This limestone dates back to the Paleozoic. Ancient ocean floor, right here.',
      'The best gold panning spots are where the creek bends. Gold settles on the inside of curves.',
    ],
    additionalQuests: [
      {
        id: 'quest_river_conservation',
        title: 'River Conservation',
        description: 'Dr. Stone discovered that upstream mining is polluting Coyote Creek. Something must be done.',
        objective: 'Decide how to address the river pollution',
        reward: { goodKarma: 25, goodEvilShift: 10, lawfulShift: 5 },
        completionCheck: 'choice',
        category: 'community',
        moralChoices: [
          {
            id: 'organize_cleanup',
            text: 'Organize a creek cleanup effort (costs 15🌮)',
            reward: { neutralKarma: -15, goodKarma: 25, goodEvilShift: 15, lawfulShift: 10, reputation: 10 },
            consequence: 'The community rallies together. The creek runs clear again. Fish return. Tom is overjoyed.',
          },
          {
            id: 'ignore_it',
            text: 'It\'s not your problem',
            reward: {},
            consequence: 'The pollution continues. The creek slowly dies. Tom\'s gold panning gets harder each season.',
          },
          {
            id: 'sell_clean_water',
            text: 'Profit by selling "clean" water from upstream',
            reward: { neutralKarma: 20, badKarma: 10, goodEvilShift: -10 },
            consequence: 'People pay good money for clean water while the creek suffers. Business is booming.',
          },
        ],
      },
    ],
  },

  // === MEMOIR-INSPIRED ARCHETYPE NPCs ===

  // BOBR CABIN — Ranch Matriarch
  {
    id: 'ranch_matriarch_sarah',
    name: 'Sarah \'Iron Horse\' Mitchell',
    title: 'Ranch Matriarch',
    location: 'bobr_cabin',
    witnessType: 'innkeeper',
    portrait: '👩‍🌾',
    greeting: 'You look like you can work. This ranch doesn\'t run itself, and my husband\'s been up at the diggings since April. If you want a roof and a meal, you\'ll earn both.',
    personality: 'Tough, practical, no-nonsense frontier woman who runs the ranch single-handedly while her husband prospects. Deeply competent with livestock and land management. Respects hard work above all else. Dry humor, weathered hands, sharp eyes that miss nothing.',
    ollamaPrompt: 'You are Sarah "Iron Horse" Mitchell, a frontier ranch matriarch in 1850s Gold Country, California. Your husband Henry left to prospect six months ago and you run the entire ranch operation — livestock, fencing, water systems, and hired hands. You are tough, practical, and deeply competent. You speak plainly and judge people by their willingness to work. You have little patience for dreamers and gold-fever fools, but deep respect for anyone who can swing a hammer or gentle a horse. You know this land better than any man. Keep responses to 2-3 sentences, practical and direct.',
    dialogueLines: [
      'The north fence is down again. Coyotes got through last night — lost a hen. I need that fence fixed proper, not just patched.',
      'My husband sends gold dust and promises. I send him lists of what the ranch actually needs. We\'ll see who runs out first.',
      'That water system hasn\'t worked right since the spring thaw shifted the creek bed. Someone with engineering sense could fix it in a day.',
      'I birthed three calves this week, shot a rattlesnake in the henhouse, and mended forty feet of fence. What have you done?',
    ],
    quest: {
      id: 'matriarch_ranch_trial',
      title: 'The Ranch Trial',
      description: 'Sarah Mitchell needs to know if you\'re worth feeding. She\'s set three tasks that test whether you can actually work a frontier ranch: tend the livestock through a difficult night, repair the broken fence line, and fix the water system that feeds the house and barn.',
      objective: 'Complete all three ranch tasks to prove your worth to Sarah Mitchell',
      reward: { neutralKarma: 50, goodKarma: 20, reputation: 15, lawfulShift: 10 },
      completionCheck: 'choice',
      category: 'livestock',
      moralChoices: [
        {
          id: 'complete_all_honestly',
          text: 'Work through each task honestly, dawn to dusk',
          reward: { neutralKarma: 50, goodKarma: 20, reputation: 15, lawfulShift: 10, goodEvilShift: 10 },
          consequence: 'Three days of the hardest work you\'ve done since leaving home. The livestock survive a cold snap because you stayed up all night. The fence holds against a bull that tests every post. The water system runs clear for the first time in months. Sarah nods once. "You\'ll do," she says. From her, that\'s a standing ovation.',
        },
        {
          id: 'cut_corners',
          text: 'Do the minimum on each task — good enough is good enough',
          reward: { neutralKarma: 20, lawfulShift: -5 },
          consequence: 'You patch the fence instead of rebuilding it, half-fix the water system, and doze through your livestock watch. Sarah sees everything. "I asked for a hand, not a tourist," she says. You get a meal but not her respect.',
        },
        {
          id: 'hire_help_secretly',
          text: 'Pay a passing drifter to do the hard work while you take credit',
          reward: { neutralKarma: 10, badKarma: 15, lawfulShift: -10, goodEvilShift: -10 },
          consequence: 'The drifter does sloppy work and Sarah spots his bootprints — different size from yours. She doesn\'t say a word, just sets your plate at the far end of the table. You\'ve lost something that gold can\'t buy back.',
        },
      ],
    },
  },

  // MURPHYS — Endurance Rider
  {
    id: 'endurance_rider_kai',
    name: 'Kai \'Windchaser\' Whitehorse',
    title: 'Endurance Rider',
    location: 'murphys',
    witnessType: 'townfolk',
    portrait: '🏇',
    greeting: 'That horse of yours has good lines but tired eyes. When\'s the last time you let her run — really run — without a pack or a destination?',
    personality: 'Mixed Miwok and settler heritage, caught between two worlds but at home on horseback. Quiet confidence, observes more than he speaks. Judges people by how they treat their animals. Competitive but fair. Carries himself with the economy of movement that comes from a lifetime in the saddle.',
    ollamaPrompt: 'You are Kai "Windchaser" Whitehorse, an endurance rider in 1850s Gold Country. Your mother was Miwok, your father a Kentucky settler. You live between two cultures and belong fully to neither, but on horseback you belong completely. You ride 50-mile endurance races through the Sierra foothills and train horses for the trail. You speak carefully and observe closely. You judge people by how they treat their horses. You know every trail, spring, and shortcut in the foothills. Keep responses to 2-3 sentences, calm and observant.',
    dialogueLines: [
      'My mother\'s people ran these trails on foot before the Spanish brought horses. I just added four legs to an old tradition.',
      'The fifty-mile race next month goes through country most riders have never seen. Two river crossings, a ridge climb, and a stretch of volcanic rock that\'ll lame any horse that isn\'t prepared.',
      'Your mount favors her left foreleg — did you notice? Probably a stone bruise. I can show you a poultice if you\'ve got an hour.',
      'The settlers race for prize money. The Miwok raced to carry messages between villages. I race because the horse and I become one thing, and that one thing is fast.',
    ],
    quest: {
      id: 'whitehorse_endurance',
      title: 'The Windchaser Challenge',
      description: 'Kai Whitehorse will train you and your horse for the Sierra Foothills Endurance — a grueling 50-mile ride through some of the most beautiful and dangerous terrain in Gold Country. But first, your horse must be trail-ready, and that means weeks of conditioning.',
      objective: 'Train your horse to trail-ready condition and complete the 50-mile endurance ride',
      reward: { neutralKarma: 30, goodKarma: 15, reputation: 10, item: 'champion_trail_horse' },
      completionCheck: 'choice',
      category: 'exploration',
      moralChoices: [
        {
          id: 'train_properly',
          text: 'Follow Kai\'s full training program — slow and steady',
          reward: { neutralKarma: 30, goodKarma: 15, reputation: 10, item: 'champion_trail_horse', goodEvilShift: 5 },
          consequence: 'Three weeks of graduated training — hill work, river crossings, endurance walks, and rest days. On race day your horse is ready. You finish seventh out of twenty, respectable for a first attempt. Kai says nothing but lets you ride alongside him on the cool-down. From Windchaser, that\'s an invitation to the family.',
        },
        {
          id: 'push_too_hard',
          text: 'Push the training harder — you want to win, not just finish',
          reward: { neutralKarma: 15, badKarma: 10, goodEvilShift: -5 },
          consequence: 'You push your horse too hard in the second week. She develops a tendon strain that sidelines her for a month. Kai watches you lead her limping back to the stable and shakes his head. "The horse tells you when she\'s ready. You weren\'t listening."',
        },
        {
          id: 'borrow_fast_horse',
          text: 'Borrow a faster horse for race day — yours isn\'t competitive',
          reward: { neutralKarma: 20, lawfulShift: -5 },
          consequence: 'The borrowed horse is fast but doesn\'t know you. At the second river crossing she balks and you lose ten minutes. You finish twelfth. Kai\'s only comment: "A fast horse that doesn\'t trust you is slower than a slow horse that does."',
        },
      ],
    },
  },

  // MOANING CAVERN — Miwok Elder
  {
    id: 'miwok_elder_nina',
    name: 'Nina \'Still Water\' Ookow',
    title: 'Miwok Elder',
    location: 'moaning_cavern',
    witnessType: 'scholar',
    portrait: '🪶',
    greeting: 'You have come to the place that sings. My grandmothers heard this sound for a thousand years before your people named it. Sit. Listen. The cavern speaks to those who are patient.',
    personality: 'Dignified keeper of Miwok cultural knowledge, particularly the grinding rocks and sacred sites now threatened by mining operations. Speaks measured English learned from mission contact. Not hostile to settlers but deeply protective of her people\'s heritage. Archaeological mind — she catalogs and remembers every site. Grief lives beneath her calm exterior.',
    ollamaPrompt: 'You are Nina "Still Water" Ookow, a Miwok elder in 1850s Gold Country. You are the keeper of your people\'s knowledge — the grinding rocks, the sacred springs, the obsidian trade routes, the stories carved into the landscape. Mining operations are destroying sites your grandmothers used for centuries. You speak careful English learned at the missions. You are dignified, measured, and deeply knowledgeable about the natural and cultural history of this land. You do not give trust easily but respect those who listen. You will never encourage taking artifacts from sacred sites. Keep responses to 2-3 sentences, thoughtful and measured.',
    dialogueLines: [
      'The grinding rocks at Chaw\'se have four hundred mortar holes. Each one was worn by a woman\'s hands over generations. The miners use them as stepping stones.',
      'This cavern was sacred long before the settlers named it. The sound it makes — that moaning — my people say it is the earth remembering.',
      'I have mapped every grinding rock site from here to the Consumnes River. Thirty-seven sites. Eleven have already been destroyed by mining.',
      'Your people see gold in the rivers and think they have found treasure. My people see acorn groves and know they have found life.',
    ],
    quest: {
      id: 'elder_knowledge_keeper',
      title: 'The Knowledge Keeper\'s Mission',
      description: 'Nina Ookow has spent her life cataloging Miwok sacred sites — grinding rocks, ceremonial grounds, obsidian sources — now threatened by the relentless expansion of mining. She needs someone the settlers will listen to in order to help protect three critical sites from destruction.',
      objective: 'Help Nina catalog and protect 3 sacred Miwok sites from mining damage',
      reward: { goodKarma: 40, reputation: 20, goodEvilShift: 15, item: 'miwok_cultural_knowledge' },
      completionCheck: 'choice',
      category: 'exploration',
      moralChoices: [
        {
          id: 'advocate_protection',
          text: 'Petition the mining companies and local authorities to protect the sites',
          reward: { goodKarma: 40, reputation: 20, goodEvilShift: 15, lawfulShift: 10, item: 'miwok_cultural_knowledge' },
          consequence: 'You spend weeks writing letters, attending town meetings, and arguing with mine foremen. Two of the three sites are spared — the third is already half-destroyed. Nina watches you work with an expression that slowly transforms from skepticism to something close to trust. She teaches you the Miwok names for the sites you saved.',
        },
        {
          id: 'document_secretly',
          text: 'Document the sites thoroughly so the knowledge survives even if the places don\'t',
          reward: { goodKarma: 25, reputation: 10, goodEvilShift: 5, item: 'sacred_site_documentation' },
          consequence: 'You sketch, measure, and describe each site in meticulous detail. Nina dictates the cultural significance, the stories, the names. The document you create together is the first written record of Miwok heritage in the Mother Lode. It\'s not as good as saving the sites themselves, but knowledge preserved is knowledge that can fight another day.',
        },
        {
          id: 'redirect_miners',
          text: 'Spread false gold rumors to lure miners away from the sacred sites',
          reward: { goodKarma: 15, reputation: 5, lawfulShift: -10, goodEvilShift: 5 },
          consequence: 'Your phantom gold strike draws a dozen miners to a worthless creek bed forty miles from the nearest sacred site. The deception buys time, but Nina is troubled. "Lies are poor foundations," she says. "Even good lies." She is right, but the grinding rocks are safe for now.',
        },
      ],
    },
  },

  // ANGELS CAMP — Self-Taught Builder
  {
    id: 'solar_builder_thomas',
    name: 'Thomas \'Adobe\' Prescott',
    title: 'Self-Taught Builder',
    location: 'angels_camp',
    witnessType: 'merchant',
    portrait: '🧱',
    greeting: 'See this wall? Eighteen inches of rammed earth. Cool in summer, warm in winter, and it\'ll stand for a hundred years. While your neighbors are rebuilding after every fire, I\'ll be sitting in the shade reading a book.',
    personality: 'Visionary builder obsessed with rammed earth and passive solar design, decades ahead of his time. Learned adobe construction from Mexican builders and improved on it with his own experiments. Talks passionately about thermal mass and south-facing windows. Other settlers think he\'s eccentric. He doesn\'t care — his buildings are the most comfortable in Gold Country.',
    ollamaPrompt: 'You are Thomas "Adobe" Prescott, a self-taught builder in 1850s Angels Camp, California. You build with rammed earth and adobe, techniques you learned from Mexican builders and improved with your own innovations. You are passionate about passive solar design — south-facing windows, thermal mass walls, natural ventilation. Other settlers think you\'re strange for not building with wood, but your buildings don\'t burn, stay cool in summer, and warm in winter. You speak enthusiastically about building techniques and can talk for hours about wall thickness, clay composition, and window placement. Keep responses to 2-3 sentences, enthusiastic and technical.',
    dialogueLines: [
      'Every fool in this town builds with pine boards. Pine burns. Pine rots. Adobe? The missions built with adobe two hundred years ago and they\'re still standing.',
      'The secret is the south wall. Eighteen inches thick, whitewashed on the outside to reflect summer sun, with deep-set windows that catch every hour of winter light. The building heats itself.',
      'I need someone to help me source the right clay. The red earth near Natural Bridges has the perfect calcium content — it sets like Roman concrete.',
      'The Mexican builders at Sonora taught me more in one month than four years of reading. They understand earth the way a good blacksmith understands iron.',
    ],
    quest: {
      id: 'prescott_build',
      title: 'The Adobe Project',
      description: 'Thomas Prescott is building a demonstration adobe structure in Angels Camp to prove that rammed earth construction is superior to the fire-prone wooden buildings that keep burning down. He needs help gathering specific materials — the right clay, straw for reinforcement, and lime for the plaster — and an extra pair of hands for the wall-raising.',
      objective: 'Gather materials and help Thomas build an adobe demonstration structure',
      reward: { neutralKarma: 30, goodKarma: 10, reputation: 10, unlockLocation: 'prescott_adobe_workshop' },
      completionCheck: 'choice',
      category: 'community',
      moralChoices: [
        {
          id: 'full_commitment',
          text: 'Commit fully — gather materials and help raise the walls',
          reward: { neutralKarma: 30, goodKarma: 10, reputation: 10, goodEvilShift: 5, unlockLocation: 'prescott_adobe_workshop' },
          consequence: 'A week of hard labor — hauling red clay from the creek bed, mixing it with straw and water, packing it into forms, and tamping it solid. The walls rise a foot a day. When the roof goes on, Thomas opens a bottle of wine he\'s been saving. The building is cool inside even at noon. Word spreads, and two other settlers commission adobe houses. You\'ve helped start something.',
        },
        {
          id: 'supply_only',
          text: 'Help source the materials but let Thomas do the building',
          reward: { neutralKarma: 20, reputation: 5, goodEvilShift: 3 },
          consequence: 'You find the perfect clay deposit near Natural Bridges and arrange for lime delivery from a kiln near Jackson. Thomas is grateful but the project takes twice as long without a building partner. The structure is eventually completed, smaller than planned but solid as the Sierra itself.',
        },
        {
          id: 'sabotage_competitor',
          text: 'A lumber merchant offers you gold to discourage Prescott — adobe threatens his business',
          reward: { neutralKarma: 40, badKarma: 20, goodEvilShift: -15, lawfulShift: -10 },
          consequence: 'You take the lumber merchant\'s gold and "accidentally" deliver the wrong clay — too sandy, no calcium. The first wall crumbles and Thomas is devastated. The lumber merchant buys you dinner. The taste of betrayal spoils every bite.',
        },
      ],
    },
  },
]

// Helper functions
export function getNPCsAtLocation(locationId: string): GoldCountryNPC[] {
  return GOLD_COUNTRY_NPCS.filter(npc => npc.location === locationId)
}

export function getNPCById(npcId: string): GoldCountryNPC | undefined {
  return GOLD_COUNTRY_NPCS.find(npc => npc.id === npcId)
}

export function getQuestGivingNPCs(): GoldCountryNPC[] {
  return GOLD_COUNTRY_NPCS.filter(npc => npc.quest !== undefined || (npc.additionalQuests && npc.additionalQuests.length > 0))
}

export function getShopKeepers(locationId: string): GoldCountryNPC[] {
  return GOLD_COUNTRY_NPCS.filter(npc => npc.location === locationId && npc.shopKeeper)
}

/** Get all quests from all NPCs (primary + additional) */
export function getAllQuests(): GoldCountryQuest[] {
  const quests: GoldCountryQuest[] = []
  for (const npc of GOLD_COUNTRY_NPCS) {
    if (npc.quest) quests.push(npc.quest)
    if (npc.additionalQuests) quests.push(...npc.additionalQuests)
  }
  return quests
}

/** Get all quests for a specific NPC */
export function getNPCQuests(npcId: string): GoldCountryQuest[] {
  const npc = getNPCById(npcId)
  if (!npc) return []
  const quests: GoldCountryQuest[] = []
  if (npc.quest) quests.push(npc.quest)
  if (npc.additionalQuests) quests.push(...npc.additionalQuests)
  return quests
}

/** Get quest by ID */
export function getQuestById(questId: string): GoldCountryQuest | undefined {
  return getAllQuests().find(q => q.id === questId)
}

/** Get quests by category */
export function getQuestsByCategory(category: QuestCategory): GoldCountryQuest[] {
  return getAllQuests().filter(q => q.category === category)
}

/** Check if a quest's prerequisites are met */
export function isQuestAvailable(quest: GoldCountryQuest, completedQuests: string[]): boolean {
  if (quest.requiredQuest && !completedQuests.includes(quest.requiredQuest)) {
    return false
  }
  return true
}

/** Category display info */
export const QUEST_CATEGORY_INFO: Record<QuestCategory, { label: string; icon: string; color: string }> = {
  investigation: { label: 'Investigation', icon: '🔍', color: 'text-indigo-400' },
  livestock: { label: 'Livestock', icon: '🐄', color: 'text-amber-400' },
  business: { label: 'Business', icon: '💰', color: 'text-yellow-400' },
  community: { label: 'Community', icon: '🤝', color: 'text-green-400' },
  exploration: { label: 'Exploration', icon: '🗺️', color: 'text-cyan-400' },
  moral_dilemma: { label: 'Dilemma', icon: '⚖️', color: 'text-purple-400' },
}
