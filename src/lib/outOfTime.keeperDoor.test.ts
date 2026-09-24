import assert from 'node:assert/strict'
import { placeTier } from './outOfTime'
import { LOCAL_PLACES } from './localPlaces'

// INTENDED RED until Leif picks how "here" is decided (research
// 16154_MAIN_BUILDING_HISTORY_20260924.md, "Keeper reach").
//
// "here" must mean at THIS door, not the neighbour's. Door points are the
// Main Street frontage midpoints of the county parcels (Amador County Parcels
// FeatureServer, APN 029-043-010 and 029-043-007), found against OSM way
// 10286534 (Main Street) on 2026-09-24. Doors are 13.9 m apart; phone GPS is
// 10–50 m, so a radius alone cannot tell them apart.
const BAKED_DOOR = { lat: 38.442472, lng: -120.631226 }
const SIZEMORE_DOOR = { lat: 38.442371, lng: -120.631134 } // 16146 Main

const baked = LOCAL_PLACES.find((p) => p.id === 'vol_baked_in_amador')!.outOfTime!

// A guest at the bakery's own door, with a good fix, meets the keeper.
assert.equal(placeTier({ ...BAKED_DOOR, accuracyM: 10 }, baked).tier, 'here', 'keeper speaks at the bakery door')

// A guest at Sizemore's door, with the same good fix, must not.
assert.notEqual(
  placeTier({ ...SIZEMORE_DOOR, accuracyM: 10 }, baked).tier,
  'here',
  "keeper at 16154 speaks to a guest standing at Sizemore's door (16146), 13.9 m away",
)

console.log('outOfTime.keeperDoor: ok')
