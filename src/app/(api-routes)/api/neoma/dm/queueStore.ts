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

function tapePath(): string {
  return path.join(storageDir(), 'dm_character_tape.jsonl')
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
  const existing = readQueueRecords()
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
    fs.appendFileSync(tapePath(), JSON.stringify(record) + '\n', 'utf8')
    return true
  } catch {
    return false
  }
}
