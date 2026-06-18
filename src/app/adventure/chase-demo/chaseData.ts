// THE TARE'S TRAIL: where did Cyrus Vane go? — Carmen-Sandiego deduction chase.
// Self-contained chase MODE — now surfaced from the live /adventure hub.
// This data file encodes the 4-rule clue grammar from
// docs/ADVENTURE_CLUE_REDESIGN_CARMEN_SANDIEGO.md §2 as a playable chain.
//
// Rule 1: clues point at an ATTRIBUTE of the NEXT town, never its name.
// Rule 2: clues come from named, diegetic witnesses.
// Rule 3: difficulty = obscurity (easy vs hard phrasing of the same target).
// Rule 4: a wrong pick costs a day; the redirect uses the EASIER phrasing.
//
// v2 ACCELERATION — the loop now TIGHTENS as it closes (playtest verdict:
// "grammar is sound but the loop lacks acceleration — every hop weighs the
// same; a real chase tightens"). Three beats added:
//   Beat 1 — WARMING TRAIL: a per-hop `lead` shrinks days-ahead → hours-ahead,
//            so the final correct arrival reads as CORNERING him.
//   Beat 2 — NEAR-MISS DISTRACTORS: each wrong town is COLD or a NEAR-MISS;
//            a near-miss still costs the day but teases a Wanted-Poster trait.
//   Beat 3 — COSTED HARDER CLUE: pressing the witness harder now costs a
//            HALF-DAY (days hold .5). The easy clue stays free; obscurity is a
//            real gamble. Recovery (the redirect's easy clue) is always free.
//
// All historical attributes below are the verified Gold Country facts supplied
// in the build spec. Phrasing describes the attribute; it never names the town.

export interface TownNode {
  id: string
  name: string
  /** One-line flavor descriptor shown in the candidate picker. */
  descriptor: string
  /** Rough real-relative SVG position (0-100 viewBox units). */
  x: number
  y: number
}

export interface Witness {
  /** Named, diegetic source (Rule 2). */
  name: string
  role: string
}

/**
 * How far ahead Vane is on a given hop (Beat 1 — the warming trail). The chase
 * TIGHTENS: early hops he is days ahead, the final hop he is only hours ahead,
 * so catching him reads as cornering, not a fifth identical pick.
 */
export interface Lead {
  /** Short readout shown beside the witness, e.g. "TWO DAYS AHEAD". */
  label: string
  /** Diegetic one-liner the witness adds about how fresh the trail is. */
  flavor: string
  /**
   * 0..1 — how close you are (0 = stone cold start, 1 = right on his heels).
   * Drives the shrinking gap between your route end and Vane's mark on the map.
   */
  proximity: number
}

/**
 * A wrong-pick destination. COLD wastes the day with no tell; a NEAR-MISS still
 * costs the day but reveals/teases a Wanted-Poster trait — you lost his trail
 * but not his scent (Beat 2). Near-misses sit physically/logically close to the
 * true path, so they cluster near the real road.
 */
export interface Distractor {
  townId: string
  kind: 'cold' | 'near-miss'
  /** Witness + line shown when the player picks THIS wrong town. */
  witness: Witness
  line: string
  /**
   * For near-misses only: the partial tell. Either a brand-new poster trait
   * banked early, or (if it duplicates the hop's own trait) a teasing redirect.
   */
  tease?: WantedTrait
}

export interface ClueHop {
  /** Town the player is currently standing in when this clue is given. */
  fromId: string
  /** Town the clue points at — the correct next pick (Rule 1). */
  toId: string
  witness: Witness
  /** How far ahead Vane is on this hop — the warming trail (Beat 1). */
  lead: Lead
  /** Shown first; the EASIER obscurity (Rule 3). */
  easyClue: string
  /** The harder, period-accurate phrasing (offered as "press harder"). */
  hardClue: string
  /** Trait revealed on the Wanted Poster when this hop is completed correctly. */
  trait: WantedTrait
  /**
   * The two wrong candidates for this hop's 3-candidate picker, each tagged
   * cold or near-miss with its own redirect witness + line (Beat 2). The first
   * entry's id is also used as the default redirect if some path needs one.
   */
  distractors: [Distractor, Distractor]
}

export interface WantedTrait {
  label: string
  value: string
}

// ---------------------------------------------------------------------------
// TOWNS — 5 in the chain + 3 distractor-only towns. SVG positions are rough
// real relative geography: West Point sits NE/high in the pines; the CA-49
// towns descend south/southwest along the Mother Lode.
// ---------------------------------------------------------------------------

export const TOWNS: Record<string, TownNode> = {
  west_point: {
    id: 'west_point',
    name: 'West Point',
    descriptor: 'High camp in the pines — Kit Carson named it; a trading post before the gold.',
    x: 74, y: 16,
  },
  mokelumne_hill: {
    id: 'mokelumne_hill',
    name: 'Mokelumne Hill',
    descriptor: 'Stone town on a rich hill; once the county seat.',
    x: 58, y: 34,
  },
  jackson: {
    id: 'jackson',
    name: 'Jackson',
    descriptor: 'A spring-side town that became a county seat — twice.',
    x: 44, y: 30,
  },
  san_andreas: {
    id: 'san_andreas',
    name: 'San Andreas',
    descriptor: 'A camp named for a saint, now holding court.',
    x: 50, y: 52,
  },
  angels_camp: {
    id: 'angels_camp',
    name: 'Angels Camp',
    descriptor: 'A quartz town the storekeepers built; famous far past its size.',
    x: 56, y: 70,
  },
  // distractor-only towns
  volcano: {
    id: 'volcano',
    name: 'Volcano',
    descriptor: 'A town in a crater-like bowl that never erupted; seventeen hotels in a teacup.',
    x: 66, y: 24,
  },
  murphys: {
    id: 'murphys',
    name: 'Murphys',
    descriptor: 'The Queen of the Sierra; its hotel register holds Twain and Grant.',
    x: 70, y: 64,
  },
  sutter_creek: {
    id: 'sutter_creek',
    name: 'Sutter Creek',
    descriptor: 'A tidy deep-quartz town named for the man whose mill started it all.',
    x: 34, y: 42,
  },
}

// Vane's mark on the map sits a shrinking distance BEYOND the player's current
// town along the bearing toward the next true town. We store, per hop, where
// the quarry is drawn so the gap visibly closes (Beat 1, map side).
//
// Each entry = the [x,y] the "VANE?" mark is painted at on the hop with that
// index, derived once by hand from the toId position pulled back toward fromId
// by (1 - proximity). Kept as data so the map stays a pure render.
export const VANE_MARKS: Array<{ x: number; y: number }> = [
  { x: 53, y: 41 }, // hop 0: well ahead, near Moke Hill but offset
  { x: 41, y: 31 }, // hop 1: ahead toward Jackson
  { x: 50, y: 50 }, // hop 2: a day ahead, close to San Andreas
  { x: 56, y: 69 }, // hop 3: hours ahead, right on Angels Camp
]

