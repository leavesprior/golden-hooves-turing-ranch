'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import {
  ExplorerProvider,
  useExplorer,
  XPBar,
  BadgeDisplay,
  ChallengeCard,
  type Town,
  type Attraction,
  type AttractionCategory,
  EXPLORER_LEVELS,
  COLLECTION_BADGES,
} from './explorerContext'
import {
  getMysteryForTown,
  getClueForAttraction,
  type TownMystery,
} from './data/townMysteries'

// ============================================
// TOWN & ATTRACTION DATA
// ============================================

const TOWNS: Town[] = [
  {
    id: 'volcano',
    name: 'Volcano',
    tagline: 'The Town That Wouldn\'t Die',
    description: 'Once home to 17,000 souls during the Gold Rush, now a charming ghost town with 85 residents and countless secrets.',
    townStory: 'Founded in 1848, Volcano was named for the volcanic-like appearance of its gold-bearing quartz. It was briefly considered for California\'s capital and housed the state\'s first lending library, astronomical observatory, and little theatre.',
    coordinates: { lat: 38.4413, lng: -120.6294 },
    attractions: [
      {
        id: 'vol_st_george',
        name: 'St. George Hotel',
        icon: '👻',
        category: 'history',
        description: 'Historic hotel haunted since 1862. Original Gold Rush ambiance with reported ghost sightings.',
        funFact: 'The hotel\'s "resident ghost" Armand is said to appear on rainy nights, still searching for his lost gold claim.',
        insiderTip: 'Ask for Room 14 - it has the most paranormal activity according to ghost hunters.',
        duration: '1-2 hours',
        xp: 25,
      },
      {
        id: 'vol_theatre',
        name: 'Cobblestone Theatre',
        icon: '🎭',
        category: 'entertainment',
        description: 'California\'s oldest continuously operating theatre (1856). Live performances in a Gold Rush-era setting.',
        funFact: 'Mark Twain reportedly attended a performance here during his time in the Gold Country.',
        insiderTip: 'Summer shows sell out fast - book tickets at least 2 weeks in advance.',
        duration: '2-3 hours',
        xp: 20,
        coordinates: { lat: 38.4420, lng: -120.6280 },
      },
      {
        id: 'vol_observatory',
        name: 'Old Observatory Site',
        icon: '🔭',
        category: 'history',
        description: 'Site of California\'s first astronomical observatory (1860). Built by Gold Rush miners hungry for knowledge.',
        funFact: 'The observatory was built by the Volcano Blues, a local literary society that valued education.',
        insiderTip: 'Visit at dusk for atmospheric photos with the Sierra Nevada backdrop.',
        duration: '30 min',
        xp: 15,
      },
      {
        id: 'vol_cemetery',
        name: 'Pioneer Cemetery',
        icon: '🪦',
        category: 'mystery',
        description: 'Final resting place of Gold Rush pioneers. Weathered headstones tell tales of hope and tragedy.',
        funFact: 'Several graves are marked simply "Unknown" - miners who struck it rich often changed their names.',
        insiderTip: 'Look for the graves dated 1850-1860 - the earliest settlers\' stories are etched in stone.',
        duration: '45 min',
        xp: 20,
      },
      {
        id: 'vol_cannon',
        name: 'Old Abe Cannon',
        icon: '💣',
        category: 'history',
        description: 'Civil War cannon that was smuggled to Volcano but never fired in battle.',
        funFact: 'Old Abe was hidden in a mine shaft to prevent Confederates from seizing it during the Civil War.',
        insiderTip: 'The cannon is near the General Store - perfect for a historic photo op.',
        duration: '15 min',
        xp: 10,
      },
    ],
    secretAttractions: [
      {
        id: 'vol_tunnels',
        name: 'Chinese Tunnels',
        icon: '🕳️',
        category: 'mystery',
        description: 'Secret underground tunnels built by Chinese miners. Most are sealed, but traces remain.',
        funFact: 'Chinese miners were forced to work claims white miners had abandoned - and sometimes found rich deposits.',
        insiderTip: 'Ask locals about the old Chinese camp near the creek - some stone walls still stand.',
        secretUnlock: 'Reach Level 3 (Forty-Niner)',
        duration: '30 min',
        xp: 50,
        badge: { id: 'tunnel_explorer', name: 'Tunnel Explorer', icon: '🕳️', description: 'Discovered the Chinese tunnels', rarity: 'rare' },
      },
    ],
  },
  {
    id: 'angels_camp',
    name: 'Angels Camp',
    tagline: 'Home of the Jumping Frog',
    description: 'Where Mark Twain heard the story that launched his career. Every year, frogs compete for glory at the Frog Jump Jubilee.',
    townStory: 'Founded by George Angel in 1848, Angels Camp became famous after Mark Twain\'s 1865 short story "The Celebrated Jumping Frog of Calaveras County" put it on the literary map.',
    coordinates: { lat: 38.0684, lng: -120.5394 },
    attractions: [
      {
        id: 'ac_frog_jubilee',
        name: 'Frog Jump Jubilee',
        icon: '🐸',
        category: 'entertainment',
        description: 'Annual frog jumping competition held every May since 1928. Rent a frog and compete!',
        funFact: 'The current record is 21 feet 5 3/4 inches, set by Rosie the Ribeter in 1986.',
        insiderTip: 'Come in May for the real competition, but you can see the arena year-round.',
        duration: 'Full day (during festival)',
        xp: 30,
      },
      {
        id: 'ac_twain_cabin',
        name: 'Mark Twain Cabin Site',
        icon: '📚',
        category: 'history',
        description: 'Near where Twain stayed when he heard the jumping frog story from bartender Ben Coon.',
        funFact: 'Twain was actually broke and hiding from creditors when he came to Gold Country - the frog story saved his career.',
        insiderTip: 'The original cabin is gone, but the museum has artifacts from Twain\'s time here.',
        duration: '1 hour',
        xp: 25,
        badge: { id: 'twain_pilgrim', name: 'Twain Pilgrim', icon: '📚', description: 'Walked in Mark Twain\'s footsteps', rarity: 'uncommon' },
      },
      {
        id: 'ac_museum',
        name: 'Angels Camp Museum',
        icon: '🏛️',
        category: 'history',
        description: 'Extensive collection of Gold Rush artifacts, mining equipment, and local history.',
        funFact: 'The museum has a massive collection of horse-drawn carriages from the Gold Rush era.',
        insiderTip: 'Ask about the guided tour of the outdoor mining exhibits - worth the extra time.',
        duration: '2 hours',
        xp: 20,
      },
      {
        id: 'ac_sutter_mine',
        name: 'Sutter Gold Mine',
        icon: '⛏️',
        category: 'adventure',
        description: 'Underground mine tour through actual gold-bearing quartz veins. Pan for gold!',
        funFact: 'Gold is still present in the mine - the tour lets you see it glittering in the quartz.',
        insiderTip: 'The underground portion is 58°F year-round - bring a jacket even in summer.',
        duration: '1.5 hours',
        xp: 35,
      },
      {
        id: 'ac_main_street',
        name: 'Historic Main Street',
        icon: '🏘️',
        category: 'history',
        description: 'Preserved Gold Rush-era buildings, antique shops, and local cafes.',
        funFact: 'Many of the storefronts have maintained their original 1850s architecture.',
        insiderTip: 'Check out the historic markers embedded in the sidewalks - each tells a story.',
        duration: '1-2 hours',
        xp: 15,
      },
    ],
    secretAttractions: [
      {
        id: 'ac_carson_hill',
        name: 'Carson Hill Nugget Site',
        icon: '🏆',
        category: 'mystery',
        description: 'Where California\'s largest gold nugget (195 lbs) was discovered in 1854.',
        funFact: 'The nugget was worth $43,534 in 1854 - over $1.5 million in today\'s money.',
        insiderTip: 'The exact spot is unmarked but locals know. The hill overlooks the valley.',
        secretUnlock: 'Visit all Angels Camp attractions',
        duration: '1 hour',
        xp: 75,
        badge: { id: 'nugget_hunter', name: 'Nugget Hunter', icon: '🏆', description: 'Found the largest nugget site', rarity: 'legendary' },
      },
    ],
  },
  {
    id: 'west_point',
    name: 'West Point',
    tagline: 'Crossroads of the Mother Lode',
    description: 'Named by Kit Carson during his 1840s exploration. A vital supply town for miners heading to the high Sierra claims.',
    townStory: 'West Point sits at the crossroads of ancient Native American trading routes. Kit Carson named it during an 1844 expedition, and it became a critical supply point for Gold Rush miners.',
    coordinates: { lat: 38.3965, lng: -120.5269 },
    attractions: [
      {
        id: 'wp_main_street',
        name: 'Main Street Walk',
        icon: '🚶',
        category: 'history',
        description: 'Preserved historic district with original Gold Rush-era buildings and wooden boardwalks.',
        funFact: 'The town\'s population swelled to 10,000 during the Gold Rush - now it\'s under 1,000.',
        insiderTip: 'Visit on a weekday morning for the quietest, most atmospheric experience.',
        duration: '1 hour',
        xp: 15,
      },
      {
        id: 'wp_willows',
        name: 'Willows on Main',
        icon: '☕',
        category: 'dining',
        description: 'Cozy coffee house at 311 Main Street, housed in the former Academy Club building from West Point\'s Gold Rush days.',
        funFact: 'The building once served as the Academy Club - a gathering spot for miners and townsfolk. Now it serves espresso and mimosas instead of whiskey.',
        insiderTip: 'Try the frozen blended drinks made with real ice cream. Open Thu-Tue, 7am-3pm. Closed Wednesdays.',
        duration: '30 min - 1 hour',
        xp: 15,
      },
      {
        id: 'wp_kit_carson',
        name: 'Kit Carson Marker',
        icon: '🧭',
        category: 'history',
        description: 'Historical marker where Kit Carson camped and named the town in 1844.',
        funFact: 'Carson was a famous scout, trapper, and Indian agent. He couldn\'t read or write.',
        insiderTip: 'The marker is easy to miss - it\'s near the cemetery on the west edge of town.',
        duration: '15 min',
        xp: 10,
      },
      {
        id: 'wp_general_store',
        name: 'Historic General Store',
        icon: '🏪',
        category: 'history',
        description: 'Working general store with authentic Gold Rush goods and local products.',
        funFact: 'The original store sold mining supplies - picks, pans, and pack mules.',
        insiderTip: 'They sell actual gold panning kits - perfect souvenirs.',
        duration: '30 min',
        xp: 10,
      },
    ],
    secretAttractions: [
      {
        id: 'wp_sandy_gulch',
        name: 'Sandy Gulch Mine',
        icon: '🕳️',
        category: 'adventure',
        description: 'Abandoned mine shaft visible from a hiking trail. The entrance is fenced but dramatic.',
        funFact: 'This mine operated from 1852-1890 and produced over $2 million in gold.',
        insiderTip: 'The trail to Sandy Gulch starts behind the cemetery. Bring sturdy shoes.',
        secretUnlock: 'Reach Level 4 (Gold Country Guide)',
        duration: '2 hours (hike)',
        xp: 60,
      },
    ],
  },
  {
    id: 'mokelumne_hill',
    name: 'Mokelumne Hill',
    tagline: 'The Murder Capital',
    description: 'Once the deadliest town in the Gold Country. A murder a week was common in 1851. Now peacefully haunted.',
    townStory: 'At its peak, "Moke Hill" had 10,000 residents and was so lawless that it earned the nickname "Murder Capital of Gold Country." The Hotel Leger is said to be haunted by victims.',
    coordinates: { lat: 38.2993, lng: -120.7091 },
    attractions: [
      {
        id: 'mh_hotel_leger',
        name: 'Hotel Leger',
        icon: '👻',
        category: 'mystery',
        description: 'California\'s oldest continuously operating hotel. Haunted by George Leger and others.',
        funFact: 'Ghost hunters from TV shows have documented over 20 distinct spirits at the hotel.',
        insiderTip: 'Book a night if you dare - the haunted room tours are available to non-guests too.',
        duration: '1-2 hours (tour)',
        xp: 35,
        badge: { id: 'ghost_hunter', name: 'Ghost Hunter', icon: '👻', description: 'Braved the haunted Hotel Leger', rarity: 'rare' },
      },
      {
        id: 'mh_courthouse',
        name: 'Historic Courthouse',
        icon: '⚖️',
        category: 'history',
        description: 'Where frontier justice was served swiftly. Many outlaws met their fate here.',
        funFact: 'The courthouse now houses a museum with actual hanging records and outlaw photos.',
        insiderTip: 'The old jail cells in the basement are open for viewing - bring a flashlight.',
        duration: '1 hour',
        xp: 20,
      },
      {
        id: 'mh_gallows',
        name: 'Old Gallows Site',
        icon: '💀',
        category: 'mystery',
        description: 'Where public executions were held. Marked but not well-known.',
        funFact: 'At least 17 men were hanged here between 1851 and 1862.',
        insiderTip: 'The site is on a hill behind the town - ask at the hotel for directions.',
        duration: '30 min',
        xp: 25,
      },
      {
        id: 'mh_french_cemetery',
        name: 'French Cemetery',
        icon: '🪦',
        category: 'history',
        description: 'Separate cemetery for French miners who formed their own community in the 1850s.',
        funFact: 'Many French miners came from Paris during a gold fever that swept France in 1849.',
        insiderTip: 'The ironwork gates and fences are original - beautiful examples of 1850s French craftsmanship.',
        duration: '45 min',
        xp: 20,
      },
      {
        id: 'mh_ioof_hall',
        name: 'I.O.O.F. Hall',
        icon: '🏛️',
        category: 'history',
        description: 'Historic Odd Fellows hall, one of many fraternal organizations in Gold Rush towns.',
        funFact: 'Fraternal organizations provided insurance and community support when government couldn\'t.',
        insiderTip: 'The building is often open during town events - check for local festivals.',
        duration: '30 min',
        xp: 15,
      },
    ],
    secretAttractions: [
      {
        id: 'mh_chinese_walls',
        name: 'Chinese Walls',
        icon: '🧱',
        category: 'mystery',
        description: 'Remnants of rock walls built by Chinese miners, hidden in the hills outside town.',
        funFact: 'Chinese miners built these walls to mark claims and divert water for hydraulic mining.',
        insiderTip: 'Take the trail north of town past the French Cemetery - look for stacked stones.',
        secretUnlock: 'Complete the Black Bart Mystery Trail',
        duration: '2 hours (hike)',
        xp: 65,
      },
    ],
  },
  {
    id: 'san_andreas',
    name: 'San Andreas',
    tagline: 'Where Black Bart Was Caught',
    description: 'County seat where the notorious Black Bart was finally captured, thanks to a laundry mark.',
    townStory: 'San Andreas became the Calaveras County seat in 1866. In 1883, it gained fame when Black Bart was captured here after a dropped handkerchief led detectives to his San Francisco laundry.',
    coordinates: { lat: 38.1960, lng: -120.6807 },
    attractions: [
      {
        id: 'sa_courthouse',
        name: 'Historic Courthouse',
        icon: '⚖️',
        category: 'history',
        description: 'Where Black Bart was tried and convicted. The courtroom is preserved as a museum.',
        funFact: 'Black Bart served only 4 years of a 6-year sentence for good behavior.',
        insiderTip: 'The museum has the actual laundry mark that led to Bart\'s capture: F.X.O.7',
        duration: '1.5 hours',
        xp: 30,
        badge: { id: 'detective', name: 'Amateur Detective', icon: '🔍', description: 'Solved the Black Bart case', rarity: 'uncommon' },
      },
      {
        id: 'sa_museum',
        name: 'Calaveras County Museum',
        icon: '🏛️',
        category: 'history',
        description: 'Comprehensive museum of Gold Country history, Native American artifacts, and mining equipment.',
        funFact: 'The museum has a complete recreated 1850s gold assay office.',
        insiderTip: 'Don\'t miss the underground mine replica in the basement.',
        duration: '2 hours',
        xp: 25,
      },
      {
        id: 'sa_frog_park',
        name: 'Jumping Frog Park',
        icon: '🐸',
        category: 'nature',
        description: 'Small park with frog statues celebrating the famous Twain story. Perfect for families.',
        funFact: 'The park has a bronze frog that tourists rub for luck.',
        insiderTip: 'Great picnic spot - there\'s often a food truck nearby on weekends.',
        duration: '30 min',
        xp: 10,
      },
      {
        id: 'sa_main_street',
        name: 'Historic Main Street',
        icon: '🏘️',
        category: 'history',
        description: 'Well-preserved downtown with Gold Rush architecture and local shops.',
        funFact: 'Several buildings survived the fires that destroyed most Gold Rush towns.',
        insiderTip: 'The best antique shops are on the south end of Main Street.',
        duration: '1-2 hours',
        xp: 15,
      },
    ],
    secretAttractions: [
      {
        id: 'sa_bart_capture',
        name: 'Black Bart Capture Site',
        icon: '🎭',
        category: 'mystery',
        description: 'The exact spot where Wells Fargo detective James Hume arrested Black Bart.',
        funFact: 'Bart was living as a respectable mining engineer named Charles Bolton when arrested.',
        insiderTip: 'The site is unmarked but locals know - ask at the museum.',
        secretUnlock: 'Visit the courthouse AND complete 5 history sites',
        duration: '30 min',
        xp: 50,
        badge: { id: 'bart_tracker', name: 'Bart Tracker', icon: '🎭', description: 'Found Black Bart\'s capture site', rarity: 'legendary' },
      },
    ],
  },
  {
    id: 'bobr_ranch',
    name: 'BOBR Ranch',
    tagline: 'Your Base Camp',
    description: 'Your adventure headquarters in Gold Country. Where the games begin and the real explorations start.',
    townStory: 'BOBR Ranch combines the best of Gold Country hospitality with modern amenities. Your staging point for both virtual adventures and real-world exploration.',
    coordinates: { lat: 38.4000, lng: -120.5000 },
    attractions: [
      {
        id: 'bobr_cabin',
        name: 'The Main Cabin',
        icon: '🏠',
        category: 'adventure',
        description: 'Your home base. Cozy accommodations with modern amenities and Gold Rush character.',
        funFact: 'The cabin was built using reclaimed timber from actual Gold Rush-era buildings.',
        insiderTip: 'Book the loft room for the best stargazing through the skylight.',
        duration: 'As long as you stay!',
        xp: 50,
      },
      {
        id: 'bobr_treasure',
        name: 'Treasure Hunt Trail',
        icon: '🗺️',
        category: 'adventure',
        description: 'Multi-stage treasure hunt across the ranch property. Clues hidden everywhere.',
        funFact: 'The treasure hunt changes seasonally - return visits have new puzzles!',
        insiderTip: 'Start at the old oak tree and follow the compass directions.',
        duration: '2-3 hours',
        xp: 40,
      },
      {
        id: 'bobr_campfire',
        name: 'Campfire Circle',
        icon: '🔥',
        category: 'entertainment',
        description: 'Evening gathering spot for stories, s\'mores, and stargazing.',
        funFact: 'On clear nights, you can see the Milky Way - no light pollution here.',
        insiderTip: 'Sunset to 9pm is the magic hour. Bring a blanket.',
        duration: '1-2 hours',
        xp: 15,
      },
      {
        id: 'bobr_gold_pan',
        name: 'Gold Panning Station',
        icon: '⛏️',
        category: 'adventure',
        description: 'Learn to pan for gold like a real Forty-Niner. Keep what you find!',
        funFact: 'The gravel is seeded with real gold flakes - success is guaranteed.',
        insiderTip: 'Morning is best - the gold shows up better in angled sunlight.',
        duration: '1 hour',
        xp: 25,
      },
    ],
    secretAttractions: [
      {
        id: 'bobr_secret',
        name: 'Pryor\'s Hidden Stash',
        icon: '💎',
        category: 'mystery',
        description: 'A geocache hidden somewhere on Pryor\'s Back of Beyond Ranch. Coordinates change yearly.',
        funFact: 'Pryor is the character from the BOBR games - or is he just a character?',
        insiderTip: 'The clue is hidden in one of the games. Pay attention to the dialogue.',
        secretUnlock: 'Complete the prologue game AND stay at the ranch',
        duration: '1-2 hours',
        xp: 100,
        badge: { id: 'tobias_heir', name: 'Tobias\'s Heir', icon: '💎', description: 'Found the hidden stash', rarity: 'legendary' },
      },
    ],
  },
]

