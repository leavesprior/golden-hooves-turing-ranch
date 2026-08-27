'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useMystery } from '../mysteryContext'
import {
  GOLD_COUNTRY_LOCATIONS,
  getGoldCountryLocation,
  areLocationsAdjacent,
} from '../data/goldCountryLocations'
import { readDiscovered, metersBetween } from '@/lib/oneMapDiscovery'
import { GOLD_COUNTRY_MAP_ART } from '@/lib/goldCountryEditorial'
import {
  LEVEL2_CASES,
  LEVEL2_CASE_IDS,
  caseForLocation,
  casePinsDone,
  level2PinPosition,
  level2Progress,
  readLevel2Stamps,
  readTalkedNpcs,
} from '@/lib/goldCountryLevel2'
import GoldCountryBooking from './GoldCountryBooking'
import { GoldCountryHuntDossier } from './GoldCountryHuntDossier'
import { GoldCountryLevelComplete } from './GoldCountryLevelComplete'
import { BetweenLevelXp } from './GoldCountryXpGain'
import { huntLevelComplete, huntTowns, readHuntClues } from '@/lib/goldCountryHunt'
import { readArrests, readTakenWarrants } from '@/lib/goldCountryStreet'
import {
  STAY_GIFTS,
  discountFloorForLevel,
  readLevelPostWinChoice,
  readStayGifts,
  unlockStayGifts,
  writeLevelPostWinChoice,
} from '@/lib/goldCountryLevelRewards'
import type { PostWinChoice } from '@/lib/arcadeFirstLevel'

interface GoldCountryExploreProps {
  onVisitLocation: (locationId: string) => void
  onTravel: (toLocationId: string) => void
  onOpenSettlement: () => void
  onOpenQuestLog: () => void
  onLeave: () => void
}

