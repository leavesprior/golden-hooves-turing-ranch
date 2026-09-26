import type Database from 'better-sqlite3';
import crypto from 'crypto';
import { getCloudDb } from './cloudDb';

/**
 * Encrypted cloud saves on the Railway /data volume (replaces the Notion store).
 *
 * The server only ever holds ciphertext (the browser encrypts with the
 * player's passphrase, cryptoSave.ts). Ownership: the first write for a save
 * slot claims it with a passphrase-derived proof (saveProof.ts); the server
 * keeps sha256(proof), and every later read or write must present the same
 * proof. Without it there is no ciphertext to take away and brute-force.
 *
 * The slot id is private to the browser (cloudSave.ts getCloudSlotId), never
 * the public Hall of Fame playerId — otherwise anyone could claim a player's
 * slot before they first saved (council 20260926_141619_secure-save).
 */

export const SAVE_TYPES = ['adventure_save', 'rpg_session', 'cross_game', 'karma'] as const;
export type CloudSaveType = (typeof SAVE_TYPES)[number];
export const MAX_SAVE_BYTES = 512 * 1024;
export const MAX_FAILED_PROOFS = 10;
export const THROTTLE_MS = 60_000;
export const MAX_TRACKED_CLIENTS = 10_000;
export const HISTORY_DEPTH = 3;

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
  /** Who is asking (the client IP). Wrong proofs are throttled per client. */
  clientKey?: string;
}

let _schemaReady = false;
let _clockOffsetMs = 0;
const now = () => Date.now() + _clockOffsetMs;

function db(): Database.Database {
  const d = getCloudDb();
  if (!_schemaReady) {
    d.exec(`
      CREATE TABLE IF NOT EXISTS cloud_save_owners (
        player_id  TEXT PRIMARY KEY,
        proof_hash TEXT NOT NULL,
        claimed_at TEXT NOT NULL
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
      -- The last HISTORY_DEPTH replaced versions, so a stale tab or a stolen
      -- proof cannot destroy the only copy. Recovery is manual (admin).
      CREATE TABLE IF NOT EXISTS cloud_save_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id   TEXT NOT NULL,
        save_type   TEXT NOT NULL,
        save_data   TEXT NOT NULL,
        last_saved  TEXT NOT NULL,
        replaced_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cloud_save_history_slot ON cloud_save_history (player_id, save_type, id);
    `);
    _schemaReady = true;
  }
  return d;
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
}

/**
 * Wrong-proof throttle, keyed by the CLIENT (IP), never by the account:
 * an account lock would let anyone lock any owner out. A throttled client is
 * refused for every slot, and its own successes do not reset its count.
 * In-memory (one Railway instance); a restart forgives, which is acceptable.
 * Bounded: when full, expired entries go first, then the oldest entry that is
 * NOT currently throttled — flooding the table never frees a throttled client.
 */
const failuresByClient = new Map<string, { count: number; firstMs: number }>();

function isThrottled(f: { count: number; firstMs: number }): boolean {
  return f.count >= MAX_FAILED_PROOFS && now() - f.firstMs < THROTTLE_MS;
}

function clientThrottled(clientKey: string): boolean {
  const f = failuresByClient.get(clientKey);
  if (!f) return false;
  if (now() - f.firstMs >= THROTTLE_MS) {
    failuresByClient.delete(clientKey);
    return false;
  }
  return f.count >= MAX_FAILED_PROOFS;
}

function makeRoom(): void {
  if (failuresByClient.size < MAX_TRACKED_CLIENTS) return;
  for (const [k, f] of failuresByClient) {
    if (now() - f.firstMs >= THROTTLE_MS) failuresByClient.delete(k);
  }
  if (failuresByClient.size < MAX_TRACKED_CLIENTS) return;
  for (const [k, f] of failuresByClient) {
    if (!isThrottled(f)) {
      failuresByClient.delete(k);
      return;
    }
  }
}

function recordFailure(clientKey: string): void {
  const f = failuresByClient.get(clientKey);
  if (f && now() - f.firstMs < THROTTLE_MS) {
    f.count += 1;
    return;
  }
  failuresByClient.delete(clientKey);
  makeRoom();
  if (failuresByClient.size < MAX_TRACKED_CLIENTS) failuresByClient.set(clientKey, { count: 1, firstMs: now() });
}

function proofMatches(owner: OwnerRow, proof: string): boolean {
  const stored = Buffer.from(owner.proof_hash, 'hex');
  const given = hashProof(proof);
  if (stored.length !== given.length) return false;
  return crypto.timingSafeEqual(stored, given);
}

