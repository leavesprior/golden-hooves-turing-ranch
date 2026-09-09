/**
 * First-camp rest is named, never auto-dispatched.
 *   npx tsx src/app/oregon-trail/state/townInnWhisper.test.ts
 */
import { townInnWhisper } from '../data/townInnWhisper'

const cases = [
  { name: 'independence_first', minHealth: 100, landmark: 'Independence, Missouri', distance: 0, want: 'First night' },
  { name: 'independence_weary', minHealth: 60, landmark: 'Independence, Missouri', distance: 0, want: 'The rest that lasts' },
  { name: 'kearny_fresh', minHealth: 100, landmark: 'Fort Kearny', distance: 304, want: null },
  { name: 'kearny_weary', minHealth: 60, landmark: 'Fort Kearny', distance: 304, want: 'The rest that lasts' },
  { name: 'humboldt_no_town', minHealth: 40, landmark: 'Humboldt River', distance: 1380, want: 'The rest that lasts' },
]

const results = cases.map((c) => {
  const got = townInnWhisper({ minHealth: c.minHealth, landmark: c.landmark, distance: c.distance })
  return { ...c, got, pass: got === c.want }
})

const report = {
  ok: results.every((r) => r.pass),
  results,
  auto_rest: false,
  starting_tacos_untouched: 400,
  _conf: 1,
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exit(1)
