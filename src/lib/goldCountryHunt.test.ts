/**
 * node_modules/.bin/tsx src/lib/goldCountryHunt.test.ts
 */
import {
  CAPTURE_XP,
  HUNT_NEED,
  HUNT_TRAILS,
  captureXpKey,
  emptyChairForFront,
  grantCaptureXp,
  huntIsHot,
  huntLevelComplete,
  huntStatus,
  huntTowns,
  npcInWind,
  paperClueAt,
  replaceHuntClues,
  showPaperTo,
  trailForPoster,
} from './goldCountryHunt'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(HUNT_TRAILS.length === 3, 'three posters have hunt trails')
ok(HUNT_TRAILS.every((t) => t.clues.length === HUNT_NEED), 'each trail is three Carmen cards')
ok(HUNT_TRAILS.every((t) => t.clues.every((c) => c.posterId === t.posterId)), 'clues belong to their paper')
ok(
  HUNT_TRAILS.every((t) => new Set(t.clues.map((c) => c.locationId)).size >= 2),
  'a trail leaves the town you took the paper in',
)
ok(
  !HUNT_TRAILS.some((t) => /twain|telegraph|1922|jubilee|black bart/i.test(
    t.clues.map((c) => c.card + c.voice).join(' ') + t.emptyChair,
  )),
  'hunt copy stays in 1849',
)

const taken = ['poster_lamp_shy']
const none: string[] = []
ok(trailForPoster('poster_lamp_shy')?.hideNpcId === 'ridge_stranger', 'lamp-shy trail hides the lean man')
ok(huntStatus('poster_lamp_shy', taken, none, none)?.inWind === true, 'taken paper puts him in the wind')
ok(npcInWind('ridge_stranger', taken, none, none), 'the lean man is gone from Abe’s table')
ok(!npcInWind('ridge_stranger', [], none, none), 'without paper he still drinks at the back table')
ok(
  emptyChairForFront('jackson_store', taken, none, none)?.includes('warm') === true,
  'Abe’s store keeps an empty chair',
)
ok(!huntIsHot('poster_lamp_shy', taken, none, none), 'zero cards is not hot')
ok(
  paperClueAt('sheriff_thorn', taken, none, none)?.id === 'hunt_lamp_thorn',
  'Thorn is the first Carmen source',
)

const store = {
  m: new Map<string, string>(),
  getItem(k: string) { return this.m.get(k) ?? null },
  setItem(k: string, v: string) { this.m.set(k, v) },
}
const first = showPaperTo('sheriff_thorn', taken, none, store)
ok(first?.pointsTo === 'murphys', 'Thorn’s card points to Murphys')
ok(huntTowns(taken, none, [first!.id]).includes('murphys'), 'the map marks Murphys next')
ok(showPaperTo('sheriff_thorn', taken, none, store) === null, 'the same man does not give the card twice')

ok(showPaperTo('vintner_pierre', taken, none, store)?.pointsTo === 'kennedy_mine', 'Pierre points to the ridge')
const last = showPaperTo('mae_evans', taken, none, store)
ok(last?.pointsTo === 'jackson', 'Mae sends you back to Abe')
ok(huntIsHot('poster_lamp_shy', taken, none, [first!.id, 'hunt_lamp_pierre', last!.id]), 'three cards run the trail hot')
ok(
  !npcInWind('ridge_stranger', taken, none, ['hunt_lamp_thorn', 'hunt_lamp_pierre', 'hunt_lamp_mae']),
  'when the trail is hot he is back at the table',
)

ok(showPaperTo('old_miner_giuseppe', taken, none, store) === null, 'Giuseppe does not speak the Jackson paper')
ok(
  paperClueAt('old_miner_giuseppe', ['poster_off_roll'], none, none)?.id === 'hunt_roll_giuseppe',
  'Giuseppe is the first card on the claim notice',
)
ok(
  npcInWind('off_roll_stranger', ['poster_off_roll'], none, none),
  'the man off the roll leaves the hole once the claim notice is taken',
)
ok(
  huntIsHot('poster_watered_barrel', ['poster_watered_barrel'], ['barrel_cutter'], none),
  'a served warrant is hot without cards',
)

replaceHuntClues(['hunt_lamp_thorn'], store)
ok(store.getItem('bobr_l3_hunt_clues')?.includes('hunt_lamp_thorn') === true, 'hunt cards persist under the L3 key')

ok(
  huntLevelComplete(['poster_watered_barrel'], ['barrel_cutter'], none) === true,
  'serving a warrant completes L3',
)
ok(
  huntLevelComplete(['poster_watered_barrel'], none, none) === false,
  'an unserved paper is not L3 complete',
)

ok(CAPTURE_XP === 100, 'capture XP matches the outlaw-captured sheet reward')
ok(captureXpKey('ridge_stranger') === 'bobr_capture_xp_ridge_stranger', 'capture XP is keyed per hide')
const xpStore = { m: new Map<string, string>(), getItem(k: string) { return this.m.get(k) ?? null }, setItem(k: string, v: string) { this.m.set(k, v) } }
let xp = 0
ok(grantCaptureXp('ridge_stranger', (n) => { xp += n }, xpStore) === 100, 'first capture grants 100')
ok(xp === 100, 'capture XP adds once')
ok(grantCaptureXp('ridge_stranger', (n) => { xp += n }, xpStore) === 100, 're-read returns 100')
ok(xp === 100, 'capture XP is one-shot per hide')
ok(grantCaptureXp('barrel_cutter', (n) => { xp += n }, xpStore) === 100, 'a second hide is a new grant')
ok(xp === 200, 'two hides do not clobber')
ok(grantCaptureXp('', (n) => { xp += n }, xpStore) === 0, 'empty hide grants nothing')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryHunt tests passed (${passed})`)
