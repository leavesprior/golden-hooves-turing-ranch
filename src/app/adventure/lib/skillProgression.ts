/**
 * Krondor-style usage-based SADDLE progression — Golden Frog Codex Phase 5.
 *
 * Research trail: Betrayal at Krondor (Dynamix, 1993) grew each stat from
 * successful uses, with a hidden saddle/threshold per stat class and a
 * 1.35x ramp per level. Each stat's usage bucket is SILENT — the player
 * doesn't see a "level up" popup at the moment of the crossover. Instead,
 * the chapter-end Frog's Ledger narrates "Shrewdness grew from 12 to 14"
 * with context. This keeps the flow uninterrupted.
 *
 * Formula (exposed for designers):
 *   uses_to_next(stat, L) = ceil(SADDLE_BASE[stat] * 1.35^(L-1))
 *
 * Event weights (optional designer flag on recordSkillUse):
 *   trivial  = 0.5   (e.g. passive perception ping, shop haggle)
 *   normal   = 1.0   (default — a tangible skill check succeeded)
 *   climactic = 2.0  (quest-critical success, boss parley, final deduction)
 *
 * Tag multiplier (player picks 1-2 tagged stats at character creation):
 *   solo tag (only 1 tag total)      = 1.5x
 *   one of two tags (2 tags chosen)  = 1.25x
 *   untagged                          = 1.0x
 *
 * Guard-rails:
 *   - Luck: capped at 3 credits per chapter (prevents grinding).
 *   - Diplomacy: decays −1 if unused across a full chapter.
 *     Combat/perception stats never decay.
 *   - Act1 cap: Diplomacy cannot grow past L10.
 *   - Act2 cap: Diplomacy cannot grow past L15.
 *
 * The tracker is pure and framework-agnostic. The play page wires it to
 * rollSkillCheck / handleNPCTalk callsites: on SUCCESS, call recordSkillUse.
 */

import type { StatName } from '@/app/oregon-trail/characterContext'

/**
 * Saddle bases per stat — the number of "normal" uses needed at L0→L1.
 * Tuned so perception/knowledge stats grow slower than physical ones (the
 * player uses Shrewdness every clue; we don't want runaway inflation).
 */
export const SADDLE_BASE: Record<StatName, number> = {
  Shrewdness: 4, // perception class
  Agility: 6, // physical class
  Durability: 8, // physical class
  Diplomacy: 3, // social class
  Luck: 2, // meta class (gated by per-chapter cap)
  Expertise: 5, // knowledge class
}

/** Event weights — multiplied into each recordSkillUse() call. */
export type EventWeight = 'trivial' | 'normal' | 'climactic'

export const EVENT_WEIGHT_VALUES: Record<EventWeight, number> = {
  trivial: 0.5,
  normal: 1.0,
  climactic: 2.0,
}

/** Tag multipliers — depend on how many stats the player tagged. */
const TAG_BOOST_SOLO = 1.5 // exactly one stat tagged
const TAG_BOOST_PAIR = 1.25 // two stats tagged (each gets this)
const TAG_BOOST_UNTAGGED = 1.0

/** Per-chapter caps for Diplomacy. null = no act cap. */
const DIPLOMACY_CAP_BY_CHAPTER: Record<number, number> = {
  1: 10, // Act 1
  2: 10,
  3: 15, // Act 2
  4: 15,
  5: 20, // Act 3 — uncapped (system floor of 20 kicks in)
}

/** Luck credits cap per chapter. */
const LUCK_CREDITS_PER_CHAPTER = 3

/** Stats that decay if unused for a full chapter. */
const DECAY_STATS: StatName[] = ['Diplomacy']

/**
 * uses_to_next(stat, L) = ceil(SADDLE_BASE[stat] × 1.35^(L-1)).
 * Exported so the Ledger / skill-tree / designer tools can inspect progression curves.
 */
export function usesToNext(stat: StatName, level: number): number {
  const base = SADDLE_BASE[stat]
  const exponent = Math.max(0, level - 1)
  return Math.ceil(base * Math.pow(1.35, exponent))
}

/**
 * Per-stat usage bucket. Only `uses` persists across sessions; the rest are
 * ephemeral (reset on chapter boundary).
 */
export interface StatUsageBucket {
  /** Total weighted uses toward the current level. Spills at threshold. */
  uses: number
  /** Current stat level when the bucket was last synced. */
  level: number
  /** Luck-only: how many credits counted toward uses *this chapter*. */
  luckCreditsThisChapter: number
  /** Was this stat used at all this chapter? Drives decay check. */
  usedThisChapter: boolean
}

