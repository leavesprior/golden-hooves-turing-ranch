/**
 * Stat-Keyed Event Description Variants
 *
 * Each random event gets alternative descriptions and outcome messages
 * based on the player's S.A.D.D.L.E. stats. Inspired by Fallout's 200+
 * critical hit messages — the same event reads differently depending
 * on who your character is.
 *
 * High stat (>= 8): character notices extra details or has advantage
 * Low stat (<= 3): character misses things or reacts differently
 */

import type { StatName } from '../characterContext'

export interface StatVariant {
  stat: StatName
  threshold: 'high' | 'low'  // high = stat >= 8, low = stat <= 3
  description: string         // replaces event description
  choiceOverrides?: Record<string, string>  // choiceId -> replacement text
  outcomeOverrides?: Record<string, string> // choiceId -> replacement outcome message
}

export interface EventVariantSet {
  eventId: string
  variants: StatVariant[]
}

/**
 * Pick the best matching variant for an event given player stats.
 * Priority: high-stat match first (reward investment), then low-stat.
 * Returns null if no variant matches.
 */
export function getEventVariant(
  eventId: string,
  stats: Record<StatName, number>
): StatVariant | null {
  const variantSet = EVENT_VARIANTS.find(v => v.eventId === eventId)
  if (!variantSet) return null

  // Check high-stat variants first (reward player investment)
  for (const variant of variantSet.variants) {
    if (variant.threshold === 'high' && (stats[variant.stat] ?? 5) >= 8) {
      return variant
    }
  }

  // Then check low-stat variants (comedic/different perspective)
  for (const variant of variantSet.variants) {
    if (variant.threshold === 'low' && (stats[variant.stat] ?? 5) <= 3) {
      return variant
    }
  }

  return null
}

// ============================================
// EVENT VARIANTS
// ============================================

