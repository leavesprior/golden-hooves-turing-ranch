'use client'

import React, { useState } from 'react'

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed'

export interface QuestObjectiveDisplay {
  id: string
  description: string
  completed: boolean
  optional?: boolean
}

export interface QuestLogEntry {
  id: string
  title: string
  description: string
  chapter: number
  status: QuestStatus
  activePath?: string // Which path the player chose
  pathName?: string
  objectives: QuestObjectiveDisplay[]
  rewards?: {
    xp?: number
    gold?: number
    reputation?: string
  }
  // Phase 2.5 — prerequisite-blocked quests appear only in the "all" tab,
  // ghosted, with an "Unlocks after: ..." hint. Absent or false means the
  // quest is not blocked and renders normally.
  blocked?: boolean
  blockReason?: string
}

interface QuestLogProps {
  quests: QuestLogEntry[]
  onClose: () => void
  onSelectQuest?: (questId: string) => void
  activeQuestId?: string
}

type TabFilter = 'active' | 'available' | 'completed' | 'all'

const STATUS_ICONS: Record<QuestStatus, string> = {
  available: '\u2753',
  active: '\u25B6\uFE0F',
  completed: '\u2705',
  failed: '\u274C',
}

const STATUS_COLORS: Record<QuestStatus, string> = {
  available: 'text-[var(--pixel-gold-light)]',
  active: 'text-[var(--pixel-forest-light)]',
  completed: 'text-[var(--pixel-sky-light)]',
  failed: 'text-[var(--pixel-fire-red)]',
}

export function QuestLog({ quests, onClose, onSelectQuest, activeQuestId }: QuestLogProps) {
  const [tab, setTab] = useState<TabFilter>('active')
  const [expandedId, setExpandedId] = useState<string | null>(activeQuestId ?? null)

  const filtered = quests.filter(q => {
    // Prerequisite-blocked quests show only in "all" so we don't tease the
    // player with content they can't take yet.
    if (q.blocked) return tab === 'all'
    // Phase 3.5 RED #4 fix: ACTIVE means accepted-and-in-progress only.
    // Offered-but-not-accepted quests now live under AVAILABLE so the tab
    // counter stops contradicting the list contents.
    if (tab === 'active') return q.status === 'active'
    if (tab === 'available') return q.status === 'available'
    if (tab === 'completed') return q.status === 'completed' || q.status === 'failed'
    return true
  })

  const activeCount = quests.filter(q => !q.blocked && q.status === 'active').length
  const availableCount = quests.filter(q => !q.blocked && q.status === 'available').length
  const completedCount = quests.filter(q => !q.blocked && q.status === 'completed').length

  return (
    <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)] min-h-[300px]">
      {/* Header */}
      <div className="p-3 border-b-2 border-[var(--pixel-ui-border)] flex justify-between items-center">
        <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
          {'\uD83D\uDCDC'} QUEST LOG
        </span>
        <button
          onClick={onClose}
          className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] px-2 py-1 border border-[var(--pixel-ui-border)]"
        >
          CLOSE
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[var(--pixel-ui-border)]">
        {(['active', 'available', 'completed', 'all'] as TabFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-[var(--font-pixel)] text-[9px] transition-all ${
              tab === t
                ? 'bg-[var(--pixel-bg-mid)] text-[var(--pixel-gold-light)] border-b-2 border-[var(--pixel-gold-mid)]'
                : 'text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)]'
            }`}
          >
            {t === 'active'
              ? `ACTIVE (${activeCount})`
              : t === 'available'
                ? `AVAILABLE (${availableCount})`
                : t === 'completed'
                  ? `DONE (${completedCount})`
                  : 'ALL'}
          </button>
        ))}
      </div>

      {/* Quest List */}
      <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-50 text-center py-8">
            {tab === 'active'
              ? 'No active quests. Accept a quest from the AVAILABLE tab.'
              : tab === 'available'
                ? 'No quests available. Talk to NPCs to find work.'
                : 'No completed quests yet.'}
          </p>
        ) : (
          filtered.map(quest => {
            const isExpanded = expandedId === quest.id
            const completedObjectives = quest.objectives.filter(o => o.completed).length
            const totalObjectives = quest.objectives.filter(o => !o.optional).length

            return (
              <div
                key={quest.id}
                className={`border-2 transition-all ${
                  quest.blocked
                    ? 'border-dashed border-[var(--pixel-ui-border)]/40 bg-black/10 opacity-60'
                    : isExpanded
                      ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-bg-mid)]'
                      : 'border-[var(--pixel-ui-border)] bg-black/20'
                }`}
              >
                {/* Quest Header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : quest.id)
                    onSelectQuest?.(quest.id)
                  }}
                  className="w-full text-left p-2 flex items-start gap-2"
                >
                  <span className="text-sm shrink-0">{STATUS_ICONS[quest.status]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-[var(--font-pixel)] text-[10px] ${STATUS_COLORS[quest.status]}`}>
                        {quest.title}
                      </span>
                      <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-40">
                        Ch.{quest.chapter}
                      </span>
                    </div>
                    {quest.status === 'active' && totalObjectives > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex-1 h-1 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
                          <div
                            className="h-full bg-[var(--pixel-forest-light)]"
                            style={{ width: `${(completedObjectives / totalObjectives) * 100}%` }}
                          />
                        </div>
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50">
                          {completedObjectives}/{totalObjectives}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-40">
                    {isExpanded ? '\u25BC' : '\u25B6'}
                  </span>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-[var(--pixel-ui-border)]/30">
                    {quest.blocked && quest.blockReason && (
                      <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)] mb-2 italic">
                        {'🔒'} {quest.blockReason}
                      </p>
                    )}
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70 mb-2">
                      {quest.description}
                    </p>

                    {quest.pathName && (
                      <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)] mb-2">
                        Path: {quest.pathName}
                      </p>
                    )}

                    {/* Objectives */}
                    <div className="space-y-1">
                      {quest.objectives.map(obj => (
                        <div key={obj.id} className="flex items-start gap-2">
                          <span className={`font-[var(--font-pixel)] text-[8px] ${
                            obj.completed ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-ui-text)]'
                          }`}>
                            {obj.completed ? '\u2611' : '\u2610'}
                          </span>
                          <span className={`font-[var(--font-pixel)] text-[8px] ${
                            obj.completed ? 'text-[var(--pixel-ui-text)] opacity-50 line-through' : 'text-[var(--pixel-ui-text)]'
                          }`}>
                            {obj.description}
                            {obj.optional && (
                              <span className="text-[var(--pixel-ui-text)] opacity-30 ml-1">(optional)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Rewards preview */}
                    {quest.rewards && quest.status !== 'completed' && (
                      <div className="mt-2 pt-2 border-t border-[var(--pixel-ui-border)]/20">
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)]">
                          REWARDS:{' '}
                          {quest.rewards.xp && `${quest.rewards.xp} XP `}
                          {quest.rewards.gold && `${quest.rewards.gold} Gold `}
                          {quest.rewards.reputation && quest.rewards.reputation}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t-2 border-[var(--pixel-ui-border)] text-center">
        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-40">
          {quests.length} total quests | {activeCount} active | {completedCount} completed
        </span>
      </div>
    </div>
  )
}
