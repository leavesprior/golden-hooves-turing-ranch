/**
 * Dialogue Trees for BOBR Adventure
 *
 * Fallout-style dialogue system with stat-gated options,
 * karma effects, and NPC conversation memory.
 * NPCs reference IDs from chapterLocations.ts.
 */

import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'

export interface DialogueRequirement {
  stat?: StatName
  dc?: number
  faction?: FactionId
  factionLevel?: number
  flag?: string
  questCompleted?: string
  karmaTag?: 'lawful' | 'chaotic' | 'good' | 'evil'
}

export interface DialogueEffect {
  karma?: { lawful?: number; good?: number }
  reputation?: { faction: FactionId; delta: number }
  xp?: number
  gold?: number
  flag?: string
  questStart?: string
  questProgress?: { questId: string; objectiveId: string }
  unlockLocation?: string
}

export interface DialogueOption {
  id: string
  text: string
  nextNodeId?: string // null = end conversation
  requirement?: DialogueRequirement
  effects?: DialogueEffect
  karmaTag?: 'lawful' | 'chaotic' | 'good' | 'evil'
}

export interface DialogueNode {
  id: string
  text: string
  speaker?: string
  options: DialogueOption[]
}

export interface Dialogue {
  id: string
  npcId: string
  npcName: string
  chapter: number
  title: string
  triggerCondition?: {
    flag?: string
    questActive?: string
    minVisits?: number
    requiredDialogue?: string
  }
  nodes: DialogueNode[]
}

// ============================================================
// CHAPTER 1 — The Journey West
// ============================================================

const ch1_shaw_intro: Dialogue = {
  id: 'ch1_shaw_intro',
  npcId: 'ch1_wagonmaster',
  npcName: 'Captain Josiah Shaw',
  chapter: 1,
  title: 'The Wagon Master',
  nodes: [
    {
      id: 'start',
      text: '"Heading west, are you? This ain\'t no Sunday ride to Sacramento. The trail will test every ounce of grit you\'ve got."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'ask_advice',
          text: 'What should I know before we set out?',
          nextNodeId: 'advice',
        },
        {
          id: 'ask_about_gold',
          text: 'Tell me about the gold fields.',
          nextNodeId: 'gold_talk',
        },
        {
          id: 'brag',
          text: '[Diplomacy DC 8] I\'ve crossed worse terrain than this.',
          nextNodeId: 'impressed',
          requirement: { stat: 'Diplomacy', dc: 8 },
        },
        {
          id: 'leave',
          text: 'I\'ll figure it out myself.',
          nextNodeId: undefined,
        },
      ],
    },
    {
      id: 'advice',
      text: '"Water first, gold second. Keep your powder dry and your oxen fed. And if the Pawnee approach — talk before you shoot. They know this land better than any map."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'ask_pawnee',
          text: 'What do you know about the Pawnee?',
          nextNodeId: 'pawnee_info',
        },
        {
          id: 'thanks',
          text: 'Good advice. Thank you, Captain.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'met_shaw' },
        },
      ],
    },
    {
      id: 'gold_talk',
      text: '"Gold\'s real enough. Saw a man pull a nugget big as his fist from the American River in \'49. But for every man who struck it rich, a hundred died trying. Cholera, bandits, starvation..."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'worth_it',
          text: 'That\'s a risk I\'m willing to take.',
          nextNodeId: undefined,
          effects: { xp: 5, flag: 'met_shaw' },
        },
        {
          id: 'ask_route',
          text: 'What\'s the safest route?',
          nextNodeId: 'route_info',
        },
      ],
    },
    {
      id: 'impressed',
      text: '"Ha! You\'ve got steel in your spine, I\'ll give you that. All right, greenhorn — here\'s something that ain\'t on any map. There\'s a shortcut past Alcove Spring that\'ll save you two days."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'take_shortcut',
          text: 'I\'ll remember that. Much obliged.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'shaw_shortcut',
            unlockLocation: 'ch1_alcove_spring',
          },
        },
      ],
    },
    {
      id: 'pawnee_info',
      text: '"The Pawnee aren\'t your enemy unless you make \'em one. Chief Talking Bear runs the camp east of here. Bring tobacco, not bullets."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'good_advice',
          text: '[Good] I\'ll approach them with respect.',
          nextNodeId: undefined,
          karmaTag: 'good',
          effects: {
            karma: { good: 5 },
            xp: 15,
            flag: 'met_shaw',
          },
        },
        {
          id: 'pragmatic',
          text: 'And if they don\'t want to talk?',
          nextNodeId: 'pawnee_warning',
        },
      ],
    },
    {
      id: 'pawnee_warning',
      text: '"Then you run. You hear me? You do NOT fight the Pawnee on their own land. That\'s how the Grattan Massacre started, and look how that ended."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'understood',
          text: 'Understood.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'met_shaw' },
        },
      ],
    },
    {
      id: 'route_info',
      text: '"Follow the Platte River. Don\'t ford it until you reach the bridge — Old Silas charges a toll, but it beats drowning."',
      speaker: 'Captain Josiah Shaw',
      options: [
        {
          id: 'thanks_route',
          text: 'Thanks, Captain.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'met_shaw' },
        },
      ],
    },
  ],
}