// Towns drawn on the map (the 5 chain towns + distractors used in the chain).
export const MAP_TOWN_IDS = [
  'west_point', 'mokelumne_hill', 'jackson', 'san_andreas', 'angels_camp',
  'volcano', 'murphys', 'sutter_creek',
]

// ---------------------------------------------------------------------------
// THE CHASE CHAIN — 4 hops. Each clue points at the NEXT town's attribute.
// The `lead` shrinks across the four hops: two days → a day → hours.
// ---------------------------------------------------------------------------

export const CHASE: ClueHop[] = [
  // HOP 1: West Point -> Mokelumne Hill — the trail starts COLD, Vane days gone.
  {
    fromId: 'west_point',
    toId: 'mokelumne_hill',
    witness: { name: 'Eb Crandall', role: 'trading-post clerk' },
    lead: {
      label: 'THREE DAYS AHEAD',
      flavor: "He passed through here the better part of three days back — you've ground to make up.",
      proximity: 0.15,
    },
    easyClue:
      "Vane's bound for the town where the Frenchmen lost their hill — they call it a war, though it was over a claim.",
    hardClue:
      "Follow him to where a claim was only sixteen feet square and still made men rich — a county seat built of stone because it burned to the ground three times over.",
    trait: { label: 'GAIT', value: 'On foot — keeps wide of every horse' },
    distractors: [
      {
        // NEAR-MISS: Volcano is just up the same high road — he doubled back.
        townId: 'volcano',
        kind: 'near-miss',
        witness: { name: 'Pegleg Su', role: 'ferryman' },
        line:
          "He was here — bought bread in the bowl-town yesterday and walked out south before the hotels lit their lamps. You've lost his trail but not his scent.",
        tease: { label: 'GAIT', value: 'On foot — keeps wide of every horse' },
      },
      {
        // COLD: Sutter Creek is the wrong fork entirely.
        townId: 'sutter_creek',
        kind: 'cold',
        witness: { name: 'Tom Quaid', role: 'mill hand' },
        line: 'No sign of any such man at the mill-town. You\'ve wasted a day on the wrong fork.',
      },
    ],
  },
  // HOP 2: Mokelumne Hill -> Jackson — a little closer; two days ahead.
  {
    fromId: 'mokelumne_hill',
    toId: 'jackson',
    witness: { name: 'Mireille Dax', role: 'hotel keeper' },
    lead: {
      label: 'TWO DAYS AHEAD',
      flavor: 'He slept in my hotel two nights gone and paid in dust — you\'re gaining on him.',
      proximity: 0.4,
    },
    easyClue:
      "He's making for the town that grew up around a spring — named, they say, for a pile of bottles left behind there.",
    hardClue:
      "He heads where one oak on Main Street hanged ten men, and the deepest shaft on the whole continent still drops into the dark.",
    trait: { label: 'MANNER', value: 'A gentleman — tips his hat, never curses' },
    distractors: [
      {
        // COLD: Volcano is back uphill — wrong direction.
        townId: 'volcano',
        kind: 'cold',
        witness: { name: 'Hettie Boyd', role: 'postmistress' },
        line: 'No gentleman of that description up in the bowl-town. The day\'s gone and the trail with it.',
      },
      {
        // NEAR-MISS: Murphys — he was seen reading there, teases his TELL early.
        townId: 'murphys',
        kind: 'near-miss',
        witness: { name: 'Cole Marsh', role: 'hostler' },
        line:
          "A polite fellow sat in the Queen\'s hotel a day back, reading aloud from a little book to nobody, then left. Wasn\'t him you wanted today — but you\'ve learned his habit.",
        tease: { label: 'TELL', value: 'Reads aloud from a dime novel while he walks' },
      },
    ],
  },
  // HOP 3: Jackson -> San Andreas — A DAY AHEAD now; the trail warms.
  {
    fromId: 'jackson',
    toId: 'san_andreas',
    witness: { name: 'Lottie Veil', role: 'stage-line agent' },
    lead: {
      label: 'A DAY AHEAD',
      flavor: 'My morning stage carried him out — he\'s scarcely a day in front of you now.',
      proximity: 0.7,
    },
    easyClue:
      "Vane took the road to the old Mexican camp named for a saint — the one that lived under canvas tents for years before it had a wall.",
    hardClue:
      "He's gone to the camp that stole the courthouse away from the stone hill-town — where a gentleman bandit once stood and faced a judge.",
    trait: { label: 'ALIAS', value: 'Travels as "Mr. Vane, surveyor"' },
    distractors: [
      {
        // NEAR-MISS: Murphys — he signed the register, teases his ALIAS early.
        townId: 'murphys',
        kind: 'near-miss',
        witness: { name: 'Deputy Hollis', role: 'jailer' },
        line:
          'A surveyor signed the Queen\'s register this morning and rode out — "Mr. Vane," bold as brass. You missed him by hours here, but now you know his name on paper.',
        tease: { label: 'ALIAS', value: 'Travels as "Mr. Vane, surveyor"' },
      },
      {
        // COLD: Sutter Creek — wrong saint, wrong road.
        townId: 'sutter_creek',
        kind: 'cold',
        witness: { name: 'Ada Frye', role: 'schoolteacher' },
        line: 'No surveyor, no road-agent, no stranger at all in the mill-town. A day burned for nothing.',
      },
    ],
  },
  // HOP 4: San Andreas -> Angels Camp (FINAL) — HOURS AHEAD; you corner him.
  {
    fromId: 'san_andreas',
    toId: 'angels_camp',
    witness: { name: 'Judge Pell', role: 'circuit clerk' },
    lead: {
      label: 'HOURS AHEAD',
      flavor: 'The dust of his boots is still on my courthouse steps — he left not three hours since. Ride now and you have him.',
      proximity: 0.95,
    },
    easyClue:
      "Last anyone saw, he was bound for the town a jumping frog made famous — a writer put it in a story and the name never left.",
    hardClue:
      "He's run to the quartz town the storekeeper brothers built — not saints despite the name — where a man once struck gold with the ramrod of his gun.",
    trait: { label: 'TELL', value: 'Reads aloud from a dime novel while he walks' },
    distractors: [
      {
        // NEAR-MISS: Murphys — so close; teases nothing new but warns time is short.
        townId: 'murphys',
        kind: 'near-miss',
        witness: { name: 'Belle Hart', role: 'saloon owner' },
        line:
          'He ducked through the Queen\'s town an hour ago, didn\'t even stop for a drink — pressed straight on south. You\'re a breath behind. Don\'t lose him now.',
        tease: { label: 'MANNER', value: 'A gentleman — tips his hat, never curses' },
      },
      {
        // COLD: Volcano — dead wrong, all the way back uphill, with hours to lose.
        townId: 'volcano',
        kind: 'cold',
        witness: { name: 'Silas Voss', role: 'stable boy' },
        line: 'Nobody\'s come up to the bowl-town in a week. You rode the wrong way with hours you couldn\'t spare.',
      },
    ],
  },
]

