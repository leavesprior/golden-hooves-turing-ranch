/**
 * node_modules/.bin/tsx src/lib/goldCountryStreet.test.ts
 */
import { getNPCsAtLocation } from '@/app/oregon-trail/data/goldCountryNPCs'
import {
  STREET_POSTERS,
  TOWN_FRONTS,
  everyLocationHasAFront,
  frontHoldsNpc,
  frontsForLocation,
  indoorNpcIds,
  outdoorSearchIds,
  posterForLocation,
  streetNpcs,
  writeArrest,
  readArrests,
  writeBought,
  readBought,
} from './goldCountryStreet'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(everyLocationHasAFront(), 'every Gold Country place has at least one front')
ok(TOWN_FRONTS.every((f) => f.name.trim().length > 0 && f.interior.length > 0), 'fronts are named businesses with interiors')
ok(
  TOWN_FRONTS.every((f) => !getNPCsAtLocation(f.locationId).some((n) => n.name === f.name)),
  'front names are businesses, not NPC names',
)
ok(TOWN_FRONTS.every((f) => f.goods.every((g) => g.price > 0 && g.itemId && g.id.startsWith('good_'))), 'goods are priced wagon items')

const angels = frontsForLocation('angels_camp')
ok(angels.some((f) => f.id === 'angels_saloon' && f.keeperNpcId === 'bartender_ben'), 'Angell’s saloon holds Ben inside')
const angelsStreet = streetNpcs('angels_camp', getNPCsAtLocation('angels_camp'))
ok(!angelsStreet.some((n) => n.id === 'bartender_ben'), 'Ben is not named on the street')
ok(indoorNpcIds('angels_camp').has('bartender_ben'), 'Ben is indoor')

const jacksonStreet = streetNpcs('jackson', getNPCsAtLocation('jackson'))
ok(!jacksonStreet.some((n) => n.id === 'ridge_stranger'), 'wanted man is not named on the street')
ok(jacksonStreet.some((n) => n.id === 'sheriff_thorn'), 'constable is on the street')

const poster = posterForLocation('jackson')
ok(!!poster && poster.hideNpcId === 'ridge_stranger', 'Jackson poster names the lamp-shy man')
const hideFront = TOWN_FRONTS.find((f) => f.id === poster?.hideFrontId)
ok(!!hideFront && hideFront.warrantNpcId === 'ridge_stranger' && frontHoldsNpc(hideFront, 'ridge_stranger'), 'poster match sits inside a shop as a patron')

ok(
  outdoorSearchIds('angels_camp', ['angels_hotel_register', 'angels_saloon', 'foo']).length === 1,
  'indoor searches stay inside the saloon',
)

const store = {
  m: new Map<string, string>(),
  getItem(k: string) { return this.m.get(k) ?? null },
  setItem(k: string, v: string) { this.m.set(k, v) },
}
writeArrest('ridge_stranger', store)
ok(readArrests(store).includes('ridge_stranger'), 'arrest persists')
writeBought('good_flour', store)
ok(readBought(store).includes('good_flour'), 'purchase persists')

ok(STREET_POSTERS.length >= 1, 'at least one warrant poster')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryStreet tests passed (${passed})`)
