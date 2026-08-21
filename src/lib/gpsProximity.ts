import { TOWN_REGISTRY, type CanonicalTown } from '@/lib/townRegistry'
import { metersBetween, revealOnMap } from '@/lib/oneMapDiscovery'

/** Who appears only when the player is physically near. No invented survey pins. */
export interface ProximityNpc {
  id: string
  townId: string
  name: string
  role: 'keeper' | 'outfitter' | 'witness' | 'guide'
  /** Meters. Ranch/town registry coords are sourced; stay generous. */
  radiusM: number
  quest?: string
  supplies?: string
  historicalNote?: string
}

export const PROXIMITY_NPCS: ProximityNpc[] = [
  {
    id: 'tobias_gate',
    townId: 'bobr_ranch',
    name: 'Tobias (the gate)',
    role: 'keeper',
    radiusM: 180,
    quest: 'Walk the ranch. Markers only speak when you are there.',
    supplies: 'Welcome board, WiFi, the first clue.',
    historicalNote: 'Cabin called Back of Beyond — far enough the coyotes needed a map.',
  },
  {
    id: 'ware_west_point',
    townId: 'west_point',
    name: 'Joseph Ware\'s price-list',
    role: 'outfitter',
    radiusM: 400,
    supplies: '1849 prices, more or less. Sell is about half.',
    historicalNote: 'Ware 1849: pack flour by the hundredweight, not by hope.',
  },
  {
    id: 'twain_angels',
    townId: 'angels_camp',
    name: 'A jumping-frog man',
    role: 'witness',
    radiusM: 500,
    quest: 'Ask about the frog, not the gold.',
    historicalNote: 'Twain\'s 1865 story is set here; the contest is later souvenir.',
  },
  {
    id: 'vale_volcano',
    townId: 'volcano',
    name: 'Thaddeus Vale',
    role: 'guide',
    radiusM: 400,
    quest: 'The curtain will not rise — muddy boots by the trapdoor.',
    historicalNote: 'Composite. Coordinates for the theatre district wait on a field survey — this pin is the town, not the stage.',
  },
]

export interface GpsFix {
  lat: number
  lng: number
  accuracyM: number
  source: 'geolocation' | 'sim'
}

export function nearbyNpcs(fix: GpsFix | null): Array<ProximityNpc & { meters: number; town: CanonicalTown }> {
  if (!fix) return []
  const out: Array<ProximityNpc & { meters: number; town: CanonicalTown }> = []
  for (const npc of PROXIMITY_NPCS) {
    const town = TOWN_REGISTRY.find((t) => t.id === npc.townId)
    if (!town) continue
    const meters = metersBetween(fix, { lat: town.lat, lng: town.lng })
    const reach = npc.radiusM + Math.min(fix.accuracyM, 80)
    if (meters <= reach) {
      revealOnMap(town.id)
      out.push({ ...npc, meters, town })
    }
  }
  return out.sort((a, b) => a.meters - b.meters)
}

export function parseSimulatedNear(search: string): GpsFix | null {
  const id = new URLSearchParams(search).get('near')
  if (!id) return null
  const town = TOWN_REGISTRY.find((t) => t.id === id)
  if (!town) return null
  return { lat: town.lat, lng: town.lng, accuracyM: 15, source: 'sim' }
}
