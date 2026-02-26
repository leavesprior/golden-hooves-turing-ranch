/**
 * Sacred and Spiritual Sites of Gold Country
 *
 * These are real places with real cultural significance to the Miwok,
 * Maidu, Yokuts, and Washoe peoples. They are presented here as living
 * culture — not artifacts, not ruins, not "content." These sites are
 * active, cared-for, and sacred to people who are still here.
 *
 * Game interactions emphasize listening, respect, and learning.
 * There are no treasure hunts at burial grounds. There is no
 * "discovering" places that were never lost.
 *
 * Historical context: During the Gold Rush, an estimated 80% of
 * California's Native population was killed through violence, disease,
 * and starvation between 1848 and 1870. The California Legislature
 * funded militia campaigns against Native peoples. These sites survived
 * despite systematic attempts to erase them.
 */

// ============================================================================
// TYPES
// ============================================================================

export type TribeName = 'miwok' | 'maidu' | 'yokuts' | 'washoe'

export type SiteType =
  | 'grinding_rock'
  | 'roundhouse'
  | 'trade_route'
  | 'creation_site'
  | 'sacred_spring'
  | 'burial_ground'
  | 'observatory'
  | 'gathering_place'

export interface SpiritualSite {
  id: string
  name: string
  description: string
  townId: string
  coordinates: { lat: number; lng: number }
  tribe: TribeName
  siteType: SiteType
  historicalNote: string
  respectfulInteraction: string
  karmaReward: { good: number }
  xpReward: number
  crossGameBuff?: string
}

export interface InteractionGuideline {
  id: string
  principle: string
  gameEffect: string
  wrongApproach: string
  wrongEffect: string
}

export interface NativeKnowledgeReward {
  id: string
  name: string
  description: string
  grantedBySite: string
  crossGameEffect: {
    game: string
    effect: string
    magnitude: number
  }
}

export interface TribeProfile {
  territory: string
  language_family: string
  key_sites: string[]
  cultural_notes: string[]
}

export interface MiwokMaiduDistinction {
  miwok: TribeProfile
  maidu: TribeProfile
  shared: string[]
  important_note: string
}

// ============================================================================
// SPIRITUAL SITES — 10 real locations, handled with care
// ============================================================================

