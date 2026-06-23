import { NextRequest, NextResponse } from 'next/server';
import { rateLimitOk, clientIpFrom } from '@/lib/markerSession';
import {
  generateCredential,
  hashCredential,
  normalizeEmail,
  qsdEntropyEnabled,
} from '@/lib/accountCredential';
import { createAccount, linkSession } from '@/lib/accountsDb';
import { issueAccountToken, ACCOUNT_COOKIE } from '@/lib/accountSession';

export const runtime = 'nodejs';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Sign-up: email + a SERVER-GENERATED >=512-bit credential. The raw secret is returned
// to the user EXACTLY ONCE (recovery-key model) and never stored; the server keeps only
// a scrypt KDF digest. The current guest session is linked to the new account.
//
// QSD entropy: GATED. If ACCOUNT_QSD_ENTROPY_ENABLED=1 and a live QSD seed arrives via
// the Neoma relay (MAJOR/Grok-before), it is MIXED with CSPRNG via HKDF — never sole.
// Until then, credentials are pure CSPRNG (already full-strength).
export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  let body: { email?: string; sessionId?: string; markerToken?: string; difficulty?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ ok: false, reason: 'invalid_email' }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (sessionId !== undefined && !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 });
  }

  // GATED QSD entropy. The seed only ever arrives via the Neoma relay path; in this
  // launch build it is null, so generation is pure CSPRNG. Wired here so enabling the
  // relay later needs no change to the account model.
  const qsdSeed = null; // TODO(gated): populate from Neoma relay when ACCOUNT_QSD_ENTROPY_ENABLED
  const { secretHex, entropySource } = generateCredential(qsdSeed);

  const credentialHash = hashCredential(secretHex);
  const accountId = createAccount({ email, credentialHash, entropySource });
  if (!accountId) {
    // Do not reveal whether email exists beyond a generic conflict (enumeration guard).
    return NextResponse.json({ ok: false, reason: 'email_unavailable' }, { status: 409 });
  }

  // Anti karma-grafting: only link the guest session if the client presents a
  // server-verifiable ownership proof (the markerSession HMAC token for this session).
  // A session that cannot prove ownership is simply not linked — the account is still
  // created; grafting an unproven session id from the request body is refused.
  if (sessionId && body.markerToken && body.difficulty) {
    linkSession(sessionId, accountId, { markerToken: body.markerToken, difficulty: body.difficulty });
  }

  const token = issueAccountToken(accountId);
  const res = NextResponse.json({
    ok: true,
    email,
    // Shown to the user ONCE — this is their key. Tell them to save it; it cannot be recovered.
    credential: secretHex,
    credentialBits: secretHex.length * 4,
    entropySource,           // 'csprng' now; 'csprng+qsd' once the gated relay is live
    qsdEntropyEnabled: qsdEntropyEnabled(),
    note: 'Save this key. It is shown only once and cannot be recovered. The server stores only a hash.',
  });
  res.cookies.set(ACCOUNT_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
