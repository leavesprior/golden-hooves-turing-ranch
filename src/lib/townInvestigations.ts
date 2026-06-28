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

// ---------------------------------------------------------------------------
// VOLCANO — Amador County. CHL #29. Civilized-first placer town (first rental
// library 1850, Thespian Society 1854, observatory 1860), kept Union by "Old
// Abe," a cannon smuggled in by hearse in 1862. Public local history only.
// ---------------------------------------------------------------------------
const VOLCANO: TownInvestigation = {
  townId: 'volcano',
  title: 'The Forged Subscription at Volcano',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Volcano, in its bowl of a valley the old miners swore was a burnt-out crater — though no fire ever lit it but gold fever. Soldiers of Stevenson\'s regiment washed the first color out of Soldiers Gulch, and the placers ran so rich men slept in the open rather than lose an hour to building a roof. But Volcano spent its dust on being CIVILIZED: the first rental library in California, a theater society, an observatory on the knoll, even a cannon to keep the town Union. A stranger has been trading on all of it — selling shares in institutions he never founded, signing names to ledgers he never kept, paying for standing he never earned. Read the real places of this town by their true grain, and you will find which story the ground actually tells.',
  scenes: [
    {
      id: 'general_store',
      place: 'The Volcano General Store (est. 1852)',
      art: 'volcano_general_store',
      witness: { name: 'Charles Burleson', role: 'storekeeper, the 1852 general store' },
      prompt:
        'Vane bought a winter\'s outfit on credit, signing the ledger as a "founding subscriber" of the town\'s proudest institution — a man of standing, good for the debt. To make that standing look real, he needed his name written into a SUBSCRIPTION book that the whole district respected. Where in Volcano did the gentry put their names down to belong?',
      clueEasy:
        'Burleson wipes the counter — limestone and Volcano brick, the store standing since \'52. "He didn\'t care about my ledger. He kept asking after the OTHER book — the one men paid a fee to sign, to borrow what no other town in the state could lend. He wanted his name in THAT one."',
      clueHard:
        'Press him and he leans in. "First of its kind in California, 1850 — a man paid his dues and took home volumes. A subscriber\'s name in that book is proof he was somebody here in the early days. Forge that book and you forge a whole past. That\'s where he was headed."',
      evidence: { label: 'CREDIT', value: 'A store-ledger signature claiming "founding subscriber" standing' },
      answer: 'library',
      choices: [
        { id: 'library', label: 'The rental library — California\'s first, 1850' },
        { id: 'st_george', label: 'The St. George Hotel — the brick house on the block' },
        { id: 'observatory', label: "Madeira's observatory — the knoll above town" },
      ],
      feedback:
        'The library. Burleson reads the ground true: a forger trades on what is rare, and no town but Volcano could sell a man a place in a library that old.',
      wrongHint:
        'Wrong door. You waste the afternoon asking after the wrong book, and the stranger\'s ink dries a day ahead of you.',
    },
    {
      id: 'library',
      place: "California's first rental library (1850) — the subscription book",
      art: 'vol_st_george',
      witness: { name: 'Mrs. Lavinia Harrow', role: 'subscription-library keeper' },
      prompt:
        'His name IS in the book — backdated to 1851, in a hand too fresh for the page. A forged subscriber needs forged GOOD CHARACTER to match, and in Volcano character was performed in public, on a stage, before the whole town. Where would Vane have his "long standing" vouched for by the most respectable society in the district?',
      clueEasy:
        'Lavinia turns the page, frowning at the ink. "His entry sits on \'51, but the iron-gall hasn\'t even browned. As for whether he\'s a man of parts — ask the players. Since \'54 this town has judged a man\'s standing by whether the SOCIETY would put him on its boards."',
      clueHard:
        'She closes the ledger gently. "The Thespian Society — one of the first \'Little Theaters\' in California, 1854. To belong was to be vouched for in front of everyone. A tare who buys a library seat will next buy a part on that stage, so the whole town will swear they\'ve seen him for years."',
      evidence: { label: 'INK', value: 'An 1851 subscription entry in iron-gall ink that never browned' },
      answer: 'thespian',
      choices: [
        { id: 'thespian', label: 'The Volcano Thespian Society — "Little Theater," 1854' },
        { id: 'soldiers_gulch', label: 'Soldiers Gulch — where the first color was washed' },
        { id: 'black_chasm', label: 'The limestone caverns below the diggings' },
      ],
      feedback:
        'The Thespian Society. Lavinia has it: a man who forges a past in books will next forge a face on a stage, where a whole town learns to "remember" him.',
      wrongHint:
        'Not there. The fresh ink mocks you while you ride the wrong way, and Vane takes his bow without you.',
    },
    {
      id: 'thespian',
      place: 'The Volcano Thespian Society & the cannon "Old Abe"',
      art: 'volcano',
      witness: { name: 'Sergeant of the Volcano Blues', role: 'militiaman, the Volcano Blues' },
      prompt:
        'On the society\'s rolls Vane played the role of a leading Union man — a "founder" who, he claimed, helped keep Volcano loyal in \'62. But the town keeps one record no actor can rewrite: who actually stood behind the gun the night the secessionists marched. What in that true account catches Vane out?',
      clueEasy:
        'The sergeant snorts. "He says he stood with us in \'62. But we smuggled Old Abe into this town inside a HEARSE — a six-pounder, near eight hundred pounds, brought up the Carson road at night so no Confederate would know. The men who built her carriage and faced down that mob — every name is known. His isn\'t on it."',
      clueHard:
        'He grips his belt. "We loaded her with nails and scrap iron for want of proper shot, and the secesh broke and ran without a ball fired. A man can buy a library seat and act a Union hero on a stage. He cannot put himself behind a gun he never touched, on a night the whole town remembers to the man. That\'s the lie that has no ground under it."',
      evidence: { label: 'ROLL', value: 'A "1862 Union founder" who appears on no list of the men behind Old Abe' },
      answer: 'cannon_roll',
      choices: [
        { id: 'cannon_roll', label: 'He\'s on no roll of the men who stood behind Old Abe' },
        { id: 'wrong_war', label: 'He fought, but for the secessionist side' },
        { id: 'no_society', label: 'The Thespian Society never existed at all' },
      ],
      feedback:
        'There it is. A forged library seat, a bought part on the stage, a stolen place behind a gun he never touched. The night Volcano stayed Union is the one record a tare can never enter.',
      wrongHint:
        'Not quite — the roll holds, but you read the wrong name and Vane slips out the Carson road toward the next town.',
    },
  ],
  verdict:
    'You corner Cyrus Vane between the library and the gun, and the story falls apart in the order he built it: a forged credit at the store, a backdated seat in the first library, a bought part with the Thespians, and finally a stolen place among the men who smuggled Old Abe in by hearse. One crime under all of it — the forgery of PRESENCE: claiming to have founded, belonged, and stood where he never honestly did. ' +
    'Which is the one thing this town cannot do. Stevenson\'s soldiers really washed the first gold from Soldiers Gulch. Volcano really built California\'s first rental library in 1850 and the Thespian Society\'s Little Theater in 1854. The Volcano Blues really hid a six-pounder in a hearse in 1862 and kept the town Union without firing a ball. A place that earned its standing by being honestly, publicly, RECORDED is exactly what catches a man who only counterfeited belonging.',
  sources: [
    'Volcano — California Historical Landmark #29: started 1848 by soldiers of Col. Stevenson\'s regiment; site of "the first California rental library, 1850" and one of the first "Little Theaters," the Volcano Thespian Society, 1854.',
    'The "Old Abe" cannon — a ~6-pounder bronze gun smuggled into Volcano by hearse by the "Volcano Blues" in 1862 to face down Confederate sympathizers; still displayed in town on its 19th-century carriage.',
    'George Madeira\'s observatory — California Historical Landmark #715: the first amateur astronomical observatory of record in California, built on the knoll above Volcano in 1860 (Madeira observed the Great Comet of 1861).',
    'The Volcano General Store, operating since 1852 — among the longest continuously operated general stores in California; built of Volcano brick and native limestone.',
  ],
}

