/**
 * Level 2 street grammar (generalizes to every Gold Country place).
 *
 * Street = business FRONT names + people who are actually outside.
 * Indoor keepers/patrons are unnamed until you click a front and step in.
 * Goods are clickable 🌮 purchases (wagon inventory — not stay discounts).
 * A warrant poster is a street object; the match is a patron inside a front.
 */

import type { GoldCountryNPC } from '@/app/oregon-trail/data/goldCountryNPCs'
import { GOLD_COUNTRY_LOCATIONS } from '@/app/oregon-trail/data/goldCountryLocations'
import {
  readLevel2Stamps,
  readTalkedNpcs,
  replaceLevel2Stamps,
  replaceTalkedNpcs,
} from '@/lib/goldCountryLevel2'

export type TownFrontKind =
  | 'saloon'
  | 'general'
  | 'wine'
  | 'equipment'
  | 'cabin'
  | 'office'
  | 'mine'
  | 'cave'
  | 'tent'

export interface ShopGood {
  id: string
  name: string
  desc: string
  price: number
  itemId: string
}

export interface TownFront {
  id: string
  locationId: string
  name: string
  kind: TownFrontKind
  x: number
  y: number
  /** Warrants nail to sheriff / post doors — not the saloon or the store. */
  duty?: 'sheriff' | 'post'
  keeperNpcId?: string
  patronNpcIds: string[]
  searchAreaIds: string[]
  goods: ShopGood[]
  interior: string
  warrantNpcId?: string
}

export interface StreetPoster {
  id: string
  locationId: string
  /** Fronts whose outer wall carries this paper (sheriff and/or post office). */
  postedAtFrontIds: string[]
  alias: string
  look: string
  bounty: number
  hideFrontId: string
  hideNpcId: string
}

export interface Level2Persist {
  stamps: string[]
  talked: string[]
  arrests: string[]
  bought: string[]
  postersSeen: string[]
}

const G = {
  pan: { id: 'good_pan', name: 'Iron pan', desc: 'A Sonoran-style batea. High camp markup.', price: 12, itemId: 'iron_pan' },
  flour: { id: 'good_flour', name: 'Flour sack', desc: 'Fifty pounds. Staple of a canvas town.', price: 8, itemId: 'flour_sack' },
  boots: { id: 'good_boots', name: 'Miner’s boots', desc: 'Leather. Scarce once the mud starts.', price: 22, itemId: 'miner_boots' },
  whiskey: { id: 'good_whiskey', name: 'Whiskey bottle', desc: 'Dear, and the news is free.', price: 15, itemId: 'whiskey_bottle' },
  lamp: { id: 'good_lamp', name: 'Oil lamp', desc: 'Some men will not take one.', price: 10, itemId: 'oil_lamp' },
  pick: { id: 'good_pick', name: 'Pick', desc: 'Iron from the bay. For quartz talk.', price: 14, itemId: 'iron_pick' },
  wine: { id: 'good_wine', name: 'Barrel pour', desc: 'French barrels, not a tasting room.', price: 18, itemId: 'wine_pour' },
  rope: { id: 'good_rope', name: 'Rope', desc: 'For a hole that moans.', price: 9, itemId: 'cave_rope' },
  powder: { id: 'good_powder', name: 'Powder horn', desc: 'Wells Fargo has not built here yet. Still sells.', price: 16, itemId: 'powder_horn' },
}

function goods(...ids: ShopGood[]): ShopGood[] {
  return ids
}

