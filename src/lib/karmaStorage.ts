/**
 * BOBR Unified Karma System - Storage Layer
 *
 * D&D 3.5 alignment-style karma shared across all BOBR games.
 * Two-axis system: Lawful/Chaotic (-100 to +100) and Good/Evil (-100 to +100)
 *
 * Alignment affects discount multipliers:
 * - Lawful Good: 1.5x discount
 * - True Neutral: 1.0x discount
 * - Chaotic Evil: 0.5x discount
 */

export const KARMA_STORAGE_KEY = 'bobr_unified_karma';
export const KARMA_VERSION = '1.0.0';
export const MAX_HISTORY_ENTRIES = 100;

// Alignment boundaries (values beyond these clamp)
export const ALIGNMENT_MIN = -100;
export const ALIGNMENT_MAX = 100;

// Alignment position names
export type AlignmentPosition =
  | 'lawful_good' | 'neutral_good' | 'chaotic_good'
  | 'lawful_neutral' | 'true_neutral' | 'chaotic_neutral'
  | 'lawful_evil' | 'neutral_evil' | 'chaotic_evil';

// Karma source (which game/feature generated the action)
export type KarmaSource =
  | 'mystery_game'
  | 'rpg_adventure'
  | 'oregon_trail'
  | 'house_rules_quiz'
  | 'manual_adjustment';

export interface KarmaAlignment {
  lawfulChaotic: number;  // -100 (lawful) to +100 (chaotic)
  goodEvil: number;       // -100 (good) to +100 (evil)
}

export interface KarmaAction {
  id: string;
  source: KarmaSource;
  description: string;
  lawfulDelta: number;
  goodDelta: number;
  timestamp: string;
}

export interface KarmaState {
  version: string;
  alignment: KarmaAlignment;
  history: KarmaAction[];
  houseRulesCompleted: boolean;
  houseRulesScore: number;  // 0-10 questions correct
  hintsUsedTotal: number;
  casesCompletedWithoutHints: number;
  lastSyncTimestamp: string;
}

// Discount multipliers by alignment
export const KARMA_MULTIPLIERS: Record<AlignmentPosition, number> = {
  lawful_good: 1.5,
  neutral_good: 1.3,
  chaotic_good: 1.2,
  lawful_neutral: 1.1,
  true_neutral: 1.0,
  chaotic_neutral: 0.9,
  lawful_evil: 0.8,
  neutral_evil: 0.6,
  chaotic_evil: 0.5,
};

// Display names for alignment positions
export const ALIGNMENT_DISPLAY_NAMES: Record<AlignmentPosition, string> = {
  lawful_good: 'Lawful Good',
  neutral_good: 'Neutral Good',
  chaotic_good: 'Chaotic Good',
  lawful_neutral: 'Lawful Neutral',
  true_neutral: 'True Neutral',
  chaotic_neutral: 'Chaotic Neutral',
  lawful_evil: 'Lawful Evil',
  neutral_evil: 'Neutral Evil',
  chaotic_evil: 'Chaotic Evil',
};

// Default starting state (True Neutral)
export const DEFAULT_KARMA_STATE: KarmaState = {
  version: KARMA_VERSION,
  alignment: {
    lawfulChaotic: 0,
    goodEvil: 0,
  },
  history: [],
  houseRulesCompleted: false,
  houseRulesScore: 0,
  hintsUsedTotal: 0,
  casesCompletedWithoutHints: 0,
  lastSyncTimestamp: new Date().toISOString(),
};

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a unique action ID
 */
