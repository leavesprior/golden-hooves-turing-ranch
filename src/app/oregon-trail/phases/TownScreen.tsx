'use client'

import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react'
import { useOregonTrail, LANDMARKS, hasCynthiasInn } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import { useCharacter } from '../characterContext'
import { useNarrator } from '../narratorContext'
import { useChapter } from '../chapterContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import { NarratorOverlay } from '../components/NarratorOverlay'
import { TownShop } from '../components/TownShop'
import { TownInn } from '../components/TownInn'
import { ResearchStation, type TrailLandmarkInfo } from '../components/ResearchStation'
import { DiscountReward, DiscountProgressBar } from '../components/DiscountReward'
import { ReputationBar } from '../components/ReputationBar'
import { getGoldCountryLocation } from '../data/goldCountryLocations'
import { rollHistoricalEncounter, type HistoricalCharacterEvent, type HistoricalCharacterChoice } from '../data/historicalCharacters'
import { LandmarkScene, type LandmarkType } from '../components/LandmarkScene'
import { getTimeOfDay, type WeatherType } from '../components/Graphics64bit'
import { getPuzzlesForLandmark, type TownPuzzle as TownPuzzleData } from '../data/townPuzzles'
import { SpecialtyShop } from '../components/SpecialtyShop'
import { GuideHire } from '../components/GuideHire'
import { getAvailableShops, getAvailableGuides, type SpecialtyShop as SpecialtyShopData, type HireableGuide } from '../data/specialtyShops'
import { PossePanel } from '../components/PossePanel'
import { CharacterSheet } from '../components/CharacterSheet'
import { type ActiveEffect } from '../data/consumableEffects'
import { CampMenu } from '../components/CampMenu'
import { PipBoyMenu } from '../components/GameMenu'
import { CrossGameStorage } from '@/lib/crossGameProgression'

// Lazy-loaded components
const TownPuzzle = lazy(() => import('../components/TownPuzzle'))
const NPCRelationshipPanel = lazy(() =>
  import('../components/NPCRelationshipPanel').then(m => ({ default: m.NPCRelationshipPanel }))
)
const PosseRecruitment = lazy(() => import('../components/PosseRecruitment').then(m => ({ default: m.PosseRecruitment })))

export interface TownScreenProps {
  activeEffects: ActiveEffect[]
  onUseConsumable: (itemId: string) => void
  onApplyMedicine: (memberId: string) => void
  onRepairWagon: () => void
  hiredGuide: HireableGuide | null
  guideRemainingLandmarks: number
  onHireGuide: (guide: HireableGuide) => void
  solvedPuzzles: string[]
  onPuzzleSolved: (puzzleId: string) => void
  visitedHistoricalIds: string[]
  onHistoricalVisited: (id: string) => void
}

