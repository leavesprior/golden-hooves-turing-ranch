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
  timeWindow?: { startHour: number; endHour: number }       // local hours; end < start wraps midnight (ghosts 20 -> 1)
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
  completionLine?: string         // spoken over the last reward; default is the West Point Twain line
  place: string                   // shown in the walk header, e.g. 'Volcano, California'
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

  // === Volcano — "The Town That Kept Burning" (research 2026-09-23:
  // ~/Documents/BOBR/research/volcano_local/). Only three points are placed by
  // OpenStreetMap; the Main St buildings are address interpolation, so the
  // theatre and hotel stops share the district anchor at the St. George
  // (NRHP: the commercial district lies within two blocks of the hotel).
  {
    id: 'lt_vol_soldiers_gulch',
    chainId: 'vol_kept_burning',
    title: 'The Winter at Soldiers Gulch',
    geofence: { lat: 38.44241, lng: -120.6316, radiusM: 100 },  // OSM "Soldiers Memorial Park" (plaques)
    dwellMs: 10_000,
    npcId: 'lt_npc_vol_soldier',
    microAction: { kind: 'talk', prompt: 'Talk with the soldier by the plaques' },
    reward: { goodKarma: 3 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
  },
  {
    id: 'lt_vol_old_abe',
    chainId: 'vol_kept_burning',
    title: 'The Cannon in the Hearse',
    geofence: { lat: 38.4431, lng: -120.63079, radiusM: 75 },  // OSM Union Inn; Old Abe's shed stands beside it
    dwellMs: 10_000,
    prerequisiteNodeId: 'lt_vol_soldiers_gulch',
    npcId: 'lt_npc_vol_volcano_blue',
    microAction: { kind: 'talk', prompt: 'Talk with the Union man at the cannon shed' },
    reward: { goodKarma: 3 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
  },
  {
    id: 'lt_vol_cobblestone',
    chainId: 'vol_kept_burning',
    title: 'Smoke in the Stone Walls',
    geofence: { lat: 38.44175, lng: -120.63058, radiusM: 150 },  // district anchor (St. George, OSM); theatre is 16121 Main
    dwellMs: 10_000,
    prerequisiteNodeId: 'lt_vol_old_abe',
    npcId: 'lt_npc_vol_adolph_mayer',
    microAction: { kind: 'talk', prompt: 'Talk with the tobacconist outside the Cobblestone' },
    reward: { goodKarma: 3 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
  },
  {
    id: 'lt_vol_fire_dragon',
    chainId: 'vol_kept_burning',
    title: 'The Fire Dragon',
    geofence: { lat: 38.44175, lng: -120.63058, radiusM: 150 },  // St. George (OSM) — from the public street
    dwellMs: 20_000,
    timeWindow: { startHour: 20, endHour: 1 },  // night only; wraps midnight
    prerequisiteNodeId: 'lt_vol_cobblestone',
    npcId: 'lt_npc_vol_fire_dragon',
    microAction: { kind: 'waypoint', prompt: 'Stand on Main Street and watch the old hotel' },
    reward: { goodKarma: 5 },
    remoteVariant: { enabled: true, karmaScale: 0.5 },
    safetyNotice: 'Stay on the public street — the St. George is a private hotel, not a stop to enter. Rural town, little light: bring a flashlight and watch for cars.',
  },
]

export const LIVING_TRAIL_CHAINS: LivingTrailChain[] = [
  {
    id: 'wp_founders',
    title: 'The Founders of Indian Gulch',
    place: 'West Point, California',
    description:
      'West Point began as Indian Gulch in 1852. Walk the real ground where it happened — '
      + 'three stops, three voices out of the 1850s.',
    nodeIds: ['lt_wp_marker', 'lt_wp_sandy_gulch', 'lt_wp_cemetery_gate'],
  },
  {
    id: 'vol_kept_burning',
    title: 'The Town That Kept Burning',
    place: 'Volcano, California',
    description:
      'Volcano began as a winter camp at Soldiers Gulch and burned down more than once. '
      + 'Four stops on the real street — the last one only after dark.',
    nodeIds: ['lt_vol_soldiers_gulch', 'lt_vol_old_abe', 'lt_vol_cobblestone', 'lt_vol_fire_dragon'],
    completionLine: 'Four hotels on one lot, three of them ash — and the brick one still stands. '
      + 'You walked the town that would not stay burned down.',
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
  const { startHour, endHour } = node.timeWindow
  // A window whose end is before its start runs past midnight (21 -> 2).
  if (endHour < startHour) return hour >= startHour || hour < endHour
  return hour >= startHour && hour < endHour
}
