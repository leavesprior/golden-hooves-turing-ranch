/**
 * Link-abuse (karma-grafting) regression for the accounts DB (accountsDb.ts).
 *
 * Grok PR #35 finding: linkSession bound a CLIENT-supplied sessionId to an account with
 * NO ownership proof — an attacker could graft another player's high-karma session onto
 * their account (or their session onto a victim) straight from the request body.
 *
 * The fix requires a server-verifiable ownership proof: the markerSession HMAC token the
 * server issued for that (sessionId, difficulty). This test pins:
 *
 *   1. verifySessionOwnership accepts ONLY a genuine server-issued marker token.
 *   2. linkSession REFUSES (returns false, writes nothing) without valid proof —
 *      the grafting attack with a forged/absent token is rejected.
 *   3. linkSession SUCCEEDS with a genuine proof (the legit upgrade path still works).
 *
 * Zero-dependency, self-contained harness runnable with the bundled tsx:
 *
 *   node_modules/.bin/tsx src/lib/accountsDb.test.ts
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Pin a known server secret BEFORE importing modules (getSecret() reads at call time).
const SERVER_SECRET = 'test-server-secret-accounts-DDD'
process.env.MARKER_SESSION_SECRET = SERVER_SECRET
// Force the dev/local path (never throw on /data absence) and an isolated DB file.
process.env.NODE_ENV = 'test'

// accountsDb.getDbPath() resolves to /tmp/accounts.db when /data is absent (the local/dev
// path). Start from a CLEAN DB so a stale link from a prior run can't pollute this test.
const TMP_DB = path.join('/tmp', 'accounts.db')
for (const f of [TMP_DB, `${TMP_DB}-wal`, `${TMP_DB}-shm`]) {
  try { fs.rmSync(f, { force: true }) } catch { /* ignore */ }
}

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

// Forge a marker token with an attacker's chosen secret (models a leaked/dev secret).
function forgeMarkerToken(sessionId: string, difficulty: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${sessionId}::${difficulty}`).digest('hex')
}

async function main() {
  const { issueSessionToken } = await import('./markerSession')
  const { hashCredential } = await import('./accountCredential')
  const { verifySessionOwnership, linkSession, getAccountIdForSession, createAccount } =
    await import('./accountsDb')

  // Real account rows (the account_sessions FK references accounts(id)).
  const attackerHash = hashCredential('a'.repeat(128))
  const ownerHash = hashCredential('b'.repeat(128))
  const ATTACKER_ACCT = createAccount({ email: 'attacker@example.com', credentialHash: attackerHash, entropySource: 'csprng' })!
  const OWNER_ACCT = createAccount({ email: 'owner@example.com', credentialHash: ownerHash, entropySource: 'csprng' })!

  const VICTIM_SESSION = 'victim_high_karma_session'
  const DIFFICULTY = 'medium'

  // --- verifySessionOwnership: only a genuine server token passes ---
  console.log('ownership — only a server-issued marker token proves ownership')
  {
    const genuine = issueSessionToken(VICTIM_SESSION, DIFFICULTY)
    ok(
      verifySessionOwnership(VICTIM_SESSION, { markerToken: genuine, difficulty: DIFFICULTY }),
      'genuine server-issued token proves ownership',
    )

    const forged = forgeMarkerToken(VICTIM_SESSION, DIFFICULTY, 'attacker-secret-ZZZ')
    ok(
      !verifySessionOwnership(VICTIM_SESSION, { markerToken: forged, difficulty: DIFFICULTY }),
      'token forged with the wrong secret is rejected',
    )

    // Genuine token but for a DIFFERENT session — cannot graft session A's proof onto B.
    const otherSessionToken = issueSessionToken('attacker_own_session', DIFFICULTY)
    ok(
      !verifySessionOwnership(VICTIM_SESSION, { markerToken: otherSessionToken, difficulty: DIFFICULTY }),
      "another session's genuine token cannot prove THIS session",
    )

    ok(!verifySessionOwnership(VICTIM_SESSION, null), 'missing proof is rejected')
    // @ts-expect-error — exercise the malformed-proof guard a forged client could send
    ok(!verifySessionOwnership(VICTIM_SESSION, { difficulty: DIFFICULTY }), 'proof with no token is rejected')
  }

  // --- linkSession: the grafting attack is refused, the legit upgrade works ---
  console.log('link-abuse — linkSession refuses unproven sessions, accepts proven ones')
  {
    // ATTACK: bind the victim's session to the attacker's account using a FORGED token.
    const forged = forgeMarkerToken(VICTIM_SESSION, DIFFICULTY, 'dev-or-leaked-secret')
    const grafted = linkSession(VICTIM_SESSION, ATTACKER_ACCT, { markerToken: forged, difficulty: DIFFICULTY })
    ok(grafted === false, 'linkSession REFUSES a forged-token graft (returns false)')
    ok(getAccountIdForSession(VICTIM_SESSION) === null, 'no link was written for the grafting attempt')

    // LEGIT: the real owner holds the server-issued token → link succeeds.
    const genuine = issueSessionToken(VICTIM_SESSION, DIFFICULTY)
    const linked = linkSession(VICTIM_SESSION, OWNER_ACCT, { markerToken: genuine, difficulty: DIFFICULTY })
    ok(linked === true, 'linkSession ACCEPTS a genuine server-issued proof (returns true)')
    ok(
      getAccountIdForSession(VICTIM_SESSION) === OWNER_ACCT,
      'the proven session is linked to the real owner',
    )
  }

  console.log('')
  console.log(`accountsDb link-abuse: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

// Clean up the /tmp DB artifact this test created so it never lingers between runs.
process.on('exit', () => {
  for (const f of [TMP_DB, `${TMP_DB}-wal`, `${TMP_DB}-shm`]) {
    try { fs.rmSync(f, { force: true }) } catch { /* ignore */ }
  }
})

main()
