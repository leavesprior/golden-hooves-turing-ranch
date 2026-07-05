// Tests for the quest engine's event dispatch + objective matching (2026-07-02).
// Locks in the "consequences are real" fix set:
//   • the matcher now dispatches ALL six objective kinds — talk/travel/clue/
//     skill_check/item/choice (item + choice were previously never fired, so
//     every path gated on them was unwinnable).
//   • skill_check objectives match on target + STAT, DC-independent (an
//     objective's authored DC often differs from the NPC/location DC it resolves
//     against; requiring exact-DC equality silently blocked completion).
// Result asserted: every authored quest is completable via its first path when
// the corresponding events fire — a direct refutation of the pre-fix audit
// finding that all 11 quests were unwinnable.
// Run by `npm test` (tsx). Pure logic — no DOM, no storage, no React.

import { QUESTS } from '@/app/adventure/data/quests'
import type { QuestObjective } from '@/app/adventure/data/quests'
import { questEventProgress, type QuestEvent, type QuestSaveState } from './questEngine'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`) }
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

// Synthesize the game event that satisfies a given objective. For skill_check we
// deliberately pass a DC far from the objective's authored DC to prove the match
// is DC-independent (the core bug fix).
function eventFor(obj: QuestObjective): QuestEvent {
  if (obj.type === 'skill_check') {
    return { kind: 'skill_check', target: obj.target, stat: obj.stat!, dc: (obj.dc ?? 10) + 50 }
  }
  return { kind: obj.type, target: obj.target }
}

console.log('questEngine')

// Coverage sanity: the authored data actually exercises item + choice + a
// skill_check whose DC we perturb — otherwise the test proves less than it claims.
const allObjectives = QUESTS.flatMap(q => q.paths.flatMap(p => p.objectives))
const kinds = new Set(allObjectives.map(o => o.type))
check('data exercises item objectives', kinds.has('item'))
check('data exercises choice objectives', kinds.has('choice'))
check('data exercises skill_check objectives', kinds.has('skill_check'))

// Drive EVERY quest to completion through its first path.
let completedCount = 0
for (const quest of QUESTS) {
  const path = quest.paths[0]
  if (!path) { check(`${quest.id} has at least one path`, false); continue }

  let cur: Record<string, QuestSaveState> = {
    [quest.id]: { status: 'active', completedObjectives: [] },
  }
  for (const obj of path.objectives.filter(o => !o.optional)) {
    cur = questEventProgress(cur, eventFor(obj)).next
  }
  const done = cur[quest.id]?.status === 'completed'
  if (done) completedCount++
  check(`${quest.id} completes via first path (${path.id})`, done,
    `status=${cur[quest.id]?.status}, done=[${cur[quest.id]?.completedObjectives.join(',')}]`)
}
check(`all ${QUESTS.length} quests are completable`, completedCount === QUESTS.length,
  `${completedCount}/${QUESTS.length}`)

// DC-independence, explicit: pick a real skill_check objective and fire with a
// wildly different DC — it must still complete.
const scObj = allObjectives.find(o => o.type === 'skill_check' && o.stat)
if (scObj) {
  const owner = QUESTS.find(q => q.paths.some(p => p.objectives.some(o => o.id === scObj.id)))!
  const start: Record<string, QuestSaveState> = {
    [owner.id]: { status: 'active', completedObjectives: [] },
  }
  const res = questEventProgress(start, { kind: 'skill_check', target: scObj.target, stat: scObj.stat!, dc: (scObj.dc ?? 10) + 999 })
  check('skill_check matches despite a 999-off DC', res.next[owner.id].completedObjectives.includes(scObj.id))
} else {
  check('found a skill_check objective to test', false)
}

// Idempotency: firing the same event twice never double-adds or throws.
const idemQuest = QUESTS.find(q => q.paths[0]?.objectives.some(o => !o.optional))!
const idemObj = idemQuest.paths[0].objectives.find(o => !o.optional)!
let s: Record<string, QuestSaveState> = { [idemQuest.id]: { status: 'active', completedObjectives: [] } }
s = questEventProgress(s, eventFor(idemObj)).next
const afterFirst = [...s[idemQuest.id].completedObjectives]
s = questEventProgress(s, eventFor(idemObj)).next
check('re-firing an event does not duplicate objective ids',
  s[idemQuest.id].completedObjectives.length === afterFirst.length)

// Inactive / unknown quests are untouched (guard clause).
const untouched = questEventProgress({}, { kind: 'talk', target: 'nobody' })
check('empty quest state yields no progress', untouched.progressed === false)

console.log(failures === 0 ? '\nquestEngine: ALL PASS' : `\nquestEngine: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
