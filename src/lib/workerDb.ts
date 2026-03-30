import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface WorkerEntry {
  id: string;
  date: string;           // YYYY-MM-DD
  hours: number;
  description: string;
  condition: string;      // regular | snow | summer
  applies_to: string;     // month key e.g. "2026-02" or "cash"
  rate: number;           // $/hr effective
  rent_value: number;     // $ credited toward rent (0 for cash entries)
  cash_value: number;     // $ cash earned (0 for rent entries)
  worker_name: string;
  created_at: string;     // ISO timestamp
}

function getDbPath(): string {
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'worker.db');
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'worker.db');
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const dbPath = getDbPath();
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS worker_entries (
        id          TEXT PRIMARY KEY,
        date        TEXT NOT NULL,
        hours       REAL NOT NULL,
        description TEXT NOT NULL,
        condition   TEXT NOT NULL DEFAULT 'regular',
        applies_to  TEXT NOT NULL,
        rate        REAL NOT NULL,
        rent_value  REAL NOT NULL DEFAULT 0,
        cash_value  REAL NOT NULL DEFAULT 0,
        worker_name TEXT NOT NULL DEFAULT 'Mike Fisher',
        created_at  TEXT NOT NULL
      )
    `);
  }
  return _db;
}

export function dbGetAllEntries(): WorkerEntry[] {
  return getDb()
    .prepare('SELECT * FROM worker_entries ORDER BY date DESC, created_at DESC')
    .all() as WorkerEntry[];
}

export function dbCreateEntry(entry: Omit<WorkerEntry, 'created_at'>): WorkerEntry {
  const full: WorkerEntry = { ...entry, created_at: new Date().toISOString() };
  getDb().prepare(`
    INSERT INTO worker_entries
      (id, date, hours, description, condition, applies_to, rate, rent_value, cash_value, worker_name, created_at)
    VALUES
      (@id, @date, @hours, @description, @condition, @applies_to, @rate, @rent_value, @cash_value, @worker_name, @created_at)
  `).run(full);
  return full;
}

export function dbDeleteEntry(id: string): boolean {
  const result = getDb().prepare('DELETE FROM worker_entries WHERE id = ?').run(id);
  return result.changes > 0;
}
