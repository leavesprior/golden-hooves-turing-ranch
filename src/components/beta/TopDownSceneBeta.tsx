'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { isTopDownBetaRoute } from '@/lib/topDownBetaRoute'
import { pickLine } from './greggoryLines'
import type { Hotspot, SourceLayer } from './hotspotSchema'

export type ObservationSourceLayer = 'Gold' | 'Silver' | 'Bronze'
export type TerrainKind = 'grass' | 'path' | 'scrub' | 'stone' | 'water'
export type ScenePropKind =
  | 'gate'
  | 'oak'
  | 'fence'
  | 'utility'
  | 'waterTank'
  | 'workShed'
  | 'house'
  | 'deck'
  | 'hearth'
  | 'table'
  | 'toolBench'

export interface MapPoint {
  x: number
  y: number
}

export interface TerrainTile extends MapPoint {
  id: string
  kind: TerrainKind
}

export interface ScenePropData extends MapPoint {
  id: string
  kind: ScenePropKind
  label?: string
}

export interface SceneAssetMetadata {
  id: string
  label: string
  src: string
  role: 'backdrop' | 'property-photo' | 'satellite-reference' | 'layout-reference'
  usage: string
  rightsNote?: string
}

export interface ObservationHotspot {
  id: string
  label: string
  x: number
  y: number
  prompt: string
  evidence: string
  sourceLayer: ObservationSourceLayer
  sourceNote: string
  response: string
  unlocks?: string[]
  linkedClueSlug?: string
  assetRefs?: string[]
}

export interface TopDownSceneBetaProps {
  sceneTitle: string
  sceneSubtitle: string
  backdropSrc: string
  guideName: string
  guideRole: string
  guideIntro: string
  hotspots: Array<Hotspot | ObservationHotspot>
  assets?: SceneAssetMetadata[]
  terrainTiles?: TerrainTile[]
  sceneProps?: ScenePropData[]
  walkwayPoints?: MapPoint[]
  guidePosition?: MapPoint
  playerStart?: MapPoint
}

interface RuntimeHotspot {
  id: string
  position: MapPoint
  triggerRadius: number
  evidenceKey: string
  dialogueRef: string
  sourceLayer: SourceLayer
  publicLabel: string
  fallbackPrompt?: string
  fallbackEvidence?: string
  fallbackResponse?: string
  fallbackSourceNote?: string
}

interface BetaEvidenceEntry {
  hotspotId: string
  ts: string
  sourceLayer: SourceLayer
}

interface BetaEvidenceState {
  entries: BetaEvidenceEntry[]
}

const BETA_EVIDENCE_KEY = 'beta_evidence_v1'
const PROD_STORAGE_PREFIXES = ['adventure_', 'bobr_', 'gold_country_', 'marker_']

const PUBLIC_HOTSPOT_LABELS: Record<string, string> = {
  entry_gate: 'Gate',
  water_infrastructure: 'Water',
  construction_materials: 'Work Yard',
  land_parcel: 'Land',
  guest_operations: 'Steward',
}

const SOURCE_LAYER_STYLES: Record<
  SourceLayer,
  { border: string; background: string; text: string; glow: string }
> = {
  gold: {
    border: '#f4d76b',
    background: '#5d3b12',
    text: '#fff0a8',
    glow: '0 0 18px rgba(244, 215, 107, 0.75)',
  },
  silver: {
    border: '#c0cbdc',
    background: '#29366f',
    text: '#e6ecff',
    glow: '0 0 16px rgba(192, 203, 220, 0.55)',
  },
  bronze: {
    border: '#d08a4d',
    background: '#4a2d1a',
    text: '#ffd2a3',
    glow: '0 0 14px rgba(208, 138, 77, 0.55)',
  },
}

const TERRAIN_STYLES: Record<TerrainKind, { top: string; border: string }> = {
  grass: { top: 'linear-gradient(135deg, #5b8f45 0%, #2f6b37 56%, #204a2a 100%)', border: '#8cc36f' },
  path: { top: 'linear-gradient(135deg, #c09a64 0%, #8f6845 58%, #5c3d2e 100%)', border: '#e0bd7a' },
  scrub: { top: 'linear-gradient(135deg, #8a9a52 0%, #5f7135 55%, #35451f 100%)', border: '#b4c56a' },
  stone: { top: 'linear-gradient(135deg, #9aa0a8 0%, #5f6770 55%, #343b43 100%)', border: '#c0cbdc' },
  water: { top: 'linear-gradient(135deg, #41a6f6 0%, #286bb0 52%, #163f73 100%)', border: '#8bd8ff' },
}