// ---------------------------------------------------------------------------
// MOKELUMNE HILL — Calaveras County seat 1852–1866; richest placer camp of the
// southern mines (16-sq-ft claims). Public local history only.
// ---------------------------------------------------------------------------
const MOKELUMNE_HILL: TownInvestigation = {
  townId: 'mokelumne_hill',
  title: 'The Sixteen-Foot Lie at Mokelumne Hill',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Mokelumne Hill — "Mok Hill" — the proud seat of Calaveras County, where the diggings ran so rich the camp held a man to sixteen square feet of ground and that little patch could still pay him twenty thousand dollars. Where gold flows that fast, paper flows after it: assay slips, express receipts, certificates of deposit. A stranger has been spending against a deposit certificate stamped by the great express bank — drawn, he says, on dust pulled from one of those sixteen-foot claims and shipped out under guard. The teller swears no such gold ever crossed his counter. The certificate swears it did. Read the real places of this town by their true grain, and you will learn which paper the ground actually backs.',
  scenes: [
    {
      id: 'diggings',
      place: 'The Mokelumne Hill diggings — the sixteen-foot claims',
      art: 'mokelumne_hill',
      witness: { name: 'Samuel Pearsall', role: 'placer miner on the original 1848 ground' },
      prompt:
        'Vane claims a fortune in dust off a single claim here, then says he banked it whole. But the ground here was cut into squares barely sixteen feet on a side — so rich the camp rationed it so no one man could hold more. To turn a real but TINY take into a great paper fortune, where would he take that dust to have it counted, weighed, and turned into a certificate worth far more than the hole could give?',
      clueEasy:
        'Pearsall laughs, hard. "Sixteen square feet, son. That\'s the law of this hill — claims so rich we cut \'em small so a man couldn\'t hog the luck. Twenty thousand off a patch you could spread a bedroll on. But no patch gives what his paper says. He didn\'t mine that figure — he BANKED it. Find the bank."',
      clueHard:
        'Press him and he leans close. "Real dust, salted with brass to swell the count, and a friend behind a banker\'s scale who\'ll stamp the swollen weight onto a certificate. Only one house on this hill weighed gold and shipped it east under their own name. The express bank — the one whose stone walls became the lodge hall after they burned. Start there."',
      evidence: { label: 'WEIGHT', value: 'A sixteen-foot claim made to "bank" a fortune no sixteen feet could give' },
      answer: 'mh_hotel_leger',
      choices: [
        { id: 'mh_hotel_leger', label: 'The express bank on Main — Adams & Co. (later the I.O.O.F. stone hall)' },
        { id: 'san_andreas', label: 'San Andreas — the rival camp down the road' },
        { id: 'big_trees', label: 'Calaveras Big Trees — the giant sequoia grove' },
      ],
      feedback:
        'The express bank it is. Pearsall reads the ground true: sixteen feet could make a man rich, but never as rich as Vane\'s paper claims. That gap got minted somewhere — at a banker\'s scale.',
      wrongHint:
        'Wrong ground. You chase a rumor down the wrong gulch and the dust\'s already weighed, the paper already stamped.',
    },
    {
      id: 'express_bank',
      place: 'The Adams & Co. express office (the stone hall on Main, rebuilt after the 1854 fire)',
      art: 'mh_hotel_leger',
      witness: { name: 'Horace Tilden', role: 'express-office clerk for the banking house' },
      prompt:
        'The certificate Vane spends carries the express bank\'s own stamp, for gold "shipped east under guard." But the great house here failed in the panic of \'55, and its books — and its stone walls — passed to other hands. A forged certificate has to name a SHIPMENT that the county can\'t check anymore. Where are the records that could still prove whether his gold ever truly left this hill — the one office that logged who deposited, who shipped, and when?',
      clueEasy:
        'Tilden taps the certificate, frowning. "Adams and Company. We weighed gold, we shipped it east, we backed it with paper like this — until February of \'fifty-five, when the whole house came down in the panic. After the fire of \'54 we\'d built in stone; the lodge took those walls and raised a third story on \'em in \'sixty-one. But the paper trail? When a bank dies, only the COUNTY\'s record outlives it."',
      clueHard:
        'He lowers his voice. "His certificate dates a shipment to a week the office was already shuttered — dead bank, dead stamp. A forger counts on no one having the deposit ledger to cross. But the county kept its own books, in its own stone building, while Mok Hill was the seat. The courthouse beside the Frenchman\'s hotel — that\'s where a recorded deposit would still be written, in a hand he can\'t copy."',
      evidence: { label: 'PAPER', value: 'A deposit certificate stamped after Adams & Co. had already failed in the Panic of 1855' },
      answer: 'sa_courthouse',
      choices: [
        { id: 'sa_courthouse', label: 'The county courthouse by Hotel Léger — where deposits were recorded' },
        { id: 'sandy_gulch', label: 'Sandy Gulch — the upcountry stamp mill' },
        { id: 'jackson', label: 'Jackson — the camp over the Mokelumne in Amador' },
      ],
      feedback:
        'The courthouse. Tilden has it: a bank can die and its stamp die with it, but the county\'s recorded deposit outlives the house that took it. That ledger is the one paper Vane can\'t kill.',
      wrongHint:
        'No record there. You ride for the diggings and the mills while the real proof sits in a courthouse drawer, gathering dust on the man who needs it found.',
    },
    {
      id: 'courthouse',
      place: 'The Calaveras County courthouse beside Hotel Léger (Hotel de France)',
      art: 'sa_courthouse',
      witness: { name: 'George Léger', role: 'proprietor of the Hotel de France, next door to the court' },
      prompt:
        'Mok Hill was county seat from \'52, and the stone court rose beside Léger\'s hotel after the fire. The county recorded every honest deposit and shipment by date and depositor. If Vane\'s certificate names a real shipment, the courthouse register will hold its match. If it names a ghost, the register will hold only silence on that date. What in the county\'s books catches him out?',
      clueEasy:
        'Léger sets down a candle. "My Hotel de France stood here from \'fifty-one; the court rose in stone beside me after the \'54 fire, and when the seat went to San Andreas in \'sixty-six I bought that very court building into my hotel. The register stayed with me. I checked his date. Monsieur — there is no such deposit. No such shipment. The page is blank where his fortune ought to be written."',
      clueHard:
        'He turns the ledger to you. "A man cannot forge what a whole county wrote down at the time. The depositors, the dates, the weights under guard — all here, in the court\'s own hand, while we were the seat. His certificate is a fine forgery of a thing that never was deposited. The book does not lie because the book was kept by no one man — it was kept by the county."',
      evidence: { label: 'DATE', value: 'A shipment certificate with NO matching entry in the county deposit register' },
      answer: 'no_entry',
      choices: [
        { id: 'no_entry', label: 'The county register has NO entry — the deposit never happened' },
        { id: 'wrong_name', label: 'The deposit was recorded under another miner\'s name' },
        { id: 'wrong_weight', label: 'The recorded weight is merely smaller than the certificate\'s' },
      ],
      feedback:
        'There it is. Not a wrong name, not a short weight — a blank page. The shipment Vane spends against was never deposited, never shipped, never real. The county\'s own hand, kept while Mok Hill was the seat, is the witness he could not bribe.',
      wrongHint:
        'Close, but you read the wrong column — the entry you want isn\'t altered, it simply isn\'t there, and the missed beat lets Vane reach for the door.',
    },
  ],
  verdict:
    'You corner Cyrus Vane in the old court building Léger folded into his hotel, and the lie unwinds in the order he built it: real dust off a sixteen-foot claim, salted and swollen at a banker\'s scale, stamped onto a deposit certificate for gold that was never deposited and never shipped — drawn, no less, on an express bank already dead in the Panic of \'55. One crime under all of it: the forgery of PRESENCE — claiming gold struck, banked, and shipped from a town where the record plainly shows it never was. ' +
    'And this is the one town that could never abide it. Mok Hill\'s diggings really were so rich the camp held a man to sixteen square feet, and those squares really paid up to twenty thousand. Adams & Co. really weighed and shipped its gold from here, built in stone after the 1854 fire, and fell in the Panic of 1855 — leaving the stone for the I.O.O.F. to raise a third story in 1861. The county seat really sat here from 1852 to 1866, its register kept beside the Hotel de France, until the seat went to San Andreas and Léger bought the courthouse into his walls. The honest record of who really deposited, really shipped, and really stood here is exactly what catches a man who only ever forged being present.',
  sources: [
    'The Mokelumne Hill diggings were among the richest of the southern mines — claims limited to 16 square feet, many reportedly paying up to $20,000; gold found 1848.',
    'Adams & Co. express/banking house weighed and shipped Calaveras gold; after the 1854 town fire it rebuilt in fire-proof stone, then failed in the Panic of 1855 — the I.O.O.F. Lodge added the third story to that former Adams building in 1861 (CHL #256).',
    'Mokelumne Hill was the Calaveras County seat 1852–1866; the stone courthouse stood beside the Hotel de France (1851), which George Léger came to own — when the seat moved to San Andreas in 1866 Léger bought the court building into his hotel (Hotel Léger, CHL #663).',
    'The "French War" of June 1851 on French Hill: French miners raised their flag against the Foreign Miners\' Tax; militia under William D. Bradshaw negotiated a stand-down — marking the camp\'s ferocity over who "belonged."',
  ],
}