export const EVENT_VARIANTS: EventVariantSet[] = [
  // --- Sick Traveler ---
  {
    eventId: 'sick_traveler',
    variants: [
      {
        stat: 'Durability',
        threshold: 'high',
        description: 'You encounter a sick traveler by the trail. Your constitution tells you this is typhoid — you\'ve seen it before and survived. They need help fast.',
        outcomeOverrides: {
          help: 'Your experience with illness guides you. You know exactly which herbs to mix. The traveler recovers faster than expected.',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A traveler lies by the trail, too weak to move. You notice the telltale signs: contaminated water source upstream. Others would\'ve walked right past the cause.',
        outcomeOverrides: {
          help: 'You treat the traveler AND mark the bad water source with a warning sign. Two good deeds for the price of one.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'low',
        description: 'There\'s someone lying in the dirt. They look... not great. You\'re not sure what to say to a sick person. "Feel better" seems inadequate.',
        choiceOverrides: {
          help: 'Awkwardly hand over medicine while avoiding eye contact',
          ignore: 'Back away slowly (you don\'t do well with sick people)',
        },
      },
    ],
  },

  // --- Stranded Family ---
  {
    eventId: 'broken_wagon',
    variants: [
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'A family is stranded with a broken wagon wheel. One glance tells you it\'s a split hub — fixable if you know what you\'re doing. And you do.',
        choiceOverrides: {
          share_parts: 'Fix it yourself (Expertise makes this easy)',
        },
        outcomeOverrides: {
          share_parts: 'You repair their wheel in half the time a blacksmith would. The family insists you take food and their grandmother\'s lucky horseshoe.',
        },
      },
      {
        stat: 'Luck',
        threshold: 'high',
        description: 'A family with a broken wagon waves you down. As you approach, you notice a spare wheel half-buried in the mud nearby. What are the odds?',
        outcomeOverrides: {
          share_parts: 'You point out the buried spare wheel. The family is amazed. You keep your own parts AND earn their gratitude.',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'low',
        description: 'A family is standing around a broken wagon. You think the problem is the wheels. No wait, the horse. No, definitely the wheels. Probably.',
        choiceOverrides: {
          trade_unfair: '"I\'ll trade you this... thing... for some money"',
        },
      },
    ],
  },

  // --- Native Traders ---
  {
    eventId: 'native_trade',
    variants: [
      {
        stat: 'Diplomacy',
        threshold: 'high',
        description: 'Native American traders approach your camp. Your practiced eye catches the quality of their goods — excellent jerky, well-tanned hides. Your respectful greeting earns a nod of approval.',
        outcomeOverrides: {
          fair_trade: 'Your diplomatic manner builds real rapport. They offer you items not normally shown to travelers — premium supplies at fair prices. An invitation to trade again stands open.',
        },
      },
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'Native traders approach with goods. Your trail knowledge tells you these people know the land far better than any map. Their dried meat alone is worth twice what they\'re asking.',
        outcomeOverrides: {
          fair_trade: 'You recognize the exceptional quality and pay without haggling. They respect this. Extra supplies find their way into the deal.',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'low',
        description: 'Some people with stuff want to trade. You\'re not sure what half their goods are, but they smell nice?',
        choiceOverrides: {
          fair_trade: 'Trade (you think this is a good deal?)',
          decline: 'Walk away (commerce is confusing)',
        },
      },
    ],
  },

  // --- Claim Jumpers ---
  {
    eventId: 'claim_jumping',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'You witness claim jumpers pressuring a prospector. But something\'s off — the "jumpers" have legal-looking documents. Your keen eye spots the forgery: wrong county seal, fresh ink on supposedly old papers.',
        outcomeOverrides: {
          report: 'You expose the forged documents to the authorities. The ring leader is arrested. The prospector rewards you handsomely and the local sheriff remembers your name.',
        },
      },
      {
        stat: 'Agility',
        threshold: 'high',
        description: 'Claim jumpers corner a prospector. You could intervene — your quick reflexes give you confidence. The jumpers haven\'t noticed you yet.',
        choiceOverrides: {
          report: 'Sprint to the authorities before the jumpers can flee',
        },
        outcomeOverrides: {
          report: 'You reach the sheriff\'s office before the jumpers realize they\'ve been spotted. By the time they try to run, a posse is already mounted.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'low',
        description: 'Some men are arguing about land. It seems heated. You\'re not really sure what "claim jumping" means but it sounds bad.',
        choiceOverrides: {
          avoid: 'This seems like a "them" problem',
        },
      },
    ],
  },

  // --- Wild Animal Attack ---
  {
    eventId: 'wild_animal',
    variants: [
      {
        stat: 'Agility',
        threshold: 'high',
        description: 'A mountain lion crouches in the shadows. Most people wouldn\'t have noticed it. Your reflexes are already moving — hand on weapon, feet positioned for a clear shot.',
        outcomeOverrides: {
          shoot: 'Your shot is clean and instant. The lion drops before it takes a single step. Your party didn\'t even wake up.',
        },
      },
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'A mountain lion stalks your camp. But you read the signs an hour ago — disturbed brush, claw marks on bark. You\'ve been waiting for this.',
        choiceOverrides: {
          scare: 'Use your knowledge of predator behavior to redirect it',
        },
        outcomeOverrides: {
          scare: 'You clap, shout, and make yourself large in exactly the right way. The lion reconsiders without a scratch on anyone.',
        },
      },
      {
        stat: 'Durability',
        threshold: 'high',
        description: 'A mountain lion launches itself at the camp. Your body tenses — you\'ve taken worse hits than a big cat.',
        outcomeOverrides: {
          scare: 'The lion swipes at you but you barely feel it. You stare it down. It leaves, utterly confused by this human that doesn\'t flinch.',
        },
      },
      {
        stat: 'Agility',
        threshold: 'low',
        description: 'You hear a noise. Is it a cat? A big cat? It\'s hard to tell in the dark. By the time you fumble for your weapon, it\'s much closer.',
        choiceOverrides: {
          shoot: 'Shoot wildly in its general direction',
        },
        outcomeOverrides: {
          shoot: 'You empty most of your ammunition into the darkness. Something yelps and runs off. You hit... something. Probably the right thing.',
        },
      },
    ],
  },

  // --- Found Gold ---
  {
    eventId: 'found_gold',
    variants: [
      {
        stat: 'Luck',
        threshold: 'high',
        description: 'Something glints in the stream. Not just a nugget — it\'s a whole pocket of alluvial gold, washed downstream from a vein nobody\'s found yet. Lady Luck is singing your name today.',
        outcomeOverrides: {
          pan: 'Your luck is absurd. Every pan comes up heavy. By day\'s end you\'ve found three times what most prospectors see in a month.',
        },
      },
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'The stream bed catches your expert eye. The sediment pattern, the rock formations — this is a classic placer deposit. You know exactly where to dig.',
        outcomeOverrides: {
          pan: 'Your geological knowledge pays off. You pan efficiently, targeting the richest deposits while others would dig randomly.',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'low',
        description: 'Ooh, shiny! There\'s something sparkly in the water. It could be gold, or a very ambitious fish. Only one way to find out!',
        choiceOverrides: {
          pan: 'Splash around looking for shiny things',
          continue: 'Resist the shiny (this takes tremendous willpower)',
        },
      },
    ],
  },

  // --- Oxen Theft ---
  {
    eventId: 'oxen_theft',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'You notice the oxen are restless. A careful scan reveals boot prints that don\'t belong to your party — fresh ones, circling the camp. Someone\'s planning a heist.',
        choiceOverrides: {
          fight: 'Spring the trap — you\'re ready for them',
        },
        outcomeOverrides: {
          fight: 'They never expected you to be awake, armed, and waiting. Two shots in the air and they scatter, dropping their ropes.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'high',
        description: 'Bandits emerge from the darkness demanding your oxen. But you\'ve talked down harder crowds than this. These are desperate men, not evil ones.',
        choiceOverrides: {
          negotiate: 'Talk them out of it (your words are more valuable than karma)',
        },
        outcomeOverrides: {
          negotiate: 'You convince them there\'s honest work at the next fort. They leave without taking a single thing. One tips his hat as he goes.',
        },
      },
      {
        stat: 'Agility',
        threshold: 'low',
        description: 'You wake up to find bandits already untying your oxen. You try to leap to your feet but get tangled in your bedroll.',
        outcomeOverrides: {
          fight: 'By the time you untangle yourself and find your gun, the bandits are laughing. You fire anyway. The oxen are saved, but your dignity is not.',
        },
      },
    ],
  },

  // --- Philosophical Stranger ---
  {
    eventId: 'philosophical_stranger',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A disheveled traveler poses a philosophical question. But your keen mind recognizes the paradox structure — it\'s a variation of the tree-falling-in-a-forest problem, adapted for wagons. You can do better.',
        choiceOverrides: {
          engage: 'Counter with a superior philosophical argument',
        },
        outcomeOverrides: {
          engage: 'Your counter-argument leaves HIM speechless. He stares at you, slowly nods, and hands over a spare part. "You win this round, friend."',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'low',
        description: 'A strange man asks you something about wagons and trees and... hearing? You stare blankly. Words are hard today.',
        choiceOverrides: {
          engage: '"Uh... yes? No? Can you repeat the question?"',
          practical: '"I like wagons"',
          ignore: '(Just smile and nod)',
        },
        outcomeOverrides: {
          engage: 'He takes pity on your confusion and gives you a spare part. "Sometimes," he says kindly, "the answer is irrelevant. Here, you need this more than I do."',
          practical: 'He blinks. "That... is perhaps the most honest answer I\'ve ever received." He gives you his spare wheel out of sheer respect.',
        },
      },
    ],
  },

  // --- Suspiciously Helpful Map ---
  {
    eventId: 'suspiciously_helpful_map',
    variants: [
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'You find a map labeled "NOT A TRAP." Your trail knowledge cross-references it against the terrain. The route is actually sound — whoever drew this knew what they were doing.',
        outcomeOverrides: {
          trust: 'Your expertise confirms the shortcut is legitimate. You spot landmarks the map predicted. The cache of supplies was left by a kindred trail expert.',
        },
      },
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A map labeled "NOT A TRAP." Your analytical mind notices the handwriting matches the quality of the cartography — this was made by an educated person, not a bandit. Interesting.',
        outcomeOverrides: {
          distrust: 'You study the map closely and realize it was genuine. The "NOT A TRAP" label was ironic humor from a fellow intellectual. You pocket the map for future reference.',
        },
      },
      {
        stat: 'Luck',
        threshold: 'low',
        description: 'There\'s a map on a tree that says "NOT A TRAP." Given your luck, it\'s absolutely a trap. With your luck, even the safe route might be a trap.',
        outcomeOverrides: {
          trust: 'Against all your survival instincts, the shortcut works. You can\'t believe it. This might be the first time your luck actually held.',
          distrust: 'You ignore it, which is wise given that your luck is terrible. But then you step in a gopher hole. The universe giveth and taketh.',
        },
      },
    ],
  },

  // --- Singing Wheel ---
  {
    eventId: 'singing_wheel',
    variants: [
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'Your wagon wheel is squeaking. Your repair instincts identify it immediately: the hub bearing needs grease, and the pitch comes from a slightly warped felloe. Simple fix.',
        outcomeOverrides: {
          grease: 'A precision application of axle grease silences the squeak AND prevents future wear. Your wheel will last twice as long now.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'high',
        description: 'The wagon wheel\'s squeak is dividing your party. Half love it, half want it silenced. A diplomatic crisis brews over a piece of wood.',
        choiceOverrides: {
          sing_along: 'Broker a compromise: scheduled sing-along hours',
        },
        outcomeOverrides: {
          sing_along: 'Your diplomatic genius creates "Wheel Hour" — one hour of singing per day, silence the rest. Both factions accept. You should run for office.',
        },
      },
    ],
  },

  // --- Starving Family ---
  {
    eventId: 'starving_family',
    variants: [
      {
        stat: 'Durability',
        threshold: 'high',
        description: 'A family on the trail hasn\'t eaten in days. You know what hunger does to the body — you\'ve pushed through it yourself. These children are close to the edge.',
        outcomeOverrides: {
          share_food: 'You share generously, knowing your own constitution can handle the shortage. The family will survive because of your strength.',
        },
      },
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'A starving family begs for food. But you notice edible plants within fifty yards they\'ve walked right past. You can do more than just share rations.',
        choiceOverrides: {
          small_share: 'Share food AND teach them to forage',
        },
        outcomeOverrides: {
          small_share: 'You share a modest portion and spend an hour teaching them which plants are safe to eat. You\'ve given them something better than food — knowledge to survive.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'low',
        description: 'A family looks hungry. Kids are involved. You feel... something. Probably guilt. Words aren\'t your strong suit but actions might be.',
        choiceOverrides: {
          share_food: '(Silently hand over food. No words needed.)',
          refuse: '(Avoid eye contact and keep walking)',
        },
      },
    ],
  },

  // --- Competitive Snake ---
  {
    eventId: 'competitive_snake',
    variants: [
      {
        stat: 'Expertise',
        threshold: 'high',
        description: 'A rattlesnake faces down your ox. Your wildlife knowledge tells you this is a territorial display, not aggression. The snake thinks the ox is encroaching on its sunning spot.',
        outcomeOverrides: {
          wait: 'You wait patiently, knowing the snake will yield once it feels its territory has been respected. True to form, it slithers off after a dignified 10 minutes.',
        },
      },
      {
        stat: 'Luck',
        threshold: 'high',
        description: 'A rattlesnake challenges your ox to a staring contest. You feel lucky about this. Your ox has been undefeated in staring contests since Missouri.',
        outcomeOverrides: {
          bet: 'Your lucky streak continues. Everyone bets on the snake, you bet on the ox. Walking away richer has never felt so ridiculous.',
        },
      },
    ],
  },

  // --- Over-Prepared Traveler ---
  {
    eventId: 'over_prepared_traveler',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A traveler with a comically overloaded wagon offers to trade. Your keen mind calculates immediately: their wagon will break within 20 miles at this weight. They need to offload, badly. The leverage is yours.',
        choiceOverrides: {
          trade_food: 'Negotiate from a position of knowledge',
        },
        outcomeOverrides: {
          trade_food: 'You explain their axle stress in precise detail. Terrified, they give you premium supplies at a steep discount just to lighten the load.',
        },
      },
      {
        stat: 'Diplomacy',
        threshold: 'high',
        description: 'An over-prepared traveler proudly shows off their seventeen varieties of provisions. Their enthusiasm is infectious, and your silver tongue could turn this into an excellent deal.',
        outcomeOverrides: {
          trade_advice: 'Your diplomatic charm turns a brief trade into a friendship. They share not just medicine but their family\'s recipe for trail stew (which is actually quite good).',
        },
      },
    ],
  },

  // --- Ghost Town ---
  {
    eventId: 'ghost_town_shortcut',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A town on no map, immaculate but empty. Your investigative mind pieces together the clues: fresh paint, swept porches, curtains that twitch. This town isn\'t abandoned — it\'s hiding.',
        outcomeOverrides: {
          respect_wishes: 'You leave quickly, understanding that some communities protect themselves through obscurity. At the edge of town, the package has a note: "You understand. Thank you."',
        },
      },
      {
        stat: 'Luck',
        threshold: 'high',
        description: 'An empty town that shouldn\'t exist. Your lucky instincts say this place is a gift, not a threat. The universe has been kind to you here.',
        outcomeOverrides: {
          respect_wishes: 'Your trust is rewarded threefold. The package at town\'s edge contains premium supplies, medicine, AND a map to a safe river crossing ahead.',
        },
      },
      {
        stat: 'Durability',
        threshold: 'low',
        description: 'A weird empty town. You\'re too tired and hungry to question it. Ghost town, real town, whatever — if there\'s food, you\'re interested.',
        choiceOverrides: {
          take_supplies: 'Grab food first, ask questions never',
        },
      },
    ],
  },

  // --- Prophetic Child ---
  {
    eventId: 'prophetic_child',
    variants: [
      {
        stat: 'Shrewdness',
        threshold: 'high',
        description: 'A child points at you and says, "The trail knows your name." Your analytical mind processes this: children pick up on patterns adults miss. What has this child observed about you?',
        outcomeOverrides: {
          ponder: 'You spend the day analyzing your own patterns. The exercise reveals something useful: you\'ve been unconsciously reading trail signs all along. Your confidence grows.',
        },
      },
      {
        stat: 'Luck',
        threshold: 'high',
        description: 'A child declares, "The trail knows your name." Given your extraordinary luck, this feels less like nonsense and more like a prophecy. The universe has been talking to you through coincidence all along.',
        outcomeOverrides: {
          ponder: 'You ponder and feel a profound sense of destiny. The next three days bring nothing but good weather and clear trails. Coincidence? You know better.',
        },
      },
    ],
  },
]