export const TOWN_FRONTS: TownFront[] = [
  {
    id: 'bobr_cabin_porch',
    locationId: 'bobr_cabin',
    name: 'The cabin',
    kind: 'cabin',
    x: 48, y: 44,
    keeperNpcId: 'cynthia_owner',
    patronNpcIds: [],
    searchAreaIds: ['cabin_guest_book'],
    goods: goods(G.flour, G.lamp),
    interior: 'You step onto the porch out of the wind. The guest book is open on the table.',
  },
  {
    id: 'bobr_cabin_barn',
    locationId: 'bobr_cabin',
    name: 'The barn',
    kind: 'tent',
    x: 82, y: 72,
    keeperNpcId: undefined,
    patronNpcIds: [],
    searchAreaIds: ['cabin_barn'],
    goods: goods(G.pan, G.pick),
    interior: 'Hay, old tack, a miner’s kit that does not belong to the ranch.',
  },
  {
    id: 'angels_saloon',
    locationId: 'angels_camp',
    name: 'Angell’s saloon',
    kind: 'saloon',
    x: 36, y: 54,
    keeperNpcId: 'bartender_ben',
    patronNpcIds: ['frog_jockey_lily', 'prospector_old_pete'],
    searchAreaIds: ['angels_hotel_register', 'angels_saloon'],
    goods: goods(G.whiskey, G.flour),
    interior: 'Canvas walls, a plank bar, frog talk already older than the camp.',
  },
  {
    id: 'murphys_barrels',
    locationId: 'murphys',
    name: 'Pierre’s barrels',
    kind: 'wine',
    x: 52, y: 48,
    keeperNpcId: 'vintner_pierre',
    patronNpcIds: ['historian_margaret'],
    searchAreaIds: ['murphys_hotel_register', 'murphys_wine_cellar'],
    goods: goods(G.wine, G.whiskey),
    interior: 'Cool dark under a tent-store. Barrels, not corkscrews.',
  },
  {
    id: 'murphys_traver',
    locationId: 'murphys',
    name: 'Camp store',
    kind: 'general',
    x: 28, y: 58,
    keeperNpcId: 'traver_stone_merchant',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(G.flour, G.boots, G.powder, G.pan),
    interior: 'Plank counters and iron prices. Stone will come later. The goods are now.',
  },
  {
    id: 'volcano_canvas',
    locationId: 'volcano',
    name: 'Canvas saloon',
    kind: 'saloon',
    x: 52, y: 48,
    keeperNpcId: 'volcano_saloon_bell',
    patronNpcIds: ['volcano_placer_ortiz'],
    searchAreaIds: [],
    goods: goods(G.whiskey, G.flour, G.pan),
    interior: 'Mind the canvas — it is all the wall Josiah has. Whiskey dear, news free.',
  },
  {
    id: 'kennedy_office',
    locationId: 'kennedy_mine',
    name: 'Claim office',
    kind: 'office',
    x: 42, y: 38,
    keeperNpcId: 'foreman_harris',
    patronNpcIds: [],
    searchAreaIds: ['kennedy_mine_office'],
    goods: goods(G.pick, G.lamp, G.powder),
    interior: 'A plank office. The book lists placer. The expenses list a shaft.',
  },
  {
    id: 'kennedy_hole',
    locationId: 'kennedy_mine',
    name: 'The new hole',
    kind: 'mine',
    x: 58, y: 52,
    keeperNpcId: undefined,
    patronNpcIds: ['old_miner_giuseppe'],
    searchAreaIds: ['kennedy_mine_shaft'],
    goods: goods(G.lamp, G.rope),
    interior: 'Green timber. No visitors. Giuseppe will not go further without a light.',
  },
  {
    id: 'jackson_store',
    locationId: 'jackson',
    name: 'Spring-camp store',
    kind: 'general',
    x: 40, y: 50,
    keeperNpcId: 'jackson_store_abe',
    patronNpcIds: ['ridge_stranger'],
    searchAreaIds: [],
    goods: goods(G.flour, G.boots, G.pan, G.lamp),
    interior: 'Bottles from the spring, flour, a lamp nobody at the back table will take.',
    warrantNpcId: 'ridge_stranger',
  },
  {
    id: 'jackson_sheriff',
    locationId: 'jackson',
    name: "Constable's office",
    kind: 'office',
    x: 66, y: 54,
    duty: 'sheriff',
    keeperNpcId: 'sheriff_thorn',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(),
    interior: 'A plank office. The paper goes on the door. Thorn takes warrants as a man’s word.',
  },
  {
    id: 'jackson_express',
    locationId: 'jackson',
    name: 'Post office',
    kind: 'office',
    x: 52, y: 38,
    duty: 'post',
    keeperNpcId: 'telegraph_operator_wong',
    patronNpcIds: [],
    searchAreaIds: ['jackson_telegraph_office'],
    goods: goods(G.powder),
    interior: 'Express desk: letters and dust by rider. Jackson has no wire yet. Copies stay on the desk.',
  },
  {
    id: 'murphys_sheriff',
    locationId: 'murphys',
    name: "Deputy's office",
    kind: 'office',
    x: 72, y: 42,
    duty: 'sheriff',
    keeperNpcId: 'deputy_walsh',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(),
    interior: 'A quiet plank office. Walsh likes Murphys peaceful. Paper still goes on the door.',
  },
  {
    id: 'moke_store',
    locationId: 'mokelumne_hill',
    name: 'Hill store',
    kind: 'saloon',
    x: 42, y: 40,
    keeperNpcId: 'innkeeper_rosa',
    patronNpcIds: ['ghost_hunter_edgar'],
    searchAreaIds: ['mokelumne_hotel_basement'],
    goods: goods(G.whiskey, G.flour, G.lamp),
    interior: 'The cellar under the store — the corner that will one day be the Léger.',
  },
  {
    id: 'moaning_tent',
    locationId: 'moaning_cavern',
    name: 'Rope tent',
    kind: 'cave',
    x: 34, y: 42,
    keeperNpcId: 'cave_guide_hector',
    patronNpcIds: ['geologist_chen'],
    searchAreaIds: ['moaning_cavern_depths'],
    goods: goods(G.rope, G.lamp),
    interior: 'A tent at the mouth. Rope, a lamp, and an argument about why it moans.',
  },
  {
    id: 'caverns_tent',
    locationId: 'california_caverns',
    name: 'Cave-city tent',
    kind: 'cave',
    x: 50, y: 48,
    keeperNpcId: undefined,
    patronNpcIds: [],
    searchAreaIds: ['california_caverns_crystal_room'],
    goods: goods(G.lamp, G.rope),
    interior: 'Miners call it Cave City. Crystals in the dark. A lamp for sale at the mouth.',
  },
  {
    id: 'ironstone_cellar',
    locationId: 'ironstone_vineyards',
    name: 'Estate cellar',
    kind: 'wine',
    x: 50, y: 50,
    keeperNpcId: undefined,
    patronNpcIds: [],
    searchAreaIds: ['ironstone_museum'],
    goods: goods(G.wine),
    interior: 'Not yet a museum. A cellar of barrels on Gold Rush ground.',
  },
  {
    id: 'bridges_camp',
    locationId: 'natural_bridges',
    name: 'Creek camp',
    kind: 'tent',
    x: 50, y: 55,
    keeperNpcId: undefined,
    patronNpcIds: [],
    searchAreaIds: ['natural_bridges_creek', 'natural_bridges_cave'],
    goods: goods(G.pan, G.lamp),
    interior: 'A camp at Coyote Creek. Pans, a lamp, the arch overhead.',
  },
  {
    id: 'trees_camp',
    locationId: 'big_trees',
    name: 'Grove camp',
    kind: 'tent',
    x: 50, y: 50,
    keeperNpcId: undefined,
    patronNpcIds: [],
    searchAreaIds: ['big_trees_hollow'],
    goods: goods(G.flour, G.lamp),
    interior: 'A camp among giants already ancient in 1849.',
  },
]

