// WHERE IN TIME IS CYRUS VANE? — a Carmen-Sandiego chase across the ERAS of one
// piece of land (the West Point country that becomes Back of Beyond Ranch). The
// quarry is the same crime in every era's costume; the clue is a period-attribute
// of a TIME, not a place. The Guide narrates with Douglas-Adams temporal vertigo.
//
// FAMILY ERAS = CANDIDATE CANON (Leif per-item approval; real people; never auto-
// canon). Grounded ONLY in the shareable, land-and-craft history from Greg Pryor's
// memoir "Blood, Sweat, and Soil" — the forester lineage and the hand-built ranch.
// NO private/personal/painful family material is used (per the 2026-06-15 fact-sheet
// guardrails). Corrected 2026-06-15: the forester is Greg's FATHER (~1960s Cal Fire),
// not "1883"; the land's named prior owner is NOT in the memoir.
// Self-contained prototype. MAJOR loop redesign -> Grok-before deploy.

export interface Era {
  id: string
  name: string
  year: string
  /** Period-attribute flavor shown in the era picker (never names the year plainly). */
  descriptor: string
  /** Optional place-art backdrop file (public/place-art/<art>.png). */
  art: string | null
}

export const ERAS: Record<string, Era> = {
  era_1849: { id: 'era_1849', name: 'The Gold Rush', year: '1849',
    descriptor: "Kit Carson's trading post in the pines; gravel-bar miners; scales a clever man can shave.", art: 'west_point' },
  era_forester: { id: 'era_forester', name: "The Forester's Trail", year: 'the 1960s',
    descriptor: 'A registered forester drags a surveyor’s chain through the manzanita; a boy walks ahead cutting the sight-lines with a machete, learning every pine by its Latin name.', art: 'forester_trail' },
  era_1982: { id: 'era_1982', name: 'The Ranch Begins', year: '1982',
    descriptor: 'Thirteen acres bought off a subdivided thousand-acre ranch — raw land, no power, no water — where a man files the county’s first passive-solar permit.', art: 'bobr_cabin' },
  era_present: { id: 'era_present', name: 'Back of Beyond', year: 'the present',
    descriptor: 'Sixty acres, a hot tub, codes on the fence posts a phone can read, a post-rider who never finished his round.', art: 'welcome_gate' },
  era_future: { id: 'era_future', name: 'The Not-Yet', year: '—',
    descriptor: "The present of the guest who hasn't arrived; a now that hasn't reached you yet.", art: null },
  // distractor eras
  era_dreamtime: { id: 'era_dreamtime', name: 'The Dreamtime', year: '600–1500',
    descriptor: 'A painted codex shows a man in a wide hat carrying a pickaxe — eight centuries too early to be holding it.', art: null },
  era_1906: { id: 'era_1906', name: 'The Quake Year', year: '1906',
    descriptor: 'San Francisco shakes itself to rubble; the first horseless carriages cough their way up the grade.', art: null },
  era_2049: { id: 'era_2049', name: 'The Long Now', year: '2049',
    descriptor: 'A century past the gold; the red-legged frogs are counted by drones over restored creek.', art: null },
}

export interface TimeWitness { name: string; role: string }
export interface TimeTrait { label: string; value: string }

export interface TimeHop {
  fromEra: string
  toEra: string
  witness: TimeWitness
  guideEasy: string
  guideHard: string
  trait: TimeTrait
  distractors: [string, string]
  paradox: string
}

