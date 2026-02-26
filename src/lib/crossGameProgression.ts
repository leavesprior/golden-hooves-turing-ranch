/**
 * BOBR Cross-Game Progression System - Storage Layer
 *
 * Unified state store that bridges all BOBR games.
 * Follows the exact KarmaStorage pattern (karmaStorage.ts).
 *
 * Tracks: game unlocks, milestones, character quality bridge,
 * time echoes (Prologue -> 1849), persistent reputation, shared bounties.
 *
 * localStorage key: bobr_cross_game_progression
 */

export const CROSS_GAME_STORAGE_KEY = 'bobr_cross_game_progression'
export const CROSS_GAME_VERSION = '1.0.0'

// ============================================
// GAME IDS
// ============================================

export type GameId =
  | 'mystery_game'
  | 'gold_country_explorer'
  | 'prospectors_tale'
  | 'rpg_adventure'
  | 'location_hunt'
  | 'prologue'
  | 'ranch_treasure_hunt'
  | 'clue_game'
  | 'karma_marketplace'

// ============================================
// MILESTONE SYSTEM
// ============================================

export type MilestoneId =
  // Prospector's Tale milestones
  | 'reached_west_point'
  | 'completed_journey_west'
  | 'completed_gold_country'
  | 'captured_black_bart'
  // Adventure milestones
  | 'adventure_chapter_1'
  | 'adventure_chapter_2'
  | 'adventure_chapter_3'
  | 'adventure_chapter_4'
  | 'adventure_chapter_5'
  // Clue game milestones
  | 'clue_game_unlocked'
  // Prologue milestones
  | 'prologue_norseman_complete'
  | 'prologue_native_complete'
  | 'prologue_califia_complete'
  | 'prologue_incan_complete'
  | 'prologue_convergence_complete'
  // Booking verification
  | 'booking_verified'
  // Karma Marketplace milestones
  | 'first_donation'
  | 'treat_all_animals'
  | 'momento_collector'
  | 'complete_momentos'
  // Explorer milestones
  | 'explorer_first_mystery_solved'
  | 'explorer_all_mysteries_solved'
  | 'explorer_legendary_level'
  | 'explorer_spiritual_awareness'
  | 'explorer_twain_scholar'
  | 'explorer_califia_seeker'
  | 'explorer_miwok_historian'
  | 'explorer_ranch_pioneer'
  // Cross-game karma milestones
  | 'karma_good_alignment'
  | 'karma_lawful_good'
  | 'karma_total_1000'

export interface Milestone {
  id: MilestoneId
  source: GameId
  timestamp: string
  metadata?: Record<string, unknown>
}

// ============================================
// GAME UNLOCK CONDITIONS
// ============================================

export type UnlockCondition =
  | { type: 'always' }
  | { type: 'milestone'; milestoneId: MilestoneId }
  | { type: 'milestones_all'; milestoneIds: MilestoneId[] }
  | { type: 'milestones_any'; milestoneIds: MilestoneId[] }
  | { type: 'composite'; conditions: UnlockCondition[] }

export interface GameUnlockConfig {
  gameId: GameId
  name: string
  condition: UnlockCondition
  unlockMessage: string
}

export const GAME_UNLOCK_CONFIGS: GameUnlockConfig[] = [
  {
    gameId: 'mystery_game',
    name: 'Mystery Game',
    condition: { type: 'always' },
    unlockMessage: '',
  },
  {
    gameId: 'gold_country_explorer',
    name: 'Gold Country Explorer',
    condition: { type: 'always' },
    unlockMessage: '',
  },
  {
    gameId: 'prospectors_tale',
    name: "The Prospector's Tale",
    condition: { type: 'always' },
    unlockMessage: '',
  },
  {
    gameId: 'rpg_adventure',
    name: 'RPG Adventure',
    condition: { type: 'always' },
    unlockMessage: '',
  },
  {
    gameId: 'location_hunt',
    name: 'Location Hunt',
    condition: { type: 'always' },
    unlockMessage: '',
  },
  {
    gameId: 'prologue',
    name: 'Play The Prologue',
    condition: { type: 'milestone', milestoneId: 'booking_verified' },
    unlockMessage: 'Booking verified! The ancient world awaits...',
  },
  {
    gameId: 'ranch_treasure_hunt',
    name: 'Ranch Treasure Hunt',
    condition: { type: 'milestone', milestoneId: 'reached_west_point' },
    unlockMessage: 'You reached West Point! A treasure hunt awaits at the ranch...',
  },
  {
    gameId: 'clue_game',
    name: "Cynthia's Treasure Hunt",
    condition: {
      type: 'composite',
      conditions: [
        { type: 'milestone', milestoneId: 'adventure_chapter_5' },
        // Karma check is handled in the component (ClueGameUnlock)
      ],
    },
    unlockMessage: 'Cynthia has a quest for you...',
  },
]

