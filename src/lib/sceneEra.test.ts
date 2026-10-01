import assert from 'node:assert/strict'
import { INVESTIGATIONS } from './townInvestigations'
import { sceneYear } from './trailInvestigation'

// A witness can only speak of what has already happened. On 10-01 five of eight wrong
// scene years were this bug: Léger "bought that court in 'sixty-six" in a scene set in
// 1852. This check reads every year a witness says aloud and fails when it is later than
// the year the scene is set.

const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }
const UNITS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 }

/**
 * '22 means whichever of 1822 / 1922 sits nearer the scene year, as a listener would
 * hear it, but never more than 30 years ahead: in 1928 "'65" is Twain's 1865, not 1965.
 */
function nearest(yy: number, near: number): number {
  return [1700, 1800, 1900].map(c => c + yy).filter(y => y <= near + 30)
    .reduce((a, b) => (Math.abs(b - near) < Math.abs(a - near) ? b : a))
}

/** Years spoken inside double-quoted speech. */
export function spokenYears(text: string, near: number): number[] {
  const speech = [...text.matchAll(/"([^"]*)"/g)].map(m => m[1]).join(' ')
  const out: number[] = []
  for (const m of speech.matchAll(/\b(1[789]\d\d)\b/g)) out.push(Number(m[1]))
  for (const m of speech.matchAll(/(?:^|[^\w])['’](\d\d)\b/g)) out.push(nearest(Number(m[1]), near))
  for (const m of speech.matchAll(/['’](twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:-(one|two|three|four|five|six|seven|eight|nine))?\b/gi)) {
    out.push(nearest(TENS[m[1].toLowerCase()] + (m[2] ? UNITS[m[2].toLowerCase()] : 0), near))
  }
  return out
}

// --- the reader itself (a check only run on healthy input is a rubber stamp) ---
assert.deepEqual(spokenYears(`He said "in 'sixty-six I bought it"`, 1852), [1866])
assert.deepEqual(spokenYears(`"Since '12 the State won't let us"`, 1900), [1912])
assert.deepEqual(spokenYears(`"They went down the Argonaut in '22"`, 1894), [1922])
assert.deepEqual(spokenYears(`"until February of 'fifty-five"`, 1854), [1855])
assert.deepEqual(spokenYears(`"Twain heard it in the winter of '65"`, 1928), [1865], 'a 1928 speaker means 1865, not 1965')
assert.deepEqual(spokenYears(`"Built in 1883, and 'fifty-one before it"`, 1883), [1883, 1851])
assert.deepEqual(spokenYears(`Narration says 1928, outside the quotes. "Nothing here."`, 1849), [])
assert.deepEqual(spokenYears(`"the boys' wages"`, 1849), [], 'a possessive apostrophe is not a year')

// --- every California scene ---
const violations: string[] = []
let scenes = 0
for (const [townId, inv] of Object.entries(INVESTIGATIONS)) {
  for (const scene of inv.scenes) {
    const year = sceneYear(townId, scene.id)
    if (year === undefined) continue
    scenes++
    for (const field of ['prompt', 'clueEasy', 'clueHard', 'feedback', 'wrongHint'] as const) {
      for (const said of spokenYears(scene[field], year)) {
        if (said > year) violations.push(`${townId}:${scene.id} is set in ${year} but ${field} says ${said}`)
      }
    }
  }
}
assert.ok(scenes >= 30, `only ${scenes} dated scenes found; the walk is broken`)
assert.deepEqual(violations, [], `witnesses speak of later years:\n${violations.join('\n')}`)
console.log(`sceneEra: ${scenes} scenes, no witness speaks of a year after their own`)
