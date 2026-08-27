/**
 * Level 2 street grammar (generalizes to every Gold Country place).
 *
 * Street = business FRONT names + people who are actually outside.
 * Indoor keepers/patrons are unnamed until you click a front and step in.
 * Goods are clickable 🌮 purchases (wagon inventory — not stay discounts).
 * A warrant poster hangs on the sheriff wall. Click the office (or the paper)
 * to read the board. Taking a paper stores it with terms: bring-in-alive, or
 * dead-or-alive. The posted purse thins when many copy the paper and fail.
 */

import type { GoldCountryNPC } from '@/app/oregon-trail/data/goldCountryNPCs'
import { GOLD_COUNTRY_LOCATIONS } from '@/app/oregon-trail/data/goldCountryLocations'
import {
  readLevel2Stamps,
  readTalkedNpcs,
  replaceLevel2Stamps,
  replaceTalkedNpcs,
} from '@/lib/goldCountryLevel2'
import { readHuntClues, replaceHuntClues } from '@/lib/goldCountryHunt'
import { readGuestBookPlayerLines, writeGuestBookPlayerLines, type GuestBookLine } from '@/lib/goldCountryGuestBook'

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
  /** Offset from the door so the paper sits on the wall, not in the sky. */
  hangDx?: number
  hangDy?: number
}

export type WarrantApproach = 'alive' | 'dead_or_alive'
export type WarrantCapture = 'alive' | 'dead'
/**
 * Wall form:
 *  wanted — Jackson constable paper
 *  camp_notice — Murphys alcalde (no county until Feb 1850)
 *  claim_notice — ridge claim-guard; rare, high purse, quartz/dust off the roll
 */
export type WarrantForm = 'wanted' | 'camp_notice' | 'claim_notice'

export interface StreetPoster {
  id: string
  locationId: string
  /** Fronts whose outer wall carries this paper (sheriff and/or post office). */
  postedAtFrontIds: string[]
  alias: string
  look: string
  crime: string
  lastSeen: string
  /** Default wanted. camp_notice = alcalde paper (no county yet). */
  form?: WarrantForm
  /** Posted reward before any failed takes. */
  bounty: number
  /** County will not go below this. */
  bountyFloor: number
  /** Riders who already copied the paper when you first see the wall. */
  seedTakes: number
  hideFrontId: string
  hideNpcId: string
}

export interface TakenWarrant {
  id: string
  approach: WarrantApproach
  bountyAtTake: number
}