export const SPIRITUAL_SITES: SpiritualSite[] = [
  {
    id: 'chawse_grinding_rock',
    name: "Chaw'se (Indian Grinding Rock)",
    description: 'A massive flat limestone outcropping bearing 1,185 mortar cups — the largest collection of bedrock mortars in North America. Miwok women ground acorns here for thousands of years. The rock also contains 363 petroglyphs. This is not a museum piece. Miwok people still gather here for Big Time ceremonies every autumn.',
    townId: 'volcano',
    coordinates: { lat: 38.4264, lng: -120.6422 },
    tribe: 'miwok',
    siteType: 'grinding_rock',
    historicalNote: 'Chaw\'se (meaning "grinding rock" in Northern Sierra Miwok) has been in continuous use for over 3,000 years. The state park was established in 1962 after years of advocacy by local Miwok communities. The reconstructed roundhouse and bark houses on-site are maintained by Miwok cultural practitioners, not park staff.',
    respectfulInteraction: 'Walk quietly. Do not touch the petroglyphs or place anything in the mortar cups. If a ceremony is in progress, observe from a respectful distance or leave entirely. Read the interpretive signs written by Miwok community members. Listen more than you speak.',
    karmaReward: { good: 20 },
    xpReward: 150,
    crossGameBuff: 'Grants "Ancient Patience" in Oregon Trail: +1 Expertise for 15 travel segments',
  },
  {
    id: 'obsidian_trade_marker',
    name: 'Obsidian Trade Route Marker',
    description: 'A weathered stone cairn marking one segment of the obsidian trade network that connected Mono Lake to the Central Valley. Volcanic glass from Mono Lake has been found at sites across Gold Country, evidence of a continental trade network that functioned for thousands of years before Europeans arrived.',
    townId: 'big_trees',
    coordinates: { lat: 38.2750, lng: -120.3150 },
    tribe: 'miwok',
    siteType: 'trade_route',
    historicalNote: 'Obsidian from the Mono Lake/Bodie Hills source area has been identified at archaeological sites throughout the Sierra Nevada foothills. The trade routes followed natural passes and river corridors, the same routes later used by Gold Rush-era wagon roads. The obsidian was valued for tool-making and was traded for shell beads, food, and other goods across hundreds of miles.',
    respectfulInteraction: 'Examine the landscape and consider the intelligence required to maintain trade networks across the Sierra Nevada without roads, maps, or pack animals. If you find obsidian flakes, leave them where they are. They are not souvenirs.',
    karmaReward: { good: 15 },
    xpReward: 120,
    crossGameBuff: 'Grants "Trade Wisdom" in Oregon Trail: +1 Shrewdness for 10 travel segments',
  },
  {
    id: 'jackson_roundhouse',
    name: 'Miwok Roundhouse Site',
    description: 'The location of a Northern Sierra Miwok roundhouse (hangi), the ceremonial center of village life. Roundhouses were semi-subterranean structures up to 60 feet in diameter, used for dances, ceremonies, and community gatherings. This site near Jackson has been identified through both archaeological evidence and oral tradition.',
    townId: 'jackson',
    coordinates: { lat: 38.3500, lng: -120.7700 },
    tribe: 'miwok',
    siteType: 'roundhouse',
    historicalNote: 'Roundhouses were the spiritual and social heart of Miwok communities. They were deliberately destroyed during the Gold Rush period as part of the systematic displacement of Native peoples. Some communities have rebuilt roundhouses in the 20th and 21st centuries as acts of cultural reclamation. The Jackson roundhouse site was documented by Alfred Kroeber in the early 1900s.',
    respectfulInteraction: 'Stand at the edge of the site. Understand that this was someone\'s church, town hall, and community center combined. The Gold Rush destroyed it. The people survived anyway. That is the story worth remembering.',
    karmaReward: { good: 20 },
    xpReward: 130,
    crossGameBuff: 'Grants "Community Strength" in Oregon Trail: +1 Diplomacy for 12 travel segments',
  },
  {
    id: 'maidu_creation_site',
    name: 'Maidu Creation Place',
    description: 'In Maidu cosmology, Kodoyampeh (Earth-Maker) created the world by pulling a rope of feathers from the primordial waters, forming the Sierra Nevada. This high meadow in the Sierra foothills is associated with creation narratives passed down through generations of Maidu storytellers.',
    townId: 'west_point',
    coordinates: { lat: 38.4000, lng: -120.5200 },
    tribe: 'maidu',
    siteType: 'creation_site',
    historicalNote: 'The Maidu creation story describes Kodoyampeh and Coyote working together (and often at cross-purposes) to create the world. The Sierra Nevada itself is central to Maidu cosmology — it is not scenery, it is sacred architecture. Mountain Maidu communities in the Plumas and Sierra County areas maintain these oral traditions today through formal storytelling protocols.',
    respectfulInteraction: 'Sit quietly and look at the mountains. Consider that to the Maidu, these are not geological formations but the work of a creator. You do not need to believe this to respect it. Do not ask to be told creation stories — they are shared on the teller\'s terms, not the listener\'s demand.',
    karmaReward: { good: 25 },
    xpReward: 160,
    crossGameBuff: 'Grants "Earth-Maker\'s Perspective" in Oregon Trail: +1 Luck for 15 travel segments',
  },
  {
    id: 'mokelumne_sacred_spring',
    name: 'Sacred Springs of the Mokelumne',
    description: 'Natural springs along the Mokelumne River that were used for ceremonial purification by Northern Sierra Miwok communities. The springs were believed to have healing properties, and their waters were central to coming-of-age ceremonies. The name "Mokelumne" itself derives from the Miwok village name "Mokelumne," meaning "people of Mokel."',
    townId: 'mokelumne_hill',
    coordinates: { lat: 38.3000, lng: -120.7100 },
    tribe: 'miwok',
    siteType: 'sacred_spring',
    historicalNote: 'The Mokelumne River corridor was densely populated by Miwok communities before the Gold Rush. Hydraulic mining, which blasted hillsides with high-pressure water to extract gold, devastated the river system that sustained these springs. The river\'s name is one of the few surviving acknowledgments that people lived here for millennia before 1848.',
    respectfulInteraction: 'Drink the water if it is safe. Sit beside the spring and be quiet. Consider that this water has been flowing since before any human being set foot on this continent, and that people built ceremonies around its constancy. Do not leave anything behind.',
    karmaReward: { good: 15 },
    xpReward: 110,
  },
  {
    id: 'burial_ground_remembrance',
    name: 'Ancestral Resting Place',
    description: 'A hillside overlooking the river valley where generations of Miwok people were laid to rest. This is not a site for exploration, excavation, or curiosity. It is a cemetery. The game marks it on your map so you know to leave it alone.',
    townId: 'san_andreas',
    coordinates: { lat: 38.1960, lng: -120.6800 },
    tribe: 'miwok',
    siteType: 'burial_ground',
    historicalNote: 'During the Gold Rush, Native burial sites were routinely desecrated by miners searching for gold or simply clearing land. Bones were discarded, grave goods were looted, and sacred ground was turned into mining claims. The Native American Graves Protection and Repatriation Act (NAGPRA) of 1990 began the long process of returning remains and sacred objects to tribes. That process continues today.',
    respectfulInteraction: 'Do not approach. Do not dig. Do not search. There is no treasure here — only the remains of people who deserved better than what history gave them. The only correct interaction is remembrance. The game awards karma for choosing not to disturb this site.',
    karmaReward: { good: 30 },
    xpReward: 100,
  },
  {
    id: 'star_observatory',
    name: 'Miwok Star Observation Point',
    description: 'A high granite dome used by Miwok astronomers to track celestial movements. The Miwok recognized constellations, tracked seasonal star positions for timing acorn harvests and salmon runs, and incorporated stellar observations into their creation narratives. This was not casual stargazing. This was applied science.',
    townId: 'murphys',
    coordinates: { lat: 38.1400, lng: -120.4500 },
    tribe: 'miwok',
    siteType: 'observatory',
    historicalNote: 'Miwok astronomical knowledge included tracking the Pleiades (which signaled the start of the acorn harvest), Orion (associated with hunting season), and the Milky Way (understood as the path of the dead). This knowledge was integrated into practical decisions about food gathering, travel, and ceremony. It represents thousands of years of systematic observation.',
    respectfulInteraction: 'Visit at night if possible. Look up. The same stars the Miwok tracked are still there. Consider that astronomical observation requires patience, record-keeping, and intergenerational knowledge transfer — the same skills that define any scientific tradition.',
    karmaReward: { good: 15 },
    xpReward: 140,
    crossGameBuff: 'Grants "Stellar Navigation" in Oregon Trail: +1 Expertise for 10 travel segments',
  },
  {
    id: 'fishing_camp_stanislaus',
    name: 'Seasonal Fishing Camp',
    description: 'A flat riverside terrace where Yokuts and Miwok peoples established seasonal fishing camps during the salmon runs. Fish weirs made from willow and stone directed salmon into catchment areas. The camps were occupied for weeks at a time and served as social gathering points between neighboring communities.',
    townId: 'angels_camp',
    coordinates: { lat: 38.0750, lng: -120.5500 },
    tribe: 'yokuts',
    siteType: 'gathering_place',
    historicalNote: 'Before hydraulic mining silted the rivers, the Stanislaus and its tributaries supported massive salmon runs. Yokuts and Plains Miwok peoples from the Central Valley traveled into the foothills for seasonal fishing. The Gold Rush destroyed these fisheries within a decade — mercury contamination, siltation from mining, and dam construction eliminated the salmon. Some tributaries are only now beginning to recover.',
    respectfulInteraction: 'Walk along the river and observe the water. If you see fish, understand that their ancestors fed communities here for thousands of years. The fishing technology used — weirs, nets, controlled burns to maintain riverside habitat — was sophisticated and sustainable. Acknowledge that out loud or in your journal.',
    karmaReward: { good: 15 },
    xpReward: 120,
  },
  {
    id: 'acorn_processing_area',
    name: 'Acorn Processing Grounds',
    description: 'A shaded grove of black oaks near a creek, with bedrock mortars worn smooth by centuries of use. Miwok women processed acorns here using a multi-step method: gathering, drying, shelling, grinding in these mortars, and then leaching the tannic acid with water. The resulting flour was the caloric foundation of Miwok life.',
    townId: 'bobr_ranch',
    coordinates: { lat: 38.3950, lng: -120.5300 },
    tribe: 'miwok',
    siteType: 'grinding_rock',
    historicalNote: 'Acorn processing is one of the most sophisticated food technologies developed anywhere in the pre-agricultural world. The leaching process — which removes toxic tannins while preserving nutrition — required precise knowledge of water chemistry, timing, and temperature. Miwok women who performed this work were food scientists operating within an oral tradition. The mortars they carved into bedrock are still visible across Gold Country.',
    respectfulInteraction: 'Look at the mortars worn into the rock and consider how many thousands of hours of work they represent. Each depression was ground deeper, handful by handful, across generations. Do not use the mortars, place objects in them, or take rock fragments. Simply observe and understand.',
    karmaReward: { good: 15 },
    xpReward: 130,
    crossGameBuff: 'Grants "Acorn Wisdom" in Oregon Trail: +1 Expertise for 8 travel segments',
  },
  {
    id: 'washoe_gathering_place',
    name: 'Washoe Gathering Grounds',
    description: 'A meadow near the tree line where Washoe peoples gathered for summer trade gatherings. The Washoe territory centered on Lake Tahoe but extended into the western Sierra foothills. These high-elevation meeting grounds were used for trade, ceremony, marriage arrangements, and conflict resolution between bands.',
    townId: 'kennedy_mine',
    coordinates: { lat: 38.3600, lng: -120.7600 },
    tribe: 'washoe',
    siteType: 'gathering_place',
    historicalNote: 'The Washoe are distinct from the Miwok and Maidu — they speak a language isolate unrelated to any neighboring language family. Their territory straddled the Sierra Nevada crest, and they moved seasonally between Lake Tahoe (da ow, "the lake") and the western foothills. Gold Rush-era logging and settlement cut off their seasonal migration routes, and the Comstock Lode silver rush further devastated their eastern territory.',
    respectfulInteraction: 'Recognize that you are standing at a crossroads — between mountains and foothills, between Washoe territory and Miwok territory, between summer and winter ranges. These places were chosen deliberately over centuries. Respect the intelligence of that choice.',
    karmaReward: { good: 15 },
    xpReward: 130,
    crossGameBuff: 'Grants "Crossroads Wisdom" in Oregon Trail: +1 Diplomacy for 10 travel segments',
  },
]

