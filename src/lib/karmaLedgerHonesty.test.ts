/**
 * Karma ledger honesty (2026-09-23): chain verifier, durable outbox, spend-aware reconcile.
 * Prints JSON for wheelwright; exits 1 on any failure.
 *   npx tsx src/lib/karmaLedgerHonesty.test.ts
 */
import { karmaRowHash, verifyKarmaChain, KARMA_GENESIS_HASH, type KarmaLedgerRow } from './karmaLedgerVerify'

// ---- fake browser: clock, storage, timers, fetch (installed BEFORE the sync module loads) ----
let fakeNow = 1_800_000_000_000
Date.now = () => fakeNow
const store = new Map<string, string>()
const g = globalThis as unknown as Record<string, unknown>
g.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
}
g.window = globalThis
const timers: (() => void)[] = []
g.setTimeout = ((fn: () => void) => { timers.push(fn); return timers.length }) as unknown
type Reply = { status: number; body: unknown } | 'throw'
let replies: Reply[] = []
const sent: { eventId: string; delta: number }[] = []
g.fetch = async (_url: string, init?: { body?: string }) => {
  const b = JSON.parse(init?.body ?? '{}')
  sent.push({ eventId: b.eventId, delta: b.delta })
  const r = replies.shift() ?? { status: 200, body: { ok: true, balance: { good: 0, neutral: 0, bad: 0 } } }
  if (r === 'throw') throw new Error('offline')
  return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body }
}

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

// ---- 1. chain verifier ----
function chain(n: number): KarmaLedgerRow[] {
  const rows: KarmaLedgerRow[] = []
  let prev = KARMA_GENESIS_HASH
  for (let i = 1; i <= n; i++) {
    const r = { seq: i, event_id: `e${i}`, session_id: 's1', karma_type: i % 2 ? 'good' : 'neutral',
      delta: i * 3 - 7, source: 'game:earn', created_at: `2026-09-23T00:00:0${i}.000Z`, prev_hash: prev, row_hash: '' }
    r.row_hash = karmaRowHash({ prevHash: prev, eventId: r.event_id, sessionId: r.session_id,
      karmaType: r.karma_type, delta: r.delta, createdAt: r.created_at })
    prev = r.row_hash
    rows.push(r)
  }
  return rows
}
const good = chain(5)
const v = verifyKarmaChain(good)
check('intact chain verifies', v.status === 'intact' && v.rows === 5 && v.head === good[4].row_hash, v)
check('empty ledger is EMPTY, not intact', verifyKarmaChain([]).status === 'empty')
{
  const t = chain(5); t[2].delta += 100
  const r = verifyKarmaChain(t)
  check('edited delta caught at its row', r.status === 'broken' && r.brokenAtSeq === 3 && r.reason === 'row_hash', r)
}
{
  const t = chain(5); t.splice(1, 1)
  const r = verifyKarmaChain(t)
  check('deleted middle row caught at the next link', r.status === 'broken' && r.brokenAtSeq === 3 && r.reason === 'prev_link', r)
}
{
  const t = chain(5); [t[1], t[2]] = [t[2], t[1]]
  check('reordered rows caught', verifyKarmaChain(t).status === 'broken')
}
{
  const t = chain(5); t[0].session_id = 'someone_else'
  check('reassigned owner caught', verifyKarmaChain(t).status === 'broken')
}
{
  // Declared limit: dropping the TAIL is invisible inside the table; only the head moves.
  const t = chain(5).slice(0, 4)
  const r = verifyKarmaChain(t)
  check('tail truncation: not detectable internally, but head changes (witness catches it)',
    r.status === 'intact' && r.head !== good[4].row_hash, r)
}

