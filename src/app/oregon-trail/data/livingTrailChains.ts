/**
 * Living Trail chains — presence-gated real-world quest chains (P1).
 *
 * Chain data as data: nodes carry geofences (real coordinates, source-verified
 * 2026-07-14 — see docs/LIVING_TRAIL_P1_SPEC_20260714.md appendix), dwell
 * requirements, optional time windows, and reward definitions. The engine
 * (state/livingTrailActions.ts + phases/LivingTrailScreen.tsx) is generic over
 * this data; adding a chain = appending here + NPCs in goldCountryNPCs.ts.
 *
 * Node ids use the `lt_` prefix to avoid the west_point id collision —
 * worldMaps.ts owns 'west_point' as a map-location id.
 */

export interface LivingTrailNode {
  id: string                      // 'lt_wp_marker', unique, lt_ prefix
  chainId: string                 // 'wp_founders'
  title: string
  geofence: { lat: number; lng: number; radiusM: number }   // radii >=75-100m per research
  dwellMs: number                 // default 10_000
  timeWindow?: { startHour: number; endHour: number }       // local hours; cemetery node daylight-gated 8-18
  prerequisiteNodeId?: string
  npcId: string                   // GoldCountryNPC id
  microAction: { kind: 'talk' | 'ovation_tap' | 'waypoint'; prompt: string }
  reward: { goodKarma?: number; neutralKarma?: number; clueProgress?: boolean }
  remoteVariant: { enabled: true; karmaScale: 0.5 }         // "by-lantern-light": playable anywhere, half karma
  safetyNotice?: string           // one-line card notice (e.g. highway pullout parking)
}

export interface LivingTrailChain {
  id: string
  title: string
  description: string
  nodeIds: string[]               // in narrative order
}

export const LIVING_TRAIL_NODES: LivingTrailNode[] = [
  {
    id: 'lt_wp_marker',
    chainId: 'wp_founders',
    title: 'The Marker at Indian Gulch',
    geofence: { lat: 38.39725, lng: -120.52766, radiusM: 75 },  // CHL #268, SR-26 x Main St island (marker-exact)
    dwellMs: 10_000,
    npcId: 'lt_npc_john_r_smith',
    microAction: { kind: 'talk', prompt: 'Talk with the blacksmith' },
    reward: { goodKarma: 3 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
  },
  {
    id: 'lt_wp_sandy_gulch',
    chainId: 'wp_founders',
    title: 'The Carsner Nuggets',
    geofence: { lat: 38.38018, lng: -120.53230, radiusM: 100 },  // HMDB m=11975, SR-26 roadside (marker-exact)
    dwellMs: 10_000,
    prerequisiteNodeId: 'lt_wp_marker',
    npcId: 'lt_npc_carsner_brothers',
    microAction: { kind: 'talk', prompt: 'Talk with the Carsner brothers' },
    reward: { goodKarma: 3 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
    safetyNotice: 'This marker is a highway pullout — park safely off SR-26 before the encounter.',
  },
  {
    id: 'lt_wp_cemetery_gate',
    chainId: 'wp_founders',
    title: 'Rest, Properly',
    // 290 Cemetery Lane, geocoded-address ~gate-level (OSM interpolation; no cemetery polygon exists).
    // REVERENCE RULES (mandatory): geofence centers on the GATE/entrance, not the interior;
    // the quiet dwell IS the mechanic; the reward is granted at the gate waypoint, never "on graves".
    geofence: { lat: 38.40104, lng: -120.53218, radiusM: 75 },
    dwellMs: 20_000,
    timeWindow: { startHour: 8, endHour: 18 },  // daylight only — active community cemetery
    prerequisiteNodeId: 'lt_wp_sandy_gulch',
    npcId: 'lt_npc_gatekeeper',
    microAction: { kind: 'waypoint', prompt: 'Stand with them a moment' },
    reward: { goodKarma: 5 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
  },
]

export const LIVING_TRAIL_CHAINS: LivingTrailChain[] = [
  {
    id: 'wp_founders',
    title: 'The Founders of Indian Gulch',
    description:
      'West Point began as Indian Gulch in 1852. Walk the real ground where it happened — '
      + 'three stops, three voices out of the 1850s.',
    nodeIds: ['lt_wp_marker', 'lt_wp_sandy_gulch', 'lt_wp_cemetery_gate'],
  },
]

// The chain-completion flourish, spoken over the last reward (Twain line).
export const WP_FOUNDERS_COMPLETION_LINE =
  '"The very ink with which all history is written is merely fluid prejudice." '
  + '— but you, friend, walked the actual ground. That counts for something. — Mark Twain'

// === Helpers ===

export function getLivingTrailNode(nodeId: string): LivingTrailNode | undefined {
  return LIVING_TRAIL_NODES.find(n => n.id === nodeId)
}

export function getChainNodes(chainId: string): LivingTrailNode[] {
  const chain = LIVING_TRAIL_CHAINS.find(c => c.id === chainId)
  if (!chain) return []
  return chain.nodeIds
    .map(id => getLivingTrailNode(id))
    .filter((n): n is LivingTrailNode => !!n)
}

export function getChildNodes(nodeId: string): LivingTrailNode[] {
  return LIVING_TRAIL_NODES.filter(n => n.prerequisiteNodeId === nodeId)
}

/**
 * Time-window gate. Pure so it can be unit-verified; `hour` defaults to the
 * device's local hour. Nodes without a window are always in-window.
 */
export function isNodeInTimeWindow(node: LivingTrailNode, hour: number = new Date().getHours()): boolean {
  if (!node.timeWindow) return true
  return hour >= node.timeWindow.startHour && hour < node.timeWindow.endHour
}