// Vane's standing description for the top of the Wanted Poster (traits below
// fill in as the chase advances).
export const VANE = {
  name: 'CYRUS VANE — "THE TARE"',
  charge:
    'Salting worthless claims with borrowed dust and passing false assay from Sandy Gulch to the Mother Lode — cheating the families trying to make honest ground of this country. Also robbery of the Sonora stage — no shots fired, all hats returned.',
  baseDescription:
    'The tare sown among the wheat — a counterfeit who passes for honest until the harvest. A soft-spoken gentleman of the road, polite to a fault. Afraid of horses, so he works on foot. Wanted across four counties.',
}

// Diegetic opening — roots the chase in the REAL West Point country (the land that
// would, generations on, become Back of Beyond Ranch). Every place named here is
// real and sourced: West Point was named by Kit Carson as his trading-post terminus
// before the gold (CA Historical Landmark #268); Sandy Gulch was the 1849 strike
// two miles off; "salting" a claim and false assay were real frauds of the era.
// Ranch heritage (Leif's call 2026-06-14, from the land records): the documented
// large ranch family on this land was the HARRIS RANCH (Harris/Crosby barn) — not
// the later "Stanley Road" name — and homes here were raised from LOCALLY MILLED
// timber (the West Point milling tradition; the book's on-site '83 oak-milling).
export const STORY_INTRO =
  "West Point — the Mokelumne high country, Kit Carson's old trading post before the gold. " +
  'The Harris place and the homesteads around it are honest ranching country now, their cabins ' +
  'raised from timber milled right here on the land. But a road agent called the Tare has been ' +
  'salting worthless claims with borrowed dust and passing false assay from Sandy Gulch to the ' +
  'Mother Lode, cheating the families working to hold this ground. The circuit marshal hands you ' +
  'the warrant: run him down before the trail goes cold.'

export const STARTING_DAYS = 6

/** Beat 3 — pressing the witness for the obscure clue costs this many days. */
export const PRESS_COST = 0.5

export const SESSION_KEY = 'bobr_chase_demo_state'
/** Persisted set of case ids the player has already closed (drives rotation). */
export const CAUGHT_KEY = 'bobr_chase_cases_caught'

// ===========================================================================
// CASE ROSTER (2026-06-16) — the chase is no longer a single villain. "Take a
// new trail" now rotates to the NEXT uncaught case (bugfix: it used to restart
// Vane every time). Each case is a self-contained 4-hop chain over the same 8
// real towns in a different order. Narrative copy is villain-driven (shortName /
// crimeShort) so the reckoning + verdict read correctly for each quarry.
// ===========================================================================

export interface CaseFile {
  id: string
  villain: {
    name: string
    /** Short handle used in running copy ("the Tare", "Rattlesnake Dick"). */
    shortName: string
    charge: string
    baseDescription: string
    /** Lower-case crime phrase for generated verdict/reckoning copy. */
    crimeShort: string
  }
  intro: string
  startTownId: string
  chain: ClueHop[]
  marks: Array<{ x: number; y: number }>
  startingDays: number
}

// Case 0 — the original Tare's Trail (data above), wrapped as a CaseFile.
export const CASE_VANE: CaseFile = {
  id: 'vane',
  villain: {
    name: VANE.name,
    shortName: 'the Tare',
    charge: VANE.charge,
    baseDescription: VANE.baseDescription,
    crimeShort: 'salting worthless claims and passing false assay across four counties',
  },
  intro: STORY_INTRO,
  startTownId: 'west_point',
  chain: CHASE,
  marks: VANE_MARKS,
  startingDays: STARTING_DAYS,
}

