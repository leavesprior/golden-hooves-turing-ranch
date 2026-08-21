// Client → server karma sync (2026-06-19) — the IN-GAME, UNVERIFIED path.
// Reads the server-authoritative balance (server-wins, never wipes local progress)
// and persists in-game earn/spend events to the server ledger. Fully additive +
// offline-tolerant: every call fails soft, so the game keeps working offline.
// The 3 boundary operations (convert ±↔neutral, neutral>1000, karma onto another
// person) are NOT done here — those go through the Frank/QSD presence gate.

import type { KarmaBalance, KarmaType } from '@/lib/karmaBlockchain'

const KARMA_SESSION_KEY = 'bobr_karma_session_id'

// Stable per-browser karma session id (own key — no coupling to other providers).
// Prefers an already-stored game session id if present, so karma + markers can
// share a session; else mints + persists its own.
export function getKarmaSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = localStorage.getItem(KARMA_SESSION_KEY)
    if (existing && /^[A-Za-z0-9_-]{1,128}$/.test(existing)) return existing
    const id = `karma_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(KARMA_SESSION_KEY, id)
    return id
  } catch {
    return `karma_${Date.now()}`
  }
}

export interface ServerBalanceResult {
  ok: boolean
  balance?: KarmaBalance
  markerCount?: number
  asOf?: string
}

/** Fetch the server-authoritative balance. Fails soft (ok:false) when offline. */
export async function fetchServerBalance(sessionId: string): Promise<ServerBalanceResult> {
  try {
    const res = await fetch(`/api/karma/balance?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    if (!data?.ok || !data?.balance) return { ok: false }
    return { ok: true, balance: data.balance, markerCount: data.markerCount, asOf: data.asOf }
  } catch {
    return { ok: false }
  }
}

// Client-side throttle: the wallet posts on every earn/spend. A persist loop
// (or a few shops/hunts in a row) used to hammer /api/karma/event, get 429s,
// and stall the Next dev server so the tab went white mid-run.
let karmaBackoffUntil = 0
let karmaLastPostAt = 0
const KARMA_MIN_GAP_MS = 400
const KARMA_BACKOFF_MS = 8000

/** Persist an in-game earn/spend to the server ledger. Idempotent on eventId. Fire-and-forget safe. */
export async function postKarmaEvent(params: {
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
}): Promise<ServerBalanceResult> {
  const now = Date.now()
  if (now < karmaBackoffUntil) return { ok: false }
  if (now - karmaLastPostAt < KARMA_MIN_GAP_MS) return { ok: false }
  karmaLastPostAt = now
  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const res = await fetch('/api/karma/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, eventId }),
    })
    if (res.status === 429 || res.status >= 500) {
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    if (!res.ok) return { ok: false }
    const data = await res.json()
    if (!data?.ok || !data?.balance) return { ok: false }
    return { ok: true, balance: data.balance, asOf: data.asOf }
  } catch {
    return { ok: false }
  }
}

/**
 * Reconcile server vs local balance: SERVER-WINS but NEVER WIPES local progress.
 * Today the server balance = ledger fold + marker baseline and doesn't yet hold
 * the player's starting/offline-earned karma, so we take the max per type — the
 * server can only ever RAISE the displayed balance, never silently zero it.
 */
export function reconcile(local: KarmaBalance, server: KarmaBalance): KarmaBalance {
  return {
    good: Math.max(local.good, server.good),
    neutral: Math.max(local.neutral, server.neutral),
    bad: Math.max(local.bad, server.bad),
  }
}