// ---- 2. reconcile + 3. outbox (dynamic import so the fakes above are in place) ----
async function main() {
  const { reconcile, postKarmaEvent, flushKarmaOutbox, readKarmaOutbox, pendingKarmaDeltas, getKarmaOutboxStats } =
    await import('./karmaServerSync')

  const Z = { good: 0, neutral: 0, bad: 0 }
  // The refund bug: earned 50 (on server), spent 120 locally, spend not yet on server.
  const refund = reconcile({ good: 30, neutral: 0, bad: 0 }, { good: 50, neutral: 0, bad: 0 }, { good: -120, neutral: 0, bad: 0 })
  check('pending spend is NOT refunded', refund.good === 30, refund)
  check('no pending: server can still raise', reconcile({ good: 5, neutral: 1, bad: 0 }, { good: 9, neutral: 1, bad: 2 }).good === 9)
  const minted = reconcile({ good: 100, neutral: 0, bad: 0 }, { good: 100, neutral: 0, bad: 0 }, { good: 50, neutral: 0, bad: 0 })
  check('pending EARN never mints above max(local, server)', minted.good === 100, minted)
  let invariantOk = true
  let seed = 7
  const rnd = (m: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return (seed % (2 * m)) - m }
  for (let i = 0; i < 5000 && invariantOk; i++) {
    const L = { good: Math.abs(rnd(500)), neutral: Math.abs(rnd(500)), bad: Math.abs(rnd(500)) }
    const S = { good: Math.abs(rnd(500)), neutral: Math.abs(rnd(500)), bad: Math.abs(rnd(500)) }
    const P = { good: rnd(500), neutral: rnd(500), bad: rnd(500) }
    const R = reconcile(L, S, P)
    for (const t of ['good', 'neutral', 'bad'] as const) {
      if (!(L[t] <= R[t] && R[t] <= Math.max(L[t], S[t]))) { invariantOk = false; check('invariant', false, { L, S, P, R }) }
    }
  }
  check('invariant local <= result <= max(local, server) over 5000 random cases', invariantOk)
  check('default pending = old behaviour', JSON.stringify(reconcile({ good: 1, neutral: 8, bad: 3 }, { good: 4, neutral: 2, bad: 3 }, Z)) === JSON.stringify({ good: 4, neutral: 8, bad: 3 }))

  // Offline: the event must stay queued, not vanish.
  replies = ['throw']
  await postKarmaEvent({ sessionId: 's1', karmaType: 'good', delta: -40, source: 'spend' })
  check('offline spend stays queued', readKarmaOutbox().length === 1)
  const queuedId = readKarmaOutbox()[0]?.eventId
  // A second event inside the backoff window: old code DROPPED it.
  fakeNow += 100
  await postKarmaEvent({ sessionId: 's1', karmaType: 'neutral', delta: 15, source: 'earn' })
  check('event inside backoff window is queued, not dropped', readKarmaOutbox().length === 2)
  check('pendingKarmaDeltas sums the queue', JSON.stringify(pendingKarmaDeltas('s1')) === JSON.stringify({ good: -40, neutral: 15, bad: 0 }))
  check('a retry was scheduled', timers.length > 0)

  // Back online: drains IN ORDER, re-sending the SAME eventId (idempotent server-side).
  fakeNow += 10_000; sent.length = 0; replies = []
  await flushKarmaOutbox(); fakeNow += 1000
  await flushKarmaOutbox()
  check('drains in order with original eventIds', sent.length === 2 && sent[0].eventId === queuedId && sent[0].delta === -40 && sent[1].delta === 15, sent)
  check('outbox empty after drain', readKarmaOutbox().length === 0)

  // ledger_unavailable (served 200, ok:false): keep it.
  fakeNow += 10_000
  replies = [{ status: 200, body: { ok: false, reason: 'ledger_unavailable' } }]
  await postKarmaEvent({ sessionId: 's1', karmaType: 'bad', delta: 2, source: 'contrition' })
  check('ledger_unavailable keeps the event', readKarmaOutbox().length === 1)

  // Permanent refusal: removed, but COUNTED.
  fakeNow += 10_000
  replies = [{ status: 403, body: { ok: false, reason: 'qsd_envelope_required' } }]
  const before = getKarmaOutboxStats().refused
  await flushKarmaOutbox()
  check('403 refusal is removed and counted', readKarmaOutbox().length === 0 && getKarmaOutboxStats().refused === before + 1)

  // Out-of-bound deltas are never queued (unchanged behaviour).
  fakeNow += 10_000
  await postKarmaEvent({ sessionId: 's1', karmaType: 'good', delta: 5000, source: 'earn' })
  check('out-of-bound delta never enters the outbox', readKarmaOutbox().length === 0)

  const failed = results.filter(r => !r.pass)
  console.log(JSON.stringify({ test: 'karmaLedgerHonesty', passed: results.length - failed.length, total: results.length, failed }, null, 2))
  process.exit(failed.length ? 1 : 0)
}
void main()
