/**
 * Kid vs adult for Golden Frog Trail.
 * Kid: easier checks, fewer karma, slower SADDLE growth.
 * Adult: full DCs, +2 points/level. Local persist only.
 */

import { CATCH_MS, POWDER_MS } from './goldCountryAlley'

export type GftAgeMode = 'under18' | 'adult'

export const GFT_AGE_MODE_KEY = 'bobr_gft_age_mode'
export const KID_KARMA_SCALE = 0.4
export const KID_DC_RELIEF = 4
export const KID_LEVEL_STAT_POINTS = 1
export const ADULT_LEVEL_STAT_POINTS = 2
export const KID_CREATION_POINTS = 16
export const ADULT_CREATION_POINTS = 12
export const KID_ROLL_BONUS_POINTS = 8
export const ADULT_ROLL_BONUS_POINTS = 6

type StorageLike = { getItem(k: string): string | null; setItem?(k: string, v: string): void }

export function parseAgeMode(raw: string | null | undefined): GftAgeMode {
  return raw === 'under18' ? 'under18' : 'adult'
}

export function readAgeMode(storage?: StorageLike | null): GftAgeMode {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  return parseAgeMode(s?.getItem(GFT_AGE_MODE_KEY) ?? null)
}

export function writeAgeMode(mode: GftAgeMode, storage?: StorageLike | null): GftAgeMode {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(GFT_AGE_MODE_KEY, mode) } catch { /* ignore */ }
  return mode
}

export function isKidMode(storage?: StorageLike | null): boolean {
  return readAgeMode(storage) === 'under18'
}

export function scaleKarmaGrant(
  amount: number,
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  if (amount <= 0) return amount
  const m = mode ?? readAgeMode(storage)
  if (m !== 'under18') return amount
  // Fewer of every type, including tiny grants (1 and 2 become 0).
  return Math.max(0, Math.floor(amount * KID_KARMA_SCALE))
}

export function skillCheckDc(
  difficulty: number,
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  const m = mode ?? readAgeMode(storage)
  if (m !== 'under18') return difficulty
  return Math.max(1, difficulty - KID_DC_RELIEF)
}

export function levelUpStatPoints(
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  const m = mode ?? readAgeMode(storage)
  return m === 'under18' ? KID_LEVEL_STAT_POINTS : ADULT_LEVEL_STAT_POINTS
}

export function creationBonusPoints(
  rolled: boolean,
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  const m = mode ?? readAgeMode(storage)
  if (m === 'under18') return rolled ? KID_ROLL_BONUS_POINTS : KID_CREATION_POINTS
  return rolled ? ADULT_ROLL_BONUS_POINTS : ADULT_CREATION_POINTS
}

export function catchWindowMs(
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  const m = mode ?? readAgeMode(storage)
  return m === 'under18' ? CATCH_MS + 1500 : CATCH_MS
}

export function powderWindowMs(
  mode?: GftAgeMode,
  storage?: StorageLike | null,
): number {
  const m = mode ?? readAgeMode(storage)
  return m === 'under18' ? Math.round(POWDER_MS * 1.5) : POWDER_MS
}
