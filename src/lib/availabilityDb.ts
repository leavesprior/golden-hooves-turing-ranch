import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { mintBookingCode } from './bookingCodes';

/**
 * Direct-Booking data store (Phase 0 foundations).
 *
 * Four tables back the direct-booking funnel:
 *   - availability  : blocked date ranges imported READ-ONLY from Airbnb/VRBO iCal
 *                     feeds (+ manual blocks). DTEND is EXCLUSIVE per RFC 5545.
 *   - inquiries     : "is X open?" contact captures (pre-booking).
 *   - bookings      : real request-to-book records (Phase 2 writes these).
 *   - subscribers   : email list (Phase 4 squeeze).
 *
 * Mirrors the singleton + /data→/tmp pattern used by workerDb.ts and
 * discountCodesDb.ts so deploys behave identically (Railway mounts /data).
 *
 * NOTHING here writes back to Airbnb/VRBO. Availability is import-only.
 */

export type BlockSource = 'airbnb' | 'vrbo' | 'manual';

export interface AvailabilityBlock {
  source: BlockSource;
  uid: string;           // VEVENT UID (or synthesized for manual blocks)
  start_date: string;    // YYYY-MM-DD, inclusive (first blocked night)
  end_date: string;      // YYYY-MM-DD, EXCLUSIVE (checkout day — iCal DTEND)
  summary: string;       // e.g. "Reserved", "Airbnb (Not available)", "Blocked"
  synced_at: string;     // ISO timestamp of the import that produced this row
}

export interface Inquiry {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  check_in: string | null;   // YYYY-MM-DD
  check_out: string | null;  // YYYY-MM-DD
  guests: number | null;
  message: string | null;
  status: string;            // new | responded | converted | closed
  confirmation_code: string | null;  // BOOK-XXXXXX; minted at create-time
}

export interface Booking {
  id: string;
  created_at: string;
  inquiry_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  check_in: string;          // YYYY-MM-DD
  check_out: string;         // YYYY-MM-DD
  guests: number;
  nights: number;
  quote_total: number;
  deposit_amount: number;
  deposit_method: string | null;     // qr | stripe | null
  status: string;            // requested | deposit_pending | confirmed | cancelled
  source: string;            // direct | game | ...
  confirmation_code: string | null;  // BOOK-XXXXXX; copied from inquiry or minted
  host_verified_at: string | null;   // ISO ts when host flipped to confirmed
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  source: string;            // squeeze | inquiry | giveaway
  confirmed: number;         // 0 | 1
  unsubscribed_at: string | null;
}

