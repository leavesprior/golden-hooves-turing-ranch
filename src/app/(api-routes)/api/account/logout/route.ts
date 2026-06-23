import { NextResponse } from 'next/server';
import { ACCOUNT_COOKIE } from '@/lib/accountSession';

export const runtime = 'nodejs';

// Sign-out: clear the account session cookie. This ends session MANAGEMENT only — there
// is no authorization to revoke (no route grants privileges off this cookie yet). The
// cookie is httpOnly, so the client cannot clear it from JS; this server route does.
function clearCookie(): NextResponse {
  const res = NextResponse.json(
    { ok: true, signedIn: false },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  // Expire the cookie. Mirror the attributes used when it was set so browsers overwrite it.
  res.cookies.set(ACCOUNT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

// POST is the canonical (CSRF-friendlier) method; GET is offered as a convenience so a
// plain link can sign out. Both just clear the cookie.
export async function POST() {
  return clearCookie();
}

export async function GET() {
  return clearCookie();
}