export const STREET_POSTERS: StreetPoster[] = [
  {
    id: 'poster_lamp_shy',
    locationId: 'jackson',
    postedAtFrontIds: ['jackson_sheriff', 'jackson_express'],
    alias: 'The lamp-shy man',
    look: 'Lean. Will not take a lamp. Seen on the ridge above the spring, and now in town.',
    bounty: 40,
    hideFrontId: 'jackson_store',
    hideNpcId: 'ridge_stranger',
  },
]

const ARREST_KEY = 'bobr_l2_arrests'
const BOUGHT_KEY = 'bobr_l2_bought'
const POSTER_KEY = 'bobr_l2_posters_seen'

function readList(key: string, storage?: { getItem(k: string): string | null }): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try {
    const v = JSON.parse(s?.getItem(key) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeList(key: string, next: string[], storage?: { setItem?(k: string, v: string): void }) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(key, JSON.stringify(next)) } catch { /* ignore */ }
}

export function frontsForLocation(locationId: string): TownFront[] {
  return TOWN_FRONTS.filter((f) => f.locationId === locationId)
}

export function posterForLocation(locationId: string): StreetPoster | undefined {
  return STREET_POSTERS.find((p) => p.locationId === locationId)
}

/** One pin per door that carries the paper — outside sheriff / post only. */
export function posterPinsForLocation(locationId: string): { poster: StreetPoster; front: TownFront; x: number; y: number }[] {
  const fronts = frontsForLocation(locationId)
  const pins: { poster: StreetPoster; front: TownFront; x: number; y: number }[] = []
  for (const poster of STREET_POSTERS.filter((p) => p.locationId === locationId)) {
    for (const frontId of poster.postedAtFrontIds) {
      const front = fronts.find((f) => f.id === frontId)
      if (!front || (front.duty !== 'sheriff' && front.duty !== 'post')) continue
      pins.push({
        poster,
        front,
        x: Math.max(8, Math.min(92, front.x + 11)),
        y: Math.max(8, Math.min(92, front.y - 14)),
      })
    }
  }
  return pins
}

