'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'
import { editorialForExplorePlace } from '@/lib/goldCountryEditorial'
import {
  caseForLocation,
  clueWorked,
  editorialTownId,
  readTalkedNpcs,
  writeLevel2Stamp,
  writeTalkedNpc,
} from '@/lib/goldCountryLevel2'
import {
  frontsForLocation,
  outdoorSearchIds,
  posterForLocation,
  posterPinsForLocation,
  readArrests,
  readBought,
  readPostersSeen,
  streetNpcs,
  writeArrest,
  writeBought,
  writePosterSeen,
  type ShopGood,
  type TownFront,
} from '@/lib/goldCountryStreet'
import { GoldCountryShopInterior } from './GoldCountryShopInterior'
import { getGoldCountryLocation, getLocationSites } from '../data/goldCountryLocations'
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

// Haversine distance in km for GPS correlation with location coords (from places.json / Google Maps)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  const { state, markAreaSearched, addInventoryItem, completeQuest, completeQuestWithReward, advanceGoldCountryDay, getShopDiscount } = useOregonTrail()
  const { earnGood, earnNeutral, spendNeutral, canAfford, balance } = useKarmaWallet()

  const [view, setView] = useState<LocationView>('main')
  const [selectedNPC, setSelectedNPC] = useState<GoldCountryNPC | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<GoldCountryQuest | null>(null)
  const [selectedSearchArea, setSelectedSearchArea] = useState<SearchArea | null>(null)
  const [searchResult, setSearchResult] = useState<SearchFinding | null>(null)
  const [npcDialogueIndex, setNpcDialogueIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [questOutcome, setQuestOutcome] = useState<{ consequence: string; reward: QuestReward } | null>(null)
  const [selectedFront, setSelectedFront] = useState<TownFront | null>(null)
  const [shopNote, setShopNote] = useState<string | null>(null)
  const [boughtIds, setBoughtIds] = useState<string[]>(() => readBought())
  const [arrests, setArrests] = useState<string[]>(() => readArrests())
  const [postersSeen, setPostersSeen] = useState<string[]>(() => readPostersSeen())

  const location = getGoldCountryLocation(locationId)
  const level2Case = caseForLocation(locationId)
  const npcs = getNPCsAtLocation(locationId)
  const searchAreas = getSearchAreasForLocation(locationId)
  const fronts = frontsForLocation(locationId)
  const onStreetPeople = streetNpcs(locationId, npcs)
  const outdoorIds = outdoorSearchIds(locationId, searchAreas.map((a) => a.id))
  const outdoorSearches = searchAreas.filter((a) => outdoorIds.includes(a.id))
  const poster = posterForLocation(locationId)
  const posterPins = posterPinsForLocation(locationId)

  // GPS for physical location correlation (device hardware via browser Geolocation API + haversine)
  // Correlates with location.coordinates (from Google Maps verified + places.json)
  // If within ~2-5km, 'physically present' – SADDLE bonuses, historical AR (PlaceBackdrop), shop deals, NPC/bounty engagement
  // TODO(P2): consume useVerifiedPresence (lib/useVerifiedPresence.ts) — keeps accuracy, per-call radius, dwell tracking
  const [isPhysicallyPresent, setIsPhysicallyPresent] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle'|'requesting'|'granted'|'denied'|'error'>('idle')
  const [currentDist, setCurrentDist] = useState<number | null>(null)
  const requestLocationGPS = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation || !location?.coordinates) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistance(
          pos.coords.latitude, pos.coords.longitude,
          location.coordinates.lat, location.coordinates.lng
        )
        setCurrentDist(dist)
        setIsPhysicallyPresent(dist < 5) // ~5km threshold for presence bonuses (tunable)
        setGpsStatus('granted')
      },
      () => {
        setGpsStatus('denied')
        setIsPhysicallyPresent(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }, [location])
  useEffect(() => {
    requestLocationGPS()
  }, [requestLocationGPS])

  useEffect(() => {
    setBoughtIds(readBought())
    setArrests(readArrests())
    setPostersSeen(readPostersSeen())
  }, [locationId, state.phase, state.inventory.length])

  // Hook must be called before any early return (React rules-of-hooks)
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
        writeLevel2Stamp(locationId)
        if (finding.itemGained) addInventoryItem(finding.itemGained)
        if (finding.karmaGained) earnGood(finding.karmaGained)
      }

      advanceGoldCountryDay(1)
    }, 1500)
  }, [markAreaSearched, addInventoryItem, earnGood, advanceGoldCountryDay, locationId])

  const enterFront = useCallback((front: TownFront) => {
    setSelectedFront(front)
    setShopNote(null)
    setView('shop')
    writeLevel2Stamp(locationId)
  }, [locationId])

  const priceOf = useCallback((good: ShopGood) => {
    const keeperId = selectedFront?.keeperNpcId
    const mult = keeperId ? getShopDiscount(keeperId) : 1
    const presence = isPhysicallyPresent ? 0.85 : 1
    return Math.max(1, Math.floor(good.price * mult * presence))
  }, [getShopDiscount, selectedFront, isPhysicallyPresent])

  const handleBuy = useCallback(async (good: ShopGood) => {
    const price = priceOf(good)
    const ok = await spendNeutral(price, `Bought ${good.name} at ${selectedFront?.name || 'store'}`)
    if (!ok) {
      setShopNote(`Not enough 🌮 for ${good.name}.`)
      return
    }
    addInventoryItem(good.itemId)
    setBoughtIds(writeBought(good.id))
    setShopNote(`Bought ${good.name} for ${price}🌮.`)
  }, [priceOf, spendNeutral, addInventoryItem, selectedFront])

  const handleConfront = useCallback(async (npc: GoldCountryNPC) => {
    if (!poster || poster.hideNpcId !== npc.id) return
    setArrests(writeArrest(npc.id))
    writeLevel2Stamp(locationId)
    await earnNeutral(poster.bounty, `Took ${poster.alias}`)
    setShopNote(`Taken. ${poster.bounty}🌮 bounty. The poster is satisfied.`)
  }, [poster, locationId, earnNeutral])

  if (!location) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <p className="font-mono">ERROR: Location {locationId} not found</p>
      </div>
    )
  }

  const handleNPCClick = (npc: GoldCountryNPC) => {
    writeTalkedNpc(npc.id)
    writeLevel2Stamp(locationId)
    setSelectedNPC(npc)
    setNpcDialogueIndex(0)
    setView('npc')
  }

  const returnFromNpc = () => {
    setSelectedNPC(null)
    setSelectedQuest(null)
    setView(selectedFront ? 'shop' : 'main')
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
    const art = editorialForExplorePlace(locationId) || editorialForExplorePlace(editorialTownId(locationId))
    const talked = typeof window !== 'undefined' ? readTalkedNpcs() : []
    return (
      <div className="west-face-shell min-h-screen">
        <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
          <div>
            <p className="west-face-eyebrow">Level 2 · {level2Case ? `${level2Case.year} · ${level2Case.title}` : location.region}</p>
            <h1 className="west-face-title text-3xl">{location.name}</h1>
            <p className="west-face-body mt-1 max-w-xl">{level2Case?.warrant ?? location.fact}</p>
          </div>
          <button type="button" className="west-face-pill shrink-0" onClick={onReturnToMap}>
            Map
          </button>
        </header>

        <div className="relative min-h-[52vh] sm:min-h-[64vh]">
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          ) : (
            <PlaceBackdrop id={locationId} className="absolute inset-0 h-full w-full" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          {fronts.map((front) => {
            const ids = [front.keeperNpcId, ...front.patronNpcIds, ...front.searchAreaIds].filter(
              (id): id is string => !!id,
            )
            const done = level2Case
              ? level2Case.clues.some((clue) => ids.includes(clue.id) && clueWorked(clue, state.searchedAreas, talked))
              : false
            return (
              <button
                key={front.id}
                type="button"
                title={front.name}
                onClick={() => enterFront(front)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 min-h-11 rounded-sm border px-3 py-1 font-serif text-sm shadow-lg ${
                  done
                    ? 'border-emerald-400/70 bg-black/70 text-emerald-100'
                    : 'border-[#e8dcc4]/80 bg-black/75 text-[#e8dcc4]'
                }`}
                style={{ left: `${front.x}%`, top: `${front.y}%` }}
              >
                {front.name}
              </button>
            )
          })}
          {onStreetPeople.map((npc) => (
            <button
              key={npc.id}
              type="button"
              title={npc.name}
              onClick={() => handleNPCClick(npc)}
              className="absolute z-10 -translate-x-1/2 -translate-y-full min-h-11 rounded-sm bg-[#e8dcc4] px-2 py-1 font-serif text-sm text-[#1a1208] shadow-lg"
              style={{ left: `${level2Case?.clues.find((c) => c.id === npc.id)?.x ?? 70}%`, top: `${level2Case?.clues.find((c) => c.id === npc.id)?.y ?? 80}%` }}
            >
              {npc.name}
            </button>
          ))}
          {outdoorSearches.map((area) => {
            const searched = state.searchedAreas.includes(area.id)
            const clue = level2Case?.clues.find((c) => c.id === area.id)
            return (
              <button
                key={area.id}
                type="button"
                disabled={searched}
                onClick={() => handleSearch(area)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 min-h-11 rounded-full border px-3 py-1 font-serif text-sm shadow-lg ${
                  searched ? 'border-emerald-400/70 bg-black/70 text-emerald-100' : 'border-amber-300/80 bg-black/75 text-[#e8dcc4]'
                }`}
                style={{ left: `${clue?.x ?? 20}%`, top: `${clue?.y ?? 30}%` }}
              >
                {area.name}
              </button>
            )
          })}
          {posterPins.map((pin) => (
            <button
              key={`${pin.poster.id}-${pin.front.id}`}
              type="button"
              title={`Posted outside ${pin.front.name}`}
              onClick={() => setPostersSeen(writePosterSeen(pin.poster.id))}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 min-h-11 rounded-sm border border-red-400/70 bg-black/80 px-3 py-1 font-serif text-sm text-red-100 shadow-lg"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              {postersSeen.includes(pin.poster.id) ? `Wanted · ${pin.front.name}` : `Warrant · ${pin.front.name}`}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <p className="west-face-body">{location.description}</p>
          {level2Case && (
            <div className="west-face-paper space-y-3">
              <p className="west-face-eyebrow">Case · {level2Case.year} · {level2Case.title}</p>
              <p className="font-serif text-[#e8dcc4]">{level2Case.verb} Work the three pins on the painting.</p>
              <p className="west-face-body"><span className="text-amber-200/90">Then. </span>{level2Case.then}</p>
              <p className="west-face-body"><span className="text-amber-200/90">Becomes. </span>{level2Case.becomes}</p>
              <p className="west-face-body"><span className="text-amber-200/90">Now. </span>{level2Case.now}</p>
              <p className="font-serif text-sm text-[#cbbfa6]"><span className="text-amber-200/90">The three pins. </span>{level2Case.thinking}</p>
            </div>
          )}

          <p className="text-sm text-[#b8a88a] font-serif">
            GPS {gpsStatus}{currentDist !== null ? ` · ${currentDist.toFixed(1)} km` : ''}
            {isPhysicallyPresent ? ' · you are on the ground' : ' · optional'}
            {' '}
            <button type="button" className="west-face-pill ml-2" onClick={requestLocationGPS}>Retry GPS</button>
          </p>

          <p className="west-face-body text-sm">
            On the street you see shop fronts and people who are actually outside. Names behind a door wait until you step in.
            {balance ? ` · ${balance.neutral}🌮` : ''}
          </p>

          {locationId === 'bobr_cabin' && (
            <button
              onClick={onOpenSettlement}
              className="west-face-pill w-full justify-center"
            >
              Manage settlement
            </button>
          )}

          {getLocationSites(location).length > 0 && (
            <div className="west-face-paper">
              <h2 className="west-face-eyebrow mb-3">Visit for real</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getLocationSites(location).map((site) => (
                  <li key={site.url}>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="west-face-pill w-full justify-start min-h-11"
                    >
                      {site.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
      <div className={`west-face-shell min-h-screen`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          }}
        />

        <div className="max-w-2xl mx-auto p-4 pt-8">
          {/* The place itself stays on screen while talking (visual64) */}
          <PlaceBackdrop id={location.id} className="mb-4 h-32 rounded-lg border border-green-700/40" />
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
              onClick={returnFromNpc}
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
      <div className={`west-face-shell min-h-screen`}>
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
      <div className={`west-face-shell min-h-screen`}>
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
      <div className={`west-face-shell min-h-screen`}>
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
      <div className={`west-face-shell min-h-screen flex items-center justify-center`}>
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
      <div className={`west-face-shell min-h-screen`}>
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
              onClick={() => {
                setSearchResult(null)
                setSelectedSearchArea(null)
                setView(selectedFront ? 'shop' : 'main')
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

  if (view === 'shop') {
    const front = selectedFront || fronts[0]
    if (!front) {
      return (
        <div className="west-face-shell min-h-screen p-4">
          <p className="west-face-body">No door here.</p>
          <button type="button" className="west-face-pill mt-3" onClick={() => setView('main')}>Street</button>
        </div>
      )
    }
    const keeper = npcs.find((n) => n.id === front.keeperNpcId)
    const patrons = front.patronNpcIds
      .map((id) => npcs.find((n) => n.id === id))
      .filter((n): n is GoldCountryNPC => !!n)
    const indoorSearches = searchAreas.filter((a) => front.searchAreaIds.includes(a.id))
    return (
      <>
        {shopNote && (
          <p className="fixed top-4 left-1/2 z-40 -translate-x-1/2 west-face-paper px-4 py-2 font-serif text-[#e8dcc4]">
            {shopNote}
          </p>
        )}
        <GoldCountryShopInterior
          front={front}
          keeper={keeper}
          patrons={patrons}
          searches={indoorSearches}
          searchedAreaIds={state.searchedAreas}
          poster={poster}
          posterSeen={!!poster && postersSeen.includes(poster.id)}
          arrested={!!front.warrantNpcId && arrests.includes(front.warrantNpcId)}
          boughtIds={boughtIds}
          canAfford={(price) => canAfford('neutral', price)}
          priceOf={priceOf}
          onTalk={handleNPCClick}
          onSearch={handleSearch}
          onBuy={handleBuy}
          onConfront={handleConfront}
          onStreet={() => {
            setSelectedFront(null)
            setShopNote(null)
            setView('main')
          }}
        />
      </>
    )
  }

  return null
}

export default GoldCountryLocation
