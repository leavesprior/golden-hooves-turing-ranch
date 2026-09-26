import assert from 'node:assert/strict'
import { LIVING_TRAIL_NODES } from './livingTrailChains'

// Sandy Gulch: the stop stands at the CHL #253 cairn, 0.4 mi west of Associated Office Rd on SR-26
// (HMDB text; OSM-measured; seen in Street View), not at the Associated Office Rd junction where
// HMDB's own coordinates point (2026-09-24).
const sg = LIVING_TRAIL_NODES.find((n) => n.id === 'lt_wp_sandy_gulch')!
assert.ok(sg, 'Sandy Gulch stop exists')
const toRad = (d: number) => (d * Math.PI) / 180
const m = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  6371000 * 2 * Math.asin(Math.sqrt(Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2))
assert.ok(m(sg.geofence, { lat: 38.379061, lng: -120.540014 }) < 30, 'Sandy Gulch stop is at the cairn')
assert.ok(m(sg.geofence, { lat: 38.38019, lng: -120.532862 }) > 500, 'not at the Associated Office Rd junction')
console.log('livingTrailSandyGulch: ok')