// ============================================
// CHARACTER QUALITY BRIDGE
// ============================================

/**
 * Derived qualities that translate between character systems.
 * Avoids direct S.A.D.D.L.E. <-> D&D stat mapping.
 * Each quality is 0-100, computed from whichever system the player used.
 */
export interface CharacterQualities {
  investigation: number  // Shrewdness, INT-based skills
  survival: number       // Expertise, Durability, wilderness skills
  social: number         // Diplomacy, CHA-based skills
  combat: number         // Agility, STR/DEX-based skills
  resilience: number     // Durability, CON-based endurance
  fortune: number        // Luck, random event modifiers
}

const DEFAULT_QUALITIES: CharacterQualities = {
  investigation: 50,
  survival: 50,
  social: 50,
  combat: 50,
  resilience: 50,
  fortune: 50,
}

/**
 * Compute derived qualities from S.A.D.D.L.E. stats (0-20 scale).
 */
export function qualitiesFromSaddle(stats: {
  Shrewdness: number
  Agility: number
  Durability: number
  Diplomacy: number
  Luck: number
  Expertise: number
}): CharacterQualities {
  const normalize = (val: number) => Math.round(Math.min(100, Math.max(0, (val / 20) * 100)))
  return {
    investigation: normalize(stats.Shrewdness),
    survival: normalize((stats.Expertise + stats.Durability) / 2),
    social: normalize(stats.Diplomacy),
    combat: normalize(stats.Agility),
    resilience: normalize(stats.Durability),
    fortune: normalize(stats.Luck),
  }
}

// ============================================
// TIME ECHOES (Prologue -> 1849 games)
// ============================================

export type TimeEchoId =
  | 'norse_runestone'
  | 'cahokian_mound_earth'
  | 'chumash_star_chart'
  | 'incan_quipu_1849'
  | 'aztec_codex_prospector'
  | 'guide_ranch_comment'
  | 'number_42'

export interface TimeEcho {
  id: TimeEchoId
  title: string
  description: string
  prologueSource: string  // Which Prologue act/character
  manifestsIn: GameId[]   // Which 1849 games show the echo
  discovered: boolean
  discoveredTimestamp?: string
}

export const TIME_ECHO_DEFINITIONS: Omit<TimeEcho, 'discovered' | 'discoveredTimestamp'>[] = [
  {
    id: 'norse_runestone',
    title: 'Norse Runestone',
    description: 'Ancient runes carved beneath a Gold Rush mine: "We were here first" in Old Norse.',
    prologueSource: 'norseman',
    manifestsIn: ['prospectors_tale', 'ranch_treasure_hunt'],
  },
  {
    id: 'cahokian_mound_earth',
    title: 'Cahokian Earth',
    description: 'Sacred mound earth in the soil beneath Back of Beyond Ranch.',
    prologueSource: 'native',
    manifestsIn: ['ranch_treasure_hunt'],
  },
  {
    id: 'chumash_star_chart',
    title: 'Chumash Star Chart',
    description: 'A star chart that, decoded, shows the coordinates of the ranch.',
    prologueSource: 'califia',
    manifestsIn: ['ranch_treasure_hunt', 'rpg_adventure'],
  },
  {
    id: 'incan_quipu_1849',
    title: 'Incan Quipu',
    description: 'A quipu encoding the number 1849.',
    prologueSource: 'incan',
    manifestsIn: ['prospectors_tale'],
  },
  {
    id: 'aztec_codex_prospector',
    title: 'Aztec Codex',
    description: 'A codex page showing a figure that looks remarkably like a Gold Rush prospector.',
    prologueSource: 'convergence',
    manifestsIn: ['prospectors_tale', 'rpg_adventure'],
  },
  {
    id: 'guide_ranch_comment',
    title: "The Guide's Prophecy",
    description: '"In approximately 849 years, someone will build a rather nice ranch right about... here."',
    prologueSource: 'convergence',
    manifestsIn: ['ranch_treasure_hunt'],
  },
  {
    id: 'number_42',
    title: 'The Answer',
    description: 'The number 42 appears exactly 42 times across all content.',
    prologueSource: 'all',
    manifestsIn: ['prologue', 'prospectors_tale', 'ranch_treasure_hunt', 'rpg_adventure'],
  },
]

