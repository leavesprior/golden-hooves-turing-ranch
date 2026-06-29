/**
 * Completability regression for the Chapter 1 quests (questEngine.ts + the
 * dialogue wiring in dialogues.ts).
 *
 * THE BUG THIS GUARDS: quests `ch1_stolen_supplies` and `ch1_pawnee_treaty`
 * were permanently un-completable. Every path contained objectives of type
 * `item` / `choice` / location-`skill_check` that NO game event ever emits.
 * The engine completes such objectives ONLY by id, via a dialogue option's
 * `effects.questProgress = { questId, objectiveId }`. If no dialogue option
 * carries that objectiveId, the objective can never be marked done and the
 * path can never complete.
 *
 *   T1 STATIC  — every non-optional objective of every Ch.1 path is either an
 *                AUTO kind (talk/travel/clue, completed by a normal game event)
 *                OR has its id wired by some DIALOGUES option's questProgress.
 *                (This catches the whole bug class structurally.)
 *   T2 DYNAMIC — drive each of the 6 paths through the EXACT trigger sequence
 *                (auto objectives via questEventProgress, wired objectives via
 *                questObjectiveProgress) and assert the quest ends `completed`
 *                with the expected completedPathId.
 *   T4 GUARDS  — questObjectiveProgress with an unknown id does not progress;
 *                a partial sequence leaves the quest `active`, not `completed`.
 *
 * No test runner is installed; zero-dependency tsx harness:
 *   node_modules/.bin/tsx src/app/adventure/data/questEngine.test.ts
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import {
  questEventProgress,
  questObjectiveProgress,
  type QuestEvent,
  type QuestSaveState,
} from './questEngine'
import { QUESTS } from './quests'
import { DIALOGUES } from './dialogues'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const CH1_QUEST_IDS = ['ch1_stolen_supplies', 'ch1_pawnee_treaty']
// Objective kinds completed by an ordinary game event (no dialogue wiring needed).
const AUTO_KINDS = new Set(['talk', 'travel', 'clue'])

// Every objectiveId referenced by a dialogue option's questProgress effect.
const WIRED_IDS = new Set<string>()
for (const d of DIALOGUES) {
  for (const node of d.nodes) {
    for (const opt of node.options) {
      const qp = opt.effects?.questProgress
      if (qp) WIRED_IDS.add(qp.objectiveId)
    }
  }
}

// ---- T1 STATIC: no un-reachable objective remains -----------------------------
console.log('T1 STATIC — every Ch.1 objective is auto-completable or dialogue-wired')
for (const questId of CH1_QUEST_IDS) {
  const quest = QUESTS.find(q => q.id === questId)!
  ok(!!quest, `${questId} exists`)
  for (const path of quest.paths) {
    for (const obj of path.objectives) {
      if (obj.optional) continue
      const reachable = AUTO_KINDS.has(obj.type) || WIRED_IDS.has(obj.id)
      ok(reachable, `${questId}/${path.id}: objective ${obj.id} (${obj.type}) is reachable`,
        `type=${obj.type} not auto and id not wired in any DIALOGUES questProgress`)
    }
  }
}

// ---- T2 DYNAMIC: every path actually completes via its trigger sequence --------
type Step =
  | { event: QuestEvent }
  | { obj: string }

function seed(questId: string): Record<string, QuestSaveState> {
  return { [questId]: { status: 'active', completedObjectives: [] } }
}

/** Thread a trigger sequence through the engine; return the final quest state. */
function runPath(questId: string, steps: Step[]): QuestSaveState {
  let qs = seed(questId)
  for (const step of steps) {
    if ('event' in step) qs = questEventProgress(qs, step.event).next
    else qs = questObjectiveProgress(qs, questId, step.obj).next
  }
  return qs[questId]
}