// Category color mapping
const categoryColors: Record<AttractionCategory, string> = {
  history: 'text-amber-400 border-amber-500 bg-amber-900/40',
  dining: 'text-green-400 border-green-500 bg-green-900/40',
  adventure: 'text-blue-400 border-blue-500 bg-blue-900/40',
  nature: 'text-emerald-400 border-emerald-500 bg-emerald-900/40',
  mystery: 'text-purple-400 border-purple-500 bg-purple-900/40',
  entertainment: 'text-pink-400 border-pink-500 bg-pink-900/40',
}

const categoryIcons: Record<AttractionCategory, string> = {
  history: '📜',
  dining: '🍽️',
  adventure: '⚔️',
  nature: '🌲',
  mystery: '🔮',
  entertainment: '🎭',
}

// ============================================
// COMPONENTS
// ============================================

// Bottom sheet for town details (mobile-first)
function TownDrawer({
  town,
  isOpen,
  onClose,
}: {
  town: Town | null
  isOpen: boolean
  onClose: () => void
}) {
  const {
    progress,
    currentLevel,
    visitAttraction,
    visitTown,
    unlockSecret,
    isAttractionVisited,
    isSecretUnlocked,
    getTownCompletionPercent,
    toggleFavorite,
    isFavorite,
    discoverClue,
    attemptMysteryDeduction,
    getMysteryProgress,
    isMysteryClueFound,
    isMysteryDeductionUnlocked,
    isMysterySolved,
  } = useExplorer()

  const [selectedCategory, setSelectedCategory] = useState<AttractionCategory | 'all'>('all')
  const [expandedAttraction, setExpandedAttraction] = useState<string | null>(null)
  const [clueNotification, setClueNotification] = useState<{ text: string; discoveryText: string } | null>(null)
  const [showDeduction, setShowDeduction] = useState(false)
  const [deductionResult, setDeductionResult] = useState<{ correct: boolean; response: string } | null>(null)

  // Reset deduction state when town changes
  useEffect(() => {
    setShowDeduction(false)
    setDeductionResult(null)
    setClueNotification(null)
  }, [town?.id])

  if (!town) return null

  const completionPercent = getTownCompletionPercent(town.id)
  const allAttractions = selectedCategory === 'all'
    ? town.attractions
    : town.attractions.filter(a => a.category === selectedCategory)

  // Filter secrets by unlock status and level
  const availableSecrets = town.secretAttractions.filter(s => {
    if (isSecretUnlocked(s.id)) return true
    // Check if player meets unlock requirements
    if (s.secretUnlock?.includes('Level 3') && currentLevel.level >= 3) return true
    if (s.secretUnlock?.includes('Level 4') && currentLevel.level >= 4) return true
    // Check other unlock conditions...
    return false
  })

  const mystery = getMysteryForTown(town.id)
  const mysteryProgress = mystery ? getMysteryProgress(mystery.id) : null
  const mysterySolved = mystery ? isMysterySolved(mystery.id) : false
  const deductionUnlocked = mystery ? isMysteryDeductionUnlocked(mystery.id) : false

  const handleVisitAttraction = (attraction: Attraction) => {
    if (!isAttractionVisited(attraction.id)) {
      visitTown(town.id)
      const result = visitAttraction(attraction.id, town.id)

      // Check for mystery clue discovery
      if (mystery && !mysterySolved) {
        const clue = getClueForAttraction(town.id, attraction.id)
        if (clue && !isMysteryClueFound(mystery.id, clue.id)) {
          discoverClue(mystery.id, clue.id)
          setClueNotification({ text: clue.text, discoveryText: clue.discoveryText })
          setTimeout(() => setClueNotification(null), 8000)
        }
      }
    }
    setExpandedAttraction(expandedAttraction === attraction.id ? null : attraction.id)
  }

  const handleDeduction = (optionId: string) => {
    if (!mystery) return
    const result = attemptMysteryDeduction(mystery.id, optionId)
    setDeductionResult({ correct: result.correct, response: result.response })
    if (result.correct) {
      setTimeout(() => setShowDeduction(false), 6000)
    }
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={onClose}
        />
      )}

      {/* Drawer Content */}
      <div className="bg-slate-900 border-t-4 border-amber-500 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-[var(--font-pixel)] text-amber-200 text-lg">{town.name}</h2>
              <p className="text-amber-500 text-xs italic">{town.tagline}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Completion Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Completion</span>
              <span className="text-amber-300">{Math.round(completionPercent)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              All
            </button>
            {Object.entries(categoryIcons).map(([cat, icon]) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as AttractionCategory)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  selectedCategory === cat
                    ? categoryColors[cat as AttractionCategory]
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {icon} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Town Story */}
        <div className="px-4 py-3 bg-slate-800/50">
          <p className="text-slate-300 text-xs leading-relaxed">{town.description}</p>
        </div>

        {/* Clue Discovery Notification */}
        {clueNotification && (
          <div className="mx-4 mt-3 p-3 bg-indigo-900/60 border-2 border-indigo-400 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔍</span>
              <span className="font-[var(--font-pixel)] text-indigo-300 text-xs font-bold">Clue Discovered!</span>
            </div>
            <p className="text-indigo-200 text-xs italic mb-1">{clueNotification.discoveryText}</p>
            <p className="text-white text-xs">{clueNotification.text}</p>
          </div>
        )}

        {/* Mystery Panel */}
        {mystery && (
          <div className="mx-4 mt-3 p-3 bg-slate-800 border-2 border-indigo-500/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mysterySolved ? '✅' : '🔎'}</span>
                <div>
                  <h3 className="font-[var(--font-pixel)] text-indigo-300 text-sm">{mystery.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    mystery.difficulty === 'easy' ? 'bg-green-800 text-green-300' :
                    mystery.difficulty === 'medium' ? 'bg-amber-800 text-amber-300' :
                    'bg-red-800 text-red-300'
                  }`}>
                    {mystery.difficulty} | {mystery.era}
                  </span>
                </div>
              </div>
              {mysterySolved && (
                <span className="text-green-400 text-xs font-bold">SOLVED</span>
              )}
            </div>

            {!mysterySolved && (
              <p className="text-slate-300 text-xs leading-relaxed mb-2">{mystery.briefing}</p>
            )}

            {/* Clue Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-indigo-400">Clues: {mysteryProgress?.cluesFound.length || 0}/{mystery.clues.length}</span>
                <span className="text-indigo-300">
                  {deductionUnlocked ? 'Deduction ready!' : `Need ${mystery.deduction.minCluesRequired - (mysteryProgress?.cluesFound.length || 0)} more`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${mysterySolved ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${mysterySolved ? 100 : ((mysteryProgress?.cluesFound.length || 0) / mystery.clues.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Found Clues */}
            {mysteryProgress && mysteryProgress.cluesFound.length > 0 && !mysterySolved && (
              <div className="space-y-1 mb-2">
                {mystery.clues
                  .filter(c => mysteryProgress.cluesFound.includes(c.id))
                  .sort((a, b) => a.order - b.order)
                  .map(clue => (
                    <div key={clue.id} className="flex items-start gap-2 text-xs p-1.5 bg-indigo-900/30 rounded">
                      <span className="text-indigo-400 mt-0.5">📜</span>
                      <p className="text-indigo-200">{clue.text}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Deduction Button / Panel */}
            {!mysterySolved && deductionUnlocked && !showDeduction && (
              <button
                onClick={() => { setShowDeduction(true); setDeductionResult(null) }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors"
              >
                🧩 Make Your Deduction
              </button>
            )}

            {showDeduction && !mysterySolved && (
              <div className="mt-2 p-3 bg-indigo-950/60 border border-indigo-400/30 rounded">
                <p className="text-indigo-200 text-xs font-bold mb-3">{mystery.deduction.question}</p>
                <div className="space-y-2">
                  {mystery.deduction.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleDeduction(option.id)}
                      disabled={!!deductionResult}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        deductionResult
                          ? option.correct
                            ? 'bg-green-800 border border-green-500 text-green-200'
                            : 'bg-slate-800 border border-slate-600 text-slate-400'
                          : 'bg-slate-700 hover:bg-indigo-700 border border-slate-500 text-slate-200'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
                {deductionResult && (
                  <div className={`mt-3 p-2 rounded border text-xs ${
                    deductionResult.correct
                      ? 'bg-green-900/50 border-green-500 text-green-200'
                      : 'bg-red-900/50 border-red-500 text-red-200'
                  }`}>
                    <p className="font-bold mb-1">{deductionResult.correct ? '🎉 Correct!' : '❌ Not quite...'}</p>
                    <p>{deductionResult.response}</p>
                    {deductionResult.correct && (
                      <p className="mt-2 text-amber-300">+{mystery.xpReward} XP earned!</p>
                    )}
                    {!deductionResult.correct && (
                      <button
                        onClick={() => setDeductionResult(null)}
                        className="mt-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Solved Display */}
            {mysterySolved && (
              <div className="space-y-2">
                <div className="p-2 bg-green-900/30 border border-green-600/50 rounded">
                  <p className="text-green-200 text-xs">{mystery.solvedText}</p>
                </div>
                <div className="p-2 bg-amber-900/20 border border-amber-600/30 rounded">
                  <span className="text-amber-400 text-[10px] font-bold">Historical Note</span>
                  <p className="text-amber-200 text-xs mt-1">{mystery.historicalNote}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attractions List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {allAttractions.map(attraction => {
            const visited = isAttractionVisited(attraction.id)
            const expanded = expandedAttraction === attraction.id
            const favorite = isFavorite(attraction.id)

            return (
              <div
                key={attraction.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  visited ? 'border-green-600 bg-green-900/20' : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <button
                  onClick={() => handleVisitAttraction(attraction)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{attraction.icon}</span>
                      <div>
                        <h3 className={`font-[var(--font-pixel)] text-sm ${visited ? 'text-green-300' : 'text-white'}`}>
                          {attraction.name}
                          {visited && <span className="ml-2 text-green-400">✓</span>}
                          {mystery && !mysterySolved && (() => {
                            const clue = getClueForAttraction(town.id, attraction.id)
                            if (!clue) return null
                            const found = isMysteryClueFound(mystery.id, clue.id)
                            return <span className="ml-1 text-xs" title={found ? 'Clue found here' : 'Mystery clue here'}>{found ? '📜' : '🔍'}</span>
                          })()}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${categoryColors[attraction.category]}`}>
                          {attraction.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs">+{attraction.xp} XP</span>
                      <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <p className="text-slate-300 text-xs">{attraction.description}</p>

                    {/* Fun Fact */}
                    <div className="bg-amber-900/30 border border-amber-600/50 rounded p-2">
                      <span className="text-amber-400 text-[10px] font-bold">Did you know?</span>
                      <p className="text-amber-200 text-xs mt-1">{attraction.funFact}</p>
                    </div>

                    {/* Insider Tip (only if visited or high level) */}
                    {(visited || currentLevel.level >= 2) && (
                      <div className="bg-purple-900/30 border border-purple-600/50 rounded p-2">
                        <span className="text-purple-400 text-[10px] font-bold">Insider Tip</span>
                        <p className="text-purple-200 text-xs mt-1">{attraction.insiderTip}</p>
                      </div>
                    )}

                    {/* Duration & Actions */}
                    <div className="flex items-center justify-between">
                      {attraction.duration && (
                        <span className="text-slate-400 text-xs">⏱️ {attraction.duration}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(attraction.id)
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            favorite ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {favorite ? '❤️' : '🤍'}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + ', ' + town.name + ', California')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-700 text-white rounded text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          📍 Directions
                        </a>
                      </div>
                    </div>

                    {/* Badge Preview */}
                    {attraction.badge && (
                      <div className="flex items-center gap-2 bg-slate-700/50 rounded p-2">
                        <span className="text-xl">{attraction.badge.icon}</span>
                        <div>
                          <span className="text-amber-300 text-xs font-bold">{attraction.badge.name}</span>
                          <p className="text-slate-400 text-[10px]">{attraction.badge.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Secret Attractions */}
          {availableSecrets.length > 0 && (
            <div className="mt-6">
              <h3 className="font-[var(--font-pixel)] text-purple-300 text-sm mb-3 flex items-center gap-2">
                🔮 Secret Locations
              </h3>
              {availableSecrets.map(secret => {
                const unlocked = isSecretUnlocked(secret.id)
                return (
                  <div
                    key={secret.id}
                    className={`border-2 rounded-lg p-3 ${
                      unlocked ? 'border-purple-500 bg-purple-900/30' : 'border-slate-600 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{unlocked ? secret.icon : '❓'}</span>
                      <div>
                        <h4 className="text-purple-200 text-sm">{unlocked ? secret.name : '???'}</h4>
                        {!unlocked && (
                          <p className="text-purple-400 text-[10px]">Unlock: {secret.secretUnlock}</p>
                        )}
                      </div>
                      <span className="ml-auto text-amber-400 text-xs">+{secret.xp} XP</span>
                    </div>
                    {unlocked && (
                      <p className="text-purple-300 text-xs mt-2">{secret.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Progress HUD
function ExplorerHUD() {
  const { progress, currentLevel, xpToNextLevel, progressPercent, getRandomTobiasTip, checkStreak } = useExplorer()
  const [showTip, setShowTip] = useState(false)
  const [tip, setTip] = useState('')
  const [showBadges, setShowBadges] = useState(false)

  // Check streak on mount
  useEffect(() => {
    checkStreak()
  }, [checkStreak])

  const handleTobiasTip = () => {
    setTip(getRandomTobiasTip())
    setShowTip(true)
    setTimeout(() => setShowTip(false), 5000)
  }

  return (
    <div className="bg-slate-900/95 border-2 border-amber-600 rounded-lg p-4 mb-6">
      {/* XP Bar */}
      <XPBar
        currentXP={progress.totalXP}
        currentLevel={currentLevel}
        nextLevelXP={EXPLORER_LEVELS[currentLevel.level]?.xpRequired || progress.totalXP}
        progressPercent={progressPercent}
      />

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex gap-4">
          <span className="text-slate-400">
            <span className="text-amber-300">{progress.visitedAttractions.length}</span> Attractions
          </span>
          <span className="text-slate-400">
            <span className="text-amber-300">{progress.visitedTowns.length}</span> Towns
          </span>
          <span className="text-slate-400">
            <span className="text-purple-300">{progress.unlockedSecrets.length}</span> Secrets
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBadges(!showBadges)}
            className="px-2 py-1 bg-amber-700 text-amber-100 rounded text-xs hover:bg-amber-600"
          >
            🏅 {progress.badges.length}
          </button>
          <button
            onClick={handleTobiasTip}
            className="px-2 py-1 bg-purple-700 text-purple-100 rounded text-xs hover:bg-purple-600"
          >
            💡 Tip
          </button>
        </div>
      </div>

      {/* Streak */}
      {progress.streakDays > 1 && (
        <div className="mt-2 text-center">
          <span className="text-orange-400 text-xs">🔥 {progress.streakDays} day streak!</span>
        </div>
      )}

      {/* Tobias Tip Popup */}
      {showTip && (
        <div className="mt-3 p-3 bg-amber-900/50 border border-amber-500 rounded animate-fade-in">
          <p className="text-amber-200 text-xs italic">"{tip}"</p>
          <p className="text-amber-500 text-[10px] mt-1">— Tobias, Ghost of Gold Country</p>
        </div>
      )}

      {/* Badge Display */}
      {showBadges && (
        <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
          <h4 className="text-amber-300 text-xs font-bold mb-2">Your Badges</h4>
          {progress.badges.length > 0 ? (
            <BadgeDisplay badges={progress.badges} />
          ) : (
            <p className="text-slate-400 text-xs">Visit attractions to earn badges!</p>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Main Map Component
function ExplorerMap() {
  const [selectedTown, setSelectedTown] = useState<Town | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { progress, isTownVisited, getTownCompletionPercent, isMysterySolved, getMysteryProgress } = useExplorer()

  const handleTownClick = (town: Town) => {
    setSelectedTown(town)
    setDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl text-center mb-2">
          Gold Country Explorer
        </h1>
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center mb-6">
          Discover historic Gold Rush towns, earn XP, and unlock secrets!
        </p>

        {/* Explorer HUD */}
        <ExplorerHUD />

        {/* Map */}
        <div className="relative bg-gradient-to-b from-[var(--pixel-forest-dark)] to-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-ui-border)] aspect-[4/3] overflow-hidden rounded-lg">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(10)].map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-[var(--pixel-ui-text)]" style={{ top: `${i * 10}%` }} />
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-[var(--pixel-ui-text)]" style={{ left: `${i * 10}%` }} />
            ))}
          </div>

          {/* Gold Country Map Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 75" preserveAspectRatio="xMidYMid slice">
            {/* Mountain ranges */}
            <polygon points="0,20 8,8 16,14 24,3 32,12 40,6 48,14 56,4 64,10 72,2 80,12 88,7 96,14 100,10 100,22 0,22"
              fill="var(--pixel-earth-mid)" opacity="0.2" />
            <polygon points="0,26 12,16 20,22 28,12 36,18 44,10 52,20 60,14 68,8 76,18 84,13 92,20 100,16 100,28 0,28"
              fill="var(--pixel-earth-dark)" opacity="0.15" />

            {/* Rivers — Mokelumne and Calaveras */}
            <path d="M 0,35 Q 10,32 18,38 Q 26,44 35,40 Q 42,36 50,42 Q 58,48 65,44 Q 75,38 85,45 Q 92,50 100,48"
              fill="none" stroke="#4a90d9" strokeWidth="0.6" opacity="0.35" strokeLinecap="round" />
            <path d="M 0,55 Q 8,52 15,56 Q 22,60 30,58 Q 38,54 45,60 Q 52,65 60,62 Q 68,58 78,64 Q 88,68 100,65"
              fill="none" stroke="#4a90d9" strokeWidth="0.5" opacity="0.25" strokeLinecap="round" />

            {/* Mother Lode gold belt — diagonal band NW to SE */}
            <path d="M 10,15 Q 20,25 25,35 Q 30,45 35,55 Q 42,65 50,75"
              fill="none" stroke="var(--pixel-gold-mid)" strokeWidth="8" opacity="0.06" strokeLinecap="round" />

            {/* Trail connections between towns */}
            {/* Volcano (35,35) -> West Point (55,40) */}
            <path d="M 35,26 Q 42,28 48,30 Q 52,32 55,30"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />
            {/* Volcano (35,35) -> Mokelumne Hill (20,50) */}
            <path d="M 35,26 Q 30,32 26,38 Q 22,43 20,38"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />
            {/* Mokelumne Hill (20,50) -> Angels Camp (25,65) */}
            <path d="M 20,38 Q 20,45 22,52 Q 24,58 25,49"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />
            {/* Mokelumne Hill (20,50) -> San Andreas (35,75) */}
            <path d="M 20,38 Q 24,45 28,52 Q 32,58 35,56"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />
            {/* San Andreas (35,75) -> Angels Camp (25,65) */}
            <path d="M 35,56 Q 32,52 28,50 Q 26,49 25,49"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />
            {/* West Point (55,40) -> BOBR Ranch (50,50) */}
            <path d="M 55,30 Q 54,35 52,38 Q 51,42 50,38"
              fill="none" stroke="var(--pixel-earth-light)" strokeWidth="0.4" opacity="0.4" strokeDasharray="2,1" />

            {/* Forest patches — scattered pine treeline shapes */}
            <g opacity="0.12" fill="var(--pixel-forest-mid)">
              <polygon points="5,30 7,22 9,30" />
              <polygon points="8,31 10,24 12,31" />
              <polygon points="60,20 62,13 64,20" />
              <polygon points="63,21 65,15 67,21" />
              <polygon points="75,28 77,21 79,28" />
              <polygon points="85,35 87,28 89,35" />
              <polygon points="12,45 14,38 16,45" />
              <polygon points="70,50 72,43 74,50" />
              <polygon points="80,55 82,48 84,55" />
              <polygon points="45,22 47,15 49,22" />
              <polygon points="90,42 92,35 94,42" />
            </g>

            {/* Mining symbols along the Mother Lode */}
            <g opacity="0.15" fill="var(--pixel-gold-dark)">
              <circle cx="22" cy="33" r="0.8" />
              <circle cx="28" cy="42" r="0.6" />
              <circle cx="33" cy="52" r="0.7" />
              <circle cx="38" cy="60" r="0.5" />
              <circle cx="30" cy="48" r="0.5" />
            </g>

            {/* Compass rose — bottom right */}
            <g transform="translate(88,65)" opacity="0.2">
              <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--pixel-gold-light)" strokeWidth="0.3" />
              <line x1="-4" y1="0" x2="4" y2="0" stroke="var(--pixel-gold-light)" strokeWidth="0.3" />
              <polygon points="0,-5 -1,-2 1,-2" fill="var(--pixel-gold-mid)" />
              <text x="0" y="-6" textAnchor="middle" fontSize="2.5" fill="var(--pixel-gold-light)" fontFamily="serif">N</text>
            </g>

            {/* "GOLD COUNTRY" label */}
            <text x="50" y="72" textAnchor="middle" fontSize="3" fill="var(--pixel-gold-mid)" opacity="0.15"
              fontFamily="serif" letterSpacing="3">GOLD COUNTRY</text>
          </svg>

          {/* Town markers */}
          {TOWNS.map((town, index) => {
            const visited = isTownVisited(town.id)
            const completion = getTownCompletionPercent(town.id)
            // Arrange towns in a rough geographic pattern
            const positions: Record<string, { x: number; y: number }> = {
              volcano: { x: 35, y: 35 },
              angels_camp: { x: 25, y: 65 },
              west_point: { x: 55, y: 40 },
              mokelumne_hill: { x: 20, y: 50 },
              san_andreas: { x: 35, y: 75 },
              bobr_ranch: { x: 50, y: 50 },
            }
            const pos = positions[town.id] || { x: 50, y: 50 }

            return (
              <button
                key={town.id}
                onClick={() => handleTownClick(town)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125 z-10 group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="relative">
                  {/* Glow effect for unvisited */}
                  {!visited && (
                    <div className="absolute inset-0 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-amber-500/30 blur-md" />
                    </div>
                  )}

                  {/* Completion ring */}
                  <svg className="absolute -inset-1 w-10 h-10" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none"
                      stroke={visited ? '#22c55e' : '#64748b'}
                      strokeWidth="2"
                      strokeDasharray={`${completion} ${100 - completion}`}
                      strokeDashoffset="25"
                      className="transition-all duration-500"
                    />
                  </svg>

                  {/* Icon */}
                  <span className="text-2xl sm:text-3xl drop-shadow-lg relative z-10">
                    {town.id === 'bobr_ranch' ? '🏠' :
                     town.id === 'volcano' ? '👻' :
                     town.id === 'angels_camp' ? '🐸' :
                     town.id === 'west_point' ? '🧭' :
                     town.id === 'mokelumne_hill' ? '💀' :
                     town.id === 'san_andreas' ? '⚖️' : '📍'}
                  </span>

                  {/* Mystery indicator */}
                  {(() => {
                    const townMystery = getMysteryForTown(town.id)
                    if (!townMystery) return null
                    const solved = isMysterySolved(townMystery.id)
                    const mp = getMysteryProgress(townMystery.id)
                    const hasClues = mp && mp.cluesFound.length > 0
                    return (
                      <span className={`absolute -top-1 -right-2 text-xs z-20 ${solved ? '' : 'animate-bounce'}`}
                        style={{ animationDuration: '2s' }}
                        title={solved ? `Mystery solved: ${townMystery.title}` : `Mystery: ${townMystery.title}`}>
                        {solved ? '✅' : hasClues ? '🔍' : '❓'}
                      </span>
                    )
                  })()}

                  {/* Label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="font-[var(--font-pixel)] text-[8px] text-white bg-black/70 px-2 py-1 rounded">
                      {town.name}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Compass */}
          <div className="absolute top-4 right-4 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            <div className="text-center">N</div>
            <div className="flex">
              <span>W</span>
              <span className="mx-2">✦</span>
              <span>E</span>
            </div>
            <div className="text-center">S</div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black/60 rounded p-2">
            <p className="font-[var(--font-pixel)] text-[6px] text-amber-300 mb-1">Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[6px] font-[var(--font-pixel)] text-slate-300">
              <span>🏠 Base Camp</span>
              <span>👻 Haunted</span>
              <span>🐸 Literary</span>
              <span>💀 Notorious</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/oregon-trail" className="block">
            <PixelButton variant="orange" size="sm" className="w-full">
              🤠 Play Prospector&apos;s Tale
            </PixelButton>
          </Link>
          <Link href="/game" className="block">
            <PixelButton variant="gold" size="sm" className="w-full">
              🗺️ Ranch Treasure Hunt
            </PixelButton>
          </Link>
          <Link href="/adventure" className="block">
            <PixelButton variant="green" size="sm" className="w-full">
              ⚔️ Play the Prologue
            </PixelButton>
          </Link>
          <Link href="/rentals" className="block">
            <PixelButton variant="blue" size="sm" className="w-full">
              🏠 Book Your Stay
            </PixelButton>
          </Link>
        </div>
      </div>

      {/* Town Drawer */}
      <TownDrawer
        town={selectedTown}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

// ============================================
// MAIN EXPORT
// ============================================

export default function ExplorePage() {
  return (
    <ExplorerProvider
      towns={TOWNS}
      onLevelUp={(level) => {
        console.log(`Level up! Now ${level.title}`)
        // Could show a toast notification here
      }}
      onBadgeEarned={(badge) => {
        console.log(`Badge earned: ${badge.name}`)
        // Could show a celebration animation here
      }}
      onSecretUnlocked={(attraction) => {
        console.log(`Secret unlocked: ${attraction.name}`)
        // Could show a special reveal animation here
      }}
    >
      <ExplorerMap />
    </ExplorerProvider>
  )
}
