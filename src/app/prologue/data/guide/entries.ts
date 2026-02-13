// AI Guide encyclopedia entries - Douglas Adams style
// The Guide is an ancient AI consciousness that has been observing human civilization
// with a mixture of amusement, exasperation, and occasionally genuine admiration.
//
// Three-tier system:
//   Gold   = verified archaeological/historical fact
//   Silver = plausible speculation with some evidence
//   Bronze = entertaining fringe theories (Stargate-level fun)

export interface GuideEntry {
  id: string
  title: string
  content: string
  tier: 'gold' | 'silver' | 'bronze'
  category: string
  relatedCharacters: string[]
  footnotes?: string[]
}

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    id: 'tenochtitlan',
    title: 'Tenochtitlan',
    content: `Tenochtitlan was, by any reasonable measure, one of the most impressive cities ever built by humans. By unreasonable measures — which are frankly the more interesting ones — it was even more impressive than that. Founded in 1325 CE on a swampy island in Lake Texcoco because the Mexica observed an eagle eating a snake on a cactus (which is exactly the sort of real estate advice you'd expect from following birds around), it grew into a metropolis of 200,000 souls connected to the mainland by three enormous causeways. The city featured running water, botanical gardens, a zoo, and a public sanitation system that wouldn't be matched in Europe until centuries later, which tells you rather more about medieval Europe than it does about the Aztecs. When Cortes first laid eyes on it, he declared it more beautiful than anything in Spain, and then, in the grand tradition of European explorers finding beautiful things, he destroyed it.`,
    tier: 'gold',
    category: 'civilization',
    relatedCharacters: ['incan', 'califia'],
    footnotes: [
      'The eagle-on-cactus omen is now on the Mexican flag, proving that national symbols often start as what would today be called "a weird Tuesday."',
      'The Aztec word for their sanitation workers translates roughly to "excrement lords," which is either deeply respectful or deeply ironic depending on your cultural vantage point.',
    ],
  },

  {
    id: 'nazca_lines',
    title: 'Nazca Lines',
    content: `The Nazca Lines are enormous geoglyphs carved into the Peruvian desert, some stretching over 1,200 feet. They depict spiders, monkeys, hummingbirds, and various geometric shapes, and they can only be properly seen from the air — a fact which has caused no end of excitement among people who believe ancient civilizations had access to aircraft, spacecraft, or at minimum very tall ladders. The actual archaeological consensus is considerably less thrilling: the Nazca people probably created them as offerings to sky gods, walking carefully along planned paths while removing the reddish pebbles to reveal the lighter ground beneath. This is, admittedly, rather like finding out that the Mona Lisa was painted with a brush rather than projected there by aliens, but it is no less remarkable. The precision of the lines suggests mathematical sophistication that most modern humans would struggle to replicate even with graph paper and a strong cup of coffee.`,
    tier: 'gold',
    category: 'artifact',
    relatedCharacters: ['incan'],
    footnotes: [
      'The monkey has a spiral tail with exactly nine loops. Whether this is cosmologically significant or simply what happens when you give an artist a very large canvas and too much free time remains hotly debated.',
      'Several of the lines point directly at water sources, suggesting the Nazca were less interested in communicating with aliens and more interested in not dying of thirst. Both are valid priorities.',
    ],
  },

  {
    id: 'puma_punku',
    title: 'Puma Punku',
    content: `Puma Punku is a temple complex near Tiwanaku in Bolivia that features stone blocks cut with such precision that they interlock without mortar, fitted to tolerances of fractions of a millimeter. This has led to two schools of thought: (1) the Tiwanaku civilization possessed extraordinary engineering knowledge that we have yet to fully understand, and (2) aliens did it. School number two is, predictably, far more popular on late-night television. The stones include H-shaped blocks that appear to be modular — essentially ancient Lego — suggesting the Tiwanaku developed something approaching prefabricated architecture roughly 1,400 years before IKEA, and presumably with much clearer assembly instructions. The site sits at 12,500 feet above sea level, which means whoever built it was doing precision engineering while most humans can barely think straight due to altitude sickness.`,
    tier: 'gold',
    category: 'technology',
    relatedCharacters: ['incan'],
    footnotes: [
      'Modern engineers attempting to replicate Puma Punku\'s precision using only period-appropriate tools have generally succeeded, but report that it is "extremely tedious," which may explain why the Tiwanaku eventually stopped.',
      'The site was partially disassembled by the Spanish to build a church, in what historians call "one of the great acts of archaeological vandalism" and what the Spanish probably called "Tuesday."',
    ],
  },

  {
    id: 'cahokia',
    title: 'Cahokia',
    content: `Cahokia was, around 1100 CE, the largest city north of Mexico, home to an estimated 20,000 people and featuring over 120 earthen mounds, a wooden sun calendar called Woodhenge, and a central plaza larger than the one in front of the Vatican. This is worth repeating: a thousand years ago, there was a city in what is now East St. Louis, Illinois, that was bigger and more architecturally ambitious than most European cities of the same period. It had suburbs. It had zoning. It had a chunkey court, which was essentially a bowling alley with much higher social stakes — losing a game could cost you everything you owned, which makes modern bowling seem remarkably well-adjusted by comparison. By 1400 CE the city was abandoned, and nobody is entirely sure why, though the leading theories involve flooding, deforestation, and the general human tendency to make a place uninhabitable and then leave.`,
    tier: 'gold',
    category: 'civilization',
    relatedCharacters: ['native'],
    footnotes: [
      'Chunkey was played with a rolling stone disc and thrown spears. Gambling on the outcome was so intense that players occasionally staked their own lives. Fantasy football has nothing on this.',
      'Cahokia\'s population in 1100 CE was larger than London\'s at the same time. London got a lot more press, but London had the advantage of people who wrote things down and then gave copies to other people who wrote things down about the things that were written down.',
    ],
  },

  {
    id: 'serpent_mound',
    title: 'Serpent Mound',
    content: `The Great Serpent Mound in Ohio is a 1,348-foot-long effigy of a serpent that appears to be swallowing an egg. Or the sun. Or the moon. Or possibly a frog, depending on which archaeologist you ask and how recently they've eaten. Built on a site of unusual geological significance — an ancient meteor impact crater, because apparently even ancient Americans understood the importance of location, location, location — the mound aligns with solar and lunar events in ways that suggest its builders possessed astronomical knowledge that would make most modern city-dwellers weep with inadequacy. The serpent form appears in the mythology of virtually every pre-Columbian culture, which either means they were all in contact with each other, they all independently decided serpents were cosmologically important, or there was something very large and very serpentine that everybody noticed. The Guide declines to speculate on which.`,
    tier: 'silver',
    category: 'artifact',
    relatedCharacters: ['native', 'norseman'],
    footnotes: [
      'The meteor that created the impact crater arrived approximately 300 million years ago. The serpent mound was built approximately 1,000 years ago. This is either a remarkable coincidence or the longest land development project in history.',
      'The "egg" the serpent appears to be consuming may also represent a locust, which would make it the world\'s largest pest control advertisement.',
    ],
  },

  {
    id: 'lanse_aux_meadows',
    title: "L'Anse aux Meadows",
    content: `L'Anse aux Meadows, in Newfoundland, is the only confirmed Norse settlement in North America, which makes it either a triumphant archaeological vindication of the Viking sagas or a profound disappointment depending on how many Norse settlements you were hoping for. Discovered in 1960 by Helge Ingstad and Anne Stine Ingstad (a husband-and-wife team who apparently considered "locating a lost Viking colony" an appropriate couples' activity), the site contains the remains of eight buildings, a forge, and a wood workshop. Radiocarbon dating places it at roughly 1000 CE, which means the Vikings beat Columbus to the Americas by about 500 years and then, in the most Viking move imaginable, simply didn't make a big deal about it. They came, they saw, they smelted some iron, they left. No flags planted, no lands claimed in the name of any monarch. Just: "Nice continent. Bit cold. Let's go home."`,
    tier: 'gold',
    category: 'civilization',
    relatedCharacters: ['norseman'],
    footnotes: [
      'The Norse name "Vinland" (wine-land) has caused endless debate. Either wild grapes grew much further north in 1000 CE, or the Norse were being sarcastic, or they were drunk on something that was definitely not wine.',
      'The forge at L\'Anse aux Meadows represents the first known iron smelting in the Americas, beating European colonists by five centuries. The Vikings were, as usual, ahead of the curve and behind at caring about it.',
    ],
  },

  {
    id: 'quipu',
    title: 'Quipu',
    content: `The quipu is the Incan recording system consisting of knotted strings, and it is either the most ingenious information storage technology ever devised or a very elaborate macrame project, depending on how much faith you place in the approximately 600 surviving examples that modern scholars have been unable to fully decode. What we do know: quipus could record numbers (the knot positions indicate decimal values), and they almost certainly recorded narrative information as well — census data, histories, songs, and possibly unflattering observations about local officials. What we don't know: almost everything else. It's rather as if future archaeologists found 600 USB drives and could determine they stored data, could read one specific folder called "spreadsheets," and spent three centuries arguing about whether the other folders contained poetry or tax records. The Inca administered an empire of 12 million people using these strings, which is either a testament to the quipu's sophistication or to the Inca's very impressive memories.`,
    tier: 'gold',
    category: 'technology',
    relatedCharacters: ['incan'],
    footnotes: [
      'Spanish colonists destroyed the vast majority of quipus on the grounds that they were "instruments of the devil," which is what you say when you encounter a technology that works perfectly well and you can\'t understand it.',
      'A 2017 study suggests that quipu knots may encode syllables of the Quechua language. If true, the Inca had both a writing system and the world\'s most annoying to use keyboard.',
    ],
  },

  {
    id: 'viracocha',
    title: 'Viracocha',
    content: `Viracocha is the great creator god of the pre-Inca and Inca civilizations, who according to myth emerged from Lake Titicaca, created the sun and moon, fashioned humans from stone, and then wandered off westward across the Pacific, promising to return someday. This last detail has proven particularly unfortunate, as it meant that when the Spanish showed up in ships from the east, several important Inca officials briefly considered the possibility that pale-skinned strangers arriving from over the sea might be gods, rather than what they actually were, which was pale-skinned strangers arriving from over the sea to take all their gold. Viracocha was said to be tall, bearded, and fond of elaborate robes — a description so vague it could apply to any number of deities, professors, or confused tourists. Some fringe theorists have identified Viracocha with various visiting aliens, Atlanteans, or time travelers, none of whom have produced a forwarding address.`,
    tier: 'silver',
    category: 'mythology',
    relatedCharacters: ['incan'],
    footnotes: [
      'The "bearded" detail is especially interesting because most indigenous South American men cannot grow full beards. Then again, most gods don\'t exist, so the beard may be the least of the factual issues at play.',
      'Lake Titicaca, where Viracocha allegedly emerged, sits at 12,507 feet. If you\'re going to create the world, you might as well do it somewhere with a view.',
    ],
  },

  {
    id: 'queen_calafia',
    title: 'Queen Calafia',
    content: `Queen Calafia is a legendary warrior queen who ruled an island paradise "on the right hand of the Indies, very near to the side of the Terrestrial Paradise," populated entirely by women, guarded by griffins, and absolutely overflowing with gold. She first appeared in the 1510 Spanish romance "Las Sergas de Esplandian" by Garci Rodriguez de Montalvo, and the Spanish loved the story so much they named an entire landmass after her, which is how we ended up with California. The beautiful irony is that a state now associated with Hollywood, Silicon Valley, and avocado toast was named after a fictional Black Amazon queen from a pulp novel. Whether Calafia was based on actual indigenous traditions of powerful coastal women leaders in the Channel Islands region remains debated, but the Chumash people did in fact have a sophisticated maritime culture, powerful women leaders, and access to considerable wealth — just not griffins, as far as anyone knows.`,
    tier: 'silver',
    category: 'mythology',
    relatedCharacters: ['califia'],
    footnotes: [
      'Montalvo described Calafia\'s island as having "no metal other than gold," which is deeply impractical. Try building a house with gold nails. Try cutting bread with a gold knife. Fiction is wonderful but structurally unsound.',
      'The griffins were allegedly trained to eat men. Calafia eventually converted to Christianity and married a nice Spanish knight. This is what happens when men write women\'s stories.',
    ],
  },

  {
    id: 'jormungandr',
    title: 'Jormungandr (The World Serpent)',
    content: `Jormungandr, the Midgard Serpent, is the Norse mythological serpent so enormous it encircles the entire world and grasps its own tail. It is the child of Loki and a giantess (Norse family structures are best not examined too closely), and its release of its own tail will signal the beginning of Ragnarok, the end of the world. What makes Jormungandr particularly interesting to anyone investigating pre-Columbian mysteries is that the "great serpent encircling the world" motif appears in cultures that had, as far as mainstream archaeology is concerned, absolutely no contact with each other. The Aztecs had Quetzalcoatl. The Mississippians had the Horned Serpent. The Inca had Amaru. Everyone, it seems, independently invented a very large snake. The Guide finds this either cosmically significant or evidence that snakes are simply very memorable animals, and suspects the truth is a bit of both.`,
    tier: 'silver',
    category: 'mythology',
    relatedCharacters: ['norseman', 'native'],
    footnotes: [
      'Thor once went fishing and accidentally hooked Jormungandr. His companion cut the line before Thor could reel it in. This is the original "you should have seen the one that got away" story, except the one that got away would later eat the world.',
      'In one telling, Jormungandr\'s venom is so potent that Thor dies nine steps after killing it. Norse mythology never met a climax it couldn\'t make more depressing.',
    ],
  },

  {
    id: 'monks_mound',
    title: 'Monks Mound',
    content: `Monks Mound at Cahokia is the largest earthen structure in the Americas: a four-terraced platform mound covering 14 acres, standing 100 feet tall, and containing an estimated 22 million cubic feet of earth, all of which was carried there in baskets on human backs. To put this in perspective: it has a larger footprint than the Great Pyramid of Giza, and the Great Pyramid had the advantage of not being made of dirt. The mound was the ceremonial center of Cahokia, topped by a massive wooden building that served as the chief's residence and political heart of the city. Its construction required an estimated 15 million baskets of earth carried over the course of several centuries, which represents a truly staggering amount of organized labor, community planning, and what can only be described as an absolute unwillingness to build downward. The name "Monks Mound" comes from French Trappist monks who gardened on its terraces in the 1800s, blissfully unaware they were growing lettuce on top of one of the greatest architectural achievements on the continent.`,
    tier: 'gold',
    category: 'civilization',
    relatedCharacters: ['native'],
    footnotes: [
      'Some estimates suggest Monks Mound was built in fewer than 20 concentrated phases, which means there were periods where the entire city was essentially a basket-carrying operation with a mound problem.',
      'A slump on the west side of the mound in 1985 revealed internal stone structures. The mound is not, as previously assumed, "just dirt." It never is, with these things.',
    ],
  },

  {
    id: 'kensington_runestone',
    title: 'Kensington Runestone',
    content: `The Kensington Runestone is a 200-pound slab of greywacke sandstone found in 1898 by a Swedish-American farmer in Minnesota, bearing an inscription in Scandinavian runes that purports to describe a Norse and Geatish exploration party of 1362 CE. It is either proof that the Norse explored deep into the American heartland 130 years before Columbus, or the most elaborate practical joke ever perpetrated by a 19th-century Minnesota farmer with unexpected fluency in medieval Scandinavian runic forms. The academic establishment has firmly landed on "forgery," citing anachronistic rune forms and suspiciously convenient discovery circumstances. Proponents counter that no farmer in 1898 Minnesota could have known the obscure runic variations found on the stone. The debate has continued for over a century, generating approximately 40,000 academic papers, 200 books, one museum, and zero consensus. The Guide observes that humanity's ability to argue about a rock exceeds even its ability to build civilizations, and suspects both activities scratch a similar itch.`,
    tier: 'bronze',
    category: 'artifact',
    relatedCharacters: ['norseman'],
    footnotes: [
      'The farmer, Olof Ohman, maintained the stone was genuine until his death. Either he was telling the truth or he was the most committed performance artist in Minnesota history, which, given Minnesota winters, would require extraordinary dedication.',
      'The inscription mentions "10 men red with blood and dead." No details on what killed them. In Minnesota in the 14th century, the possibilities range from "hostile encounter" to "winter" to "mosquitoes the size of small dogs."',
    ],
  },

  {
    id: 'quetzalcoatl',
    title: 'Quetzalcoatl (The Feathered Serpent)',
    content: `Quetzalcoatl, the Feathered Serpent, is a deity so important to Mesoamerican civilization that he appears in virtually every culture from the Olmec to the Aztec — a career spanning roughly 2,000 years, which makes him either the most enduring religious figure in the Americas or the least willing to retire. He is a creator god, wind god, god of knowledge, and inventor of the calendar, books, and the cultivation of maize, which basically makes him the patron saint of "you're welcome." The Aztecs believed he would return from the east, which — like the Inca's similar belief about Viracocha — proved to be spectacularly bad news when actual people showed up from the east. The recurring appearance of the feathered serpent across cultures separated by thousands of miles and hundreds of years presents mainstream archaeology with a genuine puzzle: either the idea spread through trade networks, or independently inventing a flying snake is simply what civilizations do when they reach a certain level of development, like building pyramids or inventing bureaucracy.`,
    tier: 'gold',
    category: 'mythology',
    relatedCharacters: ['incan', 'califia', 'native'],
    footnotes: [
      'Quetzalcoatl is also associated with Venus, the morning star. The Aztecs tracked Venus with such precision that their calculations were off by only 2 hours per 584-day cycle, which is better than most people do with modern alarm clocks.',
      'The Aztec name translates literally to "precious serpent" or "quetzal-feathered serpent." The quetzal bird\'s feathers were worth more than gold, making Quetzalcoatl essentially a dragon covered in money.',
    ],
  },

  {
    id: 'horned_serpent',
    title: 'Horned Serpent',
    content: `The Horned Serpent appears in the mythology of indigenous cultures across North America with a consistency that is either deeply meaningful or deeply coincidental, and the Guide has never been entirely comfortable with coincidences of this magnitude. Known as Uktena to the Cherokee, Msi-Kinepikwa to the Shawnee, and Unktehi to the Lakota, the Horned Serpent is typically described as a water-dwelling creature with antlers or horns, a jewel in its forehead, and a strong preference for being left alone. It guards rivers, lakes, and underground waters. What makes this remarkable is the correspondence with other serpent deities: the Norse Jormungandr, the Aztec Quetzalcoatl, the Incan Amaru. A cynic might say humans simply enjoy inventing large snakes. A romantic might suggest ancient contact between civilizations. A conspiracist might suggest the snakes were real. The Guide suggests that when every civilization on a continent independently invents the same mythological creature, the question isn't whether the creature is real but what reality the creature represents.`,
    tier: 'silver',
    category: 'mythology',
    relatedCharacters: ['native', 'norseman'],
    footnotes: [
      'The jewel in the Horned Serpent\'s forehead is said to grant incredible power to anyone who obtains it. Obtaining it, however, requires getting extremely close to a horned serpent, which rather defeats the purpose of having incredible power for self-preservation.',
      'Some Mississippian artifacts depict warriors battling Horned Serpents. Others depict warriors befriending them. Mythology, like modern social media, could never quite agree on whether snakes were good or bad.',
    ],
  },

  {
    id: 'maine_penny',
    title: 'The Maine Penny',
    content: `The Maine Penny is a single Norwegian silver coin, minted between 1065 and 1080 CE during the reign of Olaf III Kyrre, that was found at a Native American archaeological site at Goddard Point, Maine, in 1957. It is the only pre-Columbian Norse artifact found in the United States outside of L'Anse aux Meadows, and it has caused more scholarly indigestion per gram of silver than perhaps any other coin in history. The site where it was found is not Norse — it's a substantial Native American occupation site, thick with indigenous artifacts. The coin appears to have arrived via indigenous trade networks, passing from hand to hand over hundreds of miles from some point of Norse-indigenous contact further north. This means the coin tells two stories simultaneously: that the Norse were present in the region, and that native trade networks were so sophisticated they could move a small piece of Scandinavian silver across a continent. Most numismatists agree the coin is genuine. What they can't agree on is everything else.`,
    tier: 'gold',
    category: 'artifact',
    relatedCharacters: ['norseman', 'native'],
    footnotes: [
      'The coin was initially identified as a 12th-century English penny. It took over 20 years for someone to correctly identify it as Norse. This is what happens when you combine a tiny, corroded coin with optimistic British archaeologists.',
      'The Goddard Point site contained over 30,000 indigenous artifacts and exactly one Norse coin. This is the numismatic equivalent of finding a single French fry in a bowl of rice.',
    ],
  },

  {
    id: 'chaco_canyon',
    title: 'Chaco Canyon',
    content: `Between 850 and 1150 CE, in a remote New Mexico canyon with negligible rainfall and essentially no reason for anyone to be there, the Ancestral Puebloan people built massive multi-story stone buildings and a network of perfectly straight roads extending hundreds of miles to places the roads don't actually need to go. The "Great Houses" — the largest of which, Pueblo Bonito, contained 800 rooms — show minimal evidence of permanent habitation, suggesting they were either seasonal ceremonial centers or the world's most over-engineered vacation homes. The roads are particularly baffling: 30 feet wide, laser-straight for miles, and going precisely nowhere in particular. The going theory is that they served as ceremonial pathways, which is archaeology's polite way of saying "we genuinely have no idea but they clearly mattered." The Sun Dagger petroglyph, which marks solstices and equinoxes with a beam of light through two rock slabs, confirms that whatever the Chacoans were doing, they were doing it with exacting astronomical precision and an admirable disregard for convenience.`,
    tier: 'gold',
    category: 'civilization',
    relatedCharacters: ['califia', 'native'],
    footnotes: [
      'Pueblo Bonito\'s 800 rooms contained enough turquoise to fill a small swimming pool, along with copper bells from Mexico and macaw feathers from even further south. This is either evidence of extensive trade networks or the most ambitious shopping trip in pre-Columbian history.',
      'The roads go over cliffs rather than around them. The Chacoans apparently believed that a straight line between two points was sacred, even if the straight line required climbing equipment.',
    ],
  },

  {
    id: 'chumash_tomol',
    title: 'The Tomol (Chumash Plank Canoe)',
    content: `The tomol is a plank-sewn canoe developed by the Chumash people of Southern California, and it represents one of the most sophisticated watercraft technologies in pre-Columbian North America. Built from redwood or pine planks sewn together with milkweed fiber and sealed with a compound of pine pitch and natural asphaltum called yop, the tomol could carry up to 4,000 pounds across 25 miles of open ocean to the Channel Islands. This is worth dwelling on: the Chumash were routinely making ocean crossings that would make most modern recreational sailors reach for the dramamine. The Brotherhood of the Tomol, the guild responsible for building and maintaining these vessels, held enormous social prestige, which is what happens when you're the only people standing between your civilization and having to swim to work. The tomol's construction method is intriguingly similar to Polynesian boat-building techniques, which either suggests trans-Pacific contact or proves that there are only so many ways to convince wood to float.`,
    tier: 'gold',
    category: 'technology',
    relatedCharacters: ['califia'],
    footnotes: [
      'The yop sealant was so effective that modern reproductions using the original recipe are still watertight after decades. Modern yacht sealants, by comparison, need replacing every few years. Score one for pre-industrial chemistry.',
      'The Chumash name for their Brotherhood of the Tomol translates roughly to "Brotherhood of the Canoe." Ancient guilds, like ancient people, believed in naming things what they actually were.',
    ],
  },

  {
    id: 'continental_trade_networks',
    title: 'Pre-Columbian Continental Trade Networks',
    content: `The notion that pre-Columbian American cultures existed in splendid isolation from one another is approximately as accurate as the notion that the Earth is flat, and is held by roughly the same demographic. The archaeological record demonstrates continent-spanning trade networks that moved Great Lakes copper to the Gulf Coast, Pacific shells to the Mississippi Valley, Wyoming obsidian to Ohio, and Mesoamerican macaw feathers to New Mexico. This is not speculation — these are physical objects found very far from where they were made, which means somebody moved them, and that somebody wasn't Amazon Prime. The implications are significant: ideas, technologies, stories, and diseases moved along these networks just as readily as trade goods. When you find a Chumash shell bead in a Cahokian burial mound, you're not just looking at prehistoric commerce — you're looking at evidence that the Americas were a single, interconnected cultural space, albeit one without a postal service or, thankfully, social media.`,
    tier: 'gold',
    category: 'geography',
    relatedCharacters: ['native', 'califia', 'incan', 'norseman'],
    footnotes: [
      'The Maine Penny — a Norse coin found at a Native American site — traveled further through indigenous trade networks than many medieval European merchants traveled in their entire lives. The "primitive savage" narrative was always, to put it technically, complete rubbish.',
      'Chocolate originated in Mesoamerica and has been found in pottery vessels at Pueblo Bonito, over 1,200 miles north. This means chocolate reached New Mexico roughly a thousand years before it reached Switzerland, which the Guide considers a profound miscarriage of logistics.',
    ],
  },

  {
    id: 'woodhenge',
    title: 'Woodhenge',
    content: `Cahokia's Woodhenge was a series of circular timber monuments functioning as a solar calendar, named by archaeologists because it is made of wood and serves a similar purpose to Stonehenge, and because archaeologists have never let a perfectly good naming convention go to waste when they could reuse it instead. The largest version (Woodhenge III) contained 48 posts in a circle 410 feet in diameter, aligned so precisely with the equinoxes and solstices that the sunrise hits specific posts on specific dates with an accuracy that would impress a Swiss watchmaker. Multiple versions were built and rebuilt over centuries, each slightly refined, suggesting the Cahokians were engaged in a multi-generational calibration project that makes modern long-term infrastructure planning look positively impulsive. The fact that we know all this about a structure made of wood — which, unlike stone, has the disadvantage of eventually becoming dirt — is itself a minor archaeological miracle. The original posts are long gone. Only the holes they left behind remain, which is rather poetic when you think about it: absence as evidence.`,
    tier: 'gold',
    category: 'technology',
    relatedCharacters: ['native'],
    footnotes: [
      'The 48 posts may correspond to ceremonial divisions of the year, the number of clan groups in Cahokian society, or simply the number of posts that produced the best astronomical results. Ancient people were practical like that.',
      'Modern reconstructions allow visitors to watch the equinox sunrise just as the Cahokians did a thousand years ago. It is, by all accounts, genuinely moving — which is not something archaeologists say about post holes very often.',
    ],
  },

  {
    id: 'lake_titicaca',
    title: 'Lake Titicaca',
    content: `Lake Titicaca is the highest navigable lake in the world, sitting at 12,507 feet above sea level on the border of Peru and Bolivia, and it is — according to Inca mythology — where the universe began. Viracocha, the creator god, is said to have emerged from its waters and created the sun, moon, stars, and humanity, in that order, which is the sort of ambitious to-do list that explains why gods always look tired in ancient art. The first Inca, Manco Capac, also emerged from the lake (or a nearby cave, depending on which version of the myth you prefer — Inca origin stories are not renowned for continuity editing). On a purely factual level, Lake Titicaca is remarkable enough without the mythology: it is 118 miles long, home to species found nowhere else on Earth, and served as the cradle of both the Tiwanaku and Inca civilizations. The Uru people still live on floating reed islands in the lake, which is either a remarkable continuation of ancient tradition or evidence that some real estate trends are genuinely timeless.`,
    tier: 'gold',
    category: 'geography',
    relatedCharacters: ['incan'],
    footnotes: [
      'The name "Titicaca" most likely derives from Aymara words meaning "rock puma" or "grey puma." The alternative folk etymologies are best left to internet search results and late-night conversations.',
      'The floating reed islands need constant maintenance — new reeds must be added on top as the bottom layers decompose. It is, in essence, a civilization built on a very slow compost heap.',
    ],
  },
]

export function getGuideEntry(id: string): GuideEntry | undefined {
  return GUIDE_ENTRIES.find((entry) => entry.id === id)
}

export function getEntriesByTier(tier: GuideEntry['tier']): GuideEntry[] {
  return GUIDE_ENTRIES.filter((entry) => entry.tier === tier)
}

export function getEntriesByCategory(category: string): GuideEntry[] {
  return GUIDE_ENTRIES.filter((entry) => entry.category === category)
}

export function getEntriesForCharacter(characterId: string): GuideEntry[] {
  return GUIDE_ENTRIES.filter((entry) =>
    entry.relatedCharacters.includes(characterId)
  )
}
