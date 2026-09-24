/**
 * Real places a guest can go today, beside the 1849 story of each town.
 *
 * Research: ~/Documents/BOBR/research/volcano_local/VOLCANO_LOCAL_PLACES_20260923.md
 * (spoke report + hub re-fetch of the theatre, St. George and Sizemore pages).
 * Hours rot: every entry carries verifiedAt and its source, and the card says
 * when it was checked. Coordinates are stored only where OpenStreetMap placed
 * the building; Main St addresses are interpolation and stay without a pin.
 */

export type LocalPlaceKind = 'food' | 'show' | 'explore'

export interface LocalPlace {
  id: string
  townId: string
  name: string
  kind: LocalPlaceKind
  address: string
  phone?: string
  url: string
  /** What a guest finds now. */
  today: string
  /** What stood here in the Gold Rush, dated. */
  then: string
  /** ISO date the hours/status were last read from `source`. */
  verifiedAt: string
  source: string
  coordinates?: { lat: number; lng: number }
}

export interface LocalAvoid {
  id: string
  townId: string
  name: string
  reason: string
  verifiedAt: string
}

export const LOCAL_PLACES: LocalPlace[] = [
  {
    id: 'vol_sizemore',
    townId: 'volcano',
    name: 'Sizemore Country Store & Restaurant',
    kind: 'food',
    address: '16146 Main St, Volcano',
    phone: '209-296-4459',
    url: 'https://www.sizemorecountrystore.com/',
    today: 'Open daily 10–7 (kitchen to 6:30): burgers, deli, BBQ, baked goods, Amador beer and local wine, garden patio.',
    then: 'Claims 1852 — two brick-and-limestone stores (Mandelbaum & Klauber’s “Sacramento” and Burleson’s), joined in 1861.',
    verifiedAt: '2026-09-23',
    source: 'https://www.sizemorecountrystore.com/',
  },
  {
    id: 'vol_union_pub',
    townId: 'volcano',
    name: 'Volcano Union Pub',
    kind: 'food',
    address: '21375 Consolation St, Volcano',
    phone: '209-296-7711',
    url: 'https://www.volcanounion.com/',
    today: 'Pub Fri 4:30–8, Sat–Sun 12–8, Mon 4:30–8; closed Tue–Thu. The inn’s rooms are closed for 2026.',
    then: 'Built in 1880 as a miners’ boarding house.',
    verifiedAt: '2026-09-23',
    source: 'https://www.volcanounion.com/',
    coordinates: { lat: 38.4431, lng: -120.63079 },
  },
  {
    id: 'vol_cobblestone',
    townId: 'volcano',
    name: 'Cobblestone Theatre (Volcano Theatre Co.)',
    kind: 'show',
    address: '16121 Main St, Volcano',
    url: 'https://volcanotheatre.net/tickets/',
    today: '45 open seats. 2026: Dr. Jekyll and Mr. Hyde to Oct 3; On The Farce Day of Christmas Nov 6–Dec 13. $24 / $22 seniors, online only.',
    then: 'Stone walls of 1856 — Adolph Mayer’s Tobacco and Cigar Emporium, later Lavezzo’s Wine Shop; gutted by fire in 1900.',
    verifiedAt: '2026-09-23',
    source: 'https://volcanotheatre.net/about/',
  },
  {
    id: 'vol_amphitheatre',
    townId: 'volcano',
    name: 'Volcano Amphitheatre',
    kind: 'show',
    address: 'Main St, across from the Cobblestone, Volcano',
    url: 'https://volcanotheatre.net/tickets/',
    today: 'The summer stage (June–August), entered through an old stone storefront.',
    then: 'The restored Gold Rush facade of the Hale Sash and Door Company.',
    verifiedAt: '2026-09-23',
    source: 'https://volcanotheatre.net/about/',
  },
  {
    id: 'vol_old_abe',
    townId: 'volcano',
    name: 'Old Abe cannon',
    kind: 'explore',
    address: 'Beside the Union Inn, Main & Consolation, Volcano',
    url: 'https://westernmininghistory.com/gallery-image/36956/',
    today: 'Free, outdoors, any time.',
    then: 'Bronze six-pounder cast in 1837 by Cyrus Alger & Co.; legend says it came to town in a hearse around 1863.',
    verifiedAt: '2026-09-23',
    source: 'https://westernmininghistory.com/gallery-image/36956/',
    coordinates: { lat: 38.4431, lng: -120.63079 },
  },
  {
    id: 'vol_soldiers_park',
    townId: 'volcano',
    name: 'Soldiers Gulch plaques (Soldiers Memorial Park)',
    kind: 'explore',
    address: 'Off Main St, Volcano',
    url: 'https://commons.wikimedia.org/wiki/File:Plaque_commemorating_founding_of_Volcano_California.jpg',
    today: 'Two plaques on the founding; a short walk from the hotel.',
    then: 'Stevenson’s New York regiment men camped and mined here from late 1848; the first wagon party came in 1849.',
    verifiedAt: '2026-09-23',
    source: 'https://npgallery.nps.gov/NRHP/GetAsset/NRHP/84000757_text',
    coordinates: { lat: 38.44241, lng: -120.6316 },
  },
  {
    id: 'vol_black_chasm',
    townId: 'volcano',
    name: 'Black Chasm Cavern',
    kind: 'explore',
    address: '15701 Pioneer Volcano Rd, Volcano',
    phone: '888-488-1960',
    url: 'https://cavetouring.com/contact-hours-black-chasm',
    today: 'Guided walking tours, weekdays 10–4, weekends 10–5 (hours can change — check first).',
    then: 'Found by miners in the 1850s.',
    verifiedAt: '2026-09-23',
    source: 'https://cavetouring.com/contact-hours-black-chasm',
  },
  {
    id: 'vol_chawse',
    townId: 'volcano',
    name: 'Indian Grinding Rock State Historic Park (Chaw’se)',
    kind: 'explore',
    address: '14881 Pine Grove-Volcano Rd, Pine Grove',
    url: 'https://www.parks.ca.gov/?page_id=553',
    today: 'Sunrise to sunset, museum 10–4, $8 per vehicle.',
    then: 'Northern Sierra Miwok homeland: about 1,185 bedrock mortars, ground for acorn meal for centuries before 1849.',
    verifiedAt: '2026-09-23',
    source: 'https://www.parks.ca.gov/?page_id=553',
  },
]

export const LOCAL_AVOID: LocalAvoid[] = [
  {
    id: 'vol_st_george_dining',
    townId: 'volcano',
    name: 'St. George Hotel restaurant and saloon',
    reason: 'Both listed CLOSED on the hotel’s own site; the office keeps Thu–Sun 4–7pm. Look from the street.',
    verifiedAt: '2026-09-23',
  },
  {
    id: 'vol_coffee',
    townId: 'volcano',
    name: 'Coffee in Volcano',
    reason: 'No café verified open: Aimee’s Coffee Cabin and Kneading Dough at 16154 Main are listed closed. Sizemore has baked goods.',
    verifiedAt: '2026-09-23',
  },
  {
    id: 'vol_daffodil_hill',
    townId: 'volcano',
    name: 'Daffodil Hill',
    reason: 'Closed to the public indefinitely since July 2019.',
    verifiedAt: '2026-09-23',
  },
]

export function localPlacesFor(townId: string): LocalPlace[] {
  return LOCAL_PLACES.filter((p) => p.townId === townId)
}

export function localAvoidFor(townId: string): LocalAvoid[] {
  return LOCAL_AVOID.filter((a) => a.townId === townId)
}
