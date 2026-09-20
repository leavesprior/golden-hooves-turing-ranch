'use client'

import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { arcadePresentAttractions, useExplorer, type Town, type Attraction } from '@/app/explore/explorerContext'
import { useKarma } from '@/lib/karmaContext'
import { VolcanoStayShow } from '@/components/VolcanoStayShow'
import {
  editorialForExplorePlace,
  TOWN_HOTSPOTS,
  TOWN_NPCS,
} from '@/lib/goldCountryEditorial'
import { townAsciiInterior } from '@/lib/overlay/townAsciiInterior'
import { lookAbsenceChips, lookAbsenceVisible } from '@/lib/lookAbsence'
import { PlacePictureLift } from '@/components/PlacePictureLift'
import { PlaceScene } from '@/components/PlaceScene'
import { placeSceneFor, type PlaceSceneEra } from '@/lib/placeSceneAssets'
import { TownWalkScene } from './TownWalkScene'
import { Ascii2Viewport } from './Ascii2Viewport'
import type { Heading as Ascii2Heading } from '@/lib/ascii2Walk'
import { hasAscii2Walk } from '@/lib/ascii2Towns'
import { townWalkMap } from '@/lib/townWalk'

export function InteractiveTown({
  town,
  onLeave,
  nextTrail,
}: {
  town: Town
  onLeave: () => void
  nextTrail?: ReactNode
}) {
  const {
    visitAttraction,
    visitTown,
    isAttractionVisited,
    isSecretUnlocked,
    getTownWalk,
    saveTownWalk,
  } = useExplorer()
  const { applyKarma } = useKarma()
  const scene = placeSceneFor(town.id)
  const art = scene?.historical.src ?? editorialForExplorePlace(town.id)
  const [sceneEra, setSceneEra] = useState<PlaceSceneEra>('1849')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [npcLine, setNpcLine] = useState<string | null>(null)
  const [walking, setWalking] = useState(false)
  // Which rung of the graphics ladder draws the walk. Same world, same snapshot:
  // 'pixel' is the painted tile walk, 'ascii2' the colored first-person text walk
  // for weak devices. Pixel stays the default — ascii2 is opt-in.
  const [presentRung, setPresentRung] = useState<'pixel' | 'ascii2'>('pixel')
  const [walkHeading, setWalkHeading] = useState<Ascii2Heading>('up')
  const walkSnapshot = getTownWalk(town.id)

  useLayoutEffect(() => {
    visitTown(town.id)
  }, [town.id, visitTown])

  const present = arcadePresentAttractions(town.attractions)
  const eraFace = present.length < town.attractions.length
  const faceName = eraFace && town.eraName ? town.eraName : town.name
  const faceTagline = eraFace && town.eraTagline ? town.eraTagline : town.tagline
  const presentIds = new Set(present.map((a) => a.id))
  const spots = (TOWN_HOTSPOTS[town.id] || []).filter((s) => presentIds.has(s.attractionId))
  const npcs = (TOWN_NPCS[town.id] || []).filter((n) => n.period !== 'later')
  const walkAttractions = [...present, ...(town.secretAttractions || []).filter(a => a.period !== 'later' && isSecretUnlocked(a.id))]
  const byId = useMemo(() => {
    const m = new Map<string, Attraction>()
    for (const a of town.attractions) m.set(a.id, a)
    for (const a of town.secretAttractions || []) m.set(a.id, a)
    return m
  }, [town])

  const selected = selectedId ? byId.get(selectedId) : undefined
  const interior = townAsciiInterior(selected?.id)
  // Later sites, drawn as absence. They are NOT added to `present`, `presentIds`,
  // or `walkAttractions` — the arcade's idea of what exists in 1849 is unchanged.
  const absence = lookAbsenceChips(town.id)
  const showAbsence = lookAbsenceVisible(sceneEra, walking, !!interior)
  // Gated on the same condition as the chips: a reading left selected when the
  // guest walks off or switches to today must not outlive the face it belongs to.
  const selectedAbsence = showAbsence && selectedId ? absence.find((c) => c.id === selectedId) : undefined

  const enterBuilding = (attractionId: string) => {
    const a = byId.get(attractionId)
    if (!a || a.period === 'later') return
    setSceneEra('1849')
    visitTown(town.id)
    if (!isAttractionVisited(a.id)) {
      visitAttraction(a.id, town.id)
      applyKarma('gold_country_explore', `Looked at ${a.name} in ${town.name}`, -2, -1)
    }
    setSelectedId(a.id)
    setNpcLine(null)
  }

  /**
   * Clicking absence reads the year-line. It does not enter, does not visit,
   * does not pay karma — nothing is there to walk into in 1849.
   */
  const lookAbsence = (attractionId: string) => {
    setSelectedId(attractionId)
    setNpcLine(null)
  }

  const talkNpc = (line: string, name: string) => {
    setSceneEra('1849')
    applyKarma('gold_country_explore', `Talked with ${name} in ${town.name}`, 0, -2)
    setNpcLine(`${name}: “${line}”`)
    setSelectedId(null)
  }

  return (
    <div className="game-chrome-pad fixed inset-0 z-40 flex flex-col bg-[#0e0c0a]" data-testid="explore-town-face" data-town={town.id}>
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="west-face-eyebrow">In town</p>
          <h1 className="west-face-title text-2xl" data-testid="explore-town-title">{faceName}</h1>
          <p className="font-serif text-sm text-[#b8a88a]">{faceTagline}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {townWalkMap(town.id) && (!walking || sceneEra === 'today') && <button type="button" className="west-face-pill" data-testid="town-walk-start"
            onClick={() => { setWalking(true); setSceneEra('1849') }}>Walk the camp</button>}
          <button type="button" className="west-face-pill" onClick={onLeave}>Leave town</button>
        </div>
      </header>

      {walking && sceneEra === '1849' && walkSnapshot ? (presentRung === 'ascii2' && hasAscii2Walk(town.id) ? <Ascii2Viewport
        snapshot={walkSnapshot} onChange={saveTownWalk}
        allowedAttractionIds={walkAttractions.map(a => a.id)} allowedNpcIds={npcs.map(n => n.id)}
        onAttraction={enterBuilding}
        onTalk={id => { const npc = npcs.find(n => n.id === id); if (npc) talkNpc(npc.line, npc.name) }}
        onBackToLook={() => { setWalking(false); setSelectedId(null); setNpcLine(null) }}
        heading={walkHeading}
        onHeadingChange={setWalkHeading}
        onPresentPixel={() => setPresentRung('pixel')}
      /> : <TownWalkScene
        snapshot={walkSnapshot} onChange={saveTownWalk}
        allowedAttractionIds={walkAttractions.map(a => a.id)} allowedNpcIds={npcs.map(n => n.id)}
        onAttraction={enterBuilding}
        onTalk={id => { const npc = npcs.find(n => n.id === id); if (npc) talkNpc(npc.line, npc.name) }}
        onBackToLook={() => { setWalking(false); setSelectedId(null); setNpcLine(null) }}
        onToday={scene ? () => setSceneEra('today') : undefined}
        onPresentAscii2={hasAscii2Walk(town.id) ? () => setPresentRung('ascii2') : undefined}
      />) : <PlaceScene placeId={town.id} era={sceneEra} onEraChange={setSceneEra}>
        {interior ? (
          <pre
            data-testid={interior.testid}
            className="absolute inset-0 overflow-auto bg-[#0e0c0a] p-3 font-mono text-[11px] leading-[1.15] text-[#c4b896]"
          >
            {interior.rows.join('\n')}
          </pre>
        ) : art ? (
          <PlacePictureLift src={art} className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt={scene?.historical.alt ?? ''} className="absolute inset-0 h-full w-full object-contain object-center"
              style={scene?.historical.pixelated ? { imageRendering: 'pixelated' } : undefined} />
          </PlacePictureLift>
        ) : (
          <div className="absolute inset-0 bg-[#16130f]" />
        )}

        {!interior && spots.map((spot) => {
          const a = byId.get(spot.attractionId)
          if (!a) return null
          const seen = isAttractionVisited(a.id)
          return (
            <button
              key={spot.attractionId}
              type="button"
              title={a.name}
              onClick={() => enterBuilding(spot.attractionId)}
              data-testid={`explore-spot-${spot.attractionId}`}
              className={`absolute z-10 flex h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 px-2 text-xs font-serif shadow-lg ${
                seen
                  ? 'border-emerald-500/70 bg-black/70 text-emerald-200'
                  : 'border-amber-400/80 bg-black/75 text-[#e8dcc4]'
              }`}
              style={{ left: `${town.id === 'bobr_ranch' && spot.attractionId === 'bobr_campfire' ? 47 : spot.x}%`, top: `${town.id === 'bobr_ranch' && spot.attractionId === 'bobr_campfire' ? 74 : spot.y}%` }}
            >
              <span aria-hidden>{a.icon}</span>
              <span className="ml-1 hidden sm:inline">{a.name}</span>
            </button>
          )
        })}

        {showAbsence && absence.map((chip) => (
          <button
            key={chip.id}
            type="button"
            title={`${chip.label} — not yet`}
            onClick={() => lookAbsence(chip.id)}
            data-testid={`explore-later-${chip.id}`}
            className={`absolute z-10 flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed px-2 font-serif text-[11px] ${
              selectedId === chip.id
                ? 'border-[#cbdbfc]/80 bg-black/70 text-[#cbdbfc]'
                : 'border-[#9a9488]/70 bg-black/45 text-[#9a9488]'
            }`}
            style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
          >
            <span aria-hidden>◌</span>
            <span className="ml-1 hidden sm:inline">{chip.label}</span>
          </button>
        ))}

        {!interior && npcs.map((npc) => (
          <button
            key={npc.id}
            type="button"
            title={npc.name}
            onClick={() => talkNpc(npc.line, npc.name)}
            data-testid={`explore-npc-${npc.id}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-[#e8dcc4] px-2 py-1 font-serif text-[11px] text-[#1a1208]"
            style={{ left: `${npc.x}%`, top: `${npc.y}%` }}
          >
            Talk<span className="hidden sm:inline"> · {npc.name}</span>
          </button>
        ))}
      </PlaceScene>}

      <aside className={`${walking && sceneEra === '1849' ? 'max-h-[24vh] md:max-h-[38vh]' : 'max-h-[38vh]'} overflow-y-auto border-t border-[rgba(232,220,196,0.12)] bg-[#0e0c0a] px-4 py-3`}>
        {npcLine && <p className="mb-3 font-serif text-sm italic text-[#e8dcc4]">{npcLine}</p>}
        {selectedAbsence ? (
          // The year-line, not the attraction's present-day copy. The weekend box
          // office belongs to the standing theatre, so it stays off the 1849 face.
          <article className="west-face-paper" data-testid="explore-later-reading">
            <p className="west-face-eyebrow">Not yet</p>
            <h2 className="west-face-title text-xl">{selectedAbsence.label}</h2>
            <p className="west-face-body mt-2">{selectedAbsence.notYet}</p>
            <p className="mt-2 font-serif text-xs text-[#b8a88a]">
              Nothing stands here in 1849. The pin is painted, not surveyed.
            </p>
          </article>
        ) : selected ? (
          <article className="west-face-paper">
            <p className="west-face-eyebrow">{selected.category}</p>
            <h2 className="west-face-title text-xl">{selected.name}</h2>
            <p className="west-face-body mt-2">
              {interior ? interior.finding : selected.description}
            </p>
            <p className="mt-2 font-serif text-xs text-[#b8a88a]">
              {interior ? interior.trailWord : selected.funFact}
            </p>
            {selected.id === 'vol_theatre' && sceneEra !== '1849' && <VolcanoStayShow />}
          </article>
        ) : (
          <p className="font-serif text-sm text-[#b8a88a]">
            Click a building on the street to look closer, or talk to someone standing in it.
            Secrets stay off the map until they unlock.
          </p>
        )}
        {nextTrail}
        <div className="mt-3 flex flex-wrap gap-2 pl-14 md:pl-0" data-testid="explore-town-verbs">
          {present.map((a) => (
            <button
              key={a.id}
              type="button"
              className="west-face-pill text-[11px]"
              onClick={() => enterBuilding(a.id)}
            >
              {isAttractionVisited(a.id) ? '✓ ' : ''}{a.name}
            </button>
          ))}
          {(town.secretAttractions || []).filter((s) => isSecretUnlocked(s.id) && s.period !== 'later').map((a) => (
            <button key={a.id} type="button" className="west-face-pill text-[11px]" onClick={() => enterBuilding(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
