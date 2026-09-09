/** 1849 interiors for explorer pins. Street photo is later brick; these are the year. */
import { volcanoSaloonRows, VOLCANO_SALOON_INSPECT } from './volcano-canvas-saloon'
import { soldiersGulchRows, SOLDIERS_GULCH_INSPECT } from './volcano-soldiers-gulch'
import { volcanoCemeteryRows, VOLCANO_CEMETERY_INSPECT } from './volcano-cemetery'

export type TownAsciiInterior = {
  testid: string
  rows: string[]
  finding: string
  trailWord: string
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
