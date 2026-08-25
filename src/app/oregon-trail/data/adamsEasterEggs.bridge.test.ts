/**
 * Kansas always keeps the Bridge of Death on L1.
 *   npx tsx src/app/oregon-trail/data/adamsEasterEggs.bridge.test.ts
 */
import { shouldShowBridgeKeeper, checkBridgeAnswer, BRIDGE_QUESTIONS } from './adamsEasterEggs'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(shouldShowBridgeKeeper({ riverName: 'Kansas River Crossing', roll: 0.99 }) === true, 'Kansas always shows')
ok(shouldShowBridgeKeeper({ riverName: 'Platte River', roll: 0.99 }) === false, 'other river high roll hides')
ok(shouldShowBridgeKeeper({ riverName: 'Platte River', roll: 0.01 }) === true, 'other river low roll shows')
ok(shouldShowBridgeKeeper({ riverName: 'Platte River', traits: ['bridge_keepers_bane'], roll: 0.99 }) === true, 'bane always shows')

const quest = BRIDGE_QUESTIONS.find((q) => q.question.includes('quest'))!
ok(checkBridgeAnswer(quest, 'Golden Frog Trail') === true, 'quest accepts Golden Frog')
ok(checkBridgeAnswer(quest, 'the first discount') === true, 'quest accepts discount')
ok(checkBridgeAnswer(quest, 'gold country') === true, 'quest still accepts gold country')

const swallow = BRIDGE_QUESTIONS.find((q) => q.isSwallowQuestion)!
ok(checkBridgeAnswer(swallow, 'African or European?') === true, 'swallow reversal still works')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`bridge keeper tests passed (${passed})`)
