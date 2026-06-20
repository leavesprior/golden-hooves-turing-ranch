// Accounts DB — optional email + generated-credential sign-in for BOBR.
//
// Identity model: signing in is OPTIONAL. Guests keep the per-browser karma session id
// (getKarmaSessionId). Signing in creates an account keyed by email and LINKS the current
// guest session to it, so the account becomes the real "per-account" key that the
// per-account exponential karma-cost feature will hang off later.
//
// Stores ONLY: email, a scrypt KDF digest of the credential (never the raw secret),
// and the set of linked session ids. No raw credential, no plaintext password.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

function getDbPath(): string {
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'accounts.db');
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'accounts.db');
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(getDbPath());
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id              TEXT PRIMARY KEY,
        email           TEXT NOT NULL UNIQUE,
        credential_hash TEXT NOT NULL,          -- scrypt$N$r$p$salt$digest (NEVER the raw secret)
        entropy_source  TEXT NOT NULL DEFAULT 'csprng',
        created_at      TEXT NOT NULL,
        last_login_at   TEXT
      );
      CREATE TABLE IF NOT EXISTS account_sessions (
        session_id  TEXT PRIMARY KEY,           -- the guest karma session id
        account_id  TEXT NOT NULL,
        linked_at   TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
      CREATE INDEX IF NOT EXISTS idx_account_sessions_account ON account_sessions(account_id);
    `);
  }
  return _db;
}

export interface AccountRow {
  id: string;
  email: string;
  credential_hash: string;
  entropy_source: string;
  created_at: string;
  last_login_at: string | null;
}

export function getAccountByEmail(email: string): AccountRow | undefined {
  return getDb()
    .prepare('SELECT * FROM accounts WHERE email = ?')
    .get(email) as AccountRow | undefined;
}

export function getAccountById(id: string): AccountRow | undefined {
  return getDb()
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(id) as AccountRow | undefined;
}

/**
 * Create an account. Returns the new account id, or null if the email already exists.
 * credentialHash MUST already be a scrypt digest (caller hashes the raw secret first).
 */
export function createAccount(params: {
  email: string;
  credentialHash: string;
  entropySource: string;
}): string | null {
  const existing = getAccountByEmail(params.email);
  if (existing) return null;
  const id = `acct_${crypto.randomBytes(12).toString('hex')}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO accounts (id, email, credential_hash, entropy_source, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, params.email, params.credentialHash, params.entropySource, now, now);
  return id;
}

/** Record a successful login timestamp. */
export function touchLogin(accountId: string): void {
  getDb()
    .prepare('UPDATE accounts SET last_login_at = ? WHERE id = ?')
    .run(new Date().toISOString(), accountId);
}

/**
 * Link a guest karma session id to an account (idempotent — re-linking just updates).
 * This is how an optional sign-in "upgrades" the current guest session to the account.
 */
export function linkSession(sessionId: string, accountId: string): void {
  getDb()
    .prepare(
      `INSERT INTO account_sessions (session_id, account_id, linked_at)
       VALUES (?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET account_id = excluded.account_id, linked_at = excluded.linked_at`
    )
    .run(sessionId, accountId, new Date().toISOString());
}

/** Resolve which account (if any) a guest session id is linked to. */
export function getAccountIdForSession(sessionId: string): string | null {
  const row = getDb()
    .prepare('SELECT account_id FROM account_sessions WHERE session_id = ?')
    .get(sessionId) as { account_id: string } | undefined;
  return row?.account_id ?? null;
}
