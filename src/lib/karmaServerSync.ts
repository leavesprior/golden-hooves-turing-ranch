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

// --- Session ownership proof (anti karma-grafting) ---------------------------------
// To link a guest session to an account, the server requires the markerSession HMAC
// token it issued for that session (proof the client legitimately progressed it). The
// game records markers under a `game_*` session id and the server returns that token;
// we persist it here, keyed by session id, so the (separate) SignInPanel component can
// present it when linking. Without this proof the server refuses to link the session.

const MARKER_PROOF_KEY = 'bobr_marker_proof' // { sessionId, markerToken, difficulty }

export interface MarkerOwnershipProof {
  sessionId: string
  markerToken: string
  difficulty: string
}

/** Persist the server-issued marker token for a session (called when the server
 *  returns sessionToken from /api/record-bobr-marker). Also unifies the karma session
 *  id onto this proven session id so balance + linking key off the same id. */
export function rememberMarkerProof(proof: MarkerOwnershipProof): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MARKER_PROOF_KEY, JSON.stringify(proof))
    // Unify: the karma session now IS the proven game session, so the karma balance
    // and the account link both key off the same, server-verifiable session id.
    if (/^[A-Za-z0-9_-]{1,128}$/.test(proof.sessionId)) {
      localStorage.setItem(KARMA_SESSION_KEY, proof.sessionId)
    }
  } catch {
    // best-effort; failing to persist just means the user can't link until next marker
  }
}

/** Read the stored marker ownership proof (or null). */
export function getMarkerProof(): MarkerOwnershipProof | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(MARKER_PROOF_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (p && typeof p.sessionId === 'string' && typeof p.markerToken === 'string' && typeof p.difficulty === 'string') {
      return p as MarkerOwnershipProof
    }
    return null
  } catch {
    return null
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

/** Persist an in-game earn/spend to the server ledger. Idempotent on eventId. Fire-and-forget safe. */
export async function postKarmaEvent(params: {
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
}): Promise<ServerBalanceResult> {
  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const res = await fetch('/api/karma/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, eventId }),
    })
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
