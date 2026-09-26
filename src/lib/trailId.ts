/**
 * Trail ID — the name of a player's cloud save slot: BOBR-XXXX-XXXX-XXXX.
 *
 * 12 Crockford base-32 symbols (60 random bits; no I, L, O or U), so it can be
 * written on paper and typed on another device. It only LOCATES a save — the
 * passphrase still encrypts it and proves ownership (saveProof.ts). It is kept
 * private (never shown on the Hall of Fame) so nobody can claim it first.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const TRAIL_ID_PATTERN = /^BOBR-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}$/
const LEGACY_SLOT_PATTERN = /^slot_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function generateTrailId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  // 256 is a multiple of 32, so taking the low 5 bits is unbiased.
  const s = Array.from(bytes, (b) => ALPHABET[b & 31]).join('')
  return `BOBR-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`
}

/** Canonical Trail ID from what a player typed, or null if it cannot be one. */
export function normalizeTrailId(input: string): string | null {
  const trimmed = input.trim()
  // Legacy ids are lowercase uuids; phones may auto-capitalize what is typed.
  if (LEGACY_SLOT_PATTERN.test(trimmed.toLowerCase())) return trimmed.toLowerCase()
  let s = trimmed.toUpperCase().replace(/[\s\-‐-―−_]/g, '')
  if (s.startsWith('BOBR') && s.length === 16) s = s.slice(4)
  if (s.length !== 12) return null
  s = s.replace(/O/g, '0').replace(/[IL]/g, '1')
  for (const ch of s) if (!ALPHABET.includes(ch)) return null
  return `BOBR-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`
}