// ============================================================================
// INTERACTION GUIDELINES — how to engage respectfully (with game consequences)
// ============================================================================

export const SPIRITUAL_INTERACTION_GUIDELINES: InteractionGuideline[] = [
  {
    id: 'listen_first',
    principle: 'Listen Before Speaking',
    gameEffect: 'Choosing to listen during spiritual site encounters grants +10 good karma and unlocks deeper knowledge. Patience is rewarded with richer narrative content and cross-game buffs.',
    wrongApproach: 'Interrupting, demanding information, or skipping dialogue at sacred sites.',
    wrongEffect: 'Lose 15 good karma. Native reputation decreases. Site knowledge is not granted. The narrator comments on your impatience with undisguised contempt.',
  },
  {
    id: 'no_digging',
    principle: 'Never Dig for Artifacts',
    gameEffect: 'Respecting burial grounds and archaeological sites grants +30 good karma — the highest single-action karma reward in the game. Knowledge is earned through observation, not excavation.',
    wrongApproach: 'Attempting to dig, excavate, or search for artifacts at sacred sites or burial grounds.',
    wrongEffect: 'Lose 50 good karma. Permanent Native reputation penalty. You are asked to leave and cannot return. The narrator delivers a lecture you deserve.',
  },
  {
    id: 'no_souvenirs',
    principle: 'Take Nothing But Understanding',
    gameEffect: 'Leaving sites undisturbed grants +5 good karma per visit. Accumulated respect across multiple sites unlocks the "Respectful Traveler" badge and additional cultural knowledge.',
    wrongApproach: 'Attempting to take rocks, plant materials, obsidian flakes, or other objects from spiritual sites.',
    wrongEffect: 'Lose 20 good karma. Item is confiscated (you cannot actually keep it). The game reminds you that these places belong to people who are still here.',
  },
  {
    id: 'ask_permission',
    principle: 'Seek Permission, Not Forgiveness',
    gameEffect: 'When a Miwok or Maidu NPC is present at a site, asking permission before approaching grants +10 good karma and often unlocks a guided experience with richer historical content and better rewards.',
    wrongApproach: 'Barging into ceremony areas, touching sacred objects, or treating spiritual sites as tourist attractions.',
    wrongEffect: 'Lose 25 good karma. NPC trust decreases permanently. Some site interactions become locked for the remainder of the playthrough.',
  },
  {
    id: 'acknowledge_continuity',
    principle: 'These Are Living Cultures, Not History',
    gameEffect: 'Recognizing that Miwok, Maidu, Yokuts, and Washoe peoples are contemporary communities (not historical footnotes) unlocks the deepest layer of cultural content. The game tracks whether you treat Native presence as past or present.',
    wrongApproach: 'Referring to Native peoples exclusively in the past tense, treating sites as "abandoned," or framing encounters as "discovering" things that were never lost.',
    wrongEffect: 'Lose 10 good karma. Narrator corrects you. Cultural knowledge rewards are reduced. The game gently but firmly reminds you that 700,000 Native people live in California today.',
  },
]

