/**
 * Gold Country Locations - Real California Gold Rush Sites
 * Migrated from Carmen Sandiego game for educational content integration
 */

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
}

export const GOLD_COUNTRY_LOCATIONS: GoldCountryLocation[] = [
  {
    id: 'bobr_cabin',
    name: 'Back of Beyond Ranch',
    shortName: 'BOBR Cabin',
    description: 'Your mountain hideaway and investigation headquarters. The cabin\'s guest book might contain clues from previous visitors...',
    region: 'west_point',
    coordinates: { lat: 38.3947, lng: -120.5269 },
    driveTime: '0 min',
    icon: 'cabin',
    externalLink: 'https://www.airbnb.com/rooms/30045739',
    linkPrompt: 'Search the cabin listing for evidence',
    linkHint: 'Look for photos that might reveal clues about the local area',
    fact: 'The Back of Beyond Ranch sits at 3,000 feet elevation in the Sierra Nevada foothills, where the Gold Rush pioneers once searched for fortune.',
    atmosphere: 'cozy',
    tags: ['lodging', 'base_camp', 'mountain']
  },
  {
    id: 'angels_camp',
    name: 'Angels Camp',
    shortName: 'Angels Camp',
    description: 'The historic town where Mark Twain heard the tale that launched his career. The annual Jumping Frog Jubilee continues the legacy.',
    region: 'calaveras',
    coordinates: { lat: 38.0680, lng: -120.5396 },
    driveTime: '35 min from BOBR',
    icon: 'frog',
    externalLink: 'https://www.gocalaveras.com/angels-camp/',
    linkPrompt: 'Investigate the town\'s Twain connection',
    linkHint: 'When did Twain visit this town?',
    fact: 'Mark Twain visited Angels Camp in 1864-1865, where he heard the story that became \'The Celebrated Jumping Frog of Calaveras County.\'',
    atmosphere: 'historic',
    tags: ['town', 'twain', 'gold_rush', 'festival']
  },
  {
    id: 'murphys',
    name: 'Murphys',
    shortName: 'Murphys',
    description: 'A charming Gold Rush town with over 20 wine tasting rooms. The Murphys Historic Hotel guest register includes famous signatures.',
    region: 'calaveras',
    coordinates: { lat: 38.1377, lng: -120.4613 },
    driveTime: '25 min from BOBR',
    icon: 'wine',
    externalLink: 'https://visitmurphys.com/',
    linkPrompt: 'Explore the wine trail for clues',
    linkHint: 'Famous guests have stayed at the historic hotel',
    fact: 'The Murphys Hotel guest register, dating to the 1850s, contains signatures of Mark Twain, Ulysses S. Grant, and Black Bart.',
    atmosphere: 'charming',
    tags: ['town', 'wine', 'history', 'dining']
  },
  {
    id: 'moaning_cavern',
    name: 'Moaning Cavern',
    shortName: 'Moaning Cavern',
    description: 'California\'s largest public cavern, named for the eerie sound that once emanated from its entrance. Perfect for hiding stolen goods...',
    region: 'calaveras',
    coordinates: { lat: 38.0719, lng: -120.4678 },
    driveTime: '30 min from BOBR',
    icon: 'cave',
    externalLink: 'https://www.caverntours.com/moaning-cavern/',
    linkPrompt: 'Descend into the cavern for clues',
    linkHint: 'How deep is the main chamber?',
    fact: 'Moaning Cavern\'s main chamber is large enough to hold the Statue of Liberty. Human remains found here date back 13,000 years.',
    atmosphere: 'mysterious',
    tags: ['cave', 'adventure', 'geology', 'history']
  },
  {
    id: 'california_caverns',
    name: 'California Caverns',
    shortName: 'CA Caverns',
    description: 'One of the most extensive cave systems in the state, with pristine crystalline formations and a dark history of Gold Rush-era exploration.',
    region: 'calaveras',
    coordinates: { lat: 38.1728, lng: -120.4211 },
    driveTime: '40 min from BOBR',
    icon: 'crystal',
    externalLink: 'https://www.caverntours.com/california-caverns/',
    linkPrompt: 'Search the crystalline chambers',
    linkHint: 'What rare formations can be found here?',
    fact: 'California Caverns contains rare aragonite crystal formations and an underground lake. John Muir explored these caves in 1858.',
    atmosphere: 'wondrous',
    tags: ['cave', 'crystals', 'adventure', 'rare']
  },
  {
    id: 'big_trees',
    name: 'Calaveras Big Trees',
    shortName: 'Big Trees',
    description: 'Home to giant sequoias, some of the largest and oldest living things on Earth. The forest holds ancient secrets.',
    region: 'calaveras',
    coordinates: { lat: 38.2822, lng: -120.3081 },
    driveTime: '45 min from BOBR',
    icon: 'tree',
    externalLink: 'https://www.parks.ca.gov/?page_id=551',
    linkPrompt: 'Search among the ancient giants',
    linkHint: 'How old are these trees?',
    fact: 'The Discovery Tree, found in 1852, was over 1,200 years old. Its stump was so large that 32 people once danced on it at a party.',
    atmosphere: 'majestic',
    tags: ['nature', 'hiking', 'sequoias', 'park']
  },
  {
    id: 'kennedy_mine',
    name: 'Kennedy Mine',
    shortName: 'Kennedy Mine',
    description: 'Once one of the deepest gold mines in the world, now a fascinating museum of Gold Rush engineering and tragedy.',
    region: 'amador',
    coordinates: { lat: 38.3494, lng: -120.7739 },
    driveTime: '50 min from BOBR',
    icon: 'mine',
    externalLink: 'https://www.kennedygoldmine.com/',
    linkPrompt: 'Investigate the abandoned mine',
    linkHint: 'How deep did the miners dig?',
    fact: 'Kennedy Mine reached a depth of 5,912 feet, making it one of the deepest gold mines in North America. A tragic fire in 1922 claimed 47 lives.',
    atmosphere: 'haunting',
    tags: ['mine', 'history', 'gold_rush', 'museum']
  },
  {
    id: 'mokelumne_hill',
    name: 'Mokelumne Hill',
    shortName: 'Moke Hill',
    description: 'Once the wildest town in the Mother Lode, with a murder a week during the Gold Rush. The spirits of the past linger here.',
    region: 'calaveras',
    coordinates: { lat: 38.2972, lng: -120.7089 },
    driveTime: '35 min from BOBR',
    icon: 'saloon',
    externalLink: 'https://www.gocalaveras.com/mokelumne-hill/',
    linkPrompt: 'Question the locals in this former boomtown',
    linkHint: 'What was this town\'s violent reputation?',
    fact: 'Mokelumne Hill had 17 murders in a single weekend during 1851. The Hotel Leger is said to be haunted by Gold Rush ghosts.',
    atmosphere: 'ghostly',
    tags: ['town', 'history', 'gold_rush', 'haunted']
  },
  {
    id: 'ironstone_vineyards',
    name: 'Ironstone Vineyards',
    shortName: 'Ironstone',
    description: 'A stunning winery estate featuring elaborate gardens, a museum, and home to the world\'s largest crystalline gold leaf specimen.',
    region: 'calaveras',
    coordinates: { lat: 38.1393, lng: -120.4511 },
    driveTime: '25 min from BOBR',
    icon: 'grapes',
    externalLink: 'https://www.ironstonevineyards.com/',
    linkPrompt: 'Search the vineyard cellars',
    linkHint: 'What treasure is displayed in their museum?',
    fact: 'Ironstone displays a 44-pound crystalline gold leaf specimen found in nearby Jamestown - the largest in existence.',
    atmosphere: 'elegant',
    tags: ['winery', 'museum', 'gardens', 'gold']
  },
  {
    id: 'jackson',
    name: 'Jackson',
    shortName: 'Jackson',
    description: 'The Amador County seat, a well-preserved Gold Rush town with historic buildings and a dark underground past.',
    region: 'amador',
    coordinates: { lat: 38.3489, lng: -120.7739 },
    driveTime: '55 min from BOBR',
    icon: 'building',
    externalLink: 'https://www.tourjackson.com/',
    linkPrompt: 'Explore the historic downtown',
    linkHint: 'What lies beneath the streets?',
    fact: 'Jackson has a network of Chinese tunnels beneath Main Street, built during the Gold Rush when Chinese workers faced discrimination above ground.',
    atmosphere: 'mysterious',
    tags: ['town', 'history', 'tunnels', 'county_seat']
  },
  {
    id: 'natural_bridges',
    name: 'Natural Bridges',
    shortName: 'Natural Bridges',
    description: 'A hidden geological wonder where Coyote Creek has carved massive limestone caves and natural bridge formations.',
    region: 'calaveras',
    coordinates: { lat: 38.1194, lng: -120.4892 },
    driveTime: '20 min from BOBR',
    icon: 'bridge',
    externalLink: 'https://www.parks.ca.gov/?page_id=549',
    linkPrompt: 'Search the limestone formations',
    linkHint: 'How were these bridges formed?',
    fact: 'The Natural Bridges were formed over millions of years as Coyote Creek dissolved the limestone, creating a cave that eventually collapsed to form the bridges.',
    atmosphere: 'wild',
    tags: ['nature', 'hiking', 'geology', 'swimming']
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
