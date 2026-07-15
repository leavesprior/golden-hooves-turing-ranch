// Living Trail client → server presence check-in (P1) — RECORD ONLY.
// Mirrors karmaServerSync.postKarmaEvent's shape (fire-and-forget safe,
// fails soft offline) but posts to /api/living-trail/checkin.
//
// ⚠️ P1 IS NOT AUTHORITATIVE. The server merely records check-ins so P2 has
// ground truth to compare against. P2 makes this path authoritative (signed
// server verdicts gating completion) BEFORE any real-money reward rides on
// Living Trail chains. Do not hang value off these records until then.

import { getKarmaSessionId } from '@/lib/karmaServerSync'

export interface PresenceCheckinResult {
  ok: boolean
}

/**
 * Record a presence check-in for a Living Trail node completion.
 * `coords` is null for remote ("by-lantern-light") completions with no GPS fix.
 * Client fire-and-forget; every failure path resolves { ok: false }.
 */
export async function postPresenceCheckin(
  nodeId: string,
  coords: { lat: number; lng: number; accuracyM?: number } | null,
  verified: boolean,
): Promise<PresenceCheckinResult> {
  try {
    const res = await fetch('/api/living-trail/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getKarmaSessionId(),
        nodeId,
        coords,
        verified,
        clientTs: Date.now(),
      }),
    })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    return { ok: !!data?.ok }
  } catch {
    return { ok: false }
  }
}