// ---------------------------------------------------------------------------
// MURPHYS — "Queen of the Sierra." Famous-guest hotel register, Big Trees
// spectacle, the Murphy brothers' merchant fortune. Public history.
// ---------------------------------------------------------------------------
const MURPHYS: TownInvestigation = {
  townId: 'murphys',
  title: 'The Forged Register at Murphys',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Murphys — the Queen of the Sierra, where John and Daniel Murphy made more as merchants than as miners, and where the finest hotel outside San Francisco keeps a register signed by Mark Twain, U. S. Grant, J. P. Morgan, and even Black Bart himself. A stranger has been trading on famous company — a signature he claims is in that book, a presence he claims the town remembers. The hotel clerk swears the hand is not the one that signed; the stranger swears the whole county will vouch for him. Read the real places of Murphys by their true grain, and you will find which name was actually written here.',
  scenes: [
    {
      id: 'murphys_hotel',
      place: 'The Sperry & Perry Hotel (Murphys Historic Hotel, 1856)',
      art: 'murphys',
      witness: { name: 'James Sperry', role: 'hotel proprietor' },
      prompt:
        'Vane points to the register — Twain, Grant, Morgan, Black Bart — and swears his own name sits among them, written years ago. But the ink is wrong and the hand is wrong. To pass a forged signature as old, he first needed it "aged" — paper and ink that read as decades-weathered. Where near Murphys would a clever man take fresh ink to make it look like it had sat underground for thirty years?',
      clueEasy:
        'Sperry slides the register shut. "His name\'s in a hand that wasn\'t holding a pen in \'56 — I opened this house that year and I\'d know. He wanted his paper to smell of age and damp. There\'s only one place a mile out that breathes cool, wet, mineral air the year round."',
      clueHard:
        'He lowers his voice. "A prospector named Mercer found a limestone cave just up the Sheep Ranch road in \'85 — cool draft, dripping stone, fifty cents to walk it. Leave paper down there a week and it ages a decade. A tare doesn\'t forge a signature. He forges the YEARS around it."',
      evidence: { label: 'INK', value: 'A register signature in a hand too modern for 1856' },
      answer: 'mercer_caverns',
      choices: [
        { id: 'mercer_caverns', label: 'Mercer Caverns — the cool, wet limestone cave on the Sheep Ranch road' },
        { id: 'san_andreas', label: 'San Andreas — the county seat & archives' },
        { id: 'big_trees', label: 'Calaveras Big Trees — the giant sequoia grove' },
      ],
      feedback:
        'Mercer Caverns. Walter Mercer really found that cave in 1885 on the road to Sheep Ranch — cool, dripping, mineral air. Exactly the place to age a lie until it passes for old.',
      wrongHint:
        'Wrong door. You lose the afternoon knocking where no draft blows, and Vane carries his aged paper one town further.',
    },
    {
      id: 'mercer_caverns',
      place: 'Mercer Caverns (discovered 1885)',
      art: 'moaning_cavern',
      witness: { name: 'Walter Mercer', role: 'prospector & cave guide' },
      prompt:
        'In the cave you find Vane\'s scheme bigger than one signature. He is selling shares in a "marvel" — a natural wonder he claims to have discovered and can show to paying crowds, just as Mercer shows his cavern. But the spectacle he\'s peddling belongs to someone else. What real Murphys-country attraction is he counterfeiting to sell tickets to a wonder he never found?',
      clueEasy:
        'Mercer wipes his lamp. "He talked like me — fifty cents a head, a wonder underground. But his \'marvel\' wasn\'t a cave. It was the thing up the grade that the whole world already came to gawk at, the thing they cut down and shipped off to show the cities."',
      clueHard:
        'He nods toward the high road. "In \'52 a hunter named Dowd chased a grizzly into a grove of trees big as churches. They felled the biggest one — the Discovery Tree — and hauled its bark around the world as a humbug nobody believed. Vane\'s selling shares in THAT wonder. The road up the grade leads to the trees he never found."',
      evidence: { label: 'SPECTACLE', value: 'Share certificates in a "marvel" Vane claims to have discovered' },
      answer: 'big_trees',
      choices: [
        { id: 'big_trees', label: 'Calaveras Big Trees — the Discovery Tree grove up the grade' },
        { id: 'natural_bridges', label: 'Natural Bridges — the limestone tunnels downstream' },
        { id: 'angels_camp', label: 'Angels Camp — the quartz-mine town down the road' },
      ],
      feedback:
        'The Big Trees. Augustus Dowd really stumbled into that grove in 1852 chasing a wounded grizzly, and they really felled the Discovery Tree to ship its bark around the world. A wonder that famous is exactly what a tare pretends to own.',
      wrongHint:
        'Not the right wonder. The trail cools while you chase the wrong marvel, and the share-buyers keep paying.',
    },
    {
      id: 'big_trees',
      place: 'Calaveras Big Trees — the Discovery Tree stump',
      art: 'big_trees',
      witness: { name: 'Augustus Dowd', role: 'hunter who found the grove' },
      prompt:
        'On the great felled stump — wide enough to dance on — Vane has nailed a plaque claiming HE discovered this grove and that the Murphy brothers themselves bankrolled him. The Murphys really got rich here, trading with and marrying into the Miwok. But the ring count of the stump is a calendar that cannot be bribed. What in the wood itself proves Vane was never here when he says?',
      clueEasy:
        'Dowd lays a hand on the rings. "I found this grove in \'52, chasing a bear. His plaque says he found it — and that the Murphys paid him to. But John Murphy left this country rich and never came back. He couldn\'t have paid a man for a tree found three years after he was gone."',
      clueHard:
        'He counts the rings with a fingernail. "Twelve hundred forty-four years this tree stood, and the year it FELL is written here plain. The Murphy brothers made their fortune as merchants and by marrying into the Miwok, then left. The dates don\'t meet. A man can forge a plaque. He can\'t forge the year a tree fell — or the year a Murphy left."',
      evidence: { label: 'RINGS', value: 'A plaque dated to a year no Murphy was here to fund it' },
      answer: 'ring_count',
      choices: [
        { id: 'ring_count', label: 'The stump\'s dates predate Vane and postdate the Murphys\' fortune' },
        { id: 'wrong_grove', label: 'The plaque names the wrong grove entirely' },
        { id: 'no_plaque', label: 'There was never any plaque at all' },
      ],
      feedback:
        'There it is. Dowd found the grove in 1852; John Murphy made his fortune and left at the end of 1849. The wood\'s own calendar puts Vane\'s claim between two dates that can never touch.',
      wrongHint:
        'Not quite — the rings hold honest, but you read the wrong year and Vane edges toward the next county.',
    },
  ],
  verdict:
    'You corner Cyrus Vane on the Discovery Tree stump, and the fraud unwinds in the order he built it: a register signature in too-modern a hand, paper aged a decade in Mercer\'s cave, shares sold in a wonder he never found, a plaque crediting Murphy money that had ridden out of the county years before. One crime under all of it — the forgery of PRESENCE: claiming to have signed, discovered, and been bankrolled where he never honestly stood. ' +
    'Which is the one thing Murphys cannot do. The Sperry & Perry Hotel really opened in 1856 and really holds a register signed by Twain, Grant, Morgan and Black Bart. Walter Mercer really found his caverns in 1885. Dowd really chased a grizzly into the Big Trees in 1852, and they really felled the Discovery Tree for the world to gape at. John and Daniel Murphy really grew rich as merchants — trading with and marrying into the Miwok — and rode away. The Queen of the Sierra keeps an honest register of who was truly here, and that record is exactly what catches a man who never was.',
  sources: [
    'Murphys Historic Hotel (Sperry & Perry Hotel): opened August 20, 1856 by James L. Sperry and John Perry; register bears Mark Twain, Ulysses S. Grant, John Jacob Astor, J. P. Morgan, Thomas Lipton, and Charles Bolles ("Black Bart").',
    'John & Daniel Murphy: mined Murphys/Angels Creek from July 1848, made far more as merchants than miners; John married into the local Miwok and left in 1849 with a fortune near $2 million. Town nicknamed "Queen of the Sierra."',
    'Mercer Caverns: discovered September 1, 1885 by prospector Walter J. Mercer on the Murphys–Sheep Ranch road; a recrystallized-limestone show cave.',
    'Calaveras Big Trees / Discovery Tree: Augustus T. Dowd found the North Grove in spring 1852 while tracking a wounded grizzly; the Discovery Tree (~1,244 rings) was felled and its bark toured the world as a "humbug."',
  ],
}

