import type { OverlayInspect } from './overlay-contract'

/** Carmen/history inspect text for the six trail scenes.
 * Drop in as ENCOUNTERS[kind].finding when landmark matches.
 * Does not replace oc_agent's town ladle mystery. */

export const INSPECT_PAYLOADS: OverlayInspect[] = [
  {
    id: 'kansas_river_pappan_ferry',
    kind: 'river',
    landmark: 'Kansas River',
    era: { year: 1849 },
    provenance: 'document',
    carmen: {
      trailWord: 'the army post on the Platte, still days of grass away',
      pointsTo: 'Fort Kearny',
      obscurity: 2,
      witness: 'the rope and the pole',
    },
    finding:
      'The Kaw is broad, deep, and swift here. A rope runs shore to shore. The craft is two or three dugouts under a log platform — one wagon at a time, a pole for the ferryman. Passengers have been sleeping in the grass until morning business.',
    fact:
      'Pappan’s Ferry (established 1842–43 by Joseph, Ahcan, and Louis Pappan; wives Josette, Julie, and Victoire Gonvil, Kanza allotment on the north bank by the 1825 treaty) carried Oregon–California wagons at about $1 per wagon. Other Shawnee County ferries (Kennedy, Smith, Uniontown) opened 1849–52. Kansas was not yet open to settlement; this is a crossing, not a town you found.',
    sources: [
      { title: 'Kansapedia: Oregon-California Trail', url: 'https://www.kshs.org/kansapedia/oregon-california-trail/12161' },
      { title: 'Pappan’s Ferry, Topeka', url: 'https://legendsofkansas.com/pappans-ferry-topeka-kansas/' },
      { title: 'Shawnee County ferry sites (NPS via CJOnline 2016)', url: 'https://www.cjonline.com/story/news/politics/state/2016/08/27/traveling-west-oregon-trail-shawnee-county-had-least-four-ferry-sites/16576709007/' },
    ],
  },
  {
    id: 'storm_canvas_and_hollow',
    kind: 'storm',
    era: { year: 1849 },
    provenance: 'testimony',
    carmen: {
      trailWord: 'the post named for a general, where the river turns toward the mountains',
      pointsTo: 'Fort Kearny',
      obscurity: 2,
      witness: 'the hollow in the bank',
    },
    finding:
      'Prairie storms run faster than a wagon. Canvas that is not braced will take the load with it. A hollow buys a night and spends a day. The river you just crossed does not care which you choose.',
    fact:
      'Trail diaries treat weather as a supply problem, not scenery. A lost day at the Kansas is a lost day before the Platte. Difficulty is attention to the sky, not a reflex minigame.',
    sources: [
      { title: 'Kansapedia: Oregon-California Trail', url: 'https://www.kshs.org/kansapedia/oregon-california-trail/12161' },
    ],
  },
  {
    id: 'snow_pass_attention',
    kind: 'snow',
    era: { year: 1849 },
    provenance: 'legend',
    carmen: {
      trailWord: 'the pass that later takes a party’s name for dying in the snow',
      pointsTo: 'Donner Pass',
      obscurity: 3,
      witness: 'the sheltered side of the track',
    },
    finding:
      'The sheltered side is passable on foot. Clothing you kept is the difference between walking and camping. The pass does not announce its dead; later travelers will name it for them.',
    fact:
      'This inspect is a time-echo, not an 1849 present-tense fact. Provenance=legend until the party is in the Sierra. Do not present Donner as a current landmark on the Kansas.',
    sources: [
      { title: 'WHERE_IN_TIME_DESIGN era ladder (family/land eras)', url: '/home/granny/bobr-website/docs/WHERE_IN_TIME_DESIGN_20260615.md' },
    ],
  },
  {
    id: 'snake_give_the_grass',
    kind: 'snake',
    era: { year: 1849 },
    provenance: 'document',
    carmen: {
      trailWord: 'the county that will later jump frogs for a prize',
      pointsTo: 'angels_camp',
      obscurity: 3,
      witness: 'the ox that refused the grass',
    },
    finding:
      'The lead ox stopped for a reason. Give the grass a wide berth. The original trail choices still decide whether anyone is bitten. This is not a combat round.',
    fact:
      'Prairie rattlesnakes (Crotalus viridis) and massasauga are the honest 1849 hazard class on the plains; the Calaveras frog is a later, other-era echo. Do not mix them in one inspect.',
    sources: [
      { title: 'Existing competitive_snake event (game)', url: 'src/app/oregon-trail/state/constants.ts' },
    ],
  },
  {
    id: 'illness_cholera_attention',
    kind: 'illness',
    era: { year: 1849 },
    provenance: 'document',
    carmen: {
      trailWord: 'bad water at the crowded camps, not a curse on the wagon',
      pointsTo: null,
      obscurity: 1,
      witness: 'the patient who cannot keep the pace',
    },
    finding:
      'The pace of the journey changes when someone cannot keep up. Medicine advances recovery one day. It does not raise the dead. Camp spends food and a day. The original sick-traveler event, if this is a stranger, still belongs to that screen.',
    fact:
      '1849 cholera on the overland trails followed contaminated water at busy camps. Attention = boil, camp uphill of stock, do not drink the obvious ford. Not a punishment roll.',
    sources: [
      { title: 'Trail encounter illness rules (oc_agent 2026-09-04)', url: 'src/app/oregon-trail/state/trailEncounter.ts' },
    ],
  },
  {
    id: 'town_pause_1849_not_ladle',
    kind: 'town',
    era: { year: 1849 },
    provenance: 'document',
    carmen: {
      trailWord: 'canvas, a creek, flour, and a road that does not yet have a name on a plaque',
      pointsTo: null,
      obscurity: 1,
      witness: 'the street that is still dirt',
    },
    finding:
      'Lanterns on a real 1849 camp do not strike thirteen. The notice on this street is flour, a ford, or a name that is not yet famous. A teal cabinet that prints tomorrow is a visitor’s story — it is not this town’s history.',
    fact:
      'Drop-in for ENCOUNTERS.town.finding when the pause is a historical camp, not the lantern-hour plaza. Do not use the ladle/clock copy for Jackson, Volcano, Hangtown, or any catalogued 1849 street.',
    sources: [
      { title: 'GROK_OBSERVATIONS.md Layer B vs C', url: '/home/granny/neoma-grok-workspace/bobr-rpg-evaluation/GROK_OBSERVATIONS.md' },
    ],
  },
  {
    id: 'west_point_crossroads_1849',
    kind: 'town',
    landmark: 'West Point',
    era: { year: 1849 },
    provenance: 'document',
    carmen: {
      trailWord: 'the crossroads camp on the old trading road, flour and rope before the high claims, a day from the ranch in the pines',
      pointsTo: 'west_point',
      obscurity: 2,
      witness: 'the pack string and the native road',
    },
    finding:
      'This is a supply camp at a fork the native road already knew. Canvas and rope, not a highway plaque. The espresso house and the scout’s marker are later stories on this same dirt.',
    fact:
      'West Point, Calaveras County, sits on older Native trading routes. Tradition credits a Kit Carson passage in 1844 with the later name. The Highway 26 & Main commemorative marker is not an 1849 campsite. Willows on Main is a present cafe in the old Academy Club.',
    sources: [
      { title: 'goldCountryCanon west_point (audit 2026-07-20)', url: 'src/data/goldCountryCanon.ts' },
    ],
  },
]

export function inspectFor(kind: OverlayInspect['kind'], landmark?: string): OverlayInspect | undefined {
  const needle = (landmark ?? '').toLowerCase()
  return INSPECT_PAYLOADS.find((p) => {
    if (p.kind !== kind) return false
    if (!p.landmark) return true
    return needle.includes(p.landmark.toLowerCase())
  })
}
