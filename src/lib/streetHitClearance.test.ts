/**
 * Talk chips must not sit on building pins (Look/browser leak).
 *   node_modules/.bin/tsx src/lib/streetHitClearance.test.ts
 */
import { STREET_HIT_CLEARANCE, presentStreetHits, streetHitCollisions } from './goldCountryEditorial'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const hits = presentStreetHits('volcano')
ok(hits.npcs.some((n) => n.id === 'v_bell'), 'Bell is 1849-present')
ok(!hits.npcs.some((n) => n.id === 'v_armand'), 'later hotel clerk is off the 1849 street')
ok(hits.spots.some((s) => s.attractionId === 'vol_canvas_flat'), 'canvas pin is present')
ok(!hits.spots.some((s) => s.attractionId === 'vol_st_george'), 'later hotel pin is off')

const bell = hits.npcs.find((n) => n.id === 'v_bell')
const canvas = hits.spots.find((s) => s.attractionId === 'vol_canvas_flat')
const d = bell && canvas ? Math.hypot(bell.x - canvas.x, bell.y - canvas.y) : 0
ok(d >= STREET_HIT_CLEARANCE, `Bell vs canvas ${d.toFixed(1)} >= ${STREET_HIT_CLEARANCE}`)

const collisions = streetHitCollisions()
ok(collisions.length === 0, collisions.length ? `collisions ${JSON.stringify(collisions)}` : 'no present-street collisions')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed, bell_canvas: Math.round(d * 10) / 10, collisions: collisions.length }))
