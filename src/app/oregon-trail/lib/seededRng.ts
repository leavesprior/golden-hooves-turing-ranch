/**
 * Deterministic seeded PRNG for the Oregon Trail reducer's pure state-transition
 * path (B3 — restore the reducer purity contract; reducer.ts header says the
 * engine functions are a "pure state transform, no side effects", yet several
 * actions historically called Math.random() inline).
 *
 * Design:
 *   - Pure, no module-level globals. The (seed, cursor) pair lives in game state;
 *     advancing the stream means advancing the cursor in the returned state.
 *   - mulberry32 mixing applied to (seed XOR cursor-derived value) so that for a
 *     FIXED (seed, cursor) the output is always identical, and successive cursors
 *     produce a well-distributed sequence in [0, 1).
 *   - Matches the spirit of the prologue `seededRandom` (a small deterministic
 *     hash → [0,1)), generalised to an indexable stream.
 *
 * Usage contract (purity threading):
 *   An engine/action that draws K randoms reads (prev.rngSeed, prev.rngCursor),
 *   consumes nextRandom(seed, cursor + 0 .. K-1), and RETURNS the advanced cursor
 *   (prev.rngCursor + K) in the new state. The reducer itself stays pure.
 */

/** mulberry32 — a fast, well-distributed 32-bit PRNG step. Pure. */
function mulberry32(a: number): number {
  let t = (a + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Deterministic random in [0, 1) for a given (seed, cursor).
 * Pure: same inputs → same output, always. Distinct cursors give distinct,
 * well-spread values for the same seed.
 */
export function nextRandom(seed: number, cursor: number): number {
  // Fold the cursor into the seed with a different mixing constant per position
  // so adjacent cursors don't produce correlated outputs.
  const mixed = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(cursor | 0, 0x85ebca6b)) | 0
  return mulberry32(mixed)
}

/**
 * Deterministic integer in [0, maxExclusive) for a given (seed, cursor).
 * Behaviour-equivalent to `Math.floor(Math.random() * maxExclusive)`.
 */
export function nextInt(seed: number, cursor: number, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0
  return Math.floor(nextRandom(seed, cursor) * maxExclusive)
}

/**
 * Derive a stable 31-bit seed from a string (for legacy-save migration where no
 * rngSeed was persisted). Same string → same seed. Mirrors the prologue
 * seededRandom hashing style.
 */
export function seedFromString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  // Map to a non-negative 31-bit integer to match new-game seed range.
  return Math.abs(hash) % 0x7fffffff
}

/** Generate a fresh new-game seed. The single Math.random() permitted at game
 * creation — it only PICKS the seed; all in-game draws are deterministic from it. */
export function freshSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}
