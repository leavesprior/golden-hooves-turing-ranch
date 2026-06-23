// Accounts DB — optional email + generated-credential account scaffolding for BOBR.
//
// SCOPE: account-creation + SESSION-MANAGEMENT scaffolding. NO authorization is wired
// yet — nothing here grants a privileged or value-bearing operation. Linking a session
// to an account is a bookkeeping step the future per-account karma-cost feature will
// hang off; today it confers no rights.
//
// Identity model: signing in is OPTIONAL. Guests keep the per-browser karma session id
// (getKarmaSessionId). Signing in creates an account keyed by email and LINKS the current
// guest session to it, so the account becomes the real "per-account" key that the
// per-account exponential karma-cost feature will hang off later.
//
// SECURITY (karma-grafting): a session id accrues karma + marker progress. A client must
// NOT be able to bind an arbitrary, attacker-chosen session id to an account (that would
// graft another player's karma onto the attacker, or an attacker's session onto a victim).
// linkSession therefore requires a server-verifiable ownership proof — the markerSession
// HMAC token the server issued for that session — NOT the raw request body. See linkSession.
//
// Persistence: the accounts DB MUST live on a durable volume in production (Railway:
// mount a /data volume). If /data is absent we fall back to /tmp, which is WIPED on every
// redeploy — getDbPath() refuses to start (throws) in production rather than silently
// losing accounts. See getDbPath().
//
// Stores ONLY: email, a scrypt KDF digest of the credential (never the raw secret),
// and the set of linked session ids. No raw credential, no plaintext password.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { verifySessionToken } from '@/lib/markerSession';

function getDbPath(): string {
  const volumePath = '/data';
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'accounts.db');
    }
  } catch {
    // fall through
  }
  // /data is absent. In production this means accounts would land in /tmp and be WIPED
  // on the next redeploy (unrecoverable account loss). Fail closed rather than mislead.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: /data volume not found. The accounts DB requires a durable volume in ' +
        'production (Railway: mount a /data volume). Refusing to fall back to /tmp, ' +
        'which is wiped on every redeploy and would silently lose all accounts.',
    );
  }
  // Non-production: /tmp is fine for local/dev. Make the impermanence loud anyway.
  console.error(
    '[accountsDb] WARNING: /data not found — using /tmp/accounts.db (NON-DURABLE). ' +
      'Set up a /data volume before any production use; /tmp is wiped on redeploy.',
  );
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
 * Ownership proof for linking a session to an account.
 *
 * The ONLY accepted proof is the markerSession HMAC token the server issued for that
 * (sessionId, difficulty) — see /api/record-bobr-marker. Holding it proves the client
 * legitimately started/progressed that session; it cannot be fabricated without the
 * server secret. This closes the karma-grafting vector: a client can no longer bind an
 * arbitrary session id (a victim's, or any high-karma session) to its account from the
 * request body alone.
 *
 * CONSTRAINT (documented limitation): a guest session that earned karma but never
 * recorded a marker has no marker token yet, so it cannot be linked. That is the safe
 * failure mode — refusing to link is strictly better than grafting unproven karma. If a
 * karma-only link path is needed later, it must mint its own server-issued session proof
 * (e.g. a signed token bound to the karma session) — NOT trust the request body.
 */
export interface SessionOwnershipProof {
  /** The markerSession HMAC token the server issued for this session (X-Marker-Token). */
  markerToken: string;
  /** The difficulty the marker session was created with (the token is bound to it). */
  difficulty: string;
}

/** Verify a client holds server-issued proof of ownership for `sessionId`. */
export function verifySessionOwnership(sessionId: string, proof: SessionOwnershipProof | null | undefined): boolean {
  if (!proof || typeof proof.markerToken !== 'string' || typeof proof.difficulty !== 'string') return false;
  return verifySessionToken(sessionId, proof.difficulty, proof.markerToken);
}

/**
 * Link a guest karma session id to an account (idempotent — re-linking just updates).
 * This is how an optional sign-in "upgrades" the current guest session to the account.
 *
 * GATED ON OWNERSHIP: refuses unless `proof` re-verifies as a server-issued ownership
 * token for `sessionId` (anti karma-grafting — see verifySessionOwnership). Returns true
 * if the link was written, false if ownership was not proven (the link is NOT written).
 * The function does NOT trust the caller to have checked — it re-verifies here so the
 * invariant holds even if a future route forgets the check.
 */
export function linkSession(sessionId: string, accountId: string, proof: SessionOwnershipProof): boolean {
  if (!verifySessionOwnership(sessionId, proof)) return false;
  getDb()
    .prepare(
      `INSERT INTO account_sessions (session_id, account_id, linked_at)
       VALUES (?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET account_id = excluded.account_id, linked_at = excluded.linked_at`
    )
    .run(sessionId, accountId, new Date().toISOString());
  return true;
}

/** Resolve which account (if any) a guest session id is linked to. */
export function getAccountIdForSession(sessionId: string): string | null {
  const row = getDb()
    .prepare('SELECT account_id FROM account_sessions WHERE session_id = ?')
    .get(sessionId) as { account_id: string } | undefined;
  return row?.account_id ?? null;
}
