/**
 * ascii2Towns.ts — which towns have an 1849 year-overlay for the ascii2 rung.
 *
 * The camp itself is townWalk.ts (shared with the pixel walk). These JSON files
 * only add the year: which explore attractions are 'later', and what to say
 * where they will stand. Adding a town = write `src/data/towns/<id>.1849.json`
 * for a town that already has an authored tile map, then add one line here.
 */

import volcano1849 from '@/data/towns/volcano.1849.json'
import westPoint1849 from '@/data/towns/west_point.1849.json'
import type { Town1849 } from '@/lib/ascii2Walk'

export const ASCII2_TOWNS: Record<string, Town1849> = {
  volcano: volcano1849 as Town1849,
  west_point: westPoint1849 as Town1849,
}

export function ascii2TownFor(townId: string | undefined): Town1849 | undefined {
  if (!townId) return undefined
  return ASCII2_TOWNS[townId]
}

export function hasAscii2Walk(townId: string | undefined): boolean {
  return !!ascii2TownFor(townId)
}