const ch1_hooded_figure: Dialogue = {
  id: 'ch1_hooded_figure',
  npcId: 'ch1_mysterious',
  npcName: 'The Hooded Figure',
  chapter: 1,
  title: 'Stranger in the Shadows',
  nodes: [
    {
      id: 'start',
      text: 'A figure watches you from the shadows beneath the depot overhang. A glint of metal — a pistol? No. A silver pocket watch.',
      options: [
        {
          id: 'approach',
          text: 'Who are you?',
          nextNodeId: 'evasive',
        },
        {
          id: 'observe',
          text: '[Shrewdness DC 12] Study them before approaching.',
          nextNodeId: 'keen_eye',
          requirement: { stat: 'Shrewdness', dc: 12 },
        },
        {
          id: 'ignore',
          text: 'Walk past without engaging.',
          nextNodeId: undefined,
        },
      ],
    },
    {
      id: 'evasive',
      text: '"Names don\'t matter out here. Only what a person carries — and what they leave behind." The figure turns the pocket watch over, revealing an engraved B on the case.',
      speaker: 'The Hooded Figure',
      options: [
        {
          id: 'ask_b',
          text: 'What does the B stand for?',
          nextNodeId: 'cryptic_b',
        },
        {
          id: 'threaten',
          text: '[Chaotic] Talk straight or I walk.',
          nextNodeId: 'respect',
          karmaTag: 'chaotic',
          effects: { karma: { lawful: -3 } },
        },
      ],
    },
    {
      id: 'keen_eye',
      text: 'You notice calluses on their shooting hand, a faded Union coat beneath the cloak, and a map sticking from their pocket — marked with an X in the Sierra Nevada foothills.',
      options: [
        {
          id: 'military',
          text: 'You served in the war. What regiment?',
          nextNodeId: 'trust_earned',
        },
        {
          id: 'map_question',
          text: 'That map — what\'s at the X?',
          nextNodeId: 'treasure_hint',
        },
      ],
    },
    {
      id: 'cryptic_b',
      text: '"B is for... Back of Beyond. A place out in the Gold Country foothills. If you make it that far, you\'ll understand." They close the watch with a snap.',
      speaker: 'The Hooded Figure',
      options: [
        {
          id: 'remember',
          text: 'Back of Beyond. I\'ll remember that.',
          nextNodeId: undefined,
          effects: { xp: 15, flag: 'hooded_figure_bobr_hint' },
        },
      ],
    },
    {
      id: 'respect',
      text: '"Ha. Direct. I like that." They lower their hood — a weathered face, one milky eye. "Name\'s Silas. I\'m headed where you\'re headed. We\'ll cross paths again."',
      speaker: 'Silas',
      options: [
        {
          id: 'deal',
          text: 'Looking forward to it.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'met_silas' },
        },
      ],
    },
    {
      id: 'trust_earned',
      text: '"Third Ohio. Fought at Shiloh." A long pause. "I\'m looking for something a dead friend left behind. In the California hills. If you\'re headed that way... we might help each other."',
      speaker: 'The Hooded Figure',
      options: [
        {
          id: 'ally',
          text: '[Good] I\'d welcome a travel companion.',
          nextNodeId: undefined,
          karmaTag: 'good',
          effects: {
            karma: { good: 3 },
            xp: 25,
            flag: 'allied_with_silas',
          },
        },
        {
          id: 'solo',
          text: 'I travel alone.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'met_silas' },
        },
      ],
    },
    {
      id: 'treasure_hint',
      text: '"A friend — Tobias was his name — he drew that map before he died. Said the real treasure ain\'t gold. I aim to find out what he meant."',
      speaker: 'The Hooded Figure',
      options: [
        {
          id: 'intrigued',
          text: 'Tobias... I\'ll keep that name in mind.',
          nextNodeId: undefined,
          effects: { xp: 20, flag: 'tobias_early_hint' },
        },
      ],
    },
  ],
}

const ch1_chief_talking_bear: Dialogue = {
  id: 'ch1_chief_talking_bear',
  npcId: 'ch1_chief',
  npcName: 'Chief Talking Bear',
  chapter: 1,
  title: 'The Village Elder',
  nodes: [
    {
      id: 'start',
      text: 'The elder sits cross-legged beside a low fire. He studies you for a long moment before speaking. "The land remembers everyone who walks on it. It will remember you. The question is — how?"',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'respect',
          text: '[Diplomacy DC 12] I come in peace, to learn.',
          nextNodeId: 'welcomed',
          requirement: { stat: 'Diplomacy', dc: 12 },
        },
        {
          id: 'trade',
          text: 'I\'d like to trade.',
          nextNodeId: 'trade_talk',
        },
        {
          id: 'ask_gold',
          text: 'Do your people know where to find gold?',
          nextNodeId: 'disappointed',
        },
      ],
    },
    {
      id: 'welcomed',
      text: '"Then you are welcome here." He gestures to the fire. "Sir. My grandmother told me of the star-watchers who came before even our people. They left marks in the caves that no one can read."',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'caves',
          text: 'Star-watchers? What caves?',
          nextNodeId: 'cave_lore',
        },
        {
          id: 'thank',
          text: '[Good] Thank you for your hospitality.',
          nextNodeId: undefined,
          karmaTag: 'good',
          effects: {
            karma: { good: 5 },
            reputation: { faction: 'natives', delta: 10 },
            xp: 25,
            flag: 'chief_welcomed',
          },
        },
      ],
    },
    {
      id: 'trade_talk',
      text: '"Trade is honest work. Marie Whitehawk handles our trading. She speaks your language better than I do."',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'find_marie',
          text: 'I\'ll speak with her. Thank you.',
          nextNodeId: undefined,
          effects: {
            xp: 5,
            reputation: { faction: 'natives', delta: 3 },
          },
        },
      ],
    },
    {
      id: 'disappointed',
      text: '"Gold." His expression hardens. "You white men tear apart the earth for yellow rocks and call it progress. My people have lived here for a thousand years without needing to dig."',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'apologize',
          text: '[Good] You\'re right. I apologize for my rudeness.',
          nextNodeId: 'forgiven',
          karmaTag: 'good',
          effects: { karma: { good: 3 } },
        },
        {
          id: 'insist',
          text: '[Evil] Gold is progress. Your people will learn that.',
          nextNodeId: 'banished',
          karmaTag: 'evil',
          effects: {
            karma: { good: -10 },
            reputation: { faction: 'natives', delta: -15 },
          },
        },
      ],
    },
    {
      id: 'cave_lore',
      text: '"West of here, where the rivers meet. The caves hold paintings older than memory. Some say the star-watchers hid something there — something that glows in the dark."',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'investigate',
          text: 'I\'d like to see those caves someday.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'chief_cave_lore',
            reputation: { faction: 'natives', delta: 5 },
          },
        },
      ],
    },
    {
      id: 'forgiven',
      text: '"Words spoken quickly are forgiven when the heart is slow to mean them. You may stay." He offers you a piece of dried venison.',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'accept',
          text: 'Accept gratefully.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            reputation: { faction: 'natives', delta: 5 },
            flag: 'chief_forgave',
          },
        },
      ],
    },
    {
      id: 'banished',
      text: '"Then you are not welcome here. Leave. Now." Warriors rise from the shadows around you.',
      speaker: 'Chief Talking Bear',
      options: [
        {
          id: 'leave_forced',
          text: 'Leave quickly.',
          nextNodeId: undefined,
          effects: { flag: 'banished_from_pawnee' },
        },
      ],
    },
  ],
}

// ============================================================
// CHAPTER 2 — Volcano, California
// ============================================================

