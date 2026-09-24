/**
 * Karma ledger honesty (2026-09-23): chain verifier, durable outbox, spend-aware reconcile.
 * Prints JSON for wheelwright; exits 1 on any failure.
 *   npx tsx src/lib/karmaLedgerHonesty.test.ts
 */
import { karmaRowHash, verifyKarmaChain, verdictCacheFresh, KARMA_GENESIS_HASH, type KarmaLedgerRow } from './karmaLedgerVerify'

// ---- fake browser: clock, storage, timers, fetch (installed BEFORE the sync module loads) ----
let fakeNow = 1_800_000_000_000
Date.now = () => fakeNow
const store = new Map<string, string>()
const g = globalThis as unknown as Record<string, unknown>
let quotaFull = false
g.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { if (quotaFull) throw new Error('QuotaExceededError'); store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size },
}
g.window = globalThis
const timers: (() => void)[] = []
g.setTimeout = ((fn: () => void) => { timers.push(fn); return timers.length }) as unknown
type Reply = { status: number; body: unknown } | 'throw'
let replies: Reply[] = []
const sent: { eventId: string; delta: number; refused?: unknown }[] = []
g.fetch = async (_url: string, init?: { body?: string }) => {
  const b = JSON.parse(init?.body ?? '{}')
  sent.push({ eventId: b.eventId, delta: b.delta, refused: b.refused })
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

// ---- 1b. verify-route cache: never serve a verdict for a head that moved ----
{
  const H = { seq: 6, row_hash: 'aaa' }
  const c = { at: 1000, head: H }
  check('cache: same head, fresh => reuse', verdictCacheFresh(c, { ...H }, 2000, 30_000) === true)
  check('cache: new max seq => recompute', verdictCacheFresh(c, { seq: 7, row_hash: 'bbb' }, 2000, 30_000) === false)
  check('cache: same seq, rewritten head hash => recompute', verdictCacheFresh(c, { seq: 6, row_hash: 'zzz' }, 2000, 30_000) === false)
  check('cache: stale => recompute', verdictCacheFresh(c, { ...H }, 1000 + 30_001, 30_000) === false)
  check('cache: none yet => compute', verdictCacheFresh(null, H, 2000, 30_000) === false)
  check('cache: ledger emptied => recompute', verdictCacheFresh(c, null, 2000, 30_000) === false)
}

// ---- 2. reconcile + 3. outbox (dynamic import so the fakes above are in place) ----
async function main() {
  const { reconcile, postKarmaEvent, flushKarmaOutbox, readKarmaOutbox, pendingKarmaDeltas, getKarmaOutboxStats,
    karmaSyncStatus, KARMA_REFUSED_TTL_MS, KARMA_REFUSED_MAX } = await import('./karmaServerSync')

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
  check('wallet status: offline after a failed send, 1 pending', karmaSyncStatus().online === false && karmaSyncStatus().pending === 1, karmaSyncStatus())
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
  check('wallet status: online after an acknowledged send, 0 pending', karmaSyncStatus().online === true && karmaSyncStatus().pending === 0, karmaSyncStatus())

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

  // Codex #2: a REFUSED SPEND must not be refunded, and must not be re-sent.
  fakeNow += 10_000
  replies = [{ status: 403, body: { ok: false, reason: 'qsd_envelope_required' } }]
  await postKarmaEvent({ sessionId: 's2', karmaType: 'good', delta: -20, source: 'spend' })
  check('refused spend is not resent', readKarmaOutbox().length === 0)
  check('refused spend still counts as pending', pendingKarmaDeltas('s2').good === -20, pendingKarmaDeltas('s2'))
  check('refused spend is visible in stats', getKarmaOutboxStats().refusedSpends === 1)
  const afterRefusal = reconcile({ good: 30, neutral: 0, bad: 0 }, { good: 50, neutral: 0, bad: 0 }, pendingKarmaDeltas('s2'))
  check('refused spend is NOT refunded by reconcile', afterRefusal.good === 30, afterRefusal)
  fakeNow += 10_000; sent.length = 0
  await flushKarmaOutbox()
  check('nothing is sent for a refused spend on the next flush', sent.length === 0, sent)
  check('wallet status: a refused spend is not "pending", but is surfaced', karmaSyncStatus().pending === 0 && karmaSyncStatus().refusedSpends === 1, karmaSyncStatus())

  // Only KNOWN app refusals are permanent. Anything else is transient: keep + back off.
  fakeNow += 10_000
  replies = [{ status: 401, body: { ok: false } }]
  await postKarmaEvent({ sessionId: 's6', karmaType: 'good', delta: -5, source: 'spend' })
  const transientOk = () => readKarmaOutbox().some((e) => e.sessionId === 's6') && pendingKarmaDeltas('s6').good === -5 &&
    getKarmaOutboxStats().refusedSpends === 1
  check('401 is transient: spend stays queued, not refused', transientOk(), readKarmaOutbox())
  check('wallet status: 401 reads as not online', karmaSyncStatus().online === false)
  for (const r of [
    { status: 403, body: { ok: false, reason: 'blocked_by_proxy' } },
    { status: 404, body: 'not json' },
    { status: 400, body: { ok: false } },
  ]) {
    fakeNow += 10_000; sent.length = 0
    replies = [r.body === 'not json' ? { status: 404, body: undefined } : r]
    await flushKarmaOutbox()
    check(`${r.status} ${JSON.stringify(r.body)} is transient: sent, still queued`, sent.length === 1 && transientOk(), readKarmaOutbox())
  }
  fakeNow += 10_000; replies = []
  await flushKarmaOutbox()
  check('transient spend is acknowledged once the server accepts it', !readKarmaOutbox().some((e) => e.sessionId === 's6'))

  // A known refusal on a spend: kept, stamped refusedAt.
  fakeNow += 10_000
  replies = [{ status: 400, body: { ok: false, reason: 'invalid_delta' } }]
  await postKarmaEvent({ sessionId: 's7', karmaType: 'good', delta: -9, source: 'spend' })
  const s7At = fakeNow
  const s7Key = [...store.keys()].find((k) => k.startsWith('bobr_karma_ob1:') && JSON.parse(store.get(k)!).sessionId === 's7')
  const s7Rec = s7Key ? JSON.parse(store.get(s7Key)!) : null
  check('400 invalid_delta on a spend: kept as refused with refusedAt', s7Rec?.refused === true && s7Rec?.refusedAt === s7At && pendingKarmaDeltas('s7').good === -9, s7Rec)

  // Refused spends EXPIRE after 7 days: the queued event and its key go, the DEBIT stays.
  const expiredBefore = getKarmaOutboxStats().refusedExpired
  fakeNow = s7At + KARMA_REFUSED_TTL_MS - 1
  check('refused spend still pending just before 7 days', pendingKarmaDeltas('s7').good === -9)
  check('the older refused spend (s2) expired but its debit is kept', pendingKarmaDeltas('s2').good === -20, pendingKarmaDeltas('s2'))
  const afterExpiry = reconcile({ good: 30, neutral: 0, bad: 0 }, { good: 50, neutral: 0, bad: 0 }, pendingKarmaDeltas('s2'))
  check('an EXPIRED refused spend is still NOT refunded by reconcile (Codex r3)', afterExpiry.good === 30, afterExpiry)
  fakeNow = s7At + KARMA_REFUSED_TTL_MS
  check('refused spend debit still counted at 7 days', pendingKarmaDeltas('s7').good === -9, pendingKarmaDeltas('s7'))
  check('the debit is counted once, not per read', pendingKarmaDeltas('s7').good === -9 && pendingKarmaDeltas('s7').good === -9)
  check('expired refused spend key is deleted', !!s7Key && !store.has(s7Key))
  check('expiries are counted', getKarmaOutboxStats().refusedExpired === expiredBefore + 2, getKarmaOutboxStats())
  check('no refused spends left', getKarmaOutboxStats().refusedSpends === 0)

  // Refused spends are CAPPED: oldest dropped (and counted) past KARMA_REFUSED_MAX.
  const expiredBeforeCap = getKarmaOutboxStats().refusedExpired
  let firstCapKey: string | undefined
  for (let i = 0; i < KARMA_REFUSED_MAX + 1; i++) {
    fakeNow += 10_000
    replies = [{ status: 403, body: { ok: false, reason: 'qsd_envelope_required' } }]
    await postKarmaEvent({ sessionId: 's8', karmaType: 'good', delta: -1, source: 'spend' })
    if (i === 0) firstCapKey = [...store.keys()].find((k) => k.startsWith('bobr_karma_ob1:') && JSON.parse(store.get(k)!).sessionId === 's8')
  }
  const capStats = getKarmaOutboxStats()
  check(`refused spends capped at ${KARMA_REFUSED_MAX}`, capStats.refusedSpends === KARMA_REFUSED_MAX && pendingKarmaDeltas('s8').good === -(KARMA_REFUSED_MAX + 1), { capStats, s8: pendingKarmaDeltas('s8') })
  check('the OLDEST refused spend is the one dropped', !!firstCapKey && !store.has(firstCapKey))
  check('cap drop is counted', capStats.refusedExpired === expiredBeforeCap + 1, capStats)

  // Counts come from per-occurrence keys, never a shared read-modify-write counter.
  check('no shared stats counter key exists', !store.has('bobr_karma_outbox_stats_v1') &&
    ![...store.keys()].some((k) => k.includes('stats')), [...store.keys()].filter((k) => !k.startsWith('bobr_karma_ob1:')))
  const refusedKeys = [...store.keys()].filter((k) => k.startsWith('bobr_karma_obx1:refused:'))
  check('refusal count = number of per-event refusal keys', refusedKeys.length === capStats.refused && capStats.refused >= KARMA_REFUSED_MAX + 1, { keys: refusedKeys.length, capStats })
  // Another tab records its own refusal: its key adds to our count, nothing is overwritten.
  store.set('bobr_karma_obx1:refused:evt_other_tab', String(fakeNow))
  check('another tab\'s refusal adds, never clobbers', getKarmaOutboxStats().refused === capStats.refused + 1)

  // Codex #1: concurrent enqueues in ONE realm (two in-flight posts) — neither may be lost.
  // Cross-tab safety rests on one storage key per event (checked below), not on this.
  fakeNow += 10_000
  replies = ['throw', 'throw']
  await Promise.all([
    postKarmaEvent({ sessionId: 's3', karmaType: 'good', delta: -7, source: 'spend' }),
    postKarmaEvent({ sessionId: 's3', karmaType: 'neutral', delta: 9, source: 'earn' }),
  ])
  check('concurrent enqueue in one realm: both events survive', readKarmaOutbox().filter((e) => e.sessionId === 's3').length === 2)
  const obKeys = [...store.keys()].filter((k) => k.startsWith('bobr_karma_ob1:'))
  check('each queued event has its own storage key', obKeys.length === readKarmaOutbox().length + getKarmaOutboxStats().refusedSpends, obKeys)

  // Codex #3: storage full — the event is held in memory for THIS session only (lost
  // on reload, not durable), and the outbox reports degraded so the wallet says so.
  fakeNow += 10_000
  quotaFull = true
  replies = ['throw']
  await postKarmaEvent({ sessionId: 's4', karmaType: 'good', delta: -3, source: 'spend' })
  check('quota-full spend held in memory this session (not durable across reload)', readKarmaOutbox().some((e) => e.sessionId === 's4'))
  check('quota-full spend counts as pending', pendingKarmaDeltas('s4').good === -3)
  check('outbox reports degraded durability', getKarmaOutboxStats().degraded === true)
  check('wallet status surfaces degraded', karmaSyncStatus().degraded === true)
  quotaFull = false

  // Out-of-bound deltas are never queued (unchanged behaviour).
  fakeNow += 10_000
  const before5000 = readKarmaOutbox().length
  await postKarmaEvent({ sessionId: 's1', karmaType: 'good', delta: 5000, source: 'earn' })
  check('out-of-bound delta never enters the outbox', readKarmaOutbox().length === before5000)

  const failed = results.filter(r => !r.pass)
  console.log(JSON.stringify({ test: 'karmaLedgerHonesty', passed: results.length - failed.length, total: results.length, failed }, null, 2))
  process.exit(failed.length ? 1 : 0)
}
void main()
