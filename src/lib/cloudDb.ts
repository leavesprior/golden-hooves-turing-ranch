import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { testDbPathOverride } from './discountCodesDb';

/**
 * The one connection to cloud_saves.db (cloud saves + Hall of Fame).
 * One opener, so two modules never hold separate writers on the same file.
 *
 * Production FAILS CLOSED: without a writable /data volume it throws, and the
 * routes answer 503. It never falls back to /tmp, where a "saved" reply would
 * be a lie that the next redeploy erases (council 20260926_141619_secure-save).
 * /tmp is for local development only.
 */

let _db: Database.Database | null = null;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);
}

function dataDir(): string {
  return process.env.BOBR_CLOUD_DATA_DIR || '/data';
}

function volumeWritable(dir: string): boolean {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getDbPath(): string {
  const override = testDbPathOverride(process.env);
  if (override) return override;
  const dir = dataDir();
  if (volumeWritable(dir)) return path.join(dir, 'cloud_saves.db');
  if (isProduction()) {
    throw new Error(`cloud store unavailable: volume ${dir} is missing or not writable`);
  }
  return path.join('/tmp', 'cloud_saves.db');
}

export function getCloudDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  _db = db;
  return db;
}
