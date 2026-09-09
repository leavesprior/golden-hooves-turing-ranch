/**
 * Pioneer ground is 1849 wood, not later stone.
 *   node_modules/.bin/tsx src/lib/overlay/volcano-cemetery.test.ts
 */
import { GRID_H, GRID_W, volcanoCemeteryRows, VOLCANO_CEMETERY, VOLCANO_CEMETERY_INSPECT } from './volcano-cemetery'
import { townAsciiInterior } from './townAsciiInterior'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const rows = volcanoCemeteryRows()
ok(rows.length === GRID_H, '22 rows')
ok(rows.every((r) => r.length === GRID_W), '40 wide')
ok(rows.join('').includes('+'), 'wooden markers')
ok(VOLCANO_CEMETERY.era.year === 1849, '1849')
ok(!/st\.?\s*george|cobblestone|ghost/i.test(rows.join('')), 'grid is glyphs')
ok(!/st\.?\s*george|1850|ghost hunter/i.test(VOLCANO_CEMETERY_INSPECT.finding), 'finding is first winter, not later stone')
ok(!/volcano/i.test(VOLCANO_CEMETERY_INSPECT.carmen.trailWord), 'trail-word does not name the plaque')
ok(townAsciiInterior('vol_cemetery')?.testid === 'explore-cemetery-interior', 'join id')
ok(townAsciiInterior('vol_canvas_flat')?.testid === 'explore-canvas-interior', 'canvas join still holds')
ok(townAsciiInterior('vol_soldiers_gulch')?.testid === 'explore-gulch-interior', 'gulch join still holds')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed, rows: rows.length, width: rows[0].length }))
