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

/** A named real-world page for this Gold Country place — not a generic tourism hub. */
export interface GoldCountryPlaceSite {
  name: string
  url: string
}

export interface GoldCountryLocation {
  id: string
  name: string
  shortName: string
  description: string
  region: 'west_point' | 'calaveras' | 'amador'
  coordinates: { lat: number; lng: number }
  driveTime: string
  icon: string
  /** Primary hub URL (first among `sites`). Kept for ResearchStation and older callers. */
  externalLink: string
  /** Individual official/operator pages for this place. */
  sites: GoldCountryPlaceSite[]
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
    description: '1849: a mountain trading post at 3,000 feet, on the ridge Kit Carson named West Point in 1844 while hunting a Sierra pass. The place was called Indian Gulch first — Northern Sierra Miwok ground, busy before anyone yelled gold. The guest book already has names that do not match the faces. (Later: Bret Harte will live nearby gathering stories. Now: this cabin is Back of Beyond Ranch.)',
    region: 'west_point',
    coordinates: { lat: 38.3947, lng: -120.5269 },
    driveTime: '0 min',
    icon: 'cabin',
    externalLink: 'https://www.airbnb.com/rooms/30045739',
    sites: [
      { name: 'Airbnb: Hot Tub Hideaway', url: 'https://www.airbnb.com/rooms/30045739' },
      { name: 'Back of Beyond Ranch', url: 'https://backofbeyondranch.farm/' },
      { name: 'Stay at the ranch', url: 'https://backofbeyondranch.farm/stay' },
      { name: 'West Point — California Historical Landmark 268', url: 'https://ohp.parks.ca.gov/ListedResources/Detail/268' },
      { name: 'West Point history (Calaveras Heritage Council)', url: 'https://www.calaverashistory.org/west-point' },
    ],
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
    description: '1849: Henry Pinkney Angell’s trading post from 1848, still a creek camp of tents and a canvas hotel. Miners already wager on frogs. Quartz talk is starting. (Later: stone Angels Hotel 1855; Ben Coon tells Sam Clemens the frog tale in 1865; Jumping Frog Jubilee from 1928. Now: City of Angels, the museum, Frogtown.)',
    region: 'calaveras',
    coordinates: { lat: 38.0680, lng: -120.5396 },
    driveTime: '55 min from BOBR',
    icon: 'frog',
    externalLink: 'https://angelscamp.gov/visiting-angels/',
    sites: [
      { name: 'City of Angels — Visiting Angels', url: 'https://angelscamp.gov/visiting-angels/' },
      { name: 'Angels Camp visitor guide (GoCalaveras)', url: 'https://www.gocalaveras.com/itinerary/gold-country/angels-camp-california/' },
      { name: 'Calaveras County Fair & Jumping Frog Jubilee', url: 'https://www.frogtown.org/' },
      { name: 'Angels Camp Museum', url: 'https://www.gocalaveras.com/business/attractions/angels-camp-museum-2/' },
      { name: 'City museums page', url: 'https://angelscamp.gov/living-in-angels/museums/' },
    ],
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
    description: '1849: John and Daniel Murphy’s gulch from 1848 — muddy street, tents, barrels. French and Italian men are already talking vines. (Later: Murphys Historic Hotel from 1856; a register that will hold Twain, Grant, and by local tradition Black Bart. Now: Visit Murphys, the hotel, Mercer Caverns, Ironstone next door.)',
    region: 'calaveras',
    coordinates: { lat: 38.1375, lng: -120.4620 },
    driveTime: '50 min from BOBR',
    icon: 'wine',
    externalLink: 'https://visitmurphys.com/',
    sites: [
      { name: 'Visit Murphys', url: 'https://visitmurphys.com/' },
      { name: 'Murphys Historic Hotel', url: 'https://murphyshotel.com/' },
      { name: 'Mercer Caverns', url: 'https://mercercaverns.net/' },
      { name: 'Ironstone Vineyards (next door)', url: 'https://ironstonevineyards.com/' },
    ],
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
    description: '1849: miners named this hole for the moan at the mouth. Some drop on ropes for color; others will not go in. Bone is already underfoot — no one here can date it. (Later: largest single chamber in California; spiral-stair tours; remains dated to as much as 13,000 years. Now: Moaning Caverns cave tours.)',
    region: 'calaveras',
    coordinates: { lat: 38.0719, lng: -120.4678 },
    driveTime: '55 min from BOBR',
    icon: 'cave',
    externalLink: 'https://moaningcaverns.com/',
    sites: [
      { name: 'Moaning Caverns', url: 'https://moaningcaverns.com/' },
      { name: 'Moaning Caverns cave tours', url: 'https://moaningcaverns.com/cave-tours/' },
    ],
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
    externalLink: 'https://cavetouring.com/about-ca-cavern',
    sites: [
      { name: 'California Cavern walking tours', url: 'https://cavetouring.com/about-ca-cavern' },
      { name: 'California Cavern (GoCalaveras)', url: 'https://www.gocalaveras.com/business/caves/california-cavern/' },
      { name: 'Cave Touring — California Cavern & Black Chasm', url: 'https://cavetouring.com/' },
    ],
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
    sites: [
      { name: 'Calaveras Big Trees State Park', url: 'https://www.parks.ca.gov/?page_id=551' },
      { name: 'Calaveras Big Trees Association — park info', url: 'https://bigtrees.org/park-info/' },
    ],
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
    description: '1849: placer ground on the ridge above Jackson’s spring camp. A hole is being sunk that the claim book does not explain. Hard-rock talk is only beginning. (Later: Kennedy Mine 1856–1942, shaft 5,912 feet, $34.28 million; tailing wheels 1914. The 1922 fire that killed 47 was the neighboring Argonaut, not the Kennedy. Now: Kennedy Mine tours and Tailing Wheels Park.)',
    region: 'amador',
    coordinates: { lat: 38.3494, lng: -120.7739 },
    driveTime: '40 min from BOBR',
    icon: 'mine',
    externalLink: 'https://kennedygoldmine.com/',
    sites: [
      { name: 'Kennedy Mine Foundation', url: 'https://kennedygoldmine.com/' },
      { name: 'Kennedy Mine (City of Jackson)', url: 'https://www.ci.jackson.ca.us/visit_jackson/kennedy_mine.php' },
      { name: 'Kennedy Tailing Wheels Park', url: 'https://www.ci.jackson.ca.us/visit_jackson/kennedytailingwheelspark.php' },
      { name: 'Tailing wheel restoration project', url: 'https://kennedygoldmine.com/kennedy-tailing-wheel-restoration-project/' },
    ],
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
    description: '1849: one of the richest and meanest camps in the southern mines. Claims limited to sixteen feet square. French, Chilean, and American tents on one slope, already not sharing it. (Later: a killing every weekend for 17 weeks in 1851; the French War that June; Hotel Léger 1851; fires 1854, 1865, 1874. Now: the Léger still open, GoCalaveras Mokelumne Hill guide.)',
    region: 'calaveras',
    coordinates: { lat: 38.2972, lng: -120.7089 },
    driveTime: '25 min from BOBR',
    icon: 'saloon',
    externalLink: 'https://www.gocalaveras.com/itinerary/itineraries/mokelumne-hill-california/',
    sites: [
      { name: 'Mokelumne Hill visitor guide', url: 'https://www.gocalaveras.com/itinerary/itineraries/mokelumne-hill-california/' },
      { name: 'Hotel Léger', url: 'https://www.hotelleger.com/' },
      { name: 'Hotel Léger history (Calaveras Heritage Council)', url: 'https://www.calaverashistory.org/hotel-leger-a-short-history' },
    ],
    linkPrompt: 'Question the locals in this former boomtown',
    linkHint: 'What was this town\'s violent reputation?',
    fact: 'According to the Thompson & West county history, a man was killed in Mokelumne Hill every weekend for 17 straight weeks in 1851 — and claims on its fabulously rich ground were limited to 16 feet square.',
    atmosphere: 'ghostly',
    tags: ['town', 'history', 'gold_rush', 'haunted'],
    shopType: 'saloon',
    adjacentTo: ['bobr_cabin', 'jackson', 'murphys', 'volcano'],
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
    externalLink: 'https://ironstonevineyards.com/',
    sites: [
      { name: 'Ironstone Vineyards', url: 'https://ironstonevineyards.com/' },
      { name: 'Visit Murphys (town next door)', url: 'https://visitmurphys.com/' },
    ],
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
    description: '1849: a camp at a spring of empty bottles — Botilleas — not yet a brick county seat. Chinese miners are already cutting a way under the muddy street. Warrants are a man’s word. (Later: Calaveras seat 1850–52, Amador seat from 1854; hanging tree at 26 Main, 1851–55; National Hotel 1852; St. Sava 1894. Now: City of Jackson Visit pages, Kennedy Mine, Tailing Wheels, Amador County Museum, Saint Sava.)',
    region: 'amador',
    coordinates: { lat: 38.3489, lng: -120.7739 },
    driveTime: '40 min from BOBR',
    icon: 'building',
    // tourjackson.com is NOT Jackson, CA (and currently a spam domain).
    // visitjackson.com is Jackson, Mississippi. City of Jackson CA is ci.jackson.ca.us.
    externalLink: 'https://www.ci.jackson.ca.us/visit_jackson/index.php',
    sites: [
      { name: 'Visit Jackson (City of Jackson, CA)', url: 'https://www.ci.jackson.ca.us/visit_jackson/index.php' },
      { name: 'Things to do in Jackson', url: 'https://www.ci.jackson.ca.us/visit_jackson/things_to_do.php' },
      { name: 'Kennedy Gold Mine', url: 'https://kennedygoldmine.com/' },
      { name: 'Kennedy Tailing Wheels Park', url: 'https://www.ci.jackson.ca.us/visit_jackson/kennedytailingwheelspark.php' },
      { name: 'Amador County Museum', url: 'https://www.amadorcountyhistoricalsociety.org/' },
      { name: 'Saint Sava Serbian Orthodox Church', url: 'https://www.stsavajackson.org/' },
      { name: 'Main Street Theatre Works', url: 'https://www.mstw.org/' },
      { name: 'Jackson — Amador County Chamber', url: 'https://amadorchamber.com/jackson/' },
    ],
    linkPrompt: 'Explore the historic downtown',
    linkHint: 'What happened at 26 Main Street?',
    fact: 'Jackson\'s hanging tree stood at 26 Main Street, where ten men were lynched between 1851 and 1855; the tree was cut down after the fire of 1862.',
    atmosphere: 'mysterious',
    tags: ['town', 'history', 'tunnels', 'county_seat'],
    shopType: 'general',
    adjacentTo: ['kennedy_mine', 'mokelumne_hill', 'volcano'],
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
    // parks.ca.gov/?page_id=549 is Wilder Ranch State Park (Santa Cruz), not Coyote Creek.
    externalLink: 'https://www.gocalaveras.com/business/outdoor-recreation/natural-bridges/',
    sites: [
      { name: 'Natural Bridges trail (GoCalaveras / USBR New Melones)', url: 'https://www.gocalaveras.com/business/outdoor-recreation/natural-bridges/' },
      { name: 'New Melones — planning your visit (USBR)', url: 'https://www.usbr.gov/mp/ccao/newmelones/planning-visit/index.html' },
      { name: 'Western Cave Conservancy — Natural Bridges', url: 'https://naturalbridges.westerncaves.org/' },
    ],
    linkPrompt: 'Search the limestone formations',
    linkHint: 'How were these bridges formed?',
    fact: 'The Natural Bridges formed as Coyote Creek dissolved the limestone over millions of years, creating caves whose ceilings eventually collapsed — leaving the creek running beneath natural rock arches.',
    atmosphere: 'wild',
    tags: ['nature', 'hiking', 'geology', 'swimming'],
    shopType: 'none',
    adjacentTo: ['bobr_cabin', 'angels_camp'],
    travelDistance: 2,
    specialFeature: 'gold_panning',
  },
  {
    // Town-investigation exemplar. History verified 2026-07-16 (Western Mining History;
    // Amador County Chamber; en.wikipedia Volcano, California). 1849 = the EARLY placer
    // rush (tent-and-canvas), NOT the 1850s stone town: the limestone stores (1855),
    // Masonic Cave/Lodge 56 (1854) and Old Abe cannon (Civil War) are all LATER and are
    // NOT presented here as present-1849 fact. Cast + grounded clues in goldCountryNPCs.ts.
    id: 'volcano',
    name: 'Volcano',
    shortName: 'Volcano',
    description: 'One of the richest placer camps in the southern mines, born in 1849 as \'Soldiers Gulch\' after men of Colonel Stevenson\'s New York regiment struck color here the year before. The camp sits in a crater-like limestone basin, and the morning mist that rises from it gave the town its name — there is no volcano. In these early days it is a raw sprawl of tents and canvas stores, its gravels famously rich (a hundred dollars a day was common talk) and growing richer the deeper they were dug, the gold caught in potholes worn into the limestone. The southern mines are astonishingly mixed — Sonoran and Chilean placer men, Anglo-Americans, and the Northern Sierra Miwok on whose homeland it all unfolds.',
    region: 'amador',
    coordinates: { lat: 38.4441, lng: -120.6299 },
    driveTime: '35 min from BOBR',
    icon: 'saloon',
    externalLink: 'https://amadorchamber.com/volcano/',
    sites: [
      { name: 'Volcano — Amador County Chamber', url: 'https://amadorchamber.com/volcano/' },
      { name: 'St. George Hotel', url: 'https://stgeorgevolcano.com/' },
      { name: 'St. George Historic Hotel (Visit Amador)', url: 'https://www.visitamador.com/business/st-george-historic-hotel' },
      { name: 'Indian Grinding Rock State Historic Park (Chaw\'se)', url: 'https://www.parks.ca.gov/?page_id=553' },
      { name: 'Chaw\'se Association — park visitor info', url: 'https://chawse.org/park/' },
      { name: 'Volcano mining history', url: 'https://westernmininghistory.com/towns/california/volcano/' },
    ],
    linkPrompt: 'Talk your way into the 1849 camp',
    linkHint: 'How did a town with no volcano get its name?',
    fact: 'Volcano began in 1849 as \'Soldiers Gulch,\' named after Colonel Stevenson\'s New York regiment; it was renamed for the crater-like basin it sits in and the morning mist that seems to rise like a volcano. Its placers were among the richest in the Mother Lode.',
    atmosphere: 'historic',
    tags: ['town', 'gold_rush', 'placer', '1849', 'history'],
    shopType: 'saloon',
    adjacentTo: ['jackson', 'mokelumne_hill'],
    travelDistance: 3,
    specialFeature: 'town_investigation_1849',
  }
]

// Helper to get location by ID
export function getGoldCountryLocation(id: string): GoldCountryLocation | undefined {
  return GOLD_COUNTRY_LOCATIONS.find(loc => loc.id === id)
}

/** Named real-world pages for a place. Falls back to the single hub link. */
export function getLocationSites(location: GoldCountryLocation): GoldCountryPlaceSite[] {
  if (location.sites && location.sites.length > 0) return location.sites
  if (location.externalLink) return [{ name: 'Visit for real', url: location.externalLink }]
  return []
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