export interface Level2Persist {
  stamps: string[]
  talked: string[]
  arrests: string[]
  bought: string[]
  postersSeen: string[]
  takenWarrants?: TakenWarrant[]
  warrantTakes?: Record<string, number>
  warrantDay?: number
  huntClues?: string[]
  guestBook?: GuestBookLine[]
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
  meat: { id: 'good_meat', name: 'Fresh cut', desc: 'Mutton for the hole. Ellis will keep a shop in town by 1850.', price: 11, itemId: 'fresh_cut' },
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
    x: 32, y: 58,
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
    patronNpcIds: ['historian_margaret', 'barrel_cutter'],
    warrantNpcId: 'barrel_cutter',
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
    hangDx: 3,
    hangDy: 4,
    duty: 'sheriff',
    keeperNpcId: 'foreman_harris',
    patronNpcIds: [],
    searchAreaIds: ['kennedy_mine_office'],
    goods: goods(G.pick, G.lamp, G.powder),
    interior: 'A plank office and a watch. Partners post paper when a man is off the roll. The book lists placer. The expenses list a shaft.',
  },
  {
    id: 'kennedy_butcher',
    locationId: 'kennedy_mine',
    name: 'Meat stall',
    kind: 'tent',
    x: 26, y: 58,
    keeperNpcId: 'ellis_evans',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(G.meat, G.flour),
    interior: 'Canvas, hooks, a fly-cloth. Ellis cuts for the hole. His sister Mae takes the stall when rain comes. Town butcher-shop talk is for 1850. This ridge eats now.',
  },
  {
    id: 'kennedy_hole',
    locationId: 'kennedy_mine',
    name: 'The new hole',
    kind: 'mine',
    x: 58, y: 52,
    keeperNpcId: undefined,
    patronNpcIds: ['old_miner_giuseppe', 'off_roll_stranger'],
    warrantNpcId: 'off_roll_stranger',
    searchAreaIds: ['kennedy_mine_shaft'],
    goods: goods(G.lamp, G.rope),
    interior: 'Green timber. No visitors. Giuseppe will not go further without a light.',
  },
  {
    id: 'jackson_store',
    locationId: 'jackson',
    name: 'Spring-camp store',
    kind: 'general',
    x: 24, y: 50,
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
    x: 54, y: 50,
    hangDx: 12,
    hangDy: 4,
    duty: 'sheriff',
    keeperNpcId: 'sheriff_thorn',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(),
    interior: 'A plank office. The posters hang on the outer wall. Thorn takes a man’s word, and the paper.',
  },
  {
    id: 'jackson_express',
    locationId: 'jackson',
    name: 'Express tent',
    kind: 'office',
    x: 78, y: 42,
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
    name: "Alcalde's office",
    kind: 'office',
    x: 68, y: 48,
    hangDx: -10,
    hangDy: 4,
    duty: 'sheriff',
    keeperNpcId: 'deputy_walsh',
    patronNpcIds: [],
    searchAreaIds: [],
    goods: goods(),
    interior: 'A quiet plank office. Calaveras has no county yet. Walsh nails camp notices like an alcalde’s man.',
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
    look: 'Lean. Will not take a lamp. Hat brim low. Pays cash and does not talk.',
    crime: 'Claim-jumping, and a man left cold on the ridge above the spring.',
    lastSeen: 'The ridge above Botilleas. Now in town. Will not take a lamp.',
    form: 'wanted',
    bounty: 40,
    bountyFloor: 16,
    seedTakes: 2,
    hideFrontId: 'jackson_store',
    hideNpcId: 'ridge_stranger',
  },
  {
    id: 'poster_watered_barrel',
    locationId: 'murphys',
    postedAtFrontIds: ['murphys_sheriff'],
    alias: 'The barrel-hide man',
    look: 'Stout. Wine on the cuffs. Pays in coin, never dust. Sleeps by the casks.',
    crime: 'Stealing gold-dust from under a miner’s pillow on Murphy’s Flat.',
    lastSeen: 'Pierre’s tent-store, among the barrels. The alcalde wants him living.',
    form: 'camp_notice',
    bounty: 28,
    bountyFloor: 12,
    seedTakes: 4,
    hideFrontId: 'murphys_barrels',
    hideNpcId: 'barrel_cutter',
  },
  {
    id: 'poster_off_roll',
    locationId: 'kennedy_mine',
    postedAtFrontIds: ['kennedy_office'],
    alias: 'The man off the roll',
    look: 'Lamp-shy in the new hole. Not on Harris’s book. Dust in the cuffs, quartz talk in the dark.',
    crime: 'Taking dust and quartz from a hole the partners keep watch on. High-grading before the mine has a name.',
    lastSeen: 'The new hole on the ridge above Jackson. Giuseppe saw him. He would not take a lamp.',
    form: 'claim_notice',
    bounty: 120,
    bountyFloor: 48,
    seedTakes: 1,
    hideFrontId: 'kennedy_hole',
    hideNpcId: 'off_roll_stranger',
  },
]

const ARREST_KEY = 'bobr_l2_arrests'
const BOUGHT_KEY = 'bobr_l2_bought'
const POSTER_KEY = 'bobr_l2_posters_seen'
const TAKEN_KEY = 'bobr_l2_taken_warrants'
const TAKES_KEY = 'bobr_l2_warrant_takes'
const WARRANT_DAY_KEY = 'bobr_l2_warrant_day'

