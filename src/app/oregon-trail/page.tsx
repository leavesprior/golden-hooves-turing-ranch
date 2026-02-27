'use client'

import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import Link from 'next/link'
import { trackPageView, trackGameStart } from '@/lib/eventTracker'
import { OregonTrailProvider, useOregonTrail, type GamePhase } from './oregonTrailContext'
import { KarmaToastContainer } from '@/components/karma'

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

// Local auto-save key for unauthenticated users (subsystem contexts persist
// independently; this captures the core OregonTrail state so "Continue" works
// without requiring login)
const LOCAL_AUTOSAVE_KEY = 'golden_frog_local_save'

// NOTE: GameMenu, CharacterCreationScreen, InvestigationScreen, OutfittingScreen,
// WorldMapScreen, and GoldCountryArrivalScreen have been extracted to ./phases/
function TravelScreen() {
  const { state, travel, setPace, setRations, hunt, handleEventChoice, crossRiver, applyRiverCrossingEffects, leaveTown, resetGame, openInvestigation, openDossier, openTelegraph, openJournal, openWorldMap, openRanchManagement, buySupplies, buyFood, getAllNPCRelationships } = useOregonTrail()
  const { balance, canAfford, spendNeutral, earnNeutral, earnGood, addBadKarma } = useKarmaWallet()
  const { state: mysteryState } = useMystery()
  const { getStat } = useCharacter()
  const { comment } = useNarrator()
  const { progress: chapterProgress } = useChapter()

  // Panning result state for showing roll results
  const [panningResult, setPanningResult] = useState<{
    roll: number
    luckBonus: number
    total: number
    reward: number
    message: string
  } | null>(null)

  // Last stat-variant that fired — shown as a badge on the post-event outcome message
  const [lastStatVariant, setLastStatVariant] = useState<{
    stat: string
    threshold: 'high' | 'low'
  } | null>(null)

  // Wrapper to handle event choice AND apply karma deltas from outcomes
  const handleEventChoiceWithKarma = useCallback(async (choiceId: string) => {
    if (!state.currentEvent) return

    const choice = state.currentEvent.choices.find(c => c.id === choiceId)
    if (!choice) return

    // SPECIAL HANDLING: Panning for gold uses dice roll + Luck
    if (state.currentEvent.id === 'found_gold' && choiceId === 'pan') {
      const luck = getStat('Luck')
      const roll = Math.floor(Math.random() * 20) + 1  // d20
      const luckBonus = Math.floor((luck - 10) / 2)    // D&D-style modifier
      const total = roll + luckBonus

      let reward = 0
      let message = ''

      if (roll === 20) {
        // Natural 20 - jackpot!
        reward = 100 + (luck * 5)
        const critDesc = getCriticalDescription(true, 'gambling', undefined, 'Luck')
        message = `${critDesc} JACKPOT! Natural 20! You strike a rich vein! (+${reward}🌮)`
        comment("The narrator has witnessed many fortunes found and lost. This one sparkles with promise.", 'observation')
      } else if (total >= 18) {
        // Excellent find
        reward = 60 + Math.floor(Math.random() * 30)
        message = `Excellent! You find several quality nuggets! (+${reward}🌮)`
      } else if (total >= 12) {
        // Decent find
        reward = 25 + Math.floor(Math.random() * 20)
        message = `Not bad! You find some flakes and a small nugget. (+${reward}🌮)`
      } else if (total >= 6) {
        // Poor find
        reward = 5 + Math.floor(Math.random() * 10)
        message = `Slim pickings. Just a few flakes of color. (+${reward}🌮)`
      } else {
        // Nothing
        reward = 0
        message = roll === 1
          ? `${getCriticalDescription(false, 'gambling')} Critical fail! You slip and soak yourself. Nothing found.`
          : `The stream bed yields nothing but mud and disappointment.`
        comment("Fortune favors the bold, but today she merely watches.", 'observation')
      }

      // Show result briefly
      setPanningResult({ roll, luckBonus, total, reward, message })
      setTimeout(() => setPanningResult(null), 4000)

      // Apply the event choice (for day lost, etc.)
      handleEventChoice(choiceId)

      // Apply the rolled karma reward
      if (reward > 0) {
        await earnNeutral(reward, `Panning: ${message}`)
      }
      return
    }

    // Standard event handling — pass stat-variant outcome override if available
    const variantStats = {
      Shrewdness: getStat('Shrewdness'), Agility: getStat('Agility'),
      Durability: getStat('Durability'), Diplomacy: getStat('Diplomacy'),
      Luck: getStat('Luck'), Expertise: getStat('Expertise'),
    }
    const variant = getEventVariant(state.currentEvent.id, variantStats)
    const outcomeOverride = variant?.outcomeOverrides?.[choiceId]
    handleEventChoice(choiceId, outcomeOverride)

    // Record which stat variant fired so the outcome screen can badge it
    if (variant) {
      setLastStatVariant({ stat: variant.stat, threshold: variant.threshold })
      // Auto-clear after 8 seconds so it doesn't linger forever
      setTimeout(() => setLastStatVariant(null), 8000)
    } else {
      setLastStatVariant(null)
    }

    // Apply karma wallet changes from the outcome
    const outcome = choice.outcome
    if (outcome.neutralKarmaDelta) {
      if (outcome.neutralKarmaDelta > 0) {
        await earnNeutral(outcome.neutralKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
      } else {
        await spendNeutral(Math.abs(outcome.neutralKarmaDelta), `${state.currentEvent.title}: ${choice.text}`)
      }
    }
    if (outcome.goodKarmaDelta && outcome.goodKarmaDelta > 0) {
      await earnGood(outcome.goodKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
    }
    if (outcome.badKarmaDelta && outcome.badKarmaDelta > 0) {
      await addBadKarma(outcome.badKarmaDelta, `${state.currentEvent.title}: ${choice.text}`)
    }
  }, [state.currentEvent, handleEventChoice, earnNeutral, spendNeutral, earnGood, addBadKarma, getStat, comment])

  // Shop and Inn modals
  const [showShop, setShowShop] = useState(false)
  const [showInn, setShowInn] = useState(false)
  const [showResearch, setShowResearch] = useState(false)
  const [showDiscountReward, setShowDiscountReward] = useState(false)
  // NPC Relationship Panel (#5)
  const [showNPCPanel, setShowNPCPanel] = useState(false)

  // Town puzzles (Improvement #4: Hitchhiker's Guide-style multi-step puzzles)
  const [showPuzzle, setShowPuzzle] = useState<TownPuzzleData | null>(null)
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([])

  // Specialty shops and guides
  const [showSpecialtyShop, setShowSpecialtyShop] = useState<SpecialtyShopData | null>(null)
  const [showGuideHire, setShowGuideHire] = useState(false)
  const [hiredGuide, setHiredGuide] = useState<HireableGuide | null>(null)
  const [guideRemainingLandmarks, setGuideRemainingLandmarks] = useState(0)

  // Posse recruitment modal (#6)
  const [showPosseRecruitment, setShowPosseRecruitment] = useState(false)

  // Camp Menu & Pip-Boy Game Menu
  const [showCampMenu, setShowCampMenu] = useState(false)
  const [showPipBoy, setShowPipBoy] = useState(false)

  // Get Gold Country mystery context
  const { getCluesForLocation, getCorrectClueCount, getActiveCase, autoStartFirstCase } = useMystery()
  const activeCaseData = getActiveCase()

  // Get current location info for research (works for both trail landmarks and Gold Country)
  const currentLocationId = state.currentLandmark.toLowerCase().replace(/[^a-z]/g, '_')
  const currentGoldCountryLocation = getGoldCountryLocation(currentLocationId)
  const currentLocationClues = getCluesForLocation(currentLocationId)
  // Research is available at trail landmarks with clues OR Gold Country locations with clues
  const hasResearchAvailable = currentLocationClues.length > 0

  // Historical character encounters
  const [historicalEncounter, setHistoricalEncounter] = useState<HistoricalCharacterEvent | null>(null)
  const [historicalOutcome, setHistoricalOutcome] = useState<string | null>(null)
  const [visitedHistoricalIds, setVisitedHistoricalIds] = useState<string[]>([])

  // Roll for historical encounter when arriving at a town
  const currentHistoricalChar = React.useMemo(() => {
    return rollHistoricalEncounter(state.currentLandmark, visitedHistoricalIds)
  }, [state.currentLandmark, visitedHistoricalIds])

  const handleHistoricalChoice = useCallback((choice: HistoricalCharacterChoice) => {
    const outcome = choice.outcome
    setHistoricalOutcome(outcome.message)

    if (historicalEncounter) {
      setVisitedHistoricalIds(prev => [...prev, historicalEncounter.id])
    }

    // Apply effects through narrator
    if (outcome.moraleDelta) {
      comment(`${outcome.moraleDelta > 0 ? 'Spirits lifted.' : 'A somber moment.'}`, 'observation')
    }
  }, [historicalEncounter, comment])

  // Check if current location has Cynthia's Inn
  const isWestPoint = hasCynthiasInn(state.currentLandmark)

  // Specialty shops and guides at current location (seeded by day to be deterministic)
  const earlyLandmarkData = LANDMARKS.find(l => l.name === state.currentLandmark)
  const earlyLandmarkType = earlyLandmarkData?.type || 'town'

  // Build trail landmark info for ResearchStation when not at a Gold Country location
  const currentTrailLandmark: TrailLandmarkInfo | undefined = !currentGoldCountryLocation && currentLocationClues.length > 0
    ? {
        name: state.currentLandmark,
        description: earlyLandmarkData ? `A ${earlyLandmarkData.type} on the Emigrant Trail` : 'An Emigrant Trail landmark',
        icon: earlyLandmarkData?.type === 'fort' ? '🏰'
          : earlyLandmarkData?.type === 'river' ? '🌊'
          : earlyLandmarkData?.type === 'landmark' ? '🗿'
          : earlyLandmarkData?.type === 'pass' ? '⛰️'
          : earlyLandmarkData?.type === 'spring' ? '♨️'
          : earlyLandmarkData?.type === 'mountains' ? '🏔️'
          : '📍',
      }
    : undefined
  const availableSpecialtyShops = React.useMemo(
    () => getAvailableShops(state.currentLandmark, earlyLandmarkType, state.day * 1000 + state.distance),
    [state.currentLandmark, earlyLandmarkType, state.day, state.distance]
  )
  const availableGuides = React.useMemo(
    () => getAvailableGuides(state.currentLandmark),
    [state.currentLandmark]
  )

  // Handle guide hire
  const handleHireGuide = useCallback((guide: HireableGuide) => {
    setHiredGuide(guide)
    setGuideRemainingLandmarks(guide.duration)
    setShowGuideHire(false)
  }, [])

  // Character Sheet & Consumable Effects
  const [showCharacterSheet, setShowCharacterSheet] = useState(false)
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([])
  const [lastTickDay, setLastTickDay] = useState(state.day)

  // Tick consumable effects each travel day (only triggered by day change)
  React.useEffect(() => {
    if (state.day !== lastTickDay) {
      setLastTickDay(state.day)
      setActiveEffects(prev => {
        if (prev.length === 0) return prev
        const daysPassed = state.day - lastTickDay
        let current = prev
        for (let i = 0; i < daysPassed; i++) {
          current = tickEffects(current)
        }
        return current
      })
    }
   
  }, [state.day, lastTickDay])

  const handleUseConsumable = useCallback((itemId: string) => {
    const item = getConsumableItem(itemId)
    if (!item) return
    // Update active effects (timed buffs/debuffs)
    const updatedEffects = applyConsumable(itemId, activeEffects, state.day)
    setActiveEffects(updatedEffects)
    // Apply instant effects (heal, morale, cure)
    const instant = getInstantEffects(itemId)
    if (instant.healAmount > 0) {
      buyFood(instant.healAmount, 0, 0, true)
    }
    if (instant.moraleAmount > 0) {
      buyFood(0, instant.moraleAmount, 0, false)
    }
    comment(`Used ${item.emoji} ${item.name}.`, 'observation')
  }, [activeEffects, state.day, buyFood, comment])

  const handleApplyMedicine = useCallback((_memberId: string) => {
    if (state.medicine > 0) {
      buySupplies('medicine', -1, 0) // Consume one medicine kit
      buyFood(15, 5, 0, true) // Heal party + small morale boost
      comment('Medicine applied. The party feels better.', 'observation')
    }
  }, [state.medicine, buySupplies, buyFood, comment])

  const handleRepairWagon = useCallback(() => {
    if (state.spareParts > 0 && state.wagonCondition < 100) {
      buySupplies('spareParts', -1, 0) // Consume one spare part
      // Wagon condition boost is handled via spare parts addition trick
      buySupplies('spareParts', 0, 0) // Trigger state update for wagon display
      comment('Wagon repaired with a spare part. She rides smoother now.', 'observation')
    }
  }, [state.spareParts, state.wagonCondition, buySupplies, comment])

  // Weather emoji
  const weatherEmoji = {
    fair: '\u2600\ufe0f',
    rain: '\ud83c\udf27\ufe0f',
    storm: '\u26c8\ufe0f',
    snow: '\u2744\ufe0f',
  }[state.weather]

  // Progress percentage
  const progress = (state.distance / 2000) * 100

  // 64-bit graphics: Calculate time of day from game state
  const gameHour = (state.day % 1) * 24 || 12 // Default to noon
  const timeOfDay = getTimeOfDay(gameHour)

  // Map game weather to graphics weather type
  const graphicsWeather: WeatherType = state.weather === 'rain' ? 'rain'
    : state.weather === 'storm' ? 'rain'
    : state.weather === 'snow' ? 'snow'
    : 'clear'

  // Determine terrain type based on distance
  const getTerrain = (): 'plains' | 'mountains' | 'desert' | 'forest' | 'river' => {
    if (state.distance < 400) return 'plains'
    if (state.distance < 800) return 'forest'
    if (state.distance < 1200) return 'mountains'
    if (state.distance < 1600) return 'desert'
    return 'plains'
  }

  // Get CSS filter based on graphics tier
  const tierFilter = getTierFilter(state.graphicsTier)

  // Game over screen
  if (state.phase === 'game_over') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">☠️</div>
          <h1 className="font-pixel text-red-400 text-2xl mb-4">Game Over</h1>
          <p className="text-gray-400 mb-6">{state.message}</p>
          <p className="text-gray-500 text-sm mb-8">
            Days on trail: {state.daysOnTrail} | Miles traveled: {state.totalMilesTraveled}
          </p>
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-4 border-amber-500"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Victory screen
  if (state.phase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="font-pixel text-yellow-300 text-2xl mb-4">You Made It!</h1>
          <p className="text-amber-300 mb-6">Welcome to Gold Country, California!</p>
          <div className="text-amber-400 text-sm mb-8 space-y-1">
            <p>Days on trail: {state.daysOnTrail}</p>
            <p>Party members surviving: {state.party.filter(m => m.health > 0).length}</p>
            <div className="flex items-center justify-center gap-2">
              <span>Karma:</span>
              <KarmaWallet compact />
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-4 border-amber-500"
            >
              Play Again
            </button>
            <Link
              href="/hub"
              className="px-6 py-3 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-4 border-green-500"
            >
              Back to Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Event screen
  if (state.phase === 'event' && state.currentEvent) {
    // Show panning hint for gold event
    const isPanningEvent = state.currentEvent.id === 'found_gold'
    const luckStat = getStat('Luck')
    const luckMod = Math.floor((luckStat - 10) / 2)

    // Check for stat-keyed event variant (Improvement #1: Fallout-style stat awareness)
    const playerStats = {
      Shrewdness: getStat('Shrewdness'),
      Agility: getStat('Agility'),
      Durability: getStat('Durability'),
      Diplomacy: getStat('Diplomacy'),
      Luck: getStat('Luck'),
      Expertise: getStat('Expertise'),
    }
    const eventVariant = getEventVariant(state.currentEvent.id, playerStats)
    const eventDescription = eventVariant?.description ?? state.currentEvent.description

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
        <KarmaToastContainer />
        <div className="max-w-md w-full bg-amber-900/80 border-4 border-amber-600 rounded-lg p-6">
          <h2 className="font-pixel text-amber-200 text-lg mb-4 text-center">
            {state.currentEvent.title}
          </h2>
          {eventVariant && (
            <p className="text-center mb-2">
              {eventVariant.threshold === 'high' ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-900/70 text-green-300 px-2 py-0.5 rounded border border-green-600 font-bold tracking-wide">
                  {'\u25b2'} HIGH {eventVariant.stat.toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-red-900/70 text-red-300 px-2 py-0.5 rounded border border-red-700 font-bold tracking-wide">
                  {'\u25bc'} LOW {eventVariant.stat.toUpperCase()}
                </span>
              )}
              <span className="text-amber-600 text-[10px] ml-2 italic">
                {eventVariant.threshold === 'high'
                  ? `Your ${eventVariant.stat} gives you an edge`
                  : `Your low ${eventVariant.stat} changes how this plays out`}
              </span>
            </p>
          )}
          <p className="text-amber-300 text-sm mb-6 text-center">
            {eventDescription}
          </p>

          {/* Panning stat hint */}
          {isPanningEvent && (
            <div className="mb-4 p-2 bg-yellow-900/40 border border-yellow-600 rounded text-center">
              <span className="text-yellow-300 text-xs">
                🎲 Panning uses d20 + Luck modifier ({luckMod >= 0 ? '+' : ''}{luckMod})
              </span>
            </div>
          )}

          <div className="space-y-3">
            {state.currentEvent.choices.map(choice => {
              const choiceText = eventVariant?.choiceOverrides?.[choice.id] ?? choice.text
              return (
              <button
                key={choice.id}
                onClick={() => handleEventChoiceWithKarma(choice.id)}
                className="w-full p-3 bg-amber-800/60 hover:bg-amber-700/60 border-2 border-amber-600 rounded text-amber-200 font-pixel text-xs text-left transition-colors"
              >
                {choiceText}
                {((choice.karmaLawful !== undefined && choice.karmaLawful !== 0) || (choice.karmaGood !== undefined && choice.karmaGood !== 0)) && (
                  <span className="block mt-1 text-[10px] text-amber-500">
                    {choice.karmaLawful !== undefined && choice.karmaLawful !== 0 && (choice.karmaLawful < 0 ? '\u2696 Lawful' : '\ud83c\udf00 Chaotic')}
                    {choice.karmaGood !== undefined && choice.karmaGood !== 0 && (choice.karmaGood < 0 ? ' \u2728 Good' : ' \ud83d\udd25 Evil')}
                  </span>
                )}
              </button>
              )
            })}
          </div>
        </div>

        {/* Panning Result Overlay */}
        {panningResult && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-amber-900 border-4 border-yellow-500 rounded-lg p-6 max-w-sm text-center animate-pulse">
              <div className="text-4xl mb-3">⛏️🎲</div>
              <div className="text-yellow-300 font-pixel text-lg mb-2">
                Roll: {panningResult.roll} {panningResult.luckBonus >= 0 ? '+' : ''}{panningResult.luckBonus} = {panningResult.total}
              </div>
              <div className={`text-lg font-bold mb-2 ${
                panningResult.reward >= 60 ? 'text-yellow-300' :
                panningResult.reward >= 25 ? 'text-green-300' :
                panningResult.reward > 0 ? 'text-amber-300' :
                'text-gray-400'
              }`}>
                {panningResult.message}
              </div>
              {panningResult.roll === 20 && (
                <div className="text-yellow-400 text-2xl">✨ CRITICAL SUCCESS! ✨</div>
              )}
              {panningResult.roll === 1 && (
                <div className="text-red-400 text-sm">💀 Critical Fail</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // River crossing screen - NEW: Enhanced 5-choice Oregon Trail style crossing
  if (state.phase === 'river') {
    const handleRiverCrossingComplete = async (success: boolean, effects: CrossingOutcome['effects']) => {
      // Apply karma changes from crossing (handled via KarmaWallet context)
      if (effects.karmaChange) {
        if (effects.karmaChange.neutral && effects.karmaChange.neutral > 0) {
          await earnNeutral(effects.karmaChange.neutral, 'River crossing bonus')
        }
        if (effects.karmaChange.good && effects.karmaChange.good > 0) {
          await earnGood(effects.karmaChange.good, 'River crossing virtue')
        }
        if (effects.karmaChange.bad && effects.karmaChange.bad > 0) {
          await addBadKarma(effects.karmaChange.bad, 'River crossing mishap')
        }
      }

      // Narrator comment based on outcome
      if (success) {
        comment("The river is behind you. The frontier doesn't offer many such clean victories.", 'observation')
      } else {
        comment("The river extracts its toll. It always does, one way or another.", 'warning')
      }

      // Generate outcome message
      const outcomeMessage = success
        ? 'Crossed safely! The journey continues.'
        : 'The crossing took its toll. Some supplies were lost.'

      // Apply all effects to game state and return to traveling
      applyRiverCrossingEffects(effects, outcomeMessage)
    }

    return (
      <RiverCrossing
        riverName={state.currentLandmark}
        weather={state.weather}
        dayOfYear={state.day % 365}
        onComplete={handleRiverCrossingComplete}
      />
    )
  }

  // Town screen - Now includes investigation options
  // Get landmark type for unique visuals
  const currentLandmarkData = LANDMARKS.find(l => l.name === state.currentLandmark)
  const landmarkType: LandmarkType = (currentLandmarkData?.type as LandmarkType) || 'town'

  // Dynamic background gradient based on landmark type
  const landmarkGradients: Record<LandmarkType, string> = {
    town: 'from-amber-950 via-amber-900 to-amber-950',
    river: 'from-slate-900 via-blue-900 to-slate-950',
    fort: 'from-stone-900 via-stone-800 to-stone-950',
    landmark: 'from-orange-950 via-orange-900 to-amber-950',
    pass: 'from-slate-950 via-slate-800 to-gray-900',
    spring: 'from-teal-950 via-emerald-900 to-teal-950',
    mountains: 'from-indigo-950 via-purple-900 to-indigo-950',
    destination: 'from-yellow-900 via-amber-800 to-yellow-950',
  }

  // Get weather type for scene
  const sceneWeather: WeatherType = state.weather === 'snow' ? 'snow' :
                                    state.weather === 'rain' ? 'rain' :
                                    state.weather === 'storm' ? 'rain' : 'clear'

  if (state.phase === 'town') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${landmarkGradients[landmarkType]} p-4`}>
        <KarmaToastContainer />
        <NarratorOverlay position="corner" />
        <div className="max-w-2xl mx-auto pt-4">
          {/* Landmark Scene - unique visual for each location */}
          <LandmarkScene
            landmarkName={state.currentLandmark}
            landmarkType={landmarkType}
            timeOfDay={timeOfDay}
            weather={sceneWeather}
            className="mb-4"
          />

          <div className="text-center mb-6">
            <h2 className="font-pixel text-amber-200 text-xl">{state.currentLandmark}</h2>
            <p className="text-amber-400 text-sm">Day {state.day} | {state.distance} miles traveled</p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            <button
              onClick={openJournal}
              className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
            >
              📔 Journal ({mysteryState.collectedClues.length} clues, {Object.keys(mysteryState.knownTraits).length} traits)
            </button>
            <button
              onClick={openDossier}
              className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
            >
              📋 Dossiers
            </button>
            {/* NPC Relationship Panel — show count badge when relationships exist */}
            {(() => {
              const rels = getAllNPCRelationships()
              return (
                <button
                  onClick={() => setShowNPCPanel(true)}
                  className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60 relative"
                >
                  🤝 Relations{rels.length > 0 && ` (${rels.length})`}
                </button>
              )
            })()}
            <ReputationBar compact />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Status */}
            <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
              <h3 className="font-pixel text-amber-200 text-sm mb-3 border-b border-amber-600 pb-2">Supplies</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-amber-400">Food:</span>
                  <span className="text-amber-200">{state.food} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">Ammo:</span>
                  <span className="text-amber-200">{state.ammunition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">Parts:</span>
                  <span className="text-amber-200">{state.spareParts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">Medicine:</span>
                  <span className="text-amber-200">{state.medicine}</span>
                </div>
              </div>
              {/* Karma Balance */}
              <div className="mt-3 pt-2 border-t border-amber-600">
                <KarmaWallet compact />
              </div>
            </div>

            {/* Party Health */}
            <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
              <h3 className="font-pixel text-amber-200 text-sm mb-3 border-b border-amber-600 pb-2">Party Health</h3>
              <div className="space-y-2">
                {state.party.map(member => (
                  <div key={member.id} className="flex items-center gap-2">
                    <span className="text-amber-200 text-xs flex-1">{member.name}</span>
                    <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                      <div
                        className={`h-full ${member.health > 50 ? 'bg-green-500' : member.health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${member.health}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Progress */}
            <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
              <h3 className="font-pixel text-amber-200 text-sm mb-3 border-b border-amber-600 pb-2">Golden Frog Rewards</h3>
              <DiscountProgressBar onShowReward={() => setShowDiscountReward(true)} />
            </div>

            {/* Hired Guide Status */}
            {hiredGuide && (
              <div className="bg-indigo-900/40 border-2 border-indigo-600 rounded-lg p-4">
                <h3 className="font-pixel text-indigo-200 text-sm mb-2 border-b border-indigo-600 pb-2">Trail Guide</h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{hiredGuide.emoji}</span>
                  <div className="flex-1">
                    <p className="text-indigo-200 text-sm font-bold">{hiredGuide.name}</p>
                    <p className="text-indigo-400 text-xs">{hiredGuide.title}</p>
                    <p className="text-indigo-300 text-xs mt-1">{guideRemainingLandmarks} landmarks remaining</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hiredGuide.benefits.map((b, i) => (
                    <span key={i} className="text-xs bg-indigo-800/50 text-indigo-300 px-1.5 py-0.5 rounded">
                      {b.description}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Town Actions */}
          <div className="grid gap-2 mb-6 grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
            <button
              onClick={() => setShowShop(true)}
              className="p-3 bg-yellow-900/60 hover:bg-yellow-800/60 border-2 border-yellow-600 rounded-lg text-center"
            >
              <span className="text-2xl">🏪</span>
              <p className="text-yellow-200 text-xs mt-1">Shop</p>
            </button>
            <button
              onClick={() => setShowInn(true)}
              className={`p-3 border-2 rounded-lg text-center ${
                isWestPoint
                  ? 'bg-emerald-900/60 hover:bg-emerald-800/60 border-emerald-500'
                  : 'bg-purple-900/60 hover:bg-purple-800/60 border-purple-600'
              }`}
            >
              <span className="text-2xl">{isWestPoint ? '🏔️' : '🏨'}</span>
              <p className={`text-xs mt-1 ${isWestPoint ? 'text-emerald-200' : 'text-purple-200'}`}>
                {isWestPoint ? "Cynthia's" : 'Inn'}
              </p>
            </button>
            <button
              onClick={openInvestigation}
              className="p-3 bg-red-900/60 hover:bg-red-800/60 border-2 border-red-600 rounded-lg text-center"
            >
              <span className="text-2xl">🔍</span>
              <p className="text-red-200 text-xs mt-1">Investigate</p>
            </button>
            <button
              onClick={openTelegraph}
              className="p-3 bg-blue-900/60 hover:bg-blue-800/60 border-2 border-blue-600 rounded-lg text-center"
            >
              <span className="text-2xl">📨</span>
              <p className="text-blue-200 text-xs mt-1">Telegraph</p>
            </button>
            {/* Research button - Gold Country educational content */}
            <button
              onClick={() => setShowResearch(true)}
              disabled={!hasResearchAvailable}
              className={`p-3 border-2 rounded-lg text-center ${
                hasResearchAvailable
                  ? 'bg-cyan-900/60 hover:bg-cyan-800/60 border-cyan-600'
                  : 'bg-gray-900/60 border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">📚</span>
              <p className={`text-xs mt-1 ${hasResearchAvailable ? 'text-cyan-200' : 'text-gray-500'}`}>
                Research
              </p>
              {currentLocationClues.length > 0 && (
                <p className="text-cyan-400 text-[10px] mt-0.5">
                  {mysteryState.educationalCluesCollected.filter(c => c.answeredCorrectly && currentLocationClues.some(cl => cl.id === c.clue.id)).length}/{currentLocationClues.length} done
                </p>
              )}
            </button>
            {currentHistoricalChar && (
              <button
                onClick={() => setHistoricalEncounter(currentHistoricalChar)}
                className="p-3 bg-amber-900/60 hover:bg-amber-800/60 border-2 border-amber-500 rounded-lg text-center animate-pulse"
              >
                <span className="text-2xl">{currentHistoricalChar.portrait}</span>
                <p className="text-amber-200 text-xs mt-1">Stranger</p>
              </button>
            )}
            <button
              onClick={() => hunt()}
              disabled={state.ammunition < 10}
              className="p-3 bg-green-900/60 hover:bg-green-800/60 border-2 border-green-600 rounded-lg text-center disabled:opacity-50"
            >
              <span className="text-2xl">🦌</span>
              <p className="text-green-200 text-xs mt-1">Hunt</p>
            </button>
            {/* Make Camp button */}
            <button
              onClick={() => setShowCampMenu(true)}
              className="p-3 bg-amber-900/60 hover:bg-amber-800/60 border-2 border-amber-600 rounded-lg text-center"
            >
              <span className="text-2xl">{'\u26FA'}</span>
              <p className="text-amber-200 text-xs mt-1">Camp</p>
            </button>
            {/* Ranch button - only at West Point */}
            {isWestPoint && (
              <button
                onClick={openRanchManagement}
                className="p-3 bg-lime-900/60 hover:bg-lime-800/60 border-2 border-lime-600 rounded-lg text-center"
              >
                <span className="text-2xl">🌾</span>
                <p className="text-lime-200 text-xs mt-1">Ranch</p>
              </button>
            )}
            {/* Specialty Shops - appear randomly at towns/forts */}
            {availableSpecialtyShops.map(shop => (
              <button
                key={shop.type}
                onClick={() => setShowSpecialtyShop(shop)}
                className={`p-3 border-2 rounded-lg text-center ${
                  shop.type === 'wagonwright' ? 'bg-orange-900/60 hover:bg-orange-800/60 border-orange-600' :
                  shop.type === 'apothecary' ? 'bg-teal-900/60 hover:bg-teal-800/60 border-teal-600' :
                  shop.type === 'outfitter' ? 'bg-sky-900/60 hover:bg-sky-800/60 border-sky-600' :
                  shop.type === 'assayer' ? 'bg-yellow-900/60 hover:bg-yellow-800/60 border-yellow-600' :
                  'bg-red-900/60 hover:bg-red-800/60 border-red-600'
                }`}
              >
                <span className="text-2xl">{shop.emoji}</span>
                <p className={`text-xs mt-1 ${
                  shop.type === 'wagonwright' ? 'text-orange-200' :
                  shop.type === 'apothecary' ? 'text-teal-200' :
                  shop.type === 'outfitter' ? 'text-sky-200' :
                  shop.type === 'assayer' ? 'text-yellow-200' :
                  'text-red-200'
                }`}>{shop.name.split(' ')[0]}</p>
              </button>
            ))}
            {/* Guide Hire - when guides are available or one is hired */}
            {(availableGuides.length > 0 || hiredGuide) && (
              <button
                onClick={() => setShowGuideHire(true)}
                className="p-3 bg-indigo-900/60 hover:bg-indigo-800/60 border-2 border-indigo-600 rounded-lg text-center relative"
              >
                <span className="text-2xl">🧭</span>
                <p className="text-indigo-200 text-xs mt-1">Guides</p>
                {hiredGuide && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>
            )}
            {/* Posse Recruitment (#6) - always available at settlements */}
            <button
              onClick={() => setShowPosseRecruitment(true)}
              className="p-3 bg-amber-900/60 hover:bg-amber-800/60 border-2 border-amber-600 rounded-lg text-center relative"
            >
              <span className="text-2xl">{'\ud83e\udd20'}</span>
              <p className="text-amber-200 text-xs mt-1">Posse</p>
              {state.party.filter(m => m.isHired).length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] text-white flex items-center justify-center">
                  {state.party.filter(m => m.isHired).length}
                </span>
              )}
            </button>
            {/* Town Puzzles - Hitchhiker's Guide style */}
            {(() => {
              const puzzles = getPuzzlesForLandmark(state.currentLandmark, solvedPuzzles, state.day, state.inventory)
              return puzzles.length > 0 ? (
                <button
                  onClick={() => setShowPuzzle(puzzles[0])}
                  className="p-3 bg-cyan-900/60 hover:bg-cyan-800/60 border-2 border-cyan-500 rounded-lg text-center animate-pulse"
                >
                  <span className="text-2xl">🧩</span>
                  <p className="text-cyan-200 text-xs mt-1">Puzzle</p>
                </button>
              ) : null
            })()}
            {/* Character Sheet - always available */}
            <button
              onClick={() => setShowCharacterSheet(true)}
              className="p-3 bg-stone-800/60 hover:bg-stone-700/60 border-2 border-stone-500 rounded-lg text-center relative"
            >
              <span className="text-2xl">📋</span>
              <p className="text-stone-200 text-xs mt-1">Character</p>
              {activeEffects.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] text-white flex items-center justify-center">
                  {activeEffects.length}
                </span>
              )}
            </button>
            <button
              onClick={leaveTown}
              className="p-3 bg-amber-900/60 hover:bg-amber-800/60 border-2 border-amber-600 rounded-lg text-center"
            >
              <span className="text-2xl">🛤️</span>
              <p className="text-amber-200 text-xs mt-1">Continue</p>
            </button>
          </div>

          {/* World Map Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={openWorldMap}
              className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-500 rounded-lg text-center flex items-center gap-3"
            >
              <span className="text-2xl">🗺️</span>
              <div className="text-left">
                <p className="text-slate-200 text-sm font-pixel">Open World Map</p>
                <p className="text-slate-400 text-xs">Explore Gold Country</p>
              </div>
            </button>
          </div>

          {/* Message Display */}
          {state.message && (
            <div className="bg-amber-800/40 border border-amber-600 rounded p-3 text-center">
              <p className="text-amber-200 text-sm">{state.message}</p>
            </div>
          )}
        </div>

        {/* Shop Modal */}
        {showShop && <TownShop onClose={() => setShowShop(false)} />}

        {/* Inn Modal */}
        {showInn && <TownInn onClose={() => setShowInn(false)} isWestPoint={isWestPoint} />}

        {/* Town Puzzle Modal */}
        {showPuzzle && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Suspense fallback={<div className="text-yellow-300">Loading puzzle...</div>}>
              <TownPuzzle
                puzzle={showPuzzle}
                playerStats={{
                  Shrewdness: getStat('Shrewdness'),
                  Agility: getStat('Agility'),
                  Durability: getStat('Durability'),
                  Diplomacy: getStat('Diplomacy'),
                  Luck: getStat('Luck'),
                  Expertise: getStat('Expertise'),
                }}
                onSkillCheck={(stat, dc) => {
                  const statVal = getStat(stat)
                  const roll = Math.floor(Math.random() * 20) + 1
                  const modifier = statVal
                  const total = roll + modifier
                  return { success: roll !== 1 && (roll === 20 || total >= dc), roll, modifier, total }
                }}
                onComplete={(puzzleId, rewards) => {
                  setSolvedPuzzles(prev => [...prev, puzzleId])
                  // Apply rewards
                  if (rewards.food || rewards.ammunition || rewards.medicine || rewards.spareParts) {
                    // These are applied via the state context
                  }
                  if (rewards.neutralKarma && rewards.neutralKarma > 0) {
                    earnNeutral(rewards.neutralKarma, `Puzzle solved: ${showPuzzle.title}`)
                  }
                  if (rewards.xp) {
                    // XP would go through character context
                  }
                  if (rewards.inventoryItem) {
                    // Add to game inventory
                  }
                }}
                onClose={() => setShowPuzzle(null)}
              />
            </Suspense>
          </div>
        )}

        {/* Historical Character Encounter Modal */}
        {historicalEncounter && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[55] p-4">
            <div className="bg-amber-950 border-2 border-amber-500 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="bg-amber-900/80 p-4 border-b border-amber-600">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{historicalEncounter.portrait}</span>
                  <div>
                    <h2 className="text-amber-200 font-bold text-lg">{historicalEncounter.characterName}</h2>
                    <p className="text-amber-400 text-sm">{historicalEncounter.title}</p>
                    <p className="text-amber-600 text-xs">{historicalEncounter.period}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {!historicalOutcome ? (
                  <>
                    <p className="text-gray-300 text-sm leading-relaxed">{historicalEncounter.description}</p>
                    <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                      <p className="text-amber-200 text-sm italic">&ldquo;{historicalEncounter.dialogue.greeting}&rdquo;</p>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
                      <p className="text-gray-400 text-sm">&ldquo;{historicalEncounter.dialogue.fact}&rdquo;</p>
                    </div>
                    <div className="space-y-2">
                      {historicalEncounter.choices.map(choice => (
                        <button
                          key={choice.id}
                          onClick={() => handleHistoricalChoice(choice)}
                          className="w-full text-left px-4 py-3 bg-amber-900/30 hover:bg-amber-800/50 border border-amber-700 hover:border-amber-500 rounded-lg text-amber-200 text-sm transition-colors"
                        >
                          {choice.text}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300 text-sm leading-relaxed">{historicalOutcome}</p>
                    <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                      <p className="text-amber-200 text-sm italic">&ldquo;{historicalEncounter.dialogue.farewell}&rdquo;</p>
                    </div>
                    <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
                      <p className="text-cyan-300 text-xs font-bold mb-1">Historical Background:</p>
                      <p className="text-gray-400 text-xs">{historicalEncounter.historicalBio}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-amber-700 p-4">
                <button
                  onClick={() => { setHistoricalEncounter(null); setHistoricalOutcome(null) }}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded font-bold text-sm"
                >
                  {historicalOutcome ? 'Continue Journey' : 'Walk Away'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Specialty Shop Modal */}
        {showSpecialtyShop && (
          <SpecialtyShop shop={showSpecialtyShop} onClose={() => setShowSpecialtyShop(null)} />
        )}

        {/* Guide Hire Modal */}
        {showGuideHire && (
          <GuideHire
            guides={availableGuides}
            onHire={handleHireGuide}
            onClose={() => setShowGuideHire(false)}
            currentGuide={hiredGuide}
          />
        )}

        {/* Character Sheet Modal */}
        {showCharacterSheet && (
          <CharacterSheet
            onClose={() => setShowCharacterSheet(false)}
            onUseConsumable={handleUseConsumable}
            onApplyMedicine={handleApplyMedicine}
            onRepairWagon={handleRepairWagon}
            inventory={chapterProgress.easterEggsFound}
            activeEffects={activeEffects.map(e => ({
              id: e.id,
              sourceName: e.sourceName,
              type: e.type,
              stat: e.stat,
              value: e.value,
              remainingTurns: e.remainingTurns,
              stackCount: e.stackCount,
            }))}
          />
        )}

        {/* Research Station Modal - educational content (trail landmarks + Gold Country) */}
        {showResearch && currentLocationClues.length > 0 && (
          <ResearchStation
            isOpen={showResearch}
            onClose={() => setShowResearch(false)}
            location={currentGoldCountryLocation || undefined}
            trailLandmark={currentTrailLandmark}
            clue={currentLocationClues[0]}
            onClueAnswered={(correct) => {
              if (correct) {
                // Check if player earned a new discount tier
                const clueCount = getCorrectClueCount() + 1
                if (clueCount === 3 || clueCount === 5 || clueCount === 7 || clueCount === 10) {
                  setTimeout(() => setShowDiscountReward(true), 500)
                }
              }
            }}
          />
        )}

        {/* Discount Reward Modal */}
        {showDiscountReward && (
          <DiscountReward
            isOpen={showDiscountReward}
            onClose={() => setShowDiscountReward(false)}
            caseId={activeCaseData?.id || 'default'}
          />
        )}

        {/* NPC Relationship Panel Modal (#5) */}
        {showNPCPanel && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="text-amber-400 font-pixel text-sm animate-pulse">Loading relationships...</div>
            </div>
          }>
            <NPCRelationshipPanel
              relationships={getAllNPCRelationships()}
              currentDay={state.day}
              onClose={() => setShowNPCPanel(false)}
            />
          </Suspense>
        )}

        {/* Posse Recruitment Modal (#6) */}
        {showPosseRecruitment && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-amber-400 font-pixel text-sm animate-pulse">Loading posse...</div></div>}>
            <PosseRecruitment onClose={() => setShowPosseRecruitment(false)} />
          </Suspense>
        )}

        {/* Camp Menu */}
        <CampMenu isOpen={showCampMenu} onClose={() => setShowCampMenu(false)} />

        {/* Pip-Boy Game Menu */}
        <PipBoyMenu isOpen={showPipBoy} onClose={() => setShowPipBoy(false)} onOpenCamp={() => setShowCampMenu(true)} />

        {/* FAB: Game Menu button */}
        <button
          onClick={() => setShowPipBoy(true)}
          className="fixed bottom-4 right-4 z-40 bg-amber-900/90 border-2 border-amber-600 text-amber-200 font-pixel text-xs px-3 py-2 rounded hover:bg-amber-800/90 transition-colors shadow-lg"
        >
          [ESC] MENU
        </button>
      </div>
    )
  }

  // Main travel screen with 64-bit graphics wrapper
  return (
    <Graphics64bitWrapper
      tier={state.graphicsTier}
      timeOfDay={timeOfDay}
      weather={graphicsWeather}
      showLandmarks
      currentLandmark={state.currentLandmark}
    >
      <div className="min-h-screen p-4 crt-scanlines" style={{ filter: tierFilter }}>
        <KarmaToastContainer />

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-4 pt-4">
            <div>
              <h1 className="font-pixel text-amber-200 text-lg">Day {state.day}</h1>
              <p className="text-amber-400 text-xs">{weatherEmoji} {state.weather}</p>
              {state.graphicsTier === 'ultra_64bit' && (
                <p className="text-purple-400 text-[10px]">{timeOfDay} | {getTerrain()}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {state.graphicsTier === 'ultra_64bit' && (
                <span className="text-purple-400 text-[10px] px-2 py-0.5 bg-purple-900/50 rounded">64-bit</span>
              )}
              <Link
                href="/hub"
                className="text-amber-400 hover:text-amber-200 text-xs font-pixel"
              >
                Quit Game
              </Link>
            </div>
          </header>

          {/* Animated Traveling Scene (64-bit only) */}
          {state.graphicsTier === 'ultra_64bit' && (
            <TravelingScene
              tier={state.graphicsTier}
              timeOfDay={timeOfDay}
              weather={graphicsWeather}
              progress={state.milesUntilNextLandmark > 0 ? Math.round(100 - (state.milesUntilNextLandmark / 100) * 100) : 100}
              terrain={getTerrain()}
            />
          )}

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-amber-400 mb-1">
              <span>Independence, MO</span>
              <span>Gold Country, CA</span>
            </div>
            <div className="h-4 bg-amber-950 rounded-full overflow-hidden border-2 border-amber-600">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-yellow-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center text-amber-300 text-xs mt-1">
              {state.distance} / 2000 miles
            </div>
          </div>

          {/* Current location */}
          <div className="text-center mb-6">
          <p className="text-amber-400 text-xs">Near</p>
          <p className="font-pixel text-amber-200 text-lg">{state.currentLandmark}</p>
          <p className="text-amber-500 text-xs mt-1">
            {state.milesUntilNextLandmark} miles to {state.nextLandmark}
          </p>
        </div>

        {/* Message */}
        {state.message && (
          <div className="bg-amber-800/60 border-2 border-amber-600 rounded-lg p-3 mb-6 text-center">
            {/* Stat-variant outcome badge */}
            {lastStatVariant && (
              <p className="mb-1">
                {lastStatVariant.threshold === 'high' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-900/70 text-green-300 px-1.5 py-0.5 rounded border border-green-700 font-bold tracking-wide">
                    {'\u25b2'} HIGH {lastStatVariant.stat.toUpperCase()} — outcome modified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-red-900/70 text-red-300 px-1.5 py-0.5 rounded border border-red-700 font-bold tracking-wide">
                    {'\u25bc'} LOW {lastStatVariant.stat.toUpperCase()} — outcome modified
                  </span>
                )}
              </p>
            )}
            <p className="text-amber-200 text-sm">{state.message}</p>
          </div>
        )}

        {/* Trail Observations - Hitchhiker's Guide Style Commentary */}
        <div className="mb-6">
          <TravelObservations
            terrain={getTerrain()}
            weather={state.weather as WeatherMood}
            daysTraveled={state.daysOnTrail}
            nearLandmark={state.milesUntilNextLandmark < 50 ? state.nextLandmark : undefined}
            gameHour={gameHour}
            isMoving={state.phase === 'traveling'}
          />
        </div>

        {/* Controls and Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Pace */}
          <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
            <h3 className="font-pixel text-amber-200 text-xs mb-3">Travel Pace</h3>
            <div className="space-y-2">
              {(['steady', 'strenuous', 'grueling'] as const).map(pace => (
                <button
                  key={pace}
                  onClick={() => setPace(pace)}
                  className={`w-full py-1 text-xs font-pixel rounded transition-colors ${
                    state.pace === pace
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-amber-800/40 text-amber-400 hover:bg-amber-700/40'
                  }`}
                >
                  {pace.charAt(0).toUpperCase() + pace.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Rations */}
          <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
            <h3 className="font-pixel text-amber-200 text-xs mb-3">Food Rations</h3>
            <div className="space-y-2">
              {(['filling', 'meager', 'bare_bones'] as const).map(ration => (
                <button
                  key={ration}
                  onClick={() => setRations(ration)}
                  className={`w-full py-1 text-xs font-pixel rounded transition-colors ${
                    state.rations === ration
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-amber-800/40 text-amber-400 hover:bg-amber-700/40'
                  }`}
                >
                  {ration.replace('_', ' ').charAt(0).toUpperCase() + ration.replace('_', ' ').slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Supplies */}
          <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4">
            <h3 className="font-pixel text-amber-200 text-xs mb-3">Supplies</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-amber-400">Food:</span>
                <span className={state.food < 50 ? 'text-red-400' : 'text-amber-200'}>{state.food} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Ammo:</span>
                <span className="text-amber-200">{state.ammunition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Wagon:</span>
                <span className={state.wagonCondition < 30 ? 'text-red-400' : 'text-amber-200'}>{state.wagonCondition}%</span>
              </div>
              {/* Karma Balance */}
              <div className="mt-2 pt-2 border-t border-amber-600">
                <KarmaWallet compact />
              </div>
            </div>
          </div>
        </div>

        {/* Party health */}
        <div className="bg-amber-900/60 border-2 border-amber-600 rounded-lg p-4 mb-6">
          <h3 className="font-pixel text-amber-200 text-xs mb-3">Party Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {state.party.map(member => (
              <div key={member.id} className="text-center">
                <div className="text-amber-200 text-xs mb-1">{member.name}</div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      member.health > 50 ? 'bg-green-500' :
                      member.health > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${member.health}%` }}
                  />
                </div>
                <div className="text-[10px] text-amber-500 mt-1">{member.health}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Posse Roster Panel (#6) */}
        <div className="mb-6">
          <PossePanel />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={travel}
            className="px-8 py-3 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-4 border-green-500 transition-colors"
          >
            Continue Trail
          </button>
          <button
            onClick={hunt}
            disabled={state.ammunition < 10}
            className="px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-sm rounded border-4 border-amber-500 disabled:opacity-50 transition-colors"
          >
            Hunt
          </button>
          <button
            onClick={() => setShowCharacterSheet(true)}
            className="px-4 py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 font-pixel text-sm rounded border-4 border-stone-500 transition-colors relative"
          >
            Character
            {activeEffects.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] text-white flex items-center justify-center">
                {activeEffects.length}
              </span>
            )}
          </button>
          {/* Hunker Down - Vacation Rental Option */}
          <HunkerDown
            currentLandmark={state.currentLandmark}
            milesRemaining={2000 - state.distance}
            partySize={state.party.length}
            onHunkerDown={() => {}}
            graphicsTier={state.graphicsTier}
          />
          {/* Make Camp button */}
          <button
            onClick={() => setShowCampMenu(true)}
            className="px-4 py-3 bg-amber-800 hover:bg-amber-700 text-amber-100 font-pixel text-sm rounded border-4 border-amber-600 transition-colors"
          >
            {'\u26FA'} Camp
          </button>
        </div>

        {/* Character Sheet Modal (available during travel) */}
        {showCharacterSheet && (
          <CharacterSheet
            onClose={() => setShowCharacterSheet(false)}
            onUseConsumable={handleUseConsumable}
            onApplyMedicine={handleApplyMedicine}
            onRepairWagon={handleRepairWagon}
            inventory={chapterProgress.easterEggsFound}
            activeEffects={activeEffects.map(e => ({
              id: e.id,
              sourceName: e.sourceName,
              type: e.type,
              stat: e.stat,
              value: e.value,
              remainingTurns: e.remainingTurns,
              stackCount: e.stackCount,
            }))}
          />
        )}

        {/* Camp Menu (available during travel) */}
        <CampMenu isOpen={showCampMenu} onClose={() => setShowCampMenu(false)} />

        {/* Pip-Boy Game Menu (available during travel) */}
        <PipBoyMenu isOpen={showPipBoy} onClose={() => setShowPipBoy(false)} onOpenCamp={() => setShowCampMenu(true)} />

        {/* FAB: Game Menu button */}
        <button
          onClick={() => setShowPipBoy(true)}
          className="fixed bottom-4 right-4 z-40 bg-amber-900/90 border-2 border-amber-600 text-amber-200 font-pixel text-xs px-3 py-2 rounded hover:bg-amber-800/90 transition-colors shadow-lg"
        >
          [ESC] MENU
        </button>
      </div>
    </div>
    </Graphics64bitWrapper>
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
      await loadGame(sorted[0].id)
      return
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

    // Default to travel screen (handles traveling, town, river, event, complete, game_over)
    return <TravelScreen />
  }

  // Hide save panel during cinematic/non-interactive phases
  const showSavePanel = state.phase !== 'chapter_intro'

  return (
    <>
      {renderPhaseContent()}
      <SaveLoadIntegration />
      {showSavePanel && <AuthSavePanel />}
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
