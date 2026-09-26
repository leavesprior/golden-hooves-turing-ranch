import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { testDbPathOverride } from './discountCodesDb';

/**
 * Encrypted cloud saves on the Railway /data volume (replaces the Notion store).
 *
 * The server only ever holds ciphertext (the browser encrypts with the
 * player's passphrase, cryptoSave.ts). Ownership: the first write for a
 * playerId claims it with a passphrase-derived proof (saveProof.ts); the server
 * keeps sha256(proof), and every later read or write must present the same
 * proof. Without it there is no ciphertext to take away and brute-force.
 */

export const SAVE_TYPES = ['adventure_save', 'rpg_session', 'cross_game', 'karma'] as const;
export type CloudSaveType = (typeof SAVE_TYPES)[number];
export const MAX_SAVE_BYTES = 512 * 1024;
export const MAX_FAILED_PROOFS = 10;
export const THROTTLE_MS = 60_000;

const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
const PROOF_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type SaveFailure = 'invalid' | 'not_found' | 'forbidden' | 'throttled' | 'too_large';

export interface SaveMeta {
  exists: true;
  lastSaved: string;
  saveType: CloudSaveType;
}

export type ReadResult =
  | { ok: true; saveData: string; lastSaved: string; saveType: CloudSaveType }
  | { ok: false; reason: SaveFailure };

export type WriteResult = { ok: true; action: 'created' | 'saved' } | { ok: false; reason: SaveFailure };

export interface WriteParams {
  playerId: string;
  saveType: string;
  saveData: string;
  saveVersion?: string | null;
  deviceId?: string | null;
  proof: string;
}

let _warnedTmpDb = false;
let _db: Database.Database | null = null;
let _clockOffsetMs = 0;
const now = () => Date.now() + _clockOffsetMs;

function getDbPath(): string {
  const override = testDbPathOverride(process.env);
  if (override) return override;
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'cloud_saves.db');
    }
  } catch {
    // fall through
  }
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);
  if (isProd && !_warnedTmpDb) {
    _warnedTmpDb = true;
    console.error('[CRITICAL] /data volume missing — cloud_saves.db is on /tmp and WILL vanish on redeploy. Mount a Railway volume at /data.');
  }
  return path.join('/tmp', 'cloud_saves.db');
}

