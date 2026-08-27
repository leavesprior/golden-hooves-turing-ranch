/**
 * Arcade level ladder after the Golden Frog Trail.
 *
 * After each level: take the QR stay voucher, or continue.
 * Floor percent = 5% × level (L1=5, L2=10, L3=15). Host still verifies.
 * After L3 there is no L4 percent — guests earn gifts during the ranch stay.
 *
 * Local persist only. No client-side monetary mint.
 */

import {
  POST_WIN_CHOICE_KEY,
  type PostWinChoice,
  type StorageLike,
} from './arcadeFirstLevel'

export const LEVEL_DISCOUNT_STEP = 5
export const MAX_DISCOUNT_LEVEL = 3

export type ArcadeLevel = 1 | 2 | 3

export type StayGiftId = 'ranch_cookies' | 'trail_map' | 'wildcare_token'

export type StayGift = {
  id: StayGiftId
  name: string
  when: string
}

export const STAY_GIFTS: readonly StayGift[] = [
  { id: 'ranch_cookies', name: 'Ranch-house cookies', when: 'On the table the afternoon you check in' },
  { id: 'trail_map', name: 'Porch trail map', when: 'Folded on the pillow' },
  { id: 'wildcare_token', name: 'Wildcare token', when: 'A ranch gift you can spend at the Karma Market during the stay' },
]

export const STAY_GIFTS_KEY = 'bobr_stay_gifts'

export function discountFloorForLevel(level: ArcadeLevel): number {
  const n = level < 1 ? 1 : level > MAX_DISCOUNT_LEVEL ? MAX_DISCOUNT_LEVEL : level
  return LEVEL_DISCOUNT_STEP * n
}

export function postWinChoiceKey(level: ArcadeLevel): string {
  return level === 1 ? POST_WIN_CHOICE_KEY : `bobr_post_win_choice_l${level}`
}

export function readLevelPostWinChoice(
  level: ArcadeLevel,
  storage?: StorageLike | null,
): PostWinChoice {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const v = s?.getItem(postWinChoiceKey(level))
  if (v === 'take_discount' || v === 'risk_next') return v
  return null
}

export function writeLevelPostWinChoice(
  level: ArcadeLevel,
  choice: Exclude<PostWinChoice, null>,
  storage?: StorageLike | null,
): void {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(postWinChoiceKey(level), choice) } catch { /* ignore */ }
}

export type StayGiftsState = {
  unlocked: boolean
  unlockedAt: string | null
}

export function readStayGifts(storage?: StorageLike | null): StayGiftsState {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const raw = s?.getItem(STAY_GIFTS_KEY)
  if (!raw) return { unlocked: false, unlockedAt: null }
  try {
    const parsed = JSON.parse(raw) as { unlocked?: boolean; unlockedAt?: string | null }
    return {
      unlocked: parsed.unlocked === true,
      unlockedAt: typeof parsed.unlockedAt === 'string' ? parsed.unlockedAt : null,
    }
  } catch {
    return { unlocked: false, unlockedAt: null }
  }
}

export function unlockStayGifts(storage?: StorageLike | null, at = new Date().toISOString()): StayGiftsState {
  const next: StayGiftsState = { unlocked: true, unlockedAt: at }
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(STAY_GIFTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

/** One-shot XP at each between-level screen. 100 matches the starting next-level gate. */
export const BETWEEN_LEVEL_XP: Record<ArcadeLevel, { key: string; amount: number }> = {
  1: { key: 'bobr_l1_trail_xp', amount: 100 },
  2: { key: 'bobr_l2_warrant_xp', amount: 100 },
  3: { key: 'bobr_l3_hunt_xp', amount: 100 },
}

export function grantBetweenLevelXp(
  level: ArcadeLevel,
  addExperience: (amount: number) => void,
  storage?: StorageLike | null,
): number {
  const spec = BETWEEN_LEVEL_XP[level]
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return 0
  if (s.getItem(spec.key)) return spec.amount
  addExperience(spec.amount)
  try { s.setItem?.(spec.key, String(spec.amount)) } catch { /* ignore */ }
  return spec.amount
}

export function levelCompleteCopy(level: ArcadeLevel): {
  title: string
  lead: string
  takeLabel: string
  takeHint: string
  nextLabel: string
  nextHint: string
} {
  const pct = discountFloorForLevel(level)
  if (level === 1) {
    return {
      title: 'Level 1 complete',
      lead: 'You reached Gold Country. Take the stay voucher, or level up.',
      takeLabel: 'Get the QR discount code',
      takeHint: `A QR with your discount (at least ${pct}%). The button opens Airbnb messaging for Hot Tub Hideaway so the host can redeem it on your stay.`,
      nextLabel: 'Level up — Explore the Gold Country',
      nextHint: 'Level 2 is a map of real towns. Stamp the cases. Higher discount if you finish.',
    }
  }
  if (level === 2) {
    return {
      title: 'Level 2 complete',
      lead: `Cases stamped. Take at least ${pct}% now, or hunt the man behind the paper.`,
      takeLabel: 'Get the QR discount code',
      takeHint: `A QR with at least ${pct}% off. Host verifies it on Airbnb. Same door as after the trail.`,
      nextLabel: 'Level up — the warrant hunt',
      nextHint: 'Level 3: take a wanted paper from a sheriff door if you have not yet. Follow the man, not the poster. Finish for 15% and stay gifts.',
    }
  }
  return {
    title: 'Level 3 complete',
    lead: `The hunt is served. ${pct}% is the last stay-percent. After this, gifts land during the ranch stay — not more off the booking.`,
    takeLabel: 'Get the QR discount code',
    takeHint: `A QR with at least ${pct}% off. Host verifies it on Airbnb.`,
    nextLabel: 'Earn gifts during your stay',
    nextHint: STAY_GIFTS.map((g) => `${g.name} — ${g.when}`).join(' · '),
  }
}