// ============================================================================
// NATIVE KNOWLEDGE REWARDS — earned through respectful site visits
// ============================================================================

export const NATIVE_KNOWLEDGE_REWARDS: NativeKnowledgeReward[] = [
  {
    id: 'acorn_processing',
    name: 'Acorn Processing',
    description: 'Understanding of Miwok food technology — the multi-step process of gathering, drying, shelling, grinding, and leaching acorns to produce nutritious flour. This is one of the most sophisticated pre-agricultural food technologies ever developed.',
    grantedBySite: 'acorn_processing_area',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Expertise (food preservation and preparation knowledge)',
      magnitude: 1,
    },
  },
  {
    id: 'obsidian_trade_knowledge',
    name: 'Obsidian Trade Networks',
    description: 'Knowledge of the continental trade routes that moved volcanic glass from Mono Lake across the Sierra Nevada and into the Central Valley. Understanding of how pre-contact economies functioned without currency, roads, or written records.',
    grantedBySite: 'obsidian_trade_marker',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Shrewdness (trade negotiation insight from ancient commerce)',
      magnitude: 1,
    },
  },
  {
    id: 'stellar_navigation',
    name: 'Miwok Stellar Navigation',
    description: 'Understanding of how the Miwok used the Pleiades, Orion, and the Milky Way to time harvests, plan journeys, and structure their ceremonial calendar. Applied astronomy developed over millennia of careful observation.',
    grantedBySite: 'star_observatory',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Expertise (celestial navigation reduces travel mishaps)',
      magnitude: 1,
    },
  },
  {
    id: 'fish_weir_engineering',
    name: 'Fish Weir Engineering',
    description: 'Knowledge of how Yokuts and Miwok peoples constructed fish weirs from willow and stone to sustainably harvest salmon runs. An engineering solution that fed communities for thousands of years without depleting the fishery.',
    grantedBySite: 'fishing_camp_stanislaus',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Expertise (food gathering efficiency at river crossings)',
      magnitude: 1,
    },
  },
  {
    id: 'roundhouse_architecture',
    name: 'Roundhouse Architecture',
    description: 'Understanding of semi-subterranean roundhouse construction — earth-insulated structures up to 60 feet in diameter that maintained comfortable temperatures year-round without fuel. Passive climate control through architectural intelligence.',
    grantedBySite: 'jackson_roundhouse',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Expertise (shelter construction knowledge)',
      magnitude: 1,
    },
  },
  {
    id: 'medicinal_springs',
    name: 'Healing Waters Knowledge',
    description: 'Understanding of how Miwok communities used natural springs for ceremonial purification and recognized the mineral properties of different water sources. Hydrogeological knowledge encoded in cultural practice.',
    grantedBySite: 'mokelumne_sacred_spring',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Luck (improved health outcomes from water knowledge)',
      magnitude: 1,
    },
  },
  {
    id: 'creation_cosmology',
    name: 'Maidu Cosmology',
    description: 'Awareness of Maidu creation narratives and how they encode ecological knowledge — the relationship between mountains, water, animals, and human responsibility. Cosmology as environmental science.',
    grantedBySite: 'maidu_creation_site',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Diplomacy (deeper understanding of worldviews different from your own)',
      magnitude: 1,
    },
  },
  {
    id: 'seasonal_migration',
    name: 'Washoe Seasonal Migration',
    description: 'Knowledge of how the Washoe moved between Lake Tahoe and the western foothills following seasonal food sources, weather patterns, and trade opportunities. A model of adaptive resource management across elevation zones.',
    grantedBySite: 'washoe_gathering_place',
    crossGameEffect: {
      game: 'oregon_trail',
      effect: '+1 Athleticism (trail knowledge from people who walked these routes for centuries)',
      magnitude: 1,
    },
  },
]

