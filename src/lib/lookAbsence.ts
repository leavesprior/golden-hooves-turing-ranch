/**
 * lookAbsence.ts — what the 1849 Look face says is NOT standing yet.
 *
 * The painted Look face draws only the attractions that exist in 1849, so the
 * later ones (St. George, the Cobblestone, Madeira's rise, Old Abe) were simply
 * absent from the picture with nothing to say where they will be. A guest could
 * not point at the theatre and ask "where?" — the year-line existed in
 * `<town>.1849.json` and never reached the face.
 *
 * These chips carry the year-line and nothing else:
 *   - not present: they are never added to the arcade's present attractions;
 *   - not enterable: clicking one selects a reading, it does not enter a
 *     building, award karma, or mark a visit;
 *   - not today: they are drawn on the 1849 painting only, because the percents
 *     are authored against that painting.
 *
 * The position comes from TOWN_HOTSPOTS, which `ascii2Walk.test.ts` already
 * holds equal to the JSON's x/y. Reading the pin here keeps one source for
 * where a chip lands, so the walk's fog and the Look chip cannot drift apart.
 */

import { ascii2TownFor } from './ascii2Towns'
import { TOWN_HOTSPOTS } from './goldCountryEditorial'

export type LookAbsenceChip = {
  id: string
  label: string
  /** Percent of the painted face, authored — not a survey. */
  x: number
  y: number
  /** What is not there yet, and the year it arrives. */
  notYet: string
}

/**
 * Later-site chips for a town's painted 1849 face.
 *
 * A site with no pin on the face is skipped rather than guessed at: the walk
 * draws it at its true bearing instead, and inventing a percent here would put
 * a confident chip on ground nothing measured.
 */
export function lookAbsenceChips(townId: string | undefined): LookAbsenceChip[] {
  const town = ascii2TownFor(townId)
  if (!town || !townId) return []
  const pins = new Map((TOWN_HOTSPOTS[townId] || []).map((p) => [p.attractionId, p]))
  const chips: LookAbsenceChip[] = []
  for (const site of town.later_sites) {
    const pin = pins.get(site.id)
    if (!pin) continue
    chips.push({ id: site.id, label: site.label, x: pin.x, y: pin.y, notYet: site.notYet })
  }
  return chips
}

/** The 1849 painting is the only face these percents were authored against. */
export function lookAbsenceVisible(era: string, walking: boolean, interior: boolean): boolean {
  return era === '1849' && !walking && !interior
}

/** Smallest gap allowed between any two chips on the painted face, in percent. */
export const LOOK_ABSENCE_CLEARANCE = 12

/**
 * Chip pairs that sit closer than `min` — either two later chips, or a later
 * chip on top of a present pin. A collision here is a chip a guest cannot hit,
 * or worse, a later label sitting on a building that IS standing in 1849.
 */
export function lookAbsenceCollisions(townId: string, min = LOOK_ABSENCE_CLEARANCE): {
  a: string
  b: string
  d: number
}[] {
  const chips = lookAbsenceChips(townId)
  const laterIds = new Set(chips.map((c) => c.id))
  const present = (TOWN_HOTSPOTS[townId] || []).filter((p) => !laterIds.has(p.attractionId))
  const out: { a: string; b: string; d: number }[] = []
  const round = (d: number) => Math.round(d * 10) / 10
  for (let i = 0; i < chips.length; i += 1) {
    for (let j = i + 1; j < chips.length; j += 1) {
      const d = Math.hypot(chips[i].x - chips[j].x, chips[i].y - chips[j].y)
      if (d < min) out.push({ a: chips[i].id, b: chips[j].id, d: round(d) })
    }
    for (const p of present) {
      const d = Math.hypot(chips[i].x - p.x, chips[i].y - p.y)
      if (d < min) out.push({ a: chips[i].id, b: p.attractionId, d: round(d) })
    }
  }
  return out
}
