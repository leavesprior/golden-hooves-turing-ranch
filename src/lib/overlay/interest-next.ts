/**
 * Interest-next: the AR loop that can run without surviving the wagon.
 * Next door is an unvisited neighbor that has a playable face
 * (peek town or the trail). Carmen trail-word points at a place and never names it.
 * No GPS coordinates here (sacred sites stay server-only).
 */
import { INSPECT_PAYLOADS, inspectFor } from './inspect-payloads'
import { OVERLAY_CONTRACT } from './overlay-contract'
import { EXPLORE_PEEK_TOWNS } from '@/lib/exploreQrGate'

export const INTEREST_DOORS = [
  { id: 'volcano', neighbors: ['jackson', 'west_point', 'angels_camp'] },
  { id: 'jackson', neighbors: ['volcano', 'mokelumne_hill', 'san_andreas'] },
  { id: 'angels_camp', neighbors: ['jackson', 'murphys', 'bobr_ranch'] },
  { id: 'west_point', neighbors: ['volcano', 'bobr_ranch', 'jackson'] },
  { id: 'bobr_ranch', neighbors: ['west_point', 'angels_camp'] },
  { id: 'kansas_river', neighbors: ['independence', 'fort_kearny'] },
] as const

export type DoorId = (typeof INTEREST_DOORS)[number]['id']

const INSPECT_FOR_DOOR: Partial<Record<DoorId, string>> = {
  volcano: 'town_pause_1849_not_ladle',
  jackson: 'town_pause_1849_not_ladle',
  west_point: 'west_point_crossroads_1849',
  bobr_ranch: 'bobr_ranch_oak_camp_1849',
  angels_camp: 'snake_give_the_grass',
  kansas_river: 'kansas_river_pappan_ferry',
}

export function carmenNamesTarget(trailWord: string, pointsTo: string | null): boolean {
  if (!pointsTo) return false
  const word = trailWord.toLowerCase()
  const target = pointsTo.toLowerCase().replace(/_/g, ' ')
  if (word.includes(target) || word.includes(pointsTo.toLowerCase())) return true
  const parts = target.split(/\s+/).filter((p) => p.length > 4)
  return parts.some((p) => word.includes(p))
}

export function visitedSet(ids: readonly unknown[]): Set<string> {
  const known = new Set<string>(INTEREST_DOORS.map((d) => d.id))
  const out = new Set<string>()
  for (const id of ids) {
    if (typeof id === 'string' && known.has(id)) out.add(id)
  }
  return out
}

export function isPlayableInterest(id: string): boolean {
  if (id === 'kansas_river') return true
  return (EXPLORE_PEEK_TOWNS as readonly string[]).includes(id)
}

export function nextInterest(visited: readonly unknown[], last?: string) {
  const have = visitedSet(visited)
  const doors = INTEREST_DOORS
  const lastDoor = doors.find((d) => d.id === last)
  const neighbor = lastDoor?.neighbors.find((n) => !have.has(n) && doors.some((d) => d.id === n) && isPlayableInterest(n))
  const id = (neighbor && isPlayableInterest(neighbor) ? neighbor : doors.find((d) => !have.has(d.id) && isPlayableInterest(d.id))?.id) || null
  if (!id) return { id: null as string | null, trailWord: null as string | null, pointsTo: null as string | null, done: true }
  const inspectId = INSPECT_FOR_DOOR[id as DoorId]
  const inspect = inspectId ? INSPECT_PAYLOADS.find((p) => p.id === inspectId) : inspectFor('town')
  const trailWord = inspect?.carmen.trailWord ?? 'canvas, a creek, flour, and a road that does not yet have a name on a plaque'
  const pointsTo = inspect?.carmen.pointsTo ?? id
  return { id, trailWord, pointsTo, done: false, named: carmenNamesTarget(trailWord, pointsTo) }
}

export const INTEREST_SNIPPET = 'nextInterest(visitedTownIds, lastTownId)'

export const CONTRACT = {
  client_mint: OVERLAY_CONTRACT.client_mint,
  arcade: OVERLAY_CONTRACT.numbering.arcade,
}
