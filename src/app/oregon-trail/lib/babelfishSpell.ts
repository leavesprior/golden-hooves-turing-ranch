/**
 * The Babel Fish Spell — a "spell of communication"
 * ==================================================
 *
 * TAG: dp-babelfish-spell  ·  FLAG: BUILDABLE (the novel core)
 * Design: DONT_PANIC_BRIDGE_DM_TABLE_20260717.md
 *
 * When the spell is active, an NPC's spoken words stop being words. Instead they
 * come out as Douglas-Adams-themed *gestures* — pantomime you can almost read:
 *
 *   • karma >= 100  →  "64-bit" EMOJI mode  (🐬🌌4️⃣2️⃣☕🐋🌷🛁 …)
 *   • karma <  100  →  ASCII-art mode        (¯\_(ツ)_/¯ , ><(((º> , (don't panic) …)
 *
 * It is a PURE FUNCTION — `babelfishTransform(text, karma, spellActive)` — so it is
 * trivially unit-testable and has zero side effects. It is DETERMINISTIC: the same
 * text + karma always yields the same gestures (a djb2 hash picks from curated
 * pools), so it reads as a real translation rather than random noise. Motif
 * keywords (towel, 42, fish, panic, whale…) map to their signature Adams gesture,
 * so meaning survives the spell in the way a good mime survives a language barrier.
 *
 * THEMATIC-ONLY note: the spell's in-fiction *trigger* ("the player is on their own
 * secure home network, so Neoma casts a spell of communication") is a GAME FLAG.
 * This module never inspects a network, a credential, or anything real — it only
 * transforms a string. The SSH / Tower-security-agent framing stays behind its
 * GROK-BEFORE + secret-rotation gates (see dp-neoma-ssh-channel / dp-tower-security-agents).
 */

/** Karma at or above this renders in rich emoji ("64-bit"); below it, ASCII gestures. */
export const KARMA_EMOJI_THRESHOLD = 100

export type SpellMode = 'emoji' | 'ascii'

/** Which rendering a given karma earns. */
export function spellModeForKarma(karma: number): SpellMode {
  return karma >= KARMA_EMOJI_THRESHOLD ? 'emoji' : 'ascii'
}

// ----------------------------------------------------------------------------
// Deterministic hash — djb2. Same string always maps to the same pool index, so
// a repeated NPC line always gestures the same way (legible, not noisy).
// ----------------------------------------------------------------------------
function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(h)
}

// ----------------------------------------------------------------------------
// MOTIF KEYWORDS — the load-bearing meaning. If a sentence contains one of these,
// its signature Adams gesture leads the line, so the gesture still "says" something.
// Ordered: earlier entries win when several match (greetings/farewells first).
// ----------------------------------------------------------------------------
interface Motif {
  keys: string[]
  emoji: string
  ascii: string
}

const MOTIFS: Motif[] = [
  { keys: ['goodbye', 'farewell', 'so long', 'leave', 'leaving', 'gone', 'depart'], emoji: '🐬〰️🐟👋', ascii: '><(((°>  ~~  o/' }, // so long, and thanks for all the fish
  { keys: ['hello', 'hi ', 'greet', 'welcome', 'hail'], emoji: '🐬✨👋', ascii: 'o/  ~( ^.^)~' },
  { keys: ['towel'], emoji: '🛁🧺✨', ascii: '[===towel===]' },
  { keys: ['42', 'forty-two', 'forty two', 'answer', 'meaning of life', 'ultimate question'], emoji: '4️⃣2️⃣🌌', ascii: '[4][2] ...?' },
  { keys: ['panic', 'afraid', 'fear', 'worry', 'scared', 'danger'], emoji: '🛸😌 DON\'T PANIC', ascii: '((( DON\'T PANIC )))' },
  { keys: ['fish', 'babel'], emoji: '🐟👂🌀', ascii: '><(((°>' },
  { keys: ['whale', 'petunia', 'not again'], emoji: '🐋💭🌷', ascii: '( °□°) ...a whale? ...petunias?' },
  { keys: ['coffee', 'tea', 'drink', 'thirst', 'whiskey', 'gargle'], emoji: '☕🤔', ascii: 'c[_]  *sips*' },
  { keys: ['question', 'ask', 'why', 'wonder'], emoji: '🤔❓🌌', ascii: '(?_?)' },
  { keys: ['think', 'know', 'remember', 'memory', 'mind', 'dream'], emoji: '🧠💭', ascii: '(-.-) *ponders*' },
  { keys: ['time', 'year', 'wait', 'late', 'clock'], emoji: '⏳🌀', ascii: '[ tick ... tock ]' },
  { keys: ['galaxy', 'universe', 'star', 'space', 'cosmos', 'sky'], emoji: '🌌✨🛸', ascii: '. * . ✧ . * .' },
  { keys: ['gold', 'treasure', 'rich', 'coin', 'money'], emoji: '🪙✨💰', ascii: '$ ( $_$ ) $' },
  { keys: ['land', 'earth', 'home', 'ranch', 'ground', 'mountain', 'volcano'], emoji: '🏞️🌋', ascii: '/\\_/\\_/\\ ' },
  { keys: ['love', 'friend', 'kind', 'heart', 'care'], emoji: '💚🫂', ascii: '<3 (^.^)' },
  { keys: ['no', 'not', 'never', 'wrong'], emoji: '🙅🌀', ascii: '(x_x)' },
  { keys: ['yes', 'good', 'right', 'true'], emoji: '👍✨', ascii: '(^_^)b' },
]

