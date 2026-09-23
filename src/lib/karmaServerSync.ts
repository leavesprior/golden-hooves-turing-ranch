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
    if (!res.ok) { lastServerContactOk = false; return { ok: false } }
    const data = await res.json()
    if (!data?.ok || !data?.balance) { lastServerContactOk = false; return { ok: false } }
    lastServerContactOk = true
    return { ok: true, balance: data.balance, markerCount: data.markerCount, asOf: data.asOf }
  } catch {
    lastServerContactOk = false
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

// OUTBOX (2026-09-23). The throttle above used to DROP any event that arrived
// inside the gap/backoff window, and the eventId was minted per attempt, so
// nothing could ever be replayed. Silent drops made the ledger undercount, and a
// dropped SPEND was refunded by reconcile's max().
//
// Durable only while localStorage accepts writes. Each queued event lives under
// ITS OWN key (prefix + eventId), so tabs never read-modify-write a shared list
// and cannot erase each other's events; removal deletes only the acknowledged
// key. A double send from two tabs is harmless — the server is idempotent on
// eventId. If storage refuses a write (quota / private mode) the event is held in
// MEMORY ONLY for this tab — it is lost on reload — and the outbox reports
// `degraded` (sticky for the session) so the wallet can say so.
//
// Only a known app refusal (400/403 + a reason in KARMA_PERMANENT_REFUSALS) is
// permanent; any other 4xx is treated as transient: kept queued, backed off. A
// REFUSED spend is kept (marked refused, stamped refusedAt) so reconcile keeps
// honouring it instead of refunding it — for KARMA_REFUSED_TTL_MS, and at most
// KARMA_REFUSED_MAX of them; past either limit it is deleted, warned and counted.
//
// Counters are per-occurrence tombstone keys (prefix + kind + eventId), counted
// by scan — no shared read-modify-write counter that two tabs could clobber.
// Tombstones older than KARMA_REFUSED_TTL_MS are pruned, so counts cover ~7 days.
const KARMA_OUTBOX_PREFIX = 'bobr_karma_ob1:'
const KARMA_TOMBSTONE_PREFIX = 'bobr_karma_obx1:'
export const KARMA_OUTBOX_MAX = 500
export const KARMA_REFUSED_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const KARMA_REFUSED_MAX = 50
const KARMA_PERMANENT_REFUSALS = new Set([
  'qsd_envelope_required', 'invalid_delta', 'invalid_event_id', 'invalid_session', 'invalid_karma_type',
])

/** null until the first server contact; then whether the last contact succeeded. */
let lastServerContactOk: boolean | null = null

export interface PendingKarmaEvent {
  eventId: string
  sessionId: string
  karmaType: KarmaType
  delta: number
  source: string
  /** Server refused it for good. Kept only for spends, so the deduction stands. */
  refused?: true
  /** When it was refused (ms). Refused spends expire KARMA_REFUSED_TTL_MS later. */
  refusedAt?: number
}

export interface KarmaOutboxStats {
  refused: number; overflowDropped: number; refusedExpired: number; refusedSpends: number; degraded: boolean
}

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
        } catch { console.warn('[karma] skipping a corrupt outbox entry', k) }
      }
    } catch { /* storage unreadable: memory only */ }
  }
  for (const e of memoryOutbox.values()) byId.set(e.eventId, e)
  const all = [...byId.values()].sort(eventOrder)
  // Refused spends stop counting after the TTL, and only the newest
  // KARMA_REFUSED_MAX are kept. Each one dropped is deleted, warned and counted.
  const now = Date.now()
  const refused = all.filter((e) => e.refused).sort((a, b) => (a.refusedAt ?? 0) - (b.refusedAt ?? 0))
  const drop = new Set<string>()
  for (const e of refused) if (now - (e.refusedAt ?? 0) >= KARMA_REFUSED_TTL_MS) drop.add(e.eventId)
  const live = refused.filter((e) => !drop.has(e.eventId))
  for (let i = 0; i < live.length - KARMA_REFUSED_MAX; i++) drop.add(live[i].eventId)
  for (const id of drop) {
    deleteEvent(id); addTombstone('expired', id)
    console.warn('[karma] refused spend expired or over the cap; it no longer counts as pending', id)
  }
  return drop.size ? all.filter((e) => !drop.has(e.eventId)) : all
}

/** Events still waiting to be sent, oldest first. */
export function readKarmaOutbox(): PendingKarmaEvent[] {
  return allOutbox().filter((e) => !e.refused)
}

type TombstoneKind = 'refused' | 'overflowDropped' | 'refusedExpired'
const memoryTombstones = new Map<string, number>()

