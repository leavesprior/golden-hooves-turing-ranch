/**
 * Quest Adapter — Phase 2 of Golden Frog Codex.
 *
 * Bridges the orphan `quests.ts` schema (multi-path, stat-gated, karma +
 * reputation deltas, connected-quest prerequisites) to the flat
 * `QuestLogEntry` display model the `QuestLog` component already renders.
 *
 * Design rule: quests show ALL paths as ghosted options until the player
 * commits. This kills the YELLOW confusion point from the Phase 1 audit —
 * "I don't know which path I'm on."
 */

import type {
  Quest,
  QuestPath,
  QuestStatus as OrphanQuestStatus,
} from '@/app/adventure/data/quests'
import { QUESTS, getQuestById } from '@/app/adventure/data/quests'
import type { QuestLogEntry, QuestObjectiveDisplay, QuestStatus } from '@/components/adventure/QuestLog'

/**
 * Per-quest save state. Keeps dynamic data out of the orphan file.
 *
 * `activePathId` is undefined while the quest is still in a path-select
 * state (the NPC offered it, but the player hasn't committed). Completed
 * objectives are tracked per-path so a player mid-quest can see exactly
 * what remains on their committed route.
 */
export interface QuestSaveEntry {
  questId: string
  status: OrphanQuestStatus
  activePathId?: string
  completedObjectiveIds: string[]
}

/**
 * Pull a display entry for a single save-state quest. Renders ALL paths
 * so the player can see unchosen options ghosted — critical for the
 * "never make the player feel stupid" rule.
 */
export function adaptQuestForLog(
  entry: QuestSaveEntry,
): QuestLogEntry | undefined {
  const quest = getQuestById(entry.questId)
  if (!quest) return undefined

  const activePath = entry.activePathId
    ? quest.paths.find(p => p.id === entry.activePathId)
    : undefined

  // Objectives come from the active path if committed, else merged preview
  // from all paths (ghosted) so the player can see what's on offer.
  const objectives: QuestObjectiveDisplay[] = activePath
    ? activePath.objectives.map(o => ({
        id: o.id,
        description: o.description,
        completed: entry.completedObjectiveIds.includes(o.id),
        optional: o.optional,
      }))
    : ghostedPathPreview(quest.paths)

  // Reward preview — prefer active path, else show the "typical" preview
  // (XP range + factions affected) from path A so the sidebar isn't blank.
  const pathForRewards = activePath ?? quest.paths[0]
  const reward = pathForRewards?.reward

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    chapter: quest.chapter,
    status: toViewStatus(entry.status),
    activePath: entry.activePathId,
    pathName: activePath?.name,
    objectives,
    rewards: reward
      ? {
          xp: reward.xp,
          gold: reward.gold,
          reputation: summarizeRewardReputation(reward.reputation),
        }
      : undefined,
  }
}

/**
 * For an uncommitted quest, fold every path's first 1-2 objectives into a
 * single preview list so the player sees the branching even before they
 * pick a path. Optional flag is used to mark the choice-is-yours rows.
 */
function ghostedPathPreview(paths: QuestPath[]): QuestObjectiveDisplay[] {
  const rows: QuestObjectiveDisplay[] = []
  for (const path of paths) {
    rows.push({
      id: `${path.id}_label`,
      description: `— ${path.name} —`,
      completed: false,
      optional: true,
    })
    const first = path.objectives[0]
    if (first) {
      rows.push({
        id: `${path.id}_preview_${first.id}`,
        description: first.description,
        completed: false,
        optional: true,
      })
    }
  }
  return rows
}

function summarizeRewardReputation(
  rep: QuestPath['reward']['reputation'],
): string | undefined {
  if (!rep || rep.length === 0) return undefined
  return rep
    .map(r => `${r.amount > 0 ? '+' : ''}${r.amount} ${r.faction}`)
    .join(', ')
}

function toViewStatus(s: OrphanQuestStatus): QuestStatus {
  // Orphan statuses are a superset of view statuses; map directly.
  switch (s) {
    case 'available':
      return 'available'
    case 'active':
      return 'active'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
  }
}

