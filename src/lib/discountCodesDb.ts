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
