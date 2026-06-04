'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Real availability calendar — Phase 1 of the direct-booking build.
 *
 * Reads merged blocked nights from /api/availability (Airbnb + VRBO + manual,
 * imported READ-ONLY from iCal) and renders open vs. unavailable dates. This is
 * what turns the site from "brochure that bounces to Airbnb" into one that
 * knows what's actually open. No write-back, no booking action yet.
 */

interface AvailabilityResponse {
  range_start: string
  range_end: string
  blocked_nights: string[]
  sources: Array<{ source: string; block_count: number; last_synced_at: string | null }>
}

const MONTHS_SHOWN = 3
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addMonths(base: Date, n: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, 1))
}

function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

interface DayCell {
  iso: string
  day: number
  blocked: boolean
  past: boolean
}

function buildMonthGrid(monthStart: Date, blocked: Set<string>, today: string): (DayCell | null)[] {
  const year = monthStart.getUTCFullYear()
  const month = monthStart.getUTCMonth()
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const cells: (DayCell | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoDate(new Date(Date.UTC(year, month, day)))
    cells.push({ iso, day, blocked: blocked.has(iso), past: iso < today })
  }
  return cells
}

export default function AvailabilityCalendar() {
  const [data, setData] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)

  const today = useMemo(() => isoDate(new Date()), [])
  const firstMonth = useMemo(
    () => addMonths(new Date(`${today}T00:00:00Z`), monthOffset),
    [today, monthOffset],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const start = isoDate(firstMonth)
    const end = isoDate(addMonths(firstMonth, MONTHS_SHOWN))
    try {
      const resp = await fetch(`/api/availability?start=${start}&end=${end}`, { cache: 'no-store' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      setData(await resp.json())
    } catch (err) {
      setError((err as Error).message || 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [firstMonth])

  useEffect(() => {
    load()
  }, [load])

  const blockedSet = useMemo(() => new Set(data?.blocked_nights ?? []), [data])
  const months = useMemo(
    () => Array.from({ length: MONTHS_SHOWN }, (_, i) => addMonths(firstMonth, i)),
    [firstMonth],
  )

  const totalBlocks = useMemo(
    () => (data?.sources ?? []).reduce((sum, s) => sum + s.block_count, 0),
    [data],
  )

  return (
    <div
      style={{
        border: '2px solid var(--pixel-ui-border)',
        background: 'var(--pixel-bg-dark)',
        padding: '1rem',
        color: 'var(--pixel-ui-text)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
          disabled={monthOffset === 0 || loading}
          style={navBtnStyle(monthOffset === 0 || loading)}
          aria-label="Previous months"
        >
          {'‹'} Prev
        </button>
        <strong style={{ color: 'var(--pixel-gold-light)' }}>Availability</strong>
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={loading}
          style={navBtnStyle(loading)}
          aria-label="Next months"
        >
          Next {'›'}
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', opacity: 0.8 }}>Loading open dates{'…'}</p>}

      {error && (
        <p style={{ textAlign: 'center', color: 'var(--pixel-fire-orange)' }}>
          Could not load availability ({error}). Please email to check open dates.
        </p>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${MONTHS_SHOWN}, 1fr)`,
              gap: '1rem',
            }}
          >
            {months.map((m) => (
              <MonthGrid key={isoDate(m)} monthStart={m} blocked={blockedSet} today={today} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '0.9rem', fontSize: '0.8rem' }}>
            <Legend swatch="var(--pixel-forest-mid)" label="Open" />
            <Legend swatch="var(--pixel-bg-mid)" label="Booked / blocked" />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.72rem', opacity: 0.6, marginTop: '0.6rem' }}>
            {totalBlocks > 0
              ? `Synced from ${(data?.sources ?? []).map((s) => s.source).join(' + ')} - ${totalBlocks} blocked range(s)`
              : 'Live calendar sync not yet connected - email to confirm dates.'}
          </p>
        </>
      )}
    </div>
  )
}

function MonthGrid({ monthStart, blocked, today }: { monthStart: Date; blocked: Set<string>; today: string }) {
  const cells = buildMonthGrid(monthStart, blocked, today)
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '0.4rem', color: 'var(--pixel-gold-mid)', fontSize: '0.85rem' }}>
        {monthLabel(monthStart)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {WEEKDAYS.map((w, i) => (
          <div key={`wd-${i}`} style={{ textAlign: 'center', fontSize: '0.65rem', opacity: 0.55 }}>
            {w}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`blank-${i}`} />
          ) : (
            <div
              key={cell.iso}
              title={cell.blocked ? `${cell.iso} - booked` : `${cell.iso} - open`}
              style={dayStyle(cell)}
            >
              {cell.day}
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ width: 12, height: 12, background: swatch, border: '1px solid var(--pixel-ui-border)', display: 'inline-block' }} />
      {label}
    </span>
  )
}

function dayStyle(cell: DayCell): React.CSSProperties {
  const open = !cell.blocked && !cell.past
  return {
    textAlign: 'center',
    fontSize: '0.72rem',
    padding: '0.3rem 0',
    background: cell.past
      ? 'transparent'
      : open
        ? 'var(--pixel-forest-mid)'
        : 'var(--pixel-bg-mid)',
    color: cell.past ? 'rgba(255,255,255,0.25)' : 'var(--pixel-ui-text)',
    border: '1px solid var(--pixel-ui-border)',
    opacity: cell.past ? 0.4 : 1,
    textDecoration: cell.blocked && !cell.past ? 'line-through' : 'none',
  }
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'var(--pixel-bg-mid)',
    color: 'var(--pixel-ui-text)',
    border: '2px solid var(--pixel-ui-border)',
    padding: '0.3rem 0.7rem',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: '0.78rem',
  }
}
