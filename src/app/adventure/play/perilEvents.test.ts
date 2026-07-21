// Tests for the peril event→condition mapping + save resolver (2026-07-03).
// Pure logic — no DOM/RNG (the roll is an argument). Run via `npm test` (tsx).

import { PERIL_EVENTS, findPerilEvent, resolvePerilCheck } from './perilEvents'
import type { ConditionId } from './perilEngine'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`)
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('perilEvents')

// --- table integrity ---
check('every event maps to a real condition',
  PERIL_EVENTS.every(e => (['snakebite','fever','dysentery','injury','exhaustion'] as ConditionId[]).includes(e.condition)))
check('every event has a sane DC (8–20)', PERIL_EVENTS.every(e => e.dc >= 8 && e.dc <= 20))
check('injury rolls Agility (SuperGrok delta), not Durability',
  PERIL_EVENTS.filter(e => e.condition === 'injury').every(e => e.gatingStat === 'agility'))
check('snakebite is a poison track', findPerilEvent('rattlesnake')?.poison === true)
check('diseases incubate before biting',
  (findPerilEvent('fouled_water')?.incubationTicks ?? 0) >= 1 &&
  (findPerilEvent('river_miasma')?.incubationTicks ?? 0) >= 1)
check('exhaustion is the lowest-DC threat', Math.min(...PERIL_EVENTS.filter(e=>e.condition==='exhaustion').map(e=>e.dc)) <= 11)
check('table covers both travel and dialogue sources',
  PERIL_EVENTS.some(e=>e.source==='travel') && PERIL_EVENTS.some(e=>e.source==='dialogue'))
check('findPerilEvent resolves + misses cleanly', !!findPerilEvent('rattlesnake') && findPerilEvent('nope') === undefined)

// --- save resolver (Fort-analog: roll + statMod vs dc) ---
const snake = findPerilEvent('rattlesnake')! // dc 15, baseSeverity 1
check('a comfortable pass avoids the condition', resolvePerilCheck(snake, 18, 3).avoided === true)
check('an exact-meet pass avoids (margin 0)', resolvePerilCheck(snake, 15, 0).avoided === true)
const near = resolvePerilCheck(snake, 13, 0) // margin -2
check('a near miss inflicts base severity', !near.avoided && near.severity === 1)
const bad = resolvePerilCheck(snake, 9, 0) // margin -6
check('a bad miss escalates one severity', bad.severity === 2)
const rout = resolvePerilCheck(snake, 5, 0) // margin -10
check('a rout (margin ≤ -8) goes grave', rout.severity === 3 && rout.critical)
const nat1 = resolvePerilCheck(snake, 1, 20) // natural 1 despite big mod
check('a natural 1 is always critical → grave', nat1.avoided === false && nat1.severity === 3 && nat1.critical)
const wagon = findPerilEvent('wagon_flip')! // baseSeverity 2
check('base-serious event near-miss stays serious', resolvePerilCheck(wagon, wagon.dc - 2, 0).severity === 2)
check('base-serious event bad-miss caps at grave (3)', resolvePerilCheck(wagon, wagon.dc - 5, 0).severity === 3)

console.log(failures === 0 ? '\nperilEvents: ALL PASS' : `\nperilEvents: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