// ---------------------------------------------------------------------------
// ANGELS CAMP — Twain's "Jumping Frog," the quartz mines, the Utica disaster.
// The tall-tale / counterfeit theme fits a "tare" perfectly. Public history.
// ---------------------------------------------------------------------------
const ANGELS_CAMP: TownInvestigation = {
  townId: 'angels_camp',
  title: "The Counterfeit Frog at Angels Camp",
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Angels Camp — founded by George Angel in 1848, grown rich on deep quartz, and made immortal one rainy fortnight in 1865 when a stranger named Sam Clemens sat at the Angels Hotel bar and wrote down a tall tale about a jumping frog. Now another stranger trades in tall tales. Cyrus Vane is selling a story he swears is true — a champion frog, a famous wager, a fortune in the Utica vein, all of it claiming HIS name and HIS presence. But this is the town that invented the tall tale; it knows a counterfeit when it hears one. Read the real places of Angels Camp by their true grain, and you will find where the lie was actually told.',
  scenes: [
    {
      id: 'angels_hotel',
      place: 'The Angels Hotel (dedicated 1856)',
      art: 'ace_angels_hotel',
      witness: { name: 'Ross Coon', role: 'bartender & part-owner of the Angels Hotel' },
      prompt:
        'At the bar where Twain heard the frog tale, Vane is selling shares in his own "celebrated frog" — a champion he swears jumped here for famous money. But a frog wager needs a stake, and Vane\'s stake is gold he can\'t account for. He claims it came from the richest hole in the district. Where would a man go to launder dubious dust into a "Utica fortune" — to the one mine big enough that no one questions another ingot?',
      clueEasy:
        'Coon polishes a glass. "I told a tale at this bar once that made a writer famous — so I know a spun yarn. Vane\'s \'champion frog\' is a hook; the real con is the gold behind the wager. He needs it to look like it came out of the biggest quartz mine in camp."',
      clueHard:
        'He leans in. "Charlie Lane bought the Utica in \'84 and it threw off millions — deep quartz, hard rock, the proudest hole in Angels Camp. Dust that came out of THAT shaft, nobody weighs twice. A tare doesn\'t need a real frog. He needs a real mine to hide a fake fortune in."',
      evidence: { label: 'STAKE', value: 'Wager gold Vane credits to a Utica vein he never worked' },
      answer: 'utica_mine',
      choices: [
        { id: 'utica_mine', label: 'The Utica Mine — the great deep-quartz mine of Angels Camp' },
        { id: 'san_andreas', label: 'San Andreas — the county courthouse & assay records' },
        { id: 'murphys', label: 'Murphys — the merchant town up the grade' },
      ],
      feedback:
        'The Utica. Charles D. Lane really bought it in 1884 and it really produced millions in deep quartz — exactly the mine a forger would name to make stolen dust sound honest.',
      wrongHint:
        'Wrong shaft. You burn daylight at the wrong window, and Vane sells another share before you arrive.',
    },
    {
      id: 'utica_mine',
      place: 'The Utica Mine, North Shaft',
      art: 'angels_camp',
      witness: { name: 'Thomas Corwin', role: 'Utica timberman, survivor of the North Shaft' },
      prompt:
        'At the Utica you learn the cruelest part of Vane\'s lie. He claims he was DOWN this shaft and "barely escaped" the disaster — trading on the dead to make himself a survivor with a survivor\'s rich claim. But you stand with men who were truly down there. What detail of that day proves Vane was never in the shaft he swears he escaped?',
      clueEasy:
        'Corwin\'s hands shake on the timber. "The rains rotted the talc and the timbers crushed. Seventeen men died down here. Only three of us walked out the south shaft — me, Danielson, Anderson. Vane swears he was the fourth. There was no fourth. I\'d carry his name to my grave if there were."',
      clueHard:
        'He grips your arm. "Some of those men weren\'t dug out for years. We three who lived know every face that went down and every face that came up. Vane describes a south-shaft escape he could only have read about. A tare can steal a dead man\'s story. He can\'t put his name on a roll the living memorized in blood."',
      evidence: { label: 'ROLL', value: 'Vane named as a "fourth survivor" of a cave-in only three men walked out of' },
      answer: 'three_survivors',
      choices: [
        { id: 'three_survivors', label: 'Only three men escaped — there was no fourth survivor' },
        { id: 'wrong_shaft', label: 'Vane named the wrong shaft entirely' },
        { id: 'wrong_year', label: 'Vane gave the wrong year for the disaster' },
      ],
      feedback:
        'There it is. The 1889 North Shaft cave-in killed seventeen; only Corwin, Danielson, and Anderson escaped through the south shaft. A "fourth survivor" is a name no living miner ever knew.',
      wrongHint:
        'Not quite — the roll of the dead holds true, but you read the wrong line and Vane slips toward the festival crowd.',
    },
    {
      id: 'frog_jubilee',
      place: 'The Calaveras Jumping Frog Jubilee (first held 1928)',
      art: 'angels_camp',
      witness: { name: 'A Booster Club steward', role: 'organizer of the first Frog Jubilee' },
      prompt:
        'At the Jubilee — the festival the town threw in 1928 to crown Twain\'s frog forever — Vane means to make his last and biggest sale: present his "celebrated frog" before the whole county and pocket the gate. But the Jubilee is the one stage in California that knows exactly when and how the frog story really began. What single fact, true of this festival, exposes the whole counterfeit at once?',
      clueEasy:
        'The steward laughs without warmth. "We started this jump in \'28 — to celebrate paving Main Street — off a tale Mark Twain wrote in 1865, from a yarn told at the Angels Hotel bar. Vane swears HIS frog is the original, that the fame is his. The dates make a liar of him before he opens the box."',
      clueHard:
        'He spreads the program. "Twain heard it at Ross Coon\'s bar in the winter of \'65 and published it that same year — the story made HIM famous, not any man named Vane. Our Jubilee just keeps the tale alive. The fame has an author and a date, both older than Vane\'s whole story. That\'s the tell: he forged the one presence the whole county can recite by heart."',
      evidence: { label: 'AUTHOR', value: 'A claim of "original" fame that a published 1865 story already owns' },
      answer: 'twain_1865',
      choices: [
        { id: 'twain_1865', label: 'The fame belongs to Twain\'s 1865 story — it predates Vane entirely' },
        { id: 'wrong_festival', label: 'Vane named the wrong festival' },
        { id: 'no_frog', label: 'Vane never actually had a frog' },
      ],
      feedback:
        'There it is. Twain heard the tale at the Angels Hotel bar in early 1865 and published it that year; the Jubilee began in 1928 to keep it alive. The fame has an author and a date — and neither is Cyrus Vane.',
      wrongHint:
        'Not quite — the festival\'s history holds, but you grab the wrong thread and Vane works the crowd a moment longer.',
    },
  ],
  verdict:
    'You corner Cyrus Vane at the Jubilee, his frog-box in his hands, and the con collapses in the order he built it: wager gold laundered through the Utica\'s good name, a stolen seat on a disaster only three men survived, and a claim on fame that a published story has owned since 1865. One crime under all of it — the forgery of PRESENCE: claiming to have struck, survived, and authored where he never honestly was. ' +
    'Which is the one thing Angels Camp cannot do. George Angel really founded the camp in 1848. The Utica really threw off millions in deep quartz, and its North Shaft really crushed seventeen men in December 1889 — only three walking out. Sam Clemens really sat at the Angels Hotel bar in 1865 and wrote the tall tale that made him famous, and the town really crowns that frog every year since 1928. This is the country that invented the tall tale; it keeps an honest record of who really told it — and that record is exactly what catches a man who only pretended to.',
  sources: [
    'Angels Camp founding: brothers George and Henry Angel mined the site from 1848.',
    'Angels Hotel: begun as a canvas tent in 1851, rebuilt in stone, dedicated January 1, 1856; bartender/part-owner Ross Coon told Mark Twain the frog-jump tale here. California Historical Landmark #734.',
    'Utica Mine disaster: December 1889 North Shaft cave-in (rain-loosened talcose ground) killed 17; only Thomas Corwin, Daniel Danielson, and August Anderson escaped via the south shaft.',
    'Twain\'s "The Celebrated Jumping Frog of Calaveras County": written from a tale Clemens heard at the Angels Hotel bar (rained in, 1865), published 1865; the Calaveras Jumping Frog Jubilee began in 1928 to mark the paving of Main Street.',
  ],
}

// ---------------------------------------------------------------------------
// JACKSON — Amador County seat. Deep hard-rock quartz (Kennedy & Argonaut),
// the Kennedy Tailing Wheels, St. Sava (first Serbian Orthodox church in the
// Western Hemisphere), the 1922 Argonaut disaster. Public history.
// ---------------------------------------------------------------------------
const JACKSON: TownInvestigation = {
  townId: 'jackson',
  title: 'The Phantom Stope at Jackson',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Jackson, the Amador county seat — where the gold does not lie in the gravel but a mile straight DOWN, hauled up the Kennedy and Argonaut shafts that go deeper than almost any in the country. A stranger has been selling shares in a "new stope" said to be richer than either great mine, papered with ore reports and a stock certificate that reads almost true. The mine clerks swear no such drift was ever cut; the stranger swears the gold is down there waiting. Read the real places of this deep-rock town by their true grain, and you will learn which story the ground actually tells.',
  scenes: [
    {
      id: 'kennedy_mine',
      place: 'The Kennedy Mine — the headframe',
      art: 'kennedy_mine',
      witness: { name: 'Andrew Treloar', role: 'Cornish shift boss at the Kennedy hoist' },
      prompt:
        'Vane is selling stock in a stope he claims runs off the deep workings — ore richer than the Kennedy itself. But raw ore proves nothing until it is crushed and the gold counted. To make a salted sample read as a real assay, he needed ore "milled" and weighed on the record. Where in Jackson would a man have tailings processed — and a clever one have brass called gold?',
      clueEasy:
        'Treloar wipes the cable grease from his hands. "Our shaft drops near six thousand feet — deepest in the country. Ore that deep don\'t mean a thing till it\'s under the stamps and the law has weighed the waste. He didn\'t want my hoist. He wanted where the tailings are RECKONED."',
      clueHard:
        'Press him and he leans close. "Since \'12 the State won\'t let us foul the creek — every ton of waste has to be lifted over the hills and impounded, counted on the way. The big redwood wheels do the lifting. A man who controls what the wheels are seen to carry can fake a whole stope\'s worth of \'proven\' ore."',
      evidence: { label: 'ORE', value: 'A salted sample — brass filings sworn to be deep-stope gold' },
      answer: 'tailing_wheels',
      choices: [
        { id: 'tailing_wheels', label: 'The Kennedy Tailing Wheels — where the waste is lifted and reckoned' },
        { id: 'st_sava', label: 'St. Sava — the Serbian miners\' church' },
        { id: 'national_hotel', label: 'The National Hotel — the Main Street rooms' },
      ],
      feedback:
        'The wheels it is. Treloar has it right: ore this deep is only worth what the record says it is — and the record runs through the tailing wheels.',
      wrongHint:
        'Wrong heading. You waste a shift on the wrong level, and Vane moves another block of phantom shares.',
    },
    {
      id: 'tailing_wheels',
      place: 'The Kennedy Tailing Wheels — the impound flume',
      art: 'kennedy_mine',
      witness: { name: 'Mara Rakić', role: 'Serbian widow keeping the impound tally' },
      prompt:
        'At the wheels his "proven" ore came with a tonnage slip — for waste that, the tally shows, never crossed the wheels. To sell shares he needed buyers who trusted him, immigrant miners who would not check his story too hard. Where did Jackson\'s deep-mine men gather — the Serbs and Italians off the Kennedy and Argonaut — close enough to be flattered into buying?',
      clueEasy:
        'Mara sets down her ledger stick. "Four wheels, fifty-eight foot of redwood each, lifting eight hundred tons a day over two hills to the dam. The count is honest. His slip wasn\'t — ore he says crossed here, that I never wheeled. The men he gulled are MY people. He found them where they pray."',
      clueHard:
        'She crosses herself. "The Kennedy and Argonaut men came from Herzegovina and the Bay of Kotor. They built their own church up the Main Street road — first of its kind in this whole country — and a man wanting trust from miners goes where miners are gathered and open-handed. That\'s where he passed the paper."',
      evidence: { label: 'TONNAGE', value: 'An impound slip for waste ore the wheels never lifted' },
      answer: 'st_sava',
      choices: [
        { id: 'st_sava', label: 'St. Sava — the Serbian miners\' church up Main Street' },
        { id: 'argonaut', label: 'The Argonaut hoist works — the rival mine office' },
        { id: 'courthouse', label: 'The Amador County courthouse records' },
      ],
      feedback:
        'St. Sava. The wheels keep an honest count, so the lie had to be sold elsewhere — among the very miners whose church the deep mines built.',
      wrongHint:
        'No. The honest tally holds, but you read the wrong line and the widow\'s neighbors lose another week\'s wages to the paper.',
    },
    {
      id: 'st_sava',
      place: 'St. Sava Serbian Orthodox Church — the burial register',
      art: 'jackson',
      witness: { name: 'Father Sava Petrović', role: 'parish priest keeping the register of the dead' },
      prompt:
        'The church keeps the truest record in Jackson: who lived, who died, and when. Vane\'s phantom stope is supposedly worked by a crew of deep miners he names as witnesses. If those men are real, the register will show them at work. What does the book reveal?',
      clueEasy:
        'Father Sava turns the page slowly. "The men he names as digging his rich stope — half of them are written HERE, in my book of the dead. They went down the Argonaut in \'22 and the fire took them. Forty-seven souls, sealed below for three weeks. A dead man cannot witness a strike."',
      clueHard:
        'He closes the register. "These were my parishioners — Serbs, Italians, Spaniards, trapped at the forty-six-hundred-foot level when the Argonaut burned. We buried what we could reach. The ground here remembers exactly who was lost and when. That is the one record a tare can never salt: the names of the honored dead."',
      evidence: { label: 'NAMES', value: 'His "stope crew" are men killed in the 1922 Argonaut fire' },
      answer: 'dead_witnesses',
      choices: [
        { id: 'dead_witnesses', label: 'His witnesses are men who died in the 1922 Argonaut disaster' },
        { id: 'wrong_parish', label: 'The crew belonged to a different parish entirely' },
        { id: 'no_record', label: 'There is no record of any crew at all' },
      ],
      feedback:
        'There it is. Vane staffed his phantom stope with the Argonaut dead — men whose names are written in the register of the lost. The fire is the one thing he could never counterfeit around.',
      wrongHint:
        'Not quite — the register holds, but you misread a name and Vane slips toward the next county.',
    },
  ],
  verdict:
    'You corner Cyrus Vane at the mine office, and the swindle falls apart in the order he built it: salted ore sworn to be deep-stope gold, an impound slip for waste the wheels never lifted, and a crew of "witnesses" who are in truth the honored dead of the Argonaut fire. One crime under all of it — the forgery of PRESENCE: claiming a strike, a tonnage, and living miners where none of it honestly stood. ' +
    'Which is the one thing this deep-rock country cannot do. The Kennedy shaft really plunges 5,912 feet — among the deepest gold mines in North America. The fifty-eight-foot tailing wheels really lifted hundreds of tons of waste a day over two hills after the 1912 anti-pollution law. And on August 27, 1922, the Argonaut fire really took 47 miners — the worst gold-mine disaster in California history, mourned at St. Sava, the first Serbian Orthodox church in the Western Hemisphere, raised by those very miners. The honest record of who was really here — and who was lost — is exactly what catches a man who was never honestly present at all.',
  sources: [
    'Kennedy Gold Mine, Jackson: shaft reached 5,912 ft — among the deepest gold mines in North America; California Historical Landmark No. 786 (with the Argonaut).',
    'Kennedy Tailing Wheels: four 58-ft redwood wheels built 1912 to lift tailings over two hills to an impound dam, after the 1912 state act compelled mines to impound tailings (two wheels still stand at Kennedy Tailing Wheels Park).',
    '1922 Argonaut Mine disaster: fire on Aug. 27, 1922 trapped 47 miners at the ~4,650-ft level; the worst gold-mine disaster in California history; led to major mine-safety reforms.',
    'St. Sava Serbian Orthodox Church, Jackson: consecrated 1894 — the first Serbian Orthodox church in the Western Hemisphere — built by Kennedy and Argonaut miners; on the National Register of Historic Places.',
  ],
}

