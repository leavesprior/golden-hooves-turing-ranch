// Shared character read — a READ-ONLY bridge across the games' character stores.
//
// The games keep separate save models (do not merge them here — that is a
// separately gated task), but a player is ONE person: if any game has a
// character, downstream entries must treat the character as existing and
// never re-ask creation. Menu-collapse fix, 2026-07-03.
//
// Known stores, in canonical-first order:
//   - `bobr_ot_character`  — canonical Character (name/background/stats/traits),
//     written by the Oregon Trail (Prospector's Tale) CharacterProvider AND by
//     /adventure/character-creation (both route through the same provider).
//   - `bobr_rpg_session`   — legacy adventure RPG session (playerName +
//     character.attributes). Kept as a fallback read only.

export interface SharedCharacterRead {
  name: string
  /** Which store the character was found in. */
  source: 'bobr_ot_character' | 'bobr_rpg_session'
  /** Trait/pick ids, where the source records them (empty otherwise). */
  traits: string[]
  /** Oregon-trail background id, when the canonical store has one. */
  background?: string
}

/**
 * Read the player's character from whichever game created it.
 * Returns null on the server, when no store has a character, or when the
 * stored JSON is unreadable. Never writes.
 */
export function readSharedCharacter(): SharedCharacterRead | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('bobr_ot_character')
    if (raw) {
      const c = JSON.parse(raw)
      if (c && typeof c.name === 'string' && c.name.trim()) {
        return {
          name: c.name,
          source: 'bobr_ot_character',
          traits: Array.isArray(c.traits) ? c.traits : [],
          background: typeof c.background === 'string' ? c.background : undefined,
        }
      }
    }
  } catch { /* fall through to legacy store */ }

  try {
    const raw = localStorage.getItem('bobr_rpg_session')
    if (raw) {
      const s = JSON.parse(raw)
      if (s && typeof s.playerName === 'string' && s.playerName.trim()) {
        return {
          name: s.playerName,
          source: 'bobr_rpg_session',
          traits: Array.isArray(s.character?.traits) ? s.character.traits : [],
        }
      }
    }
  } catch { /* unreadable legacy save — treat as absent */ }

  return null
}

/** True when any game has a character — downstream entries skip creation. */
export function hasAnyCharacter(): boolean {
  return readSharedCharacter() !== null
}
