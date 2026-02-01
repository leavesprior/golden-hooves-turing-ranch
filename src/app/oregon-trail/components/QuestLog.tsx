'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import {
  getAllQuests,
  isQuestAvailable,
  QUEST_CATEGORY_INFO,
  type GoldCountryQuest,
  type QuestCategory,
} from '../data/goldCountryNPCs'

interface QuestLogProps {
  onClose: () => void
}

type QuestTab = 'active' | 'completed' | 'investigation'
type CategoryFilter = 'all' | QuestCategory

export function QuestLog({ onClose }: QuestLogProps) {
  const { state } = useOregonTrail()
  const [activeTab, setActiveTab] = useState<QuestTab>('active')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const allQuests = getAllQuests()
  const activeQuests = allQuests.filter(q =>
    !state.completedQuests.includes(q.id) && isQuestAvailable(q, state.completedQuests)
  )
  const lockedQuests = allQuests.filter(q =>
    !state.completedQuests.includes(q.id) && !isQuestAvailable(q, state.completedQuests)
  )
  const completedQuests = allQuests.filter(q => state.completedQuests.includes(q.id))

  // Apply category filter
  const filterByCategory = (quests: GoldCountryQuest[]) => {
    if (categoryFilter === 'all') return quests
    return quests.filter(q => q.category === categoryFilter)
  }

  const filteredActive = filterByCategory(activeQuests)
  const filteredCompleted = filterByCategory(completedQuests)

  const tabs: { id: QuestTab; label: string; count: number }[] = [
    { id: 'active', label: 'ACTIVE', count: activeQuests.length },
    { id: 'completed', label: 'DONE', count: completedQuests.length },
    { id: 'investigation', label: 'CASE', count: 0 },
  ]

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'ALL' },
    ...Object.entries(QUEST_CATEGORY_INFO).map(([id, info]) => ({
      id: id as CategoryFilter,
      label: `${info.icon} ${info.label}`,
    })),
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
        }}
      />

      <div className="bg-green-950/90 border-2 border-green-700/60 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col shadow-[0_0_30px_rgba(34,197,94,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-700/40">
          <h2 className="text-amber-400 font-pixel text-sm tracking-wider">QUEST LOG</h2>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-400 text-xs font-mono transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-700/40">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-mono transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-400 bg-green-900/30 border-b-2 border-amber-500'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Category Filter (for active and completed tabs) */}
        {(activeTab === 'active' || activeTab === 'completed') && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-green-700/30">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-green-800/40 text-green-300 border border-green-600/50'
                    : 'text-green-700 hover:text-green-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'active' && (
            <>
              {filteredActive.length === 0 ? (
                <p className="text-green-700 text-xs font-mono text-center py-8">
                  {categoryFilter === 'all'
                    ? 'No active quests. Talk to NPCs to find quests.'
                    : `No active ${QUEST_CATEGORY_INFO[categoryFilter as QuestCategory]?.label || ''} quests.`
                  }
                </p>
              ) : (
                filteredActive.map(quest => (
                  <QuestCard key={quest.id} quest={quest} completed={false} />
                ))
              )}

              {/* Locked quests section */}
              {lockedQuests.length > 0 && categoryFilter === 'all' && (
                <>
                  <div className="pt-2 border-t border-green-900/30">
                    <p className="text-green-800 text-xs font-mono mb-2">LOCKED ({lockedQuests.length})</p>
                  </div>
                  {lockedQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} completed={false} locked={true} />
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {filteredCompleted.length === 0 ? (
                <p className="text-green-700 text-xs font-mono text-center py-8">
                  No completed quests yet.
                </p>
              ) : (
                filteredCompleted.map(quest => (
                  <QuestCard key={quest.id} quest={quest} completed={true} />
                ))
              )}
            </>
          )}

          {activeTab === 'investigation' && (
            <div className="space-y-3">
              <div className="bg-green-950/40 border border-green-800/30 rounded-lg p-3">
                <h3 className="text-amber-400 font-pixel text-xs tracking-wider mb-2">MAIN INVESTIGATION</h3>
                <p className="text-green-300 text-sm">Track down the suspect across Gold Country</p>
                <p className="text-green-600 text-xs font-mono mt-2">
                  Clues found: {state.searchedAreas.length}
                </p>
                <p className="text-green-600 text-xs font-mono">
                  Locations searched: {state.searchedAreas.length}
                </p>
              </div>

              {/* Inventory */}
              <div className="bg-green-950/40 border border-green-800/30 rounded-lg p-3">
                <h3 className="text-amber-400 font-pixel text-xs tracking-wider mb-2">EVIDENCE</h3>
                {state.inventory.length === 0 ? (
                  <p className="text-green-700 text-xs font-mono">No evidence collected yet.</p>
                ) : (
                  <div className="space-y-1">
                    {state.inventory.map((item, i) => (
                      <div key={i} className="text-green-400 text-xs font-mono flex items-center gap-2">
                        <span className="text-green-700">&#9679;</span>
                        {item.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discovery Progress */}
              <div className="bg-green-950/40 border border-green-800/30 rounded-lg p-3">
                <h3 className="text-amber-400 font-pixel text-xs tracking-wider mb-2">DISCOVERY</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-green-600">Locations discovered</span>
                    <span className="text-green-300">{state.discoveredGoldLocations.length}/11</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Quests completed</span>
                    <span className="text-green-300">{state.completedQuests.length}/{allQuests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Days in Gold Country</span>
                    <span className="text-green-300">{state.goldCountryDay}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuestCard({ quest, completed, locked }: { quest: GoldCountryQuest; completed: boolean; locked?: boolean }) {
  const catInfo = QUEST_CATEGORY_INFO[quest.category]

  return (
    <div className={`rounded-lg border p-3 ${
      locked
        ? 'bg-green-950/10 border-green-900/20 opacity-50'
        : completed
          ? 'bg-green-950/20 border-green-900/30'
          : 'bg-green-950/40 border-green-800/30'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono ${catInfo.color}`}>{catInfo.icon} {catInfo.label}</span>
            {quest.moralChoices && quest.moralChoices.length > 0 && !completed && (
              <span className="text-purple-500 text-xs font-mono">CHOICES</span>
            )}
          </div>
          <p className={`text-sm font-mono ${
            locked ? 'text-green-800' : completed ? 'text-green-700 line-through' : 'text-green-300'
          }`}>
            {quest.title}
          </p>
          <p className="text-green-700 text-xs mt-1">{quest.description}</p>
        </div>
        {completed && (
          <span className="text-green-700 text-xs font-mono">[DONE]</span>
        )}
        {locked && (
          <span className="text-green-800 text-xs font-mono">[LOCKED]</span>
        )}
      </div>

      {!completed && !locked && (
        <div className="mt-2 pt-2 border-t border-green-900/30">
          <p className="text-green-600 text-xs font-mono mb-1">
            Objective: {quest.objective}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {quest.reward.neutralKarma && quest.reward.neutralKarma > 0 && (
              <span className="text-amber-500">+{quest.reward.neutralKarma}🌮</span>
            )}
            {quest.reward.goodKarma && quest.reward.goodKarma > 0 && (
              <span className="text-green-500">+{quest.reward.goodKarma}🍪</span>
            )}
            {quest.reward.gold && !quest.reward.neutralKarma && (
              <span className="text-amber-600">+{quest.reward.gold}g</span>
            )}
            {quest.reward.karma && !quest.reward.goodKarma && (
              <span className="text-green-600">+{quest.reward.karma}k</span>
            )}
            {quest.reward.reputation && quest.reward.reputation > 0 && (
              <span className="text-blue-500">+{quest.reward.reputation}rep</span>
            )}
            {quest.reward.item && (
              <span className="text-green-500">item</span>
            )}
          </div>
        </div>
      )}

      {locked && quest.requiredQuest && (
        <p className="text-green-800 text-xs font-mono mt-2">
          Requires: {quest.requiredQuest}
        </p>
      )}
    </div>
  )
}

export default QuestLog
