/**
 * Rain miles: donor is 15 * (1 - 0.2) = 12, not 9.
 * Preview Day 4 measured 9 in rain (2026-08-17). This tape is the law.
 *
 *   npx tsx src/app/oregon-trail/state/rainPace.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { computeTravel } from './travelEngine'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function day(weather: 'fair' | 'rain' | 'storm' | 'snow', pace: 'steady' | 'strenuous' | 'grueling' = 'steady') {
  return computeTravel({
    ...DEFAULT_STATE,
    day: 4,
    distance: 9,
    milesUntilNextLandmark: 93,
    nextLandmark: 'Kansas River Crossing',
    pace,
    weather,
    phase: 'traveling',
    party: [{ id: 'a', name: 'A', health: 100, isSick: false, role: 'leader' as const }],
    food: 80,
  })
}

console.log('T1 — weather cuts a 15-mile steady day')
ok(day('fair').distance === 24, 'fair 15')
ok(day('rain').distance === 21, 'rain 12 (15*0.8), not 9')
ok(day('storm').distance === 17, 'storm 8 (15*0.5 rounded)')
ok(day('snow').distance === 15, 'snow 6 (15*0.4)')

console.log('T2 — rain * grueling is 24, not a skip')
ok(day('rain', 'grueling').distance === 33, 'rain grueling 15*2*0.8=24')

console.log(`\nrain-pace tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