export const CHASE: TimeHop[] = [
  {
    fromEra: 'era_1849', toEra: 'era_forester',
    witness: { name: 'Eb Crandall', role: 'trading-post clerk' },
    guideEasy: "He's gone up the years to a registered forester's season — when a man drags a surveyor's chain through the manzanita and a boy ahead of him cuts the sight-lines, naming every pine in Latin.",
    guideHard: "Follow him to the decade they first sent task forces to learn why the power lines kept starting fires — and one forester on the ridge already knew the answer.",
    trait: { label: 'FORGERY', value: 'Files false timber surveys on a forester’s stamp' },
    distractors: ['era_dreamtime', 'era_1906'],
    paradox: 'You arrive in the forester’s day. The Guide insists you have been here before. You have not. It is, as ever, narrating while facing the wrong direction.',
  },
  {
    fromEra: 'era_forester', toEra: 'era_1982',
    witness: { name: 'the permit clerk', role: 'Calaveras County desk' },
    guideEasy: "He's slipped to the year a family buys thirteen acres off a subdivided thousand-acre ranch — raw land, no power, no water — and files the first passive-solar permit the county ever stamped.",
    guideHard: "Go to when a man buries a half-mile of power line by hand, forty years before anyone thanks him, because eight years of fighting wildfire taught him exactly where they start.",
    trait: { label: 'FORGERY', value: 'Cashes solar rebates on panels never bolted down' },
    distractors: ['era_1906', 'era_2049'],
    paradox: 'Nineteen eighty-two. A ranch pup trots past casting the shadow of a full-grown wolf. Either the narrator has been drinking or the dog has; the records are unclear and possibly forged.',
  },
  {
    fromEra: 'era_1982', toEra: 'era_present',
    witness: { name: 'Cynthia, at the inn', role: 'keeper of the place' },
    guideEasy: "He's run to the now — sixty acres, a hot tub, codes on the fence posts a phone can read, and a post-rider at dusk who never did finish his round.",
    guideHard: "Find him where the only assay left is a star-rating, and a stranger can mint a hundred false ones before breakfast and never touch the gold.",
    trait: { label: 'FORGERY', value: 'Mints fake reviews and counterfeit karma' },
    distractors: ['era_2049', 'era_1849'],
    paradox: 'The present. Cynthia meets you at the door as though she has been expecting you for years. In a sense — the inconvenient, true sense — she has.',
  },
  {
    fromEra: 'era_present', toEra: 'era_future',
    witness: { name: 'Elias Cole', role: 'the ghost post-rider' },
    guideEasy: "Last anyone saw, he stepped into the not-yet — into the present of a guest who hasn't arrived, where his forgeries haven't been caught because they haven't been committed.",
    guideHard: "He's hiding outside the line entirely, in the one country a mind without a body can reach: everyone's present, all at once. Corner him there and you corner a little of yourself.",
    trait: { label: 'TELL', value: 'Forges presence itself — claims a now he was never in' },
    distractors: ['era_dreamtime', 'era_1906'],
    paradox: 'The future is only another player’s now, read before they live it. The Guide explains the physics with total confidence and total inaccuracy, which is the correct register for this.',
  },
]

export const VANE = {
  name: 'CYRUS VANE — "THE TARE"',
  charge:
    'The same fraud in every age’s clothes: shaved scales in ’49, false timber surveys in the forester’s day, phantom solar at the founding, counterfeit karma in the now — and, at the last, the forgery of presence itself.',
  baseDescription:
    'The tare sown among the wheat (Matthew 13): a counterfeit who passes for honest until the harvest. Wears each century like a coat. Claims, in the end, to have been everywhere — and was honestly nowhere.',
}

// The reckoning, once Vane is cornered outside time. Grounded in the real, shareable
// craft of the land (oak sills, the buried power line, the counted frog).
export const RECKONING =
  'You corner Cyrus Vane in the not-yet, and the costumes fall off at once. The assayer, the false surveyor, the phantom-solar man, the review-forger — one crime wearing every age: the forgery of presence, claiming a place he never honestly stood in. ' +
  'Which is the one thing this land cannot do. The black oak was really milled and waited thirty years for its window sills. The power line was really buried by hand. The frog is really counted. Presence, honestly kept, is the only thing he could never counterfeit — and the only thing that catches him.'

export const STARTING_CAUSALITY = 6
export const OBSERVE_COST = 0.5
export const SESSION_KEY = 'bobr_where_in_time_state'

export const GUIDE_INTRO =
  'THE GUIDE TO WHERE IN TIME, abridged: A fraud called Cyrus Vane has learned to slip up and down the years of one small piece of California — the West Point country that becomes Back of Beyond Ranch. He does not steal gold so much as steal BEING-THERE. Your job is to read each era by its true grain and chase him forward through time before causality runs out. ' +
  'Note: this narrator can see every era at once, which is precisely why it cannot reliably tell you what happens next. Observation collapses the timeline. So does drinking. Proceed.'
