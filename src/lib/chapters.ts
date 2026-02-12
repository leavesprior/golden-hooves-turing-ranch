import { MapData, TileType, ExitRequirement } from '@/components/rpg/TileMap'
import { DialogueNode, ChapterId, NPCMood, Puzzle, InventoryItem, RevealRule } from './rpgContext'

// Helper to create map from string template
function parseMapTemplate(template: string): TileType[][] {
  const rows = template.trim().split('\n')
  return rows.map(row =>
    row.trim().split(' ').map(tile => tile as TileType)
  )
}

// ============================================
// CHAPTER 1: THE JOURNEY WEST
// ============================================

export const ch1_trail: MapData = {
  id: 'ch1_trail',
  name: 'The Oregon Trail - 1852',
  width: 8,
  height: 6,
  tiles: parseMapTemplate(`
    mountain mountain forest forest forest forest mountain mountain
    forest path path path path path path forest
    grass path wagon campfire path path path grass
    grass grass path path path path bridge water
    grass cave grass path path path water water
    rock rock grass sign grass grass water water
  `),
  spawnPoint: { x: 1, y: 1 },
  interactionPoints: [
    { position: { x: 2, y: 2 }, dialogueId: 'ch1_wagon', icon: '🐴' },
    { position: { x: 3, y: 2 }, dialogueId: 'ch1_campfire', icon: '🏕️' },
    { position: { x: 3, y: 5 }, dialogueId: 'ch1_sign', icon: '📜' },
    { position: { x: 6, y: 3 }, dialogueId: 'ch1_bridge', icon: '🌉' },
    { position: { x: 1, y: 4 }, dialogueId: 'ch1_cave', icon: '🕳️' },
    { position: { x: 1, y: 1 }, dialogueId: 'ch1_mysterious_traveler', icon: '🔮' },  // Easter egg
  ],
  exits: [
    {
      position: { x: 7, y: 1 },
      targetMap: 'ch1_river',
      targetSpawn: { x: 0, y: 2 },
      requirement: {
        // Requires rope OR Diplomacy 3 (wagon master helps you cross)
        itemRequired: ['rope'],
        skillCheck: [{ skill: 'diplomacy', min: 3 }],
        failMessage: 'Need rope or convince the Wagon Master (Diplomacy +3)',
      },
    },
  ],
}

export const ch1_river: MapData = {
  id: 'ch1_river',
  name: 'River Crossing',
  width: 8,
  height: 6,
  tiles: parseMapTemplate(`
    forest forest water water water water forest forest
    forest path water water water water path forest
    path path water water water water path path
    path path bridge bridge bridge bridge path path
    grass path path path path path path grass
    grass grass sign grass grass grass grass grass
  `),
  spawnPoint: { x: 0, y: 2 },
  interactionPoints: [
    { position: { x: 2, y: 5 }, dialogueId: 'ch1_river_choice', icon: '📜' },
  ],
  exits: [
    {
      position: { x: 7, y: 2 },
      targetMap: 'ch2_volcano',
      targetSpawn: { x: 1, y: 2 },
      requirement: {
        // Must complete the river crossing objective first
        objectiveRequired: 'river_crossing_complete',
        failMessage: 'Must cross the river first - talk to the guide',
      },
    },
    { position: { x: 0, y: 2 }, targetMap: 'ch1_trail', targetSpawn: { x: 6, y: 1 } },
  ],
}

// ============================================
// CHAPTER 2: VOLCANO, CALIFORNIA (Real Location)
// The haunted St. George Hotel, Masonic Lodge & Cobblestone Theatre
// ============================================

export const ch2_volcano: MapData = {
  id: 'ch2_volcano',
  name: 'Volcano, California - 1852',
  width: 10,
  height: 8,
  tiles: parseMapTemplate(`
    mountain mountain forest cemetery cemetery tombstone forest mountain mountain mountain
    forest cobblestone cobblestone cobblestone cobblestone cobblestone cobblestone cobblestone forest forest
    forest cobblestone hotel hotel lantern theatre theatre cobblestone saloon forest
    grass cobblestone door path cobblestone stage door cobblestone door grass
    grass cobblestone cobblestone cobblestone well cobblestone cobblestone cobblestone cobblestone grass
    rock cobblestone lodge lodge lantern building building cobblestone path rock
    rock grass secretdoor path cobblestone door path cobblestone path grass
    rock rock grass grass cobblestone cobblestone grass grass grass rock
  `),
  spawnPoint: { x: 3, y: 4 },
  interactionPoints: [
    { position: { x: 2, y: 2 }, dialogueId: 'ch2_hotel', icon: '🏨' },
    { position: { x: 2, y: 3 }, dialogueId: 'ch2_hotel_door', icon: '🚪' },
    { position: { x: 1, y: 2 }, dialogueId: 'ch2_ghost_room', icon: '👻' },  // Easter egg - ghost in hotel
    { position: { x: 5, y: 2 }, dialogueId: 'ch2_theatre', icon: '🎭' },
    { position: { x: 5, y: 3 }, dialogueId: 'ch2_theatre_stage', icon: '🎪' },
    { position: { x: 8, y: 2 }, dialogueId: 'ch2_saloon', icon: '🍺' },
    { position: { x: 4, y: 4 }, dialogueId: 'ch2_well', icon: '💧' },
    { position: { x: 2, y: 5 }, dialogueId: 'ch2_lodge', icon: '🏛️' },
    { position: { x: 2, y: 6 }, dialogueId: 'ch2_secret_entrance', icon: '🚪' },
    { position: { x: 4, y: 2 }, dialogueId: 'ch2_lantern_main', icon: '🏮' },
    { position: { x: 5, y: 0 }, dialogueId: 'ch2_cemetery', icon: '🪦' },
  ],
  exits: [
    { position: { x: 8, y: 6 }, targetMap: 'ch2_general_store', targetSpawn: { x: 0, y: 2 } },
    {
      position: { x: 3, y: 6 },
      targetMap: 'ch2_secret_mine',
      targetSpawn: { x: 4, y: 0 },
      requirement: {
        mustUnlock: true,
        unlockId: 'lodge_secret_unlocked',
        failMessage: 'The door is locked. The Masons guard their secrets...',
      },
    },
  ],
}

export const ch2_secret_mine: MapData = {
  id: 'ch2_secret_mine',
  name: 'Secret Mason Mine',
  width: 8,
  height: 6,
  tiles: parseMapTemplate(`
    rock rock rock rock tunnel rock rock rock
    rock tunnel tunnel tunnel tunnel tunnel tunnel rock
    rock minecart path path path path gold rock
    rock tunnel path quartz path vein tunnel rock
    rock tunnel tunnel tunnel tunnel tunnel tunnel rock
    rock rock rock rock cave rock rock rock
  `),
  spawnPoint: { x: 4, y: 0 },
  interactionPoints: [
    { position: { x: 6, y: 2 }, dialogueId: 'ch2_mine_gold', icon: '✨' },
    { position: { x: 3, y: 3 }, dialogueId: 'ch2_mine_quartz', icon: '💎' },
    { position: { x: 5, y: 3 }, dialogueId: 'ch2_mine_vein', icon: '🌟' },
    { position: { x: 1, y: 2 }, dialogueId: 'ch2_mine_cart', icon: '🛒' },
    { position: { x: 4, y: 5 }, dialogueId: 'ch2_mine_deep', icon: '🕳️' },
  ],
  exits: [
    { position: { x: 4, y: 0 }, targetMap: 'ch2_volcano', targetSpawn: { x: 3, y: 6 } },
  ],
}

export const ch2_general_store: MapData = {
  id: 'ch2_general_store',
  name: 'General Store - Est. 1852',
  width: 8,
  height: 6,
  tiles: parseMapTemplate(`
    building building building building building building building building
    shelf shelf path path path path shelf shelf
    barrel path path counter counter path path barrel
    crate path path clerk path path path crate
    shelf path path path path path path shelf
    building door path path path path door building
  `),
  spawnPoint: { x: 0, y: 2 },
  interactionPoints: [
    { position: { x: 3, y: 3 }, dialogueId: 'ch2_clerk', icon: '🧑‍🌾' },
    { position: { x: 3, y: 2 }, dialogueId: 'ch2_counter', icon: '⚖️' },
    { position: { x: 0, y: 2 }, dialogueId: 'ch2_barrel', icon: '🛢️' },
    { position: { x: 0, y: 3 }, dialogueId: 'ch2_supplies', icon: '📦' },
  ],
  exits: [
    { position: { x: 0, y: 2 }, targetMap: 'ch2_volcano', targetSpawn: { x: 7, y: 6 } },
    { position: { x: 1, y: 5 }, targetMap: 'ch2_volcano', targetSpawn: { x: 4, y: 7 } },
    {
      position: { x: 6, y: 5 },
      targetMap: 'ch3_angels_camp',
      targetSpawn: { x: 1, y: 1 },
      requirement: {
        levelMin: 3,
        failMessage: 'Need more experience before traveling to Angels Camp (Level 3)',
      },
    },
  ],
}

// ============================================
// CHAPTER 3: ANGELS CAMP (Real Location)
// Where Mark Twain heard the Jumping Frog story
// Home of the famous Calaveras County Frog Jumping Jubilee
// ============================================

export const ch3_angels_camp: MapData = {
  id: 'ch3_angels_camp',
  name: 'Angels Camp - 1865',
  width: 10,
  height: 8,
  tiles: parseMapTemplate(`
    mountain mountain creek creek creek creek forest forest forest mountain
    forest path path bridge bridge path path stagecoach forest forest
    grass saloon saloon path path building newspaper path path grass
    grass path door path statue door path path path grass
    grass path arena arena arena arena path claim claim grass
    rock path frog frog frog frog path mine mine rock
    rock path path path lantern path path path path rock
    rock rock grass sign grass grass grass path grass rock
  `),
  spawnPoint: { x: 1, y: 1 },
  interactionPoints: [
    { position: { x: 2, y: 2 }, dialogueId: 'ch3_saloon', icon: '🍺' },
    { position: { x: 2, y: 3 }, dialogueId: 'ch3_saloon_door', icon: '🚪' },
    { position: { x: 4, y: 3 }, dialogueId: 'ch3_twain_statue', icon: '🗿' },
    { position: { x: 6, y: 2 }, dialogueId: 'ch3_newspaper', icon: '📰' },
    { position: { x: 7, y: 1 }, dialogueId: 'ch3_stagecoach', icon: '🐎' },
    { position: { x: 3, y: 4 }, dialogueId: 'ch3_arena', icon: '🏟️' },
    { position: { x: 3, y: 5 }, dialogueId: 'ch3_frog', icon: '🐸' },
    { position: { x: 7, y: 4 }, dialogueId: 'ch3_claim', icon: '⛏️' },
    { position: { x: 7, y: 5 }, dialogueId: 'ch3_mine_entrance', icon: '🕳️' },
    { position: { x: 3, y: 7 }, dialogueId: 'ch3_sign', icon: '📜' },
    { position: { x: 1, y: 6 }, dialogueId: 'ch3_pegasus_legend', icon: '✨' },  // Easter egg - Pegasus legend
  ],
  exits: [
    {
      position: { x: 8, y: 6 },
      targetMap: 'ch3_hillside',
      targetSpawn: { x: 0, y: 3 },
      requirement: {
        attributeCheck: [{ attribute: 'str', min: 12 }],
        itemRequired: ['mule', 'horse'],
        failMessage: 'Trail too steep - need STR 12+ or a mount',
      },
    },
  ],
}

export const ch3_hillside: MapData = {
  id: 'ch3_hillside',
  name: 'Carson Hill - The Mother Lode',
  width: 10,
  height: 8,
  tiles: parseMapTemplate(`
    mountain mountain mountain gold gold mountain mountain mountain mountain mountain
    rock rock path path path path rock forest forest forest
    grass minecart path path quartz path path path forest forest
    path path path creek creek creek path path path grass
    grass tunnel path path bridge path path claim path grass
    grass tunnel tunnel path path vein path path path grass
    rock rock cave path path path path path grass rock
    rock rock rock grass path path grass grass grass rock
  `),
  spawnPoint: { x: 0, y: 3 },
  interactionPoints: [
    { position: { x: 3, y: 0 }, dialogueId: 'ch3_gold_vein', icon: '✨' },
    { position: { x: 4, y: 2 }, dialogueId: 'ch3_quartz', icon: '💎' },
    { position: { x: 5, y: 5 }, dialogueId: 'ch3_secret_vein', icon: '🌟' },
    { position: { x: 1, y: 2 }, dialogueId: 'ch3_minecart', icon: '🛒' },
    { position: { x: 1, y: 4 }, dialogueId: 'ch3_tunnel', icon: '🚇' },
    { position: { x: 2, y: 6 }, dialogueId: 'ch3_deep_cave', icon: '🕳️' },
    { position: { x: 7, y: 4 }, dialogueId: 'ch3_rich_claim', icon: '⛏️' },
  ],
  exits: [
    { position: { x: 0, y: 3 }, targetMap: 'ch3_angels_camp', targetSpawn: { x: 7, y: 6 } },
    {
      position: { x: 9, y: 4 },
      targetMap: 'ch4_ranch',
      targetSpawn: { x: 1, y: 5 },
      requirement: {
        levelMin: 5,
        itemRequired: ['land_deed'],
        failMessage: 'Need more experience (Level 5) and land deed to claim property',
      },
    },
  ],
}

// ============================================
// CHAPTER 4: THE RANCH (Building Your Homestead)
// The beginning of Back of Beyond Ranch
// ============================================

export const ch4_ranch: MapData = {
  id: 'ch4_ranch',
  name: 'Back of Beyond Ranch - 1870',
  width: 10,
  height: 8,
  tiles: parseMapTemplate(`
    mountain mountain mountain forest forest forest mountain mountain mountain mountain
    forest forest path path barn barn corral corral forest forest
    forest path path cabin cabin path corral corral path forest
    grass path path door window path path path path grass
    grass garden garden path path windmill path pond pond grass
    water water path path firepit path orchard orchard path grass
    water water dock path path path orchard orchard deck grass
    water water water path path path path path lookout rock
  `),
  spawnPoint: { x: 1, y: 5 },
  interactionPoints: [
    { position: { x: 3, y: 3 }, dialogueId: 'ch4_cabin_door', icon: '🚪' },
    { position: { x: 4, y: 1 }, dialogueId: 'ch4_barn', icon: '🏚️' },
    { position: { x: 6, y: 1 }, dialogueId: 'ch4_corral', icon: '🐴' },
    { position: { x: 7, y: 1 }, dialogueId: 'ch4_wise_horse', icon: '🧠' },  // Easter egg - wise horse Duchess
    { position: { x: 1, y: 4 }, dialogueId: 'ch4_garden', icon: '🌻' },
    { position: { x: 5, y: 4 }, dialogueId: 'ch4_windmill', icon: '🌀' },
    { position: { x: 7, y: 4 }, dialogueId: 'ch4_pond', icon: '🦆' },
    { position: { x: 4, y: 5 }, dialogueId: 'ch4_firepit', icon: '🔥' },
    { position: { x: 6, y: 5 }, dialogueId: 'ch4_orchard', icon: '🍎' },
    { position: { x: 2, y: 6 }, dialogueId: 'ch4_dock', icon: '🛶' },
    { position: { x: 7, y: 6 }, dialogueId: 'ch4_deck', icon: '🌅' },
    { position: { x: 8, y: 7 }, dialogueId: 'ch4_lookout', icon: '🔭' },
  ],
  exits: [
    {
      position: { x: 2, y: 2 },
      targetMap: 'ch5_ranch_final',
      targetSpawn: { x: 3, y: 3 },
      requirement: {
        levelMin: 7,
        failMessage: 'Need to become established first (Level 7)',
      },
    },
  ],
}

// ============================================
// CHAPTER 5: THE LEGACY (Transition to Physical Hunt)
// Tobias hides the treasure and creates the clues
// The prosperous, established Back of Beyond Ranch
// ============================================

export const ch5_ranch_final: MapData = {
  id: 'ch5_ranch_final',
  name: 'Back of Beyond Ranch - 1890',
  width: 10,
  height: 8,
  tiles: parseMapTemplate(`
    stars stars mountain mountain forest forest mountain mountain stars stars
    mountain forest path cabin cabin cabin path telescope forest mountain
    forest vineyard path door hearth window path path forest forest
    grass vineyard path piano path path gazebo gazebo path grass
    water water path path fountain path gazebo gazebo deck grass
    water water dock path path path path path deck grass
    water water water path path path path trail trail grass
    water water water water path trail trail trail lookout rock
  `),
  spawnPoint: { x: 3, y: 3 },
  interactionPoints: [
    { position: { x: 3, y: 2 }, dialogueId: 'ch5_cabin_door', icon: '🚪' },
    { position: { x: 4, y: 2 }, dialogueId: 'ch5_hearth', icon: '🔥' },
    { position: { x: 3, y: 3 }, dialogueId: 'ch5_piano', icon: '🎹' },
    { position: { x: 7, y: 1 }, dialogueId: 'ch5_telescope', icon: '🔭' },
    { position: { x: 1, y: 2 }, dialogueId: 'ch5_vineyard', icon: '🍇' },
    { position: { x: 6, y: 3 }, dialogueId: 'ch5_gazebo', icon: '🏕️' },
    { position: { x: 4, y: 4 }, dialogueId: 'ch5_fountain', icon: '⛲' },
    { position: { x: 8, y: 4 }, dialogueId: 'ch5_deck', icon: '🌅' },
    { position: { x: 2, y: 5 }, dialogueId: 'ch5_dock', icon: '🛶' },
    { position: { x: 0, y: 0 }, dialogueId: 'ch5_stars', icon: '⭐' },
    { position: { x: 1, y: 5 }, dialogueId: 'ch5_time_capsule', icon: '🌳' },  // Easter egg - time capsule under oak
    { position: { x: 8, y: 7 }, dialogueId: 'ch5_lookout', icon: '👁️' },
    { position: { x: 7, y: 6 }, dialogueId: 'ch5_trail', icon: '🥾' },
  ],
  exits: [],
}

// ============================================
// DIALOGUE NODES
// ============================================

