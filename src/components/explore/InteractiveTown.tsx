'use client'

import { useMemo, useState } from 'react'
import { useExplorer, type Town, type Attraction } from '@/app/explore/explorerContext'
import { useKarma } from '@/lib/karmaContext'
import { VolcanoStayShow } from '@/components/VolcanoStayShow'
import {
  editorialForExplorePlace,
  TOWN_HOTSPOTS,
  TOWN_NPCS,
} from '@/lib/goldCountryEditorial'

export function InteractiveTown({
  town,
  onLeave,
}: {
  town: Town
  onLeave: () => void
}) {
  const {
    visitAttraction,
    visitTown,
    isAttractionVisited,
    isSecretUnlocked,
  } = useExplorer()
  const { applyKarma } = useKarma()
  const art = editorialForExplorePlace(town.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [npcLine, setNpcLine] = useState<string | null>(null)

  const spots = TOWN_HOTSPOTS[town.id] || []
  const npcs = TOWN_NPCS[town.id] || []
  const byId = useMemo(() => {
    const m = new Map<string, Attraction>()
    for (const a of town.attractions) m.set(a.id, a)
    for (const a of town.secretAttractions || []) m.set(a.id, a)
    return m
  }, [town])

  const selected = selectedId ? byId.get(selectedId) : undefined

  const enterBuilding = (attractionId: string) => {
    const a = byId.get(attractionId)
    if (!a) return
    visitTown(town.id)
    if (!isAttractionVisited(a.id)) {
      visitAttraction(a.id, town.id)
      applyKarma('gold_country_explore', `Entered ${a.name} in ${town.name}`, -2, -1)
    }
    setSelectedId(a.id)
    setNpcLine(null)
  }

  const talkNpc = (line: string, name: string) => {
    applyKarma('gold_country_explore', `Talked with ${name} in ${town.name}`, 0, -2)
    setNpcLine(`${name}: “${line}”`)
    setSelectedId(null)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0e0c0a]">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="west-face-eyebrow">In town</p>
          <h1 className="west-face-title text-2xl">{town.name}</h1>
          <p className="font-serif text-sm text-[#b8a88a]">{town.tagline}</p>
        </div>
        <button type="button" className="west-face-pill" onClick={onLeave}>
          Leave town
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" className="absolute inset-0 h-full w-full object-contain object-center" />
        ) : (
          <div className="absolute inset-0 bg-[#16130f]" />
        )}

        {spots.map((spot) => {
          const a = byId.get(spot.attractionId)
          if (!a) return null
          const seen = isAttractionVisited(a.id)
          return (
            <button
              key={spot.attractionId}
              type="button"
              title={a.name}
              onClick={() => enterBuilding(spot.attractionId)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-1 text-xs font-serif shadow-lg ${
                seen
                  ? 'border-emerald-500/70 bg-black/70 text-emerald-200'
                  : 'border-amber-400/80 bg-black/75 text-[#e8dcc4]'
              }`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              {a.icon} {a.name}
            </button>
          )
        })}

        {npcs.map((npc) => (
          <button
            key={npc.id}
            type="button"
            title={npc.name}
            onClick={() => talkNpc(npc.line, npc.name)}
            className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-[#e8dcc4] px-2 py-1 font-serif text-[11px] text-[#1a1208]"
            style={{ left: `${npc.x}%`, top: `${npc.y}%` }}
          >
            Talk · {npc.name}
          </button>
        ))}
      </div>

      <aside className="max-h-[38vh] overflow-y-auto border-t border-[rgba(232,220,196,0.12)] bg-[#0e0c0a] px-4 py-3">
        {npcLine && <p className="mb-3 font-serif text-sm italic text-[#e8dcc4]">{npcLine}</p>}
        {selected ? (
          <article className="west-face-paper">
            <p className="west-face-eyebrow">{selected.category}</p>
            <h2 className="west-face-title text-xl">{selected.name}</h2>
            <p className="west-face-body mt-2">{selected.description}</p>
            <p className="mt-2 font-serif text-xs text-[#b8a88a]">{selected.funFact}</p>
            {selected.id === 'vol_theatre' && <VolcanoStayShow />}
          </article>
        ) : (
          <p className="font-serif text-sm text-[#b8a88a]">
            Click a building on the street, or talk to someone standing in it — same as walking a town in the old RPGs.
            Secrets stay off the map until they unlock.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {town.attractions.map((a) => (
            <button
              key={a.id}
              type="button"
              className="west-face-pill text-[11px]"
              onClick={() => enterBuilding(a.id)}
            >
              {isAttractionVisited(a.id) ? '✓ ' : ''}{a.name}
            </button>
          ))}
          {(town.secretAttractions || []).filter((s) => isSecretUnlocked(s.id)).map((a) => (
            <button key={a.id} type="button" className="west-face-pill text-[11px]" onClick={() => enterBuilding(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