export interface SkillProgressionState {
  buckets: Record<StatName, StatUsageBucket>
  /** Stats the player tagged at character creation (0, 1 or 2). */
  taggedStats: StatName[]
  /** Chapter at last decay-check, so we only decay once per chapter. */
  lastDecayChapter: number
  /**
   * One narrative line per level-up this chapter (reset on chapter roll).
   * Frog's Ledger reads from here.
   */
  ledgerEntries: LedgerEntry[]
}

export interface LedgerEntry {
  stat: StatName
  /** Stat value BEFORE this chapter's growth. */
  fromLevel: number
  /** Stat value AFTER this chapter's growth. */
  toLevel: number
  /** Short narrative context derived from where the growth came from. */
  narrative: string
}

const STATS: StatName[] = [
  'Shrewdness',
  'Agility',
  'Durability',
  'Diplomacy',
  'Luck',
  'Expertise',
]

/** Narrative snippets per stat — chosen based on the kind of check that credited it. */
const STAT_NARRATIVES: Record<StatName, string> = {
  Shrewdness: 'you noticed things others missed',
  Agility: 'your reflexes sharpened in the field',
  Durability: 'your body learned to endure what breaks lesser travelers',
  Diplomacy: 'your words began to land where force could not',
  Luck: 'the world tilted toward you, quietly',
  Expertise: 'the trail and its work became second nature',
}

/** Build a fresh, zeroed state — used on new-game. */
export function createInitialProgressionState(
  taggedStats: StatName[] = [],
): SkillProgressionState {
  const buckets = {} as Record<StatName, StatUsageBucket>
  for (const s of STATS) {
    buckets[s] = {
      uses: 0,
      level: 0,
      luckCreditsThisChapter: 0,
      usedThisChapter: false,
    }
  }
  return {
    buckets,
    taggedStats: taggedStats.slice(0, 2),
    lastDecayChapter: 0,
    ledgerEntries: [],
  }
}

/** Tag boost for a given stat given the player's tag loadout. */
export function getTagBoost(stat: StatName, taggedStats: StatName[]): number {
  if (!taggedStats.includes(stat)) return TAG_BOOST_UNTAGGED
  if (taggedStats.length === 1) return TAG_BOOST_SOLO
  return TAG_BOOST_PAIR
}

/**
 * Hard cap for Diplomacy based on current chapter (Act).
 * Returns the maximum level Diplomacy is allowed to reach *this chapter*.
 * For non-Diplomacy stats, there's no per-act cap — returns Infinity.
 */
function getLevelCap(stat: StatName, chapter: number): number {
  if (stat !== 'Diplomacy') return Infinity
  return DIPLOMACY_CAP_BY_CHAPTER[chapter] ?? 20
}

export interface RecordSkillUseInput {
  stat: StatName
  /** Player's current raw stat value (e.g. 12). Used for level thresholding. */
  currentStatValue: number
  /** Current chapter, used for caps + luck credit bookkeeping. */
  chapter: number
  /** Event weight. Default 'normal'. Expose on designer call-sites. */
  weight?: EventWeight
  /**
   * Optional free-text context appended to the narrative line if a level-up
   * fires. E.g. "during the standoff with Jennings". If omitted, a default
   * per-stat line is used.
   */
  context?: string
}

export interface RecordSkillUseResult {
  state: SkillProgressionState
  /**
   * If the level threshold was crossed this call, `stat` is set.
   * null when no level-up fired. Silent — the UI should NOT popup here;
   * the Frog's Ledger consumes ledgerEntries on chapter end.
   */
  levelUp: StatName | null
  /** Number of level-ups this call (supports spill-over on a climactic hit). */
  levelUpCount: number
}

/**
 * Record a single successful skill use. Pure; returns a new state.
 *
 * HARD RULE: only call this on SUCCESS — a failed check doesn't grow a stat.
 * The call-sites in play/page.tsx guard on result.success before invoking.
 */
