/**
 * node_modules/.bin/tsx src/lib/goldCountryLevel2.test.ts
 */
import {
  LEVEL2_CASES,
  LEVEL2_VISIT_GOAL,
  caseForLocation,
  clueWorked,
  editorialTownId,
  level2MapPosition,
  level2PinPosition,
  level2Progress,
  readLevel2Stamps,
  writeLevel2Stamp,
  writeTalkedNpc,
  readTalkedNpcs,
} from './goldCountryLevel2'

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
}

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
ok(LEVEL2_CASES.every((c) => c.clues.length === 3 && c.warrant && c.icon), 'each case has 3 clues and a warrant')
ok(!!caseForLocation('angels_camp'), 'angels camp is a case')
ok(editorialTownId('bobr_cabin') === 'bobr_ranch', 'cabin uses ranch painting')
ok(editorialTownId('volcano') === 'volcano', 'volcano id unchanged')
ok(level2MapPosition(38.39, -120.53).x > 10 && level2MapPosition(38.39, -120.53).x < 90, 'ranch pin is on the map')
ok(level2MapPosition(38.07, -120.54).y > level2MapPosition(38.44, -120.63).y, 'Angels is south of Volcano on the map')
ok(level2PinPosition('angels_camp', 38.07, -120.54).y !== level2PinPosition('bobr_cabin', 38.39, -120.53).y, 'nudged pins are not stacked')

const empty = level2Progress({})
ok(empty.count === 0 && empty.complete === false, 'empty is not complete')

ok(clueWorked(LEVEL2_CASES[1].clues[0], ['angels_hotel_register'], []), 'search clue counts')
ok(!clueWorked(LEVEL2_CASES[1].clues[2], ['angels_hotel_register'], []), 'talk clue needs npc')
ok(clueWorked(LEVEL2_CASES[1].clues[2], [], ['bartender_ben']), 'talk clue counts')

const store = new MockStorage()
writeLevel2Stamp('angels_camp', store)
writeLevel2Stamp('murphys', store)
writeLevel2Stamp('volcano', store)
writeLevel2Stamp('kennedy_mine', store)
writeLevel2Stamp('jackson', store)
ok(readLevel2Stamps(store).length === 5, 'five stamps stored')
ok(level2Progress({ stamps: readLevel2Stamps(store) }).complete === true, 'five stamps complete L2')

writeTalkedNpc('bartender_ben', store)
ok(readTalkedNpcs(store).includes('bartender_ben'), 'talked npc stored')

ok(
  LEVEL2_CASES.every((c) => new Set(c.clues.map((cl) => cl.id)).size === 3),
  'clue ids unique per case',
)

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryLevel2 tests passed (${passed})`)