// ----------------------------------------------------------------------------
// FALLBACK POOLS — for a sentence with no motif keyword, a deterministic pick of
// generic Adams pantomime. Kept short and read-as-gesture.
// ----------------------------------------------------------------------------
const EMOJI_POOL = [
  '🐬〰️🌊',
  '🛸👍🌌',
  '☕💭😌',
  '4️⃣2️⃣❓',
  '🐋…🌷⁉️',
  '🛁🧺✨',
  '📖🔤 (large friendly letters)',
  '🐟👂🌀',
  '🌌✨🐬',
  '🤷🌠',
]

const ASCII_POOL = [
  '~<(°)°)><   ...~~',
  'o/   \\o   o/',
  '¯\\_(ツ)_/¯',
  '[4][2]?',
  '( °□°)  ...a whale?',
  'c[_]   *a contemplative sip*',
  '<( large friendly letters )>',
  '><(((°>',
  '. o O ( ... )',
  '(-_-)7',
]

/** Split a blob into sentence-ish chunks; keeps it robust to messy NPC prose. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** Find the first motif whose keyword appears in the (lowercased) sentence. */
export function detectMotif(sentence: string): Motif | null {
  const low = ' ' + sentence.toLowerCase() + ' '
  for (const m of MOTIFS) {
    for (const k of m.keys) {
      if (low.includes(k)) return m
    }
  }
  return null
}

/**
 * Gesture-ify a single sentence deterministically. A motif keyword leads the line
 * when present; otherwise a hash-picked pantomime from the pool. The sentence's
 * own hash also nudges a trailing flourish so equal-length lines still differ.
 */
export function gestureForSentence(sentence: string, mode: SpellMode): string {
  const pool = mode === 'emoji' ? EMOJI_POOL : ASCII_POOL
  const h = djb2(sentence)
  const base = pool[h % pool.length]
  const motif = detectMotif(sentence)
  if (motif) {
    const sig = mode === 'emoji' ? motif.emoji : motif.ascii
    // Motif leads; a short hashed tail keeps repeats from looking identical.
    const tail = pool[(h >> 3) % pool.length]
    return `${sig}   ${tail}`
  }
  return base
}

/**
 * THE SPELL. Re-render `text` as Douglas-Adams gestures when `spellActive`.
 * When the spell is off, returns the text verbatim (so normal, non-spell NPC
 * dialogue is never touched — no regression path).
 *
 * @param text         the NPC's spoken line
 * @param karma        player karma; >= 100 → emoji, else ASCII
 * @param spellActive  the communicationSpell flag
 */
export function babelfishTransform(text: string, karma: number, spellActive: boolean): string {
  if (!spellActive) return text
  const trimmed = (text ?? '').trim()
  if (!trimmed) return trimmed
  const mode = spellModeForKarma(karma)

  const gestures = splitSentences(trimmed).map(s => gestureForSentence(s, mode))
  const body = gestures.join(mode === 'emoji' ? '  ·  ' : '   //   ')

  // A tiny frame so the reader knows a translation happened (the Babel fish at work).
  return mode === 'emoji'
    ? `🐟 ${body} 🐟`
    : `><> ${body} <><`
}
