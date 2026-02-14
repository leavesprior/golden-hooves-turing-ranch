// Witness types for the Prologue mystery investigation
// Each witness has cultural context, reliability, and clue quality

export type WitnessReliability = 'very_high' | 'high' | 'moderate' | 'low' | 'unreliable'
export type ClueQuality = 'definitive' | 'strong' | 'moderate' | 'weak' | 'speculative'

export interface WitnessType {
  id: string
  name: string
  description: string
  culturalAffiliation: string[]
  reliability: WitnessReliability
  clueQuality: ClueQuality
  specialAbility?: string
  bias?: string
}

export const WITNESS_TYPES: Record<string, WitnessType> = {
  // Norse/Vinland witnesses
  norse_shipwright: {
    id: 'norse_shipwright',
    name: 'Norse Shipwright',
    description: 'Skilled craftsmen who build and repair the knarr ships. They know the routes and the distances sailed.',
    culturalAffiliation: ['norse'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can confirm navigational routes and distances',
  },

  beothuk_elder: {
    id: 'beothuk_elder',
    name: 'Beothuk Elder',
    description: 'Keeper of oral traditions about the pale strangers who came from across the sea.',
    culturalAffiliation: ['beothuk'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Views Norse through indigenous perspective',
  },

  norse_trader: {
    id: 'norse_trader',
    name: 'Norse Trader',
    description: 'Merchants who trade with indigenous peoples. They speak of goods moving far inland.',
    culturalAffiliation: ['norse'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Knows trade routes and exchange networks',
  },

  // Mi'kmaq and coastal witnesses
  mikmaq_elder: {
    id: 'mikmaq_elder',
    name: 'Mi\'kmaq Elder',
    description: 'Wisdom keeper with stories passed down through generations about pale-skinned visitors.',
    culturalAffiliation: ['mikmaq'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Oral tradition may conflate different events across time',
  },

  mikmaq_trader: {
    id: 'mikmaq_trader',
    name: 'Mi\'kmaq Trader',
    description: 'Travels widely along the coast and inland, connecting trade networks.',
    culturalAffiliation: ['mikmaq'],
    reliability: 'moderate',
    clueQuality: 'moderate',
  },

  wabanaki_shaman: {
    id: 'wabanaki_shaman',
    name: 'Wabanaki Shaman',
    description: 'Spiritual leader who interprets signs and omens. Speaks of metal from the sky.',
    culturalAffiliation: ['wabanaki'],
    reliability: 'moderate',
    clueQuality: 'weak',
    bias: 'Interprets physical evidence through spiritual lens',
    specialAbility: 'Provides mystical insights that occasionally reveal truth',
  },

  // Iroquois/Great Lakes witnesses
  iroquois_elder: {
    id: 'iroquois_elder',
    name: 'Iroquois Elder',
    description: 'Keeper of the Great Law and tribal history. Has artifacts passed down for generations.',
    culturalAffiliation: ['iroquois', 'haudenosaunee'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can authenticate artifact age and provenance through family lineage',
  },

  iroquois_guide: {
    id: 'iroquois_guide',
    name: 'Iroquois Guide',
    description: 'Knows the rivers and portages of the Great Lakes. Speaks of ancient travelers.',
    culturalAffiliation: ['iroquois'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  // Mississippian/Cahokia witnesses
  morning_star_priest: {
    id: 'morning_star_priest',
    name: 'Morning Star Priest',
    description: 'High priest of the Cahokia sky-watching cult. Interprets astronomical alignments and cosmic cycles.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can decode astronomical alignments and calendar systems',
  },

  astronomer_priest: {
    id: 'astronomer_priest',
    name: 'Astronomer-Priest',
    description: 'Scholar who tracks the movements of sun, moon, and stars. Maintains the Woodhenge calendar.',
    culturalAffiliation: ['mississippian'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Provides precise astronomical data',
  },

  cahokia_priest: {
    id: 'cahokia_priest',
    name: 'Cahokia Priest',
    description: 'Temple keeper who maintains the sacred traditions and artifact collections.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  dream_walker: {
    id: 'dream_walker',
    name: 'Dream-Walker',
    description: 'Spiritual practitioner who can enter the Dreamtime and commune with ancestors.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Information comes from visions, not physical evidence',
    specialAbility: 'Reveals hidden connections through spiritual insight',
  },

  marketplace_trader: {
    id: 'marketplace_trader',
    name: 'Marketplace Trader',
    description: 'Merchant who handles goods from across the continent. Knows what comes from where.',
    culturalAffiliation: ['mississippian'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify artifact origins by material and style',
  },

  chunkey_champion: {
    id: 'chunkey_champion',
    name: 'Chunkey Champion',
    description: 'Athlete and gambler who interacts with visitors from distant lands at tournaments.',
    culturalAffiliation: ['mississippian'],
    reliability: 'moderate',
    clueQuality: 'moderate',
  },

  // Anasazi/Chaco witnesses
  chaco_priest: {
    id: 'chaco_priest',
    name: 'Chaco Priest',
    description: 'Keeper of the great houses and their sacred knowledge. Manages the turquoise trade.',
    culturalAffiliation: ['anasazi', 'chaco'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  turquoise_trader: {
    id: 'turquoise_trader',
    name: 'Turquoise Trader',
    description: 'Merchant who travels the roads connecting Chaco to the Mexican civilizations.',
    culturalAffiliation: ['anasazi'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Confirms Chaco-Mesoamerica trade connections',
  },

  // Chumash/California witnesses
  island_chief: {
    id: 'island_chief',
    name: 'Island Chief',
    description: 'Leader of the Channel Islands Chumash. Commands the tomol fleet and maritime trade.',
    culturalAffiliation: ['chumash'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  canoe_master: {
    id: 'canoe_master',
    name: 'Tomol Canoe Master',
    description: 'Master builder of the sophisticated plank canoes. Guards the guild secrets.',
    culturalAffiliation: ['chumash'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify maritime technology and seafaring capabilities',
  },

  cave_keeper: {
    id: 'cave_keeper',
    name: 'Painted Cave Keeper',
    description: 'Guardian of the sacred painted caves and their astronomical alignments.',
    culturalAffiliation: ['chumash'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  shaman: {
    id: 'shaman',
    name: 'Chumash Shaman',
    description: 'Spiritual leader who interprets the cave paintings and cosmological symbols.',
    culturalAffiliation: ['chumash'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Spiritual interpretation may obscure practical knowledge',
  },

  // Tongva and desert witnesses
  tongva_chief: {
    id: 'tongva_chief',
    name: 'Tongva Chief',
    description: 'Leader who controls the Los Angeles Basin and its trade routes.',
    culturalAffiliation: ['tongva'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  obsidian_trader: {
    id: 'obsidian_trader',
    name: 'Obsidian Trader',
    description: 'Merchant specializing in volcanic glass from distant sources. Knows the provenance of every piece.',
    culturalAffiliation: ['tongva', 'mojave'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify obsidian sources by geological signature',
  },

  mojave_trader: {
    id: 'mojave_trader',
    name: 'Mojave River Trader',
    description: 'Desert specialist who controls the trade corridor through the Mojave.',
    culturalAffiliation: ['mojave'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  // Incan/Andean witnesses
  lake_fisherman: {
    id: 'lake_fisherman',
    name: 'Titicaca Fisherman',
    description: 'Lives on the sacred lake in a totora reed boat. Knows the old stories from before the Inca.',
    culturalAffiliation: ['inca', 'aymara'],
    reliability: 'moderate',
    clueQuality: 'moderate',
  },

  inca_elder: {
    id: 'inca_elder',
    name: 'Inca Elder',
    description: 'Amautas — wise teacher who preserves the oral traditions of the empire.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  sun_temple_priest: {
    id: 'sun_temple_priest',
    name: 'Temple of the Sun Priest',
    description: 'Serves Inti the sun god. Maintains astronomical observations and sacred calendar.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  quipu_keeper: {
    id: 'quipu_keeper',
    name: 'Quipucamayoc',
    description: 'Master of the quipu knot-records. Can decode the hidden layers of meaning.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can decode quipus to reveal mathematical and astronomical data',
  },

  chief_quipucamayoc: {
    id: 'chief_quipucamayoc',
    name: 'Chief Quipucamayoc',
    description: 'Head of all quipu keepers. Has access to the imperial archives and secret knowledge.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can authenticate ancient quipus and decode hidden messages',
  },

  inca_noble: {
    id: 'inca_noble',
    name: 'Inca Noble',
    description: 'Member of the royal family with education in history, astronomy, and governance.',
    culturalAffiliation: ['inca'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  master_stoneworker: {
    id: 'master_stoneworker',
    name: 'Master Stoneworker',
    description: 'Inheritor of ancient stone-cutting techniques. Works on Sacsayhuaman.',
    culturalAffiliation: ['inca'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can explain (or fail to explain) precision stonework techniques',
  },

  aymara_elder: {
    id: 'aymara_elder',
    name: 'Aymara Elder',
    description: 'Descendant of the Tiwanaku civilization. Preserves pre-Incan knowledge.',
    culturalAffiliation: ['aymara', 'tiwanaku'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Tiwanaku achievements sometimes exaggerated in oral tradition',
  },

  // Aztec/Mesoamerican witnesses
  mexica_priest: {
    id: 'mexica_priest',
    name: 'Mexica Priest',
    description: 'Serves at the Templo Mayor. Expert in the sacred calendar and cosmology.',
    culturalAffiliation: ['aztec', 'mexica'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  high_priest_quetzalcoatl: {
    id: 'high_priest_quetzalcoatl',
    name: 'High Priest of Quetzalcoatl',
    description: 'Keeper of the feathered serpent mysteries and the prophecies of return.',
    culturalAffiliation: ['aztec'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can explain connections between Quetzalcoatl and other creator-god traditions',
  },

  tlamatini_sage: {
    id: 'tlamatini_sage',
    name: 'Tlamatini (Wise One)',
    description: 'Philosopher-teacher at the Calmecac. Educated in history, astronomy, and rhetoric.',
    culturalAffiliation: ['aztec'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },

  codex_painter: {
    id: 'codex_painter',
    name: 'Codex Painter',
    description: 'Tlacuilo — scribe who creates and maintains the pictographic codices.',
    culturalAffiliation: ['aztec'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can decode and explain codex symbols and records',
  },

  pochteca_trader: {
    id: 'pochteca_trader',
    name: 'Pochteca Merchant',
    description: 'Member of the elite merchant class who trades across Mesoamerica and beyond.',
    culturalAffiliation: ['aztec'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Knows trade networks extending from the Arctic to the Amazon',
  },

  // Beothuk witnesses
  beothuk_trader: {
    id: 'beothuk_trader',
    name: 'Beothuk Trader',
    description: 'A Beothuk man who trades red ochre and furs with the Norse settlers. He speaks some Old Norse and bridges two worlds.',
    culturalAffiliation: ['beothuk'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Can identify goods traded between Norse and indigenous peoples',
  },

  // Wabanaki witnesses
  wabanaki_trader: {
    id: 'wabanaki_trader',
    name: 'Wabanaki Trader',
    description: 'Travels the river networks from the coast to the interior, carrying copper, shells, and stories from distant peoples.',
    culturalAffiliation: ['wabanaki'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Knows the continental trade routes and what goods travel along them',
  },

  // Iroquois/Great Lakes witnesses (additional)
  iroquois_merchant: {
    id: 'iroquois_merchant',
    name: 'Iroquois Merchant',
    description: 'Trades obsidian, copper, and rare stones across the Great Lakes region. Has seen artifacts from very far away.',
    culturalAffiliation: ['iroquois', 'haudenosaunee'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify the origin of trade goods by material and workmanship',
  },

  iroquois_smith: {
    id: 'iroquois_smith',
    name: 'Iroquois Metalworker',
    description: 'Works copper into tools and ornaments. Immediately recognizes that certain bronze artifacts use techniques unknown to his people.',
    culturalAffiliation: ['iroquois', 'haudenosaunee'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can analyze metallurgy and identify foreign metalworking techniques',
  },

  // St. Lawrence Iroquoian witnesses
  st_lawrence_iroquoian: {
    id: 'st_lawrence_iroquoian',
    name: 'St. Lawrence Iroquoian',
    description: 'One of the river people who will mysteriously vanish within centuries. Knows the waterways better than anyone alive.',
    culturalAffiliation: ['st_lawrence_iroquoian'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Knowledge limited to the river corridor',
  },

  hochelaga_chief: {
    id: 'hochelaga_chief',
    name: 'Hochelaga Chief',
    description: 'Leader of the fortified village on Montreal Island. Commands respect from river traders and maintains the palisade walls.',
    culturalAffiliation: ['st_lawrence_iroquoian'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Has access to the village archives and ancestral knowledge',
  },

  iroquoian_elder: {
    id: 'iroquoian_elder',
    name: 'Iroquoian Elder',
    description: 'Ancient keeper of the longhouse traditions. Remembers stories from before the great confederacy was formed.',
    culturalAffiliation: ['st_lawrence_iroquoian', 'iroquois'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Oral history spans generations of contact with distant travelers',
  },

  // Neutral Nation witnesses
  neutral_nation_priest: {
    id: 'neutral_nation_priest',
    name: 'Neutral Nation Priest',
    description: 'Spiritual leader of the people who keep peace between the warring nations. Guards the sacred portage around the Thunder of Waters.',
    culturalAffiliation: ['neutral_nation'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Interprets artifacts through spiritual significance rather than origin',
    specialAbility: 'Knowledge of sacred sites and their astronomical alignments',
  },

  // Erie Nation witnesses
  erie_trader: {
    id: 'erie_trader',
    name: 'Erie Trader',
    description: 'Merchant of the Erie Nation who controls the southern lake shore trade. Has seen goods from the Mississippi and beyond.',
    culturalAffiliation: ['erie'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Connects Great Lakes trade networks to the Mississippi corridor',
  },

  western_lake_traveler: {
    id: 'western_lake_traveler',
    name: 'Western Lake Traveler',
    description: 'A wanderer who has journeyed to the far western lakes and returned with tales of strange stones carved with unknown symbols.',
    culturalAffiliation: ['erie', 'ojibwe'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Stories may be embellished from retelling across many campfires',
  },

  // Ojibwe witnesses
  ojibwe_elder: {
    id: 'ojibwe_elder',
    name: 'Ojibwe Elder',
    description: 'Keeper of the Midewiwin lodge and its sacred scrolls. Knows the migration stories of the Anishinaabe people from the eastern sea.',
    culturalAffiliation: ['ojibwe', 'anishinaabe'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Birch bark scrolls contain migration records spanning centuries',
  },

  // Cahokia outer witnesses
  cahokia_scout: {
    id: 'cahokia_scout',
    name: 'Cahokia Scout',
    description: 'Patrol who watches the approaches to the great city. Has seen travelers from every direction and knows what they carry.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Can describe the diversity of peoples who visit Cahokia',
  },

  // Special convergence witnesses
  spirit_guide: {
    id: 'spirit_guide',
    name: 'Spirit Guide',
    description: 'A manifestation in the convergence vision. Speaks with the voice of ancient wisdom.',
    culturalAffiliation: ['universal'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Mystical and metaphorical rather than literal',
    specialAbility: 'Reveals connections across time and space',
  },

  all_ancestors: {
    id: 'all_ancestors',
    name: 'The Chorus of Ancestors',
    description: 'In the final vision, the voices of all who came before speak as one.',
    culturalAffiliation: ['universal'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Synthesizes knowledge from all cultures and eras',
  },

  the_mystery_itself: {
    id: 'the_mystery_itself',
    name: 'The Mystery Itself',
    description: 'The truth, revealed at last. Not a witness, but the answer.',
    culturalAffiliation: ['universal'],
    reliability: 'very_high',
    clueQuality: 'definitive',
  },
}

// Helper functions
export function getWitnessType(id: string): WitnessType | undefined {
  return WITNESS_TYPES[id]
}

export function getWitnessesByCulture(culture: string): WitnessType[] {
  return Object.values(WITNESS_TYPES).filter(w =>
    w.culturalAffiliation.includes(culture)
  )
}

export function getReliabilityScore(reliability: WitnessReliability): number {
  const scores = {
    very_high: 5,
    high: 4,
    moderate: 3,
    low: 2,
    unreliable: 1,
  }
  return scores[reliability]
}

export function getClueQualityScore(quality: ClueQuality): number {
  const scores = {
    definitive: 5,
    strong: 4,
    moderate: 3,
    weak: 2,
    speculative: 1,
  }
  return scores[quality]
}
