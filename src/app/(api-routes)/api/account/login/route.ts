import { NextRequest, NextResponse } from 'next/server';
import { rateLimitOk, clientIpFrom } from '@/lib/markerSession';
import { normalizeEmail, isWellFormedCredential, verifyCredential } from '@/lib/accountCredential';
import { getAccountByEmail, touchLogin, linkSession } from '@/lib/accountsDb';
import { issueAccountToken, ACCOUNT_COOKIE } from '@/lib/accountSession';

export const runtime = 'nodejs';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Sign-in: email + the >=512-bit credential issued at registration. Verified against the
// stored scrypt digest in constant time. On success, links the current guest session to
// the account and sets the account cookie. Generic errors to prevent account enumeration.
export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  let body: { email?: string; credential?: string; sessionId?: string; markerToken?: string; difficulty?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email || !isWellFormedCredential(body.credential)) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (sessionId !== undefined && !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 });
  }

  const account = getAccountByEmail(email);
  // Constant-ish path: still run verify against a dummy if no account, to blunt timing
  // enumeration. (scrypt dominates either way.)
  const storedHash = account?.credential_hash
    ?? 'scrypt$32768$8$1$00000000000000000000000000000000$' + '0'.repeat(128);
  const ok = verifyCredential(body.credential as string, storedHash);

  if (!account || !ok) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 });
  }

  touchLogin(account.id);
  // Anti karma-grafting: only link the guest session with a server-verifiable ownership
  // proof (the markerSession HMAC token). Unproven session ids are not linked.
  if (sessionId && body.markerToken && body.difficulty) {
    linkSession(sessionId, account.id, { markerToken: body.markerToken, difficulty: body.difficulty });
  }

  const token = issueAccountToken(account.id);
  const res = NextResponse.json({ ok: true, email: account.email, accountId: account.id });
  res.cookies.set(ACCOUNT_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
