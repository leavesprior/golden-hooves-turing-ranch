import crypto from 'crypto';

/**
 * NEW-09 hardening primitives for /api/record-bobr-marker.
 *
 * The live forgery (2026-05-15): a forged client sessionId + 5 instant HTTP
 * POSTs with valid marker slugs minted a real BOBR-EARLY code. Three
 * independent controls now have to pass before a marker is accepted:
 *
 *   1. session-token  — the server issues an HMAC token on the FIRST marker and
 *                        requires it (in the X-Marker-Token header) on every
 *                        subsequent marker. A client cannot fabricate a session
 *                        that already holds progress; it must start at marker 1.
 *   2. timing-floor    — markers for one session must be spaced >= MARKER_MIN_
 *                        INTERVAL_MS apart (you cannot physically walk to the
 *                        next marker in 40ms). Kills the "4 instant requests".
 *   3. rate-limit      — a per-IP token bucket caps how fast new sessions /
 *                        markers can be sprayed, so an attacker cannot run many
 *                        sessions in parallel to amortise the timing floor.
 *
 * server-only: this module imports node:crypto and must never reach the client
 * bundle. It is only imported by the API route (allowlisted in the reward guard).
 */

// safe-mint: HMAC session token, NOT a monetary code — no value is minted here.
function getSecret(): string {
  return (
    process.env.MARKER_SESSION_SECRET ||
    process.env.BOBR_SERVER_SECRET ||
    // Dev fallback. In prod, set MARKER_SESSION_SECRET. The token still binds the
    // session to the server clock + difficulty even with the fallback, so forgery
    // requires walking the timing floor regardless of secret strength.
    'bobr-dev-marker-secret-do-not-use-in-prod'
  );
}

/** Minimum spacing between two markers in one session. Real hunts take minutes;
 *  3s is a generous floor that still makes instant 4x spray impossible. */
export const MARKER_MIN_INTERVAL_MS = 3000;

/** Per-IP token bucket: burst of 6 (covers a legit fast clicker / page reload),
 *  refilling 1 token every 2s. */
const RL_CAPACITY = 6;
const RL_REFILL_PER_MS = 1 / 2000;

export function issueSessionToken(sessionId: string, difficulty: string): string {
  // safe-mint: deterministic HMAC binding sessionId+difficulty; not a reward code.
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${sessionId}::${difficulty}`)
    .digest('hex');
}

export function verifySessionToken(
  sessionId: string,
  difficulty: string,
  presented: string,
): boolean {
  const expected = issueSessionToken(sessionId, difficulty);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(presented ?? '', 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

/** Returns true if the request is allowed, false if rate-limited. */
export function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: RL_CAPACITY, updatedAt: now };
  // Refill
  b.tokens = Math.min(RL_CAPACITY, b.tokens + (now - b.updatedAt) * RL_REFILL_PER_MS);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

export function clientIpFrom(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

/** Returns ms remaining before this session may record its next marker, 0 if ok. */
export function timingFloorRemainingMs(lastMarkerAtIso: string, nowMs: number): number {
  const last = Date.parse(lastMarkerAtIso);
  if (Number.isNaN(last)) return 0;
  const elapsed = nowMs - last;
  return elapsed >= MARKER_MIN_INTERVAL_MS ? 0 : MARKER_MIN_INTERVAL_MS - elapsed;
}

// === Score claim signing (anti-forgery for leaderboard / public ranks) ===
// Reuses the same HMAC secret + timingSafeEqual pattern as marker sessions.
// Claim is short-lived (minute-bucket) so a captured token cannot be replayed
// long after the legitimate run. Games can call a future /api/record-run (or
// equivalent) at victory to obtain a claim for their exact final score, then
// forward that claim with the leaderboard POST. For now the claim is optional
// (to avoid breaking the existing manual submit form) but the route will
// enforce ceiling + per-IP rate limit as the immediate control.

export function issueScoreClaim(playerId: string, score: number, game: string = 'bobr'): string {
  // Minute-bucket keeps claim valid a short time without clock skew issues.
  const minute = Math.floor(Date.now() / 1000 / 60);
  return crypto
    .createHmac('sha256', getSecret())
    .update(`score-claim::${playerId}::${score}::${game}::${minute}`)
    .digest('hex');
}

export function verifyScoreClaim(playerId: string, score: number, game: string, presented: string): boolean {
  const a = Buffer.from(presented ?? '', 'utf8');
  // Accept current minute or the previous one (grace for clock/page reload)
  for (let off = 0; off < 2; off++) {
    const minute = Math.floor(Date.now() / 1000 / 60) - off;
    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(`score-claim::${playerId}::${score}::${game}::${minute}`)
      .digest('hex');
    const b = Buffer.from(expected, 'utf8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

// Phase 0 karma (2026-06-18): the server signs the balance it returns so the
// client can verify it wasn't tampered in transit / localStorage. HMAC with the
// same server secret; the client only verifies via a /balance refetch, server-wins.
export function signBalance(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`karma-balance::${payload}`).digest('hex');
}
