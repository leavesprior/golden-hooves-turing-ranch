// ============================================
// QUEST ENGINE (pure helpers — no side effects)
// ============================================
// Extracted from play/page.tsx so the progression logic can be unit-tested in
// isolation (see questEngine.test.ts). No React, no I/O — pure functions over
// quest save-state + the authored QUESTS data.

import { QUESTS, type Quest, type QuestPath } from '@/app/adventure/data/quests'
import type { StatName } from '@/app/oregon-trail/characterContext'

// Per-quest progress. `completedObjectives` accumulates objective ids marked by
// game events (talk/travel/clue/skill_check/item/choice) or dialogue
// questProgress effects; a quest completes when every non-optional objective of
// one of its paths is done.
export interface QuestSaveState {
  status: 'active' | 'completed'
  completedObjectives: string[]
  completedPathId?: string
}

export type QuestEvent =
  | { kind: 'talk' | 'travel' | 'clue' | 'item' | 'choice'; target: string }
  | { kind: 'skill_check'; target: string; stat: StatName; dc: number }

export interface QuestUpdateResult {
  next: Record<string, QuestSaveState>
  completed: { quest: Quest; path: QuestPath }[]
  progressed: boolean
}

/** Check whether a path is fully complete (all non-optional objectives done). */
export function isPathComplete(path: QuestPath, completedIds: Set<string>): boolean {
  return path.objectives.filter(o => !o.optional).every(o => completedIds.has(o.id))
}

/**
 * Mark matching objectives complete across all active quests for a game event,
 * then detect quest completion. Pure: returns new questStates + completions.
 */
export function questEventProgress(
  questStates: Record<string, QuestSaveState>,
  event: QuestEvent,
): QuestUpdateResult {
  const next: Record<string, QuestSaveState> = { ...questStates }
  const completed: { quest: Quest; path: QuestPath }[] = []
  let progressed = false

  for (const quest of QUESTS) {
    const st = next[quest.id]
    if (!st || st.status !== 'active') continue

    const done = new Set(st.completedObjectives)
    let changed = false
    for (const path of quest.paths) {
      for (const obj of path.objectives) {
        const matches =
          obj.type === event.kind &&
          obj.target === event.target &&
          // skill_check objectives disambiguate on the STAT tested, not the DC.
          // An objective's authored DC often differs from the NPC/location DC it
          // actually resolves against (authored in separate data modules), and
          // requiring exact-DC equality silently blocked those objectives from
          // ever completing. Target + stat is enough to identify the check.
          (event.kind !== 'skill_check' || obj.stat === event.stat)
        if (matches && !done.has(obj.id)) {
          done.add(obj.id)
          changed = true
        }
      }
    }
    if (!changed) continue
    progressed = true

    const finishedPath = quest.paths.find(p => isPathComplete(p, done))
    next[quest.id] = {
      status: finishedPath ? 'completed' : 'active',
      completedObjectives: Array.from(done),
      completedPathId: finishedPath?.id,
    }
    if (finishedPath) completed.push({ quest, path: finishedPath })
  }

  return { next, completed, progressed }
}

/** Complete one specific objective (from a dialogue questProgress effect). */
export function questObjectiveProgress(
  questStates: Record<string, QuestSaveState>,
  questId: string,
  objectiveId: string,
): QuestUpdateResult {
  const quest = QUESTS.find(q => q.id === questId)
  const st = questStates[questId]
  const objectiveExists = quest?.paths.some(p => p.objectives.some(o => o.id === objectiveId))
  if (!quest || !st || st.status !== 'active' || !objectiveExists || st.completedObjectives.includes(objectiveId)) {
    return { next: questStates, completed: [], progressed: false }
  }
  const done = new Set(st.completedObjectives)
  done.add(objectiveId)
  const finishedPath = quest.paths.find(p => isPathComplete(p, done))
  return {
    next: {
      ...questStates,
      [questId]: {
        status: finishedPath ? 'completed' : 'active',
        completedObjectives: Array.from(done),
        completedPathId: finishedPath?.id,
      },
    },
    completed: finishedPath ? [{ quest, path: finishedPath }] : [],
    progressed: true,
  }
}
