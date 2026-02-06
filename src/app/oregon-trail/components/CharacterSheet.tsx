'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useCharacter, CHARACTER_TRAITS, BACKGROUND_DESCRIPTIONS, type CharacterBackground, type StatName } from '../characterContext'
import { useOregonTrail } from '../oregonTrailContext'
import { getAbsurdItem, type AbsurdItem } from '../data/absurdItems'
import { DISCOVERABLE_TRAITS, getDiscoveredTraitDisplay, getTraitRarityColor, getTraitRarityLabel, getTraitCategoryIcon } from '../data/discoverableTraits'

// =============================================================================
// CharacterSheet - Interactive character stats, inventory, party, and wagon UI
// =============================================================================

type SheetTab = 'stats' | 'inventory' | 'party' | 'wagon'

interface CharacterSheetProps {
  onClose: () => void
  onUseConsumable?: (itemId: string) => void
  onApplyMedicine?: (memberId: string) => void
  onRepairWagon?: () => void
  inventory?: string[]
  activeEffects?: Array<{
    id: string
    sourceName: string
    type: string
    stat?: string
    value: number
    remainingTurns: number
    stackCount: number
  }>
}

// Background portrait emojis
const BACKGROUND_PORTRAITS: Record<CharacterBackground, string> = {
  pinkerton_veteran: '\u{1F575}',
  frontier_scout: '\u{1F3AF}',
  army_officer: '\u{2694}',
  gambler: '\u{1F0CF}',
  doctor: '\u{2695}',
  preacher: '\u{271D}',
  outlaw_reformed: '\u{1F3AD}',
}

// Stat display abbreviations and colors
const STAT_CONFIG: Record<StatName, { abbr: string; color: string; barColor: string }> = {
  Shrewdness: { abbr: 'SHR', color: 'text-purple-300', barColor: 'bg-purple-500' },
  Agility: { abbr: 'AGI', color: 'text-green-300', barColor: 'bg-green-500' },
  Durability: { abbr: 'DUR', color: 'text-red-300', barColor: 'bg-red-500' },
  Diplomacy: { abbr: 'DIP', color: 'text-blue-300', barColor: 'bg-blue-500' },
  Luck: { abbr: 'LCK', color: 'text-yellow-300', barColor: 'bg-yellow-500' },
  Expertise: { abbr: 'EXP', color: 'text-orange-300', barColor: 'bg-orange-500' },
}

// Supply resource config
const SUPPLY_ITEMS = [
  { key: 'food', name: 'Food', emoji: '\u{1F96B}', unit: 'lbs' },
  { key: 'ammunition', name: 'Ammunition', emoji: '\u{1F3AF}', unit: 'rounds' },
  { key: 'medicine', name: 'Medicine', emoji: '\u{1F48A}', unit: 'kits' },
  { key: 'spareParts', name: 'Spare Parts', emoji: '\u{1F527}', unit: 'sets' },
  { key: 'clothing', name: 'Clothing', emoji: '\u{1F9E5}', unit: 'sets' },
] as const

// Effect type icons
const EFFECT_ICONS: Record<string, string> = {
  buff: '\u{2B06}',
  debuff: '\u{2B07}',
  heal: '\u{1F49A}',
  poison: '\u{2620}',
  shield: '\u{1F6E1}',
  speed: '\u{26A1}',
  default: '\u{2728}',
}

// Health bar color based on value
function getHealthColor(health: number): string {
  if (health > 70) return 'bg-green-500'
  if (health > 40) return 'bg-yellow-500'
  if (health > 20) return 'bg-orange-500'
  return 'bg-red-500'
}

// Health text color based on value
function getHealthTextColor(health: number): string {
  if (health > 70) return 'text-green-400'
  if (health > 40) return 'text-yellow-400'
  if (health > 20) return 'text-orange-400'
  return 'text-red-400'
}

// Wagon condition descriptor
function getWagonStatus(condition: number): { label: string; color: string } {
  if (condition > 80) return { label: 'Excellent', color: 'text-green-400' }
  if (condition > 60) return { label: 'Good', color: 'text-lime-400' }
  if (condition > 40) return { label: 'Fair', color: 'text-yellow-400' }
  if (condition > 20) return { label: 'Worn', color: 'text-orange-400' }
  return { label: 'Critical', color: 'text-red-400' }
}

