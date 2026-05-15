// The Golden Hooves Legacy - 14 QR Code Locations
// Each location tells part of Old Tobias's Gold Rush story

export interface Location {
  id: number
  slug: string
  name: string
  clueRhyme: string
  hint: string
  storyFragment: string
  practicalInfo: string
  icon: string
  soundEffect?: string
  points: number
  goldCountyFact: string
}

export const locations: Location[] = [
  {
    id: 1,
    slug: 'welcome',
    name: 'The Welcome Gate',
    clueRhyme: `"Where guests first step and journeys start,
Here begins the treasure hunter's art.
A wooden frame marks the way,
To adventures that await your stay."`,
    hint: 'Look near the entrance where you first arrived',
    storyFragment: `In 1852, a prospector named Tobias Goldsworth built the first cabin on this very land. He called it "Back of Beyond" because it was so far from civilization that even the coyotes needed a map. They say he hid clues throughout the property leading to his greatest discovery...`,
    practicalInfo: 'WiFi password on the welcome board. Check-in is 4pm, checkout 11am.',
    icon: '🚪',
    soundEffect: 'door-creak.mp3',
    points: 100,
    goldCountyFact: 'Calaveras County was named after the skulls (calaveras in Spanish) found by Spanish explorers along the Calaveras River.'
  },
  {
    id: 2,
    slug: 'hot-tub',
    name: 'The Bubbling Springs',
    clueRhyme: `"Bubbling waters under starlit sky,
Steam rises where secrets lie.
Old Tobias soaked here too,
His golden dreams will come to you."`,
    hint: 'Where warm water meets the night air...',
    storyFragment: `Tobias discovered his first gold nugget while bathing in natural hot springs nearby. "The earth herself showed me her treasure," he wrote in his journal. "Water and gold - both precious, both hidden in plain sight."`,
    practicalInfo: 'Hot tub is 104°F. Controls inside the gazebo. Please shower before use!',
    icon: '♨️',
    soundEffect: 'bubbles.mp3',
    points: 100,
    goldCountyFact: 'The Mother Lode, a 120-mile belt of gold-bearing quartz, runs through this region and produced over $10 billion in gold.'
  },
  {
    id: 3,
    slug: 'game-room',
    name: 'The Prospector\'s Parlor',
    clueRhyme: `"Where games are played and laughter rings,
Find the spot where victory sings.
Pool and darts and stories told,
Of miners seeking mountain gold."`,
    hint: 'Follow the sound of billiard balls...',
    storyFragment: `Tobias was legendary at the saloons in Mokelumne Hill. He once won a donkey, three pickaxes, and a map to an abandoned claim in a single poker game. "A man needs entertainment," he said, "else the mountains drive him mad."`,
    practicalInfo: 'Pool table, darts, board games, and arcade machine. Extra cues in the closet.',
    icon: '🎱',
    soundEffect: 'pool-break.mp3',
    points: 100,
    goldCountyFact: 'Mokelumne Hill was once the third-largest city in California during the Gold Rush, with a population over 15,000.'
  },
  {
    id: 4,
    slug: 'piano',
    name: 'The Melody Box',
    clueRhyme: `"Silent keys await your touch,
A melody that means so much.
Notes from eighteen fifty-two,
Carry secrets meant for you."`,
    hint: 'Where music fills the living room...',
    storyFragment: `The piano holds sheet music passed down through generations. Hidden within the notes of "Oh Susanna" is a cipher Tobias created. Each note corresponds to a direction - the song literally plays out the path to his treasure.`,
    practicalInfo: 'The baby grand is tuned yearly. Feel free to play! Songbooks in the bench.',
    icon: '🎹',
    soundEffect: 'piano-note.mp3',
    points: 100,
    goldCountyFact: 'Stephen Foster wrote "Oh Susanna" in 1848, just as the Gold Rush began. It became the unofficial anthem of the forty-niners.'
  },
  {
    id: 5,
    slug: 'fireplace',
    name: 'The Hearth Stone',
    clueRhyme: `"Warmth and comfort, flames so bright,
Secrets dance in firelight.
Look upon the ancient stone,
Where miner's marks were carved alone."`,
    hint: 'Where the family gathers when nights grow cold...',
    storyFragment: `The original hearth stone bears Tobias's initials: "T.G. 1852." But look closer - there are strange symbols carved around them. Mining notation? A treasure map? Scholars have debated for decades...`,
    practicalInfo: 'Firewood stacked outside. Matches on the mantle. Please close the flue when done.',
    icon: '🔥',
    soundEffect: 'fire-crackle.mp3',
    points: 100,
    goldCountyFact: 'During harsh Sierra winters, many miners abandoned their claims. Tobias stayed, believing the snow itself held clues.'
  },
  {
    id: 6,
    slug: 'lake',
    name: 'The Secret Cove',
    clueRhyme: `"Paddle out to waters deep,
Where the hills their treasures keep.
An island holds the answer true,
The canoe awaits for you."`,
    hint: 'Where still waters reflect the mountains...',
    storyFragment: `The small island in the lake was Tobias's secret refuge. He would paddle out at night, alone, and return at dawn with pockets full of nuggets. No one ever discovered where he found them - the island appeared to have no gold at all.`,
    practicalInfo: 'Canoe and life jackets in the shed. Lake is private - no motors allowed.',
    icon: '🛶',
    soundEffect: 'water-splash.mp3',
    points: 100,
    goldCountyFact: 'The Mokelumne River runs 95 miles from the Sierra Nevada to the Sacramento Delta, providing water for millions.'
  },
  {
    id: 7,
    slug: 'bedroom',
    name: 'The Dreamer\'s Rest',
    clueRhyme: `"Where dreams unfold through the night,
A hidden clue awaits first light.
Beneath where weary travelers sleep,
Old secrets still lie buried deep."`,
    hint: 'The master bedroom holds more than pillows...',
    storyFragment: `Tobias kept a gold nugget under his pillow every night. "It speaks to me in dreams," he claimed. "The gold knows where its brothers hide." His descendants say he was touched by gold fever - or perhaps touched by something else entirely.`,
    practicalInfo: 'King bed with mountain views. Extra blankets in the chest. Blackout curtains available.',
    icon: '🛏️',
    soundEffect: 'wind-chimes.mp3',
    points: 100,
    goldCountyFact: 'Superstition was rampant among miners. Many believed gold could call out to those pure of heart.'
  },
  {
    id: 8,
    slug: 'kitchen',
    name: 'The Recipe Box',
    clueRhyme: `"Where meals are made with loving care,
A secret ingredient waits right there.
In grandmother's box of recipes old,
A map leads straight to hidden gold."`,
    hint: 'Where the coffee maker meets the cookbook...',
    storyFragment: `Tucked among recipes for sourdough and apple pie, there's a yellowed paper with strange measurements: "3 cups north, 2 pinches east, fold in one sunset." Cooking directions? Or something more?`,
    practicalInfo: 'Full kitchen with all amenities. Coffee and basics provided. Local farm eggs in the fridge!',
    icon: '🍳',
    soundEffect: 'pot-lid.mp3',
    points: 100,
    goldCountyFact: 'Sourdough bread became a Gold Rush staple because miners could keep the starter alive through harsh conditions.'
  },
  {
    id: 9,
    slug: 'deck',
    name: 'The Overlook',
    clueRhyme: `"Look out upon the mountains tall,
Can you hear the treasure's call?
From this very spot, 'tis said,
Tobias watched the sunrise red."`,
    hint: 'Where the deck meets the sunrise...',
    storyFragment: `Every morning, Tobias would stand here and survey his domain. "I can see my claim from this very spot," he wrote. "And one day, when the sun hits just right, everyone will see what I have seen."`,
    practicalInfo: 'Best sunrise spot! Outdoor seating for 10. BBQ grill ready to use.',
    icon: '🌅',
    soundEffect: 'birds-morning.mp3',
    points: 100,
    goldCountyFact: 'The Sierra Nevada sunrises were so legendary that miners called them "nature\'s gold" - the only gold everyone could see.'
  },
  {
    id: 10,
    slug: 'ev-charger',
    name: 'New Meets Old',
    clueRhyme: `"Where modern meets the ancient way,
Technology and history play.
Lightning captured, stored with care,
Shows progress builds on what was there."`,
    hint: 'Where your electric vehicle drinks...',
    storyFragment: `The EV charger stands where Tobias once tied his mule. "Old Dusty" was the most reliable transport in the county. Some say the mule knew where gold was hidden - she would refuse to walk certain paths, only to have nuggets found there years later.`,
    practicalInfo: 'Level 2 EV charger (J1772). Free for guests. Adapter for Tesla available.',
    icon: '⚡',
    soundEffect: 'electric-hum.mp3',
    points: 100,
    goldCountyFact: 'Mules were worth more than horses during the Gold Rush due to their sure-footedness on mountain trails.'
  },
  {
    id: 11,
    slug: 'trail',
    name: 'The Prospector\'s Path',
    clueRhyme: `"The path less traveled holds the key,
Follow it and you shall see.
Tobias walked this trail each day,
His boots wore grooves along the way."`,
    hint: 'Where hiking boots meet adventure...',
    storyFragment: `This trail was Tobias's daily commute to his secret claim. He would leave before dawn and return after dark, always from a different direction. "If you can't find me, you can't follow me," he reasoned. The trail leads to... well, that's for you to discover.`,
    practicalInfo: 'Trail connects to Mokelumne Wilderness. 2-mile loop or continue to the river. Hiking poles available.',
    icon: '🥾',
    soundEffect: 'leaves-crunch.mp3',
    points: 100,
    goldCountyFact: 'The Mokelumne Wilderness covers 105,165 acres of pristine Sierra Nevada backcountry.'
  },
  {
    id: 12,
    slug: 'gold-history',
    name: 'The Chronicle Stone',
    clueRhyme: `"Miners came from far and wide,
This land holds stories none could hide.
Read the names of those who came,
And add your own to gold rush fame."`,
    hint: 'Where history is carved in stone...',
    storyFragment: `A memorial stone lists the names of original 1849 settlers. Tobias Goldsworth is third from the top. Below his name, barely visible, is scratched: "The hooves point the way." Golden hooves? What could it mean?`,
    practicalInfo: 'Historic marker from 1952 centennial. Guest book inside - add your name to history!',
    icon: '📜',
    soundEffect: 'page-turn.mp3',
    points: 100,
    goldCountyFact: 'Over 300,000 people came to California during the Gold Rush, the largest mass migration in American history.'
  },
  {
    id: 13,
    slug: 'stars',
    name: 'The Celestial Map',
    clueRhyme: `"Under the same stars Tobias knew,
His secret message shines for you.
When darkness falls, look up above,
And find the constellation of his love."`,
    hint: 'Where the telescope meets the night sky...',
    storyFragment: `Tobias was an amateur astronomer. His journal contains star charts with certain stars circled. "When Orion points his sword at the Bear, stand at the hearth and follow the shadow." Is this the final clue? Only the stars know.`,
    practicalInfo: 'Telescope on the upper deck. Best stargazing: new moon nights. Milky Way visible here!',
    icon: '⭐',
    soundEffect: 'night-ambience.mp3',
    points: 100,
    goldCountyFact: 'The Sierra Nevada is one of the best stargazing locations in California due to minimal light pollution.'
  },
  {
    id: 14,
    slug: 'final',
    name: 'The Golden Hooves',
    clueRhyme: `"Where furry friends find joy and play,
The Golden Legacy reveals today.
Your quest complete, the truth unfolds,
The greatest treasure isn't gold."`,
    hint: 'Where pets roam free and stories end...',
    storyFragment: `Congratulations, treasure hunter! You've discovered the truth of the Golden Hooves Legacy. Tobias's real treasure wasn't gold - it was this land itself, passed down through generations. The "golden hooves" were the deer that still roam these hills, their coats gleaming gold at sunset. The treasure was always here: family, nature, adventure. And now, you're part of the story too.`,
    practicalInfo: 'Fenced pet area. Dog-friendly trails nearby. Treats in the kitchen!',
    icon: '🏆',
    soundEffect: 'victory-fanfare.mp3',
    points: 200,
    goldCountyFact: 'The real gold of Gold Country today is its natural beauty, preserved for generations to enjoy.'
  }
]

