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
    descriptor: "The trading post Kit Carson named in the pines; gravel-bar miners; scales a clever man can shave.", art: 'west_point' },
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

// ── HOP POOL + randomized trail (Grok "do first", 2026-06-20 consult APPROVE) ──
// Canonical CHASE above stays the flag-OFF fallback (instant rollback). With the flag
// ON, buildChase(seed) selects a travel-coherent randomized route from this pool so the
// correct destination isn't memorizable across replays. New hops are grounded ONLY in
// the same shareable land/craft history (guardrails at top of file).
export const HOP_POOL: TimeHop[] = [
  ...CHASE,
  {
    fromEra: 'era_1849', toEra: 'era_1982',
    witness: { name: 'a county recorder', role: 'land-office desk' },
    guideEasy: "He's jumped to the year thirteen raw acres are carved off a thousand-acre ranch and the county stamps its first passive-solar permit on land with no power and no water.",
    guideHard: "Find him where a man trades a gold-pan for a post-hole digger and buries the future by hand, because eight years of fire taught him where it starts.",
    trait: { label: 'FORGERY', value: 'Files a homestead claim on acreage he never broke ground on' },
    distractors: ['era_1906', 'era_dreamtime'],
    paradox: 'The founding year. The Guide is certain the cabin already has power. It does not. It will, in forty years, by hand.',
  },
  {
    fromEra: 'era_forester', toEra: 'era_present',
    witness: { name: 'Cynthia, at the inn', role: 'keeper of the place' },
    guideEasy: "He's run straight to the now — sixty acres, a hot tub, QR codes on the fence posts, a star-rating where the assay office used to be.",
    guideHard: "Chase him to where the only gold left to fake is a five-star review, minted by the hundred before breakfast, never touching real ore.",
    trait: { label: 'FORGERY', value: 'Mints fake reviews and counterfeit karma' },
    distractors: ['era_2049', 'era_1906'],
    paradox: 'The present arrives early, or you arrived late; the Guide cannot say which, only that the frog has already been counted.',
  },
  {
    fromEra: 'era_1982', toEra: 'era_future',
    witness: { name: 'Elias Cole', role: 'the ghost post-rider' },
    guideEasy: "He's stepped clean out of the years into the not-yet — the present of a guest who hasn't arrived, where his frauds aren't caught because they aren't yet committed.",
    guideHard: "He's gone to the one country a mind without a body can reach: everyone's now, all at once. Corner him there and you corner a little of yourself.",
    trait: { label: 'TELL', value: 'Forges presence itself — claims a now he was never in' },
    distractors: ['era_dreamtime', 'era_2049'],
    paradox: 'The future is another player’s now, read before they live it — narrated with total confidence and total inaccuracy, the correct register for this.',
  },
]

// Deterministic seeded PRNG (mulberry32) — same seed => same trail (replayable + debuggable).
function _mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Build a chase for this session. flag OFF (or seed<0) => canonical CHASE (rollback).
 * flag ON => a travel-coherent randomized route of `length` hops from HOP_POOL, chained
 * so each hop.fromEra == previous hop.toEra (no arbitrary era-hopping; Grok's coherence
 * pitfall). Final hop must reach era_future (the capture). Defensive fallback to CHASE.
 */