// ============================================================================
// MIWOK / MAIDU DISTINCTION — educational content about distinct peoples
// ============================================================================

export const MIWOK_MAIDU_DISTINCTION: MiwokMaiduDistinction = {
  miwok: {
    territory: 'Central Sierra Nevada foothills and Central Valley, from the Cosumnes River south to the Fresno River. Sub-groups include Bay Miwok, Plains Miwok, Northern Sierra Miwok, Central Sierra Miwok, and Southern Sierra Miwok. Gold Country falls primarily within Northern and Central Sierra Miwok territory.',
    language_family: 'Utian (Penutian phylum). Miwok languages are part of the Utian family, which also includes the Ohlone (Costanoan) languages of the San Francisco Bay Area. There are seven distinct Miwok languages, not mutually intelligible — "Miwok" is a language family, not a single language.',
    key_sites: [
      "Chaw'se (Indian Grinding Rock) — largest collection of bedrock mortars in North America",
      'Roundhouse sites near Jackson and Ione',
      'Acorn processing grounds throughout the foothills',
      'Mokelumne River corridor villages',
      'Star observation points on granite domes',
    ],
    cultural_notes: [
      'The moiety system divided Miwok communities into two halves (Land and Water), governing marriage, ceremony, and social organization.',
      'Miwok basket-weaving is considered among the finest in the world, using willow, sedge root, redbud, and bracken fern.',
      'Controlled burning was a key land management practice — Miwok peoples used fire to maintain oak woodlands, improve deer habitat, and encourage new plant growth.',
      'The Big Time gathering at Chaw\'se continues annually, one of the largest Native cultural events in California.',
    ],
  },
  maidu: {
    territory: 'Northern Sierra Nevada foothills and Sacramento Valley, from the Cosumnes River north to Lassen Peak. Sub-groups include Konkow (Northwestern Maidu), Mountain Maidu (Northeastern), and Nisenan (Southern Maidu). Gold Country\'s northern reaches overlap with Nisenan territory.',
    language_family: 'Maiduan (Penutian phylum). Maiduan languages are related to but distinct from Miwok languages — they share a distant common ancestor in the Penutian phylum but diverged thousands of years ago. There are three Maiduan languages: Maidu, Konkow, and Nisenan.',
    key_sites: [
      'Creation story locations in the high Sierra near the American River headwaters',
      'Konkow Trail of Tears route (1863 forced march from Chico to Round Valley)',
      'Nisenan village sites along the American River',
      'Berry Creek Rancheria area',
      'Mountain Maidu ceremonial grounds in Plumas County',
    ],
    cultural_notes: [
      'The Maidu creation narrative centers on Kodoyampeh (Earth-Maker) and Coyote, who together create and shape the world — often disagreeing about how things should work.',
      'Mountain Maidu maintained extensive knowledge of high-elevation ecology, including snowpack patterns, alpine plant medicine, and mountain weather prediction.',
      'The Konkow Trail of Tears (1863) forced over 450 Konkow Maidu on a brutal march from Chico to the Round Valley Reservation. Many died. This history is not widely taught.',
      'Maidu beadwork and featherwork were central to ceremonial life, with specific designs carrying spiritual significance that was not shared with outsiders.',
    ],
  },
  shared: [
    'Both peoples practiced controlled burning for land management, maintaining the oak woodlands that were central to their food systems.',
    'Acorn processing was a foundational food technology for both Miwok and Maidu peoples, though specific techniques and recipes varied.',
    'Both maintained extensive trade networks across the Sierra Nevada, exchanging obsidian, shell beads, dried fish, and other goods.',
    'Both peoples were devastated by the Gold Rush — through direct violence, disease, displacement, and the destruction of the environments they depended on.',
    'Both have active cultural revitalization programs today, including language preservation, traditional ecological knowledge documentation, and ceremonial practice continuation.',
  ],
  important_note: 'The Miwok and Maidu are distinct peoples with different languages, territories, and cultural practices. Grouping them together as "California Indians" erases their specific identities, histories, and ongoing communities. The same applies to the Yokuts, Washoe, Pomo, Ohlone, and dozens of other California peoples. When this game references a specific tribe, it means that tribe — not a generic stand-in for all Native Californians. Getting this right matters.',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSitesByTribe(tribe: TribeName): SpiritualSite[] {
  return SPIRITUAL_SITES.filter(site => site.tribe === tribe)
}

export function getSitesByType(siteType: SiteType): SpiritualSite[] {
  return SPIRITUAL_SITES.filter(site => site.siteType === siteType)
}

export function getSiteForTown(townId: string): SpiritualSite | undefined {
  return SPIRITUAL_SITES.find(site => site.townId === townId)
}

export function getKnowledgeForSite(siteId: string): NativeKnowledgeReward | undefined {
  return NATIVE_KNOWLEDGE_REWARDS.find(reward => reward.grantedBySite === siteId)
}

export function getAllSitesWithCrossGameBuffs(): SpiritualSite[] {
  return SPIRITUAL_SITES.filter(site => site.crossGameBuff !== undefined)
}

export function getTotalKarmaForAllSites(): number {
  return SPIRITUAL_SITES.reduce((total, site) => total + site.karmaReward.good, 0)
}
