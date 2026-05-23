import 'server-only';

import crypto from 'crypto';
import { dbRecordGrantAudit } from '@/lib/discountCodesDb';

export const GRANT_SIGNING_SECRET_ENV = 'BOBR_GRANT_SIGNING_SECRET';
export const DEFAULT_GRANT_TTL_SECONDS = 30 * 24 * 60 * 60;

export const GRANT_TTL_SECONDS_BY_TYPE: Record<string, number> = {
  milestone: DEFAULT_GRANT_TTL_SECONDS,
};

export interface GrantPayload {
  type: string;
  payload: Record<string, unknown>;
  sub?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  nbf?: number;
  jti?: string;
}

type VerifiedGrantPayload = GrantPayload & {
  iat: number;
  exp: number;
  jti: string;
};

interface GrantHeader {
  alg: 'HS256';
  typ: 'BOBR-GRANT';
  kid: 'bobr-grants-v1';
}

const GRANT_HEADER: GrantHeader = {
  alg: 'HS256',
  typ: 'BOBR-GRANT',
  kid: 'bobr-grants-v1',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeBase64UrlJson(value: string): unknown {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function hmacSha256(input: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url');
}

function timingSafeEqualBase64Url(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'base64url');
  const rightBuffer = Buffer.from(right, 'base64url');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function assertSecret(secret: string): void {
  if (secret.trim().length < 32) {
    throw new Error(`${GRANT_SIGNING_SECRET_ENV} must be at least 32 characters`);
  }
}

export function resolveGrantTtlSeconds(type: string, requestedTtlSeconds?: number): number {
  if (requestedTtlSeconds !== undefined) {
    if (!Number.isInteger(requestedTtlSeconds) || requestedTtlSeconds <= 0) {
      throw new Error('Grant ttl must be a positive integer number of seconds');
    }
    return requestedTtlSeconds;
  }

  return GRANT_TTL_SECONDS_BY_TYPE[type] ?? DEFAULT_GRANT_TTL_SECONDS;
}

function normalizePayload(payload: GrantPayload): Required<Pick<GrantPayload, 'type' | 'payload' | 'iat' | 'exp' | 'jti'>> & GrantPayload {
  if (!payload || typeof payload.type !== 'string' || payload.type.trim().length === 0) {
    throw new Error('Grant payload requires a non-empty type');
  }
  if (!isRecord(payload.payload)) {
    throw new Error('Grant payload requires an object payload');
  }

  const now = Math.floor(Date.now() / 1000);
  const configuredTtl = resolveGrantTtlSeconds(payload.type);
  const iat = Number.isFinite(payload.iat) ? Number(payload.iat) : now;
  const exp = Number.isFinite(payload.exp) ? Number(payload.exp) : iat + configuredTtl;

  if (exp <= iat) {
    throw new Error('Grant payload exp must be after iat');
  }

  return {
    ...payload,
    type: payload.type,
    payload: payload.payload,
    iat,
    exp,
    jti: payload.jti ?? crypto.randomUUID(),
    aud: payload.aud ?? `bobr-grant:${payload.type}`,
  };
}

function isGrantPayload(value: unknown): value is VerifiedGrantPayload {
  if (!isRecord(value)) return false;
  if (typeof value.type !== 'string' || value.type.length === 0) return false;
  if (!isRecord(value.payload)) return false;
  if (typeof value.iat !== 'number' || typeof value.exp !== 'number') return false;
  if (typeof value.jti !== 'string' || value.jti.length === 0) return false;
  if (value.sub !== undefined && typeof value.sub !== 'string') return false;
  if (value.aud !== undefined && typeof value.aud !== 'string') return false;
  if (value.nbf !== undefined && typeof value.nbf !== 'number') return false;
  return true;
}

export function getGrantSigningSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env[GRANT_SIGNING_SECRET_ENV];
  if (secret) {
    assertSecret(secret);
    return secret;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(`${GRANT_SIGNING_SECRET_ENV} is required in production`);
  }

  return 'development-only-bobr-grant-signing-secret-32-chars';
}

export function signGrant(payload: GrantPayload, secret: string): string {
  assertSecret(secret);
  const normalized = normalizePayload(payload);
  const encodedHeader = base64UrlJson(GRANT_HEADER);
  const encodedPayload = base64UrlJson(normalized);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = hmacSha256(signingInput, secret);

  dbRecordGrantAudit({
    grantId: normalized.jti,
    grantType: normalized.type,
    subject: normalized.sub ?? null,
    audience: normalized.aud ?? null,
    issuedAt: new Date(normalized.iat * 1000).toISOString(),
    expiresAt: new Date(normalized.exp * 1000).toISOString(),
    ttlSeconds: normalized.exp - normalized.iat,
    payload: normalized.payload,
    status: 'issued',
    source: 'grant_signing',
  });

  return `${signingInput}.${signature}`;
}

export function verifyGrant(token: string, secret: string): GrantPayload | null {
  assertSecret(secret);

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => part.length === 0)) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = hmacSha256(signingInput, secret);
  if (!timingSafeEqualBase64Url(signature, expectedSignature)) return null;

  try {
    const header = decodeBase64UrlJson(encodedHeader);
    if (!isRecord(header) || header.alg !== 'HS256' || header.typ !== 'BOBR-GRANT') return null;

    const payload = decodeBase64UrlJson(encodedPayload);
    if (!isGrantPayload(payload)) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.nbf !== undefined && payload.nbf > now) return null;
    if (payload.exp <= now) return null;

    return payload;
  } catch {
    return null;
  }
}

if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  getGrantSigningSecret();
}