// ---------------------------------------------------------------------------
// SAN ANDREAS — Calaveras County seat (from Mok Hill, 1866). The town of
// JUSTICE: courthouse + jail where Black Bart was tried/held in 1883, undone
// by a laundry mark. Perfect ground for a tare. Public history.
// ---------------------------------------------------------------------------
const SAN_ANDREAS: TownInvestigation = {
  townId: 'san_andreas',
  title: 'The Laundry Mark at San Andreas',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'San Andreas, the Calaveras county seat — the town of justice on the Mother Lode, where the gentleman robber Black Bart was once tried in the courthouse and jailed behind it, undone by a single laundry mark on a dropped handkerchief. Now Cyrus Vane works the same trick in reverse: passing himself as a respectable "mining engineer," buying on credit against an estate and a claim record that read almost true. The county clerk swears the deeds don\'t match the man; the man swears he is exactly who his papers say. Read the real places of this courthouse town by their true grain — for here, more than anywhere, a forged identity leaves a mark.',
  scenes: [
    {
      id: 'sa_courthouse',
      place: 'The old Calaveras County Courthouse',
      art: 'sa_courthouse',
      witness: { name: 'Reuben Cole', role: 'county clerk in the courthouse records room' },
      prompt:
        'Vane presents himself as a mining engineer with deeds to a worked claim — the same respectable mask Black Bart wore before the law stripped it. His papers are nearly perfect, but a forged identity is only as good as where it can be checked. Where in San Andreas would a man\'s true name and history be held against the record — the place a tare most needs to corrupt?',
      clueEasy:
        'Cole taps a thick deed-book. "This courthouse has stood since the county seat came here from Moke Hill. Every claim, every name, every conviction is written down — this is the very room where Black Bart was tried. A false man\'s papers die HERE, if the record\'s honest. So he needs the record bent before anyone reads it twice."',
      clueHard:
        'He lowers his voice. "Bart played a mining engineer too — right up until they matched the mark on his handkerchief to a San Francisco laundry. The courthouse convicts on what a man leaves behind. Vane knows it. The one place he can\'t talk his way past is where they LOCK what they\'ve proven — and that\'s out the back."',
      evidence: { label: 'IDENTITY', value: 'A forged "mining engineer" — the same mask Black Bart wore' },
      answer: 'old_jail',
      choices: [
        { id: 'old_jail', label: 'The old jail behind the courthouse — where the proven are held' },
        { id: 'hall_of_records', label: 'The Hall of Records — the deed and document vault' },
        { id: 'mokelumne_hill', label: 'Mokelumne Hill — the former county seat down the road' },
      ],
      feedback:
        'The old jail. Cole is right: the courthouse tries a man on what he leaves behind, and what it proves, it locks out back. That is where Bart was held — and where Vane\'s mask will fail.',
      wrongHint:
        'Wrong door. You lose the morning in the wrong office while Vane re-papers his story.',
    },
    {
      id: 'old_jail',
      place: 'The old San Andreas jail — Black Bart\'s cell',
      art: 'sa_courthouse',
      witness: { name: 'Hattie Doyle', role: 'jailer\'s wife who keeps the prisoners\' property book' },
      prompt:
        'In the jail they keep every prisoner\'s effects, named and listed — the way Bart\'s own belongings betrayed him. Vane\'s claim of a long, settled history rests on documents he says were filed years ago. To prove or break that, you need the office that DATES every deed and certificate. Where in San Andreas is the true age of a paper recorded?',
      clueEasy:
        'Hattie opens the property book. "We list what a man carries — same as how they took Bart\'s Bible with his real name inked inside. Marks and dates, that\'s what undoes a liar. Vane\'s deeds claim to be old. There\'s exactly one building in town that can swear when a paper was truly filed."',
      clueHard:
        'She runs a finger down the dated entries. "Bart was caught because a handkerchief carried a laundry mark — F-X-O-seven — that pinned WHEN and WHERE. Same principle: a deed carries the mark of the office and the day it was recorded. The stone hall on Main keeps those dates, and a date is the one thing a tare can\'t talk over."',
      evidence: { label: 'MARK', value: 'Deeds bearing recording marks — the date is the tell, as the laundry mark was for Bart' },
      answer: 'hall_of_records',
      choices: [
        { id: 'hall_of_records', label: 'The Hall of Records — where every deed\'s true date is kept' },
        { id: 'mokelumne_hill', label: 'Mokelumne Hill — the old courthouse before the move' },
        { id: 'sa_courthouse', label: 'Back to the courthouse trial bench' },
      ],
      feedback:
        'The Hall of Records. Hattie has it: a man is undone by the mark and date he can\'t erase — a laundry tag for Bart, a recording stamp for Vane.',
      wrongHint:
        'No. The property book holds, but you chase the wrong ledger and Vane buys himself another day of respectability.',
    },
    {
      id: 'hall_of_records',
      place: 'The Hall of Records — the deed register',
      art: 'san_andreas',
      witness: { name: 'Imelda Vásquez', role: 'recorder\'s assistant, granddaughter of the 1848 founders' },
      prompt:
        'The Hall of Records dates every deed by the recorder\'s own mark. Vane swears his claim was filed and his presence here goes back years. If that were true, the register would carry his recording date. What does the deed register actually show?',
      clueEasy:
        'Imelda turns the heavy register toward you. "My people founded this camp in \'48 — Mexican miners, before it was ever a county seat. Every honest filing since is dated in this book. Vane\'s deed? The recording mark on it is THIS season. He pasted an old story onto a new paper — and the date won\'t lie even when he does."',
      clueHard:
        'She taps the recorder\'s stamp. "It\'s the courthouse trick once more, the Black Bart trick — the mark betrays the man. A laundry tag fixed Bart in time and place; this recording mark fixes Vane. He was never the long-settled engineer he plays. The register knows the true day, and the true day says he just arrived."',
      evidence: { label: 'DATE', value: 'A this-season recording mark on a deed Vane swore was years old' },
      answer: 'fresh_filing',
      choices: [
        { id: 'fresh_filing', label: 'The deed was recorded THIS season — too new to be his old claim' },
        { id: 'wrong_name', label: 'The deed was filed under a different name entirely' },
        { id: 'no_record', label: 'There is no record of the deed at all' },
      ],
      feedback:
        'There it is. A fresh recording mark on a deed he swore was years old. The date is his laundry mark — the one tell he could never launder out.',
      wrongHint:
        'Not quite — the register holds, but you read the wrong column and Vane edges toward the county line.',
    },
  ],
  verdict:
    'You corner Cyrus Vane in the very courthouse town that once unmasked Black Bart, and his disguise falls apart in the order he built it: a forged "mining engineer" identity, deeds dressed up as old history, and a recording mark that dates the whole story to this season. One crime under all of it — the forgery of PRESENCE: claiming a name, a settled history, and a standing in this town that he never honestly held. ' +
    'Which is exactly what San Andreas was built to catch. Mexican miners really founded the camp in 1848, naming it for St. Andrew. It really took the county seat from Mokelumne Hill in 1866. And in 1883, in this courthouse, the gentleman robber Black Bart — Charles Boles, who posed as a respectable mining engineer — was tried and jailed after Wells Fargo\'s James Hume traced a handkerchief\'s laundry mark, F.X.O.7, through the San Francisco laundries to his door. A town that convicts a legend on a laundry tag has no trouble convicting a tare on a recording date. The mark a man leaves behind always tells his true name.',
  sources: [
    'San Andreas, Calaveras County: founded by Mexican gold miners in 1848, named for the parish of St. Andrew; became the county seat, taking it from Mokelumne Hill (1866).',
    'Old Calaveras County Courthouse, San Andreas: served as courthouse for ~100 years, now the Calaveras County Historical Society / museum complex; site of Black Bart\'s 1883 trial.',
    'Black Bart (Charles E. Boles): 28 documented stagecoach robberies, 1875–1883; his final 1883 robbery near Funk Hill dropped a handkerchief with laundry mark F.X.O.7, which Wells Fargo detective James B. Hume traced through San Francisco laundries to his door; tried at San Andreas.',
    'San Andreas Hall of Records: a stone Romanesque building on Main Street, part of the courthouse/justice complex that made San Andreas the county\'s seat of record.',
  ],
}