const ch2_big_mae: Dialogue = {
  id: 'ch2_big_mae',
  npcId: 'ch2_barkeep',
  npcName: 'Big Mae Sullivan',
  chapter: 2,
  title: 'The Saloon Owner',
  nodes: [
    {
      id: 'start',
      text: '"Welcome to Mae\'s. Whiskey\'s two bits, information\'s a dollar, and trouble\'s free." She polishes a glass, eyeing you up.',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'buy_whiskey',
          text: 'I\'ll take a whiskey.',
          nextNodeId: 'drink_talk',
          effects: { gold: -2 },
        },
        {
          id: 'buy_info',
          text: 'I\'ll take the information.',
          nextNodeId: 'info_cost',
        },
        {
          id: 'charm',
          text: '[Diplomacy DC 10] How about a drink on the house for a charming stranger?',
          nextNodeId: 'charmed',
          requirement: { stat: 'Diplomacy', dc: 10 },
        },
      ],
    },
    {
      id: 'drink_talk',
      text: 'She pours a generous shot. "You don\'t look like a miner. Too clean. Detective? Bounty hunter?" She leans on the bar.',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'honest',
          text: '[Lawful] Just a traveler looking for honest work.',
          nextNodeId: 'mae_trusts',
          karmaTag: 'lawful',
          effects: { karma: { lawful: 3 } },
        },
        {
          id: 'lie',
          text: '[Chaotic] I\'m a writer. Collecting stories.',
          nextNodeId: 'mae_stories',
          karmaTag: 'chaotic',
          effects: { karma: { lawful: -2 } },
        },
      ],
    },
    {
      id: 'info_cost',
      text: '"A dollar says you want to know about the missing miner — Cornelius Finch. Everyone does. His brother Ezra\'s been asking around too."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'pay',
          text: 'Here\'s your dollar. Tell me everything.',
          nextNodeId: 'finch_info',
          effects: { gold: -10, questStart: 'ch2_missing_miner' },
        },
        {
          id: 'negotiate',
          text: '[Shrewdness DC 10] Half a dollar now, half when the info pays off.',
          nextNodeId: 'finch_info',
          requirement: { stat: 'Shrewdness', dc: 10 },
          effects: { gold: -5, questStart: 'ch2_missing_miner' },
        },
      ],
    },
    {
      id: 'charmed',
      text: '"Ha! You\'ve got brass, I\'ll say that." She pours two glasses. "Drink with me and I\'ll tell you something worth knowing."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'drink_together',
          text: 'To new friends.',
          nextNodeId: 'mae_secret',
          effects: { xp: 15, flag: 'mae_friend' },
        },
      ],
    },
    {
      id: 'mae_trusts',
      text: '"Honest, huh? That\'s rare in a gold camp. There\'s a miner — Cornelius Finch — went into the old shaft three days ago and never came back. His brother\'s offering a reward."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'take_quest',
          text: 'I\'ll look into it.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            questStart: 'ch2_missing_miner',
            flag: 'mae_trusted_you',
          },
        },
      ],
    },
    {
      id: 'mae_stories',
      text: '"A writer! Like Sam Clemens who passed through Angels Camp? All right, writer — here\'s a story. The Masonic Lodge up the hill holds meetings every full moon. No one talks about what happens inside."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'masonic',
          text: 'Interesting. Where\'s this lodge?',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'mae_lodge_hint',
            unlockLocation: 'ch2_masonic_lodge',
          },
        },
      ],
    },
    {
      id: 'finch_info',
      text: '"Cornelius was working the old Mercury Shaft — the one they sealed off after the cave-in of \'52. Someone reopened it. Cornelius went in to check it out and... nothing. His lantern was found at the entrance, still lit."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'investigate',
          text: 'Where\'s this Mercury Shaft?',
          nextNodeId: undefined,
          effects: { xp: 15, flag: 'finch_info_obtained' },
        },
      ],
    },
    {
      id: 'mae_secret',
      text: '"Between you and me — Slim Perkins at the miners\' camp has been spending more gold than a drifter should have. And Cornelius Finch is still missing. You do the math."',
      speaker: 'Big Mae Sullivan',
      options: [
        {
          id: 'noted',
          text: 'Slim Perkins. I\'ll keep my eyes open.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'mae_slim_suspicion',
            questStart: 'ch2_missing_miner',
          },
        },
      ],
    },
  ],
}

const ch2_master_crane: Dialogue = {
  id: 'ch2_master_crane',
  npcId: 'ch2_mason',
  npcName: 'Worshipful Master Crane',
  chapter: 2,
  title: 'The Lodge Master',
  nodes: [
    {
      id: 'start',
      text: '"You stand at the threshold of knowledge, stranger. The square and compass measure more than angles — they measure character."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'seek_knowledge',
          text: '[Shrewdness DC 12] I seek what\'s hidden behind symbols.',
          nextNodeId: 'impressed',
          requirement: { stat: 'Shrewdness', dc: 12 },
        },
        {
          id: 'ask_about_miner',
          text: 'I\'m looking for a missing miner — Cornelius Finch.',
          nextNodeId: 'finch_mason',
        },
        {
          id: 'direct',
          text: 'What does the lodge actually do?',
          nextNodeId: 'evasive_answer',
        },
      ],
    },
    {
      id: 'impressed',
      text: '"You have an inquiring mind. Good. The lodge preserves secrets that predate this gold rush. Some say we guard a map — one drawn by the first Anglos to survey these hills. A map that shows what lies beneath."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'map',
          text: 'A map to what?',
          nextNodeId: 'map_tease',
        },
        {
          id: 'join',
          text: 'How does one join the lodge?',
          nextNodeId: 'membership',
        },
      ],
    },
    {
      id: 'finch_mason',
      text: '"Brother Cornelius..." Crane\'s composure cracks for a moment. "He was one of us. He found something in the old shafts — something he shouldn\'t have. We told him to leave it alone."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'what_found',
          text: 'What did he find?',
          nextNodeId: 'lodge_secret',
        },
        {
          id: 'help_find',
          text: '[Lawful] Let me help find him. The law should know.',
          nextNodeId: 'no_law',
          karmaTag: 'lawful',
          effects: { karma: { lawful: 3 } },
        },
      ],
    },
    {
      id: 'evasive_answer',
      text: '"We build character. We practice charity. We keep the traditions of our ancient craft." His smile says he\'s reciting from a pamphlet.',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'press',
          text: '[Shrewdness DC 10] That\'s the answer for strangers. What\'s the real answer?',
          nextNodeId: 'impressed',
          requirement: { stat: 'Shrewdness', dc: 10 },
        },
        {
          id: 'accept',
          text: 'Fair enough.',
          nextNodeId: undefined,
          effects: { xp: 5 },
        },
      ],
    },
    {
      id: 'map_tease',
      text: '"Beneath the Gold Country hills are tunnels — natural and man-made — that connect in ways no living soul has fully mapped. The first surveyors knew. The Miwok knew before them."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'miwok',
          text: 'The Miwok knew about underground tunnels?',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'crane_tunnel_lore',
          },
        },
      ],
    },
    {
      id: 'membership',
      text: '"Prove yourself worthy. Complete a task for the lodge — find what happened to Brother Cornelius — and I will sponsor your petition myself."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'accept_task',
          text: 'I\'ll find Cornelius.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            flag: 'crane_quest_accepted',
            questStart: 'ch2_missing_miner',
          },
        },
      ],
    },
    {
      id: 'lodge_secret',
      text: '"An old chamber. Pre-Gold Rush. Carved symbols on the walls — not Miwok, not Spanish, not Anglo. Something older. And gold. Not nuggets — worked gold. Jewelry, perhaps, from a civilization we have no name for."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'ancient_gold',
          text: 'An unknown civilization in California?',
          nextNodeId: undefined,
          effects: {
            xp: 25,
            flag: 'ancient_civilization_hint',
          },
        },
      ],
    },
    {
      id: 'no_law',
      text: '"No law! The sheriff answers to the mine owners, and the mine owners would strip those tunnels bare if they knew. This must be handled... discreetly."',
      speaker: 'Worshipful Master Crane',
      options: [
        {
          id: 'discreet',
          text: 'I can be discreet.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'crane_quest_accepted',
            questStart: 'ch2_missing_miner',
          },
        },
      ],
    },
  ],
}

