// Client → server karma sync (2026-06-19) — the IN-GAME, UNVERIFIED path.
// Reads the server-authoritative balance (server-wins, never wipes local progress)
// and persists in-game earn/spend events to the server ledger. Fully additive +
// offline-tolerant: every call fails soft, so the game keeps working offline.
// The 3 boundary operations (convert ±↔neutral, neutral>1000, karma onto another
// person) are NOT done here — those go through the Frank/QSD presence gate.

import type { KarmaBalance, KarmaType } from '@/lib/karmaBlockchain'
import { allowedLedgerDelta } from '@/lib/karmaUnverifiedBound'

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

// DURABLE OUTBOX (2026-09-23). The throttle above used to DROP any event that
// arrived inside the gap/backoff window, and the eventId was minted per attempt,
// so nothing could ever be replayed. Silent drops made the ledger undercount, and
// a dropped SPEND was refunded by reconcile's max(). Now every allowed event is
// queued once (eventId minted at enqueue, so a replay is idempotent server-side)
// and drained in order. Refusals are counted, never silent.
const KARMA_OUTBOX_KEY = 'bobr_karma_outbox_v1'
const KARMA_OUTBOX_STATS_KEY = 'bobr_karma_outbox_stats_v1'
export const KARMA_OUTBOX_MAX = 500

export interface PendingKarmaEvent {
  eventId: string
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
}

export interface KarmaOutboxStats { refused: number; overflowDropped: number }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota/private mode: stays in memory only */ }
}

export function readKarmaOutbox(): PendingKarmaEvent[] {
  if (typeof window === 'undefined') return []
  const list = readJson<unknown>(KARMA_OUTBOX_KEY, [])
  return Array.isArray(list)
    ? list.filter((e): e is PendingKarmaEvent =>
        !!e && typeof e === 'object' &&
        typeof (e as PendingKarmaEvent).eventId === 'string' &&
        typeof (e as PendingKarmaEvent).delta === 'number')
    : []
}
function writeKarmaOutbox(list: PendingKarmaEvent[]): void { writeJson(KARMA_OUTBOX_KEY, list) }

export function getKarmaOutboxStats(): KarmaOutboxStats {
  if (typeof window === 'undefined') return { refused: 0, overflowDropped: 0 }
  const s = readJson<Partial<KarmaOutboxStats>>(KARMA_OUTBOX_STATS_KEY, {})
  return { refused: s.refused ?? 0, overflowDropped: s.overflowDropped ?? 0 }
}
function bumpStat(k: keyof KarmaOutboxStats): void {
  const s = getKarmaOutboxStats(); s[k] += 1; writeJson(KARMA_OUTBOX_STATS_KEY, s)
}

/** Sum of not-yet-acknowledged deltas for a session, per karma type (may be negative). */
export function pendingKarmaDeltas(sessionId: string): KarmaBalance {
  const out: KarmaBalance = { good: 0, neutral: 0, bad: 0 }
  for (const e of readKarmaOutbox()) {
    if (e.sessionId === sessionId && e.karmaType in out) out[e.karmaType] += e.delta
  }
  return out
}

let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushInFlight = false
function scheduleFlush(ms: number): void {
  if (typeof window === 'undefined' || flushTimer) return
  flushTimer = setTimeout(() => { flushTimer = null; void flushKarmaOutbox() }, ms)
}

/** Queue an in-game earn/spend for the server ledger, then try to send. Never drops an allowed event. */
export async function postKarmaEvent(params: {
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
}): Promise<ServerBalanceResult> {
  if (!allowedLedgerDelta(params.delta)) return { ok: false }
  if (typeof window === 'undefined') return { ok: false }
  const list = readKarmaOutbox()
  list.push({ ...params, eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` })
  while (list.length > KARMA_OUTBOX_MAX) { list.shift(); bumpStat('overflowDropped') }
  writeKarmaOutbox(list)
  return flushKarmaOutbox()
}

/**
 * Send the oldest queued event (one per call, respecting the throttle); reschedules
 * itself until the outbox is empty. Idempotent on eventId, so a send whose response
 * was lost is safely re-sent.
 */
export async function flushKarmaOutbox(): Promise<ServerBalanceResult> {
  if (typeof window === 'undefined' || flushInFlight) return { ok: false }
  const head = readKarmaOutbox()[0]
  if (!head) return { ok: false }
  const now = Date.now()
  if (now < karmaBackoffUntil) { scheduleFlush(karmaBackoffUntil - now + 50); return { ok: false } }
  if (now - karmaLastPostAt < KARMA_MIN_GAP_MS) { scheduleFlush(KARMA_MIN_GAP_MS + 50); return { ok: false } }
  karmaLastPostAt = now
  flushInFlight = true
  const removeHead = () => writeKarmaOutbox(readKarmaOutbox().filter(e => e.eventId !== head.eventId))
  try {
    const res = await fetch('/api/karma/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(head),
    })
    if (res.status === 429 || res.status >= 500) {
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    if (!res.ok) {
      // 400/403: the server will refuse this event forever. Drop it, but COUNT it.
      removeHead(); bumpStat('refused')
      return { ok: false }
    }
    const data = await res.json()
    if (!data?.ok || !data?.balance) {
      // e.g. ledger_unavailable (served as 200): keep it queued and back off.
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    removeHead()
    return { ok: true, balance: data.balance, asOf: data.asOf }
  } catch {
    karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
    return { ok: false }
  } finally {
    flushInFlight = false
    if (readKarmaOutbox().length > 0) scheduleFlush(Math.max(KARMA_MIN_GAP_MS, karmaBackoffUntil - Date.now()) + 50)
  }
}

/**
 * Reconcile server vs local balance: SERVER-WINS but NEVER WIPES local progress.
 * Today the server balance = ledger fold + marker baseline and doesn't yet hold
 * the player's starting/offline-earned karma, so we take the max per type — the
 * server can only ever RAISE the displayed balance, never silently zero it.
 *
 * 2026-09-23: a SPEND still waiting in the outbox is not in the server fold yet,
 * so the raw max() handed the spent karma back. Only pending NEGATIVE deltas are
 * applied to the server side (a pending earn may already be on the server with
 * its response lost — adding it could mint). Invariant, per type:
 *   local <= result <= max(local, server)
 */
export function reconcile(
  local: KarmaBalance,
  server: KarmaBalance,
  pending: KarmaBalance = { good: 0, neutral: 0, bad: 0 },
): KarmaBalance {
  const pick = (t: KarmaType) => Math.max(local[t], server[t] + Math.min(0, pending[t]))
  return { good: pick('good'), neutral: pick('neutral'), bad: pick('bad') }
}
