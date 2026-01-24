// Travel Observations - Hitchhiker's Guide Style Commentary
// Dynamic observations that add personality to the journey

export type TerrainType = 'plains' | 'forest' | 'mountains' | 'desert' | 'river'
export type TimePhase = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night'
export type WeatherMood = 'fair' | 'rain' | 'storm' | 'snow'

export interface TravelObservation {
  text: string
  mood: 'witty' | 'philosophical' | 'ominous' | 'hopeful' | 'weary' | 'observant'
  rarity: 'common' | 'uncommon' | 'rare'
}

// Terrain-specific observations
export const TERRAIN_OBSERVATIONS: Record<TerrainType, TravelObservation[]> = {
  plains: [
    { text: "The prairie stretches endlessly, as if the earth itself forgot where it was going.", mood: 'philosophical', rarity: 'common' },
    { text: "Miles of grass. More grass. The oxen seem thrilled. You are less so.", mood: 'witty', rarity: 'common' },
    { text: "A hawk circles overhead. It's either a sign of freedom or it's measuring you for lunch.", mood: 'observant', rarity: 'uncommon' },
    { text: "The wind carries whispers of those who traveled before. Or possibly just dust.", mood: 'ominous', rarity: 'uncommon' },
    { text: "The children ask 'Are we there yet?' for the forty-seventh time. You've stopped counting.", mood: 'weary', rarity: 'common' },
    { text: "Prairie dogs pop up to watch your wagon pass. Their expressions suggest mild disappointment.", mood: 'witty', rarity: 'uncommon' },
    { text: "The horizon promises adventure. It has been promising for three days now.", mood: 'weary', rarity: 'common' },
    { text: "Someone in the wagon claims to see trees ahead. They are hallucinating.", mood: 'witty', rarity: 'uncommon' },
    { text: "A butterfly lands on an ox's nose. For a moment, everything is peaceful.", mood: 'hopeful', rarity: 'rare' },
    { text: "The trail splits ahead. Both paths look equally unpromising.", mood: 'observant', rarity: 'common' },
  ],

  forest: [
    { text: "The trees close in like curious spectators. Some of them seem judgmental.", mood: 'witty', rarity: 'common' },
    { text: "Birdsong fills the air. Either nature's symphony or a very organized ambush.", mood: 'observant', rarity: 'uncommon' },
    { text: "The path narrows. The wagon squeezes through. An ox sighs dramatically.", mood: 'witty', rarity: 'common' },
    { text: "Sunlight filters through the canopy in ways that would make a painter weep.", mood: 'hopeful', rarity: 'uncommon' },
    { text: "Something rustles in the undergrowth. It's probably not a bear. Probably.", mood: 'ominous', rarity: 'uncommon' },
    { text: "The forest smells of pine, adventure, and existential uncertainty.", mood: 'philosophical', rarity: 'rare' },
    { text: "A deer watches from a clearing. It seems to pity you.", mood: 'witty', rarity: 'common' },
    { text: "The trees here are older than the nation. They've seen things. They're not talking.", mood: 'ominous', rarity: 'uncommon' },
    { text: "Mushrooms grow in patterns that almost spell words. You decide not to read them.", mood: 'philosophical', rarity: 'rare' },
    { text: "The canopy is so thick, it's unclear whether it's noon or dusk. Time has become a suggestion.", mood: 'weary', rarity: 'common' },
  ],

  mountains: [
    { text: "The mountains loom ahead, unimpressed by your ambitions.", mood: 'philosophical', rarity: 'common' },
    { text: "The air thins. Breathing becomes a conscious decision.", mood: 'weary', rarity: 'common' },
    { text: "An eagle soars past. It's going the other direction. Smart bird.", mood: 'witty', rarity: 'uncommon' },
    { text: "The view from here is magnificent. The path up was horrifying.", mood: 'hopeful', rarity: 'uncommon' },
    { text: "Rock slides could happen at any moment. The mountain isn't telling.", mood: 'ominous', rarity: 'uncommon' },
    { text: "Snow-capped peaks glitter in the sun, beautiful and entirely indifferent to your survival.", mood: 'philosophical', rarity: 'rare' },
    { text: "The oxen are reconsidering their career choices.", mood: 'witty', rarity: 'common' },
    { text: "Each switchback reveals a view more stunning and a path more terrifying.", mood: 'observant', rarity: 'common' },
    { text: "The pass is narrow. The drop is not. Math has never felt more personal.", mood: 'witty', rarity: 'uncommon' },
    { text: "A marmot whistles a warning. You're not sure if it's about the weather or your life choices.", mood: 'ominous', rarity: 'rare' },
  ],

  desert: [
    { text: "The sun beats down with the enthusiasm of someone who genuinely enjoys their job.", mood: 'witty', rarity: 'common' },
    { text: "Water becomes more precious than gold. Which is ironic, given where you're headed.", mood: 'philosophical', rarity: 'uncommon' },
    { text: "A mirage shimmers ahead. The oasis is fake. The disappointment is real.", mood: 'weary', rarity: 'common' },
    { text: "Cacti stand like sentinels. Their silence is somehow disapproving.", mood: 'witty', rarity: 'uncommon' },
    { text: "The desert has a stark beauty, assuming you survive long enough to appreciate it.", mood: 'philosophical', rarity: 'rare' },
    { text: "A vulture circles. It's not personal, it's just business.", mood: 'ominous', rarity: 'common' },
    { text: "The wagon's wheels sink into sand. The oxen express opinions you'd rather not translate.", mood: 'weary', rarity: 'common' },
    { text: "Sunset paints the desert in colors no artist would dare use. They'd be called liars.", mood: 'hopeful', rarity: 'uncommon' },
    { text: "A lizard scurries across the trail. Even it seems to be hurrying to somewhere cooler.", mood: 'witty', rarity: 'common' },
    { text: "The stars at night are brilliant here. Nature's way of apologizing for the heat.", mood: 'hopeful', rarity: 'rare' },
  ],

  river: [
    { text: "The river sparkles invitingly. It's also full of things that bite.", mood: 'witty', rarity: 'common' },
    { text: "The sound of rushing water is peaceful. The depth is concerning.", mood: 'observant', rarity: 'common' },
    { text: "Fish leap from the water. They seem to be showing off.", mood: 'witty', rarity: 'uncommon' },
    { text: "The riverbanks are lush and green, fed by the tears of travelers before you.", mood: 'philosophical', rarity: 'rare' },
    { text: "A beaver eyes your wagon with professional interest.", mood: 'witty', rarity: 'uncommon' },
    { text: "The current looks faster than you remembered rivers being.", mood: 'ominous', rarity: 'common' },
    { text: "Crossing here means trusting the wagon to float. The wagon has not earned this trust.", mood: 'observant', rarity: 'common' },
    { text: "The ferry operator quotes a price. Your kidneys twitch nervously.", mood: 'witty', rarity: 'uncommon' },
    { text: "Driftwood bobs past, a reminder that rivers carry things away.", mood: 'ominous', rarity: 'uncommon' },
    { text: "Children want to swim. Adults want to survive. Compromise is reached.", mood: 'weary', rarity: 'common' },
  ],
}

