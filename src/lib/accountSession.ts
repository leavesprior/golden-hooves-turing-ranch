// Account session token — a signed, opaque token proving "this browser is account X".
// HMAC-based (same secret family as markerSession), with an expiry. Set as an httpOnly
// cookie by the auth routes. This is a session proof, NOT a credential — it never
// contains the secret.

import crypto from 'crypto';

function getSecret(): string {
  return (
    process.env.MARKER_SESSION_SECRET ||
    process.env.BOBR_SERVER_SECRET ||
    'bobr-dev-marker-secret-do-not-use-in-prod'
  );
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
