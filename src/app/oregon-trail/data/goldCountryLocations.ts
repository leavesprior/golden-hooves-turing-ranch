/**
 * Gold Country Locations - Real California Gold Rush Sites
 * Migrated from Carmen Sandiego game for educational content integration
 *
 * Content pass 2026-06-11 (audit: test-reports/CONTENT_AUDIT_20260611.md):
 * - descriptions/facts rewritten against the research fact pack
 *   (MB research/bobr_game_goldcountry_factpack_20260611)
 * - all driveTime values re-derived from West Point / BOBR via the CA-26 base
 *   (Moke Hill ~25 min CA-26 W; Jackson/Kennedy ~40 min CA-26 + CA-49 N;
 *   Murphys cluster ~50-55 min CA-26 + CA-49 S)
 */

export type ShopType = 'general' | 'saloon' | 'wine' | 'equipment' | 'stable' | 'assay' | 'none'

export interface GoldCountryLocation {
  id: string
  name: string
  shortName: string
  description: string
  region: 'west_point' | 'calaveras' | 'amador'
  coordinates: { lat: number; lng: number }
  driveTime: string
  icon: string
  externalLink: string
  linkPrompt: string
  linkHint: string
  fact: string
  atmosphere: 'cozy' | 'historic' | 'charming' | 'mysterious' | 'wondrous' | 'majestic' | 'haunting' | 'ghostly' | 'elegant' | 'wild'
  tags: string[]
  // Fallout 2 free-roam extensions
  shopType: ShopType
  adjacentTo: string[]  // IDs of locations reachable without travel encounter
  travelDistance: number  // relative distance units (1-5), higher = more encounter chance
  specialFeature?: string  // unique mechanic at this location
}

