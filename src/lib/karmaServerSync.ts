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
// a dropped SPEND was refunded by reconcile's max().
//
// Each queued event lives under ITS OWN localStorage key (prefix + eventId), so
// two tabs never read-modify-write a shared list and cannot erase each other's
// events; removal deletes only the acknowledged key. A double send from two tabs
// is harmless — the server is idempotent on eventId. If storage refuses a write
// (quota / private mode) the event is held in memory for this tab and the outbox
// reports itself degraded. A REFUSED spend is kept (marked refused) so reconcile
// keeps honouring it instead of refunding it; refusals are warned and counted.
const KARMA_OUTBOX_PREFIX = 'bobr_karma_ob1:'
const KARMA_OUTBOX_STATS_KEY = 'bobr_karma_outbox_stats_v1'
export const KARMA_OUTBOX_MAX = 500

export interface PendingKarmaEvent {
  eventId: string
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
  /** Server refused it for good. Kept only for spends, so the deduction stands. */
  refused?: true
}

export interface KarmaOutboxStats { refused: number; overflowDropped: number; refusedSpends: number; degraded: boolean }

const memoryOutbox = new Map<string, PendingKarmaEvent>()
let storageDegraded = false

function storage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

function isPendingEvent(e: unknown): e is PendingKarmaEvent {
  return !!e && typeof e === 'object' &&
    typeof (e as PendingKarmaEvent).eventId === 'string' &&
    typeof (e as PendingKarmaEvent).sessionId === 'string' &&
    typeof (e as PendingKarmaEvent).delta === 'number'
}

/** evt_<ms>_<rand>: order by the enqueue time, then id. */
function eventOrder(a: PendingKarmaEvent, b: PendingKarmaEvent): number {
  const ta = Number(a.eventId.split('_')[1]) || 0
  const tb = Number(b.eventId.split('_')[1]) || 0
  return ta - tb || (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0)
}

function putEvent(e: PendingKarmaEvent): void {
  const s = storage()
  try {
    if (!s) throw new Error('no storage')
    s.setItem(KARMA_OUTBOX_PREFIX + e.eventId, JSON.stringify(e))
    memoryOutbox.delete(e.eventId)
  } catch {
    memoryOutbox.set(e.eventId, e)
    storageDegraded = true
  }
}

function deleteEvent(eventId: string): void {
  memoryOutbox.delete(eventId)
  try { storage()?.removeItem(KARMA_OUTBOX_PREFIX + eventId) } catch { /* nothing else to do */ }
}

/** Every queued event (sendable and refused spends), oldest first. */
function allOutbox(): PendingKarmaEvent[] {
  const byId = new Map<string, PendingKarmaEvent>()
  const s = storage()
  if (s) {
    try {
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)
        if (!k || !k.startsWith(KARMA_OUTBOX_PREFIX)) continue
        try {
          const e = JSON.parse(s.getItem(k) ?? 'null')
          if (isPendingEvent(e)) byId.set(e.eventId, e)
        } catch { /* skip a corrupt entry */ }
      }
    } catch { /* storage unreadable: memory only */ }
  }
  for (const e of memoryOutbox.values()) byId.set(e.eventId, e)
  return [...byId.values()].sort(eventOrder)
}

/** Events still waiting to be sent, oldest first. */
export function readKarmaOutbox(): PendingKarmaEvent[] {
  return allOutbox().filter((e) => !e.refused)
}

function readStats(): { refused: number; overflowDropped: number } {
  try {
    const v = JSON.parse(storage()?.getItem(KARMA_OUTBOX_STATS_KEY) ?? '{}')
    return { refused: Number(v.refused) || 0, overflowDropped: Number(v.overflowDropped) || 0 }
  } catch {
    return { refused: 0, overflowDropped: 0 }
  }
}
function bumpStat(k: 'refused' | 'overflowDropped'): void {
  const st = readStats(); st[k] += 1
  try { storage()?.setItem(KARMA_OUTBOX_STATS_KEY, JSON.stringify(st)) } catch { storageDegraded = true }
}

export function getKarmaOutboxStats(): KarmaOutboxStats {
  return {
    ...readStats(),
    refusedSpends: allOutbox().filter((e) => e.refused).length,
    degraded: storageDegraded || memoryOutbox.size > 0,
  }
}

/**
 * Not-yet-acknowledged deltas for a session, per karma type (may be negative).
 * Includes refused spends: the player spent that karma locally, and a server
 * refusal must not turn into a refund.
 */
export function pendingKarmaDeltas(sessionId: string): KarmaBalance {
  const out: KarmaBalance = { good: 0, neutral: 0, bad: 0 }
  for (const e of allOutbox()) {
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

/** Queue an in-game earn/spend for the server ledger, then try to send. Never drops an allowed event silently. */
export async function postKarmaEvent(params: {
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
}): Promise<ServerBalanceResult> {
  if (!allowedLedgerDelta(params.delta)) return { ok: false }
  if (typeof window === 'undefined') return { ok: false }
  putEvent({ ...params, eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` })
  const queued = readKarmaOutbox()
  for (let i = 0; i < queued.length - KARMA_OUTBOX_MAX; i++) {
    deleteEvent(queued[i].eventId); bumpStat('overflowDropped')
    console.warn('[karma] outbox full — oldest queued event dropped', queued[i].eventId)
  }
  return flushKarmaOutbox()
}

/**
 * Send the oldest queued event (one per call, respecting the throttle); reschedules
 * itself until the outbox is empty. Idempotent on eventId, so a send whose response
 * was lost — or that another tab also sent — is safely re-sent.
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
  try {
    const { refused: _r, ...body } = head
    void _r
    const res = await fetch('/api/karma/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.status === 429 || res.status >= 500) {
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    if (!res.ok) {
      // 400/403: the server will refuse this event forever. Never silent.
      bumpStat('refused')
      if (head.delta < 0) {
        putEvent({ ...head, refused: true }) // the spend stands; reconcile keeps honouring it
        console.warn('[karma] server refused a spend; keeping it so it is not refunded', head.eventId, res.status)
      } else {
        deleteEvent(head.eventId)
        console.warn('[karma] server refused an earn; not recorded on the ledger', head.eventId, res.status)
      }
      return { ok: false }
    }
    const data = await res.json()
    if (!data?.ok || !data?.balance) {
      // e.g. ledger_unavailable (served as 200): keep it queued and back off.
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    deleteEvent(head.eventId)
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
