/**
 * node_modules/.bin/tsx src/lib/goldCountryTravelTick.test.ts
 */
import { ENCOUNTER_AT, TRAVEL_STEP, goldCountryTravelTick } from './goldCountryTravelTick'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(TRAVEL_STEP === 5, 'step is 5')
ok(ENCOUNTER_AT === 50, 'encounter band starts at 50')

const first = goldCountryTravelTick(0)
ok(first.next === 5 && !first.arrive && !first.rollEncounter, 'first tick is 5%, no arrive, no roll')

const at45 = goldCountryTravelTick(45)
ok(at45.next === 50 && at45.rollEncounter && !at45.arrive, 'crossing 50 rolls once')

const at50 = goldCountryTravelTick(50)
ok(at50.next === 55 && !at50.rollEncounter, 'already at 50 does not re-roll')

const at95 = goldCountryTravelTick(95)
ok(at95.next === 100 && at95.arrive && !at95.rollEncounter, '95→100 arrives')

const at100 = goldCountryTravelTick(100)
ok(at100.next === 100 && at100.arrive, '100 stays arrived (no overflow)')

ok(goldCountryTravelTick(NaN).next === 5, 'NaN starts at 0')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryTravelTick tests passed (${passed})`)
