'use client'

import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import Link from 'next/link'
import { trackPageView, trackGameStart } from '@/lib/eventTracker'
import { OregonTrailProvider, useOregonTrail, type GamePhase } from './oregonTrailContext'
import { KarmaToastContainer } from '@/components/karma'
import { ShareLegacy } from '@/components/ui/ShareLegacy'

// Karma Wallet (Neoma Blockchain Integration)
import { KarmaWalletProvider, useKarmaWallet } from './karmaWalletContext'
import { KarmaWallet } from './components/KarmaWallet'

// Mystery/RPG Context Providers
import { CharacterProvider, useCharacter } from './characterContext'
import { ReputationProvider, useReputation } from './reputationContext'
import { NarratorProvider, useNarrator } from './narratorContext'
import { MysteryProvider, useMystery } from './mysteryContext'

// UI Components
import { DossierView } from './components/DossierView'
import { TelegraphOffice } from './components/TelegraphOffice'
import { WitnessDialogue } from './components/WitnessDialogue'
import { ClueJournal } from './components/ClueJournal'
import { JournalSouvenir } from './components/JournalSouvenir'
import { ReputationBar } from './components/ReputationBar'
import { NarratorOverlay, ReliabilityIndicator } from './components/NarratorOverlay'
import { TownShop } from './components/TownShop'
import { TownInn } from './components/TownInn'
import { ResearchStation, type TrailLandmarkInfo } from './components/ResearchStation'
import { DiscountReward, DiscountProgressBar } from './components/DiscountReward'
import { type WitnessType } from './data/clueTemplates'
import { hasCynthiasInn } from './oregonTrailContext'
import { getGoldCountryLocation } from './data/goldCountryLocations'
import { rollHistoricalEncounter, type HistoricalCharacterEvent, type HistoricalCharacterChoice } from './data/historicalCharacters'

// 64-bit Graphics System
import {
  Graphics64bitWrapper,
  TravelingScene,
  getTimeOfDay,
  getTierFilter,
  type TimeOfDay,
  type WeatherType
} from './components/Graphics64bit'

// Landmark Scenes
import { LandmarkScene, type LandmarkType } from './components/LandmarkScene'
import { LANDMARKS } from './oregonTrailContext'

// Chapter System & World Map (Fallout-style)
import { ChapterProvider, useChapter, ChapterTransition } from './chapterContext'
import { WorldMap, MiniMap } from './components/WorldMap'
import { getAllLocations, getLocationById, type ChapterType } from './data/worldMaps'
import { getRandomTwainQuote, getEasterEggsForLocation } from './data/easterEggs'

// Ranch Management System (Lords II-style)
import { RanchProvider, useRanch } from './ranchContext'

// Settlement System (Gold Country Endgame)
import { SettlementProvider, useSettlement } from './settlementContext'

// Lazy-loaded modules (code-split for faster initial load)
const RanchManagement = lazy(() => import('./components/RanchManagement').then(m => ({ default: m.RanchManagement })))
const TownPuzzle = lazy(() => import('./components/TownPuzzle'))
const SettlementHub = lazy(() => import('./components/SettlementHub').then(m => ({ default: m.SettlementHub })))
const SettlementVictory = lazy(() => import('./components/SettlementVictory').then(m => ({ default: m.SettlementVictory })))
const GoldCountryExplore = lazy(() => import('./components/GoldCountryExplore').then(m => ({ default: m.GoldCountryExplore })))
const GoldCountryLocation = lazy(() => import('./components/GoldCountryLocation').then(m => ({ default: m.GoldCountryLocation })))
const GoldCountryTravel = lazy(() => import('./components/GoldCountryTravel').then(m => ({ default: m.GoldCountryTravel })))
const QuestLog = lazy(() => import('./components/QuestLog').then(m => ({ default: m.QuestLog })))
// NPC Relationship Panel — lazy loaded (only shown when player opens it)
const NPCRelationshipPanel = lazy(() =>
  import('./components/NPCRelationshipPanel').then(m => ({ default: m.NPCRelationshipPanel }))
)

// Title Screen and Chapter System
import { TitleScreen } from './components/TitleScreen'
import { ChapterIntro, CHAPTERS } from './components/ChapterIntro'

