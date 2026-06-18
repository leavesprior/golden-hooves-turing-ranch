// ============================================================================
// CANONICAL TOWN REGISTRY (2026-06-17) — map unification, foundation layer.
//
// The game had THREE town datasets for the same Gold Country places, each with
// its own id namespace, schema, and coordinate scheme:
//   1. src/app/adventure/data/chapterLocations.ts   (ChapterLocation, ch-prefixed ids, SVG x/y)
//   2. src/app/explore/page.tsx TOWNS                (Town, lat/lng)
//   3. src/app/oregon-trail/data/goldCountryLocations.ts (GoldCountryLocation, lat/lng)
//
// This registry is the ONE canonical identity layer: per real town it gives a
// canonical id, name, COUNTY (for the state→county→local zoom), real lat/lng,
// the PlaceBackdrop art id, and a crosswalk to the source-dataset ids. It is
// ADDITIVE — it does not modify or break the three existing maps; new unified
// surfaces (the zoom map) read from here, and the old surfaces migrate onto it
// incrementally. (Big-bang replacement would break all three working maps —
// see the schema analysis 2026-06-17.)
//
// Coordinates are the real, sourced lat/lng already present in datasets #2/#3.
// ============================================================================

export type County = 'Amador' | 'Calaveras' | 'Nevada' | 'Mariposa'

export interface CanonicalTown {
  /** Canonical town id (prefer the explore id; else the oregon id). */
  id: string
  name: string
  county: County
  lat: number
  lng: number
  /** PlaceBackdrop art id (the existing crosswalk in components/PlaceBackdrop.tsx). */
  artId: string
  /** Crosswalk to the source datasets that describe this same real place. */
  sources: {
    explore?: string
    oregon?: string
    chapter?: string[]
  }
}

export const COUNTIES: { id: County; name: string; blurb: string }[] = [
  { id: 'Amador', name: 'Amador County', blurb: 'The heart of the Mother Lode — Volcano, Jackson, the deep Kennedy Mine.' },
  { id: 'Calaveras', name: 'Calaveras County', blurb: "Twain's jumping-frog country — Angels Camp, Murphys, San Andreas, the home ranch." },
  { id: 'Nevada', name: 'Nevada County', blurb: 'The northern hard-rock mines — Nevada City and Grass Valley.' },
  { id: 'Mariposa', name: 'Mariposa County', blurb: 'The southern gateway to the gold country and Yosemite.' },
]

export const TOWN_REGISTRY: CanonicalTown[] = [
  // --- Amador County ---
  { id: 'volcano', name: 'Volcano', county: 'Amador', lat: 38.4413, lng: -120.6294, artId: 'volcano',
    sources: { explore: 'volcano', chapter: ['ch2_volcano_main'] } },
  { id: 'jackson', name: 'Jackson', county: 'Amador', lat: 38.3489, lng: -120.7739, artId: 'jackson',
    sources: { oregon: 'jackson', chapter: ['ch4_jackson'] } },
  { id: 'kennedy_mine', name: 'Kennedy Mine', county: 'Amador', lat: 38.3494, lng: -120.7739, artId: 'kennedy_mine',
    sources: { oregon: 'kennedy_mine' } },

  // --- Calaveras County ---
  { id: 'angels_camp', name: 'Angels Camp', county: 'Calaveras', lat: 38.0684, lng: -120.5394, artId: 'angels_camp',
    sources: { explore: 'angels_camp', oregon: 'angels_camp', chapter: ['ch3_angels_camp', 'ch3_jumping_frog'] } },
  { id: 'murphys', name: 'Murphys', county: 'Calaveras', lat: 38.1377, lng: -120.4613, artId: 'murphys',
    sources: { oregon: 'murphys', chapter: ['ch3_murphys'] } },
  { id: 'san_andreas', name: 'San Andreas', county: 'Calaveras', lat: 38.1960, lng: -120.6807, artId: 'san_andreas',
    sources: { explore: 'san_andreas' } },
  { id: 'mokelumne_hill', name: 'Mokelumne Hill', county: 'Calaveras', lat: 38.2993, lng: -120.7091, artId: 'mokelumne_hill',
    sources: { explore: 'mokelumne_hill', oregon: 'mokelumne_hill', chapter: ['ch4_mokelumne_hill'] } },
  { id: 'west_point', name: 'West Point', county: 'Calaveras', lat: 38.3965, lng: -120.5269, artId: 'west_point',
    sources: { explore: 'west_point', chapter: ['ch4_west_point'] } },
  { id: 'bobr_ranch', name: 'Back of Beyond Ranch', county: 'Calaveras', lat: 38.3947, lng: -120.5269, artId: 'bobr_cabin',
    sources: { explore: 'bobr_ranch', oregon: 'bobr_cabin', chapter: ['ch4_ranch_site', 'ch5_ranch_house'] } },
  { id: 'moaning_cavern', name: 'Moaning Cavern', county: 'Calaveras', lat: 38.0719, lng: -120.4678, artId: 'moaning_cavern',
    sources: { oregon: 'moaning_cavern', chapter: ['ch3_moaning_cavern'] } },
  { id: 'california_caverns', name: 'California Caverns', county: 'Calaveras', lat: 38.1728, lng: -120.4211, artId: 'big_trees',
    sources: { oregon: 'california_caverns' } },
  { id: 'big_trees', name: 'Calaveras Big Trees', county: 'Calaveras', lat: 38.2822, lng: -120.3081, artId: 'big_trees',
    sources: { oregon: 'big_trees', chapter: ['ch3_big_trees'] } },
  { id: 'ironstone_vineyards', name: 'Ironstone Vineyards', county: 'Calaveras', lat: 38.1393, lng: -120.4511, artId: 'murphys',
    sources: { oregon: 'ironstone_vineyards' } },
  { id: 'natural_bridges', name: 'Natural Bridges', county: 'Calaveras', lat: 38.1194, lng: -120.4892, artId: 'natural_bridges',
    sources: { oregon: 'natural_bridges', chapter: ['ch3_natural_bridges'] } },

  // --- Nevada County ---
  { id: 'nevada_city', name: 'Nevada City', county: 'Nevada', lat: 39.2616, lng: -121.0161, artId: 'nevada_city',
    sources: { explore: 'nevada_city' } },
  { id: 'grass_valley', name: 'Grass Valley', county: 'Nevada', lat: 39.2190, lng: -121.0611, artId: 'grass_valley',
    sources: { explore: 'grass_valley' } },

  // --- Mariposa County ---
  { id: 'mariposa', name: 'Mariposa', county: 'Mariposa', lat: 37.4849, lng: -119.9663, artId: 'mariposa',
    sources: { explore: 'mariposa' } },
]

