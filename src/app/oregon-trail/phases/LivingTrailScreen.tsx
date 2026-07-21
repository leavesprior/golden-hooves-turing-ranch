'use client'

/**
 * LivingTrailScreen — presence-gated real-world quest chains (Living Trail P1).
 *
 * Chain list → node cards (locked/available/completed) with a live GPS status
 * strip. Standing at a node's real-world geofence for its dwell time (with
 * acceptable GPS accuracy) opens the NPC encounter; completing the micro-action
 * grants karma and unlocks the next node. Each available node also offers a
 * quiet remote "walk it by lantern-light" variant: same encounter anywhere,
 * half karma, recorded verifiedPresence: false.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import {
  LIVING_TRAIL_CHAINS,
  getChainNodes,
  getLivingTrailNode,
  isNodeInTimeWindow,
  WP_FOUNDERS_COMPLETION_LINE,
  type LivingTrailNode,
} from '../data/livingTrailChains'
import { getNPCById } from '../data/goldCountryNPCs'
import {
  useVerifiedPresence,
  distanceMeters,
  getDevMockHour,
  ACCURACY_MAX_M,
} from '../lib/useVerifiedPresence'
import { postPresenceCheckin } from '@/lib/livingTrailSync'

interface Encounter {
  nodeId: string
  remote: boolean          // true = "by-lantern-light" variant
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function LivingTrailScreen() {
  const { state, completeLivingTrailNode, returnToPreviousPhase } = useOregonTrail()
  const nodeStates = state.livingTrail.nodes

  // P1 ships one chain; the render is generic over LIVING_TRAIL_CHAINS.
  const chain = LIVING_TRAIL_CHAINS[0]
  const chainNodes = useMemo(() => getChainNodes(chain.id), [chain.id])

  // Selected node = the geofence the GPS loop watches. Default: first available.
  const firstAvailableId = chainNodes.find(n => nodeStates[n.id]?.status === 'available')?.id ?? null
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(firstAvailableId)
  useEffect(() => {
    // Follow progression: when the watched node stops being available
    // (completed) move the watch to the next available node.
    if (!selectedNodeId || nodeStates[selectedNodeId]?.status !== 'available') {
      setSelectedNodeId(firstAvailableId)
    }
  }, [selectedNodeId, nodeStates, firstAvailableId])

  const selectedNode = selectedNodeId ? getLivingTrailNode(selectedNodeId) ?? null : null
  const presence = useVerifiedPresence(selectedNode?.geofence ?? null, selectedNode?.dwellMs ?? 10_000)

  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [rewardToast, setRewardToast] = useState<string | null>(null)

  // Local hour for time-window gates (dev mock ?ltMockHour= honored in development only)
  const localHour = getDevMockHour() ?? new Date().getHours()

  // Physical encounter trigger: verified presence at an available node inside
  // its time window → the ghost appears.
  useEffect(() => {
    if (encounter || !selectedNode) return
    if (nodeStates[selectedNode.id]?.status !== 'available') return
    if (!presence.verified) return
    if (!isNodeInTimeWindow(selectedNode, localHour)) return
    setEncounter({ nodeId: selectedNode.id, remote: false })
    setDialogueIndex(0)
  }, [encounter, selectedNode, presence.verified, nodeStates, localHour])

  const startRemoteEncounter = useCallback((nodeId: string) => {
    setEncounter({ nodeId, remote: true })
    setDialogueIndex(0)
  }, [])

  const handleMicroAction = useCallback(() => {
    if (!encounter) return
    const node = getLivingTrailNode(encounter.nodeId)
    if (!node) return
    const verified = !encounter.remote
    completeLivingTrailNode(node.id, verified)
    // Record-only server check-in (P1 — fire-and-forget, fail-soft offline)
    postPresenceCheckin(
      node.id,
      verified && presence.position
        ? { lat: presence.position.lat, lng: presence.position.lng, accuracyM: presence.position.accuracyM }
        : null,
      verified,
    ).catch(() => {})

    const scale = verified ? 1 : node.remoteVariant.karmaScale
    const karma = node.reward.goodKarma ? Math.round(node.reward.goodKarma * scale) : 0
    const isLastNode = chainNodes.length > 0 && chainNodes[chainNodes.length - 1].id === node.id
    setRewardToast(
      `+${karma} good karma — ${node.title}` +
      (verified ? '' : ' (by lantern-light: half karma)') +
      (isLastNode ? `\n\n${WP_FOUNDERS_COMPLETION_LINE}` : '')
    )
    setEncounter(null)
  }, [encounter, completeLivingTrailNode, presence.position, chainNodes])

  const chainComplete = chainNodes.every(n => nodeStates[n.id]?.status === 'completed')

  // === Encounter view ===
  if (encounter) {
    const node = getLivingTrailNode(encounter.nodeId)
    const npc = node ? getNPCById(node.npcId) : undefined
    if (!node || !npc) {
      // Data mismatch — fail back to the list rather than crash
      setEncounter(null)
      return null
    }
    const lines = [npc.greeting, ...npc.dialogueLines]
    const atEnd = dialogueIndex >= lines.length - 1
    return (
      <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-green-950/30 border border-green-700/40 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{npc.portrait}</span>
            <div>
              <h2 className="font-pixel text-amber-400 text-xl">{npc.name}</h2>
              <p className="text-green-600 text-xs font-mono uppercase tracking-widest">{npc.title}</p>
              {encounter.remote && (
                <p className="text-indigo-400 text-xs font-mono mt-1">🏮 by lantern-light — told from afar</p>
              )}
            </div>
          </div>
          <div className="bg-black/40 border border-green-800/40 rounded p-4 min-h-[7rem] mb-4">
            <p className="text-green-200 text-sm leading-relaxed">{lines[dialogueIndex]}</p>
          </div>
          {!atEnd ? (
            <button
              onClick={() => setDialogueIndex(i => i + 1)}
              className="w-full px-4 py-3 bg-green-900/60 hover:bg-green-800/60 border-2 border-green-600 rounded-lg font-pixel text-green-200 text-sm"
            >
              ▸ Listen on
            </button>
          ) : (
            <button
              onClick={handleMicroAction}
              className="w-full px-4 py-3 bg-amber-900/60 hover:bg-amber-800/60 border-2 border-amber-500 rounded-lg font-pixel text-amber-200 text-sm"
            >
              {node.microAction.kind === 'waypoint' ? '🕯️' : '💬'} {node.microAction.prompt}
            </button>
          )}
          <p className="text-green-800 text-[10px] font-mono mt-4 text-center">
            Ghost stories are fiction woven around real history — sources in the credits.
          </p>
        </div>
      </div>
    )
  }

  // === Chain list view ===
  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col">
      <header className="bg-green-950/30 border-b border-green-700/40 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-pixel text-amber-400 text-xl tracking-wider">🥾 LIVING TRAIL</h1>
            <p className="text-green-600 text-xs font-mono tracking-widest uppercase">
              Real-world walk — West Point, California
            </p>
          </div>
          <button
            onClick={returnToPreviousPhase}
            className="px-3 py-2 border border-green-700/40 rounded text-xs font-mono hover:bg-green-900/30"
          >
            ← BACK
          </button>
        </div>
      </header>

      {/* Live GPS status strip (RETRY GPS UX shared with Gold Country explore) */}
      <div className="bg-green-950/20 border-b border-green-800/30 px-4 py-2">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2 text-xs font-mono text-green-500">
          <span>
            GPS: {presence.status}{' '}
            {presence.position
              ? `${presence.position.lat.toFixed(5)}, ${presence.position.lng.toFixed(5)} (±${Math.round(presence.position.accuracyM)} m)`
              : '—'}
          </span>
          {presence.position && presence.position.accuracyM > ACCURACY_MAX_M && (
            <span className="text-amber-500">accuracy too coarse for verification (needs ≤{ACCURACY_MAX_M} m)</span>
          )}
          {selectedNode && presence.distanceM !== null && (
            <span className="text-green-400">
              → {selectedNode.title}: {formatDistance(presence.distanceM)}
              {presence.inside && ' • INSIDE GEOFENCE'}
            </span>
          )}
          <button
            onClick={presence.retry}
            className="ml-auto px-1 py-0.5 border border-green-700/40 rounded text-[10px] hover:bg-green-900/30"
          >
            RETRY GPS
          </button>
        </div>
        {/* Dwell progress for the watched node */}
        {selectedNode && presence.inside && (
          <div className="max-w-3xl mx-auto mt-1">
            <div className="h-1.5 bg-green-950 rounded overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, (presence.dwelledMs / selectedNode.dwellMs) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-green-600 mt-0.5">
              standing with the place... {Math.min(selectedNode.dwellMs, presence.dwelledMs) / 1000 | 0}s / {selectedNode.dwellMs / 1000}s
            </p>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4">
        <div className="mb-4">
          <h2 className="font-pixel text-green-300 text-base">{chain.title}</h2>
          <p className="text-green-600 text-xs mt-1">{chain.description}</p>
          <p className="text-green-700 text-[11px] font-mono mt-2">
            This chain is a REAL-WORLD walk: visit each site in person and stand with it a moment.
            The ghosts only appear where the history happened.
          </p>
        </div>

        {chainComplete && (
          <div className="mb-4 bg-amber-950/40 border border-amber-600/60 rounded-lg p-4">
            <p className="text-amber-300 font-pixel text-sm">✨ Chain complete — you walked the founders&apos; ground.</p>
            <p className="text-amber-200/80 text-xs italic mt-2">{WP_FOUNDERS_COMPLETION_LINE}</p>
          </div>
        )}

        <div className="space-y-3">
          {chainNodes.map((node: LivingTrailNode, idx: number) => {
            const ns = nodeStates[node.id] ?? { status: 'locked' as const }
            const isWatched = node.id === selectedNodeId
            const inWindow = isNodeInTimeWindow(node, localHour)
            const dist = presence.position
              ? distanceMeters(presence.position.lat, presence.position.lng, node.geofence.lat, node.geofence.lng)
              : null
            const prereq = node.prerequisiteNodeId ? getLivingTrailNode(node.prerequisiteNodeId) : null
            return (
              <div
                key={node.id}
                className={`border rounded-lg p-4 ${
                  ns.status === 'completed'
                    ? 'border-amber-600/50 bg-amber-950/20'
                    : ns.status === 'available'
                      ? `bg-green-950/20 ${isWatched ? 'border-green-400' : 'border-green-700/40'}`
                      : 'border-green-900/40 bg-black/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-pixel text-sm text-green-200">
                      {ns.status === 'completed' ? '✅' : ns.status === 'available' ? '🥾' : '🔒'}{' '}
                      {idx + 1}. {node.title}
                    </h3>
                    <p className="text-green-600 text-[11px] font-mono mt-1">
                      geofence {node.geofence.radiusM} m • stay {node.dwellMs / 1000}s
                      {node.timeWindow && ` • daylight only (${node.timeWindow.startHour}:00–${node.timeWindow.endHour}:00)`}
                    </p>
                    {node.safetyNotice && ns.status !== 'completed' && (
                      <p className="text-amber-500 text-[11px] mt-1">⚠️ {node.safetyNotice}</p>
                    )}
                    {ns.status === 'locked' && prereq && (
                      <p className="text-green-700 text-[11px] mt-1">Unlocks after: {prereq.title}</p>
                    )}
                    {ns.status === 'available' && node.timeWindow && !inWindow && (
                      <p className="text-amber-500 text-[11px] mt-1">
                        🌙 The gate rests for the night — return between {node.timeWindow.startHour}:00 and {node.timeWindow.endHour}:00.
                      </p>
                    )}
                    {ns.status === 'completed' && (
                      <p className="text-amber-400/80 text-[11px] font-mono mt-1">
                        {ns.verifiedPresence ? '👣 walked in person (verified presence)' : '🏮 walked by lantern-light (remote)'}
                      </p>
                    )}
                  </div>
                  {dist !== null && ns.status !== 'completed' && (
                    <span className="text-green-500 text-[11px] font-mono whitespace-nowrap">{formatDistance(dist)}</span>
                  )}
                </div>
                {ns.status === 'available' && (
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`px-3 py-1.5 border rounded text-[11px] font-mono ${
                        isWatched
                          ? 'border-green-400 text-green-300 bg-green-900/30'
                          : 'border-green-700/40 text-green-500 hover:bg-green-900/30'
                      }`}
                    >
                      {isWatched ? '📡 WATCHING THIS SITE' : 'WATCH THIS SITE'}
                    </button>
                    {/* Quiet remote variant — the trail is best walked, but never gated on ability to travel */}
                    <button
                      onClick={() => startRemoteEncounter(node.id)}
                      className="text-indigo-400/80 hover:text-indigo-300 text-[11px] underline decoration-dotted"
                    >
                      walk it by lantern-light instead
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Reward toast */}
      {rewardToast && (
        <div className="fixed inset-x-0 bottom-8 flex justify-center z-50 px-4">
          <div className="max-w-md bg-amber-950/95 border-2 border-amber-500 rounded-lg p-4 shadow-xl">
            <p className="text-amber-200 text-sm whitespace-pre-line">🍪 {rewardToast}</p>
            <button
              onClick={() => setRewardToast(null)}
              className="mt-2 px-3 py-1 border border-amber-600/60 rounded text-[11px] font-mono text-amber-300 hover:bg-amber-900/40"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-green-900/40 px-4 py-3">
        <p className="max-w-3xl mx-auto text-green-800 text-[10px] font-mono text-center">
          Ghost stories are fiction woven around real history — sources in the credits.
          Watch for traffic and private property; the trail asks only for your presence, never your risk.
        </p>
      </footer>
    </div>
  )
}