function getDbPath(): string {
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'direct_booking.db');
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'direct_booking.db');
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const dbPath = getDbPath();
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS availability (
        source     TEXT NOT NULL,
        uid        TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date   TEXT NOT NULL,
        summary    TEXT NOT NULL DEFAULT 'Blocked',
        synced_at  TEXT NOT NULL,
        PRIMARY KEY (source, uid)
      );
      CREATE INDEX IF NOT EXISTS idx_availability_range
        ON availability (start_date, end_date);

      CREATE TABLE IF NOT EXISTS inquiries (
        id                TEXT PRIMARY KEY,
        created_at        TEXT NOT NULL,
        name              TEXT NOT NULL,
        email             TEXT NOT NULL,
        phone             TEXT,
        check_in          TEXT,
        check_out         TEXT,
        guests            INTEGER,
        message           TEXT,
        status            TEXT NOT NULL DEFAULT 'new',
        confirmation_code TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_inquiries_status
        ON inquiries (status, created_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_conf_code
        ON inquiries (confirmation_code) WHERE confirmation_code IS NOT NULL;

      CREATE TABLE IF NOT EXISTS bookings (
        id                TEXT PRIMARY KEY,
        created_at        TEXT NOT NULL,
        inquiry_id        TEXT,
        name              TEXT NOT NULL,
        email             TEXT NOT NULL,
        phone             TEXT,
        check_in          TEXT NOT NULL,
        check_out         TEXT NOT NULL,
        guests            INTEGER NOT NULL,
        nights            INTEGER NOT NULL,
        quote_total       REAL NOT NULL DEFAULT 0,
        deposit_amount    REAL NOT NULL DEFAULT 0,
        deposit_method    TEXT,
        status            TEXT NOT NULL DEFAULT 'requested',
        source            TEXT NOT NULL DEFAULT 'direct',
        confirmation_code TEXT,
        host_verified_at  TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_bookings_dates
        ON bookings (check_in, check_out);
      CREATE INDEX IF NOT EXISTS idx_bookings_status
        ON bookings (status, created_at);

      CREATE TABLE IF NOT EXISTS subscribers (
        id              TEXT PRIMARY KEY,
        email           TEXT NOT NULL UNIQUE,
        created_at      TEXT NOT NULL,
        source          TEXT NOT NULL DEFAULT 'squeeze',
        confirmed       INTEGER NOT NULL DEFAULT 0,
        unsubscribed_at TEXT
      );
    `);

    // Defensive migrations — for DBs created before Phase 2 added these columns.
    // ALTER throws if the column already exists; swallow that.
    for (const stmt of [
      'ALTER TABLE inquiries ADD COLUMN confirmation_code TEXT',
      'ALTER TABLE bookings ADD COLUMN confirmation_code TEXT',
      'ALTER TABLE bookings ADD COLUMN host_verified_at TEXT',
    ]) {
      try { _db.exec(stmt); } catch { /* column already exists */ }
    }
  }
  return _db;
}

/* ----------------------------- availability ----------------------------- */

/**
 * Replace ALL blocks for a single source in one transaction.
 *
 * Full-replace (not upsert) is deliberate: an iCal feed is the complete current
 * truth for that channel, so a freed/cancelled date simply vanishes from the
 * next export. Wiping the source's rows and re-inserting the current set makes
 * "date got freed" handle itself, and keeps imports idempotent.
 */
export function dbReplaceSourceBlocks(
  source: BlockSource,
  blocks: Array<Omit<AvailabilityBlock, 'source' | 'synced_at'>>,
): number {
  const db = getDb();
  const syncedAt = new Date().toISOString();

  const run = db.transaction((rows: Array<Omit<AvailabilityBlock, 'source' | 'synced_at'>>) => {
    db.prepare('DELETE FROM availability WHERE source = ?').run(source);
    const insert = db.prepare(`
      INSERT INTO availability (source, uid, start_date, end_date, summary, synced_at)
      VALUES (@source, @uid, @start_date, @end_date, @summary, @synced_at)
    `);
    for (const r of rows) {
      insert.run({ ...r, source, synced_at: syncedAt });
    }
    return rows.length;
  });

  return run(blocks);
}

export function dbGetAllBlocks(): AvailabilityBlock[] {
  return getDb()
    .prepare('SELECT * FROM availability ORDER BY start_date ASC')
    .all() as AvailabilityBlock[];
}

/**
 * Blocks that overlap the half-open window [rangeStart, rangeEnd).
 * A block [s, e) overlaps the window when s < rangeEnd AND e > rangeStart.
 */
export function dbGetBlocksInRange(rangeStart: string, rangeEnd: string): AvailabilityBlock[] {
  return getDb()
    .prepare(`
      SELECT * FROM availability
       WHERE start_date < ? AND end_date > ?
       ORDER BY start_date ASC
    `)
    .all(rangeEnd, rangeStart) as AvailabilityBlock[];
}

export interface SyncMeta {
  source: BlockSource;
  block_count: number;
  last_synced_at: string | null;
}

/** Per-source sync summary — powers the admin dashboard freshness display. */
export function dbGetSyncMeta(): SyncMeta[] {
  const rows = getDb()
    .prepare(`
      SELECT source,
             COUNT(*)      AS block_count,
             MAX(synced_at) AS last_synced_at
        FROM availability
       GROUP BY source
    `)
    .all() as Array<{ source: BlockSource; block_count: number; last_synced_at: string | null }>;
  return rows;
}

/* ------------------------------- inquiries ------------------------------ */

export function dbCreateInquiry(
  input: Omit<Inquiry, 'id' | 'created_at' | 'status' | 'confirmation_code'> & {
    status?: string;
    confirmation_code?: string | null;
  },
): Inquiry {
  const db = getDb();
  // Loop on UNIQUE collision — astronomically rare in 31^6 space, but cheap.
  for (let attempt = 0; attempt < 5; attempt++) {
    const row: Inquiry = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: input.status ?? 'new',
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      check_in: input.check_in ?? null,
      check_out: input.check_out ?? null,
      guests: input.guests ?? null,
      message: input.message ?? null,
      confirmation_code: input.confirmation_code ?? mintBookingCode(),
    };
    try {
      db.prepare(`
        INSERT INTO inquiries
          (id, created_at, name, email, phone, check_in, check_out, guests,
           message, status, confirmation_code)
        VALUES
          (@id, @created_at, @name, @email, @phone, @check_in, @check_out, @guests,
           @message, @status, @confirmation_code)
      `).run(row);
      return row;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('UNIQUE') && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error('dbCreateInquiry: failed to allocate unique confirmation code');
}

export function dbGetInquiries(status?: string): Inquiry[] {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC')
      .all(status) as Inquiry[];
  }
  return db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() as Inquiry[];
}

export function dbGetInquiryByCode(code: string): Inquiry | null {
  const row = getDb()
    .prepare('SELECT * FROM inquiries WHERE confirmation_code = ?')
    .get(code) as Inquiry | undefined;
  return row ?? null;
}

/* -------------------------------- bookings ------------------------------ */

export function dbCreateBooking(
  input: Omit<Booking, 'id' | 'created_at' | 'status' | 'nights' | 'confirmation_code' | 'host_verified_at'> & {
    status?: string;
    nights?: number;
    confirmation_code?: string | null;
  },
): Booking {
  const nights = input.nights ?? nightsBetween(input.check_in, input.check_out);
  const row: Booking = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    inquiry_id: input.inquiry_id ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    check_in: input.check_in,
    check_out: input.check_out,
    guests: input.guests,
    nights,
    quote_total: input.quote_total ?? 0,
    deposit_amount: input.deposit_amount ?? 0,
    deposit_method: input.deposit_method ?? null,
    status: input.status ?? 'requested',
    source: input.source ?? 'direct',
    confirmation_code: input.confirmation_code ?? null,
    host_verified_at: null,
  };
  getDb().prepare(`
    INSERT INTO bookings
      (id, created_at, inquiry_id, name, email, phone, check_in, check_out,
       guests, nights, quote_total, deposit_amount, deposit_method, status, source,
       confirmation_code, host_verified_at)
    VALUES
      (@id, @created_at, @inquiry_id, @name, @email, @phone, @check_in, @check_out,
       @guests, @nights, @quote_total, @deposit_amount, @deposit_method, @status, @source,
       @confirmation_code, @host_verified_at)
  `).run(row);
  return row;
}

export function dbGetBookings(status?: string): Booking[] {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC')
      .all(status) as Booking[];
  }
  return db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all() as Booking[];
}

export function dbGetBookingById(id: string): Booking | null {
  const row = getDb()
    .prepare('SELECT * FROM bookings WHERE id = ?')
    .get(id) as Booking | undefined;
  return row ?? null;
}

/** Flip a booking to confirmed + insert a manual block onto availability.
 *  Transactional so a partial state (confirmed without block, or vice versa)
 *  never persists. Returns the updated booking, or null if booking_id unknown. */
export function dbHostVerifyBooking(bookingId: string): Booking | null {
  const db = getDb();
  const verifyAt = new Date().toISOString();
  const tx = db.transaction(() => {
    const booking = db
      .prepare('SELECT * FROM bookings WHERE id = ?')
      .get(bookingId) as Booking | undefined;
    if (!booking) return null;

    db.prepare(`
      UPDATE bookings
         SET status = 'confirmed', host_verified_at = ?
       WHERE id = ?
    `).run(verifyAt, bookingId);

    // Stamp a manual availability block so the calendar instantly reflects.
    db.prepare(`
      INSERT OR REPLACE INTO availability
        (source, uid, start_date, end_date, summary, synced_at)
      VALUES
        ('manual', ?, ?, ?, ?, ?)
    `).run(
      `booking:${bookingId}`,
      booking.check_in,
      booking.check_out,
      `Direct booking — ${booking.name}`,
      verifyAt,
    );

    return {
      ...booking,
      status: 'confirmed',
      host_verified_at: verifyAt,
    } as Booking;
  });
  return tx();
}

/* ------------------------------ subscribers ----------------------------- */

export function dbAddSubscriber(email: string, source = 'squeeze'): Subscriber {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM subscribers WHERE email = ?')
    .get(normalized) as Subscriber | undefined;
  if (existing) return existing;

  const row: Subscriber = {
    id: crypto.randomUUID(),
    email: normalized,
    created_at: new Date().toISOString(),
    source,
    confirmed: 0,
    unsubscribed_at: null,
  };
  db.prepare(`
    INSERT INTO subscribers (id, email, created_at, source, confirmed, unsubscribed_at)
    VALUES (@id, @email, @created_at, @source, @confirmed, @unsubscribed_at)
  `).run(row);
  return row;
}

export function dbGetSubscribers(): Subscriber[] {
  return getDb()
    .prepare('SELECT * FROM subscribers WHERE unsubscribed_at IS NULL ORDER BY created_at DESC')
    .all() as Subscriber[];
}

/* -------------------------------- helpers ------------------------------- */

/** Whole nights between two YYYY-MM-DD dates (UTC, DST-safe). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