// ============================================
// PERSISTENT REPUTATION
// ============================================

export type FactionId = 'pinkerton' | 'settlers' | 'natives' | 'outlaws'

export interface MapDiscovery {
  locationId: string
  source: GameId
  timestamp: string
  icon?: string
  label?: string
}

export interface ReputationSnapshot {
  reputations: Record<FactionId, number>
  lastUpdated: string
}

// ============================================
// BOUNTY SYSTEM (shared between games)
// ============================================

export type BountyStatus = 'active' | 'completed' | 'failed' | 'expired'

export interface SharedBounty {
  id: string
  targetName: string
  description: string
  reward: number
  status: BountyStatus
  originGame: GameId
  completedInGame?: GameId
  issuedTimestamp: string
  completedTimestamp?: string
}

// ============================================
// SHARED KARMA POOL
// ============================================

export interface SharedKarmaPool {
  good: number
  neutral: number
  bad: number
  totalEarned: number  // lifetime total across all games
  lastSource: GameId | null
  lastSyncTimestamp: string
}

export interface KarmaTransferEvent {
  fromGame: GameId
  karmaType: 'good' | 'neutral' | 'bad'
  amount: number
  reason: string
  timestamp: string
}

const DEFAULT_KARMA_POOL: SharedKarmaPool = {
  good: 0,
  neutral: 0,
  bad: 0,
  totalEarned: 0,
  lastSource: null,
  lastSyncTimestamp: new Date().toISOString(),
}

// ============================================
// SPIRITUAL AWARENESS (cross-game buff)
// ============================================

export interface SpiritualAwareness {
  sitesVisited: string[]
  level: 0 | 1 | 2 | 3  // 0=none, 1=touched(1-2 sites), 2=aware(3-4), 3=enlightened(5+)
  buffs: SpiritualBuff[]
}

export interface SpiritualBuff {
  game: GameId
  description: string
  magnitude: number
}

const DEFAULT_SPIRITUAL_AWARENESS: SpiritualAwareness = {
  sitesVisited: [],
  level: 0,
  buffs: [],
}

function computeSpiritualLevel(sitesVisited: number): 0 | 1 | 2 | 3 {
  if (sitesVisited >= 5) return 3
  if (sitesVisited >= 3) return 2
  if (sitesVisited >= 1) return 1
  return 0
}

function computeSpiritualBuffs(level: 0 | 1 | 2 | 3): SpiritualBuff[] {
  if (level === 0) return []
  const buffs: SpiritualBuff[] = []
  if (level >= 1) {
    buffs.push({ game: 'prospectors_tale', description: '+1 to Diplomacy checks with Native faction', magnitude: 1 })
  }
  if (level >= 2) {
    buffs.push({ game: 'rpg_adventure', description: 'Unlock shaman NPC quest line', magnitude: 1 })
    buffs.push({ game: 'gold_country_explorer', description: 'Reveal hidden details at historical sites', magnitude: 1 })
  }
  if (level >= 3) {
    buffs.push({ game: 'prospectors_tale', description: '+2 to Diplomacy checks with Native faction', magnitude: 2 })
    buffs.push({ game: 'rpg_adventure', description: 'Shaman grants ancient wisdom (stat bonus)', magnitude: 2 })
    buffs.push({ game: 'gold_country_explorer', description: 'All sacred sites reveal full history', magnitude: 2 })
  }
  return buffs
}

// ============================================
// CROSS-GAME STATE
// ============================================

export interface CrossGameState {
  version: string
  milestones: Milestone[]
  characterQualities: CharacterQualities
  timeEchoes: Record<TimeEchoId, boolean>  // which echoes have been discovered
  reputation: ReputationSnapshot | null
  bounties: SharedBounty[]
  karmaPool: SharedKarmaPool
  karmaTransfers: KarmaTransferEvent[]
  spiritualAwareness: SpiritualAwareness
  mapDiscoveries: MapDiscovery[]
  historicalDepth: number  // 0-100, tracks how much history player has discovered
  lastSyncTimestamp: string
}

