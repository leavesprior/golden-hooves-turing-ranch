/**
 * Specialty Shops & Hireable Guides
 *
 * Towns occasionally have specialty shops (wagonwright, apothecary, etc.)
 * and unique NPC guides that can be hired for travel segments.
 */

import type { StatName } from '../characterContext'

// ============================================================================
// SPECIALTY SHOP TYPES
// ============================================================================

export type SpecialtyShopType = 'wagonwright' | 'apothecary' | 'outfitter' | 'assayer' | 'blacksmith'

export interface SpecialtyShopItem {
  id: string
  name: string
  emoji: string
  description: string
  price: number          // In neutral karma 🌮
  goodKarmaPrice?: number // Some items cost good karma 🍪 instead
  effect: ShopItemEffect
  stock: number          // How many available (1 for unique items)
  requiresStat?: { stat: StatName; minimum: number }  // Stat gate for purchase
  npcHint?: string       // Which NPC type hints about this item
}

export interface ShopItemEffect {
  type: 'wagon_repair' | 'wagon_upgrade' | 'health_restore' | 'cure_sickness'
      | 'stat_buff' | 'resource_add' | 'special' | 'oxen_heal' | 'speed_boost'
  stat?: StatName
  value: number
  duration?: number      // In travel days, 0 = permanent
  description: string
}

export interface SpecialtyShop {
  type: SpecialtyShopType
  name: string
  emoji: string
  keeperName: string
  keeperGreeting: string
  keeperFarewell: string
  description: string
  items: SpecialtyShopItem[]
  narratorComment: string
  spawnChance: number    // 0-1, probability of appearing at a town
  requiredLandmarkTypes: string[] // Only spawns at these landmark types
}

// ============================================================================
// HIREABLE GUIDES
// ============================================================================

export interface HireableGuide {
  id: string
  name: string
  emoji: string
  title: string
  description: string
  hireCost: number           // In neutral karma 🌮
  goodKarmaCost?: number     // Some require good karma too
  duration: number           // Travel segments (landmarks) they stay for
  benefits: GuideBenefit[]
  personality: string
  hintNpc?: string           // NPC type that tells you about this guide
  hintDialogue: string       // What the hinting NPC says
  spawnLocations: string[]   // Landmark names where they appear
  narratorComment: string
  specialEvent?: string      // Unique event triggered by this guide
}

export interface GuideBenefit {
  type: 'stat_buff' | 'river_bonus' | 'hunting_bonus' | 'disease_resist'
      | 'trail_speed' | 'clue_bonus' | 'reputation_boost' | 'danger_warning'
      | 'shortcut' | 'special'
  stat?: StatName
  value: number
  description: string
}

// ============================================================================
// SPECIALTY SHOP DEFINITIONS
// ============================================================================