/** One key per occurrence (idempotent per event), never a shared counter. */
function addTombstone(kind: 'refused' | 'overflow' | 'expired', eventId: string): void {
  const k = `${KARMA_TOMBSTONE_PREFIX}${kind}:${eventId}`
  try {
    const s = storage()
    if (!s) throw new Error('no storage')
    s.setItem(k, String(Date.now()))
  } catch {
    memoryTombstones.set(k, Date.now())
  }
}

function readStats(): Record<TombstoneKind, number> {
  const out: Record<TombstoneKind, number> = { refused: 0, overflowDropped: 0, refusedExpired: 0 }
  const kindOf: Record<string, TombstoneKind> = { refused: 'refused', overflow: 'overflowDropped', expired: 'refusedExpired' }
  const seen = new Map<string, number>(memoryTombstones)
  const s = storage()
  if (s) {
    try {
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)
        if (k && k.startsWith(KARMA_TOMBSTONE_PREFIX)) seen.set(k, Number(s.getItem(k)) || 0)
      }
    } catch { /* storage unreadable: memory only */ }
  }
  const now = Date.now()
  for (const [k, at] of seen) {
    if (now - at >= KARMA_REFUSED_TTL_MS) {
      memoryTombstones.delete(k)
      try { s?.removeItem(k) } catch { /* nothing else to do */ }
      continue
    }
    const kind = kindOf[k.slice(KARMA_TOMBSTONE_PREFIX.length).split(':')[0]]
    if (kind) out[kind] += 1
  }
  return out
}

/** Counts cover the last KARMA_REFUSED_TTL_MS (older tombstones are pruned). */
export function getKarmaOutboxStats(): KarmaOutboxStats {
  const refusedSpends = allOutbox().filter((e) => e.refused).length
  return {
    ...readStats(),
    refusedSpends,
    degraded: storageDegraded || memoryOutbox.size > 0,
  }
}

export interface KarmaSyncStatus { online: boolean; pending: number; refusedSpends: number; degraded: boolean }

/**
 * What the wallet should show, from the REAL sync layer. `online` is the result of
 * the last server contact (unknown before the first one => not reported offline).
 */
export function karmaSyncStatus(): KarmaSyncStatus {
  const { refusedSpends, degraded } = getKarmaOutboxStats()
  return { online: lastServerContactOk !== false, pending: readKarmaOutbox().length, refusedSpends, degraded }
}

/**
 * Not-yet-acknowledged deltas for a session, per karma type (may be negative).
 * Includes refused spends: the player spent that karma locally, and a server
 * refusal must not turn into a refund — until the refused spend expires
 * (KARMA_REFUSED_TTL_MS) or is pushed out by the KARMA_REFUSED_MAX cap.
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

/**
 * Queue an in-game earn/spend for the server ledger, then try to send.
 * Never drops an allowed event silently: every removal short of an acknowledged
 * send (overflow, permanent refusal, refused-spend expiry) is warned and counted,
 * and an event held only in memory (storage full) is surfaced as `degraded` —
 * such an event does not survive a reload.
 */
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
    deleteEvent(queued[i].eventId); addTombstone('overflow', queued[i].eventId)
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
    const { eventId, sessionId, karmaType, delta, source } = head
    const res = await fetch('/api/karma/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, sessionId, karmaType, delta, source }),
    })
    if (res.status === 429) {
      lastServerContactOk = true // reachable, just busy
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    if (res.status >= 500) {
      lastServerContactOk = false
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    if (!res.ok) {
      let reason: unknown
      try { reason = (await res.json())?.reason } catch { /* no JSON body: not a known refusal */ }
      const permanent = (res.status === 400 || res.status === 403) &&
        typeof reason === 'string' && KARMA_PERMANENT_REFUSALS.has(reason)
      if (!permanent) {
        // 401/404/other 4xx, or no known reason: could be a proxy or a deploy in
        // progress, not the ledger's answer. Keep it queued and back off.
        lastServerContactOk = false
        karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
        return { ok: false }
      }
      // A known app refusal: the server will refuse this event forever. Never silent.
      lastServerContactOk = true
      addTombstone('refused', head.eventId)
      if (head.delta < 0) {
        putEvent({ ...head, refused: true, refusedAt: Date.now() }) // the spend stands; reconcile keeps honouring it
        console.warn('[karma] server refused a spend; keeping it so it is not refunded', head.eventId, res.status, reason)
      } else {
        deleteEvent(head.eventId)
        console.warn('[karma] server refused an earn; not recorded on the ledger', head.eventId, res.status, reason)
      }
      return { ok: false }
    }
    const data = await res.json()
    if (!data?.ok || !data?.balance) {
      // e.g. ledger_unavailable (served as 200): keep it queued and back off.
      lastServerContactOk = false
      karmaBackoffUntil = Date.now() + KARMA_BACKOFF_MS
      return { ok: false }
    }
    lastServerContactOk = true
    deleteEvent(head.eventId)
    return { ok: true, balance: data.balance, asOf: data.asOf }
  } catch {
    lastServerContactOk = false
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
