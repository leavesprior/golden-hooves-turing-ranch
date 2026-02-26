/**
 * Game Menu Sections — UI Navigation Configuration
 *
 * Defines the sidebar/menu sections available during gameplay,
 * filtered by the current GamePhase. Each section belongs to a
 * category and specifies which phases it should appear in.
 */

import type { GamePhase } from '../oregonTrailContext'

// ============================================================================
// TYPES
// ============================================================================

export interface MenuSection {
  id: string
  label: string
  icon: string
  category: 'journey' | 'party' | 'investigation' | 'economy' | 'world' | 'meta'
  availablePhases: GamePhase[]
  alwaysVisible?: boolean
}

// ============================================================================
// MENU SECTIONS
// ============================================================================

export const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'trail_map',
    label: 'Trail Map',
    icon: '\ud83d\uddfa\ufe0f',
    category: 'journey',
    availablePhases: [
      'traveling', 'town', 'world_map',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'party_posse',
    label: 'Party & Posse',
    icon: '\ud83e\udd20',
    category: 'party',
    availablePhases: [
      'traveling', 'town', 'event', 'settlement',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'bounty_journal',
    label: 'Bounty Journal',
    icon: '\ud83d\udcdc',
    category: 'investigation',
    availablePhases: [
      'traveling', 'town', 'investigation', 'witness',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'notebook',
    label: 'Notebook',
    icon: '\ud83d\udcd3',
    category: 'investigation',
    availablePhases: [
      'title', 'chapter_intro', 'menu', 'character_creation',
      'outfitting', 'traveling', 'event', 'town', 'hunting',
      'river', 'investigation', 'witness', 'dossier', 'telegraph',
      'journal', 'world_map', 'ranch_management',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
      'settlement', 'settlement_victory', 'complete', 'game_over',
    ],
  },
  {
    id: 'supplies',
    label: 'Supplies',
    icon: '\ud83e\uddf0',
    category: 'economy',
    availablePhases: [
      'traveling', 'town', 'outfitting', 'settlement',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'karma_wallet',
    label: 'Karma Wallet',
    icon: '\u2696\ufe0f',
    category: 'economy',
    availablePhases: [
      'traveling', 'town', 'outfitting', 'settlement',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'character_sheet',
    label: 'Character Sheet',
    icon: '\ud83d\udcc4',
    category: 'party',
    availablePhases: [
      'chapter_intro', 'character_creation', 'outfitting',
      'traveling', 'event', 'town', 'hunting', 'river',
      'investigation', 'witness', 'dossier', 'telegraph',
      'journal', 'world_map', 'ranch_management',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
      'settlement', 'settlement_victory', 'complete', 'game_over',
    ],
  },
  {
    id: 'reputation',
    label: 'Reputation',
    icon: '\u2b50',
    category: 'party',
    availablePhases: [
      'traveling', 'town', 'settlement',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'npc_relations',
    label: 'NPC Relations',
    icon: '\ud83e\udd1d',
    category: 'party',
    availablePhases: [
      'traveling', 'town',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
    ],
  },
  {
    id: 'camp_services',
    label: 'Camp Services',
    icon: '\u26fa',
    category: 'party',
    availablePhases: [
      'traveling', 'town', 'settlement',
    ],
  },
  {
    id: 'book_your_stay',
    label: 'Book Your Stay',
    icon: '\ud83c\udfe8',
    category: 'meta',
    availablePhases: [],
    alwaysVisible: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '\u2699\ufe0f',
    category: 'meta',
    availablePhases: [],
    alwaysVisible: true,
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Return only the menu sections that should be visible during the given phase.
 * Sections marked `alwaysVisible` are always included.
 */
export function getAvailableSections(phase: GamePhase): MenuSection[] {
  return MENU_SECTIONS.filter(
    section => section.alwaysVisible || section.availablePhases.includes(phase)
  )
}

/**
 * Return sections filtered by category
 */
export function getSectionsByCategory(
  category: MenuSection['category'],
  phase?: GamePhase,
): MenuSection[] {
  const pool = phase ? getAvailableSections(phase) : MENU_SECTIONS
  return pool.filter(s => s.category === category)
}
