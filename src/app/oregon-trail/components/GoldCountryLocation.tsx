'use client'

import React, { useState, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { getGoldCountryLocation, type GoldCountryLocation as LocationType } from '../data/goldCountryLocations'
import {
  getNPCsAtLocation,
  getNPCQuests,
  isQuestAvailable,
  QUEST_CATEGORY_INFO,
  type GoldCountryNPC,
  type GoldCountryQuest,
  type MoralChoice,
  type QuestReward,
} from '../data/goldCountryNPCs'
import {
  getSearchAreasForLocation,
  resolveSearch,
  type SearchArea,
  type SearchFinding,
} from '../data/goldCountryEncounters'

interface GoldCountryLocationProps {
  locationId: string
  onReturnToMap: () => void
  onOpenSettlement: () => void  // Only used at bobr_cabin
}

type LocationView = 'main' | 'npc' | 'quest' | 'moral_choice' | 'quest_outcome' | 'search' | 'search_result' | 'shop'

export function GoldCountryLocation({
  locationId,
  onReturnToMap,
  onOpenSettlement,
}: GoldCountryLocationProps) {
  const { state, markAreaSearched, addInventoryItem, completeQuest, completeQuestWithReward, advanceGoldCountryDay } = useOregonTrail()
  const { earnGood } = useKarmaWallet()

  const [view, setView] = useState<LocationView>('main')
  const [selectedNPC, setSelectedNPC] = useState<GoldCountryNPC | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<GoldCountryQuest | null>(null)
  const [selectedSearchArea, setSelectedSearchArea] = useState<SearchArea | null>(null)
  const [searchResult, setSearchResult] = useState<SearchFinding | null>(null)
  const [npcDialogueIndex, setNpcDialogueIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [questOutcome, setQuestOutcome] = useState<{ consequence: string; reward: QuestReward } | null>(null)

  const location = getGoldCountryLocation(locationId)
  const npcs = getNPCsAtLocation(locationId)
  const searchAreas = getSearchAreasForLocation(locationId)

  if (!location) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <p className="font-mono">ERROR: Location {locationId} not found</p>
      </div>
    )
  }

  const atmosphereColors: Record<string, string> = {
    cozy: 'from-amber-950 via-stone-950 to-black',
    historic: 'from-amber-950 via-yellow-950 to-black',
    charming: 'from-purple-950 via-stone-950 to-black',
    mysterious: 'from-indigo-950 via-stone-950 to-black',
    wondrous: 'from-cyan-950 via-stone-950 to-black',
    majestic: 'from-emerald-950 via-stone-950 to-black',
    haunting: 'from-gray-950 via-stone-950 to-black',
    ghostly: 'from-slate-950 via-stone-950 to-black',
    elegant: 'from-rose-950 via-stone-950 to-black',
    wild: 'from-green-950 via-stone-950 to-black',
  }

  const bgGradient = atmosphereColors[location.atmosphere] || 'from-stone-950 to-black'

  /** Count available (incomplete) quests for an NPC */
  const getAvailableQuestCount = (npc: GoldCountryNPC): number => {
    const quests = getNPCQuests(npc.id)
    return quests.filter(q =>
      !state.completedQuests.includes(q.id) && isQuestAvailable(q, state.completedQuests)
    ).length
  }

  const handleNPCClick = (npc: GoldCountryNPC) => {
    setSelectedNPC(npc)
    setNpcDialogueIndex(0)
    setView('npc')
  }

  const handleNextDialogue = () => {
    if (!selectedNPC) return
    setNpcDialogueIndex(prev =>
      prev < selectedNPC.dialogueLines.length - 1 ? prev + 1 : 0
    )
  }

  const handleQuestSelect = (quest: GoldCountryQuest) => {
    setSelectedQuest(quest)
    if (quest.moralChoices && quest.moralChoices.length > 0) {
      setView('moral_choice')
    } else {
      setView('quest')
    }
  }

  const handleQuestComplete = (quest: GoldCountryQuest) => {
    completeQuestWithReward(quest.id, quest.reward)
    setQuestOutcome({
      consequence: 'Quest completed successfully.',
      reward: quest.reward,
    })
    setView('quest_outcome')
    advanceGoldCountryDay(1)
  }

  const handleMoralChoice = (quest: GoldCountryQuest, choice: MoralChoice) => {
    completeQuestWithReward(quest.id, choice.reward, choice.id)
    setQuestOutcome({
      consequence: choice.consequence || 'Your choice has been made.',
      reward: choice.reward,
    })
    setView('quest_outcome')
    advanceGoldCountryDay(1)
  }

  const handleSearch = useCallback((area: SearchArea) => {
    setSelectedSearchArea(area)
    setIsSearching(true)
    setView('search')

    // Simulate search with delay
    setTimeout(() => {
      const finding = resolveSearch(area)
      setSearchResult(finding)
      setIsSearching(false)
      setView('search_result')

      if (finding) {
        markAreaSearched(area.id)
        if (finding.itemGained) addInventoryItem(finding.itemGained)
        if (finding.karmaGained) earnGood(finding.karmaGained)
      }

      advanceGoldCountryDay(1)
    }, 1500)
  }, [markAreaSearched, addInventoryItem, earnGood, advanceGoldCountryDay])

  /** Render reward summary as inline text */
  const renderRewardSummary = (reward: QuestReward) => {
    const parts: React.ReactNode[] = []
    if (reward.neutralKarma && reward.neutralKarma > 0) parts.push(<span key="nk" className="text-amber-400">+{reward.neutralKarma}🌮</span>)
    if (reward.neutralKarma && reward.neutralKarma < 0) parts.push(<span key="nk-cost" className="text-red-400">{reward.neutralKarma}🌮</span>)
    if (reward.goodKarma && reward.goodKarma > 0) parts.push(<span key="gk" className="text-green-400">+{reward.goodKarma}🍪</span>)
    if (reward.badKarma && reward.badKarma > 0) parts.push(<span key="bk" className="text-red-400">+{reward.badKarma}🪨</span>)
    if (reward.gold && !reward.neutralKarma) parts.push(<span key="gold" className="text-amber-400">+{reward.gold}g</span>)
    if (reward.karma && !reward.goodKarma) parts.push(<span key="karma" className="text-green-400">+{reward.karma}k</span>)
    if (reward.reputation && reward.reputation > 0) parts.push(<span key="rep" className="text-blue-400">+{reward.reputation}rep</span>)
    if (reward.lawfulShift && reward.lawfulShift > 0) parts.push(<span key="law" className="text-cyan-400">lawful</span>)
    if (reward.lawfulShift && reward.lawfulShift < 0) parts.push(<span key="chaos" className="text-purple-400">chaotic</span>)
    if (reward.goodEvilShift && reward.goodEvilShift > 0) parts.push(<span key="good" className="text-green-300">good</span>)
    if (reward.goodEvilShift && reward.goodEvilShift < 0) parts.push(<span key="evil" className="text-red-300">evil</span>)
    if (reward.item) parts.push(<span key="item" className="text-green-400">item</span>)

    if (parts.length === 0) return null

    return (
      <span className="text-xs font-mono flex flex-wrap gap-2">
        {parts}
      </span>
    )
  }

  // Main location view
  if (view === 'main') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        {/* Header */}
        <header className="bg-green-950/30 border-b border-green-700/40 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-pixel text-amber-400 text-xl tracking-wider">
                {location.icon} {location.name}
              </h1>
              <p className="text-green-600 text-xs font-mono tracking-widest uppercase">
                {location.atmosphere} | {location.region}
              </p>
            </div>
            <button
              onClick={onReturnToMap}
              className="px-4 py-2 bg-green-950/50 hover:bg-green-900/50 text-green-400 text-xs font-mono rounded border border-green-700/40 transition-colors"
            >
              RETURN TO MAP
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Location Description */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-4">
            <p className="text-green-300 text-sm leading-relaxed">{location.description}</p>
            <p className="text-green-700 text-xs font-mono mt-2 italic">{location.fact}</p>
          </div>

          {/* NPCs */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-4">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-3">PEOPLE HERE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {npcs.map(npc => {
                const questCount = getAvailableQuestCount(npc)
                return (
                  <button
                    key={npc.id}
                    onClick={() => handleNPCClick(npc)}
                    className="flex items-center gap-3 p-3 bg-green-950/40 hover:bg-green-900/40 rounded-lg border border-green-800/30 hover:border-green-600/50 transition-all text-left group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{npc.portrait}</span>
                    <div>
                      <p className="text-green-300 text-sm font-mono">{npc.name}</p>
                      <p className="text-green-700 text-xs">{npc.title}</p>
                      {questCount > 0 && (
                        <span className="text-amber-500 text-xs font-mono">! {questCount} QUEST{questCount > 1 ? 'S' : ''}</span>
                      )}
                    </div>
                  </button>
                )
              })}
              {npcs.length === 0 && (
                <p className="text-green-700 text-xs font-mono col-span-2">No one is here right now...</p>
              )}
            </div>
          </div>

          {/* Search Areas */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-4">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-3">SEARCH AREAS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchAreas.map(area => {
                const searched = state.searchedAreas.includes(area.id)
                return (
                  <button
                    key={area.id}
                    onClick={() => !searched && handleSearch(area)}
                    disabled={searched}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      searched
                        ? 'bg-green-950/20 border-green-900/30 opacity-50 cursor-not-allowed'
                        : 'bg-green-950/40 hover:bg-green-900/40 border-green-800/30 hover:border-green-600/50 cursor-pointer'
                    }`}
                  >
                    <span className="text-xl">{area.icon}</span>
                    <div>
                      <p className={`text-sm font-mono ${searched ? 'text-green-700' : 'text-green-300'}`}>
                        {area.name}
                      </p>
                      <p className="text-green-700 text-xs">{area.description}</p>
                      {searched && (
                        <span className="text-green-800 text-xs font-mono">[SEARCHED]</span>
                      )}
                    </div>
                  </button>
                )
              })}
              {searchAreas.length === 0 && (
                <p className="text-green-700 text-xs font-mono col-span-2">Nothing to search here.</p>
              )}
            </div>
          </div>

          {/* Special Actions */}
          <div className="flex gap-3">
            {locationId === 'bobr_cabin' && (
              <button
                onClick={onOpenSettlement}
                className="flex-1 py-3 bg-amber-900/50 hover:bg-amber-800/60 text-amber-300 font-pixel text-sm rounded border border-amber-600/50 transition-colors"
              >
                MANAGE SETTLEMENT
              </button>
            )}
            {location.externalLink && (
              <a
                href={location.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-green-950/40 hover:bg-green-900/40 text-green-400 font-mono text-xs text-center rounded border border-green-700/40 transition-colors"
              >
                VISIT FOR REAL &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // NPC Dialogue View
  if (view === 'npc' && selectedNPC) {
    const npcQuests = getNPCQuests(selectedNPC.id)
    const availableQuests = npcQuests.filter(q =>
      !state.completedQuests.includes(q.id) && isQuestAvailable(q, state.completedQuests)
    )
    const completedNPCQuests = npcQuests.filter(q => state.completedQuests.includes(q.id))
    const lockedQuests = npcQuests.filter(q =>
      !state.completedQuests.includes(q.id) && !isQuestAvailable(q, state.completedQuests)
    )

    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        <div className="max-w-2xl mx-auto p-4 pt-8">
          {/* NPC Card */}
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{selectedNPC.portrait}</span>
              <div>
                <h2 className="text-amber-400 font-pixel text-lg">{selectedNPC.name}</h2>
                <p className="text-green-600 text-xs font-mono">{selectedNPC.title} | {location.name}</p>
              </div>
            </div>

            {/* Greeting */}
            <div className="bg-green-950/40 border border-green-800/30 rounded p-3 mb-4">
              <p className="text-green-300 text-sm italic">&ldquo;{selectedNPC.greeting}&rdquo;</p>
            </div>

            {/* Dialogue */}
            <div className="bg-black/40 border border-green-800/30 rounded p-4 min-h-[80px] mb-4">
              <p className="text-green-200 text-sm">
                &ldquo;{selectedNPC.dialogueLines[npcDialogueIndex]}&rdquo;
              </p>
            </div>

            {/* Dialogue Controls */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleNextDialogue}
                className="flex-1 py-2 bg-green-900/50 hover:bg-green-800/60 text-green-300 font-mono text-xs rounded border border-green-700/40 transition-colors"
              >
                {npcDialogueIndex < selectedNPC.dialogueLines.length - 1 ? 'CONTINUE...' : 'START OVER'}
              </button>
            </div>

            {/* Available Quests */}
            {availableQuests.length > 0 && (
              <div className="mt-2 space-y-2">
                <h3 className="text-amber-400 font-pixel text-xs tracking-wider">QUESTS AVAILABLE</h3>
                {availableQuests.map(quest => {
                  const catInfo = QUEST_CATEGORY_INFO[quest.category]
                  return (
                    <button
                      key={quest.id}
                      onClick={() => handleQuestSelect(quest)}
                      className="w-full text-left bg-amber-950/30 hover:bg-amber-950/50 border border-amber-700/40 hover:border-amber-500/60 rounded-lg p-3 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono ${catInfo.color}`}>{catInfo.icon} {catInfo.label}</span>
                        {quest.moralChoices && quest.moralChoices.length > 0 && (
                          <span className="text-purple-400 text-xs font-mono">CHOICES</span>
                        )}
                      </div>
                      <p className="text-amber-300 text-sm font-mono">{quest.title}</p>
                      <p className="text-amber-600 text-xs mt-1">{quest.description}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Locked Quests */}
            {lockedQuests.length > 0 && (
              <div className="mt-3 space-y-2">
                <h3 className="text-green-800 font-pixel text-xs tracking-wider">LOCKED QUESTS</h3>
                {lockedQuests.map(quest => (
                  <div key={quest.id} className="bg-green-950/20 border border-green-900/30 rounded-lg p-3 opacity-60">
                    <p className="text-green-700 text-sm font-mono">{quest.title}</p>
                    <p className="text-green-800 text-xs mt-1">Requires: complete &quot;{quest.requiredQuest}&quot; first</p>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Quests */}
            {completedNPCQuests.length > 0 && (
              <div className="mt-3">
                <h3 className="text-green-800 font-pixel text-xs tracking-wider mb-1">COMPLETED</h3>
                {completedNPCQuests.map(quest => (
                  <p key={quest.id} className="text-green-800 text-xs font-mono line-through">{quest.title}</p>
                ))}
              </div>
            )}

            {/* Clue Hint */}
            {selectedNPC.clueHint && (
              <div className="mt-4 bg-indigo-950/30 border border-indigo-700/40 rounded-lg p-3">
                <p className="text-indigo-400 text-xs font-mono">INVESTIGATION LEAD</p>
                <p className="text-indigo-300 text-sm mt-1 italic">&ldquo;{selectedNPC.clueHint}&rdquo;</p>
              </div>
            )}

            {/* Back button */}
            <button
              onClick={() => { setView('main'); setSelectedNPC(null); setSelectedQuest(null) }}
              className="w-full mt-4 py-2 bg-green-950/50 hover:bg-green-900/50 text-green-500 text-xs font-mono rounded border border-green-700/40 transition-colors"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quest Detail (non-moral-choice quests)
  if (view === 'quest' && selectedQuest && selectedNPC) {
    const catInfo = QUEST_CATEGORY_INFO[selectedQuest.category]
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-mono ${catInfo.color}`}>{catInfo.icon} {catInfo.label}</span>
            </div>
            <h2 className="text-amber-400 font-pixel text-lg mb-2">{selectedQuest.title}</h2>
            <p className="text-green-300 text-sm mb-3">{selectedQuest.description}</p>

            <div className="bg-green-950/40 border border-green-800/30 rounded p-3 mb-4">
              <p className="text-green-600 text-xs font-mono mb-1">OBJECTIVE</p>
              <p className="text-green-200 text-sm">{selectedQuest.objective}</p>
            </div>

            <div className="bg-green-950/40 border border-green-800/30 rounded p-3 mb-4">
              <p className="text-green-600 text-xs font-mono mb-1">REWARDS</p>
              {renderRewardSummary(selectedQuest.reward)}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleQuestComplete(selectedQuest)}
                className="flex-1 py-3 bg-amber-900/50 hover:bg-amber-800/60 text-amber-300 font-pixel text-sm rounded border border-amber-600/50 transition-colors"
              >
                COMPLETE QUEST
              </button>
              <button
                onClick={() => { setView('npc'); setSelectedQuest(null) }}
                className="flex-1 py-3 bg-green-950/50 hover:bg-green-900/50 text-green-500 text-xs font-mono rounded border border-green-700/40 transition-colors"
              >
                BACK
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Moral Choice Selection
  if (view === 'moral_choice' && selectedQuest && selectedQuest.moralChoices && selectedNPC) {
    const catInfo = QUEST_CATEGORY_INFO[selectedQuest.category]
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            {/* Quest header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{selectedNPC.portrait}</span>
              <div>
                <span className={`text-xs font-mono ${catInfo.color}`}>{catInfo.icon} {catInfo.label}</span>
                <h2 className="text-amber-400 font-pixel text-lg">{selectedQuest.title}</h2>
              </div>
            </div>

            <p className="text-green-300 text-sm mb-2">{selectedQuest.description}</p>

            <div className="bg-green-950/40 border border-green-800/30 rounded p-3 mb-4">
              <p className="text-green-200 text-sm">{selectedQuest.objective}</p>
            </div>

            {/* Moral Choices */}
            <h3 className="text-purple-400 font-pixel text-xs tracking-wider mb-3">CHOOSE YOUR PATH</h3>
            <div className="space-y-3">
              {selectedQuest.moralChoices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleMoralChoice(selectedQuest, choice)}
                  className="w-full text-left bg-green-950/40 hover:bg-green-900/50 border border-green-800/30 hover:border-green-600/50 rounded-lg p-4 transition-all group"
                >
                  <p className="text-green-200 text-sm group-hover:text-green-100 mb-2">{choice.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {renderRewardSummary(choice.reward)}
                  </div>
                </button>
              ))}
            </div>

            {/* Back */}
            <button
              onClick={() => { setView('npc'); setSelectedQuest(null) }}
              className="w-full mt-4 py-2 bg-green-950/50 hover:bg-green-900/50 text-green-500 text-xs font-mono rounded border border-green-700/40 transition-colors"
            >
              BACK (decline quest)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quest Outcome (shown after completing a quest or making a moral choice)
  if (view === 'quest_outcome' && questOutcome && selectedQuest) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        <div className="max-w-2xl mx-auto p-4 pt-12">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-2">QUEST COMPLETE</h2>
            <p className="text-amber-300 font-pixel text-lg mb-4">{selectedQuest.title}</p>

            {/* Outcome narrative */}
            <div className="bg-black/40 border border-green-800/30 rounded p-4 mb-4">
              <p className="text-green-200 text-sm leading-relaxed italic">{questOutcome.consequence}</p>
            </div>

            {/* Rewards earned */}
            <div className="bg-green-950/40 border border-green-800/30 rounded p-3 mb-4">
              <p className="text-green-600 text-xs font-mono mb-2">REWARDS EARNED</p>
              <div className="space-y-1">
                {questOutcome.reward.neutralKarma && questOutcome.reward.neutralKarma > 0 && (
                  <p className="text-amber-400 text-sm font-mono">+{questOutcome.reward.neutralKarma} 🌮 Neutral Karma</p>
                )}
                {questOutcome.reward.neutralKarma && questOutcome.reward.neutralKarma < 0 && (
                  <p className="text-red-400 text-sm font-mono">{questOutcome.reward.neutralKarma} 🌮 Spent</p>
                )}
                {questOutcome.reward.goodKarma && questOutcome.reward.goodKarma > 0 && (
                  <p className="text-green-400 text-sm font-mono">+{questOutcome.reward.goodKarma} 🍪 Good Karma</p>
                )}
                {questOutcome.reward.badKarma && questOutcome.reward.badKarma > 0 && (
                  <p className="text-red-400 text-sm font-mono">+{questOutcome.reward.badKarma} 🪨 Bad Karma</p>
                )}
                {questOutcome.reward.reputation && questOutcome.reward.reputation > 0 && (
                  <p className="text-blue-400 text-sm font-mono">+{questOutcome.reward.reputation} Reputation</p>
                )}
                {questOutcome.reward.lawfulShift && questOutcome.reward.lawfulShift > 0 && (
                  <p className="text-cyan-400 text-sm font-mono">Alignment shift: Lawful</p>
                )}
                {questOutcome.reward.lawfulShift && questOutcome.reward.lawfulShift < 0 && (
                  <p className="text-purple-400 text-sm font-mono">Alignment shift: Chaotic</p>
                )}
                {questOutcome.reward.goodEvilShift && questOutcome.reward.goodEvilShift > 0 && (
                  <p className="text-green-300 text-sm font-mono">Alignment shift: Good</p>
                )}
                {questOutcome.reward.goodEvilShift && questOutcome.reward.goodEvilShift < 0 && (
                  <p className="text-red-300 text-sm font-mono">Alignment shift: Evil</p>
                )}
                {questOutcome.reward.item && (
                  <p className="text-green-400 text-sm font-mono">Item: {questOutcome.reward.item.replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>

            <p className="text-green-700 text-xs font-mono mb-4">One day has passed.</p>

            <button
              onClick={() => {
                setView('npc')
                setSelectedQuest(null)
                setQuestOutcome(null)
              }}
              className="w-full py-3 bg-green-900/50 hover:bg-green-800/60 text-green-300 font-mono text-xs rounded border border-green-700/40 transition-colors"
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Search In Progress
  if (view === 'search' && isSearching) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400 flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">{selectedSearchArea?.icon || '🔍'}</div>
          <p className="text-green-400 font-pixel text-sm animate-pulse">SEARCHING...</p>
          <p className="text-green-700 text-xs font-mono mt-2">{selectedSearchArea?.name}</p>
        </div>
      </div>
    )
  }

  // Search Result
  if (view === 'search_result') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-green-400`}>
        <div className="max-w-2xl mx-auto p-4 pt-12">
          <div className="bg-green-950/30 border border-green-700/40 rounded-lg p-6">
            <h2 className="text-amber-400 font-pixel text-sm tracking-wider mb-4">SEARCH RESULT</h2>

            {searchResult ? (
              <>
                <div className={`p-4 rounded-lg border mb-4 ${
                  searchResult.isClue
                    ? 'bg-amber-950/30 border-amber-700/40'
                    : 'bg-green-950/40 border-green-800/30'
                }`}>
                  <p className="text-green-200 text-sm">{searchResult.description}</p>
                  {searchResult.isClue && (
                    <p className="text-amber-400 text-xs font-mono mt-2">INVESTIGATION CLUE FOUND!</p>
                  )}
                  {searchResult.goldGained && (
                    <p className="text-amber-300 text-xs font-mono mt-1">+{searchResult.goldGained} gold</p>
                  )}
                  {searchResult.itemGained && (
                    <p className="text-green-400 text-xs font-mono mt-1">Item: {searchResult.itemGained.replace(/_/g, ' ')}</p>
                  )}
                  {searchResult.karmaGained && (
                    <p className="text-green-400 text-xs font-mono mt-1">+{searchResult.karmaGained} karma</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-green-950/40 border border-green-800/30 p-4 rounded-lg mb-4">
                <p className="text-green-600 text-sm">You search carefully but find nothing of note.</p>
              </div>
            )}

            <p className="text-green-700 text-xs font-mono mb-4">One day has passed.</p>

            <button
              onClick={() => { setView('main'); setSearchResult(null); setSelectedSearchArea(null) }}
              className="w-full py-3 bg-green-900/50 hover:bg-green-800/60 text-green-300 font-mono text-xs rounded border border-green-700/40 transition-colors"
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GoldCountryLocation
