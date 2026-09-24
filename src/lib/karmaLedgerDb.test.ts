/**
 * Karma ledger against REAL SQLite (2026-09-23): writer/verifier agreement,
 * idempotent replay, tamper detection, and no chain fork when two server
 * processes append at once. Uses a throwaway DB file, never the dev DB.
 *   npx tsx src/lib/karmaLedgerDb.test.ts
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

async function main() {
const role = process.argv[2]
if (role === 'writer') {
  // Child: append N events tagged with its own prefix, as fast as it can.
  const { dbAppendKarmaEvent } = await import('./discountCodesDb')
  const tag = process.argv[3]
  for (let i = 0; i < 60; i++) {
    dbAppendKarmaEvent({ eventId: `${tag}_${i}`, sessionId: `s_${tag}`, karmaType: 'good', delta: 1, source: 'earn' })
  }
  process.exit(0)
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'karma-ledger-test-'))
// Opt in to the test DB override; children inherit this env (spawn below).
process.env.BOBR_ALLOW_TEST_DB = '1'
process.env.BOBR_DB_PATH_FOR_TESTS = path.join(dir, 'ledger.db')
const { dbAppendKarmaEvent, dbVerifyKarmaLedger, dbKarmaLedgerHead, testDbPathOverride } = await import('./discountCodesDb')
const Database = (await import('better-sqlite3')).default

// The override must never reach a Railway deploy, and needs an explicit opt-in.
const P = '/tmp/x.db'
check('override: NODE_ENV=test honors it', testDbPathOverride({ NODE_ENV: 'test', BOBR_DB_PATH_FOR_TESTS: P } as NodeJS.ProcessEnv) === P)
check('override: BOBR_ALLOW_TEST_DB=1 honors it', testDbPathOverride({ NODE_ENV: 'development', BOBR_ALLOW_TEST_DB: '1', BOBR_DB_PATH_FOR_TESTS: P } as NodeJS.ProcessEnv) === P)
check('override: no opt-in => ignored', testDbPathOverride({ NODE_ENV: 'development', BOBR_DB_PATH_FOR_TESTS: P } as NodeJS.ProcessEnv) === null)
check('override: RAILWAY_ENVIRONMENT => ignored even with both opt-ins',
  testDbPathOverride({ NODE_ENV: 'test', BOBR_ALLOW_TEST_DB: '1', RAILWAY_ENVIRONMENT: 'production', BOBR_DB_PATH_FOR_TESTS: P } as NodeJS.ProcessEnv) === null)

check('empty ledger reads EMPTY', dbVerifyKarmaLedger().status === 'empty')
check('empty ledger has no head', dbKarmaLedgerHead() === null)
for (let i = 0; i < 6; i++) dbAppendKarmaEvent({ eventId: `it${i}`, sessionId: 'sX', karmaType: i % 2 ? 'good' : 'bad', delta: i - 2, source: 'spend' })
dbAppendKarmaEvent({ eventId: 'it0', sessionId: 'sX', karmaType: 'good', delta: 999, source: 'replay' })
const v1 = dbVerifyKarmaLedger()
check('writer and verifier agree (6 rows, replay ignored)', v1.status === 'intact' && v1.rows === 6, v1)
const h1 = dbKarmaLedgerHead()
check('head helper = verifier head, seq 6', h1?.seq === 6 && h1?.row_hash === v1.head, h1)

// /api/karma/verify: the 30s cache must not hide a moved head.
const { GET } = await import('../app/(api-routes)/api/karma/verify/route')
const { NextRequest } = await import('next/server')
let ipN = 0
const req = () => new NextRequest('http://t/api/karma/verify', { headers: { 'x-forwarded-for': `10.0.0.${++ipN}` } })
const r1 = await (await GET(req())).json()
check('verify route: intact, 6 rows', r1.ok === true && r1.rows === 6, r1)
dbAppendKarmaEvent({ eventId: 'it_new', sessionId: 'sX', karmaType: 'good', delta: 1, source: 'earn' })
const newHead = dbKarmaLedgerHead()! // seq may skip: AUTOINCREMENT spent one on the ignored replay
const r2 = await (await GET(req())).json()
check('verify route: a new row inside the 30s cache is seen (7 rows)', r2.rows === 7 && r2.head === newHead.row_hash, r2)
{
  const raw0 = new Database(process.env.BOBR_DB_PATH_FOR_TESTS)
  raw0.prepare("UPDATE bobr_karma_ledger SET row_hash = 'forged' WHERE seq = ?").run(newHead.seq)
  raw0.close()
}
const r3 = await (await GET(req())).json()
check('verify route: a rewritten head row inside the 30s cache is caught', r3.ok === false && r3.status === 'broken' && r3.brokenAtSeq === newHead.seq, r3)
{
  const raw0 = new Database(process.env.BOBR_DB_PATH_FOR_TESTS)
  raw0.prepare('DELETE FROM bobr_karma_ledger WHERE seq = ?').run(newHead.seq)
  raw0.close()
}
const statuses: number[] = []
for (let i = 0; i < 12; i++) statuses.push((await GET(new NextRequest('http://t/api/karma/verify', { headers: { 'x-forwarded-for': '10.9.9.9' } }))).status)
check('verify route: rate limited per IP (429 once the bucket is empty)', statuses[0] === 200 && statuses.includes(429), statuses)

// Two processes appending at the same time must not fork the chain.
const tsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx')
const run = (tag: string) => new Promise<number>((resolve) => {
  const c = spawn(tsx, [__filename, 'writer', tag], { env: process.env, stdio: 'inherit' })
  c.on('exit', (code) => resolve(code ?? 1))
})
const codes = await Promise.all([run('A'), run('B')])
check('both writer processes finished cleanly', codes.every((c) => c === 0), codes)
const v2 = dbVerifyKarmaLedger()
check('no fork: 126 rows, chain intact after concurrent writers', v2.status === 'intact' && v2.rows === 126, v2)

const raw = new Database(process.env.BOBR_DB_PATH_FOR_TESTS)
raw.prepare('UPDATE bobr_karma_ledger SET delta = delta + 50 WHERE seq = 3').run()
raw.close()
const v3 = dbVerifyKarmaLedger()
check('tamper caught at its row', v3.status === 'broken' && v3.brokenAtSeq === 3 && v3.reason === 'row_hash', v3)

fs.rmSync(dir, { recursive: true, force: true })
const failed = results.filter((r) => !r.pass)
console.log(JSON.stringify({ test: 'karmaLedgerDb', passed: results.length - failed.length, total: results.length, failed }, null, 2))
process.exit(failed.length ? 1 : 0)
}
void main()
