import { NextRequest, NextResponse } from 'next/server';
import { verifyAccountToken, ACCOUNT_COOKIE } from '@/lib/accountSession';
import { getAccountById } from '@/lib/accountsDb';

export const runtime = 'nodejs';

// Who am I? Resolves the account from the httpOnly cookie. Returns email + accountId for
// a signed-in user, or { ok:true, signedIn:false } for a guest. Never returns the hash.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCOUNT_COOKIE)?.value;
  const accountId = verifyAccountToken(token);
  if (!accountId) {
    return NextResponse.json({ ok: true, signedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const account = getAccountById(accountId);
  if (!account) {
    return NextResponse.json({ ok: true, signedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(
    { ok: true, signedIn: true, accountId: account.id, email: account.email, entropySource: account.entropy_source },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
