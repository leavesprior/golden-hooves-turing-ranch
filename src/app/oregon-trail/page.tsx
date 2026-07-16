'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { trackPageView, trackGameStart } from '@/lib/eventTracker'
import { OregonTrailProvider, useOregonTrail } from './oregonTrailContext'
import { ShareLegacy } from '@/components/ui/ShareLegacy'

// Context Providers (used in provider tree)
import { KarmaWalletProvider } from './karmaWalletContext'
import { CharacterProvider } from './characterContext'
import { ReputationProvider } from './reputationContext'
import { NarratorProvider } from './narratorContext'
import { MysteryProvider } from './mysteryContext'
import { ChapterProvider } from './chapterContext'
import { RanchProvider, useRanch } from './ranchContext'
import { SettlementProvider } from './settlementContext'
import { NPCProvider } from './npcContext'

// Title Screen and Chapter System
import { TitleScreen } from './components/TitleScreen'
import { ChapterIntro, CHAPTERS } from './components/ChapterIntro'

// Authentication & Save/Load System
import { AuthSavePanel } from '@/components/game/AuthSavePanel'
import { useSaveLoad, getSaveGameType } from '@/lib/saveLoadContext'

// Golden Hooves Enhancements
import { GameErrorBoundary } from './components/GameErrorBoundary'
import { VolumeControl } from './components/VolumeControl'
import * as AudioManager from './lib/audioManager'

// Specialty Shops — HireableGuide type used by TravelScreen wrapper
import { HIREABLE_GUIDES, type HireableGuide } from './data/specialtyShops'

// Extracted Phase Screens (formerly inline in this file)
import {
  GameMenu,
  CharacterCreationScreen,
  InvestigationScreen,
  OutfittingScreen,
  WorldMapScreen,
  GoldCountryArrivalScreen,
  GameOverScreen,
  VictoryScreen,
  EventScreen,
  RiverScreen,
  TownScreen,
  TravelingScreen,
  WitnessScreen,
  DossierScreen,
  TelegraphScreen,
  JournalScreen,
  RanchManagementScreen,
  SettlementScreen,
  SettlementVictoryScreen,
  GoldCountryExploreScreen,
  GoldCountryLocationScreen,
  GoldCountryTravelScreen,
  SaveLoadIntegration,
  LivingTrailScreen,
} from './phases'
import { useConsumableEffects } from './hooks/useConsumableEffects'
import { useDmDirectives } from './hooks/useDmDirectives'

// Local auto-save key for unauthenticated users (subsystem contexts persist
// independently; this captures the core OregonTrail state so "Continue" works
// without requiring login)
const LOCAL_AUTOSAVE_KEY = 'golden_frog_local_save'

// #13: the local autosave is stored as { savedAt, state } so Continue can
// compare recency against auth slots. Legacy saves were the bare state object
// (phase at top level) and carry no wall-clock stamp (savedAt: null).
// Returns null when absent, unparsable, or not playable (title phase).
function readLocalAutosave(): { savedAt: string | null; state: Record<string, unknown> } | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTOSAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    // Legacy bare-state save: phase lives at the top level, savedAt unknown
    if (typeof parsed.phase === 'string') {
      return parsed.phase !== 'title' ? { savedAt: null, state: parsed } : null
    }
    const inner = parsed.state
    if (inner && typeof inner === 'object' && typeof inner.phase === 'string' && inner.phase !== 'title') {
      return { savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null, state: inner }
    }
    return null
  } catch {
    return null
  }
}

