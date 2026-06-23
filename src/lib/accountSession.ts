// Account session token — a signed, opaque token proving "this browser is account X".
// HMAC-based (same secret family as markerSession), with an expiry. Set as an httpOnly
// cookie by the auth routes. This is a session proof, NOT a credential — it never
// contains the secret.
//
// SCOPE: this file is account-creation + SESSION-MANAGEMENT scaffolding. It proves
// "this browser holds a valid session for account X". It does NOT (yet) authorize any
// action — no route consumes this token to grant a privileged/value-bearing operation.
// "Auth" here = authentication + session management only, NOT authorization.

import crypto from 'crypto';

// Literal dev fallback secret. Cookies signed with this are FORGEABLE by anyone who
// reads the source, so it must NEVER be used in production.
const DEV_FALLBACK_SECRET = 'bobr-dev-marker-secret-do-not-use-in-prod';

// FAIL-CLOSED: in production we refuse to sign or verify any session with the dev
// fallback secret. A real MARKER_SESSION_SECRET (or BOBR_SERVER_SECRET) MUST be set,
// or account sessions are forgeable. The dev fallback is permitted ONLY outside prod.
function getSecret(): string {
  const real = process.env.MARKER_SESSION_SECRET || process.env.BOBR_SERVER_SECRET;
  if (real) return real;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: MARKER_SESSION_SECRET (or BOBR_SERVER_SECRET) is required in production. ' +
        'Refusing to sign/verify account sessions with the forgeable dev fallback secret.',
    );
  }
  return DEV_FALLBACK_SECRET;
}

export const ACCOUNT_COOKIE = 'bobr_account';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Issue token: base64url(accountId.expiresMs).hmac */
export function issueAccountToken(accountId: string): string {
  const expires = Date.now() + TOKEN_TTL_MS;
  const body = Buffer.from(`${accountId}.${expires}`).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** Verify token → accountId, or null if invalid/expired/tampered. Constant-time. */
export function verifyAccountToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const [accountId, expiresStr] = Buffer.from(body, 'base64url').toString().split('.');
    const expires = parseInt(expiresStr, 10);
    if (!accountId || !Number.isFinite(expires) || Date.now() > expires) return null;
    return accountId;
  } catch {
    return null;
  }
}