function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_save_owners (
      player_id      TEXT PRIMARY KEY,
      proof_hash     TEXT NOT NULL,
      claimed_at     TEXT NOT NULL,
      failed_count   INTEGER NOT NULL DEFAULT 0,
      last_failed_ms INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cloud_saves (
      player_id    TEXT NOT NULL,
      save_type    TEXT NOT NULL,
      save_data    TEXT NOT NULL,
      save_version TEXT,
      device_id    TEXT,
      last_saved   TEXT NOT NULL,
      PRIMARY KEY (player_id, save_type)
    );
  `);
  _db = db;
  return db;
}

function hashProof(proof: string): Buffer {
  return crypto.createHash('sha256').update(proof, 'utf8').digest();
}

function isSaveType(t: unknown): t is CloudSaveType {
  return typeof t === 'string' && (SAVE_TYPES as readonly string[]).includes(t);
}

function validIds(playerId: unknown, proof: unknown): boolean {
  return typeof playerId === 'string' && PLAYER_ID_PATTERN.test(playerId) && typeof proof === 'string' && PROOF_PATTERN.test(proof);
}

interface OwnerRow {
  proof_hash: string;
  failed_count: number;
  last_failed_ms: number;
}

/**
 * Check a proof against a claimed owner. Throttled while the failure count is at
 * the limit and the last failure is inside the window — for everyone, the owner
 * included, so the throttle cannot be used as a right/wrong oracle.
 */
function checkOwner(db: Database.Database, playerId: string, owner: OwnerRow, proof: string): SaveFailure | null {
  if (owner.failed_count >= MAX_FAILED_PROOFS && now() - owner.last_failed_ms < THROTTLE_MS) return 'throttled';
  const match = crypto.timingSafeEqual(Buffer.from(owner.proof_hash, 'hex'), hashProof(proof));
  if (!match) {
    db.prepare('UPDATE cloud_save_owners SET failed_count = failed_count + 1, last_failed_ms = ? WHERE player_id = ?').run(now(), playerId);
    return 'forbidden';
  }
  if (owner.failed_count > 0) {
    db.prepare('UPDATE cloud_save_owners SET failed_count = 0, last_failed_ms = 0 WHERE player_id = ?').run(playerId);
  }
  return null;
}

/** Existence + timestamp only; never save data. Needs no proof. */
export function getSaveMeta(playerId: string, saveType?: string): SaveMeta | null {
  if (typeof playerId !== 'string' || !PLAYER_ID_PATTERN.test(playerId)) return null;
  if (saveType !== undefined && !isSaveType(saveType)) return null;
  const db = getDb();
  const row = (saveType
    ? db.prepare('SELECT save_type, last_saved FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(playerId, saveType)
    : db.prepare('SELECT save_type, last_saved FROM cloud_saves WHERE player_id = ? ORDER BY last_saved DESC LIMIT 1').get(playerId)) as
    | { save_type: CloudSaveType; last_saved: string }
    | undefined;
  return row ? { exists: true, lastSaved: row.last_saved, saveType: row.save_type } : null;
}

export function readSave(playerId: string, saveType: string, proof: string): ReadResult {
  if (!validIds(playerId, proof) || !isSaveType(saveType)) return { ok: false, reason: 'invalid' };
  const db = getDb();
  return db.transaction((): ReadResult => {
    const owner = db.prepare('SELECT proof_hash, failed_count, last_failed_ms FROM cloud_save_owners WHERE player_id = ?').get(playerId) as OwnerRow | undefined;
    if (!owner) return { ok: false, reason: 'not_found' };
    const refused = checkOwner(db, playerId, owner, proof);
    if (refused) return { ok: false, reason: refused };
    const row = db.prepare('SELECT save_data, last_saved FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(playerId, saveType) as
      | { save_data: string; last_saved: string }
      | undefined;
    if (!row) return { ok: false, reason: 'not_found' };
    return { ok: true, saveData: row.save_data, lastSaved: row.last_saved, saveType };
  }).immediate();
}

export function writeSave(p: WriteParams): WriteResult {
  if (!validIds(p.playerId, p.proof) || !isSaveType(p.saveType)) return { ok: false, reason: 'invalid' };
  if (typeof p.saveData !== 'string' || p.saveData.length === 0) return { ok: false, reason: 'invalid' };
  if (Buffer.byteLength(p.saveData, 'utf8') > MAX_SAVE_BYTES) return { ok: false, reason: 'too_large' };
  const saveVersion = typeof p.saveVersion === 'string' ? p.saveVersion.slice(0, 32) : null;
  const deviceId = typeof p.deviceId === 'string' ? p.deviceId.slice(0, 64) : null;
  const db = getDb();
  // IMMEDIATE: claim-or-verify and the upsert happen under one write lock, so
  // two first writes cannot both claim, and the old save is only ever replaced
  // by the new one in a single statement — never deleted first.
  return db.transaction((): WriteResult => {
    const owner = db.prepare('SELECT proof_hash, failed_count, last_failed_ms FROM cloud_save_owners WHERE player_id = ?').get(p.playerId) as OwnerRow | undefined;
    const stamp = new Date(now()).toISOString();
    if (!owner) {
      db.prepare('INSERT INTO cloud_save_owners (player_id, proof_hash, claimed_at) VALUES (?, ?, ?)').run(p.playerId, hashProof(p.proof).toString('hex'), stamp);
    } else {
      const refused = checkOwner(db, p.playerId, owner, p.proof);
      if (refused) return { ok: false, reason: refused };
    }
    const existed = db.prepare('SELECT 1 FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(p.playerId, p.saveType);
    db.prepare(`
      INSERT INTO cloud_saves (player_id, save_type, save_data, save_version, device_id, last_saved)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (player_id, save_type) DO UPDATE SET
        save_data = excluded.save_data, save_version = excluded.save_version,
        device_id = excluded.device_id, last_saved = excluded.last_saved
    `).run(p.playerId, p.saveType, p.saveData, saveVersion, deviceId, stamp);
    return { ok: true, action: existed ? 'saved' : 'created' };
  }).immediate();
}

/** Test helpers. */
export function _countRows(playerId: string): number {
  return (getDb().prepare('SELECT COUNT(*) AS n FROM cloud_saves WHERE player_id = ?').get(playerId) as { n: number }).n;
}
export function _advanceClockForTests(ms: number): void {
  if (process.env.RAILWAY_ENVIRONMENT) return;
  _clockOffsetMs += ms;
}
