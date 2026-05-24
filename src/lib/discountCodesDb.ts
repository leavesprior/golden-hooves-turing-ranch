import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface DiscountCode {
  id: string;
  code: string;
  granted_at: string;
  expires_at: string;
  redeemed_at: string | null;
  session_id: string | null;
  marker_count: number;
  percent: number;
  source: string;
}

export interface MintParams {
  sessionId?: string | null;
  markerCount: number;
  percent: number;
  validDays: number;
  source?: string;
}

export interface MarkerProgress {
  session_id: string;
  marker_slug: string;
  recorded_at: string;
}

export interface RecordMarkerProgressParams {
  sessionId: string;
  markerSlug: string;
}

export interface RecordMarkerProgressResult {
  markerCount: number;
  marker: MarkerProgress;
}

export interface RedeemResult {
  ok: boolean;
  code?: DiscountCode;
  reason?: 'not_found' | 'already_redeemed' | 'expired';
}

export type GrantAuditStatus =
  | 'issued'
  | 'issue_rejected'
  | 'verify_ok'
  | 'verify_failed';

export interface GrantAuditParams {
  grantId?: string | null;
  grantType: string;
  subject?: string | null;
  audience?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  ttlSeconds?: number | null;
  payload?: unknown;
  status: GrantAuditStatus;
  reason?: string | null;
  source?: string | null;
}

export interface GrantAuditRow {
  id: string;
  grant_id: string | null;
  grant_type: string;
  subject: string | null;
  audience: string | null;
  issued_at: string | null;
  expires_at: string | null;
  ttl_seconds: number | null;
  payload_json: string | null;
  status: GrantAuditStatus;
  reason: string | null;
  source: string | null;
  created_at: string;
}

function getDbPath(): string {
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'discount_codes.db');
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'discount_codes.db');
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const dbPath = getDbPath();
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id           TEXT PRIMARY KEY,
        code         TEXT NOT NULL UNIQUE,
        granted_at   TEXT NOT NULL,
        expires_at   TEXT NOT NULL,
        redeemed_at  TEXT,
        session_id   TEXT,
        marker_count INTEGER NOT NULL,
        percent      INTEGER NOT NULL,
        source       TEXT NOT NULL DEFAULT 'marker_4_unlock'
      );
      CREATE INDEX IF NOT EXISTS idx_discount_codes_redeemed
        ON discount_codes (redeemed_at);

      CREATE TABLE IF NOT EXISTS bobr_marker_progress (
        session_id  TEXT NOT NULL,
        marker_slug TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        PRIMARY KEY (session_id, marker_slug)
      );
      CREATE INDEX IF NOT EXISTS idx_bobr_marker_progress_session
        ON bobr_marker_progress (session_id);

      -- NEW-09: server-side session ledger. A marker session is created on the
      -- FIRST marker and pinned to the difficulty + the server clock at creation.
      -- The HMAC session_token is issued by the server (never accepted from the
      -- client on creation), so a forged client sessionId cannot arrive
      -- pre-loaded with progress — it must start at marker 1 with a "now" clock.
      CREATE TABLE IF NOT EXISTS bobr_marker_session (
        session_id    TEXT PRIMARY KEY,
        difficulty    TEXT NOT NULL,
        session_token TEXT NOT NULL,
        created_at    TEXT NOT NULL,
        last_marker_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS grant_audit (
        id           TEXT PRIMARY KEY,
        grant_id     TEXT,
        grant_type   TEXT NOT NULL,
        subject      TEXT,
        audience     TEXT,
        issued_at    TEXT,
        expires_at   TEXT,
        ttl_seconds  INTEGER,
        payload_json TEXT,
        status       TEXT NOT NULL,
        reason       TEXT,
        source       TEXT,
        created_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_grant_audit_type_created
        ON grant_audit (grant_type, created_at);
      CREATE INDEX IF NOT EXISTS idx_grant_audit_status_created
        ON grant_audit (status, created_at);
    `);
  }
  return _db;
}

// Alphabet excludes ambiguous chars (0/O, 1/I/L) so guests can read codes off email
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateSuffix(): string {
  // crypto.randomBytes is cryptographically random — Math.random was the live-forgery vuln
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return suffix;
}

export function dbMintCode(params: MintParams): DiscountCode {
  const db = getDb();
  const source = params.source ?? 'marker_4_unlock';

  if (params.sessionId) {
    const existing = db.prepare(`
      SELECT *
        FROM discount_codes
       WHERE session_id = ?
         AND source = ?
       ORDER BY granted_at ASC
       LIMIT 1
    `).get(params.sessionId, source) as DiscountCode | undefined;

    if (existing) return existing;
  }

  const insert = db.prepare(`
    INSERT INTO discount_codes
      (id, code, granted_at, expires_at, redeemed_at, session_id, marker_count, percent, source)
    VALUES
      (@id, @code, @granted_at, @expires_at, NULL, @session_id, @marker_count, @percent, @source)
  `);

  // Loop on UNIQUE collision — astronomically rare with 31^6 ≈ 887M space, but cheap to retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt);
    expiresAt.setDate(expiresAt.getDate() + params.validDays);

    const row: DiscountCode = {
      id: crypto.randomUUID(),
      code: `BOBR-EARLY-${generateSuffix()}`,
      granted_at: grantedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      redeemed_at: null,
      session_id: params.sessionId ?? null,
      marker_count: params.markerCount,
      percent: params.percent,
      source,
    };

    try {
      insert.run(row);
      return row;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('UNIQUE') && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error('dbMintCode: failed to allocate unique code after 5 attempts');
}

export function dbRecordMarkerProgress(params: RecordMarkerProgressParams): RecordMarkerProgressResult {
  const db = getDb();
  const marker: MarkerProgress = {
    session_id: params.sessionId,
    marker_slug: params.markerSlug,
    recorded_at: new Date().toISOString(),
  };

  db.prepare(`
    INSERT OR IGNORE INTO bobr_marker_progress
      (session_id, marker_slug, recorded_at)
    VALUES
      (@session_id, @marker_slug, @recorded_at)
  `).run(marker);

  const markerCount = dbGetMarkerProgressCount(params.sessionId);
  return { markerCount, marker };
}

export interface MarkerSession {
  session_id: string;
  difficulty: string;
  session_token: string;
  created_at: string;
  last_marker_at: string;
}

export function dbGetMarkerSession(sessionId: string): MarkerSession | null {
  const row = getDb()
    .prepare('SELECT * FROM bobr_marker_session WHERE session_id = ?')
    .get(sessionId) as MarkerSession | undefined;
  return row ?? null;
}

/**
 * Create the server-side marker session on first contact. Idempotent: if the
 * session already exists it is returned unchanged (so a replayed first marker
 * cannot reset the clock). The session_token is computed server-side by the
 * caller and stored here.
 */
export function dbCreateMarkerSession(params: {
  sessionId: string;
  difficulty: string;
  sessionToken: string;
}): MarkerSession {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO bobr_marker_session
      (session_id, difficulty, session_token, created_at, last_marker_at)
    VALUES
      (@session_id, @difficulty, @session_token, @created_at, @last_marker_at)
  `).run({
    session_id: params.sessionId,
    difficulty: params.difficulty,
    session_token: params.sessionToken,
    created_at: now,
    last_marker_at: now,
  });
  return dbGetMarkerSession(params.sessionId)!;
}

