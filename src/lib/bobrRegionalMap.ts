import { getBoundsForTowns, projectToSvg, TOWN_REGISTRY, type CanonicalTown } from '@/lib/townRegistry'

export const GOLD_COUNTRY_TOWN_IDS = [
  'volcano',
  'west_point',
  'mokelumne_hill',
  'jackson',
  'san_andreas',
  'angels_camp',
  'murphys',
] as const

export const GOLD_COUNTRY_ROUTES: Array<[typeof GOLD_COUNTRY_TOWN_IDS[number], typeof GOLD_COUNTRY_TOWN_IDS[number]]> = [
  ['volcano', 'west_point'],
  ['volcano', 'jackson'],
  ['west_point', 'mokelumne_hill'],
  ['mokelumne_hill', 'jackson'],
  ['mokelumne_hill', 'san_andreas'],
  ['san_andreas', 'angels_camp'],
  ['angels_camp', 'murphys'],
]

export interface RegionalMapNode {
  id: typeof GOLD_COUNTRY_TOWN_IDS[number]
  label: string
  county: string
  lat: number
  lng: number
  x: number
  y: number
}

function isRegionalTown(town: CanonicalTown): town is CanonicalTown & { id: RegionalMapNode['id'] } {
  return GOLD_COUNTRY_TOWN_IDS.includes(town.id as RegionalMapNode['id'])
}

export function getGoldCountryMapNodes(): RegionalMapNode[] {
  const towns = TOWN_REGISTRY.filter(isRegionalTown)
  const bounds = getBoundsForTowns(towns)
  return towns.map((town) => {
    const { x, y } = projectToSvg(town, bounds, 12)
    return { id: town.id, label: town.name, county: town.county, lat: town.lat, lng: town.lng, x, y }
  })
}

export function milesBetween(a: Pick<RegionalMapNode, 'lat' | 'lng'>, b: Pick<RegionalMapNode, 'lat' | 'lng'>): number {
  const rad = (degrees: number) => degrees * Math.PI / 180
  const earthMiles = 3958.8
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const lat1 = rad(a.lat)
  const lat2 = rad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(earthMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
