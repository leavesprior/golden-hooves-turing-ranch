/**
 * goldCountryCanon.ts — the ONE canonical registry of Gold Country places and people.
 *
 * DESIGN INTENT (DRAFT — Grok-before + Leif approval required before any CI wiring):
 * ---------------------------------------------------------------------------------
 * Gold Country history currently lives, and drifts, across THREE separate location
 * datasets — adventure (`src/app/adventure/data/*`), explore (`src/app/explore/data/*`),
 * and oregon (`src/app/oregon-trail/data/*`). The same real town gets a slightly
 * different founder, date, or "fact" in each, and accuracy erodes no matter how careful
 * any single writer is (see the 2026-07-20 team-of-agents audit:
 * memory/project-bobr-game-suite-teamofagents-audit-20260720.md).
 *
 * The fix is congruence: ALL narrative content should eventually reference the IDs in
 * this registry, never free-typed place/person strings. The three location datasets
 * should collapse to THIS registry + thin per-game *views* (a game picks which ids it
 * exposes and layers gameplay data on top), so a fact is corrected in exactly one place.
 *
 * RULES this registry encodes:
 *   1. One canonical entry per real place/person, keyed by a stable `id`.
 *   2. `names[]` holds every alias/spelling the content may use, so a lint can map any
 *      free-typed token back to a canonical id.
 *   3. Fiction is allowed ONLY with `fictional: true` AND a required `notes` explaining
 *      what is invented and why (e.g. an in-game character or dramatized mystery premise).
 *   4. Every entry carries a `sources[]` line (year + citation). New entries must add one.
 *   5. Culturally-sensitive Indigenous sites carry `needsTribalReview: true` and MUST NOT
 *      be shipped as coordinate-specific game destinations without tribal review.
 *
 * SEED SCOPE: this is a seed, not an exhaustive migration — it covers the entries the
 * 2026-07-20 audit verified accurate plus the ones it corrected. Provenance for the
 * accuracy calls: that audit's accuracy section is Codex web-verified.
 */

export interface CanonPlace {
  id: string
  /** Every alias / spelling content may use — the lint maps free tokens back to id. */
  names: string[]
  county: string
  /** Rough era or key year(s) the place is associated with in-game. */
  era: string
  /** true = a real historical place; pair with fictional:false. */
  real: boolean
  lat?: number
  lng?: number
  notes: string
  /** year + citation, at least one line. */
  sources: string[]
  /** Only true for invented in-game places; requires an explanatory `notes`. */
  fictional?: boolean
  /** Indigenous / sacred sites — do NOT ship coordinate-specific as a destination. */
  needsTribalReview?: boolean
}

export interface CanonPerson {
  id: string
  names: string[]
  lifespan?: string
  /** ids from `places` this person is tied to. */
  places: string[]
  real: boolean
  sources: string[]
  notes?: string
  /** Only true for fictional characters; requires an explanatory `notes`. */
  fictional?: boolean
}

// Common provenance tag for corrections applied 2026-07-20.
const AUDIT_2026_07_20 =
  'BOBR game-suite team-of-agents audit, 2026-07-20 (accuracy section Codex web-verified): memory/project-bobr-game-suite-teamofagents-audit-20260720.md'

