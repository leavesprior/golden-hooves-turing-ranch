/**
 * The 1849 Look face says what is NOT there, without letting anyone in.
 *   node_modules/.bin/tsx src/lib/lookAbsence.test.ts
 *
 * Two kinds of claim here. The pure ones run the real functions. The ones about
 * the component read InteractiveTown.tsx as text, the same way
 * exploreVolcanoEra.test.ts reads ExploreClient.tsx: there is no React renderer
 * in this suite, and a source claim that names the exact call is still a claim a
 * careless edit breaks. The browser check is what proves it renders.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { arcadePresentAttractions } from '../app/explore/explorerContext'
import { ASCII2_TOWNS } from './ascii2Towns'
import { TOWN_HOTSPOTS, VOLCANO_LATER_ATTRACTION_IDS } from './goldCountryEditorial'
import {
  LOOK_ABSENCE_CLEARANCE,
  lookAbsenceChips,
  lookAbsenceCollisions,
  lookAbsenceVisible,
} from './lookAbsence'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

// ---- the chips themselves -------------------------------------------------

const chips = lookAbsenceChips('volcano')
ok(chips.length > 0, 'volcano has later chips at all')
ok(
  chips.map((c) => c.id).sort().join() === [...VOLCANO_LATER_ATTRACTION_IDS].sort().join(),
  'every later attraction with a pin gets a chip',
)
for (const chip of chips) {
  ok(chip.notYet.length > 10, `${chip.id} says what is not there`)
  ok(chip.label.length > 0, `${chip.id} has a label`)
}

// The theatre pin was the tent's pin. That is the bug this pass exists to fix.
const theatre = chips.find((c) => c.id === 'vol_theatre')!
const tent = TOWN_HOTSPOTS.volcano.find((p) => p.attractionId === 'vol_canvas_flat')!
ok(!!theatre, 'theatre is a chip')
ok(
  !(theatre.x === tent.x && theatre.y === tent.y),
  'theatre no longer sits on the canvas tent',
)
const tentGap = Math.hypot(theatre.x - tent.x, theatre.y - tent.y)
ok(tentGap >= LOOK_ABSENCE_CLEARANCE, `theatre vs tent ${tentGap.toFixed(1)} >= ${LOOK_ABSENCE_CLEARANCE}`)

// No chip may land on another chip or on a building that IS standing in 1849.
for (const townId of Object.keys(ASCII2_TOWNS)) {
  const collisions = lookAbsenceCollisions(townId)
  ok(collisions.length === 0, collisions.length ? `${townId} chip collisions ${JSON.stringify(collisions)}` : `${townId} chips are all reachable`)
}

// The JSON and the painted face must agree, or the walk's fog and the Look chip
// describe different ground. (ascii2Walk.test.ts holds the same line from the
// other side; this one fails if someone moves only the pin.)
for (const site of ASCII2_TOWNS.volcano.later_sites) {
  const pin = TOWN_HOTSPOTS.volcano.find((p) => p.attractionId === site.id)
  if (!pin) continue
  ok(site.x === pin.x && site.y === pin.y, `${site.id} JSON percent matches the pin`)
}

// ---- absence is not presence ----------------------------------------------

ok(
  arcadePresentAttractions(
    chips.map((c) => ({ id: c.id, period: 'later' as const })),
  ).length === 0,
  'a chip is never a present attraction',
)

ok(lookAbsenceVisible('1849', false, false), 'chips draw on the 1849 look')
ok(!lookAbsenceVisible('today', false, false), 'no chips on the modern photo')
ok(!lookAbsenceVisible('1849', true, false), 'no chips while walking')
ok(!lookAbsenceVisible('1849', false, true), 'no chips over an interior room')

ok(lookAbsenceChips('bobr_ranch').length === 0, 'a town with no 1849 overlay has no chips')
ok(lookAbsenceChips(undefined).length === 0, 'no town id, no chips')

// ---- the component keeps the door shut ------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url))
const town = readFileSync(path.join(here, '../components/explore/InteractiveTown.tsx'), 'utf8')

const lookBody = town.split('const lookAbsence = (')[1]?.split('\n  }')[0] ?? ''
ok(lookBody.length > 0, 'lookAbsence exists')
ok(!/visitAttraction/.test(lookBody), 'clicking absence does not mark a visit')
ok(!/applyKarma/.test(lookBody), 'clicking absence pays no karma')
ok(!/enterBuilding/.test(lookBody), 'clicking absence does not enter a building')

const enterBody = town.split('const enterBuilding = (')[1]?.split('\n  }')[0] ?? ''
ok(/a\.period === 'later'\) return/.test(enterBody), "enterBuilding still refuses period 'later'")

ok(
  /selected\.id === 'vol_theatre' && sceneEra !== '1849' && <VolcanoStayShow \/>/.test(town),
  'the weekend box office is off the 1849 face',
)
ok(/data-testid=\{`explore-later-\$\{chip\.id\}`\}/.test(town), 'chips carry a testid')
ok(/\{selectedAbsence\.notYet\}/.test(town), 'the reading is the year-line, not the modern description')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({
  ok: true,
  passed,
  chips: chips.length,
  theatre: [theatre.x, theatre.y],
  tent_gap: Math.round(tentGap * 10) / 10,
}))
