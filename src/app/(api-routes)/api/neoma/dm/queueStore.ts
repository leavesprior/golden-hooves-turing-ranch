/**
 * DM directive queue + character tape — JSONL-backed server stores (DM Layer P1).
 * Storage follows the living-trail checkin pattern: Railway volume at /data
 * when present, /tmp fallback for local dev. Append-only records.
 *
 * Queue records (dm_directive_queue.jsonl), one JSON object per line:
 *   { type: 'enqueue', receivedAt, playerId, directive }
 *   { type: 'drain',   receivedAt, playerId, ids: string[] }
 * A directive is PENDING for a player iff an enqueue record exists with no
 * later drain record listing its id. Validation runs on BOTH write and read
 * (defense in depth); per-class cooldowns are enforced at write time.
 *
 * Tape records (dm_character_tape.jsonl) — see appendCharacterTape below.
 */

import fs from 'fs'
import path from 'path'
import {
  validateDmDirective,
  DIRECTIVE_COOLDOWN_MS,
  type DmDirective,
} from '@/lib/dmDirectives'

function storageDir(): string {
  const volumePath = '/data'
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return volumePath
    }
  } catch {
    // fall through
  }
  return '/tmp'
}

function queuePath(): string {
  return path.join(storageDir(), 'dm_directive_queue.jsonl')
}

// ===================== FILE BOUNDS (P1.5 hardening) =====================
// playerId is client-supplied, so cooldowns alone can't bound growth (rotate
// fresh ids → unbounded appends), and every poll re-reads the whole file.
// Bounds: a HARD size cap (writes rejected, logged) plus synchronous
// COMPACTION at a soft threshold — rewrite keeping only records that still
// matter (un-drained, or recent enough to back a cooldown), max 7 days old.

const HARD_CAP_BYTES = 2 * 1024 * 1024 // 2 MB — reject writes beyond this
const SOFT_COMPACT_BYTES = 1024 * 1024 // 1 MB — compact when exceeded
const SOFT_COMPACT_RECORDS = 5000      // — or when this many records
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000
// Drained records must survive long enough to enforce the longest cooldown.
const COOLDOWN_RETENTION_MS = Math.max(...Object.values(DIRECTIVE_COOLDOWN_MS))

function queueFileSize(): number {
  try {
    return fs.statSync(queuePath()).size
  } catch {
    return 0
  }
}

function tapePath(): string {
  return path.join(storageDir(), 'dm_character_tape.jsonl')
}

function guardianOutboxPath(): string {
  return path.join(storageDir(), 'dm_guardian_outbox.jsonl')
}

// ===================== QUEUE =====================

interface EnqueueRecord {
  type: 'enqueue'
  receivedAt: string
  playerId: string
  directive: DmDirective
}

interface DrainRecord {
  type: 'drain'
  receivedAt: string
  playerId: string
  ids: string[]
}

type QueueRecord = EnqueueRecord | DrainRecord

function readQueueRecords(): QueueRecord[] {
  let raw: string
  try {
    raw = fs.readFileSync(queuePath(), 'utf8')
  } catch {
    return []
  }
  const records: QueueRecord[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line)
      if (parsed && (parsed.type === 'enqueue' || parsed.type === 'drain')) {
        records.push(parsed as QueueRecord)
      }
    } catch {
      // skip corrupt line — append-only log, never rewrite
    }
  }
  return records
}

function appendQueueRecord(record: QueueRecord): boolean {
  try {
    fs.appendFileSync(queuePath(), JSON.stringify(record) + '\n', 'utf8')
    return true
  } catch {
    return false
  }
}

/**
 * Compaction: keep an enqueue record only while it still matters —
 * un-drained (still pending, up to 7 days), or drained but recent enough to
 * back a per-class cooldown (30 min). Drain tombstones are rebuilt to cover
 * exactly the kept-but-drained ids so nothing "un-drains" itself.
 * Pure function; caller rewrites the file synchronously.
 */
