import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitOk, clientIpFrom, issueKarmaSessionToken } from '@/lib/markerSession';

export const runtime = 'nodejs';

// Bench (2026-09-28): the server mints the karma sessionId AND its HMAC token.
// Any sessionId the client sends is ignored — a token is never issued for an id
// the caller chose, so holding a token proves the server created that session.
export async function POST(req: NextRequest) {
  if (!rateLimitOk(clientIpFrom(req.headers))) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }
  const sessionId = `karma_${Date.now()}_${crypto.randomBytes(12).toString('base64url')}`;
  return NextResponse.json(
    { ok: true, sessionId, token: issueKarmaSessionToken(sessionId) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
