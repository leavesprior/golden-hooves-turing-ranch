'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { OregonTrailProvider, useOregonTrail, type GamePhase } from './oregonTrailContext'
import { KarmaToastContainer } from '@/components/karma'

// Karma Wallet (Neoma Blockchain Integration)
import { KarmaWalletProvider, useKarmaWallet } from './karmaWalletContext'
import { KarmaWallet, KarmaPrice, WalletModeSelector } from './components/KarmaWallet'
import { KarmaConvertModal } from './components/KarmaConvertModal'

// Mystery/RPG Context Providers
import { CharacterProvider, useCharacter, BACKGROUND_DESCRIPTIONS, type StatName, type CharacterBackground } from './characterContext'
import { ReputationProvider, useReputation } from './reputationContext'
import { NarratorProvider, useNarrator } from './narratorContext'
import { MysteryProvider, useMystery } from './mysteryContext'

// UI Components
import { DossierView } from './components/DossierView'
import { TelegraphOffice } from './components/TelegraphOffice'
import { WitnessDialogue } from './components/WitnessDialogue'
import { ClueJournal } from './components/ClueJournal'
import { ReputationBar } from './components/ReputationBar'
import { NarratorOverlay, ReliabilityIndicator } from './components/NarratorOverlay'
import { TownShop } from './components/TownShop'
import { TownInn } from './components/TownInn'
import { ResearchStation } from './components/ResearchStation'
import { DiscountReward, DiscountProgressBar } from './components/DiscountReward'
import { type WitnessType } from './data/clueTemplates'
import { hasCynthiasInn } from './oregonTrailContext'
import { getGoldCountryLocation } from './data/goldCountryLocations'

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
import { RanchManagement } from './components/RanchManagement'

// Settlement System (Gold Country Endgame)
import { SettlementProvider, useSettlement } from './settlementContext'
import { SettlementHub } from './components/SettlementHub'
import { SettlementVictory } from './components/SettlementVictory'

// Title Screen and Chapter System
import { TitleScreen } from './components/TitleScreen'
import { ChapterIntro, CHAPTERS } from './components/ChapterIntro'

// Travel Observations - Hitchhiker's Guide Style Commentary
import { TravelObservations } from './components/TravelObservations'
import { type WeatherMood } from './data/travelObservations'

// NPC Context for Ollama-powered dialogue
import { NPCProvider } from './npcContext'

function GameMenu() {
  const { state, startGame } = useOregonTrail()
  const [leaderName, setLeaderName] = useState('')
  const [partyNames, setPartyNames] = useState(['', '', ''])

  const handleStart = () => {
    if (!leaderName.trim()) return
    const validPartyNames = partyNames.filter(n => n.trim())
    startGame(leaderName.trim(), validPartyNames)
  }

  const updatePartyName = (index: number, value: string) => {
    setPartyNames(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-amber-950 flex items-center justify-center p-4">
      <KarmaToastContainer />

      <div className="max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤠</div>
          <h1 className="font-pixel text-amber-200 text-2xl mb-2">Where in Gold Country</h1>
          <h2 className="font-pixel text-red-400 text-xl mb-2">is Black Bart?</h2>
          <p className="text-amber-400 text-sm">A Pinkerton Mystery</p>
          <p className="text-amber-600 text-xs mt-2 italic">
            Oregon Trail × Carmen Sandiego × Fallout
          </p>
        </div>

        {/* Start form */}
        <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-6">
          <h2 className="font-pixel text-amber-200 text-sm mb-4 text-center">
            Begin Your Journey
          </h2>

          {/* Leader name */}
          <div className="mb-4">
            <label className="block text-amber-400 text-xs mb-1 font-pixel">
              Wagon Leader Name:
            </label>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-amber-950 border-2 border-amber-600 rounded text-amber-100 font-pixel text-sm placeholder-amber-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Party members */}
          <div className="mb-6">
            <label className="block text-amber-400 text-xs mb-2 font-pixel">
              Party Members (optional):
            </label>
            <div className="space-y-2">
              {partyNames.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  value={name}
                  onChange={(e) => updatePartyName(index, e.target.value)}
                  placeholder={`Party member ${index + 1}`}
                  className="w-full px-3 py-2 bg-amber-950 border-2 border-amber-700 rounded text-amber-100 font-pixel text-xs placeholder-amber-700 focus:outline-none focus:border-amber-500"
                />
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!leaderName.trim()}
            className={`
              w-full py-3 font-pixel text-sm rounded border-4 transition-all
              ${leaderName.trim()
                ? 'bg-green-700 border-green-500 text-green-100 hover:bg-green-600'
                : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'}
            `}
          >
            Start Journey
          </button>
        </div>

        {/* Game info */}
        <div className="mt-6 text-center">
          <p className="text-amber-500 text-xs mb-4">
            You're a Pinkerton agent pursuing the notorious Black Bart gang
            across 2,000 miles of frontier. Gather clues, interview witnesses,
            and issue warrants. But beware - your narrator may not be reliable...
          </p>
          <Link
            href="/hub"
            className="text-amber-400 hover:text-amber-200 text-xs font-pixel transition-colors"
          >
            &larr; Back to Hub
          </Link>
        </div>
      </div>
    </div>
  )
}

