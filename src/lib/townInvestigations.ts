// ============================================================================
// TOWN INVESTIGATIONS (2026-06-17) — towns elevated to "Where in Time" depth.
//
// The owner's north star: every town should play like /adventure/where-in-time
// (#2 on the hub) — real pictures, researched story, an investigation loop — but
// SPATIAL (examine the real places WITHIN one town) instead of temporal (hop
// across eras). Same DNA as Where in Time: a witness-narrated dual clue (a free
// read + a harder read that costs you), evidence that builds a case file, a
// tension resource that drains on wrong moves, and a grounded VERDICT that pays
// the real, cited history back to the player.
//
// Keyed by CANONICAL TOWN ID (src/lib/townRegistry.ts) so the unified map's
// local view can open the matching investigation.
//
// GOVERNANCE: guest-facing content. Built on the dev branch; PRODUCTION deploy
// is Grok-before (friendship bundle) per the Where-in-Time depth gate. Uses ONLY
// well-sourced PUBLIC West Point history (CHL #268, Sandy Gulch, the documented
// sawmills) — NO private Pryor family material (that is per-item Leif-gated and
// lives in the family-era content, not here). The villain is the existing
// Cyrus Vane "the Tare," tying town investigations to the chase + Where in Time.
// ============================================================================

export interface CaseWitness {
  name: string
  /** Period role, grounds the clue in the town's real life. */
  role: string
}

export interface CaseEvidence {
  label: string
  value: string
}

export interface InvestigationScene {
  id: string
  /** The real place within the town. */
  place: string
  /** PlaceBackdrop art key (public/place-art/<art>.png), or null. */
  art: string | null
  witness: CaseWitness
  /** The question posed at this place. */
  prompt: string
  /** Free read. */
  clueEasy: string
  /** Sharper read — costs you (press the witness harder). */
  clueHard: string
  /** Collected into the case file when the player reads the place right. */
  evidence: CaseEvidence
  /** Correct choice id. */
  answer: string
  /** Choices shown (includes the answer + grounded distractors). */
  choices: { id: string; label: string }[]
  /** Shown after a correct read. */
  feedback: string
  /** Shown after a wrong read (the trail cools). */
  wrongHint: string
}

export interface TownInvestigation {
  /** Canonical registry town id. */
  townId: string
  title: string
  /** The quarry (ties to the chase / Where in Time). */
  villain: string
  /** Opening narration. */
  setup: string
  scenes: InvestigationScene[]
  /** Grounded synthesis once solved. */
  verdict: string
  /** Real, cited history — shown as "THE REAL HISTORY" on the solve screen. */
  sources: string[]
}

export const START_LEADS = 6
export const PRESS_COST = 0.5
export const SESSION_KEY_PREFIX = 'bobr_town_investigation_'

