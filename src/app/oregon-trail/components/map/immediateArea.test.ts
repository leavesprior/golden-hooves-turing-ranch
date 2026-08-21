/**
 * Immediate-area map: Independence is not the Rockies.
 *   node_modules/.bin/tsx src/app/oregon-trail/components/map/immediateArea.test.ts
 */

import {
  ATLAS_VIEWBOX,
  immediateViewBox,
  pathIntersectsViewBox,
  terrainInImmediateArea,
  viewBoxContains,
} from './immediateArea'
import { CHAPTER_1_TERRAIN } from './terrainData'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}`) }
}

const independence = immediateViewBox('independence')
const kearny = immediateViewBox('fort_kearny')
const southPass = immediateViewBox('south_pass')
const truckee = immediateViewBox('truckee_pass')

const rockies = CHAPTER_1_TERRAIN.find((f) => f.id === 'mountains-rockies-main')!
const sierra = CHAPTER_1_TERRAIN.find((f) => f.id === 'mountains-sierra-nevada')!
const kansasRiver = CHAPTER_1_TERRAIN.find((f) => f.id === 'river-kansas')!
const missouriForest = CHAPTER_1_TERRAIN.find((f) => f.id === 'forest-missouri')!

console.log('T1 — Independence neighborhood is the prairie + next water')
ok(viewBoxContains(independence, 95, 50), 'Independence marker is in the here-box')
ok(viewBoxContains(independence, 88, 48), 'Kansas River (next stop) is in the here-box')
ok(!viewBoxContains(independence, 35, 32), 'South Pass is not in Independence')
ok(!viewBoxContains(independence, 6, 52), 'Truckee / Sierra is not in Independence')
ok(pathIntersectsViewBox(kansasRiver.d, independence), 'Kansas River path is visible here')
ok(pathIntersectsViewBox(missouriForest.d, independence), 'Missouri timber is visible here')
ok(!pathIntersectsViewBox(rockies.d, independence), 'Rockies do not belong at Independence')
ok(!pathIntersectsViewBox(sierra.d, independence), 'Sierra does not belong at Independence')

console.log('T2 — terrain filter matches the box')
{
  const ids = terrainInImmediateArea(CHAPTER_1_TERRAIN, independence).map((f) => f.id)
  ok(ids.includes('river-kansas'), 'keeps Kansas River')
  ok(ids.includes('forest-missouri'), 'keeps Missouri forest')
  ok(!ids.includes('mountains-rockies-main'), 'drops Rockies')
  ok(!ids.includes('mountains-sierra-nevada'), 'drops Sierra')
  ok(!ids.includes('desert-forty-mile'), 'drops Forty Mile Desert')
}

console.log('T3 — Fort Kearny is Platte country, still not the Sierra')
ok(viewBoxContains(kearny, 75, 45), 'Kearny marker in its here-box')
ok(!pathIntersectsViewBox(sierra.d, kearny), 'Sierra not at Kearny')
ok(!pathIntersectsViewBox(rockies.d, kearny), 'Rockies range not yet at Kearny')

console.log('T4 — South Pass is where the first range belongs')
ok(pathIntersectsViewBox(rockies.d, southPass), 'Rockies visible at South Pass')
ok(!pathIntersectsViewBox(sierra.d, southPass), 'Sierra still not at South Pass')
ok(!viewBoxContains(southPass, 95, 50), 'Independence is not in the South Pass box')

console.log('T5 — Sierra belongs at Truckee, not the Missouri timber')
ok(pathIntersectsViewBox(sierra.d, truckee), 'Sierra visible at Truckee')
ok(!pathIntersectsViewBox(missouriForest.d, truckee), 'Missouri forest not at Truckee')

console.log('T6 — atlas still holds the whole trail')
ok(pathIntersectsViewBox(rockies.d, ATLAS_VIEWBOX), 'atlas keeps Rockies')
ok(pathIntersectsViewBox(sierra.d, ATLAS_VIEWBOX), 'atlas keeps Sierra')
ok(pathIntersectsViewBox(kansasRiver.d, ATLAS_VIEWBOX), 'atlas keeps Kansas River')
ok(immediateViewBox('not-a-place').w === ATLAS_VIEWBOX.w, 'unknown id stays atlas')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
