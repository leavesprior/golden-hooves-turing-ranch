/**
 * Phrase-level Voice Judge
 * ------------------------
 * A small, deterministic post-generation classifier for the three-vector NPC
 * engine. Its one job: catch cowboy-stereotype phrasing that the base llama
 * prior likes to inject into Tobias's turns ("I reckon", "lookin'", "these
 * here", bare "reckon", …) before that prose ever reaches the player.
 *
 * Why this exists (POC findings — project npc_three_vector_proof_of_concept_20260505):
 * the architecture was sound and voice fidelity ~75%, but ONE leak recurred:
 * generic-prospector filler bled through despite the personality's
 * `forbiddenPhrases` list. The old `scrubForbiddenPhrases` deleted exact list
 * entries with a `\b…\b` boundary, which:
 *   - missed apostrophe-suffixed words ("lookin'") because `'` breaks `\b`,
 *   - missed the CURLY apostrophe variant the model actually emits ("lookin’"),
 *   - missed bare "reckon" when only "i reckon" was listed,
 *   - silently mutated text with NO signal of whether a leak occurred (so the
 *     route could neither count leaks nor decide to regenerate).
 *
 * The judge fixes all four. It is purely lexical — NOT architectural, no model
 * call, no RAG — so it adds ~microseconds and needs no Grok review.
 *
 * Canon voice it must PRESERVE: Tobias is the Cyan(FF6)/Auron(FFX) register —
 * measured, weathered, plainspoken. The judge only removes folksy-prospector
 * filler; it never touches the measured prose around it.
 */

import type { Personality } from './characters'

// ===================== FORBIDDEN-PHRASE CANON =====================

/**
 * The cowboy-stereotype phrase canon, built from the POC leak findings. This is
 * the floor: it is always checked for prospector-register NPCs (Tobias) IN
 * ADDITION to whatever `personality.forbiddenPhrases` declares, so a character
 * author can never accidentally drop the known leak by editing their own list.
 *
 * Entries are matched apostrophe-insensitively (straight ' and curly ’ are
 * treated as equivalent) and case-insensitively. "reckon" is listed bare AND
 * "i reckon" is listed: the bare form catches "I reckon", "reckon they…",
 * "well, reckon so" — the POC's exact recurring leak — while keeping the
 * matcher cheap.
 */
export const COWBOY_STEREOTYPE_PHRASES: readonly string[] = [
  'reckon',
  'i reckon',
  'these here',
  "lookin'",
  "talkin'",
  "fixin'",
  "ain't no",
  'yee-haw',
  'yeehaw',
  'partner',
  'pardner',
  'consarn',
  'tarnation',
  'varmint',
  'much obliged',
  'rightly',
  'i do declare',
  'shucks',
  'howdy',
] as const

// Phrases an LLM uses to break the fourth wall — also a "voice" failure.
export const META_LEAK_PHRASES: readonly string[] = [
  'as an ai',
  'language model',
  'i cannot',
  "i can't fulfill",
  'as a large language model',
] as const

// ===================== MATCHING =====================

/**
 * Build a tolerant matcher for one forbidden phrase.
 *
 * - Apostrophes (straight ' and curly ’) are interchangeable, because the model
 *   emits the curly form roughly half the time and the human-authored list uses
 *   the straight form. Without this, "lookin’" sails right past a "lookin'" rule.
 * - Boundaries are LETTER-aware rather than `\b`-aware: `\b` treats `'` as a
 *   boundary, so `\blookin'\b` matches the "lookin" stem but orphans the
 *   apostrophe. We instead require a non-letter (or string edge) on each side so
 *   "reckon" does not fire inside "reckoning" / "wreckon".
 */
function buildPhraseRegex(phrase: string): RegExp {
  const apostrophe = "['’]" // straight or curly
  const escaped = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex metachars
    .replace(/['’]/g, apostrophe) // any apostrophe -> either apostrophe
    .replace(/\s+/g, '\\s+') // tolerate multi-space between words
  // (?<![A-Za-z]) / (?![A-Za-z]) = letter-aware boundaries that don't trip on apostrophes.
  return new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'gi')
}

export interface VoiceVerdict {
  /** true = no forbidden phrase found, text is in voice. */
  clean: boolean
  /** Distinct forbidden phrases that matched (lower-cased canonical forms). */
  leaks: string[]
}

/**
 * Classify text against a forbidden-phrase list. This is the "judge": it makes a
 * clean/leak determination WITHOUT modifying the text, so the caller can decide
 * whether to regenerate (preferred for a fresh, fully in-voice line) or rewrite.
 */
export function judgeVoice(text: string, forbidden: readonly string[]): VoiceVerdict {
  const leaks: string[] = []
  if (!text) return { clean: true, leaks }
  for (const phrase of forbidden) {
    if (buildPhraseRegex(phrase).test(text)) leaks.push(phrase.toLowerCase())
  }
  return { clean: leaks.length === 0, leaks: [...new Set(leaks)] }
}

/**
 * Compose the effective forbidden list for a personality: the character's own
 * declared phrases UNIONed with the cowboy-stereotype canon (and the meta-leak
 * canon, which applies to every NPC). De-duplicated, lower-cased.
 *
 * `isProspectorRegister` lets a non-cowboy character (e.g. a future city NPC)
 * skip the cowboy canon — Ben Coon's folksy register is in-voice, so the cowboy
 * floor must NOT be force-applied to him. Defaults to true because the flagship
 * Tobias is the one with the documented leak.
 */
export function effectiveForbidden(
  personality: Pick<Personality, 'forbiddenPhrases'>,
  isProspectorRegister = true,
): string[] {
  const base = personality.forbiddenPhrases.map(p => p.toLowerCase())
  const meta = META_LEAK_PHRASES.map(p => p.toLowerCase())
  const cowboy = isProspectorRegister ? COWBOY_STEREOTYPE_PHRASES.map(p => p.toLowerCase()) : []
  return [...new Set([...base, ...meta, ...cowboy])]
}

// ===================== REWRITE (fallback when regeneration isn't available) =====================

/**
 * Surgically remove forbidden phrases while preserving the surrounding measured
 * prose, then tidy the seams. This is the cheap fallback for when the LLM is
 * unreachable for a regeneration pass — it keeps a leaked line shippable rather
 * than emitting "I reckon" to the player.
 *
 * It is deliberately conservative: it deletes ONLY the matched phrase plus a
 * trailing connective comma/space, never reorders or paraphrases, so Tobias's
 * canon register is untouched.
 */
export function rewriteOutLeaks(text: string, forbidden: readonly string[]): string {
  let out = text
  for (const phrase of forbidden) {
    const re = buildPhraseRegex(phrase)
    // Eat one trailing space/comma so "I reckon, the land…" -> "The land…".
    out = out.replace(new RegExp(re.source + '[\\s,]*', 'gi'), '')
  }
  // Tidy: collapse spaces, pull punctuation back, drop a dangling leading comma.
  out = out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    // Collapse a comma left dangling against terminal punctuation, e.g. ",." -> "."
    .replace(/,\s*([.!?;:])/g, '$1')
    // Collapse a run of commas a removed mid-list phrase can leave behind.
    .replace(/,\s*,/g, ',')
    .replace(/^[\s,]+/, '')
    .trim()
  // Re-capitalise if a sentence-initial filler was removed.
  if (out) out = out[0].toUpperCase() + out.slice(1)
  return out
}
