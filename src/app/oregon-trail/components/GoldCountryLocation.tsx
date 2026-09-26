'use client'

import { GoldCountryCalendar, GoldCountryRoutePicker, formatTravelMinutes } from './GoldCountryTransportChoices'
import React, { useState, useCallback, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'
import { EDITORIAL_ERA_CAPTION, editorialForExplorePlace } from '@/lib/goldCountryEditorial'
import {
  caseForLocation,
  casePinsDone,
  deductionCtaVisible,
  editorialTownId,
  frontClueState,
  guaranteeCaseClue,
  maybeStampCase,
  pinsCompleteLine,
  readDeducedCases,
  readFoundClues,
  readTalkedNpcs,
  writeDeducedCase,
  writeFoundClue,
  writeTalkedNpc,
} from '@/lib/goldCountryLevel2'
import FrogJumpMicrogame from './FrogJumpMicrogame'
import { frogOutcomeConsequence, type FrogJumpOutcome } from '@/lib/frogJump'
import {
  capturePayout,
  frontsForLocation,
  outdoorSearchIds,
  paperOnNpc,
  posterForLocation,
  posterPinsForLocation,
  postersForLocation,
  postedBounty,
  STREET_POSTERS,
  readArrests,
  readBought,
  readPostersSeen,
  readTakenWarrants,
  readWarrantTakes,
  streetNpcs,
  takeWarrant,
  tickOutstandingWarrants,
  writeArrest,
  writeBought,
  type ShopGood,
  type TakenWarrant,
  type TownFront,
  type WarrantApproach,
  type WarrantCapture,
} from '@/lib/goldCountryStreet'
import { LocalTodayPanel } from '@/components/explore/LocalTodayPanel'
import { GoldCountryShopInterior } from './GoldCountryShopInterior'
import { GoldCountryBountyChase } from './GoldCountryBountyChase'
import { CaptureXp } from './GoldCountryXpGain'
import { GoldCountryWantedPoster } from './GoldCountryWantedPoster'
import { GoldCountryWarrantBoard } from './GoldCountryWarrantBoard'
import { GoldCountryHuntDossier } from './GoldCountryHuntDossier'
import { GoldCountryGuestBook } from './GoldCountryGuestBook'
import { useCharacter } from '../characterContext'
import type { ChaseOutcome } from '@/lib/goldCountryAlley'
import { GUEST_BOOK_AREA_ID } from '@/lib/goldCountryGuestBook'
import {
  emptyChairForFront,
  huntIsHot,
  huntStatus,
  npcInWind,
  paperClueAt,
  readHuntClues,
  showPaperTo,
  trailForPoster,
} from '@/lib/goldCountryHunt'
import { isKidMode } from '@/lib/gftAgeMode'
import NpcChat from '@/components/rpg/NpcChat'
import { skyLabel, skyWashesStreet, streetSky } from '@/lib/goldCountryWeather'
import { getGoldCountryLocation, getLocationSites } from '../data/goldCountryLocations'
import {
  getNPCById,
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
  resolveCaseSearch,
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

type LocationView = 'main' | 'npc' | 'quest' | 'moral_choice' | 'quest_outcome' | 'search' | 'search_result' | 'shop' | 'warrant_board' | 'guest_book' | 'bounty_chase' | 'capture_xp' | 'case_deduce' | 'frog_jump'

export function GoldCountryLocation({
  locationId,
  onReturnToMap,
  onOpenSettlement,
}: GoldCountryLocationProps) {
  const { state, markAreaSearched, addInventoryItem, completeQuest, completeQuestWithReward, advanceGoldCountryDay, getShopDiscount } = useOregonTrail()
  const { earnGood, earnNeutral, spendNeutral, canAfford, balance, addBadKarma } = useKarmaWallet()
  const { rollSkillCheck, state: characterState } = useCharacter()

  const [view, setView] = useState<LocationView>('main')
  const [selectedNPC, setSelectedNPC] = useState<GoldCountryNPC | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<GoldCountryQuest | null>(null)
  const [selectedSearchArea, setSelectedSearchArea] = useState<SearchArea | null>(null)
  const [searchResult, setSearchResult] = useState<SearchFinding | null>(null)
  const [npcDialogueIndex, setNpcDialogueIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [questOutcome, setQuestOutcome] = useState<{ consequence: string; reward: QuestReward } | null>(null)
  const [deduceResponse, setDeduceResponse] = useState<{ text: string; correct: boolean } | null>(null)
  const [pendingFrogChoice, setPendingFrogChoice] = useState<{ quest: GoldCountryQuest; choice: MoralChoice } | null>(null)
  const [selectedFront, setSelectedFront] = useState<TownFront | null>(null)
  const [shopNote, setShopNote] = useState<string | null>(null)
  const [boughtIds, setBoughtIds] = useState<string[]>(() => readBought())
  const [arrests, setArrests] = useState<string[]>(() => readArrests())
  const [postersSeen, setPostersSeen] = useState<string[]>(() => readPostersSeen())
  const [takenWarrants, setTakenWarrants] = useState<TakenWarrant[]>(() => readTakenWarrants())
  const [warrantTakes, setWarrantTakes] = useState<Record<string, number>>(() => readWarrantTakes())
  const [huntClues, setHuntClues] = useState<string[]>(() => readHuntClues())
  const [foundClues, setFoundClues] = useState<string[]>(() => readFoundClues())
  const [huntVoice, setHuntVoice] = useState<string | null>(null)
  const [huntCard, setHuntCard] = useState<string | null>(null)
  const [chaseNpc, setChaseNpc] = useState<GoldCountryNPC | null>(null)

  const location = getGoldCountryLocation(locationId)
  const level2Case = caseForLocation(locationId)
  const npcs = getNPCsAtLocation(locationId)
  const searchAreas = getSearchAreasForLocation(locationId)
  const fronts = frontsForLocation(locationId)
  const sky = streetSky(locationId, state.weather, state.goldCountryDay)
  const takenIdsForStreet = takenWarrants.map((t) => t.id)
  const huntingStatus = takenWarrants
    .map((t) => huntStatus(t.id, takenIdsForStreet, arrests, huntClues))
    .find((st) => st && !st.served)
  const hunting = !!huntingStatus
  const onStreetPeople = streetNpcs(locationId, npcs).filter(
    (n) => !(n.shelterInRain && skyWashesStreet(sky)) && !npcInWind(n.id, takenIdsForStreet, arrests, huntClues),
  )
  // A required clue area stays open until its clue is actually found (legacy saves
  // may have searched it and drawn a non-clue finding before the guarantee).
  const closedAreaIds = state.searchedAreas.filter((id) => {
    const area = searchAreas.find((a) => a.id === id)
    return !(area && guaranteeCaseClue(level2Case, area, foundClues))
  })
  const outdoorIds = outdoorSearchIds(locationId, searchAreas.map((a) => a.id))
  const outdoorSearches = searchAreas.filter((a) => outdoorIds.includes(a.id))
  const poster = posterForLocation(locationId)
  const posters = postersForLocation(locationId)
  const posterPins = posterPinsForLocation(locationId)

  // GPS for physical location correlation (device hardware via browser Geolocation API + haversine)
  // Correlates with location.coordinates (from Google Maps verified + places.json)
  // If within ~2-5km, 'physically present' – SADDLE bonuses, historical AR (PlaceBackdrop), shop deals, NPC/bounty engagement
  // TODO(P2): consume useVerifiedPresence (lib/useVerifiedPresence.ts) — keeps accuracy, per-call radius, dwell tracking
  const [isPhysicallyPresent, setIsPhysicallyPresent] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle'|'requesting'|'granted'|'denied'|'error'>('idle')
  const [currentDist, setCurrentDist] = useState<number | null>(null)
  const requestLocationGPS = useCallback(() => {
    if (location?.transportGateway) return // Fictional route boards never establish GPS presence.
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
    tickOutstandingWarrants(state.goldCountryDay)
    setBoughtIds(readBought())
    setArrests(readArrests())
    setPostersSeen(readPostersSeen())
    setTakenWarrants(readTakenWarrants())
    setWarrantTakes(readWarrantTakes())
    setHuntClues(readHuntClues())
  }, [locationId, state.phase, state.inventory.length, state.goldCountryDay])

  // Hook must be called before any early return (React rules-of-hooks)
  const handleSearch = useCallback((area: SearchArea) => {
    setSelectedSearchArea(area)
    setIsSearching(true)
    setView('search')

    // Simulate search with delay
    setTimeout(() => {
      // A required case-clue area turns up its clue until that clue has been found.
      const guaranteeClue = guaranteeCaseClue(caseForLocation(locationId), area, readFoundClues())
      const finding = resolveCaseSearch(area, { guaranteeClue })
      setSearchResult(finding)
      setIsSearching(false)
      setView('search_result')

      if (finding) {
        markAreaSearched(area.id)
        if (finding.isClue) setFoundClues(writeFoundClue(area.id))
        const talked = readTalkedNpcs()
        maybeStampCase(locationId, [...state.searchedAreas, area.id], talked)
        if (finding.itemGained) addInventoryItem(finding.itemGained)
        if (finding.karmaGained) earnGood(finding.karmaGained)
      }

      advanceGoldCountryDay(1)
    }, 1500)
  }, [markAreaSearched, addInventoryItem, earnGood, advanceGoldCountryDay, locationId, state.searchedAreas])

  const enterFront = useCallback((front: TownFront, opts?: { skipBoard?: boolean }) => {
    setSelectedFront(front)
    setShopNote(null)
    if (front.duty === 'sheriff' && !opts?.skipBoard) {
      setView('warrant_board')
      return
    }
    setView('shop')
  }, [])

  const openGuestBook = useCallback(() => {
    const porch = fronts.find((f) => f.id === 'bobr_cabin_porch')
    if (porch) setSelectedFront(porch)
    setView('guest_book')
  }, [fronts])

  const stampGuestBookRead = useCallback(() => {
    if (state.searchedAreas.includes(GUEST_BOOK_AREA_ID)) return
    markAreaSearched(GUEST_BOOK_AREA_ID)
    maybeStampCase(locationId, [...state.searchedAreas, GUEST_BOOK_AREA_ID], readTalkedNpcs())
  }, [markAreaSearched, locationId, state.searchedAreas])

  const openWarrantBoard = useCallback((front?: TownFront) => {
    const door = front ?? fronts.find((f) => f.duty === 'sheriff') ?? fronts[0]
    if (!door) return
    setSelectedFront(door)
    setShopNote(null)
    setView('warrant_board')
  }, [fronts])

  const handleTakeWarrant = useCallback((paper: { id: string }, approach: WarrantApproach) => {
    const taken = takeWarrant(paper.id, approach)
    if (!taken) return
    setTakenWarrants(readTakenWarrants())
    setWarrantTakes(readWarrantTakes())
    setPostersSeen(readPostersSeen())
    const gone = trailForPoster(paper.id)?.emptyChair
    const purse = approach === 'alive'
      ? `${taken.bountyAtTake}🌮 locked if you bring him in alive.`
      : `${taken.bountyAtTake}🌮 locked. Dead or alive if you find him.`
    setShopNote(
      gone
        ? `Paper taken. ${gone} Follow the street. ${purse}`
        : `Paper taken. He is already gone. Follow the street. ${purse}`,
    )
  }, [])

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

  const settleCapture = useCallback(async (npc: GoldCountryNPC, method: WarrantCapture) => {
    const paper = paperOnNpc(takenWarrants, npc.id)
    if (!paper) return
    const taken = takenWarrants.find((t) => t.id === paper.id)
    if (!taken) {
      setShopNote('Take the paper off the sheriff wall first.')
      return
    }
    if (method === 'dead' && taken.approach !== 'dead_or_alive') {
      setShopNote('Your paper says alive. Bring him in breathing.')
      return
    }
    const pay = capturePayout(taken, method)
    setArrests(writeArrest(npc.id))
    await earnNeutral(pay, method === 'alive' ? `Brought in ${paper.alias} alive` : `Took ${paper.alias} dead`)
    if (method === 'dead') {
      await addBadKarma(8, `Took ${paper.alias} dead`)
      setShopNote(`Taken dead. ${pay}🌮. It sits heavy.`)
    } else {
      await earnGood(4, `Brought in ${paper.alias} alive`)
      setShopNote(`Brought in alive. ${pay}🌮 bounty. The poster is satisfied.`)
    }
  }, [takenWarrants, earnNeutral, addBadKarma, earnGood])

  const handleConfront = useCallback((npc: GoldCountryNPC) => {
    const paper = paperOnNpc(takenWarrants, npc.id)
    if (!paper) {
      setShopNote('Take the paper off the sheriff wall first.')
      return
    }
    const takenIds = takenWarrants.map((t) => t.id)
    if (!huntIsHot(paper.id, takenIds, arrests, huntClues)) {
      setShopNote('The paper is not enough. Follow the street. He is in the wind.')
      return
    }
    setChaseNpc(npc)
    setView('bounty_chase')
  }, [takenWarrants, arrests, huntClues])

  const handleChaseResolved = useCallback((outcome: ChaseOutcome) => {
    const npc = chaseNpc
    if (!npc) {
      setChaseNpc(null)
      setView(selectedFront ? 'shop' : 'main')
      return
    }
    if (outcome === 'escaped') {
      setChaseNpc(null)
      setShopNote('Gone. The trail is still hot.')
      setView(selectedFront ? 'shop' : 'main')
      return
    }
    void settleCapture(npc, outcome === 'dead' ? 'dead' : 'alive')
    setView('capture_xp')
  }, [chaseNpc, selectedFront, settleCapture])

  if (!location) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <p className="font-mono">ERROR: Location {locationId} not found</p>
      </div>
    )
  }

  const handleNPCClick = (npc: GoldCountryNPC) => {
    const talked = writeTalkedNpc(npc.id)
    maybeStampCase(locationId, state.searchedAreas, talked)
    setSelectedNPC(npc)
    setNpcDialogueIndex(0)
    setHuntVoice(null)
    setHuntCard(null)
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
    // The honest frog wager is played, not just chosen. Same reward either way.
    if (quest.id === 'quest_frog_wager' && choice.id === 'compete_honestly' && !pendingFrogChoice) {
      setPendingFrogChoice({ quest, choice })
      setView('frog_jump')
      return
    }
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

  // A regional route board is intentionally separate from the existing town
  // street, NPCs and GPS pins: no invented station building or reward IDs.
  if (view === 'main' && location.transportGateway) {
    return <div className="west-face-shell min-h-screen p-4" data-testid="transport-gateway">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div><p className="west-face-eyebrow">Regional route board</p><h1 className="west-face-title text-3xl">{location.name}</h1><GoldCountryCalendar /></div>
          <button type="button" className="west-face-pill min-h-11" onClick={onReturnToMap}>Map</button>
        </header>
        <p className="west-face-body">{location.description}</p>
        {state.goldCountryTrip?.status === 'arrived' && <p className="west-face-body" data-testid="transport-arrival-summary">{state.goldCountryTrip.quote.message} Travel time: {formatTravelMinutes(state.goldCountryTrip.quote.durationMinutes)}.</p>}
        <GoldCountryRoutePicker />
        <section className="west-face-paper space-y-2">
          <h2 className="west-face-eyebrow">Historical note</h2>
          <p className="west-face-body">{location.fact}</p>
          <p className="west-face-body text-xs">{location.transportGateway.notes}</p>
          {location.sites.map(site => <a key={site.url} href={site.url} target="_blank" rel="noreferrer" className="block underline text-amber-200 text-sm">{site.name}</a>)}
        </section>
      </div>
    </div>
  }

  // Frog jump (Angels Camp slice): the honest wager is played, then paid as before.
  if (view === 'frog_jump' && pendingFrogChoice) {
    const finishFrog = (outcome: FrogJumpOutcome) => {
      const { quest, choice } = pendingFrogChoice
      completeQuestWithReward(quest.id, choice.reward, choice.id)
      setQuestOutcome({ consequence: frogOutcomeConsequence(outcome, choice.consequence), reward: choice.reward })
      setPendingFrogChoice(null)
      setView('quest_outcome')
      advanceGoldCountryDay(1)
    }
    return <FrogJumpMicrogame onDone={finishFrog} />
  }

  // Deduction: three worked pins are evidence; the stamp waits on the player's call.
  if (view === 'case_deduce' && level2Case?.deduction) {
    const deduction = level2Case.deduction
    const choose = (choice: (typeof deduction.choices)[number]) => {
      if (choice.correct) {
        writeDeducedCase(level2Case.id)
        maybeStampCase(locationId, state.searchedAreas, readTalkedNpcs())
      } else {
        advanceGoldCountryDay(1)
      }
      setDeduceResponse({ text: choice.response, correct: !!choice.correct })
    }
    return (
      <div className="west-face-shell min-h-screen">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="west-face-paper" data-testid="case-deduce">
            <p className="west-face-eyebrow mb-2">{level2Case.icon} Make the call · {level2Case.title}</p>
            <h2 className="west-face-title text-2xl mb-3">{deduction.question}</h2>
            {deduceResponse ? (
              <>
                <p className="west-face-body mb-4" data-testid="case-deduce-response">{deduceResponse.text}</p>
                <button
                  type="button"
                  className="west-face-pill west-face-pill-cream w-full justify-center"
                  onClick={() => {
                    const solved = deduceResponse.correct
                    setDeduceResponse(null)
                    if (solved) setView('main')
                  }}
                >
                  {deduceResponse.correct ? 'Case stamped — back to the street' : 'Think again'}
                </button>
              </>
            ) : (
              <div className="space-y-2">
                {deduction.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className="west-face-pill w-full justify-start text-left"
                    onClick={() => choose(choice)}
                  >
                    {choice.label}
                  </button>
                ))}
                <button type="button" className="west-face-pill w-full justify-center mt-2" onClick={() => setView('main')}>
                  Not yet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main location view
  if (view === 'main') {
    const art = editorialForExplorePlace(locationId) || editorialForExplorePlace(editorialTownId(locationId))
    const talked = typeof window !== 'undefined' ? readTalkedNpcs() : []
    const pins = level2Case ? casePinsDone(level2Case, state.searchedAreas, talked) : null
    return (
      <div className="west-face-shell min-h-screen">
        <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
          <div>
            <p className="west-face-eyebrow" data-testid="street-level-eyebrow">
              {hunting && huntingStatus
                ? `Level 3 · the hunt · ${huntingStatus.have}/${huntingStatus.need}`
                : `Level 2 · ${level2Case ? `${level2Case.year} · ${level2Case.title}` : location.region}`}
              {!hunting && pins ? ` · ${pins.done}/${pins.total}` : ''}
            </p>
            <h1 className="west-face-title text-3xl">{location.name}</h1>
            <GoldCountryCalendar />
            <p className="west-face-body mt-1 max-w-xl">{level2Case?.warrant ?? location.fact}</p>
            <p className="west-face-eyebrow mt-2" data-testid="street-sky">{skyLabel(sky)}</p>
          </div>
          <button type="button" className="west-face-pill shrink-0" onClick={onReturnToMap}>
            Map
          </button>
        </header>
        {deductionCtaVisible(level2Case, state.searchedAreas, talked, { hunting }) && (
          <div className="px-4 py-3 border-b border-[var(--west-line)]">
            <button
              type="button"
              className="west-face-pill west-face-pill-cream w-full justify-center"
              data-testid="case-deduce-open"
              onClick={() => setView('case_deduce')}
            >
              All three clues are in — make the call
            </button>
          </div>
        )}

        <div className="relative min-h-[52vh] sm:min-h-[64vh]">
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          ) : (
            <PlaceBackdrop id={locationId} className="absolute inset-0 h-full w-full" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          {art && EDITORIAL_ERA_CAPTION[locationId] && (
            <p
              className="pointer-events-none absolute bottom-2 right-2 z-30 max-w-[18rem] rounded-sm bg-black/70 px-2 py-1 font-serif text-[11px] leading-snug text-[#e8dcc4]"
              data-testid="street-art-era-caption"
            >
              {EDITORIAL_ERA_CAPTION[locationId]}
            </p>
          )}
          {sky === 'fog' && <div className="pointer-events-none absolute inset-0 bg-white/20" data-testid="sky-fog" />}
          {skyWashesStreet(sky) && <div className="pointer-events-none absolute inset-0 bg-slate-900/25" data-testid="sky-rain" />}
          {fronts.map((front) => {
            const ids = [front.keeperNpcId, ...front.patronNpcIds, ...front.searchAreaIds].filter(
              (id): id is string => !!id,
            )
            const clueState = frontClueState(ids, level2Case, state.searchedAreas, talked)
            const done = clueState === 'done'
            const waiting = clueState === 'waiting'
            return (
              <button
                key={front.id}
                type="button"
                title={front.name}
                onClick={() => enterFront(front)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 min-h-11 rounded-sm border px-2 py-1 sm:px-3 font-serif text-xs sm:text-sm shadow-lg ${
                  done
                    ? 'border-emerald-400/70 bg-black/70 text-emerald-100'
                    : waiting
                      ? 'border-amber-300/90 bg-black/80 text-amber-100'
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
          {level2Case?.clues
            .filter((clue) => clue.id === GUEST_BOOK_AREA_ID)
            .map((clue) => (
              <button
                key={clue.id}
                type="button"
                data-testid="street-guest-book"
                title="Guest book"
                onClick={openGuestBook}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 min-h-11 rounded-sm border px-3 py-1 font-serif text-sm shadow-lg ${
                  state.searchedAreas.includes(clue.id)
                    ? 'border-emerald-400/70 bg-black/70 text-emerald-100'
                    : 'border-amber-300/90 bg-black/80 text-amber-100'
                }`}
                style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
              >
                {clue.label}
              </button>
            ))}
          {outdoorSearches.map((area) => {
            const searched = closedAreaIds.includes(area.id)
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
          {posterPins.map((pin, i) => {
            const served = arrests.includes(pin.poster.hideNpcId)
            const taken = takenWarrants.find((t) => t.id === pin.poster.id)
            const bounty = postedBounty(pin.poster, warrantTakes[pin.poster.id] ?? pin.poster.seedTakes)
            return (
              <button
                key={`${pin.poster.id}-${pin.front.id}`}
                type="button"
                data-testid={`wanted-hanging-${pin.front.id}`}
                title={`Wanted — posted outside ${pin.front.name}`}
                onClick={() => openWarrantBoard(pin.front.duty === 'sheriff' ? pin.front : undefined)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 min-h-11 max-sm:scale-[0.62] max-sm:origin-center"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: `translate(-50%, -50%) rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                }}
              >
                <GoldCountryWantedPoster
                  poster={pin.poster}
                  bounty={bounty}
                  size="hanging"
                  served={served}
                  approach={taken?.approach}
                  wet={skyWashesStreet(sky)}
                />
              </button>
            )
          })}
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {!level2Case && <p className="west-face-body">{location.description}</p>}
          {state.goldCountryTrip?.status === 'arrived' && <p className="west-face-body" data-testid="transport-arrival-summary">{state.goldCountryTrip.quote.message} Travel time: {formatTravelMinutes(state.goldCountryTrip.quote.durationMinutes)}.</p>}
          <GoldCountryRoutePicker />
          {level2Case && pins && !hunting && (
            <div className="west-face-paper space-y-3">
              <p className="west-face-eyebrow">
                Case · {level2Case.year} · {level2Case.title} · {pins.done}/{pins.total}
              </p>
              <p className="font-serif text-[#e8dcc4]">{level2Case.verb}</p>
              <p className="flex items-center gap-2" aria-label={`${pins.done} of ${pins.total} worked`}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      i < pins.done ? 'bg-emerald-300' : 'bg-[#e8dcc4]/25'
                    }`}
                  />
                ))}
                <span className="font-serif text-sm text-[#b8a88a]">
                  {pins.complete
                    ? 'The three pins close.'
                    : pins.done === 0
                      ? 'Doors, a hole, a name — the street still has work.'
                      : pins.done === 1
                        ? 'One pin down. Two still wait on this street.'
                        : level2Case?.deduction
                          ? 'Two pins. One more, then make the call.'
                          : 'Two pins. One more and the case stamps.'}
                </span>
              </p>
              {pins.done >= 1 && (
                <p className="west-face-body"><span className="text-amber-200/90">Then. </span>{level2Case.then}</p>
              )}
              {pins.done >= 2 && (
                <p className="west-face-body"><span className="text-amber-200/90">Becomes. </span>{level2Case.becomes}</p>
              )}
              {pins.done >= 3 && (
                <>
                  <p className="west-face-body"><span className="text-amber-200/90">Now. </span>{level2Case.now}</p>
                  <p className="font-serif text-sm text-[#cbbfa6]">
                    <span className="text-amber-200/90">The three pins. </span>{level2Case.thinking}
                  </p>
                </>
              )}
            </div>
          )}

          <p className="text-sm text-[#b8a88a] font-serif">
            GPS {gpsStatus}{currentDist !== null ? ` · ${currentDist.toFixed(1)} km` : ''}
            {isPhysicallyPresent ? ' · you are on the ground' : ' · optional'}
            {' '}
            <button type="button" className="west-face-pill ml-2" onClick={requestLocationGPS}>Retry GPS</button>
          </p>

          <p className="west-face-body text-sm">
            {fronts.length > 0 ? 'Names wait behind a door.' : 'The street is the case.'}
            {posterPins.length > 0 ? ' Paper hangs on a door.' : ''}
            {balance ? ` · ${balance.neutral}🌮` : ''}
          </p>

          {takenWarrants.length > 0 && (
            <GoldCountryHuntDossier
              takenWarrants={takenWarrants}
              arrests={arrests}
              collected={huntClues}
            />
          )}

          {takenWarrants.length > 0 && (
            <div className="west-face-paper" data-testid="player-papers">
              <h2 className="west-face-eyebrow mb-3">Your papers</h2>
              <div className="flex flex-wrap gap-3">
                {takenWarrants.map((paper) => {
                  const src = posters.find((p) => p.id === paper.id) ?? STREET_POSTERS.find((p) => p.id === paper.id)
                  if (!src) return null
                  return (
                    <button
                      key={paper.id}
                      type="button"
                      className="min-h-11"
                      onClick={() => openWarrantBoard()}
                      title={`${src.alias} — ${paper.approach === 'alive' ? 'alive' : 'dead or alive'} · ${paper.bountyAtTake}🌮`}
                    >
                      <GoldCountryWantedPoster
                        poster={src}
                        bounty={paper.bountyAtTake}
                        size="pocket"
                        served={arrests.includes(src.hideNpcId)}
                        approach={paper.approach}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
          <LocalTodayPanel townId={locationId} townName={location.name} defaultOpen />
        </div>
      </div>
    )
  }

  // NPC Dialogue View
  if (view === 'npc' && selectedNPC) {
    const kin = selectedNPC.kinOf ? getNPCById(selectedNPC.kinOf) : undefined
    const paperOnThem = paperOnNpc(takenWarrants, selectedNPC.id)
    const paperOnKin = paperOnNpc(takenWarrants, selectedNPC.kinOf)
    const takenIds = takenWarrants.map((t) => t.id)
    const huntClue = paperClueAt(selectedNPC.id, takenIds, arrests, huntClues)
    const npcQuests = getNPCQuests(selectedNPC.id)
    const lampPaperTaken = takenWarrants.some((t) => t.id === 'poster_lamp_shy')
    const availableQuests = npcQuests.filter(q =>
      !state.completedQuests.includes(q.id)
      && isQuestAvailable(q, state.completedQuests)
      && !(lampPaperTaken && q.id === 'quest_bounty_hunter')
    )
    const completedNPCQuests = npcQuests.filter(q => state.completedQuests.includes(q.id))
    const lockedQuests = npcQuests.filter(q =>
      !state.completedQuests.includes(q.id) && !isQuestAvailable(q, state.completedQuests)
    )

    const talkArt = editorialForExplorePlace(locationId) || editorialForExplorePlace(editorialTownId(locationId))
    return (
      <div className="west-face-shell min-h-screen relative">
        {talkArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={talkArt} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-40" />
        ) : (
          <PlaceBackdrop id={location.id} className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[#0e0c0a]/55" />
        <div className="relative z-10 max-w-2xl mx-auto p-4 pt-8">
          <div className="west-face-paper">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{selectedNPC.portrait}</span>
              <div>
                <h2 className="west-face-title text-2xl">{selectedNPC.name}</h2>
                <p className="west-face-eyebrow mt-1">{selectedNPC.title} · {location.name}</p>
                {kin && (
                  <p className="west-face-body text-sm mt-1" data-testid="npc-kin">
                    Kin: {kin.name}, {selectedNPC.kinRelation}.
                  </p>
                )}
                {paperOnThem && (
                  <p className="west-face-body text-sm mt-1" data-testid="paper-on-them">
                    You carry their paper.
                  </p>
                )}
                {paperOnKin && kin && (
                  <p className="west-face-body text-sm mt-1" data-testid="paper-on-kin">
                    You carry paper on {kin.name}.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--west-line)] p-3 mb-4">
              <p className="west-face-body italic">&ldquo;{selectedNPC.greeting}&rdquo;</p>
            </div>

            <div className="rounded-lg border border-[var(--west-line)] bg-black/30 p-4 min-h-[80px] mb-4">
              <p className="font-serif text-[#e8dcc4]">
                &ldquo;{selectedNPC.dialogueLines[npcDialogueIndex]}&rdquo;
              </p>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleNextDialogue}
                className="west-face-pill flex-1 justify-center"
              >
                {npcDialogueIndex < selectedNPC.dialogueLines.length - 1 ? 'Continue' : 'Hear it again'}
              </button>
            </div>
            {huntClue && (
              <div className="mb-4 space-y-2" data-testid="show-the-paper">
                <button
                  type="button"
                  className="west-face-pill west-face-pill-cream w-full justify-center"
                  onClick={() => {
                    const card = showPaperTo(selectedNPC.id, takenIds, arrests)
                    setHuntClues(readHuntClues())
                    if (card) {
                      setHuntCard(card.card)
                      setHuntVoice(card.voice)
                    }
                  }}
                >
                  Show the paper
                </button>
                <p className="west-face-body text-sm">Have you seen this man. 1849. No wire. Just the street.</p>
              </div>
            )}
            {huntCard && (
              <p className="west-face-eyebrow mb-2 tracking-wide" data-testid="hunt-card-line">
                {huntCard}
              </p>
            )}
            {huntVoice && (
              <p className="west-face-body mb-4" data-testid="hunt-card-voice">
                &ldquo;{huntVoice}&rdquo;
              </p>
            )}

            <div className="mb-4">
              <p className="west-face-eyebrow mb-2">Speak freely · Neoma</p>
              <NpcChat
                characterId={selectedNPC.id}
                name={selectedNPC.name}
                intro={selectedNPC.greeting}
                liveContext={skyLabel(sky)}
              />
            </div>

            {/* Available Quests */}
            {availableQuests.length > 0 && (
              <div className="mt-2 space-y-2">
                <h3 className="west-face-eyebrow">Work he will name</h3>
                {availableQuests.map(quest => {
                  const catInfo = QUEST_CATEGORY_INFO[quest.category]
                  return (
                    <button
                      key={quest.id}
                      onClick={() => handleQuestSelect(quest)}
                      className="w-full text-left rounded-lg border border-[var(--west-line)] p-3 min-h-11"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#b8a88a]">{catInfo.icon} {catInfo.label}</span>
                        {quest.moralChoices && quest.moralChoices.length > 0 && (
                          <span className="text-xs text-amber-200/80">a choice</span>
                        )}
                      </div>
                      <p className="font-serif text-[#e8dcc4]">{quest.title}</p>
                      <p className="west-face-body text-sm mt-1">{quest.description}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Locked Quests */}
            {lockedQuests.length > 0 && (
              <div className="mt-3 space-y-2">
                <h3 className="west-face-eyebrow">Not yet</h3>
                {lockedQuests.map(quest => (
                  <div key={quest.id} className="rounded-lg border border-[var(--west-line)] p-3 opacity-60">
                    <p className="font-serif text-[#b8a88a]">{quest.title}</p>
                    <p className="west-face-body text-sm mt-1">Finish &quot;{quest.requiredQuest}&quot; first.</p>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Quests */}
            {completedNPCQuests.length > 0 && (
              <div className="mt-3">
                <h3 className="west-face-eyebrow mb-1">Already done</h3>
                {completedNPCQuests.map(quest => (
                  <p key={quest.id} className="west-face-body text-sm line-through">{quest.title}</p>
                ))}
              </div>
            )}

            {/* Clue Hint */}
            {selectedNPC.clueHint && (
              <div className="mt-4 rounded-lg border border-[var(--west-line)] p-3">
                <p className="west-face-eyebrow">A lead</p>
                <p className="west-face-body mt-1 italic">&ldquo;{selectedNPC.clueHint}&rdquo;</p>
              </div>
            )}

            <button
              onClick={returnFromNpc}
              className="west-face-pill w-full mt-4 justify-center"
            >
              Back
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
      <div className="west-face-shell min-h-screen">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="west-face-paper">
            <p className="west-face-eyebrow mb-2">{catInfo.icon} {catInfo.label}</p>
            <h2 className="west-face-title text-2xl mb-2">{selectedQuest.title}</h2>
            <p className="west-face-body mb-3">{selectedQuest.description}</p>

            <div className="rounded-lg border border-[var(--west-line)] p-3 mb-4">
              <p className="west-face-eyebrow mb-1">What he asks</p>
              <p className="font-serif text-[#e8dcc4]">{selectedQuest.objective}</p>
            </div>

            <div className="rounded-lg border border-[var(--west-line)] p-3 mb-4">
              <p className="west-face-eyebrow mb-1">If you do it</p>
              {renderRewardSummary(selectedQuest.reward)}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleQuestComplete(selectedQuest)}
                className="west-face-pill west-face-pill-cream flex-1 justify-center"
              >
                Do it
              </button>
              <button
                onClick={() => { setView('npc'); setSelectedQuest(null) }}
                className="west-face-pill flex-1 justify-center"
              >
                Back
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
      <div className="west-face-shell min-h-screen">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="west-face-paper">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{selectedNPC.portrait}</span>
              <div>
                <p className="west-face-eyebrow">{catInfo.icon} {catInfo.label}</p>
                <h2 className="west-face-title text-2xl">{selectedQuest.title}</h2>
              </div>
            </div>

            <p className="west-face-body mb-2">{selectedQuest.description}</p>

            <div className="rounded-lg border border-[var(--west-line)] p-3 mb-4">
              <p className="font-serif text-[#e8dcc4]">{selectedQuest.objective}</p>
            </div>

            <h3 className="west-face-eyebrow mb-3">Choose</h3>
            <div className="space-y-3">
              {selectedQuest.moralChoices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleMoralChoice(selectedQuest, choice)}
                  className="w-full text-left rounded-lg border border-[var(--west-line)] p-4 min-h-11"
                >
                  <p className="font-serif text-[#e8dcc4] mb-2">{choice.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {renderRewardSummary(choice.reward)}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setView('npc'); setSelectedQuest(null) }}
              className="west-face-pill w-full mt-4 justify-center"
            >
              Not this
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quest Outcome (shown after completing a quest or making a moral choice)
  if (view === 'quest_outcome' && questOutcome && selectedQuest) {
    return (
      <div className="west-face-shell min-h-screen">
        <div className="max-w-2xl mx-auto p-4 pt-12">
          <div className="west-face-paper">
            <p className="west-face-eyebrow mb-2">Done</p>
            <h2 className="west-face-title text-2xl mb-4">{selectedQuest.title}</h2>

            {/* Outcome narrative */}
            <div className="rounded-lg border border-[var(--west-line)] bg-black/30 p-4 mb-4">
              <p className="font-serif text-[#e8dcc4] leading-relaxed italic">{questOutcome.consequence}</p>
            </div>

            <div className="rounded-lg border border-[var(--west-line)] p-3 mb-4">
              <p className="west-face-eyebrow mb-2">Taken</p>
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

            <p className="west-face-body text-sm mb-4">A day goes by.</p>

            <button
              onClick={() => {
                setView('npc')
                setSelectedQuest(null)
                setQuestOutcome(null)
              }}
              className="west-face-pill west-face-pill-cream w-full justify-center"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Search In Progress
  if (view === 'search' && isSearching) {
    const lookArt = editorialForExplorePlace(locationId) || editorialForExplorePlace(editorialTownId(locationId))
    return (
      <div className="west-face-shell min-h-screen flex items-center justify-center relative">
        {lookArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lookArt} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[#0e0c0a]/50" />
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-4 animate-pulse">{selectedSearchArea?.icon || '🔍'}</div>
          <p className="west-face-title text-2xl animate-pulse">Looking…</p>
          <p className="west-face-body mt-2">{selectedSearchArea?.name}</p>
        </div>
      </div>
    )
  }

  // Search Result
  if (view === 'search_result') {
    const talkedNow = typeof window !== 'undefined' ? readTalkedNpcs() : []
    const searchedNow = selectedSearchArea
      ? Array.from(new Set([...state.searchedAreas, selectedSearchArea.id]))
      : state.searchedAreas
    const pinsAfter = level2Case ? casePinsDone(level2Case, searchedNow, talkedNow) : null
    const thisWasPin = !!(level2Case && selectedSearchArea && level2Case.clues.some((c) => c.id === selectedSearchArea.id))
    return (
      <div className="west-face-shell min-h-screen">
        <div className="max-w-2xl mx-auto p-4 pt-12">
          <div className="west-face-paper">
            <p className="west-face-eyebrow mb-4">{selectedSearchArea?.name ?? 'A look'}</p>

            {searchResult ? (
              <div className="p-4 rounded-lg border border-[var(--west-line)] mb-4">
                <p className="font-serif text-[#e8dcc4]">{searchResult.description}</p>
                {thisWasPin && pinsAfter && (
                  <p className="west-face-body mt-2">
                    {pinsAfter.complete && level2Case
                      ? pinsCompleteLine(level2Case, readDeducedCases())
                      : pinsAfter.done === 1
                        ? 'The camp comes into focus.'
                        : 'Another pin. The later years start to show.'}
                  </p>
                )}
                {searchResult.isClue && (
                  <p className="text-amber-200/90 text-sm font-serif mt-2">A clue you can carry.</p>
                )}
                {searchResult.goldGained && (
                  <p className="text-amber-200 text-sm font-serif mt-1">+{searchResult.goldGained} gold</p>
                )}
                {searchResult.itemGained && (
                  <p className="west-face-body text-sm mt-1">Found: {searchResult.itemGained.replace(/_/g, ' ')}</p>
                )}
                {searchResult.karmaGained && (
                  <p className="west-face-body text-sm mt-1">+{searchResult.karmaGained} 🍪</p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--west-line)] p-4 mb-4">
                <p className="west-face-body">Nothing here that wants to be found today.</p>
              </div>
            )}

            <p className="west-face-body text-sm mb-4">A day goes by.</p>

            <button
              onClick={() => {
                setSearchResult(null)
                setSelectedSearchArea(null)
                setView(selectedFront ? 'shop' : 'main')
              }}
              className="west-face-pill west-face-pill-cream w-full justify-center"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'warrant_board') {
    const door = selectedFront || fronts.find((f) => f.duty === 'sheriff') || fronts[0]
    if (!door) {
      return (
        <div className="west-face-shell min-h-screen p-4">
          <p className="west-face-body">No office here.</p>
          <button type="button" className="west-face-pill mt-3" onClick={() => setView('main')}>Street</button>
        </div>
      )
    }
    return (
      <>
        {shopNote && (
          <p className="fixed top-4 left-1/2 z-40 -translate-x-1/2 west-face-paper px-4 py-2 font-serif text-[#e8dcc4]">
            {shopNote}
          </p>
        )}
        <GoldCountryWarrantBoard
          front={door}
          posters={posters}
          takes={warrantTakes}
          takenWarrants={takenWarrants}
          arrests={arrests}
          onTake={handleTakeWarrant}
          onStepInside={() => enterFront(door, { skipBoard: true })}
          onStreet={() => {
            setSelectedFront(null)
            setShopNote(null)
            setView('main')
          }}
        />
      </>
    )
  }

  if (view === 'capture_xp' && chaseNpc) {
    return (
      <div className="west-face-shell min-h-screen p-4" data-testid="capture-xp">
        <p className="west-face-eyebrow">Level 3 · the paper</p>
        <h1 className="west-face-title text-3xl mt-1">Brought in</h1>
        {shopNote && <p className="west-face-body mt-2">{shopNote}</p>}
        <CaptureXp npcId={chaseNpc.id} />
        <button
          type="button"
          data-testid="capture-xp-street"
          className="west-face-pill mt-3"
          onClick={() => {
            setChaseNpc(null)
            setView(selectedFront ? 'shop' : 'main')
          }}
        >
          Back to the street
        </button>
      </div>
    )
  }

  if (view === 'bounty_chase' && chaseNpc) {
    const paper = paperOnNpc(takenWarrants, chaseNpc.id)
    const taken = paper ? takenWarrants.find((t) => t.id === paper.id) : undefined
    const frontId = selectedFront?.id || paper?.hideFrontId || chaseNpc.id
    if (!paper) {
      return (
        <div className="west-face-shell min-h-screen p-4">
          <p className="west-face-body">The paper does not name this man.</p>
          <button type="button" className="west-face-pill mt-3" onClick={() => { setChaseNpc(null); setView(selectedFront ? 'shop' : 'main') }}>Street</button>
        </div>
      )
    }
    return (
      <>
        {shopNote && (
          <p className="fixed top-4 left-1/2 z-40 -translate-x-1/2 west-face-paper px-4 py-2 font-serif text-[#e8dcc4]">
            {shopNote}
          </p>
        )}
        <GoldCountryBountyChase
          frontId={frontId}
          alias={paper.alias}
          paperAllowsDead={taken?.approach === 'dead_or_alive'}
          wet={skyWashesStreet(sky)}
          dryFlask={state.inventory.includes('powder_horn')}
          roll={rollSkillCheck}
          onResolved={handleChaseResolved}
          onStreet={() => {
            setChaseNpc(null)
            setView(selectedFront ? 'shop' : 'main')
          }}
        />
      </>
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
    const extraIndoor = front.id === 'kennedy_butcher' && skyWashesStreet(sky) ? ['mae_evans'] : []
    const takenIds = takenWarrants.map((t) => t.id)
    const patrons = [...front.patronNpcIds, ...extraIndoor]
      .map((id) => npcs.find((n) => n.id === id))
      .filter((n): n is GoldCountryNPC => !!n)
      .filter((n) => !npcInWind(n.id, takenIds, arrests, huntClues))
    const chair = emptyChairForFront(front.id, takenIds, arrests, huntClues)
    const hidePaper = paperOnNpc(takenWarrants, front.warrantNpcId)
    const shopHuntHot = hidePaper ? huntIsHot(hidePaper.id, takenIds, arrests, huntClues) : false
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
          player={characterState.character ? { name: characterState.character.name, background: characterState.character.background } : null}
          art={editorialForExplorePlace(locationId) || editorialForExplorePlace(editorialTownId(locationId))}
          keeper={keeper}
          patrons={patrons}
          searches={indoorSearches}
          searchedAreaIds={closedAreaIds}
          poster={hidePaper}
          posterSeen={!!hidePaper && postersSeen.includes(hidePaper.id)}
          takenWarrant={hidePaper ? takenWarrants.find((t) => t.id === hidePaper.id) : undefined}
          arrested={!!front.warrantNpcId && arrests.includes(front.warrantNpcId)}
          boughtIds={boughtIds}
          canAfford={(price) => canAfford('neutral', price)}
          priceOf={priceOf}
          onTalk={handleNPCClick}
          onSearch={handleSearch}
          onBuy={handleBuy}
          onConfront={handleConfront}
          huntHot={shopHuntHot}
          emptyChair={chair}
          kid={isKidMode()}
          onOpenGuestBook={front.id === 'bobr_cabin_porch' ? openGuestBook : undefined}
          onStreet={() => {
            setSelectedFront(null)
            setShopNote(null)
            setView('main')
          }}
        />
      </>
    )
  }

  if (view === 'guest_book') {
    return (
      <GoldCountryGuestBook
        playerName={state.party[0]?.name || 'A traveler'}
        alreadyRead={state.searchedAreas.includes(GUEST_BOOK_AREA_ID)}
        onFirstRead={stampGuestBookRead}
        onStreet={() => setView(selectedFront ? 'shop' : 'main')}
      />
    )
  }

  return null
}

export default GoldCountryLocation
