import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { testDbPathOverride } from './discountCodesDb';

/**
 * Hall of Fame entries on the Railway /data volume (replaces the Notion store,
 * which is not configured in production as of 2026-09-26 — GET said "unavailable").
 * One row per player; a submission only replaces it with a higher score.
 * The anti-forgery guards (ceiling, rate limit, claim token) stay in the route.
 */

export interface LeaderboardEntry {
  playerName: string;
  playerId: string;
  score: number;
  trophyCount: number;
  trophies: string[];
  chapter: number;
  level: number;
  alignment: string;
  topFaction: string;
  timeEchoes: number;
  isNPC: boolean;
  submittedAt: string;
}

export interface SubmitParams {
  playerName: string;
  playerId: string;
  score: number;
  trophies?: unknown;
  chapter?: unknown;
  level?: unknown;
  alignment?: unknown;
  topFaction?: unknown;
  timeEchoes?: unknown;
  milestonesCount?: unknown;
  saddleStats?: unknown;
}

export type SubmitResult = { action: 'created' | 'updated' } | { action: 'skipped'; reason: string };

const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

let _db: Database.Database | null = null;

function getDbPath(): string {
  const override = testDbPathOverride(process.env);
  if (override) return override;
  try {
    if (fs.existsSync('/data') && fs.statSync('/data').isDirectory()) return path.join('/data', 'cloud_saves.db');
  } catch {
    // fall through
  }
  return path.join('/tmp', 'cloud_saves.db');
}

function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      player_id        TEXT PRIMARY KEY,
      player_name      TEXT NOT NULL,
      score            INTEGER NOT NULL,
      trophies         TEXT NOT NULL DEFAULT '[]',
      chapter          INTEGER NOT NULL DEFAULT 0,
      level            INTEGER NOT NULL DEFAULT 1,
      alignment        TEXT NOT NULL DEFAULT '',
      top_faction      TEXT NOT NULL DEFAULT '',
      time_echoes      INTEGER NOT NULL DEFAULT 0,
      milestones_count INTEGER NOT NULL DEFAULT 0,
      saddle_stats     TEXT,
      submitted_at     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries (score DESC);
  `);
  _db = db;
  return db;
}

const int = (v: unknown, dflt: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : dflt);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export function listEntries(limit: number, sinceIso?: string): LeaderboardEntry[] {
  const n = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 100));
  const db = getDb();
  const rows = (sinceIso
    ? db.prepare('SELECT * FROM leaderboard_entries WHERE submitted_at >= ? ORDER BY score DESC LIMIT ?').all(sinceIso, n)
    : db.prepare('SELECT * FROM leaderboard_entries ORDER BY score DESC LIMIT ?').all(n)) as Array<Record<string, unknown>>;
  return rows.map((r) => {
    let trophies: string[] = [];
    try {
      const t = JSON.parse(r.trophies as string);
      if (Array.isArray(t)) trophies = t.filter((x): x is string => typeof x === 'string');
    } catch {
      // keep empty
    }
    return {
      playerName: r.player_name as string,
      playerId: r.player_id as string,
      score: r.score as number,
      trophyCount: trophies.length,
      trophies,
      chapter: r.chapter as number,
      level: r.level as number,
      alignment: r.alignment as string,
      topFaction: r.top_faction as string,
      timeEchoes: r.time_echoes as number,
      isNPC: false,
      submittedAt: r.submitted_at as string,
    };
  });
}

/** Insert, or replace only when the new score is strictly higher. Caller validates score. */
export function submitEntry(p: SubmitParams): SubmitResult {
  const playerName = text(p.playerName, 40).trim();
  if (!playerName || typeof p.playerId !== 'string' || !PLAYER_ID_PATTERN.test(p.playerId)) {
    return { action: 'skipped', reason: 'Invalid player' };
  }
  const trophies = Array.isArray(p.trophies) ? p.trophies.filter((t): t is string => typeof t === 'string').slice(0, 100).map((t) => t.slice(0, 60)) : [];
  const saddle = p.saddleStats && typeof p.saddleStats === 'object' ? JSON.stringify(p.saddleStats).slice(0, 2000) : null;
  const db = getDb();
  return db.transaction((): SubmitResult => {
    const existing = db.prepare('SELECT score FROM leaderboard_entries WHERE player_id = ?').get(p.playerId) as { score: number } | undefined;
    if (existing && p.score <= existing.score) return { action: 'skipped', reason: 'Existing score is higher or equal' };
    db.prepare(`
      INSERT INTO leaderboard_entries (player_id, player_name, score, trophies, chapter, level, alignment, top_faction, time_echoes, milestones_count, saddle_stats, submitted_at)
      VALUES (@id, @name, @score, @trophies, @chapter, @level, @alignment, @faction, @echoes, @milestones, @saddle, @at)
      ON CONFLICT (player_id) DO UPDATE SET
        player_name = excluded.player_name, score = excluded.score, trophies = excluded.trophies,
        chapter = excluded.chapter, level = excluded.level, alignment = excluded.alignment,
        top_faction = excluded.top_faction, time_echoes = excluded.time_echoes,
        milestones_count = excluded.milestones_count, saddle_stats = excluded.saddle_stats,
        submitted_at = excluded.submitted_at
    `).run({
      id: p.playerId,
      name: playerName,
      score: Math.trunc(p.score),
      trophies: JSON.stringify(trophies),
      chapter: int(p.chapter, 0),
      level: int(p.level, 1),
      alignment: text(p.alignment, 40),
      faction: text(p.topFaction, 40),
      echoes: int(p.timeEchoes, 0),
      milestones: int(p.milestonesCount, 0),
      saddle,
      at: new Date().toISOString(),
    });
    return { action: existing ? 'updated' : 'created' };
  }).immediate();
}
