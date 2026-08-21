'use client'

import { useEffect, useState } from 'react'
import { nearbyNpcs, parseSimulatedNear, type GpsFix, type ProximityNpc } from '@/lib/gpsProximity'
import { TOWN_REGISTRY } from '@/lib/townRegistry'
import { revealOnMap } from '@/lib/oneMapDiscovery'

export function ProximityNpcs() {
  const [fix, setFix] = useState<GpsFix | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const sim = typeof window !== 'undefined' ? parseSimulatedNear(window.location.search) : null
    if (sim) {
      setFix(sim)
      const town = TOWN_REGISTRY.find((t) => t.lat === sim.lat && t.lng === sim.lng)
      if (town) revealOnMap(town.id)
      return
    }
    if (!navigator.geolocation) {
      setDenied(true)
      return
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy || 30,
          source: 'geolocation',
        })
      },
      () => setDenied(true),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [])

  const nearby = nearbyNpcs(fix)

  return (
    <aside className="west-face-paper mx-auto my-4 max-w-3xl">
      <p className="west-face-eyebrow">Nearby · GPS</p>
      <h2 className="west-face-title mt-1">Who is here</h2>
      <p className="west-face-body mt-2">
        People, quests, and supplies appear only when you are physically close.
        {fix?.source === 'sim' ? ' Simulated pin (query near=).' : null}
        {denied && !fix ? ' Location is off — they stay hidden.' : null}
        {fix && fix.source === 'geolocation' ? ` Fix ±${Math.round(fix.accuracyM)} m.` : null}
      </p>
      {nearby.length === 0 ? (
        <p className="west-face-footer">Nobody in reach. Walk, or open the one map.</p>
      ) : (
        nearby.map((npc) => <NpcRow key={npc.id} npc={npc} />)
      )}
    </aside>
  )
}

function NpcRow({ npc }: { npc: ProximityNpc & { meters: number; town: { name: string } } }) {
  return (
    <div className="west-face-row">
      <div>
        <h3 className="font-serif text-lg text-[#f3ead8]">{npc.name}</h3>
        <p className="west-face-body mt-1">
          {npc.town.name} · {npc.meters} m · {npc.role}
        </p>
        {npc.quest ? <p className="mt-1 text-sm text-[#cbbf9a]">{npc.quest}</p> : null}
        {npc.supplies ? <p className="mt-1 text-sm text-[#cbbf9a]">Supplies: {npc.supplies}</p> : null}
        {npc.historicalNote ? <p className="mt-1 text-xs text-[#9a8b70]">{npc.historicalNote}</p> : null}
      </div>
    </div>
  )
}
