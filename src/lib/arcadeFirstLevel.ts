/**
 * Arcade first-level cabinet — live Golden Frog Trail.
 *
 * Public face = one game (the trail). Extra modes stay on the system at
 * their URLs; they are not in the chrome until trail_victory.
 *
 * Composes two reviews, does not invent a third menu:
 * - Goda Go Autonomee 2026-08-22 (p=f671727c): two readable paths
 *   (book a stay / explore the area), not seven 8px links; send-message
 *   must actually work.
 * - Leif 2026-08-23: arcade focus; first level = Golden Frog Trail only;
 *   the game is guest quality-control before booking; existing guests
 *   play once → return discount; complicated extra parts stay here on
 *   the system.
 *
 * Existing guestIntent is the EV/overnight escape: never trap a
 * charge-overnight guest behind a wagon game.
 *
 * Cabinet parse (live face, not extra menus):
 *   0. Site: Book on Airbnb  |  Play Golden Frog Trail (first discount).
 *   1. Trail: Shop / Inn / Hunt / Camp / Continue. Kansas always has
 *      the Bridge of Death. Python/Adams eggs stay in the playable river,
 *      inn talk, and events — Goda chrome does not strip them.
 *   2. Win: take the discount  |  risk the next level. Same two
 *      buttons after L2 and L3. Floor +5% per level (5 / 10 / 15).
 *      After L3: stay gifts, not another percent.
 *      L2 = Gold Country cases. L3 = warrant hunt.
 *   3. Ranch-house QR (?qr=ranch-house): /explore playable area + GPS NPCs.
 *   4. Later: hologram overlay on the same GPS people. Not this cut.
 */

import { classifyGuestIntent, type GuestIntent } from './guestIntent'
import { airbnbBookingLink } from './airbnbLink'
import { CROSS_GAME_STORAGE_KEY, type MilestoneId } from './crossGameProgression'

export const OT_AUTOSAVE_KEY = 'golden_frog_local_save'

export const TRAIL_VICTORY_MILESTONES: readonly MilestoneId[] = [
  'trail_victory',
  'reached_west_point',
  'completed_gold_country',
]

/** Town verbs on the arcade cabinet. Everything else stays in the code. */
export const ARCADE_TOWN_ACTIONS = [
  'shop',
  'inn',
  'hunt',
  'camp',
  'continue',
] as const

export type ArcadeTownAction = (typeof ARCADE_TOWN_ACTIONS)[number]

export type StorageLike = {
  getItem(key: string): string | null
  setItem?(key: string, value: string): void
}

export type ArcadeAccess = {
  intent: GuestIntent
  played: boolean
  trailComplete: boolean
  bookingVerified: boolean
  /** EV / overnight / PlugShare / Tesla: Airbnb now. */
  directBook: boolean
  /** New guests: host-message booking after beating the trail. */
  bookingUnlocked: boolean
  /** Existing guests who play: return-stay discount path. */
  returnDiscountReady: boolean
  /** First-level town: only arcade verbs. Deeper verbs after victory. */
  arcadeTown: boolean
}

const GOLD_COUNTRY_PHASES = new Set([
  'gold_country_arrival',
  'gold_country_explore',
  'gold_country_location',
  'gold_country_travel',
  'settlement_victory',
  'complete',
])

function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function milestoneIdsFromCrossGame(raw: string | null): string[] {
  const parsed = parseJson(raw) as { milestones?: Array<{ id?: string }> } | null
  if (!parsed || !Array.isArray(parsed.milestones)) return []
  return parsed.milestones.map((m) => m.id).filter((id): id is string => typeof id === 'string')
}

function trailStateFromAutosave(raw: string | null): { phase?: string; distance?: number } | null {
  const parsed = parseJson(raw) as Record<string, unknown> | null
  if (!parsed) return null
  if (typeof parsed.phase === 'string') {
    return {
      phase: parsed.phase,
      distance: typeof parsed.distance === 'number' ? parsed.distance : undefined,
    }
  }
  const inner = parsed.state as Record<string, unknown> | undefined
  if (inner && typeof inner.phase === 'string') {
    return {
      phase: inner.phase,
      distance: typeof inner.distance === 'number' ? inner.distance : undefined,
    }
  }
  return null
}

export function readArcadeAccess(input: {
  storage?: StorageLike | null
  search?: string
  referrer?: string
  utmSource?: string
  bookingVerified?: boolean
} = {}): ArcadeAccess {
  const storage = input.storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const intent = classifyGuestIntent({
    search: input.search,
    referrer: input.referrer,
    utmSource: input.utmSource,
  })

  const ids = storage ? milestoneIdsFromCrossGame(storage.getItem(CROSS_GAME_STORAGE_KEY)) : []
  const trail = storage ? trailStateFromAutosave(storage.getItem(OT_AUTOSAVE_KEY)) : null

  const trailComplete =
    TRAIL_VICTORY_MILESTONES.some((id) => ids.includes(id)) ||
    (trail?.phase != null && GOLD_COUNTRY_PHASES.has(trail.phase)) ||
    (typeof trail?.distance === 'number' && trail.distance >= 2000)

  const played =
    trailComplete ||
    (trail?.phase != null && trail.phase !== 'title') ||
    (typeof trail?.distance === 'number' && trail.distance > 0)

  const bookingVerified = input.bookingVerified === true || ids.includes('booking_verified')
  const directBook = intent === 'charge_overnight'
  const bookingUnlocked = directBook || trailComplete
  const returnDiscountReady = trailComplete && bookingVerified

  return {
    intent,
    played,
    trailComplete,
    bookingVerified,
    directBook,
    bookingUnlocked,
    returnDiscountReady,
    arcadeTown: !trailComplete,
  }
}

/**
 * Goda + Leif 2026-08-23: Book is Airbnb. The game is the other door
 * (first discount). Do not gate booking behind play.
 */
export function arcadeBookHref(access: ArcadeAccess): string {
  if (access.directBook) return airbnbBookingLink('arcade-ev', 'overnight')
  if (access.trailComplete) return airbnbBookingLink('arcade-win', 'trail')
  return airbnbBookingLink('arcade-book', 'site')
}

export const POST_WIN_CHOICE_KEY = 'bobr_post_win_choice'
export type PostWinChoice = 'take_discount' | 'risk_next' | null

export function readPostWinChoice(storage?: StorageLike | null): PostWinChoice {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const v = s?.getItem(POST_WIN_CHOICE_KEY)
  if (v === 'take_discount' || v === 'risk_next') return v
  return null
}

export function writePostWinChoice(choice: Exclude<PostWinChoice, null>, storage?: StorageLike | null): void {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  try { s?.setItem?.(POST_WIN_CHOICE_KEY, choice) } catch { /* ignore */ }
}

/** Deeper town verbs (investigate, telegraph, posse, …) after first-level victory. */
export function showDeeperTown(access: Pick<ArcadeAccess, 'arcadeTown'>): boolean {
  return !access.arcadeTown
}

export const HOST_AIRBNB_MESSAGE =
  'Send me a message on Airbnb when requesting to book and I will provide the discount.'
