'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useOregonTrail } from '../oregonTrailContext'
import { useChapter } from '../chapterContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import {
  Graphics64bitWrapper,
  TravelingScene,
  getTimeOfDay,
  getTierFilter,
  type WeatherType
} from '../components/Graphics64bit'
import { TravelObservations } from '../components/TravelObservations'
import { type WeatherMood } from '../data/travelObservations'
import { LandmarkScene, type LandmarkType } from '../components/LandmarkScene'
import { LANDMARKS } from '../state/constants'
import { editorialForDistance, terrainForDistance } from '@/lib/californiaTrailArt'
import { PossePanel } from '../components/PossePanel'
import { CharacterSheet } from '../components/CharacterSheet'
import { type ActiveEffect } from '../data/consumableEffects'
import { CampMenu } from '../components/CampMenu'
import { PipBoyMenu } from '../components/GameMenu'
import HunkerDown from '../components/HunkerDown'
import { readArcadeAccess } from '@/lib/arcadeFirstLevel'

export interface TravelingScreenProps {
  activeEffects: ActiveEffect[]
  onUseConsumable: (itemId: string) => void
  onApplyMedicine: (memberId: string) => void
  onRepairWagon: () => void
  lastStatVariant: { stat: string; threshold: 'high' | 'low' } | null
}

export function TravelingScreen({
  activeEffects,
  onUseConsumable,
  onApplyMedicine,
  onRepairWagon,
  lastStatVariant,
}: TravelingScreenProps) {
  const { state, travel, setPace, setRations, hunt } = useOregonTrail()
  const { progress: chapterProgress } = useChapter()

  // Local modal states
  const [showCampMenu, setShowCampMenu] = useState(false)
  const [showPipBoy, setShowPipBoy] = useState(false)
  const [showCharacterSheet, setShowCharacterSheet] = useState(false)

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
  const gameHour = (state.day % 1) * 24 || 12
  const timeOfDay = getTimeOfDay(gameHour)

  // Map game weather to graphics weather type
  const graphicsWeather: WeatherType = state.weather === 'rain' ? 'rain'
    : state.weather === 'storm' ? 'rain'
    : state.weather === 'snow' ? 'snow'
    : 'clear'

  const getTerrain = (): 'plains' | 'mountains' | 'desert' | 'forest' | 'river' =>
    terrainForDistance(state.distance)

  const trailArt = editorialForDistance(state.distance)

  // Get CSS filter based on graphics tier
  const tierFilter = getTierFilter(state.graphicsTier)

  // Scenic landmarks (landmark/pass/desert) never enter a stopping phase, so
  // their place art is only reachable here. currentLandmark is set exactly on
  // the arrival day — show the landmark scene for that day instead of the
  // generic wagon animation.
  const passingLandmark = state.currentLandmark
    ? LANDMARKS.find(l => l.name === state.currentLandmark)
    : undefined
  // #15: only on the actual arrival day — currentLandmark is never cleared
  // (it's load-bearing for towns/Living Trail), so gate on the recorded
  // arrival day. Old saves lack landmarkArrivalDay (undefined !== number),
  // so they safely show the wagon scene until the next arrival.
  const scenicPassing = passingLandmark && ['landmark', 'pass', 'desert'].includes(passingLandmark.type)
    && state.landmarkArrivalDay === state.day
    ? passingLandmark
    : undefined

  // Main travel screen with 64-bit graphics wrapper
  return (
    <Graphics64bitWrapper
      tier={state.graphicsTier}
      timeOfDay={timeOfDay}
      weather={graphicsWeather}
      showLandmarks
      currentLandmark={state.currentLandmark}
      terrain={getTerrain()}
    >
      <div className="min-h-screen p-4" style={{ filter: tierFilter }}>
        <KarmaToastContainer />

        <div className="max-w-3xl mx-auto">
          <header className="mb-4 flex items-center justify-between pt-4">
            <div>
              <p className="west-face-eyebrow">On the trail</p>
              <h1 className="west-face-title mt-1 text-2xl">Day {state.day}</h1>
              <p className="mt-1 font-serif text-sm text-[#b8a88a]">
                {weatherEmoji} {state.weather}
              </p>
            </div>
            <Link
              href="/"
              className="west-face-pill text-xs"
            >
              Quit
            </Link>
          </header>

          {/* Scenic landmark passing — real place art for the arrival day */}
          {scenicPassing ? (
            <LandmarkScene
              landmarkName={scenicPassing.name}
              landmarkType={(scenicPassing.type === 'desert' ? 'landmark' : scenicPassing.type) as LandmarkType}
              timeOfDay={timeOfDay}
              weather={graphicsWeather}
              className="mb-4"
            />
          ) : state.graphicsTier === 'ultra_64bit' && (
            /* Animated Traveling Scene (64-bit only) */
            <TravelingScene
              tier={state.graphicsTier}
              timeOfDay={timeOfDay}
              weather={graphicsWeather}
              progress={Math.max(0, Math.min(100, progress))}
              terrain={getTerrain()}
              nextStop={state.nextLandmark}
              milesLeft={state.milesUntilNextLandmark}
              artSrc={trailArt.src}
            />
          )}

          <p className="mb-6 text-center font-serif text-sm text-[#b8a88a]">
            {state.distance} of 2000 miles
            {state.currentLandmark ? ` · near ${state.currentLandmark}` : ''}
          </p>

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

        {/* Primary verbs first — iPhone first paint must include Continue Trail. */}
        <div className="mb-6 flex gap-3 justify-center flex-wrap">
          <button
            data-testid="continue-trail"
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
          <HunkerDown
            currentLandmark={state.currentLandmark}
            milesRemaining={2000 - state.distance}
            partySize={state.party.length}
            onHunkerDown={() => {}}
            graphicsTier={state.graphicsTier}
          />
          <button
            onClick={() => setShowCampMenu(true)}
            className="px-4 py-3 bg-amber-800 hover:bg-amber-700 text-amber-100 font-pixel text-sm rounded border-4 border-amber-600 transition-colors"
          >
            {'\u26FA'} Camp
          </button>
        </div>

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

        {/* Active Buffs Strip — visible countdown for timed effects */}
        {activeEffects.length > 0 && (
          <div className="mb-4 p-2 bg-stone-900/80 border border-purple-700/50 rounded-lg">
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

        {/* Character Sheet Modal (available during travel) */}
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

        {/* Camp Menu (available during travel) */}
        <CampMenu isOpen={showCampMenu} onClose={() => setShowCampMenu(false)} />

        {readArcadeAccess().trailComplete && (
          <>
            <PipBoyMenu isOpen={showPipBoy} onClose={() => setShowPipBoy(false)} onOpenCamp={() => setShowCampMenu(true)} />
            <button
              onClick={() => setShowPipBoy(true)}
              className="fixed bottom-4 right-4 z-40 bg-amber-900/90 border-2 border-amber-600 text-amber-200 font-pixel text-xs px-3 py-2 rounded hover:bg-amber-800/90 transition-colors shadow-lg"
            >
              [ESC] MENU
            </button>
          </>
        )}
      </div>
    </div>
    </Graphics64bitWrapper>
  )
}
