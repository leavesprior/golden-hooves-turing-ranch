/** Painted Gold Country stills used while exploring — not the 8-bit wall PNGs. */

const E = '/place-art/editorial'
const V = '?v=20260820a'

export const VOLCANO_MAIN_ART = `${E}/volcano_main.jpg${V}`

/** Painted Gold Country relief — regional map background, not a town street. */
export const GOLD_COUNTRY_MAP_ART = `${E}/gold_country_map.jpg${V}`

/**
 * Frame matching the painted map: Central Valley west, Sierra east,
 * Nevada County north, Mariposa / Yosemite south.
 */
export const GOLD_COUNTRY_MAP_BOUNDS = {
  minLat: 37.2,
  maxLat: 39.5,
  minLng: -121.4,
  maxLng: -119.6,
}

/** Co-located Explorer pins get a small offset so both stay clickable. */
const MAP_OFFSETS: Record<string, { dx: number; dy: number }> = {
  bobr_ranch: { dx: 4, dy: 5 },
  angels_camp_expanded: { dx: 5, dy: 4 },
}

/** Chapter 1 is the road west; later chapters live on the Mother Lode map. */
export function chapterMapArt(chapter: number): string {
  if (chapter <= 1) return `${E}/missouri_prairie.jpg${V}`
  return GOLD_COUNTRY_MAP_ART
}

