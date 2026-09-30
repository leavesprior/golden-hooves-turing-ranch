/**
 * Neoma pull relay signature gate (neomaRelay.ts).
 *   R1 a correctly signed request verifies
 *   R2 a wrong signature, a tampered body, or a stale / future timestamp fails
 *   R3 malformed headers fail; with no secret configured nothing verifies
 *
 *   node_modules/.bin/tsx src/lib/neomaRelay.test.ts
 */
import { signRelay, verifyRelay, workerIsLive } from './neomaRelay'

let passed = 0, failed = 0
const check = (name: string, ok: boolean) => { if (ok) { passed++; console.log(`PASS ${name}`) } else { failed++; console.log(`FAIL ${name}`) } }

const secret = 'a'.repeat(64)
process.env.NEOMA_RELAY_SECRET = secret
const now = 1_790_000_000_000
const ts = String(now)
const body = '{"id":"job-1","text":"hello"}'
const sig = signRelay(secret, ts, body)

check('R1 signed request verifies', verifyRelay(ts, sig, body, now))
check('R2 wrong signature fails', !verifyRelay(ts, signRelay('b'.repeat(64), ts, body), body, now))
check('R2 tampered body fails', !verifyRelay(ts, sig, body.replace('hello', 'HELLO'), now))
check('R2 stale timestamp fails', !verifyRelay(ts, sig, body, now + 61_000))
check('R2 future timestamp fails', !verifyRelay(ts, sig, body, now - 61_000))
check('R3 missing headers fail', !verifyRelay(null, null, body, now))
check('R3 non-hex signature fails', !verifyRelay(ts, 'z'.repeat(64), body, now))
process.env.NEOMA_RELAY_SECRET = 'short'
check('R3 too-short secret disables', !verifyRelay(ts, sig, body, now))
delete process.env.NEOMA_RELAY_SECRET
check('R3 no secret disables', !verifyRelay(ts, sig, body, now))
check('R3 no secret: no live worker', !workerIsLive())

console.log(JSON.stringify({ test: 'neomaRelay', passed, total: passed + failed, failed }))
process.exit(failed > 0 ? 1 : 0)