/**
 * Convert a save-state list into a list of QuestLogEntry ready for render.
 * Also surfaces any quests the player *hasn't yet encountered* as
 * `available` so the log can show upcoming work without exposing spoilers.
 * We only surface available quests for the current chapter and earlier.
 */
export function adaptQuestsForLog(
  entries: QuestSaveEntry[],
  currentChapter: number,
): QuestLogEntry[] {
  const seen = new Set(entries.map(e => e.questId))
  const active = entries
    .map(adaptQuestForLog)
    .filter((e): e is QuestLogEntry => e !== undefined)

  // Available (undiscovered) quests for the current + earlier chapters
  // surface with `available` status. These show up under the "active" tab
  // until the player accepts them in dialogue.
  const available: QuestLogEntry[] = QUESTS
    .filter(q => q.chapter <= currentChapter && !seen.has(q.id))
    .map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      chapter: q.chapter,
      status: 'available' as QuestStatus,
      objectives: ghostedPathPreview(q.paths),
      rewards: q.paths[0]?.reward
        ? {
            xp: q.paths[0].reward.xp,
            gold: q.paths[0].reward.gold,
            reputation: summarizeRewardReputation(q.paths[0].reward.reputation),
          }
        : undefined,
    }))

  return [...active, ...available]
}

/**
 * Find the quest whose giver matches the given NPC id, and whose status
 * is `available` in the save state (or not yet present). Used to offer
 * quests when the player opens dialogue with a giver.
 */
export function findOfferableQuestForNpc(
  npcId: string,
  entries: QuestSaveEntry[],
): Quest | undefined {
  const accepted = new Set(
    entries
      .filter(e => e.status === 'active' || e.status === 'completed')
      .map(e => e.questId),
  )
  return QUESTS.find(q => q.giver === npcId && !accepted.has(q.id))
}

/**
 * Advance a quest objective on its active path. Returns a new save entry
 * (immutable). If all non-optional objectives on the path are complete,
 * the status transitions to `completed` so the caller can apply rewards.
 */
export function advanceQuestObjective(
  entry: QuestSaveEntry,
  objectiveId: string,
): { entry: QuestSaveEntry; justCompleted: boolean } {
  if (entry.completedObjectiveIds.includes(objectiveId)) {
    return { entry, justCompleted: false }
  }
  const quest = getQuestById(entry.questId)
  const activePath = quest?.paths.find(p => p.id === entry.activePathId)
  const nextCompleted = [...entry.completedObjectiveIds, objectiveId]

  let newStatus = entry.status
  let justCompleted = false
  if (activePath) {
    const required = activePath.objectives.filter(o => !o.optional)
    const allDone = required.every(o => nextCompleted.includes(o.id))
    if (allDone && entry.status === 'active') {
      newStatus = 'completed'
      justCompleted = true
    }
  }

  return {
    entry: {
      ...entry,
      completedObjectiveIds: nextCompleted,
      status: newStatus,
    },
    justCompleted,
  }
}

/**
 * Commit to a path on an active quest. If the quest isn't in the save
 * state yet, accept it and commit in one shot.
 */
export function commitQuestPath(
  entries: QuestSaveEntry[],
  questId: string,
  pathId: string,
): QuestSaveEntry[] {
  const existing = entries.find(e => e.questId === questId)
  if (existing) {
    return entries.map(e =>
      e.questId === questId
        ? { ...e, activePathId: pathId, status: 'active' as OrphanQuestStatus }
        : e,
    )
  }
  return [
    ...entries,
    {
      questId,
      status: 'active' as OrphanQuestStatus,
      activePathId: pathId,
      completedObjectiveIds: [],
    },
  ]
}

/**
 * Accept a quest without committing to a path (sets status to `active` with
 * undefined activePathId). Used when a dialogue triggers `questStart` but
 * the player hasn't picked a branch yet.
 */
export function acceptQuest(
  entries: QuestSaveEntry[],
  questId: string,
): QuestSaveEntry[] {
  if (entries.some(e => e.questId === questId)) return entries
  return [
    ...entries,
    {
      questId,
      status: 'active' as OrphanQuestStatus,
      activePathId: undefined,
      completedObjectiveIds: [],
    },
  ]
}