function generateActionId(): string {
  return `karma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the alignment position based on current values
 */
export function getAlignmentPosition(alignment: KarmaAlignment): AlignmentPosition {
  const { lawfulChaotic, goodEvil } = alignment;

  // Determine lawful/chaotic axis (thresholds at -33 and +33)
  let lawAxis: 'lawful' | 'neutral' | 'chaotic';
  if (lawfulChaotic <= -33) {
    lawAxis = 'lawful';
  } else if (lawfulChaotic >= 33) {
    lawAxis = 'chaotic';
  } else {
    lawAxis = 'neutral';
  }

  // Determine good/evil axis (thresholds at -33 and +33)
  let goodAxis: 'good' | 'neutral' | 'evil';
  if (goodEvil <= -33) {
    goodAxis = 'good';
  } else if (goodEvil >= 33) {
    goodAxis = 'evil';
  } else {
    goodAxis = 'neutral';
  }

  // Combine axes (special case for true neutral)
  if (lawAxis === 'neutral' && goodAxis === 'neutral') {
    return 'true_neutral';
  }

  return `${lawAxis}_${goodAxis}` as AlignmentPosition;
}

/**
 * Get discount multiplier for current alignment
 */
export function getDiscountMultiplier(alignment: KarmaAlignment): number {
  const position = getAlignmentPosition(alignment);
  return KARMA_MULTIPLIERS[position];
}

/**
 * Calculate final discount with karma modifier
 */
export function calculateKarmaDiscount(baseDiscount: number, alignment: KarmaAlignment): number {
  const multiplier = getDiscountMultiplier(alignment);
  const finalDiscount = Math.round(baseDiscount * multiplier);
  return Math.min(35, finalDiscount); // Cap at 35%
}

/**
 * Karma Storage API
 */
export const KarmaStorage = {
  /**
   * Initialize karma storage with defaults if empty
   */
  init(): KarmaState {
    const existing = this.load();
    if (!existing) {
      this.save(DEFAULT_KARMA_STATE);
      return { ...DEFAULT_KARMA_STATE };
    }
    // Handle version migration if needed
    if (existing.version !== KARMA_VERSION) {
      return this.migrate(existing);
    }
    return existing;
  },

  /**
   * Load karma state from localStorage
   */
  load(): KarmaState | null {
    try {
      if (typeof window === 'undefined') return null;
      const data = localStorage.getItem(KARMA_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load karma state:', e);
      return null;
    }
  },

  /**
   * Save karma state to localStorage
   */
  save(state: KarmaState): boolean {
    try {
      if (typeof window === 'undefined') return false;
      state.lastSyncTimestamp = new Date().toISOString();
      localStorage.setItem(KARMA_STORAGE_KEY, JSON.stringify(state));
      // Dispatch storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: KARMA_STORAGE_KEY,
        newValue: JSON.stringify(state),
      }));
      return true;
    } catch (e) {
      console.error('Failed to save karma state:', e);
      return false;
    }
  },

  /**
   * Apply a karma action (positive = chaotic/evil, negative = lawful/good)
   */
  applyAction(
    source: KarmaSource,
    description: string,
    lawfulDelta: number,
    goodDelta: number
  ): KarmaState {
    const state = this.load() || { ...DEFAULT_KARMA_STATE };

    // Create action record
    const action: KarmaAction = {
      id: generateActionId(),
      source,
      description,
      lawfulDelta,
      goodDelta,
      timestamp: new Date().toISOString(),
    };

    // Apply deltas with clamping
    state.alignment.lawfulChaotic = clamp(
      state.alignment.lawfulChaotic + lawfulDelta,
      ALIGNMENT_MIN,
      ALIGNMENT_MAX
    );
    state.alignment.goodEvil = clamp(
      state.alignment.goodEvil + goodDelta,
      ALIGNMENT_MIN,
      ALIGNMENT_MAX
    );

    // Add to history (keep last MAX_HISTORY_ENTRIES)
    state.history.unshift(action);
    if (state.history.length > MAX_HISTORY_ENTRIES) {
      state.history = state.history.slice(0, MAX_HISTORY_ENTRIES);
    }

    this.save(state);
    return state;
  },

  /**
   * Record a hint used
   */
  recordHintUsed(): KarmaState {
    const state = this.load() || { ...DEFAULT_KARMA_STATE };
    state.hintsUsedTotal++;
    // Hints are a small chaotic/evil action
    return this.applyAction(
      'mystery_game',
      'Used a hint',
      5,   // Slightly chaotic (taking shortcuts)
      2    // Slightly evil (not doing the work)
    );
  },

  /**
   * Record case completed without hints
   */
  recordCleanCompletion(): KarmaState {
    const state = this.load() || { ...DEFAULT_KARMA_STATE };
    state.casesCompletedWithoutHints++;
    // Clean completion is lawful and good
    return this.applyAction(
      'mystery_game',
      'Completed case without hints',
      -15,  // Lawful (thoroughness)
      -10   // Good (integrity)
    );
  },

  /**
   * Record house rules quiz completion
   */
  recordHouseRulesCompletion(correctAnswers: number): KarmaState {
    const state = this.load() || { ...DEFAULT_KARMA_STATE };
    state.houseRulesCompleted = true;
    state.houseRulesScore = correctAnswers;

    // Base karma for completing quiz
    let lawfulBonus = -20;  // Bonus for following house rules
    let goodBonus = 0;

    // Additional karma per correct answer
    lawfulBonus += correctAnswers * -5;
    goodBonus += correctAnswers * -3;

    return this.applyAction(
      'house_rules_quiz',
      `Completed house rules quiz (${correctAnswers}/10 correct)`,
      lawfulBonus,
      goodBonus
    );
  },

  /**
   * Migrate from older versions
   */
  migrate(oldState: Partial<KarmaState>): KarmaState {
    const migrated: KarmaState = {
      ...DEFAULT_KARMA_STATE,
      ...oldState,
      version: KARMA_VERSION,
      alignment: oldState.alignment || DEFAULT_KARMA_STATE.alignment,
      history: oldState.history || [],
    };
    this.save(migrated);
    return migrated;
  },

  /**
   * Reset karma to defaults (for testing)
   */
  reset(): KarmaState {
    const freshState = { ...DEFAULT_KARMA_STATE };
    this.save(freshState);
    return freshState;
  },

  /**
   * Get alignment position name
   */
  getPosition(): AlignmentPosition {
    const state = this.load() || DEFAULT_KARMA_STATE;
    return getAlignmentPosition(state.alignment);
  },

  /**
   * Get current discount multiplier
   */
  getMultiplier(): number {
    const state = this.load() || DEFAULT_KARMA_STATE;
    return getDiscountMultiplier(state.alignment);
  },

  /**
   * Export karma state for backup
   */
  export(): string {
    return JSON.stringify(this.load(), null, 2);
  },

  /**
   * Import karma state from backup
   */
  import(jsonString: string): boolean {
    try {
      const state = JSON.parse(jsonString) as KarmaState;
      return this.save(state);
    } catch (e) {
      console.error('Failed to import karma state:', e);
      return false;
    }
  },
};

export default KarmaStorage;
