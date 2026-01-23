/**
 * Educational Clues - Gold Country Trivia Questions
 * Migrated from Carmen Sandiego game for learning-based investigation
 */

export type CaseId = 'jumping_frog' | 'gold_rush_heist' | 'cave_secrets' | 'wine_whodunit'

export interface EducationalClue {
  id: string
  caseId: CaseId
  locationId: string
  order: number
  text: string
  hintLink: string
  question: string
  answer: string
  acceptedAnswers: string[]
  fact: string
  suspectHint: string
}

export const EDUCATIONAL_CLUES: EducationalClue[] = [
  // ========== JUMPING FROG CASE (6 clues) ==========
  {
    id: 'jf_clue_01',
    caseId: 'jumping_frog',
    locationId: 'angels_camp',
    order: 1,
    text: 'A weathered journal was found at the scene. The entry reads: \'I heard the most peculiar tale today at the tavern - about a man named Jim Smiley and his champion jumper. I must write this down before I forget...\'',
    hintLink: 'https://www.gocalaveras.com/angels-camp/',
    question: 'What famous American author heard this frog-jumping tale in Angels Camp and turned it into a story that launched his career?',
    answer: 'Mark Twain',
    acceptedAnswers: ['mark twain', 'twain', 'samuel clemens'],
    fact: 'In 1865, a young Samuel Clemens (Mark Twain) was prospecting in Calaveras County when he heard a bartender tell the tale of a jumping frog. His retelling became \'The Celebrated Jumping Frog of Calaveras County\' - the story that made him famous.',
    suspectHint: 'The thief seems to be a literature enthusiast...'
  },
  {
    id: 'jf_clue_02',
    caseId: 'jumping_frog',
    locationId: 'angels_camp',
    order: 2,
    text: 'The suspect left behind a festival program. It\'s for an annual competition that\'s been running since 1928 - contestants come from around the world to compete!',
    hintLink: 'https://www.gocalaveras.com/jumping-frog-jubilee/',
    question: 'What is the name of the famous annual frog-jumping competition held in Angels Camp every May?',
    answer: 'Jumping Frog Jubilee',
    acceptedAnswers: ['jumping frog jubilee', 'frog jubilee', 'calaveras county fair and jumping frog jubilee', 'the jubilee'],
    fact: 'The Jumping Frog Jubilee has been held at the Calaveras County Fair since 1928. The world record jump is over 21 feet! Contestants rent frogs or bring their own to compete for prizes.',
    suspectHint: 'Planning to sell the trophy at a big event perhaps?'
  },
  {
    id: 'jf_clue_03',
    caseId: 'jumping_frog',
    locationId: 'murphys',
    order: 3,
    text: 'A hotel receipt was discovered! The thief stayed at a historic establishment where famous guests have signed the register for over 150 years - presidents, outlaws, and authors alike.',
    hintLink: 'https://www.murphyshistorichotel.com/',
    question: 'Besides Mark Twain, which famous outlaw known as the \'Gentleman Bandit\' signed the Murphys Hotel guest register?',
    answer: 'Black Bart',
    acceptedAnswers: ['black bart', 'charles bolton', 'charles boles', 'bart'],
    fact: 'The Murphys Historic Hotel guest register contains signatures of Mark Twain, President Ulysses S. Grant, and Black Bart - a stagecoach robber famous for leaving poetry at his crime scenes. The register is still on display today!',
    suspectHint: 'Fancies themselves a gentleman criminal, like the outlaws of old...'
  },
  {
    id: 'jf_clue_04',
    caseId: 'jumping_frog',
    locationId: 'moaning_cavern',
    order: 4,
    text: 'Muddy boot prints lead to a cavern entrance. This cave got its eerie name from the sound wind made passing through the opening - early settlers thought it was ghosts moaning from below!',
    hintLink: 'https://www.caverntours.com/moaning-cavern/',
    question: 'What famous American landmark could fit inside Moaning Cavern\'s main chamber?',
    answer: 'Statue of Liberty',
    acceptedAnswers: ['statue of liberty', 'the statue of liberty', 'liberty'],
    fact: 'Moaning Cavern\'s main chamber is 165 feet tall - large enough to fit the Statue of Liberty inside! The \'moaning\' stopped when the entrance was enlarged for tours in 1922. Human remains found here date back 13,000 years.',
    suspectHint: 'The thief knows these caves intimately...'
  },
  {
    id: 'jf_clue_05',
    caseId: 'jumping_frog',
    locationId: 'big_trees',
    order: 5,
    text: 'A trail of sequoia bark leads through the forest. In 1852, a hunter chasing a bear stumbled upon trees so massive that when he told others, they called him a liar!',
    hintLink: 'https://www.parks.ca.gov/?page_id=551',
    question: 'When the bark of the Discovery Tree was shipped east for display in 1853, what did skeptical viewers call it?',
    answer: 'California hoax',
    acceptedAnswers: ['california hoax', 'hoax', 'a hoax', 'the california hoax'],
    fact: 'Augustus T. Dowd discovered the giant sequoias while chasing a bear in 1852. When the Discovery Tree\'s bark was exhibited back east, people refused to believe any tree could be that large - they called it the \'California Hoax\'!',
    suspectHint: 'Left behind some bark... sentimental about the old trees?'
  },
  {
    id: 'jf_clue_06',
    caseId: 'jumping_frog',
    locationId: 'bobr_cabin',
    order: 6,
    text: 'The suspect was spotted near a mountain cabin in West Point! In his book \'Roughing It,\' Mark Twain wrote about traveling by stagecoach through these foothills, stopping at gold mining camps along the way. After a long day of travel, he would have loved to soak in a hot spring...',
    hintLink: 'https://www.airbnb.com/rooms/30045739',
    question: 'What outdoor feature at the cabin would Mark Twain have loved after a dusty stagecoach ride through Gold Country?',
    answer: 'hot tub',
    acceptedAnswers: ['hot tub', 'hottub', 'jacuzzi', 'spa', 'private hot tub'],
    fact: 'Back of Beyond Ranch features a private hot tub where you can soak under the stars - the same stars that Mark Twain gazed upon while traveling through these foothills in the 1860s on his way to San Francisco.',
    suspectHint: 'The thief was spotted relaxing in the hot tub before fleeing!'
  },

  // ========== GOLD RUSH HEIST CASE (7 clues) ==========
  {
    id: 'gr_clue_01',
    caseId: 'gold_rush_heist',
    locationId: 'kennedy_mine',
    order: 1,
    text: 'Mining equipment was found at the crime scene. The thief clearly knows their way around the deep shafts - this mine went so far underground that cage elevators took 20 minutes to reach the bottom!',
    hintLink: 'https://www.kennedygoldmine.com/',
    question: 'How deep did the Kennedy Mine reach at its lowest point (in feet)?',
    answer: '5912',
    acceptedAnswers: ['5912', '5,912', '5912 feet', '5,912 feet'],
    fact: 'Kennedy Mine reached 5,912 feet deep - nearly a mile underground! It was one of the deepest gold mines in North America. Miners worked in sweltering heat at the bottom, extracting gold that helped build California.',
    suspectHint: 'Only someone with mining experience could pull this off...'
  },
  {
    id: 'gr_clue_02',
    caseId: 'gold_rush_heist',
    locationId: 'kennedy_mine',
    order: 2,
    text: 'A memorial flower was left at the mine\'s disaster site. In 1922, a fire trapped dozens of miners underground in what became one of California\'s worst mining tragedies...',
    hintLink: 'https://www.kennedygoldmine.com/',
    question: 'How many miners lost their lives in the 1922 Kennedy/Argonaut Mine fire?',
    answer: '47',
    acceptedAnswers: ['47', 'forty seven', 'forty-seven'],
    fact: 'The 1922 Argonaut Mine fire killed 47 miners who were trapped underground. Rescue attempts continued for weeks while families waited above. The tragedy led to improved mine safety regulations across California.',
    suspectHint: 'The thief has a personal connection to this mine\'s history...'
  },
  {
    id: 'gr_clue_03',
    caseId: 'gold_rush_heist',
    locationId: 'mokelumne_hill',
    order: 3,
    text: 'The suspect was seen at a haunted hotel in this former boomtown. During the Gold Rush, this place was so lawless that the cemetery earned a grim nickname...',
    hintLink: 'https://www.gocalaveras.com/mokelumne-hill/',
    question: 'What was the notorious nickname for Mokelumne Hill\'s cemetery?',
    answer: 'Murderer\'s Gulch',
    acceptedAnswers: ['murderer\'s gulch', 'murderers gulch', 'murderer gulch'],
    fact: 'Mokelumne Hill was so violent during the Gold Rush that 17 murders occurred in a single weekend in 1851! The cemetery became known as \'Murderer\'s Gulch.\' The Hotel Leger, built in 1851, is said to be haunted by victims.',
    suspectHint: 'Fascinated by the town\'s dark past...'
  },
  {
    id: 'gr_clue_04',
    caseId: 'gold_rush_heist',
    locationId: 'angels_camp',
    order: 4,
    text: 'Museum records show the suspect researching the region\'s mining history. After the gold played out, miners discovered another valuable metal in these hills...',
    hintLink: 'https://www.gocalaveras.com/angels-camp/',
    question: 'What metal besides gold was extensively mined around Angels Camp?',
    answer: 'copper',
    acceptedAnswers: ['copper', 'copper ore'],
    fact: 'After the Gold Rush peaked, miners discovered rich copper deposits around Angels Camp. The Utica Mine produced both gold and copper well into the 20th century, extending the town\'s mining heritage.',
    suspectHint: 'Researching mining history for something specific...'
  },
  {
    id: 'gr_clue_05',
    caseId: 'gold_rush_heist',
    locationId: 'murphys',
    order: 5,
    text: 'The suspect paid for wine with old coins at a tasting room. They seemed obsessed with Gold Rush-era currency and artifacts...',
    hintLink: 'https://visitmurphys.com/',
    question: 'Approximately how many wine tasting rooms can visitors explore in the Murphys area today?',
    answer: '20',
    acceptedAnswers: ['20', 'twenty', 'over 20', 'about 20', 'around 20'],
    fact: 'Despite its tiny population, Murphys is home to over 20 wine tasting rooms! The region\'s winemaking history dates back to Italian and French immigrants who planted vines during the Gold Rush era.',
    suspectHint: 'Celebrating with wine after each heist...'
  },
  {
    id: 'gr_clue_06',
    caseId: 'gold_rush_heist',
    locationId: 'bobr_cabin',
    order: 6,
    text: 'Gold Rush miners worked hard during the day but played hard at night! Saloons had card games, billiards, and dice. The suspect was spotted at a mountain cabin that honors this tradition with its own entertainment space...',
    hintLink: 'https://www.airbnb.com/rooms/30045739',
    question: 'What indoor entertainment space at Back of Beyond Ranch continues the Gold Rush tradition of games and fun?',
    answer: 'game room',
    acceptedAnswers: ['game room', 'gameroom', 'games room', 'the game room'],
    fact: 'Back of Beyond Ranch features a game room for entertainment - a nod to the Gold Rush era when miners gathered in saloons for card games and billiards after long days of prospecting. The cabin is perfect for group gatherings!',
    suspectHint: 'Spotted playing pool before making their escape...'
  },
  {
    id: 'gr_clue_07',
    caseId: 'gold_rush_heist',
    locationId: 'jackson',
    order: 7,
    text: 'The suspect emerged from a hidden entrance beneath Main Street! During the Gold Rush, persecuted workers built secret passages to move safely through town...',
    hintLink: 'https://www.amadorgold.com/amador-county-towns/jackson/',
    question: 'Who built the network of secret tunnels beneath Jackson during the Gold Rush era?',
    answer: 'Chinese',
    acceptedAnswers: ['chinese', 'chinese workers', 'chinese miners', 'the chinese', 'chinese immigrants'],
    fact: 'Chinese workers built extensive tunnels beneath Jackson to move safely while facing discrimination above ground. Some of these tunnels still exist today, a hidden reminder of the diverse people who built Gold Country.',
    suspectHint: 'Knows the underground passages like the back of their hand...'
  },

  // ========== CAVE SECRETS CASE (10 clues) ==========
  {
    id: 'cs_clue_01',
    caseId: 'cave_secrets',
    locationId: 'moaning_cavern',
    order: 1,
    text: 'Ancient peoples knew these caves long before European settlers arrived. Archaeologists made a stunning discovery here that rewrote local history...',
    hintLink: 'https://www.caverntours.com/moaning-cavern/',
    question: 'Approximately how many years old are the oldest human remains found in Moaning Cavern?',
    answer: '13000',
    acceptedAnswers: ['13000', '13,000', '13000 years', '13,000 years', 'thirteen thousand'],
    fact: 'Human remains found in Moaning Cavern date back approximately 13,000 years - making it one of the oldest known human sites in North America! The cave was likely used for burials by ancient peoples.',
    suspectHint: 'The artifact thief has archaeological knowledge...'
  },
  {
    id: 'cs_clue_02',
    caseId: 'cave_secrets',
    locationId: 'moaning_cavern',
    order: 2,
    text: 'Specialized climbing gear was abandoned near the cave. Someone descended the massive main chamber without a tour group - a 165-foot drop into darkness...',
    hintLink: 'https://www.caverntours.com/moaning-cavern/',
    question: 'What adventure activity lets visitors descend into Moaning Cavern\'s main chamber on a rope?',
    answer: 'rappelling',
    acceptedAnswers: ['rappelling', 'rappel', 'rope descent', 'abseiling'],
    fact: 'Moaning Cavern offers a 165-foot rappelling descent - one of the longest underground rappels open to the public in California! It\'s like dropping into a vertical football field of darkness.',
    suspectHint: 'An expert climber with cave experience...'
  },
  {
    id: 'cs_clue_03',
    caseId: 'cave_secrets',
    locationId: 'california_caverns',
    order: 3,
    text: 'Delicate crystal formations were disturbed. Only someone who knew what to look for would notice - these caves hold treasures that took millions of years to form...',
    hintLink: 'https://www.caverntours.com/california-caverns/',
    question: 'What famous naturalist and Sierra Club founder explored California Caverns in 1858?',
    answer: 'John Muir',
    acceptedAnswers: ['john muir', 'muir'],
    fact: 'John Muir explored California Caverns in 1858 and was enchanted by its beauty. He described the crystalline formations as \'nature\'s jewelry box.\' His advocacy later helped protect California\'s wild places.',
    suspectHint: 'The suspect quoted Muir\'s writings... well-educated.'
  },
  {
    id: 'cs_clue_04',
    caseId: 'cave_secrets',
    locationId: 'california_caverns',
    order: 4,
    text: 'Crystal fragments were found in a discarded backpack. These rare formations are found in only a handful of caves worldwide - needle-thin and incredibly fragile...',
    hintLink: 'https://www.caverntours.com/california-caverns/',
    question: 'What rare type of crystal formation is California Caverns famous for?',
    answer: 'aragonite',
    acceptedAnswers: ['aragonite', 'aragonite crystals', 'aragonite formations'],
    fact: 'California Caverns contains rare aragonite crystal formations - delicate needle-like structures that form under very specific conditions. They\'re so fragile that even breath moisture can damage them.',
    suspectHint: 'Collecting rare minerals as trophies...'
  },
  {
    id: 'cs_clue_05',
    caseId: 'cave_secrets',
    locationId: 'big_trees',
    order: 5,
    text: 'The stolen artifacts are Miwok in origin. These native peoples lived among the giant sequoias for thousands of years, using the forest\'s gifts for food, shelter, and ceremony...',
    hintLink: 'https://www.parks.ca.gov/?page_id=551',
    question: 'What Native American tribe traditionally lived in the Calaveras Big Trees region?',
    answer: 'Miwok',
    acceptedAnswers: ['miwok', 'me-wuk', 'mewuk', 'sierra miwok'],
    fact: 'The Sierra Miwok people have called this region home for thousands of years. They used acorns from black oaks as a staple food, and the giant sequoias held spiritual significance in their culture.',
    suspectHint: 'Specifically targeting Miwok cultural artifacts...'
  },
  {
    id: 'cs_clue_06',
    caseId: 'cave_secrets',
    locationId: 'murphys',
    order: 6,
    text: 'A receipt shows the suspect purchased cave exploration supplies in Murphys - headlamps, rope, and waterproof bags. They also couldn\'t resist sampling the local wine...',
    hintLink: 'https://visitmurphys.com/',
    question: 'When did winemaking begin in the Murphys/Calaveras County area?',
    answer: '1850s',
    acceptedAnswers: ['1850s', '1850', 'eighteen fifties', 'the 1850s', 'mid 1800s', '1850\'s'],
    fact: 'Italian and French immigrants began planting wine grapes in Calaveras County in the 1850s. Prohibition nearly destroyed the industry, but it revived in the 1970s and now Murphys is a beloved wine destination.',
    suspectHint: 'Left a wine cork at the cave entrance...'
  },
  {
    id: 'cs_clue_07',
    caseId: 'cave_secrets',
    locationId: 'angels_camp',
    order: 7,
    text: 'Old maps were accessed at the museum archives. The suspect was researching cave systems that gold miners accidentally discovered while digging for riches...',
    hintLink: 'https://www.gocalaveras.com/angels-camp/',
    question: 'What annual May event in Angels Camp celebrates Mark Twain\'s literary legacy?',
    answer: 'Jumping Frog Jubilee',
    acceptedAnswers: ['jumping frog jubilee', 'frog jubilee', 'the jubilee', 'frog jumping contest'],
    fact: 'The Jumping Frog Jubilee, held every May since 1928, celebrates Mark Twain\'s famous short story. Thousands gather to watch frogs compete in jumping contests - the current record exceeds 21 feet!',
    suspectHint: 'Planning to smuggle artifacts out during a big event...'
  },
  {
    id: 'cs_clue_08',
    caseId: 'cave_secrets',
    locationId: 'bobr_cabin',
    order: 8,
    text: 'The mountain cabin makes a perfect base for exploring the caves of Calaveras County. From here, both Moaning Cavern and California Caverns are an easy drive through the pine forests...',
    hintLink: 'https://www.airbnb.com/rooms/30045739',
    question: 'How many guests can stay at Back of Beyond Ranch for a cave exploration adventure?',
    answer: '12',
    acceptedAnswers: ['12', 'twelve', '12+', '12 or more'],
    fact: 'Back of Beyond Ranch sleeps 12+ guests, making it perfect for group adventures exploring the caves of Calaveras County. After a day underground, nothing beats relaxing in the hot tub under the stars!',
    suspectHint: 'Scouted the area from this mountain hideaway...'
  },
  {
    id: 'cs_clue_09',
    caseId: 'cave_secrets',
    locationId: 'natural_bridges',
    order: 9,
    text: 'Waterproof evidence bags were found at this swimming hole. The creek here carved through limestone over millions of years, creating natural bridges and hidden grottos...',
    hintLink: 'https://www.parks.ca.gov/?page_id=549',
    question: 'What creek carved the Natural Bridges over millions of years?',
    answer: 'Coyote Creek',
    acceptedAnswers: ['coyote creek', 'coyote'],
    fact: 'Coyote Creek slowly dissolved the marble limestone over millions of years, creating caves that eventually collapsed into the Natural Bridges. On hot summer days, locals cool off in the swimming holes beneath the ancient rock formations.',
    suspectHint: 'Using the waterways to transport stolen goods...'
  },
  {
    id: 'cs_clue_10',
    caseId: 'cave_secrets',
    locationId: 'natural_bridges',
    order: 10,
    text: 'A rock sample matches formations in the suspect\'s hideout! This type of stone, formed from ancient sea creatures, makes up the bridges and caves throughout the region...',
    hintLink: 'https://www.parks.ca.gov/?page_id=549',
    question: 'What type of rock makes up the Natural Bridges formations?',
    answer: 'limestone',
    acceptedAnswers: ['limestone', 'marble limestone', 'marble'],
    fact: 'The Natural Bridges are composed of marble limestone - rock formed from the shells and skeletons of sea creatures that lived here when California was underwater hundreds of millions of years ago!',
    suspectHint: 'This sample reveals the hideout location!'
  },

  // ========== WINE WHODUNIT CASE (3 clues) ==========
  {
    id: 'ww_clue_01',
    caseId: 'wine_whodunit',
    locationId: 'murphys',
    order: 1,
    text: 'The recipe was stolen from a historic wine cellar. Winemaking has deep roots here - immigrants brought their vines and traditions during the Gold Rush...',
    hintLink: 'https://visitmurphys.com/',
    question: 'Which immigrant groups brought winemaking traditions to Calaveras County during the Gold Rush?',
    answer: 'Italian and French',
    acceptedAnswers: ['italian and french', 'french and italian', 'italians and french', 'italian', 'french'],
    fact: 'Italian and French immigrants planted the first wine grapes in Calaveras County during the 1850s Gold Rush. They discovered the Sierra Foothills climate was ideal for growing premium wine grapes.',
    suspectHint: 'Has deep knowledge of local wine history...'
  },
  {
    id: 'ww_clue_02',
    caseId: 'wine_whodunit',
    locationId: 'ironstone_vineyards',
    order: 2,
    text: 'The suspect visited Ironstone\'s famous museum display - a treasure beyond any wine. The largest specimen of its kind in the world sits here, gleaming under the lights...',
    hintLink: 'https://www.ironstonevineyards.com/',
    question: 'How much does the crystalline gold specimen on display at Ironstone Vineyards weigh (in pounds)?',
    answer: '44',
    acceptedAnswers: ['44', '44 pounds', 'forty four', '44 lbs'],
    fact: 'Ironstone Vineyards displays a 44-pound crystalline gold leaf specimen - the largest in the world! It was discovered in nearby Jamestown and is worth millions. Quite a contrast to the wine barrels surrounding it!',
    suspectHint: 'Seemed very interested in valuable objects...'
  },
  {
    id: 'ww_clue_03',
    caseId: 'wine_whodunit',
    locationId: 'bobr_cabin',
    order: 3,
    text: 'Wine bottles from local vineyards were found at the cabin, along with a suspicious note. The thief was planning a celebration with their crew after the heist...',
    hintLink: 'https://www.airbnb.com/rooms/30045739',
    question: 'How many bedrooms does Back of Beyond Ranch have for a wine country getaway?',
    answer: '6',
    acceptedAnswers: ['6', 'six'],
    fact: 'Back of Beyond Ranch features 6 bedrooms, perfect for wine country group getaways. After touring the tasting rooms of Murphys, guests can gather around the fire pit to share their favorite discoveries.',
    suspectHint: 'Planning to celebrate the heist in style!'
  }
]

// Helper functions
export function getCluesByCaseId(caseId: CaseId): EducationalClue[] {
  return EDUCATIONAL_CLUES.filter(clue => clue.caseId === caseId).sort((a, b) => a.order - b.order)
}

export function getCluesByLocationId(locationId: string): EducationalClue[] {
  return EDUCATIONAL_CLUES.filter(clue => clue.locationId === locationId)
}

export function getClueById(id: string): EducationalClue | undefined {
  return EDUCATIONAL_CLUES.find(clue => clue.id === id)
}

export function checkAnswer(clueId: string, userAnswer: string): boolean {
  const clue = getClueById(clueId)
  if (!clue) return false
  const normalized = userAnswer.toLowerCase().trim()
  return clue.acceptedAnswers.some(accepted =>
    normalized === accepted.toLowerCase() || normalized.includes(accepted.toLowerCase())
  )
}

// Get clue count per case
export const CASE_CLUE_COUNTS: Record<CaseId, number> = {
  jumping_frog: 6,
  gold_rush_heist: 7,
  cave_secrets: 10,
  wine_whodunit: 3
}
