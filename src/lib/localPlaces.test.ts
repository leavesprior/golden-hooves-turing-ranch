import assert from 'node:assert/strict'
import { LOCAL_PLACES, LOCAL_AVOID, localPlacesFor } from './localPlaces'

// Every guest-facing "go here today" entry carries its evidence and its age.
for (const p of LOCAL_PLACES) {
  assert.match(p.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${p.id}: verifiedAt is a date`)
  assert.match(p.source, /^https:\/\//, `${p.id}: source is a URL`)
  assert.ok(p.address.length > 5, `${p.id}: has an address`)
  assert.ok(p.today.length > 5 && p.then.length > 5, `${p.id}: says what it is now and then`)
}

// Ids are unique.
assert.equal(new Set(LOCAL_PLACES.map((p) => p.id)).size, LOCAL_PLACES.length)

// A place on the avoid list is never also recommended.
const avoided = new Set(LOCAL_AVOID.map((a) => a.id))
for (const p of LOCAL_PLACES) assert.equal(avoided.has(p.id), false, `${p.id} is both recommended and avoided`)

// Research 2026-09-23: these are closed or not for guests — never recommended.
const recommended = LOCAL_PLACES.map((p) => `${p.name} ${p.today}`).join(' | ')
assert.doesNotMatch(recommended, /Daffodil Hill/)
assert.doesNotMatch(recommended, /Aimee|Kneading Dough/)
assert.equal(LOCAL_PLACES.some((p) => p.id === 'vol_st_george_dining'), false)

// Volcano covers food, a show, and something to walk or explore.
const vol = localPlacesFor('volcano')
for (const kind of ['food', 'show', 'explore'] as const) {
  assert.ok(vol.some((p) => p.kind === kind), `volcano has a ${kind} place`)
}
// The bakery at 16154 Main is the operating one (own site + Google, 2026-09-23);
// the closed café names there stay on the avoid list, never recommended.
assert.ok(vol.some((p) => p.id === 'vol_baked_in_amador' && p.kind === 'food'))
assert.ok(LOCAL_AVOID.some((a) => a.townId === 'volcano' && /Aimee/.test(a.reason)))

// Only OSM-verified coordinates are stored (see research VOLCANO_LOCAL_PLACES_20260923).
const OSM_VERIFIED = new Set(['38.44175,-120.63058', '38.4431,-120.63079', '38.44241,-120.6316'])
for (const p of LOCAL_PLACES) {
  if (p.coordinates) assert.ok(OSM_VERIFIED.has(`${p.coordinates.lat},${p.coordinates.lng}`), `${p.id}: unverified coordinates`)
}

console.log(`localPlaces: ok (${LOCAL_PLACES.length} places, ${LOCAL_AVOID.length} avoid)`)