const BOUNTY_DECAY = 0.9
const DEAD_PAY_RATIO = 0.5

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

export function postersForLocation(locationId: string): StreetPoster[] {
  return STREET_POSTERS.filter((p) => p.locationId === locationId)
}

export function posterForLocation(locationId: string): StreetPoster | undefined {
  return postersForLocation(locationId)[0]
}

/** Pocket paper whose hideNpcId matches — warrant machine × kin face. */
export function paperOnNpc(
  taken: TakenWarrant[],
  npcId: string | undefined,
): StreetPoster | undefined {
  if (!npcId) return undefined
  return STREET_POSTERS.find((p) => p.hideNpcId === npcId && taken.some((t) => t.id === p.id))
}

export function sheriffFrontForLocation(locationId: string): TownFront | undefined {
  return frontsForLocation(locationId).find((f) => f.duty === 'sheriff')
}

/** One pin per door that carries the paper — outside sheriff / post only. */
export function posterPinsForLocation(locationId: string): { poster: StreetPoster; front: TownFront; x: number; y: number }[] {
  const fronts = frontsForLocation(locationId)
  const pins: { poster: StreetPoster; front: TownFront; x: number; y: number }[] = []
  for (const poster of postersForLocation(locationId)) {
    for (const frontId of poster.postedAtFrontIds) {
      const front = fronts.find((f) => f.id === frontId)
      if (!front || front.duty !== 'sheriff') continue
      const dx = typeof front.hangDx === 'number' ? front.hangDx : 2
      const dy = typeof front.hangDy === 'number' ? front.hangDy : -11
      pins.push({
        poster,
        front,
        x: Math.max(8, Math.min(92, front.x + dx)),
        y: Math.max(8, Math.min(92, front.y + dy)),
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

function parseTakenWarrants(raw: unknown): TakenWarrant[] {
  if (!Array.isArray(raw)) return []
  const out: TakenWarrant[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const rec = row as Record<string, unknown>
    const approach = rec.approach
    if (typeof rec.id !== 'string' || rec.id.length === 0) continue
    if (approach !== 'alive' && approach !== 'dead_or_alive') continue
    const bountyAtTake = typeof rec.bountyAtTake === 'number' && Number.isFinite(rec.bountyAtTake) ? rec.bountyAtTake : 0
    out.push({ id: rec.id, approach, bountyAtTake })
  }
  return out
}

function parseTakes(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v)
  }
  return out
}

export function readTakenWarrants(storage?: { getItem(k: string): string | null }): TakenWarrant[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try {
    return parseTakenWarrants(JSON.parse(s?.getItem(TAKEN_KEY) || '[]'))
  } catch {
    return []
  }
}

function writeTakenWarrants(next: TakenWarrant[], storage?: { setItem?(k: string, v: string): void }) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(TAKEN_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

export function readWarrantTakes(storage?: { getItem(k: string): string | null }): Record<string, number> {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try {
    return parseTakes(JSON.parse(s?.getItem(TAKES_KEY) || '{}'))
  } catch {
    return {}
  }
}

function writeWarrantTakes(next: Record<string, number>, storage?: { setItem?(k: string, v: string): void }) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(TAKES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

export function readWarrantDay(storage?: { getItem(k: string): string | null }): number {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const n = Number.parseInt(s?.getItem(WARRANT_DAY_KEY) || '', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function writeWarrantDay(day: number, storage?: { setItem?(k: string, v: string): void }) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(WARRANT_DAY_KEY, String(day)) } catch { /* ignore */ }
}

export function takesForPoster(
  poster: StreetPoster,
  storage?: { getItem(k: string): string | null },
): number {
  const stored = readWarrantTakes(storage)[poster.id]
  return typeof stored === 'number' ? stored : poster.seedTakes
}

/** Posted purse: each unsuccessful take knocks 10% off, down to the floor. */
export function postedBounty(
  poster: StreetPoster,
  takes?: number,
  storage?: { getItem(k: string): string | null },
): number {
  const n = takes ?? takesForPoster(poster, storage)
  const decayed = Math.round(poster.bounty * Math.pow(BOUNTY_DECAY, Math.max(0, n)))
  return Math.max(poster.bountyFloor, decayed)
}

export function capturePayout(taken: TakenWarrant, method: WarrantCapture): number {
  if (method === 'alive') return Math.max(0, Math.floor(taken.bountyAtTake))
  return Math.max(1, Math.floor(taken.bountyAtTake * DEAD_PAY_RATIO))
}

export function takenWarrantFor(
  posterId: string,
  storage?: { getItem(k: string): string | null },
): TakenWarrant | undefined {
  return readTakenWarrants(storage).find((t) => t.id === posterId)
}

/**
 * Copy the paper into the player's pocket with chosen terms.
 * Locks the purse at the posted amount *before* this take. A second copy of
 * the same paper only changes terms — it does not thin the purse again.
 */
export function takeWarrant(
  posterId: string,
  approach: WarrantApproach,
  storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void },
): TakenWarrant | null {
  const poster = STREET_POSTERS.find((p) => p.id === posterId)
  if (!poster) return null
  if (poster.form === 'camp_notice' || poster.form === 'claim_notice') approach = 'alive'
  const existing = takenWarrantFor(posterId, storage)
  if (existing) {
    const updated: TakenWarrant = { ...existing, approach }
    writeTakenWarrants(
      readTakenWarrants(storage).map((t) => (t.id === posterId ? updated : t)),
      storage,
    )
    writePosterSeen(posterId, storage)
    return updated
  }
  const bountyAtTake = postedBounty(poster, undefined, storage)
  const takes = { ...readWarrantTakes(storage) }
  takes[posterId] = takesForPoster(poster, storage) + 1
  writeWarrantTakes(takes, storage)
  const taken: TakenWarrant = { id: posterId, approach, bountyAtTake }
  writeTakenWarrants([...readTakenWarrants(storage), taken], storage)
  writePosterSeen(posterId, storage)
  return taken
}

/**
 * Other riders copy the paper and come back empty. Each Gold Country day
 * an unserved warrant sits, the posted purse thins.
 */
export function tickOutstandingWarrants(
  day: number,
  storage?: { getItem(k: string): string | null; setItem?(k: string, v: string): void },
): Record<string, number> {
  const safeDay = Number.isFinite(day) && day > 0 ? Math.floor(day) : 1
  const last = readWarrantDay(storage)
  const takes = { ...readWarrantTakes(storage) }
  if (last <= 0) {
    writeWarrantDay(safeDay, storage)
    return takes
  }
  if (safeDay <= last) return takes
  const delta = safeDay - last
  const arrests = readArrests(storage)
  for (const poster of STREET_POSTERS) {
    if (arrests.includes(poster.hideNpcId)) continue
    takes[poster.id] = takesForPoster(poster, storage) + delta
  }
  writeWarrantTakes(takes, storage)
  writeWarrantDay(safeDay, storage)
  return takes
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
    takenWarrants: readTakenWarrants(storage),
    warrantTakes: readWarrantTakes(storage),
    warrantDay: readWarrantDay(storage),
    huntClues: readHuntClues(storage),
    guestBook: readGuestBookPlayerLines(storage),
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
  if (Array.isArray(data.takenWarrants)) writeTakenWarrants(parseTakenWarrants(data.takenWarrants), storage)
  if (data.warrantTakes && typeof data.warrantTakes === 'object') writeWarrantTakes(parseTakes(data.warrantTakes), storage)
  if (typeof data.warrantDay === 'number' && Number.isFinite(data.warrantDay)) writeWarrantDay(Math.max(0, Math.floor(data.warrantDay)), storage)
  if (Array.isArray(data.huntClues)) replaceHuntClues(data.huntClues, storage)
  if (Array.isArray(data.guestBook)) writeGuestBookPlayerLines(data.guestBook, storage)
}
