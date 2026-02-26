/**
 * The Myth of Queen Califia — California's Namesake
 *
 * Historical basis: "Las Sergas de Esplandian" by Garci Rodriguez de Montalvo (1510),
 * a Spanish romance novel describing a mythical island ruled by Queen Califia,
 * a powerful Black Amazon warrior-queen whose realm overflowed with gold.
 * Spanish explorers named the peninsula (later state) after this fictional island.
 *
 * The irony of a state named for a fictional Black Amazon queen of gold —
 * then built on the exploitation of that same gold, while enacting racist
 * mining taxes — is one of California's deepest contradictions.
 */

import type { EncounterChoice } from './goldCountryEncounters'

// ============================================================================
// TYPES
// ============================================================================

export interface CalifiaLoreEntry {
  id: string
  title: string
  text: string
  source: string
  era: string
  category: 'origin' | 'warrior' | 'gold' | 'irony'
}

export interface CalifiaVisionEvent {
  id: string
  title: string
  description: string
  triggerCondition: string
  visionText: string
  choices: EncounterChoice[]
  buff?: {
    name: string
    effect: string
    duration: number  // travel segments
    statBonus: { stat: string; bonus: number }
  }
  narratorCommentary: string
}

export interface CaliflaBadge {
  id: string
  name: string
  icon: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

// ============================================================================
// CALIFIA LORE — 8 entries tracing the myth from page to place name
// ============================================================================

export const CALIFIA_LORE: CalifiaLoreEntry[] = [
  {
    id: 'califia_origin',
    title: 'The Name California',
    text: 'The name "California" derives from "Las Sergas de Esplandian," a 1510 Spanish romance by Garci Rodriguez de Montalvo. In the novel, California is a mythical island "on the right hand of the Indies, very close to the side of the Terrestrial Paradise." Spanish explorers applied the name to the Baja peninsula, and it stuck.',
    source: 'Las Sergas de Esplandian, Garci Rodriguez de Montalvo, 1510',
    era: '16th century',
    category: 'origin',
  },
  {
    id: 'califia_queen',
    title: 'Queen Califia, Warrior-Queen',
    text: 'Califia was described as a courageous and powerful Black Amazon queen, "the most beautiful of all of them, of blooming years." She commanded an army of women warriors and ruled her island kingdom without any men. Montalvo wrote her as formidable, intelligent, and unconquered.',
    source: 'Las Sergas de Esplandian, Chapter 157',
    era: '16th century (fictional)',
    category: 'warrior',
  },
  {
    id: 'califia_armor',
    title: 'The Golden Armor of Califia',
    text: 'Califia and her warriors wore armor forged entirely of gold, for it was the only metal found on their island. Their weapons were golden, their shields golden, their harnesses golden. The entire economy of the island was gold-based, because no other metal existed there.',
    source: 'Las Sergas de Esplandian, Chapter 157',
    era: '16th century (fictional)',
    category: 'gold',
  },
  {
    id: 'califia_griffins',
    title: 'The Army of Griffins',
    text: 'Califia commanded an air force of trained griffins — half-eagle, half-lion beasts raised from hatchlings to devour men. She deployed them in battle against Constantinople, though they proved difficult to control and attacked her own allies as readily as her enemies. Even mythological air superiority has its limits.',
    source: 'Las Sergas de Esplandian, Chapter 157-162',
    era: '16th century (fictional)',
    category: 'warrior',
  },
  {
    id: 'califia_island_myth',
    title: 'The Island of California',
    text: 'For over two centuries, European cartographers depicted California as an island, influenced by the novel and early Spanish reports. Maps from the 1620s through the 1770s show California floating in the Pacific, separated from the mainland by a mythical strait. It took a royal decree from Ferdinand VI of Spain in 1747 to officially declare that California was not an island.',
    source: 'Historical cartography, 17th-18th century',
    era: '17th-18th century',
    category: 'origin',
  },
  {
    id: 'califia_spanish_search',
    title: 'Searching for Califia\'s Gold',
    text: 'When Hernan Cortes sent expeditions to Baja California in the 1530s, his men were explicitly looking for the island of gold described in Montalvo\'s novel. They found arid desert. The disconnect between the literary paradise of gold and the actual harsh landscape did not stop them from keeping the name.',
    source: 'Cortes expedition records, 1530s',
    era: '16th century',
    category: 'gold',
  },
  {
    id: 'califia_naming',
    title: 'How a Novel Named a State',
    text: 'The naming convention traveled northward with Spanish colonization. From Baja to Alta California, from mission to presidio, the literary name calcified into geography. By 1848, when the United States took California from Mexico, nobody remembered it was named after a character in a pulp romance novel. Literature has consequences.',
    source: 'California place-name history',
    era: '16th-19th century',
    category: 'origin',
  },
  {
    id: 'califia_irony',
    title: 'The Deepest Irony',
    text: 'California — named for a fictional Black Amazon queen who ruled an island of gold — enacted the Foreign Miners\' Tax of 1850, charging non-white miners $20/month to work claims. Chinese, Mexican, Chilean, and Native miners were driven off their claims or taxed into poverty, in a state named for a woman of color whose defining trait was her golden wealth. The irony writes itself, though nobody was laughing.',
    source: 'California Foreign Miners\' Tax Act, 1850; historical analysis',
    era: '1850s',
    category: 'irony',
  },
]

// ============================================================================
// CALIFIA VISION EVENT — spiritual encounter at nexus points
// ============================================================================

export const CALIFIA_VISION_EVENT: CalifiaVisionEvent = {
  id: 'califia_vision_quest',
  title: 'Vision of Queen Califia',
  description: 'At a place where three rivers meet, the air shimmers like heat-haze — but it is cold. Something ancient stirs.',
  triggerCondition: 'spiritual_nexus_point',
  visionText: `The world goes quiet. The trees, the wind, the distant sound of picks on rock — all of it drops away. In the silence, a figure materializes.

She is tall. Taller than any person you have ever seen. Her skin is dark as polished obsidian, her eyes hold the fire of something older than this continent's newest name. She wears armor of hammered gold that catches light from a sun that isn't there.

She does not speak. She waits. She has been waiting since 1510, when a Spanish novelist dreamed her into being, and since the 1530s, when conquistadors came looking for her gold.

She watches you with an expression that might be amusement, might be contempt, might be pity.

Queen Califia. The woman California is named for. And she has something to say.`,
  choices: [
    {
      id: 'accept_blessing',
      text: 'Kneel and accept her blessing',
      outcome: {
        message: 'Califia places a golden gauntlet on your shoulder. The weight is immense and then — nothing. The weight is gone, but something remains. A warmth behind your sternum, a steadiness in your voice you did not have before. "Speak well," she says. "They will need to hear you."',
        karmaDelta: 15,
        itemGained: 'califias_blessing',
      },
      statCheck: { stat: 'diplomacy', difficulty: 10 },
    },
    {
      id: 'ask_about_gold',
      text: 'Ask her where the gold is',
      outcome: {
        message: 'She laughs. It is not a kind laugh, but it is not entirely cruel. "They named this place after me because they wanted my gold," she says. "They got it. Look around you. Look at what it cost." She gestures at the ravaged hillsides, the silted rivers, the land turned inside out. Then she is gone, and you are alone with the sound of sluice boxes.',
        karmaDelta: 5,
      },
    },
    {
      id: 'flee_vision',
      text: 'Turn away from the vision',
      outcome: {
        message: 'You squeeze your eyes shut and when you open them, the shimmer is gone. The sounds of Gold Country return. A jay screams. A mule brays. The vision might have been heatstroke, or bad water, or something else entirely. You will never know.',
      },
    },
  ],
  buff: {
    name: "Califia's Blessing",
    effect: '+2 to all Diplomacy checks',
    duration: 20,  // travel segments
    statBonus: { stat: 'diplomacy', bonus: 2 },
  },
  narratorCommentary: 'The narrator would like to note, for the record, that the entire state of California is named after a fictional Black Amazon queen from a 1510 Spanish romance novel, and then — well. Then the state enacted the Foreign Miners\' Tax. Then it drove Native people off their ancestral lands. Then it built an economy on the gold that Califia\'s legend promised. The narrator is not editorializing. The narrator is simply reading the historical record aloud and letting you draw your own conclusions.',
}

// ============================================================================
// CALIFIA BADGES — 3 explorer achievements
// ============================================================================

export const CALIFIA_BADGES: CaliflaBadge[] = [
  {
    id: 'califia_origin',
    name: "Califia's Origin",
    icon: '📖',
    description: 'Discovered the mythological origin of California\'s name — a 1510 Spanish romance novel about a Black Amazon queen on an island of gold.',
    rarity: 'common',
  },
  {
    id: 'califia_armor',
    name: 'Golden Armor',
    icon: '🛡️',
    description: 'Found all references to Califia\'s golden warriors and their gold-forged weapons across Gold Country. The armor was fiction. The gold was real. The irony is eternal.',
    rarity: 'rare',
  },
  {
    id: 'califia_legacy',
    name: "Califia's Legacy",
    icon: '👑',
    description: 'Visited every site connected to the Califia myth — from the places Spanish explorers searched for her island to the mining camps that fulfilled and betrayed her golden promise.',
    rarity: 'legendary',
  },
]

// ============================================================================
// NARRATOR LINES — sardonic commentary on the Califia myth
// ============================================================================

export const CALIFIA_NARRATOR_LINES: string[] = [
  'Fun fact: California is named after a fictional Black Amazon queen from a Spanish romance novel. The narrator will pause while you process the layers of irony.',

  'Garci Rodriguez de Montalvo invented Queen Califia in 1510. Conquistadors went looking for her gold. They didn\'t find it in Baja. They found it here, three centuries later. Montalvo would have appreciated the delayed punchline.',

  'Califia\'s island had no metal except gold. Every tool, weapon, and piece of armor was golden. This is, of course, metallurgically impractical. But so is naming a state after a character in a novel and then forgetting you did it.',

  'The narrator notes that Califia commanded trained griffins in aerial combat against Constantinople. This is relevant to nothing happening in Gold Country right now, but the narrator felt you should know.',

  'In the novel, Califia eventually converts to Christianity and marries a Roman knight. The narrator suspects this was not the ending she would have written for herself.',

  'Spanish cartographers drew California as an island for two hundred years because a novelist said it was one. The narrator admires their commitment to fiction over cartographic evidence.',

  'The Foreign Miners\' Tax of 1850 charged non-white miners twenty dollars a month to dig for gold in a state named after a Black queen whose entire kingdom was made of the stuff. The narrator did not write this irony. History did.',

  'If Califia could see what became of the land named for her — the hydraulic mining that liquefied mountains, the mercury poisoning of rivers, the displacement of peoples who had lived here for ten thousand years — the narrator suspects she would deploy the griffins. And this time, she would not call them back.',
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCalifiaLoreByCategory(category: CalifiaLoreEntry['category']): CalifiaLoreEntry[] {
  return CALIFIA_LORE.filter(entry => entry.category === category)
}

export function getRandomCalifiaNarratorLine(): string {
  return CALIFIA_NARRATOR_LINES[Math.floor(Math.random() * CALIFIA_NARRATOR_LINES.length)]
}

export function getCalifiaLoreEntry(id: string): CalifiaLoreEntry | undefined {
  return CALIFIA_LORE.find(entry => entry.id === id)
}

export function getCaliflaBadge(id: string): CaliflaBadge | undefined {
  return CALIFIA_BADGES.find(badge => badge.id === id)
}
