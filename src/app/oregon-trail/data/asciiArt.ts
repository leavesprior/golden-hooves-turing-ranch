/**
 * DOS-Style ASCII Art for Settlement Buildings, Terrain, and UI
 *
 * All art uses standard ASCII/box-drawing characters for the retro DOS aesthetic.
 * Each piece is designed for monospace font rendering in the game's CRT-style UI.
 * Art scales: 'small' (inline badges), 'medium' (panels), 'large' (full-screen scenes)
 */

// ============================================================================
// SETTLEMENT BUILDINGS — Upgrade visually as player improves them
// ============================================================================

export interface ASCIIArt {
  id: string
  name: string
  art: string
  width: number
  height: number
  category: 'building' | 'terrain' | 'character' | 'item' | 'scene' | 'ui'
}

export const SETTLEMENT_BUILDINGS: Record<string, ASCIIArt> = {
  // Property Tier 0: Empty camp
  camp: {
    id: 'camp',
    name: 'Camp',
    category: 'building',
    width: 20,
    height: 6,
    art: `
    /\\
   /  \\
  /    \\
 /______\\
 |      |
~~~~~~~~~~ `,
  },

  // Property Tier 1: Tent
  tent: {
    id: 'tent',
    name: 'Canvas Tent',
    category: 'building',
    width: 22,
    height: 7,
    art: `
      /\\
     /  \\
    / __ \\
   / |  | \\
  /__|  |__\\
 ~~~~~~~~~~~~
  * campfire *`,
  },

  // Property Tier 2: Cabin
  cabin: {
    id: 'cabin',
    name: 'Log Cabin',
    category: 'building',
    width: 24,
    height: 8,
    art: `
   ___________
  /           \\
 /  _______  _|\\
|  |       || ||
|  |       || ||
|  |_______||_||
|_______________|
  [==] [==] [==]`,
  },

  // Property Tier 3: Homestead
  homestead: {
    id: 'homestead',
    name: 'Homestead',
    category: 'building',
    width: 30,
    height: 9,
    art: `
   _____  ___________
  |     |/           \\
  |  _  /  _______  _|\\
  | |#| |  |       || ||
  | |#| |  |  ___  || ||
  |_|#|_|  | |   | ||_||
  |_____|  |_|___|_|___|
   chimney   homestead
  ~~~~~~~~~~~~~~~~~~~~~~~~`,
  },

  // Property Tier 4: Ranch House
  ranch_house: {
    id: 'ranch_house',
    name: 'Ranch House',
    category: 'building',
    width: 36,
    height: 10,
    art: `
   _____  _________________
  |  #  |/                 \\
  |  #  /   ___    ___   __|\\
  |  #  |  |   |  |   | |  ||
  |  #  |  | W |  | W | |  ||
  |  #  |  |___|  |___| |  ||
  |_____|  |     []     ||__||
  chimney  |_door_______|____|
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  \\fence/  \\fence/  \\fence/`,
  },

  // Property Tier 5: Estate
  estate: {
    id: 'estate',
    name: 'Gold Country Estate',
    category: 'building',
    width: 44,
    height: 12,
    art: `
           _/\\_
   _____  |    |  _________________
  |  #  | |BELL| /                 \\
  |  #  | |____//   ___    ___   __|\\
  |  #  |======|   |   |  |   | |  ||
  |  #  |  WW  |   | W |  | W | |  ||
  |  #  |  WW  |   |___|  |___| |  ||
  |_____|______|   |     []     ||__||
  |  veranda   |   |_door_______|____|
  |____________|~~~~~~~~~~~~~~~~~~~~~~~
  \\ gate /  \\fence/  \\corral/  \\barn/`,
  },

  // Individual buildings
  barn: {
    id: 'barn',
    name: 'Barn',
    category: 'building',
    width: 20,
    height: 7,
    art: `
     /\\
    /  \\
   / __ \\
  |_|  |_|
  | |[]| |
  | |  | |
  |_|__|_|`,
  },

  workshop: {
    id: 'workshop',
    name: 'Workshop',
    category: 'building',
    width: 20,
    height: 6,
    art: `
   ___________
  |  WORKSHOP |
  |  _     _  |
  | |A|   |A| |
  | |_| * |_| |
  |___________|`,
  },

  storehouse: {
    id: 'storehouse',
    name: 'Storehouse',
    category: 'building',
    width: 18,
    height: 6,
    art: `
   ___________
  | STOREHOUSE|
  | [=][=][=] |
  | [=][=][=] |
  | [=][=][=] |
  |___________|`,
  },

  general_store: {
    id: 'general_store',
    name: 'General Store',
    category: 'building',
    width: 22,
    height: 7,
    art: `
   _______________
  | GENERAL STORE |
  |  ___    ___   |
  | |   |  |   |  |
  | | $ |  | $ |  |
  | |___|  |___|  |
  |_____[]________|`,
  },

  saloon: {
    id: 'saloon',
    name: 'Saloon',
    category: 'building',
    width: 24,
    height: 8,
    art: `
   _________________
  |    S A L O O N  |
  |  ___  ||  ___   |
  | | W | || | W |  |
  | |___| || |___|  |
  |       ||        |
  |  |==| || |==|   |
  |__|||__||__|||___|`,
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel',
    category: 'building',
    width: 26,
    height: 9,
    art: `
   ____________________
  |      H O T E L     |
  |  ___  ___  ___  _  |
  | |202||201||200||S| |
  | |___||___||___||T| |
  | |102||101||100||A| |
  | |___||___||___||I| |
  |       LOBBY    |R| |
  |______[]________|_|_|`,
  },
}

