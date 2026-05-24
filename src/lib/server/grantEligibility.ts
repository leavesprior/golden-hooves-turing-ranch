import 'server-only';

import { dbGetMarkerProgressCount } from '@/lib/discountCodesDb';
import { isMilestoneId, type MilestoneId } from '@/lib/crossGameProgression';
import { EARLY_DISCOUNT_MARKER } from '@/lib/locations';

/**
 * GAP-2 fix — server-side eligibility proof before a milestone grant is signed.
 *
 * The signing primitive (`grantSigning.ts`) is sound crypto, but a signature
 * over an *unverified* claim is just a notarized lie: prior to this module
 * `/api/grant` signed any allow-listed `milestoneId` for any non-empty
 * `sessionId` with no proof the player earned it. A forger could POST
 * `{ milestoneId: "clue_game_unlocked", sessionId: "anything" }` and receive a
 * validly-signed grant.
 *
 * This module re-derives eligibility from the server-side event log (the
 * NEW-09 `bobr_marker_progress` trail — the same hardened source
 * `/api/issue-bobr-early` already trusts) BEFORE the server agrees to sign.
 * The server signs only claims it can independently confirm.
 *
 * server-only: imports better-sqlite3 transitively and must never reach the
 * client bundle. Imported solely by the `/api/grant` route handler.
 */

export type EligibilityVerdict =
  | { eligible: true; proof: string }
  | { eligible: false; reason: EligibilityFailureReason };

export type EligibilityFailureReason =
  // The milestone is real but the server log does not show it was earned.
  | 'milestone_not_earned'
  // The milestone has no server-side proof source, so it cannot be signed as a
  // value-bearing grant. (Client-progress-only milestones must stay Tier-C /
  // cosmetic; they are never notarized off an unverifiable claim.)
  | 'eligibility_unverifiable'
  // Bad input.
  | 'invalid_milestone'
  | 'invalid_session';

export interface EligibilityContext {
  milestoneId: MilestoneId;
  sessionId: string;
  // Optional extra inputs a resolver may need (e.g. difficulty for marker math).
  difficulty?: string;
}

/**
 * A resolver returns true when the server log independently confirms the player
 * earned this milestone. `null` from the registry means "no server proof source
 * exists for this milestone" → it is unverifiable and must not be signed.
 */
type EligibilityResolver = (ctx: EligibilityContext) => { ok: boolean; proof: string };

/**
 * Milestones whose eligibility CAN be proven from the server event log.
 *
 * `clue_game_unlocked` is the value-bearing gate (it grants the in-person
 * treasure-hunt path). Its server-verifiable proxy is the marker-progress
 * trail: a player who has physically logged the required markers has done the
 * server-witnessed work. This mirrors `/api/issue-bobr-early`, which derives
 * `markerCount` from `dbGetMarkerProgressCount(sessionId)` and refuses to mint
 * below `EARLY_DISCOUNT_MARKER`.
 *
 * Add new entries here ONLY when a server-side log can independently confirm the
 * milestone. Everything not listed is treated as `eligibility_unverifiable`.
 */
const SERVER_VERIFIABLE_RESOLVERS: Partial<Record<MilestoneId, EligibilityResolver>> = {
  clue_game_unlocked: ({ sessionId }) => {
    const markerCount = dbGetMarkerProgressCount(sessionId);
    return {
      ok: markerCount >= EARLY_DISCOUNT_MARKER,
      proof: `marker_progress:${markerCount}/${EARLY_DISCOUNT_MARKER}`,
    };
  },
  booking_verified: ({ sessionId }) => {
    // Booking verification is server-witnessed via the same marker trail today
    // (a verified booking implies on-site marker activity). Kept conservative:
    // requires at least one server-logged marker for this session.
    const markerCount = dbGetMarkerProgressCount(sessionId);
    return { ok: markerCount >= 1, proof: `marker_progress:${markerCount}` };
  },
};

export function isGrantSignableMilestone(milestoneId: unknown): milestoneId is MilestoneId {
  return isMilestoneId(milestoneId) && milestoneId in SERVER_VERIFIABLE_RESOLVERS;
}

/**
 * Verify, from the server-side event log, that the player earned the milestone.
 * Returns an eligibility verdict the route can audit and act on.
 */
export function verifyMilestoneEligibility(ctx: EligibilityContext): EligibilityVerdict {
  if (!isMilestoneId(ctx.milestoneId)) {
    return { eligible: false, reason: 'invalid_milestone' };
  }
  if (typeof ctx.sessionId !== 'string' || ctx.sessionId.trim().length === 0) {
    return { eligible: false, reason: 'invalid_session' };
  }

  const resolver = SERVER_VERIFIABLE_RESOLVERS[ctx.milestoneId];
  if (!resolver) {
    // No server-side proof source → we cannot independently confirm the claim,
    // so we refuse to sign it. (The signature must mean something.)
    return { eligible: false, reason: 'eligibility_unverifiable' };
  }

  const { ok, proof } = resolver(ctx);
  if (!ok) {
    return { eligible: false, reason: 'milestone_not_earned' };
  }

  return { eligible: true, proof };
}
