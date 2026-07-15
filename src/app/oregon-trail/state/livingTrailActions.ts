/**
 * Living Trail actions — pure state transforms for the presence-gated
 * real-world quest chains (mirrors goldCountryActions.ts).
 *
 * Karma side effects live in the oregonTrailContext wrapper
 * (completeLivingTrailNode), same split as completeQuestWithReward.
 */

import type { OregonTrailState, GamePhase, LivingTrailSlice, LivingTrailNodeState } from './types'
import { LIVING_TRAIL_NODES, getChildNodes } from '../data/livingTrailChains'

/**
 * Seed statuses from chain data: nodes without a prerequisite start available,
 * the rest locked. Used by DEFAULT_STATE and by save migration.
 */
export function buildDefaultLivingTrailSlice(): LivingTrailSlice {
  const nodes: Record<string, LivingTrailNodeState> = {}
  for (const node of LIVING_TRAIL_NODES) {
    nodes[node.id] = { status: node.prerequisiteNodeId ? 'locked' : 'available' }
  }
  return { nodes }
}

/**
 * Save migration guard (LOAD_STATE choke point, same class as the bfcc387
 * party fix): old saves have no livingTrail slice at all, and saves written
 * before a node existed lack that node's entry. Default the slice, then merge
 * any missing nodes at their seeded status — never clobber recorded progress.
 */
export function migrateLivingTrail(slice: LivingTrailSlice | undefined): LivingTrailSlice {
  const defaults = buildDefaultLivingTrailSlice()
  if (!slice || typeof slice !== 'object' || !slice.nodes || typeof slice.nodes !== 'object') {
    return defaults
  }
  const nodes: Record<string, LivingTrailNodeState> = { ...defaults.nodes }
  for (const [id, nodeState] of Object.entries(slice.nodes)) {
    if (nodeState && typeof nodeState === 'object' && typeof nodeState.status === 'string') {
      nodes[id] = nodeState
    }
  }
  // Re-derive unlocks: a saved 'locked' node whose prerequisite is completed
  // becomes available (covers saves from mid-migration or reordered chains)
  for (const node of LIVING_TRAIL_NODES) {
    if (
      node.prerequisiteNodeId &&
      nodes[node.id]?.status === 'locked' &&
      nodes[node.prerequisiteNodeId]?.status === 'completed'
    ) {
      nodes[node.id] = { ...nodes[node.id], status: 'available' }
    }
  }
  return { nodes }
}

export function applyEnterLivingTrail(prev: OregonTrailState): OregonTrailState {
  return {
    ...prev,
    phase: 'living_trail' as GamePhase,
    previousPhase: prev.phase,
  }
}

/**
 * Complete a node: mark completed (recording whether presence was verified or
 * the remote variant was used), then unlock children — nodes whose
 * prerequisite is this node. Locked/already-completed nodes are no-ops.
 */
export function applyCompleteLivingTrailNode(
  prev: OregonTrailState,
  nodeId: string,
  verifiedPresence: boolean,
): OregonTrailState {
  const current = prev.livingTrail.nodes[nodeId]
  if (!current || current.status !== 'available') return prev

  const nodes: Record<string, LivingTrailNodeState> = {
    ...prev.livingTrail.nodes,
    [nodeId]: { status: 'completed', completedAt: Date.now(), verifiedPresence },
  }
  for (const child of getChildNodes(nodeId)) {
    if (nodes[child.id]?.status === 'locked') {
      nodes[child.id] = { ...nodes[child.id], status: 'available' }
    }
  }
  return { ...prev, livingTrail: { nodes } }
}
