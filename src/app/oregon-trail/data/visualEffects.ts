/**
 * Visual Effects System — Retro DOS Aesthetic
 *
 * CSS-based visual effects triggered by game events.
 * All effects respect the CRT/DOS theme: scanlines, phosphor glow,
 * amber/green terminal colors, and pixel-style animations.
 *
 * Effects are defined as data, consumed by UI components via className injection.
 * No actual CSS is in this file — just the hooks and metadata.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VisualEffect {
  id: string
  name: string
  description: string
  cssClass: string           // Tailwind/CSS class to apply
  duration: number           // milliseconds
  layer: 'overlay' | 'text' | 'border' | 'background'
  intensity: 'subtle' | 'medium' | 'dramatic'
}

export interface NarratorVisualStyle {
  mood: string
  fontClass: string          // Text styling
  borderClass: string        // Panel border styling
  bgClass: string            // Background color/effect
  avatarGlow: string         // Glow effect on narrator avatar
  textEffect?: string        // Animation on text appearance
}

export interface KarmaVisualConfig {
  type: 'good' | 'neutral' | 'bad'
  emoji: string
  colorClass: string
  glowClass: string
  pulseOnChange: string      // CSS animation class
  barColorClass: string
  barBgClass: string
}

export interface ReputationVisualConfig {
  faction: string
  colorClass: string
  iconClass: string
  barStyle: 'solid' | 'striped' | 'gradient'
}

// ============================================================================
// VISUAL EFFECTS — Triggered by game events
// ============================================================================

export const VISUAL_EFFECTS: Record<string, VisualEffect> = {
  // Karma flashes
  'flash-golden': {
    id: 'flash-golden',
    name: 'Golden Shimmer',
    description: 'Brief golden flash when good karma earned',
    cssClass: 'animate-pulse bg-yellow-400/20 border-yellow-400',
    duration: 800,
    layer: 'overlay',
    intensity: 'subtle',
  },
  'flash-dark': {
    id: 'flash-dark',
    name: 'Dark Pulse',
    description: 'Brief dark pulse when bad karma earned',
    cssClass: 'animate-pulse bg-red-900/30 border-red-700',
    duration: 800,
    layer: 'overlay',
    intensity: 'subtle',
  },
  'flash-taco': {
    id: 'flash-taco',
    name: 'Neutral Clink',
    description: 'Brief warm flash when neutral karma earned',
    cssClass: 'animate-pulse bg-orange-400/15 border-orange-300',
    duration: 500,
    layer: 'overlay',
    intensity: 'subtle',
  },

  // Screen-level effects
  'screen-flash-gold': {
    id: 'screen-flash-gold',
    name: 'Level Up Flash',
    description: 'Full-screen golden flash on level up',
    cssClass: 'animate-ping bg-yellow-300/40',
    duration: 1500,
    layer: 'overlay',
    intensity: 'dramatic',
  },
  'screen-shake': {
    id: 'screen-shake',
    name: 'Screen Shake',
    description: 'Brief screen shake on encounter start',
    cssClass: 'animate-bounce',
    duration: 600,
    layer: 'overlay',
    intensity: 'medium',
  },
  'screen-red-flash': {
    id: 'screen-red-flash',
    name: 'Betrayal Flash',
    description: 'Red screen flash on ally betrayal',
    cssClass: 'animate-pulse bg-red-600/40 border-red-500',
    duration: 1200,
    layer: 'overlay',
    intensity: 'dramatic',
  },
  'screen-darken': {
    id: 'screen-darken',
    name: 'Storm Darken',
    description: 'Screen darkens during storm',
    cssClass: 'bg-gray-900/60 transition-all duration-1000',
    duration: 3000,
    layer: 'overlay',
    intensity: 'medium',
  },
  'screen-fade-black': {
    id: 'screen-fade-black',
    name: 'Fade to Black',
    description: 'Slow fade to black on game over',
    cssClass: 'bg-black transition-opacity duration-3000',
    duration: 3000,
    layer: 'overlay',
    intensity: 'dramatic',
  },
  'screen-crack': {
    id: 'screen-crack',
    name: 'Fourth Wall Crack',
    description: 'Screen "cracks" when narrator breaks fourth wall',
    cssClass: 'border-4 border-red-400 border-dashed animate-pulse',
    duration: 2000,
    layer: 'border',
    intensity: 'dramatic',
  },

  // Text effects
  'text-wobble': {
    id: 'text-wobble',
    name: 'Suspicious Text',
    description: 'Text wobbles when narrator is lying',
    cssClass: 'animate-pulse italic text-yellow-200/80',
    duration: 1000,
    layer: 'text',
    intensity: 'subtle',
  },
  'text-amber': {
    id: 'text-amber',
    name: 'Twain Amber',
    description: 'Text turns amber when Twain mood active',
    cssClass: 'text-amber-300 font-serif',
    duration: 0,  // persistent while mood active
    layer: 'text',
    intensity: 'subtle',
  },
  'text-sway': {
    id: 'text-sway',
    name: 'Drunk Sway',
    description: 'Text sways when narrator is drunk',
    cssClass: 'animate-pulse skew-x-1 text-green-300/80',
    duration: 0,  // persistent while drunk
    layer: 'text',
    intensity: 'medium',
  },

  // Item/event effects
  'sparkle-burst': {
    id: 'sparkle-burst',
    name: 'Gold Sparkle',
    description: 'Sparkle burst when gold discovered',
    cssClass: 'animate-ping text-yellow-400',
    duration: 1500,
    layer: 'overlay',
    intensity: 'medium',
  },
  'badge-stamp': {
    id: 'badge-stamp',
    name: 'Badge Stamp',
    description: 'Stamp effect when badge earned',
    cssClass: 'animate-bounce scale-150 transition-transform',
    duration: 800,
    layer: 'overlay',
    intensity: 'medium',
  },
  'aura-glow': {
    id: 'aura-glow',
    name: 'Spiritual Aura',
    description: 'Soft glow at spiritual sites',
    cssClass: 'shadow-lg shadow-blue-400/30 border-blue-300/50',
    duration: 0,  // persistent while at site
    layer: 'border',
    intensity: 'subtle',
  },
  'warm-glow': {
    id: 'warm-glow',
    name: 'Campfire Warmth',
    description: 'Warm orange glow during campfire scenes',
    cssClass: 'shadow-lg shadow-orange-400/20 bg-orange-900/10',
    duration: 0,
    layer: 'background',
    intensity: 'subtle',
  },
  'town-approach': {
    id: 'town-approach',
    name: 'Town Approach',
    description: 'Fade-in reveal when arriving at town',
    cssClass: 'animate-fade-in transition-opacity duration-1000',
    duration: 1000,
    layer: 'overlay',
    intensity: 'subtle',
  },
  'building-reveal': {
    id: 'building-reveal',
    name: 'Building Complete',
    description: 'Building "constructs" upward on completion',
    cssClass: 'animate-slide-up transition-transform duration-500',
    duration: 500,
    layer: 'overlay',
    intensity: 'medium',
  },
  'evidence-board-complete': {
    id: 'evidence-board-complete',
    name: 'Case Closed',
    description: 'Red "SOLVED" stamp on evidence board',
    cssClass: 'border-4 border-green-500 animate-pulse',
    duration: 2000,
    layer: 'border',
    intensity: 'dramatic',
  },
  'clue-highlight': {
    id: 'clue-highlight',
    name: 'Clue Found',
    description: 'Magnifying glass highlight on new clue',
    cssClass: 'ring-2 ring-yellow-400 animate-pulse',
    duration: 1200,
    layer: 'border',
    intensity: 'medium',
  },
  'fireworks': {
    id: 'fireworks',
    name: 'Victory Fireworks',
    description: 'Celebratory effect on game win',
    cssClass: 'animate-ping bg-gradient-to-r from-yellow-400/20 via-red-400/20 to-blue-400/20',
    duration: 3000,
    layer: 'overlay',
    intensity: 'dramatic',
  },
}

// ============================================================================
// NARRATOR MOOD VISUAL STYLES — Different "voice" per mood
// ============================================================================

export const NARRATOR_STYLES: Record<string, NarratorVisualStyle> = {
  neutral: {
    mood: 'neutral',
    fontClass: 'font-mono text-green-400',
    borderClass: 'border-green-700',
    bgClass: 'bg-green-900/20',
    avatarGlow: '',
  },
  amused: {
    mood: 'amused',
    fontClass: 'font-mono text-green-300',
    borderClass: 'border-green-500',
    bgClass: 'bg-green-800/20',
    avatarGlow: 'shadow-green-400/30',
  },
  annoyed: {
    mood: 'annoyed',
    fontClass: 'font-mono text-red-300',
    borderClass: 'border-red-700',
    bgClass: 'bg-red-900/20',
    avatarGlow: 'shadow-red-400/30',
  },
  impressed: {
    mood: 'impressed',
    fontClass: 'font-mono text-yellow-300',
    borderClass: 'border-yellow-600',
    bgClass: 'bg-yellow-900/20',
    avatarGlow: 'shadow-yellow-400/30',
  },
  bored: {
    mood: 'bored',
    fontClass: 'font-mono text-gray-400 italic',
    borderClass: 'border-gray-600',
    bgClass: 'bg-gray-900/20',
    avatarGlow: '',
  },
  cryptic: {
    mood: 'cryptic',
    fontClass: 'font-mono text-purple-300',
    borderClass: 'border-purple-700',
    bgClass: 'bg-purple-900/20',
    avatarGlow: 'shadow-purple-400/40',
    textEffect: 'animate-pulse',
  },
  apologetic: {
    mood: 'apologetic',
    fontClass: 'font-mono text-blue-300 italic',
    borderClass: 'border-blue-600',
    bgClass: 'bg-blue-900/20',
    avatarGlow: 'shadow-blue-400/20',
  },
  drinking: {
    mood: 'drinking',
    fontClass: 'font-mono text-green-300/80',
    borderClass: 'border-green-500 border-dashed',
    bgClass: 'bg-green-900/30',
    avatarGlow: 'shadow-green-400/50',
    textEffect: 'text-sway',
  },
  twain: {
    mood: 'twain',
    fontClass: 'font-serif text-amber-300',
    borderClass: 'border-amber-600',
    bgClass: 'bg-amber-900/20',
    avatarGlow: 'shadow-amber-400/30',
    textEffect: 'text-amber',
  },
}

// ============================================================================
// KARMA VISUAL CONFIGURATIONS
// ============================================================================

export const KARMA_VISUALS: Record<string, KarmaVisualConfig> = {
  good: {
    type: 'good',
    emoji: '🍪',
    colorClass: 'text-yellow-400',
    glowClass: 'shadow-yellow-400/30',
    pulseOnChange: 'animate-pulse',
    barColorClass: 'bg-yellow-400',
    barBgClass: 'bg-yellow-900/30',
  },
  neutral: {
    type: 'neutral',
    emoji: '🌮',
    colorClass: 'text-orange-400',
    glowClass: 'shadow-orange-400/30',
    pulseOnChange: 'animate-pulse',
    barColorClass: 'bg-orange-400',
    barBgClass: 'bg-orange-900/30',
  },
  bad: {
    type: 'bad',
    emoji: '🪨',
    colorClass: 'text-red-400',
    glowClass: 'shadow-red-400/30',
    pulseOnChange: 'animate-pulse',
    barColorClass: 'bg-red-500',
    barBgClass: 'bg-red-900/30',
  },
}

// ============================================================================
// REPUTATION FACTION VISUAL CONFIGS
// ============================================================================

export const REPUTATION_VISUALS: Record<string, ReputationVisualConfig> = {
  settlers: {
    faction: 'settlers',
    colorClass: 'text-blue-400',
    iconClass: '🏠',
    barStyle: 'solid',
  },
  outlaws: {
    faction: 'outlaws',
    colorClass: 'text-red-400',
    iconClass: '🗡️',
    barStyle: 'striped',
  },
  natives: {
    faction: 'natives',
    colorClass: 'text-green-400',
    iconClass: '🪶',
    barStyle: 'gradient',
  },
  pinkerton: {
    faction: 'pinkerton',
    colorClass: 'text-yellow-400',
    iconClass: '⭐',
    barStyle: 'solid',
  },
  merchants: {
    faction: 'merchants',
    colorClass: 'text-purple-400',
    iconClass: '💰',
    barStyle: 'solid',
  },
}

// ============================================================================
// CROSS-GAME DASHBOARD DATA
// ============================================================================

export interface CrossGameDashboardConfig {
  gameId: string
  gameName: string
  emoji: string
  colorClass: string
  statusFields: string[]
  karmaLabel: string
}

export const CROSS_GAME_DASHBOARD: CrossGameDashboardConfig[] = [
  {
    gameId: 'prospectors_tale',
    gameName: "A Prospector's Tale",
    emoji: '🤠',
    colorClass: 'text-amber-400 border-amber-600',
    statusFields: ['Day', 'Miles', 'Business Tier', 'Settlement'],
    karmaLabel: 'Trail Karma',
  },
  {
    gameId: 'gold_country_adventure',
    gameName: 'Gold Country Adventure',
    emoji: '⚔️',
    colorClass: 'text-red-400 border-red-600',
    statusFields: ['Chapter', 'Level', 'Party Size', 'Skills'],
    karmaLabel: 'Adventure Karma',
  },
  {
    gameId: 'gold_country_explorer',
    gameName: 'Gold Country Explorer',
    emoji: '🗺️',
    colorClass: 'text-green-400 border-green-600',
    statusFields: ['Level', 'Towns Visited', 'Mysteries Solved', 'Badges'],
    karmaLabel: 'Explorer Karma',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getVisualEffect(effectId: string): VisualEffect | null {
  return VISUAL_EFFECTS[effectId] || null
}

export function getNarratorStyle(mood: string): NarratorVisualStyle {
  return NARRATOR_STYLES[mood] || NARRATOR_STYLES.neutral
}

export function getKarmaVisual(type: string): KarmaVisualConfig {
  return KARMA_VISUALS[type] || KARMA_VISUALS.neutral
}

export function getReputationVisual(faction: string): ReputationVisualConfig | null {
  return REPUTATION_VISUALS[faction] || null
}

/**
 * Get the appropriate visual effect for a sound event.
 * Maps from sound hooks to visual effects.
 */
export function getVisualForSoundEvent(eventId: string): VisualEffect | null {
  // Import mapping from asciiArt.ts SOUND_HOOKS visualEffect field
  const effectMap: Record<string, string> = {
    'karma_good_earned': 'flash-golden',
    'karma_bad_earned': 'flash-dark',
    'karma_neutral_earned': 'flash-taco',
    'level_up': 'screen-flash-gold',
    'encounter_start': 'screen-shake',
    'ally_betrayal': 'screen-red-flash',
    'narrator_lie': 'text-wobble',
    'narrator_twain': 'text-amber',
    'narrator_drinking': 'text-sway',
    'narrator_fourth_wall': 'screen-crack',
    'spiritual_site_visit': 'aura-glow',
    'gold_discovered': 'sparkle-burst',
    'badge_earned': 'badge-stamp',
    'mystery_solved': 'evidence-board-complete',
    'mystery_clue_found': 'clue-highlight',
    'storm': 'screen-darken',
    'campfire': 'warm-glow',
    'game_over': 'screen-fade-black',
    'game_win': 'fireworks',
  }
  const effectId = effectMap[eventId]
  return effectId ? getVisualEffect(effectId) : null
}
