import { resolveToCanonical, type CanonicalTown } from './townRegistry'
import { TOWN_EDITORIAL } from './goldCountryEditorial'

export type PlaceSceneEra = '1849' | 'today'
export interface PlaceSceneAsset {
  town: CanonicalTown
  historical: { src: string; alt: string; label: string; fictional: boolean; notes: string; pixelated?: boolean }
  modern: { kind: 'maps_embed'; src: string; label: string } | { kind: 'property_photo'; src: string; alt: string; label: string; painting: string }
}

// Official Share → Embed a map output obtained from Google Maps at the registry
// coordinate on 2026-09-13. This is an iframe URL, never downloaded tile imagery.
// Workflow: https://support.google.com/maps/answer/7101463#share_a_map_or_location
export const WEST_POINT_MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3126.945896441194!2d-120.52689999999998!3d38.396499999999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzjCsDIzJzQ3LjQiTiAxMjDCsDMxJzM2LjgiVw!5e0!3m2!1sen!2sus!4v1789329684843!5m2!1sen!2sus'

export function placeSceneFor(id: string): PlaceSceneAsset | undefined {
  const town = resolveToCanonical(id)
  if (!town) return
  if (town.id === 'west_point') return {
    town,
    historical: {
      src: TOWN_EDITORIAL.west_point,
      alt: 'Illustrated log cabins beside an unpaved trail at dusk.',
      label: '1849 · The trail camp',
      fictional: true,
      notes: 'Illustrated camp layout; the individual cabins and view are invented.',
    },
    modern: { kind: 'maps_embed', src: WEST_POINT_MAP_EMBED, label: 'Today · Google Maps' },
  }
  if (town.id === 'bobr_ranch') return {
    town,
    historical: {
      src: '/place-art/editorial/bobr_oak_camp_1849.png',
      alt: 'A fictional canvas camp and small fire beneath spreading valley oaks.',
      label: '1849 · The oak camp',
      fictional: true,
      notes: 'Fictional camp on the ranch land, not a documented settlement.',
      pixelated: true,
    },
    // Visually checked: cabin-2 is the timber house and glass sun porch.
    // Reuses the existing property photograph, published in asset commit 4d5dd34.
    // No capture date or exact camera coordinate is claimed.
    modern: {
      kind: 'property_photo', src: '/cabin-photos/cabin-2.jpg',
      alt: 'The present-day ranch house with its timber siding and glass sun porch.',
      label: 'Today · Property photograph', painting: TOWN_EDITORIAL.bobr_ranch,
    },
  }
}

export function placeSceneMapLink(town: Pick<CanonicalTown, 'lat' | 'lng'>): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(town.lat + ',' + town.lng)
}
