/**
 * Soldiers' Gulch is gravel and a wash, not later brick.
 *   node_modules/.bin/tsx src/lib/overlay/volcano-soldiers-gulch.test.ts
 */
import { GRID_H, GRID_W, soldiersGulchRows, SOLDIERS_GULCH, SOLDIERS_GULCH_INSPECT } from './volcano-soldiers-gulch'
import { townAsciiInterior } from './townAsciiInterior'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const rows = soldiersGulchRows()
ok(rows.length === GRID_H, '22 rows')
ok(rows.every((r) => r.length === GRID_W), '40 wide')
ok(rows.join('').includes('~'), 'creek')
ok(rows.join('').includes('.'), 'gravel')
ok(SOLDIERS_GULCH.era.year === 1849, '1849')
ok(!/st\.?\s*george|cobblestone|madeira/i.test(rows.join('')), 'grid is glyphs')
ok(!/st\.?\s*george/i.test(SOLDIERS_GULCH_INSPECT.finding), 'finding is gravel, not the hotel')
ok(!/volcano/i.test(SOLDIERS_GULCH_INSPECT.carmen.trailWord), 'trail-word does not name the plaque')
const join = townAsciiInterior('vol_soldiers_gulch')
ok(join?.testid === 'explore-gulch-interior', 'join id')
ok(townAsciiInterior('vol_canvas_flat')?.testid === 'explore-canvas-interior', 'canvas join still holds')
ok(townAsciiInterior('vol_cemetery')?.testid === 'explore-cemetery-interior', 'cemetery is wood markers, not brick')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed, rows: rows.length, width: rows[0].length }))
