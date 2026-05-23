import { NextRequest, NextResponse } from 'next/server';
import {
  EARLY_DISCOUNT_MARKER,
  EARLY_DISCOUNT_PERCENT,
  EARLY_DISCOUNT_VALID_DAYS,
} from '@/lib/locations';
import { dbMintCode } from '@/lib/discountCodesDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; markerCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const markerCount = Number(body.markerCount);
  if (!Number.isFinite(markerCount) || markerCount < EARLY_DISCOUNT_MARKER) {
    return NextResponse.json(
      { ok: false, reason: 'marker_threshold_not_met', required: EARLY_DISCOUNT_MARKER },
      { status: 400 },
    );
  }

  // P-1 scope: the server is the only minter. Tier-2 will add server-side milestone
  // validation against a Supabase/SQLite milestones table to close the bypass where a
  // client could POST { markerCount: 4 } without actually reaching marker 4.
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

  const row = dbMintCode({
    sessionId,
    markerCount,
    percent: EARLY_DISCOUNT_PERCENT,
    validDays: EARLY_DISCOUNT_VALID_DAYS,
    source: 'marker_4_unlock',
  });

  return NextResponse.json({
    ok: true,
    code: row.code,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    percent: row.percent,
  });
}