// Case 1 — Rattlesnake Dick (Richard Barter), a brazen mounted bullion-raider.
export const CASE_BARTER: CaseFile = {
  id: 'barter',
  villain: {
    name: 'RATTLESNAKE DICK — "THE PIRATE OF THE PLACERS"',
    shortName: 'Rattlesnake Dick',
    charge: 'Armed robbery of a bullion mule-train and assault upon its guards',
    baseDescription:
      'A loud, saddle-bred raider who takes gold by the muleload and never bothers to whisper. Where the Tare salted claims and smiled, this one rides in heavy, ropes the guards, and is three counties gone before the dust drops. Last seen mounted and moving fast.',
    crimeShort: 'the armed robbery of a bullion mule-train and the assault of its guards',
  },
  intro:
    'They hit the down-mule string at first light — eight hundredweight of bullion gone before the guards had their boots on. No salting, no soft talk, no poetry left on a stump. Just hoofprints and a man they call the Pirate of the Placers, already running. Saddle up. He does not walk.',
  startTownId: 'jackson',
  startingDays: 6,
  marks: [
    { x: 49, y: 33 },
    { x: 53, y: 41 },
    { x: 57, y: 56 },
    { x: 61, y: 66 },
  ],
  chain: [
    {
      fromId: 'jackson',
      toId: 'mokelumne_hill',
      witness: { name: 'Iver Kjelland', role: 'mule-train packer' },
      lead: { label: 'THREE DAYS AHEAD', flavor: 'Cold trail, but the hoofprints all point the one way out of town.', proximity: 0.15 },
      easyClue: 'He rode north for the old county seat — the one built of stone because timber kept burning down around it.',
      hardClue: 'Ask up the hill where the courthouse is the only wall left standing after the town burned to the dirt three separate times. That is where he was watering his horse.',
      trait: { label: 'MOUNT', value: 'a long-legged bay, ridden hard and lathered' },
      distractors: [
        { townId: 'sutter_creek', kind: 'cold', witness: { name: 'Tama Brandvold', role: 'quartz-mill hand' }, line: 'No riders through here but the deep-rock crews. Wrong fork, friend — nobody loud came down to the creek named for the old captain.' },
        { townId: 'volcano', kind: 'near-miss', witness: { name: 'Solveig Aas', role: 'hotel keeper in the bowl' }, line: 'A man tore through our hollow of seventeen hotels yesterday — but he never slowed. I marked how he sat the saddle, though: leaned hard to the off side like the leg pained him.', tease: { label: 'GAIT', value: 'sits a saddle canted right, favors the off leg' } },
      ],
    },
    {
      fromId: 'mokelumne_hill',
      toId: 'san_andreas',
      witness: { name: 'Brünnhilde Vang', role: 'keeper of the Leger bar' },
      lead: { label: 'TWO DAYS AHEAD', flavor: 'The ash is fresher now. Someone fed him and fed his horse.', proximity: 0.42 },
      easyClue: 'He laughed that the county seat was moving south anyway — to the town that took the courthouse and the records right out from under us.',
      hardClue: 'He rode for the rival burg that wrestled away our seat of court — the same dusty street where, years on, they would haul the gentleman poet-robber before the bench.',
      trait: { label: 'MANNER', value: 'brags loud, names his own legend before he leaves' },
      distractors: [
        { townId: 'jackson', kind: 'cold', witness: { name: 'Odd Tveit', role: 'hoist man at the deep shaft' }, line: 'Back the way you came? No. The deepest shafts in the county pull men down, not up — and your Pirate went up the road, not down ours.' },
        { townId: 'volcano', kind: 'near-miss', witness: { name: 'Gerda Lunde', role: 'stage agent in the bowl' }, line: 'He skirted our seventeen-hotel hollow but never lit down. One thing — he answered to a hiss before a name. Boys call him for the snake, not for Richard.', tease: { label: 'ALIAS', value: 'answers to the snake-name before his Christian one' } },
      ],
    },
    {
      fromId: 'san_andreas',
      toId: 'murphys',
      witness: { name: 'Sten Haugland', role: 'courthouse clerk' },
      lead: { label: 'A DAY AHEAD', flavor: 'He passed through bold as brass. We have his trail by the hour now.', proximity: 0.7 },
      easyClue: 'He bragged he would sign the grand register — the fine hotel up the grade they call the Queen of the Sierra.',
      hardClue: 'He means to put his name in the book where the riverboat author and the general-turned-president both signed — the proud town that crowns itself queen of these mountains.',
      trait: { label: 'TELL', value: 'signs guest registers with a false flourish to mock the famous' },
      distractors: [
        { townId: 'sutter_creek', kind: 'cold', witness: { name: 'Marit Sande', role: 'assay-office girl' }, line: 'Not down our way. The deep-quartz creek named for the old Swiss captain is quiet — your loud man never came.' },
        { townId: 'west_point', kind: 'near-miss', witness: { name: 'Halvard Moen', role: 'keeper at the old trading post' }, line: 'A rider cut past the post the scout Carson once kept — gone in a blink. But I caught the bandana: rattlesnake skin, sewn round the band of his hat.', tease: { label: 'TELL', value: 'a rattlesnake-skin band sewn round his hatcrown' } },
      ],
    },
    {
      fromId: 'murphys',
      toId: 'angels_camp',
      witness: { name: 'Ragnvald Sæther', role: 'register clerk, Queen of the Sierra hotel' },
      lead: { label: 'HOURS AHEAD', flavor: 'The ink is still wet where he signed. He cannot be far.', proximity: 0.95 },
      easyClue: 'He took the down-grade road for the camp a jumping frog made famous the world over.',
      hardClue: 'He laughed and rode for the gulch the riverboat author put on the map with nothing but a contest of leaping frogs.',
      trait: { label: 'MOUNT', value: 'the bay throws a notched left fore-shoe — track the bad print' },
      distractors: [
        { townId: 'mokelumne_hill', kind: 'cold', witness: { name: 'Borghild Rygg', role: 'stone-mason' }, line: 'Back uphill to the thrice-burned stone seat? No. He went down the grade, not up to us again.' },
        { townId: 'murphys', kind: 'near-miss', witness: { name: 'Eldrid Foss', role: 'stable boy' }, line: 'He is barely gone — I saddled for him myself. Watch his right hand: two fingers gone at the knuckle from some old powder-burn.', tease: { label: 'TELL', value: 'right hand missing two fingers to an old powder-burn' } },
      ],
    },
  ],
}