export const SPECIALTY_SHOPS: SpecialtyShop[] = [
  {
    type: 'wagonwright',
    name: "Wagonwright's Workshop",
    emoji: '🔨',
    keeperName: 'Old Silas',
    keeperGreeting: "Heard you rattlin' in from a mile away. Let me take a look at that rig.",
    keeperFarewell: "She'll hold together now. Mind the ruts past the mountains.",
    description: 'Expert wagon repair and upgrades. Can reinforce your wagon for the rough terrain ahead.',
    narratorComment: "The wagonwright's hands are calloused from decades of honest work. The narrator respects this. It is an unfamiliar feeling.",
    spawnChance: 0.35,
    requiredLandmarkTypes: ['town', 'fort'],
    items: [
      {
        id: 'wagon_full_repair',
        name: 'Full Wagon Overhaul',
        emoji: '🔧',
        description: 'Complete inspection, repair, and re-grease. Restores wagon to near-new condition.',
        price: 40,
        effect: {
          type: 'wagon_repair',
          value: 80,
          description: 'Restores wagon condition to maximum (100)',
        },
        stock: 1,
      },
      {
        id: 'reinforced_axle',
        name: 'Reinforced Iron Axle',
        emoji: '⚙️',
        description: 'Stronger than standard. Reduces chance of axle breaks on rough terrain.',
        price: 30,
        effect: {
          type: 'wagon_upgrade',
          value: 15,
          duration: 0,
          description: '+15 max wagon durability (permanent upgrade)',
        },
        stock: 1,
        npcHint: 'blacksmith',
      },
      {
        id: 'canvas_repair_kit',
        name: 'Canvas Repair Kit',
        emoji: '🧵',
        description: 'Heavy-duty canvas patches and waterproofing wax.',
        price: 12,
        effect: {
          type: 'wagon_repair',
          value: 25,
          description: 'Repairs wagon cover, +25 wagon condition',
        },
        stock: 3,
      },
      {
        id: 'spare_wheel_set',
        name: 'Premium Spare Wheel Set',
        emoji: '☸️',
        description: 'Iron-rimmed wheels that last twice as long.',
        price: 20,
        effect: {
          type: 'resource_add',
          value: 3,
          description: 'Adds 3 spare parts to inventory',
        },
        stock: 2,
      },
      {
        id: 'ox_yoke_upgrade',
        name: 'Padded Ox Yoke',
        emoji: '🐂',
        description: 'Reduces strain on oxen. Healthier oxen pull harder.',
        price: 15,
        effect: {
          type: 'oxen_heal',
          value: 2,
          duration: 0,
          description: 'Oxen health improved, reduces oxen death chance by 50%',
        },
        stock: 1,
        npcHint: 'farmer',
      },
      {
        id: 'grease_bucket',
        name: 'Axle Grease (Large)',
        emoji: '🪣',
        description: 'Keeps wheels turning smooth. Prevents wear.',
        price: 5,
        effect: {
          type: 'speed_boost',
          value: 10,
          duration: 5,
          description: '+10% travel speed for 5 days',
        },
        stock: 5,
      },
    ],
  },
  {
    type: 'apothecary',
    name: "Apothecary & Herbalist",
    emoji: '⚗️',
    keeperName: 'Dr. Josephine Wu',
    keeperGreeting: "I see exhaustion in your eyes. Let me help. I have remedies the frontier doctors haven't dreamed of.",
    keeperFarewell: "Remember: prevention is the best medicine. Boil your water.",
    description: 'Herbal medicines, tonics, and remedies beyond what the general store carries.',
    narratorComment: "Dr. Wu's remedies actually work, which puts her at odds with every other medicine seller in Gold Country.",
    spawnChance: 0.25,
    requiredLandmarkTypes: ['town', 'fort', 'spring'],
    items: [
      {
        id: 'cholera_tincture',
        name: 'Anti-Cholera Tincture',
        emoji: '💧',
        description: 'Distilled willow bark and charcoal. Actually effective against cholera.',
        price: 25,
        effect: {
          type: 'cure_sickness',
          value: 1,
          description: 'Instantly cures cholera. Also prevents cholera for 10 days.',
        },
        stock: 2,
        npcHint: 'doctor',
      },
      {
        id: 'vitality_elixir',
        name: 'Mountain Vitality Elixir',
        emoji: '🧪',
        description: 'A blend of ginseng, honey, and mountain herbs. Remarkable restorative properties.',
        price: 20,
        effect: {
          type: 'health_restore',
          value: 40,
          description: 'Restores 40 health to all party members',
        },
        stock: 3,
      },
      {
        id: 'snakebite_antivenom',
        name: 'Rattlesnake Antivenom',
        emoji: '🐍',
        description: 'Extracted from rattlesnake venom itself. The cure in the poison.',
        price: 15,
        effect: {
          type: 'cure_sickness',
          value: 1,
          description: 'Cures snakebite instantly. Also provides snakebite immunity for 7 days.',
        },
        stock: 2,
      },
      {
        id: 'durability_tonic',
        name: 'Iron Constitution Tonic',
        emoji: '💪',
        description: 'Strengthens the body against illness and injury.',
        price: 18,
        effect: {
          type: 'stat_buff',
          stat: 'Durability',
          value: 3,
          duration: 7,
          description: '+3 Durability for 7 days',
        },
        stock: 2,
      },
      {
        id: 'fever_reducer',
        name: 'Willow Bark Powder',
        emoji: '🌿',
        description: 'Nature\'s aspirin. Reduces fever and speeds recovery.',
        price: 8,
        effect: {
          type: 'cure_sickness',
          value: 1,
          description: 'Reduces sickness recovery time by 3 days',
        },
        stock: 5,
      },
      {
        id: 'preventive_medicine',
        name: 'Preventive Tonic Pack',
        emoji: '🛡️',
        description: 'Daily drops that fortify the body against disease.',
        price: 30,
        effect: {
          type: 'special',
          value: 10,
          duration: 10,
          description: '50% disease resistance for entire party for 10 days',
        },
        stock: 1,
        requiresStat: { stat: 'Shrewdness', minimum: 7 },
        npcHint: 'doctor',
      },
    ],
  },
  {
    type: 'outfitter',
    name: "Trail Outfitter & Guide Service",
    emoji: '🎒',
    keeperName: 'Big Jim McTavish',
    keeperGreeting: "Heading through the pass? You'll need more than courage. Step inside.",
    keeperFarewell: "Watch the weather and trust your oxen. They know the trail better than you do.",
    description: 'Specialized trail gear, weather protection, and guide recommendations.',
    narratorComment: "Big Jim has been outfitting prospectors since before the gold rush. His survival rate is... better than average. The narrator declines to share specific numbers.",
    spawnChance: 0.3,
    requiredLandmarkTypes: ['town', 'fort', 'pass'],
    items: [
      {
        id: 'winter_gear_set',
        name: 'Winter Expedition Gear',
        emoji: '🧤',
        description: 'Fur-lined coats, boots, and gloves. Essential for mountain passes.',
        price: 35,
        effect: {
          type: 'resource_add',
          value: 3,
          description: 'Adds 3 sets of clothing. Eliminates cold weather health penalty.',
        },
        stock: 2,
      },
      {
        id: 'trail_compass',
        name: 'Surveyor\'s Compass',
        emoji: '🧭',
        description: 'Military-grade navigation instrument. Never lose your way.',
        price: 25,
        effect: {
          type: 'stat_buff',
          stat: 'Expertise',
          value: 2,
          duration: 0,
          description: '+2 Expertise permanently (navigation bonus)',
        },
        stock: 1,
        npcHint: 'scout',
      },
      {
        id: 'waterproof_satchel',
        name: 'Waterproof Document Satchel',
        emoji: '👝',
        description: 'Oilskin-lined case. Protects your evidence and documents during river crossings.',
        price: 10,
        effect: {
          type: 'special',
          value: 1,
          duration: 0,
          description: 'River crossings never destroy collected clues',
        },
        stock: 1,
      },
      {
        id: 'hunting_kit_pro',
        name: 'Professional Hunting Kit',
        emoji: '🏹',
        description: 'Traps, calls, and scent masks. Doubles hunting yield.',
        price: 20,
        effect: {
          type: 'special',
          value: 2,
          duration: 10,
          description: '2x hunting food yield for 10 days',
        },
        stock: 1,
        requiresStat: { stat: 'Agility', minimum: 6 },
      },
      {
        id: 'repair_toolkit',
        name: 'Master Repair Toolkit',
        emoji: '🧰',
        description: 'Professional-grade tools. Repairs are more effective.',
        price: 15,
        effect: {
          type: 'resource_add',
          value: 2,
          description: 'Adds 2 spare parts. Wagon repairs restore 50% more condition.',
        },
        stock: 2,
      },
    ],
  },
  {
    type: 'assayer',
    name: "Assayer's Office & Claims",
    emoji: '⚖️',
    keeperName: 'Edgar Pemberton III',
    keeperGreeting: "Bring any nuggets? No? Then perhaps I can interest you in a claim... for the right price.",
    keeperFarewell: "Good luck out there. May your pan yield more than sand.",
    description: 'Gold assessment, mining claims, and prospecting equipment.',
    narratorComment: "Edgar's family has been assaying gold since before it was fashionable. He can tell real gold by taste, which the narrator finds both impressive and concerning.",
    spawnChance: 0.2,
    requiredLandmarkTypes: ['town', 'landmark', 'spring'],
    items: [
      {
        id: 'gold_pan',
        name: 'Professional Gold Pan',
        emoji: '🥘',
        description: 'Copper-bottomed pan for panning gold from rivers.',
        price: 8,
        effect: {
          type: 'special',
          value: 5,
          duration: 0,
          description: 'Earn 5🌮 neutral karma at each river crossing from gold panning',
        },
        stock: 1,
      },
      {
        id: 'mining_claim',
        name: 'Small Mining Claim',
        emoji: '📜',
        description: 'Legal claim to a section of creek bed near Gold Country.',
        price: 50,
        goodKarmaPrice: 10,
        effect: {
          type: 'special',
          value: 1,
          duration: 0,
          description: 'Generates 3🌮 neutral karma per day while in Gold Country',
        },
        stock: 1,
        requiresStat: { stat: 'Shrewdness', minimum: 8 },
        npcHint: 'prospector',
      },
      {
        id: 'luck_nugget',
        name: 'Lucky Gold Nugget',
        emoji: '✨',
        description: 'A small but genuine gold nugget. Supposedly brings luck to its holder.',
        price: 15,
        effect: {
          type: 'stat_buff',
          stat: 'Luck',
          value: 1,
          duration: 0,
          description: '+1 Luck permanently',
        },
        stock: 1,
      },
    ],
  },
  {
    type: 'blacksmith',
    name: "Blacksmith & Farrier",
    emoji: '🔥',
    keeperName: 'Hank Ironside',
    keeperGreeting: "Need shoes for your animals or steel for your wagon? You've come to the right forge.",
    keeperFarewell: "Ride hard, ride safe. If the shoe fits... well, it should. I made it.",
    description: 'Horseshoes, wagon fittings, and metalwork.',
    narratorComment: "The blacksmith's arms are thicker than most people's legs. The narrator decides not to comment on this to his face.",
    spawnChance: 0.3,
    requiredLandmarkTypes: ['town', 'fort'],
    items: [
      {
        id: 'horseshoe_set',
        name: 'Full Horseshoe Set',
        emoji: '🧲',
        description: 'Fresh iron shoes for all your animals. Better traction, less injury.',
        price: 12,
        effect: {
          type: 'speed_boost',
          value: 15,
          duration: 10,
          description: '+15% travel speed for 10 days',
        },
        stock: 2,
      },
      {
        id: 'iron_wagon_bands',
        name: 'Iron Wagon Wheel Bands',
        emoji: '⭕',
        description: 'Reinforced iron bands around each wheel. Much harder to crack.',
        price: 22,
        effect: {
          type: 'wagon_upgrade',
          value: 10,
          duration: 0,
          description: 'Wagon takes 25% less damage from terrain',
        },
        stock: 1,
      },
      {
        id: 'ox_shoes',
        name: 'Ox Shoes (Set of 8)',
        emoji: '🐂',
        description: 'Protect your oxen\'s hooves on rocky trails.',
        price: 10,
        effect: {
          type: 'oxen_heal',
          value: 1,
          duration: 0,
          description: 'Oxen move faster on rough terrain, reduced lameness risk',
        },
        stock: 2,
      },
      {
        id: 'bowie_knife',
        name: 'Bowie Knife (Hand-Forged)',
        emoji: '🗡️',
        description: 'A proper frontier knife. Useful for hunting, camp, and self-defense.',
        price: 8,
        effect: {
          type: 'stat_buff',
          stat: 'Agility',
          value: 1,
          duration: 0,
          description: '+1 Agility permanently (close-quarters combat bonus)',
        },
        stock: 1,
      },
    ],
  },
]