export function indoorNpcIds(locationId: string): Set<string> {
  const ids = new Set<string>()
  for (const f of frontsForLocation(locationId)) {
    if (f.keeperNpcId) ids.add(f.keeperNpcId)
    for (const p of f.patronNpcIds) ids.add(p)
  }
  return ids
}

/** People whose names belong on the street painting. */
export function streetNpcs(locationId: string, npcs: GoldCountryNPC[]): GoldCountryNPC[] {
  const indoor = indoorNpcIds(locationId)
  return npcs.filter((n) => !indoor.has(n.id))
}

export function outdoorSearchIds(locationId: string, allSearchIds: string[]): string[] {
  const indoor = new Set(frontsForLocation(locationId).flatMap((f) => f.searchAreaIds))
  return allSearchIds.filter((id) => !indoor.has(id))
}

export function frontHoldsNpc(front: TownFront, npcId: string): boolean {
  return front.keeperNpcId === npcId || front.patronNpcIds.includes(npcId)
}

export function readArrests(storage?: { getItem(k: string): string | null }): string[] {
  return readList(ARREST_KEY, storage)
}

export function writeArrest(npcId: string, storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void }): string[] {
  const next = Array.from(new Set([...readArrests(storage), npcId]))
  writeList(ARREST_KEY, next, storage)
  return next
}

export function readBought(storage?: { getItem(k: string): string | null }): string[] {
  return readList(BOUGHT_KEY, storage)
}

export function writeBought(goodId: string, storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void }): string[] {
  const next = Array.from(new Set([...readBought(storage), goodId]))
  writeList(BOUGHT_KEY, next, storage)
  return next
}

export function readPostersSeen(storage?: { getItem(k: string): string | null }): string[] {
  return readList(POSTER_KEY, storage)
}

export function writePosterSeen(posterId: string, storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void }): string[] {
  const next = Array.from(new Set([...readPostersSeen(storage), posterId]))
  writeList(POSTER_KEY, next, storage)
  return next
}

/** Every mapped Gold Country place has at least one door you can enter. */
export function everyLocationHasAFront(): boolean {
  return GOLD_COUNTRY_LOCATIONS.every((loc) => frontsForLocation(loc.id).length > 0)
}

export function snapshotLevel2Persist(storage?: { getItem(k: string): string | null }): Level2Persist {
  return {
    stamps: readLevel2Stamps(storage),
    talked: readTalkedNpcs(storage),
    arrests: readArrests(storage),
    bought: readBought(storage),
    postersSeen: readPostersSeen(storage),
  }
}

export function applyLevel2Persist(
  data: Level2Persist | undefined,
  storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void },
): void {
  if (!data || typeof data !== 'object') return
  if (Array.isArray(data.stamps)) replaceLevel2Stamps(data.stamps, storage)
  if (Array.isArray(data.talked)) replaceTalkedNpcs(data.talked, storage)
  if (Array.isArray(data.arrests)) writeList(ARREST_KEY, Array.from(new Set(data.arrests)), storage)
  if (Array.isArray(data.bought)) writeList(BOUGHT_KEY, Array.from(new Set(data.bought)), storage)
  if (Array.isArray(data.postersSeen)) writeList(POSTER_KEY, Array.from(new Set(data.postersSeen)), storage)
}
