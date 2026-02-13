// Artifact trait-based mystery system for the Prologue
// Players identify artifacts by their traits to solve the continental mystery

export type TraitCategory = 'material' | 'origin_culture' | 'age_period' | 'purpose' | 'symbol_family' | 'provenance'

export type Material = 'stone' | 'gold' | 'jade' | 'obsidian' | 'bone' | 'copper' | 'shell' | 'turquoise' | 'iron' | 'silver' | 'wood' | 'fiber' | 'paper'
export type OriginCulture = 'norse' | 'mississippian' | 'chumash' | 'incan' | 'aztec' | 'maya' | 'tiwanaku' | 'hohokam' | 'anasazi'
export type AgePeriod = '600ce' | '800ce' | '1000ce' | '1200ce' | '1400ce'
export type Purpose = 'ceremonial' | 'navigational' | 'astronomical' | 'agricultural' | 'martial' | 'trade' | 'record_keeping' | 'architectural'
export type SymbolFamily = 'serpent' | 'sun' | 'bird' | 'jaguar' | 'spiral' | 'cross' | 'geometric' | 'deity'
export type Provenance = 'local' | 'traded' | 'gifted' | 'stolen' | 'unknown' | 'impossible'

export interface ArtifactTrait {
  material: Material
  originCulture: OriginCulture
  agePeriod: AgePeriod
  purpose: Purpose
  symbolFamily: SymbolFamily
  provenance: Provenance
}

export interface Artifact {
  id: string
  name: string
  description: string
  traits: ArtifactTrait
  foundAt: string // location ID
  significance: string
  historicalBasis?: string
  mystery: string // What makes this artifact special/anomalous
}

