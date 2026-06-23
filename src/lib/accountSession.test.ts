/**
 * Fail-closed-secret regression for the account session token (accountSession.ts).
 *
 * Grok PR #35 HIGH finding: getSecret() fell back to a literal dev string when no
 * MARKER_SESSION_SECRET / BOBR_SERVER_SECRET was set, so account cookies were
 * FORGEABLE by anyone who reads the source. The fixes pinned here:
 *
 *   1. fail-closed       — in production, signing/verifying with the dev fallback
 *                          throws a clear fatal error (never silently forgeable).
 *   2. dev-secret reject — a cookie minted with the dev fallback is REJECTED once a
 *                          real secret is configured (the core forgery property).
 *
 * Zero-dependency, self-contained harness runnable with the bundled tsx:
 *
 *   node_modules/.bin/tsx src/lib/accountSession.test.ts
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import crypto from 'crypto'

const DEV_FALLBACK_SECRET = 'bobr-dev-marker-secret-do-not-use-in-prod'
const REAL_SECRET = 'real-prod-secret-XYZ-9000'

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

// Mint an account token exactly the way issueAccountToken does, but with an attacker's
// choice of secret. Models a cookie forged with the leaked/known dev fallback secret.
function forgeAccountToken(accountId: string, secret: string): string {
  const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
  const expires = Date.now() + TOKEN_TTL_MS
  const body = Buffer.from(`${accountId}.${expires}`).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

async function main() {
  // The module reads getSecret() at call time, so we drive behaviour purely via env.
  const { issueAccountToken, verifyAccountToken } = await import('./accountSession')

  // --- Honest round-trip under a real secret is the control ---
  console.log('account-session — honest round-trip under a real secret')
  {
    delete process.env.NODE_ENV
    process.env.MARKER_SESSION_SECRET = REAL_SECRET
    delete process.env.BOBR_SERVER_SECRET
    const t = issueAccountToken('acct_honest')
    ok(verifyAccountToken(t) === 'acct_honest', 'token signed and verified with the real secret round-trips')
  }

  // --- THE CORE PROPERTY: a cookie forged with the dev secret is rejected when a
  //     real secret is configured. ---
  console.log('account-session — dev-secret-signed cookie is rejected under a real secret (control)')
  {
    process.env.MARKER_SESSION_SECRET = REAL_SECRET
    const forged = forgeAccountToken('acct_victim', DEV_FALLBACK_SECRET)
    ok(verifyAccountToken(forged) === null, 'cookie signed with the dev fallback secret is REJECTED')

    // Sanity: that same forged token WOULD verify if the server were (wrongly) on the
    // dev secret — proving the rejection above is due to the secret mismatch, not a
    // structurally-broken token.
    delete process.env.MARKER_SESSION_SECRET
    delete process.env.BOBR_SERVER_SECRET
    process.env.NODE_ENV = 'development'
    ok(
      verifyAccountToken(forged) === 'acct_victim',
      'control: the forged token DOES verify under the dev secret in dev (mismatch is the cause)',
    )
  }

  // --- FAIL-CLOSED: production with no real secret must throw, never silently sign. ---
  console.log('account-session — production with no real secret fails closed (throws)')
  {
    delete process.env.MARKER_SESSION_SECRET
    delete process.env.BOBR_SERVER_SECRET
    process.env.NODE_ENV = 'production'
    let threwOnIssue = false
    try {
      issueAccountToken('acct_prod')
    } catch {
      threwOnIssue = true
    }
    ok(threwOnIssue, 'issueAccountToken throws in prod when no real secret is set')

    let threwOnVerify = false
    try {
      verifyAccountToken('anything.anything')
    } catch {
      threwOnVerify = true
    }
    ok(threwOnVerify, 'verifyAccountToken throws in prod when no real secret is set')
  }

  // --- In production WITH a real secret, normal operation resumes (no over-strict throw). ---
  console.log('account-session — production WITH a real secret operates normally')
  {
    process.env.NODE_ENV = 'production'
    process.env.MARKER_SESSION_SECRET = REAL_SECRET
    const t = issueAccountToken('acct_prod_ok')
    ok(verifyAccountToken(t) === 'acct_prod_ok', 'prod with a real secret signs + verifies normally')
  }

  console.log('')
  console.log(`accountSession fail-closed-secret: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