// Sickness display names
const SICKNESS_NAMES: Record<string, string> = {
  dysentery: 'Dysentery',
  typhoid: 'Typhoid Fever',
  cholera: 'Cholera',
  broken_leg: 'Broken Leg',
  snakebite: 'Snakebite',
}

export function CharacterSheet({
  onClose,
  onUseConsumable,
  onApplyMedicine,
  onRepairWagon,
  inventory = [],
  activeEffects = [],
}: CharacterSheetProps) {
  useEscapeKey(onClose)
  const { state: charState, getStat, getStatDescription } = useCharacter()
  const { state: trailState } = useOregonTrail()

  const [activeTab, setActiveTab] = useState<SheetTab>('stats')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [flashItemId, setFlashItemId] = useState<string | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const character = charState.character

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Flash effect auto-clear
  useEffect(() => {
    if (flashItemId) {
      const timer = setTimeout(() => setFlashItemId(null), 600)
      return () => clearTimeout(timer)
    }
  }, [flashItemId])

  // Show toast and flash for item use feedback
  const showUseFeedback = useCallback((itemName: string) => {
    setToastMessage(`Used ${itemName}`)
  }, [])

  // Handle consumable use
  const handleUseConsumable = useCallback((itemId: string, itemName: string) => {
    if (onUseConsumable) {
      onUseConsumable(itemId)
      setFlashItemId(itemId)
      showUseFeedback(itemName)
    }
  }, [onUseConsumable, showUseFeedback])

  // Handle medicine application
  const handleApplyMedicine = useCallback((memberId: string, memberName: string) => {
    if (onApplyMedicine && trailState.medicine > 0) {
      onApplyMedicine(memberId)
      showUseFeedback(`Medicine on ${memberName}`)
    }
  }, [onApplyMedicine, trailState.medicine, showUseFeedback])

  // Handle wagon repair
  const handleRepairWagon = useCallback(() => {
    if (onRepairWagon && trailState.spareParts > 0 && trailState.wagonCondition < 100) {
      onRepairWagon()
      showUseFeedback('Spare Part for repair')
    }
  }, [onRepairWagon, trailState.spareParts, trailState.wagonCondition, showUseFeedback])

  // Categorize inventory items
  const absurdItems: AbsurdItem[] = inventory
    .map(id => getAbsurdItem(id))
    .filter((item): item is AbsurdItem => item !== undefined)

  // Tab definitions
  const tabs: Array<{ id: SheetTab; label: string; emoji: string }> = [
    { id: 'stats', label: 'Stats', emoji: '\u{1F4CA}' },
    { id: 'inventory', label: 'Luggage', emoji: '\u{1F392}' },
    { id: 'party', label: 'Party', emoji: '\u{1F46E}' },
    { id: 'wagon', label: 'Wagon', emoji: '\u{1F6D2}' },
  ]

  // XP percentage for bar
  const xpPercent = character
    ? Math.min(100, (character.experience / character.experienceToNextLevel) * 100)
    : 0

  // ---------------------------------------------------------------------------
  // Tab 1: Character Stats
  // ---------------------------------------------------------------------------
  const renderStatsTab = () => {
    if (!character) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-amber-400">
          <span className="text-4xl mb-3">{'\u{2753}'}</span>
          <p className="font-pixel">No character created yet</p>
          <p className="text-amber-600 text-xs mt-1">Create a character to view stats</p>
        </div>
      )
    }

    const bgInfo = BACKGROUND_DESCRIPTIONS[character.background]
    const portrait = BACKGROUND_PORTRAITS[character.background]
    const statNames = Object.keys(STAT_CONFIG) as StatName[]

    return (
      <div className="space-y-4">
        {/* Character Header */}
        <div className="flex items-start gap-4 bg-amber-900/40 rounded-lg p-3 border border-amber-700/50">
          {/* Portrait */}
          <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-amber-800 rounded-lg border-2 border-amber-600 text-3xl md:text-4xl shrink-0">
            {portrait}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-amber-100 font-bold text-lg font-pixel truncate">{character.name}</h3>
            <p className="text-amber-400 text-sm">{bgInfo.name}</p>
            <p className="text-amber-600 text-xs mt-0.5">{bgInfo.description}</p>
            {/* Level + XP */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-300 font-bold">Lvl {character.level}</span>
                <span className="text-amber-500">
                  {character.experience} / {character.experienceToNextLevel} XP
                </span>
              </div>
              <div className="w-full h-2 bg-amber-900 rounded-full overflow-hidden border border-amber-700">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* S.A.D.D.L.E. Stats */}
        <div>
          <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
            S.A.D.D.L.E. Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {statNames.map(stat => {
              const config = STAT_CONFIG[stat]
              const value = getStat(stat)
              const maxStat = 20
              const pct = Math.min(100, (value / maxStat) * 100)

              return (
                <div key={stat} className="bg-amber-900/30 rounded p-2 border border-amber-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold font-pixel ${config.color}`}>
                      {config.abbr}
                    </span>
                    <span className="text-amber-200 text-sm font-bold">{value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-amber-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-amber-600 text-[10px] mt-1 leading-tight">
                    {getStatDescription(stat)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Effects */}
        {activeEffects.length > 0 && (
          <div>
            <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
              Active Effects
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeEffects.map((effect) => {
                const icon = EFFECT_ICONS[effect.type] || EFFECT_ICONS.default
                const isBuff = effect.value > 0
                return (
                  <div
                    key={effect.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${
                      isBuff
                        ? 'bg-green-900/40 border-green-700/50 text-green-300'
                        : 'bg-red-900/40 border-red-700/50 text-red-300'
                    }`}
                    title={`${effect.sourceName}: ${isBuff ? '+' : ''}${effect.value}${effect.stat ? ` ${effect.stat}` : ''} (${effect.remainingTurns} turns)`}
                  >
                    <span>{icon}</span>
                    <span className="font-bold">{effect.sourceName}</span>
                    <span className="opacity-70">
                      {isBuff ? '+' : ''}{effect.value}
                      {effect.stat ? ` ${effect.stat.slice(0, 3)}` : ''}
                    </span>
                    {effect.stackCount > 1 && (
                      <span className="bg-amber-700 text-amber-200 rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
                        {effect.stackCount}
                      </span>
                    )}
                    <span className="opacity-50">{effect.remainingTurns}t</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Traits */}
        <div>
          <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
            Traits {character.traits.length > 0 && `(${character.traits.length})`}
          </h4>
          {character.traits.length === 0 ? (
            <p className="text-amber-600 text-xs italic">No traits acquired yet. Earn traits through gameplay.</p>
          ) : (
            <div className="space-y-2">
              {character.traits.map(traitId => {
                const trait = CHARACTER_TRAITS[traitId]
                if (!trait) return null
                return (
                  <div key={traitId} className="bg-amber-900/30 rounded p-2 border border-amber-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-200 font-bold text-sm">{trait.name}</span>
                      <div className="flex gap-1">
                        {Object.entries(trait.statModifiers).map(([stat, mod]) => (
                          <span
                            key={stat}
                            className={`text-[10px] px-1 rounded ${
                              (mod ?? 0) > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                            }`}
                          >
                            {(mod ?? 0) > 0 ? '+' : ''}{mod} {stat.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-amber-500 text-xs mt-0.5">{trait.description}</p>
                    {trait.specialAbility && (
                      <p className="text-amber-400 text-[10px] mt-1 italic">
                        Special: {trait.specialAbility}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Discoverable Traits - "???" hints */}
        <div>
          <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
            Hidden Traits ({DISCOVERABLE_TRAITS.length})
          </h4>
          <p className="text-amber-600 text-[10px] mb-2 italic">
            Discover traits through gameplay. Meet the conditions to unlock permanent bonuses.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DISCOVERABLE_TRAITS.map(trait => {
              const isDiscovered = character.traits.includes(trait.id)
              const display = getDiscoveredTraitDisplay(trait.id, isDiscovered)
              return (
                <div
                  key={trait.id}
                  className={`rounded p-1.5 border text-[10px] ${
                    isDiscovered
                      ? 'bg-amber-900/40 border-amber-600/50'
                      : 'bg-stone-900/40 border-stone-700/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{display.icon}</span>
                    <span
                      className="font-bold truncate"
                      style={{ color: isDiscovered ? getTraitRarityColor(trait.rarity) : '#6b7280' }}
                    >
                      {display.name}
                    </span>
                    <span className="text-[8px] ml-auto" style={{ color: getTraitRarityColor(trait.rarity) }}>
                      {getTraitRarityLabel(trait.rarity)}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5 leading-tight">{display.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Tab 2: Inventory / Luggage
  // ---------------------------------------------------------------------------
  const renderInventoryTab = () => {
    const hasSupplies = SUPPLY_ITEMS.some(s => {
      const val = trailState[s.key as keyof typeof trailState]
      return typeof val === 'number' && val > 0
    })

    return (
      <div className="space-y-4">
        {/* Supplies Section */}
        <div>
          <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
            Supplies
          </h4>
          {!hasSupplies ? (
            <p className="text-amber-600 text-xs italic">Your supply stores are empty.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPLY_ITEMS.map(supply => {
                const qty = trailState[supply.key as keyof typeof trailState] as number
                if (qty <= 0) return null

                const isSpare = supply.key === 'spareParts'
                const canRepair = isSpare && trailState.wagonCondition < 100 && qty > 0

                return (
                  <div
                    key={supply.key}
                    className={`bg-amber-900/30 rounded p-2.5 border border-amber-800/50 flex items-center gap-3 ${
                      flashItemId === supply.key ? 'ring-2 ring-green-400 bg-green-900/20' : ''
                    }`}
                  >
                    <span className="text-xl shrink-0">{supply.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-200 font-bold text-sm">{supply.name}</span>
                        <span className="text-amber-400 text-sm">{qty} {supply.unit}</span>
                      </div>
                      {canRepair && onRepairWagon && (
                        <button
                          onClick={() => {
                            handleRepairWagon()
                            setFlashItemId(supply.key)
                          }}
                          className="mt-1.5 w-full py-2 md:py-1.5 bg-amber-700 hover:bg-amber-600 active:bg-amber-500 text-amber-100 rounded text-xs font-bold transition-colors"
                        >
                          Repair Wagon (+25 condition)
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Special / Absurd Items */}
        <div>
          <h4 className="text-amber-300 font-bold text-sm font-pixel mb-2 border-b border-amber-700/50 pb-1">
            Special Items {absurdItems.length > 0 && `(${absurdItems.length})`}
          </h4>
          {absurdItems.length === 0 ? (
            <p className="text-amber-600 text-xs italic">
              No special items collected. Explore the trail to find curiosities.
            </p>
          ) : (
            <div className="space-y-2">
              {absurdItems.map(item => {
                const isExpanded = expandedItemId === item.id
                const isConsumable = item.uses?.some(u => u.consumesItem) ?? false
                const categoryColors: Record<string, string> = {
                  physical: 'text-amber-400 bg-amber-900/60',
                  emotional: 'text-pink-400 bg-pink-900/40',
                  conceptual: 'text-cyan-400 bg-cyan-900/40',
                  temporal: 'text-violet-400 bg-violet-900/40',
                  paradoxical: 'text-yellow-400 bg-yellow-900/40',
                  meta: 'text-emerald-400 bg-emerald-900/40',
                }
                const catStyle = categoryColors[item.category] || categoryColors.physical

                return (
                  <div
                    key={item.id}
                    className={`bg-amber-900/30 rounded border transition-all cursor-pointer ${
                      flashItemId === item.id
                        ? 'ring-2 ring-green-400 bg-green-900/20 border-green-600'
                        : 'border-amber-800/50 hover:border-amber-600'
                    }`}
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  >
                    <div className="p-2.5 flex items-start gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${catStyle}`}>
                        {item.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-200 font-bold text-sm">{item.name}</p>
                        <p className="text-amber-500 text-xs mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 border-t border-amber-800/30 pt-2 space-y-2">
                        {item.narratorDescription && (
                          <p className="text-amber-600 text-xs italic">
                            &quot;{item.narratorDescription}&quot;
                          </p>
                        )}
                        {item.weight !== undefined && (
                          <p className="text-amber-500 text-[10px]">
                            Weight: {typeof item.weight === 'number' ? `${item.weight} lbs` : item.weight}
                          </p>
                        )}
                        {/* Item uses */}
                        {item.uses && item.uses.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wide">Uses:</p>
                            {item.uses.map((use, idx) => (
                              <div key={idx} className="bg-amber-950/50 rounded p-2 text-xs">
                                <p className="text-amber-300">{use.context}</p>
                                <p className="text-amber-500 text-[10px] mt-0.5">{use.effect}</p>
                                {use.consumesItem && isConsumable && onUseConsumable && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUseConsumable(item.id, item.name)
                                    }}
                                    className="mt-1.5 px-3 py-2 md:py-1.5 bg-green-800 hover:bg-green-700 active:bg-green-600 text-green-100 rounded text-xs font-bold transition-colors"
                                  >
                                    Use Item
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Combinations hint */}
                        {item.combinations && item.combinations.length > 0 && (
                          <p className="text-amber-600 text-[10px]">
                            Can be combined with other items...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Tab 3: Party
  // ---------------------------------------------------------------------------
  const renderPartyTab = () => {
    const party = trailState.party
    const weather = trailState.weather
    const temp = trailState.temperature
    const clothing = trailState.clothing

    if (party.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-amber-400">
          <span className="text-4xl mb-3">{'\u{1F6B6}'}</span>
          <p className="font-pixel">No party members yet</p>
          <p className="text-amber-600 text-xs mt-1">Start a game to recruit companions</p>
        </div>
      )
    }

    // Weather warnings
    const isCold = weather === 'snow' || temp < 32
    const isHot = temp > 95
    const coldWarning = isCold && clothing < party.length
    const heatWarning = isHot

    return (
      <div className="space-y-3">
        {/* Weather Warnings */}
        {(coldWarning || heatWarning) && (
          <div className={`rounded p-2.5 border text-xs ${
            coldWarning
              ? 'bg-blue-900/30 border-blue-700/50 text-blue-300'
              : 'bg-orange-900/30 border-orange-700/50 text-orange-300'
          }`}>
            {coldWarning && (
              <p>
                {'\u{1F976}'} Cold weather! Not enough clothing for the party ({clothing}/{party.length} sets).
                Members without clothing will lose health.
              </p>
            )}
            {heatWarning && (
              <p>
                {'\u{1F975}'} Extreme heat ({temp}F)! Party members need extra water rations.
              </p>
            )}
          </div>
        )}

        {/* Morale Bar */}
        <div className="bg-amber-900/30 rounded p-2.5 border border-amber-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-amber-300 text-xs font-bold font-pixel">Party Morale</span>
            <span className={`text-sm font-bold ${getHealthTextColor(trailState.morale)}`}>
              {trailState.morale}/100
            </span>
          </div>
          <div className="w-full h-2 bg-amber-950 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getHealthColor(trailState.morale)}`}
              style={{ width: `${trailState.morale}%` }}
            />
          </div>
        </div>

        {/* Party Members */}
        {party.map(member => {
          const healthColor = getHealthColor(member.health)
          const healthText = getHealthTextColor(member.health)
          const isDead = member.health <= 0
          const canHeal = member.isSick && trailState.medicine > 0
          const canBandage = !member.isSick && member.health < 100 && trailState.medicine > 0

          return (
            <div
              key={member.id}
              className={`bg-amber-900/30 rounded p-3 border ${
                isDead
                  ? 'border-gray-700 opacity-50'
                  : member.isSick
                    ? 'border-red-700/50'
                    : 'border-amber-800/50'
              }`}
            >
              {/* Name + Health */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {isDead ? '\u{1F480}' : member.isSick ? '\u{1F912}' : member.id === 'leader' ? '\u{2B50}' : '\u{1F920}'}
                  </span>
                  <div>
                    <span className={`font-bold text-sm ${isDead ? 'text-gray-500 line-through' : 'text-amber-200'}`}>
                      {member.name}
                    </span>
                    {member.id === 'leader' && !isDead && (
                      <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-amber-700 text-amber-200 rounded">
                        LEADER
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-bold ${isDead ? 'text-gray-500' : healthText}`}>
                  {isDead ? 'DEAD' : `${member.health}/100`}
                </span>
              </div>

              {/* Health Bar */}
              {!isDead && (
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${healthColor}`}
                    style={{ width: `${member.health}%` }}
                  />
                </div>
              )}

              {/* Sickness Info */}
              {member.isSick && member.sicknessType && !isDead && (
                <div className="bg-red-900/30 rounded p-2 mb-2 border border-red-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-red-300 text-xs font-bold">
                      {'\u{1FA7A}'} {SICKNESS_NAMES[member.sicknessType] || member.sicknessType}
                    </span>
                    {member.daysUntilRecovery !== undefined && (
                      <span className="text-red-400 text-[10px]">
                        {member.daysUntilRecovery} days to recover
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isDead && (
                <div className="flex gap-2">
                  {canHeal && onApplyMedicine && (
                    <button
                      onClick={() => handleApplyMedicine(member.id, member.name)}
                      className="flex-1 py-2.5 md:py-2 bg-green-800 hover:bg-green-700 active:bg-green-600 text-green-100 rounded text-xs font-bold transition-colors"
                    >
                      {'\u{1F48A}'} Apply Medicine (Cure)
                    </button>
                  )}
                  {canBandage && onApplyMedicine && (
                    <button
                      onClick={() => handleApplyMedicine(member.id, member.name)}
                      className="flex-1 py-2.5 md:py-2 bg-blue-800 hover:bg-blue-700 active:bg-blue-600 text-blue-100 rounded text-xs font-bold transition-colors"
                    >
                      {'\u{1FA79}'} Apply Bandage (+15 HP)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Tab 4: Wagon
  // ---------------------------------------------------------------------------
  const renderWagonTab = () => {
    const condition = trailState.wagonCondition
    const parts = trailState.spareParts
    const oxen = trailState.oxen
    const canRepair = parts > 0 && condition < 100
    const status = getWagonStatus(condition)

    // Wagon visual - shows damage levels
    const wagonLines = condition > 80
      ? [
        '        _______________',
        '       |  ___________  |',
        '       | |           | |',
        '       | |___________| |',
        '       |_______________|',
        '   ___/    O       O    \\___',
        '  /___________________________\\',
      ]
      : condition > 50
      ? [
        '        _______________',
        '       |  ____/\\/\\__  |',
        '       | |           | |',
        '       | |___________| |',
        '       |____/\\_________|',
        '   ___/    O       O    \\___',
        '  /__________/\\_______________\\',
      ]
      : condition > 20
      ? [
        '        ______ ________',
        '       |  __// \\\\__  |',
        '       | |    /      | |',
        '       | |_____/\\___| |',
        '       |___/\\__  _____|',
        '   __x/    O    /  O    \\_x_',
        '  /______/\\_____/\\_________\\',
      ]
      : [
        '        ______ ___  ___',
        '       | //__\\\\ /\\  |',
        '       | |  / /      |',
        '       | |__x_/\\___| |',
        '       |__x/\\__  __x__|',
        '   __x/    o    /  .    \\_x_',
        '  /___x__/\\___x_/\\_____x___\\',
      ]

    return (
      <div className="space-y-4">
        {/* Wagon ASCII Art */}
        <div className={`bg-amber-900/30 rounded p-4 border border-amber-800/50 font-mono text-xs leading-tight text-center ${
          condition > 60 ? 'text-amber-400' : condition > 30 ? 'text-yellow-500' : 'text-red-400'
        }`}>
          <pre className="inline-block text-left">
            {wagonLines.join('\n')}
          </pre>
        </div>

        {/* Wagon Condition */}
        <div className="bg-amber-900/30 rounded p-3 border border-amber-800/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-amber-300 text-sm font-bold font-pixel">Wagon Condition</span>
            <span className={`text-sm font-bold ${status.color}`}>
              {condition}/100 ({status.label})
            </span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getHealthColor(condition)}`}
              style={{ width: `${condition}%` }}
            />
          </div>

          {/* Condition Warning */}
          {condition <= 20 && (
            <p className="text-red-400 text-xs mt-2">
              {'\u{26A0}'} Wagon is critically damaged! Repair immediately or risk breakdown.
            </p>
          )}
        </div>

        {/* Spare Parts + Repair */}
        <div className="bg-amber-900/30 rounded p-3 border border-amber-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{'\u{1F527}'}</span>
              <div>
                <span className="text-amber-200 font-bold text-sm">Spare Parts</span>
                <p className="text-amber-500 text-[10px]">Axles, wheels, tongues</p>
              </div>
            </div>
            <span className="text-amber-300 font-bold text-lg">{parts}</span>
          </div>

          {canRepair && onRepairWagon ? (
            <button
              onClick={handleRepairWagon}
              className="w-full py-3 md:py-2 bg-amber-700 hover:bg-amber-600 active:bg-amber-500 text-amber-100 rounded font-bold text-sm transition-colors"
            >
              {'\u{1F6E0}'} Repair Wagon (-1 Part, +25 Condition)
            </button>
          ) : condition >= 100 ? (
            <p className="text-green-400 text-xs text-center py-1">Wagon is in perfect condition!</p>
          ) : parts <= 0 ? (
            <p className="text-red-400 text-xs text-center py-1">No spare parts available for repairs.</p>
          ) : null}
        </div>

        {/* Oxen Status */}
        <div className="bg-amber-900/30 rounded p-3 border border-amber-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{'\u{1F402}'}</span>
              <div>
                <span className="text-amber-200 font-bold text-sm">Oxen</span>
                <p className="text-amber-500 text-[10px]">Draft animals for the wagon</p>
              </div>
            </div>
            <span className={`font-bold text-lg ${
              oxen >= 4 ? 'text-green-400' : oxen >= 2 ? 'text-yellow-400' : oxen >= 1 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {oxen}
            </span>
          </div>

          {/* Oxen health indicator */}
          <div className="flex gap-1.5">
            {Array.from({ length: Math.max(oxen, 0) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-amber-800 rounded flex items-center justify-center text-lg border border-amber-700"
              >
                {'\u{1F402}'}
              </div>
            ))}
            {oxen === 0 && (
              <p className="text-red-400 text-xs">
                {'\u{26A0}'} No oxen! Your wagon cannot move.
              </p>
            )}
          </div>

          {oxen > 0 && oxen < 2 && (
            <p className="text-yellow-400 text-xs mt-2">
              {'\u{26A0}'} Low oxen count. Travel speed is reduced.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render tab content
  // ---------------------------------------------------------------------------
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats': return renderStatsTab()
      case 'inventory': return renderInventoryTab()
      case 'party': return renderPartyTab()
      case 'wagon': return renderWagonTab()
      default: return null
    }
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-900 p-3 border-b border-amber-600 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u{1F4DC}'}</span>
            <div>
              <h2 className="text-amber-200 font-bold font-pixel">
                {character ? character.name : 'Character Sheet'}
              </h2>
              <p className="text-amber-500 text-xs">
                Day {trailState.day} | {trailState.currentLandmark}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-8 md:h-8 bg-amber-800 hover:bg-amber-700 active:bg-amber-600 rounded flex items-center justify-center text-amber-300 text-lg font-bold transition-colors"
            aria-label="Close character sheet"
          >
            X
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-700 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 md:py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-amber-800 text-amber-200 border-b-2 border-amber-400'
                  : 'bg-amber-950 text-amber-500 hover:text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderTabContent()}
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-800 text-green-100 px-4 py-2 rounded-lg shadow-lg text-sm font-bold animate-pulse border border-green-600 z-[60]">
            {'\u{2705}'} {toastMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default CharacterSheet