// ---------------------------------------------------------------------------
// NEVADA CITY — the hydraulic-mining seat. The wealth came down a nozzle and
// the ruin went down the river (the 1884 Sawyer Decision). Public history.
// ---------------------------------------------------------------------------
const NEVADA_CITY: TownInvestigation = {
  townId: 'nevada_city',
  title: 'The Washed Provenance of Nevada City',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Nevada City, where the gold did not come up out of the ground so much as it was BLASTED out of the hillsides — washed down by giant water-cannon and carried, with whole mountainsides of mud, down into the rivers below. A stranger has arrived at the grandest hotel on Broad Street, spending freely and telling everyone his fortune came from a clean, lawful claim — not from the hydraulic monitors a federal judge had only just shut down for burying the valley farms. He is buying himself a respectable past. Read the real places of this town by their true grain, and the ground will tell you where his money was really washed.',
  scenes: [
    {
      id: 'national_hotel',
      place: 'The National Exchange Hotel (211 Broad Street, est. 1856)',
      art: 'nevada_city',
      witness: { name: 'Cora Bicknell', role: 'desk clerk at the National' },
      prompt:
        'Vane took the best rooms and paid in heavy double-eagles, telling the lobby his stake came from honest lode rock — never from a hydraulic claim. But he asked, quietly, for an evening of "respectable culture" to be seen at, and a way to make his name look long-settled in town. Where would a man go to be SEEN as a gentleman of Nevada City?',
      clueEasy:
        'Cora keeps her voice low. "He didn\'t want the saloons. He wanted the one place a stranger can buy himself a reputation in a single night — the playhouse up Broad Street, the oldest stage standing in all California. Be applauded there and folks forget to ask where your money came from."',
      clueHard:
        'Press her and she slides the register around. "He signed in the same week the courts shut the big diggings for choking the rivers. A man with hydraulic dust burning a hole in his pocket needs a clean face fast — and there\'s only ONE house in this town grand enough that Mark Twain himself stood on its boards. That\'s where he went to be reborn respectable."',
      evidence: { label: 'TIMING', value: 'Checked in the week the hydraulic mines were enjoined — money in a hurry to look clean' },
      answer: 'nevada_theatre',
      choices: [
        { id: 'nevada_theatre', label: 'The Nevada Theatre — oldest stage in California; Twain lectured here' },
        { id: 'firehouse', label: 'Firehouse No. 1 — the volunteer engine company' },
        { id: 'courthouse', label: 'The county courthouse on Church Street' },
      ],
      feedback:
        'The Nevada Theatre. Cora reads him right — a fresh fortune buys a respectable face fastest under stage-lights, on the oldest boards in the state.',
      wrongHint:
        'Wrong door. You waste the evening among the wrong crowd, and Vane takes his bow without you watching.',
    },
    {
      id: 'nevada_theatre',
      place: 'The Nevada Theatre (Broad Street, opened 1865)',
      art: 'nevada_city',
      witness: { name: 'Ambrose Niles', role: 'stage manager, on the boards since Twain lectured here' },
      prompt:
        'At the theatre Vane bought a private box and let it be known he was a "lode man," a deep-rock gentleman — anything but a hydraulic operator. But the doorman saw the mud on his boots: not the dry grit of a tunnel, but pale washed clay. To have made that money he had to have run a MONITOR somewhere upriver. Where did the great water-cannon actually tear the gold from the mountain?',
      clueEasy:
        'Ambrose wipes a hand on his apron. "Lode man? His boots were caked in that white slick clay — that\'s NOZZLE country, the washed gravel up northeast of here where they aim the water-guns at whole hillsides. No tunnel leaves that on a man."',
      clueHard:
        'He leans on the rail where Twain once stood. "There\'s one diggings up the ridge so big it became the name for all of it — the pit that Judge Sawyer shut in \'84 for burying the Yuba and the valley farms in slickens. THAT\'s where hydraulic gold like his was washed loose. He\'s scrubbing the name off the very mine the law just condemned."',
      evidence: { label: 'CLAY', value: 'Pale washed hydraulic slick on a man claiming to be a deep-rock miner' },
      answer: 'malakoff',
      choices: [
        { id: 'malakoff', label: 'The Malakoff / North Bloomfield diggings — the great hydraulic pit shut by the Sawyer Decision' },
        { id: 'empire', label: 'The Empire deep-rock lode at Grass Valley' },
        { id: 'broad_street', label: 'The shops along lower Broad Street' },
      ],
      feedback:
        'Malakoff it is. The washed clay never lies — that gold came down a nozzle, out of the very diggings the federal court had just condemned.',
      wrongHint:
        'No nozzle there. You chase a deep-rock story that the mud on his boots already disproved, and the trail washes out.',
    },
    {
      id: 'malakoff',
      place: 'The North Bloomfield diggings & the South Yuba ditches',
      art: 'ch5_hydraulic_scar',
      witness: { name: 'Wing Toy', role: 'ditch-tender on the South Yuba canal' },
      prompt:
        'Up at the diggings the scar is plain: cliffs washed to bone, the river below running gray with slickens. Vane swears his claim was "lawful and downstream of no one." But the water that powered his monitor came from somewhere — miles of hand-dug canal carrying the South Yuba to the nozzles. The ledger of WHO bought that water, and WHEN, is the one tally he cannot wash away. What in it catches him?',
      clueEasy:
        'Wing Toy runs the gate chain through his hands. "Every monitor pays for its water by the miner\'s-inch, by the day, in MY book. His claim says it never ran. But the book says he bought a head of water — AFTER the judge ordered every nozzle in the district shut. He mined when mining was already a crime."',
      clueHard:
        'He latches the gate. "The water remembers honestly — the date it was drawn and the gate it ran through. Sawyer\'s decree of \'84 made hydraulicking the valley a wrong in the eyes of the law. Vane\'s purchases run right past that date. His \'clean lawful claim\' is gold washed loose AFTER the law forbade it — and the ditch ledger is the witness he forgot to buy."',
      evidence: { label: 'DATE', value: 'Water-purchases logged after the Sawyer injunction — mining made unlawful' },
      answer: 'after_decree',
      choices: [
        { id: 'after_decree', label: 'His water was bought AFTER the Sawyer Decision — too late to be lawful' },
        { id: 'no_record', label: 'There is no record of his water rights at all' },
        { id: 'wrong_ditch', label: 'The water came from a different canal entirely' },
      ],
      feedback:
        'There it is. The ditch ledger holds him: gold washed loose after the law forbade the washing. The dates are the one thing he could never scrub clean.',
      wrongHint:
        'Not quite — the canal book holds the truth, but you read the wrong gate, and Vane lets a season of slickens muddy his trail.',
    },
  ],
  verdict:
    'You corner Cyrus Vane between the grand hotel and the gray river, and his clean story collapses in the order he built it: a respectable face bought under stage-lights, a "deep-rock" lie betrayed by hydraulic clay, and a claim "lawful and downstream of no one" undone by a ditch-ledger dated after the court had outlawed the very mining that made him rich. One crime under all of it — the forgery of PROVENANCE: washing a respectable origin onto money that was torn from a condemned hillside and dumped on the farms below. ' +
    'Which is the one thing this country will not let him do. The National really opened on Broad Street in 1856 and stands yet. Mark Twain really lectured on the Nevada Theatre\'s boards, the oldest stage in California. And the Malakoff diggings really did bury the Yuba in slickens until Judge Lorenzo Sawyer\'s 1884 decision — the first environmental ruling in the nation\'s history — made the washing a crime. The river kept the date. A tare cannot.',
  sources: [
    'National Exchange Hotel, 211 Broad Street — opened August 1856; California Historical Landmark #899; one of the oldest continuously operating hotels in the West.',
    'Nevada Theatre, Broad Street — opened 1865; California\'s oldest existing theatre building; Mark Twain lectured there in 1866.',
    'Malakoff Diggins / North Bloomfield Gravel Mining Co., NE of Nevada City — the largest hydraulic gold operation in California; produced hundreds of millions of cubic yards of debris ("slickens").',
    'Woodruff v. North Bloomfield Gravel Mining Company — Judge Lorenzo Sawyer\'s January 1884 decision enjoining hydraulic mining; widely credited as the first environmental ruling in U.S. history.',
  ],
}

