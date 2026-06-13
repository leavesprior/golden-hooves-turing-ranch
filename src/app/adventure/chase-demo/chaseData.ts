// THE CHASE: where did Vane go? — Carmen-Sandiego-style deduction prototype.
// Self-contained PROOF — NOT wired into the live game. New files only.
// This data file encodes the 4-rule clue grammar from
// docs/ADVENTURE_CLUE_REDESIGN_CARMEN_SANDIEGO.md §2 as a playable chain.
//
// Rule 1: clues point at an ATTRIBUTE of the NEXT town, never its name.
// Rule 2: clues come from named, diegetic witnesses.
// Rule 3: difficulty = obscurity (easy vs hard phrasing of the same target).
// Rule 4: a wrong pick costs a day; the redirect uses the EASIER phrasing.
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

export interface ClueHop {
  /** Town the player is currently standing in when this clue is given. */
  fromId: string
  /** Town the clue points at — the correct next pick (Rule 1). */
  toId: string
  witness: Witness
  /** Shown first; the EASIER obscurity (Rule 3). */
  easyClue: string
  /** The harder, period-accurate phrasing (offered as "press harder"). */
  hardClue: string
  /** Witness at the WRONG town who redirects you, using easy phrasing (Rule 4). */
  redirect: { witness: Witness; line: string }
  /** Trait revealed on the Wanted Poster when this hop is completed correctly. */
  trait: WantedTrait
  /** The two distractor town ids for this hop's 3-candidate picker. */
  distractors: [string, string]
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

// Towns drawn on the map (the 5 chain towns + distractors used in the chain).
export const MAP_TOWN_IDS = [
  'west_point', 'mokelumne_hill', 'jackson', 'san_andreas', 'angels_camp',
  'volcano', 'murphys', 'sutter_creek',
]

// ---------------------------------------------------------------------------
// THE CHASE CHAIN — 4 hops. Each clue points at the NEXT town's attribute.
// ---------------------------------------------------------------------------

export const CHASE: ClueHop[] = [
  // HOP 1: West Point -> Mokelumne Hill
  {
    fromId: 'west_point',
    toId: 'mokelumne_hill',
    witness: { name: 'Eb Crandall', role: 'trading-post clerk' },
    easyClue:
      "Vane's bound for the town where the Frenchmen lost their hill — they call it a war, though it was over a claim.",
    hardClue:
      "Follow him to where a claim was only sixteen feet square and still made men rich — a county seat built of stone because it burned to the ground three times over.",
    redirect: {
      witness: { name: 'Pegleg Su', role: 'ferryman' },
      line:
        "Wrong fork, friend. The polite fellow asked the road to the hill the Frenchmen fought over — the stone town that lost its courthouse to a hotel. Go there.",
    },
    trait: { label: 'GAIT', value: 'On foot — keeps wide of every horse' },
    distractors: ['volcano', 'sutter_creek'],
  },
  // HOP 2: Mokelumne Hill -> Jackson
  {
    fromId: 'mokelumne_hill',
    toId: 'jackson',
    witness: { name: 'Mireille Dax', role: 'hotel keeper' },
    easyClue:
      "He's making for the town that grew up around a spring — named, they say, for a pile of bottles left behind there.",
    hardClue:
      "He heads where one oak on Main Street hanged ten men, and the deepest shaft on the whole continent still drops into the dark.",
    redirect: {
      witness: { name: 'Father Ortiz', role: 'mission priest' },
      line:
        "No, the gentleman went down to the spring-town — the one named for the heap of empty bottles, Botilleas. That's your road.",
    },
    trait: { label: 'MANNER', value: 'A gentleman — tips his hat, never curses' },
    distractors: ['volcano', 'murphys'],
  },
  // HOP 3: Jackson -> San Andreas
  {
    fromId: 'jackson',
    toId: 'san_andreas',
    witness: { name: 'Lottie Veil', role: 'stage-line agent' },
    easyClue:
      "Vane took the road to the old Mexican camp named for a saint — the one that lived under canvas tents for years before it had a wall.",
    hardClue:
      "He's gone to the camp that stole the courthouse away from the stone hill-town — where a gentleman bandit once stood and faced a judge.",
    redirect: {
      witness: { name: 'Deputy Hollis', role: 'jailer' },
      line:
        "You overshot. The polite road-agent went to the saint's camp — the tent-town that took the county seat. Head there.",
    },
    trait: { label: 'ALIAS', value: 'Travels as "Mr. Vane, surveyor"' },
    distractors: ['murphys', 'sutter_creek'],
  },
  // HOP 4: San Andreas -> Angels Camp (FINAL)
  {
    fromId: 'san_andreas',
    toId: 'angels_camp',
    witness: { name: 'Judge Pell', role: 'circuit clerk' },
    easyClue:
      "Last anyone saw, he was bound for the town a jumping frog made famous — a writer put it in a story and the name never left.",
    hardClue:
      "He's run to the quartz town the storekeeper brothers built — not saints despite the name — where a man once struck gold with the ramrod of his gun.",
    redirect: {
      witness: { name: 'Belle Hart', role: 'saloon owner' },
      line:
        "Wrong way. He went to the frog's town — named for the storekeeper brothers, Angel by name, not by halo. That's where he's gone to ground.",
    },
    trait: { label: 'TELL', value: 'Reads aloud from a dime novel while he walks' },
    distractors: ['murphys', 'volcano'],
  },
]

// Vane's standing description for the top of the Wanted Poster (traits below
// fill in as the chase advances).
export const VANE = {
  name: 'THE ROAD AGENT "VANE"',
  charge: 'Robbery of the Sonora stage — no shots fired, all hats returned',
  baseDescription:
    'A soft-spoken gentleman of the road. Polite to a fault. Afraid of horses, so he works on foot. Wanted across four counties.',
}

export const STARTING_DAYS = 6
export const SESSION_KEY = 'bobr_chase_demo_state'
