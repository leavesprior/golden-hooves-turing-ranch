/**
 * node_modules/.bin/tsx src/lib/goldCountryLevelRewards.test.ts
 */
import { POST_WIN_CHOICE_KEY } from './arcadeFirstLevel'
import {
  BETWEEN_LEVEL_XP,
  LEVEL_DISCOUNT_STEP,
  STAY_GIFTS,
  STAY_GIFTS_KEY,
  discountFloorForLevel,
  grantBetweenLevelXp,
  levelCompleteCopy,
  postWinChoiceKey,
  readLevelPostWinChoice,
  readStayGifts,
  unlockStayGifts,
  writeLevelPostWinChoice,
} from './goldCountryLevelRewards'

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

ok(LEVEL_DISCOUNT_STEP === 5, 'step is 5%')
ok(discountFloorForLevel(1) === 5, 'L1 floor 5%')
ok(discountFloorForLevel(2) === 10, 'L2 floor 10%')
ok(discountFloorForLevel(3) === 15, 'L3 floor 15%')
ok(discountFloorForLevel(1) + LEVEL_DISCOUNT_STEP === discountFloorForLevel(2), 'L2 is L1+5')
ok(discountFloorForLevel(2) + LEVEL_DISCOUNT_STEP === discountFloorForLevel(3), 'L3 is L2+5')

ok(postWinChoiceKey(1) === POST_WIN_CHOICE_KEY, 'L1 reuses arcade post-win key')
ok(postWinChoiceKey(2) === 'bobr_post_win_choice_l2', 'L2 has its own key')
ok(postWinChoiceKey(3) === 'bobr_post_win_choice_l3', 'L3 has its own key')

const store = new MockStorage()
ok(readLevelPostWinChoice(1, store) === null, 'empty L1 choice')
writeLevelPostWinChoice(2, 'take_discount', store)
ok(readLevelPostWinChoice(2, store) === 'take_discount', 'L2 take stored')
ok(readLevelPostWinChoice(1, store) === null, 'L2 write does not clobber L1')
writeLevelPostWinChoice(1, 'risk_next', store)
ok(readLevelPostWinChoice(1, store) === 'risk_next', 'L1 risk stored')

ok(readStayGifts(store).unlocked === false, 'stay gifts start locked')
const unlocked = unlockStayGifts(store, '2026-08-26T12:00:00.000Z')
ok(unlocked.unlocked === true, 'unlock returns unlocked')
ok(readStayGifts(store).unlocked === true, 'stay gifts persist')
ok(store.getItem(STAY_GIFTS_KEY)?.includes('2026-08-26T12:00:00.000Z') === true, 'unlock timestamp stored')
ok(STAY_GIFTS.length === 3, 'three in-stay gifts')
ok(STAY_GIFTS.every((g) => g.name.length > 0 && g.when.length > 0), 'gifts have name and when')

ok(BETWEEN_LEVEL_XP[1].amount === 100 && BETWEEN_LEVEL_XP[2].amount === 100 && BETWEEN_LEVEL_XP[3].amount === 100, 'each between-level grant is 100')
const xpStore = new MockStorage()
let xp = 0
ok(grantBetweenLevelXp(1, (n) => { xp += n }, xpStore) === 100, 'L1 grant returns 100')
ok(xp === 100, 'L1 grant adds once')
ok(grantBetweenLevelXp(1, (n) => { xp += n }, xpStore) === 100, 'L1 re-read returns 100')
ok(xp === 100, 'L1 grant is one-shot')
ok(grantBetweenLevelXp(2, (n) => { xp += n }, xpStore) === 100, 'L2 grant is separate')
ok(xp === 200, 'L2 does not clobber L1')

ok(levelCompleteCopy(1).nextLabel.toLowerCase().includes('gold country'), 'L1 next is L2')
ok(levelCompleteCopy(2).nextLabel.toLowerCase().includes('hunt'), 'L2 next is hunt')
ok(levelCompleteCopy(3).nextLabel.toLowerCase().includes('gift'), 'L3 next is stay gifts')
ok(!levelCompleteCopy(3).nextHint.toLowerCase().includes('% off'), 'L3 next is not more percent')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryLevelRewards tests passed (${passed})`)