// Time-of-day observations
export const TIME_OBSERVATIONS: Record<TimePhase, TravelObservation[]> = {
  dawn: [
    { text: "Dawn breaks like a promise. Coffee breaks like a necessity.", mood: 'weary', rarity: 'common' },
    { text: "The morning dew sparkles. Everything seems possible for approximately seven minutes.", mood: 'hopeful', rarity: 'common' },
    { text: "The oxen yawn. You yawn. Even the trail seems to yawn.", mood: 'weary', rarity: 'common' },
    { text: "Pink and gold streak the sky. It's almost enough to make waking up worth it.", mood: 'hopeful', rarity: 'uncommon' },
  ],

  morning: [
    { text: "The morning's optimism hasn't quite worn off yet. Give it time.", mood: 'witty', rarity: 'common' },
    { text: "Birds sing with an energy you aspire to but cannot match.", mood: 'observant', rarity: 'common' },
    { text: "Fresh tracks in the dust. Someone passed this way recently. Or something.", mood: 'observant', rarity: 'uncommon' },
    { text: "The sun is friendly now. This will change.", mood: 'ominous', rarity: 'common' },
  ],

  midday: [
    { text: "High noon. The sun has no mercy and excellent aim.", mood: 'weary', rarity: 'common' },
    { text: "Shade becomes a precious commodity. You negotiate with trees.", mood: 'witty', rarity: 'common' },
    { text: "The party takes a break. The dust takes a break. The complaints do not.", mood: 'weary', rarity: 'uncommon' },
    { text: "Lunch is eaten without enthusiasm but with determination.", mood: 'observant', rarity: 'common' },
  ],

  afternoon: [
    { text: "The afternoon stretches lazily, like a cat that knows it has all day.", mood: 'philosophical', rarity: 'uncommon' },
    { text: "Miles pass. More miles wait. The trail has no end, only pauses.", mood: 'weary', rarity: 'common' },
    { text: "Someone starts whistling. Someone else asks them to stop. Balance is restored.", mood: 'witty', rarity: 'common' },
    { text: "The wagon creaks a rhythm. It's almost musical if you lower your standards.", mood: 'witty', rarity: 'uncommon' },
  ],

  dusk: [
    { text: "The sun sinks low, painting the world in gold. Even hardship looks beautiful now.", mood: 'hopeful', rarity: 'common' },
    { text: "Camp must be made. The wagon stops. Everyone pretends they're not exhausted.", mood: 'weary', rarity: 'common' },
    { text: "Fireflies emerge like tiny stars too impatient for dark.", mood: 'philosophical', rarity: 'uncommon' },
    { text: "The first stars appear. They've been there all along, of course.", mood: 'observant', rarity: 'common' },
  ],

  night: [
    { text: "The campfire crackles with stories and lies. No one can tell which is which.", mood: 'philosophical', rarity: 'common' },
    { text: "Coyotes call in the distance. They sound like questions without answers.", mood: 'ominous', rarity: 'uncommon' },
    { text: "The stars are infinite. Your journey is not. Take comfort in perspective.", mood: 'philosophical', rarity: 'rare' },
    { text: "Night watch begins. Someone has to stare at darkness. Tonight, it's your turn.", mood: 'weary', rarity: 'common' },
  ],
}

