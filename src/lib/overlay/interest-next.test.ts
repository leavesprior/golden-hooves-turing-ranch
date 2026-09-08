/**
 * Hub interest never names a door with no playable face.
 *   node_modules/.bin/tsx src/lib/overlay/interest-next.test.ts
 */
import { nextInterest, isPlayableInterest, interestHref } from './interest-next'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const empty = nextInterest([])
ok(empty.id === 'volcano', 'first door is volcano')
ok(empty.named === false, 'carmen does not name volcano')

const afterVolcano = nextInterest(['volcano'], 'volcano')
ok(afterVolcano.id !== 'jackson', 'after volcano does not send jackson (no explorer face)')
ok(afterVolcano.id === 'west_point', 'after volcano the next playable neighbor is west_point')
ok(isPlayableInterest(afterVolcano.id || '') === true, 'chosen door is playable')
ok(afterVolcano.named === false, 'carmen does not name west_point')
ok(/trading road/.test(afterVolcano.trailWord || ''), 'west_point has its own trail-word')
ok(!/west point|kit carson|ranch/i.test(afterVolcano.trailWord || ''), 'trail-word does not say the plaque or guest-house name')

const afterAngels = nextInterest(['angels_camp'], 'angels_camp')
ok(afterAngels.id !== 'jackson', 'after angels does not send jackson')
ok(afterAngels.id === 'bobr_ranch', 'after angels the playable neighbor is the ranch')

const afterWest = nextInterest(['volcano', 'west_point'], 'west_point')
ok(afterWest.id === 'bobr_ranch', 'after west_point the next playable neighbor is the oak camp')
ok(afterWest.named === false, 'carmen does not name the ranch')
ok(/oak camp/.test(afterWest.trailWord || ''), 'ranch has its own trail-word')
ok(!/ranch|beyond/i.test(afterWest.trailWord || ''), 'trail-word does not say the guest-house name')

const afterPlayable = nextInterest(
  ['volcano', 'angels_camp', 'west_point', 'bobr_ranch', 'kansas_river'],
  'west_point',
)
ok(afterPlayable.done === true, 'done when every playable door is visited even if jackson remains')

ok(interestHref('west_point') === '/explore?town=west_point', 'playable peek href')
ok(interestHref('kansas_river') === '/oregon-trail', 'kansas is the trail, not a peek')
ok(interestHref('jackson') === '/explore', 'no explorer face is not a fake peek')
ok(interestHref(null) === '/explore', 'done goes to the porch')
ok(interestHref(afterVolcano.id) === '/explore?town=west_point', 'after volcano the live door is west_point')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed }))
