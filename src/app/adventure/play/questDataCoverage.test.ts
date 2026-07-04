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

// --- requiresObjective sequence gates (2026-07-03) ---
// Options may declare requirement.requiresObjective {questId, objectiveId|[]}:
// the dialogue renderer HIDES them until the named objective is complete.
// Gated options still count as firing sources above (the gate delays, it does
// not remove). Here we validate the gates themselves:
//   1. every gate references a real quest and real objective ids in it;
//   2. no option is gated on the very objective(s) its own effect completes
//      (a self-gate would deadlock: option needed to complete X, hidden until X).

// Map item/choice target -> objective ids that complete when it fires.
const objectivesByTarget = new Map<string, string[]>()
for (const q of QUESTS) {
  for (const p of q.paths) {
    for (const o of p.objectives) {
      if (o.type !== 'item' && o.type !== 'choice') continue
      objectivesByTarget.set(o.target, [...(objectivesByTarget.get(o.target) ?? []), o.id])
    }
  }
}

const badGateRefs: string[] = []
const selfGates: string[] = []
let gateCount = 0
for (const d of DIALOGUES) {
  for (const n of d.nodes) {
    for (const o of n.options) {
      const gate = o.requirement?.requiresObjective
      if (!gate) continue
      gateCount++
      const where = `${d.id}/${n.id}/${o.id}`
      const quest = QUESTS.find(q => q.id === gate.questId)
      const gateIds = Array.isArray(gate.objectiveId) ? gate.objectiveId : [gate.objectiveId]
      if (!quest) {
        badGateRefs.push(`${where} -> unknown quest ${gate.questId}`)
        continue
      }
      const questObjIds = new Set(quest.paths.flatMap(p => p.objectives.map(obj => obj.id)))
      for (const id of gateIds) {
        if (!questObjIds.has(id)) badGateRefs.push(`${where} -> unknown objective ${gate.questId}:${id}`)
      }
      // Self-gate deadlock: gate ids ∩ objectives this option's effect completes.
      const completes = [
        ...(o.effects?.item ? objectivesByTarget.get(o.effects.item) ?? [] : []),
        ...(o.effects?.choice ? objectivesByTarget.get(o.effects.choice) ?? [] : []),
      ]
      const overlap = gateIds.filter(id => completes.includes(id))
      if (overlap.length > 0) selfGates.push(`${where} gated on its own effect: ${overlap.join(', ')}`)
    }
  }
}
check(`all ${gateCount} requiresObjective gates reference real quest objectives`,
  badGateRefs.length === 0, `bad: ${badGateRefs.join('; ')}`)
check('no option is sequence-gated on the objective its own effect completes',
  selfGates.length === 0, `self-gates: ${selfGates.join('; ')}`)

// 3. Reachability under gating: every required item/choice objective must keep
// at least one firing source whose gate does NOT depend (directly) on that same
// objective — i.e. the gate ids point at other objectives. (Direct-cycle guard;
// combined with check 2 this keeps every gated path winnable.)
const unreachable: string[] = []
for (const [target, objIds] of objectivesByTarget) {
  const required = [...itemTargets, ...choiceTargets].includes(target)
  if (!required) continue
  const sources = DIALOGUES.flatMap(d => d.nodes.flatMap(n => n.options))
    .filter(o => o.effects?.item === target || o.effects?.choice === target)
  const hasSafeSource = sources.some(o => {
    const gate = o.requirement?.requiresObjective
    if (!gate) return true
    const gateIds = Array.isArray(gate.objectiveId) ? gate.objectiveId : [gate.objectiveId]
    return gateIds.every(id => !objIds.includes(id))
  })
  if (!hasSafeSource) unreachable.push(target)
}
check('every required item/choice objective keeps a source not gated on itself',
  unreachable.length === 0, `unreachable: ${unreachable.join(', ')}`)

console.log(failures === 0 ? '\nquestDataCoverage: ALL PASS' : `\nquestDataCoverage: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
