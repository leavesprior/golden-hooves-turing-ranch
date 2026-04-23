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
  QuestObjective,
  ObjectiveType,
  QuestStatus as OrphanQuestStatus,
} from '@/app/adventure/data/quests'
import { QUESTS, getQuestById } from '@/app/adventure/data/quests'
import type { FactionId } from '@/app/oregon-trail/reputationContext'
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
  // surface with `available` status. Phase 3.5 RED #4: these now show up
  // under the "AVAILABLE" tab (not ACTIVE) until the player accepts them
  // in dialogue, so the tab counter stops contradicting the list.
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

// ============================================================================
// PHASE 2.5 — Auto-tick objectives & prerequisite gating
// ============================================================================

/**
 * Shape of the subset of AdventureState the quest auto-tick helpers need.
 * We keep this narrow so the helpers stay pure and testable — no dependency
 * on the full AdventureState type (which lives in play/page.tsx).
 */
export interface QuestTickState {
  questEntries: QuestSaveEntry[]
  questFlags: string[]
}

/**
 * Result of an auto-tick: the new entries list plus any quests that just
 * transitioned to `completed` so the caller can fire rewards.
 */
export interface QuestTickResult {
  entries: QuestSaveEntry[]
  justCompleted: Array<{ quest: Quest; path: QuestPath }>
}

/**
 * Core helper: for each active quest with a committed path, advance the
 * FIRST incomplete objective of the given type whose target matches.
 * Idempotent — if the objective is already marked complete, nothing happens.
 */
function tickByType(
  state: QuestTickState,
  type: ObjectiveType,
  target: string,
): QuestTickResult {
  const justCompleted: Array<{ quest: Quest; path: QuestPath }> = []

  const nextEntries = state.questEntries.map(entry => {
    if (entry.status !== 'active' || !entry.activePathId) return entry
    const quest = getQuestById(entry.questId)
    if (!quest) return entry
    const path = quest.paths.find(p => p.id === entry.activePathId)
    if (!path) return entry

    // Find the first incomplete objective matching (type, target).
    const match = path.objectives.find(
      (o: QuestObjective) =>
        o.type === type &&
        o.target === target &&
        !entry.completedObjectiveIds.includes(o.id),
    )
    if (!match) return entry

    const nextCompleted = [...entry.completedObjectiveIds, match.id]
    const required = path.objectives.filter(o => !o.optional)
    const allDone = required.every(o => nextCompleted.includes(o.id))

    const advanced: QuestSaveEntry = {
      ...entry,
      completedObjectiveIds: nextCompleted,
      status: allDone ? ('completed' as OrphanQuestStatus) : entry.status,
    }
    if (allDone) justCompleted.push({ quest, path })
    return advanced
  })

  return { entries: nextEntries, justCompleted }
}

/** Advance any active-quest objectives of type `travel` whose target matches. */
export function autoTickTravel(
  locationId: string,
  state: QuestTickState,
): QuestTickResult {
  return tickByType(state, 'travel', locationId)
}

/** Advance any active-quest objectives of type `item` whose target matches. */
export function autoTickItem(
  itemId: string,
  state: QuestTickState,
): QuestTickResult {
  return tickByType(state, 'item', itemId)
}

/** Advance any active-quest objectives of type `clue` whose target matches. */
export function autoTickClue(
  clueId: string,
  state: QuestTickState,
): QuestTickResult {
  return tickByType(state, 'clue', clueId)
}

/** Advance any active-quest objectives of type `choice` whose target matches. */
export function autoTickChoice(
  choiceId: string,
  state: QuestTickState,
): QuestTickResult {
  return tickByType(state, 'choice', choiceId)
}

/**
 * The set of quest ids the player has actually completed. Used by the
 * prerequisite gate + by `isQuestOfferable` below.
 */
export function getCompletedQuestIds(entries: QuestSaveEntry[]): Set<string> {
  return new Set(entries.filter(e => e.status === 'completed').map(e => e.questId))
}

/**
 * Minimal reputation snapshot the gate needs — faction -> numeric rep. The
 * caller passes `reputationContext.reputations` directly; this indirection
 * keeps the adapter decoupled from the React context type.
 */
export type ReputationMap = Partial<Record<FactionId, number>>

/**
 * Check whether a quest is currently offerable to the player:
 *  - its `prerequisite.questId` is in completedQuests (if set)
 *  - its `prerequisite.flag` is in questFlags (if set)
 *  - its `prerequisite.minReputation` is met (if set)
 *
 * A quest with no `prerequisite` is always offerable. Used both to hide
 * quests from NPC offer panels AND to mark them `blocked` in the quest log
 * "all" tab (with an "Unlocks after: ..." hint).
 */