export function GoldCountryExplore({
  onVisitLocation,
  onTravel,
  onOpenSettlement,
  onOpenQuestLog,
  onLeave,
}: GoldCountryExploreProps) {
  const { state } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const { state: mysteryState } = useMystery()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [showL2Voucher, setShowL2Voucher] = useState(false)
  const [voucherLevel, setVoucherLevel] = useState<1 | 2 | 3>(2)
  const [l2Choice, setL2Choice] = useState<PostWinChoice>(null)
  const [l3Choice, setL3Choice] = useState<PostWinChoice>(null)
  const [stayUnlocked, setStayUnlocked] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle')

  const requestGPS = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('granted')
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    requestGPS()
  }, [requestGPS])

  useEffect(() => {
    setL2Choice(readLevelPostWinChoice(2))
    setL3Choice(readLevelPostWinChoice(3))
    setStayUnlocked(readStayGifts().unlocked)
  }, [])

  const currentLoc = state.currentGoldCountryLocation || 'bobr_cabin'
  const discovered = useMemo(() => {
    const wagon = state.discoveredGoldLocations || []
    const one = typeof window !== 'undefined' ? readDiscovered() : []
    return Array.from(new Set([...wagon, ...one, ...LEVEL2_CASE_IDS]))
  }, [state.discoveredGoldLocations])

  const talked = useMemo(
    () => (typeof window !== 'undefined' ? readTalkedNpcs() : []),
    [state.searchedAreas, state.goldCountryDay],
  )
  const l2 = useMemo(
    () => level2Progress({
      stamps: typeof window !== 'undefined' ? readLevel2Stamps() : [],
      searchedAreaIds: state.searchedAreas,
      talkedNpcIds: talked,
    }),
    [state.searchedAreas, state.discoveredGoldLocations, talked],
  )

  const posById = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {}
    for (const loc of GOLD_COUNTRY_LOCATIONS) {
      out[loc.id] = level2PinPosition(loc.id, loc.coordinates.lat, loc.coordinates.lng)
    }
    return out
  }, [])

  const isNearLocation = (locId: string): boolean => {
    if (!userLocation) return false
    const loc = GOLD_COUNTRY_LOCATIONS.find((l) => l.id === locId)
    if (!loc) return false
    return metersBetween(userLocation, loc.coordinates) < 500
  }

  const handleLocationClick = (locationId: string) => {
    if (!discovered.includes(locationId)) return
    if (locationId === currentLoc) {
      onVisitLocation(locationId)
      return
    }
    setSelectedLocation(locationId)
  }

  const handleTravelConfirm = () => {
    if (!selectedLocation) return
    if (areLocationsAdjacent(currentLoc, selectedLocation)) {
      onVisitLocation(selectedLocation)
    } else {
      onTravel(selectedLocation)
    }
    setSelectedLocation(null)
  }

  const selectedLocData = selectedLocation ? getGoldCountryLocation(selectedLocation) : null
  const currentLocData = getGoldCountryLocation(currentLoc)
  const selectedCase = selectedLocation ? caseForLocation(selectedLocation) : undefined
  const hereCase = caseForLocation(currentLoc)
  const takenWarrants = useMemo(
    () => (typeof window !== 'undefined' ? readTakenWarrants() : []),
    [state.goldCountryDay, state.currentGoldCountryLocation],
  )
  const huntArrests = useMemo(
    () => (typeof window !== 'undefined' ? readArrests() : []),
    [state.goldCountryDay, state.currentGoldCountryLocation],
  )
  const huntCollected = useMemo(
    () => (typeof window !== 'undefined' ? readHuntClues() : []),
    [state.goldCountryDay, state.currentGoldCountryLocation, talked],
  )
  const trailTowns = useMemo(
    () => huntTowns(takenWarrants.map((t) => t.id), huntArrests, huntCollected),
    [takenWarrants, huntArrests, huntCollected],
  )
  const hunting = takenWarrants.length > 0
  const l3Complete = huntLevelComplete(
    takenWarrants.map((t) => t.id),
    huntArrests,
    huntCollected,
  )
  // A taken paper means they already chose the hunt. Do not re-ask L2's
  // "take 10% or hunt" on top of Level 3.
  const showL2Choice = l2.complete && l2Choice == null && !l3Complete && !hunting
  const showL3Choice = l3Complete && l3Choice == null

  const openVoucher = (level: 2 | 3) => {
    setVoucherLevel(level)
    setShowL2Voucher(true)
  }

  return (
    <div className="west-face-shell min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--west-line)]">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="west-face-eyebrow">{hunting ? 'Level 3 · the hunt' : 'Level 2'}</p>
            <h1 className="west-face-title text-3xl sm:text-4xl">Explore the Gold Country</h1>
            <p className="west-face-body mt-1 max-w-xl">
              {hunting
                ? 'The paper is not the man. Show it. Follow the street. 1849 noir — no wire, just the next town.'
                : `${l2.count}/${l2.goal} cases stamped. A warrant, a time-slip, a frog, a mine. Real towns. The ranch is the bureau.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="west-face-pill" onClick={onOpenQuestLog}>
              Dossier
            </button>
            <button type="button" className="west-face-pill" onClick={onLeave}>
              Leave
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="relative min-h-[420px] sm:min-h-[540px] overflow-hidden rounded-2xl border border-[var(--west-line)] bg-[#1a1610]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GOLD_COUNTRY_MAP_ART}
            alt="Gold Country relief map"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[#1a1610]/30" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {GOLD_COUNTRY_LOCATIONS.filter((loc) => discovered.includes(loc.id)).map((loc) =>
              loc.adjacentTo.filter((adj) => discovered.includes(adj)).map((adj) => {
                const a = posById[loc.id]
                const b = posById[adj]
                if (!a || !b || loc.id > adj) return null
                return (
                  <line
                    key={`${loc.id}-${adj}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="#e8d5a3"
                    strokeWidth="0.35"
                    opacity="0.45"
                    strokeDasharray="1.6 1.2"
                  />
                )
              }),
            )}
          </svg>

          {GOLD_COUNTRY_LOCATIONS.map((loc) => {
            const pos = posById[loc.id]
            if (!pos) return null
            const known = discovered.includes(loc.id)
            const here = loc.id === currentLoc
            const caze = caseForLocation(loc.id)
            const stamped = l2.visited.includes(loc.id)
            const near = isNearLocation(loc.id)
            const onTrail = trailTowns.includes(loc.id)
            return (
              <button
                key={loc.id}
                type="button"
                disabled={!known}
                onClick={() => known && handleLocationClick(loc.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 min-h-11 px-2 py-1 rounded-full border text-left shadow-lg ${
                  !known
                    ? 'opacity-25 cursor-not-allowed border-white/10 bg-black/40 text-[#b8a88a]'
                    : here
                      ? 'border-[#e8dcc4] bg-[#e8dcc4] text-[#1a1208]'
                      : stamped
                        ? 'border-emerald-400/70 bg-black/75 text-emerald-100'
                        : 'border-amber-400/80 bg-black/75 text-[#e8dcc4]'
                }`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <span className="font-serif text-sm whitespace-nowrap">
                  {caze?.icon ?? '·'} {loc.shortName}
                  {onTrail ? ' · trail' : ''}
                  {near ? ' · here' : ''}
                </span>
              </button>
            )
          })}

          {selectedLocData && selectedLocation && selectedLocation !== currentLoc && (
            <div className="absolute bottom-3 left-3 right-3 z-20 west-face-paper p-4">
              <p className="west-face-eyebrow">{selectedCase ? `${selectedCase.year} · ${selectedCase.title}` : selectedLocData.region}</p>
              <p className="font-serif text-xl text-[#f3ead8]">{selectedLocData.name}</p>
              <p className="west-face-body mt-1">{selectedCase?.verb ?? selectedCase?.warrant ?? selectedLocData.fact}</p>
              {selectedCase && (
                <p className="west-face-body mt-1 text-sm">
                  {casePinsDone(selectedCase, state.searchedAreas, talked).done}/3 pins
                </p>
              )}
              <p className="west-face-body mt-1 text-sm">{selectedLocData.driveTime}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="west-face-pill west-face-pill-cream" onClick={handleTravelConfirm}>
                  {areLocationsAdjacent(currentLoc, selectedLocation) ? 'Enter' : 'Travel the road'}
                </button>
                <button type="button" className="west-face-pill" onClick={() => setSelectedLocation(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          {hunting && (
            <GoldCountryHuntDossier
              takenWarrants={takenWarrants}
              arrests={huntArrests}
              collected={huntCollected}
            />
          )}
          {stayUnlocked && (
            <div className="west-face-paper" data-testid="stay-gifts">
              <p className="west-face-eyebrow">During your stay</p>
              <p className="west-face-body text-sm mt-1">
                The percent ladder stops at {discountFloorForLevel(3)}%. These land at the ranch, not as more off the booking.
              </p>
              <ul className="mt-2 space-y-1">
                {STAY_GIFTS.map((g) => (
                  <li key={g.id} className="font-serif text-sm text-[#e8dcc4]">
                    {g.name}
                    <span className="block text-[#b8a88a]">{g.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="west-face-paper">
            <p className="west-face-eyebrow">Cases</p>
            <ul className="mt-2 space-y-2">
              {LEVEL2_CASES.map((c) => {
                const done = l2.visited.includes(c.id)
                const pins = casePinsDone(c, state.searchedAreas, talked)
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleLocationClick(c.id)}
                    >
                      <span className={`font-serif ${done ? 'text-emerald-200' : 'text-[#e8dcc4]'}`}>
                        {done ? '●' : '○'} {c.icon} {c.title}
                      </span>
                      <span className="block text-sm text-[#b8a88a]">
                        {c.year} · {pins.done}/{pins.total} · {c.verb}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {l2.complete && l2Choice === 'take_discount' && (
              <button
                type="button"
                className="west-face-pill west-face-pill-cream w-full mt-3 justify-center"
                onClick={() => openVoucher(2)}
              >
                Level 2 voucher — at least {discountFloorForLevel(2)}%
              </button>
            )}
            {l3Complete && l3Choice != null && (
              <button
                type="button"
                className="west-face-pill west-face-pill-cream w-full mt-3 justify-center"
                onClick={() => openVoucher(3)}
              >
                Level 3 voucher — at least {discountFloorForLevel(3)}%
              </button>
            )}
            {l3Complete && l3Choice != null && !stayUnlocked && (
              <button
                type="button"
                className="west-face-pill w-full mt-2 justify-center"
                onClick={() => {
                  unlockStayGifts()
                  setStayUnlocked(true)
                }}
              >
                Earn gifts during your stay
              </button>
            )}
          </div>

          {currentLocData && (
            <div className="west-face-paper">
              <p className="west-face-eyebrow">You are here</p>
              <p className="font-serif text-xl text-[#f3ead8] mt-1">{currentLocData.name}</p>
              <p className="west-face-body mt-1">{hereCase?.verb ?? currentLocData.description}</p>
              {hereCase && (
                <p className="west-face-body mt-1 text-sm">
                  {casePinsDone(hereCase, state.searchedAreas, talked).done}/3 pins on this street
                </p>
              )}
              <button
                type="button"
                className="west-face-pill west-face-pill-cream w-full mt-3 justify-center"
                onClick={() => onVisitLocation(currentLoc)}
              >
                Enter {currentLocData.shortName}
              </button>
              {currentLoc === 'bobr_cabin' && (
                <button
                  type="button"
                  className="west-face-pill w-full mt-2 justify-center"
                  onClick={onOpenSettlement}
                >
                  Manage settlement
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-[#b8a88a] font-serif px-1">
            GPS {gpsStatus}
            {userLocation ? ` · ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}` : ' · optional. Towns play without it.'}
          </p>
        </aside>
      </div>

      {showL2Choice && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <h2 className="font-pixel text-yellow-300 text-2xl text-center mb-4">Level 2 complete</h2>
            <BetweenLevelXp level={2} />
            <GoldCountryLevelComplete
              level={2}
              onTakeDiscount={() => {
                writeLevelPostWinChoice(2, 'take_discount')
                setL2Choice('take_discount')
                openVoucher(2)
              }}
              onContinue={() => {
                writeLevelPostWinChoice(2, 'risk_next')
                setL2Choice('risk_next')
              }}
            />
          </div>
        </div>
      )}

      {showL3Choice && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <h2 className="font-pixel text-yellow-300 text-2xl text-center mb-4">Level 3 complete</h2>
            <BetweenLevelXp level={3} />
            <GoldCountryLevelComplete
              level={3}
              onTakeDiscount={() => {
                writeLevelPostWinChoice(3, 'take_discount')
                setL3Choice('take_discount')
                openVoucher(3)
              }}
              onContinue={() => {
                writeLevelPostWinChoice(3, 'risk_next')
                setL3Choice('risk_next')
                unlockStayGifts()
                setStayUnlocked(true)
              }}
            />
          </div>
        </div>
      )}

      {showL2Voucher && (
        <GoldCountryBooking
          playerName={state.party[0]?.name || 'Traveler'}
          partySize={state.party.filter((m) => m.health > 0).length}
          karmaScore={balance.good + Math.floor(balance.neutral / 2)}
          outlawsCaught={Math.max(state.outlawsCaught || 0, mysteryState.outlawsCaught || 0)}
          daysOnTrail={state.daysOnTrail}
          onClose={() => setShowL2Voucher(false)}
          graphicsTier={state.graphicsTier}
          level={voucherLevel}
          minPercent={discountFloorForLevel(voucherLevel)}
        />
      )}
    </div>
  )
}

export default GoldCountryExplore
