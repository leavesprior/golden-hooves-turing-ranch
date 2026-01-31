// Dialogue Trees for Witness Interactions
// Branching conversations with skill checks and karma implications

import type { WitnessType } from './clueTemplates'

export interface DialogueNode {
  id: string
  text: string
  speaker: 'witness' | 'player' | 'narrator'
  responses?: DialogueResponse[]
  nextNode?: string  // Auto-advance to this node
  effect?: DialogueEffect
  narratorComment?: string  // Unreliable narrator interjection
}

export type RevisitBehavior = 'hide' | 'show_dimmed' | 'show_alternate'
export type ProficiencyRequirement = 'apprentice' | 'journeyman' | 'expert' | 'master'

export interface DialogueResponse {
  id: string
  text: string
  displayText?: string  // What to show (vs internal logic)
  skillCheck?: SkillCheck
  karmaLawful?: number
  karmaGood?: number  // Positive = earn Good Karma 🍪, Negative = earn Bad Karma 🪨
  reputationEffect?: { faction: FactionId; delta: number }
  karmaCost?: number  // Cost in Neutral Karma 🌮 (bribes, purchases, etc.)
  goldCost?: number   // Legacy alias for karmaCost
  nextNode: string
  requiresItem?: string  // Absurd inventory item
  grantsClue?: boolean
  grantsItem?: string
  revisitBehavior?: RevisitBehavior  // What happens on return visit
  alternateText?: string  // Text shown when revisitBehavior is 'show_alternate'
  requiresProficiency?: ProficiencyRequirement  // Investigation proficiency gate
}

export interface SkillCheck {
  stat: 'Shrewdness' | 'Agility' | 'Durability' | 'Diplomacy' | 'Luck' | 'Expertise'
  difficulty: number
  failNode?: string  // Where to go on failure
}

export interface DialogueEffect {
  grantClue?: boolean
  grantItem?: string
  setFlag?: string
  checkFlag?: string
  hoursSpent?: number
  gold?: number
  reputation?: { faction: FactionId; delta: number }
}

export type FactionId = 'pinkerton' | 'settlers' | 'natives' | 'outlaws'

export interface DialogueTree {
  id: string
  witnessType: WitnessType
  startNode: string
  revisitStartNode?: string  // Node to start from on revisit (if different from startNode)
  nodes: Record<string, DialogueNode>
  context?: string  // When this tree should be used
}