// ---------------------------------------------------------------------------
// GRASS VALLEY — the deep hard-rock seat. Cornish tunnels, the world's biggest
// Pelton wheel, and the manufactured celebrity of Lola Montez & Lotta Crabtree.
// Cyrus Vane forges FAME itself. Public history.
// ---------------------------------------------------------------------------
const GRASS_VALLEY: TownInvestigation = {
  townId: 'grass_valley',
  title: 'The Counterfeit Somebody of Grass Valley',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Grass Valley, where the gold lay deep in quartz lodes a mile underground — not in the streambeds, but locked in hard rock that took Cornish miners, steam pumps, and the largest water wheel on earth to reach. It is also the town that minted FAME: where the scandalous dancer Lola Montez kept a salon, and where she taught a little girl named Lotta Crabtree to sing for the miners. A stranger has come selling shares in a "fabulous deep lode" and a reputation to match — a celebrated man, he says, known on two continents. But a town that can tell real ore from worthless rock a mile down can surely tell a real somebody from a tare. Read its true places, and find where his fame was forged.',
  scenes: [
    {
      id: 'empire_mine',
      place: 'The Empire Mine & the Bourn Cottage',
      art: 'grass_valley',
      witness: { name: 'Tamsin Trezise', role: 'pay-office clerk at the Empire' },
      prompt:
        'Vane is selling shares in a "deep lode richer than the Empire itself," waving an assay and a grand manner. But the Empire\'s own clerk knows what real deep gold costs to win — the timbering, the pumps, the miles of drift. To sell his lie he needs men who can fake the LOOK of a working deep mine: square-set timber, a Cornish pump, ore that seems to come up from far down. Where does the skill to build a convincing deep mine actually live in this town?',
      clueEasy:
        'Tamsin counts coin without looking up. "His \'lode\' has no headframe, no pump, no Cornishmen. Real deep gold in this valley is won by ONE people — the Cousin Jacks, three in four of every man underground. Want a deep mine to LOOK real? You hire the men from the other great mine, the one with the giant wheel that runs the pumps."',
      clueHard:
        'She slides the pay-book shut. "Mr. Bourn built his \'cottage\' out of the mine\'s own waste rock — even the rich don\'t fake what the ground gives. Vane has no such ground. The men who could dress a hole to pass for the Empire all draw their pay up at the North Star, under the biggest Pelton wheel in the world. That\'s where the craft of a deep mine — real or forged — is kept."',
      evidence: { label: 'ABSENCE', value: 'A "deep lode" with no headframe, no Cornish pump, and no Cousin Jacks' },
      answer: 'north_star',
      choices: [
        { id: 'north_star', label: 'The North Star Mine — Cornish crews and the world\'s largest Pelton wheel' },
        { id: 'malakoff', label: 'The Malakoff hydraulic diggings near Nevada City' },
        { id: 'national_hotel', label: 'The National Hotel over in Nevada City' },
      ],
      feedback:
        'The North Star. Tamsin has it right — the craft to make a deep mine look real lives with the Cornishmen under the great wheel, and that is exactly what a forger of lodes must hire.',
      wrongHint:
        'Wrong shaft. You burn the day where no deep-rock men work, and Vane sells another block of worthless shares.',
    },
    {
      id: 'north_star',
      place: 'The North Star Powerhouse & the world\'s largest Pelton wheel',
      art: 'grass_valley',
      witness: { name: 'Jago Pengelly', role: 'Cornish pumpman ("Cousin Jack") at the North Star' },
      prompt:
        'At the North Star the great Pelton wheel turns the pumps that keep the deep workings dry. Vane tried to hire Cornishmen to dress his fake lode — but Jago, sharing his pasty at the change-house, noticed the stranger knew none of their ways: not the pasty, not the prayers, not a word of the trade. A man claiming two continents of fame should at least be REMEMBERED somewhere. Where in Grass Valley is real, lasting fame actually MADE — the test a counterfeit celebrity would fail?',
      clueEasy:
        'Jago folds the crust of his pasty — "the miner\'s handle," he calls it. "He played at being famous, but no Cousin Jack had heard his name, and fame here isn\'t mined, it\'s MADE — on Mill Street, in the house of the dancer who scandalized kings and taught a little maid to charm the whole camp. Real fame in this valley has a HOME. His has none."',
      clueHard:
        'He wipes his hands. "Down on Mill Street the dancer Lola Montez kept her salon and her pet bear, and taught the child Lotta Crabtree to sing and dance for us miners — Lotta went on to be loved across the nation. THAT is how fame is truly made here: lived in a real house, on a real street, remembered by real people. Vane has a reputation with no address. Go to where fame keeps a house, and his will have none."',
      evidence: { label: 'IGNORANCE', value: 'A "world-famous" man who knows neither the pasty nor a single Cornish way' },
      answer: 'lola_montez',
      choices: [
        { id: 'lola_montez', label: 'The Home of Lola Montez on Mill Street — where Lotta Crabtree was mentored' },
        { id: 'empire_mine', label: 'Back to the Empire Mine pay-office' },
        { id: 'nevada_theatre', label: 'The Nevada Theatre over in Nevada City' },
      ],
      feedback:
        'The Lola Montez house. Jago names the test exactly — real fame here keeps a real address, and a counterfeit somebody has none.',
      wrongHint:
        'Not there. You look for fame where only ore is won, and Vane\'s borrowed name slips away unproven.',
    },
    {
      id: 'lola_montez',
      place: 'The Home of Lola Montez, Mill Street',
      art: 'grass_valley',
      witness: { name: 'Lotta Crabtree', role: 'child performer, Lola Montez\'s pupil' },
      prompt:
        'On Mill Street, in the dancer\'s old parlor, Vane\'s grand story meets the one thing it cannot survive: living memory. He claimed to have shared this very salon, to have been toasted here in Lola\'s day, a celebrated man among celebrated company. But the people who were actually HERE are still alive to be asked. What in their memory unmasks him?',
      clueEasy:
        'Lotta sets down her banjo. "He says he was feted in this house in Lola\'s time. But I was the child who danced in this parlor, and I remember every face that ever sat in it. His was never one of them. You cannot have BEEN somewhere you were never seen."',
      clueHard:
        'She touches the doorframe. "Lola left Grass Valley in \'55; she taught me here before I was seven. Anyone truly famous in this house is in MY memory and the town\'s — named, dated, remembered. Vane has a fame with no witness, a past with no one in it. That is the whole of his trick: a celebrated life that no living soul can recall sharing. The empty chair is the proof."',
      evidence: { label: 'MEMORY', value: 'A "celebrated" guest whom not one living witness ever saw in the salon' },
      answer: 'no_witness',
      choices: [
        { id: 'no_witness', label: 'No one who was actually here remembers him — fame with no witness' },
        { id: 'wrong_year', label: 'He named a year after Lola had already left town' },
        { id: 'fake_house', label: 'He described the wrong house entirely' },
      ],
      feedback:
        'There it is. The empty chair convicts him: a man cannot have been celebrated in a room that no one remembers him entering. The town\'s memory is the witness he could never buy.',
      wrongHint:
        'Close, but you press the wrong recollection, and Vane spins his borrowed glory one more turn.',
    },
  ],
  verdict:
    'You corner Cyrus Vane in the dancer\'s old parlor, and his counterfeit collapses in the order he built it: a "deep lode" with no headframe and no Cousin Jacks, a claim to Cornish craft from a man who knew neither the pasty nor a single mining way, and a "celebrated" past in a salon that not one living soul remembers him entering. One crime under all of it — the forgery of FAME, the boldest face of his old trick: the forgery of PRESENCE. He sold not just gold he never dug, but a SOMEBODY he never was. ' +
    'Which is the one thing Grass Valley can always test. The Empire really was among the richest, deepest hard-rock mines in California, and Bourn really built his cottage from the mine\'s own waste rock. The North Star\'s Cornish crews really ran the world\'s largest Pelton wheel, and the pasty really was the miner\'s handheld meal. And Lola Montez really kept her Mill Street home and really taught the child Lotta Crabtree to charm the miners, until Lotta\'s fame outshone the dancer\'s own. Real fame here keeps a house, an address, a living memory. A tare keeps only the empty chair.',
  sources: [
    'Empire Mine State Historic Park, Grass Valley — among California\'s oldest, deepest, and richest gold mines (~367 miles of underground passages); the Bourn "Cottage" built of mine waste rock for owner William Bowers Bourn.',
    'North Star Mine & Powerhouse, Grass Valley — its 1890s powerhouse housed the largest Pelton (tangential) water wheel in the world (~30 ft); about three-quarters of its miners were Cornish ("Cousin Jacks").',
    'Cornish mining culture in Grass Valley — Cornish miners introduced the Cornish pump and the Cornish pasty, the handheld miner\'s meal, central to the district\'s life.',
    'Home of Lola Montez (Mill Street; CHL #292) — Montez lived in Grass Valley 1853–1855 and mentored the child Lotta Crabtree, who became a beloved national entertainer.',
  ],
}