// Character Creation Screen (S.A.D.D.L.E. Stats)
function CharacterCreationScreen() {
  const { state: trailState, beginJourney } = useOregonTrail()
  const { state: charState, createCharacter, modifyStat, getStat } = useCharacter()
  const { comment } = useNarrator()

  // Dice roll state
  const [hasRolled, setHasRolled] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [baseStats, setBaseStats] = useState({
    Shrewdness: 3,
    Agility: 3,
    Durability: 3,
    Diplomacy: 3,
    Luck: 3,
    Expertise: 3,
  })
  const [lastRolls, setLastRolls] = useState<Record<string, number[]>>({})
  const [isRolling, setIsRolling] = useState(false)

  // Local state for character creation
  const [selectedBackground, setSelectedBackground] = useState<CharacterBackground | null>(null)
  const [statPoints, setStatPoints] = useState({
    Shrewdness: 3,
    Agility: 3,
    Durability: 3,
    Diplomacy: 3,
    Luck: 3,
    Expertise: 3,
  })
  const [pointsRemaining, setPointsRemaining] = useState(12)

  // Roll 3d6 for each stat (like classic D&D)
  const rollDice = () => {
    setIsRolling(true)
    setRollCount(prev => prev + 1)

    // Animate the roll
    let iterations = 0
    const maxIterations = 10
    const interval = setInterval(() => {
      const tempStats: Record<string, number> = {}
      const tempRolls: Record<string, number[]> = {}

      const statNames = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']
      statNames.forEach(stat => {
        const dice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]
        tempRolls[stat] = dice
        tempStats[stat] = dice.reduce((a, b) => a + b, 0)
      })

      setLastRolls(tempRolls)
      setBaseStats(tempStats as typeof baseStats)

      iterations++
      if (iterations >= maxIterations) {
        clearInterval(interval)
        setIsRolling(false)
        setHasRolled(true)

        // Reset bonus points to 0 (base stats from roll are the foundation)
        setStatPoints(tempStats as typeof statPoints)
        setPointsRemaining(6) // Fewer bonus points when rolling (6 instead of 12)
      }
    }, 80)
  }

  // Calculate total stat value
  const getTotalStats = () => {
    return Object.values(statPoints).reduce((a, b) => a + b, 0)
  }

  // Convert BACKGROUND_DESCRIPTIONS to array format
  const backgrounds = Object.entries(BACKGROUND_DESCRIPTIONS).map(([id, data]) => ({
    id: id as CharacterBackground,
    ...data,
    icon: id === 'pinkerton_veteran' ? '\u{1F575}' :
          id === 'frontier_scout' ? '\u{1F3AF}' :
          id === 'army_officer' ? '\u2694\uFE0F' :
          id === 'gambler' ? '\u{1F0CF}' :
          id === 'doctor' ? '\u2695\uFE0F' :
          id === 'preacher' ? '\u271D\uFE0F' :
          id === 'outlaw_reformed' ? '\u{1F3AD}' : '\u{1F464}'
  }))

  const adjustStat = (stat: StatName, delta: number) => {
    const currentValue = statPoints[stat]
    const minValue = hasRolled ? baseStats[stat] : 1
    const maxValue = 18  // Max stat value (like D&D)
    const newValue = currentValue + delta

    if (newValue < minValue || newValue > maxValue) return
    if (delta > 0 && pointsRemaining <= 0) return
    if (delta < 0 && currentValue <= minValue) return

    setStatPoints(prev => ({ ...prev, [stat]: newValue }))
    setPointsRemaining(prev => prev - delta)
  }

  const handleFinalize = () => {
    if (pointsRemaining !== 0 || !selectedBackground) return

    // Create the character with the selected background
    const leaderName = trailState.party.find(m => m.id === 'leader')?.name || 'Agent'
    createCharacter(leaderName, selectedBackground)

    // Apply stat adjustments
    // - Standard allocation: diff from base 3 (UI display value)
    // - Rolled stats: diff from BASE_STATS (5) since we're replacing the base entirely
    Object.entries(statPoints).forEach(([stat, value]) => {
      const base = hasRolled ? 5 : 3  // BASE_STATS is 5, UI default is 3
      const diff = value - base
      if (diff !== 0) {
        modifyStat(stat as StatName, diff)
      }
    })

    if (hasRolled && getTotalStats() >= 70) {
      comment("The dice favor the bold. Or perhaps just the persistent.", 'observation')
    } else if (hasRolled) {
      comment("The frontier accepts all rolls. Some just have to work harder.", 'observation')
    } else {
      comment("Another hero setting off to bring justice to the frontier. How... optimistic.", 'observation')
    }
    beginJourney()
  }

  const statDescriptions: Record<StatName, string> = {
    Shrewdness: 'Deduction, clue interpretation',
    Agility: 'Speed, hunting, river crossings',
    Durability: 'Health, disease resistance',
    Diplomacy: 'NPC interactions, fair trades',
    Luck: 'Random events, gold finding',
    Expertise: 'Tracking, survival, repair',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-gray-900 to-amber-950 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-2xl mx-auto pt-8">
        <header className="text-center mb-8">
          <h1 className="font-pixel text-purple-300 text-xl mb-2">Create Your Agent</h1>
          <p className="text-purple-400 text-sm">Distribute your S.A.D.D.L.E. stats</p>
        </header>

        {/* Background Selection */}
        <div className="bg-gray-900/80 border-2 border-purple-600 rounded-lg p-4 mb-6">
          <h2 className="font-pixel text-purple-300 text-sm mb-4">Choose Background</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {backgrounds.map(bg => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-4 md:p-3 rounded border-2 text-left transition-all active:scale-[0.98] ${
                  selectedBackground === bg.id
                    ? 'bg-purple-900/60 border-purple-400 text-purple-200'
                    : 'bg-gray-800/60 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl md:text-lg mr-2">{bg.icon}</span>
                <span className="font-pixel text-sm md:text-xs">{bg.name}</span>
                <p className="text-xs md:text-[10px] mt-1 opacity-70">{bg.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dice Roll Section */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-pixel text-amber-300 text-sm">🎲 Roll for Stats</h2>
            {hasRolled && (
              <span className="text-amber-400 text-xs">
                Total: {getTotalStats()} | Rolls: {rollCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={rollDice}
              disabled={isRolling}
              className={`flex-1 py-4 md:py-2 font-pixel text-base md:text-sm rounded border-2 transition-all active:scale-[0.98] ${
                isRolling
                  ? 'bg-amber-800 border-amber-600 text-amber-300 animate-pulse'
                  : 'bg-amber-700 border-amber-500 text-amber-100 hover:bg-amber-600'
              }`}
            >
              {isRolling ? '🎲 Rolling...' : hasRolled ? '🎲 Reroll Stats (3d6)' : '🎲 Roll Stats (3d6 each)'}
            </button>
            {!hasRolled && (
              <div className="text-amber-500 text-xs">
                or use standard allocation →
              </div>
            )}
          </div>

          {/* Show dice results */}
          {hasRolled && Object.keys(lastRolls).length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as StatName[]).map(stat => {
                const dice = lastRolls[stat] || [0, 0, 0]
                const total = dice.reduce((a, b) => a + b, 0)
                const isGoodRoll = total >= 12
                const isBadRoll = total <= 8

                return (
                  <div key={stat} className={`flex items-center gap-2 px-2 py-1 rounded ${
                    isGoodRoll ? 'bg-green-900/40' : isBadRoll ? 'bg-red-900/40' : 'bg-gray-800/40'
                  }`}>
                    <span className="text-purple-300 w-8">{stat.charAt(0)}.</span>
                    <span className="text-gray-400">
                      [{dice.map((d, i) => (
                        <span key={i} className={d === 6 ? 'text-green-400' : d === 1 ? 'text-red-400' : ''}>
                          {d}{i < 2 ? '+' : ''}
                        </span>
                      ))}]
                    </span>
                    <span className={`font-pixel ml-auto ${
                      isGoodRoll ? 'text-green-400' : isBadRoll ? 'text-red-400' : 'text-amber-300'
                    }`}>
                      = {total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {!hasRolled && (
            <p className="text-gray-500 text-xs text-center">
              Standard: 3 base + 12 bonus points | Rolled: 3d6 base + 6 bonus points
            </p>
          )}
        </div>

        {/* Stat Distribution */}
        <div className="bg-gray-900/80 border-2 border-purple-600 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-pixel text-purple-300 text-sm">S.A.D.D.L.E. Stats</h2>
            <span className={`font-pixel text-sm ${pointsRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Bonus Points: {pointsRemaining}
            </span>
          </div>

          <div className="space-y-3">
            {(['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as StatName[]).map(stat => {
              const value = statPoints[stat]
              const baseValue = hasRolled ? baseStats[stat] : 3

              return (
                <div key={stat} className="flex items-center gap-2 md:gap-3">
                  <div className="w-20 md:w-24">
                    <span className="text-purple-200 text-sm md:text-xs font-pixel">{stat.charAt(0)}</span>
                    <span className="text-gray-400 text-sm md:text-xs">. {stat.slice(1)}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => adjustStat(stat, -1)}
                      disabled={value <= baseValue}
                      className="w-11 h-11 md:w-6 md:h-6 text-lg md:text-base bg-purple-800 text-purple-200 rounded disabled:opacity-30 active:bg-purple-600"
                    >-</button>
                    <div className="flex-1 h-3 md:h-2 bg-gray-700 rounded overflow-hidden relative">
                      {/* Base value indicator */}
                      {hasRolled && (
                        <div
                          className="absolute h-full bg-amber-700/50"
                          style={{ width: `${(baseValue / 18) * 100}%` }}
                        />
                      )}
                      <div
                        className="h-full bg-purple-500 transition-all relative"
                        style={{ width: `${(value / 18) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-center text-purple-200 text-base md:text-sm font-pixel">{value}</span>
                    <button
                      onClick={() => adjustStat(stat, 1)}
                      disabled={value >= 18 || pointsRemaining <= 0}
                      className="w-11 h-11 md:w-6 md:h-6 text-lg md:text-base bg-purple-800 text-purple-200 rounded disabled:opacity-30 active:bg-purple-600"
                    >+</button>
                  </div>
                  <span className="w-32 text-gray-500 text-[10px] hidden md:block">{statDescriptions[stat]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleFinalize}
          disabled={pointsRemaining !== 0 || !selectedBackground}
          className="w-full py-4 md:py-3 bg-purple-700 hover:bg-purple-600 text-purple-100 font-pixel text-base md:text-sm rounded border-4 border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
        >
          {!selectedBackground ? 'Select a background' : pointsRemaining > 0 ? `Assign ${pointsRemaining} more points` : 'Begin the Hunt'}
        </button>
      </div>
    </div>
  )
}

// Investigation Screen
function InvestigationScreen() {
  const { state, closeInvestigation, openWitnessDialogue, openDossier, openTelegraph, openJournal, investigateLocation } = useOregonTrail()
  const { state: mysteryState, generateCrimeAtLocation } = useMystery()
  const { comment, recordPlayerAction } = useNarrator()
  const { getReputation } = useReputation()

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  // Available investigation locations based on landmark type
  const investigationLocations = [
    { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender', 'drunk', 'traveler'] },
    { id: 'stable', name: 'Stable', icon: '🐴', witnesses: ['stable_hand'] },
    { id: 'general_store', name: 'General Store', icon: '🏪', witnesses: ['shopkeeper'] },
    { id: 'telegraph', name: 'Telegraph Office', icon: '⚡', witnesses: ['telegraph_operator'] },
    { id: 'church', name: 'Church', icon: '⛪', witnesses: ['preacher'] },
    { id: 'street', name: 'Street', icon: '🛤️', witnesses: ['settler', 'child', 'traveler'] },
  ]

  const hoursRemaining = state.investigation.maxInvestigationHours - state.investigation.hoursInvestigated

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-amber-950 to-gray-900 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-2xl mx-auto pt-8">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">Investigation</h1>
            <p className="text-amber-400 text-sm">{state.currentLandmark}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs ${hoursRemaining <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
              ⏰ {hoursRemaining}h remaining
            </div>
            <ReliabilityIndicator compact />
          </div>
        </header>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
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
          <button
            onClick={openTelegraph}
            className="px-3 py-1 bg-amber-800/60 text-amber-200 rounded text-xs hover:bg-amber-700/60"
          >
            📨 Telegraph
          </button>
        </div>

        {/* Investigation Locations */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {investigationLocations.map(loc => {
            // Count how many witnesses at this location have been interviewed
            const interviewedCount = loc.witnesses.filter(w =>
              state.investigation.witnessesInterviewed.includes(w)
            ).length
            const allInterviewed = interviewedCount === loc.witnesses.length
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  allInterviewed
                    ? 'bg-green-900/40 border-green-700'
                    : selectedLocation === loc.id
                    ? 'bg-amber-900/60 border-amber-400'
                    : 'bg-gray-800/60 border-gray-600 hover:border-amber-600'
                }`}
              >
                <span className="text-2xl">{loc.icon}</span>
                <p className="text-amber-200 text-sm mt-1">{loc.name}</p>
                {interviewedCount > 0 && (
                  <span className={`text-xs ${allInterviewed ? 'text-green-400' : 'text-amber-400'}`}>
                    {interviewedCount}/{loc.witnesses.length} interviewed
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Location Details */}
        {selectedLocation && (
          <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
            <h3 className="text-amber-200 font-pixel text-sm mb-3">
              {investigationLocations.find(l => l.id === selectedLocation)?.name}
            </h3>
            <p className="text-gray-400 text-xs mb-4">Available witnesses to interview:</p>
            <div className="flex flex-wrap gap-2">
              {investigationLocations
                .find(l => l.id === selectedLocation)
                ?.witnesses.map(witness => {
                  const interviewed = state.investigation.witnessesInterviewed.includes(witness)
                  return (
                    <button
                      key={witness}
                      onClick={() => {
                        if (!interviewed) {
                          // Don't mark location as searched - just interview the witness
                          // Time is spent when dialogue closes (in closeWitnessDialogue)
                          openWitnessDialogue(witness)
                          recordPlayerAction(`interview_${witness}`)
                        }
                      }}
                      disabled={interviewed}
                      className={`px-3 py-2 rounded text-sm ${
                        interviewed
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-amber-800 text-amber-200 hover:bg-amber-700'
                      }`}
                    >
                      {witness.replace(/_/g, ' ')}
                      {interviewed && ' ✓'}
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {/* Leave Investigation */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              comment("Leaving already? The trail grows colder by the hour...", 'warning')
              closeInvestigation()
            }}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-sm rounded border-2 border-gray-500"
          >
            Return to Town
          </button>
        </div>
      </div>
    </div>
  )
}

function OutfittingScreen() {
  const { state, purchaseSupplies, goToCharacterCreation } = useOregonTrail()
  const { balance, canAfford, spendNeutral, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()
  const [supplies, setSupplies] = useState({
    food: 0,
    ammo: 0,
    parts: 0,
    medicine: 0,
    oxen: 0,
  })

  const prices = {
    food: 0.2,
    ammo: 2,
    parts: 10,
    medicine: 5,
    oxen: 40,
  }

  const totalCost =
    supplies.food * prices.food +
    supplies.ammo * prices.ammo +
    supplies.parts * prices.parts +
    supplies.medicine * prices.medicine +
    supplies.oxen * prices.oxen

  const handlePurchase = async () => {
    const totalKarmaCost = Math.ceil(totalCost) // Round up to whole karma

    // Check if we can afford it
    if (!canAfford('neutral', totalKarmaCost)) {
      // Show convert modal to get more karma
      setConvertModalContext({ needed: totalKarmaCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }

    // Spend the karma
    const success = await spendNeutral(totalKarmaCost, 'Matt\'s General Store - Outfitting')
    if (success) {
      purchaseSupplies(supplies)
      setSupplies({ food: 0, ammo: 0, parts: 0, medicine: 0, oxen: 0 })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 p-4">
      <KarmaToastContainer />

      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="font-pixel text-amber-200 text-xl mb-2">Matt's General Store</h1>
          <p className="text-amber-400 text-sm">Independence, Missouri</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Store */}
          <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-4">
            <h2 className="font-pixel text-amber-200 text-sm mb-4 border-b border-amber-600 pb-2">
              Purchase Supplies
            </h2>

            <div className="space-y-4">
              {/* Food */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Food (lbs)</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.food.toFixed(2)}/lb</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, food: Math.max(0, s.food - 50) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.food}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, food: s.food + 50 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Ammo */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Ammo (boxes)</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.ammo}/box</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, ammo: Math.max(0, s.ammo - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.ammo}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, ammo: s.ammo + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Spare Parts */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Spare Parts</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.parts}/ea</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, parts: Math.max(0, s.parts - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.parts}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, parts: s.parts + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Medicine */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Medicine</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.medicine}/unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, medicine: Math.max(0, s.medicine - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.medicine}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, medicine: s.medicine + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>

              {/* Oxen */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-200 text-xs font-pixel">Oxen</span>
                  <span className="text-amber-500 text-[10px] ml-2">${prices.oxen}/ea</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSupplies(s => ({ ...s, oxen: Math.max(0, s.oxen - 1) }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >-</button>
                  <span className="text-amber-100 font-pixel text-sm w-12 text-center">{supplies.oxen}</span>
                  <button
                    onClick={() => setSupplies(s => ({ ...s, oxen: s.oxen + 1 }))}
                    className="w-6 h-6 bg-amber-700 text-amber-200 rounded"
                  >+</button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-600">
              <div className="flex justify-between items-center mb-4">
                <span className="text-amber-400 text-xs font-pixel">Total Cost:</span>
                <span className={`font-pixel text-sm ${!canAfford('neutral', Math.ceil(totalCost)) ? 'text-red-400' : 'text-amber-200'}`}>
                  {Math.ceil(totalCost)}🪙
                </span>
              </div>
              <button
                onClick={handlePurchase}
                disabled={totalCost === 0}
                className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-xs rounded border-2 border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canAfford('neutral', Math.ceil(totalCost)) ? 'Purchase' : 'Get More Karma & Purchase'}
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-4">
            <h2 className="font-pixel text-amber-200 text-sm mb-4 border-b border-amber-600 pb-2">
              Your Wagon
            </h2>

            <div className="space-y-3 text-xs">
              {/* Karma Balance Display */}
              <div className="mb-3 pb-2 border-b border-amber-600">
                <KarmaWallet compact showBadKarma={false} />
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Food:</span>
                <span className="text-amber-200 font-pixel">{state.food} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Ammunition:</span>
                <span className="text-amber-200 font-pixel">{state.ammunition} rounds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Spare Parts:</span>
                <span className="text-amber-200 font-pixel">{state.spareParts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Medicine:</span>
                <span className="text-amber-200 font-pixel">{state.medicine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Oxen:</span>
                <span className="text-amber-200 font-pixel">{state.oxen}</span>
              </div>
            </div>

            {/* Party */}
            <div className="mt-4 pt-4 border-t border-amber-600">
              <h3 className="text-amber-400 text-xs mb-2">Party ({state.party.length} members):</h3>
              <ul className="space-y-1">
                {state.party.map(member => (
                  <li key={member.id} className="text-amber-200 text-xs">
                    {member.name} {member.id === 'leader' && '(Leader)'}
                  </li>
                ))}
              </ul>
            </div>

            {/* Begin Journey - Now goes to character creation first */}
            <button
              onClick={goToCharacterCreation}
              disabled={state.oxen < 2 || state.food < 100}
              className="w-full mt-4 py-3 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-sm rounded border-4 border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Your Agent
            </button>
            {(state.oxen < 2 || state.food < 100) && (
              <p className="text-red-400 text-[10px] mt-2 text-center">
                Need at least 2 oxen and 100 lbs of food
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Karma Convert Modal */}
      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false)
            setConvertModalContext(null)
          }}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType === 'good' ? 'good' : 'neutral'}
          onSuccess={() => {
            // Re-trigger purchase after successful conversion
            handlePurchase()
          }}
        />
      )}
    </div>
  )
}

function TravelScreen() {
  const { state, travel, setPace, setRations, hunt, handleEventChoice, crossRiver, leaveTown, resetGame, openInvestigation, openDossier, openTelegraph, openJournal, openWorldMap, openRanchManagement } = useOregonTrail()
  const { balance, canAfford, spendNeutral, earnNeutral, earnGood, addBadKarma } = useKarmaWallet()
  const { state: mysteryState } = useMystery()
  const { getStat } = useCharacter()
  const { comment } = useNarrator()

  // Panning result state for showing roll results
  const [panningResult, setPanningResult] = useState<{
    roll: number
    luckBonus: number
    total: number
    reward: number
    message: string
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
        message = `JACKPOT! Natural 20! You strike a rich vein! (+${reward}🪙)`
        comment("The narrator has witnessed many fortunes found and lost. This one sparkles with promise.", 'observation')
      } else if (total >= 18) {
        // Excellent find
        reward = 60 + Math.floor(Math.random() * 30)
        message = `Excellent! You find several quality nuggets! (+${reward}🪙)`
      } else if (total >= 12) {
        // Decent find
        reward = 25 + Math.floor(Math.random() * 20)
        message = `Not bad! You find some flakes and a small nugget. (+${reward}🪙)`
      } else if (total >= 6) {
        // Poor find
        reward = 5 + Math.floor(Math.random() * 10)
        message = `Slim pickings. Just a few flakes of color. (+${reward}🪙)`
      } else {
        // Nothing
        reward = 0
        message = roll === 1
          ? `Critical fail! You slip and soak yourself. Nothing found.`
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

    // Standard event handling
    handleEventChoice(choiceId)

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

  // Get Gold Country mystery context
  const { getCluesForLocation, getCorrectClueCount, getActiveCase } = useMystery()
  const activeCaseData = getActiveCase()

  // Get current location info for Gold Country research
  const currentGoldCountryLocation = getGoldCountryLocation(state.currentLandmark.toLowerCase().replace(/[^a-z]/g, '_'))
  const currentLocationClues = getCluesForLocation(state.currentLandmark.toLowerCase().replace(/[^a-z]/g, '_'))
  const hasResearchAvailable = currentGoldCountryLocation && currentLocationClues.length > 0

  // Check if current location has Cynthia's Inn
  const isWestPoint = hasCynthiasInn(state.currentLandmark)

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
          <div className="text-6xl mb-4">\u2620\ufe0f</div>
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
          <div className="text-6xl mb-4">\ud83c\udfc6</div>
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

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
        <KarmaToastContainer />
        <div className="max-w-md w-full bg-amber-900/80 border-4 border-amber-600 rounded-lg p-6">
          <h2 className="font-pixel text-amber-200 text-lg mb-4 text-center">
            {state.currentEvent.title}
          </h2>
          <p className="text-amber-300 text-sm mb-6 text-center">
            {state.currentEvent.description}
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
            {state.currentEvent.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => handleEventChoiceWithKarma(choice.id)}
                className="w-full p-3 bg-amber-800/60 hover:bg-amber-700/60 border-2 border-amber-600 rounded text-amber-200 font-pixel text-xs text-left transition-colors"
              >
                {choice.text}
                {((choice.karmaLawful !== undefined && choice.karmaLawful !== 0) || (choice.karmaGood !== undefined && choice.karmaGood !== 0)) && (
                  <span className="block mt-1 text-[10px] text-amber-500">
                    {choice.karmaLawful !== undefined && choice.karmaLawful !== 0 && (choice.karmaLawful < 0 ? '\u2696 Lawful' : '\ud83c\udf00 Chaotic')}
                    {choice.karmaGood !== undefined && choice.karmaGood !== 0 && (choice.karmaGood < 0 ? ' \u2728 Good' : ' \ud83d\udd25 Evil')}
                  </span>
                )}
              </button>
            ))}
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

  // River crossing screen
  if (state.phase === 'river') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-amber-950 flex items-center justify-center p-4">
        <KarmaToastContainer />
        <div className="max-w-md w-full bg-blue-900/80 border-4 border-blue-600 rounded-lg p-6">
          <div className="text-5xl text-center mb-4">\ud83c\udf0a</div>
          <h2 className="font-pixel text-blue-200 text-lg mb-2 text-center">
            River Crossing
          </h2>
          <p className="text-blue-300 text-sm mb-6 text-center">
            {state.currentLandmark}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => crossRiver('ford')}
              className="w-full p-3 bg-red-800/60 hover:bg-red-700/60 border-2 border-red-600 rounded text-red-200 font-pixel text-xs"
            >
              Ford the river (Risky, Free)
              <span className="block text-[10px] text-red-400 mt-1">+Chaotic karma</span>
            </button>
            <button
              onClick={() => crossRiver('caulk')}
              className="w-full p-3 bg-amber-800/60 hover:bg-amber-700/60 border-2 border-amber-600 rounded text-amber-200 font-pixel text-xs"
            >
              Caulk wagon and float (Moderate risk, Free)
            </button>
            <button
              onClick={async () => {
                if (canAfford('neutral', 20)) {
                  await spendNeutral(20, 'Ferry crossing')
                  crossRiver('ferry')
                }
              }}
              disabled={!canAfford('neutral', 20)}
              className="w-full p-3 bg-green-800/60 hover:bg-green-700/60 border-2 border-green-600 rounded text-green-200 font-pixel text-xs disabled:opacity-50"
            >
              Take the ferry (Safe, 20🪙)
            </button>
          </div>
        </div>
      </div>
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
          <div className="flex justify-center gap-2 mb-6">
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
              <h3 className="font-pixel text-amber-200 text-sm mb-3 border-b border-amber-600 pb-2">BOBR Rewards</h3>
              <DiscountProgressBar onShowReward={() => setShowDiscountReward(true)} />
            </div>
          </div>

          {/* Town Actions */}
          <div className={`grid gap-2 mb-6 ${isWestPoint ? 'grid-cols-4 md:grid-cols-8' : 'grid-cols-3 md:grid-cols-7'}`}>
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
            </button>
            <button
              onClick={() => hunt()}
              disabled={state.ammunition < 10}
              className="p-3 bg-green-900/60 hover:bg-green-800/60 border-2 border-green-600 rounded-lg text-center disabled:opacity-50"
            >
              <span className="text-2xl">🦌</span>
              <p className="text-green-200 text-xs mt-1">Hunt</p>
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

        {/* Research Station Modal - Gold Country educational content */}
        {showResearch && currentGoldCountryLocation && currentLocationClues.length > 0 && (
          <ResearchStation
            isOpen={showResearch}
            onClose={() => setShowResearch(false)}
            location={currentGoldCountryLocation}
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
      <div className="min-h-screen p-4" style={{ filter: tierFilter }}>
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

        {/* Actions */}
        <div className="flex gap-4 justify-center">
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
        </div>
      </div>
    </div>
    </Graphics64bitWrapper>
  )
}

// Witness Dialogue Screen
function WitnessScreen() {
  const { state, closeWitnessDialogue } = useOregonTrail()
  const { state: mysteryState, generateClueForWitness, addClue } = useMystery()

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

  const handleWarrantIssued = (success: boolean, bounty: number, message: string) => {
    if (success) {
      setMood('impressed')
      comment("Justice has been served! Though the narrator wonders if it was truly deserved...", 'observation')
      modifyReputation('pinkerton', 15, 'Successful warrant execution', state.currentLandmark)
    } else {
      setMood('amused')
      comment("Wrong suspect! The real outlaw escapes while you arrest an innocent. How embarrassing.", 'observation')
      modifyReputation('pinkerton', -20, 'Wrongful arrest', state.currentLandmark)
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

  return (
    <ClueJournal
      onClose={closeJournal}
      onOpenDossier={openDossier}
      onOpenTelegraph={openTelegraph}
    />
  )
}

// World Map Screen (Fallout-style)
function WorldMapScreen() {
  const { state, setPhase, setCurrentLandmark } = useOregonTrail()
  const {
    progress,
    isTransitioning,
    canAdvanceChapter,
    travelTo,
    advanceChapter,
    isLocationDiscovered,
    checkForEasterEggs,
    markEasterEggFound,
  } = useChapter()
  const { comment } = useNarrator()

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [travelMessage, setTravelMessage] = useState<string | null>(null)
  const [showTwainQuote, setShowTwainQuote] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<{ quote: string; context: string } | null>(null)

  // Check for easter eggs when entering a location
  const handleLocationClick = useCallback((locationId: string) => {
    setSelectedLocation(locationId)

    // Check for easter eggs at this location
    const easterEgg = checkForEasterEggs({ locationId })
    if (easterEgg) {
      markEasterEggFound(easterEgg.id)
      comment(`Secret found: ${easterEgg.title}! ${easterEgg.description}`, 'fourth_wall')
    }
  }, [checkForEasterEggs, markEasterEggFound, comment])

  const handleTravel = useCallback(() => {
    if (!selectedLocation) return

    const result = travelTo(selectedLocation)
    if (result.success) {
      // Show travel message
      setTravelMessage(`Traveled to ${getLocationById(selectedLocation)?.name}. Time spent: ${result.timeSpent} hours.`)

      // Check for random encounter
      if (result.encounter) {
        comment("Something stirs on the trail ahead...", 'warning')
      }

      // Check for new discoveries
      if (result.newDiscoveries.length > 0) {
        const names = result.newDiscoveries.map(id => getLocationById(id)?.name).filter(Boolean)
        comment(`New locations discovered: ${names.join(', ')}`, 'observation')
      }

      // Occasionally show a Twain quote
      if (Math.random() < 0.3) {
        const twainQuote = getRandomTwainQuote()
        setCurrentQuote({ quote: twainQuote.text, context: twainQuote.context })
        setShowTwainQuote(true)
        setTimeout(() => setShowTwainQuote(false), 5000)
      }

      // Clear selection
      setSelectedLocation(null)
      setTimeout(() => setTravelMessage(null), 3000)
    }
  }, [selectedLocation, travelTo, comment])

  const handleEnterLocation = useCallback(() => {
    if (!selectedLocation) return

    const location = getLocationById(selectedLocation)
    if (!location) return

    // Update the main game state with the new location
    setCurrentLandmark(location.name)

    // Transition to town phase
    setPhase('town')
  }, [selectedLocation, setCurrentLandmark, setPhase])

  const selectedLocationData = selectedLocation ? getLocationById(selectedLocation) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950 p-4">
      <KarmaToastContainer />
      <NarratorOverlay position="corner" />

      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">
              {progress.chapter === 'journey_west' ? 'Chapter 1: Journey West' :
               progress.chapter === 'gold_country' ? 'Chapter 2: Gold Country' :
               'Chapter 3: The Long Road Home'}
            </h1>
            <p className="text-amber-400 text-xs">
              Day {state.day} | {progress.totalTravelTime} hours traveled
            </p>
          </div>
          <div className="flex items-center gap-4">
            <KarmaWallet compact />
            {canAdvanceChapter && (
              <button
                onClick={advanceChapter}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-yellow-100 font-pixel text-xs rounded border-2 border-yellow-400 animate-pulse"
              >
                Advance Chapter →
              </button>
            )}
          </div>
        </header>

        {/* World Map */}
        <div className="relative">
          <WorldMap
            chapter={progress.chapter}
            currentLocationId={progress.currentLocationId}
            discoveredLocations={progress.discoveredLocations}
            onLocationClick={handleLocationClick}
            graphicsTier={state.graphicsTier}
          />

          {/* Location Details Panel */}
          {selectedLocationData && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border-2 border-amber-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-pixel text-amber-200 text-lg">{selectedLocationData.name}</h3>
                  <p className="text-amber-400 text-xs capitalize">
                    {selectedLocationData.type} • {selectedLocationData.dangerLevel}
                  </p>
                  <p className="text-slate-300 text-sm mt-2">{selectedLocationData.description}</p>

                  {/* Lore */}
                  {selectedLocationData.lore && (
                    <div className="mt-2 text-xs text-slate-400">
                      <span className="text-amber-500">Est. {selectedLocationData.lore.founded}</span>
                      {selectedLocationData.lore.peakPopulation > 0 && (
                        <span className="ml-2">• Peak pop: {selectedLocationData.lore.peakPopulation.toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  {/* Services */}
                  {selectedLocationData.services.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {selectedLocationData.services.map(service => (
                        <span
                          key={service}
                          className="px-2 py-0.5 bg-amber-900/60 text-amber-300 text-[10px] rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {progress.currentLocationId !== selectedLocation && (
                    <button
                      onClick={handleTravel}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-xs rounded border-2 border-green-500"
                    >
                      Travel Here
                    </button>
                  )}
                  <button
                    onClick={handleEnterLocation}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-xs rounded border-2 border-amber-500"
                  >
                    Enter Town
                  </button>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-pixel text-xs rounded border-2 border-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Travel Message */}
        {travelMessage && (
          <div className="mt-4 p-3 bg-green-900/60 border border-green-600 rounded text-center">
            <p className="text-green-200 text-sm">{travelMessage}</p>
          </div>
        )}

        {/* Twain Quote Popup */}
        {showTwainQuote && currentQuote && (
          <div className="fixed bottom-8 right-8 max-w-sm p-4 bg-amber-900/95 border-2 border-amber-500 rounded-lg shadow-xl animate-fade-in">
            <p className="text-amber-200 text-sm italic">"{currentQuote.quote}"</p>
            <p className="text-amber-500 text-xs mt-2">— Mark Twain, {currentQuote.context}</p>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Locations Discovered</span>
            <span className="text-amber-200 font-pixel">{progress.discoveredLocations.size}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Locations Visited</span>
            <span className="text-amber-200 font-pixel">{progress.visitedLocations.size}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Easter Eggs Found</span>
            <span className="text-amber-200 font-pixel">{progress.easterEggsFound.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded p-2">
            <span className="text-slate-400 text-[10px] block">Outlaws Captured</span>
            <span className="text-amber-200 font-pixel">{progress.outlawsCaptured.length}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => setPhase('traveling')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-pixel text-xs rounded border-2 border-slate-500"
          >
            ← Back to Trail
          </button>
          <Link
            href="/hub"
            className="px-4 py-2 bg-red-900/60 hover:bg-red-800/60 text-red-200 font-pixel text-xs rounded border-2 border-red-600"
          >
            Quit Game
          </Link>
        </div>
      </div>

      {/* Chapter Transition Overlay */}
      {isTransitioning && (
        <ChapterTransition
          isVisible={isTransitioning}
          fromChapter={progress.chapter}
          toChapter={progress.chapter === 'journey_west' ? 'gold_country' : 'return_visit'}
        />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Ranch Management Screen (Lords II-style building)
function RanchManagementScreen() {
  const { closeRanchManagement } = useOregonTrail()

  return (
    <RanchManagement onClose={closeRanchManagement} />
  )
}

// Gold Country Arrival Screen - Choose to settle or continue
function GoldCountryArrivalScreen() {
  const { state, enterSettlement, leaveSettlement, resetGame } = useOregonTrail()
  const { balance } = useKarmaWallet()

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-950 via-amber-900 to-amber-950 flex items-center justify-center p-4">
      <KarmaToastContainer />
      <div className="max-w-lg w-full">
        {/* Welcome Banner */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🏔️</div>
          <h1 className="font-pixel text-yellow-300 text-3xl mb-2">Gold Country!</h1>
          <p className="text-amber-300 text-lg mb-4">You've reached the end of the trail!</p>
          <p className="text-amber-500 text-sm">
            After {state.daysOnTrail} days on the trail, you and your party of{' '}
            {state.party.filter(m => m.health > 0).length} have arrived.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-4 mb-6">
          <h2 className="text-amber-400 font-pixel text-sm mb-3 text-center">Your Resources</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-amber-200 font-pixel text-lg">{balance.neutral}🪙</p>
              <p className="text-gray-500 text-xs">Coins</p>
            </div>
            <div>
              <p className="text-green-200 font-pixel text-lg">{balance.good}🍪</p>
              <p className="text-gray-500 text-xs">Good Karma</p>
            </div>
            <div>
              <p className="text-amber-200 font-pixel text-lg">{state.food}</p>
              <p className="text-gray-500 text-xs">Food (lbs)</p>
            </div>
          </div>
        </div>

        {/* Choice */}
        <div className="bg-gray-900/80 border-2 border-amber-600 rounded-lg p-6 mb-6">
          <p className="text-amber-300 text-center mb-6">
            The frontier awaits. Will you stake your claim and build a life here in Gold Country,
            or move on to new adventures?
          </p>

          <div className="space-y-4">
            <button
              onClick={enterSettlement}
              className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-amber-100 font-pixel text-lg rounded border-4 border-amber-500 transition-colors"
            >
              🏠 Stake Your Claim
            </button>
            <p className="text-gray-500 text-xs text-center">
              Build a ranch, mine for gold, and become a legend of Gold Country
            </p>

            <button
              onClick={leaveSettlement}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-pixel text-sm rounded border-2 border-gray-500 transition-colors"
            >
              🚶 Continue Your Journey
            </button>
            <p className="text-gray-500 text-xs text-center">
              You've reached your destination - claim victory and move on
            </p>
          </div>
        </div>

        {/* Back to Hub */}
        <div className="text-center">
          <button
            onClick={resetGame}
            className="text-amber-500 hover:text-amber-300 text-xs font-pixel transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  )
}

// Settlement Hub Screen - Main settlement building interface
function SettlementScreen() {
  const { leaveSettlement, completeSettlement, resetGame } = useOregonTrail()

  return (
    <SettlementHub
      onLeave={leaveSettlement}
      onComplete={completeSettlement}
    />
  )
}

// Settlement Victory Screen - Final ending display
function SettlementVictoryScreen() {
  const { resetGame } = useOregonTrail()

  return (
    <SettlementVictory onPlayAgain={resetGame} />
  )
}

function OregonTrailGame() {
  const { state, startFromTitle, completeChapterIntro } = useOregonTrail()

  // Title screen phase
  if (state.phase === 'title') {
    return <TitleScreen onStart={startFromTitle} />
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

  // Settlement phase - main settlement building (Fallout-inspired)
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

// Main page export with all providers
export default function OregonTrailPage() {
  return (
    <KarmaWalletProvider>
      <OregonTrailProvider>
        <ChapterProvider
          onChapterComplete={(chapter) => {
            console.log(`Chapter ${chapter} complete!`)
          }}
          onEasterEggFound={(egg) => {
            console.log(`Easter egg found: ${egg.title}`)
          }}
        >
          <RanchProvider>
            <SettlementProvider>
              <CharacterProvider>
                <ReputationProvider>
                  <NarratorProvider>
                    <MysteryProvider>
                      <NPCProvider>
                        <OregonTrailGame />
                      </NPCProvider>
                    </MysteryProvider>
                  </NarratorProvider>
                </ReputationProvider>
              </CharacterProvider>
            </SettlementProvider>
          </RanchProvider>
        </ChapterProvider>
      </OregonTrailProvider>
    </KarmaWalletProvider>
  )
}