// --- lookups -----------------------------------------------------------------
const BY_ID: Record<string, CanonicalTown> = Object.fromEntries(TOWN_REGISTRY.map(t => [t.id, t]))

export function getCanonicalTown(id: string): CanonicalTown | undefined {
  return BY_ID[id]
}

export function getTownsByCounty(county: County): CanonicalTown[] {
  return TOWN_REGISTRY.filter(t => t.county === county)
}

/**
 * Resolve ANY source-dataset id (chapter ch-prefixed, explore, or oregon) to the
 * canonical town. Also accepts a chapter id with its prefix (e.g. 'ch3_angels_camp').
 */
export function resolveToCanonical(sourceId: string): CanonicalTown | undefined {
  if (BY_ID[sourceId]) return BY_ID[sourceId]
  return TOWN_REGISTRY.find(t =>
    t.sources.explore === sourceId ||
    t.sources.oregon === sourceId ||
    (t.sources.chapter?.includes(sourceId) ?? false),
  )
}

export interface Bounds { minLat: number; maxLat: number; minLng: number; maxLng: number }

/** Geographic bounds of the registry (for projecting lat/lng -> map x/y). */
export function getRegistryBounds(): Bounds {
  return getBoundsForTowns(TOWN_REGISTRY)
}

/**
 * Fit-bounds for an arbitrary set of towns (e.g. a single county), so each
 * county view fills its own frame instead of being crammed against the whole
 * state's bounds. A single/degenerate set is expanded around its centre so the
 * lone town projects to the middle, not a corner.
 */
export function getBoundsForTowns(towns: CanonicalTown[]): Bounds {
  if (towns.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 }
  const lats = towns.map(t => t.lat)
  const lngs = towns.map(t => t.lng)
  let minLat = Math.min(...lats), maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  // Expand near-degenerate spans so a lone (or co-located) town centres.
  const EPS = 0.02
  if (maxLat - minLat < EPS) { const c = (maxLat + minLat) / 2; minLat = c - EPS; maxLat = c + EPS }
  if (maxLng - minLng < EPS) { const c = (maxLng + minLng) / 2; minLng = c - EPS; maxLng = c + EPS }
  return { minLat, maxLat, minLng, maxLng }
}

/** Project a town's lat/lng to a 0-100 SVG position within given bounds (y inverted: north=top). */
export function projectToSvg(
  town: CanonicalTown,
  bounds = getRegistryBounds(),
  pad = 8,
): { x: number; y: number } {
  const span = (a: number, b: number) => (b - a || 1)
  const x = pad + ((town.lng - bounds.minLng) / span(bounds.minLng, bounds.maxLng)) * (100 - 2 * pad)
  const y = pad + ((bounds.maxLat - town.lat) / span(bounds.minLat, bounds.maxLat)) * (100 - 2 * pad)
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}
