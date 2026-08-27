/**
 * node_modules/.bin/tsx src/app/oregon-trail/data/riverCrossings.test.ts
 */
import { riverConditionFromDepth } from './riverCrossings'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(riverConditionFromDepth(2.4) === 'low', 'below 2.5 is low')
ok(riverConditionFromDepth(2.5) === 'normal', '2.5 is normal')
ok(riverConditionFromDepth(5) === 'normal', '5 even is still normal')
ok(riverConditionFromDepth(5.1) === 'high', 'just over 5 is high')
ok(riverConditionFromDepth(7) === 'high', '7 even is high, not flood')
ok(riverConditionFromDepth(7.1) === 'flood', 'over 7 is flood, even though it is also over 5')
ok(riverConditionFromDepth(3.5 * 1.6 * 1.4) === 'flood', 'Kansas storm at spring peak is flood')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`riverCrossings tests passed (${passed})`)
