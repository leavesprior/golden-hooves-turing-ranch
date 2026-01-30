// NPC Mood Scale System
// 5-point visible mood scale with face icons and mechanical effects
// Inspired by Neverwinter Nights 1991's disposition system

import type { NPCMood } from '@/lib/ollama/types'

// ============================================================================
// 5-POINT MOOD SCALE
// ============================================================================
// Maps the 8 NPCMood states onto a 5-point linear scale for visual display
// and mechanical effects on clue quality and information willingness.

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodScaleEntry {
  level: MoodLevel
  label: string
  face: string            // Emoji face for small mood indicator
  icon: string            // Larger icon for detail view
  color: string           // Sepia palette color
  borderColor: string     // Border for mood indicator
  bgColor: string         // Background for mood indicator
  description: string     // Tooltip text
  clueQualityMod: number  // -2 to +2, affects clue reliability
  willTalk: boolean       // Whether NPC will share information
  bonusInfo: boolean      // Whether NPC reveals extra details
}

export const MOOD_SCALE: Record<MoodLevel, MoodScaleEntry> = {
  1: {
    level: 1,
    label: 'Hostile',
    face: '😠',
    icon: '🔥',
    color: '#ef4444',
    borderColor: '#dc2626',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    description: 'This person wants nothing to do with you. They may lie or refuse to speak.',
    clueQualityMod: -2,
    willTalk: false,
    bonusInfo: false,
  },
  2: {
    level: 2,
    label: 'Suspicious',
    face: '🤨',
    icon: '👁️',
    color: '#f59e0b',
    borderColor: '#d97706',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    description: 'They don\'t trust you. Information may be unreliable.',
    clueQualityMod: -1,
    willTalk: true,
    bonusInfo: false,
  },
  3: {
    level: 3,
    label: 'Neutral',
    face: '😐',
    icon: '⚖️',
    color: '#a08050',
    borderColor: '#8b6914',
    bgColor: 'rgba(160, 128, 80, 0.15)',
    description: 'Indifferent. They\'ll answer questions but won\'t volunteer information.',
    clueQualityMod: 0,
    willTalk: true,
    bonusInfo: false,
  },
  4: {
    level: 4,
    label: 'Friendly',
    face: '🙂',
    icon: '🤝',
    color: '#22c55e',
    borderColor: '#16a34a',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    description: 'They like you. More willing to share what they know.',
    clueQualityMod: 1,
    willTalk: true,
    bonusInfo: false,
  },
  5: {
    level: 5,
    label: 'Trusting',
    face: '😊',
    icon: '💛',
    color: '#d4a843',
    borderColor: '#8b6914',
    bgColor: 'rgba(212, 168, 67, 0.2)',
    description: 'They trust you completely. May reveal secret passages, outlaw locations, or bonus clues.',
    clueQualityMod: 2,
    willTalk: true,
    bonusInfo: true,
  },
}

// ============================================================================
// MOOD MAPPING: NPCMood -> MoodLevel
// ============================================================================
// Maps the 8 existing NPCMood string states to numeric scale positions

const MOOD_TO_LEVEL: Record<NPCMood, MoodLevel> = {
  suspicious: 2,
  annoyed: 2,
  frightened: 2,
  neutral: 3,
  distracted: 3,
  amused: 4,
  friendly: 4,
  drunk: 3,                    // Drunk = unpredictable, treat as neutral
}

// Safely map any mood string to a level, defaulting to neutral
export function getMoodLevel(mood: NPCMood | string): MoodLevel {
  return (MOOD_TO_LEVEL as Record<string, MoodLevel>)[mood] ?? 3
}

export function getMoodEntry(mood: NPCMood | string): MoodScaleEntry {
  return MOOD_SCALE[getMoodLevel(mood)]
}

// ============================================================================
// TRUST -> MOOD LEVEL MAPPING
// ============================================================================
// Trust (0-10) maps to mood display. This provides a secondary way to
// derive visible mood from the trust numeric value.