// Weather observations
export const WEATHER_OBSERVATIONS: Record<WeatherMood, TravelObservation[]> = {
  fair: [
    { text: "The weather is fair. Suspiciously fair. You eye the sky.", mood: 'witty', rarity: 'common' },
    { text: "Blue skies stretch overhead. Nature is in a good mood. Enjoy it while it lasts.", mood: 'hopeful', rarity: 'common' },
    { text: "Perfect traveling weather. The frontier is practically rolling out a welcome mat.", mood: 'hopeful', rarity: 'uncommon' },
  ],

  rain: [
    { text: "Rain falls steadily. The trail becomes mud. Morale becomes selective.", mood: 'weary', rarity: 'common' },
    { text: "The oxen slip. The wagon slides. You learn new vocabulary.", mood: 'witty', rarity: 'common' },
    { text: "Rain beats on the canvas. It's romantic in books. Less so in practice.", mood: 'philosophical', rarity: 'uncommon' },
    { text: "Everything is wet. Including your patience.", mood: 'weary', rarity: 'common' },
  ],

  storm: [
    { text: "Thunder rolls like the frontier clearing its throat.", mood: 'ominous', rarity: 'common' },
    { text: "Lightning illuminates the trail. For one bright second, everything is clear and terrifying.", mood: 'philosophical', rarity: 'uncommon' },
    { text: "The storm rages. You hunker down. The oxen look unimpressed.", mood: 'observant', rarity: 'common' },
    { text: "Nature reminds you who's really in charge. It's not you.", mood: 'ominous', rarity: 'common' },
  ],

  snow: [
    { text: "Snow falls like a blessing or a curse, depending on how much supplies you have.", mood: 'philosophical', rarity: 'common' },
    { text: "The world turns white. Beautiful. Also possibly deadly. The frontier multitasks.", mood: 'witty', rarity: 'uncommon' },
    { text: "Wagon tracks fill in behind you. The trail erases itself as you travel.", mood: 'ominous', rarity: 'uncommon' },
    { text: "Snow silences the world. For once, even the children are quiet.", mood: 'observant', rarity: 'common' },
  ],
}