export const DEFAULT_CROSS_GAME_STATE: CrossGameState = {
  version: CROSS_GAME_VERSION,
  milestones: [],
  characterQualities: { ...DEFAULT_QUALITIES },
  timeEchoes: {
    norse_runestone: false,
    cahokian_mound_earth: false,
    chumash_star_chart: false,
    incan_quipu_1849: false,
    aztec_codex_prospector: false,
    guide_ranch_comment: false,
    number_42: false,
  },
  reputation: null,
  bounties: [],
  karmaPool: { ...DEFAULT_KARMA_POOL },
  karmaTransfers: [],
  spiritualAwareness: { ...DEFAULT_SPIRITUAL_AWARENESS },
  mapDiscoveries: [],
  historicalDepth: 0,
  lastSyncTimestamp: new Date().toISOString(),
}

// ============================================
// UNLOCK EVALUATION
// ============================================

function hasMilestone(milestones: Milestone[], id: MilestoneId): boolean {
  return milestones.some(m => m.id === id)
}

export function evaluateUnlockCondition(
  condition: UnlockCondition,
  milestones: Milestone[]
): boolean {
  switch (condition.type) {
    case 'always':
      return true
    case 'milestone':
      return hasMilestone(milestones, condition.milestoneId)
    case 'milestones_all':
      return condition.milestoneIds.every(id => hasMilestone(milestones, id))
    case 'milestones_any':
      return condition.milestoneIds.some(id => hasMilestone(milestones, id))
    case 'composite':
      return condition.conditions.every(c => evaluateUnlockCondition(c, milestones))
  }
}

export function isGameUnlocked(gameId: GameId, milestones: Milestone[]): boolean {
  const config = GAME_UNLOCK_CONFIGS.find(c => c.gameId === gameId)
  if (!config) return true // Unknown games are accessible by default
  return evaluateUnlockCondition(config.condition, milestones)
}

// ============================================
// STORAGE API (follows KarmaStorage pattern)
// ============================================

