// Act I: The Norseman's Journey (Erik Thorvaldsson, 1000 CE)
// Route: L'Anse aux Meadows → Maine → Great Lakes → Cahokia

export interface PrologueLocation {
  id: string
  name: string
  description: string
  culturalZone: string
  x: number // map percentage
  y: number
  connectedTo: string[]
  travelTime: number // days
  dangerLevel: 'safe' | 'moderate' | 'dangerous'
  clueIds: string[]
  puzzleIds: string[]
  witnessTypes: string[]
  tags?: string[]
  historicalNote?: string
  guideEntry?: string
}

export const NORSEMAN_LOCATIONS: PrologueLocation[] = [
  {
    id: 'lanse_aux_meadows',
    name: 'L\'Anse aux Meadows',
    description: 'A Norse settlement at the edge of the world. Eight turf buildings huddle against the cold northern wind. Here, iron was smelted and ships repaired for journeys south into the unknown.',
    culturalZone: 'Norse Vinland',
    x: 85,
    y: 15,
    connectedTo: ['beothuk_camp', 'strait_of_belle_isle'],
    travelTime: 0,
    dangerLevel: 'safe',
    clueIds: ['norse_iron_working', 'vinland_sagas'],
    puzzleIds: [],
    witnessTypes: ['norse_shipwright', 'beothuk_trader'],
    historicalNote: 'Archaeological evidence confirms Norse presence ~1000 CE. The only verified Norse settlement in North America.',
    guideEntry: 'lanse_aux_meadows',
  },

  {
    id: 'beothuk_camp',
    name: 'Beothuk Summer Camp',
    description: 'Your foster-sister\'s people gather here for the salmon run. Birchbark wigwams line the river. They know you as half-blood Erik, friend to both peoples.',
    culturalZone: 'Beothuk Territory',
    x: 82,
    y: 22,
    connectedTo: ['lanse_aux_meadows', 'strait_of_belle_isle'],
    travelTime: 2,
    dangerLevel: 'safe',
    clueIds: ['beothuk_oral_history', 'norse_native_contact'],
    puzzleIds: [],
    witnessTypes: ['beothuk_elder', 'norse_trader'],
    historicalNote: 'The Beothuk people of Newfoundland had documented contact with Norse settlers. Sadly, they were extinct by 1829.',
  },

  {
    id: 'strait_of_belle_isle',
    name: 'Strait of Belle Isle',
    description: 'Treacherous waters between Newfoundland and Labrador. Icebergs drift like white mountains. Your knarr navigates carefully southward.',
    culturalZone: 'Open Waters',
    x: 80,
    y: 28,
    connectedTo: ['beothuk_camp', 'mikmaq_territory'],
    travelTime: 3,
    dangerLevel: 'dangerous',
    clueIds: [],
    puzzleIds: [],
    witnessTypes: [],
    historicalNote: 'Norse sagas describe navigation along this coast, seeking timber and resources unavailable in Greenland.',
  },

  {
    id: 'mikmaq_territory',
    name: 'Mi\'kmaq Coastal Village',
    description: 'A large village of the Mi\'kmaq people. Their birchbark canoes are marvels of craftsmanship. They speak of pale strangers who came generations ago, seeking a metal they call "the Maine penny."',
    culturalZone: 'Mi\'kmaq Nation',
    x: 75,
    y: 35,
    connectedTo: ['strait_of_belle_isle', 'maine_penny_site'],
    travelTime: 4,
    dangerLevel: 'moderate',
    clueIds: ['mikmaq_oral_tradition', 'pre_columbian_trade'],
    puzzleIds: [],
    witnessTypes: ['mikmaq_elder', 'mikmaq_trader'],
    historicalNote: 'Mi\'kmaq oral traditions include stories of pre-Columbian contact with European visitors.',
  },

  {
    id: 'maine_penny_site',
    name: 'Goddard Site (Maine)',
    description: 'A native village site where, centuries from now, archaeologists will find a Norse silver penny among the artifacts. But you find something else: a runestone fragment, weathered and broken.',
    culturalZone: 'Wabanaki Territory',
    x: 70,
    y: 40,
    connectedTo: ['mikmaq_territory', 'penobscot_river'],
    travelTime: 3,
    dangerLevel: 'safe',
    clueIds: ['maine_penny_artifact', 'norse_penetration_evidence'],
    puzzleIds: ['runestone_fragment_1'],
    witnessTypes: ['wabanaki_shaman'],
    historicalNote: 'The Maine Penny: A genuine Norse coin (1065-1080 CE) found at a Native American site. How it arrived remains debated.',
    guideEntry: 'maine_penny',
  },

  {
    id: 'penobscot_river',
    name: 'Penobscot River Trading Post',
    description: 'Where rivers meet, traders gather. Wabanaki, Iroquois, and others exchange goods from across the continent. You see copper from Lake Superior, obsidian from the far west, and shells from southern seas.',
    culturalZone: 'Wabanaki Confederacy',
    x: 68,
    y: 44,
    connectedTo: ['maine_penny_site', 'st_lawrence_river'],
    travelTime: 2,
    dangerLevel: 'safe',
    clueIds: ['continental_trade_network'],
    puzzleIds: [],
    witnessTypes: ['wabanaki_trader', 'iroquois_merchant'],
    historicalNote: 'Extensive pre-Columbian trade networks connected the Atlantic coast to the Great Lakes and beyond.',
  },

  {
    id: 'st_lawrence_river',
    name: 'St. Lawrence River Gateway',
    description: 'The great river that flows from the heart of the continent. Your knarr can navigate this waterway with care. The local peoples call it Kaniatarowanenneh — "big waterway."',
    culturalZone: 'St. Lawrence Iroquoians',
    x: 62,
    y: 38,
    connectedTo: ['penobscot_river', 'montreal_island', 'lake_ontario_entry'],
    travelTime: 5,
    dangerLevel: 'moderate',
    clueIds: [],
    puzzleIds: [],
    witnessTypes: ['st_lawrence_iroquoian'],
    historicalNote: 'The St. Lawrence Iroquoians inhabited the river valley until their mysterious disappearance around 1580.',
  },

  {
    id: 'montreal_island',
    name: 'Hochelaga (Montreal Island)',
    description: 'A fortified Iroquoian village on an island in the great river. Longhouses and palisades. The people are wary but curious about your strange ship.',
    culturalZone: 'St. Lawrence Iroquoians',
    x: 58,
    y: 36,
    connectedTo: ['st_lawrence_river', 'lake_ontario_entry'],
    travelTime: 2,
    dangerLevel: 'moderate',
    clueIds: ['iroquoian_oral_history'],
    puzzleIds: [],
    witnessTypes: ['hochelaga_chief', 'iroquoian_elder'],
    historicalNote: 'Hochelaga was encountered by Jacques Cartier in 1535. By 1603, the village had vanished.',
  },

  {
    id: 'lake_ontario_entry',
    name: 'Lake Ontario Shores',
    description: 'Freshwater as far as the eye can see — a sea without salt. The Iroquois speak of even greater lakes to the west, and beyond them, a great river flowing south.',
    culturalZone: 'Haudenosaunee Territory',
    x: 52,
    y: 40,
    connectedTo: ['montreal_island', 'oswego_river', 'niagara_portage'],
    travelTime: 3,
    dangerLevel: 'safe',
    clueIds: ['great_lakes_navigation'],
    puzzleIds: [],
    witnessTypes: ['iroquois_guide'],
    historicalNote: 'The Great Lakes formed a natural highway for pre-Columbian trade and migration.',
  },

  {
    id: 'oswego_river',
    name: 'Oswego River Settlement',
    description: 'An Iroquois village at a strategic river junction. They control trade between the lakes and the coast. Their elder shows you a curious artifact: a bronze implement unlike anything they make.',
    culturalZone: 'Haudenosaunee',
    x: 50,
    y: 42,
    connectedTo: ['lake_ontario_entry', 'kensington_country'],
    travelTime: 2,
    dangerLevel: 'safe',
    clueIds: ['unexplained_bronze_artifact'],
    puzzleIds: ['bronze_puzzle_1'],
    witnessTypes: ['iroquois_elder', 'iroquois_smith'],
    historicalNote: 'The Haudenosaunee (Iroquois Confederacy) controlled extensive territory and trade networks.',
  },

  {
    id: 'niagara_portage',
    name: 'The Thunder of Waters (Niagara)',
    description: 'The most sacred place the Iroquois know. The waterfall roars with the voice of the sky spirits. You portage around it, humbled by the power of this land.',
    culturalZone: 'Neutral Nation Territory',
    x: 48,
    y: 43,
    connectedTo: ['lake_ontario_entry', 'lake_erie'],
    travelTime: 3,
    dangerLevel: 'moderate',
    clueIds: [],
    puzzleIds: [],
    witnessTypes: ['neutral_nation_priest'],
    historicalNote: 'Niagara Falls was a sacred site for indigenous peoples. The Neutral Nation controlled the portage route.',
  },

  {
    id: 'lake_erie',
    name: 'Lake Erie Trading Hub',
    description: 'Multiple nations meet here to trade. Erie, Iroquois, and peoples from the western lakes. You hear whispers of strange runestones found far to the west.',
    culturalZone: 'Erie Nation',
    x: 44,
    y: 45,
    connectedTo: ['niagara_portage', 'kensington_country'],
    travelTime: 4,
    dangerLevel: 'safe',
    clueIds: ['runestone_rumors'],
    puzzleIds: [],
    witnessTypes: ['erie_trader', 'western_lake_traveler'],
    historicalNote: 'The Erie Nation was destroyed by the Iroquois Confederacy in the 1650s, but they controlled this vital region.',
  },

  {
    id: 'kensington_country',
    name: 'Runestone Territory (Minnesota Region)',
    description: 'Deep in the western wilderness, you find it: a stone carved with runes, telling of Norwegians who came this far in 1362. Or is it a later fabrication? The fylgja spirits are strangely silent here.',
    culturalZone: 'Disputed',
    x: 35,
    y: 40,
    connectedTo: ['lake_erie', 'oswego_river', 'mississippi_headwaters'],
    travelTime: 8,
    dangerLevel: 'dangerous',
    clueIds: ['kensington_runestone'],
    puzzleIds: ['kensington_analysis'],
    witnessTypes: [],
    tags: ['solar_aligned'],
    historicalNote: 'The Kensington Runestone (discovered 1898) claims Norse presence in 1362. Widely considered a hoax, but debate continues.',
    guideEntry: 'kensington_runestone',
  },

  {
    id: 'mississippi_headwaters',
    name: 'Mississippi River Source',
    description: 'The great river begins as a small stream in a marsland. The Ojibwe people here speak of ancient travelers who came from the sunrise, seeking the sunset.',
    culturalZone: 'Ojibwe Territory',
    x: 32,
    y: 42,
    connectedTo: ['kensington_country', 'mississippi_journey'],
    travelTime: 3,
    dangerLevel: 'moderate',
    clueIds: ['ojibwe_migration_stories'],
    puzzleIds: [],
    witnessTypes: ['ojibwe_elder'],
    historicalNote: 'Lake Itasca, the source of the Mississippi, was sacred to the Ojibwe people.',
  },

  {
    id: 'mississippi_journey',
    name: 'Mississippi River Descent',
    description: 'You journey south on the great river, following its flow toward an impossible destination. Days blur together. The landscape transforms from northern forests to vast prairies.',
    culturalZone: 'River Corridor',
    x: 30,
    y: 55,
    connectedTo: ['mississippi_headwaters', 'cahokia_approach'],
    travelTime: 12,
    dangerLevel: 'moderate',
    clueIds: [],
    puzzleIds: [],
    witnessTypes: [],
    historicalNote: 'The Mississippi served as a trade and migration corridor for millennia.',
  },

  {
    id: 'cahokia_approach',
    name: 'Approach to the Great City',
    description: 'Smoke rises from countless fires. The land itself has been reshaped — massive earthen pyramids dominate the horizon. You have reached Cahokia, the greatest city north of Mexico.',
    culturalZone: 'Cahokia Outskirts',
    x: 28,
    y: 62,
    connectedTo: ['mississippi_journey', 'cahokia_monks_mound'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['cahokia_first_sight'],
    puzzleIds: [],
    witnessTypes: ['cahokia_scout'],
    historicalNote: 'Cahokia at its peak (1050-1200 CE) housed 10,000-20,000 people, making it larger than London at the time.',
    guideEntry: 'cahokia',
  },

  {
    id: 'cahokia_monks_mound',
    name: 'Monks Mound (Cahokia)',
    description: 'The pyramid towers ten stories high, larger than anything your people have built. At its summit, a temple to the Morning Star. Here, your journey as Erik ends. Here, another story begins.',
    culturalZone: 'Cahokia Core',
    x: 27,
    y: 64,
    connectedTo: ['cahokia_approach'],
    travelTime: 1,
    dangerLevel: 'safe',
    clueIds: ['norse_cahokia_artifact', 'act_transition_clue'],
    puzzleIds: ['fylgja_final_vision'],
    witnessTypes: ['cahokia_priest', 'dream_walker'],
    tags: ['observatory'],
    historicalNote: 'Monks Mound is the largest pre-Columbian earthwork in the Americas — 100 feet tall, 14 acres at its base.',
    guideEntry: 'monks_mound',
  },
]

export function getNorsemanLocation(id: string): PrologueLocation | undefined {
  return NORSEMAN_LOCATIONS.find(loc => loc.id === id)
}

export function getNorsemanStartLocation(): PrologueLocation {
  return NORSEMAN_LOCATIONS[0] // L'Anse aux Meadows
}