function isProdStorageKey(key: string) {
  return PROD_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))
}

function installBetaLocalStorageGuard() {
  if (process.env.NODE_ENV === 'production') return
  if (typeof window === 'undefined') return

  const guardWindow = window as typeof window & { __bobrTopDownBetaStorageGuardInstalled?: boolean }
  if (guardWindow.__bobrTopDownBetaStorageGuardInstalled) return

  const originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  window.localStorage.setItem = (key: string, value: string) => {
    if (isTopDownBetaRoute() && isProdStorageKey(key)) {
      throw new Error(`Top-down beta attempted prod localStorage write: ${key}`)
    }

    originalSetItem(key, value)
  }

  guardWindow.__bobrTopDownBetaStorageGuardInstalled = true
}

installBetaLocalStorageGuard()

function normalizeUnit(value: number) {
  return value > 1 ? value / 100 : value
}

function normalizePoint(point: MapPoint): MapPoint {
  return {
    x: normalizeUnit(point.x),
    y: normalizeUnit(point.y),
  }
}

function pointPercent(value: number) {
  return `${normalizeUnit(value) * 100}%`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampPoint(point: MapPoint): MapPoint {
  return {
    x: clamp(point.x, 0.08, 0.92),
    y: clamp(point.y, 0.16, 0.9),
  }
}

function distance(a: MapPoint, b: MapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function displaySourceLayer(sourceLayer: SourceLayer) {
  return sourceLayer[0].toUpperCase() + sourceLayer.slice(1)
}

function legacySourceLayer(sourceLayer: ObservationSourceLayer): SourceLayer {
  return sourceLayer.toLowerCase() as SourceLayer
}

function isSchemaHotspot(hotspot: Hotspot | ObservationHotspot): hotspot is Hotspot {
  return 'position' in hotspot
}

function normalizeHotspot(hotspot: Hotspot | ObservationHotspot): RuntimeHotspot {
  if (isSchemaHotspot(hotspot)) {
    return {
      id: hotspot.id,
      position: normalizePoint(hotspot.position),
      triggerRadius: hotspot.triggerRadius,
      evidenceKey: hotspot.evidenceKey,
      dialogueRef: hotspot.dialogueRef,
      sourceLayer: hotspot.sourceLayer,
      publicLabel: PUBLIC_HOTSPOT_LABELS[hotspot.id] ?? hotspot.id.replace(/_/g, ' '),
    }
  }

  return {
    id: hotspot.id,
    position: normalizePoint({ x: hotspot.x, y: hotspot.y }),
    triggerRadius: 0.08,
    evidenceKey: hotspot.id,
    dialogueRef: hotspot.id,
    sourceLayer: legacySourceLayer(hotspot.sourceLayer),
    publicLabel: hotspot.label,
    fallbackPrompt: hotspot.prompt,
    fallbackEvidence: hotspot.evidence,
    fallbackResponse: hotspot.response,
    fallbackSourceNote: hotspot.sourceNote,
  }
}

function readBetaEvidence(): BetaEvidenceState {
  if (typeof window === 'undefined') return { entries: [] }

  try {
    const raw = window.localStorage.getItem(BETA_EVIDENCE_KEY)
    if (!raw) return { entries: [] }
    const parsed = JSON.parse(raw) as Partial<BetaEvidenceState>
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] }
  } catch {
    return { entries: [] }
  }
}

function appendBetaEvidenceEntry(hotspot: RuntimeHotspot): BetaEvidenceEntry[] {
  if (typeof window === 'undefined') return []

  const state = readBetaEvidence()
  const entries = [
    ...state.entries,
    {
      hotspotId: hotspot.id,
      ts: new Date().toISOString(),
      sourceLayer: hotspot.sourceLayer,
    },
  ]

  window.localStorage.setItem(BETA_EVIDENCE_KEY, JSON.stringify({ entries }))
  return entries
}

