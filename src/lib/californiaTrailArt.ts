/**
 * 1849 California Trail stills — outdoor paintings lined up with the wagon
 * road to Gold Country (Independence → Kansas → Platte → South Pass →
 * Humboldt → Truckee → Sacramento Valley → West Point).
 *
 * Distances match LANDMARKS in oregon-trail/state/constants.ts.
 *
 * Traveling uses stretch landscapes (prairie, Platte, sage, desert, Sierra).
 * Towns/forts/rivers use period-approximate arrangement paintings.
 */

const E = '/place-art/editorial'
const TITLE = '/place-art/ot_title_prairie_editorial.jpg'

export const LANDMARK_EDITORIAL: Record<string, string> = {
  'Independence, Missouri': `${E}/independence.jpg`,
  'Kansas River Crossing': `${E}/kansas_river.jpg`,
  'Fort Kearny': `${E}/fort_kearny.jpg`,
  'Chimney Rock': `${E}/chimney_rock.jpg`,
  'Fort Laramie': `${E}/fort_laramie.jpg`,
  'Independence Rock': `${E}/independence_rock.jpg`,
  'South Pass': `${E}/south_pass.jpg`,
  'Fort Bridger': `${E}/fort_bridger.jpg`,
  'Raft River': `${E}/raft_river.jpg`,
  'City of Rocks': `${E}/city_of_rocks.jpg`,
  'Humboldt River': `${E}/humboldt_river.jpg`,
  'Humboldt Sink': `${E}/humboldt_sink.jpg`,
  'Forty Mile Desert': `${E}/forty_mile_desert.jpg`,
  'Truckee Pass': `${E}/truckee_pass.jpg`,
  'Sacramento Valley': `${E}/sacramento_valley.jpg`,
  'West Point': `${E}/west_point.jpg`,
  'Gold Country': TITLE,
}

/** Outdoor trail plates — no town square — used while the wagon is rolling. */
const STRETCH_EDITORIAL: Record<string, string> = {
  'Independence, Missouri': `${E}/missouri_prairie.jpg`,
  'Kansas River Crossing': `${E}/missouri_prairie.jpg`,
  'Fort Kearny': `${E}/platte_road.jpg`,
  'Chimney Rock': `${E}/chimney_rock.jpg`,
  'Fort Laramie': `${E}/platte_road.jpg`,
  'Independence Rock': `${E}/independence_rock.jpg`,
  'South Pass': `${E}/south_pass.jpg`,
  'Fort Bridger': `${E}/south_pass.jpg`,
  'Raft River': `${E}/raft_river.jpg`,
  'City of Rocks': `${E}/city_of_rocks.jpg`,
  'Humboldt River': `${E}/humboldt_river.jpg`,
  'Humboldt Sink': `${E}/humboldt_sink.jpg`,
  'Forty Mile Desert': `${E}/forty_mile_desert.jpg`,
  'Truckee Pass': `${E}/truckee_pass.jpg`,
  'Sacramento Valley': `${E}/sacramento_valley.jpg`,
  'West Point': `${E}/west_point.jpg`,
  'Gold Country': TITLE,
}

const STOPS: { name: string; mile: number }[] = [
  { name: 'Independence, Missouri', mile: 0 },
  { name: 'Kansas River Crossing', mile: 102 },
  { name: 'Fort Kearny', mile: 304 },
  { name: 'Chimney Rock', mile: 554 },
  { name: 'Fort Laramie', mile: 640 },
  { name: 'Independence Rock', mile: 830 },
  { name: 'South Pass', mile: 932 },
  { name: 'Fort Bridger', mile: 1032 },
  { name: 'Raft River', mile: 1120 },
  { name: 'City of Rocks', mile: 1200 },
  { name: 'Humboldt River', mile: 1380 },
  { name: 'Humboldt Sink', mile: 1520 },
  { name: 'Forty Mile Desert', mile: 1600 },
  { name: 'Truckee Pass', mile: 1750 },
  { name: 'Sacramento Valley', mile: 1900 },
  { name: 'West Point', mile: 1950 },
  { name: 'Gold Country', mile: 2000 },
]

export type TrailTerrain = 'plains' | 'mountains' | 'desert' | 'forest' | 'river'

/** Vegetation/landform of the 1849 road, not a generic game-progress ladder. */
export function terrainForDistance(distance: number): TrailTerrain {
  const d = Math.max(0, distance)
  if (d < 932) return 'plains'
  if (d < 1750) return 'desert'
  if (d < 1900) return 'mountains'
  return 'forest'
}

export function editorialForLandmark(name: string): string | null {
  if (!name) return null
  if (LANDMARK_EDITORIAL[name]) return LANDMARK_EDITORIAL[name]
  const crossing = `${name.replace(/ Crossing$/, '')} Crossing`
  if (LANDMARK_EDITORIAL[crossing]) return LANDMARK_EDITORIAL[crossing]
  const lower = name.toLowerCase()
  const hit = Object.keys(LANDMARK_EDITORIAL).find((k) => k.toLowerCase() === lower)
  return hit ? LANDMARK_EDITORIAL[hit] : null
}

/**
 * While rolling: landscape of the stretch you are on, then in the last third
 * of the gap the next stop itself (so a river or town rises ahead).
 */
export function editorialForDistance(distance: number): { src: string; alt: string } {
  const d = Math.max(0, Math.min(2000, distance))
  let i = 0
  while (i < STOPS.length - 1 && d >= STOPS[i + 1].mile) i += 1
  const here = STOPS[i]
  const next = STOPS[Math.min(i + 1, STOPS.length - 1)]
  const span = Math.max(1, next.mile - here.mile)
  const t = (d - here.mile) / span
  if (t > 0.62) {
    const src = LANDMARK_EDITORIAL[next.name] || TITLE
    return { src, alt: next.name }
  }
  const src = STRETCH_EDITORIAL[here.name] || LANDMARK_EDITORIAL[here.name] || TITLE
  return { src, alt: here.name }
}
