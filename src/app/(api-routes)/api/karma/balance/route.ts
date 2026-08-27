import { NextRequest, NextResponse } from 'next/server';
import { dbGetKarmaBalance, dbGetMarkerProgressCount } from '@/lib/discountCodesDb';
import { rateLimitOk, clientIpFrom, signBalance } from '@/lib/markerSession';

export const runtime = 'nodejs';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Phase 0 (2026-06-18): the SERVER-AUTHORITATIVE karma balance. The client reads
// this instead of trusting its own localStorage. Balance = the server fold of the
// karma ledger PLUS a server-derived neutral baseline from the trusted marker
// count (the same server fact the discount mint already re-derives). The response
// is HMAC-signed so tampering is detectable. The client can never set its own
// balance — it can only read this and (on conflict) the server wins.
const NEUTRAL_PER_MARKER = 25;

export async function GET(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '';
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 });
  }

  try {
    const ledger = dbGetKarmaBalance(sessionId);
    // Server-derived neutral from the trusted marker count (read-only; the marker
    // path already validates this). Never accepted from the client.
    const markerCount = dbGetMarkerProgressCount(sessionId);
    const balance = {
      good: ledger.good,
      neutral: ledger.neutral + markerCount * NEUTRAL_PER_MARKER,
      bad: ledger.bad,
    };

    const asOf = new Date().toISOString();
    const payload = `${sessionId}:${balance.good}:${balance.neutral}:${balance.bad}:${asOf}`;
    const sig = signBalance(payload);

    return NextResponse.json(
      { ok: true, sessionId, balance, markerCount, asOf, sig },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    // Native better-sqlite3 can throw after Next HMR. The trail wallet is
    // localStorage-first; the client already fail-softs on !ok. Return JSON so
    // the console does not look like the trail itself broke.
    console.error('karma GET ledger unavailable:', err);
    return NextResponse.json(
      { ok: false, reason: 'ledger_unavailable' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