function IsoTile({ x, y, kind }: { x: number; y: number; kind: TerrainKind }) {
  const style = TERRAIN_STYLES[kind]

  return (
    <div
      className="absolute h-[clamp(36px,9vw,78px)] w-[clamp(66px,17vw,144px)] -translate-x-1/2 -translate-y-1/2"
      style={{ left: pointPercent(x), top: pointPercent(y) }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 border-2"
        style={{
          background: style.top,
          borderColor: style.border,
          clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
          boxShadow:
            'inset -12px -12px 0 rgba(0,0,0,0.14), inset 10px 8px 0 rgba(255,255,255,0.08), 0 12px 0 rgba(0,0,0,0.18)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-white/25"
        style={{ boxShadow: '18px 10px 0 rgba(255,255,255,0.12), -22px 8px 0 rgba(0,0,0,0.15)' }}
      />
    </div>
  )
}

function SceneProp({ x, y, kind }: { x: number; y: number; kind: ScenePropKind }) {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-full origin-bottom scale-[0.72] sm:scale-100"
      style={{ left: pointPercent(x), top: pointPercent(y) }}
      aria-hidden="true"
    >
      {kind === 'gate' && (
        <div className="relative h-20 w-32">
          <div className="absolute bottom-0 left-4 h-20 w-4 bg-[#5c3420] shadow-[inset_-3px_0_0_#2b170d]" />
          <div className="absolute bottom-0 right-4 h-20 w-4 bg-[#5c3420] shadow-[inset_-3px_0_0_#2b170d]" />
          <div className="absolute bottom-12 left-0 h-4 w-full bg-[#6e4527]" />
          <div className="absolute bottom-6 left-5 h-4 w-[88px] bg-[#754a2c]" />
          <div className="absolute bottom-[34px] left-8 h-3 w-20 rotate-[24deg] bg-[#4f2d1d]" />
          <div className="absolute bottom-[34px] left-8 h-3 w-20 rotate-[-24deg] bg-[#4f2d1d]" />
        </div>
      )}
      {kind === 'oak' && (
        <div className="relative h-24 w-20">
          <div className="absolute bottom-0 left-8 h-16 w-5 bg-[#5c3420]" />
          <div className="absolute left-3 top-3 h-12 w-12 bg-[#1e4d2b] shadow-[12px_5px_0_#2f6b37,-7px_13px_0_#315f31,2px_-6px_0_#49793a]" />
          <div className="absolute left-11 top-7 h-9 w-9 bg-[#163b22]" />
        </div>
      )}
      {kind === 'fence' && (
        <div className="relative h-10 w-28">
          <div className="absolute bottom-5 left-0 h-3 w-full bg-[#6e4527]" />
          <div className="absolute bottom-1 left-0 h-3 w-full bg-[#4f2d1d]" />
          {[0, 26, 52, 78, 104].map(post => (
            <div key={post} className="absolute bottom-0 h-10 w-3 bg-[#7a4d2d]" style={{ left: post }} />
          ))}
        </div>
      )}
      {kind === 'utility' && (
        <div className="relative h-16 w-14">
          <div className="absolute bottom-0 left-6 h-16 w-3 bg-[#3b2a1f]" />
          <div className="absolute left-2 top-4 h-3 w-10 bg-[#8f6845]" />
          <div className="absolute left-1 top-1 h-5 w-5 border-2 border-[#c0cbdc] bg-[#29366f]" />
          <div className="absolute right-0 top-1 h-5 w-5 border-2 border-[#c0cbdc] bg-[#29366f]" />
        </div>
      )}
      {kind === 'waterTank' && (
        <div className="relative h-16 w-14">
          <div className="absolute bottom-0 left-2 h-10 w-10 border-2 border-[#c0cbdc] bg-[#286bb0]" />
          <div className="absolute left-0 top-1 h-5 w-14 bg-[#8f6845]" />
        </div>
      )}
      {kind === 'workShed' && (
        <div className="relative h-16 w-20">
          <div className="absolute bottom-0 left-2 h-10 w-16 bg-[#5c3d2e]" />
          <div
            className="absolute left-0 top-1 h-8 w-20 bg-[#8f6845]"
            style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}
          />
          <div className="absolute bottom-0 left-8 h-8 w-5 bg-[#24170d]" />
        </div>
      )}
      {kind === 'house' && (
        <div className="relative h-24 w-32">
          <div className="absolute bottom-0 left-4 h-16 w-24 bg-[#70472c]" />
          <div className="absolute left-0 top-0 h-12 w-32 bg-[#9b6a3d]" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
          <div className="absolute bottom-0 left-14 h-9 w-5 bg-[#1a1210]" />
        </div>
      )}
      {(kind === 'deck' || kind === 'table' || kind === 'toolBench' || kind === 'hearth') && (
        <div className="relative h-14 w-24">
          <div className="absolute bottom-0 left-3 h-10 w-[72px] bg-[#5c3d2e]" />
          <div className="absolute bottom-9 left-0 h-4 w-24 bg-[#8f6845]" />
          <div className="absolute bottom-12 left-5 h-2 w-7 bg-[#c0cbdc]" />
          <div className="absolute bottom-12 right-5 h-2 w-5 bg-[#f4d76b]" />
        </div>
      )}
    </div>
  )
}

function PlayerSprite({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-40 h-12 w-8 -translate-x-1/2 -translate-y-full scale-90 transition-[left,top] duration-300 ease-out sm:scale-100"
      style={{ left: pointPercent(x), top: pointPercent(y) }}
      aria-hidden="true"
    >
      <div className="absolute -bottom-2 left-1/2 h-3 w-8 -translate-x-1/2 bg-black/45" style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }} />
      <div className="absolute left-2 top-0 h-2 w-4 bg-[#8f6845]" />
      <div className="absolute left-0 top-2 h-2 w-8 bg-[#5c3d2e]" />
      <div className="absolute left-2 top-5 h-4 w-4 bg-[#d2a679]" />
      <div className="absolute left-1.5 top-9 h-6 w-5 bg-[#315f43]" />
      <div className="absolute bottom-0 left-1.5 h-3 w-2 bg-[#2b2117]" />
      <div className="absolute bottom-0 right-1.5 h-3 w-2 bg-[#2b2117]" />
    </div>
  )
}

