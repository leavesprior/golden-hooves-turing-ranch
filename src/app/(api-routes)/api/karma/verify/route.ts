import { NextRequest, NextResponse } from 'next/server';
import { dbVerifyKarmaLedger } from '@/lib/discountCodesDb';
import { rateLimitOk, clientIpFrom } from '@/lib/markerSession';

export const runtime = 'nodejs';

// Read-only re-walk of the karma hash chain (2026-09-23). Gives the chain a
// reader: a Wheelwright canary or an outside witness can poll this and record
// `head`, which is what makes a truncated tail detectable at all.
// A ledger that cannot be opened reports `unmeasured`, never `intact`.
export async function GET(req: NextRequest) {
  if (!rateLimitOk(clientIpFrom(req.headers))) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }
  try {
    const verdict = dbVerifyKarmaLedger();
    return NextResponse.json(
      { ok: verdict.status !== 'broken', ...verdict, checkedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('karma verify: ledger unavailable:', err);
    return NextResponse.json(
      { ok: false, status: 'unmeasured', reason: 'ledger_unavailable', _conf: -1 },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