export const CrossGameStorage = {
  /**
   * Initialize storage with defaults if empty
   */
  init(): CrossGameState {
    const existing = this.load()
    if (!existing) {
      this.save(DEFAULT_CROSS_GAME_STATE)
      return { ...DEFAULT_CROSS_GAME_STATE }
    }
    if (existing.version !== CROSS_GAME_VERSION) {
      return this.migrate(existing)
    }
    return existing
  },

  /**
   * Load state from localStorage
   */
  load(): CrossGameState | null {
    try {
      if (typeof window === 'undefined') return null
      const data = localStorage.getItem(CROSS_GAME_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Failed to load cross-game state:', e)
      return null
    }
  },

  /**
   * Save state to localStorage with cross-tab sync
   */
  save(state: CrossGameState): boolean {
    try {
      if (typeof window === 'undefined') return false
      state.lastSyncTimestamp = new Date().toISOString()
      localStorage.setItem(CROSS_GAME_STORAGE_KEY, JSON.stringify(state))
      window.dispatchEvent(new StorageEvent('storage', {
        key: CROSS_GAME_STORAGE_KEY,
        newValue: JSON.stringify(state),
      }))
      return true
    } catch (e) {
      console.error('Failed to save cross-game state:', e)
      return false
    }
  },

  /**
   * Record a milestone
   */
  recordMilestone(
    milestoneId: MilestoneId,
    source: GameId,
    metadata?: Record<string, unknown>
  ): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }

    // Don't duplicate milestones
    if (state.milestones.some(m => m.id === milestoneId)) {
      return state
    }

    const milestone: Milestone = {
      id: milestoneId,
      source,
      timestamp: new Date().toISOString(),
      metadata,
    }

    state.milestones.push(milestone)
    this.save(state)
    return state
  },

  /**
   * Check if a specific game is unlocked
   */
  isUnlocked(gameId: GameId): boolean {
    const state = this.load() || DEFAULT_CROSS_GAME_STATE
    return isGameUnlocked(gameId, state.milestones)
  },

  /**
   * Get all newly unlocked games after a milestone is recorded
   */
  getNewlyUnlockedGames(previousMilestones: Milestone[], currentMilestones: Milestone[]): GameUnlockConfig[] {
    return GAME_UNLOCK_CONFIGS.filter(config => {
      const wasLocked = !evaluateUnlockCondition(config.condition, previousMilestones)
      const isNowUnlocked = evaluateUnlockCondition(config.condition, currentMilestones)
      return wasLocked && isNowUnlocked
    })
  },

  /**
   * Update character qualities from a game's character system
   */
  updateQualities(qualities: CharacterQualities): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    state.characterQualities = qualities
    this.save(state)
    return state
  },

  /**
   * Discover a time echo
   */
  discoverTimeEcho(echoId: TimeEchoId): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    state.timeEchoes[echoId] = true
    this.save(state)
    return state
  },

  /**
   * Get time echoes that manifest in a specific game
   */
  getTimeEchoesForGame(gameId: GameId): TimeEcho[] {
    const state = this.load() || DEFAULT_CROSS_GAME_STATE
    return TIME_ECHO_DEFINITIONS
      .filter(def => def.manifestsIn.includes(gameId))
      .map(def => ({
        ...def,
        discovered: state.timeEchoes[def.id] || false,
        discoveredTimestamp: state.timeEchoes[def.id]
          ? state.milestones.find(m => m.metadata?.echoId === def.id)?.timestamp
          : undefined,
      }))
  },

  /**
   * Sync reputation from a game context
   */
  syncReputation(reputations: Record<FactionId, number>): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    state.reputation = {
      reputations: { ...reputations },
      lastUpdated: new Date().toISOString(),
    }
    this.save(state)
    return state
  },

  /**
   * Get persisted reputation (or null if never saved)
   */
  getReputation(): ReputationSnapshot | null {
    const state = this.load()
    return state?.reputation || null
  },

  /**
   * Add a shared bounty
   */
  addBounty(bounty: Omit<SharedBounty, 'issuedTimestamp' | 'status'>): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    state.bounties.push({
      ...bounty,
      status: 'active',
      issuedTimestamp: new Date().toISOString(),
    })
    this.save(state)
    return state
  },

  /**
   * Complete a bounty from any game
   */
  completeBounty(bountyId: string, completedInGame: GameId): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    const bounty = state.bounties.find(b => b.id === bountyId)
    if (bounty && bounty.status === 'active') {
      bounty.status = 'completed'
      bounty.completedInGame = completedInGame
      bounty.completedTimestamp = new Date().toISOString()
    }
    this.save(state)
    return state
  },

  /**
   * Get active bounties
   */
  getActiveBounties(): SharedBounty[] {
    const state = this.load() || DEFAULT_CROSS_GAME_STATE
    return state.bounties.filter(b => b.status === 'active')
  },

  // ============================================
  // SHARED KARMA POOL
  // ============================================

  /**
   * Sync karma from a game to the shared pool.
   * Called on every earn/spend in any game.
   */
  syncKarmaToPool(
    source: GameId,
    karmaType: 'good' | 'neutral' | 'bad',
    amount: number,
    reason: string
  ): CrossGameState {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    if (!state.karmaPool) state.karmaPool = { ...DEFAULT_KARMA_POOL }
    if (!state.karmaTransfers) state.karmaTransfers = []

    state.karmaPool[karmaType] += amount
    if (amount > 0) state.karmaPool.totalEarned += amount
    state.karmaPool.lastSource = source
    state.karmaPool.lastSyncTimestamp = new Date().toISOString()

    // Keep last 50 transfers
    state.karmaTransfers = [
      {
        fromGame: source,
        karmaType,
        amount,
        reason,
        timestamp: new Date().toISOString(),
      },
      ...state.karmaTransfers.slice(0, 49),
    ]

    this.save(state)
    return state
  },

  /**
   * Load the shared karma pool balance.
   */
  loadSharedKarma(): SharedKarmaPool {
    const state = this.load()
    return state?.karmaPool || { ...DEFAULT_KARMA_POOL }
  },

  /**
   * Get recent karma transfers for display ("Karma from [Game]: +X").
   */
  getRecentTransfers(limit = 10): KarmaTransferEvent[] {
    const state = this.load()
    return (state?.karmaTransfers || []).slice(0, limit)
  },

  /**
   * Get karma transfers from a specific game.
   */
  getTransfersFromGame(gameId: GameId): KarmaTransferEvent[] {
    const state = this.load()
    return (state?.karmaTransfers || []).filter(t => t.fromGame === gameId)
  },

  // ============================================
  // SPIRITUAL AWARENESS
  // ============================================

  /**
   * Record a sacred/spiritual site visit.
   * Recalculates level and buffs.
   */
  visitSpiritualSite(siteId: string): SpiritualAwareness {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    if (!state.spiritualAwareness) state.spiritualAwareness = { ...DEFAULT_SPIRITUAL_AWARENESS }

    if (state.spiritualAwareness.sitesVisited.includes(siteId)) {
      return state.spiritualAwareness
    }

    state.spiritualAwareness.sitesVisited.push(siteId)
    state.spiritualAwareness.level = computeSpiritualLevel(state.spiritualAwareness.sitesVisited.length)
    state.spiritualAwareness.buffs = computeSpiritualBuffs(state.spiritualAwareness.level)

    this.save(state)
    return state.spiritualAwareness
  },

  /**
   * Get current spiritual awareness state.
   */
  getSpiritualAwareness(): SpiritualAwareness {
    const state = this.load()
    return state?.spiritualAwareness || { ...DEFAULT_SPIRITUAL_AWARENESS }
  },

  /**
   * Get spiritual buffs applicable to a specific game.
   */
  getSpiritualBuffsForGame(gameId: GameId): SpiritualBuff[] {
    const awareness = this.getSpiritualAwareness()
    return awareness.buffs.filter(b => b.game === gameId)
  },

  // ============================================
  // HISTORICAL DEPTH
  // ============================================

  /**
   * Increment historical depth score (0-100).
   */
  addHistoricalDepth(amount: number): number {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    state.historicalDepth = Math.min(100, (state.historicalDepth || 0) + amount)
    this.save(state)
    return state.historicalDepth
  },

  /**
   * Get current historical depth score.
   */
  getHistoricalDepth(): number {
    const state = this.load()
    return state?.historicalDepth || 0
  },

  // ============================================
  // MAP DISCOVERIES
  // ============================================

  /**
   * Add a map discovery (deduplicated by locationId).
   */
  addMapDiscovery(locationId: string, source: GameId, icon?: string, label?: string): void {
    const state = this.load() || { ...DEFAULT_CROSS_GAME_STATE }
    if (!state.mapDiscoveries) state.mapDiscoveries = []
    if (state.mapDiscoveries.some(d => d.locationId === locationId)) return
    state.mapDiscoveries.push({
      locationId,
      source,
      timestamp: new Date().toISOString(),
      icon,
      label,
    })
    this.save(state)
  },

  /**
   * Get all discovered locations.
   */
  getDiscoveredLocations(): MapDiscovery[] {
    const state = this.load()
    return state?.mapDiscoveries || []
  },

  /**
   * Get discoveries originating from a specific game.
   */
  getDiscoveriesForGame(gameId: GameId): MapDiscovery[] {
    const state = this.load()
    return (state?.mapDiscoveries || []).filter(d => d.source === gameId)
  },

  /**
   * Migrate from older versions
   */
  migrate(oldState: Partial<CrossGameState>): CrossGameState {
    const migrated: CrossGameState = {
      ...DEFAULT_CROSS_GAME_STATE,
      ...oldState,
      version: CROSS_GAME_VERSION,
      milestones: oldState.milestones || [],
      characterQualities: oldState.characterQualities || { ...DEFAULT_QUALITIES },
      timeEchoes: oldState.timeEchoes || { ...DEFAULT_CROSS_GAME_STATE.timeEchoes },
      bounties: oldState.bounties || [],
      karmaPool: oldState.karmaPool || { ...DEFAULT_KARMA_POOL },
      karmaTransfers: oldState.karmaTransfers || [],
      spiritualAwareness: oldState.spiritualAwareness || { ...DEFAULT_SPIRITUAL_AWARENESS },
      mapDiscoveries: oldState.mapDiscoveries || [],
      historicalDepth: oldState.historicalDepth || 0,
    }
    if (!migrated.mapDiscoveries) migrated.mapDiscoveries = []
    this.save(migrated)
    return migrated
  },

  /**
   * Reset to defaults
   */
  reset(): CrossGameState {
    const fresh = { ...DEFAULT_CROSS_GAME_STATE }
    this.save(fresh)
    return fresh
  },

  /**
   * Export for backup
   */
  export(): string {
    return JSON.stringify(this.load(), null, 2)
  },

  /**
   * Import from backup
   */
  import(jsonString: string): boolean {
    try {
      const state = JSON.parse(jsonString) as CrossGameState
      return this.save(state)
    } catch (e) {
      console.error('Failed to import cross-game state:', e)
      return false
    }
  },
}

export default CrossGameStorage
