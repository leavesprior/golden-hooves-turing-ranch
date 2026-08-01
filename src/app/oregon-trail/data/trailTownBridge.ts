/**
 * The trail's door into the canonical town registry.
 *
 * WHY THIS EXISTS
 * The premise of this game is that you are a Pinkerton agent. Ten full
 * investigations are authored in lib/townInvestigations.ts — witnesses,
 * evidence, scenes — and lib/townRegistry.ts already ships `resolveToCanonical`
 * plus a `sources` crosswalk built to connect the trail's location ids to those
 * canonical towns. The crosswalk works: seven of the eleven Gold Country
 * locations resolve.
 *
 * Nothing under src/app/oregon-trail/ ever imported it.
 *
 * So six towns the player walks straight through on the trail —
 * west_point, mokelumne_hill, san_andreas, jackson, angels_camp, volcano —
 * each hold a written case that the trail could not see. The content was not
 * missing. It was unreachable from the mode most players are in. This module is
 * the call that was never made.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It does not re-implement investigations, and it does not mount case UI inside
 * the trail. `/town/[townId]` already renders a full TownInvestigation. This
 * resolves and points; the destination already exists.
 *
 * RENDER-VERIFIED 2026-07-30 (not merely unit-tested)
 * A unit test plus a source grep is not proof that anything paints — this repo
 * shipped an ASCII layer that was silently dead behind tsc, lint, build and 282
 * green tests. So the affordances were checked in a live browser in the
 * gold_country_explore phase, by measured geometry and by identity rather than
 * by DOM order:
 *
 *   Angels Camp  case → badge present      Moke Hill  case → badge present
 *   Jackson      case → badge present      Big Trees  landmark → badge ABSENT
 *
 *   pre-travel link: "An open case waits in Angels Camp, Calaveras County →"
 *   href /town/angels_camp, box 404x16 px; badges 14x14 px; 0 console errors.
 *   Negative control: selecting Big Trees renders NO case link.
 *
 * Marker identity was read by hovering each marker for its label. Assuming DOM
 * order matched the source array would have named two wrong towns.
 *
 * ON LINKING ONLY WHERE A CASE EXISTS
 * `/town/[townId]` calls notFound() when a town has no authored case. In dev
 * that not-found page still answers HTTP 200, so a broken link would not show up
 * as a 4xx in any smoke test — it would look fine and land the player on an
 * empty page. `caseFor` therefore returns undefined unless the case is really
 * there, and the test asserts the negative directly rather than trusting a
 * status code.
 */

import { resolveToCanonical, type CanonicalTown } from '@/lib/townRegistry'
import { hasInvestigation } from '@/lib/townInvestigations'

/** The canonical town behind a trail location id, if the crosswalk knows one. */
export function townForTrailLocation(trailLocationId: string): CanonicalTown | undefined {
  return resolveToCanonical(trailLocationId)
}

export interface TrailTownCase {
  /** Canonical town id — the key both the registry and the case data agree on. */
  townId: string
  townName: string
  county: string
  /** Existing route that renders the authored investigation. */
  href: string
}

/**
 * The authored case waiting at a trail location, or undefined.
 *
 * Undefined is the right answer for landmarks and mines (sandy_gulch,
 * carson_hill, chinese_tunnels, indian_grinding_rock, big_trees) — they are not
 * towns and were never meant to hold cases.
 */
export function caseFor(trailLocationId: string): TrailTownCase | undefined {
  const town = townForTrailLocation(trailLocationId)
  if (!town) return undefined
  if (!hasInvestigation(town.id)) return undefined

  return {
    townId: town.id,
    townName: town.name,
    county: town.county,
    href: `/town/${town.id}`,
  }
}

/** Cheap predicate for rendering a marker badge. */
export function hasCaseAtTrailLocation(trailLocationId: string): boolean {
  return caseFor(trailLocationId) !== undefined
}