// Case 2 — Tom Bell (Dr. Thomas Hodges), a cold gang-boss surgeon.
export const CASE_BELL: CaseFile = {
  id: 'bell',
  villain: {
    name: 'TOM BELL — "THE OUTLAW DOCTOR"',
    shortName: 'Tom Bell',
    charge: 'Organizing the first stage robbery in California; murder of passengers',
    baseDescription:
      'A trained surgeon turned gang-captain — the man who first thought to take a whole stagecoach by force. Where the Tare worked alone and bloodless, this one plans the ambush, posts his men on the road, and does not flinch when the guns open up. Cold, schooled, and feared.',
    crimeShort: 'organizing the first stage robbery in California and the murder of its passengers',
  },
  intro:
    'The down-stage never reached the next station. They took it on the open grade — the first time anyone in this state has dared rob a coach outright — and two passengers will not be riding on. The man behind it carries a doctor\'s satchel and a doctor\'s calm. He plans. So plan back, and ride.',
  startTownId: 'volcano',
  startingDays: 6,
  marks: [
    { x: 50, y: 30 },
    { x: 41, y: 34 },
    { x: 48, y: 45 },
    { x: 54, y: 64 },
  ],
  chain: [
    {
      fromId: 'volcano',
      toId: 'sutter_creek',
      witness: { name: 'Aslaug Vik', role: 'midwife in the bowl' },
      lead: { label: 'THREE DAYS AHEAD', flavor: 'A cold start — he covers ground like a man who plotted the route in advance.', proximity: 0.16 },
      easyClue: 'His gang scattered down toward the deep-quartz camp on the creek named for the old Swiss captain who started all this gold business.',
      hardClue: 'Look to the creek that bears the name of the fort-builder whose mill-race first turned up the color — the deep hard-rock diggings, not the placer bars.',
      trait: { label: 'MANNER', value: 'gives orders like a surgeon; the gang obeys to the word' },
      distractors: [
        { townId: 'murphys', kind: 'cold', witness: { name: 'Torvald Ek', role: 'register clerk, Queen of the Sierra hotel' }, line: 'No gang of his in our book. The hotel that calls itself queen of the Sierra has had no such company — wrong road entirely.' },
        { townId: 'mokelumne_hill', kind: 'near-miss', witness: { name: 'Sigrún Dahl', role: 'apothecary' }, line: 'Riders passed the thrice-burned stone seat but kept on. One bought laudanum and bandage-cloth off me — a deal of it. Carries a doctor\'s bag, that one, sure as I stand here.', tease: { label: 'TELL', value: 'carries a physician\'s satchel; buys medicine in quantity' } },
      ],
    },
    {
      fromId: 'sutter_creek',
      toId: 'jackson',
      witness: { name: 'Commodore Frese', role: 'quartz-mine foreman' },
      lead: { label: 'TWO DAYS AHEAD', flavor: 'The men closed up behind him. He gathers his gang as he goes.', proximity: 0.4 },
      easyClue: 'He went up the road to the camp with the deepest shafts in the whole Mother Lode — and a certain tree they hang men from.',
      hardClue: 'He rode for the diggings that bore straight down farther than any in the state — the same town that keeps a stout oak for stretching necks. He means to free a man, or hang one.',
      trait: { label: 'GAIT', value: 'walks stiff and upright, military, never hurried' },
      distractors: [
        { townId: 'volcano', kind: 'cold', witness: { name: 'Bergljot Strand', role: 'hotelier in the bowl' }, line: 'Back to our hollow of seventeen hotels? No, none returned. Down in the bowl we\'d have heard that many horses.' },
        { townId: 'san_andreas', kind: 'near-miss', witness: { name: 'Knut Bjørke', role: 'deputy at the new courthouse' }, line: 'They skirted the town that took the county seat but did not stop. The captain, though — I saw his face. Pox-scars across both cheeks, deep ones.', tease: { label: 'TELL', value: 'face deeply pitted with old smallpox scars' } },
      ],
    },
    {
      fromId: 'jackson',
      toId: 'san_andreas',
      witness: { name: 'Eivind Sundt', role: 'hoist-engineer, the deep shaft' },
      lead: { label: 'A DAY AHEAD', flavor: 'He left a man of his behind, wounded. He is thinning out — and slowing.', proximity: 0.72 },
      easyClue: 'He cut west for the town that snatched the county seat away from the burned stone hill.',
      hardClue: 'He rode for the upstart seat of court that won the records by vote and grudge — the very bench where, decades hence, they would arraign the gentle poet-robber of stages.',
      trait: { label: 'MANNER', value: 'speaks soft and educated, then orders a killing in the same breath' },
      distractors: [
        { townId: 'sutter_creek', kind: 'cold', witness: { name: 'Gudrun Holt', role: 'mill cook' }, line: 'Not back down to us. The deep-quartz creek named for the captain has been quiet as a grave since they passed through.' },
        { townId: 'angels_camp', kind: 'near-miss', witness: { name: 'Leif Rønning', role: 'tender at the frog-famous camp' }, line: 'A rider scouted the camp the jumping frog made famous, then doubled off. He spoke our barkeep down soft as a parson — then warned, plain, that his gun does the talking. Bell, he called himself.', tease: { label: 'ALIAS', value: 'gives the name "Bell" though the satchel reads another' } },
      ],
    },
    {
      fromId: 'san_andreas',
      toId: 'angels_camp',
      witness: { name: 'Astrid Foldnes', role: 'court recorder' },
      lead: { label: 'HOURS AHEAD', flavor: 'He is alone now and moving slow. One hard ride and you have him.', proximity: 0.95 },
      easyClue: 'His last man pointed him at the camp a jumping frog made famous before the world.',
      hardClue: 'He fled for the gulch the riverboat author immortalized over a wager on leaping frogs — out of gang, out of road.',
      trait: { label: 'MOUNT', value: 'a grey gelding gone dead-lame in the near hind — he is on foot soon' },
      distractors: [
        { townId: 'jackson', kind: 'cold', witness: { name: 'Vigdis Aalto', role: 'tree-keeper' }, line: 'Back to the deepest shafts and the hanging oak? No. He\'d not put his own neck near that tree twice.' },
        { townId: 'san_andreas', kind: 'near-miss', witness: { name: 'Olav Grimstad', role: 'jailer' }, line: 'He is barely clear of town — left on foot half the way. Mark his hands: clean and soft as a doctor\'s, no miner\'s callus on them at all.', tease: { label: 'TELL', value: 'hands soft and uncallused — a surgeon\'s, not a miner\'s' } },
      ],
    },
  ],
}