export const GOLD_COUNTRY_LOCATIONS: GoldCountryLocation[] = [
  {
    id: 'bobr_cabin',
    name: 'Back of Beyond Ranch',
    shortName: 'BOBR Cabin',
    description: 'Your mountain hideaway and investigation headquarters, at 3,000 feet near West Point — a town named in 1844 by Kit Carson, who pushed to this westernmost point of his route while hunting a pass over the Sierra. The settlement, first called Indian Gulch, was a thriving trading post before gold was even discovered, and writer Bret Harte later lived here soaking up the stories he would make famous. The cabin\'s guest book might contain clues from previous visitors...',
    region: 'west_point',
    coordinates: { lat: 38.3947, lng: -120.5269 },
    driveTime: '0 min',
    icon: 'cabin',
    externalLink: 'https://www.airbnb.com/rooms/30045739',
    linkPrompt: 'Search the cabin listing for evidence',
    linkHint: 'Look for photos that might reveal clues about the local area',
    fact: 'West Point (California Historical Landmark No. 268) was named by Kit Carson in 1844 during his search for a pass over the Sierra Nevada — it was already a busy trading post before the Gold Rush began.',
    atmosphere: 'cozy',
    tags: ['lodging', 'base_camp', 'mountain'],
    shopType: 'general',
    adjacentTo: ['natural_bridges', 'murphys', 'mokelumne_hill'],
    travelDistance: 0,
    specialFeature: 'settlement_management',
  },
  {
    id: 'angels_camp',
    name: 'Angels Camp',
    shortName: 'Angels Camp',
    description: 'Founded as a trading post by Henry and George Angel in 1848, this town struck it rich twice — first in the creeks, then in quartz mines that produced more than $100 million in gold. At the stone Angels Hotel (built 1855, still standing on Main Street), a broke young Mark Twain heard the frog story in 1865 that launched his career. Locals also tell of merchant Bennager Rasberry, whose jammed rifle ramrod blasted into a hillside in 1856 and uncovered $7,000 in gold inside three days. The annual Jumping Frog Jubilee keeps the legend leaping.',
    region: 'calaveras',
    coordinates: { lat: 38.0680, lng: -120.5396 },
    driveTime: '55 min from BOBR',
    icon: 'frog',
    externalLink: 'https://www.gocalaveras.com/angels-camp/',
    linkPrompt: 'Investigate the town\'s Twain connection',
    linkHint: 'When did Twain visit this town?',
    fact: 'Mark Twain heard the jumping frog tale at the Angels Hotel in 1865; published in the New York Saturday Press on November 18, 1865, \'The Celebrated Jumping Frog of Calaveras County\' made him famous.',
    atmosphere: 'historic',
    tags: ['town', 'twain', 'gold_rush', 'festival'],
    shopType: 'saloon',
    adjacentTo: ['murphys', 'moaning_cavern', 'natural_bridges'],
    travelDistance: 3,
    specialFeature: 'frog_jumping_contest',
  },
  {
    id: 'murphys',
    name: 'Murphys',
    shortName: 'Murphys',
    description: 'A Gold Rush camp that traded picks for corkscrews — more than 20 wine tasting rooms now line its shady Main Street. The Murphys Historic Hotel has taken guests since the 1850s, and its old register reads like a Gold Rush who\'s-who: Mark Twain, Ulysses S. Grant, and — by local tradition — the gentleman bandit Black Bart, who may have signed in between the stagecoach robberies he was politely committing nearby. Stroll the stone-front buildings, taste the local zinfandel, and keep an eye on who\'s checking in.',
    region: 'calaveras',
    coordinates: { lat: 38.1377, lng: -120.4613 },
    driveTime: '50 min from BOBR',
    icon: 'wine',
    externalLink: 'https://visitmurphys.com/',
    linkPrompt: 'Explore the wine trail for clues',
    linkHint: 'Famous guests have stayed at the historic hotel',
    fact: 'The Murphys Hotel guest register, dating to the 1850s, holds the signatures of Mark Twain and Ulysses S. Grant — and, by local tradition, stagecoach robber Black Bart.',
    atmosphere: 'charming',
    tags: ['town', 'wine', 'history', 'dining'],
    shopType: 'wine',
    adjacentTo: ['bobr_cabin', 'angels_camp', 'ironstone_vineyards', 'big_trees'],
    travelDistance: 2,
    specialFeature: 'wine_tasting',
  },
  {
    id: 'moaning_cavern',
    name: 'Moaning Cavern',
    shortName: 'Moaning Cavern',
    // TODO verify: spiral-staircase detail is from the cavern operator's tour materials, not the fact pack
    description: 'California\'s largest single cave chamber — big enough, the guides like to say, to swallow the Statue of Liberty. Gold Rush miners named it for the eerie moan that once drifted from its entrance, and human remains found at the bottom have been dated to as much as 13,000 years old, among the oldest in North America. Today visitors descend a steel spiral staircase on walking tours, or rappel straight down into the dark the way the first explorers dropped in on ropes. A natural vault — perfect for hiding stolen goods...',
    region: 'calaveras',
    coordinates: { lat: 38.0719, lng: -120.4678 },
    driveTime: '55 min from BOBR',
    icon: 'cave',
    externalLink: 'https://www.caverntours.com/moaning-cavern/',
    linkPrompt: 'Descend into the cavern for clues',
    linkHint: 'How deep is the main chamber?',
    fact: 'Moaning Cavern\'s main chamber is large enough to hold the Statue of Liberty, and human remains discovered inside date back as much as 13,000 years.',
    atmosphere: 'mysterious',
    tags: ['cave', 'adventure', 'geology', 'history'],
    shopType: 'none',
    adjacentTo: ['angels_camp', 'california_caverns'],
    travelDistance: 3,
    specialFeature: 'rappel_challenge',
  },
  {
    id: 'california_caverns',
    name: 'California Caverns',
    shortName: 'CA Caverns',
    // TODO verify: 'Cave City' historic name and Gold Rush-era tours; Muir visit is real but
    // the old '1858' date was removed (Muir didn't reach California until 1868)
    description: 'The Mother Lode\'s great show cave, known to Gold Rush miners as Cave City. Its winding passages hide rare aragonite crystal formations and an underground lake, and tours have run here since the Gold Rush era — John Muir explored the caverns and wrote about their crystal-hung chambers. Beyond the lighted walking route, wild sections still require crawling, wading, and rafting to reach. Plenty of dark corners for a fugitive to stash what shouldn\'t be found.',
    region: 'calaveras',
    coordinates: { lat: 38.1728, lng: -120.4211 },
    driveTime: '45 min from BOBR', // TODO verify: backroads route via Railroad Flat / Mountain Ranch
    icon: 'crystal',
    externalLink: 'https://www.caverntours.com/california-caverns/',
    linkPrompt: 'Search the crystalline chambers',
    linkHint: 'What rare formations can be found here?',
    fact: 'California Caverns contains rare aragonite crystal formations and an underground lake; John Muir explored the caverns and described them in his writings.',
    atmosphere: 'wondrous',
    tags: ['cave', 'crystals', 'adventure', 'rare'],
    shopType: 'none',
    adjacentTo: ['moaning_cavern', 'murphys'],
    travelDistance: 3,
    specialFeature: 'crystal_discovery',
  },
  {
    id: 'big_trees',
    name: 'Calaveras Big Trees',
    shortName: 'Big Trees',
    // TODO verify: Discovery Tree stump still displayed near the North Grove trailhead
    description: 'Home of the giant sequoias that made the world gasp. When the \'Discovery Tree\' was found here in 1852, eastern newspapers refused to believe a tree could be that big — so promoters felled the 1,200-year-old giant and toured pieces of it as proof. Thirty-two people once danced a cotillion on the leveled stump, which still sits near the North Grove trailhead today. The groves outlived their exploiters: these trees were already ancient before the Gold Rush, before the missions, before almost everything.',
    region: 'calaveras',
    coordinates: { lat: 38.2822, lng: -120.3081 },
    driveTime: '70 min from BOBR', // TODO verify: via Murphys + CA-4 to Arnold; mountain backroads may be shorter
    icon: 'tree',
    externalLink: 'https://www.parks.ca.gov/?page_id=551',
    linkPrompt: 'Search among the ancient giants',
    linkHint: 'How old are these trees?',
    fact: 'The Discovery Tree, found in 1852, was over 1,200 years old when it was cut down. Its stump was so large that 32 people once danced on it at a party.',
    atmosphere: 'majestic',
    tags: ['nature', 'hiking', 'sequoias', 'park'],
    shopType: 'none',
    adjacentTo: ['murphys', 'angels_camp'],
    travelDistance: 4,
    specialFeature: 'sequoia_identification',
  },
  {
    id: 'kennedy_mine',
    name: 'Kennedy Mine',
    shortName: 'Kennedy Mine',
    description: 'One of the deepest gold mines in America — the Kennedy\'s vertical shaft reached 5,912 feet, more than a mile straight down. From its start in 1856 to its closure in 1942, the mine produced $34.28 million in gold. Its steel headframe still towers over Jackson, and the huge wooden tailing wheels built in 1914 to lift waste rock over the hills survive nearby. The 1922 fire that killed 47 miners — often pinned on the Kennedy — actually struck the neighboring Argonaut Mine, the Kennedy\'s bitter rival.',
    region: 'amador',
    coordinates: { lat: 38.3494, lng: -120.7739 },
    driveTime: '40 min from BOBR',
    icon: 'mine',
    externalLink: 'https://www.kennedygoldmine.com/',
    linkPrompt: 'Investigate the abandoned mine',
    linkHint: 'How deep did the miners dig?',
    fact: 'The Kennedy Mine\'s vertical shaft reached 5,912 feet — the deepest in the United States — and produced $34.28 million in gold between 1856 and 1942. The 1922 fire that killed 47 miners happened at the neighboring Argonaut Mine.',
    atmosphere: 'haunting',
    tags: ['mine', 'history', 'gold_rush', 'museum'],
    shopType: 'equipment',
    adjacentTo: ['jackson'],
    travelDistance: 4,
    specialFeature: 'mine_exploration',
  },
  {
    id: 'mokelumne_hill',
    name: 'Mokelumne Hill',
    shortName: 'Moke Hill',
    description: 'The wildest camp in the Mother Lode — and one of the richest. The ground paid so well that claims were limited to just 16 feet square, some yielding up to $20,000. The Thompson & West county history records a man killed every weekend for 17 straight weeks in 1851; that June, American miners used the Foreign Miners Tax as a pretext to drive French miners off rich French Hill in the so-called \'French War.\' Fires leveled the town in 1854, 1865, and 1874, but the Hotel Léger (1851) survived — even absorbing the old county courthouse next door when the county seat moved away in 1866. They say George Léger never checked out.',
    region: 'calaveras',
    coordinates: { lat: 38.2972, lng: -120.7089 },
    driveTime: '25 min from BOBR',
    icon: 'saloon',
    externalLink: 'https://www.gocalaveras.com/mokelumne-hill/',
    linkPrompt: 'Question the locals in this former boomtown',
    linkHint: 'What was this town\'s violent reputation?',
    fact: 'According to the Thompson & West county history, a man was killed in Mokelumne Hill every weekend for 17 straight weeks in 1851 — and claims on its fabulously rich ground were limited to 16 feet square.',
    atmosphere: 'ghostly',
    tags: ['town', 'history', 'gold_rush', 'haunted'],
    shopType: 'saloon',
    adjacentTo: ['bobr_cabin', 'jackson', 'murphys'],
    travelDistance: 3,
    specialFeature: 'haunted_inn',
  },
  {
    id: 'ironstone_vineyards',
    name: 'Ironstone Vineyards',
    shortName: 'Ironstone',
    // TODO verify: the crystalline gold specimen was found in 1992 (date omitted from text pending check)
    description: 'A winery estate in Gold Rush style, with gardens, tasting cellars, and a museum holding the Mother Lode\'s most jaw-dropping treasure: a 44-pound mass of crystalline gold leaf, the largest specimen of its kind in existence, unearthed at a mine near Jamestown. After a century and a half of picks, pans, and dredges, the single greatest piece of crystalline gold ever found sits behind glass just minutes from Murphys — exactly the sort of prize a thief might find irresistible.',
    region: 'calaveras',
    coordinates: { lat: 38.1393, lng: -120.4511 },
    driveTime: '55 min from BOBR',
    icon: 'grapes',
    externalLink: 'https://www.ironstonevineyards.com/',
    linkPrompt: 'Search the vineyard cellars',
    linkHint: 'What treasure is displayed in their museum?',
    fact: 'Ironstone displays a 44-pound crystalline gold leaf specimen found near Jamestown — the largest crystalline gold piece in existence.',
    atmosphere: 'elegant',
    tags: ['winery', 'museum', 'gardens', 'gold'],
    shopType: 'wine',
    adjacentTo: ['murphys'],
    travelDistance: 2,
    specialFeature: 'gold_museum',
  },
  {
    id: 'jackson',
    name: 'Jackson',
    shortName: 'Jackson',
    description: 'A county seat twice over — first of Calaveras (1850-52), then of Amador (1854 to today). Named for a spring where travelers piled their empty bottles (\'Botilleas\'), Jackson earned a rough reputation early: ten men were lynched from the hanging tree at 26 Main Street between 1851 and 1855. After fire swept the town in 1862, the tree was cut down and the National Hotel (1852) was rebuilt. The headframes of the great Kennedy and Argonaut mines still stand above town, and St. Sava (1894), the first Serbian Orthodox church in America, was founded here.',
    region: 'amador',
    coordinates: { lat: 38.3489, lng: -120.7739 },
    driveTime: '40 min from BOBR',
    icon: 'building',
    externalLink: 'https://www.tourjackson.com/',
    linkPrompt: 'Explore the historic downtown',
    linkHint: 'What happened at 26 Main Street?',
    fact: 'Jackson\'s hanging tree stood at 26 Main Street, where ten men were lynched between 1851 and 1855; the tree was cut down after the fire of 1862.',
    atmosphere: 'mysterious',
    tags: ['town', 'history', 'tunnels', 'county_seat'],
    shopType: 'general',
    adjacentTo: ['kennedy_mine', 'mokelumne_hill'],
    travelDistance: 4,
    specialFeature: 'warrant_system',
  },
  {
    id: 'natural_bridges',
    name: 'Natural Bridges',
    shortName: 'Natural Bridges',
    // TODO verify: trail length and float-under-the-arch tourist details (common park guidance, not in fact pack)
    description: 'A hidden geological wonder near Vallecito, where Coyote Creek spent millions of years dissolving a band of limestone — carving caves whose roofs finally collapsed, leaving the creek flowing beneath massive natural stone arches. Gold Rush miners worked these gravels for placer gold; today a short trail drops to a swimming hole where, on a hot summer day, you can float right under the arch through a cool, formation-hung cavern. Pack water shoes and a flashlight, and watch the gravel bars — color still turns up in a pan now and then.',
    region: 'calaveras',
    coordinates: { lat: 38.1194, lng: -120.4892 },
    driveTime: '50 min from BOBR',
    icon: 'bridge',
    externalLink: 'https://www.parks.ca.gov/?page_id=549',
    linkPrompt: 'Search the limestone formations',
    linkHint: 'How were these bridges formed?',
    fact: 'The Natural Bridges formed as Coyote Creek dissolved the limestone over millions of years, creating caves whose ceilings eventually collapsed — leaving the creek running beneath natural rock arches.',
    atmosphere: 'wild',
    tags: ['nature', 'hiking', 'geology', 'swimming'],
    shopType: 'none',
    adjacentTo: ['bobr_cabin', 'angels_camp'],
    travelDistance: 2,
    specialFeature: 'gold_panning',
  }
]

