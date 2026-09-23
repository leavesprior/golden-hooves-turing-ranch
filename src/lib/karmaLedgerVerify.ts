// Karma ledger chain verifier (2026-09-23).
//
// bobr_karma_ledger has been hash-chained since 2026-06-19, but nothing ever
// re-walked the chain — tamper-evidence that is written and never read is not
// evidence. This recomputes every row_hash and every prev_hash link, in seq order.
//
// Pure (no DB import) so it tests without better-sqlite3. Ternary verdict:
//   intact — rows > 0 and every link + hash recomputes
//   empty  — zero rows: nothing was verified (NOT a clean bill of health)
//   broken — first failing seq + which check failed
//
// Limits (stated, not hidden): truncating the TAIL is undetectable from inside the
// table — publish `head` to an outside witness to catch that. `source` is not part
// of the hash formula, so a rewritten source is not detected.

import crypto from 'crypto'

export interface KarmaLedgerRow {
  seq: number
  event_id: string
  session_id: string
  karma_type: string
  delta: number
  source: string
  created_at: string
  prev_hash: string
  row_hash: string
}

export const KARMA_GENESIS_HASH = 'genesis'

/** The ledger's row-hash formula. dbAppendKarmaEvent writes with this; the verifier re-derives with it. */
export function karmaRowHash(p: {
  prevHash: string; eventId: string; sessionId: string; karmaType: string; delta: number; createdAt: string
}): string {
  return crypto.createHash('sha256')
    .update(`${p.prevHash}|${p.eventId}|${p.sessionId}|${p.karmaType}|${p.delta}|${p.createdAt}`)
    .digest('hex')
}

export interface KarmaChainVerdict {
  status: 'intact' | 'empty' | 'broken'
  rows: number
  head: string | null
  brokenAtSeq?: number
  reason?: 'prev_link' | 'row_hash'
}

/** rows must be ordered by seq ascending. */
export function verifyKarmaChain(rows: readonly KarmaLedgerRow[]): KarmaChainVerdict {
  if (rows.length === 0) return { status: 'empty', rows: 0, head: null }
  let expectedPrev = KARMA_GENESIS_HASH
  for (const r of rows) {
    if (r.prev_hash !== expectedPrev) {
      return { status: 'broken', rows: rows.length, head: null, brokenAtSeq: r.seq, reason: 'prev_link' }
    }
    const recomputed = karmaRowHash({
      prevHash: r.prev_hash, eventId: r.event_id, sessionId: r.session_id,
      karmaType: r.karma_type, delta: r.delta, createdAt: r.created_at,
    })
    if (recomputed !== r.row_hash) {
      return { status: 'broken', rows: rows.length, head: null, brokenAtSeq: r.seq, reason: 'row_hash' }
    }
    expectedPrev = r.row_hash
  }
  return { status: 'intact', rows: rows.length, head: expectedPrev }
}