// NOTE: Phase screens extracted to ./phases/ directory.
// TravelScreen is a thin wrapper that holds shared state across sub-phases
// (town ↔ traveling ↔ event ↔ river) and dispatches to the appropriate component.
function TravelScreen() {
  const { state, hireGuide } = useOregonTrail()

  // Shared consumable effects (persists across sub-phase changes)
  const { activeEffects, handleUseConsumable, handleApplyMedicine, handleRepairWagon } = useConsumableEffects()

  // Shared state: stat variant badge (set by EventScreen, shown by TravelingScreen)
  const [lastStatVariant, setLastStatVariant] = useState<{
    stat: string
    threshold: 'high' | 'low'
  } | null>(null)

  // Hired guide (#11): lives in persisted trail state (golden_frog_local_save)
  // so it survives reload — the guide object is derived from static data
  const hiredGuide = useMemo<HireableGuide | null>(
    () => state.hiredGuideId
      ? HIREABLE_GUIDES.find(g => g.id === state.hiredGuideId) ?? null
      : null,
    [state.hiredGuideId]
  )
  const guideRemainingLandmarks = state.guideRemainingLandmarks

  // Shared state: solved puzzles and visited historical characters.
  // 2026-06-21: solved puzzles are now PERSISTED (was a silent data-loss bug — progress
  // vanished on reload). Lazy-init from localStorage; written on each solve below.
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('bobr_town_puzzles_solved'); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : [] } catch { return [] }
  })
  const [visitedHistoricalIds, setVisitedHistoricalIds] = useState<string[]>([])

  const handleHireGuide = useCallback((guide: HireableGuide) => {
    hireGuide(guide.id, guide.duration)
  }, [hireGuide])

  // Sub-phase dispatch
  if (state.phase === 'event' && state.currentEvent) {
    return <EventScreen setLastStatVariant={setLastStatVariant} />
  }

  if (state.phase === 'river') {
    return <RiverScreen />
  }

  if (state.phase === 'town') {
    return (
      <TownScreen
        activeEffects={activeEffects}
        onUseConsumable={handleUseConsumable}
        onApplyMedicine={handleApplyMedicine}
        onRepairWagon={handleRepairWagon}
        hiredGuide={hiredGuide}
        guideRemainingLandmarks={guideRemainingLandmarks}
        onHireGuide={handleHireGuide}
        solvedPuzzles={solvedPuzzles}
        onPuzzleSolved={(id) => setSolvedPuzzles(prev => {
          const next = prev.includes(id) ? prev : [...prev, id]
          try { localStorage.setItem('bobr_town_puzzles_solved', JSON.stringify(next)) } catch { /* fail-open */ }
          return next
        })}
        visitedHistoricalIds={visitedHistoricalIds}
        onHistoricalVisited={(id) => setVisitedHistoricalIds(prev => [...prev, id])}
      />
    )
  }

  // Default: traveling phase
  return (
    <TravelingScreen
      activeEffects={activeEffects}
      onUseConsumable={handleUseConsumable}
      onApplyMedicine={handleApplyMedicine}
      onRepairWagon={handleRepairWagon}
      lastStatVariant={lastStatVariant}
    />
  )
}