const SCENARIOS: { name: string; questId: string; expectPath: string; steps: Step[] }[] = [
  {
    name: 'Stolen Supplies — Lawful Path',
    questId: 'ch1_stolen_supplies',
    expectPath: 'ch1_stolen_lawful',
    steps: [
      { event: { kind: 'talk', target: 'ch1_commander' } },     // ch1_ss_law_1
      { obj: 'ch1_ss_law_2' },                                   // Lt. Woodbury (Expertise)
      { event: { kind: 'travel', target: 'ch1_platte_bridge' } }, // ch1_ss_law_3
      { obj: 'ch1_ss_law_4' },                                   // Silas Crooke (Shrewdness)
      { obj: 'ch1_ss_law_5' },                                   // seize the cache
    ],
  },
  {
    name: 'Stolen Supplies — Diplomat\'s Way',
    questId: 'ch1_stolen_supplies',
    expectPath: 'ch1_stolen_diplomatic',
    steps: [
      { event: { kind: 'talk', target: 'ch1_ferryman' } },        // ch1_ss_dip_1
      { event: { kind: 'travel', target: 'ch1_platte_bridge' } },  // ch1_ss_dip_2
      { obj: 'ch1_ss_dip_3' },                                    // Silas Crooke (Diplomacy)
      { obj: 'ch1_ss_dip_4' },                                    // negotiate the split
    ],
  },
  {
    name: 'Stolen Supplies — Outlaw\'s Way',
    questId: 'ch1_stolen_supplies',
    expectPath: 'ch1_stolen_chaotic',
    steps: [
      { event: { kind: 'talk', target: 'ch1_mysterious' } },      // ch1_ss_out_1
      { obj: 'ch1_ss_out_2' },                                    // Hooded Figure heist (Agility)
      { obj: 'ch1_ss_out_3' },                                    // grab the crate
      { obj: 'ch1_ss_out_4' },                                    // deliver stolen goods
    ],
  },
  {
    name: 'Pawnee Treaty — Fair Trade',
    questId: 'ch1_pawnee_treaty',
    expectPath: 'ch1_treaty_fair',
    steps: [
      { event: { kind: 'talk', target: 'ch1_trader' } },          // ch1_pt_fair_1
      { obj: 'ch1_pt_fair_2' },                                   // Ezra Finch (buy goods)
      { event: { kind: 'travel', target: 'ch1_pawnee_camp' } },    // ch1_pt_fair_3
      { obj: 'ch1_pt_fair_4' },                                   // Chief (Diplomacy)
    ],
  },
  {
    name: 'Pawnee Treaty — Trickster\'s Bargain',
    questId: 'ch1_pawnee_treaty',
    expectPath: 'ch1_treaty_trick',
    steps: [
      { event: { kind: 'talk', target: 'ch1_mysterious' } },      // ch1_pt_trick_1
      { obj: 'ch1_pt_trick_2' },                                  // Hooded Figure (Shrewdness)
      { obj: 'ch1_pt_trick_3' },                                  // Chief (Luck)
    ],
  },
  {
    name: 'Pawnee Treaty — Common Enemy',
    questId: 'ch1_pawnee_treaty',
    expectPath: 'ch1_treaty_enemy',
    steps: [
      { event: { kind: 'talk', target: 'ch1_scout' } },           // ch1_pt_enemy_1
      { event: { kind: 'travel', target: 'ch1_platte_bridge' } },  // ch1_pt_enemy_2
      { obj: 'ch1_pt_enemy_3' },                                  // Silas Crooke (Expertise)
      { obj: 'ch1_pt_enemy_4' },                                  // collect disguise evidence
      { event: { kind: 'talk', target: 'ch1_chief' } },           // ch1_pt_enemy_5
    ],
  },
]

console.log('T2 DYNAMIC — each of the 6 paths drives its quest to completed')
for (const sc of SCENARIOS) {
  const final = runPath(sc.questId, sc.steps)
  ok(final.status === 'completed', `${sc.name}: status === completed`, `got '${final.status}'`)
  ok(final.completedPathId === sc.expectPath,
    `${sc.name}: completedPathId === ${sc.expectPath}`, `got '${final.completedPathId}'`)
}

// ---- T4 GUARDS: unknown id is inert; partial sequence stays active ------------
console.log('T4 GUARDS — unknown objective id and partial completion')
{
  const qs = seed('ch1_stolen_supplies')
  const res = questObjectiveProgress(qs, 'ch1_stolen_supplies', 'ch1_ss_does_not_exist')
  ok(res.progressed === false, 'questObjectiveProgress with unknown id does not progress')
  ok(res.next === qs, 'questObjectiveProgress with unknown id returns the same state object')
}
{
  // Lawful path minus its final objective must stay active, not complete.
  const partial = runPath('ch1_stolen_supplies', [
    { event: { kind: 'talk', target: 'ch1_commander' } },
    { obj: 'ch1_ss_law_2' },
    { event: { kind: 'travel', target: 'ch1_platte_bridge' } },
    { obj: 'ch1_ss_law_4' },
    // ch1_ss_law_5 deliberately omitted
  ])
  ok(partial.status === 'active', 'partial lawful sequence leaves quest active')
  ok(partial.completedPathId === undefined, 'partial sequence has no completedPathId')
}

console.log('')
console.log(`quest Ch.1 completability: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
