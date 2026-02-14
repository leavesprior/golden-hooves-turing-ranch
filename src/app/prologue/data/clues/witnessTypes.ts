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

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT II: Native/Mississippian witnesses (Soaring Hawk)
  // ═══════════════════════════════════════════════════════════════════════════

  foreign_merchant: {
    id: 'foreign_merchant',
    name: 'Foreign Merchant',
    description: 'A trader from distant lands who has journeyed to Cahokia\'s Grand Plaza. Speaks broken Dhegihan and carries goods from the far south.',
    culturalAffiliation: ['mesoamerican'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Can compare Cahokian goods with Mesoamerican equivalents',
    bias: 'Exaggerates the wealth of his homeland to impress',
  },

  calendar_keeper: {
    id: 'calendar_keeper',
    name: 'Calendar Keeper',
    description: 'Apprentice astronomer who maintains the wooden post markers at Woodhenge. Tracks solstices, equinoxes, and the 18.6-year lunar cycle.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Provides precise astronomical alignment data',
  },

  elder_astronomer: {
    id: 'elder_astronomer',
    name: 'Elder Astronomer',
    description: 'Senior sky-watcher who has observed the heavens for forty years. Knows the star patterns and their sacred meanings.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can correlate astronomical events with artifact symbolism',
  },

  copper_smith: {
    id: 'copper_smith',
    name: 'Copper Smith',
    description: 'Master metalworker who shapes Lake Superior copper into ceremonial objects. Can identify copper sources by color and weight.',
    culturalAffiliation: ['mississippian'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Identifies metalwork origins and techniques',
  },

  pottery_master: {
    id: 'pottery_master',
    name: 'Pottery Master',
    description: 'Expert ceramicist whose vessels are traded across the city. Decorates with sacred symbols and can identify style origins.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'high',
    clueQuality: 'strong',
  },

  common_citizen: {
    id: 'common_citizen',
    name: 'Common Citizen',
    description: 'A resident of Cahokia\'s residential district. Knows the everyday rhythms of the city and the gossip of the markets.',
    culturalAffiliation: ['mississippian'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Relies on market rumors rather than firsthand knowledge',
  },

  burial_priest: {
    id: 'burial_priest',
    name: 'Burial Priest',
    description: 'Keeper of the sacred burial rites at Mound 72. Handles grave goods from across the continent and knows their provenance.',
    culturalAffiliation: ['mississippian', 'cahokia'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can authenticate artifact age and origin from burial context',
  },

  ancestor_spirit: {
    id: 'ancestor_spirit',
    name: 'Ancestor Spirit',
    description: 'A voice from the Dreamtime, speaking through the sacred burial ground. Offers cryptic wisdom about the dead and their connections.',
    culturalAffiliation: ['mississippian'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Speaks in riddles and metaphors from the spirit world',
    specialAbility: 'Reveals hidden connections between the living and the dead',
  },

  serpent_keeper: {
    id: 'serpent_keeper',
    name: 'Serpent Keeper',
    description: 'Guardian of the Great Serpent Mound. Maintains the earthwork and interprets its astronomical alignments.',
    culturalAffiliation: ['fort_ancient'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Knows the serpent\'s astronomical alignments and their cosmological meaning',
  },

  ancient_spirit: {
    id: 'ancient_spirit',
    name: 'Ancient Spirit',
    description: 'A presence felt at sacred earthwork sites. In the Dreamtime, it speaks of builders who aligned their works to the cosmos.',
    culturalAffiliation: ['universal'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Mystical visions may conflate different eras',
    specialAbility: 'Reveals the original intent of ancient builders',
  },

  hopewell_descendant: {
    id: 'hopewell_descendant',
    name: 'Hopewell Descendant',
    description: 'Claims lineage from the ancient earthwork builders. Preserves oral traditions about the geometric enclosures and their purposes.',
    culturalAffiliation: ['hopewell'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Family stories may embellish the builders\' achievements',
    specialAbility: 'Oral tradition preserves construction techniques and purposes',
  },

  geometry_priest: {
    id: 'geometry_priest',
    name: 'Geometry Priest',
    description: 'Scholar who maintains the mathematical knowledge embedded in the Newark earthworks. Understands the lunar cycle encoding.',
    culturalAffiliation: ['hopewell'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can decode geometric and mathematical relationships in earthwork designs',
  },

  copper_merchant: {
    id: 'copper_merchant',
    name: 'Copper Merchant',
    description: 'Trader specializing in Great Lakes copper. Knows every mine from Superior to Michigan and the routes south.',
    culturalAffiliation: ['fort_ancient'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can trace copper artifacts to their geological source',
  },

  shell_dealer: {
    id: 'shell_dealer',
    name: 'Shell Dealer',
    description: 'Trades marine shells from the Gulf Coast hundreds of miles north. Conch shells, whelks, and carved gorgets are currency here.',
    culturalAffiliation: ['fort_ancient'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Identifies shell origins and trade routes from Gulf to Ohio',
  },

  caddoan_trader: {
    id: 'caddoan_trader',
    name: 'Caddoan Trader',
    description: 'Merchant from the Caddoan Mississippian culture at Spiro Mounds. Bridges eastern Mississippian and southwestern trade networks.',
    culturalAffiliation: ['caddoan', 'mississippian'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Knows the trade connections between Mississippian and Southwest cultures',
  },

  plains_merchant: {
    id: 'plains_merchant',
    name: 'Plains Merchant',
    description: 'A nomadic trader who crosses the Great Plains carrying goods between the mound cities and the canyon builders.',
    culturalAffiliation: ['plains'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Firsthand knowledge of the plains trade corridor',
  },

  plains_nomad: {
    id: 'plains_nomad',
    name: 'Plains Nomad',
    description: 'A wanderer of the grasslands who follows the buffalo herds. Has crossed the plains many times and seen distant signal fires.',
    culturalAffiliation: ['plains'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Prefers practical knowledge over spiritual interpretation',
  },

  chaco_scout: {
    id: 'chaco_scout',
    name: 'Chaco Scout',
    description: 'Runner who patrols the great roads radiating from Chaco Canyon. Carries messages between the great houses and outlier communities.',
    culturalAffiliation: ['anasazi', 'chaco'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Knows the Chaco road network and signal system',
  },

  warrior_queen_vision: {
    id: 'warrior_queen_vision',
    name: 'Warrior Queen Vision',
    description: 'In the Dreamtime at Pueblo Bonito, a vision of a fierce queen from western shores. She speaks of jade and plank canoes and a land called California.',
    culturalAffiliation: ['universal'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'A Dreamtime vision — truth wrapped in symbolism',
    specialAbility: 'Foreshadows Act III and connects Chaco to coastal cultures',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT III: Califia/Chumash witnesses (Queen Califia)
  // ═══════════════════════════════════════════════════════════════════════════

  mainland_chief: {
    id: 'mainland_chief',
    name: 'Mainland Chief',
    description: 'Leader of the largest Chumash mainland settlement. Manages the trade port where coastal and inland routes converge.',
    culturalAffiliation: ['chumash'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Controls trade records showing goods from distant cultures',
  },

  trade_coordinator: {
    id: 'trade_coordinator',
    name: 'Trade Coordinator',
    description: 'Specialist who manages the flow of shell beads (Chumash currency), obsidian, and other goods through the mainland trade port.',
    culturalAffiliation: ['chumash'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can trace trade goods to their origin by the routes they traveled',
  },

  yaanga_elder: {
    id: 'yaanga_elder',
    name: 'Yaanga Elder',
    description: 'Wise leader of the largest Tongva settlement. Remembers generations of trade relationships and the strangest goods that passed through.',
    culturalAffiliation: ['tongva'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Oral history records unusual artifacts and their owners',
  },

  jade_merchant: {
    id: 'jade_merchant',
    name: 'Jade Merchant',
    description: 'Specialist trader who deals exclusively in green stones. Can distinguish nephrite from jadeite and knows which deposits produce which color.',
    culturalAffiliation: ['tongva'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify jade sources by mineral composition and color',
  },

  desert_guide: {
    id: 'desert_guide',
    name: 'Desert Guide',
    description: 'A Mojave pathfinder who knows every spring and campsite across the desert. Has guided traders to the canyon cities and back.',
    culturalAffiliation: ['mojave'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Knowledge of desert routes connecting California to the Southwest',
  },

  paiute_guide: {
    id: 'paiute_guide',
    name: 'Paiute Guide',
    description: 'A Southern Paiute who navigates the Great Basin highlands. Knows the seasonal camps and hidden water sources.',
    culturalAffiliation: ['paiute'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Knows locations of mineral deposits including green stones',
  },

  shoshone_elder: {
    id: 'shoshone_elder',
    name: 'Shoshone Elder',
    description: 'Wisdom keeper of the Great Basin Shoshone. Preserves stories of ancient travelers who came from across the western ocean.',
    culturalAffiliation: ['shoshone'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Oral traditions may blend events across centuries',
    specialAbility: 'Preserves ancient stories of trans-Pacific visitors',
  },

  stone_worker: {
    id: 'stone_worker',
    name: 'Stone Worker',
    description: 'Artisan who shapes jade and other green stones into tools and ornaments. Can identify working techniques foreign to the region.',
    culturalAffiliation: ['shoshone', 'paiute'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can distinguish local stoneworking from foreign techniques',
  },

  quipu_child_vision: {
    id: 'quipu_child_vision',
    name: 'Quipu Child Vision',
    description: 'At the vision quest site, you glimpse a child from a distant southern empire, carrying knotted strings and speaking of feathered serpent gods.',
    culturalAffiliation: ['universal'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'A vision — symbolic rather than literal',
    specialAbility: 'Foreshadows Act IV and connects California to Andean cultures',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT IV: Incan/Andean witnesses (Yachay Wasi)
  // ═══════════════════════════════════════════════════════════════════════════

  stone_carver_descendant: {
    id: 'stone_carver_descendant',
    name: 'Stone Carver Descendant',
    description: 'Claims descent from the ancient Tiwanaku stone workers. Preserves oral traditions about the Gate of the Sun\'s construction and meaning.',
    culturalAffiliation: ['tiwanaku', 'aymara'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Preserves stone-carving techniques and iconographic meanings',
  },

  chasqui_runner: {
    id: 'chasqui_runner',
    name: 'Chasqui Runner',
    description: 'Imperial message runner who covers vast distances along the royal road. Carries news and small packages between cities in relay.',
    culturalAffiliation: ['inca'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Knows every way-station and rumor along the royal road',
  },

  trader: {
    id: 'trader',
    name: 'Andean Trader',
    description: 'Merchant who travels the Inca roads carrying goods between the highlands and the coast. Knows the value and origin of everything.',
    culturalAffiliation: ['inca'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Can identify trade goods from across the empire and beyond',
  },

  temple_priest: {
    id: 'temple_priest',
    name: 'Coricancha Temple Priest',
    description: 'Serves at the golden Temple of the Sun in Cusco. Maintains astronomical records and sacred calendar observations.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Provides astronomical and calendrical data from Inca records',
  },

  estate_keeper: {
    id: 'estate_keeper',
    name: 'Royal Estate Keeper',
    description: 'Caretaker of Machu Picchu. Guards the hidden chambers and their contents. Speaks reluctantly but truthfully.',
    culturalAffiliation: ['inca'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Knows the secrets hidden within Machu Picchu\'s architecture',
  },

  nazca_descendant: {
    id: 'nazca_descendant',
    name: 'Nazca Descendant',
    description: 'Inheritor of the Nazca tradition. Preserves knowledge of the great desert drawings and their mathematical relationships.',
    culturalAffiliation: ['nazca'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Elevates Nazca achievements above other cultures',
    specialAbility: 'Knows the mathematical and astronomical purpose of the Nazca Lines',
  },

  coastal_trader: {
    id: 'coastal_trader',
    name: 'Coastal Trader',
    description: 'Sailor who trades along the Pacific coast from Chile to Ecuador using balsa rafts. Has seen goods from impossibly distant sources.',
    culturalAffiliation: ['chimu', 'inca'],
    reliability: 'high',
    clueQuality: 'strong',
    specialAbility: 'Knows the coastal trade routes and foreign goods that arrive by sea',
  },

  frontier_trader: {
    id: 'frontier_trader',
    name: 'Frontier Trader',
    description: 'Operates beyond the empire\'s northern border, trading with peoples the Inca have never conquered. Brings back strange stories.',
    culturalAffiliation: ['inca'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    specialAbility: 'Has traveled further north than any official Inca expedition',
  },

  northern_traveler: {
    id: 'northern_traveler',
    name: 'Northern Traveler',
    description: 'A mysterious figure who claims to have visited the great cities of the north. Speaks of pyramids, feathered serpents, and floating gardens.',
    culturalAffiliation: ['unknown'],
    reliability: 'moderate',
    clueQuality: 'moderate',
    bias: 'Stories may be exaggerated or secondhand',
    specialAbility: 'Provides rare descriptions of Mesoamerican civilizations from an Andean perspective',
  },

  aztec_priest: {
    id: 'aztec_priest',
    name: 'Aztec Priest',
    description: 'A Mexica priest encountered at Tenochtitlan. Serves the dual gods of creation and destruction. Keeper of codices recording continental history.',
    culturalAffiliation: ['aztec', 'mexica'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Can decode codex symbols and compare them with Andean iconography',
  },

  feathered_serpent_priest: {
    id: 'feathered_serpent_priest',
    name: 'Feathered Serpent Priest',
    description: 'Devoted to Quetzalcoatl at the great pyramid. Recognizes the Andean staff-god as a kindred deity. Holds the key to the continental synthesis.',
    culturalAffiliation: ['aztec'],
    reliability: 'very_high',
    clueQuality: 'definitive',
    specialAbility: 'Reveals the deep connection between Quetzalcoatl and Viracocha traditions',
  },

  convergence_vision: {
    id: 'convergence_vision',
    name: 'Convergence Vision',
    description: 'At the great pyramid, all threads come together. Visions of the Norseman, the Dream-Walker, and the Warrior Queen converge with your own journey.',
    culturalAffiliation: ['universal'],
    reliability: 'high',
    clueQuality: 'strong',
    bias: 'Symbolic synthesis rather than literal testimony',
    specialAbility: 'Reveals how all four journeys connect into a single continental story',
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