export function exploreMapPosition(
  id: string,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const pad = 10
  const { minLat, maxLat, minLng, maxLng } = GOLD_COUNTRY_MAP_BOUNDS
  let x = pad + ((lng - minLng) / (maxLng - minLng)) * (100 - 2 * pad)
  let y = pad + ((maxLat - lat) / (maxLat - minLat)) * (100 - 2 * pad)
  const o = MAP_OFFSETS[id]
  if (o) {
    x += o.dx
    y += o.dy
  }
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

export const TOWN_EDITORIAL: Record<string, string> = {
  volcano: `${E}/volcano_main.jpg${V}`,
  angels_camp: `${E}/angels_camp.jpg${V}`,
  angels_camp_expanded: `${E}/angels_camp_expanded.jpg${V}`,
  west_point: `${E}/west_point.jpg${V}`,
  mokelumne_hill: `${E}/mokelumne_hill.jpg${V}`,
  san_andreas: `${E}/san_andreas.jpg${V}`,
  bobr_ranch: `${E}/bobr_ranch.jpg${V}`,
  nevada_city: `${E}/nevada_city.jpg${V}`,
  grass_valley: `${E}/grass_valley.jpg${V}`,
  mariposa: `${E}/mariposa.jpg${V}`,
}

/** Diggings chapter locations that have a painted still (trail + Gold Country). */
const ADVENTURE_EDITORIAL: Record<string, string> = {
  ch1_independence: `${E}/independence.jpg${V}`,
  ch1_alcove_spring: `${E}/missouri_prairie.jpg${V}`,
  ch1_blue_river: `${E}/kansas_river.jpg${V}`,
  ch1_fort_kearny: `${E}/fort_kearny.jpg${V}`,
  ch1_platte_bridge: `${E}/platte_road.jpg${V}`,
  ch1_pawnee_camp: `${E}/platte_road.jpg${V}`,
  ch1_sacramento_waterfront: `${E}/sacramento_valley.jpg${V}`,
  ch1_sutters_fort: `${E}/sacramento_valley.jpg${V}`,
  ch1_sacramento_tent_city: `${E}/sacramento_valley.jpg${V}`,
  ch3_angels_camp: `${E}/angels_camp.jpg${V}`,
  ch3_jumping_frog: `${E}/angels_camp.jpg${V}`,
  ch4_west_point: `${E}/west_point.jpg${V}`,
  ch4_mokelumne_hill: `${E}/mokelumne_hill.jpg${V}`,
  ch4_ranch_site: `${E}/bobr_ranch.jpg${V}`,
  ch5_ranch_house: `${E}/bobr_ranch.jpg${V}`,
  ch2_hangtown: `${E}/hangtown.jpg${V}`,
  ch2_drytown: `${E}/hangtown.jpg${V}`,
  ch2_chinese_camp: `${E}/hangtown.jpg${V}`,
  ch3_donner_pass: `${E}/truckee_pass.jpg${V}`,
  ch3_carson_trail: `${E}/truckee_pass.jpg${V}`,
  ch3_murphys: `${E}/murphys.jpg${V}`,
  ch3_moaning_cavern: `${E}/moaning_cavern.jpg${V}`,
  ch3_natural_bridges: `${E}/natural_bridges.jpg${V}`,
  ch3_big_trees: `${E}/natural_bridges.jpg${V}`,
  ch4_jackson: `${E}/jackson.jpg${V}`,
  jackson: `${E}/jackson.jpg${V}`,
  murphys: `${E}/murphys.jpg${V}`,
  welcome_gate: `${E}/welcome_gate.jpg${V}`,
  moaning_cavern: `${E}/moaning_cavern.jpg${V}`,
  natural_bridges: `${E}/natural_bridges.jpg${V}`,
  harris_ranch: `${E}/harris_ranch.jpg${V}`,
  kennedy_mine: `${E}/jackson.jpg${V}`,
  ironstone_vineyards: `${E}/murphys.jpg${V}`,
  ot_kansas_river: `${E}/kansas_river.jpg${V}`,
  ot_chimney_rock: `${E}/chimney_rock.jpg${V}`,
  ot_independence_rock: `${E}/independence_rock.jpg${V}`,
  ot_south_pass: `${E}/south_pass.jpg${V}`,
  ot_fort_bridger: `${E}/fort_bridger.jpg${V}`,
  ot_raft_river: `${E}/raft_river.jpg${V}`,
  ot_city_of_rocks: `${E}/city_of_rocks.jpg${V}`,
  ot_humboldt_river: `${E}/humboldt_river.jpg${V}`,
  ot_humboldt_sink: `${E}/humboldt_sink.jpg${V}`,
  ot_forty_mile_desert: `${E}/forty_mile_desert.jpg${V}`,
  ot_fort_laramie: `${E}/fort_laramie.jpg${V}`,
}

const PREFIX_TOWN: { prefix: string; town: string }[] = [
  { prefix: 'vol_', town: 'volcano' },
  { prefix: 'ace_', town: 'angels_camp_expanded' },
  { prefix: 'ac_', town: 'angels_camp' },
  { prefix: 'wp_', town: 'west_point' },
  { prefix: 'mh_', town: 'mokelumne_hill' },
  { prefix: 'sa_', town: 'san_andreas' },
  { prefix: 'bobr_', town: 'bobr_ranch' },
  { prefix: 'nc_', town: 'nevada_city' },
  { prefix: 'gv_', town: 'grass_valley' },
  { prefix: 'mp_', town: 'mariposa' },
  { prefix: 'ch2_st_george', town: 'volcano' },
  { prefix: 'ch2_cobblestone', town: 'volcano' },
  { prefix: 'ch2_volcano', town: 'volcano' },
  { prefix: 'ch2_masonic', town: 'volcano' },
  { prefix: 'ch2_miners', town: 'volcano' },
  { prefix: 'ch2_cemetery', town: 'volcano' },
]

export function editorialForExplorePlace(id: string): string | null {
  if (TOWN_EDITORIAL[id]) return TOWN_EDITORIAL[id]
  if (ADVENTURE_EDITORIAL[id]) return ADVENTURE_EDITORIAL[id]
  for (const row of PREFIX_TOWN) {
    if (id === row.prefix || id.startsWith(row.prefix)) return TOWN_EDITORIAL[row.town] || null
  }
  return null
}

export function volcanoArtObjectPosition(attractionId?: string): string {
  if (!attractionId) return 'object-[center_52%]'
  if (attractionId === 'vol_st_george' || attractionId === 'ch2_st_george') return 'object-[20%_45%]'
  if (attractionId === 'vol_theatre' || attractionId === 'ch2_cobblestone') return 'object-[58%_52%]'
  return 'object-[center_52%]'
}

export interface TownHotspot {
  attractionId: string
  x: number
  y: number
}

export interface TownNpc {
  id: string
  name: string
  x: number
  y: number
  line: string
}

/** Building pins on each town painting (percent of the image). */
export const TOWN_HOTSPOTS: Record<string, TownHotspot[]> = {
  volcano: [
    { attractionId: 'vol_st_george', x: 28, y: 42 },
    { attractionId: 'vol_theatre', x: 52, y: 48 },
    { attractionId: 'vol_cannon', x: 14, y: 58 },
    { attractionId: 'vol_observatory', x: 78, y: 28 },
    { attractionId: 'vol_cemetery', x: 88, y: 62 },
  ],
  angels_camp: [
    { attractionId: 'ac_main_street', x: 50, y: 52 },
    { attractionId: 'ac_twain_cabin', x: 22, y: 42 },
    { attractionId: 'ac_museum', x: 70, y: 48 },
    { attractionId: 'ac_frog_jubilee', x: 28, y: 22 },
    { attractionId: 'ac_sutter_mine', x: 84, y: 28 },
  ],
  angels_camp_expanded: [
    { attractionId: 'ace_ross_saloon', x: 28, y: 52 },
    { attractionId: 'ace_main_street', x: 18, y: 48 },
    { attractionId: 'ace_museum', x: 38, y: 42 },
    { attractionId: 'ace_fairgrounds', x: 78, y: 55 },
    { attractionId: 'ace_utica_park', x: 72, y: 62 },
  ],
  west_point: [
    { attractionId: 'wp_main_street', x: 40, y: 58 },
    { attractionId: 'wp_willows', x: 28, y: 48 },
    { attractionId: 'wp_general_store', x: 55, y: 50 },
    { attractionId: 'wp_kit_carson', x: 70, y: 42 },
  ],
  mokelumne_hill: [
    { attractionId: 'mh_hotel_leger', x: 42, y: 38 },
    { attractionId: 'mh_courthouse', x: 48, y: 44 },
    { attractionId: 'mh_ioof_hall', x: 28, y: 62 },
    { attractionId: 'mh_gallows', x: 72, y: 48 },
    { attractionId: 'mh_french_cemetery', x: 86, y: 58 },
  ],
  san_andreas: [
    { attractionId: 'sa_courthouse', x: 48, y: 42 },
    { attractionId: 'sa_museum', x: 78, y: 58 },
    { attractionId: 'sa_main_street', x: 22, y: 62 },
    { attractionId: 'sa_frog_park', x: 14, y: 72 },
  ],
  bobr_ranch: [
    { attractionId: 'bobr_cabin', x: 50, y: 42 },
    { attractionId: 'bobr_campfire', x: 28, y: 78 },
    { attractionId: 'bobr_gold_pan', x: 16, y: 62 },
    { attractionId: 'bobr_treasure', x: 82, y: 72 },
  ],
  nevada_city: [
    { attractionId: 'nc_national_hotel', x: 78, y: 38 },
    { attractionId: 'nc_theater', x: 55, y: 42 },
    { attractionId: 'nc_broad_street', x: 40, y: 55 },
    { attractionId: 'nc_deer_creek', x: 62, y: 72 },
    { attractionId: 'nc_firehouse', x: 22, y: 52 },
  ],
  grass_valley: [
    { attractionId: 'gv_empire_mine', x: 42, y: 28 },
    { attractionId: 'gv_lola_montez', x: 22, y: 58 },
    { attractionId: 'gv_holbrooke', x: 72, y: 52 },
    { attractionId: 'gv_north_star', x: 52, y: 48 },
    { attractionId: 'gv_mill_street', x: 82, y: 50 },
  ],
  mariposa: [
    { attractionId: 'mp_courthouse', x: 52, y: 32 },
    { attractionId: 'mp_museum', x: 52, y: 72 },
    { attractionId: 'mp_main_street', x: 28, y: 72 },
    { attractionId: 'mp_grove', x: 22, y: 32 },
  ],
}

export const TOWN_NPCS: Record<string, TownNpc[]> = {
  volcano: [
    { id: 'v_keeper', name: 'Box-office keeper', x: 58, y: 62, line: 'The Cobblestone keeps fifty. Sleep at the ranch if you want a seat that weekend.' },
    { id: 'v_armand', name: 'Night clerk', x: 24, y: 62, line: 'Room 14 still has a guest who never checked out.' },
  ],
  angels_camp: [
    { id: 'ac_coon', name: 'Bartender', x: 20, y: 68, line: 'A jumper is only as honest as the man who holds him.' },
  ],
  west_point: [
    { id: 'wp_will', name: 'Willows regular', x: 36, y: 68, line: 'Highway 26 still does what the old trails did: everybody passes through.' },
  ],
  mokelumne_hill: [
    { id: 'mh_leger', name: 'Hotel night man', x: 46, y: 58, line: 'We keep a room for the living and a ledger for the rest.' },
  ],
  san_andreas: [
    { id: 'sa_clerk', name: 'Court clerk', x: 36, y: 62, line: 'Bart was undone by laundry. Justice here still reads small marks.' },
  ],
  bobr_ranch: [
    { id: 'br_tobias', name: 'Tobias', x: 62, y: 78, line: 'Back of Beyond is the camp. The towns are the work.' },
  ],
  nevada_city: [
    { id: 'nc_lamp', name: 'Lamp-lighter', x: 22, y: 70, line: 'Gaslight made this place think it was a city. The pines never agreed.' },
  ],
  grass_valley: [
    { id: 'gv_cornish', name: 'Cornish miner', x: 48, y: 62, line: 'The cow kicked a rock. After that we went down instead of along the creek.' },
  ],
  mariposa: [
    { id: 'mp_clerk', name: 'County clerk', x: 22, y: 68, line: 'Oldest courthouse in the mountains. The oaks were here first.' },
  ],
  angels_camp_expanded: [
    { id: 'ace_plaque', name: 'Plaque reader', x: 20, y: 68, line: 'Twain heard the frog here. The rest of the country heard Twain.' },
  ],
}
