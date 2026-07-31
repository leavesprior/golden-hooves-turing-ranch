import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { caseFor, hasCaseAtTrailLocation, townForTrailLocation } from './trailTownBridge'
import { GOLD_COUNTRY_LOCATIONS, CHAPTER_1_WAYPOINTS } from './worldMaps'

// 1. The six Gold Country towns that hold an authored case must all resolve AND
//    point at a real route. These are the towns the trail walked past blind.
const EXPECTED_CASES = [
  'west_point', 'mokelumne_hill', 'san_andreas', 'jackson', 'angels_camp', 'volcano',
]
for (const id of EXPECTED_CASES) {
  const c = caseFor(id)
  assert.ok(c, `${id} must resolve to an authored case — this is the whole point of the bridge`)
  assert.equal(c.href, `/town/${c.townId}`, `${id} must point at the existing investigation route`)
  assert.ok(c.townName.length > 0, `${id} must carry a display name`)
}

// 2. Landmarks and mines are NOT towns and must stay caseless. `/town/[townId]`
//    answers HTTP 200 on its not-found page in dev, so a wrong link here would
//    never surface as a 4xx — assert the negative directly.
for (const id of ['sandy_gulch', 'carson_hill', 'chinese_tunnels', 'indian_grinding_rock', 'big_trees']) {
  assert.equal(caseFor(id), undefined, `${id} is a landmark/mine — it must not offer a case`)
  assert.equal(hasCaseAtTrailLocation(id), false, `${id} must not render a case badge`)
}

// 3. Journey-west waypoints are Missouri->Nevada, not California towns. Zero of
//    them should resolve. If one ever does, the crosswalk has been mis-populated.
for (const loc of CHAPTER_1_WAYPOINTS) {
  assert.equal(
    townForTrailLocation(loc.id), undefined,
    `${loc.id} is a journey-west waypoint and must not resolve to a Gold Country town`,
  )
}

// 4. Nothing unknown sneaks through.
assert.equal(caseFor('zzz_not_a_place'), undefined, 'unknown ids must not resolve')

// 5. Every Gold Country location either resolves to a town or is a known
//    landmark — no silent third category drifting in unnoticed.
const KNOWN_LANDMARKS = new Set([
  'sandy_gulch', 'carson_hill', 'chinese_tunnels', 'indian_grinding_rock', 'big_trees',
])
for (const loc of GOLD_COUNTRY_LOCATIONS) {
  const resolved = !!townForTrailLocation(loc.id)
  assert.ok(
    resolved || KNOWN_LANDMARKS.has(loc.id),
    `${loc.id} neither resolves nor is a known landmark — the crosswalk has drifted`,
  )
}

// 6. CONSUMPTION. This repo has shipped a built layer with zero callers three
//    times; each passed tsc, lint, build and every unit test. A bridge nobody
//    crosses is the same defect wearing a new coat, so assert the call site
//    exists. If someone deletes the wiring, this fails instead of going quiet.
const explore = readFileSync(
  new URL('../components/GoldCountryExplore.tsx', import.meta.url), 'utf8',
)
assert.match(
  explore, /from '\.\.\/data\/trailTownBridge'/,
  'GoldCountryExplore must import the bridge — an unused bridge is not a bridge',
)
assert.match(
  explore, /caseFor|hasCaseAtTrailLocation/,
  'GoldCountryExplore must actually CALL the bridge, not merely import it',
)

console.log('trailTownBridge tests passed')