// Generic dialogue trees by witness type
export const WITNESS_DIALOGUES: Record<WitnessType, DialogueTree> = {
  bartender: {
    id: 'bartender_standard',
    witnessType: 'bartender',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*sigh* You again. What is it this time?",
        speaker: 'witness',
        narratorComment: "The bartender remembers you. Whether that's a good thing remains to be seen.",
        responses: [
          {
            id: 'revisit_thinking',
            text: "I've been thinking about what you said last time...",
            nextNode: 'after_drink',
          },
          {
            id: 'revisit_new_info',
            text: "Any new information since my last visit?",
            nextNode: 'knows_something',
          },
          {
            id: 'revisit_buy_drink',
            text: "Another whiskey. And more questions.",
            karmaCost: 0.25,
            nextNode: 'after_drink',
          },
          {
            id: 'revisit_expert_read',
            text: "[Expert Investigator] You're holding something back. I can tell.",
            requiresProficiency: 'expert',
            skillCheck: { stat: 'Shrewdness', difficulty: 4 },
            nextNode: 'gives_clue',
            grantsClue: true,
          }
        ]
      },
      greeting: {
        id: 'greeting',
        text: "What'll it be, stranger? Whiskey's two bits, information costs more.",
        speaker: 'witness',
        responses: [
          {
            id: 'buy_drink',
            text: "Whiskey. And I'm looking for someone.",
            karmaCost: 0.25,
            nextNode: 'after_drink',
            karmaGood: 0,
            karmaLawful: 0,
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'flash_badge',
            text: "[Show Pinkerton badge] I'm not here for drinks.",
            nextNode: 'badge_shown',
            karmaLawful: 5,
            revisitBehavior: 'show_alternate',
            alternateText: "You know my badge. Let's skip the pleasantries.",
          },
          {
            id: 'intimidate',
            text: "[Intimidate] You WILL tell me what I want to know.",
            skillCheck: { stat: 'Diplomacy', difficulty: 6, failNode: 'intimidate_fail' },
            nextNode: 'intimidate_success',
            karmaGood: -10,
            karmaLawful: -5,
            reputationEffect: { faction: 'settlers', delta: -5 },
            revisitBehavior: 'hide',
          },
          {
            id: 'bribe',
            text: "[Pay $5] Perhaps this will refresh your memory?",
            karmaCost: 5,
            nextNode: 'bribe_success',
            karmaLawful: -3,
            revisitBehavior: 'hide',
          }
        ]
      },
      after_drink: {
        id: 'after_drink',
        text: "*slides glass across bar* Now then. Who you looking for?",
        speaker: 'witness',
        narratorComment: "The whiskey tastes like turpentine. The bartender notices your grimace and seems pleased.",
        responses: [
          {
            id: 'describe_outlaw',
            text: "Someone passed through recently. Dangerous type.",
            nextNode: 'knows_something',
            grantsClue: false
          },
          {
            id: 'show_dossier',
            text: "[Show wanted poster] This person. Seen them?",
            nextNode: 'recognizes',
            grantsClue: true
          }
        ]
      },
      badge_shown: {
        id: 'badge_shown',
        text: "Pinkerton, eh? *polishes glass nervously* I don't want trouble with your agency.",
        speaker: 'witness',
        responses: [
          {
            id: 'reassure',
            text: "No trouble if you cooperate. Just information.",
            skillCheck: { stat: 'Diplomacy', difficulty: 4 },
            nextNode: 'cooperates',
            grantsClue: true,
            reputationEffect: { faction: 'pinkerton', delta: 2 }
          },
          {
            id: 'threaten_badge',
            text: "Smart man. Now talk.",
            nextNode: 'cooperates',
            grantsClue: true,
            karmaGood: -5,
            reputationEffect: { faction: 'settlers', delta: -3 }
          }
        ]
      },
      intimidate_success: {
        id: 'intimidate_success',
        text: "*backs against the bottles* A-alright! I'll tell you everything!",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_clue'
      },
      intimidate_fail: {
        id: 'intimidate_fail',
        text: "*reaches under bar* Mister, I've faced worse than you. Get out of my saloon.",
        speaker: 'witness',
        narratorComment: "The narrator wonders if you even lift.",
        responses: [
          {
            id: 'back_down',
            text: "*raise hands* Easy now. Let's start over.",
            nextNode: 'second_chance',
            karmaGood: 5
          },
          {
            id: 'escalate',
            text: "[Draw weapon] You sure about that?",
            nextNode: 'fight',
            karmaGood: -20,
            karmaLawful: -20,
            reputationEffect: { faction: 'settlers', delta: -15 }
          }
        ]
      },
      bribe_success: {
        id: 'bribe_success',
        text: "*pockets the money* Now that's the language I speak. Here's what I know...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_clue'
      },
      knows_something: {
        id: 'knows_something',
        text: "Lots of dangerous types come through here. You'll need to be more specific.",
        speaker: 'witness',
        responses: [
          {
            id: 'describe_traits',
            text: "[Describe what you know] Any of this ring a bell?",
            skillCheck: { stat: 'Shrewdness', difficulty: 4 },
            nextNode: 'recognizes',
            grantsClue: true
          },
          {
            id: 'recent',
            text: "Last few days. Acting nervous. Had money to spend.",
            nextNode: 'thinks',
            grantsClue: true
          }
        ]
      },
      recognizes: {
        id: 'recognizes',
        text: "Yeah... yeah, I think I saw someone like that. Let me think...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_clue'
      },
      cooperates: {
        id: 'cooperates',
        text: "Alright, alright. I remember someone matching that description...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_clue'
      },
      thinks: {
        id: 'thinks',
        text: "*strokes chin* Come to think of it, there was someone...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_clue'
      },
      gives_clue: {
        id: 'gives_clue',
        text: "[CLUE_PLACEHOLDER]",
        speaker: 'witness',
        narratorComment: "The bartender seems to be telling the truth. The narrator is almost disappointed.",
        responses: [
          {
            id: 'more_info',
            text: "Anything else?",
            nextNode: 'nothing_more'
          },
          {
            id: 'thank_leave',
            text: "Much obliged.",
            nextNode: 'end'
          }
        ]
      },
      nothing_more: {
        id: 'nothing_more',
        text: "That's all I know. Good luck, detective.",
        speaker: 'witness',
        nextNode: 'end'
      },
      second_chance: {
        id: 'second_chance',
        text: "*slowly lowers hand* Fine. Buy a drink like civilized folk, and we'll talk.",
        speaker: 'witness',
        responses: [
          {
            id: 'comply',
            text: "*nod* Fair enough. One whiskey.",
            karmaCost: 0.25,
            nextNode: 'after_drink'
          }
        ]
      },
      fight: {
        id: 'fight',
        text: "The bartender draws a shotgun. This was a mistake.",
        speaker: 'narrator',
        effect: { reputation: { faction: 'settlers', delta: -20 } }
      },
      end: {
        id: 'end',
        text: "*nods and returns to polishing glasses*",
        speaker: 'witness'
      }
    }
  },

  shopkeeper: {
    id: 'shopkeeper_standard',
    witnessType: 'shopkeeper',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "Oh! You came back! I've been organizing my thoughts since your visit...",
        speaker: 'witness',
        narratorComment: "The shopkeeper has been rehearsing this speech since you left.",
        responses: [
          {
            id: 'revisit_remembered',
            text: "Remembered anything new?",
            nextNode: 'gives_info',
            grantsClue: true,
          },
          {
            id: 'revisit_supplies',
            text: "More supplies. And more questions.",
            karmaCost: 2,
            nextNode: 'friendly',
          },
          {
            id: 'revisit_expert_inventory',
            text: "[Expert Investigator] Let me see your recent sales ledger.",
            requiresProficiency: 'expert',
            nextNode: 'gives_info',
            grantsClue: true,
          }
        ]
      },
      greeting: {
        id: 'greeting',
        text: "Welcome to my establishment. Buying or browsing?",
        speaker: 'witness',
        responses: [
          {
            id: 'browse',
            text: "Just looking. Actually, I'm looking for information.",
            nextNode: 'suspicious',
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'buy_something',
            text: "I'll take some supplies. And some answers.",
            karmaCost: 2,
            nextNode: 'friendly',
            karmaLawful: 2,
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'official',
            text: "[Show badge] Pinkerton business.",
            nextNode: 'official_response',
            revisitBehavior: 'show_alternate',
            alternateText: "You know who I am. Anything new to report?",
          }
        ]
      },
      suspicious: {
        id: 'suspicious',
        text: "*narrows eyes* Information? This is a general store, not a gossip shop.",
        speaker: 'witness',
        responses: [
          {
            id: 'persist',
            text: "A criminal came through here. Your civic duty to help.",
            skillCheck: { stat: 'Diplomacy', difficulty: 5 },
            nextNode: 'reluctant_help',
            grantsClue: true
          },
          {
            id: 'bribe_shopkeeper',
            text: "[Pay $10] Perhaps I could also buy some discretion?",
            karmaCost: 10,
            nextNode: 'bribed',
            grantsClue: true
          }
        ]
      },
      friendly: {
        id: 'friendly',
        text: "*wraps your supplies* Now then, what kind of answers you need?",
        speaker: 'witness',
        narratorComment: "The supplies are overpriced. The shopkeeper's cooperation, however, seems genuine.",
        responses: [
          {
            id: 'ask_about_outlaw',
            text: "Someone dangerous passed through. Might have bought supplies here.",
            nextNode: 'recalls',
            grantsClue: true
          }
        ]
      },
      official_response: {
        id: 'official_response',
        text: "Pinkertons! Of course, officer. Happy to assist the law.",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_info'
      },
      reluctant_help: {
        id: 'reluctant_help',
        text: "*sighs* Fine. I did see someone strange yesterday...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_info'
      },
      bribed: {
        id: 'bribed',
        text: "*pockets the money* I remember everything about everyone who comes through here.",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_info'
      },
      recalls: {
        id: 'recalls',
        text: "Matter of fact, there was someone. Bought trail supplies and was in a hurry...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_info'
      },
      gives_info: {
        id: 'gives_info',
        text: "[CLUE_PLACEHOLDER]",
        speaker: 'witness',
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Good luck catching your criminal. Come back if you need supplies.",
        speaker: 'witness'
      }
    }
  },

  stable_hand: {
    id: 'stable_hand_standard',
    witnessType: 'stable_hand',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*spits* Figured you'd be back. Horses remember faces. So do I.",
        speaker: 'witness',
        narratorComment: "The stable hand seems almost pleased to see you. Almost.",
        responses: [
          {
            id: 'revisit_new_horses',
            text: "Any new horses come through since last time?",
            nextNode: 'recalls_horse',
            grantsClue: true,
          },
          {
            id: 'revisit_tip_again',
            text: "*another coin* Your memory's worth it.",
            karmaCost: 1,
            nextNode: 'grateful',
            karmaGood: 2,
          },
          {
            id: 'revisit_expert_tracks',
            text: "[Expert Investigator] Let me look at the tracks out back.",
            requiresProficiency: 'expert',
            skillCheck: { stat: 'Expertise', difficulty: 4 },
            nextNode: 'gives_horse_clue',
            grantsClue: true,
          }
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*looks up from shoveling* Help you, mister?",
        speaker: 'witness',
        responses: [
          {
            id: 'friendly_approach',
            text: "Hard work. You must see a lot of horses come through.",
            nextNode: 'opens_up',
            karmaGood: 2,
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'direct',
            text: "I'm tracking someone. What horses have you seen recently?",
            nextNode: 'thinks_horses',
            revisitBehavior: 'show_alternate',
            alternateText: "Still tracking that rider. Anything new?",
          },
          {
            id: 'tip',
            text: "*hand over a coin* Buy yourself a drink after work.",
            karmaCost: 1,
            nextNode: 'grateful',
            karmaGood: 3,
            revisitBehavior: 'show_dimmed',
          }
        ]
      },
      opens_up: {
        id: 'opens_up',
        text: "Sure do. I can tell a lot about a person from how they treat their horse.",
        speaker: 'witness',
        narratorComment: "The stable hand genuinely seems to care more about horses than people. The narrator approves.",
        responses: [
          {
            id: 'describe_horse',
            text: "I'm looking for a specific horse and rider. Any stand out lately?",
            nextNode: 'recalls_horse',
            grantsClue: true
          }
        ]
      },
      thinks_horses: {
        id: 'thinks_horses',
        text: "*scratches head* Let me think... what kind of horse?",
        speaker: 'witness',
        responses: [
          {
            id: 'any_unusual',
            text: "Anything unusual. Someone in a hurry, maybe.",
            nextNode: 'recalls_horse',
            grantsClue: true
          }
        ]
      },
      grateful: {
        id: 'grateful',
        text: "*eyes light up* Much obliged! What do you need to know?",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'recalls_horse'
      },
      recalls_horse: {
        id: 'recalls_horse',
        text: "Now that you mention it, there was one rider who stood out...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'gives_horse_clue'
      },
      gives_horse_clue: {
        id: 'gives_horse_clue',
        text: "[CLUE_PLACEHOLDER]",
        speaker: 'witness',
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "*returns to work* Good luck out there.",
        speaker: 'witness'
      }
    }
  },

  drunk: {
    id: 'drunk_standard',
    witnessType: 'drunk',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*squints* Heyyy... I know you! You're my besht... *hic* ...my besht drinking buddy!",
        speaker: 'witness',
        narratorComment: "The drunk remembers you. This is either impressive or deeply concerning.",
        responses: [
          {
            id: 'revisit_jog_memory',
            text: "That's right, friend. Remember what you told me last time?",
            nextNode: 'rambling_clue',
            grantsClue: true,
          },
          {
            id: 'revisit_another_round',
            text: "*signal bartender* Another round for us both.",
            karmaCost: 0.25,
            nextNode: 'very_friendly',
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*hic* You buyin', friend? M'glass seems to be empty...",
        speaker: 'witness',
        narratorComment: "The drunk's glass is not empty. It's simply invisible to him at this point.",
        responses: [
          {
            id: 'buy_drink',
            text: "*signal bartender* One for my friend here.",
            karmaCost: 0.25,
            nextNode: 'very_friendly',
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'refuse',
            text: "I think you've had enough. But I do have questions.",
            nextNode: 'offended',
            karmaGood: 2,
            revisitBehavior: 'hide',
          },
          {
            id: 'pretend_drunk',
            text: "[Luck check] *slur words* Shay, you shee anyone weird lately?",
            skillCheck: { stat: 'Luck', difficulty: 4, failNode: 'sees_through' },
            nextNode: 'drunk_bonding',
            revisitBehavior: 'hide',
          }
        ]
      },
      very_friendly: {
        id: 'very_friendly',
        text: "*accepts drink eagerly* You're my besht friend now! Whatcha wanna know?",
        speaker: 'witness',
        effect: { grantClue: true },
        responses: [
          {
            id: 'ask_about_stranger',
            text: "Seen any strangers around? Dangerous types?",
            nextNode: 'rambling_clue',
            grantsClue: true
          }
        ]
      },
      offended: {
        id: 'offended',
        text: "*squints* Who are you, my mother? I seen PLENTY. But now I ain't talkin'.",
        speaker: 'witness',
        responses: [
          {
            id: 'apologize',
            text: "Sorry, friend. Here, let me make it up to you.",
            karmaCost: 0.5,
            nextNode: 'forgives'
          }
        ]
      },
      drunk_bonding: {
        id: 'drunk_bonding',
        text: "*throws arm around you* A fellow traveler! Lemme tell ya what I saw...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'rambling_clue'
      },
      sees_through: {
        id: 'sees_through',
        text: "*narrows eyes* You ain't drunk. I know drunk. I'm an expert.",
        speaker: 'witness',
        narratorComment: "He has a point.",
        responses: [
          {
            id: 'admit',
            text: "Caught me. I'm looking for information.",
            nextNode: 'might_help'
          }
        ]
      },
      forgives: {
        id: 'forgives',
        text: "*accepts* Alright, alright. You're okay. Now, whatcha need?",
        speaker: 'witness',
        responses: [
          {
            id: 'ask_forgiven',
            text: "Strangers. Dangerous ones. Seen any?",
            nextNode: 'rambling_clue',
            grantsClue: true
          }
        ]
      },
      might_help: {
        id: 'might_help',
        text: "Information? That'll cost ya. *gestures at empty glass*",
        speaker: 'witness',
        responses: [
          {
            id: 'buy_info',
            text: "*sigh* Fine. Bartender!",
            karmaCost: 0.25,
            nextNode: 'rambling_clue',
            grantsClue: true
          }
        ]
      },
      rambling_clue: {
        id: 'rambling_clue',
        text: "Oh I SHEEN some stuff, lemme tell ya... *rambles* [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        narratorComment: "Approximately 20% of what the drunk says is accurate. The narrator declines to specify which 20%.",
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "*falls asleep mid-sentence*",
        speaker: 'witness'
      }
    }
  },

  child: {
    id: 'child_standard',
    witnessType: 'child',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "You're BACK! *bounces* Did you catch the bad guy yet? I found more clues!",
        speaker: 'witness',
        narratorComment: "The child has been playing detective since your last visit. The narrator finds this adorable.",
        responses: [
          {
            id: 'revisit_what_clues',
            text: "What did you find, deputy?",
            nextNode: 'eager_to_help',
            grantsClue: true,
            karmaGood: 2,
          },
          {
            id: 'revisit_still_looking',
            text: "Still working on it. Keep your eyes open for me.",
            nextNode: 'child_clue',
            grantsClue: true,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*looks up with wide eyes* Are you a real detective? Like in the dime novels?",
        speaker: 'witness',
        narratorComment: "The child is approximately eight years old and clearly thrilled by this interaction. The narrator is charmed despite itself.",
        responses: [
          {
            id: 'play_along',
            text: "*tip hat* Deputy Detective, at your service. And you are?",
            nextNode: 'excited',
            karmaGood: 3,
            revisitBehavior: 'show_alternate',
            alternateText: "Deputy Tommy, reporting for duty!",
          },
          {
            id: 'honest',
            text: "Something like that. I'm looking for a bad guy.",
            nextNode: 'helpful_child',
            revisitBehavior: 'show_dimmed',
          },
          {
            id: 'dismiss',
            text: "Run along, kid. Grown-up business.",
            nextNode: 'sad_child',
            karmaGood: -5,
            revisitBehavior: 'hide',
          }
        ]
      },
      excited: {
        id: 'excited',
        text: "I'm Tommy! I know EVERYTHING that happens here. Ask me anything!",
        speaker: 'witness',
        responses: [
          {
            id: 'ask_nicely',
            text: "Well, Tommy, have you seen any suspicious characters lately?",
            nextNode: 'eager_to_help',
            grantsClue: true
          }
        ]
      },
      helpful_child: {
        id: 'helpful_child',
        text: "A bad guy? *eyes widen* I bet I can help! I notice stuff that grown-ups miss.",
        speaker: 'witness',
        responses: [
          {
            id: 'encourage',
            text: "I bet you do. What have you noticed lately?",
            nextNode: 'eager_to_help',
            grantsClue: true
          }
        ]
      },
      sad_child: {
        id: 'sad_child',
        text: "*shoulders slump* Oh. Okay, mister.",
        speaker: 'witness',
        narratorComment: "The narrator would like you to know that was unnecessarily harsh.",
        responses: [
          {
            id: 'reconsider',
            text: "*sigh* Wait. Actually, I could use a sharp pair of eyes.",
            nextNode: 'perks_up'
          }
        ]
      },
      perks_up: {
        id: 'perks_up',
        text: "*brightens* Really?! I knew it! What do you need?",
        speaker: 'witness',
        responses: [
          {
            id: 'ask_for_help',
            text: "Tell me about any strangers you've seen.",
            nextNode: 'eager_to_help',
            grantsClue: true
          }
        ]
      },
      eager_to_help: {
        id: 'eager_to_help',
        text: "Oh! There WAS someone! They gave me a nickel to hold their horse!",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'child_clue'
      },
      child_clue: {
        id: 'child_clue',
        text: "[CLUE_PLACEHOLDER]",
        speaker: 'witness',
        narratorComment: "Children are remarkably observant. They also lie constantly. The narrator leaves it to you to determine which this is.",
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Did I help? Am I a deputy now? *hopeful*",
        speaker: 'witness'
      }
    }
  },

  // Simplified trees for other witness types
  traveler: {
    id: 'traveler_standard',
    witnessType: 'traveler',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*nods in recognition* Still on the hunt, I see.",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_new_sighting',
            text: "Seen anything new on the trail?",
            nextNode: 'gives_info',
            grantsClue: true,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*nods warily* Just passing through, same as you.",
        speaker: 'witness',
        responses: [
          {
            id: 'fellow_traveler',
            text: "Then you might have seen who I'm looking for on the trail.",
            nextNode: 'might_have',
            grantsClue: true,
            revisitBehavior: 'show_dimmed',
          }
        ]
      },
      might_have: {
        id: 'might_have',
        text: "Maybe. What's in it for me?",
        speaker: 'witness',
        responses: [
          {
            id: 'pay',
            text: "*hand over coins* Safe travels.",
            karmaCost: 3,
            nextNode: 'gives_info'
          },
          {
            id: 'appeal',
            text: "Justice. This person hurt innocent people.",
            skillCheck: { stat: 'Diplomacy', difficulty: 5 },
            nextNode: 'gives_info'
          }
        ]
      },
      gives_info: {
        id: 'gives_info',
        text: "*thinks* There was someone riding hard... [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "*tips hat* Good hunting.",
        speaker: 'witness'
      }
    }
  },

  settler: {
    id: 'settler_standard',
    witnessType: 'settler',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "Detective! *waves from porch* Any progress on catching that criminal?",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_progress',
            text: "Getting closer. Noticed anything since last time?",
            nextNode: 'heard_of',
            grantsClue: true,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "This is good land. Hard, but good. You're not from around here.",
        speaker: 'witness',
        responses: [
          {
            id: 'respectful',
            text: "No ma'am/sir. I'm tracking a criminal who might have passed this way.",
            nextNode: 'considers',
            karmaGood: 2,
            revisitBehavior: 'show_dimmed',
          }
        ]
      },
      considers: {
        id: 'considers',
        text: "*wipes hands on apron* We don't want trouble here. What kind of criminal?",
        speaker: 'witness',
        responses: [
          {
            id: 'explain',
            text: "Dangerous outlaw. Part of Black Bart's gang.",
            nextNode: 'heard_of',
            grantsClue: true
          }
        ]
      },
      heard_of: {
        id: 'heard_of',
        text: "Black Bart! I've heard of him. There was someone... [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Be careful out there, detective. And bring these criminals to justice.",
        speaker: 'witness'
      }
    }
  },

  native_trader: {
    id: 'native_trader_standard',
    witnessType: 'native_trader',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*slight nod* The hunter returns. The wind has more to say.",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_trade_again',
            text: "*offer goods* More trade, more knowledge.",
            karmaCost: 3,
            nextNode: 'shares_info',
            grantsClue: true,
            reputationEffect: { faction: 'natives', delta: 3 },
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*eyes measure you calmly* I trade fair. Do you?",
        speaker: 'witness',
        narratorComment: "The trader has seen a hundred men like you. Most of them were disappointments.",
        responses: [
          {
            id: 'fair_trade',
            text: "I do. I also hunt those who don't.",
            nextNode: 'interested',
            reputationEffect: { faction: 'natives', delta: 3 }
          },
          {
            id: 'demanding',
            text: "I'm not here to trade. I need information.",
            nextNode: 'dismissive'
          }
        ]
      },
      interested: {
        id: 'interested',
        text: "A hunter of men. I may have seen tracks on the wind.",
        speaker: 'witness',
        responses: [
          {
            id: 'offer_trade',
            text: "*offer goods* In exchange for your knowledge.",
            karmaCost: 5,
            nextNode: 'shares_info',
            grantsClue: true,
            reputationEffect: { faction: 'natives', delta: 5 }
          }
        ]
      },
      dismissive: {
        id: 'dismissive',
        text: "*turns away* Then we have nothing to discuss.",
        speaker: 'witness',
        effect: { reputation: { faction: 'natives', delta: -5 } }
      },
      shares_info: {
        id: 'shares_info',
        text: "*accepts trade* A rider passed through heading west... [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "*nods* May your hunt be successful.",
        speaker: 'witness'
      }
    }
  },

  telegraph_operator: {
    id: 'telegraph_operator_standard',
    witnessType: 'telegraph_operator',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*looks up from tapping* Back again, Pinkerton? There have been more wires since your last visit...",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_check_wires',
            text: "Show me the new ones.",
            nextNode: 'shows_records',
            grantsClue: true,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "Telegraph office. Ten cents a word. What's your message?",
        speaker: 'witness',
        responses: [
          {
            id: 'pinkerton',
            text: "[Show credentials] Pinkerton agency. I need to check your records.",
            nextNode: 'official_access',
            reputationEffect: { faction: 'pinkerton', delta: 2 }
          },
          {
            id: 'bribe_big',
            text: "[Pay $25] I need to see who's been sending wires.",
            karmaCost: 25,
            nextNode: 'shows_records',
            grantsClue: true
          }
        ]
      },
      official_access: {
        id: 'official_access',
        text: "*checks credentials carefully* Everything seems in order. What do you need?",
        speaker: 'witness',
        responses: [
          {
            id: 'check_wires',
            text: "Any suspicious communications in the last few days?",
            nextNode: 'shows_records',
            grantsClue: true
          }
        ]
      },
      shows_records: {
        id: 'shows_records',
        text: "*flips through papers* There was one message... [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Good day, detective. Please don't mention I showed you those records.",
        speaker: 'witness'
      }
    }
  },

  sheriff_deputy: {
    id: 'sheriff_deputy_standard',
    witnessType: 'sheriff_deputy',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "Pinkerton! Good timing. We got some new reports since you were last here.",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_new_reports',
            text: "Let me see what you've got, Deputy.",
            nextNode: 'shares_info',
            grantsClue: true,
            reputationEffect: { faction: 'pinkerton', delta: 2 },
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "Pinkerton, eh? Sheriff's out chasing rustlers. I'm Deputy Morrison. How can I help?",
        speaker: 'witness',
        responses: [
          {
            id: 'professional',
            text: "Deputy. I'm tracking a member of Black Bart's gang.",
            nextNode: 'shares_info',
            grantsClue: true,
            reputationEffect: { faction: 'pinkerton', delta: 3 }
          }
        ]
      },
      shares_info: {
        id: 'shares_info',
        text: "*pulls out files* We had a report... [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Good hunting, Pinkerton. Wire us if you make an arrest.",
        speaker: 'witness'
      }
    }
  },

  prostitute: {
    id: 'prostitute_standard',
    witnessType: 'prostitute',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "*knowing smile* I was hoping you'd come back. I heard something you might want to know...",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_what_heard',
            text: "I'm listening.",
            nextNode: 'shares_secrets',
            grantsClue: true,
          },
          {
            id: 'revisit_pay_time',
            text: "*hand over coins* For your trouble.",
            karmaCost: 3,
            nextNode: 'shares_secrets',
            grantsClue: true,
            karmaGood: 2,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "*leans against doorframe* Looking for company, sugar? Or something else?",
        speaker: 'witness',
        responses: [
          {
            id: 'information',
            text: "Information. You must hear a lot of secrets.",
            nextNode: 'knows_lots',
            grantsClue: true
          },
          {
            id: 'respectful',
            text: "Ma'am. I'm a Pinkerton. I'm looking for someone dangerous.",
            nextNode: 'willing_to_help',
            karmaGood: 3
          }
        ]
      },
      knows_lots: {
        id: 'knows_lots',
        text: "*smiles knowingly* Men talk when they think nobody's listening. What's it worth to you?",
        speaker: 'witness',
        responses: [
          {
            id: 'pay_fair',
            text: "*hand over coins* Your time is valuable.",
            karmaCost: 5,
            nextNode: 'shares_secrets',
            karmaGood: 2
          }
        ]
      },
      willing_to_help: {
        id: 'willing_to_help',
        text: "*expression softens* A polite one. Rare. There was someone... gave me the creeps...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'shares_secrets'
      },
      shares_secrets: {
        id: 'shares_secrets',
        text: "*glances around, lowers voice* [CLUE_PLACEHOLDER]",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Be careful, detective. The one you're looking for is dangerous.",
        speaker: 'witness'
      }
    }
  },

  preacher: {
    id: 'preacher_standard',
    witnessType: 'preacher',
    startNode: 'greeting',
    revisitStartNode: 'revisit_greeting',
    nodes: {
      revisit_greeting: {
        id: 'revisit_greeting',
        text: "Ah, the detective returns. I have been praying on the matter since we last spoke...",
        speaker: 'witness',
        responses: [
          {
            id: 'revisit_revelation',
            text: "And what has prayer revealed, Father?",
            nextNode: 'vague_help',
            grantsClue: true,
          },
        ]
      },
      greeting: {
        id: 'greeting',
        text: "The Lord sees all, my child. Even those who seek to hide from justice.",
        speaker: 'witness',
        responses: [
          {
            id: 'appeal_to_morality',
            text: "Then perhaps He has shown you something that could help bring a sinner to justice.",
            nextNode: 'considers_helping',
            skillCheck: { stat: 'Diplomacy', difficulty: 5 },
            grantsClue: true
          }
        ]
      },
      considers_helping: {
        id: 'considers_helping',
        text: "*sighs* I saw someone at confession... I cannot reveal what was said, but I can tell you this...",
        speaker: 'witness',
        effect: { grantClue: true },
        nextNode: 'vague_help'
      },
      vague_help: {
        id: 'vague_help',
        text: "[CLUE_PLACEHOLDER]",
        speaker: 'witness',
        narratorComment: "The preacher skirts the edges of the confessional seal. The Lord is watching, but so are you.",
        nextNode: 'end'
      },
      end: {
        id: 'end',
        text: "Go with God, detective. And bring this soul to earthly justice.",
        speaker: 'witness'
      }
    }
  }
}

