import { NextRequest, NextResponse } from 'next/server';
import {
  EARLY_DISCOUNT_MARKER,
  EARLY_DISCOUNT_PERCENT,
  EARLY_DISCOUNT_VALID_DAYS,
} from '@/lib/locations';
import { dbGetMarkerProgressCount, dbMintCode } from '@/lib/discountCodesDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId) {
    return NextResponse.json({ ok: false, reason: 'missing_session_id' }, { status: 400 });
  }

  // Round 5: marker progress is derived from the server-side marker-progress
  // table. The request body no longer accepts markerCount, so a client cannot
  // mint a real discount code by POSTing { markerCount: 4 } from devtools.
  const markerCount = dbGetMarkerProgressCount(sessionId);
  if (markerCount < EARLY_DISCOUNT_MARKER) {
    return NextResponse.json(
      { ok: false, reason: 'marker_threshold_not_met', required: EARLY_DISCOUNT_MARKER, markerCount },
      { status: 400 },
    );
  }

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
