import assert from 'node:assert/strict'
import { placeTier } from './outOfTime'
import { LOCAL_PLACES } from './localPlaces'

// GPS cannot tell one door from the next, so GPS never says "here"; the door
// code does (Leif, 2026-09-24: "on this block" + porch QR).
//
// Door points are the Main Street frontage midpoints of the county parcels
// (Amador County Parcels FeatureServer, APN 029-043-010 and 029-043-007),
// found against OSM way 10286534 (Main Street) on 2026-09-24. Doors are
// 13.9 m apart; phone GPS is 10–50 m.
const BAKED_DOOR = { lat: 38.442472, lng: -120.631226 }
const SIZEMORE_DOOR = { lat: 38.442371, lng: -120.631134 } // 16146 Main

const baked = LOCAL_PLACES.find((p) => p.id === 'vol_baked_in_amador')!.outOfTime!

// Both doors are "on this block" — and the hint says which front is BAKED.
assert.equal(placeTier({ ...BAKED_DOOR, accuracyM: 10 }, baked).tier, 'on_block', 'bakery door is on the block')
assert.equal(placeTier({ ...SIZEMORE_DOOR, accuracyM: 10 }, baked).tier, 'on_block', "Sizemore's door is on the same block")
assert.match(baked.blockHint, /Sizemore/, 'the hint names the neighbour, since GPS cannot')
assert.match(baked.blockHint, /north/, 'BAKED. is north of Sizemore (frontage lat 38.442472 > 38.442371)')
assert.ok(BAKED_DOOR.lat > SIZEMORE_DOOR.lat)

// No card is up yet (needs the owners' yes): nothing may promise one.
assert.equal(baked.doorCode.posted, false)

console.log('outOfTime.keeperDoor: ok')