// ============================================================================
// TERRAIN LANDSCAPES — Shown during travel phase
// ============================================================================

export const TERRAIN_ART: Record<string, ASCIIArt> = {
  plains: {
    id: 'plains',
    name: 'Great Plains',
    category: 'terrain',
    width: 40,
    height: 7,
    art: `
              ___
   __    \\  /   \\     __
~~(  )~~~~\\/     \\~~~(  )~~
   --      |  .  |    --
  . . . .  | . . | . . . .
 ._._._._._|_____|_._._._.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
  },

  mountains: {
    id: 'mountains',
    name: 'Sierra Nevada',
    category: 'terrain',
    width: 40,
    height: 8,
    art: `
        /\\      /\\
       /  \\  /\\/  \\
      / /\\ \\/  /\\  \\
     / /  \\   /  \\  \\
    / /    \\_/    \\  \\
   / /              \\ \\
  /_/  *  *  *  *  * \\_\\
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
  },

  desert: {
    id: 'desert',
    name: 'Alkali Desert',
    category: 'terrain',
    width: 40,
    height: 7,
    art: `
        \\|/
     --- * ---          _
        /|\\            / \\
                /|    |   |
  ~~~         / | \\  |___|
 .  . ~ .  . ~ . ~ . ~ . ~ .
~.~.~.~.~.~.~.~.~.~.~.~.~.~`,
  },

  river: {
    id: 'river',
    name: 'River Crossing',
    category: 'terrain',
    width: 40,
    height: 8,
    art: `
  \\  |      |  /
   \\ | FORD |  /
 ___\\|______|/__________
 ~~~~~~~~~~~~~~~~~~~~~~~~
 ~~~~~ ~~ ~~~ ~~ ~~~~~~~~
 ~~~~~~~~~~~~~~~~~~~~~~~~
 ________________________
   THIS SIDE  |  FAR SIDE`,
  },

  forest: {
    id: 'forest',
    name: 'Pine Forest',
    category: 'terrain',
    width: 40,
    height: 8,
    art: `
     /\\    /\\      /\\
    /  \\  /  \\    /  \\
   / /\\ \\/ /\\ \\  / /\\ \\
  / /  \\  /  \\ \\/ /  \\ \\
 / /    \\/    \\ \\/    \\ \\
| |    ||    ||  ||    | |
|_|    ||    ||  ||    |_|
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
  },

  gold_country: {
    id: 'gold_country',
    name: 'Gold Country',
    category: 'terrain',
    width: 44,
    height: 9,
    art: `
      /\\        GOLD COUNTRY
     /  \\    _________________
    / /\\ \\  |  Welcome to the |
   / /  \\ \\ | Mother Lode!    |
  /_/    \\_\\|_________________|
  |  ___  |
  | | $ | |  * nuggets *
  | |___| |
  |_______|~~~~~~~~~~~~~~~~~~~~~~~~`,
  },

  mining_camp: {
    id: 'mining_camp',
    name: 'Mining Camp',
    category: 'terrain',
    width: 40,
    height: 8,
    art: `
     /\\   /\\       _____
    /  \\ /  \\     |ASSAY|
   /    X    \\    |_____|
  /  MINING   \\   _| |_
 /    CAMP     \\ | pan |
/_______________\\|_____|
 [] [] sluice [] [] ~~~~
~~~~~~~~~~ creek ~~~~~~~~`,
  },
}

// ============================================================================
// CHARACTER PORTRAITS — DOS-style pixel-art character representations
// ============================================================================

export const CHARACTER_PORTRAITS: Record<string, ASCIIArt> = {
  pinkerton: {
    id: 'pinkerton',
    name: 'Pinkerton Detective',
    category: 'character',
    width: 14,
    height: 8,
    art: `
   _______
  |  ___  |
  | |o o| |
  | | ^  ||
  | \\___/ |
  |  |||  |
  | /| |\\ |
  |/ | | \\|`,
  },

  outlaw: {
    id: 'outlaw',
    name: 'Outlaw',
    category: 'character',
    width: 14,
    height: 8,
    art: `
   _______
  | WANTED|
  | |x x| |
  | |bandana|
  | \\===/ |
  |  |||  |
  | /| |\\ |
  |/ | | \\|`,
  },

  miner: {
    id: 'miner',
    name: 'Gold Miner',
    category: 'character',
    width: 14,
    height: 8,
    art: `
   _______
  | (hat) |
  | |o o| |
  | |beard||
  | \\___/ |
  | pick  |
  | /| |\\ |
  |/ | | \\|`,
  },

  twain: {
    id: 'twain',
    name: 'Mark Twain',
    category: 'character',
    width: 16,
    height: 9,
    art: `
    _________
   | ~~~~~   |
   | |o  o|  |
   | | \\/ |  |
   |  moustache
   | \\____/  |
   |  suit   |
   | /|  |\\ |
   |/ |  | \\|`,
  },

  black_bart: {
    id: 'black_bart',
    name: 'Black Bart',
    category: 'character',
    width: 16,
    height: 9,
    art: `
    _________
   |   TOP   |
   |   HAT   |
   | |o  o|  |
   | | gentleman
   | \\    /  |
   |  coat   |
   | /|  |\\ |
   |  PO8    |`,
  },
}

// ============================================================================
// UI ELEMENTS — Borders, dividers, karma display frames
// ============================================================================

export const UI_FRAMES = {
  karma_wallet: `
+==========================+
|    K A R M A  W A L L E T |
+==========================+
| Good  (🍪): %-12s|
| Neutral(🌮): %-12s|
| Bad   (🪨): %-12s|
+==========================+
| Alignment: %-13s|
+==========================+`,

  reputation_bar: `
[%-20s] %3d%%
 %s`,

  mystery_board: `
+================================+
|     E V I D E N C E  B O A R D |
+================================+
| Case: %-24s|
+--------------------------------+
| Clues Found: %d / %d           |
| %-30s|
| %-30s|
| %-30s|
+--------------------------------+
| Status: %-22s|
+================================+`,

  settlement_status: `
+================================+
|   S E T T L E M E N T         |
+================================+
| Property: %-20s|
| Business: %-20s|
| Days:     %-20s|
| Net Worth: $%-18s|
+--------------------------------+
| Mastery:  %-20s|
+================================+`,
}

// ============================================================================
// SOUND DESIGN HOOKS — Event triggers for future audio implementation
// ============================================================================

export type SoundEvent =
  | 'karma_good_earned'
  | 'karma_bad_earned'
  | 'karma_neutral_earned'
  | 'level_up'
  | 'badge_earned'
  | 'mystery_solved'
  | 'mystery_clue_found'
  | 'building_complete'
  | 'business_upgrade'
  | 'encounter_start'
  | 'encounter_success'
  | 'encounter_fail'
  | 'travel_day_advance'
  | 'town_arrival'
  | 'narrator_lie'
  | 'narrator_twain'
  | 'narrator_fourth_wall'
  | 'narrator_drinking'
  | 'spiritual_site_visit'
  | 'ally_recruited'
  | 'ally_betrayal'
  | 'horse_gallop'
  | 'gold_discovered'
  | 'river_crossing'
  | 'storm'
  | 'campfire'
  | 'saloon_music'
  | 'game_over'
  | 'game_win'

export interface SoundHook {
  event: SoundEvent
  description: string
  mood: 'positive' | 'negative' | 'neutral' | 'dramatic' | 'ambient'
  priority: 'high' | 'medium' | 'low'
  visualEffect?: string  // CSS class or animation trigger
}

export const SOUND_HOOKS: SoundHook[] = [
  // Karma events
  { event: 'karma_good_earned', description: 'Golden shimmer sound', mood: 'positive', priority: 'medium', visualEffect: 'flash-golden' },
  { event: 'karma_bad_earned', description: 'Dark pulse', mood: 'negative', priority: 'medium', visualEffect: 'flash-dark' },
  { event: 'karma_neutral_earned', description: 'Coin clink', mood: 'neutral', priority: 'low', visualEffect: 'flash-taco' },

  // Achievement events
  { event: 'level_up', description: 'Triumphant fanfare', mood: 'positive', priority: 'high', visualEffect: 'screen-flash-gold' },
  { event: 'badge_earned', description: 'Badge stamp sound', mood: 'positive', priority: 'medium', visualEffect: 'badge-stamp' },
  { event: 'mystery_solved', description: 'Case closed sting', mood: 'dramatic', priority: 'high', visualEffect: 'evidence-board-complete' },
  { event: 'mystery_clue_found', description: 'Magnifying glass chime', mood: 'positive', priority: 'medium', visualEffect: 'clue-highlight' },

  // Building events
  { event: 'building_complete', description: 'Hammer final nail', mood: 'positive', priority: 'high', visualEffect: 'building-reveal' },
  { event: 'business_upgrade', description: 'Cash register cha-ching', mood: 'positive', priority: 'medium', visualEffect: 'business-glow' },

  // Encounter events
  { event: 'encounter_start', description: 'Dramatic reveal', mood: 'dramatic', priority: 'high', visualEffect: 'screen-shake' },
  { event: 'encounter_success', description: 'Victory chord', mood: 'positive', priority: 'medium' },
  { event: 'encounter_fail', description: 'Defeat chord', mood: 'negative', priority: 'medium' },

  // Travel events
  { event: 'travel_day_advance', description: 'Wagon wheel creak', mood: 'neutral', priority: 'low' },
  { event: 'town_arrival', description: 'Town bustle ambient', mood: 'positive', priority: 'medium', visualEffect: 'town-approach' },

  // Narrator events
  { event: 'narrator_lie', description: 'Suspicious music sting', mood: 'dramatic', priority: 'medium', visualEffect: 'text-wobble' },
  { event: 'narrator_twain', description: 'Banjo twang', mood: 'neutral', priority: 'low', visualEffect: 'text-amber' },
  { event: 'narrator_fourth_wall', description: 'Record scratch', mood: 'dramatic', priority: 'high', visualEffect: 'screen-crack' },
  { event: 'narrator_drinking', description: 'Glass clink + hiccup', mood: 'neutral', priority: 'low', visualEffect: 'text-sway' },

  // Spiritual events
  { event: 'spiritual_site_visit', description: 'Wind chimes + flute', mood: 'ambient', priority: 'medium', visualEffect: 'aura-glow' },

  // Ally events
  { event: 'ally_recruited', description: 'Handshake + approving crowd', mood: 'positive', priority: 'high' },
  { event: 'ally_betrayal', description: 'Knife draw + gasp', mood: 'negative', priority: 'high', visualEffect: 'screen-red-flash' },

  // Ambient events
  { event: 'horse_gallop', description: 'Hooves on dirt', mood: 'ambient', priority: 'low' },
  { event: 'gold_discovered', description: 'Glittering nugget reveal', mood: 'positive', priority: 'high', visualEffect: 'sparkle-burst' },
  { event: 'river_crossing', description: 'Rushing water', mood: 'ambient', priority: 'medium' },
  { event: 'storm', description: 'Thunder + rain', mood: 'dramatic', priority: 'medium', visualEffect: 'screen-darken' },
  { event: 'campfire', description: 'Crackling fire', mood: 'ambient', priority: 'low', visualEffect: 'warm-glow' },
  { event: 'saloon_music', description: 'Tinny piano ragtime', mood: 'ambient', priority: 'low' },

  // Game events
  { event: 'game_over', description: 'Somber organ', mood: 'negative', priority: 'high', visualEffect: 'screen-fade-black' },
  { event: 'game_win', description: 'Full orchestra celebration', mood: 'positive', priority: 'high', visualEffect: 'fireworks' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSettlementArt(propertyTier: number): ASCIIArt {
  const tierMap: Record<number, string> = {
    0: 'camp',
    1: 'tent',
    2: 'cabin',
    3: 'homestead',
    4: 'ranch_house',
    5: 'estate',
  }
  return SETTLEMENT_BUILDINGS[tierMap[propertyTier] || 'camp']
}

export function getTerrainArt(terrain: string): ASCIIArt | null {
  return TERRAIN_ART[terrain] || null
}

export function getBuildingArt(buildingType: string): ASCIIArt | null {
  return SETTLEMENT_BUILDINGS[buildingType] || null
}

export function getCharacterPortrait(characterId: string): ASCIIArt | null {
  return CHARACTER_PORTRAITS[characterId] || null
}

export function getSoundHook(event: SoundEvent): SoundHook | undefined {
  return SOUND_HOOKS.find(h => h.event === event)
}

export function getSoundHooksByMood(mood: SoundHook['mood']): SoundHook[] {
  return SOUND_HOOKS.filter(h => h.mood === mood)
}

/**
 * Format a UI frame template with values.
 * Uses printf-style %s and %d placeholders.
 */
export function formatUIFrame(template: string, ...values: (string | number)[]): string {
  let result = template
  let valueIndex = 0
  result = result.replace(/%-?\d*[sd]/g, (match) => {
    if (valueIndex >= values.length) return match
    const val = values[valueIndex++]
    const widthMatch = match.match(/%-?(\d+)/)
    if (widthMatch) {
      const width = parseInt(widthMatch[1])
      const str = String(val)
      return match.includes('-')
        ? str.padEnd(width)
        : str.padStart(width)
    }
    return String(val)
  })
  return result
}
