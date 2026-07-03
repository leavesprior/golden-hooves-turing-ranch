// Data-coverage test for real-play quest completability (2026-07-02).
// The quest ENGINE can complete every quest (questEngine.test.ts), but a path
// gated on an item/choice objective only fires in real play if some dialogue
// option actually emits the matching effects.item / effects.choice. This test
// asserts that EVERY item- and choice-type objective target has at least one
// firing source in the authored dialogue data — so no path is silently dead.
// Run by `npm test` (tsx). Pure data — no DOM, no storage.

import { QUESTS } from '@/app/adventure/data/quests'
import { DIALOGUES } from '@/app/adventure/data/dialogues'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`) }
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('questDataCoverage')

// Objective targets that must be fired by a dialogue effect.
const itemTargets = new Set<string>()
const choiceTargets = new Set<string>()
for (const q of QUESTS) {
  for (const p of q.paths) {
    for (const o of p.objectives) {
      if (o.optional) continue // optional objectives need not be reachable to win
      if (o.type === 'item') itemTargets.add(o.target)
      if (o.type === 'choice') choiceTargets.add(o.target)
    }
  }
}

// Firing sources present in the dialogue data.
const firedItems = new Set<string>()
const firedChoices = new Set<string>()
for (const d of DIALOGUES) {
  for (const n of d.nodes) {
    for (const o of n.options) {
      const e = o.effects
      if (!e) continue
      if (e.item) firedItems.add(e.item)
      if (e.choice) firedChoices.add(e.choice)
    }
  }
}

const missingItems = [...itemTargets].filter(t => !firedItems.has(t)).sort()
const missingChoices = [...choiceTargets].filter(t => !firedChoices.has(t)).sort()

check(`all ${itemTargets.size} required item objectives have a dialogue source`,
  missingItems.length === 0, `missing: ${missingItems.join(', ')}`)
check(`all ${choiceTargets.size} required choice objectives have a dialogue source`,
  missingChoices.length === 0, `missing: ${missingChoices.join(', ')}`)

// Guard against typos: every fired item/choice id should correspond to a real
// objective target (a dangling effect id would be dead annotation).
const danglingItems = [...firedItems].filter(t => !itemTargets.has(t)).sort()
const danglingChoices = [...firedChoices].filter(t => !choiceTargets.has(t)).sort()
check('no dialogue emits an item id that no objective consumes', danglingItems.length === 0,
  `dangling: ${danglingItems.join(', ')}`)
check('no dialogue emits a choice id that no objective consumes', danglingChoices.length === 0,
  `dangling: ${danglingChoices.join(', ')}`)

console.log(failures === 0 ? '\nquestDataCoverage: ALL PASS' : `\nquestDataCoverage: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
