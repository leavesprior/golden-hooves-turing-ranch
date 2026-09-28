/**
 * Tier 1 migration race (council 2026-09-28, Grok FIX-SOON 1): a returning player
 * has a LEGACY client-minted karma id, a pending spend in the outbox, and an old
 * server fold higher than the local balance. Reading the legacy id while an
 * un-awaited flush moved the spend to the new server session refunded the spend
 * through reconcile's max(). syncKarmaBalance settles the session first.
 *   npx tsx src/lib/karmaMigrationRace.test.ts
 */
let fakeNow = 1_800_000_000_000
Date.now = () => fakeNow
const store = new Map<string, string>()
const g = globalThis as unknown as Record<string, unknown>
g.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size },
}
g.window = globalThis
g.setTimeout = (() => 0) as unknown

// Route-aware fake server: the legacy id has an OLD fold of 50 good; the new
// server session has nothing yet. Events are accepted.
const LEGACY = 'karma_1700000000000_legacy'
let online = true
g.fetch = async (url: string, init?: { body?: string }) => {
  const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
  if (!online) throw new Error('offline')
  if (url.startsWith('/api/karma/session')) return reply(200, { ok: true, sessionId: 'karma_srv_new', token: 'tok' })
  if (url.startsWith('/api/karma/event')) { JSON.parse(init?.body ?? '{}'); return reply(200, { ok: true, balance: { good: 0, neutral: 0, bad: 0 } }) }
  if (url.startsWith('/api/karma/balance')) {
    const id = new URL(url, 'http://x').searchParams.get('sessionId')
    return reply(200, { ok: true, balance: id === LEGACY ? { good: 50, neutral: 0, bad: 0 } : { good: 0, neutral: 0, bad: 0 } })
  }
  return reply(404, {})
}

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })
const tick = () => new Promise((r) => setImmediate(r))

async function seed(mod: typeof import('./karmaServerSync')) {
  store.clear()
  store.set('bobr_karma_session_id', LEGACY) // legacy id, NO token
  online = false
  await mod.postKarmaEvent({ sessionId: LEGACY, karmaType: 'good', delta: -20, source: 'spend' }) // queued
  online = true
  fakeNow += 60_000
}

async function main() {
  const mod = await import('./karmaServerSync')
  const LOCAL = { good: 30, neutral: 0, bad: 0 } // the player already spent 20 of 50 locally

  // Negative control: the OLD wallet sequence refunds the spend.
  await seed(mod)
  check('seed: the spend is pending under the legacy id', mod.pendingKarmaDeltas(LEGACY).good === -20)
  const legacyId = mod.getKarmaSessionId()
  void mod.flushKarmaOutbox()
  await tick(); await tick(); await tick()
  const oldRes = await mod.fetchServerBalance(legacyId)
  const oldResult = mod.reconcile(LOCAL, oldRes.balance!, mod.pendingKarmaDeltas(legacyId))
  check('control: the old sequence REFUNDS the spend (bug reproduced)', oldResult.good === 50, oldResult)

  // Fixed: syncKarmaBalance reads the settled server session.
  await seed(mod)
  const synced = await mod.syncKarmaBalance()
  check('sync reached the server', synced !== null)
  const fixed = mod.reconcile(LOCAL, synced!.server, synced!.pending)
  check('fixed: no refund, local balance stands', fixed.good === 30, fixed)
  check('fixed: the session is now the server-minted one', store.get('bobr_karma_session_id') === 'karma_srv_new')

  // Offline: no sync, the caller keeps its local balance.
  await seed(mod)
  online = false
  check('offline: sync returns null (caller keeps local)', (await mod.syncKarmaBalance()) === null)

  const failed = results.filter((r) => !r.pass)
  console.log(JSON.stringify({ test: 'karmaMigrationRace', passed: results.length - failed.length, total: results.length, failed }, null, 2))
  process.exit(failed.length ? 1 : 0)
}
void main()