/** Stamp the last-marker time so the timing floor is enforced server-side. */
export function dbTouchMarkerSession(sessionId: string): void {
  getDb()
    .prepare('UPDATE bobr_marker_session SET last_marker_at = ? WHERE session_id = ?')
    .run(new Date().toISOString(), sessionId);
}

export function dbGetMarkerProgressCount(sessionId: string): number {
  const row = getDb().prepare(`
    SELECT COUNT(*) AS count
      FROM bobr_marker_progress
     WHERE session_id = ?
  `).get(sessionId) as { count: number } | undefined;

  return row?.count ?? 0;
}

export function dbGetCode(code: string): DiscountCode | null {
  const row = getDb().prepare('SELECT * FROM discount_codes WHERE code = ?').get(code) as DiscountCode | undefined;
  return row ?? null;
}

export function dbRedeemCode(code: string): RedeemResult {
  const db = getDb();
  const now = new Date().toISOString();

  // Atomic: only flip redeemed_at if not already redeemed AND not expired.
  // Returning the row gives us the post-update state in one round-trip.
  const update = db.prepare(`
    UPDATE discount_codes
       SET redeemed_at = @now
     WHERE code = @code
       AND redeemed_at IS NULL
       AND expires_at > @now
  `);

  const result = update.run({ now, code });

  if (result.changes === 1) {
    const row = dbGetCode(code);
    return row ? { ok: true, code: row } : { ok: false, reason: 'not_found' };
  }

  // Failed — figure out why
  const existing = dbGetCode(code);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (existing.redeemed_at) return { ok: false, reason: 'already_redeemed', code: existing };
  return { ok: false, reason: 'expired', code: existing };
}

export function dbRecordGrantAudit(params: GrantAuditParams): GrantAuditRow {
  const row: GrantAuditRow = {
    id: crypto.randomUUID(),
    grant_id: params.grantId ?? null,
    grant_type: params.grantType,
    subject: params.subject ?? null,
    audience: params.audience ?? null,
    issued_at: params.issuedAt ?? null,
    expires_at: params.expiresAt ?? null,
    ttl_seconds: params.ttlSeconds ?? null,
    payload_json: params.payload === undefined ? null : JSON.stringify(params.payload),
    status: params.status,
    reason: params.reason ?? null,
    source: params.source ?? null,
    created_at: new Date().toISOString(),
  };

  getDb().prepare(`
    INSERT INTO grant_audit
      (id, grant_id, grant_type, subject, audience, issued_at, expires_at,
       ttl_seconds, payload_json, status, reason, source, created_at)
    VALUES
      (@id, @grant_id, @grant_type, @subject, @audience, @issued_at,
       @expires_at, @ttl_seconds, @payload_json, @status, @reason,
       @source, @created_at)
  `).run(row);

  return row;
}