// Travel Observations - Hitchhiker's Guide Style Commentary
import { TravelObservations } from './components/TravelObservations'
import { type WeatherMood } from './data/travelObservations'

// NEW: Enhanced River Crossing System (Classic Oregon Trail 5-choice)
import { RiverCrossing } from './components/RiverCrossing'
import { type CrossingOutcome } from './data/riverCrossings'

// NEW: Colorful Event Messages (Fallout-style)
import { getHuntingMessage, getDramaticOutcome } from './data/eventMessages'

// Critical Hit/Miss Descriptions (Fallout-style flavor text)
import { getCriticalDescription } from './data/criticalDescriptions'
import { getEventVariant } from './data/statEventVariants'
import { getPuzzlesForLandmark, type TownPuzzle as TownPuzzleData } from './data/townPuzzles'

// NEW: Occupation System (Oregon Trail-style scoring)
import {
  type Occupation,
  getOccupationList,
  getOccupation,
  getOccupationDifficulty,
  getOccupationFlavor,
  getStartingSupplies
} from './data/occupations'

// NPC Context for Ollama-powered dialogue
import { NPCProvider } from './npcContext'
import { CrossGameStorage } from '@/lib/crossGameProgression'

// Authentication & Save/Load System
import { AuthSavePanel } from '@/components/game/AuthSavePanel'
import { useSaveLoad } from '@/lib/saveLoadContext'
import { useAuth } from '@/lib/authContext'

// NEW: Golden Hooves Enhancements
import { GameErrorBoundary } from './components/GameErrorBoundary'
import HunkerDown from './components/HunkerDown'
import GoldCountryBooking from './components/GoldCountryBooking'
import { VolumeControl } from './components/VolumeControl'
import * as AudioManager from './lib/audioManager'

// NEW: Specialty Shops & Hireable Guides
import { SpecialtyShop } from './components/SpecialtyShop'
import { GuideHire } from './components/GuideHire'
import { getAvailableShops, getAvailableGuides, type SpecialtyShop as SpecialtyShopData, type HireableGuide } from './data/specialtyShops'

// Posse Management System (#6)
import { PossePanel } from './components/PossePanel'
const PosseRecruitment = lazy(() => import('./components/PosseRecruitment').then(m => ({ default: m.PosseRecruitment })))

// Camp Menu & Pip-Boy Game Menu
import { CampMenu } from './components/CampMenu'
import { PipBoyMenu } from './components/GameMenu'

// NEW: Character Sheet & Consumable Effects
import { CharacterSheet } from './components/CharacterSheet'
import { type ActiveEffect, applyConsumable, tickEffects, getConsumableItem, getInstantEffects } from './data/consumableEffects'

// Extracted Phase Screens (formerly inline in this file)
import { GameMenu } from './phases/GameMenu'
import { CharacterCreationScreen } from './phases/CharacterCreationScreen'
import { InvestigationScreen } from './phases/InvestigationScreen'
import { OutfittingScreen } from './phases/OutfittingScreen'
import { WorldMapScreen } from './phases/WorldMapScreen'
import { GoldCountryArrivalScreen } from './phases/GoldCountryArrivalScreen'
import { GameOverScreen } from './phases/GameOverScreen'
import { VictoryScreen } from './phases/VictoryScreen'
import { EventScreen } from './phases/EventScreen'
import { RiverScreen } from './phases/RiverScreen'
import { TownScreen } from './phases/TownScreen'
import { TravelingScreen } from './phases/TravelingScreen'
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

// Witness Dialogue Screen
function WitnessScreen() {
  const { state, closeWitnessDialogue } = useOregonTrail()
  const { state: mysteryState, generateClueForWitness, addClue } = useMystery()
  const { addExperience, addInvestigationXP } = useCharacter()

  const witnessType = state.investigation.activeWitness as WitnessType | null

  if (!witnessType) {
    return null
  }

  // Generate a clue for this witness (Bounty Hunter mode - always available)
  const witnessClue = generateClueForWitness(witnessType, state.currentLandmark)

  return (
    <WitnessDialogue
      witnessType={witnessType}
      location={state.currentLandmark}
      clue={witnessClue}
      onClose={closeWitnessDialogue}
      onClueObtained={(clue) => {
        addClue(clue)
      }}
    />
  )
}

