import { NextRequest, NextResponse } from 'next/server';
import { dbRecordGrantAudit } from '@/lib/discountCodesDb';
import {
  DEFAULT_GRANT_TTL_SECONDS,
  getGrantSigningSecret,
  resolveGrantTtlSeconds,
  signGrant,
  type GrantPayload,
} from '@/lib/server/grantSigning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRANT_TYPE_ALLOWLIST = new Set(['milestone']);
const MAX_GRANT_TTL_SECONDS = DEFAULT_GRANT_TTL_SECONDS;

interface GrantRequestBody {
  type?: unknown;
  payload?: unknown;
  ttl?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function rejectGrant(type: string, reason: string, payload?: unknown, status = 400) {
  dbRecordGrantAudit({
    grantType: type || 'unknown',
    payload,
    status: 'issue_rejected',
    reason,
    source: 'api_grant',
  });
  return NextResponse.json({ ok: false, reason }, { status });
}

function parseRequestedTtl(type: string, ttl: unknown): number {
  if (ttl === undefined || ttl === null) return resolveGrantTtlSeconds(type);
  if (typeof ttl !== 'number') throw new Error('invalid_ttl');
  const ttlSeconds = resolveGrantTtlSeconds(type, ttl);
  if (ttlSeconds > MAX_GRANT_TTL_SECONDS) throw new Error('ttl_too_long');
  return ttlSeconds;
}

export async function POST(req: NextRequest) {
  let body: GrantRequestBody;
  try {
    body = await req.json();
  } catch {
    return rejectGrant('unknown', 'invalid_json');
  }

  const type = typeof body.type === 'string' ? body.type.trim() : '';
  if (!type) return rejectGrant('unknown', 'missing_type', body);
  if (!GRANT_TYPE_ALLOWLIST.has(type)) return rejectGrant(type, 'grant_type_not_allowed', body, 403);
  if (!isRecord(body.payload)) return rejectGrant(type, 'invalid_payload', body.payload);

  let ttlSeconds: number;
  try {
    ttlSeconds = parseRequestedTtl(type, body.ttl);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'invalid_ttl';
    return rejectGrant(type, reason, body.payload);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: GrantPayload = {
    type,
    payload: body.payload,
    iat: now,
    exp: now + ttlSeconds,
    aud: `bobr-grant:${type}`,
  };

  const token = signGrant(payload, getGrantSigningSecret());
  const signedPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as GrantPayload;

  return NextResponse.json({
    ok: true,
    token,
    payload: signedPayload,
    expiresAt: new Date((signedPayload.exp ?? now + ttlSeconds) * 1000).toISOString(),
    ttlSeconds,
  }, { status: 201 });
}
