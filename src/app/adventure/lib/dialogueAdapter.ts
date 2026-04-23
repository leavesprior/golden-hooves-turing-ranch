/**
 * Dialogue Adapter — Phase 2 of Golden Frog Codex.
 *
 * The orphan `src/app/adventure/data/dialogues.ts` schema diverges from the
 * `DialogueView` component's native types. This adapter normalises a single
 * orphan `Dialogue` into the flat `DialogueNode[]` + first-node-id pair the
 * live component consumes, and flattens the heterogenous `DialogueEffect`
 * into the view's effects shape without dropping information.
 *
 * Non-goals:
 *  - Rewriting the orphan data. The orphan file stays untouched.
 *  - Making the `DialogueView` internal contract any richer. We map down,
 *    not up — that preserves the Phase 1 surface area.
 *
 * Fields lost in translation are surfaced via the `onDialogueEffect` bridge
 * in `play/page.tsx` (flag sets, quest starts/progress, unlockLocation) so
 * they still land on game state even though the view can't render them.
 */

import type {
  Dialogue as OrphanDialogue,
  DialogueNode as OrphanDialogueNode,
  DialogueOption as OrphanDialogueOption,
  DialogueEffect as OrphanDialogueEffect,
} from '@/app/adventure/data/dialogues'
import type {
  DialogueNode as ViewDialogueNode,
  DialogueOption as ViewDialogueOption,
} from '@/components/adventure/DialogueView'

/**
 * Map an orphan effect into the view's effects shape.
 *
 * Translation table:
 *   orphan.flag              -> view.setFlag
 *   orphan.reputation.delta  -> view.reputation.amount  (same semantics)
 *   orphan.questStart        -> view.questStart
 *   orphan.questProgress     -> view.questAdvance       (question id only;
 *                               objective id is handled by the bridge layer)
 *   orphan.karma             -> view.karma              (shape-compatible)
 *   orphan.xp                -> view.xp
 *   orphan.gold              -> view.gold
 *   orphan.unlockLocation    -> view can't render; bridge layer consumes it
 */
export function adaptEffect(
  orphan: OrphanDialogueEffect | undefined,
): ViewDialogueOption['effects'] | undefined {
  if (!orphan) return undefined
  const out: NonNullable<ViewDialogueOption['effects']> = {}

  if (orphan.karma) out.karma = orphan.karma
  if (orphan.xp !== undefined) out.xp = orphan.xp
  if (orphan.gold !== undefined) out.gold = orphan.gold
  if (orphan.flag) out.setFlag = orphan.flag
  if (orphan.questStart) out.questStart = orphan.questStart
  if (orphan.questProgress) out.questAdvance = orphan.questProgress.questId
  if (orphan.reputation) {
    out.reputation = {
      faction: orphan.reputation.faction,
      amount: orphan.reputation.delta,
    }
  }

  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Map an orphan option to a view option. Preserves text, lowShrewdnessText,
 * nextNodeId, and maps requirement from `{stat?, dc?}` to `{stat, dc}`
 * (skipping entirely if either side is missing — the orphan schema allows
 * partial requirements for faction/flag gates which we surface as lock
 * text instead).
 */
export function adaptOption(orphan: OrphanDialogueOption): ViewDialogueOption {
  const hasStatGate =
    orphan.requirement?.stat !== undefined && orphan.requirement?.dc !== undefined

  // Non-stat gates (faction, flag, karma) map to a lockedText preview so
  // the player still sees the choice but can't click it without the gate
  // being met. The actual gating is enforced at the bridge layer.
  let lockedText: string | undefined
  if (orphan.requirement && !hasStatGate) {
    const parts: string[] = []
    if (orphan.requirement.flag) parts.push(`needs: ${orphan.requirement.flag}`)
    if (orphan.requirement.faction)
      parts.push(
        `${orphan.requirement.faction}${
          orphan.requirement.factionLevel !== undefined
            ? ` >= ${orphan.requirement.factionLevel}`
            : ''
        }`,
      )
    if (orphan.requirement.questCompleted)
      parts.push(`after: ${orphan.requirement.questCompleted}`)
    if (orphan.requirement.karmaTag) parts.push(`[${orphan.requirement.karmaTag}]`)
    if (parts.length > 0) lockedText = `[${parts.join(' / ')}]`
  }

  return {
    text: orphan.text,
    lowShrewdnessText: orphan.lowShrewdnessText,
    nextNodeId: orphan.nextNodeId,
    effects: adaptEffect(orphan.effects),
    requirement: hasStatGate
      ? { stat: orphan.requirement!.stat!, dc: orphan.requirement!.dc! }
      : undefined,
    lockedText,
  }
}

/** Map an orphan node to a view node. Speaker defaults bubble up in the view. */
export function adaptNode(orphan: OrphanDialogueNode): ViewDialogueNode {
  return {
    id: orphan.id,
    text: orphan.text,
    speaker: orphan.speaker,
    options: orphan.options.map(adaptOption),
  }
}

export interface AdaptedDialogue {
  nodes: ViewDialogueNode[]
  startNodeId: string
  npcName: string
  /** First node id — used so a late-unlocked dialogue can resume from start. */
  dialogueId: string
}

/**
 * Map a full orphan Dialogue into the view's consumption shape.
 * Start node defaults to `'start'` if present, else the first node.
 */
export function adaptDialogue(orphan: OrphanDialogue): AdaptedDialogue {
  const nodes = orphan.nodes.map(adaptNode)
  const startNodeId =
    nodes.find(n => n.id === 'start')?.id ?? nodes[0]?.id ?? ''
  return {
    nodes,
    startNodeId,
    npcName: orphan.npcName,
    dialogueId: orphan.id,
  }
}

/**
 * Look up the original orphan option (pre-adapt) for a given node+option
 * pair. Needed when the bridge layer wants to inspect a side-effect the
 * view's effects shape couldn't carry (e.g. unlockLocation, questProgress
 * objectiveId). Returns undefined if the option can't be found — the
 * bridge should fall back to the adapted effects in that case.
 */
export function findOrphanOption(
  dialogue: OrphanDialogue,
  nodeId: string,
  optionIndex: number,
): OrphanDialogueOption | undefined {
  const node = dialogue.nodes.find(n => n.id === nodeId)
  if (!node) return undefined
  return node.options[optionIndex]
}
