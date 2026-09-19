/**
 * townGeo.ts — where the 1849 camps sit on the real ground, and how well.
 *
 * The camps in townWalk.ts are authored 20x11 tile maps, marked `fictional: true`.
 * This module does NOT make them surveyed. It records, per town, the evidence
 * that ties a tile to a latitude/longitude, the transform that follows from it,
 * and the measured error of every feature the camp shares with the real place.
 * `townGeo.test.ts` recomputes those errors from the stored coordinates, so the
 * numbers in the ledger (docs/ASCII2_1849_SPATIAL_LEDGER_20260918.md) cannot
 * quietly drift from the code.
 *
 * Three kinds of evidence, kept apart on purpose:
 *   - TODAY'S GEOMETRY: OpenStreetMap (ODbL) and USGS 3DEP elevation. These say
 *     where things are now. They were compared by eye against Google Maps; no
 *     Google data is stored here.
 *   - RECORDS: California OHP landmark entries. They say where a marker stands,
 *     not where an 1849 tent stood.
 *   - 1849: almost nothing locates an 1849 feature to within a tile. Every
 *     reference carries `era1849` saying whether its 1849 position is known.
 *
 * Game compass: 'up' is north. Tiles grow east (x) and south (y).
 */
import type { TownWalkDirection, TownWalkPosition, TownWalkTownId } from '@/lib/townWalk'

export interface GeoPoint { lat: number; lon: number }

export interface GeoReference {
  id: string
  label: string
  point: GeoPoint
  source: string
  /** 'anchor' fixes the transform, 'scale' sets metres per tile, 'check' only measures. */
  role: 'anchor' | 'scale' | 'check'
  /** Where the shared 1849 camp has this feature today, if it has it at all. */
  gameTile?: TownWalkPosition
  /** Is the feature's 1849 position established, or only today's? */
  era1849: 'documented' | 'today-only' | 'unknown'
}

export interface TownGeoreference {
  townId: TownWalkTownId
  /**
   * 'partial': an anchor and a scale exist, so tiles map to ground and errors can
   * be measured. 'bearing-only': one anchor, no scale; only directions can be
   * honest (the horizon, and sites far outside the camp).
   */
  status: 'partial' | 'bearing-only'
  anchor: { point: GeoPoint; tile: TownWalkPosition; source: string; why: string }
  /** Metres per tile, or null when nothing in the camp fixes a scale. */
  metersPerTile: number | null
  scaleWhy: string
  references: readonly GeoReference[]
  unknowns: readonly string[]
}

const OSM = 'OpenStreetMap contributors (ODbL), Overpass API, read 2026-09-18'

/** Sutter Creek centreline through Volcano, OSM way "Sutter Creek", resampled ~60 m. */
const SUTTER_CREEK: readonly GeoPoint[] = [
  [38.447191, -120.616546], [38.446092, -120.618911], [38.444739, -120.621844], [38.443642, -120.624258],
  [38.44259, -120.625958], [38.44175, -120.628664], [38.44096, -120.630554], [38.440386, -120.632597],
  [38.439989, -120.634802], [38.43941, -120.636874], [38.438592, -120.638738], [38.437748, -120.641103],
  [38.439092, -120.642497], [38.439361, -120.644758],
].map(([lat, lon]) => ({ lat, lon }))

