/**
 * Client-safe town → sacred-site index.
 *
 * The full sacred-site dataset — real GPS coordinates of burial grounds and
 * living cultural sites, tribal attribution, educational prose, and game
 * reward tuning — lives in ./spiritualSites.ts, which is marked `server-only`
 * and MUST NEVER ship in the client bundle. Exposing precise coordinates of
 * burial and sacred sites to anyone who opens devtools is a real-world harm
 * (desecration, trespass), not just a leak.
 *
 * The client's only legitimate need is to know that a town HAS an associated
 * site and that site's opaque id, so a cross-game "visited" marker can be
 * recorded. Nothing here reveals a location or any culturally sensitive
 * detail — only a town-level association that is already public knowledge for
 * these named places.
 */

export interface TownSiteRef {
  id: string
}

// townId -> opaque site id. Coordinates, tribe, rewards and prose are
// intentionally absent — they are server-only (see ./spiritualSites.ts).
const TOWN_SITE_INDEX: Record<string, string> = {
  volcano: 'chawse_grinding_rock',
  big_trees: 'obsidian_trade_marker',
  jackson: 'jackson_roundhouse',
  west_point: 'maidu_creation_site',
  mokelumne_hill: 'mokelumne_sacred_spring',
  san_andreas: 'burial_ground_remembrance',
  murphys: 'star_observatory',
  angels_camp: 'fishing_camp_stanislaus',
  bobr_ranch: 'acorn_processing_area',
  kennedy_mine: 'washoe_gathering_place',
}

/** Return the opaque site ref for a town, or undefined if the town has none. */
export function getSiteRefForTown(townId: string): TownSiteRef | undefined {
  const id = TOWN_SITE_INDEX[townId]
  return id ? { id } : undefined
}
