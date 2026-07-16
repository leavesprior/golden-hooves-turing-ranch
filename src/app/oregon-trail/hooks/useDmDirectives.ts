'use client'

/**
 * useDmDirectives — the game-client consumer of the DM directive queue
 * (DM Layer P1, NEOMA_DM_LAYER_20260715.md §3).
 *
 * Polls GET /api/neoma/dm/queue?playerId=<id> at a gentle interval, ONLY while
 * the player is in a trail gameplay phase where every P1 directive class is
 * honestly applicable (traveling/town — the phases from which the reducer will
 * spawn a boss encounter). Drained directives are applied through the single
 * choke point: applyDmDirective → validate → dispatch(APPLY_DM_DIRECTIVE).
 */

import { useEffect, useRef } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import type { GamePhase } from '../state/types'

const POLL_INTERVAL_MS = 30_000 // gentle: >= 30s per design
const DM_PLAYER_ID_KEY = 'bobr_dm_player_id'

/**
 * Stable anonymous player id for the DM channel, minted once per browser.
 * This is the id game clients will thread into the chat route (P1 accepts +
 * records it) and the key the queue is drained by.
 */
export function getDmPlayerId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const existing = localStorage.getItem(DM_PLAYER_ID_KEY)
    if (existing && /^[A-Za-z0-9_-]{1,64}$/.test(existing)) return existing
    const fresh = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(DM_PLAYER_ID_KEY, fresh)
    return fresh
  } catch {
    return null
  }
}

/** Phases in which the queue is polled (all three P1 classes applicable). */
const POLLABLE_PHASES: ReadonlySet<GamePhase> = new Set(['traveling', 'town'] as GamePhase[])

export function useDmDirectives(): void {
  const { state, applyDmDirective } = useOregonTrail()
  const phaseActive = POLLABLE_PHASES.has(state.phase)
  // Guard against overlapping fetches if a poll outlives the interval tick.
  const inFlight = useRef(false)

  useEffect(() => {
    if (phaseActive === false) return
    let cancelled = false

    const poll = async () => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const playerId = getDmPlayerId()
        if (!playerId) return
        const res = await fetch(`/api/neoma/dm/queue?playerId=${encodeURIComponent(playerId)}`)
        if (!res.ok) return
        const data: { ok?: boolean; directives?: unknown[] } = await res.json()
        if (cancelled || !data.ok || !Array.isArray(data.directives)) return
        for (const directive of data.directives) {
          // applyDmDirective validates (and drops + logs) — pass through raw.
          applyDmDirective(directive as Parameters<typeof applyDmDirective>[0])
        }
      } catch {
        // network hiccup — next tick will retry
      } finally {
        inFlight.current = false
      }
    }

    void poll() // drain immediately on entering a pollable phase
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [phaseActive, applyDmDirective])
}