function GuideSprite({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-30 h-14 w-10 -translate-x-1/2 -translate-y-full scale-90 sm:scale-100"
      style={{ left: pointPercent(x), top: pointPercent(y) }}
      aria-hidden="true"
    >
      <div className="absolute -bottom-2 left-1/2 h-3 w-10 -translate-x-1/2 bg-[#f4d76b]/30" style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }} />
      <div className="absolute left-2 top-0 h-3 w-6 bg-[#3b2a1f]" />
      <div className="absolute left-0 top-3 h-2 w-10 bg-[#2b170d]" />
      <div className="absolute left-3 top-7 h-4 w-4 bg-[#c49a6c]" />
      <div className="absolute left-2 top-11 h-7 w-6 bg-[#6d4b2a]" />
      <div className="absolute right-0 top-9 h-8 w-2 rotate-[-18deg] bg-[#8f6845]" />
    </div>
  )
}

export function TopDownSceneBeta({
  sceneTitle,
  sceneSubtitle,
  backdropSrc,
  guideName,
  guideRole,
  guideIntro,
  hotspots,
  terrainTiles = [],
  sceneProps = [],
  walkwayPoints = [],
  guidePosition = { x: 0.35, y: 0.72 },
  playerStart = { x: 0.47, y: 0.77 },
}: TopDownSceneBetaProps) {
  const runtimeHotspots = useMemo(() => hotspots.map(normalizeHotspot), [hotspots])
  const normalizedPlayerStart = useMemo(() => normalizePoint(playerStart), [playerStart])
  const [playerPosition, setPlayerPosition] = useState<MapPoint>(normalizedPlayerStart)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({})
  const [evidenceEntries, setEvidenceEntries] = useState<BetaEvidenceEntry[]>([])
  const lastTriggeredHotspotId = useRef<string | null>(null)

  const activeHotspot = runtimeHotspots.find(hotspot => hotspot.id === activeHotspotId) ?? null
  const activeInteractionCount = activeHotspot ? interactionCounts[activeHotspot.id] ?? 0 : 0
  const activeLine = activeHotspot
    ? pickLine(activeHotspot.dialogueRef, Math.max(1, activeInteractionCount))
    : null
  const activeLayerStyle = activeHotspot
    ? SOURCE_LAYER_STYLES[activeHotspot.sourceLayer]
    : SOURCE_LAYER_STYLES.bronze
  const uniqueEvidenceCount = new Set(evidenceEntries.map(entry => entry.hotspotId)).size
  const journalProgress = `${uniqueEvidenceCount}/${runtimeHotspots.length}`

  const triggerHotspot = useCallback((hotspot: RuntimeHotspot) => {
    setActiveHotspotId(hotspot.id)
    setInteractionCounts(current => ({
      ...current,
      [hotspot.id]: (current[hotspot.id] ?? 0) + 1,
    }))
    setEvidenceEntries(appendBetaEvidenceEntry(hotspot))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEvidenceEntries(readBetaEvidence().entries)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const step = event.shiftKey ? 0.06 : 0.035
      let dx = 0
      let dy = 0

      if (key === 'arrowleft' || key === 'a') dx = -step
      if (key === 'arrowright' || key === 'd') dx = step
      if (key === 'arrowup' || key === 'w') dy = -step
      if (key === 'arrowdown' || key === 's') dy = step
      if (dx === 0 && dy === 0) return

      event.preventDefault()
      setPlayerPosition(current => clampPoint({ x: current.x + dx, y: current.y + dy }))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const nearestHotspot = runtimeHotspots.find(
      hotspot => distance(playerPosition, hotspot.position) <= hotspot.triggerRadius,
    )

    if (!nearestHotspot) {
      lastTriggeredHotspotId.current = null
      return
    }

    if (lastTriggeredHotspotId.current === nearestHotspot.id) return undefined
    lastTriggeredHotspotId.current = nearestHotspot.id

    const timer = window.setTimeout(() => {
      triggerHotspot(nearestHotspot)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [playerPosition, runtimeHotspots, triggerHotspot])

  function handleMapPointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('[data-hotspot-id]')) return

    const bounds = event.currentTarget.getBoundingClientRect()
    setPlayerPosition(clampPoint({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    }))
  }

  function handleHotspotPointerDown(event: PointerEvent<HTMLButtonElement>, hotspot: RuntimeHotspot) {
    event.stopPropagation()
    lastTriggeredHotspotId.current = hotspot.id
    setPlayerPosition(hotspot.position)
    triggerHotspot(hotspot)
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="border-4 border-[var(--pixel-ui-border)] bg-[#10140f] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-[var(--pixel-ui-border)] bg-[#172331] px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div>
            <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">
              Walkthrough field scene
            </p>
            <h1 className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-base">
              {sceneTitle}
            </h1>
          </div>
          <p className="max-w-md font-[var(--font-pixel)] text-[6px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[7px]">
            {sceneSubtitle}
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div
            className="relative isolate min-h-[430px] overflow-hidden bg-[#101916] sm:min-h-[560px] lg:min-h-[590px]"
            onPointerDown={handleMapPointerDown}
          >
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-[1px] saturate-125"
              style={{ backgroundImage: `url(${backdropSrc})` }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_18%,rgba(244,215,107,0.28),transparent_30%),linear-gradient(180deg,rgba(15,15,27,0.05)_0%,rgba(15,15,27,0.78)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:24px_24px] opacity-25" />
            <div className="absolute left-4 top-4 z-30 border-2 border-[#41a6f6] bg-[#0f0f1b]/80 px-3 py-2 shadow-[inset_0_0_0_2px_#29366f]">
              <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)]">Journal {journalProgress}</p>
            </div>

            {terrainTiles.map(tile => (
              <IsoTile key={tile.id} x={tile.x} y={tile.y} kind={tile.kind} />
            ))}

            {walkwayPoints.map((point, index) => (
              <div
                key={`${point.x}-${point.y}`}
                className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-[#f4d76b]/70"
                style={{
                  left: pointPercent(point.x),
                  top: pointPercent(point.y),
                  clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                  opacity: 0.35 + index * 0.08,
                }}
                aria-hidden="true"
              />
            ))}

            {sceneProps.map(prop => (
              <SceneProp key={prop.id} x={prop.x} y={prop.y} kind={prop.kind} />
            ))}

            <GuideSprite x={guidePosition.x} y={guidePosition.y} />
            <PlayerSprite x={playerPosition.x} y={playerPosition.y} />

            {runtimeHotspots.map(hotspot => {
              const isActive = hotspot.id === activeHotspot?.id
              const isRecorded = evidenceEntries.some(entry => entry.hotspotId === hotspot.id)
              const layerStyle = SOURCE_LAYER_STYLES[hotspot.sourceLayer]

              return (
                <button
                  key={hotspot.id}
                  type="button"
                  data-hotspot-id={hotspot.id}
                  onPointerDown={event => handleHotspotPointerDown(event, hotspot)}
                  className="absolute z-50 -translate-x-1/2 -translate-y-full p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#fff0a8]"
                  style={{ left: pointPercent(hotspot.position.x), top: pointPercent(hotspot.position.y) }}
                  aria-pressed={isActive}
                  aria-label={`Inspect ${hotspot.publicLabel}`}
                >
                  <span
                    className="mx-auto block h-8 w-8 border-2 shadow-[0_10px_0_rgba(0,0,0,0.3)]"
                    style={{
                      background: isActive ? layerStyle.border : layerStyle.background,
                      borderColor: isActive ? '#fff7c7' : layerStyle.border,
                      boxShadow: isActive ? layerStyle.glow : '0 0 10px rgba(0,0,0,0.75)',
                      clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                    }}
                  />
                  <span
                    className="mt-2 hidden max-w-[124px] -translate-x-8 items-center gap-1 border-2 bg-[#130e09]/90 px-2 py-1 font-[var(--font-pixel)] text-[7px] leading-relaxed sm:flex"
                    style={{ borderColor: isActive ? layerStyle.border : '#3b2a1f', color: layerStyle.text }}
                  >
                    <span>{hotspot.publicLabel}</span>
                    {isRecorded && <span aria-label="Evidence recorded">OK</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <aside className="border-t-4 border-[var(--pixel-ui-border)] bg-[#151b2c] p-3 sm:p-4 lg:border-l-4 lg:border-t-0">
            <div className="mb-3 flex gap-3 border-2 border-[#41a6f6] bg-[#0f0f1b] p-3 shadow-[inset_0_0_0_2px_#29366f] sm:mb-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center border-2 border-[#d4a04a] bg-[#2b2117] font-[var(--font-pixel)] text-[13px] text-[var(--pixel-gold-light)]">
                GP
              </div>
              <div>
                <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">
                  {guideRole}
                </p>
                <h2 className="mt-2 font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                  {guideName}
                </h2>
                <p className="mt-3 font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)]">
                  {guideIntro}
                </p>
              </div>
            </div>

            {activeHotspot && activeLine ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="border-2 border-[#29366f] bg-[#111827] p-3">
                  <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">
                    Observed Detail
                  </p>
                  <p className="mt-2 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]">
                    {activeHotspot.publicLabel}
                  </p>
                </div>
                <div className="border-2 border-[#41a6f6] bg-[#0f0f1b] p-3 shadow-[inset_0_0_0_2px_#29366f]">
                  <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">
                    Greggory Pryor
                  </p>
                  <p className="mt-2 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]">
                    {activeLine.text}
                  </p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">
                    Source Layer
                  </p>
                  <div className="mt-2 flex flex-wrap items-start gap-2">
                    <span
                      className="border-2 px-2 py-1 font-[var(--font-pixel)] text-[8px]"
                      style={{
                        borderColor: activeLayerStyle.border,
                        background: activeLayerStyle.background,
                        color: activeLayerStyle.text,
                      }}
                    >
                      {displaySourceLayer(activeHotspot.sourceLayer)}
                    </span>
                    <p className="min-w-0 flex-1 font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)]">
                      Evidence key: {activeHotspot.evidenceKey}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-[#29366f] bg-[#111827] p-3">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)]">
                  {guideIntro}
                </p>
              </div>
            )}

            <div className="mt-5 border-2 border-[#6d4b2a] bg-[#130e09] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-[var(--font-pixel)] text-[7px] uppercase text-[var(--pixel-forest-light)]">Field Journal</p>
                <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)]">{journalProgress}</p>
              </div>
              {evidenceEntries.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {evidenceEntries.slice(-5).map((entry, index) => (
                    <li
                      key={`${entry.hotspotId}-${entry.ts}-${index}`}
                      className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-gold-light)]"
                    >
                      {PUBLIC_HOTSPOT_LABELS[entry.hotspotId] ?? entry.hotspotId.replace(/_/g, ' ')}:
                      {' '}
                      {displaySourceLayer(entry.sourceLayer)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)]">
                  No evidence recorded yet.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
