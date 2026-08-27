/**
 * node_modules/.bin/tsx src/lib/goldCountryAlley.test.ts
 */
import {
  ALLEY_LENGTH,
  agilityDifficulty,
  alleyForFront,
  calledShot,
  catchTimeout,
  chooseTool,
  fleshWalls,
  gunShotDifficulty,
  startChase,
  stepChase,
  theyFire,
  theyFireLuckDifficulty,
} from './goldCountryAlley'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

let s = startChase('store_back')
ok(s.distance === ALLEY_LENGTH && s.phase === 'run' && s.ascii, 'chase starts in the lane, ASCII walls')
s = fleshWalls(s)
ok(!s.ascii, 'ascii2-to-pixel flesh')
s = stepChase(s, false)
ok(s.distance === ALLEY_LENGTH, 'a failed agility step does not close')
s = stepChase(s, true)
ok(s.distance === ALLEY_LENGTH - 1, 'a good step closes one')
for (let i = 0; i < 10 && s.phase === 'run'; i++) s = stepChase(s, true)
ok(s.phase === 'catch' && s.distance === 0, 'enough steps open the catch window')

ok(alleyForFront('jackson_store') === 'store_back', 'Jackson hide is the store back')
ok(alleyForFront('murphys_barrels') === 'barrel_lane', 'Murphys hide is the barrel lane')
ok(alleyForFront('kennedy_hole') === 'hole_drift', 'ridge hide is the drift')

s = theyFire(s, false, 'gun')
ok(s.theyShot && s.tools.rope && s.tools.gun, 'a miss leaves both choices')
const twice = theyFire(s, true, 'rope')
ok(twice.tools.rope && twice.tools.gun, 'a second they-fire does not take another choice')

let hit = startChase('store_back')
while (hit.phase === 'run') hit = stepChase(hit, true)
hit = theyFire(hit, true, 'rope')
ok(hit.theyShot && !hit.tools.rope && hit.tools.gun, 'a hit takes the rope away')
s = hit
const stuck = chooseTool(s, 'rope', false)
ok(stuck.phase === 'catch', 'gone rope cannot be chosen')
s = chooseTool(s, 'gun', false)
ok(s.phase === 'called', 'gun opens called shots')
const chest = calledShot(s, 'chest', true, false)
ok(chest.phase === 'called' && chest.outcome === null, 'alive paper blocks the chest')
s = calledShot(s, 'hand', true, false)
ok(s.disarmed, 'Expertise hand-shot disarms')
s = calledShot(s, 'knee', true, false)
ok(s.outcome === 'alive' && s.hobbled, 'knee after disarm brings him in alive')

let r = startChase('barrel_lane')
while (r.phase === 'run') r = stepChase(r, true)
ok(chooseTool(r, 'rope', false).phase === 'catch' && !chooseTool(r, 'rope', false).outcome, 'rope before powder is a no-op')
ok(catchTimeout(r).phase === 'catch' && !catchTimeout(r).outcome, 'timeout before powder is a no-op')
r = theyFire(r, false, 'gun')
r = chooseTool(r, 'rope', false)
ok(r.outcome === 'alive', 'rope is the alive catch')

let t = startChase('hole_drift')
while (t.phase === 'run') t = stepChase(t, true)
t = theyFire(t, false, 'rope')
t = catchTimeout(t)
ok(t.outcome === 'escaped', 'seconds running out is an escape')

let d = startChase('store_back')
while (d.phase === 'run') d = stepChase(d, true)
d = theyFire(d, false, 'rope')
d = chooseTool(d, 'gun', true)
d = calledShot(d, 'chest', true, true)
ok(d.outcome === 'dead', 'dead-or-alive paper allows the chest')

let k = startChase('store_back')
while (k.phase === 'run') k = stepChase(k, true)
k = theyFire(k, false, 'rope')
k = chooseTool(k, 'gun', false)
k = calledShot(k, 'knee', true, false)
ok(k.phase === 'run' && k.hobbled && !k.theyShot, 'knee without disarm returns to run; he can fire again')

const mud = startChase('barrel_lane', true)
ok(mud.wet && agilityDifficulty(mud) === 13, 'rain in the lane is a harder Agility')
ok(agilityDifficulty(startChase('store_back')) === 11, 'dry lane is the ordinary check')
ok(theyFireLuckDifficulty(mud) === 8 && theyFireLuckDifficulty(startChase('store_back')) === 12, 'wet caps fail more (easier Luck, they miss)')
ok(gunShotDifficulty(mud, 'hand') === 14 && gunShotDifficulty(startChase('store_back'), 'hand') === 12, 'wet iron is a harder called shot')
ok(gunShotDifficulty(mud, 'chest') === 16, 'wet chest is 16')
const flask = startChase('store_back', true, true)
ok(flask.dryFlask && gunShotDifficulty(flask, 'hand') === 12, 'a dry flask waives the wet gun penalty')
ok(theyFireLuckDifficulty(flask) === 8, 'their shot is still a wet nipple')
ok(flask.log[0].includes('flask stayed dry'), 'start log names the flask')

let cap = startChase('store_back', true)
while (cap.phase === 'run') cap = stepChase(cap, true)
cap = theyFire(cap, false, 'gun')
ok(cap.log[cap.log.length - 1].includes('nipple'), 'a miss in rain names the drowned nipple')

let kid = startChase('store_back', false, false, true)
ok(kid.tools.rope && !kid.tools.gun, 'kid trail starts with rope, no iron')
ok(kid.log[0].includes('Rope only'), 'kid start log names rope only')
while (kid.phase === 'run') kid = stepChase(kid, true)
ok(kid.log[kid.log.length - 1].includes('The rope'), 'kid catch copy is rope, not iron')
const kidHit = theyFire(kid, true, 'rope')
ok(kidHit.theyShot && kidHit.tools.rope && !kidHit.tools.gun, 'they-fire cannot take the last (rope) tool')
ok(kidHit.log[kidHit.log.length - 1].includes('last choice'), 'last-tool hold is spoken')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryAlley tests passed (${passed})`)
