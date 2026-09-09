/**
 * Canvas saloon is 1849 tent, not St. George brick.
 *   node_modules/.bin/tsx src/lib/overlay/volcano-canvas-saloon.test.ts
 */
import { GRID_H, GRID_W, volcanoSaloonRows, VOLCANO_SALOON, VOLCANO_SALOON_INSPECT } from './volcano-canvas-saloon'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const rows = volcanoSaloonRows()
ok(rows.length === GRID_H, '22 rows')
ok(rows.every((r) => r.length === GRID_W), '40 wide')
ok(rows[GRID_H - 1].includes('++++'), 'south flap is the door')
ok(rows[8].includes('#'), 'bar is a wall of hash')
ok(rows.join('').includes('f'), 'canvas walls')
ok(VOLCANO_SALOON.era.year === 1849, '1849')
ok(!/st\.?\s*george|cobblestone|madeira/i.test(rows.join('')), 'grid is glyphs, not later names')
ok(!/st\.?\s*george/i.test(VOLCANO_SALOON_INSPECT.name_of_the_bowl.finding), 'finding is the basin, not the hotel')
ok(VOLCANO_SALOON_INSPECT.name_of_the_bowl.carmen.pointsTo === 'volcano', 'carmen points at volcano')
ok(!/volcano/i.test(VOLCANO_SALOON_INSPECT.name_of_the_bowl.carmen.trailWord), 'trail-word does not name the plaque')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed, rows: rows.length, width: rows[0].length }))