export function isQuestOfferable(
  quest: Quest,
  completedQuestIds: Set<string>,
  questFlags: Set<string>,
  reputations: ReputationMap,
): boolean {
  const prereq = quest.prerequisite
  if (!prereq) return true
  if (prereq.questId && !completedQuestIds.has(prereq.questId)) return false
  if (prereq.flag && !questFlags.has(prereq.flag)) return false
  if (prereq.minReputation) {
    const current = reputations[prereq.minReputation.faction] ?? 0
    // Note: quest schema uses `level` for the min — treated as a numeric
    // threshold (matches the orphan design where -25 means "not below -25").
    if (current < prereq.minReputation.level) return false
  }
  return true
}

/**
 * Describe why a quest is blocked, for the "Unlocks after: ..." hint in the
 * quest log "all" tab. Returns undefined if the quest is offerable.
 */
export function describePrerequisiteLock(
  quest: Quest,
  completedQuestIds: Set<string>,
  questFlags: Set<string>,
  reputations: ReputationMap,
): string | undefined {
  const prereq = quest.prerequisite
  if (!prereq) return undefined
  const parts: string[] = []
  if (prereq.questId && !completedQuestIds.has(prereq.questId)) {
    const parent = getQuestById(prereq.questId)
    parts.push(`complete “${parent?.title ?? prereq.questId}”`)
  }
  if (prereq.flag && !questFlags.has(prereq.flag)) {
    parts.push(`unlock ${prereq.flag.replace(/_/g, ' ')}`)
  }
  if (prereq.minReputation) {
    const current = reputations[prereq.minReputation.faction] ?? 0
    if (current < prereq.minReputation.level) {
      parts.push(`${prereq.minReputation.faction} rep ≥ ${prereq.minReputation.level}`)
    }
  }
  if (parts.length === 0) return undefined
  return `Unlocks after: ${parts.join(' + ')}`
}

/**
 * Prerequisite-aware version of `findOfferableQuestForNpc`. Hides quests
 * whose prerequisites aren't met so the NPC panel doesn't tease the player
 * with content they can't take yet.
 */
export function findOfferableQuestForNpcGated(
  npcId: string,
  entries: QuestSaveEntry[],
  questFlags: Set<string>,
  reputations: ReputationMap,
): Quest | undefined {
  const accepted = new Set(
    entries
      .filter(e => e.status === 'active' || e.status === 'completed')
      .map(e => e.questId),
  )
  const completed = getCompletedQuestIds(entries)
  return QUESTS.find(
    q =>
      q.giver === npcId &&
      !accepted.has(q.id) &&
      isQuestOfferable(q, completed, questFlags, reputations),
  )
}

/**
 * Prerequisite-aware version of `adaptQuestsForLog`. Any quest blocked by
 * prerequisites is surfaced with a synthetic `blocked` status carrying the
 * "Unlocks after: ..." hint, so the "all" tab can show depth without teasing
 * inaccessible content in the "active" tab.
 *
 * The blocked status is represented here as `status: 'available'` with the
 * hint baked into the description — this keeps the QuestLog component's
 * narrow QuestStatus union untouched (QuestLog already filters `available`
 * to the active tab, so we must also tag these so the page-level filter can
 * hide them from active and only surface in "all").
 */
export function adaptQuestsForLogGated(
  entries: QuestSaveEntry[],
  currentChapter: number,
  questFlags: Set<string>,
  reputations: ReputationMap,
): Array<QuestLogEntry & { blocked?: boolean; blockReason?: string }> {
  const seen = new Set(entries.map(e => e.questId))
  const completed = getCompletedQuestIds(entries)

  const active: Array<QuestLogEntry & { blocked?: boolean }> = entries
    .map(adaptQuestForLog)
    .filter((e): e is QuestLogEntry => e !== undefined)

  const availableGhosted: Array<QuestLogEntry & { blocked?: boolean; blockReason?: string }> = []
  for (const q of QUESTS) {
    if (q.chapter > currentChapter) continue
    if (seen.has(q.id)) continue
    const offerable = isQuestOfferable(q, completed, questFlags, reputations)
    const baseEntry: QuestLogEntry = {
      id: q.id,
      title: q.title,
      description: q.description,
      chapter: q.chapter,
      status: 'available' as QuestStatus,
      objectives: ghostedPathPreviewPublic(q.paths),
      rewards: q.paths[0]?.reward
        ? {
            xp: q.paths[0].reward.xp,
            gold: q.paths[0].reward.gold,
            reputation: summarizeRewardReputationPublic(q.paths[0].reward.reputation),
          }
        : undefined,
    }
    if (offerable) {
      availableGhosted.push(baseEntry)
    } else {
      const hint = describePrerequisiteLock(q, completed, questFlags, reputations)
      availableGhosted.push({ ...baseEntry, blocked: true, blockReason: hint })
    }
  }
  return [...active, ...availableGhosted]
}

// Re-exports of internal helpers under a public name so
// `adaptQuestsForLogGated` above can reuse the same preview logic without
// duplicating it. Keeping the originals private would just fork the code.
function ghostedPathPreviewPublic(paths: QuestPath[]): QuestObjectiveDisplay[] {
  return ghostedPathPreview(paths)
}

function summarizeRewardReputationPublic(
  rep: QuestPath['reward']['reputation'],
): string | undefined {
  return summarizeRewardReputation(rep)
}