const ch2_slim_perkins: Dialogue = {
  id: 'ch2_slim_perkins',
  npcId: 'ch2_claim_jumper',
  npcName: 'Slim Perkins',
  chapter: 2,
  title: 'The Drifter',
  nodes: [
    {
      id: 'start',
      text: 'A wiry man in a battered hat leans against the sluice, rolling a cigarette. He sizes you up the way a cat watches a mouse.',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'friendly',
          text: 'New in town. Name\'s —',
          nextNodeId: 'dont_care',
        },
        {
          id: 'suspicious',
          text: '[Shrewdness DC 10] You\'re spending a lot of gold for a drifter.',
          nextNodeId: 'caught',
          requirement: { stat: 'Shrewdness', dc: 10 },
        },
        {
          id: 'buy_drink',
          text: 'Buy you a drink?',
          nextNodeId: 'loosened',
          effects: { gold: -2 },
        },
      ],
    },
    {
      id: 'dont_care',
      text: '"Don\'t need your name. Don\'t give mine for free either." He lights the cigarette. "You looking for work or just passing through?"',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'work',
          text: 'What kind of work?',
          nextNodeId: 'shady_offer',
        },
        {
          id: 'passing',
          text: 'Just passing through.',
          nextNodeId: undefined,
          effects: { xp: 5 },
        },
      ],
    },
    {
      id: 'caught',
      text: 'His hand twitches toward his belt. "Who told you that? Mae? That woman\'s got a mouth wider than the Stanislaus River." He forces a grin. "I got lucky at cards. That\'s all."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'press',
          text: '[Shrewdness DC 12] Cards don\'t explain the mine dust on your boots.',
          nextNodeId: 'panicked',
          requirement: { stat: 'Shrewdness', dc: 12 },
        },
        {
          id: 'let_go',
          text: 'Sure. Lucky at cards.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'slim_suspicious' },
        },
      ],
    },
    {
      id: 'loosened',
      text: 'Two drinks in, Slim gets talkative. "Between you and me... there\'s an abandoned shaft nobody\'s watching. Old Mercury Mine. I been, uh, supplementing my income."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'partner_offer',
          text: '[Chaotic] Sounds like you could use a partner.',
          nextNodeId: 'partner',
          karmaTag: 'chaotic',
          effects: { karma: { lawful: -5 } },
        },
        {
          id: 'cornelius',
          text: 'Mercury Mine — that\'s where Cornelius Finch went missing.',
          nextNodeId: 'panicked',
        },
      ],
    },
    {
      id: 'shady_offer',
      text: '"I know a claim that\'s being worked by one man. Old prospector, half-deaf. His land\'s worth ten times what he pulls out. All he needs is... encouragement to sell."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'join',
          text: '[Evil] What\'s my cut?',
          nextNodeId: 'deal',
          karmaTag: 'evil',
          effects: { karma: { good: -5 } },
        },
        {
          id: 'refuse',
          text: '[Good] That\'s claim jumping. I won\'t be part of it.',
          nextNodeId: 'rejected',
          karmaTag: 'good',
          effects: { karma: { good: 5, lawful: 3 } },
        },
      ],
    },
    {
      id: 'panicked',
      text: 'Slim\'s face goes white. "I didn\'t do nothing to Cornelius! I swear! I found the shaft already open. He was already gone when I got there. Look — I\'ll tell you everything I saw if you keep my name out of it."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'deal_info',
          text: '[Lawful] Tell me, and I\'ll decide what\'s fair.',
          nextNodeId: 'confession',
          karmaTag: 'lawful',
          effects: { karma: { lawful: 3 } },
        },
        {
          id: 'blackmail',
          text: '[Evil] Your secret\'s safe — for a price.',
          nextNodeId: 'bribed',
          karmaTag: 'evil',
          effects: { karma: { good: -5 } },
        },
      ],
    },
    {
      id: 'partner',
      text: '"Now you\'re talking! Fifty-fifty split. We go in at night, fill our pockets, and nobody\'s the wiser." He spits and extends a grimy hand.',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'shake',
          text: 'You\'ve got a deal.',
          nextNodeId: undefined,
          effects: {
            gold: 30,
            xp: 15,
            flag: 'slim_partner',
            reputation: { faction: 'outlaws', delta: 10 },
            questStart: 'ch2_claim_jumper',
          },
        },
      ],
    },
    {
      id: 'deal',
      text: '"Forty percent. Plus you handle the talking — I don\'t do persuasion well." He grins. "Meet me at the old prospector\'s claim at sundown."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'agree',
          text: 'Done.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            flag: 'slim_claim_jumper_partner',
            questStart: 'ch2_claim_jumper',
          },
        },
      ],
    },
    {
      id: 'rejected',
      text: '"Your loss. But don\'t come crying when you\'re broke and eating dirt." He flicks his cigarette and walks away.',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'done',
          text: 'Watch your step, Perkins.',
          nextNodeId: undefined,
          effects: { xp: 10, reputation: { faction: 'settlers', delta: 5 } },
        },
      ],
    },
    {
      id: 'confession',
      text: '"Inside the shaft — there were fresh marks on the wall. Like someone was digging at a sealed passage. And I heard sounds from deep down. Like hammering. Cornelius might still be alive down there."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'go_save',
          text: 'Then I\'m going in after him.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'slim_confession',
            questProgress: { questId: 'ch2_missing_miner', objectiveId: 'find_clue' },
          },
        },
      ],
    },
    {
      id: 'bribed',
      text: '"F-fine. Take this." He hands over a leather pouch of gold dust, hands trembling. "Just... leave me be."',
      speaker: 'Slim Perkins',
      options: [
        {
          id: 'take',
          text: 'Pleasure doing business.',
          nextNodeId: undefined,
          effects: {
            gold: 25,
            xp: 10,
            flag: 'slim_blackmailed',
          },
        },
      ],
    },
  ],
}

