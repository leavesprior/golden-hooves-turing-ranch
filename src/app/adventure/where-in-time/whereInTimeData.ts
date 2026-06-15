// WHERE IN TIME IS CYRUS VANE? — a Carmen-Sandiego chase across TIME, on the one
// piece of land (West Point -> Back of Beyond Ranch) through its eras. The quarry
// is the same crime in every era's costume; the clue is a period-attribute of a
// TIME, not a place. The Guide narrates with Douglas-Adams temporal vertigo.
// Self-contained prototype (see docs/WHERE_IN_TIME_DESIGN_20260615.md). NEW route,
// own state, never touches the live save. MAJOR loop redesign -> Grok-before deploy.

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
  era_1883: { id: 'era_1883', name: "The Forester's Age", year: '1883',
    descriptor: 'A new forester walks the ridges; black oak is milled on the land for sills that will wait thirty years to be set.', art: 'sandy_gulch' },
  era_1982: { id: 'era_1982', name: 'The Ranch Begins', year: '1982',
    descriptor: 'Thirteen acres bought off a subdivided thousand-acre ranch; the first passive-solar permit the county ever stamped.', art: 'bobr_cabin' },
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
  /** A time-local who watched Vane step out of this era. */
  witness: TimeWitness
  /** Free clue — points at a period-attribute of the next era, never its year. */
  guideEasy: string
  /** The harder, sharper read — "observing collapses the timeline," costs causality. */
  guideHard: string
  /** What Vane forged in the next era — fills the Wanted Poster as you close in. */
  trait: TimeTrait
  /** Two wrong-time candidates for the 3-era picker. */
  distractors: [string, string]
  /** The Guide's Adams-style temporal-vertigo line on correct arrival. */
  paradox: string
}

export const CHASE: TimeHop[] = [
  {
    fromEra: 'era_1849', toEra: 'era_1883',
    witness: { name: 'Eb Crandall', role: 'trading-post clerk' },
    guideEasy: "He's gone up the years to when a new forester first walks these ridges — a man who'll fell oak and mill it on the land, then stack the boards to dry thirty years before he sets them as window sills.",
    guideHard: "Follow him to the season they undergrounded nothing yet, when the only fire line on the whole mountain was the one a forester cut by hand.",
    trait: { label: 'FORGERY', value: 'Files a timber claim on oak that isn’t cut yet' },
    distractors: ['era_dreamtime', 'era_1906'],
    paradox: 'You arrive in 1883. The Guide insists you have been here before. You have not. The Guide is, as ever, narrating while facing the wrong direction.',
  },
  {
    fromEra: 'era_1883', toEra: 'era_1982',
    witness: { name: 'a forester on the ridge', role: 'timber cruiser' },
    guideEasy: "He's slipped to the year a family buys thirteen acres off a thousand-acre ranch, raw land with no power and no water, and the county stamps its first passive-solar permit.",
    guideHard: "Go to when they bury half a mile of power line by hand, because a man foresaw the wildfire forty years too early to be thanked for it.",
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
    'The same fraud in every age’s clothes: shaved scales in ’49, salted timber in ’83, phantom solar in ’82, counterfeit karma in the now — and, at the last, the forgery of presence itself.',
  baseDescription:
    'The tare sown among the wheat (Matthew 13): a counterfeit who passes for honest until the harvest. Wears each century like a coat. Afraid of horses, then of automobiles, then of nothing at all — because by the end he claims to have been everywhere and was nowhere.',
}

// The reckoning, once Vane is cornered outside time.
export const RECKONING =
  'You corner Cyrus Vane in the not-yet, and the costumes fall off at once. The assayer, the speculator, the rebate-man, the review-forger — one crime wearing five centuries: the forgery of presence, claiming a place he never honestly stood in. ' +
  'Which is the one thing the land itself cannot do. The oak was really milled. The power line was really buried by hand. The frog is really counted. Presence, honestly kept, is the only thing he could never counterfeit — and the only thing that catches him.'

export const STARTING_CAUSALITY = 6
export const OBSERVE_COST = 0.5
export const SESSION_KEY = 'bobr_where_in_time_state'

// The Guide's opening — Hitchhiker's-Guide register, fourth-wall, a little drunk on time.
export const GUIDE_INTRO =
  'THE GUIDE TO WHERE IN TIME, abridged: A fraud called Cyrus Vane has learned to slip up and down the years of one small piece of California — the West Point country that becomes Back of Beyond Ranch. He does not steal gold so much as steal BEING-THERE. Your job is to read each era by its true grain and chase him forward through time before causality runs out. ' +
  'Note: this narrator can see every era at once, which is precisely why it cannot reliably tell you what happens next. Observation collapses the timeline. So does drinking. Proceed.'