// Artifacts distributed across the 4 acts
export const PROLOGUE_ARTIFACTS: Artifact[] = [
  // ACT I: Norseman artifacts
  {
    id: 'maine_penny',
    name: 'Norse Silver Penny',
    description: 'A small silver coin bearing the profile of Olaf Kyrre, King of Norway (1067-1093 CE). Found among native artifacts at a site 1,000 miles from the nearest known Norse settlement.',
    traits: {
      material: 'silver',
      originCulture: 'norse',
      agePeriod: '1000ce',
      purpose: 'trade',
      symbolFamily: 'cross',
      provenance: 'impossible',
    },
    foundAt: 'maine_penny_site',
    significance: 'Proves Norse presence far beyond L\'Anse aux Meadows',
    historicalBasis: 'Real artifact: A genuine Norwegian penny was found at the Goddard site in Maine',
    mystery: 'How did a single Norse coin reach a Native American site in Maine? Trade? Exploration? Or something more?',
  },

  {
    id: 'kensington_runestone',
    name: 'Runestone Fragment',
    description: 'A weathered stone carved with runic inscriptions claiming "8 Goths and 22 Norwegians on exploration journey from Vinland... year 1362." The runes are authentic Old Norse, but the date is controversial.',
    traits: {
      material: 'stone',
      originCulture: 'norse',
      agePeriod: '1400ce',
      purpose: 'record_keeping',
      symbolFamily: 'cross',
      provenance: 'unknown',
    },
    foundAt: 'kensington_country',
    significance: 'If authentic, proves Norse reached interior North America centuries after L\'Anse aux Meadows',
    historicalBasis: 'The Kensington Runestone, found in Minnesota in 1898, remains hotly debated',
    mystery: 'Authentic 14th-century Norse exploration record, or an elaborate 19th-century hoax? The fylgja spirits are strangely silent.',
  },

  {
    id: 'bronze_artifact_oswego',
    name: 'Bronze Spiral Brooch',
    description: 'A bronze pin with intricate spiral designs, similar to Norse or Celtic work, but found among Iroquois artifacts. The metallurgy doesn\'t match local techniques.',
    traits: {
      material: 'copper',
      originCulture: 'norse',
      agePeriod: '1000ce',
      purpose: 'ceremonial',
      symbolFamily: 'spiral',
      provenance: 'traded',
    },
    foundAt: 'oswego_river',
    significance: 'Suggests Norse trade goods penetrated deep into North America via indigenous networks',
    mystery: 'The Iroquois elder says it\'s been in his family for twenty generations. But his people don\'t work bronze this way.',
  },

  // ACT II: Native/Mississippian artifacts
  {
    id: 'cahokia_copper_plate',
    name: 'Birdman Copper Plate',
    description: 'A ceremonial copper plate depicting a falcon-warrior, eyes weeping, holding a mace and severed head. The iconography suggests warrior-priest mythology shared across the continent.',
    traits: {
      material: 'copper',
      originCulture: 'mississippian',
      agePeriod: '1200ce',
      purpose: 'ceremonial',
      symbolFamily: 'bird',
      provenance: 'local',
    },
    foundAt: 'cahokia_monks_mound',
    significance: 'The "Birdman" motif appears from Cahokia to the Gulf Coast, suggesting widespread cult',
    historicalBasis: 'Real artifact class: Birdman tablets found across Mississippian sites',
    mystery: 'The same falcon-warrior appears in distant Spiro Mounds and even further. One religion, or cultural diffusion?',
  },

  {
    id: 'serpent_alignment_stone',
    name: 'Serpent Mound Alignment Stone',
    description: 'A carved stone marker aligned with the summer solstice sunset as seen from the serpent\'s eye. The astronomical precision rivals Stonehenge.',
    traits: {
      material: 'stone',
      originCulture: 'mississippian',
      agePeriod: '1000ce',
      purpose: 'astronomical',
      symbolFamily: 'serpent',
      provenance: 'local',
    },
    foundAt: 'serpent_mound',
    significance: 'Proves sophisticated astronomical knowledge encoded in earthwork architecture',
    historicalBasis: 'Serpent Mound aligns with solar events, though exact purpose debated',
    mystery: 'In Dream Walking, you see the serpent connecting to others like it — a network of serpent sites across the land.',
  },

  {
    id: 'chaco_turquoise_cache',
    name: 'Turquoise Necklace',
    description: 'Thousands of turquoise beads forming an elaborate necklace. The turquoise comes from mines 300 miles away. The craftsmanship suggests Mesoamerican influence.',
    traits: {
      material: 'turquoise',
      originCulture: 'anasazi',
      agePeriod: '1000ce',
      purpose: 'ceremonial',
      symbolFamily: 'geometric',
      provenance: 'traded',
    },
    foundAt: 'pueblo_bonito',
    significance: 'Proves extensive trade between Chaco and Mesoamerican civilizations',
    historicalBasis: 'Pueblo Bonito contained 200,000+ pieces of turquoise and Mexican scarlet macaws',
    mystery: 'The pattern of the beads encodes astronomical data. The same pattern appears in Cahokia shell work.',
  },

  // ACT III: Califia/Chumash artifacts
  {
    id: 'chumash_plank_canoe_model',
    name: 'Tomol Canoe Model',
    description: 'A detailed miniature of a Chumash plank canoe, sealed with tar. This technology — planked boats with sewn seams — is found in only a few places worldwide, including Polynesia.',
    traits: {
      material: 'wood',
      originCulture: 'chumash',
      agePeriod: '1200ce',
      purpose: 'navigational',
      symbolFamily: 'geometric',
      provenance: 'local',
    },
    foundAt: 'mainland_landing',
    significance: 'Advanced maritime technology suggesting possible trans-Pacific contact',
    historicalBasis: 'Chumash tomol technology was sophisticated and unique in North America',
    mystery: 'Why do only the Chumash and Polynesians use this specific plank-and-tar technique? Independent invention or ancient contact?',
  },

  {
    id: 'jade_pendant_mystery',
    name: 'Jade Deity Pendant',
    description: 'A carved jade pendant depicting a deity figure. The jade isn\'t from North America — it\'s nephrite jade matching sources in Asia or New Zealand. The carving style resembles both Maori and Olmec work.',
    traits: {
      material: 'jade',
      originCulture: 'chumash',
      agePeriod: '1200ce',
      purpose: 'ceremonial',
      symbolFamily: 'deity',
      provenance: 'impossible',
    },
    foundAt: 'jade_quarry',
    significance: 'Suggests trans-Pacific contact or trade in pre-Columbian era',
    historicalBasis: 'Some pre-Columbian jade artifacts show unclear sourcing and working techniques',
    mystery: 'Califia recognizes this symbol — it matches petroglyphs from distant islands. How?',
  },

  {
    id: 'spiral_petroglyph_tracing',
    name: 'Spiral Rock Carving',
    description: 'A complex spiral pattern carved into basalt. Identical spirals appear in Chumash painted caves, Hohokam petroglyphs, and even Norse art. A universal symbol or evidence of contact?',
    traits: {
      material: 'stone',
      originCulture: 'hohokam',
      agePeriod: '1000ce',
      purpose: 'ceremonial',
      symbolFamily: 'spiral',
      provenance: 'local',
    },
    foundAt: 'mystery_site',
    significance: 'The spiral motif appears globally — convergent symbolism or ancient diffusion?',
    mystery: 'The same spiral. In Norse runestones. In Mississippian shell art. In desert petroglyphs. In Polynesian tattoos. Why?',
  },

  // ACT IV: Incan artifacts
  {
    id: 'gate_of_sun_rubbing',
    name: 'Gate of the Sun Inscription',
    description: 'A rubbing from the Gate of the Sun at Tiwanaku. The central Viracocha figure is surrounded by geometric patterns that, when decoded as Yachay does, reveal astronomical alignments matching Cahokia\'s Woodhenge.',
    traits: {
      material: 'stone',
      originCulture: 'tiwanaku',
      agePeriod: '800ce',
      purpose: 'astronomical',
      symbolFamily: 'deity',
      provenance: 'local',
    },
    foundAt: 'tiwanaku_gate',
    significance: 'Pre-Incan civilization showing astronomical knowledge on par with Mississippian cultures',
    historicalBasis: 'The Gate of the Sun is real and its iconography remains partially undeciphered',
    mystery: 'Viracocha, the bearded creator god. Quetzalcoatl, the feathered serpent. Same story, different names?',
  },

  {
    id: 'quipu_mathematical_cipher',
    name: 'Astronomical Quipu',
    description: 'A quipu (knotted string) encoding not tributes or census data, but mathematical relationships. Star positions. Planetary cycles. The same data encoded in Mayan hieroglyphs and Mississippian earthwork alignments.',
    traits: {
      material: 'fiber',
      originCulture: 'incan',
      agePeriod: '1400ce',
      purpose: 'astronomical',
      symbolFamily: 'geometric',
      provenance: 'local',
    },
    foundAt: 'machu_picchu',
    significance: 'Proves quipus could encode complex mathematical and astronomical data, not just accounts',
    historicalBasis: 'Quipus remain partially undeciphered; recent research suggests mathematical encoding',
    mystery: 'This quipu describes star positions... and land routes to the north. A map encoded in knots.',
  },

  {
    id: 'puma_punku_h_block',
    name: 'Precision Stone Block',
    description: 'A perfectly cut H-shaped block from Puma Punku, with drill holes and right angles accurate to fractions of a millimeter. The precision suggests advanced tools — but the Tiwanaku had only stone and copper.',
    traits: {
      material: 'stone',
      originCulture: 'tiwanaku',
      agePeriod: '800ce',
      purpose: 'architectural',
      symbolFamily: 'geometric',
      provenance: 'local',
    },
    foundAt: 'puma_punku',
    significance: 'Challenges understanding of pre-Columbian technology and engineering',
    historicalBasis: 'Puma Punku\'s precision stonework is real and continues to baffle engineers',
    mystery: 'You measure it with Incan tools. The precision is impossible. What did the ancients know that was lost?',
  },

  // CONVERGENCE artifacts — found only in Act V
  {
    id: 'tenochtitlan_synthesis_codex',
    name: 'The Continental Codex',
    description: 'A secret codex in the Calmecac archives showing a map of the entire continent. Norse settlements marked in the north. Cahokia at the center. Chaco to the west. Tiwanaku to the south. All connected by trade routes and shared symbols. This map predates the Aztec empire.',
    traits: {
      material: 'paper',
      originCulture: 'aztec',
      agePeriod: '1400ce',
      purpose: 'record_keeping',
      symbolFamily: 'geometric',
      provenance: 'unknown',
    },
    foundAt: 'calmecac',
    significance: 'Proves the Aztecs inherited knowledge of continental-scale networks',
    mystery: 'Who made the original map? How did they know? The codex is a copy of something much older.',
  },

  {
    id: 'feathered_serpent_universal',
    name: 'Quetzalcoatl-Viracocha Idol',
    description: 'A small jade carving showing a deity with both feathered serpent (Mesoamerican) and staff-god (Andean) attributes. It shouldn\'t exist — the Inca and Aztec never met. Or did they?',
    traits: {
      material: 'jade',
      originCulture: 'maya',
      agePeriod: '600ce',
      purpose: 'ceremonial',
      symbolFamily: 'serpent',
      provenance: 'impossible',
    },
    foundAt: 'templo_mayor',
    significance: 'Suggests ancient cultural exchange between Mesoamerica and Andean civilizations',
    mystery: 'The same god. The same myths. Separated by 3,000 miles. The ancients knew what we forgot.',
  },
]