// ============================================================
// CHAPTER 3 — Angels Camp
// ============================================================

const ch3_sam_clemens: Dialogue = {
  id: 'ch3_sam_clemens',
  npcId: 'ch3_twain',
  npcName: 'Sam Clemens',
  chapter: 3,
  title: 'The Reporter',
  nodes: [
    {
      id: 'start',
      text: 'A young man with an unruly mustache sits at a corner table, scribbling furiously in a notebook. He looks up with bright, amused eyes. "Don\'t tell me — another miner with a get-rich-quick story. I\'ve heard forty today."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'not_miner',
          text: 'I\'m no miner. But I have a better story.',
          nextNodeId: 'intrigued',
        },
        {
          id: 'clever',
          text: '[Shrewdness DC 12] You\'re Sam Clemens. I\'ve read your dispatches. Sharp writing.',
          nextNodeId: 'flattered',
          requirement: { stat: 'Shrewdness', dc: 12 },
        },
        {
          id: 'frog',
          text: 'I heard there\'s a frog-jumping contest.',
          nextNodeId: 'frog_talk',
        },
      ],
    },
    {
      id: 'intrigued',
      text: '"Better than gold fever? Better than the fellow who tried to bribe a mule? You have my attention for exactly sixty seconds."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'theft_story',
          text: 'There\'s been a gold theft. The sheriff\'s stumped.',
          nextNodeId: 'story_hooked',
        },
        {
          id: 'tunnel_story',
          text: 'Someone found pre-Gold Rush tunnels. With worked gold inside.',
          nextNodeId: 'big_story',
        },
      ],
    },
    {
      id: 'flattered',
      text: '"Well now! A literate person in a mining camp. That\'s rarer than an honest lawyer." He puts down his pen. "You\'ve bought yourself a conversation. What do you need?"',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'help_investigate',
          text: 'A journalist\'s eyes and ears. I\'m investigating a gold theft.',
          nextNodeId: 'story_hooked',
        },
        {
          id: 'local_color',
          text: 'Just the local gossip. What\'s the real story of Angels Camp?',
          nextNodeId: 'angels_history',
        },
      ],
    },
    {
      id: 'frog_talk',
      text: '"Ah, the celebrated jumping frog! A fellow named Smiley runs the thing. Claims his frog can out-jump any frog in Calaveras County. I suspect he\'s feeding it buckshot."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'enter_contest',
          text: 'I might enter a frog of my own.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            flag: 'clemens_frog_tip',
          },
        },
        {
          id: 'buckshot',
          text: 'Buckshot? That\'s cheating!',
          nextNodeId: 'twain_wisdom',
        },
      ],
    },
    {
      id: 'story_hooked',
      text: '"A gold theft! Now that\'s a headline." He grabs a fresh sheet. "The pen is mightier than the pickaxe. You investigate, I\'ll write it up. If it leads to an arrest, we both win."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'partners',
          text: 'Deal. I\'ll bring you evidence, you bring public pressure.',
          nextNodeId: undefined,
          effects: {
            xp: 25,
            flag: 'clemens_ally',
            questStart: 'ch3_gold_theft',
          },
        },
      ],
    },
    {
      id: 'big_story',
      text: '"Pre-Gold Rush tunnels with worked gold?" His pen hovers. "That would rewrite California history. And make someone very rich — or very dead. Who knows about this?"',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'few_know',
          text: 'Just the Masons in Volcano. And now you.',
          nextNodeId: undefined,
          effects: {
            xp: 30,
            flag: 'clemens_ancient_secret',
          },
        },
      ],
    },
    {
      id: 'angels_history',
      text: '"Angels Camp. Named for Henry Angel, who set up a trading post in 1848. Now it\'s all boom and bust. Miners come, miners go, and the shopkeepers get rich selling shovels."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'know_more',
          text: 'What about the bandits in the hills?',
          nextNodeId: 'bandit_lore',
        },
        {
          id: 'enough',
          text: 'Thanks. Good talking to you.',
          nextNodeId: undefined,
          effects: { xp: 10 },
        },
      ],
    },
    {
      id: 'bandit_lore',
      text: '"Joaquin Three-Fingers runs a gang out of the old mine above town. The sheriff won\'t touch him — too many guns. But Joaquin\'s got a code. He doesn\'t rob the poor. Only the mine owners."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'robin_hood',
          text: 'A Robin Hood of the Gold Country.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'clemens_bandit_info',
            unlockLocation: 'ch3_secret_mine',
          },
        },
      ],
    },
    {
      id: 'twain_wisdom',
      text: '"Is it cheating if everyone does it? In California, the only rule is: don\'t get caught." He winks. "That applies to frogs AND to men."',
      speaker: 'Sam Clemens',
      options: [
        {
          id: 'laugh',
          text: 'Ha. You should write that down.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'clemens_met' },
        },
      ],
    },
  ],
}

