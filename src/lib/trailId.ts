/**
 * Trail ID — the name of a player's cloud save slot: TRAIL-XXXX-XXXX-XXXX.
 *
 * 12 Crockford base-32 symbols (60 random bits; no I, L, O or U), so it can be
 * written on paper and typed on another device. It only LOCATES a save — the
 * passphrase still encrypts it and proves ownership (saveProof.ts). It is kept
 * private (never shown on the Hall of Fame) so nobody can claim it first.
 *
 * Prefix TRAIL-, never BOBR-: the BOBR- namespace belongs to discount codes
 * (the reward guard enforces it), and a guest must never mistake a save
 * locator for a discount. Ids issued briefly as BOBR-… keep their exact name.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const SYMBOLS = '[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}'
export const TRAIL_ID_PATTERN = new RegExp(`^TRAIL-${SYMBOLS}-${SYMBOLS}-${SYMBOLS}$`)
const LEGACY_SLOT_PATTERN = /^slot_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function grouped(body: string): string {
  return [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)].join('-')
}

export function generateTrailId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  // 256 is a multiple of 32, so taking the low 5 bits is unbiased.
  const body = Array.from(bytes, (b) => ALPHABET[b & 31]).join('')
  return 'TRAIL-' + grouped(body)
}

/** Canonical Trail ID from what a player typed, or null if it cannot be one. */
export function normalizeTrailId(input: string): string | null {
  const trimmed = input.trim()
  // Legacy ids are lowercase uuids; phones may auto-capitalize what is typed.
  if (LEGACY_SLOT_PATTERN.test(trimmed.toLowerCase())) return trimmed.toLowerCase()
  let s = trimmed.toUpperCase().replace(/[\s\-‐-―−_]/g, '')
  let legacyPrefix = false
  if (s.startsWith('TRAIL') && s.length === 17) s = s.slice(5)
  else if (s.startsWith('BOBR') && s.length === 16) {
    s = s.slice(4)
    legacyPrefix = true
  }
  if (s.length !== 12) return null
  s = s.replace(/O/g, '0').replace(/[IL]/g, '1')
  for (const ch of s) if (!ALPHABET.includes(ch)) return null
  // safe-mint: a save-slot locator issued before the TRAIL- prefix, not a reward code
  return (legacyPrefix ? 'BOBR-' : 'TRAIL-') + grouped(s)
}