// ---------------------------------------------------------------------------
// MARIPOSA — the southern gateway. Frémont's "floating" Las Mariposas grant,
// the 1854 courthouse, the Pine Tree mineral-rights war. The floating-boundary
// fraud is a perfect "forgery of presence." Public history.
// ---------------------------------------------------------------------------
const MARIPOSA: TownInvestigation = {
  townId: 'mariposa',
  title: 'The Floating Grant at Mariposa',
  villain: 'Cyrus Vane — "the Tare"',
  setup:
    'Mariposa — "the butterflies," named in 1806 when Moraga\'s party found a creek clouded with them, and later the seat of the county so vast it was called the Mother of Counties. This was Frémont\'s country: a Mexican grant of ten square leagues whose boundaries had never been honestly walked — a claim that could FLOAT to wherever the gold turned out to be. Now a stranger is doing the same trick in miniature, swearing his lines were surveyed and his quartz was his, on land he never truly bounded. Read the real places of this town by their true grain, and you will find where his floating boundary finally has to touch the ground.',
  scenes: [
    {
      id: 'las_mariposas_grant',
      place: 'Las Mariposas — the floating Mexican grant',
      art: 'welcome_gate',
      witness: { name: 'Thomas Larkin', role: 'U.S. consul who bought the grant' },
      prompt:
        'Vane waves a deed for "ten square leagues" with no fixed corners — a grant he claims can be laid down wherever he pleases, exactly as Frémont once slid his boundaries onto the gold. To make the float look legal he needs it confirmed by the highest authority. Where would such a contested, unbounded Mexican grant finally be ruled valid?',
      clueEasy:
        'Larkin spreads the old papers. "The grant Micheltorena signed to Alvarado in \'44 had no surveyed lines — just outer limits between the Merced, the Chowchilla and the Sierra. A man could move ten leagues inside that like a tile on a board. Only one bench ever blessed that kind of float."',
      clueHard:
        'He lowers his voice. "Frémont\'s title rode all the way to Washington. The Supreme Court confirmed Las Mariposas in 1854 — Frémont v. United States — and let a FLOATING claim stand. Vane studied that ruling. He\'s not forging gold; he\'s forging the right to BE somewhere. Find where that float gets stamped honest and you find his model."',
      evidence: { label: 'GRANT', value: 'Ten square leagues with no surveyed corners — a boundary that floats to the gold' },
      answer: 'courthouse',
      choices: [
        { id: 'courthouse', label: 'The Mariposa County Courthouse — where title and mineral right were tried' },
        { id: 'mariposa_grove', label: 'The Mariposa Grove of giant sequoias' },
        { id: 'mount_ophir', label: 'Mount Ophir — the assay and mint camp' },
      ],
      feedback:
        'The courthouse. A floating grant only becomes a fence when a court draws the line — and Mariposa\'s court drew the lines that made mining law in the West.',
      wrongHint:
        'Wrong ground. You chase the boundary across country that was never his, and Vane gains a day on the float.',
    },
    {
      id: 'courthouse',
      place: 'The Mariposa County Courthouse (1854)',
      art: 'sa_courthouse',
      witness: { name: 'The sitting judge', role: 'on the Mariposa bench' },
      prompt:
        'In court Vane swears his grant carries the QUARTZ beneath it — the lode, not just the grass. That is the very question Frémont fought here: did a grazing grant also own the gold in the rock? To prove his stolen lode is "his," Vane must seize the working mine itself. Which mine on the estate did the fight over mineral right actually come to blows over?',
      clueEasy:
        'The judge taps the docket. "This bench, built of local timber in \'54, is the oldest court still sitting west of the Rockies — and it heard whether Frémont\'s grant owned the quartz. The Merced Mining Company said no: grass only. The fight didn\'t stay in this room. Men went up the hill with guns."',
      clueHard:
        'He leans in. "In \'58 armed men of the Merced company SEIZED the lode — a standoff until the governor ordered them off. Then the courts flipped: against Frémont in \'58, for him in \'59, in Biddle Boggs v. Merced Mining. The mine they spilled blood over is the one whose name the whole battle carries. Go to the lode itself."',
      evidence: { label: 'TITLE', value: 'A grant claimed to carry the QUARTZ — contested mineral right, settled by gunfire then by court' },
      answer: 'pine_tree_mine',
      choices: [
        { id: 'pine_tree_mine', label: 'The Pine Tree / Josephine quartz mine — the seized lode' },
        { id: 'princeton_mine', label: 'The Princeton Mine at Mount Bullion' },
        { id: 'mariposa_grove', label: 'The Mariposa Grove of giant sequoias' },
      ],
      feedback:
        'The Pine Tree it is. The "Battle of the Pine Tree" was real — guns over a quartz lode, then a court that made the mineral law of the West. That contested ground is where Vane\'s float must finally touch rock.',
      wrongHint:
        'Not that claim. The Princeton was rich, but it wasn\'t the lode men seized at gunpoint — and the trail cools while you read the wrong vein.',
    },
    {
      id: 'pine_tree_mine',
      place: 'The Pine Tree / Josephine Mine — the seized lode',
      art: 'big_trees',
      witness: { name: 'Bridget', role: 'quartz-mill hand at the stamps' },
      prompt:
        'At the lode the miners keep the one record a floating man can never salt: where the vein actually RUNS, foot by foot underground. If Vane\'s grant boundary "floated" onto this quartz only on paper, the rock itself will betray that his line never honestly crossed the lode. What in the workings catches him out?',
      clueEasy:
        'Bridget wipes quartz dust off the ledger. "A grant can float on a map. A vein can\'t. We logged every drift and where the ore pinched — and his claimed corner sits in barren country, nowhere near the pay-rock. His boundary touches gold only in ink."',
      clueHard:
        'She sets down the lamp. "That was the whole Mariposa lie, large and small: Frémont slid his leagues onto OTHER men\'s diggings; Vane slid his onto ours. But the lode keeps an honest record — the actual run of the quartz, surveyed underground by men who broke it. A tare can forge a deed. He can\'t move where the gold really lies."',
      evidence: { label: 'VEIN', value: 'His "floated" boundary touches the pay-rock only on paper — the underground survey says barren' },
      answer: 'floated_boundary',
      choices: [
        { id: 'floated_boundary', label: 'His boundary "floats" onto the lode only in ink — the vein runs elsewhere' },
        { id: 'salted_quartz', label: 'The quartz samples were salted with imported gold' },
        { id: 'forged_deed', label: 'The Mexican deed itself is a forgery' },
      ],
      feedback:
        'There it is. The lode is logged honestly underground, and his line never truly crosses it. He forged a presence on the gold — but the rock knows where the gold really is.',
      wrongHint:
        'Close, but you read the wrong drift. The vein holds its secret a little longer and Vane slips toward the float\'s next corner.',
    },
  ],
  verdict:
    'You corner Cyrus Vane at the Pine Tree, and the trick falls apart in the order he built it: a deed with no honest corners, a court claim that the grant carried the quartz, and a boundary that "floats" onto the richest lode only in ink. One crime under all of it — the forgery of PRESENCE: swearing he had surveyed, bounded, and worked ground where he never honestly stood. ' +
    'It is the oldest Mariposa story, told small. The Las Mariposas grant really was a floating ten leagues that Frémont slid onto the gold; the Supreme Court really confirmed it in 1854; men really seized the Pine Tree at gunpoint in 1858 and the courts really flipped before settling the mineral law of the West. And against all that floating stands the one thing that cannot drift: the Mariposa County Courthouse, raised in 1854 of local timber and hand-cut joinery, oldest court still sitting west of the Rockies — a real place, honestly built and never moved, where a floating boundary is finally made to touch the ground.',
  sources: [
    'Fremont v. United States, 58 U.S. (17 How.) 542 (1855): the U.S. Supreme Court confirmed the "floating" Las Mariposas grant — ten square leagues (~44,387 acres) granted by Gov. Micheltorena to Juan B. Alvarado in 1844, bought for Frémont by consul Thomas O. Larkin in 1847.',
    'Rancho Las Mariposas: Frémont repositioned his floating ten leagues onto mineral land (Pine Tree & Josephine quartz mines); the 1858 "Battle of the Pine Tree" — armed Merced Mining Co. men seized the lode until the governor intervened; Biddle Boggs v. Merced Mining Co. ruled against Frémont (1858) then for him (1859).',
    'Mariposa County Courthouse (1854; California Historical Landmark #670): Greek Revival, built of locally-milled white pine with hand-cut joinery — the oldest courthouse in continuous use west of the Rockies, where rulings on federal mining title were made.',
    'Mariposa = Spanish "butterflies," named by Gabriel Moraga\'s party at Mariposa Creek in 1806; the Mariposa Grove of giant sequoias made the town the southern gateway to Yosemite.',
  ],
}

export const INVESTIGATIONS: Record<string, TownInvestigation> = {
  west_point: WEST_POINT,
  volcano: VOLCANO,
  mokelumne_hill: MOKELUMNE_HILL,
  murphys: MURPHYS,
  angels_camp: ANGELS_CAMP,
  jackson: JACKSON,
  san_andreas: SAN_ANDREAS,
  nevada_city: NEVADA_CITY,
  grass_valley: GRASS_VALLEY,
  mariposa: MARIPOSA,
}

export function getInvestigation(townId: string): TownInvestigation | undefined {
  return INVESTIGATIONS[townId]
}

export function hasInvestigation(townId: string): boolean {
  return townId in INVESTIGATIONS
}