export const places: CanonPlace[] = [
  {
    id: 'angels_camp',
    names: ['Angels Camp', 'Angels Camp (Old Town)', 'City of Angels Camp'],
    county: 'Calaveras',
    era: '1848–present',
    real: true,
    lat: 38.0684,
    lng: -120.5394,
    notes:
      'Gold Rush town in Calaveras County; setting of Twain\'s "Celebrated Jumping Frog." Founded 1848 by Henry Pinkney Angell (a shopkeeper) — NOT "George Angel" and NOT "brothers Henry and George," both of which were in the old content and are corrected.',
    sources: [
      '1848 founding by Henry Pinkney Angell; ' + AUDIT_2026_07_20,
    ],
  },
  {
    id: 'angels_hotel',
    names: ['Angels Hotel', 'Angels Hotel Bar', 'Angels Hotel (CHL 734)'],
    county: 'Calaveras',
    era: '1855',
    real: true,
    lat: 38.0679,
    lng: -120.5399,
    notes:
      'Stone hotel on Main Street, Angels Camp; where Twain heard the jumping-frog tale (winter 1864-65). California Historical Landmark No. 734. Built 1855, second story added 1857.',
    sources: ['California Historical Landmark No. 734 (Angels Hotel, built 1855); ' + AUDIT_2026_07_20],
  },
  {
    id: 'jackass_hill',
    names: ['Jackass Hill', 'Mark Twain Cabin', 'Mark Twain Cabin Replica', 'Twain Cabin'],
    county: 'Tuolumne',
    era: '1864–1865',
    real: true,
    lat: 37.9646,
    lng: -120.4438,
    notes:
      'Site (near Tuttletown, Tuolumne County) of the restored Mark Twain Cabin, built around the original fireplace/chimney, where Twain stayed with the Gillis brothers. CORRECTION: old content placed the Twain cabin "at Angels Camp" — it is on Jackass Hill in Tuolumne County. Coordinates approximate (town-level).',
    sources: ['Mark Twain Cabin, Jackass Hill, Tuolumne Co. (CHL 138); ' + AUDIT_2026_07_20],
  },
  {
    id: 'sutter_gold_mine',
    names: ['Sutter Gold Mine'],
    county: 'Amador',
    era: '1990s–present (modern tour mine)',
    real: true,
    lat: 38.3639,
    lng: -120.7741,
    notes:
      'Underground tour mine near Sutter Creek, AMADOR County. CORRECTION: old content listed it as an Angels Camp (Calaveras) attraction — it is in Amador County, ~30 min north of Angels Camp.',
    sources: ['Sutter Gold Mine, near Sutter Creek, Amador Co.; ' + AUDIT_2026_07_20],
  },
  {
    id: 'carson_hill',
    names: ['Carson Hill', 'Carson Hill Nugget Site'],
    county: 'Calaveras',
    era: '1854',
    real: true,
    lat: 38.0221,
    lng: -120.4949,
    notes:
      'Site of the 1854 Calaveras Nugget (~195 lb), the largest gold nugget found in California. CORRECTION: nugget 1854 value was ~$43,000 (old content said "$43,534").',
    sources: ['1854 Calaveras Nugget, Carson Hill, ~195 lb, valued ~$43,000; ' + AUDIT_2026_07_20],
  },
  {
    id: 'west_point',
    names: ['West Point'],
    county: 'Calaveras',
    era: '1844 (naming, by tradition)–present',
    real: true,
    lat: 38.3965,
    lng: -120.5269,
    notes:
      'Calaveras County town at a crossroads of Native American trading routes; named by tradition after Kit Carson passed through (1844). CORRECTION: the Kit Carson marker is at the corner of Highway 26 & Main Street — NOT a "Carson campsite/cemetery" location.',
    sources: ['West Point, Calaveras Co.; Kit Carson marker at Hwy 26 & Main; ' + AUDIT_2026_07_20],
  },
  {
    id: 'san_andreas',
    names: ['San Andreas'],
    county: 'Calaveras',
    era: '1866 (county seat)–present',
    real: true,
    lat: 38.196,
    lng: -120.6807,
    notes:
      'Calaveras County seat (from 1866). Black Bart was TRIED here in 1883. CORRECTION: he was ARRESTED in San Francisco (a handkerchief laundry mark from a Calaveras robbery was traced to an SF laundry), then brought to San Andreas — old content said he was "captured here."',
    sources: ['San Andreas, Calaveras county seat 1866; Black Bart trial 1883; ' + AUDIT_2026_07_20],
  },
  {
    id: 'mercer_caverns',
    names: ['Mercer Caverns'],
    county: 'Calaveras',
    era: '1885',
    real: true,
    lat: 38.1449,
    lng: -120.4552,
    notes:
      'Show cave near Murphys, discovered by prospector Walter J. Mercer. CORRECTION: discovery date is September 1, 1885 (old content said "September 23, 1885").',
    sources: ['Mercer Caverns, discovered Sept 1, 1885 by Walter J. Mercer; ' + AUDIT_2026_07_20],
  },
  {
    id: 'mokelumne_hill',
    names: ['Mokelumne Hill', 'Moke Hill', 'Mokehill'],
    county: 'Calaveras',
    era: '1848–present',
    real: true,
    lat: 38.3,
    lng: -120.71,
    notes:
      'Gold Rush town in Calaveras County; site of the 1851 "French War" mining-claim conflict. Former county seat before San Andreas.',
    sources: ['Mokelumne Hill, Calaveras Co.; French War 1851; ' + AUDIT_2026_07_20],
  },
  {
    id: 'kennedy_mine',
    names: ['Kennedy Mine'],
    county: 'Amador',
    era: '1860–1942',
    real: true,
    lat: 38.3542,
    lng: -120.7644,
    notes: 'Jackson, Amador County. One of the deepest gold mines in North America at 5,912 ft.',
    sources: ['Kennedy Mine, Jackson, 5,912 ft; ' + AUDIT_2026_07_20],
  },
  {
    id: 'argonaut_mine',
    names: ['Argonaut Mine'],
    county: 'Amador',
    era: '1850s–1942',
    real: true,
    lat: 38.3489,
    lng: -120.7719,
    notes:
      'Jackson, Amador County. Site of the Aug 27, 1922 fire disaster — 47 miners died, California\'s worst gold-mining disaster. Argonaut + Kennedy = California Historical Landmark No. 786.',
    sources: ['Argonaut Mine disaster, Aug 27, 1922, 47 dead; CHL No. 786; ' + AUDIT_2026_07_20],
  },
  {
    id: 'calaveras_fairgrounds',
    names: ['Calaveras County Fairgrounds', 'Frog Jump Jubilee', 'Jumping Frog Jubilee'],
    county: 'Calaveras',
    era: '1928–present',
    real: true,
    lat: 38.0561,
    lng: -120.5486,
    notes:
      'Home of the Jumping Frog Jubilee (annual since 1928, Angels Camp). Record: 21 ft 5¾ in by Rosie the Ribeter, 1986.',
    sources: ['Calaveras County Frog Jump, held since 1928; Rosie the Ribeter record 1986; ' + AUDIT_2026_07_20],
  },
  {
    id: 'ironstone_vineyards',
    names: ['Ironstone Vineyards', 'Ironstone Heritage Museum'],
    county: 'Calaveras',
    era: '1994–present',
    real: true,
    lat: 38.1256,
    lng: -120.4646,
    notes:
      'Winery in Murphys displaying "Ironstone\'s Crown Jewel," the largest crystalline gold-leaf specimen found in California (~44 lb), unearthed at Jamestown (Tuolumne Co.) Dec 24, 1992, acquired by the Kautz family in 1994. The specimen was NOT found at the vineyard.',
    sources: ['Ironstone\'s Crown Jewel, found Jamestown 1992; ' + AUDIT_2026_07_20],
  },
  {
    id: 'chawse_indian_grinding_rock',
    names: ["Chaw'se", 'Indian Grinding Rock', 'Indian Grinding Rock State Historic Park', 'Chaw’se'],
    county: 'Amador',
    era: 'Ancestral–present; state park 1968',
    real: true,
    // Coordinates intentionally omitted — see needsTribalReview.
    needsTribalReview: true,
    notes:
      'Northern Sierra Miwok ceremonial and grinding site in Amador County; the state historic park was established in 1968 (CORRECTION: old content said 1962). Holds 1,185 bedrock mortars and 363 petroglyphs. CULTURALLY SENSITIVE: this is a living cultural/ceremonial site. Do not present it (or any Miwok/Maidu sacred site) as a coordinate-specific game destination without tribal review. Public state-park facts (year, mortar/petroglyph counts) are shown; precise coordinates deliberately omitted here.',
    sources: [
      'Indian Grinding Rock SHP, established 1968; 1,185 mortars / 363 petroglyphs; ' + AUDIT_2026_07_20,
    ],
  },
]

