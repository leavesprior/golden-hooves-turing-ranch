/**
 * Travel-danger signal — Golden Frog Codex Phase 3.
 *
 * Playtester confusion point #3 (RED): "travel encounters feel random; no
 * distance feedback." Fix = derive a per-edge danger tier from existing data
 * and surface it BEFORE the player commits, so picking a route is informed.
 *
 * Data sources (read-only — do NOT edit existing encounter data):
 *   - Each ChapterLocation carries `travelDanger: 'safe'|'moderate'|'dangerous'`.
 *   - TRAVEL_ENCOUNTERS have independent `chance` rolls per item.
 *     The aggregate probability that ANY encounter fires on a neutral edge
 *     is 1 - ∏(1 - chance_i).
 *
 * Edge-level tier = worst of the two endpoints' travelDanger, plus a danger
 * multiplier applied to the base aggregate chance. This matches the existing
 * ChapterMap colouring (dangerous route = endpoint marked dangerous).
 */

import {
  TRAVEL_ENCOUNTERS,
  getLocationById,
  type ChapterLocation,
  type TravelEncounter,
} from '@/app/adventure/data/chapterLocations'
import {
  CONFRONTATION_ENEMIES,
  type ConfrontationEnemy,
} from '@/app/adventure/data/confrontationEnemies'

export type DangerTier = 'peaceful' | 'risky' | 'dangerous'

export interface EdgeDangerInfo {
  /** Colour bucket: green / yellow / red. */
  tier: DangerTier
  /** Integer percent chance that at least one travel encounter fires [0, 99]. */
  chancePct: number
  /** Names of travel encounters possible on this edge. */
  possibleEncounters: string[]
  /** Names of confrontation enemies that could roll given the chapter. */
  possibleConfrontations: string[]
  /** Worst endpoint travelDanger field — the narrative anchor. */
  worstEndpointDanger: ChapterLocation['travelDanger']
}

/**
 * Aggregate base probability across TRAVEL_ENCOUNTERS (independent rolls).
 * 1 - ∏(1 - chance_i) ≈ 0.38 given current data (12/8/10/6/... percentages).
 */
const BASE_AGGREGATE_CHANCE = (() => {
  let miss = 1
  for (const enc of TRAVEL_ENCOUNTERS) {
    miss *= 1 - enc.chance
  }
  return 1 - miss
})()

/** Multiplier tiers keyed off the worst endpoint travelDanger. */
const DANGER_MULTIPLIER: Record<ChapterLocation['travelDanger'], number> = {
  safe: 0.35,
  moderate: 1.0,
  dangerous: 1.7,
}

function worstDanger(
  a: ChapterLocation['travelDanger'],
  b: ChapterLocation['travelDanger'],
): ChapterLocation['travelDanger'] {
  const rank: Record<ChapterLocation['travelDanger'], number> = {
    safe: 0, moderate: 1, dangerous: 2,
  }
  return rank[a] >= rank[b] ? a : b
}

function tierFromPct(pct: number): DangerTier {
  if (pct < 20) return 'peaceful'
  if (pct <= 50) return 'risky'
  return 'dangerous'
}

/**
 * Compute the danger info for a single directed edge from → to.
 * Symmetric in practice because the worst-of-two is commutative.
 */
export function getEdgeDangerInfo(
  fromId: string,
  toId: string,
  chapter: number,
): EdgeDangerInfo {
  const from = getLocationById(fromId)
  const to = getLocationById(toId)

  const worst = from && to
    ? worstDanger(from.travelDanger, to.travelDanger)
    : 'moderate'

  const multiplier = DANGER_MULTIPLIER[worst]
  // Clamp to [0, 0.99] so we never claim a certain encounter.
  const chance = Math.max(0, Math.min(0.99, BASE_AGGREGATE_CHANCE * multiplier))
  const chancePct = Math.round(chance * 100)

  // Possible travel encounters = all of them (the roll is edge-agnostic),
  // but only show when danger tier warrants it.
  const possibleEncounters: string[] = TRAVEL_ENCOUNTERS
    .filter((e: TravelEncounter) => e.chance >= 0.05)
    .map((e: TravelEncounter) => e.name)

  // Confrontations are chapter-gated.
  const possibleConfrontations: string[] = CONFRONTATION_ENEMIES
    .filter((c: ConfrontationEnemy) => c.chapter <= chapter)
    .map((c: ConfrontationEnemy) => c.name)

  return {
    tier: tierFromPct(chancePct),
    chancePct,
    possibleEncounters,
    possibleConfrontations,
    worstEndpointDanger: worst,
  }
}

/**
 * Aggregate danger across a multi-hop path (player selects endpoint, we walk
 * through connectedTo edges). Uses the compound-probability of at-least-one
 * encounter firing across any hop: 1 - ∏(1 - edgeChance_i).
 */
export function getPathDangerInfo(
  path: string[],
  chapter: number,
): EdgeDangerInfo {
  if (path.length < 2) {
    return {
      tier: 'peaceful',
      chancePct: 0,
      possibleEncounters: [],
      possibleConfrontations: [],
      worstEndpointDanger: 'safe',
    }
  }

  let miss = 1
  let worst: ChapterLocation['travelDanger'] = 'safe'
  const encounterSet = new Set<string>()
  const confrontSet = new Set<string>()

  for (let i = 0; i < path.length - 1; i++) {
    const edge = getEdgeDangerInfo(path[i], path[i + 1], chapter)
    miss *= 1 - edge.chancePct / 100
    worst = worstDanger(worst, edge.worstEndpointDanger)
    edge.possibleEncounters.forEach(n => encounterSet.add(n))
    edge.possibleConfrontations.forEach(n => confrontSet.add(n))
  }

  const chancePct = Math.round((1 - miss) * 100)

  return {
    tier: tierFromPct(chancePct),
    chancePct,
    possibleEncounters: Array.from(encounterSet),
    possibleConfrontations: Array.from(confrontSet),
    worstEndpointDanger: worst,
  }
}

export const TIER_ICON: Record<DangerTier, string> = {
  peaceful: '🟢',   // green circle
  risky: '🟡',      // yellow circle
  dangerous: '🔴',  // red circle
}

export const TIER_LABEL: Record<DangerTier, string> = {
  peaceful: 'Peaceful',
  risky: 'Risky',
  dangerous: 'Dangerous',
}

/**
 * Breadth-first shortest path via `connectedTo` edges. Returns ordered list of
 * location ids including both endpoints, or null if unreachable.
 * Only considers locations in `allowedIds` (typically discovered locations).
 */
export function findShortestPath(
  fromId: string,
  toId: string,
  allowedIds: Set<string>,
): string[] | null {
  if (fromId === toId) return [fromId]
  if (!allowedIds.has(fromId) || !allowedIds.has(toId)) return null

  const visited = new Set<string>([fromId])
  const queue: Array<{ id: string; path: string[] }> = [
    { id: fromId, path: [fromId] },
  ]

  while (queue.length > 0) {
    const { id, path } = queue.shift()!
    const loc = getLocationById(id)
    if (!loc) continue
    for (const nextId of loc.connectedTo) {
      if (!allowedIds.has(nextId) || visited.has(nextId)) continue
      const nextPath = [...path, nextId]
      if (nextId === toId) return nextPath
      visited.add(nextId)
      queue.push({ id: nextId, path: nextPath })
    }
  }
  return null
}
