import { NextResponse } from 'next/server';
import { dbVerifyKarmaLedger } from '@/lib/discountCodesDb';
import type { KarmaChainVerdict } from '@/lib/karmaLedgerVerify';

export const runtime = 'nodejs';

// Read-only re-walk of the karma hash chain (2026-09-23). Gives the chain a
// reader: a Wheelwright canary or an outside witness can poll this and record
// `head`, which is what makes a truncated tail detectable at all.
// `ok` is true ONLY for `intact` — an empty ledger verified nothing.
// A ledger that cannot be opened reports `unmeasured`, never `intact`.
// The walk is a full-table scan, so the verdict is cached per process instead of
// spending the gameplay rate limiter or DB time on every poll.
const CACHE_MS = 30_000;
let cached: { at: number; verdict: KarmaChainVerdict; checkedAt: string } | null = null;

export async function GET() {
  try {
    if (!cached || Date.now() - cached.at > CACHE_MS) {
      cached = { at: Date.now(), verdict: dbVerifyKarmaLedger(), checkedAt: new Date().toISOString() };
    }
    return NextResponse.json(
      { ok: cached.verdict.status === 'intact', ...cached.verdict, checkedAt: cached.checkedAt },
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
