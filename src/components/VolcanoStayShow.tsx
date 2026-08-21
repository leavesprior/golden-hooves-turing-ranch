'use client'

import { useMemo, useState } from 'react'
import { useKarma } from '@/lib/karmaContext'
import { trackEvent } from '@/lib/eventTracker'
import {
  THEATRE_TICKETS_URL,
  upcomingShows,
  defaultStayForShow,
  nightsOverlapShow,
  airbnbRoomUrl,
  todayIso,
  writeHold,
  readHold,
  type TheatreShow,
  type StayWindow,
} from '@/lib/volcanoStayShow'
import { xmoneySeamStatus } from '@/lib/xmoneySeam'

function bumpStay(stay: StayWindow, deltaNights: number): StayWindow {
  const nights = Math.max(1, Math.min(5, stay.nights + deltaNights))
  const [y, m, d] = stay.checkIn.split('-').map(Number)
  const inMs = Date.UTC(y, m - 1, d)
  const checkOut = new Date(inMs + nights * 24 * 3600 * 1000)
  const yy = checkOut.getUTCFullYear()
  const mm = String(checkOut.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(checkOut.getUTCDate()).padStart(2, '0')
  return { ...stay, nights, checkOut: `${yy}-${mm}-${dd}` }
}

export function VolcanoStayShow() {
  const { applyKarma } = useKarma()
  const today = todayIso()
  const shows = useMemo(() => upcomingShows(today), [today])
  const first = shows[0]
  const [showId, setShowId] = useState(first?.id || '')
  const show: TheatreShow | undefined = shows.find((s) => s.id === showId) || first
  const [stay, setStay] = useState<StayWindow>(() =>
    first ? defaultStayForShow(first, today) : { checkIn: today, checkOut: today, nights: 2, adults: 2 }
  )
  const [held, setHeld] = useState(() => readHold())
  const seam = xmoneySeamStatus()
  const overlap = show ? nightsOverlapShow(stay, show) : false

  const onShowChange = (id: string) => {
    const next = shows.find((s) => s.id === id)
    setShowId(id)
    if (next) setStay(defaultStayForShow(next, today, stay.nights, stay.adults))
  }

  const holdBoxOffice = () => {
    if (!show || !overlap) return
    const rec = { showId: show.id, stay, heldAt: new Date().toISOString() }
    writeHold(rec)
    setHeld(rec)
    applyKarma(
      'volcano_stay_show',
      `Held Volcano box office for ${show.title} · ranch ${stay.checkIn}–${stay.checkOut}`,
      -4,
      -2
    )
    try {
      trackEvent('volcano_stay_show', 'hold', show.id)
    } catch { /* tracker optional */ }
  }

  const openRanch = () => {
    window.open(airbnbRoomUrl(stay), '_blank', 'noopener,noreferrer')
  }

  const openTickets = () => {
    window.open(show?.ticketsUrl || THEATRE_TICKETS_URL, '_blank', 'noopener,noreferrer')
  }

  if (!show) {
    return (
      <div className="west-face-paper mt-3">
        <p className="west-face-eyebrow">Cobblestone Theatre</p>
        <p className="west-face-body mt-2">No remaining 2026 dates on the season card. Check volcanotheatre.net.</p>
      </div>
    )
  }

  return (
    <div className="west-face-paper mt-3">
      <p className="west-face-eyebrow">Same weekend · ranch and theatre</p>
      <h3 className="west-face-title mt-1 text-xl">Hold a box for {show.title}</h3>
      <p className="west-face-body mt-2">
        The box office keeps the night if you sleep at the ranch. Cobblestone holds about
        fifty; doors a half-hour before curtain. Pick nights that overlap the run, then open
        the ranch calendar and the ticket window with those dates in hand. Karma records the
        hold. Airbnb and volcanotheatre.net still take the money.
      </p>

      <label className="mt-4 block font-serif text-xs text-[#b8a88a]">
        Show
        <select
          className="mt-1 w-full rounded border border-[rgba(232,220,196,0.2)] bg-[#0e0c0a] px-2 py-2 text-sm text-[#e8dcc4]"
          value={show.id}
          onChange={(e) => onShowChange(e.target.value)}
        >
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} · {s.start} – {s.end} · {s.venue}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center justify-between gap-3 font-serif text-sm text-[#e8dcc4]">
        <span>{stay.checkIn} → {stay.checkOut}</span>
        <span className="flex gap-2">
          <button type="button" className="west-face-pill text-xs" onClick={() => setStay((s) => bumpStay(s, -1))}>
            − night
          </button>
          <button type="button" className="west-face-pill text-xs" onClick={() => setStay((s) => bumpStay(s, 1))}>
            + night
          </button>
        </span>
      </div>
      <p className="mt-1 font-serif text-xs text-[#b8a88a]">
        {overlap ? 'Those nights sit inside the run.' : 'Shift the stay so it overlaps the show dates.'}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="west-face-pill-cream"
          disabled={!overlap}
          onClick={holdBoxOffice}
        >
          Hold the box office
        </button>
        <button type="button" className="west-face-pill" onClick={openRanch}>
          Open ranch calendar ({stay.checkIn}–{stay.checkOut})
        </button>
        <button type="button" className="west-face-pill" onClick={openTickets}>
          Buy tickets · same weekend
        </button>
      </div>

      {held && held.showId === show.id && (
        <p className="mt-3 font-serif text-xs text-[#b8a88a]">
          Held {held.stay.checkIn}–{held.stay.checkOut}. Ticket window does not take dates in the
          URL — pick that weekend on volcanotheatre.net. General $24 / senior $22.
        </p>
      )}
      <p className="mt-3 font-serif text-[11px] text-[#b8a88a]/80">{seam.reason}</p>
    </div>
  )
}