// ---------------------------------------------------------------------------
// WEST POINT — the pilot. Home country; California Historical Landmark #268.
// Public local history only.
// ---------------------------------------------------------------------------
const WEST_POINT: TownInvestigation = {
  townId: 'west_point',
  title: 'The Salted Claim at West Point',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'West Point, in the upcountry pines — where Kit Carson kept a trading post before there was any gold to trade for. A stranger has been buying a winter\'s supplies on the promise of a strike, paying in dust that rings a little wrong on an honest scale. The clerk swears the man was here; the man swears he was somewhere richer. Read the real places of this town by their true grain, and you will find which story the ground actually tells.',
  scenes: [
    {
      id: 'trading_post',
      place: "Kit Carson's Trading Post (Landmark #268)",
      art: 'west_point',
      witness: { name: 'Eb Crandall', role: 'trading-post clerk' },
      prompt: 'The stranger paid for a season\'s flour and powder in gold dust that rang false on the scale. He needed that dust "proven" honest before anyone weighed it twice. Where in this district would a man take raw dust to be assayed and stamped?',
      clueEasy:
        'Eb taps the counter. "He didn\'t want my scale. He wanted the gulch two miles south — where the first nugget in this whole district came out of the ground, and where they built the first stamp mill to prove the rest."',
      clueHard:
        'Press him and he lowers his voice. "The Carsner brothers pulled that first nugget in \'49. The mill that grew up around it is where every claim south of here gets its ore proven — and where a clever man could pay to have brass filings called gold."',
      evidence: { label: 'WEIGHT', value: 'Dust that rings false — salted with brass filings' },
      answer: 'sandy_gulch',
      choices: [
        { id: 'sandy_gulch', label: 'Sandy Gulch — the first nugget, the first stamp mill' },
        { id: 'san_andreas', label: 'San Andreas — the county seat & courthouse' },
        { id: 'murphys', label: 'Murphys — the vineyard town down the grade' },
      ],
      feedback:
        'Sandy Gulch it is. Eb is right about the ground: this is where the district began, and where dust gets its name proven — or bought.',
      wrongHint:
        'Wrong gulch. The trail cools while you ride the long way round, and the stranger gains a day on you.',
    },
    {
      id: 'sandy_gulch',
      place: 'Sandy Gulch — the district\'s first stamp mill',
      art: 'sandy_gulch',
      witness: { name: 'Mei-Ling Sandoval', role: 'placer miner working the tailings' },
      prompt: 'At the mill his "proven" dust came with a stamp-mill receipt — for ore that, the miners whisper, never actually went under the stamps. To forge a strike that convincing he needed timber: a headframe and a claim-cabin raised fast, to look long-settled. Where would he get milled lumber, cut and squared, on short notice?',
      clueEasy:
        'Mei-Ling jerks her chin uphill. "Green wood won\'t pass for an old claim. He wanted SAWN lumber — and the only mills cutting square timber for the whole region sit up the ridge where the big trees come down."',
      clueHard:
        'She spits. "The Harris mill cut materials that went into towns and ranches across this county for decades — Tiger Creek, the Raggio steam mill after. Buy from the honest mill and your forgery is built of real boards. That\'s how you fake having been here all along."',
      evidence: { label: 'TIMBER', value: 'A stamp-mill receipt for ore that never went under the stamps' },
      answer: 'sawmill',
      choices: [
        { id: 'sawmill', label: 'The ridge sawmills — Harris / Tiger Creek / Raggio' },
        { id: 'courthouse', label: 'The San Andreas courthouse records office' },
        { id: 'big_trees', label: 'Calaveras Big Trees — the giant sequoia grove' },
      ],
      feedback:
        'The sawmill. Sawn timber from an honest mill is exactly what a forger needs to make a brand-new lie look thirty years old.',
      wrongHint:
        'No lumber there. You lose the light asking the wrong people, and the boards are already nailed.',
    },
    {
      id: 'sawmill',
      place: 'The ridge sawmill — the tally book',
      art: 'harris_ranch',
      witness: { name: 'Old Raggio', role: 'mill-hand at the steam saw' },
      prompt: 'The mill keeps a tally book: every board, who bought it, where it went. If Vane built his "long-settled" claim from lumber milled this season, the dates won\'t lie even when he does. What in the tally book catches him out?',
      clueEasy:
        'Raggio runs a thumb down the ledger. "His claim-cabin\'s supposed to be from the early days. But the boards in it? Sold off my saw THIS season. You can fake a strike. You can\'t fake the year a tree fell."',
      clueHard:
        'He closes the book. "The land up here remembers honestly — what was milled, when, and by whose hand. That\'s the one record a tare can\'t salt. Every homestead in this country was its own world, built of timber with a true date on it. His wasn\'t."',
      evidence: { label: 'DATE', value: 'Fresh-milled boards in a cabin he swore was thirty years old' },
      answer: 'fresh_boards',
      choices: [
        { id: 'fresh_boards', label: 'The boards were milled THIS season — too new to be old' },
        { id: 'wrong_buyer', label: 'The cabin was bought by someone else entirely' },
        { id: 'no_record', label: 'There is no record of the cabin at all' },
      ],
      feedback:
        'There it is. Fresh boards in a cabin he swore was old. The tree-fall date is the one thing he could never counterfeit.',
      wrongHint:
        'Not quite — the ledger holds, but you read the wrong line and Vane slips toward the next gulch.',
    },
  ],
  verdict:
    'You corner Cyrus Vane at the false claim, and the story falls apart in the order he built it: salted dust, a bought receipt, a cabin of this-year\'s lumber pretending to be thirty years old. One crime under all of it — the forgery of PRESENCE: claiming to have struck, settled, and stood where he never honestly did. ' +
    'Which is the one thing this country cannot do. Kit Carson really kept the post before the gold. The Carsners really pulled the first nugget. The mills really cut the timber that built the county\'s towns, board by dated board. West Point was a world of honest homesteads, each one self-contained — and the honest record of who was really here is exactly what catches a man who never was.',
  sources: [
    'Kit Carson\'s pre-gold trading post — California Historical Landmark #268 (plaque dedicated 1949).',
    'Sandy Gulch (2 mi south): the Carsner brothers\' 1849 nugget find, the district\'s first stamp mill, and a Mi-Wuk village.',
    'Indian Gulch (1852) → renamed West Point (1854) → post office (1856); the writer Bret Harte lived here; 10+ stamp mills by the 1860s–70s.',
    'Locally-milled timber tradition: the Harris mill (Sandy Gulch, "supplied materials throughout the region"), the Tiger Creek mill (photographed 1920), and the Raggio steam sawmill (1888–1924). West Point still keeps Lumberjack Day.',
  ],
}

export const INVESTIGATIONS: Record<string, TownInvestigation> = {
  west_point: WEST_POINT,
}

export function getInvestigation(townId: string): TownInvestigation | undefined {
  return INVESTIGATIONS[townId]
}

export function hasInvestigation(townId: string): boolean {
  return townId in INVESTIGATIONS
}
