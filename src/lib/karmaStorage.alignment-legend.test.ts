/**
 * −85/−42 is Lawful Good. Raw "law -85" is the leak.
 *   node_modules/.bin/tsx src/lib/karmaStorage.alignment-legend.test.ts
 */
import { formatAlignmentLegend, getAlignmentPosition } from './karmaStorage'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

const lg = formatAlignmentLegend({ lawfulChaotic: -85, goodEvil: -42 })
ok(getAlignmentPosition({ lawfulChaotic: -85, goodEvil: -42 }) === 'lawful_good', '-85/-42 is lawful_good')
ok(lg.includes('Lawful Good'), 'legend names Lawful Good')
ok(/minus is lawful\/good/.test(lg), 'legend says minus is lawful/good')
ok(lg.includes('-85') && lg.includes('-42'), 'legend keeps the scores')
ok(!/chaotic/i.test(lg), 'lawful-good legend does not say chaotic')
ok(!/law -85/.test(lg), 'does not print the leak phrase law -85')

const ce = formatAlignmentLegend({ lawfulChaotic: 66, goodEvil: 66 })
ok(ce.includes('Chaotic Evil'), '+66/+66 is Chaotic Evil')
ok(/minus is lawful\/good/.test(ce), 'sign legend stays on chaotic too')

const tn = formatAlignmentLegend({ lawfulChaotic: 0, goodEvil: 0 })
ok(tn.includes('True Neutral'), 'zero is True Neutral')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({
  ok: true,
  passed,
  lawful_good: lg,
  chaotic_evil: ce,
}))
