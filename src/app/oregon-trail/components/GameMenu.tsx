'use client'

import React, { useState, useMemo } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useCharacter } from '../characterContext'
import { useReputation } from '../reputationContext'
import { useMystery } from '../mysteryContext'
// useNarrator available for future narrator mood integration
// import { useNarrator } from '../narratorContext'
import {
  getAvailableSections,
  type MenuSection,
} from '../data/gameMenuSections'
import { KarmaWallet } from './KarmaWallet'
import { playSFX } from '../lib/audioManager'
import { useEscapeKey } from '../lib/useEscapeKey'
import type { StatName, SaddleStats } from '../characterContext'

interface GameMenuProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// STAT DISPLAY HELPERS
// ============================================================================

const STAT_LABELS: Record<keyof SaddleStats, { short: string; emoji: string }> = {
  Shrewdness: { short: 'SHR', emoji: '\ud83e\udde0' },
  Agility: { short: 'AGI', emoji: '\ud83c\udfc3' },
  Durability: { short: 'DUR', emoji: '\ud83d\udee1\ufe0f' },
  Diplomacy: { short: 'DIP', emoji: '\ud83e\udd1d' },
  Luck: { short: 'LCK', emoji: '\ud83c\udf40' },
  Expertise: { short: 'EXP', emoji: '\ud83d\udd2d' },
}