// Dossier Screen
function DossierScreen() {
  const { closeDossier } = useOregonTrail()

  return (
    <DossierView
      onClose={closeDossier}
    />
  )
}

// Telegraph Screen
function TelegraphScreen() {
  const { closeTelegraph, state } = useOregonTrail()
  const { comment, setMood } = useNarrator()
  const { modifyReputation } = useReputation()
  const { addExperience, addInvestigationXP } = useCharacter()

  const handleWarrantIssued = (success: boolean, bounty: number, message: string) => {
    if (success) {
      setMood('impressed')
      comment("Justice has been served! Though the narrator wonders if it was truly deserved...", 'observation')
      modifyReputation('pinkerton', 15, 'Successful warrant execution', state.currentLandmark)
      addExperience(100) // OUTLAW_CAPTURED
      addInvestigationXP('suspectIdentification', 15)
      // Create a cross-game bounty for Ranch Treasure Hunt
      CrossGameStorage.addBounty({
        id: `bounty_${Date.now()}`,
        targetName: message || 'Outlaw',
        description: `Warrant executed at ${state.currentLandmark || 'unknown location'}. Bounty: $${bounty}.`,
        reward: bounty,
        originGame: 'prospectors_tale',
      })
    } else {
      setMood('amused')
      comment("Wrong suspect! The real outlaw escapes while you arrest an innocent. How embarrassing.", 'observation')
      modifyReputation('pinkerton', -20, 'Wrongful arrest', state.currentLandmark)
      addExperience(-10) // WRONG_ACCUSATION penalty
    }
    closeTelegraph()
  }

  return (
    <TelegraphOffice
      onClose={closeTelegraph}
      onWarrantIssued={handleWarrantIssued}
    />
  )
}

// Journal Screen
function JournalScreen() {
  const { closeJournal, openDossier, openTelegraph } = useOregonTrail()
  const [showSouvenir, setShowSouvenir] = useState(false)

  return (
    <>
      <ClueJournal
        onClose={closeJournal}
        onOpenDossier={openDossier}
        onOpenTelegraph={openTelegraph}
      />
      {/* Export Journal / Souvenir button — fixed bottom-right */}
      <button
        onClick={() => setShowSouvenir(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-amber-900 text-amber-300 rounded-lg hover:bg-amber-800 active:bg-amber-700 text-sm font-bold shadow-lg border border-amber-700"
      >
        Export Journal
      </button>
      {showSouvenir && (
        <JournalSouvenir onClose={() => setShowSouvenir(false)} />
      )}
    </>
  )
}

// Ranch Management Screen (Lords II-style building)
function LazyFallback() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-amber-400 font-pixel text-sm animate-pulse">Loading...</div>
    </div>
  )
}

function RanchManagementScreen() {
  const { closeRanchManagement } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <RanchManagement onClose={closeRanchManagement} />
    </Suspense>
  )
}

// Settlement Hub Screen - Main settlement building interface
function SettlementScreen() {
  const { leaveSettlement, completeSettlement, returnToGoldCountryMap } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <SettlementHub
        onLeave={returnToGoldCountryMap}
        onComplete={completeSettlement}
      />
    </Suspense>
  )
}

// Settlement Victory Screen - Final ending display
function SettlementVictoryScreen() {
  const { resetGame } = useOregonTrail()

  return (
    <Suspense fallback={<LazyFallback />}>
      <SettlementVictory onPlayAgain={resetGame} />
    </Suspense>
  )
}

// Gold Country Explore Screen - Free-roam map hub
function GoldCountryExploreScreen() {
  const {
    state,
    visitGoldCountryLocation,
    startGoldCountryTravel,
    leaveSettlement,
    setPhase,
  } = useOregonTrail()
  const [showQuestLog, setShowQuestLog] = useState(false)

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryExplore
        onVisitLocation={(locationId) => {
          visitGoldCountryLocation(locationId)
        }}
        onTravel={(toLocationId) => {
          startGoldCountryTravel(toLocationId)
        }}
        onOpenSettlement={() => {
          setPhase('settlement')
        }}
        onOpenQuestLog={() => setShowQuestLog(true)}
        onLeave={leaveSettlement}
      />
      {showQuestLog && <QuestLog onClose={() => setShowQuestLog(false)} />}
    </Suspense>
  )
}

