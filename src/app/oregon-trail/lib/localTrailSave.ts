import { snapshotLevel2Persist } from '@/lib/goldCountryStreet'

export const LOCAL_TRAIL_AUTOSAVE_KEY = 'golden_frog_local_save'

/** One shared writer for ordinary autosave and critical trip transitions.
 * Throws on failure, allowing departure/payment/arrival to remain uncommitted. */
export function writeLocalTrailAutosave(state: unknown): void {
  localStorage.setItem(LOCAL_TRAIL_AUTOSAVE_KEY, JSON.stringify({
    savedAt: new Date().toISOString(),
    state,
    level2: snapshotLevel2Persist(),
  }))
}