export const TOWN_GEO: Record<TownWalkTownId, TownGeoreference> = {
  volcano: {
    townId: 'volcano',
    status: 'partial',
    anchor: {
      point: { lat: 38.44264, lon: -120.63143 },
      tile: { x: 10, y: 5 },
      source: `California OHP Landmark No. 29, "Intersection of Main and Consolation Streets" (https://ohp.parks.ca.gov/ListedResources/Detail/29); the junction node from ${OSM}`,
      why: 'The camp\'s street-and-road junction is set on the town\'s recorded centre. That is a choice, stated here, not an 1849 survey.',
    },
    metersPerTile: 119.75,
    scaleWhy: 'Pine Grove Volcano Road crosses Sutter Creek 239.5 m south of the marker (OSM intersection); the camp\'s plank crossing is 2 rows south of the junction. 239.5 / 2 = 119.75 m per tile, so the 20x11 camp spans about 2.4 by 1.3 km: the whole bowl, not one lot.',
    references: [
      { id: 'creek-crossing', label: 'Road crossing of Sutter Creek', role: 'scale', point: { lat: 38.440474, lon: -120.632099 },
        source: `${OSM}: intersection of Pine Grove Volcano Road with Sutter Creek`, gameTile: { x: 10, y: 7 }, era1849: 'today-only' },
      ...SUTTER_CREEK.map((point, i): GeoReference => ({
        id: `sutter-creek-${i}`, label: 'Sutter Creek centreline', role: 'check', point,
        source: `${OSM}: way "Sutter Creek"`, era1849: 'today-only',
      })),
      { id: 'cemetery', label: 'Volcano Pioneer Methodist (Protestant) Cemetery', role: 'check', point: { lat: 38.44504, lon: -120.62877 },
        source: `${OSM}: landuse=cemetery "Protestant Cemetery", centroid; Google Maps labels it Volcano Pioneer Methodist Cemetery`,
        gameTile: { x: 12, y: 3 }, era1849: 'unknown' },
      { id: 'st-george', label: 'St. George Hotel (brick, 1863-67)', role: 'check', point: { lat: 38.44181, lon: -120.63069 },
        source: `${OSM}: building "St George Hotel", footprint centroid`, era1849: 'documented' },
    ],
    unknowns: [
      'Where Soldiers\' Gulch runs. GNIS returned only its web app; OSM has no feature by that name. The camp\'s "Look at Soldiers\' Gulch" tile (4,8) is unmeasured.',
      'Whether Sutter Creek ran in its present channel in 1849. Hydraulic mining began in 1855 (OHP No. 29) and moved a great deal of ground.',
      'The exact footprint of the Cobblestone Theatre (16124 Main St, beside the post office). OSM has no building for it. Main Street runs about 125 m from the marker to the St. George, so the site is within about a tile of the junction.',
      'The observatory knoll and the Old Abe cannon: no independent coordinates found. Their fog stays on painting-derived tiles, marked as such.',
      'Where any 1849 tent, grave or path stood. The canvas saloon and wooden markers are placements for play.',
    ],
  },
  west_point: {
    townId: 'west_point',
    status: 'bearing-only',
    anchor: {
      point: { lat: 38.39723, lon: -120.52767 },
      tile: { x: 13, y: 4 },
      source: 'California OHP Landmark No. 268 "Intersection of State Hwy 26 (P.M. 34.4) and Main St" (https://ohp.parks.ca.gov/ListedResources/Detail/268); marker coordinates 38 23.834 N, 120 31.66 W, attributed to HMDB marker 44371 in a web-search summary (the HMDB page itself returned 403 and was not read), 15 m from the OSM junction',
      why: 'The marker\'s tile is where the Kit Carson fog already stands. Nothing ties the camp\'s road to Hwy 26: reading an 1849 pack road off a modern highway is exactly the inference the brief forbids.',
    },
    metersPerTile: null,
    scaleWhy: 'The camp has no creek, cemetery or crossing that exists on the ground, so no scale can be measured. Only directions from the marker are honest.',
    references: [
      { id: 'sandy-gulch', label: 'Sandy Gulch monument (OHP No. 253)', role: 'check', point: { lat: 38.378954, lon: -120.541156 },
        source: `OHP No. 253: "On State Hwy 26 (P.M. 32.3), 2.1 mi W of West Point". Located by walking 3,380 m along CA 26 in ${OSM} toward Glencoe; Google Maps labels Sandy Gulch at the same bend`,
        era1849: 'documented' },
    ],
    unknowns: [
      'Where the 1849 trading post stood. OHP records that it existed, not where.',
      'Whether the camp\'s pack road follows any real trail. It is drawn for play.',
      'Sandy Gulch\'s extent. OHP gives a monument point, not the gulch\'s bounds.',
    ],
  },
}

const EARTH_R = 6371008.8

/** Metres east and north of `origin` (equirectangular; fine at town scale). */
export function eastNorth(origin: GeoPoint, p: GeoPoint): { e: number; n: number } {
  const lat0 = (origin.lat * Math.PI) / 180
  return {
    e: ((p.lon - origin.lon) * Math.PI / 180) * EARTH_R * Math.cos(lat0),
    n: ((p.lat - origin.lat) * Math.PI / 180) * EARTH_R,
  }
}

export function bearingDeg(from: GeoPoint, to: GeoPoint): number {
  const { e, n } = eastNorth(from, to)
  return ((Math.atan2(e, n) * 180) / Math.PI + 360) % 360
}

export function distanceM(from: GeoPoint, to: GeoPoint): number {
  const { e, n } = eastNorth(from, to)
  return Math.hypot(e, n)
}

/** Fractional tile for a ground point, or null when the town has no scale. */
export function geoToTile(geo: TownGeoreference, p: GeoPoint): { x: number; y: number } | null {
  if (!geo.metersPerTile) return null
  const { e, n } = eastNorth(geo.anchor.point, p)
  return { x: geo.anchor.tile.x + e / geo.metersPerTile, y: geo.anchor.tile.y - n / geo.metersPerTile }
}

/** Compass bearing the camera faces. The camps are drawn north-up. */
export const HEADING_BEARING: Record<TownWalkDirection, number> = { up: 0, right: 90, down: 180, left: 270 }

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export function compassPoint(deg: number): string {
  return POINTS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}

export function townGeo(townId: string): TownGeoreference | undefined {
  return Object.hasOwn(TOWN_GEO, townId) ? TOWN_GEO[townId as TownWalkTownId] : undefined
}
