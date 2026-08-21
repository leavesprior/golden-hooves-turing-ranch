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
    label: 'Map',
    icon: '\ud83d\uddfa\ufe0f',
    category: 'journey',
    availablePhases: [
      'traveling', 'town', 'world_map',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
      'outfitting', 'event', 'river',
    ],
    alwaysVisible: true,
  },
  {
    id: 'nearby',
    label: 'Nearby',
    icon: '\ud83d\udccd',
    category: 'world',
    availablePhases: [],
    alwaysVisible: true,
  },
  {
    id: 'party_posse',
    label: 'Party',
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
    label: 'Journal',
    icon: '\ud83d\udcdc',
    category: 'investigation',
    availablePhases: [
      'traveling', 'town', 'investigation', 'witness',
      'gold_country_arrival', 'gold_country_explore',
      'gold_country_location', 'gold_country_travel',
      'journal',
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
    id: 'character_sheet',
    label: 'Character',
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