const ch3_joaquin: Dialogue = {
  id: 'ch3_joaquin',
  npcId: 'ch3_bandit_boss',
  npcName: 'Joaquin Three-Fingers',
  chapter: 3,
  title: 'The Bandit Leader',
  nodes: [
    {
      id: 'start',
      text: 'Three men with rifles block the mine entrance. From the darkness inside, a voice: "Let \'em in. I want to hear why someone walks into a bandit\'s den of their own free will."',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'brave',
          text: '[Agility DC 12] Because I\'m fast enough to walk out again.',
          nextNodeId: 'respected',
          requirement: { stat: 'Agility', dc: 12 },
        },
        {
          id: 'business',
          text: 'I have a business proposition.',
          nextNodeId: 'listening',
        },
        {
          id: 'law',
          text: '[Lawful] The sheriff sent me to negotiate.',
          nextNodeId: 'sheriff_talk',
          karmaTag: 'lawful',
          effects: { karma: { lawful: 3 } },
        },
      ],
    },
    {
      id: 'respected',
      text: 'Joaquin steps into the light — missing two fingers on his left hand, but his right holds a Colt like it grew there. "Fast mouth AND fast hands. Rare combination. Sit. Drink."',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'sit',
          text: 'Don\'t mind if I do.',
          nextNodeId: 'trust_talk',
        },
      ],
    },
    {
      id: 'listening',
      text: '"Business." He weighs the word like gold dust. "I\'m listening. But understand — if I don\'t like what I hear, my boys will escort you out. Minus your boots."',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'gold_theft',
          text: 'The gold shipment stolen last week — that was your crew. I know where the mine owners are shipping next.',
          nextNodeId: 'interested',
        },
        {
          id: 'ally_offer',
          text: 'I need muscle. You need a way to sell gold without drawing suspicion.',
          nextNodeId: 'interested',
        },
      ],
    },
    {
      id: 'sheriff_talk',
      text: '"The sheriff." Joaquin spits. "That coward. All right — what does he want? My surrender? My head? My mother\'s recipe for tamales?"',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'peace',
          text: '[Diplomacy DC 14] Peace. Leave the stage coaches alone and he\'ll leave you alone.',
          nextNodeId: 'consider_peace',
          requirement: { stat: 'Diplomacy', dc: 14 },
        },
        {
          id: 'truth',
          text: 'Honestly? I lied about the sheriff. But I do need your help.',
          nextNodeId: 'trust_talk',
          effects: { reputation: { faction: 'outlaws', delta: 5 } },
        },
      ],
    },
    {
      id: 'trust_talk',
      text: '"I rob mine owners because they rob this land. They poison the rivers with mercury, destroy the Miwok sacred places, work Chinese miners until they drop. Someone has to take from the takers."',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'agree',
          text: '[Good] You\'re fighting injustice. I can respect that.',
          nextNodeId: 'alliance',
          karmaTag: 'good',
          effects: { karma: { good: 3 } },
        },
        {
          id: 'pragmatic',
          text: 'Noble words for a bandit. But I need information, not philosophy.',
          nextNodeId: 'info_exchange',
        },
      ],
    },
    {
      id: 'interested',
      text: '"Now you have my full attention." He leans forward, firelight dancing in his eyes. "What exactly do you propose?"',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'elaborate',
          text: 'A partnership. Your knowledge of the hills, my access to town.',
          nextNodeId: 'alliance',
        },
      ],
    },
    {
      id: 'consider_peace',
      text: '"Peace..." He strokes the stumps of his missing fingers. "The mine owners cut these off when I organized the Mexican workers. Peace requires something first — justice. Can the sheriff guarantee that?"',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'try',
          text: 'I\'ll make your case to the town.',
          nextNodeId: undefined,
          effects: {
            xp: 30,
            flag: 'joaquin_peace_negotiated',
            reputation: { faction: 'outlaws', delta: 10 },
          },
        },
      ],
    },
    {
      id: 'alliance',
      text: '"Then we have an understanding. My camp is open to you. And if you need men at your back — you\'ll have them." He extends his three-fingered hand.',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'shake',
          text: 'Shake his hand.',
          nextNodeId: undefined,
          effects: {
            xp: 25,
            flag: 'joaquin_ally',
            reputation: { faction: 'outlaws', delta: 15 },
          },
        },
      ],
    },
    {
      id: 'info_exchange',
      text: '"Fine. No philosophy. Here\'s practical — the gold shipments run through Natural Bridges every Tuesday. Sheriff\'s deputies escort them. Two men, one wagon, predictable as sunrise."',
      speaker: 'Joaquin Three-Fingers',
      options: [
        {
          id: 'useful',
          text: 'Good to know. I\'ll be in touch.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'joaquin_shipment_info',
          },
        },
      ],
    },
  ],
}

const ch3_blind_jake: Dialogue = {
  id: 'ch3_blind_jake',
  npcId: 'ch3_cave_guide',
  npcName: 'Blind Jake',
  chapter: 3,
  title: 'The Cave Guide',
  nodes: [
    {
      id: 'start',
      text: 'A man with clouded eyes sits at the cave entrance, whittling. He turns his head before you speak — as if he heard you thinking. "You\'re here to see the cavern. They all are. But the cavern sees you first."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'hire',
          text: 'I need a guide. How much?',
          nextNodeId: 'price',
        },
        {
          id: 'how_blind',
          text: 'How do you guide if you can\'t see?',
          nextNodeId: 'senses',
        },
        {
          id: 'expertise',
          text: '[Expertise DC 12] These rock formations — this is limestone karst. How deep does it go?',
          nextNodeId: 'deep_knowledge',
          requirement: { stat: 'Expertise', dc: 12 },
        },
      ],
    },
    {
      id: 'price',
      text: '"Two dollars for the tourist walk. Ten dollars for the deep tour — where the light don\'t reach and the air tastes like copper. That\'s where the real gold is."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'tourist',
          text: 'Tourist walk.',
          nextNodeId: undefined,
          effects: { gold: -2, xp: 10 },
        },
        {
          id: 'deep',
          text: 'The deep tour.',
          nextNodeId: 'deep_warning',
          effects: { gold: -10 },
        },
      ],
    },
    {
      id: 'senses',
      text: '"Lost my eyes in a dynamite accident, \'53. But I gained something. Down in the dark, sight\'s useless anyway. I hear the water, feel the air, smell the minerals. The cave talks to me."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'what_talks',
          text: 'What does it say?',
          nextNodeId: 'cave_talks',
        },
      ],
    },
    {
      id: 'deep_knowledge',
      text: '"Karst! You know your rock." His blind face breaks into a grin. "Goes down three hundred feet at least. Connects to the old mine systems — the ones from before. Before the Anglos. Before the Spanish. Before."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'before_what',
          text: 'Before what?',
          nextNodeId: 'ancient_hint',
        },
      ],
    },
    {
      id: 'deep_warning',
      text: '"Good choice. Stay close to my voice. Don\'t touch the walls where they\'re wet — that\'s mercury runoff from the old mines. Poison. And if you hear singing from below... that\'s not an echo."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'singing',
          text: 'Singing? Who\'s down there?',
          nextNodeId: 'cave_talks',
        },
        {
          id: 'lead_on',
          text: 'Lead the way.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'deep_cave_tour',
          },
        },
      ],
    },
    {
      id: 'cave_talks',
      text: '"Miners who went too deep and never came back. Or something older. The Miwok say spirits live in these hills — guardians of the gold. Maybe they\'re right."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'believe',
          text: 'I believe in what I can see. But I\'ll keep my ears open.',
          nextNodeId: undefined,
          effects: { xp: 15, flag: 'cave_spirits_lore' },
        },
      ],
    },
    {
      id: 'ancient_hint',
      text: '"Before people had a name for this place. I found markings — hand prints, spirals, a shape like a comet. No known culture matches them. The university men said I was imagining things." He laughs. "I\'m blind, not crazy."',
      speaker: 'Blind Jake',
      options: [
        {
          id: 'fascinating',
          text: 'I\'d like to see those markings.',
          nextNodeId: undefined,
          effects: {
            xp: 25,
            flag: 'jake_ancient_markings',
          },
        },
      ],
    },
  ],
}

