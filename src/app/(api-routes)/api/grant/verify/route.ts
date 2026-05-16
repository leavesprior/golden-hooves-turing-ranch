import { NextRequest, NextResponse } from 'next/server';
import { dbRecordGrantAudit } from '@/lib/discountCodesDb';
import { getGrantSigningSecret, verifyGrant } from '@/lib/server/grantSigning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    dbRecordGrantAudit({
      grantType: 'unknown',
      status: 'verify_failed',
      reason: 'missing_token',
      source: 'api_grant_verify',
    });
    return NextResponse.json({ ok: false, reason: 'missing_token' }, { status: 400 });
  }

  const payload = verifyGrant(token, getGrantSigningSecret());
  if (!payload) {
    dbRecordGrantAudit({
      grantType: 'unknown',
      status: 'verify_failed',
      reason: 'invalid_token',
      source: 'api_grant_verify',
    });
    return NextResponse.json({ ok: false, reason: 'invalid_token' }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const remainingTtlSeconds = Math.max(0, (payload.exp ?? now) - now);

  dbRecordGrantAudit({
    grantId: payload.jti ?? null,
    grantType: payload.type,
    subject: payload.sub ?? null,
    audience: payload.aud ?? null,
    issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    ttlSeconds: remainingTtlSeconds,
    payload: payload.payload,
    status: 'verify_ok',
    source: 'api_grant_verify',
  });

  return NextResponse.json({
    ok: true,
    payload,
    remainingTtlSeconds,
  });
}
