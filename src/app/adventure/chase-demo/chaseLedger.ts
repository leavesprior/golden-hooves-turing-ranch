// Cross-level continuity for The Tare's Trail.
// ----------------------------------------------------------------------------
// The chase stays sessionStorage-isolated DURING play. This module only touches
// the shared cross-game ledger at the two clean seams the continuity design
// names: read carried assets ONCE at chase start (soft buffs), and write ONE
// verdict event at the end. Every call is wrapped so a ledger error can NEVER
// break the chase.
//
// INTEGRITY (hard rule): writes here are EVIDENCE only — world events + earned
// GOOD karma. Nothing of real value is minted client-side; any discount/reward
// must be SERVER-minted with a signed grant. Good karma is EARN-ONLY (positive
// deltas), and money never touches good/bad (it only touches NEUTRAL elsewhere).
// The cross-game karma pool drives the Twain narrator + legacy dashboard, NOT
// the discount alignment (a separate, server-gated system) — so replaying the
// chase cannot farm a real reward.
import { CrossGameStorage } from '@/lib/crossGameProgression'

export type VerdictKind = 'gallows' | 'prison' | 'mercy'

export interface CarriedBoon {
  /** Free witness "presses" granted by what the player earned in other games. */
  freePresses: number
  /** good / (good+bad) from the shared karma pool — for flavor. */
  goodRatio: number
  /** Human-readable reasons the boon was granted (shown to the player). */
  reasons: string[]
}

const EMPTY: CarriedBoon = { freePresses: 0, goodRatio: 0, reasons: [] }

/**
 * Read carried assets from the cross-game ledger ONCE, at chase start. Read-only.
 * A high-Shrewdness or high-Diplomacy character, or one with a good name (karma),
 * arrives with free witness presses — what you earned elsewhere travels with you.
 */
export function readCarriedBoon(): CarriedBoon {
  try {
    const state = CrossGameStorage.load()
    const pool = CrossGameStorage.loadSharedKarma()
    const q = state?.characterQualities ?? null
    const total = pool.good + pool.bad
    const goodRatio = total > 0 ? pool.good / total : 0

    let free = 0
    const reasons: string[] = []
    if (q && q.investigation >= 70) { free += 1; reasons.push('a sharp eye') }
    if (q && q.social >= 70) { free += 1; reasons.push('a silver tongue') }
    if (goodRatio >= 0.6) { free += 1; reasons.push('a good name that opens doors') }

    return { freePresses: Math.min(3, free), goodRatio, reasons }
  } catch {
    return EMPTY
  }
}

/**
 * Write ONE verdict event to the shared ledger at the end of the chase. The
 * caller guarantees this fires once (the verdict is set once). Mercy nudges GOOD
 * karma — making the verdict's "kindness, witnessed, comes back to you"
 * mechanically true; the other sentences are lawful/neutral. Best-effort.
 */
export function recordVerdict(kind: VerdictKind): void {
  try {
    CrossGameStorage.logEvent(
      'rpg_adventure',
      'bounty_completed',
      `Caught Cyrus Vane "the Tare" — verdict: ${kind}`,
    )
    if (kind === 'mercy') {
      CrossGameStorage.logEvent('rpg_adventure', 'generous_sharing', 'Spared the Tare; made the wronged whole')
      CrossGameStorage.syncKarmaToPool('rpg_adventure', 'good', 3, 'Showed mercy to Cyrus Vane')
    } else {
      CrossGameStorage.syncKarmaToPool(
        'rpg_adventure',
        'neutral',
        1,
        kind === 'gallows' ? 'Hanged the Tare — hard justice' : 'Sent the Tare to prison',
      )
    }
  } catch {
    /* ledger write is best-effort; never break the chase */
  }
}
