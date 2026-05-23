import type { GameId, MilestoneId } from './crossGameProgression';

export const GRANT_SESSION_STORAGE_KEY = 'bobr_grant_session_id';
export const MILESTONE_GRANT_STORAGE_PREFIX = 'bobr_grant_milestone_';

export interface ClientGrantPayload {
  type: string;
  payload: Record<string, unknown>;
  sub?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  nbf?: number;
  jti?: string;
}

export interface IssueMilestoneGrantParams {
  milestoneId: MilestoneId;
  source: GameId;
  metadata?: Record<string, unknown>;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getGrantSessionId(): string {
  if (!canUseStorage()) return 'server';
  const existing = localStorage.getItem(GRANT_SESSION_STORAGE_KEY);
  if (existing) return existing;

  const sessionId = safeRandomId('grant_session');
  localStorage.setItem(GRANT_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function getMilestoneGrantStorageKey(milestoneId: MilestoneId): string {
  return `${MILESTONE_GRANT_STORAGE_PREFIX}${milestoneId}`;
}

export function getMilestoneGrantToken(milestoneId: MilestoneId): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(getMilestoneGrantStorageKey(milestoneId));
}

export function storeMilestoneGrantToken(milestoneId: MilestoneId, token: string): void {
  if (!canUseStorage()) return;
  const key = getMilestoneGrantStorageKey(milestoneId);
  localStorage.setItem(key, token);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: token }));
}

export function removeMilestoneGrantToken(milestoneId: MilestoneId): void {
  if (!canUseStorage()) return;
  const key = getMilestoneGrantStorageKey(milestoneId);
  localStorage.removeItem(key);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
}

export function decodeGrantPayload(token: string): ClientGrantPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    const payload = JSON.parse(json) as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const record = payload as Record<string, unknown>;
    if (typeof record.type !== 'string') return null;
    if (!record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) return null;
    return record as unknown as ClientGrantPayload;
  } catch {
    return null;
  }
}

export function hasUsableMilestoneGrant(milestoneId: MilestoneId, nowMs = Date.now()): boolean {
  const token = getMilestoneGrantToken(milestoneId);
  if (!token) return false;

  const payload = decodeGrantPayload(token);
  if (!payload || payload.type !== 'milestone') return false;
  if (payload.payload.milestoneId !== milestoneId) return false;
  if (typeof payload.exp !== 'number') return false;

  return payload.exp * 1000 > nowMs;
}

export async function issueMilestoneGrant(params: IssueMilestoneGrantParams): Promise<string | null> {
  const response = await fetch('/api/grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'milestone',
      payload: {
        milestoneId: params.milestoneId,
        sessionId: getGrantSessionId(),
        source: params.source,
        metadata: params.metadata ?? {},
      },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json() as { token?: unknown };
  if (typeof data.token !== 'string') return null;

  storeMilestoneGrantToken(params.milestoneId, data.token);
  return data.token;
}

export async function verifyMilestoneGrantToken(milestoneId: MilestoneId): Promise<boolean> {
  const token = getMilestoneGrantToken(milestoneId);
  if (!token) return false;

  const response = await fetch(`/api/grant/verify?token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    removeMilestoneGrantToken(milestoneId);
    return false;
  }

  const data = await response.json() as { payload?: ClientGrantPayload };
  if (
    data.payload?.type !== 'milestone'
    || data.payload.payload?.milestoneId !== milestoneId
  ) {
    removeMilestoneGrantToken(milestoneId);
    return false;
  }

  return true;
}
