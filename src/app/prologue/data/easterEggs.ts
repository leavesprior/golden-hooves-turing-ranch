// Time Echoes - connections between Prologue (600-1500 AD) and main game (1849)
// Each echo is a deliberate planted connection that rewards players
// who play both the Prologue and the main game.

export interface TimeEchoData {
  id: string
  title: string
  description: string
  discoveryContext: string
  manifestation: string
  character: string
  actNumber: number
  episodeNumber: number
}

export const TIME_ECHOES: TimeEchoData[] = [
  {
    id: 'norse_runestone_beneath_mine',
    title: 'The Runestone Below',
    description:
      'Erik carves a runestone deep within a cave system in the Great Lakes region, recording his journey south from Vinland. He places it where he believes no one will disturb it — at the base of a mineral-rich quartz vein that catches the torchlight like frozen fire.',
    discoveryContext:
      'During Act I, Episode 3, Erik explores a cave system near the Great Lakes and finds a quartz vein. He carves his runestone here as a waymarker for future Norse travelers, noting the "river of white fire stone" in the rock.',
    manifestation:
      'In the 1849 Gold Rush game, a prospector blasting open a new mineshaft discovers a weathered runestone with unmistakable Norse runes buried beneath 800 years of sediment. The mine owner dismisses it as "Indian scratching." Players who completed the Prologue recognize the rune pattern as Erik\'s handwork and earn a bonus clue pointing to the deeper mystery beneath the Gold Rush surface.',
    character: 'norseman',
    actNumber: 1,
    episodeNumber: 3,
  },

  {
    id: 'cahokian_mound_earth',
    title: 'Sacred Earth, Sacred Ground',
    description:
      'Soaring Hawk performs a ceremony at a distant western mound, carrying consecrated earth from Monks Mound in a ceremonial pouch. He buries a portion at each sacred site along the great trade route, creating a spiritual chain linking Cahokia to the western lands.',
    discoveryContext:
      'During Act II, Episode 2, Soaring Hawk establishes a new mound shrine far from Cahokia, burying Monks Mound earth and performing the Morning Star ceremony. He notes in a dream vision that "the earth remembers what the people forget."',
    manifestation:
      'At the Back of Beyond Ranch in the 1849 game, an unusual mound formation near the creek contains soil that doesn\'t match the local geology. A geologist NPC mentions it "looks like Mississippi River valley loess, thousands of miles from where it should be." Players from the Prologue know exactly how it got there.',
    character: 'native',
    actNumber: 2,
    episodeNumber: 2,
  },

  {
    id: 'chumash_star_chart',
    title: 'The Stars Remember',
    description:
      'Califia commissions her finest navigators to create a comprehensive star chart of the Pacific coast, plotting not just sea routes but significant inland locations identified by their stellar coordinates. One location is marked with a special glyph meaning "golden convergence."',
    discoveryContext:
      'During Act III, Episode 1, Califia\'s scouts report an inland valley visible from a mountain pass where three star lines converge — the Chumash navigational equivalent of "X marks the spot." She records the coordinates on an abalone shell chart using the tomol navigation notation system.',
    manifestation:
      'In the 1849 game, a Chumash elder at a California mission shows the player an ancient abalone shell chart. If examined closely, one glyph cluster corresponds precisely to the coordinates of the Back of Beyond Ranch. The elder says only: "The old ones knew where the gold sleeps."',
    character: 'califia',
    actNumber: 3,
    episodeNumber: 1,
  },

  {
    id: 'incan_quipu_1849',
    title: 'The Knot That Binds Time',
    description:
      'While deciphering ancient quipus, Yachay discovers a sequence that encodes a date far in the future. Using the Incan calendar system, the knots describe the year, season, and a set of coordinates. The date, when converted, corresponds to 1849 CE.',
    discoveryContext:
      'During Act IV, Episode 2, Yachay encounters a quipu of unusual antiquity — predating even the Tiwanaku period. Among its standard census data, a hidden sequence uses a different knot pattern. Decoded, it reads: "When the sun enters the house of gold for the 1,849th turning, the serpent\'s children will dig where the eagle once flew."',
    manifestation:
      'In the 1849 game, a museum curator in San Francisco possesses a small quipu fragment acquired from a South American trader. Players who completed the Prologue can decode it, revealing the message about 1849 and the location of a hidden cache. Other players see only "a knotted string of no particular significance."',
    character: 'incan',
    actNumber: 4,
    episodeNumber: 2,
  },

  {
    id: 'aztec_codex_prospector',
    title: 'The Man Out of Time',
    description:
      'In a crumbling Aztec codex fragment recovered during the convergence chapter, one panel depicts a figure that is deeply anachronistic: a person wearing a wide-brimmed hat, carrying a pickaxe and pan, surrounded by golden circles. The art style is unmistakably pre-Columbian. The subject matter is unmistakably not.',
    discoveryContext:
      'During the Convergence chapter (Act V, Episode 1), all four characters examine artifacts at the great meeting point. The codex is partially damaged, but the prospector figure is clear. Yachay notes that the glyph date beside the figure translates to "the age when the yellow metal devours the land." The Guide comments dryly that prophecy is just history written by someone facing the wrong direction.',
    manifestation:
      'In the 1849 game, a street artist in San Francisco paints murals inspired by "old Mexican picture books." One mural clearly shows an Aztec-style prospector panning for gold. Most NPCs dismiss it as artistic license. Players from the Prologue recognize the original codex panel and gain access to a hidden quest line about the "Prophecy of Gold."',
    character: 'incan',
    actNumber: 5,
    episodeNumber: 1,
  },

  {
    id: 'guide_ranch_comment',
    title: 'The Guide Was Here',
    description:
      'The AI Guide, in one of its characteristic asides, makes an offhand remark about a particular location in the western foothills that it finds "cosmologically irritating." It notes that the site sits at an intersection of ley lines, trade routes, migration paths, and geological fault lines in a way that suggests "either divine planning or spectacularly improbable coincidence, which the Guide has learned are often the same thing."',
    discoveryContext:
      'This comment appears in the Guide when players examine any location in the western convergence area during Act V, Episode 3. The Guide provides coordinates in multiple ancient systems (Chumash stellar notation, Incan quipu distance-knots, Mississippian solar alignments, and Norse sailing directions) that all describe the same place.',
    manifestation:
      'In the 1849 game, the Back of Beyond Ranch sits at exactly this location. The Guide entry for the ranch, if unlocked, reads: "The Guide has observed this location for approximately 800 years and can confirm that it has always attracted trouble, treasure, and people who should know better than to dig holes in cosmologically significant ground."',
    character: 'native',
    actNumber: 5,
    episodeNumber: 3,
  },

  {
    id: 'the_number_42',
    title: 'The Answer',
    description:
      'The number 42 appears with suspicious frequency across all four character paths, embedded in the fabric of the game world like a cosmic watermark. It is never explained. It is never acknowledged by any character. It simply IS.',
    discoveryContext:
      'Scattered across the entire Prologue: the Norse expedition has 42 members total across all voyages mentioned in the sagas. Cahokia has 42 visible mound sites along its central axis. Califia\'s fleet contains 42 tomol canoes. The ancient quipu Yachay decodes has 42 primary strings. The portal network requires exactly 42 energy units to fully activate. The Guide\'s humor subroutine is labeled Module 42. Each instance is historically plausible enough to seem coincidental — which is, of course, the point.',
    manifestation:
      'In the 1849 game, the number 42 appears in: the number of days to reach California by the fastest route, the claim number of the Back of Beyond Ranch, the price (in dollars) of the key item at the general store, and the room number at the best hotel in San Francisco. Players who notice the pattern across both games unlock a secret Guide entry titled "On the Persistence of Certain Numbers" which reads, in its entirety: "42. You\'re welcome."',
    character: 'native',
    actNumber: 1,
    episodeNumber: 1,
  },
]

export function getEchoesForCharacter(characterId: string): TimeEchoData[] {
  return TIME_ECHOES.filter((echo) => echo.character === characterId)
}

export function getEchoByAct(actNumber: number): TimeEchoData[] {
  return TIME_ECHOES.filter((echo) => echo.actNumber === actNumber)
}

export function getEchoById(id: string): TimeEchoData | undefined {
  return TIME_ECHOES.find((echo) => echo.id === id)
}
