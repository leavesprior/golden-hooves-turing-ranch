// Historical facts organized by verification tier
// Gold: confirmed by mainstream archaeology
// Silver: plausible theories with some evidence
// Bronze: entertaining fringe theories (Stargate-level fun)

export interface HistoricalFact {
  id: string
  title: string
  content: string
  tier: 'gold' | 'silver' | 'bronze'
  culture: string
  timePeriod: string
  sources?: string[]
  gameRelevance: string
}

export const HISTORICAL_FACTS: HistoricalFact[] = [
  // ===== NORSE CULTURE =====
  {
    id: 'norse_vinland_settlement',
    title: "Norse Settlement at L'Anse aux Meadows",
    content:
      'Archaeological excavation confirms a Norse settlement in Newfoundland dating to approximately 1000 CE. The site includes eight structures, a forge with iron slag, and worked wood. Butternut remains found at the site indicate the Norse explored south to at least New Brunswick or the St. Lawrence, since butternuts do not grow in Newfoundland.',
    tier: 'gold',
    culture: 'Norse',
    timePeriod: '1000 CE',
    sources: [
      'Parks Canada archaeological surveys',
      'Ingstad & Ingstad excavation reports (1960-1968)',
      'UNESCO World Heritage listing documentation',
    ],
    gameRelevance:
      "Erik's starting location. The butternut evidence justifies his journey south — the Norse demonstrably explored further than their one known settlement.",
  },

  {
    id: 'norse_maine_penny_find',
    title: 'The Maine Penny at Goddard Point',
    content:
      'A Norwegian silver coin minted 1065-1080 CE (reign of Olaf III Kyrre) was found at the Goddard Point archaeological site in Brooklin, Maine, in 1957. The site is a Native American habitation with over 30,000 indigenous artifacts. The coin almost certainly arrived via native trade networks rather than direct Norse presence at the site.',
    tier: 'gold',
    culture: 'Norse / Native American',
    timePeriod: '1065-1080 CE (minting); found in multi-period native site',
    sources: [
      'Maine State Museum coin analysis',
      'Kolbjorn Skaare, University of Oslo, 1979 identification',
    ],
    gameRelevance:
      'Key artifact in Act I. Demonstrates both Norse presence AND the sophistication of indigenous trade networks — the coin traveled hundreds of miles through native hands.',
  },

  {
    id: 'norse_iron_smelting',
    title: 'First Iron Smelting in the Americas',
    content:
      "The forge at L'Anse aux Meadows represents the first confirmed iron smelting in the Americas. No indigenous North American cultures smelted iron before European contact. Iron slag, a smithy hearth, and bog iron processing tools were found at the site, demonstrating the Norse brought metallurgical technology unknown to the continent.",
    tier: 'gold',
    culture: 'Norse',
    timePeriod: '1000 CE',
    sources: [
      "L'Anse aux Meadows excavation reports",
      'Birgitta Wallace, Parks Canada archaeologist',
    ],
    gameRelevance:
      "Erik's iron-working knowledge serves as a trade advantage and cultural marker. Indigenous peoples would have recognized iron as a completely novel material.",
  },

  {
    id: 'norse_great_lakes_theory',
    title: 'Norse Exploration of the Great Lakes',
    content:
      'Some researchers hypothesize that Norse explorers traveled the St. Lawrence River to reach the Great Lakes, based on geographic descriptions in the sagas and scattered artifact claims. The hypothesis is plausible given known Viking river navigation capabilities but lacks definitive archaeological proof.',
    tier: 'silver',
    culture: 'Norse',
    timePeriod: '1000-1200 CE',
    sources: [
      'Various interpretations of the Vinland Sagas',
      'Geographic analysis of saga place descriptions',
    ],
    gameRelevance:
      "Justifies Erik's travel route from L'Anse aux Meadows through the Great Lakes toward Cahokia. The silver tier means the game presents it as possible but unproven.",
  },

  {
    id: 'norse_kensington_runestone',
    title: 'The Kensington Runestone',
    content:
      'A stone slab with runic inscription found in Minnesota in 1898, allegedly describing a 1362 Norse-Geatish expedition. Mainstream scholars consider it a 19th-century forgery based on anachronistic rune forms and language. However, supporters note that some runic features match obscure medieval Scandinavian variations unknown to most 1898 forgers.',
    tier: 'bronze',
    culture: 'Norse (disputed)',
    timePeriod: '1362 CE (claimed) / 1898 CE (found)',
    sources: [
      'Runestone Museum, Alexandria MN',
      'Numerous pro/con academic publications spanning 125+ years',
    ],
    gameRelevance:
      'Bronze-tier mystery artifact. In the game, Erik carves a runestone that prefigures the Kensington discovery — the player decides whether the connection is coincidence or evidence.',
  },

  // ===== MISSISSIPPIAN / CAHOKIA CULTURE =====
  {
    id: 'cahokia_population',
    title: "Cahokia: America's First City",
    content:
      'Cahokia, located near present-day East St. Louis, Illinois, reached a peak population of 10,000-20,000 between 1050 and 1200 CE, making it the largest pre-Columbian settlement north of Mexico. At its peak it was larger than contemporary London. The city featured planned neighborhoods, public plazas, and an elaborate system of earthen mounds.',
    tier: 'gold',
    culture: 'Mississippian',
    timePeriod: '600-1400 CE',
    sources: [
      'Cahokia Mounds State Historic Site',
      'UNESCO World Heritage documentation',
      'Timothy Pauketat, "Cahokia: Ancient America\'s Great City on the Mississippi"',
    ],
    gameRelevance:
      "Soaring Hawk's home base. The city's scale and sophistication establish the Mississippian civilization as a continental power, not a backwater.",
  },

  {
    id: 'cahokia_woodhenge',
    title: 'Woodhenge Solar Calendar',
    content:
      'A series of large timber circles at Cahokia functioned as solar observatories, marking equinoxes and solstices with precise post alignments. At least five successive Woodhenge structures were built over several centuries, each slightly refined. The largest had 48 posts in a circle 410 feet in diameter.',
    tier: 'gold',
    culture: 'Mississippian',
    timePeriod: '900-1100 CE',
    sources: [
      'Warren Wittry excavation records',
      'Cahokia Mounds archaeological surveys',
    ],
    gameRelevance:
      "Central to the portal network mechanic. Woodhenge functions as the network's control interface — its astronomical alignments double as portal activation timings.",
  },

  {
    id: 'cahokia_trade_networks',
    title: 'Mississippian Continent-Wide Trade',
    content:
      'Archaeological evidence confirms Cahokia traded with cultures across North America. Artifacts found at the site include copper from the Great Lakes, shell from the Gulf of Mexico, mica from the Appalachians, and obsidian from the Rocky Mountains. Some researchers identify possible Mesoamerican connections based on shared iconography and game-playing traditions.',
    tier: 'gold',
    culture: 'Mississippian',
    timePeriod: '900-1400 CE',
    sources: [
      'Multiple archaeological surveys of Cahokia artifact provenance',
      'Great Lakes copper trade network studies',
    ],
    gameRelevance:
      "Establishes the plausibility of all four characters' paths eventually crossing. If Cahokia traded with the Rockies and the Gulf, trade connections to the Pacific coast and even South America become silver-tier plausible.",
  },

  {
    id: 'serpent_mound_alignments',
    title: 'Serpent Mound Astronomical Alignments',
    content:
      "The Great Serpent Mound in Ohio aligns with both solstice sunsets and lunar standstill events. The serpent's head points to the summer solstice sunset. Its coils may correspond to additional astronomical events. The mound was built on a cryptoexplosion structure (probable meteor impact site), which produces anomalous magnetic readings.",
    tier: 'gold',
    culture: 'Fort Ancient or Adena (debated)',
    timePeriod: '300 BCE or 1070 CE (dating debated)',
    sources: [
      'Ohio History Connection',
      'William Romain astronomical analysis',
      'Geological Survey of Ohio impact structure reports',
    ],
    gameRelevance:
      "Portal network power source. The real geological anomaly and astronomical alignments provide a factual foundation for the game's fiction about serpent energy.",
  },

  {
    id: 'mississippian_mesoamerican_parallels',
    title: 'Mississippian-Mesoamerican Cultural Parallels',
    content:
      'Striking parallels exist between Mississippian and Mesoamerican cultures: platform mound construction, chunkey/patolli gaming, the Birdman/Eagle Warrior figure, the Morning Star cult, and similar cosmological concepts. Whether these represent direct contact, indirect diffusion through trade networks, or independent invention is actively debated.',
    tier: 'silver',
    culture: 'Mississippian / Mesoamerican',
    timePeriod: '600-1400 CE',
    sources: [
      'Alice Kehoe, "Cahokia and the Mesoamerican Connection"',
      'SECC (Southeastern Ceremonial Complex) studies',
    ],
    gameRelevance:
      "Underpins the game's central mystery: why do widely separated cultures share so many features? The silver tier lets the game explore this without claiming proven contact.",
  },

  // ===== CHUMASH / CALIFIA CULTURE =====
  {
    id: 'chumash_maritime',
    title: 'Chumash Maritime Technology',
    content:
      'The Chumash of the Southern California coast developed the tomol, a sophisticated plank-sewn canoe capable of open-ocean voyages to the Channel Islands (up to 25 miles offshore). The tomol was sealed with yop (a tar and pine pitch compound) and could carry up to 4,000 pounds. This technology was unique in North America and enabled a maritime trade network spanning hundreds of miles of coastline.',
    tier: 'gold',
    culture: 'Chumash',
    timePeriod: '500-1800 CE',
    sources: [
      'Santa Barbara Museum of Natural History',
      'Travis Hudson & Thomas Blackburn, "The Material Culture of the Chumash Interaction Sphere"',
    ],
    gameRelevance:
      "Califia's primary transportation and trade capacity. The tomol fleet is her power base and enables coastal exploration gameplay.",
  },

  {
    id: 'chumash_astronomy',
    title: 'Chumash Astronomical Knowledge',
    content:
      'The Chumash possessed sophisticated astronomical knowledge, tracking the sun, moon, planets, and stars for navigation, agriculture, and ceremony. Rock art sites across Chumash territory include apparent astronomical notations. The winter solstice ceremony was the most important event in the Chumash calendar, requiring precise solar tracking.',
    tier: 'gold',
    culture: 'Chumash',
    timePeriod: '500-1800 CE',
    sources: [
      'Travis Hudson & Ernest Underhay, "Crystals in the Sky: An Intellectual Odyssey Involving Chumash Astronomy"',
      'Various Chumash rock art surveys',
    ],
    gameRelevance:
      "Califia's star chart mechanic. Her navigational expertise ties into the portal network's astronomical activation requirements.",
  },

  {
    id: 'calafia_legend_origin',
    title: 'The Literary Origins of Queen Calafia',
    content:
      'Queen Calafia appears in "Las Sergas de Esplandian" (1510) by Garci Rodriguez de Montalvo, described as ruling an island of women warriors with gold armor and trained griffins. Spanish explorers named California after this fictional island. Whether the legend drew on pre-existing indigenous traditions of powerful coastal women is speculative but not impossible given Chumash female leadership roles.',
    tier: 'gold',
    culture: 'Spanish literary / Chumash (speculative)',
    timePeriod: '1510 CE (literary); pre-contact (speculative indigenous basis)',
    sources: [
      'Montalvo, "Las Sergas de Esplandian" (1510)',
      'Dora Beale Polk, "The Island of California: A History of the Name"',
    ],
    gameRelevance:
      'Califia\'s character is explicitly built on this legend, elevated from fiction to a real Chumash leader. The game explores whether "legend" might have been "garbled history."',
  },

  {
    id: 'pacific_coast_trade',
    title: 'Pacific Coast Long-Distance Trade',
    content:
      'Archaeological evidence demonstrates trade networks extending from the Pacific Northwest to Baja California, moving obsidian, shell beads, asphaltum, and other goods over hundreds of miles. Some researchers have identified potential connections to Polynesian voyaging based on sweet potato genetics and chicken bone DNA in South America.',
    tier: 'silver',
    culture: 'Multiple Pacific coast cultures',
    timePeriod: '1000 BCE - 1500 CE',
    sources: [
      'Various Pacific coast archaeological surveys',
      'Sweet potato genetic studies (Roullier et al., 2013)',
    ],
    gameRelevance:
      "Extends Califia's trade network beyond the local coast to continental and even trans-oceanic scope. Silver tier means the game can explore Pacific connections without overclaiming.",
  },

  // ===== INCAN / ANDEAN CULTURE =====
  {
    id: 'quipu_recording_system',
    title: 'Quipu: The Knotted Record System',
    content:
      'The quipu was the primary recording device of the Inca Empire, consisting of colored strings with knots at various positions. Approximately 600 quipus survive. The decimal knot-position system for numbers is well understood, but the narrative content (which Spanish chroniclers confirm existed) has not been decoded. Some quipus may encode syllables of Quechua.',
    tier: 'gold',
    culture: 'Inca',
    timePeriod: '1400-1532 CE (Inca period); possibly much older',
    sources: [
      'Gary Urton, "Signs of the Inka Khipu"',
      'Sabine Hyland, narrative quipu research (2017)',
      'Approximately 600 surviving examples in museums worldwide',
    ],
    gameRelevance:
      "Yachay's primary mechanic. The undeciphered narrative content provides legitimate mystery space for the game's puzzle system.",
  },

  {
    id: 'tiwanaku_civilization',
    title: 'Tiwanaku: The Pre-Incan Empire',
    content:
      'Tiwanaku was a major civilization centered on Lake Titicaca (3,800m altitude) that flourished from approximately 300-1000 CE. At its height it influenced cultures across modern Bolivia, Peru, Chile, and Argentina. The civilization produced remarkable stone architecture, hydraulic engineering, and agricultural terracing. It collapsed around 1000 CE, likely due to prolonged drought.',
    tier: 'gold',
    culture: 'Tiwanaku',
    timePeriod: '300-1000 CE',
    sources: [
      'Alan Kolata, "The Tiwanaku: Portrait of an Andean Civilization"',
      'Extensive archaeological surveys at Tiwanaku and Puma Punku',
    ],
    gameRelevance:
      "Yachay's quest traces pre-Incan knowledge back to Tiwanaku. The civilization's mysterious collapse adds to the game's sense that something important was lost.",
  },

  {
    id: 'inca_road_system',
    title: 'The Qhapaq Nan (Inca Road System)',
    content:
      'The Inca built a road network exceeding 25,000 miles, connecting the entire empire from Colombia to Chile. The system included suspension bridges, tunnels, and way stations (tambos) at regular intervals. Chasqui relay runners could transmit messages across the empire in days. The system was entirely pedestrian — the Inca used no wheeled vehicles.',
    tier: 'gold',
    culture: 'Inca',
    timePeriod: '1400-1532 CE',
    sources: [
      'UNESCO Qhapaq Nan World Heritage documentation',
      'John Hyslop, "The Inka Road System"',
    ],
    gameRelevance:
      "Establishes the Inca's engineering capability and their ability to move information over vast distances. If they could build 25,000 miles of roads, continent-spanning communication is not far-fetched.",
  },

  {
    id: 'puma_punku_precision',
    title: 'Puma Punku Precision Stonework',
    content:
      'The Puma Punku temple complex features megalithic stones cut with sub-millimeter precision, including H-shaped modular blocks, perfectly flat surfaces, and drilled holes with consistent diameters. The stones interlock without mortar. The largest block weighs approximately 131 metric tons. The site sits at 3,800 meters altitude.',
    tier: 'gold',
    culture: 'Tiwanaku',
    timePeriod: '536 CE (approximate)',
    sources: [
      'Jean-Pierre Protzen & Stella Nair, engineering analysis',
      'Alexei Vranich, University of Pennsylvania excavations',
    ],
    gameRelevance:
      "Portal network manufacturing site. The real precision provides the factual hook for the game's fiction about modular network components.",
  },

  {
    id: 'shared_cosmology',
    title: 'Shared Cosmology Across the Americas',
    content:
      'Multiple pre-Columbian civilizations share strikingly similar cosmological elements: the feathered/horned serpent deity, a flood myth, a creator god who departs and promises to return, solar and Venus worship, and similar creation narratives involving emergence from underground or across water. Whether these similarities indicate ancient contact, common ancestry, or universal human mythological patterns remains debated.',
    tier: 'silver',
    culture: 'Pan-American',
    timePeriod: 'Various (pre-contact)',
    sources: [
      'Comparative mythology studies',
      'Michael Coe, "Mexico: From the Olmecs to the Aztecs"',
    ],
    gameRelevance:
      'The central mystery of the Prologue. All four characters encounter variants of the same myths, suggesting a shared origin that the game attributes to the portal network builders.',
  },

  {
    id: 'trans_pacific_contact',
    title: 'Pre-Columbian Trans-Pacific Contact',
    content:
      'DNA evidence confirmed pre-Columbian Polynesian chickens in Chile, and the sweet potato (South American origin) was present in Polynesia before European contact. Combined with Norse confirmation at L\'Anse aux Meadows, these findings demonstrate that the Americas were not hermetically sealed before 1492. "Occasional contact" is now scientific consensus; "sustained exchange" remains unproven.',
    tier: 'silver',
    culture: 'Polynesian / South American',
    timePeriod: 'Pre-1500 CE',
    sources: [
      'Storey et al., chicken bone DNA analysis',
      'Roullier et al., sweet potato genetic studies (2013)',
    ],
    gameRelevance:
      "Provides silver-tier justification for Califia's awareness of trans-oceanic possibilities. If Polynesians reached Chile, contact with the California coast is not impossible.",
  },

  {
    id: 'ancient_energy_grid_theory',
    title: 'Ancient Energy Grid / Ley Line Theories',
    content:
      'Fringe theories propose that ancient sacred sites worldwide are connected by "ley lines" or energy grids, and that their precise positioning reflects knowledge of Earth\'s electromagnetic field. While mainstream science finds no evidence for energy lines, the demonstrable astronomical alignment of many ancient sites (Cahokia, Chaco Canyon, Serpent Mound, Nazca) shows that ancient builders DID intentionally position structures relative to celestial events.',
    tier: 'bronze',
    culture: 'Global',
    timePeriod: 'Various',
    sources: [
      'Alfred Watkins, "The Old Straight Track" (1925, ley lines concept)',
      'Astronomical alignment studies at various sites (legitimate)',
    ],
    gameRelevance:
      "The explicit inspiration for the portal network mechanic. The game takes the bronze-tier premise and runs with it, but always signals to the player which parts are real (astronomical alignments) and which are game fiction (energy transmission).",
  },
]

export function getFactsByTier(tier: HistoricalFact['tier']): HistoricalFact[] {
  return HISTORICAL_FACTS.filter((fact) => fact.tier === tier)
}

export function getFactsByCulture(culture: string): HistoricalFact[] {
  return HISTORICAL_FACTS.filter((fact) =>
    fact.culture.toLowerCase().includes(culture.toLowerCase())
  )
}

export function getFactById(id: string): HistoricalFact | undefined {
  return HISTORICAL_FACTS.find((fact) => fact.id === id)
}

export function getFactsForGameRelevance(keyword: string): HistoricalFact[] {
  return HISTORICAL_FACTS.filter((fact) =>
    fact.gameRelevance.toLowerCase().includes(keyword.toLowerCase())
  )
}
