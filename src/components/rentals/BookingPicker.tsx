'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { bookingRoute, MAX_GUESTS, type BookingRouteKind } from '@/lib/bookingRoute'

/**
 * "Book Your Stay" date picker — old-west modal opened from BookStayButton.
 *
 * Blocked nights come from GET /api/availability (read-only iCal import). If that
 * can't load, or no feed has ever synced, the picker still works and says the
 * booking platform will confirm dates — it never pretends everything is open.
 * No payments here: the button hands off to Airbnb or the direct-inquiry page.
 */

type Availability =
  | { state: 'loading' }
  | { state: 'ok'; blocked: Set<string> }
  | { state: 'unavailable' }

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WINDOW_DAYS = 365

const ROUTE_LABEL: Record<BookingRouteKind, string> = {
  'long-stay': 'Send a long-stay inquiry',
  'last-minute': 'Book last-minute on Airbnb',
  airbnb: 'Continue to Airbnb',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoOf(y: number, m: number, d: number): string {
  const t = new Date(Date.UTC(y, m, d))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** Guest's local calendar date (not UTC) — "today" as they see it. */
function localTodayIso(): string {
  const n = new Date()
  return isoOf(n.getFullYear(), n.getMonth(), n.getDate())
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return isoOf(y, m - 1, d + days)
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

const THEME = {
  '--west-bg': '#0e0c0a',
  '--west-paper': '#16130f',
  '--west-ink': '#e8dcc4',
  '--west-muted': '#b8a88a',
  '--west-line': 'rgba(232, 220, 196, 0.12)',
  '--west-cream': '#e8dcc4',
  '--west-cream-ink': '#1a1208',
  '--west-pill': '#2a241c',
} as CSSProperties

const dayBase: CSSProperties = {
  aspectRatio: '1 / 1',
  minHeight: 36,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--west-ink)',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '0.9rem',
  cursor: 'pointer',
}

export default function BookingPicker({ onClose }: { onClose: () => void }) {
  const [today] = useState(localTodayIso)
  const [avail, setAvail] = useState<Availability>({ state: 'loading' })
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(2)
  const [month, setMonth] = useState(() => {
    const [y, m] = today.split('-').map(Number)
    return { y, m: m - 1 }
  })

  useEffect(() => {
    let cancelled = false
    const end = addDaysIso(today, WINDOW_DAYS)
    fetch(`/api/availability?start=${today}&end=${end}`, { cache: 'no-store' })
      .then(async resp => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = (await resp.json()) as {
          blocked_nights?: unknown
          sources?: Array<{ last_synced_at: string | null }>
        }
        // No synced source means an empty list is ignorance, not openness.
        const synced = Array.isArray(data.sources) && data.sources.some(s => s && s.last_synced_at)
        if (!synced || !Array.isArray(data.blocked_nights)) throw new Error('not synced')
        if (!cancelled) setAvail({ state: 'ok', blocked: new Set(data.blocked_nights.map(String)) })
      })
      .catch(() => {
        if (!cancelled) setAvail({ state: 'unavailable' })
      })
    return () => {
      cancelled = true
    }
  }, [today])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const blocked = avail.state === 'ok' ? avail.blocked : null

  function rangeHasBlocked(start: string, end: string): boolean {
    if (!blocked) return false
    for (let d = start; d < end; d = addDaysIso(d, 1)) if (blocked.has(d)) return true
    return false
  }

  // A valid check-out: after the pending check-in with no booked night between.
  // (Check-out may land on a booked night — that's a same-day turnover.)
  function isValidCheckOut(iso: string): boolean {
    return !!checkIn && !checkOut && iso > checkIn && !rangeHasBlocked(checkIn, iso)
  }

  function dayDisabled(iso: string): boolean {
    if (iso < today) return true
    if (isValidCheckOut(iso)) return false
    return blocked ? blocked.has(iso) : false
  }

  function pick(iso: string) {
    if (isValidCheckOut(iso)) {
      setCheckOut(iso)
    } else {
      setCheckIn(iso)
      setCheckOut(null)
    }
  }

  const cells: (string | null)[] = []
  const firstWeekday = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate()
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoOf(month.y, month.m, d))

  const monthLabel = new Date(Date.UTC(month.y, month.m, 1)).toLocaleString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const [ty, tm] = today.split('-').map(Number)
  const atFirstMonth = month.y === ty && month.m === tm - 1
  const shiftMonth = (delta: number) =>
    setMonth(({ y, m }) => {
      const t = new Date(Date.UTC(y, m + delta, 1))
      return { y: t.getUTCFullYear(), m: t.getUTCMonth() }
    })

  const route = checkIn && checkOut ? bookingRoute(checkIn, checkOut, guests, today) : null
  const external = route?.ok && /^https?:/.test(route.url)

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        ...THEME,
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(8, 6, 4, 0.78)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '4vh 16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-picker-title"
        data-testid="booking-picker"
        className="west-face-paper"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, boxSizing: 'border-box', padding: '1.25rem 1.1rem 1rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <p className="west-face-eyebrow" style={{ margin: 0 }}>Back of Beyond Ranch</p>
            <h2 id="book-picker-title" className="west-face-title" style={{ margin: '0.25rem 0 0', fontSize: '1.6rem' }}>
              Book Your Stay
            </h2>
          </div>
          <button type="button" className="west-face-pill" onClick={onClose} aria-label="Close" style={{ minWidth: 0 }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '0.9rem 0 0.6rem' }}>
          <Field label="Check-in" value={checkIn ? prettyDate(checkIn) : 'Pick a date'} active={!checkIn || !!checkOut} />
          <Field label="Check-out" value={checkOut ? prettyDate(checkOut) : '—'} active={!!checkIn && !checkOut} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.4rem 0' }}>
          <button type="button" className="west-face-pill" disabled={atFirstMonth} onClick={() => shiftMonth(-1)} aria-label="Previous month" style={{ minWidth: 0 }}>
            ‹
          </button>
          <span className="west-face-title" style={{ fontSize: '1.05rem' }} data-testid="picker-month">{monthLabel}</span>
          <button type="button" className="west-face-pill" onClick={() => shiftMonth(1)} aria-label="Next month" style={{ minWidth: 0 }}>
            ›
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="west-face-eyebrow" style={{ textAlign: 'center', letterSpacing: '0.1em', padding: '2px 0' }}>{w}</div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} />
            const disabled = dayDisabled(iso)
            const isEnd = iso === checkIn || iso === checkOut
            const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut
            const isBlocked = !!blocked?.has(iso)
            return (
              <button
                key={iso}
                type="button"
                data-date={iso}
                disabled={disabled}
                onClick={() => pick(iso)}
                aria-pressed={isEnd}
                aria-label={`${prettyDate(iso)}${isBlocked ? ' (booked)' : ''}`}
                style={{
                  ...dayBase,
                  ...(isEnd ? { background: 'var(--west-cream)', color: 'var(--west-cream-ink)', fontWeight: 600 } : null),
                  ...(inRange ? { background: 'var(--west-pill)', borderColor: 'var(--west-line)' } : null),
                  ...(disabled ? { opacity: 0.3, cursor: 'not-allowed', textDecoration: isBlocked ? 'line-through' : 'none' } : null),
                }}
              >
                {Number(iso.slice(8))}
              </button>
            )
          })}
        </div>

        <div className="west-face-row" style={{ alignItems: 'center', marginTop: '0.8rem' }}>
          <label htmlFor="book-picker-guests" className="west-face-body" style={{ color: 'var(--west-ink)' }}>Guests</label>
          <select
            id="book-picker-guests"
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="west-face-pill"
            style={{ minWidth: 0 }}
          >
            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div data-testid="availability-status" className="west-face-body" style={{ fontSize: '0.85rem', margin: '0.2rem 0 0.8rem' }}>
          {avail.state === 'loading' && 'Checking the ranch calendar…'}
          {avail.state === 'ok' && 'Struck-through dates are already booked.'}
          {avail.state === 'unavailable' &&
            "We couldn't load the ranch calendar just now — pick your dates and the booking platform will confirm what's open."}
        </div>

        {route && !route.ok && (
          <p className="west-face-body" role="alert" style={{ color: '#e8a48a', margin: '0 0 0.6rem' }}>
            Those dates don&apos;t work — please pick them again.
          </p>
        )}

        {route?.ok ? (
          <a
            href={route.url}
            data-testid="book-continue"
            data-route={route.kind}
            className="west-face-pill west-face-pill-cream"
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44, textDecoration: 'none', fontSize: '0.95rem' }}
          >
            {ROUTE_LABEL[route.kind]} · {route.nights} night{route.nights === 1 ? '' : 's'}
          </a>
        ) : (
          <button type="button" disabled className="west-face-pill west-face-pill-cream" style={{ width: '100%', minHeight: 44, fontSize: '0.95rem' }}>
            {checkIn ? 'Pick a check-out date' : 'Pick a check-in date'}
          </button>
        )}

        <p className="west-face-footer" style={{ marginTop: '0.9rem' }}>
          Availability may lag a few hours; the booking platform confirms your dates.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${active ? 'var(--west-muted)' : 'var(--west-line)'}`,
        borderRadius: 10,
        padding: '0.45rem 0.6rem',
        background: 'var(--west-bg)',
      }}
    >
      <div className="west-face-eyebrow" style={{ fontSize: 10, letterSpacing: '0.2em' }}>{label}</div>
      <div className="west-face-body" style={{ color: 'var(--west-ink)', fontSize: '0.95rem' }}>{value}</div>
    </div>
  )
}