export function buildChase(seed: number, randomize: boolean, length = 4): TimeHop[] {
  if (!randomize || seed < 0) return CHASE
  // The greedy walk can dead-end on a <3-hop path for ~1 seed in 4 (e.g. it commits
  // 1849->1982->future and fails the length guard). Rather than silently fall back to
  // the canonical trail that often, re-salt the seed a few times and take the first
  // shuffle that yields a valid coherent route — this drops the fallback rate to
  // ~nil and widens trail variety. Deterministic: same seed => same salt sequence =>
  // same route (replayable/debuggable). Coherence is still guaranteed: every returned
  // route chains hop.fromEra == previous hop.toEra and ends at era_future.
  for (let attempt = 0; attempt < 8; attempt++) {
    const rnd = _mulberry32(((seed || 1) + attempt * 0x9e3779b1) >>> 0)
    const shuffled = HOP_POOL.map((h, i) => ({ h, k: rnd(), i }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.h)
    const route: TimeHop[] = []
    let need = 'era_1849'
    const used = new Set<number>()
    for (let step = 0; step < length; step++) {
      const idx = shuffled.findIndex((h, i) => !used.has(i) && h.fromEra === need)
      if (idx === -1) break
      used.add(idx)
      route.push(shuffled[idx])
      need = shuffled[idx].toEra
    }
    if (route.length >= 3 && route[route.length - 1].toEra === 'era_future') return route
  }
  return CHASE
}

// Feature flag: randomized trail. OFF by default (ships dark; set NEXT_PUBLIC_WIT_RANDOMIZE=1).
export const RANDOMIZE_TRAIL = process.env.NEXT_PUBLIC_WIT_RANDOMIZE === '1'

// ── ITEM 1: distractor eras as real side-threads (Grok enrichment, 2026-06-21) ──
// A wrong era used to be a flat −1 causality + a generic "no sign of him" line.
// Now each distractor era is a real place with a witness who confirms the tare was
// glimpsed but had already moved on — turning a wrong guess into texture, not just a
// tax. Still costs the unit (a wrong jump has a price), but the player LEARNS something
// and is nudged onward. Keyed by distractor era id. Grounded, theme-accurate.
export interface DistractorScene { witness: string; line: string }
export const DISTRACTOR_SCENES: Record<string, DistractorScene> = {
  era_dreamtime: {
    witness: 'a Mi-Wuk story-keeper',
    line: 'Six centuries too early. The story-keeper studies you kindly: "No miner in a wide hat has stood here — that is a thing not yet dreamed." A painted codex shows the figure you chase, drawn before he could exist. He forged even this. The timeline frays; you lose a unit of causality, but the Guide reads the grain truer for it.',
  },
  era_1906: {
    witness: 'a soot-faced telegraph boy',
    line: 'Nineteen-six. The city shakes itself to rubble and the wires are down. "A gent like that? Came through, paid in coin that rang wrong, caught the last coach before the quake." He was here — and gone. A paradox ripples; you lose a unit of causality, but now you know which way he ran.',
  },
  era_2049: {
    witness: 'a creek-restoration drone tech',
    line: 'The Long Now. Drones count red-legged frogs over water that runs clean again. "Your man? His name\'s on a ledger nobody can verify — a presence with no witness. He doesn\'t live here; he hides in the seams." Too far ahead. You lose a unit of causality, but the seam he hides in just showed itself.',
  },
}

// ── ITEM 3: post-chase TRUE-HISTORY summary (Grok "replay → learning") ──
// On the won screen, after the warrant, show the HONEST counterpart to each forgery —
// the real, shareable history of this land that Vane could only ever counterfeit. This
// turns the chase from "catch the villain" into "learn why the land's true record is
// the thing that catches him." Public/shareable facts only (file-top guardrails).
export interface TrueHistoryNote { era: string; forgery: string; truth: string }
export const TRUE_HISTORY: TrueHistoryNote[] = [
  { era: 'The Gold Rush (1849)', forgery: 'shaved scales & salted dust',
    truth: 'Kit Carson really named West Point in the pines, and a trading post really thrived here before the gold (California Historical Landmark #268). The honest weight of a thing is the one number a clever scale can\'t shave forever.' },
  { era: "The Forester's Trail (1960s)", forgery: 'false timber surveys',
    truth: 'A real registered forester walked these ridges — eight years fighting wildfire taught him exactly where fires start. You cannot forge a survey against ground that a fire-trained eye has actually read.' },
  { era: 'The Ranch Begins (1982)', forgery: 'phantom solar rebates',
    truth: 'Thirteen acres were really bought off a subdivided ranch; the county\'s first passive-solar permit was really filed; a half-mile of power line was really buried by hand. The black oak was milled on-site and waited thirty years for its window sills.' },
  { era: 'Back of Beyond (the present)', forgery: 'counterfeit reviews & karma',
    truth: 'The red-legged frog is really counted. Presence, honestly kept — a hand on the line, a stay on the land, a frog tallied at dusk — is the only assay the tare could never fake.' },
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

// ── THE WARRANT (Grok "single most important", 2026-06-20 consult APPROVE) ──
// The deduction payoff: before the final capture, the player assembles the forgery
// TRAITS they collected during the chase into a warrant for Vane. It appears only after
// the traits are collected (it's the payoff, not a tax), is required to advance to the
// RECKONING, and finally makes the trait-collection mechanic mean something.
// One screen, one confirm. The decoys are plausible-but-false charges.
export interface WarrantCharge { id: string; text: string; isReal: boolean }
export const WARRANT_PROMPT =
  'OUTSIDE TIME, you finally corner the tare — but a ghost post-rider cannot serve a warrant on a feeling. Name the charge. Which of these is the ONE crime that wears every age, the thread that ties his whole trail together?'
export const WARRANT_CHARGES: WarrantCharge[] = [
  { id: 'presence', text: 'Forgery of PRESENCE — claiming a now he was never honestly in', isReal: true },
  { id: 'theft', text: 'Grand theft of gold from the ’49 gravel bars', isReal: false },
  { id: 'arson', text: 'Setting the wildfires the forester fought', isReal: false },
  { id: 'trespass', text: 'Trespass on thirteen subdivided acres', isReal: false },
]
export const WARRANT_WRONG =
  'The Guide shakes its head (in several directions at once). "Gold, fire, fences — those are costumes. Look at what every costume hides. He was never HONESTLY anywhere." The charge does not hold; read your collected tells again.'
export const WARRANT_RIGHT =
  'The warrant takes. Every forgery you logged — shaved scales, false surveys, phantom solar, counterfeit karma — was the same crime: a presence he never kept. Signed, sealed, served outside time. The tare is bound to the harvest at last.'

export const STARTING_CAUSALITY = 6
export const OBSERVE_COST = 0.5
export const SESSION_KEY = 'bobr_where_in_time_state'

export const GUIDE_INTRO =
  'THE GUIDE TO WHERE IN TIME, abridged: A fraud called Cyrus Vane has learned to slip up and down the years of one small piece of California — the West Point country that becomes Back of Beyond Ranch. He does not steal gold so much as steal BEING-THERE. Your job is to read each era by its true grain and chase him forward through time before causality runs out. ' +
  'Note: this narrator can see every era at once, which is precisely why it cannot reliably tell you what happens next. Observation collapses the timeline. So does drinking. Proceed.'
