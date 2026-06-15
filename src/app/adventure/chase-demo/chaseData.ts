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
