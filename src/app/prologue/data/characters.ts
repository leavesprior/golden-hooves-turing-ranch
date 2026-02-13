// Prologue playable characters - 4 perspectives across pre-Columbian America

export type PrologueCharacterId = 'norseman' | 'native' | 'califia' | 'incan'

export interface PrologueCharacterDef {
  id: PrologueCharacterId
  name: string
  fullTitle: string
  era: string
  startingLocation: string
  backstory: string
  uniqueMechanic: {
    id: string
    name: string
    description: string
    mechanicType: 'tracking' | 'vision' | 'tactical' | 'puzzle'
  }
  startingStats: {
    Shrewdness: number
    Agility: number
    Durability: number
    Diplomacy: number
    Luck: number
    Expertise: number
  }
  culturalBackground: string
  historicalBasis: string[]
}

export const PROLOGUE_CHARACTERS: Record<PrologueCharacterId, PrologueCharacterDef> = {
  norseman: {
    id: 'norseman',
    name: 'Erik Thorvaldsson',
    fullTitle: 'Erik Thorvaldsson, Skraeling-speaker of Vinland',
    era: '1000 CE',
    startingLocation: 'lanse_aux_meadows',
    backstory: `You were born in Greenland but raised between worlds. Your mother was Norse, your foster-sister was Beothuk. When Leif Erikson established Vinland, you became the bridge between Norse and native peoples. Now, decades later, you track something impossible: evidence that your people reached far deeper into this vast continent than anyone suspects. The fylgja spirits guide your path — animal spirits that reveal what others cannot see.`,
    uniqueMechanic: {
      id: 'fylgja_tracking',
      name: 'Fylgjur Spirit Tracking',
      description: 'Norse belief in spirit animals grants Erik the ability to "see" through animal eyes at key sites. Ravens, wolves, and bears reveal hidden paths, buried artifacts, and witness memories invisible to normal investigation.',
      mechanicType: 'tracking',
    },
    startingStats: {
      Shrewdness: 2,
      Agility: 2,
      Durability: 4,
      Diplomacy: 2,
      Luck: 2,
      Expertise: 4,
    },
    culturalBackground: 'Norse-Greenlandic with deep ties to indigenous Beothuk and Mi\'kmaq peoples. Speaks Old Norse, Beothuk, and broken Algonquian.',
    historicalBasis: [
      'L\'Anse aux Meadows archaeological site (confirmed Norse settlement ~1000 CE)',
      'The Maine Penny (Norse coin found in Maine, controversial dating)',
      'Genetic evidence of pre-Columbian Norse-Native contact',
      'Sagas describing Vinland expeditions and encounters with "Skraelings"',
      'Possible Norse exploration of Great Lakes via St. Lawrence River',
    ],
  },

  native: {
    id: 'native',
    name: 'Soaring Hawk',
    fullTitle: 'Soaring Hawk, Dream-Walker of the Cahokia Mounds',
    era: '1000-1100 CE',
    startingLocation: 'cahokia_monks_mound',
    backstory: `You are a keeper of the ancient ways, trained in the sacred art of Dream Walking. The great city of Cahokia sprawls around you — 20,000 souls, the largest city north of the Mexica kingdoms. But you see what others cannot: the Dreamtime, where past and future blur together. In visions, you've witnessed strangers with pale skin and iron tools, others with obsidian and feathered serpents. The ancestors whisper that these are not mere dreams, but memories of what was and prophecies of what comes. Your people built this city on cosmic alignment and sacred geometry. Now those same patterns point you toward a mystery that spans the continent.`,
    uniqueMechanic: {
      id: 'dream_walking',
      name: 'Dream Walking',
      description: 'At sacred sites (mounds, henges, serpent effigies), Soaring Hawk enters the Dreamtime to witness echoes of the past. This reveals witness testimony from long-dead observers, artifact histories, and connections between distant locations through the spiritual plane.',
      mechanicType: 'vision',
    },
    startingStats: {
      Shrewdness: 3,
      Agility: 2,
      Durability: 2,
      Diplomacy: 4,
      Luck: 4,
      Expertise: 1,
    },
    culturalBackground: 'Mississippian culture, Cahokia city-state. Initiated into the priesthood of the Morning Star. Speaks Dhegihan Siouan and understands the astronomical calendar systems.',
    historicalBasis: [
      'Cahokia Mounds — largest pre-Columbian city north of Mexico (20,000+ population)',
      'Monks Mound — largest earthwork in the Americas',
      'Woodhenge — solar calendar similar to Stonehenge',
      'Evidence of continent-wide Mississippian trade networks',
      'Serpent Mound and other effigy mounds showing astronomical knowledge',
      'Possible cultural exchange with Mesoamerican civilizations',
    ],
  },

  califia: {
    id: 'califia',
    name: 'Califia',
    fullTitle: 'Queen Califia of the Golden Shores',
    era: '1200 CE',
    startingLocation: 'channel_islands',
    backstory: `The Spanish will one day name this land after you, though they'll claim you were only legend. You rule the Chumash confederation from your island stronghold, commanding the swift plank canoes that rule these waters. Your people are masters of the sea, traders who voyage from the northern forests to the southern deserts. In your vaults lie treasures from a hundred nations: jade from distant mountains, obsidian from the eastern deserts, copper worked in ways your smiths cannot replicate, and stranger things still. An ancient network of trade routes crisscrosses this continent, and you are determined to map them all. But trade goods carry more than wealth — they carry secrets.`,
    uniqueMechanic: {
      id: 'warrior_strategy',
      name: 'Warrior Queen\'s Strategy',
      description: 'Califia excels at tactical analysis. At each location, she can deploy scouts to reveal all connected locations, assess danger levels, and identify optimal travel routes. Combat encounters become strategic puzzles rather than dice rolls.',
      mechanicType: 'tactical',
    },
    startingStats: {
      Shrewdness: 2,
      Agility: 4,
      Durability: 3,
      Diplomacy: 4,
      Luck: 1,
      Expertise: 2,
    },
    culturalBackground: 'Chumash maritime culture, Channel Islands. Expert navigator, warrior-queen, and master of the tomol (plank canoe). Speaks Chumashan languages and coastal trade pidgin.',
    historicalBasis: [
      'Queen Calafia from "Las Sergas de Esplandián" (1510) — California named after her',
      'Advanced Chumash maritime culture and plank canoe technology',
      'Extensive Pacific coast trade networks',
      'Archaeological evidence of long-distance trade (Southwest to Pacific Northwest)',
      'Chumash astronomical knowledge and island-mainland political confederation',
      'Possible pre-Columbian contact with Polynesian voyagers (chicken bones in Chile)',
    ],
  },

  incan: {
    id: 'incan',
    name: 'Yachay Wasi',
    fullTitle: 'Yachay Wasi, Child of the Quipu and Hieroglyphs',
    era: '1400 CE',
    startingLocation: 'lake_titicaca',
    backstory: `You are young, barely twelve summers, but already a prodigy of the quipucamayocs — the keeper of knots. While other children play, you decode the intricate quipu records of the Tawantinsuyu Empire. But you've discovered something impossible: hidden within the ancient knots are references to hieroglyphs your people do not use, symbols that match the ruins of Tiwanaku and older still. Your mentor dismissed it as childish fantasy, but you know better. The quipus speak of a time before the Inca, before the Tiwanaku, when the people of the mountains and the people of the jungles were one. Following the knot-paths, you journey north toward legends of feathered serpents and jaguar gods, carrying the greatest secret in your small hands: proof that all the great civilizations of this continent share a common, forgotten root.`,
    uniqueMechanic: {
      id: 'hieroglyph_puzzles',
      name: 'Quipu-Hieroglyph Cipher',
      description: 'Yachay excels at puzzle-solving. Artifacts with inscriptions, glyphs, or patterns become logic puzzles that reveal multiple traits when solved. The quipu system helps decrypt Mayan, Aztec, and older symbolic systems, finding connections others miss.',
      mechanicType: 'puzzle',
    },
    startingStats: {
      Shrewdness: 5,
      Agility: 2,
      Durability: 1,
      Diplomacy: 2,
      Luck: 4,
      Expertise: 2,
    },
    culturalBackground: 'Inca Empire (Tawantinsuyu), trained as a quipucamayoc (record keeper). Speaks Quechua and understands Aymara. Literate in quipu knot-language and shows aptitude for Mayan hieroglyphs.',
    historicalBasis: [
      'Quipu — Incan knot-based recording system (still not fully deciphered)',
      'Tiwanaku — mysterious pre-Incan culture at Lake Titicaca',
      'Puma Punku — precision stonework that baffles modern engineers',
      'Evidence of Inca-Aztec diplomatic contact before Spanish arrival',
      'Shared cosmology across Andean and Mesoamerican cultures (feathered serpent deity)',
      'Recent theories of ancient trans-continental trade routes',
    ],
  },
}