// ============================================================
// CHAPTER 4 — Building the Ranch
// ============================================================

const ch4_judge_whitfield: Dialogue = {
  id: 'ch4_judge_whitfield',
  npcId: 'ch4_judge',
  npcName: 'Judge Whitfield',
  chapter: 4,
  title: 'The County Judge',
  nodes: [
    {
      id: 'start',
      text: '"Sit down. Court\'s not in session, but I\'m always judging." He peers over half-moon spectacles. "You\'re the one buying the old Rutherford claim. Smart purchase — or foolish. Time will tell."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'legal',
          text: 'Is the deed clean? I want no trouble.',
          nextNodeId: 'deed_talk',
        },
        {
          id: 'fraud',
          text: 'I\'ve heard rumors about land fraud in these parts.',
          nextNodeId: 'fraud_talk',
        },
        {
          id: 'diplomacy',
          text: '[Diplomacy DC 12] Judge, I need an ally in this county. What would that cost?',
          nextNodeId: 'alliance_price',
          requirement: { stat: 'Diplomacy', dc: 12 },
        },
      ],
    },
    {
      id: 'deed_talk',
      text: '"Clean enough. Though in Gold Country, \'clean\' is relative. The Rutherfords abandoned it after the water dispute of \'55. Nobody contested since." He stamps a document. "Filed. You\'re legal."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'water',
          text: 'Water dispute?',
          nextNodeId: 'water_history',
        },
        {
          id: 'thanks',
          text: 'Thank you, Judge.',
          nextNodeId: undefined,
          effects: { xp: 10, flag: 'deed_registered' },
        },
      ],
    },
    {
      id: 'fraud_talk',
      text: '"Rumors." His jaw tightens. "Samuel Clemson — the lawyer down the hall — handles most land transactions. I\'ve had... concerns about some of his filings. But concerns aren\'t evidence."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'evidence',
          text: 'What would you need to act?',
          nextNodeId: 'evidence_needed',
        },
        {
          id: 'drop_it',
          text: 'Just making conversation.',
          nextNodeId: undefined,
          effects: { xp: 5 },
        },
      ],
    },
    {
      id: 'alliance_price',
      text: '"Direct. I appreciate that." He removes his spectacles. "An ally doesn\'t come cheap. But I need someone to investigate Clemson quietly. Bring me proof of fraud, and this county will remember your name."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'accept_quest',
          text: 'I\'ll get your proof.',
          nextNodeId: undefined,
          effects: {
            xp: 20,
            flag: 'judge_quest',
            questStart: 'ch4_land_fraud',
            reputation: { faction: 'pinkerton', delta: 10 },
          },
        },
      ],
    },
    {
      id: 'water_history',
      text: '"The creek that runs through your property feeds three other ranches. The Rutherfords tried to dam it. Their neighbors weren\'t pleased. One night, the dam washed out. So did the Rutherfords\' barn. Coincidence, I\'m sure."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'dam_wise',
          text: 'I\'ll be smarter about water.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'water_history_known',
            questStart: 'ch4_water_rights',
          },
        },
      ],
    },
    {
      id: 'evidence_needed',
      text: '"Clemson keeps duplicate records at his office. The originals he files with me. If the duplicates don\'t match the originals... that\'s fraud. But he keeps his office locked tighter than the assayer\'s vault."',
      speaker: 'Judge Whitfield',
      options: [
        {
          id: 'investigate',
          text: 'I\'ll find a way in.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'clemson_investigation',
            questStart: 'ch4_land_fraud',
          },
        },
      ],
    },
  ],
}

const ch4_sarah_mcgraw: Dialogue = {
  id: 'ch4_sarah_mcgraw',
  npcId: 'ch4_neighbor_wife',
  npcName: 'Sarah McGraw',
  chapter: 4,
  title: 'The Homesteader',
  nodes: [
    {
      id: 'start',
      text: 'A woman in a flour-dusted apron meets you at the fence line with a rifle in one hand and a pie in the other. "You the one bought the Rutherford place? Pie or a warning — your choice."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'pie',
          text: 'I\'ll take the pie.',
          nextNodeId: 'friendly_start',
        },
        {
          id: 'warning',
          text: 'I\'ll take the warning.',
          nextNodeId: 'warning_first',
        },
        {
          id: 'both',
          text: '[Diplomacy DC 8] Both? I could use a good neighbor and a good meal.',
          nextNodeId: 'charmed',
          requirement: { stat: 'Diplomacy', dc: 8 },
        },
      ],
    },
    {
      id: 'friendly_start',
      text: 'She hands over the pie — blackberry. "Welcome to the neighborhood. Thomas and I have been here five years. Built this place from nothing. If you need help, ask. If you need trouble, look elsewhere."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'advice',
          text: 'What should I know about this land?',
          nextNodeId: 'land_advice',
        },
        {
          id: 'thank',
          text: 'Thank you, Mrs. McGraw. I hope to be a good neighbor.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            flag: 'sarah_friendly',
            reputation: { faction: 'settlers', delta: 5 },
          },
        },
      ],
    },
    {
      id: 'warning_first',
      text: '"Don\'t dam the creek. The Rutherfords learned that the hard way. Don\'t cut the old oaks. And don\'t trust Samuel Clemson — he\'ll sell your own land back to you if you let him."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'clemson',
          text: 'What\'s Clemson\'s game?',
          nextNodeId: 'clemson_warning',
        },
        {
          id: 'got_it',
          text: 'Noted. Now about that pie...',
          nextNodeId: 'friendly_start',
        },
      ],
    },
    {
      id: 'charmed',
      text: 'She laughs — a big, honest sound. "I like you already. Come on in. Thomas! Company!" She holds the gate open. The rifle disappears behind the door.',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'enter',
          text: 'Step inside.',
          nextNodeId: 'inside_talk',
        },
      ],
    },
    {
      id: 'land_advice',
      text: '"The soil\'s good for fruit trees — apples do well here. The creek\'s reliable through October, then it slows. Build a cistern before summer ends. And the cave system under the south ridge? Stay out of it unless you want trouble."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'cave',
          text: 'What kind of trouble?',
          nextNodeId: 'cave_warning',
        },
        {
          id: 'practical',
          text: 'Good advice. I\'ll start with the cistern.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'sarah_land_advice',
          },
        },
      ],
    },
    {
      id: 'clemson_warning',
      text: '"He files fake claims on abandoned properties, then charges the new buyers a \'research fee\' to clear the title. The judge suspects him but needs proof. Half the settlers here have paid Clemson money they didn\'t owe."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'fight_back',
          text: 'Someone should stop him.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'clemson_fraud_known',
            questStart: 'ch4_land_fraud',
          },
        },
      ],
    },
    {
      id: 'inside_talk',
      text: 'The McGraw kitchen is warm and full of the smell of fresh bread. Thomas, a quiet man with calloused hands, nods in greeting. Sarah pours coffee.',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'community',
          text: 'How\'s the community here?',
          nextNodeId: 'community_talk',
        },
        {
          id: 'ranch_tips',
          text: 'Any tips for getting the ranch operational?',
          nextNodeId: 'land_advice',
        },
      ],
    },
    {
      id: 'cave_warning',
      text: '"The old timers say those caves connect for miles. Miners went in during the rush — some didn\'t come out. Thomas found a skeleton near the entrance last spring. Hundred years old at least."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'note_caves',
          text: 'I\'ll be careful. But I might explore eventually.',
          nextNodeId: undefined,
          effects: {
            xp: 15,
            flag: 'mcgraw_cave_warning',
            unlockLocation: 'ch4_cave_system',
          },
        },
      ],
    },
    {
      id: 'community_talk',
      text: '"Mostly good folk. The Henderson mill runs the local economy. The McGraws — that\'s us — and two other families share the water. Jackson\'s the nearest real town. Watch out for the lawyer there."',
      speaker: 'Sarah McGraw',
      options: [
        {
          id: 'understood',
          text: 'Good to know the lay of the land.',
          nextNodeId: undefined,
          effects: {
            xp: 10,
            flag: 'sarah_met',
            reputation: { faction: 'settlers', delta: 5 },
          },
        },
      ],
    },
  ],
}

