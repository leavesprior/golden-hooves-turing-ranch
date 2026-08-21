'use client'

// ============================================================================
// UNIFIED MAP (2026-06-17) — the one Gold Country map, with a state→county→local
// zoom hierarchy, reading from the canonical town registry (src/lib/townRegistry).
// Replaces the "three different maps showing different info" confusion with one
// coherent zoom. Additive: existing maps keep working; this is the new canonical
// surface that the others migrate onto.
//
//   STATE  → the four Gold Country counties (pick one)
//   COUNTY → that county's real towns, placed by real lat/lng (pick one)
//   LOCAL  → the town: real place-art + a link into its detailed explorer view
//
// Higher-resolution / unlocked detail can later hang off the LOCAL level.
// ============================================================================

import { useEffect, useState } from 'react'
import { readDiscovered, isDiscovered } from '@/lib/oneMapDiscovery'
import Link from 'next/link'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'
import { hasInvestigation } from '@/lib/townInvestigations'
import {
  COUNTIES,
  getTownsByCounty,
  getCanonicalTown,
  projectToSvg,
  getBoundsForTowns,
  type County,
  type CanonicalTown,
} from '@/lib/townRegistry'

type View =
  | { level: 'state' }
  | { level: 'county'; county: County }
  | { level: 'local'; townId: string }

const GOLD = 'var(--pixel-gold-light)'

export function UnifiedMap() {
  const [view, setView] = useState<View>({ level: 'state' })
  const [known, setKnown] = useState<string[]>(['independence', 'bobr_ranch'])
  useEffect(() => { setKnown(readDiscovered()) }, [view])

  return (
    <div className="mx-auto max-w-4xl px-3 py-4">
      <p className="west-face-eyebrow">The one map · grows as you walk</p>
      <p className="west-face-body mb-3">Known places: {known.length}. Fog stays until you arrive or GPS puts you there.</p>
      {/* Breadcrumb / zoom path */}
      <nav className="mb-4 flex items-center gap-2 font-[var(--font-pixel)] text-[11px]">
        <button onClick={() => setView({ level: 'state' })} className="text-[var(--pixel-gold-light)] hover:underline">
          California
        </button>
        {view.level !== 'state' && (
          <>
            <span className="text-[var(--pixel-ui-text)]/50">›</span>
            <button
              onClick={() => setView({ level: 'county', county: view.level === 'county' ? view.county : (getCanonicalTown((view as { townId: string }).townId)?.county as County) })}
              className="text-[var(--pixel-gold-light)] hover:underline"
            >
              {view.level === 'county' ? view.county : getCanonicalTown(view.townId)?.county} County
            </button>
          </>
        )}
        {view.level === 'local' && (
          <>
            <span className="text-[var(--pixel-ui-text)]/50">›</span>
            <span className="text-[var(--pixel-ui-text)]">{getCanonicalTown(view.townId)?.name}</span>
          </>
        )}
      </nav>

      {view.level === 'state' && <StateView onPick={(county) => setView({ level: 'county', county })} />}
      {view.level === 'county' && (
        <CountyView
          county={view.county}
          onPickTown={(townId) => setView({ level: 'local', townId })}
          onBack={() => setView({ level: 'state' })}
        />
      )}
      {view.level === 'local' && (
        <LocalView
          town={getCanonicalTown(view.townId)}
          onBack={(c) => setView({ level: 'county', county: c })}
        />
      )}
    </div>
  )
}

