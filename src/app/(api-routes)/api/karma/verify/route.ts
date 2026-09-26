import { NextRequest, NextResponse } from 'next/server';
import { dbVerifyKarmaLedger, dbKarmaLedgerHead } from '@/lib/discountCodesDb';
import { rateLimitOk, clientIpFrom } from '@/lib/markerSession';
import { verdictCacheFresh, type KarmaChainVerdict, type KarmaLedgerHead } from '@/lib/karmaLedgerVerify';

export const runtime = 'nodejs';

// Read-only re-walk of the karma hash chain (2026-09-23). Gives the chain a
// reader: a Wheelwright canary or an outside witness can poll this and record
// `head`, which is what makes a truncated tail detectable at all.
// `ok` is true ONLY for `intact` — an empty ledger verified nothing.
// A ledger that cannot be opened reports `unmeasured`, never `intact`.
// The walk is a full-table scan, so the verdict is cached per process for 30s —
// but only while the ledger head (max seq + head row_hash, one cheap row read) is
// unchanged, so a new or rewritten head row is never hidden behind the cache.
// Rate-limited per client IP (shared bucket with the gameplay routes).
const CACHE_MS = 30_000;
let cached: { at: number; head: KarmaLedgerHead | null; verdict: KarmaChainVerdict; checkedAt: string } | null = null;

export async function GET(req: NextRequest) {
  if (!rateLimitOk(clientIpFrom(req.headers))) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }
  try {
    const head = dbKarmaLedgerHead();
    if (!verdictCacheFresh(cached, head, Date.now(), CACHE_MS)) {
      cached = { at: Date.now(), head, verdict: dbVerifyKarmaLedger(), checkedAt: new Date().toISOString() };
    }
    const c = cached!;
    return NextResponse.json(
      { ok: c.verdict.status === 'intact', ...c.verdict, checkedAt: c.checkedAt },
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