// Helper to get location by ID
export function getGoldCountryLocation(id: string): GoldCountryLocation | undefined {
  return GOLD_COUNTRY_LOCATIONS.find(loc => loc.id === id)
}

// Get locations by region
export function getLocationsByRegion(region: GoldCountryLocation['region']): GoldCountryLocation[] {
  return GOLD_COUNTRY_LOCATIONS.filter(loc => loc.region === region)
}

// Get locations by tag
export function getLocationsByTag(tag: string): GoldCountryLocation[] {
  return GOLD_COUNTRY_LOCATIONS.filter(loc => loc.tags.includes(tag))
}

// Location IDs for quick reference
export const GOLD_COUNTRY_LOCATION_IDS = GOLD_COUNTRY_LOCATIONS.map(loc => loc.id)

// Get adjacent locations (reachable without travel encounter)
export function getAdjacentLocations(locationId: string): GoldCountryLocation[] {
  const location = GOLD_COUNTRY_LOCATIONS.find(loc => loc.id === locationId)
  if (!location) return []
  return GOLD_COUNTRY_LOCATIONS.filter(loc => location.adjacentTo.includes(loc.id))
}

// Calculate travel distance between two locations
export function getLocationTravelDistance(fromId: string, toId: string): number {
  const from = GOLD_COUNTRY_LOCATIONS.find(loc => loc.id === fromId)
  const to = GOLD_COUNTRY_LOCATIONS.find(loc => loc.id === toId)
  if (!from || !to) return 5
  // Adjacent locations have lower encounter chance
  if (from.adjacentTo.includes(toId)) return 1
  return Math.max(from.travelDistance, to.travelDistance)
}

// Check if two locations are adjacent
export function areLocationsAdjacent(id1: string, id2: string): boolean {
  const loc = GOLD_COUNTRY_LOCATIONS.find(l => l.id === id1)
  return loc?.adjacentTo.includes(id2) ?? false
}