// Helper functions
export function getArtifact(id: string): Artifact | undefined {
  return PROLOGUE_ARTIFACTS.find(a => a.id === id)
}

export function getArtifactsByLocation(locationId: string): Artifact[] {
  return PROLOGUE_ARTIFACTS.filter(a => a.foundAt === locationId)
}

const TRAIT_CATEGORY_TO_KEY: Record<TraitCategory, keyof ArtifactTrait> = {
  material: 'material',
  origin_culture: 'originCulture',
  age_period: 'agePeriod',
  purpose: 'purpose',
  symbol_family: 'symbolFamily',
  provenance: 'provenance',
}

export function getArtifactsByTrait(category: TraitCategory, value: string): Artifact[] {
  const key = TRAIT_CATEGORY_TO_KEY[category]
  return PROLOGUE_ARTIFACTS.filter(a => a.traits[key] === value)
}

// Mystery solving: match artifact traits to identify unknown items
export function matchArtifactTraits(
  knownTraits: Partial<ArtifactTrait>
): Artifact[] {
  return PROLOGUE_ARTIFACTS.filter(artifact => {
    return Object.entries(knownTraits).every(
      ([key, value]) => artifact.traits[key as keyof ArtifactTrait] === value
    )
  })
}

// Convergence puzzle: find artifacts that share unexpected traits
export function findAnomalousConnections(): Array<{
  artifacts: Artifact[]
  sharedTrait: string
  significance: string
}> {
  return [
    {
      artifacts: [
        getArtifact('bronze_artifact_oswego')!,
        getArtifact('spiral_petroglyph_tracing')!,
      ],
      sharedTrait: 'spiral symbolism',
      significance: 'Norse and Southwest cultures share the spiral motif',
    },
    {
      artifacts: [
        getArtifact('serpent_alignment_stone')!,
        getArtifact('gate_of_sun_rubbing')!,
      ],
      sharedTrait: 'astronomical precision',
      significance: 'Mississippian and Tiwanaku cultures both encoded astronomy in monuments',
    },
    {
      artifacts: [
        getArtifact('jade_pendant_mystery')!,
        getArtifact('feathered_serpent_universal')!,
      ],
      sharedTrait: 'impossible provenance',
      significance: 'Artifacts suggesting trans-oceanic contact or ancient diffusion',
    },
  ]
}