// Case 3 — Black Bart (Charles Boles), the real Wells Fargo poet-robber. The
// cracking clue is the historical laundry mark F.X.O.7; tried at San Andreas.
const CASE_BART: CaseFile = {
  id: 'bart',
  villain: {
    name: 'BLACK BART — "THE PO8"',
    shortName: 'Black Bart',
    charge: 'Twenty-eight stage robberies upon the Wells Fargo lines of the Mother Lode',
    baseDescription:
      'A graying gentleman of polished manner and gray-shot moustache, who walks the high roads on foot — never astride a horse. He wears a flour-sack hood cut with eye-holes and a long linen duster gone pale with road dust, levels an empty shotgun, and asks only for "the box." He leaves verse signed in a fine clerk\'s hand: "Black Bart, the Po8."',
    crimeShort:
      'robbing the Wells Fargo strongbox and the mails on foot, hooded in a flour sack, and signing his crimes in verse',
  },
  intro:
    'Eight years the high roads have bled. A lone figure steps from the brush at the steep pulls where the teams slow, an empty muzzle leveled, a sack over his face — and he takes nothing but the green strongbox and the U.S. mail, leaving the passengers their purses and a few lines of doggerel signed "the Po8." You ride under James B. Hume, chief detective of Wells Fargo, who has chased this ghost from Sonora to the Siskiyous. A handkerchief was dropped at the last holdup; Hume believes it can hang a thread on the man at last. The Po8 made off across the Stanislaus on foot at dawn. Start at Angels Camp, and do not let him walk his lead out to nothing.',
  startTownId: 'angels_camp',
  startingDays: 6,
  marks: [
    { x: 65, y: 66 },
    { x: 66, y: 44 },
    { x: 49, y: 31 },
    { x: 48, y: 45 },
  ],
  chain: [
    {
      fromId: 'angels_camp',
      toId: 'murphys',
      witness: { name: 'Dab Hawley', role: 'Wells Fargo shotgun messenger' },
      lead: { label: 'THREE DAYS AHEAD', flavor: 'Cold ash in his fire-ring up the gulch; he is three days gone, and walking — always walking.', proximity: 0.15 },
      easyClue: 'He went uphill toward the grand hotel they call the Queen of the Sierra, where they keep a register the famous men have signed.',
      hardClue: 'Look to the diggings styled the Queen of the high country — the inn whose ledger bears the names of a humorist of the river and a general turned President.',
      trait: { label: 'GAIT', value: 'Robs on foot — never seen mounted, walks the steep grades where teams slow' },
      distractors: [
        { townId: 'sutter_creek', kind: 'cold', witness: { name: 'Eliza Trask', role: 'boardinghouse keeper' }, line: 'A drummer in a duster passed through, but he took the downhill creek road and never looked back. No verse, no sack — just a tired man.' },
        { townId: 'volcano', kind: 'near-miss', witness: { name: 'Otis Penhallow', role: 'livery hand' }, line: 'A hooded fellow walked in afoot at dusk — no horse, no saddle, mud to the knees. He tipped his hat and walked on south.', tease: { label: 'GAIT', value: 'On foot, no mount — and tired of it; "I\'ve labored long and hard for bread."' } },
      ],
    },
    {
      fromId: 'murphys',
      toId: 'mokelumne_hill',
      witness: { name: 'Perrin Caldwell', role: 'hotel clerk, Queen of the Sierra' },
      lead: { label: 'TWO DAYS AHEAD', flavor: 'He slept here one night, signed a false name in a fine clean hand, and was gone before the coach — two days now.', proximity: 0.45 },
      easyClue: 'He asked the road to the old county seat built of stone — the town that has burned to the ground three times over and rises again each time.',
      hardClue: 'He sought the stone-built seat of the county where the claims run but sixteen feet square and sink deep, the town the fire has taken thrice and could not keep.',
      trait: { label: 'GARB', value: 'Flour-sack hood cut with eye-holes and a long pale linen duster, road-worn gray' },
      distractors: [
        { townId: 'west_point', kind: 'cold', witness: { name: 'Marthe Quill', role: 'general store proprietor' }, line: 'No strangers in a duster up our way this week. The ridge road\'s been quiet but for muleteers and the mail rider.' },
        { townId: 'jackson', kind: 'near-miss', witness: { name: 'Cyrus Pell', role: 'stage agent' }, line: 'A traveler bought flour he never meant to bake — a whole sack, and a length of pale linen besides. Queer purchases for a man with no kitchen and no wife.', tease: { label: 'GARB', value: 'Buys flour by the sack and pale linen by the yard — the hood and the duster, made plain' } },
      ],
    },
    {
      fromId: 'mokelumne_hill',
      toId: 'jackson',
      witness: { name: 'Adelina Voss', role: 'keeper of the stone hotel' },
      lead: { label: 'A DAY AHEAD', flavor: 'He took bread and was gone by lamplight — scarcely a day ahead of you now, and quickening.', proximity: 0.7 },
      easyClue: 'He started for the camp with the deepest mines in all the gold country — the town that keeps a hanging tree in its main street.',
      hardClue: 'He turned toward the deepest shafts ever sunk in this earth, the camp whose oak in the road has borne a different sort of fruit for the lawless.',
      trait: { label: 'METHOD', value: 'Takes only the Wells Fargo strongbox and the mail — never robs the passengers' },
      distractors: [
        { townId: 'volcano', kind: 'cold', witness: { name: 'Hollis Burdick', role: 'apothecary' }, line: 'A man matching that came as far as the soda springs, drank, and turned back the way he came. Lost his nerve, or never had business here.' },
        { townId: 'sutter_creek', kind: 'near-miss', witness: { name: 'Ines Marlowe', role: 'stage passenger' }, line: 'We were stopped on the grade by a hooded man with an empty gun — he wanted the green box and the mail-sack, nothing more. He bid us keep our purses, polite as a parson.', tease: { label: 'METHOD', value: 'Empty shotgun leveled; demands only the strongbox and mail, refuses the passengers\' money' } },
      ],
    },
    {
      fromId: 'jackson',
      toId: 'san_andreas',
      witness: { name: 'Thaddeus Royce', role: 'deputy sheriff under the hanging tree' },
      lead: { label: 'HOURS AHEAD', flavor: 'A man dropped a handkerchief at the last holdup — Hume has the thread now. Your quarry is but hours ahead.', proximity: 0.95 },
      easyClue: 'Detective Hume traced a laundry mark on the dropped handkerchief; it leads to the town that won the courthouse — where a gentleman bandit will face a judge.',
      hardClue: 'The handkerchief bore a launderer\'s cipher; Harry Morse walked it back through the city wash-houses to a name. Go where the county set its courthouse, and where a soft-spoken road-agent must answer to the bench.',
      trait: { label: 'LAUNDRY MARK', value: 'A handkerchief left behind, marked F.X.O.7 — Hume and Morse trace it to one Charles Boles' },
      distractors: [
        { townId: 'west_point', kind: 'cold', witness: { name: 'Greta Soames', role: 'ridge-road tollkeeper' }, line: 'No one\'s come through my gate but the freighters. If your hooded man passed, he passed where no toll is kept.' },
        { townId: 'volcano', kind: 'near-miss', witness: { name: 'Phineas Crane', role: 'postmaster' }, line: 'Found verse tucked in the rifled mail-pouch, neat as type, signed "the Po8," bold as brass. The man cannot resist leaving his rhyme.', tease: { label: 'LAUNDRY MARK', value: 'Leaves signed verse — a vanity that, with a dropped marked handkerchief, will be his undoing' } },
      ],
    },
  ],
}