// ============================================================
// CHAPTER 5 — The Treasure & Legacy
// ============================================================

const ch5_tobias_journal: Dialogue = {
  id: 'ch5_tobias_journal',
  npcId: 'ch5_ghost_tobias',
  npcName: "Tobias's Journal",
  chapter: 5,
  title: 'Pages from the Past',
  nodes: [
    {
      id: 'start',
      text: 'You open the cracked leather journal. The handwriting is faded but legible: "If you are reading this, then the ranch has found its keeper. I am Pryor, and this is my confession."',
      speaker: "Pryor's Journal",
      options: [
        {
          id: 'read_on',
          text: 'Continue reading.',
          nextNodeId: 'confession',
        },
      ],
    },
    {
      id: 'confession',
      text: '"I came west in \'49, same as everyone. Dumb, young, full of gold fever. I found gold — more than I deserved. But I also found something worth more. I found this place."',
      speaker: "Tobias's Journal",
      options: [
        {
          id: 'next_page',
          text: 'Turn the page.',
          nextNodeId: 'the_secret',
        },
      ],
    },
    {
      id: 'the_secret',
      text: '"In the caves beneath the ranch, I discovered what the Miwok always knew — the real treasure isn\'t gold. It\'s the land itself. The water, the trees, the earth that feeds you. I buried my gold in four places on this property."',
      speaker: "Tobias's Journal",
      options: [
        {
          id: 'locations',
          text: 'Read the locations.',
          nextNodeId: 'map_pieces',
        },
      ],
    },
    {
      id: 'map_pieces',
      text: '"The first piece of my map is where we shelter the horses. The second, where the fruit grows oldest. The third, where I first struck color. The fourth, where you can see forever."',
      speaker: "Tobias's Journal",
      options: [
        {
          id: 'decode',
          text: '[Shrewdness DC 10] The barn, the orchard, the old mine, and the lookout point.',
          nextNodeId: 'decoded',
          requirement: { stat: 'Shrewdness', dc: 10 },
        },
        {
          id: 'think',
          text: 'I need to think about these clues.',
          nextNodeId: 'final_words',
        },
      ],
    },
    {
      id: 'decoded',
      text: 'The riddles align with locations you know. Four places, four pieces of a map. Assembled, they should point to Tobias\'s hidden chamber.',
      options: [
        {
          id: 'hunt',
          text: 'Time to search.',
          nextNodeId: 'final_words',
          effects: {
            xp: 30,
            flag: 'tobias_riddle_solved',
            questStart: 'ch5_tobias_legacy',
          },
        },
      ],
    },
    {
      id: 'final_words',
      text: '"To whoever finds this — treat the land kindly. It was here before us and will be here after. The gold is yours to share or to hoard. But know this: the treasure that matters can\'t be spent. It can only be lived."',
      speaker: "Tobias's Journal",
      options: [
        {
          id: 'close',
          text: 'Close the journal.',
          nextNodeId: undefined,
          effects: {
            xp: 25,
            flag: 'tobias_journal_read',
          },
        },
      ],
    },
  ],
}

// ============================================================
// Dialogue Registry
// ============================================================

export const DIALOGUES: Dialogue[] = [
  // Chapter 1
  ch1_shaw_intro,
  ch1_hooded_figure,
  ch1_chief_talking_bear,
  // Chapter 2
  ch2_big_mae,
  ch2_master_crane,
  ch2_slim_perkins,
  // Chapter 3
  ch3_sam_clemens,
  ch3_joaquin,
  ch3_blind_jake,
  // Chapter 4
  ch4_judge_whitfield,
  ch4_sarah_mcgraw,
  // Chapter 5
  ch5_tobias_journal,
]

// ============================================================
// Helper Functions
// ============================================================

export function getDialogueById(id: string): Dialogue | undefined {
  return DIALOGUES.find(d => d.id === id)
}

export function getDialoguesForNpc(npcId: string): Dialogue[] {
  return DIALOGUES.filter(d => d.npcId === npcId)
}

export function getDialoguesForChapter(chapter: number): Dialogue[] {
  return DIALOGUES.filter(d => d.chapter === chapter)
}

export function getDialogueNode(dialogueId: string, nodeId: string): DialogueNode | undefined {
  const dialogue = getDialogueById(dialogueId)
  if (!dialogue) return undefined
  return dialogue.nodes.find(n => n.id === nodeId)
}
