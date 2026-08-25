/**
 * node_modules/.bin/tsx src/lib/goldCountryLevel2.test.ts
 */
import {
  LEVEL2_CASES,
  LEVEL2_VISIT_GOAL,
  caseForLocation,
  level2Progress,
} from './goldCountryLevel2'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(LEVEL2_CASES.length === 8, 'eight cases')
ok(LEVEL2_VISIT_GOAL === 5, 'goal is 5')
ok(LEVEL2_CASES.every((c) => c.id && c.title && c.example && c.verb), 'cases fully labeled')
ok(!!caseForLocation('angels_camp'), 'angels camp is a case')
ok(!caseForLocation('ironstone_vineyards'), 'ironstone is not in the first eight')

const empty = level2Progress([])
ok(empty.count === 0 && empty.complete === false, 'empty is not complete')

const hqOnly = level2Progress(['bobr_cabin'])
ok(hqOnly.count === 1 && hqOnly.complete === false, 'HQ alone is not complete')

const five = level2Progress([
  'bobr_cabin',
  'angels_camp',
  'murphys',
  'volcano',
  'kennedy_mine',
  'unrelated',
])
ok(five.count === 5 && five.complete === true, 'five cases complete L2')
ok(five.visited.includes('volcano'), 'volcano counted')
ok(!five.visited.includes('unrelated'), 'unknown ids ignored')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryLevel2 tests passed (${passed})`)
