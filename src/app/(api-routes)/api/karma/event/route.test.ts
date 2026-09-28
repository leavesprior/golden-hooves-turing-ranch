/**
 * Attack tests for POST /api/karma/event (bench, 2026-09-28).
 * In-process: calls the route handlers directly against a throwaway SQLite DB
 * (same opt-in as karmaLedgerDb.test.ts). Never touches a live or dev server.
 *
 *   npx tsx "src/app/(api-routes)/api/karma/event/route.test.ts"
 *   EXPECT_TIER=1 npx tsx ...   # expectations for Tier 1 (token only)
 *
 * Default expectation is Tier 2 (token + server-priced items).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { NextRequest } from 'next/server'

const TIER = Number(process.env.EXPECT_TIER ?? '2')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'karma-auth-test-'))
process.env.BOBR_ALLOW_TEST_DB = '1'
process.env.BOBR_DB_PATH_FOR_TESTS = path.join(dir, 'ledger.db')
process.env.MARKER_SESSION_SECRET = 'test-only-karma-auth-secret-0123456789abcdef'

type Handler = (req: NextRequest) => Promise<Response>

let ipSeq = 0
function req(url: string, init?: { method?: string; body?: unknown }): NextRequest {
  // Distinct IP per request so the per-IP rate limiter never masquerades as a refusal.
  ipSeq += 1
  return new NextRequest(`http://localhost${url}`, {
    method: init?.method ?? 'GET',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${ipSeq >> 8}.${ipSeq & 255}` },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  })
}

const results: { name: string; pass: boolean; observed: string }[] = []
function record(name: string, pass: boolean, observed: string) {
  results.push({ name, pass, observed })
}

async function main() {
  const { POST: eventPOST } = (await import('./route')) as { POST: Handler }
  const { dbVerifyKarmaLedger, dbGetKarmaBalance } = await import('@/lib/discountCodesDb')
  let sessionPOST: Handler | null = null
  try {
    sessionPOST = ((await import('../session/route')) as { POST: Handler }).POST
  } catch {
    sessionPOST = null // origin/main has no issuance route
  }

  const rows = () => { const v = dbVerifyKarmaLedger(); return v.status === 'empty' ? 0 : v.rows }
  let evt = 0
  const nextEventId = () => `evt_${Date.now()}_t${++evt}`

  async function mint(claimed?: string): Promise<{ sessionId: string; token: string } | null> {
    if (!sessionPOST) return null
    const res = await sessionPOST(req('/api/karma/session', { method: 'POST', body: claimed ? { sessionId: claimed } : {} }))
    const j = await res.json() as { ok?: boolean; sessionId?: string; token?: string }
    return j.ok && j.sessionId && j.token ? { sessionId: j.sessionId, token: j.token } : null
  }
  async function post(body: Record<string, unknown>) {
    const before = rows()
    const res = await eventPOST(req('/api/karma/event', { method: 'POST', body }))
    const j = await res.json() as { ok?: boolean; reason?: string }
    return { status: res.status, ok: j.ok === true, reason: j.reason ?? '', appended: rows() - before }
  }
  const show = (r: { status: number; ok: boolean; reason: string; appended: number }) =>
    `status=${r.status} ok=${r.ok} reason=${r.reason || '-'} rowsAppended=${r.appended}`
  const refusedNoAppend = (r: { status: number; ok: boolean; appended: number }) =>
    !r.ok && r.appended === 0 && (r.status === 401 || r.status === 403 || r.status === 400)

  const victim = `karma_${Date.now()}_victim`
  const attacker = await mint()
  const holderA = await mint()
  const holderB = await mint()

  // 0. Issuance cannot be pointed at someone else's session id.
  if (sessionPOST) {
    const m = await mint(victim)
    record('0 issuance for a chosen/foreign sessionId is not honoured', !!m && m.sessionId !== victim,
      `returned sessionId ${m ? (m.sessionId === victim ? 'EQUALS victim' : 'is fresh server id') : 'none'}`)
  } else {
    record('0 issuance for a chosen/foreign sessionId is not honoured', false, 'no issuance route on this tree')
  }

  // 1. Forged/guessed sessionId with no token.
  {
    const balBefore = dbGetKarmaBalance(victim)
    const r = await post({ sessionId: victim, eventId: nextEventId(), karmaType: 'good', delta: 1000, source: 'earn' })
    const balAfter = dbGetKarmaBalance(victim)
    const unchanged = JSON.stringify(balBefore) === JSON.stringify(balAfter)
    record('1 forged sessionId without token -> refused, ledger unchanged', refusedNoAppend(r) && unchanged,
      `${show(r)} victimGood ${balBefore.good}->${balAfter.good}`)
  }

  // 2. Token for session A used to write session B.
  {
    const target = holderB?.sessionId ?? `karma_${Date.now()}_b`
    const r = await post({ sessionId: target, token: holderA?.token ?? 'no-token-on-this-tree',
      eventId: nextEventId(), karmaType: 'good', delta: 1000, source: 'earn' })
    record('2 token for A used on session B -> refused', refusedNoAppend(r), show(r))
  }

  // 3. Tampered token: flipped last char (same length -> timingSafeEqual path) and truncated.
  {
    const s = holderA?.sessionId ?? `karma_${Date.now()}_a`
    const t = holderA?.token ?? 'x'.repeat(78)
    const last = t.slice(-1)
    const flipped = t.slice(0, -1) + (last === '0' ? '1' : '0')
    const r1 = await post({ sessionId: s, token: flipped, eventId: nextEventId(), karmaType: 'good', delta: 1000, source: 'earn' })
    const r2 = await post({ sessionId: s, token: t.slice(0, -4), eventId: nextEventId(), karmaType: 'good', delta: 1000, source: 'earn' })
    record('3 tampered token (same-length flip, truncated) -> refused', refusedNoAppend(r1) && refusedNoAppend(r2),
      `flip: ${show(r1)} | truncated: ${show(r2)}`)
  }

  // 4. Valid holder mints for their OWN session with an arbitrary allowed raw delta.
  {
    const s = attacker?.sessionId ?? `karma_${Date.now()}_self`
    const before = dbGetKarmaBalance(s).good
    const r = await post({ sessionId: s, token: attacker?.token, eventId: nextEventId(), karmaType: 'good', delta: 1000, source: 'earn' })
    const after = dbGetKarmaBalance(s).good
    const accepted = r.ok && r.appended === 1 && after - before === 1000
    // Tier 1's known gap: this is ACCEPTED. Tier 2 must refuse it.
    record(`4 holder self-mint with raw delta 1000 -> ${TIER === 2 ? 'refused (Tier 2)' : 'ACCEPTED (Tier 1 known gap)'}`,
      TIER === 2 ? refusedNoAppend(r) && after === before : accepted, `${show(r)} good ${before}->${after}`)
  }

  // 5. Tier 2: itemId is server-priced; raw delta alongside it or alone is refused; unknown item refused.
  if (TIER === 2) {
    const s = holderA?.sessionId ?? `karma_${Date.now()}_t2`, token = holderA?.token
    const before = dbGetKarmaBalance(s)
    const raw = await post({ sessionId: s, token, eventId: nextEventId(), karmaType: 'good', delta: 5, source: 'earn' })
    const both = await post({ sessionId: s, token, eventId: nextEventId(), itemId: 'market:buy_good', delta: 1000 })
    const unknown = await post({ sessionId: s, token, eventId: nextEventId(), itemId: 'market:buy_gold_bar' })
    const good = await post({ sessionId: s, token, eventId: nextEventId(), itemId: 'market:buy_good' })
    const after = dbGetKarmaBalance(s)
    record('5 Tier 2: raw delta refused; itemId+delta refused; unknown item refused; valid item server-priced',
      refusedNoAppend(raw) && refusedNoAppend(both) && refusedNoAppend(unknown) &&
        good.ok && good.appended === 2 && after.good - before.good === 1,
      `raw: ${show(raw)} | item+delta: ${show(both)} | unknown: ${show(unknown)} | valid: ${show(good)} good ${before.good}->${after.good}`)
  } else {
    record('5 Tier 2 item pricing', TIER !== 2, 'not applicable at this tier')
  }

  // 6. Legit flow end-to-end: mint session -> post -> balance GET reflects it.
  {
    const legit = await mint()
    const s = legit?.sessionId ?? `karma_${Date.now()}_legit`
    const body = TIER === 2
      ? { sessionId: s, token: legit?.token, eventId: nextEventId(), itemId: 'market:buy_good' }
      : { sessionId: s, token: legit?.token, eventId: nextEventId(), karmaType: 'good', delta: 1, source: 'earn' }
    const r = await post(body)
    const { GET: balanceGET } = (await import('../balance/route')) as { GET: Handler }
    const b = await (await balanceGET(req(`/api/karma/balance?sessionId=${encodeURIComponent(s)}`))).json() as { balance?: { good: number } }
    // Replay of the same eventId is idempotent.
    const replay = await post(body)
    record('6 legit flow: session -> event -> balance shows +1 good; replay is a no-op',
      r.ok && b.balance?.good === 1 && replay.appended === 0, `${show(r)} balanceGood=${b.balance?.good} replayAppended=${replay.appended}`)
  }

  // R. Residual (Tier 2, informational): server has no affordability check, so a
  // fresh session with 0 neutral can still buy good karma (neutral clamps at 0).
  const fresh = TIER === 2 ? await mint() : null
  if (fresh) {
    const r = await post({ sessionId: fresh.sessionId, token: fresh.token, eventId: nextEventId(), itemId: 'market:buy_good' })
    const b = dbGetKarmaBalance(fresh.sessionId)
    console.log(`INFO residual gap (not a pass/fail): 0-neutral buy -> ${show(r)} balance=${JSON.stringify(b)}`)
  }

  const verdict = dbVerifyKarmaLedger()
  console.log(`INFO ledger chain after run: status=${verdict.status}`)
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}\n      ${r.observed}`)
  fs.rmSync(dir, { recursive: true, force: true })
  const failed = results.filter((r) => !r.pass).length
  console.log(`\nEXPECT_TIER=${TIER}: ${results.length - failed}/${results.length} pass`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
