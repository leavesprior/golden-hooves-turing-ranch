/**
 * G7 — Independence first arrival. BEGIN_JOURNEY must not skip the town.
 *
 *   npx tsx src/app/oregon-trail/state/beginJourney.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'

const FIRST = [
  'The jumping-off point. Everything west of here is either adventure or regret—often both.',
  'Independence bustles with dreamers and schemers. The trail begins where the certainty ends.',
]

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('T1 — BEGIN_JOURNEY is an Independence arrival')
{
  const next = gameReducer({ ...DEFAULT_STATE, phase: 'outfitting' }, { type: 'BEGIN_JOURNEY' })
  ok(next.phase === 'town', `phase town, got ${next.phase}`)
  ok(next.currentLandmark === 'Independence, Missouri', 'landmark Independence')
  ok(FIRST.includes(next.message || ''), 'authored first line, not generic Gold Country')
  ok(next.message !== 'Your journey to Gold Country begins!', 'does not skip with the old generic')
}

console.log(`\nbegin-journey tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
