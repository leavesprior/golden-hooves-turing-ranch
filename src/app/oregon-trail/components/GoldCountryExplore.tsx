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
  level2PinPosition,
  level2Progress,
  readLevel2Stamps,
} from '@/lib/goldCountryLevel2'
import GoldCountryBooking from './GoldCountryBooking'

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

  const currentLoc = state.currentGoldCountryLocation || 'bobr_cabin'
  const discovered = useMemo(() => {
    const wagon = state.discoveredGoldLocations || []
    const one = typeof window !== 'undefined' ? readDiscovered() : []
    return Array.from(new Set([...wagon, ...one, ...LEVEL2_CASE_IDS]))
  }, [state.discoveredGoldLocations])

  const l2 = useMemo(
    () => level2Progress({
      stamps: typeof window !== 'undefined' ? readLevel2Stamps() : [],
      searchedAreaIds: state.searchedAreas,
    }),
    [state.searchedAreas, state.discoveredGoldLocations],
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

  return (
    <div className="west-face-shell min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--west-line)]">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="west-face-eyebrow">Level 2</p>
            <h1 className="west-face-title text-3xl sm:text-4xl">Explore the Gold Country</h1>
            <p className="west-face-body mt-1 max-w-xl">
              {l2.count}/{l2.goal} cases stamped. A warrant, a time-slip, a frog, a mine.
              Real towns. The ranch is the bureau.
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
                  {near ? ' · here' : ''}
                </span>
              </button>
            )
          })}

          {selectedLocData && selectedLocation && selectedLocation !== currentLoc && (
            <div className="absolute bottom-3 left-3 right-3 z-20 west-face-paper p-4">
              <p className="west-face-eyebrow">{selectedCase?.example ?? selectedLocData.region}</p>
              <p className="font-serif text-xl text-[#f3ead8]">{selectedLocData.name}</p>
              <p className="west-face-body mt-1">{selectedCase?.warrant ?? selectedLocData.fact}</p>
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
          <div className="west-face-paper">
            <p className="west-face-eyebrow">Cases</p>
            <ul className="mt-2 space-y-2">
              {LEVEL2_CASES.map((c) => {
                const done = l2.visited.includes(c.id)
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
                      <span className="block text-sm text-[#b8a88a]">{c.example}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {l2.complete && (
              <button
                type="button"
                className="west-face-pill west-face-pill-cream w-full mt-3 justify-center"
                onClick={() => setShowL2Voucher(true)}
              >
                Level 2 done — take the QR voucher
              </button>
            )}
          </div>

          {currentLocData && (
            <div className="west-face-paper">
              <p className="west-face-eyebrow">You are here</p>
              <p className="font-serif text-xl text-[#f3ead8] mt-1">{currentLocData.name}</p>
              <p className="west-face-body mt-1">{caseForLocation(currentLoc)?.verb ?? currentLocData.description}</p>
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

      {showL2Voucher && (
        <GoldCountryBooking
          playerName={state.party[0]?.name || 'Traveler'}
          partySize={state.party.filter((m) => m.health > 0).length}
          karmaScore={balance.good + Math.floor(balance.neutral / 2)}
          outlawsCaught={Math.max(state.outlawsCaught || 0, mysteryState.outlawsCaught || 0)}
          daysOnTrail={state.daysOnTrail}
          onClose={() => setShowL2Voucher(false)}
          graphicsTier={state.graphicsTier}
          level={2}
          minPercent={10}
        />
      )}
    </div>
  )
}

export default GoldCountryExplore