// Helper function to get dialogue tree for witness type
export function getDialogueTree(witnessType: WitnessType): DialogueTree {
  return WITNESS_DIALOGUES[witnessType]
}

// Special skill check dialogues that can be injected into any conversation
export const SKILL_CHECK_INJECTIONS: Record<string, DialogueResponse> = {
  shrewdness_notice: {
    id: 'shrewdness_notice',
    text: "[Shrewdness] You notice they're holding something back...",
    displayText: "[Shrewdness 5] Something doesn't add up...",
    skillCheck: { stat: 'Shrewdness', difficulty: 5 },
    nextNode: 'reveals_more',
    grantsClue: true
  },
  diplomacy_charm: {
    id: 'diplomacy_charm',
    text: "[Diplomacy] You've been very helpful. The agency will remember.",
    displayText: "[Diplomacy 4] Appeal to their better nature",
    skillCheck: { stat: 'Diplomacy', difficulty: 4 },
    nextNode: 'extra_info',
    grantsClue: true,
    reputationEffect: { faction: 'settlers', delta: 2 }
  },
  luck_stumble: {
    id: 'luck_stumble',
    text: "[Luck] Wait, did you say...?",
    displayText: "[Luck 6] Have a sudden realization",
    skillCheck: { stat: 'Luck', difficulty: 6 },
    nextNode: 'lucky_break',
    grantsClue: true
  }
}