// Case 4 — Dick Fellows (George Brittain Lytle), the real klutzy-horseman robber.
const CASE_FELLOWS: CaseFile = {
  id: 'fellows',
  villain: {
    name: 'DICK FELLOWS — "THE TENDERFOOT ROAD-AGENT"',
    shortName: 'Dick Fellows',
    charge: 'Armed robbery of Wells Fargo treasure boxes, repeated jailbreak, and the theft of horses he could not ride',
    baseDescription:
      'A lawyer\'s son with the soft manner of a schoolmaster — courteous, bookish, forever quoting scripture — and the single worst horseman ever to take up the road-agent\'s trade. He robs with real nerve and is then promptly thrown, bucked, or dropped into a ditch by whatever animal he has stolen to flee on.',
    crimeShort: 'robbing Wells Fargo stages and stealing horses that threw him every time',
  },
  intro:
    'Wells Fargo\'s chief of detectives, James B. Hume, lays a thin file on the table and almost smiles. "George Brittain Lytle — calls himself Dick Fellows. Educated, polite, taught moral lessons to his own cellmates. Also the clumsiest bandit alive: bucked senseless BEFORE one robbery, broke his leg falling into a railway cut after another, and the last horse he stole pitched him in the dirt before he\'d gone a mile." Hume taps the page. "Here\'s our gift: the beast he rides now wears three horseshoes and ONE MULE SHOE. No other track in the diggings looks like it. Follow the mismatched hoofprint. Start at Sutter Creek — and walk, because he certainly can\'t ride."',
  startTownId: 'sutter_creek',
  startingDays: 6,
  marks: [
    { x: 34, y: 42 },
    { x: 44, y: 30 },
    { x: 66, y: 24 },
    { x: 58, y: 34 },
  ],
  chain: [
    {
      fromId: 'sutter_creek',
      toId: 'jackson',
      witness: { name: 'Ezra Pelton', role: 'Sutter Creek hoist-man' },
      lead: { label: 'THREE DAYS AHEAD', flavor: 'The trail is cold dust and patience.', proximity: 0.15 },
      easyClue: 'A mild fellow, polite as a parson, bought biscuits and limped off east toward the town with the very deepest shafts in the county — where they hang men from a tree by the spring.',
      hardClue: 'He spoke of going where the earth is gnawed lowest of all and a certain branch by the rising water has borne stranger fruit than acorns.',
      trait: { label: 'TRACK', value: 'One mule shoe among three horseshoes — a mismatched hoofprint' },
      distractors: [
        { townId: 'angels_camp', kind: 'cold', witness: { name: 'Lottie Grimes', role: 'boarding-house keeper' }, line: 'No quiet schoolmasters here, Inspector — only loud miners and a fellow they swear can outjump a frog.' },
        { townId: 'volcano', kind: 'near-miss', witness: { name: 'Father Quill', role: 'circuit preacher' }, line: 'A soft-spoken man did pass, quoting Proverbs at me — but he turned off before the bowl in the hills. Mind his horse, though: one foot rang wrong on the stone.', tease: { label: 'TRACK', value: 'One hoof rang wrong on the rock — a shoe that did not match' } },
      ],
    },
    {
      fromId: 'jackson',
      toId: 'volcano',
      witness: { name: 'Marshal Cobb', role: 'Jackson town marshal' },
      lead: { label: 'TWO DAYS AHEAD', flavor: 'The dust is fresher; he is tiring on foot.', proximity: 0.4 },
      easyClue: 'He was thrown again — landed badly and limps from a leg broke in a fall. He hobbled toward the town that sits in a great stone bowl and never once erupted, where they brag of seventeen hotels crammed into a teacup.',
      hardClue: 'Favoring one leg like a man who met the ground too hard, he made for the hollow that looks like a crater but has no fire in it — a cup so small it cannot hold all the inns men built in it.',
      trait: { label: 'GAIT', value: 'Limps badly — leg broken above the ankle in a fall' },
      distractors: [
        { townId: 'san_andreas', kind: 'cold', witness: { name: 'Clerk Hatch', role: 'county records clerk' }, line: 'Our excitement is courthouses and judges, Inspector, not limping strangers. No such man signed our register.' },
        { townId: 'west_point', kind: 'near-miss', witness: { name: 'Sallie Drew', role: 'stage-stop cook' }, line: 'A gentle, limping man took coffee and read me a psalm — then went the wrong way for you, north and high. But his nag walked lame in front; one shoe was no horseshoe at all.', tease: { label: 'TRACK', value: 'The front hoof wore something that was no horseshoe at all' } },
      ],
    },
    {
      fromId: 'volcano',
      toId: 'mokelumne_hill',
      witness: { name: 'Hattie Reed', role: 'Volcano hotel proprietress' },
      lead: { label: 'A DAY AHEAD', flavor: 'You can almost hear the bad horse complaining.', proximity: 0.7 },
      easyClue: 'He cannot keep a horse — he steals a fresh one and it throws him within the hour. On his newest stolen mount he made for the stone-built seat on the rise, the place that has burned to the ground three times over and been raised again.',
      hardClue: 'Having traded one beast for another that liked him no better, he rode for the proud chair of cut stone upon the height — a town that fire has eaten thrice and could not finish.',
      trait: { label: 'HABIT', value: 'Cannot keep a horse — steals fresh ones that promptly throw him' },
      distractors: [
        { townId: 'murphys', kind: 'cold', witness: { name: 'Dutch Speck', role: 'saloon keeper' }, line: 'Plenty of fine horses passed through, Inspector, all of them ridden well. Your stumbler never came this far south.' },
        { townId: 'sutter_creek', kind: 'near-miss', witness: { name: 'Ada Renn', role: 'stamp-mill clerk' }, line: 'He doubled back near us a moment — quoting Luke, of all things — then went on. The horse pitched him off twice in my own street. And its track, sir — three shoes of iron and one of a mule.', tease: { label: 'TRACK', value: 'Three horseshoes and one mule shoe in the dust of the street' } },
      ],
    },
    {
      fromId: 'mokelumne_hill',
      toId: 'san_andreas',
      witness: { name: 'Judge Ambrose Teale', role: 'Mokelumne Hill magistrate' },
      lead: { label: 'HOURS AHEAD', flavor: 'The mismatched track is still warm.', proximity: 0.95 },
      easyClue: 'Run him to ground now. Follow the one print no other horse leaves — three horseshoes and a single mule shoe — straight to the town that stole the courthouse away from us, where a gentleman bandit at last stands before a judge.',
      hardClue: 'The crooked track betrays him: three of iron and one of the long-eared kind. It leads to the seat of justice this hill lost — the place where a courteous road-agent must finally answer to the bench.',
      trait: { label: 'CONFIRMED TRACK', value: 'Three horseshoes and one mule shoe — no other hoof in the diggings marks the ground this way' },
      distractors: [
        { townId: 'volcano', kind: 'cold', witness: { name: 'Hattie Reed', role: 'Volcano hotel proprietress' }, line: 'He has gone from my bowl entirely, Inspector. Look to the courts, not the craters.' },
        { townId: 'jackson', kind: 'near-miss', witness: { name: 'Marshal Cobb', role: 'Jackson town marshal' }, line: 'A polite, limping stranger sheltered here an hour, blessing my deputies in scripture — then slipped off west toward the judge. Track him by his beast: three plain shoes and one off a mule.', tease: { label: 'MANNER', value: 'Soft-spoken schoolmaster who blesses lawmen in scripture' } },
      ],
    },
  ],
}

