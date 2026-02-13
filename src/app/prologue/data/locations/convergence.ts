// Act V: Convergence at Tenochtitlan (All characters can revisit key sites)
// This act allows all 4 characters to explore together, combining their unique mechanics

import type { PrologueLocation } from './norseman'

export const CONVERGENCE_LOCATIONS: PrologueLocation[] = [
  {
    id: 'tenochtitlan_central',
    name: 'Tenochtitlan - Grand Plaza',
    description: 'The heart of the Mexica empire. Four characters from different eras and places converge here in spirit and vision, drawn by the same mystery. The Templo Mayor rises above, dedicated to Huitzilopochtli and Tlaloc. All paths lead here.',
    culturalZone: 'Aztec Capital Core',
    x: 25,
    y: 48,
    connectedTo: ['templo_mayor', 'marketplace_tlatelolco', 'sacred_causeway'],
    travelTime: 0,
    dangerLevel: 'safe',
    clueIds: ['convergence_prophecy', 'four_characters_unite'],
    puzzleIds: [],
    witnessTypes: ['mexica_priest', 'marketplace_elder', 'calmecac_scholar'],
    historicalNote: 'The Templo Mayor was the religious and political center of the Aztec world.',
    guideEntry: 'tenochtitlan',
  },

  {
    id: 'templo_mayor',
    name: 'Templo Mayor',
    description: 'The twin pyramids dedicated to war and rain. At the summit, the four consciousnesses merge — Norse spirit-walker, Mississippian dream-seer, Chumash warrior-strategist, and Incan cipher-child. Together, you see the truth: a network of knowledge spanning the continent and millennia.',
    culturalZone: 'Sacred Precinct',
    x: 24,
    y: 47,
    connectedTo: ['tenochtitlan_central', 'calmecac'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['templo_mayor_revelation', 'ancient_network_confirmed'],
    puzzleIds: ['convergence_master_puzzle'],
    witnessTypes: ['high_priest_quetzalcoatl'],
    historicalNote: 'The Templo Mayor contained offerings from across Mesoamerica, showing extensive trade and conquest.',
    guideEntry: 'templo_mayor',
  },

  {
    id: 'marketplace_tlatelolco',
    name: 'Tlatelolco Market',
    description: 'The largest marketplace in the Americas. 60,000 people gather here daily to trade. Goods from the Arctic to the Amazon. Erik recognizes Norse-style metalwork. Soaring Hawk sees Mississippian shell art. Califia spots familiar coastal designs. Yachay finds quipus and Andean textiles. The continental web, made visible.',
    culturalZone: 'Tlatelolco District',
    x: 26,
    y: 46,
    connectedTo: ['tenochtitlan_central'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['continental_trade_proof', 'artifact_synthesis'],
    puzzleIds: ['marketplace_investigation'],
    witnessTypes: ['merchant_from_north', 'merchant_from_south', 'pochteca_trader'],
    historicalNote: 'Tlatelolco market amazed the Spanish conquistadors, who compared it favorably to European markets.',
  },

  {
    id: 'calmecac',
    name: 'Calmecac - The House of Learning',
    description: 'The school where noble children learn history, astronomy, and theology. Ancient codices line the walls. Here, Yachay\'s cipher skills unlock the truth: the great civilizations shared knowledge systems. Quetzalcoatl, Viracocha, Kukulkan — different names for the same ancient wisdom-keeper tradition.',
    culturalZone: 'Educational Quarter',
    x: 23,
    y: 49,
    connectedTo: ['templo_mayor'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['codex_knowledge', 'shared_wisdom_tradition'],
    puzzleIds: ['codex_cipher_puzzle'],
    witnessTypes: ['tlamatini_sage', 'codex_painter'],
    historicalNote: 'The Calmecac educated Aztec elite in complex fields including astronomy, history, and rhetoric.',
  },

  {
    id: 'sacred_causeway',
    name: 'Iztapalapa Causeway',
    description: 'One of three causeways connecting the island city to the mainland. Walking it, Califia recognizes the strategic genius — a city both protected and connected. The same principles she used commanding her island confederation.',
    culturalZone: 'Causeway',
    x: 27,
    y: 50,
    connectedTo: ['tenochtitlan_central', 'mythical_sites_revisited'],
    travelTime: 2,
    dangerLevel: 'safe',
    clueIds: ['strategic_architecture'],
    puzzleIds: [],
    witnessTypes: [],
    historicalNote: 'The causeways could be broken to defend the city and included drawbridges for canoe passage.',
  },

  {
    id: 'mythical_sites_revisited',
    name: 'Portal to All Places',
    description: 'In the convergence vision, the boundaries of time and space blur. You can revisit key sites from all four journeys, seeing them with combined perspective. The Norse runestone. The Serpent Mound. The spiral petroglyphs. The Gate of the Sun. All part of one story.',
    culturalZone: 'Visionary Space',
    x: 30,
    y: 48,
    connectedTo: ['sacred_causeway', 'ancient_portal_network'],
    travelTime: 0,
    dangerLevel: 'safe',
    clueIds: ['unified_vision'],
    puzzleIds: ['time_space_navigation'],
    witnessTypes: ['all_ancestors'],
    historicalNote: 'This represents the game\'s "portal network" mechanic, allowing fast-travel between sacred sites.',
  },

  {
    id: 'ancient_portal_network',
    name: 'The Network Revealed',
    description: 'Six nodes of power: Serpent Mound (power source), Cahokia (hub), Chaco Canyon (waypoint), Channel Islands (maritime gate), Tiwanaku (southern anchor), Tenochtitlan (convergence point). Together they form a geometric pattern — a continental-scale sacred geography. The ancients knew. They built it. Now you understand it.',
    culturalZone: 'Mythic Revelation',
    x: 32,
    y: 50,
    connectedTo: ['mythical_sites_revisited', 'final_synthesis'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['portal_network_map', 'sacred_geometry_continental'],
    puzzleIds: ['network_geometry_puzzle'],
    witnessTypes: [],
    historicalNote: 'Speculative element drawing on real astronomical alignments and trade networks, given Stargate-level interpretation.',
  },

  {
    id: 'final_synthesis',
    name: 'The Truth Assembled',
    description: 'All clues combine. All puzzles solve. The four characters — separated by centuries and cultures — were tracing the same ancient knowledge network. Pre-Columbian America was not isolated tribes, but interconnected civilizations sharing astronomy, architecture, trade, and perhaps even visitors from across the seas. This is the prologue to the greater story. The 1849 hunt for Tobias Pryor\'s treasure is the echo of this ancient web.',
    culturalZone: 'Revelation',
    x: 35,
    y: 48,
    connectedTo: ['ancient_portal_network'],
    travelTime: 0,
    dangerLevel: 'safe',
    clueIds: ['complete_synthesis', 'bridge_to_1849'],
    puzzleIds: ['final_integration_puzzle'],
    witnessTypes: ['the_mystery_itself'],
    historicalNote: 'The Prologue connects to the main 1849 game: Tobias Pryor discovered evidence of this ancient network, leading to his mysterious treasure.',
    guideEntry: 'continental_connections',
  },
]

// Special convergence mechanic: locations unlock as characters progress
export const CONVERGENCE_UNLOCK_CONDITIONS = {
  tenochtitlan_central: { charactersRequired: 1, minProgress: 0 },
  templo_mayor: { charactersRequired: 2, minProgress: 50 },
  marketplace_tlatelolco: { charactersRequired: 2, minProgress: 30 },
  calmecac: { charactersRequired: 3, minProgress: 60 },
  sacred_causeway: { charactersRequired: 2, minProgress: 40 },
  mythical_sites_revisited: { charactersRequired: 3, minProgress: 70 },
  ancient_portal_network: { charactersRequired: 4, minProgress: 80 },
  final_synthesis: { charactersRequired: 4, minProgress: 90 },
}

export function getConvergenceLocation(id: string): PrologueLocation | undefined {
  return CONVERGENCE_LOCATIONS.find(loc => loc.id === id)
}

export function isConvergenceLocationUnlocked(
  locationId: string,
  charactersCompleted: number,
  overallProgress: number
): boolean {
  const condition = CONVERGENCE_UNLOCK_CONDITIONS[locationId as keyof typeof CONVERGENCE_UNLOCK_CONDITIONS]
  if (!condition) return false
  return charactersCompleted >= condition.charactersRequired && overallProgress >= condition.minProgress
}