export const people: CanonPerson[] = [
  {
    id: 'henry_pinkney_angell',
    names: ['Henry Pinkney Angell', 'Henry Angell', 'Henry Angel'],
    lifespan: 'fl. 1848',
    places: ['angels_camp'],
    real: true,
    notes:
      'Shopkeeper who founded Angels Camp (trading post / mining camp) in 1848; the town is named for him. Corrects old content\'s "George Angel" and "brothers Henry and George Angel."',
    sources: ['Founder of Angels Camp, 1848; ' + AUDIT_2026_07_20],
  },
  {
    id: 'samuel_clemens',
    names: ['Mark Twain', 'Samuel Clemens', 'Samuel L. Clemens', 'S. Clemens'],
    lifespan: '1835–1910',
    places: ['angels_camp', 'angels_hotel', 'jackass_hill'],
    real: true,
    notes:
      'Wintered in Gold Country 1864-65 (Jackass Hill / Angels Camp). HEARD the jumping-frog tale at the Angels Hotel bar and COMPOSED "The Celebrated Jumping Frog of Calaveras County" later (published 1865) — he did not "write it right here." The "villainous backwoods sketch" letter and lost "Notebook 4a" that appeared in content are dramatizations, not documented sources.',
    sources: [
      '"The Celebrated Jumping Frog of Calaveras County," pub. New York Saturday Press, Nov 18, 1865; ' +
        AUDIT_2026_07_20,
    ],
  },
  {
    id: 'ben_coon',
    names: ['Ben Coon', 'Coon'],
    lifespan: 'fl. 1860s',
    places: ['angels_hotel', 'angels_camp'],
    real: true,
    notes:
      'Retired river pilot turned Angels Hotel bartender, generally credited as the teller of the frog tale Twain heard. (The exact storyteller is historically debated; content should present it as "likely," not certain.)',
    sources: ['Traditional source of the jumping-frog tale, Angels Hotel; ' + AUDIT_2026_07_20],
  },
  {
    id: 'jim_smiley',
    names: ['Jim Smiley', 'J. Smiley', "Dan'l Webster"],
    places: ['angels_camp'],
    real: false,
    fictional: true,
    notes:
      'FICTIONAL: Jim Smiley (and his frog "Dan\'l Webster") is Twain\'s invented character, not a documented Angels Camp resident. Old content asserted a real "J. Smiley" mining claim (1849) and an 1864 diary — those are dramatized fiction and are now flagged as such in-game.',
    sources: ['Fictional character in Twain\'s 1865 story; ' + AUDIT_2026_07_20],
  },
  {
    id: 'charles_boles_black_bart',
    names: ['Black Bart', 'Charles E. Boles', 'Charles E. Bolles', 'Charles Bolton', 'C.E. Bolton', 'Charles Bolton'],
    lifespan: 'c.1829–after 1888',
    places: ['san_andreas'],
    real: true,
    notes:
      'Stagecoach robber ("the Po8") — 28 Wells Fargo robberies, 1875-1883, on foot, never fired a shot. A laundry mark (F.X.O.7) on a handkerchief dropped at a Calaveras County robbery was traced to a San Francisco laundry; he was ARRESTED in San Francisco (living as mining engineer "Charles Bolton") and TRIED at San Andreas. CORRECTION: not "captured in San Andreas." No documented poem was left on a West Point store counter.',
    sources: ['Black Bart, arrested San Francisco 1883, tried San Andreas; laundry mark F.X.O.7; ' + AUDIT_2026_07_20],
  },
  {
    id: 'james_b_hume',
    names: ['James B. Hume', 'James Hume', 'Harry Morse'],
    lifespan: '1827–1904 (Hume)',
    places: ['san_andreas'],
    real: true,
    notes:
      'Wells Fargo chief detective James B. Hume directed the Black Bart investigation; detective Harry Morse did the legwork tracing the F.X.O.7 laundry mark through San Francisco laundries. (Content has credited both — keep the roles distinct.)',
    sources: ['Wells Fargo detectives in the Black Bart case, 1883; ' + AUDIT_2026_07_20],
  },
  {
    id: 'kit_carson',
    names: ['Kit Carson', 'Christopher Carson'],
    lifespan: '1809–1868',
    places: ['west_point'],
    real: true,
    notes:
      'Scout/trapper; by local tradition passed through and named West Point (1844). Present the naming as tradition, not settled fact.',
    sources: ['Kit Carson, West Point naming by tradition 1844; ' + AUDIT_2026_07_20],
  },
  {
    id: 'walter_j_mercer',
    names: ['Walter J. Mercer', 'Walter Mercer', 'W.J. Mercer'],
    lifespan: 'fl. 1885',
    places: ['mercer_caverns'],
    real: true,
    notes: 'Prospector who discovered Mercer Caverns near Murphys on September 1, 1885, and opened it commercially.',
    sources: ['Mercer Caverns discovery, Sept 1, 1885; ' + AUDIT_2026_07_20],
  },
]
