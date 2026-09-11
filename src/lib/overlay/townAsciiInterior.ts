/** 1849 interiors for explorer pins and the matching Oregon Trail shop fronts.
 * Readable glyph rooms, not a walk. Later brick stays on volcano_main. */
import { volcanoSaloonRows, VOLCANO_SALOON_INSPECT } from './volcano-canvas-saloon'
import { soldiersGulchRows, SOLDIERS_GULCH_INSPECT } from './volcano-soldiers-gulch'
import { volcanoCemeteryRows, VOLCANO_CEMETERY_INSPECT } from './volcano-cemetery'

export type TownAsciiInterior = {
  testid: string
  rows: string[]
  finding: string
  trailWord: string
}

/** Oregon Trail street-front id → explorer pin that already has a reading. */
export const STREET_FRONT_ASCII: Record<string, string> = {
  volcano_canvas: 'vol_canvas_flat',
}

export function asciiForStreetFront(frontId: string): TownAsciiInterior | null {
  return townAsciiInterior(STREET_FRONT_ASCII[frontId])
}

export function townAsciiInterior(attractionId?: string): TownAsciiInterior | null {
  if (attractionId === 'vol_canvas_flat') {
    return {
      testid: 'explore-canvas-interior',
      rows: volcanoSaloonRows(),
      finding: VOLCANO_SALOON_INSPECT.name_of_the_bowl.finding,
      trailWord: VOLCANO_SALOON_INSPECT.name_of_the_bowl.carmen.trailWord,
    }
  }
  if (attractionId === 'vol_soldiers_gulch') {
    return {
      testid: 'explore-gulch-interior',
      rows: soldiersGulchRows(),
      finding: SOLDIERS_GULCH_INSPECT.finding,
      trailWord: SOLDIERS_GULCH_INSPECT.carmen.trailWord,
    }
  }
  if (attractionId === 'vol_cemetery') {
    return {
      testid: 'explore-cemetery-interior',
      rows: volcanoCemeteryRows(),
      finding: VOLCANO_CEMETERY_INSPECT.finding,
      trailWord: VOLCANO_CEMETERY_INSPECT.carmen.trailWord,
    }
  }
  return null
}
