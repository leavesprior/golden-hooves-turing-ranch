/**
 * node_modules/.bin/tsx "src/app/(api-routes)/api/neoma/data/goldCountryNpcAdapt.test.ts"
 */
import { getCharacter } from './characters'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

const mae = getCharacter('mae_evans')
ok(!!mae, 'Mae Evans adapts to a three-vector character')
ok(!!mae && /Ellis Evans/.test(mae.personality.basePrompt), 'Mae’s prompt names her brother Ellis')
ok(!!mae && /Ellis Evans/.test(mae.agenda), 'Mae’s agenda names her brother')

const ellis = getCharacter('ellis_evans')
ok(!!ellis && /Mae Evans/.test(ellis.personality.basePrompt), 'Ellis’s prompt names his sister Mae')

const lampShy = getCharacter('ridge_stranger')
ok(!!lampShy && /off_roll_stranger|A man in the dark/.test(lampShy.personality.basePrompt), 'lamp-shy prompt names his brother in the hole')
ok(!!lampShy && /brother/.test(lampShy.agenda), 'lamp-shy agenda speaks of a brother')

const offRoll = getCharacter('off_roll_stranger')
ok(!!offRoll && /lean/.test(offRoll.personality.basePrompt), 'off-roll prompt names the lean brother in town')
ok(!!offRoll && /brother/.test(offRoll.agenda), 'off-roll agenda speaks of a brother')

const harris = getCharacter('foreman_harris')
ok(!!harris && !/insurance/i.test(harris.personality.canonSamples.join(' ')), 'Harris does not speak insurance-tour 1922')

ok(getCharacter('no_such_npc') === null, 'unknown ids stay null')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryNpcAdapt tests passed (${passed})`)