// Special landmark approach observations
export const LANDMARK_APPROACH: Record<string, TravelObservation[]> = {
  'Fort Kearny': [
    { text: "Fort Kearny rises ahead, a promise of civilization. And prices. Civilization always has prices.", mood: 'witty', rarity: 'common' },
    { text: "The stars and stripes flutter above the fort. You've never been so happy to see a flag.", mood: 'hopeful', rarity: 'common' },
  ],
  'Chimney Rock': [
    { text: "Chimney Rock points skyward, a natural monument to stubbornness.", mood: 'philosophical', rarity: 'common' },
    { text: "Everyone carves their name here. You wonder if the rock minds.", mood: 'witty', rarity: 'uncommon' },
  ],
  'Fort Laramie': [
    { text: "Fort Laramie means supplies, rest, and outrageous markups. Civilization in its purest form.", mood: 'witty', rarity: 'common' },
    { text: "The fort's walls look sturdy. You've never appreciated sturdy walls so much.", mood: 'hopeful', rarity: 'common' },
  ],
  'Independence Rock': [
    { text: "Independence Rock looms ahead. Thousands of names are carved here, each one a story.", mood: 'philosophical', rarity: 'common' },
    { text: "You should reach Independence Rock by Independence Day. Someone planned this.", mood: 'witty', rarity: 'uncommon' },
  ],
  'South Pass': [
    { text: "South Pass opens before you - the gap in the wall of the Rockies.", mood: 'hopeful', rarity: 'common' },
    { text: "This is the continental divide. Water here can't decide which ocean to visit.", mood: 'witty', rarity: 'uncommon' },
  ],
  'Soda Springs': [
    { text: "Natural springs bubble with water that tastes like it's having an identity crisis.", mood: 'witty', rarity: 'common' },
    { text: "The springs fizz and gurgle. Nature's own soda fountain.", mood: 'observant', rarity: 'common' },
  ],
  'Gold Country': [
    { text: "Gold Country. You made it. The mountains glitter with promise and danger.", mood: 'hopeful', rarity: 'common' },
    { text: "California spreads before you. The journey ends. Another begins.", mood: 'philosophical', rarity: 'common' },
  ],
}

// Generic milestone observations
export const MILESTONE_OBSERVATIONS: TravelObservation[] = [
  { text: "Another hundred miles behind you. Only... several hundred more to go.", mood: 'weary', rarity: 'common' },
  { text: "You've come far. Far enough to know that 'far' is relative.", mood: 'philosophical', rarity: 'uncommon' },
  { text: "The odometer (if you had one) would be impressive. The oxen are less impressed.", mood: 'witty', rarity: 'common' },
  { text: "Halfway there! Or so you hope. Maps are more art than science out here.", mood: 'witty', rarity: 'uncommon' },
]

// Random travel thoughts (appear when nothing else is happening)
export const IDLE_THOUGHTS: TravelObservation[] = [
  { text: "You ponder the meaning of the journey. The trail offers no answers, only more trail.", mood: 'philosophical', rarity: 'common' },
  { text: "Someone mentions they forgot to pack something important. Memory is selective.", mood: 'weary', rarity: 'common' },
  { text: "The wagon wheel squeaks. It has been squeaking for 200 miles. You've learned to harmonize.", mood: 'witty', rarity: 'uncommon' },
  { text: "Dust coats everything. You've achieved a permanent sepia tone.", mood: 'witty', rarity: 'common' },
  { text: "A fellow traveler waves as they pass. You wave back. It's the most exciting thing today.", mood: 'weary', rarity: 'common' },
  { text: "You remember your comfortable bed back East. It remembers you too, probably.", mood: 'philosophical', rarity: 'uncommon' },
  { text: "The trail guide said this would be an adventure. He wasn't wrong. He wasn't complete either.", mood: 'witty', rarity: 'common' },
  { text: "Fortune favors the bold. Dysentery also favors the bold. Life is complicated.", mood: 'witty', rarity: 'rare' },
]

// Get a random observation based on current conditions
export function getRandomObservation(
  terrain: TerrainType,
  timePhase: TimePhase,
  weather: WeatherMood,
  nearLandmark?: string,
  daysTraveled?: number
): TravelObservation {
  const candidates: TravelObservation[] = []

  // Add landmark-specific observations if near a landmark
  if (nearLandmark && LANDMARK_APPROACH[nearLandmark]) {
    candidates.push(...LANDMARK_APPROACH[nearLandmark])
  }

  // Add terrain observations
  candidates.push(...TERRAIN_OBSERVATIONS[terrain])

  // Add time-based observations
  candidates.push(...TIME_OBSERVATIONS[timePhase])

  // Add weather observations
  candidates.push(...WEATHER_OBSERVATIONS[weather])

  // Add milestone observations at certain intervals
  if (daysTraveled && daysTraveled % 10 === 0) {
    candidates.push(...MILESTONE_OBSERVATIONS)
  }

  // Add idle thoughts for variety
  candidates.push(...IDLE_THOUGHTS)

  // Weight by rarity
  const weighted: TravelObservation[] = []
  candidates.forEach(obs => {
    const weight = obs.rarity === 'common' ? 5 : obs.rarity === 'uncommon' ? 2 : 1
    for (let i = 0; i < weight; i++) {
      weighted.push(obs)
    }
  })

  // Pick random
  return weighted[Math.floor(Math.random() * weighted.length)]
}

// Get time phase from hour
export function getTimePhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}