// Character progression paths
export const CHARACTER_PROGRESSION = {
  norseman: {
    specialAbilities: [
      { level: 1, ability: 'Raven\'s Eye - Reveal hidden paths at Norse sites' },
      { level: 3, ability: 'Wolf Pack - Call upon fylgja allies in dangerous encounters' },
      { level: 5, ability: 'Bear Strength - Overcome physical obstacles at any location' },
    ],
  },
  native: {
    specialAbilities: [
      { level: 1, ability: 'Smoke Vision - See witness memories at sacred sites' },
      { level: 3, ability: 'Star Path - Navigate using sacred geometry and astronomy' },
      { level: 5, ability: 'Ancestor Council - Commune with ancient wisdom keepers' },
    ],
  },
  califia: {
    specialAbilities: [
      { level: 1, ability: 'Scout Network - Reveal all connected locations instantly' },
      { level: 3, ability: 'Tactical Assessment - See danger levels and optimal routes' },
      { level: 5, ability: 'Queen\'s Authority - Gain automatic Diplomacy success at trade hubs' },
    ],
  },
  incan: {
    specialAbilities: [
      { level: 1, ability: 'Pattern Recognition - Artifacts reveal extra clues' },
      { level: 3, ability: 'Quipu Synthesis - Connect clues across different cultures' },
      { level: 5, ability: 'Cipher Master - Decrypt any hieroglyph or symbol system' },
    ],
  },
}

export function getCharacter(id: PrologueCharacterId): PrologueCharacterDef {
  return PROLOGUE_CHARACTERS[id]
}

export function getAllCharacters(): PrologueCharacterDef[] {
  return Object.values(PROLOGUE_CHARACTERS)
}
