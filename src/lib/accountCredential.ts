// Account credential crypto — generate a true-random >=512-bit credential, hash it
// for at-rest storage with a memory-hard KDF, and (optionally, GATED) mix in live QSD
// entropy from Neoma at home.
//
// SECURITY MODEL (read before changing anything here):
//  - The credential is a SERVER/CLIENT-generated high-entropy secret (a recovery-key
//    model), NOT a user-chosen password. The user is shown the secret ONCE and the
//    server stores ONLY a salted, memory-hard KDF digest of it. The raw secret is
//    never persisted server-side.
//  - KDF = Node's built-in scrypt (memory-hard, in-stdlib, no native dep). This
//    satisfies the "slow KDF, not bare SHA-512" requirement. (argon2id would also be
//    fine but needs a native package we don't want in the launch build; scrypt is the
//    standards-grade in-stdlib choice. Documented substitution.)
//  - QSD entropy is LOW-entropy and public-ish (7 grid power meters, ~60Hz, correlated).
//    It MUST NEVER be the sole entropy source. When enabled, it is MIXED with CSPRNG via
//    HKDF — the CSPRNG bytes alone already meet the full security bar; QSD only ADDS.
//  - QSD mixing is GATED: it requires the Neoma relay/presence path (MAJOR/Grok-before)
//    and ACCOUNT_QSD_ENTROPY_ENABLED=1. Until then, credentials are pure CSPRNG (safe).

import crypto from 'crypto';

/** Credential strength: 512 bits = 64 bytes of CSPRNG. (>= the requested 512.) */
export const CREDENTIAL_BITS = 512;
const CREDENTIAL_BYTES = CREDENTIAL_BITS / 8; // 64

// scrypt parameters (memory-hard). N=2^15 is a good server-side cost for a high-entropy
// secret; r=8, p=1 are standard. keylen 64 -> 512-bit stored digest.
const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024; // headroom for N=2^15

/** Whether the GATED QSD-entropy contribution is active. Default OFF (pure CSPRNG). */
export function qsdEntropyEnabled(): boolean {
  return process.env.ACCOUNT_QSD_ENTROPY_ENABLED === '1';
}

/**
 * Generate a true-random >=512-bit credential.
 *
 * Base entropy is always OS CSPRNG (crypto.randomBytes) — by itself this fully meets
 * the security bar. If GATED QSD entropy is provided AND enabled, it is folded in via
 * HKDF-SHA512 (extract+expand) so the result is >= the CSPRNG input's entropy and never
 * weaker. QSD is additive seasoning, never the sole or dominant source.
 *
 * @param qsdSeed optional raw bytes derived from a live QSD reading (from the gated relay)
 * @returns { secretHex } the credential to show the user ONCE (never stored raw)
 */
export function generateCredential(qsdSeed?: Buffer | null): { secretHex: string; entropySource: string } {
  const csprng = crypto.randomBytes(CREDENTIAL_BYTES); // 64 bytes, the security floor

  if (qsdSeed && qsdSeed.length > 0 && qsdEntropyEnabled()) {
    // HKDF: IKM = csprng || qsd ; salt = fresh random ; the output is >= csprng entropy.
    // Even if qsdSeed were attacker-known, the csprng IKM keeps full strength.
    const salt = crypto.randomBytes(32);
    const ikm = Buffer.concat([csprng, qsdSeed]);
    const derived = Buffer.from(
      crypto.hkdfSync('sha512', ikm, salt, Buffer.from('bobr-account-credential-v1'), CREDENTIAL_BYTES)
    );
    return { secretHex: derived.toString('hex'), entropySource: 'csprng+qsd' };
  }

  return { secretHex: csprng.toString('hex'), entropySource: 'csprng' };
}

/**
 * Hash a credential for at-rest storage with scrypt (memory-hard).
 * Returns a self-describing string: scrypt$N$r$p$saltHex$digestHex
 */
export function hashCredential(secretHex: string): string {
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(secretHex, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${digest.toString('hex')}`;
}

/**
 * Verify a presented credential against a stored scrypt hash, in constant time.
 */
export function verifyCredential(secretHex: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = Buffer.from(parts[4], 'hex');
    const expected = Buffer.from(parts[5], 'hex');
    const actual = crypto.scryptSync(secretHex, salt, expected.length, {
      N, r, p, maxmem: SCRYPT_MAXMEM,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Normalize/validate an email (lightweight; we are not an email-validation service). */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  // simple, permissive RFC-ish check; max len guards abuse
  if (e.length < 3 || e.length > 254) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  return e;
}

/** Validate that a presented credential is a plausible >=512-bit hex secret. */
export function isWellFormedCredential(secretHex: unknown): secretHex is string {
  return typeof secretHex === 'string'
    && /^[0-9a-f]+$/i.test(secretHex)
    && secretHex.length >= CREDENTIAL_BYTES * 2; // >= 128 hex chars = 512 bits
}