function OregonTrailGame() {
  const { state, startFromTitle, completeChapterIntro, loadState, openRanchManagement } = useOregonTrail()
  // 2026-06-17: the homestead (Back of Beyond Ranch) was only reachable via a
  // West-Point-gated button — "I still don't see how I get to my farm." This
  // gives a persistent, self-evident way home from anywhere in gameplay.
  const { unlockRanch } = useRanch()
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [continueError, setContinueError] = useState(false)
  const { saves, loadGame } = useSaveLoad()

  // DM directive channel (DM Layer P1): drain the queue while in trail
  // gameplay phases and apply through the APPLY_DM_DIRECTIVE choke point.
  useDmDirectives()

  // C2 fix: the save-slot store is shared across all games. Only consider
  // saves that belong to THIS game (explicit gameType, or inferred for legacy
  // slots) so "Continue Game" can never load an Adventure save.
  const trailSaves = useMemo(
    () => saves.filter(s => getSaveGameType(s) === 'oregon-trail'),
    [saves]
  )

  // Track page view on mount
  useEffect(() => {
    trackPageView('/oregon-trail')
  }, [])

  // Check for local auto-save (works without authentication)
  const [hasLocalSave, setHasLocalSave] = useState(false)
  useEffect(() => {
    try {
      setHasLocalSave(localStorage.getItem(LOCAL_AUTOSAVE_KEY) !== null)
    } catch { /* ignore */ }
  }, [])

  // Auto-save OregonTrail state to localStorage (debounced, no auth required)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (state.phase === 'title' || state.phase === 'chapter_intro') return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      try {
        // #13: wrapped shape — savedAt lets Continue compare recency vs slots
        localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state }))
        setHasLocalSave(true)
      } catch { /* storage full or unavailable */ }
    }, 2000)

    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [state])

  // Also save on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (state.phase !== 'title' && state.phase !== 'chapter_intro') {
        try {
          localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state }))
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [state])

  // Initialize audio and start music on game start (user interaction required)
  const handleGameStart = useCallback(async () => {
    if (!audioInitialized) {
      await AudioManager.initAudio()
      setAudioInitialized(true)
    }
    // Start music based on saved preference (electro swing or Fallout 2 OST)
    const savedMode = AudioManager.loadSoundtrackPreference()
    if (savedMode === 'fallout') {
      AudioManager.playFalloutPlaylist()
    } else {
      AudioManager.playPlaylist()
    }
    trackGameStart('oregon-trail')
    startFromTitle()
  }, [audioInitialized, startFromTitle])

  // Continue from most recent save (auth slots first, then local fallback)
  const handleContinue = useCallback(async () => {
    if (!audioInitialized) {
      await AudioManager.initAudio()
      setAudioInitialized(true)
    }
    const savedMode = AudioManager.loadSoundtrackPreference()
    if (savedMode === 'fallout') {
      AudioManager.playFalloutPlaylist()
    } else {
      AudioManager.playPlaylist()
    }
    // #13: gather BOTH candidates first, then newest-wins. The local autosave
    // is the continuously-overwritten copy the player last saw, so a stale
    // auth slot must never shadow it just because slots are checked first.
    const sorted = [...trailSaves].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const newestSlot = sorted.length > 0 ? sorted[0] : null
    const local = readLocalAutosave()

    // Decide which source is newer (only matters when both exist)
    let preferLocal = local !== null
    if (local && newestSlot) {
      if (local.savedAt) {
        // (a) both wall-clock timestamps present — newer wins
        preferLocal = new Date(local.savedAt).getTime() >= new Date(newestSlot.timestamp).getTime()
      } else {
        // (b) legacy local save with no wall-clock stamp — compare in-game
        // progress (totalMilesTraveled, then day); higher wins
        const slotGame = (newestSlot.gameData as { oregonTrail?: Record<string, unknown> } | undefined)?.oregonTrail
        const slotMiles = typeof slotGame?.totalMilesTraveled === 'number' ? slotGame.totalMilesTraveled : null
        const localMiles = typeof local.state.totalMilesTraveled === 'number' ? local.state.totalMilesTraveled : null
        const slotDay = typeof slotGame?.day === 'number' ? slotGame.day : null
        const localDay = typeof local.state.day === 'number' ? local.state.day : null
        if (slotMiles !== null && localMiles !== null && slotMiles !== localMiles) {
          preferLocal = localMiles > slotMiles
        } else if (slotDay !== null && localDay !== null && slotDay !== localDay) {
          preferLocal = localDay > slotDay
        } else {
          // (c) indeterminate — prefer the local autosave
          preferLocal = true
        }
      }
      console.info(`[Continue] Both sources present — preferring ${preferLocal ? 'local autosave' : `slot ${newestSlot.id}`}`)
    }

    // Both apply paths route through the existing loaders so the LOAD_STATE
    // migration choke point (migrateParty + migrateLivingTrail) still fires.
    const applyLocal = (): boolean => {
      if (!local) return false
      console.info(`[Continue] Local autosave applied (phase: ${local.state.phase})`)
      loadState(local.state as unknown as Parameters<typeof loadState>[0])
      return true
    }
    const applySlot = async (): Promise<boolean> => {
      if (!newestSlot) return false
      console.info(`[Continue] Trying slot save: ${newestSlot.id}`)
      const result = await loadGame(newestSlot.id)
      // loadGame reports success whenever the registered gameDataLoader ran —
      // even if the slot carried no oregonTrail payload (e.g. an auto-save
      // created on the title screen collects `{}`), in which case the loader
      // is a no-op, the phase stays 'title', and trusting it would softlock
      // Continue. Only trust the slot if it actually held a playable phase.
      const slotState = result.data?.oregonTrail as { phase?: unknown } | undefined
      const slotPlayable =
        !!slotState && typeof slotState === 'object' &&
        typeof slotState.phase === 'string' && slotState.phase !== 'title'
      if (result.success && slotPlayable) {
        console.info(`[Continue] Slot save applied (phase: ${slotState.phase})`)
        return true
      }
      console.info(
        `[Continue] Slot save not playable (success: ${result.success}` +
        `${result.error ? `, error: ${result.error}` : ''})`
      )
      return false
    }

    if (preferLocal) {
      if (applyLocal()) return
      if (await applySlot()) return
    } else {
      if (await applySlot()) return
      if (applyLocal()) return
    }
    // No valid save found from either source — tell the player honestly
    console.warn('[Continue] No valid save found from auth slots or local storage')
    setContinueError(true)
    setTimeout(() => setContinueError(false), 5000)
  }, [audioInitialized, trailSaves, loadGame, loadState])

  // Playlist auto-cycles tracks via AudioManager - no manual switching needed

  // Determine phase content - extracted to ensure SaveLoadIntegration
  // and AuthSavePanel always render regardless of active phase
  const renderPhaseContent = () => {
    // Title screen phase
    if (state.phase === 'title') {
      return (
        <TitleScreen
          onStart={handleGameStart}
          hasSaves={trailSaves.length > 0 || hasLocalSave}
          onContinue={handleContinue}
          continueError={continueError}
        />
      )
    }

    // Chapter intro phase
    if (state.phase === 'chapter_intro') {
      const chapter = CHAPTERS[state.currentChapter as keyof typeof CHAPTERS] || CHAPTERS[1]
      return (
        <ChapterIntro
          chapterNumber={chapter.number}
          title={chapter.title}
          subtitle={chapter.subtitle}
          narrative={chapter.narrative}
          onComplete={completeChapterIntro}
        />
      )
    }

    // Menu phase
    if (state.phase === 'menu') {
      return <GameMenu />
    }

    // Outfitting phase
    if (state.phase === 'outfitting') {
      return <OutfittingScreen />
    }

    // Character creation phase (new)
    if (state.phase === 'character_creation') {
      return <CharacterCreationScreen />
    }

    // Investigation phase (new)
    if (state.phase === 'investigation') {
      return <InvestigationScreen />
    }

    // Witness dialogue phase (new)
    if (state.phase === 'witness') {
      return <WitnessScreen />
    }

    // Dossier phase (new)
    if (state.phase === 'dossier') {
      return <DossierScreen />
    }

    // Telegraph phase (new)
    if (state.phase === 'telegraph') {
      return <TelegraphScreen />
    }

    // Journal phase (new)
    if (state.phase === 'journal') {
      return <JournalScreen />
    }

    // World Map phase (Fallout-style exploration)
    if (state.phase === 'world_map') {
      return <WorldMapScreen />
    }

    // Ranch Management phase (Lords II-style building)
    if (state.phase === 'ranch_management') {
      return <RanchManagementScreen />
    }

    // Gold Country Arrival phase - choose to settle or continue
    if (state.phase === 'gold_country_arrival') {
      return <GoldCountryArrivalScreen />
    }

    // Gold Country Free-Roam phases (Fallout 2-style)
    if (state.phase === 'gold_country_explore') {
      return <GoldCountryExploreScreen />
    }

    if (state.phase === 'gold_country_location') {
      return <GoldCountryLocationScreen />
    }

    if (state.phase === 'gold_country_travel') {
      return <GoldCountryTravelScreen />
    }

    // Living Trail — presence-gated real-world quest chains
    if (state.phase === 'living_trail') {
      return <LivingTrailScreen />
    }

    // Settlement phase - main settlement building (accessed from BOBR Cabin)
    if (state.phase === 'settlement') {
      return <SettlementScreen />
    }

    // Settlement Victory phase - final ending screen
    if (state.phase === 'settlement_victory') {
      return <SettlementVictoryScreen />
    }

    // Game over and victory — dispatched directly (no shared state needed)
    if (state.phase === 'game_over') {
      return <GameOverScreen />
    }

    if (state.phase === 'complete') {
      return <VictoryScreen />
    }

    // Default to travel screen (handles traveling, town, river, event)
    return <TravelScreen />
  }

  // Hide save panel during cinematic/non-interactive phases
  const showSavePanel = state.phase !== 'chapter_intro'

  // Persistent "My Farm" affordance — visible during real gameplay (not titles,
  // creation, or while already in the ranch). One click home to Back of Beyond.
  const hideFarmButton = [
    'title', 'chapter_intro', 'character_creation', 'outfitting',
    'ranch_management', 'settlement', 'settlement_victory', 'game_over', 'complete', 'menu',
  ].includes(state.phase)

  return (
    <>
      {renderPhaseContent()}
      {!hideFarmButton && (
        <button
          onClick={() => { unlockRanch(); openRanchManagement() }}
          title="Go to your homestead — Back of Beyond Ranch (manage livestock, fields & buildings)"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-900/90 px-3 py-2 font-[var(--font-pixel)] text-[11px] text-amber-100 shadow-lg transition-colors hover:bg-amber-800"
        >
          🏡 My Farm
        </button>
      )}
      <SaveLoadIntegration />
      {showSavePanel && <AuthSavePanel gameType="oregon-trail" />}
      <ShareLegacy />
    </>
  )
}

// Main page export with all providers
export default function OregonTrailPage() {
  return (
    <GameErrorBoundary fallbackLabel="The wagon broke down!">
      <KarmaWalletProvider>
        <OregonTrailProvider>
          <ChapterProvider
            onChapterComplete={() => {}}
            onEasterEggFound={() => {}}
          >
            <RanchProvider>
              <MysteryProvider>
                <SettlementProvider>
                  <CharacterProvider>
                    <ReputationProvider>
                      <NarratorProvider>
                        <NPCProvider>
                          <OregonTrailGame />
                          <VolumeControl />
                        </NPCProvider>
                      </NarratorProvider>
                    </ReputationProvider>
                  </CharacterProvider>
                </SettlementProvider>
              </MysteryProvider>
            </RanchProvider>
          </ChapterProvider>
        </OregonTrailProvider>
      </KarmaWalletProvider>
    </GameErrorBoundary>
  )
}
