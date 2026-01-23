'use client'

import React, { useState } from 'react'
import {
  useReputation,
  type FactionId,
  FACTIONS,
  getReputationColorClass,
  getReputationBarColor,
  REPUTATION_LEVELS
} from '../reputationContext'

interface ReputationBarProps {
  compact?: boolean
  showDetails?: boolean
}

export function ReputationBar({ compact = false, showDetails = true }: ReputationBarProps) {
  const { getReputation, getReputationLevel, getAllFactions, getRecentEvents } = useReputation()
  const [expanded, setExpanded] = useState(false)
  const [hoveredFaction, setHoveredFaction] = useState<FactionId | null>(null)

  const factions = getAllFactions()

  if (compact) {
    return (
      <div className="flex gap-1 items-center">
        {factions.map(faction => {
          const rep = getReputation(faction.id)
          return (
            <div
              key={faction.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded"
              title={`${faction.name}: ${rep > 0 ? '+' : ''}${rep}`}
            >
              <span>{faction.icon}</span>
              <span className={`text-xs ${getReputationColorClass(rep)}`}>
                {rep > 0 ? '+' : ''}{rep}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 bg-gray-800 flex justify-between items-center hover:bg-gray-750"
      >
        <span className="text-gray-300 text-sm">Reputation</span>
        <span className="text-gray-500 text-xs">{expanded ? '\u25b2' : '\u25bc'}</span>
      </button>

      {/* Faction Bars */}
      <div className="p-3 space-y-3">
        {factions.map(faction => {
          const rep = getReputation(faction.id)
          const level = getReputationLevel(faction.id)
          const barPercent = ((rep + 100) / 200) * 100

          return (
            <div
              key={faction.id}
              className="relative"
              onMouseEnter={() => setHoveredFaction(faction.id)}
              onMouseLeave={() => setHoveredFaction(null)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{faction.icon}</span>
                  <span className="text-gray-300 text-sm">{faction.name}</span>
                </div>
                <span className={`text-sm font-medium ${getReputationColorClass(rep)}`}>
                  {rep > 0 ? '+' : ''}{rep}
                </span>
              </div>

              {/* Bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 z-10" />

                {/* Reputation fill */}
                <div
                  className={`h-full transition-all duration-300 ${getReputationBarColor(rep)}`}
                  style={{ width: `${barPercent}%`, marginLeft: rep < 0 ? `${barPercent}%` : '50%', maxWidth: '50%' }}
                />
              </div>

              {/* Level Label */}
              <div className="flex justify-between text-xs mt-1">
                <span className={getReputationColorClass(rep)}>{level.name}</span>
                {hoveredFaction === faction.id && showDetails && (
                  <span className="text-gray-500">
                    {level.effects[0]}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Events (when expanded) */}
      {expanded && showDetails && (
        <div className="border-t border-gray-700 p-3">
          <h4 className="text-gray-400 text-xs mb-2">Recent Changes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {getRecentEvents(5).reverse().map((event, index) => {
              const faction = FACTIONS[event.faction]
              return (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate flex-1">
                    {faction.icon} {event.reason}
                  </span>
                  <span className={event.delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {event.delta > 0 ? '+' : ''}{event.delta}
                  </span>
                </div>
              )
            })}
            {getRecentEvents(5).length === 0 && (
              <p className="text-gray-600 italic">No reputation changes yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Inline reputation display for single faction
interface FactionReputationProps {
  factionId: FactionId
  showName?: boolean
}

export function FactionReputation({ factionId, showName = true }: FactionReputationProps) {
  const { getReputation, getReputationLevel } = useReputation()
  const faction = FACTIONS[factionId]
  const rep = getReputation(factionId)
  const level = getReputationLevel(factionId)

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{faction.icon}</span>
      {showName && <span className="text-gray-300 text-sm">{faction.name}:</span>}
      <span className={`text-sm ${getReputationColorClass(rep)}`}>
        {level.name} ({rep > 0 ? '+' : ''}{rep})
      </span>
    </div>
  )
}

// Reputation change toast notification
interface ReputationToastProps {
  faction: FactionId
  delta: number
  reason: string
  onDismiss: () => void
}

export function ReputationToast({ faction, delta, reason, onDismiss }: ReputationToastProps) {
  const factionData = FACTIONS[faction]

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-20 right-4 p-3 rounded-lg shadow-lg cursor-pointer z-40 border ${
        delta > 0 ? 'bg-emerald-900/90 border-emerald-500' : 'bg-red-900/90 border-red-500'
      }`}
      onClick={onDismiss}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{factionData.icon}</span>
        <div>
          <p className={`text-sm font-bold ${delta > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {factionData.name} {delta > 0 ? '+' : ''}{delta}
          </p>
          <p className="text-xs text-gray-400">{reason}</p>
        </div>
      </div>
    </div>
  )
}

// Full reputation screen (modal)
interface ReputationScreenProps {
  onClose: () => void
}

export function ReputationScreen({ onClose }: ReputationScreenProps) {
  const { getReputation, getReputationLevel, getAllFactions, getRecentEvents, getPriceModifier, getInteractionBonus } = useReputation()
  const factions = getAllFactions()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-gray-200 text-xl">Faction Standings</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {factions.map(faction => {
            const rep = getReputation(faction.id)
            const level = getReputationLevel(faction.id)
            const priceModifier = getPriceModifier(faction.id)
            const interactionBonus = getInteractionBonus(faction.id)

            return (
              <div key={faction.id} className="border border-gray-700 rounded-lg p-4">
                {/* Faction Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{faction.icon}</span>
                    <div>
                      <h3 className="text-gray-200">{faction.name}</h3>
                      <p className="text-gray-500 text-xs">{faction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getReputationColorClass(rep)}`}>
                      {rep > 0 ? '+' : ''}{rep}
                    </p>
                    <p className={`text-sm ${getReputationColorClass(rep)}`}>{level.name}</p>
                  </div>
                </div>

                {/* Effects */}
                <div className="bg-gray-800 rounded p-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Price Modifier:</span>
                    <span className={priceModifier < 1 ? 'text-emerald-400' : priceModifier > 1 ? 'text-red-400' : 'text-gray-300'}>
                      {priceModifier < 1 ? `-${Math.round((1 - priceModifier) * 100)}%` : priceModifier > 1 ? `+${Math.round((priceModifier - 1) * 100)}%` : 'Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Interaction Bonus:</span>
                    <span className={interactionBonus > 0 ? 'text-emerald-400' : interactionBonus < 0 ? 'text-red-400' : 'text-gray-300'}>
                      {interactionBonus > 0 ? `+${interactionBonus}` : interactionBonus < 0 ? interactionBonus : '0'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {level.effects.join(' | ')}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Reputation Scale Reference */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="text-gray-400 text-sm mb-2">Reputation Scale</h4>
            <div className="grid grid-cols-3 gap-1 text-xs">
              {REPUTATION_LEVELS.map(level => (
                <span key={level.name} className={getReputationColorClass(level.minRep)}>
                  {level.minRep}: {level.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReputationBar
