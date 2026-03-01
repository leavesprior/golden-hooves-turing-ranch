'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
import { RanchProvider } from './ranchContext'
import { SettlementProvider } from './settlementContext'
import { NPCProvider } from './npcContext'

// Title Screen and Chapter System
import { TitleScreen } from './components/TitleScreen'
import { ChapterIntro, CHAPTERS } from './components/ChapterIntro'

// Authentication & Save/Load System
import { AuthSavePanel } from '@/components/game/AuthSavePanel'
import { useSaveLoad } from '@/lib/saveLoadContext'

// Golden Hooves Enhancements
import { GameErrorBoundary } from './components/GameErrorBoundary'
import { VolumeControl } from './components/VolumeControl'
import * as AudioManager from './lib/audioManager'

// Specialty Shops — HireableGuide type used by TravelScreen wrapper
import { type HireableGuide } from './data/specialtyShops'

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
} from './phases'
import { useConsumableEffects } from './hooks/useConsumableEffects'

// Local auto-save key for unauthenticated users (subsystem contexts persist
// independently; this captures the core OregonTrail state so "Continue" works
// without requiring login)
const LOCAL_AUTOSAVE_KEY = 'golden_frog_local_save'

// NOTE: Phase screens extracted to ./phases/ directory.
// TravelScreen is a thin wrapper that holds shared state across sub-phases
// (town ↔ traveling ↔ event ↔ river) and dispatches to the appropriate component.
function TravelScreen() {
  const { state } = useOregonTrail()

  // Shared consumable effects (persists across sub-phase changes)
  const { activeEffects, handleUseConsumable, handleApplyMedicine, handleRepairWagon } = useConsumableEffects()

  // Shared state: stat variant badge (set by EventScreen, shown by TravelingScreen)
  const [lastStatVariant, setLastStatVariant] = useState<{
    stat: string
    threshold: 'high' | 'low'
  } | null>(null)

  // Shared state: hired guide (persists across town visits)
  const [hiredGuide, setHiredGuide] = useState<HireableGuide | null>(null)
  const [guideRemainingLandmarks, setGuideRemainingLandmarks] = useState(0)

  // Shared state: solved puzzles and visited historical characters
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([])
  const [visitedHistoricalIds, setVisitedHistoricalIds] = useState<string[]>([])

  const handleHireGuide = useCallback((guide: HireableGuide) => {
    setHiredGuide(guide)
    setGuideRemainingLandmarks(guide.duration)
  }, [])

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
        onPuzzleSolved={(id) => setSolvedPuzzles(prev => [...prev, id])}
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
  const { state, startFromTitle, completeChapterIntro, loadState } = useOregonTrail()
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [continueError, setContinueError] = useState(false)
  const { saves, loadGame } = useSaveLoad()

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
        localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify(state))
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
          localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify(state))
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
    // Try slot-based saves first (authenticated users)
    const sorted = [...saves].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (sorted.length > 0) {
      const result = await loadGame(sorted[0].id)
      if (result.success) return
      // Slot load failed — fall through to local autosave
    }
    // Fall back to local auto-save (all users)
    try {
      const saved = localStorage.getItem(LOCAL_AUTOSAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && parsed.phase && parsed.phase !== 'title') {
          loadState(parsed)
          return
        }
        console.warn('[Continue] Local save has invalid or title-phase state, ignoring')
      }
    } catch (e) {
      console.warn('[Continue] Failed to parse local save:', e)
    }
    // No valid save found from either source
    console.warn('[Continue] No valid save found from auth slots or local storage')
    setContinueError(true)
    setTimeout(() => setContinueError(false), 3000)
  }, [audioInitialized, saves, loadGame, loadState])

  // Playlist auto-cycles tracks via AudioManager - no manual switching needed

  // Determine phase content - extracted to ensure SaveLoadIntegration
  // and AuthSavePanel always render regardless of active phase
  const renderPhaseContent = () => {
    // Title screen phase
    if (state.phase === 'title') {
      return (
        <TitleScreen
          onStart={handleGameStart}
          hasSaves={saves.length > 0 || hasLocalSave}
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

  return (
    <>
      {renderPhaseContent()}
      <SaveLoadIntegration />
      {showSavePanel && <AuthSavePanel />}
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