/** Existence + timestamp only; never save data. Needs no proof. */
export function getSaveMeta(playerId: string, saveType?: string): SaveMeta | null {
  if (typeof playerId !== 'string' || !PLAYER_ID_PATTERN.test(playerId)) return null;
  if (saveType !== undefined && !isSaveType(saveType)) return null;
  const d = db();
  const row = (saveType
    ? d.prepare('SELECT save_type, last_saved FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(playerId, saveType)
    : d.prepare('SELECT save_type, last_saved FROM cloud_saves WHERE player_id = ? ORDER BY last_saved DESC LIMIT 1').get(playerId)) as
    | { save_type: CloudSaveType; last_saved: string }
    | undefined;
  return row ? { exists: true, lastSaved: row.last_saved, saveType: row.save_type } : null;
}

/** Plain reads, no write lock: a flood of bogus reads must not stall saves. */
export function readSave(playerId: string, saveType: string, proof: string, clientKey = 'unknown'): ReadResult {
  if (!validIds(playerId, proof) || !isSaveType(saveType)) return { ok: false, reason: 'invalid' };
  if (clientThrottled(clientKey)) return { ok: false, reason: 'throttled' };
  const d = db();
  const owner = d.prepare('SELECT proof_hash FROM cloud_save_owners WHERE player_id = ?').get(playerId) as OwnerRow | undefined;
  if (!owner) return { ok: false, reason: 'not_found' };
  if (!proofMatches(owner, proof)) {
    recordFailure(clientKey);
    return { ok: false, reason: 'forbidden' };
  }
  const row = d.prepare('SELECT save_data, last_saved FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(playerId, saveType) as
    | { save_data: string; last_saved: string }
    | undefined;
  if (!row) return { ok: false, reason: 'not_found' };
  return { ok: true, saveData: row.save_data, lastSaved: row.last_saved, saveType };
}

export function writeSave(p: WriteParams): WriteResult {
  if (!validIds(p.playerId, p.proof) || !isSaveType(p.saveType)) return { ok: false, reason: 'invalid' };
  if (typeof p.saveData !== 'string' || p.saveData.length === 0) return { ok: false, reason: 'invalid' };
  if (Buffer.byteLength(p.saveData, 'utf8') > MAX_SAVE_BYTES) return { ok: false, reason: 'too_large' };
  const clientKey = p.clientKey || 'unknown';
  if (clientThrottled(clientKey)) return { ok: false, reason: 'throttled' };
  const saveVersion = typeof p.saveVersion === 'string' ? p.saveVersion.slice(0, 32) : null;
  const deviceId = typeof p.deviceId === 'string' ? p.deviceId.slice(0, 64) : null;
  const d = db();
  // IMMEDIATE: claim-or-verify, history and the upsert happen under one write
  // lock, so two first writes cannot both claim, and the old save is only ever
  // replaced in a single statement — never deleted first.
  return d.transaction((): WriteResult => {
    const owner = d.prepare('SELECT proof_hash FROM cloud_save_owners WHERE player_id = ?').get(p.playerId) as OwnerRow | undefined;
    const stamp = new Date(now()).toISOString();
    if (!owner) {
      d.prepare('INSERT INTO cloud_save_owners (player_id, proof_hash, claimed_at) VALUES (?, ?, ?)').run(p.playerId, hashProof(p.proof).toString('hex'), stamp);
    } else if (!proofMatches(owner, p.proof)) {
      recordFailure(clientKey);
      return { ok: false, reason: 'forbidden' };
    }
    const existing = d.prepare('SELECT save_data, last_saved FROM cloud_saves WHERE player_id = ? AND save_type = ?').get(p.playerId, p.saveType) as
      | { save_data: string; last_saved: string }
      | undefined;
    if (existing) {
      d.prepare('INSERT INTO cloud_save_history (player_id, save_type, save_data, last_saved, replaced_at) VALUES (?, ?, ?, ?, ?)')
        .run(p.playerId, p.saveType, existing.save_data, existing.last_saved, stamp);
      d.prepare(`
        DELETE FROM cloud_save_history WHERE player_id = ? AND save_type = ? AND id NOT IN (
          SELECT id FROM cloud_save_history WHERE player_id = ? AND save_type = ? ORDER BY id DESC LIMIT ?
        )
      `).run(p.playerId, p.saveType, p.playerId, p.saveType, HISTORY_DEPTH);
    }
    d.prepare(`
      INSERT INTO cloud_saves (player_id, save_type, save_data, save_version, device_id, last_saved)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (player_id, save_type) DO UPDATE SET
        save_data = excluded.save_data, save_version = excluded.save_version,
        device_id = excluded.device_id, last_saved = excluded.last_saved
    `).run(p.playerId, p.saveType, p.saveData, saveVersion, deviceId, stamp);
    return { ok: true, action: existing ? 'saved' : 'created' };
  }).immediate();
}

/** Test helpers. */
export function _countRows(playerId: string): number {
  return (db().prepare('SELECT COUNT(*) AS n FROM cloud_saves WHERE player_id = ?').get(playerId) as { n: number }).n;
}
export function _historyForTests(playerId: string, saveType: string): string[] {
  return (db().prepare('SELECT save_data FROM cloud_save_history WHERE player_id = ? AND save_type = ? ORDER BY id DESC').all(playerId, saveType) as Array<{ save_data: string }>).map((r) => r.save_data);
}
export function _corruptOwnerHashForTests(playerId: string, hash: string): void {
  if (process.env.RAILWAY_ENVIRONMENT) return;
  db().prepare('UPDATE cloud_save_owners SET proof_hash = ? WHERE player_id = ?').run(hash, playerId);
}
export function _trackedClientCount(): number {
  return failuresByClient.size;
}
export function _advanceClockForTests(ms: number): void {
  if (process.env.RAILWAY_ENVIRONMENT) return;
  _clockOffsetMs += ms;
}