// Gold Country Location Screen - Per-location with NPCs/search
function GoldCountryLocationScreen() {
  const { state, returnToGoldCountryMap, setPhase } = useOregonTrail()

  const locationId = state.currentGoldCountryLocation || 'bobr_cabin'

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryLocation
        locationId={locationId}
        onReturnToMap={returnToGoldCountryMap}
        onOpenSettlement={() => {
          setPhase('settlement')
        }}
      />
    </Suspense>
  )
}

// Gold Country Travel Screen - Travel with random encounters
function GoldCountryTravelScreen() {
  const { state, arriveAtGoldCountryLocation, returnToGoldCountryMap } = useOregonTrail()

  const fromId = state.currentGoldCountryLocation || 'bobr_cabin'
  const toId = state.travelingToLocation || 'bobr_cabin'

  return (
    <Suspense fallback={<LazyFallback />}>
      <GoldCountryTravel
        fromLocationId={fromId}
        toLocationId={toId}
        onArrive={(locationId) => {
          arriveAtGoldCountryLocation(locationId)
        }}
        onReturnToMap={returnToGoldCountryMap}
      />
    </Suspense>
  )
}

// Save/Load Integration Wrapper
function SaveLoadIntegration() {
  const { state, loadState } = useOregonTrail()
  const { user } = useAuth()
  const { setGameDataCollector, setGameDataLoader, setMetadataCollector, enableAutoSave } = useSaveLoad()
  const { balance, alignment, getAlignmentDisplayName, loadKarmaState } = useKarmaWallet()
  const { state: mysteryState, loadMysteryState } = useMystery()

  // Set up save data collector — skip during title/chapter_intro phases
  React.useEffect(() => {
    if (!user) return

    // Gate auto-save: don't collect data during invalid phases
    const isValidPhase = state.phase !== 'title' && state.phase !== 'chapter_intro'

    setGameDataCollector(() => {
      if (!isValidPhase) return {} // Return empty — saveGame will still work but data is minimal
      return {
        oregonTrail: state,
        karmaBalance: balance,
        karmaAlignment: alignment,
        mysteryState: {
          educationalCluesCollected: mysteryState.educationalCluesCollected,
          activeCase: mysteryState.activeCase,
          activeCaseData: mysteryState.activeCaseData,
          casesSolved: mysteryState.casesSolved,
          hintsUsedTotal: mysteryState.hintsUsedTotal,
          currentDiscountTier: mysteryState.currentDiscountTier,
          collectedClues: mysteryState.collectedClues,
          knownTraits: mysteryState.knownTraits,
          currentOutlaw: mysteryState.currentOutlaw,
          outlawsCaught: mysteryState.outlawsCaught,
          outlawsEscaped: mysteryState.outlawsEscaped,
          totalBountyEarned: mysteryState.totalBountyEarned,
          notebookEntries: mysteryState.notebookEntries,
        },
      }
    })

    setMetadataCollector(() => ({
      dayNumber: state.day,
      distance: state.distance,
      currentLocation: state.currentLandmark,
      partySize: state.party.length,
      karmaAlignment: getAlignmentDisplayName(),
      playTime: state.daysOnTrail * 24, // Rough estimate
    }))

    // Set up game data loader for restoring saved games
    setGameDataLoader((data) => {
      if (data.oregonTrail) {
        loadState(data.oregonTrail as typeof state)
      }
      // Restore karma balance and alignment
      if (data.karmaBalance) {
        loadKarmaState(
          data.karmaBalance as import('@/lib/karmaBlockchain').KarmaBalance,
          data.karmaAlignment as { lawfulChaotic: number; goodEvil: number } | undefined,
        )
      }
      // Restore mystery/investigation state
      if (data.mysteryState) {
        loadMysteryState(data.mysteryState as Partial<import('./mysteryContext').MysteryState>)
      }
    })
  }, [user, state, balance, alignment, mysteryState, setGameDataCollector, setGameDataLoader, setMetadataCollector, getAlignmentDisplayName, loadState, loadKarmaState, loadMysteryState, enableAutoSave])

  return null
}

function OregonTrailGame() {
  const { state, startFromTitle, completeChapterIntro, loadState } = useOregonTrail()
  const [audioInitialized, setAudioInitialized] = useState(false)
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
        loadState(JSON.parse(saved))
      }
    } catch { /* corrupt save, ignore */ }
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
