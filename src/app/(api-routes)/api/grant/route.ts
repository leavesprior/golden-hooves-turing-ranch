import { NextRequest, NextResponse } from 'next/server';
import { dbRecordGrantAudit } from '@/lib/discountCodesDb';
import { isMilestoneId } from '@/lib/crossGameProgression';
import {
  DEFAULT_GRANT_TTL_SECONDS,
  getGrantSigningSecret,
  resolveGrantTtlSeconds,
  signGrant,
  type GrantPayload,
} from '@/lib/server/grantSigning';
import { verifyMilestoneEligibility } from '@/lib/server/grantEligibility';

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

function validatePayload(type: string, payload: Record<string, unknown>): Record<string, unknown> {
  if (type !== 'milestone') return payload;

  if (!isMilestoneId(payload.milestoneId)) {
    throw new Error('milestone_not_allowed');
  }
  if (typeof payload.sessionId !== 'string' || payload.sessionId.trim().length === 0) {
    throw new Error('missing_session_id');
  }

  return {
    milestoneId: payload.milestoneId,
    sessionId: payload.sessionId,
    source: typeof payload.source === 'string' ? payload.source : 'unknown',
    metadata: isRecord(payload.metadata) ? payload.metadata : {},
  };
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

  let grantPayload: Record<string, unknown>;
  try {
    grantPayload = validatePayload(type, body.payload);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'invalid_payload';
    return rejectGrant(type, reason, body.payload);
  }

  // GAP-2 FIX: before we sign, the server must independently confirm the player
  // EARNED the milestone, from the server-side event log (the NEW-09 marker
  // trail). A signature over an unverified claim is just a notarized lie — prior
  // to this gate any client could POST a milestoneId + arbitrary sessionId and
  // receive a validly-signed grant. The allow-list / non-empty-sessionId checks
  // above are necessary but NOT sufficient.
  if (type === 'milestone') {
    const milestoneId = grantPayload.milestoneId;
    const sessionId = typeof grantPayload.sessionId === 'string' ? grantPayload.sessionId : '';
    const verdict = verifyMilestoneEligibility({
      milestoneId: milestoneId as never,
      sessionId,
      difficulty: typeof grantPayload.difficulty === 'string' ? grantPayload.difficulty : undefined,
    });
    if (!verdict.eligible) {
      // 403: the request is well-formed but the player has not earned this.
      return rejectGrant(type, verdict.reason, body.payload, 403);
    }
  }

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
    payload: grantPayload,
    sub: typeof grantPayload.sessionId === 'string' ? grantPayload.sessionId : undefined,
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