// ============================================================================
// HIREABLE GUIDE DEFINITIONS
// ============================================================================

export const HIREABLE_GUIDES: HireableGuide[] = [
  {
    id: 'scout_running_elk',
    name: 'Running Elk',
    emoji: '🦅',
    title: 'Shoshone Trail Scout',
    description: 'A Shoshone scout who knows every pass, ford, and shortcut through the mountains. Speaks softly but his knowledge is invaluable.',
    hireCost: 30,
    duration: 3,
    benefits: [
      { type: 'river_bonus', value: 3, description: '+3 to all river crossing rolls' },
      { type: 'shortcut', value: 50, description: 'Reveals shortcuts that save 50 miles' },
      { type: 'danger_warning', value: 1, description: 'Warns of ambushes and dangers 1 day ahead' },
    ],
    personality: 'quiet_wise',
    hintNpc: 'native_elder',
    hintDialogue: "There is a scout who walks between our world and theirs. He knows the rivers like his own breath. Find him at the Fort.",
    spawnLocations: ['Fort Laramie', 'Fort Bridger', 'Fort Hall'],
    narratorComment: "Running Elk's trail sense borders on supernatural. The narrator suspects him of being an unreasonably competent person, which is generally frowned upon in fiction.",
    specialEvent: 'hidden_hot_spring',
  },
  {
    id: 'guide_whiskey_pete',
    name: 'Whiskey Pete',
    emoji: '🤠',
    title: 'Prospector & Raconteur',
    description: 'A grizzled prospector who\'s been up and down the California Trail more times than he can count. His stories are 60% true, which is above average for the frontier.',
    hireCost: 15,
    duration: 2,
    benefits: [
      { type: 'clue_bonus', value: 1, description: 'Shares an extra clue at each location' },
      { type: 'hunting_bonus', value: 25, description: '+25% hunting success' },
      { type: 'reputation_boost', stat: 'Diplomacy', value: 1, description: 'Settlers like you more when Pete vouches' },
    ],
    personality: 'jovial_unreliable',
    hintNpc: 'bartender',
    hintDialogue: "Old Pete's been talkin' about headin' west again. If you catch him sober - good luck with that - he's the best trail companion money can buy.",
    spawnLocations: ['Independence, Missouri', 'Fort Kearny', 'Chimney Rock', 'Soda Springs'],
    narratorComment: "Whiskey Pete is the kind of man who tells the truth accidentally and lies on purpose. The narrator feels a strange kinship.",
  },
  {
    id: 'guide_doc_sarah',
    name: 'Dr. Sarah Whitfield',
    emoji: '👩‍⚕️',
    title: 'Frontier Physician',
    description: 'One of the few licensed doctors on the trail. She gave up a comfortable practice in St. Louis to care for emigrants. She is both brilliant and stubborn.',
    hireCost: 40,
    goodKarmaCost: 5,
    duration: 4,
    benefits: [
      { type: 'disease_resist', value: 75, description: '75% disease resistance for entire party' },
      { type: 'stat_buff', stat: 'Durability', value: 2, description: '+2 Durability while traveling' },
      { type: 'special', value: 1, description: 'Can cure any sickness without medicine' },
    ],
    personality: 'stern_caring',
    hintNpc: 'doctor',
    hintDialogue: "There's a physician traveling the trail. Dr. Whitfield. If you can convince her to join you, your party's chances improve dramatically. She doesn't suffer fools.",
    spawnLocations: ['Fort Kearny', 'Fort Laramie', 'Fort Boise'],
    narratorComment: "Dr. Whitfield is the most competent person in any room she enters. The narrator finds this mildly threatening.",
    specialEvent: 'medical_emergency_rescue',
  },
  {
    id: 'guide_two_moons',
    name: 'Two Moons',
    emoji: '🌙',
    title: 'Paiute Star Navigator',
    description: 'A Paiute elder who reads the stars like a book. She navigates by night and knows the desert trails no map has ever recorded.',
    hireCost: 25,
    goodKarmaCost: 3,
    duration: 3,
    benefits: [
      { type: 'trail_speed', value: 20, description: '+20% night travel speed' },
      { type: 'shortcut', value: 30, description: 'Reveals hidden desert paths saving 30 miles' },
      { type: 'clue_bonus', value: 1, description: 'Shares wisdom that counts as investigation clues' },
    ],
    personality: 'mystical_patient',
    hintNpc: 'native_elder',
    hintDialogue: "The stars speak to those who listen. Two Moons listens better than anyone. She camps near the springs when the moon is right.",
    spawnLocations: ['Soda Springs', 'Snake River Crossing', 'The Dalles'],
    narratorComment: "Two Moons navigates by starlight with an accuracy that makes the narrator's GPS metaphor feel inadequate.",
  },
  {
    id: 'guide_chinese_li',
    name: 'Li Wei',
    emoji: '🏮',
    title: 'Railroad Survey Engineer',
    description: 'A Chinese engineer surveying the route for the future transcontinental railroad. His precise understanding of terrain and bridge construction is unmatched.',
    hireCost: 35,
    duration: 3,
    benefits: [
      { type: 'river_bonus', value: 5, description: '+5 to ferry and bridge crossing rolls' },
      { type: 'stat_buff', stat: 'Expertise', value: 2, description: '+2 Expertise while traveling' },
      { type: 'special', value: 1, description: 'Can repair wagon without spare parts (once)' },
    ],
    personality: 'methodical_brilliant',
    hintNpc: 'engineer',
    hintDialogue: "There's a Chinese surveyor mapping the rail route. Brilliant fellow. He helped three wagons across the Snake River last month. You'd be lucky to have him along.",
    spawnLocations: ['Fort Bridger', 'Fort Hall', 'Snake River Crossing', 'Blue Mountains'],
    narratorComment: "Li Wei carries a slide rule and a dream of connecting a continent. The narrator notes that both are more powerful than they appear.",
  },
  {
    id: 'guide_mountain_mary',
    name: 'Mountain Mary',
    emoji: '🏔️',
    title: 'Mountain Woman & Trapper',
    description: 'A legendary figure who has lived alone in the Rockies for fifteen years. She knows every animal trail, every water source, and every safe campsite.',
    hireCost: 20,
    duration: 2,
    benefits: [
      { type: 'hunting_bonus', value: 50, description: '+50% hunting food yield' },
      { type: 'danger_warning', value: 2, description: 'Warns of weather and animal dangers 2 days ahead' },
      { type: 'trail_speed', value: 10, description: '+10% mountain travel speed' },
    ],
    personality: 'gruff_kind',
    hintNpc: 'trapper',
    hintDialogue: "You want to make it through the mountains? Find Mountain Mary. Don't let the bear claws around her neck scare you. She's the kindest soul on this range.",
    spawnLocations: ['Independence Rock', 'South Pass', 'Blue Mountains'],
    narratorComment: "Mountain Mary once wrestled a grizzly to a draw. The narrator checked. Both parties confirm this.",
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine which specialty shops appear at a given landmark.
 * Uses landmark type and random chance.
 */
export function getAvailableShops(
  landmarkName: string,
  landmarkType: string,
  seed?: number
): SpecialtyShop[] {
  const rng = seed !== undefined
    ? () => { seed = (seed! * 16807) % 2147483647; return seed! / 2147483647 }
    : Math.random

  return SPECIALTY_SHOPS.filter(shop => {
    if (!shop.requiredLandmarkTypes.includes(landmarkType)) return false
    return rng() < shop.spawnChance
  })
}

/**
 * Determine which guides are available at a given landmark.
 */
export function getAvailableGuides(landmarkName: string): HireableGuide[] {
  return HIREABLE_GUIDES.filter(guide =>
    guide.spawnLocations.includes(landmarkName)
  )
}

/**
 * Get NPC hints about special items/guides at nearby locations.
 */
export function getNpcHints(
  npcType: string,
  currentLandmark: string
): Array<{ type: 'item' | 'guide'; name: string; hint: string; location: string }> {
  const hints: Array<{ type: 'item' | 'guide'; name: string; hint: string; location: string }> = []

  // Guide hints
  for (const guide of HIREABLE_GUIDES) {
    if (guide.hintNpc === npcType) {
      // Only hint about guides at nearby locations (not current)
      const nearbySpawns = guide.spawnLocations.filter(l => l !== currentLandmark)
      if (nearbySpawns.length > 0) {
        hints.push({
          type: 'guide',
          name: guide.name,
          hint: guide.hintDialogue,
          location: nearbySpawns[0],
        })
      }
    }
  }

  // Shop item hints
  for (const shop of SPECIALTY_SHOPS) {
    for (const item of shop.items) {
      if (item.npcHint === npcType) {
        hints.push({
          type: 'item',
          name: item.name,
          hint: `I hear ${shop.keeperName} at the ${shop.name} has something special - a ${item.name}. Worth the visit.`,
          location: 'nearby town',
        })
      }
    }
  }

  return hints
}

/**
 * Check if player meets stat requirement for a shop item.
 */
export function meetsRequirement(
  item: SpecialtyShopItem,
  stats: Record<string, number>
): { meets: boolean; reason?: string } {
  if (!item.requiresStat) return { meets: true }

  const playerStat = stats[item.requiresStat.stat] || 0
  if (playerStat >= item.requiresStat.minimum) {
    return { meets: true }
  }
  return {
    meets: false,
    reason: `Requires ${item.requiresStat.stat} ${item.requiresStat.minimum} (you have ${playerStat})`,
  }
}