export function recordSkillUse(
  state: SkillProgressionState,
  input: RecordSkillUseInput,
): RecordSkillUseResult {
  const { stat, currentStatValue, chapter, weight = 'normal', context } = input
  const bucket = state.buckets[stat]

  // Luck credits cap: ignore the use entirely once the chapter cap is hit.
  if (stat === 'Luck' && bucket.luckCreditsThisChapter >= LUCK_CREDITS_PER_CHAPTER) {
    return { state, levelUp: null, levelUpCount: 0 }
  }

  // Diplomacy cap-per-act: if already at cap, don't accumulate further.
  const cap = getLevelCap(stat, chapter)
  if (currentStatValue >= cap) {
    // still count as "used this chapter" so decay doesn't fire on Diplomacy
    const nextBucket = { ...bucket, usedThisChapter: true }
    return {
      state: {
        ...state,
        buckets: { ...state.buckets, [stat]: nextBucket },
      },
      levelUp: null,
      levelUpCount: 0,
    }
  }

  const tagMult = getTagBoost(stat, state.taggedStats)
  const weightMult = EVENT_WEIGHT_VALUES[weight]
  const creditThisCall = weightMult * tagMult

  let uses = bucket.uses + creditThisCall
  let level = currentStatValue
  const luckCreditsThisChapter =
    bucket.luckCreditsThisChapter + (stat === 'Luck' ? creditThisCall : 0)
  const usedThisChapter = true

  // Spillover: a single climactic hit can cross a threshold (or more rarely two)
  const newLedgerEntries: LedgerEntry[] = []
  let levelUpCount = 0
  while (uses >= usesToNext(stat, level + 1) && level + 1 <= cap) {
    const threshold = usesToNext(stat, level + 1)
    uses -= threshold
    const fromLevel = level
    level = level + 1
    levelUpCount += 1
    newLedgerEntries.push({
      stat,
      fromLevel,
      toLevel: level,
      narrative: context ?? STAT_NARRATIVES[stat],
    })
  }

  // If multiple level-ups fired in one call, collapse into one ledger line
  // with a range so the chapter summary stays readable.
  let mergedLedger = state.ledgerEntries.slice()
  if (newLedgerEntries.length > 0) {
    const first = newLedgerEntries[0]
    const last = newLedgerEntries[newLedgerEntries.length - 1]
    // If this stat already has a ledger entry this chapter, extend its range.
    const existingIdx = mergedLedger.findIndex(e => e.stat === stat)
    if (existingIdx >= 0) {
      const existing = mergedLedger[existingIdx]
      mergedLedger[existingIdx] = {
        stat,
        fromLevel: existing.fromLevel,
        toLevel: last.toLevel,
        narrative: existing.narrative, // keep first narrative
      }
    } else {
      mergedLedger = [
        ...mergedLedger,
        {
          stat,
          fromLevel: first.fromLevel,
          toLevel: last.toLevel,
          narrative: first.narrative,
        },
      ]
    }
  }

  const nextBucket: StatUsageBucket = {
    uses,
    level,
    luckCreditsThisChapter,
    usedThisChapter,
  }

  return {
    state: {
      ...state,
      buckets: { ...state.buckets, [stat]: nextBucket },
      ledgerEntries: mergedLedger,
    },
    levelUp: levelUpCount > 0 ? stat : null,
    levelUpCount,
  }
}

export interface ChapterBoundaryInput {
  state: SkillProgressionState
  /** The chapter just FINISHED — used to decide whether to run decay. */
  finishedChapter: number
  /** Current stat snapshot, so decay can return a concrete delta. */
  currentStats: Record<StatName, number>
}

export interface ChapterBoundaryResult {
  state: SkillProgressionState
  /** Stat adjustments the caller must apply to the character (e.g. modifyStat). */
  statDeltas: Partial<Record<StatName, number>>
  /** Ledger lines to show in the Frog's Ledger before the state is reset. */
  ledgerEntries: LedgerEntry[]
}

/**
 * Run chapter-boundary bookkeeping:
 *   1) Generate ledger entries (already accumulated during the chapter).
 *   2) Apply decay to Diplomacy if it wasn't used.
 *   3) Reset per-chapter bookkeeping (luck credits, usedThisChapter, ledger).
 */
export function runChapterBoundary(
  input: ChapterBoundaryInput,
): ChapterBoundaryResult {
  const { state, finishedChapter, currentStats } = input
  const statDeltas: Partial<Record<StatName, number>> = {}
  const decayLedger: LedgerEntry[] = []

  const nextBuckets = { ...state.buckets }
  for (const stat of DECAY_STATS) {
    const b = nextBuckets[stat]
    if (!b.usedThisChapter && currentStats[stat] > 1) {
      statDeltas[stat] = -1
      decayLedger.push({
        stat,
        fromLevel: currentStats[stat],
        toLevel: currentStats[stat] - 1,
        narrative: 'unused — the skill atrophied',
      })
    }
  }

  // Reset per-chapter bookkeeping on every bucket.
  for (const stat of STATS) {
    nextBuckets[stat] = {
      ...nextBuckets[stat],
      luckCreditsThisChapter: 0,
      usedThisChapter: false,
    }
  }

  const ledger = [...state.ledgerEntries, ...decayLedger]

  return {
    state: {
      ...state,
      buckets: nextBuckets,
      lastDecayChapter: finishedChapter,
      ledgerEntries: [], // cleared for next chapter
    },
    statDeltas,
    ledgerEntries: ledger,
  }
}

/** Set or update the player's tagged stats — used by character creation. */
export function setTaggedStats(
  state: SkillProgressionState,
  taggedStats: StatName[],
): SkillProgressionState {
  return { ...state, taggedStats: taggedStats.slice(0, 2) }
}

/** Stable list of all SADDLE stats, for UI iteration. */
export const ALL_SADDLE_STATS: readonly StatName[] = STATS