function compactQueueRecords(records: QueueRecord[]): QueueRecord[] {
  const now = Date.now()
  const drainedIds = new Set<string>()
  for (const rec of records) {
    if (rec.type === 'drain') for (const id of rec.ids) drainedIds.add(id)
  }

  const keptEnqueues: EnqueueRecord[] = []
  const drainedIdsByPlayer = new Map<string, string[]>()
  for (const rec of records) {
    if (rec.type !== 'enqueue') continue
    const t = new Date(rec.receivedAt).getTime()
    const age = Number.isNaN(t) ? Infinity : now - t
    if (age > RETENTION_MS) continue
    const isDrained = drainedIds.has(rec.directive.id)
    if (isDrained && age > COOLDOWN_RETENTION_MS) continue
    keptEnqueues.push(rec)
    if (isDrained) {
      const ids = drainedIdsByPlayer.get(rec.playerId) ?? []
      ids.push(rec.directive.id)
      drainedIdsByPlayer.set(rec.playerId, ids)
    }
  }

  const out: QueueRecord[] = [...keptEnqueues]
  for (const [playerId, ids] of drainedIdsByPlayer) {
    out.push({ type: 'drain', receivedAt: new Date(now).toISOString(), playerId, ids })
  }
  return out
}

/**
 * Synchronous compaction inside the write path (no await between read and
 * rewrite — preserves the store's serialization property). Returns the
 * records to continue working with.
 */
function compactIfNeeded(records: QueueRecord[]): QueueRecord[] {
  if (queueFileSize() <= SOFT_COMPACT_BYTES && records.length <= SOFT_COMPACT_RECORDS) {
    return records
  }
  const compacted = compactQueueRecords(records)
  try {
    const lines = compacted.map(r => JSON.stringify(r)).join('\n')
    fs.writeFileSync(queuePath(), lines.length > 0 ? lines + '\n' : '', 'utf8')
    console.warn(`[dm-queue] compacted: ${records.length} -> ${compacted.length} records`)
    return compacted
  } catch {
    // Compaction failed (disk?) — keep going with the in-memory records; the
    // hard cap still bounds further writes.
    return records
  }
}

export interface EnqueueResult {
  enqueued: DmDirective[]
  dropped: { directive: unknown; reason: string }[]
}

/**
 * Validate + cooldown-check + append directives for a player. Invalid or
 * cooldown-violating directives are dropped and reported — never stored.
 */
export function enqueueDirectives(playerId: string, rawDirectives: unknown[]): EnqueueResult {
  const result: EnqueueResult = { enqueued: [], dropped: [] }
  const existing = compactIfNeeded(readQueueRecords())
  const now = Date.now()

  // Last enqueue time per directive class for this player (cooldown basis).
  const lastByKind: Partial<Record<DmDirective['kind'], number>> = {}
  for (const rec of existing) {
    if (rec.type === 'enqueue' && rec.playerId === playerId) {
      const t = new Date(rec.receivedAt).getTime()
      const k = rec.directive.kind
      if (!Number.isNaN(t) && t > (lastByKind[k] ?? 0)) lastByKind[k] = t
    }
  }

  for (const raw of rawDirectives) {
    const v = validateDmDirective(raw)
    if (!v.ok) {
      console.warn(`[dm-queue] DROP invalid directive for ${playerId}: ${v.reason}`)
      result.dropped.push({ directive: raw, reason: v.reason })
      continue
    }
    const d = v.directive
    const last = lastByKind[d.kind] ?? 0
    if (now - last < DIRECTIVE_COOLDOWN_MS[d.kind]) {
      console.warn(`[dm-queue] DROP ${d.kind} for ${playerId}: cooldown (${DIRECTIVE_COOLDOWN_MS[d.kind]}ms)`)
      result.dropped.push({ directive: raw, reason: 'cooldown' })
      continue
    }
    // Hard size cap — storage-exhaustion guard on the shared volume.
    if (queueFileSize() > HARD_CAP_BYTES) {
      console.warn(`[dm-queue] DROP ${d.kind} for ${playerId}: queue_full (hard cap ${HARD_CAP_BYTES}B)`)
      result.dropped.push({ directive: raw, reason: 'queue_full' })
      continue
    }
    const ok = appendQueueRecord({
      type: 'enqueue',
      receivedAt: new Date(now).toISOString(),
      playerId,
      directive: d,
    })
    if (!ok) {
      result.dropped.push({ directive: raw, reason: 'storage_error' })
      continue
    }
    lastByKind[d.kind] = now
    result.enqueued.push(d)
  }
  return result
}

/**
 * Return all pending directives for a player and mark them drained.
 * Re-validates on read: a record that no longer passes the validator
 * (e.g. an outlaw id removed since enqueue) is silently retired.
 */
