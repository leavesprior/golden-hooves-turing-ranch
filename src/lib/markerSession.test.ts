/**
 * Forgery-regression for the marker-session reward guard (markerSession.ts).
 *
 * Pins the three NEW-09 controls that closed the live forgery of 2026-05-15
 * (a forged client sessionId + 5 instant POSTs minted a real BOBR-EARLY code):
 *
 *   1. session-token HMAC  — verifySessionToken must reject any token not minted
 *                            by the server secret for THAT (sessionId, difficulty).
 *   2. timing-floor        — a session cannot record two markers inside
 *                            MARKER_MIN_INTERVAL_MS (kills the instant spray).
 *   3. per-IP rate-limit   — a burst beyond capacity from one IP is refused
 *                            (kills parallel-session amortisation of the floor).
 *
 * This is the "regression tapes incl GrantIntent forgery before model path"
 * item from Grok's 2026-06-12 Living-Ranch verdict (path_to_9.5, HIGH concern:
 * dev keys / unsigned grants must never touch real value).
 *
 * No test runner is installed in this project, so this is a zero-dependency
 * self-contained harness runnable with the bundled tsx:
 *
 *   node_modules/.bin/tsx src/lib/markerSession.test.ts
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import crypto from 'crypto'

// Pin a known server secret BEFORE importing the module so getSecret() (read at
// call-time) resolves deterministically and "a different secret" is meaningfully
// different from the fallback.
const SERVER_SECRET = 'test-server-secret-AAA'
process.env.MARKER_SESSION_SECRET = SERVER_SECRET

import {
  issueSessionToken,
  verifySessionToken,
  rateLimitOk,
  timingFloorRemainingMs,
  MARKER_MIN_INTERVAL_MS,
} from './markerSession'

let passed = 0
let failed = 0

function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

// Forge an HMAC token the way the server would, but with the attacker's choice
// of secret — models a leaked/guessed/dev secret that must NOT mint value.
function forgeToken(sessionId: string, difficulty: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${sessionId}::${difficulty}`).digest('hex')
}

console.log('session-token — honest round-trip is the control')
{
  const t = issueSessionToken('sess-1', 'normal')
  ok(verifySessionToken('sess-1', 'normal', t), 'honest token verifies', t.slice(0, 12))
  // Guard against a degenerate verifier that returns true for everything:
  ok(typeof t === 'string' && t.length === 64, 'token is a 32-byte hex HMAC', String(t.length))
}

console.log('session-token — forgery is rejected (control #1)')
{
  // Wrong secret (the "dev key must not touch real value" concern).
  const wrongSecret = forgeToken('sess-1', 'normal', 'attacker-secret-ZZZ')
  ok(!verifySessionToken('sess-1', 'normal', wrongSecret), 'token from a different secret rejected')

  // Right secret but tampered sessionId — cannot replay another session's progress.
  const otherSession = issueSessionToken('sess-2', 'normal')
  ok(!verifySessionToken('sess-1', 'normal', otherSession), 'token bound to a different sessionId rejected')

  // Right secret but tampered difficulty — cannot swap difficulty after the fact.
  const otherDifficulty = issueSessionToken('sess-1', 'hard')
  ok(!verifySessionToken('sess-1', 'normal', otherDifficulty), 'token bound to a different difficulty rejected')

  // Wrong-length / empty / garbage — the original "fabricated sessionId" attack.
  ok(!verifySessionToken('sess-1', 'normal', ''), 'empty token rejected')
  ok(!verifySessionToken('sess-1', 'normal', 'deadbeef'), 'short garbage token rejected')
  ok(!verifySessionToken('sess-1', 'normal', 'f'.repeat(64)), 'right-length wrong-value token rejected')
  // @ts-expect-error — exercise the null-ish guard a forged client could send
  ok(!verifySessionToken('sess-1', 'normal', undefined), 'undefined token rejected (no throw)')
}

console.log('timing-floor — instant second marker is blocked (control #2)')
{
  const now = 1_000_000_000_000
  const justNow = new Date(now).toISOString()
  // The exact 2026-05-15 attack: a second marker 40ms after the first.
  const remaining = timingFloorRemainingMs(justNow, now + 40)
  ok(remaining > 0, 'second marker at +40ms is inside the floor', `${remaining}ms`)
  ok(remaining <= MARKER_MIN_INTERVAL_MS, 'remaining never exceeds the floor', `${remaining}ms`)

  // After the full interval, the next marker is allowed.
  const afterFloor = timingFloorRemainingMs(justNow, now + MARKER_MIN_INTERVAL_MS)
  ok(afterFloor === 0, 'marker after the full interval is allowed')

  // A malformed timestamp must fail OPEN to 0 (never wedge a legit hunt), since
  // the HMAC + rate-limit are the load-bearing controls; the floor is anti-spray.
  ok(timingFloorRemainingMs('not-a-date', now) === 0, 'malformed last-marker time does not wedge the session')
}

console.log('rate-limit — per-IP burst is refused (control #3)')
{
  const ip = '203.0.113.7' // fresh bucket: starts at capacity (6)
  let allowed = 0
  for (let i = 0; i < 6; i++) if (rateLimitOk(ip)) allowed++
  ok(allowed === 6, 'first 6 rapid requests allowed (legit fast clicker / reload)', String(allowed))
  ok(!rateLimitOk(ip), '7th rapid request from same IP refused')

  // Isolation: a different IP has its own bucket and is unaffected.
  ok(rateLimitOk('198.51.100.9'), 'a different IP is not collateral-limited')
}

console.log('')
console.log(`markerSession forgery-regression: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