// Get location by slug
export function getLocationBySlug(slug: string): Location | undefined {
  return locations.find(loc => loc.slug === slug)
}

// Get location by ID
export function getLocationById(id: number): Location | undefined {
  return locations.find(loc => loc.id === id)
}

// Get locations for a difficulty level
export function getLocationsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Location[] {
  const counts = { easy: 5, medium: 8, hard: 14 }
  return locations.slice(0, counts[difficulty])
}

// Early-bird discount unlocks at marker 4 (~29% through Hard, ~50% Medium, 80% Easy).
// Decision locked 2026-04-26 from Grok + GPT-5.5 (Thinking) consult — both verdicts agreed
// on Marker 4. Sized at 5% so it's a "thank you" that does not cannibalize the Silver+
// completion tiers (10–20% bonus). Codes are valid 30 days from issue.
export const EARLY_DISCOUNT_MARKER = 4
export const EARLY_DISCOUNT_PERCENT = 5
export const EARLY_DISCOUNT_VALID_DAYS = 30

// Code minting moved server-side as of P-1 (feat/p1-server-mint-bobr-early).
// Browser RNG in client code was forgeable from devtools — see audit
// 2026-05-04 + diagnostic_results/grok_post_automation_paths_exhausted_20260504.
// The new mint path: client POSTs to /api/issue-bobr-early when marker threshold
// crosses; server uses crypto.randomBytes + writes the code to a SQLite table
// (src/lib/discountCodesDb.ts). Redemption validates against the table at
// /api/redeem-bobr-early.

// Calculate reward tier based on completion
export function calculateRewardTier(
  locationsFound: number,
  difficulty: 'easy' | 'medium' | 'hard',
  hintsUsed: number
): { tier: string; discount: number; code: string | null; serverMintRequired: true } {
  const baseDiscount = 7
  let bonusDiscount = 0
  let tier = 'bronze'

  if (locationsFound >= 14 && difficulty === 'hard') {
    tier = 'platinum'
    bonusDiscount = 20
  } else if (locationsFound >= 10 || difficulty === 'hard') {
    tier = 'gold'
    bonusDiscount = 15
  } else if (locationsFound >= 6 || difficulty === 'medium') {
    tier = 'silver'
    bonusDiscount = 10
  } else {
    tier = 'bronze'
    bonusDiscount = 5
  }

  // Hint penalty
  const totalDiscount = Math.max(10, baseDiscount + bonusDiscount - hintsUsed)
  const finalDiscount = Math.min(totalDiscount, 27)

  // Completion reward codes require server-side minting before they can be redeemed.
  return { tier, discount: finalDiscount, code: null, serverMintRequired: true }
}