export function drainDirectives(playerId: string): DmDirective[] {
  const records = readQueueRecords()
  const drainedIds = new Set<string>()
  const pending = new Map<string, DmDirective>()

  for (const rec of records) {
    if (rec.playerId !== playerId) continue
    if (rec.type === 'drain') {
      for (const id of rec.ids) drainedIds.add(id)
    } else {
      pending.set(rec.directive.id, rec.directive)
    }
  }

  const out: DmDirective[] = []
  const retiredIds: string[] = []
  for (const [id, directive] of pending) {
    if (drainedIds.has(id)) continue
    retiredIds.push(id)
    const v = validateDmDirective(directive) // defense in depth on the read leg
    if (v.ok) out.push(v.directive)
    else console.warn(`[dm-queue] retire stored directive ${id}: ${v.reason}`)
  }

  if (retiredIds.length > 0) {
    appendQueueRecord({
      type: 'drain',
      receivedAt: new Date().toISOString(),
      playerId,
      ids: retiredIds,
    })
  }
  return out
}

// ===================== CHARACTER TAPE =====================

/**
 * P1-safe character tape (design §6 `dm-character-tape`): one JSONL record per
 * character-bound session end, server-side only.
 *
 * TODO(dm-character-tape P2 — LOUD): the design doc's Memory-Bridge tape
 * (`bobr_dm/characters/<key>`) is written by a HUB-SIDE SWEEPER that reads
 * this JSONL and writes MB with ternary _conf via the authed client. Do NOT
 * wire Memory-Bridge credentials into this Next app — MB write isolation
 * holds (spokes/routes never write MB directly).
 */
export interface CharacterTapeRecord {
  ts: string
  playerId: string | null
  characterId: string
  finalDisposition: string
  agendaProgress: string
  karmaVerdict: number
  endedBy: 'farewell' | 'cutoff'
}

export function appendCharacterTape(record: CharacterTapeRecord): boolean {
  try {
    fs.appendFileSync(tapePath(), JSON.stringify(record) + '\n', {
      encoding: 'utf8',
      mode: 0o600,
    })
    return true
  } catch {
    return false
  }
}

// ===================== GUARDIAN OUTBOX =====================

const GUARDIAN_OUTBOX_CAP_BYTES = 512 * 1024
const GUARDIAN_CATEGORIES = new Set([
  'credential_probe',
  'host_action_request',
  'infrastructure_probe',
  'prompt_injection',
])

/**
 * Sanitized security signal emitted by the game boundary.
 *
 * The raw message, IP address, session id, and player id are intentionally not
 * present. HMAC fingerprints let Guardian correlate repeated attempts without
 * turning the game process into a store of visitor conversations or addresses.
 * A hub-side bridge may move these records into Guardian/Memory Bridge; this
 * Next route never receives those credentials.
 */
export interface DmGuardianAlert {
  ts: string
  source: 'bobr-neoma-chat'
  disposition: 'blocked'
  category: string
  severity: 'watch' | 'alert'
  ruleId: string
  messageFingerprint: string
  networkFingerprint: string
  sessionFingerprint: string
  playerFingerprint: string | null
  characterId: string | null
  suspicionCount: number
}

export function appendGuardianAlert(record: DmGuardianAlert): boolean {
  if (!GUARDIAN_CATEGORIES.has(record.category)) return false
  if (!/^[a-f0-9]{64}$/.test(record.messageFingerprint)) return false
  if (!/^[a-f0-9]{64}$/.test(record.networkFingerprint)) return false
  if (!/^[a-f0-9]{64}$/.test(record.sessionFingerprint)) return false
  if (record.playerFingerprint && !/^[a-f0-9]{64}$/.test(record.playerFingerprint)) return false
  if (!Number.isInteger(record.suspicionCount) || record.suspicionCount < 1) return false

  try {
    const file = guardianOutboxPath()
    const size = fs.existsSync(file) ? fs.statSync(file).size : 0
    if (size >= GUARDIAN_OUTBOX_CAP_BYTES) {
      console.warn('[dm-guardian] DROP alert: outbox_full')
      return false
    }
    fs.appendFileSync(file, JSON.stringify(record) + '\n', {
      encoding: 'utf8',
      mode: 0o600,
    })
    return true
  } catch {
    return false
  }
}
