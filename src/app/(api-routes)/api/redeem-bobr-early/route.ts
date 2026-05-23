import { NextRequest, NextResponse } from 'next/server';
import { dbRedeemCode } from '@/lib/discountCodesDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) {
    return NextResponse.json({ ok: false, reason: 'missing_code' }, { status: 400 });
  }

  const result = dbRedeemCode(code);

  if (!result.ok) {
    const status = result.reason === 'not_found' ? 404 : 410; // 410 Gone for redeemed/expired
    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        ...(result.code ? { redeemedAt: result.code.redeemed_at, expiresAt: result.code.expires_at } : {}),
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    code: result.code!.code,
    percent: result.code!.percent,
    redeemedAt: result.code!.redeemed_at,
    grantedAt: result.code!.granted_at,
  });
}