// --- STATE: the four counties -----------------------------------------------
function StateView({ onPick }: { onPick: (c: County) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-center font-[var(--font-pixel)] text-[15px]" style={{ color: GOLD }}>
        THE MOTHER LODE
      </h2>
      <p className="mb-4 text-center font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70">
        California gold country — choose a county to zoom in.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COUNTIES.map((c) => {
          const towns = getTownsByCounty(c.id)
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="flex flex-col border-2 border-[var(--pixel-gold-dark)] bg-black/40 p-3 text-left transition-colors hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/15"
            >
              <span className="font-[var(--font-pixel)] text-[12px]" style={{ color: GOLD }}>{c.name}</span>
              <span className="mt-1 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">{c.blurb}</span>
              <span className="mt-2 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]/50">{towns.length} town{towns.length === 1 ? '' : 's'} ▸</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- COUNTY: that county's towns on a real-geography SVG --------------------
function CountyView({ county, onPickTown, onBack }: { county: County; onPickTown: (id: string) => void; onBack: () => void }) {
  const towns = getTownsByCounty(county)
  const bounds = getBoundsForTowns(towns) // fit THIS county to its own frame
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[var(--font-pixel)] text-[13px]" style={{ color: GOLD }}>{county} County</h2>
        <button onClick={onBack} className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70 hover:text-[var(--pixel-gold-light)]">◂ all counties</button>
      </div>
      {/* Numbered pins keep the real geography readable even where towns cluster;
          the numbered list below names them. Pins are clickable; text never
          intercepts the click (pointer-events none). */}
      <div className="relative w-full overflow-hidden rounded-lg border-2 border-[var(--pixel-gold-dark)] bg-[#15131f]" style={{ aspectRatio: '4 / 3' }}>
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {towns.map((t, i) => {
            const p = projectToSvg(t, bounds)
            const seen = isDiscovered(t.id)
            return (
              <g key={t.id} className={seen ? 'cursor-pointer' : 'cursor-default'} onClick={() => seen && onPickTown(t.id)}>
                <circle cx={p.x} cy={p.y} r="5" fill="transparent" />
                <circle cx={p.x} cy={p.y} r="3" fill={seen ? 'var(--pixel-gold-mid)' : '#3a342c'} stroke={seen ? 'var(--pixel-gold-light)' : '#5a5044'} strokeWidth="0.6" />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="3" fontWeight="bold" fill="#15131f" style={{ pointerEvents: 'none' }}>{seen ? i + 1 : '?'}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {towns.map((t, i) => {
          const seen = isDiscovered(t.id)
          return (
          <button key={t.id} disabled={!seen} onClick={() => seen && onPickTown(t.id)} className="flex items-center gap-2 border border-[var(--pixel-ui-border)] bg-black/30 px-2 py-1.5 text-left font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] transition-colors hover:bg-[var(--pixel-gold-dark)]/20 disabled:opacity-40">
            <span className="inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--pixel-gold-mid)] text-[8px] text-[#15131f]">{seen ? i + 1 : '?'}</span>
            {seen ? t.name : 'Unmapped'}
          </button>
          )
        })}
      </div>
    </div>
  )
}

// --- LOCAL: a town, picture-led, linking into the detailed explorer ---------
function LocalView({ town, onBack }: { town: CanonicalTown | undefined; onBack: (c: County) => void }) {
  if (!town) return <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">Unknown town.</p>
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[var(--font-pixel)] text-[14px]" style={{ color: GOLD }}>{town.name}</h2>
        <button onClick={() => onBack(town.county)} className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70 hover:text-[var(--pixel-gold-light)]">◂ {town.county} County</button>
      </div>
      <PlaceBackdrop id={town.artId} className="h-48 rounded-lg border-2 border-[var(--pixel-gold-dark)]" />
      <p className="mt-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/60">{town.county} County · {town.lat.toFixed(3)}, {town.lng.toFixed(3)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {hasInvestigation(town.id) && (
          <Link href={`/town/${town.id}`} className="border-2 border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]/20 px-3 py-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] transition-colors hover:bg-[var(--pixel-gold-dark)]/40">
            🔍 Investigate {town.name} ▸
          </Link>
        )}
        <Link href="/explore" className="border-2 border-[var(--pixel-gold-dark)] px-3 py-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] transition-colors hover:bg-[var(--pixel-gold-dark)]/20">
          Explore {town.name} ▸
        </Link>
      </div>
      <p className="mt-3 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/40">
        One map, one source of truth — this town is the same place across the chase, the explorer, and the journey.
      </p>
    </div>
  )
}