const SUPPLY_ITEMS: {
  key: 'food' | 'ammunition' | 'spareParts' | 'medicine' | 'oxen' | 'clothing'
  label: string
  emoji: string
  max: number
}[] = [
  { key: 'food', label: 'Food', emoji: '\ud83c\udf56', max: 500 },
  { key: 'ammunition', label: 'Ammo', emoji: '\ud83d\udca3', max: 200 },
  { key: 'spareParts', label: 'Parts', emoji: '\ud83d\udd29', max: 10 },
  { key: 'medicine', label: 'Medicine', emoji: '\ud83d\udc8a', max: 20 },
  { key: 'oxen', label: 'Oxen', emoji: '\ud83d\udc02', max: 10 },
  { key: 'clothing', label: 'Clothing', emoji: '\ud83e\udde5', max: 20 },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function PipBoyMenu({ isOpen, onClose }: GameMenuProps) {
  useEscapeKey(onClose)

  const { state, setPace, setRations } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const { state: charState, getStat } = useCharacter()
  const { state: repState, getReputation, getReputationLevel, getAllFactions } = useReputation()
  const { state: mysteryState } = useMystery()
  const [selectedSection, setSelectedSection] = useState<string>('trail_map')

  const availableSections = useMemo(
    () => getAvailableSections(state.phase),
    [state.phase],
  )

  // Group sections by category for sidebar rendering
  const sectionsByCategory = useMemo(() => {
    const grouped: Record<string, MenuSection[]> = {}
    for (const section of availableSections) {
      if (!grouped[section.category]) grouped[section.category] = []
      grouped[section.category].push(section)
    }
    return grouped
  }, [availableSections])

  if (!isOpen) return null

  // ── Section Content Renderer ──────────────────────────────────────────

  const renderSectionContent = () => {
    switch (selectedSection) {
      // ── Trail Map ─────────────────────────────────────────────────
      case 'trail_map': {
        const landmarks = [
          'Independence', 'Kansas River', 'Fort Kearney', 'Chimney Rock',
          'Fort Laramie', 'Independence Rock', 'South Pass', 'Fort Bridger',
          'Soda Springs', 'Fort Hall', 'Snake River', 'Fort Boise',
          'Blue Mountains', 'The Dalles', 'Willamette Valley',
        ]
        const currentIdx = landmarks.indexOf(state.currentLandmark)
        return (
          <div className="space-y-1">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83d\uddfa\ufe0f'} Trail Progress
            </h3>
            <p className="text-amber-400/60 text-[10px] font-pixel mb-3">
              {state.distance} miles traveled {'\u2022'} Next: {state.nextLandmark} ({state.milesUntilNextLandmark}mi)
            </p>
            <div className="space-y-1">
              {landmarks.map((lm, i) => {
                const visited = i <= currentIdx
                const isCurrent = i === currentIdx
                return (
                  <div
                    key={lm}
                    className={`flex items-center gap-2 text-[10px] font-pixel py-0.5 ${
                      isCurrent
                        ? 'text-amber-200'
                        : visited
                        ? 'text-amber-400/40'
                        : 'text-amber-400/20'
                    }`}
                  >
                    <span>
                      {isCurrent ? '\ud83d\udea9' : visited ? '\u2713' : '\u2022'}
                    </span>
                    <span>{lm}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      // ── Party & Posse ─────────────────────────────────────────────
      case 'party_posse':
        return (
          <div className="space-y-2">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83e\udd20'} Party & Posse
            </h3>
            {state.party.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 border border-amber-800/50 rounded p-2"
              >
                <span className="text-lg">{member.emoji || '\ud83e\udd20'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-amber-200 text-xs truncate">
                      {member.name}
                    </span>
                    <span className="font-pixel text-[8px] text-amber-400/50 uppercase bg-amber-900/30 px-1 py-0.5 rounded">
                      {member.role}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 rounded mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-700 ${
                        member.health > 60
                          ? 'bg-green-500'
                          : member.health > 30
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${member.health}%` }}
                    />
                  </div>
                </div>
                <span className="font-pixel text-[10px] text-amber-400/60">
                  {member.health}%
                </span>
              </div>
            ))}
          </div>
        )

      // ── Bounty Journal ────────────────────────────────────────────
      case 'bounty_journal':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83d\udcdc'} Bounty Journal
            </h3>
            <div className="border border-amber-800 rounded p-3">
              <p className="font-pixel text-amber-300 text-xs">
                Clues Collected: {mysteryState.collectedClues.length}
              </p>
              <p className="font-pixel text-amber-300 text-xs mt-1">
                Outlaws Caught: {mysteryState.outlawsCaught}
              </p>
              <p className="font-pixel text-amber-300 text-xs mt-1">
                Outlaws Escaped: {mysteryState.outlawsEscaped}
              </p>
              {mysteryState.activeWarrant && (
                <p className="font-pixel text-red-400 text-xs mt-2">
                  {'\ud83d\udea8'} Active Warrant Issued
                </p>
              )}
            </div>
            <button
              onClick={() => playSFX('click')}
              className="font-pixel text-[10px] text-amber-400 border border-amber-600 px-3 py-1.5 rounded hover:bg-amber-900/30 transition-colors w-full"
            >
              [OPEN FULL JOURNAL]
            </button>
          </div>
        )

      // ── Notebook ──────────────────────────────────────────────────
      case 'notebook':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83d\udcd3'} Notebook
            </h3>
            <div className="border border-amber-800/50 rounded p-4 text-center">
              <p className="font-pixel text-amber-400/40 text-xs">
                No notes yet. Discoveries and clues will appear here.
              </p>
            </div>
          </div>
        )

      // ── Supplies ──────────────────────────────────────────────────
      case 'supplies':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83e\uddf0'} Supplies
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPLY_ITEMS.map((item) => {
                const value = state[item.key] as number
                const pct = Math.min(100, (value / item.max) * 100)
                return (
                  <div
                    key={item.key}
                    className="border border-amber-800/50 rounded p-2"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="font-pixel text-amber-200 text-[10px]">
                        {item.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-800 rounded overflow-hidden mb-1">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          pct > 50
                            ? 'bg-green-600'
                            : pct > 20
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="font-pixel text-amber-300 text-[10px] text-right">
                      {value}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="border border-amber-800/50 rounded p-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-amber-200 text-[10px]">
                  {'\ud83d\udee0\ufe0f'} Wagon Condition
                </span>
                <span className="font-pixel text-amber-300 text-[10px]">
                  {state.wagonCondition}%
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-orange-500 rounded transition-all duration-500"
                  style={{ width: `${state.wagonCondition}%` }}
                />
              </div>
            </div>
          </div>
        )

      // ── Karma Wallet ──────────────────────────────────────────────
      case 'karma_wallet':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\u2696\ufe0f'} Karma Wallet
            </h3>
            <KarmaWallet />
          </div>
        )

      // ── Character Sheet ───────────────────────────────────────────
      case 'character_sheet': {
        const char = charState.character
        if (!char) {
          return (
            <div className="text-center py-8">
              <p className="font-pixel text-amber-400/40 text-xs">
                No character created yet.
              </p>
            </div>
          )
        }
        const statNames: StatName[] = [
          'Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise',
        ]
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-1">
              {'\ud83d\udcc4'} {char.name}
            </h3>
            <p className="font-pixel text-amber-400/60 text-[10px] uppercase">
              {char.background.replace(/_/g, ' ')} {'\u2022'} Level {char.level}
            </p>
            <div className="space-y-2 mt-3">
              {statNames.map((stat) => {
                const val = getStat(stat)
                const info = STAT_LABELS[stat]
                const pct = Math.min(100, (val / 20) * 100)
                return (
                  <div key={stat}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="font-pixel text-amber-300">
                        {info.emoji} {info.short}
                      </span>
                      <span className="font-pixel text-amber-200">{val}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {char.traits && char.traits.length > 0 && (
              <div className="mt-3">
                <p className="font-pixel text-amber-400/60 text-[10px] mb-1">Traits:</p>
                <div className="flex flex-wrap gap-1">
                  {char.traits.map((traitId) => (
                    <span
                      key={traitId}
                      className="font-pixel text-[8px] text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded"
                    >
                      {traitId.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      // ── Reputation ────────────────────────────────────────────────
      case 'reputation': {
        const factions = getAllFactions()
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\u2b50'} Reputation
            </h3>
            {factions.map((faction) => {
              const rep = getReputation(faction.id)
              const level = getReputationLevel(faction.id)
              const pct = ((rep + 100) / 200) * 100
              return (
                <div key={faction.id} className="border border-amber-800/50 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-pixel text-amber-200 text-xs">
                      {faction.icon} {faction.name}
                    </span>
                    <span className="font-pixel text-[10px] text-amber-400/60">
                      {level.name} ({rep > 0 ? '+' : ''}{rep})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-500 ${
                        rep > 25
                          ? 'bg-green-500'
                          : rep > -25
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      // ── NPC Relations ─────────────────────────────────────────────
      case 'npc_relations':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83e\udd1d'} NPC Relations
            </h3>
            <button
              onClick={() => playSFX('click')}
              className="font-pixel text-[10px] text-amber-400 border border-amber-600 px-3 py-1.5 rounded hover:bg-amber-900/30 transition-colors w-full"
            >
              [OPEN NPC PANEL]
            </button>
          </div>
        )

      // ── Camp Services ─────────────────────────────────────────────
      case 'camp_services':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\u26fa'} Camp Services
            </h3>
            <p className="font-pixel text-amber-400/60 text-xs">
              Set up camp to access party services, rest, and resupply.
            </p>
            <button
              onClick={() => playSFX('click')}
              className="font-pixel text-[10px] text-amber-400 border border-amber-600 px-3 py-1.5 rounded hover:bg-amber-900/30 transition-colors w-full"
            >
              [OPEN CAMP MENU]
            </button>
          </div>
        )

      // ── Book Your Stay ────────────────────────────────────────────
      case 'book_your_stay':
        return (
          <div className="space-y-3">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\ud83c\udfe8'} Book Your Stay
            </h3>
            <div className="border border-amber-600 rounded-lg overflow-hidden">
              <div className="bg-amber-900/30 p-4">
                <p className="font-pixel text-amber-200 text-sm">
                  Back of Beyond Ranch
                </p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Experience the real Gold Country. Working ranch stays, trail rides,
                  and frontier living in the Sierra Nevada foothills.
                </p>
              </div>
              <div className="p-3 flex justify-center">
                <a
                  href="/rentals"
                  className="font-pixel text-[10px] text-stone-950 bg-amber-600 px-4 py-2 rounded hover:bg-amber-500 transition-colors inline-block"
                >
                  [VIEW RENTALS]
                </a>
              </div>
            </div>
          </div>
        )

      // ── Settings ──────────────────────────────────────────────────
      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="font-pixel text-amber-200 text-sm mb-3">
              {'\u2699\ufe0f'} Settings
            </h3>

            {/* Pace */}
            <div>
              <p className="font-pixel text-amber-400/60 text-[10px] mb-2">Travel Pace</p>
              <div className="flex gap-2">
                {(['steady', 'strenuous', 'grueling'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPace(p)
                      playSFX('click')
                    }}
                    className={`flex-1 font-pixel text-[10px] py-1.5 rounded border transition-colors ${
                      state.pace === p
                        ? 'border-amber-400 bg-amber-900/40 text-amber-200'
                        : 'border-amber-800 text-amber-400/60 hover:border-amber-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Rations */}
            <div>
              <p className="font-pixel text-amber-400/60 text-[10px] mb-2">Rations</p>
              <div className="flex gap-2">
                {(['filling', 'meager', 'bare_bones'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRations(r)
                      playSFX('click')
                    }}
                    className={`flex-1 font-pixel text-[10px] py-1.5 rounded border transition-colors ${
                      state.rations === r
                        ? 'border-amber-400 bg-amber-900/40 text-amber-200'
                        : 'border-amber-800 text-amber-400/60 hover:border-amber-600'
                    }`}
                  >
                    {r.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Info */}
            <div className="border-t border-amber-800 pt-3">
              <p className="font-pixel text-amber-400/40 text-[10px]">
                Chapter {state.currentChapter} {'\u2022'} Day {state.day} {'\u2022'}{' '}
                {state.weather} {'\u2022'} {state.temperature}{'\u00b0'}F
              </p>
              <p className="font-pixel text-amber-400/40 text-[10px] mt-1">
                Games Completed: {state.gamesCompleted} {'\u2022'} Outlaws Caught:{' '}
                {state.outlawsCaught}
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="font-pixel text-amber-400/40 text-xs">
              Select a section from the sidebar.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-amber-900/60 border-b border-amber-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-amber-200 text-sm">{state.currentLandmark}</span>
          <span className="font-pixel text-amber-400/60 text-[10px]">
            Day {state.day}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-pixel text-amber-300 text-[10px]">
            {'\ud83c\udf2e'} {balance.neutral} {'\u2022'} {'\ud83c\udf6a'} {balance.good}
          </span>
          <button
            onClick={() => {
              playSFX('click')
              onClose()
            }}
            className="font-pixel text-amber-400 text-xs border border-amber-700 px-2 py-0.5 rounded hover:bg-amber-900/30"
          >
            [ESC]
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-48 shrink-0 border-r border-amber-800 overflow-y-auto bg-stone-950/50">
          {Object.entries(sectionsByCategory).map(([category, sections]) => (
            <div key={category}>
              <p className="font-pixel text-[8px] text-amber-400/30 uppercase tracking-widest px-3 pt-3 pb-1">
                {category}
              </p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id)
                    playSFX('click')
                  }}
                  className={`w-full text-left px-3 py-2 font-pixel text-xs transition-colors ${
                    selectedSection === section.id
                      ? 'text-amber-200 bg-amber-900/40 border-l-2 border-amber-400'
                      : 'text-amber-400/60 hover:text-amber-300 hover:bg-amber-900/20 border-l-2 border-transparent'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-4">{renderSectionContent()}</div>
      </div>

      {/* Footer - Book Your Stay CTA */}
      <div className="shrink-0 border-t border-amber-700 bg-amber-900/30 px-4 py-2 flex items-center justify-between">
        <span className="font-pixel text-amber-300 text-[10px]">
          {'\ud83c\udfe8'} Experience the real Gold Country at Back of Beyond Ranch
        </span>
        <a
          href="/rentals"
          className="font-pixel text-[10px] text-stone-950 bg-amber-600 px-3 py-1 rounded hover:bg-amber-500 transition-colors"
        >
          [BOOK YOUR STAY]
        </a>
      </div>
    </div>
  )
}