// Case 5 — Bill Gristy ("Bill White"), fleeing lieutenant of the Bell gang. The
// distinct mechanic is NETWORK infiltration (fences, safehouses, a flipped man).
const CASE_GRISTY: CaseFile = {
  id: 'gristy',
  villain: {
    name: 'BILL GRISTY — "BILL WHITE", OF THE BELL GANG',
    shortName: 'Gristy',
    charge: 'Highway robbery and complicity in the armed assault on the Camptonville–Marysville gold stage',
    baseDescription:
      'Lieutenant of the late Tom Bell\'s road agents. A planner, not a brawler — keeps to the gang\'s chain of safehouses, fences, and paid tipsters rather than riding alone. Travels under the alias "Bill White." Lean, hard-handed, and careful; the kind of man who lets the network do his hiding for him.',
    crimeShort: 'serving as a lieutenant of the Bell gang and running with its road agents',
  },
  intro:
    'Working out of the Wells Fargo office under detective James B. Hume, you take up the cold trail of the Bell gang\'s remnants. Tom Bell himself swings from a tree near Firebaugh\'s Ferry — but his lieutenant, Bill Gristy, who rode as "Bill White," slipped the net and went to ground in the southern diggings. The gang did not die with Bell; its fences and safehouse keepers still pass men quietly from camp to camp. (The summer\'s stage attempt cost the life of Mrs. Tilghman, a Marysville barber\'s wife — a death the network would sooner you forget.) Hume gives you six days and a fistful of informant names. Work the network, not the bystanders. Find Bill White.',
  startTownId: 'volcano',
  startingDays: 6,
  marks: [
    { x: 70, y: 64 },
    { x: 56, y: 70 },
    { x: 44, y: 30 },
    { x: 50, y: 52 },
  ],
  chain: [
    {
      fromId: 'volcano',
      toId: 'murphys',
      witness: { name: 'Otho Larkin', role: 'gang fence working the seventeen-hotel bowl town' },
      lead: { label: 'THREE DAYS AHEAD', flavor: 'A fence who once moved Bell\'s dust admits he sold "Bill White" a fresh horse three days back — pointed south and east.', proximity: 0.15 },
      easyClue: 'White paid in trail-worn dust and asked the road to the high camp they call the Queen of the Sierra — the rich quartz town up the grade.',
      hardClue: 'He muttered only that White was bound for the camp whose hotel register holds a humorist of the river and a general turned President — a place that fancies itself royalty of these mountains.',
      trait: { label: 'ALIAS', value: 'Travels and signs as "Bill White"' },
      distractors: [
        { townId: 'west_point', kind: 'cold', witness: { name: 'Reuben Doss', role: 'pack-trail muleteer' }, line: 'No road agents this far up the ridge, friend — only mules and miners. Nobody calling himself White passed my string.' },
        { townId: 'sutter_creek', kind: 'near-miss', witness: { name: 'Calla Voss', role: 'boarding-house keeper' }, line: 'A lean fellow took a room a week back and signed a false name — but he rode out before I could place him. He kept to himself like a man with a route already chosen.', tease: { label: 'ALIAS', value: 'Signed the register under a name that wasn\'t his' } },
      ],
    },
    {
      fromId: 'murphys',
      toId: 'angels_camp',
      witness: { name: 'Jack Phillips', role: 'safehouse keeper — the Mountaineer House man' },
      lead: { label: 'TWO DAYS AHEAD', flavor: 'The keeper of the gang\'s old safehouse has been leaned on hard and would rather talk than hang. White slept under his roof two nights past.', proximity: 0.4 },
      easyClue: 'White rode for the down-grade mining camp the writer Mark Twain made famous — the one known the world over for its jumping frogs.',
      hardClue: 'The keeper would say only that White went to the camp the Eastern scribbler put in every paper — the diggings remembered for a wager over a leaping frog.',
      trait: { label: 'NETWORK', value: 'Moves only between known gang safehouses and fences — never sleeps in the open' },
      distractors: [
        { townId: 'mokelumne_hill', kind: 'cold', witness: { name: 'Henri Caillou', role: 'French Hill assayer' }, line: 'We have feuds enough on this hill without your road agents. No man of that description weighed in here.' },
        { townId: 'jackson', kind: 'near-miss', witness: { name: 'Tibbet Sloane', role: 'tavern tipster' }, line: 'A close-mouthed rider drank here and asked which safehouses still stood. He didn\'t stay — said his next bed was already spoken for, further down the road.', tease: { label: 'NETWORK', value: 'Was asking which gang safehouses were still safe to use' } },
      ],
    },
    {
      fromId: 'angels_camp',
      toId: 'jackson',
      witness: { name: 'Dell Marrow', role: 'tavern tipster paid by the gang' },
      lead: { label: 'A DAY AHEAD', flavor: 'A tipster who runs messages for the network — for coin — sells you a detail he swears no one else knows: a mark on the man himself.', proximity: 0.7 },
      easyClue: 'White made for the camp of the deepest mines on the Mother Lode — the one with the old hanging tree in its main street.',
      hardClue: 'The tipster grinned: White made for the town that buries its shafts deepest and its men quickest — where a single oak has done the county\'s grim work.',
      trait: { label: 'TELL', value: 'A pale knife scar across the left jaw, half-hidden under several days\' beard' },
      distractors: [
        { townId: 'sutter_creek', kind: 'cold', witness: { name: 'Marta Quinn', role: 'stamp-mill cook' }, line: 'Plenty of beards come through for the mill work. None with a scar like that, and none in any hurry.' },
        { townId: 'san_andreas', kind: 'near-miss', witness: { name: 'Eli Trent', role: 'livery hand' }, line: 'Scar-jawed fellow watered his horse here, jumpy as a cat, then doubled back north. Said the town that "took the courthouse" wasn\'t safe for him yet.', tease: { label: 'TELL', value: 'A scar along the left jaw — and he flinched whenever a lawman walked past' } },
      ],
    },
    {
      fromId: 'jackson',
      toId: 'san_andreas',
      witness: { name: 'Yancy Gade', role: 'captured accomplice — flipped under the noose' },
      lead: { label: 'HOURS AHEAD', flavor: 'A gang accomplice, taken at last, breaks the way Gristy himself once broke — and gives up the final hideout to save his own neck.', proximity: 0.95 },
      easyClue: 'White is holed up in the county-seat town that wrested the courthouse from its rivals — go straight there and take him.',
      hardClue: 'The accomplice gasped it out: White waits in the town that stole the seat of the county — the place that pried the courthouse loose and never gave it back.',
      trait: { label: 'ACCOMPLICE NAMES HIM', value: 'A flipped gang man, facing the rope, has named the exact hideout and sworn it is Bill White' },
      distractors: [
        { townId: 'mokelumne_hill', kind: 'cold', witness: { name: 'Oren Pell', role: 'hill saloonkeeper' }, line: 'We lost the county seat, didn\'t we — so why would a hunted man come here? Nobody of that name, scarred or no.' },
        { townId: 'angels_camp', kind: 'near-miss', witness: { name: 'Bess Lanier', role: 'frog-town storekeep' }, line: 'A scarred man bought powder and hardtack at dawn and lit out west — said the county-seat town was where his people would shelter him. You only just missed him.', tease: { label: 'ACCOMPLICE NAMES HIM', value: 'Matched the flipped man\'s description exactly — scar, lean build, the "White" alias' } },
      ],
    },
  ],
}

/**
 * The case roster. retry() rotates to the next uncaught case. All quarries are
 * real Gold Country history (Vane is the lone fiction, a period-true claim-salter)
 * worked under the real Wells Fargo detective J. B. Hume (see HUME_FRAME).
 */
export const CASES: CaseFile[] = [CASE_VANE, CASE_BARTER, CASE_BELL, CASE_BART, CASE_FELLOWS, CASE_GRISTY]

/** Hume framing shown on every case (the real chief detective who unifies the hunt). */
export const HUME_FRAME = 'WELLS FARGO · Office of J. B. Hume, Chief Special Officer'
