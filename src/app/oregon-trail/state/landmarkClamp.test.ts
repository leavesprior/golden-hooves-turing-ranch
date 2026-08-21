/**
 * Landmark clamp: a fast day must stop AT the next river/town, never skip it.
 * Kansas is 102. Grueling is 30 mi/day. Seven miles out must arrive, not overshoot.
 *
 *   npx tsx src/app/oregon-trail/state/landmarkClamp.test.ts
 */

import { DEFAULT_STATE } from './constants'
import { computeTravel } from './travelEngine'
import type { OregonTrailState } from './types'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('T1 — grueling day 7 miles from Kansas arrives, does not skip')
{
  const start = {
    ...DEFAULT_STATE,
    day: 10,
    distance: 95,
    milesUntilNextLandmark: 7,
    nextLandmark: 'Kansas River Crossing',
    currentLandmark: 'Independence, Missouri',
    pace: 'grueling' as const,
    weather: 'fair' as const,
    phase: 'traveling' as const,
    party: [{ id: 'a', name: 'A', health: 100, isSick: false, role: 'leader' as const }],
    food: 80,
  }
  const next = computeTravel(start)
  ok(next.distance === 102, `distance 102 not past, got ${next.distance}`)
  ok(next.currentLandmark === 'Kansas River Crossing', `arrived Kansas, got ${next.currentLandmark}`)
  ok(next.distance < 102 + 15, 'did not swallow the next stop')
}

console.log('T2 — steady day far from the river is not clamped to zero')
{
  const start = {
    ...DEFAULT_STATE,
    day: 2,
    distance: 9,
    milesUntilNextLandmark: 93,
    nextLandmark: 'Kansas River Crossing',
    pace: 'steady' as const,
    weather: 'fair' as const,
    phase: 'traveling' as const,
    party: [{ id: 'a', name: 'A', health: 100, isSick: false, role: 'leader' as const }],
    food: 80,
  }
  const next = computeTravel(start)
  ok(next.distance === 24, `steady 15 mi, got ${next.distance}`)
  ok(next.currentLandmark !== 'Kansas River Crossing', 'not at Kansas yet')
}

console.log('T3 — stale nextLandmark must not throw')
{
  const start = {
    ...DEFAULT_STATE,
    day: 4,
    distance: 50,
    milesUntilNextLandmark: 0,
    nextLandmark: 'A Town That Never Was',
    phase: 'traveling' as const,
    party: [{ id: 'a', name: 'A', health: 100, isSick: false, role: 'leader' as const }],
    food: 80,
  }
  let threw = false
  let next: OregonTrailState = start as OregonTrailState
  try { next = computeTravel(start as OregonTrailState) } catch (e) { threw = true; console.error(e) }
  ok(!threw, 'computeTravel does not throw on unknown landmark')
  ok(next.phase === 'traveling' || next.phase === 'event', `stayed playable, got ${next.phase}`)
}

console.log('T4 — missing party/pace/weather must not throw')
{
  const start = {
    ...DEFAULT_STATE,
    phase: 'traveling' as const,
    party: undefined as unknown as typeof DEFAULT_STATE.party,
    pace: 'gallop' as unknown as typeof DEFAULT_STATE.pace,
    weather: 'locusts' as unknown as typeof DEFAULT_STATE.weather,
    rations: undefined as unknown as typeof DEFAULT_STATE.rations,
    food: 80,
    milesUntilNextLandmark: 90,
    nextLandmark: 'Kansas River Crossing',
  }
  let threw = false
  try { computeTravel(start) } catch (e) { threw = true; console.error(e) }
  ok(!threw, 'computeTravel does not throw on corrupt pace/party')
}

console.log(`\nlandmark-clamp tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
