/**
 * node_modules/.bin/tsx src/lib/gftAgeMode.test.ts
 */
import {
  ADULT_LEVEL_STAT_POINTS,
  GFT_AGE_MODE_KEY,
  KID_CREATION_POINTS,
  KID_LEVEL_STAT_POINTS,
  catchWindowMs,
  creationBonusPoints,
  levelUpStatPoints,
  parseAgeMode,
  powderWindowMs,
  readAgeMode,
  scaleKarmaGrant,
  skillCheckDc,
  writeAgeMode,
} from './gftAgeMode'
import { CATCH_MS as ALLEY_CATCH, POWDER_MS } from './goldCountryAlley'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(parseAgeMode(null) === 'adult', 'missing mode is adult')
ok(parseAgeMode('under18') === 'under18', 'kid token parses')
ok(parseAgeMode('adult') === 'adult', 'adult token parses')
ok(parseAgeMode('nope') === 'adult', 'junk token is adult')

const store = {
  m: new Map<string, string>(),
  getItem(k: string) { return this.m.get(k) ?? null },
  setItem(k: string, v: string) { this.m.set(k, v) },
}

ok(readAgeMode(store) === 'adult', 'empty storage is adult')
ok(writeAgeMode('under18', store) === 'under18', 'write returns kid')
ok(store.getItem(GFT_AGE_MODE_KEY) === 'under18', 'kid persists')
ok(readAgeMode(store) === 'under18', 'read-back is kid')

ok(scaleKarmaGrant(10, 'adult') === 10, 'adult karma is full')
ok(scaleKarmaGrant(10, 'under18') === 4, 'kid 10 karma becomes 4')
ok(scaleKarmaGrant(2, 'under18') === 0, 'kid 2 karma becomes 0')
ok(scaleKarmaGrant(1, 'under18') === 0, 'kid 1 karma becomes 0')
ok(scaleKarmaGrant(3, 'under18') === 1, 'kid 3 karma becomes 1')
ok(scaleKarmaGrant(0, 'under18') === 0, 'zero grant stays 0')
ok(scaleKarmaGrant(-3, 'under18') === -3, 'penalties are not scaled')

ok(skillCheckDc(12, 'adult') === 12, 'adult DC unchanged')
ok(skillCheckDc(12, 'under18') === 8, 'kid DC-4')
ok(skillCheckDc(3, 'under18') === 1, 'kid DC will not go below 1')

ok(levelUpStatPoints('adult') === ADULT_LEVEL_STAT_POINTS, 'adult +2 / level')
ok(levelUpStatPoints('under18') === KID_LEVEL_STAT_POINTS, 'kid +1 / level')
ok(ADULT_LEVEL_STAT_POINTS === 2 && KID_LEVEL_STAT_POINTS === 1, 'D&D-style adult grows faster')

ok(creationBonusPoints(false, 'adult') === 12, 'adult 12 buy points')
ok(creationBonusPoints(true, 'adult') === 6, 'adult 6 after 3d6')
ok(creationBonusPoints(false, 'under18') === KID_CREATION_POINTS, 'kid more buy points')
ok(creationBonusPoints(true, 'under18') === 8, 'kid more after 3d6')

ok(catchWindowMs('adult') === ALLEY_CATCH, 'adult catch window is alley CATCH_MS')
ok(catchWindowMs('under18') > ALLEY_CATCH, 'kid gets a longer catch window')
ok(powderWindowMs('adult') === POWDER_MS, 'adult powder window is alley POWDER_MS')
ok(powderWindowMs('under18') > POWDER_MS, 'kid powder beat is slower')

writeAgeMode('adult', store)
ok(scaleKarmaGrant(25, undefined, store) === 25, 'storage adult: hunt-sized grant stays 25')
writeAgeMode('under18', store)
ok(scaleKarmaGrant(25, undefined, store) === 10, 'storage kid: 25 karma becomes 10')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`gftAgeMode tests passed (${passed})`)