export const dialogues: Record<string, DialogueNode> = {
  // Chapter 1 Introduction
  ch1_intro: {
    id: 'ch1_intro',
    speaker: 'narrator',
    text: 'The year is 1852. Word has spread across the nation of gold in the California hills. Young Tobias, barely twenty years old, sets out from Missouri with nothing but dreams and determination.',
    nextNode: 'ch1_intro_2',
  },
  ch1_intro_2: {
    id: 'ch1_intro_2',
    speaker: 'tobias',
    text: "I've heard tales of men finding fortunes in a single day. Ma says I'm a fool, but I know there's something out there waiting for me.",
    nextNode: 'ch1_intro_3',
  },
  ch1_intro_3: {
    id: 'ch1_intro_3',
    speaker: 'narrator',
    text: 'Explore the trail ahead. Talk to the wagon master, rest by the campfire, and read the signpost to learn what lies ahead. Use arrow keys or tap to move.',
  },

  // Wagon interaction
  ch1_wagon: {
    id: 'ch1_wagon',
    speaker: 'wagon_master',
    text: "You there! Young fella! We're making good time, but the river ahead is running high from spring melt. Best prepare yourself.",
    choices: [
      {
        text: 'Ask about the river crossing',
        nextNode: 'ch1_wagon_river',
        effect: { stat: 'wisdom', change: 1 },
        giveItem: { id: 'river_map', name: 'River Map', icon: '🗺️', description: 'A crude map showing the safer downstream crossing' }
      },
      {
        text: "I'll figure it out myself",
        nextNode: 'ch1_wagon_dismiss',
        effect: { stat: 'luck', change: 1 }
      },
    ],
  },
  ch1_wagon_river: {
    id: 'ch1_wagon_river',
    speaker: 'wagon_master',
    text: "Smart lad. Here - take this map. Shows a calmer crossing downstream. The main ford has claimed too many good folks.",
    nextNode: 'ch1_wagon_advice',
  },
  ch1_wagon_advice: {
    id: 'ch1_wagon_advice',
    speaker: 'wagon_master',
    text: "One more thing - when you get to California, look for a town called Volcano. Strange name, I know. But the folks there know things about the gold country that outsiders never learn. Good luck, son.",
  },
  ch1_wagon_dismiss: {
    id: 'ch1_wagon_dismiss',
    speaker: 'wagon_master',
    text: "Suit yourself. Just remember - fortune favors the prepared, but luck has saved many a foolish soul.",
    nextNode: 'ch1_wagon_gift',
  },
  ch1_wagon_gift: {
    id: 'ch1_wagon_gift',
    speaker: 'wagon_master',
    text: "Ah, take this anyway. My lucky coin. It's brought me this far.",
    giveItem: { id: 'lucky_coin', name: 'Lucky Coin', icon: '🪙', description: "The wagon master's lucky coin - worn smooth by years of handling" },
  },

  // Campfire
  ch1_campfire: {
    id: 'ch1_campfire',
    speaker: 'narrator',
    text: 'The campfire crackles warmly. An old prospector sits nearby, his eyes reflecting years of hardship and wisdom. His clothes are worn, but his eyes are sharp.',
    choices: [
      { text: 'Sit and listen to his story', nextNode: 'ch1_campfire_story', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Ask about the goldfields', nextNode: 'ch1_campfire_gold', effect: { stat: 'trust', change: 1 } },
      { text: 'Ask if he has any spare supplies', nextNode: 'ch1_campfire_supplies' },
      {
        text: '[Prospecting DC 10] Examine the rocks around his camp',
        skillCheck: { skill: 'prospecting', dc: 10, successNode: 'ch1_campfire_prospecting_success', failNode: 'ch1_campfire_prospecting_fail' },
        nextNode: 'ch1_campfire_prospecting_success',  // Fallback, overridden by skillCheck result
      },
      {
        text: '[Diplomacy DC 12] Convince him to share his secret claim location',
        skillCheck: { skill: 'diplomacy', dc: 12, successNode: 'ch1_campfire_diplomacy_success', failNode: 'ch1_campfire_diplomacy_fail' },
        nextNode: 'ch1_campfire_diplomacy_success',
      },
    ],
  },
  ch1_campfire_prospecting_success: {
    id: 'ch1_campfire_prospecting_success',
    speaker: 'old_prospector',
    text: "Well I'll be! You've got an eye for it, boy. See that quartz vein there? That's a good sign. Where there's quartz, there's often color. Take this sample - show it to an assayer when you get to town.",
    giveItem: { id: 'quartz_sample', name: 'Quartz Sample', icon: '💎', description: 'A piece of quartz with visible gold flecks - proof of your prospecting skills' },
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 50,
    choices: [
      { text: 'Sharp eyes come from good teaching. What else can you tell me?', nextNode: 'ch1_campfire' },
      { text: 'Much obliged! Time to hit the trail.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_prospecting_fail: {
    id: 'ch1_campfire_prospecting_fail',
    speaker: 'old_prospector',
    text: "Heh, you thought that was gold? That's just fool's gold, boy - iron pyrite. Shines pretty but ain't worth a nickel. Don't feel bad, most greenhorns make that mistake. You'll learn.",
    effect: { stat: 'wisdom', change: 1 },
    giveXP: 10,
    choices: [
      { text: 'I have much to learn. What else should I know?', nextNode: 'ch1_campfire' },
      { text: 'Thanks for the lesson. I should keep moving.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_diplomacy_success: {
    id: 'ch1_campfire_diplomacy_success',
    speaker: 'old_prospector',
    text: "*He studies you carefully* You remind me of my nephew. Alright, I'll tell you - but keep it quiet. There's a hidden gulch two miles past Angels Camp, where Coyote Creek meets the old mill ruins. That's where I found my best color.",
    giveItem: { id: 'secret_claim_note', name: 'Secret Claim Location', icon: '📝', description: 'Directions to a hidden gold deposit - a prospector\'s most guarded secret' },
    effect: { stat: 'trust', change: 3 },
    giveXP: 75,
    choices: [
      { text: 'I will not betray your trust. Anything more you can share?', nextNode: 'ch1_campfire' },
      { text: 'This means everything. Thank you, friend.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_diplomacy_fail: {
    id: 'ch1_campfire_diplomacy_fail',
    speaker: 'old_prospector',
    text: "*He narrows his eyes* You think I'd give up a claim location to someone I just met? Boy, I've been prospecting since before you were born. Earn my trust first, then maybe we'll talk.",
    effect: { stat: 'trust', change: -1 },
    giveXP: 5,
    choices: [
      { text: 'Fair enough. Can we talk about something else?', nextNode: 'ch1_campfire' },
      { text: 'Understood. Safe travels, old-timer.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_supplies: {
    id: 'ch1_campfire_supplies',
    speaker: 'old_prospector',
    text: "Supplies? Well now, I don't have much, but I've got this coil of rope. It's saved my hide more than once at river crossings. Take it - you'll need it more than me where you're headed.",
    giveItem: { id: 'rope', name: 'Sturdy Rope', icon: '🪢', description: 'A length of strong rope - essential for crossing rivers safely' },
    giveXP: 25,
    choices: [
      { text: 'Thank you! Can I ask something else?', nextNode: 'ch1_campfire' },
      { text: 'This will help. Thank you, old-timer.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_story: {
    id: 'ch1_campfire_story',
    speaker: 'old_prospector',
    text: "Pull up a rock, boy. Let me tell you about the forty-niners...",
    nextNode: 'ch1_campfire_story_2',
  },
  ch1_campfire_story_2: {
    id: 'ch1_campfire_story_2',
    speaker: 'old_prospector',
    text: "I've seen men find fortunes and lose 'em in a week. The gold... it changes people. Saw a preacher murder his brother over a nugget no bigger than my thumb.",
    nextNode: 'ch1_campfire_story_3',
  },
  ch1_campfire_story_3: {
    id: 'ch1_campfire_story_3',
    speaker: 'old_prospector',
    text: "But the land - the land stays true. Find yourself a good claim, boy. One with water and timber. Gold or no gold, that's real wealth.",
    nextNode: 'ch1_campfire_story_4',
  },
  ch1_campfire_story_4: {
    id: 'ch1_campfire_story_4',
    speaker: 'old_prospector',
    text: "Here - take this. A nugget from my first claim. Keep it as a reminder: it ain't about getting rich. It's about finding your place.",
    giveItem: { id: 'first_nugget', name: 'First Nugget', icon: '✨', description: 'A small gold nugget from the old prospector - your first taste of California gold' },
    choices: [
      { text: 'Thank you. Can I ask something else?', nextNode: 'ch1_campfire' },
      { text: 'Thank you for everything. I should get moving.', nextNode: 'ch1_campfire_farewell' },
    ],
  },
  ch1_campfire_farewell: {
    id: 'ch1_campfire_farewell',
    speaker: 'old_prospector',
    text: "Safe travels, son. May your pan always show color and your luck hold true.",
  },
  ch1_campfire_gold: {
    id: 'ch1_campfire_gold',
    speaker: 'old_prospector',
    text: "Everyone asks about the gold. Let me tell you a secret...",
    nextNode: 'ch1_campfire_gold_2',
  },
  ch1_campfire_gold_2: {
    id: 'ch1_campfire_gold_2',
    speaker: 'old_prospector',
    text: "The real mother lodes ain't in the main camps. They're in the foothills, where the creeks run quiet. Amador County... Calaveras County... that's where the smart ones go.",
    nextNode: 'ch1_campfire_gold_3',
  },
  ch1_campfire_gold_3: {
    id: 'ch1_campfire_gold_3',
    speaker: 'old_prospector',
    text: "There's a place called Angels Camp. Named for angels, but filled with devils and dreamers. And frogs - the biggest jumping frogs you ever saw. Strange place. Magical, some say.",
    nextNode: 'ch1_campfire_gold_4',
  },
  ch1_campfire_gold_4: {
    id: 'ch1_campfire_gold_4',
    speaker: 'old_prospector',
    text: "Take this map. Drew it myself. Shows the old trails the big outfits don't use. Follow the creeks, boy. The gold follows the water.",
    giveItem: { id: 'prospector_map', name: "Prospector's Map", icon: '📜', description: 'A hand-drawn map showing secret trails and promising creek beds' },
    choices: [
      { text: 'This is invaluable! Anything else you can share?', nextNode: 'ch1_campfire' },
      { text: 'I owe you one, old-timer. Safe travels.', nextNode: 'ch1_campfire_farewell' },
    ],
  },

  // Signpost
  ch1_sign: {
    id: 'ch1_sign',
    speaker: 'narrator',
    text: '"CALIFORNIA OR BUST" reads the weathered sign. Below it, carved into the wood: "River crossing 1 mile. Beware swift currents. Many have perished."',
    nextNode: 'ch1_sign_2',
  },
  ch1_sign_2: {
    id: 'ch1_sign_2',
    speaker: 'narrator',
    text: 'Someone has scratched underneath: "Worth every risk." Further down, in different handwriting: "Tell my family I tried. -J.W."',
    nextNode: 'ch1_sign_3',
  },
  ch1_sign_3: {
    id: 'ch1_sign_3',
    speaker: 'tobias',
    text: "So many have come before me. Some made it, some didn't. But I will. I have to. There's nothing left for me back East.",
  },

  // Bridge
  ch1_bridge: {
    id: 'ch1_bridge',
    speaker: 'narrator',
    text: 'A makeshift bridge spans a narrow part of the stream. It looks sturdy enough, though the rushing water below is dizzying.',
    nextNode: 'ch1_bridge_2',
  },
  ch1_bridge_2: {
    id: 'ch1_bridge_2',
    speaker: 'narrator',
    text: 'Wedged between the planks, you spot a glint of metal. Someone dropped something here in their haste to cross.',
    choices: [
      {
        text: 'Reach down carefully to retrieve it',
        nextNode: 'ch1_bridge_find',
        effect: { stat: 'luck', change: 1 },
      },
      {
        text: 'Leave it - not worth the risk',
        nextNode: 'ch1_bridge_leave',
        effect: { stat: 'wisdom', change: 1 },
      },
    ],
  },
  ch1_bridge_find: {
    id: 'ch1_bridge_find',
    speaker: 'narrator',
    text: "It's an old compass, still working! The initials \"J.W.\" are scratched into the back - the same initials from the signpost. This belonged to someone who didn't make it.",
    giveItem: { id: 'old_compass', name: 'Old Compass', icon: '🧭', description: "J.W.'s compass - a reminder to always know which way is home" },
  },
  ch1_bridge_leave: {
    id: 'ch1_bridge_leave',
    speaker: 'tobias',
    text: "Some things are best left where they lie. Whatever story that belonged to, it's not mine to take.",
  },

  // Cave exploration
  ch1_cave: {
    id: 'ch1_cave',
    speaker: 'narrator',
    text: 'A dark opening in the rocky hillside. Scratch marks on the stone suggest animals once sheltered here. A faint glint catches your eye deeper inside.',
    choices: [
      { text: 'Venture inside carefully', nextNode: 'ch1_cave_enter' },
      { text: 'Better not risk it', nextNode: 'ch1_cave_leave' },
    ],
  },
  ch1_cave_enter: {
    id: 'ch1_cave_enter',
    speaker: 'narrator',
    text: 'You squeeze through the narrow entrance. Your eyes adjust to the dim light. In a corner, half-buried in dust, lies an old tin box.',
    nextNode: 'ch1_cave_box',
  },
  ch1_cave_box: {
    id: 'ch1_cave_box',
    speaker: 'narrator',
    text: 'Inside the box: a handful of coins and a worn leather journal. The last entry reads: "If you find this, I hope you have better fortune than I did. The gold is real, but the cost is higher than you know."',
    giveItem: { id: 'pioneers_journal', name: "Pioneer's Journal", icon: '📔', description: 'A weathered journal from a traveler who came before - filled with notes about the trail ahead and 5 gold coins!' },
    effect: { stat: 'gold', change: 5 },
    giveXP: 15,
  },
  ch1_cave_leave: {
    id: 'ch1_cave_leave',
    speaker: 'tobias',
    text: "Dark caves and unknown dangers don't mix well with a journey ahead. I'll stick to the trail.",
    effect: { stat: 'luck', change: 1 },
  },

  // The big choice - river crossing
  ch1_river_choice: {
    id: 'ch1_river_choice',
    speaker: 'narrator',
    text: 'The river runs swift and cold. The wagon master says to ford here with the group, but you spot what might be a calmer crossing downstream through the trees.',
    choices: [
      { text: 'Ford here with the group (safe)', nextNode: 'ch1_ford_group', effect: { stat: 'trust', change: 2 } },
      { text: 'Suggest the downstream crossing (risky)', nextNode: 'ch1_ford_downstream', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Scout ahead alone first', nextNode: 'ch1_ford_scout', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch1_ford_group: {
    id: 'ch1_ford_group',
    speaker: 'narrator',
    text: 'The crossing is harrowing. Two wagons overturn, but no lives are lost. The group respects your steady presence. You arrive in Gold Country weary but together.',
    nextNode: 'ch1_ford_group_2',
  },
  ch1_ford_group_2: {
    id: 'ch1_ford_group_2',
    speaker: 'wagon_master',
    text: "You kept your head when others panicked, son. That's worth more than gold. Take this - a letter of introduction to my cousin in Volcano. He runs the general store. He'll set you up right.",
    giveItem: { id: 'letter_intro', name: 'Letter of Introduction', icon: '✉️', description: 'A letter to the Volcano general store - may unlock special trades' },
    completeObjective: 'river_crossing_complete',
    giveXP: 100,
  },
  ch1_ford_downstream: {
    id: 'ch1_ford_downstream',
    speaker: 'narrator',
    text: 'Your keen eye was right - the downstream crossing proves much safer. The grateful wagon master marks you as someone to watch.',
    nextNode: 'ch1_ford_downstream_2',
  },
  ch1_ford_downstream_2: {
    id: 'ch1_ford_downstream_2',
    speaker: 'wagon_master',
    text: "You've got the instincts of a prospector. Here - my grandfather's gold pan. It's found color in every stream from here to Sacramento. May it serve you as well.",
    giveItem: { id: 'lucky_pan', name: 'Lucky Gold Pan', icon: '🥘', description: "The wagon master's heirloom pan - said to find gold where others find nothing" },
    completeObjective: 'river_crossing_complete',
    giveXP: 150,
  },
  ch1_ford_scout: {
    id: 'ch1_ford_scout',
    speaker: 'narrator',
    text: 'Scouting ahead, you discover not only the safe crossing, but an abandoned camp with useful supplies. Fortune smiles on the bold - or perhaps the lucky.',
    nextNode: 'ch1_ford_scout_2',
  },
  ch1_ford_scout_2: {
    id: 'ch1_ford_scout_2',
    speaker: 'narrator',
    text: 'Among the supplies, you find a worn journal. The final entry reads: "The gold is real. Carson Hill. Look for the quartz veins that run northeast." The rest is water-damaged.',
    giveItem: { id: 'miners_journal', name: "Miner's Journal", icon: '📔', description: 'A journal with tantalizing hints about Carson Hill gold deposits' },
    completeObjective: 'river_crossing_complete',
    giveXP: 200,
  },

  // Chapter 4 - Ranch locations
  ch4_cabin_door: {
    id: 'ch4_cabin_door',
    speaker: 'narrator',
    text: 'The cabin Tobias built still stands today, though much expanded. What started as a one-room prospector\'s shelter has become a welcoming retreat for modern travelers.',
  },
  ch4_hottub: {
    id: 'ch4_hottub',
    speaker: 'narrator',
    text: 'The natural hot springs Tobias discovered still bubble up here. "The earth\'s own treasure," he wrote in his journal. Today, guests relax under the same stars Tobias watched.',
  },
  ch4_dock: {
    id: 'ch4_dock',
    speaker: 'narrator',
    text: 'The lake was Tobias\'s secret fishing spot. He claimed the trout here were the finest in the county. The dock is newer, but the view is timeless.',
  },
  ch4_firepit: {
    id: 'ch4_firepit',
    speaker: 'narrator',
    text: 'Many nights Tobias sat by fires just like this, planning his next venture. Some say he buried something precious near the fire pit... but that might just be legend.',
  },
  ch4_deck: {
    id: 'ch4_deck',
    speaker: 'narrator',
    text: 'The mountain views stretch endlessly. Tobias chose this spot specifically for this panorama. "A man needs to see the horizon," he wrote. "Reminds him how much world there is."',
  },
  ch4_lookout: {
    id: 'ch4_lookout',
    speaker: 'narrator',
    text: 'From here, Tobias could see anyone approaching for miles. Useful for a man rumored to have hidden a fortune. Today, it\'s the perfect stargazing spot.',
  },

  // Chapter 4 - Ranch Building Locations
  ch4_barn: {
    id: 'ch4_barn',
    speaker: 'narrator',
    text: 'The barn rises solid against the sky - hand-hewn timber fitted with care. Tobias built it to last centuries, and so it has.',
    choices: [
      { text: 'Examine the construction', nextNode: 'ch4_barn_examine', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Check on the livestock', nextNode: 'ch4_barn_livestock', effect: { stat: 'trust', change: 1 } },
      { text: '[Appraise DC 10] Study the joinery techniques', skillCheck: { skill: 'appraise', dc: 10, successNode: 'ch4_barn_craft', failNode: 'ch4_barn_admire' }, nextNode: 'ch4_barn_craft' },
    ],
  },
  ch4_barn_examine: {
    id: 'ch4_barn_examine',
    speaker: 'narrator',
    text: 'Cedar planks, still fragrant after decades. The roof is hand-split shakes, overlapping perfectly. Tobias learned carpentry from Norwegian immigrants on the trail west.',
    giveXP: 15,
  },
  ch4_barn_livestock: {
    id: 'ch4_barn_livestock',
    speaker: 'narrator',
    text: 'The horses nicker softly. Two sturdy draft horses and a spirited mustang that Tobias broke himself. The chickens cluck from their roost above.',
    giveItem: { id: 'fresh_eggs', name: 'Fresh Eggs', icon: '🥚', description: 'Fresh eggs from the barn - simple treasures of homestead life' },
    giveXP: 10,
  },
  ch4_barn_craft: {
    id: 'ch4_barn_craft',
    speaker: 'narrator',
    text: 'Mortise and tenon joints, wooden pegs instead of nails. This is master craftsmanship. You learn techniques that could help you build anything.',
    giveItem: { id: 'carpentry_notes', name: 'Carpentry Notes', icon: '📐', description: 'Notes on traditional joinery - practical wisdom from the frontier' },
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 40,
  },
  ch4_barn_admire: {
    id: 'ch4_barn_admire',
    speaker: 'narrator',
    text: 'The craftsmanship is impressive, but its finer points elude you. Perhaps with more experience in building...',
    giveXP: 10,
  },

  ch4_corral: {
    id: 'ch4_corral',
    speaker: 'narrator',
    text: 'The corral holds three fine horses - descendants of the mustangs Tobias captured and trained himself. They watch you with intelligent eyes.',
    choices: [
      { text: 'Approach the horses gently', nextNode: 'ch4_corral_approach', effect: { stat: 'trust', change: 1 } },
      { text: '[Animal Handling DC 11] Bond with the lead mare', skillCheck: { skill: 'animal_handling', dc: 11, successNode: 'ch4_corral_bond', failNode: 'ch4_corral_shy' }, nextNode: 'ch4_corral_bond' },
      { text: 'Observe from a distance', nextNode: 'ch4_corral_observe', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch4_corral_approach: {
    id: 'ch4_corral_approach',
    speaker: 'narrator',
    text: 'The horses accept your presence calmly. The oldest mare, Storm Cloud, has a blaze shaped like a lightning bolt. Tobias named her after a particularly memorable night crossing the Rockies.',
    giveXP: 15,
  },
  ch4_corral_bond: {
    id: 'ch4_corral_bond',
    speaker: 'narrator',
    text: 'Storm Cloud nuzzles your hand, recognizing a kindred spirit. She shows you a loose board on the fence - behind it, a leather pouch Tobias hid long ago.',
    giveItem: { id: 'hidden_pouch', name: 'Hidden Leather Pouch', icon: '👝', description: 'Contains old coins and a note: "For the worthy rider who earns Storm Cloud\'s trust"' },
    effect: { stat: 'gold', change: 15 },
    giveXP: 50,
  },
  ch4_corral_shy: {
    id: 'ch4_corral_shy',
    speaker: 'narrator',
    text: 'The mare tosses her head and moves away. She doesn\'t trust easily - just like her first owner.',
    giveXP: 10,
  },
  ch4_corral_observe: {
    id: 'ch4_corral_observe',
    speaker: 'narrator',
    text: 'Watching the horses interact reveals their hierarchy and personalities. Animals, like people, have their own society and politics.',
    giveXP: 15,
  },

  ch4_garden: {
    id: 'ch4_garden',
    speaker: 'narrator',
    text: 'The garden overflows with vegetables and herbs - squash, tomatoes, corn, beans. The "Three Sisters" grow together as the Miwok taught Tobias.',
    choices: [
      { text: 'Harvest some vegetables', nextNode: 'ch4_garden_harvest' },
      { text: 'Study the planting arrangement', nextNode: 'ch4_garden_study', effect: { stat: 'wisdom', change: 2 } },
      { text: '[Foraging DC 9] Identify the medicinal herbs', skillCheck: { skill: 'foraging', dc: 9, successNode: 'ch4_garden_herbs', failNode: 'ch4_garden_basic' }, nextNode: 'ch4_garden_herbs' },
    ],
  },
  ch4_garden_harvest: {
    id: 'ch4_garden_harvest',
    speaker: 'narrator',
    text: 'You gather ripe tomatoes and golden squash. The simple act connects you to the land in a way that finding gold never could.',
    giveItem: { id: 'garden_harvest', name: 'Fresh Harvest', icon: '🍅', description: 'Vegetables from the ranch garden - wholesome food for honest work' },
    giveXP: 10,
  },
  ch4_garden_study: {
    id: 'ch4_garden_study',
    speaker: 'narrator',
    text: 'Corn grows tall, providing shade for squash vines below. Beans climb the corn stalks, fixing nitrogen in the soil. Each plant helps the others - a lesson in cooperation.',
    giveXP: 25,
  },
  ch4_garden_herbs: {
    id: 'ch4_garden_herbs',
    speaker: 'narrator',
    text: 'Yarrow for wounds, chamomile for sleep, willow bark for pain. The edge of the garden is a complete frontier pharmacy. Tobias\'s wife Mary was part Miwok - she knew these secrets.',
    giveItem: { id: 'medicinal_herbs', name: 'Medicinal Herb Bundle', icon: '🌿', description: 'Traditional healing herbs - knowledge passed down through generations' },
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 40,
  },
  ch4_garden_basic: {
    id: 'ch4_garden_basic',
    speaker: 'narrator',
    text: 'The herbs look like ordinary plants to you. Perhaps someone more versed in wilderness lore could identify them.',
    giveXP: 10,
  },

  ch4_windmill: {
    id: 'ch4_windmill',
    speaker: 'narrator',
    text: 'The windmill creaks rhythmically, its wooden blades turning in the mountain breeze. Water flows steadily into a stone trough - modern technology meets ancient need.',
    choices: [
      { text: 'Watch the mechanism work', nextNode: 'ch4_windmill_watch', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Examine the construction', nextNode: 'ch4_windmill_examine' },
      { text: '[Blacksmith DC 12] Understand the engineering', skillCheck: { skill: 'craft_blacksmith', dc: 12, successNode: 'ch4_windmill_engineer', failNode: 'ch4_windmill_complex' }, nextNode: 'ch4_windmill_engineer' },
    ],
  },
  ch4_windmill_watch: {
    id: 'ch4_windmill_watch',
    speaker: 'narrator',
    text: 'The windmill harnesses invisible forces to do visible work. Tobias saw one in Texas during his journey west and spent two years learning to build his own.',
    giveXP: 15,
  },
  ch4_windmill_examine: {
    id: 'ch4_windmill_examine',
    speaker: 'narrator',
    text: 'The blades are canvas stretched over oak frames. The central shaft connects to a pump mechanism that draws water from a deep well. Elegant and practical.',
    giveXP: 15,
  },
  ch4_windmill_engineer: {
    id: 'ch4_windmill_engineer',
    speaker: 'narrator',
    text: 'Brilliant! The gear ratio multiplies the slow rotation into rapid pumping action. The angled blades self-regulate in high winds. Carved into the base: "Patent Pending - T. Garrett 1865"',
    giveItem: { id: 'windmill_plans', name: 'Windmill Design Notes', icon: '📋', description: 'Tobias\'s original windmill designs - potentially valuable as historical documents' },
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 50,
  },
  ch4_windmill_complex: {
    id: 'ch4_windmill_complex',
    speaker: 'narrator',
    text: 'The mechanical complexity defeats you. Tobias was clearly more than just a prospector - he was an inventor too.',
    giveXP: 10,
  },

  ch4_pond: {
    id: 'ch4_pond',
    speaker: 'narrator',
    text: 'The pond sparkles in the sunlight, fed by a natural spring. Ducks paddle lazily while dragonflies skim the surface. A perfect oasis.',
    choices: [
      { text: 'Rest by the water', nextNode: 'ch4_pond_rest', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Try fishing', nextNode: 'ch4_pond_fish', effect: { stat: 'luck', change: 1 } },
      { text: 'Search the reeds', nextNode: 'ch4_pond_search' },
    ],
  },
  ch4_pond_rest: {
    id: 'ch4_pond_rest',
    speaker: 'narrator',
    text: 'The sound of water and birdsong soothes your soul. Tobias wrote in his journal: "Found peace by the pond today. The gold was never the treasure - this is."',
    giveXP: 20,
  },
  ch4_pond_fish: {
    id: 'ch4_pond_fish',
    speaker: 'narrator',
    text: 'The trout here are wary but plentiful. After patient waiting, you land a beautiful rainbow - dinner tonight!',
    giveItem: { id: 'rainbow_trout', name: 'Rainbow Trout', icon: '🐟', description: 'A beautiful fish from the ranch pond - proof that patience is its own reward' },
    giveXP: 15,
  },
  ch4_pond_search: {
    id: 'ch4_pond_search',
    speaker: 'narrator',
    text: 'Among the cattails, you find a small waterproof box. Inside: a gold nugget and a note. "For the seeker who looks beyond the obvious. - T.G."',
    giveItem: { id: 'pond_nugget', name: 'Hidden Nugget', icon: '✨', description: 'A gold nugget hidden by Tobias for future treasure hunters' },
    effect: { stat: 'gold', change: 20 },
    giveXP: 35,
  },

  ch4_orchard: {
    id: 'ch4_orchard',
    speaker: 'narrator',
    text: 'The orchard is heavy with fruit - apples, pears, and late peaches. Some of these trees were planted the year Tobias arrived.',
    choices: [
      { text: 'Pick an apple', nextNode: 'ch4_orchard_apple' },
      { text: 'Examine the oldest tree', nextNode: 'ch4_orchard_old', effect: { stat: 'wisdom', change: 2 } },
      { text: '[Foraging DC 8] Find the best fruit', skillCheck: { skill: 'foraging', dc: 8, successNode: 'ch4_orchard_best', failNode: 'ch4_orchard_random' }, nextNode: 'ch4_orchard_best' },
    ],
  },
  ch4_orchard_apple: {
    id: 'ch4_orchard_apple',
    speaker: 'narrator',
    text: 'The apple is perfectly ripe - sweet, crisp, and utterly delicious. Simple pleasures are often the best.',
    giveItem: { id: 'perfect_apple', name: 'Perfect Apple', icon: '🍎', description: 'A flawless apple from Tobias\'s orchard - grown with love and time' },
    giveXP: 10,
  },
  ch4_orchard_old: {
    id: 'ch4_orchard_old',
    speaker: 'narrator',
    text: 'The patriarch of the orchard, an ancient apple tree, bears deep carvings: "M + T - 1856" surrounded by a heart. Mary and Tobias. Their love story is written in the bark.',
    giveXP: 30,
  },
  ch4_orchard_best: {
    id: 'ch4_orchard_best',
    speaker: 'narrator',
    text: 'Your trained eye finds fruit at peak ripeness. You gather a basket of the finest - some for eating, some for cider.',
    giveItem: { id: 'fruit_basket', name: 'Orchard Basket', icon: '🧺', description: 'A selection of the finest fruits - nature\'s bounty at its best' },
    giveXP: 25,
  },
  ch4_orchard_random: {
    id: 'ch4_orchard_random',
    speaker: 'narrator',
    text: 'You pick several pieces, though you\'re not sure which are the ripest. Still delicious - just some more so than others.',
    giveXP: 10,
  },

  // ============================================
  // CHAPTER 2 DIALOGUES - Volcano, California
  // ============================================

  ch2_intro: {
    id: 'ch2_intro',
    speaker: 'narrator',
    text: 'California at last! Tobias arrives in Volcano, a boomtown of over 10,000 souls. The St. George Hotel looms ahead, its windows glowing with lantern light.',
    nextNode: 'ch2_intro_2',
  },
  ch2_intro_2: {
    id: 'ch2_intro_2',
    speaker: 'tobias',
    text: "They call this place Volcano because the hills look like craters. Fitting - there's fire in everyone's eyes here. Gold fever.",
    nextNode: 'ch2_intro_3',
  },
  ch2_intro_3: {
    id: 'ch2_intro_3',
    speaker: 'narrator',
    text: 'Explore Volcano to trade for supplies, gather information, and decide your next move. The general store has been operating since the town\'s founding.',
  },

  ch2_hotel: {
    id: 'ch2_hotel',
    speaker: 'narrator',
    text: 'The St. George Hotel stands three stories tall, built of brick to resist the fires that claimed its predecessors. Strange tales surround this place - guests speak of a woman in white on the upper floors.',
    choices: [
      { text: 'Inquire about a room', nextNode: 'ch2_hotel_room', effect: { stat: 'gold', change: -10 } },
      { text: 'Ask about the ghost stories', nextNode: 'ch2_hotel_ghost', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch2_hotel_room: {
    id: 'ch2_hotel_room',
    speaker: 'innkeeper',
    text: "Room's a dollar a night, meals included. Best price in Volcano. Just... don't mind any sounds you hear after midnight. Old building settles, is all.",
  },
  ch2_hotel_ghost: {
    id: 'ch2_hotel_ghost',
    speaker: 'innkeeper',
    text: "Folks say a young woman died here in '53, waiting for her husband to return from the mines. He never did. Some nights, guests see her standing by the window, still watching the trail.",
    nextNode: 'ch2_hotel_ghost_2',
  },
  ch2_hotel_ghost_2: {
    id: 'ch2_hotel_ghost_2',
    speaker: 'narrator',
    text: 'The innkeeper lowers his voice. "And there\'s a gentleman too. Fancy clothes, walks with a cane. Never speaks. Some say he\'s guarding something hidden in these walls."',
  },

  ch2_hotel_door: {
    id: 'ch2_hotel_door',
    speaker: 'narrator',
    text: 'The heavy wooden door bears the carved initials "B.F.G." - the hotel\'s builder, B.F. George, who named it "St. George" to ward off the "demonic Fire Dragon" that had claimed previous hotels on this site.',
  },

  ch2_theatre: {
    id: 'ch2_theatre',
    speaker: 'narrator',
    text: 'The Cobblestone Theatre, built in 1856, hosts traveling performers and local talent. Tonight\'s playbill promises "Dramatic Readings & Songs of the Goldfields."',
    choices: [
      { text: 'Attend the evening show', nextNode: 'ch2_theatre_show', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Talk to the performers backstage', nextNode: 'ch2_theatre_backstage', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch2_theatre_show: {
    id: 'ch2_theatre_show',
    speaker: 'narrator',
    text: 'The performers sing "Oh Susanna" - the unofficial anthem of the forty-niners. The melody stays with you. Something about the notes seems... significant.',
    nextNode: 'ch2_theatre_show_2',
  },
  ch2_theatre_show_2: {
    id: 'ch2_theatre_show_2',
    speaker: 'narrator',
    text: 'After the show, an old musician hands you a tattered sheet of music. "The original notes," he whispers. "Not the version everyone sings. The REAL version. Might mean something someday."',
    giveItem: { id: 'oh_susanna_sheet', name: 'Oh Susanna Sheet Music', icon: '🎵', description: "The original 'Oh Susanna' notes - encoded with something more than music?" },
  },
  ch2_theatre_backstage: {
    id: 'ch2_theatre_backstage',
    speaker: 'actress',
    text: "You want to find gold? Forget the main camps. An old prospector told me about quiet foothills near a place called Carson Hill. Said the rocks there sparkle with quartz that holds pure veins.",
    nextNode: 'ch2_theatre_backstage_2',
  },
  ch2_theatre_backstage_2: {
    id: 'ch2_theatre_backstage_2',
    speaker: 'actress',
    text: "Here - take this rose quartz crystal. The prospector gave it to me, said it came from the richest vein he ever found. Maybe it'll bring you luck.",
    giveItem: { id: 'rose_quartz', name: 'Rose Quartz Crystal', icon: '💎', description: 'A crystal from a legendary vein - said to guide prospectors to gold' },
  },

  ch2_theatre_stage: {
    id: 'ch2_theatre_stage',
    speaker: 'narrator',
    text: 'The stage is set with painted backdrops of mountain vistas. A piano sits in the corner - the same model that would later grace Tobias\'s own cabin.',
  },

  ch2_saloon: {
    id: 'ch2_saloon',
    speaker: 'narrator',
    text: 'The saloon buzzes with miners sharing news and rumors. A poker game in the corner has drawn a crowd. A grizzled prospector eyes you suspiciously from the bar.',
    choices: [
      { text: 'Join the poker game', nextNode: 'ch2_poker', effect: { stat: 'luck', change: 2 } },
      { text: 'Buy a round and listen', nextNode: 'ch2_listen', effect: { stat: 'trust', change: 2 } },
      {
        text: '[Diplomacy] Approach the suspicious prospector',
        nextNode: 'ch2_prospector_talk',
        skillCheck: {
          skill: 'diplomacy',
          dc: 11,
          successNode: 'ch2_prospector_success',
          failNode: 'ch2_prospector_fail',
        },
        giveXP: 40,
        modifyNPC: { npcId: 'grizzled_prospector', attitude: 10, trust: 5 },
      },
    ],
  },
  ch2_prospector_success: {
    id: 'ch2_prospector_success',
    speaker: 'grizzled_prospector',
    text: 'Your honest manner wins him over. "Name\'s Jenkins. Been working these hills for fifteen years. Most newcomers are fools, but you... you\'ve got sense. Let me tell you something valuable..."',
    nextNode: 'ch2_prospector_secret',
    modifyNPC: { npcId: 'grizzled_prospector', attitude: 15, trust: 10, fact: 'trusted_newcomer' },
    npcId: 'grizzled_prospector',
    // If player returns after being trusted, Jenkins remembers
    remembers: 'trusted_newcomer',
    remembersText: 'Jenkins nods as you approach. "Good to see you again, friend. Been thinking about what I told you. If you\'re heading to Angels Camp, be careful - claim jumpers have been active lately."',
  },
  ch2_prospector_secret: {
    id: 'ch2_prospector_secret',
    speaker: 'grizzled_prospector',
    npcId: 'grizzled_prospector',
    text: '"Carson Hill ain\'t the only rich spot. There\'s a gulch near Angels Camp that nobody\'s touched. Too superstitious - say it\'s haunted. But I know better. Ghosts don\'t scare gold away."',
    giveItem: { id: 'haunted_gulch_map', name: 'Haunted Gulch Map', icon: '👻', description: 'A map to a supposedly haunted - and untouched - gold gulch' },
    giveXP: 75,
    // Dynamic dialogue based on NPC mood
    variations: [
      {
        mood: 'friendly' as NPCMood,
        text: '"You\'ve earned my trust, friend. Carson Hill ain\'t the only rich spot. There\'s a gulch near Angels Camp that nobody\'s touched. Locals say it\'s haunted, but between you and me, that\'s just a story to keep folks away. Here - take this map."',
      },
      {
        mood: 'allied' as NPCMood,
        text: '"Listen close, partner - I\'m sharing something I ain\'t told another soul. There\'s a gulch near Angels Camp, richer than any claim I\'ve seen. Folks think it\'s haunted. That works in your favor. Take this map and make your fortune - you\'ve earned it."',
      },
    ],
  },
  ch2_prospector_fail: {
    id: 'ch2_prospector_fail',
    speaker: 'grizzled_prospector',
    npcId: 'grizzled_prospector',
    text: '"Another greenhorn looking for easy gold. Don\'t waste my time, boy. Come back when you\'ve got some dirt under your nails and sense in your head."',
    modifyNPC: { npcId: 'grizzled_prospector', attitude: -10 },
    // Different reactions based on how much he dislikes you
    variations: [
      {
        mood: 'hostile' as NPCMood,
        text: 'Jenkins slams his glass down. "You again? I told you to get lost! One more word and we\'ll have trouble." He reaches for something under his coat.',
      },
      {
        mood: 'unfriendly' as NPCMood,
        text: '"Still here? I\'ve got nothing to say to you. Every fool who comes west thinks they\'ll strike it rich. Most end up feeding the coyotes. Don\'t expect my help."',
      },
    ],
  },
  ch2_poker: {
    id: 'ch2_poker',
    speaker: 'narrator',
    text: 'Luck is with you tonight. You win a mule, three pickaxes, and most valuably - a hand-drawn map showing claims near Mokelumne Hill.',
    nextNode: 'ch2_poker_2',
  },
  ch2_poker_2: {
    id: 'ch2_poker_2',
    speaker: 'gambler',
    text: "Well played, stranger. Take this claim map - it cost me dear, but you've earned it. The X marks a spot no one's checked yet. Could be nothing. Could be everything.",
    giveItem: { id: 'claim_map', name: 'Claim Map', icon: '🗺️', description: 'A gambler\'s map marking unclaimed territory near Mokelumne Hill' },
  },
  ch2_listen: {
    id: 'ch2_listen',
    speaker: 'miner',
    text: "Word is, they found a 195-pound nugget over at Carson Hill. Biggest in the whole territory. That hillside is crawling with prospectors now, but there's other veins, if you know where to look...",
    nextNode: 'ch2_listen_2',
  },
  ch2_listen_2: {
    id: 'ch2_listen_2',
    speaker: 'miner',
    text: "You seem like a good sort. Here - a sample from my claim. Pure gold dust. Consider it payment for listening to an old miner's tales. Now you know what real California gold looks like.",
    giveItem: { id: 'gold_dust_sample', name: 'Gold Dust Sample', icon: '✨', description: 'A vial of pure gold dust - proof that fortunes await in these hills' },
  },

  ch2_well: {
    id: 'ch2_well',
    speaker: 'narrator',
    text: 'The town well provides clean water - precious in any mining camp. An old timer sits on the stone edge, watching the world go by.',
    choices: [
      { text: 'Ask about good claims', nextNode: 'ch2_well_claims', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Share news from the trail', nextNode: 'ch2_well_news', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch2_well_claims: {
    id: 'ch2_well_claims',
    speaker: 'old_timer',
    text: "Everyone rushes to where gold's already been found. Me? I'd head to Angels Camp. Calaveras County. The creeks there still hold secrets. And the frogs - well, that's another story entirely.",
  },
  ch2_well_news: {
    id: 'ch2_well_news',
    speaker: 'old_timer',
    text: "More folks coming every day. Soon this whole land'll be picked clean. Smart man would stake a claim now, build something lasting. Gold runs out, but good land? That's forever.",
  },

  ch2_clerk: {
    id: 'ch2_clerk',
    speaker: 'clerk',
    text: "Welcome to the oldest general store in Volcano! Been serving miners since '52. What can I get you? Pickaxes, pans, rope, lanterns - we've got it all.",
    choices: [
      { text: 'Buy mining supplies', nextNode: 'ch2_buy_supplies', effect: { stat: 'gold', change: -15 } },
      { text: 'Trade for information', nextNode: 'ch2_trade_info', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch2_buy_supplies: {
    id: 'ch2_buy_supplies',
    speaker: 'clerk',
    text: "Good quality gear. The cheap stuff breaks when you need it most. Here's a tip - follow the Mokelumne River south toward Angels Camp. Quieter claims there.",
  },
  ch2_trade_info: {
    id: 'ch2_trade_info',
    speaker: 'clerk',
    text: "Information, eh? Smart. Here's what I know: George Madeira just built California's first astronomical observatory right here in Volcano. Says he can read fortunes in the stars. Some say the stars themselves point to hidden treasure.",
  },

  ch2_counter: {
    id: 'ch2_counter',
    speaker: 'narrator',
    text: 'The counter is scarred from thousands of transactions - gold dust weighed, supplies tallied, fortunes traded. A sign reads: "No Credit. Gold or Goods Only."',
  },
  ch2_barrel: {
    id: 'ch2_barrel',
    speaker: 'narrator',
    text: 'Barrels of flour, salt, and dried beans line the walls. Each one represents weeks of survival for a determined prospector.',
  },
  ch2_supplies: {
    id: 'ch2_supplies',
    speaker: 'narrator',
    text: 'Crates marked "San Francisco" contain everything from tools to luxury goods. The supply chain from the coast keeps these mountain towns alive.',
  },

  // Volcano - Masonic Lodge
  ch2_lodge: {
    id: 'ch2_lodge',
    speaker: 'narrator',
    text: 'The Masonic Lodge stands apart from the other buildings - its stonework more refined, its windows dark. The square and compass symbol gleams above the door. Few non-Masons have seen what lies within.',
    choices: [
      { text: 'Knock on the door', nextNode: 'ch2_lodge_knock' },
      { text: 'Examine the symbols carved around the entrance', nextNode: 'ch2_lodge_symbols', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch2_lodge_knock: {
    id: 'ch2_lodge_knock',
    speaker: 'mason_guard',
    text: '"The Lodge is for brothers only, friend. Unless..." *He studies you carefully* "...you know the secret handshake. Or bring something of value to the Brotherhood."',
    choices: [
      { text: '[Diplomacy DC 14] "I seek knowledge, not gold"', skillCheck: { skill: 'diplomacy', dc: 14, successNode: 'ch2_lodge_diplomacy_success', failNode: 'ch2_lodge_diplomacy_fail' }, nextNode: 'ch2_lodge_diplomacy_success' },
      { text: 'Leave respectfully', nextNode: 'ch2_lodge_leave' },
    ],
  },
  ch2_lodge_diplomacy_success: {
    id: 'ch2_lodge_diplomacy_success',
    speaker: 'mason_guard',
    text: '*He nods slowly* "A seeker of truth. The Brotherhood respects that. Below our feet lies our greatest secret - a mine we\'ve worked since \'52. The entrance is through the side door. May you find what you seek."',
    unlockExit: 'lodge_secret_unlocked',
    giveXP: 100,
    effect: { stat: 'trust', change: 3 },
  },
  ch2_lodge_diplomacy_fail: {
    id: 'ch2_lodge_diplomacy_fail',
    speaker: 'mason_guard',
    text: '"Fine words, but words alone won\'t open these doors. Return when your reputation precedes you."',
    effect: { stat: 'trust', change: -1 },
  },
  ch2_lodge_leave: {
    id: 'ch2_lodge_leave',
    speaker: 'tobias',
    text: '"Some secrets are better left undisturbed. For now."',
  },
  ch2_lodge_symbols: {
    id: 'ch2_lodge_symbols',
    speaker: 'narrator',
    text: 'The carvings are intricate: a compass, a square, an all-seeing eye, and stranger symbols you don\'t recognize. One depicts what looks like a pickaxe and a deep shaft descending into darkness. Beside the door, barely visible: "1852 - Lux in Tenebris"',
    giveXP: 25,
  },

  // Volcano - Secret Mine Entrance
  ch2_secret_entrance: {
    id: 'ch2_secret_entrance',
    speaker: 'narrator',
    text: 'A heavy iron door, nearly invisible against the stone foundation. The Mason symbol is etched into the metal. If the guard spoke true, this leads to the secret mine beneath the Lodge.',
  },

  // Volcano - Secret Mine Interior
  ch2_mine_gold: {
    id: 'ch2_mine_gold',
    speaker: 'narrator',
    text: 'Glittering veins of gold thread through the rock here - richer than any surface claim you\'ve seen. The Masons have been extracting wealth from this spot for decades. A loose nugget catches your eye.',
    giveItem: { id: 'mason_gold', name: 'Mason Gold Nugget', icon: '✨', description: 'A pure gold nugget from the secret Mason mine - proof of hidden treasures' },
    effect: { stat: 'gold', change: 50 },
    giveXP: 75,
  },
  ch2_mine_quartz: {
    id: 'ch2_mine_quartz',
    speaker: 'narrator',
    text: 'The quartz formations here are spectacular - crystalline structures that seem to glow in your lantern light. This is high-grade ore, the kind prospectors dream of.',
    giveItem: { id: 'mason_quartz', name: 'Crystal Quartz', icon: '💎', description: 'A large, perfect quartz crystal from deep in the Mason mine' },
    giveXP: 50,
  },
  ch2_mine_vein: {
    id: 'ch2_mine_vein',
    speaker: 'narrator',
    text: 'The main vein runs deeper than you can see. The Masons have barely scratched the surface. You understand now why they guard this place so carefully.',
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 40,
  },
  ch2_mine_cart: {
    id: 'ch2_mine_cart',
    speaker: 'narrator',
    text: 'An old mine cart sits on rusted tracks. It\'s been here since the mine opened - a testament to the Lodge\'s long operation. Inside, you find some forgotten gold dust.',
    effect: { stat: 'gold', change: 15 },
    giveXP: 20,
  },
  ch2_mine_deep: {
    id: 'ch2_mine_deep',
    speaker: 'narrator',
    text: 'The darkness here is absolute. Your lantern barely penetrates. Strange sounds echo from below - dripping water, distant tapping. Something tells you this isn\'t the deepest the mine goes...',
    effect: { stat: 'wisdom', change: 1 },
    giveXP: 30,
  },

  // Volcano - Cemetery
  ch2_cemetery: {
    id: 'ch2_cemetery',
    speaker: 'narrator',
    text: 'The old cemetery overlooks the town. Weathered headstones mark the resting places of miners, merchants, and dreamers. One catches your eye: "Here lies J.W. Marshall - He Found Gold, But Not Peace. 1810-1885"',
    choices: [
      { text: 'Pay respects quietly', nextNode: 'ch2_cemetery_respect', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Search for other notable graves', nextNode: 'ch2_cemetery_search' },
    ],
  },
  ch2_cemetery_respect: {
    id: 'ch2_cemetery_respect',
    speaker: 'narrator',
    text: 'The wind whispers through the pines. For a moment, you feel connected to all those who came before - seeking fortune, finding... something else entirely.',
    giveXP: 20,
  },
  ch2_cemetery_search: {
    id: 'ch2_cemetery_search',
    speaker: 'narrator',
    text: 'Another stone reads: "B.F.G. - Builder of the St. George Hotel - May His Spirit Finally Rest." Below, barely legible: "The dragon is slain but its treasure remains." Curious words for a tombstone...',
    giveItem: { id: 'cemetery_clue', name: 'Cemetery Note', icon: '📝', description: 'Notes about the cryptic inscription on the hotel builder\'s grave' },
    giveXP: 35,
  },

  // Volcano - Lantern
  ch2_lantern_main: {
    id: 'ch2_lantern_main',
    speaker: 'narrator',
    text: 'The gas lantern casts a warm glow over the cobblestones. Volcano was one of the first California towns to have street lighting - a mark of its prosperity in the gold rush days.',
    giveXP: 10,
  },

  // ============================================
  // CHAPTER 3 DIALOGUES - Angels Camp
  // ============================================

  ch3_intro: {
    id: 'ch3_intro',
    speaker: 'narrator',
    text: 'Following the Mokelumne River, Tobias arrives in Angels Camp - a rougher, rowdier mining settlement in Calaveras County, named for the skulls Spanish explorers found along the river.',
    nextNode: 'ch3_intro_2',
  },
  ch3_intro_2: {
    id: 'ch3_intro_2',
    speaker: 'tobias',
    text: "This is it. The old timer was right - these hills feel different. The quartz here shimmers like nothing I've seen. My fortune waits somewhere in these rocks.",
    nextNode: 'ch3_intro_3',
  },
  ch3_intro_3: {
    id: 'ch3_intro_3',
    speaker: 'narrator',
    text: 'Explore Angels Camp and Carson Hill to stake your claim. Listen carefully - the locals know secrets about these hills that outsiders never hear.',
  },

  ch3_saloon: {
    id: 'ch3_saloon',
    speaker: 'narrator',
    text: 'The Angels Camp saloon is famous throughout the territory for its tall tales. Miners bet on everything here - cards, arm wrestling, even frog jumping.',
    choices: [
      { text: 'Listen to the storytellers', nextNode: 'ch3_storyteller', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Watch the frog jumping contest', nextNode: 'ch3_frog_contest', effect: { stat: 'luck', change: 1 } },
    ],
  },
  ch3_storyteller: {
    id: 'ch3_storyteller',
    speaker: 'storyteller',
    text: "Let me tell you about Jim Smiley and his celebrated jumping frog Dan'l Webster! That frog could out-jump any critter in Calaveras County... until a stranger filled him with quail shot.",
    nextNode: 'ch3_storyteller_2',
  },
  ch3_storyteller_2: {
    id: 'ch3_storyteller_2',
    speaker: 'storyteller',
    text: "Thirteen years from now, a young writer named Clemens will hear this very tale and make it famous. They'll call him Mark Twain. Here - take this frog charm. For luck.",
    giveItem: { id: 'frog_charm', name: 'Jumping Frog Charm', icon: '🐸', description: 'A bronze frog charm from Angels Camp - a reminder that luck leaps when you least expect it' },
  },
  ch3_frog_contest: {
    id: 'ch3_frog_contest',
    speaker: 'narrator',
    text: 'The miners gather around, cheering as frogs leap across the dirt floor. It seems absurd, but the prize money is real. These men will bet on anything to break the monotony of panning for gold.',
    nextNode: 'ch3_frog_contest_2',
  },
  ch3_frog_contest_2: {
    id: 'ch3_frog_contest_2',
    speaker: 'narrator',
    text: 'You place a small bet on an underdog frog - and win! The coins feel heavier than their worth. Your first real California earnings.',
    giveItem: { id: 'contest_winnings', name: 'Contest Winnings', icon: '🪙', description: 'A small pouch of coins won at the frog jumping contest - your first California money' },
  },

  ch3_saloon_door: {
    id: 'ch3_saloon_door',
    speaker: 'narrator',
    text: 'The swinging doors have seen thousands pass through - dreamers, schemers, and the occasional legend in the making.',
  },

  ch3_claim: {
    id: 'ch3_claim',
    speaker: 'narrator',
    text: 'A weathered claim marker reads "TAKEN - Carson Mining Co." But you notice something the others missed - the rock formation continues beyond the marked boundary, into unclaimed territory.',
    choices: [
      { text: 'Stake a claim nearby', nextNode: 'ch3_stake_claim', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Investigate further first', nextNode: 'ch3_investigate', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch3_stake_claim: {
    id: 'ch3_stake_claim',
    speaker: 'narrator',
    text: 'You plant your stake where the quartz vein seems to lead. Something tells you this ground holds more than anyone suspects.',
  },
  ch3_investigate: {
    id: 'ch3_investigate',
    speaker: 'narrator',
    text: 'Following the natural rock formation, you discover a hidden creek bed - the kind that carries gold dust down from higher elevations. This is the spot.',
  },

  ch3_mine_entrance: {
    id: 'ch3_mine_entrance',
    speaker: 'narrator',
    text: 'An abandoned mine shaft descends into darkness. Timbers creak ominously, but you glimpse something glittering in the depths...',
    choices: [
      {
        text: '[Prospecting] Assess the mine for safety and value',
        nextNode: 'ch3_mine_check',
        skillCheck: {
          skill: 'prospecting',
          dc: 12,
          successNode: 'ch3_mine_success',
          failNode: 'ch3_mine_fail',
        },
        giveXP: 50,
      },
      {
        text: '[Wilderness Survival] Check for danger signs',
        nextNode: 'ch3_mine_survival_check',
        skillCheck: {
          skill: 'wilderness_survival',
          dc: 10,
          successNode: 'ch3_mine_safe_path',
          failNode: 'ch3_mine_danger',
        },
        giveXP: 30,
      },
      {
        text: 'Leave it alone - too risky',
        nextNode: 'ch3_mine_leave',
        effect: { stat: 'wisdom', change: 1 },
      },
    ],
  },
  ch3_mine_success: {
    id: 'ch3_mine_success',
    speaker: 'narrator',
    text: 'Your trained eye spots it immediately - the rock structure is stable and the glittering you see is gold-bearing quartz. This mine was abandoned prematurely by fools who gave up too soon!',
    nextNode: 'ch3_mine_treasure',
  },
  ch3_mine_treasure: {
    id: 'ch3_mine_treasure',
    speaker: 'tobias',
    text: "These lazy prospectors missed the real vein. It runs deeper, following the water table. I'll stake my claim right here.",
    giveItem: { id: 'mine_deed', name: 'Mine Claim Deed', icon: '📜', description: 'Legal claim to an abandoned mine with untapped gold reserves' },
    giveXP: 100,
  },
  ch3_mine_fail: {
    id: 'ch3_mine_fail',
    speaker: 'narrator',
    text: 'The rock formations confuse you. Is that gold or just pyrite? The assessment proves inconclusive, but you mark the location for later investigation with better equipment.',
    giveXP: 15,  // Consolation XP for trying
  },
  ch3_mine_safe_path: {
    id: 'ch3_mine_safe_path',
    speaker: 'narrator',
    text: 'Your wilderness instincts serve you well. You spot the subtle signs - dry timber is safe, wet timber rots. The left tunnel shows dry supports. You proceed carefully...',
    nextNode: 'ch3_mine_find_cache',
  },
  ch3_mine_find_cache: {
    id: 'ch3_mine_find_cache',
    speaker: 'narrator',
    text: 'Hidden behind a loose rock, you discover a prospector\'s cache - tools, supplies, and a journal describing rich deposits further up the mountain!',
    giveItem: { id: 'prospector_journal', name: "Prospector's Journal", icon: '📔', description: 'Detailed notes about rich gold deposits in the higher elevations' },
    giveXP: 75,
  },
  ch3_mine_danger: {
    id: 'ch3_mine_danger',
    speaker: 'narrator',
    text: 'You miss the warning signs and step on a rotted timber. It gives way, but you catch yourself just in time. That was close - perhaps more training in wilderness survival would serve you well.',
    giveXP: 10,  // Learning from mistakes
  },
  ch3_mine_leave: {
    id: 'ch3_mine_leave',
    speaker: 'tobias',
    text: "Discretion is the better part of valor. I'll find gold another way - one that doesn't involve collapsing mines.",
  },

  ch3_frog: {
    id: 'ch3_frog',
    speaker: 'narrator',
    text: 'A large bullfrog sits on a rock, watching you with ancient eyes. The locals say frogs bring luck to prospectors who treat the land with respect.',
    choices: [
      { text: 'Leave a small offering', nextNode: 'ch3_frog_offering', effect: { stat: 'luck', change: 3 } },
      { text: 'Tip your hat and move on', nextNode: 'ch3_frog_respect', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch3_frog_offering: {
    id: 'ch3_frog_offering',
    speaker: 'narrator',
    text: 'You leave a small gold nugget near the frog. It croaks once, then hops toward the hillside - straight toward an outcropping you hadn\'t noticed. Pure quartz, shot through with gold.',
  },
  ch3_frog_respect: {
    id: 'ch3_frog_respect',
    speaker: 'narrator',
    text: 'The frog seems to nod. Superstition? Perhaps. But in gold country, wise men respect the old ways.',
  },

  ch3_sign: {
    id: 'ch3_sign',
    speaker: 'narrator',
    text: '"CALAVERAS COUNTY - Est. 1850. Population: Growing Daily. Warning: Claim jumpers will be dealt with harshly." Below, someone has carved: "The hills have eyes. And ears. And gold."',
  },

  ch3_gold_vein: {
    id: 'ch3_gold_vein',
    speaker: 'narrator',
    text: 'High on the mountainside, you find it - a vein of gold-bearing quartz that others have missed. This is the mother lode the old prospector spoke of.',
    nextNode: 'ch3_gold_vein_2',
  },
  ch3_gold_vein_2: {
    id: 'ch3_gold_vein_2',
    speaker: 'tobias',
    text: "This is it. I can feel it in my bones. This vein runs deep - enough to build a life on. Enough to build a legacy.",
    giveItem: { id: 'mother_lode_sample', name: 'Mother Lode Sample', icon: '🥇', description: 'A chunk of gold-bearing quartz from your first major discovery' },
  },
  ch3_quartz: {
    id: 'ch3_quartz',
    speaker: 'narrator',
    text: 'The quartz here is exceptional - clear crystals shot through with veins of pure gold. Carson Hill yielded a 195-pound nugget. Your claim may hold treasures just as grand.',
    nextNode: 'ch3_quartz_2',
  },
  ch3_quartz_2: {
    id: 'ch3_quartz_2',
    speaker: 'narrator',
    text: 'You carefully extract a pristine crystal, perfectly formed. The gold within catches the sunlight like captured fire.',
    giveItem: { id: 'perfect_crystal', name: 'Perfect Crystal', icon: '💎', description: 'A flawless gold-veined quartz crystal - nature\'s masterpiece' },
  },
  ch3_secret_vein: {
    id: 'ch3_secret_vein',
    speaker: 'narrator',
    text: 'Behind a waterfall, hidden from casual observation, you discover the secret vein that will fund your legacy. Enough gold to build a ranch, start a family, and leave something for generations to come.',
    nextNode: 'ch3_secret_vein_2',
  },
  ch3_secret_vein_2: {
    id: 'ch3_secret_vein_2',
    speaker: 'tobias',
    text: "I know exactly where to build. High in the foothills, where the deer run golden at sunset. I'll call it Back of Beyond - because that's where dreams become real.",
  },

  // ============================================================
  // SAMUEL CLEMENS (MARK TWAIN) - Dynamic Encounter System
  // A living, breathing literary legend who adapts to the player
  // ============================================================

  ch3_twain_statue: {
    id: 'ch3_twain_statue',
    speaker: 'narrator',
    text: 'Near the town square, you notice something peculiar - a young man with a wild shock of auburn hair scribbling furiously in a notebook. His sharp eyes miss nothing, and his mustache twitches with suppressed amusement at the passing parade of miners, merchants, and dreamers.',
    nextNode: 'ch3_twain_intro',
  },
  ch3_twain_intro: {
    id: 'ch3_twain_intro',
    speaker: 'tobias',
    text: "That fellow's been watching everyone like a hawk all morning. Seems more interested in stories than gold. Odd profession in a mining camp, wouldn't you say?",
    choices: [
      { text: 'Approach the mysterious writer', nextNode: 'ch3_twain_approach' },
      { text: 'Observe from a distance first', nextNode: 'ch3_twain_observe', effect: { stat: 'wisdom', change: 1 } },
      { text: '[Gather Info DC 10] Ask locals about him', skillCheck: { skill: 'gather_info', dc: 10, successNode: 'ch3_twain_intel', failNode: 'ch3_twain_approach' }, nextNode: 'ch3_twain_intel' },
    ],
  },
  ch3_twain_observe: {
    id: 'ch3_twain_observe',
    speaker: 'narrator',
    text: 'You watch as he captures a heated argument between two miners with rapid strokes of his pen. His expression shifts from sardonic to sympathetic as the story unfolds. When one miner storms off, the writer catches your eye and tips an imaginary hat.',
    giveXP: 10,
    nextNode: 'ch3_twain_beckons',
  },
  ch3_twain_beckons: {
    id: 'ch3_twain_beckons',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"I see a fellow observer of the human comedy! Come, join me. I find that those who watch before they speak often have the most interesting things to say - or the most dangerous secrets to hide."',
    choices: [
      { text: 'Accept the invitation', nextNode: 'ch3_twain_conversation_start' },
      { text: 'Ask what he\'s writing', nextNode: 'ch3_twain_writing' },
      { text: 'Ask if he\'s dangerous', nextNode: 'ch3_twain_dangerous', effect: { stat: 'luck', change: 1 } },
    ],
  },
  ch3_twain_intel: {
    id: 'ch3_twain_intel',
    speaker: 'miner',
    text: '"That\'s Sam Clemens - came from Missouri way. Writes for newspapers back East. Failed at prospecting, failed at piloting riverboats, but Lord can he spin a yarn. They say he\'s collecting stories like others collect gold."',
    giveXP: 20,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch3_twain_approach_informed',
  },
  ch3_twain_approach: {
    id: 'ch3_twain_approach',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Ah, another soul drawn to the gravitational pull of a man clearly making no money! I\'m Sam Clemens - reporter, failed prospector, and collector of lies that people insist on calling \'stories.\' And you are...?"',
    choices: [
      { text: 'Introduce yourself honestly', nextNode: 'ch3_twain_honest_intro', effect: { stat: 'trust', change: 2 } },
      { text: 'Give a colorful backstory', nextNode: 'ch3_twain_colorful_intro', effect: { stat: 'luck', change: 1 } },
      { text: 'Ask about his failures first', nextNode: 'ch3_twain_failures', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch3_twain_approach_informed: {
    id: 'ch3_twain_approach_informed',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"I see you\'ve been asking around. Good - only fools trust strangers immediately, and wise fools verify what they\'re told. So you know I\'m a collector of tall tales. The question is: do you have any worth collecting?"',
    choices: [
      { text: 'Tell him about your journey west', nextNode: 'ch3_twain_journey_story', effect: { stat: 'trust', change: 1 } },
      { text: 'Ask him to tell you a story first', nextNode: 'ch3_twain_tells_story', effect: { stat: 'wisdom', change: 1 } },
      { text: '[Diplomacy DC 12] Negotiate - story for story', skillCheck: { skill: 'diplomacy', dc: 12, successNode: 'ch3_twain_bargain', failNode: 'ch3_twain_tells_story' }, nextNode: 'ch3_twain_bargain' },
    ],
  },
  ch3_twain_honest_intro: {
    id: 'ch3_twain_honest_intro',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"An honest introduction! How refreshingly dull. I\'m kidding - honesty is the rarest currency in these camps. Worth more than gold and twice as hard to find. Tell me, {playerTitle}, what brings you to this particular collection of mud, ambition, and broken dreams?"',
    choices: [
      { text: 'I\'m seeking my fortune', nextNode: 'ch3_twain_fortune_seeker' },
      { text: 'I\'m building something lasting', nextNode: 'ch3_twain_builder', effect: { stat: 'wisdom', change: 2 } },
      { text: 'I\'m running from something', nextNode: 'ch3_twain_runner', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch3_twain_colorful_intro: {
    id: 'ch3_twain_colorful_intro',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Oh, I like you already. A fellow liar! Though in my profession we call them \'creative non-fiction.\' The best stories are true at heart, even when the facts get in the way. Let me guess - you\'ve already reinvented yourself at least twice since crossing the Mississippi?"',
    giveXP: 15,
    choices: [
      { text: 'Admit the exaggeration', nextNode: 'ch3_twain_admit', effect: { stat: 'trust', change: 2 } },
      { text: 'Double down on the story', nextNode: 'ch3_twain_double_down', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch3_twain_failures: {
    id: 'ch3_twain_failures',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"My failures? Where to begin! I was a printer\'s devil who couldn\'t spell, a riverboat pilot who ran aground, a Confederate soldier who deserted after two weeks, and a prospector who found exactly one nugget - which I promptly lost in a card game. But I\'ve discovered that failure is just success at learning what not to do."',
    giveXP: 20,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_philosophy',
  },
  ch3_twain_philosophy: {
    id: 'ch3_twain_philosophy',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"The secret, you see, is that everyone here is failing at something. The difference is whether you keep a record of it. I\'ve decided to make my failures entertaining enough that people pay to read about them."',
    choices: [
      { text: 'That\'s remarkably optimistic', nextNode: 'ch3_twain_optimism' },
      { text: 'Or remarkably cynical', nextNode: 'ch3_twain_cynicism', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Will you write about me?', nextNode: 'ch3_twain_write_about_you' },
    ],
  },

  // Branch: Fortune Seeker
  ch3_twain_fortune_seeker: {
    id: 'ch3_twain_fortune_seeker',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Fortune! That fickle harpy. I\'ve met a thousand fortune seekers, and do you know what they all have in common? They\'re still seeking. The ones who actually found it stopped calling it fortune and started calling it work."',
    choices: [
      { text: 'What\'s wrong with dreaming big?', nextNode: 'ch3_twain_dreams' },
      { text: 'You sound disappointed', nextNode: 'ch3_twain_disappointed' },
      { text: 'What do you call what you\'re doing?', nextNode: 'ch3_twain_his_work' },
    ],
  },
  ch3_twain_dreams: {
    id: 'ch3_twain_dreams',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Nothing! Dream big, dream impossible. Just remember that the dream is the compass, not the destination. I dreamed of being rich once. Now I dream of writing something that outlives me. Both are fantasies, but one is cheaper to maintain."',
    giveItem: { id: 'twain_quote_dreams', name: 'Twain\'s Wisdom: Dreams', icon: '📜', description: '"Dream big, dream impossible. Just remember that the dream is the compass, not the destination." - Samuel Clemens' },
    giveXP: 30,
    nextNode: 'ch3_twain_conversation_continue',
  },

  // Branch: Builder
  ch3_twain_builder: {
    id: 'ch3_twain_builder',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Building something lasting! Now THAT catches my interest. Most folks here are extracting - ripping gold from the earth, moving on when it\'s gone. But a builder... a builder thinks about what comes after. Tell me more."',
    effect: { stat: 'trust', change: 1 },
    choices: [
      { text: 'I want to establish a ranch', nextNode: 'ch3_twain_ranch_dream' },
      { text: 'I want to create a legacy', nextNode: 'ch3_twain_legacy_dream' },
      { text: 'I want to help others succeed', nextNode: 'ch3_twain_helper_dream', effect: { stat: 'trust', change: 2 } },
    ],
  },
  ch3_twain_ranch_dream: {
    id: 'ch3_twain_ranch_dream',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"A ranch! The land endures when the gold is gone. Smart. I\'ve seen the places the Mexican rancheros built - they understood that the earth gives more than it takes if you treat it right. Find land with water, friend. Gold is temporary. Water is life."',
    giveItem: { id: 'twain_letter_intro', name: 'Letter of Introduction', icon: '✉️', description: 'A letter from Samuel Clemens vouching for your character - "This bearer has dreams worth backing" - may open doors' },
    giveXP: 40,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_ranch_advice',
  },
  ch3_twain_ranch_advice: {
    id: 'ch3_twain_ranch_advice',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"I met an old Californio near Sonora who told me: \'The Spanish built missions. The Americans dig holes. The land remembers both.\' When you find your land, think about what it will remember of you."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_legacy_dream: {
    id: 'ch3_twain_legacy_dream',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Legacy... now that\'s a word that keeps me up at night. I wonder sometimes if anything I write will outlast the newsprint it\'s printed on. But you - you\'re thinking about children, grandchildren, a family name. That\'s a legacy no fire can burn."',
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 30,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_helper_dream: {
    id: 'ch3_twain_helper_dream',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Help others succeed? In a gold camp? Friend, you are either the most naive soul I\'ve met or the wisest. Probably both. The truly wealthy aren\'t those with the most gold - they\'re those with the most friends who owe them favors."',
    giveItem: { id: 'twain_coin', name: 'Twain\'s Lucky Coin', icon: '🪙', description: 'A worn coin Sam Clemens lost in a card game and somehow won back - "For luck in all your generous endeavors"' },
    giveXP: 50,
    effect: { stat: 'trust', change: 3 },
    nextNode: 'ch3_twain_conversation_continue',
  },

  // Branch: Running from something
  ch3_twain_runner: {
    id: 'ch3_twain_runner',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Ah. Now we\'re being truly honest. Half the people in California are running from something - debt, family, the law, themselves. I ran from a war I didn\'t believe in. What matters isn\'t what you\'re running from, but what you\'re running toward."',
    effect: { stat: 'wisdom', change: 2 },
    choices: [
      { text: 'I\'m running toward a new life', nextNode: 'ch3_twain_new_life' },
      { text: 'I don\'t know yet', nextNode: 'ch3_twain_uncertain', effect: { stat: 'trust', change: 1 } },
      { text: 'Sometimes running is enough', nextNode: 'ch3_twain_running_enough' },
    ],
  },
  ch3_twain_new_life: {
    id: 'ch3_twain_new_life',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"A new life! California\'s specialty. Out here, a man can become whoever he claims to be. I arrived as Samuel Clemens. I may leave as someone else entirely. Names are just stories we tell about ourselves."',
    giveXP: 25,
    nextNode: 'ch3_twain_identity',
  },
  ch3_twain_identity: {
    id: 'ch3_twain_identity',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"I\'ve been toying with a pen name. Something with river flavor to it. Mark Twain - it\'s what the riverboat pilots call out when the water\'s deep enough to navigate. Two fathoms. Safe passage. What do you think?"',
    choices: [
      { text: 'It\'s perfect - sounds memorable', nextNode: 'ch3_twain_name_perfect', effect: { stat: 'trust', change: 2 } },
      { text: 'Why not use your real name?', nextNode: 'ch3_twain_real_name' },
      { text: 'Will anyone remember it?', nextNode: 'ch3_twain_name_doubt' },
    ],
  },
  ch3_twain_name_perfect: {
    id: 'ch3_twain_name_perfect',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"You think so? I appreciate that. If I ever become famous - and that\'s a mighty big if - I\'ll remember that a prospector in Angels Camp was one of the first to hear it. Consider yourself part of literary history!"',
    giveItem: { id: 'signed_notebook_page', name: 'Signed Notebook Page', icon: '📝', description: 'A page from Sam Clemens\' notebook, signed "To a friend who believed in Mark Twain before anyone else"' },
    giveXP: 60,
    effect: { stat: 'luck', change: 3 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_real_name: {
    id: 'ch3_twain_real_name',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"My real name? Samuel Clemens sounds like a clerk or a minister. Mark Twain sounds like someone who\'s been places, done things, lived a little. Besides, if I write something that gets me in trouble, Sam Clemens can deny everything."',
    giveXP: 20,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_name_doubt: {
    id: 'ch3_twain_name_doubt',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Ha! Probably not. But then again, nobody remembers the careful ones. They only remember those foolish enough to put their names on things. If I fail, I\'ll fail spectacularly. At least it\'ll make a good story."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_uncertain: {
    id: 'ch3_twain_uncertain',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"That\'s the most honest thing anyone\'s said to me in months. Most folks out here have their whole future planned - it\'s only the truth they haven\'t figured out yet. Keep that uncertainty close. It means you\'re still thinking."',
    giveItem: { id: 'twain_advice_uncertainty', name: 'Twain\'s Wisdom: Uncertainty', icon: '📜', description: '"Keep your uncertainty close. It means you\'re still thinking." - Samuel Clemens' },
    giveXP: 35,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_running_enough: {
    id: 'ch3_twain_running_enough',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"You know, you might be right. Sometimes the running is the point. Every step west is a step toward possibilities. Just... eventually you hit the Pacific. Then you have to decide whether to swim or turn around."',
    giveXP: 25,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },

  // Writing/Story Branches
  ch3_twain_writing: {
    id: 'ch3_twain_writing',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"What am I writing? Whatever will sell, friend. Letters from the mines, tall tales, observations on the human condition disguised as humor. But lately... I heard the most extraordinary story about a frog."',
    choices: [
      { text: 'A frog story?', nextNode: 'ch3_twain_frog_story', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Tell me about your other work', nextNode: 'ch3_twain_other_work' },
      { text: 'Who buys stories out here?', nextNode: 'ch3_twain_market' },
    ],
  },
  ch3_twain_frog_story: {
    id: 'ch3_twain_frog_story',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Yes! A miner named Ben Coon told me about Jim Smiley and his jumping frog, Dan\'l Webster. Best frog in Calaveras County until some stranger filled him with quail shot. It\'s ridiculous, absurd, and yet... there\'s something TRUE about it."',
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_frog_deep',
  },
  ch3_twain_frog_deep: {
    id: 'ch3_twain_frog_deep',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"The frog story isn\'t really about frogs. It\'s about everyone who came to California with a sure thing - a scheme, a claim, a plan. And how some stranger with quail shot always shows up to weigh them down. You understand?"',
    choices: [
      { text: 'The stranger is fate', nextNode: 'ch3_twain_frog_fate', effect: { stat: 'wisdom', change: 2 } },
      { text: 'The stranger is doubt', nextNode: 'ch3_twain_frog_doubt', effect: { stat: 'wisdom', change: 1 } },
      { text: 'The stranger is other people', nextNode: 'ch3_twain_frog_people', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch3_twain_frog_fate: {
    id: 'ch3_twain_frog_fate',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Fate! Yes, exactly! That\'s the interpretation of a philosopher. Or a prospector who\'s found empty claims before. You\'ve got depth, friend. Most folks just laugh at the frog and miss the tragedy underneath."',
    giveItem: { id: 'frog_manuscript_page', name: 'Original Frog Manuscript', icon: '🐸', description: 'A handwritten page from the original "Celebrated Jumping Frog" story - priceless literary history' },
    giveXP: 75,
    effect: { stat: 'wisdom', change: 3 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_frog_doubt: {
    id: 'ch3_twain_frog_doubt',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Doubt! The quail shot of the mind. We load ourselves down with it until we can\'t jump at all. You\'re more introspective than most miners I meet. Have you considered writing?"',
    giveXP: 40,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_frog_people: {
    id: 'ch3_twain_frog_people',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Other people! The cynic\'s answer, and probably the truest. There\'s always someone ready to sabotage your sure thing. But here\'s the secret: sometimes you\'re the stranger, too. We all carry quail shot."',
    giveXP: 40,
    effect: { stat: 'trust', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_tells_story: {
    id: 'ch3_twain_tells_story',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"A story? Alright, but you owe me one. There was a man in Hannibal who painted fences white. He convinced every boy in town that painting was a privilege worth paying for. They gave him their treasures - apples, kites, dead rats - for the honor of work. That man understood something essential about human nature."',
    giveXP: 25,
    choices: [
      { text: 'That people want what they can\'t have', nextNode: 'ch3_twain_fence_want' },
      { text: 'That people follow confidence', nextNode: 'ch3_twain_fence_confidence', effect: { stat: 'wisdom', change: 2 } },
      { text: 'That man sounds like a con artist', nextNode: 'ch3_twain_fence_con' },
    ],
  },
  ch3_twain_fence_want: {
    id: 'ch3_twain_fence_want',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Precisely! Forbidden fruit is always sweetest. That\'s why claims that are \'definitely played out\' attract the most diggers. Make something seem exclusive and watch the world line up to buy in."',
    giveXP: 30,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_fence_confidence: {
    id: 'ch3_twain_fence_confidence',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"You understand! Confidence is the only currency that never inflates. A man who believes his own nonsense can sell it to the world. I\'m not sure if that\'s inspiring or terrifying. Probably both."',
    giveItem: { id: 'twain_fence_wisdom', name: 'Twain\'s Wisdom: Confidence', icon: '📜', description: '"Confidence is the only currency that never inflates. A man who believes his own nonsense can sell it to the world." - Samuel Clemens' },
    giveXP: 50,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_fence_con: {
    id: 'ch3_twain_fence_con',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Con artist? Or entrepreneur? The line is thinner than you\'d think. He painted his fence AND got paid in treasures. Everyone went home happy. Is it really a con if nobody loses? Don\'t answer - I\'m still working that out myself."',
    giveXP: 30,
    effect: { stat: 'luck', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_bargain: {
    id: 'ch3_twain_bargain',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"A negotiator! I like that. Alright, story for story. You first - but be warned, I\'m a professional. If your tale is dull, I reserve the right to improve it when I retell it."',
    giveXP: 30,
    choices: [
      { text: 'Tell about crossing the Sierra Nevada', nextNode: 'ch3_twain_player_story_sierra' },
      { text: 'Tell about a strange character you met', nextNode: 'ch3_twain_player_story_character' },
      { text: 'Tell about why you came west', nextNode: 'ch3_twain_player_story_why' },
    ],
  },
  ch3_twain_journey_story: {
    id: 'ch3_twain_journey_story',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Your journey west? Please, tell me everything. I\'ve heard a hundred emigrant tales and each one is different. The trail west is democracy in action - everyone equal in their misery, their hope, their occasional triumphs."',
    giveXP: 15,
    nextNode: 'ch3_twain_story_reaction',
  },
  ch3_twain_player_story_sierra: {
    id: 'ch3_twain_player_story_sierra',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"The Sierra! Now that\'s a story worth hearing. Continue, continue - I\'m taking notes. The newspapers back East can\'t get enough of emigrant crossing tales. The more harrowing, the better they pay."',
    giveXP: 20,
    nextNode: 'ch3_twain_story_reaction',
  },
  ch3_twain_player_story_character: {
    id: 'ch3_twain_player_story_character',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Characters are my specialty! The stranger ones, the better. I met a man last week who claimed to be Napoleon\'s illegitimate son. Complete nonsense, of course, but he believed it so completely that I almost did too."',
    giveXP: 20,
    nextNode: 'ch3_twain_story_reaction',
  },
  ch3_twain_player_story_why: {
    id: 'ch3_twain_player_story_why',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Why you came west - now that\'s the universal story. Every soul in California has a version. Some are running toward. Some are running from. Most are running in circles, hoping to end up somewhere different than where they started."',
    giveXP: 20,
    nextNode: 'ch3_twain_story_reaction',
  },
  ch3_twain_story_reaction: {
    id: 'ch3_twain_story_reaction',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Not bad, not bad at all! I can work with this. Now, as promised - let me tell you about the frog. Best story I\'ve heard since arriving in these hills..."',
    giveXP: 30,
    nextNode: 'ch3_twain_frog_story',
  },

  // Continuation/Deeper Conversations
  ch3_twain_conversation_start: {
    id: 'ch3_twain_conversation_start',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Excellent! I prefer company that doesn\'t try to sell me something immediately. Though in California, that puts you in a distinct minority. What shall we discuss - philosophy, fortune, or the fundamental absurdity of human existence?"',
    choices: [
      { text: 'Let\'s discuss philosophy', nextNode: 'ch3_twain_philosophy_deep' },
      { text: 'Tell me about fortune hunting', nextNode: 'ch3_twain_fortune_discuss' },
      { text: 'I\'d like to hear about absurdity', nextNode: 'ch3_twain_absurdity', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch3_twain_philosophy_deep: {
    id: 'ch3_twain_philosophy_deep',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Philosophy! I studied it briefly - which is to say I read half a book and argued with my uncle for three hours. My conclusion: philosophers are people who know everything about thinking and nothing about doing. Present company excluded."',
    choices: [
      { text: 'What\'s wrong with thinking?', nextNode: 'ch3_twain_thinking' },
      { text: 'You seem to do plenty of both', nextNode: 'ch3_twain_both', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch3_twain_thinking: {
    id: 'ch3_twain_thinking',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Nothing\'s wrong with thinking! I recommend it highly, especially before speaking - advice I rarely follow myself. But thinking without doing is like planning a gold claim without digging. Pleasant, but ultimately unprofitable."',
    giveXP: 25,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_both: {
    id: 'ch3_twain_both',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Do I? That\'s kind of you to say. I\'m trying to prove that a man can make a living by thinking on paper. It\'s either revolutionary or delusional. The results aren\'t in yet."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_fortune_discuss: {
    id: 'ch3_twain_fortune_discuss',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Fortune hunting? I\'ve done my share. Staked a claim on the Stanislaus River, found nothing but blisters and disappointment. But I learned something valuable: the real gold isn\'t in the ground. It\'s in the stories people tell about looking for it."',
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 30,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_absurdity: {
    id: 'ch3_twain_absurdity',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Absurdity! My favorite topic. Consider: men travel thousands of miles, risk their lives, abandon their families, all to dig holes in the dirt hoping to find shiny rocks. And we call this PROGRESS. If a dog did it, we\'d call him confused."',
    giveItem: { id: 'twain_absurdity', name: 'Twain\'s Wisdom: Absurdity', icon: '📜', description: '"Men travel thousands of miles to dig holes in the dirt hoping for shiny rocks. If a dog did it, we\'d call him confused." - Samuel Clemens' },
    giveXP: 40,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },

  ch3_twain_conversation_continue: {
    id: 'ch3_twain_conversation_continue',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"This has been enlightening, friend. I don\'t meet many people worth remembering in these camps - too many are just shadows of the person they left behind. But you... you\'ve got something. May I ask one more thing?"',
    choices: [
      { text: 'Of course', nextNode: 'ch3_twain_final_question' },
      { text: 'What do you want to know?', nextNode: 'ch3_twain_final_question' },
      { text: 'Only if I can ask you something too', nextNode: 'ch3_twain_mutual_question', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch3_twain_final_question: {
    id: 'ch3_twain_final_question',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"If you could send one message to yourself ten years from now - just one sentence - what would it be? I ask everyone this. The answers say more about people than any story they\'d tell."',
    choices: [
      { text: '"You made it."', nextNode: 'ch3_twain_answer_made_it', effect: { stat: 'trust', change: 2 } },
      { text: '"Don\'t forget where you came from."', nextNode: 'ch3_twain_answer_remember', effect: { stat: 'wisdom', change: 2 } },
      { text: '"Keep dreaming."', nextNode: 'ch3_twain_answer_dream', effect: { stat: 'luck', change: 2 } },
      { text: '"I hope you\'re still asking questions."', nextNode: 'ch3_twain_answer_questions', effect: { stat: 'wisdom', change: 3 } },
    ],
  },
  ch3_twain_answer_made_it: {
    id: 'ch3_twain_answer_made_it',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"\'You made it.\' Simple, powerful, optimistic. You expect success but you\'re not sure what it looks like yet. That\'s the best kind of dreamer - open to possibilities. I\'ll remember that one."',
    giveXP: 50,
    nextNode: 'ch3_twain_farewell',
  },
  ch3_twain_answer_remember: {
    id: 'ch3_twain_answer_remember',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"\'Don\'t forget where you came from.\' You\'ve got roots, real ones. Most folks out here are trying to outrun their past. You want to bring yours forward. That takes a particular kind of courage."',
    giveXP: 50,
    nextNode: 'ch3_twain_farewell',
  },
  ch3_twain_answer_dream: {
    id: 'ch3_twain_answer_dream',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"\'Keep dreaming.\' A fellow romantic! The world needs dreamers - they\'re the only ones who build anything worth having. Just don\'t dream so hard you forget to wake up occasionally."',
    giveXP: 50,
    nextNode: 'ch3_twain_farewell',
  },
  ch3_twain_answer_questions: {
    id: 'ch3_twain_answer_questions',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"\'I hope you\'re still asking questions.\' Now THAT is the answer of a genuine thinker. Questions are more valuable than answers - answers end journeys, questions start them. I think we might be kindred spirits, friend."',
    giveItem: { id: 'twain_pen', name: 'Clemens\' Spare Pen', icon: '🖋️', description: 'A well-used pen from Samuel Clemens himself - "For recording your own questions" - imbued with literary destiny' },
    giveXP: 75,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_farewell',
  },
  ch3_twain_mutual_question: {
    id: 'ch3_twain_mutual_question',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Fair enough! Quid pro quo. You first - ask me anything. But be warned: I\'m constitutionally incapable of giving short answers."',
    choices: [
      { text: 'Will you ever be famous?', nextNode: 'ch3_twain_fame_question' },
      { text: 'What\'s your biggest regret?', nextNode: 'ch3_twain_regret_question' },
      { text: 'What matters most to you?', nextNode: 'ch3_twain_matters_question' },
    ],
  },
  ch3_twain_fame_question: {
    id: 'ch3_twain_fame_question',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Famous? Lord, I hope so - though probably for something embarrassing. I\'ll likely be remembered for the frog story and nothing else. \'Here lies Sam Clemens: he wrote about a frog.\' Could be worse, I suppose."',
    giveXP: 35,
    nextNode: 'ch3_twain_final_question',
  },
  ch3_twain_regret_question: {
    id: 'ch3_twain_regret_question',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Regrets? Every word I didn\'t write. Every story I heard and forgot. Every moment I was too clever to simply feel. But regret is just guilt\'s lazy cousin - it keeps you looking backward when all the interesting stuff is ahead."',
    giveItem: { id: 'twain_regret_wisdom', name: 'Twain\'s Wisdom: Regret', icon: '📜', description: '"Regret is just guilt\'s lazy cousin - it keeps you looking backward when all the interesting stuff is ahead." - Samuel Clemens' },
    giveXP: 50,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_final_question',
  },
  ch3_twain_matters_question: {
    id: 'ch3_twain_matters_question',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"What matters? The truth, dressed up pretty enough that people will listen to it. Laughter, because it\'s the only honest reaction. And stories - because when we\'re all gone, stories are what remain. That\'s my trinity. Now, your turn to answer..."',
    giveXP: 40,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_final_question',
  },

  ch3_twain_farewell: {
    id: 'ch3_twain_farewell',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Well, friend, I believe this has been one of the better conversations I\'ve had since arriving in California. If you\'re ever in San Francisco, look me up - I\'ll be the one in the corner, scribbling and muttering. And if you hear any good stories, send them my way. The truth optional, but preferred."',
    effect: { stat: 'trust', change: 2 },
    giveXP: 30,
    nextNode: 'ch3_twain_finale',
  },
  ch3_twain_finale: {
    id: 'ch3_twain_finale',
    speaker: 'narrator',
    text: 'Samuel Clemens tips his hat and returns to his notebook, already scribbling notes about your conversation. You have the strange feeling that somewhere, somehow, your words might end up in print. A peculiar kind of immortality, purchased with nothing but good conversation.',
    giveXP: 50,
  },

  // Easter Egg branches
  ch3_twain_dangerous: {
    id: 'ch3_twain_dangerous',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Dangerous? Me? Only to the English language, which I assault daily with puns and run-on sentences. Though I DID once challenge a man to a duel over an editorial. He wisely declined - not because I\'m good with a pistol, but because I\'m terrible, and nobody wants to die in a farcical accident."',
    giveItem: { id: 'twain_easter_egg_1', name: 'Dueling Pistol Story', icon: '🔫', description: 'The true tale of Sam Clemens\' aborted duel - "He declined because my aim was too unpredictable to safely dodge"' },
    giveXP: 40,
    effect: { stat: 'luck', change: 2 },
    nextNode: 'ch3_twain_conversation_start',
  },
  ch3_twain_admit: {
    id: 'ch3_twain_admit',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Ha! Honesty after embellishment - the proper order. First catch their attention, then tell them the truth. You understand the craft instinctively. Have you considered journalism? The pay is terrible but the lies are excellent."',
    giveXP: 25,
    effect: { stat: 'trust', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_double_down: {
    id: 'ch3_twain_double_down',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Commitment! I respect it. The best liars never break character. Just remember: in California, everyone\'s story is true until proven otherwise, and nobody bothers with proof. You\'ll do well here."',
    giveItem: { id: 'twain_liar_wisdom', name: 'Twain\'s Wisdom: Commitment', icon: '📜', description: '"The best liars never break character." - Samuel Clemens (A dubious honor, but wise nonetheless)' },
    giveXP: 35,
    effect: { stat: 'luck', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_optimism: {
    id: 'ch3_twain_optimism',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Optimistic? I prefer \'strategically delusional.\' It\'s impossible to write humor from a place of despair - well, possible, but unpleasant. I choose to find the human comedy funny rather than tragic. Same facts, different conclusions."',
    giveXP: 25,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_cynicism: {
    id: 'ch3_twain_cynicism',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Cynical? Guilty as charged. But I\'m a hopeful cynic - I expect the worst and am pleasantly surprised by mediocrity. Keeps life interesting. Besides, cynics are just disappointed idealists. We expected more and got... this."',
    giveItem: { id: 'twain_cynic', name: 'Twain\'s Wisdom: Cynicism', icon: '📜', description: '"Cynics are just disappointed idealists. We expected more and got... this." - Samuel Clemens' },
    giveXP: 30,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_write_about_you: {
    id: 'ch3_twain_write_about_you',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Write about you? Depends. Do something interesting and you\'ll find yourself immortalized in newsprint. Do something embarrassing and I\'ll change the names to protect the guilty. Either way, you\'ll make good copy."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_other_work: {
    id: 'ch3_twain_other_work',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Other work? Letters from the diggings, sketches of camp life, the occasional piece about politics - though those get me in trouble. I\'m working on something bigger, though. A travel book, maybe. Or a novel. Something that takes more than a few pages to ruin."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_market: {
    id: 'ch3_twain_market',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Who buys stories? Anyone back East hungry for tales of the Wild West. They want to hear about gold and gunfights and noble savages - preferably without leaving their parlors. I provide the dreams, they provide the dollars. Fair trade, I think."',
    giveXP: 20,
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_his_work: {
    id: 'ch3_twain_his_work',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"What do I call what I\'m doing? Professional observation. Remunerated eavesdropping. Artistic theft of other people\'s experiences. I take the raw ore of human foolishness and refine it into something people will pay to read. It\'s mining, just with a different kind of gold."',
    giveItem: { id: 'twain_work_wisdom', name: 'Twain\'s Wisdom: Work', icon: '📜', description: '"Take the raw ore of human foolishness and refine it into something people will pay to read." - Samuel Clemens on writing' },
    giveXP: 35,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_twain_conversation_continue',
  },
  ch3_twain_disappointed: {
    id: 'ch3_twain_disappointed',
    speaker: 'sam_clemens',
    npcId: 'sam_clemens',
    text: '"Disappointed? Of course I am. Every writer is disappointed - if we were satisfied, we\'d stop writing. But disappointment is useful. It means you expected something better. And expecting better is how things improve. Eventually. Maybe."',
    giveXP: 25,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch3_twain_conversation_continue',
  },

  // Angels Camp - Newspaper Office
  ch3_newspaper: {
    id: 'ch3_newspaper',
    speaker: 'narrator',
    text: 'The Calaveras Chronicle office buzzes with activity. Newsboys shout headlines about gold strikes, claim jumpers, and the latest frog jumping results.',
    choices: [
      { text: 'Read the latest edition', nextNode: 'ch3_newspaper_read', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Place an advertisement for mining partners', nextNode: 'ch3_newspaper_ad', effect: { stat: 'trust', change: 1 } },
      { text: '[Diplomacy DC 10] Ask the editor for insider tips', skillCheck: { skill: 'diplomacy', dc: 10, successNode: 'ch3_newspaper_tips', failNode: 'ch3_newspaper_brush' }, nextNode: 'ch3_newspaper_tips' },
    ],
  },
  ch3_newspaper_read: {
    id: 'ch3_newspaper_read',
    speaker: 'narrator',
    text: '"CARSON HILL YIELDS ANOTHER MONSTER NUGGET!" The article describes a 195-pound find - the largest ever in Calaveras County. Smaller strikes dot the surrounding hills daily.',
    giveItem: { id: 'newspaper_clipping', name: 'Chronicle Clipping', icon: '📰', description: 'An 1852 newspaper article about the Calaveras Nugget - proof that fortunes are real' },
    giveXP: 20,
  },
  ch3_newspaper_ad: {
    id: 'ch3_newspaper_ad',
    speaker: 'editor',
    text: '"Two bits for a notice, four bits with illustration. Your ad will run next week. Good luck finding honest partners - they\'re rarer than gold around here."',
    giveXP: 10,
  },
  ch3_newspaper_tips: {
    id: 'ch3_newspaper_tips',
    speaker: 'editor',
    text: '"You didn\'t hear this from me, but... the old Mexicans who mined here before \'49 left markers. Look for crosses carved into oak trees. They mark springs - and where there\'s water, there\'s placer gold."',
    giveItem: { id: 'editor_map', name: 'Editor\'s Sketch Map', icon: '🗺️', description: 'A rough map showing old Mexican mining markers - invaluable local knowledge' },
    effect: { stat: 'wisdom', change: 2 },
    giveXP: 40,
  },
  ch3_newspaper_brush: {
    id: 'ch3_newspaper_brush',
    speaker: 'editor',
    text: '"I\'m a newspaperman, not a prospector. Buy a subscription if you want information." He returns to his typewriter, clearly unimpressed.',
    giveXP: 5,
  },

  // Angels Camp - Stagecoach
  ch3_stagecoach: {
    id: 'ch3_stagecoach',
    speaker: 'narrator',
    text: 'The Wells Fargo stagecoach has just arrived from Stockton, its horses lathered and tired. The driver tips his hat as passengers emerge, blinking at the dusty mining town.',
    choices: [
      { text: 'Talk to the driver about the roads', nextNode: 'ch3_stagecoach_driver', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Ask about shipping gold safely', nextNode: 'ch3_stagecoach_gold', effect: { stat: 'trust', change: 1 } },
      { text: 'Check the schedule for routes out', nextNode: 'ch3_stagecoach_schedule' },
    ],
  },
  ch3_stagecoach_driver: {
    id: 'ch3_stagecoach_driver',
    speaker: 'stagecoach_driver',
    text: '"Roads? Ha! You mean mule trails with pretensions. The route to Sonora is passable. Jamestown\'s rough but doable. Avoid the Murphy\'s Grade unless you want to meet your maker."',
    giveXP: 15,
  },
  ch3_stagecoach_gold: {
    id: 'ch3_stagecoach_gold',
    speaker: 'stagecoach_driver',
    text: '"Wells Fargo express, friend. Five percent of value, but it\'s insured and guarded. Better than carrying it yourself and meeting road agents. Last week we found a prospector on the Jackson road - empty pockets and a permanent smile."',
    giveItem: { id: 'wells_fargo_card', name: 'Wells Fargo Card', icon: '💳', description: 'A card guaranteeing safe passage for gold shipments - essential for any serious prospector' },
    giveXP: 25,
  },
  ch3_stagecoach_schedule: {
    id: 'ch3_stagecoach_schedule',
    speaker: 'narrator',
    text: 'The schedule board shows departures to Stockton, Sacramento, and San Francisco. The prices are steep, but the destinations promise civilization, banks, and ways to turn gold into lasting wealth.',
    giveXP: 10,
  },

  // Angels Camp - Frog Jumping Arena
  ch3_arena: {
    id: 'ch3_arena',
    speaker: 'narrator',
    text: 'The famous frog jumping arena of Angels Camp! A wooden platform marks the starting line, with distance markers painted on the ground. Miners crowd around, making bets.',
    choices: [
      { text: 'Watch the current champion', nextNode: 'ch3_arena_champion', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Enter a frog in the contest', nextNode: 'ch3_arena_enter', effect: { stat: 'luck', change: 2 } },
      { text: '[Animal Handling DC 12] Train a frog', skillCheck: { skill: 'animal_handling', dc: 12, successNode: 'ch3_arena_train', failNode: 'ch3_arena_fail' }, nextNode: 'ch3_arena_train' },
    ],
  },
  ch3_arena_champion: {
    id: 'ch3_arena_champion',
    speaker: 'arena_host',
    text: '"That\'s Dan\'l Webster III - grandson of the original! Seventeen feet, four inches is his record. Ain\'t no frog in California can touch him."',
    giveXP: 10,
  },
  ch3_arena_enter: {
    id: 'ch3_arena_enter',
    speaker: 'narrator',
    text: 'You catch a promising-looking bullfrog by the creek and enter the contest. Your frog makes a respectable showing - eight feet, three inches. Not a winner, but not an embarrassment.',
    giveXP: 15,
    effect: { stat: 'gold', change: -5 },
  },
  ch3_arena_train: {
    id: 'ch3_arena_train',
    speaker: 'narrator',
    text: 'Using techniques you learned from creek-side observation, you coax extraordinary performance from your frog. Fifteen feet, two inches! The crowd erupts!',
    giveItem: { id: 'frog_trophy', name: 'Frog Jumping Trophy', icon: '🏆', description: 'Second place at the Angels Camp Frog Jump - a treasured souvenir' },
    effect: { stat: 'gold', change: 20 },
    giveXP: 50,
  },
  ch3_arena_fail: {
    id: 'ch3_arena_fail',
    speaker: 'narrator',
    text: 'Your frog refuses to cooperate, sitting stubbornly on the starting line. The crowd laughs good-naturedly. "That\'s the Gold Country for ya - even the frogs are stubborn!"',
    giveXP: 10,
  },

  // Carson Hill - Minecart
  ch3_minecart: {
    id: 'ch3_minecart',
    speaker: 'narrator',
    text: 'An abandoned ore cart sits on rusted rails, half-filled with quartz rock. The rails lead deeper into the mountain, disappearing into shadow.',
    choices: [
      { text: 'Examine the ore in the cart', nextNode: 'ch3_minecart_ore', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Follow the rails into the tunnel', nextNode: 'ch3_minecart_follow' },
      { text: '[Prospecting DC 11] Assess the rock quality', skillCheck: { skill: 'prospecting', dc: 11, successNode: 'ch3_minecart_assess', failNode: 'ch3_minecart_confused' }, nextNode: 'ch3_minecart_assess' },
    ],
  },
  ch3_minecart_ore: {
    id: 'ch3_minecart_ore',
    speaker: 'narrator',
    text: 'The quartz is shot through with gold - not nuggets, but thin veins. This mine was producing when it was abandoned. What drove the miners away?',
    giveXP: 15,
  },
  ch3_minecart_follow: {
    id: 'ch3_minecart_follow',
    speaker: 'narrator',
    text: 'The rails lead to a junction where three tunnels diverge. Faded signs point to "Main Shaft," "Ventilation," and mysteriously, "Do Not Enter - By Order of Management."',
    giveXP: 10,
  },
  ch3_minecart_assess: {
    id: 'ch3_minecart_assess',
    speaker: 'narrator',
    text: 'Your trained eye sees what others missed - this ore averages three ounces of gold per ton. That\'s exceptional! The mine was abandoned due to flooding, not lack of gold.',
    giveItem: { id: 'rich_ore_sample', name: 'Rich Ore Sample', icon: '⛏️', description: 'A sample of high-grade ore proving the mine\'s potential value' },
    giveXP: 40,
  },
  ch3_minecart_confused: {
    id: 'ch3_minecart_confused',
    speaker: 'narrator',
    text: 'The rocks all look the same to your untrained eye. You\'ll need more experience before you can read the stone\'s secrets.',
    giveXP: 5,
  },

  // Carson Hill - Tunnel
  ch3_tunnel: {
    id: 'ch3_tunnel',
    speaker: 'narrator',
    text: 'The main tunnel stretches back into Carson Hill. Your lantern reveals pick marks on the walls and timber supports, some worryingly cracked.',
    choices: [
      { text: 'Proceed carefully into the darkness', nextNode: 'ch3_tunnel_proceed', effect: { stat: 'luck', change: 1 } },
      { text: '[Wilderness Survival DC 10] Check the supports', skillCheck: { skill: 'wilderness_survival', dc: 10, successNode: 'ch3_tunnel_safe', failNode: 'ch3_tunnel_danger' }, nextNode: 'ch3_tunnel_safe' },
      { text: 'This is too dangerous - turn back', nextNode: 'ch3_tunnel_back', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch3_tunnel_proceed: {
    id: 'ch3_tunnel_proceed',
    speaker: 'narrator',
    text: 'Fifty feet in, you find a collapsed section blocking the main passage. But through a crack, you glimpse another chamber - and something glinting in the lamplight.',
    giveXP: 20,
  },
  ch3_tunnel_safe: {
    id: 'ch3_tunnel_safe',
    speaker: 'narrator',
    text: 'The supports on the left side are sound - oak, not pine. You proceed along that wall, finding a side passage the previous miners missed entirely.',
    giveItem: { id: 'hidden_passage_note', name: 'Hidden Passage Location', icon: '📝', description: 'Notes on a secret passage in the Carson Hill mine' },
    giveXP: 35,
  },
  ch3_tunnel_danger: {
    id: 'ch3_tunnel_danger',
    speaker: 'narrator',
    text: 'You brush against a support and dust showers down. The timber groans ominously. Time to leave - quickly.',
    giveXP: 10,
  },
  ch3_tunnel_back: {
    id: 'ch3_tunnel_back',
    speaker: 'tobias',
    text: "I didn't come this far to be buried in a mountain. I'll find gold in safer ground.",
    giveXP: 5,
  },

  // Carson Hill - Deep Cave
  ch3_deep_cave: {
    id: 'ch3_deep_cave',
    speaker: 'narrator',
    text: 'Beyond the mine workings, you discover a natural cave. Crystals glitter on the walls, and the air smells ancient and mineral-rich.',
    choices: [
      { text: 'Explore the crystal chamber', nextNode: 'ch3_cave_crystals', effect: { stat: 'luck', change: 2 } },
      { text: '[Prospecting DC 14] Search for gold deposits', skillCheck: { skill: 'prospecting', dc: 14, successNode: 'ch3_cave_gold', failNode: 'ch3_cave_empty' }, nextNode: 'ch3_cave_gold' },
      { text: 'The cave feels sacred - leave respectfully', nextNode: 'ch3_cave_respect', effect: { stat: 'wisdom', change: 2 } },
    ],
  },
  ch3_cave_crystals: {
    id: 'ch3_cave_crystals',
    speaker: 'narrator',
    text: 'The crystals are calcite, formed over millions of years. While not valuable like gold, they\'re breathtakingly beautiful. You carefully extract one perfect specimen.',
    giveItem: { id: 'cave_crystal', name: 'Cave Crystal', icon: '💠', description: 'A perfect natural crystal - evidence of nature\'s patient artistry' },
    giveXP: 25,
  },
  ch3_cave_gold: {
    id: 'ch3_cave_gold',
    speaker: 'narrator',
    text: 'Behind a waterfall of calcite formations, you find it - a pocket of pure gold, untouched since the earth formed. This is the kind of find that makes legends.',
    giveItem: { id: 'cave_gold_cache', name: 'Cave Gold Cache', icon: '🌟', description: 'A pouch of pure gold nuggets from a hidden cave - fortune smiles on the bold' },
    effect: { stat: 'gold', change: 100 },
    giveXP: 75,
  },
  ch3_cave_empty: {
    id: 'ch3_cave_empty',
    speaker: 'narrator',
    text: 'The cave is beautiful, but its treasures are geological, not precious. Still, the experience of seeing something so ancient feels valuable in its own way.',
    giveXP: 15,
  },
  ch3_cave_respect: {
    id: 'ch3_cave_respect',
    speaker: 'narrator',
    text: 'You sense the Miwok people considered this place sacred. Respecting that, you leave a small offering and withdraw. Some wisdom says the best treasures are the ones you don\'t take.',
    effect: { stat: 'trust', change: 2 },
    giveXP: 30,
  },

  // Carson Hill - Rich Claim
  ch3_rich_claim: {
    id: 'ch3_rich_claim',
    speaker: 'narrator',
    text: 'This is it - the spot where your knowledge, luck, and perseverance converge. The rock here practically glows with promise.',
    choices: [
      { text: 'Stake your claim immediately', nextNode: 'ch3_stake_official', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Pan the nearby creek first', nextNode: 'ch3_pan_test', effect: { stat: 'luck', change: 1 } },
      { text: '[Prospecting DC 13] Assess the full extent', skillCheck: { skill: 'prospecting', dc: 13, successNode: 'ch3_full_assess', failNode: 'ch3_partial_assess' }, nextNode: 'ch3_full_assess' },
    ],
  },
  ch3_stake_official: {
    id: 'ch3_stake_official',
    speaker: 'narrator',
    text: 'You hammer in your claim stakes and note the location for official filing. This land is yours now - all the gold beneath it, and all the future it promises.',
    giveItem: { id: 'land_deed', name: 'Land Claim Deed', icon: '📜', description: 'Your official claim to mineral rights on Carson Hill - your stake in the American Dream' },
    giveXP: 50,
  },
  ch3_pan_test: {
    id: 'ch3_pan_test',
    speaker: 'narrator',
    text: 'The creek shows color immediately - fine gold dust and small flakes. The source is definitely upstream, near your prospective claim site. Your instincts were right.',
    giveItem: { id: 'gold_dust_pouch', name: 'Gold Dust Pouch', icon: '✨', description: 'Your first significant panning yield - proof of the riches waiting in your claim' },
    effect: { stat: 'gold', change: 25 },
    giveXP: 35,
  },
  ch3_full_assess: {
    id: 'ch3_full_assess',
    speaker: 'narrator',
    text: 'Your expert assessment reveals the true extent - the vein runs three hundred feet along the hillside and descends at least fifty feet. This isn\'t a claim. This is a fortune.',
    giveItem: { id: 'geological_survey', name: 'Geological Survey', icon: '🗺️', description: 'Your detailed survey of the mother lode claim - worth more than gold itself' },
    giveXP: 75,
  },
  ch3_partial_assess: {
    id: 'ch3_partial_assess',
    speaker: 'narrator',
    text: 'You can\'t determine the full extent, but what you see is promising. Time and work will reveal the rest.',
    giveXP: 20,
  },

  // ============================================
  // CHAPTER 5 DIALOGUES - The Legacy (Transition)
  // ============================================

  ch5_intro: {
    id: 'ch5_intro',
    speaker: 'narrator',
    text: 'The year is 1890. Pryor, now weathered and wise, looks over the ranch he built from nothing. His fortune is secure, but he knows his time grows short.',
    nextNode: 'ch5_intro_2',
  },
  ch5_intro_2: {
    id: 'ch5_intro_2',
    speaker: 'tobias',
    text: "I've lived a full life. But the treasure I found... it deserves better than to be spent by ungrateful heirs or seized by greedy men. I'll hide it. Leave clues for someone worthy.",
    nextNode: 'ch5_intro_3',
  },
  ch5_intro_3: {
    id: 'ch5_intro_3',
    speaker: 'narrator',
    text: 'Help Pryor place his clues around the ranch. Each location you choose will echo through time, waiting for a future treasure hunter to discover.',
  },

  ch5_hearth: {
    id: 'ch5_hearth',
    speaker: 'narrator',
    text: 'The hearth stone - brought from Carson Hill itself. Tobias takes up his chisel.',
    choices: [
      { text: 'Carve initials and symbols', nextNode: 'ch5_hearth_carve', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Hide something beneath the stone', nextNode: 'ch5_hearth_hide', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch5_hearth_carve: {
    id: 'ch5_hearth_carve',
    speaker: 'tobias',
    text: "T.G. 1852... and these four symbols. Each one points to a direction, a location, a piece of the puzzle. Only someone who truly explores this land will understand.",
    nextNode: 'ch5_hearth_carve_2',
  },
  ch5_hearth_carve_2: {
    id: 'ch5_hearth_carve_2',
    speaker: 'tobias',
    text: "Three symbols I carve now. The fourth... I'll save for the Welcome Gate. Here - the chisel that carved my legacy. Perhaps someday, someone will understand its marks.",
    giveItem: { id: 'tobias_chisel', name: "Tobias's Chisel", icon: '🔨', description: 'The chisel that carved the mysterious symbols - a key to understanding the clues' },
  },
  ch5_hearth_hide: {
    id: 'ch5_hearth_hide',
    speaker: 'narrator',
    text: 'Beneath the heavy stone, Tobias places a small iron box. Inside: a map fragment. The first piece of his final puzzle.',
    giveItem: { id: 'map_fragment_1', name: 'Map Fragment (Hearth)', icon: '🧩', description: 'First piece of the treasure map - hidden beneath the hearthstone' },
  },

  ch5_piano: {
    id: 'ch5_piano',
    speaker: 'narrator',
    text: 'The piano - the same model Tobias first heard in Volcano\'s Cobblestone Theatre. The song "Oh Susanna" plays in his memory.',
    choices: [
      { text: 'Encode a message in music', nextNode: 'ch5_piano_encode', effect: { stat: 'wisdom', change: 3 } },
      { text: 'Hide a clue inside the bench', nextNode: 'ch5_piano_bench', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch5_piano_encode: {
    id: 'ch5_piano_encode',
    speaker: 'tobias',
    text: "Every note of 'Oh Susanna' will mean something. C is north, D is east, E is south... play the song, follow the directions, find the treasure. Only a true musician will decipher it.",
    giveItem: { id: 'cipher_key', name: 'Musical Cipher Key', icon: '🎼', description: 'The key to decoding the Oh Susanna cipher - notes become directions' },
  },
  ch5_piano_bench: {
    id: 'ch5_piano_bench',
    speaker: 'narrator',
    text: 'Inside the piano bench, among the sheet music, Tobias tucks a yellowed paper - the second piece of his puzzle.',
    giveItem: { id: 'map_fragment_2', name: 'Map Fragment (Piano)', icon: '🧩', description: 'Second piece of the treasure map - hidden in the piano bench' },
  },

  ch5_telescope: {
    id: 'ch5_telescope',
    speaker: 'narrator',
    text: 'Tobias remembers George Madeira\'s observatory in Volcano - California\'s first. He positions his own telescope toward the heavens.',
    choices: [
      { text: 'Create a star chart cipher', nextNode: 'ch5_stars_cipher', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Mark the stars he followed west', nextNode: 'ch5_stars_journey', effect: { stat: 'trust', change: 2 } },
    ],
  },
  ch5_stars_cipher: {
    id: 'ch5_stars_cipher',
    speaker: 'tobias',
    text: "When Orion points his sword at the Bear, stand at the hearth and follow the shadow. The stars themselves will guide the worthy to my treasure.",
    giveItem: { id: 'star_chart', name: 'Star Chart Cipher', icon: '⭐', description: 'A hand-drawn star chart with cryptic notations - the stars point the way' },
  },
  ch5_stars_journey: {
    id: 'ch5_stars_journey',
    speaker: 'narrator',
    text: 'The same constellations that guided Tobias west will now guide future seekers to his hidden fortune.',
    giveItem: { id: 'constellation_guide', name: 'Constellation Guide', icon: '🌟', description: 'A guide to the constellations as Tobias knew them - the stars of 1852' },
  },

  ch5_stars: {
    id: 'ch5_stars',
    speaker: 'narrator',
    text: 'The night sky blazes with the same stars Tobias followed in 1852. The Milky Way arches overhead, a river of light in the darkness.',
    nextNode: 'ch5_stars_2',
  },
  ch5_stars_2: {
    id: 'ch5_stars_2',
    speaker: 'tobias',
    text: "These stars never change. Long after I'm gone, they'll still be here - and so will my clues. Waiting for someone who loves adventure as much as I did.",
  },

  ch5_deck: {
    id: 'ch5_deck',
    speaker: 'tobias',
    text: "This view... I chose this spot for this view. Every sunrise, I've watched the light paint these mountains gold. The deer come at dawn, their coats gleaming. Golden hooves, the neighbors call them.",
    nextNode: 'ch5_deck_2',
  },
  ch5_deck_2: {
    id: 'ch5_deck_2',
    speaker: 'narrator',
    text: 'Tobias smiles. "The Golden Hooves. That\'s what I\'ll call my legacy. Let them search for golden hooves - and find the true treasure: this land, this view, this moment."',
  },

  ch5_lookout: {
    id: 'ch5_lookout',
    speaker: 'narrator',
    text: 'From the lookout, Tobias can see all the way to the Mokelumne River. The same path he traveled from Volcano, from Angels Camp, from that first hopeful day on the Oregon Trail.',
    choices: [
      { text: 'Place the final clue here', nextNode: 'ch5_final_clue', effect: { stat: 'wisdom', change: 3 } },
      { text: 'Simply enjoy the view one last time', nextNode: 'ch5_final_view', effect: { stat: 'trust', change: 3 } },
    ],
  },
  ch5_final_clue: {
    id: 'ch5_final_clue',
    speaker: 'tobias',
    text: "The final piece... not of the treasure itself, but of the journey. Whoever stands here and understands what I've hidden will know: the real treasure was never gold. It was finding a place to call home.",
    giveItem: { id: 'final_clue', name: "Tobias's Final Clue", icon: '📿', description: 'A locket containing the final coordinates - where the treasure waits at Back of Beyond' },
  },
  ch5_final_view: {
    id: 'ch5_final_view',
    speaker: 'narrator',
    text: 'Tobias watches the sun set one more time. The deer emerge from the forest, their coats gleaming gold in the fading light. The Golden Hooves Legacy begins.',
    giveItem: { id: 'golden_hooves_token', name: 'Golden Hooves Token', icon: '🦌', description: 'A carved token showing a deer with golden hooves - the symbol of the legacy' },
  },

  ch5_trail: {
    id: 'ch5_trail',
    speaker: 'narrator',
    text: 'The trail leads back to civilization - to Volcano, to Angels Camp, to the world beyond. But for Tobias, home is here now.',
    nextNode: 'ch5_trail_2',
  },
  ch5_trail_2: {
    id: 'ch5_trail_2',
    speaker: 'tobias',
    text: "One day, 170 years from now, someone will walk these trails again. They'll scan strange codes, solve my riddles, and discover what I've left behind. I wonder... will they understand?",
    nextNode: 'ch5_trail_final',
  },
  ch5_trail_final: {
    id: 'ch5_trail_final',
    speaker: 'narrator',
    text: 'The clues are set. The Golden Hooves Legacy awaits. And somewhere in the future, a treasure hunter will pick up where this story ends... at the Welcome Gate of Back of Beyond Ranch.',
  },

  // Chapter 5 - Legacy Ranch Locations
  ch5_cabin_door: {
    id: 'ch5_cabin_door',
    speaker: 'narrator',
    text: 'The cabin door is carved from old-growth cedar, its surface worn smooth by forty years of hands. Tobias pauses, one last time, at the threshold.',
    choices: [
      { text: 'Carve a message on the door', nextNode: 'ch5_door_carve', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Enter and look around one last time', nextNode: 'ch5_door_enter', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch5_door_carve: {
    id: 'ch5_door_carve',
    speaker: 'tobias',
    text: '"Back of Beyond - Est. 1856. May all who enter find what they seek." And below, where only the observant will look: coordinates, in the old Spanish style.',
    giveItem: { id: 'door_coordinates', name: 'Hidden Coordinates', icon: '🧭', description: 'Spanish-style coordinates carved beneath the welcome message' },
    giveXP: 40,
  },
  ch5_door_enter: {
    id: 'ch5_door_enter',
    speaker: 'narrator',
    text: 'The cabin holds a lifetime of memories - Mary\'s wedding dress, still hanging; the children\'s growth marks on the doorframe; the smell of cedar and woodsmoke.',
    giveXP: 25,
  },

  ch5_vineyard: {
    id: 'ch5_vineyard',
    speaker: 'narrator',
    text: 'The vineyard cascades down the hillside, grapevines heavy with fruit. Tobias planted these from cuttings brought from Volcano by Italian miners in 1858.',
    choices: [
      { text: 'Taste the grapes', nextNode: 'ch5_vineyard_taste' },
      { text: 'Bury something among the roots', nextNode: 'ch5_vineyard_bury', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Examine the oldest vine', nextNode: 'ch5_vineyard_old', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch5_vineyard_taste: {
    id: 'ch5_vineyard_taste',
    speaker: 'tobias',
    text: '"These grapes know sixty Sierra summers. The wine they make... it tastes like California itself. Sweet, wild, and worth every struggle to cultivate."',
    giveXP: 15,
  },
  ch5_vineyard_bury: {
    id: 'ch5_vineyard_bury',
    speaker: 'narrator',
    text: 'At the base of the oldest vine, Tobias buries a small chest. Inside: gold coins and a letter. "The treasure is in the land itself. Care for these vines, and they\'ll care for you."',
    giveItem: { id: 'vineyard_letter', name: 'Tobias\'s Vineyard Letter', icon: '📜', description: 'A letter about the true value of the land - buried where roots run deep' },
    giveXP: 50,
  },
  ch5_vineyard_old: {
    id: 'ch5_vineyard_old',
    speaker: 'narrator',
    text: 'The grandfather vine is thick as your wrist, its bark gnarled with age. A small metal tag, green with verdigris, reads "Zinfandel - Shenandoah Valley Clone - 1858."',
    giveItem: { id: 'vineyard_tag', name: 'Historical Vine Tag', icon: '🏷️', description: 'An original 1858 vine tag - valuable to wine historians' },
    giveXP: 30,
  },

  ch5_gazebo: {
    id: 'ch5_gazebo',
    speaker: 'narrator',
    text: 'The gazebo stands where Tobias and Mary were married in 1856. Wild roses climb its posts, descendants of plants she brought from her mother\'s garden in Stockton.',
    choices: [
      { text: 'Read the inscription on the floor', nextNode: 'ch5_gazebo_inscription', effect: { stat: 'trust', change: 2 } },
      { text: 'Hide something in the rose arbor', nextNode: 'ch5_gazebo_hide', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Sit and remember', nextNode: 'ch5_gazebo_remember' },
    ],
  },
  ch5_gazebo_inscription: {
    id: 'ch5_gazebo_inscription',
    speaker: 'narrator',
    text: 'Set into the floor stones: "Mary & Tobias - June 21, 1856 - Two became one, and one became home." The summer solstice. The longest day. A clue?',
    giveItem: { id: 'solstice_clue', name: 'Solstice Clue', icon: '☀️', description: 'The wedding date holds significance - the sun on that day points to something' },
    giveXP: 40,
  },
  ch5_gazebo_hide: {
    id: 'ch5_gazebo_hide',
    speaker: 'tobias',
    text: '"In the place where love was sworn, I hide my heart\'s true north. When the roses bloom, look beneath their roots - there my final testament waits."',
    giveItem: { id: 'testament_clue', name: 'Testament Clue', icon: '🌹', description: 'Directions to search beneath the roses when spring comes' },
    giveXP: 45,
  },
  ch5_gazebo_remember: {
    id: 'ch5_gazebo_remember',
    speaker: 'tobias',
    text: '"Mary loved this spot. She said the roses smelled like hope. I hope... whoever finds my treasure knows that the real treasure was her."',
    giveXP: 25,
  },

  ch5_fountain: {
    id: 'ch5_fountain',
    speaker: 'narrator',
    text: 'The fountain burbles peacefully, its basin carved from a single boulder of Sierra granite. Fish swim in its depths - descendants of the first trout Tobias stocked.',
    choices: [
      { text: 'Examine the carved basin', nextNode: 'ch5_fountain_carve', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Drop a coin and make a wish', nextNode: 'ch5_fountain_wish', effect: { stat: 'luck', change: 2 } },
      { text: 'Look beneath the water', nextNode: 'ch5_fountain_beneath' },
    ],
  },
  ch5_fountain_carve: {
    id: 'ch5_fountain_carve',
    speaker: 'narrator',
    text: 'Around the rim, nearly invisible with age: symbols. Compass points, animals, numbers. A complete cipher hidden in plain sight, visible only to those who look closely.',
    giveItem: { id: 'fountain_cipher', name: 'Fountain Cipher', icon: '💧', description: 'A copy of the symbols carved around the fountain rim - a key to something' },
    giveXP: 50,
  },
  ch5_fountain_wish: {
    id: 'ch5_fountain_wish',
    speaker: 'tobias',
    text: '"I wish... I wish that whoever finds my legacy understands what it means. Not the gold. The life. The love. The land." The coin sinks into the clear water.',
    effect: { stat: 'trust', change: 1 },
    giveXP: 20,
  },
  ch5_fountain_beneath: {
    id: 'ch5_fountain_beneath',
    speaker: 'narrator',
    text: 'Through the clear water, you glimpse a sealed bottle weighted with stones. Inside: a rolled paper. This was always the plan - water protects secrets better than stone.',
    giveItem: { id: 'fountain_scroll', name: 'Fountain Scroll', icon: '📜', description: 'A waterproofed scroll retrieved from the fountain - another piece of the puzzle' },
    giveXP: 45,
  },

  ch5_dock: {
    id: 'ch5_dock',
    speaker: 'narrator',
    text: 'The dock extends over the lake, its timbers silvered by decades of weather. Tobias built it himself, every plank set by hand.',
    choices: [
      { text: 'Cast a line one more time', nextNode: 'ch5_dock_fish', effect: { stat: 'luck', change: 1 } },
      { text: 'Check the secret compartment', nextNode: 'ch5_dock_secret', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Watch the sun set over the water', nextNode: 'ch5_dock_sunset', effect: { stat: 'trust', change: 1 } },
    ],
  },
  ch5_dock_fish: {
    id: 'ch5_dock_fish',
    speaker: 'tobias',
    text: '"The best thoughts come while fishing. I figured out every clue, every hiding spot, sitting right here with a line in the water. Maybe the next treasure hunter will too."',
    giveXP: 20,
  },
  ch5_dock_secret: {
    id: 'ch5_dock_secret',
    speaker: 'narrator',
    text: 'Under the third plank from the end, a waterproof compartment Tobias carved himself. Inside: a compass, and a note. "Follow me at midnight on the winter solstice."',
    giveItem: { id: 'tobias_compass', name: "Tobias's Compass", icon: '🧭', description: 'The compass Tobias carried from Missouri - points to more than magnetic north' },
    giveXP: 55,
  },
  ch5_dock_sunset: {
    id: 'ch5_dock_sunset',
    speaker: 'narrator',
    text: 'The sun sinks behind the western ridge, painting the lake in shades of gold and copper. The same colors as the nuggets Tobias pulled from Carson Hill so long ago.',
    giveItem: { id: 'sunset_memory', name: 'Golden Sunset Memory', icon: '🌅', description: 'A moment of peace - sometimes the treasure is simply being present' },
    nextNode: 'ch5_dock_pegasus_sighting',
  },
  ch5_dock_pegasus_sighting: {
    id: 'ch5_dock_pegasus_sighting',
    speaker: 'narrator',
    text: 'As the last golden rays fade, you catch something impossible in your peripheral vision - a winged shape against the darkening sky, trailing sparkles like scattered starlight. When you look directly, it\'s gone. But you could swear you heard distant hoofbeats in the clouds.',
    giveXP: 25,
    effect: { stat: 'luck', change: 3 },
  },

  // ============================================================
  // EASTER EGGS - Hidden Secrets Throughout the Journey
  // ============================================================

  // Chapter 1 Easter Egg: The Mysterious Traveler (hints at future)
  ch1_mysterious_traveler: {
    id: 'ch1_mysterious_traveler',
    speaker: 'narrator',
    text: 'A cloaked figure sits apart from the other travelers, watching the fire with ancient eyes. They seem familiar, though you\'ve never met.',
    choices: [
      { text: 'Approach cautiously', nextNode: 'ch1_traveler_approach' },
      { text: 'Ask the wagon master about them', nextNode: 'ch1_traveler_ask' },
      { text: 'Leave them be', nextNode: 'ch1_traveler_ignore', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch1_traveler_approach: {
    id: 'ch1_traveler_approach',
    speaker: 'mysterious_traveler',
    npcId: 'mysterious_traveler',
    text: '"So you\'re the one. I wondered if I\'d find you on this trail." Their voice carries the weight of many roads traveled. "You have questions. I have only riddles. Ask anyway."',
    choices: [
      { text: 'Who are you?', nextNode: 'ch1_traveler_identity' },
      { text: 'What do you mean, \'the one\'?', nextNode: 'ch1_traveler_prophecy', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Tell me about California', nextNode: 'ch1_traveler_california' },
    ],
  },
  ch1_traveler_identity: {
    id: 'ch1_traveler_identity',
    speaker: 'mysterious_traveler',
    npcId: 'mysterious_traveler',
    text: '"Names are stories people tell about themselves. I\'ve had many. In this story, I\'m just a traveler - like you, seeking something just over the horizon. We\'re all chasing the same sunset, aren\'t we?"',
    giveXP: 15,
    nextNode: 'ch1_traveler_gift',
  },
  ch1_traveler_prophecy: {
    id: 'ch1_traveler_prophecy',
    speaker: 'mysterious_traveler',
    npcId: 'mysterious_traveler',
    text: '"The ones who ask questions instead of demanding answers - they\'re rare. Most travelers want gold. You want understanding. That\'s worth more, though it takes longer to spend." They smile. "You\'ll build something that outlasts the gold. Remember that when the digging gets hard."',
    giveItem: { id: 'prophecy_coin', name: 'Coin of Prophecy', icon: '🔮', description: 'A coin with no discernible origin - one side shows a rising sun, the other a setting one. "For the space between beginnings and endings."' },
    giveXP: 50,
    effect: { stat: 'wisdom', change: 3 },
  },
  ch1_traveler_california: {
    id: 'ch1_traveler_california',
    speaker: 'mysterious_traveler',
    npcId: 'mysterious_traveler',
    text: '"California is a mirror. It shows people who they really are - stripped of pretense, hungry, honest in their greed or their hope. Some find gold. More find themselves. A few find both. The trick is knowing which one you\'re looking for."',
    giveXP: 25,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch1_traveler_gift',
  },
  ch1_traveler_gift: {
    id: 'ch1_traveler_gift',
    speaker: 'mysterious_traveler',
    npcId: 'mysterious_traveler',
    text: '"Before you go - take this. It belonged to another traveler who found what they were seeking. It has no value except to the right person. Perhaps that\'s you." They press something small and warm into your palm.',
    giveItem: { id: 'travelers_token', name: 'Traveler\'s Token', icon: '🪶', description: 'A small feather-shaped token, warm to the touch. "Given, not taken. The difference matters."' },
    giveXP: 30,
  },
  ch1_traveler_ask: {
    id: 'ch1_traveler_ask',
    speaker: 'wagon_master',
    text: '"That one? Been traveling alone since Westport. Never talks, never complains, always knows when the weather\'s turning. Some say they\'ve traveled this trail before - years before the first wagon ever came this way. Superstition, probably. But I don\'t question folks who keep to themselves."',
    giveXP: 15,
    effect: { stat: 'wisdom', change: 1 },
  },
  ch1_traveler_ignore: {
    id: 'ch1_traveler_ignore',
    speaker: 'narrator',
    text: 'You turn away, but feel their gaze on your back like warmth from a distant fire. When you look again later, they\'re gone - no tracks, no sign they were ever there. Only a faint impression in the grass where they sat, and a lingering scent of far-off places.',
    giveXP: 10,
  },

  // Chapter 2 Easter Egg: Ghost in the Hotel
  ch2_ghost_room: {
    id: 'ch2_ghost_room',
    speaker: 'narrator',
    text: 'Late at night, you wake to find writing appearing on the dusty mirror - letters traced by an invisible finger. The message glows faintly in the moonlight.',
    choices: [
      { text: 'Read the message', nextNode: 'ch2_ghost_message', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Wipe the mirror clean', nextNode: 'ch2_ghost_wipe' },
      { text: 'Try to communicate', nextNode: 'ch2_ghost_communicate', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch2_ghost_message: {
    id: 'ch2_ghost_message',
    speaker: 'narrator',
    text: 'The message reads: "LOOK BENEATH THE FLOORBOARDS IN THE THEATRE. I HID IT THERE WHEN THE FEVER TOOK ME. TELL MY SARAH I TRIED TO COME HOME." A name appears below - "JONATHAN PACE, 1850"',
    giveItem: { id: 'ghost_clue', name: 'Ghost\'s Message', icon: '👻', description: 'A transcription of Jonathan Pace\'s ghostly message - leads to hidden treasure in the theatre' },
    giveXP: 40,
    effect: { stat: 'wisdom', change: 2 },
  },
  ch2_ghost_wipe: {
    id: 'ch2_ghost_wipe',
    speaker: 'narrator',
    text: 'As your hand touches the mirror, a cold shock runs through you. For an instant, you see another hand - translucent, desperate - trying to hold yours. The message fades, but you can\'t shake the feeling you\'ve missed something important.',
    giveXP: 10,
  },
  ch2_ghost_communicate: {
    id: 'ch2_ghost_communicate',
    speaker: 'narrator',
    text: '"Can you hear me?" you whisper. The writing pauses. Then, slowly: "YES. SO LONELY. BEEN WAITING... SOMEONE WHO COULD SEE. YOU HAVE THE SIGHT. USE IT WELL." The temperature drops, and you feel a gentle touch on your shoulder - comforting, grateful.',
    giveItem: { id: 'spectral_sight', name: 'Spectral Awareness', icon: '👁️', description: 'Jonathan\'s gift - you can now sense hidden things others cannot. "The dead remember what the living forget."' },
    giveXP: 75,
    effect: { stat: 'wisdom', change: 5 },
  },

  // Chapter 4 Easter Egg: Talking Animals (sort of)
  ch4_wise_horse: {
    id: 'ch4_wise_horse',
    speaker: 'narrator',
    text: 'The old mare in the corral watches you with unusual intelligence. When you meet her eyes, you could swear she nods - a deliberate, knowing gesture.',
    choices: [
      { text: 'Speak to her', nextNode: 'ch4_horse_speak' },
      { text: 'Offer her an apple', nextNode: 'ch4_horse_apple', effect: { stat: 'trust', change: 1 } },
      { text: 'Check her hoofprints', nextNode: 'ch4_horse_tracks', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  ch4_horse_speak: {
    id: 'ch4_horse_speak',
    speaker: 'narrator',
    text: '"Hello, old girl. You\'ve seen some things, haven\'t you?" The mare whickers softly, then paws the ground in a precise pattern - three times, pause, twice, pause, five times. It almost looks like... a code?',
    nextNode: 'ch4_horse_code',
  },
  ch4_horse_code: {
    id: 'ch4_horse_code',
    speaker: 'tobias',
    text: '"That pattern - 3-2-5. Tobias\'s lucky numbers. He always said Duchess was smarter than half the people in Angels Camp. Said she led him to his richest claim, just by refusing to go any other direction."',
    giveXP: 30,
    effect: { stat: 'wisdom', change: 1 },
    nextNode: 'ch4_horse_direction',
  },
  ch4_horse_direction: {
    id: 'ch4_horse_direction',
    speaker: 'narrator',
    text: 'Duchess turns and looks pointedly toward the eastern hills, then back at you. She stamps once - firmly, insistently. Something is out there. Something she wants you to find.',
    giveItem: { id: 'duchess_guidance', name: 'Duchess\'s Direction', icon: '🐴', description: 'The old mare seems to know secrets. She pointed east toward the hills - perhaps there\'s something hidden there.' },
    giveXP: 25,
    effect: { stat: 'luck', change: 2 },
  },
  ch4_horse_apple: {
    id: 'ch4_horse_apple',
    speaker: 'narrator',
    text: 'Duchess takes the apple delicately, then - impossibly - she seems to smile. Her tail swishes in a pattern, and you notice something hanging from her mane: a tiny leather pouch you hadn\'t seen before.',
    giveItem: { id: 'hidden_pouch', name: 'Duchess\'s Secret', icon: '👝', description: 'A tiny pouch hidden in the mare\'s mane - contains three perfect gold nuggets. "Payment for kindness," someone wrote on a tag inside.' },
    giveXP: 50,
    effect: { stat: 'luck', change: 3 },
  },
  ch4_horse_tracks: {
    id: 'ch4_horse_tracks',
    speaker: 'narrator',
    text: 'Her hoofprints in the dust form a strange pattern - not random wandering but deliberate shapes. Letters? Numbers? Following the tracks with your eyes, you make out: "BARN - THIRD RAFTER - LOOK UP"',
    giveItem: { id: 'track_message', name: 'Hoofprint Message', icon: '🔍', description: 'A cryptic message written in hoofprints: "BARN - THIRD RAFTER - LOOK UP" - Duchess knows the ranch\'s secrets' },
    giveXP: 35,
    effect: { stat: 'wisdom', change: 2 },
  },

  // Chapter 5 Easter Egg: Time Capsule
  ch5_time_capsule: {
    id: 'ch5_time_capsule',
    speaker: 'narrator',
    text: 'Beneath the old oak tree, you find a stone marker carved with a date: your arrival day, somehow recorded decades before you came. Below it, a buried box.',
    choices: [
      { text: 'Open the box', nextNode: 'ch5_capsule_open', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Add something of your own', nextNode: 'ch5_capsule_add', effect: { stat: 'trust', change: 2 } },
      { text: 'Leave it undisturbed', nextNode: 'ch5_capsule_leave', effect: { stat: 'luck', change: 2 } },
    ],
  },
  ch5_capsule_open: {
    id: 'ch5_capsule_open',
    speaker: 'narrator',
    text: 'Inside: a photograph of someone who looks remarkably like you, standing on this exact spot. A note reads: "For my great-great-grandchild, or whoever finally solves the puzzle. The treasure was never the gold. It was the journey that shaped us. The legacy we leave. The stories we become."',
    giveItem: { id: 'ancestor_photo', name: 'Photograph of Destiny', icon: '📸', description: 'A photograph of someone who looks like you, taken decades ago. The note says: "The treasure was never the gold."' },
    giveXP: 100,
    effect: { stat: 'wisdom', change: 5 },
  },
  ch5_capsule_add: {
    id: 'ch5_capsule_add',
    speaker: 'narrator',
    text: 'You place your own token in the box - a small piece of who you\'ve become. As you seal it again, the oak tree seems to sigh with satisfaction. The wind carries words: "The chain continues..."',
    giveXP: 75,
    effect: { stat: 'trust', change: 3 },
  },
  ch5_capsule_leave: {
    id: 'ch5_capsule_leave',
    speaker: 'narrator',
    text: 'Some mysteries are meant to remain mysteries. As you turn away, a single golden leaf falls from the oak - out of season, impossibly bright. It lands in your palm like a gift, warm as a blessing.',
    giveItem: { id: 'golden_oak_leaf', name: 'Golden Oak Leaf', icon: '🍂', description: 'An impossibly golden leaf that fell out of season - a blessing from whatever spirit guards the land' },
    giveXP: 60,
    effect: { stat: 'luck', change: 4 },
  },

  // Cross-Chapter Easter Egg: The Pegasus Legend
  ch3_pegasus_legend: {
    id: 'ch3_pegasus_legend',
    speaker: 'old_miner',
    npcId: 'old_miner',
    text: '"You want to hear something strange? My grandfather swore he saw a flying horse over these hills. Said it appeared when someone was about to strike it rich - or about to die. He called it the Gold Rush Guardian."',
    choices: [
      { text: 'Ask for more details', nextNode: 'ch3_pegasus_details', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Dismiss it as superstition', nextNode: 'ch3_pegasus_dismiss' },
      { text: 'Have you ever seen it?', nextNode: 'ch3_pegasus_witness', effect: { stat: 'luck', change: 1 } },
    ],
  },
  ch3_pegasus_details: {
    id: 'ch3_pegasus_details',
    speaker: 'old_miner',
    npcId: 'old_miner',
    text: '"He said it was white as snow with golden wings. Left sparkles in the air like stars. Appeared only at twilight, between day and night - between the real and the maybe-real. Most folks laughed at him. But three days later, he found the Carson Hill motherlode."',
    giveXP: 30,
    effect: { stat: 'wisdom', change: 2 },
    nextNode: 'ch3_pegasus_truth',
  },
  ch3_pegasus_truth: {
    id: 'ch3_pegasus_truth',
    speaker: 'old_miner',
    npcId: 'old_miner',
    text: '"I figure it\'s like everything in California - believe what you want, and maybe what you believe becomes true. This land has magic in it, real or not. The believing matters more than the being."',
    giveItem: { id: 'pegasus_story', name: 'Legend of the Guardian', icon: '🦄', description: 'The old miner\'s tale of the Gold Rush Guardian - a winged horse that appears at twilight to mark fortune or fate' },
    giveXP: 40,
    effect: { stat: 'luck', change: 2 },
  },
  ch3_pegasus_dismiss: {
    id: 'ch3_pegasus_dismiss',
    speaker: 'old_miner',
    npcId: 'old_miner',
    text: '"Sure, sure. Superstition. That\'s what they all say - until they see something they can\'t explain. Keep your eyes on the sky at sunset, friend. The impossible has a habit of showing up when you\'re not looking for it."',
    giveXP: 15,
  },
  ch3_pegasus_witness: {
    id: 'ch3_pegasus_witness',
    speaker: 'old_miner',
    npcId: 'old_miner',
    text: '"Once. Just once, the night before I found my best claim. I was half-asleep, figured I was dreaming. But the sparkles... those were real. Found them on my bedroll the next morning. Still have one." He opens his palm to show a single golden mote of light.',
    giveItem: { id: 'pegasus_sparkle', name: 'Pegasus Sparkle', icon: '✨', description: 'A tiny mote of golden light that never fades - shed from the wings of the Gold Rush Guardian' },
    giveXP: 60,
    effect: { stat: 'luck', change: 4 },
  },

  // ============================================
  // CHAPTER COMPLETION DIALOGUES
  // ============================================

  ch1_complete: {
    id: 'ch1_complete',
    speaker: 'narrator',
    text: 'CHAPTER 1 COMPLETE! You have survived the journey west and crossed the treacherous river. California awaits!',
    nextNode: 'ch1_complete_2',
  },
  ch1_complete_2: {
    id: 'ch1_complete_2',
    speaker: 'tobias',
    text: "I made it. The hardest part is behind me... or so I thought. But looking at these golden hills, I know the real adventure is just beginning.",
  },

  ch2_complete: {
    id: 'ch2_complete',
    speaker: 'narrator',
    text: 'CHAPTER 2 COMPLETE! You have explored Volcano and gathered the knowledge you need. Time to find your fortune!',
    nextNode: 'ch2_complete_2',
  },
  ch2_complete_2: {
    id: 'ch2_complete_2',
    speaker: 'tobias',
    text: "Everyone talks about Angels Camp. The jumping frogs, the mother lode, the wild stories... I need to see it for myself.",
  },

  ch3_complete: {
    id: 'ch3_complete',
    speaker: 'narrator',
    text: 'CHAPTER 3 COMPLETE! You have found the mother lode and staked your claim. Your fortune is made!',
    nextNode: 'ch3_complete_2',
  },
  ch3_complete_2: {
    id: 'ch3_complete_2',
    speaker: 'tobias',
    text: "This gold will let me build something lasting. A ranch in the foothills, where the deer run golden at sunset. I'll call it Back of Beyond.",
  },

  ch4_complete: {
    id: 'ch4_complete',
    speaker: 'narrator',
    text: 'CHAPTER 4 COMPLETE! Back of Beyond Ranch is built. But what legacy will you leave?',
    nextNode: 'ch4_complete_2',
  },
  ch4_complete_2: {
    id: 'ch4_complete_2',
    speaker: 'tobias',
    text: "This place is everything I dreamed of. But someday, I won't be here to enjoy it. I need to hide my treasure... and leave clues for someone worthy to find it.",
  },

  ch5_complete: {
    id: 'ch5_complete',
    speaker: 'narrator',
    text: 'THE GOLDEN HOOVES LEGACY COMPLETE! Tobias has hidden his treasure and set the clues. The story awaits its next chapter...',
    nextNode: 'ch5_complete_2',
  },
  ch5_complete_2: {
    id: 'ch5_complete_2',
    speaker: 'narrator',
    text: 'The year is now 2025. Back of Beyond Ranch still stands. The symbols on the hearthstone still wait to be decoded. The stars still point the way. Will YOU be the one to solve the mystery?',
    nextNode: 'ch5_complete_3',
  },
  ch5_complete_3: {
    id: 'ch5_complete_3',
    speaker: 'narrator',
    text: 'Visit Back of Beyond Ranch to continue the treasure hunt in the real world. The Golden Hooves Legacy awaits!',
  },

  // ============================================
  // HISTORICAL EASTER EGGS & CLASSIC GAME STYLE
  // Mark Twain, Oregon Trail, Carmen Sandiego, Fallout influences
  // ============================================

  // OREGON TRAIL STYLE - Trail disasters and dark humor
  trail_disaster_cholera: {
    id: 'trail_disaster_cholera',
    speaker: 'narrator',
    text: 'The trail claims another victim. A fresh grave marker reads: "Here lies Thomas Reed - Cholera took him 3 days from California. So close, yet so far." A familiar dread settles over the wagon train.',
    nextNode: 'trail_disaster_cholera_2',
  },
  trail_disaster_cholera_2: {
    id: 'trail_disaster_cholera_2',
    speaker: 'wagon_master',
    text: '"Boil your water, stay clean, and pray. That\'s all we can do." He pauses. "Also, don\'t eat the wild berries. Half of \'em will kill you faster than any disease."',
    choices: [
      { text: '[Wilderness Survival] Ask which berries are safe', nextNode: 'trail_berry_knowledge', skillCheck: { skill: 'wilderness_survival', dc: 8, successNode: 'trail_berry_success', failNode: 'trail_berry_fail' }, giveXP: 25 },
      { text: 'Note the warning and move on', nextNode: 'trail_continue_wisely', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  trail_berry_success: {
    id: 'trail_berry_success',
    speaker: 'wagon_master',
    text: '"You know your plants, boy. Manzanita berries, elderberries when cooked, wild grapes - those\'ll keep you alive. But the red ones that grow in clusters? Baneberry. One handful and you\'ll join Thomas Reed."',
    giveItem: { id: 'foraging_guide', name: 'Trail Foraging Guide', icon: '📗', description: '+2 to Foraging skill checks. Knowledge that keeps you alive.' },
  },
  trail_berry_fail: {
    id: 'trail_berry_fail',
    speaker: 'wagon_master',
    text: '"If you can\'t tell the difference, don\'t eat ANY of them. Stick to hardtack and beans like the rest of us. Tastes like sadness, but at least it won\'t kill you."',
  },
  trail_continue_wisely: {
    id: 'trail_continue_wisely',
    speaker: 'tobias',
    text: '"I\'ve come too far to die of berries. California or bust - but preferably not bust."',
  },

  // OREGON TRAIL - River crossing consequences
  trail_river_death: {
    id: 'trail_river_death',
    speaker: 'narrator',
    text: 'The Hendersons didn\'t make it. Their wagon overturned in the rapids. Young Sarah Henderson clings to a rock, the only survivor. The wagon master pulls her to safety.',
    nextNode: 'trail_river_death_2',
  },
  trail_river_death_2: {
    id: 'trail_river_death_2',
    speaker: 'narrator',
    text: 'SARAH HENDERSON has joined your party. She has nothing but the clothes on her back and a locket from her mother. "Take me to California," she whispers. "It\'s what they would have wanted."',
    choices: [
      { text: 'Promise to look after her', nextNode: 'trail_sarah_promise', effect: { stat: 'trust', change: 3 }, modifyNPC: { npcId: 'sarah_henderson', attitude: 20, trust: 15 } },
      { text: 'Offer practical help without promises', nextNode: 'trail_sarah_practical', effect: { stat: 'wisdom', change: 2 } },
    ],
  },
  trail_sarah_promise: {
    id: 'trail_sarah_promise',
    speaker: 'sarah_henderson',
    npcId: 'sarah_henderson',
    text: '"Thank you. My father always said to judge a man by what he does when no one\'s watching. You\'ve shown me who you are."',
    giveItem: { id: 'henderson_locket', name: 'Henderson Family Locket', icon: '📿', description: 'A reminder that some treasures can\'t be measured in gold' },
    giveXP: 50,
  },
  trail_sarah_practical: {
    id: 'trail_sarah_practical',
    speaker: 'sarah_henderson',
    npcId: 'sarah_henderson',
    text: '"I appreciate your honesty. Promises are easy to make and hard to keep. Help is what matters."',
    giveXP: 30,
  },

  // OREGON TRAIL - Classic oxen reference
  trail_oxen_tired: {
    id: 'trail_oxen_tired',
    speaker: 'narrator',
    text: 'YOUR OXEN ARE EXHAUSTED. The wagon master calls a halt. "Push them harder and they\'ll die. Then we\'ll all die. Rest here tonight."',
    choices: [
      { text: 'Set up camp and rest', nextNode: 'trail_rest_camp', effect: { stat: 'wisdom', change: 1 } },
      { text: '[Animal Handling] Care for the oxen personally', nextNode: 'trail_tend_oxen', skillCheck: { skill: 'animal_handling', dc: 10, successNode: 'trail_oxen_better', failNode: 'trail_oxen_same' }, giveXP: 20 },
      { text: 'Suggest pushing on anyway', nextNode: 'trail_push_foolish' },
    ],
  },
  trail_oxen_better: {
    id: 'trail_oxen_better',
    speaker: 'narrator',
    text: 'Your gentle handling and knowledge of draft animals works wonders. By morning, the oxen are refreshed and eager. The wagon master nods approvingly - you\'ve earned respect.',
    giveXP: 40,
    modifyNPC: { npcId: 'wagon_master', attitude: 10, trust: 5 },
  },
  trail_oxen_same: {
    id: 'trail_oxen_same',
    speaker: 'narrator',
    text: 'You try your best, but the oxen need more rest than you can provide. Still, your effort doesn\'t go unnoticed.',
    giveXP: 10,
  },
  trail_push_foolish: {
    id: 'trail_push_foolish',
    speaker: 'wagon_master',
    text: '"You want to walk to California? Because that\'s what\'ll happen if these oxen drop dead. Sit down, greenhorn."',
    modifyNPC: { npcId: 'wagon_master', attitude: -5 },
  },
  trail_rest_camp: {
    id: 'trail_rest_camp',
    speaker: 'narrator',
    text: 'The camp settles in. Around the fire, stories are shared - tales of gold, of hopes, of the lives left behind. This is how legends are born.',
  },

  // OREGON TRAIL - Dysentery reference (dark humor)
  trail_bad_water: {
    id: 'trail_bad_water',
    speaker: 'narrator',
    text: 'The water here looks... questionable. A greenish tinge and an odd smell suggest this might not be the best drinking hole.',
    choices: [
      { text: 'Boil the water first (safe)', nextNode: 'trail_water_boiled', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Risk it - too thirsty to wait', nextNode: 'trail_water_risk' },
      { text: '[Foraging] Search for a cleaner source', nextNode: 'trail_water_search', skillCheck: { skill: 'foraging', dc: 9, successNode: 'trail_water_clean', failNode: 'trail_water_none' }, giveXP: 15 },
    ],
  },
  trail_water_boiled: {
    id: 'trail_water_boiled',
    speaker: 'tobias',
    text: '"I didn\'t cross half a continent to die of dysentery. Patience keeps you alive."',
    giveXP: 25,
  },
  trail_water_risk: {
    id: 'trail_water_risk',
    speaker: 'narrator',
    text: 'You drink deep. For a moment, nothing... then your stomach begins to protest. You\'ve made a poor choice, but you\'ll survive - barely. (-1 CON temporarily until you rest)',
  },
  trail_water_clean: {
    id: 'trail_water_clean',
    speaker: 'narrator',
    text: 'Your sharp eye spots a spring upstream, bubbling up from clean rock. Crystal clear and cold - this is the good stuff.',
    giveItem: { id: 'fresh_canteen', name: 'Fresh Water Canteen', icon: '🫗', description: 'Clean mountain spring water - more valuable than gold on the trail' },
  },
  trail_water_none: {
    id: 'trail_water_none',
    speaker: 'narrator',
    text: 'No better source nearby. Boiling it is, then. At least you tried.',
  },

  // MARK TWAIN REFERENCES - Angels Camp 1865
  twain_hotel_encounter: {
    id: 'twain_hotel_encounter',
    speaker: 'narrator',
    text: 'In the corner of the Angels Hotel bar, a young man with wild hair scribbles furiously in a notebook. He looks up, catches your eye, and grins.',
    nextNode: 'twain_hotel_encounter_2',
  },
  twain_hotel_encounter_2: {
    id: 'twain_hotel_encounter_2',
    speaker: 'young_writer',
    text: '"Name\'s Sam Clemens. I\'m a reporter - or was, before I lost my job. Now I\'m collecting stories. Got any good ones?"',
    choices: [
      { text: 'Tell him about your journey west', nextNode: 'twain_story_journey', effect: { stat: 'trust', change: 1 } },
      { text: 'Ask about his stories instead', nextNode: 'twain_his_stories', effect: { stat: 'wisdom', change: 1 } },
      { text: 'Mention the jumping frog contest', nextNode: 'twain_frog_story' },
    ],
  },
  twain_story_journey: {
    id: 'twain_story_journey',
    speaker: 'young_writer',
    text: '"The trail! Cholera, river crossings, desperados... \'Gold fever never changes,\' they say. Maybe I\'ll use that line someday."',
    nextNode: 'twain_writer_wisdom',
  },
  twain_his_stories: {
    id: 'twain_his_stories',
    speaker: 'young_writer',
    text: '"I\'ve got a thousand stories, friend. But the best ones are the ones people don\'t believe are true. Like that jumping frog old Ross Coon told me about..."',
    nextNode: 'twain_frog_story',
  },
  twain_frog_story: {
    id: 'twain_frog_story',
    speaker: 'young_writer',
    text: '"There was a frog named Dan\'l Webster - could outjump any frog in Calaveras County. Until some stranger filled him with quail shot! Now THAT\'S a story."',
    nextNode: 'twain_frog_story_2',
  },
  twain_frog_story_2: {
    id: 'twain_frog_story_2',
    speaker: 'narrator',
    text: 'The young writer\'s eyes light up. "I\'m going to write that story down. Send it to a New York paper. Make them laugh." He pauses. "You should come back in about... thirteen years. I might be famous by then."',
    giveItem: { id: 'twain_notebook_page', name: 'Scribbled Notebook Page', icon: '📝', description: 'A page from Sam Clemens\' notebook - "The truth is the most valuable thing we have. Let us economize it." - future Mark Twain' },
  },
  twain_writer_wisdom: {
    id: 'twain_writer_wisdom',
    speaker: 'young_writer',
    text: '"Here\'s something I learned mining in Nevada: \'A gold mine is a hole in the ground with a liar standing next to it.\' But sometimes... sometimes the liar tells the truth. That\'s when fortunes are made."',
    giveXP: 30,
  },

  // MARK TWAIN - Roughing It reference
  twain_roughing_advice: {
    id: 'twain_roughing_advice',
    speaker: 'young_writer',
    text: '"If you\'re heading to the mines, remember this: \'It\'s easier to stay out than get out.\' Every prospector thinks they\'ll know when to quit. None of them do."',
    nextNode: 'twain_roughing_advice_2',
  },
  twain_roughing_advice_2: {
    id: 'twain_roughing_advice_2',
    speaker: 'young_writer',
    text: '"Also - keep a journal. Write everything down. Someday you\'ll want to remember these days, when you were young and the world was made of possibilities."',
    giveItem: { id: 'blank_journal', name: 'Leather Journal', icon: '📓', description: 'A blank journal. \'The difference between the right word and the almost right word is the difference between lightning and a lightning bug.\' - advice from a young writer' },
  },

  // CARMEN SANDIEGO STYLE - Educational clues
  carmen_gold_facts: {
    id: 'carmen_gold_facts',
    speaker: 'narrator',
    text: 'A faded poster on the general store wall catches your eye: "CALIFORNIA GOLD FACTS - Know Before You Pan!"',
    nextNode: 'carmen_gold_facts_2',
  },
  carmen_gold_facts_2: {
    id: 'carmen_gold_facts_2',
    speaker: 'narrator',
    text: 'FACT #1: Gold is 19 times heavier than water. That\'s why it settles in creek beds while lighter sand washes away. FACT #2: The Mother Lode runs 120 miles through the Sierra Nevada foothills.',
    nextNode: 'carmen_gold_facts_3',
  },
  carmen_gold_facts_3: {
    id: 'carmen_gold_facts_3',
    speaker: 'narrator',
    text: 'FACT #3: The largest nugget found at Carson Hill weighed 195 pounds - the "Calaveras Nugget" of 1854. FACT #4: More gold was found in California in six years than was mined in the previous 350 years worldwide.',
    giveXP: 15,
  },

  // CARMEN SANDIEGO - Geography clue puzzle
  carmen_geography_clue: {
    id: 'carmen_geography_clue',
    speaker: 'old_timer',
    text: '"The thief fled south along the Mokelumne River," the old-timer says. "Passed through a town named after angels, crossed into Tuolumne County, and disappeared near a creek named for a Colonel who found gold there in \'48."',
    choices: [
      { text: 'Colonel\'s Creek? That\'s Sonora - James\' Creek!', nextNode: 'carmen_geography_wrong' },
      { text: 'Colonel Sutter found gold at his mill - but the creek is in Coloma', nextNode: 'carmen_geography_wrong' },
      { text: 'It\'s Woods Creek, near Jamestown - Colonel Woods!', nextNode: 'carmen_geography_right' },
    ],
  },
  carmen_geography_right: {
    id: 'carmen_geography_right',
    speaker: 'old_timer',
    text: '"Sharp as a tack! Woods Creek it is. Colonel James D. Woods found color there in August 1848. That\'s where our bandit\'s been hiding. Here - a map showing the old escape routes."',
    giveItem: { id: 'bandit_route_map', name: 'Bandit Route Map', icon: '🗺️', description: 'A map showing known outlaw escape routes through Gold Country. Knowledge is power.' },
    giveXP: 60,
  },
  carmen_geography_wrong: {
    id: 'carmen_geography_wrong',
    speaker: 'old_timer',
    text: '"Close, but not quite. You need to study your Gold Country geography, friend. The answer was Woods Creek - Colonel James D. Woods, August 1848."',
    giveXP: 10,
  },

  // CARMEN SANDIEGO - Historical figure clues
  carmen_bandit_clues: {
    id: 'carmen_bandit_clues',
    speaker: 'sheriff',
    text: '"We\'re looking for a man matching this description: Always polite, never swears, leaves poetry at the scene. Sound familiar?"',
    choices: [
      { text: 'That\'s Black Bart!', nextNode: 'carmen_bart_right' },
      { text: 'Sounds like Joaquin Murrieta', nextNode: 'carmen_murrieta_wrong' },
      { text: 'Could be Three-Fingered Jack', nextNode: 'carmen_jack_wrong' },
    ],
  },
  carmen_bart_right: {
    id: 'carmen_bart_right',
    speaker: 'sheriff',
    text: '"You know your outlaws! Charles Earl Bowles - Black Bart, the Gentleman Bandit. Robbed 28 stagecoaches between 1877 and 1883. Always on foot, never fired a shot, left poems signed \'Black Bart, the Po8.\'"',
    nextNode: 'carmen_bart_poem',
  },
  carmen_bart_poem: {
    id: 'carmen_bart_poem',
    speaker: 'narrator',
    text: 'The sheriff shows you one of Black Bart\'s poems: "I\'ve labored long and hard for bread, for honor and for riches, but on my corns too long you\'ve tread, you fine-haired sons of --" The rest is torn off.',
    giveItem: { id: 'bart_poem', name: 'Black Bart Poem Fragment', icon: '📜', description: 'A piece of Gold Rush history - the Gentleman Bandit\'s verse' },
    giveXP: 40,
  },
  carmen_murrieta_wrong: {
    id: 'carmen_murrieta_wrong',
    speaker: 'sheriff',
    text: '"Murrieta? That\'s a different legend - 1850s, Mexican bandit turned folk hero. Some say he was driven to crime after miners attacked his family. Dead now, supposedly. But no - our man is polite and leaves POETRY."',
    giveXP: 15,
  },
  carmen_jack_wrong: {
    id: 'carmen_jack_wrong',
    speaker: 'sheriff',
    text: '"Three-Fingered Jack? Manuel Garcia rode with Murrieta, but he was anything but polite. Known for... extreme violence. No, we\'re looking for someone more... literary."',
    giveXP: 15,
  },

  // FALLOUT STYLE - Dark humor and stats
  fallout_vault_style: {
    id: 'fallout_vault_style',
    speaker: 'narrator',
    text: 'WELCOME TO CALIFORNIA! Population: Fluctuating wildly. Main export: Broken dreams and occasional gold. Radiation level: Pre-nuclear, so just regular cholera to worry about!',
    nextNode: 'fallout_vault_style_2',
  },
  fallout_vault_style_2: {
    id: 'fallout_vault_style_2',
    speaker: 'narrator',
    text: 'Remember: A positive attitude is statistically more likely to result in survival! Your SPECIAL stats have been replaced with STR, DEX, CON, INT, WIS, and CHA. Gold fever: Highly contagious. Side effects may include: obsessive panning, distrust of neighbors, and spontaneous prospecting.',
  },

  // FALLOUT - Skill check humor
  fallout_speech_check: {
    id: 'fallout_speech_check',
    speaker: 'claim_jumper',
    text: '"This here\'s MY claim now, stranger. Best move along unless you want trouble."',
    choices: [
      { text: '[Diplomacy 12] "Actually, I have the deed right here..."', nextNode: 'fallout_speech_success', skillCheck: { skill: 'diplomacy', dc: 12, successNode: 'fallout_speech_success', failNode: 'fallout_speech_fail' }, giveXP: 50 },
      { text: '[Intimidate 14] "You\'re standing on ground that\'s seen men buried for less."', nextNode: 'fallout_intimidate', skillCheck: { skill: 'intimidate', dc: 14, successNode: 'fallout_intimidate_success', failNode: 'fallout_intimidate_fail' }, giveXP: 50 },
      { text: '[INT 14] Point out the claim markers he clearly missed', nextNode: 'fallout_int_check', attributeCheck: { attribute: 'int', min: 14 }, giveXP: 50 },
      { text: 'Back away slowly', nextNode: 'fallout_retreat', effect: { stat: 'wisdom', change: 1 } },
    ],
  },
  fallout_speech_success: {
    id: 'fallout_speech_success',
    speaker: 'claim_jumper',
    text: '"Well I\'ll be... that IS an official deed. My apologies, friend. I\'ll be moving on. Times are tough - a man gets desperate."',
    nextNode: 'fallout_speech_reward',
  },
  fallout_speech_reward: {
    id: 'fallout_speech_reward',
    speaker: 'narrator',
    text: '[Diplomacy Success] The claim jumper tips his hat and walks away. Violence avoided. XP earned. Your reputation as a reasonable man grows.',
    giveXP: 75,
    modifyNPC: { npcId: 'claim_jumper', attitude: 20, trust: 10 },
  },
  fallout_speech_fail: {
    id: 'fallout_speech_fail',
    speaker: 'claim_jumper',
    text: '"That deed looks faker than a three-dollar bill. Nice try, city boy. Now git, before this gets ugly."',
    giveXP: 10,
  },
  fallout_intimidate_success: {
    id: 'fallout_intimidate_success',
    speaker: 'claim_jumper',
    text: 'Something in your eyes makes him reconsider. "You know what? There\'s plenty of other claims. This one ain\'t worth dying for."',
    giveXP: 75,
  },
  fallout_intimidate_fail: {
    id: 'fallout_intimidate_fail',
    speaker: 'claim_jumper',
    text: '"Hah! You\'re about as scary as a newborn kitten. But I like your spirit. Tell you what - split the claim 60-40 and we\'ll call it even."',
    giveXP: 25,
  },
  fallout_int_check: {
    id: 'fallout_int_check',
    speaker: 'narrator',
    text: '[Intelligence Check] You point to the survey markers he trampled, the filed claim number on the rock, and the legal notice posted on the tree. The jumper\'s face falls.',
    nextNode: 'fallout_int_success',
  },
  fallout_int_success: {
    id: 'fallout_int_success',
    speaker: 'claim_jumper',
    text: '"I... didn\'t see those. You\'re smarter than you look, stranger. I\'ll move on - and maybe pay more attention next time."',
    giveXP: 75,
  },
  fallout_retreat: {
    id: 'fallout_retreat',
    speaker: 'narrator',
    text: '[Wisdom] Sometimes the smart play is knowing when not to fight. You can return with backup, or find another claim. Live prospectors find more gold than dead heroes.',
    giveXP: 20,
  },

  // FALLOUT - War never changes parallel
  fallout_gold_fever: {
    id: 'fallout_gold_fever',
    speaker: 'old_prospector',
    text: '"Gold fever never changes, boy. In \'49 they came by the thousands. Before that, the Spanish killed for it. After us, corporations will strip these hills bare."',
    nextNode: 'fallout_gold_fever_2',
  },
  fallout_gold_fever_2: {
    id: 'fallout_gold_fever_2',
    speaker: 'old_prospector',
    text: '"The faces change. The methods change. But that gleam in a man\'s eye when he sees gold? That\'s been the same since the first human picked up a shiny rock and wanted more."',
    nextNode: 'fallout_gold_fever_3',
  },
  fallout_gold_fever_3: {
    id: 'fallout_gold_fever_3',
    speaker: 'narrator',
    text: 'GOLD FEVER. GOLD FEVER NEVER CHANGES.',
    giveXP: 25,
  },

  // HISTORICAL - Lola Montez reference
  historical_lola_montez: {
    id: 'historical_lola_montez',
    speaker: 'narrator',
    text: 'A playbill on the theatre wall advertises: "LOLA MONTEZ - The Bavarian Beauty! Direct from Grass Valley! See her Famous Spider Dance!"',
    nextNode: 'historical_lola_montez_2',
  },
  historical_lola_montez_2: {
    id: 'historical_lola_montez_2',
    speaker: 'actress',
    text: '"Ah, Lola! She scandalizes the preachers and thrills everyone else. They say she was the mistress of King Ludwig of Bavaria before coming to California. Now she lives in Grass Valley with a bear named Major."',
    nextNode: 'historical_lola_montez_3',
  },
  historical_lola_montez_3: {
    id: 'historical_lola_montez_3',
    speaker: 'narrator',
    text: 'HISTORICAL NOTE: Lola Montez (1821-1861) was a dancer and actress who settled in Grass Valley, California, from 1853-1855. Her protégé, Lotta Crabtree, became one of America\'s wealthiest entertainers.',
    giveXP: 20,
  },

  // HISTORICAL - Chinese miners
  historical_chinese_camp: {
    id: 'historical_chinese_camp',
    speaker: 'narrator',
    text: 'You pass through a section of camp where Chinese characters hang on signs. These miners work claims that white prospectors have abandoned - and often find gold the others missed.',
    choices: [
      { text: 'Stop and observe their techniques', nextNode: 'historical_chinese_technique', effect: { stat: 'wisdom', change: 2 } },
      { text: 'Continue past quickly', nextNode: 'historical_chinese_pass' },
      { text: '[Gather Info] Ask about their methods', nextNode: 'historical_chinese_ask', skillCheck: { skill: 'gather_info', dc: 10, successNode: 'historical_chinese_learn', failNode: 'historical_chinese_distrust' }, giveXP: 30 },
    ],
  },
  historical_chinese_technique: {
    id: 'historical_chinese_technique',
    speaker: 'narrator',
    text: 'Their patience is remarkable. Where others gave up after finding nothing, these miners work the same ground with meticulous care - and the glint of gold dust proves their methods work.',
    giveXP: 20,
  },
  historical_chinese_learn: {
    id: 'historical_chinese_learn',
    speaker: 'chinese_miner',
    npcId: 'wong_sam',
    text: '"We work what others abandon. Patience, friend. The mountains don\'t rush. Why should we?" He shows you a technique for separating fine gold from black sand that you\'ve never seen before.',
    giveItem: { id: 'fine_gold_technique', name: 'Fine Gold Separation Notes', icon: '📋', description: '+2 to Panning skill. Chinese mining techniques for extracting fine gold.' },
    giveXP: 50,
    modifyNPC: { npcId: 'wong_sam', attitude: 15, trust: 10 },
  },
  historical_chinese_distrust: {
    id: 'historical_chinese_distrust',
    speaker: 'narrator',
    text: 'The miners eye you with understandable caution. The Foreign Miners Tax and worse have taught them to be wary of strangers asking questions. Perhaps approach again after building trust.',
    modifyNPC: { npcId: 'wong_sam', attitude: -5 },
  },
  historical_chinese_pass: {
    id: 'historical_chinese_pass',
    speaker: 'narrator',
    text: 'You continue past. HISTORICAL NOTE: Chinese miners made up nearly a quarter of California\'s mining population by 1852, despite facing discriminatory taxes and violence. Their contributions to California\'s development are often overlooked.',
    giveXP: 10,
  },

  // HISTORICAL - The real Carson Hill nugget
  historical_carson_nugget: {
    id: 'historical_carson_nugget',
    speaker: 'miner',
    text: '"You want to hear about the big one? November 1854, Carson Hill. A man named James discovered a nugget weighing 195 POUNDS. They called it the Calaveras Nugget."',
    nextNode: 'historical_carson_nugget_2',
  },
  historical_carson_nugget_2: {
    id: 'historical_carson_nugget_2',
    speaker: 'miner',
    text: '"At today\'s prices? That nugget was worth over $40,000. But here\'s the thing - it wasn\'t buried deep. It was practically sitting on the surface, waiting for someone to trip over it."',
    nextNode: 'historical_carson_nugget_3',
  },
  historical_carson_nugget_3: {
    id: 'historical_carson_nugget_3',
    speaker: 'miner',
    text: '"The lesson? Sometimes fortune is right in front of you. You just have to be looking in the right place, at the right time. Keep your eyes open, friend."',
    giveXP: 25,
  },

  // HISTORICAL - Royal Garrison IV reference (ranch lineage)
  historical_garrison_legacy: {
    id: 'historical_garrison_legacy',
    speaker: 'narrator',
    text: 'An old land survey map shows property boundaries from the 1860s. One name catches your eye: "GARRISON - 320 acres, foothill grazing land." The Garrison family has been in these hills for generations.',
    nextNode: 'historical_garrison_legacy_2',
  },
  historical_garrison_legacy_2: {
    id: 'historical_garrison_legacy_2',
    speaker: 'old_rancher',
    text: '"The Garrisons? Oh, they\'ve been here since before the Gold Rush settled down. Royal Garrison - that\'s the fourth of his name now - still runs cattle on the original homestead. Old California family, those."',
    nextNode: 'historical_garrison_legacy_3',
  },
  historical_garrison_legacy_3: {
    id: 'historical_garrison_legacy_3',
    speaker: 'old_rancher',
    text: '"They say Royal III found more gold than he let on. Buried it somewhere on the property. His grandson still looks for it every spring. Maybe that\'s just how fortunes work - always one generation away."',
    giveItem: { id: 'garrison_survey', name: 'Garrison Property Survey', icon: '📐', description: 'An old survey map showing historic property boundaries. Some treasures are passed down, not discovered.' },
    giveXP: 30,
  },

  // OREGON TRAIL - "You have died" style event (near-miss)
  trail_near_death: {
    id: 'trail_near_death',
    speaker: 'narrator',
    text: 'The rattlesnake strikes without warning. Time seems to slow as the fangs flash toward your leg...',
    choices: [
      { text: '[DEX 14+] Leap backward instantly', nextNode: 'trail_snake_dodge', attributeCheck: { attribute: 'dex', min: 14 }, giveXP: 40 },
      { text: '[Wilderness Survival] Freeze and slowly back away', nextNode: 'trail_snake_freeze', skillCheck: { skill: 'wilderness_survival', dc: 11, successNode: 'trail_snake_survive', failNode: 'trail_snake_bit' }, giveXP: 30 },
      { text: 'Accept your fate', nextNode: 'trail_snake_bit' },
    ],
  },
  trail_snake_dodge: {
    id: 'trail_snake_dodge',
    speaker: 'narrator',
    text: 'Your reflexes save your life. The fangs miss by inches. The snake, having missed its strike, slithers away into the rocks.',
    nextNode: 'trail_snake_lesson',
  },
  trail_snake_survive: {
    id: 'trail_snake_survive',
    speaker: 'narrator',
    text: 'You freeze. The snake, sensing no threat, slowly uncoils and retreats. Your heart pounds, but you\'re unharmed.',
    nextNode: 'trail_snake_lesson',
  },
  trail_snake_bit: {
    id: 'trail_snake_bit',
    speaker: 'narrator',
    text: 'The fangs sink into your boot - but don\'t penetrate! Your thick leather saves your life. TOBIAS DID NOT DIE OF SNAKEBITE.',
    nextNode: 'trail_snake_lesson',
  },
  trail_snake_lesson: {
    id: 'trail_snake_lesson',
    speaker: 'tobias',
    text: '"I should write home more often. \'Dear Mother: Did not die of snakebite today. California is lovely. Send more socks.\'"',
    giveXP: 30,
  },

  // GAME META - Breaking fourth wall slightly
  meta_treasure_hunter: {
    id: 'meta_treasure_hunter',
    speaker: 'narrator',
    text: 'You find a strange note tucked in a crack in the hearthstone. The handwriting is oddly modern: "If you\'re reading this in 2025, the treasure hunt continues at Back of Beyond Ranch. Some mysteries span centuries."',
    nextNode: 'meta_treasure_hunter_2',
  },
  meta_treasure_hunter_2: {
    id: 'meta_treasure_hunter_2',
    speaker: 'tobias',
    text: '"That\'s... impossible. 2025? What manner of prophecy is this?" He shakes his head. "Must be some miner\'s joke. Still... I wonder what the future holds for this place."',
    giveItem: { id: 'temporal_note', name: 'Mysterious Future Note', icon: '⏳', description: 'A note that shouldn\'t exist. The Golden Hooves Legacy transcends time itself.' },
  },
}

// ============================================
// CHAPTER METADATA
// ============================================

export interface ChapterMeta {
  id: ChapterId
  title: string
  subtitle: string
  description: string
  maps: string[]
  startMap: string
  puzzleType: string
  completionDialogue: string
}

export const chapters: Record<ChapterId, ChapterMeta> = {
  1: {
    id: 1,
    title: 'The Journey West',
    subtitle: 'Missouri to California, 1852',
    description: 'Join young Tobias as he leaves everything behind for the promise of gold. Navigate the Oregon Trail, make allies, and survive the river crossing.',
    maps: ['ch1_trail', 'ch1_river'],
    startMap: 'ch1_trail',
    puzzleType: 'navigation',
    completionDialogue: 'ch1_complete',
  },
  2: {
    id: 2,
    title: 'Volcano, California',
    subtitle: 'The Haunted Boomtown',
    description: 'Arrive in Volcano - a real Gold Rush town with over 10,000 souls. Explore the haunted St. George Hotel, attend the Cobblestone Theatre, and gather supplies at the general store that still operates today.',
    maps: ['ch2_volcano', 'ch2_general_store'],
    startMap: 'ch2_volcano',
    puzzleType: 'trading',
    completionDialogue: 'ch2_complete',
  },
  3: {
    id: 3,
    title: 'Angels Camp',
    subtitle: 'The Celebrated Claim',
    description: 'Follow the Mokelumne River to Angels Camp in Calaveras County. Hear tales of jumping frogs, witness the discovery of the 195-pound Carson Hill nugget, and stake your own claim in the Mother Lode.',
    maps: ['ch3_angels_camp', 'ch3_hillside'],
    startMap: 'ch3_angels_camp',
    puzzleType: 'pattern',
    completionDialogue: 'ch3_complete',
  },
  4: {
    id: 4,
    title: 'The Ranch',
    subtitle: 'Building Back of Beyond',
    description: 'With fortune in hand, Pryor builds his dream in the foothills. Explore the property that would become Back of Beyond Ranch - the same locations you can visit today.',
    maps: ['ch4_ranch'],
    startMap: 'ch4_ranch',
    puzzleType: 'memory',
    completionDialogue: 'ch4_complete',
  },
  5: {
    id: 5,
    title: 'The Legacy',
    subtitle: 'The Golden Hooves',
    description: 'It is 1890. Tobias prepares to hide his greatest treasure and leave clues for future generations. The Oh Susanna cipher, the hearth stone symbols, the star chart - all begin here.',
    maps: ['ch5_ranch_final'],
    startMap: 'ch5_ranch_final',
    puzzleType: 'cipher',
    completionDialogue: 'ch5_complete',
  },
}

// ============================================
// PUZZLES - Tied to Character Attributes
// ============================================

// Chapter 1-2: Single attribute check puzzles
// Chapter 3-4: Multiple checks OR item use
// Chapter 5: Complex multi-step with skill combinations

export const puzzles: Record<string, Puzzle> = {
  // Chapter 1: STR Puzzle - Moving a fallen log
  ch1_fallen_log: {
    id: 'ch1_fallen_log',
    name: 'The Fallen Log',
    description: 'A massive oak has fallen across the trail, blocking your path. You must move it to continue.',
    type: 'strength',
    chapter: 1,
    primaryAttribute: 'str',
    steps: [
      {
        id: 'push_log',
        description: 'Push the heavy log aside',
        type: 'attribute_check',
        attributeCheck: { attribute: 'str', dc: 12 },
        successMessage: 'With a mighty heave, you roll the log aside!',
        failureMessage: 'The log barely budges. You need more strength.',
        hintMessage: 'Try using a lever from nearby branches to gain mechanical advantage.',
        allowRetry: true,
        maxAttempts: 3,
      },
    ],
    xpReward: 50,
    objectiveReward: 'trail_cleared',
    timeLimit: 0,
    difficulty: 'easy',
  },

  // Chapter 1: WIS Puzzle - Reading trail signs
  ch1_trail_signs: {
    id: 'ch1_trail_signs',
    name: 'Trail Markers',
    description: 'Several trails diverge ahead. Old blazes on trees might show the way, but which ones are recent?',
    type: 'wisdom',
    chapter: 1,
    primaryAttribute: 'wis',
    steps: [
      {
        id: 'read_blazes',
        description: 'Examine the tree blazes to find the right path',
        type: 'skill_check',
        skillCheck: { skill: 'wilderness_survival', dc: 10 },
        successMessage: 'You spot fresh axe marks leading northwest - this is the way!',
        failureMessage: 'The blazes all look the same to you.',
        hintMessage: 'Fresh blazes show lighter wood underneath. Look for the newest cuts.',
        allowRetry: true,
        maxAttempts: 2,
      },
    ],
    xpReward: 40,
    timeLimit: 0,
    difficulty: 'easy',
  },

  // Chapter 2: INT Puzzle - Decode a message
  ch2_coded_letter: {
    id: 'ch2_coded_letter',
    name: 'The Prospector\'s Code',
    description: 'An old prospector left a coded letter about a rich vein. Can you decode his cipher?',
    type: 'intelligence',
    chapter: 2,
    primaryAttribute: 'int',
    steps: [
      {
        id: 'decode_cipher',
        description: 'Decode the simple substitution cipher',
        type: 'choice',
        options: [
          { text: 'NORTH FORK', correct: true, hint: 'The letter mentions "where the sun rises on the water"' },
          { text: 'SOUTH FORK', correct: false, hint: 'The letter says the opposite direction...' },
          { text: 'DEAD MANS CREEK', correct: false, hint: 'That name doesn\'t match the cipher pattern.' },
          { text: 'GOLD GULCH', correct: false, hint: 'Too obvious - the prospector was more clever.' },
        ],
        successMessage: 'You crack the code! NORTH FORK is where the gold awaits!',
        failureMessage: 'That doesn\'t match the cipher pattern. Think about the letter hints.',
        hintMessage: 'Each letter is shifted by 3 positions. A becomes D, B becomes E...',
        allowRetry: true,
        maxAttempts: 4,
      },
    ],
    xpReward: 75,
    unlockReward: 'north_fork_revealed',
    timeLimit: 0,
    difficulty: 'medium',
  },

  // Chapter 2: DEX Puzzle - Gold panning technique
  ch2_gold_panning: {
    id: 'ch2_gold_panning',
    name: 'The Art of Panning',
    description: 'A veteran miner offers to test your panning skills. Master the technique to earn his respect.',
    type: 'dexterity',
    chapter: 2,
    primaryAttribute: 'dex',
    steps: [
      {
        id: 'fill_pan',
        description: 'Fill the pan with river gravel at the right spot',
        type: 'skill_check',
        skillCheck: { skill: 'panning', dc: 8 },
        successMessage: 'You select a promising section of the streambed.',
        failureMessage: 'That gravel looks too sandy - no gold there.',
        allowRetry: true,
      },
      {
        id: 'wash_technique',
        description: 'Use the proper circular wash motion',
        type: 'skill_check',
        skillCheck: { skill: 'panning', dc: 10 },
        successMessage: 'Your steady hands keep the heavy gold while washing away the light material!',
        failureMessage: 'Too jerky! You\'re losing gold flakes over the edge.',
        hintMessage: 'Keep the pan tilted slightly and use smooth, circular motions.',
        allowRetry: true,
        maxAttempts: 3,
      },
    ],
    xpReward: 60,
    itemReward: { id: 'gold_dust_pouch', name: 'Pouch of Gold Dust', icon: '💰', description: 'A small pouch containing fine gold dust worth $15' },
    timeLimit: 0,
    difficulty: 'medium',
  },

  // Chapter 3: Multi-check puzzle (STR or item)
  ch3_cave_entrance: {
    id: 'ch3_cave_entrance',
    name: 'The Hidden Cave',
    description: 'A promising cave entrance is blocked by fallen rocks. Clear them to explore inside.',
    type: 'multi',
    chapter: 3,
    primaryAttribute: 'str',
    steps: [
      {
        id: 'clear_rocks',
        description: 'Clear the rockfall blocking the entrance',
        type: 'attribute_check',
        attributeCheck: { attribute: 'str', dc: 14 },
        successMessage: 'You heave the boulders aside, revealing a dark passage!',
        failureMessage: 'The rocks are too heavy to move by hand.',
        hintMessage: 'Maybe a pickaxe or crowbar could help break them up?',
        allowRetry: false,  // But can use item instead
      },
      {
        id: 'clear_with_tool',
        description: 'Use a tool to break up the rocks',
        type: 'item_use',
        requiredItem: 'pickaxe',
        consumeItem: false,
        successMessage: 'Your pickaxe makes quick work of the obstruction!',
        failureMessage: 'You need a pickaxe or similar tool.',
        allowRetry: true,
      },
    ],
    xpReward: 100,
    unlockReward: 'hidden_cave_open',
    objectiveReward: 'cave_explored',
    timeLimit: 0,
    difficulty: 'medium',
  },

  // Chapter 3: WIS + INT combination
  ch3_vein_analysis: {
    id: 'ch3_vein_analysis',
    name: 'Reading the Rock',
    description: 'A quartz vein shows promise, but where exactly is the gold concentrated? Study the formation.',
    type: 'multi',
    chapter: 3,
    primaryAttribute: 'wis',
    steps: [
      {
        id: 'observe_patterns',
        description: 'Study the quartz formation for telltale signs',
        type: 'skill_check',
        skillCheck: { skill: 'prospecting', dc: 12 },
        successMessage: 'You notice iron staining and sulphide pockets - classic gold indicators!',
        failureMessage: 'The rock all looks the same to you.',
        hintMessage: 'Look for rusty coloration and dark mineral pockets in the white quartz.',
        allowRetry: true,
        maxAttempts: 2,
      },
      {
        id: 'test_sample',
        description: 'Analyze a sample to confirm gold content',
        type: 'skill_check',
        skillCheck: { skill: 'assaying', dc: 10 },
        successMessage: 'Your acid test confirms - this vein is rich with free gold!',
        failureMessage: 'You\'re not sure how to test the sample properly.',
        hintMessage: 'Use nitric acid carefully - gold won\'t dissolve but other metals will.',
        allowRetry: true,
      },
    ],
    xpReward: 120,
    itemReward: { id: 'rich_ore_sample', name: 'Rich Gold Ore', icon: '🪨', description: 'A fist-sized chunk of quartz shot through with visible gold' },
    timeLimit: 0,
    difficulty: 'hard',
  },

  // Chapter 4: CHA Puzzle - Negotiating land deal
  ch4_land_negotiation: {
    id: 'ch4_land_negotiation',
    name: 'The Land Deal',
    description: 'The current landowner is willing to sell, but drives a hard bargain. Negotiate wisely.',
    type: 'wisdom',
    chapter: 4,
    primaryAttribute: 'cha',
    steps: [
      {
        id: 'build_rapport',
        description: 'Establish common ground with the seller',
        type: 'skill_check',
        skillCheck: { skill: 'diplomacy', dc: 12 },
        successMessage: 'You bond over shared experiences on the trail. He warms to you.',
        failureMessage: 'Your small talk falls flat. He remains guarded.',
        hintMessage: 'Mention the challenges of the journey west - he went through the same.',
        allowRetry: true,
      },
      {
        id: 'read_intentions',
        description: 'Gauge what he really wants from the deal',
        type: 'skill_check',
        skillCheck: { skill: 'sense_motive', dc: 11 },
        successMessage: 'You sense he cares more about his legacy than the money.',
        failureMessage: 'You can\'t read him at all.',
        hintMessage: 'Watch his eyes when you mention different things - what makes him light up?',
        allowRetry: true,
      },
      {
        id: 'close_deal',
        description: 'Make an offer he can\'t refuse',
        type: 'skill_check',
        skillCheck: { skill: 'diplomacy', dc: 14 },
        successMessage: '"You\'ve got a deal, son. Take care of this land." You shake hands!',
        failureMessage: 'He shakes his head. "Not good enough."',
        hintMessage: 'Offer to preserve the orchard he planted and name something after him.',
        allowRetry: true,
        maxAttempts: 2,
      },
    ],
    xpReward: 150,
    itemReward: { id: 'land_deed', name: 'Property Deed', icon: '📜', description: 'The deed to 160 acres of prime foothill land' },
    objectiveReward: 'land_purchased',
    timeLimit: 0,
    difficulty: 'hard',
  },

  // Chapter 4: Ranching puzzle
  ch4_first_harvest: {
    id: 'ch4_first_harvest',
    name: 'The First Harvest',
    description: 'Your orchard is ready for its first apple harvest. Time everything perfectly.',
    type: 'wisdom',
    chapter: 4,
    primaryAttribute: 'wis',
    steps: [
      {
        id: 'check_ripeness',
        description: 'Determine optimal harvest time',
        type: 'skill_check',
        skillCheck: { skill: 'profession_ranching', dc: 10 },
        successMessage: 'The apples release easily when twisted - perfect ripeness!',
        failureMessage: 'You pick too early. The apples are sour and hard.',
        allowRetry: false,
      },
      {
        id: 'organize_crew',
        description: 'Coordinate the harvest team efficiently',
        type: 'skill_check',
        skillCheck: { skill: 'gather_info', dc: 8 },
        successMessage: 'Your crew works in perfect harmony, filling crate after crate!',
        failureMessage: 'Workers trip over each other. Some fruit gets bruised.',
        allowRetry: true,
      },
    ],
    xpReward: 80,
    objectiveReward: 'first_harvest_complete',
    timeLimit: 0,
    difficulty: 'medium',
  },

  // Chapter 5: Complex multi-step cipher puzzle
  ch5_treasure_cipher: {
    id: 'ch5_treasure_cipher',
    name: 'The Oh Susanna Cipher',
    description: 'Tobias encodes the location of his greatest treasure using the song he loved. Crack the cipher to find where the golden horseshoes are hidden.',
    type: 'sequence',
    chapter: 5,
    primaryAttribute: 'int',
    steps: [
      {
        id: 'gather_clues',
        description: 'Find all four cipher clues around the ranch',
        type: 'skill_check',
        skillCheck: { skill: 'gather_info', dc: 12 },
        successMessage: 'You\'ve found clues in the barn, hearth, well, and old oak!',
        failureMessage: 'You\'re missing some clues. Search the ranch more thoroughly.',
        hintMessage: 'Check places that were important to Tobias: where he worked, warmed himself, drew water, and rested.',
        allowRetry: true,
      },
      {
        id: 'decode_musical',
        description: 'Recognize the musical notation pattern',
        type: 'skill_check',
        skillCheck: { skill: 'navigation', dc: 10 },  // Using navigation as a proxy for pattern recognition
        successMessage: 'The notes spell out compass directions! N-E-S-W encoded as Do-Re-Mi-Fa!',
        failureMessage: 'The musical notation seems random.',
        hintMessage: 'Think about "Oh Susanna" - each verse points a direction.',
        allowRetry: true,
      },
      {
        id: 'solve_sequence',
        description: 'Enter the final location sequence',
        type: 'sequence',
        correctSequence: ['HEARTH', 'STONE', 'THREE', 'LEFT'],
        successMessage: 'Under the third hearthstone from the left! You lift it and find... THE GOLDEN HORSESHOES!',
        failureMessage: 'That sequence doesn\'t match the cipher.',
        hintMessage: 'The cipher says: "Where warmth meets ground, count the singer\'s age, turn to the setting sun."',
        allowRetry: true,
        maxAttempts: 5,
      },
    ],
    xpReward: 300,
    itemReward: { id: 'golden_horseshoes', name: 'The Golden Horseshoes', icon: '🧲', description: 'Four horseshoes of solid California gold - Tobias\'s legendary fortune' },
    objectiveReward: 'treasure_found',
    unlockReward: 'legacy_ending',
    timeLimit: 0,
    difficulty: 'expert',
  },

  // Chapter 5: Final wisdom puzzle
  ch5_legacy_choice: {
    id: 'ch5_legacy_choice',
    name: 'The Legacy Decision',
    description: 'With fortune in hand, Tobias must decide how to secure his legacy for future generations.',
    type: 'wisdom',
    chapter: 5,
    primaryAttribute: 'wis',
    steps: [
      {
        id: 'reflect_journey',
        description: 'Reflect on everything you\'ve learned',
        type: 'attribute_check',
        attributeCheck: { attribute: 'wis', dc: 14 },
        successMessage: 'Wisdom from your journey floods back - you understand what truly matters.',
        failureMessage: 'The weight of the decision clouds your judgment.',
        hintMessage: 'Think about the people who helped you along the way.',
        allowRetry: true,
      },
      {
        id: 'final_choice',
        description: 'Choose how to preserve your legacy',
        type: 'choice',
        options: [
          { text: 'Hide the treasure for future generations', correct: true, hint: 'This creates the mystery that brings people to BOBR today' },
          { text: 'Spend it all on luxury', correct: false, hint: 'Material things fade...' },
          { text: 'Donate everything to the government', correct: false, hint: 'Would your legacy truly continue?' },
          { text: 'Take it with you to the grave', correct: false, hint: 'That would end the story here.' },
        ],
        successMessage: 'You create the cipher, hide the horseshoes, and plant the clues. Someday, someone will follow your trail and find the truth.',
        failureMessage: 'Perhaps there\'s a better path for your legacy...',
        allowRetry: true,
      },
    ],
    xpReward: 200,
    objectiveReward: 'game_complete',
    timeLimit: 0,
    difficulty: 'hard',
  },
}

// Get puzzle by ID
export function getPuzzleById(puzzleId: string): Puzzle | undefined {
  return puzzles[puzzleId]
}

// Get puzzles for a specific chapter
export function getPuzzlesForChapter(chapter: ChapterId): Puzzle[] {
  return Object.values(puzzles).filter(p => p.chapter === chapter)
}

// Get map by ID
export function getMapById(mapId: string): MapData | undefined {
  const maps: Record<string, MapData> = {
    ch1_trail,
    ch1_river,
    ch2_volcano,
    ch2_general_store,
    ch3_angels_camp,
    ch3_hillside,
    ch4_ranch,
    ch5_ranch_final,
  }
  return maps[mapId]
}

// Get dialogue by ID
export function getDialogueById(dialogueId: string): DialogueNode | undefined {
  return dialogues[dialogueId]
}

// ============================================
// FOG OF WAR - MAP VISIBILITY RULES
// ============================================

// Tiles that start fogged and must be revealed
export const MAP_FOG_TILES: Record<string, string[]> = {
  ch1_trail: ['6,3', '6,4', '6,5'],  // Bridge and water tiles - hidden until campfire story
  ch1_river: ['4,0', '5,0', '6,0'],  // Exit path - hidden until crossing challenge
  ch2_volcano: ['6,2', '7,2'],       // Secret passage
  ch3_hillside: ['2,0', '3,0', '4,0'],  // Hidden mine entrance
}

// Tiles that are completely hidden (not even visible as fog)
export const MAP_HIDDEN_TILES: Record<string, string[]> = {
  ch3_hillside: ['1,0'],  // Secret treasure room entrance
}

// Rules for revealing fog areas
export const REVEAL_RULES: RevealRule[] = [
  // Chapter 1: Receiving the first nugget from campfire story reveals the bridge location
  {
    id: 'reveal_bridge',
    triggerId: 'first_nugget',  // Item received when completing campfire story
    triggerType: 'item',
    mapId: 'ch1_trail',
    revealsPositions: ['6,3', '6,4', '6,5'],
    revealsArea: 'bridge',
  },
  // Chapter 1: Getting the prospector's map reveals river path
  {
    id: 'reveal_river_path',
    triggerId: 'prospector_map',  // Getting the map item
    triggerType: 'item',
    mapId: 'ch1_river',
    revealsPositions: ['4,0', '5,0', '6,0'],
    revealsArea: 'river_path',
  },
  // Chapter 2: Learning about secret passage
  {
    id: 'reveal_secret_passage',
    triggerId: 'ch2_secret_learned',
    triggerType: 'objective',
    mapId: 'ch2_volcano',
    revealsPositions: ['6,2', '7,2'],
    revealsArea: 'secret_passage',
  },
  // Chapter 3: Finding the hidden mine entrance
  {
    id: 'reveal_mine_entrance',
    triggerId: 'ch3_mine_hint_given',
    triggerType: 'objective',
    mapId: 'ch3_hillside',
    revealsPositions: ['2,0', '3,0', '4,0'],
    revealsArea: 'mine_entrance',
  },
]

// Get fog tiles for a specific map
export function getMapFogTiles(mapId: string): string[] {
  return MAP_FOG_TILES[mapId] || []
}

// Get hidden tiles for a specific map
export function getMapHiddenTiles(mapId: string): string[] {
  return MAP_HIDDEN_TILES[mapId] || []
}
