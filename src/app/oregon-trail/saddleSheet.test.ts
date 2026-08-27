/**
 * node_modules/.bin/tsx src/app/oregon-trail/saddleSheet.test.ts
 */
import { BASE_STATS, withBackgroundBonuses } from './characterContext'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(BASE_STATS.Agility === 5, 'OT base Agility is 5, not 3')
ok(BASE_STATS.Expertise === 5, 'OT base Expertise is 5')

const scout = withBackgroundBonuses(BASE_STATS, 'frontier_scout')
ok(scout.Agility === 7, 'scout folds +2 Agility onto the sheet the river reads')
ok(scout.Expertise === 7, 'scout folds +2 Expertise')
ok(scout.Shrewdness === 5, 'scout does not bump Shrewdness')

const doctor = withBackgroundBonuses({ ...BASE_STATS, Durability: 8 }, 'doctor')
ok(doctor.Durability === 10, 'spent points plus doctor bonus')
ok(doctor.Shrewdness === 7, 'doctor +2 Shrewdness')

const hotPink = withBackgroundBonuses({ ...BASE_STATS, Shrewdness: 17 }, 'pinkerton_veteran')
ok(hotPink.Shrewdness === 18, 'background cannot push a letter past 18')
ok(hotPink.Expertise === 7, 'Pinkerton Expertise still +2 when under the cap')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`saddleSheet tests passed (${passed})`)