export function trustToMoodLevel(trustLevel: number): MoodLevel {
  if (trustLevel <= 1) return 1
  if (trustLevel <= 3) return 2
  if (trustLevel <= 5) return 3
  if (trustLevel <= 7) return 4
  return 5
}

export function getMoodFromTrust(trustLevel: number): MoodScaleEntry {
  return MOOD_SCALE[trustToMoodLevel(trustLevel)]
}

// ============================================================================
// MOOD SHIFT ACTIONS
// ============================================================================
// Actions the player can take that shift NPC mood up or down

export type MoodAction =
  | 'bribe'           // +1 if suspicious/neutral, -1 if friendly (insulting)
  | 'threaten'        // -2 always
  | 'compliment'      // +1 usually
  | 'share_info'      // +1 if they value knowledge
  | 'show_badge'      // +1 with lawful, -1 with outlaws
  | 'buy_drink'       // +1 at saloon
  | 'lie'             // -1 if caught, +1 if not
  | 'help_task'       // +2 always
  | 'insult'          // -2 always
  | 'patience'        // +1 slow but steady

export interface MoodShiftResult {
  newLevel: MoodLevel
  oldLevel: MoodLevel
  delta: number
  message: string
}

export function calculateMoodShift(
  currentTrust: number,
  action: MoodAction,
  witnessTemperament: 'friendly' | 'neutral' | 'suspicious' | 'hostile',
): MoodShiftResult {
  const oldLevel = trustToMoodLevel(currentTrust)

  let delta = 0
  let message = ''

  switch (action) {
    case 'bribe':
      if (witnessTemperament === 'suspicious' || witnessTemperament === 'neutral') {
        delta = 1
        message = 'The coins speak louder than words.'
      } else {
        delta = -1
        message = 'They seem offended by the offer.'
      }
      break
    case 'threaten':
      delta = -2
      message = 'Fear is a poor substitute for trust.'
      break
    case 'compliment':
      delta = 1
      message = 'A kind word goes a long way.'
      break
    case 'share_info':
      delta = witnessTemperament === 'suspicious' ? 2 : 1
      message = 'Information freely given builds trust.'
      break
    case 'show_badge':
      delta = witnessTemperament === 'hostile' ? -1 : 1
      message = witnessTemperament === 'hostile'
        ? 'The badge only makes them more guarded.'
        : 'Your authority carries weight here.'
      break
    case 'buy_drink':
      delta = 1
      message = 'Shared drinks, shared stories.'
      break
    case 'lie':
      // 50/50 chance of being caught - caller should determine
      delta = 0  // Caller decides based on skill check
      message = 'Deception is a risky gambit.'
      break
    case 'help_task':
      delta = 2
      message = 'Actions speak louder than words.'
      break
    case 'insult':
      delta = -2
      message = 'That was unwise.'
      break
    case 'patience':
      delta = 1
      message = 'Patience opens doors that force cannot.'
      break
  }

  const newTrust = Math.max(0, Math.min(10, currentTrust + delta * 2))
  const newLevel = trustToMoodLevel(newTrust)

  return { newLevel, oldLevel, delta, message }
}

// ============================================================================
// MOOD-DEPENDENT CLUE QUALITY
// ============================================================================
// Higher mood = more reliable clues, lower mood = lies or refusal

export function getClueReliabilityMod(moodLevel: MoodLevel): number {
  return MOOD_SCALE[moodLevel].clueQualityMod
}

export function willNPCShareClue(moodLevel: MoodLevel): boolean {
  return MOOD_SCALE[moodLevel].willTalk
}

export function willNPCShareBonusInfo(moodLevel: MoodLevel): boolean {
  return MOOD_SCALE[moodLevel].bonusInfo
}

// Get flavor text for mood-dependent clue delivery
export function getMoodClueDelivery(moodLevel: MoodLevel): string {
  switch (moodLevel) {
    case 1:
      return 'They refuse to say anything useful.'
    case 2:
      return 'They share reluctantly, glancing around nervously...'
    case 3:
      return 'They answer matter-of-factly.'
    case 4:
      return 'They lean in and share openly.'
    case 5:
      return 'They pull you aside and whisper something extra...'
  }
}