export function TownScreen({
  activeEffects,
  onUseConsumable,
  onApplyMedicine,
  onRepairWagon,
  hiredGuide,
  guideRemainingLandmarks,
  onHireGuide,
  solvedPuzzles,
  onPuzzleSolved,
  visitedHistoricalIds,
  onHistoricalVisited,
}: TownScreenProps) {
  const { state, hunt, leaveTown, openInvestigation, openDossier, openTelegraph, openJournal, openWorldMap, openRanchManagement, getAllNPCRelationships } = useOregonTrail()
  const { earnNeutral } = useKarmaWallet()
  const { state: mysteryState, getCluesForLocation, getCorrectClueCount, getActiveCase } = useMystery()
  const { getStat } = useCharacter()
  const { comment } = useNarrator()
  const { progress: chapterProgress } = useChapter()

  // Local modal states
  const [showShop, setShowShop] = useState(false)
  const [showInn, setShowInn] = useState(false)
  const [showResearch, setShowResearch] = useState(false)
  const [showDiscountReward, setShowDiscountReward] = useState(false)
  const [showNPCPanel, setShowNPCPanel] = useState(false)
  const [showPuzzle, setShowPuzzle] = useState<TownPuzzleData | null>(null)
  const [showSpecialtyShop, setShowSpecialtyShop] = useState<SpecialtyShopData | null>(null)
  const [showGuideHire, setShowGuideHire] = useState(false)
  const [showPosseRecruitment, setShowPosseRecruitment] = useState(false)
  const [showCampMenu, setShowCampMenu] = useState(false)
  const [showPipBoy, setShowPipBoy] = useState(false)
  const [showCharacterSheet, setShowCharacterSheet] = useState(false)

  // Historical character encounters
  const [historicalEncounter, setHistoricalEncounter] = useState<HistoricalCharacterEvent | null>(null)
  const [historicalOutcome, setHistoricalOutcome] = useState<string | null>(null)

  // Computed location data
  const activeCaseData = getActiveCase()
  const currentLocationId = state.currentLandmark.toLowerCase().replace(/[^a-z]/g, '_')
  const currentGoldCountryLocation = getGoldCountryLocation(currentLocationId)
  const currentLocationClues = getCluesForLocation(currentLocationId)
  const hasResearchAvailable = currentLocationClues.length > 0

  // Roll for historical encounter when arriving at a town
  const currentHistoricalChar = React.useMemo(() => {
    return rollHistoricalEncounter(state.currentLandmark, visitedHistoricalIds)
  }, [state.currentLandmark, visitedHistoricalIds])

  const handleHistoricalChoice = useCallback((choice: HistoricalCharacterChoice) => {
    const outcome = choice.outcome
    setHistoricalOutcome(outcome.message)

    if (historicalEncounter) {
      onHistoricalVisited(historicalEncounter.id)
    }

    // Apply effects through narrator
    if (outcome.moraleDelta) {
      comment(`${outcome.moraleDelta > 0 ? 'Spirits lifted.' : 'A somber moment.'}`, 'observation')
    }
  }, [historicalEncounter, comment, onHistoricalVisited])

  // Check if current location has Cynthia's Inn
  const isWestPoint = hasCynthiasInn(state.currentLandmark)

  // Specialty shops and guides at current location
  const earlyLandmarkData = LANDMARKS.find(l => l.name === state.currentLandmark)
  const earlyLandmarkType = earlyLandmarkData?.type || 'town'

  // Build trail landmark info for ResearchStation
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
    onHireGuide(guide)
    setShowGuideHire(false)
  }, [onHireGuide])

  // Log landmark arrival events for cross-game narrator
  const lastLoggedLandmarkRef = useRef('')
  useEffect(() => {
    if (state.currentLandmark && state.currentLandmark !== lastLoggedLandmarkRef.current) {
      lastLoggedLandmarkRef.current = state.currentLandmark
      CrossGameStorage.logEvent(
        'prospectors_tale', 'landmark_reached',
        `Arrived at ${state.currentLandmark}`,
        { locationId: state.currentLandmark.toLowerCase().replace(/[^a-z]/g, '_'), detail: `Day ${state.day}` }
      )
    }
  }, [state.currentLandmark, state.day])

  // Landmark type and gradients
  const currentLandmarkData = LANDMARKS.find(l => l.name === state.currentLandmark)
  const landmarkType: LandmarkType = (currentLandmarkData?.type as LandmarkType) || 'town'

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

  // Scene weather and time
  const gameHour = (state.day % 1) * 24 || 12
  const timeOfDay = getTimeOfDay(gameHour)
  const sceneWeather: WeatherType = state.weather === 'snow' ? 'snow' :
                                    state.weather === 'rain' ? 'rain' :
                                    state.weather === 'storm' ? 'rain' : 'clear'

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

        {/* Active Buffs Strip — visible countdown for timed effects */}
        {activeEffects.length > 0 && (
          <div className="mb-3 p-2 bg-stone-900/80 border border-purple-700/50 rounded-lg">
            <div className="text-[10px] text-purple-400 font-pixel mb-1 uppercase tracking-wider">Active Effects</div>
            <div className="flex flex-wrap gap-1.5">
              {activeEffects.map((effect) => {
                const isBuff = effect.type === 'stat_buff' || effect.type === 'heal_over_time' || effect.type === 'resistance'
                return (
                  <div
                    key={effect.id}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                      isBuff
                        ? 'bg-green-900/50 border-green-700/60 text-green-300'
                        : 'bg-red-900/50 border-red-700/60 text-red-300'
                    }`}
                    title={`${effect.sourceName}: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.stat ? ` ${effect.stat}` : ''}`}
                  >
                    <span className="font-bold">{effect.sourceName.split(' ')[0]}</span>
                    <span className="opacity-80">{effect.value > 0 ? '+' : ''}{effect.value}{effect.stat ? ` ${effect.stat.slice(0, 3)}` : ''}</span>
                    {effect.stackCount > 1 && (
                      <span className="bg-amber-700 text-amber-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px]">
                        x{effect.stackCount}
                      </span>
                    )}
                    <span className={`font-mono ${effect.remainingTurns <= 1 ? 'text-red-400 animate-pulse' : 'opacity-60'}`}>
                      {effect.remainingTurns}d
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
      {showInn && <TownInn onClose={() => setShowInn(false)} isWestPoint={isWestPoint} onApplyBuff={onUseConsumable} />}

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
                onPuzzleSolved(puzzleId)
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
          onUseConsumable={onUseConsumable}
          onApplyMedicine={onApplyMedicine}
          onRepairWagon={onRepairWagon}
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
