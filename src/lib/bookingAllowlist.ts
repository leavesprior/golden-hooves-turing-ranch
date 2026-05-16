import Database from 'better-sqlite3'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import type { BookingPlatform } from './bookingCodeFormat'

/**
 * Server-side booking verification allow-list.
 *
 * Schema:
 * - code: normalized booking confirmation code, stored uppercase.
 * - platform: booking source that issued the confirmation code.
 * - expiresAt: optional ISO timestamp after which the code no longer verifies.
 *
 * Keep this file server-only. The client may know regex formats for UX, but
 * only this allow-list decides whether a syntactically valid code is verified.
 * Leif can replace these seed entries with real confirmed bookings manually
 * or through a future owner/admin UI.
 *
 * Verified browser sessions are stored server-side and referenced by an
 * HttpOnly cookie. That keeps localStorage or client milestone edits from
 * being sufficient to unlock booking-gated content.
 */
export interface BookingAllowlistEntry {
  code: string
  platform: Exclude<BookingPlatform, 'unknown'>
  expiresAt?: string
}

export interface BookingVerificationSession {
  id: string
  code: string
  platform: Exclude<BookingPlatform, 'unknown'>
  verified_at: string
  expires_at: string
}

export const BOOKING_ALLOWLIST: BookingAllowlistEntry[] = [
  {
    code: 'BOBR-20260101-TEST',
    platform: 'bobr_direct',
  },
  {
    code: 'HMTEST1234',
    platform: 'hipcamp',
  },
  {
    code: 'HA-TEST1234',
    platform: 'hostaway',
  },
]

export function findAllowlistedBooking(code: string, platform: BookingPlatform): BookingAllowlistEntry | null {
  if (platform === 'unknown') return null

  const entry = BOOKING_ALLOWLIST.find(item => item.code === code && item.platform === platform)
  if (!entry) return null

  if (entry.expiresAt && Date.parse(entry.expiresAt) <= Date.now()) return null

  return entry
}

function getDbPath(): string {
  const volumePath = '/data'
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'booking_verifications.db')
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'booking_verifications.db')
}

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(getDbPath())
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS booking_verification_sessions (
        id          TEXT PRIMARY KEY,
        code        TEXT NOT NULL,
        platform    TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        expires_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_booking_verification_sessions_expires
        ON booking_verification_sessions (expires_at);
    `)
  }
  return _db
}

export function createBookingVerificationSession(
  entry: BookingAllowlistEntry,
): BookingVerificationSession {
  const verifiedAt = new Date()
  const expiresAt = entry.expiresAt ? new Date(entry.expiresAt) : new Date(verifiedAt)
  if (!entry.expiresAt) expiresAt.setDate(expiresAt.getDate() + 30)

  const session: BookingVerificationSession = {
    id: crypto.randomUUID(), // safe-mint: booking verification session id, not a reward or discount code
    code: entry.code,
    platform: entry.platform,
    verified_at: verifiedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }

  getDb().prepare(`
    INSERT INTO booking_verification_sessions
      (id, code, platform, verified_at, expires_at)
    VALUES
      (@id, @code, @platform, @verified_at, @expires_at)
  `).run(session)

  return session
}

export function getBookingVerificationSession(sessionId: string): BookingVerificationSession | null {
  const session = getDb().prepare(`
    SELECT *
      FROM booking_verification_sessions
     WHERE id = ?
       AND expires_at > ?
     LIMIT 1
  `).get(sessionId, new Date().toISOString()) as BookingVerificationSession | undefined

  return session ?? null
}
